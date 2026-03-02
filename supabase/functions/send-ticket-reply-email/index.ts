import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Standard Resend API endpoint (Tokyo region is DNS verification location only, API is global)
const RESEND_API_URL = "https://api.resend.com/emails";

async function sendEmail(payload: { from: string; to: string[]; subject: string; html: string }) {
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

// Email Configuration - SUPPORT@JBJ.AE for replies so customers can respond
const SUPPORT_EMAIL = "SUPPORT@JBJ.AE";
const VERIFIED_SENDER = "info@jbj.ae"; // Must use verified sender for 'from'

// Official JBJ emails
const OFFICIAL_EMAILS = {
  support: 'SUPPORT@JBJ.AE',
  contact: 'CONTACT@JBJ.AE',
};

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
      ticketNumber, 
      customerEmail, 
      customerName, 
      replyMessage,
      ticketSubject,
      ticketCategory 
    }: ReplyEmailRequest = await req.json();

    if (!ticketNumber || !customerEmail || !replyMessage) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch ticket details including reopen token
    const { data: ticket } = await supabaseClient
      .from("support_tickets")
      .select("id, reopen_token, subject, service_category, created_at, status")
      .eq("ticket_number", ticketNumber)
      .single();

    const reopenToken = ticket?.reopen_token || "";
    const subject = ticketSubject || ticket?.subject || "Your Support Request";
    const category = ticketCategory || ticket?.service_category || "General";
    const ticketStatus = ticket?.status || "in_progress";
    const isResolved = ticketStatus === "resolved";
    const createdDate = ticket?.created_at 
      ? new Date(ticket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Build reopen URL
    const reopenUrl = `https://jbjglobalrealestate.lovable.app/reopen-ticket?ticket=${ticketNumber}&token=${reopenToken}`;
    
    // WhatsApp link
    const whatsappMessage = encodeURIComponent(`Hi JBJ Support, I'm following up on ticket ${ticketNumber}: ${subject}`);
    const whatsappLink = `https://wa.me/971565911000?text=${whatsappMessage}`;

    // Determine progress step states based on ticket status
    const step1Active = true; // Received is always active
    const step2Active = ticketStatus === "in_progress" || isResolved;
    const step3Active = isResolved;

    // Only show reopen section when ticket is resolved
    const reopenHtml = isResolved ? `
            <!-- Reopen Section - Only for resolved tickets -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:25px 0;">
              <tr><td style="background:linear-gradient(135deg,#fff5f5,#fff0f0);border:2px dashed #e74c3c;border-radius:12px;padding:25px;text-align:center;">
                <p style="color:#c0392b;margin:0 0 10px;font-size:16px;font-weight:bold;">🔄 Issue Not Resolved?</p>
                <p style="color:#666;font-size:13px;margin:0 0 15px;">If you believe your issue is not yet resolved or you need further assistance, you can reopen this ticket:</p>
                <a href="${reopenUrl}" style="display:inline-block;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;text-decoration:none;padding:14px 30px;border-radius:8px;font-weight:bold;font-size:14px;">Reopen This Ticket</a>
              </td></tr>
            </table>` : '';

    const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
@media only screen and (max-width:620px) {
  .wrapper { width:100%!important; }
  .content-pad { padding:24px 16px!important; }
  .hero-pad { padding:32px 20px!important; }
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.1);">

<!-- Header - Full width, touching edges -->
<tr><td class="hero-pad" style="background:linear-gradient(135deg,#000 0%,#1a1a1a 50%,#2d2d2d 100%);padding:40px 30px;text-align:center;">
<p style="color:#C8A766;margin:0 0 10px;font-size:28px;font-weight:bold;">JBJ Global Real Estate</p>
<p style="color:#fff;margin:0 0 20px;font-size:16px;">Update on Your Support Ticket</p>
<!-- Contact row - aligned on same line -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-top:1px solid rgba(200,167,102,0.3);padding-top:20px;">
<tr>
  <td style="padding:8px 20px;"><a href="tel:+971565911000" style="color:#C8A766;text-decoration:none;font-size:14px;">📞 +971 56 591 1000</a></td>
  <td style="padding:8px 20px;"><a href="mailto:${OFFICIAL_EMAILS.support}" style="color:#C8A766;text-decoration:none;font-size:14px;">✉️ ${OFFICIAL_EMAILS.support}</a></td>
</tr>
</table>
<!-- Ticket badge -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:20px;">
<tr><td style="background:rgba(200,167,102,0.2);border:1px solid #C8A766;color:#C8A766;padding:10px 25px;border-radius:25px;font-family:'Courier New',monospace;font-size:18px;font-weight:bold;letter-spacing:2px;">${ticketNumber}</td></tr>
</table>
</td></tr>

<!-- Content -->
<tr><td class="content-pad" style="padding:32px 30px;">
<p style="font-size:15px;color:#333;margin:0 0 16px;">Dear <strong>${customerName}</strong>,</p>
<p style="font-size:14px;color:#555;margin:0 0 24px;">Our support team has reviewed your ticket and provided a response. Please see the details below:</p>

<!-- Progress Tracker - using table for proper circle containment -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:25px 0;">
<tr>
  <td width="33%" style="text-align:center;vertical-align:top;padding:0 8px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
    <tr><td style="width:44px;height:44px;border-radius:50%;${step1Active ? 'background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;' : 'background:#e5e5e5;color:#999;'}text-align:center;vertical-align:middle;font-size:18px;font-weight:bold;line-height:44px;">✓</td></tr>
    </table>
    <p style="font-size:11px;${step1Active ? 'color:#C8A766;font-weight:600;' : 'color:#999;'}text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;">Received</p>
  </td>
  <td width="33%" style="text-align:center;vertical-align:top;padding:0 8px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
    <tr><td style="width:44px;height:44px;border-radius:50%;${step2Active ? 'background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;' : 'background:#e5e5e5;color:#999;'}text-align:center;vertical-align:middle;font-size:18px;font-weight:bold;line-height:44px;">${step2Active ? '✓' : '2'}</td></tr>
    </table>
    <p style="font-size:11px;${step2Active ? 'color:#C8A766;font-weight:600;' : 'color:#999;'}text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;">In Review</p>
  </td>
  <td width="33%" style="text-align:center;vertical-align:top;padding:0 8px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
    <tr><td style="width:44px;height:44px;border-radius:50%;${step3Active ? 'background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;' : 'background:#e5e5e5;color:#999;'}text-align:center;vertical-align:middle;font-size:18px;font-weight:bold;line-height:44px;">${step3Active ? '✓' : '3'}</td></tr>
    </table>
    <p style="font-size:11px;${step3Active ? 'color:#C8A766;font-weight:600;' : 'color:#999;'}text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;">Resolved</p>
  </td>
</tr>
</table>

<!-- Ticket Summary - proper spacing between labels and values -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin:20px 0;">
<tr><td style="padding:25px;">
  <p style="color:#1a1a1a;margin:0 0 20px;font-size:18px;font-weight:bold;border-bottom:1px solid #C8A766;padding-bottom:10px;">📋 Ticket Summary</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e8e8e8;color:#666;font-size:13px;width:40%;">Ticket Number</td>
      <td style="padding:10px 0;border-bottom:1px solid #e8e8e8;color:#C8A766;font-weight:600;font-size:13px;text-align:right;font-family:monospace;">${ticketNumber}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e8e8e8;color:#666;font-size:13px;">Subject</td>
      <td style="padding:10px 0;border-bottom:1px solid #e8e8e8;color:#1a1a1a;font-weight:600;font-size:13px;text-align:right;">${subject}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e8e8e8;color:#666;font-size:13px;">Category</td>
      <td style="padding:10px 0;border-bottom:1px solid #e8e8e8;color:#1a1a1a;font-weight:600;font-size:13px;text-align:right;">${category}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;color:#666;font-size:13px;">Submitted On</td>
      <td style="padding:10px 0;color:#1a1a1a;font-weight:600;font-size:13px;text-align:right;">${createdDate}</td>
    </tr>
  </table>
</td></tr>
</table>

<!-- JBJ Support Team Reply -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:12px;margin:25px 0;">
<tr><td style="padding:25px;">
  <p style="color:#C8A766;margin:0 0 15px;font-size:14px;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">💬 JBJ Support Team</p>
  <div style="color:#333;font-size:15px;line-height:1.8;white-space:pre-wrap;background:#fff;padding:20px;border-radius:8px;border:1px solid #e8e8e8;">${replyMessage}</div>
</td></tr>
</table>

${reopenHtml}

<!-- Action Buttons - Same size -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:25px 0;">
<tr>
  <td width="50%" style="padding:0 6px 0 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background:linear-gradient(135deg,#25D366,#128C7E);border-radius:10px;text-align:center;">
      <a href="${whatsappLink}" style="display:block;padding:16px 10px;color:#fff;text-decoration:none;font-weight:600;font-size:14px;">💬 WhatsApp Support</a>
    </td></tr>
    </table>
  </td>
  <td width="50%" style="padding:0 0 0 6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background:linear-gradient(135deg,#000,#1a1a1a);border:2px solid #C8A766;border-radius:10px;text-align:center;">
      <a href="tel:+971565911000" style="display:block;padding:14px 10px;color:#C8A766;text-decoration:none;font-weight:600;font-size:14px;">📞 Call Us</a>
    </td></tr>
    </table>
  </td>
</tr>
</table>

<!-- Contact Section -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#000,#1a1a1a);border-radius:12px;margin:25px 0;">
<tr><td style="padding:30px;text-align:center;">
  <p style="color:#C8A766;margin:0 0 20px;font-size:18px;font-weight:bold;">Need More Help?</p>
  <!-- Email Support & General Inquiries - aligned same line -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td width="50%" style="text-align:center;padding:10px;vertical-align:top;">
      <p style="color:#C8A766;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 5px;">Email Support</p>
      <a href="mailto:${OFFICIAL_EMAILS.support}" style="color:#fff;text-decoration:none;font-size:14px;">${OFFICIAL_EMAILS.support}</a>
    </td>
    <td width="50%" style="text-align:center;padding:10px;vertical-align:top;">
      <p style="color:#C8A766;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 5px;">General Inquiries</p>
      <a href="mailto:${OFFICIAL_EMAILS.contact}" style="color:#fff;text-decoration:none;font-size:14px;">${OFFICIAL_EMAILS.contact}</a>
    </td>
  </tr>
  </table>
  <!-- Social links - proper spacing between icons -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(200,167,102,0.3);">
  <tr>
    <td style="padding:0 8px;"><a href="https://www.instagram.com/jbjglobalrealestate" target="_blank" style="display:inline-block;padding:8px 18px;background:rgba(200,167,102,0.1);border:1px solid #C8A766;border-radius:20px;color:#C8A766;text-decoration:none;font-size:12px;">Instagram</a></td>
    <td style="padding:0 8px;"><a href="https://www.linkedin.com/company/jbjglobalrealestate" target="_blank" style="display:inline-block;padding:8px 18px;background:rgba(200,167,102,0.1);border:1px solid #C8A766;border-radius:20px;color:#C8A766;text-decoration:none;font-size:12px;">LinkedIn</a></td>
    <td style="padding:0 8px;"><a href="https://www.facebook.com/jbjglobalrealestate" target="_blank" style="display:inline-block;padding:8px 18px;background:rgba(200,167,102,0.1);border:1px solid #C8A766;border-radius:20px;color:#C8A766;text-decoration:none;font-size:12px;">Facebook</a></td>
  </tr>
  </table>
</td></tr>
</table>

<!-- Review & Survey Section -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border-top:2px solid #C8A76633;padding-top:20px;">
<tr><td align="center">
<p style="color:#C8A766;font-size:15px;font-weight:700;margin:0 0 6px;">⭐ We Value Your Feedback</p>
<p style="color:#666;font-size:12px;margin:0 0 14px;">Help us improve our support</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td style="padding:0 6px;"><a href="https://jbjglobalrealestate.lovable.app/reviews?source=ticket" style="display:inline-block;background:linear-gradient(135deg,#C8A766,#B8956E);color:#000;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:12px;">Leave a Review</a></td>
<td style="padding:0 6px;"><a href="https://jbjglobalrealestate.lovable.app/ticket-survey?source=ticket" style="display:inline-block;background:#1a1a2e;border:2px solid #C8A766;color:#C8A766;text-decoration:none;padding:8px 24px;border-radius:8px;font-weight:700;font-size:12px;">Take Survey</a></td>
</tr>
</table>
</td></tr>
</table>

<p style="color:#666;font-size:13px;margin:20px 0 0;">
You can reply directly to this email, and our support team will receive your message. We're here to help!
</p>
</td></tr>

<!-- Footer - Full width, touching edges -->
<tr><td style="background:#1a1a1a;text-align:center;padding:30px;">
<p style="color:#C8A766;font-size:16px;font-weight:bold;margin:0 0 4px;">JBJ Global Real Estate</p>
<p style="color:#666;font-size:11px;margin:0 0 15px;font-style:italic;">Your Trusted Partner in UAE Property</p>
<p style="color:#888;font-size:12px;margin:0 0 5px;">📞 +971 56 591 1000 | ✉️ ${OFFICIAL_EMAILS.support}</p>
<p style="margin:15px 0 0;"><a href="https://jbjglobalrealestate.lovable.app" style="color:#C8A766;text-decoration:none;">Visit Our Website</a></p>
<p style="margin:15px 0 0;font-size:11px;color:#666;">
  This email was sent regarding ticket ${ticketNumber}. Please do not share your ticket number with unauthorized parties.
</p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;

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

  } catch (error) {
    console.error("Error sending reply email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);