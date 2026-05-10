import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Image, Sparkles, Loader2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

// Preset backgrounds
const PRESET_BACKGROUNDS = [
  { id: 'none', name: 'None', preview: null, type: 'none' },
  { id: 'blur', name: 'Blur', preview: null, type: 'blur' },
  { id: 'office-modern', name: 'Modern Office', preview: '/backgrounds/office-modern.jpg', type: 'preset' },
  { id: 'office-executive', name: 'Executive Office', preview: '/backgrounds/office-exec.jpg', type: 'preset' },
  { id: 'beach-sunset', name: 'Beach Sunset', preview: '/backgrounds/beach.jpg', type: 'preset' },
  { id: 'mountains', name: 'Mountains', preview: '/backgrounds/mountains.jpg', type: 'preset' },
  { id: 'city-skyline', name: 'City Skyline', preview: '/backgrounds/city.jpg', type: 'preset' },
  { id: 'jbj-branded', name: 'JBJ Branded', preview: '/backgrounds/jbj.jpg', type: 'preset' },
  { id: 'meeting-room', name: 'Meeting Room', preview: '/backgrounds/meeting.jpg', type: 'preset' },
  { id: 'library', name: 'Library', preview: '/backgrounds/library.jpg', type: 'preset' },
];

interface AIBackgroundGeneratorProps {
  selectedBackground: string;
  onSelectBackground: (backgroundId: string, customUrl?: string) => void;
  onClose: () => void;
}

const AIBackgroundGenerator = ({
  selectedBackground,
  onSelectBackground,
  onClose
}: AIBackgroundGeneratorProps) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBackgrounds, setGeneratedBackgrounds] = useState<string[]>([]);

  const handleGenerateBackground = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please describe the background you want');
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate AI background generation
      // In production, this would call an AI image generation API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo, add a placeholder
      const newBackground = `ai-generated-${Date.now()}`;
      setGeneratedBackgrounds(prev => [...prev, newBackground]);
      toast.success('Background generated! Click to apply.');
    } catch (error) {
      toast.error('Failed to generate background. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="bg-[#FDFBF7] border-[#1A1A1A] w-96">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Image className="w-5 h-5 text-[#1A1A1A]" />
          Virtual Backgrounds
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white/70 hover:text-white">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Backgrounds */}
        <div>
          <Label className="text-white/85 text-sm mb-2 block">Preset Backgrounds</Label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_BACKGROUNDS.map(bg => (
              <button
                key={bg.id}
                onClick={() => onSelectBackground(bg.id)}
                className={`relative aspect-video rounded-lg border-2 transition-all overflow-hidden ${
                  selectedBackground === bg.id 
                    ? 'border-[#B89555] ring-2 ring-gold/50' 
                    : 'border-[#1A1A1A] hover:border-[#B89555]/30'
                }`}
              >
                {bg.type === 'none' ? (
                  <div className="absolute inset-0 bg-[#1A1A1A] flex items-center justify-center">
                    <X className="h-4 w-4 text-white/70" />
                  </div>
                ) : bg.type === 'blur' ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center">
                    <span className="text-[8px] text-white/85">Blur</span>
                  </div>
                ) : (
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-zinc-600 to-zinc-800"
                    style={{ 
                      backgroundImage: bg.preview ? `url(${bg.preview})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                )}
                {selectedBackground === bg.id && (
                  <div className="absolute inset-0 bg-[#EFE6D6]/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-[#1A1A1A]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* AI Background Generator */}
        <div className="pt-4 border-t border-[#1A1A1A]">
          <Label className="text-white/85 text-sm mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
            AI Background Generator
          </Label>
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Describe your ideal background...&#10;e.g., 'A modern glass office with Dubai skyline view at sunset'"
            className="bg-[#1A1A1A] border-[#1A1A1A] text-white min-h-[80px] text-sm resize-none"
          />
          <Button
            onClick={handleGenerateBackground}
            disabled={isGenerating || !aiPrompt.trim()}
            className="w-full mt-2 bg-gradient-to-r from-gold to-gold/80 text-[#1A1A1A] font-semibold hover:from-gold/90 hover:to-gold/70"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Background
              </>
            )}
          </Button>
        </div>

        {/* Generated Backgrounds */}
        {generatedBackgrounds.length > 0 && (
          <div>
            <Label className="text-white/85 text-sm mb-2 block">Your Generated Backgrounds</Label>
            <div className="grid grid-cols-4 gap-2">
              {generatedBackgrounds.map((bg, index) => (
                <button
                  key={bg}
                  onClick={() => onSelectBackground(bg)}
                  className={`relative aspect-video rounded-lg border-2 transition-all overflow-hidden ${
                    selectedBackground === bg 
                      ? 'border-[#B89555] ring-2 ring-gold/50' 
                      : 'border-[#1A1A1A] hover:border-[#B89555]/30'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  {selectedBackground === bg && (
                    <div className="absolute inset-0 bg-[#EFE6D6]/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-[#1A1A1A]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-white/90 text-center">
          AI-generated backgrounds require processing time
        </p>
      </CardContent>
    </Card>
  );
};

export default AIBackgroundGenerator;
