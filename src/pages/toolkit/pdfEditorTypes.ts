// ─── Types & Constants for PDFEditor ──────────────────────────────────────

export interface PDFPage {
  id: string;
  pageNumber: number;
  originalPageNumber: number;
  pdfIndex: number;
  selected: boolean;
  thumbnail?: string;
  rotation: number;
}

export interface LoadedPDF {
  id: string;
  name: string;
  pageCount: number;
  data: Uint8Array;
}

export interface HistoryEntry {
  pages: PDFPage[];
}

/** Champagne-Gold palette */
export const G = {
  gold: "#C8A766",
  goldBright: "#E4C47A",
  goldDim: "#A08040",
  bg: "rgba(200,167,102,0.06)",
  bgHover: "rgba(200,167,102,0.12)",
  border: "rgba(200,167,102,0.22)",
  borderHover: "rgba(200,167,102,0.55)",
  glow: "rgba(200,167,102,0.18)",
  text: "#C8A766",
  surface: "#0E1018",
  surfaceCard: "#111520",
  btnGradient: "linear-gradient(135deg, #A08040, #C8A766)",
  btnShadow: "0 4px 20px rgba(200,167,102,0.3)",
} as const;
