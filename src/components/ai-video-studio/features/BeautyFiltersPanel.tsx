import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Download,
  Trash2,
  Sun,
  Contrast,
  Droplets,
  Thermometer,
  Focus,
  Palette,
  Upload,
  X,
  Zap,
  Film,
  CheckCircle2,
  SplitSquareHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';


// ── LUT (Look-Up Table) cinematic color grades ─────────────────────────────
interface LUTPreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  swatchGradient: string;
  adjustments: BeautyAdjustments;
  extraFilter?: string;
  tintColor?: string;
}

const LUT_PRESETS: LUTPreset[] = [
  {
    id: 'lut-orange-teal',
    name: 'Cinematic Orange-Teal',
    emoji: '',
    description: 'Hollywood split-tone — warm shadows, cyan highlights',
    swatchGradient: 'linear-gradient(135deg, #c0521a 0%, #1a7a7a 100%)',
    adjustments: { brightness: -3, contrast: 18, saturation: -15, warmth: 12, blur: 0, vignette: 30 },
    extraFilter: 'hue-rotate(-8deg)',
    tintColor: 'rgba(0,80,90,0.08)',
  },
  {
    id: 'lut-dubai-gold',
    name: 'Dubai Gold',
    emoji: '',
    description: 'Luxury golden haze for architecture & lifestyle',
    swatchGradient: 'linear-gradient(135deg, #b8860b 0%, #ffd700 60%, #c0841a 100%)',
    adjustments: { brightness: 8, contrast: 12, saturation: -8, warmth: 35, blur: 0, vignette: 18 },
    extraFilter: 'sepia(18%)',
    tintColor: 'rgba(200,140,0,0.09)',
  },
  {
    id: 'lut-sunset-dubai',
    name: 'Sunset Dubai',
    emoji: '',
    description: 'Golden hour over the Marina — rich magentas & amber',
    swatchGradient: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 50%, #ffcf00 100%)',
    adjustments: { brightness: 5, contrast: 15, saturation: 20, warmth: 28, blur: 0, vignette: 25 },
    extraFilter: 'hue-rotate(5deg)',
    tintColor: 'rgba(220,60,0,0.07)',
  },
  {
    id: 'lut-matte-film',
    name: 'Matte Film',
    emoji: '',
    description: 'Lifted blacks, desaturated mid-tones, editorial matte',
    swatchGradient: 'linear-gradient(135deg, #4a4a4a 0%, #8a8a78 50%, #bfb89e 100%)',
    adjustments: { brightness: 3, contrast: -12, saturation: -22, warmth: 5, blur: 0, vignette: 20 },
    extraFilter: 'contrast(88%) brightness(108%)',
    tintColor: 'rgba(160,150,120,0.10)',
  },
];

const FILTER_PRESETS = [
  { id: 'none', name: 'Original', adjustments: { brightness: 0, contrast: 0, saturation: 0, warmth: 0, blur: 0, vignette: 0 } },
  { id: 'luxury', name: 'Luxury Gold', adjustments: { brightness: 5, contrast: 10, saturation: -10, warmth: 15, blur: 0, vignette: 20 } },
  { id: 'bright', name: 'Bright & Clean', adjustments: { brightness: 15, contrast: 5, saturation: 5, warmth: 0, blur: 0, vignette: 0 } },
  { id: 'warm', name: 'Warm Glow', adjustments: { brightness: 5, contrast: 5, saturation: 10, warmth: 25, blur: 0, vignette: 10 } },
  { id: 'cool', name: 'Cool Professional', adjustments: { brightness: 0, contrast: 10, saturation: -5, warmth: -15, blur: 0, vignette: 15 } },
  { id: 'hdr', name: 'HDR Effect', adjustments: { brightness: 0, contrast: 25, saturation: 15, warmth: 5, blur: 0, vignette: 0 } },
  { id: 'soft', name: 'Soft Portrait', adjustments: { brightness: 10, contrast: -5, saturation: 5, warmth: 10, blur: 5, vignette: 25 } },
  { id: 'dramatic', name: 'Dramatic', adjustments: { brightness: -5, contrast: 30, saturation: 20, warmth: 0, blur: 0, vignette: 40 } },
];

export interface BeautyAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  blur: number;
  vignette: number;
}

const NONE_PRESET = FILTER_PRESETS[0].adjustments;

function isNonePreset(adj: BeautyAdjustments) {
  return (
    adj.brightness === 0 &&
    adj.contrast === 0 &&
    adj.saturation === 0 &&
    adj.warmth === 0 &&
    adj.blur === 0 &&
    adj.vignette === 0
  );
}

interface BeautyFiltersPanelProps {
  onFilterChange?: (adjustments: BeautyAdjustments | null) => void;
  onApplyToExport?: (adjustments: BeautyAdjustments | null) => void;
  exportFilterActive?: boolean;
  onToggleComparison?: () => void;
  comparisonMode?: boolean;
}

export function BeautyFiltersPanel({ onFilterChange, onApplyToExport, exportFilterActive, onToggleComparison, comparisonMode }: BeautyFiltersPanelProps) {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('none');
  const [adjustments, setAdjustments] = useState<BeautyAdjustments>({ ...NONE_PRESET });
  const [activeLUT, setActiveLUT] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const isFilterActive = !isNonePreset(adjustments);

  const notifyFilterChange = useCallback((adj: BeautyAdjustments) => {
    if (isNonePreset(adj)) {
      onFilterChange?.(null);
    } else {
      onFilterChange?.(adj);
    }
  }, [onFilterChange]);

  const loadFileToCanvas = useCallback((file: File) => {
    setMediaFile(file);
    const fileIsVideo = file.type.startsWith('video/');
    setIsVideo(fileIsVideo);

    if (fileIsVideo) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';
      video.onloadeddata = () => { video.currentTime = 1; };
      video.onseeked = () => {
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = video.videoWidth;
        tmpCanvas.height = video.videoHeight;
        const tmpCtx = tmpCanvas.getContext('2d');
        tmpCtx?.drawImage(video, 0, 0);
        setImagePreview(tmpCanvas.toDataURL('image/jpeg', 0.9));
      };
      video.onerror = () => toast.error('Could not extract frame from video');
    } else {
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type.startsWith('video/'))) {
      loadFileToCanvas(droppedFile);
    } else {
      toast.error('Please upload an image or video file');
    }
  }, [loadFileToCanvas]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) loadFileToCanvas(selectedFile);
  }, [loadFileToCanvas]);

  const applyPreset = (presetId: string) => {
    const preset = FILTER_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setActiveLUT(null);
      setAdjustments(preset.adjustments);
      notifyFilterChange(preset.adjustments);
    }
  };

  const applyLUT = (lut: LUTPreset) => {
    const isAlreadyActive = activeLUT === lut.id;
    if (isAlreadyActive) {
      // Toggle off
      setActiveLUT(null);
      setSelectedPreset('none');
      setAdjustments({ ...NONE_PRESET });
      onFilterChange?.(null);
      toast.info('LUT removed');
      return;
    }
    setActiveLUT(lut.id);
    setSelectedPreset('custom');
    setAdjustments(lut.adjustments);
    notifyFilterChange(lut.adjustments);
    toast.success(`${lut.emoji} ${lut.name} applied`);
  };

  const updateAdjustment = (key: keyof BeautyAdjustments, value: number) => {
    const next = { ...adjustments, [key]: value };
    setAdjustments(next);
    setSelectedPreset('custom');
    setActiveLUT(null);
    notifyFilterChange(next);
  };

  const handleClearFilter = () => {
    const none = { ...NONE_PRESET };
    setAdjustments(none);
    setSelectedPreset('none');
    setActiveLUT(null);
    onFilterChange?.(null);
  };

  // Apply filters to canvas (for image download section)
  useEffect(() => {
    if (!imagePreview || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      canvas.width = img.width;
      canvas.height = img.height;
      
      const { brightness, contrast, saturation, warmth, blur } = adjustments;
      ctx.filter = `
        brightness(${100 + brightness}%)
        contrast(${100 + contrast}%)
        saturate(${100 + saturation}%)
        sepia(${warmth > 0 ? warmth / 2 : 0}%)
        hue-rotate(${warmth < 0 ? warmth : 0}deg)
        blur(${blur / 10}px)
      `;
      ctx.drawImage(img, 0, 0);
      
      if (adjustments.vignette > 0) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${adjustments.vignette / 100})`);
        ctx.filter = 'none';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    img.src = imagePreview;
  }, [imagePreview, adjustments]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `filtered-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    toast.success('Image downloaded!');
  };

  const adjustmentControls = [
    { key: 'brightness', label: 'Brightness', icon: Sun, min: -50, max: 50 },
    { key: 'contrast', label: 'Contrast', icon: Contrast, min: -50, max: 50 },
    { key: 'saturation', label: 'Saturation', icon: Droplets, min: -50, max: 50 },
    { key: 'warmth', label: 'Warmth', icon: Thermometer, min: -50, max: 50 },
    { key: 'blur', label: 'Blur', icon: Focus, min: 0, max: 20 },
    { key: 'vignette', label: 'Vignette', icon: Palette, min: 0, max: 60 },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-medium text-white">Beauty Filters</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {isFilterActive && (
              <>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  <Zap className="w-2.5 h-2.5" />
                  LIVE
                </span>
                {/* ── Before / After comparison toggle ── */}
                <button
                  onClick={onToggleComparison}
                  title={comparisonMode ? 'Exit comparison mode' : 'Before / After split view'}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                    comparisonMode
                      ? 'bg-violet-500/25 text-violet-300 border-violet-500/50 shadow-sm'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white border-transparent'
                  }`}
                >
                  <SplitSquareHorizontal className="w-3 h-3" />
                  {comparisonMode ? 'Comparing' : 'Compare'}
                </button>
                <button
                  onClick={handleClearFilter}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors border border-transparent"
                >
                  <X className="w-2.5 h-2.5" />
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {comparisonMode
            ? 'Drag the divider on the canvas to compare original vs filtered'
            : isFilterActive
              ? 'Filter is live on the preview canvas'
              : 'Adjust sliders to preview filters on your video'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* ── LUT Color Grades ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <h4 className="text-xs font-medium text-slate-400">LUT Color Grades</h4>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 tracking-wider">
              CINEMATIC
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {LUT_PRESETS.map((lut) => {
              const isActive = activeLUT === lut.id;
              return (
                <button
                  key={lut.id}
                  onClick={() => applyLUT(lut)}
                  title={lut.description}
                  className={`relative rounded-lg overflow-hidden text-left transition-all duration-200 group ${
                    isActive
                      ? 'ring-2 ring-violet-400 shadow-lg shadow-violet-500/20 scale-[1.02]'
                      : 'ring-1 ring-slate-700 hover:ring-slate-500 hover:scale-[1.01]'
                  }`}
                >
                  {/* Gradient swatch */}
                  <div
                    className="h-10 w-full"
                    style={{ background: lut.swatchGradient }}
                  />
                  {/* Active tick */}
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shadow">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  {/* Label */}
                  <div className={`px-2 py-1.5 ${isActive ? 'bg-violet-900/60' : 'bg-slate-800/90 group-hover:bg-slate-700/90'} transition-colors`}>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px]">{lut.emoji}</span>
                      <span className={`text-[10px] font-semibold leading-tight ${isActive ? 'text-violet-200' : 'text-slate-200'}`}>
                        {lut.name}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-tight line-clamp-1">{lut.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Presets — always visible */}
        <div>
          <h4 className="text-xs font-medium text-slate-400 mb-2">Quick Presets</h4>
          <div className="flex flex-wrap gap-1">
            {FILTER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`px-2 py-1 rounded text-xs transition-all ${
                  selectedPreset === preset.id && !activeLUT
                    ? 'bg-amber-500 text-black font-medium'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Adjustments — always visible */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-slate-400">Fine-Tune</h4>
          {adjustmentControls.map(({ key, label, icon: Icon, min, max }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Icon className="h-3 w-3 text-amber-400" />
                  {label}
                </label>
                <span className="text-xs text-amber-400 font-mono">
                  {adjustments[key as keyof BeautyAdjustments]}
                </span>
              </div>
              <Slider
                value={[adjustments[key as keyof BeautyAdjustments]]}
                onValueChange={([value]) => updateAdjustment(key as keyof BeautyAdjustments, value)}
                min={min}
                max={max}
                step={1}
                className="w-full"
              />
            </div>
          ))}
        </div>

        {/* ── Apply to Export ────────────────────────────────────────────── */}
        {isFilterActive && (
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-3 py-2 bg-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-slate-200">Bake into Export</span>
              </div>
              {exportFilterActive && (
                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  APPLIED
                </span>
              )}
            </div>
            <div className="px-3 pb-3 pt-2 bg-slate-900/60 space-y-2">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Bakes the current CSS filter adjustments into the video export pipeline — the downloaded file will have the filter applied, not just the live preview.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onApplyToExport?.(isFilterActive ? adjustments : null);
                    import('sonner').then(({ toast }) =>
                      exportFilterActive
                        ? toast.info('Export filter cleared')
                        : toast.success('Beauty filter will be baked into your export!')
                    );
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition-all border ${
                    exportFilterActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40'
                      : 'bg-amber-500 text-black border-amber-500 hover:bg-amber-400'
                  }`}
                >
                  {exportFilterActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Applied — Click to Remove
                    </>
                  ) : (
                    <>
                      <Film className="w-3.5 h-3.5" />
                      Apply to Export
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-800 pt-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-semibold">Export Frame (Optional)</p>
          
          {/* Upload Area */}
          {!mediaFile && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center hover:border-amber-500/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('beauty-file-input')?.click()}
            >
              <Upload className="h-6 w-6 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-white mb-1">Drop image or video to export filtered frame</p>
              <p className="text-[10px] text-slate-500">JPG, PNG, WebP, MP4, MOV</p>
              <input
                id="beauty-file-input"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Canvas preview + download */}
          {mediaFile && (
            <div className="space-y-2">
              <div className="rounded-lg bg-slate-800 overflow-hidden">
                <div className="p-2 border-b border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-white truncate">
                    {isVideo ? '🎬 ' : '🖼️ '}{mediaFile.name}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => { setMediaFile(null); setImagePreview(null); setIsVideo(false); }}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-2 bg-slate-900 flex items-center justify-center">
                  <canvas ref={canvasRef} className="max-w-full max-h-[160px] object-contain" />
                </div>
              </div>
              <Button
                variant="default"
                size="sm"
                className="w-full bg-amber-500 text-black hover:bg-amber-400"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Filtered Frame
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
