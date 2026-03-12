import React, { useState, useRef, useEffect } from "react";
import {
  type Template, type CardShape, type QrPosition, type CardData,
  type BilingualMode, type AiDesignData, type FieldPos,
  getShapeStyle, DEFAULT_FIELD_POSITIONS, SNAP_THRESHOLD,
  buildQrUrl, QR_POSITION_STYLE,
} from "./businessCardTypes";

// ─── Card Preview Component ───────────────────────────────────────────────────
export function CardFace({
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
  const showSecondary = bilingualMode === "dual-side" && side === "back" && secondaryData;
  const displayData = showSecondary ? secondaryData : data;
  const displayDir = showSecondary ? (bilingualDir || "ltr") : "ltr";

  const name    = displayData.name    || "Your Name";
  const title   = displayData.title   || "Job Title";
  const company = displayData.company || "Company Name";
  const initial = name.charAt(0).toUpperCase();

  const showBilingualInline = bilingualMode === "single-card" && side === "front" && secondaryData;
  const secName    = secondaryData?.name    || "";
  const secTitle   = secondaryData?.title   || "";

  const resolvedFontWeight = fontWeight || "800";
  const resolvedFontStyle  = fontStyle  || "normal";
  const resolvedNameSize   = nameFontSize != null ? nameFontSize * scale : 18 * scale;

  const editClick = (field: keyof CardData) => (e: React.MouseEvent) => {
    if (onInlineEdit) {
      e.stopPropagation();
      onInlineEdit(field);
    }
  };
  const editStyle: React.CSSProperties = onInlineEdit ? { cursor: "text", borderBottom: "1px dashed transparent" } : {};

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
        <div style={{
          width: 1, flexShrink: 0,
          background: `repeating-linear-gradient(to bottom, ${primary}80 0px, ${primary}80 5px, transparent 5px, transparent 10px)`,
        }} />
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
        <div style={{
          width: 1, flexShrink: 0,
          background: `repeating-linear-gradient(to bottom, ${primary}80 0px, ${primary}80 5px, transparent 5px, transparent 10px)`,
        }} />
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
export function CardCanvas({
  data, template, backTemplate, primary, secondary, accent, backPrimary, backSecondary, backAccent,
  side, cardShape,
  editLayout, fieldPositions, onFieldMove,
  qrEnabled, qrData, qrSize, qrColor, qrBgColor, qrPosition, qrSide,
  logoUrl, logoSize, logoPos, onLogoMove, aiDesignData,
  fontFamily, fontWeight, fontStyle, nameFontSize,
  bilingualMode, bilingualDir, secondaryData,
  onInlineEdit,
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
  bilingualMode?: BilingualMode; bilingualDir?: "rtl" | "ltr"; secondaryData?: CardData;
  onInlineEdit?: (field: keyof CardData) => void;
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
        bilingualMode={bilingualMode}
        bilingualDir={bilingualDir}
        secondaryData={secondaryData}
        onInlineEdit={onInlineEdit}
      />

      {/* Logo overlay */}
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

      {/* QR Code overlay */}
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
