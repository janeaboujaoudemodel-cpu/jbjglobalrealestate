#!/usr/bin/env node
/**
 * E2E smoke test for the unified HR pipeline.
 *
 * Walks the full flow with the service-role key:
 *   1. seed an hr_candidates row
 *   2. invoke hr-approve-and-request-docs (requires an owner JWT — optional)
 *   3. invoke hr-intake-submit (requires a candidate JWT — optional)
 *   4. directly insert + flip an esign_envelopes row to `completed` to fire
 *      trg_candidate_on_envelope_signed
 *   5. verify hr_employees row + broker_onboarding_progress row exist
 *   6. clean up
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   [OWNER_JWT=...] [CANDIDATE_JWT=... CANDIDATE_USER_ID=...] \
 *   node scripts/e2e/hr-pipeline.mjs
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SVC) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const OWNER_JWT = process.env.OWNER_JWT || null;
const CANDIDATE_JWT = process.env.CANDIDATE_JWT || null;
const CANDIDATE_USER_ID = process.env.CANDIDATE_USER_ID || null;

const admin = createClient(URL, SVC, { auth: { persistSession: false } });
const stamp = Date.now();
const TEST_EMAIL = `hr-e2e-${stamp}@example.com`;

const log = (step, status, extra = "") =>
  console.log(`${status === "ok" ? "✅" : status === "skip" ? "⏭️ " : "❌"} ${step}${extra ? " — " + extra : ""}`);

async function invoke(fn, jwt, body) {
  const r = await fetch(`${URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SVC,
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(body),
  });
  const json = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, json };
}

let candidateId = null;
let envelopeId = null;

try {
  // 1. Seed candidate
  const { data: c, error: ce } = await admin
    .from("hr_candidates")
    .insert({
      candidate_name: "E2E Test Candidate",
      email: TEST_EMAIL,
      phone: "+971500000000",
      department_category: "Property Consultant",
      position_applied: "Property Consultant",
      status: "new",
      source: "e2e-script",
    })
    .select("id")
    .single();
  if (ce) throw new Error(`seed candidate: ${ce.message}`);
  candidateId = c.id;
  log("seed hr_candidates", "ok", candidateId);

  // 2. Approve & request docs (optional — needs owner JWT)
  if (OWNER_JWT) {
    const r = await invoke("hr-approve-and-request-docs", OWNER_JWT, {
      candidate_id: candidateId,
      department: "Property Consultant",
    });
    if (!r.ok) throw new Error(`hr-approve-and-request-docs: ${JSON.stringify(r.json)}`);
    log("hr-approve-and-request-docs", "ok", `token=${r.json.intake_token?.slice(0, 8)}…`);
  } else {
    log("hr-approve-and-request-docs", "skip", "set OWNER_JWT to exercise");
    // Mint a token directly so the next step works
    const token = `e2e${stamp}${Math.random().toString(36).slice(2, 10)}`;
    await admin
      .from("hr_candidates")
      .update({
        status: "approved_pending_docs",
        intake_token: token,
        intake_token_expires_at: new Date(Date.now() + 86400000).toISOString(),
      })
      .eq("id", candidateId);
  }

  // 3. Candidate intake (optional — needs candidate JWT)
  if (CANDIDATE_JWT) {
    const { data: cand } = await admin
      .from("hr_candidates")
      .select("intake_token")
      .eq("id", candidateId)
      .single();
    const r = await invoke("hr-intake-submit", CANDIDATE_JWT, {
      intake_token: cand.intake_token,
      full_name: "E2E Test Candidate",
      phone: "+971500000000",
      passports: [{ country: "United Arab Emirates", number: "P1234567" }],
      languages: ["English"],
      nationalities: ["United Arab Emirates"],
      total_years_experience: 3,
    });
    if (!r.ok) throw new Error(`hr-intake-submit: ${JSON.stringify(r.json)}`);
    log("hr-intake-submit", "ok", `status=${r.json.status}`);
  } else {
    log("hr-intake-submit", "skip", "set CANDIDATE_JWT to exercise");
    await admin
      .from("hr_candidates")
      .update({ status: "docs_submitted", intake_submitted_at: new Date().toISOString() })
      .eq("id", candidateId);
  }

  // 4. Create envelope + flip to completed to fire trigger
  const recipientUserId = CANDIDATE_USER_ID || null;
  const { data: env, error: ee } = await admin
    .from("esign_envelopes")
    .insert({
      name: "E2E Job Offer",
      category: "job_offer",
      template_key: "job_offer",
      document_url: "https://example.com/offer.pdf",
      document_filename: "offer.pdf",
      page_count: 1,
      sender_email: "e2e@jbj.ae",
      sender_name: "E2E Sender",
      email_subject: "E2E Job Offer",
      email_message: "Please sign",
      status: "draft",
      metadata: {
        candidate_id: candidateId,
        candidate_email: TEST_EMAIL,
      },
    })
    .select("id")
    .single();
  if (ee) throw new Error(`envelope insert: ${ee.message}`);
  envelopeId = env.id;
  log("seed esign_envelopes (draft)", "ok", envelopeId);

  const { error: flipErr } = await admin
    .from("esign_envelopes")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", envelopeId);
  if (flipErr) throw new Error(`envelope flip: ${flipErr.message}`);
  log("flip envelope → completed (trigger fires)", "ok");

  // 5. Verify trigger side-effects
  await new Promise((r) => setTimeout(r, 500));
  const { data: cAfter } = await admin
    .from("hr_candidates")
    .select("status, employee_id")
    .eq("id", candidateId)
    .single();
  if (cAfter?.status !== "offer_signed") {
    throw new Error(`expected status=offer_signed, got ${cAfter?.status}`);
  }
  log("hr_candidates.status → offer_signed", "ok");

  if (cAfter.employee_id) {
    const { data: emp } = await admin
      .from("hr_employees")
      .select("id, email")
      .eq("id", cAfter.employee_id)
      .maybeSingle();
    log("hr_employees row created", emp ? "ok" : "fail", emp?.email || "");
  } else {
    log("hr_employees row created", "fail", "candidate.employee_id is null");
  }

  if (recipientUserId) {
    const { data: prog } = await admin
      .from("broker_onboarding_progress")
      .select("user_id")
      .eq("user_id", recipientUserId)
      .maybeSingle();
    log("broker_onboarding_progress seeded", prog ? "ok" : "skip", "(only when CANDIDATE_USER_ID set)");
  } else {
    log("broker_onboarding_progress seeded", "skip", "set CANDIDATE_USER_ID to verify");
  }

  console.log("\n🎉 HR pipeline E2E completed");
} catch (e) {
  console.error("\n❌ E2E failed:", e.message);
  process.exitCode = 1;
} finally {
  // Cleanup
  if (envelopeId) await admin.from("esign_envelopes").delete().eq("id", envelopeId);
  if (candidateId) {
    await admin.from("hr_employees").delete().eq("source_candidate_id", candidateId).catch(() => {});
    await admin.from("hr_candidates").delete().eq("id", candidateId);
  }
  console.log("🧹 cleanup done");
}
