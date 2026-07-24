// Send a developer reply via Resend and mark the action item resolved.

import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";
import { sendViaResend } from "../_shared/resendClient.ts";
import { recordJbjResendSend, buildIntendedSendKey } from "../_shared/jbjSpine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;

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

  const replySubject = subject || "Re: Your request";
  const html = finalBody
    .split("\n")
    .map((line) => line.trim() ? `<p>${escapeHtml(line)}</p>` : "<br />")
    .join("");
  const resendResult = await sendViaResend({
    from: "Jane Bou Jaoude <contact@jbj.ae>",
    to,
    reply_to: "helpdesk@jbj.ae",
    subject: replySubject,
    html,
    text: finalBody,
    headers: thread_id_gmail ? { "X-JBJ-Legacy-Gmail-Thread": String(thread_id_gmail) } : undefined,
    tags: [
      { name: "workflow", value: "developer_reply" },
      { name: "portal", value: "developer" },
    ],
  });

  if (!resendResult.ok) {
    return new Response(JSON.stringify({ error: resendResult.error || "Resend send failed", upstream_status: resendResult.status, details: resendResult.data }), {
      status: resendResult.status >= 400 && resendResult.status < 600 ? resendResult.status : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resendId = resendResult.data?.id || null;
  const intendedSendId = `reply:${action_item_id || to}:${resendId || crypto.randomUUID()}`;
  await recordJbjResendSend({
    portalKind: "developer",
    entityType: "developer",
    entityId: action_item_id ?? null,
    email: to,
    templateSlug: "developer_reply",
    senderEmail: "contact@jbj.ae",
    replyTo: "helpdesk@jbj.ae",
    subject: replySubject,
    resendMessageId: resendId,
    providerResponse: { status: resendResult.status, data: resendResult.data },
    intendedSendId,
    workflowInstanceId: action_item_id ?? to,
    sendCategory: "reply",
    idempotencyKey: buildIntendedSendKey({
      portalKind: "developer",
      sendType: "reply",
      templateSlug: "developer_reply",
      workflowInstanceId: action_item_id ?? to,
      recipientId: to,
      intendedSendId,
    }),
  });

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
        metadata: { resend_message_id: resendId, legacy_gmail_thread_id: thread_id_gmail ?? null, subject: replySubject },
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, resend_id: resendId, sent_via: "resend" }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
