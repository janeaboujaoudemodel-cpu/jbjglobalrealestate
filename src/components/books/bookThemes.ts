import type { BookData } from "@/types/books";

export interface BookTheme {
  /** Primary accent (neon) */
  accent: string;
  /** Secondary accent for per-page rotation */
  accent2: string;
  /** Tertiary accent for per-page rotation */
  accent3: string;
  /** Dark surface background */
  bg: string;
  /** Soft glow shadow color */
  glow: string;
  /** Eyebrow label tone */
  eyebrow: string;
  /** Display font family for headings */
  fontDisplay: string;
}

const THEMES: Record<string, BookTheme> = {
  investment: {
    accent: "#22d3ee",
    accent2: "#a78bfa",
    accent3: "#34d399",
    bg: "#0a1424",
    glow: "rgba(34,211,238,0.35)",
    eyebrow: "#67e8f9",
    fontDisplay: "'Playfair Display', serif",
  },
  offplan: {
    accent: "#f0abfc",
    accent2: "#fbbf24",
    accent3: "#f472b6",
    bg: "#180a1f",
    glow: "rgba(240,171,252,0.35)",
    eyebrow: "#f5d0fe",
    fontDisplay: "'Playfair Display', serif",
  },
  mortgage: {
    accent: "#34d399",
    accent2: "#22d3ee",
    accent3: "#a3e635",
    bg: "#06170f",
    glow: "rgba(52,211,153,0.35)",
    eyebrow: "#6ee7b7",
    fontDisplay: "'Playfair Display', serif",
  },
  legal: {
    accent: "#818cf8",
    accent2: "#22d3ee",
    accent3: "#c084fc",
    bg: "#0b1024",
    glow: "rgba(129,140,248,0.35)",
    eyebrow: "#a5b4fc",
    fontDisplay: "'Playfair Display', serif",
  },
  brokerage: {
    accent: "#fbbf24",
    accent2: "#f0abfc",
    accent3: "#f97316",
    bg: "#1c1208",
    glow: "rgba(251,191,36,0.35)",
    eyebrow: "#fde68a",
    fontDisplay: "'Playfair Display', serif",
  },
  default: {
    accent: "#B89555",
    accent2: "#22d3ee",
    accent3: "#a78bfa",
    bg: "#10131c",
    glow: "rgba(184,149,85,0.35)",
    eyebrow: "#d4af6a",
    fontDisplay: "'Playfair Display', serif",
  },
};

function keyFromBook(book: Pick<BookData, "title" | "category">): keyof typeof THEMES {
  const t = (book.title || "").toLowerCase();
  if (/(invest|portfolio|roi)/.test(t)) return "investment";
  if (/(off[\s-]?plan|launch|payment plan)/.test(t)) return "offplan";
  if (/(mortgage|finance|loan)/.test(t)) return "mortgage";
  if (/(legal|law|escrow|compliance|rera)/.test(t)) return "legal";
  if (/(broker|agent|sales)/.test(t)) return "brokerage";
  return "default";
}

export function getBookTheme(book: Pick<BookData, "title" | "category">): BookTheme {
  return THEMES[keyFromBook(book)];
}

/** Rotate the accent per page so flipping feels alive but on-brand. */
export function getPageAccent(theme: BookTheme, pageIndex: number): string {
  const palette = [theme.accent, theme.accent2, theme.accent3];
  return palette[pageIndex % palette.length];
}
