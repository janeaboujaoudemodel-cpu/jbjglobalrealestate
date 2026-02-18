import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Upload, Download, FileText, Sparkles, Loader2, CheckCircle2,
  X, Trash2, GripVertical, Square, CheckSquare, FilePlus2,
  FileImage, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PDFDocument, rgb } from "pdf-lib";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PageItem {
  id: string;
  type: "image" | "pdf-page";
  name: string;
  sourceFile: string;
  url: string;
  // image-specific
  file?: File;
  width?: number;
  height?: number;
  // pdf-page-specific
  pdfBytes?: ArrayBuffer;
  pageIndex?: number;
}

interface TitlePageConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  date: string;
}

type PageSize = "a4" | "letter" | "fit";
type Orientation = "auto" | "portrait" | "landscape";
type Margins = "none" | "small" | "normal";

interface ProcessingState {
  status: "idle" | "processing" | "done" | "failed";
  progress: number;
  message: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89, name: "A4" },
  letter: { width: 612, height: 792, name: "Letter" },
  fit: { width: 0, height: 0, name: "Fit to Image" },
};

const MARGIN_VALUES: Record<Margins, number> = {
  none: 0,
  small: 36,  // 0.5 inch
  normal: 72, // 1 inch
};

const GOLD = "#C9A84C";

// ─── Component ───────────────────────────────────────────────────────────────

const PdfFromPhotos = () => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margins, setMargins] = useState<Margins>("normal");
  const [titlePage, setTitlePage] = useState<TitlePageConfig>({
    enabled: false,
    title: "",
    subtitle: "",
    date: new Date().toLocaleDateString(),
  });
  const [processing, setProcessing] = useState<ProcessingState>({
    status: "idle",
    progress: 0,
    message: "",
  });
  const [generatedPdf, setGeneratedPdf] = useState<Blob | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = url;
    });

  // ── Upload Routing ─────────────────────────────────────────────────────────

  const routeFiles = useCallback(async (files: File[]) => {
    setIsUploading(true);
    const imageFiles: File[] = [];
    const pdfFiles: File[] = [];

    for (const f of files) {
      if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
        pdfFiles.push(f);
      } else {
        imageFiles.push(f);
      }
    }

    if (imageFiles.length > 0) await processImageFiles(imageFiles);
    for (const pdf of pdfFiles) await processPdfFile(pdf);
    setIsUploading(false);
  }, []);

  const processImageFiles = async (files: File[]) => {
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
    const newPages: PageItem[] = [];

    for (const file of sorted) {
      try {
        const url = URL.createObjectURL(file);
        const { width, height } = await getImageDimensions(url);
        newPages.push({
          id: crypto.randomUUID(),
          type: "image",
          name: file.name,
          sourceFile: file.name,
          url,
          file,
          width,
          height,
        });
      } catch {
        toast.error(`Failed to load: ${file.name}`);
      }
    }

    setPages(prev => [...prev, ...newPages]);
    if (newPages.length > 0) toast.success(`Added ${newPages.length} image${newPages.length > 1 ? "s" : ""}`);
  };

  const processPdfFile = async (file: File) => {
    try {
      const bytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes);
      const pageCount = pdfDoc.getPageCount();
      const newPages: PageItem[] = [];

      for (let i = 0; i < pageCount; i++) {
        const singleDoc = await PDFDocument.create();
        const [copiedPage] = await singleDoc.copyPages(pdfDoc, [i]);
        singleDoc.addPage(copiedPage);
        const singleBytes = await singleDoc.save();
        const { width, height } = copiedPage.getSize();

        newPages.push({
          id: crypto.randomUUID(),
          type: "pdf-page",
          name: `${file.name} — Page ${i + 1}`,
          sourceFile: file.name,
          url: "",
          pdfBytes: singleBytes.buffer as ArrayBuffer,
          pageIndex: i,
          width,
          height,
        });
      }

      setPages(prev => [...prev, ...newPages]);
      toast.success(`Extracted ${pageCount} page${pageCount > 1 ? "s" : ""} from ${file.name}`);
    } catch (err) {
      console.error("PDF parse error:", err);
      toast.error(`Failed to read PDF: ${file.name}`);
    }
  };

  // ── Drop / Input Handlers ──────────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) routeFiles(files);
  }, [routeFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) routeFiles(files);
    e.target.value = "";
  };

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(pages.map(p => p.id)));
  const deselectAll = () => setSelected(new Set());

  const deleteSelected = () => {
    setPages(prev => {
      prev.filter(p => selected.has(p.id) && p.url).forEach(p => URL.revokeObjectURL(p.url));
      return prev.filter(p => !selected.has(p.id));
    });
    setSelected(new Set());
    toast.success("Deleted selected pages");
  };

  const removePage = (id: string) => {
    setPages(prev => {
      const page = prev.find(p => p.id === id);
      if (page?.url) URL.revokeObjectURL(page.url);
      return prev.filter(p => p.id !== id);
    });
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const clearAll = () => {
    pages.forEach(p => { if (p.url) URL.revokeObjectURL(p.url); });
    setPages([]);
    setSelected(new Set());
    setGeneratedPdf(null);
    setProcessing({ status: "idle", progress: 0, message: "" });
  };

  // ── PDF Generation ─────────────────────────────────────────────────────────

  const generatePdf = async () => {
    if (pages.length === 0) { toast.error("Add at least one image or PDF page"); return; }

    setProcessing({ status: "processing", progress: 0, message: "Initializing…" });
    setGeneratedPdf(null);

    try {
      const outputDoc = await PDFDocument.create();
      const totalSteps = pages.length + (titlePage.enabled ? 1 : 0) + 1;
      let step = 0;

      // Title page
      if (titlePage.enabled) {
        setProcessing({ status: "processing", progress: (++step / totalSteps) * 100, message: "Creating title page…" });
        const size = pageSize === "fit" ? PAGE_SIZES.a4 : PAGE_SIZES[pageSize];
        const tp = outputDoc.addPage([size.width, size.height]);
        if (titlePage.title) tp.drawText(titlePage.title, { x: 60, y: size.height * 0.6, size: 36, color: rgb(0.1, 0.1, 0.1) });
        if (titlePage.subtitle) tp.drawText(titlePage.subtitle, { x: 60, y: size.height * 0.5, size: 18, color: rgb(0.3, 0.3, 0.3) });
        if (titlePage.date) tp.drawText(titlePage.date, { x: 60, y: size.height * 0.4, size: 14, color: rgb(0.5, 0.5, 0.5) });
      }

      // Process each page item
      for (const item of pages) {
        setProcessing({ status: "processing", progress: (++step / totalSteps) * 100, message: `Processing ${item.name}…` });

        if (item.type === "pdf-page" && item.pdfBytes) {
          // Re-embed PDF page as-is
          const srcDoc = await PDFDocument.load(item.pdfBytes);
          const [copiedPage] = await outputDoc.copyPages(srcDoc, [0]);
          outputDoc.addPage(copiedPage);

        } else if (item.type === "image" && item.file) {
          const imageBytes = await item.file.arrayBuffer();
          let embeddedImage;
          if (item.file.type === "image/png") {
            embeddedImage = await outputDoc.embedPng(imageBytes);
          } else {
            embeddedImage = await outputDoc.embedJpg(imageBytes);
          }

          // *** Margin fix: force 0 when "fit" ***
          const effectiveMargin = pageSize === "fit" ? 0 : MARGIN_VALUES[margins];

          let pageWidth: number;
          let pageHeight: number;

          if (pageSize === "fit") {
            pageWidth = embeddedImage.width;
            pageHeight = embeddedImage.height;
          } else {
            const size = PAGE_SIZES[pageSize];
            const imgIsPortrait = embeddedImage.height >= embeddedImage.width;
            let usePortrait: boolean;
            if (orientation === "auto") usePortrait = imgIsPortrait;
            else usePortrait = orientation === "portrait";
            pageWidth = usePortrait ? size.width : size.height;
            pageHeight = usePortrait ? size.height : size.width;
          }

          const page = outputDoc.addPage([pageWidth, pageHeight]);
          const availableWidth = pageWidth - effectiveMargin * 2;
          const availableHeight = pageHeight - effectiveMargin * 2;

          const scale = Math.min(
            availableWidth / embeddedImage.width,
            availableHeight / embeddedImage.height,
          );

          const scaledWidth = embeddedImage.width * scale;
          const scaledHeight = embeddedImage.height * scale;
          const x = effectiveMargin + (availableWidth - scaledWidth) / 2;
          const y = effectiveMargin + (availableHeight - scaledHeight) / 2;

          page.drawImage(embeddedImage, { x, y, width: scaledWidth, height: scaledHeight });
        }
      }

      setProcessing({ status: "processing", progress: (++step / totalSteps) * 100, message: "Saving PDF…" });
      const pdfBytes = await outputDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      setGeneratedPdf(blob);
      setProcessing({ status: "done", progress: 100, message: "PDF ready!" });
      toast.success("PDF generated successfully!");

    } catch (error) {
      console.error("PDF generation error:", error);
      setProcessing({ status: "failed", progress: 0, message: error instanceof Error ? error.message : "Failed" });
      toast.error("Failed to generate PDF.");
    }
  };

  const downloadPdf = () => {
    if (!generatedPdf) return;
    const url = URL.createObjectURL(generatedPdf);
    const link = document.createElement("a");
    link.href = url;
    link.download = "media-export.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded!");
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const allSelected = pages.length > 0 && selected.size === pages.length;
  const someSelected = selected.size > 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0B", color: "#fff" }}>

      {/* ── Hero ── */}
      <section className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10"
            style={{ background: `radial-gradient(ellipse, ${GOLD}, transparent 70%)` }} />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5 border"
            style={{ background: `${GOLD}1A`, color: GOLD, borderColor: `${GOLD}44` }}>
            <Sparkles className="h-3 w-3" /> Free Tool
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
            Media <span style={{ color: GOLD }}>→ PDF</span> Merger
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
            Combine images &amp; PDFs into a single document. Reorder pages, merge PDFs, and export with zero white borders.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* ── Step 1: Upload ── */}
            <GoldCard>
              <StepHeader n={1} title="Upload Media" sub="Images (JPG, PNG, WEBP) and PDFs — drag &amp; drop or click" />

              {/* Drop Zone */}
              <div
                className="relative rounded-xl p-10 text-center cursor-pointer transition-all duration-300 mt-4"
                style={{
                  border: `2px dashed ${dragActive ? GOLD : `${GOLD}55`}`,
                  background: dragActive ? `${GOLD}08` : "rgba(255,255,255,0.02)",
                  boxShadow: dragActive ? `0 0 30px ${GOLD}22` : "none",
                }}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/heic,image/webp,.jpg,.jpeg,.png,.heic,.webp,.pdf"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                />

                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-12 w-12 animate-spin" style={{ color: GOLD }} />
                    <p style={{ color: "rgba(255,255,255,0.7)" }}>Processing files…</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: dragActive ? GOLD : `${GOLD}88` }} />
                    <p className="text-lg font-semibold text-white mb-1">
                      {dragActive ? "Drop files here" : "Drag & drop images or PDFs"}
                    </p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                      JPG · PNG · WEBP · HEIC · PDF — up to 50 files
                    </p>
                  </>
                )}
              </div>

              {/* Page List */}
              <AnimatePresence>
                {pages.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {pages.length} page{pages.length !== 1 ? "s" : ""} · drag to reorder
                        </span>
                        <button
                          className="text-xs px-2 py-1 rounded transition-colors"
                          style={{ color: GOLD, border: `1px solid ${GOLD}44`, background: "transparent" }}
                          onClick={allSelected ? deselectAll : selectAll}
                        >
                          {allSelected ? "Deselect All" : "Select All"}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {someSelected && (
                          <button
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
                            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
                            onClick={deleteSelected}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete {selected.size}
                          </button>
                        )}
                        <button
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
                          onClick={clearAll}
                        >
                          <X className="h-3.5 w-3.5" /> Clear All
                        </button>
                        <button
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
                          style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}44` }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FilePlus2 className="h-3.5 w-3.5" /> Add More
                        </button>
                      </div>
                    </div>

                    {/* Reorderable list */}
                    <Reorder.Group axis="y" values={pages} onReorder={setPages} className="space-y-2">
                      {pages.map((page, idx) => (
                        <Reorder.Item
                          key={page.id}
                          value={page}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing"
                          style={{
                            background: selected.has(page.id)
                              ? `${GOLD}12`
                              : "rgba(255,255,255,0.03)",
                            border: selected.has(page.id)
                              ? `1px solid ${GOLD}44`
                              : "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          {/* Checkbox */}
                          <div
                            className="w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer"
                            style={{
                              borderColor: selected.has(page.id) ? GOLD : "rgba(255,255,255,0.2)",
                              background: selected.has(page.id) ? `${GOLD}33` : "transparent",
                            }}
                            onClick={(e) => { e.stopPropagation(); toggleSelect(page.id); }}
                          >
                            {selected.has(page.id) && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>

                          <GripVertical className="h-4 w-4 shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />

                          {/* Thumbnail */}
                          <div className="w-14 h-10 rounded overflow-hidden shrink-0 flex items-center justify-center"
                            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            {page.type === "image" && page.url ? (
                              <img src={page.url} alt={page.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center gap-0.5">
                                <FileText className="h-4 w-4" style={{ color: GOLD }} />
                                <span className="text-[9px] font-bold" style={{ color: GOLD }}>
                                  {page.pageIndex !== undefined ? `P${(page.pageIndex ?? 0) + 1}` : "PDF"}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{page.name}</p>
                            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                              {page.width && page.height ? `${Math.round(page.width)} × ${Math.round(page.height)} pt` : page.sourceFile}
                            </p>
                          </div>

                          {/* Index badge */}
                          <span className="text-xs font-mono px-2 py-0.5 rounded shrink-0"
                            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}>
                            #{idx + 1}
                          </span>

                          {/* Type badge */}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
                            style={page.type === "image"
                              ? { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }
                              : { background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}44` }}>
                            {page.type === "image" ? "IMAGE" : "PDF"}
                          </span>

                          {/* Delete */}
                          <button
                            className="shrink-0 h-7 w-7 flex items-center justify-center rounded hover:bg-red-500/15 transition-colors"
                            style={{ color: "rgba(255,255,255,0.3)" }}
                            onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </motion.div>
                )}
              </AnimatePresence>
            </GoldCard>

            {/* ── Step 2: Settings ── */}
            <GoldCard>
              <button
                className="w-full text-left"
                onClick={() => setSettingsOpen(o => !o)}
              >
                <div className="flex items-center justify-between">
                  <StepHeader n={2} title="PDF Settings" sub="Page size, orientation, margins" noMb />
                  {settingsOpen
                    ? <ChevronUp className="h-4 w-4" style={{ color: GOLD }} />
                    : <ChevronDown className="h-4 w-4" style={{ color: GOLD }} />}
                </div>
              </button>

              <AnimatePresence>
                {settingsOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden">
                    <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                      {/* Page Size */}
                      <div>
                        <Label className="text-white/80 text-sm font-semibold mb-3 block">Page Size</Label>
                        <RadioGroup value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)} className="space-y-2">
                          {(["a4", "letter", "fit"] as PageSize[]).map(v => (
                            <label key={v} className="flex items-center gap-2 cursor-pointer">
                              <RadioGroupItem value={v} id={`ps-${v}`} className="border-white/30" />
                              <span className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                                {v === "a4" ? "A4 (210 × 297 mm)" : v === "letter" ? "Letter (8.5 × 11 in)" : "Fit to Image"}
                              </span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Orientation */}
                      <div>
                        <Label className="text-white/80 text-sm font-semibold mb-3 block">Orientation</Label>
                        <RadioGroup value={orientation} onValueChange={(v) => setOrientation(v as Orientation)} className="space-y-2">
                          {(["auto", "portrait", "landscape"] as Orientation[]).map(v => (
                            <label key={v} className="flex items-center gap-2 cursor-pointer">
                              <RadioGroupItem value={v} id={`or-${v}`} className="border-white/30" />
                              <span className="text-sm capitalize" style={{ color: "rgba(255,255,255,0.75)" }}>
                                {v === "auto" ? "Auto (match image)" : v}
                              </span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Margins */}
                      <div>
                        <Label className="text-white/80 text-sm font-semibold mb-3 block">
                          Margins
                          {pageSize === "fit" && (
                            <span className="ml-2 text-xs font-normal" style={{ color: GOLD }}>
                              (forced to none for Fit)
                            </span>
                          )}
                        </Label>
                        <RadioGroup value={pageSize === "fit" ? "none" : margins}
                          onValueChange={(v) => setMargins(v as Margins)} className="space-y-2"
                          style={{ opacity: pageSize === "fit" ? 0.5 : 1, pointerEvents: pageSize === "fit" ? "none" : "auto" }}>
                          {(["none", "small", "normal"] as Margins[]).map(v => (
                            <label key={v} className="flex items-center gap-2 cursor-pointer">
                              <RadioGroupItem value={v} id={`mg-${v}`} className="border-white/30" />
                              <span className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                                {v === "none" ? "None (full bleed)" : v === "small" ? "Small (0.5 in)" : "Normal (1 in)"}
                              </span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>

                    {/* Title Page */}
                    <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-center gap-3 mb-4">
                        <Switch
                          checked={titlePage.enabled}
                          onCheckedChange={e => setTitlePage(p => ({ ...p, enabled: e }))}
                        />
                        <Label className="text-white/80 text-sm font-semibold cursor-pointer">Add Title Page</Label>
                      </div>
                      {titlePage.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            placeholder="Title"
                            value={titlePage.title}
                            onChange={e => setTitlePage(p => ({ ...p, title: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                          />
                          <Input
                            placeholder="Subtitle"
                            value={titlePage.subtitle}
                            onChange={e => setTitlePage(p => ({ ...p, subtitle: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                          />
                          <Input
                            placeholder="Date"
                            value={titlePage.date}
                            onChange={e => setTitlePage(p => ({ ...p, date: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GoldCard>

            {/* ── Step 3: Generate ── */}
            <GoldCard>
              <StepHeader n={3} title="Generate PDF" sub="Merge all pages into a single downloadable PDF" />

              <div className="mt-5 space-y-5">
                {/* Progress */}
                {processing.status === "processing" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>{processing.message}</span>
                      <span style={{ color: GOLD }}>{Math.round(processing.progress)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${GOLD}, #e8c56a)` }}
                        animate={{ width: `${processing.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {/* Status messages */}
                {processing.status === "done" && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: "#4ade80" }}>
                    <CheckCircle2 className="h-4 w-4" /> PDF generated successfully!
                  </div>
                )}
                {processing.status === "failed" && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: "#f87171" }}>
                    <AlertCircle className="h-4 w-4" /> {processing.message}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                    style={{ background: GOLD, color: "#000" }}
                    onClick={generatePdf}
                    disabled={pages.length === 0 || processing.status === "processing"}
                  >
                    {processing.status === "processing" ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Generate PDF</>
                    )}
                  </button>

                  {generatedPdf && (
                    <button
                      className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all"
                      style={{ background: "transparent", border: `2px solid ${GOLD}`, color: GOLD }}
                      onClick={downloadPdf}
                    >
                      <Download className="h-4 w-4" /> Download PDF
                    </button>
                  )}
                </div>
              </div>
            </GoldCard>

          </div>
        </div>
      </section>
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const GOLD_C = "#C9A84C";

function GoldCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "linear-gradient(135deg, #111113, #16161A)",
        border: `1px solid ${GOLD_C}28`,
      }}
    >
      {children}
    </div>
  );
}

function StepHeader({ n, title, sub, noMb }: { n: number; title: string; sub: string; noMb?: boolean }) {
  return (
    <div className={`flex items-start gap-3 ${noMb ? "" : "mb-1"}`}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
        style={{
          background: `${GOLD_C}22`,
          color: GOLD_C,
          border: `1px solid ${GOLD_C}44`,
          boxShadow: `0 0 16px ${GOLD_C}28`,
        }}
      >
        {n}
      </div>
      <div>
        <h3 className="text-white font-semibold text-base">{title}</h3>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }} dangerouslySetInnerHTML={{ __html: sub }} />
      </div>
    </div>
  );
}

export default PdfFromPhotos;
