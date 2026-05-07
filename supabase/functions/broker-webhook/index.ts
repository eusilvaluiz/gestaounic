import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function readToken(req: Request, payload?: Record<string, unknown>): string {
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
  const authToken = auth.replace(/^Bearer\s+/i, "").trim();

  const headerCandidates = [
    authToken,
    req.headers.get("x-webhook-token"),
    req.headers.get("x-api-key"),
    req.headers.get("x-auth-token"),
    req.headers.get("x-token"),
    req.headers.get("api-key"),
    req.headers.get("token"),
    req.headers.get("webhook-token"),
  ];

  const queryCandidates = [
    url.searchParams.get("token"),
    url.searchParams.get("key"),
    url.searchParams.get("api_key"),
    url.searchParams.get("webhook_token"),
  ];

  const bodyCandidates = payload
    ? [
        payload.token,
        payload.key,
        payload.api_key,
        payload.webhook_token,
        payload.secret,
      ]
    : [];

  return [...headerCandidates, ...queryCandidates, ...bodyCandidates]
    .map((value) => String(value ?? "").trim())
    .find(Boolean) ?? "";
}

type EventType = "cadastro" | "ftd" | "deposit" | "withdrawal";

function todayBR(): string {
  // dd/MM/yy in São Paulo timezone, matching the format used in daily_data.data
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  return fmt.format(new Date());
}

function normalizeDate(input?: string): string {
  if (!input) return todayBR();
  // Accept ISO (YYYY-MM-DD) or dd/MM/yy or dd/MM/yyyy
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
  if (iso) {
    const [, y, m, d] = iso;
    return `${d}/${m}/${y.slice(2)}`;
  }
  const br = /^(\d{2})\/(\d{2})\/(\d{2,4})$/.exec(input);
  if (br) {
    const [, d, m, y] = br;
    return `${d}/${m}/${y.slice(-2)}`;
  }
  return todayBR();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Parse body
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Auth
  const expected = Deno.env.get("UNIC_WEBHOOK_TOKEN");
  if (!expected) return json({ error: "Server misconfigured" }, 500);

  const token = readToken(req, payload);
  if (token !== expected) return json({ error: "Unauthorized" }, 401);

  const event = String(payload?.event ?? "").toLowerCase() as EventType;
  const allowed: EventType[] = ["cadastro", "ftd", "deposit", "withdrawal"];
  if (!allowed.includes(event)) {
    return json({ error: `Invalid event. Allowed: ${allowed.join(", ")}` }, 400);
  }

  const amount = Number(payload?.amount ?? 0);
  if (event !== "cadastro" && (!Number.isFinite(amount) || amount < 0)) {
    return json({ error: "Invalid amount" }, 400);
  }

  const date = normalizeDate(payload?.date);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find or create row for that date
  const { data: existing, error: fetchErr } = await supabase
    .from("daily_data")
    .select("*")
    .eq("data", date)
    .maybeSingle();

  if (fetchErr) {
    console.error("fetch error:", fetchErr);
    return json({ error: "DB fetch error", details: fetchErr.message }, 500);
  }

  let row = existing;
  if (!row) {
    // Get next sort_order
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
      .select()
      .single();

    if (insertErr) {
      console.error("insert error:", insertErr);
      return json({ error: "DB insert error", details: insertErr.message }, 500);
    }
    row = inserted;
  }

  // Build update
  const updates: Record<string, number> = {};
  switch (event) {
    case "cadastro":
      updates.cadastros = (row.cadastros ?? 0) + 1;
      break;
    case "ftd":
      updates.ftd = (row.ftd ?? 0) + 1;
      updates.valor_ftd = Number(row.valor_ftd ?? 0) + amount;
      break;
    case "deposit": {
      updates.depositos = (row.depositos ?? 0) + 1;
      const newValor = Number(row.valor_depositos ?? 0) + amount;
      updates.valor_depositos = Number(newValor.toFixed(2));
      updates.taxa = Number((newValor * 0.07).toFixed(2));
      updates.expert = Number((newValor * 0.03).toFixed(2));
      break;
    }
    case "withdrawal":
      updates.saque = Number((Number(row.saque ?? 0) + amount).toFixed(2));
      break;
  }

  const { error: updErr } = await supabase
    .from("daily_data")
    .update(updates)
    .eq("id", row.id);

  if (updErr) {
    console.error("update error:", updErr);
    return json({ error: "DB update error", details: updErr.message }, 500);
  }

  console.log(`[webhook] ${event} on ${date}`, updates);
  return json({ ok: true, event, date, updates });
});
