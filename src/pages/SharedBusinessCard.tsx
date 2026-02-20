import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, CreditCard, RefreshCw } from "lucide-react";

// ─── Minimal type mirrors (no import from designer to keep this page standalone) ─
type Template = "modern" | "classic" | "minimal" | "bold" | "creative" | "corporate" | "ai-design";
type CardShape = "horizontal" | "vertical" | "square" | "rounded-square" | "wide" | "digital" | "ticket" | "email-signature";

interface CardData {
  name: string; title: string; company: string;
  phone: string; email: string; website: string; address: string;
}

interface AiSvgElement {
  type: "path" | "circle" | "rect" | "polygon" | "line" | "ellipse";
  d?: string; cx?: number; cy?: number; rx?: number; ry?: number; r?: number;
  x?: number; y?: number; width?: number; height?: number; rx_attr?: number;
  points?: string; x1?: number; y1?: number; x2?: number; y2?: number;
  fill?: string; stroke?: string; strokeWidth?: number; fillOpacity?: number; strokeOpacity?: number;
}

interface AiDesignData {
  elements: AiSvgElement[]; colors: string[]; bgColor: string;
  textColor: string; accentColor?: string; style?: string; industry?: string;
}

interface CardSnapshot {
  data: CardData;
  frontTemplate: Template;
  frontColorIdx: number;
  frontCustomColor: string;
  cardShape: CardShape;
  logoUrl?: string;
  logoSize?: number;
  aiDesignData?: AiDesignData | null;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  nameFontSize?: number | null;
  frontPrimary?: string;
  frontSecondary?: string;
  frontAccent?: string;
}

const COLOR_PRESETS = [
  { primary: "#C8A766", secondary: "#ffffff", accent: "#1a1a1a" },
  { primary: "#1e3a8a", secondary: "#ffffff", accent: "#93c5fd" },
  { primary: "#0f766e", secondary: "#ffffff", accent: "#99f6e4" },
  { primary: "#7c3aed", secondary: "#ffffff", accent: "#ddd6fe" },
  { primary: "#be123c", secondary: "#ffffff", accent: "#fecdd3" },
  { primary: "#334155", secondary: "#ffffff", accent: "#cbd5e1" },
  { primary: "#111827", secondary: "#ffffff", accent: "#d1d5db" },
  { primary: "#065f46", secondary: "#ffffff", accent: "#6ee7b7" },
  { primary: "#000000", secondary: "#C8A766", accent: "#C8A766" },
];

function getShapeStyle(shape: CardShape): React.CSSProperties {
  const shapes: Record<CardShape, React.CSSProperties> = {
    "horizontal":      { aspectRatio: "3.5 / 2",  borderRadius: 12 },
    "vertical":        { aspectRatio: "2 / 3.5",  borderRadius: 12 },
    "square":          { aspectRatio: "1 / 1",    borderRadius: 12 },
    "rounded-square":  { aspectRatio: "1 / 1",    borderRadius: 40 },
    "wide":            { aspectRatio: "4 / 1.5",  borderRadius: 12 },
    "digital":         { aspectRatio: "9 / 16",   borderRadius: 24 },
    "ticket":          { aspectRatio: "5 / 2",    borderRadius: 8  },
    "email-signature": { aspectRatio: "600 / 200", borderRadius: 8 },
  };
  return shapes[shape] || shapes["horizontal"];
}

// ─── Mini CardFace renderer (self-contained, no drag logic) ───────────────────
function CardFaceView({ snapshot }: { snapshot: CardSnapshot }) {
  const {
    data, frontTemplate: template, frontColorIdx = 0, frontCustomColor = "",
    cardShape = "horizontal", aiDesignData,
    fontFamily, fontWeight, fontStyle, nameFontSize,
    frontPrimary: fp, frontSecondary: fs, frontAccent: fa,
  } = snapshot;

  const preset = COLOR_PRESETS[frontColorIdx] || COLOR_PRESETS[0];
  const primary   = fp || frontCustomColor || preset.primary;
  const secondary = fs || preset.secondary;
  const accent    = fa || preset.accent;

  const name    = data.name    || "Your Name";
  const title   = data.title   || "Job Title";
  const company = data.company || "Company Name";
  const initial = name.charAt(0).toUpperCase();

  const resolvedFontWeight = fontWeight || "800";
  const resolvedFontStyle  = fontStyle  || "normal";
  const resolvedNameSize   = nameFontSize != null ? nameFontSize : 18;
  const shapeStyle = getShapeStyle(cardShape);

  const baseStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "3.5 / 2",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
    fontFamily: fontFamily || "'Helvetica Neue', Arial, sans-serif",
    position: "relative",
    userSelect: "none",
    ...shapeStyle,
  };

  // Email signature
  if (cardShape === "email-signature") {
    return (
      <div style={{ ...baseStyle, background: "#ffffff", border: `2px solid ${primary}`, display: "flex", alignItems: "center", padding: "14px 20px", gap: 16 }}>
        <div style={{ borderRight: `3px solid ${primary}`, paddingRight: 16, minWidth: 120 }}>
          <p style={{ fontSize: resolvedNameSize * 0.78, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: primary, margin: 0, lineHeight: 1.2 }}>{name}</p>
          <p style={{ fontSize: 9, color: "#555", margin: "3px 0 0", fontWeight: 500 }}>{title}</p>
          <p style={{ fontSize: 8.5, color: "#999", margin: "2px 0 0", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>{company}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          {data.phone   && <p style={{ fontSize: 8.5, color: "#444", margin: 0 }}>T: {data.phone}</p>}
          {data.email   && <p style={{ fontSize: 8.5, color: primary, margin: 0 }}>{data.email}</p>}
          {data.website && <p style={{ fontSize: 8.5, color: primary, margin: 0 }}>{data.website}</p>}
        </div>
      </div>
    );
  }

  // Ticket
  if (cardShape === "ticket") {
    return (
      <div style={{ ...baseStyle, background: "#fff", border: `2px solid ${primary}`, display: "flex", overflow: "hidden" }}>
        <div style={{ width: "32%", background: primary, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 8px", gap: 6, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: secondary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: primary }}>{initial}</span>
          </div>
          <p style={{ fontSize: 7, fontWeight: 700, color: secondary, opacity: 0.85, textAlign: "center", wordBreak: "break-word", margin: 0 }}>{company}</p>
        </div>
        <div style={{ width: 1, flexShrink: 0, background: `repeating-linear-gradient(to bottom, ${primary}80 0px, ${primary}80 5px, transparent 5px, transparent 10px)` }} />
        <div style={{ flex: 1, padding: "10px 14px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
          <h2 style={{ fontSize: resolvedNameSize * 0.7, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: "#111", margin: 0, lineHeight: 1.2 }}>{name}</h2>
          <p style={{ fontSize: 8, color: primary, fontWeight: 600, margin: 0 }}>{title}</p>
          <div style={{ borderTop: `1px solid ${primary}30`, paddingTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
            {data.email   && <p style={{ fontSize: 7, color: "#666", margin: 0 }}>@ {data.email}</p>}
            {data.phone   && <p style={{ fontSize: 7, color: "#666", margin: 0 }}>☎ {data.phone}</p>}
            {data.website && <p style={{ fontSize: 7, color: primary, margin: 0 }}>⬡ {data.website}</p>}
          </div>
        </div>
      </div>
    );
  }

  // AI Design
  if (template === "ai-design") {
    const bg = aiDesignData?.bgColor || primary;
    const tc = aiDesignData?.textColor || secondary;
    const ac = aiDesignData?.accentColor || accent;
    const els = aiDesignData?.elements;
    const cols = aiDesignData?.colors || [ac];
    return (
      <div style={{ ...baseStyle, background: bg, overflow: "hidden" }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden" }} viewBox="0 0 350 200" preserveAspectRatio="xMidYMid slice">
          {els && els.length > 0 ? els.map((el, i) => {
            const fill = el.fill || cols[i % cols.length];
            const stroke = el.stroke || "none";
            const sw = el.strokeWidth ?? 1;
            const fo = el.fillOpacity ?? 0.35;
            const so = el.strokeOpacity ?? 1;
            const shared = { fill, stroke, strokeWidth: sw, fillOpacity: fo, strokeOpacity: so };
            if (el.type === "path" && el.d)        return <path key={i} d={el.d} {...shared} />;
            if (el.type === "circle")               return <circle key={i} cx={el.cx ?? 0} cy={el.cy ?? 0} r={el.r ?? 20} {...shared} />;
            if (el.type === "ellipse")              return <ellipse key={i} cx={el.cx ?? 0} cy={el.cy ?? 0} rx={el.rx ?? 20} ry={el.ry ?? 10} {...shared} />;
            if (el.type === "rect")                 return <rect key={i} x={el.x ?? 0} y={el.y ?? 0} width={el.width ?? 40} height={el.height ?? 40} rx={el.rx_attr ?? 0} {...shared} />;
            if (el.type === "polygon" && el.points) return <polygon key={i} points={el.points} {...shared} />;
            if (el.type === "line")                 return <line key={i} x1={el.x1 ?? 0} y1={el.y1 ?? 0} x2={el.x2 ?? 0} y2={el.y2 ?? 0} stroke={fill} strokeWidth={sw} strokeOpacity={so} fill="none" />;
            return null;
          }) : (
            <>
              <circle cx="300" cy="30" r="80" fill={ac} fillOpacity="0.18" />
              <circle cx="320" cy="180" r="50" fill={tc} fillOpacity="0.08" />
              <polygon points="0,0 70,0 0,70" fill={tc} fillOpacity="0.10" />
              <rect x="250" y="120" width="120" height="120" rx="60" fill={ac} fillOpacity="0.12" />
            </>
          )}
        </svg>
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "20px 24px" }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: tc, opacity: 0.65, margin: 0 }}>{company}</p>
            <h2 style={{ fontSize: resolvedNameSize, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: tc, margin: "4px 0 2px" }}>{name}</h2>
            <p style={{ fontSize: 10, color: tc, opacity: 0.8, margin: 0 }}>{title}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {data.phone   && <p style={{ fontSize: 8.5, color: tc, opacity: 0.75, margin: 0 }}>☎ {data.phone}</p>}
            {data.email   && <p style={{ fontSize: 8.5, color: tc, opacity: 0.75, margin: 0 }}>@ {data.email}</p>}
            {data.website && <p style={{ fontSize: 8.5, color: tc, opacity: 0.75, margin: 0 }}>⬡ {data.website}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Modern
  if (template === "modern") {
    return (
      <div style={{ ...baseStyle, background: `linear-gradient(135deg, ${primary} 0%, ${primary}bb 100%)` }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${secondary}15` }} />
        <div style={{ position: "absolute", bottom: -30, left: -10, width: 100, height: 100, borderRadius: "50%", background: `${secondary}10` }} />
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "20px 24px" }}>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: secondary, opacity: 0.65, margin: 0 }}>{company}</p>
            <h2 style={{ fontSize: resolvedNameSize, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: secondary, margin: "4px 0 2px" }}>{name}</h2>
            <p style={{ fontSize: 10, color: secondary, opacity: 0.8, margin: 0 }}>{title}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {data.phone   && <p style={{ fontSize: 8.5, color: secondary, opacity: 0.8, margin: 0 }}>☎ {data.phone}</p>}
            {data.email   && <p style={{ fontSize: 8.5, color: secondary, opacity: 0.8, margin: 0 }}>@ {data.email}</p>}
            {data.website && <p style={{ fontSize: 8.5, color: secondary, opacity: 0.8, margin: 0 }}>⬡ {data.website}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Classic
  if (template === "classic") {
    return (
      <div style={{ ...baseStyle, background: "#fff", border: `2px solid ${primary}` }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: primary }} />
        <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "18px 20px 18px 24px" }}>
          <div>
            <h2 style={{ fontSize: resolvedNameSize * 0.94, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: primary, margin: "0 0 2px" }}>{name}</h2>
            <p style={{ fontSize: 10, color: "#555", margin: "0 0 4px" }}>{title}</p>
            <p style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#aaa", margin: 0 }}>{company}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {data.phone   && <p style={{ fontSize: 8.5, color: "#555", margin: 0 }}>☎ {data.phone}</p>}
            {data.email   && <p style={{ fontSize: 8.5, color: "#555", margin: 0 }}>@ {data.email}</p>}
            {data.website && <p style={{ fontSize: 8.5, color: primary, margin: 0 }}>⬡ {data.website}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Minimal
  if (template === "minimal") {
    return (
      <div style={{ ...baseStyle, background: "#fafafa" }}>
        <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "22px 28px" }}>
          <div>
            <h2 style={{ fontSize: resolvedNameSize, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: "#111", margin: "0 0 4px" }}>{name}</h2>
            <div style={{ width: 28, height: 2, background: primary, marginBottom: 8 }} />
            <p style={{ fontSize: 9, color: "#666", margin: 0 }}>{title} · {company}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {data.email   && <p style={{ fontSize: 8.5, color: "#888", margin: 0 }}>{data.email}</p>}
            {data.phone   && <p style={{ fontSize: 8.5, color: "#888", margin: 0 }}>{data.phone}</p>}
            {data.website && <p style={{ fontSize: 8.5, color: primary, margin: 0 }}>{data.website}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Bold
  if (template === "bold") {
    return (
      <div style={{ ...baseStyle, background: "#0a0a0a" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: primary }} />
        <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "18px 20px" }}>
          <div>
            <h2 style={{ fontSize: resolvedNameSize, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: primary, margin: "4px 0 2px", textTransform: "uppercase" }}>{name}</h2>
            <p style={{ fontSize: 8.5, color: "#888", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>{title}</p>
          </div>
          <div>
            <p style={{ fontSize: 8, color: "#444", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 6px" }}>{company}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {data.phone && <p style={{ fontSize: 8, color: "#888", margin: 0 }}>{data.phone}</p>}
              {data.email && <p style={{ fontSize: 8, color: "#888", margin: 0 }}>{data.email}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Creative
  if (template === "creative") {
    return (
      <div style={{ ...baseStyle, background: "#fff" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 140, height: 140, borderRadius: "50%", background: primary, opacity: 0.08 }} />
        <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "20px 22px" }}>
          <div>
            <h2 style={{ fontSize: resolvedNameSize, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: "#111", margin: "0 0 2px" }}>{name}</h2>
            <p style={{ fontSize: 10, color: primary, fontWeight: 600, margin: "0 0 2px" }}>{title}</p>
            <p style={{ fontSize: 8.5, color: "#aaa", margin: 0 }}>{company}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {data.email && <p style={{ fontSize: 8.5, color: "#666", margin: 0 }}>@ {data.email}</p>}
            {data.phone && <p style={{ fontSize: 8.5, color: "#666", margin: 0 }}>☎ {data.phone}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Corporate (default)
  return (
    <div style={{ ...baseStyle, background: primary }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32, background: "rgba(0,0,0,0.18)" }} />
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "20px 20px 10px" }}>
        <div>
          <p style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: secondary, opacity: 0.55, margin: "0 0 6px" }}>{company}</p>
          <h2 style={{ fontSize: resolvedNameSize, fontWeight: resolvedFontWeight, fontStyle: resolvedFontStyle, color: secondary, margin: "0 0 2px" }}>{name}</h2>
          <p style={{ fontSize: 9.5, color: secondary, opacity: 0.8, margin: 0 }}>{title}</p>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {data.phone   && <p style={{ fontSize: 8, color: secondary, opacity: 0.7, margin: 0 }}>{data.phone}</p>}
          {data.email   && <p style={{ fontSize: 8, color: secondary, opacity: 0.7, margin: 0 }}>{data.email}</p>}
          {data.website && <p style={{ fontSize: 8, color: secondary, opacity: 0.7, margin: 0 }}>{data.website}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── vCard builder ────────────────────────────────────────────────────────────
function buildVCard(data: CardData): string {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${data.name || ""}`,
    `N:${(data.name || "").split(" ").slice(1).join(" ")};${(data.name || "").split(" ")[0]};;;`,
    `ORG:${data.company || ""}`,
    `TITLE:${data.title || ""}`,
    data.phone   ? `TEL;TYPE=CELL:${data.phone}` : "",
    data.email   ? `EMAIL:${data.email}` : "",
    data.website ? `URL:${data.website}` : "",
    data.address ? `ADR:;;${data.address};;;;` : "",
    "END:VCARD",
  ].filter(Boolean).join("\r\n");
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SharedBusinessCard() {
  const { token } = useParams<{ token: string }>();
  const [snapshot, setSnapshot] = useState<CardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { setError("Invalid link."); setLoading(false); return; }

    const fetchCard = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from("shared_business_cards")
          .select("card_data")
          .eq("token", token)
          .single();

        if (fetchErr || !data) throw new Error("Card not found.");

        setSnapshot(data.card_data as unknown as CardSnapshot);

        // Increment view count (fire & forget)
        supabase.rpc("increment_shared_card_views", { card_token: token }).then(() => {});
      } catch (err: any) {
        setError(err.message || "Failed to load card.");
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [token]);

  const handleSaveContact = () => {
    if (!snapshot) return;
    setSaving(true);
    try {
      const vcf = buildVCard(snapshot.data);
      const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(snapshot.data.name || "contact").replace(/\s+/g, "-")}.vcf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setSaving(false), 800);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)" }}>
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={28} className="animate-spin text-[#C8A766]" />
          <p className="text-sm text-white/60">Loading card…</p>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)" }}>
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
            <CreditCard size={28} className="text-white/30" />
          </div>
          <p className="text-white font-semibold text-lg">Card Not Found</p>
          <p className="text-white/50 text-sm">This link may have expired or been removed.</p>
          <Link to="/toolkit/corporate-suite/business-card" className="inline-block mt-4 text-[#C8A766] text-sm hover:underline">
            Create your own card →
          </Link>
        </div>
      </div>
    );
  }

  const { data: cardData } = snapshot;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(160deg, #0a0a0a 0%, #111 60%, #1a1510 100%)" }}
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#C8A766] to-[#A8874A] flex items-center justify-center">
            <CreditCard size={13} className="text-white" />
          </div>
          <span className="text-white/70 text-sm font-medium">Digital Business Card</span>
        </div>
        {cardData.company && (
          <p className="text-white/40 text-xs uppercase tracking-widest">{cardData.company}</p>
        )}
      </div>

      {/* Card Preview */}
      <div className="w-full max-w-[420px]">
        <CardFaceView snapshot={snapshot} />

        {/* Logo overlay */}
        {snapshot.logoUrl && (
          <div className="mt-3 flex justify-center">
            <img
              src={snapshot.logoUrl}
              alt="Logo"
              className="h-10 object-contain rounded"
            />
          </div>
        )}
      </div>

      {/* Contact info summary */}
      <div className="mt-6 w-full max-w-[420px] space-y-2">
        {cardData.phone && (
          <a href={`tel:${cardData.phone}`} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-4 py-3 text-white/80 text-sm">
            <span className="text-base">📞</span>
            <span>{cardData.phone}</span>
          </a>
        )}
        {cardData.email && (
          <a href={`mailto:${cardData.email}`} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-4 py-3 text-white/80 text-sm">
            <span className="text-base">✉️</span>
            <span>{cardData.email}</span>
          </a>
        )}
        {cardData.website && (
          <a href={cardData.website.startsWith("http") ? cardData.website : `https://${cardData.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-4 py-3 text-white/80 text-sm">
            <span className="text-base">🌐</span>
            <span>{cardData.website}</span>
          </a>
        )}
        {cardData.address && (
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 text-white/60 text-sm">
            <span className="text-base">📍</span>
            <span>{cardData.address}</span>
          </div>
        )}
      </div>

      {/* Save Contact CTA */}
      <div className="mt-8 w-full max-w-[420px]">
        <Button
          onClick={handleSaveContact}
          disabled={saving}
          className="w-full h-14 text-base font-bold rounded-2xl shadow-xl transition-all duration-200 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #C8A766 0%, #A8874A 100%)",
            color: "#fff",
            boxShadow: "0 8px 30px rgba(200,167,102,0.4)",
          }}
        >
          {saving ? (
            <RefreshCw size={18} className="animate-spin mr-2" />
          ) : (
            <Download size={18} className="mr-2" />
          )}
          {saving ? "Saving…" : "💾 Save Contact"}
        </Button>
        <p className="text-center text-white/30 text-xs mt-3">
          Downloads a .vcf file — tap to add to your phone contacts instantly
        </p>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <Link
          to="/toolkit/corporate-suite/business-card"
          className="text-white/20 text-xs hover:text-[#C8A766] transition-colors"
        >
          Create your card with JBJ Business Card Designer →
        </Link>
      </div>
    </div>
  );
}
