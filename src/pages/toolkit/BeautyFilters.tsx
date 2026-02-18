import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SaveProjectBar, ToolContentWrapper } from '@/components/toolkit/SaveProjectBar';
import {
  ArrowLeft, Upload, Sparkles, Download, Loader2, Trash2,
  Sun, Contrast, Droplets, Thermometer, Focus, Palette,
  Zap, Eye, Layers, Minus, Plus, RotateCcw, Shirt, SplitSquareHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

// ── Design tokens ──
const I = {
  bg: "#0C0E14",
  surface: "rgba(99,102,241,0.06)",
  border: "rgba(99,102,241,0.2)",
  borderHover: "rgba(99,102,241,0.55)",
  accent: "#6366F1",
  text: "#818CF8",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.28)",
  btnGrad: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
  btnShadow: "0 4px 20px rgba(99,102,241,0.4)",
};

interface Adjustments {
  exposure: number; brightness: number; contrast: number;
  highlights: number; shadows: number; whites: number; blacks: number;
  saturation: number; vibrance: number; warmth: number; tint: number;
  sharpness: number; blur: number; vignette: number; fade: number;
}

const DEFAULT_ADJ: Adjustments = {
  exposure: 0, brightness: 0, contrast: 0,
  highlights: 0, shadows: 0, whites: 0, blacks: 0,
  saturation: 0, vibrance: 0, warmth: 0, tint: 0,
  sharpness: 0, blur: 0, vignette: 0, fade: 0,
};

const PRESETS: { id: string; name: string; adj: Partial<Adjustments> }[] = [
  { id: 'none',      name: 'Original',         adj: {} },
  { id: 'luxury',    name: 'Luxury Dark',       adj: { brightness: 5, contrast: 15, saturation: -10, warmth: 15, vignette: 25, fade: 5 } },
  { id: 'bright',    name: 'Bright & Clean',    adj: { exposure: 15, brightness: 10, contrast: 5, saturation: 8 } },
  { id: 'warm',      name: 'Warm Glow',         adj: { brightness: 5, contrast: 5, saturation: 12, warmth: 30, vignette: 10 } },
  { id: 'cool',      name: 'Cool Pro',          adj: { contrast: 10, saturation: -5, warmth: -20, vignette: 15 } },
  { id: 'hdr',       name: 'HDR Effect',        adj: { contrast: 30, saturation: 20, highlights: -15, shadows: 15 } },
  { id: 'soft',      name: 'Soft Portrait',     adj: { brightness: 8, contrast: -8, saturation: 5, warmth: 10, blur: 4, vignette: 25 } },
  { id: 'dramatic',  name: 'Dramatic',          adj: { contrast: 35, saturation: 20, vignette: 45, fade: 0 } },
  { id: 'fashion',   name: 'Fashion Editorial', adj: { contrast: 20, saturation: -8, warmth: -10, fade: 15, vignette: 20 } },
  { id: 'matte',     name: 'Matte Film',        adj: { contrast: -10, fade: 35, brightness: 5, shadows: 20 } },
  { id: 'cinematic', name: 'Cinematic',         adj: { contrast: 15, saturation: -15, warmth: 10, vignette: 30, fade: 10 } },
  { id: 'bw',        name: 'Black & White',     adj: { saturation: -100, contrast: 15, vignette: 20 } },
  { id: 'vintage',   name: 'Vintage Film',      adj: { brightness: -5, contrast: -5, saturation: -20, warmth: 20, fade: 25, vignette: 30 } },
  { id: 'golden',    name: 'Golden Hour',       adj: { brightness: 8, warmth: 35, saturation: 15, highlights: -10 } },
  { id: 'sepia',     name: 'Sepia',             adj: { saturation: -80, warmth: 40, contrast: 5, fade: 20 } },
  { id: 'noir',      name: 'Film Noir',         adj: { saturation: -100, contrast: 40, vignette: 55, brightness: -10 } },
];

// ── Clothing whitening pixel algorithm ──
function whitenClothing(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const brightness = (r + g + b) / 3;
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;
    const isNearWhite = brightness > 160 && saturation < 0.35;
    if (isNearWhite) {
      const strength = Math.min(1, Math.max(0, ((brightness - 160) / 95))) * 0.9;
      d[i]   = Math.round(r + (255 - r) * strength);
      d[i+1] = Math.round(g + (255 - g) * strength);
      d[i+2] = Math.round(b + (255 - b) * strength);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

interface BeautyFiltersProps { embedded?: boolean; }

const SLIDER_GROUPS = [
  {
    label: 'Light',
    sliders: [
      { key: 'exposure',   label: 'Exposure',    icon: Sun,      min: -50, max: 50 },
      { key: 'brightness', label: 'Brightness',  icon: Sun,      min: -50, max: 50 },
      { key: 'contrast',   label: 'Contrast',    icon: Contrast, min: -50, max: 50 },
      { key: 'highlights', label: 'Highlights',  icon: Zap,      min: -50, max: 50 },
      { key: 'shadows',    label: 'Shadows',     icon: Layers,   min: -50, max: 50 },
      { key: 'whites',     label: 'Whites',      icon: Plus,     min: -50, max: 50 },
      { key: 'blacks',     label: 'Blacks',      icon: Minus,    min: -50, max: 50 },
    ],
  },
  {
    label: 'Color',
    sliders: [
      { key: 'saturation', label: 'Saturation',  icon: Droplets,    min: -100, max: 100 },
      { key: 'vibrance',   label: 'Vibrance',    icon: Palette,     min: -50,  max: 50  },
      { key: 'warmth',     label: 'Warmth',      icon: Thermometer, min: -50,  max: 50  },
      { key: 'tint',       label: 'Tint',        icon: Eye,         min: -50,  max: 50  },
    ],
  },
  {
    label: 'Detail',
    sliders: [
      { key: 'sharpness',  label: 'Sharpness',   icon: Focus,   min: 0, max: 50 },
      { key: 'blur',       label: 'Blur',        icon: Focus,   min: 0, max: 20 },
      { key: 'vignette',   label: 'Vignette',    icon: Eye,     min: 0, max: 60 },
      { key: 'fade',       label: 'Fade',        icon: Layers,  min: 0, max: 50 },
    ],
  },
];

export default function BeautyFilters({ embedded = false }: BeautyFiltersProps) {
  const [projectName, setProjectName] = useState('Beauty Filter Project');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('none');
  const [adjustments, setAdjustments] = useState<Adjustments>({ ...DEFAULT_ADJ });
  const [showBefore, setShowBefore] = useState(false);
  const [isWhitening, setIsWhitening] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) { setImage(f); setImagePreview(URL.createObjectURL(f)); }
    else toast.error('Please upload an image file');
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setImage(f); setImagePreview(URL.createObjectURL(f)); }
  }, []);

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    setAdjustments({ ...DEFAULT_ADJ, ...preset.adj });
  };

  const updateAdjustment = (key: keyof Adjustments, value: number) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
    setSelectedPreset('custom');
  };

  const resetSingle = (key: keyof Adjustments) => {
    setAdjustments(prev => ({ ...prev, [key]: 0 }));
    setSelectedPreset('custom');
  };

  // ── Canvas rendering ──
  useEffect(() => {
    if (!imagePreview || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      const {
        exposure, brightness, contrast, highlights, shadows, whites, blacks,
        saturation, vibrance, warmth, tint, blur, vignette, fade,
      } = adjustments;

      // ── CSS filter composition ──
      const totalBrightness = 100 + exposure + brightness;
      const warmthSepia = warmth > 0 ? warmth / 2 : 0;
      const tintHue = tint !== 0 ? tint : 0;
      const coolHue = warmth < 0 ? Math.abs(warmth) * 0.5 : 0;

      ctx.filter = [
        `brightness(${totalBrightness}%)`,
        `contrast(${100 + contrast}%)`,
        `saturate(${100 + saturation}%)`,
        warmthSepia > 0 ? `sepia(${warmthSepia}%)` : '',
        coolHue > 0 ? `hue-rotate(${-coolHue}deg)` : '',
        tintHue !== 0 ? `hue-rotate(${tintHue * 0.5}deg)` : '',
        blur > 0 ? `blur(${blur / 10}px)` : '',
      ].filter(Boolean).join(' ');

      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      // ── Pixel-level operations via ImageData ──
      if (highlights !== 0 || shadows !== 0 || whites !== 0 || blacks !== 0 || vibrance !== 0 || fade !== 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;

        for (let i = 0; i < d.length; i += 4) {
          let r = d[i], g = d[i+1], b = d[i+2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const normalizedLum = lum / 255;

          // Highlights: affect bright areas
          if (highlights !== 0) {
            const t = Math.pow(normalizedLum, 2);
            const adj = (highlights / 100) * t * 40;
            r = Math.min(255, Math.max(0, r + adj));
            g = Math.min(255, Math.max(0, g + adj));
            b = Math.min(255, Math.max(0, b + adj));
          }

          // Shadows: affect dark areas
          if (shadows !== 0) {
            const t = Math.pow(1 - normalizedLum, 2);
            const adj = (shadows / 100) * t * 40;
            r = Math.min(255, Math.max(0, r + adj));
            g = Math.min(255, Math.max(0, g + adj));
            b = Math.min(255, Math.max(0, b + adj));
          }

          // Whites: push brightest pixels toward 255
          if (whites !== 0 && normalizedLum > 0.7) {
            const t = (normalizedLum - 0.7) / 0.3;
            const adj = (whites / 100) * t * 50;
            r = Math.min(255, Math.max(0, r + adj));
            g = Math.min(255, Math.max(0, g + adj));
            b = Math.min(255, Math.max(0, b + adj));
          }

          // Blacks: push darkest pixels toward 0
          if (blacks !== 0 && normalizedLum < 0.3) {
            const t = 1 - normalizedLum / 0.3;
            const adj = -(blacks / 100) * t * 50;
            r = Math.min(255, Math.max(0, r + adj));
            g = Math.min(255, Math.max(0, g + adj));
            b = Math.min(255, Math.max(0, b + adj));
          }

          // Vibrance: boost less-saturated colors more than already-saturated
          if (vibrance !== 0) {
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            const satC = maxC === 0 ? 0 : (maxC - minC) / maxC;
            const boost = (vibrance / 100) * (1 - satC) * 0.5;
            const mid = (r + g + b) / 3;
            r = Math.min(255, Math.max(0, r + (r - mid) * boost));
            g = Math.min(255, Math.max(0, g + (g - mid) * boost));
            b = Math.min(255, Math.max(0, b + (b - mid) * boost));
          }

          // Fade: lift shadows and lower highlights (matte look)
          if (fade > 0) {
            const fadeFactor = fade / 100;
            r = Math.round(r * (1 - fadeFactor * 0.3) + 255 * fadeFactor * 0.15);
            g = Math.round(g * (1 - fadeFactor * 0.3) + 255 * fadeFactor * 0.15);
            b = Math.round(b * (1 - fadeFactor * 0.3) + 255 * fadeFactor * 0.15);
          }

          d[i] = r; d[i+1] = g; d[i+2] = b;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      // ── Vignette overlay ──
      if (vignette > 0) {
        const grad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        grad.addColorStop(0.4, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${vignette / 100})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    img.src = imagePreview;
  }, [imagePreview, adjustments]);

  const handleWhitenClothing = () => {
    if (!canvasRef.current) return;
    setIsWhitening(true);
    setTimeout(() => {
      whitenClothing(canvasRef.current!);
      setIsWhitening(false);
      toast.success('Clothing whitened!');
    }, 50);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `beauty-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    toast.success('Image downloaded!');
  };

  return (
    <div style={{ background: I.bg, minHeight: "100vh" }}>
      {!embedded && (
        <header style={{ borderBottom: `1px solid ${I.border}`, background: I.surface }}>
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/toolkit" className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
              style={{ color: I.muted, border: `1px solid ${I.border}` }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = I.muted}>
              <ArrowLeft className="h-4 w-4" /><span className="text-sm">Back to Toolkit</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${I.border}`, color: I.text }}>
              <Sparkles className="w-3 h-3" /> AI Enhancement
            </div>
          </div>
        </header>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${I.border}`, boxShadow: "0 0 32px rgba(99,102,241,0.2)" }}>
            <Sparkles className="h-7 w-7" style={{ color: I.text }} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Beauty Filters</h1>
          <p className="text-sm max-w-lg mx-auto" style={{ color: I.muted }}>
            Professional-grade photo editing with 15 adjustments, 16 presets, and AI clothing whitening.
          </p>
        </div>

        {/* Save Project Bar */}
        <div className="mb-5">
          <SaveProjectBar
            projectName={projectName}
            onNameChange={setProjectName}
            onSave={() => {
              if (!image) { toast.error('No image to save'); return; }
              localStorage.setItem(`beauty-project-${Date.now()}`, JSON.stringify({ name: projectName, savedAt: new Date().toISOString() }));
              toast.success(`Project "${projectName}" saved!`);
            }}
            onClear={() => {
              if (!confirm('Clear this project?')) return;
              setImage(null); setImagePreview(null);
              setAdjustments({ ...DEFAULT_ADJ }); setSelectedPreset('none');
              setProjectName('Beauty Filter Project');
              toast.success('Project cleared');
            }}
            canSave={!!image}
            accentColor={I.accent}
            accentBorder={I.border}
          />
        </div>

        <ToolContentWrapper accentColor={I.accent}>

        {/* Upload */}
        {!image && (
          <div className="max-w-2xl mx-auto">
            <div
              onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop}
              onClick={() => document.getElementById('beauty-file-input')?.click()}
              className="rounded-2xl p-12 text-center cursor-pointer transition-all duration-300"
              style={{ border: `2px dashed ${I.border}`, background: I.surface }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = I.borderHover; (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = I.border; (e.currentTarget as HTMLElement).style.background = I.surface; }}>
              <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: "rgba(99,102,241,0.55)" }} />
              <p className="text-white font-semibold text-lg mb-2">Drop your photo here</p>
              <p className="text-sm mb-4" style={{ color: I.dim }}>JPG, PNG, WebP · Max 10MB</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: I.btnGrad, boxShadow: I.btnShadow }}>
                <Upload className="h-4 w-4" /> Browse Files
              </div>
              <input id="beauty-file-input" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>
          </div>
        )}

        {/* Editor */}
        {image && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Canvas + Presets */}
            <div className="lg:col-span-2 space-y-4">
              {/* Canvas header */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${I.border}` }}>
                <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: `1px solid rgba(99,102,241,0.12)` }}>
                  <span className="text-sm font-medium text-white truncate max-w-[200px]">{image.name}</span>
                  <div className="flex items-center gap-2">
                    {/* Before/After toggle */}
                    <button
                      onClick={() => setShowBefore(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: showBefore ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${showBefore ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                        color: showBefore ? I.text : I.muted,
                      }}>
                      <SplitSquareHorizontal className="h-3.5 w-3.5" />
                      {showBefore ? 'Original' : 'Before/After'}
                    </button>
                    <button
                      onClick={() => { setImage(null); setImagePreview(null); setAdjustments({ ...DEFAULT_ADJ }); setSelectedPreset('none'); }}
                      className="p-1.5 rounded-lg transition-all hover:bg-red-500/20"
                      style={{ color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-center min-h-[300px] sm:min-h-[420px]" style={{ background: "rgba(0,0,0,0.5)" }}>
                  {showBefore && imagePreview ? (
                    <img src={imagePreview} alt="Original" className="max-w-full max-h-[500px] object-contain rounded-lg" />
                  ) : (
                    <canvas ref={canvasRef} className="max-w-full max-h-[500px] object-contain rounded-lg" />
                  )}
                </div>
              </div>

              {/* Presets */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: I.text }}>Presets</h3>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((preset) => (
                    <button key={preset.id} onClick={() => applyPreset(preset.id)}
                      className="px-3 py-1.5 rounded-xl text-xs transition-all font-medium"
                      style={{
                        background: selectedPreset === preset.id ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${selectedPreset === preset.id ? "rgba(99,102,241,0.65)" : "rgba(255,255,255,0.08)"}`,
                        color: selectedPreset === preset.id ? I.text : I.muted,
                      }}>
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Whiten Clothing — prominent action */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      <Shirt className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Whiten Clothing</p>
                      <p className="text-xs" style={{ color: I.dim }}>Make white garments pure white — preserves skin tones</p>
                    </div>
                  </div>
                  <button
                    onClick={handleWhitenClothing}
                    disabled={isWhitening}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)", color: "#1E293B", boxShadow: "0 2px 12px rgba(255,255,255,0.15)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
                    {isWhitening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shirt className="h-4 w-4" />}
                    {isWhitening ? 'Whitening...' : 'Whiten Now'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Sliders + Actions */}
            <div className="space-y-4">
              {/* Slider groups */}
              {SLIDER_GROUPS.map(group => (
                <div key={group.label} className="rounded-2xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: I.text }}>{group.label}</h3>
                  <div className="space-y-4">
                    {group.sliders.map(({ key, label, icon: Icon, min, max }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs flex items-center gap-1.5" style={{ color: I.muted }}>
                            <Icon className="h-3.5 w-3.5" style={{ color: I.text }} />{label}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono w-8 text-right" style={{ color: I.text }}>
                              {adjustments[key as keyof Adjustments]}
                            </span>
                            {adjustments[key as keyof Adjustments] !== 0 && (
                              <button
                                onClick={() => resetSingle(key as keyof Adjustments)}
                                className="p-0.5 rounded hover:opacity-80 transition-opacity"
                                style={{ color: I.dim }}>
                                <RotateCcw className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <Slider
                          value={[adjustments[key as keyof Adjustments]]}
                          onValueChange={([v]) => updateAdjustment(key as keyof Adjustments, v)}
                          min={min} max={max} step={1} className="w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Consent */}
              <div className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)" }}>
                <Checkbox id="beauty-consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
                <label htmlFor="beauty-consent" className="text-xs cursor-pointer" style={{ color: I.muted }}>
                  I own this content or have permission to edit it.
                </label>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDownload} disabled={!consent}
                  className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: I.btnGrad, boxShadow: I.btnShadow }}>
                  <Download className="h-4 w-4" /> Download Image
                </button>
                <button
                  onClick={() => { setAdjustments({ ...DEFAULT_ADJ }); setSelectedPreset('none'); }}
                  className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.1)`, color: I.muted }}>
                  <RotateCcw className="h-4 w-4" /> Reset All
                </button>
              </div>

              <p className="text-center text-xs" style={{ color: I.dim }}>
                All processing is local · No data uploaded
              </p>
            </div>
          </div>
        )}
        </ToolContentWrapper>
      </main>
    </div>
  );
}
