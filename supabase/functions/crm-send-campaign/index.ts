// crm-send-campaign
// Sends a campaign to a resolved smart segment via Resend.
// Enforces:
//   - Owner-only auth
//   - Daily/monthly Resend quota (via shared sendViaResend)
//   - Suppression list (email_suppressions)
//   - Single-agency rule: all recipients in one send must share at most one
//     non-empty company_name (or pass { allow_multi_company: true } for
//     legitimately cross-company audiences like "all clients").
//   - Logs each attempt to crm_campaign_recipients
//
// Body:
//   {
//     campaign_id: uuid,           // crm_email_campaigns
//     segment_id?: uuid,           // OR
//     filter?: SegmentFilter,
//     test_recipient?: string,     // dry single send (still hits quota)
//     allow_multi_company?: boolean,
//     max_send?: number,           // safety cap (default 500)
//   }
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";
import { sendViaResend } from "../_shared/resendClient.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const render = (tpl: string, data: Record<string, any>) =>
  (tpl ?? "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) =>
    k.split(".").reduce((o: any, p: string) => o?.[p], data) ?? "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const auth = await requireOwnerAuth(req, cors);
  if (auth.response) return auth.response;

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON" }); }

  if (!body.campaign_id) return json(400, { error: "campaign_id required" });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Fetch campaign
  const { data: campaign, error: cErr } = await supabase
    .from("crm_email_campaigns").select("*").eq("id", body.campaign_id).maybeSingle();
  if (cErr || !campaign) return json(404, { error: "Campaign not found" });

  // Resolve recipients
  let recipients: any[] = [];
  if (body.test_recipient) {
    recipients = [{
      id: null,
      full_name: "Test Recipient",
      email_lower: String(body.test_recipient).toLowerCase(),
      company_name: "Test",
    }];
  } else {
    const resolveResp = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/crm-resolve-segment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.get("Authorization") ?? "",
        },
        body: JSON.stringify({
          segment_id: body.segment_id,
          filter: body.filter,
          mode: "all",
          limit: body.max_send ?? 500,
        }),
      },
    );
    if (!resolveResp.ok) {
      const e = await resolveResp.text();
      return json(500, { error: `Resolve failed: ${e}` });
    }
    const resolved = await resolveResp.json();
    recipients = resolved.recipients ?? [];

    // Single-agency rule
    if (!body.allow_multi_company) {
      const companies = new Set(
        recipients
          .map((r) => (r.company_name || "").trim().toLowerCase())
          .filter((c) => c && c !== "—"),
      );
      if (companies.size > 1) {
        return json(400, {
          error: "SINGLE_AGENCY_VIOLATION",
          message:
            `This audience spans ${companies.size} different brokerages/companies. ` +
            "One outbound brokerage email = one brokerage. Narrow the segment by company_name, " +
            "or pass allow_multi_company=true for genuinely cross-company audiences (e.g. clients).",
          companies: Array.from(companies),
        });
      }
    }
  }

  if (!recipients.length) return json(200, { ok: true, sent: 0, failed: 0, total: 0 });

  // Mark campaign as sending
  if (!body.test_recipient) {
    await supabase.from("crm_email_campaigns")
      .update({ status: "sending" }).eq("id", campaign.id);
  }

  const fromEmail = (campaign as any).sender_email ?? "noreply@jbj.ae";
  const fromName = (campaign as any).sender_name ?? "JBJ GLOBAL REAL ESTATE";
  const replyTo = (campaign as any).reply_to ?? fromEmail;

  let sent = 0, failed = 0, quota_blocked = 0;
  const errors: any[] = [];

  for (const r of recipients) {
    const data = { lead: r, contact: r };
    const subject = render(campaign.subject, data);
    const html = render(campaign.html_content, data);

    const result = await sendViaResend({
      from: `${fromName} <${fromEmail}>`,
      to: r.email_lower,
      reply_to: replyTo,
      subject,
      html,
      headers: { "X-Campaign-Id": String(campaign.id) },
      tags: [{ name: "campaign", value: String(campaign.id) }],
    });

    if (!body.test_recipient) {
      await supabase.from("crm_campaign_recipients").insert({
        campaign_id: campaign.id,
        lead_id: r.id ?? null,
        email: r.email_lower,
        status: result.ok ? "sent" : "failed",
        sent_at: result.ok ? new Date().toISOString() : null,
        error_message: result.ok ? null : (result.error ?? `HTTP ${result.status}`),
      });
    }

    if (result.ok) sent++;
    else {
      failed++;
      if (result.status === 429) {
        quota_blocked++;
        errors.push({ email: r.email_lower, error: result.error, quota: result.quota });
        // Stop early if we've hit the global cap.
        break;
      } else {
        errors.push({ email: r.email_lower, error: result.error });
      }
    }
  }

  if (!body.test_recipient) {
    await supabase.from("crm_email_campaigns").update({
      status: failed === 0 ? "sent" : (sent > 0 ? "partial" : "failed"),
      sent_at: new Date().toISOString(),
      sent_count: sent,
      failed_count: failed,
    }).eq("id", campaign.id);
  }

  return json(200, {
    ok: true,
    sent,
    failed,
    quota_blocked,
    total: recipients.length,
    errors: errors.slice(0, 10),
  });
});
