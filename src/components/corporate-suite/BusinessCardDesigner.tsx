import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Download, CreditCard, Phone, Mail, Globe,
  MapPin, Building2, RefreshCw, Eye, Layers, ChevronRight,
  LayoutGrid, Check, ImageIcon, ChevronDown, QrCode, Move,
  Lock, Unlock, RotateCcw, Sparkles, RectangleHorizontal,
  RectangleVertical, Square, Maximize2, Monitor, Ticket,
  Save, Palette, Zap, Star, Cpu, Minus,
} from "lucide-react";
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

// ─── Types ────────────────────────────────────────────────────────────────────
type Template = "modern" | "classic" | "minimal" | "bold" | "creative" | "corporate" | "ai-design";
type CardShape = "horizontal" | "vertical" | "square" | "rounded-square" | "wide" | "digital" | "ticket" | "email-signature";
type QrPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "center";
type QrContentType = "url" | "vcard" | "text" | "email" | "phone";

interface CardData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

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
  { id: "ai-design", label: "AI Design", desc: "Generated patterns", badge: "✨" },
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
    case "email": return `mailto:${data.email || custom}`;
    case "phone": return `tel:${data.phone || custom}`;
    case "url":   return custom || data.website || "https://";
    default:      return custom;
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
}: {
  data: CardData; template: Template; primary: string;
  secondary: string; accent: string; side?: "front" | "back"; scale?: number;
  shapeStyle?: React.CSSProperties; aiDesignData?: AiDesignData | null;
  cardShape?: CardShape;
}) {
  const name    = data.name    || "Your Name";
  const title   = data.title   || "Job Title";
  const company = data.company || "Company Name";
  const initial = name.charAt(0).toUpperCase();

  const baseStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "3.5 / 2",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    position: "relative",
    userSelect: "none",
    ...shapeStyle,
  };

  // ── EMAIL SIGNATURE ─────────────────────────────────────────
  if (cardShape === "email-signature" || shapeStyle?.aspectRatio === "600 / 200") {
    return (
      <div style={{ ...baseStyle, background: "#ffffff", border: `2px solid ${primary}`, display: "flex", alignItems: "center", padding: `${14 * scale}px ${20 * scale}px`, gap: 16 * scale }}>
        <div style={{ borderRight: `3px solid ${primary}`, paddingRight: 16 * scale, minWidth: 120 * scale }}>
          <p style={{ fontSize: 14 * scale, fontWeight: 800, color: primary, margin: 0, lineHeight: 1.2 }}>{name}</p>
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
            <h2 style={{ fontSize: 18 * scale, fontWeight: 800, color: tc, margin: `${4 * scale}px 0 ${2 * scale}px` }}>{name}</h2>
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
      <div style={{ ...baseStyle, background: `linear-gradient(135deg, ${primary} 0%, ${primary}bb 100%)` }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${secondary}15` }} />
        <div style={{ position: "absolute", bottom: -30, left: -10, width: 100, height: 100, borderRadius: "50%", background: `${secondary}10` }} />
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: `${20 * scale}px ${24 * scale}px` }}>
          <div>
            <p style={{ fontSize: 9 * scale, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: secondary, opacity: 0.65, margin: 0 }}>{company}</p>
            <h2 style={{ fontSize: 18 * scale, fontWeight: 800, color: secondary, margin: `${4 * scale}px 0 ${2 * scale}px` }}>{name}</h2>
            <p style={{ fontSize: 10 * scale, color: secondary, opacity: 0.8, margin: 0 }}>{title}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 * scale }}>
            {data.phone   && <p style={{ fontSize: 8.5 * scale, color: secondary, opacity: 0.8, margin: 0 }}>☎ {data.phone}</p>}
            {data.email   && <p style={{ fontSize: 8.5 * scale, color: secondary, opacity: 0.8, margin: 0 }}>@ {data.email}</p>}
            {data.website && <p style={{ fontSize: 8.5 * scale, color: secondary, opacity: 0.8, margin: 0 }}>⬡ {data.website}</p>}
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
            <h2 style={{ fontSize: 17 * scale, fontWeight: 800, color: primary, margin: `0 0 ${2 * scale}px` }}>{name}</h2>
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
          <h2 style={{ fontSize: 20 * scale, fontWeight: 300, letterSpacing: 1, color: "#111", margin: `0 0 ${8 * scale}px` }}>{name}</h2>
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
            <h2 style={{ fontSize: 20 * scale, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, color: primary, margin: `0 0 ${3 * scale}px` }}>{name}</h2>
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
            <h2 style={{ fontSize: 15 * scale, fontWeight: 800, color: "#111", margin: `0 0 ${2 * scale}px` }}>{name}</h2>
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
            <h2 style={{ fontSize: 18 * scale, fontWeight: 800, margin: `0 0 ${3 * scale}px` }}>{name}</h2>
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
  qrEnabled, qrData, qrSize, qrColor, qrBgColor, qrPosition,
  logoUrl, logoSize, logoPos, onLogoMove, aiDesignData,
}: {
  data: CardData; template: Template; backTemplate: Template; primary: string; secondary: string; accent: string;
  backPrimary: string; backSecondary: string; backAccent: string;
  side: "front" | "back"; cardShape: CardShape; editLayout: boolean;
  fieldPositions: typeof DEFAULT_FIELD_POSITIONS;
  onFieldMove: (field: keyof typeof DEFAULT_FIELD_POSITIONS, pos: FieldPos) => void;
  qrEnabled: boolean; qrData: string; qrSize: number; qrColor: string; qrBgColor: string; qrPosition: QrPosition;
  logoUrl: string; logoSize: number; logoPos: { x: number; y: number };
  onLogoMove: (pos: { x: number; y: number }) => void;
  aiDesignData: AiDesignData | null;
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
      />

      {/* Logo overlay — shows on BOTH front and back */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt="logo"
          onMouseDown={e => startDrag("logo", e)}
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
          <div style={getFieldStyle("name")} onMouseDown={e => startDrag("field", e, "name")}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: editLayout ? "#fff" : "transparent", whiteSpace: "nowrap" }}>
              {editLayout ? (data.name || "Your Name") : ""}
            </span>
          </div>
          <div style={getFieldStyle("title")} onMouseDown={e => startDrag("field", e, "title")}>
            <span style={{ fontSize: "10px", color: editLayout ? "#fff" : "transparent", whiteSpace: "nowrap" }}>
              {editLayout ? (data.title || "Job Title") : ""}
            </span>
          </div>
          <div style={getFieldStyle("company")} onMouseDown={e => startDrag("field", e, "company")}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: editLayout ? "#fff" : "transparent", letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {editLayout ? (data.company || "Company Name") : ""}
            </span>
          </div>
        </>
      )}

      {/* QR Code overlay — shows on BOTH sides */}
      {qrEnabled && qrUrl && (
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

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `business-card-${(data.name || "card").toLowerCase().replace(/\s+/g, "-")}.pdf`;
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
  const [isSaving, setIsSaving] = useState(false);
  const [brandAssetOpen, setBrandAssetOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(true);
  const [logoUrl, setLogoUrl]   = useState("");
  const [logoSize, setLogoSize] = useState(60);
  const [logoPos, setLogoPos]   = useState({ ...DEFAULT_LOGO_POS });

  // Card shape
  const [cardShape, setCardShape] = useState<CardShape>("horizontal");
  const [shapeOpen, setShapeOpen] = useState(true);

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
  const [qrAiPrompt, setQrAiPrompt]     = useState("");
  const [isAiStylingQr, setIsAiStylingQr] = useState(false);

  // AI Design template
  const [aiDesignOpen, setAiDesignOpen] = useState(false);
  const [aiIndustry, setAiIndustry] = useState("real-estate");
  const [aiTone, setAiTone] = useState("modern");
  const [aiStyle, setAiStyle] = useState("geometric");
  const [aiDesignData, setAiDesignData] = useState<AiDesignData | null>(null);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);

  const [data, setData] = useState<CardData>({
    name: "", title: "", company: "", phone: "", email: "", website: "", address: "",
  });

  // Derived preset values
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

  // Save Card
  const handleSaveCard = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in to save."); return; }
      const cardState = {
        data, frontTemplate, backTemplate, frontColorIdx, backColorIdx, frontCustomColor, backCustomColor,
        cardShape, qrEnabled, qrContentType, qrCustomContent, qrSize, qrColor, qrBgColor, qrPosition,
        logoUrl, logoSize, logoPos, aiDesignData,
      };
      await supabase.from("design_assets").insert({
        user_id: user.id, asset_type: "stamp", file_url: "",
        name: `Business Card — ${data.name || "Untitled"} — ${new Date().toLocaleDateString()}`,
        metadata: cardState as any,
      });
      toast.success("Card saved! You can reload it from Brand Assets.");
    } catch (err) {
      console.error(err);
      toast.error("Save failed. Please try again.");
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


  const fields: { key: keyof CardData; label: string; placeholder: string; icon: React.ReactNode; voiceKey?: boolean }[] = [
    { key: "name",    label: "Full Name",   placeholder: "Ahmed Al-Mansoori",            icon: <span className="text-[10px]">👤</span>, voiceKey: true },
    { key: "title",   label: "Job Title",   placeholder: "Senior Real Estate Consultant",icon: <Building2 size={12} />, voiceKey: true },
    { key: "company", label: "Company",     placeholder: "JBJ Global Real Estate",       icon: <Building2 size={12} />, voiceKey: true },
    { key: "phone",   label: "Phone",       placeholder: "+971 50 123 4567",             icon: <Phone size={12} /> },
    { key: "email",   label: "Email",       placeholder: "ahmed@company.ae",             icon: <Mail size={12} /> },
    { key: "website", label: "Website",     placeholder: "www.company.ae",               icon: <Globe size={12} /> },
    { key: "address", label: "Address",     placeholder: "Dubai, UAE",                   icon: <MapPin size={12} /> },
  ];

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--pearl-1,48 30% 97%))" }}>
      {/* ── Sticky Header ──────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="sm"
              onClick={() => navigate("/toolkit/corporate-suite")}
              className="gap-1.5 h-8 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              <ArrowLeft size={13} /> Back
            </Button>
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-[hsl(var(--muted-foreground))]">
              <LayoutGrid size={10} />
              <span>Toolkit</span>
              <ChevronRight size={9} />
              <span>Corporate Suite</span>
              <ChevronRight size={9} />
              <span className="text-[hsl(var(--foreground))] font-semibold">Business Card</span>
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
              variant="ghost" size="sm"
              onClick={() => { setFieldPositions({ ...DEFAULT_FIELD_POSITIONS }); setLogoPos({ ...DEFAULT_LOGO_POS }); }}
              className="h-8 text-xs gap-1.5 text-[hsl(var(--muted-foreground))]"
              title="Reset positions"
            >
              <RotateCcw size={12} /> Reset
            </Button>

            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <CreditCard size={13} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[hsl(var(--foreground))] leading-none">Business Card Designer</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Shapes · QR · Drag · AI</p>
              </div>
            </div>

            <Button
              onClick={handleSaveCard}
              disabled={isSaving}
              variant="outline"
              className="gap-1.5 h-8 text-xs font-semibold"
            >
              {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              {isSaving ? "Saving…" : "Save Card"}
            </Button>

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

      {/* ── Main Content ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">

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
                      <button
                        key={s.id}
                        onClick={() => setCardShape(s.id)}
                        className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all ${
                          cardShape === s.id
                            ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]"
                            : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]"
                        }`}
                      >
                        <span className={cardShape === s.id ? "text-[hsl(var(--gold))]" : "text-[hsl(var(--muted-foreground))]"}>{s.icon}</span>
                        <span className={`text-[9px] font-semibold leading-none ${cardShape === s.id ? "text-[hsl(var(--gold-dark))]" : "text-[hsl(var(--muted-foreground))]"}`}>{s.label}</span>
                      </button>
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
                  <ColorPickerSection
                    label="Front Color"
                    colorIdx={frontColorIdx}
                    customColor={frontCustomColor}
                    onPresetChange={setFrontColorIdx}
                    onCustomChange={setFrontCustomColor}
                  />
                  <div className="border-t border-[hsl(var(--border))]" />
                  <ColorPickerSection
                    label="Back Color"
                    colorIdx={backColorIdx}
                    customColor={backCustomColor}
                    onPresetChange={setBackColorIdx}
                    onCustomChange={setBackCustomColor}
                  />
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
                        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">QR Content Type</Label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {([
                            { id: "url", label: "URL" }, { id: "vcard", label: "vCard" }, { id: "text", label: "Text" },
                            { id: "email", label: "Email" }, { id: "phone", label: "Phone" },
                          ] as { id: QrContentType; label: string }[]).map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => setQrContentType(opt.id)}
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

                      {(qrContentType === "url" || qrContentType === "text") && (
                        <div>
                          <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-1.5 block">
                            {qrContentType === "url" ? "URL / Link" : "Custom Text"}
                          </Label>
                          <Input
                            value={qrCustomContent}
                            onChange={e => setQrCustomContent(e.target.value)}
                            placeholder={qrContentType === "url" ? "https://yourwebsite.com" : "Custom message..."}
                            className="h-8 text-xs"
                          />
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
                          <Sparkles size={10} /> AI Style QR
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
                            <p className="text-[9px] text-green-600 mt-0.5">Shows on both front & back</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* AI Design panel */}
          <Collapsible open={aiDesignOpen} onOpenChange={setAiDesignOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">AI Design Generator</span>
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
                    Generate geometric shapes, triangles, lines, circles and architectural patterns for a unique business card via Gemini AI.
                  </p>

                  {/* Tone selector */}
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Tone</Label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: "modern",  label: "Modern",  emoji: "⚡" },
                        { id: "luxe",    label: "Luxe",    emoji: "✦" },
                        { id: "tech",    label: "Tech",    emoji: "◈" },
                        { id: "minimal", label: "Minimal", emoji: "○" },
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setAiTone(opt.id)}
                          className={`text-[10px] py-2 px-1 rounded-lg border font-semibold transition-all flex flex-col items-center gap-0.5 ${
                            aiTone === opt.id
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                        >
                          <span className="text-base leading-none">{opt.emoji}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Industry selector */}
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Industry</Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: "real-estate",  label: "🏙 Real Estate" },
                        { id: "technology",   label: "💻 Technology" },
                        { id: "fashion",      label: "👗 Fashion" },
                        { id: "finance",      label: "📈 Finance" },
                        { id: "healthcare",   label: "⚕ Healthcare" },
                        { id: "creative",     label: "🎨 Creative" },
                        { id: "law",          label: "⚖ Law" },
                        { id: "hospitality",  label: "🏨 Hospitality" },
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

                  {/* Style selector */}
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

                  {/* Generate / Regenerate buttons */}
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

                  {/* Live mini-preview of AI design */}
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
                        <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Generating AI design…</p>
                        <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Gemini is creating {aiTone} {aiStyle} patterns for {aiIndustry}</p>
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

        {/* ── Right panel: Preview ─────────────────────────────── */}
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

          {/* Card preview */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-8 shadow-sm flex flex-col items-center gap-4">
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
                    logoUrl={logoUrl}
                    logoSize={logoSize}
                    logoPos={logoPos}
                    onLogoMove={setLogoPos}
                    aiDesignData={aiDesignData}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[hsl(var(--muted-foreground))]">
              <span>{CARD_SHAPES.find(s => s.id === cardShape)?.label} · {CARD_SHAPES.find(s => s.id === cardShape)?.ratio}</span>
              <span>·</span>
              <span>F: {TEMPLATES.find(t => t.id === frontTemplate)?.label} · B: {TEMPLATES.find(t => t.id === backTemplate)?.label}</span>
              {qrEnabled && <span>· QR on both sides</span>}
              {logoUrl && <span>· Logo on both sides</span>}
            </div>
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
            <p>🎨 <span className="font-medium text-[hsl(var(--foreground))]">Per-Side Colors</span> — Set different colors for Front and Back using the Colors panel.</p>
            <p>🖼️ <span className="font-medium text-[hsl(var(--foreground))]">Logo</span> — Upload in Brand Assets. Appears on both sides. Enable "Edit Layout" to drag it.</p>
            <p>📱 <span className="font-medium text-[hsl(var(--foreground))]">QR Code</span> — Enable QR and it shows on both Front and Back automatically.</p>
            <p>✨ <span className="font-medium text-[hsl(var(--foreground))]">AI Design</span> — Pick Tone + Industry + Pattern Style, then click Generate. The design appears instantly on the card. Regenerate for variety.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
