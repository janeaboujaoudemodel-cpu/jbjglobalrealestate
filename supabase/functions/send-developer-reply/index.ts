// Send a reply via Gmail API and mark the action item resolved.

import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_BASE = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

function b64url(s: string): string {
  // Encode UTF-8 properly
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GMAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
  if (!LOVABLE_API_KEY || !GMAIL_API_KEY) {
    return new Response(JSON.stringify({ error: "Gmail connector not linked" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { action_item_id, to, subject, body, document_link, thread_id_gmail } = await req.json();
  if (!to || !body) {
    return new Response(JSON.stringify({ error: "to and body required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const finalBody = document_link
    ? `${body}\n\nYou can find all the requested documents here: ${document_link}\n\nBest regards,\nJBJ GLOBAL REAL ESTATE`
    : `${body}\n\nBest regards,\nJBJ GLOBAL REAL ESTATE`;

  const rfc = [
    `To: ${to}`,
    `From: ${auth.email}`,
    `Subject: ${subject || "Re: Your request"}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    finalBody,
  ].join("\r\n");

  const sendRes = await fetch(`${GATEWAY_BASE}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GMAIL_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: b64url(rfc),
      ...(thread_id_gmail ? { threadId: thread_id_gmail } : {}),
    }),
  });

  if (!sendRes.ok) {
    const t = await sendRes.text();
    return new Response(JSON.stringify({ error: `Gmail send failed [${sendRes.status}]: ${t}` }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sendJson = await sendRes.json();

  if (action_item_id) {
    await supabase
      .from("developer_action_items")
      .update({ status: "done", resolved_at: new Date().toISOString() })
      .eq("id", action_item_id)
      .eq("user_id", auth.userId);

    // log outbound message in thread, if linked
    const { data: ai } = await supabase
      .from("developer_action_items")
      .select("thread_id")
      .eq("id", action_item_id)
      .maybeSingle();
    if (ai?.thread_id) {
      await supabase.from("owner_comm_messages").insert({
        thread_id: ai.thread_id,
        user_id: auth.userId,
        direction: "outbound",
        content: finalBody,
        content_type: "text",
        sender_identifier: auth.email ?? "owner",
        sender_name: "Jane Bou Jaoude",
        status: "sent",
        sent_at: new Date().toISOString(),
        metadata: { gmail_message_id: sendJson.id, subject },
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, gmail_id: sendJson.id }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
