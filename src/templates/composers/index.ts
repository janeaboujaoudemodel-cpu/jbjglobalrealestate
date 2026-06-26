/**
 * Document Composers
 * ------------------
 * Deterministic HTML builders for each document type. The AI's job is
 * reduced to filling in 2–3 narrative paragraphs; the STRUCTURE
 * (terms tables, commission rows, signature block, dates) is rendered
 * here so every document looks premium, fits A4, and never drifts.
 *
 * Composer contract:
 *   compose(input) → HTML body string (inserted into the locked chrome).
 *
 * NEVER include letterhead, footer, or company NAP here — the chrome
 * wraps that automatically.
 */

import { JBJ_BRAND } from "@/templates/jbjLockedChrome";
import {
  composeFormA,
  composeFormB,
  composeFormF,
  composeFormI,
  composeFormU,
  composeBrokerReferral,
} from "./reraForms";
import {
  composePartnerReferral,
  composePartnerMarketing,
  composePartnerInvestor,
  composePartnerStrategic,
  composePartnerCustom,
} from "./partnersForms";




export type CommissionRow = {
  label?: string;
  rate?: string;
  trigger?: string;
  notes?: string;
};

export type CustomField = { label: string; value: string };

export interface ComposerInput {
  templateId: string;
  /** Raw field values from the form (text fields, dates…). */
  fields: Record<string, string>;
  /** Multi-row commission table (Job Offer / Commission Agreement). */
  commissionRows?: CommissionRow[];
  /** Owner-added "Add field" pairs. */
  customFields?: CustomField[];
  /** Department (staff only). */
  department?: string;
  /** Optional AI narrative (introduction + closing). */
  aiIntro?: string;
  aiClosing?: string;
  /** Owner identity for signature block. */
  ownerName?: string;
  ownerTitle?: string;
  /** Owner signing date (string, ISO or human). Empty → blank line. */
  ownerDate?: string;
  /** Applicant signing date — usually blank (filled on sign). */
  applicantDate?: string;
  /** Additional signatories appended below the main two-column signature block. */
  extraSignatories?: Array<{ name?: string; title?: string; date?: string; label?: string }>;
  /** Custom date for the top-right of the letter. Empty → today. */
  letterDate?: string;
  /** Hide the static letter date entirely (the draggable date chip is in use). */
  hideLetterDate?: boolean;
}

const GOLD = "#B89555";
const INK = "#1A1A1A";
const CHAMPAGNE = "#F7F2EA";
const MUTED = "rgba(26,26,26,0.65)";

const todayLong = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

const WALEED_EFFECTIVE_DATE = "2026-06-20";
const WALEED_SIGNING_DATE = "2026-06-26";
const WALEED_DIRECT_PHONES = "+971 50 999 3839 · +971 54 366 2223";
const JOB_OFFER_WORKING_HOURS = "Monday to Friday: 10:00 AM – 7:00 PM\nSaturday: 11:00 AM – 4:00 PM";

const formatHumanDate = (raw?: string): string => {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
};

const esc = (s?: string) =>
  (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

const firstMatch = (source: string, ...patterns: RegExp[]): string => {
  for (const pattern of patterns) {
    const match = source.match(pattern);
    const value = (match?.[1] || match?.[0] || "").trim();
    if (value) return value.replace(/[;,]\s*$/g, "").trim();
  }
  return "";
};

const isEmiratesIdLike = (value?: string): boolean => {
  const digits = (value || "").replace(/\D+/g, "");
  return /^784\d{12}$/.test(digits);
};

const sanitizePhoneContact = (value?: string, fallback = ""): string => {
  const cleaned = (value || "").trim();
  if (!cleaned || isEmiratesIdLike(cleaned) || /\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d\b/.test(cleaned)) return fallback;
  return cleaned;
};

const safePhoneDisplay = (value?: string, fallback = WALEED_DIRECT_PHONES): string =>
  sanitizePhoneContact(value, fallback);

const stripForbiddenIdentityFragments = (value?: string): string => {
  if (!value) return "";
  return value
    .split(/[;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^(date\s*of\s*birth|dob|birth\s*date|issuing\s*date|issue\s*date|expiry\s*date|id\s*expiry|passport\s*expiry|sex)\b/i.test(part))
    .join("; ")
    .trim();
};

const cleanLegalName = (value?: string): string =>
  stripForbiddenIdentityFragments(value)
    .replace(/^\s*(?:full\s+name\s+(?:as\s+per\s+(?:id|passport)|on\s+passport)|candidate\s+name|name)\s*(?:is|:|-)?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

const isInitialOnlyName = (value?: string): boolean => /\b[A-Z]\.?\b(?:\s*[A-Z]\.?\b)+/i.test(value || "");

const mrzName = (value?: string): string => {
  const line = (value || "").split(/\n/).find((part) => /^P<|^[A-Z0-9<]{20,}$/.test(part.trim()))?.trim() || "";
  const match = line.match(/P<[A-Z]{3}([A-Z<]+)<<([A-Z<]+)/i) || line.match(/^([A-Z<]+)<<([A-Z<]+)/i);
  if (!match) return "";
  const surname = match[1].replace(/<+/g, " ").trim();
  const given = match[2].replace(/<+/g, " ").trim();
  return cleanLegalName(`${given} ${surname}`);
};

const bestLegalName = (fields: Record<string, string>, source: string): string => {
  const candidates = [
    fields.fullNameAsPerPassport,
    fields.passportFullName,
    fields.passport_name,
    fields.nameOnPassport,
    fields.fullNameAsPerId,
    fields.fullNameAsPerID,
    fields.idFullName,
    fields.emiratesIdFullName,
    fields.fullName,
    fields.nameAsPerId,
    fields.nameAsPerID,
    fields.candidateName,
    fields.recipientName,
    fields.surname && fields.givenNames ? `${fields.givenNames} ${fields.surname}` : "",
    fields.lastName && fields.firstName ? `${fields.firstName} ${fields.middleName || ""} ${fields.lastName}` : "",
    mrzName(source),
    firstMatch(source, /(?:full\s+name\s+as\s+per\s+passport|name\s+on\s+passport|passport\s+full\s+name)\s*(?:is|:|-)?\s*([^;\n]+)/i),
    firstMatch(source, /(?:full\s+name\s+as\s+per\s+id|name\s+as\s+per\s+id|candidate\s+name|full\s+name)\s*(?:is|:|-)?\s*([^;\n]+)/i),
  ]
    .map(cleanLegalName)
    .filter(Boolean)
    .filter((name) => !/^\d+$/.test(name));

  candidates.sort((a, b) => {
    const aScore = (isInitialOnlyName(a) ? 0 : 1000) + Math.min(a.length, 120) + (a.split(/\s+/).length >= 3 ? 100 : 0);
    const bScore = (isInitialOnlyName(b) ? 0 : 1000) + Math.min(b.length, 120) + (b.split(/\s+/).length >= 3 ? 100 : 0);
    return bScore - aScore;
  });
  return candidates[0] || "";
};

const identityValue = (fields: Record<string, string>, keys: string[], source: string, ...patterns: RegExp[]) => {
  const direct = keys.map((key) => fields[key]).find((value) => typeof value === "string" && value.trim()) || "";
  const cleaned = stripForbiddenIdentityFragments(direct);
  const parsed = firstMatch([direct, source].filter(Boolean).join("\n"), ...patterns);
  return (parsed || cleaned).replace(/^\s*[^:]{1,28}:\s*/, (prefix) => /number|no\.?|id|passport|nationality|address|email|phone|mobile|name/i.test(prefix) ? "" : prefix).trim();
};

const normalizeNationality = (value: string): string => {
  // UN/ISO country lists return inverted names like "Palestine, State of",
  // "Korea, Republic of", "Iran, Islamic Republic of". Strip the trailing
  // ", State of / Republic of / Kingdom of / …" tail so the document reads
  // cleanly as just the nationality/country name.
  return (value || "")
    .replace(/\s*,?\s*(state|republic|kingdom|sultanate|federation|union|emirate|principality|commonwealth|grand\s+duchy|democratic\s+republic|islamic\s+republic|people'?s\s+republic|plurinational\s+state|bolivarian\s+republic)\s+of\b\.?\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const offerIdentity = (fields: Record<string, string>) => {
  // Build a free-text "source" haystack ONLY from real values. Excluding bracketed
  // placeholder text like "[Employee Address]" or "[Nationality]" prevents the
  // identity regexes from capturing the trailing "]" and rendering "Address: ]".
  const source = Object.values(fields)
    .filter((value): value is string => typeof value === "string" && !!value.trim())
    .filter((value) => !/^\[[^\]]+\]$/.test(value.trim()))
    .join("\n");
  const rawPhone = identityValue(fields, ["recipientPhone", "phone", "phoneNumber", "mobile", "mobileNumber", "whatsapp"], source, /(?:phone|mobile|whatsapp)\s*(?:is|:|-)?\s*((?:\+971|00971|0)?[\s-]?(?:5\d|4|2|3|6|7|9)[\d\s-]{7,})/i);
  return {
    name: bestLegalName(fields, source),
    emiratesId: identityValue(fields, ["emiratesId", "idNumber", "emirates_id", "eid_number", "eid"], source, /(?:emirates\s*id(?:\s*number)?|eid(?:\s*number)?|id\s*number)\s*(?:is|:|-)?\s*(784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d)/i, /\b(784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d)\b/i),
    passport: identityValue(fields, ["passportNumber", "passport_number", "passportNo", "passport"], source, /passport(?:\s*(?:number|no\.?))?\s*(?:is|:|-)?\s*([A-Z0-9]{5,})/i),
    nationality: normalizeNationality(identityValue(fields, ["nationality", "nationalityName", "countryOfNationality"], source, /nationality\s*(?:is|:|-)?\s*([^;\n]+)/i)),
    address: identityValue(fields, ["homeAddress", "address", "home_address", "residentialAddress"], source, /(?:home|residential)?\s*address\s*(?:is|:|-)?\s*([^;\n]+)/i),
    email: identityValue(fields, ["recipientEmail", "email", "emailAddress", "email_address"], source, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i),
    phone: safePhoneDisplay(rawPhone),
  };
};

const filledOr = (value: string | undefined, fallback: string) => {
  const cleaned = stripForbiddenIdentityFragments(value);
  return cleaned || fallback;
};

const paragraph = (html: string) => `<p style="margin:0 0 12px;line-height:1.65;font-size:12.5px;color:${INK};">${html}</p>`;

const offerClause = (n: number, heading: string, body: string) => `
  <section data-pdf-section="offer-clause-${n}" style="margin:0 0 13px;page-break-inside:avoid;break-inside:avoid;">
    <h2 style="margin:0 0 5px;font-size:13px;line-height:1.35;color:${INK};font-weight:700;">${n}. ${esc(heading)}</h2>
    <p style="margin:0;line-height:1.62;font-size:12.35px;color:${INK};">${body}</p>
  </section>`;

/* ───────────── Shared building blocks ───────────── */

// X button — visible at idle (0.55 opacity), full on hover. Stripped on export.
const deleteBtn = (fieldKey?: string) =>
  `<button type="button" contenteditable="false" aria-label="Remove field" data-field-delete-control="1"${fieldKey ? ` data-field-key="${esc(fieldKey)}"` : ""} style="position:absolute;right:7px;top:50%;transform:translateY(-50%);width:20px;height:20px;border:1px solid ${GOLD}66;border-radius:999px;background:#FDFBF7;color:${INK};font-size:13px;line-height:16px;font-weight:700;opacity:0.55;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;">×</button>`;

export function termsTable(rows: Array<[string, string | undefined, string?]>, title = "Terms of Employment"): string {
  const visible = rows.filter(([, v]) => (v || "").trim());
  if (visible.length === 0) return "";
  const body = visible
    .map(
      ([k, v, fieldKey], i) => `
      <tr data-removable-field="1"${fieldKey ? ` data-field-key="${esc(fieldKey)}"` : ""} style="background:${i % 2 ? "#FDFBF7" : CHAMPAGNE};">
        <td style="position:relative;padding:9px 38px 9px 14px;border:1px solid ${GOLD}33;font-weight:600;color:${INK};width:38%;font-size:12px;">
          ${esc(k)}
          ${deleteBtn(fieldKey)}
        </td>
        <td data-field-value-cell="1" style="padding:9px 14px;border:1px solid ${GOLD}33;color:${INK};font-size:12px;white-space:pre-line;line-height:1.45;">${esc(v)}</td>
      </tr>`,
    )
    .join("");
  return `
    <table data-pdf-section="terms" style="border-collapse:collapse;width:100%;margin:14px 0 18px;font-family:Inter,system-ui,sans-serif;page-break-inside:avoid;break-inside:avoid;">
      <thead>
        <tr>
          <th colspan="2" style="text-align:left;padding:10px 14px;background:${CHAMPAGNE};border:1px solid ${GOLD};color:${INK};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">
            ${esc(title)}
          </th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;

}


export function identityTable(_rows: Array<[string, string | undefined]>): string {
  // 🔒 Deprecated as of 2026-06: identity is now woven inline via
  // `inlineIdentitySentence` directly under the greeting (contract-style
  // prose). Kept as a no-op for backwards compatibility with older
  // composers that still call it.
  return "";
}

/**
 * Contract-grade inline identity sentence. Renders fields contextually
 * ("holding Passport No. …, Emirates ID No. …, of Lebanese nationality,
 * residing at …, reachable at …") and OMITS any clause whose value is
 * missing. No expiry dates, no DOB, no sex.
 */
export function inlineIdentitySentence(fields: Record<string, string>): string {
  const id = offerIdentity(fields);
  const passport = id.passport;
  const eid = id.emiratesId;
  const nationality = id.nationality;
  const address = id.address;
  const email = id.email;
  const phone = id.phone;

  const clauses: string[] = [];
  if (passport) clauses.push(`holding Passport No. <strong>${esc(passport)}</strong>`);
  if (eid) clauses.push(`holding Emirates ID No. <strong>${esc(eid)}</strong>`);
  if (nationality) clauses.push(`with nationality recorded as <strong>${esc(nationality)}</strong>`);
  if (address) clauses.push(`residing at <strong>${esc(address)}</strong>`);

  const contactBits: string[] = [];
  if (email) contactBits.push(esc(email));
  if (phone) contactBits.push(esc(phone));

  if (clauses.length === 0 && contactBits.length === 0) return "";

  const main = clauses.length
    ? `${clauses.join(", ")}${contactBits.length ? "" : "."}`
    : "";
  const contact = contactBits.length
    ? `${clauses.length ? ", reachable at " : "Reachable at "}${contactBits.join(" · ")}.`
    : "";

  return `<p style="margin:0 0 14px;line-height:1.65;font-size:12.5px;color:${INK};">${main}${contact}</p>`;
}


export function commissionTable(rows: CommissionRow[]): string {
  // Standalone tier table — only used by non-offer composers. The Offer
  // Letter now renders tiers INSIDE the combined compensation table via
  // `compensationAndCommissionTable` below.
  const visible = (rows || []).filter(
    (r) => (r.label || "").trim() || (r.rate || "").trim() || (r.trigger || "").trim(),
  );
  if (visible.length === 0) return "";
  const body = visible
    .map(
      (r, i) => `
      <tr data-removable-field="1" data-field-key="commission" style="background:${i % 2 ? "#FDFBF7" : CHAMPAGNE};">
        <td style="position:relative;padding:9px 34px 9px 12px;border:1px solid ${GOLD}33;font-size:12px;font-weight:600;color:${INK};">${esc(r.label) || "—"}${deleteBtn("commission")}</td>
        <td style="padding:9px 12px;border:1px solid ${GOLD}33;font-size:12px;color:${INK};white-space:nowrap;">${esc(r.rate) || "—"}</td>
        <td style="padding:9px 12px;border:1px solid ${GOLD}33;font-size:12px;color:${INK};">${esc(r.trigger) || "—"}</td>
      </tr>`,
    )
    .join("");
  return `
    <table data-pdf-section="commission" style="border-collapse:collapse;width:100%;margin:6px 0 8px;font-family:Inter,system-ui,sans-serif;page-break-inside:avoid;break-inside:avoid;">
      <thead>
        <tr>
          <th colspan="3" style="text-align:left;padding:10px 14px;background:${CHAMPAGNE};border:1px solid ${GOLD};color:${INK};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">
            Commission Structure
          </th>
        </tr>
        <tr style="background:${CHAMPAGNE};">
          <th style="padding:7px 12px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:${INK};text-align:left;">Tier</th>
          <th style="padding:7px 12px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:${INK};text-align:left;">Rate</th>
          <th style="padding:7px 12px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:${INK};text-align:left;">When Paid</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
    <div data-pdf-section="commission-note" style="font-size:10.5px;color:${MUTED};margin:0 0 18px;font-style:italic;page-break-inside:avoid;break-inside:avoid;">
      Commission entitlement and payment timing are subject to the signed employment documents, UAE Federal Decree-Law No. 33 of 2021 and its Executive Regulations, and actual receipt of cleared funds by the Company from the buyer, seller, landlord, developer, client, or relevant third party.
    </div>`;

}

const formatMonthlySalary = (value?: string): string => {
  const raw = filledOr(value, "");
  if (!raw) return "";
  if (/\b(aed|per\s+month|monthly|not\s+applicable|n\/?a)\b/i.test(raw)) return raw;
  return `AED ${raw} per month`;
};

/**
 * Unified Compensation & Commission table — ONE table for the Offer Letter.
 * - Top rows: compensation terms (Basic Salary, Allowances, Payment Cycle…);
 *   empty rows are filtered out, each surviving row has its own delete X.
 * - Sub-header "Commission Tiers" followed by tier rows (Tier · Rate · When
 *   Paid). Each tier row deletable. Legal note rendered below the table.
 */
function compensationAndCommissionTable(
  termsRows: Array<[string, string | undefined, string?]>,
  tierRows: CommissionRow[],
): string {
  const terms = termsRows.filter(([, v]) => (v || "").trim());
  const tiers = (tierRows || []).filter(
    (r) => (r.label || "").trim() || (r.rate || "").trim() || (r.trigger || "").trim(),
  );
  if (terms.length === 0 && tiers.length === 0) return "";

  const termsBody = terms
    .map(
      ([k, v, fieldKey], i) => `
      <tr data-removable-field="1"${fieldKey ? ` data-field-key="${esc(fieldKey)}"` : ""} style="background:${i % 2 ? "#FDFBF7" : CHAMPAGNE};">
        <td style="position:relative;padding:9px 38px 9px 14px;border:1px solid ${GOLD}33;font-weight:600;color:${INK};width:38%;font-size:12px;">
          ${esc(k)}
          ${deleteBtn(fieldKey)}
        </td>
        <td data-field-value-cell="1" colspan="2" style="padding:9px 14px;border:1px solid ${GOLD}33;color:${INK};font-size:12px;white-space:pre-line;line-height:1.45;">${esc(v || "")}</td>
      </tr>`,
    )
    .join("");

  const tierHeader = tiers.length
    ? `<tr><th colspan="3" style="text-align:left;padding:9px 14px;background:${CHAMPAGNE};border:1px solid ${GOLD};color:${INK};font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">Commission Tiers</th></tr>
       <tr style="background:${CHAMPAGNE};">
         <th style="padding:7px 12px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:${INK};text-align:left;width:38%;">Tier</th>
         <th style="padding:7px 12px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:${INK};text-align:left;width:14%;">Rate</th>
         <th style="padding:7px 12px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:${INK};text-align:left;">When Paid</th>
       </tr>`
    : "";

  const tierBody = tiers
    .map(
      (r, i) => `
      <tr data-removable-field="1" data-field-key="commission" style="background:${i % 2 ? "#FDFBF7" : CHAMPAGNE};">
        <td style="position:relative;padding:9px 34px 9px 14px;border:1px solid ${GOLD}33;font-size:12px;font-weight:600;color:${INK};">${esc(r.label) || "—"}${deleteBtn("commission")}</td>
        <td style="padding:9px 12px;border:1px solid ${GOLD}33;font-size:12px;color:${INK};white-space:nowrap;">${esc(r.rate) || "—"}</td>
        <td style="padding:9px 12px;border:1px solid ${GOLD}33;font-size:12px;color:${INK};">${esc(r.trigger) || "—"}</td>
      </tr>`,
    )
    .join("");

  return `
    <table data-pdf-section="comp-commission" style="border-collapse:collapse;width:100%;margin:14px 0 10px;font-family:Inter,system-ui,sans-serif;page-break-inside:avoid;break-inside:avoid;">
      <thead>
        <tr>
          <th colspan="3" style="text-align:left;padding:10px 14px;background:${CHAMPAGNE};border:1px solid ${GOLD};color:${INK};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">
            Compensation &amp; Commission Structure
          </th>
        </tr>
      </thead>
      <tbody>${termsBody}${tierHeader}${tierBody}</tbody>
    </table>
    ${tiers.length ? `<div data-pdf-section="commission-note" style="font-size:10.5px;color:${MUTED};margin:0 0 18px;font-style:italic;page-break-inside:avoid;break-inside:avoid;">
      Commission entitlement and payment timing are subject to the signed employment documents, UAE Federal Decree-Law No. 33 of 2021 and its Executive Regulations, and actual receipt of cleared funds by the Company from the buyer, seller, landlord, developer, client, or relevant third party.
    </div>` : ""}`;
}

export function signatureBlock(opts: {
  ownerName?: string;
  ownerTitle?: string;
  ownerDate?: string;
  applicantName?: string;
  applicantTitle?: string;
  applicantDate?: string;
  applicantLabel?: string;
  applicantMetaRows?: Array<[string, string | undefined]>;
  extraSignatories?: Array<{ name?: string; title?: string; date?: string; label?: string }>;
}): string {
  const oName = esc(opts.ownerName || "Jane Bou Jaoude");
  const oTitle = esc(opts.ownerTitle || "Founder & CEO");
  const oDate = esc(formatHumanDate(opts.ownerDate) || todayLong());
  const aName = esc(opts.applicantName || "");
  // Pre-fill applicant Title: strip bracketed template placeholders like
  // "[Position]" so the Title row never shows a literal placeholder token.
  const rawATitle = (opts.applicantTitle || "").trim();
  const cleanedATitle = /^\[.*\]$/.test(rawATitle) ? "" : rawATitle;
  // Default applicant Title when neither the form nor the prior value
  // supplied one — pre-fills the role at the brokerage so the signature
  // block is never blank on a delivered offer letter.
  const aTitle = esc(cleanedATitle || "Real Estate Broker");
  const aDate = esc(formatHumanDate(opts.applicantDate));
  // Recipient cell title is template-aware (Second Party / Client / Guest /
  // Counterparty …) — NEVER the literal word "Recipient" and NEVER the
  // recipient's own name (the name already prints inside the cell).
  const aLabel = esc(opts.applicantLabel || "Second Party");
  // Identical row geometry on both sides — the 54px label column guarantees
  // the colons (Name: / Title: / Date:) align on the same vertical line
  // across the two signature cells.
  const linedRow = (label: string, value?: string) => `
    <div style="display:grid;grid-template-columns:54px 1fr;align-items:center;column-gap:8px;font-size:11px;color:${INK};margin-top:8px;line-height:1.3;min-height:18px;">
      <strong style="font-weight:600;white-space:nowrap;">${label}:</strong>
      <span style="display:block;min-height:18px;position:relative;min-width:0;">
        ${value ? `<span style="display:block;font-size:11px;font-family:Inter,system-ui,sans-serif;font-weight:500;letter-spacing:0;color:${INK};white-space:nowrap;max-width:230px;overflow:hidden;text-overflow:ellipsis;">${value}</span>` : ""}
      </span>
    </div>`;

  const row = (label: string, value: string) => `
    <div style="font-size:11px;color:${INK};margin-top:4px;">
      <strong style="font-weight:600;">${label}:</strong>
      ${value ? `<span style="margin-left:4px;">${value}</span>` : ""}
    </div>`;

  // The company stamp is controlled by DocumentStudio's draggable/lockable
  // stamp layer, not duplicated inside this static signature block.
  const stampOverlay = "";

  // Each cell heading carries ONE 1px gold hairline underline (single
  // underline rule). No further underlines under Name/Title/Date.
  const cell = (sigId: string, heading: string, lines: string, withStamp = false) => `
    <td data-sig-id="${sigId}" style="width:44%;vertical-align:top;padding:0 28px;position:relative;">
      <div style="height:66px;display:flex;align-items:flex-start;padding-top:12px;padding-bottom:0;margin-bottom:2px;border-bottom:1px solid ${GOLD};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};font-weight:600;">${heading}</div>
      <div style="padding-top:10px;position:relative;min-height:126px;overflow:visible;">
        ${lines}
        ${withStamp ? stampOverlay : ""}
      </div>
    </td>`;
  const gapCell = `<td style="width:12%;"></td>`;

  const ownerLines = [
    linedRow("Name", oName),
    linedRow("Title", oTitle),
    linedRow("Date", oDate),
  ].join("");

  // Recipient cell: the cell's top border IS the signature line (user signs
  // ON it). Below it we only print Name (typed legal name) and Date — the
  // literal "Signature:" row was removed to avoid a duplicate signature
  // request inside the cell.
  const applicantMeta = (opts.applicantMetaRows || [])
    .filter(([, value]) => (value || "").trim())
    .map(([label, value]) => row(label, esc(value || "")))
    .join("");
  const applicantLines = `
    ${linedRow("Name", aName)}
    ${linedRow("Title", aTitle)}
    ${linedRow("Date", aDate)}
    ${applicantMeta}
  `;

  const extras = (opts.extraSignatories || []).filter(
    (s) => (s?.name || "").trim() || (s?.title || "").trim() || (s?.date || "").trim(),
  );
  const extraRows: string[] = [];
  for (let i = 0; i < extras.length; i += 2) {
    const a = extras[i];
    const b = extras[i + 1];
    const aLines = [row("Name", esc(a?.name || "")), row("Title", esc(a?.title || "")), row("Date", esc(formatHumanDate(a?.date)))].join("");
    const bLines = b
      ? [row("Name", esc(b?.name || "")), row("Title", esc(b?.title || "")), row("Date", esc(formatHumanDate(b?.date)))].join("")
      : "";
    extraRows.push(`<tr><td colspan="3" style="height:32px;"></td></tr><tr>${cell(`extra-${i}`, esc(a?.label || "Additional Signatory"), aLines)}${gapCell}${b ? cell(`extra-${i + 1}`, esc(b?.label || "Additional Signatory"), bLines) : `<td style="width:44%;"></td>`}</tr>`);
  }

  // Owner heading is the signatory ROLE (e.g. "Authorised Signatory"),
  // NEVER the company name — the company is already in the header/footer.
  return `
    <div data-signature-block="1" data-pdf-section="signature" style="margin-top:auto;padding-top:22px;page-break-inside:avoid;break-inside:avoid;">
      <table style="width:100%;border-collapse:collapse;font-family:Inter,system-ui,sans-serif;">
        <tbody>
          <tr>
            ${cell("owner", "Authorised Signatory", ownerLines, false)}
            ${gapCell}
            ${cell("recipient", aLabel, applicantLines)}
          </tr>
          ${extraRows.join("")}
        </tbody>
      </table>
    </div>`;
}

/**
 * GLOBAL PAGE SIGNATURE RULE (locked):
 * DocumentStudio injects a slim user signature field on EVERY exported page.
 * Legacy composer strips use the same layout and are stripped before render so
 * they never duplicate the global per-page field:
 *   1. Cursive live name (Dancing Script) — the visible signature mark.
 *   2. 1px ink signature line directly underneath.
 *   3. Uppercase legal name (as per ID/passport) under the line as the caption.
 *   4. A SEPARATE 1px gold hairline page-divider rendered AFTER the strip — so
 *      the divider closes the page and nothing can be appended below.
 *
 * The literal words "Client" / "Guest" / "Initials" / "Signature" NEVER appear
 * as the label — the applicant's legal name IS the identity caption.
 *
 * The authorised signatory + stamp appear ONLY on the last page. The
 * "Page X of Y" indicator is NOT rendered inside the page — DocumentStudio
 * prints it in the champagne gap between sheets.
 *
 * `clientSignatureStrip` (alias `clientInitialsStrip` kept for back-compat) is
 * retained for old explicit-page composers; DocumentStudio is the global source
 * of truth for every current/future template.
 */
export function clientSignatureStrip(opts: {
  applicantName?: string;
  page: number;
  totalPages: number;
  /** @deprecated label is ignored — the applicant's legal name is the caption. */
  label?: string;
}): string {
  if (opts.page >= opts.totalPages) return "";
  const legalName = esc((opts.applicantName || "").trim());
  return `
    <div data-pdf-section="client-signature" data-client-signature-strip="1"
         style="margin-top:auto;padding:12px 8px 14px;
                display:flex;justify-content:flex-end;align-items:flex-end;
                font-family:Inter,system-ui,sans-serif;page-break-inside:avoid;break-inside:avoid;">
      <div style="width:310px;margin-right:18px;color:${INK};">
        <div style="display:grid;grid-template-columns:96px 1fr;align-items:end;gap:8px;margin-bottom:8px;font-size:10px;line-height:1.2;"><div style="font-weight:700;letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;">Name:</div><div style="height:20px;border-bottom:1px solid ${INK};position:relative;"><span style="position:absolute;left:6px;bottom:1px;font-size:12px;font-family:Inter,system-ui,sans-serif;font-weight:500;letter-spacing:0.01em;color:${INK};white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;">${legalName}</span></div></div>
        <div style="display:grid;grid-template-columns:96px 1fr;align-items:end;gap:8px;margin-bottom:8px;font-size:10px;line-height:1.2;"><div style="font-weight:700;letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;">Signature:</div><div style="height:22px;border-bottom:1px solid ${INK};"></div></div>
        <div style="display:grid;grid-template-columns:96px 1fr;align-items:end;gap:8px;font-size:10px;line-height:1.2;"><div style="font-weight:700;letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;">Date:</div><div style="height:18px;border-bottom:1px solid ${INK};"></div></div>
      </div>
    </div>
    <div data-page-divider="1" style="border-top:1px solid ${GOLD}B3;height:0;margin:0 8px;page-break-inside:avoid;break-inside:avoid;"></div>`;
}

// Back-compat alias — old composers import `clientInitialsStrip`.
export const clientInitialsStrip = clientSignatureStrip;



export function recipientBlock(fields: Record<string, string>, opts?: { greeting?: boolean }): string {
  const name = esc(fields.recipientName);
  if (opts?.greeting) {
    return `
      <div style="margin:6px 0 14px;font-size:12.5px;color:${INK};line-height:1.6;">
        <div style="font-weight:600;">Dear ${name || "Candidate"},</div>
      </div>`;
  }
  return `
    <div style="margin:8px 0 18px;font-size:12px;color:${INK};line-height:1.6;">
      <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};margin-bottom:3px;">To</div>
      <div style="font-weight:600;">${name || "—"}</div>
    </div>`;
}

export function dateLine(_custom?: string): string {
  // 🔒 LOCKED — intentionally returns empty string.
  // DocumentStudio chrome already prints "Generated DD Month YYYY" in the
  // top-right corner of EVERY page (see renderPageGeneratedDate). Emitting
  // a second date in the body caused two dates to overlap at the top of
  // page 2+ (owner complaint 2026-05-28). Keep the export for backward
  // compatibility with composers that still call it.
  return "";
}


export function subjectLine(text: string): string {
  return `<div style="margin:14px 0 14px;font-size:13px;font-weight:600;color:${INK};border-bottom:1px solid ${GOLD};padding-bottom:6px;">${esc(text)}</div>`;
}

export function paragraphs(text?: string): string {
  if (!text) return "";
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 12px;line-height:1.65;font-size:12.5px;color:${INK};">${esc(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

/* ───────────── Per-template composers ───────────── */

function composeJobOffer(input: ComposerInput): string {
  const f = input.fields;
  const id = offerIdentity(f);
  const candidateName = esc(filledOr(id.name || f.recipientName, "[Candidate Name]"));
  const address = esc(filledOr(id.address, "[Address]"));
  const email = esc(filledOr(id.email, "[Email]"));
  const phone = esc(safePhoneDisplay(id.phone || f.recipientPhone || f.phone || f.mobile || f.whatsapp));
  const emiratesId = esc(filledOr(id.emiratesId, "[Emirates ID Number]"));
  const passport = esc(filledOr(id.passport, "[Passport Number]"));
  const nationality = esc(filledOr(id.nationality, "[Nationality]"));
  const jobTitle = esc(filledOr(f.jobTitle, "[Job Title]"));
  const companyName = "J B J GLOBAL REAL ESTATE L.L.C S.O.C";
  // For Offer Letters, the place of work is intentionally NOT a fixed address.
  // It is the location designated by the Company from time to time. The trade-
  // licence office (Office SM1-195, Port Saeed) is only used on NDA / corporate
  // documents where a registered address is legally required.
  const placeOfWork = filledOr(f.placeOfWork || f.officeAddress, "To be designated by the Company");
  const offerEffectiveIso = WALEED_EFFECTIVE_DATE;
  const offerSigningIso = WALEED_SIGNING_DATE;
  const startDate = esc(formatHumanDate(f.startDate || WALEED_EFFECTIVE_DATE) || f.startDate || "20 June 2026");
  const workingHoursRaw = filledOr(f.workingHours, JOB_OFFER_WORKING_HOURS)
    .replace(/\s*;\s*/g, "\n")
    .replace(/(7:00\s*PM)\s+(Saturday)/i, "$1\n$2")
    .replace(/Monday\s+to\s+Saturday:\s*10:00\s*AM\s*[–-]\s*7:00\s*PM/i, JOB_OFFER_WORKING_HOURS);
  const workingHours = esc(workingHoursRaw).replace(/\n/g, "<br/>");

  const candidateIdentity = paragraph(
    `Candidate identity for this offer: <strong>${candidateName}</strong>, holding Passport No. <strong>${passport}</strong>, holding Emirates ID No. <strong>${emiratesId}</strong>, with nationality recorded as <strong>${nationality}</strong>, residing at <strong>${address}</strong>, reachable by email at <strong>${email}</strong> and by phone at <strong>${phone}</strong>.`,
  );

  const employmentTerms = termsTable(
    [
      ["Job Title", filledOr(f.jobTitle, ""), "jobTitle"],
      ["Start / Joining Date", formatHumanDate(f.startDate) || f.startDate, "startDate"],
      ["Place of Work", placeOfWork, "placeOfWork"],
      ["Working Hours", workingHoursRaw, "workingHours"],
      ["Probation Period", filledOr(f.probationPeriod || f.probation, "Up to six (6) months"), "probationPeriod"],
      ["Reporting Line", filledOr(f.reportingLine || f.reportingManager, ""), "reportingLine"],
    ],
    "Terms of Employment",
  );

  // ONE unified table for compensation + commission tiers. Empty rows
  // (e.g. Allowances / Payment Cycle when blank) are auto-filtered. The
  // "Commission Structure" summary row is intentionally omitted because
  // the tier breakdown below renders the same data with greater clarity.
  const compensationTerms = compensationAndCommissionTable(
    [
      ["Basic Salary", filledOr(formatMonthlySalary(f.salary), "Not applicable — fixed commission basis"), "salary"],
      ["Allowances", filledOr(f.allowances, ""), "allowances"],
      ["Payment Cycle", filledOr(f.paymentCycle, ""), "paymentCycle"],
    ],
    normalizeOfferCommissionRows(input.commissionRows || []),
  );
  const commissionRowsTable = ""; // merged into compensationTerms above


  // Premium prose mirror of the commission structure with the conditional
  // HR/Admin uplift and the automatic fallback to 50/50 if those duties stop.
  const commissionProse = (() => {
    const raw = (f.commission || "").trim();
    const cleaned = raw ? esc(raw).replace(/\s*\/\s*/g, "; ") : "";
    const intro = raw
      ? `Your commission entitlement is structured as follows: <strong>${cleaned}</strong>.`
      : `Your remuneration is on a <strong>fixed commission basis</strong>, with no fixed monthly base salary unless otherwise expressly agreed in writing.`;
    return `${intro} In recognition of the additional HR, administrative, and executive-assistant responsibilities the Employee will perform alongside the core sales role, the Company has agreed to an <strong>enhanced commission structure of 65% on the Employee's own direct deals and 55% on Company-sourced deals</strong>. This enhanced split is expressly conditional on the Employee continuing to discharge those HR, administrative, and assistant duties to the Company's reasonable satisfaction. Should the Employee elect to discontinue or materially reduce those additional duties, or fail to perform them, the commission split shall <strong>automatically revert to the standard 50% on direct deals and 50% on Company-sourced deals</strong>, with effect from the start of the calendar month following written notice by either party. The standard 50/50 split shall likewise apply throughout any notice or run-off period following resignation or termination, and to any deal that closes after the effective end of employment, save where the Parties have agreed otherwise in writing.`;
  })();

  // Backdated effective date for lead handling / confidential data receipt.
  // When the candidate began receiving Company leads or confidential
  // information BEFORE the formal signing date, the obligations apply
  // retroactively from that earlier date — not from the signing date.
  const leadsFromHuman = formatHumanDate(f.leadsReceivedFrom || WALEED_EFFECTIVE_DATE) || f.leadsReceivedFrom || "20 June 2026";
  const signingHuman = formatHumanDate(offerSigningIso) || offerSigningIso || "26 June 2026";
  const leadsCount = (f.leadsCountAtSigning || f.leadsCount || "approximately 310").toString().trim() || "approximately 310";
  const backdatedClause = leadsFromHuman
    ? `The Parties expressly acknowledge that, although this offer is being formally signed on <strong>${esc(signingHuman || "the date stated above")}</strong>, the Candidate has already been receiving Company leads, prospects, client data, owner/developer contacts, WhatsApp conversations, CRM access, listing material, marketing material, and confidential information from <strong>${esc(leadsFromHuman)}</strong> — including, without limitation, <strong>${esc(leadsCount)} leads</strong> and all related data, documents, contacts, communications, and materials shared with the Candidate from that date onwards. Accordingly, the Candidate's confidentiality, non-circumvention, data-protection, lead-ownership, non-solicitation, indemnity, and full-responsibility obligations under this offer (and under the related Non-Disclosure Agreement and Employment Agreement) shall apply <strong>retroactively from ${esc(leadsFromHuman)}</strong> — not from the signing date — and the Candidate is fully and personally responsible for the safekeeping, lawful use, and non-disclosure of every lead, contact, file, message, document, and piece of information received from ${esc(leadsFromHuman)} onwards. These obligations shall continue in full force from <strong>${esc(leadsFromHuman)}</strong> until written notice from the Company expressly releases the Candidate, and any leads, data, files, messages, or materials received by the Candidate from that date onwards shall be treated as Company property and governed by the protections set out in this offer and the NDA.`
    : "";

  const clauses = [
    offerClause(1, "Position", `Your position will be <strong>${jobTitle}</strong>. Your duties include, but are not limited to, real estate sales/leasing, lead handling, client follow-up, developer coordination, CRM updates, property presentations, marketing support, and any other duties reasonably assigned by the Company.`),
    offerClause(2, "Start Date", `Your expected start date is <strong>${startDate}</strong>, as also reflected in the Terms of Employment table above.`),
    offerClause(3, "Place of Work", `Your place of work shall be <strong>the location designated by the Company from time to time</strong>, together with such field visits, developer offices, client meetings, property viewings, and remote work as the Company may approve. The Company is not obliged to fix a single permanent worksite and may relocate, reassign, or rotate your worksite at its sole discretion in line with operational needs. Your standard working hours are <strong>${workingHours}</strong>, subject to UAE law and Company policy, consistent with the Terms of Employment table above.`),
    offerClause(4, "Compensation & Commission Uplift", `${commissionProse} No commission is earned unless and until the Company receives the relevant cleared commission from the developer, landlord, seller, buyer, client, or third party, unless otherwise agreed in writing. Commission entitlement is subject to the signed employment documents and to UAE Federal Decree-Law No. 33 of 2021 and its Executive Regulations.`),
    offerClause(4.1, "Company-Approved Premium Tier", `The <strong>Company-approved premium tier</strong> is not automatic. It applies only to the Employee's own direct deals after the Employee achieves at least <strong>AED 10,000,000</strong> in Company-recognised sales volume within one (1) calendar year, and only after written management approval. Once approved, eligible own direct deals may be paid at <strong>70%</strong> of the net commission actually received by the Company, calculated only on cleared funds received by the Company from the relevant developer, seller, landlord, buyer, client, or third party, after any lawful deductions, chargebacks, cancellations, reversals, taxes, portal/referral costs, or agreed transaction expenses. Company-sourced leads remain governed by the Company-sourced tier unless the Company expressly approves otherwise in writing.`),
    offerClause(5, "Probation Period", `Your employment will be subject to a probation period of <strong>${esc(f.probation || f.probationPeriod || "up to six (6) months")}</strong>, during which either party may terminate the employment in accordance with UAE law and the employment contract, as also reflected in the Terms of Employment table above.`),
    offerClause(6, "Confidentiality and Company Data", `You must keep confidential all Company information, including leads, client data, owner data, buyer data, seller data, tenant data, landlord data, developer contacts, prices, commission structures, marketing strategies, CRM data, WhatsApp leads, call recordings, email communications, photographs, videos, listing material, floor plans, brochures, documents, contracts, business methods, and internal policies.`),
    offerClause(7, "Leads and Clients", `All leads, inquiries, clients, prospects, contacts, databases, property owners, developers, landlords, sellers, buyers, tenants, and investors introduced, generated, received, accessed, assigned, or handled during your work are the exclusive business assets of the Company. You may not use, transfer, sell, leak, copy, export, screenshot, close, redirect, or complete any transaction involving Company leads or clients outside the Company, during or after employment.`),
    offerClause(8, "Conflict of Interest", `You must not work with, represent, assist, advise, own, manage, or financially participate in any competing real estate business, brokerage, marketing agency, holiday-home operator, property management company, or commission-based arrangement without the Company's prior written approval.`),
    offerClause(9, "Non-Solicitation and Non-Circumvention", `You must not solicit, approach, divert, or deal directly or indirectly with the Company's clients, leads, developers, owners, suppliers, consultants, employees, brokers, or partners for personal benefit or for any third party.`),
    offerClause(10, "Training, Onboarding and Early-Exit Reimbursement", `If you resign, abandon work, or otherwise leave the Company before completing six (6) months of continuous service, you agree, to the fullest extent permitted by applicable UAE law, to reimburse the Company for reasonable and proportionate financial costs incurred for your onboarding, training, education, mentorship, administrative setup, marketing setup, Company time investment, tools, subscriptions, materials, and Company-provided data, leads, or learning resources. The amount shall be assessed by the Company in good faith and in a fair and reasonable manner, by reference to the Company's actual expenditure, time invested, resources allocated, and the benefit already received by the Employee, excluding any amounts that cannot lawfully be recovered from an employee. After completing six (6) months of employment, ordinary onboarding or training reimbursement shall not apply unless a separate written agreement expressly provides otherwise.`),
    offerClause(11, "Misuse, Theft or Unauthorised Use of Company Information", `Any theft, copying, export, screenshotting, transfer, disclosure, diversion, deletion, concealment, unauthorised retention, or personal use of Company data, client numbers, leads, owner/developer contacts, photographs, videos, listing content, marketing material, confidential documents, CRM information, WhatsApp conversations, email records, passwords, or any other Company material is a serious breach of trust and confidentiality. If such breach causes loss, reputational harm, lost commission, regulatory exposure, client diversion, or other damage to the Company, the Employee shall be liable, to the extent permitted under UAE law, to compensate and indemnify the Company for the resulting loss, damages, costs, expenses, and lost business opportunity, with the value assessed by the Company in good faith by reference to the actual or reasonably estimated loss and the seriousness of the breach.`),
    offerClause(12, "Separation & Post-Termination Commission", `Upon resignation or termination, and throughout any notice or run-off period, the enhanced 65/55 commission uplift described in Clause 4 shall <strong>cease to apply</strong> and the commission split shall <strong>revert to the standard 50/50</strong> on both direct and Company-sourced deals. Pipeline deals that close after the effective end of employment shall be remunerated, if at all, at the standard 50/50 split and only where the Company has actually received cleared commission, in each case subject to UAE Federal Decree-Law No. 33 of 2021, its Executive Regulations, and any separate written agreement signed by the Parties.`),
    offerClause(13, "Conditional Offer", `This offer is conditional upon satisfactory completion of documentation, background verification where applicable, visa/work permit requirements where applicable, and signing all Company documents.`),
    backdatedClause ? offerClause(14, "Retroactive Effective Date for Leads & Confidential Data", backdatedClause) : "",
  ].join("");

  // Closing: greeting + "Sincerely, for and on behalf of …" ONLY.
  // The signatory Name / Title / Signature row is rendered once by
  // `signatureBlock` below — never duplicated here.
  const closing = `
    ${paragraph("Please confirm your acceptance by signing below.")}
    <div data-pdf-section="offer-closing" style="margin:16px 0 18px;page-break-inside:avoid;break-inside:avoid;color:${INK};font-size:12.5px;line-height:1.65;">
      <p style="margin:0;">Sincerely,<br/>For and on behalf of ${companyName}</p>
    </div>`;

  const offerHeaderDetails = `
    <div data-pdf-section="candidate-header" style="margin:0 0 14px;padding:0 0 10px;border-bottom:1px solid ${GOLD};font-size:12px;line-height:1.55;color:${INK};page-break-inside:avoid;break-inside:avoid;">
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:16px;margin-bottom:6px;">
        <div><strong>Candidate Name:</strong> ${candidateName}</div>
        <div style="text-align:right;white-space:nowrap;"><strong>Date:</strong> ${esc(signingHuman)}</div>
      </div>
      <div><strong>Address:</strong> ${address}</div>
      <div><strong>Email:</strong> ${email}</div>
      <div><strong>Phone / WhatsApp:</strong> ${phone}</div>
    </div>`;

  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    offerHeaderDetails,
    subjectLine(`Employment Offer – ${jobTitle}`),
    paragraph(`Dear ${candidateName},`),
    paragraph(`We are pleased to offer you the position of <strong>${jobTitle}</strong> with <strong>${companyName}</strong>, a UAE real estate agency (Trade Licence No. <strong>${JBJ_BRAND.tradeLicense}</strong>, ORN 41486), subject to the terms below and the signing of the Company’s employment contract, confidentiality agreement, policies, and any required UAE employment documentation.`),
    candidateIdentity,
    employmentTerms,
    compensationTerms,
    commissionRowsTable,
    clauses,
    closing,
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle,
      ownerDate: offerSigningIso,
      applicantName: id.name || f.recipientName,
      applicantTitle: f.jobTitle,
      applicantDate: offerSigningIso,
      applicantLabel: "Accepted by Candidate",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");
}


/* ───────────── Termination Letter ───────────── */

function composeTerminationLetter(input: ComposerInput): string {
  const f = input.fields;

  const termRows: Array<[string, string | undefined]> = [
    ["Employee Name", f.recipientName],
    ["Employee ID", f.employeeId],
    ["Position", f.jobTitle],
    ["Termination Effective Date", formatHumanDate(f.terminationDate) || f.terminationDate],
    ["Last Working Day", formatHumanDate(f.lastWorkingDay) || f.lastWorkingDay],
    ["Notice Period", f.noticePeriod],
    ["Reason for Termination", f.reason ? f.reason.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : undefined],
  ];

  const standardClauses = `
    <div style="margin:18px 0 8px;">
      <div data-pdf-section="std-terms-heading" style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:6px;margin-bottom:10px;page-break-after:avoid;break-after:avoid;">
        Standard Terms
      </div>
      <ol style="margin:0;padding-left:20px;font-size:12.6px;line-height:1.68;color:${INK};">
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Notice &amp; Effective Date.</strong> The termination takes effect on the date stated above. Where notice period is served, the Employee shall continue duties until the last working day. Where payment in lieu of notice is made, the equivalent salary shall be included in the final settlement.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Final Settlement.</strong> Within fourteen (14) calendar days of the last working day, JBJ GLOBAL REAL ESTATE shall settle all outstanding remuneration, end-of-service gratuity (if applicable under UAE Labour Law), and accrued leave balance, subject to lawful deductions.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Return of Property.</strong> The Employee must return all company property — including but not limited to access cards, keys, laptops, mobile devices, vehicles, and confidential documents — before the final settlement is released.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Confidentiality.</strong> All confidentiality, non-disclosure and non-compete obligations under the Employment Contract and any separate NDA remain in full force and effect notwithstanding termination.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>References.</strong> JBJ GLOBAL REAL ESTATE will provide factual employment verification upon written request. No detailed reference will be issued without the Employee's prior consent.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Governing Law.</strong> This notice is issued under UAE Federal Decree-Law No. 33 of 2021 on the Regulation of Labour Relations and the relevant Executive Regulations.</li>
      </ol>
    </div>`;

  const propertySection = (f.returnOfProperty || "").trim()
    ? `<div data-pdf-section="return-property" style="margin:14px 0 8px;page-break-inside:avoid;break-inside:avoid;">
         <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:6px;margin-bottom:10px;">Return of Company Property</div>
         <p style="margin:0;font-size:12px;line-height:1.65;color:${INK};">${esc(f.returnOfProperty)}</p>
       </div>`
    : "";

  const settlementSection = (f.finalSettlement || "").trim()
    ? `<div data-pdf-section="final-settlement" style="margin:14px 0 8px;page-break-inside:avoid;break-inside:avoid;">
         <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:6px;margin-bottom:10px;">Final Settlement Notes</div>
         <p style="margin:0;font-size:12px;line-height:1.65;color:${INK};">${esc(f.finalSettlement)}</p>
       </div>`
    : "";

  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    recipientBlock(f),
    subjectLine(`Notice of Termination${f.recipientName ? ` — ${f.recipientName}` : ""}`),
    paragraphs(input.aiIntro),
    termsTable(termRows),
    settlementSection,
    propertySection,
    standardClauses,
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle,
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Acknowledged by Employee",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");
}

function composeGeneric(input: ComposerInput, subject: string): string {
  const f = input.fields;
  const identityKeys = new Set(["emiratesId", "passportNumber", "homeAddress", "recipientEmail", "recipientPhone", "idNumber", "emirates_id", "eid_number", "passport_number", "passportNo", "passport", "address", "home_address", "residentialAddress", "email", "email_address", "phone", "mobile", "mobile_number"]);
  const identityRows: Array<[string, string | undefined]> = [
    ["Full Name as per ID", f.recipientName],
    ["Emirates ID Number", f.emiratesId || f.idNumber || f.emirates_id || f.eid_number],
    ["Passport Number", f.passportNumber || f.passport_number || f.passportNo || f.passport],
    ["Home Address", f.homeAddress || f.address || f.home_address || f.residentialAddress],
    ["Email Address", f.recipientEmail || f.email || f.email_address],
    ["Phone / WhatsApp", safePhoneDisplay(f.recipientPhone || f.phone || f.mobile || f.mobile_number)],
  ];
  const rows: Array<[string, string | undefined]> = [
    ...Object.entries(f).map(([k, v]) => [labelize(k), v] as [string, string | undefined]),
    ...(input.customFields || [])
      .filter((c) => (c.label || "").trim() && (c.value || "").trim())
      .map((c) => [c.label, c.value] as [string, string | undefined]),
  ].filter(([k]) => !["recipientName", "notes"].includes(unlabelize(k)) && !identityKeys.has(unlabelize(k)));
  const companyLicenceNotice = ["employment_contract", "nda", "commission_agreement", "internship_agreement", "hr_letter"].includes(input.templateId)
    ? paragraph(`<strong>${JBJ_BRAND.legalName} ${JBJ_BRAND.legalSuffix}</strong> is a UAE real estate agency operating under Trade Licence No. <strong>${JBJ_BRAND.tradeLicense}</strong> and ORN <strong>41486</strong>.`)
    : "";

  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    recipientBlock(f),
    subjectLine(subject),
    companyLicenceNotice,
    paragraphs(input.aiIntro),
    inlineIdentitySentence(f),
    termsTable(rows),
    commissionTable(input.commissionRows || []),
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle,
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Counterparty Signature",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");
}

function labelize(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}
function unlabelize(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1).replace(/\s+(.)/g, (_, c) => c.toUpperCase());
}

/* ───────────── Commission Invoice (auto-calc) ───────────── */

function composeCommissionInvoice(input: ComposerInput): string {
  const f = input.fields;
  const parseNum = (v?: string) => {
    if (!v) return 0;
    const n = parseFloat(String(v).replace(/[^\d.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
  const aed = (n: number) =>
    new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 2 }).format(n);

  const dealValue = parseNum(f.dealValue);
  const ratePct = parseNum(f.commissionRate); // % e.g. 2
  const vatPct = f.vatRate !== undefined && f.vatRate !== "" ? parseNum(f.vatRate) : 5;
  const commission = +(dealValue * (ratePct / 100)).toFixed(2);
  const vat = +(commission * (vatPct / 100)).toFixed(2);
  const total = +(commission + vat).toFixed(2);

  const calcRows = `
    <table style="border-collapse:collapse;width:100%;margin:14px 0 18px;font-family:Inter,system-ui,sans-serif;">
      <thead>
        <tr><th colspan="2" style="text-align:left;padding:10px 14px;background:${CHAMPAGNE};border:1px solid ${GOLD};color:${INK};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">Invoice Calculation</th></tr>
      </thead>
      <tbody>
        ${[
          ["Deal Value", aed(dealValue)],
          [`Commission Rate`, `${ratePct}%`],
          ["Commission (Net)", aed(commission)],
          [`VAT (${vatPct}%)`, aed(vat)],
        ].map(([k, v], i) => `
          <tr style="background:${i % 2 ? "#FDFBF7" : CHAMPAGNE};">
            <td style="padding:9px 14px;border:1px solid ${GOLD}33;font-weight:600;color:${INK};width:60%;font-size:12px;">${k}</td>
            <td style="padding:9px 14px;border:1px solid ${GOLD}33;color:${INK};font-size:12px;text-align:right;">${v}</td>
          </tr>`).join("")}
        <tr style="background:${GOLD}1A;">
          <td style="padding:11px 14px;border:1px solid ${GOLD};font-weight:700;color:${INK};font-size:13px;">Total Due</td>
          <td style="padding:11px 14px;border:1px solid ${GOLD};color:${INK};font-size:13px;text-align:right;font-weight:700;">${aed(total)}</td>
        </tr>
      </tbody>
    </table>`;

  const meta: Array<[string, string | undefined]> = [
    ["Invoice No.", f.invoiceNumber],
    ["Invoice Date", formatHumanDate(f.invoiceDate) || f.invoiceDate],
    ["Bill To", f.recipientName],
    ["Property / Deal", f.propertyRef],
    ["Payment Terms", f.paymentTerms],
  ];

  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    subjectLine(`Commission Invoice${f.invoiceNumber ? ` — ${f.invoiceNumber}` : ""}`),
    paragraphs(input.aiIntro),
    termsTable(meta),
    calcRows,
    paragraphs(input.aiClosing || "Kindly remit the total due to the brokerage bank account on file. Thank you for your business."),
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle,
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Acknowledged by Client",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");
}

/* ───────────── Holiday Home Booking (premium, non-refundable) ───────────── */

const fmtAED = (n: number) =>
  new Intl.NumberFormat("en-AE", { maximumFractionDigits: 2 }).format(n);

const parseNum = (v?: string) => {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const generateBookingId = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Array.from({ length: 4 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)],
  ).join("");
  return `JBJ-HH-${ymd}-${rand}`;
};

function composeHolidayHome(input: ComposerInput): string {
  const f = input.fields;
  const nights = parseNum(f.nights);
  const checkIn = formatHumanDate(f.checkIn) || f.checkIn || "";
  const checkOut = formatHumanDate(f.checkOut) || f.checkOut || "";
  const bookingId = (f.bookingRef && f.bookingRef.trim()) || generateBookingId();

  // ── Booking Summary (compact 2-col)
  const summaryRows: Array<[string, string | undefined]> = [
    ["Booking ID", bookingId],
    ["Booking Source", f.bookingSource],
    ["External Reference", f.externalRef],
    ["Property", f.propertyName],
    ["Address", f.propertyAddress],
    ["Unit Type", f.roomType],
    ["Unit Size", f.unitSize ? `${f.unitSize} sq ft` : undefined],
    ["Guest Name", f.recipientName],
    ["Phone / WhatsApp", safePhoneDisplay(f.guestPhone)],
    ["Number of Guests", f.guestsCount],
  ];

  // ── Stay & Quotation (5-col itemized) — fully auto-calculated.
  const nightlyRate = parseNum(f.nightlyRate);
  const accommodation = nightlyRate * nights;
  const cleaning = parseNum(f.cleaningFee);
  const deposit = parseNum(f.securityDeposit);
  const subtotal = accommodation + cleaning + deposit;

  // Auto-compute amountPaid from paymentStatus — no manual entry needed.
  const status = (f.paymentStatus || "").trim();
  let amountPaid = 0;
  if (status === "Paid in Full") amountPaid = subtotal;
  else if (status === "Partial Payment") amountPaid = parseNum(f.paidNow);
  else amountPaid = 0; // Pending / unset
  const balance = Math.max(0, subtotal - amountPaid);

  const qRow = (item: string, dates: string, qty: string, rate: string, amount: string, opts?: { strong?: boolean; accent?: boolean }) => {
    const bg = opts?.accent ? `${GOLD}1A` : "#FDFBF7";
    const fw = opts?.strong ? "700" : "400";
    return `
      <tr style="background:${bg};">
        <td style="padding:8px 10px;border:1px solid ${GOLD}33;font-size:11.5px;color:${INK};font-weight:${opts?.strong ? "700" : "600"};">${esc(item)}</td>
        <td style="padding:8px 10px;border:1px solid ${GOLD}33;font-size:11px;color:${INK};">${esc(dates)}</td>
        <td style="padding:8px 10px;border:1px solid ${GOLD}33;font-size:11px;color:${INK};text-align:center;">${esc(qty)}</td>
        <td style="padding:8px 10px;border:1px solid ${GOLD}33;font-size:11px;color:${INK};text-align:right;">${esc(rate)}</td>
        <td style="padding:8px 10px;border:1px solid ${GOLD}33;font-size:11.5px;color:${INK};text-align:right;font-weight:${fw};">${esc(amount)}</td>
      </tr>`;
  };

  const quotation = `
    <table data-pdf-section="quotation" style="border-collapse:collapse;width:100%;margin:6px 0 18px;font-family:Inter,system-ui,sans-serif;page-break-inside:avoid;break-inside:avoid;">
      <thead>
        <tr>
          <th colspan="5" style="text-align:left;padding:10px 14px;background:${CHAMPAGNE};border:1px solid ${GOLD};color:${INK};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">
            Stay &amp; Quotation
          </th>
        </tr>
        <tr style="background:${CHAMPAGNE};">
          <th style="padding:7px 10px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:${INK};text-align:left;">Item</th>
          <th style="padding:7px 10px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:${INK};text-align:left;">Dates</th>
          <th style="padding:7px 10px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:${INK};text-align:center;">Qty</th>
          <th style="padding:7px 10px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:${INK};text-align:right;">Rate (AED)</th>
          <th style="padding:7px 10px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:${INK};text-align:right;">Amount (AED)</th>
        </tr>
      </thead>
      <tbody>
        ${qRow(
          "Accommodation",
          checkIn && checkOut ? `${checkIn} → ${checkOut}` : "—",
          nights ? `${nights} ${nights === 1 ? "night" : "nights"}` : "—",
          nightlyRate ? fmtAED(nightlyRate) : "—",
          accommodation ? fmtAED(accommodation) : "—",
        )}
        ${cleaning ? qRow("Cleaning Fee", "—", "—", "—", fmtAED(cleaning)) : ""}
        ${deposit ? qRow("Security Deposit (refundable)", "—", "—", "—", fmtAED(deposit)) : ""}
        ${qRow("Total Invoice", "", "", "", fmtAED(subtotal), { strong: true })}
        ${qRow(
          "Amount Paid",
          [
            formatHumanDate(f.paymentDate) || f.paymentDate || "",
            f.paymentMethod ? `via ${f.paymentMethod}` : "",
            status || "Pending",
          ].filter(Boolean).join(" · ") || "—",
          "",
          "",
          amountPaid ? `(${fmtAED(amountPaid)})` : "—",
          { strong: true },
        )}
        ${qRow(
          "Balance Due",
          f.balanceDueDate ? `due ${formatHumanDate(f.balanceDueDate) || f.balanceDueDate}` : (balance ? "due on arrival" : "—"),
          "",
          "",
          fmtAED(balance),
          { strong: true, accent: true },
        )}
      </tbody>
    </table>`;

  const guestName = esc(f.recipientName || "");
  const idType = esc(f.idType || "Emirates ID Holder");
  const idNumber = esc(f.idNumber || "784-XXXX-XXXXXXX-X");
  const nationality = esc(f.nationality || "—");
  const bookingDateStr = formatHumanDate(f.bookingDate) || formatHumanDate(new Date().toISOString()) || "—";

  const pageFrame = (children: string, page: 1 | 2 | 3) => `
    <div data-holiday-page="${page}" style="height:100%;display:flex;flex-direction:column;justify-content:space-between;gap:${page === 1 ? 16 : 14}px;">
      ${children}
    </div>`;


  const guestCard = `
    <div data-pdf-section="guest-card" style="margin:0;border:1px solid ${GOLD};background:${CHAMPAGNE};">
      <div style="padding:12px 16px;border-bottom:1px solid ${GOLD}66;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;">
        Guest &amp; Booking Profile
      </div>
      <table style="border-collapse:collapse;width:100%;font-family:Inter,system-ui,sans-serif;">
        <tbody>
          ${(() => {
            const rows: Array<[string, string]> = [
              ["Booking ID", bookingId],
              ["Guest Full Name", f.recipientName || "—"],
              ["ID Type", idType],
              ["ID Number", idNumber],
              ["Nationality", nationality],
              ["Phone / WhatsApp", safePhoneDisplay(f.guestPhone, "—") || "—"],
              ["Date of Booking", bookingDateStr],
              ["Property / Unit", [f.propertyName, f.roomType].filter(Boolean).join(" — ") || "—"],
              ["Check-in", checkIn || "—"],
              ["Check-out", checkOut || "—"],
              ["Nights", nights ? String(nights) : "—"],
              ["Guests", f.guestsCount || "—"],
            ];
            const pairs: string[] = [];
            for (let i = 0; i < rows.length; i += 2) {
              const a = rows[i]; const b = rows[i + 1];
              pairs.push(`
                <tr style="background:${(i / 2) % 2 ? "#FDFBF7" : "transparent"};">
                  <td style="padding:7px 12px;font-size:9.2px;text-transform:uppercase;letter-spacing:0.13em;color:${INK};opacity:.68;width:20%;">${esc(a[0])}</td>
                  <td style="padding:7px 12px;font-size:11.4px;color:${INK};font-weight:650;width:30%;">${esc(a[1])}</td>
                  <td style="padding:7px 12px;font-size:9.2px;text-transform:uppercase;letter-spacing:0.13em;color:${INK};opacity:.68;width:20%;border-left:1px solid ${GOLD}33;">${b ? esc(b[0]) : ""}</td>
                  <td style="padding:7px 12px;font-size:11.4px;color:${INK};font-weight:650;width:30%;">${b ? esc(b[1]) : ""}</td>
                </tr>`);
            }
            return pairs.join("");
          })()}
        </tbody>
      </table>
    </div>`;

  const termClauses = [
    `<strong>Non-Refundable Booking.</strong> The Guest acknowledges that the total amount paid above is <strong>strictly non-refundable</strong> under any circumstances, including cancellation, no-show, early check-out, travel disruption, visa issues, illness, change of plans or force-majeure events. The unit has been reserved and removed from public availability solely for the Guest.`,
    `<strong>No Refund · No Credit.</strong> No partial refund, monetary credit, date change, transfer, or substitution will be issued once payment is received. The Guest expressly waives any right to claim a refund.`,
    `<strong>Full Release of Liability.</strong> The Guest hereby <strong>fully releases, indemnifies and holds harmless JBJ GLOBAL REAL ESTATE L.L.C — S.O.C</strong>, its owners, officers, employees, agents and affiliates from any and all liability, claims, damages, losses, theft, personal injury, property damage, illness, or consequential loss arising before, during or after the stay. JBJ acts solely as booking facilitator and assumes <strong>no responsibility</strong> for the condition, suitability, services, utilities, neighbours, building management, or any incident occurring on the premises.`,
    `<strong>Damage &amp; Property Condition.</strong> The Guest is <strong>fully liable for the full cost of repair or replacement</strong> of any damage, breakage, loss or theft affecting the unit, furniture, appliances, fixtures, finishes or common areas — whether caused by the Guest, co-occupants, visitors, or any person admitted by the Guest. Damages are charged at full market / replacement cost <strong>plus a 15% handling fee</strong>.`,
    `<strong>Overstay &amp; Unauthorised Occupation.</strong> If the Guest fails to vacate at the agreed check-out time without prior written extension, the Guest shall pay <strong>AED 1,500 per day or 2× the nightly rate, whichever is higher</strong>, plus all legal, eviction, locksmith and enforcement costs.`,
    `<strong>Conduct of Guests &amp; Visitors.</strong> The Guest is <strong>fully responsible for the conduct, safety and compliance of every co-occupant and visitor</strong> admitted to the property, and indemnifies JBJ against any claim arising from their actions. Maximum occupancy may not be exceeded; subletting, re-listing or commercial use is strictly prohibited.`,
    `<strong>House Rules &amp; Policy Adherence.</strong> The Guest agrees to <strong>read, respect and abide by all house rules, building by-laws, community regulations and UAE laws</strong> at all times. No parties, no events, no smoking indoors, no unregistered guests, and no pets unless explicitly approved in writing. Quiet hours are 10:00 PM – 8:00 AM.`,
    `<strong>Check-in / Check-out.</strong> Check-in 3:00 PM · Check-out 12:00 PM. Late check-out is charged at one (1) additional night. Keys must be returned in person or via the secure key-box. Lost keys / access cards are charged at cost.`,
    `<strong>Security Deposit.</strong> A refundable security deposit, where collected, is returned within fourteen (14) days post check-out subject to inspection and deduction of any damages, missing items, cleaning fees or unpaid charges.`,
    `<strong>Governing Law.</strong> This Agreement is governed by the laws of the United Arab Emirates and the Emirate of Dubai. Any dispute is subject to the exclusive jurisdiction of Dubai Courts.`,
    `<strong>Acknowledgement.</strong> By signing below, the Guest confirms they have <strong>read, understood and accepted</strong> all terms above, and that payment has been made <strong>voluntarily and irrevocably</strong>.`,
  ];
  const allTerms = `
    <div data-pdf-section="terms" style="margin:0;">
      <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:8px;margin-bottom:14px;">
        Terms &amp; Conditions — Booking, Payment, Liability &amp; Stay Rules
      </div>
      <ol start="1" style="margin:0;padding-left:22px;font-size:12.4px;line-height:1.62;color:${INK};">
        ${termClauses.map((clause, i) => `<li style="margin-bottom:${i === termClauses.length - 1 ? 0 : 8}px;">${clause}</li>`).join("")}
      </ol>
    </div>`;

  const guestLegalName = esc((f.recipientName || "").trim() || "[FULL NAME AS PER ID / PASSPORT]");
  const acknowledgement = `
    <div data-pdf-section="acknowledgement" style="margin:0;padding:18px 22px;border:1px solid ${GOLD};background:${CHAMPAGNE};">
      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;margin-bottom:12px;text-align:center;">Acknowledgement &amp; Declaration</div>
      <p style="margin:0;font-size:12.4px;line-height:1.7;color:${INK};text-align:center;">
        I, <strong>${guestLegalName}</strong>, hereby agree to all the terms and conditions provided by
        <strong>JBJ GLOBAL REAL ESTATE L.L.C — S.O.C</strong>. I confirm that I have fully read and understood
        every clause above, that I am <strong>solely responsible</strong> for reading and understanding them,
        and that I sign below with my <strong>full, free and informed decision and consent</strong>.
      </p>
    </div>`;

  const signature = signatureBlock({
    ownerName: input.ownerName,
    ownerTitle: input.ownerTitle,
    ownerDate: input.ownerDate,
    applicantName: f.recipientName,
    applicantDate: input.applicantDate,
    applicantLabel: "Guest Signature",
    extraSignatories: input.extraSignatories,
  });

  const welcome = `
    <div data-pdf-section="welcome" style="margin:0;font-size:13.5px;color:${INK};line-height:1.78;">
      <p style="margin:0 0 14px;font-size:15px;"><strong>Dear ${guestName || "Distinguished Guest"},</strong></p>
      <p style="margin:0 0 13px;">On behalf of the entire team at <strong>JBJ GLOBAL REAL ESTATE L.L.C — S.O.C</strong>, it is our distinct privilege to welcome you to one of Dubai's most refined holiday residences. We are deeply honoured by the trust you have placed in us and remain wholeheartedly committed to ensuring that every detail of your stay reflects the quiet excellence, comfort and discretion our guests expect of the JBJ name.</p>
      <p style="margin:0 0 13px;">The pages that follow set out, in full transparency, the profile of your reservation, the financial summary of your stay, the obligations applicable to your residency, and the formal declaration required to confirm your booking.</p>
      <p style="margin:0;">Should you require any assistance at any moment of your stay, our concierge team is at your full disposal — 24 hours a day — through the contact channels printed in the footer of this document.</p>
    </div>`;

  // ── Locked 3-page layout. Page 1 = letter + guest profile + quotation only.
  //    Page 2 = full terms & conditions only. Page 3 = acknowledgement/disclaimer
  //    centered, then aligned authorised-signatory + guest signature side-by-side
  //    with company stamp. Footer renders on the final page only.
  // The `data-locked-pages="1"` flag on the first section instructs the global
  // Document Studio auto-paginator to honour these explicit pages verbatim.
  const page1 = `
    <section data-pdf-page="1" data-locked-pages="1">
      ${pageFrame(`${input.hideLetterDate ? "" : dateLine(input.letterDate)}${subjectLine(`Holiday Home Booking Agreement — ${bookingId}`)}${welcome}${guestCard}${quotation}`, 1)}
    </section>`;

  const page2 = `
    <section data-pdf-page="2">
      ${pageFrame(`<div style="display:flex;flex-direction:column;gap:18px;">${allTerms}</div>`, 2)}
    </section>`;

  const page3 = `
    <section data-pdf-page="3">
      ${pageFrame(`<div style="display:flex;flex-direction:column;gap:26px;justify-content:center;flex:1;">${acknowledgement}${signature}${paragraphs(input.aiClosing)}</div>`, 3)}
    </section>`;

  return [page1, page2, page3].join("");
}




/* ───────────── Facility Management Agreement ───────────── */

function composeFacilityManagement(input: ComposerInput): string {
  const f = input.fields;

  const contractRows: Array<[string, string | undefined]> = [
    ["Client / Owner", f.recipientName],
    // ID / Trade Licence intentionally removed from body — captured in email only
    ["Property", f.propertyName],
    ["Address", f.propertyAddress],
    ["Units Under Management", f.unitsCount],
    ["Total Managed Area", f.totalArea ? `${f.totalArea} sq ft` : undefined],
    ["Start Date", formatHumanDate(f.startDate) || f.startDate],
    ["End Date", formatHumanDate(f.endDate) || f.endDate],
    ["Contract Term", f.term],
    ["Monthly Management Fee", f.monthlyFee ? `AED ${f.monthlyFee}` : undefined],
    ["Payment Terms", f.paymentTerms],
    ["Emergency Response SLA", f.responseTime],
  ];

  const scope = (f.scope || "").trim()
    ? `<div data-pdf-section="scope" style="margin:14px 0 8px;page-break-inside:avoid;break-inside:avoid;">
         <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:6px;margin-bottom:10px;">Scope of Services</div>
         <p style="margin:0;font-size:12px;line-height:1.65;color:${INK};">${esc(f.scope)}</p>
       </div>`
    : "";

  const standardTerms = `
    <div style="margin:18px 0 8px;">
      <div data-pdf-section="std-terms-heading" style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:6px;margin-bottom:10px;page-break-after:avoid;break-after:avoid;">
        Standard Terms
      </div>
      <ol style="margin:0;padding-left:20px;font-size:12.6px;line-height:1.68;color:${INK};">
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Appointment.</strong> The Client appoints JBJ GLOBAL REAL ESTATE L.L.C — S.O.C as the exclusive facility manager of the Property for the term stated above.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Services.</strong> Services are delivered as per the Scope above, in accordance with industry best practices and UAE regulations.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Fees &amp; Payment.</strong> The monthly management fee is due in advance per the Payment Terms. Late payments accrue 2% per month. Out-of-scope works are quoted separately and require written approval before commencement.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Vendor Coordination.</strong> JBJ coordinates third-party vendors (cleaning, MEP, security) on the Client's behalf. The Client remains responsible for vendor fees at cost plus any agreed management margin.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Reporting.</strong> Monthly performance reports including financials, maintenance tickets and SLA compliance are issued within seven (7) business days of month-end.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Liability.</strong> JBJ's aggregate liability is capped at three (3) months' management fees. JBJ is not liable for force-majeure events, pre-existing defects, or acts of third-party vendors beyond reasonable supervision.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Term &amp; Termination.</strong> Either party may terminate with sixty (60) days' written notice. Outstanding fees and reimbursables remain payable upon termination.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Confidentiality.</strong> Both parties maintain strict confidentiality of commercial and tenant information shared during the engagement.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Governing Law.</strong> This Agreement is governed by the laws of the UAE and the Emirate of Dubai. Disputes fall under the exclusive jurisdiction of Dubai Courts.</li>
      </ol>
    </div>`;



  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    subjectLine(`Facility Management Agreement${f.propertyName ? ` — ${f.propertyName}` : ""}`),
    paragraphs(input.aiIntro),
    termsTable(contractRows),
    scope,
    standardTerms,
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle,
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Accepted by Client",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");
}

/* ───────────── Candidate CV (locked recruiting template) ───────────── */

function composeCandidateCv(input: ComposerInput): string {
  const f = input.fields;
  const name = esc(f.candidateName || f.recipientName || "Candidate");
  const position = esc(f.positionApplied || "");
  const contactBits = [
    f.email && `<a href="mailto:${esc(f.email)}" style="color:${INK};text-decoration:none;">${esc(f.email)}</a>`,
    f.phoneE164 && esc(safePhoneDisplay(f.phoneE164)),
    f.location && esc(f.location),
    f.nationality && esc(f.nationality),
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  const header = `
    <div data-pdf-section="cv-header" style="margin:0 0 18px;padding:0 0 14px;border-bottom:1px solid ${GOLD};page-break-inside:avoid;break-inside:avoid;">
      <div style="font-size:22px;font-weight:700;color:${INK};letter-spacing:0.02em;line-height:1.15;">${name}</div>
      ${position ? `<div style="margin-top:4px;font-size:12px;color:${MUTED};letter-spacing:0.16em;text-transform:uppercase;">Applied for · ${position}</div>` : ""}
      ${contactBits ? `<div style="margin-top:10px;font-size:11.5px;color:${INK};line-height:1.55;">${contactBits}</div>` : ""}
    </div>`;

  const sectionHeading = (label: string) => `
    <div style="font-size:10.5px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD}55;padding-bottom:4px;margin:0 0 8px;">${esc(label)}</div>`;

  const summary = (f.aiSummary || input.aiIntro || "").trim()
    ? `<div data-pdf-section="cv-summary" style="margin:0 0 18px;page-break-inside:avoid;break-inside:avoid;">
         ${sectionHeading("Executive Summary")}
         <p style="margin:0;font-size:12px;line-height:1.65;color:${INK};">${esc(f.aiSummary || input.aiIntro || "").replace(/\n/g, "<br/>")}</p>
       </div>`
    : "";

  const meta: Array<[string, string | undefined]> = [
    ["Years of Experience", f.experienceYears],
    ["Languages", f.languages],
  ];
  const metaRows = meta.filter(([, v]) => (v || "").trim());
  const facts = metaRows.length > 0
    ? `<div data-pdf-section="cv-facts" style="margin:0 0 18px;page-break-inside:avoid;break-inside:avoid;">
         ${sectionHeading("Snapshot")}
         <table style="border-collapse:collapse;width:100%;font-family:Inter,system-ui,sans-serif;">
           <tbody>${metaRows.map(([k, v], i) => `
             <tr style="background:${i % 2 ? "#FDFBF7" : CHAMPAGNE};">
               <td style="padding:7px 12px;border:1px solid ${GOLD}33;font-weight:600;color:${INK};width:38%;font-size:11.5px;">${esc(k)}</td>
               <td style="padding:7px 12px;border:1px solid ${GOLD}33;color:${INK};font-size:11.5px;">${esc(v!)}</td>
             </tr>`).join("")}</tbody>
         </table>
       </div>`
    : "";

  const renderSkills = (raw?: string) => {
    if (!raw || !raw.trim()) return "";
    const items = raw.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    if (!items.length) return "";
    return `<div data-pdf-section="cv-skills" style="margin:0 0 18px;page-break-inside:avoid;break-inside:avoid;">
      ${sectionHeading("Key Skills")}
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${items.map(s => `<span style="display:inline-block;padding:4px 10px;border:1px solid ${GOLD}66;border-radius:999px;font-size:11px;color:${INK};background:${CHAMPAGNE};">${esc(s)}</span>`).join("")}
      </div>
    </div>`;
  };

  const renderParagraphs = (label: string, raw?: string, anchor = "cv-experience") => {
    if (!raw || !raw.trim()) return "";
    const blocks = raw.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
    if (!blocks.length) return "";
    return `<div data-pdf-section="${anchor}-wrap" style="margin:0 0 18px;page-break-inside:avoid;break-inside:avoid;">
      ${sectionHeading(label)}
      ${blocks.map(b => `<div data-pdf-section="${anchor}" style="margin:0 0 10px;padding:0;font-size:12px;line-height:1.6;color:${INK};page-break-inside:avoid;break-inside:avoid;">${esc(b).replace(/\n/g, "<br/>")}</div>`).join("")}
    </div>`;
  };

  const refLink = (f.referenceCvUrl || "").trim()
    ? `<div data-pdf-section="cv-source" style="margin:14px 0 0;padding:10px 14px;border:1px dashed ${GOLD}66;background:${CHAMPAGNE};font-size:11px;color:${MUTED};page-break-inside:avoid;break-inside:avoid;">
         Source CV on file: <a href="${esc(f.referenceCvUrl)}" style="color:${INK};">${esc(f.referenceCvUrl)}</a>
       </div>`
    : "";

  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    header,
    summary,
    facts,
    renderParagraphs("Experience", f.experienceHistory, "cv-experience"),
    renderSkills(f.skills),
    renderParagraphs("Education", f.education, "cv-education"),
    paragraphs(input.aiClosing),
    refLink,
  ].join("");
}

/* ───────────── Dispatcher ───────────── */

export function compose(input: ComposerInput): string {
  switch (input.templateId) {
    case "job_offer":
      return composeJobOffer(input);
    case "employment_contract":
      return composeGeneric(input, `Employment Contract — ${input.fields.jobTitle || ""}`);
    case "warning_letter":
      return composeGeneric(input, `Formal Notice — ${input.fields.recipientName || ""}`);
    case "termination_letter":
      return composeTerminationLetter(input);
    case "nda":
      return composeNda(input);
    case "commission_agreement":
      return composeGeneric(input, `Commission Agreement — ${input.fields.recipientName || ""}`);
    case "commission_invoice":
      return composeCommissionInvoice(input);
    case "internship_agreement":
      return composeGeneric(input, `Internship Agreement — ${input.fields.recipientName || ""}`);
    case "hr_letter":
      return composeGeneric(input, `HR Letter — ${input.fields.recipientName || ""}`);
    case "partnership_referral":
      return composeGeneric(input, `Partnership / Referral Agreement`);
    case "candidate_cv":
      return composeCandidateCv(input);
    case "form_a":
      return composeFormA(input);
    case "form_b":
      return composeFormB(input);
    case "form_f":
      return composeFormF(input);
    case "form_i":
      return composeFormI(input);
    case "form_u":
      return composeFormU(input);
    case "broker_referral":
      return composeBrokerReferral(input);
    case "paa":
      return composeGeneric(input, `Property Advertising Agreement`);
    case "tenancy_addendum":
      return composeGeneric(input, `Tenancy Contract Addendum`);
    case "holiday_home_agreement":
      return composeHolidayHome(input);
    case "facility_management_agreement":
      return composeFacilityManagement(input);
    case "partner_referral":
      return composePartnerReferral(input);
    case "partner_marketing":
      return composePartnerMarketing(input);
    case "partner_investor":
      return composePartnerInvestor(input);
    case "partner_strategic":
      return composePartnerStrategic(input);
    case "partner_custom":
      return composePartnerCustom(input);
    default:
      return composeGeneric(input, input.fields.subject || "Document");
  }
}



/** Pre-seeded commission rows for HR/broker offers. */
export const DEFAULT_BROKER_COMMISSIONS: CommissionRow[] = [
  { label: "Direct deals", rate: "65%", trigger: "Own direct deals, paid after JBJ Global Real Estate LLC SOC receives the cleared commission", notes: "Enhanced while HR, admin and assistant duties are performed" },
  { label: "Company-sourced leads", rate: "55%", trigger: "Company source leads, paid after JBJ Global Real Estate LLC SOC receives the cleared commission", notes: "Enhanced while HR, admin and assistant duties are performed" },
  { label: "Company-approved premium tier · direct deals", rate: "70%", trigger: "Eligible own direct deals only after AED 10,000,000 Company-recognised sales in one year, written management approval, and JBJ receipt of cleared net commission", notes: "Not automatic; calculated on cleared net commission actually received by JBJ after lawful deductions, reversals and transaction costs" },
];

function normalizeOfferCommissionRows(rows: CommissionRow[]): CommissionRow[] {
  const visible = (rows || []).filter((r) => (r.label || "").trim() || (r.rate || "").trim() || (r.trigger || "").trim());
  const byLabel = (needle: string) => visible.find((r) => (r.label || "").toLowerCase().includes(needle));
  const direct = byLabel("direct") || DEFAULT_BROKER_COMMISSIONS[0];
  const company = byLabel("company") || byLabel("source") || DEFAULT_BROKER_COMMISSIONS[1];
  const premium = byLabel("premium") || byLabel("70") || DEFAULT_BROKER_COMMISSIONS[2];
  return [
    { ...DEFAULT_BROKER_COMMISSIONS[0], ...direct, rate: direct.rate || DEFAULT_BROKER_COMMISSIONS[0].rate },
    { ...DEFAULT_BROKER_COMMISSIONS[1], ...company, rate: company.rate || DEFAULT_BROKER_COMMISSIONS[1].rate },
    {
      ...DEFAULT_BROKER_COMMISSIONS[2],
      ...premium,
      label: DEFAULT_BROKER_COMMISSIONS[2].label,
      rate: premium.rate || DEFAULT_BROKER_COMMISSIONS[2].rate,
      trigger: /10,?000,?000|ten\s+million/i.test(premium.trigger || "") ? premium.trigger : DEFAULT_BROKER_COMMISSIONS[2].trigger,
      notes: DEFAULT_BROKER_COMMISSIONS[2].notes,
    },
  ];
}
