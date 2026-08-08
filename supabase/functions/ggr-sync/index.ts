import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// pt-BR number: "2.078,13" / "-1.234,5" -> number
function parseBRNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return NaN;
  const s = v.trim();
  if (!s) return NaN;
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  return Number(normalized);
}

function isoTodaySP(): string {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// YYYY-MM-DD -> dd/MM/yy (format used in daily_data.data)
function isoToBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = Deno.env.get("BROKER_ADMIN_TOKEN");
  if (!token) return json({ error: "BROKER_ADMIN_TOKEN não configurado" }, 500);

  const url = new URL(req.url);
  let bodyDate: string | undefined;
  if (req.method === "POST") {
    try {
      const body = await req.json();
      bodyDate = typeof body?.date === "string" ? body.date : undefined;
    } catch {
      // no body
    }
  }
  const iso = (url.searchParams.get("date") ?? bodyDate ?? isoTodaySP()).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return json({ error: "Data inválida (use YYYY-MM-DD)" }, 400);

  const apiUrl =
    `https://trade.3xbroker.com/api/balance?currency=&country_code=` +
    `&token=${encodeURIComponent(token)}&date=${iso}&enddate=${iso}`;

  let payload: any;
  try {
    const res = await fetch(apiUrl, { headers: { Accept: "application/json" } });
    if (res.status === 401 || res.status === 403) {
      return json({ error: "Token do painel da 3X expirado ou inválido" }, 502);
    }
    if (!res.ok) {
      return json({ error: `API da 3X retornou ${res.status}` }, 502);
    }
    payload = await res.json();
  } catch (e) {
    console.error("[ggr-sync] fetch error:", e);
    return json({ error: "Falha ao consultar a API da 3X" }, 502);
  }

  const rawGgr = payload?.real_total ?? payload?.total;
  const ggrOriginal = parseBRNumber(rawGgr);
  if (!Number.isFinite(ggrOriginal)) {
    console.error("[ggr-sync] unexpected payload:", JSON.stringify(payload).slice(0, 1000));
    return json({ error: "Não foi possível ler o GGR na resposta da 3X", received: payload }, 502);
  }

  const apiCurrency = String(payload?.site_currency?.short_name ?? "USD").toUpperCase().trim();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: settings } = await supabase
    .from("broker_settings")
    .select("usd_rate")
    .eq("broker", "3x")
    .maybeSingle();

  const usdRate = Number(settings?.usd_rate ?? 5.3) || 5.3;
  const rate = apiCurrency === "BRL" ? 1 : usdRate;
  const ggr = Number((ggrOriginal * rate).toFixed(2));

  const date = isoToBR(iso);

  // Find or create the row for that date
  const { data: existing, error: fetchErr } = await supabase
    .from("daily_data")
    .select("id")
    .eq("data", date)
    .maybeSingle();

  if (fetchErr) {
    console.error("[ggr-sync] fetch row error:", fetchErr);
    return json({ error: "Erro ao buscar a linha do dia", details: fetchErr.message }, 500);
  }

  let rowId = existing?.id as string | undefined;
  if (!rowId) {
    const { data: maxRow } = await supabase
      .from("daily_data")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sort_order = (maxRow?.sort_order ?? 0) + 1;

    const { data: inserted, error: insertErr } = await supabase
      .from("daily_data")
      .insert({ data: date, sort_order })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[ggr-sync] insert row error:", insertErr);
      return json({ error: "Erro ao criar a linha do dia", details: insertErr.message }, 500);
    }
    rowId = inserted.id;
  }

  const { error: updErr } = await supabase
    .from("daily_data")
    .update({ rev10: ggr })
    .eq("id", rowId);

  if (updErr) {
    console.error("[ggr-sync] update error:", updErr);
    return json({ error: "Erro ao gravar o GGR", details: updErr.message }, 500);
  }

  console.log(`[ggr-sync] ${date}: GGR ${apiCurrency} ${ggrOriginal} x ${rate} = R$ ${ggr}`);
  return json({
    ok: true,
    date,
    ggr,
    original: ggrOriginal,
    currency: apiCurrency,
    rate,
    entries: payload?.real_entries ?? null,
    rewards: payload?.real_rewards ?? null,
    bets: payload?.real_qtd_bets ?? null,
  });
});
