// RLS Proof: Anonymous access test for vapi_call_logs
// Uses ONLY anon key - NO service role, NO Authorization header
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Test 1: Attempt INSERT (should fail with RLS)
    const insertResult = await supabase
      .from("vapi_call_logs")
      .insert({ call_id: "anon-rls-proof-test" })
      .select("id")
      .single();

    // Test 2: Attempt SELECT (should fail or return 0 rows)
    const selectResult = await supabase
      .from("vapi_call_logs")
      .select("id, call_id")
      .limit(5);

    return new Response(
      JSON.stringify({
        test: "vapi_call_logs anonymous RLS proof",
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
