/**
 * Central config of premium actions that require authentication.
 * Keep this list stable — it powers analytics and copy in <PremiumGate>.
 */
export type PremiumActionKey =
  | "view_property"
  | "view_details"
  | "download_brochure"
  | "register_interest"
  | "read_guide"
  | "download_pdf"
  | "view_market_report"
  | "view_area_guide"
  | "ai_home_finder"
  | "ai_measurement"
  | "ai_interior_design"
  | "ai_matchmaking"
  | "ai_reports"
  | "dashboard"
  | "crm"
  | "library_document"
  | "insights_article";

export const PREMIUM_ACTION_LABEL: Record<PremiumActionKey, string> = {
  view_property: "view this property",
  view_details: "view full details",
  download_brochure: "download the brochure",
  register_interest: "register interest",
  read_guide: "read the guide",
  download_pdf: "download this PDF",
  view_market_report: "read the full market report",
  view_area_guide: "explore this area guide",
  ai_home_finder: "use the AI Home Finder",
  ai_measurement: "use Property Measurement",
  ai_interior_design: "use Interior Design AI",
  ai_matchmaking: "use AI Matchmaking",
  ai_reports: "generate AI reports",
  dashboard: "open your dashboard",
  crm: "open the CRM",
  library_document: "open this Library document",
  insights_article: "read this insight",
};

export const CONVERSION_HEADLINES = [
  "Create your free account in under 30 seconds",
  "Unlock the complete JBJ platform — completely free",
  "Access premium listings, AI tools, market insights & exclusive resources",
  "Join thousands of investors, brokers & developers on the JBJ ecosystem",
];

export const CONVERSION_SUB =
  "One account, every JBJ tool — property intelligence, AI advisors, insights, and personalised guidance.";
