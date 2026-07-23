// Resend webhook receiver — pipes accepted / sent / delivered / opened /
// clicked / bounced / complained / delivery_delayed events into the JBJ
// campaign spine via `jbj_apply_resend_webhook`.
//
// Configure in Resend dashboard → Webhooks → Add endpoint pointing at:
//   https://<project>.supabase.co/functions/v1/resend-webhook
// Optional signature verification requires `RESEND_WEBHOOK_SECRET`.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, svix-id, svix-signature, svix-timestamp",
};

interface ResendEvent {
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

  let payload: ResendEvent;
  try {
    payload = (await req.json()) as ResendEvent;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const eventType = payload?.type || "unknown";
  const messageId = payload?.data?.email_id || null;

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

  const { data, error } = await sb.rpc("jbj_apply_resend_webhook", {
    _event_type: eventType,
    _message_id: messageId,
    _payload: payload as any,
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
