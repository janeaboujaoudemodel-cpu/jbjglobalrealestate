import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Sparkles, Download, Plus, Trash2,
  LayoutGrid, Loader2, User, Phone, Mail, Globe, MapPin, ImageIcon, ChevronDown,
  Globe2, CheckCircle2, AlertTriangle, Palette, GripHorizontal, ToggleLeft, ToggleRight,
  Layers, Users, FileText,
} from "lucide-react";
import { StudioShell, type StudioSection } from "@/components/ui/StudioShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { BrandAssetLibrary } from "@/components/corporate-suite/BrandAssetLibrary";
import { DocumentExtractorUpload } from "@/components/corporate-suite/DocumentExtractorUpload";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type Template = "premium" | "executive" | "clean" | "corporate_red" | "modern_green" | "luxury_black" | "cover_letter" | "copyright" | "magazine";
type LogoPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-right";
type LogoPageMode = "all" | "cover-only" | "content-only" | "none";

interface Service { title: string; description: string }
interface TeamMember { name: string; role: string }

interface ProfileData {
  companyName: string;
  tagline: string;
  aboutUs: string;
  services: Service[];
  team: TeamMember[];
  phone: string;
  email: string;
  website: string;
  address: string;
  linkedin: string;
  instagram: string;
}

interface PaletteColor {
  hex: string;
  name: string;
  role: "primary" | "secondary" | "accent" | "background" | "text";
  opacity: number;
}

interface TemplateConfig {
  id: Template;
  label: string;
  desc: string;
  accent: string;
  coverBg: string;
  contentBg: string;
  coverTextColor: string;
  sectionStyle: "card" | "list" | "underline";
  emoji?: string;
}

const TEMPLATES: TemplateConfig[] = [
  { id: "premium",       label: "Premium Gold",    desc: "Gold accent, dark cover",      accent: "#C8A766", coverBg: "#0a0a0a", contentBg: "#f9f7f3", coverTextColor: "#ffffff", sectionStyle: "card" },
  { id: "executive",     label: "Executive Blue",  desc: "Navy blue, structured",        accent: "#1e3a8a", coverBg: "#1e3a8a", contentBg: "#ffffff", coverTextColor: "#ffffff", sectionStyle: "list" },
  { id: "clean",         label: "Clean White",     desc: "Minimal, professional",        accent: "#374151", coverBg: "#ffffff", contentBg: "#ffffff", coverTextColor: "#111111", sectionStyle: "underline" },
  { id: "corporate_red", label: "Corporate Red",   desc: "Bold red, high impact",        accent: "#dc2626", coverBg: "#7f1d1d", contentBg: "#ffffff", coverTextColor: "#ffffff", sectionStyle: "card" },
  { id: "modern_green",  label: "Modern Green",    desc: "Forest green, eco & trust",    accent: "#16a34a", coverBg: "#14532d", contentBg: "#f0fdf4", coverTextColor: "#ffffff", sectionStyle: "list" },
  { id: "luxury_black",  label: "Luxury Black",    desc: "All-black, silver accents",    accent: "#a1a1aa", coverBg: "#09090b", contentBg: "#18181b", coverTextColor: "#ffffff", sectionStyle: "underline" },
  { id: "cover_letter",  label: "Cover Letter",    desc: "Formal letter format",         accent: "#1d4ed8", coverBg: "#eff6ff", contentBg: "#ffffff", coverTextColor: "#1e3a8a", sectionStyle: "list" },
  { id: "copyright",     label: "Legal / Copyright", desc: "Official document style",   accent: "#292524", coverBg: "#f5f5f4", contentBg: "#fafaf9", coverTextColor: "#1c1917", sectionStyle: "underline" },
  { id: "magazine",      label: "Magazine Style",  desc: "Editorial, full-bleed hero",   accent: "#e11d48", coverBg: "#881337", contentBg: "#ffffff", coverTextColor: "#ffffff", sectionStyle: "card" },
];

const DEFAULT_PALETTE: PaletteColor[] = [
  { hex: "#1a1a1a", name: "Primary",    role: "primary",    opacity: 100 },
  { hex: "#C8A766", name: "Secondary",  role: "secondary",  opacity: 100 },
  { hex: "#F5F0E6", name: "Accent",     role: "accent",     opacity: 100 },
  { hex: "#ffffff", name: "Background", role: "background", opacity: 100 },
  { hex: "#374151", name: "Text",       role: "text",       opacity: 100 },
];

const EMPTY_SERVICE: Service = { title: "", description: "" };
const EMPTY_MEMBER: TeamMember = { name: "", role: "" };

const LOGO_POSITIONS: { id: LogoPosition; label: string }[] = [
  { id: "top-left",    label: "↖ Top Left"    },
  { id: "top-center",  label: "↑ Top Center"  },
  { id: "top-right",   label: "↗ Top Right"   },
  { id: "bottom-left", label: "↙ Bot Left"    },
  { id: "bottom-right",label: "↘ Bot Right"   },
];

const LOGO_PAGE_MODES: { id: LogoPageMode; label: string }[] = [
  { id: "all",          label: "All Pages"     },
  { id: "cover-only",   label: "Cover Only"    },
  { id: "content-only", label: "Content Pages" },
  { id: "none",         label: "None"          },
];

// ─── Completion Score ──────────────────────────────────────────────────────────
function calcScore(data: ProfileData, logoUrl: string): number {
  let score = 0;
  if (data.companyName)                                             score += 10;
  if (data.tagline)                                                 score += 8;
  const wordCount = data.aboutUs.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 10)                                               score += 8;
  if (wordCount > 50)                                               score += 7;
  if (logoUrl)                                                      score += 10;
  if (data.services.some(s => s.title))                             score += 8;
  if (data.services.some(s => s.description))                       score += 7;
  if (data.services.filter(s => s.title).length >= 3)               score += 5;
  if (data.team.some(m => m.name))                                  score += 8;
  if (data.phone)                                                   score += 5;
  if (data.email)                                                   score += 7;
  if (data.website)                                                 score += 5;
  if (data.address)                                                 score += 5;
  if (data.linkedin)                                                score += 4;
  if (data.instagram)                                               score += 3;
  return score;
}

function getScoreItems(data: ProfileData, logoUrl: string) {
  const wordCount = data.aboutUs.trim().split(/\s+/).filter(Boolean).length;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (data.companyName) strengths.push("Company name provided");
  else weaknesses.push("Add your company name to get started");

  if (data.tagline) strengths.push("Tagline added");
  else weaknesses.push("Add a tagline — it defines your brand in one line");

  if (wordCount > 50) strengths.push("About Us section is detailed");
  else if (wordCount > 10) weaknesses.push("About Us is too short — click AI Expand for a professional paragraph");
  else weaknesses.push("Write an About Us section to tell your story");

  if (logoUrl) strengths.push("Logo uploaded");
  else weaknesses.push("Missing logo — upload in Brand Assets");

  const svcCount = data.services.filter(s => s.title).length;
  if (svcCount >= 3) strengths.push(`${svcCount} services listed`);
  else if (svcCount > 0) weaknesses.push("Add at least 3 services for a full profile");
  else weaknesses.push("Add your services — show what you offer");

  if (data.services.some(s => s.description)) strengths.push("Service descriptions added");
  else if (svcCount > 0) weaknesses.push("Add descriptions to your services — use AI per service");

  if (data.team.some(m => m.name)) strengths.push("Team members added");
  else weaknesses.push("No team members — profiles build trust with clients");

  if (data.email) strengths.push("Email contact provided");
  else weaknesses.push("Missing email address");

  if (data.phone) strengths.push("Phone number added");
  else weaknesses.push("Add a phone number for direct contact");

  if (data.linkedin) strengths.push("LinkedIn profile linked");
  else weaknesses.push("Missing LinkedIn — add for professional credibility");

  if (data.website) strengths.push("Website URL added");
  if (data.address) strengths.push("Address provided");
  if (data.instagram) strengths.push("Instagram linked");

  return { strengths, weaknesses };
}

// ─── A4 Page Wrapper ───────────────────────────────────────────────────────────
function A4Page({
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
  const bg = cfg.id === "luxury_black" ? "#18181b" : cfg.contentBg;
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
function CoverPage({
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
  const isLuxury = cfg.id === "luxury_black";

  // Cover letter / copyright — light cover
  const lightCover = isCoverLetter || isCopyright;

  const lSize = (logoSize || 80) * scale;

  // Logo position for cover (when NOT using the A4Page wrapper's logo logic)
  const getInlineLogoStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { width: lSize, height: lSize, objectFit: "contain" as const };
    return base;
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
      {/* Accent top bar */}
      <div style={{ height: px(5), background: cfg.accent, width: "100%" }} />

      {/* Magazine hero strip */}
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

      {/* Cover Letter format */}
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

      {/* Legal / Copyright */}
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

      {/* Standard cover (premium, executive, clean, corporate_red, modern_green, luxury_black) */}
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

// ─── Content Page ──────────────────────────────────────────────────────────────
function ContentSection({
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

function MultiPagePreview({
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
      {/* Page 1: Cover */}
      <CoverPage
        data={data} cfg={cfg} scale={scale}
        logoUrl={logoUrl} logoSize={logoSize}
        logoPosition={logoPosition} logoPageMode={logoPageMode}
      />

      {/* Page 2: About Us */}
      {data.aboutUs && (
        <A4Page cfg={cfg} scale={scale} pageNum={2}
          logoUrl={logoUrl} logoSize={logoSize}
          logoPosition={logoPosition} logoPageMode={logoPageMode}
          showLogo={!!showLogoOnContent}
        >
          <div style={{ height: px(4), background: accent }} />
          <ContentSection title="About Us" accent={accent} scale={scale} sectionStyle={sectionStyle}>
            <p style={{ fontSize: px(9.5), lineHeight: 1.75, color: bodyTextColor }}>{data.aboutUs}</p>
          </ContentSection>
        </A4Page>
      )}

      {/* Page 3: Services */}
      {data.services.some(s => s.title) && (
        <A4Page cfg={cfg} scale={scale} pageNum={data.aboutUs ? 3 : 2}
          logoUrl={logoUrl} logoSize={logoSize}
          logoPosition={logoPosition} logoPageMode={logoPageMode}
          showLogo={!!showLogoOnContent}
        >
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

      {/* Page 4: Team */}
      {data.team.some(m => m.name) && (
        <A4Page cfg={cfg} scale={scale} pageNum={(data.aboutUs ? 1 : 0) + (data.services.some(s => s.title) ? 1 : 0) + 2}
          logoUrl={logoUrl} logoSize={logoSize}
          logoPosition={logoPosition} logoPageMode={logoPageMode}
          showLogo={!!showLogoOnContent}
        >
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

      {/* Page 5: Contact */}
      {[data.phone, data.email, data.website, data.address, data.linkedin, data.instagram].some(Boolean) && (
        <A4Page cfg={cfg} scale={scale} pageNum={-1} showPageNum={false}
          logoUrl={logoUrl} logoSize={logoSize}
          logoPosition={logoPosition} logoPageMode={logoPageMode}
          showLogo={!!showLogoOnContent}
        >
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
          {/* Footer bar */}
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
function ColorSwatchEditor({
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CompanyProfileBuilder() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("company");
  const [template, setTemplate] = useState<Template>("premium");
  const [generating, setGenerating] = useState(false);
  const [expandingIdx, setExpandingIdx] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"company" | "services" | "team" | "contact">("company");
  const [brandAssetOpen, setBrandAssetOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSize, setLogoSize] = useState(80);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("top-right");
  const [logoPageMode, setLogoPageMode] = useState<LogoPageMode>("all");
  const [urlInput, setUrlInput] = useState("");
  const [extractingUrl, setExtractingUrl] = useState(false);
  const [extractStep, setExtractStep] = useState("");
  const [deepScan, setDeepScan] = useState(false);
  const [palette, setPalette] = useState<PaletteColor[]>(DEFAULT_PALETTE);
  const dragIdx = useRef<number | null>(null);

  const [data, setData] = useState<ProfileData>({
    companyName: "", tagline: "", aboutUs: "",
    services: [{ ...EMPTY_SERVICE }, { ...EMPTY_SERVICE }],
    team: [{ ...EMPTY_MEMBER }],
    phone: "", email: "", website: "", address: "", linkedin: "", instagram: "",
  });

  const set = <K extends keyof ProfileData>(k: K, v: ProfileData[K]) =>
    setData(prev => ({ ...prev, [k]: v }));

  // ── Completion score ──────────────────────────────────────────────────────
  const score = calcScore(data, logoUrl);
  const { strengths, weaknesses } = getScoreItems(data, logoUrl);

  // ── Document Extractor handler ─────────────────────────────────────────────
  const handleExtracted = useCallback((extracted: Record<string, unknown>) => {
    setData(prev => ({
      ...prev,
      companyName: extracted.companyName ? String(extracted.companyName) : prev.companyName,
      tagline:     extracted.tagline     ? String(extracted.tagline)     : prev.tagline,
      aboutUs:     extracted.aboutUs     ? String(extracted.aboutUs)     : prev.aboutUs,
      phone:       extracted.phone       ? String(extracted.phone)       : prev.phone,
      email:       extracted.email       ? String(extracted.email)       : prev.email,
      website:     extracted.website     ? String(extracted.website)     : prev.website,
      address:     extracted.address     ? String(extracted.address)     : prev.address,
      linkedin:    extracted.linkedin    ? String(extracted.linkedin)    : prev.linkedin,
      instagram:   extracted.instagram   ? String(extracted.instagram)   : prev.instagram,
      services: Array.isArray(extracted.services) && extracted.services.length
        ? (extracted.services as Record<string, unknown>[]).map(s => ({ title: String(s.title ?? ""), description: String(s.description ?? "") }))
        : prev.services,
      team: Array.isArray(extracted.team) && extracted.team.length
        ? (extracted.team as Record<string, unknown>[]).map(m => ({ name: String(m.name ?? ""), role: String(m.role ?? "") }))
        : prev.team,
    }));
    toast.success("Fields pre-filled from uploaded document!");
  }, []);

  // ── Smart URL Extraction ───────────────────────────────────────────────────
  const extractFromUrl = useCallback(async () => {
    if (!urlInput.trim()) { toast.error("Enter a website URL first"); return; }
    setExtractingUrl(true);
    setExtractStep("Scanning website…");
    try {
      let markdown = "";
      let brandColors: Record<string, string> | null = null;

      if (deepScan) {
        // Deep scan: map site → scrape multiple pages
        setExtractStep("Mapping website pages…");
        const { data: mapData } = await supabase.functions.invoke("firecrawl-map", {
          body: { url: urlInput.trim(), options: { limit: 20 } },
        });

        const allLinks: string[] = mapData?.links || [];
        // Prioritize key pages
        const keywords = ["about", "service", "team", "contact", "who-we-are", "what-we-do"];
        const prioritized = allLinks.filter(l =>
          keywords.some(k => l.toLowerCase().includes(k))
        ).slice(0, 4);
        const pagesToScrape = [urlInput.trim(), ...prioritized].slice(0, 5);

        setExtractStep(`Scraping ${pagesToScrape.length} pages…`);
        const markdownParts: string[] = [];

        for (const pageUrl of pagesToScrape) {
          const { data: sd } = await supabase.functions.invoke("firecrawl-scrape", {
            body: { url: pageUrl, options: { formats: ["markdown", "branding"], onlyMainContent: true, waitFor: 2000, timeout: 25000 } },
          });
          if (sd?.data?.markdown) markdownParts.push(`\n\n## [${pageUrl}]\n${sd.data.markdown}`);
          else if (sd?.markdown) markdownParts.push(`\n\n## [${pageUrl}]\n${sd.markdown}`);
          // Extract brand colors from first page
          if (!brandColors) {
            const bc = sd?.data?.branding?.colors || sd?.branding?.colors;
            if (bc && typeof bc === "object") {
              brandColors = bc as Record<string, string>;
            }
          }
        }
        markdown = markdownParts.join("\n").slice(0, 12000);
      } else {
        // Quick scan: single page
        setExtractStep("Fetching page content…");
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke("firecrawl-scrape", {
          body: { url: urlInput.trim(), options: { formats: ["markdown", "branding"], onlyMainContent: true, waitFor: 3000, timeout: 30000 } },
        });

        if (!scrapeError && scrapeData?.success !== false) {
          markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
          // Try all possible paths for branding colors
          const bc = scrapeData?.data?.branding?.colors
            || scrapeData?.branding?.colors
            || scrapeData?.data?.branding
            || null;
          if (bc && typeof bc === "object" && (bc.primary || bc.secondary || bc.accent || bc.background)) {
            brandColors = bc as Record<string, string>;
          }
        } else {
          toast.info("Firecrawl not connected — extracting via AI only. Connect Firecrawl for brand colors.");
        }
      }

      // AI extraction
      setExtractStep("Extracting company details with AI…");
      const { data: aiRes, error: aiErr } = await supabase.functions.invoke("company-profile-ai", {
        body: { action: "extract_from_url", markdown, url: urlInput.trim() },
      });
      if (aiErr) throw aiErr;
      if (aiRes?.error) throw new Error(aiRes.error);

      let extracted: Record<string, unknown> = {};
      try {
        const raw = aiRes?.content || "{}";
        const cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
        extracted = JSON.parse(cleaned);
      } catch {
        toast.error("AI returned unexpected format — please try again");
        return;
      }

      // Fill data
      setExtractStep("Applying extracted information…");
      setData(prev => ({
        ...prev,
        companyName: extracted.companyName ? String(extracted.companyName) : prev.companyName,
        tagline:     extracted.tagline     ? String(extracted.tagline)     : prev.tagline,
        aboutUs:     extracted.aboutUs     ? String(extracted.aboutUs)     : prev.aboutUs,
        phone:       extracted.phone       ? String(extracted.phone)       : prev.phone,
        email:       extracted.email       ? String(extracted.email)       : prev.email,
        website:     extracted.website     ? String(extracted.website)     : (urlInput.trim() || prev.website),
        address:     extracted.address     ? String(extracted.address)     : prev.address,
        linkedin:    extracted.linkedin    ? String(extracted.linkedin)    : prev.linkedin,
        instagram:   extracted.instagram   ? String(extracted.instagram)   : prev.instagram,
        services: Array.isArray(extracted.services) && extracted.services.length
          ? (extracted.services as Record<string, unknown>[]).map(s => ({ title: String(s.title ?? ""), description: String(s.description ?? "") }))
          : prev.services,
        team: Array.isArray(extracted.team) && extracted.team.length
          ? (extracted.team as Record<string, unknown>[]).map(m => ({ name: String(m.name ?? ""), role: String(m.role ?? "") }))
          : prev.team,
      }));

      // Apply brand colors if found
      if (brandColors) {
        setExtractStep("Applying brand colors…");
        const mapColor = (val: unknown, fallback: string) => {
          if (typeof val === "string" && /^#[0-9A-Fa-f]{6}$/.test(val)) return val;
          return fallback;
        };
        const newPalette: PaletteColor[] = [
          { hex: mapColor(brandColors.primary,     "#1a1a1a"), name: "Primary",    role: "primary",    opacity: 100 },
          { hex: mapColor(brandColors.secondary,   "#666666"), name: "Secondary",  role: "secondary",  opacity: 100 },
          { hex: mapColor(brandColors.accent,      "#C8A766"), name: "Accent",     role: "accent",     opacity: 100 },
          { hex: mapColor(brandColors.background,  "#ffffff"), name: "Background", role: "background", opacity: 100 },
          { hex: mapColor(brandColors.textPrimary, "#374151"), name: "Text",       role: "text",       opacity: 100 },
        ];
        setPalette(newPalette);
        setPaletteOpen(true);
        toast.success("Brand colors extracted and saved to your palette!");
      }

      toast.success(deepScan ? "Deep scan complete! Profile extracted from multiple pages." : "Company profile extracted from website!");
      setScoreOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Extraction failed";
      toast.error(msg);
    } finally {
      setExtractingUrl(false);
      setExtractStep("");
    }
  }, [urlInput, deepScan]);

  // ── Palette drag-and-drop ─────────────────────────────────────────────────
  const handleDragStart = (idx: number) => { dragIdx.current = idx; };
  const handleDrop = (targetIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return;
    const newPalette = [...palette];
    const dragged = newPalette[dragIdx.current];
    const target  = newPalette[targetIdx];
    newPalette[dragIdx.current] = { ...dragged, hex: target.hex, opacity: target.opacity };
    newPalette[targetIdx]       = { ...target,  hex: dragged.hex, opacity: dragged.opacity };
    setPalette(newPalette);
    dragIdx.current = null;
  };

  // ── Save palette to DB ────────────────────────────────────────────────────
  const savePalette = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in to save palette"); return; }
    const name = `Website Palette${data.companyName ? ` — ${data.companyName}` : ""}`;
    const { error } = await supabase.from("design_color_palettes" as any).upsert({
      user_id: user.id,
      name,
      colors: palette.map(c => ({ hex: c.hex, name: c.name, role: c.role, opacity: c.opacity })),
      is_default: false,
      is_public: false,
    }, { onConflict: "user_id,name" });
    if (error) { toast.error("Failed to save palette"); return; }
    toast.success("Brand palette saved!");
  }, [palette, data.companyName]);

  // ── AI: Expand About Us ────────────────────────────────────────────────────
  const expandAbout = useCallback(async () => {
    if (!data.companyName) { toast.error("Enter company name first"); return; }
    setGenerating(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("company-profile-ai", {
        body: { action: "expand_about", companyName: data.companyName, tagline: data.tagline, draft: data.aboutUs },
      });
      if (error) throw error;
      if (res?.error) throw new Error(res.error);
      if (res?.content) { set("aboutUs", res.content); toast.success("About Us expanded by AI!"); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI expansion failed");
    } finally { setGenerating(false); }
  }, [data.companyName, data.tagline, data.aboutUs]);

  // ── AI: Expand Service ────────────────────────────────────────────────────
  const expandService = useCallback(async (idx: number) => {
    const svc = data.services[idx];
    if (!svc.title) { toast.error("Enter service title first"); return; }
    setExpandingIdx(idx);
    try {
      const { data: res, error } = await supabase.functions.invoke("company-profile-ai", {
        body: { action: "expand_service", companyName: data.companyName, serviceTitle: svc.title },
      });
      if (error) throw error;
      if (res?.error) throw new Error(res.error);
      if (res?.content) {
        const updated = [...data.services];
        updated[idx] = { ...updated[idx], description: res.content };
        set("services", updated);
        toast.success("Service description generated!");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI expansion failed");
    } finally { setExpandingIdx(null); }
  }, [data.services, data.companyName]);

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const exportPDF = useCallback(async () => {
    if (!data.companyName) { toast.error("Enter company name first"); return; }
    setExporting(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const cfg = TEMPLATES.find(t => t.id === template)!;
      const W = 595, H = 842;
      const pdfDoc = await PDFDocument.create();
      const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      function hexToRgb(h: string) {
        const c = (h || "#000000").replace("#", "").padEnd(6, "0");
        return rgb(parseInt(c.slice(0, 2), 16) / 255, parseInt(c.slice(2, 4), 16) / 255, parseInt(c.slice(4, 6), 16) / 255);
      }

      const ac       = hexToRgb(cfg.accent);
      const white    = rgb(1, 1, 1);
      const dark     = rgb(0.05, 0.05, 0.05);
      const bodyGray = rgb(0.25, 0.25, 0.25);
      const lightGray = rgb(0.45, 0.45, 0.45);
      const coverBgRgb = hexToRgb(cfg.coverBg);
      const contentBgRgb = hexToRgb(cfg.contentBg);
      const isClean = template === "clean" || template === "cover_letter" || template === "copyright";
      const isPremium = template === "premium";
      const coverTextIsLight = cfg.coverTextColor === "#ffffff";

      let embeddedLogo: any = null;
      if (logoUrl) {
        try {
          if (logoUrl.startsWith("data:image/png")) {
            const bytes = Uint8Array.from(atob(logoUrl.split(",")[1]), c => c.charCodeAt(0));
            embeddedLogo = await pdfDoc.embedPng(bytes);
          } else if (logoUrl.startsWith("data:image/jpeg") || logoUrl.startsWith("data:image/jpg")) {
            const bytes = Uint8Array.from(atob(logoUrl.split(",")[1]), c => c.charCodeAt(0));
            embeddedLogo = await pdfDoc.embedJpg(bytes);
          } else if (logoUrl.startsWith("http")) {
            const res = await fetch(logoUrl);
            const buf = await res.arrayBuffer();
            embeddedLogo = res.headers.get("content-type")?.includes("png")
              ? await pdfDoc.embedPng(new Uint8Array(buf))
              : await pdfDoc.embedJpg(new Uint8Array(buf));
          }
        } catch { /* logo embed failed silently */ }
      }

      // Helper: draw logo on a page respecting position setting
      function drawLogo(page: any, size: number, isContent = false) {
        if (!embeddedLogo) return;
        const lSize = Math.min(size, isContent ? 60 : 90);
        const pad = 40;
        let x = W - lSize - pad;
        let y2 = H - lSize - pad;
        if (logoPosition === "top-left")     { x = pad;            y2 = H - lSize - pad; }
        if (logoPosition === "top-center")   { x = W/2 - lSize/2;  y2 = H - lSize - pad; }
        if (logoPosition === "top-right")    { x = W - lSize - pad; y2 = H - lSize - pad; }
        if (logoPosition === "bottom-left")  { x = pad;            y2 = pad; }
        if (logoPosition === "bottom-right") { x = W - lSize - pad; y2 = pad; }
        page.drawImage(embeddedLogo, { x, y: y2, width: lSize, height: lSize });
      }

      // ─ Cover Page ─
      const cover = pdfDoc.addPage([W, H]);
      cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: coverBgRgb });
      cover.drawRectangle({ x: 0, y: H - 5, width: W, height: 5, color: ac });
      const showLogoOnCover = embeddedLogo && (logoPageMode === "all" || logoPageMode === "cover-only");
      if (showLogoOnCover) drawLogo(cover, logoSize);
      const coverTextColor = coverTextIsLight ? white : dark;
      cover.drawText("COMPANY PROFILE", { x: 50, y: H - 90, size: 8, font: bold, color: ac });
      cover.drawText(data.companyName.slice(0, 40), { x: 50, y: H - 145, size: 30, font: bold, color: coverTextColor });
      if (data.tagline) cover.drawText(data.tagline.slice(0, 60), { x: 50, y: H - 178, size: 12, font: regular, color: coverTextIsLight ? rgb(0.8, 0.8, 0.8) : lightGray });
      cover.drawLine({ start: { x: 50, y: H - 200 }, end: { x: 250, y: H - 200 }, thickness: 2, color: ac });
      if (data.website) cover.drawText(data.website, { x: 50, y: 50, size: 8, font: regular, color: coverTextIsLight ? rgb(0.6, 0.6, 0.6) : lightGray });

      // ─ Content Pages ─
      let currentPage = pdfDoc.addPage([W, H]);
      currentPage.drawRectangle({ x: 0, y: 0, width: W, height: H, color: contentBgRgb });
      currentPage.drawRectangle({ x: 0, y: H - 4, width: W, height: 4, color: ac });
      let y = H - 60;

      const showLogoOnContent = embeddedLogo && (logoPageMode === "all" || logoPageMode === "content-only");
      if (showLogoOnContent) drawLogo(currentPage, logoSize, true);

      function ensureSpace(needed: number) {
        if (y - needed < 60) {
          currentPage = pdfDoc.addPage([W, H]);
          currentPage.drawRectangle({ x: 0, y: 0, width: W, height: H, color: contentBgRgb });
          currentPage.drawRectangle({ x: 0, y: H - 4, width: W, height: 4, color: ac });
          if (showLogoOnContent) drawLogo(currentPage, logoSize, true);
          y = H - 60;
        }
      }
      function drawSectionHeader(title: string) {
        ensureSpace(30);
        currentPage.drawText(title.toUpperCase(), { x: 50, y: y + 5, size: 8, font: bold, color: ac });
        currentPage.drawLine({ start: { x: 50, y: y - 2 }, end: { x: W - 50, y: y - 2 }, thickness: 0.75, color: ac, opacity: 0.25 });
        y -= 22;
      }
      function drawWrappedText(text: string, xOffset = 50, maxWidth = W - 100, fontSize = 9, color = bodyGray, lineH = 14) {
        const words = text.split(" ");
        let line = "";
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          const w = regular.widthOfTextAtSize(test, fontSize);
          if (w > maxWidth && line) {
            ensureSpace(lineH + 4);
            currentPage.drawText(line, { x: xOffset, y, size: fontSize, font: regular, color });
            y -= lineH; line = word;
          } else { line = test; }
        }
        if (line) { ensureSpace(lineH + 4); currentPage.drawText(line, { x: xOffset, y, size: fontSize, font: regular, color }); y -= lineH; }
        y -= 6;
      }

      if (data.aboutUs) { drawSectionHeader("About Us"); drawWrappedText(data.aboutUs); y -= 10; }
      const activeServices = data.services.filter(s => s.title);
      if (activeServices.length) {
        drawSectionHeader("Our Services");
        activeServices.forEach((s, i) => {
          const bullet = isPremium ? "◆" : `${i + 1}.`;
          ensureSpace(18);
          currentPage.drawText(`${bullet} ${s.title}`, { x: 50, y, size: 10, font: bold, color: dark });
          y -= 15;
          if (s.description) { drawWrappedText(s.description, 62, W - 112, 9, lightGray, 13); }
          y -= 4;
        });
        y -= 6;
      }
      const activeTeam = data.team.filter(m => m.name);
      if (activeTeam.length) {
        drawSectionHeader("Our Team");
        activeTeam.forEach(m => {
          ensureSpace(16);
          currentPage.drawText(m.role ? `${m.name}  —  ${m.role}` : m.name, { x: 50, y, size: 9, font: regular, color: dark });
          y -= 15;
        });
        y -= 6;
      }
      const contacts = [
        { label: "Phone", val: data.phone }, { label: "Email", val: data.email },
        { label: "Website", val: data.website }, { label: "Address", val: data.address },
        { label: "LinkedIn", val: data.linkedin }, { label: "Instagram", val: data.instagram },
      ].filter(c => c.val);
      if (contacts.length) {
        drawSectionHeader("Contact Us");
        contacts.forEach(({ label, val }) => {
          ensureSpace(16);
          currentPage.drawText(`${label}:`, { x: 50, y, size: 8.5, font: bold, color: ac });
          currentPage.drawText(val.slice(0, 70), { x: 120, y, size: 8.5, font: regular, color: bodyGray });
          y -= 15;
        });
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `${data.companyName.replace(/\s+/g, "-")}-profile.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Company profile PDF exported!");
    } catch (err) { console.error(err); toast.error("PDF export failed"); }
    finally { setExporting(false); }
  }, [data, template, logoUrl, logoSize, logoPosition, logoPageMode]);

  const TABS = [
    { id: "company",  label: "Company"  },
    { id: "services", label: "Services" },
    { id: "team",     label: "Team"     },
    { id: "contact",  label: "Contact"  },
  ] as const;

  const scoreColor = score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-500";
  const progressColor = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-400";
  const cfg = TEMPLATES.find(t => t.id === template)!;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/toolkit/corporate-suite")} className="gap-1.5">
              <ArrowLeft size={15} /> Back
            </Button>
            <div className="w-px h-5 bg-[hsl(var(--border))]" />
            <div className="flex items-center gap-2">
              <LayoutGrid size={11} className="text-[hsl(var(--muted-foreground))]" />
              <ChevronRight size={10} className="text-[hsl(var(--muted-foreground))]" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Corporate Suite</span>
              <ChevronRight size={10} className="text-[hsl(var(--muted-foreground))]" />
              <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Company Profile</span>
            </div>
          </div>
          <Button
            onClick={exportPDF}
            disabled={exporting || !data.companyName}
            className="gap-2 bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.85)] text-black font-semibold text-sm"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? "Exporting…" : "Export PDF"}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-8 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
        {/* ── Left: Editor ── */}
        <div className="space-y-4">

          {/* ── URL Extraction Panel ── */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden hover:border-[hsl(var(--gold))] transition-colors">
            <div className="flex items-center gap-2 p-4 border-b border-[hsl(var(--border))]">
              <Globe2 size={13} className="text-[hsl(var(--gold))]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Generate from Website</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="flex-1 text-sm"
                  onKeyDown={e => e.key === "Enter" && !extractingUrl && extractFromUrl()}
                  disabled={extractingUrl}
                />
                <Button
                  onClick={extractFromUrl}
                  disabled={extractingUrl || !urlInput.trim()}
                  className="gap-1.5 bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.85)] text-black text-xs font-semibold shrink-0"
                >
                  {extractingUrl ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {extractingUrl ? "Extracting…" : "Extract"}
                </Button>
              </div>
              {/* Deep Scan Toggle */}
              <button
                onClick={() => setDeepScan(d => !d)}
                className="flex items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                disabled={extractingUrl}
              >
                {deepScan
                  ? <ToggleRight size={16} className="text-[hsl(var(--gold))]" />
                  : <ToggleLeft size={16} />
                }
                <span>{deepScan ? "Deep Scan ON — crawling up to 5 pages" : "Deep Scan — crawl multiple pages for richer content"}</span>
              </button>
              {extractingUrl && extractStep && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                    <div className="h-full bg-[hsl(var(--gold))] rounded-full animate-pulse w-2/3" />
                  </div>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] shrink-0">{extractStep}</span>
                </div>
              )}
            </div>
          </div>

          {/* Document Extractor */}
          <DocumentExtractorUpload
            extractionType="company_profile"
            onExtracted={handleExtracted}
            label="Scan Existing Brochure"
            hint="Upload a company brochure or PDF to pre-fill all fields with AI"
          />

          {/* Brand Assets */}
          <Collapsible open={brandAssetOpen} onOpenChange={setBrandAssetOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden transition-colors hover:border-[hsl(var(--gold))]">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Brand Assets</span>
                    {logoUrl && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
                  </div>
                  <ChevronDown size={13} className={cn("text-[hsl(var(--muted-foreground))] transition-transform", brandAssetOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-4 pt-4">
                  <BrandAssetLibrary
                    assetTypes={["monogram", "logo"]}
                    selectedUrl={logoUrl}
                    onSelect={asset => setLogoUrl(asset.file_url)}
                    showSizeControl sizeValue={logoSize} onSizeChange={setLogoSize}
                    sizeLabel="Logo Size" sizeMin={40} sizeMax={160}
                  />
                  {logoUrl && (
                    <div className="space-y-3 pt-2 border-t border-[hsl(var(--border))]">
                      {/* Logo Position */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Logo Position</Label>
                        <div className="grid grid-cols-5 gap-1">
                          {LOGO_POSITIONS.map(pos => (
                            <button
                              key={pos.id}
                              onClick={() => setLogoPosition(pos.id)}
                              className={cn(
                                "py-1.5 px-1 rounded-lg text-[8px] font-medium transition-all border text-center leading-tight",
                                logoPosition === pos.id
                                  ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]"
                                  : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                              )}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Logo Page Mode */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Apply Logo To</Label>
                        <div className="grid grid-cols-4 gap-1">
                          {LOGO_PAGE_MODES.map(mode => (
                            <button
                              key={mode.id}
                              onClick={() => setLogoPageMode(mode.id)}
                              className={cn(
                                "py-1.5 px-1 rounded-lg text-[8px] font-medium transition-all border text-center leading-tight",
                                logoPageMode === mode.id
                                  ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]"
                                  : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                              )}
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* ── Brand Color Palette ── */}
          <Collapsible open={paletteOpen} onOpenChange={setPaletteOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden transition-colors hover:border-[hsl(var(--gold))]">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <Palette size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Brand Color Palette</span>
                  </div>
                  <ChevronDown size={13} className={cn("text-[hsl(var(--muted-foreground))] transition-transform", paletteOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-4 pt-4">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Drag swatches to swap roles. Click any swatch to change color or opacity.</p>
                  <div className="flex gap-3 justify-between">
                    {palette.map((color, idx) => (
                      <div
                        key={color.role}
                        className="flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => handleDrop(idx)}
                      >
                        <GripHorizontal size={10} className="text-[hsl(var(--muted-foreground))]" />
                        <ColorSwatchEditor
                          color={color}
                          onUpdate={updated => {
                            const np = [...palette];
                            np[idx] = updated;
                            setPalette(np);
                          }}
                        />
                        <span className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] text-center leading-tight">{color.name}</span>
                        <span className="text-[8px] text-[hsl(var(--muted-foreground)/0.7)] font-mono">{color.hex}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={savePalette} className="flex-1 text-xs gap-1.5">
                      <Palette size={11} /> Save Palette
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPalette(DEFAULT_PALETTE)} className="text-xs text-[hsl(var(--muted-foreground))]">
                      Reset
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Template picker — horizontal scroll gallery */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-4 space-y-3 shadow-sm">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Template</h3>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    "flex-shrink-0 p-2.5 rounded-xl border-2 text-center transition-all w-[90px]",
                    template === t.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]"
                  )}
                >
                  <div className="w-full h-5 rounded mb-1.5 border border-white/40 shadow-sm" style={{ background: `linear-gradient(135deg, ${t.coverBg}, ${t.accent})` }} />
                  <p className="text-[8px] font-bold text-[hsl(var(--foreground))] leading-tight">{t.label}</p>
                  <p className="text-[7px] text-[hsl(var(--muted-foreground))] mt-0.5 leading-tight">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex bg-[hsl(var(--muted))] rounded-xl p-1 gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                  activeTab === tab.id ? "bg-white shadow-sm text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-4 shadow-sm">
            {/* Company tab */}
            {activeTab === "company" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Company Name *</Label>
                  <Input value={data.companyName} onChange={e => set("companyName", e.target.value)} placeholder="Your company name" className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tagline</Label>
                  <div className="flex gap-2">
                    <Input value={data.tagline} onChange={e => set("tagline", e.target.value)} placeholder="e.g. Building trust since 2010" className="flex-1 text-sm" />
                    <VoiceInputButton onTranscript={t => set("tagline", t)} size="icon" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">About Us</Label>
                    <Button variant="ghost" size="sm" onClick={expandAbout} disabled={generating} className="h-6 text-[10px] gap-1 text-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                      {generating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      AI Expand
                    </Button>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Textarea value={data.aboutUs} onChange={e => set("aboutUs", e.target.value)} placeholder="Describe your company, mission, and values…" rows={5} className="flex-1 text-sm resize-none" />
                    <VoiceInputButton onTranscript={t => set("aboutUs", data.aboutUs ? data.aboutUs + " " + t : t)} size="icon" className="mt-0.5" />
                  </div>
                </div>
              </>
            )}

            {/* Services tab */}
            {activeTab === "services" && (
              <div className="space-y-4">
                {data.services.map((svc, i) => (
                  <div key={i} className="space-y-2 p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Service {i + 1}</p>
                      <button onClick={() => set("services", data.services.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                    </div>
                    <Input value={svc.title} onChange={e => { const s = [...data.services]; s[i] = { ...s[i], title: e.target.value }; set("services", s); }} placeholder="e.g. Property Consulting" className="text-sm" />
                    <div className="flex gap-2 items-start">
                      <Textarea value={svc.description} onChange={e => { const s = [...data.services]; s[i] = { ...s[i], description: e.target.value }; set("services", s); }} placeholder="Brief description of the service…" rows={2} className="flex-1 text-sm resize-none" />
                      <div className="flex flex-col gap-1">
                        <VoiceInputButton onTranscript={t => { const s = [...data.services]; s[i] = { ...s[i], description: t }; set("services", s); }} size="icon" />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--gold))]" onClick={() => expandService(i)} disabled={expandingIdx !== null} title="Generate description with AI">
                          {expandingIdx === i ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => set("services", [...data.services, { ...EMPTY_SERVICE }])} className="w-full gap-1.5 text-xs">
                  <Plus size={13} /> Add Service
                </Button>
              </div>
            )}

            {/* Team tab */}
            {activeTab === "team" && (
              <div className="space-y-3">
                {data.team.map((m, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="w-7 h-7 rounded-full bg-[hsl(var(--gold)/0.15)] flex items-center justify-center shrink-0"><User size={13} className="text-[hsl(var(--gold))]" /></div>
                    <Input value={m.name} onChange={e => { const t = [...data.team]; t[i] = { ...t[i], name: e.target.value }; set("team", t); }} placeholder="Full Name" className="flex-1 text-sm" />
                    <Input value={m.role} onChange={e => { const t = [...data.team]; t[i] = { ...t[i], role: e.target.value }; set("team", t); }} placeholder="Role / Title" className="flex-1 text-sm" />
                    <button onClick={() => set("team", data.team.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 size={13} /></button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => set("team", [...data.team, { ...EMPTY_MEMBER }])} className="w-full gap-1.5 text-xs">
                  <Plus size={13} /> Add Team Member
                </Button>
              </div>
            )}

            {/* Contact tab */}
            {activeTab === "contact" && (
              <div className="space-y-3">
                {[
                  { key: "phone"     as const, label: "Phone",     placeholder: "+1 (555) 000-0000",          icon: Phone  },
                  { key: "email"     as const, label: "Email",     placeholder: "info@yourcompany.com",       icon: Mail   },
                  { key: "website"   as const, label: "Website",   placeholder: "https://www.yourcompany.com",icon: Globe  },
                  { key: "address"   as const, label: "Address",   placeholder: "City, Country",              icon: MapPin },
                  { key: "linkedin"  as const, label: "LinkedIn",  placeholder: "linkedin.com/company/…",     icon: Globe  },
                  { key: "instagram" as const, label: "Instagram", placeholder: "@yourcompany",                icon: Globe  },
                ].map(({ key, label, placeholder, icon: Icon }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs flex items-center gap-1.5"><Icon size={11} />{label}</Label>
                    <div className="flex gap-2">
                      <Input value={data[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} className="flex-1 text-sm" />
                      <VoiceInputButton onTranscript={t => set(key, t)} size="icon" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Score + Preview ── */}
        <div className="space-y-4">

          {/* ── Completion Score Panel ── */}
          <Collapsible open={scoreOpen} onOpenChange={setScoreOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.4)] transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Profile Score</span>
                    <div className="flex-1 h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden mx-2">
                      <div className={cn("h-full rounded-full transition-all duration-500", progressColor)} style={{ width: `${score}%` }} />
                    </div>
                    <span className={cn("text-sm font-bold tabular-nums", scoreColor)}>{score}%</span>
                  </div>
                  <ChevronDown size={13} className={cn("text-[hsl(var(--muted-foreground))] transition-transform ml-3", scoreOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] pt-3 space-y-2 max-h-56 overflow-y-auto">
                  {strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-green-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-[hsl(var(--foreground))]">{s}</span>
                    </div>
                  ))}
                  {weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{w}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Live Preview — Multi-Page A4 Stack */}
          <div className="bg-[hsl(var(--muted)/0.5)] rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[hsl(var(--foreground))] text-sm">Live Preview</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] bg-white px-2 py-1 rounded-full border border-[hsl(var(--border))]">A4 · {cfg.label}</span>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[800px] overflow-x-hidden">
              <div style={{ transform: "scale(0.58)", transformOrigin: "top left", width: `${100/0.58}%` }}>
                <MultiPagePreview
                  data={data}
                  cfg={cfg}
                  scale={1}
                  logoUrl={logoUrl}
                  logoSize={logoSize}
                  logoPosition={logoPosition}
                  logoPageMode={logoPageMode}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
