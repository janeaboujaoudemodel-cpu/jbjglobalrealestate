/**
 * breakfast-calendar-sync
 *
 * Owner-only. Pulls upcoming events from Jane's dedicated Google Calendar
 * (the same account connected via the Google Calendar connector) and writes
 * each one into `meeting_requests` so the backend stays in sync without ever
 * sending the brokerage to jbj.ae.
 *
 *  - Reads events for the next 60 days from the calendar id supplied in the
 *    request body (defaults to "primary").
 *  - Upserts into meeting_requests on (booking_kind, calendar_event_id) with
 *    booking_kind = 'brokerage_breakfast'.
 *  - Records the Google attendee email as requester_email and the event
 *    organiser/summary as the brokerage label.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = [
  "janeaboujaoudenails@gmail.com",
  "janeaboujaoudemodel@gmail.com",
  "infoo.jane@gmail.com",
];

const CAL_GATEWAY = "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("NO_AUTH");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !OWNER_EMAILS.includes(user.email || "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const CAL_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
    if (!LOVABLE_API_KEY || !CAL_API_KEY) {
      return new Response(JSON.stringify({
        error: "GOOGLE_CALENDAR_NOT_CONNECTED",
        message: "Link the Google Calendar connector first.",
      }), { status: 412, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const calendarId = String((body as Record<string, unknown>).calendarId || "primary");

    const now = new Date();
    const max = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: max.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });

    const res = await fetch(
      `${CAL_GATEWAY}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      {
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": CAL_API_KEY,
        },
      },
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return new Response(JSON.stringify({
        error: "GOOGLE_CALENDAR_ERROR",
        status: res.status,
        details: errJson,
      }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const json = await res.json() as {
      items?: Array<{
        id: string;
        summary?: string;
        description?: string;
        location?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
        attendees?: Array<{ email?: string; displayName?: string; organizer?: boolean }>;
        organizer?: { email?: string; displayName?: string };
        creator?: { email?: string; displayName?: string };
        status?: string;
      }>;
    };

    const items = Array.isArray(json.items) ? json.items : [];
    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let upserted = 0;
    for (const ev of items) {
      if (ev.status === "cancelled") continue;
      const startIso = ev.start?.dateTime || ev.start?.date;
      if (!startIso) continue;
      const startDate = new Date(startIso);
      const dateStr = startDate.toISOString().slice(0, 10);
      const timeStr = (ev.start?.dateTime ? startIso.slice(11, 16) : "TBD");

      // First non-organizer attendee = the brokerage guest.
      const guest = (ev.attendees || []).find((a) => !a.organizer && a.email);
      const requesterEmail = guest?.email || ev.creator?.email || "calendar@google";
      const requesterName = guest?.displayName || ev.creator?.displayName || "Google Calendar guest";
      const brokerageName = ev.summary || "Breakfast booking";

      // Try to find existing meeting_requests row for this calendar event.
      const { data: existing } = await service
        .from("meeting_requests")
        .select("id")
        .eq("calendar_event_id", ev.id)
        .maybeSingle();

      const row = {
        booking_kind: "brokerage_breakfast",
        brokerage_name: brokerageName,
        requester_name: requesterName,
        requester_email: requesterEmail,
        preferred_date: dateStr,
        preferred_time: timeStr,
        status: "pending",
        purpose: ev.summary || "Private Breakfast",
        notes: ev.description || null,
        calendar_event_id: ev.id,
        duration_minutes: 60,
        user_id: user.id,
      } as Record<string, unknown>;

      if (existing?.id) {
        await service.from("meeting_requests").update(row).eq("id", existing.id);
      } else {
        await service.from("meeting_requests").insert(row);
      }
      upserted++;
    }

    return new Response(JSON.stringify({ ok: true, calendarId, count: items.length, upserted }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
