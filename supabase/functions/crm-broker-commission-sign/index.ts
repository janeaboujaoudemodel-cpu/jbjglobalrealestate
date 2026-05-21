// Broker (JWT) signs their own commission agreement. Idempotent: once signed, locked.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

interface Body {
  agreement_id: string;
  signer_name: string;
  accept: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "auth required" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: ures, error: uErr } = await userClient.auth.getUser();
    if (uErr || !ures?.user) return json({ error: "invalid token" }, 401);

    const body = (await req.json()) as Body;
    if (!body.agreement_id || !body.signer_name || !body.accept) {
      return json({ error: "agreement_id, signer_name, accept=true required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: ag, error: aErr } = await admin
      .from("crm_broker_commission_agreements")
      .select("id, broker_user_id, status, agreement_html, splits, title")
      .eq("id", body.agreement_id)
      .maybeSingle();
    if (aErr || !ag) return json({ error: "agreement not found" }, 404);
    if (ag.broker_user_id !== ures.user.id) return json({ error: "forbidden" }, 403);
    if (ag.status === "signed") return json({ ok: true, already: true });
    if (ag.status === "void") return json({ error: "agreement voided" }, 409);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = req.headers.get("user-agent") ?? null;
    const signedAt = new Date().toISOString();

    const hashInput = `${ag.id}|${ures.user.id}|${body.signer_name}|${signedAt}|${ip ?? ""}|${ua ?? ""}`;
    const hash = await sha256(hashInput);

    const { error: sErr } = await admin
      .from("crm_broker_commission_agreements")
      .update({ status: "signed", signed_at: signedAt })
      .eq("id", ag.id);
    if (sErr) return json({ error: sErr.message }, 500);

    await admin.from("crm_broker_commission_signatures").insert({
      agreement_id: ag.id,
      party: "broker",
      signer_name: body.signer_name,
      signer_email: ures.user.email ?? null,
      signer_user_id: ures.user.id,
      signed_at: signedAt,
      ip,
      user_agent: ua,
      signature_hash: hash,
    });

    await admin.from("crm_audit_logs").insert({
      actor_id: ures.user.id,
      action: "broker_commission_sign",
      entity_type: "crm_broker_commission_agreement",
      entity_id: ag.id,
      details: { signer_name: body.signer_name, ip, ua },
    });

    return json({ ok: true, signed_at: signedAt });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
