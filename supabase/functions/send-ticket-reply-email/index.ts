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
const VERIFIED_SENDER = "NOREPLY@JBJ.AE"; // Must use verified sender for 'from'

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
    const createdDate = ticket?.created_at 
      ? new Date(ticket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Build reopen URL
    const reopenUrl = `https://jbjglobalrealestate.lovable.app/reopen-ticket?ticket=${ticketNumber}&token=${reopenToken}`;
    
    // WhatsApp link
    const whatsappMessage = encodeURIComponent(`Hi JBJ Support, I'm following up on ticket ${ticketNumber}: ${subject}`);
    const whatsappLink = `https://wa.me/971565911000?text=${whatsappMessage}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; }
          .hero { background: linear-gradient(135deg, #000 0%, #1a1a1a 50%, #2d2d2d 100%); padding: 40px 30px; text-align: center; }
          .hero h1 { color: #C8A766; margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }
          .hero p { color: #fff; margin: 0; font-size: 16px; }
          .hero-contact { margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(200,167,102,0.3); }
          .hero-contact-item { display: inline-block; margin: 8px 15px; }
          .hero-contact-item a { color: #C8A766; text-decoration: none; font-size: 14px; }
          .ticket-badge { display: inline-block; background: rgba(200,167,102,0.2); border: 1px solid #C8A766; color: #C8A766; padding: 10px 25px; border-radius: 25px; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; margin-top: 20px; letter-spacing: 2px; }
          .content { padding: 30px; background: #fff; }
          .progress-tracker { display: table; width: 100%; margin: 25px 0; }
          .progress-step { display: table-cell; text-align: center; position: relative; width: 33.33%; }
          .progress-step .circle { width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
          .progress-step.active .circle { background: linear-gradient(135deg, #C8A766, #B8956E); color: #fff; }
          .progress-step.pending .circle { background: #e5e5e5; color: #999; }
          .progress-step .label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
          .progress-step.active .label { color: #C8A766; font-weight: 600; }
          .ticket-summary { background: linear-gradient(135deg, #fdfbf7, #f5f0e6); border: 2px solid #C8A766; border-radius: 12px; padding: 25px; margin: 20px 0; }
          .ticket-summary h3 { color: #1a1a1a; margin: 0 0 20px 0; font-size: 18px; border-bottom: 1px solid #C8A766; padding-bottom: 10px; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8e8e8; }
          .summary-row:last-child { border-bottom: none; }
          .summary-label { color: #666; font-size: 13px; }
          .summary-value { color: #1a1a1a; font-weight: 600; font-size: 13px; text-align: right; }
          .reply-box { background: linear-gradient(135deg, #fdfbf7, #f5f0e6); border: 2px solid #C8A766; border-radius: 12px; padding: 25px; margin: 25px 0; }
          .reply-box h3 { color: #C8A766; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; }
          .reply-content { color: #333; font-size: 15px; line-height: 1.8; white-space: pre-wrap; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e8e8e8; }
          .reopen-section { background: linear-gradient(135deg, #fff5f5, #fff0f0); border: 2px dashed #e74c3c; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
          .reopen-section h4 { color: #c0392b; margin: 0 0 10px 0; font-size: 16px; }
          .reopen-section p { color: #666; font-size: 13px; margin: 0 0 15px 0; }
          .reopen-btn { display: inline-block; background: linear-gradient(135deg, #e74c3c, #c0392b); color: #fff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 14px; }
          .reopen-btn:hover { opacity: 0.9; }
          .action-buttons { display: table; width: 100%; margin: 25px 0; }
          .action-btn { display: table-cell; width: 50%; padding: 5px; text-align: center; }
          .action-btn a { display: block; padding: 14px 20px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; }
          .btn-whatsapp { background: linear-gradient(135deg, #25D366, #128C7E); color: #fff; }
          .btn-call { background: linear-gradient(135deg, #000, #1a1a1a); color: #C8A766; border: 2px solid #C8A766; }
          .contact-hero { background: linear-gradient(135deg, #000, #1a1a1a); padding: 30px; text-align: center; margin: 25px 0; border-radius: 12px; }
          .contact-hero h3 { color: #C8A766; margin: 0 0 20px 0; font-size: 18px; }
          .contact-grid { display: table; width: 100%; }
          .contact-item { display: table-cell; width: 50%; text-align: center; padding: 10px; vertical-align: top; }
          .contact-item a { color: #fff; text-decoration: none; font-size: 14px; display: block; }
          .contact-item .label { color: #C8A766; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
          .social-links { margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(200,167,102,0.3); }
          .social-links a { display: inline-block; margin: 0 10px; padding: 8px 16px; background: rgba(200,167,102,0.1); border: 1px solid #C8A766; border-radius: 20px; color: #C8A766; text-decoration: none; font-size: 12px; }
          .footer { background: #1a1a1a; text-align: center; padding: 30px; color: #888; font-size: 12px; }
          .footer-brand { color: #C8A766; font-size: 16px; font-weight: bold; margin-bottom: 10px; }
          .footer-tagline { color: #666; font-size: 11px; margin-bottom: 15px; }
          .footer p { margin: 5px 0; }
          .gold { color: #C8A766; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Hero Section -->
          <div class="hero">
            <h1>JBJ Global Real Estate</h1>
            <p>Update on Your Support Ticket</p>
            <div class="hero-contact">
              <span class="hero-contact-item">
                <a href="tel:+971565911000">📞 +971 56 591 1000</a>
              </span>
              <span class="hero-contact-item">
                <a href="mailto:${OFFICIAL_EMAILS.support}">✉️ ${OFFICIAL_EMAILS.support}</a>
              </span>
            </div>
            <div class="ticket-badge">${ticketNumber}</div>
          </div>
          
          <div class="content">
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>Our support team has reviewed your ticket and provided a response. Please see the details below:</p>
            
            <!-- Visual Progress Tracker -->
            <div class="progress-tracker">
              <div class="progress-step active">
                <div class="circle">✓</div>
                <div class="label">Received</div>
              </div>
              <div class="progress-step active">
                <div class="circle">✓</div>
                <div class="label">In Review</div>
              </div>
              <div class="progress-step pending">
                <div class="circle">3</div>
                <div class="label">Resolved</div>
              </div>
            </div>
            
            <!-- Ticket Summary -->
            <div class="ticket-summary">
              <h3>📋 Ticket Summary</h3>
              <div class="summary-row">
                <span class="summary-label">Ticket Number</span>
                <span class="summary-value" style="color: #C8A766; font-family: monospace;">${ticketNumber}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Subject</span>
                <span class="summary-value">${subject}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Category</span>
                <span class="summary-value">${category}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Submitted On</span>
                <span class="summary-value">${createdDate}</span>
              </div>
            </div>
            
            <!-- JBJ Support Team Reply -->
            <div class="reply-box">
              <h3>💬 JBJ Support Team</h3>
              <div class="reply-content">${replyMessage}</div>
            </div>
            
            <!-- Reopen Section -->
            <div class="reopen-section">
              <h4>🔄 Issue Not Resolved?</h4>
              <p>If you believe your issue is not yet resolved or you need further assistance, you can reopen this ticket:</p>
              <a href="${reopenUrl}" class="reopen-btn">Reopen This Ticket</a>
            </div>
            
            <!-- Action Buttons -->
            <div class="action-buttons">
              <div class="action-btn">
                <a href="${whatsappLink}" class="btn-whatsapp">💬 WhatsApp Support</a>
              </div>
              <div class="action-btn">
                <a href="tel:+971565911000" class="btn-call">📞 Call Us</a>
              </div>
            </div>
            
            <!-- Contact Section -->
            <div class="contact-hero">
              <h3>Need More Help?</h3>
              <div class="contact-grid">
                <div class="contact-item">
                  <div class="label">Email Support</div>
                  <a href="mailto:${OFFICIAL_EMAILS.support}">${OFFICIAL_EMAILS.support}</a>
                </div>
                <div class="contact-item">
                  <div class="label">General Inquiries</div>
                  <a href="mailto:${OFFICIAL_EMAILS.contact}">${OFFICIAL_EMAILS.contact}</a>
                </div>
              </div>
              <div class="social-links">
                <a href="https://www.instagram.com/jbjglobalrealestate" target="_blank">Instagram</a>
                <a href="https://www.linkedin.com/company/jbjglobalrealestate" target="_blank">LinkedIn</a>
                <a href="https://www.facebook.com/jbjglobalrealestate" target="_blank">Facebook</a>
              </div>
            </div>
            
            <p style="color: #666; font-size: 13px; margin-top: 20px;">
              You can reply directly to this email, and our support team will receive your message. We're here to help!
            </p>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div class="footer-brand">JBJ Global Real Estate</div>
            <div class="footer-tagline">Your Trusted Partner in UAE Property</div>
            <p>📞 +971 56 591 1000 | ✉️ ${OFFICIAL_EMAILS.support}</p>
            <p style="margin-top: 15px;">
              <a href="https://jbjglobalrealestate.lovable.app" style="color: #C8A766; text-decoration: none;">Visit Our Website</a>
            </p>
            <p style="margin-top: 15px; font-size: 11px; color: #666;">
              This email was sent regarding ticket ${ticketNumber}. Please do not share your ticket number with unauthorized parties.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

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
