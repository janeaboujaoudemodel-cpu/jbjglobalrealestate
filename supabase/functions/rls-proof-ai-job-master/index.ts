/**
 * RLS Proof: Anonymous access test for ai_job_master
 * Uses ONLY anon key - NO service role, NO Authorization header
 * This proves RLS blocks anonymous access
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with ONLY anon key - simulates anonymous user
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    // Test 1: Attempt INSERT (should fail with RLS - 42501 or similar)
    const insertResult = await supabase
      .from("ai_job_master")
      .insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        tool_name: "anon-rls-test",
        input_payload: {},
      })
      .select("id")
      .single();

    // Test 2: Attempt SELECT (should fail or return 0 rows)
    const selectResult = await supabase
      .from("ai_job_master")
      .select("id, user_id, tool_name")
      .limit(5);

    return new Response(
      JSON.stringify({
        test: "ai_job_master anonymous RLS proof",
        insert_test: {
          data: insertResult.data,
          error: insertResult.error
            ? {
                message: insertResult.error.message,
                code: insertResult.error.code,
                details: insertResult.error.details,
                hint: insertResult.error.hint,
              }
            : null,
        },
        select_test: {
          data: selectResult.data,
          count: selectResult.data?.length ?? 0,
          error: selectResult.error
            ? {
                message: selectResult.error.message,
                code: selectResult.error.code,
                details: selectResult.error.details,
                hint: selectResult.error.hint,
              }
            : null,
        },
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
