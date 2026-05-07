/**
 * outreach-bulk-worker
 *
 * Drains pending recipients from outreach_bulk_jobs in batches and sends each
 * email through Resend with the locked sender/CC identity. Designed to be
 * invoked both:
 *   - inline from outreach-bulk-create (fast first-batch start), and
 *   - by pg_cron every minute until all jobs are complete.
 *
 * Per-recipient: renders ONLY {{brokerage_name}} into the locked html_template
 * + subject. No other variables allowed (validated at job creation).
 *
 * Sender, sender name, reply-to, and CC are forced from the shared identity
 * module — clients cannot override them.
 *
 * Throttle: BATCH_SIZE = 50, ~10 req/s soft cap (well under Resend's default).
 * Retries: up to 3 attempts per recipient with exponential backoff.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PRIMARY_SENDER, PRIMARY_SENDER_NAME, DEFAULT_REPLY_TO, DEFAULT_CC } from "../_shared/outreachIdentity.ts";
import { renderOutreachTemplate } from "../_shared/outreachRender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_GATEWAY = "https://connector-gateway.lovable.dev/resend";
const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 3;
const SEND_DELAY_MS = 100; // ~10/s

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY_1") || Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return json({ error: "Resend connector not configured" }, 500);
  }

  // Optional job_id targeting; otherwise scan all running/queued jobs.
  let jobIds: string[] = [];
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    if (body?.job_id) jobIds = [body.job_id];
  } catch { /* noop */ }

  if (jobIds.length === 0) {
    const { data: jobs } = await service
      .from("outreach_bulk_jobs")
      .select("id")
      .in("status", ["queued", "running"])
      .limit(20);
    jobIds = (jobs || []).map((j) => j.id);
  }

  let totalSent = 0;
  let totalFailed = 0;

  for (const jobId of jobIds) {
    const { data: job } = await service.from("outreach_bulk_jobs").select("*").eq("id", jobId).maybeSingle();
    if (!job || job.status === "complete" || job.status === "cancelled") continue;
    if (job.status === "queued") {
      await service.from("outreach_bulk_jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", jobId);
    }

    const { data: pending } = await service
      .from("outreach_bulk_recipients")
      .select("*")
      .eq("job_id", jobId)
      .in("status", ["pending"])
      .lte("next_attempt_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (!pending || pending.length === 0) {
      // Check if all done
      const { count: remaining } = await service
        .from("outreach_bulk_recipients")
        .select("id", { count: "exact", head: true })
        .eq("job_id", jobId)
        .in("status", ["pending", "sending"]);
      if ((remaining ?? 0) === 0) {
        await service.from("outreach_bulk_jobs").update({ status: "complete", finished_at: new Date().toISOString() }).eq("id", jobId);
      }
      continue;
    }

    for (const r of pending) {
      // Mark sending
      await service.from("outreach_bulk_recipients").update({ status: "sending", attempts: (r.attempts || 0) + 1 }).eq("id", r.id);

      try {
        const subject = renderOutreachTemplate(job.subject, { brokerage_name: r.brokerage_name });
        const html = renderOutreachTemplate(job.html_template, { brokerage_name: r.brokerage_name });
        const text = job.plain_text_template
          ? renderOutreachTemplate(job.plain_text_template, { brokerage_name: r.brokerage_name })
          : undefined;

        const res = await fetch(`${RESEND_GATEWAY}/emails`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${PRIMARY_SENDER_NAME} <${PRIMARY_SENDER}>`,
            to: [r.email],
            cc: [DEFAULT_CC],
            reply_to: DEFAULT_REPLY_TO,
            subject,
            html,
            text,
            headers: { "X-Outreach-Job": jobId, "X-Payload-Hash": job.payload_hash },
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || `Resend HTTP ${res.status}`);

        await service.from("outreach_bulk_recipients").update({
          status: "sent",
          provider_message_id: data?.id || null,
          sent_at: new Date().toISOString(),
          error: null,
        }).eq("id", r.id);
        totalSent++;

        // Optional: write into email_send_log if it exists (best-effort)
        await service.from("email_send_log").insert({
          template_name: "brokerage_outreach_bulk",
          recipient_email: r.email,
          status: "sent",
          message_id: data?.id || null,
        }).then(() => {}, () => {});
      } catch (e) {
        const errMsg = String((e as Error).message || e);
        const newAttempts = (r.attempts || 0) + 1;
        const isFinal = newAttempts >= MAX_ATTEMPTS;
        const backoffMs = Math.min(60_000, 2_000 * 2 ** newAttempts);
        await service.from("outreach_bulk_recipients").update({
          status: isFinal ? "dlq" : "pending",
          error: errMsg,
          next_attempt_at: new Date(Date.now() + backoffMs).toISOString(),
        }).eq("id", r.id);
        if (isFinal) totalFailed++;
      }

      await new Promise((res) => setTimeout(res, SEND_DELAY_MS));
    }

    // Update aggregated counters
    const { data: counts } = await service
      .from("outreach_bulk_recipients")
      .select("status")
      .eq("job_id", jobId);
    const sent = (counts || []).filter((x) => x.status === "sent").length;
    const failed = (counts || []).filter((x) => x.status === "dlq").length;
    const remaining = (counts || []).filter((x) => x.status === "pending" || x.status === "sending").length;
    await service.from("outreach_bulk_jobs").update({
      sent, failed,
      ...(remaining === 0 ? { status: "complete", finished_at: new Date().toISOString() } : {}),
    }).eq("id", jobId);
  }

  return json({ ok: true, sent: totalSent, failed: totalFailed, jobs: jobIds.length }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
