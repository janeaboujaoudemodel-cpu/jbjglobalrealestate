import {
  RectangleHorizontal, RectangleVertical, Square, Maximize2, Monitor, Ticket, Mail,
} from "lucide-react";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Template = "modern" | "classic" | "minimal" | "bold" | "creative" | "corporate" | "ai-design";
export type CardShape = "horizontal" | "vertical" | "square" | "rounded-square" | "wide" | "digital" | "ticket" | "email-signature";
export type QrPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";
export type QrContentType = "url" | "vcard" | "text" | "email" | "phone";
export type TextAlign = "left" | "center" | "right";
export type GradientDirection = "to right" | "to left" | "to bottom" | "to top" | "135deg" | "45deg";
export type FinishEffect = "none" | "matte" | "glossy" | "spot-uv" | "embossed";
export type MockupScene = "none" | "desk" | "pocket" | "stationery" | "hand";

export interface CardData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

export type BilingualMode = "off" | "dual-side" | "single-card";
export type BilingualLanguage = "ar" | "zh" | "hi" | "fr" | "de" | "es" | "ru" | "ja" | "ko" | "ur" | "fa" | "custom";

export const BILINGUAL_LANGUAGES: { id: BilingualLanguage; label: string; dir: "rtl" | "ltr" }[] = [
  { id: "ar", label: "العربية (Arabic)", dir: "rtl" },
  { id: "ur", label: "اردو (Urdu)", dir: "rtl" },
  { id: "fa", label: "فارسی (Persian)", dir: "rtl" },
  { id: "zh", label: "中文 (Chinese)", dir: "ltr" },
  { id: "hi", label: "हिन्दी (Hindi)", dir: "ltr" },
  { id: "ja", label: "日本語 (Japanese)", dir: "ltr" },
  { id: "ko", label: "한국어 (Korean)", dir: "ltr" },
  { id: "fr", label: "Français (French)", dir: "ltr" },
  { id: "de", label: "Deutsch (German)", dir: "ltr" },
  { id: "es", label: "Español (Spanish)", dir: "ltr" },
  { id: "ru", label: "Русский (Russian)", dir: "ltr" },
  { id: "custom", label: "Other", dir: "ltr" },
];

export interface FieldPos { x: number; y: number; }

export interface AiSvgElement {
  type: "path" | "circle" | "rect" | "polygon" | "line" | "ellipse";
  d?: string;
  cx?: number; cy?: number; rx?: number; ry?: number; r?: number;
  x?: number; y?: number; width?: number; height?: number; rx_attr?: number;
  points?: string;
  x1?: number; y1?: number; x2?: number; y2?: number;
  fill?: string; stroke?: string; strokeWidth?: number; fillOpacity?: number; strokeOpacity?: number;
}

export interface AiDesignData {
  elements: AiSvgElement[];
  colors: string[];
  bgColor: string;
  textColor: string;
  accentColor?: string;
  style?: string;
  industry?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const TEMPLATES: { id: Template; label: string; desc: string; badge?: string }[] = [
  { id: "modern",    label: "Modern",    desc: "Full-bleed gradient" },
  { id: "classic",   label: "Classic",   desc: "White + color accent" },
  { id: "minimal",   label: "Minimal",   desc: "Clean & typographic" },
  { id: "bold",      label: "Bold",      desc: "Dark, high contrast" },
  { id: "creative",  label: "Creative",  desc: "Geometric shape" },
  { id: "corporate", label: "Corporate", desc: "Formal + footer bar" },
  { id: "ai-design", label: "AI Design", desc: "Generated patterns", badge: "AI" },
];

export const COLOR_PRESETS: { primary: string; secondary: string; label: string; accent: string }[] = [
  { primary: "#C8A766", secondary: "#ffffff", label: "JBJ Gold",   accent: "#1a1a1a" },
  { primary: "#1e3a8a", secondary: "#ffffff", label: "Navy Blue",  accent: "#93c5fd" },
  { primary: "#0f766e", secondary: "#ffffff", label: "Teal",       accent: "#99f6e4" },
  { primary: "#7c3aed", secondary: "#ffffff", label: "Violet",     accent: "#ddd6fe" },
  { primary: "#be123c", secondary: "#ffffff", label: "Crimson",    accent: "#fecdd3" },
  { primary: "#334155", secondary: "#ffffff", label: "Slate",      accent: "#cbd5e1" },
  { primary: "#111827", secondary: "#ffffff", label: "Onyx",       accent: "#d1d5db" },
  { primary: "#065f46", secondary: "#ffffff", label: "Forest",     accent: "#6ee7b7" },
  { primary: "#000000", secondary: "#C8A766", label: "Pure Black", accent: "#C8A766" },
];

export const CARD_SHAPES: { id: CardShape; label: string; icon: React.ReactNode; ratio: string }[] = [
  { id: "horizontal",      label: "Horizontal", icon: React.createElement(RectangleHorizontal, { size: 14 }), ratio: "3.5 / 2"  },
  { id: "vertical",        label: "Vertical",   icon: React.createElement(RectangleVertical, { size: 14 }),   ratio: "2 / 3.5"  },
  { id: "square",          label: "Square",     icon: React.createElement(Square, { size: 14 }),              ratio: "1 / 1"    },
  { id: "rounded-square",  label: "Rounded",    icon: React.createElement(Square, { size: 14 }),              ratio: "1 / 1"    },
  { id: "wide",            label: "Wide",       icon: React.createElement(Maximize2, { size: 14 }),           ratio: "4 / 1.5"  },
  { id: "digital",         label: "Digital",    icon: React.createElement(Monitor, { size: 14 }),             ratio: "9 / 16"   },
  { id: "ticket",          label: "Ticket",     icon: React.createElement(Ticket, { size: 14 }),              ratio: "5 / 2"    },
  { id: "email-signature", label: "Email Sig",  icon: React.createElement(Mail, { size: 14 }),               ratio: "600 / 200" },
];

export function getShapeStyle(shape: CardShape): React.CSSProperties {
  const shapes: Record<CardShape, React.CSSProperties> = {
    "horizontal":     { aspectRatio: "3.5 / 2",  borderRadius: 12 },
    "vertical":       { aspectRatio: "2 / 3.5",  borderRadius: 12 },
    "square":         { aspectRatio: "1 / 1",    borderRadius: 12 },
    "rounded-square": { aspectRatio: "1 / 1",    borderRadius: 40 },
    "wide":           { aspectRatio: "4 / 1.5",  borderRadius: 12 },
    "digital":        { aspectRatio: "9 / 16",   borderRadius: 24 },
    "ticket":         { aspectRatio: "5 / 2",    borderRadius: 8  },
    "email-signature":{ aspectRatio: "600 / 200", borderRadius: 8 },
  };
  return shapes[shape];
}

export const DEFAULT_FIELD_POSITIONS = {
  name:    { x: 10, y: 65 },
  title:   { x: 10, y: 52 },
  company: { x: 10, y: 40 },
};
export const DEFAULT_LOGO_POS = { x: 78, y: 4 };
export const SNAP_THRESHOLD = 5;

// ─── QR helpers ───────────────────────────────────────────────────────────────
export function buildQrData(type: QrContentType, data: CardData, custom: string): string {
  switch (type) {
    case "vcard":
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${data.name}\nORG:${data.company}\nTITLE:${data.title}\nTEL:${data.phone}\nEMAIL:${data.email}\nURL:${data.website}\nEND:VCARD`;
    case "email": {
      const em = custom || data.email;
      return em ? `mailto:${em}` : "";
    }
    case "phone": {
      const ph = custom || data.phone;
      return ph ? `tel:${ph}` : "";
    }
    case "url": {
      const url = custom || data.website || "";
      if (!url || url === "https://" || url === "http://" || url.trim() === "") return "";
      return url.startsWith("http") ? url : `https://${url}`;
    }
    default: return custom;
  }
}

export function buildQrUrl(data: string, color: string, bgColor: string, size: number): string {
  const colorHex = color.replace("#", "");
  const bgHex    = bgColor === "transparent" ? "ffffff" : bgColor.replace("#", "");
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodeURIComponent(data)}&color=${colorHex}&bgcolor=${bgHex}&margin=2`;
}

export const QR_POSITION_STYLE: Record<QrPosition, React.CSSProperties> = {
  "bottom-right": { bottom: 8, right: 8 },
  "bottom-left":  { bottom: 8, left:  8 },
  "top-right":    { top: 8,    right: 8 },
  "top-left":     { top: 8,    left:  8 },
  "center":       { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
};

// ─── Finishing Effect Overlay ──────────────────────────────────────────────────
export function getFinishOverlayStyle(finish: FinishEffect): React.CSSProperties {
  switch (finish) {
    case "glossy":
      return {
        position: "absolute", inset: 0, zIndex: 25, pointerEvents: "none", borderRadius: "inherit",
        background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.1) 50%, transparent 55%, transparent 100%)",
        mixBlendMode: "overlay",
      };
    case "matte":
      return {
        position: "absolute", inset: 0, zIndex: 25, pointerEvents: "none", borderRadius: "inherit",
        background: "rgba(0,0,0,0.06)",
        backdropFilter: "saturate(0.9) contrast(0.97)",
      };
    case "spot-uv":
      return {
        position: "absolute", inset: 0, zIndex: 25, pointerEvents: "none", borderRadius: "inherit",
        background: "linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%, transparent 60%, rgba(255,255,255,0.3) 65%, transparent 70%)",
        mixBlendMode: "overlay",
      };
    case "embossed":
      return {
        position: "absolute", inset: 0, zIndex: 25, pointerEvents: "none", borderRadius: "inherit",
        boxShadow: "inset 2px 2px 6px rgba(255,255,255,0.15), inset -2px -2px 6px rgba(0,0,0,0.12)",
      };
    default:
      return {};
  }
}
