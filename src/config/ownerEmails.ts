/**
 * Owner email aliases — these inboxes belong to the founder and must NEVER
 * appear in CRM directories (Investors, Leads, etc.). Used by:
 *   - useCRMSectionCounts (investor head-count filter)
 *   - InvestorsDirectory (row filter)
 */
export const OWNER_EMAILS: string[] = [
  "janeaboujaoudemodel@gmail.com",
  "janeaboujaoudenails@gmail.com",
  "contact@janeaboujaoude.net",
  "infoo.jane@gmail.com",
];

/**
 * The primary founder inbox plus verified founder aliases allowed to open the
 * Owner back end.
 *
 * Keep OWNER_EMAILS above as the broader alias list used for CRM filtering and
 * duplicate-prevention. OWNER_BACKEND_EMAILS below is the explicit route/admin
 * allow-list.
 */
export const PRIMARY_OWNER_EMAIL = "janeaboujaoudenails@gmail.com";

// All founder aliases are treated as backend owners so the Owner mode picker
// and /owner routes work from any of Jane's verified inboxes.
export const OWNER_BACKEND_EMAILS: string[] = Array.from(
  new Set<string>([PRIMARY_OWNER_EMAIL, ...OWNER_EMAILS]),
);

export const OWNER_EMAILS_LC = OWNER_EMAILS.map((e) => e.toLowerCase());

export const OWNER_BACKEND_EMAILS_LC = OWNER_BACKEND_EMAILS.map((e) => e.toLowerCase());

export const isOwnerEmail = (email?: string | null) =>
  !!email && OWNER_EMAILS_LC.includes(email.toLowerCase().trim());

export const isOwnerBackendEmail = (email?: string | null) =>
  !!email && OWNER_BACKEND_EMAILS_LC.includes(email.toLowerCase().trim());
