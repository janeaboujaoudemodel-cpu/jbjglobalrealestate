/**
 * BackgroundRemoverPanel — Canvas-based + AI-powered image background removal
 * 
 * Modes 1-5: Client-side canvas pixel manipulation (instant)
 *   - Auto (luminance), Chroma Green/Blue, Solid White/Black
 * Mode 6: AI Remove — calls ai-background-remove edge function (mode: "remove")
 * Mode 7: AI Replace — calls ai-background-remove edge function (mode: "generate") + user prompt
 * 
 * On AI failure/rate-limit → auto-fallback to client-side canvas removal with toast
 */
import React, { useCallback, useRef, useState } from 'react';
import { Eraser, Upload, Download, Plus, Eye, RotateCcw, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const C = {
  bgCard: '#18181F',
  bgButton: '#1E1E28',
  bgButtonHov: '#252530',
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderAccent: 'rgba(200,168,122,0.35)',
  textPrimary: '#F1F0EE',
  textSecondary: '#8A8A9A',
  accent: '#C8A87A',
  accentGlow: 'rgba(200,168,122,0.15)',
  aiPurple: 'rgba(147,51,234,0.3)',
  aiPurpleBorder: 'rgba(147,51,234,0.5)',
  aiPurpleText: '#c084fc',
} as const;

type RemovalMode = 'auto' | 'chroma-green' | 'chroma-blue' | 'solid-white' | 'solid-black' | 'ai-remove' | 'ai-replace';

const MODES: { id: RemovalMode; label: string; desc: string; isAI?: boolean }[] = [
  { id: 'auto', label: 'Auto', desc: 'Luminance-based detection' },
  { id: 'chroma-green', label: 'Green Screen', desc: 'Remove green chroma key' },
  { id: 'chroma-blue', label: 'Blue Screen', desc: 'Remove blue chroma key' },
  { id: 'solid-white', label: 'White BG', desc: 'Remove white background' },
  { id: 'solid-black', label: 'Black BG', desc: 'Remove black background' },
  { id: 'ai-remove', label: 'AI Remove', desc: 'AI-powered precision removal', isAI: true },
  { id: 'ai-replace', label: 'AI Replace', desc: 'Replace BG with AI scene', isAI: true },
];

interface BackgroundRemoverPanelProps {
  onAddToTimeline?: (imageUrl: string, name: string) => void;
}

export function BackgroundRemoverPanel({ onAddToTimeline }: BackgroundRemoverPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState<RemovalMode>('auto');
  const [sensitivity, setSensitivity] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [replacePrompt, setReplacePrompt] = useState('');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setFileName(file.name);
    setResultImage(null);
    const reader = new FileReader();
    reader.onload = () => setSourceImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Client-side canvas removal (modes 1-5)
  const processCanvasRemoval = useCallback((imgSrc: string) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject('Canvas not supported'); return; }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        const d = imageData.data;
        const threshold = Math.round((sensitivity / 100) * 255);

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          let shouldRemove = false;

          switch (mode) {
            case 'auto': {
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              shouldRemove = lum > threshold;
              break;
            }
            case 'chroma-green':
              shouldRemove = g > threshold && g > r * 1.2 && g > b * 1.2;
              break;
            case 'chroma-blue':
              shouldRemove = b > threshold && b > r * 1.2 && b > g * 1.2;
              break;
            case 'solid-white':
              shouldRemove = r > threshold && g > threshold && b > threshold;
              break;
            case 'solid-black':
              shouldRemove = r < (255 - threshold) && g < (255 - threshold) && b < (255 - threshold);
              break;
          }
          if (shouldRemove) d[i + 3] = 0;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject('Failed to load image');
      img.src = imgSrc;
    });
  }, [mode, sensitivity]);

  // AI removal via edge function
  const processAIRemoval = useCallback(async (imgSrc: string): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to use AI background removal');
        return null;
      }

      const aiMode = mode === 'ai-replace' ? 'generate' : 'remove';
      const body: Record<string, unknown> = { mode: aiMode, image: imgSrc };
      if (aiMode === 'generate' && replacePrompt.trim()) {
        body.generationPrompt = replacePrompt.trim();
      }

      const { data, error } = await supabase.functions.invoke('ai-background-remove', { body });

      if (error) throw error;

      if (data?.success && data?.processedImage) {
        return data.processedImage;
      }

      // Fallback signals from edge function
      if (data?.fallbackToClientSide) {
        const reason = data.reason || 'unknown';
        if (reason === 'rate_limit') toast.info('AI rate limited — using canvas fallback');
        else if (reason === 'credits_exhausted') toast.info('AI credits exhausted — using canvas fallback');
        else toast.info('AI unavailable — using canvas fallback');
        return null; // signals caller to fallback
      }

      if (data?.error) throw new Error(data.error);
      return null;
    } catch (err: any) {
      console.error('AI background removal error:', err);
      toast.info('AI removal failed — falling back to canvas mode');
      return null;
    }
  }, [mode, replacePrompt]);

  const processRemoval = useCallback(async () => {
    if (!sourceImage) return;
    setIsProcessing(true);

    try {
      if (mode === 'ai-remove' || mode === 'ai-replace') {
        // Try AI first
        const aiResult = await processAIRemoval(sourceImage);
        if (aiResult) {
          setResultImage(aiResult);
          toast.success(mode === 'ai-replace' ? 'AI background replaced' : 'AI background removed');
          return;
        }
        // Fallback to canvas auto mode
        const canvasResult = await processCanvasRemoval(sourceImage);
        setResultImage(canvasResult);
        toast.success('Background removed (canvas fallback)');
      } else {
        // Client-side canvas modes
        const result = await processCanvasRemoval(sourceImage);
        setResultImage(result);
        toast.success('Background removed');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  }, [sourceImage, mode, processAIRemoval, processCanvasRemoval]);

  const handleDownload = useCallback(() => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `bg-removed-${fileName || 'image'}.png`;
    a.click();
    toast.success('Image downloaded');
  }, [resultImage, fileName]);

  const handleAddToTimeline = useCallback(() => {
    if (!resultImage || !onAddToTimeline) return;
    onAddToTimeline(resultImage, `BG Removed: ${fileName || 'image'}`);
    toast.success('Added to timeline');
  }, [resultImage, onAddToTimeline, fileName]);

  const handleReset = useCallback(() => {
    setSourceImage(null);
    setResultImage(null);
    setFileName('');
    setReplacePrompt('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const displayImage = showOriginal ? sourceImage : (resultImage || sourceImage);
  const isAIMode = mode === 'ai-remove' || mode === 'ai-replace';

  return (
    <div className="p-4 space-y-4" style={{ color: C.textPrimary }}>
      <div className="flex items-center gap-2 mb-2">
        <Eraser className="w-4 h-4" style={{ color: C.accent }} />
        <h3 className="text-sm font-semibold">Background Remover</h3>
      </div>
      <p className="text-[11px]" style={{ color: C.textSecondary }}>
        Remove or replace backgrounds using canvas processing or AI-powered precision removal.
      </p>

      {/* Upload */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      {!sourceImage ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-lg border-2 border-dashed transition-all hover:opacity-80"
          style={{ borderColor: C.borderAccent, color: C.textSecondary }}
        >
          <Upload className="w-6 h-6" style={{ color: C.accent }} />
          <span className="text-xs font-medium">Upload Image</span>
          <span className="text-[10px]">PNG, JPG, WebP</span>
        </button>
      ) : (
        <>
          {/* Preview */}
          <div className="relative rounded-lg overflow-hidden" style={{ border: `1px solid ${C.borderSubtle}`, background: 'repeating-conic-gradient(#1a1a24 0% 25%, #22222e 0% 50%) 50% / 16px 16px' }}>
            <img src={displayImage!} alt="Preview" className="w-full max-h-48 object-contain"  loading="lazy" decoding="async" />
            {resultImage && (
              <button
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                className="absolute top-2 right-2 p-1.5 rounded-md"
                style={{ background: 'rgba(0,0,0,0.7)', color: C.textPrimary }}
                title="Hold to see original"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mode selector */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: C.textSecondary }}>Removal Mode</span>
            <div className="grid grid-cols-2 gap-1.5">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className="relative text-left px-2.5 py-2 rounded-md text-[11px] transition-all"
                  style={{
                    background: mode === m.id
                      ? (m.isAI ? C.aiPurple : C.accentGlow)
                      : C.bgButton,
                    border: `1px solid ${mode === m.id
                      ? (m.isAI ? C.aiPurpleBorder : C.borderAccent)
                      : C.borderSubtle}`,
                    color: mode === m.id
                      ? (m.isAI ? C.aiPurpleText : C.accent)
                      : C.textSecondary,
                  }}
                >
                  {m.isAI && (
                    <span className="absolute top-1 right-1 flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: C.aiPurple, color: C.aiPurpleText }}>
                      <Sparkles className="w-2 h-2" /> AI
                    </span>
                  )}
                  <div className="font-medium">{m.label}</div>
                  <div className="text-[9px] opacity-70">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Replace prompt */}
          {mode === 'ai-replace' && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: C.aiPurpleText }}>New Background Scene</span>
              <input
                type="text"
                value={replacePrompt}
                onChange={e => setReplacePrompt(e.target.value)}
                placeholder="e.g. Modern luxury office with skyline view"
                className="w-full px-3 py-2 rounded-lg text-xs"
                style={{ background: C.bgButton, border: `1px solid ${C.aiPurpleBorder}`, color: C.textPrimary }}
              />
            </div>
          )}

          {/* Sensitivity slider — only for canvas modes */}
          {!isAIMode && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: C.textSecondary }}>Sensitivity</span>
                <span className="text-[11px] font-mono" style={{ color: C.accent }}>{sensitivity}%</span>
              </div>
              <input
                type="range" min={10} max={100} value={sensitivity}
                onChange={e => setSensitivity(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, ${C.accent} ${sensitivity}%, ${C.bgButton} ${sensitivity}%)` }}
              />
            </div>
          )}

          {/* Process button */}
          <button
            onClick={processRemoval}
            disabled={isProcessing || (mode === 'ai-replace' && !replacePrompt.trim())}
            className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: isAIMode ? C.aiPurple : C.accentGlow,
              border: `1px solid ${isAIMode ? C.aiPurpleBorder : C.borderAccent}`,
              color: isAIMode ? C.aiPurpleText : C.accent,
            }}
          >
            {isProcessing ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</>
            ) : isAIMode ? (
              <><Sparkles className="w-3.5 h-3.5" /> {mode === 'ai-replace' ? 'AI Replace Background' : 'AI Remove Background'}</>
            ) : (
              'Remove Background'
            )}
          </button>

          {/* Result actions */}
          {resultImage && (
            <div className="flex gap-2">
              <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all hover:opacity-90" style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}>
                <Download className="w-3.5 h-3.5" /> Download PNG
              </button>
              {onAddToTimeline && (
                <button onClick={handleAddToTimeline} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all hover:opacity-90" style={{ background: C.accentGlow, border: `1px solid ${C.borderAccent}`, color: C.accent }}>
                  <Plus className="w-3.5 h-3.5" /> Add to Timeline
                </button>
              )}
            </div>
          )}

          {/* Reset */}
          <button onClick={handleReset} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] transition-all hover:opacity-80" style={{ color: C.textSecondary }}>
            <RotateCcw className="w-3 h-3" /> Upload Different Image
          </button>
        </>
      )}
    </div>
  );
}
