// broadcast-subscribers — Fan-out a single email to every active newsletter
// subscriber. Honors is_active + suppression, logs every send into
// newsletter_events, throttles per Resend shared client.
//
// Invocation:
//  1. Owner-side (manual "Announce" button): requires a valid user JWT
//     belonging to an owner (validated via requireOwnerAuth).
//  2. Server-side trigger (pg_net from a DB trigger): authenticated by
//     the BROADCAST_TRIGGER_SECRET header.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendViaResend } from "../_shared/resendClient.ts";
import { wrapEmailHtml } from "../_shared/email-shell.ts";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-broadcast-secret",
};

type BroadcastType = "new_listing" | "new_feature" | "news" | "announcement";

interface BroadcastPayload {
  type: BroadcastType;
  subject: string;
  preheader?: string;
  heading: string;
  body_html: string;
  cta_url?: string;
  cta_label?: string;
  cover_image_url?: string;
  topic_key?: string; // for dedupe (e.g. project:<id>)
}

const FROM = Deno.env.get("BROADCAST_FROM_ADDRESS") ||
  "JBJ Global Real Estate <hello@jbj.ae>";
const PUBLIC_SITE = Deno.env.get("PUBLIC_SITE_URL") ||
  "https://www.jbj.ae";

function renderInner(p: BroadcastPayload, unsubscribeUrl: string): string {
  const cover = p.cover_image_url
    ? `<tr><td style="padding:0 0 18px"><img src="${p.cover_image_url}" alt="" width="600" style="display:block;width:100%;max-width:600px;border-radius:12px;border:0"/></td></tr>`
    : "";
  const cta = p.cta_url && p.cta_label
    ? `<tr><td align="center" style="padding:18px 0 8px">
        <a href="${p.cta_url}" style="background:#0F5132;color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;font-size:14px;letter-spacing:0.04em;display:inline-block">${p.cta_label}</a>
       </td></tr>`
    : "";
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="padding:0 0 8px">
      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#B89555;font-weight:700">JBJ · ${labelFor(p.type)}</div>
    </td></tr>
    <tr><td style="padding:4px 0 14px">
      <h1 style="margin:0;font-size:24px;line-height:1.25;color:#1A1A1A;font-weight:700;letter-spacing:-0.01em">${escape(p.heading)}</h1>
    </td></tr>
    ${cover}
    <tr><td style="font-size:15px;line-height:1.65;color:#1A1A1A">${p.body_html}</td></tr>
    ${cta}
    <tr><td style="padding:28px 0 0;border-top:1px solid #EFE6D6;margin-top:18px">
      <p style="font-size:11px;color:#6B6B6B;line-height:1.6;margin:14px 0 0">
        You're receiving this because you subscribed to JBJ Global Real Estate updates.
        <a href="${unsubscribeUrl}" style="color:#6B6B6B;text-decoration:underline">Unsubscribe</a>.
      </p>
    </td></tr>
  </table>`;
}

function labelFor(t: BroadcastType) {
  return ({
    new_listing: "New Listing",
    new_feature: "New Feature",
    news: "Market News",
    announcement: "Announcement",
  })[t];
}
function escape(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // --- AuthZ: either trigger-secret OR owner JWT
  const triggerSecret = Deno.env.get("BROADCAST_TRIGGER_SECRET");
  const headerSecret = req.headers.get("x-broadcast-secret");
  const isTriggerCall = !!triggerSecret && headerSecret === triggerSecret;

  // Bootstrap: ensure the DB-side trigger secret matches the edge env so
  // pg_net trigger calls authenticate. Cheap upsert, runs on every call.
  if (triggerSecret) {
    await supabase
      .from("broadcast_settings")
      .upsert({ id: true, function_url:
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/broadcast-subscribers`,
        trigger_secret: triggerSecret, enabled: true }, { onConflict: "id" });
  }

  if (!isTriggerCall) {
    const owner = await requireOwnerAuth(req, corsHeaders);
    if (owner.response) return owner.response;
  }

  let payload: BroadcastPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!payload?.type || !payload?.subject || !payload?.heading || !payload?.body_html) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Dedupe: 30-min window per topic_key
  if (payload.topic_key) {
    const since = new Date(Date.now() - 30 * 60_000).toISOString();
    const { data: dup } = await supabase
      .from("newsletter_events")
      .select("id")
      .eq("event_type", "broadcast")
      .filter("metadata->>topic_key", "eq", payload.topic_key)
      .gte("created_at", since)
      .limit(1);
    if (dup && dup.length > 0) {
      return new Response(JSON.stringify({ ok: true, skipped: "duplicate_within_30m" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // --- Audience
  const { data: subs, error: subsErr } = await supabase
    .from("newsletter_subscribers")
    .select("id,email,unsubscribe_token")
    .eq("is_active", true);

  if (subsErr) {
    return new Response(JSON.stringify({ error: subsErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!subs || subs.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0, note: "no active subscribers" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0, failed = 0;
  for (const s of subs) {
    const unsubscribeUrl =
      `${PUBLIC_SITE}/unsubscribe?token=${encodeURIComponent(s.unsubscribe_token ?? "")}`;
    const html = wrapEmailHtml({
      innerHtml: renderInner(payload, unsubscribeUrl),
      preheader: payload.preheader || payload.heading,
    });

    const res = await sendViaResend({
      from: FROM,
      to: s.email,
      subject: payload.subject,
      html,
      tags: [
        { name: "type", value: "broadcast" },
        { name: "kind", value: payload.type },
      ],
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    await supabase.from("newsletter_events").insert({
      email: s.email,
      event_type: "broadcast",
      metadata: {
        topic_key: payload.topic_key ?? null,
        broadcast_type: payload.type,
        subject: payload.subject,
        ok: res.ok,
        status: res.status,
        error: res.error ?? null,
      },
    });

    if (res.ok) sent++; else failed++;
    if (!res.ok && res.status === 429) break; // quota
  }

  return new Response(JSON.stringify({ ok: true, sent, failed, total: subs.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
