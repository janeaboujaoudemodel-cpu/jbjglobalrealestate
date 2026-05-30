// Starts OAuth flow for Gmail/Outlook using the broker's OWN OAuth app credentials
// (stored per-user in broker_email_oauth_apps).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CALLBACK = `${SUPABASE_URL}/functions/v1/broker-email-oauth-callback`;

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ");

const MS_SCOPES = [
  "offline_access",
  "https://graph.microsoft.com/Mail.ReadWrite",
  "https://graph.microsoft.com/Mail.Send",
  "https://graph.microsoft.com/User.Read",
].join(" ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: claims, error: cErr } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (cErr || !claims?.claims?.sub) return j({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const { provider } = await req.json().catch(() => ({}));
    if (provider !== "gmail" && provider !== "outlook") return j({ error: "provider must be gmail|outlook" }, 400);

    const svc = createClient(SUPABASE_URL, SERVICE);
    const { data: app } = await svc.rpc("get_broker_oauth_app", { _user_id: userId, _provider: provider });
    const clientId = app?.[0]?.client_id;
    if (!clientId) {
      return j({
        error: `No ${provider === "gmail" ? "Google" : "Microsoft"} OAuth app configured. Add your Client ID & Secret in Email Setup first.`,
        code: "no_oauth_app",
      }, 412);
    }

    const state = crypto.randomUUID() + "." + crypto.randomUUID();
    const { error: insErr } = await svc.from("broker_email_oauth_states").insert({ state, user_id: userId, provider });
    if (insErr) return j({ error: insErr.message }, 500);

    let url: string;
    if (provider === "gmail") {
      const p = new URLSearchParams({
        client_id: clientId,
        redirect_uri: CALLBACK,
        response_type: "code",
        scope: GOOGLE_SCOPES,
        access_type: "offline",
        prompt: "consent",
        include_granted_scopes: "true",
        state,
      });
      url = `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
    } else {
      const p = new URLSearchParams({
        client_id: clientId,
        redirect_uri: CALLBACK,
        response_type: "code",
        scope: MS_SCOPES,
        response_mode: "query",
        prompt: "consent",
        state,
      });
      url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${p}`;
    }
    return j({ url, state });
  } catch (e) {
    return j({ error: (e as Error).message }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
