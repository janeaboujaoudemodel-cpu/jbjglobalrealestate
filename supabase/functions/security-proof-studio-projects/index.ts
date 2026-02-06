// Security Proof: studio_projects RLS Tests
// Tests anon access denial + cross-user isolation
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    // ========================================
    // AUTH GATE (caller must be authenticated)
    // ========================================
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

    // Admin client (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const runId = crypto.randomUUID();
    const password = `Tmp!${crypto.randomUUID()}Aa1`;
    const emailA = `proof-a-${runId}@example.com`;
    const emailB = `proof-b-${runId}@example.com`;

    // Create ephemeral users
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

    // ========================================
    // TEST 1: Anon client tests (no auth)
    // ========================================
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    // 1A: Anon INSERT should fail (42501 or similar RLS error)
    const anonInsertRes = await anonClient
      .from("studio_projects")
      .insert({
        user_id: userAId,
        name: "Anon Test Project",
        project_type: "general",
        status: "draft",
      })
      .select("id")
      .single();

    // 1B: Anon SELECT should fail (policies now authenticated-only)
    const anonSelectRes = await anonClient
      .from("studio_projects")
      .select("id, name")
      .limit(5);

    // ========================================
    // TEST 2: Cross-user isolation
    // ========================================
    const publicClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    // Sign in User A
    const { data: signInA, error: signInAErr } = await publicClient.auth.signInWithPassword({
      email: emailA,
      password,
    });

    // Sign in User B
    const { data: signInB, error: signInBErr } = await publicClient.auth.signInWithPassword({
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

    // 2A: User A inserts a project with their own user_id
    const insertARes = clientA
      ? await clientA
          .from("studio_projects")
          .insert({
            user_id: userAId,
            name: "User A Project",
            project_type: "general",
            status: "draft",
          })
          .select("id, user_id, name")
          .single()
      : { data: null, error: { message: "clientA not created" } };

    const projectId = insertARes?.data?.id ?? null;

    // 2B: User A can SELECT their own project
    const selectARes = clientA
      ? await clientA.from("studio_projects").select("id, user_id, name").eq("id", projectId)
      : { data: null, error: { message: "clientA not created" } };

    // 2C: User B SELECT - should see 0 rows (not A's project)
    const selectBRes = clientB
      ? await clientB.from("studio_projects").select("id, user_id, name")
      : { data: null, error: { message: "clientB not created" } };

    // 2D: User B UPDATE on A's project - should fail via RLS
    const updateBRes = clientB
      ? await clientB
          .from("studio_projects")
          .update({ name: "Hijacked by B" })
          .eq("id", projectId)
          .select("id, name")
          .single()
      : { data: null, error: { message: "clientB not created" } };

    // 2E: User B DELETE on A's project - should fail via RLS
    const deleteBRes = clientB
      ? await clientB
          .from("studio_projects")
          .delete()
          .eq("id", projectId)
          .select("id")
          .single()
      : { data: null, error: { message: "clientB not created" } };

    // Cleanup
    if (projectId) {
      await supabaseAdmin.from("studio_projects").delete().eq("id", projectId);
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
            "1A_anon_insert": { data: anonInsertRes?.data ?? null, error: serializeError(anonInsertRes?.error) },
            "1B_anon_select": { data: anonSelectRes?.data ?? null, error: serializeError(anonSelectRes?.error) },
            "2A_userA_insert": { data: insertARes?.data ?? null, error: serializeError(insertARes?.error) },
            "2B_userA_select_own": { data: selectARes?.data ?? null, error: serializeError(selectARes?.error) },
            "2C_userB_select_all": { data: selectBRes?.data ?? null, error: serializeError(selectBRes?.error) },
            "2D_userB_update_A_project": { data: updateBRes?.data ?? null, error: serializeError(updateBRes?.error) },
            "2E_userB_delete_A_project": { data: deleteBRes?.data ?? null, error: serializeError(deleteBRes?.error) },
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
