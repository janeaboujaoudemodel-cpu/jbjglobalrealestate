/**
 * CRM Send Brokerage Outreach Email — via Gmail
 *
 * Mirror of crm-send-developer-registration, but for brokerages
 * (channel-partner outreach + private breakfast invitations).
 *
 * Loads the locked HTML template from `crm_email_templates` and sends it via
 * the owner's connected Gmail account so replies thread back to Jane's inbox.
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

type BrokerageVariant =
  | "brokerage_partnership_intro"
  | "brokerage_breakfast_invite";

type GroupStatusKey =
  | "prospective"
  | "existing"
  | "priority"
  | "active"
  | "nda"
  | "custom";

interface Personalization {
  contactName?: string;
  contactFirstName?: string;
  groupStatus?: GroupStatusKey;
  groupStatusLabelOverride?: string;
  preferredSlotId?: string;
  preferredEventTimeOverride?: string;
  featuredProjectKey?: string;
}

interface Body {
  brokerageId?: string;
  variant?: BrokerageVariant;
  testRecipient?: string;
  testBrokerageName?: string;
  overrideEmail?: string;
  fromEmailOverride?: string;
  ccEmailOverride?: string;
  personalization?: Personalization;
}

// City Developer e-catalogue projects (mirrors src/config/citi-projects.ts).
type CitiProjectKey = "amra" | "allura" | "aveline" | "agua" | "arya";
interface CitiProject {
  key: CitiProjectKey;
  name: string;
  url: string;
  tagline: string;
  offerHtml?: string;
}
const CITI_PROJECTS: Record<CitiProjectKey, CitiProject> = {
  amra: {
    key: "amra",
    name: "AMRA",
    url: "https://citideveloper.com/e-catalogue/amra",
    tagline: "Wellness-led beachfront resort residences in Umm Al Quwain — our current launch focus.",
    offerHtml: `<p style="margin:0 0 8px"><strong>AMRA</strong> is the project we are actively focused on. Brochures, floor plans, payment plans and amenity videos are all in the e-catalogue.</p><p style="margin:0">Marketing freedom: no QR required for AMRA marketing assets — videos are pre-branded and ready to use.</p>`,
  },
  allura: {
    key: "allura",
    name: "Allura Residences",
    url: "https://citideveloper.com/e-catalogue/allura",
    tagline: "Allura Residences — current resale opportunity for serious end-users and investors.",
    offerHtml: `<p style="margin:0 0 8px"><strong>Two 1-bedroom units</strong> available in Allura Residences.</p><p style="margin:0"><strong>15% discount</strong> · <strong>100% upfront payment only</strong>. First-come, first-served.</p>`,
  },
  aveline: { key: "aveline", name: "Aveline", url: "https://citideveloper.com/e-catalogue/aveline", tagline: "Aveline — full project materials available in the e-catalogue." },
  agua: { key: "agua", name: "Agua", url: "https://citideveloper.com/e-catalogue/agua", tagline: "Agua — full project materials available in the e-catalogue." },
  arya: { key: "arya", name: "Arya", url: "https://citideveloper.com/e-catalogue/arya", tagline: "Arya — full project materials available in the e-catalogue." },
};
const resolveProject = (key?: string): CitiProject =>
  CITI_PROJECTS[(key as CitiProjectKey)] || CITI_PROJECTS.amra;

const GROUP_STATUS_LABELS: Record<GroupStatusKey, string> = {
  prospective: "Prospective Partner",
  existing: "Existing Relationship",
  priority: "Priority Partner",
  active: "Active Channel Partner",
  nda: "NDA-Signed Partner",
  custom: "Channel Partner",
};

const GROUP_STATUS_LINES: Record<GroupStatusKey, string> = {
  prospective:
    "We'd love to introduce JBJ Global Real Estate to your team and explore a formal channel partnership.",
  existing:
    "Given the relationship our teams already share, I wanted to deepen the conversation directly with your leadership.",
  priority:
    "As one of the priority brokerages on our shortlist, I'd like to reserve a private session for your team.",
  active:
    "As one of our active channel partners, I'd like to set aside time for a strategic review with your leadership.",
  nda:
    "Building on the NDA already in place between our firms, I'd like to walk your leadership through what's coming next.",
  custom:
    "I'd like to host your leadership for a private briefing tailored to your team.",
};

const deriveGroupStatus = (brk: any, override?: GroupStatusKey): GroupStatusKey => {
  if (override) return override;
  const stage = String(brk?.outreach_stage || "").toLowerCase();
  const tags: string[] = Array.isArray(brk?.tags) ? brk.tags.map((t: any) => String(t).toLowerCase()) : [];
  if (String(brk?.nda_status || "").toLowerCase() === "signed") return "nda";
  if (stage === "active") return "active";
  if (tags.includes("vip") || tags.includes("priority")) return "priority";
  if (brk?.is_existing_match) return "existing";
  return "prospective";
};

const formatSlotLabel = (iso: string): string => {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dubai",
    }).format(d) + " (GST)";
  } catch {
    return "";
  }
};

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

const renderTemplate = (html: string, vars: Record<string, string>) => {
  // Support simple {{#if varname}}...{{/if}} blocks (truthy = non-empty string).
  const conditional = html.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, k, inner) => (vars[k] && String(vars[k]).trim().length > 0 ? inner : ""),
  );
  return conditional.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
};

const firstName = (full?: string | null) => {
  if (!full) return "";
  const t = String(full).trim();
  if (!t) return "";
  return t.split(/\s+/)[0];
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
    const variant: BrokerageVariant = body.variant || "brokerage_partnership_intro";
    const isTest = !!body.testRecipient;

    const { data: settings } = await service
      .from("crm_owner_settings").select("*").eq("owner_id", user.id).maybeSingle();

    const { data: template, error: tplErr } = await service
      .from("crm_email_templates").select("*").eq("variant", variant).maybeSingle();
    if (tplErr || !template) {
      return new Response(JSON.stringify({ error: `Template "${variant}" not found.` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let brk: any = null;
    let recipient = "";
    let contactName = "";
    if (isTest && !body.brokerageId) {
      recipient = body.testRecipient!;
      brk = {
        company_name: body.testBrokerageName || "Sample Brokerage Group",
        primary_contact: { name: "Sample Manager" },
      };
      contactName = "Sample Manager";
    } else {
      if (!body.brokerageId) throw new Error("brokerageId required");
      const { data: b, error: bErr } = await service
        .from("crm_brokerages").select("*").eq("id", body.brokerageId).single();
      if (bErr || !b) throw new Error("Brokerage not found");
      brk = b;
      const pc = (b.primary_contact || {}) as Record<string, any>;
      contactName = pc.name || "";
      recipient = (
        isTest
          ? body.testRecipient
          : (body.overrideEmail || pc.email || b.email || "")
      ).toString().trim();
    }

    if (!recipient || !recipient.includes("@")) {
      return new Response(JSON.stringify({ error: "No email on file. Edit brokerage to add one." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pre-flight registration check (defence in depth — UI also runs this).
    // Skip for test sends; only enforce for real brokerage sends.
    if (!isTest && body.brokerageId) {
      try {
        const checkRes = await userClient.functions.invoke(
          "crm-check-brokerage-registration",
          { body: { brokerageIds: [body.brokerageId], variant } },
        );
        const checkData = checkRes?.data as any;
        const result = checkData?.results?.[0];
        if (result?.status === "block") {
          return new Response(
            JSON.stringify({
              error: "Pre-send check blocked this brokerage",
              code: "REGISTRATION_BLOCK",
              reasons: result.reasons,
            }),
            {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      } catch (checkErr) {
        // If the check itself fails, log but allow send — the UI is the
        // primary gate; this server check is defence in depth.
        console.warn("Pre-send check failed (continuing):", checkErr);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_API_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_API_KEY || !GMAIL_API_KEY) {
      throw new Error("Gmail connector not configured");
    }

    // Sender brand = represented developer (per-row → owner default → fallback)
    const representedDeveloperName: string =
      (brk?.represented_developer_name && String(brk.represented_developer_name).trim()) ||
      (settings?.default_brokerage_sender_developer_name && String(settings.default_brokerage_sender_developer_name).trim()) ||
      "Channel Partner Activation";

    // Brokerage outreach uses its OWN settings (independent of developer pack).
    // Falls back to shared/legacy fields only when brokerage-specific is empty.
    const brkFromName: string =
      (settings?.brokerage_from_name && String(settings.brokerage_from_name).trim()) || "";
    const fromName = brkFromName || `${representedDeveloperName} · Channel Partner Activation`;
    const replyTo = (
      body.fromEmailOverride ||
      settings?.brokerage_reply_to_email ||
      settings?.reply_to_email ||
      "contact@jbj.ae"
    ).toString().trim();
    const brkActiveCc = Array.isArray(settings?.brokerage_active_cc_emails)
      ? settings.brokerage_active_cc_emails.filter(Boolean)
      : [];
    const devActiveCc = Array.isArray(settings?.active_cc_emails)
      ? settings.active_cc_emails.filter(Boolean)
      : [];
    const activeCcArr = brkActiveCc.length > 0 ? brkActiveCc : devActiveCc;
    const legacyCc = (settings?.cc_email || "").trim();
    const ccList = body.ccEmailOverride
      ? String(body.ccEmailOverride).split(",").map((s: string) => s.trim()).filter(Boolean)
      : (activeCcArr.length > 0 ? activeCcArr : (settings?.cc_jane_enabled && legacyCc ? [legacyCc] : []));
    const ccEmail = ccList[0] || "";
    // Test sends still get CCs (so the owner can verify the CC list is correct).
    const cc = ccList;

    // owner first name — defaults to "Jane" because the template is authored as Jane
    const ownerFirstName =
      firstName(settings?.from_name) ||
      firstName((user.user_metadata as any)?.full_name as string | undefined) ||
      "Jane";

    // ---------- Personalization resolution ----------
    const personalization: Personalization = body.personalization || {};
    const pcRaw = (brk?.primary_contact || {}) as Record<string, any>;

    const resolvedContactFullName =
      (personalization.contactName && personalization.contactName.trim()) ||
      contactName ||
      pcRaw.name ||
      "";
    const resolvedContactFirstName =
      (personalization.contactFirstName && personalization.contactFirstName.trim()) ||
      firstName(resolvedContactFullName) ||
      "Team";

    const resolvedGroupKey = deriveGroupStatus(brk, personalization.groupStatus);
    const resolvedGroupLabel =
      (personalization.groupStatusLabelOverride && personalization.groupStatusLabelOverride.trim()) ||
      GROUP_STATUS_LABELS[resolvedGroupKey];
    const resolvedGroupLine = GROUP_STATUS_LINES[resolvedGroupKey];

    const brokerageLocation =
      brk?.office_location || brk?.emirate || "Dubai";

    // Look up preferred slot if provided
    let preferredSlotIso = "";
    let preferredSlotLabel = "";
    if (personalization.preferredSlotId) {
      try {
        const { data: slot } = await service
          .from("breakfast_slots")
          .select("id, slot_at")
          .eq("id", personalization.preferredSlotId)
          .maybeSingle();
        if (slot?.slot_at) {
          preferredSlotIso = String(slot.slot_at);
          preferredSlotLabel = formatSlotLabel(preferredSlotIso);
        }
      } catch (slotErr) {
        console.warn("Preferred slot lookup failed:", slotErr);
      }
    }
    if (!preferredSlotLabel && personalization.preferredEventTimeOverride) {
      preferredSlotLabel = personalization.preferredEventTimeOverride.trim();
    }

    // Mint (or reuse) a breakfast booking invite token
    let bookingUrl = "";
    try {
      const tokenRes = await userClient.functions.invoke(
        "crm-create-breakfast-invite-token",
        {
          body: {
            brokerageId: isTest ? undefined : body.brokerageId,
            isTest,
            preferredSlotId: personalization.preferredSlotId,
          },
        },
      );
      bookingUrl = (tokenRes?.data as any)?.bookingUrl || "";
    } catch (tokErr) {
      console.warn("Booking token mint failed (continuing):", tokErr);
    }

    // Resolve featured Citi project (defaults to AMRA).
    const project = resolveProject(personalization.featuredProjectKey);

    const varsMap: Record<string, string> = {
      brokerage_name: brk.company_name || "your brokerage",
      brokerage_location: brokerageLocation,
      contact_first_name: resolvedContactFirstName,
      contact_full_name: resolvedContactFullName || (brk.company_name || "your team"),
      contact_title: pcRaw.title || "",
      group_status_label: resolvedGroupLabel,
      group_status_line: resolvedGroupLine,
      preferred_event_time_label: preferredSlotLabel || "",
      preferred_event_time_iso: preferredSlotIso || "",
      owner_first_name: ownerFirstName,
      reply_to: replyTo,
      cc_email: ccEmail,
      from_name: fromName,
      represented_developer_name: representedDeveloperName,
      booking_url: bookingUrl,
      project_name: project.name,
      project_url: project.url,
      project_tagline: project.tagline,
      project_offer_html: project.offerHtml || "",
    };

    // If the stored template doesn't reference {{project_name}}, build a fallback
    // body so test sends and legacy templates still showcase the project picker.
    const refsProject = /\{\{\s*project_name\s*\}\}/.test(template.html + " " + template.subject);
    let html = renderTemplate(template.html, varsMap);
    let subjectRendered = renderTemplate(template.subject, varsMap);
    if (!refsProject) {
      subjectRendered = `${project.name} — Private Briefing for ${varsMap.brokerage_name}`;
      const offerBlock = project.offerHtml
        ? `<div style="margin:18px 0;padding:14px 16px;background:#F7F2EA;border:1px solid #B89555;border-radius:8px">${project.offerHtml}</div>`
        : "";
      html = `<!DOCTYPE html><html><body style="background:#ffffff;color:#1A1A1A;font-family:Inter,Arial,sans-serif;padding:32px;max-width:640px;margin:0 auto;line-height:1.55">
        <p>Dear ${varsMap.contact_first_name},</p>
        <p>This is <strong>${ownerFirstName}</strong> from <strong>JBJ Global Real Estate</strong>, channel partner for <strong>${representedDeveloperName}</strong>.</p>
        <p>${resolvedGroupLine}</p>
        <div style="margin:20px 0;padding:18px 20px;background:#FDFBF7;border:1px solid #1A1A1A14;border-radius:10px">
          <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#1A1A1A99;margin-bottom:6px">Featured Project</div>
          <div style="font-size:18px;font-weight:600;color:#1A1A1A;margin-bottom:6px">${project.name}</div>
          <div style="font-size:14px;color:#1A1A1A;margin-bottom:12px">${project.tagline}</div>
          <a href="${project.url}" style="display:inline-block;padding:10px 18px;background:#1A1A1A;color:#ffffff;text-decoration:none;border-radius:6px">Open ${project.name} e-catalogue</a>
        </div>
        ${offerBlock}
        <p>I'd like to invite ${varsMap.brokerage_name} to a <strong>private breakfast &amp; briefing</strong> reserved for select brokerages — agenda covers ${project.name}, commissions, training and channel activation.</p>
        <p>Could you also confirm whether <strong>${varsMap.brokerage_name}</strong> is already registered with ${representedDeveloperName}? If not, we'll fast-track the registration on your behalf.</p>
        ${bookingUrl ? `<p><a href="${bookingUrl}" style="display:inline-block;padding:10px 18px;background:#B89555;color:#ffffff;text-decoration:none;border-radius:6px">RSVP &amp; pick a breakfast slot</a></p>` : ""}
        <p>Warm regards,<br/><strong>${ownerFirstName}</strong><br/>JBJ Global Real Estate<br/>${replyTo}</p>
      </body></html>`;
    }
    const subject = isTest ? `[TEST] ${subjectRendered}` : subjectRendered;

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

    if (isTest) {
      return new Response(JSON.stringify({ ok: true, test: true, recipient, messageId, threadId }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update brokerage row
    await service.from("crm_brokerages").update({
      last_outreach_at: new Date().toISOString(),
      outreach_count: (brk.outreach_count || 0) + 1,
      first_contact_at: brk.first_contact_at || new Date().toISOString(),
      outreach_stage: brk.outreach_stage === "not_contacted" ? "introduced" : brk.outreach_stage,
      attempt_count: (brk.attempt_count || 0) + 1,
      email: brk.email || recipient,
    }).eq("id", brk.id);

    // Log outbound email
    await service.from("crm_relationship_email_log").insert({
      owner_id: user.id,
      entity_type: "brokerage",
      entity_id: brk.id,
      direction: "outbound",
      sent_via: "gmail",
      external_message_id: messageId,
      thread_id: threadId,
      from_email: replyTo,
      to_emails: [recipient],
      cc_emails: cc,
      subject,
      body_snippet: `Sent ${variant === "brokerage_breakfast_invite" ? "private breakfast invitation" : "channel-partner outreach"} to ${brk.company_name} · ${resolvedContactFullName || "(no contact)"} · ${resolvedGroupLabel}${preferredSlotLabel ? ` · suggested ${preferredSlotLabel}` : ""}`,
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ ok: true, recipient, messageId, threadId, variant }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("crm-send-brokerage-outreach error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
