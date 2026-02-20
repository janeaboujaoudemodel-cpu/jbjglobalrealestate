import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Download, CreditCard, Phone, Mail, Globe,
  MapPin, Building2, RefreshCw, Eye, Layers, ChevronRight,
  LayoutGrid, Check, ImageIcon, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BrandAssetLibrary, BrandAsset } from "@/components/corporate-suite/BrandAssetLibrary";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

// ─── Types ────────────────────────────────────────────────────────────────────
type Template = "modern" | "classic" | "minimal" | "bold" | "creative" | "corporate";

interface CardData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TEMPLATES: { id: Template; label: string; desc: string }[] = [
  { id: "modern",    label: "Modern",    desc: "Full-bleed gradient" },
  { id: "classic",   label: "Classic",   desc: "White + color accent" },
  { id: "minimal",   label: "Minimal",   desc: "Clean & typographic" },
  { id: "bold",      label: "Bold",      desc: "Dark, high contrast" },
  { id: "creative",  label: "Creative",  desc: "Geometric shape" },
  { id: "corporate", label: "Corporate", desc: "Formal + footer bar" },
];

const COLOR_PRESETS: { primary: string; secondary: string; label: string; accent: string }[] = [
  { primary: "#C8A766", secondary: "#ffffff", label: "JBJ Gold",  accent: "#1a1a1a" },
  { primary: "#1e3a8a", secondary: "#ffffff", label: "Navy Blue", accent: "#93c5fd" },
  { primary: "#0f766e", secondary: "#ffffff", label: "Teal",      accent: "#99f6e4" },
  { primary: "#7c3aed", secondary: "#ffffff", label: "Violet",    accent: "#ddd6fe" },
  { primary: "#be123c", secondary: "#ffffff", label: "Crimson",   accent: "#fecdd3" },
  { primary: "#334155", secondary: "#ffffff", label: "Slate",     accent: "#cbd5e1" },
  { primary: "#111827", secondary: "#ffffff", label: "Onyx",      accent: "#d1d5db" },
  { primary: "#065f46", secondary: "#ffffff", label: "Forest",    accent: "#6ee7b7" },
];

// ─── Card Preview Component ───────────────────────────────────────────────────
function CardFace({
  data, template, primary, secondary, accent, side = "front", scale = 1,
}: {
  data: CardData; template: Template; primary: string;
  secondary: string; accent: string; side?: "front" | "back"; scale?: number;
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
  };

  if (side === "back") {
    return (
      <div style={{ ...baseStyle, background: primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: secondary, opacity: 0.15 }}>
          <p style={{ fontSize: 24 * scale, fontWeight: 900, letterSpacing: 6, textTransform: "uppercase" }}>
            {data.company || "COMPANY"}
          </p>
        </div>
        {/* Subtle corner mark */}
        <div style={{
          position: "absolute", bottom: 12 * scale, right: 16 * scale,
          fontSize: 8 * scale, color: secondary, opacity: 0.3, letterSpacing: 2,
        }}>
          {data.website || ""}
        </div>
      </div>
    );
  }

  // ── MODERN ──────────────────────────────────────────────────
  if (template === "modern") {
    return (
      <div style={{ ...baseStyle, background: `linear-gradient(135deg, ${primary} 0%, ${primary}bb 100%)` }}>
        {/* Decorative circles */}
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
        {/* Accent line */}
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
        {/* Background shape */}
        <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: "50%", background: `${primary}18` }} />
        <div style={{ position: "absolute", right: 10, bottom: -20, width: 80, height: 80, borderRadius: "50%", background: `${primary}12` }} />

        <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", padding: `${16 * scale}px ${24 * scale}px` }}>
          <div style={{ flex: 1 }}>
            {/* Avatar circle */}
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
        {/* Footer bar */}
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

// ─── PDF Export ───────────────────────────────────────────────────────────────
async function exportCardAsPDF(
  data: CardData,
  template: Template,
  primary: string,
  secondary: string,
  accent: string,
) {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

  // 3.5" × 2" at 72 dpi = 252 × 144 pt
  const W = 252, H = 144;

  const pdfDoc = await PDFDocument.create();
  // Front page
  const frontPage = pdfDoc.addPage([W, H]);
  // Back page
  const backPage = pdfDoc.addPage([W, H]);

  const helveticaBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica       = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Helper: hex to rgb (0–1)
  function hex(h: string) {
    const c = h.replace("#", "");
    return rgb(
      parseInt(c.slice(0, 2), 16) / 255,
      parseInt(c.slice(2, 4), 16) / 255,
      parseInt(c.slice(4, 6), 16) / 255,
    );
  }

  const pc = hex(primary);
  const sc = hex(secondary !== "#ffffff" ? secondary : "#ffffff");
  const white = rgb(1, 1, 1);
  const black = rgb(0, 0, 0);
  const gray  = rgb(0.45, 0.45, 0.45);
  const lgray = rgb(0.65, 0.65, 0.65);

  const name    = data.name    || "Your Name";
  const title   = data.title   || "Job Title";
  const company = data.company || "Company Name";

  // ── Draw front based on template ──────────────────────────
  const fp = frontPage;

  if (template === "modern") {
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
    fp.drawRectangle({ x: 0, y: 0, width: W, height: H, borderColor: pc, borderWidth: 1.5, color: rgb(1,1,1), opacity: 0 });
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
    fp.drawEllipse({ x: W + 5,  y: 20,     xScale: 40, yScale: 40, color: pc, opacity: 0.07 });
    fp.drawText(name,   { x: 20, y: H - 46, size: 13, font: helveticaBold, color: black });
    fp.drawText(title,  { x: 20, y: H - 59, size: 8,  font: helvetica,     color: pc  });
    fp.drawText(company,{ x: 20, y: H - 71, size: 7,  font: helvetica,     color: lgray });
    let cy5 = 34;
    if (data.email) { fp.drawText(data.email, { x: 20, y: cy5, size: 7, font: helvetica, color: gray }); cy5 -= 11; }
    if (data.phone) { fp.drawText(data.phone, { x: 20, y: cy5, size: 7, font: helvetica, color: gray }); }
  } else {
    // corporate
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

  // ── Back page ───────────────────────────────────────────────
  backPage.drawRectangle({ x: 0, y: 0, width: W, height: H, color: pc });
  if (data.company) {
    const bkText = data.company.toUpperCase();
    backPage.drawText(bkText, {
      x: W / 2 - helveticaBold.widthOfTextAtSize(bkText, 20) / 2,
      y: H / 2 - 8,
      size: 20, font: helveticaBold, color: white, opacity: 0.12,
    });
  }
  if (data.website) {
    backPage.drawText(data.website, {
      x: W - 16 - helvetica.widthOfTextAtSize(data.website, 7),
      y: 12,
      size: 7, font: helvetica, color: white, opacity: 0.35,
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BusinessCardDesigner() {
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template>("modern");
  const [colorIdx, setColorIdx] = useState(0);
  const [side, setSide]         = useState<"front" | "back">("front");
  const [isExporting, setIsExporting] = useState(false);
  const [brandAssetOpen, setBrandAssetOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSize, setLogoSize] = useState(80);
  const [data, setData] = useState<CardData>({
    name: "", title: "", company: "", phone: "", email: "", website: "", address: "",
  });

  const preset = COLOR_PRESETS[colorIdx];

  const set = (k: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData(prev => ({ ...prev, [k]: e.target.value }));

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportCardAsPDF(data, template, preset.primary, preset.secondary, preset.accent);
      toast.success("Business card PDF exported!");
    } catch (err) {
      console.error(err);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const fields: { key: keyof CardData; label: string; placeholder: string; icon: React.ReactNode }[] = [
    { key: "name",    label: "Full Name",   placeholder: "Ahmed Al-Mansoori",         icon: <span className="text-[10px]">👤</span> },
    { key: "title",   label: "Job Title",   placeholder: "Senior Real Estate Consultant", icon: <Building2 size={12} /> },
    { key: "company", label: "Company",     placeholder: "JBJ Global Real Estate",    icon: <Building2 size={12} /> },
    { key: "phone",   label: "Phone",       placeholder: "+971 50 123 4567",          icon: <Phone size={12} /> },
    { key: "email",   label: "Email",       placeholder: "ahmed@company.ae",          icon: <Mail size={12} /> },
    { key: "website", label: "Website",     placeholder: "www.company.ae",            icon: <Globe size={12} /> },
    { key: "address", label: "Address",     placeholder: "Dubai, UAE",                icon: <MapPin size={12} /> },
  ];

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--pearl-1,48 30% 97%))" }}>
      {/* ── Sticky Header ──────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Left: back + breadcrumb */}
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

          {/* Right: tool info + export */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <CreditCard size={13} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[hsl(var(--foreground))] leading-none">Business Card Designer</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Design · Preview · Export PDF</p>
              </div>
            </div>
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
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">

        {/* ── Left panel: Controls ────────────────────────────── */}
        <div className="space-y-6">

          {/* Template picker */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-3 block flex items-center gap-1.5">
              <Layers size={11} /> Template
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`relative py-2.5 px-3 rounded-xl text-left border transition-all duration-200 ${
                    template === t.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] hover:bg-[hsl(var(--muted))]"
                  }`}
                >
                  {template === t.id && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
                      <Check size={8} className="text-white" />
                    </span>
                  )}
                  <p className={`text-xs font-semibold leading-none mb-0.5 ${template === t.id ? "text-[hsl(var(--gold-dark))]" : "text-[hsl(var(--foreground))]"}`}>
                    {t.label}
                  </p>
                  <p className="text-[9px] text-[hsl(var(--muted-foreground))]">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Color preset picker */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-3 block">
              Color
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setColorIdx(i)}
                  title={c.label}
                  className={`h-10 rounded-xl flex items-center justify-center text-[9px] font-semibold transition-all duration-200 border-2 ${
                    colorIdx === i ? "border-[hsl(var(--foreground))] scale-105 shadow-md" : "border-transparent hover:scale-105"
                  }`}
                  style={{ background: c.primary, color: c.secondary }}
                >
                  {colorIdx === i ? <Check size={12} /> : c.label.split(" ")[0]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-[hsl(var(--muted-foreground))]">
              Selected: <span className="font-semibold text-[hsl(var(--foreground))]">{COLOR_PRESETS[colorIdx].label}</span>
            </p>
          </div>

          {/* Brand Assets panel */}
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
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] py-2">Upload & save logos, monograms, signatures — reuse across all tools.</p>
                  <BrandAssetLibrary
                    assetTypes={["monogram", "logo", "signature"]}
                    selectedUrl={logoUrl}
                    onSelect={asset => setLogoUrl(asset.file_url)}
                    showSizeControl
                    sizeValue={logoSize}
                    onSizeChange={setLogoSize}
                    sizeLabel="Logo Size"
                    sizeMin={40}
                    sizeMax={160}
                  />
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
                <Input
                  value={data[f.key]}
                  onChange={set(f.key)}
                  placeholder={f.placeholder}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel: Preview ────────────────────────────── */}
        <div className="space-y-5">
          {/* Preview header + flip toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
              <Eye size={11} /> Live Preview
            </Label>
            <div className="flex rounded-lg border border-[hsl(var(--border))] overflow-hidden text-xs">
              {(["front", "back"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={`px-3 py-1.5 font-medium capitalize transition-colors ${
                    side === s
                      ? "bg-[hsl(var(--foreground))] text-white"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Card preview — big, centered */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-8 shadow-sm flex flex-col items-center gap-4">
            <div className="w-full max-w-[360px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${template}-${colorIdx}-${side}`}
                  initial={{ opacity: 0, rotateY: side === "back" ? -15 : 15, scale: 0.96 }}
                  animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  style={{ perspective: 800 }}
                >
                  <CardFace
                    data={data}
                    template={template}
                    primary={preset.primary}
                    secondary={preset.secondary}
                    accent={preset.accent}
                    side={side}
                    scale={1}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
              3.5" × 2" · Standard business card ratio · {TEMPLATES.find(t => t.id === template)?.label} template
            </p>
          </div>

          {/* All templates mini grid */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-4 block">
              All Templates Preview
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    template === t.id
                      ? "border-[hsl(var(--gold))] shadow-md"
                      : "border-transparent hover:border-[hsl(var(--border))]"
                  }`}
                >
                  <CardFace
                    data={data}
                    template={t.id}
                    primary={preset.primary}
                    secondary={preset.secondary}
                    accent={preset.accent}
                    side="front"
                    scale={0.45}
                  />
                  {template === t.id && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
                      <Check size={9} className="text-white" />
                    </div>
                  )}
                  <p className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-semibold py-1 bg-black/40 text-white">
                    {t.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Export info */}
          <div className="bg-[hsl(var(--gold)/0.06)] border border-[hsl(var(--gold)/0.2)] rounded-2xl p-4 text-xs text-[hsl(var(--muted-foreground))] space-y-1.5">
            <p className="font-semibold text-[hsl(var(--foreground))] text-[13px]">Export Options</p>
            <p>
              <span className="font-medium text-[hsl(var(--foreground))]">PDF Export</span> — Click "Export PDF" to download a 2-page PDF (front + back) at exact 3.5″×2″ business card dimensions.
            </p>
            <p>
              <span className="font-medium text-[hsl(var(--foreground))]">Print Ready</span> — Open the PDF in any viewer and print at 100% scale. No scaling needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
