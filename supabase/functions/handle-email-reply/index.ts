import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email Rule: First letter capitalized, JBJ always in capitals
const OFFICIAL_EMAILS = {
  support: 'Support@JBJ.ae',
  contact: 'Contact@JBJ.ae',
  privacy: 'Privacy@JBJ.ae',
};

interface InboundEmail {
  from: string;
  to: string;
  subject?: string;
  text?: string;
  html?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const inboundData: InboundEmail = await req.json();
    const senderEmail = inboundData.from;
    const originalSubject = inboundData.subject || "Your Email";

    console.log("Received reply email from:", senderEmail);

    // Extract ticket number if present in subject
    const ticketMatch = originalSubject.match(/JBJ-\d{8}-\d{4}/);
    const ticketNumber = ticketMatch ? ticketMatch[0] : null;

    // Send auto-reply bounce message
    const bounceEmailHtml = `
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
          .content { padding: 30px; background: #fff; }
          .error-box { background: linear-gradient(135deg, #fee2e2, #fecaca); border: 2px solid #ef4444; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; }
          .error-icon { font-size: 48px; margin-bottom: 15px; }
          .error-title { color: #dc2626; font-size: 20px; font-weight: bold; margin: 0 0 10px 0; }
          .error-message { color: #7f1d1d; font-size: 14px; margin: 0; }
          .info-box { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .info-box h3 { color: #0369a1; margin: 0 0 10px 0; font-size: 16px; }
          .info-box p { color: #0c4a6e; margin: 5px 0; font-size: 14px; }
          .contact-section { background: linear-gradient(135deg, #000, #1a1a1a); padding: 30px; text-align: center; margin: 25px 0; border-radius: 12px; }
          .contact-section h3 { color: #C8A766; margin: 0 0 20px 0; font-size: 18px; }
          .contact-btn { display: inline-block; background: linear-gradient(135deg, #C8A766, #B8956E); color: #000; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; font-size: 14px; margin: 10px; }
          .contact-btn:hover { opacity: 0.9; }
          .contact-link { color: #C8A766; text-decoration: none; font-size: 14px; display: block; margin: 8px 0; }
          .footer { background: #1a1a1a; text-align: center; padding: 30px; color: #888; font-size: 12px; }
          .footer-brand { color: #C8A766; font-size: 16px; font-weight: bold; margin-bottom: 10px; }
          .social-links { margin-top: 15px; }
          .social-links a { display: inline-block; margin: 0 8px; padding: 6px 12px; background: rgba(200,167,102,0.1); border: 1px solid #C8A766; border-radius: 15px; color: #C8A766; text-decoration: none; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Hero Section -->
          <div class="hero">
            <h1>JBJ Global Real Estate</h1>
            <p>Delivery Status Notification</p>
          </div>
          
          <div class="content">
            <!-- Error Box -->
            <div class="error-box">
              <div class="error-icon">🚫</div>
              <p class="error-title">Message Could Not Be Delivered</p>
              <p class="error-message">This email address does not accept incoming messages.<br>Your reply was not received by our support team.</p>
            </div>

            <div class="info-box">
              <h3>📧 Why am I seeing this?</h3>
              <p>The email address you replied to (<strong>onboarding@resend.dev</strong>) is an automated system that cannot receive replies.</p>
              <p>To contact our support team, please use one of the methods below.</p>
            </div>

            ${ticketNumber ? `
            <div class="info-box" style="background: #f0fdf4; border-color: #22c55e;">
              <h3 style="color: #166534;">📋 We Found Your Ticket</h3>
              <p style="color: #15803d;">Ticket Number: <strong>${ticketNumber}</strong></p>
              <p style="color: #15803d;">Please include this number when contacting us.</p>
            </div>
            ` : ''}

            <!-- Contact Section -->
            <div class="contact-section">
              <h3>How to Reach Our Support Team</h3>
              <p style="color: #aaa; font-size: 13px; margin: 0 0 20px 0;">Choose your preferred method to contact us</p>
              
              <a href="mailto:${OFFICIAL_EMAILS.support}?subject=${ticketNumber ? `[Ticket: ${ticketNumber}] Follow-up` : 'Support Request'}" class="contact-btn">
                ✉️ Email Support
              </a>
              <a href="https://wa.me/971565911000" class="contact-btn">
                💬 WhatsApp
              </a>
              <a href="tel:+971565911000" class="contact-btn">
                📞 Call Us
              </a>
              
              <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(200,167,102,0.3);">
                <a href="mailto:${OFFICIAL_EMAILS.support}" class="contact-link">${OFFICIAL_EMAILS.support}</a>
                <a href="mailto:${OFFICIAL_EMAILS.contact}" class="contact-link">${OFFICIAL_EMAILS.contact}</a>
                <a href="tel:+971565911000" class="contact-link">+971 56 591 1000</a>
              </div>
            </div>

            <p style="text-align: center; color: #666; font-size: 13px;">
              We apologize for any inconvenience. Our team is ready to assist you through the channels above.
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p class="footer-brand">JBJ Global Real Estate</p>
            <p>Your Trusted Partner in UAE Real Estate</p>
            <div class="social-links">
              <a href="https://instagram.com/jbj.ae">Instagram</a>
              <a href="https://facebook.com/jbjglobal">Facebook</a>
              <a href="https://linkedin.com/company/jbjglobal">LinkedIn</a>
            </div>
            <p style="margin-top: 15px; color: #555;">© 2024 JBJ Global Real Estate. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the bounce/auto-reply message
    try {
      await resend.emails.send({
        from: "JBJ Support <onboarding@resend.dev>",
        to: [senderEmail],
        subject: `Delivery Failed: ${originalSubject}`,
        html: bounceEmailHtml,
      });
      console.log("Bounce email sent to:", senderEmail);
    } catch (emailError) {
      console.error("Failed to send bounce email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send bounce email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Bounce email sent",
        sender: senderEmail,
        ticketNumber: ticketNumber 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error handling email reply:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
