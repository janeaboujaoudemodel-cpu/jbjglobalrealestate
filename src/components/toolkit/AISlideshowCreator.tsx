/**
 * AISlideshowCreator — Upload photos, add text overlays and transitions, preview animated slideshow.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Upload, Play, Pause, SkipForward, SkipBack, Plus, Trash2,
  Download, Image as ImageIcon, Loader2, Type, Clock, Palette
} from "lucide-react";

interface Slide {
  id: string;
  src: string;
  caption: string;
  duration: number; // seconds
}

const TRANSITIONS = ["fade", "slide", "zoom"] as const;
type Transition = typeof TRANSITIONS[number];

export default function AISlideshowCreator({ embedded = false }: { embedded?: boolean }) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transition, setTransition] = useState<Transition>("fade");
  const [projectTitle, setProjectTitle] = useState("Project Promo");
  const [overlayText, setOverlayText] = useState("");
  const [overlayColor, setOverlayColor] = useState("#FFFFFF");
  const [overlayBg, setOverlayBg] = useState("rgba(0,0,0,0.5)");
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addSlides = (files: FileList) => {
    const newSlides: Slide[] = [];
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      newSlides.push({
        id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        src: URL.createObjectURL(file),
        caption: "",
        duration: 3,
      });
    });
    setSlides(prev => [...prev, ...newSlides]);
    if (newSlides.length) toast.success(`Added ${newSlides.length} slide(s)`);
  };

  const removeSlide = (id: string) => {
    setSlides(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (currentIndex >= filtered.length) setCurrentIndex(Math.max(0, filtered.length - 1));
      return filtered;
    });
  };

  const updateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Playback
  useEffect(() => {
    if (!isPlaying || slides.length === 0) return;
    const currentSlide = slides[currentIndex];
    timerRef.current = setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, (currentSlide?.duration || 3) * 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentIndex, slides]);

  const togglePlay = () => {
    if (slides.length === 0) { toast.error("Add slides first"); return; }
    setIsPlaying(prev => !prev);
  };

  const getTransitionClass = () => {
    switch (transition) {
      case "fade": return "animate-[fadeIn_0.6s_ease-in-out]";
      case "slide": return "animate-[slideInRight_0.5s_ease-out]";
      case "zoom": return "animate-[zoomIn_0.5s_ease-out]";
      default: return "";
    }
  };

  const exportFrames = useCallback(async () => {
    if (!slides.length) return;
    setExporting(true);
    try {
      // Export current frame as image
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d")!;
      const slide = slides[currentIndex];
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = slide.src; });
      // Cover-fill
      const iR = img.width / img.height;
      const cR = 1920 / 1080;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (iR > cR) { sw = img.height * cR; sx = (img.width - sw) / 2; }
      else { sh = img.width / cR; sy = (img.height - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1920, 1080);

      // Overlay text
      if (slide.caption || overlayText) {
        const text = slide.caption || overlayText;
        ctx.fillStyle = overlayBg;
        ctx.fillRect(0, 1080 - 120, 1920, 120);
        ctx.fillStyle = overlayColor;
        ctx.font = "bold 42px 'Poppins', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(text, 960, 1080 - 50);
      }

      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectTitle}_frame_${currentIndex + 1}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Frame exported!");
      }, "image/png");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }, [slides, currentIndex, overlayText, overlayColor, overlayBg, projectTitle]);

  const currentSlide = slides[currentIndex];

  return (
    <div className={embedded ? "" : "min-h-screen"} style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #EDE4D3 100%)" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes zoomIn { from { transform: scale(1.08); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {!embedded && (
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "#1A1A1A" }}>
              AI <span style={{ color: "#B8943E" }}>Slideshow</span> Creator
            </h1>
            <p className="text-sm mt-1" style={{ color: "rgba(0,0,0,0.45)" }}>Build animated photo slideshows for real estate promotions</p>
          </div>
        )}

        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* ── Left: Controls ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
              <Label className="text-xs font-bold">Project Title</Label>
              <Input value={projectTitle} onChange={e => setProjectTitle(e.target.value)} className="h-8 text-sm" />
            </div>

            {/* Upload */}
            <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4">
              <Label className="text-xs font-bold mb-2 block">Slides ({slides.length})</Label>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addSlides(e.target.files)} />
              <Button variant="outline" className="w-full h-16 border-dashed border-2 border-[hsl(var(--gold)/0.4)]"
                onClick={() => fileInputRef.current?.click()}>
                <Plus className="w-4 h-4 mr-2" /> Add Photos
              </Button>
              {slides.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
                  {slides.map((s, i) => (
                    <div key={s.id} onClick={() => { setCurrentIndex(i); setIsPlaying(false); }}
                      className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${i === currentIndex ? "border-[hsl(var(--gold))] ring-2 ring-[hsl(var(--gold)/0.3)]" : "border-[hsl(var(--border))]"}`}>
                      <img src={s.src} alt="" className="w-full h-full object-cover" />
                      <button onClick={e => { e.stopPropagation(); removeSlide(s.id); }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] opacity-0 hover:opacity-100 transition-opacity">
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transition */}
            <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
              <Label className="text-xs font-bold">Transition</Label>
              <div className="grid grid-cols-3 gap-2">
                {TRANSITIONS.map(t => (
                  <button key={t} onClick={() => setTransition(t)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all capitalize ${transition === t ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Slide Settings */}
            {currentSlide && (
              <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
                <Label className="text-xs font-bold">Slide {currentIndex + 1} Settings</Label>
                <div>
                  <Label className="text-[10px] text-[hsl(var(--muted-foreground))]">Caption</Label>
                  <Input value={currentSlide.caption} onChange={e => updateSlide(currentSlide.id, { caption: e.target.value })} className="h-7 text-xs" placeholder="e.g. Amra by Omniyat" />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] text-[hsl(var(--muted-foreground))] w-16">Duration</Label>
                  <Input type="number" min={1} max={15} value={currentSlide.duration} onChange={e => updateSlide(currentSlide.id, { duration: +e.target.value })} className="h-7 text-xs w-16" />
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">sec</span>
                </div>
              </div>
            )}

            {/* Overlay */}
            <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
              <Label className="text-xs font-bold">Global Overlay</Label>
              <Input value={overlayText} onChange={e => setOverlayText(e.target.value)} className="h-7 text-xs" placeholder="e.g. JBJ GLOBAL REAL ESTATE" />
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <Label className="text-[10px]">Text</Label>
                  <input type="color" value={overlayColor} onChange={e => setOverlayColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
                </div>
              </div>
            </div>

            <Button onClick={exportFrames} disabled={!slides.length || exporting} className="w-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark,40_70%_35%))] text-white font-semibold">
              {exporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</> : <><Download className="w-4 h-4 mr-2" /> Export Frame</>}
            </Button>
          </div>

          {/* ── Right: Preview ── */}
          <div className="bg-black rounded-xl overflow-hidden relative" style={{ aspectRatio: "16/9" }}>
            {slides.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-white/30">
                <div className="text-center">
                  <ImageIcon className="w-16 h-16 mx-auto mb-3" />
                  <p className="text-sm">Add photos to preview slideshow</p>
                </div>
              </div>
            ) : (
              <>
                <img key={currentSlide?.id} src={currentSlide?.src} alt="" className={`absolute inset-0 w-full h-full object-cover ${getTransitionClass()}`} />
                {/* Caption overlay */}
                {(currentSlide?.caption || overlayText) && (
                  <div className="absolute bottom-0 left-0 right-0 px-6 py-4" style={{ background: overlayBg }}>
                    <p className="text-center font-bold text-lg" style={{ color: overlayColor }}>
                      {currentSlide?.caption || overlayText}
                    </p>
                  </div>
                )}
                {/* Slide counter */}
                <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                  {currentIndex + 1} / {slides.length}
                </div>
              </>
            )}

            {/* Playback controls */}
            {slides.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 p-3" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                <button onClick={() => setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length)} className="text-white/80 hover:text-white">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button onClick={() => setCurrentIndex(prev => (prev + 1) % slides.length)} className="text-white/80 hover:text-white">
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
