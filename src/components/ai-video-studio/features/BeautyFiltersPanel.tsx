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
  Upload
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

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  blur: number;
  vignette: number;
}

export function BeautyFiltersPanel() {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('none');
  const [adjustments, setAdjustments] = useState<Adjustments>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    blur: 0,
    vignette: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const loadFileToCanvas = useCallback((file: File) => {
    setMediaFile(file);
    const fileIsVideo = file.type.startsWith('video/');
    setIsVideo(fileIsVideo);

    if (fileIsVideo) {
      // Extract first frame from video
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';
      video.onloadeddata = () => {
        video.currentTime = 1;
      };
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
    if (selectedFile) {
      loadFileToCanvas(selectedFile);
    }
  }, [loadFileToCanvas]);

  const applyPreset = (presetId: string) => {
    const preset = FILTER_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setAdjustments(preset.adjustments);
    }
  };

  const updateAdjustment = (key: keyof Adjustments, value: number) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
    setSelectedPreset('custom');
  };

  // Apply filters to canvas
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
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium text-white">Beauty Filters</h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">Apply professional filters to images & video frames</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Upload Area */}
        {!mediaFile && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-amber-500/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('beauty-file-input')?.click()}
          >
            <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-white mb-1">Drop image or video here</p>
            <p className="text-xs text-slate-500">JPG, PNG, WebP, MP4, MOV, WebM</p>
            <input
              id="beauty-file-input"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Preview */}
        {mediaFile && (
          <>
            <div className="rounded-lg bg-slate-800 overflow-hidden">
              <div className="p-2 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs text-white truncate">
                  {isVideo ? '🎬 ' : '🖼️ '}{mediaFile.name}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setMediaFile(null);
                    setImagePreview(null);
                    setIsVideo(false);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-2 bg-slate-900 flex items-center justify-center">
                <canvas 
                  ref={canvasRef}
                  className="max-w-full max-h-[200px] object-contain"
                />
              </div>
            </div>

            {/* Presets */}
            <div>
              <h4 className="text-xs font-medium text-slate-400 mb-2">Presets</h4>
              <div className="flex flex-wrap gap-1">
                {FILTER_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      selectedPreset === preset.id
                        ? 'bg-gold text-black font-medium'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Adjustments */}
            <div className="space-y-3">
              {adjustmentControls.slice(0, 4).map(({ key, label, icon: Icon, min, max }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400 flex items-center gap-1">
                      <Icon className="h-3 w-3 text-gold" />
                      {label}
                    </label>
                    <span className="text-xs text-gold font-mono">
                      {adjustments[key as keyof Adjustments]}
                    </span>
                  </div>
                  <Slider
                    value={[adjustments[key as keyof Adjustments]]}
                    onValueChange={([value]) => updateAdjustment(key as keyof Adjustments, value)}
                    min={min}
                    max={max}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            {/* Download */}
            <Button
              variant="default"
              size="sm"
              className="w-full bg-gold text-black hover:bg-gold/90"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Image
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
