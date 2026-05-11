/**
 * JBJ GLOBAL REAL ESTATE — Property Advertising Agreement
 * Layout follows the Property Finder standard (radio chips, two-column fields,
 * EXCLUSIVE / NON-EXCLUSIVE + period chips), rendered with our champagne-gold
 * brand chrome. Header & footer are user-customisable via the `chrome` arg.
 */

import monogramUrl from "@/assets/jbj-fulllogo-light-bg.png";
import footerMarkUrl from "@/assets/jbj-fulllogo-light-bg.png";
import {
  TRADE_LICENSE_BRAND,
  TRADE_LICENSE_LEGAL_NAME,
  TRADE_LICENSE_OFFICE,
  COMPANY_CONTACT,
} from "@/config/companyLegal";

export const JBJ_BRAND = {
  company: TRADE_LICENSE_BRAND,
  // Full registered name per Trade License — used in binding/legal contexts
  legalCompany: TRADE_LICENSE_LEGAL_NAME,
  office: TRADE_LICENSE_OFFICE,
  phone: COMPANY_CONTACT.phone,
  email: COMPANY_CONTACT.email,
  website: COMPANY_CONTACT.website,
  gold: "#B89555",
  ink: "#1A1A1A",
  monogram: monogramUrl,
} as const;

export const PAA_LAYOUT_VERSION = 10;

export type PAAFieldKey =
  // Owner
  | "landlord_name" | "passport_number" | "emirates_id" | "mobile_number"
  | "email_address" | "nationality" | "listing_consultant" | "property_reference_no" | "expiry_date"
  // Property
  | "property_type" | "status_vacant_tenanted" | "furnishing" | "vacating_date"
  | "building_name" | "unit_number" | "plot_number" | "street_name" | "community"
  | "bua_sqft" | "plot_sqft" | "bedrooms" | "bathrooms"
  | "rental_amount" | "sales_amount" | "parking" | "additional_notes"
  // Terms
  | "exclusivity" | "listing_period" | "listing_period_until_date" | "broker_appointee_name"
  // Sign
  | "landlord_signature_name" | "landlord_signature_date"
  | "jbj_signature_name" | "jbj_signature_date";

export const PAA_DEFAULT_VALUES: Record<PAAFieldKey | "doc_number", string> = {
  doc_number: "",
  landlord_name: "", passport_number: "", emirates_id: "", mobile_number: "",
  email_address: "", nationality: "", listing_consultant: "", property_reference_no: "", expiry_date: "",
  property_type: "", status_vacant_tenanted: "", furnishing: "", vacating_date: "",
  building_name: "", unit_number: "", plot_number: "", street_name: "", community: "",
  bua_sqft: "", plot_sqft: "", bedrooms: "", bathrooms: "",
  rental_amount: "", sales_amount: "", parking: "", additional_notes: "",
  exclusivity: "", listing_period: "", listing_period_until_date: "",
  broker_appointee_name: TRADE_LICENSE_LEGAL_NAME,
  landlord_signature_name: "", landlord_signature_date: "",
  jbj_signature_name: "", jbj_signature_date: "",
};

/* ----------------------------- formatting helpers ------------------------- */

const esc = (s: string) =>
  String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

const fmtMoney = (raw: string) => {
  if (!raw) return "";
  const n = Number(String(raw).replace(/[^\d.]/g, ""));
  if (!isFinite(n) || n <= 0) return esc(raw);
  return `AED ${new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(n)}`;
};

const fmtDateDDMMYYYY = (raw: string) => {
  if (!raw) return ["", "", ""];
  // accept yyyy-mm-dd or dd/mm/yyyy
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (isoMatch) return [isoMatch[3], isoMatch[2], isoMatch[1]];
  const dmy = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/.exec(raw);
  if (dmy) return [dmy[1].padStart(2, "0"), dmy[2].padStart(2, "0"), dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]];
  return ["", "", ""];
};

const dateBox = (raw: string) => {
  const [d, m, y] = fmtDateDDMMYYYY(raw);
  const cell = (v: string, ph: string) =>
    `<span style="display:inline-block;min-width:32px;text-align:center;border-bottom:1px solid #B89555;padding:1px 4px;font-size:12px;color:${v ? "#1A1A1A" : "#1A1A1A66"};">${v || ph}</span>`;
  return `${cell(d, "DD")}<span style="opacity:.4;margin:0 4px;">/</span>${cell(m, "MM")}<span style="opacity:.4;margin:0 4px;">/</span>${cell(y, "YYYY")}`;
};

const radioChip = (label: string, selected: boolean) => `
  <span style="display:inline-flex;align-items:center;gap:6px;margin-right:18px;font-size:12px;color:#1A1A1A;">
    <span style="width:11px;height:11px;border:1px solid #B89555;border-radius:999px;display:inline-block;position:relative;${selected ? "background:#FFFFFF;" : ""}">
      ${selected ? `<span style="position:absolute;inset:2px;border-radius:999px;background:#1A1A1A;"></span>` : ""}
    </span>
    ${esc(label)}
  </span>`;

const fieldUnderline = (
  label: string,
  value: string,
  key?: string,
  opts?: { hidden?: Set<string>; force?: boolean }
) => {
  if (key && opts?.hidden?.has(key)) return "";
  if (!opts?.force && !value) return "";
  const dataAttr = key ? ` data-field-key="${key}"` : "";
  // Underline width hugs the actual content; label sits below the value, sized
  // to the visible text so empty space never stretches into a long blank line.
  const safe = esc(value || "");
  return `
  <div${dataAttr} style="margin:6px 24px 14px 0;display:inline-block;vertical-align:top;position:relative;">
    <div style="display:inline-block;border-bottom:1px solid #B89555;min-width:1ch;padding:2px 8px 2px 2px;font-size:13px;color:#1A1A1A;white-space:nowrap;">${safe || "&nbsp;"}</div>
    <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#1A1A1A;opacity:.7;margin-top:3px;">${esc(label)}</div>
  </div>`;
};

/* ---------------------------------- chrome -------------------------------- */

export type ChromeHeaderStyle = "monogram-wordmark" | "wordmark-only" | "crest-address" | "minimal-hairline";
export type ChromeFooterStyle = "three-column" | "centered-tagline" | "compliance-bar";

export interface TemplateChrome {
  accent?: string;            // gold hairline
  ink?: string;               // text colour
  surface?: string;           // page background
  headerStyle?: ChromeHeaderStyle;
  footerStyle?: ChromeFooterStyle;
  tagline?: string;           // for centered-tagline footer
  trn?: string;               // tax registration #
  license?: string;           // RERA / DED license #
}

export const DEFAULT_CHROME: Required<TemplateChrome> = {
  accent: "#B89555",
  ink: "#1A1A1A",
  surface: "#FFFFFF",
  headerStyle: "monogram-wordmark",
  footerStyle: "three-column",
  tagline: "DOWNTOWN DUBAI · INSTITUTIONAL REAL ESTATE",
  trn: "",
  license: "",
};

const headerHtml = (chrome: Required<TemplateChrome>, docNumber: string) => {
  const { accent, ink, headerStyle } = chrome;
  const docBadge = docNumber
    ? `<div style="font-size:10.5px;letter-spacing:.18em;color:${ink};font-weight:600;">${esc(docNumber)}</div>`
    : "";
  switch (headerStyle) {
    case "wordmark-only":
      return `
        <div style="text-align:center;border-bottom:1px solid ${accent};padding-bottom:14px;margin-bottom:24px;">
          <div style="font-size:22px;letter-spacing:.24em;font-weight:700;color:${ink};">${JBJ_BRAND.company}</div>
          ${docBadge ? `<div style="margin-top:6px;">${docBadge}</div>` : ""}
        </div>`;
    case "crest-address":
      return `
        <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid ${accent};padding-bottom:14px;margin-bottom:24px;">
          <div>
            <div style="width:38px;height:38px;border:1px solid ${accent};display:flex;align-items:center;justify-content:center;font-weight:800;letter-spacing:.06em;color:${ink};font-size:14px;">JBJ</div>
            <div style="font-size:18px;letter-spacing:.18em;font-weight:700;margin-top:8px;color:${ink};">${JBJ_BRAND.company}</div>
          </div>
          <div style="text-align:right;font-size:11px;color:${ink};opacity:.85;">
            ${docBadge}
            <div>One Central · DIFC · Dubai, UAE</div>
            <div>${JBJ_BRAND.phone}</div>
            <div>${JBJ_BRAND.email}</div>
          </div>
        </div>`;
    case "minimal-hairline":
      return `
        <div style="border-bottom:1px solid ${accent};padding-bottom:8px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="font-size:14px;letter-spacing:.28em;font-weight:600;color:${ink};">${JBJ_BRAND.company}</div>
          ${docBadge}
        </div>`;
    case "monogram-wordmark":
    default:
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid ${accent};padding-bottom:14px;margin-bottom:24px;">
          <div style="display:flex;align-items:center;gap:16px;">
            <img src="${JBJ_BRAND.monogram}" alt="JBJ Global Real Estate" crossorigin="anonymous" style="width:140px;height:auto;max-height:72px;object-fit:contain;display:block;" />
            <div style="border-left:1px solid ${accent};padding-left:14px;">
              <div style="font-size:10px;letter-spacing:.16em;color:${ink};opacity:.85;">${esc(JBJ_BRAND.legalCompany)}</div>
              ${JBJ_BRAND.office ? `<div style="font-size:9.5px;letter-spacing:.12em;color:${ink};opacity:.7;margin-top:2px;">${esc(JBJ_BRAND.office)}</div>` : ""}
            </div>
          </div>
          <div style="text-align:right;font-size:11px;color:${ink};opacity:.9;">
            ${docBadge}
            <div style="margin-top:4px;">${JBJ_BRAND.phone}</div>
            <div>${JBJ_BRAND.email}</div>
            <div>${JBJ_BRAND.website}</div>
          </div>
        </div>`;
  }
};

const footerHtml = (chrome: Required<TemplateChrome>) => {
  const { accent, ink, footerStyle, tagline, trn, license } = chrome;
  const base = `margin-top:36px;padding-top:14px;border-top:1px solid ${accent};font-size:10.5px;color:${ink};opacity:.78;`;
  switch (footerStyle) {
    case "centered-tagline":
      return `
        <div style="${base}text-align:center;letter-spacing:.18em;text-transform:uppercase;">
          <div style="font-weight:600;">${esc(tagline)}</div>
          <div style="margin-top:4px;">${JBJ_BRAND.email} · ${JBJ_BRAND.website} · ${JBJ_BRAND.phone}</div>
        </div>`;
    case "compliance-bar":
      return `
        <div style="${base}display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div>${JBJ_BRAND.company}</div>
          <div>${trn ? `TRN ${esc(trn)} · ` : ""}${license ? `LIC ${esc(license)} · ` : ""}${JBJ_BRAND.email} · ${JBJ_BRAND.website}</div>
        </div>`;
    case "three-column":
    default:
      return `
        <div style="${base}display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;align-items:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            <img src="${JBJ_BRAND.monogram}" alt="JBJ" crossorigin="anonymous" style="width:36px;height:36px;object-fit:contain;display:block;flex:none;" />
            <div>
              <div style="font-weight:700;letter-spacing:.14em;font-size:10px;opacity:.85;">${esc(JBJ_BRAND.legalCompany)}</div>
              ${JBJ_BRAND.office ? `<div style="opacity:.7;margin-top:2px;">${esc(JBJ_BRAND.office)}</div>` : ""}
            </div>
          </div>
          <div style="text-align:center;">
            <div>${JBJ_BRAND.email}</div>
            <div>${JBJ_BRAND.website}</div>
          </div>
          <div style="text-align:right;">
            <div>${JBJ_BRAND.phone}</div>
            <div style="opacity:.7;">${trn ? `TRN ${esc(trn)}` : ""}${trn && license ? " · " : ""}${license ? `LIC ${esc(license)}` : ""}</div>
          </div>
        </div>`;
  }
};

/* ----------------------------- builder API -------------------------------- */

export const JBJ_PAA_TEMPLATE_ID = "jbj-property-advertising-agreement";

export interface BuildPAAOptions {
  chrome?: TemplateChrome;
  ownerSignatureUrl?: string | null;   // url to PNG of authorised representative signature
  ownerStampUrl?: string | null;       // url to PNG of company stamp
  clientSignatureUrl?: string | null;  // url to client's captured signature
  hiddenFields?: string[];             // keys explicitly hidden by the user
  /**
   * "edit"  → show every option chip (so the user can change a selection in the
   *           live preview / iframe). All Property Finder fields stay visible.
   * "final" → collapse single-choice chips down to the selected value only —
   *           the format used for the signed PDF.
   */
  renderMode?: "edit" | "final";
}

export function buildPAAHtml(
  values: Partial<Record<PAAFieldKey | "doc_number", string>> = {},
  opts: BuildPAAOptions = {},
): string {
  const v = { ...PAA_DEFAULT_VALUES, ...values };
  const get = (k: PAAFieldKey | "doc_number") => (v[k] ?? "").toString();

  const chrome: Required<TemplateChrome> = { ...DEFAULT_CHROME, ...(opts.chrome || {}) };
  const accent = chrome.accent;
  const ink = chrome.ink;
  const hidden = new Set<string>(opts.hiddenFields || []);
  // Force any field that has a value to render — guarantees every edited field
  // is reflected in the document even if it was not present in the original
  // skeleton render.
  const fu = (label: string, value: string, key: string) =>
    fieldUnderline(label, value, key, { hidden, force: !!value });

  // Conditionals (smart fields) — auto-infer Tenanted when a future vacating date is provided
  const rawStatus = get("status_vacant_tenanted");
  const vacatingRaw = get("vacating_date");
  const vacatingTs = vacatingRaw ? Date.parse(vacatingRaw) : NaN;
  const hasFutureVacating = !!vacatingRaw && isFinite(vacatingTs) && vacatingTs > Date.now();
  const isVacant = rawStatus
    ? /vacant/i.test(rawStatus)
    : !hasFutureVacating; // empty + future vacating ⇒ Tenanted
  const isTenanted = !isVacant;
  // expose normalised status for chip rendering below
  if (!rawStatus && isTenanted) v.status_vacant_tenanted = "Tenanted";
  const isVilla = /villa/i.test(get("property_type"));
  const showVacatingDate = isTenanted && !!vacatingRaw;
  const showPlot = isVilla;
  const period = get("listing_period");
  const showUntilDate = /until/i.test(period) && get("listing_period_until_date");

  const isFinal = opts.renderMode === "final";

  /**
   * Render a single-choice chip row. In edit mode every option chip is
   * clickable (data-chip-key / data-chip-value emit a `jbj-set-field` postMessage
   * to the editor). In final mode, only the selected option survives — printed
   * as a clean inline value with a thin gold underline.
   */
  const chipRow = (fieldKey: string, label: string, options: string[], match: (opt: string, v: string) => boolean) => {
    const current = get(fieldKey as PAAFieldKey);
    const selected = options.find((o) => match(o, current)) || "";
    if (isFinal) {
      if (!selected) return "";
      return `
        <span data-field-key="${fieldKey}" style="display:inline-block;margin-right:24px;vertical-align:top;">
          <span style="display:inline-block;border-bottom:1px solid #B89555;padding:2px 10px 2px 2px;font-size:13px;color:#1A1A1A;font-weight:600;">${esc(selected)}</span>
          <span style="display:block;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#1A1A1A;opacity:.7;margin-top:3px;">${esc(label)}</span>
        </span>`;
    }
    return options.map((o) => `<span data-chip-key="${fieldKey}" data-chip-value="${esc(o)}" style="display:inline-block;">${radioChip(o, match(o, current))}</span>`).join("");
  };

  const periodChip = (label: string, key: string) =>
    radioChip(label, period.toLowerCase().startsWith(key.toLowerCase()));

  const exclusivityChip = (label: string) =>
    radioChip(label, get("exclusivity").toLowerCase().includes(label.toLowerCase().split(" ")[0]));

  const propTypeChip = (label: string) =>
    radioChip(label, get("property_type").toLowerCase() === label.toLowerCase());

  const furnChip = (label: string) =>
    radioChip(label, get("furnishing").toLowerCase().startsWith(label.toLowerCase().split("-")[0]));

  const statusChip = (label: string) =>
    radioChip(label, get("status_vacant_tenanted").toLowerCase() === label.toLowerCase());

  const sectionTitle = (n: number, t: string) => `
    <div style="margin:22px 0 12px;">
      <div style="font-size:13px;font-weight:700;letter-spacing:.10em;color:${ink};">${n}. ${t.toUpperCase()}</div>
    </div>`;

  // Signature blocks
  const ownerSigImg = opts.ownerSignatureUrl
    ? `<img src="${esc(opts.ownerSignatureUrl)}" alt="Authorised signature" crossorigin="anonymous" style="max-height:54px;max-width:200px;object-fit:contain;display:block;" />`
    : "";
  const ownerStampImg = opts.ownerStampUrl
    ? `<img src="${esc(opts.ownerStampUrl)}" alt="Company stamp" crossorigin="anonymous" style="position:absolute;right:-6px;top:-12px;width:88px;height:88px;object-fit:contain;opacity:.85;" />`
    : "";
  const clientSigImg = opts.clientSignatureUrl
    ? `<img src="${esc(opts.clientSignatureUrl)}" alt="Client signature" crossorigin="anonymous" style="max-height:40px;max-width:200px;object-fit:contain;display:block;" />`
    : "";

  const html = `
<div style="font-family:Inter,Arial,sans-serif;color:${ink};background:${chrome.surface};padding:44px 52px;max-width:794px;margin:0 auto;line-height:1.55;">

  ${headerHtml(chrome, get("doc_number"))}

  <div style="text-align:center;margin:8px 0 18px;">
    <h1 style="font-size:22px;font-weight:800;letter-spacing:.22em;margin:0;color:${ink};text-transform:uppercase;">
      Property Advertising Agreement
    </h1>
    <div style="width:64px;height:1px;background:#B89555;margin:10px auto 0;"></div>
  </div>
  <p style="font-size:12px;color:${ink};opacity:.78;margin:8px 0 4px;">
    As a property owner or landlord, you are partnering with <strong>JBJ Global Real Estate</strong> to advertise and represent your property for sale or lease at the best terms in the shortest time.
  </p>
  <p style="font-size:12px;color:${ink};opacity:.78;margin:0 0 4px;">
    By signing this document and providing the details below, your property will be advertised across JBJ's premium portals,
    website, social media, partner brokerages, CRM and direct outreach channels with enhanced positioning where applicable.
  </p>
  <p style="font-size:12px;color:${ink};opacity:.78;margin:0 0 4px;">
    Submitting further documents for verification ranks your listing higher in search results with the official Verified Listing badge —
    consumers are 5× more likely to enquire about verified properties.
  </p>

  ${sectionTitle(1, "Landlord / Owner Details")}
  <div>
    ${fu("Landlord's Name", get("landlord_name"), "landlord_name")}
    ${fu("Passport Number", get("passport_number"), "passport_number")}
    ${fu("Emirates ID", get("emirates_id"), "emirates_id")}
    ${fu("Mobile Number", get("mobile_number"), "mobile_number")}
    ${fu("Email Address", get("email_address"), "email_address")}
    ${fu("Nationality", get("nationality"), "nationality")}
    ${fu("Listing Consultant", get("listing_consultant"), "listing_consultant")}
    ${fu("Property Reference No.", get("property_reference_no"), "property_reference_no")}
    ${!hidden.has("expiry_date") && get("expiry_date") ? `
    <div data-field-key="expiry_date" style="margin:6px 24px 14px 0;display:inline-block;vertical-align:top;">
      <div style="display:inline-block;">${dateBox(get("expiry_date"))}</div>
      <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:${ink};opacity:.7;margin-top:5px;">Expiry Date</div>
    </div>` : ""}
  </div>

  ${sectionTitle(2, "Property Details")}
  <div data-chip-row="property_type" style="margin:4px 0 10px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;">
    ${chipRow("property_type", "Property Type", ["Villa", "Apartment", "Office", "Warehouse"], (o, v) => o.toLowerCase() === v.toLowerCase())}
    ${isFinal ? "" : `<span style="opacity:.3;margin:0 8px;">|</span>`}
    ${chipRow("furnishing", "Furnishing", ["Furnished", "Unfurnished"], (o, v) => v.toLowerCase().startsWith(o.toLowerCase().split("-")[0]))}
  </div>
  <div data-chip-row="status_vacant_tenanted" style="margin:4px 0 14px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;">
    ${chipRow("status_vacant_tenanted", "Status", ["Vacant", "Tenanted"], (o, v) => o.toLowerCase() === v.toLowerCase())}
    ${showVacatingDate ? `
      <span data-field-key="vacating_date" style="display:inline-flex;align-items:center;margin-left:12px;">
        <span style="font-size:11px;color:${ink};opacity:.7;letter-spacing:.06em;text-transform:uppercase;margin-right:8px;">Vacating Date:</span>
        ${dateBox(get("vacating_date"))}
      </span>` : ""}
  </div>

  <div>
    ${fu("Building Name", get("building_name"), "building_name")}
    ${fu("Unit", get("unit_number"), "unit_number")}
    ${fu("Plot Number", get("plot_number"), "plot_number")}
    ${fu("Street Name", get("street_name"), "street_name")}
    ${fu("Community", get("community"), "community")}
    ${fu("BUA (SqFt)", get("bua_sqft"), "bua_sqft")}
    ${fu("Plot (Sq.Ft)", get("plot_sqft"), "plot_sqft")}
    ${fu("Bedrooms", get("bedrooms"), "bedrooms")}
    ${fu("Bathrooms", get("bathrooms"), "bathrooms")}
    ${get("rental_amount") ? fu("Rental Amount", fmtMoney(get("rental_amount")), "rental_amount") : ""}
    ${get("sales_amount") ? fu("Sales Amount", fmtMoney(get("sales_amount")), "sales_amount") : ""}
    ${fu("Parking", get("parking"), "parking")}
    ${!get("status_vacant_tenanted").match(/vacant/i) === false && get("vacating_date") && !showVacatingDate
      ? `<div data-field-key="vacating_date" style="margin:6px 24px 14px 0;display:inline-block;vertical-align:top;">
           <div style="display:inline-block;">${dateBox(get("vacating_date"))}</div>
           <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:${ink};opacity:.7;margin-top:5px;">Vacating Date</div>
         </div>` : ""}
  </div>
  ${!hidden.has("additional_notes") && get("additional_notes") ? `
    <div data-field-key="additional_notes" style="margin:6px 0 14px;">
      <div style="border:1px solid ${accent};border-radius:4px;min-height:54px;padding:8px 10px;font-size:12px;color:${ink};white-space:pre-wrap;">${esc(get("additional_notes"))}</div>
      <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:${ink};opacity:.7;margin-top:3px;">Additional Notes</div>
    </div>` : ""}

  ${sectionTitle(3, "Terms and Conditions")}
  <div style="font-size:12.5px;color:${ink};line-height:1.7;">
    <div style="margin-bottom:8px;">
      1. The landlord / legal representative has agreed to appoint
      <span style="border-bottom:1px solid ${accent};padding:0 6px;font-weight:600;">${esc(get("broker_appointee_name") || JBJ_BRAND.legalCompany)}</span>
      as its:
    </div>
    <div data-chip-row="exclusivity" style="margin:6px 0 10px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;">
      ${chipRow("exclusivity", "Appointment Type", ["EXCLUSIVE", "NON EXCLUSIVE"], (o, v) => v.toLowerCase().includes(o.toLowerCase().split(" ")[0]))}
      <span style="font-size:12px;opacity:.85;margin-left:6px;">Broker to list and advertise the above property for a period of:</span>
    </div>
    <div data-chip-row="listing_period" style="margin:6px 0 14px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;">
      ${chipRow("listing_period", "Listing Period", ["1 Month", "2 Months", "3 Months", "6 Months  (Residential Sale or Commercial only)"], (o, v) => v.toLowerCase().startsWith(o.toLowerCase().split(" ")[0]))}
      ${isFinal ? "" : `
        <span style="margin:0 6px 0 8px;font-size:11px;opacity:.7;">OR UNTIL:</span>
        <span data-field-key="listing_period_until_date">${dateBox(get("listing_period_until_date"))}</span>
      `}
    </div>
    <ol style="padding-left:18px;margin:6px 0 0;">
      <li style="margin-bottom:6px;">I, the undersigned, confirm that I am the owner of the above property and / or have the legal authority to sign on behalf of the named owner(s).</li>
      <li style="margin-bottom:6px;">Should this property be subject to an offer I/we will notify the brokerage of this.</li>
      <li style="margin-bottom:6px;">This Agreement may be terminated by either party at any time upon seven (7) days written notice to the other party.</li>
    </ol>
  </div>

  ${sectionTitle(4, "Landlord")}
  <div style="display:grid;grid-template-columns:1.2fr 1.2fr 1fr;gap:0 28px;margin-top:6px;align-items:end;">
    <div>
      <div style="border-bottom:1px solid ${accent};height:44px;display:flex;align-items:flex-end;padding:0 0 4px;font-size:13px;color:${ink};">${esc(get("landlord_signature_name") || get("landlord_name"))}</div>
      <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-top:3px;">Name</div>
    </div>
    <div>
      <div style="border-bottom:1px solid ${accent};height:44px;display:flex;align-items:flex-end;padding:0 0 4px;">${clientSigImg}</div>
      <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-top:3px;">Signature</div>
    </div>
    <div>
      <div style="border-bottom:1px solid ${accent};height:44px;display:flex;align-items:flex-end;justify-content:flex-start;padding:0 0 4px;font-size:13px;color:${ink};">${esc(get("landlord_signature_date") || "")}</div>
      <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-top:3px;">Date</div>
    </div>
  </div>

  ${footerHtml(chrome)}
</div>`.trim();

  return html;
}

/* ----------------------------- form schema -------------------------------- */

export const PAA_FIELD_GROUPS: { title: string; fields: { key: PAAFieldKey; label: string; type?: "text" | "date" | "textarea" | "select" | "number" | "money"; options?: string[]; conditional?: (vals: Record<string, string>) => boolean }[] }[] = [
  {
    title: "Landlord / Owner Details",
    fields: [
      { key: "landlord_name", label: "Landlord's Name" },
      { key: "passport_number", label: "Passport Number" },
      { key: "emirates_id", label: "Emirates ID Number" },
      { key: "mobile_number", label: "Mobile Number" },
      { key: "email_address", label: "Email Address" },
      { key: "nationality", label: "Nationality" },
      { key: "listing_consultant", label: "Listing Consultant" },
      { key: "property_reference_no", label: "Property Reference No." },
      { key: "expiry_date", label: "Expiry Date", type: "date" },
    ],
  },
  {
    title: "Property Details",
    fields: [
      { key: "property_type", label: "Property Type", type: "select", options: ["Villa", "Apartment", "Office", "Warehouse"] },
      { key: "status_vacant_tenanted", label: "Status", type: "select", options: ["Vacant", "Tenanted"] },
      { key: "furnishing", label: "Furnishing", type: "select", options: ["Furnished", "Unfurnished"] },
      { key: "vacating_date", label: "Vacating Date", type: "date", conditional: (v) => !/vacant/i.test(v.status_vacant_tenanted || "") },
      { key: "building_name", label: "Building Name" },
      { key: "unit_number", label: "Unit" },
      { key: "plot_number", label: "Plot Number" },
      { key: "street_name", label: "Street Name" },
      { key: "community", label: "Community" },
      { key: "bua_sqft", label: "BUA (SqFt)", type: "number" },
      { key: "plot_sqft", label: "Plot (Sq.Ft)", type: "number" },
      { key: "bedrooms", label: "Bedrooms", type: "number" },
      { key: "bathrooms", label: "Bathrooms", type: "number" },
      { key: "rental_amount", label: "Rental Amount", type: "money" },
      { key: "sales_amount", label: "Sales Amount", type: "money" },
      { key: "parking", label: "Parking" },
      { key: "additional_notes", label: "Additional Notes", type: "textarea" },
    ],
  },
  {
    title: "Terms & Conditions",
    fields: [
      { key: "broker_appointee_name", label: "Broker Appointee" },
      { key: "exclusivity", label: "Exclusivity", type: "select", options: ["EXCLUSIVE", "NON EXCLUSIVE"] },
      { key: "listing_period", label: "Listing Period", type: "select", options: ["1 Month", "2 Months", "3 Months", "6 Months", "Until Date"] },
      { key: "listing_period_until_date", label: "Until Date (if applicable)", type: "date", conditional: (v) => /until/i.test(v.listing_period || "") },
    ],
  },
  {
    title: "Signatures",
    fields: [
      { key: "landlord_signature_name", label: "Landlord — Printed Name" },
      { key: "landlord_signature_date", label: "Landlord — Date", type: "date" },
    ],
  },
];
