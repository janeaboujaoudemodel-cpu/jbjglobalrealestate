/**
 * Photo Studio Pro — Unified photo editing hub
 * Single upload → all tools share the same canvas & preview
 * Real AI calls via edge functions
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import InstagramGridPlanner from '@/components/toolkit/InstagramGridPlanner';
import { Link } from 'react-router-dom';
import { SaveProjectBar, ToolContentWrapper } from '@/components/toolkit/SaveProjectBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Upload, Sparkles, Download, Loader2, Trash2,
  Sun, Contrast, Droplets, Thermometer, Focus, Palette,
  Zap, Eye, Layers, Minus, Plus, RotateCcw, Shirt, SplitSquareHorizontal,
  Smile, Scissors, Wand2, Grid3x3, ImageIcon, Brush, Camera,
  Sliders, Filter, Crop, FlipHorizontal, Star, Paintbrush,
  Users, Dumbbell, Heart, Share2, Send, Copy, Mail,
  Instagram, Facebook, Twitter, Linkedin, MessageCircle, Phone,
  Eraser, PenTool, Type, Layout, Square, RectangleHorizontal,
  Smartphone, Monitor, Aperture, CircleDot, X
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// ── Design tokens (Champagne-Gold on dark canvas) ──
const I = {
  bg: "#0D0C08",
  surface: "rgba(184,149,85,0.06)",
  border: "rgba(184,149,85,0.2)",
  borderHover: "rgba(184,149,85,0.55)",
  accent: "#B89555",
  text: "#D4AF37",
  muted: "rgba(255,255,255,0.45)",
  dim: "rgba(255,255,255,0.28)",
  btnGrad: "linear-gradient(135deg, #B89555 0%, #9A7B2F 100%)",
  btnShadow: "0 4px 20px rgba(184,149,85,0.3)",
};

// ── Types ──
interface Adjustments {
  exposure: number; brightness: number; contrast: number;
  highlights: number; shadows: number; whites: number; blacks: number;
  saturation: number; vibrance: number; warmth: number; tint: number;
  sharpness: number; blur: number; vignette: number; fade: number;
  dehaze: number; texture: number; clarity: number;
}

interface FaceAdjustments {
  skinSmooth: number; teethWhiten: number; eyeEnhance: number;
  lipColor: number; blush: number; eyebrow: number; noseSlim: number;
  faceSlim: number; jawline: number; eyeSize: number;
}

interface BodyAdjustments {
  legLength: number; waistSlim: number; shoulderBroad: number;
  absDefinition: number; armSlim: number;
}

interface HairStyle {
  id: string; name: string; icon: string;
}

const DEFAULT_ADJ: Adjustments = {
  exposure: 0, brightness: 0, contrast: 0,
  highlights: 0, shadows: 0, whites: 0, blacks: 0,
  saturation: 0, vibrance: 0, warmth: 0, tint: 0,
  sharpness: 0, blur: 0, vignette: 0, fade: 0,
  dehaze: 0, texture: 0, clarity: 0,
};

const DEFAULT_FACE: FaceAdjustments = {
  skinSmooth: 0, teethWhiten: 0, eyeEnhance: 0,
  lipColor: 0, blush: 0, eyebrow: 0, noseSlim: 0,
  faceSlim: 0, jawline: 0, eyeSize: 0,
};

const DEFAULT_BODY: BodyAdjustments = {
  legLength: 0, waistSlim: 0, shoulderBroad: 0,
  absDefinition: 0, armSlim: 0,
};

const PRESETS = [
  { id: 'none',      name: 'Original',         adj: {} },
  { id: 'luxury',    name: 'Luxury Dark',       adj: { brightness: 5, contrast: 15, saturation: -10, warmth: 15, vignette: 25, fade: 5 } },
  { id: 'bright',    name: 'Bright & Clean',    adj: { exposure: 15, brightness: 10, contrast: 5, saturation: 8 } },
  { id: 'warm',      name: 'Warm Glow',         adj: { brightness: 5, contrast: 5, saturation: 12, warmth: 30, vignette: 10 } },
  { id: 'cool',      name: 'Cool Pro',          adj: { contrast: 10, saturation: -5, warmth: -20, vignette: 15 } },
  { id: 'hdr',       name: 'HDR',               adj: { contrast: 30, saturation: 20, highlights: -15, shadows: 15 } },
  { id: 'soft',      name: 'Soft Portrait',     adj: { brightness: 8, contrast: -8, saturation: 5, warmth: 10, blur: 4, vignette: 25 } },
  { id: 'dramatic',  name: 'Dramatic',          adj: { contrast: 35, saturation: 20, vignette: 45 } },
  { id: 'fashion',   name: 'Fashion',           adj: { contrast: 20, saturation: -8, warmth: -10, fade: 15, vignette: 20 } },
  { id: 'matte',     name: 'Matte Film',        adj: { contrast: -10, fade: 35, brightness: 5, shadows: 20 } },
  { id: 'cinematic', name: 'Cinematic',          adj: { contrast: 15, saturation: -15, warmth: 10, vignette: 30, fade: 10 } },
  { id: 'bw',        name: 'B&W',                adj: { saturation: -100, contrast: 15, vignette: 20 } },
  { id: 'vintage',   name: 'Vintage',            adj: { brightness: -5, contrast: -5, saturation: -20, warmth: 20, fade: 25, vignette: 30 } },
  { id: 'golden',    name: 'Golden Hour',        adj: { brightness: 8, warmth: 35, saturation: 15, highlights: -10 } },
  { id: 'sepia',     name: 'Sepia',              adj: { saturation: -80, warmth: 40, contrast: 5, fade: 20 } },
  { id: 'noir',      name: 'Film Noir',          adj: { saturation: -100, contrast: 40, vignette: 55, brightness: -10 } },
  { id: 'lr_fade',   name: 'LR Faded',           adj: { fade: 30, contrast: -5, saturation: -10, shadows: 15 } },
  { id: 'lr_punch',  name: 'LR Punch',           adj: { clarity: 30, vibrance: 20, contrast: 10, dehaze: 10 } },
  { id: 'beauty',    name: 'Beauty',             adj: { brightness: 5, saturation: 8, warmth: 8, vibrance: 15, blur: 2 } },
  { id: 'instagram', name: 'Insta Filter',      adj: { saturation: 15, brightness: 5, contrast: 8, warmth: 10, vignette: 10 } },
];

const HAIR_STYLES: HairStyle[] = [
  { id: 'straight', name: 'Straight', icon: '—' },
  { id: 'curly', name: 'Curly', icon: '~' },
  { id: 'wavy', name: 'Wavy', icon: '≈' },
  { id: 'bald', name: 'Bald / Shaved', icon: '○' },
  { id: 'bangs', name: 'Bangs', icon: '/' },
  { id: 'bob', name: 'Bob Cut', icon: '◡' },
  { id: 'pixie', name: 'Pixie Cut', icon: '◇' },
  { id: 'long', name: 'Long Flowing', icon: '∿' },
];

const HAIR_COLORS = [
  { id: 'black', name: 'Black', color: '#1a1a1a' },
  { id: 'brown', name: 'Brown', color: '#6B3F2A' },
  { id: 'blonde', name: 'Blonde', color: '#F4C261' },
  { id: 'red', name: 'Red', color: '#C0392B' },
  { id: 'auburn', name: 'Auburn', color: '#8B3A2A' },
  { id: 'silver', name: 'Silver', color: '#BDC3C7' },
  { id: 'blue', name: 'Blue', color: '#2E86C1' },
  { id: 'pink', name: 'Pink', color: '#FF69B4' },
  { id: 'purple', name: 'Purple', color: '#7D3C98' },
  { id: 'green', name: 'Green', color: '#27AE60' },
];

const MAKEUP_LOOKS = [
  { id: 'natural', name: 'Natural', icon: '●' },
  { id: 'glam', name: 'Glam', icon: '◆' },
  { id: 'smoky', name: 'Smoky Eye', icon: '◑' },
  { id: 'bold_lip', name: 'Bold Lip', icon: '◈' },
  { id: 'fresh', name: 'Fresh Glow', icon: '○' },
  { id: 'editorial', name: 'Editorial', icon: '◇' },
  { id: 'contour', name: 'Contoured', icon: '◆' },
  { id: 'no_makeup', name: 'No Makeup', icon: '◯' },
];

const SHARE_FORMATS = [
  { id: 'ig-story', label: 'Story', w: 1080, h: 1920, icon: Smartphone },
  { id: 'ig-post', label: 'Post', w: 1080, h: 1080, icon: Square },
  { id: 'fb-cover', label: 'Cover', w: 820, h: 312, icon: RectangleHorizontal },
  { id: 'landscape', label: 'Landscape', w: 1920, h: 1080, icon: Monitor },
];

function whitenClothing(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const brightness = (r + g + b) / 3;
    const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
    const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;
    if (brightness > 160 && saturation < 0.35) {
      const strength = Math.min(1, Math.max(0, ((brightness - 160) / 95))) * 0.9;
      d[i] = Math.round(r + (255 - r) * strength);
      d[i+1] = Math.round(g + (255 - g) * strength);
      d[i+2] = Math.round(b + (255 - b) * strength);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

interface BeautyFiltersProps { embedded?: boolean; }

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: I.text }}>{children}</h4>
);

const AIBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
    style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#818CF8" }}>
    <Sparkles className="h-2 w-2" />{label}
  </span>
);

export default function BeautyFilters({ embedded = false }: BeautyFiltersProps) {
  const [projectName, setProjectName] = useState('Photo Studio Project');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState('none');
  const [adjustments, setAdjustments] = useState<Adjustments>({ ...DEFAULT_ADJ });
  const [faceAdj, setFaceAdj] = useState<FaceAdjustments>({ ...DEFAULT_FACE });
  const [bodyAdj, setBodyAdj] = useState<BodyAdjustments>({ ...DEFAULT_BODY });
  const [showBefore, setShowBefore] = useState(false);
  const [isWhitening, setIsWhitening] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedHairStyle, setSelectedHairStyle] = useState('');
  const [selectedHairColor, setSelectedHairColor] = useState('');
  const [selectedMakeup, setSelectedMakeup] = useState('');
  const [activeTab, setActiveTab] = useState('edit');
  const [shareFormat, setShareFormat] = useState('ig-post');
  const [createPrompt, setCreatePrompt] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Unified File Handling ──
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

  const updateAdj = (key: keyof Adjustments, value: number) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
    setSelectedPreset('custom');
  };

  const updateFaceAdj = (key: keyof FaceAdjustments, value: number) => {
    setFaceAdj(prev => ({ ...prev, [key]: value }));
  };

  const updateBodyAdj = (key: keyof BodyAdjustments, value: number) => {
    setBodyAdj(prev => ({ ...prev, [key]: value }));
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
      const { exposure, brightness, contrast, highlights, shadows, whites, blacks,
        saturation, vibrance, warmth, tint, blur, vignette, fade, clarity } = adjustments;
      const totalBrightness = 100 + exposure + brightness;
      const warmthSepia = warmth > 0 ? warmth / 2 : 0;
      ctx.filter = [
        `brightness(${totalBrightness}%)`,
        `contrast(${100 + contrast + clarity * 0.5}%)`,
        `saturate(${100 + saturation}%)`,
        warmthSepia > 0 ? `sepia(${warmthSepia}%)` : '',
        warmth < 0 ? `hue-rotate(${Math.abs(warmth) * 0.5}deg)` : '',
        tint !== 0 ? `hue-rotate(${tint * 0.5}deg)` : '',
        blur > 0 ? `blur(${blur / 10}px)` : '',
      ].filter(Boolean).join(' ');
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      if (highlights !== 0 || shadows !== 0 || whites !== 0 || blacks !== 0 || vibrance !== 0 || fade !== 0) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          let r = d[i], g = d[i+1], b = d[i+2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const nl = lum / 255;
          if (highlights !== 0) { const t = Math.pow(nl, 2); const a = (highlights / 100) * t * 40; r = Math.min(255, Math.max(0, r + a)); g = Math.min(255, Math.max(0, g + a)); b = Math.min(255, Math.max(0, b + a)); }
          if (shadows !== 0) { const t = Math.pow(1 - nl, 2); const a = (shadows / 100) * t * 40; r = Math.min(255, Math.max(0, r + a)); g = Math.min(255, Math.max(0, g + a)); b = Math.min(255, Math.max(0, b + a)); }
          if (whites !== 0 && nl > 0.7) { const t = (nl - 0.7) / 0.3; const a = (whites / 100) * t * 50; r = Math.min(255, Math.max(0, r + a)); g = Math.min(255, Math.max(0, g + a)); b = Math.min(255, Math.max(0, b + a)); }
          if (blacks !== 0 && nl < 0.3) { const t = 1 - nl / 0.3; const a = -(blacks / 100) * t * 50; r = Math.min(255, Math.max(0, r + a)); g = Math.min(255, Math.max(0, g + a)); b = Math.min(255, Math.max(0, b + a)); }
          if (vibrance !== 0) { const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const sat = mx === 0 ? 0 : (mx - mn) / mx; const boost = (vibrance / 100) * (1 - sat) * 0.5; const mid = (r + g + b) / 3; r = Math.min(255, Math.max(0, r + (r - mid) * boost)); g = Math.min(255, Math.max(0, g + (g - mid) * boost)); b = Math.min(255, Math.max(0, b + (b - mid) * boost)); }
          if (fade > 0) { const ff = fade / 100; r = Math.round(r * (1 - ff * 0.3) + 255 * ff * 0.15); g = Math.round(g * (1 - ff * 0.3) + 255 * ff * 0.15); b = Math.round(b * (1 - ff * 0.3) + 255 * ff * 0.15); }
          d[i] = r; d[i+1] = g; d[i+2] = b;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      if (vignette > 0) {
        const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/2);
        grad.addColorStop(0.4, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(0,0,0,${vignette/100})`);
        ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    img.src = imagePreview;
  }, [imagePreview, adjustments]);

  // ── Real AI Processing ──
  const processWithAI = async (action: string, prompt: string) => {
    if (!canvasRef.current && !image) {
      toast.error('Please upload a photo first');
      return;
    }
    setIsProcessingAI(true);
    try {
      let base64: string;
      if (canvasRef.current && canvasRef.current.width > 0) {
        base64 = canvasRef.current.toDataURL('image/jpeg', 0.85);
      } else if (image) {
        base64 = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(image);
        });
      } else {
        throw new Error('No image available');
      }

      const edgeFn = action === 'change-outfit' ? 'ai-outfit-changer' : 'ai-background-remove';
      const body = action === 'change-outfit'
        ? { prompt, imageBase64: base64.split(',')[1] }
        : { mode: action, image: base64, generationPrompt: prompt };

      const { data, error } = await supabase.functions.invoke(edgeFn, { body });

      if (error) {
        if (error.message?.includes('429')) { toast.error('Rate limit reached. Please wait and try again.'); return; }
        if (error.message?.includes('402')) { toast.error('AI credits exhausted. Please try again later.'); return; }
        throw error;
      }

      // Handle response
      const resultImage = data?.processedImage || data?.imageUrl || data?.resultImage;
      if (resultImage) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              canvasRef.current.width = img.width;
              canvasRef.current.height = img.height;
              ctx.drawImage(img, 0, 0);
            }
          }
          // Also update the preview so other tabs see the result
          setImagePreview(resultImage.startsWith('data:') ? resultImage : `data:image/png;base64,${resultImage}`);
          toast.success(`${prompt || action} applied!`);
        };
        img.src = resultImage.startsWith('data:') ? resultImage : `data:image/png;base64,${resultImage}`;
      } else {
        toast.info(`AI processed: ${prompt || action}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI processing failed';
      toast.error(msg);
      console.error('AI processing error:', err);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleWhitenClothing = () => {
    if (!canvasRef.current) return;
    setIsWhitening(true);
    setTimeout(() => { whitenClothing(canvasRef.current!); setIsWhitening(false); toast.success('Clothing whitened!'); }, 50);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `photo-studio-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    toast.success('Image downloaded!');
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob | null>(r => canvasRef.current!.toBlob(r, 'image/png'));
      if (!blob) { toast.error('Could not generate image'); return; }
      const file = new File([blob], 'photo-studio.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Photo Studio Pro' });
        toast.success('Shared!');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast.success('Image copied to clipboard!');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Share failed');
      }
    }
  };

  const handleCopyLink = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    navigator.clipboard.writeText(dataUrl.slice(0, 100) + '...');
    toast.success('Image data copied!');
  };

  const handleExportFormat = (format: typeof SHARE_FORMATS[0]) => {
    if (!canvasRef.current) return;
    const source = canvasRef.current;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = format.w;
    exportCanvas.height = format.h;
    const ctx = exportCanvas.getContext('2d')!;
    // Fill black, then draw centered/cover
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, format.w, format.h);
    const scale = Math.max(format.w / source.width, format.h / source.height);
    const sw = source.width * scale;
    const sh = source.height * scale;
    ctx.drawImage(source, (format.w - sw) / 2, (format.h - sh) / 2, sw, sh);
    const link = document.createElement('a');
    link.download = `photo-${format.id}-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
    toast.success(`Exported as ${format.label}!`);
  };

  // ── Slider row component ──
  const SliderRow = ({ label, value, min, max, onChange, icon: Icon }: {
    label: string; value: number; min: number; max: number;
    onChange: (v: number) => void; icon?: React.ElementType;
  }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs flex items-center gap-1.5" style={{ color: I.muted }}>
          {Icon && <Icon className="h-3 w-3" style={{ color: I.text }} />}{label}
        </label>
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono w-8 text-right" style={{ color: I.text }}>{value}</span>
          {value !== 0 && (
            <button onClick={() => onChange(0)} className="p-0.5 rounded" style={{ color: I.dim }}>
              <RotateCcw className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={1} className="w-full" />
    </div>
  );

  // ── Upload Zone (shown only once at top if no image) ──
  const uploadZone = (
    <div className="max-w-2xl mx-auto">
      <div
        onDragOver={e => e.preventDefault()} onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-2xl p-12 text-center cursor-pointer transition-all duration-300"
        style={{ border: `2px dashed ${I.border}`, background: I.surface }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = I.borderHover; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = I.border; }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(184,149,85,0.12)", border: `1px solid ${I.border}` }}>
          <Camera className="h-8 w-8" style={{ color: I.text }} />
        </div>
        <p className="text-white font-semibold text-lg mb-2">Drop your photo here</p>
        <p className="text-sm mb-5" style={{ color: I.dim }}>JPG, PNG, WebP — upload once, edit with all tools</p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: I.btnGrad, boxShadow: I.btnShadow }}>
          <Upload className="h-4 w-4" /> Browse Photo
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>
    </div>
  );

  // ── Persistent Canvas Preview (always visible when image loaded) ──
  const canvasPreview = (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${I.border}` }}>
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: `1px solid rgba(184,149,85,0.1)` }}>
        <span className="text-sm font-medium text-white truncate max-w-[200px]">{image?.name || 'Photo'}</span>
        <div className="flex items-center gap-2">
          {isProcessingAI && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: I.text }}>
              <Loader2 className="h-3 w-3 animate-spin" /> Processing...
            </span>
          )}
          <button onClick={() => setShowBefore(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
            style={{ background: showBefore ? "rgba(184,149,85,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${showBefore ? "rgba(184,149,85,0.5)" : "rgba(255,255,255,0.1)"}`, color: showBefore ? I.text : I.muted }}>
            <SplitSquareHorizontal className="h-3 w-3" />{showBefore ? 'Original' : 'B/A'}
          </button>
          <button onClick={() => { setImage(null); setImagePreview(null); setAdjustments({ ...DEFAULT_ADJ }); setSelectedPreset('none'); setFaceAdj({ ...DEFAULT_FACE }); setBodyAdj({ ...DEFAULT_BODY }); }}
            className="p-1.5 rounded-lg" style={{ color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="p-3 flex items-center justify-center min-h-[300px]">
        {showBefore && imagePreview
          ? <img src={imagePreview} alt="Original" className="max-w-full max-h-[480px] object-contain rounded-lg"  loading="lazy" decoding="async" />
          : <canvas ref={canvasRef} className="max-w-full max-h-[480px] object-contain rounded-lg" />
        }
      </div>
    </div>
  );

  const TABS = [
    { value: 'edit', label: 'Edit & Filters', icon: Sliders },
    { value: 'face', label: 'Face & Beauty', icon: Smile },
    { value: 'body', label: 'Body Reshape', icon: Dumbbell },
    { value: 'hair', label: 'Hair & Style', icon: Scissors },
    { value: 'outfit', label: 'Outfit & BG', icon: Shirt },
    { value: 'create', label: 'Create', icon: Wand2 },
    { value: 'grid', label: 'Grid Planner', icon: Grid3x3 },
    { value: 'share', label: 'Share', icon: Share2 },
  ];

  return (
    <div style={{ background: I.bg, minHeight: "100vh" }}>
      {!embedded && (
        <header style={{ borderBottom: `1px solid ${I.border}`, background: I.surface }}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/toolkit" className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
              style={{ color: I.muted, border: `1px solid ${I.border}` }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = I.muted}>
              <ArrowLeft className="h-4 w-4" /><span className="text-sm">Back</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(184,149,85,0.12)", border: `1px solid ${I.border}`, color: I.text }}>
              <Sparkles className="w-3 h-3" /> Photo Studio Pro
            </div>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "rgba(184,149,85,0.12)", border: `1px solid ${I.border}`, boxShadow: "0 0 32px rgba(184,149,85,0.2)" }}>
            <Wand2 className="h-7 w-7" style={{ color: I.text }} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Photo Studio <span style={{ color: "#D4AF37" }}>Pro</span></h1>
          <p className="text-sm max-w-2xl mx-auto" style={{ color: I.muted }}>
            Edit, enhance, transform, create & share — all-in-one photo studio
          </p>
        </div>

        {/* Save Project Bar */}
        <div className="mb-5">
          <SaveProjectBar
            projectName={projectName}
            onNameChange={setProjectName}
            onSave={() => {
              if (!image) { toast.error('No image to save'); return; }
              localStorage.setItem(`photo-studio-${Date.now()}`, JSON.stringify({ name: projectName, savedAt: new Date().toISOString() }));
              toast.success(`Project "${projectName}" saved!`);
            }}
            onClear={() => {
              if (!confirm('Clear this project?')) return;
              setImage(null); setImagePreview(null);
              setAdjustments({ ...DEFAULT_ADJ }); setSelectedPreset('none');
              setFaceAdj({ ...DEFAULT_FACE }); setBodyAdj({ ...DEFAULT_BODY });
              setSelectedHairStyle(''); setSelectedHairColor(''); setSelectedMakeup('');
              setProjectName('Photo Studio Project');
              toast.success('Project cleared');
            }}
            canSave={!!image}
            accentColor={I.accent}
            accentBorder={I.border}
          />
        </div>

        <ToolContentWrapper accentColor={I.accent}>
          {/* ── SINGLE UPLOAD ZONE (only shown if no image) ── */}
          {!image ? uploadZone : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Tab bar */}
              <TabsList className="w-full justify-start rounded-2xl bg-transparent p-0 h-auto gap-1 border-0 overflow-x-auto mb-6 flex-wrap"
                style={{ scrollbarWidth: "none", background: "rgba(184,149,85,0.04)", border: `1px solid ${I.border}`, padding: "6px" }}>
                {TABS.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger key={value} value={value}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border-0 outline-none whitespace-nowrap
                      data-[state=inactive]:text-white/85 data-[state=active]:text-white data-[state=active]:shadow-lg"
                    style={{
                      background: activeTab === value ? I.btnGrad : 'transparent',
                      boxShadow: activeTab === value ? I.btnShadow : 'none',
                    } as React.CSSProperties}>
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.split(' ')[0]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ── Tab 1: Edit & Filters ── */}
              <TabsContent value="edit" className="mt-0">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {canvasPreview}
                    {/* Presets */}
                    <div>
                      <SectionLabel>Presets & Filters</SectionLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESETS.map((p) => (
                          <button key={p.id} onClick={() => applyPreset(p.id)}
                            className="px-3 py-1.5 rounded-xl text-xs transition-all font-medium"
                            style={{
                              background: selectedPreset === p.id ? "rgba(184,149,85,0.35)" : "rgba(255,255,255,0.10)",
                              border: `1px solid ${selectedPreset === p.id ? "rgba(184,149,85,0.75)" : "rgba(255,255,255,0.22)"}`,
                              color: selectedPreset === p.id ? I.text : "rgba(255,255,255,0.88)",
                            }}>{p.name}</button>
                        ))}
                      </div>
                    </div>
                    {/* Whiten Clothing */}
                    <div className="rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                          <Shirt className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">Whiten Clothing</p>
                          <p className="text-xs" style={{ color: I.dim }}>Pixel-level whitening</p>
                        </div>
                      </div>
                      <button onClick={handleWhitenClothing} disabled={isWhitening}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)", color: "#1E293B" }}>
                        {isWhitening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shirt className="h-4 w-4" />}
                        {isWhitening ? 'Whitening...' : 'Whiten Now'}
                      </button>
                    </div>
                  </div>

                  {/* Right: Adjustments */}
                  <div className="space-y-4">
                    <div className="rounded-2xl p-4 space-y-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <SectionLabel>Light</SectionLabel>
                      {([
                        ['exposure','Exposure',Sun,-50,50],['brightness','Brightness',Sun,-50,50],
                        ['contrast','Contrast',Contrast,-50,50],['highlights','Highlights',Zap,-50,50],
                        ['shadows','Shadows',Layers,-50,50],['whites','Whites',Plus,-50,50],['blacks','Blacks',Minus,-50,50],
                      ] as [keyof Adjustments, string, React.ElementType, number, number][]).map(([k,l,Ic,mn,mx]) => (
                        <SliderRow key={k} label={l} value={adjustments[k]} min={mn} max={mx} onChange={v => updateAdj(k,v)} icon={Ic} />
                      ))}
                    </div>
                    <div className="rounded-2xl p-4 space-y-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center gap-2">
                        <Palette className="h-3 w-3" style={{ color: I.text }} />
                        <SectionLabel>Color</SectionLabel>
                      </div>
                      {([
                        ['saturation','Saturation',Droplets,-100,100],['vibrance','Vibrance',Palette,-50,50],
                        ['warmth','Warmth',Thermometer,-50,50],['tint','Tint',Eye,-50,50],
                      ] as [keyof Adjustments, string, React.ElementType, number, number][]).map(([k,l,Ic,mn,mx]) => (
                        <SliderRow key={k} label={l} value={adjustments[k]} min={mn} max={mx} onChange={v => updateAdj(k,v)} icon={Ic} />
                      ))}
                    </div>
                    <div className="rounded-2xl p-4 space-y-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center gap-2">
                        <Focus className="h-3 w-3" style={{ color: I.text }} />
                        <SectionLabel>Detail</SectionLabel>
                      </div>
                      {([
                        ['sharpness','Sharpness',Focus,0,50],['blur','Blur',Focus,0,20],
                        ['clarity','Clarity',Zap,-50,50],['dehaze','Dehaze',Eye,0,50],
                        ['vignette','Vignette',Eye,0,60],['fade','Fade',Layers,0,50],
                        ['texture','Texture',Paintbrush,-50,50],
                      ] as [keyof Adjustments, string, React.ElementType, number, number][]).map(([k,l,Ic,mn,mx]) => (
                        <SliderRow key={k} label={l} value={adjustments[k]} min={mn} max={mx} onChange={v => updateAdj(k,v)} icon={Ic} />
                      ))}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button onClick={handleDownload}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm"
                        style={{ background: I.btnGrad, boxShadow: I.btnShadow }}>
                        <Download className="h-4 w-4" /> Download Image
                      </button>
                      <button onClick={() => { setAdjustments({ ...DEFAULT_ADJ }); setSelectedPreset('none'); }}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white"
                        style={{ background: "rgba(255,255,255,0.14)", border: `1px solid rgba(255,255,255,0.25)` }}>
                        <RotateCcw className="h-4 w-4" /> Reset All
                      </button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── Tab 2: Face & Beauty ── */}
              <TabsContent value="face" className="mt-0">
                <div className="grid lg:grid-cols-2 gap-6">
                  {canvasPreview}
                  <div className="space-y-5">
                    {/* Makeup Looks */}
                    <div className="rounded-2xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Brush className="h-3 w-3" style={{ color: I.text }} />
                          <SectionLabel>Makeup Looks</SectionLabel>
                        </div>
                        <AIBadge label="AI" />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {MAKEUP_LOOKS.map(look => (
                          <button key={look.id} onClick={() => { setSelectedMakeup(look.id); processWithAI('edit', `Apply ${look.name} makeup look`); }}
                            className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all"
                            style={{
                              background: selectedMakeup === look.id ? "rgba(184,149,85,0.35)" : "rgba(255,255,255,0.12)",
                              border: `1px solid ${selectedMakeup === look.id ? "rgba(184,149,85,0.75)" : "rgba(255,255,255,0.25)"}`,
                              color: selectedMakeup === look.id ? I.text : "rgba(255,255,255,0.9)",
                            }}>
                            <span className="text-lg">{look.icon}</span>
                            <span>{look.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Face Sliders */}
                    <div className="rounded-2xl p-4 space-y-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Smile className="h-3 w-3" style={{ color: I.text }} />
                          <SectionLabel>Face Adjustments</SectionLabel>
                        </div>
                        <AIBadge label="AI" />
                      </div>
                      {([
                        ['skinSmooth','Skin Smooth',0,100],
                        ['teethWhiten','Teeth Whitening',0,100],
                        ['eyeEnhance','Eye Enhance',0,100],
                        ['lipColor','Lip Color',0,100],
                        ['blush','Blush',-50,50],
                        ['eyebrow','Eyebrow Shape',-50,50],
                        ['noseSlim','Nose Slim',0,50],
                        ['faceSlim','Face Slim',0,50],
                        ['jawline','Jawline',0,50],
                        ['eyeSize','Eye Size',-30,30],
                      ] as [keyof FaceAdjustments, string, number, number][]).map(([k,l,mn,mx]) => (
                        <SliderRow key={k} label={l} value={faceAdj[k]} min={mn} max={mx} onChange={v => updateFaceAdj(k,v)} />
                      ))}
                    </div>

                    <button
                      onClick={() => { setFaceAdj({ ...DEFAULT_FACE }); setSelectedMakeup(''); toast.success('Face adjustments reset'); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white"
                      style={{ background: "rgba(255,255,255,0.14)", border: `1px solid rgba(255,255,255,0.25)` }}>
                      <RotateCcw className="h-4 w-4" /> Reset Face
                    </button>

                    {/* AI Prompt for face */}
                    <div className="rounded-2xl p-4" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-3 w-3" style={{ color: "#818CF8" }} />
                        <span className="text-xs font-semibold" style={{ color: "#818CF8" }}>AI Face Prompt</span>
                      </div>
                      <Textarea
                        placeholder="Describe what you want: 'remove acne', 'add freckles', 'age me 10 years'..."
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        className="mb-2 !bg-[#1A1A1A]/20 !border-indigo-500/30 !text-white placeholder:!text-white/85"
                        rows={2}
                      />
                      <button
                        onClick={() => aiPrompt && processWithAI('edit', aiPrompt)}
                        disabled={!aiPrompt || isProcessingAI}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "#fff" }}>
                        {isProcessingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Apply with AI
                      </button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── Tab 3: Body Reshape ── */}
              <TabsContent value="body" className="mt-0">
                <div className="grid lg:grid-cols-2 gap-6">
                  {canvasPreview}
                  <div className="space-y-4">
                    <div className="rounded-2xl p-4 space-y-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-3 w-3" style={{ color: I.text }} />
                          <SectionLabel>Body Reshape</SectionLabel>
                        </div>
                        <AIBadge label="AI" />
                      </div>
                      {([
                        ['legLength','Leg Length',-30,50],
                        ['waistSlim','Waist Slim',0,60],
                        ['shoulderBroad','Shoulder Width',-30,30],
                        ['absDefinition','Abs Definition',0,100],
                        ['armSlim','Arm Slim',0,50],
                      ] as [keyof BodyAdjustments, string, number, number][]).map(([k,l,mn,mx]) => (
                        <SliderRow key={k} label={l} value={bodyAdj[k]} min={mn} max={mx} onChange={v => updateBodyAdj(k,v)} />
                      ))}
                    </div>
                    <button onClick={() => { setBodyAdj({ ...DEFAULT_BODY }); toast.success('Body reset'); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white"
                      style={{ background: "rgba(255,255,255,0.14)", border: `1px solid rgba(255,255,255,0.25)` }}>
                      <RotateCcw className="h-4 w-4" /> Reset Body
                    </button>
                  </div>
                </div>
              </TabsContent>

              {/* ── Tab 4: Hair & Style ── */}
              <TabsContent value="hair" className="mt-0">
                <div className="grid lg:grid-cols-2 gap-6">
                  {canvasPreview}
                  <div className="space-y-4">
                    <div className="rounded-2xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Scissors className="h-3 w-3" style={{ color: I.text }} />
                          <SectionLabel>Hair Style</SectionLabel>
                        </div>
                        <AIBadge label="AI" />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {HAIR_STYLES.map(style => (
                          <button key={style.id} onClick={() => { setSelectedHairStyle(style.id); processWithAI('edit', `Change hair to ${style.name} style`); }}
                            className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs transition-all"
                            style={{
                              background: selectedHairStyle === style.id ? "rgba(184,149,85,0.35)" : "rgba(255,255,255,0.12)",
                              border: `1px solid ${selectedHairStyle === style.id ? "rgba(184,149,85,0.75)" : "rgba(255,255,255,0.25)"}`,
                              color: selectedHairStyle === style.id ? I.text : "rgba(255,255,255,0.9)",
                            }}>
                            <span className="text-xl">{style.icon}</span>
                            <span>{style.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Palette className="h-3 w-3" style={{ color: I.text }} />
                          <SectionLabel>Hair Color</SectionLabel>
                        </div>
                        <AIBadge label="AI" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {HAIR_COLORS.map(hc => (
                          <button key={hc.id} onClick={() => { setSelectedHairColor(hc.id); processWithAI('edit', `Change hair color to ${hc.name}`); }}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-xl text-xs transition-all"
                            style={{
                              background: selectedHairColor === hc.id ? "rgba(184,149,85,0.30)" : "rgba(255,255,255,0.12)",
                              border: `2px solid ${selectedHairColor === hc.id ? I.accent : "rgba(255,255,255,0.28)"}`,
                              color: selectedHairColor === hc.id ? I.text : "rgba(255,255,255,0.9)",
                              minWidth: '52px',
                            }}>
                            <div className="w-6 h-6 rounded-full" style={{ background: hc.color, border: "1px solid rgba(255,255,255,0.2)" }} />
                            <span>{hc.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {isProcessingAI && (
                      <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(184,149,85,0.06)", border: `1px solid ${I.border}` }}>
                        <Loader2 className="h-5 w-5 animate-spin" style={{ color: I.text }} />
                        <p className="text-sm text-white">Applying AI transformation…</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* ── Tab 5: Outfit & Background ── */}
              <TabsContent value="outfit" className="mt-0">
                <div className="grid lg:grid-cols-2 gap-6">
                  {canvasPreview}
                  <div className="space-y-4">
                    {/* Background Remove */}
                    <div className="rounded-2xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-3 w-3" style={{ color: I.text }} />
                          <SectionLabel>Background</SectionLabel>
                        </div>
                        <AIBadge label="AI" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {['Remove BG','White BG','Office BG','City BG','Beach BG','Studio BG'].map(bg => (
                          <button key={bg} onClick={() => processWithAI(bg === 'Remove BG' ? 'remove' : 'generate', bg === 'Remove BG' ? 'Remove background' : `Place in ${bg.replace(' BG','')} background`)}
                            disabled={isProcessingAI}
                            className="px-3 py-2 rounded-xl text-xs font-medium transition-all text-left text-white disabled:opacity-50"
                            style={{ background: "rgba(255,255,255,0.12)", border: `1px solid rgba(255,255,255,0.22)` }}>
                            {bg}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Outfit Change */}
                    <div className="rounded-2xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Shirt className="h-3 w-3" style={{ color: I.text }} />
                          <SectionLabel>Outfit Change</SectionLabel>
                        </div>
                        <AIBadge label="AI" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {['Business Suit','Casual Wear','Formal Dress','Sports Outfit','Luxury Look','Traditional'].map(outfit => (
                          <button key={outfit} onClick={() => processWithAI('change-outfit', outfit)}
                            disabled={isProcessingAI}
                            className="px-3 py-2 rounded-xl text-xs font-medium transition-all text-white disabled:opacity-50"
                            style={{ background: "rgba(255,255,255,0.12)", border: `1px solid rgba(255,255,255,0.22)` }}>
                            {outfit}
                          </button>
                        ))}
                      </div>
                      <button onClick={handleWhitenClothing} disabled={isWhitening}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: "linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)", color: "#1E293B" }}>
                        {isWhitening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shirt className="h-4 w-4" />}
                        Whiten Clothing
                      </button>
                    </div>

                    {/* Object Removal */}
                    <div className="rounded-2xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Eraser className="h-3 w-3" style={{ color: I.text }} />
                          <SectionLabel>Object Removal</SectionLabel>
                        </div>
                        <AIBadge label="AI" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {['Remove People','Remove Objects','Remove Blemish','Remove Watermark'].map(rm => (
                          <button key={rm} onClick={() => processWithAI('edit', rm)}
                            disabled={isProcessingAI}
                            className="px-3 py-2 rounded-xl text-xs font-medium transition-all text-white disabled:opacity-50"
                            style={{ background: "rgba(255,255,255,0.12)", border: `1px solid rgba(255,255,255,0.22)` }}>
                            {rm}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom AI Prompt */}
                    <div className="rounded-2xl p-4" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-3 w-3" style={{ color: "#818CF8" }} />
                        <span className="text-xs font-semibold" style={{ color: "#818CF8" }}>Custom AI Prompt</span>
                      </div>
                      <Textarea
                        placeholder="'Remove background and place me on a beach', 'Change to red suit'..."
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        className="mb-2 !bg-[#1A1A1A]/20 !border-indigo-500/30 !text-white placeholder:!text-white/85"
                        rows={2}
                      />
                      <button
                        onClick={() => aiPrompt && processWithAI('edit', aiPrompt)}
                        disabled={!aiPrompt || isProcessingAI}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "#fff" }}>
                        {isProcessingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        Process with AI
                      </button>
                    </div>

                    <button onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm"
                      style={{ background: I.btnGrad, boxShadow: I.btnShadow }}>
                      <Download className="h-4 w-4" /> Download Result
                    </button>
                  </div>
                </div>
              </TabsContent>

              {/* ── Tab 6: Create (Canva-like) ── */}
              <TabsContent value="create" className="mt-0">
                <div className="grid lg:grid-cols-2 gap-6">
                  {canvasPreview}
                  <div className="space-y-4">
                    {/* Quick Actions */}
                    <div className="rounded-2xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Wand2 className="h-3 w-3" style={{ color: I.text }} />
                        <SectionLabel>Quick Create</SectionLabel>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Instagram Story', prompt: 'Create an Instagram story with this photo, add modern text overlay and design elements' },
                          { label: 'Instagram Post', prompt: 'Create a polished Instagram post with this photo, clean layout with caption area' },
                          { label: 'Photo Grid', prompt: 'Create a 3-photo grid collage using this image with different crops and filters' },
                          { label: 'Social Banner', prompt: 'Create a social media banner/cover using this photo with professional layout' },
                          { label: 'Animate Photo', prompt: 'Add subtle animation effect to this photo - gentle zoom, parallax, or motion blur' },
                          { label: 'Enhance HD', prompt: 'Upscale and enhance this photo to HD quality, sharpen details' },
                        ].map(action => (
                          <button key={action.label}
                            onClick={() => processWithAI('generate', action.prompt)}
                            disabled={isProcessingAI}
                            className="px-3 py-3 rounded-xl text-xs font-medium transition-all text-white text-left disabled:opacity-50"
                            style={{ background: "rgba(255,255,255,0.12)", border: `1px solid rgba(255,255,255,0.22)` }}>
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI Creative Prompt */}
                    <div className="rounded-2xl p-4" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-3 w-3" style={{ color: "#818CF8" }} />
                        <span className="text-xs font-semibold" style={{ color: "#818CF8" }}>Describe what you want to create</span>
                      </div>
                      <Textarea
                        placeholder="'Make this into a luxury real estate ad', 'Create a before/after comparison', 'Add text: OPEN HOUSE'..."
                        value={createPrompt}
                        onChange={e => setCreatePrompt(e.target.value)}
                        className="mb-2 !bg-[#1A1A1A]/20 !border-indigo-500/30 !text-white placeholder:!text-white/85"
                        rows={3}
                      />
                      <button
                        onClick={() => createPrompt && processWithAI('generate', createPrompt)}
                        disabled={!createPrompt || isProcessingAI}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "#fff" }}>
                        {isProcessingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Create with AI
                      </button>
                    </div>

                    {/* Export Formats */}
                    <div className="rounded-2xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Layout className="h-3 w-3" style={{ color: I.text }} />
                        <SectionLabel>Export Format</SectionLabel>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {SHARE_FORMATS.map(f => (
                          <button key={f.id} onClick={() => handleExportFormat(f)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white transition-all"
                            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)" }}>
                            <f.icon className="h-3.5 w-3.5" style={{ color: I.text }} />
                            <span>{f.label}</span>
                            <span style={{ color: I.dim }} className="text-[9px]">{f.w}×{f.h}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── Tab 7: Grid Planner ── */}
              <TabsContent value="grid" className="mt-0">
                <InstagramGridPlanner selectedPreset={selectedPreset} />
              </TabsContent>

              {/* ── Tab 8: Share ── */}
              <TabsContent value="share" className="mt-0">
                <div className="grid lg:grid-cols-2 gap-6">
                  {canvasPreview}
                  <div className="space-y-4">
                    {/* Download & Copy */}
                    <div className="rounded-2xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Download className="h-3 w-3" style={{ color: I.text }} />
                        <SectionLabel>Download & Copy</SectionLabel>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={handleDownload}
                          className="flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm"
                          style={{ background: I.btnGrad, boxShadow: I.btnShadow }}>
                          <Download className="h-4 w-4" /> Download PNG
                        </button>
                        <button onClick={async () => {
                          if (!canvasRef.current) return;
                          try {
                            const blob = await new Promise<Blob | null>(r => canvasRef.current!.toBlob(r, 'image/png'));
                            if (blob) { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); toast.success('Copied to clipboard!'); }
                          } catch { toast.error('Copy failed'); }
                        }}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white"
                          style={{ background: "rgba(255,255,255,0.14)", border: `1px solid rgba(255,255,255,0.25)` }}>
                          <Copy className="h-4 w-4" /> Copy to Clipboard
                        </button>
                      </div>
                    </div>

                    {/* Share */}
                    <div className="rounded-2xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Share2 className="h-3 w-3" style={{ color: I.text }} />
                        <SectionLabel>Share</SectionLabel>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleShare}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-white transition-all"
                          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)" }}>
                          <Share2 className="h-3.5 w-3.5" style={{ color: I.text }} /> Share (Native)
                        </button>
                        <button onClick={() => {
                          if (!canvasRef.current) return;
                          const dataUrl = canvasRef.current.toDataURL('image/png');
                          window.open(`mailto:?subject=Photo from Studio Pro&body=Check out my edited photo`, '_blank');
                          toast.info('Email opened — attach the downloaded image');
                        }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-white transition-all"
                          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)" }}>
                          <Mail className="h-3.5 w-3.5" style={{ color: I.text }} /> Email
                        </button>
                        <button onClick={() => { handleDownload(); toast.info('Download your image, then share on Instagram'); }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-white transition-all"
                          style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)", border: "none" }}>
                          <Instagram className="h-3.5 w-3.5" /> Instagram
                        </button>
                        <button onClick={() => { handleDownload(); toast.info('Download your image, then share on Facebook'); }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-white transition-all"
                          style={{ background: "#1877F2", border: "none" }}>
                          <Facebook className="h-3.5 w-3.5" /> Facebook
                        </button>
                        <button onClick={() => { handleDownload(); toast.info('Download your image, then share on WhatsApp'); }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-white transition-all"
                          style={{ background: "#25D366", border: "none" }}>
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </button>
                        <button onClick={() => { handleDownload(); toast.info('Download your image, then share on X'); }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-white transition-all"
                          style={{ background: "#000", border: "1px solid rgba(255,255,255,0.2)" }}>
                          <Twitter className="h-3.5 w-3.5" /> X / Twitter
                        </button>
                        <button onClick={() => { handleDownload(); toast.info('Download your image, then share on LinkedIn'); }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-white transition-all"
                          style={{ background: "#0077B5", border: "none" }}>
                          <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                        </button>
                        <button onClick={() => { handleDownload(); toast.info('Download your image, then share on Snapchat'); }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-[#1A1A1A] transition-all"
                          style={{ background: "#FFFC00", border: "none" }}>
                          <Camera className="h-3.5 w-3.5" /> Snapchat
                        </button>
                      </div>
                    </div>

                    {/* Platform-optimized Export */}
                    <div className="rounded-2xl p-4" style={{ background: I.surface, border: `1px solid ${I.border}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Layout className="h-3 w-3" style={{ color: I.text }} />
                        <SectionLabel>Platform Export</SectionLabel>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {SHARE_FORMATS.map(f => (
                          <button key={f.id} onClick={() => handleExportFormat(f)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white transition-all"
                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                            <f.icon className="h-3.5 w-3.5" style={{ color: I.text }} />
                            <div>
                              <div>{f.label}</div>
                              <div style={{ color: I.dim }} className="text-[9px]">{f.w}×{f.h}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </ToolContentWrapper>
      </main>
    </div>
  );
}
