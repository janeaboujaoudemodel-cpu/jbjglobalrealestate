// CRM — Public endpoint. Exchanges the one-shot activation ticket for a
// new password on the broker's auth user, marks the broker activated,
// and clears the must_reset_password flag.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sha256Hex, clientIp } from "../_shared/brokerInviteCrypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Body {
  ticket: string;
  password: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    if (!body.ticket || !body.password) return json({ error: "ticket and password required" }, 400);
    {
      const pw = body.password;
      const symbolRe = /[!@#$%^&*()_+\-=\[\]{};':"|<>?,.\/`~]/;
      if (
        pw.length < 10 ||
        !/[A-Z]/.test(pw) ||
        !/[a-z]/.test(pw) ||
        !/\d/.test(pw) ||
        !symbolRe.test(pw)
      ) {
        return json({ error: "Password must be at least 10 characters and include uppercase, lowercase, number, and symbol characters." }, 400);
      }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const ip = clientIp(req);
    const ua = req.headers.get("user-agent") ?? null;
    const tokenHash = await sha256Hex(body.ticket);

    const { data: broker } = await admin
      .from("crm_brokers")
      .select("id, user_id, owner_id, email_lower, blocked_at, activation_verified_at")
      .eq("invitation_token_hash", tokenHash)
      .maybeSingle();

    if (!broker) return json({ error: "Invalid or revoked activation link" }, 400);
    if (broker.blocked_at) return json({ error: "Account blocked" }, 403);
    if (!broker.activation_verified_at) {
      return json({ error: "Verify the invitation code before setting a password." }, 400);
    }
    if (!broker.user_id) return json({ error: "Broker not linked to an auth user" }, 500);

    const { error: pErr } = await admin.auth.admin.updateUserById(broker.user_id, {
      password: body.password,
      email_confirm: true,
    });
    if (pErr) return json({ error: pErr.message }, 500);

    await admin
      .from("crm_brokers")
      .update({
        invitation_status: "activated",
        activated_at: new Date().toISOString(),
        must_reset_password: false,
        invitation_token_hash: null,
        invitation_token_expires_at: null,
        activation_verified_at: null,
        otp_hash: null,
        otp_expires_at: null,
      })
      .eq("id", broker.id);

    // Upsert a broker_profiles row so the portal/CRM surfaces work consistently
    try {
      await admin.from("broker_profiles").upsert(
        {
          user_id: broker.user_id,
          email: broker.email_lower,
          display_name: broker.email_lower?.split("@")[0] ?? "Broker",
          is_active: true,
          broker_type: "external",
        },
        { onConflict: "user_id" }
      );
    } catch (_) { /* profile is best-effort */ }

    // Defensive: re-link any orphan crm_brokers rows by email → user_id
    try { await admin.rpc("link_broker_entity_by_email" as any); } catch (_) { /* best-effort */ }

    await admin.from("crm_audit_logs").insert({
      actor_user_id: broker.user_id,
      action: "broker_activated",
      entity_type: "crm_broker",
      entity_id: broker.id,
      details: { ip, user_agent: ua, email: broker.email_lower },
    });

    return json({ ok: true, email: broker.email_lower });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
