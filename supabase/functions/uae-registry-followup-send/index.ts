// Auto-sends follow-up emails for UAE Developers + Brokerages registry.
// Locked sender CONTACT@JBJ.AE. Triggered by pg_cron (service role) after the
// uae-registry-followup-cron has set next_follow_up_date / status.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOCKED_SENDER = "CONTACT@JBJ.AE";

function escape(s: string) {
  return String(s ?? "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function followupHtml(opts: { contact: string; company: string; followNo: number }) {
  const { contact, company, followNo } = opts;
  const intro = followNo === 1
    ? "Following up on our previous note regarding company registration."
    : followNo === 2
    ? "Sharing a gentle second reminder — please let us know if any further information is needed."
    : "Final reminder before we close this thread on our side.";
  return {
    subject: `Follow-up #${followNo} — Company Registration with ${company}`,
    html: `<!DOCTYPE html><html><body style="background:#ffffff;color:#0a0a0a;font-family:Inter,Arial,sans-serif;padding:32px;max-width:640px;margin:0 auto;">
      <p>Dear ${escape(contact)},</p>
      <p>${escape(intro)}</p>
      <p>We are contacting you from <strong>JBJ Global Real Estate</strong> regarding company registration with <strong>${escape(company)}</strong>.</p>
      <p>Kindly confirm once the registration is completed, or advise if any further information is required.</p>
      <p>Best regards,<br/><strong>JBJ Global Real Estate</strong><br/>${LOCKED_SENDER}</p>
    </body></html>`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: settings } = await supabase.from("uae_registry_settings").select("*").eq("id", 1).maybeSingle();
  const today = new Date().toISOString().slice(0, 10);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "Email gateway not configured" }), { status: 500, headers: corsHeaders });
  }

  let sent = 0, skipped = 0, failed = 0;

  for (const table of ["uae_dev_registry", "uae_brk_registry"] as const) {
    const isDev = table === "uae_dev_registry";
    const { data: due } = await supabase.from(table)
      .select("*")
      .lte("next_follow_up_date", today)
      .in("outreach_status", ["Test Sent", "Contacted", "Follow-up Needed"])
      .neq("verification_status", "Not Verified")
      .limit(settings?.bulk_send_cap ?? 50);

    for (const r of due ?? []) {
      const recipient: string | null = isDev ? r.registration_email : r.outreach_email;
      if (!recipient) { skipped++; continue; }

      const followNo = (r.number_of_follow_ups_sent ?? 0) + 1;
      if (followNo > 3) { skipped++; continue; }

      const company = r.brand_name || r.legal_company_name || "your company";
      const contact = isDev ? "Team" : (r.outreach_contact_person || "Team");
      const tpl = followupHtml({ contact, company, followNo });

      try {
        const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: `JBJ Global Real Estate <${LOCKED_SENDER}>`,
            to: [recipient],
            subject: tpl.subject,
            html: tpl.html,
          }),
        });
        if (!res.ok) { failed++; continue; }

        await supabase.from("uae_registry_log").insert({
          [isDev ? "developer_id" : "brokerage_id"]: r.id,
          channel: "Email",
          direction: "Outbound",
          summary: `Follow-up #${followNo} sent to ${recipient}`,
          full_message: tpl.html,
          language: "en",
          ai_extracted: { sender: LOCKED_SENDER, follow_up_no: followNo, auto: true },
        });

        const next = new Date();
        const second = settings?.follow_up_days_second ?? 5;
        const final = settings?.follow_up_days_final ?? 10;
        const noResp = settings?.no_response_days ?? 14;
        if (followNo === 1) next.setDate(next.getDate() + (second - (settings?.follow_up_days_first ?? 2)));
        else if (followNo === 2) next.setDate(next.getDate() + (final - second));
        else next.setDate(next.getDate() + (noResp - final));

        await supabase.from(table).update({
          last_email_sent_at: new Date().toISOString(),
          number_of_follow_ups_sent: followNo,
          next_follow_up_date: next.toISOString().slice(0, 10),
          outreach_status: "Follow-up Needed",
        }).eq("id", r.id);

        sent++;
        await new Promise((res) => setTimeout(res, settings?.bulk_send_delay_ms ?? 2000));
      } catch (_e) {
        failed++;
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, skipped, failed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
