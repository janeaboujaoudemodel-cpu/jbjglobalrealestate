/**
 * chat-support-notify — alerts the owner the moment a visitor lands in live
 * chat support (either from the hero search hand-off or by opening a chat
 * conversation).
 *
 * Public endpoint (visitors are not signed in on the gate), so it is:
 *   - schema-validated
 *   - rate limited per IP (10 / hour)
 *   - never trusted for anything but composing an internal alert
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { sendViaResend } from "../_shared/resendClient.ts";
import { wrapEmailHtml } from "../_shared/email-shell.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OWNER_ALERT_RECIPIENTS = ["janeaboujaoudenails@gmail.com", "infoo.jane@gmail.com"];
const FROM = "JBJ Live Chat <jane@jbj.ae>";

const BodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  visitorName: z.string().max(120).optional(),
  visitorEmail: z.string().email().max(200).optional(),
  visitorPhone: z.string().max(40).optional(),
  message: z.string().min(1).max(2000),
  source: z.string().max(60).optional(),
  pageSource: z.string().max(300).optional(),
  serviceType: z.string().max(80).optional(),
});

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function hashIp(ip: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const b = parsed.data;

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const ipHash = await hashIp(ip);

    const { data: allowed, error: rlErr } = await svc.rpc("check_rate_limit", {
      p_identifier: ipHash,
      p_action_type: "chat_support_notify",
      p_max_requests: 10,
      p_window_minutes: 60,
    });
    if (rlErr) console.error("[chat-support-notify] rate limit check failed", rlErr.message);
    else if (allowed === false) return json({ error: "rate_limited" }, 429);

    const who = b.visitorName || b.visitorEmail || "An anonymous visitor";
    const subject = `🔔 Live chat: ${who} needs assistance`;
    const rows: [string, string][] = [
      ["Visitor", who],
      ["Email", b.visitorEmail || "—"],
      ["Phone", b.visitorPhone || "—"],
      ["Source", b.source || "chat_widget"],
      ["Page", b.pageSource || "—"],
      ["Service", b.serviceType || "—"],
      ["Conversation", b.conversationId || "—"],
    ];

    const innerHtml = `
      <h1 style="margin:0 0 8px;font-size:20px;color:#042c1c;">Live chat needs you</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#4a4a4a;">
        The AI assistant is holding the conversation. Join to take over.
      </p>
      <div style="background:linear-gradient(180deg,#064E3B 0%,#042c1c 55%,#000 100%);color:#ffffff;
                  padding:14px 16px;border-radius:10px;font-size:14px;line-height:1.5;">
        “${esc(b.message)}”
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:16px;font-size:13px;color:#1A1A1A;">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 0;color:#7a7a7a;width:120px;">${esc(k)}</td><td style="padding:6px 0;">${esc(String(v))}</td></tr>`,
          )
          .join("")}
      </table>
      <p style="margin:20px 0 0;">
        <a href="https://www.jbj.ae/admin/chat-conversations"
           style="display:inline-block;background:linear-gradient(180deg,#064E3B 0%,#042c1c 55%,#000 100%);
                  color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;">
          Open live chat console
        </a>
      </p>`;

    const html = wrapEmailHtml({
      innerHtml,
      preheader: `${who}: ${b.message.slice(0, 90)}`,
    });

    const sent = await sendViaResend({
      from: FROM,
      to: OWNER_ALERT_RECIPIENTS,
      subject,
      html,
      reply_to: b.visitorEmail ? [b.visitorEmail] : undefined,
      tags: [{ name: "type", value: "chat_handoff_alert" }],
    });

    // In-app notification for every owner account.
    try {
      const { data: owners } = await svc
        .from("user_roles")
        .select("user_id")
        .eq("role", "owner");
      if (owners?.length) {
        await svc.from("notifications").insert(
          owners.map((o: { user_id: string }) => ({
            user_id: o.user_id,
            title: subject,
            body: b.message.slice(0, 500),
            notification_type: "chat_handoff",
            action_url: "/admin/chat-conversations",
            metadata: {
              conversation_id: b.conversationId ?? null,
              source: b.source ?? "chat_widget",
              visitor_email: b.visitorEmail ?? null,
              page_source: b.pageSource ?? null,
            },
          })),
        );
      }
    } catch (e) {
      console.error("[chat-support-notify] in-app notification failed", e);
    }

    return json({ ok: true, emailed: sent.ok, status: sent.status, error: sent.error ?? null });
  } catch (err) {
    console.error("[chat-support-notify] failed", err);
    return json({ error: "unexpected_error" }, 500);
  }
});
