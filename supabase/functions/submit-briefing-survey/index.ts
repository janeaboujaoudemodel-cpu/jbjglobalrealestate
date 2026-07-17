// Public endpoint: validates the token, records the rating, marks the token used.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supa = createClient(SUPABASE_URL, SERVICE_KEY);
  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token) throw new Error("token required");
      const { data: t } = await supa
        .from("briefing_survey_tokens")
        .select("token, recipient_role, recipient_email, recipient_name, used_at, expires_at, briefing_id, sales_rep_id, representative_id")
        .eq("token", token)
        .maybeSingle();
      if (!t) return new Response(JSON.stringify({ ok: false, error: "invalid_token" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (t.used_at) return new Response(JSON.stringify({ ok: false, error: "already_used" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (new Date(t.expires_at) < new Date()) return new Response(JSON.stringify({ ok: false, error: "expired" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: b } = await supa
        .from("briefing_requests")
        .select("id, developer_name, project_name, briefing_date")
        .eq("id", t.briefing_id)
        .maybeSingle();

      let repName: string | null = null;
      if (t.sales_rep_id) {
        const { data: r } = await supa.from("developer_sales_reps").select("full_name").eq("id", t.sales_rep_id).maybeSingle();
        repName = r?.full_name ?? null;
      } else if (t.representative_id) {
        const { data: r } = await supa.from("developer_representatives").select("full_name").eq("id", t.representative_id).maybeSingle();
        repName = r?.full_name ?? null;
      }

      return new Response(JSON.stringify({ ok: true, token: t, briefing: b, rep_name: repName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const { token, rating, feedback } = await req.json();
      if (!token) throw new Error("token required");
      const r = Number(rating);
      if (!Number.isFinite(r) || r < 1 || r > 5) throw new Error("rating must be 1-5");

      const { data: t } = await supa
        .from("briefing_survey_tokens")
        .select("*")
        .eq("token", token)
        .maybeSingle();
      if (!t) throw new Error("invalid_token");
      if (t.used_at) throw new Error("already_used");
      if (new Date(t.expires_at) < new Date()) throw new Error("expired");

      // Resolve developer_id via briefing
      const { data: b } = await supa
        .from("briefing_requests")
        .select("developer_name")
        .eq("id", t.briefing_id)
        .maybeSingle();
      let developer_id: string | null = null;
      if (b?.developer_name) {
        const { data: dev } = await supa.from("developers").select("id").eq("name", b.developer_name).maybeSingle();
        developer_id = dev?.id ?? null;
      }

      const { error: iErr } = await supa.from("briefing_rep_ratings").insert({
        briefing_id: t.briefing_id,
        sales_rep_id: t.sales_rep_id,
        representative_id: t.representative_id,
        developer_id,
        rater_role: t.recipient_role,
        rater_name: t.recipient_name,
        rater_email: t.recipient_email,
        rating: r,
        feedback: (feedback || "").toString().slice(0, 2000) || null,
        source: "email_survey",
        is_visible: true,
      });
      if (iErr) throw iErr;

      await supa.from("briefing_survey_tokens").update({ used_at: new Date().toISOString() }).eq("token", token);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("method not allowed", { status: 405, headers: corsHeaders });
  } catch (e: any) {
    console.error("submit-briefing-survey", e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
