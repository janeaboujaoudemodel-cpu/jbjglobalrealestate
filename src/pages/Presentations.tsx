import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Play, Download,
  FileText, Presentation, Palette, AlignLeft, AlignCenter, AlignRight,
  Save, Share2, Printer, X, Sparkles, LayoutGrid, FileDown, Copy,
  ArrowLeft, Type, Layers
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { Link } from "react-router-dom";

/* ── Types ─────────────────────────────────────────────── */
interface Slide {
  id: string;
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  layout: "title" | "content" | "two-column" | "blank";
  textAlign: "left" | "center" | "right";
  fontFamily: string;
  titleSize: number;
  contentSize: number;
}

/* ── Templates (expanded gallery) ─────────────────────── */
const TEMPLATES = [
  { id: "corporate", name: "Corporate Gold", bg: "#1e293b", text: "#f1f5f9", accent: "#C9A84C", category: "Business", preview: "Premium corporate style" },
  { id: "business", name: "Business Blue", bg: "#0f172a", text: "#f8fafc", accent: "#3b82f6", category: "Business", preview: "Professional dark" },
  { id: "pitch", name: "Pitch Deck", bg: "#1a0a2e", text: "#f8fafc", accent: "#8b5cf6", category: "Startup", preview: "Investor-ready" },
  { id: "minimal", name: "Minimal White", bg: "#ffffff", text: "#1e293b", accent: "#64748b", category: "Minimal", preview: "Clean and modern" },
  { id: "light", name: "Light Slate", bg: "#f8fafc", text: "#0f172a", accent: "#1e40af", category: "Minimal", preview: "Bright professional" },
  { id: "bold", name: "Bold Red", bg: "#7f1d1d", text: "#fef2f2", accent: "#fbbf24", category: "Creative", preview: "High-impact" },
  { id: "nature", name: "Forest", bg: "#064e3b", text: "#d1fae5", accent: "#34d399", category: "Creative", preview: "Calm natural" },
  { id: "sunset", name: "Sunset Warm", bg: "#431407", text: "#fff7ed", accent: "#fb923c", category: "Creative", preview: "Warm inviting" },
  { id: "ocean", name: "Deep Ocean", bg: "#0c4a6e", text: "#e0f2fe", accent: "#38bdf8", category: "Creative", preview: "Cool professional" },
  { id: "portfolio", name: "Dark Portfolio", bg: "#18181b", text: "#fafafa", accent: "#a78bfa", category: "Creative", preview: "Showcase work" },
  { id: "cream", name: "Warm Cream", bg: "#fdf6e3", text: "#3c3836", accent: "#b57614", category: "Minimal", preview: "Solarized warm" },
  { id: "midnight", name: "Midnight", bg: "#020617", text: "#e2e8f0", accent: "#06b6d4", category: "Business", preview: "Dark elegant" },
];

const FONT_OPTIONS = [
  { label: "Sans Serif", value: "'Helvetica Neue', Arial, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "'Courier New', Courier, monospace" },
  { label: "Rounded", value: "'Trebuchet MS', sans-serif" },
  { label: "Modern", value: "'Segoe UI', Tahoma, sans-serif" },
];

const createSlide = (overrides: Partial<Slide> = {}): Slide => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
  title: "New Slide",
  content: "Add your content here",
  backgroundColor: "#1e293b",
  textColor: "#f1f5f9",
  accentColor: "#C9A84C",
  layout: "content",
  textAlign: "left",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  titleSize: 48,
  contentSize: 24,
  ...overrides,
});

/* ── Helpers: determine readable text color on any bg ──── */
function hexLuminance(hex: string): number {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
function isLightBg(hex: string): boolean {
  try { return hexLuminance(hex) > 0.45; } catch { return false; }
}

/* ── SlideCanvas: renders a slide at full 1920x1080 ────── */
const SlideCanvas = ({ s, slideIndex, totalSlides }: { s: Slide; slideIndex: number; totalSlides: number }) => {
  const isTitle = s.layout === "title";
  return (
    <div
      style={{
        width: "1920px", height: "1080px",
        backgroundColor: s.backgroundColor, color: s.textColor, fontFamily: s.fontFamily,
        display: "flex", flexDirection: "column",
        alignItems: isTitle ? "center" : "flex-start",
        justifyContent: isTitle ? "center" : "flex-start",
        padding: "80px", position: "relative", boxSizing: "border-box", overflow: "hidden",
      }}
    >
      {/* Accent top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: s.accentColor }} />

      {isTitle ? (
        <div style={{ textAlign: "center", maxWidth: "1400px" }}>
          <div style={{ width: "60px", height: "4px", background: s.accentColor, margin: "0 auto 24px", borderRadius: "2px" }} />
          <h1 style={{ fontSize: `${s.titleSize}px`, fontWeight: 800, lineHeight: 1.2, margin: "0 0 24px", color: s.textColor }}>{s.title}</h1>
          <p style={{ fontSize: `${s.contentSize}px`, opacity: 0.75, lineHeight: 1.6, maxWidth: "1000px", margin: "0 auto", color: s.textColor }}>{s.content}</p>
        </div>
      ) : (
        <div style={{ flex: 1, width: "100%", paddingTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
            <div style={{ width: "6px", height: "48px", background: s.accentColor, borderRadius: "3px", flexShrink: 0 }} />
            <h2 style={{ fontSize: `${s.titleSize * 0.75}px`, fontWeight: 700, lineHeight: 1.2, margin: 0, textAlign: s.textAlign, color: s.textColor }}>{s.title}</h2>
          </div>
          <p style={{ fontSize: `${s.contentSize}px`, lineHeight: 1.7, opacity: 0.85, textAlign: s.textAlign, maxWidth: "1600px", whiteSpace: "pre-wrap", color: s.textColor }}>{s.content}</p>
        </div>
      )}

      <div style={{ position: "absolute", bottom: "30px", right: "60px", fontSize: "14px", opacity: 0.35, color: s.textColor }}>
        {slideIndex + 1} / {totalSlides}
      </div>
    </div>
  );
};

/* ── Main Component ────────────────────────────────────── */
const Presentations = () => {
  const [slides, setSlides] = useState<Slide[]>([
    createSlide({ id: "1", title: "Welcome to Your Presentation", content: "Choose a template below to get started", layout: "title", textAlign: "center" }),
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentationTitle, setPresentationTitle] = useState("Untitled Presentation");
  const [showTemplates, setShowTemplates] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [templateFilter, setTemplateFilter] = useState<string>("All");
  const slideRef = useRef<HTMLDivElement>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("jbj-presentation");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.slides?.length) { setSlides(data.slides); setPresentationTitle(data.title || "Untitled Presentation"); }
      }
    } catch { /* ignore */ }
  }, []);

  const slide = slides[currentSlide];

  const addSlide = () => {
    const cur = slides[currentSlide];
    const ns = createSlide({ backgroundColor: cur.backgroundColor, textColor: cur.textColor, accentColor: cur.accentColor, fontFamily: cur.fontFamily });
    const arr = [...slides]; arr.splice(currentSlide + 1, 0, ns); setSlides(arr); setCurrentSlide(currentSlide + 1);
  };

  const deleteSlide = (index: number) => {
    if (slides.length === 1) { toast.error("Cannot delete the last slide"); return; }
    setSlides(prev => prev.filter((_, i) => i !== index));
    setCurrentSlide(i => Math.min(i, slides.length - 2));
  };

  const updateSlide = useCallback(<K extends keyof Slide>(field: K, value: Slide[K]) => {
    setSlides(prev => prev.map((s, i) => i === currentSlide ? { ...s, [field]: value } : s));
  }, [currentSlide]);

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setSlides(prev => prev.map((s, i) => i === currentSlide ? { ...s, backgroundColor: t.bg, textColor: t.text, accentColor: t.accent } : s));
    toast.success(`Applied "${t.name}"`);
  };

  const applyTemplateToAll = (t: typeof TEMPLATES[0]) => {
    setSlides(prev => prev.map(s => ({ ...s, backgroundColor: t.bg, textColor: t.text, accentColor: t.accent })));
    toast.success(`Applied "${t.name}" to all slides`);
  };

  const nextSlide = () => setCurrentSlide(i => Math.min(i + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide(i => Math.max(i - 1, 0));

  const startPresentation = () => { setIsPresenting(true); document.documentElement.requestFullscreen?.(); };
  const exitPresentation = () => { setIsPresenting(false); document.exitFullscreen?.(); };

  /* ── PDF Export: render offscreen at full res ─────────── */
  const exportAsPDF = async () => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const jsPDF = (await import("jspdf")).jsPDF;
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1920, 1080] });

      // Create an offscreen container
      const offscreen = document.createElement("div");
      offscreen.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1920px;height:1080px;overflow:hidden;z-index:-1;";
      document.body.appendChild(offscreen);

      for (let i = 0; i < slides.length; i++) {
        // Render slide offscreen
        const { createRoot } = await import("react-dom/client");
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "width:1920px;height:1080px;";
        offscreen.innerHTML = "";
        offscreen.appendChild(wrapper);

        // Render using innerHTML for reliability
        const s = slides[i];
        const isTitle = s.layout === "title";
        wrapper.style.backgroundColor = s.backgroundColor;
        wrapper.style.color = s.textColor;
        wrapper.style.fontFamily = s.fontFamily;
        wrapper.style.padding = "80px";
        wrapper.style.boxSizing = "border-box";
        wrapper.style.position = "relative";
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        wrapper.style.alignItems = isTitle ? "center" : "flex-start";
        wrapper.style.justifyContent = isTitle ? "center" : "flex-start";

        // Accent bar
        const bar = document.createElement("div");
        bar.style.cssText = `position:absolute;top:0;left:0;right:0;height:6px;background:${s.accentColor};`;
        wrapper.appendChild(bar);

        if (isTitle) {
          const inner = document.createElement("div");
          inner.style.cssText = "text-align:center;max-width:1400px;";
          inner.innerHTML = `
            <div style="width:60px;height:4px;background:${s.accentColor};margin:0 auto 24px;border-radius:2px;"></div>
            <h1 style="font-size:${s.titleSize}px;font-weight:800;line-height:1.2;margin:0 0 24px;color:${s.textColor};">${s.title}</h1>
            <p style="font-size:${s.contentSize}px;opacity:0.75;line-height:1.6;max-width:1000px;margin:0 auto;color:${s.textColor};">${s.content}</p>
          `;
          wrapper.appendChild(inner);
        } else {
          const inner = document.createElement("div");
          inner.style.cssText = "flex:1;width:100%;padding-top:20px;";
          inner.innerHTML = `
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;">
              <div style="width:6px;height:48px;background:${s.accentColor};border-radius:3px;flex-shrink:0;"></div>
              <h2 style="font-size:${s.titleSize * 0.75}px;font-weight:700;line-height:1.2;margin:0;text-align:${s.textAlign};color:${s.textColor};">${s.title}</h2>
            </div>
            <p style="font-size:${s.contentSize}px;line-height:1.7;opacity:0.85;text-align:${s.textAlign};max-width:1600px;white-space:pre-wrap;color:${s.textColor};">${s.content}</p>
          `;
          wrapper.appendChild(inner);
        }

        // Slide number
        const num = document.createElement("div");
        num.style.cssText = `position:absolute;bottom:30px;right:60px;font-size:14px;opacity:0.35;color:${s.textColor};`;
        num.textContent = `${i + 1} / ${slides.length}`;
        wrapper.appendChild(num);

        await new Promise(r => setTimeout(r, 100));
        const canvas = await html2canvas(wrapper, { scale: 1, useCORS: true, backgroundColor: s.backgroundColor, width: 1920, height: 1080 });
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, 1920, 1080);
      }

      document.body.removeChild(offscreen);
      pdf.save(`${presentationTitle}.pdf`);
      toast.success("PDF exported successfully");
    } catch (e) {
      console.error("Export error:", e);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const saveToStorage = () => {
    try {
      localStorage.setItem("jbj-presentation", JSON.stringify({ title: presentationTitle, slides }));
      toast.success("Saved to browser storage");
    } catch { toast.error("Save failed"); }
  };

  // Categories for filter
  const categories = ["All", ...Array.from(new Set(TEMPLATES.map(t => t.category)))];
  const filteredTemplates = templateFilter === "All" ? TEMPLATES : TEMPLATES.filter(t => t.category === templateFilter);

  /* ── Fullscreen presentation mode ────────────────────── */
  if (isPresenting) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        onClick={(e) => { if (e.clientX > window.innerWidth / 2) nextSlide(); else prevSlide(); }}
        onKeyDown={(e) => {
          if (e.key === "Escape") exitPresentation();
          if (e.key === "ArrowRight" || e.key === " ") nextSlide();
          if (e.key === "ArrowLeft") prevSlide();
        }}
        tabIndex={0}
        autoFocus
      >
        <div style={{ transform: `scale(${Math.min(window.innerWidth / 1920, window.innerHeight / 1080)})`, transformOrigin: "center center" }}>
          <SlideCanvas s={slide} slideIndex={currentSlide} totalSlides={slides.length} />
        </div>
        <button onClick={(e) => { e.stopPropagation(); exitPresentation(); }} className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors z-10">
          <X className="w-5 h-5 text-white" />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-sm px-5 py-2.5 rounded-full">
          <span className="text-white/70 text-sm font-medium">{currentSlide + 1} / {slides.length}</span>
          <span className="text-white/40 text-xs">Click or arrow keys to navigate</span>
        </div>
      </div>
    );
  }

  /* ── Preview scale ───────────────────────────────────── */
  const previewScale = 0.48;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between bg-zinc-900/90 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/ai-hub" className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
          </Link>
          <Presentation className="w-5 h-5 text-[#C9A84C]" />
          <input
            value={presentationTitle}
            onChange={(e) => setPresentationTitle(e.target.value)}
            className="bg-transparent border-none text-base font-semibold text-white w-56 focus:outline-none focus:ring-0 placeholder:text-zinc-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={saveToStorage} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border border-[#C9A84C]/60 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)", color: "#1e293b" }}
            >
              {isExporting ? <span className="animate-pulse">Exporting...</span> : <><FileDown className="w-3.5 h-3.5" /> Export</>}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[160px]">
                <button onClick={exportAsPDF} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors">
                  <FileText className="w-4 h-4 text-red-400" /> Export PDF
                </button>
              </div>
            )}
          </div>

          <button onClick={startPresentation} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all border border-[#C9A84C]/60" style={{ background: "linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)", color: "#1e293b" }}>
            <Play className="w-3.5 h-3.5" /> Present
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Slide Thumbnails ─────────────────────────── */}
        <div className="w-44 border-r border-zinc-800 bg-zinc-900/50 overflow-y-auto flex-shrink-0 p-2 space-y-2">
          {slides.map((s, index) => (
            <div
              key={s.id}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all group ${
                index === currentSlide ? "border-[#C9A84C] shadow-lg shadow-[#C9A84C]/20" : "border-zinc-700 hover:border-zinc-500"
              }`}
              onClick={() => setCurrentSlide(index)}
            >
              <div className="aspect-video relative overflow-hidden" style={{ backgroundColor: s.backgroundColor }}>
                <div style={{ transform: "scale(0.085)", transformOrigin: "top left", width: "1920px", height: "1080px", pointerEvents: "none" }}>
                  <SlideCanvas s={s} slideIndex={index} totalSlides={slides.length} />
                </div>
              </div>
              <div className="absolute bottom-0.5 left-1 text-[9px] font-medium" style={{ color: isLightBg(s.backgroundColor) ? "#374151" : "#a1a1aa" }}>{index + 1}</div>
              <button
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600/90 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
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

        {/* ── Main Canvas Area ─────────────────────────── */}
        <div className="flex-1 overflow-auto flex flex-col items-center p-6 bg-zinc-950">
          {/* Controls row */}
          <div className="w-full flex items-center justify-between mb-4" style={{ maxWidth: `${1920 * previewScale + 40}px` }}>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Layers className="w-3.5 h-3.5" />
              <span>Slide {currentSlide + 1} of {slides.length}</span>
            </div>
            <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-1.5 text-xs font-medium text-[#C9A84C] hover:text-[#b8963d] transition-colors">
              <Palette className="w-3.5 h-3.5" />
              {showTemplates ? "Hide Templates" : "Choose Template"}
            </button>
          </div>

          {/* ── Canva-style Template Gallery ────────────── */}
          {showTemplates && (
            <div className="w-full mb-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5" style={{ maxWidth: `${1920 * previewScale + 40}px` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-200">Templates</h3>
                <div className="flex items-center gap-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setTemplateFilter(cat)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                        templateFilter === cat
                          ? "bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/40"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {filteredTemplates.map(t => {
                  const lightTemplate = isLightBg(t.bg);
                  return (
                    <div key={t.id} className="group cursor-pointer" onClick={() => applyTemplate(t)}>
                      <div className="aspect-video rounded-xl overflow-hidden border-2 border-zinc-700/60 group-hover:border-[#C9A84C] transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-[#C9A84C]/10 relative">
                        <div className="w-full h-full flex flex-col p-2.5 relative" style={{ backgroundColor: t.bg }}>
                          <div style={{ height: "2px", background: t.accent, marginBottom: "6px", borderRadius: "1px" }} />
                          <div className="text-[8px] font-bold leading-tight" style={{ color: t.text }}>{t.name}</div>
                          <div className="text-[6px] mt-0.5 opacity-60" style={{ color: t.text }}>{t.preview}</div>
                        </div>
                        {/* Apply-all overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-end justify-center pb-1.5 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); applyTemplateToAll(t); }}
                            className="text-[8px] px-2 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors backdrop-blur-sm"
                          >
                            Apply to all
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 text-center mt-1.5 truncate group-hover:text-zinc-200 transition-colors">{t.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Live Slide Preview ─────────────────────── */}
          <div
            className="relative rounded-xl overflow-hidden shadow-2xl border border-zinc-700/50 mb-4"
            style={{ width: `${1920 * previewScale}px`, height: `${1080 * previewScale}px` }}
          >
            <div
              ref={slideRef}
              style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: "1920px", height: "1080px" }}
            >
              <SlideCanvas s={slide} slideIndex={currentSlide} totalSlides={slides.length} />
            </div>
            {/* Editable overlay */}
            <div
              className="absolute inset-0 flex flex-col"
              style={{
                padding: `${80 * previewScale}px`,
                paddingTop: `${86 * previewScale}px`,
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
                    style={{ fontSize: `${slide.titleSize * previewScale}px`, color: slide.textColor }}
                    placeholder="Slide Title"
                  />
                  <textarea
                    value={slide.content}
                    onChange={(e) => updateSlide("content", e.target.value)}
                    className="bg-transparent border-none outline-none text-center w-full resize-none mt-2 placeholder:opacity-40 cursor-text"
                    style={{ fontSize: `${slide.contentSize * previewScale}px`, color: slide.textColor, opacity: 0.8 }}
                    placeholder="Subtitle..."
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
                    placeholder="Add content..."
                    rows={6}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button onClick={prevSlide} disabled={currentSlide === 0} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg transition-all text-zinc-300">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-zinc-400 text-sm min-w-[80px] text-center">{currentSlide + 1} / {slides.length}</span>
            <button onClick={nextSlide} disabled={currentSlide === slides.length - 1} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg transition-all text-zinc-300">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Properties Panel ─────────────────────────── */}
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
                      ? "bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/50 font-semibold"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-transparent"
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
              className="w-full bg-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1.5 border border-zinc-700 focus:outline-none focus:border-[#C9A84C]"
            >
              {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          {/* Alignment */}
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">Alignment</label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map(align => (
                <button
                  key={align}
                  onClick={() => updateSlide("textAlign", align)}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${
                    slide.textAlign === align
                      ? "bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/50"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-transparent"
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
            <input type="range" min={24} max={96} value={slide.titleSize} onChange={(e) => updateSlide("titleSize", +e.target.value)} className="w-full accent-[#C9A84C]" />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 mb-1 block uppercase tracking-wide">Content Size: {slide.contentSize}px</label>
            <input type="range" min={14} max={48} value={slide.contentSize} onChange={(e) => updateSlide("contentSize", +e.target.value)} className="w-full accent-[#C9A84C]" />
          </div>

          {/* Colors */}
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">Background</label>
            <div className="flex items-center gap-2">
              <input type="color" value={slide.backgroundColor} onChange={(e) => updateSlide("backgroundColor", e.target.value)} className="w-8 h-8 rounded-lg border border-zinc-600 cursor-pointer bg-transparent" />
              <span className="text-xs text-zinc-400 font-mono">{slide.backgroundColor}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">Text Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={slide.textColor} onChange={(e) => updateSlide("textColor", e.target.value)} className="w-8 h-8 rounded-lg border border-zinc-600 cursor-pointer bg-transparent" />
              <span className="text-xs text-zinc-400 font-mono">{slide.textColor}</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">Accent Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={slide.accentColor} onChange={(e) => updateSlide("accentColor", e.target.value)} className="w-8 h-8 rounded-lg border border-zinc-600 cursor-pointer bg-transparent" />
              <span className="text-xs text-zinc-400 font-mono">{slide.accentColor}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <button
              onClick={() => {
                const arr = [...slides];
                arr.splice(currentSlide + 1, 0, { ...slide, id: Date.now().toString() });
                setSlides(arr);
                setCurrentSlide(currentSlide + 1);
                toast.success("Slide duplicated");
              }}
              className="w-full py-2 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3 h-3" /> Duplicate Slide
            </button>
            <button
              onClick={() => deleteSlide(currentSlide)}
              className="w-full py-2 text-xs text-red-400 hover:text-red-300 bg-zinc-800 hover:bg-red-900/30 rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" /> Delete Slide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Presentations;
