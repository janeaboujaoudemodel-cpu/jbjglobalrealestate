import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WelcomeSubscriberRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeSubscriberRequest = await req.json();

    // Validate required fields
    if (!email) {
      throw new Error("Email is required");
    }

    // Send welcome email via direct fetch
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "JBJ Global Real Estate <info@jbj.ae>",
        to: [email],
        subject: "Welcome to JBJ Global Real Estate Newsletter! 🏠",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
              .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 30px; text-align: center; }
              .logo { font-size: 28px; font-weight: bold; color: #D4AF37; letter-spacing: 2px; }
              .content { padding: 40px 30px; }
              .title { font-size: 24px; color: #000000; margin-bottom: 20px; }
              .highlight { background: linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 100%); border-left: 4px solid #D4AF37; padding: 20px; margin: 20px 0; }
              .message { font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 15px; }
              .benefits { list-style: none; padding: 0; }
              .benefits li { padding: 10px 0; padding-left: 30px; position: relative; color: #333; }
              .benefits li::before { content: "✓"; position: absolute; left: 0; color: #D4AF37; font-weight: bold; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); color: #000; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin-top: 20px; }
              .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; }
              .footer-text { color: #888; font-size: 12px; }
              .social { margin-top: 20px; }
              .social a { margin: 0 10px; color: #D4AF37; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">JBJ GLOBAL REAL ESTATE</div>
              </div>
              <div class="content">
                <h1 class="title">Welcome${name ? `, ${name}` : ''}! 🎉</h1>
                <p class="message">
                  Thank you for subscribing to the JBJ Global Real Estate newsletter. 
                  You're now part of an exclusive community that receives the latest updates on:
                </p>
                <ul class="benefits">
                  <li>Premium property listings in Dubai & UAE</li>
                  <li>Market insights and investment opportunities</li>
                  <li>Exclusive off-plan launches and early-bird offers</li>
                  <li>Real estate tips and expert advice</li>
                  <li>VIP events and property viewing invitations</li>
                </ul>
                <div class="highlight">
                  <p style="margin: 0; font-weight: bold; color: #333;">
                    🏆 As a subscriber, you get priority access to our newest listings before they go public!
                  </p>
                </div>
                <p class="message">
                  Start exploring our current listings and find your dream property in the heart of Dubai.
                </p>
                <a href="https://jbj.ae/properties" class="cta-button">
                  Browse Properties →
                </a>
              </div>
              <div class="footer">
                <div class="social">
                  <a href="#">Instagram</a>
                  <a href="#">LinkedIn</a>
                  <a href="#">Facebook</a>
                </div>
                <p class="footer-text">
                  © ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.<br/>
                  Dubai, United Arab Emirates<br/><br/>
                  <a href="#" style="color: #888;">Unsubscribe</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });
    const emailResponse = await emailRes.json();
    if (!emailRes.ok) console.error("Resend API error:", JSON.stringify(emailResponse));

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in welcome-subscriber function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
