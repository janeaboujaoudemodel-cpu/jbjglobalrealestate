/**
 * breakfast-calendar-status
 *
 * Owner-only. Returns the status of the dedicated Google Calendar used for
 * breakfast bookings:
 *  - whether the Google Calendar connector is linked
 *  - which Google account is connected (e.g. jane@citideveloper.com)
 *  - list of calendars on that account so the owner can pick the dedicated one
 *  - whether a Google Calendar appointment booking URL is saved in
 *    crm_owner_settings.google_calendar_booking_url
 *  - whether the saved URL is safe (does NOT redirect to jbj.ae)
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
const FORBIDDEN_HOSTS = ["jbj.ae", "www.jbj.ae", "/breakfast-booking"];

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

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: settings } = await service
      .from("crm_owner_settings")
      .select("google_calendar_booking_url")
      .eq("owner_id", user.id)
      .maybeSingle();

    const savedUrl = String(settings?.google_calendar_booking_url || "").trim();
    const savedUrlLower = savedUrl.toLowerCase();
    const urlForbidden = !!savedUrl && FORBIDDEN_HOSTS.some((h) => savedUrlLower.includes(h));
    const urlIsGoogle = !!savedUrl && /(^https:\/\/calendar\.(app\.)?google\.com\/)|(^https:\/\/calendar\.app\.google\/)/i.test(savedUrl);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const CAL_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY");

    const result: Record<string, unknown> = {
      bookingUrl: savedUrl || null,
      bookingUrlSafe: !!savedUrl && !urlForbidden,
      bookingUrlIsGoogle: urlIsGoogle,
      bookingUrlForbidden: urlForbidden,
      calendarConnected: false,
      calendarAccount: null,
      calendars: [],
    };

    if (!LOVABLE_API_KEY || !CAL_API_KEY) {
      result.message = "Google Calendar connector is not linked yet.";
      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const listRes = await fetch(`${CAL_GATEWAY}/users/me/calendarList?maxResults=50`, {
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": CAL_API_KEY,
        },
      });
      if (listRes.ok) {
        const j = await listRes.json() as {
          items?: Array<{ id: string; summary?: string; primary?: boolean; accessRole?: string }>
        };
        const items = Array.isArray(j.items) ? j.items : [];
        const primary = items.find((c) => c.primary);
        result.calendarConnected = true;
        result.calendarAccount = primary?.id || null;
        result.calendars = items.map((c) => ({
          id: c.id,
          name: c.summary || c.id,
          primary: !!c.primary,
          accessRole: c.accessRole || null,
        }));
      } else {
        result.message = `Could not read Google Calendar (${listRes.status}). Reconnect the connector.`;
      }
    } catch (e: unknown) {
      result.message = `Google Calendar API error: ${e instanceof Error ? e.message : "unknown"}`;
    }

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
