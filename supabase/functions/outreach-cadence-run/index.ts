/**
 * Outreach Cadence Engine — Phase 2
 *
 * Nightly virtual admin. For every owner, walks the brokerage + developer
 * pipelines and either DRAFTS or AUTO-SENDS the next follow-up based on
 * `crm_owner_settings.automation_mode`.
 *
 * Cadence windows (from plan.md):
 *   brokerage   T+3d → F1, T+7d → F2, T+14d → F3, T+21d → dormant
 *   developer   T+2d → F1, T+6d → F2, T+12d → F3
 *
 * Skips:
 *   - do_not_contact = true
 *   - last_response_at IS NOT NULL (they replied — inbound sync handles it)
 *   - outreach_stage in ('nda_signed','active_partner','declined','blacklisted','dormant')
 *   - Developer names matching /citi\s*developer/i  (HARD RULE — competitor solicitation block)
 *
 * Modes:
 *   off         → no-op
 *   draft_only  → generate follow-up copy, write to crm_outreach_cadence_log (approved_at NULL)
 *                 + copy latest draft to entity.ai_draft_reply
 *   auto_send   → invoke crm-send-brokerage-outreach / crm-send-developer-registration
 *                 (uses existing variant; subject prefixed "Following up — ")
 *
 * Owner-scoped. Runs as service role from pg_cron.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const BROKERAGE_STEPS = [
  { step: "F1", daysSinceLastOutreach: 3, minAttempts: 1, maxAttempts: 1 },
  { step: "F2", daysSinceLastOutreach: 7, minAttempts: 2, maxAttempts: 2 },
  { step: "F3", daysSinceLastOutreach: 14, minAttempts: 3, maxAttempts: 3 },
  { step: "dormant", daysSinceLastOutreach: 21, minAttempts: 4, maxAttempts: 999 },
] as const;

const DEVELOPER_STEPS = [
  { step: "F1", daysSinceLastOutreach: 2, minAttempts: 1, maxAttempts: 1 },
  { step: "F2", daysSinceLastOutreach: 6, minAttempts: 2, maxAttempts: 2 },
  { step: "F3", daysSinceLastOutreach: 12, minAttempts: 3, maxAttempts: 3 },
] as const;

const TERMINAL_STAGES = new Set([
  "nda_signed",
  "active_partner",
  "declined",
  "blacklisted",
  "dormant",
]);

const CITI_RE = /citi\s*developer/i;

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

async function aiFollowup(context: {
  side: "brokerage" | "developer";
  step: string;
  entityName: string;
  contactFirstName?: string | null;
  lastSubject?: string | null;
  attemptNumber: number;
}): Promise<{ subject: string; body: string; reasoning: string }> {
  const fallback = () => {
    const who = context.contactFirstName || context.entityName || "there";
    if (context.side === "brokerage") {
      const map: Record<string, { s: string; b: string }> = {
        F1: {
          s: `Following up — CITI Developers channel partnership`,
          b: `Hi ${who},\n\nJust checking in on my note from a few days ago about registering your agency with CITI Developers. Happy to send our commercial deck and a project shortlist whenever you have 5 minutes.\n\nBest,\nJane Bou Jaoude\nSales & Training, CITI Developers`,
        },
        F2: {
          s: `Private briefing — AMRA release`,
          b: `Hi ${who},\n\nWe're hosting a small private briefing on the AMRA release this month. Would love to have your team attend. Even if the timing isn't right, happy to share the deck.\n\nBest,\nJane Bou Jaoude`,
        },
        F3: {
          s: `One last note`,
          b: `Hi ${who},\n\nI won't keep chasing — just wanted to leave the door open on the CITI Developers channel partnership. If it's not a fit right now, no problem at all.\n\nBest,\nJane Bou Jaoude`,
        },
        dormant: { s: "", b: "" },
      };
      const v = map[context.step] || map.F1;
      return { subject: v.s, body: v.b, reasoning: "fallback template" };
    }
    const map: Record<string, { s: string; b: string }> = {
      F1: {
        s: `Following up — JBJ Global Real Estate registration`,
        b: `Dear ${context.entityName} team,\n\nFollowing up on our registration request for JBJ Global Real Estate. Please let me know if any additional documents are required from our side.\n\nBest,\nJane Bou Jaoude\nJBJ Global Real Estate`,
      },
      F2: {
        s: `JBJ trade licence + RERA — registration follow-up`,
        b: `Dear team,\n\nAttaching our trade licence and RERA for the registration request. Kindly confirm receipt or let me know what else you need.\n\nBest,\nJane Bou Jaoude`,
      },
      F3: {
        s: `Registration status — kind escalation`,
        b: `Dear team,\n\nIt's been a couple of weeks since our registration request. Could you kindly confirm the status or direct me to the right contact?\n\nBest,\nJane Bou Jaoude`,
      },
    };
    const v = map[context.step] || map.F1;
    return { subject: v.s, body: v.b, reasoning: "fallback template" };
  };

  if (!LOVABLE_API_KEY) return fallback();

  try {
    const prompt =
      context.side === "brokerage"
        ? `You are Jane Bou Jaoude from CITI Developers writing a short polite follow-up email to invite brokerage ${context.entityName} to register with CITI Developers. This is follow-up ${context.step} (attempt ${context.attemptNumber}). Keep under 90 words. Return JSON {"subject": "...", "body": "..."}.`
        : `You are Jane Bou Jaoude from JBJ Global Real Estate following up on our brokerage registration with developer "${context.entityName}". Follow-up ${context.step}, attempt ${context.attemptNumber}. Never mention CITI Developers. Keep under 90 words. Return JSON {"subject": "...", "body": "..."}.`;
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) return fallback();
    const j = await r.json();
    const content = j.choices?.[0]?.message?.content;
    if (!content) return fallback();
    const parsed = JSON.parse(content);
    if (!parsed.subject || !parsed.body) return fallback();
    return { subject: parsed.subject, body: parsed.body, reasoning: `ai:${context.step}` };
  } catch (e) {
    console.warn("[cadence] AI failed:", e);
    return fallback();
  }
}

async function processOwner(admin: any, ownerId: string, mode: string) {
  if (mode === "off") return { skipped: true, ownerId };

  const now = new Date();
  const results = { owner_id: ownerId, mode, brokerage: 0, developer: 0, dormant: 0, drafts: 0, sent: 0, errors: [] as string[] };

  // ─── Brokerages ───
  const { data: brokerages, error: brkErr } = await admin
    .from("crm_brokerages")
    .select("id, company_name, email, primary_contact, outreach_stage, last_outreach_at, last_response_at, attempt_count, do_not_contact")
    .eq("owner_id", ownerId)
    .eq("do_not_contact", false)
    .is("last_response_at", null)
    .not("last_outreach_at", "is", null)
    .not("email", "is", null);
  if (brkErr) results.errors.push(`brokerages: ${brkErr.message}`);

  for (const brk of brokerages ?? []) {
    if (TERMINAL_STAGES.has(String(brk.outreach_stage))) continue;
    const last = new Date(brk.last_outreach_at);
    const days = daysBetween(last, now);
    const attempts = brk.attempt_count || 1;
    const nextStep = BROKERAGE_STEPS.find(
      (s) => days >= s.daysSinceLastOutreach && attempts >= s.minAttempts && attempts <= s.maxAttempts,
    );
    if (!nextStep) continue;

    // idempotency: did we already log this step for this entity?
    const { data: existing } = await admin
      .from("crm_outreach_cadence_log")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("entity_type", "brokerage")
      .eq("entity_id", brk.id)
      .eq("cadence_step", nextStep.step)
      .gte("created_at", new Date(last.getTime()).toISOString())
      .maybeSingle();
    if (existing) continue;

    if (nextStep.step === "dormant") {
      await admin.from("crm_brokerages").update({ outreach_stage: "dormant" }).eq("id", brk.id);
      await admin.from("crm_outreach_cadence_log").insert({
        owner_id: ownerId,
        entity_type: "brokerage",
        entity_id: brk.id,
        cadence_step: "dormant",
        mode: "stage_change",
        subject: null,
        body: `Moved to dormant after ${days}d silence.`,
        ai_reasoning: `attempt_count=${attempts}, days=${days}`,
      });
      results.dormant++;
      continue;
    }

    const copy = await aiFollowup({
      side: "brokerage",
      step: nextStep.step,
      entityName: brk.company_name || "",
      contactFirstName: (brk.primary_contact || "").split(" ")[0] || null,
      attemptNumber: attempts + 1,
    });

    if (mode === "auto_send") {
      const { data: sendRes, error: sendErr } = await admin.functions.invoke("crm-send-brokerage-outreach", {
        body: {
          brokerageId: brk.id,
          variant: "brokerage_partnership_intro",
          subjectOverride: copy.subject,
        },
      });
      if (sendErr) results.errors.push(`brk-send ${brk.id}: ${sendErr.message || sendErr}`);
      await admin.from("crm_outreach_cadence_log").insert({
        owner_id: ownerId, entity_type: "brokerage", entity_id: brk.id,
        cadence_step: nextStep.step, mode: "auto_sent",
        subject: copy.subject, body: copy.body, ai_reasoning: copy.reasoning,
        approved_at: new Date().toISOString(),
      });
      results.sent++;
    } else {
      // draft_only
      await admin.from("crm_outreach_cadence_log").insert({
        owner_id: ownerId, entity_type: "brokerage", entity_id: brk.id,
        cadence_step: nextStep.step, mode: "draft_only",
        subject: copy.subject, body: copy.body, ai_reasoning: copy.reasoning,
      });
      await admin.from("crm_brokerages").update({
        ai_draft_reply: copy.body,
        ai_next_action: `Send ${nextStep.step} follow-up (drafted by cadence engine)`,
        ai_generated_at: new Date().toISOString(),
      }).eq("id", brk.id);
      results.drafts++;
    }
    results.brokerage++;
  }

  // ─── Developers ───
  const { data: developers, error: devErr } = await admin
    .from("crm_developer_registry")
    .select("id, developer_name, developer_email, outreach_stage, last_outreach_at, last_response_at, attempt_count, do_not_contact")
    .eq("owner_id", ownerId)
    .eq("do_not_contact", false)
    .is("last_response_at", null)
    .not("last_outreach_at", "is", null)
    .not("developer_email", "is", null);
  if (devErr) results.errors.push(`developers: ${devErr.message}`);

  for (const dev of developers ?? []) {
    if (TERMINAL_STAGES.has(String(dev.outreach_stage))) continue;
    // HARD RULE: never send JBJ email to CITI Developers
    if (CITI_RE.test(dev.developer_name || "")) continue;
    if (/@citideveloper\.(com|ae|co)$/i.test(dev.developer_email || "")) continue;

    const last = new Date(dev.last_outreach_at);
    const days = daysBetween(last, now);
    const attempts = dev.attempt_count || 1;
    const nextStep = DEVELOPER_STEPS.find(
      (s) => days >= s.daysSinceLastOutreach && attempts >= s.minAttempts && attempts <= s.maxAttempts,
    );
    if (!nextStep) continue;

    const { data: existing } = await admin
      .from("crm_outreach_cadence_log")
      .select("id")
      .eq("owner_id", ownerId).eq("entity_type", "developer").eq("entity_id", dev.id)
      .eq("cadence_step", nextStep.step)
      .gte("created_at", new Date(last.getTime()).toISOString())
      .maybeSingle();
    if (existing) continue;

    const copy = await aiFollowup({
      side: "developer",
      step: nextStep.step,
      entityName: dev.developer_name || "",
      attemptNumber: attempts + 1,
    });

    if (mode === "auto_send") {
      const { error: sendErr } = await admin.functions.invoke("crm-send-developer-registration", {
        body: { developerId: dev.id, variant: "developer_registration", subjectOverride: copy.subject },
      });
      if (sendErr) results.errors.push(`dev-send ${dev.id}: ${sendErr.message || sendErr}`);
      await admin.from("crm_outreach_cadence_log").insert({
        owner_id: ownerId, entity_type: "developer", entity_id: dev.id,
        cadence_step: nextStep.step, mode: "auto_sent",
        subject: copy.subject, body: copy.body, ai_reasoning: copy.reasoning,
        approved_at: new Date().toISOString(),
      });
      results.sent++;
    } else {
      await admin.from("crm_outreach_cadence_log").insert({
        owner_id: ownerId, entity_type: "developer", entity_id: dev.id,
        cadence_step: nextStep.step, mode: "draft_only",
        subject: copy.subject, body: copy.body, ai_reasoning: copy.reasoning,
      });
      await admin.from("crm_developer_registry").update({
        ai_next_action: `Send ${nextStep.step} follow-up (drafted by cadence engine)`,
      }).eq("id", dev.id);
      results.drafts++;
    }
    results.developer++;
  }

  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    let body: { owner_id?: string; dry_run?: boolean } = {};
    if (req.method === "POST") { try { body = await req.json(); } catch { /* ok */ } }

    // Which owners to process?
    let ownersQ = admin.from("crm_owner_settings").select("owner_id, automation_mode");
    if (body.owner_id) ownersQ = ownersQ.eq("owner_id", body.owner_id);
    const { data: owners, error: ownersErr } = await ownersQ;
    if (ownersErr) throw ownersErr;

    const summaries = [];
    for (const o of owners ?? []) {
      const mode = body.dry_run ? "off" : (o.automation_mode || "draft_only");
      summaries.push(await processOwner(admin, o.owner_id, mode));
    }

    return new Response(JSON.stringify({ ok: true, ran_at: new Date().toISOString(), summaries }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[outreach-cadence-run] error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
