import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || 
    origin.endsWith(".lovableproject.com") || 
    origin.endsWith(".lovable.app")
  );
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Input validation schema
const RequestSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email().max(255),
  fullName: z.string().max(200).optional(),
  userRole: z.enum(["broker", "investor", "visitor"]).optional(),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify this is a legitimate internal call (from auth trigger or admin)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      // Allow service-to-service calls without auth header if coming from Supabase
      const isInternalCall = req.headers.get('x-supabase-webhook') === 'true';
      if (!isInternalCall) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Parse and validate input
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.log('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, email, fullName, userRole } = parseResult.data;
    const displayName = fullName || email.split('@')[0];
    const role = userRole || "visitor";

    console.log(`Sending welcome email to: ${email} (user: ${userId}, role: ${role})`);

    // Role-based email subject and content
    const subjectByRole = {
      broker: "Welcome to the JBJ Broker Circle! 🎉",
      investor: "Welcome to JBJ Global Real Estate - Your Investment Journey Begins! 🏠",
      visitor: "Welcome to JBJ Global Real Estate!",
    };

    const ctaByRole = {
      broker: { text: "Access Broker Toolkit", url: "https://jbj.ae/broker-toolkit" },
      investor: { text: "Explore Properties", url: "https://jbj.ae/properties" },
      visitor: { text: "Start Browsing", url: "https://jbj.ae/properties" },
    };

    const benefitsByRole = {
      broker: `
        <tr>
          <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
            <strong style="color: #1a1a2e;">🎯 Free AI Tools</strong>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Unlimited access to property analysis, market reports, and smart recommendations.</p>
          </td>
        </tr>
        <tr><td style="height: 10px;"></td></tr>
        <tr>
          <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <strong style="color: #1a1a2e;">📚 Free Training Academy</strong>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Complete courses and videos to boost your real estate career.</p>
          </td>
        </tr>
        <tr><td style="height: 10px;"></td></tr>
        <tr>
          <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <strong style="color: #1a1a2e;">👩‍💼 Dedicated HR Manager & Personal Assistant</strong>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Jessica and our team provide dedicated support for all your inquiries.</p>
          </td>
        </tr>
        <tr><td style="height: 10px;"></td></tr>
        <tr>
          <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <strong style="color: #1a1a2e;">🏆 Property Coach</strong>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Direct access to expert guidance for your property deals.</p>
          </td>
        </tr>
      `,
      investor: `
        <tr>
          <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
            <strong style="color: #1a1a2e;">🏠 Premium Properties</strong>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Browse exclusive listings across Dubai and the UAE.</p>
          </td>
        </tr>
        <tr><td style="height: 10px;"></td></tr>
        <tr>
          <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <strong style="color: #1a1a2e;">📊 AI Property Analysis</strong>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Smart insights and ROI calculations for better investment decisions.</p>
          </td>
        </tr>
        <tr><td style="height: 10px;"></td></tr>
        <tr>
          <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <strong style="color: #1a1a2e;">📈 Market Reports</strong>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Stay informed with the latest UAE real estate trends.</p>
          </td>
        </tr>
      `,
      visitor: `
        <tr>
          <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
            <strong style="color: #1a1a2e;">🏠 Browse Properties</strong>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Explore our curated selection of UAE properties.</p>
          </td>
        </tr>
        <tr><td style="height: 10px;"></td></tr>
        <tr>
          <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <strong style="color: #1a1a2e;">❤️ Save Favorites</strong>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Shortlist properties you love for easy access.</p>
          </td>
        </tr>
        <tr><td style="height: 10px;"></td></tr>
        <tr>
          <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <strong style="color: #1a1a2e;">💬 Expert Support</strong>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Our team is ready to answer your questions.</p>
          </td>
        </tr>
      `,
    };

    // Send welcome email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "JBJ Global Real Estate <info@jbj.ae>",
        to: [email],
        subject: subjectByRole[role],
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to JBJ Global Real Estate</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px; text-align: center;">
                        <h1 style="color: #d4af37; margin: 0; font-size: 28px; font-weight: 600;">JBJ Global Real Estate</h1>
                        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Real Estate Brokerage</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="color: #1a1a2e; margin: 0 0 20px 0; font-size: 24px;">Welcome, ${displayName}!</h2>
                        
                        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          Thank you for joining JBJ Global Real Estate. We're thrilled to have you as part of our community of discerning property seekers.
                        </p>
                        
                        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                          As a Dubai-based real estate brokerage, we specialize in connecting clients with exceptional properties across the UAE.
                        </p>
                        
                        <!-- Features -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                          ${benefitsByRole[role]}
                        </table>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <a href="${ctaByRole[role].url}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962d 100%); color: #1a1a2e; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                ${ctaByRole[role].text}
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Quick Links Section -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f9f9f9;">
                        <h3 style="color: #1a1a2e; margin: 0 0 15px 0; font-size: 16px; text-align: center;">🔗 Explore Our Platform</h3>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <a href="https://jbj.ae/properties" style="display: inline-block; margin: 5px; padding: 8px 16px; border: 1px solid #C8A766; border-radius: 6px; color: #C8A766; text-decoration: none; font-size: 13px;">Properties</a>
                              <a href="https://jbj.ae/services" style="display: inline-block; margin: 5px; padding: 8px 16px; border: 1px solid #C8A766; border-radius: 6px; color: #C8A766; text-decoration: none; font-size: 13px;">Services</a>
                              <a href="https://jbj.ae/about" style="display: inline-block; margin: 5px; padding: 8px 16px; border: 1px solid #C8A766; border-radius: 6px; color: #C8A766; text-decoration: none; font-size: 13px;">About Us</a>
                              <a href="https://jbj.ae/market-intelligence" style="display: inline-block; margin: 5px; padding: 8px 16px; border: 1px solid #C8A766; border-radius: 6px; color: #C8A766; text-decoration: none; font-size: 13px;">Market Intelligence</a>
                              <a href="https://jbj.ae/buyer-guide" style="display: inline-block; margin: 5px; padding: 8px 16px; border: 1px solid #C8A766; border-radius: 6px; color: #C8A766; text-decoration: none; font-size: 13px;">Buyer Guide</a>
                              <a href="https://jbj.ae/contact" style="display: inline-block; margin: 5px; padding: 8px 16px; border: 1px solid #C8A766; border-radius: 6px; color: #C8A766; text-decoration: none; font-size: 13px;">Contact</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Social Media & Contact Footer -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); padding: 35px; text-align: center;">
                        <!-- Contact Info -->
                        <p style="color: #C8A766; font-size: 14px; margin: 0 0 15px 0;">Need assistance? We're here to help.</p>
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                          <tr>
                            <td align="center">
                              <a href="tel:+971565911000" style="color: #fff; text-decoration: none; font-size: 14px; margin: 0 15px;">📞 +971 56 591 1000</a>
                              <a href="mailto:Contact@JBJ.ae" style="color: #fff; text-decoration: none; font-size: 14px; margin: 0 15px;">✉️ Contact@JBJ.ae</a>
                              <a href="mailto:Support@JBJ.ae" style="color: #fff; text-decoration: none; font-size: 14px; margin: 0 15px;">🎫 Support@JBJ.ae</a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Social Media Links -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                          <tr>
                            <td align="center">
                              <a href="https://instagram.com/jbj.ae" style="display: inline-block; margin: 0 8px; padding: 8px 16px; background: rgba(200,167,102,0.1); border: 1px solid #C8A766; border-radius: 20px; color: #C8A766; text-decoration: none; font-size: 12px;">Instagram</a>
                              <a href="https://facebook.com/jbjglobal" style="display: inline-block; margin: 0 8px; padding: 8px 16px; background: rgba(200,167,102,0.1); border: 1px solid #C8A766; border-radius: 20px; color: #C8A766; text-decoration: none; font-size: 12px;">Facebook</a>
                              <a href="https://linkedin.com/company/jbjglobal" style="display: inline-block; margin: 0 8px; padding: 8px 16px; background: rgba(200,167,102,0.1); border: 1px solid #C8A766; border-radius: 20px; color: #C8A766; text-decoration: none; font-size: 12px;">LinkedIn</a>
                              <a href="https://wa.me/971565911000" style="display: inline-block; margin: 0 8px; padding: 8px 16px; background: rgba(200,167,102,0.1); border: 1px solid #C8A766; border-radius: 20px; color: #C8A766; text-decoration: none; font-size: 12px;">WhatsApp</a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Brand Attribution -->
                        <p style="color: #C8A766; font-size: 14px; margin: 0 0 5px 0; font-weight: 600;">JBJ Global Real Estate</p>
                        <p style="color: #888; font-size: 12px; margin: 0 0 10px 0;">First Global Real Estate Platform of Its Kind</p>
                        <p style="color: #666; font-size: 11px; margin: 0 0 15px 0;">
                          Developed, Created & Implemented by The Founder & CEO, <span style="color: #C8A766;">Jane Bou Jaoude</span>
                        </p>
                        
                        <p style="color: #555; font-size: 11px; margin: 15px 0 0 0;">
                          JBJ Global Real Estate provides brokerage support and partner introductions only.<br>
                          We do not provide legal, mortgage, financial, or advisory services.
                        </p>
                        <p style="color: #444; font-size: 10px; margin: 15px 0 0 0;">
                          © 2026 JBJ Global Real Estate. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error('Failed to send email via Resend');
    }

    const emailResult = await emailResponse.json();
    console.log("Welcome email sent successfully:", emailResult);

    // Log the welcome email in database for tracking
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('leads').upsert({
      email,
      full_name: fullName,
      source: 'signup_welcome_email',
    }, { onConflict: 'email' });

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: 'Failed to send welcome email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
