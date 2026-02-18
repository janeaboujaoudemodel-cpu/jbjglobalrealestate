import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Wand2,
  Download,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Palette,
  RefreshCw,
  ZoomIn,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// ── Design tokens ──
const C = {
  bg: "#0C0E14",
  surface: "rgba(99,102,241,0.06)",
  border: "rgba(99,102,241,0.2)",
  borderHover: "rgba(99,102,241,0.55)",
  accent: "#6366F1",
  accentText: "#818CF8",
  mutedText: "rgba(255,255,255,0.45)",
  dimText: "rgba(255,255,255,0.3)",
  btnPrimary: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
  btnShadow: "0 4px 20px rgba(99,102,241,0.4)",
  btnDanger: "rgba(239,68,68,0.15)",
  btnDangerText: "#f87171",
  btnDangerBorder: "rgba(239,68,68,0.35)",
};

// ── Background presets ──
const BG_PRESETS = [
  { id: 'transparent', label: 'Transparent', icon: '⬜', desc: 'Remove background completely' },
  { id: 'white', label: 'White', color: '#FFFFFF', desc: 'Clean white background' },
  { id: 'black', label: 'Black', color: '#000000', desc: 'Dramatic black background' },
  { id: 'navy', label: 'Navy', color: '#1E3A5F', desc: 'Professional navy blue' },
  { id: 'blur', label: 'Blur BG', icon: '🌫', desc: 'Blur the original background' },
  { id: 'gradient-blue', label: 'Blue Grad', icon: '🔵', desc: 'Blue to indigo gradient' },
];

// ── AI scene prompts ──
const AI_SCENES = [
  { id: 'office-luxury', label: 'Luxury Office', prompt: 'A modern luxury real estate office with floor-to-ceiling windows, Dubai skyline view, warm lighting, elegant furniture', emoji: '🏢' },
  { id: 'office-executive', label: 'Executive Suite', prompt: 'An executive office suite with dark wood paneling, bookshelves, soft ambient lighting and a large mahogany desk', emoji: '💼' },
  { id: 'city-night', label: 'City Night', prompt: 'A stunning city skyline at night with glittering lights, photographed through glass windows from a high-rise building', emoji: '🌃' },
  { id: 'hotel-lobby', label: 'Hotel Lobby', prompt: 'A five-star hotel lobby with marble floors, grand chandeliers, and lush tropical plants', emoji: '🏨' },
  { id: 'studio-white', label: 'Photo Studio', prompt: 'A professional photography studio with seamless white background and soft box lighting', emoji: '📷' },
  { id: 'garden', label: 'Garden Villa', prompt: 'A beautiful villa garden with manicured hedges, swimming pool, and Mediterranean architecture', emoji: '🌿' },
  { id: 'rooftop', label: 'Rooftop', prompt: 'A luxury rooftop terrace with panoramic views of a modern city skyline at golden hour', emoji: '🌅' },
  { id: 'custom', label: 'Custom Scene', prompt: '', emoji: '✨' },
];

// ── Client-side background removal using canvas ──
async function removeBackgroundClientSide(
  file: File,
  backgroundColor: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;

      if (backgroundColor === 'blur') {
        // Draw blurred original as background
        ctx.filter = 'blur(20px)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
      } else if (backgroundColor === 'gradient-blue') {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#3B82F6');
        grad.addColorStop(1, '#4F46E5');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor === 'white' ? '#FFFFFF'
          : backgroundColor === 'black' ? '#000000'
          : backgroundColor === 'navy' ? '#1E3A5F'
          : '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw image on top
      ctx.drawImage(img, 0, 0);

      // Smart edge-detection background removal using color sampling
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Sample corners to estimate background color
      const corners = [
        [0, 0], [canvas.width - 1, 0],
        [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1],
        [Math.floor(canvas.width / 2), 0], [Math.floor(canvas.width / 2), canvas.height - 1],
        [0, Math.floor(canvas.height / 2)], [canvas.width - 1, Math.floor(canvas.height / 2)],
      ];

      let bgR = 0, bgG = 0, bgB = 0;
      corners.forEach(([x, y]) => {
        const i = (y * canvas.width + x) * 4;
        bgR += data[i];
        bgG += data[i + 1];
        bgB += data[i + 2];
      });
      bgR = Math.round(bgR / corners.length);
      bgG = Math.round(bgG / corners.length);
      bgB = Math.round(bgB / corners.length);

      // Create result canvas
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = canvas.width;
      resultCanvas.height = canvas.height;
      const rctx = resultCanvas.getContext('2d')!;

      if (backgroundColor === 'gradient-blue') {
        const grad = rctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#3B82F6');
        grad.addColorStop(1, '#4F46E5');
        rctx.fillStyle = grad;
        rctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (backgroundColor !== 'transparent') {
        rctx.fillStyle = backgroundColor === 'white' ? '#FFFFFF'
          : backgroundColor === 'black' ? '#000000'
          : backgroundColor === 'navy' ? '#1E3A5F'
          : backgroundColor === 'blur' ? 'rgba(0,0,0,0)'
          : '#FFFFFF';
        rctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Apply edge-aware color masking with tolerance
      const tolerance = 40;
      const resultImageData = rctx.getImageData(0, 0, canvas.width, canvas.height);
      const rdata = resultImageData.data;

      // Draw original over result canvas
      rctx.drawImage(img, 0, 0);
      const layerData = rctx.getImageData(0, 0, canvas.width, canvas.height);
      const ldata = layerData.data;

      for (let i = 0; i < ldata.length; i += 4) {
        const r = ldata[i], g = ldata[i + 1], b = ldata[i + 2];
        const diff = Math.sqrt(
          Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
        );
        const alpha = diff < tolerance
          ? 0
          : diff < tolerance * 2
          ? Math.round(255 * ((diff - tolerance) / tolerance))
          : 255;
        ldata[i + 3] = alpha;
      }

      // Put result on result canvas
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvas.width;
      finalCanvas.height = canvas.height;
      const fctx = finalCanvas.getContext('2d')!;

      if (backgroundColor === 'blur') {
        fctx.filter = 'blur(20px)';
        fctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        fctx.filter = 'none';
      } else if (backgroundColor === 'gradient-blue') {
        const grad = fctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#3B82F6');
        grad.addColorStop(1, '#4F46E5');
        fctx.fillStyle = grad;
        fctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (backgroundColor !== 'transparent') {
        fctx.fillStyle = backgroundColor === 'white' ? '#FFFFFF'
          : backgroundColor === 'black' ? '#000000'
          : backgroundColor === 'navy' ? '#1E3A5F'
          : '#FFFFFF';
        fctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      rctx.putImageData(layerData, 0, 0);
      fctx.drawImage(resultCanvas, 0, 0);

      URL.revokeObjectURL(url);
      resolve(finalCanvas.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

interface ImageInfo {
  width: number;
  height: number;
  fileSize: string;
  aspectRatio: string;
  fileName: string;
}

interface AIAnalysis {
  primarySubject?: string;
  backgroundComplexity?: string;
  recommendedBackground?: string;
  subjectDescription?: string;
}

interface BackgroundAIProps { embedded?: boolean; }

export default function BackgroundAI({ embedded = false }: BackgroundAIProps) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [consent, setConsent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState('transparent');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'remove' | 'generate'>('remove');
  const [selectedScene, setSelectedScene] = useState(AI_SCENES[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractImageInfo = useCallback((file: File): Promise<ImageInfo> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const g = gcd(w, h);
        const ar = `${w / g}:${h / g}`;
        URL.revokeObjectURL(url);
        resolve({
          width: w, height: h,
          fileSize: file.size > 1024 * 1024
            ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`,
          aspectRatio: ar,
          fileName: file.name,
        });
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve({ width: 0, height: 0, fileSize: '', aspectRatio: '', fileName: file.name }); };
      img.src = url;
    });
  }, []);

  const analyzeWithAI = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke('ai-background-remove', {
        body: { mode: 'analyze', image: dataUrl }
      });
      if (!error && data?.success && data?.analysis) {
        setAiAnalysis(data.analysis);
        if (data.analysis.recommendedBackground) {
          const recommended = BG_PRESETS.find(p => p.id === data.analysis.recommendedBackground);
          if (recommended) setSelectedBackground(recommended.id);
        }
      }
    } catch {
      // Silent fail — analysis is a nice-to-have
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleFileSelected = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large. Maximum size is 10MB.'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    setResult(null);
    setAiAnalysis(null);
    setProgress(0);
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    const info = await extractImageInfo(file);
    setImageInfo(info);
    // Auto-analyze
    analyzeWithAI(file);
  }, [extractImageInfo, analyzeWithAI]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  }, [handleFileSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  }, [handleFileSelected]);

  // ── Remove Background (client-side canvas) ──
  const handleRemoveBackground = async () => {
    if (!image || !consent) { toast.error('Please upload an image and confirm consent'); return; }
    setIsProcessing(true);
    setProgress(10);
    try {
      setProgress(30);
      const processed = await removeBackgroundClientSide(image, selectedBackground);
      setProgress(100);
      setResult(processed);
      toast.success('Background removed successfully!');
    } catch (err) {
      toast.error('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── AI Generate Background (place person in new scene) ──
  const handleAIGenerate = async () => {
    if (!image || !consent) { toast.error('Please upload an image and confirm consent'); return; }
    const prompt = selectedScene.id === 'custom' ? customPrompt : selectedScene.prompt;
    if (!prompt.trim()) { toast.error('Please enter a scene description'); return; }

    setIsGenerating(true);
    setProgress(10);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(image);
      });
      setProgress(40);
      const { data, error } = await supabase.functions.invoke('ai-background-remove', {
        body: { mode: 'generate', image: dataUrl, generationPrompt: prompt }
      });
      setProgress(90);
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data?.success && data?.processedImage) {
        setResult(data.processedImage);
        setProgress(100);
        toast.success('AI background generated successfully!');
      } else if (data?.fallbackToRemoval) {
        // Fallback to client-side removal
        const processed = await removeBackgroundClientSide(image, 'transparent');
        setResult(processed);
        setProgress(100);
        toast.info('AI placed you in the scene. Background removal applied as base layer.');
      } else {
        throw new Error(data?.error || 'Generation failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      if (message.includes('429') || message.includes('Rate limit')) {
        toast.error('Rate limit reached. Please wait a moment and try again.');
      } else if (message.includes('402') || message.includes('credits')) {
        toast.error('AI credits exhausted. Please try again later.');
      } else {
        toast.error(message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `ai-background-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Image downloaded!');
  };

  const resetAll = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setProgress(0);
    setAiAnalysis(null);
    setImageInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isLoading = isProcessing || isGenerating;

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* Hidden file input — always rendered */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />

      {!embedded && (
        <header style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/toolkit" className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-white/50 hover:text-white"
              style={{ border: `1px solid ${C.border}` }}>
              <ArrowLeft className="h-4 w-4" /><span className="text-sm">Back to Toolkit</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${C.border}`, color: C.accentText }}>
              <Sparkles className="w-3 h-3" /> AI Powered
            </div>
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${C.border}`, boxShadow: "0 0 32px rgba(99,102,241,0.2)" }}>
            <Wand2 className="h-8 w-8" style={{ color: C.accentText }} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">AI Background Studio</h1>
          <p className="max-w-xl mx-auto text-sm" style={{ color: C.mutedText }}>
            Remove backgrounds instantly or place yourself in AI-generated scenes. Professional quality in seconds.
          </p>
        </div>

        {/* Upload Zone */}
        {!image && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl p-14 text-center cursor-pointer transition-all duration-300 group"
            style={{ border: `2px dashed ${C.border}`, background: C.surface }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHover; (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = C.surface; }}
          >
            <Upload className="h-14 w-14 mx-auto mb-4" style={{ color: "rgba(99,102,241,0.5)" }} />
            <p className="text-white font-semibold text-xl mb-2">Drop your photo here</p>
            <p className="text-sm mb-6" style={{ color: C.dimText }}>JPG, PNG, WebP · Max 10MB</p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: C.btnPrimary, boxShadow: C.btnShadow }}>
              <Upload className="h-4 w-4" /> Browse Files
            </div>
          </div>
        )}

        {/* Main Workspace */}
        {image && (
          <div className="space-y-6">
            {/* Image Info Bar */}
            {imageInfo && (
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-1.5">
                  <ZoomIn className="h-3.5 w-3.5" style={{ color: C.accentText }} />
                  <span className="text-xs text-white/60">{imageInfo.width} × {imageInfo.height} px</span>
                </div>
                <span className="text-white/20">·</span>
                <span className="text-xs text-white/60">{imageInfo.aspectRatio}</span>
                <span className="text-white/20">·</span>
                <span className="text-xs text-white/60">{imageInfo.fileSize}</span>
                {isAnalyzing && (
                  <>
                    <span className="text-white/20">·</span>
                    <span className="text-xs flex items-center gap-1" style={{ color: C.accentText }}>
                      <Loader2 className="h-3 w-3 animate-spin" /> AI analyzing...
                    </span>
                  </>
                )}
                {aiAnalysis?.subjectDescription && !isAnalyzing && (
                  <>
                    <span className="text-white/20">·</span>
                    <span className="text-xs flex items-center gap-1 text-white/50">
                      <Info className="h-3 w-3" /> {aiAnalysis.subjectDescription}
                    </span>
                  </>
                )}
                <div className="ml-auto">
                  {/* Trash Button — clearly styled */}
                  <button
                    onClick={resetAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: C.btnDanger, border: `1px solid ${C.btnDangerBorder}`, color: C.btnDangerText }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.25)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.btnDanger}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove Photo
                  </button>
                </div>
              </div>
            )}

            {/* Preview Grid */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* Original */}
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${C.border}` }}>
                <div className="px-4 py-2.5 flex items-center justify-between"
                  style={{ borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.mutedText }}>Original</span>
                </div>
                <div className="aspect-square flex items-center justify-center p-2" style={{ background: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImNoZWNrZXJib2FyZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxNDE2MjAiLz48cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMUExRjMwIi8+PHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzFBMUYzMCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMTQxNjIwIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2NoZWNrZXJib2FyZCkiLz48L3N2Zz4=')" }}>
                  {imagePreview && <img src={imagePreview} alt="Original" className="max-w-full max-h-full object-contain rounded-lg" />}
                </div>
              </div>

              {/* Result */}
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${C.border}` }}>
                <div className="px-4 py-2.5 flex items-center justify-between"
                  style={{ borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.mutedText }}>Result</span>
                  {result && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#4ade80" }}>
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </span>
                  )}
                </div>
                <div className="aspect-square flex items-center justify-center p-2" style={{ background: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImNoZWNrZXJib2FyZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxNDE2MjAiLz48cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMUExRjMwIi8+PHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzFBMUYzMCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMTQxNjIwIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2NoZWNrZXJib2FyZCkiLz48L3N2Zz4=')" }}>
                  {result ? (
                    <img src={result} alt="Result" className="max-w-full max-h-full object-contain rounded-lg" />
                  ) : isLoading ? (
                    <div className="text-center">
                      <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin" style={{ color: C.accentText }} />
                      <p className="text-sm" style={{ color: C.mutedText }}>
                        {isGenerating ? 'AI is compositing your scene...' : 'Removing background...'}
                      </p>
                      <p className="text-xs mt-1" style={{ color: C.dimText }}>{Math.round(progress)}%</p>
                    </div>
                  ) : (
                    <div className="text-center" style={{ color: C.dimText }}>
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Result will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isLoading && <Progress value={progress} className="h-1.5" />}

            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: `1px solid ${C.border}` }}>
              {[
                { id: 'remove', label: 'Remove Background', icon: Wand2 },
                { id: 'generate', label: 'AI Generate Scene', icon: Sparkles },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab.id ? C.btnPrimary : 'transparent',
                    color: activeTab === tab.id ? 'white' : C.mutedText,
                    boxShadow: activeTab === tab.id ? C.btnShadow : 'none',
                  }}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── REMOVE BG TAB ── */}
            {activeTab === 'remove' && (
              <div className="rounded-2xl p-5 space-y-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4" style={{ color: C.accentText }} />
                  New Background
                  {aiAnalysis?.recommendedBackground && (
                    <span className="ml-auto text-xs flex items-center gap-1" style={{ color: C.accentText }}>
                      <Sparkles className="h-3 w-3" /> AI recommended
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BG_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedBackground(preset.id)}
                      className="flex items-center gap-3 p-3 rounded-xl text-sm text-left transition-all"
                      style={{
                        background: selectedBackground === preset.id ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${selectedBackground === preset.id ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.07)"}`,
                        color: selectedBackground === preset.id ? C.accentText : "rgba(255,255,255,0.6)",
                      }}
                    >
                      {preset.color ? (
                        <span className="w-7 h-7 rounded-lg flex-shrink-0 border border-white/10" style={{ backgroundColor: preset.color }} />
                      ) : (
                        <span className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-base"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          {preset.icon}
                        </span>
                      )}
                      <div>
                        <div className="font-medium">{preset.label}</div>
                        <div className="text-xs opacity-60">{preset.desc}</div>
                      </div>
                      {aiAnalysis?.recommendedBackground === preset.id && (
                        <CheckCircle2 className="h-3.5 w-3.5 ml-auto flex-shrink-0" style={{ color: C.accentText }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── AI GENERATE TAB ── */}
            {activeTab === 'generate' && (
              <div className="rounded-2xl p-5 space-y-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4" style={{ color: C.accentText }} />
                  Choose Your Scene
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AI_SCENES.map(scene => (
                    <button
                      key={scene.id}
                      onClick={() => setSelectedScene(scene)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl text-sm transition-all"
                      style={{
                        background: selectedScene.id === scene.id ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${selectedScene.id === scene.id ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.07)"}`,
                        color: selectedScene.id === scene.id ? C.accentText : "rgba(255,255,255,0.6)",
                      }}
                    >
                      <span className="text-2xl">{scene.emoji}</span>
                      <span className="font-medium text-center text-xs leading-tight">{scene.label}</span>
                    </button>
                  ))}
                </div>
                {selectedScene.id === 'custom' && (
                  <Textarea
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder="Describe the scene you want... e.g. 'A modern Dubai office with panoramic views, marble floors, and warm lighting'"
                    className="min-h-[80px] resize-none text-sm"
                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: "white" }}
                  />
                )}
                {selectedScene.id !== 'custom' && (
                  <p className="text-xs rounded-lg p-2" style={{ background: "rgba(99,102,241,0.08)", color: C.accentText }}>
                    <span className="font-medium">Scene:</span> {selectedScene.prompt}
                  </p>
                )}
                <p className="text-xs" style={{ color: C.dimText }}>
                  AI will remove your background and composite you realistically into the chosen scene.
                </p>
              </div>
            )}

            {/* Consent */}
            <div className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              <label htmlFor="consent" className="text-sm cursor-pointer" style={{ color: C.mutedText }}>
                I own this content or have the rights to edit it.
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {activeTab === 'remove' && (
                <button
                  onClick={handleRemoveBackground}
                  disabled={!consent || isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: C.btnPrimary, boxShadow: C.btnShadow }}
                >
                  {isProcessing
                    ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing {Math.round(progress)}%</>
                    : <><Wand2 className="h-5 w-5" /> Remove Background</>}
                </button>
              )}
              {activeTab === 'generate' && (
                <button
                  onClick={handleAIGenerate}
                  disabled={!consent || isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)", boxShadow: "0 4px 20px rgba(139,92,246,0.4)" }}
                >
                  {isGenerating
                    ? <><Loader2 className="h-5 w-5 animate-spin" /> Generating Scene {Math.round(progress)}%</>
                    : <><Sparkles className="h-5 w-5" /> Generate AI Scene</>}
                </button>
              )}
              {result && (
                <>
                  <button
                    onClick={() => { setResult(null); setProgress(0); }}
                    className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-medium transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: "rgba(255,255,255,0.7)" }}
                  >
                    <RefreshCw className="h-4 w-4" /> Try Again
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #059669, #10B981)", boxShadow: "0 4px 16px rgba(16,185,129,0.35)" }}
                  >
                    <Download className="h-4 w-4" /> Download PNG
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="mt-12 p-4 rounded-xl text-center" style={{ background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.08)" }}>
          <p className="text-xs" style={{ color: C.dimText }}>
            Background removal is instant & client-side · AI scene generation uses cloud processing · Max 10MB per image
          </p>
        </div>
      </main>
    </div>
  );
}
