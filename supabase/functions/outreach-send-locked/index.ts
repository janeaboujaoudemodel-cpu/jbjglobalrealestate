/**
 * outreach-send-locked
 *
 * Resend-backed locked payload sender.
 * Re-verifies the payload_hash before sending. Never re-renders, never
 * substitutes variables, never rewrites links. The bytes in the row are
 * the bytes the recipient sees.
 *
 * Owner-only.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendViaResend } from "../_shared/resendClient.ts";
import { buildIntendedSendKey, recordJbjResendSend, type JbjPortalKind } from "../_shared/jbjSpine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = [
  "janeaboujaoudenails@gmail.com",
  "infoo.jane@gmail.com",
];

interface SendBody {
  payload_id: string;
  /** Optional client-computed hash for extra anti-tamper check. */
  expected_hash?: string;
}

const portalFromSurface = (surface: string | null | undefined): JbjPortalKind => {
  const s = String(surface || "").toLowerCase();
  if (s.includes("brokerage")) return "brokerage";
  if (s.includes("client") || s.includes("buyer")) return "client_buyer";
  if (s.includes("seller")) return "client_seller";
  if (s.includes("career")) return "career";
  if (s.includes("broker")) return "individual_broker";
  return "developer";
};

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
    if (body.expected_hash && body.expected_hash !== row.payload_hash) {
      return json({ error: "Payload hash mismatch" }, 409);
    }
    if (row.status === "sent") {
      return json({ ok: true, reused: true, message_id: row.provider_message_id ?? null }, 200);
    }

    const ccEmails = Array.isArray(row.cc_emails) ? row.cc_emails.filter(Boolean) : [];
    const result = await sendViaResend({
      from: `${row.from_name} <${row.from_email}>`,
      to: row.recipient_email,
      cc: ccEmails.length ? ccEmails : undefined,
      reply_to: row.reply_to,
      subject: row.subject,
      html: row.html,
      text: row.plain_text || undefined,
      headers: {
        "X-JBJ-Locked-Payload-ID": String(row.id),
        "X-JBJ-Payload-Hash": String(row.payload_hash),
      },
      tags: [
        { name: "surface", value: String(row.surface || "locked_payload").slice(0, 256) },
      ],
    });

    if (!result.ok) {
      await service.from("outreach_locked_payloads").update({
        status: "failed",
        send_error: result.error ?? `Resend ${result.status}`,
      }).eq("id", row.id);
      return json({ error: result.error ?? "Resend send failed", status: result.status, details: result.data ?? null }, result.status >= 400 ? result.status : 502);
    }

    const messageId = result.data?.id ?? null;
    await service.from("outreach_locked_payloads").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      provider_message_id: messageId,
      send_error: null,
    }).eq("id", row.id);

    const portalKind = portalFromSurface(row.surface);
    await recordJbjResendSend({
      portalKind,
      entityType: portalKind === "brokerage" ? "brokerage" : portalKind === "career" ? "candidate" : portalKind.startsWith("client") ? "client" : "developer",
      entityId: null,
      email: row.recipient_email,
      templateSlug: String(row.surface || "locked_payload"),
      senderEmail: row.from_email,
      replyTo: row.reply_to,
      subject: row.subject,
      resendMessageId: messageId,
      providerResponse: result.data ?? {},
      idempotencyKey: buildIntendedSendKey({
        portalKind,
        sendType: String(row.surface || "").includes("test") ? "test" : "campaign",
        templateSlug: String(row.surface || "locked_payload"),
        intendedSendId: String(row.id),
      }),
      intendedSendId: String(row.id),
      sendCategory: String(row.surface || "").includes("test") ? "test" : "campaign",
    });

    return json({ ok: true, message_id: messageId, provider: "resend" }, 200);
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

