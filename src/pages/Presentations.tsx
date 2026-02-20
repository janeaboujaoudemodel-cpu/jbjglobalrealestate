import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Trash2, ChevronLeft, ChevronRight, Play, Download, 
  FileText, Image as ImageIcon, Camera, Presentation, Palette,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  Save, Share2, Printer, Monitor, X, Check, Sparkles, Layout,
  LayoutGrid, Maximize2, FileDown
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
// jsPDF imported dynamically

interface Slide {
  id: string;
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  layout: "title" | "content" | "two-column" | "image" | "blank";
  imageUrl?: string;
  textAlign: "left" | "center" | "right";
  fontFamily: string;
  titleSize: number;
  contentSize: number;
}

const TEMPLATES = [
  { id: "business", name: "Business", bg: "#0f172a", text: "#f8fafc", accent: "#3b82f6", desc: "Professional dark blue" },
  { id: "pitch", name: "Pitch Deck", bg: "#1a0a2e", text: "#f8fafc", accent: "#8b5cf6", desc: "Startup pitch deck" },
  { id: "minimal", name: "Minimal", bg: "#ffffff", text: "#111827", accent: "#374151", desc: "Clean white minimal" },
  { id: "bold", name: "Bold", bg: "#dc2626", text: "#ffffff", accent: "#fbbf24", desc: "High-impact red" },
  { id: "nature", name: "Nature", bg: "#064e3b", text: "#d1fae5", accent: "#34d399", desc: "Calm forest green" },
  { id: "sunset", name: "Sunset", bg: "#7c2d12", text: "#fff7ed", accent: "#fb923c", desc: "Warm sunset tones" },
  { id: "ocean", name: "Ocean", bg: "#0c4a6e", text: "#e0f2fe", accent: "#38bdf8", desc: "Deep ocean blue" },
  { id: "portfolio", name: "Portfolio", bg: "#18181b", text: "#fafafa", accent: "#a78bfa", desc: "Dark creative portfolio" },
  { id: "corporate", name: "Corporate", bg: "#1e3a5f", text: "#f0f9ff", accent: "#C9A84C", desc: "Premium gold corporate" },
  { id: "light", name: "Light Mode", bg: "#f8fafc", text: "#0f172a", accent: "#1e40af", desc: "Clean light theme" },
];

const FONT_OPTIONS = [
  { label: "Sans Serif", value: "'Helvetica Neue', Arial, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "'Courier New', Courier, monospace" },
  { label: "Rounded", value: "'Trebuchet MS', sans-serif" },
  { label: "Modern", value: "'Segoe UI', Tahoma, sans-serif" },
];

const createSlide = (overrides: Partial<Slide> = {}): Slide => ({
  id: Date.now().toString(),
  title: "New Slide",
  content: "Add your content here",
  backgroundColor: "#0f172a",
  textColor: "#f8fafc",
  accentColor: "#3b82f6",
  layout: "content",
  textAlign: "left",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  titleSize: 48,
  contentSize: 24,
  ...overrides,
});

const Presentations = () => {
  const [slides, setSlides] = useState<Slide[]>([
    createSlide({
      id: "1",
      title: "Welcome to Your Presentation",
      content: "Click to add content — choose a template below to get started",
      layout: "title",
      textAlign: "center",
    })
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentationTitle, setPresentationTitle] = useState("Untitled Presentation");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const addSlide = () => {
    const current = slides[currentSlide];
    const newSlide = createSlide({
      backgroundColor: current.backgroundColor,
      textColor: current.textColor,
      accentColor: current.accentColor,
      fontFamily: current.fontFamily,
    });
    const newSlides = [...slides];
    newSlides.splice(currentSlide + 1, 0, newSlide);
    setSlides(newSlides);
    setCurrentSlide(currentSlide + 1);
  };

  const deleteSlide = (index: number) => {
    if (slides.length === 1) {
      toast.error("Cannot delete the last slide");
      return;
    }
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    setCurrentSlide(Math.min(currentSlide, newSlides.length - 1));
  };

  const updateSlide = useCallback(<K extends keyof Slide>(field: K, value: Slide[K]) => {
    setSlides(prev => prev.map((s, i) => i === currentSlide ? { ...s, [field]: value } : s));
  }, [currentSlide]);

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setSlides(prev => prev.map((s, i) => i === currentSlide ? {
      ...s,
      backgroundColor: template.bg,
      textColor: template.text,
      accentColor: template.accent,
    } : s));
    setShowTemplates(false);
    toast.success(`Applied "${template.name}" template`);
  };

  const applyTemplateToAll = (template: typeof TEMPLATES[0]) => {
    setSlides(prev => prev.map(s => ({
      ...s,
      backgroundColor: template.bg,
      textColor: template.text,
      accentColor: template.accent,
    })));
    setShowTemplates(false);
    toast.success(`Applied "${template.name}" to all slides`);
  };

  const nextSlide = () => setCurrentSlide(i => Math.min(i + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide(i => Math.max(i - 1, 0));

  const startPresentation = () => {
    setIsPresenting(true);
    document.documentElement.requestFullscreen?.();
  };

  const exitPresentation = () => {
    setIsPresenting(false);
    document.exitFullscreen?.();
  };

  const exportAsPDF = async () => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const pdf = new (await import("jspdf")).jsPDF({ orientation: "landscape", unit: "px", format: [1920, 1080] });
      
      for (let i = 0; i < slides.length; i++) {
        setCurrentSlide(i);
        await new Promise(r => setTimeout(r, 300));
        if (slideRef.current) {
          const canvas = await html2canvas(slideRef.current, { scale: 1, useCORS: true, backgroundColor: slides[i].backgroundColor });
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, 0, 1920, 1080);
        }
      }
      pdf.save(`${presentationTitle}.pdf`);
      toast.success("Exported as PDF");
    } catch (e) {
      toast.error("Export failed. Please try again.");
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsJSON = () => {
    setShowExportMenu(false);
    const data = JSON.stringify({ title: presentationTitle, slides }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${presentationTitle}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Presentation data exported");
  };

  const saveToStorage = () => {
    try {
      localStorage.setItem("jbj-presentation", JSON.stringify({ title: presentationTitle, slides }));
      toast.success("Saved to browser storage");
    } catch {
      toast.error("Save failed");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const slide = slides[currentSlide];

  const SlideCanvas = ({ s, scale = 1 }: { s: Slide; scale?: number }) => (
    <div
      style={{
        width: `${1920 * scale}px`,
        height: `${1080 * scale}px`,
        backgroundColor: s.backgroundColor,
        color: s.textColor,
        fontFamily: s.fontFamily,
        display: "flex",
        flexDirection: "column",
        alignItems: s.layout === "title" ? "center" : "flex-start",
        justifyContent: s.layout === "title" ? "center" : "flex-start",
        padding: `${80 * scale}px`,
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${6 * scale}px`, background: s.accentColor }} />
      
      {s.layout === "title" ? (
        <div style={{ textAlign: "center", maxWidth: `${1400 * scale}px` }}>
          <div style={{ width: `${60 * scale}px`, height: `${4 * scale}px`, background: s.accentColor, margin: `0 auto ${24 * scale}px`, borderRadius: `${2 * scale}px` }} />
          <h1 style={{ fontSize: `${s.titleSize * scale}px`, fontWeight: 800, lineHeight: 1.2, margin: `0 0 ${24 * scale}px`, color: s.textColor }}>{s.title}</h1>
          {s.content !== "Add your content here" && (
            <p style={{ fontSize: `${s.contentSize * scale}px`, opacity: 0.75, lineHeight: 1.6, maxWidth: `${1000 * scale}px`, margin: "0 auto" }}>{s.content}</p>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, width: "100%", paddingTop: `${20 * scale}px` }}>
          <div style={{ display: "flex", alignItems: "center", gap: `${16 * scale}px`, marginBottom: `${32 * scale}px` }}>
            <div style={{ width: `${6 * scale}px`, height: `${48 * scale}px`, background: s.accentColor, borderRadius: `${3 * scale}px`, flexShrink: 0 }} />
            <h2 style={{ fontSize: `${(s.titleSize * 0.75) * scale}px`, fontWeight: 700, lineHeight: 1.2, margin: 0, textAlign: s.textAlign }}>{s.title}</h2>
          </div>
          <p style={{ fontSize: `${s.contentSize * scale}px`, lineHeight: 1.7, opacity: 0.85, textAlign: s.textAlign, maxWidth: `${1600 * scale}px`, whiteSpace: "pre-wrap" }}>{s.content}</p>
        </div>
      )}
      
      {/* Slide number */}
      <div style={{ position: "absolute", bottom: `${30 * scale}px`, right: `${60 * scale}px`, fontSize: `${14 * scale}px`, opacity: 0.35 }}>
        {slides.indexOf(s) + 1} / {slides.length}
      </div>
    </div>
  );

  if (isPresenting) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        onClick={(e) => {
          if (e.clientX > window.innerWidth / 2) nextSlide();
          else prevSlide();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") exitPresentation();
          if (e.key === "ArrowRight" || e.key === "Space") nextSlide();
          if (e.key === "ArrowLeft") prevSlide();
        }}
        tabIndex={0}
      >
        <div style={{ transform: `scale(${window.innerWidth / 1920})`, transformOrigin: "center center" }}>
          <SlideCanvas s={slide} scale={1} />
        </div>
        <button onClick={exitPresentation} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 backdrop-blur px-4 py-2 rounded-full">
          <span className="text-white/60 text-sm">{currentSlide + 1} / {slides.length}</span>
          <span className="text-white/40 text-xs">Click left/right to navigate · ESC to exit</span>
        </div>
      </div>
    );
  }

  // Compute scale for preview
  const previewScale = 0.42;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between bg-zinc-900/80 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-3">
          <Presentation className="w-5 h-5 text-[#C9A84C]" />
          <input
            value={presentationTitle}
            onChange={(e) => setPresentationTitle(e.target.value)}
            className="bg-transparent border-none text-base font-semibold text-white w-56 focus:outline-none focus:ring-0 placeholder:text-zinc-500"
          />
        </div>
        
        {/* Action bar */}
        <div className="flex items-center gap-1.5">
          <button onClick={saveToStorage} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black rounded-lg transition-all border border-[#C9A84C]/60"
              style={{ background: "linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)" }}
            >
              {isExporting ? <><span className="animate-pulse">Exporting...</span></> : <><FileDown className="w-3.5 h-3.5" /> Export</>}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[160px]">
                <button onClick={exportAsPDF} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white hover:bg-zinc-700 transition-colors">
                  <FileText className="w-4 h-4 text-red-400" /> Export PDF
                </button>
                <button onClick={exportAsJSON} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white hover:bg-zinc-700 transition-colors">
                  <FileDown className="w-4 h-4 text-blue-400" /> Export Data
                </button>
              </div>
            )}
          </div>

          <button onClick={startPresentation} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#C9A84C] hover:bg-[#b8963d] text-black rounded-lg transition-all">
            <Play className="w-3.5 h-3.5" /> Present
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Slide Thumbnails ──────────────────────────────── */}
        <div className="w-44 border-r border-zinc-800 bg-zinc-900/50 overflow-y-auto flex-shrink-0 p-2 space-y-2">
          {slides.map((s, index) => (
            <div
              key={s.id}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all group ${
                index === currentSlide ? "border-[#C9A84C]" : "border-zinc-700 hover:border-zinc-500"
              }`}
              onClick={() => setCurrentSlide(index)}
            >
              <div
                className="aspect-video flex flex-col p-1.5 relative overflow-hidden"
                style={{ backgroundColor: s.backgroundColor }}
              >
                <div style={{ height: 2, background: s.accentColor, marginBottom: 4 }} />
                <p className="text-[7px] font-semibold truncate" style={{ color: s.textColor }}>{s.title}</p>
                <p className="text-[5px] opacity-60 truncate mt-0.5" style={{ color: s.textColor }}>{s.content}</p>
              </div>
              <div className="absolute bottom-0.5 left-1 text-[9px] text-zinc-400">{index + 1}</div>
              <button
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500/80 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
          <button
            onClick={addSlide}
            className="w-full py-2 text-xs text-zinc-400 hover:text-white border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg flex items-center justify-center gap-1 transition-all"
          >
            <Plus className="w-3 h-3" /> Add Slide
          </button>
        </div>

        {/* ── Main Canvas Area ──────────────────────────────── */}
        <div className="flex-1 overflow-auto flex flex-col items-center justify-start p-6 bg-zinc-950">
          {/* Template picker toggle */}
          <div className="w-full flex items-center justify-between mb-4 max-w-4xl">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Slide {currentSlide + 1} of {slides.length}</span>
            </div>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#C9A84C] hover:text-[#b8963d] transition-colors"
            >
              <Palette className="w-3.5 h-3.5" />
              {showTemplates ? "Hide Templates" : "Choose Template"}
            </button>
          </div>

          {/* Template gallery */}
          {showTemplates && (
            <div className="w-full max-w-4xl mb-4 bg-zinc-900 border border-zinc-700 rounded-xl p-4">
              <p className="text-xs text-zinc-400 mb-3 font-medium">Templates — click to apply to current slide</p>
              <div className="grid grid-cols-5 gap-2">
                {TEMPLATES.map(t => (
                  <div key={t.id} className="group cursor-pointer" onClick={() => applyTemplate(t)}>
                    <div className="aspect-video rounded-lg overflow-hidden border-2 border-zinc-700 group-hover:border-[#C9A84C] transition-all mb-1.5">
                      <div className="w-full h-full flex flex-col p-1.5 relative" style={{ backgroundColor: t.bg }}>
                        <div style={{ height: 2, background: t.accent, marginBottom: 3 }} />
                        <div className="text-[6px] font-bold" style={{ color: t.text }}>{t.name}</div>
                        <div className="text-[4px] opacity-60" style={{ color: t.text }}>Sample slide</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 text-center truncate">{t.name}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-700">
                <p className="text-xs text-zinc-500 mb-2">Apply to all slides:</p>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => applyTemplateToAll(t)} className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors">
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Live slide preview */}
          <div
            className="relative rounded-xl overflow-hidden shadow-2xl border border-zinc-700/50 mb-4"
            style={{ width: `${1920 * previewScale}px`, height: `${1080 * previewScale}px` }}
          >
            <div
              ref={slideRef}
              style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: "1920px", height: "1080px" }}
            >
              <SlideCanvas s={slide} scale={1} />
            </div>
            {/* Editable overlays */}
            <div
              className="absolute inset-0 flex flex-col"
              style={{
                padding: `${80 * previewScale}px`,
                paddingTop: `${(80 + 6) * previewScale}px`,
                fontFamily: slide.fontFamily,
                color: slide.textColor,
                alignItems: slide.layout === "title" ? "center" : "flex-start",
                justifyContent: slide.layout === "title" ? "center" : "flex-start",
              }}
            >
              {slide.layout === "title" ? (
                <div className="text-center w-full">
                  <input
                    value={slide.title}
                    onChange={(e) => updateSlide("title", e.target.value)}
                    className="bg-transparent border-none outline-none font-extrabold text-center w-full placeholder:opacity-40 cursor-text"
                    style={{ fontSize: `${slide.titleSize * previewScale}px`, color: slide.textColor, textAlign: "center" }}
                    placeholder="Slide Title"
                  />
                  <textarea
                    value={slide.content}
                    onChange={(e) => updateSlide("content", e.target.value)}
                    className="bg-transparent border-none outline-none text-center w-full resize-none mt-2 placeholder:opacity-40 cursor-text"
                    style={{ fontSize: `${slide.contentSize * previewScale}px`, color: slide.textColor, opacity: 0.8, textAlign: "center" }}
                    placeholder="Subtitle or content..."
                    rows={3}
                  />
                </div>
              ) : (
                <div className="w-full flex-1" style={{ paddingTop: `${20 * previewScale}px` }}>
                  <input
                    value={slide.title}
                    onChange={(e) => updateSlide("title", e.target.value)}
                    className="bg-transparent border-none outline-none font-bold w-full placeholder:opacity-40 cursor-text block"
                    style={{ fontSize: `${slide.titleSize * 0.75 * previewScale}px`, color: slide.textColor, textAlign: slide.textAlign, paddingLeft: `${22 * previewScale}px` }}
                    placeholder="Slide Title"
                  />
                  <textarea
                    value={slide.content}
                    onChange={(e) => updateSlide("content", e.target.value)}
                    className="bg-transparent border-none outline-none w-full resize-none mt-4 placeholder:opacity-40 cursor-text"
                    style={{ fontSize: `${slide.contentSize * previewScale}px`, color: slide.textColor, opacity: 0.85, textAlign: slide.textAlign, minHeight: "200px", lineHeight: 1.7 }}
                    placeholder="Add your content here..."
                    rows={6}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button onClick={prevSlide} disabled={currentSlide === 0} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-zinc-400 text-sm min-w-[80px] text-center">{currentSlide + 1} / {slides.length}</span>
            <button onClick={nextSlide} disabled={currentSlide === slides.length - 1} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Properties Panel ──────────────────────────────── */}
        <div className="w-60 border-l border-zinc-800 bg-zinc-900/50 overflow-y-auto flex-shrink-0 p-3 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Slide Properties</h3>
          
          {/* Layout */}
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">Layout</label>
            <div className="grid grid-cols-2 gap-1">
              {(["title", "content", "two-column", "blank"] as const).map(layout => (
                <button
                  key={layout}
                  className={`py-1.5 text-xs rounded-lg capitalize transition-all ${
                    slide.layout === layout
                      ? "bg-[#C9A84C] text-black font-semibold"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                  onClick={() => updateSlide("layout", layout)}
                >
                  {layout}
                </button>
              ))}
            </div>
          </div>

          {/* Font */}
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">Font</label>
            <select
              value={slide.fontFamily}
              onChange={(e) => updateSlide("fontFamily", e.target.value)}
              className="w-full bg-zinc-800 text-white text-xs rounded-lg px-2 py-1.5 border border-zinc-700 focus:outline-none focus:border-[#C9A84C]"
            >
              {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          {/* Text Alignment */}
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">Alignment</label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map(align => (
                <button
                  key={align}
                  onClick={() => updateSlide("textAlign", align)}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${
                    slide.textAlign === align ? "bg-[#C9A84C] text-black" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {align === "left" && <AlignLeft className="w-3 h-3" />}
                  {align === "center" && <AlignCenter className="w-3 h-3" />}
                  {align === "right" && <AlignRight className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Font sizes */}
          <div>
            <label className="text-[10px] text-zinc-500 mb-1 block uppercase tracking-wide">Title Size: {slide.titleSize}px</label>
            <input type="range" min={24} max={96} value={slide.titleSize} onChange={(e) => updateSlide("titleSize", +e.target.value)}
              className="w-full accent-[#C9A84C]" />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 mb-1 block uppercase tracking-wide">Content Size: {slide.contentSize}px</label>
            <input type="range" min={14} max={48} value={slide.contentSize} onChange={(e) => updateSlide("contentSize", +e.target.value)}
              className="w-full accent-[#C9A84C]" />
          </div>

          {/* Colors */}
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">Background</label>
            <div className="flex items-center gap-2">
              <input type="color" value={slide.backgroundColor} onChange={(e) => updateSlide("backgroundColor", e.target.value)}
                className="w-8 h-8 rounded-lg border border-zinc-600 cursor-pointer bg-transparent" />
              <span className="text-xs text-zinc-400 font-mono">{slide.backgroundColor}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">Text Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={slide.textColor} onChange={(e) => updateSlide("textColor", e.target.value)}
                className="w-8 h-8 rounded-lg border border-zinc-600 cursor-pointer bg-transparent" />
              <span className="text-xs text-zinc-400 font-mono">{slide.textColor}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">Accent Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={slide.accentColor} onChange={(e) => updateSlide("accentColor", e.target.value)}
                className="w-8 h-8 rounded-lg border border-zinc-600 cursor-pointer bg-transparent" />
              <span className="text-xs text-zinc-400 font-mono">{slide.accentColor}</span>
            </div>
          </div>

          {/* Duplicate slide */}
          <div className="pt-2 border-t border-zinc-800">
            <button
              onClick={() => {
                const newSlides = [...slides];
                newSlides.splice(currentSlide + 1, 0, { ...slide, id: Date.now().toString() });
                setSlides(newSlides);
                setCurrentSlide(currentSlide + 1);
                toast.success("Slide duplicated");
              }}
              className="w-full py-2 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
            >
              Duplicate Slide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Presentations;
