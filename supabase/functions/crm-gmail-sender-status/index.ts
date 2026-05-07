/**
 * CRM Gmail Sender Status
 * Read-only: returns whether jane@citideveloper.com is registered + verified
 * as a Send-As alias on the currently-connected Gmail account.
 * Owner-only.
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
const REQUIRED_FROM = "jane@citideveloper.com";
const GMAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

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
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_API_KEY || !GMAIL_API_KEY) {
      return new Response(JSON.stringify({
        ok: false,
        connected: false,
        requiredAlias: REQUIRED_FROM,
        message: "Gmail connector not connected.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Authenticated mailbox
    let connectedEmail = "";
    try {
      const profRes = await fetch(`${GMAIL_GATEWAY}/users/me/profile`, {
        headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GMAIL_API_KEY },
      });
      if (profRes.ok) {
        const j = await profRes.json() as { emailAddress?: string };
        connectedEmail = j.emailAddress || "";
      }
    } catch (_) {/* ignore */}

    const aliasRes = await fetch(`${GMAIL_GATEWAY}/users/me/settings/sendAs`, {
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GMAIL_API_KEY },
    });
    if (!aliasRes.ok) {
      const errJson = await aliasRes.json().catch(() => ({}));
      return new Response(JSON.stringify({
        ok: false,
        connected: !!connectedEmail,
        connectedEmail,
        requiredAlias: REQUIRED_FROM,
        message: `Could not read Gmail Send-As settings (${aliasRes.status}).`,
        details: errJson,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await aliasRes.json() as { sendAs?: Array<{ sendAsEmail: string; verificationStatus?: string; isPrimary?: boolean; displayName?: string }> };
    const aliases = Array.isArray(j.sendAs) ? j.sendAs : [];
    const match = aliases.find(a => (a.sendAsEmail || "").toLowerCase() === REQUIRED_FROM);
    const isPrimary = !!match?.isPrimary;
    const verificationStatus = match?.verificationStatus || null;
    const verified = isPrimary || (verificationStatus || "").toLowerCase() === "accepted";

    return new Response(JSON.stringify({
      ok: !!match && verified,
      connected: true,
      connectedEmail,
      requiredAlias: REQUIRED_FROM,
      present: !!match,
      verified,
      isPrimary,
      verificationStatus,
      aliases: aliases.map(a => ({ email: a.sendAsEmail, verificationStatus: a.verificationStatus, isPrimary: !!a.isPrimary })),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
