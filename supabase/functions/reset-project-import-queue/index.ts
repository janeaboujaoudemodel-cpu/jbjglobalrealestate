import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Reset Project Import Queue
 * Deletes ALL rows from pending_project_imports except already-approved ones.
 * This prevents duplicates across repeated discovery/sync runs.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { preserveApproved = true } = await req.json().catch(() => ({}));

    console.log(`[ResetQueue] Starting (preserveApproved=${preserveApproved})...`);

    // IMPORTANT: do NOT return deleted rows (can be very slow for 1k+ records).
    // We only request a count.
    const query = preserveApproved
      ? supabase
          .from("pending_project_imports")
          .delete({ count: "exact" })
          .neq("status", "approved")
      : supabase.from("pending_project_imports").delete({ count: "exact" });

    const { error: deleteErr, count } = await query;

    if (deleteErr) {
      console.error("[ResetQueue] Delete error:", deleteErr);
      return new Response(JSON.stringify({ success: false, error: deleteErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deleted = count ?? 0;
    console.log(`[ResetQueue] Deleted ${deleted} rows (count)`);

    return new Response(
      JSON.stringify({ success: true, deleted, preserveApproved }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[ResetQueue] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
