// review-verification — owner/admin approves or rejects a verification.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendViaResend } from "../_shared/resendClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  verificationId: string;
  decision: "approved" | "rejected";
  rejectionReason?: string;
}

function jsonResponse(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: authData, error: authErr } = await userClient.auth.getUser();
  if (authErr || !authData?.user) return jsonResponse({ error: "Unauthorized" }, 401);
  const reviewer = authData.user;

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Role check
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", reviewer.id);
  const isOwnerOrAdmin = (roles ?? []).some(
    (r: any) => r.role === "owner" || r.role === "admin",
  );
  if (!isOwnerOrAdmin) return jsonResponse({ error: "Forbidden" }, 403);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  if (!body.verificationId || !["approved", "rejected"].includes(body.decision)) {
    return jsonResponse({ error: "Invalid input" }, 400);
  }
  if (body.decision === "rejected" && !body.rejectionReason?.trim()) {
    return jsonResponse({ error: "Rejection reason required" }, 400);
  }

  const { data: existing, error: fetchErr } = await admin
    .from("user_verifications")
    .select("id, user_id, reference_code, status, full_name")
    .eq("id", body.verificationId)
    .maybeSingle();
  if (fetchErr || !existing) return jsonResponse({ error: "Not found" }, 404);
  if (existing.status !== "pending") {
    return jsonResponse({ error: `Already ${existing.status}` }, 409);
  }

  const { error: updErr } = await admin
    .from("user_verifications")
    .update({
      status: body.decision,
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: body.decision === "rejected" ? body.rejectionReason!.trim() : null,
    })
    .eq("id", body.verificationId);
  if (updErr) {
    console.error("[review-verification] update error", updErr);
    return jsonResponse({ error: "Update failed" }, 500);
  }

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    null;
  await admin.from("verification_audit_log").insert({
    verification_id: existing.id,
    actor_user_id: reviewer.id,
    event: body.decision,
    payload: body.decision === "rejected" ? { reason: body.rejectionReason } : {},
    client_ip: clientIp,
    user_agent: req.headers.get("user-agent"),
  });

  // Notify user
  try {
    const { data: userInfo } = await admin.auth.admin.getUserById(existing.user_id);
    const email = userInfo?.user?.email;
    const firstName = existing.full_name?.split(" ")[0] ?? "there";
    if (email) {
      const approved = body.decision === "approved";
      await sendViaResend({
        from: "JBJ Global Real Estate <verify@jbj.ae>",
        to: email,
        subject: approved
          ? `You're verified ✓ — ${existing.reference_code}`
          : `Verification needs attention — ${existing.reference_code}`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#FDFBF7;color:#1A1A1A;">
            <h1 style="font-size:22px;margin:0 0 12px;color:#1A1A1A;">
              ${approved ? "Your account is verified" : "We could not verify your documents"}
            </h1>
            <p style="font-size:14px;line-height:1.6;color:#1A1A1A;opacity:0.85;">
              ${
                approved
                  ? `Congratulations ${firstName}, your identity has been verified. A trust badge now appears on your profile.`
                  : `Hi ${firstName}, our compliance team could not approve your submission. Reason:`
              }
            </p>
            ${
              approved
                ? ""
                : `<div style="margin:16px 0;padding:14px 16px;background:#F7F2EA;border-left:3px solid #B89555;border-radius:6px;font-size:13px;color:#1A1A1A;">${
                    body.rejectionReason
                  }</div>
                  <p style="font-size:13px;line-height:1.6;color:#1A1A1A;opacity:0.75;">You can re-submit a new verification at any time.</p>`
            }
            <div style="margin:24px 0;padding:16px 18px;background:#F7F2EA;border:1px solid #B89555;border-radius:12px;">
              <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#1A1A1A;opacity:0.6;margin-bottom:4px;">Reference</div>
              <div style="font-size:18px;font-weight:600;color:#1A1A1A;font-family:ui-monospace,Menlo,monospace;">${existing.reference_code}</div>
            </div>
            <p style="font-size:11px;line-height:1.5;color:#1A1A1A;opacity:0.55;margin-top:32px;">JBJ GLOBAL REAL ESTATE · Dubai, UAE</p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.warn("[review-verification] email failed", err);
  }

  return jsonResponse({ ok: true, status: body.decision });
});
