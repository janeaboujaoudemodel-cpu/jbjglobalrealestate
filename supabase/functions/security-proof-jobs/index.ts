// Security Proof Jobs - executes real RLS tests for studio_jobs using two REAL user JWTs.
//
// tokenA/tokenB are session access_tokens from two real test accounts.
// They can be obtained by signing in in the app and reading the session access_token,
// or by using auth.signInWithPassword in a local script.
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

type ProofBody = {
  tokenA?: string;
  tokenB?: string;
  projectId?: string;
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  let body: ProofBody | null = null;
  try {
    body = (await req.json()) as ProofBody;
  } catch {
    body = null;
  }

  const tokenA = body?.tokenA;
  const tokenB = body?.tokenB;
  const projectId = typeof body?.projectId === "string" && body.projectId.trim()
    ? body.projectId.trim()
    : "proof-project";

  if (!tokenA || typeof tokenA !== "string") {
    return new Response(
      JSON.stringify({ error: "tokenA_missing" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const runId = crypto.randomUUID();

  const clientA = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${tokenA}` } },
  });

  const clientB = tokenB
    ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${tokenB}` } },
    })
    : null;

  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const userARes = await clientA.auth.getUser();
  const userBRes = clientB ? await clientB.auth.getUser() : null;

  const userAId = userARes.data?.user?.id ?? null;
  const userBId = userBRes?.data?.user?.id ?? null;

  // A) Authenticated insert (User A)
  const insertARes = userAId
    ? await clientA
      .from("studio_jobs")
      .insert({
        user_id: userAId,
        project_id: projectId,
        job_type: "proof_test",
        status: "pending",
        progress: 0,
        input_data: {
          projectId,
          note: "RLS proof run",
          runId,
        },
      })
      .select("id,user_id,project_id")
      .single()
    : ({ data: null, error: userARes.error } as any);

  const jobId = insertARes?.data?.id ?? null;

  // A) Select back as User A
  const selectARes = jobId
    ? await clientA
      .from("studio_jobs")
      .select("id,user_id,project_id")
      .eq("id", jobId)
      .single()
    : ({ data: null, error: insertARes?.error } as any);

  // B) Cross-user select (User B)
  const selectBRes = !tokenB
    ? ({ data: null, error: { message: "tokenB_missing" } } as any)
    : !jobId
    ? ({ data: null, error: insertARes?.error } as any)
    : await clientB!
      .from("studio_jobs")
      .select("id,user_id,project_id")
      .eq("id", jobId);

  // C) Cross-user update attempt (User B) - force error by requiring .single()
  const updateBRes = !tokenB
    ? ({ data: null, error: { message: "tokenB_missing" } } as any)
    : !jobId
    ? ({ data: null, error: insertARes?.error } as any)
    : await clientB!
      .from("studio_jobs")
      .update({ status: "failed" })
      .eq("id", jobId)
      .select("id,status")
      .single();

  // D) Anonymous insert attempt (no auth)
  const anonInsertRes = await anonClient
    .from("studio_jobs")
    .insert({
      user_id: userAId ?? crypto.randomUUID(),
      project_id: projectId,
      job_type: "proof_test_anon",
      status: "pending",
      progress: 0,
      input_data: { projectId, runId },
    })
    .select("id")
    .single();

  // Cleanup: delete inserted job as User A (no service role)
  const cleanupDeleteRes = jobId
    ? await clientA
      .from("studio_jobs")
      .delete()
      .eq("id", jobId)
      .select("id")
      .single()
    : ({ data: null, error: insertARes?.error } as any);

  return new Response(
    JSON.stringify(
      {
        runId,
        users: {
          A: { id: userAId, error: serializeError(userARes.error) },
          B: { id: userBId, error: serializeError(userBRes?.error) },
        },
        tests: {
          A_insert_userA: {
            data: insertARes?.data ?? null,
            error: serializeError(insertARes?.error),
          },
          A_select_userA: {
            data: selectARes?.data ?? null,
            error: serializeError(selectARes?.error),
          },
          B_select_userB_on_userA_job: {
            data: selectBRes?.data ?? null,
            error: serializeError(selectBRes?.error),
          },
          C_update_userB_on_userA_job: {
            data: updateBRes?.data ?? null,
            error: serializeError(updateBRes?.error),
          },
          D_anon_insert: {
            data: anonInsertRes?.data ?? null,
            error: serializeError(anonInsertRes?.error),
          },
        },
        cleanup: {
          delete_job_as_userA: {
            data: cleanupDeleteRes?.data ?? null,
            error: serializeError(cleanupDeleteRes?.error),
          },
        },
      },
      null,
      2,
    ),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
