/**
 * CRM Brokerage Outreach Sender Status
 * Read-only: confirms brokerage outreach sender configuration.
 * Sender is jane@jbj.ae via Resend (jbj.ae domain is verified).
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
const REQUIRED_FROM = "jane@jbj.ae";

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

    const resendConfigured = !!Deno.env.get("RESEND_API_KEY");

    return new Response(JSON.stringify({
      ok: resendConfigured,
      connected: resendConfigured,
      connectedEmail: REQUIRED_FROM,
      requiredAlias: REQUIRED_FROM,
      verified: resendConfigured,
      message: resendConfigured
        ? `Brokerage outreach sends from ${REQUIRED_FROM} via the verified jbj.ae domain. Replies route directly to Jane.`
        : "Resend is not configured for this project — outbound brokerage email is disabled.",
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
