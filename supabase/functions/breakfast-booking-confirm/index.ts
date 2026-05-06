/**
 * breakfast-booking-confirm (PUBLIC)
 *
 * Confirms a breakfast booking using a one-time invite token.
 *  - Validates token + selected slot capacity
 *  - Updates the placeholder meeting_requests row with attendee details
 *  - Advances the linked brokerage to outreach_stage = 'meeting_booked'
 *  - Logs an inbound entry on the relationship timeline
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AttendeeRow { name?: string; phone?: string; email?: string }
interface Body {
  token: string;
  slotId: string;
  fullName: string;
  email: string;
  phone?: string;
  attendeeCount: number;
  attendees?: AttendeeRow[];
  briefingTopics?: string;
  partnershipFocus?: string;
  notes?: string;
  consent: boolean;
  consentSnapshot?: Record<string, any>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as Body;
    const required: (keyof Body)[] = ["token", "slotId", "fullName", "email", "attendeeCount", "consent"];
    for (const k of required) {
      if (body[k] === undefined || body[k] === null || body[k] === "") {
        return new Response(JSON.stringify({ error: `Missing field: ${k}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    if (!body.consent) {
      return new Response(JSON.stringify({ error: "Consent required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.token.startsWith("test_")) {
      return new Response(JSON.stringify({
        ok: true, preview: true,
        message: "Preview mode — booking not recorded.",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look up the invite
    const { data: invite, error: invErr } = await service
      .from("meeting_requests")
      .select("id, brokerage_id, brokerage_name, status, user_id")
      .eq("invite_token", body.token)
      .maybeSingle();
    if (invErr) throw invErr;
    if (!invite) {
      return new Response(JSON.stringify({ error: "Invitation not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (invite.status === "cancelled") {
      return new Response(JSON.stringify({ error: "Invitation has been cancelled" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate slot
    const { data: slot, error: slotErr } = await service
      .from("breakfast_slots")
      .select("id, slot_at, capacity, is_active")
      .eq("id", body.slotId)
      .maybeSingle();
    if (slotErr) throw slotErr;
    if (!slot || !slot.is_active || new Date(slot.slot_at) <= new Date()) {
      return new Response(JSON.stringify({ error: "This slot is no longer available." }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Capacity check — count confirmed bookings on this slot
    const slotDate = new Date(slot.slot_at);
    const dateStr = slotDate.toISOString().slice(0, 10);
    const timeStr = slotDate.toISOString().slice(11, 16);
    const { count: usedCount } = await service
      .from("meeting_requests")
      .select("id", { count: "exact", head: true })
      .eq("booking_kind", "brokerage_breakfast")
      .eq("preferred_date", dateStr)
      .eq("preferred_time", timeStr)
      .in("status", ["pending", "completed"])
      .neq("id", invite.id);

    if ((usedCount || 0) >= slot.capacity) {
      return new Response(JSON.stringify({ error: "This slot just filled up. Please pick another time." }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the invite row
    const { error: updErr } = await service
      .from("meeting_requests")
      .update({
        requester_name: body.fullName,
        requester_email: body.email,
        requester_phone: body.phone || null,
        preferred_date: dateStr,
        preferred_time: timeStr,
        attendee_count: body.attendeeCount,
        briefing_topics: body.briefingTopics || null,
        partnership_focus: body.partnershipFocus || null,
        notes: body.notes || null,
        status: "pending",
      })
      .eq("id", invite.id);
    if (updErr) throw updErr;

    // Advance brokerage stage
    if (invite.brokerage_id) {
      await service
        .from("crm_brokerages")
        .update({
          outreach_stage: "meeting_booked",
          last_reply_at: new Date().toISOString(),
        })
        .eq("id", invite.brokerage_id);

      // Audit on relationship timeline
      if (invite.user_id) {
        await service.from("crm_relationship_email_log").insert({
          owner_id: invite.user_id,
          entity_type: "brokerage",
          entity_id: invite.brokerage_id,
          direction: "inbound",
          sent_via: "booking_page",
          from_email: body.email,
          to_emails: [],
          subject: `Breakfast slot confirmed — ${invite.brokerage_name}`,
          body_snippet: `Confirmed ${dateStr} ${timeStr} — ${body.attendeeCount} attendee(s)`,
          sent_at: new Date().toISOString(),
        });
      }
    }

    // In-app notification for the owner (Jane)
    if (invite.user_id) {
      try {
        await service.from("notifications").insert({
          user_id: invite.user_id,
          notification_type: "breakfast_booked",
          title: `Breakfast booked — ${invite.brokerage_name}`,
          body: `${body.fullName} (${body.email}) · ${dateStr} ${timeStr} · ${body.attendeeCount} attendee(s)`,
          action_url: "/owner/crm/relationships?tab=brokerages&section=breakfast",
          metadata: {
            brokerage_id: invite.brokerage_id,
            brokerage_name: invite.brokerage_name,
            slot_at: slot.slot_at,
            attendee_count: body.attendeeCount,
            briefing_topics: body.briefingTopics || null,
            partnership_focus: body.partnershipFocus || null,
            phone: body.phone || null,
          },
        });
      } catch (notifyErr) {
        console.warn("notifications insert failed:", notifyErr);
      }
    }

    // Email Jane with the booking summary (best-effort, non-blocking)
    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      const GMAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
      if (LOVABLE_API_KEY && GMAIL_API_KEY) {
        const slotPretty = new Intl.DateTimeFormat("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
          hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai",
        }).format(new Date(slot.slot_at)) + " (GST)";

        const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F7F2EA;font-family:Inter,Arial,sans-serif;color:#1A1A1A;line-height:1.6">
<div style="background:linear-gradient(180deg,#FDFBF7 0%,#F7F2EA 100%);padding:40px 16px">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #B89555;border-radius:14px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B89555;font-weight:700;margin-bottom:18px">JBJ Global · Breakfast Booked</div>
    <h2 style="margin:0 0 8px;font-size:22px">${invite.brokerage_name}</h2>
    <p style="margin:0 0 20px;color:#1A1A1A99;font-size:14px">${slotPretty}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#1A1A1A99;width:140px">Contact</td><td><strong>${body.fullName}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#1A1A1A99">Email</td><td><a href="mailto:${body.email}" style="color:#1A1A1A">${body.email}</a></td></tr>
      ${body.phone ? `<tr><td style="padding:6px 0;color:#1A1A1A99">Phone</td><td><a href="tel:${body.phone}" style="color:#1A1A1A">${body.phone}</a></td></tr>` : ""}
      <tr><td style="padding:6px 0;color:#1A1A1A99">Attendees</td><td>${body.attendeeCount}</td></tr>
    </table>
    ${body.briefingTopics ? `<div style="margin-top:16px;padding:14px;background:#FDFBF7;border-left:3px solid #B89555;border-radius:6px"><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B89555;font-weight:700;margin-bottom:6px">Briefing</div>${body.briefingTopics.replace(/</g,"&lt;")}</div>` : ""}
    ${body.partnershipFocus ? `<div style="margin-top:12px;padding:14px;background:#FDFBF7;border-left:3px solid #B89555;border-radius:6px"><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B89555;font-weight:700;margin-bottom:6px">Partnership focus</div>${body.partnershipFocus.replace(/</g,"&lt;")}</div>` : ""}
    ${body.notes ? `<div style="margin-top:12px;padding:14px;background:#FDFBF7;border-left:3px solid #B89555;border-radius:6px"><div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B89555;font-weight:700;margin-bottom:6px">Notes</div>${body.notes.replace(/</g,"&lt;")}</div>` : ""}
  </div>
</div></body></html>`;

        const subj = `Breakfast booked — ${invite.brokerage_name} · ${dateStr} ${timeStr}`;
        const headers = [
          `From: JBJ Breakfast <contact@jbj.ae>`,
          `To: janeaboujaoudenails@gmail.com`,
          `Reply-To: ${body.email}`,
          `Subject: ${subj}`,
          "MIME-Version: 1.0",
          'Content-Type: text/html; charset="UTF-8"',
        ].join("\r\n");
        const bytes = new TextEncoder().encode(headers + "\r\n\r\n" + html);
        let bin = ""; bytes.forEach((b) => bin += String.fromCharCode(b));
        const raw = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        await fetch("https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GMAIL_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw }),
        });
      }
    } catch (mailErr) {
      console.warn("Owner notify email failed:", mailErr);
    }

    return new Response(JSON.stringify({
      ok: true,
      slotAt: slot.slot_at,
      brokerageName: invite.brokerage_name,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("breakfast-booking-confirm error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
