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
  { id: 'navy', label: 'Navy Blue', color: '#1E3A5F' },
  { id: 'blur', label: 'Blur Original', color: 'blur' },
  { id: 'gradient-blue', label: 'Blue Gradient', color: 'gradient' },
];

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const indigo = {
  bg: "rgba(99,102,241,0.06)",
  border: "rgba(99,102,241,0.2)",
  borderHover: "rgba(99,102,241,0.55)",
  text: "#818CF8",
  accent: "#6366F1",
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
      if (droppedFile.size > 10 * 1024 * 1024) { toast.error('File too large. Maximum size is 10MB.'); return; }
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
      if (selectedFile.size > 10 * 1024 * 1024) { toast.error('File too large. Maximum size is 10MB.'); return; }
      setImage(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  }, []);

  const handleProcess = async () => {
    if (!image || !consent) { toast.error('Please upload an image and confirm consent'); return; }
    setIsProcessing(true); setProgress(10);
    try {
      const imageDataUrl = await fileToDataUrl(image);
      setProgress(30);
      const { data, error } = await supabase.functions.invoke('ai-background-remove', {
        body: { image: imageDataUrl, backgroundColor: selectedBackground }
      });
      setProgress(80);
      if (error) throw new Error(error.message || 'Processing failed');
      if (data?.error) throw new Error(data.error);
      if (!data?.success || !data?.processedImage) {
        toast.warning('AI could not process this image. Please try a different photo.');
        setResult(imagePreview);
      } else {
        setResult(data.processedImage);
        toast.success('Background removed successfully!');
      }
      setProgress(100);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Processing failed. Please try again.';
      if (message.includes('Rate limit') || message.includes('429')) {
        toast.error('Rate limit reached. Please wait a moment and try again.');
      } else {
        toast.error(message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result; a.download = `background-removed-${Date.now()}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success('Image downloaded!');
  };

  const resetAll = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null); setImagePreview(null); setResult(null); setProgress(0);
  };

  return (
    <div style={{ background: "#0C0E14", minHeight: "100vh" }}>
      {!embedded && (
        <header style={{ borderBottom: `1px solid ${indigo.border}`, background: indigo.bg }}>
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/toolkit" className="flex items-center gap-2 transition-colors rounded-lg px-3 py-2"
              style={{ color: "rgba(255,255,255,0.45)", border: `1px solid ${indigo.border}` }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"}>
              <ArrowLeft className="h-5 w-5" /><span>Back to Toolkit</span>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${indigo.border}`, color: indigo.text }}>
              <Sparkles className="w-3 h-3" /> AI Powered
            </div>
          </div>
        </header>
      )}

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${indigo.border}`, boxShadow: "0 0 32px rgba(99,102,241,0.2)" }}>
            <Wand2 className="h-8 w-8" style={{ color: indigo.text }} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">AI Background Remover</h1>
          <p className="max-w-xl mx-auto text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Remove or replace backgrounds from photos instantly using AI. Perfect for property listings and marketing.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[{ step: 1, label: 'Upload Photo' }, { step: 2, label: 'AI Removes BG' }, { step: 3, label: 'Download' }].map(({ step, label }) => (
            <div key={step} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold mb-2"
                style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${indigo.border}`, color: indigo.text }}>
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
            className="rounded-2xl p-12 text-center cursor-pointer transition-all duration-300"
            style={{ border: `2px dashed ${indigo.border}`, background: indigo.bg }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = indigo.borderHover; (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = indigo.border; (e.currentTarget as HTMLElement).style.background = indigo.bg; }}
            onClick={() => document.getElementById('bg-file-input')?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: "rgba(99,102,241,0.55)" }} />
            <p className="text-white font-semibold text-lg mb-2">Drop your photo here</p>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>JPG, PNG, WebP (max 10MB)</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>
              <Upload className="h-4 w-4" /> Browse Files
            </div>
            <input id="bg-file-input" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>
        )}

        {/* Image Preview & Processing */}
        {image && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Original */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${indigo.border}` }}>
                <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(99,102,241,0.12)" }}>
                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Original</span>
                  <Button variant="secondary" size="sm" onClick={resetAll}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImNoZWNrZXJib2FyZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMyMDIwMjAiLz48cmVjdCB4PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzAzMDMwIi8+PHJlY3QgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzMwMzAzMCIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMjAyMDIwIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2NoZWNrZXJib2FyZCkiLz48L3N2Zz4=')] flex items-center justify-center">
                  {imagePreview && <img src={imagePreview} alt="Original" className="max-w-full max-h-full object-contain" />}
                </div>
              </div>

              {/* Result */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${indigo.border}` }}>
                <div className="p-3" style={{ borderBottom: "1px solid rgba(99,102,241,0.12)" }}>
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
            <div className="rounded-2xl p-5" style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${indigo.border}` }}>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5" style={{ color: indigo.text }} />
                New Background
              </h3>
              <div className="flex flex-wrap gap-2">
                {BACKGROUND_PRESETS.map((preset) => (
                  <button key={preset.id} onClick={() => setSelectedBackground(preset.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
                    style={{
                      background: selectedBackground === preset.id ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selectedBackground === preset.id ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.08)"}`,
                      color: selectedBackground === preset.id ? indigo.text : "rgba(255,255,255,0.55)",
                    }}>
                    {preset.color === 'transparent' ? (
                      <span className="w-5 h-5 rounded border" style={{ borderColor: "rgba(255,255,255,0.2)", backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNjY2MiLz48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+PC9zdmc+')" }}></span>
                    ) : preset.color === 'blur' ? (
                      <Sparkles className="w-5 h-5" />
                    ) : preset.color === 'gradient' ? (
                      <span className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-indigo-600"></span>
                    ) : (
                      <span className="w-5 h-5 rounded border border-white/10" style={{ backgroundColor: preset.color }}></span>
                    )}
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Consent */}
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <Checkbox id="consent" checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} className="mt-0.5" />
              <label htmlFor="consent" className="text-sm cursor-pointer" style={{ color: "rgba(255,255,255,0.5)" }}>
                I own this content or have permission to edit it.
              </label>
            </div>

            {/* Process Button */}
            {!result && (
              <Button size="lg" className="w-full text-white font-semibold" onClick={handleProcess} disabled={!consent || isProcessing}
                style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
                {isProcessing
                  ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Processing... {Math.round(progress)}%</>
                  : <><Wand2 className="h-5 w-5 mr-2" />Remove Background</>
                }
              </Button>
            )}

            {isProcessing && <Progress value={progress} className="h-2" />}

            {/* Download */}
            {result && (
              <div className="rounded-2xl p-6" style={{ background: "rgba(99,102,241,0.06)", border: `1px solid ${indigo.border}` }}>
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Download className="h-5 w-5" style={{ color: indigo.text }} />Download Your Image
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleDownload} style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", color: "white" }}>
                    <Download className="h-4 w-4 mr-2" />Download PNG
                  </Button>
                  <Button variant="secondary" onClick={() => { setResult(null); setProgress(0); }}>
                    <Wand2 className="h-4 w-4 mr-2" />Process Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 p-4 rounded-xl text-center" style={{ background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.1)" }}>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            Free tool with fair-usage limits · Max 10MB per image · 10 images per hour
          </p>
        </div>
      </main>
    </div>
  );
}
