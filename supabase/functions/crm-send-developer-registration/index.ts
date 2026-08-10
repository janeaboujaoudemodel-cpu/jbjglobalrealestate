/**
 * CRM Send Developer Registration Email — via Resend
 *
 * Loads the locked HTML template from `crm_email_templates` (variant) and
 * sends it via Resend using the verified JBJ sender domain so replies thread back
 * to the configured JBJ inbox where crm-email-sync can pick them up.
 *
 * Owner-only.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendViaResend } from "../_shared/resendClient.ts";
import { recordJbjResendSend, buildCampaignIntendedSendKey } from "../_shared/jbjSpine.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = [
  "janeaboujaoudenails@gmail.com",
  "janeaboujaoudemodel@gmail.com",
  "infoo.jane@gmail.com",
  "helpdesk@jbj.ae",
];
const DEFAULT_REGISTRATION_PACKAGE_LINK = "https://drive.google.com/open?id=1EsWVmAPv6ljBzWbWNAvv07EQrHwi5drS&usp=drive_fs";

interface Body {
  developerId?: string;
  catalogDeveloperId?: string;
  variant?: "developer_registration" | "developer_confirm_registered";
  // When set, sends the email to this address only and DOES NOT update the
  // registry/log — used for "Send TEST to me" before broadcasting.
  testRecipient?: string;
  // When testing without a developerId, supply a sample name to inject into
  // the {{developer_name}} placeholder.
  testDeveloperName?: string;
  overrideEmail?: string;
  fromEmailOverride?: string;
  ccEmailOverride?: string;
  subjectOverride?: string;
}

const renderTemplate = (html: string, vars: Record<string, string>) =>
  html.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");

const extractFirstEmail = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.trim() || "";
};

const displayNameFromEmail = (email: string, fallback: string) => {
  const normalized = String(email || "").trim().toLowerCase();
  if (normalized === "infoo.jane@gmail.com") return "Jane";
  const local = normalized.split("@")[0] || "";
  const cleaned = local.replace(/\+.*$/, "").replace(/[._\-0-9]+/g, " ").trim();
  if (!cleaned) return fallback;
  return cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const JBJ_BRAND_HEADER_HTML = `<table role="presentation" data-jbj-brand-header="true" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#ffffff;">
  <tr><td align="center" style="padding:22px 16px 18px;background:#ffffff;border-bottom:1px solid rgba(184,149,85,0.4);">
    <img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/brand%2Fjbj-monogram-cropped.png" alt="JBJ Global Real Estate" width="78" height="100" style="display:block;width:78px;height:100px;max-width:78px;margin:0 auto 10px;object-fit:contain;" />
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;letter-spacing:0.22em;color:#0F1A16;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</div>
    <div style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.28em;color:#B89555;text-transform:uppercase;margin-top:4px;">Developer Relations</div>
  </td></tr>
</table>`;

// LOCKED SINGLE-CARD RULE: never inject a header block outside the template.
// The DB template is the sole card. This helper is a no-op kept only so the
// existing call site keeps compiling.
const injectJbjBrandHeader = (html: string) => html;

// Compact, premium requirements block. Lives INSIDE the main card (injected
// right before the "Regards" sign-off), not as a standalone section below it.
// Rules per owner:
//  - Do NOT ask for trade-license / three-status options (they already have those docs).
//  - Escrow is for THEIR projects (per-project escrow + corporate bank account).
//  - WhatsApp group naming uses a straight slash and lives inside this block.
//  - Admin contact (Walid Halabi) lives inside this block too — nothing below the card.
const DEVELOPER_REQUIREMENTS_BLOCK = `<table role="presentation" data-jbj-developer-requirements="true" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:18px 0 8px;background:#FAF5EA;border:1px solid #B89555;border-radius:6px;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.55;color:#0a0a0a;">
  <tr><td style="padding:16px 18px;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;">
    <p style="margin:0 0 4px;font-weight:800;text-transform:uppercase;letter-spacing:0.09em;font-size:11px;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;">Registration desk</p>
    <p style="margin:0 0 12px;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;">Kindly reply with your registration form and requirements. Send documents to <strong>helpdesk@jbj.ae</strong>.</p>

    <p style="margin:0 0 4px;font-weight:800;text-transform:uppercase;letter-spacing:0.09em;font-size:11px;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;">Project escrow &amp; bank details</p>
    <p style="margin:0 0 12px;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;">In your marketing-material link, please include <strong>one folder per project</strong> containing project details, the <strong>project escrow account</strong>, and the <strong>corporate bank account</strong> for that project. For any project not yet registered, mark it <em>&ldquo;Registration pending &mdash; documents pending from JBJ&rdquo;</em> with the reason.</p>

    <p style="margin:0 0 4px;font-weight:800;text-transform:uppercase;letter-spacing:0.09em;font-size:11px;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;">WhatsApp group</p>
    <p style="margin:0 0 8px;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;">Please create a WhatsApp group using both full company names, no emojis and no abbreviations &mdash; example: <strong style="white-space:nowrap;">ABC PROPERTIES&#x2009;/&#x2009;JBJ GLOBAL REAL ESTATE</strong>. For your team the group name would be <strong style="white-space:nowrap;">{{developer_name}}&#x2009;/&#x2009;JBJ GLOBAL REAL ESTATE</strong>. Kindly use your developer logo as the group icon and paste your marketing-material link in the group description.</p>
    <p style="margin:0 0 12px;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;">Please add <strong>both</strong> of us to the group and set <strong>both as group admins</strong>:<br/>
      &bull; <strong>Ms. Jane Bou Jaoude</strong> (Founder) &middot; __JBJ_JANE_WA__<br/>
      &bull; <strong>Walid Halabi</strong> &middot; __JBJ_WALID_WA1__ &middot; __JBJ_WALID_WA2__ <span style="color:#4a4a4a;">(both numbers)</span></p>

    <p style="margin:0 0 4px;font-weight:800;text-transform:uppercase;letter-spacing:0.09em;font-size:11px;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;">Admin contact &mdash; urgent only</p>
    <p style="margin:0;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;"><strong>Walid Halabi</strong> &middot; __JBJ_WALID_WA1__ &middot; __JBJ_WALID_WA2__ <span style="color:#4a4a4a;">&mdash; urgent registration/compliance only; standard correspondence stays on this thread.</span></p>
  </td></tr>
</table>`;

// Injects the requirements block INSIDE the card (before the sign-off).
// Also strips any pre-existing legacy block that may live in the DB template
// body so we never render two copies stacked.
const injectDeveloperRequirementsBlock = (html: string, developerName: string) => {
  // Strip any earlier variant of this block (id-marked or heuristic).
  let cleaned = html.replace(
    /<(?:div|table)[^>]*data-jbj-developer-requirements="true"[\s\S]*?<\/(?:div|table)>/gi,
    "",
  );
  // Strip the legacy DB-baked "Kindly reply to this email..." section — from
  // its heading down to just before the Regards sign-off — so we don't render
  // it twice below the new premium block above.
  cleaned = cleaned.replace(
    /(<(?:p|h[1-6]|div)[^>]*>[\s\S]*?Kindly reply to this email[\s\S]*?)(?=<(?:p|h[1-6]|div)[^>]*>\s*Regards)/i,
    "",
  );
  // Strip stray trade-license asks — the developer already has those docs.
  cleaned = cleaned.replace(
    /<(p|li)[^>]*>[^<]*trade[\s\-]*licen[cs]e[\s\S]*?<\/\1>/gi,
    "",
  );

  const block = DEVELOPER_REQUIREMENTS_BLOCK.replace(/\{\{developer_name\}\}/g, developerName || "your team");
  if (/<p[^>]*>\s*Regards,?/i.test(cleaned)) {
    return cleaned.replace(/(<p[^>]*>\s*Regards,?)/i, `${block}$1`);
  }
  if (/<\/body>/i.test(cleaned)) return cleaned.replace(/<\/body>/i, `${block}</body>`);
  return `${cleaned}${block}`;
};

const hardenRenderedDeveloperHtml = (html: string, developerName: string, replyTo: string) => {
  const contactMailLink = `<a href="mailto:${replyTo}" style="color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;font-weight:700;text-decoration:underline;text-decoration-color:#B89555;">${replyTo.toUpperCase()}</a>`;
  const jbjLink = `<a href="https://jbj.ae" target="_blank" rel="noreferrer" style="color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;font-weight:700;text-decoration:underline;text-decoration-color:#B89555;">JBJ.AE</a>`;
  const mailToken = "__JBJ_CONTACT_MAIL_LINK__";
  return injectDeveloperRequirementsBlock(html, developerName)
    .replace(/Dear\s+<strong>[^<]+<\/strong>\s+Broker Relations Team/gi, `Dear <strong>${developerName}</strong> Broker Relations Team`)
    .replace(/Dear\s+[^,<\n]+\s+Broker Relations Team/gi, `Dear ${developerName} Broker Relations Team`)
    .replace(/Dear\s+(?:4\s*Direction|Four\s+Directions?)[^,<]*(?=,)/gi, `Dear ${developerName}`)
    .replace(/\bAmelia\b/g, "JBJ Team")
    .replace(/Jane\s+Bouchaudey/gi, "JBJ Team")
    .replace(/Jane Bou Jaoude/gi, "JBJ Team")
    .replace(/Founder\s*&\s*CEO|Head of Business Development/gi, "JBJ GLOBAL REAL ESTATE")
    .replace(/\+971\s?\d{1,2}\s?\d{3}\s?\d{4}/g, "+971 54 15 15 015")
    .replace(/\{\{sender_phone_name\}\}/g, "Jane Bou Jaoude")
    .replace(/__JBJ_PHONE_CONTACT_NAME__/g, "Jane Bou Jaoude")
    .replace(/<a\b[^>]*href=["']mailto:(?:contact|info|helpdesk)@jbj\.ae(?:\?[^"']*)?["'][^>]*>[\s\S]*?<\/a>/gi, mailToken)
    .replace(/\b(?:contact|info|helpdesk)@jbj\.ae\b/gi, mailToken)
    .replace(new RegExp(mailToken, "g"), contactMailLink)
    .replace(/<b>JBJ<\/b>\.AE/gi, jbjLink)
    .replace(/>JBJ\.AE</gi, `>${jbjLink}<`)
    .replace(/>jbj\.ae</gi, `>${jbjLink}<`)
    .replace(/JBJ Global Real Estate/g, "JBJ GLOBAL REAL ESTATE")
    // Inject JBJ monogram image inside the card, above the wordmark — mirrors CITI card.
    .replace(
      /(<div\s+style="[^"]*letter-spacing:3px[^"]*text-transform:uppercase[^"]*">JBJ GLOBAL REAL ESTATE<\/div>)/i,
      `<img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/brand%2Fjbj-monogram-cropped.png" alt="JBJ Global Real Estate" width="72" style="max-width:72px;height:auto;display:inline-block;border:0;margin:0 auto 12px;" />$1`,
    )
    // Restore protected WhatsApp numbers AFTER phone normalization above.
    .replace(/__JBJ_JANE_WA__/g, "+971 54 15 15 015")
    .replace(/__JBJ_WALID_WA1__/g, "+971 54 366 2223")
    .replace(/__JBJ_WALID_WA2__/g, "+971 50 999 3839");
};

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

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = (await req.json()) as Body;
    const variant = body.variant || "developer_registration";
    const isTest = !!body.testRecipient;

    // Owner settings (drive link, from name, reply-to, cc)
    const { data: settings } = await service
      .from("crm_owner_settings").select("*").eq("owner_id", user.id).maybeSingle();
    const driveDocPackUrl = typeof settings?.drive_doc_pack_url === "string" && settings.drive_doc_pack_url.trim()
      ? settings.drive_doc_pack_url.trim()
      : DEFAULT_REGISTRATION_PACKAGE_LINK;

    // Template
    const { data: template, error: tplErr } = await service
      .from("crm_email_templates").select("*").eq("variant", variant).maybeSingle();
    if (tplErr || !template) {
      return new Response(JSON.stringify({ error: `Template "${variant}" not found. Reload the page.` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve developer (skipped for tests without a specific developer row)
    let dev: any = null;
    let recipient = "";
    let sourceTable: "crm_developer_registry" | "developers" = "crm_developer_registry";
    if (isTest && !body.developerId && !body.catalogDeveloperId) {
      recipient = body.testRecipient!;
      dev = { developer_name: body.testDeveloperName || displayNameFromEmail(recipient, "Test Recipient") };
    } else {
      if (body.catalogDeveloperId) {
        sourceTable = "developers";
        const { data: d, error: devErr } = await service
          .from("developers")
          .select("id, name, admin_email, registration_status")
          .eq("id", body.catalogDeveloperId)
          .single();
        if (devErr || !d) throw new Error("Developer not found");
        dev = {
          id: d.id,
          developer_name: d.name,
          developer_email: extractFirstEmail(d.admin_email),
          status: d.registration_status || "not_registered",
        };
      } else {
        if (!body.developerId) throw new Error("developerId required");
        const { data: d, error: devErr } = await service
          .from("crm_developer_registry").select("*").eq("id", body.developerId).single();
        if (devErr || !d) throw new Error("Developer not found");
        dev = d;
      }
      recipient = (isTest ? body.testRecipient : (body.overrideEmail || dev.developer_email || "")).trim();
    }

    if (!recipient || !recipient.includes("@")) {
      return new Response(JSON.stringify({ error: "No email on file. Edit developer to add one." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // HARD LOCK — Developer Portal must NEVER contact CITI Developers.
    // Jane is a CITI employee; sending JBJ agency outreach to CITI would look
    // like competitor solicitation. Block by recipient domain and developer
    // name. Do NOT remove without owner approval.
    const recipientLc = recipient.toLowerCase();
    const devNameLc = String(dev?.developer_name || "").toLowerCase();
    const CITI_DOMAINS = ["citideveloper.com", "citideveloper.ae", "citideveloper.co"];
    const isCitiRecipient =
      CITI_DOMAINS.some((d) => recipientLc.endsWith("@" + d) || recipientLc.endsWith("." + d)) ||
      /\bciti\s*developer/.test(devNameLc);
    if (isCitiRecipient) {
      return new Response(JSON.stringify({
        error: "BLOCKED_CITI_DEVELOPERS",
        message: "Developer Portal outreach to CITI Developers is permanently blocked. Jane is employed by CITI — JBJ agency emails must never be sent to CITI. Use the Brokerage Portal for CITI-related sends.",
      }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromName = "JBJ Global Real Estate";
    const replyTo = "helpdesk@jbj.ae";
    const forcedDeveloperCc = "infoo.jane@gmail.com";
    const activeCcArr = Array.isArray(settings?.active_cc_emails) ? settings.active_cc_emails.filter(Boolean) : [];
    const legacyCc = (settings?.cc_email || "").trim();
    const baseCcList = body.ccEmailOverride
      ? [String(body.ccEmailOverride).trim()].filter(Boolean)
      : (activeCcArr.length > 0 ? activeCcArr : (settings?.cc_jane_enabled && legacyCc ? [legacyCc] : []));
    const ccList = Array.from(new Set([...baseCcList, forcedDeveloperCc].map((e) => String(e).trim().toLowerCase()).filter(Boolean)));
    const ccEmail = ccList[0] || "";
    const cc = ccList.filter((email) => email !== recipient.toLowerCase());

    let html = renderTemplate(template.html, {
      developer_name: dev.developer_name,
      drive_url: driveDocPackUrl,
      registration_package_link: driveDocPackUrl,
      reply_to: replyTo,
      reply_to_display: replyTo,
      reply_to_lower: replyTo,
      cc_email: ccEmail,
      from_name: fromName,
      sender_name: fromName,
      sender_title: "Developer Registration Department",
      sender_phone_name: "__JBJ_PHONE_CONTACT_NAME__",
      sender_phone: "+971 54 15 15 015",
      sender_phone_tel: "tel:+971541515015",
    });
    html = hardenRenderedDeveloperHtml(html, dev.developer_name, replyTo);
    html = injectJbjBrandHeader(html);
    const baseSubject = isTest && body.subjectOverride && body.subjectOverride.trim()
      ? body.subjectOverride.trim()
      : template.subject;
    const renderedSubject = renderTemplate(baseSubject, {
      developer_name: dev.developer_name,
      drive_url: driveDocPackUrl,
      registration_package_link: driveDocPackUrl,
      reply_to: replyTo,
      reply_to_display: replyTo,
      reply_to_lower: replyTo,
      cc_email: ccEmail,
      from_name: fromName,
      sender_name: fromName,
      sender_title: "Developer Registration Department",
      sender_phone_name: "__JBJ_PHONE_CONTACT_NAME__",
      sender_phone: "+971 54 15 15 015",
      sender_phone_tel: "tel:+971541515015",
    });
    const cleanSubject = renderedSubject
      .replace(/\bAmelia\b/gi, "JBJ GLOBAL REAL ESTATE")
      .replace(/Jane\s+Bouchaudey/gi, "JBJ GLOBAL REAL ESTATE")
      .replace(/Jane Bou Jaoude/gi, "JBJ GLOBAL REAL ESTATE")
      .replace(/\s+—\s+JBJ GLOBAL REAL ESTATE\s+—\s+JBJ GLOBAL REAL ESTATE/gi, " — JBJ GLOBAL REAL ESTATE");
    const subject = isTest ? `[TEST] ${cleanSubject.replace(/^\[TEST\]\s*/i, "")}` : cleanSubject;

    if (isTest) {
      const resendResult = await sendViaResend({
        from: `${fromName} <${replyTo}>`,
        to: recipient,
        cc: cc.length ? cc : undefined,
        reply_to: replyTo,
        subject,
        html,
        headers: {
          "X-JBJ-Outreach": "developer-registration-test",
          "X-JBJ-Variant": variant,
        },
        tags: [
          { name: "variant", value: variant },
          { name: "mode", value: "test" },
        ],
      });

      if (!resendResult.ok) {
        console.error("Resend developer test failed:", resendResult.status, resendResult.error, resendResult.data);
        return new Response(JSON.stringify({
          error: resendResult.error || "Test send failed",
          code: "RESEND_TEST_SEND_FAILED",
          upstream_status: resendResult.status,
          details: resendResult.data,
          quota: resendResult.quota,
        }), {
          status: resendResult.status >= 400 && resendResult.status < 600 ? resendResult.status : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Record test send in the spine too (for audit/idempotency visibility).
      const intendedSendId = `test:${variant}:${resendResult.data?.id || crypto.randomUUID()}`;
      await recordJbjResendSend({
        portalKind: "developer",
        entityType: "developer",
        entityId: dev?.id ?? null,
        email: recipient,
        templateSlug: variant,
        senderEmail: replyTo,
        replyTo,
        subject,
        resendMessageId: resendResult.data?.id || null,
        providerResponse: {
          mode: "test",
          status: resendResult.status,
          data: resendResult.data,
          html_preview_text: `From: ${fromName} <${replyTo}>\nReply-To: ${replyTo}\nCC: ${cc.join(", ")}\nSubject: ${subject}\n\nDeveloper registration request: status confirmation, registration form, requirements, logo, WhatsApp group setup (Jane + Walid Halabi as admins), and per-project folders with escrow + corporate bank account details.`,
        },
        intendedSendId,
        sendCategory: "test",
        idempotencyKey: buildCampaignIntendedSendKey({
          portalKind: "developer",
          templateSlug: variant,
          recipientId: dev?.id ?? recipient,
          intendedSendId,
        }),
      });

      return new Response(JSON.stringify({
        ok: true,
        test: true,
        recipient,
        messageId: resendResult.data?.id || null,
        threadId: null,
        sent_via: "resend",
        quota: resendResult.quota,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === LIVE SEND (Resend, verified domain) ===
    const resendLive = await sendViaResend({
      from: `${fromName} <${replyTo}>`,
      to: recipient,
      cc: cc.length ? cc : undefined,
      reply_to: replyTo,
      subject,
      html,
      headers: {
        "X-JBJ-Outreach": "developer-registration",
        "X-JBJ-Variant": variant,
      },
      tags: [
        { name: "variant", value: variant },
        { name: "mode", value: "production" },
        { name: "portal", value: "developer" },
      ],
    });

    if (!resendLive.ok) {
      console.error("Resend developer live failed:", resendLive.status, resendLive.error, resendLive.data);
      const isAuth = resendLive.status === 401 || /api key/i.test(String(resendLive.error || ""));
      return new Response(JSON.stringify({
        error: isAuth
          ? "Resend API key is invalid. Update RESEND_API_KEY in Cloud → Secrets."
          : (resendLive.error || "Resend send failed"),
        code: isAuth ? "RESEND_AUTH_INVALID" : "RESEND_SEND_FAILED",
        upstream_status: resendLive.status,
        details: resendLive.data,
        quota: resendLive.quota,
      }), {
        status: resendLive.status >= 400 && resendLive.status < 600 ? resendLive.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messageId: string | null = resendLive.data?.id || null;
    const threadId: string | null = null;

    const nowIso = new Date().toISOString();
    const newStatus = sourceTable === "developers"
      ? (dev.status === "not_registered" ? "pending" : dev.status)
      : (dev.status === "not_started" ? "pending" : dev.status);

    if (sourceTable === "developers") {
      await service.from("developers").update({
        registration_status: newStatus,
        admin_email: dev.developer_email || recipient,
      }).eq("id", dev.id);
    } else {
      await service.from("crm_developer_registry").update({
        last_outreach_at: nowIso,
        outreach_count: (dev.outreach_count || 0) + 1,
        status: newStatus,
        developer_email: dev.developer_email || recipient,
        first_contact_at: dev.first_contact_at || nowIso,
      }).eq("id", dev.id);
    }

    // Legacy log (kept for backwards-compat while dashboards migrate).
    await service.from("crm_relationship_email_log").insert({
      owner_id: user.id,
      entity_type: "developer_registry",
      entity_id: dev.id,
      direction: "outbound",
      sent_via: "resend",
      external_message_id: messageId,
      thread_id: threadId,
      from_email: replyTo,
      to_emails: [recipient],
      cc_emails: cc,
      subject,
      body_snippet: `Sent ${variant === "developer_confirm_registered" ? "confirmation request" : "broker registration package"} to ${dev.developer_name}`,
      sent_at: nowIso,
    });

    // Canonical JBJ spine record.
    const intendedSendId = `campaign:${variant}:${dev.id}:${new Date().toISOString().slice(0, 10)}:${messageId || crypto.randomUUID()}`;
    await recordJbjResendSend({
      portalKind: "developer",
      entityType: "developer",
      entityId: dev.id,
      email: recipient,
      templateSlug: variant,
      senderEmail: replyTo,
      replyTo,
      subject,
      resendMessageId: messageId,
      providerResponse: {
        status: resendLive.status,
        data: resendLive.data,
        html_preview_text: `From: ${fromName} <${replyTo}>\nReply-To: ${replyTo}\nCC: ${cc.join(", ")}\nSubject: ${subject}\n\nDeveloper registration request: status confirmation, registration form, requirements, logo, WhatsApp group setup (Jane + Walid Halabi as admins), and per-project folders with escrow + corporate bank account details.`,
      },
      intendedSendId,
      sendCategory: "campaign",
      idempotencyKey: buildCampaignIntendedSendKey({
        portalKind: "developer",
        templateSlug: variant,
        recipientId: dev.id,
        intendedSendId,
      }),
    });

    if (sourceTable === "crm_developer_registry" && newStatus !== dev.status) {
      await service.from("crm_relationship_status_history").insert({
        owner_id: user.id,
        entity_type: "developer_registry",
        entity_id: dev.id,
        from_status: dev.status,
        to_status: newStatus,
        source: "outbound_email",
        changed_by: user.id,
      });
    }

    return new Response(JSON.stringify({ ok: true, recipient, messageId, threadId, variant, sent_via: "resend", quota: resendLive.quota }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("crm-send-developer-registration error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
