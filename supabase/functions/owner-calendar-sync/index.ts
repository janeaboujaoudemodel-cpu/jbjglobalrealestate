/**
 * owner-calendar-sync — two-way calendar bridge for the JBJ owner.
 *
 * PULL : Google Calendar + Microsoft Outlook events -> public.owner_calendar_events
 * PUSH : JBJ-created owner_calendar_events -> Google Calendar + Outlook
 *
 * Owner-only (requireOwnerAuth). Provider credentials never touch the browser:
 * every provider call goes through the Lovable connector gateway from here.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev";
const PROVIDERS = ["google_calendar", "microsoft_outlook"] as const;
type Provider = typeof PROVIDERS[number];

const KEY_ENV: Record<Provider, string> = {
  google_calendar: "GOOGLE_CALENDAR_API_KEY",
  microsoft_outlook: "MICROSOFT_OUTLOOK_API_KEY",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

async function gateway(
  provider: Provider,
  path: string,
  init: { method?: string; body?: unknown } = {},
) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const connKey = Deno.env.get(KEY_ENV[provider]);
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!connKey) throw new Error(`${KEY_ENV[provider]} is not configured — connect the calendar first`);

  const res = await fetch(`${GATEWAY}/${provider}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connKey,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[owner-calendar-sync] ${provider} ${path} failed [${res.status}]: ${text}`);
    throw new Error(`[${res.status}] ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : {};
}

/* ------------------------------- normalising ------------------------------ */

interface NormalEvent {
  external_id: string;
  external_calendar_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  attendees: unknown[];
  is_cancelled: boolean;
  external_updated_at: string | null;
}

function normalizeGoogle(e: any, calendarId: string): NormalEvent | null {
  const start = e.start?.dateTime ?? (e.start?.date ? `${e.start.date}T00:00:00Z` : null);
  const end = e.end?.dateTime ?? (e.end?.date ? `${e.end.date}T23:59:59Z` : null);
  if (!start || !end) return null;
  return {
    external_id: String(e.id),
    external_calendar_id: calendarId,
    title: e.summary || "(no title)",
    description: e.description ?? null,
    location: e.location ?? null,
    start_at: new Date(start).toISOString(),
    end_at: new Date(end).toISOString(),
    all_day: Boolean(e.start?.date),
    attendees: Array.isArray(e.attendees)
      ? e.attendees.map((a: any) => ({ email: a.email, name: a.displayName, status: a.responseStatus }))
      : [],
    is_cancelled: e.status === "cancelled",
    external_updated_at: e.updated ? new Date(e.updated).toISOString() : null,
  };
}

function normalizeOutlook(e: any): NormalEvent | null {
  const start = e.start?.dateTime;
  const end = e.end?.dateTime;
  if (!start || !end) return null;
  const withZone = (v: string, tz?: string) =>
    new Date(/[zZ]|[+-]\d\d:\d\d$/.test(v) ? v : `${v}${tz === "UTC" || !tz ? "Z" : "Z"}`).toISOString();
  return {
    external_id: String(e.id),
    external_calendar_id: e.calendar?.id ?? null,
    title: e.subject || "(no title)",
    description: e.bodyPreview ?? null,
    location: e.location?.displayName ?? null,
    start_at: withZone(start, e.start?.timeZone),
    end_at: withZone(end, e.end?.timeZone),
    all_day: Boolean(e.isAllDay),
    attendees: Array.isArray(e.attendees)
      ? e.attendees.map((a: any) => ({
          email: a.emailAddress?.address,
          name: a.emailAddress?.name,
          status: a.status?.response,
        }))
      : [],
    is_cancelled: e.isCancelled === true,
    external_updated_at: e.lastModifiedDateTime ? new Date(e.lastModifiedDateTime).toISOString() : null,
  };
}

/* ---------------------------------- pull ---------------------------------- */

async function pullProvider(provider: Provider, from: string, to: string): Promise<NormalEvent[]> {
  if (provider === "google_calendar") {
    const list = await gateway(provider, "/calendar/v3/users/me/calendarList?maxResults=25");
    const cals = (list.items ?? []).filter((c: any) => c.selected !== false);
    const out: NormalEvent[] = [];
    for (const cal of cals) {
      const q = new URLSearchParams({
        timeMin: from,
        timeMax: to,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      });
      const res = await gateway(
        provider,
        `/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${q}`,
      );
      for (const e of res.items ?? []) {
        const n = normalizeGoogle(e, cal.id);
        if (n) out.push(n);
      }
    }
    return out;
  }

  const q = new URLSearchParams({
    startDateTime: from,
    endDateTime: to,
    $top: "250",
    $orderby: "start/dateTime",
    $select: "id,subject,bodyPreview,location,start,end,isAllDay,isCancelled,attendees,lastModifiedDateTime",
  });
  const res = await gateway(provider, `/me/calendarView?${q}`);
  return (res.value ?? []).map(normalizeOutlook).filter(Boolean) as NormalEvent[];
}

/* ---------------------------------- push ---------------------------------- */

async function pushEvent(provider: Provider, ev: any, externalId: string | null) {
  const attendees: any[] = Array.isArray(ev.attendees) ? ev.attendees : [];
  const meta = ev.metadata ?? {};
  const emails: string[] = [
    ...attendees.map((a) => a?.email).filter(Boolean),
    meta.attendee_email,
  ].filter(Boolean);

  if (provider === "google_calendar") {
    const body = {
      summary: ev.title,
      description: ev.description ?? meta.agenda ?? undefined,
      location: ev.location ?? undefined,
      start: { dateTime: new Date(ev.start_at).toISOString() },
      end: { dateTime: new Date(ev.end_at).toISOString() },
      attendees: emails.map((email) => ({ email })),
      extendedProperties: { private: { jbj_event_id: ev.id } },
    };
    const path = externalId
      ? `/calendar/v3/calendars/primary/events/${encodeURIComponent(externalId)}`
      : "/calendar/v3/calendars/primary/events";
    const res = await gateway(provider, path, { method: externalId ? "PATCH" : "POST", body });
    return String(res.id);
  }

  const body = {
    subject: ev.title,
    body: { contentType: "Text", content: ev.description ?? meta.agenda ?? "" },
    location: ev.location ? { displayName: ev.location } : undefined,
    start: { dateTime: new Date(ev.start_at).toISOString().slice(0, 19), timeZone: "UTC" },
    end: { dateTime: new Date(ev.end_at).toISOString().slice(0, 19), timeZone: "UTC" },
    attendees: emails.map((email) => ({ emailAddress: { address: email }, type: "required" })),
  };
  const path = externalId ? `/me/events/${encodeURIComponent(externalId)}` : "/me/events";
  const res = await gateway(provider, path, { method: externalId ? "PATCH" : "POST", body });
  return String(res.id);
}

/* --------------------------------- handler -------------------------------- */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;
  const ownerId = auth.userId;
  const db = admin();

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  const action = typeof payload.action === "string" ? payload.action : "status";

  try {
    /* ------------------------------- status ------------------------------- */
    if (action === "status") {
      const { data: states } = await db
        .from("owner_calendar_sync_state")
        .select("*")
        .eq("owner_id", ownerId);

      const providers: any[] = [];
      for (const provider of PROVIDERS) {
        const state = (states ?? []).find((s: any) => s.provider === provider) ?? null;
        let connected = false;
        let error: string | null = null;
        let account: string | null = null;
        if (!Deno.env.get(KEY_ENV[provider])) {
          error = "not_linked";
        } else {
          try {
            if (provider === "google_calendar") {
              const r = await gateway(provider, "/calendar/v3/users/me/calendarList?maxResults=1");
              account = r.items?.[0]?.id ?? null;
            } else {
              const r = await gateway(provider, "/me/calendars?$top=1&$select=id,name");
              account = r.value?.[0]?.name ?? null;
            }
            connected = true;
          } catch (e) {
            error = String((e as Error).message).slice(0, 300);
          }
        }
        providers.push({ provider, connected, account, error, state });
      }
      return json({ ok: true, providers });
    }

    /* -------------------------------- toggle ------------------------------ */
    if (action === "toggle") {
      const provider = payload.provider as Provider;
      if (!PROVIDERS.includes(provider)) return json({ error: "invalid provider" }, 400);
      const patch: Record<string, unknown> = { owner_id: ownerId, provider };
      for (const k of ["is_enabled", "push_enabled", "pull_enabled"]) {
        if (typeof payload[k] === "boolean") patch[k] = payload[k];
      }
      const { data, error } = await db
        .from("owner_calendar_sync_state")
        .upsert(patch, { onConflict: "owner_id,provider" })
        .select()
        .maybeSingle();
      if (error) throw error;
      return json({ ok: true, state: data });
    }

    /* --------------------------------- sync ------------------------------- */
    if (action === "sync") {
      const requested: Provider[] = PROVIDERS.includes(payload.provider)
        ? [payload.provider]
        : [...PROVIDERS];
      const daysBack = Math.min(Math.max(Number(payload.days_back ?? 14), 1), 90);
      const daysAhead = Math.min(Math.max(Number(payload.days_ahead ?? 120), 1), 365);
      const from = new Date(Date.now() - daysBack * 86400000).toISOString();
      const to = new Date(Date.now() + daysAhead * 86400000).toISOString();

      const results: any[] = [];

      for (const provider of requested) {
        const { data: existingState } = await db
          .from("owner_calendar_sync_state")
          .select("*")
          .eq("owner_id", ownerId)
          .eq("provider", provider)
          .maybeSingle();
        const state = existingState ?? { is_enabled: true, pull_enabled: true, push_enabled: true };
        if (existingState && existingState.is_enabled === false) {
          results.push({ provider, skipped: "disabled" });
          continue;
        }

        let pulled = 0;
        let pushed = 0;
        let lastError: string | null = null;

        // ---- PULL ----
        if (state.pull_enabled !== false) {
          try {
            const events = await pullProvider(provider, from, to);
            for (const e of events) {
              const row = {
                owner_id: ownerId,
                provider,
                external_id: e.external_id,
                external_calendar_id: e.external_calendar_id,
                title: e.title,
                description: e.description,
                location: e.location,
                start_at: e.start_at,
                end_at: e.end_at,
                all_day: e.all_day,
                attendees: e.attendees,
                is_cancelled: e.is_cancelled,
                external_updated_at: e.external_updated_at,
                last_synced_at: new Date().toISOString(),
                sync_direction: "pulled",
              };
              const { error } = await db
                .from("owner_calendar_events")
                .upsert(row, { onConflict: "owner_id,provider,external_id" });
              if (error) throw error;
              pulled++;
            }
          } catch (e) {
            lastError = String((e as Error).message).slice(0, 500);
          }
        }

        // ---- PUSH ----
        // The JBJ calendar is one shared executive calendar: events can be
        // authored by any owner account, so push is scoped by provider="jbj"
        // (owner-only route) instead of a single owner_id, and is_cancelled is
        // matched null-safely (legacy rows were inserted without the flag).
        let candidates = 0;
        if (state.push_enabled !== false && !lastError) {
          try {
            const { data: locals } = await db
              .from("owner_calendar_events")
              .select("id, title, description, location, start_at, end_at, metadata, attendees, updated_at, last_synced_at")
              .eq("provider", "jbj")
              .or("is_cancelled.is.null,is_cancelled.eq.false")
              .gte("start_at", from)
              .lte("start_at", to)
              .limit(200);

            candidates = (locals ?? []).length;
            for (const ev of locals ?? []) {
              const meta = (ev.metadata ?? {}) as any;
              const sync = (meta.sync ?? {}) as Record<string, string>;
              const externalId = sync[provider] ?? null;
              const alreadyFresh =
                externalId && ev.last_synced_at && new Date(ev.last_synced_at) >= new Date(ev.updated_at);
              if (alreadyFresh) continue;

              const newId = await pushEvent(provider, ev, externalId);
              const nextMeta = { ...meta, sync: { ...sync, [provider]: newId } };
              await db
                .from("owner_calendar_events")
                .update({ metadata: nextMeta, last_synced_at: new Date().toISOString() })
                .eq("id", ev.id);
              pushed++;
            }
          } catch (e) {
            lastError = String((e as Error).message).slice(0, 500);
          }
        }


        const { data: saved } = await db
          .from("owner_calendar_sync_state")
          .upsert(
            {
              owner_id: ownerId,
              provider,
              last_pull_at: state.pull_enabled !== false ? new Date().toISOString() : existingState?.last_pull_at ?? null,
              last_push_at: state.push_enabled !== false ? new Date().toISOString() : existingState?.last_push_at ?? null,
              events_pulled: pulled,
              events_pushed: pushed,
              last_error: lastError,
            },
            { onConflict: "owner_id,provider" },
          )
          .select()
          .maybeSingle();

        results.push({ provider, pulled, pushed, push_candidates: candidates, error: lastError, state: saved });
      }

      return json({ ok: true, results });
    }

    return json({ error: `unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("[owner-calendar-sync] failure:", e);
    return json({ error: String((e as Error).message).slice(0, 800) }, 500);
  }
});
