/**
 * CRM Send Developer Registration Email — via Gmail
 *
 * Loads the locked HTML template from `crm_email_templates` (variant) and
 * sends it via the owner's connected Gmail account so replies thread back
 * to Jane's inbox where crm-email-sync can pick them up.
 *
 * Owner-only.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

const buildRawMime = (opts: { from: string; to: string; cc: string[]; subject: string; html: string; replyTo: string; }) => {
  const headers = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    opts.cc.length ? `Cc: ${opts.cc.join(", ")}` : "",
    `Reply-To: ${opts.replyTo}`,
    `Subject: ${opts.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
  ].filter(Boolean).join("\r\n");
  return base64UrlEncode(headers + "\r\n\r\n" + opts.html);
};

const renderTemplate = (html: string, vars: Record<string, string>) =>
  html.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");

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

    // Resolve developer (skipped for tests without developerId)
    let dev: any = null;
    let recipient = "";
    if (isTest && !body.developerId) {
      recipient = body.testRecipient!;
      dev = { developer_name: body.testDeveloperName || "Sample Developer Co." };
    } else {
      if (!body.developerId) throw new Error("developerId required");
      const { data: d, error: devErr } = await service
        .from("crm_developer_registry").select("*").eq("id", body.developerId).single();
      if (devErr || !d) throw new Error("Developer not found");
      dev = d;
      recipient = (isTest ? body.testRecipient : (body.overrideEmail || dev.developer_email || "")).trim();
    }

    if (!recipient || !recipient.includes("@")) {
      return new Response(JSON.stringify({ error: "No email on file. Edit developer to add one." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_API_KEY || !GMAIL_API_KEY) {
      throw new Error("Gmail connector not configured");
    }

    const fromName = settings.from_name || "JBJ Global Real Estate";
    const replyTo = (body.fromEmailOverride || settings.reply_to_email || "contact@jbj.ae").trim();
    const activeCcArr = Array.isArray(settings.active_cc_emails) ? settings.active_cc_emails.filter(Boolean) : [];
    const legacyCc = (settings.cc_email || "").trim();
    const ccList = body.ccEmailOverride
      ? [String(body.ccEmailOverride).trim()].filter(Boolean)
      : (activeCcArr.length > 0 ? activeCcArr : (settings.cc_jane_enabled && legacyCc ? [legacyCc] : []));
    const ccEmail = ccList[0] || "";
    const cc = !isTest ? ccList : [];

    const html = renderTemplate(template.html, {
      developer_name: dev.developer_name,
      drive_url: settings.drive_doc_pack_url,
      reply_to: replyTo.toUpperCase(),
      reply_to_display: replyTo.toUpperCase(),
      reply_to_lower: replyTo,
      cc_email: ccEmail,
      from_name: fromName,
    });
    const subject = isTest
      ? `[TEST] ${template.subject}`
      : template.subject;

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

    // Test sends do NOT update the registry or log outbound history.
    if (isTest) {
      return new Response(JSON.stringify({ ok: true, test: true, recipient, messageId, threadId }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update registry — bump status from not_started to pending_application
    const newStatus = dev.status === "not_started" ? "pending_application" : dev.status;
    await service.from("crm_developer_registry").update({
      last_outreach_at: new Date().toISOString(),
      outreach_count: (dev.outreach_count || 0) + 1,
      status: newStatus,
      developer_email: dev.developer_email || recipient,
      first_contact_at: dev.first_contact_at || new Date().toISOString(),
    }).eq("id", dev.id);

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
      sent_at: new Date().toISOString(),
    });

    if (newStatus !== dev.status) {
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
