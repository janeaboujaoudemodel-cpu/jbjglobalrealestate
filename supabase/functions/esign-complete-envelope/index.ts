import { corsHeaders, getCorsHeaders, corsJsonResponse, corsErrorResponse } from "../_shared/cors-utils.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    const { envelope_id } = await req.json();

    if (!envelope_id) {
      return corsErrorResponse("envelope_id is required", 400, origin);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch envelope with all data
    const { data: envelope, error: envelopeError } = await supabase
      .from("esign_envelopes")
      .select(`
        *,
        esign_recipients (*)
      `)
      .eq("id", envelope_id)
      .single();

    if (envelopeError || !envelope) {
      return corsErrorResponse("Envelope not found", 404, origin);
    }

    // Generate certificate data
    const certificateData = {
      document_name: envelope.name,
      envelope_id: envelope.id,
      completed_at: envelope.completed_at || new Date().toISOString(),
      signers: envelope.esign_recipients.map((r: any) => ({
        name: r.name,
        email: r.email,
        signed_at: r.signed_at,
        ip_address: r.signed_ip_address,
      })),
      sender: {
        name: envelope.sender_name,
        email: envelope.sender_email,
      },
    };

    // Create signed document record
    const { error: signedDocError } = await supabase
      .from("esign_signed_documents")
      .insert({
        envelope_id: envelope.id,
        document_url: envelope.document_url, // In production, this would be the merged PDF
        document_filename: `signed_${envelope.document_filename}`,
        certificate_data: certificateData,
      });

    if (signedDocError) {
      console.error("Failed to create signed document record:", signedDocError);
    }

    // Update envelope with signed document URL
    await supabase
      .from("esign_envelopes")
      .update({
        signed_document_url: envelope.document_url,
      })
      .eq("id", envelope.id);

    // Send completion emails
    const resend = resendApiKey ? new Resend(resendApiKey) : null;
    const baseUrl = Deno.env.get("SITE_URL") || "https://jbj.ae";

    const completionEmailHtml = `
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
                <div style="width: 64px; height: 64px; background: #22c55e; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">✓</span>
                </div>
              </div>
              
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; text-align: center;">
                Document Signed!
              </h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                All parties have signed the document. Your signed copy is now ready.
              </p>
              
              <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-weight: 600; color: #1a1a1a;">
                  📄 ${envelope.name}
                </p>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">
                  Completed on ${new Date(envelope.completed_at || Date.now()).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 16px;">Signers:</h3>
                ${envelope.esign_recipients.map((r: any) => `
                  <div style="display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span style="color: #22c55e; margin-right: 8px;">✓</span>
                    <span style="color: #1a1a1a;">${r.name}</span>
                    <span style="color: #999; margin-left: 8px;">(${r.email})</span>
                  </div>
                `).join('')}
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${baseUrl}/e-signature/${envelope.id}" style="display: inline-block; background: linear-gradient(135deg, #b8860b, #d4a83a); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  View Signed Document
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 30px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This document has been electronically signed and is legally binding.
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

    // Send to all recipients and sender
    const allEmails = [
      envelope.sender_email,
      ...envelope.esign_recipients.map((r: any) => r.email),
    ];

    if (resend) {
      for (const email of allEmails) {
        try {
          await resend.emails.send({
            from: "JBJ E-Signature <noreply@jbj.ae>",
            to: email,
            subject: `Signed: ${envelope.name}`,
            html: completionEmailHtml,
          });
        } catch (emailError) {
          console.error("Failed to send completion email to", email, emailError);
        }
      }
    }

    return corsJsonResponse({
      success: true,
      message: "Envelope completed successfully",
    }, origin);

  } catch (error: any) {
    console.error("Error in esign-complete-envelope:", error);
    return corsErrorResponse(error.message || "Internal server error", 500, origin);
  }
});
