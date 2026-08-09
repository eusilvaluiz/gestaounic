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

function isoTodaySP(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86400000);
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// YYYY-MM-DD -> dd/MM/yy (format used in daily_data.data)
function isoToBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

type SyncResult = {
  date: string;
  ggr?: number;
  original?: number;
  currency?: string;
  rate?: number;
  error?: string;
};

async function syncDay(
  supabase: ReturnType<typeof createClient>,
  statsUrl: string,
  statsKey: string,
  iso: string,
  usdRate: number,
): Promise<SyncResult> {
  const date = isoToBR(iso);

  // Worker proxy da 3X (mantém o token admin fora daqui)
  const apiUrl =
    `${statsUrl.replace(/\/$/, "")}/balance?key=${encodeURIComponent(statsKey)}` +
    `&date=${iso}&enddate=${iso}`;

  let payload: any;
  try {
    const res = await fetch(apiUrl, { headers: { Accept: "application/json" } });
    payload = await res.json().catch(() => null);
    if (payload?.error) {
      return { date, error: `Token do painel da 3X expirado — renove via POST /set-token no Worker` };
    }
    if (!res.ok) return { date, error: `Worker da 3X retornou ${res.status}` };
  } catch (e) {
    console.error("[ggr-sync] fetch error:", e);
    return { date, error: "Falha ao consultar o Worker da 3X" };
  }

  const ggrOriginal = parseBRNumber(payload?.real_total ?? payload?.total);
  if (!Number.isFinite(ggrOriginal)) {
    console.error("[ggr-sync] unexpected payload:", JSON.stringify(payload).slice(0, 600));
    return { date, error: "Não foi possível ler o GGR na resposta da 3X" };
  }


  const apiCurrency = String(payload?.site_currency?.short_name ?? "USD").toUpperCase().trim();
  const rate = apiCurrency === "BRL" ? 1 : usdRate;
  const ggr = Number((ggrOriginal * rate).toFixed(2));

  // Find or create the row for that date
  const { data: existing, error: fetchErr } = await supabase
    .from("daily_data")
    .select("id")
    .eq("data", date)
    .maybeSingle();

  if (fetchErr) {
    console.error("[ggr-sync] fetch row error:", fetchErr);
    return { date, error: `Erro ao buscar a linha do dia: ${fetchErr.message}` };
  }

  let rowId = existing?.id as string | undefined;
  if (!rowId) {
    const { data: maxRow } = await supabase
      .from("daily_data")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sort_order = ((maxRow?.sort_order as number) ?? 0) + 1;

    const { data: inserted, error: insertErr } = await supabase
      .from("daily_data")
      .insert({ data: date, sort_order })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[ggr-sync] insert row error:", insertErr);
      return { date, error: `Erro ao criar a linha do dia: ${insertErr.message}` };
    }
    rowId = inserted.id as string;
  }

  const { error: updErr } = await supabase
    .from("daily_data")
    .update({ rev10: ggr })
    .eq("id", rowId);

  if (updErr) {
    console.error("[ggr-sync] update error:", updErr);
    return { date, error: `Erro ao gravar o GGR: ${updErr.message}` };
  }

  console.log(`[ggr-sync] ${date}: GGR ${apiCurrency} ${ggrOriginal} x ${rate} = R$ ${ggr}`);
  return { date, ggr, original: ggrOriginal, currency: apiCurrency, rate };
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

  const explicit = (url.searchParams.get("date") ?? bodyDate)?.slice(0, 10);
  if (explicit && !/^\d{4}-\d{2}-\d{2}$/.test(explicit)) {
    return json({ error: "Data inválida (use YYYY-MM-DD)" }, 400);
  }

  // Sem data explícita: sincroniza hoje E ontem (garante o fechamento das últimas horas do dia anterior)
  const dates = explicit ? [explicit] : [isoTodaySP(), isoTodaySP(-1)];

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

  const results: SyncResult[] = [];
  for (const iso of dates) {
    results.push(await syncDay(supabase, token, iso, usdRate));
  }

  const failed = results.filter((r) => r.error);
  return json({ ok: failed.length === 0, results }, failed.length === results.length ? 502 : 200);
});
