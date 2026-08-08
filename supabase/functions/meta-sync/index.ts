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

const API = "https://graph.facebook.com/v21.0";

function isoTodaySP(offsetDays = 0): string {
  const now = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// YYYY-MM-DD -> dd/MM/yy (formato usado em daily_data.data)
function isoToBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

type DayTotals = {
  investimento: number;
  cliques: number;
  landing_page: number;
  lead_telegram: number;
};

async function fetchAccounts(token: string) {
  const res = await fetch(
    `${API}/me/adaccounts?fields=id,name,currency,account_status&limit=500&access_token=${token}`,
  );
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.error?.message ?? `Meta retornou ${res.status}`);
  }
  return (payload?.data ?? []) as Array<{ id: string; name: string; currency: string }>;
}

async function fetchAccountInsights(
  token: string,
  accountId: string,
  since: string,
  until: string,
): Promise<Record<string, DayTotals>> {
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url =
    `${API}/${accountId}/insights?level=account&fields=spend,actions` +
    `&time_range=${timeRange}&time_increment=1&access_token=${token}`;

  const res = await fetch(url);
  const payload = await res.json();
  if (!res.ok) {
    console.warn(`[meta-sync] ${accountId}: ${payload?.error?.message ?? res.status}`);
    return {};
  }

  const perDay: Record<string, DayTotals> = {};
  for (const row of payload?.data ?? []) {
    const actions: Record<string, string> = {};
    for (const a of row?.actions ?? []) actions[a.action_type] = a.value;

    perDay[row.date_start] = {
      investimento: Number(row?.spend ?? 0) || 0,
      // Cliques no link = evento link_click (bate com o Gerenciador)
      cliques: Number(actions["link_click"] ?? 0) || 0,
      landing_page: Number(actions["landing_page_view"] ?? 0) || 0,
      // enter_channel (evento personalizado do pixel)
      lead_telegram: Number(actions["offsite_conversion.fb_pixel_custom"] ?? 0) || 0,
    };
  }
  return perDay;
}

async function upsertDay(
  supabase: ReturnType<typeof createClient>,
  iso: string,
  totals: DayTotals,
) {
  const date = isoToBR(iso);

  const { data: existing, error: fetchErr } = await supabase
    .from("daily_data")
    .select("id")
    .eq("data", date)
    .maybeSingle();

  if (fetchErr) throw new Error(`Erro ao buscar a linha ${date}: ${fetchErr.message}`);

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
    if (insertErr) throw new Error(`Erro ao criar a linha ${date}: ${insertErr.message}`);
    rowId = inserted.id as string;
  }

  const { error: updErr } = await supabase
    .from("daily_data")
    .update({
      investimento: Number(totals.investimento.toFixed(2)),
      cliques: Math.round(totals.cliques),
      landing_page: Math.round(totals.landing_page),
      lead_telegram: Math.round(totals.lead_telegram),
    })
    .eq("id", rowId);

  if (updErr) throw new Error(`Erro ao gravar ${date}: ${updErr.message}`);

  console.log(
    `[meta-sync] ${date}: investimento=${totals.investimento} cliques=${totals.cliques} ` +
      `lp=${totals.landing_page} lead=${totals.lead_telegram}`,
  );
  return { date, ...totals };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = Deno.env.get("META_ACCESS_TOKEN");
  if (!token) return json({ error: "META_ACCESS_TOKEN não configurado" }, 500);

  const url = new URL(req.url);
  let body: any = {};
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  const since = (url.searchParams.get("since") ?? body?.since ?? isoTodaySP(-1)).slice(0, 10);
  const until = (url.searchParams.get("until") ?? body?.until ?? isoTodaySP()).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(since) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    return json({ error: "Datas inválidas (use YYYY-MM-DD)" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const accounts = await fetchAccounts(token);

    // Soma todas as contas por dia (spend vem na moeda da conta, sem conversão)
    const byDay: Record<string, DayTotals> = {};
    for (const acc of accounts) {
      const perDay = await fetchAccountInsights(token, acc.id, since, until);
      for (const [iso, t] of Object.entries(perDay)) {
        const cur = byDay[iso] ?? {
          investimento: 0,
          cliques: 0,
          landing_page: 0,
          lead_telegram: 0,
        };
        cur.investimento += t.investimento;
        cur.cliques += t.cliques;
        cur.landing_page += t.landing_page;
        cur.lead_telegram += t.lead_telegram;
        byDay[iso] = cur;
      }
    }

    const results = [];
    for (const iso of Object.keys(byDay).sort()) {
      results.push(await upsertDay(supabase, iso, byDay[iso]));
    }

    return json({ ok: true, accounts: accounts.length, since, until, results });
  } catch (e) {
    console.error("[meta-sync] erro:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 502);
  }
});
