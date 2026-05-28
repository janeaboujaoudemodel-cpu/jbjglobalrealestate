// Owner-only: approve an applicant and email them an in-app intake link.
// Mints a single-use intake_token, sets status='approved_pending_docs',
// sends a branded email pointing at /careers/intake/:token.
import { createClient } from "npm:@supabase/supabase-js@2";
import { quotaGuardedFetch } from "../_shared/quotaGuardedFetch.ts";
import { SITE_URL, emailShell, monogramBadge } from "../_shared/email-html.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const VERIFIED_SENDER = "jbj@jbj.ae";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = auth.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const { data: isOwner } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "owner",
    });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    const { data: isHr } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "hr_admin",
    });
    if (!isOwner && !isAdmin && !isHr) {
      return json({ error: "Forbidden" }, 403);
    }

    const { candidate_id, department } = await req.json();
    if (!candidate_id) return json({ error: "candidate_id is required" }, 400);

    const { data: candidate, error: cErr } = await supabase
      .from("hr_candidates")
      .select("*")
      .eq("id", candidate_id)
      .maybeSingle();
    if (cErr || !candidate) return json({ error: "Candidate not found" }, 404);

    // Mint single-use token (idempotent if not yet submitted)
    const intakeToken =
      candidate.intake_token && !candidate.intake_submitted_at
        ? candidate.intake_token
        : crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

    const patch: Record<string, unknown> = {
      status: "approved_pending_docs",
      intake_token: intakeToken,
      intake_token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    };
    if (department) patch.department_category = department;

    const { error: upErr } = await supabase
      .from("hr_candidates")
      .update(patch)
      .eq("id", candidate_id);
    if (upErr) return json({ error: upErr.message }, 500);

    // Send email (best-effort — workflow does not depend on delivery)
    const intakeUrl = `${SITE_URL || "https://jbj.ae"}/careers/intake/${intakeToken}`;
    const name = esc(candidate.candidate_name || "Applicant");
    const position = esc(candidate.position_applied || "the position");

    const html = emailShell({
      title: "Congratulations — Your application has been approved",
      preheader: "Submit your documents to proceed with your job offer.",
      bodyHtml: `
        ${monogramBadge()}
        <h1 style="margin:24px 0 8px;font-family:Inter,sans-serif;color:#1A1A1A;font-size:22px;">Congratulations, ${name}!</h1>
        <p style="font-family:Inter,sans-serif;color:#1A1A1A;font-size:14px;line-height:1.6;">
          Your application for <strong>${position}</strong> at JBJ GLOBAL REAL ESTATE has been approved.
          To proceed with your formal job offer, please submit the following documents through your secure applicant portal:
        </p>
        <ul style="font-family:Inter,sans-serif;color:#1A1A1A;font-size:13px;line-height:1.7;">
          <li>Professional photo</li>
          <li>Emirates ID (front + back) and ID number</li>
          <li>Passport(s) — including any second nationality</li>
          <li>RERA card (if applicable)</li>
          <li>Languages spoken & nationality</li>
          <li>Current or last company + total years of real-estate experience</li>
        </ul>
        <p style="margin:24px 0 8px;">
          <a href="${intakeUrl}" style="display:inline-block;background:#102540;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-family:Inter,sans-serif;font-weight:600;font-size:14px;">Submit my documents</a>
        </p>
        <p style="font-family:Inter,sans-serif;color:#1A1A1A;font-size:12px;opacity:.7;">
          If the button does not work, paste this link into your browser:<br>
          <span style="word-break:break-all;">${intakeUrl}</span>
        </p>
      `,
    });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;
    if (resendKey && candidate.email) {
      try {
        const r = await quotaGuardedFetch(RESEND_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `JBJ Global Real Estate <${VERIFIED_SENDER}>`,
            to: [candidate.email],
            subject: "Congratulations — please submit your onboarding documents",
            html,
          }),
        });
        emailSent = r.ok;
      } catch (e) {
        console.warn("approve email send warning", e);
      }
    }

    return json({
      ok: true,
      candidate_id,
      intake_token: intakeToken,
      intake_url: intakeUrl,
      email_sent: emailSent,
    });
  } catch (e) {
    console.error("hr-approve-and-request-docs error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
