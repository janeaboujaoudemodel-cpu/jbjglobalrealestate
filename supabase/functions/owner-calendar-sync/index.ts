import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const GATEWAY = "https://connector-gateway.lovable.dev";
const PROVIDERS = ["google_calendar", "microsoft_outlook"] as const;
type Provider = typeof PROVIDERS[number];
type Account = { provider: Provider; accountKey: string; envName: string; key: string };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const admin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

function accounts(): Account[] {
  const env = Deno.env.toObject();
  const out: Account[] = [];
  const patterns: Array<[Provider, RegExp]> = [
    ["google_calendar", /^GOOGLE_CALENDAR_API_KEY(?:_(\d+))?$/],
    ["microsoft_outlook", /^MICROSOFT_OUTLOOK_API_KEY(?:_(\d+))?$/],
  ];
  for (const [provider, pattern] of patterns) {
    for (const [envName, key] of Object.entries(env)) {
      const match = envName.match(pattern);
      if (match && key) out.push({ provider, envName, key, accountKey: match[1] ? `account_${match[1]}` : "account_0" });
    }
  }
  return out.sort((a, b) => `${a.provider}:${a.accountKey}`.localeCompare(`${b.provider}:${b.accountKey}`));
}

async function gateway(account: Account, path: string, init: { method?: string; body?: unknown } = {}) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) throw new Error("Calendar gateway is not configured");
  const res = await fetch(`${GATEWAY}/${account.provider}${path}`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": account.key, "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`[${res.status}] ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

async function discover(account: Account) {
  if (account.provider === "google_calendar") {
    const [profile, list] = await Promise.all([
      gateway(account, "/calendar/v3/calendars/primary"),
      gateway(account, "/calendar/v3/users/me/calendarList?maxResults=100"),
    ]);
    const email = typeof profile.id === "string" && profile.id.includes("@") ? profile.id : null;
    return {
      label: email ?? profile.summary ?? "Google account",
      email,
      calendars: (list.items ?? []).map((c: any) => ({ id: String(c.id), name: c.summary ?? c.id, primary: c.primary === true, writable: ["owner", "writer"].includes(c.accessRole) })),
    };
  }
  const [profile, list] = await Promise.all([
    gateway(account, "/me?$select=displayName,mail,userPrincipalName").catch(() => ({} as any)),
    gateway(account, "/me/calendars?$top=100&$select=id,name,canEdit,isDefaultCalendar,owner"),
  ]);
  const items = list.value ?? [];
  const ownerAddress = (items.find((c: any) => c.isDefaultCalendar === true) ?? items[0])?.owner?.address ?? null;
  const email = profile.mail ?? profile.userPrincipalName ?? ownerAddress ?? null;
  return {
    label: email ?? profile.displayName ?? "Outlook account",
    email: email ? String(email).toLowerCase() : null,
    calendars: items.map((c: any) => ({ id: String(c.id), name: c.name ?? "Calendar", primary: c.isDefaultCalendar === true, writable: c.canEdit !== false })),
  };
}



function normalizeGoogle(e: any, calendarId: string) {
  const start = e.start?.dateTime ?? (e.start?.date ? `${e.start.date}T00:00:00Z` : null);
  const end = e.end?.dateTime ?? (e.end?.date ? `${e.end.date}T23:59:59Z` : null);
  if (!start || !end) return null;
  return { external_id: String(e.id), external_calendar_id: calendarId, title: e.summary || "(no title)", description: e.description ?? null, location: e.location ?? null, start_at: new Date(start).toISOString(), end_at: new Date(end).toISOString(), all_day: Boolean(e.start?.date), attendees: Array.isArray(e.attendees) ? e.attendees.map((a: any) => ({ email: a.email, name: a.displayName, status: a.responseStatus })) : [], is_cancelled: e.status === "cancelled", external_updated_at: e.updated ? new Date(e.updated).toISOString() : null };
}

function normalizeOutlook(e: any, calendarId: string) {
  if (!e.start?.dateTime || !e.end?.dateTime) return null;
  const iso = (v: string) => new Date(/[zZ]|[+-]\d\d:\d\d$/.test(v) ? v : `${v}Z`).toISOString();
  return { external_id: String(e.id), external_calendar_id: calendarId, title: e.subject || "(no title)", description: e.bodyPreview ?? null, location: e.location?.displayName ?? null, start_at: iso(e.start.dateTime), end_at: iso(e.end.dateTime), all_day: Boolean(e.isAllDay), attendees: Array.isArray(e.attendees) ? e.attendees.map((a: any) => ({ email: a.emailAddress?.address, name: a.emailAddress?.name, status: a.status?.response })) : [], is_cancelled: e.isCancelled === true, external_updated_at: e.lastModifiedDateTime ? new Date(e.lastModifiedDateTime).toISOString() : null };
}

async function pull(account: Account, calendarId: string, from: string, to: string) {
  if (account.provider === "google_calendar") {
    const q = new URLSearchParams({ timeMin: from, timeMax: to, singleEvents: "true", orderBy: "startTime", maxResults: "250" });
    const res = await gateway(account, `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${q}`);
    return (res.items ?? []).map((e: any) => normalizeGoogle(e, calendarId)).filter(Boolean);
  }
  const q = new URLSearchParams({ startDateTime: from, endDateTime: to, $top: "250", $orderby: "start/dateTime", $select: "id,subject,bodyPreview,location,start,end,isAllDay,isCancelled,attendees,lastModifiedDateTime" });
  const res = await gateway(account, `/me/calendars/${encodeURIComponent(calendarId)}/calendarView?${q}`);
  return (res.value ?? []).map((e: any) => normalizeOutlook(e, calendarId)).filter(Boolean);
}

async function push(account: Account, calendarId: string, ev: any, externalId: string | null) {
  const meta = ev.metadata ?? {};
  const emails = [...(Array.isArray(ev.attendees) ? ev.attendees.map((a: any) => a?.email) : []), meta.attendee_email].filter(Boolean);
  if (account.provider === "google_calendar") {
    const body = { summary: ev.title, description: ev.description ?? meta.agenda ?? undefined, location: ev.location ?? undefined, start: { dateTime: new Date(ev.start_at).toISOString() }, end: { dateTime: new Date(ev.end_at).toISOString() }, attendees: emails.map((email: string) => ({ email })), extendedProperties: { private: { jbj_event_id: ev.id } } };
    const base = `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    const res = await gateway(account, externalId ? `${base}/${encodeURIComponent(externalId)}` : base, { method: externalId ? "PATCH" : "POST", body });
    return String(res.id);
  }
  const body = { subject: ev.title, body: { contentType: "Text", content: ev.description ?? meta.agenda ?? "" }, location: ev.location ? { displayName: ev.location } : undefined, start: { dateTime: new Date(ev.start_at).toISOString().slice(0, 19), timeZone: "UTC" }, end: { dateTime: new Date(ev.end_at).toISOString().slice(0, 19), timeZone: "UTC" }, attendees: emails.map((email: string) => ({ emailAddress: { address: email }, type: "required" })) };
  const base = `/me/calendars/${encodeURIComponent(calendarId)}/events`;
  const res = await gateway(account, externalId ? `/me/events/${encodeURIComponent(externalId)}` : base, { method: externalId ? "PATCH" : "POST", body });
  return String(res.id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;
  const ownerId = auth.userId;
  const db = admin();
  const payload = await req.json().catch(() => ({}));
  const action = typeof payload.action === "string" ? payload.action : "status";
  try {
    const linked = accounts();
    if (action === "status") {
      const { data: states } = await db.from("owner_calendar_sync_state").select("*").eq("owner_id", ownerId);
      const result = [];
      const slotOf = (accountKey: string) => `Connection ${Number(accountKey.replace("account_", "")) + 1}`;
      for (const account of linked) {
        const base = { provider: account.provider, account_key: account.accountKey, slot: slotOf(account.accountKey) };
        try {
          const info = await discover(account);
          result.push({ ...base, connected: true, account: info.label, email: info.email, calendars: info.calendars.map((calendar: any) => ({ ...calendar, state: (states ?? []).find((s: any) => s.provider === account.provider && s.account_key === account.accountKey && s.calendar_id === calendar.id) ?? null })) });
        } catch (e) {
          result.push({ ...base, connected: false, account: null, email: null, calendars: [], error: String((e as Error).message).slice(0, 300) });
        }
      }
      const { data: mailboxes } = await db.from("inbox_accounts").select("email_address, provider, status, last_synced_at, last_sync_status").order("email_address");
      return json({ ok: true, accounts: result, mailboxes: mailboxes ?? [] });
    }

    if (action === "toggle") {
      const provider = payload.provider as Provider;
      const accountKey = String(payload.account_key ?? "");
      const calendarId = String(payload.calendar_id ?? "");
      if (!PROVIDERS.includes(provider) || !accountKey || !calendarId || !linked.some((a) => a.provider === provider && a.accountKey === accountKey)) return json({ error: "invalid calendar target" }, 400);
      const patch: Record<string, unknown> = { owner_id: ownerId, provider, account_key: accountKey, calendar_id: calendarId, account_label: payload.account_label ?? null };
      for (const key of ["is_enabled", "push_enabled", "pull_enabled"]) if (typeof payload[key] === "boolean") patch[key] = payload[key];
      const { error } = await db.from("owner_calendar_sync_state").upsert(patch, { onConflict: "owner_id,provider,account_key,calendar_id" });
      if (error) throw error;
      return json({ ok: true });
    }
    if (action === "sync") {
      const { data: states } = await db.from("owner_calendar_sync_state").select("*").eq("owner_id", ownerId).eq("is_enabled", true);
      const from = new Date(Date.now() - 14 * 86400000).toISOString();
      const to = new Date(Date.now() + 365 * 86400000).toISOString();
      const results = [];
      for (const state of states ?? []) {
        if (payload.provider && state.provider !== payload.provider) continue;
        if (payload.account_key && state.account_key !== payload.account_key) continue;
        if (payload.calendar_id && state.calendar_id !== payload.calendar_id) continue;
        const account = linked.find((a) => a.provider === state.provider && a.accountKey === state.account_key);
        if (!account) { results.push({ provider: state.provider, account_key: state.account_key, calendar_id: state.calendar_id, error: "Connection is no longer linked" }); continue; }
        let pulled = 0, pushed = 0, lastError: string | null = null;
        try {
          if (state.pull_enabled) {
            for (const event of await pull(account, state.calendar_id, from, to)) {
              const { error } = await db.from("owner_calendar_events").upsert({ owner_id: ownerId, provider: state.provider, external_account_key: state.account_key, ...event, last_synced_at: new Date().toISOString(), sync_direction: "pulled" }, { onConflict: "owner_id,provider,external_account_key,external_id" });
              if (error) throw error;
              pulled++;
            }
          }
          if (state.push_enabled) {
            const { data: locals, error } = await db.from("owner_calendar_events").select("id,title,description,location,start_at,end_at,metadata,attendees,updated_at").eq("provider", "jbj").or("is_cancelled.is.null,is_cancelled.eq.false").gte("start_at", from).lte("start_at", to).limit(200);
            if (error) throw error;
            const target = `${state.provider}:${state.account_key}:${state.calendar_id}`;
            for (const event of locals ?? []) {
              const meta = event.metadata ?? {};
              const sync = meta.sync_targets ?? {};
              const externalId = sync[target] ?? null;
              const newId = await push(account, state.calendar_id, event, externalId);
              await db.from("owner_calendar_events").update({ metadata: { ...meta, sync_targets: { ...sync, [target]: newId } }, last_synced_at: new Date().toISOString() }).eq("id", event.id);
              pushed++;
            }
          }
        } catch (e) { lastError = String((e as Error).message).slice(0, 500); }
        await db.from("owner_calendar_sync_state").update({ last_pull_at: state.pull_enabled ? new Date().toISOString() : state.last_pull_at, last_push_at: state.push_enabled ? new Date().toISOString() : state.last_push_at, events_pulled: pulled, events_pushed: pushed, last_error: lastError }).eq("id", state.id);
        results.push({ provider: state.provider, account_key: state.account_key, calendar_id: state.calendar_id, pulled, pushed, error: lastError });
      }
      return json({ ok: true, results });
    }
    return json({ error: `unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("[owner-calendar-sync]", e);
    return json({ error: String((e as Error).message).slice(0, 800) }, 500);
  }
});