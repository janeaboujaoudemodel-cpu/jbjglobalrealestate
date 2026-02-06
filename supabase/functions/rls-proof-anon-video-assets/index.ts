// RLS Proof: video_studio_assets - Anon denial + Cross-user isolation
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

    // 1A: Anon INSERT should fail (42501 permission denied)
    const anonInsertRes = await anonClient
      .from("video_studio_assets")
      .insert({
        user_id: userAId,
        session_id: `anon-test-${runId}`,
        file_name: "anon-test.mp4",
        file_path: "/test/anon-test.mp4",
        file_type: "video",
      })
      .select("id")
      .single();

    // 1B: Anon SELECT should fail (42501 permission denied)
    const anonSelectRes = await anonClient
      .from("video_studio_assets")
      .select("id, file_name")
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

    // 2A: User A inserts an asset with their own user_id
    const insertARes = clientA
      ? await clientA
          .from("video_studio_assets")
          .insert({
            user_id: userAId,
            session_id: `userA-session-${runId}`,
            file_name: "userA-video.mp4",
            file_path: `/uploads/${userAId}/video.mp4`,
            file_type: "video",
          })
          .select("id, user_id, file_name")
          .single()
      : { data: null, error: { message: "clientA not created" } };

    const assetId = insertARes?.data?.id ?? null;

    // 2B: User A can SELECT their own asset
    const selectARes = clientA
      ? await clientA.from("video_studio_assets").select("id, user_id, file_name").eq("id", assetId)
      : { data: null, error: { message: "clientA not created" } };

    // 2C: User B SELECT - should see 0 rows (not A's asset)
    const selectBRes = clientB
      ? await clientB.from("video_studio_assets").select("id, user_id, file_name")
      : { data: null, error: { message: "clientB not created" } };

    // 2D: User B UPDATE on A's asset - should fail via RLS
    const updateBRes = clientB
      ? await clientB
          .from("video_studio_assets")
          .update({ file_name: "hijacked-by-B.mp4" })
          .eq("id", assetId)
          .select("id, file_name")
          .single()
      : { data: null, error: { message: "clientB not created" } };

    // 2E: User B DELETE on A's asset - should fail via RLS
    const deleteBRes = clientB
      ? await clientB
          .from("video_studio_assets")
          .delete()
          .eq("id", assetId)
          .select("id")
          .single()
      : { data: null, error: { message: "clientB not created" } };

    // Cleanup
    if (assetId) {
      await supabaseAdmin.from("video_studio_assets").delete().eq("id", assetId);
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
            "2D_userB_update_A_asset": { data: updateBRes?.data ?? null, error: serializeError(updateBRes?.error) },
            "2E_userB_delete_A_asset": { data: deleteBRes?.data ?? null, error: serializeError(deleteBRes?.error) },
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
