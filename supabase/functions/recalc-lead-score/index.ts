// Edge function: recalc-lead-score
// Recomputes lead_score (0-100) and lead_score_band (Hot/Warm/Cold) for one or many leads
// based on data completeness + recent activity signals.
//
// Body: { lead_ids?: string[]; user_id?: string; all?: boolean }
// - lead_ids: explicit list (preferred)
// - user_id + all=true: recalc all leads owned by this user
// Auth: requires authenticated JWT; only the lead owner OR an admin/owner role may recalc.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RecalcBody {
  lead_ids?: string[];
  user_id?: string;
  all?: boolean;
}

const COMPLETENESS_FIELDS: (keyof any)[] = [
  "full_name",
  "phone_e164",
  "whatsapp_e164",
  "email_lower",
  "nationality",
  "country_of_residence",
  "preferred_language",
  "budget_min",
  "budget_max",
  "preferred_location",
  "preferred_project",
  "property_type",
  "bedroom_requirement",
  "buying_purpose",
  "lead_type",
  "source",
];

function bandFor(score: number): "hot" | "warm" | "cold" {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

function daysSince(iso?: string | null): number {
  if (!iso) return 9999;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function scoreLead(lead: any, activityCount: number, lastActivityAt: string | null): number {
  // Completeness (0-40)
  const filled = COMPLETENESS_FIELDS.reduce((acc, f) => acc + (lead[f] != null && lead[f] !== "" ? 1 : 0), 0);
  const completeness = Math.round((filled / COMPLETENESS_FIELDS.length) * 40);

  // Recency (0-30): touched within last 3d → 30, 7d → 22, 14d → 14, 30d → 7, else 0
  const d = daysSince(lastActivityAt || lead.last_contacted_at);
  const recency = d <= 3 ? 30 : d <= 7 ? 22 : d <= 14 ? 14 : d <= 30 ? 7 : 0;

  // Engagement (0-20): activity_count cap
  const engagement = Math.min(20, activityCount * 2);

  // Priority/intent boost (0-10)
  let intent = 0;
  if (lead.priority === "high") intent += 4;
  if (lead.priority === "urgent") intent += 8;
  if (lead.buying_purpose === "primary_residence") intent += 2;
  if (lead.budget_max && Number(lead.budget_max) >= 1_000_000) intent += 2;
  intent = Math.min(10, intent);

  return Math.min(100, completeness + recency + engagement + intent);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = (await req.json().catch(() => ({}))) as RecalcBody;
    const admin = createClient(supabaseUrl, serviceKey);

    let query = admin.from("crm_leads").select("*").eq("owner_user_id", userId);
    if (body.lead_ids?.length) query = query.in("id", body.lead_ids);
    else if (!body.all) {
      return new Response(JSON.stringify({ error: "lead_ids or all=true required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: leads, error: leadsErr } = await query.limit(2000);
    if (leadsErr) throw leadsErr;

    const updates: Array<{ id: string; lead_score: number; lead_score_band: string }> = [];

    for (const lead of leads ?? []) {
      // Pull recent activity counts for the last 30 days
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const { data: acts } = await admin
        .from("crm_activities")
        .select("id, created_at")
        .eq("lead_id", lead.id)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50);

      const lastActivityAt = acts?.[0]?.created_at ?? null;
      const score = scoreLead(lead, acts?.length ?? 0, lastActivityAt);
      const band = bandFor(score);

      updates.push({ id: lead.id, lead_score: score, lead_score_band: band });
    }

    // Batch update
    for (const u of updates) {
      await admin
        .from("crm_leads")
        .update({ lead_score: u.lead_score, lead_score_band: u.lead_score_band })
        .eq("id", u.id);
    }

    return new Response(
      JSON.stringify({ ok: true, count: updates.length, updates }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
