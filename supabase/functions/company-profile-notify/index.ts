/**
 * company-profile-notify — alerts the owner by email when a visitor requests
 * a developer company profile. In-app alerts are created by a DB trigger.
 *
 * Public (verify_jwt = false): called right after the RLS-validated insert.
 * It only reads the request row by id and emails the internal inbox.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendViaResend } from "../_shared/resendClient.ts";
import { enforceRateLimit } from "../_shared/rate-limit-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_INBOX = "CONTACT@JBJ.AE";
const APP_URL = "https://www.jbj.ae";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // SECURITY: public intake — IP blocklist + rate limit (6 req / 10 min per IP).
  const rl = await enforceRateLimit(
    req,
    { functionName: "company-profile-notify", maxRequests: 6, windowMinutes: 10 },
    corsHeaders,
  );
  if (rl.response) return rl.response;

  try {
    const { requestId } = await req.json();
    if (!requestId || typeof requestId !== "string" || requestId.length > 64) {
      return new Response(JSON.stringify({ error: "requestId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: reqRow, error } = await admin
      .from("company_profile_requests")
      .select("id, developer_id, requester_name, requester_email, requester_phone, created_at")
      .eq("id", requestId)
      .maybeSingle();
    if (error) throw error;
    if (!reqRow) {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: dev } = await admin
      .from("developers")
      .select("name, slug")
      .eq("id", reqRow.developer_id)
      .maybeSingle();

    const link = `${APP_URL}/owner/crm/jbj/owner-profile-requests?request=${reqRow.id}`;

    // In-app bell alert for every owner / admin
    try {
      const { data: staff } = await admin
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["owner", "admin"]);
      const ids = Array.from(new Set((staff || []).map((s: any) => s.user_id))).filter(Boolean);
      if (ids.length) {
        await admin.from("notifications").insert(
          ids.map((uid: string) => ({
            user_id: uid,
            title: `Company profile requested — ${dev?.name || "developer"}`,
            body: `${reqRow.requester_name || "A visitor"}${reqRow.requester_email ? ` (${reqRow.requester_email})` : ""} requested the company profile. Open to attach the PDF and send it.`,
            notification_type: "company_profile_request",
            action_url: `/owner/crm/jbj/owner-profile-requests?request=${reqRow.id}`,
            metadata: {
              request_id: reqRow.id,
              developer_id: reqRow.developer_id,
              developer_name: dev?.name || null,
              requester_email: reqRow.requester_email,
              requester_phone: reqRow.requester_phone,
            },
          })),
        );
      }
    } catch (alertErr) {
      console.error("owner bell alert failed", alertErr);
    }


    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;background:#ffffff;padding:24px;">
  <div style="max-width:560px;margin:0 auto;border:1px solid #EFE6D6;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#064E3B,#042c1c,#000);padding:18px 22px;">
      <div style="color:#ffffff;font-size:12px;letter-spacing:.18em;text-transform:uppercase;">JBJ Global Real Estate</div>
      <div style="color:#ffffff;font-size:19px;font-weight:700;margin-top:6px;">Company profile requested</div>
    </div>
    <div style="padding:22px;">
      <p style="margin:0 0 14px;color:#1A1A1A;font-size:14px;">
        <strong>${esc(dev?.name || "A developer")}</strong> company profile was requested.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#1A1A1A;">
        <tr><td style="padding:6px 0;color:#666;">Name</td><td style="padding:6px 0;font-weight:600;">${esc(reqRow.requester_name || "—")}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;font-weight:600;">${esc(reqRow.requester_email || "—")}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Phone</td><td style="padding:6px 0;font-weight:600;">${esc(reqRow.requester_phone || "—")}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Developer</td><td style="padding:6px 0;font-weight:600;">${esc(dev?.name || reqRow.developer_id)}</td></tr>
      </table>
      <a href="${link}" style="display:inline-block;margin-top:18px;background:#064E3B;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:13px;font-weight:700;">Open request &amp; send profile</a>
    </div>
  </div>
</div>`;

    const result = await sendViaResend({
      from: "JBJ Global Real Estate <contact@jbj.ae>",
      to: [OWNER_INBOX],
      reply_to: reqRow.requester_email || undefined,
      subject: `Company profile request — ${dev?.name || "developer"}`,
      html,
    });

    if (!result.ok) console.error("owner alert email failed", result.status, result.error);

    return new Response(JSON.stringify({ ok: true, emailed: result.ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("company-profile-notify error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
