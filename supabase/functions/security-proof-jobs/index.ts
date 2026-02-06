// Security Proof Jobs - executes real RLS tests for studio_jobs (user A vs user B vs anon)
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
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ========================================
    // AUTH GATE (caller must be authenticated)
    // ========================================
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

    const {
      data: { user: caller },
      error: callerErr,
    } = await supabaseAuth.auth.getUser();

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

    // Create two ephemeral test users
    const runId = crypto.randomUUID();
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

    // Sign in to obtain real JWTs
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
    // TEST A: Authenticated insert (User A)
    // ========================================
    const insertARes = clientA
      ? await clientA
          .from("studio_jobs")
          .insert({
            user_id: userAId,
            job_type: "proof_test",
            status: "pending",
            progress: 0,
            input_data: {
              projectId: "proof-project",
              note: "RLS proof run",
              runId,
            },
          })
          .select("id,user_id")
          .single()
      : ({ data: null, error: { message: "clientA not created" } } as any);

    const jobId = insertARes?.data?.id ?? null;

    // User A SELECT should see 1 row
    const selectARes = clientA
      ? await clientA.from("studio_jobs").select("id,user_id").eq("id", jobId)
      : ({ data: null, error: { message: "clientA not created" } } as any);

    // ========================================
    // TEST B: Cross-user SELECT (User B) - should see 0 rows
    // ========================================
    const selectBRes = clientB
      ? await clientB.from("studio_jobs").select("id,user_id")
      : ({ data: null, error: { message: "clientB not created" } } as any);

    // ========================================
    // TEST C: Cross-user UPDATE attempt (User B) - should fail via RLS
    // Force an error by requiring .single()
    // ========================================
    const updateBRes = clientB
      ? await clientB
          .from("studio_jobs")
          .update({ status: "failed" })
          .eq("id", jobId)
          .select("id,status")
          .single()
      : ({ data: null, error: { message: "clientB not created" } } as any);

    // ========================================
    // TEST D: Logged-out insert attempt - should fail (RLS)
    // ========================================
    const anonInsertRes = await supabasePublic
      .from("studio_jobs")
      .insert({
        user_id: userAId,
        job_type: "proof_test_anon",
        status: "pending",
        progress: 0,
        input_data: { projectId: "proof-project", runId },
      })
      .select("id")
      .single();

    // Cleanup (best effort)
    if (jobId) {
      await supabaseAdmin.from("studio_jobs").delete().eq("id", jobId);
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
            A_authenticated_insert_userA: { data: insertARes?.data ?? null, error: serializeError(insertARes?.error) },
            A_select_userA: { data: selectARes?.data ?? null, error: serializeError(selectARes?.error) },
            B_select_userB: { data: selectBRes?.data ?? null, error: serializeError(selectBRes?.error) },
            C_update_userB_on_userA_job: { data: updateBRes?.data ?? null, error: serializeError(updateBRes?.error) },
            D_anon_insert: { data: anonInsertRes?.data ?? null, error: serializeError(anonInsertRes?.error) },
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
