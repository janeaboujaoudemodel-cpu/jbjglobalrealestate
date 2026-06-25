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
  emeraldDeep: "#042c1c",
  emeraldGradient: "linear-gradient(135deg,#064E3B 0%,#042c1c 58%,#000000 100%)",
  font: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
} as const;

/** A4 @ 96 dpi — captured to PDF at this exact pixel size. */
export const REPORT_PAGE_PX = {
  width: 794,
  height: 1123,
} as const;

export const ROLE_LABELS = {
  investor: "Investor",
  broker: "Broker",
  developer: "Developer",
  owner: "Owner",
  consultant: "JBJ Consultant",
} as const;
