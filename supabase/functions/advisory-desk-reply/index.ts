/**
 * advisory-desk-reply — the owner answers an Advisory Desk ticket from the
 * backend and chooses the channel(s):
 *   - email    → sent server-side through Resend
 *   - whatsapp → a click-to-chat link is returned with the message pre-filled
 *                (the owner's WhatsApp sends it; the send is still logged here)
 *
 * Owner/admin only. Every reply is written to public.advisory_desk_replies and
 * the ticket is marked answered.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";
import { sendViaResend } from "../_shared/resendClient.ts";
import { wrapEmailHtml } from "../_shared/email-shell.ts";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FROM = "JBJ Global Real Estate <jane@jbj.ae>";

const BodySchema = z.object({
  requestId: z.string().uuid(),
  body: z.string().min(1).max(6000),
  channels: z.array(z.enum(["email", "whatsapp"])).min(1),
  subject: z.string().max(200).optional(),
  closeTicket: z.boolean().optional(),
});

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const b = parsed.data;

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: ticket, error: tErr } = await svc
      .from("advisory_desk_requests")
      .select("id, visitor_name, visitor_email, visitor_phone, query")
      .eq("id", b.requestId)
      .maybeSingle();
    if (tErr || !ticket) return json({ error: "ticket_not_found" }, 404);

    const name = ticket.visitor_name || "there";
    const results: Record<string, unknown> = {};

    if (b.channels.includes("email")) {
      if (!ticket.visitor_email) {
        results.email = { ok: false, error: "no_email_on_file" };
      } else {
        const innerHtml = `
          <h1 style="margin:0 0 8px;font-size:20px;color:#042c1c;">Hello ${esc(name)},</h1>
          <p style="margin:0 0 14px;font-size:13px;color:#7a7a7a;">Regarding your enquiry:</p>
          <div style="background:linear-gradient(180deg,#064E3B 0%,#042c1c 55%,#000 100%);color:#ffffff;
                      padding:12px 14px;border-radius:10px;font-size:13px;line-height:1.5;">
            “${esc(ticket.query)}”
          </div>
          <div style="margin:18px 0 0;font-size:14px;color:#1A1A1A;line-height:1.65;white-space:pre-wrap;">${esc(b.body)}</div>
          <p style="margin:22px 0 0;font-size:13px;color:#4a4a4a;">
            Jane Abou Jaoude — JBJ Global Real Estate<br/>
            +971 54 15 15 015 (call &amp; WhatsApp)
          </p>`;
        const sent = await sendViaResend({
          from: FROM,
          to: [ticket.visitor_email],
          subject: b.subject || "Re: your JBJ enquiry",
          html: wrapEmailHtml({ innerHtml, preheader: b.body.slice(0, 90) }),
          tags: [{ name: "type", value: "advisory_desk_reply" }],
        });
        results.email = { ok: sent.ok, error: sent.error ?? null };
        await svc.from("advisory_desk_replies").insert({
          request_id: ticket.id,
          channel: "email",
          body: b.body,
          sent_by: auth.userId,
          meta: { to: ticket.visitor_email, delivered: sent.ok },
        });
      }
    }

    if (b.channels.includes("whatsapp")) {
      const digits = (ticket.visitor_phone || "").replace(/\D/g, "");
      if (!digits) {
        results.whatsapp = { ok: false, error: "no_phone_on_file" };
      } else {
        const link = `https://wa.me/${digits}?text=${encodeURIComponent(b.body)}`;
        results.whatsapp = { ok: true, link };
        await svc.from("advisory_desk_replies").insert({
          request_id: ticket.id,
          channel: "whatsapp",
          body: b.body,
          sent_by: auth.userId,
          meta: { to: digits, link },
        });
      }
    }

    await svc
      .from("advisory_desk_requests")
      .update({
        status: b.closeTicket === false ? "in_progress" : "answered",
        handled_by: auth.userId,
        handled_at: new Date().toISOString(),
        preferred_channel: b.channels.join("+"),
      })
      .eq("id", ticket.id);

    return json({ ok: true, results });
  } catch (err) {
    console.error("[advisory-desk-reply] failed", err);
    return json({ error: "unexpected_error" }, 500);
  }
});
