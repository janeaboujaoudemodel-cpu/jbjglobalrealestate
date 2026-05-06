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

const base64UrlEncode = (str: string) => {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// RFC 2047 encoded-word for non-ASCII subject lines (prevents Ã—/ÃƒÆ' mojibake)
const encodeSubject = (s: string) => {
  // ASCII-only? leave as-is.
  if (/^[\x20-\x7E]*$/.test(s)) return s;
  const b64 = btoa(unescape(encodeURIComponent(s)));
  return `=?UTF-8?B?${b64}?=`;
};

const buildRawMime = (opts: { from: string; to: string; cc: string[]; subject: string; html: string; replyTo: string; }) => {
  const headers = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    opts.cc.length ? `Cc: ${opts.cc.join(", ")}` : "",
    `Reply-To: ${opts.replyTo}`,
    `Subject: ${encodeSubject(opts.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
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
      const guess = prettifyFromEmail(recipient);
      const brokerageName = (body.testBrokerageName && body.testBrokerageName.trim()) || guess.brokerage || "Your Brokerage";
      brk = {
        company_name: brokerageName,
        primary_contact: { name: guess.fullName },
      };
      contactName = guess.fullName;
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

    // Sender brand = represented developer (per-row → owner default → CITI Developer)
    const representedDeveloperName: string =
      (brk?.represented_developer_name && String(brk.represented_developer_name).trim()) ||
      (settings?.default_brokerage_sender_developer_name && String(settings.default_brokerage_sender_developer_name).trim()) ||
      "CITI Developer";

    // Brokerage outreach uses its OWN settings ONLY — never falls back to developer
    // (JBJ) settings, so brokerage emails are never accidentally sent as JBJ.
    const brkFromName: string =
      (settings?.brokerage_from_name && String(settings.brokerage_from_name).trim()) ||
      representedDeveloperName;
    const fromName = brkFromName;
    const replyTo = (
      body.fromEmailOverride ||
      settings?.brokerage_reply_to_email ||
      "jane@citideveloper.com"
    ).toString().trim();
    const brkActiveCc = Array.isArray(settings?.brokerage_active_cc_emails)
      ? settings.brokerage_active_cc_emails.filter(Boolean)
      : [];
    // Brokerage CC list is INDEPENDENT — never inherit developer/legacy CC,
    // so JBJ addresses never accidentally CC on a CITI Developer email.
    const ccList = body.ccEmailOverride
      ? String(body.ccEmailOverride).split(",").map((s: string) => s.trim()).filter(Boolean)
      : [...brkActiveCc];
    // Always CC info.jane@gmail.com so both inboxes stay in sync.
    const SECONDARY_CC = "info.jane@gmail.com";
    if (!ccList.some((c) => c.toLowerCase() === SECONDARY_CC)) {
      ccList.push(SECONDARY_CC);
    }
    const ccEmail = ccList[0] || "";
    // Test sends still get CCs (so the owner can verify the CC list is correct).
    const cc = ccList;

    // owner first name — defaults to "Jane" because the template is authored as Jane.
    // Hard-fallback to "Jane" if any source resolves to "JBJ" (legacy brand confusion).
    let ownerFirstName =
      firstName(settings?.brokerage_from_name as string | undefined) ||
      firstName(settings?.from_name) ||
      firstName((user.user_metadata as any)?.full_name as string | undefined) ||
      "Jane";
    if (/^jbj/i.test(ownerFirstName)) ownerFirstName = "Jane";

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

    // Booking URL: prefer the owner's Google Calendar appointment link so the
    // brokerage books directly on Google (auto confirmation email to both
    // sides, no website redirect). Fall back to the in-app booking page only
    // if the Google link is not configured.
    let bookingUrl: string = (
      (settings?.google_calendar_booking_url && String(settings.google_calendar_booking_url).trim()) ||
      ""
    );
    if (!bookingUrl) {
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
      reply_to: replyTo,
      reply_to_display: replyTo,
      reply_to_lower: replyTo,
      developer_website: "https://www.citidevelopers.com",
      developer_map: "https://maps.app.goo.gl/oK1Ts4Y3bsq8m3u18",
      developer_phone_display: "+971 54 716 7107",
      developer_phone_tel: "tel:+971547167107",
      whatsapp_url: "https://wa.me/971547167107",
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

    // If the stored template doesn't reference {{project_name}}, build a fallback
    // body so test sends and legacy templates still showcase the project picker.
    const refsProject = /\{\{\s*project_name\s*\}\}/.test(template.html + " " + template.subject);
    let html = renderTemplate(template.html, varsMap);
    let subjectRendered = renderTemplate(template.subject, varsMap);
    if (!refsProject) {
      subjectRendered = `${project.name} — Private Briefing & Breakfast for ${varsMap.brokerage_name}`;
      const offerBlock = project.offerHtml
        ? `<div style="margin:20px 0;padding:16px 18px;background:#F7F2EA;border:1px solid #B89555;border-radius:8px;font-size:13px;text-align:left">${project.offerHtml}</div>`
        : "";
      // Salutation: NEVER fall back to "your brokerage" — always use the resolved
      // brokerage name (Provident, Farm, etc.) so bulk sends stay personalized.
      const hasContactName = !!(pcRaw.name && String(pcRaw.name).trim());
      const salutation = hasContactName
        ? `Dear <strong>${varsMap.contact_first_name}</strong>,`
        : `Dear <strong>${varsMap.brokerage_name}</strong> team,`;
      // Champagne‑gold CTA (cream tile + ink text + 1px gold hairline — no yellow fill)
      const goldCta = (href: string, label: string) =>
        `<a href="${href}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;background:#EFE6D6;color:#1A1A1A;text-decoration:none;border-radius:12px;font-size:13px;font-weight:600;letter-spacing:0.3px;border:1px solid #B89555">${label}</a>`;
      html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F7F2EA;font-family:Inter,-apple-system,Segoe UI,Arial,sans-serif;color:#1A1A1A;line-height:1.6">
<div style="background:#F7F2EA;padding:48px 16px">
  <div style="max-width:640px;margin:0 auto;background:#FDFBF7;border:1px solid #B89555;border-radius:14px;padding:44px 44px;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
    <div style="text-align:center;padding-bottom:18px;border-bottom:1px solid #B89555;margin-bottom:28px">
      <div style="font-size:13px;letter-spacing:4px;text-transform:uppercase;color:#1A1A1A;font-weight:700">Greetings from ${representedDeveloperName}!</div>
      <div style="margin-top:6px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#1A1A1A99">Sales &amp; Training · Channel Partner Activation</div>
    </div>
    <p style="margin:0 0 16px;font-size:15px">${salutation}</p>
    <p style="margin:0 0 16px;font-size:14px">This is <strong>${ownerFirstName}</strong> from <strong>${representedDeveloperName}</strong>, Sales &amp; Training department. We'd like to invite <strong>${varsMap.brokerage_name}</strong> to a private briefing with ${representedDeveloperName}.</p>
    <p style="margin:0 0 16px;font-size:14px">${resolvedGroupLine}</p>

    <p style="margin:0 0 16px;font-size:14px">Could you also confirm whether <strong>${varsMap.brokerage_name}</strong> is <strong>already registered with ${representedDeveloperName}</strong>? If not, simply <strong>reply to this email</strong> and our <strong>Channel Partner Department</strong> will follow up with the registration documents to onboard <strong>${varsMap.brokerage_name}</strong> directly.</p>

    <p style="margin:0 0 24px;font-size:14px">If <strong>${varsMap.brokerage_name}</strong> already runs an internal <strong>WhatsApp group</strong> for project updates, please add me so I can keep your team posted on launches, inventory and commissions. If not, I'll create a dedicated WhatsApp group with your team.</p>

    <div style="margin:24px 0;padding:14px 16px;background:#F7F2EA;border:1px solid #B89555;border-radius:10px;font-size:13px;text-align:center;color:#1A1A1A">
      Please <strong>reply to this email</strong> at <strong>${replyTo}</strong> and CC <strong>info.jane@gmail.com</strong> so both inboxes stay in sync.
    </div>

    <div style="margin:28px 0;padding:28px 24px;background:#F7F2EA;border:1px solid #B89555;border-radius:12px;text-align:center">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:10px">Featured Project</div>
      <div style="font-size:26px;font-weight:600;color:#1A1A1A;margin-bottom:10px;letter-spacing:1px">${project.name}</div>
      <div style="font-size:14px;color:#1A1A1A;margin:0 auto 22px;max-width:460px">${project.tagline}</div>
      ${goldCta(project.url, `Open ${project.name} e‑catalogue &rarr;`)}
    </div>
    ${offerBlock}
    <div style="margin:28px 0;padding:28px;background:#FDFBF7;border:1px solid #B89555;border-radius:14px">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:8px">Private Invitation</div>
      <div style="font-size:18px;font-weight:600;margin-bottom:10px">Partnership Briefing &amp; Breakfast</div>
      <p style="margin:0 0 14px;font-size:14px">I'd like to invite <strong>${varsMap.brokerage_name}</strong> to a private breakfast at our Dubai office — exclusive for your company. Agenda covers ${project.name}, commissions, sales training and channel partner activation.</p>
      <div style="margin:14px 0;padding:16px 18px;background:#F7F2EA;border:1px solid #B89555;border-radius:10px;font-size:13px">
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:8px">Please Confirm</div>
        <ul style="margin:0;padding-left:18px">
          <li style="margin-bottom:6px">The <strong>names of attendees</strong> from ${varsMap.brokerage_name} (optional — you may also just give a head‑count).</li>
          <li style="margin-bottom:6px">The <strong>number of brokers</strong> attending and the <strong>total members</strong> joining the breakfast.</li>
          <li style="margin-bottom:6px">A <strong>date and time that suits ${varsMap.brokerage_name}</strong> — any slot from <strong>Monday to Friday</strong>, between <strong>11:00 and 17:00</strong> Dubai time.</li>
          <li>Use the button below to <strong>book your slot directly on our calendar</strong> — you'll see live availability and receive an instant confirmation.</li>
        </ul>
      </div>
      ${bookingUrl ? `<div style="text-align:center;margin-top:20px">${goldCta(bookingUrl, `Reserve a seat for ${varsMap.brokerage_name} &rarr;`)}</div>` : ""}
    </div>
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #B8955540;font-size:13px">
      Warm regards,<br/><strong>${ownerFirstName} Bou Jaoude</strong> — Sales &amp; Training, Channel Partner Activation<br/>
      <span style="color:#1A1A1A">${representedDeveloperName} · Sales &amp; Experience Center, Dubai</span><br/>
      <a href="tel:+971547167107" style="color:#1A1A1A;text-decoration:none">+971 54 716 7107</a> ·
      <a href="mailto:${replyTo}" style="color:#1A1A1A;text-decoration:none;border-bottom:1px solid #B89555">${replyTo}</a><br/>
      <a href="https://maps.app.goo.gl/oK1Ts4Y3bsq8m3u18" target="_blank" rel="noopener" style="color:#1A1A1A99;text-decoration:none;font-size:12px">View office location on map &rarr;</a>
    </div>
  </div>
  <div style="max-width:640px;margin:16px auto 0;text-align:center;font-size:11px;color:#1A1A1A66">${representedDeveloperName} · Sales &amp; Training · Channel Partner Activation</div>
</div>
</body></html>`;
    }
    const subject = subjectRendered;

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
