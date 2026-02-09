import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * VAPI Call Logs Retention Cleanup
 * 
 * This edge function enforces the 30-day data retention policy for VAPI call logs.
 * It should be called daily via a scheduled job or cron trigger.
 * 
 * Security: Uses service role to bypass RLS for cleanup operations.
 * All deletions are logged to audit_logs table.
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client for cleanup operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Check authorization - only allow service role or admin calls
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader !== `Bearer ${serviceRoleKey}`) {
      // Verify the caller has admin/owner role
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Check if user has owner role
      const { data: roleCheck } = await supabase.rpc("has_role", { 
        user_id: user.id, 
        role: "owner" 
      });
      
      if (!roleCheck) {
        return new Response(
          JSON.stringify({ error: "Insufficient permissions" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Run the cleanup function
    const { data: deletedCount, error: cleanupError } = await supabase.rpc(
      "cleanup_expired_vapi_calls"
    );

    if (cleanupError) {
      console.error("Cleanup error:", cleanupError);
      return new Response(
        JSON.stringify({ error: cleanupError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Plaintext columns have been removed - now we only have encrypted columns
    // The check for unencrypted records is no longer needed
    // All PII access now goes through the secure RPC function

    // Log the cleanup run
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] VAPI retention cleanup: deleted ${deletedCount || 0} expired records`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted_count: deletedCount || 0,
        timestamp,
        message: deletedCount > 0 
          ? `Cleaned up ${deletedCount} expired VAPI call records`
          : "No expired records to clean up"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Retention cleanup error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
