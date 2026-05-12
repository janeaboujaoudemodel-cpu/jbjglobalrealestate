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

/**
 * Global Reply-To address for ALL outbound mail (e-sign, transactional,
 * marketing, broker, AI, etc.). Anything sent from noreply@jbj.ae must
 * route human replies to a real inbox.
 */
export const REPLY_TO_CONTACT = "contact@jbj.ae";

/**
 * Inject Reply-To: contact@jbj.ae into any Resend payload that doesn't
 * already specify one. Use this in EVERY edge function that calls
 * resend.emails.send / the Resend gateway.
 */
export function withReplyTo<T extends Record<string, unknown>>(payload: T): T & { reply_to: string } {
  const existing = (payload as any).reply_to;
  if (typeof existing === "string" && existing.trim()) return payload as T & { reply_to: string };
  if (Array.isArray(existing) && existing.length > 0) return payload as T & { reply_to: string };
  return { ...payload, reply_to: REPLY_TO_CONTACT };
}

/**
 * Branded auto-reply HTML for inbound mail to noreply@jbj.ae.
 * Used by the inbound webhook AND any other inbound entry point.
 */
export function buildNoreplyBounceHtml(originalSubject?: string): string {
  const subj = originalSubject ? originalSubject.replace(/[<>&]/g, "") : "";
  return `<!doctype html><html><body style="margin:0;background:#FDFBF7;font-family:Inter,Arial,sans-serif;color:#1A1A1A;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #B89555;border-radius:6px;padding:32px;">
          <tr><td style="border-bottom:1px solid #B89555;padding-bottom:14px;">
            <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#1A1A1A;opacity:.7;">JBJ GLOBAL REAL ESTATE</div>
          </td></tr>
          <tr><td style="padding-top:18px;font-size:14px;line-height:1.55;">
            <p style="margin:0 0 14px;">Hello,</p>
            <p style="margin:0 0 14px;">Thank you for writing in${subj ? ` regarding "<strong>${subj}</strong>"` : ""}. This inbox (<strong>noreply@jbj.ae</strong>) does not receive replies.</p>
            <p style="margin:0 0 14px;">For anything you need, please email <a href="mailto:contact@jbj.ae" style="color:#1A1A1A;border-bottom:1px solid #B89555;text-decoration:none;"><strong>contact@jbj.ae</strong></a> and a real person on the JBJ team will get back to you shortly.</p>
            <p style="margin:18px 0 0;color:#1A1A1A;opacity:.7;font-size:12px;">— JBJ Global Real Estate</p>
          </td></tr>
        </table>
      </td></tr>
    </table></body></html>`;
}
