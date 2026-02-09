import { corsHeaders, getCorsHeaders, corsJsonResponse, corsErrorResponse } from "../_shared/cors-utils.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    const { token, signature_data, initials_data } = await req.json();

    if (!token) {
      return corsErrorResponse("Signing token is required", 400, origin);
    }

    if (!signature_data) {
      return corsErrorResponse("Signature data is required", 400, origin);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch recipient by token
    const { data: recipient, error: recipientError } = await supabase
      .from("esign_recipients")
      .select(`
        *,
        esign_envelopes (*)
      `)
      .eq("signing_token", token)
      .single();

    if (recipientError || !recipient) {
      return corsErrorResponse("Invalid or expired signing token", 400, origin);
    }

    // Check if already signed
    if (recipient.status === "signed") {
      return corsErrorResponse("Document already signed", 400, origin);
    }

    // Check if envelope is still valid
    const envelope = recipient.esign_envelopes;
    if (!envelope || ["completed", "voided", "expired", "declined"].includes(envelope.status)) {
      return corsErrorResponse(`This document is no longer available for signing (status: ${envelope?.status || 'unknown'})`, 400, origin);
    }

    // Check expiration
    if (recipient.token_expires_at && new Date(recipient.token_expires_at) < new Date()) {
      return corsErrorResponse("This signing link has expired", 400, origin);
    }

    // Get client IP and user agent
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Update recipient with signature
    const { error: updateError } = await supabase
      .from("esign_recipients")
      .update({
        status: "signed",
        signed_at: new Date().toISOString(),
        signature_data: signature_data,
        initials_data: initials_data || null,
        signed_ip_address: clientIp,
        signed_user_agent: userAgent,
      })
      .eq("id", recipient.id);

    if (updateError) {
      console.error("Failed to update recipient:", updateError);
      return corsErrorResponse("Failed to save signature", 500, origin);
    }

    // Mark signature fields as completed
    await supabase
      .from("esign_fields")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("recipient_id", recipient.id);

    // Create audit log
    await supabase.from("esign_audit_log").insert({
      envelope_id: envelope.id,
      recipient_id: recipient.id,
      action: "signed",
      description: `${recipient.name} signed the document`,
      actor_email: recipient.email,
      actor_name: recipient.name,
      ip_address: clientIp,
      user_agent: userAgent,
      metadata: {
        signed_at: new Date().toISOString(),
      },
    });

    // Check if all recipients have signed
    const { data: allRecipients } = await supabase
      .from("esign_recipients")
      .select("status")
      .eq("envelope_id", envelope.id);

    const allSigned = allRecipients?.every(r => r.status === "signed");

    if (allSigned) {
      // Update envelope to completed
      await supabase
        .from("esign_envelopes")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", envelope.id);

      // Create completion audit log
      await supabase.from("esign_audit_log").insert({
        envelope_id: envelope.id,
        action: "completed",
        description: "All parties have signed. Document completed.",
      });

      // Call completion function to generate final PDF and send emails
      try {
        const completeResponse = await fetch(
          `${supabaseUrl}/functions/v1/esign-complete-envelope`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ envelope_id: envelope.id }),
          }
        );

        if (!completeResponse.ok) {
          console.error("Failed to complete envelope:", await completeResponse.text());
        }
      } catch (completeError) {
        console.error("Error calling complete-envelope:", completeError);
      }
    } else {
      // Update envelope to partially signed
      await supabase
        .from("esign_envelopes")
        .update({ status: "partially_signed" })
        .eq("id", envelope.id);
    }

    return corsJsonResponse({
      success: true,
      message: "Signature submitted successfully",
      all_signed: allSigned,
    }, origin);

  } catch (error: any) {
    console.error("Error in esign-process-signature:", error);
    return corsErrorResponse(error.message || "Internal server error", 500, origin);
  }
});
