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
import { Building2, Loader2, Search, Users, Send, Eye, FileText, Check, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { getWebsiteLogoFallbackUrl, isValidDeveloperLogoUrl } from "@/utils/developerLogo";
import jbjMonogramCropped from "@/assets/jbj-monogram-cropped.png";

export type BrandedAudienceKind = "developers" | "brokerages" | "clients";

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
  variant: "developer_registration" | "developer_confirm_registered" | "brokerage_partnership_intro" | "brokerage_breakfast_invite" | "client_buyer_follow_up" | "client_seller_follow_up";
  name: string;
  subject: string;
  html: string;
  category: string | null;
};

const DEVELOPER_SENDER = {
  name: "JBJ Global Real Estate",
  title: "Developer Registration Department",
  email: "helpdesk@jbj.ae",
};

const SENDER_BY_KIND: Record<BrandedAudienceKind, typeof DEVELOPER_SENDER> = {
  developers: {
    name: "JBJ Global Real Estate",
    title: "Developer Registration Department",
    email: "helpdesk@jbj.ae",
  },
  brokerages: {
    name: "Jane Bou Jaoude",
    title: "CITI Developers · Sales & Training Department",
    email: "infoo.jane@gmail.com",
  },
  clients: {
    name: "JBJ Global Real Estate",
    title: "Client Relations Department",
    email: "helpdesk@jbj.ae",
  },
};

const DELIVERY_BY_KIND: Record<BrandedAudienceKind, { fromName: string; fromEmail: string; replyTo: string; dailyCapLabel: string }> = {
  developers: {
    fromName: "JBJ Global Real Estate",
    fromEmail: "helpdesk@jbj.ae",
    replyTo: "helpdesk@jbj.ae",
    dailyCapLabel: "Developer sends use helpdesk@jbj.ae with infoo.jane@gmail.com copied on live sends.",
  },
  brokerages: {
    fromName: "Jane Bou Jaoude",
    fromEmail: "infoo.jane@gmail.com",
    replyTo: "infoo.jane@gmail.com",
    dailyCapLabel: "No in-app 100-recipient cap. The full selected audience can be sent as one campaign; provider delivery speed still applies.",
  },
  clients: {
    fromName: "JBJ Global Real Estate",
    fromEmail: "helpdesk@jbj.ae",
    replyTo: "helpdesk@jbj.ae",
    dailyCapLabel: "Client campaigns are staged from the Client Portal audience and logged against the client campaign dashboard.",
  },
};

const CITI_PHONE_DISPLAY = "+971 54 716 7107";
const CITI_PHONE_TEL = "tel:+971547167107";
const CITI_WHATSAPP_URL = "https://wa.me/971547167107";
const CITI_WEBSITE_URL = "https://citideveloper.com";
const CITI_MAP_URL = "https://www.google.com/maps/search/?api=1&query=CITI%20Developers%20Sales%20Gallery%20Dubai";
const CITI_OFFICE_LABEL = "CITI Developers Sales Gallery";
const CALENDAR_PLACEHOLDER_URL = "https://calendar.google.com/calendar/appointments/schedules/REPLACE_WITH_JANE_PUBLIC_BOOKING_LINK";

const REGISTRATION_PACKAGE_LINK = "https://drive.google.com/open?id=1EsWVmAPv6ljBzWbWNAvv07EQrHwi5drS&usp=drive_fs";

const DEVELOPER_REQUIREMENTS_BLOCK = `<div data-jbj-developer-requirements="true" style="margin:18px 0;padding:16px;border:1px solid #B89555;background:#FAF5EA;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.65;">
  <p style="margin:0 0 10px;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;font-weight:800;">Kindly reply to this email with your current JBJ registration status and next step.</p>
  <p style="margin:0 0 12px;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;"><strong>Registration desk</strong><br/>Please send your registration form, agency code, and onboarding documents to <strong>HELPDESK@JBJ.AE</strong> with <strong>infoo.jane@gmail.com</strong> copied.</p>
  <p style="margin:0 0 12px;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;"><strong>Admin contact — Walid Halabi</strong><br/>+971 54 366 2223 &middot; +971 50 999 3839<br/><span style="color:#4a4a4a;">For urgent registration or compliance questions only. Standard correspondence can remain on this email thread.</span></p>
  <p style="margin:0 0 12px;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;"><strong>Project folders & escrow</strong><br/>In your marketing-material link, please include one folder per project containing project details, the project escrow account, and the corporate bank account / payment beneficiary. If a project is not yet registered, please mark it as <strong>Registration pending — documents pending from JBJ</strong> and include the reason.</p>
  <p style="margin:0;color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;"><strong>WhatsApp group</strong><br/>Please create a WhatsApp group using both full company names, no emojis and no abbreviations — example: <strong>ABC PROPERTIES / JBJ GLOBAL REAL ESTATE</strong>. For your team the group name would be <strong>{{developer_name}} / JBJ GLOBAL REAL ESTATE</strong>. Kindly use your developer logo as the group icon and paste your marketing-material link in the group description.<br/><br/>Please add <strong>both</strong> of us to the group and set <strong>both as group admins</strong>:<br/>• <strong>Ms. Jane Bou Jaoude</strong> (Founder) &middot; +971 54 716 7107<br/>• <strong>Walid Halabi</strong> &middot; +971 54 366 2223 &middot; +971 50 999 3839 <span style="color:#4a4a4a;">(both numbers)</span></p>
</div>`;

function injectDeveloperRequirementsBlock(html: string) {
  if (html.includes('data-jbj-developer-requirements="true"')) return html;
  if (/<p[^>]*>\s*Regards,?/i.test(html)) {
    return html.replace(/(<p[^>]*>\s*Regards,?)/i, `${DEVELOPER_REQUIREMENTS_BLOCK}$1`);
  }
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${DEVELOPER_REQUIREMENTS_BLOCK}</body>`);
  return `${html}${DEVELOPER_REQUIREMENTS_BLOCK}`;
}

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
  clients: {
    url: "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/brand%2Fjbj-monogram-cropped.png",
    appUrl: jbjMonogramCropped,
    alt: "JBJ Global Real Estate",
    wordmark: "JBJ GLOBAL REAL ESTATE",
    tagline: "Client Relations",
    width: 78,
    height: 100,
  },
};

function buildBrandHeaderHtml(kind: BrandedAudienceKind): string {
  const b = BRAND_HEADER_BY_KIND[kind];
  return `<table role="presentation" data-jbj-brand-header="true" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#ffffff;">
  <tr><td align="center" style="padding:22px 16px 18px;background:#ffffff;border-bottom:1px solid rgba(184,149,85,0.4);text-align:center;">
    <img src="${b.url}" alt="${b.alt}" width="${b.width}" height="${b.height}" style="display:block;width:${b.width}px;height:${b.height}px;max-width:${b.width}px;margin:0 auto 10px;object-fit:contain;" />
    <div style="display:block;width:100%;text-align:center;font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:700;letter-spacing:0.22em;color:#0F1A16;text-transform:uppercase;">${b.wordmark}</div>
    <div style="display:block;width:100%;text-align:center;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.28em;color:#B89555;text-transform:uppercase;margin-top:4px;">${b.tagline}</div>
  </td></tr>
</table>`;
}

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
  client_buyer_follow_up: { name: "Client · Buyer Follow-up", category: "Buyer" },
  client_seller_follow_up: { name: "Client · Seller Follow-up", category: "Seller" },
};

const DEVELOPER_VARIANTS: Template["variant"][] = [
  "developer_registration",
  "developer_confirm_registered",
];
const BROKERAGE_VARIANTS: Template["variant"][] = [
  "brokerage_partnership_intro",
  "brokerage_breakfast_invite",
];
const CLIENT_VARIANTS: Template["variant"][] = [
  "client_buyer_follow_up",
  "client_seller_follow_up",
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
  if (kind === "clients") {
    const { data, error } = await (supabase as any)
      .from("client_investors")
      .select("id, client_name, email, phone, project_name, unit_type, updated_at, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: String(r.id),
      name: r.client_name || r.email || "Client",
      email: r.email || null,
      meta: [r.project_name, r.unit_type].filter(Boolean).join(" · ") || r.phone || null,
      logoUrl: null,
      websiteUrl: null,
    }));
  }
  const allRows: any[] = [];
  const pageSize = 1000;
  for (let from = 0; from < 20000; from += pageSize) {
    const { data, error } = await (supabase as any)
      .from("crm_brokerages")
      .select("id, company_name, email, emirate, website, logo_url")
      .order("company_name")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = data ?? [];
    allRows.push(...rows);
    if (rows.length < pageSize) break;
  }
  return allRows.map((r: any) => ({
    id: String(r.id),
    name: r.company_name || "Brokerage",
    email: r.email || null,
    meta: r.emirate || null,
    logoUrl: r.logo_url || null,
    websiteUrl: r.website || null,
  }));

}

function isDeveloperRegistrationCampaign(kind: BrandedAudienceKind, template: Template | null | undefined) {
  return kind === "developers" && template?.variant === "developer_registration";
}

async function loadTemplates(kind: BrandedAudienceKind): Promise<Template[]> {
  const allowed = kind === "developers" ? DEVELOPER_VARIANTS : kind === "clients" ? CLIENT_VARIANTS : BROKERAGE_VARIANTS;

  const { data, error } = await (supabase as any)
    .from("crm_email_templates")
    .select("variant, subject, html, updated_at")
    .in("variant", allowed)
    .order("updated_at", { ascending: false });

  if (error && kind !== "clients") throw error;
  if (kind === "clients" && (!data || data.length === 0)) {
    return [
      {
        variant: "client_buyer_follow_up",
        name: TEMPLATE_META.client_buyer_follow_up.name,
        subject: "JBJ buyer follow-up",
        category: TEMPLATE_META.client_buyer_follow_up.category,
        html: `<div style="background:#ffffff;padding:28px;font-family:Arial,sans-serif;color:#0F1A16"><div style="max-width:560px;margin:auto;border:1px solid #B89555;padding:24px"><div style="text-align:center"><img src="${BRAND_HEADER_BY_KIND.clients.url}" width="64" style="display:inline-block;margin-bottom:12px"/><div style="font-weight:800;letter-spacing:3px">JBJ GLOBAL REAL ESTATE</div></div><p>Dear {{client_name}},</p><p>Thank you for your interest. We are reviewing the best-fit opportunities and will share a focused next step shortly.</p><p>Regards,<br/>JBJ Team</p></div></div>`,
      },
      {
        variant: "client_seller_follow_up",
        name: TEMPLATE_META.client_seller_follow_up.name,
        subject: "JBJ seller follow-up",
        category: TEMPLATE_META.client_seller_follow_up.category,
        html: `<div style="background:#ffffff;padding:28px;font-family:Arial,sans-serif;color:#0F1A16"><div style="max-width:560px;margin:auto;border:1px solid #B89555;padding:24px"><div style="text-align:center"><img src="${BRAND_HEADER_BY_KIND.clients.url}" width="64" style="display:inline-block;margin-bottom:12px"/><div style="font-weight:800;letter-spacing:3px">JBJ GLOBAL REAL ESTATE</div></div><p>Dear {{client_name}},</p><p>Thank you for connecting with JBJ. We are preparing the next step for your property and will follow up with a concise action plan.</p><p>Regards,<br/>JBJ Team</p></div></div>`,
      },
    ];
  }
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
  const inflight = inflightCache.get(kind);
  if (inflight) return inflight;

  const promise = Promise.all([loadRecipients(kind), loadTemplates(kind)])
    .then(([r, t]) => [r, t] as [Recipient[], Template[]])
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

function normalizeTrackedLinks(html: string) {
  return html.replace(
    /<a\b([^>]*\bhref\s*=\s*["'](?:tel:|mailto:|https:\/\/(?:wa\.me|api\.whatsapp\.com|www\.google\.com\/maps|maps\.app\.goo\.gl|calendar\.app\.google|calendar\.google\.com)\/|whatsapp:)[^"']*["'][^>]*)>/gi,
    (full, attrs) => {
      let nextAttrs = attrs;
      if (!/\bdata-no-link-tracking\b/i.test(nextAttrs)) nextAttrs += ' data-no-link-tracking="true"';
      if (!/\bdata-disable-tracking\b/i.test(nextAttrs)) nextAttrs += ' data-disable-tracking="true"';
      return `<a${nextAttrs}>`;
    },
  );
}

function personalizeTemplate(html: string, sampleName = "Recipient Developer Name", audienceKind: BrandedAudienceKind = "developers", bookingUrl = "") {
  const sender = SENDER_BY_KIND[audienceKind];
  const safeBookingUrl = bookingUrl.trim() || CALENDAR_PLACEHOLDER_URL;
  const jbjLink = '<a href="https://jbj.ae" target="_blank" rel="noreferrer" style="color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;font-weight:700;text-decoration:underline;text-decoration-color:#B89555;">JBJ.AE</a>';
  const senderMailLink = `<a href="mailto:${sender.email}" style="color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;font-weight:700;text-decoration:underline;text-decoration-color:#B89555;">${sender.email.toUpperCase()}</a>`;
  const senderMailToken = "__JBJ_SENDER_MAIL_LINK__";
  // No outer white header — brand logos live inside each card.
  // For developer cards, inject the JBJ monogram image right above the
  // "JBJ GLOBAL REAL ESTATE" wordmark so it mirrors the CITI card layout.
  let htmlWithBrand = html.replace(
    /<table role="presentation"[^>]*data-jbj-brand-header="true"[\s\S]*?<\/table>/gi,
    "",
  );
  if (audienceKind === "developers") {
    const jbjLogoImg = `<img src="${BRAND_HEADER_BY_KIND.developers.url}" alt="JBJ Global Real Estate" width="72" style="max-width:72px;height:auto;display:inline-block;border:0;margin:0 auto 12px;" />`;
    // Insert the JBJ monogram immediately before the first wordmark div.
    htmlWithBrand = htmlWithBrand.replace(
      /(<div\s+style="[^"]*letter-spacing:3px[^"]*text-transform:uppercase[^"]*">JBJ GLOBAL REAL ESTATE<\/div>)/i,
      `${jbjLogoImg}$1`,
    );
  }
  const renderedConditionals = htmlWithBrand.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key, inner) => (key === "booking_url" ? safeBookingUrl : "").trim() ? inner : "",
  );
  const withDeveloperInstructions = audienceKind === "developers"
    ? injectDeveloperRequirementsBlock(renderedConditionals)
    : renderedConditionals;
  const personalized = withDeveloperInstructions
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
      .replace(/\{\{client_name\}\}/g, sampleName)
      .replace(/\{\{salutation\}\}/g, sampleName)
      .replace(/\{\{contact_first_name\}\}/g, "Team")
      .replace(/\{\{contact_full_name\}\}/g, sampleName)
      .replace(/\{\{owner_first_name\}\}/g, "Jane")
      .replace(/\{\{project_name\}\}/g, "AMRA")
      .replace(/\{\{project_tagline\}\}/g, "Wellness-led beachfront resort residences in Umm Al Quwain — our current launch focus.")
      .replace(/\{\{project_url\}\}/g, "https://citideveloper.com/e-catalogue/amra")
      .replace(/\{\{booking_url\}\}/g, safeBookingUrl)
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
      .replace(/Jane\s+Bouchaudey/gi, sender.name)
      .replace(/Jane Bou Jaoude/gi, sender.name)
      .replace(/Jane Bujold/gi, sender.name)
      .replace(/JBJ Team/gi, sender.name)
      .replace(/\{\{sender_phone_name\}\}/g, "Jane Bou Jaoude")
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
    .replace(/JBJ Global Real Estate/g, audienceKind === "developers" || audienceKind === "clients" ? "JBJ Global Real Estate" : "JBJ GLOBAL REAL ESTATE");
  return normalizeTrackedLinks(personalized);
}

function personalizeSubject(subject: string, sampleName = "Recipient Developer Name") {
  return subject
    .replace(/\{\{developer_name\}\}/g, sampleName)
    .replace(/\{\{brokerage_name\}\}/g, sampleName)
      .replace(/\{\{project_name\}\}/g, "Citi Developer")
    .replace(/jbj\.ae/gi, "JBJ.AE")
    .replace(/JBJ Global Real Estate/g, "JBJ Global Real Estate");
}

function makePreviewHtmlSafe(html: string) {
  const bridge = `<base target="_blank" />
<script>
  document.addEventListener('click', function(event) {
    var anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    var href = anchor.getAttribute('href') || '';
    if (/^https:\/\/(drive\.google\.com|calendar\.google\.com|calendar\.app\.google)\//i.test(href)) {
      event.preventDefault();
      event.stopPropagation();
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }, true);
</script>`;
  return `${bridge}${html}`;
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
  const [bookingUrlBusiness, setBookingUrlBusiness] = useState("");
  const [bookingUrlPersonal, setBookingUrlPersonal] = useState("");
  const [activeCalendarAccount, setActiveCalendarAccount] = useState<"business" | "personal">("personal");
  const [savingBookingUrl, setSavingBookingUrl] = useState(false);
  const bookingUrl = (activeCalendarAccount === "business" ? bookingUrlBusiness : bookingUrlPersonal).trim();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
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
      const { data: rows } = await (supabase as any)
        .from("crm_owner_settings")
        .select("google_calendar_booking_url, google_calendar_booking_url_business, google_calendar_booking_url_personal, google_calendar_active_account, updated_at")
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(1);
      const data = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (cancelled) return;
      const legacy = String(data?.google_calendar_booking_url || "").trim();
      const business = String(data?.google_calendar_booking_url_business || "").trim();
      const personal = String(data?.google_calendar_booking_url_personal || legacy || "").trim();
      const active = (data?.google_calendar_active_account === "business" ? "business" : "personal") as "business" | "personal";
      setBookingUrlBusiness(business);
      setBookingUrlPersonal(personal);
      setActiveCalendarAccount(active);
    })().catch(() => {
      if (!cancelled) {
        setBookingUrlBusiness("");
        setBookingUrlPersonal("");
      }
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
    // Truth source: only Resend-accepted / delivered / engaged sends lock a
    // recipient. Legacy Gmail attempts, failures, and provider rejections are
    // NOT considered "sent" — they remain retryable. This decouples the UI
    // from historical noise in crm_relationship_email_log (which mixed in
    // 400+ gmail_legacy_attempted rows).
    const entityType = kind === "developers" ? "developer" : kind === "clients" ? "client" : "brokerage";
    (async () => {
      const { data } = await (supabase as any)
        .from("jbj_campaign_recipients")
        .select("email_norm, send_status, provider, delivery_status, reply_status, business_status")
        .eq("entity_type", entityType)
        .eq("provider", "resend")
        .limit(20000);
      if (cancelled) return;
      const sent = new Set<string>();
      for (const row of data ?? []) {
        const normalized = String((row as any).email_norm || "").trim().toLowerCase();
        if ((row as any).send_status === "provider_accepted" && normalized) sent.add(normalized);
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
      // Email campaigns also require a real recipient email, so "selected" and
      // "send live" counts stay identical.
      return campaignRecipients.filter((r) => {
        const normalizedEmail = r.email?.toLowerCase().trim();
        const alreadySent = !!normalizedEmail && previouslySentEmails.has(normalizedEmail);
        return !!normalizedEmail && !alreadySent && (!isCitiRecipient(r) || unlockedCitiIds.has(r.id));
      });
    },
    [campaignRecipients, unlockedCitiIds, previouslySentEmails]
  );
  const previouslySentCount = useMemo(
    () => campaignRecipients.filter((r) => !!r.email && previouslySentEmails.has(r.email.toLowerCase().trim())).length,
    [campaignRecipients, previouslySentEmails]
  );
  const missingEmailCount = useMemo(
    () => campaignRecipients.filter((r) => !r.email?.trim()).length,
    [campaignRecipients],
  );
  const eligibleTotal = eligibleRecipients.length;
  const allSelected = audienceCount === eligibleTotal && eligibleTotal > 0;
  const previewRecipient = useMemo(
    () => recipients.find((r) => selectedIds.has(r.id)) || recipients[0] || null,
    [recipients, selectedIds]
  );
  const previewRecipientName = previewRecipient?.name || (kind === "developers" ? "Recipient Developer Name" : kind === "clients" ? "Recipient Client Name" : "Recipient Brokerage Name");
  const previewPersonalizationName = kind === "developers" ? "Recipient Developer Name" : kind === "clients" ? "Recipient Client Name" : "Recipient Brokerage Name";
  const sender = SENDER_BY_KIND[kind];
  const delivery = DELIVERY_BY_KIND[kind];
  const activeBrand = BRAND_HEADER_BY_KIND[kind];
  const selectedSendableCount = useMemo(
    () => campaignRecipients.filter((r) => selectedIds.has(r.id) && r.email?.trim()).length,
    [campaignRecipients, selectedIds]
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

  const handleSaveBookingUrl = async () => {
    const business = bookingUrlBusiness.trim();
    const personal = bookingUrlPersonal.trim();
    const validate = (url: string, label: string) => {
      if (!url) return true;
      if (!/^https:\/\/(calendar\.app\.google|calendar\.google\.com)\//i.test(url)) {
        toast.error(`${label} link must start with https://calendar.app.google/ or https://calendar.google.com/`);
        return false;
      }
      if (/jbj\.ae|lovable\.dev|lovable\.app|auth-bridge/i.test(url)) {
        toast.error(`${label} link is not a public Google Calendar link.`);
        return false;
      }
      return true;
    };
    if (!validate(business, "Business (contact@jbj.ae)")) return;
    if (!validate(personal, "Personal (infoo.jane@gmail.com)")) return;
    const active = (activeCalendarAccount === "business" ? business : personal) || personal || business;
    if (!active) {
      toast.error("Paste at least one Google Calendar booking link.");
      return;
    }
    setSavingBookingUrl(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userError || !userId) throw new Error("Sign in required");
      const { error } = await (supabase as any)
        .from("crm_owner_settings")
        .upsert({
          owner_id: userId,
          google_calendar_booking_url: active,
          google_calendar_booking_url_business: business || null,
          google_calendar_booking_url_personal: personal || null,
          google_calendar_active_account: activeCalendarAccount,
        }, { onConflict: "owner_id" });
      if (error) throw error;
      toast.success(`Saved — active calendar: ${activeCalendarAccount === "business" ? "contact@jbj.ae" : "infoo.jane@gmail.com"}`);
    } catch (e: any) {
      toast.error(`Calendar link save failed: ${e?.message || "unknown error"}`);
    } finally {
      setSavingBookingUrl(false);
    }
  };

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
        kind === "developers" ? "Test Recipient" : kind === "clients" ? "Test Client" : "Test Brokerage",
      );
      const functionName = kind === "developers" ? "crm-send-developer-registration" : kind === "clients" ? "crm-send-client-followup" : "crm-send-brokerage-outreach";
      const body = kind === "developers"
        ? { variant: selectedTemplate.variant, testRecipient: testEmail.trim(), testDeveloperName: sampleName, subjectOverride: personalizeSubject(selectedTemplate.subject, sampleName) }
        : kind === "clients"
        ? { variant: selectedTemplate.variant, testRecipient: testEmail.trim(), testClientName: sampleName, subjectOverride: personalizeSubject(selectedTemplate.subject, sampleName) }
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
        const functionName = kind === "developers" ? "crm-send-developer-registration" : kind === "clients" ? "crm-send-client-followup" : "crm-send-brokerage-outreach";
        const body = kind === "developers"
          ? { catalogDeveloperId: r.catalogDeveloperId ?? r.id, variant: selectedTemplate.variant, overrideEmail: r.email, silent: true }
          : kind === "clients"
          ? { clientId: r.id, variant: selectedTemplate.variant, overrideEmail: r.email, silent: true }
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
        className="w-screen sm:max-w-none p-0 flex flex-col bg-white border-l-0 rounded-l-2xl shadow-[-24px_0_60px_-30px_rgba(6,78,59,0.35)] overflow-hidden"
      >
        <style>{`
          [data-branded-email-panel="true"] [data-cal-active-pill="true"],
          [data-branded-email-panel="true"] [data-cal-save-btn="true"] {
            color: #FFFFFF !important;
            -webkit-text-fill-color: #FFFFFF !important;
          }
          [data-branded-email-panel="true"] [data-cal-active-pill="true"] *,
          [data-branded-email-panel="true"] [data-cal-save-btn="true"] * {
            color: #FFFFFF !important;
            -webkit-text-fill-color: #FFFFFF !important;
          }
          [data-branded-email-panel="true"] [data-cal-active-pill="true"] svg,
          [data-branded-email-panel="true"] [data-cal-save-btn="true"] svg {
            color: #FFFFFF !important;
            stroke: #FFFFFF !important;
            fill: none !important;
          }
        `}</style>
        <SheetHeader className="px-6 py-4 border-b border-emerald-900/10 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="inline-grid place-items-center size-14 shrink-0 rounded-md border border-emerald-900/15 bg-white p-2 shadow-[0_8px_18px_-14px_rgba(6,78,59,0.45)] overflow-hidden">
              <img
                src={activeBrand.appUrl}
                alt=""
                aria-hidden="true"
                className="block max-h-full max-w-full object-contain"
                data-no-fallback
                loading="eager"
                decoding="async"
              />
            </span>

            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] font-black text-[#064E3B]">
                {kind === "developers" ? "Developer Portal · Campaigns" : kind === "clients" ? "Client Portal · Campaigns" : "Brokerage Portal · Campaigns"}
              </p>
              <SheetTitle className="text-xl font-black text-[#0F1A16]">Branded Emails</SheetTitle>
            </div>
            <div className="ml-auto flex items-center gap-3 text-xs text-[#4B5D55]">
              <div className="hidden sm:flex items-center gap-2">
                <Users className="size-4" />
                Sending to <strong className="text-[#0F1A16]">{audienceCount}</strong> of {total.toLocaleString()} {kind}
                {missingEmailCount > 0 && <span className="font-semibold text-[#064E3B]">· {missingEmailCount.toLocaleString()} missing email</span>}
                {lockedCitiCount > 0 && <span className="font-semibold text-[#064E3B]">· {lockedCitiCount} locked</span>}
                {previouslySentCount > 0 && <span className="font-semibold text-[#064E3B]">· {previouslySentCount} already sent</span>}
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close Branded Emails"
                title="Close (Esc)"
                data-branded-email-close="true"
                className="inline-grid place-items-center size-9 rounded-full border transition"
                style={{
                  background: "#FFFFFF",
                  borderColor: "#064E3B",
                  color: "#064E3B",
                }}
              >
                <X className="size-4" style={{ color: "#064E3B", stroke: "#064E3B" }} />
              </button>
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
                  placeholder={`Search ${kind === "developers" ? "developers" : kind === "clients" ? "clients" : "brokerages"}…`}
                  className="pl-9 !bg-white !text-[#0F1A16] placeholder:!text-[#4B5D55] border-emerald-900/20"
                />
              </div>
              <span className="text-xs text-[#4B5D55] ml-auto">
                <strong className="text-[#0F1A16]">{audienceCount.toLocaleString()}</strong> selected of {total.toLocaleString()} total
                {missingEmailCount > 0 && <span className="font-semibold text-[#064E3B]"> · {missingEmailCount.toLocaleString()} missing email</span>}
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
                      const missingEmail = !r.email?.trim();
                      const alreadySent = !!r.email && previouslySentEmails.has(r.email.toLowerCase().trim());
                      const locked = missingEmail || (isCiti && !unlockedCitiIds.has(r.id)) || alreadySent;
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
                                aria-label={missingEmail ? "Missing email — excluded from this campaign" : alreadySent ? "Already sent — excluded from this campaign" : "Locked — Citi developers excluded by default"}
                                title={missingEmail ? "Missing email — excluded from this campaign" : alreadySent ? "Already sent — excluded from this campaign" : "Locked — click unlock to include in this campaign"}
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
                            <AudienceLogo recipient={r} />
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
                            {missingEmail && !alreadySent && (
                              <span
                                data-no-contrast-guard="true"
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]"
                                style={{ background: "#FDFBF7", color: "#064E3B", WebkitTextFillColor: "#064E3B", border: "1px solid rgba(6,78,59,0.35)" }}
                              >
                                No email
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
                  sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                  className="w-full block"
                  style={{ height: "min(68vh, 720px)", border: "0", background: "#FDFBF7" }}
                  srcDoc={makePreviewHtmlSafe(personalizeTemplate(selectedTemplate.html, previewPersonalizationName, kind, bookingUrl))}
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
                <li><strong>Audience:</strong> {audienceCount.toLocaleString()} sendable selected of {total.toLocaleString()} total {kind}{missingEmailCount > 0 ? ` · ${missingEmailCount.toLocaleString()} missing email` : ""}{lockedCitiCount > 0 ? ` · ${lockedCitiCount} locked` : ""}{previouslySentCount > 0 ? ` · ${previouslySentCount} already sent` : ""}</li>
                <li><strong>From:</strong> {delivery.fromName} &lt;{delivery.fromEmail.toUpperCase()}&gt;</li>
                <li><strong>Reply-To:</strong> {delivery.replyTo.toUpperCase()}</li>
                {kind === "developers" && <li><strong>CC:</strong> INFOO.JANE@GMAIL.COM · replies must stay on HELPDESK@JBJ.AE</li>}
                {kind === "brokerages" ? (
                  <li><strong>Calendar:</strong> {bookingUrl ? "Google Calendar appointment link saved — bookings sync into Meetings" : "Google Calendar appointment link missing — live send is blocked until saved"}</li>
                ) : kind === "clients" ? (
                  <li><strong>Client sections:</strong> buyer and seller follow-up templates are available from this panel</li>
                ) : (
                  <li><strong>Registration request:</strong> asks for status, forms, requirements, logo, WhatsApp group, and marketing material links</li>
                )}
                <li><strong>Delivery:</strong> {delivery.dailyCapLabel}</li>
                <li><strong>Status logic:</strong> Sent campaigns are marked automatically; replies are matched by inbound email sync and bookings by Google Calendar sync.</li>
              </ul>
            </div>

            {kind === "brokerages" && (
              <div
                className={`border rounded-lg p-4 space-y-3 ${bookingUrl ? "border-emerald-900/15 bg-white" : "border-red-300 bg-red-50"}`}
              >
                <div>
                  <p className={`text-xs uppercase tracking-wider font-semibold ${bookingUrl ? "text-[#4B5D55]" : "text-red-800"}`}>
                    Google Calendar booking links {bookingUrl ? "" : "— required before live send"}
                  </p>
                  <p className="text-xs text-[#4B5D55] mt-1">
                    Save one link per account. Pick which one gets embedded in outgoing emails.
                  </p>
                </div>

                {/* Account selector */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {(["business", "personal"] as const).map((acc) => {
                    const isActive = activeCalendarAccount === acc;
                    const label = acc === "business" ? "contact@jbj.ae (Business)" : "infoo.jane@gmail.com (Personal)";
                    return (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => setActiveCalendarAccount(acc)}
                        data-no-contrast-guard="true"
                        data-cal-active-pill={isActive ? "true" : undefined}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-black border transition"
                        style={{
                          background: isActive ? "linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%)" : "#FFFFFF",
                          color: isActive ? "#FFFFFF" : "#0F1A16",
                          WebkitTextFillColor: isActive ? "#FFFFFF" : "#0F1A16",
                          borderColor: isActive ? "#064E3B" : "rgba(6,78,59,0.25)",
                        }}
                        aria-pressed={isActive}
                      >
                        {isActive ? <Check className="size-3" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} /> : null}
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5D55]">
                    Business link (contact@jbj.ae)
                  </label>
                  <Input
                    type="url"
                    value={bookingUrlBusiness}
                    onChange={(e) => setBookingUrlBusiness(e.target.value)}
                    placeholder="https://calendar.app.google/... (contact@jbj.ae)"
                    className="!bg-white !text-[#0F1A16] placeholder:!text-[#4B5D55] border-emerald-900/20"
                  />
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#4B5D55] pt-1">
                    Personal link (infoo.jane@gmail.com)
                  </label>
                  <Input
                    type="url"
                    value={bookingUrlPersonal}
                    onChange={(e) => setBookingUrlPersonal(e.target.value)}
                    placeholder="https://calendar.app.google/... (infoo.jane@gmail.com)"
                    className="!bg-white !text-[#0F1A16] placeholder:!text-[#4B5D55] border-emerald-900/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveBookingUrl}
                  disabled={savingBookingUrl}
                  data-no-contrast-guard="true"
                  data-cal-save-btn="true"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-black"
                  style={{ background: "linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", opacity: savingBookingUrl ? 0.65 : 1 }}
                >
                  {savingBookingUrl ? <Loader2 className="size-4 animate-spin" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} /> : <Check className="size-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />}
                  Save & use {activeCalendarAccount === "business" ? "contact@jbj.ae" : "infoo.jane@gmail.com"}
                </button>
              </div>
            )}


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
                  className="jj-emerald-metallic"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                    minHeight: 40, padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 700,
                    background: "linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%)",
                    color: "#FFFFFF",
                    WebkitTextFillColor: "#FFFFFF",
                    whiteSpace: "nowrap",
                    cursor: sending || !selectedTemplate ? "not-allowed" : "pointer",
                    opacity: sending || !selectedTemplate ? 0.5 : 1,
                  }}
                >
                  {sending ? <Loader2 className="size-4 animate-spin" style={{ color: "#FFFFFF", stroke: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }} /> : <Send className="size-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }} />}
                  Send test
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendLive}
              disabled={sending || !selectedTemplate || audienceCount === 0 || (kind === "brokerages" && !bookingUrl)}
              data-branded-email-live-action="true"
              data-keep-gold="true"
              className="jj-emerald-metallic"
              style={{
                width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                minHeight: 48, padding: "12px 16px", borderRadius: 6, fontSize: 14, fontWeight: 800,
                background: "linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                cursor: sending || !selectedTemplate || audienceCount === 0 || (kind === "brokerages" && !bookingUrl) ? "not-allowed" : "pointer",
                opacity: sending || !selectedTemplate || audienceCount === 0 || (kind === "brokerages" && !bookingUrl) ? 0.5 : 1,
              }}
            >
              <Send className="size-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }} />
              {sending
                ? "Sending…"
                : kind === "brokerages" && !bookingUrl
                  ? "Save Google Calendar link to enable live send"
                  : `Send live to ${selectedSendableCount.toLocaleString()} ${kind} with email`}
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

