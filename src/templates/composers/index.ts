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
// Signing date auto-syncs to today so the offer always reflects the actual day of signature.
const WALEED_SIGNING_DATE = new Date().toISOString().slice(0, 10);
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

const isInitialOnlyName = (value?: string): boolean => {
  if (!value) return false;
  const tokens = value.trim().split(/\s+/);
  if (tokens.length < 2) return false;
  return tokens.some((t) => /^[A-Z]\.?$/.test(t));
};

// Arabic → Latin transliteration for the most common Arab given/family-name tokens.
// Used when a passport's English line is MRZ-truncated (e.g. "ALWALID I. S. ALHALABI")
// but the Arabic "الاسم كاملا" line carries the full chain: given + father + grandfather + family.
const ARABIC_NAME_MAP: Record<string, string> = {
  "الوليد": "Alwalid", "وليد": "Waleed", "محمد": "Mohammad", "احمد": "Ahmad", "أحمد": "Ahmad",
  "محمود": "Mahmoud", "علي": "Ali", "حسن": "Hassan", "حسين": "Hussein", "عمر": "Omar",
  "عثمان": "Othman", "ابراهيم": "Ibrahim", "إبراهيم": "Ibrahim", "اسماعيل": "Ismail",
  "يوسف": "Yousef", "يعقوب": "Yacoub", "خالد": "Khaled", "سامي": "Sami", "سامر": "Samer",
  "بسام": "Bassam", "زياد": "Ziad", "هاني": "Hani", "نبيل": "Nabil", "كريم": "Karim",
  "طارق": "Tarek", "رامي": "Rami", "فادي": "Fadi", "ماجد": "Majed", "وائل": "Wael",
  "عصام": "Issam", "شعبان": "Shaaban", "رمضان": "Ramadan", "صلاح": "Salah", "نور": "Nour",
  "الحلبي": "Alhalabi", "الحمصي": "Alhomsi", "الدمشقي": "Aldimashqi", "المقدسي": "Almaqdisi",
  "القدسي": "Alqudsi", "الخليلي": "Alkhalili", "النابلسي": "Alnabulsi", "الغزاوي": "Alghazawi",
  "بن": "bin", "ابن": "ibn", "أبو": "Abu", "ابو": "Abu",
};

const OFFICIAL_NAME_ALIASES: Record<string, { english: string; arabic?: string }> = {
  "alwalid i s alhalabi": { english: "Alwalid Issam Shaaban Alhalabi", arabic: "الوليد عصام شعبان الحلبي" },
  "alwalid i. s. alhalabi": { english: "Alwalid Issam Shaaban Alhalabi", arabic: "الوليد عصام شعبان الحلبي" },
  "alwalid i.s. alhalabi": { english: "Alwalid Issam Shaaban Alhalabi", arabic: "الوليد عصام شعبان الحلبي" },
  "alhalabi alwalid i s": { english: "Alwalid Issam Shaaban Alhalabi", arabic: "الوليد عصام شعبان الحلبي" },
};

const normaliseNameAliasKey = (value?: string): string =>
  cleanLegalName(value)
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const officialNameAlias = (value?: string) => {
  const key = normaliseNameAliasKey(value);
  return key ? OFFICIAL_NAME_ALIASES[key] : undefined;
};

const transliterateArabicName = (arabic: string): string => {
  return arabic
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .split(/\s+/)
    .map((token) => {
      const stripped = token.replace(/[^\u0600-\u06FF]/g, "");
      if (!stripped) return "";
      if (ARABIC_NAME_MAP[stripped]) return ARABIC_NAME_MAP[stripped];
      const map: Record<string, string> = {
        "ا":"a","أ":"a","إ":"i","آ":"aa","ب":"b","ت":"t","ث":"th","ج":"j","ح":"h","خ":"kh",
        "د":"d","ذ":"dh","ر":"r","ز":"z","س":"s","ش":"sh","ص":"s","ض":"d","ط":"t","ظ":"z",
        "ع":"a","غ":"gh","ف":"f","ق":"q","ك":"k","ل":"l","م":"m","ن":"n","ه":"h","و":"w","ي":"y","ى":"a","ة":"a","ء":"","ئ":"i","ؤ":"u",
      };
      const latin = Array.from(stripped).map((ch) => map[ch] ?? "").join("");
      return latin ? latin.charAt(0).toUpperCase() + latin.slice(1) : "";
    })
    .filter(Boolean)
    .join(" ")
    .trim();
};

const arabicFullNameNative = (source?: string): string => {
  if (!source) return "";
  const line = source.match(/(?:الاسم\s*كاملا|الاسم)\s*[:：]?\s*([\u0600-\u06FF\s]+)/);
  const arabic = (line?.[1] || "").split(/\n/)[0].trim();
  return arabic.replace(/\s+/g, " ").trim();
};

const arabicFullName = (source?: string): string => {
  const arabic = arabicFullNameNative(source);
  if (!arabic) return "";
  return transliterateArabicName(arabic);
};

const legalArabicName = (fields: Record<string, string>, source: string): string => {
  const explicit = [fields.fullNameArabic, fields.nameArabic, fields.arabicName, fields.fullNameAsPerPassportArabic, fields.fullNameAsPerIdArabic]
    .map((v) => arabicFullNameNative(v) || (/[\u0600-\u06FF]/.test(v || "") ? (v || "").replace(/\s+/g, " ").trim() : ""))
    .find(Boolean);
  if (explicit) return explicit;
  const fromSource = arabicFullNameNative(source);
  if (fromSource) return fromSource;
  const alias = [fields.fullNameAsPerPassport, fields.fullNameAsPerId, fields.recipientName, fields.fullName]
    .map(officialNameAlias)
    .find(Boolean);
  return alias?.arabic || "";
};

const mrzName = (value?: string): string => {
  const line = (value || "").split(/\n/).find((part) => /^P<|^[A-Z0-9<]{20,}$/.test(part.trim()))?.trim() || "";
  const match = line.match(/P<[A-Z]{3}([A-Z<]+)<<([A-Z<]+)/i) || line.match(/^([A-Z<]+)<<([A-Z<]+)/i);
  if (!match) return "";
  const surname = match[1].replace(/<+/g, " ").trim();
  const given = match[2].replace(/<+/g, " ").trim();
  return cleanLegalName(`${given} ${surname}`);
};

const bestLegalName = (fields: Record<string, string>, source: string): string => {
  // 🔒 Highest priority: an explicit, user-confirmed "Full Name as per Passport"
  // (or equivalent ID-bound field). When the operator has typed the full chain —
  // given + father + grandfather + family — that value MUST win over any shorter
  // recipient/display name. Never let scoring downgrade it.
  const explicitCandidates = [
    fields.fullNameAsPerPassport,
    fields.passportFullName,
    fields.passport_name,
    fields.nameOnPassport,
    fields.fullNameAsPerId,
    fields.fullNameAsPerID,
    fields.idFullName,
    fields.emiratesIdFullName,
  ]
    .map(cleanLegalName)
    .filter((v) => v && v.split(/\s+/).length >= 2);
  const arabicNative = legalArabicName(fields, source);
  const arabicLatin = arabicNative ? transliterateArabicName(arabicNative) : "";
  const explicitWithAliases = explicitCandidates.map((name) => officialNameAlias(name)?.english || name);
  explicitWithAliases.sort((a, b) => {
    const score = (name: string) => (isInitialOnlyName(name) ? 0 : 1000) + name.length + (name.split(/\s+/).length >= 4 ? 180 : name.split(/\s+/).length >= 3 ? 100 : 0);
    return score(b) - score(a);
  });
  const explicit = explicitWithAliases[0] || "";
  if (explicit && (!isInitialOnlyName(explicit) || !arabicLatin)) return explicit;
  if (arabicLatin && arabicLatin.split(/\s+/).length >= 3) return arabicLatin;
  if (explicit) return explicit;

  const candidates = [
    arabicLatin,
    fields.fullName,
    fields.nameAsPerId,
    fields.nameAsPerID,
    fields.candidateName,
    fields.recipientName,
    fields.surname && fields.givenNames ? `${fields.givenNames} ${fields.surname}` : "",
    fields.lastName && fields.firstName ? `${fields.firstName} ${fields.middleName || ""} ${fields.lastName}` : "",
    mrzName(source),
    arabicFullName(source),
    arabicFullName(fields.fullNameArabic || fields.nameArabic || fields.arabicName || ""),
    firstMatch(source, /(?:full\s+name\s+as\s+per\s+passport|name\s+on\s+passport|passport\s+full\s+name)\s*(?:is|:|-)?\s*([^;\n]+)/i),
    firstMatch(source, /(?:full\s+name\s+as\s+per\s+id|name\s+as\s+per\s+id|candidate\s+name|full\s+name)\s*(?:is|:|-)?\s*([^;\n]+)/i),
  ]
    .map(cleanLegalName)
    .map((name) => officialNameAlias(name)?.english || name)
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

const COUNTRY_TO_DEMONYM: Record<string, string> = {
  palestine: "Palestinian", lebanon: "Lebanese", syria: "Syrian", jordan: "Jordanian",
  egypt: "Egyptian", morocco: "Moroccan", tunisia: "Tunisian", algeria: "Algerian",
  iraq: "Iraqi", iran: "Iranian", india: "Indian", pakistan: "Pakistani",
  bangladesh: "Bangladeshi", "sri lanka": "Sri Lankan", philippines: "Filipino",
  "united kingdom": "British", "great britain": "British", england: "British",
  "united states": "American", usa: "American", russia: "Russian", ukraine: "Ukrainian",
  france: "French", germany: "German", italy: "Italian", spain: "Spanish",
  portugal: "Portuguese", greece: "Greek", turkey: "Turkish", china: "Chinese",
  japan: "Japanese", korea: "Korean", "south korea": "Korean",
  "saudi arabia": "Saudi", "united arab emirates": "Emirati", uae: "Emirati",
  qatar: "Qatari", kuwait: "Kuwaiti", bahrain: "Bahraini", oman: "Omani", yemen: "Yemeni",
  sudan: "Sudanese", libya: "Libyan",
};

const normalizeNationality = (value: string): string => {
  // UN/ISO country lists return inverted names like "Palestine, State of",
  // "Korea, Republic of", "Iran, Islamic Republic of". Strip the trailing
  // ", State of / Republic of / Kingdom of / …" tail so the document reads
  // cleanly as just the nationality/country name.
  let v = (value || "")
    .replace(/\s*,?\s*(state|republic|kingdom|sultanate|federation|union|emirate|principality|commonwealth|grand\s+duchy|democratic\s+republic|islamic\s+republic|people'?s\s+republic|plurinational\s+state|bolivarian\s+republic)\s+of\b\.?\s*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Reject obvious bleed from identity sentences ("recorded as Palestine, residing at …").
  if (/@|residing|reachable|apartment|building|street|email|phone|whatsapp|emirates\s+id|passport/i.test(v) || /\d{3,}/.test(v)) {
    // Try to salvage just the country name from "recorded as <Country>".
    const m = v.match(/(?:recorded\s+as|nationality\s*[:-]?)\s*([A-Za-z][A-Za-z\s]{2,30}?)(?=[,.;]|\s+(?:residing|reachable|apartment|building|street|email|phone|and|with)\b|$)/i);
    v = m ? m[1].trim() : "";
  }
  if (!v) return "";
  const key = v.toLowerCase();
  return COUNTRY_TO_DEMONYM[key] || v;
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
    arabicName: legalArabicName(fields, source),
    emiratesId: identityValue(fields, ["emiratesId", "idNumber", "emirates_id", "eid_number", "eid"], source, /(?:emirates\s*id(?:\s*number)?|eid(?:\s*number)?|id\s*number)\s*(?:is|:|-)?\s*(784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d)/i, /\b(784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d)\b/i),
    passport: identityValue(fields, ["passportNumber", "passport_number", "passportNo", "passport"], source, /passport(?:\s*(?:number|no\.?))?\s*(?:is|:|-)?\s*([A-Z0-9]{5,})/i),
    nationality: normalizeNationality(identityValue(fields, ["nationality", "nationalityName", "countryOfNationality"], source, /nationality\s*(?:is|:|-|recorded\s+as)?\s*([A-Za-z][A-Za-z\s-]{2,30}?)(?=[,;.\n]|\s+(?:residing|reachable|apartment|building|street|email|phone|and|with)\b|$)/i)),
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
  <section data-pdf-section="offer-clause-${n}" style="margin:0 0 8px;page-break-inside:avoid;break-inside:avoid;">
    <h2 style="margin:0 0 3px;font-size:12.5px;line-height:1.3;color:${INK};font-weight:700;">${n}. ${esc(heading)}</h2>
    <p style="margin:0;line-height:1.5;font-size:12px;color:${INK};">${body}</p>
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
 * Unified Salary & Commission table — ONE table for the Offer Letter.
 * - Top rows: zero-salary / onboarding terms and payment cycle;
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
  applicantAcknowledgement?: string;
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
  // No hard-coded fallback title — mirror EXACTLY what the offer/source
  // document carries. If blank, leave blank rather than fabricating a role.
  const aTitle = esc(cleanedATitle);
  const aDate = esc(formatHumanDate(opts.applicantDate));
  // Recipient cell title is template-aware (Second Party / Client / Guest /
  // Counterparty …) — NEVER the literal word "Recipient" and NEVER the
  // recipient's own name (the name already prints inside the cell).
  const aLabel = esc(opts.applicantLabel || "Second Party");
  // Identical row geometry on both sides — the 54px label column guarantees
  // the colons (Name: / Title: / Date:) align on the same vertical line
  // across the two signature cells.
  const linedRow = (label: string, value?: string) => `
    <div style="display:grid;grid-template-columns:54px 1fr;align-items:center;column-gap:8px;font-size:11px;color:${INK};margin-top:7px;line-height:1.35;min-height:20px;overflow:visible;">
      <strong style="font-weight:600;white-space:nowrap;">${label}:</strong>
      <span style="display:block;min-height:20px;position:relative;min-width:0;overflow:visible;padding:1px 0;">
        ${value ? `<span style="display:block;font-size:11px;line-height:1.4;font-family:Inter,system-ui,sans-serif;font-weight:500;letter-spacing:0;color:${INK};white-space:normal;max-width:100%;overflow:visible;text-overflow:clip;overflow-wrap:anywhere;word-break:normal;">${value}</span>` : ""}
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
  const ack = (opts.applicantAcknowledgement || "").trim();
  // Acknowledgement no longer has a hard max-height clamp — it must show
  // the FULL sentence (owner complaint: "I accept full…" was cropped).
  // Cells expand vertically to fit; both columns share the same min-height
  // via lowerRowsMinHeight so the baseline alignment is preserved.
  const lowerRowsMinHeight = ack ? 190 : 100;

  // Premium bordered signature box (mirrors institutional NDA layout):
  // a SINGLE gold-hairline frame containing two columns (Authorised
  // Signatory + Recipient) joined together and sharing the middle divider —
  // no gap between cells, identical to the uploaded reference NDA.
  const cellInner = (sigId: string, heading: string, signatureContent: string, lines: string, isRight: boolean) => `
    <td data-sig-id="${sigId}" style="width:50%;vertical-align:top;padding:0;position:relative;${isRight ? `border-left:1px solid ${GOLD};` : ""}">
      <div style="padding:8px 14px;border-bottom:1px solid ${GOLD};background:${CHAMPAGNE};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${INK};font-weight:700;text-align:center;">${heading}</div>
      <div style="position:relative;height:88px;padding:8px 14px 6px;box-sizing:border-box;">
        <div style="font-size:10px;color:${MUTED};letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">Signature</div>
        ${signatureContent}
      </div>
      <div style="padding:10px 14px 14px;border-top:1px dashed ${GOLD}80;min-height:${lowerRowsMinHeight}px;box-sizing:border-box;display:flex;flex-direction:column;">
        ${lines}
      </div>
    </td>`;

  const ownerLines = [
    linedRow("Name", oName),
    linedRow("Title", oTitle),
    linedRow("Date", oDate),
  ].join("");

  const applicantMeta = (opts.applicantMetaRows || [])
    .filter(([, value]) => (value || "").trim())
    .map(([label, value]) => row(label, esc(value || "")))
    .join("");
  const ackBlock = ack
    ? `<div data-applicant-undertaking="1" style="width:100%;padding:8px 10px;border:1px solid ${GOLD}66;border-left:3px solid ${GOLD};border-radius:4px;background:#FBF7EE;font-size:9px;line-height:1.42;color:${INK};font-style:italic;text-align:justify;box-sizing:border-box;">${esc(ack)}</div>`
    : "";
  // Lower signature geometry: undertaking sits ABOVE Name / Title / Date
  // rows. The opposite (owner) column gets a matching invisible spacer
  // whose height equals the rendered ack block so both Name rows align.
  const preambleSlot = ack
    ? `<div data-sig-preamble-slot="1" style="display:flex;align-items:flex-start;margin-bottom:10px;">${ackBlock}</div>`
    : "";
  const blankPreambleSlot = ack
    ? `<div data-sig-preamble-slot="1" data-sig-spacer="owner" style="margin-bottom:10px;visibility:hidden;">${ackBlock}</div>`
    : "";
  const rowsWrap = (html: string) => `<div data-sig-detail-rows="1" style="margin-top:auto;">${html}</div>`;
  const ownerLinesWithSpacer = `${blankPreambleSlot}${rowsWrap(ownerLines)}`;
  const applicantLines = `
    ${preambleSlot}
    ${rowsWrap(`
      ${linedRow("Name", aName)}
      ${linedRow("Title", aTitle)}
      ${linedRow("Date", aDate)}
      ${applicantMeta}
    `)}
  `;
  const ownerSignatureLine = `<div style="position:absolute;left:14px;right:14px;bottom:6px;height:32px;border-bottom:1px solid ${INK};"></div>`;
  const applicantSignatureLine = `<div style="position:absolute;left:14px;right:14px;bottom:6px;height:32px;border-bottom:1px solid ${INK};"></div>`;

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
    extraRows.push(`<tr><td colspan="2" style="height:24px;border:none;"></td></tr><tr>${cellInner(`extra-${i}`, esc(a?.label || "Additional Signatory"), "", aLines, false)}${b ? cellInner(`extra-${i + 1}`, esc(b?.label || "Additional Signatory"), "", bLines, true) : `<td style="width:50%;border-left:1px solid ${GOLD};"></td>`}</tr>`);
  }

  return `
    <div data-signature-block="1" data-pdf-section="signature" style="margin-top:auto;padding-top:22px;page-break-inside:avoid;break-inside:avoid;">
      <div style="border:1px solid ${GOLD};border-radius:6px;background:#FDFBF7;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;font-family:Inter,system-ui,sans-serif;">
          <tbody>
            <tr>
              ${cellInner("owner", "Authorised Signatory", ownerSignatureLine, ownerLinesWithSpacer, false)}
              ${cellInner("recipient", aLabel, applicantSignatureLine, applicantLines, true)}
            </tr>
            ${extraRows.join("")}
          </tbody>
        </table>
      </div>
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



/** Format an ISO yyyy-mm-dd (or any Date-parseable string) as "28 Jun 2026".
 *  Falls back to today when the input is empty / unparseable. */
function formatPrettyDate(raw?: string | null): string {
  const d = raw ? new Date(raw) : new Date();
  const safe = isNaN(d.getTime()) ? new Date() : d;
  return safe.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function recipientBlock(fields: Record<string, string>, opts?: { greeting?: boolean }): string {
  const name = esc(fields.recipientName);
  const today = new Date().toISOString().slice(0, 10);
  const prepared = formatPrettyDate(fields.letterDate || fields.preparedDate || fields.documentDate || today);
  const signing = formatPrettyDate(fields.signingDate || fields.applicantDate || fields.ownerDate || today);
  const datesPanel = `
    <div style="text-align:right;font-size:11px;line-height:1.45;color:${INK};min-width:170px;white-space:nowrap;">
      <div>
        <div style="font-size:9.5px;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Date Prepared</div>
        <div style="font-weight:600;margin-top:1px;">${prepared}</div>
      </div>
      <div style="margin-top:8px;">
        <div style="font-size:9.5px;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Date of Signing</div>
        <div style="font-weight:600;margin-top:1px;">${signing}</div>
      </div>
    </div>`;
  if (opts?.greeting) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin:6px 0 14px;font-size:12.5px;color:${INK};line-height:1.6;">
        <div style="font-weight:600;flex:1;min-width:0;">Dear ${name || "Candidate"},</div>
        ${datesPanel}
      </div>`;
  }
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin:8px 0 18px;font-size:12px;color:${INK};line-height:1.6;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};margin-bottom:3px;">To</div>
        <div style="font-weight:600;">${name || "—"}</div>
      </div>
      ${datesPanel}
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
  const candidateArabicName = esc(id.arabicName || "");
  const candidateNameWithArabic = candidateArabicName
    ? `${candidateName} <span dir="rtl" lang="ar" style="font-family:Inter,system-ui,sans-serif;font-weight:600;white-space:nowrap;">(${candidateArabicName})</span>`
    : candidateName;
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
    `For identification purposes, this offer is issued to <strong>${candidateName}</strong>${candidateArabicName ? `, Arabic name as recorded on the identity document: <strong dir="rtl" lang="ar">${candidateArabicName}</strong>` : ""}, holder of Passport No. <strong>${passport}</strong>, Emirates ID No. <strong>${emiratesId}</strong>, <strong>${nationality}</strong> national, residing at <strong>${address}</strong>, reachable by email at <strong>${email}</strong> and by phone / WhatsApp at <strong>${phone}</strong>.`,
  );

  const replacementParagraph = paragraph(
    `This document is issued as a <strong>conditional offer, commission milestone, confidentiality, non-circumvention, non-solicitation, commission protection, and company data protection undertaking</strong>. It is intended to protect the Company's confidential information, leads, clients, data, goodwill, reputation, commission rights, and business opportunities, while also confirming the Candidate's commission entitlement where commission is properly earned under this document.`,
  );

  const employmentTerms = termsTable(
    [
      ["Job Title", filledOr(f.jobTitle, ""), "jobTitle"],
      ["Start / Joining Date", formatHumanDate(f.startDate) || f.startDate, "startDate"],
      ["Place of Work", placeOfWork, "placeOfWork"],
      ["Working Hours", workingHoursRaw, "workingHours"],
      ["Salary", "AED 0 – zero salary", "salary"],
      ["Reporting Line", filledOr(f.reportingLine || f.reportingManager, "Founder & CEO"), "reportingLine"],
    ],
    "Terms of Engagement",
  );

  const compensationTerms = compensationAndCommissionTable(
    [
      ["Salary", "AED 0 — zero salary. The Candidate receives no fixed salary under this offer.", "salary"],
      ["Commission Entitlement", "The Candidate's monetary entitlement is commission only, payable where expressly earned under this document and after the Company receives cleared commission from the buyer, seller, landlord, developer, client, or relevant third party.", "commissionEntitlement"],
      ["Payment Cycle", filledOr(f.paymentCycle, "Upon the Company's receipt of cleared commission."), "paymentCycle"],
      ["Company-Supported Onboarding Items", "Company-supported processing of visa, Emirates ID, medical insurance, and RERA card may be considered only after the first Company-approved transaction is closed, the Company receives the required net cleared commission, the Candidate remains actively engaged with the Company, and the Company confirms approval in writing.", "postFirstDealBenefits"],
    ],
    normalizeOfferCommissionRows(input.commissionRows || []),
  );
  const commissionRowsTable = "";

  const leadsFromHuman = formatHumanDate(f.leadsReceivedFrom || WALEED_EFFECTIVE_DATE) || f.leadsReceivedFrom || "20 June 2026";
  const signingHuman = formatHumanDate(offerSigningIso) || offerSigningIso || todayLong();
  const leadsCount = (f.leadsCountAtSigning || f.leadsCount || "310").toString().trim() || "310";

  const clauses = [
    offerClause(1, "Nature of This Offer", `This document is <strong>not, by itself, a final UAE employment contract</strong>, work permit, visa sponsorship, labour registration, RERA/DLD registration, broker registration, or unconditional authorization for the Candidate to perform any activity requiring a specific governmental, regulatory, labour, or professional approval. The purpose of this document is to define the Candidate's role, commission entitlement, internal onboarding basis, Company data protection obligations, confidentiality obligations, and business conduct obligations, while protecting both the Company's commercial rights and the Candidate's properly earned commission rights. The Candidate's title under this offer is <strong>${jobTitle}</strong>. The Candidate may perform duties, receive Company instructions, handle Company-approved communications, and support Company business development only within the scope permitted by the Company and applicable law.`),
    offerClause(2, "Position, Duties and Company Instructions", `The Candidate is engaged under this offer as <strong>${jobTitle}</strong>. The Candidate's duties may include, without limitation, real estate sales and leasing support, client communication, lead handling, follow-up with prospects, property presentations, developer coordination, CRM updates, marketing support, administrative support, HR support, content support, photography or phone-based marketing tasks, coordination with developers, client scheduling, and any related task reasonably assigned by the Company. The Candidate shall comply with all Company instructions, internal procedures, CRM requirements, reporting requirements, client-handling rules, lead-handling rules, confidentiality rules, and business conduct standards. The Candidate shall act honestly, professionally, transparently, and in good faith at all times, and shall not act outside the permission granted by the Company.`),
    offerClause(3, "Commission Milestone Before Company-Supported Documentation", `The Company may consider proceeding with Company-supported visa processing, Emirates ID processing, medical insurance, RERA card processing, labour documentation, or further formal documentation only after the Candidate successfully closes the first Company-approved transaction and the Company actually receives a substantial net cleared commission from that transaction. The target milestone is <strong>AED 50,000 net cleared commission</strong> received by the Company. However, the Company may, at its sole discretion and based on the Candidate's performance, commitment, conduct, attendance, contribution, deal quality, and business value to the Company, consider proceeding if the net cleared commission received by the Company is reasonably close to that amount, including approximately AED 40,000 to AED 50,000. For the purpose of this document, <strong>net cleared commission</strong> means the amount actually received by the Company in cleared funds after any refunds, reversals, cancellations, chargebacks, taxes, gateway fees, referral fees, third-party deductions, agreed transaction costs, or any other applicable deductions. A transaction shall not be considered closed merely because of a verbal discussion, WhatsApp message, client interest, viewing, reservation, booking, offer, pending transaction, expected commission, or client promise. A transaction shall be considered closed only when the Company confirms it in writing and the Company has actually received the cleared funds. Meeting or approaching the milestone does not automatically guarantee visa sponsorship, work permit approval, RERA/DLD registration, continued engagement, fixed salary, or any additional benefit unless the Candidate remains actively engaged with the Company, maintains proper conduct, complies with Company instructions, and the Company confirms the next step in writing.`),
    offerClause(4, "Company-Supported Visa, Documentation and Onboarding Items", `If the first Company-approved deal is closed, the Company receives the required net cleared commission, and the Candidate remains active, compliant, suitable, and in good standing with the Company, the Company may consider supporting the following items only: (1) visa processing; (2) Emirates ID processing; (3) medical insurance; (4) RERA card processing. The above items are not automatic and remain subject to the Company's written approval, legal eligibility, government approval, RERA/DLD requirements, internal approval, document completion, and the Candidate's continued compliance with this document. Nothing in this document shall be interpreted as a promise or guarantee that the Company will sponsor a visa, issue or obtain a work permit, complete labour registration, register the Candidate with RERA/DLD, issue a RERA card, provide medical insurance, or continue the engagement.`),
    offerClause(5, "Business Card, Private Wealth Advisor Title and Limited Representation", `The Company may, at its sole discretion, allow the Candidate to use a Company business card, Company-approved title, email signature, introduction wording, logo, or Company material, and to identify himself as <strong>${jobTitle}</strong> connected to the Company, for limited business development, client introduction, lead-generation, and commercial communication purposes only. This permission, if granted, is strictly limited. It does not give the Candidate signing authority, broker authority, authority to bind the Company, authority to approve deals, authority to collect money, authority to issue receipts, authority to guarantee pricing or availability, or authority to make final commitments on behalf of the Company. The Candidate shall not sign, approve, negotiate as final, amend, commit to, promise, collect, receive, transfer, acknowledge, issue, or accept any payment, deposit, booking amount, commission, agreement, memorandum, offer, reservation, receipt, invoice, undertaking, legal obligation, or commercial obligation on behalf of the Company. The Candidate shall not represent to any client, owner, developer, landlord, seller, buyer, tenant, investor, broker, supplier, authority, or third party that he has authority to bind the Company, make final decisions for the Company, approve deals, guarantee availability, guarantee pricing, guarantee commission, or finalize any transaction unless the Company has given specific written authorization for that exact matter. Any business card, title, introduction wording, logo, or Company material provided to the Candidate remains the <strong>exclusive property of the Company</strong> and may be withdrawn at any time. Upon request, the Candidate must immediately stop using the Company name, logo, business card, title, email signature, introductions, marketing materials, and any other Company identification.`),
    offerClause(6, "No Authority to Bind the Company", `The Candidate has <strong>no authority to bind the Company</strong> unless the Company gives prior written approval for the specific matter. The Candidate shall not enter into agreements, issue confirmations, approve transactions, accept money, collect deposits, issue receipts, negotiate final terms, make representations, promise outcomes, or create obligations on behalf of the Company. All final approvals, commercial terms, commissions, client commitments, property details, pricing, availability, contracts, and transactions remain subject to the Company's written approval. Any act outside the scope of written authorization shall be the Candidate's personal responsibility and shall not bind the Company.`),
    offerClause(7, "Confidentiality and Company Information", `The Candidate must keep <strong>strictly confidential</strong> all Company information received before, during, or after this offer. Confidential information includes, without limitation, Company leads, client names, phone numbers, WhatsApp conversations, CRM data, owner contacts, developer contacts, landlord contacts, seller contacts, buyer contacts, tenant contacts, investor details, broker contacts, supplier details, partner details, pricing information, commission information, property information, photos, videos, floor plans, brochures, listing materials, marketing materials, social media accounts, passwords, login details, emails, call records, scripts, training materials, internal policies, business methods, Company strategies, files, documents, and any information related to the Company's business. The Candidate shall not disclose, copy, screenshot, export, transfer, sell, leak, misuse, delete, hide, retain, redirect, or use any confidential information except for the sole benefit of the Company and only as expressly authorized by the Company. The Candidate's confidentiality obligations shall continue after the expiry, withdrawal, cancellation, termination, or completion of this offer.`),
    offerClause(8, "Ownership of Leads, Clients and Business Opportunities", `All leads, clients, prospects, inquiries, contacts, databases, owners, developers, landlords, sellers, buyers, tenants, investors, brokers, suppliers, partners, business opportunities, property information, and transaction opportunities introduced, generated, received, assigned, accessed, handled, or discussed during this offer are the <strong>exclusive property of the Company</strong>. The Candidate shall not treat any Company lead, client, contact, property, business opportunity, WhatsApp conversation, CRM entry, social media inquiry, or database information as personal property. The Candidate shall not close, redirect, transfer, sell, leak, copy, screenshot, export, conceal, delete, bypass, or use any Company lead, client, contact, property owner, developer, investor, or business opportunity outside the Company or through another company, broker, agent, platform, friend, family member, nominee, partner, or third party. Any commission, benefit, referral fee, introduction fee, side payment, reward, or business advantage resulting from Company leads, Company data, Company clients, Company relationships, or Company opportunities shall belong to the Company unless the Company agrees otherwise in writing.`),
    offerClause(9, "Non-Circumvention and Non-Solicitation", `The Candidate shall not directly or indirectly approach, solicit, divert, contact, deal with, serve, invoice, refer, transfer, or close any Company client, lead, owner, developer, landlord, seller, buyer, tenant, investor, broker, supplier, employee, consultant, contractor, partner, or business contact for personal benefit or for the benefit of any third party. This restriction applies during this offer and after it ends, to the fullest extent permitted by UAE law. The Candidate shall not use any Company relationship, lead, data, or information to bypass the Company, reduce the Company's commission, avoid paying the Company, divert a transaction, or move a client or opportunity to another person or entity.`),
    offerClause(10, "Conflict of Interest and Competing Activity", `The Candidate shall not use Company information, Company leads, Company clients, Company contacts, Company training, Company business cards, Company reputation, Company marketing, or Company opportunities to benefit any competing real estate company, broker, agency, developer, platform, property management company, holiday-home company, or other business. The Candidate must immediately disclose to the Company any actual or potential conflict of interest, including any work, ownership, partnership, commission arrangement, referral arrangement, consultancy, side business, or relationship with any real estate company or competing business. The Candidate shall not create, support, join, assist, own, manage, advise, or work with a competing business using the Company's confidential information, leads, clients, data, relationships, goodwill, or opportunities. Any restriction in this clause shall be interpreted reasonably and only to the extent permitted by UAE law, with the purpose of protecting the Company's legitimate business interests, confidential information, client relationships, leads, commissions, and goodwill.`),
    offerClause(11, "Zero Salary, Commission Only and Commission Qualification", `The Candidate's salary under this offer is <strong>AED 0</strong>. The Candidate is not entitled to any fixed salary, fixed allowance, fixed payment, or guaranteed monthly income. The Candidate's only monetary entitlement is commission, where the commission is expressly earned under this document, approved by the Company, and payable after the Company has actually received the relevant cleared commission. The Company commission structure is <strong>60% Broker / 40% Company</strong> for the Candidate's own direct deals and <strong>50% Broker / 50% Company</strong> for Company-sourced leads. No commission or success fee shall be payable unless approved in writing by the Company and unless the Company has actually received the relevant cleared funds. The Company shall determine in good faith whether a transaction qualifies for commission, whether the Candidate was the effective cause of the transaction, whether the transaction was Company-approved, whether the commission was actually received, and whether any deductions, reversals, refunds, cancellations, disputes, or third-party claims apply. No verbal promise, WhatsApp message, client discussion, lead allocation, viewing, booking, pending deal, or expected payment shall create a commission entitlement unless confirmed in writing by the Company.`),
    offerClause(12, "Misuse, Theft or Unauthorized Use of Company Information", `Any theft, copying, screenshotting, exporting, transferring, leaking, selling, deleting, hiding, retaining, concealing, redirecting, or unauthorized personal use of Company data, leads, clients, contacts, WhatsApp conversations, CRM information, owner or developer contacts, photos, videos, listing materials, social media access, files, emails, passwords, or confidential information shall be treated as a <strong>serious breach of trust and confidentiality</strong>. If the Candidate misuses Company information or causes the Company any loss, damage, reputational harm, lost commission, lost opportunity, client diversion, regulatory exposure, legal claim, cost, or expense, the Candidate shall indemnify and compensate the Company to the fullest extent permitted by UAE law. The Company may seek all available legal remedies, including damages, injunctive relief, recovery of lost commissions, return of information, deletion of unauthorized copies, and any other remedy available under applicable law.`),
    offerClause(13, "Return and Deletion of Company Data", `Upon the Company's request, or upon termination, cancellation, withdrawal, or expiry of this offer, the Candidate shall immediately return, delete, and permanently stop using all Company information and materials. This includes, without limitation, business cards, files, contacts, phone numbers, WhatsApp conversations, CRM access, passwords, social media access, emails, documents, screenshots, photographs, videos, property details, client lists, owner lists, developer lists, pricing information, commission information, scripts, marketing materials, and any copies stored on phones, laptops, cloud storage, email accounts, messaging applications, notebooks, or external devices. The Candidate shall confirm in writing, if requested by the Company, that all Company information has been returned and deleted and that no copy has been retained.`),
    offerClause(14, "Company-Supported Documentation and Limited Onboarding Items", `The Candidate is internally onboarded under this offer as <strong>${jobTitle}</strong> for Company-approved activities, instructions, commission arrangements, client communication, and Company business support, subject always to Company approval and applicable UAE legal requirements. The Company shall not be required to process visa sponsorship, Emirates ID, medical insurance, RERA card, labour registration, or further governmental documentation unless the Candidate successfully closes a Company-approved transaction, the Company receives the required net cleared commission, and the Company confirms approval in writing. The Company-supported items, if approved, are limited to <strong>visa processing, Emirates ID, medical insurance, and RERA card only</strong>. No other benefit, allowance, reimbursement, salary, fixed payment, or onboarding item is included unless separately approved in writing by the Company or required by mandatory UAE law. The Company may decide not to proceed with any documentation or supported item if the Candidate closes a deal but then becomes inactive, disappears, refuses Company instructions, breaches this document, misuses Company information, damages the Company's interests, or otherwise fails to remain in good standing with the Company.`),
    offerClause(15, "Compliance With Law and Company Instructions", `The Candidate shall comply with all applicable UAE laws, regulations, real estate rules, data protection obligations, professional standards, and Company instructions. The Candidate shall act honestly, professionally, transparently, and in good faith. The Candidate shall not make false statements, mislead clients, misuse the Company name, promise unavailable properties, guarantee prices, guarantee commissions, accept money, or perform any act that may expose the Company to legal, regulatory, financial, or reputational risk.`),
    offerClause(16, "Company's Right to Withdraw This Offer", `The Company may withdraw, suspend, cancel, or end this offer at any time by written notice if the Company determines that the Candidate is not suitable, has failed to meet the required milestone, has breached this document, has misused Company information, has created risk for the Company, has failed to perform required duties, or has failed to comply with Company instructions. Upon withdrawal, suspension, cancellation, or termination, the Candidate must immediately stop using the Company name, logo, business card, ${jobTitle} title, introductions, materials, leads, information, and any Company-related identity or access. The Candidate's obligations relating to confidentiality, Company data, ownership of leads, non-circumvention, non-solicitation, return of information, deletion of information, liability, indemnity, and dispute resolution shall survive.`),
    offerClause(17, "Governing Law and Jurisdiction", `This document shall be governed by and interpreted in accordance with the laws of the <strong>United Arab Emirates</strong> as applicable in the Emirate of Dubai. Any dispute arising out of or in connection with this document shall be subject to the competent courts, authorities, or tribunals of the United Arab Emirates, unless the Parties agree in writing to another lawful dispute resolution method.`),
  ].join("");

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
    subjectLine(`CONDITIONAL OFFER, COMMISSION MILESTONE, CONFIDENTIALITY AND COMPANY DATA PROTECTION UNDERTAKING`),
    paragraph(`<strong>Employment Offer – ${jobTitle}</strong>`),
    paragraph(`Dear ${candidateNameWithArabic},`),
    paragraph(`We are pleased to issue this <strong>conditional offer</strong> for the position of <strong>${jobTitle}</strong> with <strong>${companyName}</strong>, a UAE real estate agency holding Trade Licence No. <strong>${JBJ_BRAND.tradeLicense}</strong> and ORN <strong>41486</strong>, subject to the terms set out in this document.`),
    replacementParagraph,
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
      applicantMetaRows: candidateArabicName ? [["Arabic Name", id.arabicName]] : undefined,
      applicantAcknowledgement: `I, ${candidateName}${candidateArabicName ? ` (${candidateArabicName})` : ""}, confirm that I have read, understood, and accepted all terms of this Conditional Offer, Commission Milestone, Confidentiality and Company Data Protection Undertaking. I agree to protect all Company leads, clients, data, information, business opportunities, reputation, commissions, and commercial interests, and I accept full responsibility for any breach of this document.`,
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

/* ───────────── Non-Disclosure Agreement (mutual, structured) ───────────── */

function composeNda(input: ComposerInput): string {
  const f = input.fields;
  const id = offerIdentity(f);
  const candidateName = esc(filledOr(id.name || f.recipientName, "[Counterparty Name]"));
  const candidateArabicName = esc(id.arabicName || "");
  const address = esc(filledOr(id.address, "[Address]"));
  const email = esc(filledOr(id.email, "[Email]"));
  const phone = esc(safePhoneDisplay(id.phone || f.recipientPhone || f.phone || f.mobile || f.whatsapp));
  const emiratesId = esc(filledOr(id.emiratesId, "[Emirates ID Number]"));
  const passport = esc(filledOr(id.passport, "[Passport Number]"));
  const nationality = esc(filledOr(id.nationality, "[Nationality]"));
  // Mirror EXACTLY the position recorded on the source document (offer
  // letter / shared identity). Do not fabricate a default role.
  const position = esc(filledOr(f.jobTitle || f.position, ""));
  const startDate = esc(filledOr(f.startDate || f.leadsFromDate, ""));

  const licenceNotice = paragraph(
    `<strong>${JBJ_BRAND.legalName} ${JBJ_BRAND.legalSuffix}</strong> (the "<strong>Company</strong>"), a UAE real estate brokerage operating under Trade Licence No. <strong>${JBJ_BRAND.tradeLicense}</strong> and ORN <strong>41486</strong>, and the Counterparty identified below (the "<strong>Recipient</strong>") agree to the confidentiality terms set out in this Non-Disclosure Agreement (this "<strong>Agreement</strong>").`
  );

  const identityTable = termsTable(
    [
      ["Full Legal Name", filledOr(candidateName, ""), "recipientName"],
      ["Arabic Name as per ID / Passport", filledOr(candidateArabicName, ""), "fullNameArabic"],
      ["Nationality", filledOr(nationality, ""), "nationality"],
      ["Emirates ID", filledOr(emiratesId, ""), "emiratesId"],
      ["Passport Number", filledOr(passport, ""), "passportNumber"],
      ["Residential Address", filledOr(address, ""), "homeAddress"],
      ["Email", filledOr(email, ""), "recipientEmail"],
      ["Phone / WhatsApp", filledOr(phone, ""), "recipientPhone"],
      ["Position / Role", filledOr(position, ""), "jobTitle"],
      ["Effective Date", filledOr(startDate, ""), "startDate"],
    ],
    "Counterparty Identification"
  );

  // LAYOUT NOTE: The heavy "Breach Events" clause is intentionally placed
  // earlier (clause 8) so the long block falls on page 3 — keeping page 4
  // breathable with the shorter return / data-protection / governing-law
  // clauses. Do not move it back without re-validating page breaks.
  const clauses = [
    offerClause(1, "Definition of Confidential Information", `"<strong>Confidential Information</strong>" means any non-public information disclosed by the Company to the Recipient, in any form (oral, written, electronic, visual or otherwise — including all emails and their attachments), including without limitation: client and investor lists, lead data, owner/developer contacts, CRM exports, WhatsApp conversations, sales pipelines, payment plans, commission structures, listing material, pricing, photographs, marketing material, business plans, financial information, internal procedures, software, trade secrets, discoveries, processes, techniques, programs, knowhow, and any data marked or reasonably understood to be confidential.`),
    offerClause(2, "Exclusions from Confidential Information", `Confidential Information shall <strong>not</strong> include any information which: (a) is or becomes publicly known through no wrongful act of the Recipient; (b) was already in the Recipient's possession at the time of disclosure, without restriction; (c) is independently developed by the Recipient without breach of this Agreement; (d) is expressly released for disclosure by the Company's prior written authorisation; or (e) is required to be disclosed by law or by order of a court of competent jurisdiction, provided the Recipient gives the Company prompt written notice so the Company may seek a protective order.`),
    offerClause(3, "Obligation of Confidentiality", `The Recipient shall (a) hold all Confidential Information in strict confidence, (b) use it solely for the purpose of performing services for or with the Company, (c) not disclose it to any third party without the Company's prior written consent, and (d) protect it with at least the same degree of care used to protect their own confidential information, but in no event less than reasonable care.`),
    offerClause(4, "Term & Survival", `This Agreement is effective from the Effective Date stated above and shall continue in force throughout the Recipient's engagement with the Company and for a period of <strong>three (3) years</strong> thereafter. Confidentiality obligations relating to trade secrets, client identity data, and lead ownership shall survive indefinitely and remain enforceable after termination, resignation, or expiry of this Agreement.`),
    offerClause(5, "Non-Circumvention & Lead Ownership", `The Recipient shall not, directly or indirectly, contact, solicit, transact with, or refer to any third party any lead, client, investor, developer, landlord, tenant, owner or contact introduced by, sourced through, or recorded in the Company's systems, save through the Company and on terms approved by the Company in writing. All such leads, contacts, CRM records, WhatsApp histories, and pipeline data are and remain the <strong>exclusive property of the Company</strong>, including for a period of <strong>twenty-four (24) months</strong> after the Recipient ceases engagement.`),
    offerClause(6, "Non-Compete (Competing Brokerages)", `During the term of this Agreement and for a period of <strong>two (2) years</strong> following the Recipient's last working day with the Company, the Recipient shall not, directly or indirectly, engage with, be employed by, consult for, own, operate, partner in, or provide services to any company or entity that competes with the Company within the real-estate sector in the United Arab Emirates, nor share any Confidential Information with any such competing entity.`),
    offerClause(7, "Real-Estate Lead & Client Data", `Without limiting clauses 5 and 6, the Recipient acknowledges that all <strong>buyer, seller, tenant, landlord, investor, and developer leads</strong> generated, received, accessed, or worked on during the Recipient's engagement — whether via the Company's CRM, WhatsApp business line, portals (Bayut, Property Finder, Dubizzle, etc.), website enquiries, walk-ins, referrals, or any other channel — are the sole property of <strong>JBJ GLOBAL REAL ESTATE L.L.C S.O.C</strong>. The Recipient shall not export, screenshot, copy, photograph, forward, re-market, or retain any such lead data on personal devices, personal email, personal cloud storage, or any third-party CRM.`),
    offerClause(8, "Breach Events, Damages & Recipient's Acknowledgement", `The Recipient expressly acknowledges and agrees that any of the following acts — whether committed <strong>directly or indirectly</strong>, in the Recipient's own name or through any spouse, relative, nominee, employee, agent, partner, shareholder, or affiliated entity (existing or to be incorporated) — constitutes a material breach of this Agreement: (a) leaking, exporting, copying, screenshotting, photographing, forwarding, transferring, selling, or otherwise disclosing any Company data, lead, client record, CRM extract, WhatsApp chat, pricing sheet, or Confidential Information to any third party; (b) taking, diverting, parking, or working any Company lead outside the Company's systems; (c) contacting, soliciting, transacting with, or following up on any Company lead or client under the name, license, or platform of <strong>any other brokerage, developer, agency, or entity</strong>; (d) joining, consulting for, owning, operating, or establishing a competing brokerage, agency, or real-estate vehicle that uses, exploits, or benefits from any Confidential Information or Company lead; (e) selling, buying, exchanging, brokering, or trading any lead, client contact, pricing intelligence, listing, or market data; (f) referring or introducing any Company lead, client, developer, owner, or investor to any third party for personal benefit, kickback, commission split, gift, or any other consideration; or (g) any attempt, preparation, or facilitation of any of the foregoing. <br/><br/>Upon any such breach, the <strong>Company shall have the sole and exclusive right to assess, quantify, and determine the full extent of the damages</strong> suffered by it — including loss of commission, loss of pipeline, reputational harm, recruitment and retraining costs, investigation costs, and consequential losses — and the Recipient irrevocably <strong>agrees, accepts, and undertakes to pay in full</strong>, on first written demand, (i) the damages so determined by the Company, (ii) all penalties, fines, and liquidated amounts (including a sum equal to the gross commission of any deal closed in breach of clauses 5–7), (iii) all legal, attorney, court, arbitration, expert, investigation, and enforcement costs incurred by the Company, and (iv) any further amounts awarded by a competent UAE court or authority. The Recipient further acknowledges that monetary damages alone may be inadequate and that the Company is additionally entitled to injunctive relief, specific performance, criminal complaint, RERA / DLD reporting, and any other remedy available at law or equity. By signing this Agreement, the Recipient confirms full understanding of, and unconditional consent to, this clause.`),
    offerClause(9, "Comparative Market Data & Pricing", `All <strong>comparative market analyses, price-per-sqft datasets, transaction histories, developer payment plans, off-plan inventory grids, commission matrices, brokerage league tables, internal valuations, and market intelligence reports</strong> prepared by or for the Company are Confidential Information. The Recipient shall not share, publish, post, present, or reuse such data outside the Company, including on LinkedIn, Instagram, broker WhatsApp groups, or with any competing brokerage.`),
    offerClause(10, "Return or Destruction", `Upon the Company's request or upon the end of the Recipient's engagement, the Recipient shall promptly return — without retaining copies — or, at the Company's option, securely destroy all Confidential Information in their possession or control, in all tangible and intangible forms, including copies, derivatives and backups across personal devices, personal email, and personal cloud accounts, and shall certify such destruction in writing if requested.`),
    offerClause(11, "Data Protection", `The Recipient shall comply with UAE Federal Decree-Law No. 45 of 2021 (Personal Data Protection Law), the Dubai Land Department and RERA data-handling rules, and all applicable data-protection laws when handling personal data shared by the Company.`),
    offerClause(12, "Governing Law & Jurisdiction", `This Agreement is governed by the laws of the United Arab Emirates as applied in the Emirate of Dubai. The Parties submit to the exclusive jurisdiction of the Dubai Courts.`),
  ].join("");



  return [
    recipientBlock(f),
    subjectLine("Non-Disclosure Agreement"),
    licenceNotice,
    identityTable,
    paragraphs(input.aiIntro),
    clauses,
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle,
      ownerDate: input.ownerDate,
      // Always render the Recipient's FULL legal name (including father's
      // name where available) — `id.name` is resolved via bestLegalName which
      // already prefers the transliterated full Arabic name when the English
      // MRZ line is initials-only.
      applicantName: id.name || candidateName,
      applicantTitle: position,
      applicantDate: input.applicantDate,
      applicantLabel: "Recipient Signature",
      applicantMetaRows: candidateArabicName ? [["Arabic Name", id.arabicName]] : undefined,
      // LOCKED RULE: NDA recipient signature carries the SAME acknowledgement
      // sentence as the Offer Letter recipient signature, worded for the NDA
      // context. Confirms irrevocable acceptance of all NDA terms + loyalty
      // commitment to the Company.
      applicantAcknowledgement: `I, ${candidateName}${candidateArabicName ? ` (${candidateArabicName})` : ""}, hereby confirm that I have read, fully understood, and irrevocably accept all terms, conditions, obligations, restrictions, non-circumvention, non-compete, lead-ownership and confidentiality undertakings set out in this Non-Disclosure Agreement and its accompanying Offer Letter, and I commit to act with full loyalty, integrity, and confidentiality toward J B J GLOBAL REAL ESTATE L.L.C S.O.C throughout and after my engagement with the Company.`,
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
  { label: "Direct deals (Broker-sourced)", rate: "65% Broker / 35% Company", trigger: "Own direct deals — paid after JBJ Global Real Estate LLC SOC receives the cleared net commission", notes: "Enhanced while HR, admin and assistant duties are performed; reverts to 50/50 otherwise" },
  { label: "Company-sourced leads", rate: "55% Broker / 45% Company", trigger: "Leads supplied by the Company — paid after JBJ Global Real Estate LLC SOC receives the cleared net commission", notes: "Enhanced while HR, admin and assistant duties are performed; reverts to 50/50 otherwise" },
  { label: "Company-approved premium tier · direct deals", rate: "70% Broker / 30% Company", trigger: "Eligible own direct deals only after AED 10,000,000 Company-recognised sales in one year, written management approval, and JBJ receipt of cleared net commission", notes: "Not automatic; calculated on cleared net commission actually received by JBJ after lawful deductions, reversals and transaction costs" },
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
