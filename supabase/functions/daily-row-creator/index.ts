import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function todayBR(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const date = todayBR();

  // Skip if row already exists
  const { data: existing } = await supabase
    .from("daily_data")
    .select("id")
    .eq("data", date)
    .maybeSingle();

  if (existing) {
    console.log(`[daily-row-creator] row for ${date} already exists, skipping`);
    return new Response(
      JSON.stringify({ ok: true, skipped: true, date }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Get next sort_order
  const { data: maxRow } = await supabase
    .from("daily_data")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  const { data: inserted, error } = await supabase
    .from("daily_data")
    .insert({ data: date, sort_order })
    .select()
    .single();

  if (error) {
    console.error("[daily-row-creator] insert error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  console.log(`[daily-row-creator] created row for ${date}`);
  return new Response(
    JSON.stringify({ ok: true, created: true, date, id: inserted.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
