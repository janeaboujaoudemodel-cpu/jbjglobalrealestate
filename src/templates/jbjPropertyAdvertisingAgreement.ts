/**
 * JBJ GLOBAL REAL ESTATE — Property Advertising Agreement (PAA)
 * v13: category-aware (leasing/selling), premium chrome (large monogram in
 * header AND footer, gradient hairline, locked/final mode that strips chip
 * placeholders), and a deep field audit covering Property Finder Form A.
 *
 * LOCKED TEMPLATE — do not modify chrome without owner approval.
 */
// v20: monogram inlined as a base64 data URI so it renders identically in
// the on-screen preview, the iframe sandbox, the html2canvas-rasterised PDF
// and any new-tab print window. Removes the "broken image" placeholder the
// owner saw in the printed PAA.
import monogramUrl from "@/assets/jbj-monogram-nobuffer.png?inline";
import {
  TRADE_LICENSE_BRAND,
  TRADE_LICENSE_LEGAL_NAME,
  TRADE_LICENSE_OFFICE,
  COMPANY_CONTACT,
} from "@/config/companyLegal";

export const JBJ_BRAND = {
  company: TRADE_LICENSE_BRAND,
  legalCompany: TRADE_LICENSE_LEGAL_NAME,
  office: TRADE_LICENSE_OFFICE,
  phone: COMPANY_CONTACT.phone,
  email: COMPANY_CONTACT.email,
  website: COMPANY_CONTACT.website,
  gold: "#B89555",
  ink: "#1A1A1A",
  monogram: monogramUrl,
} as const;

// v23: Premium chrome refresh — full JBJ wordmark logo (transparent),
// label-above-value field layout, no gold border around the legal name
// in clause 1, taller premium footer with full clickable contact set.
export const PAA_LAYOUT_VERSION = 23;

export type PAACategory = "leasing" | "selling" | "other";

export type PAAFieldKey =
  // Owner identity
  | "landlord_name" | "passport_number" | "emirates_id" | "mobile_number"
  | "email_address" | "nationality" | "listing_consultant" | "property_reference_no"
  | "expiry_date" | "owner_trn"
  // Property identifiers
  | "title_deed_number" | "title_deed_date" | "oqood_number" | "oqood_date"
  | "expected_handover" | "dewa_premise_number" | "makani_number" | "rera_permit_number"
  // Property specs
  | "property_type" | "status_vacant_tenanted" | "furnishing" | "vacating_date"
  | "building_name" | "unit_number" | "plot_number" | "street_name" | "community"
  | "tenure" | "usage"
  | "bua_sqft" | "plot_sqft" | "bedrooms" | "bathrooms"
  // Pricing & fees
  | "rental_amount" | "sales_amount" | "service_charge_per_sqft" | "maintenance_fee_aed"
  | "commission_pct" | "parking" | "additional_notes"
  // Lease specifics
  | "cheques_per_year" | "notice_period_days" | "current_tenancy_end"
  // Sale specifics
  | "chain_free" | "mortgage_status"
  // Terms
  | "exclusivity" | "listing_period" | "listing_period_until_date" | "broker_appointee_name"
  // POA
  | "poa_holder_name" | "poa_number"
  // Documents attached
  | "documents_attached"
  // Sign
  | "landlord_signature_name" | "landlord_signature_date"
  | "jbj_signature_name" | "jbj_signature_date";

export const PAA_DEFAULT_VALUES: Record<PAAFieldKey | "doc_number", string> = {
  doc_number: "",
  landlord_name: "", passport_number: "", emirates_id: "", mobile_number: "",
  email_address: "", nationality: "", listing_consultant: "", property_reference_no: "",
  expiry_date: "", owner_trn: "",
  title_deed_number: "", title_deed_date: "", oqood_number: "", oqood_date: "",
  expected_handover: "", dewa_premise_number: "", makani_number: "", rera_permit_number: "",
  property_type: "", status_vacant_tenanted: "", furnishing: "", vacating_date: "",
  building_name: "", unit_number: "", plot_number: "", street_name: "", community: "",
  tenure: "", usage: "",
  bua_sqft: "", plot_sqft: "", bedrooms: "", bathrooms: "",
  rental_amount: "", sales_amount: "", service_charge_per_sqft: "", maintenance_fee_aed: "",
  commission_pct: "", parking: "", additional_notes: "",
  cheques_per_year: "", notice_period_days: "", current_tenancy_end: "",
  chain_free: "", mortgage_status: "",
  exclusivity: "", listing_period: "", listing_period_until_date: "",
  broker_appointee_name: TRADE_LICENSE_LEGAL_NAME,
  poa_holder_name: "", poa_number: "",
  documents_attached: "",
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
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (isoMatch) return [isoMatch[3], isoMatch[2], isoMatch[1]];
  const dmy = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/.exec(raw);
  if (dmy) return [dmy[1].padStart(2, "0"), dmy[2].padStart(2, "0"), dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]];
  return ["", "", ""];
};

const dateBox = (raw: string) => {
  const [d, m, y] = fmtDateDDMMYYYY(raw);
  const cell = (v: string, ph: string) =>
    `<span style="display:inline-block;min-width:32px;text-align:center;padding:1px 4px;font-size:12px;color:${v ? "#1A1A1A" : "#1A1A1A66"};">${v || ph}</span>`;
  return `<span style="display:inline-block;border-bottom:1px solid #B89555;padding-bottom:2px;white-space:nowrap;">${cell(d, "DD")}<span style="opacity:.4;margin:0 4px;">/</span>${cell(m, "MM")}<span style="opacity:.4;margin:0 4px;">/</span>${cell(y, "YYYY")}</span>`;
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
  const safe = esc(value || "");
  // v23 LABEL-ABOVE-VALUE — label sits above the underlined value so the
  // user immediately knows what each line means (e.g. "Building Name" above
  // "Al Tajer Two", "Unit" above "1502").
  return `
  <div${dataAttr} style="margin:6px 24px 14px 0;display:inline-block;vertical-align:top;position:relative;">
    <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#1A1A1A;opacity:.7;margin-bottom:3px;">${esc(label)}</div>
    <div style="display:inline-block;border-bottom:1px solid #B89555;min-width:1ch;padding:2px 8px 2px 2px;font-size:13px;color:#1A1A1A;white-space:nowrap;">${safe || "&nbsp;"}</div>
  </div>`;
};

/* ---------------------------------- chrome -------------------------------- */

export type ChromeHeaderStyle = "monogram-wordmark" | "wordmark-only" | "crest-address" | "minimal-hairline";
export type ChromeFooterStyle = "three-column" | "centered-tagline" | "compliance-bar";

export interface TemplateChrome {
  accent?: string;
  ink?: string;
  surface?: string;
  headerStyle?: ChromeHeaderStyle;
  footerStyle?: ChromeFooterStyle;
  tagline?: string;
  trn?: string;
  license?: string;
}

export const DEFAULT_CHROME: Required<TemplateChrome> = {
  accent: "#B89555",
  ink: "#1A1A1A",
  surface: "#FFFFFF",
  headerStyle: "monogram-wordmark",
  footerStyle: "three-column",
  tagline: "DUBAI, UAE · INSTITUTIONAL REAL ESTATE",
  trn: "",
  license: "",
};

// Decorative gradient removed — chrome uses a single full-width hairline only.

// Clickable contact link helpers — premium ink/gold mix, no underline by
// default so the chrome stays clean. Used in BOTH header and footer so
// every printed phone / email / website is a real anchor.
const telHref = (raw: string) => `tel:${raw.replace(/[^\d+]/g, "")}`;
const mailHref = (raw: string) => `mailto:${raw.trim()}`;
const webHref = (raw: string) => {
  const t = raw.trim();
  return /^https?:/i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
};
const linkPhone = (color: string) =>
  `<a href="${telHref(JBJ_BRAND.phone)}" style="color:${color};text-decoration:none;font-weight:600;">${esc(JBJ_BRAND.phone)}</a>`;
const linkEmail = (color: string) =>
  `<a href="${mailHref(JBJ_BRAND.email)}" style="color:${color};text-decoration:none;">${esc(JBJ_BRAND.email)}</a>`;
const linkWebsite = (color: string, bold = false) =>
  `<a href="${webHref(JBJ_BRAND.website)}" target="_blank" rel="noopener" style="color:${color};text-decoration:none;${bold ? "font-weight:600;letter-spacing:.04em;" : ""}">${esc(JBJ_BRAND.website)}</a>`;

const titleFor = (category: PAACategory) =>
  category === "selling"
    ? "Property Advertising Agreement — Selling"
    : "Property Advertising Agreement — Leasing";

const headerHtml = (chrome: Required<TemplateChrome>, docNumber: string, category: PAACategory, reraPermit?: string) => {
  const { accent, ink, headerStyle } = chrome;
  const docBadge = docNumber
    ? `<div style="font-size:10.5px;letter-spacing:.18em;color:${ink};font-weight:600;">${esc(docNumber)}</div>`
    : "";
  const reraLine = reraPermit
    ? `<div style="font-size:10px;letter-spacing:.1em;color:${ink};opacity:.75;margin-top:3px;">RERA Permit · ${esc(reraPermit)}</div>`
    : "";
  switch (headerStyle) {
    case "wordmark-only":
      return `
        <div style="text-align:center;border-bottom:1px solid ${accent};padding-bottom:18px;margin-bottom:26px;">
          <div style="font-size:28px;letter-spacing:.26em;font-weight:800;color:${ink};">${JBJ_BRAND.company}</div>
          ${docBadge ? `<div style="margin-top:8px;font-size:12px;">${docBadge}</div>` : ""}
        </div>`;
    case "crest-address":
      return `
        <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid ${accent};padding-bottom:18px;margin-bottom:26px;">
          <div>
            <div style="width:54px;height:54px;border:1px solid ${accent};display:flex;align-items:center;justify-content:center;font-weight:800;letter-spacing:.06em;color:${ink};font-size:18px;">JBJ</div>
            <div style="font-size:22px;letter-spacing:.2em;font-weight:700;margin-top:10px;color:${ink};">${JBJ_BRAND.company}</div>
          </div>
          <div style="text-align:right;font-size:12.5px;line-height:1.5;color:${ink};opacity:.9;">
            ${docBadge}
            <div>One Central · DIFC · Dubai, UAE</div>
            <div>${JBJ_BRAND.phone}</div>
            <div>${JBJ_BRAND.email}</div>
          </div>
        </div>`;
    case "minimal-hairline":
      return `
        <div style="border-bottom:1px solid ${accent};padding-bottom:12px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-end;">
          <div style="font-size:18px;letter-spacing:.3em;font-weight:700;color:${ink};">${JBJ_BRAND.company}</div>
          ${docBadge}
        </div>`;
    case "monogram-wordmark":
    default: {
      // v20 premium chrome:
      //   • champagne (#FBF7EE) wash band so header differentiates from white body
      //   • monogram (inline base64) + legal name on baseline
      //   • office line = TRADE_LICENSE_OFFICE (Port Saeed, Deira) — never
      //     "Downtown Dubai" or "private office"
      //   • right column: doc number (ink), phone (ink), email + website (gold)
      //   • everything fits in ~120px to leave room for one-page A4
      const officeLine = JBJ_BRAND.office
        ? `<div style="font-size:9.5px;letter-spacing:.04em;color:${ink};opacity:.78;margin-top:4px;line-height:1.35;">${esc(JBJ_BRAND.office)}</div>`
        : "";
      const contactStack = `
        <div style="font-size:9.5px;line-height:1.6;text-align:right;">
          <div style="margin-bottom:1px;">${linkPhone(ink)}</div>
          <div style="margin-bottom:1px;">${linkEmail(accent)}</div>
          <div>${linkWebsite(accent, true)}</div>
        </div>`;
      const docBadgeBlock = docBadge
        ? `<div style="margin-bottom:6px;">${docBadge}</div>`
        : "";
      return `
        <div style="margin:-24px -36px 14px;background:#FBF7EE;padding:16px 36px 14px;border-bottom:1px solid ${accent};">
          <div style="display:flex;align-items:center;gap:14px;min-height:58px;">
            <img src="${JBJ_BRAND.monogram}" alt="JBJ Global Real Estate" style="width:58px;height:58px;object-fit:contain;display:block;flex:0 0 auto;" />
            <div style="flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;min-width:0;padding-left:14px;">
              <div style="font-size:15px;font-weight:700;letter-spacing:.20em;color:${ink};text-transform:uppercase;line-height:1.15;">
                ${esc(JBJ_BRAND.legalCompany)}
              </div>
              ${officeLine}
              ${reraLine ? `<div style="margin-top:3px;">${reraLine}</div>` : ""}
            </div>
            <div style="flex:0 0 auto;text-align:right;min-width:150px;">
              ${docBadgeBlock}
              ${contactStack}
            </div>
          </div>
          <div style="margin-top:14px;text-align:center;">
            <div style="font-size:14px;font-weight:800;letter-spacing:.22em;color:${ink};text-transform:uppercase;">
              ${titleFor(category).toUpperCase()}
            </div>
          </div>
        </div>`;
    }
  }
};

const footerHtml = (chrome: Required<TemplateChrome>) => {
  const { accent, ink, footerStyle, tagline, trn, license } = chrome;
  switch (footerStyle) {
    case "centered-tagline":
      return `
        <div style="margin-top:18px;padding-top:10px;border-top:1px solid ${accent};font-size:11px;color:${ink};text-align:center;letter-spacing:.18em;text-transform:uppercase;">
          <div style="font-weight:700;font-size:11.5px;">${esc(tagline)}</div>
          <div style="margin-top:5px;opacity:.85;">${linkEmail(ink)} · ${linkWebsite(ink)} · ${linkPhone(ink)}</div>
        </div>`;
    case "compliance-bar":
      return `
        <div style="margin-top:18px;padding-top:10px;border-top:1px solid ${accent};font-size:11px;color:${ink};display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div>${JBJ_BRAND.office || ""}</div>
          <div>${trn ? `TRN ${esc(trn)} · ` : ""}${license ? `LIC ${esc(license)} · ` : ""}${linkEmail(ink)} · ${linkWebsite(ink)}</div>
        </div>`;
    case "three-column":
    default: {
      // v20 premium footer: champagne band mirrors the header so the document
      // is bookended in the same surface tone. Three text columns:
      //   left   — legal name (ink) + phone (ink)
      //   center — trade-license office address (ink, .85)
      //   right  — email (gold) + website (gold)
      // Phone/email/web are real anchors (tel: / mailto: / https://). No
      // monogram in the footer (kept since v13).
      return `
        <div style="margin:14px -36px 0;background:#FBF7EE;border-top:1px solid ${accent};padding:14px 36px 14px;">
          <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.5px;color:${ink};line-height:1.55;">
            <tr>
              <td style="vertical-align:top;width:32%;padding-right:10px;">
                <div style="font-size:9.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${ink};">${esc(JBJ_BRAND.legalCompany)}</div>
                <div style="margin-top:3px;">${linkPhone(ink)}</div>
              </td>
              <td style="vertical-align:top;text-align:center;width:38%;padding:0 8px;color:${ink};opacity:.85;">
                ${JBJ_BRAND.office ? esc(JBJ_BRAND.office) : ""}
                ${trn ? `<div style="margin-top:2px;font-size:9px;letter-spacing:.06em;opacity:.85;">TRN ${esc(trn)}${license ? ` · LIC ${esc(license)}` : ""}</div>` : ""}
              </td>
              <td style="vertical-align:top;text-align:right;width:30%;padding-left:10px;">
                <div>${linkEmail(accent)}</div>
                <div style="margin-top:3px;">${linkWebsite(accent, true)}</div>
              </td>
            </tr>
          </table>
        </div>`;
    }
  }
};

/* ----------------------------- builder API -------------------------------- */

export const JBJ_PAA_TEMPLATE_ID = "jbj-property-advertising-agreement";

export interface BuildPAAOptions {
  chrome?: TemplateChrome;
  ownerSignatureUrl?: string | null;
  ownerStampUrl?: string | null;
  clientSignatureUrl?: string | null;
  hiddenFields?: string[];
  /**
   * "edit"  → show every option chip (live preview / iframe)
   * "final" → collapse single-choice chips to selected value only — strips
   *           "OR UNTIL", parenthetical hints, separators. Used after Approve.
   */
  renderMode?: "edit" | "final";
  category?: PAACategory;
}

// Clean display labels for chips in final mode (strip parens, normalize).
const FINAL_CHIP_LABEL: Record<string, string> = {
  "6 Months  (Residential Sale or Commercial only)": "6 Months",
  "6 Months (Residential Sale or Commercial only)": "6 Months",
  "NON EXCLUSIVE": "Non-Exclusive",
  "EXCLUSIVE": "Exclusive",
};
const cleanFinalLabel = (s: string) => FINAL_CHIP_LABEL[s] || s.replace(/\s*\([^)]*\)\s*$/, "").trim();

export function buildPAAHtml(
  values: Partial<Record<PAAFieldKey | "doc_number", string>> = {},
  opts: BuildPAAOptions = {},
): string {
  const v = { ...PAA_DEFAULT_VALUES, ...values };
  const get = (k: PAAFieldKey | "doc_number") => (v[k] ?? "").toString();

  const chrome: Required<TemplateChrome> = { ...DEFAULT_CHROME, ...(opts.chrome || {}) };
  const accent = chrome.accent;
  const ink = chrome.ink;
  const category: PAACategory = opts.category || "leasing";
  const isLeasing = category === "leasing";
  const isSelling = category === "selling";
  const hidden = new Set<string>(opts.hiddenFields || []);
  // Auto-hide the irrelevant amount field based on category.
  if (isLeasing) hidden.add("sales_amount");
  if (isSelling) hidden.add("rental_amount");

  const fu = (label: string, value: string, key: string) =>
    fieldUnderline(label, value, key, { hidden, force: !!value });

  // Placeholder field used in edit mode for empty identifiers — shows the
  // expected label so the section is never blank. Suppressed in final mode.
  const fuPh = (label: string, value: string, key: string) => {
    if (hidden.has(key)) return "";
    if (value) return fu(label, value, key);
    if (opts.renderMode === "final") return "";
    return `
      <div data-field-key="${key}" style="margin:6px 24px 14px 0;display:inline-block;vertical-align:top;position:relative;">
        <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:${ink};opacity:.55;margin-bottom:3px;">${esc(label)}</div>
        <div style="display:inline-block;border-bottom:1px dashed ${accent};min-width:8ch;padding:2px 8px 2px 2px;font-size:13px;color:${ink};opacity:.35;white-space:nowrap;">—</div>
      </div>`;
  };

  const dateFieldPh = (label: string, raw: string, key: string) => {
    if (hidden.has(key)) return "";
    if (raw) {
      return `
      <div data-field-key="${key}" style="margin:6px 24px 14px 0;display:inline-block;vertical-align:top;">
        <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:${ink};opacity:.7;margin-bottom:5px;">${esc(label)}</div>
        <div style="display:inline-block;">${dateBox(raw)}</div>
      </div>`;
    }
    if (opts.renderMode === "final") return "";
    return `
      <div data-field-key="${key}" style="margin:6px 24px 14px 0;display:inline-block;vertical-align:top;">
        <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:${ink};opacity:.55;margin-bottom:5px;">${esc(label)}</div>
        <div style="display:inline-block;border-bottom:1px dashed ${accent};padding:2px 8px;font-size:12px;color:${ink};opacity:.35;white-space:nowrap;">DD / MM / YYYY</div>
      </div>`;
  };
  // Smart conditionals
  const rawStatus = get("status_vacant_tenanted");
  const vacatingRaw = get("vacating_date");
  const vacatingTs = vacatingRaw ? Date.parse(vacatingRaw) : NaN;
  const hasFutureVacating = !!vacatingRaw && isFinite(vacatingTs) && vacatingTs > Date.now();
  const isVacant = rawStatus
    ? /vacant/i.test(rawStatus)
    : !hasFutureVacating;
  const isTenanted = !isVacant;
  if (!rawStatus && isTenanted) v.status_vacant_tenanted = "Tenanted";
  const isVilla = /villa/i.test(get("property_type"));
  const showVacatingDate = isTenanted && !!vacatingRaw;

  const isFinal = opts.renderMode === "final";

  const chipRow = (fieldKey: string, label: string, options: string[], match: (opt: string, v: string) => boolean) => {
    const current = get(fieldKey as PAAFieldKey);
    const selected = options.find((o) => match(o, current)) || "";
    if (isFinal) {
      if (!selected) return "";
      return `
        <span data-field-key="${fieldKey}" style="display:inline-block;margin-right:24px;vertical-align:top;">
          <span style="display:block;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:#1A1A1A;opacity:.7;margin-bottom:3px;">${esc(label)}</span>
          <span style="display:inline-block;border-bottom:1px solid #B89555;padding:2px 10px 2px 2px;font-size:13px;color:#1A1A1A;font-weight:600;">${esc(cleanFinalLabel(selected))}</span>
        </span>`;
    }
    return options.map((o) => `<span data-chip-key="${fieldKey}" data-chip-value="${esc(o)}" style="display:inline-block;">${radioChip(o, match(o, current))}</span>`).join("");
  };

  const sectionTitle = (n: number, t: string) => `
    <div style="margin:14px 0 6px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:.10em;color:${ink};">${n}. ${t.toUpperCase()}</div>
    </div>`;

  // Signatures (only render when truly signed — handled by EnvelopeDetail
  // which only passes URLs when envelope.status === "completed").
  const clientSigImg = opts.clientSignatureUrl
    ? `<img src="${esc(opts.clientSignatureUrl)}" alt="Client signature" crossorigin="anonymous" style="max-height:40px;max-width:200px;object-fit:contain;display:block;" />`
    : "";

  // POA block (only if filled)
  const poaBlock = (get("poa_holder_name") || get("poa_number"))
    ? `
      ${sectionTitle(5, "Power of Attorney")}
      <div>
        ${fu("POA Holder Name", get("poa_holder_name"), "poa_holder_name")}
        ${fu("POA Number", get("poa_number"), "poa_number")}
      </div>` : "";

  // Documents attached chips (multi-value comma-separated)
  const docsRaw = get("documents_attached");
  const docsList = docsRaw ? docsRaw.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [];
  const docsBlock = docsList.length
    ? `
      ${sectionTitle(6, "Documents Attached")}
      <div data-field-key="documents_attached" style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 12px;">
        ${docsList.map((d) => `<span style="display:inline-block;padding:3px 10px;border:1px solid ${accent};border-radius:999px;font-size:11px;color:${ink};background:#FDFBF7;">${esc(d)}</span>`).join("")}
      </div>` : "";

  // A4 page (210mm × 297mm ≈ 1123px). Wrapper is a flex column at min-height
  // A4 so the footer is pushed flush to the bottom and any blank space lives
  // ABOVE the footer divider (between signature row and footer) — never below.
  const html = `
<div style="font-family:Inter,Arial,sans-serif;color:${ink};background:${chrome.surface};padding:24px 36px 0;max-width:794px;margin:0 auto;line-height:1.45;font-size:11.5px;min-height:1123px;display:flex;flex-direction:column;box-sizing:border-box;">

  <div style="flex:0 0 auto;">
    ${headerHtml(chrome, get("doc_number"), category, get("rera_permit_number"))}
  </div>

  <div style="flex:1 1 auto;display:flex;flex-direction:column;">

  <p style="font-size:11px;color:${ink};opacity:.78;margin:4px 0 3px;line-height:1.45;">
    As a property owner or landlord, you are partnering with <strong>JBJ Global Real Estate</strong> to advertise and represent your property for ${isSelling ? "sale" : "lease"} at the best terms in the shortest time. By signing below, your property will be advertised across JBJ's premium portals, website, social media, partner brokerages, CRM and direct outreach. Submitting verification documents ranks your listing higher with the Verified badge — consumers are 5× more likely to enquire.
  </p>

  ${sectionTitle(1, "Landlord / Owner Details")}
  <div>
    ${fu("Landlord's Name", get("landlord_name"), "landlord_name")}
    ${fu("Passport Number", get("passport_number"), "passport_number")}
    ${fu("Emirates ID", get("emirates_id"), "emirates_id")}
    ${fu("Mobile Number", get("mobile_number"), "mobile_number")}
    ${fu("Email Address", get("email_address"), "email_address")}
    ${fu("Nationality", get("nationality"), "nationality")}
    ${fu("Owner TRN", get("owner_trn"), "owner_trn")}
    ${fu("Listing Consultant", (get("listing_consultant") || "").split(/\s*\/\s*/).filter(Boolean).join(", "), "listing_consultant")}
    ${fu("Property Reference No.", get("property_reference_no"), "property_reference_no")}
    ${!hidden.has("expiry_date") && get("expiry_date") ? `
    <div data-field-key="expiry_date" style="margin:6px 24px 14px 0;display:inline-block;vertical-align:top;">
      <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:${ink};opacity:.7;margin-bottom:5px;">Expiry Date</div>
      <div style="display:inline-block;">${dateBox(get("expiry_date"))}</div>
    </div>` : ""}
  </div>

  ${(() => {
    const idKeys: PAAFieldKey[] = [
      "title_deed_number","title_deed_date","oqood_number","oqood_date",
      "expected_handover","dewa_premise_number","makani_number","rera_permit_number",
    ];
    const allBlank = idKeys.every((k) => !get(k));
    if (isFinal && allBlank) return "";
    return `
  ${sectionTitle(2, "Property Identifiers")}
  <div>
    ${fuPh("Title Deed No.", get("title_deed_number"), "title_deed_number")}
    ${dateFieldPh("Title Deed Date", get("title_deed_date"), "title_deed_date")}
    ${fuPh("Oqood No.", get("oqood_number"), "oqood_number")}
    ${dateFieldPh("Oqood Date", get("oqood_date"), "oqood_date")}
    ${dateFieldPh("Expected Handover", get("expected_handover"), "expected_handover")}
    ${fuPh("DEWA Premise No.", get("dewa_premise_number"), "dewa_premise_number")}
    ${fuPh("Makani No.", get("makani_number"), "makani_number")}
    ${fuPh("RERA Permit No.", get("rera_permit_number"), "rera_permit_number")}
  </div>`;
  })()}

  ${sectionTitle(3, "Property Specs")}
  ${isFinal ? (() => {
    // Final/PDF: collapse Property Type · Furnishing · Status (· Vacating date)
    // and Tenure · Usage onto two compact inline lines, separated by a thin
    // gold middle dot. Frees ~32px of vertical space for the signature row.
    const sel = (fieldKey: PAAFieldKey, options: string[], match: (o: string, v: string) => boolean) => {
      const cur = get(fieldKey);
      const found = options.find((o) => match(o, cur));
      return found ? cleanFinalLabel(found) : "";
    };
    const ptype = sel("property_type", ["Villa","Apartment","Office","Warehouse"], (o,v)=>o.toLowerCase()===v.toLowerCase());
    const furn = sel("furnishing", ["Furnished","Unfurnished"], (o,v)=>v.toLowerCase().startsWith(o.toLowerCase().split("-")[0]));
    const stat = sel("status_vacant_tenanted", ["Vacant","Tenanted"], (o,v)=>o.toLowerCase()===v.toLowerCase());
    const tenure = sel("tenure", ["Freehold","Leasehold","Common-hold"], (o,v)=>o.toLowerCase()===v.toLowerCase());
    const usage = sel("usage", ["Residential","Commercial"], (o,v)=>o.toLowerCase()===v.toLowerCase());
    const vacBit = showVacatingDate && get("vacating_date") ? `Vacating ${esc(get("vacating_date"))}` : "";
    const dot = `<span style="color:${accent};margin:0 8px;font-weight:700;">·</span>`;
    const line1 = [ptype, furn, stat, vacBit].filter(Boolean).map(esc).join(dot);
    const line2 = [tenure, usage].filter(Boolean).map(esc).join(dot);
    return `
    ${line1 ? `<div style="margin:4px 0 ${line2 ? "4px" : "10px"};font-size:13px;color:${ink};font-weight:600;">${line1}</div>` : ""}
    ${line2 ? `<div style="margin:0 0 10px;font-size:13px;color:${ink};font-weight:600;">${line2}</div>` : ""}`;
  })() : `
  <div style="margin:4px 0 14px;display:flex;flex-wrap:wrap;align-items:center;gap:4px 6px;">
    <span data-chip-row="property_type" style="display:inline-flex;flex-wrap:wrap;align-items:center;">
      ${chipRow("property_type", "Property Type", ["Villa", "Apartment", "Office", "Warehouse"], (o, v) => o.toLowerCase() === v.toLowerCase())}
    </span>
    <span style="opacity:.3;margin:0 6px;">|</span>
    <span data-chip-row="furnishing" style="display:inline-flex;flex-wrap:wrap;align-items:center;">
      ${chipRow("furnishing", "Furnishing", ["Furnished", "Unfurnished"], (o, v) => v.toLowerCase().startsWith(o.toLowerCase().split("-")[0]))}
    </span>
    <span style="opacity:.3;margin:0 6px;">|</span>
    <span data-chip-row="status_vacant_tenanted" style="display:inline-flex;flex-wrap:wrap;align-items:center;">
      ${chipRow("status_vacant_tenanted", "Status", ["Vacant", "Tenanted"], (o, v) => o.toLowerCase() === v.toLowerCase())}
    </span>
    ${showVacatingDate ? `
      <span data-field-key="vacating_date" style="display:inline-flex;align-items:center;margin-left:10px;">
        <span style="font-size:11px;color:${ink};opacity:.7;letter-spacing:.06em;text-transform:uppercase;margin-right:8px;">Vacating:</span>
        ${dateBox(get("vacating_date"))}
      </span>` : ""}
  </div>
  <div data-chip-row="tenure" style="margin:4px 0 10px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;">
    ${chipRow("tenure", "Tenure", ["Freehold", "Leasehold", "Common-hold"], (o, v) => o.toLowerCase() === v.toLowerCase())}
    <span style="opacity:.3;margin:0 8px;">|</span>
    ${chipRow("usage", "Usage", ["Residential", "Commercial"], (o, v) => o.toLowerCase() === v.toLowerCase())}
  </div>`}
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
    ${fu("Parking", get("parking"), "parking")}
  </div>

  ${sectionTitle(4, isSelling ? "Pricing & Sale Terms" : "Pricing & Lease Terms")}
  <div>
    ${isLeasing && get("rental_amount") ? fu("Rental Amount", fmtMoney(get("rental_amount")), "rental_amount") : ""}
    ${isSelling && get("sales_amount") ? fu("Sales Amount", fmtMoney(get("sales_amount")), "sales_amount") : ""}
    ${fu("Service Charge / SqFt", get("service_charge_per_sqft") ? `AED ${esc(get("service_charge_per_sqft"))}` : "", "service_charge_per_sqft")}
    ${fu("Maintenance Fee", get("maintenance_fee_aed") ? fmtMoney(get("maintenance_fee_aed")) : "", "maintenance_fee_aed")}
    ${fu("Commission %", get("commission_pct") ? `${esc(get("commission_pct"))}%` : "", "commission_pct")}
    ${isLeasing ? fu("Cheques / Year", get("cheques_per_year"), "cheques_per_year") : ""}
    ${isLeasing ? fu("Notice Period (days)", get("notice_period_days"), "notice_period_days") : ""}
    ${isLeasing && !hidden.has("current_tenancy_end") && get("current_tenancy_end") ? `
      <div data-field-key="current_tenancy_end" style="margin:6px 24px 14px 0;display:inline-block;vertical-align:top;">
        <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:${ink};opacity:.7;margin-bottom:5px;">Current Tenancy End</div>
        <div style="display:inline-block;">${dateBox(get("current_tenancy_end"))}</div>
      </div>` : ""}
    ${isSelling ? fu("Chain Free", get("chain_free"), "chain_free") : ""}
    ${isSelling ? fu("Mortgage Status", get("mortgage_status"), "mortgage_status") : ""}
  </div>

  ${!hidden.has("additional_notes") && get("additional_notes") ? `
    <div data-field-key="additional_notes" style="margin:6px 0 14px;">
      <div style="border:1px solid ${accent};border-radius:4px;min-height:54px;padding:8px 10px;font-size:12px;color:${ink};white-space:pre-wrap;">${esc(get("additional_notes"))}</div>
      <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:${ink};opacity:.7;margin-top:3px;">Additional Notes</div>
    </div>` : ""}

  ${poaBlock}
  ${docsBlock}

  ${sectionTitle(7, "Terms and Conditions")}
  <div style="font-size:11px;color:${ink};line-height:1.5;">
    <div style="margin-bottom:8px;">
      1. The landlord / legal representative has agreed to appoint
      <span style="font-weight:600;padding:0 4px;text-decoration:underline;text-decoration-color:${accent};text-decoration-thickness:1px;text-underline-offset:4px;">${esc(get("broker_appointee_name") || JBJ_BRAND.legalCompany)}</span>
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

  <div style="margin-top:auto;padding-bottom:18px;">
  ${sectionTitle(8, "Landlord")}
  <div style="display:grid;grid-template-columns:1.2fr 1.2fr 1fr;gap:0 28px;margin-top:6px;align-items:end;">
    <div>
      <div style="height:48px;display:flex;align-items:flex-end;padding:0 0 4px;font-family:'Cormorant Garamond','Apple Chancery','Lucida Handwriting','Brush Script MT',Georgia,cursive;font-style:italic;font-weight:500;font-size:24px;color:${ink};letter-spacing:.01em;line-height:1;">${esc(get("landlord_signature_name"))}</div>
      <div style="height:1px;background:${accent};opacity:.55;"></div>
      <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-top:5px;">Name</div>
    </div>
    <div>
      <div style="height:48px;display:flex;align-items:flex-end;padding:0 0 2px;">${clientSigImg}</div>
      <div style="height:1px;background:${accent};opacity:.55;"></div>
      <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-top:5px;">Signature</div>
    </div>
    <div>
      <div style="height:48px;display:flex;align-items:flex-end;justify-content:flex-start;padding:0 0 4px;font-size:13px;color:${ink};">${esc(get("landlord_signature_date") || "")}</div>
      <div style="height:1px;background:${accent};opacity:.55;"></div>
      <div style="font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin-top:5px;">Date</div>
    </div>
  </div>
  </div>

  </div>

  <div style="flex:0 0 auto;">
    ${footerHtml(chrome)}
  </div>
</div>`.trim();

  return html;
}

/* ----------------------------- form schema -------------------------------- */

type FieldDef = { key: PAAFieldKey; label: string; type?: "text" | "date" | "textarea" | "select" | "number" | "money"; options?: string[]; conditional?: (vals: Record<string, string>) => boolean };
type FieldGroup = { title: string; fields: FieldDef[] };

export function getPaaFieldGroups(category: PAACategory = "leasing"): FieldGroup[] {
  const isLeasing = category === "leasing";
  const isSelling = category === "selling";
  const groups: FieldGroup[] = [
    {
      title: "Owner & Identity",
      fields: [
        { key: "landlord_name", label: "Landlord's Name" },
        { key: "passport_number", label: "Passport Number" },
        { key: "emirates_id", label: "Emirates ID Number" },
        { key: "mobile_number", label: "Mobile Number" },
        { key: "email_address", label: "Email Address" },
        { key: "nationality", label: "Nationality" },
        { key: "owner_trn", label: "Owner TRN (Tax)" },
        { key: "listing_consultant", label: "Listing Consultant" },
        { key: "property_reference_no", label: "Property Reference No." },
        { key: "expiry_date", label: "Expiry Date", type: "date" },
      ],
    },
    {
      title: "Property Identifiers",
      fields: [
        { key: "title_deed_number", label: "Title Deed Number" },
        { key: "title_deed_date", label: "Title Deed Date", type: "date" },
        { key: "oqood_number", label: "Oqood Number (off-plan)" },
        { key: "oqood_date", label: "Oqood Date", type: "date" },
        { key: "expected_handover", label: "Expected Handover", type: "date" },
        { key: "dewa_premise_number", label: "DEWA Premise No." },
        { key: "makani_number", label: "Makani Number" },
        { key: "rera_permit_number", label: "RERA Permit No." },
      ],
    },
    {
      title: "Property Specs",
      fields: [
        { key: "property_type", label: "Property Type", type: "select", options: ["Villa", "Apartment", "Office", "Warehouse"] },
        { key: "status_vacant_tenanted", label: "Status", type: "select", options: ["Vacant", "Tenanted"] },
        { key: "furnishing", label: "Furnishing", type: "select", options: ["Furnished", "Unfurnished"] },
        { key: "tenure", label: "Tenure", type: "select", options: ["Freehold", "Leasehold", "Common-hold"] },
        { key: "usage", label: "Usage", type: "select", options: ["Residential", "Commercial"] },
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
        { key: "parking", label: "Parking" },
      ],
    },
    {
      title: isSelling ? "Pricing & Sale Terms" : "Pricing & Lease Terms",
      fields: [
        ...(isLeasing ? [{ key: "rental_amount" as PAAFieldKey, label: "Rental Amount", type: "money" as const }] : []),
        ...(isSelling ? [{ key: "sales_amount" as PAAFieldKey, label: "Sales Amount", type: "money" as const }] : []),
        { key: "service_charge_per_sqft", label: "Service Charge / SqFt (AED)", type: "number" },
        { key: "maintenance_fee_aed", label: "Maintenance Fee (AED)", type: "money" },
        { key: "commission_pct", label: "Commission %", type: "number" },
        ...(isLeasing ? [
          { key: "cheques_per_year" as PAAFieldKey, label: "Cheques / Year", type: "number" as const },
          { key: "notice_period_days" as PAAFieldKey, label: "Notice Period (days)", type: "number" as const },
          { key: "current_tenancy_end" as PAAFieldKey, label: "Current Tenancy End", type: "date" as const },
        ] : []),
        ...(isSelling ? [
          { key: "chain_free" as PAAFieldKey, label: "Chain Free", type: "select" as const, options: ["Yes", "No"] },
          { key: "mortgage_status" as PAAFieldKey, label: "Mortgage Status", type: "select" as const, options: ["None", "Buyout", "Cash"] },
        ] : []),
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
      title: "Power of Attorney",
      fields: [
        { key: "poa_holder_name", label: "POA Holder Name" },
        { key: "poa_number", label: "POA Number" },
      ],
    },
    {
      title: "Documents Attached",
      fields: [
        { key: "documents_attached", label: "Documents (comma-separated, e.g. Passport, Emirates ID, Title Deed, NOC, POA, Tenancy Contract, Cheque copy)", type: "textarea" },
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
  return groups;
}

// Backwards-compat export — defaults to leasing.
export const PAA_FIELD_GROUPS = getPaaFieldGroups("leasing");
