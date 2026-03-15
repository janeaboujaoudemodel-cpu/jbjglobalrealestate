/**
 * Phase A1 Proof Pack (Owner-only)
 *
 * Produces REAL, machine-verifiable evidence for:
 * - RLS isolation on public.ai_job_master across two authenticated users
 * - Owner override SELECT across users (via RLS)
 * - Broker-only enforcement on ai-lead-qualification (401/403/200)
 *
 * IMPORTANT:
 * - No anon tooling: all RLS tests are performed with authenticated JWTs
 * - Output does NOT include any emails, passwords, or tokens
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function redactBody(text: string, max = 600) {
  const trimmed = text.length > max ? text.slice(0, max) + "...<truncated>" : text;
  // best-effort redaction if any tokens accidentally appear
  return trimmed.replace(/Bearer\s+[A-Za-z0-9\-_.]+/g, "Bearer <redacted>");
}

async function safeJsonOrText(res: Response): Promise<{ as: "json" | "text"; value: any }> {
  const text = await res.text();
  try {
    return { as: "json", value: JSON.parse(text) };
  } catch {
    return { as: "text", value: redactBody(text) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ownerEmail = Deno.env.get("OWNER_EMAIL");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({
      error: "Missing backend configuration",
      missing: {
        SUPABASE_URL: !supabaseUrl,
        SUPABASE_ANON_KEY: !anonKey,
        SUPABASE_SERVICE_ROLE_KEY: !serviceKey,
      },
    }, 500);
  }

  // Caller must be authenticated
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Owner authentication required (missing Authorization header)" }, 401);
  }

  const ownerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: ownerAuth, error: ownerAuthError } = await ownerClient.auth.getUser();
  if (ownerAuthError || !ownerAuth.user) {
    return json({ error: "Invalid/expired token for caller", details: ownerAuthError?.message }, 401);
  }

  // Hard gate: only Owner can run this proof pack
  const callerEmail = ownerAuth.user.email?.toLowerCase() || null;
  const ownerEmailNormalized = ownerEmail?.toLowerCase() || null;
  if (!callerEmail || !ownerEmailNormalized || callerEmail !== ownerEmailNormalized) {
    return json(
      {
        error: "Owner-only proof pack",
        caller: { user_id: ownerAuth.user.id, email_present: !!ownerAuth.user.email },
        owner_configured: !!ownerEmail,
      },
      403
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Create two ephemeral test users
  const now = Date.now();
  const passwordA = crypto.randomUUID() + "!aA1";
  const passwordB = crypto.randomUUID() + "!bB1";
  const emailA = `proof_a1_user_a_${now}@example.com`;
  const emailB = `proof_a1_user_b_${now}@example.com`;

  let userAId: string | null = null;
  let userBId: string | null = null;
  let brokerSubscriptionId: string | null = null;

  try {
    const createA = await admin.auth.admin.createUser({
      email: emailA,
      password: passwordA,
      email_confirm: true,
    });
    if (createA.error || !createA.data.user) {
      return json({ error: "Failed creating User A", details: createA.error }, 500);
    }
    userAId = createA.data.user.id;

    const createB = await admin.auth.admin.createUser({
      email: emailB,
      password: passwordB,
      email_confirm: true,
    });
    if (createB.error || !createB.data.user) {
      return json({ error: "Failed creating User B", details: createB.error }, 500);
    }
    userBId = createB.data.user.id;

    // Sign in to obtain real JWTs for RLS tests
    const authA = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const authB = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

    const signInA = await authA.auth.signInWithPassword({ email: emailA, password: passwordA });
    const signInB = await authB.auth.signInWithPassword({ email: emailB, password: passwordB });

    const tokenA = signInA.data.session?.access_token;
    const tokenB = signInB.data.session?.access_token;

    if (!tokenA || signInA.error) {
      return json({ error: "Failed signing in User A", details: signInA.error }, 500);
    }
    if (!tokenB || signInB.error) {
      return json({ error: "Failed signing in User B", details: signInB.error }, 500);
    }

    const userAClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${tokenA}` } },
      auth: { persistSession: false },
    });

    const userBClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${tokenB}` } },
      auth: { persistSession: false },
    });

    // Make User B a broker by creating an active subscription (service role write)
    const brokerInsert = await admin
      .from("broker_subscriptions")
      .insert({
        user_id: userBId,
        email: emailB,
        status: "active",
        // other columns have defaults or are nullable
      })
      .select("id")
      .single();

    brokerSubscriptionId = brokerInsert.data?.id || null;

    // ---------- RLS EVIDENCE ----------
    // A) User A inserts into ai_job_master, then selects it
    const aInsert = await userAClient
      .from("ai_job_master")
      .insert({
        user_id: userAId,
        tool_name: "proof-phase-a1",
        status: "completed",
        input_payload: { proof: "user_a_insert" },
        output_payload: { ok: true },
      })
      .select("id, user_id")
      .single();

    const aRowId = aInsert.data?.id || null;

    const aSelect = aRowId
      ? await userAClient
          .from("ai_job_master")
          .select("id, user_id, tool_name")
          .eq("id", aRowId)
          .single()
      : { data: null, error: { message: "insert_failed_no_row_id" } };

    // B) User B attempts SELECT of User A's row id -> must not return the row
    // Use .single() so a 0-row result becomes an explicit error object.
    const bSelect = aRowId
      ? await userBClient
          .from("ai_job_master")
          .select("id, user_id, tool_name")
          .eq("id", aRowId)
          .single()
      : { data: null, error: { message: "no_a_row_id" } };

    // Create a second row owned by B so Owner proof shows multiple user_id values
    const bInsert = await userBClient
      .from("ai_job_master")
      .insert({
        user_id: userBId,
        tool_name: "proof-phase-a1",
        status: "completed",
        input_payload: { proof: "user_b_insert" },
        output_payload: { ok: true },
      })
      .select("id, user_id")
      .single();

    // C) Owner selects last 10 rows across users (RLS owner override)
    const ownerSelect = await ownerClient
      .from("ai_job_master")
      .select("id, user_id, tool_name, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    // ---------- BROKER-ONLY ENFORCEMENT EVIDENCE ----------
    const leadQualificationUrl = `${supabaseUrl}/functions/v1/ai-lead-qualification`;
    const leadQualificationBody = {
      leadInfo: {
        budget: "AED 2M",
        propertyInterest: "Dubai Marina",
        timeline: "0-3 months",
        source: "proof-pack",
        notes: "proof-run",
      },
    };

    // 1) 401 without Authorization
    const res401 = await fetch(leadQualificationUrl, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leadQualificationBody),
    });

    // 2) 403 with authenticated non-broker (User A)
    const res403 = await fetch(leadQualificationUrl, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${tokenA}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leadQualificationBody),
    });

    // 3) 200 with broker (User B)
    const res200Broker = await fetch(leadQualificationUrl, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${tokenB}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leadQualificationBody),
    });

    // 4) 200 with Owner (caller)
    const res200Owner = await fetch(leadQualificationUrl, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leadQualificationBody),
    });

    const out401 = await safeJsonOrText(res401);
    const out403 = await safeJsonOrText(res403);
    const out200Broker = await safeJsonOrText(res200Broker);
    const out200Owner = await safeJsonOrText(res200Owner);

    return json({
      ok: true,
      generated_at: new Date().toISOString(),

      rls_proof: {
        user_a: {
          user_id: userAId,
          insert: {
            data: aInsert.data,
            error: aInsert.error
              ? {
                  message: aInsert.error.message,
                  code: (aInsert.error as any).code,
                  details: (aInsert.error as any).details,
                  hint: (aInsert.error as any).hint,
                }
              : null,
          },
          select: {
            data: (aSelect as any).data,
            error: (aSelect as any).error
              ? {
                  message: (aSelect as any).error.message,
                  code: (aSelect as any).error.code,
                  details: (aSelect as any).error.details,
                  hint: (aSelect as any).error.hint,
                }
              : null,
          },
        },
        user_b: {
          user_id: userBId,
          broker_subscription_id: brokerSubscriptionId,
          select_user_a_row_by_id: {
            data: (bSelect as any).data,
            error: (bSelect as any).error
              ? {
                  message: (bSelect as any).error.message,
                  code: (bSelect as any).error.code,
                  details: (bSelect as any).error.details,
                  hint: (bSelect as any).error.hint,
                }
              : null,
          },
          insert_own_row: {
            data: bInsert.data,
            error: bInsert.error
              ? {
                  message: bInsert.error.message,
                  code: (bInsert.error as any).code,
                  details: (bInsert.error as any).details,
                  hint: (bInsert.error as any).hint,
                }
              : null,
          },
        },
        owner: {
          user_id: ownerAuth.user.id,
          select_last_10: {
            data: ownerSelect.data,
            count: ownerSelect.data?.length ?? 0,
            error: ownerSelect.error
              ? {
                  message: ownerSelect.error.message,
                  code: (ownerSelect.error as any).code,
                  details: (ownerSelect.error as any).details,
                  hint: (ownerSelect.error as any).hint,
                }
              : null,
          },
        },
      },

      broker_only_proof: {
        ai_lead_qualification: {
          no_authorization: {
            status: res401.status,
            body: out401,
          },
          authenticated_non_broker_user_a: {
            status: res403.status,
            body: out403,
          },
          authenticated_broker_user_b: {
            status: res200Broker.status,
            body: out200Broker,
          },
          authenticated_owner_caller: {
            status: res200Owner.status,
            body: out200Owner,
          },
        },
      },
    });
  } finally {
    // Best-effort cleanup (do not fail proof response if cleanup fails)
    try {
      if (brokerSubscriptionId) {
        await admin.from("broker_subscriptions").delete().eq("id", brokerSubscriptionId);
      }
    } catch {
      // ignore
    }

    try {
      if (userAId) await admin.auth.admin.deleteUser(userAId);
    } catch {
      // ignore
    }

    try {
      if (userBId) await admin.auth.admin.deleteUser(userBId);
    } catch {
      // ignore
    }
  }
});
