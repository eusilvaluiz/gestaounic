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

  // Log raw payload for debugging
  console.log("[webhook] raw payload:", JSON.stringify(payload));
  console.log("[webhook] headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));

  // Auth — token is OPTIONAL. If UNIC_WEBHOOK_TOKEN is set AND broker sends a token,
  // they must match. If broker sends nothing, we accept (broker UI doesn't allow auth headers).
  const expected = Deno.env.get("UNIC_WEBHOOK_TOKEN");
  const token = readToken(req, payload);
  if (expected && token && token !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  // Accept event under multiple keys and normalize Portuguese names
  const rawEvent = String(
    payload?.event ?? payload?.evento ?? payload?.type ?? payload?.tipo ?? payload?.action ?? ""
  ).toLowerCase().trim();

  const eventMap: Record<string, EventType> = {
    "paid_withdrawal": "withdrawal",
    "paid withdrawal": "withdrawal",
    "withdrawal_paid": "withdrawal",
    "saque_pago": "withdrawal",
    "new_signup": "cadastro",
    "signup_created": "cadastro",
    "first_deposit_paid": "ftd",
    "primeiro_deposito_pago": "ftd",
    "deposit_paid": "deposit",
    "deposito_pago": "deposit",
    "cadastro": "cadastro",
    "cadastro efetuado": "cadastro",
    "cadastro_efetuado": "cadastro",
    "register": "cadastro",
    "signup": "cadastro",
    "ftd": "ftd",
    "primeiro deposito": "ftd",
    "primeiro depósito": "ftd",
    "primeiro deposito pago": "ftd",
    "primeiro depósito pago": "ftd",
    "primeiro_deposito_pago": "ftd",
    "first_deposit": "ftd",
    "deposit": "deposit",
    "deposito": "deposit",
    "depósito": "deposit",
    "deposito pago": "deposit",
    "depósito pago": "deposit",
    "deposito_pago": "deposit",
    "withdrawal": "withdrawal",
    "withdraw": "withdrawal",
    "saque": "withdrawal",
    "saque pago": "withdrawal",
    "saque_pago": "withdrawal",
  };

  const event = eventMap[rawEvent];
  if (!event) {
    console.warn("[webhook] unknown event:", rawEvent, "payload:", payload);
    return json({ error: `Unknown event: "${rawEvent}"`, received: payload }, 400);
  }

  // Nested objects from Unic Broker (withdrawal/deposit/user)
  const wd = payload?.withdrawal ?? {};
  const dp = payload?.deposit ?? {};

  // Try multiple amount field names (incl. BR "1.234,56" format and nested objects)
  const parseBRNumber = (v: unknown): number => {
    if (typeof v === "number") return v;
    if (typeof v !== "string") return NaN;
    const s = v.trim();
    if (!s) return NaN;
    // "1.234,56" -> "1234.56"; "1234.56" stays; "400,00" -> "400.00"
    const normalized = s.includes(",")
      ? s.replace(/\./g, "").replace(",", ".")
      : s;
    return Number(normalized);
  };

  const rawAmount =
    payload?.amount ?? payload?.valor ?? payload?.value ?? payload?.quantia ??
    wd?.amount ?? dp?.amount ?? 0;
  const amount = parseBRNumber(rawAmount);
  if (event !== "cadastro" && (!Number.isFinite(amount) || amount < 0)) {
    return json({ error: "Invalid amount", rawAmount }, 400);
  }

  // For withdrawals: use the REQUEST date (not payment date) so the value
  // is recorded in the day the customer asked for it.
  // Unic sends withdrawal.date = request date, withdrawal.payment_date = payment date.
  const withdrawalRequestDate =
    wd?.date ??
    payload?.requested_at ??
    payload?.request_date ??
    payload?.data_solicitacao ??
    payload?.solicitado_em ??
    payload?.data_solicitada ??
    payload?.requested_date ??
    payload?.created_at ??
    payload?.criado_em;

  const dateInput =
    event === "withdrawal"
      ? (withdrawalRequestDate ?? payload?.date)
      : (dp?.date ?? payload?.date);

  const date = normalizeDate(typeof dateInput === "string" ? dateInput : undefined);


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
