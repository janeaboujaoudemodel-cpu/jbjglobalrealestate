// process-meeting-reminders
// Runs on a cron schedule. For each upcoming owner_calendar_events row, checks
// configured reminder offsets (minutes-before-start) in metadata.reminders and
// sends an attendee reminder email when the offset window is reached. Tracks
// already-sent offsets in metadata.sent_reminders to avoid duplicates.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EventMeta {
  attendee_name?: string;
  attendee_phone?: string;
  attendee_email?: string;
  agenda?: string;
  reminders?: number[]; // minutes before start
  sent_reminders?: number[];
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

function humanOffset(min: number) {
  if (min >= 1440) return `${Math.round(min / 1440)} day(s)`;
  if (min >= 60) return `${Math.round(min / 60)} hour(s)`;
  return `${min} minutes`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const now = Date.now();
  // Look at events starting within the next 48h
  const horizon = new Date(now + 48 * 60 * 60 * 1000).toISOString();
  const fromTs = new Date(now - 5 * 60 * 1000).toISOString();

  const { data: events, error } = await admin
    .from("owner_calendar_events")
    .select("id,owner_id,title,description,location,start_at,end_at,metadata")
    .gte("start_at", fromTs)
    .lte("start_at", horizon);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  for (const ev of events || []) {
    const meta = (ev.metadata || {}) as EventMeta;
    const to = (meta.attendee_email || "").trim();
    if (!to) continue;
    const reminders = Array.isArray(meta.reminders) ? meta.reminders : [1440, 30, 15];
    const already = new Set(meta.sent_reminders || []);
    const startMs = new Date(ev.start_at).getTime();
    const minutesUntil = (startMs - now) / 60000;

    const dueOffsets = reminders.filter(
      (off) => !already.has(off) && minutesUntil <= off && minutesUntil > -2,
    );
    if (dueOffsets.length === 0) continue;

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY missing — skipping reminder send");
      continue;
    }

    const offset = Math.max(...dueOffsets);
    const mapsUrl = ev.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`
      : null;

    const html = `
      <div style="font-family: Inter, Arial, sans-serif; color:#1A1A1A; max-width:560px; margin:0 auto; padding:24px; background:#FDFBF7;">
        <h2 style="margin:0 0 16px; font-size:20px;">Meeting reminder — in ${humanOffset(offset)}</h2>
        <p style="margin:0 0 12px;">Dear ${escape(meta.attendee_name || "")},</p>
        <p style="margin:0 0 16px;">A friendly reminder about our upcoming meeting:</p>
        <table style="border-collapse:collapse; width:100%; margin:0 0 16px;">
          <tr><td style="padding:6px 8px; width:120px;"><b>Subject</b></td><td style="padding:6px 8px;">${escape(ev.title)}</td></tr>
          <tr><td style="padding:6px 8px;"><b>When</b></td><td style="padding:6px 8px;">${escape(fmt(ev.start_at))} – ${escape(fmt(ev.end_at))}</td></tr>
          ${ev.location ? `<tr><td style="padding:6px 8px;"><b>Location</b></td><td style="padding:6px 8px;">${escape(ev.location)}${mapsUrl ? ` &nbsp;·&nbsp; <a href="${mapsUrl}" style="color:#B89555;">Open in Maps</a>` : ""}</td></tr>` : ""}
          ${meta.agenda ? `<tr><td style="padding:6px 8px; vertical-align:top;"><b>Agenda</b></td><td style="padding:6px 8px; white-space:pre-wrap;">${escape(meta.agenda)}</td></tr>` : ""}
        </table>
        <p style="margin:16px 0 0;">Best regards,<br/><b>JBJ Global Real Estate Executive Office</b></p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "JBJ Global Real Estate <noreply@jbj.ae>",
        to: [to],
        subject: `Reminder — ${ev.title} in ${humanOffset(offset)}`,
        html,
      }),
    });

    if (!res.ok) {
      console.error("reminder send failed", await res.text());
      continue;
    }

    const newSent = [...already, ...dueOffsets];
    await admin
      .from("owner_calendar_events")
      .update({ metadata: { ...meta, sent_reminders: newSent } })
      .eq("id", ev.id);
    sent++;
  }

  return new Response(JSON.stringify({ ok: true, processed: events?.length || 0, sent }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
