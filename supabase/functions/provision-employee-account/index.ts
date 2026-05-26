// Provision Employee Account
// Owner-only. Creates auth user for a HR-approved new joiner,
// assigns a role, sends a branded welcome+credentials email via Resend.
// Supports test_mode → routes the first invite to the owner's test inbox
// (memory: infoo.jane@gmail.com) so the owner can preview the experience.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";
import { sendViaResend } from "../_shared/resendClient.ts";
import { emailShell, SITE_URL, sharedSections, userGreetingRow } from "../_shared/email-html.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TEST_INBOX = "infoo.jane@gmail.com";

interface Body {
  application_id: string;
  employee_email: string;       // company email to be created (jbjglobalrealestate.com)
  personal_email?: string;      // optional personal mailbox for the invite delivery
  full_name: string;
  job_title: string;
  department: string;
  crm_role?: string;            // 'broker' | 'broker_jbj' | 'admin' | 'user' | ...
  temporary_password: string;
  email_signature_html?: string;
  test_mode?: boolean;          // when true → send to TEST_INBOX (owner preview)
  grant_crm?: boolean;
}

const ALLOWED_ROLES = new Set([
  "admin", "user", "owner", "broker", "listing_admin",
  "hr_admin", "broker_jbj", "broker_partner",
]);

function esc(s: string) {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function buildCredentialsEmail(opts: {
  displayName: string;
  companyEmail: string;
  tempPassword: string;
  jobTitle: string;
  department: string;
  loginUrl: string;
  isTestPreview: boolean;
  signatureHtml?: string;
}) {
  const banner = opts.isTestPreview
    ? `<tr><td style="padding:14px 32px;background:#FFF7E6;border-bottom:1px solid #C8A766;">
<p style="margin:0;color:#8A6500;font-size:13px;font-weight:700;">⚙ TEST PREVIEW — this is the email the new joiner will receive. Routed to your inbox for review.</p>
</td></tr>` : "";

  const body = `${banner}<tr><td class="content-pad" style="padding:32px;">
${userGreetingRow(opts.displayName)}
<p style="margin:0 0 24px;font-size:18px;color:#C8A766;font-weight:600;line-height:1.3;">Welcome to JBJ Global Real Estate — your account is ready.</p>
<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
You've been onboarded as <strong>${esc(opts.jobTitle)}</strong> in <strong>${esc(opts.department)}</strong>.
Use the credentials below to sign in. You'll be asked to set a new password on first login.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 24px;"><tr><td style="padding:20px 24px;background:linear-gradient(135deg,#F7F1E6 0%,#FDFBF7 100%);border-radius:18px;border:1px solid #C8A766;">
  <p style="color:#1a1a1a;font-size:13px;font-weight:700;margin:0 0 10px;letter-spacing:0.5px;text-transform:uppercase;">Your Credentials</p>
  <p style="color:#555;font-size:14px;margin:0 0 6px;"><strong style="color:#1a1a1a;">Email:</strong> ${esc(opts.companyEmail)}</p>
  <p style="color:#555;font-size:14px;margin:0;"><strong style="color:#1a1a1a;">Temporary password:</strong> <code style="background:#FDFBF7;padding:3px 8px;border-radius:6px;border:1px solid #C8A76650;font-family:monospace;color:#1a1a1a;">${esc(opts.tempPassword)}</code></p>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 28px;">
  <a href="${opts.loginUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;letter-spacing:0.5px;border:1px solid #C8A76650;">Sign in to JBJ</a>
</td></tr></table>
${opts.signatureHtml ? `<div style="margin:24px 0 0;padding:18px 22px;background:#FDFBF7;border:1px solid #C8A76630;border-radius:14px;"><p style="color:#1a1a1a;font-size:12px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;">Your Email Signature</p>${opts.signatureHtml}</div>` : ""}
${sharedSections("account")}
</td></tr>`;

  return emailShell("Your JBJ Global Real Estate account is ready", body);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;

    const body = (await req.json()) as Body;
    const companyEmail = (body.employee_email || "").trim().toLowerCase();
    const personalEmail = (body.personal_email || "").trim().toLowerCase();
    if (!companyEmail.includes("@")) return json({ error: "employee_email required" }, 400);
    if (!body.temporary_password || body.temporary_password.length < 8) {
      return json({ error: "temporary_password too short" }, 400);
    }
    if (!body.full_name) return json({ error: "full_name required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Find or create auth user (company email is the login identity)
    let userId: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u: any) => (u.email ?? "").toLowerCase() === companyEmail);
    if (existing) {
      userId = existing.id;
      // Reset password so the supplied temp password works
      await admin.auth.admin.updateUserById(userId, {
        password: body.temporary_password,
        email_confirm: true,
        user_metadata: {
          ...existing.user_metadata,
          full_name: body.full_name,
          job_title: body.job_title,
          department: body.department,
          must_reset_password: true,
        },
      });
    } else {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email: companyEmail,
        password: body.temporary_password,
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name,
          job_title: body.job_title,
          department: body.department,
          must_reset_password: true,
          provisioned_by: auth.userId,
        },
      });
      if (cErr || !created?.user) return json({ error: cErr?.message ?? "Could not create user" }, 500);
      userId = created.user.id;
    }

    // 2. Assign role (only if it's a known enum value)
    if (body.grant_crm !== false && body.crm_role && ALLOWED_ROLES.has(body.crm_role)) {
      await admin.from("user_roles").upsert(
        { user_id: userId, role: body.crm_role },
        { onConflict: "user_id,role", ignoreDuplicates: true } as any,
      );
    }

    // 3. Send branded credentials email
    const isTest = !!body.test_mode;
    const recipient = isTest ? TEST_INBOX : (personalEmail || companyEmail);
    const subject = isTest
      ? `[TEST] Your JBJ account is ready — ${body.full_name}`
      : `Welcome to JBJ Global Real Estate, ${body.full_name.split(" ")[0]}`;

    const html = buildCredentialsEmail({
      displayName: body.full_name,
      companyEmail,
      tempPassword: body.temporary_password,
      jobTitle: body.job_title,
      department: body.department,
      loginUrl: `${SITE_URL}/auth?mode=signin&email=${encodeURIComponent(companyEmail)}`,
      isTestPreview: isTest,
      signatureHtml: body.email_signature_html,
    });

    const sent = await sendViaResend({
      from: "JBJ Global Real Estate <contact@jbj.ae>",
      to: recipient,
      reply_to: "contact@jbj.ae",
      subject,
      html,
      tags: [
        { name: "kind", value: "employee_provisioned" },
        { name: "test_mode", value: isTest ? "1" : "0" },
      ],
    });

    const resendMessageId = (sent as any)?.data?.id ?? null;

    await admin.from("email_send_log").insert({
      to_email: recipient,
      kind: isTest ? "employee_provisioned_test" : "employee_provisioned",
      subject,
      template: "employee_provisioned_v1",
      resend_message_id: resendMessageId,
      status: sent.ok ? "accepted" : "failed",
      error: sent.ok ? null : (sent.error ?? `status ${sent.status}`),
    });

    await admin.from("crm_audit_logs").insert({
      actor_user_id: auth.userId,
      action: "employee_account_provisioned",
      entity_type: "new_joiner_application",
      entity_id: body.application_id,
      details: {
        company_email: companyEmail,
        delivered_to: recipient,
        test_mode: isTest,
        role: body.crm_role,
        email_ok: sent.ok,
        email_status: sent.status,
        resend_message_id: resendMessageId,
        resend_error: sent.error ?? null,
      },
    });

    if (!sent.ok) {
      return json({ ok: false, error: sent.error ?? "Email send failed", user_id: userId, quota: sent.quota }, 502);
    }
    return json({ ok: true, user_id: userId, delivered_to: recipient, test_mode: isTest, resend_message_id: resendMessageId });
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
