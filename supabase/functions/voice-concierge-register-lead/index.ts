import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INTERESTS = new Set(["investing", "partnering", "careers", "other"]);
const INVESTMENT_TYPES = new Set(["off_plan", "secondary"]);

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return bad("Method not allowed", 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  const full_name = String(body.full_name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const nationality = String(body.nationality ?? "").trim();
  const phone_country_code = String(body.phone_country_code ?? "").trim();
  const phone_number = String(body.phone_number ?? "").trim();
  const interest = String(body.interest ?? "").trim();
  const investment_type = body.investment_type ? String(body.investment_type) : null;
  const details = body.details ? String(body.details).slice(0, 1000) : null;
  const consent_marketing = !!body.consent_marketing;

  if (!full_name || full_name.length < 2) return bad("Full name required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Valid email required");
  if (!nationality) return bad("Nationality required");
  if (!/^\+\d{1,4}$/.test(phone_country_code)) return bad("Valid country code required");
  if (!/^\d{5,15}$/.test(phone_number.replace(/\D/g, ""))) return bad("Valid phone number required");
  if (!INTERESTS.has(interest)) return bad("Invalid interest");
  if (interest === "investing" && (!investment_type || !INVESTMENT_TYPES.has(investment_type))) {
    return bad("Investment type required");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Try to attach user_id if logged in
  let user_id: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data } = await supabase.auth.getUser(token);
    user_id = data?.user?.id ?? null;
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    null;
  const user_agent = req.headers.get("user-agent") ?? null;

  const { data, error } = await supabase
    .from("voice_agent_leads")
    .insert({
      user_id,
      full_name,
      email,
      nationality,
      phone_country_code,
      phone_number,
      interest,
      investment_type: interest === "investing" ? investment_type : null,
      details,
      consent_marketing,
      ip,
      user_agent,
    })
    .select("id")
    .single();

  if (error) {
    console.error("voice_agent_leads insert failed", error);
    return bad("Failed to save lead", 500);
  }

  // Best-effort mirror to crm_leads
  try {
    const categoryMap: Record<string, string> = {
      investing: "investor",
      partnering: "partner",
      careers: "talent",
      other: "lead",
    };
    await supabase.from("crm_leads").insert({
      full_name,
      email,
      phone: `${phone_country_code}${phone_number}`,
      nationality,
      source: "voice_concierge",
      category: categoryMap[interest] ?? "lead",
      notes: details,
      user_id,
    });
  } catch (e) {
    console.warn("crm_leads mirror skipped:", e);
  }

  return new Response(
    JSON.stringify({ lead_id: data.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
