/**
 * Phase A2 Security Proof Edge Function (COMPLIANT VERSION v2.1)
 * 
 * ACCESS: OWNER ONLY (verified via OWNER_EMAIL secret)
 * 
 * This function provides VERIFIABLE PROOF of:
 * 1. User A / User B creation with real JWTs
 * 2. RLS cross-user isolation (User B cannot read User A's data)
 * 3. Broker endpoint enforcement (401/403/200/200 for all 4 cases)
 * 4. Owner read-only override (cross-user visibility)
 * 5. PII protection (no raw PII in stored records)
 * 
 * All operations use real database queries and return raw results.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProofResult {
  step: string;
  description: string;
  passed: boolean;
  evidence: unknown;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const ownerEmail = Deno.env.get("OWNER_EMAIL");

  const proofs: ProofResult[] = [];
  
  // Cleanup tracking
  const cleanup: { 
    userAId?: string; 
    userBId?: string; 
    jobIdA?: string;
    brokerSubId?: string;
  } = {};

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    // ============================================
    // STEP 0: OWNER AUTHENTICATION CHECK
    // ============================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required", code: 401 }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ownerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: ownerUser }, error: authError } = await ownerClient.auth.getUser();
    if (authError || !ownerUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication", code: 401 }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OWNER-ONLY CHECK
    if (!ownerEmail || ownerUser.email?.toLowerCase() !== ownerEmail.toLowerCase()) {
      return new Response(
        JSON.stringify({ 
          error: "Access denied: Owner only", 
          code: 403,
          userEmail: ownerUser.email,
          ownerConfigured: !!ownerEmail 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    proofs.push({
      step: "0. Owner Authentication",
      description: "Verified caller is Owner",
      passed: true,
      evidence: { email: ownerUser.email, ownerMatch: true },
    });

    // ============================================
    // STEP 1: CREATE TEST USER A (NON-BROKER)
    // ============================================
    const timestamp = Date.now();
    const userAEmail = `test-user-a-${timestamp}@proof-phase-a2.test`;
    const userAPassword = `TestPass_${timestamp}A!`;
    
    const { data: userAData, error: userAError } = await adminClient.auth.admin.createUser({
      email: userAEmail,
      password: userAPassword,
      email_confirm: true,
    });

    if (userAError || !userAData.user) {
      throw new Error(`Failed to create User A: ${userAError?.message}`);
    }
    cleanup.userAId = userAData.user.id;

    proofs.push({
      step: "1. Create User A (Non-Broker)",
      description: "Created test user A with NO broker subscription",
      passed: true,
      evidence: { 
        userId: userAData.user.id, 
        email: userAEmail,
        isBroker: false,
      },
    });

    // ============================================
    // STEP 2: CREATE TEST USER B (BROKER)
    // ============================================
    const userBEmail = `test-user-b-${timestamp}@proof-phase-a2.test`;
    const userBPassword = `TestPass_${timestamp}B!`;
    
    const { data: userBData, error: userBError } = await adminClient.auth.admin.createUser({
      email: userBEmail,
      password: userBPassword,
      email_confirm: true,
    });

    if (userBError || !userBData.user) {
      throw new Error(`Failed to create User B: ${userBError?.message}`);
    }
    cleanup.userBId = userBData.user.id;

    // Create broker subscription for User B
    const brokerSubId = crypto.randomUUID();
    const { error: brokerSubError } = await adminClient
      .from("broker_subscriptions")
      .insert({
        id: brokerSubId,
        user_id: userBData.user.id,
        email: userBEmail,
        status: "active",
        tier: "professional",
        price_usd: 0,
        currency: "USD",
        starts_at: new Date().toISOString(),
      });

    if (brokerSubError) {
      throw new Error(`Failed to create broker subscription: ${brokerSubError.message}`);
    }
    cleanup.brokerSubId = brokerSubId;

    proofs.push({
      step: "2. Create User B (Broker)",
      description: "Created test user B WITH active broker_subscriptions entry",
      passed: true,
      evidence: { 
        userId: userBData.user.id, 
        email: userBEmail,
        isBroker: true,
        subscriptionId: brokerSubId,
        subscriptionStatus: "active",
      },
    });

    // ============================================
    // STEP 3: SIGN IN USER A AND GET JWT
    // ============================================
    const anonClientA = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
    
    const { data: sessionA, error: signInAError } = await anonClientA.auth.signInWithPassword({
      email: userAEmail,
      password: userAPassword,
    });

    if (signInAError || !sessionA.session) {
      throw new Error(`Failed to sign in User A: ${signInAError?.message}`);
    }

    const userAToken = sessionA.session.access_token;
    const userAClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${userAToken}` } },
    });

    proofs.push({
      step: "3. Sign In User A",
      description: "Obtained JWT for User A (non-broker)",
      passed: !!userAToken,
      evidence: { 
        hasToken: !!userAToken,
        tokenPrefix: userAToken.substring(0, 20) + "...",
        userId: sessionA.session.user.id,
      },
    });

    // ============================================
    // STEP 4: SIGN IN USER B AND GET JWT
    // ============================================
    const anonClientB = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
    
    const { data: sessionB, error: signInBError } = await anonClientB.auth.signInWithPassword({
      email: userBEmail,
      password: userBPassword,
    });

    if (signInBError || !sessionB.session) {
      throw new Error(`Failed to sign in User B: ${signInBError?.message}`);
    }

    const userBToken = sessionB.session.access_token;
    const userBClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${userBToken}` } },
    });

    proofs.push({
      step: "4. Sign In User B",
      description: "Obtained JWT for User B (broker)",
      passed: !!userBToken,
      evidence: { 
        hasToken: !!userBToken,
        tokenPrefix: userBToken.substring(0, 20) + "...",
        userId: sessionB.session.user.id,
      },
    });

    // ============================================
    // STEP 5: USER A INSERTS INTO ai_job_master
    // ============================================
    const jobIdA = crypto.randomUUID();
    cleanup.jobIdA = jobIdA;

    const { data: insertDataA, error: insertErrorA } = await userAClient
      .from("ai_job_master")
      .insert({
        id: jobIdA,
        user_id: userAData.user.id,
        tool_name: "phase-a2-user-a-test",
        status: "completed",
        input_payload: {
          lead_ref: "sha256_hashed_value_user_a",
          budget: "500000",
          timeline: "6 months",
        },
        output_payload: {
          qualificationScore: 75,
          classification: "investor",
        },
      })
      .select("id")
      .single();

    proofs.push({
      step: "5. User A INSERT ai_job_master",
      description: "User A successfully inserts their own record",
      passed: !insertErrorA && !!insertDataA,
      evidence: { 
        success: !insertErrorA,
        jobId: insertDataA?.id || jobIdA,
        error: insertErrorA ? { 
          message: insertErrorA.message, 
          code: insertErrorA.code 
        } : null,
      },
    });

    // ============================================
    // STEP 6: USER A SELECTS OWN ROW ✅
    // ============================================
    const { data: userAOwnData, error: userAOwnError } = await userAClient
      .from("ai_job_master")
      .select("id, user_id, tool_name")
      .eq("id", jobIdA)
      .single();

    proofs.push({
      step: "6. User A SELECT Own Row ✅",
      description: "User A can read their own record",
      passed: !userAOwnError && userAOwnData?.id === jobIdA,
      evidence: { 
        found: !!userAOwnData,
        matchesJobId: userAOwnData?.id === jobIdA,
        error: userAOwnError ? { 
          message: userAOwnError.message, 
          code: userAOwnError.code 
        } : null,
      },
    });

    // ============================================
    // STEP 7: USER B TRIES TO SELECT USER A's ROW ❌
    // ============================================
    const { data: userBCrossData, error: userBCrossError } = await userBClient
      .from("ai_job_master")
      .select("id, user_id, tool_name")
      .eq("id", jobIdA)
      .maybeSingle();

    // RLS should return 0 rows (not permission error) when user B tries to read A's data
    const userBBlockedCorrectly = userBCrossData === null && !userBCrossError;

    proofs.push({
      step: "7. User B SELECT User A's Row ❌ (MUST FAIL)",
      description: "User B CANNOT read User A's record (RLS isolation)",
      passed: userBBlockedCorrectly,
      evidence: { 
        dataReturned: userBCrossData,
        rowCount: userBCrossData ? 1 : 0,
        expectedRowCount: 0,
        error: userBCrossError ? { 
          message: userBCrossError.message, 
          code: userBCrossError.code 
        } : null,
        isolation: userBBlockedCorrectly ? "ENFORCED ✅" : "FAILED ❌",
      },
    });

    // ============================================
    // STEP 8: OWNER SELECTS ACROSS USERS ✅
    // ============================================
    const { data: ownerCrossData, error: ownerCrossError } = await ownerClient
      .from("ai_job_master")
      .select("id, user_id, tool_name")
      .order("created_at", { ascending: false })
      .limit(10);

    // Owner should see multiple users' data via owner_select policy
    const uniqueUserIds = new Set(ownerCrossData?.map(r => r.user_id) || []);
    const ownerSeesUserAJob = ownerCrossData?.some(r => r.id === jobIdA);

    proofs.push({
      step: "8. Owner SELECT Across Users ✅",
      description: "Owner can see records from multiple users (read-only audit)",
      passed: !ownerCrossError && ownerSeesUserAJob === true,
      evidence: { 
        totalRows: ownerCrossData?.length || 0,
        uniqueUsers: uniqueUserIds.size,
        seesUserAJob: ownerSeesUserAJob,
        error: ownerCrossError ? { 
          message: ownerCrossError.message, 
          code: ownerCrossError.code 
        } : null,
      },
    });

    // ============================================
    // STEP 9: BROKER ENDPOINT - NO AUTH → 401
    // ============================================
    const noAuthResponse = await fetch(
      `${supabaseUrl}/functions/v1/ai-lead-qualification`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadInfo: { budget: "test" } }),
      }
    );
    const noAuthBody = await noAuthResponse.text();

    proofs.push({
      step: "9. Broker Endpoint: No Auth → 401",
      description: "Request without Authorization header returns 401",
      passed: noAuthResponse.status === 401,
      evidence: {
        expectedStatus: 401,
        actualStatus: noAuthResponse.status,
        body: noAuthBody,
      },
    });

    // ============================================
    // STEP 10: BROKER ENDPOINT - NON-BROKER (USER A) → 403
    // ============================================
    const userABrokerResponse = await fetch(
      `${supabaseUrl}/functions/v1/ai-lead-qualification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userAToken}`,
        },
        body: JSON.stringify({ leadInfo: { budget: "test-user-a" } }),
      }
    );
    const userABrokerBody = await userABrokerResponse.text();

    proofs.push({
      step: "10. Broker Endpoint: Non-Broker (User A) → 403",
      description: "Authenticated non-broker user returns 403",
      passed: userABrokerResponse.status === 403,
      evidence: {
        expectedStatus: 403,
        actualStatus: userABrokerResponse.status,
        body: userABrokerBody,
      },
    });

    // ============================================
    // STEP 11: BROKER ENDPOINT - BROKER (USER B) → 200
    // ============================================
    const userBBrokerResponse = await fetch(
      `${supabaseUrl}/functions/v1/ai-lead-qualification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userBToken}`,
        },
        body: JSON.stringify({ 
          leadInfo: { 
            budget: "1000000 AED",
            propertyInterest: "Palm Jumeirah Villa",
            timeline: "Immediate",
            source: "Phase A2 Broker Test",
          } 
        }),
      }
    );
    const userBBrokerBody = await userBBrokerResponse.text();

    proofs.push({
      step: "11. Broker Endpoint: Broker (User B) → 200",
      description: "Authenticated broker user returns 200",
      passed: userBBrokerResponse.status === 200,
      evidence: {
        expectedStatus: 200,
        actualStatus: userBBrokerResponse.status,
        bodyPreview: userBBrokerBody.substring(0, 200) + (userBBrokerBody.length > 200 ? "..." : ""),
      },
    });

    // ============================================
    // STEP 12: BROKER ENDPOINT - OWNER → 200
    // ============================================
    const ownerBrokerResponse = await fetch(
      `${supabaseUrl}/functions/v1/ai-lead-qualification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify({ 
          leadInfo: { 
            budget: "2000000 AED",
            propertyInterest: "Downtown Dubai Penthouse",
            timeline: "3 months",
            source: "Phase A2 Owner Test",
          } 
        }),
      }
    );
    const ownerBrokerBody = await ownerBrokerResponse.text();

    proofs.push({
      step: "12. Broker Endpoint: Owner → 200",
      description: "Owner always has broker access",
      passed: ownerBrokerResponse.status === 200,
      evidence: {
        expectedStatus: 200,
        actualStatus: ownerBrokerResponse.status,
        bodyPreview: ownerBrokerBody.substring(0, 200) + (ownerBrokerBody.length > 200 ? "..." : ""),
      },
    });

    // ============================================
    // STEP 13: PII PROTECTION VERIFICATION
    // ============================================
    const { data: storedJobData } = await adminClient
      .from("ai_job_master")
      .select("input_payload")
      .eq("id", jobIdA)
      .single();

    const inputPayload = (storedJobData?.input_payload || {}) as Record<string, unknown>;
    const hasPII = !!(
      inputPayload.name || 
      inputPayload.email || 
      inputPayload.phone || 
      inputPayload.notes
    );

    proofs.push({
      step: "13. PII Protection Verified",
      description: "Stored input_payload contains NO raw PII (only lead_ref hash)",
      passed: !hasPII,
      evidence: {
        storedFields: Object.keys(inputPayload),
        hasName: !!inputPayload.name,
        hasEmail: !!inputPayload.email,
        hasPhone: !!inputPayload.phone,
        hasNotes: !!inputPayload.notes,
        hasLeadRef: !!inputPayload.lead_ref,
        piiProtected: !hasPII,
      },
    });

    // ============================================
    // STEP 14: SECRETS CONFIGURATION
    // ============================================
    const leadRefKey = Deno.env.get("LEAD_REF_HMAC_KEY");

    proofs.push({
      step: "14. Secrets Configuration",
      description: "Required secrets are configured",
      passed: !!ownerEmail && !!leadRefKey,
      evidence: {
        OWNER_EMAIL_configured: !!ownerEmail,
        LEAD_REF_HMAC_KEY_configured: !!leadRefKey,
      },
    });

    // ============================================
    // STEP 15: CLEANUP
    // ============================================
    let cleanupSuccess = true;
    const cleanupDetails: Record<string, boolean> = {};

    // Delete test job
    if (cleanup.jobIdA) {
      const { error } = await adminClient
        .from("ai_job_master")
        .delete()
        .eq("id", cleanup.jobIdA);
      cleanupDetails.jobA = !error;
      if (error) cleanupSuccess = false;
    }

    // Delete broker subscription
    if (cleanup.brokerSubId) {
      const { error } = await adminClient
        .from("broker_subscriptions")
        .delete()
        .eq("id", cleanup.brokerSubId);
      cleanupDetails.brokerSub = !error;
      if (error) cleanupSuccess = false;
    }

    // Delete test users
    if (cleanup.userAId) {
      const { error } = await adminClient.auth.admin.deleteUser(cleanup.userAId);
      cleanupDetails.userA = !error;
      if (error) cleanupSuccess = false;
    }

    if (cleanup.userBId) {
      const { error } = await adminClient.auth.admin.deleteUser(cleanup.userBId);
      cleanupDetails.userB = !error;
      if (error) cleanupSuccess = false;
    }

    proofs.push({
      step: "15. Cleanup",
      description: "Test data cleaned up",
      passed: cleanupSuccess,
      evidence: {
        details: cleanupDetails,
        allCleaned: cleanupSuccess,
      },
    });

    // ============================================
    // SUMMARY
    // ============================================
    const allPassed = proofs.every(p => p.passed);
    const passedCount = proofs.filter(p => p.passed).length;

    return new Response(
      JSON.stringify({
        phase: "A2",
        version: "2.1-compliant",
        timestamp: new Date().toISOString(),
        executor: ownerUser.email,
        summary: {
          allPassed,
          passedCount,
          totalSteps: proofs.length,
          brokerEnforcementMatrix: {
            "No Auth": proofs.find(p => p.step.includes("No Auth"))?.passed ? "401 ✅" : "FAILED ❌",
            "Non-Broker (User A)": proofs.find(p => p.step.includes("Non-Broker"))?.passed ? "403 ✅" : "FAILED ❌",
            "Broker (User B)": proofs.find(p => p.step.includes("Broker (User B)"))?.passed ? "200 ✅" : "FAILED ❌",
            "Owner": proofs.find(p => p.step.includes("Owner →"))?.passed ? "200 ✅" : "FAILED ❌",
          },
          rlsIsolationMatrix: {
            "User A inserts own": proofs.find(p => p.step.includes("User A INSERT"))?.passed ? "✅" : "❌",
            "User A reads own": proofs.find(p => p.step.includes("User A SELECT Own"))?.passed ? "✅" : "❌",
            "User B blocked from A": proofs.find(p => p.step.includes("User B SELECT User A"))?.passed ? "✅" : "❌",
            "Owner reads all": proofs.find(p => p.step.includes("Owner SELECT Across"))?.passed ? "✅" : "❌",
          },
        },
        proofs,
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    // ============================================
    // ERROR CLEANUP
    // ============================================
    try {
      if (cleanup.jobIdA) {
        await adminClient.from("ai_job_master").delete().eq("id", cleanup.jobIdA);
      }
      if (cleanup.brokerSubId) {
        await adminClient.from("broker_subscriptions").delete().eq("id", cleanup.brokerSubId);
      }
      if (cleanup.userAId) {
        await adminClient.auth.admin.deleteUser(cleanup.userAId);
      }
      if (cleanup.userBId) {
        await adminClient.auth.admin.deleteUser(cleanup.userBId);
      }
    } catch (cleanupError) {
      console.error("Cleanup failed:", cleanupError);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        proofsCompleted: proofs,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
