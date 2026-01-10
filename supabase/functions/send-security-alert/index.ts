import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(
    (allowed) => origin === allowed || origin.includes("lovable.app") || origin.includes("lovableproject.com")
  );

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Admin email recipients
const ADMIN_EMAILS = ["contact@jbj.ae"];

interface SecurityAlertRequest {
  alertType: "data_export" | "unusual_access" | "bulk_access" | "after_hours_access" | "suspicious_pattern";
  adminEmail: string;
  adminName?: string;
  details: {
    recordCount?: number;
    resourceType?: string;
    filters?: Record<string, string>;
    accessTime?: string;
    ipAddress?: string;
    additionalInfo?: string;
  };
}

function getAlertSeverity(alertType: string): { color: string; label: string } {
  switch (alertType) {
    case "data_export":
      return { color: "#f97316", label: "Medium" };
    case "bulk_access":
      return { color: "#ef4444", label: "High" };
    case "unusual_access":
      return { color: "#ef4444", label: "High" };
    case "after_hours_access":
      return { color: "#eab308", label: "Low" };
    case "suspicious_pattern":
      return { color: "#ef4444", label: "Critical" };
    default:
      return { color: "#6b7280", label: "Info" };
  }
}

function getAlertTitle(alertType: string): string {
  switch (alertType) {
    case "data_export":
      return "Sensitive Data Export";
    case "bulk_access":
      return "Bulk Data Access Detected";
    case "unusual_access":
      return "Unusual Access Pattern";
    case "after_hours_access":
      return "After-Hours Data Access";
    case "suspicious_pattern":
      return "Suspicious Activity Detected";
    default:
      return "Security Alert";
  }
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      console.error("User is not admin:", user.email);
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { alertType, adminEmail, adminName, details }: SecurityAlertRequest = await req.json();

    if (!alertType || !adminEmail) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Security alert triggered: ${alertType} by ${adminEmail}`);

    const severity = getAlertSeverity(alertType);
    const title = getAlertTitle(alertType);
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dubai",
      dateStyle: "full",
      timeStyle: "long",
    });

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #18181b; border-radius: 12px; overflow: hidden; border: 1px solid #27272a;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #d4af37 0%, #a08530 100%); padding: 24px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <h1 style="margin: 0; color: #000; font-size: 24px; font-weight: 700;">🛡️ Security Alert</h1>
                          <p style="margin: 8px 0 0; color: rgba(0,0,0,0.7); font-size: 14px;">JBJ Global Real Estate Admin Dashboard</p>
                        </td>
                        <td align="right">
                          <span style="display: inline-block; padding: 6px 12px; background-color: ${severity.color}; color: #fff; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                            ${severity.label}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <h2 style="margin: 0 0 16px; color: #fff; font-size: 20px;">${title}</h2>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px; background-color: #27272a; border-radius: 8px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #3f3f46;">
                                <span style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Admin</span><br>
                                <span style="color: #fff; font-size: 14px;">${adminName || "Unknown"} (${adminEmail})</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #3f3f46;">
                                <span style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Timestamp</span><br>
                                <span style="color: #fff; font-size: 14px;">${timestamp}</span>
                              </td>
                            </tr>
                            ${details.resourceType ? `
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #3f3f46;">
                                <span style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Resource Type</span><br>
                                <span style="color: #fff; font-size: 14px;">${details.resourceType}</span>
                              </td>
                            </tr>
                            ` : ""}
                            ${details.recordCount !== undefined ? `
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #3f3f46;">
                                <span style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Records Affected</span><br>
                                <span style="color: #fff; font-size: 14px;">${details.recordCount} records</span>
                              </td>
                            </tr>
                            ` : ""}
                            ${details.filters && Object.keys(details.filters).length > 0 ? `
                            <tr>
                              <td style="padding: 8px 0; border-bottom: 1px solid #3f3f46;">
                                <span style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Filters Applied</span><br>
                                <span style="color: #fff; font-size: 14px;">${JSON.stringify(details.filters)}</span>
                              </td>
                            </tr>
                            ` : ""}
                            ${details.additionalInfo ? `
                            <tr>
                              <td style="padding: 8px 0;">
                                <span style="color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Additional Info</span><br>
                                <span style="color: #fff; font-size: 14px;">${details.additionalInfo}</span>
                              </td>
                            </tr>
                            ` : ""}
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0;">
                      This is an automated security notification. All admin actions are logged for compliance and security monitoring purposes.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 32px; background-color: #0f0f0f; border-top: 1px solid #27272a;">
                    <p style="margin: 0; color: #71717a; font-size: 12px; text-align: center;">
                      © ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.<br>
                      This email was sent to security administrators.
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

    // Send email to all admin recipients using Resend API
    const emailPromises = ADMIN_EMAILS.map(async (recipient) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "JBJ Global Real Estate Security <onboarding@resend.dev>",
          to: [recipient],
          subject: `🛡️ [${severity.label}] ${title} - ${adminEmail}`,
          html: emailHtml,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send email");
      }
      return response.json();
    });

    const results = await Promise.allSettled(emailPromises);

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failedCount = results.filter((r) => r.status === "rejected").length;

    console.log(`Security alerts sent: ${successCount} succeeded, ${failedCount} failed`);

    if (failedCount > 0) {
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .map((r) => r.reason);
      console.error("Failed to send some alerts:", errors);
    }

    // Also log this alert to audit_logs using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email,
      action_type: "export",
      resource_type: "subscription",
      description: `Security alert sent: ${title}`,
      details: {
        alertType,
        recipientCount: ADMIN_EMAILS.length,
        successCount,
        failedCount,
        ...details,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Security alert sent to ${successCount} recipients`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending security alert:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send security alert" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
