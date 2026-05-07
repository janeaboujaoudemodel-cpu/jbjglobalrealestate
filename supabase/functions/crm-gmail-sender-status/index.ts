/**
 * CRM Gmail Sender Status
 * Read-only: returns whether the connected Gmail mailbox is the required
 * outbound sender (infoo.jane@gmail.com). No Send-As alias is needed since
 * we send directly from the connected mailbox.
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
const REQUIRED_FROM = "infoo.jane@gmail.com";
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

    // Fetch authenticated mailbox
    const profRes = await fetch(`${GMAIL_GATEWAY}/users/me/profile`, {
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GMAIL_API_KEY },
    });
    if (!profRes.ok) {
      const errJson = await profRes.json().catch(() => ({}));
      return new Response(JSON.stringify({
        ok: false,
        connected: false,
        requiredAlias: REQUIRED_FROM,
        message: `Could not read Gmail profile (${profRes.status}).`,
        details: errJson,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await profRes.json() as { emailAddress?: string };
    const connectedEmail = (j.emailAddress || "").toLowerCase();
    const matches = connectedEmail === REQUIRED_FROM.toLowerCase();

    return new Response(JSON.stringify({
      ok: matches,
      connected: true,
      connectedEmail,
      requiredAlias: REQUIRED_FROM,
      verified: matches,
      message: matches
        ? `Sending directly from ${REQUIRED_FROM}.`
        : `Connected mailbox is ${connectedEmail}, but outreach requires ${REQUIRED_FROM}. Reconnect Gmail using the correct account.`,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
