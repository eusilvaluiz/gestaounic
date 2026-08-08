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

const BASE = "https://meta.agentezapp.com/tracker/api";

function isoSP(offsetDays = 0): string {
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

async function login(): Promise<string> {
  const email = Deno.env.get("ALPHA_TRACKER_EMAIL");
  const password = Deno.env.get("ALPHA_TRACKER_PASSWORD");
  if (!email || !password) throw new Error("Credenciais do Alpha Tracker não configuradas");

  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || !payload?.token) {
    throw new Error(`Login no Alpha Tracker falhou (${res.status})`);
  }
  return payload.token as string;
}

async function fetchExits(token: string, since: string, until: string): Promise<Record<string, number>> {
  const res = await fetch(`${BASE}/chart?start=${since}&end=${until}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Alpha Tracker retornou ${res.status}`);

  const perDay: Record<string, number> = {};
  for (const row of payload?.exits ?? []) {
    // date vem como 2026-08-01T03:00:00.000Z (meia-noite em SP)
    const iso = String(row?.date ?? "").slice(0, 10);
    if (!iso) continue;
    perDay[iso] = (perDay[iso] ?? 0) + (Number(row?.total ?? 0) || 0);
  }
  return perDay;
}

async function upsertDay(
  supabase: ReturnType<typeof createClient>,
  iso: string,
  exits: number,
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
    .update({ saida_telegram: Math.round(exits) })
    .eq("id", rowId);

  if (updErr) throw new Error(`Erro ao gravar ${date}: ${updErr.message}`);

  console.log(`[tracker-sync] ${date}: saida_telegram=${exits}`);
  return { date, saidaTelegram: Math.round(exits) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  let body: any = {};
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  const since = String(url.searchParams.get("since") ?? body?.since ?? isoSP(-1)).slice(0, 10);
  const until = String(url.searchParams.get("until") ?? body?.until ?? isoSP()).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(since) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    return json({ error: "Datas inválidas (use YYYY-MM-DD)" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const token = await login();
    const perDay = await fetchExits(token, since, until);

    const results = [];
    for (const iso of Object.keys(perDay).sort()) {
      results.push(await upsertDay(supabase, iso, perDay[iso]));
    }

    return json({ ok: true, since, until, results });
  } catch (e) {
    console.error("[tracker-sync] erro:", e);
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 502);
  }
});
