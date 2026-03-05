import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { emailShell, sharedSections, progressSteps, ticketSummaryCard, ticketSummaryCardAr, arabicDivider, userGreetingRow } from "../_shared/email-html.ts";

// Standard Resend API endpoint (Tokyo region is DNS verification location only, API is global)
const RESEND_API_URL = "https://api.resend.com/emails";

async function sendEmail(payload: { from: string; to: string[]; subject: string; html: string; bcc?: string[] }) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Resend API error:", JSON.stringify(data));
    return { error: data };
  }
  return { data };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Email Rule: ALL CAPS for JBJ.AE emails
const OFFICIAL_EMAILS = {
  support: 'SUPPORT@JBJ.AE',
  contact: 'CONTACT@JBJ.AE',
  privacy: 'PRIVACY@JBJ.AE',
  careers: 'CAREERS@JBJ.AE',
  partnerships: 'PARTNERSHIPS@JBJ.AE',
  security: 'SECURITY@JBJ.AE',
};

// Verified sender domain for outgoing emails
const VERIFIED_SENDER = 'contact@jbj.ae';

interface TicketRequest {
  fullName: string;
  email: string;
  phone?: string;
  serviceCategory: string;
  subject: string;
  description: string;
  priority?: string;
  escalateToTech?: boolean;
  attachmentUrls?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      fullName,
      email,
      phone,
      serviceCategory,
      subject,
      description,
      priority = "normal",
      escalateToTech = false,
      attachmentUrls = []
    }: TicketRequest = await req.json();

    // Validate required fields
    if (!fullName || !email || !serviceCategory || !subject || !description) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user ID if authenticated
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await supabaseClient.auth.getUser(
        authHeader.replace("Bearer ", "")
      );
      userId = user?.id || null;
    }

    // AI Priority Analysis - detect actual severity based on keywords
    const analyzePriority = (desc: string, subj: string, userPriority: string): string => {
      const text = `${desc} ${subj}`.toLowerCase();
      
      const criticalKeywords = ['urgent', 'emergency', 'cannot access', 'locked out', 'security breach', 
        'data loss', 'payment failed', 'money lost', 'critical', 'immediately', 'down', 'not working at all'];
      
      const highKeywords = ['important', 'asap', 'broken', 'error', 'failed', 'stuck', 'blocked',
        'cannot login', 'not loading', 'crash', 'freeze'];
      
      const lowKeywords = ['suggestion', 'feature request', 'would be nice', 'minor', 'small issue',
        'when you have time', 'not urgent'];
      
      let detectedPriority = userPriority;
      
      if (criticalKeywords.some(kw => text.includes(kw))) {
        detectedPriority = 'critical';
      } else if (highKeywords.some(kw => text.includes(kw))) {
        detectedPriority = detectedPriority === 'low' || detectedPriority === 'normal' ? 'high' : detectedPriority;
      } else if (lowKeywords.some(kw => text.includes(kw))) {
        detectedPriority = detectedPriority === 'critical' || detectedPriority === 'high' ? 'normal' : 'low';
      }
      
      return detectedPriority;
    };

    const aiAnalyzedPriority = analyzePriority(description, subject, priority);

    // Insert ticket into database
    const { data: ticket, error: insertError } = await supabaseClient
      .from("support_tickets")
      .insert({
        user_id: userId,
        full_name: fullName,
        email: email,
        phone: phone || null,
        service_category: serviceCategory,
        subject: subject,
        description: description,
        attachment_urls: attachmentUrls,
        status: "open",
        priority: aiAnalyzedPriority,
        escalate_to_tech: escalateToTech,
        user_selected_priority: priority,
        ai_analyzed_priority: aiAnalyzedPriority
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create ticket" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Ticket created:", ticket.ticket_number);

    // Send email to support team using unified shared template
    const supportEmailHtml = emailShell("Support Team Alert", `<tr><td class="content-pad" style="padding:32px;">
<p style="font-size:15px;color:#333;margin:0 0 16px;">A new support ticket has been created and needs review.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Ticket Summary</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:7px 0;color:#666;font-size:13px;width:40%;">Ticket Number</td><td style="padding:7px 0;color:#C8A766;font-weight:700;font-size:14px;font-family:'Courier New',monospace;">${ticket.ticket_number}</td></tr>
<tr><td style="padding:7px 0;color:#666;font-size:13px;">Service Category</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${serviceCategory}</td></tr>
<tr><td style="padding:7px 0;color:#666;font-size:13px;">Priority</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;text-transform:capitalize;">${aiAnalyzedPriority}</td></tr>
<tr><td style="padding:7px 0;color:#666;font-size:13px;">Submitted By</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;">${fullName}</td></tr>
<tr><td style="padding:7px 0;color:#666;font-size:13px;">Email</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;"><a href="mailto:${email}" style="color:#1a1a1a;text-decoration:underline;">${email}</a></td></tr>
${phone ? `<tr><td style="padding:7px 0;color:#666;font-size:13px;">Phone</td><td style="padding:7px 0;color:#1a1a1a;font-weight:600;font-size:13px;"><a href="tel:${phone}" style="color:#1a1a1a;text-decoration:underline;">${phone}</a></td></tr>` : ""}
</table>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="margin:0 0 8px;font-size:12px;color:#C8A766;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;">Subject</p>
<p style="margin:0;color:#333;font-size:14px;line-height:1.7;">${subject}</p>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="margin:0 0 8px;font-size:12px;color:#C8A766;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;">Issue Description</p>
<div style="margin:0;color:#333;font-size:14px;line-height:1.8;white-space:pre-wrap;background:#fff;padding:16px;border-radius:12px;border:1px solid #e8e8e8;">${description}</div>
</td></tr></table>
${attachmentUrls.length > 0 ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fdfbf7;border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;"><tr><td style="padding:20px;"><p style="margin:0 0 8px;font-size:12px;color:#666;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Attachments</p>${attachmentUrls.map((url: string) => `<p style="margin:6px 0;"><a href="${url}" style="color:#1a1a1a;text-decoration:underline;font-size:13px;">${url}</a></p>`).join("")}</td></tr></table>` : ""}
${sharedSections("support ticket", "JBJ Global Real Estate Support Team")}
</td></tr>`);

    // Track email delivery status
    let supportEmailSent = false;
    let customerEmailSent = false;
    let customerEmailError: string | null = null;
    let customerEmailMessageId: string | null = null;

    // Calculate SLA based on priority
    const now = new Date();
    const priorityConfig: Record<string, { hours: number; label: string; color: string; bgColor: string }> = {
      critical: { hours: 4, label: "2-4 hours", color: "#dc2626", bgColor: "#fef2f2" },
      high: { hours: 12, label: "8-12 hours", color: "#ea580c", bgColor: "#fff7ed" },
      normal: { hours: 48, label: "24-48 hours", color: "#2563eb", bgColor: "#eff6ff" },
      low: { hours: 72, label: "48-72 hours", color: "#16a34a", bgColor: "#f0fdf4" }
    };
    const priorityInfo = priorityConfig[aiAnalyzedPriority] || priorityConfig.normal;
    const slaDueDate = new Date(now.getTime() + priorityInfo.hours * 60 * 60 * 1000);
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const formattedSlaDate = slaDueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedSlaTime = slaDueDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    // WhatsApp link with pre-filled message
    const whatsappMessage = encodeURIComponent(`Hi JBJ Support Team, I'm following up on my ticket ${ticket.ticket_number}. My issue: ${subject}`);
    const whatsappLink = `https://wa.me/971565911000?text=${whatsappMessage}`;

    // Survey link
    const surveyLink = `https://jbj.ae/ticket-survey?ticket=${encodeURIComponent(ticket.ticket_number)}&email=${encodeURIComponent(email)}`;

    // Send confirmation email to customer using unified shared template
    const customerEmailHtml = emailShell("Support Ticket Confirmation", `<tr><td class="content-pad" style="padding:32px;">
${userGreetingRow(fullName)}
<p style="font-size:14px;color:#555;margin:0 0 24px;">Your support ticket has been received and our team is now reviewing it.</p>
${progressSteps(['Received', 'In Review', 'Resolved'], [true, false, false], [true, false, false])}
${ticketSummaryCard([
  { label: 'Ticket Number', value: ticket.ticket_number, highlight: true },
  { label: 'Subject', value: subject },
  { label: 'Category', value: serviceCategory },
  { label: 'Priority', value: aiAnalyzedPriority },
  { label: 'Submitted', value: `${formattedDate} ${formattedTime}` },
])}
${arabicDivider()}
<div style="direction:rtl;text-align:right;">
${userGreetingRow(fullName, true)}
<p style="font-size:14px;color:#555;margin:0 0 24px;">تم استلام تذكرة الدعم الخاصة بك ويقوم فريقنا حالياً بمراجعتها.</p>
${ticketSummaryCardAr([
  { label: 'رقم التذكرة', value: ticket.ticket_number, highlight: true },
  { label: 'الموضوع', value: subject },
  { label: 'الفئة', value: serviceCategory },
  { label: 'الأولوية', value: aiAnalyzedPriority },
  { label: 'تاريخ ووقت الإرسال', value: `${formattedDate} ${formattedTime}` },
])}
</div>
${sharedSections("support ticket", "JBJ Support Team")}
</td></tr>`);

    // Send BOTH emails in parallel for faster response
    const [supportEmailResult, customerEmailResult] = await Promise.allSettled([
      // Support team email
      sendEmail({
        from: `JBJ Support <contact@jbj.ae>`,
        to: [OFFICIAL_EMAILS.support],
        subject: `[${ticket.ticket_number}] New Support Ticket: ${subject}`,
        html: supportEmailHtml,
      }),
      // Customer confirmation email
      sendEmail({
        from: `JBJ Support <contact@jbj.ae>`,
        to: [email],
        subject: `Ticket Received: ${ticket.ticket_number} - We're on it!`,
        html: customerEmailHtml,
      })
    ]);

    // Process support email result
    if (supportEmailResult.status === 'fulfilled') {
      const result = supportEmailResult.value as any;
      if (result?.error) {
        console.error("Support email failed:", result.error);
      } else {
        supportEmailSent = true;
        console.log("Support email sent to team");
      }
    } else {
      console.error("Failed to send support email:", supportEmailResult.reason);
    }

    // Process customer email result
    if (customerEmailResult.status === 'fulfilled') {
      const result = customerEmailResult.value as any;
      if (result?.error) {
        customerEmailError = result.error?.message || result.error?.name || JSON.stringify(result.error).substring(0, 200);
        console.error("Customer email FAILED:", result.error);
      } else if (result?.data?.id) {
        customerEmailSent = true;
        customerEmailMessageId = result.data.id;
        console.log("Customer confirmation email SENT successfully, ID:", customerEmailMessageId);
      } else {
        customerEmailError = "Unexpected email response format";
        console.error("Unexpected Resend response:", JSON.stringify(result));
      }
    } else {
      customerEmailError = customerEmailResult.reason instanceof Error 
        ? customerEmailResult.reason.message.substring(0, 200) 
        : "Network error sending email";
      console.error("Failed to send customer email (rejected):", customerEmailResult.reason);
    }

    // Update ticket with accurate email delivery status
    try {
      await supabaseClient
        .from("support_tickets")
        .update({
          customer_confirmation_sent_at: customerEmailSent ? new Date().toISOString() : null,
          customer_confirmation_status: customerEmailSent ? 'sent' : 'failed',
          customer_confirmation_error: customerEmailError,
          customer_confirmation_message_id: customerEmailMessageId,
        })
        .eq("id", ticket.id);
    } catch (updateError) {
      console.error("Failed to update ticket with email status:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticketNumber: ticket.ticket_number,
        message: "Your support ticket has been created successfully",
        customerEmailSent,
        customerEmailError: customerEmailSent ? null : (customerEmailError || "Confirmation email could not be sent. Please save your ticket number."),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in submit-support-ticket:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
