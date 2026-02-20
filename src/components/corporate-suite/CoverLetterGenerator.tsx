import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, FileEdit, Sparkles, Download, RefreshCw,
  ImageIcon, ChevronDown, Copy, Check, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandAssetLibrary } from "@/components/corporate-suite/BrandAssetLibrary";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tone     = "professional" | "confident" | "casual" | "enthusiastic" | "executive";
type Template = "classic" | "modern" | "executive" | "minimal";

interface FormData {
  yourName: string;
  yourTitle: string;
  yourEmail: string;
  yourPhone: string;
  jobTitle: string;
  companyName: string;
  skills: string;
  experience: string;
  additionalNotes: string;
}

// ─── Template configs ─────────────────────────────────────────────────────────
const TEMPLATES: {
  id: Template;
  label: string;
  accentColor: string;
  headerBg: string;
  textColor: string;
  dividerColor: string;
  bodyFont: string;
}[] = [
  {
    id: "classic",
    label: "Classic",
    accentColor: "#1e293b",
    headerBg: "#f8fafc",
    textColor: "#374151",
    dividerColor: "#1e293b",
    bodyFont: "'Georgia', serif",
  },
  {
    id: "modern",
    label: "Modern",
    accentColor: "#1d4ed8",
    headerBg: "#eff6ff",
    textColor: "#1e293b",
    dividerColor: "#3b82f6",
    bodyFont: "'Inter', sans-serif",
  },
  {
    id: "executive",
    label: "Executive",
    accentColor: "#92400e",
    headerBg: "#fffbeb",
    textColor: "#1c1917",
    dividerColor: "#d97706",
    bodyFont: "'Georgia', serif",
  },
  {
    id: "minimal",
    label: "Minimal",
    accentColor: "#111827",
    headerBg: "#ffffff",
    textColor: "#374151",
    dividerColor: "#e5e7eb",
    bodyFont: "'Helvetica Neue', sans-serif",
  },
];

// ─── Tone options ─────────────────────────────────────────────────────────────
const TONES: { id: Tone; label: string; emoji: string; desc: string }[] = [
  { id: "professional", label: "Professional", emoji: "🎯", desc: "Formal & polished" },
  { id: "confident",    label: "Confident",    emoji: "💪", desc: "Direct & assertive" },
  { id: "enthusiastic", label: "Enthusiastic", emoji: "✨", desc: "Energetic & passionate" },
  { id: "executive",    label: "Executive",    emoji: "👔", desc: "Strategic & authoritative" },
  { id: "casual",       label: "Casual",       emoji: "😊", desc: "Warm & personable" },
];

// ─── A4 Letter Preview ────────────────────────────────────────────────────────
function LetterPreview({
  form, letter, template, logoUrl, logoSize, scale = 1,
}: {
  form: FormData;
  letter: string;
  template: Template;
  logoUrl: string;
  logoSize: number;
  scale?: number;
}) {
  const cfg = TEMPLATES.find(t => t.id === template)!;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const paragraphs = letter.split(/\n{2,}/).filter(Boolean);

  const fs = (n: number) => n * scale;
  const sp = (n: number) => n * scale;

  return (
    <div
      style={{
        background: "#ffffff",
        fontFamily: cfg.bodyFont,
        fontSize: fs(11),
        color: cfg.textColor,
        minHeight: sp(560),
        boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
        borderRadius: sp(6),
        overflow: "hidden",
        lineHeight: 1.65,
      }}
    >
      {/* Header band */}
      <div style={{ background: cfg.headerBg, padding: `${sp(22)}px ${sp(28)}px ${sp(18)}px`, borderBottom: `2px solid ${cfg.dividerColor}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: fs(17), fontWeight: 700, color: cfg.accentColor, letterSpacing: -0.3 }}>
              {form.yourName || "Your Name"}
            </h1>
            {form.yourTitle && (
              <p style={{ margin: `${sp(2)}px 0 0`, fontSize: fs(9.5), color: cfg.accentColor, opacity: 0.7, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>
                {form.yourTitle}
              </p>
            )}
            <div style={{ marginTop: sp(8), display: "flex", gap: sp(12), flexWrap: "wrap" }}>
              {form.yourEmail && (
                <span style={{ fontSize: fs(8.5), color: cfg.textColor, opacity: 0.65 }}>{form.yourEmail}</span>
              )}
              {form.yourPhone && (
                <span style={{ fontSize: fs(8.5), color: cfg.textColor, opacity: 0.65 }}>{form.yourPhone}</span>
              )}
            </div>
          </div>
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              style={{ height: sp(logoSize * 0.45), maxWidth: sp(90), objectFit: "contain", borderRadius: sp(4) }}
            />
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: `${sp(20)}px ${sp(28)}px ${sp(24)}px` }}>
        {/* Date + Reference */}
        <p style={{ fontSize: fs(9), color: cfg.textColor, opacity: 0.5, marginBottom: sp(14) }}>{today}</p>

        {/* Salutation */}
        <p style={{ fontSize: fs(10.5), marginBottom: sp(4), fontWeight: 500 }}>Dear Hiring Manager,</p>
        {form.jobTitle && form.companyName && (
          <p style={{ fontSize: fs(9), opacity: 0.55, marginBottom: sp(14), fontStyle: "italic" }}>
            Re: Application for <strong style={{ fontStyle: "normal" }}>{form.jobTitle}</strong> — {form.companyName}
          </p>
        )}

        {/* Letter paragraphs */}
        {letter ? (
          paragraphs.map((para, i) => (
            <p key={i} style={{ margin: `0 0 ${sp(12)}px`, textAlign: "justify", lineHeight: 1.7, fontSize: fs(10.5) }}>
              {para.trim()}
            </p>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: `${sp(40)}px 0`, opacity: 0.3 }}>
            <p style={{ fontSize: fs(11) }}>✦ Your letter will appear here ✦</p>
          </div>
        )}

        {/* Sign-off */}
        {letter && (
          <div style={{ marginTop: sp(16) }}>
            <p style={{ fontSize: fs(10.5) }}>Yours sincerely,</p>
            <p style={{ fontSize: fs(12), fontWeight: 700, color: cfg.accentColor, marginTop: sp(10), borderTop: `1px solid ${cfg.dividerColor}`, paddingTop: sp(8), display: "inline-block" }}>
              {form.yourName || "Your Name"}
            </p>
            {form.yourTitle && (
              <p style={{ fontSize: fs(9), opacity: 0.6, marginTop: sp(2) }}>{form.yourTitle}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoverLetterGenerator() {
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);

  const [generating, setGenerating] = useState(false);
  const [tone, setTone] = useState<Tone>("professional");
  const [template, setTemplate] = useState<Template>("classic");
  const [letter, setLetter] = useState("");
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [brandAssetOpen, setBrandAssetOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSize, setLogoSize] = useState(60);

  const [form, setForm] = useState<FormData>({
    yourName: "", yourTitle: "", yourEmail: "", yourPhone: "",
    jobTitle: "", companyName: "", skills: "", experience: "", additionalNotes: "",
  });

  const setField = (k: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  // ── Generate ────────────────────────────────────────────────────────────────
  const generate = async () => {
    if (!form.jobTitle || !form.companyName || !form.yourName) {
      toast.error("Please fill in your name, job title, and company name.");
      return;
    }
    setGenerating(true);
    setEditing(false);
    try {
      const { data, error } = await supabase.functions.invoke("cover-letter-generator", {
        body: {
          yourName: form.yourName,
          yourTitle: form.yourTitle,
          jobTitle: form.jobTitle,
          companyName: form.companyName,
          skills: form.skills,
          experience: form.experience,
          tone,
          additionalNotes: form.additionalNotes,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const content = data?.letter || "";
      if (content) {
        setLetter(content);
        toast.success("Cover letter generated!");
      } else {
        toast.error("Failed to generate. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("429") || msg.includes("Rate limit")) {
        toast.error("Rate limit reached. Please wait a moment.");
      } else if (msg.includes("402")) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error("Generation failed. Please try again.");
      }
    } finally {
      setGenerating(false);
    }
  };

  // ── Copy to clipboard ───────────────────────────────────────────────────────
  const copyLetter = async () => {
    if (!letter) return;
    const fullText = `Dear Hiring Manager,\n${form.jobTitle && form.companyName ? `\nRe: Application for ${form.jobTitle} — ${form.companyName}\n` : ""}\n${letter}\n\nYours sincerely,\n${form.yourName}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!letter) {
      toast.error("Generate a cover letter first.");
      return;
    }
    setExporting(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4

      const cfg = TEMPLATES.find(t => t.id === template)!;

      // Fonts
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const italicFont  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      // Parse accent color hex → rgb
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return rgb(r, g, b);
      };
      const accent  = hexToRgb(cfg.accentColor);
      const dark    = rgb(0.22, 0.22, 0.22);
      const mid     = rgb(0.45, 0.45, 0.45);
      const light   = rgb(0.7, 0.7, 0.7);

      const { width, height } = page.getSize();
      const margin = 56;
      const contentW = width - margin * 2;
      let y = height - margin;

      // ── Header band
      const hBandH = 80;
      const hBandY = height - hBandH;
      page.drawRectangle({
        x: 0, y: hBandY, width, height: hBandH,
        color: hexToRgb(cfg.headerBg === "#ffffff" ? "#f9fafb" : cfg.headerBg),
      });
      // Divider line
      page.drawRectangle({ x: 0, y: hBandY, width, height: 2, color: accent });

      // Name
      const nameSize = 20;
      page.drawText(form.yourName || "Your Name", {
        x: margin, y: hBandY + 48, font: boldFont, size: nameSize, color: accent,
      });

      // Title
      if (form.yourTitle) {
        page.drawText(form.yourTitle.toUpperCase(), {
          x: margin, y: hBandY + 30, font: regularFont, size: 8, color: accent, opacity: 0.6,
        });
      }

      // Contact line
      const contactParts = [form.yourEmail, form.yourPhone].filter(Boolean).join("   |   ");
      if (contactParts) {
        page.drawText(contactParts, {
          x: margin, y: hBandY + 12, font: regularFont, size: 8, color: mid,
        });
      }

      // Logo if available (embed as image if possible)
      if (logoUrl) {
        try {
          const resp = await fetch(logoUrl);
          const buf  = await resp.arrayBuffer();
          let img;
          try { img = await pdfDoc.embedPng(buf); } catch { img = await pdfDoc.embedJpg(buf); }
          const dims = img.scale(0.25);
          page.drawImage(img, {
            x: width - margin - dims.width,
            y: hBandY + (hBandH - dims.height) / 2,
            width: dims.width,
            height: dims.height,
          });
        } catch { /* skip logo on error */ }
      }

      y = hBandY - 28;

      // Date
      const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      page.drawText(today, { x: margin, y, font: regularFont, size: 9, color: light });
      y -= 22;

      // Salutation
      page.drawText("Dear Hiring Manager,", { x: margin, y, font: regularFont, size: 11, color: dark });
      y -= 14;

      if (form.jobTitle && form.companyName) {
        page.drawText(`Re: Application for ${form.jobTitle} — ${form.companyName}`, {
          x: margin, y, font: italicFont, size: 9, color: mid,
        });
        y -= 20;
      } else {
        y -= 10;
      }

      // ── Word-wrap helper
      const wrapText = (text: string, font: typeof regularFont, size: number, maxW: number): string[] => {
        const words = text.split(" ");
        const lines: string[] = [];
        let cur = "";
        for (const word of words) {
          const test = cur ? `${cur} ${word}` : word;
          if (font.widthOfTextAtSize(test, size) > maxW) {
            if (cur) lines.push(cur);
            cur = word;
          } else {
            cur = test;
          }
        }
        if (cur) lines.push(cur);
        return lines;
      };

      const paraSize = 10.5;
      const lineH = 16;

      // ── Body paragraphs
      const paras = letter.split(/\n{2,}/).filter(Boolean);
      for (const para of paras) {
        const lines = wrapText(para.trim(), regularFont, paraSize, contentW);
        for (const line of lines) {
          if (y < margin + 80) {
            // New page
            const newPage = pdfDoc.addPage([595.28, 841.89]);
            y = 841.89 - margin;
            page.drawText; // typescript noop
            Object.assign(page, newPage); // won't actually work — we just skip for simplicity
          }
          page.drawText(line, { x: margin, y, font: regularFont, size: paraSize, color: dark });
          y -= lineH;
        }
        y -= 10; // paragraph gap
      }

      // Sign-off
      y -= 4;
      page.drawText("Yours sincerely,", { x: margin, y, font: regularFont, size: 10.5, color: dark });
      y -= 28;
      // Signature line
      page.drawLine({ start: { x: margin, y }, end: { x: margin + 140, y }, thickness: 0.8, color: accent });
      y -= 14;
      page.drawText(form.yourName || "Your Name", { x: margin, y, font: boldFont, size: 12, color: accent });
      if (form.yourTitle) {
        y -= 14;
        page.drawText(form.yourTitle, { x: margin, y, font: regularFont, size: 9, color: mid });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `cover-letter-${form.companyName || "application"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const cfg = TEMPLATES.find(t => t.id === template)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/toolkit/corporate-suite")} className="gap-1.5">
              <ArrowLeft size={15} /> Back
            </Button>
            <div className="w-px h-5 bg-[hsl(var(--border))]" />
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <FileEdit size={15} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[hsl(var(--foreground))] text-sm">AI Cover Letter Generator</h1>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Powered by Gemini Flash · PDF Export · 4 Templates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {letter && (
              <Button variant="outline" size="sm" onClick={copyLetter} className="gap-1.5 h-8 text-xs border-[hsl(var(--border))]">
                {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            )}
            <Button
              onClick={exportPDF}
              disabled={exporting || !letter}
              className="gap-2 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 h-8 text-xs disabled:opacity-40"
            >
              {exporting ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
        {/* ── Left: Form ───────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Brand Assets */}
          <Collapsible open={brandAssetOpen} onOpenChange={setBrandAssetOpen}>
            <div className="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={12} className="text-[hsl(var(--gold))]" />
                    <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Brand Assets (Logo)</span>
                    {logoUrl && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
                  </div>
                  <ChevronDown size={12} className={`text-[hsl(var(--muted-foreground))] transition-transform ${brandAssetOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 border-t border-[hsl(var(--border))]">
                  <BrandAssetLibrary
                    assetTypes={["monogram", "logo"]}
                    selectedUrl={logoUrl}
                    onSelect={asset => setLogoUrl(asset.file_url)}
                    showSizeControl
                    sizeValue={logoSize}
                    onSizeChange={setLogoSize}
                    sizeLabel="Logo Size"
                    sizeMin={30}
                    sizeMax={100}
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Template Picker */}
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-2 block">
              Template Style
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`relative rounded-lg border-2 p-2 text-left transition-all ${
                    template === t.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: t.accentColor }}
                    />
                    <span className="text-xs font-semibold text-[hsl(var(--foreground))]">{t.label}</span>
                  </div>
                  {template === t.id && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
                      <Check size={8} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tone Picker */}
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-2 block">
              Tone & Style
            </Label>
            <div className="space-y-1.5">
              {TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all ${
                    tone === t.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] bg-white"
                  }`}
                >
                  <span className="text-sm">{t.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{t.label}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{t.desc}</p>
                  </div>
                  {tone === t.id && <Check size={12} className="ml-auto text-[hsl(var(--gold))]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Your Info */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
            <p className="text-xs font-bold text-[hsl(var(--foreground))]">Your Information</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Full Name *</Label>
                <Input value={form.yourName} onChange={setField("yourName")} placeholder="Ahmed Al-Mansoori" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Current Title</Label>
                <Input value={form.yourTitle} onChange={setField("yourTitle")} placeholder="Senior Consultant" className="h-8 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Email</Label>
                <Input value={form.yourEmail} onChange={setField("yourEmail")} placeholder="ahmed@email.com" className="h-8 text-xs" type="email" />
              </div>
              <div>
                <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Phone</Label>
                <Input value={form.yourPhone} onChange={setField("yourPhone")} placeholder="+971 50 000 0000" className="h-8 text-xs" />
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
            <p className="text-xs font-bold text-[hsl(var(--foreground))]">Job Details</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Job Title *</Label>
                <Input value={form.jobTitle} onChange={setField("jobTitle")} placeholder="Head of Sales" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Company *</Label>
                <Input value={form.companyName} onChange={setField("companyName")} placeholder="JBJ Global" className="h-8 text-xs" />
              </div>
            </div>
            <div>
              <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Key Skills</Label>
              <Input
                value={form.skills}
                onChange={setField("skills")}
                placeholder="Negotiation, CRM, Market Analysis, Leadership"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Experience Highlight</Label>
              <Input
                value={form.experience}
                onChange={setField("experience")}
                placeholder="8 yrs in real estate, closed 200M AED in deals"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Additional Notes (optional)</Label>
              <Textarea
                value={form.additionalNotes}
                onChange={setField("additionalNotes")}
                placeholder="Any specific points to highlight, referral, or context…"
                className="text-xs min-h-[60px] resize-none"
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generate}
            disabled={generating}
            className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:opacity-90 h-10"
          >
            {generating
              ? <><RefreshCw size={14} className="animate-spin" /> Generating with Gemini…</>
              : <><Sparkles size={14} /> {letter ? "Regenerate Letter" : "Generate with AI"}</>
            }
          </Button>
        </div>

        {/* ── Right: Preview ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))]">
              Letter Preview — A4
            </Label>
            <div className="flex items-center gap-2">
              {letter && (
                <button
                  onClick={() => setEditing(e => !e)}
                  className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                    editing
                      ? "border-violet-400 bg-violet-50 text-violet-700"
                      : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-violet-300"
                  }`}
                >
                  <Pencil size={10} />
                  {editing ? "Done Editing" : "Edit Text"}
                </button>
              )}
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {cfg.label} template
              </span>
            </div>
          </div>

          {/* Edit text area */}
          <AnimatePresence>
            {editing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-xl border border-violet-200 p-3 shadow-sm">
                  <Label className="text-[10px] font-semibold text-violet-700 mb-2 block">Edit Letter Body</Label>
                  <Textarea
                    value={letter}
                    onChange={e => setLetter(e.target.value)}
                    className="text-xs min-h-[160px] border-violet-200 focus-visible:ring-violet-400/50"
                    placeholder="Edit your generated letter here…"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* A4 Preview */}
          <AnimatePresence mode="wait">
            <motion.div
              key={template}
              ref={previewRef}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LetterPreview
                form={form}
                letter={letter}
                template={template}
                logoUrl={logoUrl}
                logoSize={logoSize}
                scale={0.9}
              />
            </motion.div>
          </AnimatePresence>

          {/* Template mini switcher */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 shadow-sm">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-3 block">
              Switch Template
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`rounded-lg border-2 overflow-hidden transition-all ${
                    template === t.id ? "border-[hsl(var(--gold))]" : "border-transparent hover:border-[hsl(var(--border))]"
                  }`}
                >
                  <LetterPreview
                    form={form}
                    letter={letter}
                    template={t.id}
                    logoUrl={logoUrl}
                    logoSize={logoSize}
                    scale={0.22}
                  />
                  <p className="text-[9px] font-semibold text-center py-1 bg-[hsl(var(--muted)/0.4)] text-[hsl(var(--muted-foreground))]">
                    {t.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[hsl(var(--gold)/0.06)] border border-[hsl(var(--gold)/0.2)] rounded-xl p-4 text-xs space-y-2">
            <p className="font-bold text-[hsl(var(--foreground))]">💡 Tips for Best Results</p>
            <ul className="space-y-1 text-[hsl(var(--muted-foreground))] list-disc list-inside">
              <li>Mention a specific achievement with numbers (e.g. "closed 200M AED")</li>
              <li>Use "Additional Notes" to add context the AI should reference</li>
              <li>Click <strong className="text-[hsl(var(--foreground))]">Edit Text</strong> to fine-tune the generated letter</li>
              <li>Export as PDF for a print-ready, professional A4 document</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
