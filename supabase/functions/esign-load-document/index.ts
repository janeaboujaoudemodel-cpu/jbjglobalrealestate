// Public endpoint: validates a signing token and returns the recipient + envelope
// + fields needed to render the signing page. Bypasses RLS using the service role
// after verifying the token, so /sign/:token works for unauthenticated clients.

import { corsHeaders, getCorsHeaders, corsJsonResponse, corsErrorResponse } from "../_shared/cors-utils.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(origin) });

  try {
    const { token } = await req.json().catch(() => ({}));
    if (!token || typeof token !== "string") {
      return corsErrorResponse("Signing token is required", 400, origin);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: recipient, error: recErr } = await supabase
      .from("esign_recipients")
      .select("id,name,email,status,envelope_id,token_expires_at")
      .eq("signing_token", token)
      .maybeSingle();

    // NOTE: Terminal states (invalid / expired / removed) intentionally return
    // HTTP 200 with a structured `{ state, error }` payload. This is a *normal*
    // signing-page outcome (the user sees a branded "expired link" card with a
    // Return to Homepage button), not a server error — returning 4xx/410 here
    // causes global error reporters to mis-flag the page as a runtime crash
    // with a blank-screen alert.
    if (recErr || !recipient) {
      return corsJsonResponse(
        { state: "invalid", error: "This signing link is invalid or has expired" },
        origin,
      );
    }
    if (recipient.token_expires_at && new Date(recipient.token_expires_at) < new Date()) {
      return corsJsonResponse(
        { state: "expired", error: "This signing link has expired" },
        origin,
      );
    }

    const { data: envelope, error: envErr } = await supabase
      .from("esign_envelopes")
      .select("id,name,document_url,document_filename,sender_name,sender_email,status,deleted_at")
      .eq("id", recipient.envelope_id)
      .maybeSingle();

    if (envErr || !envelope) {
      return corsJsonResponse(
        { state: "invalid", error: "Document not found" },
        origin,
      );
    }
    if (envelope.deleted_at) {
      return corsJsonResponse(
        { state: "removed", error: "This document has been removed" },
        origin,
      );
    }

    const { data: fields } = await supabase
      .from("esign_fields")
      .select("id,field_type,page_number,x_position,y_position,width,height,is_required,is_completed")
      .eq("recipient_id", recipient.id);

    // Best-effort: mark as viewed (non-blocking)
    if (recipient.status !== "signed" && recipient.status !== "declined") {
      await supabase.from("esign_recipients").update({
        status: "viewed",
        viewed_at: new Date().toISOString(),
      }).eq("id", recipient.id);
      await supabase.from("esign_audit_log").insert({
        envelope_id: envelope.id,
        recipient_id: recipient.id,
        action: "viewed",
        description: `${recipient.name} viewed the document`,
        actor_email: recipient.email,
        actor_name: recipient.name,
      });
    }

    return corsJsonResponse({ recipient, envelope, fields: fields || [] }, origin);
  } catch (e: any) {
    console.error("esign-load-document error:", e);
    return corsErrorResponse(e.message || "Internal error", 500, origin);
  }
});
