// Broker registry normalization helpers (shared client + server).
// E.164 phone normalization, email lowercasing, name fuzzy compare,
// specialty label combination.

export const SPECIALTY_OPTIONS = [
  { value: "leasing", label: "Leasing" },
  { value: "sales", label: "Sales" },
  { value: "leasing_sales", label: "Leasing + Sales" },
  { value: "developer_relations", label: "Developer Relations" },
  { value: "event_attendees", label: "Event Attendees" },
  { value: "other", label: "Other" },
] as const;

export type Specialty = typeof SPECIALTY_OPTIONS[number]["value"];

export function normalizePhone(raw: string | null | undefined, defaultCC = "971"): string | null {
  if (!raw) return null;
  let s = String(raw).trim();
  if (!s) return null;
  // Keep leading +, strip everything else
  const hasPlus = s.startsWith("+");
  s = s.replace(/[^\d]/g, "");
  if (!s) return null;
  if (hasPlus) return "+" + s;
  // 00 prefix → +
  if (s.startsWith("00")) return "+" + s.slice(2);
  // Local UAE 0XXXXXXXXX → +971XXXXXXXXX
  if (s.startsWith("0") && s.length >= 9) return "+" + defaultCC + s.slice(1);
  // Already starts with country code (e.g. 971…)
  if (s.length >= 10) return "+" + s;
  return "+" + s;
}

export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  return s.includes("@") ? s : null;
}

export function normalizeName(raw: string | null | undefined): string {
  if (!raw) return "";
  return String(raw)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function nameSimilarity(a: string, b: string): number {
  const A = new Set(normalizeName(a).split(" ").filter(Boolean));
  const B = new Set(normalizeName(b).split(" ").filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / new Set([...A, ...B]).size;
}

/**
 * Combine specialty labels — dedup, preserve order, treat "leasing_sales" as
 * shorthand for both leasing + sales.
 */
export function combineSpecialties(existing: string[] = [], incoming: string[] = []): string[] {
  const expand = (arr: string[]) =>
    arr.flatMap((x) => (x === "leasing_sales" ? ["leasing", "sales"] : [x]));
  const merged = Array.from(new Set([...expand(existing), ...expand(incoming)].filter(Boolean)));
  return merged;
}

/** UI helper: virtual filter — does a row count as Leasing+Sales? */
export function hasBothLeasingSales(labels: string[] = []): boolean {
  return labels.includes("leasing") && labels.includes("sales");
}

export function specialtyLabel(value: string): string {
  return SPECIALTY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
