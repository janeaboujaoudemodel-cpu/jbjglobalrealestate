import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, FileText, Plus, Trash2, Sparkles, Download,
  ChevronRight, LayoutGrid, Check, RefreshCw, User, Briefcase,
  GraduationCap, Wrench, Languages, AlignLeft, ImageIcon, ChevronDown,
} from "lucide-react";
import { DocumentExtractorUpload } from "@/components/corporate-suite/DocumentExtractorUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandAssetLibrary, BrandAsset } from "@/components/corporate-suite/BrandAssetLibrary";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

// ─── Types ────────────────────────────────────────────────────────────────────
type Template = "executive" | "modern" | "classic" | "creative";

interface Experience { title: string; company: string; period: string; description: string }
interface Education  { degree: string; institution: string; year: string }

interface CVData {
  name: string; title: string; email: string; phone: string;
  location: string; linkedin: string; website: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string;
  languages: string;
}

// ─── Template config ──────────────────────────────────────────────────────────
const TEMPLATES: { id: Template; label: string; desc: string; accent: string; bg: string }[] = [
  { id: "executive", label: "Executive", desc: "Dark sidebar + serif", accent: "#1e293b", bg: "#f8fafc" },
  { id: "modern",    label: "Modern",    desc: "Blue header + clean", accent: "#1e40af", bg: "#ffffff" },
  { id: "classic",   label: "Classic",   desc: "Minimal black & white", accent: "#111827", bg: "#fafafa" },
  { id: "creative",  label: "Creative",  desc: "Violet + bold typography", accent: "#6d28d9", bg: "#fdf4ff" },
];

// ─── Live Preview ─────────────────────────────────────────────────────────────
function CVPreview({ data, template, scale = 1 }: { data: CVData; template: Template; scale?: number }) {
  const cfg = TEMPLATES.find(t => t.id === template)!;
  const { accent, bg } = cfg;
  const white = "#ffffff";
  const gray  = "#6b7280";
  const lgray = "#9ca3af";
  const dkgray = "#374151";

  const name    = data.name    || "Your Name";
  const title   = data.title   || "Professional Title";
  const px = 28 * scale;
  const fontSize = (n: number) => n * scale;

  const contactItems = [data.email, data.phone, data.location, data.linkedin, data.website].filter(Boolean);

  // ── EXECUTIVE: Dark left sidebar ──────────────────────────────────────
  if (template === "executive") {
    return (
      <div style={{ display: "flex", background: bg, fontFamily: "Georgia, serif", fontSize: fontSize(10), color: dkgray, minHeight: 400 * scale, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8 }}>
        {/* Sidebar */}
        <div style={{ width: 110 * scale, background: accent, color: white, padding: `${24 * scale}px ${16 * scale}px`, flexShrink: 0 }}>
          {/* Monogram */}
          <div style={{ width: 44 * scale, height: 44 * scale, borderRadius: "50%", background: `rgba(255,255,255,0.15)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 * scale, fontSize: fontSize(18), fontWeight: 700 }}>
            {name.charAt(0)}
          </div>
          <p style={{ fontSize: fontSize(7), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.5, marginBottom: 16 * scale }}>Contact</p>
          {contactItems.map((c, i) => <p key={i} style={{ fontSize: fontSize(7.5), opacity: 0.8, marginBottom: 5 * scale, wordBreak: "break-all" }}>{c}</p>)}

          {data.skills && <>
            <p style={{ fontSize: fontSize(7), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.5, marginTop: 18 * scale, marginBottom: 10 * scale }}>Skills</p>
            {data.skills.split(",").map((s, i) => (
              <p key={i} style={{ fontSize: fontSize(7.5), opacity: 0.8, marginBottom: 4 * scale }}>{s.trim()}</p>
            ))}
          </>}

          {data.languages && <>
            <p style={{ fontSize: fontSize(7), fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.5, marginTop: 18 * scale, marginBottom: 6 * scale }}>Languages</p>
            <p style={{ fontSize: fontSize(7.5), opacity: 0.8 }}>{data.languages}</p>
          </>}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: `${24 * scale}px ${px}px` }}>
          <h1 style={{ fontSize: fontSize(20), fontWeight: 700, color: accent, margin: 0 }}>{name}</h1>
          <p style={{ fontSize: fontSize(10), color: gray, marginTop: 3 * scale, marginBottom: 16 * scale }}>{title}</p>

          {data.summary && (
            <Section label="Summary" accent={accent} scale={scale}>
              <p style={{ fontSize: fontSize(9), color: gray, lineHeight: 1.6 }}>{data.summary}</p>
            </Section>
          )}
          {data.experience.some(e => e.title) && (
            <Section label="Experience" accent={accent} scale={scale}>
              {data.experience.filter(e => e.title).map((exp, i) => (
                <ExpEntry key={i} exp={exp} accent={accent} gray={gray} lgray={lgray} scale={scale} />
              ))}
            </Section>
          )}
          {data.education.some(e => e.degree) && (
            <Section label="Education" accent={accent} scale={scale}>
              {data.education.filter(e => e.degree).map((edu, i) => (
                <EduEntry key={i} edu={edu} accent={accent} gray={gray} lgray={lgray} scale={scale} />
              ))}
            </Section>
          )}
        </div>
      </div>
    );
  }

  // ── MODERN: Blue header bar ────────────────────────────────────────────
  if (template === "modern") {
    return (
      <div style={{ background: bg, fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: fontSize(10), color: dkgray, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: accent, color: white, padding: `${22 * scale}px ${px}px` }}>
          <h1 style={{ fontSize: fontSize(22), fontWeight: 800, margin: 0 }}>{name}</h1>
          <p style={{ fontSize: fontSize(10), opacity: 0.8, marginTop: 3 * scale, marginBottom: 10 * scale }}>{title}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: `${4 * scale}px ${16 * scale}px` }}>
            {contactItems.map((c, i) => <span key={i} style={{ fontSize: fontSize(8), opacity: 0.75 }}>{c}</span>)}
          </div>
        </div>
        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 0 }}>
          <div style={{ padding: `${20 * scale}px ${px}px`, borderRight: `1px solid #e5e7eb` }}>
            {data.summary && (
              <Section label="Summary" accent={accent} scale={scale}>
                <p style={{ fontSize: fontSize(9), color: gray, lineHeight: 1.6 }}>{data.summary}</p>
              </Section>
            )}
            {data.experience.some(e => e.title) && (
              <Section label="Experience" accent={accent} scale={scale}>
                {data.experience.filter(e => e.title).map((exp, i) => (
                  <ExpEntry key={i} exp={exp} accent={accent} gray={gray} lgray={lgray} scale={scale} />
                ))}
              </Section>
            )}
            {data.education.some(e => e.degree) && (
              <Section label="Education" accent={accent} scale={scale}>
                {data.education.filter(e => e.degree).map((edu, i) => (
                  <EduEntry key={i} edu={edu} accent={accent} gray={gray} lgray={lgray} scale={scale} />
                ))}
              </Section>
            )}
          </div>
          <div style={{ padding: `${20 * scale}px ${14 * scale}px` }}>
            {data.skills && (
              <Section label="Skills" accent={accent} scale={scale}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 * scale }}>
                  {data.skills.split(",").map((s, i) => (
                    <span key={i} style={{ fontSize: fontSize(7.5), background: `${accent}15`, color: accent, padding: `${2 * scale}px ${6 * scale}px`, borderRadius: 4 }}>{s.trim()}</span>
                  ))}
                </div>
              </Section>
            )}
            {data.languages && (
              <Section label="Languages" accent={accent} scale={scale}>
                <p style={{ fontSize: fontSize(8.5), color: gray }}>{data.languages}</p>
              </Section>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── CLASSIC: Clean monochrome ──────────────────────────────────────────
  if (template === "classic") {
    return (
      <div style={{ background: bg, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: fontSize(10), color: "#111", padding: `${px}px`, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8 }}>
        <div style={{ textAlign: "center", marginBottom: 16 * scale, borderBottom: "2px solid #111", paddingBottom: 14 * scale }}>
          <h1 style={{ fontSize: fontSize(24), fontWeight: 700, textTransform: "uppercase", letterSpacing: 3, margin: 0 }}>{name}</h1>
          <p style={{ fontSize: fontSize(10), color: gray, marginTop: 4 * scale }}>{title}</p>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: `${3 * scale}px ${14 * scale}px`, marginTop: 8 * scale }}>
            {contactItems.map((c, i) => <span key={i} style={{ fontSize: fontSize(8), color: gray }}>{c}</span>)}
          </div>
        </div>
        {data.summary && (
          <Section label="Profile" accent={accent} scale={scale} classic>
            <p style={{ fontSize: fontSize(9), color: dkgray, lineHeight: 1.7 }}>{data.summary}</p>
          </Section>
        )}
        {data.experience.some(e => e.title) && (
          <Section label="Professional Experience" accent={accent} scale={scale} classic>
            {data.experience.filter(e => e.title).map((exp, i) => (
              <ExpEntry key={i} exp={exp} accent={accent} gray={gray} lgray={lgray} scale={scale} />
            ))}
          </Section>
        )}
        {data.education.some(e => e.degree) && (
          <Section label="Education" accent={accent} scale={scale} classic>
            {data.education.filter(e => e.degree).map((edu, i) => (
              <EduEntry key={i} edu={edu} accent={accent} gray={gray} lgray={lgray} scale={scale} />
            ))}
          </Section>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 * scale }}>
          {data.skills && (
            <Section label="Core Skills" accent={accent} scale={scale} classic>
              <p style={{ fontSize: fontSize(9), color: dkgray }}>{data.skills}</p>
            </Section>
          )}
          {data.languages && (
            <Section label="Languages" accent={accent} scale={scale} classic>
              <p style={{ fontSize: fontSize(9), color: dkgray }}>{data.languages}</p>
            </Section>
          )}
        </div>
      </div>
    );
  }

  // ── CREATIVE: Violet + bold ────────────────────────────────────────────
  return (
    <div style={{ background: bg, fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: fontSize(10), color: dkgray, boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 8, overflow: "hidden" }}>
      {/* Top accent bar */}
      <div style={{ height: 5 * scale, background: `linear-gradient(90deg, ${accent}, #c026d3)` }} />
      <div style={{ padding: `${22 * scale}px ${px}px` }}>
        {/* Name area */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 * scale }}>
          <div>
            <h1 style={{ fontSize: fontSize(26), fontWeight: 900, color: accent, margin: 0, lineHeight: 1.1 }}>{name}</h1>
            <p style={{ fontSize: fontSize(11), color: gray, marginTop: 4 * scale }}>{title}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            {contactItems.slice(0, 4).map((c, i) => <p key={i} style={{ fontSize: fontSize(7.5), color: gray, margin: `${2 * scale}px 0` }}>{c}</p>)}
          </div>
        </div>
        {/* Divider */}
        <div style={{ height: 2, background: `${accent}30`, marginBottom: 18 * scale }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 20 * scale }}>
          <div>
            {data.summary && (
              <Section label="About Me" accent={accent} scale={scale}>
                <p style={{ fontSize: fontSize(9), color: gray, lineHeight: 1.6 }}>{data.summary}</p>
              </Section>
            )}
            {data.experience.some(e => e.title) && (
              <Section label="Experience" accent={accent} scale={scale}>
                {data.experience.filter(e => e.title).map((exp, i) => (
                  <ExpEntry key={i} exp={exp} accent={accent} gray={gray} lgray={lgray} scale={scale} creative />
                ))}
              </Section>
            )}
            {data.education.some(e => e.degree) && (
              <Section label="Education" accent={accent} scale={scale}>
                {data.education.filter(e => e.degree).map((edu, i) => (
                  <EduEntry key={i} edu={edu} accent={accent} gray={gray} lgray={lgray} scale={scale} />
                ))}
              </Section>
            )}
          </div>
          <div>
            {data.skills && (
              <Section label="Skills" accent={accent} scale={scale}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 * scale }}>
                  {data.skills.split(",").map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 * scale }}>
                      <div style={{ width: 6 * scale, height: 6 * scale, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                      <span style={{ fontSize: fontSize(8), color: dkgray }}>{s.trim()}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
            {data.languages && (
              <Section label="Languages" accent={accent} scale={scale}>
                {data.languages.split(",").map((l, i) => (
                  <p key={i} style={{ fontSize: fontSize(8), color: gray, margin: `${3 * scale}px 0` }}>{l.trim()}</p>
                ))}
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function Section({ label, accent, scale, classic, children }: {
  label: string; accent: string; scale: number; classic?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 * scale }}>
      {classic ? (
        <p style={{ fontSize: 9 * scale, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#111", borderBottom: "1px solid #111", paddingBottom: 3 * scale, marginBottom: 8 * scale }}>
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

// ─── PDF Export ───────────────────────────────────────────────────────────────
async function exportCVAsPDF(data: CVData, template: Template) {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

  // A4 at 72 dpi: 595 × 842 pt
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

  const cfg = TEMPLATES.find(t => t.id === template)!;
  const accent = hex(cfg.accent);
  const white  = rgb(1,1,1);
  const black  = rgb(0,0,0);
  const gray   = rgb(0.43,0.43,0.43);
  const lgray  = rgb(0.62,0.62,0.62);
  const dkgray = rgb(0.22,0.22,0.22);

  const name    = data.name    || "Your Name";
  const title   = data.title   || "Professional Title";
  const contact = [data.email, data.phone, data.location, data.linkedin].filter(Boolean).join("  |  ");

  let curY = H - 40; // drawing cursor (top-down)

  // Helper: draw text, returns new Y
  function drawText(text: string, opts: {
    x: number; y: number; size: number; font?: typeof bold; color?: ReturnType<typeof rgb>;
    maxWidth?: number; lineHeight?: number;
  }) {
    const f = opts.font || regular;
    const clr = opts.color || black;
    const w = opts.maxWidth;
    if (!w) {
      page.drawText(text, { x: opts.x, y: opts.y, size: opts.size, font: f, color: clr });
      return opts.y - (opts.lineHeight || opts.size + 3);
    }
    // Word wrap
    const words = text.split(" ");
    let line = "";
    let y = opts.y;
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (f.widthOfTextAtSize(test, opts.size) > w && line) {
        page.drawText(line, { x: opts.x, y, size: opts.size, font: f, color: clr });
        y -= opts.lineHeight || opts.size + 3;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, { x: opts.x, y, size: opts.size, font: f, color: clr });
      y -= opts.lineHeight || opts.size + 3;
    }
    return y;
  }

  function sectionHeader(label: string, y: number, x = 40, w = W - 80) {
    page.drawLine({ start: { x, y: y - 2 }, end: { x: x + w, y: y - 2 }, thickness: 0.6, color: accent, opacity: 0.4 });
    page.drawText(label.toUpperCase(), { x, y, size: 8, font: bold, color: accent });
    return y - 16;
  }

  // ── EXECUTIVE layout ──────────────────────────────────────────────────
  if (template === "executive") {
    const sideW = 160;
    // Sidebar background
    page.drawRectangle({ x: 0, y: 0, width: sideW, height: H, color: hex(cfg.accent) });
    // Monogram circle
    page.drawEllipse({ x: sideW / 2, y: H - 60, xScale: 26, yScale: 26, color: rgb(1,1,1), opacity: 0.15 });
    page.drawText(name.charAt(0), { x: sideW/2 - 8, y: H - 68, size: 20, font: bold, color: white });

    // Sidebar content
    let sY = H - 110;
    page.drawText("CONTACT", { x: 16, y: sY, size: 7, font: bold, color: white, opacity: 0.5 });
    sY -= 14;
    [data.email, data.phone, data.location, data.linkedin].filter(Boolean).forEach(c => {
      page.drawText(c!, { x: 16, y: sY, size: 7.5, font: regular, color: white, opacity: 0.8, maxWidth: sideW - 24 } as any);
      sY -= 13;
    });
    sY -= 10;
    if (data.skills) {
      page.drawText("SKILLS", { x: 16, y: sY, size: 7, font: bold, color: white, opacity: 0.5 });
      sY -= 14;
      data.skills.split(",").forEach(s => {
        page.drawText(s.trim(), { x: 16, y: sY, size: 7.5, font: regular, color: white, opacity: 0.8 });
        sY -= 12;
      });
    }
    if (data.languages) {
      sY -= 6;
      page.drawText("LANGUAGES", { x: 16, y: sY, size: 7, font: bold, color: white, opacity: 0.5 });
      sY -= 14;
      page.drawText(data.languages, { x: 16, y: sY, size: 7.5, font: regular, color: white, opacity: 0.8 });
    }

    // Main content
    const mx = sideW + 24, mw = W - mx - 24;
    let my = H - 48;
    page.drawText(name, { x: mx, y: my, size: 22, font: bold, color: accent });
    my -= 20;
    page.drawText(title, { x: mx, y: my, size: 10, font: italic, color: gray });
    my -= 24;

    if (data.summary) {
      my = sectionHeader("Summary", my, mx, mw);
      my = drawText(data.summary, { x: mx, y: my, size: 9, color: gray, maxWidth: mw, lineHeight: 14 });
      my -= 10;
    }
    if (data.experience.some(e => e.title)) {
      my = sectionHeader("Experience", my, mx, mw);
      data.experience.filter(e => e.title).forEach(exp => {
        if (my < 60) return;
        page.drawText(exp.title,   { x: mx, y: my, size: 9.5, font: bold, color: dkgray });
        page.drawText(exp.period,  { x: W - 60, y: my, size: 8, font: regular, color: lgray });
        my -= 13;
        page.drawText(exp.company, { x: mx, y: my, size: 8.5, font: italic, color: accent });
        my -= 12;
        if (exp.description) {
          my = drawText(exp.description, { x: mx, y: my, size: 8.5, color: gray, maxWidth: mw, lineHeight: 13 });
        }
        my -= 8;
      });
    }
    if (data.education.some(e => e.degree)) {
      my = sectionHeader("Education", my, mx, mw);
      data.education.filter(e => e.degree).forEach(edu => {
        if (my < 60) return;
        page.drawText(edu.degree, { x: mx, y: my, size: 9.5, font: bold, color: dkgray });
        page.drawText(edu.year,   { x: W - 60, y: my, size: 8, font: regular, color: lgray });
        my -= 13;
        page.drawText(edu.institution, { x: mx, y: my, size: 8.5, font: regular, color: gray });
        my -= 14;
      });
    }
  }

  // ── MODERN layout ──────────────────────────────────────────────────────
  else if (template === "modern") {
    // Header bar
    page.drawRectangle({ x: 0, y: H - 110, width: W, height: 110, color: accent });
    page.drawText(name, { x: 36, y: H - 52, size: 24, font: bold, color: white });
    page.drawText(title, { x: 36, y: H - 72, size: 10, font: regular, color: white, opacity: 0.8 });
    page.drawText(contact, { x: 36, y: H - 92, size: 8, font: regular, color: white, opacity: 0.65 });

    const mx = 36, mw = W - 230, sx = W - 185, sw = 170;
    let my = H - 130, sy = H - 130;

    if (data.summary) {
      my = sectionHeader("Summary", my, mx, mw - mx);
      my = drawText(data.summary, { x: mx, y: my, size: 9, color: gray, maxWidth: mw - mx, lineHeight: 14 });
      my -= 10;
    }
    if (data.experience.some(e => e.title)) {
      my = sectionHeader("Experience", my, mx, mw - mx);
      data.experience.filter(e => e.title).forEach(exp => {
        if (my < 60) return;
        page.drawText(exp.title,   { x: mx, y: my, size: 9.5, font: bold, color: dkgray });
        page.drawText(exp.period,  { x: mw - 40, y: my, size: 7.5, font: regular, color: lgray });
        my -= 13;
        page.drawText(exp.company, { x: mx, y: my, size: 8.5, font: italic, color: accent });
        my -= 12;
        if (exp.description) {
          my = drawText(exp.description, { x: mx, y: my, size: 8.5, color: gray, maxWidth: mw - mx, lineHeight: 13 });
        }
        my -= 8;
      });
    }
    if (data.education.some(e => e.degree)) {
      my = sectionHeader("Education", my, mx, mw - mx);
      data.education.filter(e => e.degree).forEach(edu => {
        if (my < 60) return;
        page.drawText(edu.degree,      { x: mx, y: my, size: 9.5, font: bold, color: dkgray });
        page.drawText(edu.year,        { x: mw - 40, y: my, size: 7.5, font: regular, color: lgray });
        my -= 13;
        page.drawText(edu.institution, { x: mx, y: my, size: 8.5, font: regular, color: gray });
        my -= 14;
      });
    }

    // Right column
    page.drawLine({ start: { x: sx - 12, y: H - 130 }, end: { x: sx - 12, y: 40 }, thickness: 0.5, color: rgb(0.9,0.9,0.9) });
    if (data.skills) {
      sy = sectionHeader("Skills", sy, sx, sw);
      data.skills.split(",").forEach(s => {
        page.drawRectangle({ x: sx, y: sy - 2, width: regular.widthOfTextAtSize(s.trim(), 8) + 10, height: 12, color: accent, opacity: 0.1, borderRadius: 3 } as any);
        page.drawText(s.trim(), { x: sx + 5, y: sy, size: 8, font: regular, color: accent });
        sy -= 16;
      });
      sy -= 4;
    }
    if (data.languages) {
      sy = sectionHeader("Languages", sy, sx, sw);
      data.languages.split(",").forEach(l => {
        page.drawText(l.trim(), { x: sx, y: sy, size: 8.5, font: regular, color: gray });
        sy -= 13;
      });
    }
  }

  // ── CLASSIC layout ──────────────────────────────────────────────────────
  else if (template === "classic") {
    let y = H - 48;
    // Centered header
    const nameW = bold.widthOfTextAtSize(name, 24);
    page.drawText(name, { x: (W - nameW) / 2, y, size: 24, font: bold, color: black });
    y -= 22;
    const titleW = italic.widthOfTextAtSize(title, 10);
    page.drawText(title, { x: (W - titleW) / 2, y, size: 10, font: italic, color: gray });
    y -= 14;
    const cW = regular.widthOfTextAtSize(contact, 8);
    page.drawText(contact, { x: (W - cW) / 2, y, size: 8, font: regular, color: lgray });
    y -= 10;
    page.drawLine({ start: { x: 36, y }, end: { x: W - 36, y }, thickness: 1.5, color: black });
    y -= 20;

    const mx = 36, mw = W - 72;
    if (data.summary) {
      y = sectionHeader("Profile", y, mx, mw);
      y = drawText(data.summary, { x: mx, y, size: 9.5, color: dkgray, maxWidth: mw, lineHeight: 15 });
      y -= 10;
    }
    if (data.experience.some(e => e.title)) {
      y = sectionHeader("Professional Experience", y, mx, mw);
      data.experience.filter(e => e.title).forEach(exp => {
        if (y < 60) return;
        page.drawText(exp.title,   { x: mx, y, size: 10, font: bold, color: black });
        page.drawText(exp.period,  { x: W - 80, y, size: 8, font: regular, color: lgray });
        y -= 14;
        page.drawText(exp.company, { x: mx, y, size: 9, font: italic, color: gray });
        y -= 13;
        if (exp.description) {
          y = drawText(exp.description, { x: mx, y, size: 9, color: dkgray, maxWidth: mw, lineHeight: 14 });
        }
        y -= 8;
      });
    }
    if (data.education.some(e => e.degree)) {
      y = sectionHeader("Education", y, mx, mw);
      data.education.filter(e => e.degree).forEach(edu => {
        if (y < 60) return;
        page.drawText(edu.degree,      { x: mx, y, size: 10, font: bold, color: black });
        page.drawText(edu.year,        { x: W - 80, y, size: 8, font: regular, color: lgray });
        y -= 14;
        page.drawText(edu.institution, { x: mx, y, size: 9, font: italic, color: gray });
        y -= 14;
      });
    }
    // Two-column footer
    if (data.skills || data.languages) {
      y -= 4;
      page.drawLine({ start: { x: mx, y }, end: { x: W - mx, y }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
      y -= 16;
      if (data.skills) {
        page.drawText("CORE SKILLS", { x: mx, y, size: 8, font: bold, color: black });
        y -= 13;
        page.drawText(data.skills, { x: mx, y, size: 9, font: regular, color: dkgray });
      }
    }
  }

  // ── CREATIVE layout ──────────────────────────────────────────────────────
  else {
    // Gradient accent bar
    page.drawRectangle({ x: 0, y: H - 5, width: W, height: 5, color: accent });

    let y = H - 52;
    const mx = 36, mw = W - 230, sx = W - 185, sw = 168;

    page.drawText(name, { x: mx, y, size: 26, font: bold, color: accent });
    y -= 22;
    page.drawText(title, { x: mx, y, size: 11, font: regular, color: gray });
    y -= 14;
    page.drawText(contact, { x: mx, y, size: 8, font: regular, color: lgray });
    y -= 16;
    page.drawLine({ start: { x: mx, y }, end: { x: W - mx, y }, thickness: 1.5, color: accent, opacity: 0.2 });
    y -= 20;

    let sy = y;
    if (data.summary) {
      y = sectionHeader("About Me", y, mx, mw - mx);
      y = drawText(data.summary, { x: mx, y, size: 9, color: gray, maxWidth: mw - mx, lineHeight: 14 });
      y -= 10;
    }
    if (data.experience.some(e => e.title)) {
      y = sectionHeader("Experience", y, mx, mw - mx);
      data.experience.filter(e => e.title).forEach(exp => {
        if (y < 60) return;
        page.drawRectangle({ x: mx, y: y - 2, width: 2.5, height: (exp.description ? 36 : 24), color: accent, opacity: 0.4 });
        page.drawText(exp.title,   { x: mx + 10, y, size: 9.5, font: bold, color: dkgray });
        page.drawText(exp.period,  { x: mw - 40, y, size: 7.5, font: regular, color: lgray });
        y -= 13;
        page.drawText(exp.company, { x: mx + 10, y, size: 8.5, font: italic, color: accent });
        y -= 12;
        if (exp.description) {
          y = drawText(exp.description, { x: mx + 10, y, size: 8.5, color: gray, maxWidth: mw - mx - 10, lineHeight: 13 });
        }
        y -= 8;
      });
    }
    if (data.education.some(e => e.degree)) {
      y = sectionHeader("Education", y, mx, mw - mx);
      data.education.filter(e => e.degree).forEach(edu => {
        if (y < 60) return;
        page.drawText(edu.degree,      { x: mx, y, size: 9.5, font: bold, color: dkgray });
        page.drawText(edu.year,        { x: mw - 40, y, size: 7.5, font: regular, color: lgray });
        y -= 13;
        page.drawText(edu.institution, { x: mx, y, size: 8.5, font: regular, color: gray });
        y -= 14;
      });
    }

    // Right sidebar
    if (data.skills) {
      sy = sectionHeader("Skills", sy, sx, sw);
      data.skills.split(",").forEach(s => {
        page.drawCircle({ x: sx + 4, y: sy + 3, size: 3, color: accent });
        page.drawText(s.trim(), { x: sx + 12, y: sy, size: 8.5, font: regular, color: dkgray });
        sy -= 14;
      });
      sy -= 6;
    }
    if (data.languages) {
      sy = sectionHeader("Languages", sy, sx, sw);
      data.languages.split(",").forEach(l => {
        page.drawText(l.trim(), { x: sx, y: sy, size: 8.5, font: regular, color: gray });
        sy -= 13;
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `cv-${(data.name || "resume").toLowerCase().replace(/\s+/g, "-")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "personal",   label: "Personal Info",      icon: User },
  { id: "summary",    label: "Summary",             icon: AlignLeft },
  { id: "experience", label: "Experience",          icon: Briefcase },
  { id: "education",  label: "Education",           icon: GraduationCap },
  { id: "skills",     label: "Skills & Languages",  icon: Wrench },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

export default function CVResumeBuilder() {
  const navigate = useNavigate();
  const [template,          setTemplate]          = useState<Template>("modern");
  const [activeSection,     setActiveSection]     = useState<SectionId>("personal");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [isExporting,       setIsExporting]       = useState(false);
  const [brandAssetOpen,    setBrandAssetOpen]    = useState(false);
  const [logoUrl,           setLogoUrl]           = useState("");
  const [logoSize,          setLogoSize]          = useState(80);
  const [data, setData] = useState<CVData>({
    name: "", title: "", email: "", phone: "", location: "", linkedin: "", website: "",
    summary: "",
    experience: [{ title: "", company: "", period: "", description: "" }],
    education:  [{ degree: "", institution: "", year: "" }],
    skills: "", languages: "",
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

  const addExp = () => setData(prev => ({ ...prev, experience: [...prev.experience, { title: "", company: "", period: "", description: "" }] }));
  const delExp = (i: number) => setData(prev => ({ ...prev, experience: prev.experience.filter((_, j) => j !== i) }));
  const addEdu = () => setData(prev => ({ ...prev, education:  [...prev.education,  { degree: "", institution: "", year: "" }] }));
  const delEdu = (i: number) => setData(prev => ({ ...prev, education:  prev.education.filter((_, j) => j !== i) }));

  const generateSummary = async () => {
    if (!data.name && !data.title) { toast.error("Enter your name and job title first."); return; }
    setGeneratingSummary(true);
    try {
      const { data: fnData, error } = await supabase.functions.invoke("cv-summary-generator", {
        body: {
          name:       data.name,
          title:      data.title,
          skills:     data.skills,
          experience: data.experience,
          education:  data.education,
          languages:  data.languages,
        },
      });
      if (error) throw error;
      if (fnData?.error) {
        if (fnData.error.includes("Rate limit")) toast.error(fnData.error);
        else if (fnData.error.includes("credits")) toast.error(fnData.error);
        else throw new Error(fnData.error);
        return;
      }
      const summary = fnData?.summary || "";
      if (summary) {
        setData(prev => ({ ...prev, summary }));
        toast.success("AI summary generated!");
      } else {
        toast.error("Could not generate summary. Try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Summary generation failed. Please try again.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportCVAsPDF(data, template);
      toast.success("CV exported as PDF!");
    } catch (err) {
      console.error(err);
      toast.error("PDF export failed.");
    } finally {
      setIsExporting(false);
    }
  };

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
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">AI-Powered · 4 Templates · PDF Export</p>
              </div>
            </div>
            <Button onClick={handleExport} disabled={isExporting}
              className="gap-2 h-8 text-xs font-semibold text-white hover:opacity-90"
              style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))" }}>
              {isExporting ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
              {isExporting ? "Exporting…" : "Export PDF"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

        {/* ── Left: Controls ────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Scan Existing CV — AI pre-fill */}
          <DocumentExtractorUpload
            extractionType="cv"
            onExtracted={handleExtractedCV}
            label="Scan Existing CV / Resume"
            hint="Upload a PDF or photo of your current CV to pre-fill all fields with Gemini Vision."
          />

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
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] py-2">Logo shown in CV header area.</p>
                  <BrandAssetLibrary
                    assetTypes={["monogram", "logo"]}
                    selectedUrl={logoUrl}
                    onSelect={asset => setLogoUrl(asset.file_url)}
                    showSizeControl
                    sizeValue={logoSize}
                    onSizeChange={setLogoSize}
                    sizeLabel="Logo Size"
                    sizeMin={30}
                    sizeMax={120}
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Template picker */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-3 block">Template</Label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
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
            {/* Tab nav */}
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

            {/* Section content */}
            <div className="p-4">
              <AnimatePresence mode="wait">
                <motion.div key={activeSection} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

                  {/* Personal */}
                  {activeSection === "personal" && (
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { key: "name" as const,     label: "Full Name",  placeholder: "Ahmed Al-Mansoori",         span: 2 },
                        { key: "title" as const,    label: "Job Title",  placeholder: "Senior Real Estate Consultant", span: 2 },
                        { key: "email" as const,    label: "Email",      placeholder: "ahmed@email.com" },
                        { key: "phone" as const,    label: "Phone",      placeholder: "+971 50 000 0000" },
                        { key: "location" as const, label: "Location",   placeholder: "Dubai, UAE" },
                        { key: "linkedin" as const, label: "LinkedIn",   placeholder: "linkedin.com/in/ahmed" },
                        { key: "website" as const,  label: "Website",    placeholder: "www.portfolio.ae", span: 2 },
                      ].map(f => (
                        <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
                          <Label className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1 block">{f.label}</Label>
                          <Input value={data[f.key]} onChange={set(f.key)} placeholder={f.placeholder} className="h-8 text-xs" />
                        </div>
                      ))}
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
                        placeholder="A results-driven real estate professional with 8+ years of experience…"
                        className="text-xs min-h-[120px] resize-none" />
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        💡 Fill in Personal Info first for better AI results.
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
                            {i > 0 && (
                              <button onClick={() => delExp(i)} className="text-destructive hover:opacity-70 p-0.5">
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                          <Input value={exp.title}   onChange={e => setExp(i, "title",   e.target.value)} placeholder="Job Title"       className="h-7 text-xs" />
                          <Input value={exp.company} onChange={e => setExp(i, "company", e.target.value)} placeholder="Company Name"    className="h-7 text-xs" />
                          <Input value={exp.period}  onChange={e => setExp(i, "period",  e.target.value)} placeholder="2020 – Present"  className="h-7 text-xs" />
                          <Textarea value={exp.description} onChange={e => setExp(i, "description", e.target.value)}
                            placeholder="Key achievements and responsibilities…" className="text-xs min-h-[60px] resize-none" />
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
                            {i > 0 && (
                              <button onClick={() => delEdu(i)} className="text-destructive hover:opacity-70 p-0.5">
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                          <Input value={edu.degree}      onChange={e => setEdu(i, "degree",      e.target.value)} placeholder="BSc in Business Administration" className="h-7 text-xs" />
                          <Input value={edu.institution} onChange={e => setEdu(i, "institution", e.target.value)} placeholder="University / Institution"        className="h-7 text-xs" />
                          <Input value={edu.year}        onChange={e => setEdu(i, "year",        e.target.value)} placeholder="2016"                           className="h-7 text-xs" />
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={addEdu} className="w-full h-7 text-xs gap-1">
                        <Plus size={11} /> Add Entry
                      </Button>
                    </div>
                  )}

                  {/* Skills & Languages */}
                  {activeSection === "skills" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1.5 block flex items-center gap-1">
                          <Wrench size={10} /> Skills <span className="font-normal">(comma-separated)</span>
                        </Label>
                        <Textarea value={data.skills} onChange={set("skills")}
                          placeholder="Sales, Negotiation, CRM, Market Analysis, Property Valuation, Client Relations"
                          className="text-xs min-h-[80px] resize-none" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1.5 block flex items-center gap-1">
                          <Languages size={10} /> Languages
                        </Label>
                        <Input value={data.languages} onChange={set("languages")}
                          placeholder="Arabic (Native), English (Fluent), French (Intermediate)" className="h-8 text-xs" />
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
              {TEMPLATES.find(t => t.id === template)?.label} template
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={template}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}>
              <CVPreview data={data} template={template} scale={0.85} />
            </motion.div>
          </AnimatePresence>

          {/* All templates mini grid */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-3 block">
              Switch Template
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => setTemplate(t.id)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                    template === t.id ? "border-[hsl(var(--gold))] shadow-md" : "border-transparent hover:border-[hsl(var(--border))]"
                  }`}>
                  <CVPreview data={data} template={t.id} scale={0.28} />
                  {template === t.id && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
                      <Check size={9} className="text-white" />
                    </div>
                  )}
                  <p className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-semibold py-1 bg-black/40 text-white">{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Export tip */}
          <div className="bg-[hsl(var(--gold)/0.06)] border border-[hsl(var(--gold)/0.2)] rounded-2xl p-4 text-xs space-y-1.5">
            <p className="font-semibold text-[hsl(var(--foreground))]">Export Options</p>
            <p className="text-[hsl(var(--muted-foreground))]">
              <span className="font-medium text-[hsl(var(--foreground))]">PDF Export</span> — Downloads a print-ready A4 PDF with your selected template and all entered information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
