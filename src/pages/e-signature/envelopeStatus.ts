/**
 * Compute a user-friendly display status for an esign envelope.
 *
 * Rule: a `draft` envelope where the user has filled in the key required fields
 * is shown as "Ready" — it's not unfinished, it just hasn't been sent yet.
 * Truly empty drafts stay as "Draft".
 */
export type DisplayStatus =
  | "draft"
  | "ready"
  | "sent"
  | "viewed"
  | "partially_signed"
  | "completed"
  | "declined"
  | "expired"
  | "voided";

export interface EnvelopeLike {
  status?: string | null;
  template_key?: string | null;
  template_field_values?: any;
}

const REQUIRED = ["landlord_name", "mobile_number"] as const;
const PROPERTY_ANY = ["building_name", "community", "property_reference_no"] as const;

export function isReadyDraft(env: EnvelopeLike | null | undefined): boolean {
  if (!env || env.status !== "draft") return false;
  const v = (env.template_field_values as Record<string, string> | null) || {};
  const has = (k: string) => !!(v[k] || "").toString().trim();
  if (!REQUIRED.every(has)) return false;
  return PROPERTY_ANY.some(has);
}

export function computeDisplayStatus(env: EnvelopeLike | null | undefined): DisplayStatus {
  if (!env) return "draft";
  if (env.status === "draft") return isReadyDraft(env) ? "ready" : "draft";
  return (env.status as DisplayStatus) || "draft";
}

/** Mask a phone number for list views: keeps country code + last 2 digits. */
export function maskPhone(raw?: string | null): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return raw;
  const tail = digits.slice(-2);
  return `+${digits.slice(0, Math.min(3, digits.length - 4))} •••• ••${tail}`;
}

/** Mask an email: first letter, then dots; same for domain. */
export function maskEmail(raw?: string | null): string {
  if (!raw) return "";
  const m = /^([^@]+)@(.+)$/.exec(raw.trim());
  if (!m) return raw;
  const [, user, domain] = m;
  const dotIdx = domain.lastIndexOf(".");
  const dom = dotIdx >= 0 ? `${domain[0]}•••${domain.slice(dotIdx)}` : domain;
  return `${user[0]}•••@${dom}`;
}

export function pickClientName(env: any): string {
  return (
    (env?.template_field_values as any)?.landlord_name ||
    env?.esign_recipients?.find?.((r: any) => r?.metadata?.role === "client")?.name ||
    env?.esign_recipients?.[0]?.name ||
    "Unnamed client"
  );
}

export function pickPropertyContext(env: any): string {
  const v = (env?.template_field_values as Record<string, string> | null) || {};
  const parts: string[] = [];
  if (v.property_type) parts.push(v.property_type);
  const place = v.building_name || v.community || v.street_name;
  if (place) parts.push(place);
  return parts.join(" · ");
}

export type TemplateKind = "leasing" | "selling" | "other";

export function getTemplateKind(env: any): TemplateKind {
  const k = (env?.template_key || "").toString();
  if (["jbj-property-advertising-agreement", "jbj-paa-leasing", "jbj-letterhead-leasing"].includes(k)) return "leasing";
  if (k === "jbj-listing-authorisation-selling") return "selling";
  return "other";
}

export function getTemplateKindLabel(k: TemplateKind): string {
  return k === "leasing" ? "Leasing" : k === "selling" ? "Selling" : "Other";
}

/** Normalise bedrooms to comparable string: "studio" | "1".."4" | "5+" | "" */
export function normaliseBedrooms(raw?: string | number | null): string {
  if (raw == null) return "";
  const s = String(raw).trim().toLowerCase();
  if (!s) return "";
  if (/^stu/.test(s) || s === "0") return "studio";
  const n = parseInt(s, 10);
  if (!isFinite(n)) return "";
  if (n >= 5) return "5+";
  return String(n);
}

export function buildSearchHaystack(env: any): string {
  const v = (env?.template_field_values as Record<string, string> | null) || {};
  const recipients = (env?.esign_recipients || [])
    .map((r: any) => `${r?.name || ""} ${r?.email || ""}`)
    .join(" ");
  const kindLabel = getTemplateKindLabel(getTemplateKind(env));
  return [
    env?.name, env?.description, recipients, kindLabel,
    v.doc_number, v.landlord_name, v.mobile_number, v.email_address,
    v.passport_number, v.emirates_id, v.nationality,
    v.property_type, v.building_name, v.community, v.street_name, v.unit_number,
    v.bedrooms ? `${v.bedrooms} bed` : "",
    v.bathrooms ? `${v.bathrooms} bath` : "",
    v.property_reference_no, v.additional_notes,
  ].filter(Boolean).join(" • ").toLowerCase();
}
