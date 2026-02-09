import { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoRedesignFormProps {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  designStyle: string;
  onDesignStyleChange: (style: string) => void;
  colorPalette: string;
  onColorPaletteChange: (palette: string) => void;
  customNotes: string;
  onCustomNotesChange: (notes: string) => void;
  onGenerate: () => void;
  isProcessing: boolean;
  canGenerate: boolean;
}

const designStyles = [
  { id: 'modern', label: 'Modern Contemporary', emoji: '🏢' },
  { id: 'classic', label: 'Classic Traditional', emoji: '🏛️' },
  { id: 'minimalist', label: 'Minimalist', emoji: '⬜' },
  { id: 'luxury', label: 'Luxury Opulent', emoji: '✨' },
  { id: 'industrial', label: 'Industrial Chic', emoji: '🏭' },
  { id: 'bohemian', label: 'Bohemian Eclectic', emoji: '🌿' },
];

const colorPalettes = [
  { id: 'neutral', name: 'Neutral & Warm', colors: ['#F5F5DC', '#D2B48C', '#8B7355'] },
  { id: 'cool', name: 'Cool & Serene', colors: ['#E0E5EC', '#B0C4DE', '#708090'] },
  { id: 'bold', name: 'Bold & Vibrant', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'] },
  { id: 'earthy', name: 'Earthy & Natural', colors: ['#8B7765', '#6B8E23', '#DEB887'] },
  { id: 'monochrome', name: 'Monochrome', colors: ['#2C2C2C', '#808080', '#F0F0F0'] },
  { id: 'luxury', name: 'Luxury Gold', colors: ['#A8925A', '#1C1C1C', '#F5F5F5'] },
];

const PhotoRedesignForm = ({
  photos,
  onPhotosChange,
  designStyle,
  onDesignStyleChange,
  colorPalette,
  onColorPaletteChange,
  customNotes,
  onCustomNotesChange,
  onGenerate,
  isProcessing,
  canGenerate,
}: PhotoRedesignFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    const newPhotos = [...photos, ...validFiles].slice(0, 4);
    onPhotosChange(newPhotos);

    // Generate previews
    newPhotos.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => {
          const updated = [...prev];
          updated[index] = e.target?.result as string;
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });

    toast.success(`${validFiles.length} photo(s) added`);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Photo Upload */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Camera className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Upload Your Room Photos</h3>
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            Required
          </Badge>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          multiple
          className="hidden"
        />

        {/* Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
              <img
                src={preview}
                alt={`Room photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
          
          {photos.length < 4 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-blue-500/50 flex flex-col items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-8 h-8 text-zinc-500" />
              <span className="text-xs text-zinc-500">Add Photo</span>
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-500">
          Upload up to 4 photos of your room. The AI will transform them based on your style preferences.
        </p>
      </div>

      {/* Design Style */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Wand2 className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Target Design Style</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {designStyles.map((style) => {
            const isSelected = designStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onDesignStyleChange(style.id)}
                className={`
                  p-4 rounded-xl border text-center transition-all
                  ${isSelected
                    ? 'bg-purple-500/20 border-purple-500/50 text-white'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                  }
                `}
              >
                <span className="text-2xl mb-2 block">{style.emoji}</span>
                <span className="text-xs font-medium">{style.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Palette */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
          <h3 className="text-lg font-semibold text-white">Color Palette</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {colorPalettes.map((palette) => {
            const isSelected = colorPalette === palette.id;
            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => onColorPaletteChange(palette.id)}
                className={`
                  p-4 rounded-xl border transition-all
                  ${isSelected
                    ? 'bg-zinc-800/80 border-white/30'
                    : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                  }
                `}
              >
                <div className="flex gap-1 mb-3 justify-center">
                  {palette.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-zinc-600"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <span className="text-xs text-zinc-300 font-medium">{palette.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Notes */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-lg font-semibold text-white">Redesign Instructions</h3>
          <Badge className="bg-zinc-700 text-zinc-300">Optional</Badge>
        </div>
        
        <Textarea
          value={customNotes}
          onChange={(e) => onCustomNotesChange(e.target.value)}
          placeholder="Describe what you'd like to change: remove furniture, add plants, change lighting, update color scheme..."
          className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[100px]"
          maxLength={1000}
        />
      </div>

      {/* Generate Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={onGenerate}
          disabled={isProcessing || !canGenerate || photos.length === 0}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/25"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
              Redesigning Room...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Transform My Room
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PhotoRedesignForm;
