// Gmail Inbox Sync — pulls new messages from Jane's connected Gmail
// (which receives the contact@jbj.ae forwarder) into owner_comm_threads/messages
// and triggers classification of developer document requests.

import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_BASE = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

interface GmailHeader { name: string; value: string }
interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  payload?: { headers?: GmailHeader[]; mimeType?: string; body?: { data?: string }; parts?: any[] };
}

function header(headers: GmailHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseFrom(from: string): { name: string; email: string } {
  const m = from.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim().toLowerCase() };
  return { name: "", email: from.trim().toLowerCase() };
}

function decodeBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) {
    try {
      return atob(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    } catch { /* ignore */ }
  }
  if (Array.isArray(payload.parts)) {
    for (const p of payload.parts) {
      const text = decodeBody(p);
      if (text && (p.mimeType === "text/plain" || !p.mimeType)) return text;
    }
    for (const p of payload.parts) {
      const text = decodeBody(p);
      if (text) return text;
    }
  }
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GMAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
  if (!LOVABLE_API_KEY || !GMAIL_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Gmail connector is not linked. Connect Gmail in Connectors." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const userId = auth.userId;

  // Determine since cursor
  const { data: settings } = await supabase
    .from("owner_comm_settings")
    .select("settings")
    .eq("user_id", userId)
    .maybeSingle();
  const lastHistoryId: string | null =
    (settings?.settings as any)?.gmail_last_history_id ?? null;

  // List the latest 30 messages in INBOX (covers normal + forwarded mail)
  const listUrl = `${GATEWAY_BASE}/users/me/messages?maxResults=30&labelIds=INBOX`;
  const listRes = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GMAIL_API_KEY,
    },
  });
  if (!listRes.ok) {
    const body = await listRes.text();
    return new Response(
      JSON.stringify({ error: `Gmail list failed [${listRes.status}]: ${body}` }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const listJson = await listRes.json() as { messages?: { id: string; threadId: string }[] };
  const items = listJson.messages ?? [];

  // Ensure a single email channel record exists
  let channelId: string | null = null;
  const { data: existingChannel } = await supabase
    .from("owner_comm_channels")
    .select("id")
    .eq("user_id", userId)
    .eq("channel_type", "email_gmail")
    .maybeSingle();
  if (existingChannel) {
    channelId = existingChannel.id;
  } else {
    const { data: newCh } = await supabase
      .from("owner_comm_channels")
      .insert({
        user_id: userId,
        channel_type: "email_gmail",
        assistant_type: "company",
        display_name: "Gmail (contact@jbj.ae forwarder)",
        identifier: auth.email,
        is_active: true,
        sync_status: "active",
      })
      .select("id")
      .single();
    channelId = newCh?.id ?? null;
  }

  let synced = 0;
  let classified = 0;

  for (const item of items) {
    // De-dupe: skip if already stored
    const { data: existing } = await supabase
      .from("owner_comm_messages")
      .select("id")
      .eq("metadata->>gmail_message_id", item.id)
      .maybeSingle();
    if (existing) continue;

    const detailRes = await fetch(
      `${GATEWAY_BASE}/users/me/messages/${item.id}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GMAIL_API_KEY,
        },
      },
    );
    if (!detailRes.ok) continue;
    const msg = await detailRes.json() as GmailMessage;

    const headers = msg.payload?.headers ?? [];
    const fromRaw = header(headers, "From");
    const subject = header(headers, "Subject");
    const { name, email } = parseFrom(fromRaw);
    const body = decodeBody(msg.payload).slice(0, 8000);
    const ts = new Date(parseInt(msg.internalDate, 10)).toISOString();

    // Upsert thread by gmail threadId
    let threadId: string | null = null;
    const { data: existingThread } = await supabase
      .from("owner_comm_threads")
      .select("id")
      .eq("user_id", userId)
      .eq("metadata->>gmail_thread_id", msg.threadId)
      .maybeSingle();
    if (existingThread) {
      threadId = existingThread.id;
      await supabase
        .from("owner_comm_threads")
        .update({
          last_message_preview: msg.snippet?.slice(0, 200) ?? "",
          last_message_at: ts,
          unread_count: 1,
          status: "new",
        })
        .eq("id", threadId);
    } else {
      const { data: newT } = await supabase
        .from("owner_comm_threads")
        .insert({
          user_id: userId,
          channel_id: channelId,
          channel_type: "email_gmail",
          assistant_type: "company",
          contact_name: name || email,
          contact_identifier: email,
          status: "new",
          unread_count: 1,
          last_message_preview: msg.snippet?.slice(0, 200) ?? "",
          last_message_at: ts,
          metadata: { gmail_thread_id: msg.threadId, subject },
        })
        .select("id")
        .single();
      threadId = newT?.id ?? null;
    }
    if (!threadId) continue;

    // Insert message
    const { data: insertedMsg } = await supabase
      .from("owner_comm_messages")
      .insert({
        thread_id: threadId,
        user_id: userId,
        direction: "inbound",
        body,
        sent_at: ts,
        metadata: {
          gmail_message_id: msg.id,
          gmail_thread_id: msg.threadId,
          subject,
          from_name: name,
          from_email: email,
        },
      })
      .select("id")
      .single();

    synced++;

    // Trigger classifier (fire-and-forget)
    try {
      const classifyRes = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/classify-developer-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.get("Authorization") ?? "",
          },
          body: JSON.stringify({
            thread_id: threadId,
            message_id: insertedMsg?.id,
            subject,
            from_email: email,
            from_name: name,
            body,
          }),
        },
      );
      if (classifyRes.ok) classified++;
    } catch (_) { /* ignore */ }
  }

  // Save cursor
  await supabase
    .from("owner_comm_settings")
    .upsert(
      {
        user_id: userId,
        settings: {
          ...(settings?.settings ?? {}),
          gmail_last_synced_at: new Date().toISOString(),
        },
      },
      { onConflict: "user_id" },
    );

  return new Response(JSON.stringify({ ok: true, synced, classified }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
