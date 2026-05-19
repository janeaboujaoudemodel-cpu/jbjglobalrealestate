// TEMPORARY QA-ONLY ENDPOINT (owner-gated).
// Issues a real invitation token + OTP for a QA broker email, stores the
// hashes exactly like crm-broker-invite would, and returns plaintext token+otp
// so the live frontend QA can drive activation without depending on email
// delivery. Will be removed once the QA matrix is complete.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";
import { sha256Hex, randomToken, randomOtp } from "../_shared/brokerInviteCrypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TOKEN_TTL_MIN = 60 * 24 * 3;
const OTP_TTL_MIN = 15;

interface Body {
  broker_email: string;
  broker_display_name?: string;
  // optional overrides used by error-state tests
  expire_token?: boolean;
  expire_otp?: boolean;
  set_otp_attempts?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;

    const body = (await req.json()) as Body;
    const email = (body.broker_email || "").trim().toLowerCase();
    if (!email.includes("@")) return j({ error: "broker_email required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Ensure auth user
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const match = list?.users?.find((u: any) => (u.email ?? "").toLowerCase() === email);
    let userId: string;
    if (match) userId = match.id;
    else {
      const tmp = crypto.randomUUID().replace(/-/g, "") + "Aa!1";
      const { data: cr, error: cErr } = await admin.auth.admin.createUser({
        email, password: tmp, email_confirm: true,
        user_metadata: { invited_as_broker: true, qa: true },
      });
      if (cErr || !cr?.user) return j({ error: cErr?.message ?? "create user failed" }, 500);
      userId = cr.user.id;
    }

    // Ensure crm_brokers row
    let { data: row } = await admin.from("crm_brokers").select("id")
      .or(`user_id.eq.${userId},email_lower.eq.${email}`).maybeSingle();
    let brokerId: string;
    if (row) brokerId = row.id;
    else {
      const { data: ins, error: iErr } = await admin.from("crm_brokers").insert({
        user_id: userId, owner_id: auth.userId, email_lower: email,
        full_name: body.broker_display_name ?? email.split("@")[0],
      }).select("id").single();
      if (iErr || !ins) return j({ error: iErr?.message ?? "insert broker failed" }, 500);
      brokerId = ins.id;
    }

    const token = randomToken(32);
    const otp = randomOtp();
    const tokenHash = await sha256Hex(token);
    const otpHash = await sha256Hex(otp);
    const tokenExp = new Date(Date.now() + (body.expire_token ? -60_000 : TOKEN_TTL_MIN * 60_000)).toISOString();
    const otpExp = new Date(Date.now() + (body.expire_otp ? -60_000 : OTP_TTL_MIN * 60_000)).toISOString();

    await admin.from("crm_brokers").update({
      invitation_status: "otp_sent",
      invitation_token_hash: tokenHash,
      invitation_token_expires_at: tokenExp,
      invitation_sent_at: new Date().toISOString(),
      invited_by_user_id: auth.userId,
      otp_hash: otpHash,
      otp_expires_at: otpExp,
      otp_attempts: body.set_otp_attempts ?? 0,
      otp_last_sent_at: new Date().toISOString(),
      must_reset_password: true,
      blocked_at: null,
      blocked_reason: null,
      activated_at: null,
    }).eq("id", brokerId);

    return j({ ok: true, broker_id: brokerId, user_id: userId, token, otp, token_exp: tokenExp, otp_exp: otpExp });
  } catch (e) {
    return j({ error: (e as Error).message }, 500);
  }
});

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
