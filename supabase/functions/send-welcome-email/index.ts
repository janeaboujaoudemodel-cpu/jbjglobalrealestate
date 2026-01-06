import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const RequestSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email().max(255),
  fullName: z.string().max(200).optional(),
});

serve(async (req) => {
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

    const { userId, email, fullName } = parseResult.data;
    const displayName = fullName || email.split('@')[0];

    console.log(`Sending welcome email to: ${email} (user: ${userId})`);

    // Send welcome email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "JJ Global Capital <welcome@jjglobalcapital.com>",
        to: [email],
        subject: "Welcome to JJ Global Capital - Your UAE Property Journey Begins!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to JJ Global Capital</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px; text-align: center;">
                        <h1 style="color: #d4af37; margin: 0; font-size: 28px; font-weight: 600;">JJ Global Capital</h1>
                        <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Real Estate Brokerage</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="color: #1a1a2e; margin: 0 0 20px 0; font-size: 24px;">Welcome, ${displayName}!</h2>
                        
                        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          Thank you for joining JJ Global Capital. We're thrilled to have you as part of our community of discerning property seekers.
                        </p>
                        
                        <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                          As a Dubai-based real estate brokerage, we specialize in connecting clients with exceptional properties across the UAE.
                        </p>
                        
                        <!-- Features -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                          <tr>
                            <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                              <strong style="color: #1a1a2e;">🏠 AI Property Finder</strong>
                              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Get personalized property recommendations tailored to your preferences.</p>
                            </td>
                          </tr>
                          <tr><td style="height: 10px;"></td></tr>
                          <tr>
                            <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                              <strong style="color: #1a1a2e;">📊 Market Insights</strong>
                              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Access real-time market data and property valuations.</p>
                            </td>
                          </tr>
                          <tr><td style="height: 10px;"></td></tr>
                          <tr>
                            <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                              <strong style="color: #1a1a2e;">✨ Concierge Services</strong>
                              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Luxury travel and property viewing arrangements.</p>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <a href="https://jjglobalcapital.com/properties" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962d 100%); color: #1a1a2e; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                Explore Properties
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #1a1a2e; padding: 30px; text-align: center;">
                        <p style="color: #999; font-size: 14px; margin: 0 0 10px 0;">Need assistance? We're here to help.</p>
                        <p style="color: #d4af37; font-size: 14px; margin: 0;">
                          📧 contact@jjglobalcapital.com | 📞 +971 56 591 1000
                        </p>
                        <p style="color: #666; font-size: 12px; margin: 20px 0 0 0;">
                          JJ Global Capital provides brokerage support and partner introductions only.<br>
                          We do not provide legal, mortgage, financial, or investment advice.
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
    return new Response(
      JSON.stringify({ error: 'Failed to send welcome email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
