import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ProfileData, TemplateConfig, LogoPosition, LogoPageMode, PaletteColor } from "./companyProfileTypes";

// ─── A4 Page Wrapper ───────────────────────────────────────────────────────────
export function A4Page({
  cfg, children, pageNum, showPageNum = true,
  logoUrl, logoSize, logoPosition, logoPageMode, showLogo,
  scale,
}: {
  cfg: TemplateConfig;
  children: React.ReactNode;
  pageNum?: number;
  showPageNum?: boolean;
  logoUrl?: string;
  logoSize?: number;
  logoPosition?: LogoPosition;
  logoPageMode?: LogoPageMode;
  showLogo?: boolean;
  scale: number;
}) {
  const px = (n: number) => n * scale;
  const isLuxury = cfg.id === "luxury_black";
  const bg = isLuxury ? "#18181b" : cfg.contentBg;
  const textColor = isLuxury ? "#e4e4e7" : "#111";

  const logoVisible = showLogo && logoUrl && logoPosition;
  const lSize = (logoSize || 60) * scale * 0.7;

  const getLogoStyle = (): React.CSSProperties => {
    if (!logoPosition) return {};
    const base: React.CSSProperties = { position: "absolute", width: lSize, height: lSize, objectFit: "contain" };
    const pad = px(16);
    if (logoPosition === "top-left")     return { ...base, top: pad, left: pad };
    if (logoPosition === "top-center")   return { ...base, top: pad, left: "50%", transform: "translateX(-50%)" };
    if (logoPosition === "top-right")    return { ...base, top: pad, right: pad };
    if (logoPosition === "bottom-left")  return { ...base, bottom: pad, left: pad };
    if (logoPosition === "bottom-right") return { ...base, bottom: pad, right: pad };
    return base;
  };

  return (
    <div style={{
      width: px(595),
      minHeight: px(200),
      background: bg,
      color: textColor,
      position: "relative",
      borderRadius: px(4),
      boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
      overflow: "hidden",
      marginBottom: px(12),
      fontFamily: cfg.id === "premium" ? "Georgia, serif" : "'Helvetica Neue', Arial, sans-serif",
    }}>
      {logoVisible && (
        <img src={logoUrl} alt="logo" style={getLogoStyle()} />
      )}
      {children}
      {showPageNum && pageNum && (
        <div style={{
          position: "absolute", bottom: px(8), right: px(16),
          fontSize: px(7), opacity: 0.4, color: cfg.accent,
          fontFamily: "monospace",
        }}>
          {pageNum}
        </div>
      )}
    </div>
  );
}

// ─── Cover Page ────────────────────────────────────────────────────────────────
export function CoverPage({
  data, cfg, scale, logoUrl, logoSize, logoPosition, logoPageMode,
}: {
  data: ProfileData; cfg: TemplateConfig; scale: number;
  logoUrl?: string; logoSize?: number; logoPosition?: LogoPosition; logoPageMode?: LogoPageMode;
}) {
  const px = (n: number) => n * scale;
  const showLogo = logoUrl && (logoPageMode === "all" || logoPageMode === "cover-only");
  const isCoverLetter = cfg.id === "cover_letter";
  const isCopyright = cfg.id === "copyright";
  const isMagazine = cfg.id === "magazine";
  const isClean = cfg.id === "clean";

  const lightCover = isCoverLetter || isCopyright;
  const lSize = (logoSize || 80) * scale;

  const getInlineLogoStyle = (): React.CSSProperties => {
    return { width: lSize, height: lSize, objectFit: "contain" as const };
  };

  return (
    <div style={{
      width: px(595),
      background: lightCover ? cfg.coverBg : cfg.coverBg,
      color: cfg.coverTextColor,
      position: "relative",
      overflow: "hidden",
      borderRadius: px(4),
      boxShadow: "0 2px 16px rgba(0,0,0,0.18)",
      marginBottom: px(12),
      fontFamily: cfg.id === "premium" ? "Georgia, serif" : "'Helvetica Neue', Arial, sans-serif",
    }}>
      <div style={{ height: px(5), background: cfg.accent, width: "100%" }} />

      {isMagazine && (
        <div style={{ background: "linear-gradient(135deg, #881337, #e11d48)", padding: `${px(60)}px ${px(40)}px ${px(40)}px` }}>
          <p style={{ fontSize: px(7), fontWeight: 800, letterSpacing: px(4), color: "rgba(255,255,255,0.7)", marginBottom: px(8) }}>— COMPANY PROFILE —</p>
          <h1 style={{ fontSize: px(36), fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.1, textTransform: "uppercase" }}>{data.companyName || "Your Company"}</h1>
          {data.tagline && <p style={{ fontSize: px(13), color: "rgba(255,255,255,0.8)", marginTop: px(10), fontStyle: "italic" }}>{data.tagline}</p>}
          {showLogo && logoUrl && (
            <div style={{ marginTop: px(20) }}>
              <img src={logoUrl} alt="logo" style={{ ...getInlineLogoStyle(), maxHeight: px(60) }} />
            </div>
          )}
        </div>
      )}

      {isCoverLetter && (
        <div style={{ padding: `${px(40)}px ${px(50)}px ${px(50)}px` }}>
          {showLogo && logoUrl && <img src={logoUrl} alt="logo" style={{ ...getInlineLogoStyle(), maxHeight: px(70), marginBottom: px(20) }} />}
          <div style={{ borderBottom: `2px solid ${cfg.accent}`, paddingBottom: px(16), marginBottom: px(24) }}>
            <h1 style={{ fontSize: px(22), fontWeight: 800, color: cfg.coverTextColor, margin: 0 }}>{data.companyName || "Company Name"}</h1>
            {data.tagline && <p style={{ fontSize: px(11), color: cfg.accent, marginTop: px(4), fontStyle: "italic" }}>{data.tagline}</p>}
          </div>
          <div style={{ display: "flex", gap: px(40) }}>
            {data.website && <span style={{ fontSize: px(9), color: "#6b7280" }}>{data.website}</span>}
            {data.email && <span style={{ fontSize: px(9), color: "#6b7280" }}>{data.email}</span>}
            {data.phone && <span style={{ fontSize: px(9), color: "#6b7280" }}>{data.phone}</span>}
          </div>
        </div>
      )}

      {isCopyright && (
        <div style={{ padding: `${px(40)}px ${px(50)}px ${px(50)}px` }}>
          {showLogo && logoUrl && <img src={logoUrl} alt="logo" style={{ ...getInlineLogoStyle(), maxHeight: px(70), marginBottom: px(20) }} />}
          <div style={{ borderLeft: `4px solid ${cfg.accent}`, paddingLeft: px(16), marginBottom: px(24) }}>
            <p style={{ fontSize: px(7), fontWeight: 700, letterSpacing: px(2), color: cfg.accent, marginBottom: px(6) }}>OFFICIAL COMPANY DOCUMENT</p>
            <h1 style={{ fontSize: px(24), fontWeight: 800, color: cfg.coverTextColor, margin: 0 }}>{data.companyName || "Company Name"}</h1>
            {data.tagline && <p style={{ fontSize: px(11), color: "#6b7280", marginTop: px(6) }}>{data.tagline}</p>}
          </div>
          <p style={{ fontSize: px(8), color: "#9ca3af", fontStyle: "italic" }}>
            © {new Date().getFullYear()} {data.companyName || "Company Name"}. All rights reserved. This document is confidential and intended solely for the use of the individual or entity to which it is addressed.
          </p>
        </div>
      )}

      {!isCoverLetter && !isCopyright && !isMagazine && (
        <div style={{ padding: `${px(50)}px ${px(40)}px ${px(60)}px` }}>
          {showLogo && logoUrl && logoPosition && (
            <div style={{
              position: "absolute",
              top: logoPosition.includes("bottom") ? "auto" : px(20),
              bottom: logoPosition.includes("bottom") ? px(20) : "auto",
              left: logoPosition.includes("left") ? px(20) : logoPosition.includes("center") ? "50%" : "auto",
              right: logoPosition.includes("right") ? px(20) : "auto",
              transform: logoPosition.includes("center") ? "translateX(-50%)" : "none",
            }}>
              <img src={logoUrl} alt="logo" style={{ width: lSize * 0.85, height: lSize * 0.85, objectFit: "contain", borderRadius: cfg.id === "premium" ? "50%" : px(6) }} />
            </div>
          )}
          <p style={{ fontSize: px(8), fontWeight: 700, letterSpacing: px(3), textTransform: "uppercase", color: cfg.accent, marginBottom: px(12) }}>COMPANY PROFILE</p>
          <h1 style={{ fontSize: px(32), fontWeight: 900, color: isClean ? "#111" : cfg.coverTextColor, margin: 0, lineHeight: 1.15 }}>
            {data.companyName || "Your Company Name"}
          </h1>
          {data.tagline && (
            <p style={{ fontSize: px(13), color: isClean ? "#6b7280" : "rgba(255,255,255,0.78)", marginTop: px(8) }}>{data.tagline}</p>
          )}
          <div style={{ width: px(60), height: px(3), background: cfg.accent, marginTop: px(20) }} />
          {(data.website || data.email) && (
            <div style={{ marginTop: px(30), display: "flex", gap: px(20), flexWrap: "wrap" }}>
              {data.website && <span style={{ fontSize: px(8.5), color: isClean ? "#9ca3af" : "rgba(255,255,255,0.55)" }}>{data.website}</span>}
              {data.email && <span style={{ fontSize: px(8.5), color: isClean ? "#9ca3af" : "rgba(255,255,255,0.55)" }}>{data.email}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Content Section ──────────────────────────────────────────────────────────
export function ContentSection({
  title, children, accent, scale, sectionStyle,
}: {
  title: string; children: React.ReactNode; accent: string; scale: number; sectionStyle: string;
}) {
  const px = (n: number) => n * scale;
  return (
    <div style={{ padding: `${px(20)}px ${px(36)}px`, borderBottom: `1px solid ${accent}18` }}>
      {sectionStyle === "card" && (
        <div style={{ display: "flex", alignItems: "center", gap: px(8), marginBottom: px(12) }}>
          <div style={{ width: px(3), height: px(14), background: accent, borderRadius: px(2) }} />
          <p style={{ fontSize: px(8), fontWeight: 800, textTransform: "uppercase", letterSpacing: px(2), color: accent, margin: 0 }}>{title}</p>
        </div>
      )}
      {sectionStyle === "list" && (
        <p style={{ fontSize: px(8), fontWeight: 700, textTransform: "uppercase", letterSpacing: px(2), color: accent, marginBottom: px(10) }}>{title}</p>
      )}
      {sectionStyle === "underline" && (
        <div style={{ marginBottom: px(12) }}>
          <p style={{ fontSize: px(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: px(1.5), color: accent, margin: 0 }}>{title}</p>
          <div style={{ height: px(1.5), background: accent, marginTop: px(4), opacity: 0.3 }} />
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Multi-Page Preview ───────────────────────────────────────────────────────
export function MultiPagePreview({
  data, cfg, scale, logoUrl, logoSize, logoPosition, logoPageMode,
}: {
  data: ProfileData; cfg: TemplateConfig; scale: number;
  logoUrl?: string; logoSize?: number; logoPosition?: LogoPosition; logoPageMode?: LogoPageMode;
}) {
  const px = (n: number) => n * scale;
  const { accent, sectionStyle } = cfg;
  const isLuxury = cfg.id === "luxury_black";
  const bodyTextColor = isLuxury ? "#d4d4d8" : "#374151";
  const headingColor = isLuxury ? "#e4e4e7" : "#111";
  const showLogoOnContent = logoUrl && (logoPageMode === "all" || logoPageMode === "content-only");

  return (
    <div style={{ fontFamily: cfg.id === "premium" ? "Georgia, serif" : "'Helvetica Neue', Arial, sans-serif" }}>
      <CoverPage data={data} cfg={cfg} scale={scale} logoUrl={logoUrl} logoSize={logoSize} logoPosition={logoPosition} logoPageMode={logoPageMode} />

      {data.aboutUs && (
        <A4Page cfg={cfg} scale={scale} pageNum={2} logoUrl={logoUrl} logoSize={logoSize} logoPosition={logoPosition} logoPageMode={logoPageMode} showLogo={!!showLogoOnContent}>
          <div style={{ height: px(4), background: accent }} />
          <ContentSection title="About Us" accent={accent} scale={scale} sectionStyle={sectionStyle}>
            <p style={{ fontSize: px(9.5), lineHeight: 1.75, color: bodyTextColor }}>{data.aboutUs}</p>
          </ContentSection>
        </A4Page>
      )}

      {data.services.some(s => s.title) && (
        <A4Page cfg={cfg} scale={scale} pageNum={data.aboutUs ? 3 : 2} logoUrl={logoUrl} logoSize={logoSize} logoPosition={logoPosition} logoPageMode={logoPageMode} showLogo={!!showLogoOnContent}>
          <div style={{ height: px(4), background: accent }} />
          <ContentSection title="Our Services" accent={accent} scale={scale} sectionStyle={sectionStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: px(10) }}>
              {data.services.filter(s => s.title).map((s, i) => (
                <div key={i} style={{
                  padding: px(12),
                  background: sectionStyle === "card" ? `${accent}12` : "transparent",
                  borderRadius: sectionStyle === "card" ? px(8) : 0,
                  borderLeft: sectionStyle === "card" ? `3px solid ${accent}` : sectionStyle === "list" ? `2px solid ${accent}40` : "none",
                  borderBottom: sectionStyle === "underline" ? `1px solid ${accent}30` : "none",
                }}>
                  <p style={{ fontSize: px(9), fontWeight: 700, color: accent, marginBottom: px(4) }}>{s.title}</p>
                  {s.description && <p style={{ fontSize: px(8.5), lineHeight: 1.55, color: bodyTextColor, opacity: 0.85 }}>{s.description}</p>}
                </div>
              ))}
            </div>
          </ContentSection>
        </A4Page>
      )}

      {data.team.some(m => m.name) && (
        <A4Page cfg={cfg} scale={scale} pageNum={(data.aboutUs ? 1 : 0) + (data.services.some(s => s.title) ? 1 : 0) + 2} logoUrl={logoUrl} logoSize={logoSize} logoPosition={logoPosition} logoPageMode={logoPageMode} showLogo={!!showLogoOnContent}>
          <div style={{ height: px(4), background: accent }} />
          <ContentSection title="Our Team" accent={accent} scale={scale} sectionStyle={sectionStyle}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: px(16) }}>
              {data.team.filter(m => m.name).map((m, i) => (
                <div key={i} style={{ textAlign: "center", minWidth: px(70) }}>
                  <div style={{
                    width: px(44), height: px(44), borderRadius: "50%",
                    background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: `0 auto ${px(6)}px`,
                    boxShadow: `0 2px 8px ${accent}40`,
                  }}>
                    <span style={{ fontSize: px(16), fontWeight: 700, color: "#fff" }}>{m.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: px(9), fontWeight: 700, color: headingColor }}>{m.name}</p>
                  {m.role && <p style={{ fontSize: px(8), color: bodyTextColor, opacity: 0.65 }}>{m.role}</p>}
                </div>
              ))}
            </div>
          </ContentSection>
        </A4Page>
      )}

      {[data.phone, data.email, data.website, data.address, data.linkedin, data.instagram].some(Boolean) && (
        <A4Page cfg={cfg} scale={scale} pageNum={-1} showPageNum={false} logoUrl={logoUrl} logoSize={logoSize} logoPosition={logoPosition} logoPageMode={logoPageMode} showLogo={!!showLogoOnContent}>
          <div style={{ height: px(4), background: accent }} />
          <ContentSection title="Contact Us" accent={accent} scale={scale} sectionStyle={sectionStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${px(8)}px ${px(24)}px` }}>
              {[
                { label: "Phone", val: data.phone },
                { label: "Email", val: data.email },
                { label: "Website", val: data.website },
                { label: "Address", val: data.address },
                { label: "LinkedIn", val: data.linkedin },
                { label: "Instagram", val: data.instagram },
              ].filter(c => c.val).map(({ label, val }, i) => (
                <div key={i}>
                  <p style={{ fontSize: px(7.5), fontWeight: 700, color: accent, marginBottom: px(2) }}>{label}</p>
                  <p style={{ fontSize: px(8.5), color: bodyTextColor }}>{val}</p>
                </div>
              ))}
            </div>
          </ContentSection>
          <div style={{ background: accent, padding: `${px(12)}px ${px(36)}px`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: px(8), fontWeight: 700, color: "#fff", letterSpacing: px(1) }}>{data.companyName || "Company Name"}</span>
            <span style={{ fontSize: px(7), color: "rgba(255,255,255,0.7)" }}>© {new Date().getFullYear()}</span>
          </div>
        </A4Page>
      )}
    </div>
  );
}

// ─── Color Swatch Editor ───────────────────────────────────────────────────────
export function ColorSwatchEditor({
  color, onUpdate,
}: {
  color: PaletteColor;
  onUpdate: (updated: PaletteColor) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="w-10 h-10 rounded-lg border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer ring-1 ring-[hsl(var(--border))]"
          style={{ background: color.hex }}
          title={`${color.name}: ${color.hex}`}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-3" side="top">
        <p className="text-xs font-bold text-[hsl(var(--foreground))]">{color.name}</p>
        <div className="flex gap-3 items-center">
          <input
            type="color"
            value={color.hex}
            onChange={e => onUpdate({ ...color, hex: e.target.value })}
            className="w-12 h-10 rounded cursor-pointer border border-[hsl(var(--border))]"
          />
          <Input
            value={color.hex}
            onChange={e => {
              const v = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onUpdate({ ...color, hex: v });
            }}
            className="flex-1 text-sm font-mono"
            maxLength={7}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Opacity: {color.opacity}%</Label>
          <Slider
            min={0} max={100} step={1}
            value={[color.opacity]}
            onValueChange={([v]) => onUpdate({ ...color, opacity: v })}
          />
        </div>
        <div className="h-8 rounded-md border border-[hsl(var(--border))]" style={{ background: color.hex, opacity: color.opacity / 100 }} />
      </PopoverContent>
    </Popover>
  );
}
