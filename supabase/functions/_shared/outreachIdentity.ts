/**
 * Single source of truth for outreach sender/CC identity (server side).
 *
 * These values are HARD-CODED and CANNOT be overridden by clients.
 * Every outreach edge function must import from here — never hardcode
 * sender or CC emails inline.
 */

export const PRIMARY_SENDER = "jane@citideveloper.com";
export const PRIMARY_SENDER_NAME = "Jane Bou Jaoude";
export const DEFAULT_REPLY_TO = "jane@citideveloper.com";
export const DEFAULT_CC = "infoo.jane@gmail.com";

export const TEST_DEFAULTS = {
  to: "infoo.jane@gmail.com",
  cc: "",
  from_email: PRIMARY_SENDER,
  from_name: PRIMARY_SENDER_NAME,
  reply_to: DEFAULT_REPLY_TO,
  sample_brokerage_name: "ABC Real Estates",
};

/** Force production identity onto any inbound payload. */
export function forceProductionIdentity<T extends {
  from_email?: string;
  from_name?: string;
  reply_to?: string;
  cc_emails?: string[];
}>(input: T): T & {
  from_email: string;
  from_name: string;
  reply_to: string;
  cc_emails: string[];
} {
  const ccs = (input.cc_emails || []).map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (!ccs.includes(DEFAULT_CC.toLowerCase())) ccs.push(DEFAULT_CC);
  return {
    ...input,
    from_email: PRIMARY_SENDER,
    from_name: PRIMARY_SENDER_NAME,
    reply_to: DEFAULT_REPLY_TO,
    cc_emails: ccs,
  };
}

/** Normalize legacy single-o variant to the correct double-o address. */
export function fixCcEmail(v: string | null | undefined): string {
  return (v || "").trim().replace(/\binfo\.jane@gmail\.com\b/gi, "infoo.jane@gmail.com");
}
