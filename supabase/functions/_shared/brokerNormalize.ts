// Mirror of src/lib/crm/brokerNormalize.ts for edge functions.
// Keep in sync.

export function normalizePhone(raw: string | null | undefined, defaultCC = "971"): string | null {
  if (!raw) return null;
  let s = String(raw).trim();
  if (!s) return null;
  const hasPlus = s.startsWith("+");
  s = s.replace(/[^\d]/g, "");
  if (!s) return null;
  if (hasPlus) return "+" + s;
  if (s.startsWith("00")) return "+" + s.slice(2);
  if (s.startsWith("0") && s.length >= 9) return "+" + defaultCC + s.slice(1);
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

export function combineSpecialties(existing: string[] = [], incoming: string[] = []): string[] {
  const expand = (arr: string[]) =>
    arr.flatMap((x) => (x === "leasing_sales" ? ["leasing", "sales"] : [x]));
  return Array.from(new Set([...expand(existing), ...expand(incoming)].filter(Boolean)));
}
