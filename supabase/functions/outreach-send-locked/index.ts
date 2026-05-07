/**
 * outreach-send-locked
 *
 * Sends a previously-locked payload byte-for-byte via Gmail.
 * Re-verifies the payload_hash before sending. Never re-renders, never
 * substitutes variables, never rewrites links. The bytes in the row are
 * the bytes the recipient sees.
 *
 * Owner-only.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { computePayloadHash } from "../_shared/email-shell.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = [
  "janeaboujaoudenails@gmail.com",
  "infoo.jane@gmail.com",
];

const GMAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const STALE_AFTER_HOURS = 24;

interface SendBody {
  payload_id: string;
  /** Optional client-computed hash for extra anti-tamper check. */
  expected_hash?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !OWNER_EMAILS.includes((user.email || "").toLowerCase())) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = (await req.json()) as SendBody;
    if (!body.payload_id) return json({ error: "payload_id required" }, 400);

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: row, error: fetchErr } = await service
      .from("outreach_locked_payloads")
      .select("*")
      .eq("id", body.payload_id)
      .maybeSingle();
    if (fetchErr || !row) return json({ error: "Payload not found" }, 404);
    if (row.locked_by !== user.id) return json({ error: "Forbidden" }, 403);
    if (row.status === "sent") {
      return json({ ok: true, already_sent: true, provider_message_id: row.provider_message_id }, 200);
    }
    if (row.status !== "locked") {
      return json({ error: `Cannot send — status is ${row.status}` }, 409);
    }

    const lockedAt = new Date(row.locked_at).getTime();
    if (Date.now() - lockedAt > STALE_AFTER_HOURS * 3600 * 1000) {
      return json({ error: "Payload is stale (>24h since lock). Re-lock and re-approve." }, 409);
    }

    // Re-verify hash (anti-tamper)
    const recomputed = await computePayloadHash({
      from_email: row.from_email,
      from_name: row.from_name,
      reply_to: row.reply_to,
      recipient_email: row.recipient_email,
      cc_emails: row.cc_emails || [],
      subject: row.subject,
      html: row.html,
      plain_text: row.plain_text,
    });
    if (recomputed !== row.payload_hash) {
      return json({ error: "PAYLOAD_TAMPERED — hash mismatch" }, 409);
    }
    if (body.expected_hash && body.expected_hash !== row.payload_hash) {
      return json({ error: "Client hash mismatch — preview is stale" }, 409);
    }

    // Send via Gmail — exact bytes, no transforms.
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_API_KEY || !GMAIL_API_KEY) {
      return json({ error: "Gmail connector not configured" }, 500);
    }

    const raw = buildMultipartMime({
      from: `${row.from_name} <${row.from_email}>`,
      to: row.recipient_email,
      cc: row.cc_emails || [],
      replyTo: row.reply_to,
      subject: row.subject,
      html: row.html,
      text: row.plain_text,
    });

    const gmailRes = await fetch(`${GMAIL_GATEWAY}/users/me/messages/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GMAIL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });
    const gmailJson = await gmailRes.json();

    if (!gmailRes.ok) {
      await service.from("outreach_locked_payloads").update({
        status: "failed",
        send_error: gmailJson?.error?.message || `HTTP ${gmailRes.status}`,
      }).eq("id", row.id);
      return json({ error: gmailJson?.error?.message || "Gmail send failed", details: gmailJson }, 502);
    }

    await service.from("outreach_locked_payloads").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      provider_message_id: gmailJson?.id || null,
      provider_thread_id: gmailJson?.threadId || null,
      send_error: null,
    }).eq("id", row.id);

    return json({
      ok: true,
      payload_id: row.id,
      provider_message_id: gmailJson?.id || null,
      provider_thread_id: gmailJson?.threadId || null,
    }, 200);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function b64url(s: string) {
  const b64 = btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildMultipartMime(p: {
  from: string;
  to: string;
  cc: string[];
  replyTo: string;
  subject: string;
  html: string;
  text: string;
}) {
  const boundary = `----lovable_${crypto.randomUUID().replace(/-/g, "")}`;
  const subjectEnc = `=?utf-8?B?${btoa(unescape(encodeURIComponent(p.subject)))}?=`;
  const headers = [
    `From: ${p.from}`,
    `To: ${p.to}`,
    p.cc.length ? `Cc: ${p.cc.join(", ")}` : "",
    `Reply-To: ${p.replyTo}`,
    `Subject: ${subjectEnc}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean).join("\r\n");

  const body = [
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    p.text,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    p.html,
    ``,
    `--${boundary}--`,
    ``,
  ].join("\r\n");

  return b64url(`${headers}\r\n\r\n${body}`);
}
