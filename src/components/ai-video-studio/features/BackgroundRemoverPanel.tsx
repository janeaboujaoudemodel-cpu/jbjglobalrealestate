/**
 * BackgroundRemoverPanel — Canvas-based image background removal
 * Modes: Auto (luminance), Chroma Key (green/blue screen), Solid Color (white/black)
 * Pure browser — uses CanvasRenderingContext2D.getImageData() pixel manipulation
 */
import React, { useCallback, useRef, useState } from 'react';
import { Eraser, Upload, Download, Plus, Eye, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

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
} as const;

type RemovalMode = 'auto' | 'chroma-green' | 'chroma-blue' | 'solid-white' | 'solid-black';

const MODES: { id: RemovalMode; label: string; desc: string }[] = [
  { id: 'auto', label: 'Auto', desc: 'Luminance-based detection' },
  { id: 'chroma-green', label: 'Green Screen', desc: 'Remove green chroma key' },
  { id: 'chroma-blue', label: 'Blue Screen', desc: 'Remove blue chroma key' },
  { id: 'solid-white', label: 'White BG', desc: 'Remove white background' },
  { id: 'solid-black', label: 'Black BG', desc: 'Remove black background' },
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

  const processRemoval = useCallback(() => {
    if (!sourceImage) return;
    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setIsProcessing(false); toast.error('Canvas not supported'); return; }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;
      const threshold = Math.round((sensitivity / 100) * 255);

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        let shouldRemove = false;

        switch (mode) {
          case 'auto': {
            // Luminance-based: remove near-white pixels
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

        if (shouldRemove) {
          d[i + 3] = 0; // set alpha to 0
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const resultUrl = canvas.toDataURL('image/png');
      setResultImage(resultUrl);
      setIsProcessing(false);
      toast.success('Background removed');
    };
    img.onerror = () => { setIsProcessing(false); toast.error('Failed to load image'); };
    img.src = sourceImage;
  }, [sourceImage, mode, sensitivity]);

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
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const displayImage = showOriginal ? sourceImage : (resultImage || sourceImage);

  return (
    <div className="p-4 space-y-4" style={{ color: C.textPrimary }}>
      <div className="flex items-center gap-2 mb-2">
        <Eraser className="w-4 h-4" style={{ color: C.accent }} />
        <h3 className="text-sm font-semibold">Background Remover</h3>
      </div>
      <p className="text-[11px]" style={{ color: C.textSecondary }}>
        Remove backgrounds from images using pixel-level processing. Upload an image, select a mode, and adjust sensitivity.
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
            <img src={displayImage!} alt="Preview" className="w-full max-h-48 object-contain" />
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
                  className="text-left px-2.5 py-2 rounded-md text-[11px] transition-all"
                  style={{
                    background: mode === m.id ? C.accentGlow : C.bgButton,
                    border: `1px solid ${mode === m.id ? C.borderAccent : C.borderSubtle}`,
                    color: mode === m.id ? C.accent : C.textSecondary,
                  }}
                >
                  <div className="font-medium">{m.label}</div>
                  <div className="text-[9px] opacity-70">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sensitivity slider */}
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

          {/* Process button */}
          <button
            onClick={processRemoval}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: C.accentGlow, border: `1px solid ${C.borderAccent}`, color: C.accent }}
          >
            {isProcessing ? 'Processing...' : 'Remove Background'}
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
