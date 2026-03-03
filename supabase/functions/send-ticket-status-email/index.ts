import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { emailShell, sharedSections, progressSteps, ticketSummaryCard, arabicDivider } from "../_shared/email-html.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const VERIFIED_SENDER = 'contact@jbj.ae';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(payload: { from: string; to: string[]; subject: string; html: string }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, reply_to: "CONTACT@JBJ.AE" }),
  });
  const data = await res.json();
  if (!res.ok) { console.error("Resend API error:", JSON.stringify(data)); return { error: data }; }
  return { data };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId, newStatus, adminNote } = await req.json();
    if (!ticketId || !newStatus) {
      return new Response(JSON.stringify({ error: "Missing ticketId or newStatus" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { data: ticket, error: fetchError } = await supabaseClient.from("support_tickets").select("*").eq("id", ticketId).single();
    if (fetchError || !ticket) {
      console.error("Ticket not found:", fetchError);
      return new Response(JSON.stringify({ error: "Ticket not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const surveyLink = `https://jbj.ae/ticket-survey?ticket=${encodeURIComponent(ticket.ticket_number)}&email=${encodeURIComponent(ticket.email)}`;
    const createdDate = new Date(ticket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const statusContent: Record<string, { title: string; subtitle: string; steps: [boolean, boolean, boolean]; checks: [boolean, boolean, boolean]; extraHtml: string }> = {
      in_progress: {
        title: "Your Ticket Is Being Reviewed",
        subtitle: "Our support team is now actively reviewing your ticket. We'll get back to you shortly.",
        steps: [true, true, false], checks: [true, true, false],
        extraHtml: adminNote ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;"><tr><td style="padding:20px;"><p style="font-weight:bold;color:#1a1a1a;margin:0 0 8px;">Admin Note:</p><p style="color:#555;margin:0;">${adminNote}</p></td></tr></table>` : '',
      },
      resolved: {
        title: "Your Ticket Has Been Resolved",
        subtitle: "We're pleased to let you know that your support ticket has been resolved.",
        steps: [true, true, true], checks: [true, true, true],
        extraHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:24px;text-align:center;">
<p style="color:#1a1a1a;font-size:16px;font-weight:bold;margin:0 0 8px;">Rate Your Experience</p>
<p style="color:#666;font-size:13px;margin:0 0 16px;">Help us improve by sharing your feedback</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=1" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=2" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=3" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=4" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=5" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
</tr></table>
<p style="margin:12px 0 0;"><a href="${surveyLink}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">Complete Survey &amp; Earn 50 Points</a></p>
</td></tr></table>`,
      },
    };

    const content = statusContent[newStatus];
    if (!content) {
      return new Response(JSON.stringify({ error: "Unsupported status for email" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const reopenHtml = newStatus === 'resolved' ? `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
<tr><td style="background:linear-gradient(135deg,#fff5f5,#fff0f0);border:2px dashed #e74c3c;border-radius:18px;padding:25px;text-align:center;">
<p style="color:#c0392b;margin:0 0 10px;font-size:16px;font-weight:bold;">Issue Not Resolved?</p>
<p style="color:#666;font-size:13px;margin:0 0 15px;">If your issue persists, you can reopen this ticket anytime.</p>
<a href="https://jbj.ae/reopen-ticket?ticket=${encodeURIComponent(ticket.ticket_number)}" style="display:inline-block;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;text-decoration:none;padding:14px 30px;border-radius:12px;font-weight:bold;font-size:14px;">Reopen This Ticket</a>
</td></tr></table>` : '';

    const bodyContent = `<tr><td class="content-pad" style="padding:32px;">
<p style="font-size:15px;color:#333;margin:0 0 16px;">Dear <strong>${ticket.full_name}</strong>,</p>
<p style="font-size:14px;color:#555;margin:0 0 24px;">${content.subtitle}</p>
${progressSteps(['Received', 'In Review', 'Resolved'], content.steps, content.checks)}
${ticketSummaryCard([
  { label: 'Ticket Number', value: ticket.ticket_number, highlight: true },
  { label: 'Subject', value: ticket.subject },
  { label: 'Category', value: ticket.service_category || 'General' },
  { label: 'Submitted', value: createdDate },
])}
${content.extraHtml}
${reopenHtml}
${sharedSections("support ticket", "JBJ Global Real Estate Support Team")}
</td></tr>`;

    const emailHtml = emailShell("Support Ticket Update", bodyContent);
    const subjectLine = newStatus === 'resolved'
      ? `[${ticket.ticket_number}] Your Ticket Has Been Resolved`
      : `[${ticket.ticket_number}] Your Ticket Is Being Reviewed`;

    const result = await sendEmail({ from: `JBJ Support <${VERIFIED_SENDER}>`, to: [ticket.email], subject: subjectLine, html: emailHtml });

    if (result.error) {
      console.error("Status email failed:", result.error);
      return new Response(JSON.stringify({ error: "Email send failed", details: result.error }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`Status email sent for ${ticket.ticket_number} -> ${newStatus}`);

    if (ticket.user_id) {
      const statusLabels: Record<string, string> = { in_progress: "is under review", resolved: "has been resolved" };
      const label = statusLabels[newStatus] || `status changed to ${newStatus}`;
      await Promise.all([
        supabaseClient.from("user_notifications").insert({ user_id: ticket.user_id, type: "support_ticket", title: `Ticket ${ticket.ticket_number} Update`, message: `Your ticket "${ticket.subject}" ${label}.`, metadata: { ticket_number: ticket.ticket_number, ticket_id: ticketId, action: newStatus, action_url: "/my-tickets" }, is_read: false }),
        supabaseClient.from("notifications").insert({ user_id: ticket.user_id, title: `Ticket ${ticket.ticket_number} Update`, body: `Your ticket "${ticket.subject}" ${label}.`, notification_type: "reminder", action_url: "/my-tickets" }),
      ]);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Error in send-ticket-status-email:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
