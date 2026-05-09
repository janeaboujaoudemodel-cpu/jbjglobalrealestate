/**
 * Single source of truth for outreach sender/CC identity (server side).
 *
 * These values are HARD-CODED and CANNOT be overridden by clients.
 * Every outreach edge function must import from here — never hardcode
 * sender or CC emails inline.
 *
 * Brokerage outreach is sent via Resend on the verified jbj.ae domain.
 */

export const ALLOWED_SENDER_DOMAIN = "jbj.ae";

export const PRIMARY_SENDER = "CitiDevelopers@jbj.ae";
export const PRIMARY_SENDER_NAME = "CITI Developers";
export const DEFAULT_REPLY_TO = "CitiDevelopers@jbj.ae";
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

/**
 * Guard: ensure the From address is on the verified Resend domain (jbj.ae).
 * Throws an Error if not — caller should map to HTTP 400.
 */
export function enforceAllowedSender(fromEmail: string): void {
  const lower = (fromEmail || "").trim().toLowerCase();
  if (!lower.endsWith("@" + ALLOWED_SENDER_DOMAIN)) {
    throw new Error(
      `Sender ${fromEmail || "(empty)"} is not on the verified domain @${ALLOWED_SENDER_DOMAIN}. ` +
      `Only @${ALLOWED_SENDER_DOMAIN} addresses can send brokerage outreach.`,
    );
  }
}
