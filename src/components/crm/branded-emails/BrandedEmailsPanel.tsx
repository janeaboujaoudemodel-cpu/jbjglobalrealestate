/**
 * BrandedEmailsPanel
 *
 * In-place Sheet panel — Template · Audience · Preview · Send. Audience tab
 * shows the full recipient list with logos and per-row checkboxes; Send tab
 * has NO duplicate audience block and includes an inline mini-preview of the
 * currently selected template.
 */
import { useEffect, useMemo, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, Loader2, Search, Users, Send, Eye, FileText, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { getWebsiteLogoFallbackUrl, isValidDeveloperLogoUrl } from "@/utils/developerLogo";
import jbjMonogramCropped from "@/assets/jbj-monogram-cropped.png";

export type BrandedAudienceKind = "developers" | "brokerages";

type Recipient = {
  id: string;
  catalogDeveloperId?: string;
  name: string;
  email: string | null;
  meta?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  registrationStatus?: string | null;
};

type Template = {
  variant: "developer_registration" | "developer_confirm_registered" | "brokerage_partnership_intro" | "brokerage_breakfast_invite";
  name: string;
  subject: string;
  html: string;
  category: string | null;
};

const DEVELOPER_SENDER = {
  name: "Amelia",
  title: "Head of Business Development",
  email: "helpdesk@jbj.ae",
};

const SENDER_BY_KIND: Record<BrandedAudienceKind, typeof DEVELOPER_SENDER> = {
  developers: {
    name: "Amelia",
    title: "Head of Business Development",
    email: "helpdesk@jbj.ae",
  },
  brokerages: {
    name: "Jane Bou Jaoude",
    title: "CITI Developers · Sales & Training Department",
    email: "infoo.jane@gmail.com",
  },
};

const DELIVERY_BY_KIND: Record<BrandedAudienceKind, { fromName: string; fromEmail: string; replyTo: string; dailyCapLabel: string }> = {
  developers: {
    fromName: "Amelia — JBJ GLOBAL REAL ESTATE",
    fromEmail: "helpdesk@jbj.ae",
    replyTo: "helpdesk@jbj.ae",
    dailyCapLabel: "Developer sends use the connected mailbox; test sends use the verified app email path.",
  },
  brokerages: {
    fromName: "CITI Developers · Sales & Training Department",
    fromEmail: "partnerships@maisonjane.ae",
    replyTo: "infoo.jane@gmail.com",
    dailyCapLabel: "Current verified Resend path is capped at 100 emails/day and 2 emails/second.",
  },
};

const CITI_PHONE_DISPLAY = "+971 54 716 7107";
const CITI_PHONE_TEL = "tel:+971547167107";
const CITI_WHATSAPP_URL = "https://wa.me/971547167107";
const CITI_WEBSITE_URL = "https://citideveloper.com";
const CITI_MAP_URL = "https://www.google.com/maps/search/?api=1&query=CITI%20Developers%20Sales%20Gallery%20Dubai";
const CITI_OFFICE_LABEL = "CITI Developers Sales Gallery";

const REGISTRATION_PACKAGE_LINK = "https://drive.google.com/drive/folders/1EsWVmAPv6ljBzWbWNAvv07EQrHwi5drS?usp=sharing";

const BRAND_HEADER_BY_KIND: Record<BrandedAudienceKind, { url: string; appUrl: string; alt: string; wordmark: string; tagline: string; width: number; height: number }> = {
  developers: {
    url: "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/brand%2Fjbj-monogram-cropped.png",
    appUrl: jbjMonogramCropped,
    alt: "JBJ Global Real Estate",
    wordmark: "JBJ GLOBAL REAL ESTATE",
    tagline: "Developer Relations",
    width: 78,
    height: 100,
  },
  brokerages: {
    url: "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/brand/citi-developers-gold.png",
    appUrl: "/citi-developers-logo-transparent.png",
    alt: "Citi Developers",
    wordmark: "CITI DEVELOPERS",
    tagline: "Brokerage Partnerships",
    width: 164,
    height: 38,
  },
};

function buildBrandHeaderHtml(kind: BrandedAudienceKind): string {
  const b = BRAND_HEADER_BY_KIND[kind];
  return `<table role="presentation" data-jbj-brand-header="true" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#ffffff;">
  <tr><td align="center" style="padding:22px 16px 18px;background:#ffffff;border-bottom:1px solid rgba(184,149,85,0.4);">
    <img src="${b.url}" alt="${b.alt}" width="${b.width}" height="${b.height}" style="display:block;width:${b.width}px;height:${b.height}px;max-width:${b.width}px;margin:0 auto 10px;object-fit:contain;" />
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;letter-spacing:0.22em;color:#0F1A16;text-transform:uppercase;">${b.wordmark}</div>
    <div style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.28em;color:#B89555;text-transform:uppercase;margin-top:4px;">${b.tagline}</div>
  </td></tr>
</table>`;
}

const recipientsCache = new Map<BrandedAudienceKind, Recipient[]>();
const templatesCache = new Map<BrandedAudienceKind, Template[]>();
const inflightCache = new Map<BrandedAudienceKind, Promise<[Recipient[], Template[]]>>();

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: BrandedAudienceKind;
};

const TEMPLATE_META: Record<Template["variant"], { name: string; category: string }> = {
  developer_registration: { name: "Developer · Registration", category: "Developer" },
  developer_confirm_registered: { name: "Developer · Registration Follow-up", category: "Developer" },
  brokerage_partnership_intro: { name: "Brokerage · Registration", category: "Brokerage" },
  brokerage_breakfast_invite: { name: "Brokerage · Breakfast Briefing", category: "Brokerage" },
};

const DEVELOPER_VARIANTS: Template["variant"][] = [
  "developer_registration",
  "developer_confirm_registered",
];
const BROKERAGE_VARIANTS: Template["variant"][] = [
  "brokerage_partnership_intro",
  "brokerage_breakfast_invite",
];

function extractFirstEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0]?.trim().toLowerCase() || null;
}

function isCitiRecipient(r: Pick<Recipient, "name">): boolean {
  const n = (r.name || "").toLowerCase();
  return /\bciti\b/.test(n) || /\bcity\s+developers?\b/.test(n);
}

async function loadRecipients(kind: BrandedAudienceKind): Promise<Recipient[]> {
  if (kind === "developers") {
    const { data, error } = await (supabase as any)
      .from("developers")
      .select("id, name, slug, admin_email, logo_url, website_url, registration_status, group_status, excel_order")
      .or("is_hidden.is.null,is_hidden.eq.false")
      .order("excel_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true })
      .limit(1000);
    if (error) throw error;

    return (data ?? []).map((r: any) => ({
      id: String(r.id),
      catalogDeveloperId: String(r.id),
      name: r.name || "Developer",
      email: extractFirstEmail(r.admin_email),
      meta: r.website_url || r.group_status || null,
      logoUrl: r.logo_url || null,
      websiteUrl: r.website_url || null,
      registrationStatus: r.registration_status || "not_registered",
    }));
  }
  const PAGE_SIZE = 1000;
  const { count, error: countError } = await (supabase as any)
    .from("crm_brokerages")
    .select("id", { count: "exact", head: true });
  if (countError) throw countError;
  const total = Number(count ?? 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const chunks = await Promise.all(
    Array.from({ length: pages }, (_, page) => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      return (supabase as any)
        .from("crm_brokerages")
        .select("id, company_name, email, emirate")
        .order("company_name")
        .range(from, to);
    })
  );
  const firstError = chunks.find((chunk: any) => chunk.error)?.error;
  if (firstError) throw firstError;
  const rows = chunks.flatMap((chunk: any) => chunk.data ?? []);
  return rows.map((r: any) => ({
    id: String(r.id),
    name: r.company_name || "Brokerage",
    email: r.email || null,
    meta: r.emirate || null,
    logoUrl: null,
  }));
}

function isDeveloperRegistrationCampaign(kind: BrandedAudienceKind, template: Template | null | undefined) {
  return kind === "developers" && template?.variant === "developer_registration";
}

async function loadTemplates(kind: BrandedAudienceKind): Promise<Template[]> {
  const allowed = kind === "developers" ? DEVELOPER_VARIANTS : BROKERAGE_VARIANTS;

  const { data, error } = await (supabase as any)
    .from("crm_email_templates")
    .select("variant, subject, html, updated_at")
    .in("variant", allowed)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  const byVariant = new Map<string, any>();
  for (const row of data ?? []) {
    if (!byVariant.has(row.variant)) byVariant.set(row.variant, row);
  }

  return allowed
    .map((variant) => {
      const row = byVariant.get(variant);
      if (!row) return null;
      const meta = TEMPLATE_META[variant];
      return {
        variant,
        name: meta.name,
        subject: row.subject,
        html: row.html,
        category: meta.category,
      } satisfies Template;
    })
    .filter((t): t is Template => Boolean(t));
}

async function loadBrandedEmailData(kind: BrandedAudienceKind): Promise<[Recipient[], Template[]]> {
  const cachedRecipients = recipientsCache.get(kind);
  const cachedTemplates = templatesCache.get(kind);
  if (cachedRecipients && cachedTemplates) return [cachedRecipients, cachedTemplates];

  const inflight = inflightCache.get(kind);
  if (inflight) return inflight;

  const promise = Promise.all([loadRecipients(kind), loadTemplates(kind)])
    .then(([r, t]) => {
      recipientsCache.set(kind, r);
      templatesCache.set(kind, t);
      return [r, t] as [Recipient[], Template[]];
    })
    .finally(() => inflightCache.delete(kind));
  inflightCache.set(kind, promise);
  return promise;
}

export function preloadBrandedEmailsData(kind: BrandedAudienceKind) {
  loadBrandedEmailData(kind).catch(() => undefined);
}

function stripHtml(html: string) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function personalizeTemplate(html: string, sampleName = "Recipient Developer Name", audienceKind: BrandedAudienceKind = "developers", bookingUrl = "") {
  const sender = SENDER_BY_KIND[audienceKind];
  const jbjLink = '<a href="https://jbj.ae" target="_blank" rel="noreferrer" style="color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;font-weight:700;text-decoration:underline;text-decoration-color:#B89555;">JBJ.AE</a>';
  const senderMailLink = `<a href="mailto:${sender.email}" style="color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;font-weight:700;text-decoration:underline;text-decoration-color:#B89555;">${sender.email.toUpperCase()}</a>`;
  const senderMailToken = "__JBJ_SENDER_MAIL_LINK__";
  const brandHeader = buildBrandHeaderHtml(audienceKind);
  const htmlWithBrand = /data-jbj-brand-header="true"/.test(html)
    ? html
    : (html.match(/<body[^>]*>/i)
        ? html.replace(/<body([^>]*)>/i, (_m, attrs) => `<body${attrs}>${brandHeader}`)
        : brandHeader + html);
  return htmlWithBrand
    .replace(/<style>[\s\S]*?<\/style>/i, (styleBlock) => `${styleBlock}<style>
      [data-jbj-contact-note], [data-jbj-contact-note] *, [data-jbj-contact-note] a {
        color:#0a0a0a !important;
        -webkit-text-fill-color:#0a0a0a !important;
        opacity:1 !important;
      }
      .citi-booking-cta:hover, .citi-booking-cta:hover * {
        background:#EFE6D6 !important;
        color:#0a0a0a !important;
        -webkit-text-fill-color:#0a0a0a !important;
        border-color:#B89555 !important;
      }
    </style>`)
    .replace(/\{\{developer_name\}\}/g, sampleName)
    .replace(/\{\{brokerage_name\}\}/g, sampleName)
      .replace(/\{\{salutation\}\}/g, sampleName)
      .replace(/\{\{contact_first_name\}\}/g, "Team")
      .replace(/\{\{contact_full_name\}\}/g, sampleName)
      .replace(/\{\{owner_first_name\}\}/g, "Jane")
      .replace(/\{\{project_name\}\}/g, "AMRA")
      .replace(/\{\{project_tagline\}\}/g, "Wellness-led beachfront resort residences in Umm Al Quwain — our current launch focus.")
      .replace(/\{\{project_url\}\}/g, "https://citideveloper.com/e-catalogue/amra")
      .replace(/\{\{booking_url\}\}/g, bookingUrl || "#calendar-booking-url-not-configured")
      .replace(/\{\{owner_full_name\}\}/g, "Jane Bou Jaoude")
      .replace(/\{\{developer_phone_display\}\}/g, CITI_PHONE_DISPLAY)
      .replace(/\{\{developer_phone_tel\}\}/g, CITI_PHONE_TEL)
      .replace(/\{\{whatsapp_url\}\}/g, CITI_WHATSAPP_URL)
      .replace(/\{\{developer_website\}\}/g, CITI_WEBSITE_URL)
      .replace(/\{\{developer_map\}\}/g, CITI_MAP_URL)
      .replace(/\{\{office_location\}\}/g, CITI_OFFICE_LABEL)
      .replace(/\{\{group_status_line\}\}/g, "We would love to formalise a partnership with your team and align on how CITI Developers can support your brokers on AMRA and upcoming launches.")
    .replace(/\{\{registration_package_link\}\}/g, REGISTRATION_PACKAGE_LINK)
      .replace(/\{\{drive_url\}\}/g, REGISTRATION_PACKAGE_LINK)
    .replace(/\{\{reply_to_lower\}\}/g, sender.email)
    .replace(/\{\{reply_to_display\}\}/g, sender.email.toUpperCase())
    .replace(/\{\{reply_to\}\}/g, sender.email)
      .replace(/https?:\/\/(?:www\.)?citidevelopers\.com/gi, CITI_WEBSITE_URL)
      .replace(/\bwww\.citidevelopers\.com\b/gi, "citideveloper.com")
      .replace(/\bcitidevelopers\.com\b/gi, "citideveloper.com")
      .replace(/Jane Bou Jaoude/gi, sender.name)
      .replace(/Jane Bujold/gi, sender.name)
      .replace(/<strong>Jane<\/strong>(\s*&middot;\s*Sales)/gi, `<strong>${sender.name}</strong>$1`)
    .replace(/Founder\s*&\s*CEO/gi, sender.title)
    .replace(/<a\b[^>]*href=["']mailto:(?:contact|info|helpdesk)@jbj\.ae(?:\?[^"']*)?["'][^>]*>[\s\S]*?<\/a>/gi, senderMailToken)
    .replace(/\b(?:contact|info|helpdesk)@jbj\.ae\b/gi, senderMailToken)
    .replace(new RegExp(senderMailToken, "g"), senderMailLink)
    .replace(/<a\b(?![^>]*\btarget=)([^>]*\bhref=["']https?:\/\/drive\.google\.com[^>]*>)/gi, '<a target="_blank" rel="noopener noreferrer" $1')
    .replace(/<a\b(?![^>]*\btarget=)([^>]*\bhref=["']https?:\/\/[^>]*>)/gi, '<a target="_blank" rel="noopener noreferrer" $1')
    .replace(/<b>JBJ<\/b>\.AE/gi, jbjLink)
    .replace(/>JBJ\.AE</gi, `>${jbjLink}<`)
    .replace(/>jbj\.ae</gi, `>${jbjLink}<`)
    .replace(/Dear\s+<strong>[^<]+<\/strong>\s+Broker Relations Team/gi, `Dear <strong>${sampleName}</strong> Broker Relations Team`)
    .replace(/Dear\s+[^,<\n]+\s+Broker Relations Team/gi, `Dear ${sampleName} Broker Relations Team`)
    .replace(/Dear\s+<strong>[^<]+<\/strong>\s+team/gi, `Dear <strong>${sampleName}</strong> team`)
    .replace(/Dear\s+(?:4\s*Direction|Four\s+Directions?)[^,<]*(?=,)/gi, `Dear ${sampleName}`)
    .replace(/<div([^>]*style=(['"])(?=[^'"]*background:#FAF5EA)([^'"]*)\2[^>]*)>/gi, (match, attrs) => {
      const withMarker = attrs.includes("data-jbj-contact-note") ? attrs : ` data-jbj-contact-note="true"${attrs}`;
      return `<div${withMarker.replace(/style=(['"])([^'"]*)\1/i, (_styleMatch, quote, styleValue) => `style=${quote}${styleValue};color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;${quote}`)}>`;
    })
    .replace(/City Developer/gi, "CITI Developers")
    .replace(/background:#064E3B/gi, "background:#064E3B;background-image:linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%)")
    .replace(/JBJ Global Real Estate/g, "JBJ GLOBAL REAL ESTATE");
}

function personalizeSubject(subject: string, sampleName = "Recipient Developer Name") {
  return subject
    .replace(/\{\{developer_name\}\}/g, sampleName)
    .replace(/\{\{brokerage_name\}\}/g, sampleName)
      .replace(/\{\{project_name\}\}/g, "Citi Developer")
    .replace(/jbj\.ae/gi, "JBJ.AE")
    .replace(/JBJ Global Real Estate/g, "JBJ GLOBAL REAL ESTATE");
}

function displayNameFromEmail(email: string, fallback: string) {
  const normalized = email.trim().toLowerCase();
  if (normalized === "infoo.jane@gmail.com") return "Jane";
  const local = normalized.split("@")[0] || "";
  const cleaned = local
    .replace(/\+.*$/, "")
    .replace(/[._\-0-9]+/g, " ")
    .trim();
  if (!cleaned) return fallback;
  return cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "?";
}

function AudienceLogo({ recipient }: { recipient: Recipient }) {
  const fallbackLogoUrl = getWebsiteLogoFallbackUrl(recipient.websiteUrl);
  const logoUrl = isValidDeveloperLogoUrl(recipient.logoUrl) ? recipient.logoUrl : fallbackLogoUrl;
  const hasLogo = isValidDeveloperLogoUrl(logoUrl);

  if (hasLogo) {
    return (
      <DeveloperLogo
        src={logoUrl}
        alt={`${recipient.name} logo`}
        name={recipient.name}
        websiteUrl={recipient.websiteUrl}
        variant="bare"
        className="!size-10 !rounded-md !border-0 !bg-white !p-2 shadow-none ring-1 ring-[#064E3B]/15 [&_img]:!object-contain [&_img]:!max-h-full [&_img]:!max-w-full"
      />
    );
  }

  return (
    <span
      data-branded-email-fallback-logo="true"
      data-no-contrast-guard="true"
      className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border-0 shadow-none ring-1 ring-[#064E3B]/20"
      style={{ background: "linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
      aria-label={`${recipient.name} logo unavailable`}
      title={recipient.name}
    >
      <Building2 className="size-4" aria-hidden="true" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
    </span>
  );
}

async function getInvokeErrorMessage(error: any) {
  if (error instanceof FunctionsHttpError) {
    try {
      const text = await error.context.text();
      const parsed = JSON.parse(text);
      return parsed?.message || parsed?.error || text || error.message;
    } catch {
      return error.message;
    }
  }
  return error?.message || "unknown error";
}

export default function BrandedEmailsPanel({ open, onOpenChange, kind }: Props) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [audienceSearch, setAudienceSearch] = useState("");
  const [testEmail, setTestEmail] = useState("infoo.jane@gmail.com");
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [unlockedCitiIds, setUnlockedCitiIds] = useState<Set<string>>(new Set());
  const [previouslySentEmails, setPreviouslySentEmails] = useState<Set<string>>(new Set());
  const [bookingUrl, setBookingUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const cachedRecipients = recipientsCache.get(kind);
    const cachedTemplates = templatesCache.get(kind);
    if (cachedRecipients && cachedTemplates) {
      setRecipients(cachedRecipients);
      setTemplates(cachedTemplates);
    }
    const hasCurrentData = (cachedRecipients?.length || recipients.length) > 0 && (cachedTemplates?.length || templates.length) > 0;
    setLoading(!hasCurrentData);
    setLoadError(null);
    loadBrandedEmailData(kind)
      .then(([r, t]) => {
        if (cancelled) return;
        setRecipients(r);
        setTemplates(t);
        const nextTemplateId = t.some((x) => x.variant === selectedTemplateId) ? selectedTemplateId : t[0]?.variant ?? null;
        setSelectedTemplateId(nextTemplateId);
        const firstTemplate = t.find((x) => x.variant === nextTemplateId) ?? t[0] ?? null;
        const baseAudience = isDeveloperRegistrationCampaign(kind, firstTemplate)
          ? r.filter((x) => x.registrationStatus !== "registered")
          : r;
        // Citi/City developers are locked-out by default per owner rule.
        const defaultAudience = baseAudience.filter((x) => !isCitiRecipient(x));
        setSelectedIds(new Set(defaultAudience.map((x) => x.id)));
        setUnlockedCitiIds(new Set());
      })
      .catch((e) => {
        if (cancelled) return;
        const message = e?.message || "Could not load templates and audience.";
        setLoadError(message);
        toast.error(message);
        setRecipients([]);
        setTemplates([]);
        setSelectedIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, kind]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("crm_owner_settings")
        .select("google_calendar_booking_url")
        .maybeSingle();
      if (!cancelled) setBookingUrl(String(data?.google_calendar_booking_url || "").trim());
    })().catch(() => {
      if (!cancelled) setBookingUrl("");
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.variant === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  useEffect(() => {
    if (!open || !selectedTemplate) return;
    let cancelled = false;
    const entityType = kind === "developers" ? "developer_registry" : "brokerage";
    (async () => {
      const { data } = await (supabase as any)
        .from("crm_relationship_email_log")
        .select("to_emails, direction, entity_type, created_at")
        .eq("direction", "outbound")
        .eq("entity_type", entityType)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (cancelled) return;
      const sent = new Set<string>();
      for (const row of data ?? []) {
        const to = Array.isArray(row.to_emails) ? row.to_emails : [];
        for (const email of to) {
          const normalized = String(email || "").trim().toLowerCase();
          if (normalized) sent.add(normalized);
        }
      }
      setPreviouslySentEmails(sent);
    })().catch(() => {
      if (!cancelled) setPreviouslySentEmails(new Set());
    });
    return () => {
      cancelled = true;
    };
  }, [open, kind, selectedTemplate?.variant]);

  const filteredRecipients = useMemo(() => {
    const q = audienceSearch.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter((r) => r.name.toLowerCase().includes(q));
  }, [audienceSearch, recipients]);

  const campaignRecipients = useMemo(
    () => isDeveloperRegistrationCampaign(kind, selectedTemplate)
      ? recipients.filter((r) => r.registrationStatus !== "registered")
      : recipients,
    [kind, recipients, selectedTemplate]
  );
  const total = campaignRecipients.length;
  const audienceCount = selectedIds.size;
  const lockedCitiCount = useMemo(
    () => campaignRecipients.filter((r) => isCitiRecipient(r) && !unlockedCitiIds.has(r.id)).length,
    [campaignRecipients, unlockedCitiIds]
  );
  const eligibleRecipients = useMemo(
    () => {
      // Exclude Citi/City developers unless explicitly unlocked, and exclude
      // recipients who already have a sent outreach log so bulk sends don't repeat.
      return campaignRecipients.filter((r) => {
        const alreadySent = !!r.email && previouslySentEmails.has(r.email.toLowerCase().trim());
        return !alreadySent && (!isCitiRecipient(r) || unlockedCitiIds.has(r.id));
      });
    },
    [campaignRecipients, unlockedCitiIds, previouslySentEmails]
  );
  const previouslySentCount = useMemo(
    () => campaignRecipients.filter((r) => !!r.email && previouslySentEmails.has(r.email.toLowerCase().trim())).length,
    [campaignRecipients, previouslySentEmails]
  );
  const eligibleTotal = eligibleRecipients.length;
  const allSelected = audienceCount === eligibleTotal && eligibleTotal > 0;
  const previewRecipient = useMemo(
    () => recipients.find((r) => selectedIds.has(r.id)) || recipients[0] || null,
    [recipients, selectedIds]
  );
  const previewRecipientName = previewRecipient?.name || (kind === "developers" ? "Recipient Developer Name" : "Recipient Brokerage Name");
  const previewPersonalizationName = kind === "developers" ? "Recipient Developer Name" : "Recipient Brokerage Name";
  const sender = SENDER_BY_KIND[kind];
  const delivery = DELIVERY_BY_KIND[kind];
  const activeBrand = BRAND_HEADER_BY_KIND[kind];
  const sendCap = kind === "brokerages" ? 100 : null;
  const selectedSendableCount = useMemo(
    () => recipients.filter((r) => selectedIds.has(r.id) && r.email?.trim()).length,
    [recipients, selectedIds]
  );

  useEffect(() => {
    const eligible = new Set(eligibleRecipients.map((r) => r.id));
    setSelectedIds((current) => new Set([...current].filter((id) => eligible.has(id))));
  }, [eligibleRecipients]);

  const toggleId = (id: string) =>
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAll = () => setSelectedIds(new Set(eligibleRecipients.map((r) => r.id)));
  const clearAll = () => setSelectedIds(new Set());

  const handleSendTest = async () => {
    if (!selectedTemplate) {
      toast.error("Pick a template first");
      return;
    }
    if (!testEmail.trim()) {
      toast.error("Enter a test email address");
      return;
    }
    setSending(true);
    try {
      const sampleName = displayNameFromEmail(
        testEmail.trim(),
        kind === "developers" ? "Test Recipient" : "Test Brokerage",
      );
      const functionName = kind === "developers" ? "crm-send-developer-registration" : "crm-send-brokerage-outreach";
      const body = kind === "developers"
        ? { variant: selectedTemplate.variant, testRecipient: testEmail.trim(), testDeveloperName: sampleName, subjectOverride: personalizeSubject(selectedTemplate.subject, sampleName) }
        : { variant: selectedTemplate.variant, testRecipient: testEmail.trim(), testBrokerageName: sampleName, subjectOverride: personalizeSubject(selectedTemplate.subject, sampleName) };
      const { error, data } = await (supabase as any).functions.invoke(functionName, { body });
      if (error) throw new Error(await getInvokeErrorMessage(error));
      if (data?.error) throw new Error(data.message || data.error);
      const idNote = data?.messageId ? ` · ID ${data.messageId}` : "";
      toast.success(`Test accepted for ${testEmail} — template "${selectedTemplate.name}"${idNote}`);
    } catch (e: any) {
      toast.error(`Test send failed: ${e?.message || "unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  const handleSendLive = async () => {
    if (!selectedTemplate) {
      toast.error("Pick a template first");
      return;
    }
    if (audienceCount === 0) {
      toast.error("Empty audience — select recipients first");
      return;
    }
    if (sendCap && selectedSendableCount > sendCap) {
      toast.error(`Select ${sendCap} or fewer brokerages for one send. Current verified path allows 100 emails/day.`);
      return;
    }
    const ok = window.confirm(
      `Send "${selectedTemplate.name}" live to ${selectedSendableCount} ${kind}?\n\nFrom: ${delivery.fromName} <${delivery.fromEmail}>\nReply-To: ${delivery.replyTo}\nThis action is logged.`
    );
    if (!ok) return;
    const selectedRecipients = recipients.filter((r) => {
      const email = r.email?.toLowerCase().trim();
      return selectedIds.has(r.id) && email && !previouslySentEmails.has(email);
    });
    setSending(true);
    let sentCount = 0;
    try {
      for (const r of selectedRecipients) {
        const functionName = kind === "developers" ? "crm-send-developer-registration" : "crm-send-brokerage-outreach";
        const body = kind === "developers"
          ? { catalogDeveloperId: r.catalogDeveloperId ?? r.id, variant: selectedTemplate.variant, overrideEmail: r.email, silent: true }
          : { brokerageId: r.id, variant: selectedTemplate.variant, overrideEmail: r.email, silent: true };
        const { error, data } = await (supabase as any).functions.invoke(functionName, { body });
        if (error) throw new Error(await getInvokeErrorMessage(error));
        if (data?.error) throw new Error(data.message || data.error);
        sentCount += 1;
      }
      toast.success(`Sent ${sentCount} ${kind} for "${selectedTemplate.name}".`);
    } catch (e: any) {
      toast.error(`Live send stopped after ${sentCount} sent: ${e?.message || "unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        data-branded-email-panel="true"
        data-no-contrast-guard="true"
        aria-describedby={undefined}
        className="w-full sm:max-w-6xl p-0 flex flex-col bg-white border-l-0 rounded-l-2xl shadow-[-24px_0_60px_-30px_rgba(6,78,59,0.35)] overflow-hidden"
      >
        <SheetHeader className="px-6 py-4 border-b border-emerald-900/10 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="inline-grid place-items-center size-14 shrink-0 rounded-md border border-emerald-900/15 bg-white p-2 shadow-[0_8px_18px_-14px_rgba(6,78,59,0.45)]">
              <img
                src={activeBrand.appUrl}
                alt={activeBrand.alt}
                className="block h-full w-full object-contain"
                style={{ display: "block", margin: "0 auto" }}
                data-no-fallback
                loading="eager"
                decoding="async"
              />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] font-black text-[#064E3B]">
                {kind === "developers" ? "Developer Portal · Campaigns" : "Brokerage Portal · Campaigns"}
              </p>
              <SheetTitle className="text-xl font-black text-[#0F1A16]">Branded Emails</SheetTitle>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-[#4B5D55]">
              <Users className="size-4" />
              Sending to <strong className="text-[#0F1A16]">{audienceCount}</strong> of {total.toLocaleString()} {kind}
              {lockedCitiCount > 0 && <span className="font-semibold text-[#064E3B]">· {lockedCitiCount} locked</span>}
              {previouslySentCount > 0 && <span className="font-semibold text-[#064E3B]">· {previouslySentCount} already sent</span>}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-6 py-5">
          <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-5 items-start">
          <div className="space-y-5">
          {/* STEP 1 · TEMPLATE */}
          <section>
            <StepHeader n={1} label="Template" Icon={FileText} />
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[#4B5D55]"><Loader2 className="size-4 animate-spin" /> Loading templates…</div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center text-[#4B5D55] border border-dashed border-emerald-900/20 rounded-lg">
                No templates configured for this audience.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {templates.map((t) => {
                    const active = t.variant === selectedTemplateId;
                  return (
                    <button
                      key={t.variant}
                      type="button"
                      onClick={() => setSelectedTemplateId(t.variant)}
                        data-branded-email-template-card={active ? "active" : "inactive"}
                      className="group relative overflow-hidden rounded-lg border p-0 text-left transition-colors"
                      style={{
                        borderColor: active ? "rgba(184,149,85,0.72)" : "rgba(6,78,59,0.16)",
                        background: active ? "#F8F3E9" : "#FFFFFF",
                        boxShadow: active ? "inset 0 0 0 1px rgba(184,149,85,0.45)" : "none",
                      }}
                    >
                      <div className="grid h-[96px] grid-cols-[112px_1fr] group-hover:bg-[#F8F3E9]">
                        <div className="flex items-center justify-center border-r px-3 py-3" style={{ borderColor: "rgba(184,149,85,0.28)", background: active ? "#EFE5D3" : "#FAF8F3" }}>
                          <span className="text-center text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-[#064E3B]">{t.category || "Template"}</span>
                        </div>
                        <div className="min-w-0 p-3 pr-24 flex flex-col justify-center">
                          <p className="font-black leading-tight text-[#0F1A16] break-words">{t.name}</p>
                          <p className="mt-1 line-clamp-2 break-words text-xs text-[#4B5D55]">{personalizeSubject(t.subject, previewPersonalizationName)}</p>
                        </div>
                      </div>
                      {active && (
                        <Badge className="absolute top-2 right-2 border text-[10px] font-black" style={{ background: "#064E3B", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", borderColor: "#064E3B" }}>
                          Selected
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* STEP 2 · AUDIENCE */}
          <section>
            <StepHeader n={2} label="Audience" Icon={Users} />
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                type="button"
                onClick={selectAll}
                style={{
                  padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                  background: allSelected ? "#064E3B" : "#FFFFFF",
                  color: allSelected ? "#FFFFFF" : "#064E3B",
                  WebkitTextFillColor: allSelected ? "#FFFFFF" : "#064E3B",
                  border: `1px solid ${allSelected ? "#064E3B" : "rgba(6,78,59,0.4)"}`,
                  whiteSpace: "nowrap",
                }}
              >
                {allSelected ? `All ${eligibleTotal} eligible selected` : `Select all eligible (${eligibleTotal})`}
              </button>
              <button
                type="button"
                onClick={clearAll}
                style={{
                  padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                  background: "#FFFFFF", color: "#064E3B",
                  WebkitTextFillColor: "#064E3B",
                  border: "1px solid rgba(6,78,59,0.4)",
                  whiteSpace: "nowrap",
                }}
              >
                Clear
              </button>
              <div className="relative flex-1 min-w-[220px]">
                    <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#064E3B]" />
                <Input
                  type="text"
                  value={audienceSearch}
                  onChange={(e) => setAudienceSearch(e.target.value)}
                  placeholder={`Search ${kind === "developers" ? "developers" : "brokerages"}…`}
                  className="pl-9 !bg-white !text-[#0F1A16] placeholder:!text-[#4B5D55] border-emerald-900/20"
                />
              </div>
              <span className="text-xs text-[#4B5D55] ml-auto">
                <strong className="text-[#0F1A16]">{audienceCount.toLocaleString()}</strong> selected of {total.toLocaleString()} total
                {lockedCitiCount > 0 && <span className="font-semibold text-[#064E3B]"> · {lockedCitiCount} locked</span>}
                {previouslySentCount > 0 && <span className="font-semibold text-[#064E3B]"> · {previouslySentCount} already sent</span>}
              </span>
            </div>

            <div className="border border-emerald-900/15 rounded-lg overflow-hidden bg-white">
            {loadError ? (
              <div className="p-8 text-center text-[#7A1F1F] border border-dashed border-red-900/20 rounded-lg bg-red-50">
                {loadError}
              </div>
            ) : loading ? (
                <div className="p-6 flex items-center gap-2 text-sm text-[#4B5D55]"><Loader2 className="size-4 animate-spin" /> Loading audience…</div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <ul className="divide-y divide-emerald-900/5">
                    {filteredRecipients.slice(0, 350).map((r) => {
                      const checked = selectedIds.has(r.id);
                      const isCiti = isCitiRecipient(r);
                      const alreadySent = !!r.email && previouslySentEmails.has(r.email.toLowerCase().trim());
                      const locked = (isCiti && !unlockedCitiIds.has(r.id)) || alreadySent;
                      return (
                        <li key={r.id}>
                          <label
                            data-recipient-selected={checked ? "true" : undefined}
                            data-recipient-locked={locked ? "true" : undefined}
                            className={`flex items-center gap-3 px-3 py-2 ${locked ? "cursor-default" : "cursor-pointer"}`}
                            style={{ backgroundColor: checked ? "rgba(6,78,59,0.035)" : "#FFFFFF", opacity: locked ? 0.6 : 1 }}
                          >
                            {locked ? (
                              <span
                                aria-label={alreadySent ? "Already sent — excluded from this campaign" : "Locked — Citi developers excluded by default"}
                                title={alreadySent ? "Already sent — excluded from this campaign" : "Locked — click unlock to include in this campaign"}
                                className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-[4px]"
                                style={{ border: "1px solid #064E3B", background: "#FDFBF7" }}
                              >
                                <Lock className="size-3" style={{ color: "#064E3B", stroke: "#064E3B" }} strokeWidth={2.5} />
                              </span>
                            ) : (
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={checked}
                                data-branded-email-checkbox="true"
                                data-no-contrast-guard="true"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleId(r.id);
                                }}
                                className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-[4px]"
                                style={{
                                  border: "1px solid #064E3B",
                                  background: checked ? "linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%)" : "#FDFBF7",
                                  color: "#FFFFFF",
                                  WebkitTextFillColor: "#FFFFFF",
                                  boxShadow: "none",
                                }}
                              >
                                {checked && (
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#FFFFFF"
                                    strokeWidth={4}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                    style={{ display: "block", color: "#FFFFFF" }}
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            )}
                            {kind === "developers" ? (
                              <AudienceLogo recipient={r} />
                            ) : (
                              <span className="inline-flex items-center justify-center size-8 rounded-md bg-white border border-emerald-900/10 overflow-hidden shrink-0" aria-label="Brokerage company">
                                <Building2 className="size-4" aria-hidden="true" style={{ color: "#064E3B", stroke: "#064E3B" }} />
                              </span>
                            )}
                            <span className="flex-1 min-w-0">
                              <span className="block truncate text-sm font-semibold text-[#0F1A16]">{r.name}</span>
                              {r.meta && <span className="block truncate text-[11px] text-[#4B5D55]">{r.meta}</span>}
                              {r.email && <span className="block truncate text-[11px] text-[#4B5D55]">{r.email}</span>}
                            </span>
                            {alreadySent && (
                              <span
                                data-no-contrast-guard="true"
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]"
                                style={{ background: "#064E3B", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                              >
                                Sent
                              </span>
                            )}
                            {isCiti && !alreadySent && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setUnlockedCitiIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(r.id)) {
                                      next.delete(r.id);
                                      setSelectedIds((s) => {
                                        const ns = new Set(s);
                                        ns.delete(r.id);
                                        return ns;
                                      });
                                    } else {
                                      next.add(r.id);
                                      setSelectedIds((s) => {
                                        const ns = new Set(s);
                                        ns.add(r.id);
                                        return ns;
                                      });
                                    }
                                    return next;
                                  });
                                }}
                                data-no-contrast-guard="true"
                                data-citi-lock-toggle={locked ? "locked" : "unlocked"}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]"
                                style={{
                                  background: locked ? "#FFFFFF" : "linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%)",
                                  color: locked ? "#064E3B" : "#FFFFFF",
                                  WebkitTextFillColor: locked ? "#064E3B" : "#FFFFFF",
                                  border: `1px solid ${locked ? "rgba(6,78,59,0.35)" : "#064E3B"}`,
                                }}
                                title={locked ? "Unlock to include Citi in this campaign" : "Locked — Citi excluded from send"}
                              >
                                {locked ? "▣ Locked" : "▢ Unlocked"}
                              </button>
                            )}
                            {r.registrationStatus === "registered" && (
                              <span
                                data-label-emerald-only
                                data-no-contrast-guard="true"
                                className="jj-pill-emerald-metallic allow-white text-white border-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap"
                              >
                                Registered
                              </span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                    {filteredRecipients.length > 350 && (
                      <li className="px-4 py-3 text-center text-xs font-semibold text-[#4B5D55]">
                        Showing 350 of {filteredRecipients.length.toLocaleString()} matches — use search to narrow the audience.
                      </li>
                    )}
                    {filteredRecipients.length === 0 && (
                      <li className="px-4 py-8 text-center text-sm text-[#4B5D55]">No matches.</li>
                    )}
                  </ul>
                </ScrollArea>
              )}
            </div>
          </section>
          </div>

          <div className="space-y-5">
          {/* STEP 3 · PREVIEW */}
          <section>
            <StepHeader n={3} label="Preview" Icon={Eye} />
            {selectedTemplate ? (
              <div className="border rounded-lg bg-white overflow-hidden shadow-[0_20px_55px_-42px_rgba(6,78,59,0.45)]" style={{ borderColor: "rgba(184,149,85,0.5)" }}>
                <div className="px-5 py-4 border-b bg-[#F8FAF9]" style={{ borderColor: "rgba(184,149,85,0.35)" }}>
                  <p className="text-[11px] text-[#4B5D55] uppercase tracking-wider">Subject</p>
                  <p className="font-bold text-[#0F1A16]">
                    {personalizeSubject(selectedTemplate.subject, previewPersonalizationName)}
                  </p>
                  <div className="mt-2 grid gap-1 text-[11px] text-[#4B5D55] sm:grid-cols-2">
                    <p><span className="uppercase tracking-wider">From:</span> <span className="text-[#0F1A16] font-semibold">{delivery.fromName}</span> &lt;<span className="text-[#064E3B] font-semibold">{delivery.fromEmail.toUpperCase()}</span>&gt;</p>
                    <p><span className="uppercase tracking-wider">Reply-to:</span> <span className="text-[#064E3B] font-semibold">{delivery.replyTo.toUpperCase()}</span></p>
                    <p className="sm:col-span-2"><span className="uppercase tracking-wider">Template:</span> <span className="text-[#064E3B] font-semibold">{selectedTemplate.name}</span></p>
                  </div>
                </div>
                <iframe
                  title="Branded email preview"
                  data-branded-email-preview-iframe="true"
                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                  className="w-full block"
                  style={{ height: "min(68vh, 720px)", border: "0", background: "#FDFBF7" }}
                  srcDoc={personalizeTemplate(selectedTemplate.html, previewPersonalizationName, kind, bookingUrl)}
                />
              </div>
            ) : (
              <div className="p-6 text-center text-[#4B5D55] border border-dashed border-emerald-900/20 rounded-lg">
                Select a template above to preview.
              </div>
            )}
          </section>

          {/* STEP 4 · SEND */}
          <section data-branded-email-send="true" className="space-y-3">
            <StepHeader n={4} label="Send" Icon={Send} />
            <div className="border border-emerald-900/15 rounded-lg p-4 bg-[#F8FAF9]">
              <p className="text-xs text-[#4B5D55] uppercase tracking-wider">Campaign summary</p>
              <ul className="mt-2 space-y-1 text-sm text-[#0F1A16]">
                <li><strong>Template:</strong> {selectedTemplate?.name || "—"}</li>
                <li><strong>Audience:</strong> {audienceCount.toLocaleString()} selected of {total.toLocaleString()} total {kind}{lockedCitiCount > 0 ? ` · ${lockedCitiCount} locked` : ""}{previouslySentCount > 0 ? ` · ${previouslySentCount} already sent` : ""}</li>
                <li><strong>From:</strong> {delivery.fromName} &lt;{delivery.fromEmail.toUpperCase()}&gt;</li>
                <li><strong>Reply-To:</strong> {delivery.replyTo.toUpperCase()}</li>
                {kind === "brokerages" ? (
                  <li><strong>Calendar:</strong> {bookingUrl ? "Google Calendar appointment link saved" : "Google Calendar appointment link missing"}</li>
                ) : (
                  <li><strong>Registration pack:</strong> saved link included in the template</li>
                )}
                <li><strong>One-shot limit:</strong> {delivery.dailyCapLabel}</li>
              </ul>
            </div>

            <div className="border border-emerald-900/15 rounded-lg p-4 bg-white">
              <p className="text-xs text-[#4B5D55] uppercase tracking-wider font-semibold mb-2">Test send</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Test email address"
                  data-branded-email-search-input="true"
                  className="flex-1 !bg-white !text-[#0F1A16] placeholder:!text-[#4B5D55] border-emerald-900/20"
                />
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={sending || !selectedTemplate}
                  data-branded-email-test-action="true"
                  data-keep-gold="true"
                  className="jj-cta-gold-metallic"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                    minHeight: 40, padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 700,
                    color: "#3a2a08",
                    WebkitTextFillColor: "#3a2a08",
                    whiteSpace: "nowrap",
                    cursor: sending || !selectedTemplate ? "not-allowed" : "pointer",
                    opacity: sending || !selectedTemplate ? 0.5 : 1,
                  }}
                >
                  {sending ? <Loader2 className="size-4 animate-spin" style={{ color: "#3a2a08", stroke: "#3a2a08", WebkitTextFillColor: "#3a2a08" }} /> : <Send className="size-4" style={{ color: "#3a2a08", stroke: "#3a2a08", WebkitTextFillColor: "#3a2a08" }} />}
                  Send test
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendLive}
              disabled={sending || !selectedTemplate || audienceCount === 0}
              data-branded-email-live-action="true"
              data-keep-gold="true"
              className="jj-cta-gold-metallic"
              style={{
                width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                minHeight: 48, padding: "12px 16px", borderRadius: 6, fontSize: 14, fontWeight: 800,
                color: "#3a2a08",
                WebkitTextFillColor: "#3a2a08",
                cursor: sending || !selectedTemplate || audienceCount === 0 ? "not-allowed" : "pointer",
                opacity: sending || !selectedTemplate || audienceCount === 0 ? 0.5 : 1,
              }}
            >
              <Send className="size-4" style={{ color: "#3a2a08", stroke: "#3a2a08", WebkitTextFillColor: "#3a2a08" }} />
              {sending ? "Sending…" : `Send live to ${selectedSendableCount.toLocaleString()} ${kind}`}
            </button>

            <p className="text-xs text-[#4B5D55]">
              Test sends immediately to the address above. Live send goes through the locked outreach pipeline — you'll be asked to confirm before delivery.
            </p>
          </section>
          </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StepHeader({ n, label, Icon }: { n: number; label: string; Icon: any }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="inline-grid place-items-center size-6 rounded-full bg-[#064E3B] text-white text-[11px] font-black">{n}</span>
      <Icon className="size-4 text-[#064E3B]" />
      <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#0F1A16]">{label}</h3>
    </div>
  );
}

