import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check CRM role
    const { data: profile } = await supabase
      .from("crm_users_profile")
      .select("crm_role")
      .eq("user_id", userData.user.id)
      .single();

    if (!profile || !["owner_admin", "founder"].includes(profile.crm_role)) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch leads
    const { data: leads } = await supabase
      .from("crm_leads")
      .select("id, full_name, nationality, preferred_language, source, tags, created_at, pipeline_stage, ai_score")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500);

    if (!leads || leads.length === 0) {
      return new Response(JSON.stringify({ error: "No leads to export" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log export
    await supabase.from("audit_logs").insert({
      user_id: userData.user.id,
      user_email: userData.user.email,
      action_type: "export",
      resource_type: "lead",
      description: `Generated CRM PDF report with ${leads.length} leads`,
      details: { count: leads.length, format: "pdf" },
    });

    // Group leads by pipeline_stage
    const grouped: Record<string, typeof leads> = {};
    for (const lead of leads) {
      const stage = lead.pipeline_stage || "new";
      if (!grouped[stage]) grouped[stage] = [];
      grouped[stage].push(lead);
    }

    const now = new Date().toISOString();
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    // Build a simple PDF manually (no external lib needed — using basic PDF spec)
    // For simplicity, we'll return structured data that the client can render with jsPDF
    // which is already installed on the frontend
    const reportData = {
      title: "JBJ Global Real Estate — CRM Report",
      subtitle: `Generated on ${dateStr}`,
      totalLeads: leads.length,
      groupedByStage: Object.entries(grouped).map(([stage, stageLeads]) => ({
        stage: stage.replace(/_/g, " ").toUpperCase(),
        count: stageLeads.length,
        leads: stageLeads.map((l) => ({
          name: l.full_name || "Unknown",
          nationality: l.nationality || "-",
          language: l.preferred_language || "-",
          source: l.source || "-",
          stage: l.pipeline_stage || "new",
          score: l.ai_score || 0,
          created: l.created_at ? new Date(l.created_at).toLocaleDateString() : "-",
        })),
      })),
      timestamp: now,
      generatedBy: userData.user.email,
    };

    // Generate a text-based PDF content using basic structure
    // The client has jspdf installed, so we return JSON for client-side PDF generation
    return new Response(JSON.stringify({ report: reportData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Report generation error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
