// Broker Certification — Step 1+2: validate reading telemetry, accept submission
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, handleCorsPreflightWithValidation, corsJsonResponse } from "../_shared/cors-utils.ts";

const READ_TIME_FLOOR_PCT = 0.6; // 60% of estimated reading time
const SCROLL_FLOOR_PCT = 70;     // 70% of scroll depth

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightWithValidation(req);
  if (preflight) return preflight;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return corsJsonResponse(req, { error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims?.sub) {
      return corsJsonResponse(req, { error: "Unauthorized" }, 401);
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const reflectionText: string = String(body?.reflectionText ?? "").trim();
    const attestation: boolean = Boolean(body?.attestationAccepted);
    const requiredModuleIds: string[] = Array.isArray(body?.requiredModuleIds)
      ? body.requiredModuleIds.map(String)
      : [];

    if (!attestation) {
      return corsJsonResponse(req, { error: "Attestation required" }, 400);
    }
    if (reflectionText.length < 120) {
      return corsJsonResponse(req, { error: "Reflection must be at least 120 characters" }, 400);
    }
    if (requiredModuleIds.length === 0) {
      return corsJsonResponse(req, { error: "No modules specified" }, 400);
    }

    // Pull reading telemetry + module metadata for estimated_minutes
    const [readsRes, modulesRes] = await Promise.all([
      supabase
        .from("broker_education_module_reads")
        .select("module_id, time_spent_seconds, scroll_depth_pct, idle_events, focus_loss_events")
        .eq("user_id", userId)
        .in("module_id", requiredModuleIds),
      supabase
        .from("broker_education_modules")
        .select("id, estimated_minutes")
        .in("id", requiredModuleIds),
    ]);

    if (readsRes.error || modulesRes.error) {
      return corsJsonResponse(req, { error: "Failed to load telemetry" }, 500);
    }
    const reads = readsRes.data ?? [];
    const modules = modulesRes.data ?? [];

    const report: Record<string, unknown> = { modules: [], failures: [] };
    let allPassed = true;

    for (const mid of requiredModuleIds) {
      const r = reads.find((x: any) => x.module_id === mid);
      const mod = modules.find((m: any) => m.id === mid);
      if (!r) {
        allPassed = false;
        (report.failures as any[]).push({ moduleId: mid, reason: "no_telemetry" });
        continue;
      }
      const estMin = Number(mod?.estimated_minutes ?? 15);
      const floorSec = Math.max(60, estMin * 60 * READ_TIME_FLOOR_PCT);
      const timeOk = Number(r.time_spent_seconds ?? 0) >= floorSec;
      const scrollOk = Number(r.scroll_depth_pct ?? 0) >= SCROLL_FLOOR_PCT;
      (report.modules as any[]).push({
        moduleId: mid,
        timeSpent: r.time_spent_seconds,
        floorSec,
        scrollDepth: r.scroll_depth_pct,
        timeOk,
        scrollOk,
      });
      if (!timeOk || !scrollOk) {
        allPassed = false;
        (report.failures as any[]).push({
          moduleId: mid,
          reason: !timeOk ? "insufficient_reading_time" : "insufficient_scroll_depth",
        });
      }
    }

    // Insert submission
    const { data: submission, error: subErr } = await supabase
      .from("broker_certification_submissions")
      .insert({
        user_id: userId,
        reflection_text: reflectionText,
        attestation_accepted: true,
        validator_passed: allPassed,
        validator_report: report,
        status: allPassed ? "pending" : "rejected",
        required_module_ids: requiredModuleIds,
      })
      .select("id, status, validator_passed")
      .single();

    if (subErr) {
      return corsJsonResponse(req, { error: subErr.message }, 500);
    }

    // Audit trail
    await supabase.from("broker_certification_audit").insert({
      user_id: userId,
      submission_id: submission.id,
      event_type: allPassed ? "submission_accepted" : "submission_auto_rejected",
      payload: report,
      ip: req.headers.get("x-forwarded-for") ?? null,
      user_agent: req.headers.get("user-agent") ?? null,
    });

    return corsJsonResponse(req, { submission, report });
  } catch (e) {
    console.error("broker-cert-submit error", e);
    return corsJsonResponse(req, { error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
