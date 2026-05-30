// Sends an email from the broker's connected Gmail or Outlook account.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);
    const u = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: claims } = await u.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return j({ error: "Unauthorized" }, 401);

    const { accountId, to, subject, body, cc, bcc } = await req.json();
    if (!accountId || !to || !subject || !body) return j({ error: "accountId, to, subject, body required" }, 400);

    const svc = createClient(SUPABASE_URL, SERVICE);
    const { data: acc } = await svc.from("broker_email_accounts").select("*")
      .eq("id", accountId).eq("user_id", claims.claims.sub).maybeSingle();
    if (!acc) return j({ error: "Account not found" }, 404);

    const token = await refreshIfNeeded(svc, acc);
    if (acc.provider === "gmail") {
      const raw = buildRaw({ from: acc.email_address, to, cc, bcc, subject, body });
      const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      if (!r.ok) return j({ error: `Gmail send ${r.status}: ${await r.text()}` }, 502);
      return j({ ok: true, id: (await r.json()).id });
    } else {
      const msg = {
        message: {
          subject,
          body: { contentType: "HTML", content: body },
          toRecipients: arr(to).map((a) => ({ emailAddress: { address: a } })),
          ccRecipients: arr(cc).map((a) => ({ emailAddress: { address: a } })),
          bccRecipients: arr(bcc).map((a) => ({ emailAddress: { address: a } })),
        },
      };
      const r = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(msg),
      });
      if (!r.ok) return j({ error: `Outlook send ${r.status}: ${await r.text()}` }, 502);
      return j({ ok: true });
    }
  } catch (e) {
    return j({ error: (e as Error).message }, 500);
  }
});

function arr(v: any): string[] { return !v ? [] : Array.isArray(v) ? v : [v]; }

function buildRaw(o: { from: string; to: any; cc?: any; bcc?: any; subject: string; body: string }) {
  const lines = [
    `From: ${o.from}`,
    `To: ${arr(o.to).join(", ")}`,
    o.cc ? `Cc: ${arr(o.cc).join(", ")}` : "",
    o.bcc ? `Bcc: ${arr(o.bcc).join(", ")}` : "",
    `Subject: ${o.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    o.body,
  ].filter(Boolean).join("\r\n");
  return btoa(unescape(encodeURIComponent(lines))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function refreshIfNeeded(svc: any, acc: any): Promise<string> {
  const exp = acc.token_expires_at ? new Date(acc.token_expires_at).getTime() : 0;
  if (exp - 60_000 > Date.now()) return acc.access_token_encrypted;
  if (!acc.refresh_token_encrypted) throw new Error("No refresh token");
  const isG = acc.provider === "gmail";
  const { data: appRows } = await svc.rpc("get_broker_oauth_app", { _user_id: acc.user_id, _provider: acc.provider });
  const app = appRows?.[0];
  if (!app?.client_id || !app?.client_secret) throw new Error("OAuth app credentials missing for this broker; re-add in Email Setup");
  const r = await fetch(isG ? "https://oauth2.googleapis.com/token" : "https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: acc.refresh_token_encrypted, grant_type: "refresh_token",
      client_id: app.client_id,
      client_secret: app.client_secret,
    }),
  });
  if (!r.ok) throw new Error(`Refresh ${r.status}`);
  const t = await r.json();
  await svc.from("broker_email_accounts").update({
    access_token_encrypted: t.access_token,
    token_expires_at: new Date(Date.now() + (t.expires_in ?? 3600) * 1000).toISOString(),
  }).eq("id", acc.id);
  return t.access_token;
}

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
