// Receives the OAuth redirect, exchanges code → tokens using the broker's OWN OAuth app credentials,
// upserts broker_email_accounts, posts back to opener.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CALLBACK = `${SUPABASE_URL}/functions/v1/broker-email-oauth-callback`;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  if (err) return html(`<p>OAuth error: ${escape(err)}</p>`, false, err);
  if (!code || !state) return html("Missing code/state", false, "missing_code");

  const svc = createClient(SUPABASE_URL, SERVICE);
  const { data: st } = await svc.from("broker_email_oauth_states").select("*").eq("state", state).maybeSingle();
  if (!st) return html("Invalid or expired state", false, "bad_state");
  await svc.from("broker_email_oauth_states").delete().eq("state", state);
  if (new Date(st.expires_at).getTime() < Date.now()) return html("State expired", false, "expired");

  try {
    const provider = st.provider as "gmail" | "outlook";
    const { data: appRows } = await svc.rpc("get_broker_oauth_app", { _user_id: st.user_id, _provider: provider });
    const app = appRows?.[0];
    if (!app?.client_id || !app?.client_secret) {
      return html("OAuth app credentials missing. Re-add them in Email Setup.", false, "no_oauth_app");
    }

    const tokens = await exchangeCode(provider, code, app.client_id, app.client_secret);
    const profile = await fetchProfile(provider, tokens.access_token);

    const row = {
      user_id: st.user_id,
      provider,
      email_address: profile.email,
      display_name: profile.name ?? null,
      provider_account_id: profile.id ?? null,
      access_token_encrypted: tokens.access_token,
      refresh_token_encrypted: tokens.refresh_token ?? null,
      token_expires_at: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
      scope: tokens.scope ?? null,
      status: "active",
      last_error: null,
      updated_at: new Date().toISOString(),
    };
    const { error: upErr } = await svc.from("broker_email_accounts")
      .upsert(row, { onConflict: "user_id,email_address" });
    if (upErr) return html(`DB error: ${upErr.message}`, false, "db_error");
    return html(`<h2>Connected ${escape(profile.email)}</h2><p>You can close this window.</p>`, true, null, profile.email);
  } catch (e) {
    return html(`Token exchange failed: ${escape((e as Error).message)}`, false, "exchange_failed");
  }
});

async function exchangeCode(p: "gmail" | "outlook", code: string, clientId: string, clientSecret: string) {
  const isG = p === "gmail";
  const endpoint = isG
    ? "https://oauth2.googleapis.com/token"
    : "https://login.microsoftonline.com/common/oauth2/v2.0/token";
  const body = new URLSearchParams({
    code,
    redirect_uri: CALLBACK,
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return await r.json() as { access_token: string; refresh_token?: string; expires_in?: number; scope?: string };
}

async function fetchProfile(p: "gmail" | "outlook", token: string): Promise<{ email: string; name?: string; id?: string }> {
  if (p === "gmail") {
    const r = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    return { email: d.email, name: d.name, id: d.id };
  } else {
    const r = await fetch("https://graph.microsoft.com/v1.0/me", { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    return { email: d.mail || d.userPrincipalName, name: d.displayName, id: d.id };
  }
}

function escape(s: string) { return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)); }

function html(body: string, ok: boolean, code: string | null, email?: string) {
  const payload = JSON.stringify({ source: "jbj-broker-oauth", ok, code, email });
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>JBJ Email Connect</title>
<style>body{font-family:Inter,system-ui,sans-serif;background:#FDFBF7;color:#1A1A1A;display:grid;place-items:center;height:100vh;margin:0}.box{max-width:420px;text-align:center;padding:32px;background:#F7F2EA;border:1px solid rgba(184,149,85,.35);border-radius:16px}</style>
</head><body><div class="box">${body}</div>
<script>try{window.opener&&window.opener.postMessage(${payload},"*");}catch(e){}setTimeout(()=>window.close(),1500);</script>
</body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
