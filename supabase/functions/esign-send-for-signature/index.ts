import { corsHeaders, getCorsHeaders, corsJsonResponse, corsErrorResponse } from "../_shared/cors-utils.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

    if (envelope.status !== "draft") {
      return corsErrorResponse("Envelope has already been sent", 400, origin);
    }

    // Send emails to all recipients
    const recipients = envelope.esign_recipients || [];
    
    if (recipients.length === 0) {
      return corsErrorResponse("No recipients found", 400, origin);
    }

    // Use direct fetch to Resend global API (SDK AP endpoint causes issues)

    const baseUrl = Deno.env.get("SITE_URL") || "https://jbj.ae";

    for (const recipient of recipients) {
      const signingUrl = `${baseUrl}/sign/${recipient.signing_token}`;
      
      const emailHtml = `
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
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">
                Please Sign: ${envelope.name}
              </h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 24px;">
                Hi ${recipient.name},
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 24px;">
                <strong>${envelope.sender_name || envelope.sender_email}</strong> has requested your signature on the document:
              </p>
              
              <div style="background: #f9f6f1; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-weight: 600; color: #1a1a1a;">
                  📄 ${envelope.name}
                </p>
                ${envelope.email_message ? `<p style="margin: 12px 0 0 0; color: #666;">${envelope.email_message}</p>` : ''}
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${signingUrl}" style="display: inline-block; background: linear-gradient(135deg, #b8860b, #d4a83a); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  View & Sign Document
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center;">
                This link expires in 7 days.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 30px; text-align: center;">
               <p style="color: #999; font-size: 12px; margin: 0;">
                 If you have questions, contact <a href="mailto:contact@jbj.ae" style="color: #b8860b;">contact@jbj.ae</a>
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

      // Send email via Resend (direct fetch to global API)
      if (resendApiKey) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "JBJ E-Signature <contact@jbj.ae>",
              to: [recipient.email],
              subject: envelope.email_subject || `Please sign: ${envelope.name}`,
              html: emailHtml,
            }),
          });
          const resData = await res.json();
          if (!res.ok) console.error("Resend API error:", JSON.stringify(resData));
        } catch (emailError) {
          console.error("Failed to send email to", recipient.email, emailError);
        }
      } else {
        console.log("Resend not configured, skipping email to:", recipient.email);
        console.log("Signing URL:", signingUrl);
      }

      // Update recipient status
      await supabase
        .from("esign_recipients")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", recipient.id);

      // Create audit log
      await supabase.from("esign_audit_log").insert({
        envelope_id: envelope.id,
        recipient_id: recipient.id,
        action: "sent",
        description: `Signature request sent to ${recipient.name} (${recipient.email})`,
        actor_id: user.id,
        actor_email: user.email,
        actor_name: envelope.sender_name,
      });
    }

    // Update envelope status
    await supabase
      .from("esign_envelopes")
      .update({ status: "sent" })
      .eq("id", envelope.id);

    // Create envelope sent audit log
    await supabase.from("esign_audit_log").insert({
      envelope_id: envelope.id,
      action: "sent",
      description: `Envelope sent to ${recipients.length} recipient(s)`,
      actor_id: user.id,
      actor_email: user.email,
      actor_name: envelope.sender_name,
    });

    return corsJsonResponse({
      success: true,
      message: `Sent to ${recipients.length} recipient(s)`,
    }, origin);

  } catch (error: any) {
    console.error("Error in esign-send-for-signature:", error);
    return corsErrorResponse(error.message || "Internal server error", 500, origin);
  }
});
