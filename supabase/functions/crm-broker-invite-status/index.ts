// Public, read-only preflight for the broker activation page.
// Given a raw invitation token, returns the invitation status WITHOUT mutating
// state, so the activation page can render branded error states instead of 404.
// PII is masked.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sha256Hex } from "../_shared/brokerInviteCrypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Body { token?: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const token = (body.token || "").trim();
    if (!token) return json({ status: "invalid" }, 200);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const tokenHash = await sha256Hex(token);

    const { data: broker } = await admin
      .from("crm_brokers")
      .select("id, email_lower, invitation_status, invitation_token_expires_at, otp_expires_at, blocked_at, activated_at")
      .eq("invitation_token_hash", tokenHash)
      .maybeSingle();

    if (!broker) return json({ status: "invalid" });
    if (broker.blocked_at) return json({ status: "blocked", email_masked: maskEmail(broker.email_lower) });
    if (broker.activated_at && broker.invitation_status === "activated") {
      return json({ status: "already_activated", email_masked: maskEmail(broker.email_lower) });
    }
    if (!broker.invitation_token_expires_at || new Date(broker.invitation_token_expires_at).getTime() < Date.now()) {
      return json({ status: "expired", email_masked: maskEmail(broker.email_lower) });
    }

    return json({
      status: "ok",
      email_masked: maskEmail(broker.email_lower),
      expires_at: broker.invitation_token_expires_at,
      otp_expires_at: broker.otp_expires_at,
    });
  } catch (e) {
    return json({ status: "invalid", error: (e as Error).message }, 200);
  }
});

function maskEmail(e?: string | null): string | null {
  if (!e) return null;
  const [u, d] = e.split("@");
  if (!d) return null;
  const head = u.length <= 2 ? u[0] + "*" : u.slice(0, 2) + "***";
  return `${head}@${d}`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
