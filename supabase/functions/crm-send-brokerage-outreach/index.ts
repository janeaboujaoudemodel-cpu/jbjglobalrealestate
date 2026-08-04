/**
 * CRM Send Brokerage Outreach Email — via Resend
 *
 * Mirror of crm-send-developer-registration, but for brokerages
 * (channel-partner outreach + private breakfast invitations).
 *
 * Loads the locked HTML template from `crm_email_templates` and sends it via
 * the verified sender domain so replies thread back to Jane's inbox.
 *
 * Owner-only.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  PRIMARY_SENDER,
  PRIMARY_SENDER_NAME,
  DEFAULT_REPLY_TO,
  enforceAllowedSender,
} from "../_shared/outreachIdentity.ts";
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
];

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
  subjectOverride?: string;
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
    "We'd love to introduce CITI Developers to your team.",
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

    // Helper: prettify a name segment derived from an email local-part
    const prettifyFromEmail = (email: string): { firstName: string; fullName: string; brokerage: string } => {
      const [local, domain] = email.split("@");
      const cleanedLocal = (local || "").replace(/[._+\-0-9]+/g, " ").trim();
      const parts = cleanedLocal.split(/\s+/).filter(Boolean);
      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      const firstName = parts[0] ? cap(parts[0]) : "there";
      const fullName = parts.map(cap).join(" ") || firstName;
      const dom = (domain || "").split(".")[0] || "";
      const brokerage = dom ? cap(dom) : "";
      return { firstName, fullName, brokerage };
    };

    let brk: any = null;
    let recipient = "";
    let contactName = "";
    if (isTest && !body.brokerageId) {
      recipient = body.testRecipient!;
      const brokerageName = (body.testBrokerageName && body.testBrokerageName.trim()) || "Your agency";
      // Test sends MUST address the agency name — never derive a person name
      // from the recipient email local-part (would produce "Dear Info").
      brk = {
        company_name: brokerageName,
        primary_contact: {},
      };
      contactName = "";
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

    // Brokerage outreach is sent via Resend on the verified sender domain.
    // No Gmail connector — Gmail rewrites the From: header to the connected
    // mailbox (e.g. janeaboujaoudemodel@gmail.com) which is not what we want.
    if (!Deno.env.get("RESEND_API_KEY")) {
      return new Response(JSON.stringify({
        error: "RESEND_NOT_CONFIGURED",
        message: "RESEND_API_KEY is not configured for this project.",
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Sender brand = represented developer (per-row → owner default → CITI Developer)
    const representedDeveloperName: string =
      (brk?.represented_developer_name && String(brk.represented_developer_name).trim()) ||
      (settings?.default_brokerage_sender_developer_name && String(settings.default_brokerage_sender_developer_name).trim()) ||
      "CITI Developer";

    // HARD LOCK: brokerage outreach must never expose the JBJ brand or any
    // placeholder/private sender domain to the recipient. From and Reply-To
    // both stay on Jane's approved brokerage mailbox.
    const FORCED_ENVELOPE_FROM = "jane@jbj.ae";
    const FORCED_FROM_DISPLAY = "Jane Bou Jaoude";
    const fromName = FORCED_FROM_DISPLAY;
    const replyTo = "jane@jbj.ae";
    try {
      enforceAllowedSender(FORCED_ENVELOPE_FROM);
    } catch (senderErr: any) {
      return new Response(JSON.stringify({
        error: "INVALID_SENDER_DOMAIN",
        message: senderErr?.message || "Sender domain not allowed.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Legacy guard list: keep these forbidden in envelope addresses so a
    // bad CC/recipient cannot leak the email back through old Gmail mailboxes.
    const WORKFLOW_FORBIDDEN_ADDRESSES = ["janeaboujaoudemodel@gmail.com", "janeaboujaoudenails@gmail.com"];
    const brkActiveCc = Array.isArray(settings?.brokerage_active_cc_emails)
      ? settings.brokerage_active_cc_emails.filter(Boolean)
      : [];
    // Brokerage CC list is INDEPENDENT — never inherit developer/legacy CC,
    // so JBJ addresses never accidentally CC on a CITI Developer email.
    const ccList = body.ccEmailOverride
      ? String(body.ccEmailOverride).split(",").map((s: string) => s.trim()).filter(Boolean)
      : [...brkActiveCc];
    // Drop any self-CC (From == CC would just duplicate the message).
    const SECONDARY_CC = FORCED_ENVELOPE_FROM;
    const filteredCc = ccList.filter((c) => c.toLowerCase() !== SECONDARY_CC.toLowerCase());
    ccList.length = 0;
    ccList.push(...filteredCc);
    const ccEmail = ccList[0] || "";
    // Test sends still get CCs (so the owner can verify the CC list is correct).
    const cc = ccList;

    // owner first name — defaults to "Jane" because the template is authored as Jane.
    // Hard-fallback to "Jane" if any source resolves to "JBJ" (legacy brand confusion).
    // Owner identity is HARDCODED — never derived from a company-name setting
    // (which previously turned "Citi Developer" into a first name "Citi").
    const ownerFirstName = "Jane";
    const ownerFullName = "Jane Bou Jaoude";
    const ownerDepartment = "Sales & Training Department";

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

    // Booking URL: ALWAYS the owner's Google Calendar appointment link.
    // Brokerages must book directly on Google — Google sends the
    // confirmation email and writes the event to Jane's dedicated
    // breakfast calendar. No website redirect, no jbj.ae link, ever.
    const activeAccount = String(settings?.google_calendar_active_account || "").trim();
    const businessUrl = String(settings?.google_calendar_booking_url_business || "").trim();
    const personalUrl = String(settings?.google_calendar_booking_url_personal || "").trim();
    const legacyUrl = String(settings?.google_calendar_booking_url || "").trim();
    let bookingUrl: string =
      (activeAccount === "business" && businessUrl) ||
      (activeAccount === "personal" && personalUrl) ||
      legacyUrl ||
      personalUrl ||
      businessUrl ||
      "";
    // Hard guard: reject any booking URL that points back at the website.
    const FORBIDDEN_BOOKING_HOSTS = ["jbj.ae", "www.jbj.ae", "/breakfast-booking"];
    const bookingUrlLower = bookingUrl.toLowerCase();
    const bookingUrlForbidden = FORBIDDEN_BOOKING_HOSTS.some((h) => bookingUrlLower.includes(h));
    // Only hard-block URLs that point back at the website (looks like a competitor).
    // An empty booking URL is allowed — the template simply omits the calendar CTA.
    if (bookingUrlForbidden) {
      return new Response(JSON.stringify({
        error: "BREAKFAST_BOOKING_URL_FORBIDDEN",
        message: "Send blocked — the saved booking URL points back to jbj.ae. Replace it with your Google Calendar appointment link (https://calendar.app.google/…) in CRM Settings → Brokerage Outreach.",
      }), { status: 412, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!bookingUrl) {
      console.warn("No Google Calendar booking URL saved — sending without booking CTA.");
    }

    // Resolve featured Citi project (defaults to AMRA).
    const project = resolveProject(personalization.featuredProjectKey);

    // Salutation: prefer real first name; otherwise "<Brokerage> team"; final fallback "team".
    const brokerageNameResolved = brk.company_name || "your team";
    const hasRealFirstName =
      resolvedContactFirstName &&
      resolvedContactFirstName.toLowerCase() !== "team" &&
      resolvedContactFirstName.trim().length > 0;
    const salutation = hasRealFirstName
      ? resolvedContactFirstName
      : (brk.company_name ? `${brk.company_name} team` : "team");

    const varsMap: Record<string, string> = {
      brokerage_name: brokerageNameResolved,
      brokerage_location: brokerageLocation,
      salutation,
      contact_first_name: resolvedContactFirstName,
      contact_full_name: resolvedContactFullName || (brk.company_name || "your team"),
      contact_title: pcRaw.title || "",
      group_status_label: resolvedGroupLabel,
      group_status_line: resolvedGroupLine,
      preferred_event_time_label: preferredSlotLabel || "",
      preferred_event_time_iso: preferredSlotIso || "",
      owner_first_name: ownerFirstName,
      owner_full_name: ownerFullName,
      owner_last_name: "Bou Jaoude",
      owner_department: ownerDepartment,
      reply_to: replyTo,
      reply_to_display: replyTo,
      reply_to_lower: replyTo,
      developer_website: "https://citideveloper.com",
      developer_map: "https://www.google.com/maps/search/?api=1&query=CITI%20Developers%20Sales%20Gallery%20Dubai",
      developer_phone_display: "+974 15 15 015",
      developer_phone_tel: "tel:+9741515015",
      whatsapp_url: "https://wa.me/9741515015",
      office_location: "CITI Developers Sales Gallery",
      developer_logo_url: "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/brand/citi-developers-gold.png",
      cc_email: ccEmail,
      from_name: fromName,
      represented_developer_name: representedDeveloperName,
      booking_url: bookingUrl,
      project_name: project.name,
      project_url: project.url,
      project_tagline: project.tagline,
      project_offer_html: project.offerHtml || "",
    };

    // STRICT: always send the locked DB template — preview MUST equal sent.
    // No fallback rewriter. No AI paraphrase. No subject regeneration.
    let html = renderTemplate(template.html, varsMap);

    // LOCKED SINGLE-CARD RULE: never inject a separate header block outside the
    // template's own card. Every branded outreach email — brokerage, developer,
    // investor — renders as ONE card only. The header, body, featured project,
    // CTA, signature and contact strip all live inside the same wrapper defined
    // by the DB template. Do NOT reintroduce a pre-<body> header table here.

    // Resend click tracking can rewrite deep links through a browser redirect,
    // which breaks mobile handlers for phone, WhatsApp, Maps and Calendar.
    // Add both supported opt-out attributes so the original href ships intact.
    html = html.replace(
      /<a\b([^>]*\bhref\s*=\s*["'](?:tel:|mailto:|https:\/\/(?:wa\.me|api\.whatsapp\.com|www\.google\.com\/maps|maps\.app\.goo\.gl|calendar\.app\.google|calendar\.google\.com)\/|whatsapp:)[^"']*["'][^>]*)>/gi,
      (full, attrs) => {
        let nextAttrs = attrs;
        if (!/\bdata-no-link-tracking\b/i.test(nextAttrs)) nextAttrs += ' data-no-link-tracking="true"';
        if (!/\bdata-disable-tracking\b/i.test(nextAttrs)) nextAttrs += ' data-disable-tracking="true"';
        return `<a${nextAttrs}>`;
      },
    );
    const subjectRendered = renderTemplate(template.subject, varsMap);
    const subject = isTest && body.subjectOverride && body.subjectOverride.trim()
      ? renderTemplate(body.subjectOverride.trim(), varsMap)
      : subjectRendered;

    // Reject any unresolved {{var}} placeholders — never guess missing values.
    const unresolved = new Set<string>();
    for (const src of [subject, html]) {
      const m = src.match(/\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g);
      if (m) m.forEach((t) => unresolved.add(t.replace(/[{}\s]/g, "")));
    }
    if (unresolved.size > 0) {
      return new Response(JSON.stringify({
        error: "LOCKED_TEMPLATE_MISSING_VAR",
        message: `Send blocked — locked template has unresolved variables: ${[...unresolved].join(", ")}. Add the data on the brokerage row or unlock + edit the template.`,
        missing: [...unresolved],
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Forbidden-address guard — only check envelope addresses (From/Reply-To/CC/To),
    // NOT subject/body content. Template signatures/links may legitimately mention
    // legacy addresses; what matters is that the email isn't *sent from/to* them.
    {
      // Skip guard when recipient is an owner alias (self-test scenario).
      const recipientLc = String(recipient || "").toLowerCase().trim();
      const isOwnerSelfTest = OWNER_EMAILS.map((e) => e.toLowerCase()).includes(recipientLc);
      const haystack = isOwnerSelfTest
        ? `${replyTo}\n${cc.join(",")}`.toLowerCase()
        : `${replyTo}\n${cc.join(",")}\n${recipient}`.toLowerCase();
      const hit = WORKFLOW_FORBIDDEN_ADDRESSES.find((a) => haystack.includes(a.toLowerCase()));
      if (hit) {
        return new Response(JSON.stringify({
          error: "FORBIDDEN_ADDRESS_IN_WORKFLOW",
          message: `Send blocked — address ${hit} is forbidden in brokerage outreach. Use jane@jbj.ae.`,
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // === SINGLE-AGENCY GUARD ===
    // Hard rule: one outbound email = one brokerage. Reject if rendered subject/body
    // mentions any other brokerage from this owner's directory.
    {
      const targetName = String(varsMap.brokerage_name || "").trim();
      if (!targetName) {
        return new Response(JSON.stringify({ error: "Single-agency guard: brokerage_name is empty" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Reject leftover unresolved placeholders (e.g. {{brokerage_name}} still present).
      const haystack = `${subject}\n${html}`;
      if (/\{\{\s*brokerage_[a-z_]+\s*\}\}/i.test(haystack)) {
        return new Response(JSON.stringify({ error: "Single-agency guard: unresolved {{brokerage_*}} placeholder in template" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        const { data: others } = await service
          .from("crm_brokerages")
          .select("company_name")
          .eq("owner_id", user.id)
          .neq("company_name", targetName);
        const lowerHay = haystack.toLowerCase();
        const targetLower = targetName.toLowerCase();
        const offending: string[] = [];
        for (const row of (others || []) as any[]) {
          const name = String(row.company_name || "").trim();
          if (!name || name.length < 4) continue; // skip noise / single-letter
          const lower = name.toLowerCase();
          if (lower === targetLower) continue;
          // Whole-name appearance only (avoid substring false positives like "ABC" matching "ABCD")
          if (lowerHay.includes(lower) && !targetLower.includes(lower)) {
            offending.push(name);
          }
          if (offending.length >= 3) break;
        }
        if (offending.length > 0) {
          console.error("[single-agency-guard] cross-agency contamination blocked", { target: targetName, offending });
          return new Response(JSON.stringify({
            error: `Cross-agency contamination blocked — email mentions: ${offending.join(", ")}`,
            offending,
          }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      } catch (guardErr) {
        console.warn("[single-agency-guard] lookup failed (allowing send):", guardErr);
      }
    }

    // Send via Resend (verified sender domain). Quota + 2 req/s throttle
    // are enforced inside sendViaResend.
    const resendResult = await sendViaResend({
      from: `${fromName} <${FORCED_ENVELOPE_FROM}>`,
      to: recipient,
      cc: cc.length ? cc : undefined,
      reply_to: replyTo,
      subject,
      html,
      headers: {
        "X-JBJ-Outreach": "brokerage",
        "X-JBJ-Variant": variant,
      },
      tags: [
        { name: "variant", value: variant },
        { name: "mode", value: isTest ? "test" : "production" },
      ],
    });

    if (!resendResult.ok) {
      console.error("Resend send failed:", resendResult.status, resendResult.error, resendResult.data);
      const isAuth = resendResult.status === 401 || /api key/i.test(String(resendResult.error || ""));
      const friendly = isAuth
        ? "Resend API key is invalid. Update RESEND_API_KEY in Cloud → Secrets and redeploy."
        : (resendResult.error || "Resend send failed");
      return new Response(JSON.stringify({
        error: friendly,
        code: isAuth ? "RESEND_AUTH_INVALID" : "RESEND_SEND_FAILED",
        upstream_status: resendResult.status,
        details: resendResult.data,
        quota: resendResult.quota,
      }), {
        status: resendResult.status >= 400 && resendResult.status < 600 ? resendResult.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messageId: string | null = resendResult.data?.id || null;
    const threadId: string | null = null;

    if (isTest) {
      const intendedSendId = `test:${variant}:${messageId || crypto.randomUUID()}`;
      await recordJbjResendSend({
        portalKind: "brokerage",
        entityType: "brokerage",
        entityId: brk?.id ?? null,
        email: recipient,
        templateSlug: variant,
        senderEmail: FORCED_ENVELOPE_FROM,
        replyTo,
        subject,
        resendMessageId: messageId,
        providerResponse: { mode: "test", status: resendResult.status, data: resendResult.data },
        intendedSendId,
        sendCategory: "test",
        idempotencyKey: buildCampaignIntendedSendKey({
          portalKind: "brokerage",
          templateSlug: variant,
          recipientId: brk?.id ?? recipient,
          intendedSendId,
        }),
      });
      return new Response(JSON.stringify({
        ok: true, test: true, recipient, messageId, threadId,
        from_email: FORCED_ENVELOPE_FROM, reply_to: replyTo, sent_via: "resend",
        quota: resendResult.quota,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update brokerage row
    await service.from("crm_brokerages").update({
      last_outreach_at: new Date().toISOString(),
      outreach_count: (brk.outreach_count || 0) + 1,
      first_contact_at: brk.first_contact_at || new Date().toISOString(),
      outreach_stage: brk.outreach_stage === "not_contacted" ? "attempted" : brk.outreach_stage,
      attempt_count: (brk.attempt_count || 0) + 1,
      email: brk.email || recipient,
    }).eq("id", brk.id);

    // Legacy log
    await service.from("crm_relationship_email_log").insert({
      owner_id: user.id,
      entity_type: "brokerage",
      entity_id: brk.id,
      direction: "outbound",
      sent_via: "resend",
      external_message_id: messageId,
      thread_id: threadId,
      from_email: FORCED_ENVELOPE_FROM,
      to_emails: [recipient],
      cc_emails: cc,
      subject,
      body_snippet: `Sent ${variant === "brokerage_breakfast_invite" ? "private breakfast invitation" : "channel-partner outreach"} to ${brk.company_name} · ${resolvedContactFullName || "(no contact)"} · ${resolvedGroupLabel}${preferredSlotLabel ? ` · suggested ${preferredSlotLabel}` : ""}`,
      sent_at: new Date().toISOString(),
    });

    // Canonical JBJ spine record
    const intendedSendId = `campaign:${variant}:${brk.id}:${new Date().toISOString().slice(0, 10)}:${messageId || crypto.randomUUID()}`;
    await recordJbjResendSend({
      portalKind: "brokerage",
      entityType: "brokerage",
      entityId: brk.id,
      email: recipient,
      templateSlug: variant,
      senderEmail: FORCED_ENVELOPE_FROM,
      replyTo,
      subject,
      resendMessageId: messageId,
      providerResponse: { status: resendResult.status, data: resendResult.data },
      intendedSendId,
      sendCategory: "campaign",
      idempotencyKey: buildCampaignIntendedSendKey({
        portalKind: "brokerage",
        templateSlug: variant,
        recipientId: brk.id,
        intendedSendId,
      }),
    });


    return new Response(JSON.stringify({ ok: true, recipient, messageId, threadId, variant, from_email: FORCED_ENVELOPE_FROM, reply_to: replyTo, sent_via: "resend", quota: resendResult.quota }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("crm-send-brokerage-outreach error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
