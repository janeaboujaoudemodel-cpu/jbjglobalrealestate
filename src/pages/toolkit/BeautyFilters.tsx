import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Sparkles, 
  Download,
  Loader2,
  Trash2,
  Sun,
  Contrast,
  Droplets,
  Thermometer,
  Focus,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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

interface BeautyFiltersProps { embedded?: boolean; }

export default function BeautyFilters({ embedded = false }: BeautyFiltersProps) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setImage(droppedFile);
      setImagePreview(URL.createObjectURL(droppedFile));
    } else {
      toast.error('Please upload an image file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setImage(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  }, []);

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
      
      // Apply CSS filters
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
      
      // Apply vignette
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
    <div className="min-h-screen bg-black">
      {/* Header - hidden when embedded in a suite tab */}
      {!embedded && (
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/toolkit" className="flex items-center gap-2 hover:bg-zinc-800 transition-colors rounded-lg px-3 py-2 border border-zinc-700" style={{ color: '#a1a1aa' }}>
              <ArrowLeft className="h-5 w-5" style={{ color: '#a1a1aa' }} />
              <span style={{ color: '#a1a1aa' }}>Back to Toolkit</span>
            </Link>
            <div className="text-sm text-slate-500">
              Projects are saved automatically
            </div>
          </div>
        </header>
      )}

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/20 text-gold mb-6">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Beauty Filters
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Apply professional beauty enhancements and filters to your photos for listings and marketing.
          </p>
        </div>

        {/* Upload Area */}
        {!image && (
          <div className="max-w-2xl mx-auto">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center hover:border-gold/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">
                Drop your photo here
              </p>
              <p className="text-sm text-slate-500">
                JPG, PNG, WebP (max 10MB)
              </p>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Editor */}
        {image && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Preview */}
            <div className="lg:col-span-2">
              <div className="rounded-xl bg-slate-900 border border-slate-700 overflow-hidden">
                <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                  <span className="text-sm text-white font-medium">{image.name}</span>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      setImage(null);
                      setImagePreview(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[400px]">
                  <canvas 
                    ref={canvasRef}
                    className="max-w-full max-h-[500px] object-contain"
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="mt-6">
                <h3 className="text-white font-medium mb-4">Filter Presets</h3>
                <div className="flex flex-wrap gap-2">
                  {FILTER_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
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
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Adjustments */}
              <div className="rounded-xl bg-slate-900 border border-slate-700 p-4">
                <h3 className="text-white font-medium mb-4">Adjustments</h3>
                <div className="space-y-5">
                  {adjustmentControls.map(({ key, label, icon: Icon, min, max }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm text-slate-400 flex items-center gap-2">
                          <Icon className="h-4 w-4 text-gold" />
                          {label}
                        </label>
                        <span className="text-sm text-gold font-mono">
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
                
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => applyPreset('none')}
                >
                  Reset All
                </Button>
              </div>

              {/* Consent */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="consent" className="text-sm text-slate-400 cursor-pointer">
                  I own this content or have permission to edit it.
                </label>
              </div>

              {/* Download */}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleDownload}
                disabled={!consent}
              >
                <Download className="h-5 w-5 mr-2" />
                Download Image
              </Button>
            </div>
          </div>
        )}

        {/* Fair Usage Note */}
        <div className="mt-12 p-4 rounded-xl bg-slate-900/50 border border-slate-700 text-center">
          <p className="text-sm text-slate-500">
            Free tool with fair-usage limits. All processing is done locally in your browser.
          </p>
        </div>
      </main>
    </div>
  );
}
