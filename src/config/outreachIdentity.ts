/**
 * Frontend mirror of supabase/functions/_shared/outreachIdentity.ts.
 * Used for display only — server forces these values regardless of client input.
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
} as const;
