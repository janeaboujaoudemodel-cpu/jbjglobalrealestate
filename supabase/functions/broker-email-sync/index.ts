// Pulls the latest messages from a broker's Gmail/Outlook account and upserts them into broker_emails.
// Modes:
//   - { accountId } → sync just that account (user-triggered, requires JWT)
//   - { cron: true } → sync every active account (called by pg_cron with service role)
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const svc = createClient(SUPABASE_URL, SERVICE);

    let accounts: any[] = [];
    if (body.cron) {
      const { data } = await svc.from("broker_email_accounts")
        .select("*").eq("status", "active").eq("sync_enabled", true)
        .order("last_synced_at", { ascending: true, nullsFirst: true }).limit(25);
      accounts = data ?? [];
    } else {
      const auth = req.headers.get("Authorization");
      if (!auth?.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);
      const u = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
      const { data: claims } = await u.auth.getClaims(auth.replace("Bearer ", ""));
      if (!claims?.claims?.sub) return j({ error: "Unauthorized" }, 401);
      let query = svc.from("broker_email_accounts").select("*")
        .eq("user_id", claims.claims.sub).eq("status", "active").eq("sync_enabled", true);
      if (body.accountId) query = query.eq("id", body.accountId);
      const { data } = await query.order("last_synced_at", { ascending: true, nullsFirst: true }).limit(body.accountId ? 1 : 10);
      if (body.accountId && !(data ?? []).length) return j({ error: "Account not found" }, 404);
      accounts = data ?? [];
    }

    const out: any[] = [];
    for (const acc of accounts) {
      try {
        const token = await ensureAccessToken(svc, acc);
        const inserted = acc.provider === "gmail"
          ? await syncGmail(svc, acc, token)
          : await syncOutlook(svc, acc, token);
        await svc.from("broker_email_accounts").update({
          last_synced_at: new Date().toISOString(), last_error: null,
        }).eq("id", acc.id);
        out.push({ accountId: acc.id, email: acc.email_address, inserted });
      } catch (e) {
        await svc.from("broker_email_accounts").update({
          last_error: (e as Error).message, status: "error",
        }).eq("id", acc.id);
        out.push({ accountId: acc.id, email: acc.email_address, error: (e as Error).message });
      }
    }
    return j({ results: out });
  } catch (e) {
    return j({ error: (e as Error).message }, 500);
  }
});

async function ensureAccessToken(svc: any, acc: any): Promise<string> {
  const exp = acc.token_expires_at ? new Date(acc.token_expires_at).getTime() : 0;
  if (exp - 60_000 > Date.now()) return acc.access_token_encrypted;
  if (!acc.refresh_token_encrypted) throw new Error("No refresh token; reconnect required");
  const isG = acc.provider === "gmail";
  const { data: appRows } = await svc.rpc("get_broker_oauth_app", { _user_id: acc.user_id, _provider: acc.provider });
  const app = appRows?.[0];
  if (!app?.client_id || !app?.client_secret) throw new Error("OAuth app credentials missing for this broker; re-add in Email Setup");
  const endpoint = isG ? "https://oauth2.googleapis.com/token" : "https://login.microsoftonline.com/common/oauth2/v2.0/token";
  const body = new URLSearchParams({
    refresh_token: acc.refresh_token_encrypted,
    grant_type: "refresh_token",
    client_id: app.client_id,
    client_secret: app.client_secret,
  });
  const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!r.ok) throw new Error(`Refresh failed: ${r.status} ${await r.text()}`);
  const t = await r.json();
  await svc.from("broker_email_accounts").update({
    access_token_encrypted: t.access_token,
    token_expires_at: new Date(Date.now() + (t.expires_in ?? 3600) * 1000).toISOString(),
  }).eq("id", acc.id);
  return t.access_token;
}

async function syncGmail(svc: any, acc: any, token: string): Promise<number> {
  const list = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q=in:inbox", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!list.ok) throw new Error(`Gmail list ${list.status}: ${await list.text()}`);
  const { messages = [] } = await list.json() as { messages?: { id: string }[] };
  let inserted = 0;
  for (const m of messages) {
    const { data: existing } = await svc.from("broker_emails").select("id")
      .eq("account_id", acc.id).eq("external_id", m.id).maybeSingle();
    if (existing) continue;
    const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) continue;
    const d = await r.json();
    const headers: Record<string, string> = {};
    for (const h of d.payload?.headers ?? []) headers[h.name.toLowerCase()] = h.value;
    const from = parseAddr(headers["from"]);
    await svc.from("broker_emails").insert({
      account_id: acc.id, user_id: acc.user_id, external_id: m.id,
      thread_id: d.threadId, subject: headers["subject"] ?? "(no subject)",
      from_address: from.email, from_name: from.name, snippet: d.snippet ?? null,
      received_at: headers["date"] ? new Date(headers["date"]).toISOString() : new Date(parseInt(d.internalDate)).toISOString(),
      is_read: !(d.labelIds ?? []).includes("UNREAD"),
    });
    inserted++;
  }
  return inserted;
}

async function syncOutlook(svc: any, acc: any, token: string): Promise<number> {
  const r = await fetch("https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=25&$select=id,conversationId,subject,from,bodyPreview,receivedDateTime,isRead&$orderby=receivedDateTime%20desc", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Outlook list ${r.status}: ${await r.text()}`);
  const { value = [] } = await r.json() as { value?: any[] };
  let inserted = 0;
  for (const m of value) {
    const { data: existing } = await svc.from("broker_emails").select("id")
      .eq("account_id", acc.id).eq("external_id", m.id).maybeSingle();
    if (existing) continue;
    await svc.from("broker_emails").insert({
      account_id: acc.id, user_id: acc.user_id, external_id: m.id,
      thread_id: m.conversationId, subject: m.subject ?? "(no subject)",
      from_address: m.from?.emailAddress?.address ?? null,
      from_name: m.from?.emailAddress?.name ?? null,
      snippet: m.bodyPreview ?? null,
      received_at: m.receivedDateTime, is_read: !!m.isRead,
    });
    inserted++;
  }
  return inserted;
}

function parseAddr(s?: string): { email: string | null; name: string | null } {
  if (!s) return { email: null, name: null };
  const m = s.match(/^\s*"?([^"<]+?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { email: s.trim(), name: null };
}

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
