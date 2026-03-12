import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, FileEdit, Sparkles, Download, RefreshCw,
  ImageIcon, ChevronDown, Copy, Check, Pencil,
  Calendar, PenTool, Stamp, Plus, Minus, GripVertical,
  FileSignature, Send,
} from "lucide-react";
import { DocumentExtractorUpload } from "@/components/corporate-suite/DocumentExtractorUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BrandAssetLibrary } from "@/components/corporate-suite/BrandAssetLibrary";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import DocumentColorWheel, { type DocumentColors } from "./DocumentColorWheel";
import DocumentTypographyControls, { type TypographySettings } from "./DocumentTypographyControls";
import DocumentStampIntegration, { type StampSignatureData } from "./DocumentStampIntegration";
import DocumentHeaderFooterBuilder, { type HeaderFooterSettings } from "./DocumentHeaderFooterBuilder";
import DocumentESignIntegration from "./DocumentESignIntegration";
import {
  type Tone, type DocType, type FormData, type TemplateConfig,
  TEMPLATES, DOC_TYPES, TONES, DIVIDER_STYLES,
} from "./coverLetterTypes";
import LetterPreview from "./CoverLetterPreview";
import { exportCoverLetterPDF } from "./coverLetterExport";
// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoverLetterGenerator() {
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);

  const [generating, setGenerating] = useState(false);
  const [tone, setTone] = useState<Tone>("professional");
  const [templateId, setTemplateId] = useState("classic");
  const [docType, setDocType] = useState<DocType>("cover-letter");
  const [letter, setLetter] = useState("");
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [brandAssetOpen, setBrandAssetOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSize, setLogoSize] = useState(60);
  const [dividerStyle, setDividerStyle] = useState("solid");

  // Sub-component states
  const [colors, setColors] = useState<DocumentColors>({
    accentColor: "#1e293b", headerBg: "#f8fafc", textColor: "#374151", dividerColor: "#1e293b",
  });
  const [typo, setTypo] = useState<TypographySettings>({
    fontFamily: "'Georgia', serif", fontSize: 10.5, bold: false, italic: false, underline: false, textAlign: "justify",
  });
  const [stampData, setStampData] = useState<StampSignatureData>({});
  const [headerFooter, setHeaderFooter] = useState<HeaderFooterSettings>({
    showHeader: false, companyName: "", companyTagline: "", contactLine: "",
    showQrCode: false, qrUrl: "", showFooter: false, copyrightText: "",
    footerLinks: "", showBusinessCard: false, showPageNumbers: false,
  });

  const [form, setForm] = useState<FormData>({
    yourName: "", yourTitle: "", yourEmail: "", yourPhone: "",
    jobTitle: "", companyName: "", skills: "", experience: "", additionalNotes: "", recipientName: "",
  });

  // Build effective template config (merge template + custom colors)
  const baseTemplate = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
  const effectiveTemplate: TemplateConfig = {
    ...baseTemplate,
    accentColor: colors.accentColor,
    headerBg: colors.headerBg,
    textColor: colors.textColor,
    dividerColor: colors.dividerColor,
    bodyFont: typo.fontFamily,
  };

  const setField = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleExtractedCoverLetter = (extracted: Record<string, unknown>) => {
    setForm(prev => ({
      ...prev,
      yourName: extracted.yourName ? String(extracted.yourName) : prev.yourName,
      yourTitle: extracted.yourTitle ? String(extracted.yourTitle) : prev.yourTitle,
      jobTitle: extracted.jobTitle ? String(extracted.jobTitle) : prev.jobTitle,
      companyName: extracted.companyName ? String(extracted.companyName) : prev.companyName,
      skills: extracted.skills ? String(extracted.skills) : prev.skills,
      experience: extracted.experience ? String(extracted.experience) : prev.experience,
    }));
  };

  // When template changes, sync colors
  const switchTemplate = (id: string) => {
    setTemplateId(id);
    const t = TEMPLATES.find(tm => tm.id === id);
    if (t) {
      setColors({ accentColor: t.accentColor, headerBg: t.headerBg, textColor: t.textColor, dividerColor: t.dividerColor });
      setTypo(prev => ({ ...prev, fontFamily: t.bodyFont }));
    }
  };

  // ── Generate ────────────────────────────────────────────────────────────────
  const generate = async () => {
    if (!form.yourName) { toast.error("Please fill in your name."); return; }
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
          documentType: docType,
          recipientName: form.recipientName,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const content = data?.letter || "";
      if (content) { setLetter(content); toast.success("Document generated!"); }
      else toast.error("Failed to generate. Please try again.");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("429")) toast.error("Rate limit reached. Please wait.");
      else if (msg.includes("402")) toast.error("AI credits exhausted.");
      else toast.error("Generation failed. Please try again.");
    } finally { setGenerating(false); }
  };

  const copyLetter = async () => {
    if (!letter) return;
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!letter) { toast.error("Generate a document first."); return; }
    setExporting(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return rgb(r, g, b);
      };
      const accent = hexToRgb(effectiveTemplate.accentColor);
      const dark = rgb(0.22, 0.22, 0.22);
      const mid = rgb(0.45, 0.45, 0.45);
      const light = rgb(0.7, 0.7, 0.7);

      const { width, height } = page.getSize();
      const margin = 56;
      const contentW = width - margin * 2;
      let y = height - margin;

      // Header band
      const hBandH = 80;
      const hBandY = height - hBandH;
      page.drawRectangle({
        x: 0, y: hBandY, width, height: hBandH,
        color: hexToRgb(effectiveTemplate.headerBg === "#ffffff" ? "#f9fafb" : effectiveTemplate.headerBg),
      });
      page.drawRectangle({ x: 0, y: hBandY, width, height: 2, color: accent });

      const headerName = headerFooter.showHeader && headerFooter.companyName
        ? headerFooter.companyName
        : (form.yourName || "Your Name");
      page.drawText(headerName, { x: margin, y: hBandY + 48, font: boldFont, size: 20, color: accent });

      if (form.yourTitle && !headerFooter.showHeader) {
        page.drawText(form.yourTitle.toUpperCase(), { x: margin, y: hBandY + 30, font: regularFont, size: 8, color: accent, opacity: 0.6 });
      }

      const contactParts = [form.yourEmail, form.yourPhone].filter(Boolean).join("   |   ");
      if (contactParts) {
        page.drawText(contactParts, { x: margin, y: hBandY + 12, font: regularFont, size: 8, color: mid });
      }

      if (logoUrl) {
        try {
          const resp = await fetch(logoUrl);
          const buf = await resp.arrayBuffer();
          let img;
          try { img = await pdfDoc.embedPng(buf); } catch { img = await pdfDoc.embedJpg(buf); }
          const dims = img.scale(0.25);
          page.drawImage(img, { x: width - margin - dims.width, y: hBandY + (hBandH - dims.height) / 2, width: dims.width, height: dims.height });
        } catch { /* skip */ }
      }

      y = hBandY - 28;

      const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      page.drawText(today, { x: margin, y, font: regularFont, size: 9, color: light });
      y -= 22;

      const salutation = form.recipientName ? `Dear ${form.recipientName},` : "Dear Hiring Manager,";
      page.drawText(salutation, { x: margin, y, font: regularFont, size: 11, color: dark });
      y -= 14;

      if (form.jobTitle && form.companyName) {
        page.drawText(`Re: ${form.jobTitle} — ${form.companyName}`, { x: margin, y, font: italicFont, size: 9, color: mid });
        y -= 20;
      } else { y -= 10; }

      const wrapText = (text: string, font: typeof regularFont, size: number, maxW: number): string[] => {
        const words = text.split(" ");
        const lines: string[] = [];
        let cur = "";
        for (const word of words) {
          const test = cur ? `${cur} ${word}` : word;
          if (font.widthOfTextAtSize(test, size) > maxW) { if (cur) lines.push(cur); cur = word; }
          else cur = test;
        }
        if (cur) lines.push(cur);
        return lines;
      };

      const paraSize = 10.5;
      const lineH = 16;
      const paras = letter.split(/\n{2,}/).filter(Boolean);
      for (const para of paras) {
        const lines = wrapText(para.trim(), regularFont, paraSize, contentW);
        for (const line of lines) {
          page.drawText(line, { x: margin, y, font: regularFont, size: paraSize, color: dark });
          y -= lineH;
        }
        y -= 10;
      }

      y -= 4;
      page.drawText("Yours sincerely,", { x: margin, y, font: regularFont, size: 10.5, color: dark });
      y -= 14;

      if (stampData.signatureUrl) {
        try {
          const sigBytes = await fetch(stampData.signatureUrl).then(r => r.arrayBuffer());
          const sigImage = await pdfDoc.embedPng(sigBytes);
          const sigH = 40;
          const sigW = Math.round(sigH * (sigImage.width / sigImage.height));
          page.drawImage(sigImage, { x: margin, y: y - sigH + 6, width: sigW, height: sigH });
          y -= sigH + 6;
        } catch {
          page.drawLine({ start: { x: margin, y }, end: { x: margin + 140, y }, thickness: 0.8, color: accent });
          y -= 14;
        }
      } else {
        page.drawLine({ start: { x: margin, y }, end: { x: margin + 140, y }, thickness: 0.8, color: accent });
        y -= 14;
      }

      page.drawText(form.yourName || "Your Name", { x: margin, y, font: boldFont, size: 12, color: accent });
      if (form.yourTitle) { y -= 14; page.drawText(form.yourTitle, { x: margin, y, font: regularFont, size: 9, color: mid }); }

      // Footer
      if (headerFooter.showFooter && headerFooter.copyrightText) {
        page.drawText(headerFooter.copyrightText, { x: margin, y: 30, font: regularFont, size: 7, color: light });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document-${form.companyName || "output"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF exported!");
    } catch (err) {
      console.error(err);
      toast.error("PDF export failed.");
    } finally { setExporting(false); }
  };

  // ── Quick actions ─────────────────────────────────────────────────────────
  const insertDate = () => {
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    setLetter(prev => prev + `\n\nDate: ${today}`);
    toast.success("Date inserted");
  };

  const insertSignature = () => {
    if (!stampData.signatureUrl) { toast.info("Generate or upload a signature first."); return; }
    toast.success("Signature will appear in preview");
  };

  const insertStamp = () => {
    if (!stampData.stampUrl) { toast.info("Upload or load a stamp first."); return; }
    toast.success("Stamp will appear in preview");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm sticky top-0 lg:top-[48px] z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/toolkit/corporate-suite")} className="gap-1.5">
              <ArrowLeft size={15} /> Back
            </Button>
            <div className="w-px h-5 bg-[hsl(var(--border))]" />
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
              <FileEdit size={15} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[hsl(var(--foreground))] text-sm">AI Document Designer</h1>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Cover Letters · Contracts · NDA · HR Letters · {TEMPLATES.length} Templates</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick actions */}
            <div className="hidden md:flex items-center gap-1 mr-2">
              <button onClick={insertDate} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]" title="Insert Date">
                <Calendar size={10} /> Date
              </button>
              <button onClick={insertSignature} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]" title="Sign">
                <PenTool size={10} /> Sign
              </button>
              <button onClick={insertStamp} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]" title="Stamp">
                <Stamp size={10} /> Stamp
              </button>
            </div>
            {letter && (
              <Button variant="outline" size="sm" onClick={copyLetter} className="gap-1.5 h-8 text-xs border-[hsl(var(--border))]">
                {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/e-signature/create")}
              disabled={!letter}
              className="gap-1.5 h-8 text-xs border-[hsl(var(--border))] disabled:opacity-40"
            >
              <FileSignature size={13} />
              Sign
            </Button>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/e-signature/create")}
                disabled={!letter}
                className="gap-1.5 h-8 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-40"
              >
                <Send size={13} />
                Send for Signature
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

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
        {/* ── Left: Controls ───────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Document Type */}
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-2 block">
              Document Type
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              {DOC_TYPES.map(dt => (
                <button
                  key={dt.id}
                  onClick={() => setDocType(dt.id)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                    docType === dt.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--foreground))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                  }`}
                >
                  {dt.label}
                </button>
              ))}
            </div>
          </div>

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
                    assetTypes={["monogram", "logo", "signature"]}
                    selectedUrl={logoUrl}
                    onSelect={asset => setLogoUrl(asset.file_url || "")}
                    showSizeControl
                    sizeValue={logoSize}
                    onSizeChange={setLogoSize}
                    sizeLabel="Logo Size"
                    sizeMin={30}
                    sizeMax={160}
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Color Wheel */}
          <DocumentColorWheel colors={colors} onChange={setColors} />

          {/* Typography */}
          <DocumentTypographyControls settings={typo} onChange={setTypo} />

          {/* Divider Style */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] block">
              Divider Style
            </Label>
            <div className="flex gap-2">
              {DIVIDER_STYLES.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDividerStyle(d.id)}
                  className={`px-2.5 py-1 rounded-md border text-[10px] transition-all ${
                    dividerStyle === d.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stamp & Signature */}
          <DocumentStampIntegration data={stampData} onChange={setStampData} />

          {/* Header/Footer */}
          <DocumentHeaderFooterBuilder settings={headerFooter} onChange={setHeaderFooter} />

          {/* E-Signature Integration */}
          <DocumentESignIntegration
            documentReady={!!letter}
            onSignDocument={() => navigate("/e-signature/create")}
          />

          <div>
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-2 block">
              Template Style
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => switchTemplate(t.id)}
                  className={`relative rounded-lg border-2 p-2 text-left transition-all ${
                    templateId === t.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.accentColor }} />
                    <span className="text-xs font-semibold text-[hsl(var(--foreground))]">{t.label}</span>
                  </div>
                  {templateId === t.id && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
                      <Check size={8} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-2 block">Tone & Style</Label>
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
                  <div>
                    <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{t.label}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{t.desc}</p>
                  </div>
                  {tone === t.id && <Check size={12} className="ml-auto text-[hsl(var(--gold))]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Scan Existing */}
          <DocumentExtractorUpload
            extractionType="cover_letter"
            onExtracted={handleExtractedCoverLetter}
            label="Scan Existing Document"
            hint="Upload a PDF or photo to pre-fill details instantly."
          />

          {/* Form Fields */}
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

          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
            <p className="text-xs font-bold text-[hsl(var(--foreground))]">Document Details</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Subject / Job Title</Label>
                <Input value={form.jobTitle} onChange={setField("jobTitle")} placeholder="Head of Sales" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Company</Label>
                <Input value={form.companyName} onChange={setField("companyName")} placeholder="e.g. Acme Corp" className="h-8 text-xs" />
              </div>
            </div>
            <div>
              <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Recipient Name</Label>
              <Input value={form.recipientName} onChange={setField("recipientName")} placeholder="John Smith" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Key Skills / Points</Label>
              <Input value={form.skills} onChange={setField("skills")} placeholder="Negotiation, CRM, Market Analysis" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Experience</Label>
              <Input value={form.experience} onChange={setField("experience")} placeholder="8 yrs, closed 200M AED" className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[10px] mb-1 block text-[hsl(var(--muted-foreground))]">Additional Notes</Label>
              <Textarea value={form.additionalNotes} onChange={setField("additionalNotes")} placeholder="Extra context…" className="text-xs min-h-[60px] resize-none" />
            </div>
          </div>

          <Button onClick={generate} disabled={generating} className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:opacity-90 h-10">
            {generating
              ? <><RefreshCw size={14} className="animate-spin" /> Generating…</>
              : <><Sparkles size={14} /> {letter ? "Regenerate" : "Generate with AI"}</>
            }
          </Button>
        </div>

        {/* ── Right: Preview (centered) ─────────────────────────────────────── */}
        <div className="space-y-4 flex flex-col items-center">
          <div className="w-full flex items-center justify-between">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))]">
              Document Preview — A4
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
                  {editing ? "Done" : "Edit Text"}
                </button>
              )}
            </div>
          </div>

          {/* Edit text area */}
          <AnimatePresence>
            {editing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden w-full"
              >
                <div className="bg-white rounded-xl border border-violet-200 p-3 shadow-sm">
                  <Label className="text-[10px] font-semibold text-violet-700 mb-2 block">Edit Document Body</Label>
                  <Textarea
                    value={letter}
                    onChange={e => setLetter(e.target.value)}
                    className="text-xs min-h-[160px] border-violet-200 focus-visible:ring-violet-400/50"
                    placeholder="Edit your document here…"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* A4 Preview — centered */}
          <AnimatePresence mode="wait">
            <motion.div
              key={templateId}
              ref={previewRef}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[520px]"
            >
              <LetterPreview
                form={form}
                letter={letter}
                templateCfg={effectiveTemplate}
                logoUrl={logoUrl}
                logoSize={logoSize}
                stampData={stampData}
                typo={typo}
                headerFooter={headerFooter}
                dividerStyle={dividerStyle}
                scale={0.9}
              />
            </motion.div>
          </AnimatePresence>

          {/* Template mini switcher */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 shadow-sm w-full">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-3 block">
              Switch Template
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {TEMPLATES.map(t => {
                const miniCfg = { ...t, accentColor: colors.accentColor !== "#1e293b" ? colors.accentColor : t.accentColor };
                return (
                  <button
                    key={t.id}
                    onClick={() => switchTemplate(t.id)}
                    className={`rounded-lg border-2 overflow-hidden transition-all ${
                      templateId === t.id ? "border-[hsl(var(--gold))]" : "border-transparent hover:border-[hsl(var(--border))]"
                    }`}
                  >
                    <LetterPreview
                      form={form}
                      letter={letter}
                      templateCfg={{ ...t }}
                      logoUrl={logoUrl}
                      logoSize={logoSize}
                      stampData={stampData}
                      typo={typo}
                      headerFooter={headerFooter}
                      dividerStyle={dividerStyle}
                      scale={0.18}
                    />
                    <p className="text-[8px] font-semibold text-center py-1 bg-[hsl(var(--muted)/0.4)] text-[hsl(var(--muted-foreground))]">
                      {t.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[hsl(var(--gold)/0.06)] border border-[hsl(var(--gold)/0.2)] rounded-xl p-4 text-xs space-y-2 w-full">
            <p className="font-bold text-[hsl(var(--foreground))]">Tips for Best Results</p>
            <ul className="space-y-1 text-[hsl(var(--muted-foreground))] list-disc list-inside">
              <li>Select a document type before generating for best results</li>
              <li>Use the Color Wheel to customize accent colors and ombre gradients</li>
              <li>Generate or upload a signature for professional sign-off</li>
              <li>Add a stamp from the Stamp Generator for official documents</li>
              <li>Enable Custom Header/Footer for branded documents</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
