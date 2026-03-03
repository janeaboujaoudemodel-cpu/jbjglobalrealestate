import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { emailShell, sharedSections, progressSteps, teamReplyCard, ticketSummaryCard, ticketSummaryCardAr, arabicDivider, rateExperienceCard, rateExperienceCardAr, issueNotResolvedCard, issueNotResolvedCardAr } from "../_shared/email-html.ts";

const RESEND_API_URL = "https://api.resend.com/emails";

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VERIFIED_SENDER = "contact@jbj.ae";

const priorityLabelsEn: Record<string, string> = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
const priorityLabelsAr: Record<string, string> = { low: "منخفضة", medium: "متوسطة", high: "عالية", urgent: "عاجلة" };
const categoryLabelsAr: Record<string, string> = { "General": "عام", "Technical": "تقني", "Billing": "الفوترة", "Account": "الحساب", "Property": "العقار", "Partnership": "الشراكة" };

interface ReplyEmailRequest {
  ticketNumber: string;
  customerEmail: string;
  customerName: string;
  replyMessage: string;
  ticketSubject?: string;
  ticketCategory?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      ticketNumber, customerEmail, customerName, replyMessage, ticketSubject, ticketCategory
    }: ReplyEmailRequest = await req.json();

    if (!ticketNumber || !customerEmail || !replyMessage) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: ticket } = await supabaseClient
      .from("support_tickets")
      .select("id, reopen_token, subject, service_category, created_at, status, priority")
      .eq("ticket_number", ticketNumber)
      .single();

    const reopenToken = ticket?.reopen_token || "";
    const subject = ticketSubject || ticket?.subject || "Your Support Request";
    const categoryEn = ticketCategory || ticket?.service_category || "General";
    const categoryAr = categoryLabelsAr[categoryEn] || categoryEn;
    const ticketStatus = ticket?.status || "in_progress";
    const isResolved = ticketStatus === "resolved";
    const priority = ticket?.priority || "medium";
    const priorityEn = priorityLabelsEn[priority] || "Medium";
    const priorityAr = priorityLabelsAr[priority] || "متوسطة";
    const createdAt = ticket?.created_at ? new Date(ticket.created_at) : new Date();
    const createdDate = createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const createdTime = createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
    const createdDateTime = `${createdDate}, ${createdTime}`;

    const reopenUrl = `https://jbj.ae/reopen-ticket?ticket=${ticketNumber}&token=${reopenToken}`;
    const surveyLink = `https://jbj.ae/ticket-survey?ticket=${encodeURIComponent(ticketNumber)}&email=${encodeURIComponent(customerEmail)}`;

    const step1 = true;
    const step2 = ticketStatus === "in_progress" || isResolved;
    const step3 = isResolved;

    const reopenHtml = isResolved ? issueNotResolvedCard(reopenUrl) : '';
    const reopenHtmlAr = isResolved ? issueNotResolvedCardAr(reopenUrl) : '';
    const rateHtml = isResolved ? rateExperienceCard(surveyLink) : '';
    const rateHtmlAr = isResolved ? rateExperienceCardAr(surveyLink) : '';

    // BILINGUAL: EN → Arabic divider → AR → Gold divider → Locked sections
    const bodyContent = `<tr><td class="content-pad" style="padding:32px;">
<p style="font-size:15px;color:#333;margin:0 0 16px;">Dear <strong>${customerName}</strong>,</p>
<p style="font-size:14px;color:#555;margin:0 0 24px;">Our support team has reviewed your ticket and provided a response below.</p>
${progressSteps(['Received', 'In Review', 'Resolved'], [step1, step2, step3], [step1, step2, step3])}
${ticketSummaryCard([
  { label: 'Ticket Number', value: ticketNumber, highlight: true },
  { label: 'Subject', value: subject },
  { label: 'Category', value: categoryEn },
  { label: 'Priority', value: priorityEn },
  { label: 'Submitted', value: createdDateTime },
])}
${teamReplyCard("JBJ Support Team Reply", replyMessage)}
${rateHtml}
${reopenHtml}
${arabicDivider()}
</td></tr>
<tr><td class="content-pad" style="padding:0 32px 32px;direction:rtl;text-align:right;">
<p style="font-size:15px;color:#333;margin:0 0 16px;">عزيزي/عزيزتي <strong>${customerName}</strong>،</p>
<p style="font-size:14px;color:#555;margin:0 0 24px;">قام فريق الدعم لدينا بمراجعة تذكرتك وقدم رداً أدناه.</p>
${ticketSummaryCardAr([
  { label: 'رقم التذكرة', value: ticketNumber, highlight: true },
  { label: 'الموضوع', value: subject },
  { label: 'الفئة', value: categoryAr },
  { label: 'الأولوية', value: priorityAr },
  { label: 'تاريخ ووقت الإرسال', value: createdDateTime },
])}
${teamReplyCard("رد فريق دعم JBJ", replyMessage)}
${rateHtmlAr}
${reopenHtmlAr}
${sharedSections("support ticket", "JBJ Global Real Estate Support Team")}
</td></tr>`;

    const emailHtml = emailShell("Support Ticket Update", bodyContent);

    const emailResult = await sendEmail({
      from: `JBJ Support <${VERIFIED_SENDER}>`,
      to: [customerEmail],
      subject: `[${ticketNumber}] Update on Your Support Ticket`,
      html: emailHtml,
    });

    console.log("Reply email sent:", emailResult);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult?.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error sending reply email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
