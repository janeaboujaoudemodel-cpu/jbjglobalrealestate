import React, { useState, useCallback } from 'react';
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
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const BACKGROUND_PRESETS = [
  { id: 'transparent', label: 'Transparent', color: 'transparent' },
  { id: 'white', label: 'White', color: '#FFFFFF' },
  { id: 'black', label: 'Black', color: '#000000' },
  { id: 'gold', label: 'JBJ Gold', color: '#C8A766' },
  { id: 'blur', label: 'Blur Original', color: 'blur' },
  { id: 'gradient-gold', label: 'Gold Gradient', color: 'gradient' },
];

// Helper to convert file to base64 data URL
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

interface BackgroundAIProps { embedded?: boolean; }

export default function BackgroundAI({ embedded = false }: BackgroundAIProps) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState('transparent');

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      // Check file size (10MB max)
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 10MB.');
        return;
      }
      setImage(droppedFile);
      setImagePreview(URL.createObjectURL(droppedFile));
      setResult(null);
    } else {
      toast.error('Please upload an image file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 10MB.');
        return;
      }
      setImage(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  }, []);

  const handleProcess = async () => {
    if (!image || !consent) {
      toast.error('Please upload an image and confirm consent');
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    try {
      // Convert image to base64 data URL
      const imageDataUrl = await fileToDataUrl(image);
      setProgress(30);

      // Call AI background removal edge function
      const { data, error } = await supabase.functions.invoke('ai-background-remove', {
        body: { 
          image: imageDataUrl,
          backgroundColor: selectedBackground 
        }
      });

      setProgress(80);

      if (error) {
        throw new Error(error.message || 'Processing failed');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success || !data?.processedImage) {
        // Use original if AI couldn't process
        toast.warning('AI could not process this image. Please try a different photo.');
        setResult(imagePreview);
      } else {
        setResult(data.processedImage);
        toast.success('Background removed successfully!');
      }
      
      setProgress(100);
    } catch (error) {
      console.error('Background removal error:', error);
      const message = error instanceof Error ? error.message : 'Processing failed. Please try again.';
      
      // Handle rate limit errors
      if (message.includes('Rate limit') || message.includes('429')) {
        toast.error('Rate limit reached. Please wait a moment and try again.');
      } else if (message.includes('credits') || message.includes('402')) {
        toast.error('AI service temporarily unavailable. Please try again later.');
      } else {
        toast.error(message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    
    // Create download link
    const a = document.createElement('a');
    a.href = result;
    a.download = `background-removed-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Image downloaded!');
  };

  const resetAll = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setProgress(0);
  };

  return (
    <div style={{ background: "#0D0B08", minHeight: "100vh" }}>
      {/* Header - hidden when embedded in a suite tab */}
      {!embedded && (
        <header style={{ borderBottom: "1px solid rgba(201,168,76,0.18)", background: "rgba(201,168,76,0.03)" }}>
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/toolkit" className="flex items-center gap-2 transition-colors rounded-lg px-3 py-2" style={{ color: "rgba(255,255,255,0.45)", border: "1px solid rgba(201,168,76,0.2)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"}>
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Toolkit</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}>
              <Sparkles className="w-3 h-3" /> AI Powered
            </div>
          </div>
        </header>
      )}

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 0 32px rgba(201,168,76,0.15)" }}>
            <Wand2 className="h-8 w-8 text-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            AI Background Remover
          </h1>
          <p className="max-w-xl mx-auto text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Remove or replace backgrounds from photos instantly using AI. Perfect for property listings and marketing.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { step: 1, label: 'Upload Photo', icon: Upload },
            { step: 2, label: 'AI Removes BG', icon: Wand2 },
            { step: 3, label: 'Download', icon: Download },
          ].map(({ step, label }) => (
            <div key={step} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold mb-2" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}>
                {step}
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Upload Area */}
        {!image && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group"
            style={{ border: "2px dashed rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.02)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.6)"; (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.05)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.02)"; }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 transition-colors" style={{ color: "rgba(201,168,76,0.5)" }} />
            <p className="text-white font-medium mb-2">Drop your photo here</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>JPG, PNG, WebP (max 10MB)</p>
            <input id="file-input" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>
        )}

        {/* Image Preview & Processing */}
        {image && (
          <div className="space-y-6">
            {/* Before/After Preview */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(201,168,76,0.03)", border: "1px solid rgba(201,168,76,0.2)" }}>
                <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Original</span>
                  <Button variant="secondary" size="sm" onClick={resetAll}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImNoZWNrZXJib2FyZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMyMDIwMjAiLz48cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzAzMDMwIi8+PHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzMwMzAzMCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMjAyMDIwIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2NoZWNrZXJib2FyZCkiLz48L3N2Zz4=')] flex items-center justify-center">
                  {imagePreview && <img src={imagePreview} alt="Original" className="max-w-full max-h-full object-contain" />}
                </div>
              </div>

              {/* Result */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(201,168,76,0.03)", border: "1px solid rgba(201,168,76,0.2)" }}>
                <div className="p-3" style={{ borderBottom: "1px solid rgba(201,168,76,0.12)" }}>
                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Result</span>
                </div>
                <div className="aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImNoZWNrZXJib2FyZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMyMDIwMjAiLz48cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzAzMDMwIi8+PHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzMwMzAzMCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMjAyMDIwIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2NoZWNrZXJib2FyZCkiLz48L3N2Zz4=')] flex items-center justify-center">
                  {result ? (
                    <img src={result} alt="Result" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Click "Remove Background" to process</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Background Options */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.18)" }}>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5 text-gold" />
                New Background
              </h3>
              <div className="flex flex-wrap gap-2">
                {BACKGROUND_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedBackground(preset.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
                    style={{
                      background: selectedBackground === preset.id ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selectedBackground === preset.id ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.08)"}`,
                      color: selectedBackground === preset.id ? "#C9A84C" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {preset.color === 'transparent' ? (
                      <span className="w-5 h-5 rounded border" style={{ borderColor: "rgba(255,255,255,0.2)", backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNjY2MiLz48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+PC9zdmc+')" }}></span>
                    ) : preset.color === 'blur' ? (
                      <Sparkles className="w-5 h-5" />
                    ) : preset.color === 'gradient' ? (
                      <span className="w-5 h-5 rounded bg-gradient-to-br from-gold to-amber-600"></span>
                    ) : (
                      <span className="w-5 h-5 rounded border border-white/10" style={{ backgroundColor: preset.color }}></span>
                    )}
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}>
              <Checkbox id="consent" checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} className="mt-0.5" />
              <label htmlFor="consent" className="text-sm cursor-pointer" style={{ color: "rgba(255,255,255,0.5)" }}>
                I own this content or have permission to edit it. Projects are saved automatically.
              </label>
            </div>

            {/* Process Button */}
            {!result && (
              <Button variant="primary" size="lg" className="w-full" onClick={handleProcess} disabled={!consent || isProcessing}>
                {isProcessing ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" />Processing... {Math.round(progress)}%</>
                ) : (
                  <><Wand2 className="h-5 w-5 mr-2" />Remove Background</>
                )}
              </Button>
            )}

            {isProcessing && <Progress value={progress} className="h-2" />}

            {/* Download Section */}
            {result && (
              <div className="rounded-2xl p-6" style={{ background: "rgba(12,10,8,0.9)", border: "1px solid rgba(201,168,76,0.3)" }}>
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Download className="h-5 w-5 text-gold" />
                  Download Your Image
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" onClick={handleDownload}><Download className="h-4 w-4 mr-2" />Download PNG</Button>
                  <Button variant="secondary" onClick={() => { setResult(null); setProgress(0); }}><Wand2 className="h-4 w-4 mr-2" />Process Again</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fair Usage Note */}
        <div className="mt-12 p-4 rounded-xl text-center" style={{ background: "rgba(201,168,76,0.03)", border: "1px solid rgba(201,168,76,0.12)" }}>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            Free tool with fair-usage limits · Max 10MB per image · 10 images per hour
          </p>
        </div>
      </main>
    </div>
  );
}
