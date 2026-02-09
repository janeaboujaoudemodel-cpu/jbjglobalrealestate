import { corsHeaders, getCorsHeaders, corsJsonResponse, corsErrorResponse } from "../_shared/cors-utils.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return corsErrorResponse("Unauthorized", 401, origin);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return corsErrorResponse("Unauthorized", 401, origin);
    }

    const { envelope_id } = await req.json();

    if (!envelope_id) {
      return corsErrorResponse("envelope_id is required", 400, origin);
    }

    // Fetch envelope with recipients
    const { data: envelope, error: envelopeError } = await supabase
      .from("esign_envelopes")
      .select(`
        *,
        esign_recipients (*)
      `)
      .eq("id", envelope_id)
      .eq("sender_id", user.id)
      .single();

    if (envelopeError || !envelope) {
      return corsErrorResponse("Envelope not found", 404, origin);
    }

    // Check if reminder can be sent
    if (!["sent", "viewed", "partially_signed"].includes(envelope.status)) {
      return corsErrorResponse("Cannot send reminder for this envelope status", 400, origin);
    }

    // Check max reminders
    if (envelope.reminders_sent >= envelope.max_reminders) {
      return corsErrorResponse("Maximum reminders reached", 400, origin);
    }

    // Get pending recipients only
    const pendingRecipients = envelope.esign_recipients.filter(
      (r: any) => ["pending", "sent", "delivered", "viewed"].includes(r.status)
    );

    if (pendingRecipients.length === 0) {
      return corsErrorResponse("No pending recipients to remind", 400, origin);
    }

    const resend = resendApiKey ? new Resend(resendApiKey) : null;
    const baseUrl = Deno.env.get("SITE_URL") || "https://jbj.ae";

    for (const recipient of pendingRecipients) {
      const signingUrl = `${baseUrl}/sign/${recipient.signing_token}`;
      
      const reminderEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f6f1;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <h1 style="margin: 0; color: #b8860b; font-size: 28px;">JBJ Global Real Estate</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px;">⏰</span>
              </div>
              
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; text-align: center;">
                Reminder: Document Awaiting Your Signature
              </h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 24px;">
                Hi ${recipient.name},
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 24px;">
                This is a friendly reminder that <strong>${envelope.sender_name || envelope.sender_email}</strong> is waiting for your signature on:
              </p>
              
              <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-weight: 600; color: #1a1a1a;">
                  📄 ${envelope.name}
                </p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${signingUrl}" style="display: inline-block; background: linear-gradient(135deg, #b8860b, #d4a83a); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Sign Now
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center;">
                This link will expire soon. Please sign at your earliest convenience.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 30px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                If you have questions, contact ${envelope.sender_email}
              </p>
              <p style="color: #999; font-size: 12px; margin: 8px 0 0 0;">
                © ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      if (resend) {
        try {
          await resend.emails.send({
            from: "JBJ E-Signature <noreply@jbj.ae>",
            to: recipient.email,
            subject: `Reminder: Please sign ${envelope.name}`,
            html: reminderEmailHtml,
          });
        } catch (emailError) {
          console.error("Failed to send reminder to", recipient.email, emailError);
        }
      }

      // Create audit log for each reminder
      await supabase.from("esign_audit_log").insert({
        envelope_id: envelope.id,
        recipient_id: recipient.id,
        action: "reminder_sent",
        description: `Reminder sent to ${recipient.name} (${recipient.email})`,
        actor_id: user.id,
        actor_email: user.email,
        actor_name: envelope.sender_name,
      });
    }

    // Update reminders count
    await supabase
      .from("esign_envelopes")
      .update({ reminders_sent: (envelope.reminders_sent || 0) + 1 })
      .eq("id", envelope.id);

    return corsJsonResponse({
      success: true,
      message: `Reminder sent to ${pendingRecipients.length} recipient(s)`,
    }, origin);

  } catch (error: any) {
    console.error("Error in esign-send-reminder:", error);
    return corsErrorResponse(error.message || "Internal server error", 500, origin);
  }
});
