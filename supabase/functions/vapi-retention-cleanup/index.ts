import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Also check for any unencrypted records that slipped through
    const { data: unencryptedCheck, error: checkError } = await supabase
      .from("vapi_call_logs")
      .select("id")
      .or("extracted_name.neq.***PROTECTED***,extracted_phone.neq.***PROTECTED***,extracted_email.neq.***PROTECTED***")
      .not("extracted_name", "is", null)
      .limit(10);

    const unencryptedCount = unencryptedCheck?.length || 0;

    // Log the cleanup run
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] VAPI retention cleanup: deleted ${deletedCount || 0} expired records`);
    
    if (unencryptedCount > 0) {
      console.warn(`[${timestamp}] WARNING: Found ${unencryptedCount} unencrypted records`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted_count: deletedCount || 0,
        unencrypted_count: unencryptedCount,
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
