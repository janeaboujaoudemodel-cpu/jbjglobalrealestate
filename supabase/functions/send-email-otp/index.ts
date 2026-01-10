import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailOTPRequest {
  email: string;
  full_name?: string;
}

async function sendEmailWithResend(to: string, otp: string, fullName?: string): Promise<boolean> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log(`[DEV MODE] Email OTP for ${to}: ${otp}`);
    console.log(`[DEV MODE] No RESEND_API_KEY configured, OTP logged instead of sent`);
    return true;
  }
  
  // Use Resend's default sandbox domain (works without domain verification)
  const fromAddress = "JBJ Global Real Estate <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      reply_to: "contact@jbj.ae",
      to: [to],
      subject: "Your Verification Code - JBJ Global Real Estate",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #000000; border-radius: 16px; overflow: hidden;">
                    <!-- Header with JBJ Monogram on Solid Black Background -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background-color: #000000; border-bottom: 1px solid #333;">
                        <!-- JBJ Monogram Logo - Centered on Black -->
                        <table role="presentation" style="margin: 0 auto;">
                          <tr>
                            <td style="text-align: center;">
                              <div style="width: 100px; height: 100px; margin: 0 auto 16px; background-color: #000000; border: 2px solid #A8925A; border-radius: 50%; display: inline-block; line-height: 96px; text-align: center;">
                                <span style="font-size: 36px; font-weight: bold; color: #A8925A; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 2px;">JBJ</span>
                              </div>
                            </td>
                          </tr>
                        </table>
                        <h1 style="margin: 0; color: #A8925A; font-size: 22px; font-weight: bold; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 1px;">JBJ GLOBAL REAL ESTATE</h1>
                        <p style="margin: 8px 0 0; color: #666666; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">UAE Real Estate Brokerage</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 20px; font-family: Arial, sans-serif;">Email Verification</h2>
                        <p style="margin: 0 0 30px; color: #999999; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">
                          ${fullName ? `Hello ${fullName},` : 'Hello,'}<br><br>
                          Please use the following code to verify your email address:
                        </p>
                        
                        <!-- OTP Code -->
                        <div style="background-color: #1a1a1a; border: 2px solid #A8925A; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
                          <span style="font-size: 36px; font-weight: bold; color: #A8925A; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
                        </div>
                        
                        <p style="margin: 0 0 20px; color: #666666; font-size: 14px; font-family: Arial, sans-serif;">
                          This code is valid for <strong style="color: #999;">10 minutes</strong>.
                        </p>
                        
                        <p style="margin: 0; color: #666666; font-size: 14px; font-family: Arial, sans-serif;">
                          If you didn't request this code, please ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px 30px; background-color: #000000; border-top: 1px solid #333; text-align: center;">
                        <p style="margin: 0 0 8px; color: #999999; font-size: 13px; font-family: Arial, sans-serif;">
                          This is an automated message. Please do not reply directly to this email.
                        </p>
                        <p style="margin: 0 0 12px; color: #A8925A; font-size: 14px; font-weight: bold; font-family: Arial, sans-serif;">
                          Questions? Contact us at:
                        </p>
                        <p style="margin: 0 0 8px; color: #ffffff; font-size: 14px; font-family: Arial, sans-serif;">
                          <a href="mailto:contact@jbj.ae" style="color: #A8925A; text-decoration: none;">contact@jbj.ae</a> 
                          &nbsp;|&nbsp; 
                          <a href="https://wa.me/971565911000" style="color: #A8925A; text-decoration: none;">+971 56 591 1000</a>
                        </p>
                        <p style="margin: 16px 0 0; color: #666666; font-size: 12px; font-family: Arial, sans-serif;">
                          © ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.<br>
                          Downtown Dubai, UAE
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

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Resend API error:", errorText);
    
    // Parse error for better logging
    try {
      const errorJson = JSON.parse(errorText);
      console.error("Resend error details:", {
        statusCode: errorJson.statusCode,
        name: errorJson.name,
        message: errorJson.message,
        fromAddress: fromAddress,
        toAddress: to
      });
      
      // If it's a domain verification issue, provide clear guidance
      if (errorJson.message?.includes('verify a domain')) {
        console.error("ACTION REQUIRED: Verify jbj.ae domain at https://resend.com/domains");
      }
    } catch {
      // Ignore JSON parse errors
    }
    
    return false;
  }

  return true;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name }: EmailOTPRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete any existing OTPs for this email
    await supabase
      .from("email_verifications")
      .delete()
      .eq("email", email.toLowerCase());

    // Store new OTP
    const { error: insertError } = await supabase
      .from("email_verifications")
      .insert({
        email: email.toLowerCase(),
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification code. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email
    const emailSent = await sendEmailWithResend(email, otp, full_name);
    
    if (!emailSent) {
      return new Response(
        JSON.stringify({ error: "Failed to send verification email. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if in dev mode (no Resend key)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent to your email",
        // Only include OTP in development (when Resend not configured)
        ...(!resendApiKey && { dev_otp: otp })
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-email-otp:", error);
    return new Response(
      JSON.stringify({ error: "We're sorry, there was a temporary issue. Please try again or contact us via WhatsApp or email." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
