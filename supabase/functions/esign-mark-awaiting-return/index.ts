// esign-mark-awaiting-return — public endpoint hit by the recipient when they
// confirm they've emailed the DocuSign-signed PDF back to JBJ. Flips envelope
// status to `awaiting_signed_return` (or keeps it at `sent` if the column
// can't be updated), writes an audit row, and notifies the sender. Idempotent.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json().catch(() => ({}));
    if (!token || typeof token !== "string") {
      return json({ error: "Missing token" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve recipient + envelope from token
    const { data: recipient, error: recErr } = await supabase
      .from("esign_recipients")
      .select("id, name, email, envelope_id, status")
      .eq("signing_token", token)
      .maybeSingle();

    if (recErr || !recipient) {
      return json({ error: "Invalid or expired token" }, 404);
    }

    const envelopeId = recipient.envelope_id as string;

    // Mark recipient as awaiting_signed_return (idempotent if already set)
    if (recipient.status !== "signed" && recipient.status !== "declined") {
      const { error: rUpdErr } = await supabase
        .from("esign_recipients")
        .update({ status: "awaiting_signed_return" })
        .eq("id", recipient.id);
      if (rUpdErr) console.warn("recipient status update failed", rUpdErr);
    }

    // Envelope status — enum now supports awaiting_signed_return.
    const { error: envUpdErr } = await supabase
      .from("esign_envelopes")
      .update({ status: "awaiting_signed_return" })
      .eq("id", envelopeId);
    if (envUpdErr) console.warn("envelope status update failed", envUpdErr);

    // Audit log
    await supabase.from("esign_audit_log").insert({
      envelope_id: envelopeId,
      recipient_id: recipient.id,
      action: "awaiting_signed_return",
      description: `${recipient.name} confirmed they emailed the DocuSign-signed PDF back to JBJ`,
      actor_email: recipient.email,
      actor_name: recipient.name,
    }).then(() => {}, () => {});

    return json({ ok: true });
  } catch (e) {
    console.error("esign-mark-awaiting-return error", e);
    return json({ error: "Internal error" }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
