// Resend webhook receiver — pipes accepted / sent / delivered / opened /
// clicked / bounced / complained / delivery_delayed events into the JBJ
// campaign spine via `jbj_apply_resend_webhook`.
//
// Configure in Resend dashboard → Webhooks → Add endpoint pointing at:
//   https://<project>.supabase.co/functions/v1/resend-webhook
// Then subscribe to: email.sent, email.delivered, email.delivery_delayed,
//   email.bounced, email.complained, email.opened, email.clicked.
//
// Signature verification: Resend signs webhooks with Svix (svix-id,
// svix-timestamp, svix-signature). If `RESEND_WEBHOOK_SECRET` is set (starts
// with `whsec_`), we verify signatures and reject unsigned/mismatched deliveries.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Webhook } from "npm:svix@1.24.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, svix-id, svix-signature, svix-timestamp",
};

interface ResendEvent {
  id?: string;
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    from?: string;
    subject?: string;
    [k: string]: unknown;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const rawBody = await req.text();
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET") || "";

  if (!secret) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET missing; refusing unverified webhook");
    return new Response(JSON.stringify({ error: "webhook_secret_missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const svixId = req.headers.get("svix-id");
  const svixTs = req.headers.get("svix-timestamp");
  const svixSig = req.headers.get("svix-signature");
  if (!svixId || !svixTs || !svixSig) {
    console.warn("[resend-webhook] missing svix headers");
    return new Response(JSON.stringify({ error: "missing_signature" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const wh = new Webhook(secret);
    wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTs,
      "svix-signature": svixSig,
    });
  } catch (err) {
    console.warn("[resend-webhook] signature invalid:", (err as Error).message);
    return new Response(JSON.stringify({ error: "invalid_signature" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: ResendEvent;
  try {
    payload = JSON.parse(rawBody) as ResendEvent;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const eventType = payload?.type || "unknown";
  const messageId = payload?.data?.email_id || null;
  const eventId = payload?.id || svixId;

  if (!messageId) {
    return new Response(JSON.stringify({ error: "missing_email_id", event: eventType }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const replayKey = `wh:${eventId}`;
  const { count: replayCount, error: replayErr } = await sb
    .from("jbj_email_events")
    .select("id", { count: "exact", head: true })
    .eq("idempotency_key", replayKey);
  if (replayErr) {
    console.error("[resend-webhook] replay check failed:", replayErr);
    return new Response(JSON.stringify({ error: replayErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if ((replayCount || 0) > 0) {
    return new Response(JSON.stringify({ error: "replayed_event" }), {
      status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data, error } = await sb.rpc("jbj_apply_resend_webhook", {
    _event_type: eventType,
    _message_id: messageId,
    _payload: payload as any,
    _event_id: eventId,
  });

  if (error) {
    console.error("[resend-webhook] apply failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, recipient_id: data, event: eventType }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
