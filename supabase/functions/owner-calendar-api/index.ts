import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const db = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const json = (body: unknown, status = 200, origin?: string | null) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, ...(origin ? { "Access-Control-Allow-Origin": origin } : {}), "Content-Type": "application/json" } });
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))).map((b) => b.toString(16).padStart(2, "0")).join("");
const randomKey = () => `jbjcal_${Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("")}`;

async function authenticateKey(req: Request) {
  const raw = req.headers.get("x-api-key")?.trim();
  if (!raw?.startsWith("jbjcal_")) return null;
  const client = db();
  const { data } = await client.from("owner_calendar_api_clients").select("id,owner_id,permissions,allowed_origins").eq("key_hash", await hash(raw)).eq("is_active", true).maybeSingle();
  if (!data) return null;
  const origin = req.headers.get("origin");
  if (origin && data.allowed_origins?.length && !data.allowed_origins.includes(origin)) return null;
  await client.from("owner_calendar_api_clients").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return data as { id: string; owner_id: string; permissions: string[]; allowed_origins: string[] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const external = url.searchParams.get("mode") === "events" || req.headers.has("x-api-key");
  try {
    if (external) {
      const credential = await authenticateKey(req);
      if (!credential) return json({ error: "invalid or disallowed calendar API key" }, 401, req.headers.get("origin"));
      const origin = req.headers.get("origin");
      if (req.method === "GET") {
        if (!credential.permissions.includes("events:read")) return json({ error: "read permission not granted" }, 403, origin);
        const from = url.searchParams.get("from") ?? new Date(Date.now() - 86400000).toISOString();
        const to = url.searchParams.get("to") ?? new Date(Date.now() + 90 * 86400000).toISOString();
        if (!Number.isFinite(Date.parse(from)) || !Number.isFinite(Date.parse(to))) return json({ error: "from and to must be valid ISO dates" }, 400, origin);
        const { data, error } = await db().from("owner_calendar_events").select("id,title,description,location,start_at,end_at,all_day,attendees,metadata,updated_at").eq("owner_id", credential.owner_id).or("is_cancelled.is.null,is_cancelled.eq.false").gte("start_at", from).lte("start_at", to).order("start_at").limit(500);
        if (error) throw error;
        return json({ events: data ?? [] }, 200, origin);
      }
      if (req.method === "POST") {
        if (!credential.permissions.includes("events:write")) return json({ error: "write permission not granted" }, 403, origin);
        const body = await req.json().catch(() => null) as Record<string, unknown> | null;
        const title = typeof body?.title === "string" ? body.title.trim().slice(0, 200) : "";
        const startAt = typeof body?.start_at === "string" ? body.start_at : "";
        const endAt = typeof body?.end_at === "string" ? body.end_at : "";
        if (!title || !Number.isFinite(Date.parse(startAt)) || !Number.isFinite(Date.parse(endAt)) || Date.parse(endAt) <= Date.parse(startAt)) return json({ error: "title, start_at and end_at are required; end must be after start" }, 400, origin);
        const attendees = Array.isArray(body?.attendees) ? body.attendees.slice(0, 50).map((a) => ({ email: typeof a?.email === "string" ? a.email.slice(0, 254) : undefined, name: typeof a?.name === "string" ? a.name.slice(0, 120) : undefined })).filter((a) => a.email || a.name) : [];
        const { data, error } = await db().from("owner_calendar_events").insert({ owner_id: credential.owner_id, provider: "jbj", title, description: typeof body?.description === "string" ? body.description.slice(0, 5000) : null, location: typeof body?.location === "string" ? body.location.slice(0, 500) : null, start_at: new Date(startAt).toISOString(), end_at: new Date(endAt).toISOString(), all_day: body?.all_day === true, attendees, metadata: { source: "website_api", api_client_id: credential.id } }).select("id,title,start_at,end_at").single();
        if (error) throw error;
        return json({ event: data }, 201, origin);
      }
      return json({ error: "method not allowed" }, 405, origin);
    }

    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "list";
    if (action === "list") {
      const { data, error } = await db().from("owner_calendar_api_clients").select("id,name,key_prefix,permissions,allowed_origins,is_active,last_used_at,created_at,revoked_at").eq("owner_id", auth.userId).order("created_at", { ascending: false });
      if (error) throw error;
      return json({ clients: data ?? [], endpoint: `${url.origin}${url.pathname}?mode=events` });
    }
    if (action === "create") {
      const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
      const origins = Array.isArray(body.allowed_origins) ? [...new Set(body.allowed_origins.map(String).map((v) => v.trim()).filter((v) => /^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(v)))].slice(0, 20) : [];
      const permissions = Array.isArray(body.permissions) ? body.permissions.filter((v) => v === "events:read" || v === "events:write") : [];
      if (!name || permissions.length === 0) return json({ error: "name and at least one permission are required" }, 400);
      const apiKey = randomKey();
      const { data, error } = await db().from("owner_calendar_api_clients").insert({ owner_id: auth.userId, name, key_prefix: apiKey.slice(0, 16), key_hash: await hash(apiKey), allowed_origins: origins, permissions }).select("id,name,key_prefix,permissions,allowed_origins,is_active,created_at").single();
      if (error) throw error;
      return json({ client: data, api_key: apiKey, endpoint: `${url.origin}${url.pathname}?mode=events` }, 201);
    }
    if (action === "revoke") {
      const id = typeof body.id === "string" ? body.id : "";
      const { error } = await db().from("owner_calendar_api_clients").update({ is_active: false, revoked_at: new Date().toISOString() }).eq("id", id).eq("owner_id", auth.userId);
      if (error) throw error;
      return json({ ok: true });
    }
    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("[owner-calendar-api]", e);
    return json({ error: String((e as Error).message).slice(0, 500) }, 500, req.headers.get("origin"));
  }
});