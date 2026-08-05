/**
 * Single source of truth for how a saved / exported document is named.
 *
 * Format (owner directive):
 *   "[Applicant Name] – Offer Letter"
 *   "[Applicant Name] – NDA"
 *   "[Applicant Name] – Employment Contract"
 *   "[Applicant Name] – [Document Type]"
 *
 * The literal placeholder text ("Applicant Name", "[Full Name]", …) is NEVER
 * used when a real value exists, and when no name is known yet the title
 * degrades to "Untitled draft – <Type>" and is renamed automatically as soon
 * as the name arrives.
 */

const DASH = "–";

/** Canonical document-type labels per template id. */
const TYPE_LABELS: Record<string, string> = {
  job_offer: "Offer Letter",
  offer_letter: "Offer Letter",
  nda: "NDA",
  employment_contract: "Employment Contract",
  commission_agreement: "Commission Agreement",
  warning_letter: "Warning Letter",
  termination_letter: "Termination Letter",
  experience_letter: "Experience Letter",
  salary_certificate: "Salary Certificate",
  partnership_referral: "Partnership Agreement",
  property_advertising_agreement: "Property Advertising Agreement",
  holiday_home_agreement: "Holiday Home Agreement",
};

const PLACEHOLDER_RE = /^\s*\[?\s*(applicant|candidate|employee|client|full)?\s*name\s*\]?\s*$/i;

/** True when a value is empty or is still a bracketed/placeholder token. */
export function isPlaceholderValue(value: string | null | undefined): boolean {
  const v = (value || "").trim();
  if (!v) return true;
  if (/^\[[^\]]*\]$/.test(v)) return true;
  if (PLACEHOLDER_RE.test(v)) return true;
  if (/^not applicable$/i.test(v)) return true;
  return false;
}

export function documentTypeLabel(templateId?: string | null, fallbackLabel?: string | null): string {
  const id = (templateId || "").toLowerCase();
  if (TYPE_LABELS[id]) return TYPE_LABELS[id];
  const fallback = (fallbackLabel || "").trim();
  if (fallback) return fallback;
  return "Document";
}

/**
 * Build the canonical document title.
 * `templateLabel` is the catalog label used when the template id is unmapped.
 */
export function buildDocumentTitle(
  applicantName: string | null | undefined,
  templateId?: string | null,
  templateLabel?: string | null,
): string {
  const type = documentTypeLabel(templateId, templateLabel);
  const name = (applicantName || "").trim();
  if (isPlaceholderValue(name)) return `Untitled draft ${DASH} ${type}`;
  return `${name} ${DASH} ${type}`;
}

/** File-system safe variant of the same title (used for PDF / DOCX / PNG). */
export function buildDocumentFileBase(
  applicantName: string | null | undefined,
  templateId?: string | null,
  templateLabel?: string | null,
): string {
  return buildDocumentTitle(applicantName, templateId, templateLabel)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s/g, "_");
}
