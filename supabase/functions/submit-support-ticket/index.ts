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
const VERIFIED_SENDER = 'NOREPLY@JBJ.AE';

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
      
      // Critical keywords
      const criticalKeywords = ['urgent', 'emergency', 'cannot access', 'locked out', 'security breach', 
        'data loss', 'payment failed', 'money lost', 'critical', 'immediately', 'down', 'not working at all'];
      
      // High priority keywords  
      const highKeywords = ['important', 'asap', 'broken', 'error', 'failed', 'stuck', 'blocked',
        'cannot login', 'not loading', 'crash', 'freeze'];
      
      // Low priority keywords
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
      low: { hours: 72, label: "48-72 hours", color: "#6b7280", bgColor: "#f9fafb" }
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

    // Send confirmation email to customer with enhanced design
    const customerEmailHtml = `
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
          .hero-contact-item a:hover { text-decoration: underline; }
          .content { padding: 30px; background: #fff; }
          .progress-tracker { display: table; width: 100%; margin: 25px 0; }
          .progress-step { display: table-cell; text-align: center; position: relative; width: 33.33%; }
          .progress-step .circle { width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
          .progress-step.active .circle { background: linear-gradient(135deg, #C8A766, #B8956E); color: #fff; }
          .progress-step.pending .circle { background: #e5e5e5; color: #999; }
          .progress-step .label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
          .progress-step.active .label { color: #C8A766; font-weight: 600; }
          .progress-line { position: absolute; top: 20px; left: 50%; width: 100%; height: 2px; background: #e5e5e5; z-index: 0; }
          .progress-step:last-child .progress-line { display: none; }
          .priority-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .ticket-summary { background: linear-gradient(135deg, #fdfbf7, #f5f0e6); border: 2px solid #C8A766; border-radius: 12px; padding: 25px; margin: 20px 0; }
          .ticket-summary h3 { color: #1a1a1a; margin: 0 0 20px 0; font-size: 18px; border-bottom: 1px solid #C8A766; padding-bottom: 10px; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8e8e8; }
          .summary-row:last-child { border-bottom: none; }
          .summary-label { color: #666; font-size: 13px; }
          .summary-value { color: #1a1a1a; font-weight: 600; font-size: 13px; text-align: right; }
          .ticket-box { background: linear-gradient(135deg, #fdfbf7, #f5f0e6); border: 2px solid #C8A766; border-radius: 12px; padding: 25px; margin: 25px 0; }
          .ticket-box h3 { color: #1a1a1a; margin: 0 0 20px 0; font-size: 18px; border-bottom: 1px solid #C8A766; padding-bottom: 10px; }
          .ticket-number-row { display: flex; align-items: center; justify-content: space-between; }
          .ticket-number { font-size: 24px; font-weight: bold; color: #C8A766; letter-spacing: 3px; font-family: 'Courier New', monospace; }
          .copy-btn { background: linear-gradient(135deg, #C8A766, #B8956E); border: none; color: #fff; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; }
          .copy-btn:hover { opacity: 0.9; }
          .sla-badge { background: #000; color: #C8A766; padding: 10px 24px; border-radius: 25px; display: inline-block; margin-top: 15px; font-size: 13px; font-weight: 600; }
          .message { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .warning-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .warning-box strong { color: #856404; }
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
          .contact-item .icon { font-size: 20px; margin-bottom: 5px; }
          .contact-item .label { color: #C8A766; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
          .social-links { margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(200,167,102,0.3); }
          .social-links a { display: inline-block; margin: 0 10px; padding: 8px 16px; background: rgba(200,167,102,0.1); border: 1px solid #C8A766; border-radius: 20px; color: #C8A766; text-decoration: none; font-size: 12px; }
          .quick-links { background: #f9f9f9; padding: 25px; margin: 25px 0; border-radius: 12px; }
          .quick-links h3 { color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px; text-align: center; }
          .links-grid { text-align: center; }
          .link-item { display: inline-block; margin: 5px 10px; }
          .link-item a { color: #C8A766; text-decoration: none; font-size: 13px; padding: 8px 16px; border: 1px solid #C8A766; border-radius: 6px; display: inline-block; }
          .link-item a:hover { background: #C8A766; color: #000; }
          .footer { background: #1a1a1a; text-align: center; padding: 30px; color: #888; font-size: 12px; }
          .footer-brand { color: #C8A766; font-size: 16px; font-weight: bold; margin-bottom: 10px; }
          .footer-tagline { color: #666; font-size: 11px; margin-bottom: 15px; }
          .footer p { margin: 5px 0; }
          .gold { color: #C8A766; }
          .rating-stars { margin: 15px 0; }
          .rating-stars span { font-size: 18px; color: #C8A766; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Hero Section with Contact Info -->
          <div class="hero">
            <h1>JBJ Global Real Estate</h1>
            <p>Support Ticket Confirmation</p>
            <div class="hero-contact">
              <span class="hero-contact-item">
                <a href="tel:+971565911000">📞 +971 56 591 1000</a>
              </span>
              <span class="hero-contact-item">
                <a href="mailto:${OFFICIAL_EMAILS.support}"">✉️ ${OFFICIAL_EMAILS.support}</a>
              </span>
              <span class="hero-contact-item">
                <a href="mailto:${OFFICIAL_EMAILS.contact}">📧 ${OFFICIAL_EMAILS.contact}</a>
              </span>
            </div>
          </div>
          
          <div class="content">
            <p>Dear <strong>${fullName}</strong>,</p>
            <p>We have received your support request and are sorry to hear you're experiencing an issue. Our team is committed to resolving this as quickly as possible.</p>
            
            <!-- Visual Progress Tracker -->
            <div class="progress-tracker">
              <div class="progress-step active">
                <div class="progress-line"></div>
                <div class="circle">✓</div>
                <div class="label">Received</div>
              </div>
              <div class="progress-step pending">
                <div class="progress-line"></div>
                <div class="circle">2</div>
                <div class="label">In Review</div>
              </div>
              <div class="progress-step pending">
                <div class="circle">3</div>
                <div class="label">Resolved</div>
              </div>
            </div>
            
            <!-- Ticket Number Box -->
            <div class="ticket-box">
              <h3>🎫 Your Ticket Number</h3>
              <div class="ticket-number-row">
                <span class="ticket-number">${ticket.ticket_number}</span>
                <button class="copy-btn" onclick="navigator.clipboard.writeText('${ticket.ticket_number}'); this.innerHTML='✓ Copied!';">
                  📋 Copy
                </button>
              </div>
              <div style="margin-top: 15px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <span class="priority-badge" style="background: ${priorityInfo.bgColor}; color: ${priorityInfo.color}; border: 1px solid ${priorityInfo.color};">
                  ${aiAnalyzedPriority.toUpperCase()} PRIORITY
                </span>
                <span class="sla-badge">⏱️ Response within ${priorityInfo.label}</span>
              </div>
            </div>

            <!-- Quick Action Buttons -->
            <div class="action-buttons">
              <div class="action-btn">
                <a href="${whatsappLink}" class="btn-whatsapp">💬 WhatsApp Follow-up</a>
              </div>
              <div class="action-btn">
                <a href="tel:+971565911000" class="btn-call">📞 Call Support</a>
              </div>
            </div>

            <!-- Ticket Summary -->
            <div class="ticket-summary">
              <h3>📋 Ticket Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e8e8e8;">
                  <td style="padding: 10px 0; color: #666; font-size: 13px;">Ticket Number</td>
                  <td style="padding: 10px 0; color: #1a1a1a; font-weight: 600; font-size: 13px; text-align: right;">${ticket.ticket_number}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e8e8e8;">
                  <td style="padding: 10px 0; color: #666; font-size: 13px;">Priority Level</td>
                  <td style="padding: 10px 0; font-weight: 600; font-size: 13px; text-align: right; color: ${priorityInfo.color};">${aiAnalyzedPriority.charAt(0).toUpperCase() + aiAnalyzedPriority.slice(1)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e8e8e8;">
                  <td style="padding: 10px 0; color: #666; font-size: 13px;">Request Type</td>
                  <td style="padding: 10px 0; color: #1a1a1a; font-weight: 600; font-size: 13px; text-align: right;">${serviceCategory}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e8e8e8;">
                  <td style="padding: 10px 0; color: #666; font-size: 13px;">Subject</td>
                  <td style="padding: 10px 0; color: #1a1a1a; font-weight: 600; font-size: 13px; text-align: right;">${subject}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e8e8e8;">
                  <td style="padding: 10px 0; color: #666; font-size: 13px;">Submitted</td>
                  <td style="padding: 10px 0; color: #1a1a1a; font-weight: 600; font-size: 13px; text-align: right;">${formattedDate} at ${formattedTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 13px;">Expected Response</td>
                  <td style="padding: 10px 0; color: #C8A766; font-weight: 600; font-size: 13px; text-align: right;">By ${formattedSlaDate} ${formattedSlaTime}</td>
                </tr>
              </table>
            </div>

            <div class="message">
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our support team will review your ticket within <strong>${priorityInfo.label}</strong></li>
                <li>You'll receive updates via email as we progress</li>
                <li>Use WhatsApp for urgent follow-ups (include your ticket number)</li>
                <li>Rate your experience once resolved - your feedback matters!</li>
              </ul>
            </div>

            <div class="warning-box">
              <strong>⚠️ Important:</strong> This is an automatic email generated from our system. <strong>Please do not reply to this email</strong> as we won't receive your message.
            </div>

            <!-- Contact Hero Section -->
            <div class="contact-hero">
              <h3>Need to Follow Up?</h3>
              <p style="color: #aaa; font-size: 13px; margin: 0 0 15px 0;">Copy your ticket number and include it in the subject line</p>
              <div class="contact-grid">
                <div class="contact-item">
                  <a href="mailto:${OFFICIAL_EMAILS.support}?subject=[Ticket: ${ticket.ticket_number}] Follow-up">
                    <span class="icon">✉️</span><br>
                    ${OFFICIAL_EMAILS.support}<br>
                    <span class="label">Support Email</span>
                  </a>
                </div>
                <div class="contact-item">
                  <a href="tel:+971565911000">
                    <span class="icon">📞</span><br>
                    +971 56 591 1000<br>
                    <span class="label">Direct Line</span>
                  </a>
                </div>
              </div>
              
              <!-- Social Media Links -->
              <div class="social-links">
                <a href="https://instagram.com/jbj.ae">Instagram</a>
                <a href="https://facebook.com/jbjglobal">Facebook</a>
                <a href="https://linkedin.com/company/jbjglobal">LinkedIn</a>
                <a href="https://wa.me/971565911000">WhatsApp</a>
              </div>
            </div>

            <!-- Quick Links Section -->
            <div class="quick-links">
              <h3>🔗 Explore While You Wait</h3>
              <div class="links-grid">
                <span class="link-item"><a href="https://jbj.ae/properties">Properties</a></span>
                <span class="link-item"><a href="https://jbj.ae/services">Our Services</a></span>
                <span class="link-item"><a href="https://jbj.ae/about">About Us</a></span>
                <span class="link-item"><a href="https://jbj.ae/market-intelligence">Market Intelligence</a></span>
                <span class="link-item"><a href="https://jbj.ae/buyer-guide">Buyer Guide</a></span>
                <span class="link-item"><a href="https://jbj.ae/seller-guide">Seller Guide</a></span>
                <span class="link-item"><a href="https://jbj.ae/contact">Contact</a></span>
              </div>
            </div>

            <p>Best regards,<br><span class="gold">JBJ Global Real Estate Support Team</span></p>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p class="footer-brand">JBJ Global Real Estate</p>
            <p class="footer-tagline">First Global Real Estate Platform of Its Kind</p>
            <p>Developed, Created & Implemented by The Founder & CEO, <span class="gold">Jane Bou Jaoude</span></p>
            <p style="margin-top: 15px;">© 2026 JBJ Global Real Estate. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 10px; color: #666;"><strong>This is an automated confirmation. Do not reply to this email.</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send BOTH emails in parallel for faster response
    const [supportEmailResult, customerEmailResult] = await Promise.allSettled([
      // Support team email
      sendEmail({
        from: `JBJ Support <${VERIFIED_SENDER}>`,
        to: [OFFICIAL_EMAILS.support],
        subject: `[${ticket.ticket_number}] New Support Ticket: ${subject}`,
        html: supportEmailHtml,
      }),
      // Customer confirmation email
      sendEmail({
        from: `JBJ Support <${VERIFIED_SENDER}>`,
        to: [email],
        subject: `Ticket Received: ${ticket.ticket_number} - We're on it!`,
        html: customerEmailHtml,
      })
    ]);

    // Process support email result
    if (supportEmailResult.status === 'fulfilled') {
      const result = supportEmailResult.value as any;
      // Resend returns { data, error } - check for error field
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
