/**
 * AI Thumbnail Generator for Video Suite
 * Generates video thumbnails from frames or AI-generated designs
 */
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Image, Sparkles, Download, Upload, Loader2, RefreshCw, Wand2, Type, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const THUMBNAIL_STYLES = [
  { id: 'modern', label: 'Modern & Clean' },
  { id: 'bold', label: 'Bold & Eye-Catching' },
  { id: 'luxury', label: 'Luxury Real Estate' },
  { id: 'minimal', label: 'Minimalist' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'vlog', label: 'YouTube Vlog' },
];

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 (YouTube)', w: 1280, h: 720 },
  { id: '1:1', label: '1:1 (Instagram)', w: 1080, h: 1080 },
  { id: '9:16', label: '9:16 (Reels/TikTok)', w: 1080, h: 1920 },
  { id: '4:3', label: '4:3 (Presentation)', w: 1024, h: 768 },
];

export function ThumbnailGenerator() {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [style, setStyle] = useState('luxury');
  const [ratio, setRatio] = useState('16:9');
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBaseImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const generateThumbnail = async () => {
    if (!title.trim()) {
      toast.error('Add a title for your thumbnail');
      return;
    }
    setLoading(true);
    try {
      const selectedRatio = ASPECT_RATIOS.find(r => r.id === ratio) || ASPECT_RATIOS[0];
      const selectedStyle = THUMBNAIL_STYLES.find(s => s.id === style)?.label || 'Luxury';

      const prompt = `Create a professional ${selectedStyle} style video thumbnail for YouTube/social media. 
Title text on the thumbnail: "${title}"${subtitle ? `\nSubtitle: "${subtitle}"` : ''}
Style: ${selectedStyle}, high contrast, attention-grabbing, with professional typography.
The text must be large, readable, and prominently placed.
Aspect ratio: ${ratio}. Make it look like a high-quality, clickable video thumbnail.`;

      const messages: any[] = [
        {
          role: 'user',
          content: baseImage
            ? [
                { type: 'text', text: prompt + '\nUse this image as the background/base for the thumbnail.' },
                { type: 'image_url', image_url: { url: baseImage } },
              ]
            : prompt,
        },
      ];

      const { data, error } = await supabase.functions.invoke('ai-image-gen', {
        body: {
          model: 'google/gemini-3.1-flash-image-preview',
          messages,
          modalities: ['image', 'text'],
        },
      });

      if (error) throw error;

      const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (imageUrl) {
        setGeneratedThumbnail(imageUrl);
        toast.success('Thumbnail generated!');
      } else {
        throw new Error('No image returned');
      }
    } catch (err: any) {
      console.error('Thumbnail generation failed:', err);
      toast.error(err.message || 'Failed to generate thumbnail');
    } finally {
      setLoading(false);
    }
  };

  const downloadThumbnail = () => {
    if (!generatedThumbnail) return;
    const link = document.createElement('a');
    link.href = generatedThumbnail;
    link.download = `thumbnail-${title.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
    toast.success('Thumbnail downloaded!');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Settings */}
        <div className="space-y-4">
          <Card style={{ background: 'rgba(253,251,247,0.8)', border: '1px solid rgba(184,149,85,0.2)' }}>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Type className="w-4 h-4" style={{ color: '#B89555' }} />
                <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Thumbnail Content</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>Title Text *</Label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Luxury Villa Tour in Palm Jumeirah"
                  style={{ borderColor: 'rgba(184,149,85,0.25)' }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>Subtitle (optional)</Label>
                <Input
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  placeholder="e.g. $5M | 5 Bedrooms | Sea View"
                  style={{ borderColor: 'rgba(184,149,85,0.25)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger style={{ borderColor: 'rgba(184,149,85,0.25)' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THUMBNAIL_STYLES.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>Aspect Ratio</Label>
                  <Select value={ratio} onValueChange={setRatio}>
                    <SelectTrigger style={{ borderColor: 'rgba(184,149,85,0.25)' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Base Image Upload */}
          <Card style={{ background: 'rgba(253,251,247,0.8)', border: '1px solid rgba(184,149,85,0.2)' }}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" style={{ color: '#B89555' }} />
                <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Base Image (optional)</span>
              </div>
              <p className="text-[11px]" style={{ color: 'rgba(0,0,0,0.4)' }}>Upload a photo to use as the thumbnail background</p>

              {baseImage ? (
                <div className="relative rounded-lg overflow-hidden border" style={{ borderColor: 'rgba(184,149,85,0.2)' }}>
                  <img src={baseImage} alt="Base" className="w-full h-32 object-cover"  loading="lazy" decoding="async" />
                  <button
                    onClick={() => setBaseImage(null)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                  >✕</button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed transition-colors hover:border-[#B89555]/50"
                  style={{ borderColor: 'rgba(184,149,85,0.2)' }}
                >
                  <Upload className="w-5 h-5" style={{ color: 'rgba(184,149,85,0.5)' }} />
                  <span className="text-xs" style={{ color: 'rgba(0,0,0,0.4)' }}>Drop or click to upload</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={generateThumbnail}
            disabled={loading || !title.trim()}
            className="w-full h-11 text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #B89555, #B89555)', opacity: loading || !title.trim() ? 0.6 : 1 }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Wand2 className="w-4 h-4 mr-2" /> Generate Thumbnail</>
            )}
          </Button>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <Card style={{ background: 'rgba(253,251,247,0.8)', border: '1px solid rgba(184,149,85,0.2)' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" style={{ color: '#B89555' }} />
                  <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Preview</span>
                </div>
                {generatedThumbnail && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={generateThumbnail} disabled={loading}>
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Regenerate
                    </Button>
                    <Button variant="ghost" size="sm" onClick={downloadThumbnail}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Download
                    </Button>
                  </div>
                )}
              </div>

              <div
                className="rounded-xl overflow-hidden flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #F7F1E6, #EFE6D6)',
                  border: '1px solid rgba(184,149,85,0.15)',
                  aspectRatio: ratio === '9:16' ? '9/16' : ratio === '1:1' ? '1/1' : ratio === '4:3' ? '4/3' : '16/9',
                  maxHeight: '400px',
                }}
              >
                {generatedThumbnail ? (
                  <img src={generatedThumbnail} alt="Generated thumbnail" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                ) : (
                  <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(184,149,85,0.1)' }}>
                      <Sparkles className="w-6 h-6" style={{ color: 'rgba(184,149,85,0.4)' }} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'rgba(0,0,0,0.3)' }}>Your thumbnail will appear here</p>
                    <p className="text-[11px]" style={{ color: 'rgba(0,0,0,0.2)' }}>Add a title and hit Generate</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* How to use */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(184,149,85,0.06)', border: '1px solid rgba(184,149,85,0.12)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#B89555' }}>How to Use</p>
            <ol className="text-[11px] space-y-1.5" style={{ color: 'rgba(0,0,0,0.45)' }}>
              <li>1. Enter a catchy title for your video thumbnail</li>
              <li>2. Optionally upload a base image or property photo</li>
              <li>3. Choose a style and aspect ratio</li>
              <li>4. Click Generate — AI creates a professional thumbnail</li>
              <li>5. Download and use on YouTube, Instagram, or your listing</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
