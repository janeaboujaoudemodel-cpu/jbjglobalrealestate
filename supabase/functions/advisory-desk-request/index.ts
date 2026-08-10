/**
 * advisory-desk-request — a signed-in visitor asks JBJ (a human) to take over
 * from live chat, or their search could not be answered by the assistant.
 *
 * Requires a valid session: the visitor's identity (id, email) is taken from
 * the JWT, never from the request body, so the owner alert can never contain a
 * fabricated or anonymous visitor.
 *
 * Creates the ticket in public.advisory_desk_requests, emails the owner the
 * full visitor card with reply-by-email and reply-on-WhatsApp shortcuts, and
 * raises the in-app bell that deep-links into the owner backend queue.
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
const FROM = "JBJ Advisory Desk <jane@jbj.ae>";
const BACKEND_QUEUE = "https://www.jbj.ae/owner/crm/jbj/owner-advisory-desk";

const BodySchema = z.object({
  query: z.string().min(1).max(2000),
  source: z.string().max(60).optional(),
  pageSource: z.string().max(300).optional(),
  conversationId: z.string().uuid().optional(),
  transcript: z.string().max(20000).optional(),
  visitorName: z.string().max(120).optional(),
  visitorPhone: z.string().max(40).optional(),
});

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const waDigits = (phone?: string | null) => (phone || "").replace(/\D/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "sign_in_required" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "sign_in_required" }, 401);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const b = parsed.data;

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Identity: JWT first, then the visitor's stored profile, then what the
    // chat widget collected. Never a placeholder.
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    let name =
      b.visitorName ||
      (typeof meta.full_name === "string" ? meta.full_name : "") ||
      (typeof meta.name === "string" ? meta.name : "");
    let phone = b.visitorPhone || (typeof meta.phone === "string" ? meta.phone : "");

    try {
      const { data: profile } = await svc
        .from("crm_users_profile")
        .select("display_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!name && profile?.display_name) name = profile.display_name as string;
      if (!phone && profile?.phone) phone = profile.phone as string;
    } catch {
      /* profile lookup is a nicety, not a requirement */
    }

    const email = user.email ?? "";
    if (!name) name = email ? email.split("@")[0] : "Signed-in visitor";

    const { data: ticket, error: insErr } = await svc
      .from("advisory_desk_requests")
      .insert({
        user_id: user.id,
        visitor_name: name,
        visitor_email: email,
        visitor_phone: phone || null,
        query: b.query,
        source: b.source || "chat_escalation",
        page_source: b.pageSource || null,
        conversation_id: b.conversationId || null,
        transcript: b.transcript || null,
        status: "open",
      })
      .select("id, created_at")
      .single();
    if (insErr) {
      console.error("[advisory-desk-request] insert failed", insErr.message);
      return json({ error: "could_not_create_ticket" }, 500);
    }

    const deepLink = `${BACKEND_QUEUE}?request=${ticket.id}`;
    const digits = waDigits(phone);
    const waText = encodeURIComponent(
      `Hello ${name}, this is Jane from JBJ Global Real Estate regarding your request: "${b.query.slice(0, 200)}"`,
    );
    const waLink = digits ? `https://wa.me/${digits}?text=${waText}` : null;
    const mailtoLink = email
      ? `mailto:${email}?subject=${encodeURIComponent("Re: your JBJ enquiry")}&body=${encodeURIComponent(
          `Hello ${name},\n\nRegarding your enquiry: "${b.query}"\n\n`,
        )}`
      : null;

    const rows: [string, string][] = [
      ["Name", name],
      ["Email", email || "—"],
      ["Phone / WhatsApp", phone || "not on file"],
      ["What they searched", b.query],
      ["Where from", b.source || "chat_escalation"],
      ["Page", b.pageSource || "—"],
      ["Account ID", user.id],
      ["Conversation", b.conversationId || "—"],
    ];

    const btn = (href: string, label: string) =>
      `<a href="${href}" style="display:inline-block;margin:0 8px 8px 0;background:linear-gradient(180deg,#064E3B 0%,#042c1c 55%,#000 100%);color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600;">${label}</a>`;

    const innerHtml = `
      <h1 style="margin:0 0 8px;font-size:20px;color:#042c1c;">${esc(name)} asked to speak to JBJ</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#4a4a4a;">
        The assistant could not answer this. Reply directly from this email, or open the
        Advisory Desk in your backend to answer by email or WhatsApp and keep the log.
      </p>
      <div style="background:linear-gradient(180deg,#064E3B 0%,#042c1c 55%,#000 100%);color:#ffffff;
                  padding:14px 16px;border-radius:10px;font-size:14px;line-height:1.5;">
        “${esc(b.query)}”
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:16px;font-size:13px;color:#1A1A1A;">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:6px 0;color:#7a7a7a;width:150px;vertical-align:top;">${esc(k)}</td><td style="padding:6px 0;">${esc(String(v))}</td></tr>`,
          )
          .join("")}
      </table>
      ${
        b.transcript
          ? `<p style="margin:18px 0 6px;font-size:12px;color:#7a7a7a;text-transform:uppercase;letter-spacing:.08em;">Chat transcript</p>
             <pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;color:#1A1A1A;background:#F7F5F0;padding:12px;border-radius:8px;margin:0;">${esc(
               b.transcript.slice(0, 6000),
             )}</pre>`
          : ""
      }
      <p style="margin:20px 0 0;">
        ${btn(deepLink, "Answer in the backend")}
        ${mailtoLink ? btn(mailtoLink, "Reply by email") : ""}
        ${waLink ? btn(waLink, "Reply on WhatsApp") : ""}
      </p>`;

    const sent = await sendViaResend({
      from: FROM,
      to: OWNER_ALERT_RECIPIENTS,
      subject: `🔔 Advisory Desk: ${name} needs an answer`,
      html: wrapEmailHtml({ innerHtml, preheader: `${name}: ${b.query.slice(0, 90)}` }),
      reply_to: email ? [email] : undefined,
      tags: [{ name: "type", value: "advisory_desk_request" }],
    });

    try {
      const { data: staff } = await svc
        .from("user_roles")
        .select("user_id")
        .in("role", ["owner", "admin"]);
      const unique = Array.from(new Set((staff ?? []).map((s: { user_id: string }) => s.user_id)));
      if (unique.length) {
        await svc.from("notifications").insert(
          unique.map((uid) => ({
            user_id: uid,
            title: `Advisory Desk: ${name} needs an answer`,
            body: b.query.slice(0, 500),
            notification_type: "advisory_desk_request",
            action_url: `/owner/crm/jbj/owner-advisory-desk?request=${ticket.id}`,
            metadata: {
              request_id: ticket.id,
              visitor_email: email,
              visitor_phone: phone || null,
              visitor_name: name,
              source: b.source ?? "chat_escalation",
              page_source: b.pageSource ?? null,
            },
          })),
        );
      }
    } catch (e) {
      console.error("[advisory-desk-request] bell notification failed", e);
    }

    return json({ ok: true, requestId: ticket.id, emailed: sent.ok });
  } catch (err) {
    console.error("[advisory-desk-request] failed", err);
    return json({ error: "unexpected_error" }, 500);
  }
});
