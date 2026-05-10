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

export const OWNER_EMAILS_LC = OWNER_EMAILS.map((e) => e.toLowerCase());

export const isOwnerEmail = (email?: string | null) =>
  !!email && OWNER_EMAILS_LC.includes(email.toLowerCase().trim());
