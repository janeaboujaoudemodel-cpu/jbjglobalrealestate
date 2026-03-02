import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

    // Send email to support team
    const supportEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #C8A766, #B8956E); padding: 20px; text-align: center; }
          .header h1 { color: #fff; margin: 0; }
          .content { background: #f9f9f9; padding: 20px; }
          .ticket-info { background: #fff; padding: 15px; border-left: 4px solid #C8A766; margin: 15px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; margin-bottom: 10px; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 New Support Ticket</h1>
          </div>
          <div class="content">
            <div class="ticket-info">
              <p class="label">Ticket Number:</p>
              <p class="value" style="font-size: 24px; color: #C8A766; font-weight: bold;">${ticket.ticket_number}</p>
            </div>
            <div class="ticket-info">
              <p class="label">Customer Details:</p>
              <p class="value">Name: ${fullName}</p>
              <p class="value">Email: ${email}</p>
              ${phone ? `<p class="value">Phone: ${phone}</p>` : ""}
            </div>
            <div class="ticket-info">
              <p class="label">Service Category:</p>
              <p class="value">${serviceCategory}</p>
            </div>
            <div class="ticket-info">
              <p class="label">Subject:</p>
              <p class="value">${subject}</p>
            </div>
            <div class="ticket-info">
              <p class="label">Description:</p>
              <p class="value">${description}</p>
            </div>
            ${attachmentUrls.length > 0 ? `
              <div class="ticket-info">
                <p class="label">Attachments:</p>
                ${attachmentUrls.map((url: string) => `<p class="value"><a href="${url}">${url}</a></p>`).join("")}
              </div>
            ` : ""}
          </div>
          <div class="footer">
            <p>This ticket was submitted via JBJ Global Real Estate Support System</p>
          </div>
        </div>
      </body>
      </html>
    `;

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

    // Send confirmation email to customer with premium champagne design
    const customerEmailHtml = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Support Ticket Confirmation</title>
<!--[if mso]><style>table,td{font-family:Arial,sans-serif!important;}</style><![endif]-->
<style type="text/css">
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
table,td{mso-table-lspace:0;mso-table-rspace:0;}
img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
body{margin:0;padding:0;width:100%!important;background-color:#F5EBD7;}
@media only screen and (max-width:620px){
.wrapper{width:100%!important;padding:0 8px!important;}
.hero-pad{padding:32px 20px!important;}
.content-pad{padding:24px 16px!important;}
.btn-full{display:block!important;width:100%!important;text-align:center!important;box-sizing:border-box!important;}
.btn-cell{display:block!important;width:100%!important;padding:4px 0!important;}
.ticket-num{font-size:20px!important;letter-spacing:2px!important;}
.stack{display:block!important;width:100%!important;padding:6px 0!important;text-align:center!important;}
.hide-mobile{display:none!important;}
.mobile-center{text-align:center!important;}
.card-cell{display:block!important;width:100%!important;padding:4px 0!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#F5EBD7;font-family:'Segoe UI',Arial,Helvetica,sans-serif;line-height:1.6;color:#333333;">
<!-- Outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5EBD7;">
<tr><td align="center" style="padding:24px 16px;">

<!-- Main Container 600px -->
<table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#FFFFFF 0%,#FDFBF7 50%,#F5F0E6 100%);border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(200,167,102,0.15);">

<!-- Logo Banner -->
<tr><td style="background:#ffffff;padding:24px 0 16px;text-align:center;border-radius:20px 20px 0 0;">
<img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/jbj-monogram-dark-on-light.png?v=2" alt="JBJ Global Real Estate" width="120" style="max-width:120px;height:auto;" />
</td></tr>

<!-- HERO - Champagne Gold Gradient -->
<tr><td class="hero-pad" style="background:linear-gradient(135deg,#C8A766 0%,#B8956E 50%,#A07D4A 100%);padding:40px 24px;text-align:center;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="font-size:28px;font-weight:bold;color:#1a1a1a;padding-bottom:8px;font-family:'Segoe UI',Arial,sans-serif;">JBJ Global Real Estate</td></tr>
<tr><td style="font-size:16px;color:#2d2d2d;padding-bottom:24px;font-weight:500;">Support Ticket Confirmation</td></tr>
<!-- Premium Gradient Divider -->
<tr><td style="padding-bottom:20px;">
<table role="presentation" width="80%" cellpadding="0" cellspacing="0" border="0" align="center">
<tr><td style="height:3px;background:linear-gradient(90deg,transparent 0%,#1a1a1a 20%,#1a1a1a 80%,transparent 100%);border-radius:2px;"></td></tr>
</table>
</td></tr>
<!-- Contact Info with Premium Icon Badges -->
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td class="stack" style="text-align:center;padding:4px 8px;vertical-align:top;">
<a href="tel:+971565911000" style="color:#1a1a1a;text-decoration:none;font-size:13px;">
<span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#1a1a1a;color:#C8A766;text-align:center;line-height:28px;font-size:14px;margin-bottom:4px;">&#9742;</span><br>
+971 56 591 1000
</a>
</td>
<td class="stack" style="text-align:center;padding:4px 8px;vertical-align:top;">
<a href="mailto:${OFFICIAL_EMAILS.support}" style="color:#1a1a1a;text-decoration:none;font-size:13px;">
<span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#1a1a1a;color:#C8A766;text-align:center;line-height:28px;font-size:14px;margin-bottom:4px;">&#9993;</span><br>
${OFFICIAL_EMAILS.support}
</a>
</td>
</tr>
</table>
</td></tr>
<!-- Additional Contact Emails -->
<tr><td style="padding-top:12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td class="stack" style="text-align:center;padding:3px 6px;vertical-align:top;">
<a href="mailto:${OFFICIAL_EMAILS.contact}" style="color:#2d2d2d;text-decoration:none;font-size:11px;font-weight:600;">${OFFICIAL_EMAILS.contact}</a><br>
<span style="color:#4a3f2f;font-size:10px;">General Inquiries</span>
</td>
<td class="stack" style="text-align:center;padding:3px 6px;vertical-align:top;">
<a href="mailto:${OFFICIAL_EMAILS.partnerships}" style="color:#2d2d2d;text-decoration:none;font-size:11px;font-weight:600;">${OFFICIAL_EMAILS.partnerships}</a><br>
<span style="color:#4a3f2f;font-size:10px;">Partnerships</span>
</td>
<td class="stack" style="text-align:center;padding:3px 6px;vertical-align:top;">
<a href="mailto:${OFFICIAL_EMAILS.careers}" style="color:#2d2d2d;text-decoration:none;font-size:11px;font-weight:600;">${OFFICIAL_EMAILS.careers}</a><br>
<span style="color:#4a3f2f;font-size:10px;">Careers</span>
</td>
</tr>
</table>
</td></tr>
</table>
</td></tr>

<!-- CONTENT -->
<tr><td class="content-pad" style="padding:32px 24px 24px;">

<!-- JBJ Support Header Card - Full width with rounded bottom -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:24px;">
<tr><td style="padding:24px 20px;text-align:center;">
<p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a1a1a;">JBJ Global Real Estate</p>
<p style="margin:0;font-size:13px;color:#C8A766;font-weight:600;">Support Ticket Confirmation</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;border-top:1px solid #C8A766;padding-top:12px;">
<tr><td style="text-align:center;padding:6px 0;"><a href="tel:+971565911000" style="color:#1a1a1a;text-decoration:none;font-size:12px;">&#9742; +971 56 591 1000</a></td></tr>
<tr><td style="text-align:center;padding:6px 0;"><a href="mailto:SUPPORT@JBJ.AE" style="color:#1a1a1a;text-decoration:none;font-size:12px;">&#9993; SUPPORT@JBJ.AE</a></td></tr>
<tr><td style="text-align:center;padding:6px 0;"><a href="https://jbj.ae" style="color:#1a1a1a;text-decoration:none;font-size:12px;">&#127760; jbj.ae</a></td></tr>
</table>
</td></tr>
</table>

<!-- Greeting -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="font-size:15px;color:#333;padding-bottom:16px;">Dear <strong>${fullName}</strong>,</td></tr>
<tr><td style="font-size:14px;color:#555;padding-bottom:24px;">We have received your support request and are sorry to hear you're experiencing an issue. Our team is committed to resolving this as quickly as possible.</td></tr>
</table>

<!-- Progress Tracker -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
<tr>
<td width="33%" style="text-align:center;vertical-align:top;padding:0 4px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;text-align:center;line-height:40px;font-size:16px;font-weight:bold;">&#10003;</td></tr></table>
<p style="font-size:11px;color:#C8A766;text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;font-weight:600;">Received</p>
</td>
<td width="33%" style="text-align:center;vertical-align:top;padding:0 4px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="width:40px;height:40px;border-radius:50%;background:#e5e5e5;color:#999;text-align:center;line-height:40px;font-size:16px;">2</td></tr></table>
<p style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;">In Review</p>
</td>
<td width="33%" style="text-align:center;vertical-align:top;padding:0 4px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="width:40px;height:40px;border-radius:50%;background:#e5e5e5;color:#999;text-align:center;line-height:40px;font-size:16px;">3</td></tr></table>
<p style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;">Resolved</p>
</td>
</tr>
</table>

<!-- Ticket Number Box -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:32px;">
<tr><td style="padding:24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="font-size:16px;font-weight:bold;color:#1a1a1a;padding-bottom:16px;border-bottom:1px solid #C8A766;">
<span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;text-align:center;line-height:24px;font-size:12px;margin-right:8px;">&#9733;</span>
Your Ticket Number</td></tr>
<tr><td style="padding-top:16px;text-align:center;">
<span class="ticket-num" style="font-size:24px;font-weight:bold;color:#C8A766;letter-spacing:3px;font-family:'Courier New',monospace;word-break:break-all;">${ticket.ticket_number}</span>
</td></tr>
<tr><td style="padding-top:16px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
<td class="stack" style="padding:4px 6px;"><span style="display:inline-block;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;background:${priorityInfo.bgColor};color:${priorityInfo.color};border:1px solid ${priorityInfo.color};white-space:nowrap;">${aiAnalyzedPriority.toUpperCase()} PRIORITY</span></td>
<td class="stack" style="padding:4px 6px;"><span style="display:inline-block;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap;">&#9201; Response within ${priorityInfo.label}</span></td>
</tr></table>
</td></tr>
</table>
</td></tr>
</table>

<!-- CTA Buttons -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
<tr>
<td class="btn-cell" width="50%" style="padding:0 6px 0 0;">
<a href="${whatsappLink}" class="btn-full" style="display:block;padding:16px 16px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;text-align:center;background:linear-gradient(135deg,#FDFBF7,#F5F0E6);color:#25D366;border:2px solid #25D366;">&#128172; WhatsApp Follow-up</a>
</td>
<td class="btn-cell" width="50%" style="padding:0 0 0 6px;">
<a href="tel:+971565911000" class="btn-full" style="display:block;padding:16px 16px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;text-align:center;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;">&#9742; Call Support</a>
</td>
</tr>
</table>

<!-- Ticket Summary Table -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:32px;">
<tr><td style="padding:24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="font-size:16px;font-weight:bold;color:#1a1a1a;padding-bottom:16px;border-bottom:1px solid #C8A766;">
<span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;text-align:center;line-height:24px;font-size:12px;margin-right:8px;">&#9998;</span>
Ticket Summary</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
<tr style="border-bottom:1px solid #e8e8e8;"><td style="padding:10px 0;color:#666;font-size:13px;">Ticket Number</td><td style="padding:10px 0;color:#1a1a1a;font-weight:600;font-size:13px;text-align:right;">${ticket.ticket_number}</td></tr>
<tr style="border-bottom:1px solid #e8e8e8;"><td style="padding:10px 0;color:#666;font-size:13px;">Priority Level</td><td style="padding:10px 0;font-weight:600;font-size:13px;text-align:right;color:${priorityInfo.color};">${aiAnalyzedPriority.charAt(0).toUpperCase() + aiAnalyzedPriority.slice(1)}</td></tr>
<tr style="border-bottom:1px solid #e8e8e8;"><td style="padding:10px 0;color:#666;font-size:13px;">Request Type</td><td style="padding:10px 0;color:#1a1a1a;font-weight:600;font-size:13px;text-align:right;">${serviceCategory}</td></tr>
<tr style="border-bottom:1px solid #e8e8e8;"><td style="padding:10px 0;color:#666;font-size:13px;">Subject</td><td style="padding:10px 0;color:#1a1a1a;font-weight:600;font-size:13px;text-align:right;">${subject}</td></tr>
<tr style="border-bottom:1px solid #e8e8e8;"><td style="padding:10px 0;color:#666;font-size:13px;">Submitted</td><td style="padding:10px 0;color:#1a1a1a;font-weight:600;font-size:13px;text-align:right;">${formattedDate} at ${formattedTime}</td></tr>
<tr><td style="padding:10px 0;color:#666;font-size:13px;">Expected Response</td><td style="padding:10px 0;color:#C8A766;font-weight:600;font-size:13px;text-align:right;">Within 24-48 hours</td></tr>
</table>
${attachmentUrls.length > 0 ? `
<!-- Attachments -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;border-top:1px solid #C8A766;padding-top:12px;">
<tr><td style="font-size:14px;font-weight:bold;color:#1a1a1a;padding-bottom:8px;">
<span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;text-align:center;line-height:24px;font-size:12px;margin-right:8px;">&#128206;</span>
Attached Documents (${attachmentUrls.length})</td></tr>
${attachmentUrls.map((url: string, i: number) => {
  const fileName = decodeURIComponent(url.split('/').pop() || `Attachment ${i+1}`).replace(/^\d+-[a-z]+\./, '');
  const ext = (url.split('.').pop() || '').toLowerCase();
  const isImage = ['jpg','jpeg','png','gif','webp'].includes(ext);
  return `<tr><td style="padding:6px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding:10px 14px;background:#ffffff;border:1px solid #C8A766;border-radius:8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="48" style="vertical-align:middle;padding-right:12px;">
${isImage ? `<img src="${url}" width="40" height="40" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #e5e5e5;display:block;" alt="Preview"/>` : `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:40px;height:40px;border-radius:6px;background:#f5f0e6;text-align:center;line-height:40px;font-size:11px;color:#C8A766;font-weight:bold;border:1px solid #e5e5e5;">${ext.toUpperCase()}</td></tr></table>`}
</td>
<td style="vertical-align:middle;font-size:13px;font-weight:500;color:#1a1a1a;">${fileName}</td>
<td width="60" style="vertical-align:middle;text-align:right;">
<a href="${url}" target="_blank" style="color:#1a1a1a;text-decoration:none;font-size:12px;font-weight:600;padding:4px 10px;background:#f5f0e6;border:1px solid #C8A766;border-radius:4px;">View &#8599;</a>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td></tr>`;
}).join('')}
</table>
` : ''}
</td></tr>
</table>

<!-- What happens next -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border-radius:10px;margin-bottom:32px;border:1px solid #C8A766;">
<tr><td style="padding:24px;">
<p style="font-weight:bold;color:#1a1a1a;margin:0 0 12px;font-size:15px;">What happens next?</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:4px 0;font-size:13px;color:#555;">&#8226; Our support team will review your ticket within <strong>24-48 hours</strong></td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#555;">&#8226; You'll receive updates via email as we progress</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#555;">&#8226; Use WhatsApp for urgent follow-ups (include your ticket number)</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#555;">&#8226; Rate your experience once resolved - your feedback matters!</td></tr>
</table>
</td></tr>
</table>

<!-- Warning Box -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border:1px solid #f59e0b;border-radius:10px;margin-bottom:32px;">
<tr><td style="padding:20px 24px;">
<p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;"><strong>&#9888;&#65039; Important:</strong> This is an automatic email generated from our system. <strong>Please do not reply to this email</strong> as we won't receive your message.</p>
</td></tr>
</table>

<!-- Need to Follow Up? - Premium Champagne -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#F5EBD7 0%,#EDE4D3 50%,#E0D4BE 100%);border-radius:12px;margin-bottom:32px;border:2px solid #C8A766;">
<tr><td style="padding:32px 24px;text-align:center;">
<p style="color:#1a1a1a;font-size:18px;font-weight:bold;margin:0 0 8px;">Need to Follow Up?</p>
<p style="color:#2d2d2d;font-size:13px;margin:0 0 20px;">Copy your ticket number and include it in the subject line</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td class="stack" width="50%" style="text-align:center;padding:8px;vertical-align:top;">
<a href="mailto:${OFFICIAL_EMAILS.support}?subject=[Ticket: ${ticket.ticket_number}] Follow-up" style="color:#1a1a1a;text-decoration:none;font-size:13px;">
<span style="display:inline-block;width:36px;height:36px;border-radius:50%;background:#1a1a1a;color:#C8A766;text-align:center;line-height:36px;font-size:18px;margin-bottom:6px;">&#9993;</span><br>
<span style="color:#1a1a1a;font-weight:600;">${OFFICIAL_EMAILS.support}</span><br>
<span style="color:#2d2d2d;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Support Email</span>
</a>
</td>
<td class="stack" width="50%" style="text-align:center;padding:8px;vertical-align:top;">
<a href="tel:+971565911000" style="color:#1a1a1a;text-decoration:none;font-size:13px;">
<span style="display:inline-block;width:36px;height:36px;border-radius:50%;background:#1a1a1a;color:#C8A766;text-align:center;line-height:36px;font-size:18px;margin-bottom:6px;">&#9742;</span><br>
<span style="font-weight:600;">+971 56 591 1000</span><br>
<span style="color:#2d2d2d;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Direct Line</span>
</a>
</td>
</tr>
</table>
<!-- Social Links - Row 1 -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:20px;border-top:1px solid rgba(26,26,26,0.2);padding-top:16px;">
<tr>
<td style="padding:4px 6px;"><a href="https://instagram.com/jbj.ae" style="display:inline-block;padding:6px 14px;background:rgba(26,26,26,0.1);border:2px solid #C8A766;border-radius:20px;color:#1a1a1a;text-decoration:none;font-size:12px;font-weight:600;">Instagram</a></td>
<td style="padding:4px 6px;"><a href="https://facebook.com/jbjglobal" style="display:inline-block;padding:6px 14px;background:rgba(26,26,26,0.1);border:2px solid #C8A766;border-radius:20px;color:#1a1a1a;text-decoration:none;font-size:12px;font-weight:600;">Facebook</a></td>
<td style="padding:4px 6px;"><a href="https://linkedin.com/company/jbjglobal" style="display:inline-block;padding:6px 14px;background:rgba(26,26,26,0.1);border:2px solid #C8A766;border-radius:20px;color:#1a1a1a;text-decoration:none;font-size:12px;font-weight:600;">LinkedIn</a></td>
</tr>
</table>
<!-- Social Links - Row 2 -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:8px;">
<tr>
<td style="padding:4px 6px;"><a href="https://tiktok.com/@jbjglobal" style="display:inline-block;padding:6px 14px;background:rgba(26,26,26,0.1);border:2px solid #C8A766;border-radius:20px;color:#1a1a1a;text-decoration:none;font-size:12px;font-weight:600;">TikTok</a></td>
<td style="padding:4px 6px;"><a href="https://youtube.com/@jbjglobal" style="display:inline-block;padding:6px 14px;background:rgba(26,26,26,0.1);border:2px solid #C8A766;border-radius:20px;color:#1a1a1a;text-decoration:none;font-size:12px;font-weight:600;">YouTube</a></td>
</tr>
</table>
</td></tr>
</table>

<!-- Explore While You Wait - 3x2 Grid Cards -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border-radius:12px;margin-bottom:32px;border:1px solid #C8A766;">
<tr><td style="padding:24px;text-align:center;">
<p style="color:#1a1a1a;font-size:16px;font-weight:bold;margin:0 0 16px;">
<span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;text-align:center;line-height:24px;font-size:12px;margin-right:8px;">&#128279;</span>
Explore While You Wait</p>
<!-- Row 1 -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td class="card-cell" width="33%" style="padding:4px;">
<a href="https://jbj.ae/properties" style="display:block;padding:16px 8px;background:#ffffff;border:2px solid #C8A766;border-radius:10px;text-decoration:none;color:#1a1a1a;font-size:13px;font-weight:600;text-align:center;">Properties</a>
</td>
<td class="card-cell" width="33%" style="padding:4px;">
<a href="https://jbj.ae/services" style="display:block;padding:16px 8px;background:#ffffff;border:2px solid #C8A766;border-radius:10px;text-decoration:none;color:#1a1a1a;font-size:13px;font-weight:600;text-align:center;">Services</a>
</td>
<td class="card-cell" width="33%" style="padding:4px;">
<a href="https://jbj.ae/about" style="display:block;padding:16px 8px;background:#ffffff;border:2px solid #C8A766;border-radius:10px;text-decoration:none;color:#1a1a1a;font-size:13px;font-weight:600;text-align:center;">About Us</a>
</td>
</tr>
</table>
<!-- Row 2 -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td class="card-cell" width="33%" style="padding:4px;">
<a href="https://jbj.ae/market-intelligence" style="display:block;padding:16px 8px;background:#ffffff;border:2px solid #C8A766;border-radius:10px;text-decoration:none;color:#1a1a1a;font-size:13px;font-weight:600;text-align:center;">Market Intelligence</a>
</td>
<td class="card-cell" width="33%" style="padding:4px;">
<a href="https://jbj.ae/buyer-guide" style="display:block;padding:16px 8px;background:#ffffff;border:2px solid #C8A766;border-radius:10px;text-decoration:none;color:#1a1a1a;font-size:13px;font-weight:600;text-align:center;">Buyer Guide</a>
</td>
<td class="card-cell" width="33%" style="padding:4px;">
<a href="https://jbj.ae/ai-tools" style="display:block;padding:16px 8px;background:#ffffff;border:2px solid #C8A766;border-radius:10px;text-decoration:none;color:#1a1a1a;font-size:13px;font-weight:600;text-align:center;">AI Tools</a>
</td>
</tr>
</table>
</td></tr>
</table>

<!-- Rate Your Experience -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin-bottom:32px;">
<tr><td style="padding:24px;text-align:center;">
<p style="color:#1a1a1a;font-size:16px;font-weight:bold;margin:0 0 8px;">Rate Your Experience</p>
<p style="color:#666;font-size:13px;margin:0 0 16px;">How was your ticket submission experience?</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=1" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=2" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=3" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=4" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=5" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
</tr>
</table>
<p style="margin:12px 0 0;"><a href="${surveyLink}" style="color:#C8A766;font-size:12px;text-decoration:underline;">Complete Full Survey &amp; Earn 50 Points</a></p>
</td></tr>
</table>

<!-- Sign-off -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="font-size:14px;color:#333;padding-bottom:8px;">Best regards,<br><span style="color:#C8A766;font-weight:600;">JBJ Global Real Estate Support Team</span></td></tr>
</table>

</td></tr>

<!-- FOOTER -->
<tr><td style="background:#000000;text-align:center;padding:32px 24px;border-radius:0 0 20px 20px;">
<!-- JBJ Monogram -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:12px;">
<tr><td style="text-align:center;"><img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/jbj-monogram-light-on-dark.png?v=2" alt="JBJ" width="80" style="max-width:80px;height:auto;" /></td></tr>
</table>
<p style="color:#C8A766;font-size:18px;font-weight:bold;margin:0 0 6px;">JBJ Global Real Estate</p>
<p style="color:#888;font-size:12px;margin:0 0 4px;font-style:italic;">The Only Global AI-Powered Real Estate Intelligence Platform</p>
<p style="color:#C8A766;font-size:22px;font-weight:bold;margin:12px 0;letter-spacing:1px;">175+ Countries &bull; 2,400+ Cities &bull; 12,000+ Clients Served</p>
<p style="color:#888;font-size:12px;margin:0 0 4px;">Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span></p>
<p style="color:#888;font-size:12px;margin:16px 0 0;">&copy; 2026 JBJ Global Real Estate. All rights reserved.</p>
<p style="color:#666;font-size:10px;margin:10px 0 0;"><strong>This is an automated confirmation. Do not reply to this email.</strong></p>
</td></tr>

</table>
<!-- /Main Container -->

</td></tr>
</table>
</body>
</html>`;

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
