/**
 * Pure helpers that decide whether a developer registry row belongs in the
 * Outreach Queue or the Sent History tab. Extracted so the rules can be
 * unit-tested in isolation from the CRM page UI.
 *
 * Rules (mutually exclusive — a developer never appears in both pools):
 *
 *  - History: anyone who has actually received an email
 *    (`last_outreach_at` set OR `outreach_count > 0`), PLUS every
 *    `registered` developer regardless of email history.
 *
 *  - Queue: everyone else — i.e. NOT registered AND no email ever sent.
 *
 * In particular, `pending_application` developers that have NOT been emailed
 * must remain in the queue. Once they receive an email they migrate to
 * history. This invariant is exercised by the tests in
 * `developerPools.test.ts`.
 */

export type DeveloperRow = {
  id?: string;
  status?: string | null;
  last_outreach_at?: string | null;
  outreach_count?: number | null;
  // Other fields are irrelevant to the pool rules.
  [key: string]: unknown;
};

export const hasBeenEmailed = (r: DeveloperRow): boolean =>
  !!r.last_outreach_at || (r.outreach_count ?? 0) > 0;

export const isInHistoryPool = (r: DeveloperRow): boolean =>
  hasBeenEmailed(r) || r.status === "registered";

export const isInQueuePool = (r: DeveloperRow): boolean =>
  r.status !== "registered" && !hasBeenEmailed(r);

export const splitDeveloperPools = <T extends DeveloperRow>(rows: T[]) => ({
  queuePool: rows.filter(isInQueuePool),
  historyPool: rows.filter(isInHistoryPool),
});
