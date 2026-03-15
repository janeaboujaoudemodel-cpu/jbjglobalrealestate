import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    // Verify owner role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle();
    if (!roleData) throw new Error("Forbidden: Owner role required");

    const { entity_type, entity_id, action, notes } = await req.json();
    if (!entity_type || !entity_id || !action) throw new Error("Missing required fields");
    if (!["approve", "reject"].includes(action)) throw new Error("Invalid action");

    const now = new Date().toISOString();

    // Update the entity's status
    if (entity_type === "developer_registration") {
      const newStatus = action === "approve" ? "approved" : "rejected";
      await supabase.from("developer_registrations").update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: now,
        admin_notes: notes || null,
        updated_at: now,
      }).eq("id", entity_id);
    } else if (entity_type === "launch_event") {
      const newStatus = action === "approve" ? "approved" : "rejected";
      await supabase.from("launch_events").update({
        approval_status: newStatus,
        approved_by: user.id,
        approved_at: now,
        admin_notes: notes || null,
        updated_at: now,
      }).eq("id", entity_id);
    }

    // Update approval workflow stages
    await supabase.from("approval_workflows").update({
      status: action === "approve" ? "approved" : "rejected",
      decided_by: user.id,
      decided_at: now,
      notes: notes || null,
      updated_at: now,
    }).eq("entity_type", entity_type).eq("entity_id", entity_id).eq("status", "pending").order("stage", { ascending: true }).limit(1);

    return new Response(JSON.stringify({ success: true, action, entity_type, entity_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: error.message === "Unauthorized" ? 401 : error.message?.includes("Forbidden") ? 403 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
