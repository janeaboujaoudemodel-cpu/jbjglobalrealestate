import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { emailShell, sharedSections, progressSteps, ticketSummaryCard, ticketSummaryCardAr, arabicDivider, rateExperienceCard, rateExperienceCardAr, issueNotResolvedCard, issueNotResolvedCardAr, userGreetingRow } from "../_shared/email-html.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const VERIFIED_SENDER = 'jbj@jbj.ae';

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

const priorityLabelsEn: Record<string, string> = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };
const priorityLabelsAr: Record<string, string> = { low: "منخفضة", medium: "متوسطة", high: "عالية", urgent: "عاجلة" };
const categoryLabelsAr: Record<string, string> = {
  "General": "عام",
  "Technical": "تقني",
  "Billing": "الفوترة",
  "Account": "الحساب",
  "Property": "العقار",
  "Partnership": "الشراكة",
};

function formatDetailedDateTime(date: Date, locale: "en-GB" | "ar-AE") {
  const targetLocale = locale === "ar-AE" ? "ar-AE-u-nu-arab" : locale;
  return new Intl.DateTimeFormat(targetLocale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dubai",
  }).format(date);
}

const hasArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

const commonArMap: Record<string, string> = {
  "ticket": "تذكرة",
  "support": "الدعم",
  "issue": "مشكلة",
  "resolved": "تم الحل",
  "review": "مراجعة",
  "in progress": "قيد التنفيذ",
  "in review": "قيد المراجعة",
  "pending": "قيد الانتظار",
  "priority": "الأولوية",
  "billing": "الفوترة",
  "account": "الحساب",
  "technical": "تقني",
  "general": "عام",
  "property": "العقار",
  "partnership": "الشراكة",
  "login": "تسجيل الدخول",
  "name": "الاسم",
  "date": "التاريخ",
  "time": "الوقت",
};

function toArabicText(input?: string | null): string {
  const text = (input || "").trim();
  if (!text) return "";
  if (hasArabic(text)) return text;
  let out = text;
  for (const [en, ar] of Object.entries(commonArMap)) {
    out = out.replace(new RegExp(`\\b${en}\\b`, "gi"), ar);
  }
  return out;
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
    const createdAt = new Date(ticket.created_at);
    const createdDateTimeEn = formatDetailedDateTime(createdAt, "en-GB");
    const createdDateTimeAr = formatDetailedDateTime(createdAt, "ar-AE");
    const priority = ticket.priority || "medium";
    const priorityEn = priorityLabelsEn[priority] || "Medium";
    const priorityAr = priorityLabelsAr[priority] || "متوسطة";
    const categoryEn = ticket.service_category || "General";
    const categoryAr = categoryLabelsAr[categoryEn] || categoryEn;
    const reopenUrl = `https://jbj.ae/reopen-ticket?ticket=${encodeURIComponent(ticket.ticket_number)}&token=${ticket.reopen_token || ''}`;

    const statusContent: Record<string, { title: string; titleAr: string; subtitle: string; subtitleAr: string; steps: [boolean, boolean, boolean]; checks: [boolean, boolean, boolean]; }> = {
      in_progress: {
        title: "Your Ticket Is Being Reviewed",
        titleAr: "تذكرتك قيد المراجعة",
        subtitle: "Our support team is now actively reviewing your ticket. We'll get back to you shortly.",
        subtitleAr: "فريق الدعم لدينا يراجع تذكرتك الآن. سنعود إليك قريباً.",
        steps: [true, true, false], checks: [true, true, false],
      },
      resolved: {
        title: "Your Ticket Has Been Resolved",
        titleAr: "تم حل تذكرتك",
        subtitle: "We're pleased to let you know that your support ticket has been resolved.",
        subtitleAr: "يسعدنا إبلاغك بأن تذكرة الدعم الخاصة بك قد تم حلها.",
        steps: [true, true, true], checks: [true, true, true],
      },
    };

    const normalizedStatus = newStatus === "closed" ? "resolved" : newStatus;
    const content = statusContent[normalizedStatus];
    if (!content) {
      return new Response(JSON.stringify({ error: "Unsupported status for email" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminNoteArText = toArabicText(adminNote);
    const adminNoteHtml = adminNote ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #93c5fd;border-radius:18px;overflow:hidden;margin-bottom:24px;"><tr><td style="padding:20px;"><p style="font-weight:700;color:#1d4ed8;margin:0 0 8px;">Admin Note:</p><p style="color:#1e3a8a;margin:0;line-height:1.7;">${adminNote}</p></td></tr></table>` : '';
    const adminNoteHtmlAr = adminNote ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #93c5fd;border-radius:18px;overflow:hidden;margin-bottom:24px;direction:rtl;"><tr><td style="padding:20px;"><p style="font-weight:700;color:#1d4ed8;margin:0 0 8px;">ملاحظة الإدارة:</p><p style="color:#1e3a8a;margin:0;line-height:1.7;">${adminNoteArText}</p></td></tr></table>` : '';

    const isResolved = normalizedStatus === 'resolved';
    const rateHtml = isResolved ? rateExperienceCard(surveyLink) : '';
    const rateHtmlAr = isResolved ? rateExperienceCardAr(surveyLink) : '';
    const reopenHtml = isResolved ? issueNotResolvedCard(reopenUrl) : '';
    const reopenHtmlAr = isResolved ? issueNotResolvedCardAr(reopenUrl) : '';

    const bodyContent = `<tr><td class="content-pad" style="padding:32px;">
${userGreetingRow(ticket.full_name)}
<p style="font-size:14px;color:#555;margin:0 0 24px;">${content.subtitle}</p>
${progressSteps(['Received', 'In Review', 'Resolved'], content.steps, content.checks)}
${ticketSummaryCard([
  { label: 'Ticket Number', value: ticket.ticket_number, highlight: true },
  { label: 'Subject', value: ticket.subject },
  { label: 'Category', value: categoryEn },
  { label: 'Priority', value: priorityEn },
  { label: 'Submitted', value: createdDateTimeEn },
])}
${adminNoteHtml}
${rateHtml}
${reopenHtml}
${arabicDivider()}
<div style="direction:rtl;text-align:right;">
${userGreetingRow(ticket.full_name, true)}
<p style="font-size:14px;color:#555;margin:0 0 24px;">${content.subtitleAr}</p>
${ticketSummaryCardAr([
  { label: 'رقم التذكرة', value: ticket.ticket_number, highlight: true },
  { label: 'الموضوع', value: toArabicText(ticket.subject) },
  { label: 'الفئة', value: toArabicText(categoryAr) },
  { label: 'الأولوية', value: priorityAr },
  { label: 'تاريخ ووقت الإرسال', value: createdDateTimeAr },
])}
${adminNoteHtmlAr}
${rateHtmlAr}
${reopenHtmlAr}
</div>
${sharedSections("support ticket", "JBJ Global Real Estate Support Team")}
</td></tr>`;

    const emailHtml = emailShell("Support Ticket Update", bodyContent);
    const subjectLine = normalizedStatus === 'resolved'
      ? `[${ticket.ticket_number}] Your Ticket Has Been Resolved`
      : `[${ticket.ticket_number}] Your Ticket Is Being Reviewed`;

    const result = await sendEmail({ from: `JBJ Support <${VERIFIED_SENDER}>`, to: [ticket.email], subject: subjectLine, html: emailHtml });

    if (result.error) {
      console.error("Status email failed:", result.error);
      return new Response(JSON.stringify({ error: "Email send failed", details: result.error }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`Status email sent for ${ticket.ticket_number} -> ${newStatus}`);

    if (ticket.user_id) {
      const statusLabels: Record<string, string> = { in_progress: "is under review", resolved: "has been resolved", closed: "has been resolved" };
      const label = statusLabels[normalizedStatus] || `status changed to ${normalizedStatus}`;
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
