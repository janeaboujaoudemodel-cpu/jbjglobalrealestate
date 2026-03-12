import { useState, useRef, useCallback, useEffect } from "react";
import CardShareAnalytics from "@/components/corporate-suite/CardShareAnalytics";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, CreditCard, Phone, Mail, Globe,
  MapPin, Building2, RefreshCw, Eye, Layers,
  LayoutGrid, Check, ImageIcon, ChevronDown, QrCode, Move,
  Lock, Unlock, RotateCcw, Sparkles, RectangleHorizontal,
  RectangleVertical, Square, Maximize2, Monitor, Ticket,
  Save, Palette, Zap, Star, Cpu, Minus, Type, User,
  Share2, Copy, ExternalLink, HelpCircle, AlignLeft, AlignCenter, AlignRight, Underline,
  Smartphone, Wifi,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { StudioShell, type StudioSection } from "@/components/ui/StudioShell";
import { DocumentExtractorUpload } from "@/components/corporate-suite/DocumentExtractorUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { BrandAssetLibrary } from "@/components/corporate-suite/BrandAssetLibrary";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { supabase } from "@/integrations/supabase/client";
import DigitalLandingPageEditor, { EMPTY_LANDING_PAGE, type LandingPageData } from "@/components/corporate-suite/DigitalLandingPageEditor";

// ─── Types ────────────────────────────────────────────────────────────────────
type Template = "modern" | "classic" | "minimal" | "bold" | "creative" | "corporate" | "ai-design";
type CardShape = "horizontal" | "vertical" | "square" | "rounded-square" | "wide" | "digital" | "ticket" | "email-signature";
type QrPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";
type QrContentType = "url" | "vcard" | "text" | "email" | "phone";
type TextAlign = "left" | "center" | "right";
type GradientDirection = "to right" | "to left" | "to bottom" | "to top" | "135deg" | "45deg";

interface CardData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

type BilingualMode = "off" | "dual-side" | "single-card";
type BilingualLanguage = "ar" | "zh" | "hi" | "fr" | "de" | "es" | "ru" | "ja" | "ko" | "ur" | "fa" | "custom";

const BILINGUAL_LANGUAGES: { id: BilingualLanguage; label: string; dir: "rtl" | "ltr" }[] = [
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

interface FieldPos { x: number; y: number; }

interface AiSvgElement {
  type: "path" | "circle" | "rect" | "polygon" | "line" | "ellipse";
  // path
  d?: string;
  // circle/ellipse
  cx?: number; cy?: number; rx?: number; ry?: number; r?: number;
  // rect
  x?: number; y?: number; width?: number; height?: number; rx_attr?: number;
  // polygon
  points?: string;
  // line
  x1?: number; y1?: number; x2?: number; y2?: number;
  // shared
  fill?: string; stroke?: string; strokeWidth?: number; fillOpacity?: number; strokeOpacity?: number;
}

interface AiDesignData {
  elements: AiSvgElement[];
  colors: string[];
  bgColor: string;
  textColor: string;
  accentColor?: string;
  style?: string;
  industry?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TEMPLATES: { id: Template; label: string; desc: string; badge?: string }[] = [
  { id: "modern",    label: "Modern",    desc: "Full-bleed gradient" },
  { id: "classic",   label: "Classic",   desc: "White + color accent" },
  { id: "minimal",   label: "Minimal",   desc: "Clean & typographic" },
  { id: "bold",      label: "Bold",      desc: "Dark, high contrast" },
  { id: "creative",  label: "Creative",  desc: "Geometric shape" },
  { id: "corporate", label: "Corporate", desc: "Formal + footer bar" },
  { id: "ai-design", label: "AI Design", desc: "Generated patterns", badge: "AI" },
];

const COLOR_PRESETS: { primary: string; secondary: string; label: string; accent: string }[] = [
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

const CARD_SHAPES: { id: CardShape; label: string; icon: React.ReactNode; ratio: string }[] = [
  { id: "horizontal",      label: "Horizontal", icon: <RectangleHorizontal size={14} />, ratio: "3.5 / 2"  },
  { id: "vertical",        label: "Vertical",   icon: <RectangleVertical size={14} />,   ratio: "2 / 3.5"  },
  { id: "square",          label: "Square",     icon: <Square size={14} />,              ratio: "1 / 1"    },
  { id: "rounded-square",  label: "Rounded",    icon: <Square size={14} />,              ratio: "1 / 1"    },
  { id: "wide",            label: "Wide",       icon: <Maximize2 size={14} />,           ratio: "4 / 1.5"  },
  { id: "digital",         label: "Digital",    icon: <Monitor size={14} />,             ratio: "9 / 16"   },
  { id: "ticket",          label: "Ticket",     icon: <Ticket size={14} />,              ratio: "5 / 2"    },
  { id: "email-signature", label: "Email Sig",  icon: <Mail size={14} />,               ratio: "600 / 200" },
];

function getShapeStyle(shape: CardShape): React.CSSProperties {
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

const DEFAULT_FIELD_POSITIONS = {
  name:    { x: 10, y: 65 },
  title:   { x: 10, y: 52 },
  company: { x: 10, y: 40 },
};
const DEFAULT_LOGO_POS = { x: 78, y: 4 };
const SNAP_THRESHOLD = 5;

// ─── QR helpers ───────────────────────────────────────────────────────────────
function buildQrData(type: QrContentType, data: CardData, custom: string): string {
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
      // Guard: bare scheme with no domain is invalid — return empty to suppress QR
      if (!url || url === "https://" || url === "http://" || url.trim() === "") return "";
      return url.startsWith("http") ? url : `https://${url}`;
    }
    default: return custom;
  }
}

function buildQrUrl(data: string, color: string, bgColor: string, size: number): string {
  const colorHex = color.replace("#", "");
  const bgHex    = bgColor === "transparent" ? "ffffff" : bgColor.replace("#", "");
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodeURIComponent(data)}&color=${colorHex}&bgcolor=${bgHex}&margin=2`;
}

const QR_POSITION_STYLE: Record<QrPosition, React.CSSProperties> = {
  "bottom-right": { bottom: 8, right: 8 },
  "bottom-left":  { bottom: 8, left:  8 },
  "top-right":    { top: 8,    right: 8 },
  "top-left":     { top: 8,    left:  8 },
  "center":       { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
};

// ─── Card Preview Component ───────────────────────────────────────────────────
function CardFace({
  data, template, primary, secondary, accent, side = "front", scale = 1, shapeStyle, aiDesignData, cardShape,
  fontFamily, fontWeight, fontStyle, nameFontSize,
  bilingualMode, bilingualDir, secondaryData,
  onInlineEdit,
}: {
  data: CardData; template: Template; primary: string;
  secondary: string; accent: string; side?: "front" | "back"; scale?: number;
  shapeStyle?: React.CSSProperties; aiDesignData?: AiDesignData | null;
  cardShape?: CardShape;
  fontFamily?: string; fontWeight?: string; fontStyle?: string; nameFontSize?: number | null;
  bilingualMode?: BilingualMode; bilingualDir?: "rtl" | "ltr"; secondaryData?: CardData;
  onInlineEdit?: (field: keyof CardData) => void;
}) {
  // Determine if bilingual back side should show secondary data
  const showSecondary = bilingualMode === "dual-side" && side === "back" && secondaryData;
  const displayData = showSecondary ? secondaryData : data;
  const displayDir = showSecondary ? (bilingualDir || "ltr") : "ltr";

  const name    = displayData.name    || "Your Name";
  const title   = displayData.title   || "Job Title";
  const company = displayData.company || "Company Name";
  const initial = name.charAt(0).toUpperCase();

  // For single-card bilingual, show secondary text below primary
  const showBilingualInline = bilingualMode === "single-card" && side === "front" && secondaryData;
  const secName    = secondaryData?.name    || "";
  const secTitle   = secondaryData?.title   || "";
  const secCompany = secondaryData?.company || "";

  const resolvedFontWeight = fontWeight || "800";
  const resolvedFontStyle  = fontStyle  || "normal";
  const resolvedNameSize   = nameFontSize != null ? nameFontSize * scale : 18 * scale;

  // Inline edit click handler
  const editClick = (field: keyof CardData) => (e: React.MouseEvent) => {
    if (onInlineEdit) {
      e.stopPropagation();
      onInlineEdit(field);
    }
  };
  const editStyle: React.CSSProperties = onInlineEdit ? { cursor: "text", borderBottom: "1px dashed transparent" } : {};
  const editHoverClass = onInlineEdit ? "hover:border-b hover:border-dashed hover:border-current" : "";

  const baseStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "3.5 / 2",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    fontFamily: fontFamily || "'Helvetica Neue', Arial, sans-serif",
    position: "relative",
    userSelect: "none",
    ...shapeStyle,
  };

  // ── EMAIL SIGNATURE ─────────────────────────────────────────
  if (cardShape === "email-signature" || shapeStyle?.aspectRatio === "600 / 200") {
    return (
      <div style={{ ...baseStyle, background: "#ffffff", border: `2px solid ${primary}`, display: "flex", alignItems: "center", padding: `${14 * scale}px ${20 * scale}px`, gap: 16 * scale }}>
        <div style={{ borderRight: `3px solid ${primary}`, paddingRight: 16 * scale, minWidth: 120 * scale }}>
          <p style={{ fontSize: resolvedNameSize * 0.78, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: primary, margin: 0, lineHeight: 1.2 }}>{name}</p>
          <p style={{ fontSize: 9 * scale, color: "#555", margin: `${3 * scale}px 0 0`, fontWeight: 500 }}>{title}</p>
          <p style={{ fontSize: 8.5 * scale, color: "#999", margin: `${2 * scale}px 0 0`, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{company}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 * scale, flex: 1 }}>
          {data.phone   && <p style={{ fontSize: 8.5 * scale, color: "#444", margin: 0 }}>T: {data.phone}</p>}
          {data.email   && <p style={{ fontSize: 8.5 * scale, color: primary, margin: 0 }}>{data.email}</p>}
          {data.website && <p style={{ fontSize: 8.5 * scale, color: primary, margin: 0 }}>{data.website}</p>}
          {data.address && <p style={{ fontSize: 8 * scale, color: "#888", margin: 0 }}>{data.address}</p>}
        </div>
      </div>
    );
  }

  // ── TICKET ──────────────────────────────────────────────────
  if (cardShape === "ticket" && side === "front") {
    return (
      <div style={{ ...baseStyle, background: "#fff", border: `2px solid ${primary}`, display: "flex", overflow: "hidden" }}>
        {/* Left stub */}
        <div style={{
          width: "32%", background: primary, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: `${10 * scale}px ${8 * scale}px`, gap: 6 * scale, flexShrink: 0,
        }}>
          <div style={{
            width: 32 * scale, height: 32 * scale, borderRadius: "50%",
            background: secondary, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 14 * scale, fontWeight: 800, color: primary }}>{initial}</span>
          </div>
          <p style={{ fontSize: 7 * scale, fontWeight: 700, color: secondary, opacity: 0.85, textAlign: "center", wordBreak: "break-word", margin: 0 }}>
            {company}
          </p>
        </div>
        {/* Perforation divider */}
        <div style={{
          width: 1, flexShrink: 0,
          background: `repeating-linear-gradient(to bottom, ${primary}80 0px, ${primary}80 5px, transparent 5px, transparent 10px)`,
        }} />
        {/* Right body */}
        <div style={{
          flex: 1, padding: `${10 * scale}px ${14 * scale}px`,
          display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 * scale,
        }}>
          <h2 style={{ fontSize: resolvedNameSize * 0.7, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: "#111", margin: 0, lineHeight: 1.2 }}>{name}</h2>
          <p style={{ fontSize: 8 * scale, color: primary, fontWeight: 600, margin: 0 }}>{title}</p>
          <div style={{ borderTop: `1px solid ${primary}30`, paddingTop: 4 * scale, display: "flex", flexDirection: "column", gap: 2 * scale }}>
            {data.email   && <p style={{ fontSize: 7 * scale, color: "#666", margin: 0 }}>@ {data.email}</p>}
            {data.phone   && <p style={{ fontSize: 7 * scale, color: "#666", margin: 0 }}>☎ {data.phone}</p>}
            {data.website && <p style={{ fontSize: 7 * scale, color: primary, margin: 0 }}>⬡ {data.website}</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── TICKET BACK ──────────────────────────────────────────────
  if (cardShape === "ticket" && side === "back") {
    return (
      <div style={{ ...baseStyle, background: "#fff", border: `2px solid ${primary}`, display: "flex", overflow: "hidden" }}>
        {/* Right info body */}
        <div style={{
          flex: 1, padding: `${10 * scale}px ${14 * scale}px`,
          display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 * scale,
        }}>
          <p style={{ fontSize: 8 * scale, fontWeight: 700, color: "#111", margin: 0, textTransform: "uppercase", letterSpacing: 2 }}>
            {data.company || ""}
          </p>
          <div style={{ borderTop: `1px solid ${primary}30`, paddingTop: 4 * scale, display: "flex", flexDirection: "column", gap: 2 * scale }}>
            {data.address && <p style={{ fontSize: 7 * scale, color: "#666", margin: 0 }}>{data.address}</p>}
            {data.email   && <p style={{ fontSize: 7 * scale, color: "#666", margin: 0 }}>@ {data.email}</p>}
            {data.phone   && <p style={{ fontSize: 7 * scale, color: "#666", margin: 0 }}>☎ {data.phone}</p>}
          </div>
        </div>
        {/* Perforation divider */}
        <div style={{
          width: 1, flexShrink: 0,
          background: `repeating-linear-gradient(to bottom, ${primary}80 0px, ${primary}80 5px, transparent 5px, transparent 10px)`,
        }} />
        {/* Right stub (mirrored) */}
        <div style={{
          width: "32%", background: primary, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: `${10 * scale}px ${8 * scale}px`, gap: 6 * scale, flexShrink: 0,
        }}>
          <div style={{
            width: 28 * scale, height: 28 * scale, borderRadius: "50%",
            border: `2px solid ${secondary}`, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 10 * scale, fontWeight: 700, color: secondary }}>✓</span>
          </div>
          <p style={{ fontSize: 6 * scale, fontWeight: 600, color: secondary, opacity: 0.8, textAlign: "center", margin: 0, letterSpacing: 1, textTransform: "uppercase" }}>
            {data.website || ""}
          </p>
        </div>
      </div>
    );
  }

  if (side === "back") {
    return (
      <div style={{ ...baseStyle, background: primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: secondary, opacity: 0.15 }}>
          <p style={{ fontSize: 24 * scale, fontWeight: 900, letterSpacing: 6, textTransform: "uppercase" }}>
            {data.company || "COMPANY"}
          </p>
        </div>
        <div style={{
          position: "absolute", bottom: 12 * scale, right: 16 * scale,
          fontSize: 8 * scale, color: secondary, opacity: 0.3, letterSpacing: 2,
        }}>
          {data.website || ""}
        </div>
      </div>
    );
  }


  // ── AI DESIGN ───────────────────────────────────────────────
  if (template === "ai-design") {
    const bg = aiDesignData?.bgColor || primary;
    const tc = aiDesignData?.textColor || secondary;
    const ac = aiDesignData?.accentColor || accent;
    const els = aiDesignData?.elements;
    const cols = aiDesignData?.colors || [ac];
    return (
      <div style={{ ...baseStyle, background: bg, overflow: "hidden" }}>
        {/* AI-generated SVG shapes */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden" }} viewBox="0 0 350 200" preserveAspectRatio="xMidYMid slice">
          {els && els.length > 0 ? els.map((el, i) => {
            const fill = el.fill || cols[i % cols.length];
            const stroke = el.stroke || "none";
            const sw = el.strokeWidth ?? 1;
            const fo = el.fillOpacity ?? 0.35;
            const so = el.strokeOpacity ?? 1;
            const shared = { fill, stroke, strokeWidth: sw, fillOpacity: fo, strokeOpacity: so };
            if (el.type === "path" && el.d)       return <path key={i} d={el.d} {...shared} />;
            if (el.type === "circle")              return <circle key={i} cx={el.cx ?? 0} cy={el.cy ?? 0} r={el.r ?? 20} {...shared} />;
            if (el.type === "ellipse")             return <ellipse key={i} cx={el.cx ?? 0} cy={el.cy ?? 0} rx={el.rx ?? 20} ry={el.ry ?? 10} {...shared} />;
            if (el.type === "rect")                return <rect key={i} x={el.x ?? 0} y={el.y ?? 0} width={el.width ?? 40} height={el.height ?? 40} rx={el.rx_attr ?? 0} {...shared} />;
            if (el.type === "polygon" && el.points) return <polygon key={i} points={el.points} {...shared} />;
            if (el.type === "line")                return <line key={i} x1={el.x1 ?? 0} y1={el.y1 ?? 0} x2={el.x2 ?? 0} y2={el.y2 ?? 0} stroke={fill} strokeWidth={sw} strokeOpacity={so} fill="none" />;
            return null;
          }) : (
            /* default placeholder shapes */
            <>
              <circle cx="300" cy="30" r="80" fill={ac} fillOpacity="0.18" />
              <circle cx="320" cy="180" r="50" fill={tc} fillOpacity="0.08" />
              <polygon points="0,0 70,0 0,70" fill={tc} fillOpacity="0.10" />
              <line x1="0" y1="140" x2="350" y2="90" stroke={tc} strokeOpacity="0.07" strokeWidth="2" />
              <rect x="250" y="120" width="120" height="120" rx="60" fill={ac} fillOpacity="0.12" />
            </>
          )}
        </svg>
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: `${20 * scale}px ${24 * scale}px` }}>
          <div>
            <p style={{ fontSize: 9 * scale, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: tc, opacity: 0.65, margin: 0 }}>{company}</p>
            <h2 style={{ fontSize: resolvedNameSize, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: tc, margin: `${4 * scale}px 0 ${2 * scale}px` }}>{name}</h2>
            <p style={{ fontSize: 10 * scale, color: tc, opacity: 0.8, margin: 0 }}>{title}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 * scale }}>
            {data.phone   && <p style={{ fontSize: 8.5 * scale, color: tc, opacity: 0.75, margin: 0 }}>☎ {data.phone}</p>}
            {data.email   && <p style={{ fontSize: 8.5 * scale, color: tc, opacity: 0.75, margin: 0 }}>@ {data.email}</p>}
            {data.website && <p style={{ fontSize: 8.5 * scale, color: tc, opacity: 0.75, margin: 0 }}>⬡ {data.website}</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── MODERN ──────────────────────────────────────────────────
  if (template === "modern") {
    return (
      <div style={{ ...baseStyle, background: `linear-gradient(135deg, ${primary} 0%, ${primary}bb 100%)`, direction: displayDir }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${secondary}15` }} />
        <div style={{ position: "absolute", bottom: -30, left: -10, width: 100, height: 100, borderRadius: "50%", background: `${secondary}10` }} />
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: `${20 * scale}px ${24 * scale}px` }}>
          <div>
            <p onClick={editClick("company")} style={{ ...editStyle, fontSize: 9 * scale, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: secondary, opacity: 0.65, margin: 0 }}>{company}</p>
            <h2 onClick={editClick("name")} style={{ ...editStyle, fontSize: resolvedNameSize, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: secondary, margin: `${4 * scale}px 0 ${2 * scale}px` }}>{name}</h2>
            {showBilingualInline && secName && (
              <p style={{ fontSize: resolvedNameSize * 0.7, fontWeight: resolvedFontWeight, color: secondary, opacity: 0.6, margin: `0 0 ${2 * scale}px`, direction: bilingualDir || "ltr" }}>{secName}</p>
            )}
            <p onClick={editClick("title")} style={{ ...editStyle, fontSize: 10 * scale, color: secondary, opacity: 0.8, margin: 0 }}>{title}</p>
            {showBilingualInline && secTitle && (
              <p style={{ fontSize: 8.5 * scale, color: secondary, opacity: 0.5, margin: `${1 * scale}px 0 0`, direction: bilingualDir || "ltr" }}>{secTitle}</p>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 * scale }}>
            {displayData.phone   && <p onClick={editClick("phone")} style={{ ...editStyle, fontSize: 8.5 * scale, color: secondary, opacity: 0.8, margin: 0 }}>☎ {displayData.phone}</p>}
            {displayData.email   && <p onClick={editClick("email")} style={{ ...editStyle, fontSize: 8.5 * scale, color: secondary, opacity: 0.8, margin: 0 }}>@ {displayData.email}</p>}
            {displayData.website && <p onClick={editClick("website")} style={{ ...editStyle, fontSize: 8.5 * scale, color: secondary, opacity: 0.8, margin: 0 }}>⬡ {displayData.website}</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── CLASSIC ─────────────────────────────────────────────────
  if (template === "classic") {
    return (
      <div style={{ ...baseStyle, background: "#fff", border: `2px solid ${primary}` }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: primary }} />
        <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: `${18 * scale}px ${20 * scale}px ${18 * scale}px ${24 * scale}px` }}>
          <div>
            <h2 style={{ fontSize: resolvedNameSize * 0.94, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: primary, margin: `0 0 ${2 * scale}px` }}>{name}</h2>
            <p style={{ fontSize: 10 * scale, color: "#555", margin: `0 0 ${4 * scale}px` }}>{title}</p>
            <p style={{ fontSize: 8.5 * scale, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", margin: 0 }}>{company}</p>
          </div>
          <div style={{ borderTop: `1px solid ${primary}22`, paddingTop: 10 * scale, display: "flex", flexDirection: "column", gap: 3 * scale }}>
            {data.phone   && <p style={{ fontSize: 8.5 * scale, color: "#666", margin: 0 }}>{data.phone}</p>}
            {data.email   && <p style={{ fontSize: 8.5 * scale, color: "#666", margin: 0 }}>{data.email}</p>}
            {data.website && <p style={{ fontSize: 8.5 * scale, color: primary, margin: 0 }}>{data.website}</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── MINIMAL ─────────────────────────────────────────────────
  if (template === "minimal") {
    return (
      <div style={{ ...baseStyle, background: "#fafafa" }}>
        <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: `${20 * scale}px ${28 * scale}px` }}>
          <h2 style={{ fontSize: resolvedNameSize * 1.1, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, letterSpacing: 1, color: "#111", margin: `0 0 ${8 * scale}px` }}>{name}</h2>
          <div style={{ width: 28, height: 2, background: primary, marginBottom: 8 * scale }} />
          <p style={{ fontSize: 9.5 * scale, color: "#666", margin: `0 0 ${12 * scale}px` }}>{title} · {company}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 * scale }}>
            {data.email && <p style={{ fontSize: 8.5 * scale, color: "#888", margin: 0 }}>{data.email}</p>}
            {data.phone && <p style={{ fontSize: 8.5 * scale, color: "#888", margin: 0 }}>{data.phone}</p>}
            {data.website && <p style={{ fontSize: 8.5 * scale, color: primary, margin: 0 }}>{data.website}</p>}
          </div>
        </div>
      </div>
    );
  }

  // ── BOLD ────────────────────────────────────────────────────
  if (template === "bold") {
    return (
      <div style={{ ...baseStyle, background: "#0a0a0a" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${primary}, ${accent})` }} />
        <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: `${22 * scale}px ${24 * scale}px ${18 * scale}px` }}>
          <div>
            <h2 style={{ fontSize: resolvedNameSize * 1.1, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, textTransform: "uppercase", letterSpacing: 1, color: primary, margin: `0 0 ${3 * scale}px` }}>{name}</h2>
            <p style={{ fontSize: 9 * scale, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#aaa", margin: 0 }}>{title}</p>
          </div>
          <div>
            <p style={{ fontSize: 8 * scale, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#555", margin: `0 0 ${6 * scale}px` }}>{company}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2.5 * scale }}>
              {data.phone && <p style={{ fontSize: 8.5 * scale, color: "#ccc", margin: 0 }}>{data.phone}</p>}
              {data.email && <p style={{ fontSize: 8.5 * scale, color: "#ccc", margin: 0 }}>{data.email}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CREATIVE ────────────────────────────────────────────────
  if (template === "creative") {
    return (
      <div style={{ ...baseStyle, background: "#fff" }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: "50%", background: `${primary}18` }} />
        <div style={{ position: "absolute", right: 10, bottom: -20, width: 80, height: 80, borderRadius: "50%", background: `${primary}12` }} />
        <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", padding: `${16 * scale}px ${24 * scale}px` }}>
          <div style={{ flex: 1 }}>
            <div style={{ width: 36 * scale, height: 36 * scale, borderRadius: "50%", background: primary, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 * scale }}>
              <span style={{ fontSize: 15 * scale, fontWeight: 800, color: secondary }}>{initial}</span>
            </div>
            <h2 style={{ fontSize: resolvedNameSize * 0.83, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: "#111", margin: `0 0 ${2 * scale}px` }}>{name}</h2>
            <p style={{ fontSize: 9 * scale, color: primary, fontWeight: 600, margin: `0 0 ${2 * scale}px` }}>{title}</p>
            <p style={{ fontSize: 8.5 * scale, color: "#999", margin: `0 0 ${10 * scale}px` }}>{company}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2.5 * scale }}>
              {data.email && <p style={{ fontSize: 8.5 * scale, color: "#666", margin: 0 }}>{data.email}</p>}
              {data.phone && <p style={{ fontSize: 8.5 * scale, color: "#666", margin: 0 }}>{data.phone}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CORPORATE ───────────────────────────────────────────────
  return (
    <div style={{ ...baseStyle, background: primary }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", color: secondary }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: `${14 * scale}px ${24 * scale}px` }}>
          <div>
            <p style={{ fontSize: 8 * scale, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", opacity: 0.55, margin: `0 0 ${4 * scale}px` }}>{company}</p>
            <h2 style={{ fontSize: resolvedNameSize, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, margin: `0 0 ${3 * scale}px` }}>{name}</h2>
            <p style={{ fontSize: 10 * scale, opacity: 0.8, margin: 0 }}>{title}</p>
          </div>
        </div>
        <div style={{
          borderTop: `1px solid ${secondary}30`,
          background: `rgba(0,0,0,0.12)`,
          padding: `${9 * scale}px ${24 * scale}px`,
          display: "flex", gap: 20 * scale, flexWrap: "wrap",
        }}>
          {data.phone   && <span style={{ fontSize: 7.5 * scale, opacity: 0.75 }}>{data.phone}</span>}
          {data.email   && <span style={{ fontSize: 7.5 * scale, opacity: 0.75 }}>{data.email}</span>}
          {data.website && <span style={{ fontSize: 7.5 * scale, opacity: 0.75 }}>{data.website}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Card Canvas with draggable overlays, logo, QR & alignment guides ─────────
function CardCanvas({
  data, template, backTemplate, primary, secondary, accent, backPrimary, backSecondary, backAccent,
  side, cardShape,
  editLayout, fieldPositions, onFieldMove,
  qrEnabled, qrData, qrSize, qrColor, qrBgColor, qrPosition, qrSide,
  logoUrl, logoSize, logoPos, onLogoMove, aiDesignData,
  fontFamily, fontWeight, fontStyle, nameFontSize,
}: {
  data: CardData; template: Template; backTemplate: Template; primary: string; secondary: string; accent: string;
  backPrimary: string; backSecondary: string; backAccent: string;
  side: "front" | "back"; cardShape: CardShape; editLayout: boolean;
  fieldPositions: typeof DEFAULT_FIELD_POSITIONS;
  onFieldMove: (field: keyof typeof DEFAULT_FIELD_POSITIONS, pos: FieldPos) => void;
  qrEnabled: boolean; qrData: string; qrSize: number; qrColor: string; qrBgColor: string; qrPosition: QrPosition;
  qrSide: "front" | "back" | "both";
  logoUrl: string; logoSize: number; logoPos: { x: number; y: number };
  onLogoMove: (pos: { x: number; y: number }) => void;
  aiDesignData: AiDesignData | null;
  fontFamily?: string; fontWeight?: string; fontStyle?: string; nameFontSize?: number | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{
    type: "field" | "logo";
    field?: keyof typeof DEFAULT_FIELD_POSITIONS;
    startX: number; startY: number; initX: number; initY: number;
  } | null>(null);

  const [showHGuide, setShowHGuide] = useState(false);
  const [showVGuide, setShowVGuide] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrError, setQrError] = useState(false);

  const shapeStyle = getShapeStyle(cardShape);

  // Use correct colors and template for current side
  const activePrimary   = side === "back" ? backPrimary   : primary;
  const activeSecondary = side === "back" ? backSecondary : secondary;
  const activeAccent    = side === "back" ? backAccent    : accent;
  const activeTemplate  = side === "back" ? backTemplate  : template;

  const getFieldStyle = (field: keyof typeof DEFAULT_FIELD_POSITIONS): React.CSSProperties => ({
    position: "absolute",
    left: `${fieldPositions[field].x}%`,
    top: `${fieldPositions[field].y}%`,
    cursor: editLayout ? "grab" : "default",
    border: editLayout ? "1.5px dashed rgba(255,255,255,0.6)" : "none",
    borderRadius: 4,
    padding: editLayout ? "2px 6px" : "0",
    background: editLayout ? "rgba(0,0,0,0.25)" : "transparent",
    backdropFilter: editLayout ? "blur(2px)" : "none",
    zIndex: 10,
    userSelect: "none",
    touchAction: "none",
    transition: editLayout ? "none" : "border 0.2s",
  });

  const startDrag = (
    type: "field" | "logo",
    e: React.MouseEvent,
    field?: keyof typeof DEFAULT_FIELD_POSITIONS
  ) => {
    if (!editLayout) return;
    e.preventDefault();
    e.stopPropagation();

    const initX = type === "logo" ? logoPos.x : (field ? fieldPositions[field].x : 0);
    const initY = type === "logo" ? logoPos.y : (field ? fieldPositions[field].y : 0);

    dragging.current = { type, field, startX: e.clientX, startY: e.clientY, initX, initY };

    const onMove = (me: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((me.clientX - dragging.current.startX) / rect.width) * 100;
      const dy = ((me.clientY - dragging.current.startY) / rect.height) * 100;
      let newX = Math.max(0, Math.min(88, dragging.current.initX + dx));
      let newY = Math.max(0, Math.min(88, dragging.current.initY + dy));

      // Snap to center
      const snapX = Math.abs(newX - 50) < SNAP_THRESHOLD ? 50 : newX;
      const snapY = Math.abs(newY - 50) < SNAP_THRESHOLD ? 50 : newY;
      setShowHGuide(Math.abs(newY - 50) < SNAP_THRESHOLD);
      setShowVGuide(Math.abs(newX - 50) < SNAP_THRESHOLD);
      newX = snapX;
      newY = snapY;

      if (dragging.current.type === "logo") {
        onLogoMove({ x: newX, y: newY });
      } else if (dragging.current.field) {
        onFieldMove(dragging.current.field, { x: newX, y: newY });
      }
    };

    const onUp = () => {
      dragging.current = null;
      setShowHGuide(false);
      setShowVGuide(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startTouchDrag = (
    type: "field" | "logo",
    e: React.TouchEvent,
    field?: keyof typeof DEFAULT_FIELD_POSITIONS
  ) => {
    if (!editLayout) return;
    e.preventDefault();

    const touch = e.touches[0];
    const initX = type === "logo" ? logoPos.x : (field ? fieldPositions[field].x : 0);
    const initY = type === "logo" ? logoPos.y : (field ? fieldPositions[field].y : 0);

    dragging.current = { type, field, startX: touch.clientX, startY: touch.clientY, initX, initY };

    const onMove = (te: TouchEvent) => {
      if (!dragging.current || !containerRef.current) return;
      te.preventDefault();
      const t = te.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((t.clientX - dragging.current.startX) / rect.width) * 100;
      const dy = ((t.clientY - dragging.current.startY) / rect.height) * 100;
      let newX = Math.max(0, Math.min(88, dragging.current.initX + dx));
      let newY = Math.max(0, Math.min(88, dragging.current.initY + dy));

      const snapX = Math.abs(newX - 50) < SNAP_THRESHOLD ? 50 : newX;
      const snapY = Math.abs(newY - 50) < SNAP_THRESHOLD ? 50 : newY;
      setShowHGuide(Math.abs(newY - 50) < SNAP_THRESHOLD);
      setShowVGuide(Math.abs(newX - 50) < SNAP_THRESHOLD);
      newX = snapX;
      newY = snapY;

      if (dragging.current.type === "logo") {
        onLogoMove({ x: newX, y: newY });
      } else if (dragging.current.field) {
        onFieldMove(dragging.current.field, { x: newX, y: newY });
      }
    };

    const onEnd = () => {
      dragging.current = null;
      setShowHGuide(false);
      setShowVGuide(false);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };

    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  };

  const qrUrl = qrEnabled && qrData ? buildQrUrl(qrData, qrColor, qrBgColor, qrSize) : "";

  // Reset QR loading state when URL changes
  useEffect(() => {
    setQrLoaded(false);
    setQrError(false);
  }, [qrUrl]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <CardFace
        data={data}
        template={activeTemplate}
        primary={activePrimary}
        secondary={activeSecondary}
        accent={activeAccent}
        side={side}
        scale={1}
        shapeStyle={shapeStyle}
        aiDesignData={aiDesignData}
        cardShape={cardShape}
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        fontStyle={fontStyle}
        nameFontSize={nameFontSize}
      />

      {/* Logo overlay — shows on BOTH front and back */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt="logo"
          onMouseDown={e => startDrag("logo", e)}
          onTouchStart={e => startTouchDrag("logo", e)}
          style={{
            position: "absolute",
            left: `${logoPos.x}%`,
            top: `${logoPos.y}%`,
            width: logoSize,
            height: logoSize,
            objectFit: "contain",
            borderRadius: 6,
            zIndex: 15,
            cursor: editLayout ? "grab" : "default",
            border: editLayout ? "1.5px dashed rgba(255,215,0,0.8)" : "none",
            boxShadow: editLayout ? "0 0 0 2px rgba(255,215,0,0.3)" : "none",
            userSelect: "none",
            touchAction: "none",
          }}
          draggable={false}
        />
      )}

      {/* Draggable field overlays — front side only */}
      {side === "front" && (
        <>
          <div style={getFieldStyle("name")} onMouseDown={e => startDrag("field", e, "name")} onTouchStart={e => startTouchDrag("field", e, "name")}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: editLayout ? "#fff" : "transparent", whiteSpace: "nowrap", letterSpacing: 0.5 }}>
              {editLayout ? "≡ Name" : ""}
            </span>
          </div>
          <div style={getFieldStyle("title")} onMouseDown={e => startDrag("field", e, "title")} onTouchStart={e => startTouchDrag("field", e, "title")}>
            <span style={{ fontSize: "9px", color: editLayout ? "#fff" : "transparent", whiteSpace: "nowrap" }}>
              {editLayout ? "≡ Title" : ""}
            </span>
          </div>
          <div style={getFieldStyle("company")} onMouseDown={e => startDrag("field", e, "company")} onTouchStart={e => startTouchDrag("field", e, "company")}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: editLayout ? "#fff" : "transparent", letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {editLayout ? "≡ Company" : ""}
            </span>
          </div>
        </>
      )}

      {/* QR Code overlay — conditional on qrSide */}
      {qrEnabled && qrUrl && (qrSide === "both" || qrSide === side) && (
        <div
          style={{
            position: "absolute",
            width: qrSize,
            height: qrSize,
            zIndex: 8,
            ...QR_POSITION_STYLE[qrPosition],
          }}
        >
          {!qrLoaded && !qrError && (
            <div style={{
              width: qrSize, height: qrSize,
              background: "rgba(255,255,255,0.85)",
              border: "1px dashed #ccc",
              borderRadius: 4,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, color: "#999", textAlign: "center",
            }}>
              QR<br/>Loading…
            </div>
          )}
          {qrError && (
            <div style={{
              width: qrSize, height: qrSize,
              background: "rgba(255,255,255,0.85)",
              border: "1px dashed #f00",
              borderRadius: 4,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, color: "#f00", textAlign: "center",
            }}>
              QR<br/>Error
            </div>
          )}
          <img
            src={qrUrl}
            alt="QR Code"
            onLoad={() => setQrLoaded(true)}
            onError={() => setQrError(true)}
            style={{
              width: qrSize, height: qrSize,
              borderRadius: 4,
              display: qrLoaded ? "block" : "none",
            }}
          />
        </div>
      )}

      {/* Alignment guides */}
      {editLayout && showHGuide && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "50%",
          height: 1, background: "rgba(200,167,102,0.8)",
          borderTop: "1px dashed rgba(200,167,102,0.8)",
          zIndex: 20, pointerEvents: "none",
        }}>
          <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%) translateY(-50%)", background: "#C8A766", color: "#fff", fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, letterSpacing: 1 }}>CENTER</span>
        </div>
      )}
      {editLayout && showVGuide && (
        <div style={{
          position: "absolute", top: 0, bottom: 0, left: "50%",
          width: 1, background: "rgba(200,167,102,0.8)",
          borderLeft: "1px dashed rgba(200,167,102,0.8)",
          zIndex: 20, pointerEvents: "none",
        }}>
          <span style={{ position: "absolute", top: "50%", transform: "translateY(-50%) translateX(-50%)", background: "#C8A766", color: "#fff", fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2, letterSpacing: 1, whiteSpace: "nowrap" }}>CENTER</span>
        </div>
      )}
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
async function exportCardAsPDF(
  data: CardData,
  template: Template,
  frontPrimary: string,
  frontSecondary: string,
  frontAccent: string,
  backPrimary: string,
  backSecondary: string,
  qrEnabled: boolean,
  qrData: string,
  qrColor: string,
  qrBgColor: string,
  qrSize: number,
  qrPosition: QrPosition,
) {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

  const W = 252, H = 144;
  const pdfDoc = await PDFDocument.create();
  const frontPage = pdfDoc.addPage([W, H]);
  const backPage  = pdfDoc.addPage([W, H]);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica     = await pdfDoc.embedFont(StandardFonts.Helvetica);

  function hex(h: string) {
    const c = h.replace("#", "");
    return rgb(parseInt(c.slice(0,2),16)/255, parseInt(c.slice(2,4),16)/255, parseInt(c.slice(4,6),16)/255);
  }

  const pc    = hex(frontPrimary);
  const white = rgb(1, 1, 1);
  const black = rgb(0, 0, 0);
  const gray  = rgb(0.45, 0.45, 0.45);
  const lgray = rgb(0.65, 0.65, 0.65);
  const name    = data.name    || "Your Name";
  const title   = data.title   || "Job Title";
  const company = data.company || "Company Name";
  const fp = frontPage;

  if (template === "modern" || template === "ai-design") {
    fp.drawRectangle({ x: 0, y: 0, width: W, height: H, color: pc });
    fp.drawText(company.toUpperCase(), { x: 16, y: H - 28, size: 6.5, font: helveticaBold, color: white, opacity: 0.6 });
    fp.drawText(name,    { x: 16, y: H - 50, size: 14, font: helveticaBold, color: white });
    fp.drawText(title,   { x: 16, y: H - 65, size: 8,  font: helvetica,     color: white, opacity: 0.8 });
    let cy = 26;
    if (data.phone)   { fp.drawText(data.phone,   { x: 16, y: cy, size: 7, font: helvetica, color: white, opacity: 0.75 }); cy += 12; }
    if (data.email)   { fp.drawText(data.email,   { x: 16, y: cy, size: 7, font: helvetica, color: white, opacity: 0.75 }); cy += 12; }
    if (data.website) { fp.drawText(data.website, { x: 16, y: cy, size: 7, font: helvetica, color: white, opacity: 0.75 }); }
  } else if (template === "classic") {
    fp.drawRectangle({ x: 0, y: 0, width: W, height: H, color: white });
    fp.drawRectangle({ x: 0, y: 0, width: 5, height: H, color: pc });
    fp.drawText(name,   { x: 20, y: H - 36, size: 13, font: helveticaBold, color: pc });
    fp.drawText(title,  { x: 20, y: H - 50, size: 8,  font: helvetica,     color: gray });
    fp.drawText(company.toUpperCase(), { x: 20, y: H - 63, size: 6.5, font: helveticaBold, color: lgray });
    fp.drawLine({ start: { x: 20, y: 52 }, end: { x: W - 16, y: 52 }, thickness: 0.6, color: pc, opacity: 0.2 });
    let cy2 = 40;
    if (data.phone)   { fp.drawText(data.phone,   { x: 20, y: cy2, size: 7, font: helvetica, color: gray }); cy2 -= 11; }
    if (data.email)   { fp.drawText(data.email,   { x: 20, y: cy2, size: 7, font: helvetica, color: gray }); cy2 -= 11; }
    if (data.website) { fp.drawText(data.website, { x: 20, y: cy2, size: 7, font: helvetica, color: pc  }); }
  } else if (template === "minimal") {
    fp.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.98, 0.98, 0.98) });
    fp.drawText(name,   { x: 24, y: H - 44, size: 15, font: helvetica, color: black });
    fp.drawLine({ start: { x: 24, y: H - 52 }, end: { x: 52, y: H - 52 }, thickness: 2, color: pc });
    fp.drawText(`${title} · ${company}`, { x: 24, y: H - 65, size: 7.5, font: helvetica, color: gray });
    let cy3 = 38;
    if (data.email)   { fp.drawText(data.email,   { x: 24, y: cy3, size: 7, font: helvetica, color: lgray }); cy3 -= 11; }
    if (data.phone)   { fp.drawText(data.phone,   { x: 24, y: cy3, size: 7, font: helvetica, color: lgray }); cy3 -= 11; }
    if (data.website) { fp.drawText(data.website, { x: 24, y: cy3, size: 7, font: helvetica, color: pc   }); }
  } else if (template === "bold") {
    fp.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.04, 0.04, 0.04) });
    fp.drawRectangle({ x: 0, y: H - 3, width: W, height: 3, color: pc });
    fp.drawText(name.toUpperCase(),  { x: 16, y: H - 38, size: 14, font: helveticaBold, color: pc });
    fp.drawText(title.toUpperCase(), { x: 16, y: H - 52, size: 7,  font: helveticaBold, color: lgray });
    fp.drawText(company.toUpperCase(), { x: 16, y: 38, size: 6, font: helveticaBold, color: rgb(0.35, 0.35, 0.35) });
    let cy4 = 26;
    if (data.phone) { fp.drawText(data.phone, { x: 16, y: cy4, size: 7, font: helvetica, color: rgb(0.75, 0.75, 0.75) }); cy4 -= 11; }
    if (data.email) { fp.drawText(data.email, { x: 16, y: cy4, size: 7, font: helvetica, color: rgb(0.75, 0.75, 0.75) }); }
  } else if (template === "creative") {
    fp.drawRectangle({ x: 0, y: 0, width: W, height: H, color: white });
    fp.drawEllipse({ x: W - 20, y: H - 20, xScale: 70, yScale: 70, color: pc, opacity: 0.08 });
    fp.drawText(name,    { x: 20, y: H - 46, size: 13, font: helveticaBold, color: black });
    fp.drawText(title,   { x: 20, y: H - 59, size: 8,  font: helvetica,     color: pc  });
    fp.drawText(company, { x: 20, y: H - 71, size: 7,  font: helvetica,     color: lgray });
    let cy5 = 34;
    if (data.email) { fp.drawText(data.email, { x: 20, y: cy5, size: 7, font: helvetica, color: gray }); cy5 -= 11; }
    if (data.phone) { fp.drawText(data.phone, { x: 20, y: cy5, size: 7, font: helvetica, color: gray }); }
  } else {
    fp.drawRectangle({ x: 0, y: 0, width: W, height: H, color: pc });
    fp.drawRectangle({ x: 0, y: 0, width: W, height: 30, color: rgb(0, 0, 0), opacity: 0.18 });
    fp.drawText(company.toUpperCase(), { x: 18, y: H - 30, size: 6, font: helveticaBold, color: white, opacity: 0.5 });
    fp.drawText(name,  { x: 18, y: H - 56, size: 14, font: helveticaBold, color: white });
    fp.drawText(title, { x: 18, y: H - 70, size: 8.5, font: helvetica, color: white, opacity: 0.8 });
    fp.drawLine({ start: { x: 0, y: 32 }, end: { x: W, y: 32 }, thickness: 0.5, color: white, opacity: 0.25 });
    const items = [data.phone, data.email, data.website].filter(Boolean);
    let cx = 18;
    items.forEach(item => {
      if (!item) return;
      fp.drawText(item, { x: cx, y: 13, size: 7, font: helvetica, color: white, opacity: 0.7 });
      cx += helvetica.widthOfTextAtSize(item, 7) + 16;
    });
  }

  // Embed QR
  if (qrEnabled && qrData) {
    try {
      const qrImgUrl = buildQrUrl(qrData, qrColor, qrBgColor, qrSize);
      const resp = await fetch(qrImgUrl);
      const arrBuf = await resp.arrayBuffer();
      const qrImg = await pdfDoc.embedPng(arrBuf);
      const qrPt = (qrSize / 96) * 72;
      const positions: Record<QrPosition, { x: number; y: number }> = {
        "bottom-right": { x: W - qrPt - 8, y: 8 },
        "bottom-left":  { x: 8,             y: 8 },
        "top-right":    { x: W - qrPt - 8, y: H - qrPt - 8 },
        "top-left":     { x: 8,             y: H - qrPt - 8 },
        "center":       { x: W / 2 - qrPt / 2, y: H / 2 - qrPt / 2 },
      };
      const pos = positions[qrPosition];
      fp.drawImage(qrImg, { x: pos.x, y: pos.y, width: qrPt, height: qrPt });
    } catch (err) {
      console.warn("QR embed failed:", err);
    }
  }

  // Back page
  const bpc = hex(backPrimary);
  const bsc = hex(backSecondary);
  backPage.drawRectangle({ x: 0, y: 0, width: W, height: H, color: bpc });
  if (data.company) {
    const bkText = data.company.toUpperCase();
    backPage.drawText(bkText, {
      x: W / 2 - helveticaBold.widthOfTextAtSize(bkText, 20) / 2,
      y: H / 2 - 8,
      size: 20, font: helveticaBold, color: bsc, opacity: 0.12,
    });
  }
  if (data.website) {
    backPage.drawText(data.website, {
      x: W - 16 - helvetica.widthOfTextAtSize(data.website, 7),
      y: 12,
      size: 7, font: helvetica, color: bsc, opacity: 0.35,
    });
  }

  // Embed QR on back page (reuse already-fetched qrImg from front page block)
  if (qrEnabled && qrData) {
    try {
      const qrImgUrl = buildQrUrl(qrData, qrColor, qrBgColor, qrSize);
      const resp = await fetch(qrImgUrl);
      const arrBuf = await resp.arrayBuffer();
      const qrImg = await pdfDoc.embedPng(arrBuf);
      const qrPt = (qrSize / 96) * 72;
      const positions: Record<QrPosition, { x: number; y: number }> = {
        "bottom-right": { x: W - qrPt - 8, y: 8 },
        "bottom-left":  { x: 8,             y: 8 },
        "top-right":    { x: W - qrPt - 8, y: H - qrPt - 8 },
        "top-left":     { x: 8,             y: H - qrPt - 8 },
        "center":       { x: W / 2 - qrPt / 2, y: H / 2 - qrPt / 2 },
      };
      const pos = positions[qrPosition];
      backPage.drawImage(qrImg, { x: pos.x, y: pos.y, width: qrPt, height: qrPt });
    } catch (err) {
      console.warn("QR back page embed failed:", err);
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `business-card-${(data.name || "card").toLowerCase().replace(/\s+/g, "-")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────
function PhoneMockup({ children }: { children: React.ReactNode }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="relative mx-auto" style={{ width: 240 }}>
      {/* Volume buttons */}
      <div style={{ position: "absolute", left: -10, top: 72, width: 4, height: 28, background: "#2a2a2a", borderRadius: "2px 0 0 2px" }} />
      <div style={{ position: "absolute", left: -10, top: 110, width: 4, height: 28, background: "#2a2a2a", borderRadius: "2px 0 0 2px" }} />
      {/* Power button */}
      <div style={{ position: "absolute", right: -10, top: 96, width: 4, height: 40, background: "#2a2a2a", borderRadius: "0 2px 2px 0" }} />
      {/* Phone shell */}
      <div style={{
        border: "10px solid #1a1a1a",
        borderRadius: 36,
        boxShadow: "0 0 0 2px #333, 0 30px 80px rgba(0,0,0,0.5)",
        background: "#1a1a1a",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Status bar */}
        <div style={{
          background: "#000",
          padding: "8px 16px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ color: "#fff", fontSize: 10, fontWeight: 600, fontFamily: "system-ui, sans-serif" }}>{timeStr}</span>
          {/* Dynamic island pill */}
          <div style={{ width: 72, height: 20, background: "#000", border: "1.5px solid #2a2a2a", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #333" }} />
          </div>
          {/* Signal/battery icons */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
              {[4, 6, 8, 10].map((h, i) => (
                <div key={i} style={{ width: 3, height: h, background: i < 3 ? "#fff" : "#555", borderRadius: 1 }} />
              ))}
            </div>
            <div style={{ width: 20, height: 10, border: "1.5px solid #fff", borderRadius: 2, position: "relative", marginLeft: 2 }}>
              <div style={{ position: "absolute", right: -3, top: "50%", transform: "translateY(-50%)", width: 2, height: 5, background: "#fff", borderRadius: "0 1px 1px 0" }} />
              <div style={{ width: "70%", height: "100%", background: "#4ade80", borderRadius: 1 }} />
            </div>
          </div>
        </div>
        {/* Screen / card area */}
        <div style={{ background: "#000" }}>
          {children}
        </div>
        {/* Home indicator */}
        <div style={{ background: "#000", padding: "8px 0 10px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 80, height: 4, background: "#fff", borderRadius: 4, opacity: 0.5 }} />
        </div>
      </div>
    </div>
  );
}

// ─── HTML Export ──────────────────────────────────────────────────────────────
function exportDigitalCardAsHtml(
  data: CardData,
  template: Template,
  primary: string,
  secondary: string,
  accent: string,
  fontFamily: string,
  fontWeight: string,
  fontStyle: string,
  nameFontSize: number | null,
  landingPage?: LandingPageData,
): void {
  const name    = data.name    || "Your Name";
  const title   = data.title   || "Job Title";
  const company = data.company || "Company Name";

  // vCard base64
  const vcf = [
    "BEGIN:VCARD", "VERSION:3.0",
    `FN:${name}`, `ORG:${company}`, `TITLE:${title}`,
    data.phone   ? `TEL:${data.phone}`    : "",
    data.email   ? `EMAIL:${data.email}`  : "",
    data.website ? `URL:${data.website}`  : "",
    data.address ? `ADR:;;${data.address};;;;` : "",
    "END:VCARD",
  ].filter(Boolean).join("\n");
  const vcfB64 = btoa(unescape(encodeURIComponent(vcf)));

  const templateStyles: Record<Template, string> = {
    modern:    `background:linear-gradient(135deg,${primary} 0%,${primary}dd 100%);color:${secondary};`,
    classic:   `background:#ffffff;color:#111;border-left:6px solid ${primary};`,
    minimal:   `background:#fafafa;color:#111;`,
    bold:      `background:#0a0a0a;color:${primary};`,
    creative:  `background:#ffffff;color:#111;`,
    corporate: `background:linear-gradient(135deg,${primary} 0%,${primary}cc 100%);color:${secondary};`,
    "ai-design":`background:linear-gradient(135deg,${primary} 0%,${primary}dd 100%);color:${secondary};`,
  };

  const cardStyle = templateStyles[template] || templateStyles.modern;
  const nameColor = template === "bold" ? primary : (template === "classic" || template === "minimal" || template === "creative") ? "#111" : secondary;
  const titleColor = template === "classic" ? "#555" : template === "minimal" ? "#666" : template === "bold" ? "#aaa" : `${secondary}cc`;
  const companyColor = template === "classic" ? "#999" : template === "minimal" ? "#999" : template === "bold" ? "#444" : `${secondary}99`;

  const ctaBg = "#C8A766";
  const ctaText = "#fff";

  // PWA: Extract initials
  const nameParts = name.trim().split(/\s+/);
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : (nameParts[0]?.[0] || "?").toUpperCase();

  // PWA: Build SVG icon as data URI
  const pwaIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="${primary}"/><text x="256" y="300" text-anchor="middle" font-family="${fontFamily}" font-size="200" font-weight="700" fill="#ffffff">${initials}</text></svg>`;
  const pwaIconDataUri = `data:image/svg+xml;base64,${btoa(pwaIconSvg)}`;

  // PWA: Build manifest as data URI
  const pwaManifest = JSON.stringify({
    name: `${name} — Digital Card`,
    short_name: `${initials} Card`,
    start_url: ".",
    display: "standalone",
    background_color: primary,
    theme_color: primary,
    icons: [{ src: pwaIconDataUri, sizes: "any", type: "image/svg+xml" }]
  });
  const pwaManifestDataUri = `data:application/json;base64,${btoa(pwaManifest)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="theme-color" content="${primary}"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<meta name="description" content="Digital business card for ${name} — ${title} at ${company}"/>
<title>${name} — Digital Card</title>
<link rel="apple-touch-icon" href="${pwaIconDataUri}"/>
<link rel="manifest" href="${pwaManifestDataUri}"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:24px 16px 48px;background:linear-gradient(160deg,#0f0f0f 0%,#1a1a1a 60%,#111 100%);font-family:${fontFamily};color:#fff}
.wrapper{width:100%;max-width:400px;display:flex;flex-direction:column;gap:20px}
.card{width:100%;aspect-ratio:9/16;border-radius:24px;padding:32px 24px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 20px 60px rgba(0,0,0,0.5);position:relative;overflow:hidden;${cardStyle}}
.card-top{}
.card-name{font-size:${nameFontSize || 22}px;font-weight:${fontWeight};font-style:${fontStyle};color:${nameColor};line-height:1.2;margin-bottom:6px}
.card-title{font-size:13px;font-weight:500;color:${titleColor};margin-bottom:4px}
.card-company{font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${companyColor}}
.card-bottom{display:flex;flex-direction:column;gap:6px}
.card-contact{font-size:11px;opacity:0.75;color:inherit}
.actions{display:flex;flex-direction:column;gap:10px}
.action-row{display:flex;align-items:center;gap:14px;background:#ffffff0d;border:1px solid #ffffff15;border-radius:14px;padding:14px 18px;text-decoration:none;color:#fff;font-size:14px;font-weight:500;transition:background 0.15s}
.action-row:hover{background:#ffffff1a}
.action-icon{width:36px;height:36px;border-radius:10px;background:${primary}33;border:1px solid ${primary}55;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.save-btn{width:100%;padding:18px;background:${ctaBg};color:${ctaText};font-size:16px;font-weight:700;border:none;border-radius:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 8px 24px ${ctaBg}66;transition:opacity 0.15s}
.save-btn:hover{opacity:0.9}
.footer{text-align:center;font-size:11px;color:#ffffff33;padding-top:8px}
.footer a{color:#ffffff44;text-decoration:none}
.lp-section{margin-top:24px}
.lp-heading{font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff55;margin-bottom:12px}
.lp-bio{font-size:14px;line-height:1.6;color:#ffffffcc;background:#ffffff08;border:1px solid #ffffff12;border-radius:16px;padding:20px}
.social-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.social-chip{display:flex;flex-direction:column;align-items:center;gap:6px;background:#ffffff0d;border:1px solid #ffffff15;border-radius:14px;padding:14px 8px;text-decoration:none;color:#fff;font-size:11px;transition:background 0.15s}
.social-chip:hover{background:#ffffff1a}
.social-chip .s-icon{font-size:22px}
.social-chip .s-label{font-size:10px;opacity:0.6;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
.featured-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch}
.featured-card{min-width:220px;border-radius:16px;overflow:hidden;background:#ffffff0d;border:1px solid #ffffff15;text-decoration:none;color:#fff;flex-shrink:0;transition:transform 0.15s}
.featured-card:hover{transform:scale(1.02)}
.featured-img{width:100%;height:130px;object-fit:cover;background:#ffffff12}
.featured-body{padding:14px}
.featured-body h3{font-size:14px;font-weight:600;margin-bottom:4px}
.featured-body p{font-size:11px;opacity:0.6}
.testimonials-row{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch}
.testimonial-card{min-width:240px;background:#ffffff0d;border:1px solid #ffffff15;border-radius:16px;padding:18px;flex-shrink:0}
.testimonial-card .t-text{font-size:13px;line-height:1.5;color:#ffffffcc;margin-bottom:10px;font-style:italic}
.testimonial-card .t-author{font-size:11px;font-weight:600;color:#ffffffaa}
.testimonial-card .t-role{font-size:10px;color:#ffffff55}
${template==="minimal"?`.card-name{color:#111!important}.card{box-shadow:0 20px 60px rgba(0,0,0,0.3);}`:""}
${template==="bold"?`.card-name{text-transform:uppercase;letter-spacing:0.04em}`:""}
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="card-top">
      <div class="card-name">${name}</div>
      <div class="card-title">${title}</div>
      <div class="card-company">${company}</div>
    </div>
    <div class="card-bottom">
      ${data.phone   ? `<div class="card-contact">📞 ${data.phone}</div>` : ""}
      ${data.email   ? `<div class="card-contact">✉ ${data.email}</div>` : ""}
      ${data.website ? `<div class="card-contact">🌐 ${data.website}</div>` : ""}
      ${data.address ? `<div class="card-contact">📍 ${data.address}</div>` : ""}
    </div>
  </div>

  <div class="actions">
    ${data.phone   ? `<a href="tel:${data.phone}" class="action-row"><span class="action-icon">📞</span><span>${data.phone}</span></a>` : ""}
    ${data.email   ? `<a href="mailto:${data.email}" class="action-row"><span class="action-icon">✉</span><span>${data.email}</span></a>` : ""}
    ${data.website ? `<a href="${data.website.startsWith("http") ? data.website : "https://"+data.website}" target="_blank" rel="noopener" class="action-row"><span class="action-icon">🌐</span><span>${data.website}</span></a>` : ""}
    ${data.address ? `<a href="https://maps.google.com/?q=${encodeURIComponent(data.address)}" target="_blank" rel="noopener" class="action-row"><span class="action-icon">📍</span><span>${data.address}</span></a>` : ""}

    <button class="save-btn" onclick="saveContact()">
      <span>💾</span><span>Save Contact</span>
    </button>
  </div>

  ${landingPage?.heroBio ? `<div class="lp-section"><div class="lp-heading">About</div><div class="lp-bio">${landingPage.heroBio.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>")}</div></div>` : ""}

  ${landingPage?.socialLinks && landingPage.socialLinks.length > 0 ? `<div class="lp-section"><div class="lp-heading">Connect</div><div class="social-grid">${landingPage.socialLinks.map(s => `<a href="${s.url.startsWith("http") ? s.url : "https://"+s.url}" target="_blank" rel="noopener" class="social-chip"><span class="s-icon">${s.icon}</span><span class="s-label">${s.platform}</span></a>`).join("")}</div></div>` : ""}

  ${landingPage?.featuredCards && landingPage.featuredCards.length > 0 ? `<div class="lp-section"><div class="lp-heading">Featured</div><div class="featured-scroll">${landingPage.featuredCards.map(c => {
    const tag = c.link ? "a" : "div";
    const href = c.link ? ` href="${c.link.startsWith("http") ? c.link : "https://"+c.link}" target="_blank" rel="noopener"` : "";
    return `<${tag}${href} class="featured-card">${c.imageUrl ? `<img class="featured-img" src="${c.imageUrl}" alt="${c.title.replace(/"/g,"&quot;")}"/>` : `<div class="featured-img"></div>`}<div class="featured-body"><h3>${c.title}</h3>${c.subtitle ? `<p>${c.subtitle}</p>` : ""}</div></${tag}>`;
  }).join("")}</div></div>` : ""}

  ${landingPage?.testimonials && landingPage.testimonials.length > 0 ? `<div class="lp-section"><div class="lp-heading">What Clients Say</div><div class="testimonials-row">${landingPage.testimonials.map(t => `<div class="testimonial-card"><div class="t-text">"${t.text.replace(/</g,"&lt;").replace(/>/g,"&gt;")}"</div><div class="t-author">${t.name}</div>${t.role ? `<div class="t-role">${t.role}</div>` : ""}</div>`).join("")}</div></div>` : ""}

  <p class="footer">Built with <a href="/" target="_blank">JBJ Business Card Designer</a></p>
</div>
<script>
function saveContact(){
  var b64="${vcfB64}";
  var bin=atob(b64);var bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  var blob=new Blob([bytes],{type:"text/vcard;charset=utf-8"});
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");
  a.href=url;a.download="${(name).replace(/[^a-zA-Z0-9]/g, "-")}.vcf";
  document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(url);document.body.removeChild(a);},1000);
}
if('serviceWorker' in navigator){var sw='self.addEventListener("fetch",function(e){e.respondWith(fetch(e.request))})';var blob=new Blob([sw],{type:"application/javascript"});navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(function(){});}
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `${(name).toLowerCase().replace(/\s+/g, "-")}-digital-card.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Color Picker Section ─────────────────────────────────────────────────────
function ColorPickerSection({
  label, colorIdx, customColor, onPresetChange, onCustomChange,
}: {
  label: string; colorIdx: number; customColor: string;
  onPresetChange: (i: number) => void; onCustomChange: (hex: string) => void;
}) {
  const activeColor = customColor || COLOR_PRESETS[colorIdx].primary;
  return (
    <div>
      <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">{label}</Label>
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {COLOR_PRESETS.map((c, i) => (
          <button
            key={i}
            onClick={() => { onPresetChange(i); onCustomChange(""); }}
            title={c.label}
            className={`h-8 rounded-lg flex items-center justify-center text-[8px] font-semibold transition-all border-2 ${
              colorIdx === i && !customColor ? "border-[hsl(var(--foreground))] scale-105 shadow-md" : "border-transparent hover:scale-105"
            }`}
            style={{ background: c.primary, color: c.secondary }}
          >
            {colorIdx === i && !customColor ? <Check size={10} /> : ""}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={activeColor}
          onChange={e => onCustomChange(e.target.value)}
          className="w-9 h-8 rounded-lg border border-[hsl(var(--border))] cursor-pointer p-0.5"
          title="Custom color wheel"
        />
        <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
          {customColor ? `Custom: ${customColor}` : COLOR_PRESETS[colorIdx].label}
        </span>
        {customColor && (
          <button onClick={() => onCustomChange("")} className="text-[9px] underline text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">Reset</button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BusinessCardDesigner() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("template");
  // Per-side independent templates
  const [frontTemplate, setFrontTemplate] = useState<Template>("modern");
  const [backTemplate, setBackTemplate]   = useState<Template>("bold");

  // Per-side colors
  const [frontColorIdx, setFrontColorIdx] = useState(0);
  const [backColorIdx,  setBackColorIdx]  = useState(8); // Pure black for back
  const [frontCustomColor, setFrontCustomColor] = useState("");
  const [backCustomColor,  setBackCustomColor]  = useState("");

  const [side, setSide]         = useState<"front" | "back">("front");
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cardLicenseCode, setCardLicenseCode] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [brandAssetOpen, setBrandAssetOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(true);
  const [logoUrl, setLogoUrl]   = useState("");
  const [logoSize, setLogoSize] = useState(60);
  const [logoPos, setLogoPos]   = useState({ ...DEFAULT_LOGO_POS });

  // Card shape
  const [cardShape, setCardShape] = useState<CardShape>("horizontal");
  const [shapeOpen, setShapeOpen] = useState(true);
  const [nfcGuideOpen, setNfcGuideOpen] = useState(false);

  // Drag-to-rearrange
  const [editLayout, setEditLayout] = useState(false);
  const [fieldPositions, setFieldPositions] = useState({ ...DEFAULT_FIELD_POSITIONS });

  // QR Code
  const [qrOpen, setQrOpen]             = useState(false);
  const [qrEnabled, setQrEnabled]       = useState(false);
  const [qrContentType, setQrContentType] = useState<QrContentType>("url");
  const [qrCustomContent, setQrCustomContent] = useState("");
  const [qrSize, setQrSize]             = useState(80);
  const [qrColor, setQrColor]           = useState("");
  const [qrBgColor, setQrBgColor]       = useState("#ffffff");
  const [qrPosition, setQrPosition]     = useState<QrPosition>("bottom-right");
  const [qrSide, setQrSide]             = useState<"front" | "back" | "both">("both");
  const [qrAiPrompt, setQrAiPrompt]     = useState("");
  const [isAiStylingQr, setIsAiStylingQr] = useState(false);

  // AI Design template
  const [aiDesignOpen, setAiDesignOpen] = useState(false);
  const [aiIndustry, setAiIndustry] = useState("real-estate");
  const [aiTone, setAiTone] = useState("modern");
  const [aiStyle, setAiStyle] = useState("geometric");
  const [aiDesignData, setAiDesignData] = useState<AiDesignData | null>(null);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);

  // Typography
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [cardFontFamily, setCardFontFamily] = useState("'Helvetica Neue', Arial, sans-serif");
  const [cardFontBold, setCardFontBold] = useState(false);
  const [cardFontItalic, setCardFontItalic] = useState(false);
  const [cardFontSize, setCardFontSize] = useState<number | null>(null);
  const [cardTextAlign, setCardTextAlign] = useState<TextAlign>("left");
  const [cardUnderline, setCardUnderline] = useState(false);
  const [cardLetterSpacing, setCardLetterSpacing] = useState(0);
  const [cardLineHeight, setCardLineHeight] = useState(1.2);

  // Gradient colors
  const [useGradient, setUseGradient] = useState(false);
  const [gradientEnd, setGradientEnd] = useState("#C8A766");
  const [gradientDirection, setGradientDirection] = useState<GradientDirection>("135deg");

  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryPrompt, setGalleryPrompt] = useState("");
  const [galleryDesigns, setGalleryDesigns] = useState<(AiDesignData & { id: string; name: string; category?: string })[]>([]);
  const [galleryFavorites, setGalleryFavorites] = useState<string[]>([]);
  const [isGeneratingGallery, setIsGeneratingGallery] = useState(false);
  const [galleryPage, setGalleryPage] = useState(0);
  const GALLERY_PER_PAGE = 12;

  // Trade license auto-fill
  const [tradeLicenseOpen, setTradeLicenseOpen] = useState(false);

  const [data, setData] = useState<CardData>({
    name: "", title: "", company: "", phone: "", email: "", website: "", address: "",
  });

  // Bilingual
  const [bilingualMode, setBilingualMode] = useState<BilingualMode>("off");
  const [bilingualLang, setBilingualLang] = useState<BilingualLanguage>("ar");
  const [bilingualOpen, setBilingualOpen] = useState(false);
  const [secondaryData, setSecondaryData] = useState<CardData>({
    name: "", title: "", company: "", phone: "", email: "", website: "", address: "",
  });
  const bilingualDir = BILINGUAL_LANGUAGES.find(l => l.id === bilingualLang)?.dir || "ltr";

  // Inline editing
  const [inlineEditField, setInlineEditField] = useState<keyof CardData | null>(null);

  // Landing page data (Digital mode)
  const [landingPageData, setLandingPageData] = useState<LandingPageData>({ ...EMPTY_LANDING_PAGE });
  const [digitalTab, setDigitalTab] = useState<"card" | "landing">("card");

  const frontPreset = COLOR_PRESETS[frontColorIdx];
  const backPreset  = COLOR_PRESETS[backColorIdx];
  const frontPrimary   = frontCustomColor || frontPreset.primary;
  const frontSecondary = frontPreset.secondary;
  const frontAccent    = frontPreset.accent;
  const backPrimary    = backCustomColor  || backPreset.primary;
  const backSecondary  = backPreset.secondary;
  const backAccent     = backPreset.accent;

  const effectiveQrColor = qrColor || frontPrimary;

  // Derived: active template for current side (used by preview + template picker)
  const activeTemplate = side === "front" ? frontTemplate : backTemplate;
  const setActiveTemplate = (t: Template) => {
    if (side === "front") setFrontTemplate(t);
    else setBackTemplate(t);
  };

  const set = (k: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData(prev => ({ ...prev, [k]: e.target.value }));

  const handleExtractedCard = (extracted: Record<string, unknown>) => {
    setData(prev => ({
      ...prev,
      name:    extracted.name    ? String(extracted.name)    : prev.name,
      title:   extracted.title   ? String(extracted.title)   : prev.title,
      company: extracted.company ? String(extracted.company) : prev.company,
      phone:   extracted.phone   ? String(extracted.phone)   : prev.phone,
      email:   extracted.email   ? String(extracted.email)   : prev.email,
      website: extracted.website ? String(extracted.website) : prev.website,
      address: extracted.address ? String(extracted.address) : prev.address,
    }));
  };

  const handleFieldMove = (field: keyof typeof DEFAULT_FIELD_POSITIONS, pos: FieldPos) => {
    setFieldPositions(prev => ({ ...prev, [field]: pos }));
  };

  const qrDataStr = buildQrData(qrContentType, data, qrCustomContent);

  // AI QR styling
  const handleAiQrStyle = async () => {
    if (!qrAiPrompt.trim()) return;
    setIsAiStylingQr(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("gemini-chat", {
        body: {
          message: `You are a QR code designer. Based on this description: "${qrAiPrompt}", return ONLY valid JSON with these fields:
{
  "color": "#hexcolor",
  "bgColor": "#hexcolor",
  "size": <number between 50-200>,
  "position": "<one of: bottom-right, bottom-left, top-right, top-left, center>"
}
The current card primary color is ${frontPrimary}. Return only the JSON, no other text.`,
        },
      });
      if (error) throw error;
      const text = result?.reply || result?.message || result?.content || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.color)    setQrColor(parsed.color);
        if (parsed.bgColor)  setQrBgColor(parsed.bgColor);
        if (parsed.size)     setQrSize(Math.min(200, Math.max(50, parsed.size)));
        if (parsed.position) setQrPosition(parsed.position as QrPosition);
        toast.success("AI applied QR styling!");
      } else {
        toast.error("AI response wasn't in the expected format.");
      }
    } catch (err) {
      console.error(err);
      toast.error("AI styling failed. Please try again.");
    } finally {
      setIsAiStylingQr(false);
    }
  };

  // AI Design generation — calls dedicated edge function
  const handleGenerateDesign = async () => {
    setIsGeneratingDesign(true);
    const seed = Math.random().toString(36).slice(2, 8);
    try {
      const { data: result, error } = await supabase.functions.invoke("ai-card-design-generator", {
        body: { tone: aiTone, style: aiStyle, industry: aiIndustry, seed },
      });
      if (error) throw error;
      if (!result?.elements) throw new Error("No elements in response");
      const design: AiDesignData = { ...result, style: aiStyle, industry: aiIndustry };
      setAiDesignData(design);
      setActiveTemplate("ai-design");
      toast.success("AI design generated!");
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("Rate limit")) toast.error("Rate limit exceeded. Please try again in a moment.");
      else if (err?.message?.includes("credits")) toast.error("AI credits required. Please add credits to continue.");
      else toast.error("Design generation failed. Please try again.");
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  // Gallery generation — batch card designs
  const handleGenerateGallery = async () => {
    setIsGeneratingGallery(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("ai-card-gallery-generator", {
        body: { prompt: galleryPrompt, industry: aiIndustry, tone: aiTone, count: GALLERY_PER_PAGE },
      });
      if (error) throw error;
      if (!result?.designs) throw new Error("No designs returned");
      setGalleryDesigns(prev => [...prev, ...result.designs]);
      setGalleryPage(prev => prev + 1);
      toast.success(`${result.designs.length} designs generated!`);
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("Rate limit")) toast.error("Rate limit exceeded. Please wait a moment.");
      else if (err?.message?.includes("credits")) toast.error("AI credits required.");
      else toast.error("Gallery generation failed. Please try again.");
    } finally {
      setIsGeneratingGallery(false);
    }
  };

  const toggleGalleryFavorite = (id: string) => {
    setGalleryFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const applyGalleryDesign = (design: AiDesignData & { id: string; name: string }) => {
    setAiDesignData(design);
    setActiveTemplate("ai-design");
    toast.success(`Applied: ${design.name}`);
  };

  // Trade license extraction handler
  const handleTradeLicenseExtracted = (extracted: Record<string, unknown>) => {
    setData(prev => ({
      ...prev,
      name:    extracted.owner_name ? String(extracted.owner_name) : (extracted.name ? String(extracted.name) : prev.name),
      company: extracted.company_name ? String(extracted.company_name) : (extracted.company ? String(extracted.company) : prev.company),
      phone:   extracted.phone   ? String(extracted.phone)   : prev.phone,
      email:   extracted.email   ? String(extracted.email)   : prev.email,
      website: extracted.website ? String(extracted.website) : prev.website,
      address: extracted.address ? String(extracted.address) : prev.address,
      title:   extracted.position ? String(extracted.position) : (extracted.title ? String(extracted.title) : prev.title),
    }));
    toast.success("Trade license data extracted & applied!");
  };

  // Save Card
  const handleSaveCard = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in to save."); setIsSaving(false); return; }

      const companyName = data.company?.trim() || "";

      // ── Brand protection: check if name is available ──────────
      if (companyName) {
        const { data: available, error: rpcErr } = await supabase.rpc("check_name_available", {
          _company_name: companyName,
          _asset_type: "business_card",
          _requesting_user: user.id,
        });
        if (rpcErr) {
          if (rpcErr.message?.toLowerCase().includes("protected")) {
          toast.error("This company name is exclusively protected and cannot be used.");
            setIsSaving(false); return;
          }
          // non-fatal RPC errors — allow save to proceed
        } else if (available === false) {
          toast.error("This company name is already licensed by another user.");
          setIsSaving(false); return;
        }
      }

      const cardState = {
        data, frontTemplate, backTemplate, frontColorIdx, backColorIdx, frontCustomColor, backCustomColor,
        cardShape, qrEnabled, qrContentType, qrCustomContent, qrSize, qrColor, qrBgColor, qrPosition,
        logoUrl, logoSize, logoPos, aiDesignData,
      };

      // ── Save to design_assets ──────────────────────────────────
      const { data: asset, error: assetErr } = await supabase.from("design_assets").insert({
        user_id: user.id, asset_type: "business_card", file_url: "",
        name: `Business Card — ${data.name || "Untitled"} — ${new Date().toLocaleDateString()}`,
        metadata: cardState as any,
      }).select("id").single();

      if (assetErr) throw assetErr;

      // ── Register design license ────────────────────────────────
      if (companyName && asset?.id) {
        const { data: lic, error: licErr } = await supabase.from("design_licenses").insert({
          user_id: user.id,
          asset_id: asset.id,
          asset_type: "business_card",
          company_name: companyName,
        }).select("license_code").single();

        if (licErr) {
          if (licErr.message?.toLowerCase().includes("protected")) {
          toast.error("This company name is exclusively protected and cannot be used.");
            setIsSaving(false); return;
          }
          // license insert failure is non-fatal — card is already saved
          console.warn("License insert warning:", licErr.message);
        } else if (lic?.license_code) {
          setCardLicenseCode(lic.license_code);
        }
      }

      toast.success("Card saved to Brand Assets!");
    } catch (err: any) {
      console.error(err);
      if (err?.message?.toLowerCase().includes("protected")) {
        toast.error("This company name is exclusively protected and cannot be used.");
      } else {
        toast.error("Save failed. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportCardAsPDF(
        data, frontTemplate, frontPrimary, frontSecondary, frontAccent,
        backPrimary, backSecondary,
        qrEnabled, qrDataStr, effectiveQrColor, qrBgColor, qrSize, qrPosition,
      );
      toast.success("Business card PDF exported!");
    } catch (err) {
      console.error(err);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHtml = () => {
    setIsExportingHtml(true);
    try {
      exportDigitalCardAsHtml(
        data, frontTemplate, frontPrimary, frontSecondary, frontAccent,
        cardFontFamily,
        cardFontBold ? "bold" : "800",
        cardFontItalic ? "italic" : "normal",
        cardFontSize,
        landingPageData,
      );
      toast.success("Digital card HTML exported!");
    } catch (err) {
      console.error(err);
      toast.error("HTML export failed. Please try again.");
    } finally {
      setIsExportingHtml(false);
    }
  };

  const handleShareCard = async () => {
    setIsSharing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in to share your card."); return; }

      const cardSnapshot = {
        data,
        frontTemplate,
        frontColorIdx,
        frontCustomColor,
        cardShape,
        logoUrl,
        logoSize,
        aiDesignData,
        fontFamily: cardFontFamily,
        fontWeight: cardFontBold ? "bold" : "800",
        fontStyle: cardFontItalic ? "italic" : "normal",
        nameFontSize: cardFontSize,
        frontPrimary,
        frontSecondary,
        frontAccent,
      };

      const { data: inserted, error } = await supabase
        .from("shared_business_cards")
        .insert({ user_id: user.id, card_data: cardSnapshot as any })
        .select("token")
        .single();

      if (error) throw error;
      setShareToken(inserted.token);
      setShareModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate share link. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const fields: { key: keyof CardData; label: string; placeholder: string; icon: React.ReactNode; voiceKey?: boolean }[] = [
    { key: "name",    label: "Full Name",   placeholder: "Ahmed Al-Mansoori",            icon: <User size={12} />, voiceKey: true },
    { key: "title",   label: "Job Title",   placeholder: "Senior Real Estate Consultant",icon: <Building2 size={12} />, voiceKey: true },
    { key: "company", label: "Company",     placeholder: "Acme Corporation",             icon: <Building2 size={12} />, voiceKey: true },
    { key: "phone",   label: "Phone",       placeholder: "+971 50 123 4567",             icon: <Phone size={12} />, voiceKey: true },
    { key: "email",   label: "Email",       placeholder: "ahmed@company.ae",             icon: <Mail size={12} />, voiceKey: true },
    { key: "website", label: "Website",     placeholder: "www.company.ae",               icon: <Globe size={12} />, voiceKey: true },
    { key: "address", label: "Address",     placeholder: "Dubai, UAE",                   icon: <MapPin size={12} />, voiceKey: true },
  ];

  return (
    <>
    <div className="min-h-screen" style={{ background: "hsl(var(--pearl-1,48 30% 97%))" }}>
      {/* ── Sticky Header ──────────────────────────────────────── */}
      <div className="sticky top-0 lg:top-[48px] z-20 border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
                <CreditCard size={13} className="text-[hsl(var(--primary-foreground))]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[hsl(var(--foreground))] leading-none">Business Card Designer</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Shapes · QR · Drag · AI</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setEditLayout(v => !v)}
              className={`gap-1.5 h-8 text-xs ${editLayout ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold-dark))]" : ""}`}
            >
              {editLayout ? <Lock size={12} /> : <Unlock size={12} />}
              {editLayout ? "Lock Layout" : "Edit Layout"}
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => {
                setFieldPositions({ ...DEFAULT_FIELD_POSITIONS });
                setLogoPos({ ...DEFAULT_LOGO_POS });
                if (!editLayout) setEditLayout(true);
                toast.success("Layout reset to defaults");
              }}
              className="h-8 text-xs gap-1.5 border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              title="Reset field & logo positions to defaults"
            >
              <RotateCcw size={12} /> Reset
            </Button>

            <div className="flex flex-col items-end gap-1">
              <Button
                onClick={handleSaveCard}
                disabled={isSaving}
                variant="outline"
                className="gap-1.5 h-8 text-xs font-semibold border-[#C9A84C]/60 text-[#C9A84C] hover:bg-[#C9A84C]/10"
              >
                {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                {isSaving ? "Saving…" : "Save Card"}
              </Button>
              {cardLicenseCode && (
                <span className="text-[9px] font-mono font-bold text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                  {cardLicenseCode}
                </span>
              )}
            </div>

            <Button
              onClick={handleShareCard}
              disabled={isSharing}
              variant="outline"
              className="gap-1.5 h-8 text-xs font-semibold border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
            >
              {isSharing ? <RefreshCw size={12} className="animate-spin" /> : <Share2 size={12} />}
              {isSharing ? "Generating…" : "Share"}
            </Button>

            {cardShape === "digital" && (
              <Button
                onClick={handleExportHtml}
                disabled={isExportingHtml}
                variant="outline"
                className="gap-1.5 h-8 text-xs font-semibold border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.06)]"
              >
                {isExportingHtml ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
                {isExportingHtml ? "Exporting…" : "Export HTML"}
              </Button>
            )}

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="gap-2 h-8 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))" }}
            >
              {isExporting ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
              {isExporting ? "Exporting…" : "Export PDF"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Share Modal ─────────────────────────────────────────── */}
      {shareToken && (
        <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 size={16} className="text-[hsl(var(--gold))]" />
                Share Your Card
              </DialogTitle>
              <DialogDescription>
                Anyone with this link can view your card and save your contact
              </DialogDescription>
            </DialogHeader>

            {(() => {
              const shareUrl = `${window.location.origin}/card/${shareToken}`;
              const qrUrl = buildQrUrl(shareUrl, frontPrimary, "#ffffff", 160);
              return (
                <div className="space-y-4">
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="p-3 bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm">
                      <img src={qrUrl} alt="Share QR Code" className="w-40 h-40 rounded-lg" />
                    </div>
                  </div>

                  {/* URL input + copy */}
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 h-9 px-3 text-xs rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] select-all focus:outline-none"
                      onClick={e => (e.target as HTMLInputElement).select()}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        toast.success("Link copied!");
                      }}
                    >
                      <Copy size={12} /> Copy
                    </Button>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 text-xs border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                      onClick={() => {
                        const msg = encodeURIComponent(`Here's my digital business card: ${shareUrl}`);
                        window.open(`https://wa.me/?text=${msg}`, "_blank");
                      }}
                    >
                      💬 WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 text-xs"
                      onClick={() => window.open(shareUrl, "_blank")}
                    >
                      <ExternalLink size={12} /> Preview
                    </Button>
                  </div>

                  <p className="text-[10px] text-center text-[hsl(var(--muted-foreground))]">
                    Scan QR or share the link — recipients can tap "Save Contact" to add you instantly
                  </p>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* ── Main Content ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-5">

        {/* ── Left panel ──────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Card Shape */}
          <Collapsible open={shapeOpen} onOpenChange={setShapeOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <RectangleHorizontal size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Card Shape</span>
                    <span className="text-[9px] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-semibold">
                      {CARD_SHAPES.find(s => s.id === cardShape)?.label}
                    </span>
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${shapeOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))]">
                  <div className="grid grid-cols-4 gap-2 pt-3">
                    {CARD_SHAPES.map(s => (
                      <div key={s.id} className="relative">
                        <button
                          onClick={() => setCardShape(s.id)}
                          className={`w-full flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all ${
                            cardShape === s.id
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]"
                              : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                        >
                          <span className={cardShape === s.id ? "text-[hsl(var(--gold))]" : "text-[hsl(var(--muted-foreground))]"}>{s.icon}</span>
                          <span className={`text-[9px] font-semibold leading-none ${cardShape === s.id ? "text-[hsl(var(--gold-dark))]" : "text-[hsl(var(--muted-foreground))]"}`}>{s.label}</span>
                        </button>
                        {s.id === "digital" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setNfcGuideOpen(true); }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[hsl(var(--gold))] text-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                            title="NFC Programming Guide"
                          >
                            <HelpCircle size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Template picker — applies to active side */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-1 block flex items-center gap-1.5">
              <Layers size={11} /> Template
              <span className="ml-auto text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold-dark))]">
                Editing: {side === "front" ? "Front" : "Back"}
              </span>
            </Label>
            <p className="text-[9px] text-[hsl(var(--muted-foreground))] mb-3">Click Front/Back toggle above to switch sides independently.</p>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTemplate(t.id)}
                  className={`relative py-2.5 px-3 rounded-xl text-left border transition-all duration-200 ${
                    activeTemplate === t.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] hover:bg-[hsl(var(--muted))]"
                  }`}
                >
                  {activeTemplate === t.id && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
                      <Check size={8} className="text-white" />
                    </span>
                  )}
                  <p className={`text-xs font-semibold leading-none mb-0.5 ${activeTemplate === t.id ? "text-[hsl(var(--gold-dark))]" : "text-[hsl(var(--foreground))]"}`}>
                    {t.label}
                  </p>
                  <p className="text-[9px] text-[hsl(var(--muted-foreground))]">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Scan Existing Card — AI pre-fill */}
          <DocumentExtractorUpload
            extractionType="business_card"
            onExtracted={handleExtractedCard}
            label="Scan Existing Card"
            hint="Upload a photo or PDF of a business card to pre-fill all fields instantly."
          />

          {/* Trade License Auto-Fill */}
          <Collapsible open={tradeLicenseOpen} onOpenChange={setTradeLicenseOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <Building2 size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Trade License</span>
                    <span className="text-[8px] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-semibold">Auto-Fill</span>
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${tradeLicenseOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))]">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] py-2">
                    Upload your trade license to auto-fill company name, address, and contact details.
                  </p>
                  <DocumentExtractorUpload
                    extractionType="company_profile"
                    onExtracted={handleTradeLicenseExtracted}
                    label="Upload Trade License"
                    hint="PDF or photo of your trade license — extracts company info automatically."
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Bilingual Card */}
          <Collapsible open={bilingualOpen} onOpenChange={setBilingualOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <Globe size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Bilingual</span>
                    {bilingualMode !== "off" && (
                      <span className="text-[8px] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-semibold">
                        {BILINGUAL_LANGUAGES.find(l => l.id === bilingualLang)?.label?.split(" ")[0]}
                      </span>
                    )}
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${bilingualOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-3 pt-3">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                    Add a second language to your card. Choose between showing both languages on one card or separate front/back sides.
                  </p>

                  {/* Mode selector */}
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Mode</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([
                        { id: "off" as BilingualMode, label: "Off" },
                        { id: "dual-side" as BilingualMode, label: "Front/Back" },
                        { id: "single-card" as BilingualMode, label: "Both Sides" },
                      ]).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setBilingualMode(opt.id)}
                          className={`text-[10px] py-2 px-1 rounded-lg border font-semibold transition-all ${
                            bilingualMode === opt.id
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-1">
                      {bilingualMode === "dual-side" ? "English on front, second language on back" : bilingualMode === "single-card" ? "Both languages shown together on each side" : "Single-language card"}
                    </p>
                  </div>

                  {bilingualMode !== "off" && (
                    <>
                      {/* Language picker */}
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Second Language</Label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {BILINGUAL_LANGUAGES.map(lang => (
                            <button
                              key={lang.id}
                              onClick={() => setBilingualLang(lang.id)}
                              className={`text-[10px] py-1.5 px-1 rounded-lg border font-semibold transition-all truncate ${
                                bilingualLang === lang.id
                                  ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                                  : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                              }`}
                            >
                              {lang.label.split(" ")[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Secondary language fields */}
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] block">
                          {BILINGUAL_LANGUAGES.find(l => l.id === bilingualLang)?.label?.split("(")[1]?.replace(")", "") || "Secondary"} Text
                        </Label>
                        {(["name", "title", "company"] as (keyof CardData)[]).map(key => (
                          <div key={key}>
                            <Label className="text-[9px] text-[hsl(var(--muted-foreground))] mb-0.5 block capitalize">{key}</Label>
                            <div className="flex gap-1.5">
                              <Input
                                value={secondaryData[key]}
                                onChange={e => setSecondaryData(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={`${key} in ${BILINGUAL_LANGUAGES.find(l => l.id === bilingualLang)?.label?.split("(")[1]?.replace(")", "") || "other language"}...`}
                                className="h-8 text-xs flex-1"
                                dir={bilingualDir}
                              />
                              <VoiceInputButton
                                onTranscript={t => setSecondaryData(prev => ({ ...prev, [key]: t }))}
                                size="sm"
                              />
                            </div>
                          </div>
                        ))}
                        <p className="text-[9px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded-lg px-2 py-1.5">
                          💡 Use voice input to speak in {BILINGUAL_LANGUAGES.find(l => l.id === bilingualLang)?.label?.split("(")[1]?.replace(")", "") || "the second language"} — it auto-transcribes.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          <Collapsible open={galleryOpen} onOpenChange={setGalleryOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <LayoutGrid size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Smart Gallery</span>
                    <span className="text-[8px] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                    {galleryFavorites.length > 0 && (
                      <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                        {galleryFavorites.length}/5 ★
                      </span>
                    )}
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${galleryOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-3 pt-3">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                    Describe your ideal business card or company style. AI generates multiple designs — favorite up to 5, then apply or merge.
                  </p>

                  {/* Prompt input */}
                  <div className="flex gap-1.5">
                    <Input
                      value={galleryPrompt}
                      onChange={e => setGalleryPrompt(e.target.value)}
                      placeholder="e.g. Luxury gold real estate card with geometric patterns..."
                      className="h-8 text-xs flex-1"
                      onKeyDown={e => e.key === "Enter" && !isGeneratingGallery && handleGenerateGallery()}
                    />
                    <VoiceInputButton onTranscript={t => setGalleryPrompt(prev => prev ? `${prev} ${t}` : t)} size="sm" />
                  </div>

                  <Button
                    onClick={() => { setGalleryDesigns([]); setGalleryPage(0); handleGenerateGallery(); }}
                    disabled={isGeneratingGallery}
                    className="w-full h-9 text-xs gap-2 font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))" }}
                  >
                    {isGeneratingGallery ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {isGeneratingGallery ? "Generating Designs…" : galleryDesigns.length > 0 ? "Regenerate Gallery" : "Generate Gallery"}
                  </Button>

                  {/* Gallery grid */}
                  {galleryDesigns.length > 0 && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {galleryDesigns.map((design) => {
                          const isFav = galleryFavorites.includes(design.id);
                          return (
                            <div key={design.id} className="relative group">
                              <div
                                className={`rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                                  isFav ? "border-amber-400 shadow-md" : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)]"
                                }`}
                                onClick={() => applyGalleryDesign(design)}
                              >
                                {/* Mini card preview */}
                                <CardFace
                                  data={data}
                                  template="ai-design"
                                  primary={design.bgColor}
                                  secondary={design.textColor}
                                  accent={design.accentColor || design.colors?.[0] || "#C8A766"}
                                  side="front"
                                  scale={0.35}
                                  shapeStyle={{ aspectRatio: "3.5 / 2", borderRadius: 0 }}
                                  aiDesignData={design}
                                  fontFamily={cardFontFamily}
                                  fontWeight={cardFontBold ? "bold" : undefined}
                                  fontStyle={cardFontItalic ? "italic" : undefined}
                                  nameFontSize={cardFontSize}
                                />
                                <p className="text-[8px] font-semibold text-center py-1 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] truncate px-1">
                                  {design.name}
                                </p>
                              </div>
                              {/* Favorite button */}
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleGalleryFavorite(design.id); }}
                                className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm transition-all ${
                                  isFav ? "bg-amber-400 text-white" : "bg-white/80 text-[hsl(var(--muted-foreground))] hover:bg-amber-100"
                                }`}
                              >
                                <Star size={10} fill={isFav ? "currentColor" : "none"} />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Load more */}
                      <Button
                        onClick={handleGenerateGallery}
                        disabled={isGeneratingGallery}
                        variant="outline"
                        className="w-full h-8 text-[10px] gap-1.5"
                      >
                        {isGeneratingGallery ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Generate More Designs
                      </Button>

                      {/* Favorites summary */}
                      {galleryFavorites.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                          <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1.5">
                            <Star size={10} fill="currentColor" /> {galleryFavorites.length} Favorited
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {galleryFavorites.map(fId => {
                              const d = galleryDesigns.find(g => g.id === fId);
                              return d ? (
                                <button
                                  key={fId}
                                  onClick={() => applyGalleryDesign(d)}
                                  className="text-[8px] bg-white border border-amber-300 rounded-lg px-2 py-1 font-semibold text-amber-700 hover:bg-amber-100 transition-colors truncate max-w-[120px]"
                                >
                                  {d.name}
                                </button>
                              ) : null;
                            })}
                          </div>
                          <Button
                            onClick={() => { setGalleryFavorites([]); toast.success("Favorites cleared"); }}
                            variant="outline"
                            className="w-full h-7 text-[9px] border-amber-300 text-amber-700 hover:bg-amber-100"
                          >
                            Clear Favorites
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {isGeneratingGallery && galleryDesigns.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-[hsl(var(--muted))] rounded-xl">
                      <RefreshCw size={14} className="animate-spin text-[hsl(var(--gold))]" />
                      <div>
                        <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Generating gallery…</p>
                        <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Creating {GALLERY_PER_PAGE} unique card designs</p>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Card info fields */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm space-y-3.5">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] block">
              Card Information
            </Label>
            {fields.map(f => (
              <div key={f.key}>
                <Label className="text-[11px] text-[hsl(var(--muted-foreground))] mb-1 flex items-center gap-1.5">
                  <span className="text-[hsl(var(--muted-foreground))]">{f.icon}</span>
                  {f.label}
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    value={data[f.key]}
                    onChange={set(f.key)}
                    placeholder={f.placeholder}
                    className="h-8 text-xs flex-1"
                  />
                  {f.voiceKey && (
                    <VoiceInputButton
                      onTranscript={t => setData(prev => ({ ...prev, [f.key]: t }))}
                      size="sm"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Center panel: Preview ─────────────────────────────── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
              <Eye size={11} /> Live Preview
              {editLayout && (
                <span className="ml-2 text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Move size={9} /> Drag fields/logo to rearrange
                </span>
              )}
            </Label>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Edit Layout toggle — always visible on mobile */}
            <button
              onClick={() => setEditLayout(v => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors border ${
                editLayout
                  ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]"
              }`}
              title={editLayout ? "Exit layout edit mode" : "Enter layout edit mode to drag fields"}
            >
              <Move size={11} />
              {editLayout ? "Done" : "Edit Layout"}
            </button>
            {/* Share button — visible in preview area for easy mobile access */}
            <button
              onClick={handleShareCard}
              disabled={isSharing}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60"
              title="Share card and get a shareable link"
            >
              {isSharing ? <RefreshCw size={11} className="animate-spin" /> : <Share2 size={11} />}
              {isSharing ? "…" : "Share"}
            </button>
            <div className="flex rounded-lg border border-[hsl(var(--border))] overflow-hidden text-xs">
              {(["front", "back"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={`px-3 py-1.5 font-medium capitalize transition-colors flex items-center gap-1.5 ${
                    side === s
                      ? "bg-[hsl(var(--foreground))] text-white"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: s === "front" ? frontPrimary : backPrimary }} />
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          </div>

          {/* Card preview */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-8 shadow-sm flex flex-col items-center gap-4" style={cardShape === "digital" ? { background: "linear-gradient(160deg,#0f0f0f 0%,#1a1a1a 60%,#111 100%)" } : {}}>
            {cardShape === "digital" ? (
              <PhoneMockup>
                <CardCanvas
                  data={data}
                  template={frontTemplate}
                  backTemplate={backTemplate}
                  primary={frontPrimary}
                  secondary={frontSecondary}
                  accent={frontAccent}
                  backPrimary={backPrimary}
                  backSecondary={backSecondary}
                  backAccent={backAccent}
                  side={side}
                  cardShape={cardShape}
                  editLayout={editLayout}
                  fieldPositions={fieldPositions}
                  onFieldMove={handleFieldMove}
                  qrEnabled={qrEnabled}
                  qrData={qrDataStr}
                  qrSize={qrSize}
                  qrColor={effectiveQrColor}
                  qrBgColor={qrBgColor}
                  qrPosition={qrPosition}
                  qrSide={qrSide}
                  logoUrl={logoUrl}
                  logoSize={logoSize}
                  logoPos={logoPos}
                  onLogoMove={setLogoPos}
                  aiDesignData={aiDesignData}
                  fontFamily={cardFontFamily}
                  fontWeight={cardFontBold ? "bold" : undefined}
                  fontStyle={cardFontItalic ? "italic" : undefined}
                  nameFontSize={cardFontSize}
                />
              </PhoneMockup>
            ) : (
              <div className="w-full max-w-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${frontTemplate}-${backTemplate}-${frontColorIdx}-${backColorIdx}-${side}-${cardShape}`}
                    initial={{ opacity: 0, rotateY: side === "back" ? -15 : 15, scale: 0.96 }}
                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    style={{ perspective: 800 }}
                  >
                    <CardCanvas
                      data={data}
                      template={frontTemplate}
                      backTemplate={backTemplate}
                      primary={frontPrimary}
                      secondary={frontSecondary}
                      accent={frontAccent}
                      backPrimary={backPrimary}
                      backSecondary={backSecondary}
                      backAccent={backAccent}
                      side={side}
                      cardShape={cardShape}
                      editLayout={editLayout}
                      fieldPositions={fieldPositions}
                      onFieldMove={handleFieldMove}
                      qrEnabled={qrEnabled}
                      qrData={qrDataStr}
                      qrSize={qrSize}
                      qrColor={effectiveQrColor}
                      qrBgColor={qrBgColor}
                      qrPosition={qrPosition}
                      qrSide={qrSide}
                      logoUrl={logoUrl}
                      logoSize={logoSize}
                      logoPos={logoPos}
                      onLogoMove={setLogoPos}
                      aiDesignData={aiDesignData}
                      fontFamily={cardFontFamily}
                      fontWeight={cardFontBold ? "bold" : undefined}
                      fontStyle={cardFontItalic ? "italic" : undefined}
                      nameFontSize={cardFontSize}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
            <div className={`flex items-center gap-3 text-[10px] ${cardShape === "digital" ? "text-white/40" : "text-[hsl(var(--muted-foreground))]"}`}>
              <span>{CARD_SHAPES.find(s => s.id === cardShape)?.label} · {CARD_SHAPES.find(s => s.id === cardShape)?.ratio}</span>
              <span>·</span>
              <span>F: {TEMPLATES.find(t => t.id === frontTemplate)?.label} · B: {TEMPLATES.find(t => t.id === backTemplate)?.label}</span>
              {qrEnabled && <span>· QR on both sides</span>}
              {logoUrl && <span>· Logo on both sides</span>}
            </div>

            {/* Digital mode tabs + landing page editor + export */}
            {cardShape === "digital" && (
              <div className="w-full space-y-3">
                {/* Tab switcher */}
                <div className="flex rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                  {(["card", "landing"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDigitalTab(tab)}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
                        digitalTab === tab
                          ? "bg-blue-600/30 text-blue-100 border-b-2 border-blue-400"
                          : "bg-[#ffffff08] text-white/50 hover:text-white/70"
                      }`}
                    >
                      {tab === "card" ? "📇 Card" : "📄 Landing Page"}
                    </button>
                  ))}
                </div>

                {digitalTab === "landing" && (
                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[#ffffff08] p-4">
                    <DigitalLandingPageEditor
                      data={landingPageData}
                      onChange={setLandingPageData}
                      primaryColor={frontPrimary}
                    />
                  </div>
                )}

                {digitalTab === "card" && (
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-blue-200 space-y-1">
                    <p className="font-semibold text-blue-100 flex items-center gap-1.5">📱 NFC / Digital Card Mode</p>
                    <p>Export as HTML to host your digital card page on any web host (Netlify, GitHub Pages, etc.).</p>
                    <p className="opacity-70">Program that URL into an NFC sticker with any free NFC writer app — tap the sticker → phone opens your card → visitor taps Save Contact.</p>
                  </div>
                )}

                <button
                  onClick={handleExportHtml}
                  disabled={isExportingHtml}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-blue-400/40 bg-blue-600/20 text-blue-200 hover:bg-blue-600/30 transition-colors disabled:opacity-60"
                >
                  {isExportingHtml ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                  {isExportingHtml ? "Exporting…" : "Export HTML — Host as Digital Card"}
                </button>
              </div>
            )}
          </div>

          {/* All templates mini grid */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-4 block">
              All Templates Preview — click to set for {side === "front" ? "Front" : "Back"} side
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TEMPLATES.map(t => (
                <div key={t.id} className="relative group">
                  <div
                    className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      frontTemplate === t.id || backTemplate === t.id
                        ? "border-[hsl(var(--gold))] shadow-md"
                        : "border-transparent hover:border-[hsl(var(--border))]"
                    }`}
                  >
                    <CardFace
                      data={data}
                      template={t.id}
                      primary={frontPrimary}
                      secondary={frontSecondary}
                      accent={frontAccent}
                      side="front"
                      scale={0.45}
                      shapeStyle={{ aspectRatio: "3.5 / 2", borderRadius: 0 }}
                      aiDesignData={t.id === "ai-design" ? aiDesignData : null}
                      fontFamily={cardFontFamily}
                      fontWeight={cardFontBold ? "bold" : undefined}
                      fontStyle={cardFontItalic ? "italic" : undefined}
                      nameFontSize={cardFontSize}
                    />
                    {/* F/B badges */}
                    <div className="absolute top-1 left-1 flex gap-0.5">
                      {frontTemplate === t.id && (
                        <span className="text-[8px] font-bold bg-[hsl(var(--gold))] text-white px-1 rounded">F</span>
                      )}
                      {backTemplate === t.id && (
                        <span className="text-[8px] font-bold bg-[hsl(var(--foreground))] text-[hsl(var(--background))] px-1 rounded">B</span>
                      )}
                    </div>
                    {t.badge && (
                      <div className="absolute top-1 right-1 text-[10px]">{t.badge}</div>
                    )}
                    <p className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-semibold py-1 bg-black/40 text-white">
                      {t.label}
                    </p>
                    {/* Hover overlay with Set Front / Set Back */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                      <button
                        onClick={() => setFrontTemplate(t.id)}
                        className="text-[9px] font-bold bg-[hsl(var(--gold))] text-white px-2 py-1 rounded-full hover:opacity-90"
                      >
                        Set Front
                      </button>
                      <button
                        onClick={() => setBackTemplate(t.id)}
                        className="text-[9px] font-bold bg-white text-black px-2 py-1 rounded-full hover:opacity-90"
                      >
                        Set Back
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[hsl(var(--gold)/0.06)] border border-[hsl(var(--gold)/0.2)] rounded-2xl p-4 text-xs text-[hsl(var(--muted-foreground))] space-y-1.5">
            <p className="font-semibold text-[hsl(var(--foreground))] text-[13px]">Tips</p>
            <p><span className="font-medium text-[hsl(var(--foreground))]">Per-Side Colors</span> — Set different colors for Front and Back using the Colors panel.</p>
            <p><span className="font-medium text-[hsl(var(--foreground))]">Logo</span> — Upload in Brand Assets. Appears on both sides. Enable "Edit Layout" to drag it.</p>
            <p><span className="font-medium text-[hsl(var(--foreground))]">QR Code</span> — Enable QR and it shows on both Front and Back automatically.</p>
            <p><span className="font-medium text-[hsl(var(--foreground))]">AI Design</span> — Pick Tone + Industry + Pattern Style, then click Generate. The design appears instantly on the card. Regenerate for variety.</p>
          </div>
        </div>

        {/* ── Right panel: Style Controls ──────────────────────── */}
        <div className="space-y-4">

          {/* Per-Side Color System */}
          <Collapsible open={colorOpen} onOpenChange={setColorOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <Palette size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Colors</span>
                    <div className="flex gap-1">
                      <div className="w-3.5 h-3.5 rounded-full border border-white shadow-sm" style={{ background: frontPrimary }} title="Front" />
                      <div className="w-3.5 h-3.5 rounded-full border border-white shadow-sm" style={{ background: backPrimary }} title="Back" />
                    </div>
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${colorOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-4 pt-3">
                  {/* Context-aware label */}
                  {cardShape === "email-signature" && (
                    <p className="text-[9px] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] px-2 py-1.5 rounded-lg font-semibold">
                      ✨ Colors apply to your Email Signature border & accents
                    </p>
                  )}
                  {cardShape === "ticket" && (
                    <p className="text-[9px] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] px-2 py-1.5 rounded-lg font-semibold">
                      🎫 Colors apply to your Ticket stub & accents
                    </p>
                  )}
                  <ColorPickerSection
                    label={cardShape === "email-signature" ? "Signature Color" : cardShape === "ticket" ? "Ticket Color" : "Front Color"}
                    colorIdx={frontColorIdx}
                    customColor={frontCustomColor}
                    onPresetChange={setFrontColorIdx}
                    onCustomChange={setFrontCustomColor}
                  />

                  {/* Gradient / Ombre option */}
                  <div className="border-t border-[hsl(var(--border))] pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                        <Palette size={10} /> Gradient / Ombré
                      </Label>
                      <Switch checked={useGradient} onCheckedChange={setUseGradient} />
                    </div>
                    {useGradient && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Label className="text-[9px] text-[hsl(var(--muted-foreground))] mb-1 block">Start</Label>
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-md border border-[hsl(var(--border))]" style={{ background: frontPrimary }} />
                              <span className="text-[9px] text-[hsl(var(--muted-foreground))]">Primary</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))] mt-3">→</span>
                          <div className="flex-1">
                            <Label className="text-[9px] text-[hsl(var(--muted-foreground))] mb-1 block">End</Label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={gradientEnd}
                                onChange={e => setGradientEnd(e.target.value)}
                                className="w-6 h-6 rounded-md border border-[hsl(var(--border))] cursor-pointer p-0"
                              />
                              <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{gradientEnd}</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {([
                            { id: "135deg" as GradientDirection, label: "↘ Diagonal" },
                            { id: "45deg" as GradientDirection, label: "↗ Reverse" },
                            { id: "to right" as GradientDirection, label: "→ Horizontal" },
                            { id: "to bottom" as GradientDirection, label: "↓ Vertical" },
                            { id: "to left" as GradientDirection, label: "← Left" },
                            { id: "to top" as GradientDirection, label: "↑ Up" },
                          ]).map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setGradientDirection(opt.id)}
                              className={`text-[9px] py-1 px-1 rounded-lg border font-semibold transition-all text-center ${
                                gradientDirection === opt.id
                                  ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                                  : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {/* Gradient preview bar */}
                        <div
                          className="h-6 rounded-lg border border-[hsl(var(--border))]"
                          style={{ background: `linear-gradient(${gradientDirection}, ${frontPrimary}, ${gradientEnd})` }}
                        />
                      </div>
                    )}
                  </div>

                  {cardShape !== "email-signature" && (
                    <>
                      <div className="border-t border-[hsl(var(--border))]" />
                      <ColorPickerSection
                        label="Back Color"
                        colorIdx={backColorIdx}
                        customColor={backCustomColor}
                        onPresetChange={setBackColorIdx}
                        onCustomChange={setBackCustomColor}
                      />
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Brand Assets */}
          <Collapsible open={brandAssetOpen} onOpenChange={setBrandAssetOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Brand Assets</span>
                    {logoUrl && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${brandAssetOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))]">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] py-2">Upload logos, monograms, signatures — shown on BOTH sides. Drag to reposition (Enable Edit Layout).</p>
                  <BrandAssetLibrary
                    assetTypes={["monogram", "logo", "signature"]}
                    selectedUrl={logoUrl}
                    onSelect={asset => setLogoUrl(asset.file_url)}
                    showSizeControl
                    sizeValue={logoSize}
                    onSizeChange={setLogoSize}
                    sizeLabel="Logo Size"
                    sizeMin={30}
                    sizeMax={140}
                  />
                  {logoUrl && (
                    <button
                      onClick={() => setLogoUrl("")}
                      className="mt-2 text-[10px] text-red-500 hover:underline"
                    >
                      Remove logo from card
                    </button>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Typography panel */}
          <Collapsible open={typographyOpen} onOpenChange={setTypographyOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <Type size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Typography</span>
                    {(cardFontBold || cardFontItalic || cardFontSize != null) && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${typographyOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-4 pt-3">
                  {/* Style toggles */}
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Style</Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCardFontBold(v => !v)}
                        className={`w-10 h-10 rounded-lg border-2 font-bold text-sm transition-all ${cardFontBold ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`}
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        onClick={() => setCardFontItalic(v => !v)}
                        className={`w-10 h-10 rounded-lg border-2 italic font-semibold text-sm transition-all ${cardFontItalic ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`}
                        title="Italic"
                      >
                        I
                      </button>
                      <button
                        onClick={() => setCardUnderline(v => !v)}
                        className={`w-10 h-10 rounded-lg border-2 text-sm transition-all flex items-center justify-center ${cardUnderline ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`}
                        title="Underline"
                      >
                        <Underline size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Text Alignment */}
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Alignment</Label>
                    <div className="flex gap-1.5">
                      {([
                        { id: "left" as TextAlign, icon: <AlignLeft size={13} /> },
                        { id: "center" as TextAlign, icon: <AlignCenter size={13} /> },
                        { id: "right" as TextAlign, icon: <AlignRight size={13} /> },
                      ]).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setCardTextAlign(opt.id)}
                          className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                            cardTextAlign === opt.id
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
                          }`}
                        >
                          {opt.icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">Font Size</Label>
                      <div className="flex items-center gap-1.5">
                        {cardFontSize != null && (
                          <button onClick={() => setCardFontSize(null)} className="text-[9px] text-[hsl(var(--muted-foreground))] underline hover:text-[hsl(var(--foreground))]">Auto</button>
                        )}
                        <span className="text-[10px] font-semibold text-[hsl(var(--foreground))]">{cardFontSize != null ? `${cardFontSize}pt` : "Auto"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCardFontSize(v => Math.max(8, (v ?? 18) - 0.5))}
                        className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center hover:border-[hsl(var(--gold)/0.5)] transition-colors"
                      ><Minus size={12} /></button>
                      <div className="flex-1">
                        <Slider
                          min={8} max={18} step={0.5}
                          value={[cardFontSize ?? 18]}
                          onValueChange={([v]) => setCardFontSize(v)}
                        />
                      </div>
                      <button
                        onClick={() => setCardFontSize(v => Math.min(18, (v ?? 18) + 0.5))}
                        className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center hover:border-[hsl(var(--gold)/0.5)] transition-colors text-lg leading-none"
                      >+</button>
                    </div>
                  </div>

                  {/* Letter Spacing */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">Letter Spacing</Label>
                      <span className="text-[10px] font-semibold text-[hsl(var(--foreground))]">{cardLetterSpacing}px</span>
                    </div>
                    <Slider
                      min={-2} max={8} step={0.5}
                      value={[cardLetterSpacing]}
                      onValueChange={([v]) => setCardLetterSpacing(v)}
                    />
                  </div>

                  {/* Line Height */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">Line Height</Label>
                      <span className="text-[10px] font-semibold text-[hsl(var(--foreground))]">{cardLineHeight}</span>
                    </div>
                    <Slider
                      min={0.8} max={2.0} step={0.1}
                      value={[cardLineHeight]}
                      onValueChange={([v]) => setCardLineHeight(v)}
                    />
                  </div>

                  {/* Font Family */}
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Font Family</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { label: "Helvetica", value: "'Helvetica Neue', Arial, sans-serif" },
                        { label: "Georgia",   value: "Georgia, 'Times New Roman', serif" },
                        { label: "Garamond",  value: "Garamond, 'Palatino Linotype', serif" },
                        { label: "Courier",   value: "'Courier New', Courier, monospace" },
                        { label: "Futura",    value: "'Century Gothic', 'Trebuchet MS', sans-serif" },
                        { label: "Verdana",   value: "Verdana, Geneva, sans-serif" },
                        { label: "Cambria",   value: "Cambria, 'Hoefler Text', serif" },
                        { label: "Impact",    value: "Impact, 'Arial Black', sans-serif" },
                        { label: "Segoe",     value: "'Segoe UI', Tahoma, sans-serif" },
                        { label: "Lucida",    value: "'Lucida Console', Monaco, monospace" },
                      ] as { label: string; value: string }[]).map(f => (
                        <button
                          key={f.value}
                          onClick={() => setCardFontFamily(f.value)}
                          className={`text-[10px] py-1.5 px-2 rounded-lg border font-semibold transition-all text-left truncate ${
                            cardFontFamily === f.value
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                          style={{ fontFamily: f.value }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* QR Code panel */}
          <Collapsible open={qrOpen} onOpenChange={setQrOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <QrCode size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">QR Code</span>
                    {qrEnabled && <span className="w-2 h-2 rounded-full bg-green-500" />}
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${qrOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-4 pt-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-[hsl(var(--foreground))]">Show QR on Card</Label>
                    <Switch checked={qrEnabled} onCheckedChange={setQrEnabled} />
                  </div>

                  {qrEnabled && (
                    <>
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Show QR On</Label>
                        <div className="flex rounded-lg border border-[hsl(var(--border))] overflow-hidden text-xs">
                          {(["front", "back", "both"] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => setQrSide(s)}
                              className={`flex-1 py-1.5 font-semibold capitalize transition-colors ${
                                qrSide === s
                                  ? "bg-[hsl(var(--foreground))] text-white"
                                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">QR Content Type</Label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {([
                            { id: "url", label: "URL" }, { id: "vcard", label: "vCard" }, { id: "text", label: "Text" },
                            { id: "email", label: "Email" }, { id: "phone", label: "Phone" },
                          ] as { id: QrContentType; label: string }[]).map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => {
                                setQrContentType(opt.id);
                                setQrCustomContent("");
                                if (opt.id === "url" && data.website) setQrCustomContent(data.website);
                                if (opt.id === "email" && data.email) setQrCustomContent(data.email);
                                if (opt.id === "phone" && data.phone) setQrCustomContent(data.phone);
                              }}
                              className={`text-[10px] py-1.5 px-2 rounded-lg border font-semibold transition-all ${
                                qrContentType === opt.id
                                  ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                                  : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(qrContentType === "url" || qrContentType === "text" || qrContentType === "email" || qrContentType === "phone") && (
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-1.5 block">
                            {qrContentType === "url" ? "URL / Link" :
                             qrContentType === "email" ? "Email Address" :
                             qrContentType === "phone" ? "Phone Number" :
                             "Custom Text"}
                          </Label>
                          <Input
                            value={qrCustomContent}
                            onChange={e => setQrCustomContent(e.target.value)}
                            placeholder={
                              qrContentType === "url" ? "https://yourwebsite.com" :
                              qrContentType === "email" ? data.email || "email@example.com" :
                              qrContentType === "phone" ? data.phone || "+971 50 123 4567" :
                              "Custom message..."
                            }
                            className="h-8 text-xs"
                          />
                          {(qrContentType === "email" || qrContentType === "phone") && !qrCustomContent && (
                            <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-1">
                              Using card {qrContentType} · Type above to override
                            </p>
                          )}
                        </div>
                      )}
                      {qrContentType === "vcard" && (
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded-lg px-3 py-2">
                          vCard QR uses your card info (name, phone, email, company) automatically.
                        </p>
                      )}

                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-1.5 block">QR Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={effectiveQrColor}
                            onChange={e => setQrColor(e.target.value)}
                            className="w-10 h-8 rounded-lg border border-[hsl(var(--border))] cursor-pointer p-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                              {qrColor ? "Custom color" : `Auto-synced to Front color`}
                            </p>
                          </div>
                          {qrColor && (
                            <button onClick={() => setQrColor("")} className="text-[9px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline">Reset</button>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-1.5 block">Background</Label>
                        <div className="flex gap-2">
                          {["#ffffff", "#f5f5f5", "#000000"].map(bg => (
                            <button
                              key={bg}
                              onClick={() => setQrBgColor(bg)}
                              className={`w-8 h-8 rounded-lg border-2 transition-all ${qrBgColor === bg ? "border-[hsl(var(--gold))] scale-105" : "border-[hsl(var(--border))]"}`}
                              style={{ background: bg }}
                              title={bg}
                            />
                          ))}
                          <input
                            type="color"
                            value={qrBgColor}
                            onChange={e => setQrBgColor(e.target.value)}
                            className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] cursor-pointer p-0.5"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Size: {qrSize}px</Label>
                        <Slider min={40} max={180} step={4} value={[qrSize]} onValueChange={([v]) => setQrSize(v)} />
                      </div>

                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Placement</Label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {([
                            { id: "top-left", label: "↖ Top Left" }, { id: "top-right", label: "Top Right ↗" },
                            { id: "center", label: "⊙ Center" },
                            { id: "bottom-left", label: "↙ Bot Left" }, { id: "bottom-right", label: "Bot Right ↘" },
                          ] as { id: QrPosition; label: string }[]).map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setQrPosition(opt.id)}
                              className={`text-[9px] py-1.5 px-1 rounded-lg border font-semibold transition-all text-center ${
                                qrPosition === opt.id
                                  ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                                  : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-1.5 flex items-center gap-1 block">
                          <Sparkles size={10} /> Smart Style QR
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={qrAiPrompt}
                            onChange={e => setQrAiPrompt(e.target.value)}
                            placeholder="e.g. dark blue, large, bottom right..."
                            className="h-8 text-xs flex-1"
                            onKeyDown={e => e.key === "Enter" && handleAiQrStyle()}
                          />
                          <VoiceInputButton onTranscript={t => setQrAiPrompt(prev => prev ? `${prev} ${t}` : t)} size="sm" />
                          <Button
                            size="sm"
                            onClick={handleAiQrStyle}
                            disabled={isAiStylingQr || !qrAiPrompt.trim()}
                            className="h-8 text-xs gap-1"
                            style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))", color: "white" }}
                          >
                            {isAiStylingQr ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                            {isAiStylingQr ? "..." : "Apply"}
                          </Button>
                        </div>
                      </div>

                      {qrDataStr && (
                        <div className="flex items-center gap-3 p-3 bg-[hsl(var(--muted))] rounded-xl">
                          <img
                            src={buildQrUrl(qrDataStr, effectiveQrColor, qrBgColor, qrSize)}
                            alt="QR Preview"
                            className="rounded"
                            style={{ width: 56, height: 56 }}
                          />
                          <div>
                            <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">QR Preview</p>
                            <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-0.5">
                              {qrContentType.toUpperCase()} · {qrSize}px · {qrPosition}
                            </p>
                            <p className="text-[9px] text-green-600 mt-0.5">
                              Shows on: {qrSide === "both" ? "Front & Back" : qrSide === "front" ? "Front only" : "Back only"}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Smart Design Generator */}
          <Collapsible open={aiDesignOpen} onOpenChange={setAiDesignOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Smart Design Generator</span>
                    {aiDesignData && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
                    {activeTemplate === "ai-design" && aiDesignData && (
                      <span className="text-[9px] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-semibold">Active</span>
                    )}
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${aiDesignOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-3 pt-3">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                    Generate geometric shapes, triangles, lines, circles and architectural patterns for a unique business card.
                  </p>

                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Tone</Label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "modern",  label: "Modern"  },
                        { id: "luxe",    label: "Luxe"    },
                        { id: "tech",    label: "Tech"    },
                        { id: "minimal", label: "Minimal" },
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setAiTone(opt.id)}
                          className={`text-[10px] py-2 px-1 rounded-lg border font-semibold transition-all ${
                            aiTone === opt.id
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Industry</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: "real-estate",  label: "Real Estate" },
                        { id: "technology",   label: "Technology" },
                        { id: "fashion",      label: "Fashion" },
                        { id: "finance",      label: "Finance" },
                        { id: "healthcare",   label: "Healthcare" },
                        { id: "creative",     label: "Creative" },
                        { id: "law",          label: "Law" },
                        { id: "hospitality",  label: "Hospitality" },
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setAiIndustry(opt.id)}
                          className={`text-[10px] py-1.5 px-2 rounded-lg border font-semibold transition-all text-left ${
                            aiIndustry === opt.id
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Pattern Style</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "geometric",  label: "Geometric" },
                        { id: "lines",      label: "Lines" },
                        { id: "futuristic", label: "Futuristic" },
                        { id: "organic",    label: "Organic" },
                        { id: "abstract",   label: "Abstract" },
                        { id: "waves",      label: "Waves" },
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setAiStyle(opt.id)}
                          className={`text-[10px] py-1.5 px-2 rounded-lg border font-semibold transition-all ${
                            aiStyle === opt.id
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerateDesign}
                      disabled={isGeneratingDesign}
                      className="flex-1 h-9 text-xs gap-2 font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))" }}
                    >
                      {isGeneratingDesign ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {isGeneratingDesign ? "Generating…" : (aiDesignData ? "Regenerate" : "Generate Design")}
                    </Button>
                    {aiDesignData && (
                      <Button
                        onClick={() => { setAiDesignData(null); if (activeTemplate === "ai-design") setActiveTemplate("modern"); }}
                        disabled={isGeneratingDesign}
                        variant="outline"
                        className="h-9 text-xs gap-1 text-red-500 border-red-200 hover:bg-red-50"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  {aiDesignData && (
                    <div className="rounded-xl overflow-hidden border border-[hsl(var(--gold)/0.3)] shadow-sm">
                      <div className="bg-[hsl(var(--muted))] px-3 py-1.5 flex items-center justify-between">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Live Preview</p>
                        <p className="text-[9px] text-[hsl(var(--gold-dark))]">{aiDesignData.industry || aiIndustry} · {aiDesignData.style || aiStyle}</p>
                      </div>
                      <CardFace
                        data={data}
                        template="ai-design"
                        primary={frontPrimary}
                        secondary={frontSecondary}
                        accent={frontAccent}
                        side="front"
                        scale={0.5}
                        shapeStyle={{ aspectRatio: "3.5 / 2", borderRadius: 0 }}
                        aiDesignData={aiDesignData}
                        fontFamily={cardFontFamily}
                        fontWeight={cardFontBold ? "bold" : undefined}
                        fontStyle={cardFontItalic ? "italic" : undefined}
                        nameFontSize={cardFontSize}
                      />
                      <div className="bg-[hsl(var(--muted))] px-3 py-1.5 text-center">
                        <button
                          onClick={() => setActiveTemplate("ai-design")}
                          className="text-[9px] font-semibold text-[hsl(var(--gold-dark))] hover:underline"
                        >
                          {activeTemplate === "ai-design" ? "✓ Applied to card" : "→ Apply to card"}
                        </button>
                      </div>
                    </div>
                  )}

                  {isGeneratingDesign && (
                    <div className="flex items-center gap-2 p-3 bg-[hsl(var(--muted))] rounded-xl">
                      <RefreshCw size={14} className="animate-spin text-[hsl(var(--gold))]" />
                      <div>
                        <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Generating design…</p>
                        <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Creating {aiTone} {aiStyle} patterns for {aiIndustry}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Share Analytics */}
          <Collapsible>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <Eye size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Share Analytics</span>
                  </div>
                  <ChevronDown size={13} className="text-[hsl(var(--muted-foreground))]" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))]">
                  <div className="pt-3">
                    <CardShareAnalytics />
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      </div>
    </div>

      {/* NFC Programming Guide Modal */}
      <Dialog open={nfcGuideOpen} onOpenChange={setNfcGuideOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Wifi size={20} className="text-[hsl(var(--gold))]" />
              NFC Tag Programming Guide
            </DialogTitle>
            <DialogDescription>
              Write your digital card URL to an NFC sticker so anyone can tap and view your card instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* What you need */}
            <div className="rounded-xl border border-[hsl(var(--border))] p-4 bg-[hsl(var(--muted))]">
              <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2">
                <CreditCard size={14} className="text-[hsl(var(--gold))]" />
                What You Need
              </h4>
              <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1.5 list-disc pl-4">
                <li>An NFC sticker/card (NTAG213 or NTAG215 — available on Amazon for ~$1 each)</li>
                <li>A smartphone with NFC capability (most modern phones have it)</li>
                <li>A free NFC writer app (see below)</li>
                <li>Your shared card URL (from the Share button after saving)</li>
              </ul>
            </div>

            {/* Step-by-step */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                <Sparkles size={14} className="text-[hsl(var(--gold))]" />
                Step-by-Step Instructions
              </h4>

              {[
                { step: 1, title: "Download a Free NFC App", desc: "Install \"NFC Tools\" (free on both iOS and Android) from the App Store or Google Play.", icon: <Smartphone size={16} /> },
                { step: 2, title: "Get Your Card URL", desc: "Save your digital card, click \"Share\", and copy the public link (e.g., yoursite.com/card/abc123).", icon: <Copy size={16} /> },
                { step: 3, title: "Open NFC Tools → Write", desc: "Open the app, tap the \"Write\" tab, then tap \"Add a record\" → select \"URL/URI\".", icon: <Type size={16} /> },
                { step: 4, title: "Paste Your Card URL", desc: "Paste your shared card URL into the URL field. Make sure it starts with https://.", icon: <Globe size={16} /> },
                { step: 5, title: "Hold Phone to NFC Tag", desc: "Tap \"Write\", then hold the back of your phone against the NFC sticker until you see a success confirmation.", icon: <Wifi size={16} /> },
                { step: 6, title: "Test It!", desc: "Have someone tap their phone on the sticker — your digital card page opens instantly in their browser.", icon: <Check size={16} /> },
              ].map(({ step, title, desc, icon }) => (
                <div key={step} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))] flex items-center justify-center text-xs font-bold">
                    {step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                      {icon} {title}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommended apps */}
            <div className="rounded-xl border border-[hsl(var(--gold)/0.3)] p-4 bg-[hsl(var(--gold)/0.05)]">
              <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-2">Recommended Free Apps</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "NFC Tools", platform: "iOS & Android", note: "Most popular, clean UI" },
                  { name: "NFC TagWriter", platform: "Android", note: "By NXP (chip maker)" },
                  { name: "Simply NFC", platform: "iOS", note: "Minimal & fast" },
                  { name: "TagInfo", platform: "Android", note: "Read & diagnose tags" },
                ].map(app => (
                  <div key={app.name} className="p-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                    <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{app.name}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{app.platform}</p>
                    <p className="text-[10px] text-[hsl(var(--gold-dark))]">{app.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro tips */}
            <div className="rounded-xl border border-[hsl(var(--border))] p-4 bg-[hsl(var(--muted))]">
              <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2">
                <Star size={14} className="text-[hsl(var(--gold))]" />
                Pro Tips
              </h4>
              <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1.5 list-disc pl-4">
                <li>Stick NFC tags on the back of your physical business card, phone case, or portfolio</li>
                <li>NTAG215 tags hold more data and are more reliable than NTAG213</li>
                <li>Lock the tag after writing to prevent accidental overwrites</li>
                <li>Test with both iPhone (top edge) and Android (center back) — NFC antenna position varies</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
