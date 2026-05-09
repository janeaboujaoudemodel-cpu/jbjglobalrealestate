/**
 * JBJ GLOBAL REAL ESTATE — single source of truth for legal identity.
 *
 * Every PAA / Listing Authorisation header, footer, signature block and
 * institutional surface MUST read from these constants so the displayed
 * legal name and office address can never drift from the trade license.
 *
 * Update only these values when the trade license is renewed.
 */

/** Dotted legal name as printed on the trade license. */
export const TRADE_LICENSE_LEGAL_NAME = "JBJ GLOBAL REAL ESTATE L.L.C - S.O.C";

/** Display brand (no entity suffix). */
export const TRADE_LICENSE_BRAND = "JBJ GLOBAL REAL ESTATE";

/**
 * Office address line printed on the trade license.
 *
 * Leave empty to suppress the address line on generated documents until the
 * exact address is confirmed. Do NOT substitute a guess (e.g. "Downtown Dubai").
 */
export const TRADE_LICENSE_OFFICE = "";

/** DED / RERA / trade-license number printed on documents. */
export const TRADE_LICENSE_NUMBER = "";

/** TRN printed on tax-related documents. */
export const TRADE_LICENSE_TRN = "";

export const COMPANY_CONTACT = {
  phone: "+971 54 716 7107",
  email: "CONTACT@JBJ.AE",
  website: "WWW.JBJ.AE",
} as const;
