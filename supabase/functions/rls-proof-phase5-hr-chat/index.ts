// Phase 5 RLS Proof: hr_candidates + chat_conversations hardening verification
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function serializeError(err: any) {
  if (!err) return null;
  return {
    message: err.message,
    code: err.code,
    details: err.details,
    hint: err.hint,
    status: err.status,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth gate - caller must be authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: callerErr } = await supabaseAuth.auth.getUser();
    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized - Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const runId = crypto.randomUUID();

    // Anonymous client (no auth)
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    // ========================================
    // TEST 1: hr_candidates - Anon access blocked
    // ========================================

    // 1A: Anon SELECT on hr_candidates - should get 42501
    const hrAnonSelect = await anonClient
      .from("hr_candidates")
      .select("id, candidate_name, email")
      .limit(1);

    // 1B: Anon INSERT on hr_candidates - should get 42501
    const hrAnonInsert = await anonClient
      .from("hr_candidates")
      .insert({
        user_id: caller.id,
        candidate_name: "Anon Test",
        email: `anon-test-${runId}@example.com`,
        position_applied: "Test Position",
        status: "new",
      })
      .select("id")
      .single();

    // ========================================
    // TEST 2: chat_conversations - Anon INSERT allowed, SELECT blocked
    // ========================================

    // 2A: Anon SELECT on chat_conversations - should get 42501 (no SELECT privilege)
    const chatAnonSelect = await anonClient
      .from("chat_conversations")
      .select("id, user_email, messages")
      .limit(1);

    // 2B: Anon INSERT on chat_conversations - should succeed (widget use case)
    // Note: Cannot use .select() after insert because anon has no SELECT privilege
    // This is correct behavior - we insert blind and verify via service role
    const chatAnonInsertResult = await anonClient
      .from("chat_conversations")
      .insert({
        user_email: `widget-test-${runId}@example.com`,
        messages: [{ role: "user", content: "Test message from widget" }],
        status: "open",
        user_id: null, // Must be null for anon insert per policy
      });

    // Verify the insert worked by checking with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const verifyInsert = await supabaseAdmin
      .from("chat_conversations")
      .select("id, user_email")
      .eq("user_email", `widget-test-${runId}@example.com`)
      .single();

    const insertedChatId = verifyInsert?.data?.id ?? null;
    
    const chatAnonInsert = {
      data: verifyInsert?.data ?? null,
      error: chatAnonInsertResult?.error ?? null,
      insertSucceeded: !chatAnonInsertResult?.error && verifyInsert?.data !== null,
    };

    // 2C: Anon UPDATE on chat_conversations - should get 42501 (no UPDATE privilege)
    const chatAnonUpdate = insertedChatId
      ? await anonClient
          .from("chat_conversations")
          .update({ status: "closed" })
          .eq("id", insertedChatId)
          .select("id")
          .single()
      : { data: null, error: { message: "No chat inserted to update" } };

    // 2D: Anon DELETE on chat_conversations - should get 42501 (no DELETE privilege)
    const chatAnonDelete = insertedChatId
      ? await anonClient
          .from("chat_conversations")
          .delete()
          .eq("id", insertedChatId)
          .select("id")
          .single()
      : { data: null, error: { message: "No chat inserted to delete" } };

    // Cleanup: Use service role to delete test data
    if (insertedChatId) {
      await supabaseAdmin.from("chat_conversations").delete().eq("id", insertedChatId);
    }

    return new Response(
      JSON.stringify(
        {
          runId,
          caller: { id: caller.id },
          tests: {
            hr_candidates: {
              "1A_anon_select": {
                data: hrAnonSelect?.data ?? null,
                error: serializeError(hrAnonSelect?.error),
                expected: "42501 permission denied",
              },
              "1B_anon_insert": {
                data: hrAnonInsert?.data ?? null,
                error: serializeError(hrAnonInsert?.error),
                expected: "42501 permission denied",
              },
            },
            chat_conversations: {
              "2A_anon_select": {
                data: chatAnonSelect?.data ?? null,
                error: serializeError(chatAnonSelect?.error),
                expected: "42501 permission denied (no SELECT privilege)",
              },
              "2B_anon_insert": {
                data: chatAnonInsert?.data ?? null,
                error: serializeError(chatAnonInsert?.error),
                insertSucceeded: chatAnonInsert?.insertSucceeded ?? false,
                expected: "Success (widget use case) - insertSucceeded should be true",
              },
              "2C_anon_update": {
                data: chatAnonUpdate?.data ?? null,
                error: serializeError(chatAnonUpdate?.error),
                expected: "42501 permission denied (no UPDATE privilege)",
              },
              "2D_anon_delete": {
                data: chatAnonDelete?.data ?? null,
                error: serializeError(chatAnonDelete?.error),
                expected: "42501 permission denied (no DELETE privilege)",
              },
            },
          },
        },
        null,
        2
      ),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
