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
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

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
}

export function BeautyFiltersPanel({ onFilterChange }: BeautyFiltersPanelProps) {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('none');
  const [adjustments, setAdjustments] = useState<BeautyAdjustments>({ ...NONE_PRESET });

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
      setAdjustments(preset.adjustments);
      notifyFilterChange(preset.adjustments);
    }
  };

  const updateAdjustment = (key: keyof BeautyAdjustments, value: number) => {
    const next = { ...adjustments, [key]: value };
    setAdjustments(next);
    setSelectedPreset('custom');
    notifyFilterChange(next);
  };

  const handleClearFilter = () => {
    const none = { ...NONE_PRESET };
    setAdjustments(none);
    setSelectedPreset('none');
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
          {isFilterActive && (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                <Zap className="w-2.5 h-2.5" />
                LIVE
              </span>
              <button
                onClick={handleClearFilter}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
              >
                <X className="w-2.5 h-2.5" />
                Clear
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {isFilterActive
            ? 'Filter is live on the preview canvas'
            : 'Adjust sliders to preview filters on your video'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Presets — always visible */}
        <div>
          <h4 className="text-xs font-medium text-slate-400 mb-2">Presets</h4>
          <div className="flex flex-wrap gap-1">
            {FILTER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`px-2 py-1 rounded text-xs transition-all ${
                  selectedPreset === preset.id
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
