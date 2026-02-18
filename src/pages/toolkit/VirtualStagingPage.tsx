/**
 * AI Virtual Staging - Transform empty rooms into staged spaces
 * Uses Lovable AI for image generation
 */

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SaveProjectBar, ToolContentWrapper } from '@/components/toolkit/SaveProjectBar';
import {
  Home,
  Upload,
  Download,
  Loader2,
  Sofa,
  Bed,
  ChefHat,
  Bath,
  Briefcase,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  RefreshCw
} from 'lucide-react';

type RoomType = 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'office' | 'dining';
type DesignStyle = 'modern' | 'classic' | 'minimalist' | 'luxury' | 'scandinavian' | 'industrial';

interface StagingResult {
  id: string;
  originalUrl: string;
  stagedUrl: string;
  roomType: RoomType;
  style: DesignStyle;
  createdAt: Date;
}

const ROOM_TYPES: { id: RoomType; name: string; icon: typeof Sofa }[] = [
  { id: 'living', name: 'Living Room', icon: Sofa },
  { id: 'bedroom', name: 'Bedroom', icon: Bed },
  { id: 'kitchen', name: 'Kitchen', icon: ChefHat },
  { id: 'bathroom', name: 'Bathroom', icon: Bath },
  { id: 'office', name: 'Home Office', icon: Briefcase },
  { id: 'dining', name: 'Dining Room', icon: Sofa },
];

const DESIGN_STYLES: { id: DesignStyle; name: string; description: string }[] = [
  { id: 'modern', name: 'Modern', description: 'Clean lines, neutral colors, contemporary furniture' },
  { id: 'classic', name: 'Classic', description: 'Traditional elegance, rich woods, ornate details' },
  { id: 'minimalist', name: 'Minimalist', description: 'Simple, uncluttered, functional design' },
  { id: 'luxury', name: 'Luxury', description: 'High-end materials, bold accents, premium finishes' },
  { id: 'scandinavian', name: 'Scandinavian', description: 'Light woods, cozy textiles, hygge vibes' },
  { id: 'industrial', name: 'Industrial', description: 'Exposed elements, metal accents, urban feel' },
];

interface VirtualStagingPageProps { embedded?: boolean; }

export default function VirtualStagingPage({ embedded = false }: VirtualStagingPageProps) {
  const [projectName, setProjectName] = useState('Virtual Staging Project');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [roomType, setRoomType] = useState<RoomType>('living');
  const [designStyle, setDesignStyle] = useState<DesignStyle>('modern');
  const [customPrompt, setCustomPrompt] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stagedResult, setStagedResult] = useState<string | null>(null);
  const [history, setHistory] = useState<StagingResult[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      setUploadedFile(file);
      setStagedResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = useCallback(() => {
    setUploadedImage(null);
    setUploadedFile(null);
    setStagedResult(null);
  }, []);

  const generateStaging = useCallback(async () => {
    if (!uploadedImage) {
      toast.error('Please upload an image first');
      return;
    }

    setProcessing(true);
    setProgress(10);

    try {
      const roomConfig = ROOM_TYPES.find(r => r.id === roomType);
      const styleConfig = DESIGN_STYLES.find(s => s.id === designStyle);

      // Build the staging prompt
      const basePrompt = `Transform this empty ${roomConfig?.name.toLowerCase() || 'room'} into a beautifully staged ${styleConfig?.name.toLowerCase() || 'modern'} interior. ${styleConfig?.description || ''}`;
      const fullPrompt = customPrompt 
        ? `${basePrompt} Additional requirements: ${customPrompt}`
        : basePrompt;

      setProgress(30);

      // Call the interior design generation endpoint
      const response = await supabase.functions.invoke('interior-design-generate', {
        body: {
          imageBase64: uploadedImage.split(',')[1],
          prompt: fullPrompt,
          style: designStyle,
          roomType: roomType,
        },
      });

      setProgress(70);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate staging');
      }

      const result = response.data;
      
      if (result.imageUrl || result.image_url) {
        const stagedUrl = result.imageUrl || result.image_url;
        setStagedResult(stagedUrl);
        
        // Add to history
        const newResult: StagingResult = {
          id: crypto.randomUUID(),
          originalUrl: uploadedImage,
          stagedUrl,
          roomType,
          style: designStyle,
          createdAt: new Date(),
        };
        setHistory(prev => [newResult, ...prev.slice(0, 9)]);
        
        toast.success('Virtual staging complete!');
      } else {
        throw new Error('No image generated');
      }

      setProgress(100);

    } catch (error) {
      console.error('Staging error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate virtual staging');
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }, [uploadedImage, roomType, designStyle, customPrompt]);

  const downloadResult = useCallback(async () => {
    if (!stagedResult) return;

    try {
      const response = await fetch(stagedResult);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `staged_${roomType}_${designStyle}_${Date.now()}.png`;
      a.click();
      
      URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (error) {
      toast.error('Failed to download image');
    }
  }, [stagedResult, roomType, designStyle]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header — hidden when embedded inside PhotoSuite */}
      {!embedded && (
        <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="container max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30">
                <Home className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  AI Virtual Staging
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                    FREE
                  </Badge>
                </h1>
                <p className="text-slate-400 text-sm">Transform empty rooms into beautifully staged spaces</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Save Project Bar */}
        <div className="mb-5">
          <SaveProjectBar
            projectName={projectName}
            onNameChange={setProjectName}
            onSave={() => {
              if (!uploadedImage) { toast.error('Nothing to save'); return; }
              localStorage.setItem(`staging-project-${Date.now()}`, JSON.stringify({ name: projectName, savedAt: new Date().toISOString() }));
              toast.success(`Project "${projectName}" saved!`);
            }}
            onClear={() => {
              if (!confirm('Clear this project?')) return;
              setUploadedImage(null); setUploadedFile(null); setStagedResult(null); setHistory([]);
              setProjectName('Virtual Staging Project');
              toast.success('Project cleared');
            }}
            canSave={!!uploadedImage}
            accentColor="#6366F1"
            accentBorder="rgba(99,102,241,0.3)"
          />
        </div>
        <ToolContentWrapper accentColor="#6366F1">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Options */}
          <div className="space-y-4">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Room Type</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={roomType} onValueChange={(v) => setRoomType(v as RoomType)}>
                  <div className="grid grid-cols-2 gap-2">
                    {ROOM_TYPES.map(room => (
                      <div
                        key={room.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${
                          roomType === room.id
                            ? 'border-gold bg-gold/10'
                            : 'border-slate-700 hover:border-slate-500'
                        }`}
                        onClick={() => setRoomType(room.id)}
                      >
                        <RadioGroupItem value={room.id} id={room.id} className="hidden" />
                        <room.icon className="h-4 w-4 text-gold" />
                        <Label htmlFor={room.id} className="text-white text-sm cursor-pointer">
                          {room.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Design Style</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={designStyle} onValueChange={(v) => setDesignStyle(v as DesignStyle)}>
                  <div className="space-y-2">
                    {DESIGN_STYLES.map(style => (
                      <div
                        key={style.id}
                        className={`p-3 rounded-lg cursor-pointer border transition-all ${
                          designStyle === style.id
                            ? 'border-gold bg-gold/10'
                            : 'border-slate-700 hover:border-slate-500'
                        }`}
                        onClick={() => setDesignStyle(style.id)}
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value={style.id} id={style.id} className="hidden" />
                          <Label htmlFor={style.id} className="text-white font-medium cursor-pointer">
                            {style.name}
                          </Label>
                        </div>
                        <p className="text-slate-500 text-xs mt-1">{style.description}</p>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">Custom Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add specific furniture, colors, or style preferences..."
                  className="bg-slate-800 border-slate-600 text-white min-h-[80px]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Center/Right - Preview */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <ImageIcon className="h-5 w-5 text-gold" />
                  {stagedResult ? 'Result' : 'Upload Room Photo'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!uploadedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-gold/50 transition-colors"
                  >
                    <Upload className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-white mb-2">Click to upload empty room photo</p>
                    <p className="text-slate-500 text-sm">JPG, PNG up to 10MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Comparison View */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm mb-2 text-center">Original</p>
                        <div className="relative aspect-[4/3] bg-slate-800 rounded-lg overflow-hidden">
                          <img
                            src={uploadedImage}
                            alt="Original room"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-2 text-center">
                          {processing ? 'Generating...' : stagedResult ? 'Staged' : 'Result'}
                        </p>
                        <div className="relative aspect-[4/3] bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                          {processing ? (
                            <div className="text-center p-4">
                              <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-2" />
                              <p className="text-slate-400 text-sm">Creating your staged room...</p>
                              <Progress value={progress} className="mt-2" />
                            </div>
                          ) : stagedResult ? (
                            <img
                              src={stagedResult}
                              alt="Staged room"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                              <p className="text-slate-500 text-sm">Staged result will appear here</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={generateStaging}
                        disabled={processing}
                        className="flex-1 bg-gold text-black hover:bg-gold/90"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Staging...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            {stagedResult ? 'Regenerate' : 'Generate Staging'}
                          </>
                        )}
                      </Button>
                      
                      {stagedResult && (
                        <Button
                          onClick={downloadResult}
                          variant="outline"
                          className="text-white border-emerald-500 bg-emerald-500/20 hover:bg-emerald-500/30"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                      
                      <Button
                        onClick={clearImage}
                        variant="outline"
                        className="text-red-300 border-red-500/60 bg-red-500/20 hover:bg-red-500/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History */}
            {history.length > 0 && (
              <Card className="bg-slate-900/50 border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">Recent Stagings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {history.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-gold transition-all"
                        onClick={() => {
                          setUploadedImage(item.originalUrl);
                          setStagedResult(item.stagedUrl);
                          setRoomType(item.roomType);
                          setDesignStyle(item.style);
                        }}
                      >
                        <img
                          src={item.stagedUrl}
                          alt="Staged"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                          <p className="text-white text-[10px] truncate">{item.roomType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </ToolContentWrapper>
      </div>
    </div>
  );
}
