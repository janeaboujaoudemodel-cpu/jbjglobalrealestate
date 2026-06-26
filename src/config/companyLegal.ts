/**
 * JBJ GLOBAL REAL ESTATE — single source of truth for legal identity.
 *
 * Every PAA / Listing Authorisation header, footer, signature block and
 * institutional surface MUST read from these constants so the displayed
 * legal name and office address can never drift from the trade license.
 *
 * Source: Dubai Department of Economy and Tourism — Commercial License
 * No. 1591031, issued 13/01/2026, valid through 12/01/2027.
 *
 * Update only these values when the trade license is renewed.
 */

/** Dotted legal name as printed on the trade license. */
export const TRADE_LICENSE_LEGAL_NAME = "J B J GLOBAL REAL ESTATE L.L.C S.O.C";

/** Display brand (no entity suffix). */
export const TRADE_LICENSE_BRAND = "JBJ GLOBAL REAL ESTATE";

/** Office address line printed on the trade license. */
export const TRADE_LICENSE_OFFICE =
  "Office SM1-195, Port Saeed, Deira, Dubai, UAE";

/** Owner / parcel detail printed alongside the office line. */
export const TRADE_LICENSE_OFFICE_OWNER =
  "Owned by Mohammed Saeed Hareb · Parcel 129-417";

/** DED trade-license number printed on documents. */
export const TRADE_LICENSE_NUMBER = "1591031";

/** Dubai Chamber of Commerce membership number. */
export const TRADE_LICENSE_DCCI_NO = "666113";

/** Commercial register number. */
export const TRADE_LICENSE_REGISTER_NO = "2789619";

/** TRN printed on tax-related documents (set when issued). */
export const TRADE_LICENSE_TRN = "";

export const TRADE_LICENSE_ISSUE_DATE = "2026-01-13";
export const TRADE_LICENSE_EXPIRY_DATE = "2027-01-12";

export const TRADE_LICENSE_LEGAL_TYPE =
  "Limited Liability Company - Single Owner (LLC-SO)";

export const TRADE_LICENSE_OWNER_NAME = "JANE ABDALLAH BOU JAOUDE";
export const TRADE_LICENSE_OWNER_NATIONALITY = "Lebanese";

export const TRADE_LICENSE_ACTIVITIES = [
  "Leasing Property Brokerage Agents",
  "Real Estate Buying & Selling Brokerage",
] as const;

export const COMPANY_CONTACT = {
  phone: "+971 54 716 7107",
  // Letterhead / contract chrome — two-line direct dial. Kept separate from
  // `phone` (which feeds tel: links, schema, and WhatsApp deep links) so
  // changing the letterhead does not break click-to-call elsewhere.
  letterheadPhones: ["+971 50 999 3839", "+971 54 366 2223"] as const,
  email: "Contact@JBJ.AE",
  website: "www.jbj.ae",
} as const;
