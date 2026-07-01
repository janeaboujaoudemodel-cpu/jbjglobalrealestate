/**
 * Single source of truth for the AI Home Finder report.
 * These tokens drive BOTH the on-screen Live Preview AND the exported PDF.
 * Do NOT duplicate these values in jsPDF code or anywhere else — import them.
 */
export const REPORT_TOKENS = {
  page: "#FDFBF7",
  surface: "#F7F2EA",
  raised: "#EFE6D6",
  ink: "#1A1A1A",
  muted: "#5a5246",
  mutedSoft: "#7a7060",
  gold: "#B89555",
  goldSoft: "rgba(184,149,85,0.45)",
  goldHair: "rgba(184,149,85,0.35)",
  emerald: "#064E3B",
  // Approved JBJ emerald: deep emerald → forest → black ombré.
  // This intentionally rejects the flat/restricted green block treatment.
  emeraldDeep: "#042c1c",
  emeraldGradient: "linear-gradient(135deg,#064E3B 0%,#042c1c 58%,#000000 100%)",
  font: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
} as const;

/** A4 @ 96 dpi — captured to PDF at this exact pixel size. */
export const REPORT_PAGE_PX = {
  width: 794,
  height: 1123,
} as const;

/** Unified typography scale — every page uses these, never hardcoded sizes. */
export const TYPE = {
  h1:      { fontSize: 34,   lineHeight: 1.08, fontWeight: 900 as const, letterSpacing: "0" },
  h2:      { fontSize: 24,   lineHeight: 1.14, fontWeight: 900 as const, letterSpacing: "0" },
  h3:      { fontSize: 16,   lineHeight: 1.22, fontWeight: 900 as const, letterSpacing: "0" },
  eyebrow: { fontSize: 9.5,  lineHeight: 1,    fontWeight: 900 as const, letterSpacing: "0.18em", textTransform: "uppercase" as const },
  body:    { fontSize: 11.5, lineHeight: 1.6,  fontWeight: 500 as const },
  bodyEm:  { fontSize: 11.5, lineHeight: 1.6,  fontWeight: 700 as const },
  meta:    { fontSize: 10,   lineHeight: 1.45, fontWeight: 700 as const },
  micro:   { fontSize: 8.8,  lineHeight: 1.35, fontWeight: 800 as const, letterSpacing: "0.12em", textTransform: "uppercase" as const },
  price:   { fontSize: 15,   lineHeight: 1,    fontWeight: 900 as const },
} as const;

/** Unified spacing scale. */
export const SP = {
  pad: 14,
  padLg: 20,
  padXl: 24,
  gap: 12,
  gapLg: 16,
  radius: 9,
  radiusSm: 7,
  /** Single source for <main> padding on every page. */
  pageMain: "26px 44px 20px",
  headerH: 92,
  footerH: 54,
} as const;

/** CSS var driving the gap between sheets — 0 in PDF host, 18px in preview only. */
export const PAGE_SEP_VAR = "--jbj-report-page-sep";

export const ROLE_LABELS = {
  investor: "Investor",
  broker: "Broker",
  developer: "Developer",
  owner: "Owner",
  consultant: "JBJ Consultant",
} as const;
