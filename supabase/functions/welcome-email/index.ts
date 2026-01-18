import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  employeeName: string;
  employeeEmail: string;
  employeeRole: string;
  department: string;
  managerName?: string;
  startDate?: string;
  portalUrl?: string;
}

const generateWelcomeEmailHTML = (data: WelcomeEmailRequest): string => {
  const startDate = data.startDate || new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to JBJ Global Real Estate</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0D0D0D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0D0D0D; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1A1A1A; border-radius: 16px; overflow: hidden; border: 1px solid #D4AF37;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: bold;">Welcome to JBJ Global Real Estate</h1>
              <p style="margin: 10px 0 0; color: #1A1A1A; font-size: 14px;">Where Excellence Meets Opportunity</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #FFFFFF; font-size: 18px; margin: 0 0 20px;">Dear ${data.employeeName},</p>
              
              <p style="color: #CCCCCC; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
                We are thrilled to welcome you to the JBJ Global Real Estate family! Your journey with us begins on <strong style="color: #D4AF37;">${startDate}</strong>.
              </p>
              
              <p style="color: #CCCCCC; font-size: 15px; line-height: 1.8; margin: 0 0 25px;">
                As our new <strong style="color: #D4AF37;">${data.employeeRole}</strong> in the <strong style="color: #D4AF37;">${data.department}</strong> department, you'll be joining a team of dedicated professionals committed to excellence in the UAE real estate market.
              </p>
              
              ${data.managerName ? `
              <div style="background-color: #252525; border-left: 4px solid #D4AF37; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #CCCCCC; margin: 0; font-size: 14px;">
                  <strong style="color: #D4AF37;">Your Manager:</strong> ${data.managerName}
                </p>
                <p style="color: #999999; margin: 5px 0 0; font-size: 13px;">
                  They will be your primary point of contact and guide during your onboarding.
                </p>
              </div>
              ` : ''}
              
              <!-- What to Expect Section -->
              <h2 style="color: #D4AF37; font-size: 18px; margin: 30px 0 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">What to Expect</h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                <tr>
                  <td width="40" valign="top" style="padding: 10px 0;">
                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #D4AF37, #B8860B); border-radius: 50%; text-align: center; line-height: 32px; color: #000; font-weight: bold;">1</div>
                  </td>
                  <td style="padding: 10px 0 10px 15px; color: #CCCCCC; font-size: 14px;">
                    <strong style="color: #FFFFFF;">Onboarding & Training</strong><br>
                    Comprehensive training on our systems, processes, and company culture
                  </td>
                </tr>
                <tr>
                  <td width="40" valign="top" style="padding: 10px 0;">
                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #D4AF37, #B8860B); border-radius: 50%; text-align: center; line-height: 32px; color: #000; font-weight: bold;">2</div>
                  </td>
                  <td style="padding: 10px 0 10px 15px; color: #CCCCCC; font-size: 14px;">
                    <strong style="color: #FFFFFF;">Team Introduction</strong><br>
                    Meet your colleagues and understand the team dynamics
                  </td>
                </tr>
                <tr>
                  <td width="40" valign="top" style="padding: 10px 0;">
                    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #D4AF37, #B8860B); border-radius: 50%; text-align: center; line-height: 32px; color: #000; font-weight: bold;">3</div>
                  </td>
                  <td style="padding: 10px 0 10px 15px; color: #CCCCCC; font-size: 14px;">
                    <strong style="color: #FFFFFF;">Systems Access</strong><br>
                    Access to Employee Hub, CRM, and team communication channels
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              ${data.portalUrl ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #D4AF37, #B8860B); color: #000000; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 15px;">
                      Access Employee Portal
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Important Info -->
              <div style="background-color: #252525; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #D4AF37; margin: 0 0 15px; font-size: 16px;">📋 Important Information</h3>
                <ul style="color: #CCCCCC; font-size: 14px; margin: 0; padding-left: 20px; line-height: 2;">
                  <li>Complete your profile in the Employee Hub</li>
                  <li>Review the company handbook and policies</li>
                  <li>Join your department's communication channel</li>
                  <li>Schedule a welcome meeting with your manager</li>
                </ul>
              </div>
              
              <p style="color: #CCCCCC; font-size: 15px; line-height: 1.8; margin: 25px 0 0;">
                We're excited to have you on board and look forward to achieving great things together!
              </p>
              
              <p style="color: #CCCCCC; font-size: 15px; line-height: 1.8; margin: 25px 0 0;">
                Best regards,<br>
                <strong style="color: #D4AF37;">Jane Abou Jaoude</strong><br>
                <span style="color: #999999; font-size: 13px;">Founder & CEO, JBJ Global Real Estate</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0D0D0D; padding: 30px; text-align: center; border-top: 1px solid #333;">
              <p style="color: #666666; font-size: 12px; margin: 0 0 10px;">
                JBJ Global Real Estate | Dubai, United Arab Emirates
              </p>
              <p style="color: #666666; font-size: 11px; margin: 0;">
                This is an automated welcome email. Please do not reply directly.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: WelcomeEmailRequest = await req.json();

    // Validate required fields
    if (!data.employeeName || !data.employeeEmail || !data.employeeRole || !data.department) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields: employeeName, employeeEmail, employeeRole, department" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Generate email HTML
    const emailHtml = generateWelcomeEmailHTML(data);

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "JBJ Global Real Estate <onboarding@jbj.ae>",
        to: [data.employeeEmail],
        subject: `Welcome to JBJ Global Real Estate, ${data.employeeName}!`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send welcome email", details: errorText }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const result = await emailResponse.json();

    console.log("Welcome email sent successfully:", {
      to: data.employeeEmail,
      name: data.employeeName,
      role: data.employeeRole,
      department: data.department,
      emailId: result.id,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Welcome email sent successfully",
        emailId: result.id,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in welcome-email function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
