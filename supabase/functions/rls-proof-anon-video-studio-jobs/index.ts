// RLS Proof: video_studio_jobs - anon blocked + cross-user isolation
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
      return new Response(JSON.stringify({ error: "Unauthorized - Missing auth token" }), {
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

    // Admin client (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Anon client (no auth)
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const runId = crypto.randomUUID();

    // ========================================
    // TEST 1: Anon SELECT -> must fail with 42501
    // ========================================
    const anonSelectRes = await supabaseAnon
      .from("video_studio_jobs")
      .select("id")
      .limit(1);

    // ========================================
    // TEST 2: Anon INSERT -> must fail with 42501
    // Correct payload based on actual schema:
    // id (uuid, default), session_id (text, NOT NULL), user_id (uuid, NOT NULL),
    // project_name (text, default), project_data (jsonb, default)
    // ========================================
    const anonInsertRes = await supabaseAnon
      .from("video_studio_jobs")
      .insert({
        session_id: `anon-test-${runId}`,
        user_id: crypto.randomUUID(),
        project_name: "Anon Test Project",
        project_data: { test: true },
      })
      .select("id")
      .single();

    // ========================================
    // Create two ephemeral test users
    // ========================================
    const password = `Tmp!${crypto.randomUUID()}Aa1`;
    const emailA = `proof-a-${runId}@example.com`;
    const emailB = `proof-b-${runId}@example.com`;

    const { data: createdA, error: createAErr } = await supabaseAdmin.auth.admin.createUser({
      email: emailA,
      password,
      email_confirm: true,
    });

    const { data: createdB, error: createBErr } = await supabaseAdmin.auth.admin.createUser({
      email: emailB,
      password,
      email_confirm: true,
    });

    const userAId = createdA?.user?.id ?? null;
    const userBId = createdB?.user?.id ?? null;

    // Sign in to get real JWTs
    const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data: signInA, error: signInAErr } = await supabasePublic.auth.signInWithPassword({
      email: emailA,
      password,
    });

    const { data: signInB, error: signInBErr } = await supabasePublic.auth.signInWithPassword({
      email: emailB,
      password,
    });

    const tokenA = signInA?.session?.access_token ?? null;
    const tokenB = signInB?.session?.access_token ?? null;

    const clientA = tokenA
      ? createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${tokenA}` } },
        })
      : null;

    const clientB = tokenB
      ? createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${tokenB}` } },
        })
      : null;

    // ========================================
    // TEST 3: User A INSERT -> must succeed
    // ========================================
    const insertARes = clientA
      ? await clientA
          .from("video_studio_jobs")
          .insert({
            session_id: `userA-test-${runId}`,
            user_id: userAId,
            project_name: "User A RLS Proof Project",
            project_data: { runId, note: "RLS proof run" },
          })
          .select("id,user_id,session_id")
          .single()
      : { data: null, error: { message: "clientA not created" } };

    const jobId = insertARes?.data?.id ?? null;

    // ========================================
    // TEST 4: User A SELECT own job -> must return 1 row
    // ========================================
    const selectARes = clientA
      ? await clientA
          .from("video_studio_jobs")
          .select("id,user_id,session_id")
          .eq("id", jobId)
      : { data: null, error: { message: "clientA not created" } };

    // ========================================
    // TEST 5: User B SELECT -> must return 0 rows
    // ========================================
    const selectBRes = clientB
      ? await clientB
          .from("video_studio_jobs")
          .select("id,user_id")
      : { data: null, error: { message: "clientB not created" } };

    // ========================================
    // TEST 6: User B UPDATE A's job -> must fail (0 rows / PGRST116)
    // ========================================
    const updateBRes = clientB && jobId
      ? await clientB
          .from("video_studio_jobs")
          .update({ status: "failed" })
          .eq("id", jobId)
          .select("id,status")
          .single()
      : { data: null, error: { message: jobId ? "clientB not created" : "no jobId to update" } };

    // ========================================
    // TEST 7: User B DELETE A's job -> must fail (0 rows / PGRST116)
    // ========================================
    const deleteBRes = clientB && jobId
      ? await clientB
          .from("video_studio_jobs")
          .delete()
          .eq("id", jobId)
          .select("id")
          .single()
      : { data: null, error: { message: jobId ? "clientB not created" : "no jobId to delete" } };

    // Cleanup
    if (jobId) {
      await supabaseAdmin.from("video_studio_jobs").delete().eq("id", jobId);
    }
    if (userAId) {
      await supabaseAdmin.auth.admin.deleteUser(userAId);
    }
    if (userBId) {
      await supabaseAdmin.auth.admin.deleteUser(userBId);
    }

    return new Response(
      JSON.stringify(
        {
          runId,
          caller: { id: caller.id },
          users: {
            userA: { id: userAId, createError: serializeError(createAErr), signInError: serializeError(signInAErr) },
            userB: { id: userBId, createError: serializeError(createBErr), signInError: serializeError(signInBErr) },
          },
          tests: {
            "1_anon_select": {
              data: anonSelectRes?.data ?? null,
              error: serializeError(anonSelectRes?.error),
              expected: "42501 permission denied",
            },
            "2_anon_insert": {
              data: anonInsertRes?.data ?? null,
              error: serializeError(anonInsertRes?.error),
              expected: "42501 permission denied",
            },
            "3_userA_insert": {
              data: insertARes?.data ?? null,
              error: serializeError((insertARes as any)?.error),
              expected: "success with job id",
            },
            "4_userA_select_own": {
              data: selectARes?.data ?? null,
              error: serializeError((selectARes as any)?.error),
              expected: "1 row returned",
            },
            "5_userB_select_all": {
              data: selectBRes?.data ?? null,
              error: serializeError((selectBRes as any)?.error),
              expected: "0 rows (empty array)",
            },
            "6_userB_update_A_job": {
              data: updateBRes?.data ?? null,
              error: serializeError((updateBRes as any)?.error),
              expected: "PGRST116 (0 rows)",
            },
            "7_userB_delete_A_job": {
              data: deleteBRes?.data ?? null,
              error: serializeError((deleteBRes as any)?.error),
              expected: "PGRST116 (0 rows)",
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
