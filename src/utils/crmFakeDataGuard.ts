/**
 * crmFakeDataGuard
 * --------------------------------------------------------------------------
 * Frontend safety net so any leftover fake / test / legacy / encrypted seed
 * rows never reach the CRM UI, even if the soft-delete migration missed one.
 *
 * Apply with `rows.filter(isRealCRMLead)` before rendering or exporting.
 * --------------------------------------------------------------------------
 */
const FAKE_NAME_PATTERNS = [
  /\[encrypted\]/i,
  /^redacted-/i,
  /^test\b/i,
  /^demo\b/i,
  /test-newsletter/i,
  /system[- ]?verification/i,
];

const FAKE_EMAIL_PATTERNS = [
  /@example\.com$/i,
  /^redacted-/i,
  /@tupmail\.com$/i,
  /^test[^@]*@/i,
  /^fake[^@]*@/i,
  /verification@/i,
  /jbj-verification\.com$/i,
];

const FAKE_SOURCE_VALUES = new Set([
  "system-verification-test",
  "legacy_leads",
]);

export interface MaybeLead {
  full_name?: string | null;
  email_lower?: string | null;
  email?: string | null;
  database_source?: string | null;
  upload_source?: string | null;
  source?: string | null;
  deleted_at?: string | null;
}

export function isRealCRMLead(row: MaybeLead | null | undefined): boolean {
  if (!row) return false;
  if (row.deleted_at) return false;

  const name = (row.full_name ?? "").trim();
  const email = (row.email_lower ?? row.email ?? "").trim();
  const dbSrc = (row.database_source ?? "").trim().toLowerCase();
  const upSrc = (row.upload_source ?? "").trim().toLowerCase();
  const src = (row.source ?? "").trim().toLowerCase();

  if (FAKE_SOURCE_VALUES.has(dbSrc)) return false;
  if (FAKE_SOURCE_VALUES.has(src)) return false;
  if (dbSrc.startsWith("legacy")) return false;
  if (upSrc.startsWith("legacy")) return false;

  if (name && FAKE_NAME_PATTERNS.some((re) => re.test(name))) return false;
  if (email && FAKE_EMAIL_PATTERNS.some((re) => re.test(email))) return false;

  return true;
}

export function filterRealLeads<T extends MaybeLead>(rows: T[] | null | undefined): T[] {
  if (!rows?.length) return [];
  return rows.filter(isRealCRMLead);
}
