import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Upload, Download, FileText, Sparkles, Loader2, CheckCircle2,
  X, Trash2, GripVertical, FilePlus2, AlertCircle,
  ChevronDown, ChevronUp, LayoutGrid, List, RotateCw, ImageIcon,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { PDFDocument, rgb, degrees } from "pdf-lib";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageItem {
  id: string;
  type: "image" | "pdf-page";
  name: string;
  sourceFile: string;
  url: string;
  file?: File;
  width?: number;
  height?: number;
  pdfBytes?: ArrayBuffer;
  pageIndex?: number;
  rotation?: number;
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
type ViewMode = "list" | "grid";

interface ProcessingState {
  status: "idle" | "processing" | "done" | "failed";
  progress: number;
  message: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89, name: "A4" },
  letter: { width: 612, height: 792, name: "Letter" },
  fit: { width: 0, height: 0, name: "Fit to Image" },
};

const MARGIN_VALUES: Record<Margins, number> = {
  none: 0,
  small: 36,
  normal: 72,
};

// ─── Gold Palette ─────────────────────────────────────────────────────────────

const G = {
  gold: "#C8A766",
  goldBright: "#E4C47A",
  goldDim: "#A08040",
  bg: "rgba(200,167,102,0.06)",
  bgHover: "rgba(200,167,102,0.12)",
  border: "rgba(200,167,102,0.22)",
  borderHover: "rgba(200,167,102,0.55)",
  glow: "rgba(200,167,102,0.18)",
  text: "#C8A766",
  surface: "#0E1018",
  surfaceCard: "#111520",
  surfaceMid: "#151B28",
};

// ─── Component ────────────────────────────────────────────────────────────────

const PdfFromPhotos = ({ embedded = false }: { embedded?: boolean }) => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margins, setMargins] = useState<Margins>("normal");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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

  // ── Image dimension helper ─────────────────────────────────────────────────

  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = url;
    });

  // ── File routing ──────────────────────────────────────────────────────────

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
          rotation: 0,
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
          rotation: 0,
        });
      }

      setPages(prev => [...prev, ...newPages]);
      toast.success(`Extracted ${pageCount} page${pageCount > 1 ? "s" : ""} from ${file.name}`);
    } catch (err) {
      console.error("PDF parse error:", err);
      toast.error(`Failed to read PDF: ${file.name}`);
    }
  };

  // ── Drop / Input ──────────────────────────────────────────────────────────

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

  // ── Selection ─────────────────────────────────────────────────────────────

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

  const rotatePage = (id: string) => {
    setPages(prev => prev.map(p => p.id === id
      ? { ...p, rotation: ((p.rotation ?? 0) + 90) % 360 }
      : p
    ));
  };

  // ── PDF Generation ────────────────────────────────────────────────────────

  const generatePdf = async () => {
    if (pages.length === 0) { toast.error("Add at least one image or PDF page"); return; }

    setProcessing({ status: "processing", progress: 0, message: "Initializing…" });
    setGeneratedPdf(null);

    try {
      const outputDoc = await PDFDocument.create();
      const totalSteps = pages.length + (titlePage.enabled ? 1 : 0) + 1;
      let step = 0;

      // Optional title page
      if (titlePage.enabled) {
        setProcessing({ status: "processing", progress: (++step / totalSteps) * 100, message: "Creating title page…" });
        const size = pageSize === "fit" ? PAGE_SIZES.a4 : PAGE_SIZES[pageSize];
        const tp = outputDoc.addPage([size.width, size.height]);
        if (titlePage.title) tp.drawText(titlePage.title, { x: 60, y: size.height * 0.6, size: 36, color: rgb(0.1, 0.1, 0.1) });
        if (titlePage.subtitle) tp.drawText(titlePage.subtitle, { x: 60, y: size.height * 0.5, size: 18, color: rgb(0.3, 0.3, 0.3) });
        if (titlePage.date) tp.drawText(titlePage.date, { x: 60, y: size.height * 0.4, size: 14, color: rgb(0.5, 0.5, 0.5) });
      }

      for (const item of pages) {
        setProcessing({ status: "processing", progress: (++step / totalSteps) * 100, message: `Processing ${item.name}…` });

        if (item.type === "pdf-page" && item.pdfBytes) {
          // ── PDF page passthrough ──
          const srcDoc = await PDFDocument.load(item.pdfBytes);
          const [copiedPage] = await outputDoc.copyPages(srcDoc, [0]);
          // Apply user-defined rotation on top of page's own rotation
          if (item.rotation && item.rotation !== 0) {
            const existing = copiedPage.getRotation().angle;
            copiedPage.setRotation(degrees((existing + item.rotation) % 360));
          }
          outputDoc.addPage(copiedPage);

        } else if (item.type === "image" && item.file) {
          // ── Image embedding ──
          const imageBytes = await item.file.arrayBuffer();
          let embeddedImage;
          const mime = item.file.type.toLowerCase();

          if (mime === "image/png") {
            embeddedImage = await outputDoc.embedPng(imageBytes);
          } else {
            // JPEG (and HEIC fallback — HEIC unsupported by pdf-lib, embed as JPEG if browser converted it)
            embeddedImage = await outputDoc.embedJpg(imageBytes);
          }

          // Margin: strictly 0 when pageSize==="fit"
          const effectiveMargin = pageSize === "fit" ? 0 : MARGIN_VALUES[margins];

          let pageW: number;
          let pageH: number;

          if (pageSize === "fit") {
            // Page = exact image pixel dimensions → zero border guaranteed
            pageW = embeddedImage.width;
            pageH = embeddedImage.height;
          } else {
            const size = PAGE_SIZES[pageSize];
            const imgIsPortrait = embeddedImage.height >= embeddedImage.width;
            const usePortrait = orientation === "auto" ? imgIsPortrait : orientation === "portrait";
            pageW = usePortrait ? size.width : size.height;
            pageH = usePortrait ? size.height : size.width;
          }

          const page = outputDoc.addPage([pageW, pageH]);

          // Apply rotation
          if (item.rotation && item.rotation !== 0) {
            page.setRotation(degrees(item.rotation));
          }

          const availW = pageW - effectiveMargin * 2;
          const availH = pageH - effectiveMargin * 2;
          const scale = Math.min(availW / embeddedImage.width, availH / embeddedImage.height);
          const scaledW = embeddedImage.width * scale;
          const scaledH = embeddedImage.height * scale;
          // Centre within available area
          const x = effectiveMargin + (availW - scaledW) / 2;
          const y = effectiveMargin + (availH - scaledH) / 2;

          page.drawImage(embeddedImage, { x, y, width: scaledW, height: scaledH });
        }
      }

      setProcessing({ status: "processing", progress: (++step / totalSteps) * 100, message: "Saving PDF…" });
      const pdfBytes = await outputDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      setGeneratedPdf(blob);
      setProcessing({ status: "done", progress: 100, message: "PDF ready!" });
      toast.success("PDF generated — ready to download!");
    } catch (error) {
      console.error("PDF generation error:", error);
      const msg = error instanceof Error ? error.message : "Unknown error";
      setProcessing({ status: "failed", progress: 0, message: msg });
      toast.error("Failed to generate PDF.");
    }
  };

  const downloadPdf = () => {
    if (!generatedPdf) return;
    const url = URL.createObjectURL(generatedPdf);
    const link = document.createElement("a");
    link.href = url;
    link.download = `media-export-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("PDF downloaded!");
  };

  const allSelected = pages.length > 0 && selected.size === pages.length;
  const someSelected = selected.size > 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={embedded ? "" : "min-h-screen"} style={{ background: G.surface, color: "#fff" }}>

      {/* ── Hero (standalone only) ── */}
      {!embedded && (
        <section className="relative py-16 md:py-20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20"
              style={{ background: `radial-gradient(ellipse, ${G.gold}, transparent 70%)` }} />
          </div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5 border"
              style={{ background: G.bg, color: G.gold, borderColor: G.border }}>
              <Sparkles className="h-3 w-3" /> Free Tool
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              Media <span style={{ color: G.gold }}>→ PDF</span> Merger
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
              Combine images &amp; PDFs into one document. Reorder pages, set margins, export with zero white borders.
            </p>
          </div>
        </section>
      )}

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-5">

            {/* ── Step 1: Upload ── */}
            <GoldCard>
              <StepHeader n={1} title="Upload Media" sub="Images (JPG, PNG, WEBP) and PDFs — drag &amp; drop or click" />

              {/* Drop Zone */}
              <div
                className="relative rounded-xl p-10 text-center cursor-pointer transition-all duration-300 mt-5"
                style={{
                  border: `2px dashed ${dragActive ? G.gold : G.border}`,
                  background: dragActive ? G.bgHover : G.bg,
                  boxShadow: dragActive ? `0 0 40px ${G.glow}` : "none",
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
                    <Loader2 className="h-12 w-12 animate-spin" style={{ color: G.gold }} />
                    <p style={{ color: "rgba(255,255,255,0.6)" }}>Processing files…</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                      style={{ background: G.bg, border: `1px solid ${G.border}`, boxShadow: `0 0 24px ${G.glow}` }}>
                      <Upload className="h-7 w-7" style={{ color: dragActive ? G.goldBright : G.gold }} />
                    </div>
                    <p className="text-lg font-semibold text-white mb-1">
                      {dragActive ? "Drop files here" : "Drag & drop images or PDFs"}
                    </p>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
                      JPG · PNG · WEBP · HEIC · PDF — up to 50 files
                    </p>
                  </>
                )}
              </div>

              {/* ── Page list ── */}
              <AnimatePresence>
                {pages.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
                          {pages.length} page{pages.length !== 1 ? "s" : ""}
                        </span>
                        <GoldPill onClick={allSelected ? deselectAll : selectAll}>
                          {allSelected ? "Deselect All" : "Select All"}
                        </GoldPill>
                        {/* View toggle */}
                        <div className="flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${G.border}` }}>
                          <button
                            className="p-1.5 transition-colors"
                            style={{ background: viewMode === "list" ? G.bg : "transparent", color: viewMode === "list" ? G.gold : "rgba(255,255,255,0.35)" }}
                            onClick={() => setViewMode("list")} title="List view"
                          >
                            <List className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="p-1.5 transition-colors"
                            style={{ background: viewMode === "grid" ? G.bg : "transparent", color: viewMode === "grid" ? G.gold : "rgba(255,255,255,0.35)" }}
                            onClick={() => setViewMode("grid")} title="Grid view"
                          >
                            <LayoutGrid className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {someSelected && (
                          <button
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.28)" }}
                            onClick={deleteSelected}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete {selected.size}
                          </button>
                        )}
                        <button
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
                          onClick={clearAll}
                        >
                          <X className="h-3.5 w-3.5" /> Clear All
                        </button>
                        <button
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: G.bg, color: G.gold, border: `1px solid ${G.border}` }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FilePlus2 className="h-3.5 w-3.5" /> Add More
                        </button>
                      </div>
                    </div>

                    {/* ── List View ── */}
                    {viewMode === "list" && (
                      <Reorder.Group axis="y" values={pages} onReorder={setPages} className="space-y-2">
                        {pages.map((page, idx) => {
                          const isSel = selected.has(page.id);
                          return (
                            <Reorder.Item
                              key={page.id}
                              value={page}
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-grab active:cursor-grabbing transition-all"
                              style={{
                                background: isSel ? "rgba(200,167,102,0.10)" : G.surfaceMid,
                                border: `1px solid ${isSel ? G.border : "rgba(255,255,255,0.06)"}`,
                                boxShadow: isSel ? `0 0 16px ${G.glow}` : "none",
                              }}
                            >
                              {/* Checkbox */}
                              <div
                                className="w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer"
                                style={{
                                  borderColor: isSel ? G.gold : "rgba(255,255,255,0.28)",
                                  background: isSel ? G.gold : "transparent",
                                }}
                                onClick={(e) => { e.stopPropagation(); toggleSelect(page.id); }}
                              >
                                {isSel && (
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="#0E1018" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>

                              <GripVertical className="h-4 w-4 shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />

                              {/* Thumbnail */}
                              <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                                style={{ background: "rgba(0,0,0,0.5)", border: `1px solid rgba(200,167,102,0.12)` }}>
                                {page.type === "image" && page.url ? (
                                  <img src={page.url} alt={page.name} className="w-full h-full object-cover"
                                    style={{ transform: `rotate(${page.rotation ?? 0}deg)`, transition: "transform 0.3s" }} />
                                ) : (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <FileText className="h-4 w-4" style={{ color: G.gold }} />
                                    <span className="text-[9px] font-bold" style={{ color: G.gold }}>
                                      P{(page.pageIndex ?? 0) + 1}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{page.name}</p>
                                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.38)" }}>
                                  {page.width && page.height
                                    ? `${Math.round(page.width)} × ${Math.round(page.height)} pt`
                                    : page.sourceFile}
                                  {(page.rotation ?? 0) !== 0 && (
                                    <span style={{ color: G.goldDim }}> · {page.rotation}° rotated</span>
                                  )}
                                </p>
                              </div>

                              {/* Index badge */}
                              <span className="text-xs font-mono px-2 py-0.5 rounded shrink-0"
                                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" }}>
                                #{idx + 1}
                              </span>

                              {/* Type badge */}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
                                style={page.type === "image"
                                  ? { background: "rgba(200,167,102,0.15)", color: G.goldBright, border: `1px solid rgba(200,167,102,0.28)` }
                                  : { background: "rgba(200,167,102,0.08)", color: G.gold, border: `1px solid rgba(200,167,102,0.18)` }}>
                                {page.type === "image" ? "IMG" : "PDF"}
                              </span>

                              {/* Rotate */}
                              <button
                                className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                                style={{ color: "rgba(255,255,255,0.3)" }}
                                onClick={(e) => { e.stopPropagation(); rotatePage(page.id); }}
                                title="Rotate 90°"
                              >
                                <RotateCw className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg transition-colors hover:bg-red-500/15"
                                style={{ color: "rgba(255,255,255,0.28)" }}
                                onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </Reorder.Item>
                          );
                        })}
                      </Reorder.Group>
                    )}

                    {/* ── Grid View ── */}
                    {viewMode === "grid" && (
                      <Reorder.Group axis="y" values={pages} onReorder={setPages}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {pages.map((page, idx) => {
                          const isSel = selected.has(page.id);
                          return (
                            <Reorder.Item
                              key={page.id}
                              value={page}
                              className="rounded-xl overflow-hidden cursor-grab active:cursor-grabbing relative group"
                              style={{
                                background: G.surfaceMid,
                                border: `2px solid ${isSel ? G.gold : "rgba(200,167,102,0.12)"}`,
                                boxShadow: isSel ? `0 0 20px ${G.glow}` : "none",
                              }}
                              onClick={() => toggleSelect(page.id)}
                            >
                              {/* Thumbnail */}
                              <div className="w-full aspect-[3/4] relative overflow-hidden"
                                style={{ background: "rgba(0,0,0,0.5)" }}>
                                {page.type === "image" && page.url ? (
                                  <img src={page.url} alt={page.name} className="w-full h-full object-cover"
                                    style={{ transform: `rotate(${page.rotation ?? 0}deg)` }} />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                    <FileText className="h-10 w-10" style={{ color: G.gold }} />
                                    <span className="text-xs font-bold" style={{ color: G.gold }}>
                                      PDF P{(page.pageIndex ?? 0) + 1}
                                    </span>
                                  </div>
                                )}
                                {/* Selection overlay */}
                                {isSel && (
                                  <div className="absolute inset-0 flex items-center justify-center"
                                    style={{ background: "rgba(200,167,102,0.22)" }}>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                                      style={{ background: G.gold }}>
                                      <svg width="14" height="12" viewBox="0 0 10 8" fill="none">
                                        <path d="M1 4L3.5 6.5L9 1" stroke="#0E1018" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                                {/* Index badge */}
                                <span className="absolute top-1.5 left-1.5 text-xs font-mono px-1.5 py-0.5 rounded"
                                  style={{ background: "rgba(0,0,0,0.7)", color: "rgba(255,255,255,0.65)" }}>
                                  #{idx + 1}
                                </span>
                                {/* Rotate on hover */}
                                <button
                                  className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                                  style={{ background: "rgba(200,167,102,0.85)" }}
                                  onClick={(e) => { e.stopPropagation(); rotatePage(page.id); }}
                                >
                                  <RotateCw className="h-3 w-3" style={{ color: "#0E1018" }} />
                                </button>
                                {/* Delete on hover */}
                                <button
                                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden group-hover:flex"
                                  style={{ background: "rgba(239,68,68,0.8)" }}
                                  onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                                >
                                  <X className="h-3 w-3 text-white" />
                                </button>
                              </div>
                              {/* Name */}
                              <div className="px-2 py-1.5">
                                <p className="text-xs text-white truncate">{page.name}</p>
                                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.38)" }}>
                                  {page.type === "image" ? "Image" : "PDF page"}
                                </p>
                              </div>
                            </Reorder.Item>
                          );
                        })}
                      </Reorder.Group>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </GoldCard>

            {/* ── Step 2: Settings ── */}
            <GoldCard>
              <button className="w-full text-left" onClick={() => setSettingsOpen(o => !o)}>
                <div className="flex items-center justify-between">
                  <StepHeader n={2} title="PDF Settings" sub="Page size, orientation, margins" noMb />
                  {settingsOpen
                    ? <ChevronUp className="h-4 w-4" style={{ color: G.gold }} />
                    : <ChevronDown className="h-4 w-4" style={{ color: G.gold }} />}
                </div>
              </button>

              <AnimatePresence>
                {settingsOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                      {/* Page Size */}
                      <div>
                        <Label className="text-sm font-semibold mb-3 block" style={{ color: G.text }}>Page Size</Label>
                        <RadioGroup value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)} className="space-y-2.5">
                          {(["a4", "letter", "fit"] as PageSize[]).map(v => (
                            <label key={v} className="flex items-center gap-2.5 cursor-pointer group">
                              <RadioGroupItem value={v} id={`ps-${v}`}
                                className="border-white/25 text-amber-400 data-[state=checked]:border-amber-400" />
                              <span className="text-sm transition-colors group-hover:text-white"
                                style={{ color: pageSize === v ? "#fff" : "rgba(255,255,255,0.6)" }}>
                                {v === "a4" ? "A4 (210 × 297 mm)" : v === "letter" ? "Letter (8.5 × 11 in)" : "Fit to Image"}
                              </span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Orientation */}
                      <div>
                        <Label className="text-sm font-semibold mb-3 block" style={{ color: G.text }}>Orientation</Label>
                        <RadioGroup value={orientation} onValueChange={(v) => setOrientation(v as Orientation)} className="space-y-2.5">
                          {(["auto", "portrait", "landscape"] as Orientation[]).map(v => (
                            <label key={v} className="flex items-center gap-2.5 cursor-pointer group">
                              <RadioGroupItem value={v} id={`or-${v}`}
                                className="border-white/25 text-amber-400 data-[state=checked]:border-amber-400" />
                              <span className="text-sm transition-colors group-hover:text-white"
                                style={{ color: orientation === v ? "#fff" : "rgba(255,255,255,0.6)" }}>
                                {v === "auto" ? "Auto (match image)" : v.charAt(0).toUpperCase() + v.slice(1)}
                              </span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Margins */}
                      <div>
                        <Label className="text-sm font-semibold mb-3 block" style={{ color: G.text }}>
                          Margins
                          {pageSize === "fit" && (
                            <span className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded"
                              style={{ background: "rgba(200,167,102,0.15)", color: G.goldDim }}>
                              forced to none for Fit
                            </span>
                          )}
                        </Label>
                        <RadioGroup
                          value={pageSize === "fit" ? "none" : margins}
                          onValueChange={(v) => setMargins(v as Margins)}
                          className="space-y-2.5"
                          style={{ opacity: pageSize === "fit" ? 0.45 : 1, pointerEvents: pageSize === "fit" ? "none" : "auto" }}>
                          {(["none", "small", "normal"] as Margins[]).map(v => (
                            <label key={v} className="flex items-center gap-2.5 cursor-pointer group">
                              <RadioGroupItem value={v} id={`mg-${v}`}
                                className="border-white/25 text-amber-400 data-[state=checked]:border-amber-400" />
                              <span className="text-sm transition-colors group-hover:text-white"
                                style={{ color: (pageSize === "fit" ? "none" : margins) === v ? "#fff" : "rgba(255,255,255,0.6)" }}>
                                {v === "none" ? "None (full bleed)" : v === "small" ? "Small (0.5 in)" : "Normal (1 in)"}
                              </span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>
                    </div>

                    {/* Title Page */}
                    <div className="mt-6 pt-6" style={{ borderTop: `1px solid rgba(200,167,102,0.1)` }}>
                      <div className="flex items-center gap-3 mb-4">
                        <Switch
                          checked={titlePage.enabled}
                          onCheckedChange={e => setTitlePage(p => ({ ...p, enabled: e }))}
                          className="data-[state=checked]:bg-amber-500"
                        />
                        <Label className="text-sm font-semibold cursor-pointer" style={{ color: G.text }}>
                          Add Title Page
                        </Label>
                      </div>
                      {titlePage.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input placeholder="Title" value={titlePage.title}
                            onChange={e => setTitlePage(p => ({ ...p, title: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50" />
                          <Input placeholder="Subtitle" value={titlePage.subtitle}
                            onChange={e => setTitlePage(p => ({ ...p, subtitle: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50" />
                          <Input placeholder="Date" value={titlePage.date}
                            onChange={e => setTitlePage(p => ({ ...p, date: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50" />
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

                {/* Progress bar */}
                {processing.status === "processing" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "rgba(255,255,255,0.55)" }}>{processing.message}</span>
                      <span style={{ color: G.gold }}>{Math.round(processing.progress)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${G.goldDim}, ${G.goldBright})` }}
                        animate={{ width: `${processing.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {/* Status messages */}
                {processing.status === "done" && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                    style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    PDF generated — ready to download!
                  </motion.div>
                )}
                {processing.status === "failed" && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", color: "#f87171" }}>
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {processing.message}
                  </motion.div>
                )}

                {/* Summary */}
                {pages.length > 0 && processing.status === "idle" && (
                  <div className="flex flex-wrap gap-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                      style={{ background: G.bg, border: `1px solid ${G.border}`, color: G.text }}>
                      <ImageIcon className="h-3.5 w-3.5" />
                      {pages.filter(p => p.type === "image").length} image{pages.filter(p => p.type === "image").length !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                      style={{ background: G.bg, border: `1px solid ${G.border}`, color: G.text }}>
                      <FileText className="h-3.5 w-3.5" />
                      {pages.filter(p => p.type === "pdf-page").length} PDF page{pages.filter(p => p.type === "pdf-page").length !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                      Mode: {pageSize === "fit" ? "Fit to Image (0 margin)" : `${pageSize.toUpperCase()} · ${margins} margin`}
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    className="flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                    style={{
                      background: `linear-gradient(135deg, ${G.goldDim}, ${G.gold})`,
                      color: "#0E1018",
                      boxShadow: `0 4px 20px ${G.glow}`,
                    }}
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
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all"
                      style={{
                        background: "transparent",
                        border: `2px solid ${G.gold}`,
                        color: G.gold,
                        boxShadow: `0 0 24px ${G.glow}`,
                      }}
                      onClick={downloadPdf}
                    >
                      <Download className="h-4 w-4" /> Download PDF
                    </motion.button>
                  )}
                </div>

                {/* Local processing note */}
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
                  All processing is done locally in your browser — no files are uploaded to any server.
                </p>
              </div>
            </GoldCard>

          </div>
        </div>
      </section>
    </div>
  );
};

export default PdfFromPhotos;

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoldCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{
      background: "linear-gradient(145deg, #111520, #0D1019)",
      border: "1px solid rgba(200,167,102,0.18)",
      boxShadow: "0 2px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(200,167,102,0.06)",
    }}>
      {children}
    </div>
  );
}

function GoldPill({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className="text-xs px-2.5 py-1 rounded-lg transition-colors"
      style={{ color: "#C8A766", border: "1px solid rgba(200,167,102,0.22)", background: "transparent" }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function StepHeader({ n, title, sub, noMb }: { n: number; title: string; sub: string; noMb?: boolean }) {
  return (
    <div className={`flex items-start gap-3 ${noMb ? "" : "mb-1"}`}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
        style={{
          background: "rgba(200,167,102,0.15)",
          color: "#C8A766",
          border: "1px solid rgba(200,167,102,0.35)",
          boxShadow: "0 0 16px rgba(200,167,102,0.15)",
        }}>
        {n}
      </div>
      <div>
        <h3 className="text-white font-semibold text-base">{title}</h3>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}
          dangerouslySetInnerHTML={{ __html: sub }} />
      </div>
    </div>
  );
}
