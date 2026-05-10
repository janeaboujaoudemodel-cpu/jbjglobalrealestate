// send-meeting-agenda
// Sends an automated meeting-agenda email to the attendee of an
// owner_calendar_events row. Owner-only; uses service role to load the event.
//
// Body: { eventId: string; mode?: "create" | "update" }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

interface EventMeta {
  attendee_name?: string;
  attendee_phone?: string;
  attendee_email?: string;
  agenda?: string;
}

function fmt(dateIso: string) {
  const d = new Date(dateIso);
  return d.toLocaleString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function escape(s: string) {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" } as Record<string, string>)[c]
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate caller
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { eventId, mode = "create" } = await req.json();
    if (!eventId) {
      return new Response(JSON.stringify({ error: "eventId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: ev, error } = await admin
      .from("owner_calendar_events")
      .select("id,owner_id,title,description,location,start_at,end_at,metadata")
      .eq("id", eventId)
      .single();
    if (error || !ev) {
      return new Response(JSON.stringify({ error: "event not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (ev.owner_id !== userId) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meta = (ev.metadata || {}) as EventMeta;
    const to = (meta.attendee_email || "").trim();
    if (!to) {
      return new Response(JSON.stringify({ ok: true, skipped: "no attendee email" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subjectPrefix = mode === "update" ? "[Updated] " : "";
    const subject = `${subjectPrefix}Meeting agenda — ${ev.title}`;

    const mapsUrl = ev.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`
      : null;

    const html = `
      <div style="font-family: Inter, Arial, sans-serif; color:#1A1A1A; max-width:560px; margin:0 auto; padding:24px; background:#FDFBF7;">
        <h2 style="margin:0 0 16px; font-size:20px; color:#1A1A1A;">Meeting agenda</h2>
        <p style="margin:0 0 12px; color:#1A1A1A;">Dear ${escape(meta.attendee_name || "")},</p>
        <p style="margin:0 0 16px; color:#1A1A1A;">This is to confirm our upcoming meeting. Details below:</p>
        <table style="border-collapse:collapse; width:100%; margin:0 0 16px;">
          <tr><td style="padding:6px 8px; color:#1A1A1A; width:120px;"><b>Subject</b></td><td style="padding:6px 8px;">${escape(ev.title)}</td></tr>
          <tr><td style="padding:6px 8px;"><b>When</b></td><td style="padding:6px 8px;">${escape(fmt(ev.start_at))} – ${escape(fmt(ev.end_at))}</td></tr>
          ${ev.location ? `<tr><td style="padding:6px 8px;"><b>Location</b></td><td style="padding:6px 8px;">${escape(ev.location)}${mapsUrl ? ` &nbsp;·&nbsp; <a href="${mapsUrl}" style="color:#B89555;">Open in Maps</a>` : ""}</td></tr>` : ""}
          ${meta.agenda ? `<tr><td style="padding:6px 8px; vertical-align:top;"><b>Agenda</b></td><td style="padding:6px 8px; white-space:pre-wrap;">${escape(meta.agenda)}</td></tr>` : ""}
        </table>
        <p style="margin:24px 0 4px; color:#1A1A1A;">Looking forward to meeting you.</p>
        <p style="margin:16px 0 0; color:#1A1A1A;">Best regards,<br/><b>JBJ Global Real Estate Executive Office</b></p>
      </div>
    `;

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured — agenda email not sent");
      return new Response(JSON.stringify({ ok: true, skipped: "resend not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "JBJ Global Real Estate <noreply@jbj.ae>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("Resend error", resendRes.status, errText);
      return new Response(JSON.stringify({ error: "send failed", detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-meeting-agenda fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
