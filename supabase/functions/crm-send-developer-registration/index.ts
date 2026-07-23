/**
 * CRM Send Developer Registration Email — via Gmail
 *
 * Loads the locked HTML template from `crm_email_templates` (variant) and
 * sends it via the owner's connected Gmail account so replies thread back
 * to the configured JBJ inbox where crm-email-sync can pick them up.
 *
 * Owner-only.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendViaResend } from "../_shared/resendClient.ts";

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
const GMAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

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

const base64UrlEncode = (str: string) => {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const encodeMimeHeader = (value: string) => {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const bytes = new TextEncoder().encode(value);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return `=?UTF-8?B?${btoa(bin)}?=`;
};

const buildRawMime = (opts: { from: string; to: string; cc: string[]; subject: string; html: string; replyTo: string; }) => {
  const headers = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    opts.cc.length ? `Cc: ${opts.cc.join(", ")}` : "",
    `Reply-To: ${opts.replyTo}`,
    `Subject: ${encodeMimeHeader(opts.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
  ].filter(Boolean).join("\r\n");
  return base64UrlEncode(headers + "\r\n\r\n" + opts.html);
};

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

const injectJbjBrandHeader = (html: string) => {
  if (/data-jbj-brand-header="true"/.test(html)) return html;
  if (/<body[^>]*>/i.test(html)) return html.replace(/<body([^>]*)>/i, (_m, attrs) => `<body${attrs}>${JBJ_BRAND_HEADER_HTML}`);
  return JBJ_BRAND_HEADER_HTML + html;
};

const hardenRenderedDeveloperHtml = (html: string, developerName: string, replyTo: string) => {
  const contactMailLink = `<a href="mailto:${replyTo}" style="color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;font-weight:700;text-decoration:underline;text-decoration-color:#B89555;">${replyTo.toUpperCase()}</a>`;
  const jbjLink = `<a href="https://jbj.ae" target="_blank" rel="noreferrer" style="color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;font-weight:700;text-decoration:underline;text-decoration-color:#B89555;">JBJ.AE</a>`;
  const mailToken = "__JBJ_CONTACT_MAIL_LINK__";
  return html
    .replace(/Dear\s+<strong>[^<]+<\/strong>\s+Broker Relations Team/gi, `Dear <strong>${developerName}</strong> Broker Relations Team`)
    .replace(/Dear\s+[^,<\n]+\s+Broker Relations Team/gi, `Dear ${developerName} Broker Relations Team`)
    .replace(/Dear\s+(?:4\s*Direction|Four\s+Directions?)[^,<]*(?=,)/gi, `Dear ${developerName}`)
    .replace(/\bAmelia\b/g, "Jane Bou Jaoude")
    .replace(/Founder\s*&\s*CEO/gi, "Head of Business Development")
    .replace(/\+971\s?\d{1,2}\s?\d{3}\s?\d{4}/g, "+971 54 716 7107")
    .replace(/<a\b[^>]*href=["']mailto:(?:contact|info|helpdesk)@jbj\.ae(?:\?[^"']*)?["'][^>]*>[\s\S]*?<\/a>/gi, mailToken)
    .replace(/\b(?:contact|info|helpdesk)@jbj\.ae\b/gi, mailToken)
    .replace(new RegExp(mailToken, "g"), contactMailLink)
    .replace(/<b>JBJ<\/b>\.AE/gi, jbjLink)
    .replace(/>JBJ\.AE</gi, `>${jbjLink}<`)
    .replace(/>jbj\.ae</gi, `>${jbjLink}<`)
    .replace(/JBJ Global Real Estate/g, "JBJ GLOBAL REAL ESTATE");
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
    if (!settings?.drive_doc_pack_url) {
      return new Response(JSON.stringify({ error: "Add a Google Drive document pack link in the Document Pack panel first." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");

    const fromName = "Amelia — JBJ Global Real Estate";
    const replyTo = "helpdesk@jbj.ae";
    const activeCcArr = Array.isArray(settings.active_cc_emails) ? settings.active_cc_emails.filter(Boolean) : [];
    const legacyCc = (settings.cc_email || "").trim();
    const ccList = body.ccEmailOverride
      ? [String(body.ccEmailOverride).trim()].filter(Boolean)
      : (activeCcArr.length > 0 ? activeCcArr : (settings.cc_jane_enabled && legacyCc ? [legacyCc] : []));
    const ccEmail = ccList[0] || "";
    const cc = !isTest ? ccList : [];

    let html = renderTemplate(template.html, {
      developer_name: dev.developer_name,
      drive_url: settings.drive_doc_pack_url,
      reply_to: replyTo,
      reply_to_display: replyTo,
      reply_to_lower: replyTo,
      cc_email: ccEmail,
      from_name: fromName,
      sender_name: "Amelia",
      sender_title: "Head of Business Development",
      sender_phone: "+971 54 716 7107",
      sender_phone_tel: "tel:+971547167107",
    });
    html = hardenRenderedDeveloperHtml(html, dev.developer_name, replyTo);
    html = injectJbjBrandHeader(html);
    const baseSubject = isTest && body.subjectOverride && body.subjectOverride.trim()
      ? body.subjectOverride.trim()
      : template.subject;
    const renderedSubject = renderTemplate(baseSubject, {
      developer_name: dev.developer_name,
      drive_url: settings.drive_doc_pack_url,
      reply_to: replyTo,
      reply_to_display: replyTo,
      reply_to_lower: replyTo,
      cc_email: ccEmail,
      from_name: fromName,
      sender_name: "Amelia",
      sender_title: "Head of Business Development",
      sender_phone: "+971 54 716 7107",
      sender_phone_tel: "tel:+971547167107",
    });
    const subject = isTest ? `[TEST] ${renderedSubject.replace(/^\[TEST\]\s*/i, "")}` : renderedSubject;

    if (isTest) {
      const resendResult = await sendViaResend({
        from: `${fromName} <${replyTo}>`,
        to: recipient,
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

    if (!LOVABLE_API_KEY || !GMAIL_API_KEY) {
      throw new Error("Gmail connector not configured");
    }

    const raw = buildRawMime({
      from: `${fromName} <${replyTo}>`,
      to: recipient,
      cc,
      subject,
      html,
      replyTo,
    });

    const gmailRes = await fetch(`${GMAIL_GATEWAY}/users/me/messages/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GMAIL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    const gmailJson = await gmailRes.json();
    if (!gmailRes.ok) {
      console.error("Gmail send failed:", gmailRes.status, gmailJson);
      return new Response(JSON.stringify({ error: gmailJson?.error?.message || "Gmail send failed", details: gmailJson }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messageId: string | null = gmailJson?.id || null;
    const threadId: string | null = gmailJson?.threadId || null;

    const nowIso = new Date().toISOString();
    const newStatus = sourceTable === "developers"
      ? (dev.status === "not_registered" ? "application_pending" : dev.status)
      : (dev.status === "not_started" ? "pending_application" : dev.status);

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

    // Log outbound email
    await service.from("crm_relationship_email_log").insert({
      owner_id: user.id,
      entity_type: "developer_registry",
      entity_id: dev.id,
      direction: "outbound",
      sent_via: "gmail",
      external_message_id: messageId,
      thread_id: threadId,
      from_email: replyTo,
      to_emails: [recipient],
      cc_emails: cc,
      subject,
      body_snippet: `Sent ${variant === "developer_confirm_registered" ? "confirmation request" : "broker registration package"} to ${dev.developer_name}`,
      sent_at: nowIso,
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

    return new Response(JSON.stringify({ ok: true, recipient, messageId, threadId, variant }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("crm-send-developer-registration error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
