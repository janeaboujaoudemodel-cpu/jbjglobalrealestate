import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SaveProjectBar, ToolContentWrapper } from '@/components/toolkit/SaveProjectBar';
import {
  ArrowLeft,
  Upload,
  Wand2,
  Download,
  Loader2,
  Image as ImageIcon,
  Video,
  Trash2,
  Sparkles,
  Palette,
  RefreshCw,
  ZoomIn,
  Info,
  CheckCircle2,
  Play,
  Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// ── Design tokens (Champagne-Gold on dark canvas) ──
const C = {
  bg: "#0D0C08",
  surface: "rgba(184,148,62,0.06)",
  border: "rgba(184,148,62,0.2)",
  borderHover: "rgba(184,148,62,0.55)",
  accent: "#B8943E",
  accentText: "#D4AF37",
  mutedText: "rgba(255,255,255,0.45)",
  dimText: "rgba(255,255,255,0.3)",
  btnPrimary: "linear-gradient(135deg, #B8943E 0%, #9A7B2F 100%)",
  btnShadow: "0 4px 20px rgba(184,148,62,0.3)",
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
  { id: 'gray', label: 'Gray', color: '#6B7280', desc: 'Neutral gray background' },
  { id: 'gradient-blue', label: 'Blue Grad', icon: '🔵', desc: 'Blue to indigo gradient' },
];

// ── AI scene prompts ──
const AI_SCENES = [
  { id: 'office-luxury', label: 'Luxury Office', prompt: 'A modern luxury real estate office with floor-to-ceiling windows, Dubai skyline view, warm lighting, elegant furniture', emoji: '' },
  { id: 'office-executive', label: 'Executive Suite', prompt: 'An executive office suite with dark wood paneling, bookshelves, soft ambient lighting and a large mahogany desk', emoji: '' },
  { id: 'city-night', label: 'City Night', prompt: 'A stunning city skyline at night with glittering lights, photographed through glass windows from a high-rise building', emoji: '' },
  { id: 'hotel-lobby', label: 'Hotel Lobby', prompt: 'A five-star hotel lobby with marble floors, grand chandeliers, and lush tropical plants', emoji: '' },
  { id: 'studio-white', label: 'Photo Studio', prompt: 'A professional photography studio with seamless white background and soft box lighting', emoji: '' },
  { id: 'garden', label: 'Garden Villa', prompt: 'A beautiful villa garden with manicured hedges, swimming pool, and Mediterranean architecture', emoji: '' },
  { id: 'rooftop', label: 'Rooftop', prompt: 'A luxury rooftop terrace with panoramic views of a modern city skyline at golden hour', emoji: '' },
  { id: 'custom', label: 'Custom Scene', prompt: '', emoji: '' },
];

// ─────────────────────────────────────────────────────────────────────────────
// AI-guided background removal (primary) + flood-fill fallback
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AI-guided adaptive BFS flood-fill.
 * Uses AI edge-function guidance (bgColorApprox, recommendedTolerance, hasFineDetails)
 * to calibrate the removal algorithm precisely rather than blind border-sampling.
 */
async function removeBackgroundAIGuided(
  file: File,
  guidance?: { bgColorApprox?: string; recommendedTolerance?: number; hasFineDetails?: boolean }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const W = img.naturalWidth;
      const H = img.naturalHeight;

      // Work at reduced resolution for processing
      const MAX_DIM = 1200;
      const scale = Math.min(1, MAX_DIM / Math.max(W, H));
      const CW = Math.round(W * scale);
      const CH = Math.round(H * scale);

      const canvas = document.createElement('canvas');
      canvas.width = CW;
      canvas.height = CH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, CW, CH);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, CW, CH);
      const data = imageData.data;

      const idx = (x: number, y: number) => (y * CW + x) * 4;

      // ── Build background color model ──
      // Use AI-provided color if available, otherwise sample border pixels
      let mean = [255, 255, 255];
      let BASE_TOLERANCE = guidance?.recommendedTolerance ?? 40;

      if (guidance?.bgColorApprox) {
        // Parse hex color from AI guidance
        const hex = guidance.bgColorApprox.replace('#', '');
        if (hex.length === 6) {
          mean = [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16),
          ];
        }
      } else {
        // Fallback: sample border pixels
        const borderSamples: number[][] = [];
        const sampleStep = Math.max(1, Math.floor(Math.min(CW, CH) / 40));
        for (let x = 0; x < CW; x += sampleStep) {
          const t = idx(x, 0); borderSamples.push([data[t], data[t+1], data[t+2]]);
          const b = idx(x, CH-1); borderSamples.push([data[b], data[b+1], data[b+2]]);
        }
        for (let y = 0; y < CH; y += sampleStep) {
          const l = idx(0, y); borderSamples.push([data[l], data[l+1], data[l+2]]);
          const r = idx(CW-1, y); borderSamples.push([data[r], data[r+1], data[r+2]]);
        }
        const n = borderSamples.length;
        mean = [0, 0, 0];
        for (const s of borderSamples) { mean[0] += s[0]; mean[1] += s[1]; mean[2] += s[2]; }
        mean[0] /= n; mean[1] /= n; mean[2] /= n;
        let variance = 0;
        for (const s of borderSamples) {
          variance += (s[0]-mean[0])**2 + (s[1]-mean[1])**2 + (s[2]-mean[2])**2;
        }
        variance /= n;
        const bgStdDev = Math.sqrt(variance);
        BASE_TOLERANCE = Math.min(65, Math.max(25, bgStdDev * 2.5 + 20));
      }

      const distToBg = (pi: number) => {
        const dr = data[pi] - mean[0];
        const dg = data[pi+1] - mean[1];
        const db = data[pi+2] - mean[2];
        return Math.sqrt(dr*dr + dg*dg + db*db);
      };

      const distPixels = (i: number, j: number) => {
        const dr = data[i] - data[j];
        const dg = data[i+1] - data[j+1];
        const db = data[i+2] - data[j+2];
        return Math.sqrt(dr*dr + dg*dg + db*db);
      };

      // ── Multi-pass BFS flood-fill guided by AI tolerance ──
      const PASSES = [BASE_TOLERANCE, BASE_TOLERANCE * 0.75];
      const isBg = new Uint8Array(CW * CH);

      for (const TOLERANCE of PASSES) {
        const visited = new Uint8Array(CW * CH);
        const queue: number[] = [];

        for (let x = 0; x < CW; x++) {
          const ti = idx(x, 0) / 4; const bi = idx(x, CH-1) / 4;
          if (!visited[ti]) { visited[ti] = 1; queue.push(ti * 4); }
          if (!visited[bi]) { visited[bi] = 1; queue.push(bi * 4); }
        }
        for (let y = 1; y < CH-1; y++) {
          const li = idx(0, y) / 4; const ri = idx(CW-1, y) / 4;
          if (!visited[li]) { visited[li] = 1; queue.push(li * 4); }
          if (!visited[ri]) { visited[ri] = 1; queue.push(ri * 4); }
        }

        const DIRS = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
        let head = 0;
        while (head < queue.length) {
          const pi = queue[head++];
          const pFlat = pi / 4;
          const px = pFlat % CW;
          const py = Math.floor(pFlat / CW);

          for (const [dx, dy] of DIRS) {
            const nx = px + dx, ny = py + dy;
            if (nx < 0 || nx >= CW || ny < 0 || ny >= CH) continue;
            const ni = idx(nx, ny);
            const nFlat = ni / 4;
            if (visited[nFlat]) continue;

            const localSimilar = distPixels(pi, ni) <= TOLERANCE;
            const bgSimilar = distToBg(ni) <= BASE_TOLERANCE * 1.15;

            if (localSimilar && bgSimilar) {
              visited[nFlat] = 1;
              isBg[nFlat] = 1;
              queue.push(ni);
            }
          }
        }
        for (let i = 0; i < CW * CH; i++) { if (visited[i]) isBg[i] = 1; }
      }

      const mask = new Uint8Array(CW * CH);
      for (let i = 0; i < CW * CH; i++) { mask[i] = isBg[i] === 1 ? 0 : 255; }

      // ── Morphological close (dilate + erode) ──
      const morphOp = (src: Uint8Array, r: number, isMax: boolean) => {
        const out = new Uint8Array(src.length);
        const tmp = new Uint8Array(src.length);
        for (let y = 0; y < CH; y++) {
          for (let x = 0; x < CW; x++) {
            let v = isMax ? 0 : 255;
            for (let dx = -r; dx <= r; dx++) { const nx = x + dx; if (nx >= 0 && nx < CW) v = isMax ? Math.max(v, src[y*CW+nx]) : Math.min(v, src[y*CW+nx]); }
            tmp[y*CW+x] = v;
          }
        }
        for (let x = 0; x < CW; x++) {
          for (let y = 0; y < CH; y++) {
            let v = isMax ? 0 : 255;
            for (let dy = -r; dy <= r; dy++) { const ny = y + dy; if (ny >= 0 && ny < CH) v = isMax ? Math.max(v, tmp[ny*CW+x]) : Math.min(v, tmp[ny*CW+x]); }
            out[y*CW+x] = v;
          }
        }
        return out;
      };

      // For fine details (hair/fur), use smaller morph radius to preserve edges
      const morphR = guidance?.hasFineDetails ? 2 : 3;
      let refinedMask = morphOp(mask, morphR, true);
      refinedMask = morphOp(refinedMask, morphR - 1, false);

      // ── Edge feathering ──
      const feather = (src: Uint8Array, r: number): Float32Array => {
        const tmp = new Float32Array(src.length);
        const out = new Float32Array(src.length);
        for (let y = 0; y < CH; y++) {
          let sum = 0, cnt = 0;
          for (let x = 0; x < r; x++) { sum += src[y*CW+x]; cnt++; }
          for (let x = 0; x < CW; x++) {
            if (x+r < CW) { sum += src[y*CW+x+r]; cnt++; }
            if (x-r-1 >= 0) { sum -= src[y*CW+x-r-1]; cnt--; }
            tmp[y*CW+x] = sum / cnt;
          }
        }
        for (let x = 0; x < CW; x++) {
          let sum = 0, cnt = 0;
          for (let y = 0; y < r; y++) { sum += tmp[y*CW+x]; cnt++; }
          for (let y = 0; y < CH; y++) {
            if (y+r < CH) { sum += tmp[(y+r)*CW+x]; cnt++; }
            if (y-r-1 >= 0) { sum -= tmp[(y-r-1)*CW+x]; cnt--; }
            out[y*CW+x] = sum / cnt;
          }
        }
        return out;
      };

      // Tighter feather for fine details to preserve hair/fur
      const featherR = guidance?.hasFineDetails ? 2 : 3;
      const feathered = feather(refinedMask, featherR);

      // ── Apply mask at original resolution ──
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = W;
      resultCanvas.height = H;
      const rctx = resultCanvas.getContext('2d')!;
      rctx.drawImage(img, 0, 0, W, H);
      const resultData = rctx.getImageData(0, 0, W, H);
      const rd = resultData.data;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const mx = (x / W) * (CW - 1);
          const my = (y / H) * (CH - 1);
          const mx0 = Math.floor(mx), mx1 = Math.min(mx0+1, CW-1);
          const my0 = Math.floor(my), my1 = Math.min(my0+1, CH-1);
          const fx = mx - mx0, fy = my - my0;
          const alpha =
            feathered[my0*CW+mx0] * (1-fx) * (1-fy) +
            feathered[my0*CW+mx1] * fx * (1-fy) +
            feathered[my1*CW+mx0] * (1-fx) * fy +
            feathered[my1*CW+mx1] * fx * fy;
          rd[(y*W+x)*4+3] = Math.min(255, Math.max(0, Math.round(alpha)));
        }
      }

      rctx.putImageData(resultData, 0, 0);
      resolve(resultCanvas.toDataURL('image/png'));
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}


// This NEVER re-runs removal — it just composites the transparent image over a color/gradient
// ─────────────────────────────────────────────────────────────────────────────
async function applyBackground(transparentDataUrl: string, backgroundId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const W = img.naturalWidth;
      const H = img.naturalHeight;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      if (backgroundId === 'transparent') {
        // Just return the transparent image as-is
        ctx.drawImage(img, 0, 0);
      } else if (backgroundId === 'white') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0);
      } else if (backgroundId === 'black') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0);
      } else if (backgroundId === 'navy') {
        ctx.fillStyle = '#1E3A5F';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0);
      } else if (backgroundId === 'gray') {
        ctx.fillStyle = '#6B7280';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0);
      } else if (backgroundId === 'gradient-blue') {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#3B82F6');
        grad.addColorStop(1, '#4F46E5');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0);
      } else {
        // Default: transparent
        ctx.drawImage(img, 0, 0);
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to composite image'));
    img.src = transparentDataUrl;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

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
  const [projectName, setProjectName] = useState('Background AI Project');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [consent, setConsent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');

  // Separated state: transparent cutout (cached) vs final display (with background applied)
  const [transparentResult, setTransparentResult] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [selectedBackground, setSelectedBackground] = useState('transparent');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'remove' | 'generate' | 'video'>('remove');
  const [selectedScene, setSelectedScene] = useState(AI_SCENES[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Video BG removal state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoProgressLabel, setVideoProgressLabel] = useState('');
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const [videoBackground, setVideoBackground] = useState('transparent');

  // When background preset changes and we already have a transparent cutout, instantly composite
  useEffect(() => {
    if (!transparentResult) return;
    applyBackground(transparentResult, selectedBackground).then(setResult).catch(() => {});
  }, [selectedBackground, transparentResult]);

  const extractImageInfo = useCallback((file: File): Promise<ImageInfo> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const g = gcd(w, h);
        URL.revokeObjectURL(url);
        resolve({
          width: w, height: h,
          fileSize: file.size > 1024 * 1024
            ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`,
          aspectRatio: `${w / g}:${h / g}`,
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
    setTransparentResult(null);
    setResult(null);
    setAiAnalysis(null);
    setProgress(0);
    setProgressLabel('');
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    const info = await extractImageInfo(file);
    setImageInfo(info);
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

  // Helper: resize image to max dimension for AI API (keeps under payload limits)
  const resizeImageForAI = (file: File, maxDim = 1024): Promise<string> => {
    return new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d')!.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('resize failed')); };
      img.src = url;
    });
  };

  // ── Remove Background: AI-powered via edge function, flood-fill fallback ──
  const handleRemoveBackground = async () => {
    if (!image || !consent) { toast.error('Please upload an image and confirm consent'); return; }
    setIsProcessing(true);
    setProgress(5);
    setProgressLabel('Preparing image...');
    try {
      // Step 1: Convert image to data URL for the AI edge function
      setProgress(10);
      setProgressLabel('Uploading to AI...');
      const resizedDataUrl = await resizeImageForAI(image, 1536);

      // Step 2: Call AI-powered background removal
      setProgress(25);
      setProgressLabel('AI removing background...');
      const { data, error } = await supabase.functions.invoke('ai-background-remove', {
        body: { mode: 'remove', image: resizedDataUrl }
      });

      if (error) throw new Error(error.message);

      if (data?.success && data?.processedImage) {
        // AI removal succeeded — use the returned image directly
        setProgress(85);
        setProgressLabel('Applying background...');
        setTransparentResult(data.processedImage);
        const composited = await applyBackground(data.processedImage, selectedBackground);
        setResult(composited);
        setProgress(100);
        setProgressLabel('Done!');
        toast.success('AI background removal complete!');
      } else if (data?.fallbackToClientSide) {
        // AI failed — fall back to client-side flood-fill
        console.warn('AI removal unavailable, falling back to client-side:', data?.reason);
        setProgress(35);
        setProgressLabel('Falling back to smart detection...');

        // Get guidance from the analysis function
        let guidance: { bgColorApprox?: string; recommendedTolerance?: number; hasFineDetails?: boolean } | undefined;
        try {
          const base64 = resizedDataUrl.split(',')[1];
          const mimeType = resizedDataUrl.split(';')[0].split(':')[1];
          const { data: guideData } = await supabase.functions.invoke('remove-background', {
            body: { image_base64: base64, image_type: mimeType }
          });
          if (guideData?.success && guideData?.guidance) guidance = guideData.guidance;
        } catch { /* proceed without guidance */ }

        setProgress(50);
        setProgressLabel(guidance ? 'AI-guided background removal...' : 'Running smart background detection...');
        const transparent = await removeBackgroundAIGuided(image, guidance);
        setProgress(85);
        setProgressLabel('Applying background...');
        setTransparentResult(transparent);
        const composited = await applyBackground(transparent, selectedBackground);
        setResult(composited);
        setProgress(100);
        setProgressLabel('Done!');
        toast.success('Background removed!');
      } else {
        throw new Error(data?.error || 'Background removal failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process image';
      if (message.includes('429') || message.includes('Rate limit')) {
        toast.error('Rate limit reached. Please wait a moment and try again.');
      } else if (message.includes('402') || message.includes('credits')) {
        toast.error('AI credits exhausted. Please try again later.');
      } else {
        toast.error(message);
      }
      console.error(err);
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
    setProgressLabel('Sending to AI...');
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(image);
      });
      setProgress(30);
      setProgressLabel('AI compositing scene...');
      const { data, error } = await supabase.functions.invoke('ai-background-remove', {
        body: { mode: 'generate', image: dataUrl, generationPrompt: prompt }
      });
      setProgress(85);
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data?.success && data?.processedImage) {
        setTransparentResult(null);
        setResult(data.processedImage);
        setProgress(100);
        setProgressLabel('Done!');
        toast.success('AI background generated successfully!');
      } else if (data?.fallbackToRemoval) {
        // Scene generation failed — try AI removal instead
        setProgress(50);
        setProgressLabel('Falling back to AI background removal...');
        const { data: removeData } = await supabase.functions.invoke('ai-background-remove', {
          body: { mode: 'remove', image: dataUrl }
        });
        if (removeData?.success && removeData?.processedImage) {
          setTransparentResult(removeData.processedImage);
          const composited = await applyBackground(removeData.processedImage, 'transparent');
          setResult(composited);
        } else {
          // Final fallback to flood-fill
          const transparent = await removeBackgroundAIGuided(image);
          setTransparentResult(transparent);
          const composited = await applyBackground(transparent, 'transparent');
          setResult(composited);
        }
        setProgress(100);
        setProgressLabel('Done!');
        toast.info('Background removed. AI scene generation is temporarily unavailable.');
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

  // ── Video background removal using FFmpeg WASM ──
  const handleVideoFileSelected = useCallback((file: File) => {
    if (file.size > 200 * 1024 * 1024) { toast.error('Video too large. Maximum size is 200MB.'); return; }
    if (!file.type.startsWith('video/')) { toast.error('Please upload a video file'); return; }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setVideoResult(null);
    setVideoProgress(0);
    setVideoProgressLabel('');
  }, []);

  const handleVideoRemoveBackground = async () => {
    if (!videoFile || !consent) { toast.error('Please upload a video and confirm consent'); return; }
    setIsVideoProcessing(true);
    setVideoProgress(5);
    setVideoProgressLabel('Loading video processor...');

    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile, toBlobURL } = await import('@ffmpeg/util');
      const ffmpeg = new FFmpeg();

      setVideoProgress(10);
      setVideoProgressLabel('Initializing FFmpeg...');

      await ffmpeg.load({
        coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm', 'application/wasm'),
      });

      setVideoProgress(15);
      setVideoProgressLabel('Loading video...');
      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

      // Extract frames at 10fps for AI processing
      setVideoProgress(20);
      setVideoProgressLabel('Extracting frames...');
      await ffmpeg.exec(['-i', 'input.mp4', '-vf', 'fps=10,scale=768:-1', '-q:v', '3', 'frame_%04d.jpg']);

      // List extracted frames
      const files = await ffmpeg.listDir('/');
      const frameFiles = files.filter(f => f.name.startsWith('frame_') && f.name.endsWith('.jpg')).sort((a, b) => a.name.localeCompare(b.name));
      const totalFrames = frameFiles.length;

      if (totalFrames === 0) { throw new Error('No frames extracted from video'); }

      setVideoProgress(25);
      setVideoProgressLabel(`Processing ${totalFrames} frames with AI...`);

      // Process each frame through AI background removal
      const BATCH_SIZE = 3; // process 3 frames concurrently to manage rate limits
      for (let i = 0; i < totalFrames; i += BATCH_SIZE) {
        const batch = frameFiles.slice(i, Math.min(i + BATCH_SIZE, totalFrames));
        
        await Promise.all(batch.map(async (frameFile) => {
          const frameData = await ffmpeg.readFile(frameFile.name);
          const frameBlob = new Blob([frameData as unknown as BlobPart], { type: 'image/jpeg' });
          
          // Convert to data URL for AI
          const reader = new FileReader();
          const dataUrl: string = await new Promise((res, rej) => {
            reader.onload = () => res(reader.result as string);
            reader.onerror = rej;
            reader.readAsDataURL(frameBlob);
          });

          // Call AI removal
          const { data } = await supabase.functions.invoke('ai-background-remove', {
            body: { mode: 'remove', image: dataUrl }
          });

          if (data?.success && data?.processedImage) {
            // Convert base64 result back to file for FFmpeg
            const b64 = data.processedImage.split(',')[1];
            const byteStr = atob(b64);
            const bytes = new Uint8Array(byteStr.length);
            for (let j = 0; j < byteStr.length; j++) bytes[j] = byteStr.charCodeAt(j);
            const outName = frameFile.name.replace('.jpg', '.png');
            await ffmpeg.writeFile(outName, bytes);
          } else {
            // If AI fails for a frame, copy original as fallback
            const outName = frameFile.name.replace('.jpg', '.png');
            await ffmpeg.writeFile(outName, frameData);
          }
        }));

        const processed = Math.min(i + BATCH_SIZE, totalFrames);
        const pct = 25 + Math.round((processed / totalFrames) * 55);
        setVideoProgress(pct);
        setVideoProgressLabel(`AI processed ${processed}/${totalFrames} frames...`);
      }

      // Reassemble frames into video
      setVideoProgress(82);
      setVideoProgressLabel('Reassembling video...');

      // Get original audio track
      await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'copy', 'audio.aac']).catch(() => {});
      const hasAudio = files.some(f => f.name === 'audio.aac');

      if (videoBackground === 'transparent') {
        // WebM with alpha
        const args = ['-framerate', '10', '-i', 'frame_%04d.png', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0', '-b:v', '2M'];
        if (hasAudio) args.push('-i', 'audio.aac', '-c:a', 'libopus', '-shortest');
        args.push('output.webm');
        await ffmpeg.exec(args);
        const data = await ffmpeg.readFile('output.webm');
        const blob = new Blob([data as unknown as BlobPart], { type: 'video/webm' });
        setVideoResult(URL.createObjectURL(blob));
      } else {
        // Composite with solid background color
        const bgColorMap: Record<string, string> = {
          white: 'white', black: 'black', navy: '#1E3A5F',
          gray: '#6B7280', 'gradient-blue': '#3B82F6'
        };
        const bgCol = bgColorMap[videoBackground] || 'black';
        const vfFilter = `color=${bgCol}:size=768x432[bg];[0:v][bg]overlay=shortest=1`;
        
        const args = ['-framerate', '10', '-i', 'frame_%04d.png'];
        if (hasAudio) args.push('-i', 'audio.aac');
        args.push('-vf', `split[main][alpha];[alpha]alphaextract[mask];color=${bgCol}:s=768x432[bg];[bg][main][mask]maskedmerge`);
        // Simpler: just overlay the transparent frames on solid color
        args.length = 0; // reset
        args.push('-framerate', '10', '-i', 'frame_%04d.png', '-filter_complex', `color=${bgCol}:size=768x432:d=999[bg];[bg][0:v]overlay=shortest=1`);
        if (hasAudio) args.push('-i', 'audio.aac', '-map', '0', '-map', '2:a', '-shortest');
        args.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'output.mp4');
        
        await ffmpeg.exec(args);
        const data = await ffmpeg.readFile('output.mp4');
        const blob = new Blob([data as unknown as BlobPart], { type: 'video/mp4' });
        setVideoResult(URL.createObjectURL(blob));
      }

      setVideoProgress(100);
      setVideoProgressLabel('Done!');
      toast.success('Video background removed with AI!');
    } catch (err) {
      console.error('Video processing error:', err);
      const message = err instanceof Error ? err.message : 'Video processing failed';
      if (message.includes('429') || message.includes('Rate limit')) {
        toast.error('Rate limit reached. Try a shorter video or wait a moment.');
      } else if (message.includes('402') || message.includes('credits')) {
        toast.error('AI credits exhausted. Please try again later.');
      } else {
        toast.error('Video processing failed. Try a shorter clip or smaller file.');
      }
    } finally {
      setIsVideoProcessing(false);
    }
  };

  const handleVideoDownload = () => {
    if (!videoResult) return;
    const a = document.createElement('a');
    a.href = videoResult;
    a.download = `bg-removed-${Date.now()}.${videoBackground === 'transparent' ? 'webm' : 'mp4'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Video downloaded!');
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
    setTransparentResult(null);
    setResult(null);
    setProgress(0);
    setProgressLabel('');
    setAiAnalysis(null);
    setImageInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetResult = () => {
    setTransparentResult(null);
    setResult(null);
    setProgress(0);
    setProgressLabel('');
  };

  const isLoading = isProcessing || isGenerating;

  // Checkerboard background for transparent preview
  const checkerboard = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImNoZWNrZXJib2FyZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxNDE2MjAiLz48cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMUExRjMwIi8+PHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzFBMUYzMCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMTQxNjIwIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2NoZWNrZXJib2FyZCkiLz48L3N2Zz4=')";

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
      <input ref={videoInputRef} type="file" accept="video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoFileSelected(f); }} className="hidden" />

      {!embedded && (
        <header style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/toolkit" className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-white/50 hover:text-white"
              style={{ border: `1px solid ${C.border}` }}>
              <ArrowLeft className="h-4 w-4" /><span className="text-sm">Back to Royal Tools Hub</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(184,148,62,0.12)", border: `1px solid ${C.border}`, color: C.accentText }}>
              <Sparkles className="w-3 h-3" /> AI Powered
            </div>
          </div>
        </header>
      )}

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: "rgba(184,148,62,0.12)", border: `1px solid ${C.border}`, boxShadow: "0 0 32px rgba(184,148,62,0.2)" }}>
            <Wand2 className="h-8 w-8" style={{ color: C.accentText }} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">AI Background Studio</h1>
          <p className="max-w-xl mx-auto text-sm" style={{ color: C.mutedText }}>
            Remove backgrounds instantly or place yourself in AI-generated scenes. Professional quality in seconds.
          </p>
        </div>

        {/* Save Project Bar */}
        <div className="mb-6">
          <SaveProjectBar
            projectName={projectName}
            onNameChange={setProjectName}
            onSave={() => {
              if (!result && !imagePreview) { toast.error('Nothing to save yet'); return; }
              localStorage.setItem(`bg-ai-project-${Date.now()}`, JSON.stringify({ name: projectName, result, savedAt: new Date().toISOString() }));
              toast.success(`Project "${projectName}" saved!`);
            }}
            onClear={() => {
              if (!confirm('Clear this project?')) return;
              resetAll();
              setProjectName('Background AI Project');
              toast.success('Project cleared');
            }}
            canSave={!!imagePreview}
            accentColor={C.accent}
            accentBorder={C.border}
          />
        </div>

        <ToolContentWrapper accentColor={C.accent}>

        {/* Upload Zone */}
        {!image && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl p-14 text-center cursor-pointer transition-all duration-300 group"
            style={{ border: `2px dashed ${C.border}`, background: C.surface }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderHover; (e.currentTarget as HTMLElement).style.background = "rgba(184,148,62,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = C.surface; }}
          >
            <Upload className="h-14 w-14 mx-auto mb-4" style={{ color: "rgba(184,148,62,0.5)" }} />
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
                style={{ background: "rgba(184,148,62,0.04)", border: `1px solid ${C.border}` }}>
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
                style={{ background: "rgba(184,148,62,0.04)", border: `1px solid ${C.border}` }}>
                <div className="px-4 py-2.5 flex items-center justify-between"
                  style={{ borderBottom: "1px solid rgba(184,148,62,0.1)" }}>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.mutedText }}>Original</span>
                </div>
                <div className="aspect-square flex items-center justify-center p-2" style={{ background: checkerboard }}>
                  {imagePreview && <img src={imagePreview} alt="Original" className="max-w-full max-h-full object-contain rounded-lg" />}
                </div>
              </div>

              {/* Result */}
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(184,148,62,0.04)", border: `1px solid ${C.border}` }}>
                <div className="px-4 py-2.5 flex items-center justify-between"
                  style={{ borderBottom: "1px solid rgba(184,148,62,0.1)" }}>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.mutedText }}>Result</span>
                  {result && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#4ade80" }}>
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </span>
                  )}
                </div>
                <div className="aspect-square flex items-center justify-center p-2" style={{ background: checkerboard }}>
                  {result ? (
                    <img src={result} alt="Result" className="max-w-full max-h-full object-contain rounded-lg" />
                  ) : isLoading ? (
                    <div className="text-center">
                      <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin" style={{ color: C.accentText }} />
                      <p className="text-sm" style={{ color: C.mutedText }}>
                        {progressLabel || (isGenerating ? 'AI is compositing your scene...' : 'Removing background...')}
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

            {isLoading && (
              <div className="space-y-1.5">
                <Progress value={progress} className="h-1.5" />
                {progressLabel && <p className="text-xs text-center" style={{ color: C.accentText }}>{progressLabel}</p>}
              </div>
            )}

            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(184,148,62,0.06)", border: `1px solid ${C.border}` }}>
              {[
                { id: 'remove', label: 'Remove BG', icon: Wand2 },
                { id: 'generate', label: 'AI Scene', icon: Sparkles },
                { id: 'video', label: 'Video BG', icon: Video },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'remove' | 'generate' | 'video')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab.id ? C.btnPrimary : 'rgba(255,255,255,0.07)',
                    color: 'white',
                    border: activeTab === tab.id ? 'none' : '1px solid rgba(255,255,255,0.18)',
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
                  Background Color
                  {transparentResult && (
                    <span className="ml-auto text-xs flex items-center gap-1" style={{ color: "#4ade80" }}>
                      <CheckCircle2 className="h-3 w-3" /> Switching is instant — subject never re-processed
                    </span>
                  )}
                  {!transparentResult && aiAnalysis?.recommendedBackground && (
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
                        background: selectedBackground === preset.id ? "rgba(184,148,62,0.28)" : "rgba(255,255,255,0.10)",
                        border: `1px solid ${selectedBackground === preset.id ? "rgba(184,148,62,0.7)" : "rgba(255,255,255,0.22)"}`,
                        color: selectedBackground === preset.id ? C.accentText : "rgba(255,255,255,0.88)",
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
                {transparentResult && (
                  <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
                    ✓ Background removed — click any color above to switch instantly without re-processing.
                  </p>
                )}
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
                        background: selectedScene.id === scene.id ? "rgba(184,148,62,0.28)" : "rgba(255,255,255,0.10)",
                        border: `1px solid ${selectedScene.id === scene.id ? "rgba(184,148,62,0.7)" : "rgba(255,255,255,0.22)"}`,
                        color: selectedScene.id === scene.id ? C.accentText : "rgba(255,255,255,0.88)",
                      }}
                    >
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
                  <p className="text-xs rounded-lg p-2" style={{ background: "rgba(184,148,62,0.08)", color: C.accentText }}>
                    <span className="font-medium">Scene:</span> {selectedScene.prompt}
                  </p>
                )}
                <p className="text-xs" style={{ color: C.dimText }}>
                  AI will remove your background and composite you realistically into the chosen scene.
                </p>
              </div>
            )}

            {/* ── VIDEO BG TAB ── */}
            {activeTab === 'video' && (
              <div className="space-y-4">
                <div className="rounded-2xl p-5 space-y-4" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Video className="h-4 w-4" style={{ color: C.accentText }} />
                    Video Background Removal
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(184,148,62,0.15)", color: C.accentText }}>FFmpeg + AI</span>
                  </h3>
                  {/* Video Upload */}
                  {!videoFile ? (
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="rounded-xl p-10 text-center cursor-pointer transition-all"
                      style={{ border: `2px dashed ${C.border}`, background: "rgba(184,148,62,0.03)" }}
                    >
                      <Video className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(184,148,62,0.5)" }} />
                      <p className="text-white font-medium mb-1">Drop your video here</p>
                      <p className="text-xs mb-4" style={{ color: C.dimText }}>MP4, MOV, WebM · Max 200MB</p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                        style={{ background: C.btnPrimary }}>
                        <Upload className="h-4 w-4" /> Browse Video
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.mutedText, borderBottom: `1px solid rgba(184,148,62,0.1)` }}>Original</div>
                          <video src={videoPreviewUrl!} controls className="w-full" style={{ maxHeight: 200 }} />
                        </div>
                        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: C.mutedText, borderBottom: `1px solid rgba(184,148,62,0.1)` }}>Result</div>
                          {videoResult ? (
                            <video src={videoResult} controls className="w-full" style={{ maxHeight: 200 }} />
                          ) : (
                            <div className="flex items-center justify-center h-[140px]" style={{ color: C.dimText }}>
                              {isVideoProcessing ? (
                                <div className="text-center">
                                  <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" style={{ color: C.accentText }} />
                                  <p className="text-xs">{videoProgressLabel}</p>
                                  <p className="text-xs mt-1">{videoProgress}%</p>
                                </div>
                              ) : (
                                <div className="text-center"><Video className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-xs">Result here</p></div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {isVideoProcessing && (
                        <div className="space-y-1">
                          <Progress value={videoProgress} className="h-1.5" />
                          <p className="text-xs text-center" style={{ color: C.accentText }}>{videoProgressLabel}</p>
                        </div>
                      )}
                      {/* Background color for video */}
                      <div>
                        <p className="text-xs font-medium text-white/60 mb-2">Output background</p>
                        <div className="flex flex-wrap gap-2">
                          {BG_PRESETS.map(p => (
                            <button key={p.id} onClick={() => setVideoBackground(p.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                              style={{ background: videoBackground === p.id ? "rgba(184,148,62,0.3)" : "rgba(255,255,255,0.08)", border: `1px solid ${videoBackground === p.id ? "rgba(184,148,62,0.7)" : "rgba(255,255,255,0.15)"}`, color: 'white' }}>
                              {p.color ? <span className="inline-block w-3 h-3 rounded-sm mr-1 align-middle" style={{ background: p.color }} /> : p.icon + ' '}
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(184,148,62,0.06)", color: C.accentText }}>
                        ℹ️ AI samples the first frame to detect background color, then applies FFmpeg colorkey filter across all frames.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Consent */}
            <div className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: "rgba(184,148,62,0.04)", border: "1px solid rgba(184,148,62,0.15)" }}>
              <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              <label htmlFor="consent" className="text-sm cursor-pointer" style={{ color: C.mutedText }}>
                I own this content or have the rights to edit it.
              </label>
            </div>

            {/* Whiten Clothing button — shown when a photo result exists */}
            {result && activeTab !== 'video' && (
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-white text-sm font-semibold flex items-center gap-2">👕 Whiten Clothing</p>
                    <p className="text-xs mt-0.5" style={{ color: C.dimText }}>Make white garments pure white — preserves skin tones</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!result) return;
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
                        ctx.drawImage(img, 0, 0);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const d = imageData.data;
                        for (let i = 0; i < d.length; i += 4) {
                          const r = d[i], g = d[i+1], b = d[i+2];
                          const brightness = (r + g + b) / 3;
                          const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
                          const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;
                          if (brightness > 160 && saturation < 0.35) {
                            const strength = Math.min(1, Math.max(0, (brightness - 160) / 95)) * 0.9;
                            d[i] = Math.round(r + (255 - r) * strength);
                            d[i+1] = Math.round(g + (255 - g) * strength);
                            d[i+2] = Math.round(b + (255 - b) * strength);
                          }
                        }
                        ctx.putImageData(imageData, 0, 0);
                        setResult(canvas.toDataURL('image/png'));
                        toast.success('Clothing whitened!');
                      };
                      img.src = result;
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: "linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)", color: "#1E293B" }}
                  >👕 Whiten Now</button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {activeTab === 'remove' && !transparentResult && (
                <button onClick={handleRemoveBackground} disabled={!consent || isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: C.btnPrimary, boxShadow: C.btnShadow }}>
                  {isProcessing ? <><Loader2 className="h-5 w-5 animate-spin" /> {progressLabel || `Processing ${Math.round(progress)}%`}</> : <><Wand2 className="h-5 w-5" /> Remove Background</>}
                </button>
              )}
              {activeTab === 'remove' && transparentResult && (
                <button onClick={resetResult} className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-medium transition-all text-white"
                  style={{ background: "rgba(255,255,255,0.14)", border: `1px solid rgba(255,255,255,0.35)` }}>
                  <RefreshCw className="h-4 w-4" /> Re-process
                </button>
              )}
              {activeTab === 'generate' && (
                <button onClick={handleAIGenerate} disabled={!consent || isLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)", boxShadow: "0 4px 20px rgba(139,92,246,0.4)" }}>
                  {isGenerating ? <><Loader2 className="h-5 w-5 animate-spin" /> {progressLabel || `Generating ${Math.round(progress)}%`}</> : <><Sparkles className="h-5 w-5" /> Generate AI Scene</>}
                </button>
              )}
              {activeTab === 'video' && videoFile && (
                <button onClick={handleVideoRemoveBackground} disabled={!consent || isVideoProcessing}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)", boxShadow: "0 4px 20px rgba(14,165,233,0.4)" }}>
                  {isVideoProcessing ? <><Loader2 className="h-5 w-5 animate-spin" /> {videoProgressLabel || `Processing ${videoProgress}%`}</> : <><Video className="h-5 w-5" /> Remove Video Background</>}
                </button>
              )}
              {activeTab === 'video' && videoFile && (
                <button onClick={() => { setVideoFile(null); setVideoPreviewUrl(null); setVideoResult(null); }}
                  className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
                  <Trash2 className="h-4 w-4" /> Clear
                </button>
              )}
              {result && activeTab !== 'video' && (
                <button onClick={handleDownload} className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #059669, #10B981)", boxShadow: "0 4px 16px rgba(16,185,129,0.35)" }}>
                  <Download className="h-4 w-4" /> Download PNG
                </button>
              )}
              {videoResult && activeTab === 'video' && (
                <button onClick={handleVideoDownload} className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #059669, #10B981)", boxShadow: "0 4px 16px rgba(16,185,129,0.35)" }}>
                  <Download className="h-4 w-4" /> Download Video
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 p-4 rounded-xl text-center" style={{ background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.08)" }}>
          <p className="text-xs" style={{ color: C.dimText }}>
            Smart edge-detection removal · AI scene generation uses cloud processing · Background switching is instant after first removal · Max 10MB per image
          </p>
        </div>
        </ToolContentWrapper>
      </main>
    </div>
  );
}
