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

/** Clean Professional Blue palette */
export const G = {
  gold: "#2563EB",
  goldBright: "#3B82F6",
  goldDim: "#1D4ED8",
  bg: "rgba(37,99,235,0.04)",
  bgHover: "rgba(37,99,235,0.08)",
  border: "rgba(37,99,235,0.15)",
  borderHover: "rgba(37,99,235,0.35)",
  glow: "rgba(37,99,235,0.12)",
  text: "#2563EB",
  surface: "#FFFFFF",
  surfaceCard: "#F8FAFC",
  btnGradient: "linear-gradient(135deg, #2563EB, #3B82F6)",
  btnShadow: "0 4px 20px rgba(37,99,235,0.25)",
} as const;
