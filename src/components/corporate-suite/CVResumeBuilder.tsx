import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, FileText, Plus, Trash2, Sparkles, Download,
  ChevronRight, LayoutGrid, Check, RefreshCw, User, Briefcase,
  GraduationCap, Wrench, Languages, AlignLeft, ImageIcon, ChevronDown, Type,
  Link2, Camera, X, Loader2, Image as ImageLucide, Minus, Bold, Italic,
} from "lucide-react";
import { DocumentExtractorUpload } from "@/components/corporate-suite/DocumentExtractorUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandAssetLibrary } from "@/components/corporate-suite/BrandAssetLibrary";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

// ─── Types ────────────────────────────────────────────────────────────────────
type Template =
  | "executive" | "modern" | "classic" | "creative"
  | "harvard"   | "ats"    | "timeline" | "twocol"
  | "minimal"   | "bold"   | "europass" | "academic";

interface Experience { title: string; company: string; period: string; description: string }
interface Education  { degree: string; institution: string; year: string }
interface SocialLink { label: string; url: string }

interface CVData {
  name: string; title: string; email: string; phone: string;
  location: string; linkedin: string; website: string;
  github: string; portfolio: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string; languages: string;
  certifications: string;
  socialLinks: SocialLink[];
  photoUrl: string;
}

// ─── Template config ──────────────────────────────────────────────────────────
const TEMPLATES: { id: Template; label: string; desc: string; accent: string; bg: string; category: string }[] = [
  { id: "executive", label: "Executive",  desc: "Dark sidebar + serif",      accent: "#1e293b", bg: "#f8fafc", category: "Classic" },
  { id: "modern",    label: "Modern",     desc: "Blue header + clean",        accent: "#1e40af", bg: "#ffffff", category: "Classic" },
  { id: "classic",   label: "Classic",    desc: "Centered monochrome",        accent: "#111827", bg: "#fafafa", category: "Classic" },
  { id: "creative",  label: "Creative",   desc: "Violet + bold typography",   accent: "#6d28d9", bg: "#fdf4ff", category: "Creative" },
  { id: "harvard",   label: "Harvard",    desc: "ATS-safe serif format",      accent: "#8b0000", bg: "#ffffff", category: "Academic" },
  { id: "ats",       label: "ATS Clean",  desc: "Pure ATS-optimised layout",  accent: "#1f2937", bg: "#ffffff", category: "Professional" },
  { id: "timeline",  label: "Timeline",   desc: "Vertical timeline sidebar",  accent: "#0f766e", bg: "#f0fdfa", category: "Creative" },
  { id: "twocol",    label: "Two Column", desc: "Split-column layout",        accent: "#7c3aed", bg: "#ffffff", category: "Professional" },
  { id: "minimal",   label: "Minimalist", desc: "Ultra-clean whitespace",     accent: "#374151", bg: "#ffffff", category: "Minimal" },
  { id: "bold",      label: "Bold Pro",   desc: "High-impact header block",   accent: "#dc2626", bg: "#ffffff", category: "Creative" },
  { id: "europass",  label: "Europass",   desc: "EU standard format",         accent: "#003399", bg: "#f7f9ff", category: "International" },
  { id: "academic",  label: "Academic",   desc: "Research & academia style",  accent: "#1e3a5f", bg: "#fffef7", category: "Academic" },
];

const FONT_FAMILIES = [
  { label: "Helvetica", value: "'Helvetica Neue', Arial, sans-serif" },
  { label: "Georgia",   value: "Georgia, 'Times New Roman', serif" },
  { label: "Garamond",  value: "Garamond, 'Palatino Linotype', serif" },
  { label: "Courier",   value: "'Courier New', Courier, monospace" },
  { label: "Futura",    value: "'Century Gothic', 'Trebuchet MS', sans-serif" },
];

// ─── Shared sub-components ────────────────────────────────────────────────────
function Section({ label, accent, scale, classic, centered, children }: {
  label: string; accent: string; scale: number; classic?: boolean; centered?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 * scale }}>
      {classic ? (
        <p style={{ fontSize: 9 * scale, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#111", borderBottom: "1px solid #111", paddingBottom: 3 * scale, marginBottom: 8 * scale, textAlign: centered ? "center" : "left" }}>
          {label}
        </p>
      ) : (
        <p style={{ fontSize: 8.5 * scale, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accent, marginBottom: 8 * scale }}>
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

function ExpEntry({ exp, accent, gray, lgray, scale, creative }: {
  exp: Experience; accent: string; gray: string; lgray: string; scale: number; creative?: boolean;
}) {
  return (
    <div style={{ marginBottom: 10 * scale, paddingLeft: creative ? 10 * scale : 0, borderLeft: creative ? `2px solid ${accent}40` : "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <p style={{ fontSize: 9.5 * scale, fontWeight: 700 }}>{exp.title}</p>
        <p style={{ fontSize: 7.5 * scale, color: lgray, flexShrink: 0 }}>{exp.period}</p>
      </div>
      <p style={{ fontSize: 8.5 * scale, color: accent, opacity: 0.8, margin: `${1 * scale}px 0 ${3 * scale}px` }}>{exp.company}</p>
      {exp.description && <p style={{ fontSize: 8.5 * scale, color: gray, lineHeight: 1.5 }}>{exp.description}</p>}
    </div>
  );
}

function EduEntry({ edu, accent, gray, lgray, scale }: {
  edu: Education; accent: string; gray: string; lgray: string; scale: number;
}) {
  return (
    <div style={{ marginBottom: 8 * scale }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <p style={{ fontSize: 9.5 * scale, fontWeight: 700 }}>{edu.degree}</p>
        <p style={{ fontSize: 7.5 * scale, color: lgray }}>{edu.year}</p>
      </div>
      <p style={{ fontSize: 8.5 * scale, color: gray }}>{edu.institution}</p>
    </div>
  );
}

// ─── Photo component used inside preview ─────────────────────────────────────
function PhotoBubble({ url, size, accent, name }: { url: string; size: number; accent: string; name: string }) {
  if (url) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: `3px solid ${accent}30`, flexShrink: 0 }}>
        <img src={url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `2px solid ${accent}30` }}>
      <span style={{ fontSize: size * 0.4, fontWeight: 700, color: accent }}>{name.charAt(0) || "?"}</span>
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────
function CVPreview({
  data, template, scale = 1,
  fontFamily, fontWeight: fwProp, fontStyle: fsProp, fontSizeOverride,
}: {
  data: CVData; template: Template; scale?: number;
  fontFamily?: string; fontWeight?: string; fontStyle?: string; fontSizeOverride?: number | null;
}) {
  const cfg = TEMPLATES.find(t => t.id === template)!;
  const { accent, bg } = cfg;
  const white  = "#ffffff";
  const gray   = "#6b7280";
  const lgray  = "#9ca3af";
  const dkgray = "#374151";

  const name  = data.name  || "Your Name";
  const title = data.title || "Professional Title";
  const px    = 28 * scale;
  const fontSize = (n: number) => n * scale;

  const allLinks = [
    data.email, data.phone, data.location,
    data.linkedin && `LinkedIn: ${data.linkedin}`,
    data.website  && `Web: ${data.website}`,
    data.github   && `GitHub: ${data.github}`,
  ].filter(Boolean) as string[];

  const resolvedFamily = fontFamily || (template === "executive" || template === "classic" || template === "harvard" || template === "academic" || template === "europass" ? "Georgia, 'Times New Roman', serif" : "'Helvetica Neue', Arial, sans-serif");
  const resolvedWeight = fwProp   || "700";
  const resolvedStyle  = fsProp   || "normal";
  const resolvedNameSz = fontSizeOverride != null ? fontSizeOverride * scale : null;

  // ── EXECUTIVE ─────────────────────────────────────────────────────────
  if (template === "executive") {
    return (
      <div style={{ display: "flex", background: bg, fontFamily: resolvedFamily, fontSize: fontSize(10), color: dkgray, minHeight: 400 * scale, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8 }}>
        <div style={{ width: 110 * scale, background: accent, color: white, padding: `${24 * scale}px ${16 * scale}px`, flexShrink: 0 }}>
          {data.photoUrl ? (
            <img src={data.photoUrl} alt="Profile" style={{ width: 44 * scale, height: 44 * scale, borderRadius: "50%", objectFit: "cover", marginBottom: 12 * scale, border: "2px solid rgba(255,255,255,0.3)" }} />
          ) : (
            <div style={{ width: 44 * scale, height: 44 * scale, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 * scale, fontSize: fontSize(18), fontWeight: 700 }}>{name.charAt(0)}</div>
          )}
          <p style={{ fontSize: fontSize(7), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.5, marginBottom: 16 * scale }}>Contact</p>
          {[data.email, data.phone, data.location].filter(Boolean).map((c, i) => <p key={i} style={{ fontSize: fontSize(7.5), opacity: 0.8, marginBottom: 5 * scale, wordBreak: "break-all" }}>{c}</p>)}
          {(data.linkedin || data.website || data.github) && <>
            <p style={{ fontSize: fontSize(7), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.5, marginTop: 12 * scale, marginBottom: 6 * scale }}>Links</p>
            {data.linkedin && <p style={{ fontSize: fontSize(7), opacity: 0.75, marginBottom: 4 * scale, wordBreak: "break-all" }}>linkedin</p>}
            {data.github   && <p style={{ fontSize: fontSize(7), opacity: 0.75, marginBottom: 4 * scale }}>github</p>}
            {data.website  && <p style={{ fontSize: fontSize(7), opacity: 0.75, marginBottom: 4 * scale }}>portfolio</p>}
          </>}
          {data.skills && <>
            <p style={{ fontSize: fontSize(7), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.5, marginTop: 18 * scale, marginBottom: 10 * scale }}>Skills</p>
            {data.skills.split(",").map((s, i) => <p key={i} style={{ fontSize: fontSize(7.5), opacity: 0.8, marginBottom: 4 * scale }}>{s.trim()}</p>)}
          </>}
          {data.languages && <>
            <p style={{ fontSize: fontSize(7), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.5, marginTop: 18 * scale, marginBottom: 6 * scale }}>Languages</p>
            <p style={{ fontSize: fontSize(7.5), opacity: 0.8 }}>{data.languages}</p>
          </>}
        </div>
        <div style={{ flex: 1, padding: `${24 * scale}px ${px}px` }}>
          <h1 style={{ fontSize: resolvedNameSz ?? fontSize(20), fontWeight: resolvedWeight, fontStyle: resolvedStyle, color: accent, margin: 0 }}>{name}</h1>
          <p style={{ fontSize: fontSize(10), color: gray, marginTop: 3 * scale, marginBottom: 16 * scale }}>{title}</p>
          {data.summary && <Section label="Summary" accent={accent} scale={scale}><p style={{ fontSize: fontSize(9), color: gray, lineHeight: 1.6 }}>{data.summary}</p></Section>}
          {data.experience.some(e => e.title) && <Section label="Experience" accent={accent} scale={scale}>{data.experience.filter(e => e.title).map((exp, i) => <ExpEntry key={i} exp={exp} accent={accent} gray={gray} lgray={lgray} scale={scale} />)}</Section>}
          {data.education.some(e => e.degree) && <Section label="Education" accent={accent} scale={scale}>{data.education.filter(e => e.degree).map((edu, i) => <EduEntry key={i} edu={edu} accent={accent} gray={gray} lgray={lgray} scale={scale} />)}</Section>}
          {data.certifications && <Section label="Certifications" accent={accent} scale={scale}><p style={{ fontSize: fontSize(9), color: gray }}>{data.certifications}</p></Section>}
        </div>
      </div>
    );
  }

  // ── MODERN ────────────────────────────────────────────────────────────
  if (template === "modern") {
    return (
      <div style={{ background: bg, fontFamily: resolvedFamily, fontSize: fontSize(10), color: dkgray, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ background: accent, color: white, padding: `${22 * scale}px ${px}px`, display: "flex", alignItems: "center", gap: 16 * scale }}>
          {data.photoUrl && <img src={data.photoUrl} alt="Profile" style={{ width: 54 * scale, height: 54 * scale, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.4)", flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: resolvedNameSz ?? fontSize(22), fontWeight: resolvedWeight, fontStyle: resolvedStyle, margin: 0 }}>{name}</h1>
            <p style={{ fontSize: fontSize(10), opacity: 0.8, marginTop: 3 * scale, marginBottom: 10 * scale }}>{title}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: `${4 * scale}px ${14 * scale}px` }}>
              {allLinks.slice(0, 5).map((c, i) => <span key={i} style={{ fontSize: fontSize(8), opacity: 0.75 }}>{c}</span>)}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 0 }}>
          <div style={{ padding: `${20 * scale}px ${px}px`, borderRight: "1px solid #e5e7eb" }}>
            {data.summary && <Section label="Summary" accent={accent} scale={scale}><p style={{ fontSize: fontSize(9), color: gray, lineHeight: 1.6 }}>{data.summary}</p></Section>}
            {data.experience.some(e => e.title) && <Section label="Experience" accent={accent} scale={scale}>{data.experience.filter(e => e.title).map((exp, i) => <ExpEntry key={i} exp={exp} accent={accent} gray={gray} lgray={lgray} scale={scale} />)}</Section>}
            {data.education.some(e => e.degree) && <Section label="Education" accent={accent} scale={scale}>{data.education.filter(e => e.degree).map((edu, i) => <EduEntry key={i} edu={edu} accent={accent} gray={gray} lgray={lgray} scale={scale} />)}</Section>}
          </div>
          <div style={{ padding: `${20 * scale}px ${14 * scale}px` }}>
            {data.skills && <Section label="Skills" accent={accent} scale={scale}><div style={{ display: "flex", flexWrap: "wrap", gap: 4 * scale }}>{data.skills.split(",").map((s, i) => <span key={i} style={{ fontSize: fontSize(7.5), background: `${accent}15`, color: accent, padding: `${2 * scale}px ${6 * scale}px`, borderRadius: 4 }}>{s.trim()}</span>)}</div></Section>}
            {data.languages && <Section label="Languages" accent={accent} scale={scale}><p style={{ fontSize: fontSize(8.5), color: gray }}>{data.languages}</p></Section>}
            {data.certifications && <Section label="Certs" accent={accent} scale={scale}><p style={{ fontSize: fontSize(8), color: gray }}>{data.certifications}</p></Section>}
          </div>
        </div>
      </div>
    );
  }

  // ── CLASSIC ───────────────────────────────────────────────────────────
  if (template === "classic") {
    return (
      <div style={{ background: bg, fontFamily: resolvedFamily, fontSize: fontSize(10), color: "#111", padding: `${px}px`, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8 }}>
        <div style={{ textAlign: "center", marginBottom: 16 * scale, borderBottom: "2px solid #111", paddingBottom: 14 * scale }}>
          {data.photoUrl && <img src={data.photoUrl} alt="Profile" style={{ width: 52 * scale, height: 52 * scale, borderRadius: "50%", objectFit: "cover", margin: `0 auto ${8 * scale}px`, display: "block", border: "2px solid #ccc" }} />}
          <h1 style={{ fontSize: resolvedNameSz ?? fontSize(24), fontWeight: resolvedWeight, fontStyle: resolvedStyle, textTransform: "uppercase", letterSpacing: 3, margin: 0 }}>{name}</h1>
          <p style={{ fontSize: fontSize(10), color: gray, marginTop: 4 * scale }}>{title}</p>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: `${3 * scale}px ${14 * scale}px`, marginTop: 8 * scale }}>
            {allLinks.map((c, i) => <span key={i} style={{ fontSize: fontSize(8), color: gray }}>{c}</span>)}
          </div>
        </div>
        {data.summary && <Section label="Profile" accent={accent} scale={scale} classic><p style={{ fontSize: fontSize(9), color: dkgray, lineHeight: 1.7 }}>{data.summary}</p></Section>}
        {data.experience.some(e => e.title) && <Section label="Professional Experience" accent={accent} scale={scale} classic>{data.experience.filter(e => e.title).map((exp, i) => <ExpEntry key={i} exp={exp} accent={accent} gray={gray} lgray={lgray} scale={scale} />)}</Section>}
        {data.education.some(e => e.degree) && <Section label="Education" accent={accent} scale={scale} classic>{data.education.filter(e => e.degree).map((edu, i) => <EduEntry key={i} edu={edu} accent={accent} gray={gray} lgray={lgray} scale={scale} />)}</Section>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 * scale }}>
          {data.skills && <Section label="Core Skills" accent={accent} scale={scale} classic><p style={{ fontSize: fontSize(9), color: dkgray }}>{data.skills}</p></Section>}
          {data.languages && <Section label="Languages" accent={accent} scale={scale} classic><p style={{ fontSize: fontSize(9), color: dkgray }}>{data.languages}</p></Section>}
        </div>
      </div>
    );
  }

  // ── CREATIVE ──────────────────────────────────────────────────────────
  if (template === "creative") {
    return (
      <div style={{ background: bg, fontFamily: resolvedFamily, fontSize: fontSize(10), color: dkgray, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ height: 5 * scale, background: `linear-gradient(90deg, ${accent}, #c026d3)` }} />
        <div style={{ padding: `${22 * scale}px ${px}px` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 * scale }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 * scale }}>
              {data.photoUrl && <img src={data.photoUrl} alt="Profile" style={{ width: 50 * scale, height: 50 * scale, borderRadius: "50%", objectFit: "cover", border: `3px solid ${accent}40` }} />}
              <div>
                <h1 style={{ fontSize: resolvedNameSz ?? fontSize(26), fontWeight: resolvedWeight, fontStyle: resolvedStyle, color: accent, margin: 0, lineHeight: 1.1 }}>{name}</h1>
                <p style={{ fontSize: fontSize(11), color: gray, marginTop: 4 * scale }}>{title}</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {allLinks.slice(0, 4).map((c, i) => <p key={i} style={{ fontSize: fontSize(7.5), color: gray, margin: `${2 * scale}px 0` }}>{c}</p>)}
            </div>
          </div>
          <div style={{ height: 2, background: `${accent}30`, marginBottom: 18 * scale }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 20 * scale }}>
            <div>
              {data.summary && <Section label="About Me" accent={accent} scale={scale}><p style={{ fontSize: fontSize(9), color: gray, lineHeight: 1.6 }}>{data.summary}</p></Section>}
              {data.experience.some(e => e.title) && <Section label="Experience" accent={accent} scale={scale}>{data.experience.filter(e => e.title).map((exp, i) => <ExpEntry key={i} exp={exp} accent={accent} gray={gray} lgray={lgray} scale={scale} creative />)}</Section>}
              {data.education.some(e => e.degree) && <Section label="Education" accent={accent} scale={scale}>{data.education.filter(e => e.degree).map((edu, i) => <EduEntry key={i} edu={edu} accent={accent} gray={gray} lgray={lgray} scale={scale} />)}</Section>}
            </div>
            <div>
              {data.skills && <Section label="Skills" accent={accent} scale={scale}><div style={{ display: "flex", flexDirection: "column", gap: 4 * scale }}>{data.skills.split(",").map((s, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 * scale }}><div style={{ width: 6 * scale, height: 6 * scale, borderRadius: "50%", background: accent, flexShrink: 0 }} /><span style={{ fontSize: fontSize(8), color: dkgray }}>{s.trim()}</span></div>)}</div></Section>}
              {data.languages && <Section label="Languages" accent={accent} scale={scale}>{data.languages.split(",").map((l, i) => <p key={i} style={{ fontSize: fontSize(8), color: gray, margin: `${3 * scale}px 0` }}>{l.trim()}</p>)}</Section>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── HARVARD ───────────────────────────────────────────────────────────
  if (template === "harvard") {
    return (
      <div style={{ background: bg, fontFamily: resolvedFamily, fontSize: fontSize(10), color: "#111", padding: `${px}px`, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8 }}>
        <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: 12 * scale, marginBottom: 16 * scale }}>
          <h1 style={{ fontSize: resolvedNameSz ?? fontSize(22), fontWeight: 700, color: accent, margin: 0, letterSpacing: 0.5 }}>{name}</h1>
          <p style={{ fontSize: fontSize(9), color: "#555", marginTop: 3 * scale }}>{title}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: `${2 * scale}px ${16 * scale}px`, marginTop: 6 * scale }}>
            {allLinks.map((c, i) => <span key={i} style={{ fontSize: fontSize(8), color: "#555" }}>{c}</span>)}
          </div>
        </div>
        {data.summary && <><p style={{ fontSize: fontSize(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accent, borderBottom: `1px solid ${accent}40`, paddingBottom: 2 * scale, marginBottom: 6 * scale }}>Objective</p><p style={{ fontSize: fontSize(9), color: "#333", lineHeight: 1.6, marginBottom: 14 * scale }}>{data.summary}</p></>}
        {data.experience.some(e => e.title) && <><p style={{ fontSize: fontSize(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accent, borderBottom: `1px solid ${accent}40`, paddingBottom: 2 * scale, marginBottom: 8 * scale }}>Experience</p>{data.experience.filter(e => e.title).map((exp, i) => <div key={i} style={{ marginBottom: 10 * scale }}><div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ fontSize: fontSize(10), fontWeight: 700 }}>{exp.company}</p><p style={{ fontSize: fontSize(8.5), color: "#555" }}>{exp.period}</p></div><p style={{ fontSize: fontSize(9), fontStyle: "italic", color: "#444", margin: `${2 * scale}px 0` }}>{exp.title}</p>{exp.description && <p style={{ fontSize: fontSize(8.5), color: "#555", lineHeight: 1.5 }}>{exp.description}</p>}</div>)}</>}
        {data.education.some(e => e.degree) && <><p style={{ fontSize: fontSize(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accent, borderBottom: `1px solid ${accent}40`, paddingBottom: 2 * scale, marginBottom: 8 * scale, marginTop: 14 * scale }}>Education</p>{data.education.filter(e => e.degree).map((edu, i) => <div key={i} style={{ marginBottom: 8 * scale }}><div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ fontSize: fontSize(10), fontWeight: 700 }}>{edu.institution}</p><p style={{ fontSize: fontSize(8.5), color: "#555" }}>{edu.year}</p></div><p style={{ fontSize: fontSize(9), fontStyle: "italic", color: "#444" }}>{edu.degree}</p></div>)}</>}
        {data.skills && <><p style={{ fontSize: fontSize(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accent, borderBottom: `1px solid ${accent}40`, paddingBottom: 2 * scale, marginBottom: 6 * scale, marginTop: 14 * scale }}>Skills</p><p style={{ fontSize: fontSize(9), color: "#555" }}>{data.skills}</p></>}
      </div>
    );
  }

  // ── ATS CLEAN ─────────────────────────────────────────────────────────
  if (template === "ats") {
    return (
      <div style={{ background: bg, fontFamily: "'Arial', sans-serif", fontSize: fontSize(10), color: "#111", padding: `${px}px`, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8 }}>
        <h1 style={{ fontSize: resolvedNameSz ?? fontSize(20), fontWeight: 700, color: "#111", margin: 0 }}>{name}</h1>
        <p style={{ fontSize: fontSize(10), color: "#555", marginTop: 3 * scale }}>{title}</p>
        <p style={{ fontSize: fontSize(8.5), color: "#555", marginTop: 5 * scale }}>{allLinks.join("  |  ")}</p>
        <hr style={{ border: "none", borderTop: "1px solid #999", margin: `${12 * scale}px 0` }} />
        {data.summary && <><p style={{ fontSize: fontSize(9), fontWeight: 700, textTransform: "uppercase", marginBottom: 5 * scale }}>Professional Summary</p><p style={{ fontSize: fontSize(9), color: "#333", lineHeight: 1.6, marginBottom: 14 * scale }}>{data.summary}</p></>}
        {data.skills && <><p style={{ fontSize: fontSize(9), fontWeight: 700, textTransform: "uppercase", marginBottom: 5 * scale }}>Core Competencies</p><p style={{ fontSize: fontSize(9), color: "#333", marginBottom: 14 * scale }}>{data.skills}</p></>}
        {data.experience.some(e => e.title) && <><p style={{ fontSize: fontSize(9), fontWeight: 700, textTransform: "uppercase", marginBottom: 8 * scale }}>Professional Experience</p>{data.experience.filter(e => e.title).map((exp, i) => <div key={i} style={{ marginBottom: 10 * scale }}><div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ fontSize: fontSize(9.5), fontWeight: 700 }}>{exp.title} — {exp.company}</p><p style={{ fontSize: fontSize(8.5), color: "#555" }}>{exp.period}</p></div>{exp.description && <p style={{ fontSize: fontSize(8.5), color: "#444", lineHeight: 1.5, marginTop: 3 * scale }}>{exp.description}</p>}</div>)}</>}
        {data.education.some(e => e.degree) && <><p style={{ fontSize: fontSize(9), fontWeight: 700, textTransform: "uppercase", marginBottom: 8 * scale, marginTop: 12 * scale }}>Education</p>{data.education.filter(e => e.degree).map((edu, i) => <div key={i} style={{ marginBottom: 6 * scale }}><div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ fontSize: fontSize(9.5), fontWeight: 700 }}>{edu.degree} — {edu.institution}</p><p style={{ fontSize: fontSize(8.5), color: "#555" }}>{edu.year}</p></div></div>)}</>}
      </div>
    );
  }

  // ── TIMELINE ──────────────────────────────────────────────────────────
  if (template === "timeline") {
    return (
      <div style={{ display: "flex", background: bg, fontFamily: resolvedFamily, fontSize: fontSize(10), color: dkgray, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ width: 90 * scale, background: accent, color: white, padding: `${24 * scale}px ${12 * scale}px`, flexShrink: 0 }}>
          <PhotoBubble url={data.photoUrl} size={44 * scale} accent={accent} name={name} />
          <p style={{ fontSize: fontSize(8), fontWeight: 700, marginTop: 12 * scale, marginBottom: 8 * scale, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 }}>Contact</p>
          {[data.email, data.phone, data.location].filter(Boolean).map((c, i) => <p key={i} style={{ fontSize: fontSize(7), opacity: 0.8, marginBottom: 4 * scale, wordBreak: "break-all" }}>{c}</p>)}
          {data.skills && <><p style={{ fontSize: fontSize(7.5), fontWeight: 700, opacity: 0.6, textTransform: "uppercase", marginTop: 14 * scale, marginBottom: 6 * scale }}>Skills</p>{data.skills.split(",").slice(0, 8).map((s, i) => <p key={i} style={{ fontSize: fontSize(7.5), opacity: 0.8, marginBottom: 3 * scale }}>{s.trim()}</p>)}</>}
          {data.languages && <><p style={{ fontSize: fontSize(7.5), fontWeight: 700, opacity: 0.6, textTransform: "uppercase", marginTop: 14 * scale, marginBottom: 6 * scale }}>Languages</p><p style={{ fontSize: fontSize(7.5), opacity: 0.8 }}>{data.languages}</p></>}
        </div>
        <div style={{ flex: 1, padding: `${24 * scale}px ${px}px` }}>
          <h1 style={{ fontSize: resolvedNameSz ?? fontSize(20), fontWeight: resolvedWeight, fontStyle: resolvedStyle, color: accent, margin: 0 }}>{name}</h1>
          <p style={{ fontSize: fontSize(10), color: gray, marginTop: 3 * scale, marginBottom: 16 * scale }}>{title}</p>
          {data.summary && <Section label="Summary" accent={accent} scale={scale}><p style={{ fontSize: fontSize(9), color: gray, lineHeight: 1.6 }}>{data.summary}</p></Section>}
          {data.experience.some(e => e.title) && <><p style={{ fontSize: 8.5 * scale, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accent, marginBottom: 10 * scale }}>Experience</p>{data.experience.filter(e => e.title).map((exp, i) => (
            <div key={i} style={{ display: "flex", gap: 10 * scale, marginBottom: 12 * scale }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 8 * scale, height: 8 * scale, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                {i < data.experience.filter(e => e.title).length - 1 && <div style={{ width: 1.5, flex: 1, background: `${accent}30`, marginTop: 3 * scale }} />}
              </div>
              <div style={{ paddingBottom: 10 * scale }}>
                <p style={{ fontSize: 9.5 * scale, fontWeight: 700 }}>{exp.title}</p>
                <p style={{ fontSize: 8.5 * scale, color: accent, opacity: 0.8 }}>{exp.company} · {exp.period}</p>
                {exp.description && <p style={{ fontSize: 8.5 * scale, color: gray, lineHeight: 1.5, marginTop: 3 * scale }}>{exp.description}</p>}
              </div>
            </div>
          ))}</>}
          {data.education.some(e => e.degree) && <Section label="Education" accent={accent} scale={scale}>{data.education.filter(e => e.degree).map((edu, i) => <EduEntry key={i} edu={edu} accent={accent} gray={gray} lgray={lgray} scale={scale} />)}</Section>}
        </div>
      </div>
    );
  }

  // ── TWO COLUMN ────────────────────────────────────────────────────────
  if (template === "twocol") {
    return (
      <div style={{ background: bg, fontFamily: resolvedFamily, fontSize: fontSize(10), color: dkgray, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ background: accent, padding: `${20 * scale}px ${px}px`, display: "flex", alignItems: "center", gap: 14 * scale }}>
          {data.photoUrl && <img src={data.photoUrl} alt="Profile" style={{ width: 52 * scale, height: 52 * scale, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.4)", flexShrink: 0 }} />}
          <div>
            <h1 style={{ fontSize: resolvedNameSz ?? fontSize(22), fontWeight: resolvedWeight, fontStyle: resolvedStyle, color: white, margin: 0 }}>{name}</h1>
            <p style={{ fontSize: fontSize(10), color: white, opacity: 0.8, marginTop: 3 * scale }}>{title}</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 0 }}>
          <div style={{ padding: `${20 * scale}px ${px}px`, borderRight: "1px solid #eee" }}>
            {data.summary && <Section label="Summary" accent={accent} scale={scale}><p style={{ fontSize: fontSize(9), color: gray, lineHeight: 1.6 }}>{data.summary}</p></Section>}
            {data.experience.some(e => e.title) && <Section label="Experience" accent={accent} scale={scale}>{data.experience.filter(e => e.title).map((exp, i) => <ExpEntry key={i} exp={exp} accent={accent} gray={gray} lgray={lgray} scale={scale} />)}</Section>}
            {data.education.some(e => e.degree) && <Section label="Education" accent={accent} scale={scale}>{data.education.filter(e => e.degree).map((edu, i) => <EduEntry key={i} edu={edu} accent={accent} gray={gray} lgray={lgray} scale={scale} />)}</Section>}
          </div>
          <div style={{ padding: `${20 * scale}px ${12 * scale}px` }}>
            <p style={{ fontSize: fontSize(8), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: accent, marginBottom: 6 * scale }}>Contact</p>
            {[data.email, data.phone, data.location].filter(Boolean).map((c, i) => <p key={i} style={{ fontSize: fontSize(8), color: gray, marginBottom: 4 * scale, wordBreak: "break-all" }}>{c}</p>)}
            {data.skills && <><p style={{ fontSize: fontSize(8), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: accent, marginBottom: 6 * scale, marginTop: 14 * scale }}>Skills</p>{data.skills.split(",").map((s, i) => <p key={i} style={{ fontSize: fontSize(8), color: gray, marginBottom: 3 * scale }}>{s.trim()}</p>)}</>}
            {data.languages && <><p style={{ fontSize: fontSize(8), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: accent, marginBottom: 6 * scale, marginTop: 14 * scale }}>Languages</p><p style={{ fontSize: fontSize(8), color: gray }}>{data.languages}</p></>}
            {(data.linkedin || data.github || data.website) && <><p style={{ fontSize: fontSize(8), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: accent, marginBottom: 6 * scale, marginTop: 14 * scale }}>Links</p>{data.linkedin && <p style={{ fontSize: fontSize(7.5), color: gray, marginBottom: 3 * scale }}>LinkedIn</p>}{data.github && <p style={{ fontSize: fontSize(7.5), color: gray, marginBottom: 3 * scale }}>GitHub</p>}{data.website && <p style={{ fontSize: fontSize(7.5), color: gray }}>Portfolio</p>}</>}
          </div>
        </div>
      </div>
    );
  }

  // ── MINIMALIST ────────────────────────────────────────────────────────
  if (template === "minimal") {
    return (
      <div style={{ background: bg, fontFamily: resolvedFamily, fontSize: fontSize(10), color: "#111", padding: `${px * 1.2}px`, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 * scale }}>
          <div>
            <h1 style={{ fontSize: resolvedNameSz ?? fontSize(24), fontWeight: 300, color: "#111", margin: 0, letterSpacing: -0.5 }}>{name}</h1>
            <p style={{ fontSize: fontSize(10), color: gray, marginTop: 4 * scale, fontWeight: 400 }}>{title}</p>
          </div>
          {data.photoUrl && <img src={data.photoUrl} alt="Profile" style={{ width: 46 * scale, height: 46 * scale, borderRadius: 6, objectFit: "cover", border: "1px solid #e5e7eb" }} />}
        </div>
        <div style={{ display: "flex", gap: `${3 * scale}px ${16 * scale}px`, flexWrap: "wrap", marginBottom: 20 * scale }}>
          {allLinks.map((c, i) => <span key={i} style={{ fontSize: fontSize(8), color: gray }}>{c}</span>)}
        </div>
        <div style={{ height: 0.5, background: "#e5e7eb", marginBottom: 20 * scale }} />
        {data.summary && <><p style={{ fontSize: fontSize(9), color: gray, lineHeight: 1.7, marginBottom: 16 * scale }}>{data.summary}</p></>}
        {data.experience.some(e => e.title) && <><p style={{ fontSize: fontSize(8), fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#aaa", marginBottom: 10 * scale }}>Experience</p>{data.experience.filter(e => e.title).map((exp, i) => <div key={i} style={{ marginBottom: 12 * scale }}><div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ fontSize: fontSize(9.5), fontWeight: 500 }}>{exp.title}</p><p style={{ fontSize: fontSize(8), color: gray }}>{exp.period}</p></div><p style={{ fontSize: fontSize(8.5), color: gray, marginTop: 2 * scale }}>{exp.company}</p>{exp.description && <p style={{ fontSize: fontSize(8.5), color: "#555", lineHeight: 1.5, marginTop: 3 * scale }}>{exp.description}</p>}</div>)}</>}
        {data.education.some(e => e.degree) && <><p style={{ fontSize: fontSize(8), fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#aaa", marginBottom: 10 * scale, marginTop: 16 * scale }}>Education</p>{data.education.filter(e => e.degree).map((edu, i) => <div key={i} style={{ marginBottom: 8 * scale }}><div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ fontSize: fontSize(9.5), fontWeight: 500 }}>{edu.degree}</p><p style={{ fontSize: fontSize(8), color: gray }}>{edu.year}</p></div><p style={{ fontSize: fontSize(8.5), color: gray }}>{edu.institution}</p></div>)}</>}
        {data.skills && <><p style={{ fontSize: fontSize(8), fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "#aaa", marginBottom: 8 * scale, marginTop: 16 * scale }}>Skills</p><p style={{ fontSize: fontSize(9), color: "#555" }}>{data.skills}</p></>}
      </div>
    );
  }

  // ── BOLD PRO ──────────────────────────────────────────────────────────
  if (template === "bold") {
    return (
      <div style={{ background: bg, fontFamily: resolvedFamily, fontSize: fontSize(10), color: "#111", boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ background: accent, padding: `${28 * scale}px ${px}px`, position: "relative" }}>
          {data.photoUrl && <img src={data.photoUrl} alt="Profile" style={{ position: "absolute", right: px, top: "50%", transform: "translateY(-50%)", width: 56 * scale, height: 56 * scale, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.5)" }} />}
          <p style={{ fontSize: fontSize(8), fontWeight: 700, textTransform: "uppercase", letterSpacing: 3, color: "rgba(255,255,255,0.5)", marginBottom: 4 * scale }}>Curriculum Vitae</p>
          <h1 style={{ fontSize: resolvedNameSz ?? fontSize(28), fontWeight: 900, color: white, margin: 0, lineHeight: 1 }}>{name}</h1>
          <p style={{ fontSize: fontSize(12), color: "rgba(255,255,255,0.75)", marginTop: 6 * scale }}>{title}</p>
        </div>
        <div style={{ background: `${accent}15`, padding: `${8 * scale}px ${px}px`, display: "flex", flexWrap: "wrap", gap: `${4 * scale}px ${16 * scale}px` }}>
          {allLinks.map((c, i) => <span key={i} style={{ fontSize: fontSize(8), color: "#555" }}>{c}</span>)}
        </div>
        <div style={{ padding: `${20 * scale}px ${px}px` }}>
          {data.summary && <Section label="Profile" accent={accent} scale={scale}><p style={{ fontSize: fontSize(9), color: gray, lineHeight: 1.6 }}>{data.summary}</p></Section>}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 * scale }}>
            <div>
              {data.experience.some(e => e.title) && <Section label="Experience" accent={accent} scale={scale}>{data.experience.filter(e => e.title).map((exp, i) => <ExpEntry key={i} exp={exp} accent={accent} gray={gray} lgray={lgray} scale={scale} />)}</Section>}
            </div>
            <div>
              {data.education.some(e => e.degree) && <Section label="Education" accent={accent} scale={scale}>{data.education.filter(e => e.degree).map((edu, i) => <EduEntry key={i} edu={edu} accent={accent} gray={gray} lgray={lgray} scale={scale} />)}</Section>}
              {data.skills && <Section label="Skills" accent={accent} scale={scale}><div style={{ display: "flex", flexDirection: "column", gap: 3 * scale }}>{data.skills.split(",").map((s, i) => <span key={i} style={{ fontSize: fontSize(8), background: `${accent}12`, color: accent, padding: `${2 * scale}px ${6 * scale}px`, borderRadius: 4 }}>{s.trim()}</span>)}</div></Section>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EUROPASS ──────────────────────────────────────────────────────────
  if (template === "europass") {
    return (
      <div style={{ background: bg, fontFamily: resolvedFamily, fontSize: fontSize(10), color: "#111", boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ background: accent, height: 8 * scale }} />
        <div style={{ padding: `${20 * scale}px ${px}px`, display: "flex", justifyContent: "space-between", borderBottom: `2px solid ${accent}` }}>
          <div>
            <h1 style={{ fontSize: resolvedNameSz ?? fontSize(22), fontWeight: 700, color: accent, margin: 0 }}>{name}</h1>
            <p style={{ fontSize: fontSize(10), color: "#444", marginTop: 4 * scale }}>{title}</p>
          </div>
          {data.photoUrl && <img src={data.photoUrl} alt="Profile" style={{ width: 52 * scale, height: 62 * scale, objectFit: "cover", border: `2px solid ${accent}` }} />}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", padding: `${16 * scale}px ${px}px`, gap: 14 * scale }}>
          <div>
            <p style={{ fontSize: fontSize(8), fontWeight: 700, textTransform: "uppercase", color: accent, marginBottom: 5 * scale }}>Personal Info</p>
            <p style={{ fontSize: fontSize(8), color: "#555", marginBottom: 3 * scale }}>{data.email}</p>
            <p style={{ fontSize: fontSize(8), color: "#555", marginBottom: 3 * scale }}>{data.phone}</p>
            <p style={{ fontSize: fontSize(8), color: "#555", marginBottom: 3 * scale }}>{data.location}</p>
            {data.linkedin && <p style={{ fontSize: fontSize(8), color: "#555", marginBottom: 3 * scale }}>LinkedIn</p>}
            {data.skills && <><p style={{ fontSize: fontSize(8), fontWeight: 700, textTransform: "uppercase", color: accent, marginBottom: 5 * scale, marginTop: 14 * scale }}>Skills</p><p style={{ fontSize: fontSize(8), color: "#555" }}>{data.skills}</p></>}
            {data.languages && <><p style={{ fontSize: fontSize(8), fontWeight: 700, textTransform: "uppercase", color: accent, marginBottom: 5 * scale, marginTop: 14 * scale }}>Languages</p><p style={{ fontSize: fontSize(8), color: "#555" }}>{data.languages}</p></>}
          </div>
          <div style={{ borderLeft: `2px solid ${accent}30`, paddingLeft: 14 * scale }}>
            {data.summary && <><p style={{ fontSize: fontSize(8.5), fontWeight: 700, textTransform: "uppercase", color: accent, marginBottom: 5 * scale }}>Profile</p><p style={{ fontSize: fontSize(9), color: "#444", lineHeight: 1.6, marginBottom: 14 * scale }}>{data.summary}</p></>}
            {data.experience.some(e => e.title) && <><p style={{ fontSize: fontSize(8.5), fontWeight: 700, textTransform: "uppercase", color: accent, marginBottom: 8 * scale }}>Work Experience</p>{data.experience.filter(e => e.title).map((exp, i) => <div key={i} style={{ marginBottom: 10 * scale }}><div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ fontSize: fontSize(9), fontWeight: 600 }}>{exp.title}</p><p style={{ fontSize: fontSize(8), color: "#888" }}>{exp.period}</p></div><p style={{ fontSize: fontSize(8.5), color: "#666" }}>{exp.company}</p>{exp.description && <p style={{ fontSize: fontSize(8), color: "#555", lineHeight: 1.5, marginTop: 3 * scale }}>{exp.description}</p>}</div>)}</>}
            {data.education.some(e => e.degree) && <><p style={{ fontSize: fontSize(8.5), fontWeight: 700, textTransform: "uppercase", color: accent, marginBottom: 8 * scale, marginTop: 14 * scale }}>Education</p>{data.education.filter(e => e.degree).map((edu, i) => <div key={i} style={{ marginBottom: 8 * scale }}><div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ fontSize: fontSize(9), fontWeight: 600 }}>{edu.degree}</p><p style={{ fontSize: fontSize(8), color: "#888" }}>{edu.year}</p></div><p style={{ fontSize: fontSize(8.5), color: "#666" }}>{edu.institution}</p></div>)}</>}
          </div>
        </div>
      </div>
    );
  }

  // ── ACADEMIC ──────────────────────────────────────────────────────────
  return (
    <div style={{ background: bg, fontFamily: resolvedFamily, fontSize: fontSize(10), color: "#1a1a2e", padding: `${px}px`, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8 }}>
      <div style={{ textAlign: "center", marginBottom: 18 * scale }}>
        {data.photoUrl && <img src={data.photoUrl} alt="Profile" style={{ width: 56 * scale, height: 56 * scale, borderRadius: "50%", objectFit: "cover", margin: `0 auto ${10 * scale}px`, display: "block", border: `2px solid ${accent}` }} />}
        <h1 style={{ fontSize: resolvedNameSz ?? fontSize(22), fontWeight: 700, color: accent, margin: 0 }}>{name}</h1>
        <p style={{ fontSize: fontSize(10), color: "#555", marginTop: 4 * scale, fontStyle: "italic" }}>{title}</p>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: `${3 * scale}px ${16 * scale}px`, marginTop: 8 * scale }}>
          {allLinks.map((c, i) => <span key={i} style={{ fontSize: fontSize(8), color: "#666" }}>{c}</span>)}
        </div>
      </div>
      <div style={{ height: 1.5, background: accent, marginBottom: 16 * scale }} />
      {data.summary && <><p style={{ fontSize: fontSize(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accent, marginBottom: 6 * scale }}>Research Interests / Profile</p><p style={{ fontSize: fontSize(9), color: "#444", lineHeight: 1.7, marginBottom: 14 * scale }}>{data.summary}</p></>}
      {data.education.some(e => e.degree) && <><p style={{ fontSize: fontSize(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accent, marginBottom: 8 * scale }}>Education</p>{data.education.filter(e => e.degree).map((edu, i) => <div key={i} style={{ marginBottom: 10 * scale }}><div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ fontSize: fontSize(10), fontWeight: 700 }}>{edu.degree}</p><p style={{ fontSize: fontSize(8.5), color: "#888" }}>{edu.year}</p></div><p style={{ fontSize: fontSize(9), fontStyle: "italic", color: "#555" }}>{edu.institution}</p></div>)}<div style={{ height: 0.5, background: "#e0e0e0", marginBottom: 14 * scale }} /></>}
      {data.experience.some(e => e.title) && <><p style={{ fontSize: fontSize(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accent, marginBottom: 8 * scale }}>Academic / Professional Experience</p>{data.experience.filter(e => e.title).map((exp, i) => <div key={i} style={{ marginBottom: 10 * scale }}><div style={{ display: "flex", justifyContent: "space-between" }}><p style={{ fontSize: fontSize(9.5), fontWeight: 700 }}>{exp.title}</p><p style={{ fontSize: fontSize(8.5), color: "#888" }}>{exp.period}</p></div><p style={{ fontSize: fontSize(9), color: "#666", fontStyle: "italic" }}>{exp.company}</p>{exp.description && <p style={{ fontSize: fontSize(8.5), color: "#555", lineHeight: 1.5, marginTop: 3 * scale }}>{exp.description}</p>}</div>)}</>}
      {data.skills && <><div style={{ height: 0.5, background: "#e0e0e0", marginTop: 14 * scale, marginBottom: 14 * scale }} /><p style={{ fontSize: fontSize(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accent, marginBottom: 6 * scale }}>Technical Skills</p><p style={{ fontSize: fontSize(9), color: "#555" }}>{data.skills}</p></>}
      {data.certifications && <><p style={{ fontSize: fontSize(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: accent, marginBottom: 6 * scale, marginTop: 12 * scale }}>Certifications / Publications</p><p style={{ fontSize: fontSize(9), color: "#555" }}>{data.certifications}</p></>}
    </div>
  );
}

// ─── Photo Upload Panel ───────────────────────────────────────────────────────
function PhotoUploadPanel({
  photoUrl, onPhotoChange,
}: { photoUrl: string; onPhotoChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [removing, setRemoving] = useState(false);
  const [photoSize, setPhotoSize] = useState(100); // percentage 50–200

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    const reader = new FileReader();
    reader.onload = (e) => onPhotoChange(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [onPhotoChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemoveBg = async () => {
    if (!photoUrl) { toast.error("Upload a photo first"); return; }
    setRemoving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("ai-background-remove", {
        body: { mode: "remove", image: photoUrl },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (error) throw error;
      if (data?.success && data?.processedImage) {
        onPhotoChange(data.processedImage);
        toast.success("Background removed with AI!");
      } else if (data?.fallbackToClientSide) {
        toast.info("AI background removal not available — try a photo with a plain background.");
      } else {
        toast.error("Background removal failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Background removal failed. Please try again.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      {!photoUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[hsl(var(--border))] rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-[hsl(var(--gold)/0.5)] hover:bg-[hsl(var(--gold)/0.03)] transition-colors"
        >
          <Camera size={20} className="text-[hsl(var(--muted-foreground))]" />
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] text-center">
            Click or drag to upload your photo
          </p>
          <p className="text-[9px] text-[hsl(var(--muted-foreground))/0.7]">PNG, JPG, WEBP</p>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <img
                src={photoUrl}
                alt="CV Photo"
                className="rounded-full object-cover border-2 border-[hsl(var(--border))]"
                style={{ width: Math.round(64 * photoSize / 100), height: Math.round(64 * photoSize / 100) }}
              />
              <button
                onClick={() => onPhotoChange("")}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center hover:opacity-80"
              >
                <X size={10} />
              </button>
            </div>
            <div className="flex-1 space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemoveBg}
                disabled={removing}
                className="w-full h-7 text-xs gap-1.5 border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.06)]"
              >
                {removing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {removing ? "Removing bg…" : "AI Remove Background"}
              </Button>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-center py-1 border border-[hsl(var(--border))] rounded-lg"
              >
                Replace Photo
              </button>
            </div>
          </div>
          {/* Size slider */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Photo Size</p>
              <p className="text-[9px] font-mono text-[hsl(var(--foreground))]">{photoSize}%</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPhotoSize(s => Math.max(50, s - 10))} className="w-6 h-6 rounded border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"><Minus size={10} /></button>
              <input type="range" min={50} max={200} value={photoSize} onChange={e => setPhotoSize(Number(e.target.value))} className="flex-1 h-1.5 accent-[hsl(var(--gold))]" />
              <button onClick={() => setPhotoSize(s => Math.min(200, s + 10))} className="w-6 h-6 rounded border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"><Plus size={10} /></button>
            </div>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
async function exportCVAsPDF(data: CVData, template: Template) {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
  const W = 595, H = 842;
  const pdfDoc = await PDFDocument.create();
  const page   = pdfDoc.addPage([W, H]);

  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italic  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  function hex(h: string) {
    const c = h.replace("#", "");
    return rgb(parseInt(c.slice(0,2),16)/255, parseInt(c.slice(2,4),16)/255, parseInt(c.slice(4,6),16)/255);
  }

  const cfg    = TEMPLATES.find(t => t.id === template)!;
  const accent = hex(cfg.accent);
  const white  = rgb(1,1,1);
  const black  = rgb(0,0,0);
  const gray   = rgb(0.43,0.43,0.43);
  const lgray  = rgb(0.62,0.62,0.62);
  const dkgray = rgb(0.22,0.22,0.22);

  const name    = data.name  || "Your Name";
  const title   = data.title || "Professional Title";
  const contact = [data.email, data.phone, data.location, data.linkedin].filter(Boolean).join("  |  ");

  function drawText(text: string, opts: { x: number; y: number; size: number; font?: typeof bold; color?: ReturnType<typeof rgb>; maxWidth?: number; lineHeight?: number }) {
    const f   = opts.font  || regular;
    const clr = opts.color || black;
    const w   = opts.maxWidth;
    if (!w) {
      page.drawText(text, { x: opts.x, y: opts.y, size: opts.size, font: f, color: clr });
      return opts.y - (opts.lineHeight || opts.size + 3);
    }
    const words = text.split(" ");
    let line = "", y = opts.y;
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (f.widthOfTextAtSize(test, opts.size) > w && line) {
        page.drawText(line, { x: opts.x, y, size: opts.size, font: f, color: clr });
        y -= opts.lineHeight || opts.size + 3;
        line = word;
      } else { line = test; }
    }
    if (line) { page.drawText(line, { x: opts.x, y, size: opts.size, font: f, color: clr }); y -= opts.lineHeight || opts.size + 3; }
    return y;
  }

  function sectionHeader(label: string, y: number, x = 40, w = W - 80) {
    page.drawLine({ start: { x, y: y - 2 }, end: { x: x + w, y: y - 2 }, thickness: 0.6, color: accent, opacity: 0.4 });
    page.drawText(label.toUpperCase(), { x, y, size: 8, font: bold, color: accent });
    return y - 16;
  }

  if (template === "executive" || template === "timeline") {
    const sideW = 160;
    page.drawRectangle({ x: 0, y: 0, width: sideW, height: H, color: hex(cfg.accent) });
    page.drawEllipse({ x: sideW / 2, y: H - 60, xScale: 26, yScale: 26, color: rgb(1,1,1), opacity: 0.15 });
    page.drawText(name.charAt(0), { x: sideW/2 - 8, y: H - 68, size: 20, font: bold, color: white });
    let sY = H - 110;
    page.drawText("CONTACT", { x: 16, y: sY, size: 7, font: bold, color: white, opacity: 0.5 });
    sY -= 14;
    [data.email, data.phone, data.location].filter(Boolean).forEach(c => { page.drawText(c!, { x: 16, y: sY, size: 7.5, font: regular, color: white, opacity: 0.8, maxWidth: sideW - 24 } as any); sY -= 13; });
    sY -= 8;
    if (data.skills) { page.drawText("SKILLS", { x: 16, y: sY, size: 7, font: bold, color: white, opacity: 0.5 }); sY -= 14; data.skills.split(",").forEach(s => { page.drawText(s.trim(), { x: 16, y: sY, size: 7.5, font: regular, color: white, opacity: 0.8 }); sY -= 12; }); }
    if (data.languages) { sY -= 6; page.drawText("LANGUAGES", { x: 16, y: sY, size: 7, font: bold, color: white, opacity: 0.5 }); sY -= 14; page.drawText(data.languages, { x: 16, y: sY, size: 7.5, font: regular, color: white, opacity: 0.8 }); }
    const mx = sideW + 24, mw = W - mx - 24;
    let my = H - 48;
    page.drawText(name,  { x: mx, y: my, size: 22, font: bold, color: accent });  my -= 20;
    page.drawText(title, { x: mx, y: my, size: 10, font: italic, color: gray });  my -= 24;
    if (data.summary) { my = sectionHeader("Summary", my, mx, mw); my = drawText(data.summary, { x: mx, y: my, size: 9, color: gray, maxWidth: mw, lineHeight: 14 }); my -= 10; }
    if (data.experience.some(e => e.title)) { my = sectionHeader("Experience", my, mx, mw); data.experience.filter(e => e.title).forEach(exp => { if (my < 60) return; page.drawText(exp.title, { x: mx, y: my, size: 9.5, font: bold, color: dkgray }); page.drawText(exp.period, { x: W - 60, y: my, size: 8, font: regular, color: lgray }); my -= 13; page.drawText(exp.company, { x: mx, y: my, size: 8.5, font: italic, color: accent }); my -= 12; if (exp.description) { my = drawText(exp.description, { x: mx, y: my, size: 8.5, color: gray, maxWidth: mw, lineHeight: 13 }); } my -= 8; }); }
    if (data.education.some(e => e.degree)) { my = sectionHeader("Education", my, mx, mw); data.education.filter(e => e.degree).forEach(edu => { if (my < 60) return; page.drawText(edu.degree, { x: mx, y: my, size: 9.5, font: bold, color: dkgray }); page.drawText(edu.year, { x: W - 60, y: my, size: 8, font: regular, color: lgray }); my -= 13; page.drawText(edu.institution, { x: mx, y: my, size: 8.5, font: regular, color: gray }); my -= 14; }); }
  } else if (template === "modern" || template === "bold" || template === "twocol") {
    page.drawRectangle({ x: 0, y: H - 110, width: W, height: 110, color: accent });
    page.drawText(name, { x: 36, y: H - 52, size: 24, font: bold, color: white });
    page.drawText(title, { x: 36, y: H - 72, size: 10, font: regular, color: white, opacity: 0.8 });
    page.drawText(contact, { x: 36, y: H - 92, size: 8, font: regular, color: white, opacity: 0.65 });
    const mx = 36, mw = W - 230, sx = W - 185, sw = 170;
    let my = H - 130, sy = H - 130;
    if (data.summary) { my = sectionHeader("Summary", my, mx, mw - mx); my = drawText(data.summary, { x: mx, y: my, size: 9, color: gray, maxWidth: mw - mx, lineHeight: 14 }); my -= 10; }
    if (data.experience.some(e => e.title)) { my = sectionHeader("Experience", my, mx, mw - mx); data.experience.filter(e => e.title).forEach(exp => { if (my < 60) return; page.drawText(exp.title, { x: mx, y: my, size: 9.5, font: bold, color: dkgray }); page.drawText(exp.period, { x: mw - 40, y: my, size: 7.5, font: regular, color: lgray }); my -= 13; page.drawText(exp.company, { x: mx, y: my, size: 8.5, font: italic, color: accent }); my -= 12; if (exp.description) { my = drawText(exp.description, { x: mx, y: my, size: 8.5, color: gray, maxWidth: mw - mx, lineHeight: 13 }); } my -= 8; }); }
    if (data.education.some(e => e.degree)) { my = sectionHeader("Education", my, mx, mw - mx); data.education.filter(e => e.degree).forEach(edu => { if (my < 60) return; page.drawText(edu.degree, { x: mx, y: my, size: 9.5, font: bold, color: dkgray }); page.drawText(edu.year, { x: mw - 40, y: my, size: 7.5, font: regular, color: lgray }); my -= 13; page.drawText(edu.institution, { x: mx, y: my, size: 8.5, font: regular, color: gray }); my -= 14; }); }
    if (data.skills) { sy = sectionHeader("Skills", sy, sx, sw); data.skills.split(",").forEach(s => { page.drawText(s.trim(), { x: sx, y: sy, size: 8, font: regular, color: accent }); sy -= 16; }); }
    if (data.languages) { sy = sectionHeader("Languages", sy, sx, sw); data.languages.split(",").forEach(l => { page.drawText(l.trim(), { x: sx, y: sy, size: 8.5, font: regular, color: gray }); sy -= 13; }); }
  } else {
    // Classic / Harvard / ATS / Minimal / Europass / Academic / Creative
    let y = H - 48;
    const nameW = bold.widthOfTextAtSize(name, 24);
    page.drawText(name,  { x: (W - nameW) / 2, y, size: 24, font: bold, color: black }); y -= 22;
    const titleW = italic.widthOfTextAtSize(title, 10);
    page.drawText(title, { x: (W - titleW) / 2, y, size: 10, font: italic, color: gray }); y -= 14;
    const cW = regular.widthOfTextAtSize(contact, 8);
    page.drawText(contact, { x: (W - cW) / 2, y, size: 8, font: regular, color: lgray }); y -= 10;
    page.drawLine({ start: { x: 36, y }, end: { x: W - 36, y }, thickness: 1.5, color: black }); y -= 20;
    const mx = 36, mw = W - 72;
    if (data.summary) { y = sectionHeader("Profile", y, mx, mw); y = drawText(data.summary, { x: mx, y, size: 9.5, color: dkgray, maxWidth: mw, lineHeight: 15 }); y -= 10; }
    if (data.experience.some(e => e.title)) { y = sectionHeader("Experience", y, mx, mw); data.experience.filter(e => e.title).forEach(exp => { if (y < 60) return; page.drawText(exp.title, { x: mx, y, size: 10, font: bold, color: black }); page.drawText(exp.period, { x: W - 80, y, size: 8, font: regular, color: lgray }); y -= 14; page.drawText(exp.company, { x: mx, y, size: 9, font: italic, color: gray }); y -= 13; if (exp.description) { y = drawText(exp.description, { x: mx, y, size: 9, color: dkgray, maxWidth: mw, lineHeight: 14 }); } y -= 8; }); }
    if (data.education.some(e => e.degree)) { y = sectionHeader("Education", y, mx, mw); data.education.filter(e => e.degree).forEach(edu => { if (y < 60) return; page.drawText(edu.degree, { x: mx, y, size: 10, font: bold, color: black }); page.drawText(edu.year, { x: W - 80, y, size: 8, font: regular, color: lgray }); y -= 14; page.drawText(edu.institution, { x: mx, y, size: 9, font: italic, color: gray }); y -= 14; }); }
    if (data.skills) { y -= 4; page.drawLine({ start: { x: 36, y }, end: { x: W - 36, y }, thickness: 0.5, color: rgb(0.8,0.8,0.8) }); y -= 16; page.drawText("CORE SKILLS", { x: 36, y, size: 8, font: bold, color: black }); y -= 13; page.drawText(data.skills, { x: 36, y, size: 9, font: regular, color: dkgray }); }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `cv-${(data.name || "resume").toLowerCase().replace(/\s+/g, "-")}.pdf`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── Export as Image (PNG / JPEG) ─────────────────────────────────────────────
async function exportCVAsImage(format: "png" | "jpeg") {
  const previewEl = document.getElementById("cv-preview-target");
  if (!previewEl) { toast.error("Preview not found"); return; }
  try {
    const { default: html2canvas } = await import("html2canvas" as any);
    const canvas = await (html2canvas as any)(previewEl, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = `cv.${format}`;
    link.href = canvas.toDataURL(format === "jpeg" ? "image/jpeg" : "image/png", 0.95);
    link.click();
  } catch {
    toast.error("Image export failed — PDF export is always available.");
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "personal",   label: "Personal",   icon: User },
  { id: "photo",      label: "Photo",      icon: Camera },
  { id: "links",      label: "Links",      icon: Link2 },
  { id: "summary",    label: "Summary",    icon: AlignLeft },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education",  label: "Education",  icon: GraduationCap },
  { id: "skills",     label: "Skills",     icon: Wrench },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

const TEMPLATE_CATEGORIES = ["All", "Classic", "Professional", "Creative", "Minimal", "Academic", "International"];

export default function CVResumeBuilder() {
  const navigate = useNavigate();
  const [template,          setTemplate]          = useState<Template>("modern");
  const [activeSection,     setActiveSection]     = useState<SectionId>("personal");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [isExporting,       setIsExporting]       = useState(false);
  const [exportMenuOpen,    setExportMenuOpen]    = useState(false);
  const [brandAssetOpen,    setBrandAssetOpen]    = useState(false);
  const [typoOpen,          setTypoOpen]          = useState(false);
  const [templateCategory,  setTemplateCategory]  = useState("All");
  const [logoUrl,           setLogoUrl]           = useState("");
  const [logoSize,          setLogoSize]          = useState(80);
  // Typography
  const [cvFontFamily, setCvFontFamily] = useState("");
  const [cvFontBold,   setCvFontBold]   = useState(false);
  const [cvFontItalic, setCvFontItalic] = useState(false);
  const [cvFontSize,   setCvFontSize]   = useState<number | null>(null);

  const [data, setData] = useState<CVData>({
    name: "", title: "", email: "", phone: "", location: "",
    linkedin: "", website: "", github: "", portfolio: "",
    summary: "",
    experience: [{ title: "", company: "", period: "", description: "" }],
    education:  [{ degree: "", institution: "", year: "" }],
    skills: "", languages: "", certifications: "",
    socialLinks: [{ label: "", url: "" }],
    photoUrl: "",
  });

  const set = (k: keyof CVData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setData(prev => ({ ...prev, [k]: e.target.value }));

  const handleExtractedCV = (extracted: Record<string, unknown>) => {
    setData(prev => ({
      ...prev,
      name:      extracted.name      ? String(extracted.name)      : prev.name,
      title:     extracted.title     ? String(extracted.title)     : prev.title,
      email:     extracted.email     ? String(extracted.email)     : prev.email,
      phone:     extracted.phone     ? String(extracted.phone)     : prev.phone,
      location:  extracted.location  ? String(extracted.location)  : prev.location,
      linkedin:  extracted.linkedin  ? String(extracted.linkedin)  : prev.linkedin,
      website:   extracted.website   ? String(extracted.website)   : prev.website,
      summary:   extracted.summary   ? String(extracted.summary)   : prev.summary,
      skills:    extracted.skills    ? String(extracted.skills)    : prev.skills,
      languages: extracted.languages ? String(extracted.languages) : prev.languages,
      experience: Array.isArray(extracted.experience) && extracted.experience.length
        ? (extracted.experience as Record<string, unknown>[]).map(e => ({
            title:       String(e.title       ?? ""),
            company:     String(e.company     ?? ""),
            period:      String(e.period      ?? ""),
            description: String(e.description ?? ""),
          }))
        : prev.experience,
      education: Array.isArray(extracted.education) && extracted.education.length
        ? (extracted.education as Record<string, unknown>[]).map(e => ({
            degree:      String(e.degree      ?? ""),
            institution: String(e.institution ?? ""),
            year:        String(e.year        ?? ""),
          }))
        : prev.education,
    }));
  };

  const setExp = (i: number, k: keyof Experience, v: string) =>
    setData(prev => { const exp = [...prev.experience]; exp[i] = { ...exp[i], [k]: v }; return { ...prev, experience: exp }; });
  const setEdu = (i: number, k: keyof Education, v: string) =>
    setData(prev => { const edu = [...prev.education]; edu[i] = { ...edu[i], [k]: v }; return { ...prev, education: edu }; });
  const setLink = (i: number, k: keyof SocialLink, v: string) =>
    setData(prev => { const links = [...prev.socialLinks]; links[i] = { ...links[i], [k]: v }; return { ...prev, socialLinks: links }; });

  const addExp  = () => setData(prev => ({ ...prev, experience:  [...prev.experience,  { title: "", company: "", period: "", description: "" }] }));
  const delExp  = (i: number) => setData(prev => ({ ...prev, experience:  prev.experience.filter((_, j) => j !== i) }));
  const addEdu  = () => setData(prev => ({ ...prev, education:   [...prev.education,   { degree: "", institution: "", year: "" }] }));
  const delEdu  = (i: number) => setData(prev => ({ ...prev, education:   prev.education.filter((_, j)  => j !== i) }));
  const addLink = () => setData(prev => ({ ...prev, socialLinks: [...prev.socialLinks, { label: "", url: "" }] }));
  const delLink = (i: number) => setData(prev => ({ ...prev, socialLinks: prev.socialLinks.filter((_, j) => j !== i) }));

  const generateSummary = async () => {
    if (!data.name && !data.title) { toast.error("Enter your name and job title first."); return; }
    setGeneratingSummary(true);
    try {
      const { data: fnData, error } = await supabase.functions.invoke("cv-summary-generator", {
        body: { name: data.name, title: data.title, skills: data.skills, experience: data.experience, education: data.education, languages: data.languages },
      });
      if (error) throw error;
      if (fnData?.error) { toast.error(fnData.error); return; }
      if (fnData?.summary) { setData(prev => ({ ...prev, summary: fnData.summary })); toast.success("AI summary generated!"); }
      else toast.error("Could not generate summary. Try again.");
    } catch (err) {
      console.error(err);
      toast.error("Summary generation failed.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleExport = async (format: "pdf" | "png" | "jpeg" = "pdf") => {
    setIsExporting(true);
    setExportMenuOpen(false);
    try {
      if (format === "pdf") {
        await exportCVAsPDF(data, template);
        toast.success("CV exported as PDF!");
      } else {
        await exportCVAsImage(format);
        toast.success(`CV exported as ${format.toUpperCase()}!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredTemplates = TEMPLATES.filter(t =>
    templateCategory === "All" || t.category === templateCategory
  );

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--pearl-1,48 30% 97%))" }}>

      {/* ── Sticky Header ──────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/toolkit/corporate-suite")}
              className="gap-1.5 h-8 text-xs text-[hsl(var(--muted-foreground))]">
              <ArrowLeft size={13} /> Back
            </Button>
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-[hsl(var(--muted-foreground))]">
              <LayoutGrid size={10} /><span>Toolkit</span>
              <ChevronRight size={9} /><span>Corporate Suite</span>
              <ChevronRight size={9} /><span className="text-[hsl(var(--foreground))] font-semibold">CV / Resume</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <FileText size={13} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[hsl(var(--foreground))] leading-none">CV / Resume Builder</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">12 Templates · AI Photo · PDF + Image</p>
              </div>
            </div>
            {/* Export dropdown */}
            <div className="relative">
              <Button
                onClick={() => setExportMenuOpen(o => !o)}
                disabled={isExporting}
                className="gap-2 h-8 text-xs font-semibold text-white hover:opacity-90"
                style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))" }}>
                {isExporting ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
                {isExporting ? "Exporting…" : "Export"}
                <ChevronDown size={11} />
              </Button>
              {exportMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-[hsl(var(--border))] rounded-xl shadow-lg p-1 min-w-[140px] z-50">
                  {[
                    { label: "Export PDF",  format: "pdf"  as const, icon: "📄" },
                    { label: "Export PNG",  format: "png"  as const, icon: "🖼️" },
                    { label: "Export JPEG", format: "jpeg" as const, icon: "📷" },
                  ].map(opt => (
                    <button key={opt.format} onClick={() => handleExport(opt.format)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-[hsl(var(--muted))] text-left">
                      <span>{opt.icon}</span> {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

        {/* ── Left: Controls ────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Scan Existing CV */}
          <DocumentExtractorUpload
            extractionType="cv"
            onExtracted={handleExtractedCV}
            label="Scan Existing CV / Resume"
            hint="Upload a PDF or photo of your current CV to pre-fill all fields with AI Vision."
          />

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
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] py-2">Logo shown in CV header.</p>
                  <BrandAssetLibrary
                    assetTypes={["monogram", "logo"]}
                    selectedUrl={logoUrl}
                    onSelect={asset => setLogoUrl(asset.file_url)}
                    showSizeControl sizeValue={logoSize} onSizeChange={setLogoSize}
                    sizeLabel="Logo Size" sizeMin={30} sizeMax={120}
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Typography */}
          <Collapsible open={typoOpen} onOpenChange={setTypoOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <Type size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Typography</span>
                    {(cvFontBold || cvFontItalic || cvFontSize !== null || cvFontFamily) && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${typoOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 pt-3 border-t border-[hsl(var(--border))] space-y-4">
                  {/* Bold / Italic toggles */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] mb-2">Style</p>
                    <div className="flex gap-2">
                      {[
                        { label: "B", active: cvFontBold,   toggle: () => setCvFontBold(b => !b),   style: { fontWeight: 700 } },
                        { label: "I", active: cvFontItalic, toggle: () => setCvFontItalic(i => !i), style: { fontStyle: "italic" } },
                      ].map(btn => (
                        <button key={btn.label} onClick={btn.toggle}
                          className={`w-10 h-10 rounded-xl text-sm border-2 transition-all font-serif ${
                            btn.active
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                          style={btn.style}>
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font size */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Name Size</p>
                      <div className="flex items-center gap-2">
                        {cvFontSize !== null && (
                          <button onClick={() => setCvFontSize(null)} className="text-[9px] text-[hsl(var(--gold-dark))] hover:underline">Auto</button>
                        )}
                        <span className="text-[10px] font-mono text-[hsl(var(--foreground))]">
                          {cvFontSize !== null ? `${cvFontSize}pt` : "Auto"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCvFontSize(s => Math.max(8, (s ?? 20) - 0.5))}
                        className="w-7 h-7 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] flex-shrink-0">
                        <Minus size={11} />
                      </button>
                      <input type="range" min={8} max={36} step={0.5}
                        value={cvFontSize ?? 20}
                        onChange={e => setCvFontSize(Number(e.target.value))}
                        className="flex-1 h-1.5 accent-[hsl(var(--gold))]" />
                      <button onClick={() => setCvFontSize(s => Math.min(36, (s ?? 20) + 0.5))}
                        className="w-7 h-7 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] flex-shrink-0">
                        <Plus size={11} />
                      </button>
                    </div>
                    <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-1">Range: 8–36 pt · Auto = template default</p>
                  </div>

                  {/* Font family */}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] mb-2">Font Family</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FONT_FAMILIES.map(f => (
                        <button key={f.label}
                          onClick={() => setCvFontFamily(cvFontFamily === f.value ? "" : f.value)}
                          className={`px-2 py-1.5 rounded-lg text-[10px] border transition-all text-left ${
                            cvFontFamily === f.value
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                          style={{ fontFamily: f.value }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Template picker */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-2 block">
              Template — {TEMPLATES.length} styles
            </Label>
            {/* Category filter */}
            <div className="flex gap-1 flex-wrap mb-3">
              {TEMPLATE_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setTemplateCategory(cat)}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-medium border transition-all ${
                    templateCategory === cat
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filteredTemplates.map(t => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  className={`relative py-2.5 px-3 rounded-xl text-left border transition-all ${
                    template === t.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.07)]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]"
                  }`}>
                  {template === t.id && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
                      <Check size={8} className="text-white" />
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: t.accent }} />
                    <p className={`text-xs font-semibold ${template === t.id ? "text-[hsl(var(--gold-dark))]" : "text-[hsl(var(--foreground))]"}`}>{t.label}</p>
                  </div>
                  <p className="text-[9px] text-[hsl(var(--muted-foreground))] pl-5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Section tabs */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
            <div className="border-b border-[hsl(var(--border))] flex overflow-x-auto">
              {SECTIONS.map(s => {
                const Icon = s.icon;
                return (
                  <button key={s.id} onClick={() => setActiveSection(s.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-medium border-b-2 transition-colors ${
                      activeSection === s.id
                        ? "border-[hsl(var(--gold))] text-[hsl(var(--gold-dark))] bg-[hsl(var(--gold)/0.04)]"
                        : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    }`}>
                    <Icon size={11} />{s.label}
                  </button>
                );
              })}
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                <motion.div key={activeSection} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

                  {/* Personal */}
                  {activeSection === "personal" && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { key: "name"     as const, label: "Full Name",    placeholder: "Ahmed Al-Mansoori",               span: 2 },
                        { key: "title"    as const, label: "Job Title",    placeholder: "Senior Real Estate Consultant",   span: 2 },
                        { key: "email"    as const, label: "Email",        placeholder: "ahmed@email.com" },
                        { key: "phone"    as const, label: "Phone",        placeholder: "+971 50 000 0000" },
                        { key: "location" as const, label: "Location",     placeholder: "Dubai, UAE" },
                        { key: "linkedin" as const, label: "LinkedIn URL", placeholder: "linkedin.com/in/ahmed" },
                        { key: "github"   as const, label: "GitHub",       placeholder: "github.com/ahmed" },
                        { key: "website"  as const, label: "Website",      placeholder: "www.portfolio.ae" },
                      ].map(f => (
                        <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
                          <Label className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1 block">{f.label}</Label>
                          <Input value={data[f.key]} onChange={set(f.key)} placeholder={f.placeholder} className="h-8 text-xs" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Photo */}
                  {activeSection === "photo" && (
                    <div className="space-y-3">
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Upload your profile photo — AI can remove the background for a clean, professional look.
                      </p>
                      <PhotoUploadPanel
                        photoUrl={data.photoUrl}
                        onPhotoChange={url => setData(prev => ({ ...prev, photoUrl: url }))}
                      />
                      <div className="bg-[hsl(var(--gold)/0.05)] border border-[hsl(var(--gold)/0.2)] rounded-xl p-3 text-[10px] text-[hsl(var(--muted-foreground))]">
                        <span className="font-semibold text-[hsl(var(--foreground))]">✨ AI Tip:</span> For best results, upload a photo with a clear subject. The AI background remover uses Gemini Vision.
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  {activeSection === "links" && (
                    <div className="space-y-4">
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        Add custom links — these appear as clickable URLs in PDF and preview.
                      </p>
                      {/* Quick links */}
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { key: "portfolio" as const, label: "Portfolio / Website", placeholder: "www.myportfolio.ae" },
                          { key: "github"    as const, label: "GitHub",              placeholder: "github.com/username" },
                        ].map(f => (
                          <div key={f.key}>
                            <Label className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1 block">{f.label}</Label>
                            <Input value={data[f.key]} onChange={set(f.key)} placeholder={f.placeholder} className="h-8 text-xs" />
                          </div>
                        ))}
                      </div>
                      {/* Custom links */}
                      <div>
                        <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] mb-2">Custom Links</p>
                        {data.socialLinks.map((link, i) => (
                          <div key={i} className="flex gap-2 mb-2 items-start">
                            <div className="flex-1 space-y-1">
                              <Input value={link.label} onChange={e => setLink(i, "label", e.target.value)} placeholder="Label (e.g. Behance)" className="h-7 text-xs" />
                              <Input value={link.url}   onChange={e => setLink(i, "url",   e.target.value)} placeholder="https://..." className="h-7 text-xs" />
                            </div>
                            {i > 0 && (
                              <button onClick={() => delLink(i)} className="text-destructive hover:opacity-70 mt-1"><Trash2 size={12} /></button>
                            )}
                          </div>
                        ))}
                        <Button size="sm" variant="outline" onClick={addLink} className="w-full h-7 text-xs gap-1">
                          <Plus size={11} /> Add Link
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {activeSection === "summary" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Write or generate with AI</p>
                        <Button size="sm" variant="outline" onClick={generateSummary} disabled={generatingSummary}
                          className="h-7 text-xs gap-1.5 border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.06)]">
                          <Sparkles size={11} className={generatingSummary ? "animate-spin" : ""} />
                          {generatingSummary ? "Generating…" : "AI Generate"}
                        </Button>
                      </div>
                      <Textarea value={data.summary} onChange={set("summary")}
                        placeholder="A results-driven professional with 8+ years of experience…"
                        className="text-xs min-h-[120px] resize-none" />
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        💡 Fill in Personal Info & Experience first for better AI results.
                      </p>
                    </div>
                  )}

                  {/* Experience */}
                  {activeSection === "experience" && (
                    <div className="space-y-4">
                      {data.experience.map((exp, i) => (
                        <div key={i} className="space-y-2 pb-4 border-b border-[hsl(var(--border))] last:border-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">Position {i + 1}</p>
                            {i > 0 && <button onClick={() => delExp(i)} className="text-destructive hover:opacity-70"><Trash2 size={11} /></button>}
                          </div>
                          <Input value={exp.title}       onChange={e => setExp(i, "title",       e.target.value)} placeholder="Job Title"       className="h-7 text-xs" />
                          <Input value={exp.company}     onChange={e => setExp(i, "company",     e.target.value)} placeholder="Company Name"    className="h-7 text-xs" />
                          <Input value={exp.period}      onChange={e => setExp(i, "period",      e.target.value)} placeholder="2020 – Present"  className="h-7 text-xs" />
                          <Textarea value={exp.description} onChange={e => setExp(i, "description", e.target.value)}
                            placeholder="Key achievements…" className="text-xs min-h-[60px] resize-none" />
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={addExp} className="w-full h-7 text-xs gap-1">
                        <Plus size={11} /> Add Position
                      </Button>
                    </div>
                  )}

                  {/* Education */}
                  {activeSection === "education" && (
                    <div className="space-y-4">
                      {data.education.map((edu, i) => (
                        <div key={i} className="space-y-2 pb-4 border-b border-[hsl(var(--border))] last:border-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">Entry {i + 1}</p>
                            {i > 0 && <button onClick={() => delEdu(i)} className="text-destructive hover:opacity-70"><Trash2 size={11} /></button>}
                          </div>
                          <Input value={edu.degree}      onChange={e => setEdu(i, "degree",      e.target.value)} placeholder="BSc Business Administration" className="h-7 text-xs" />
                          <Input value={edu.institution} onChange={e => setEdu(i, "institution", e.target.value)} placeholder="University / Institution"     className="h-7 text-xs" />
                          <Input value={edu.year}        onChange={e => setEdu(i, "year",        e.target.value)} placeholder="2016"                        className="h-7 text-xs" />
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={addEdu} className="w-full h-7 text-xs gap-1">
                        <Plus size={11} /> Add Entry
                      </Button>
                    </div>
                  )}

                  {/* Skills */}
                  {activeSection === "skills" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1.5 block">Skills <span className="font-normal">(comma-separated)</span></Label>
                        <Textarea value={data.skills} onChange={set("skills")}
                          placeholder="Sales, Negotiation, CRM, Market Analysis…" className="text-xs min-h-[70px] resize-none" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1.5 block">Languages</Label>
                        <Input value={data.languages} onChange={set("languages")}
                          placeholder="Arabic (Native), English (Fluent), French (Intermediate)" className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1.5 block">Certifications</Label>
                        <Textarea value={data.certifications} onChange={set("certifications")}
                          placeholder="RERA Certified, PMP, CFA Level 1…" className="text-xs min-h-[60px] resize-none" />
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Right: Live Preview ─────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
              <FileText size={11} /> Live Preview — A4
            </Label>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
              {TEMPLATES.find(t => t.id === template)?.label} · {TEMPLATES.find(t => t.id === template)?.category}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={template} id="cv-preview-target"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}>
              <CVPreview
                data={data} template={template} scale={0.85}
                fontFamily={cvFontFamily || undefined}
                fontWeight={cvFontBold   ? "bold"   : undefined}
                fontStyle ={cvFontItalic ? "italic" : undefined}
                fontSizeOverride={cvFontSize}
              />
            </motion.div>
          </AnimatePresence>

          {/* All templates mini grid */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-3 block">
              All Templates ({TEMPLATES.length})
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                    template === t.id ? "border-[hsl(var(--gold))] shadow-md" : "border-transparent hover:border-[hsl(var(--border))]"
                  }`}>
                  <CVPreview data={data} template={t.id} scale={0.2}
                    fontFamily={cvFontFamily || undefined}
                    fontWeight={cvFontBold   ? "bold"   : undefined}
                    fontStyle ={cvFontItalic ? "italic" : undefined}
                    fontSizeOverride={cvFontSize}
                  />
                  {template === t.id && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
                      <Check size={8} className="text-white" />
                    </div>
                  )}
                  <p className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-semibold py-1 bg-black/50 text-white">{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Export info */}
          <div className="bg-[hsl(var(--gold)/0.06)] border border-[hsl(var(--gold)/0.2)] rounded-2xl p-4 text-xs space-y-2">
            <p className="font-semibold text-[hsl(var(--foreground))]">📤 Export Options</p>
            <div className="space-y-1 text-[hsl(var(--muted-foreground))]">
              <p><span className="font-medium text-[hsl(var(--foreground))]">PDF</span> — Print-ready A4, all templates</p>
              <p><span className="font-medium text-[hsl(var(--foreground))]">PNG</span> — High-res image (3× scale), transparent background</p>
              <p><span className="font-medium text-[hsl(var(--foreground))]">JPEG</span> — Compressed image for sharing online</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
