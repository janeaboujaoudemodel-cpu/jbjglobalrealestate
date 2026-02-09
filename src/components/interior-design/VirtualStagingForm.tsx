import { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sofa, Upload, X, Sparkles, Bed, Armchair, Lamp, Table } from 'lucide-react';
import { toast } from 'sonner';

interface VirtualStagingFormProps {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  roomType: string;
  onRoomTypeChange: (type: string) => void;
  furnitureStyle: string;
  onFurnitureStyleChange: (style: string) => void;
  customNotes: string;
  onCustomNotesChange: (notes: string) => void;
  onGenerate: () => void;
  isProcessing: boolean;
  canGenerate: boolean;
}

const roomTypes = [
  { id: 'living_room', label: 'Living Room', icon: Sofa },
  { id: 'bedroom', label: 'Bedroom', icon: Bed },
  { id: 'dining_room', label: 'Dining Room', icon: Table },
  { id: 'office', label: 'Home Office', icon: Armchair },
  { id: 'lounge', label: 'Lounge Area', icon: Lamp },
];

const furnitureStyles = [
  { id: 'modern', label: 'Modern Minimalist', desc: 'Clean lines, neutral colors' },
  { id: 'luxury', label: 'Luxury Premium', desc: 'High-end furniture, rich textures' },
  { id: 'scandinavian', label: 'Scandinavian', desc: 'Light wood, cozy textiles' },
  { id: 'contemporary', label: 'Contemporary', desc: 'Current trends, balanced design' },
  { id: 'classic', label: 'Classic Elegant', desc: 'Traditional pieces, timeless style' },
  { id: 'industrial', label: 'Industrial Loft', desc: 'Metal accents, raw materials' },
];

const VirtualStagingForm = ({
  photos,
  onPhotosChange,
  roomType,
  onRoomTypeChange,
  furnitureStyle,
  onFurnitureStyleChange,
  customNotes,
  onCustomNotesChange,
  onGenerate,
  isProcessing,
  canGenerate,
}: VirtualStagingFormProps) => {
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
    <div className="w-full space-y-6">
      {/* Empty Room Photo Upload */}
      <div className="bg-zinc-900/60 border border-emerald-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <Sofa className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Upload Empty Room Photos</h3>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
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
                alt={`Empty room ${index + 1}`}
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
              className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-8 h-8 text-zinc-500" />
              <span className="text-xs text-zinc-500">Add Photo</span>
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-500">
          Upload photos of empty rooms. The AI will add furniture and decor based on your preferences.
        </p>
      </div>

      {/* Room Type */}
      <div className="bg-zinc-900/60 border border-emerald-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-lg font-semibold text-white">Room Type</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {roomTypes.map((room) => {
            const Icon = room.icon;
            const isSelected = roomType === room.id;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onRoomTypeChange(room.id)}
                className={`
                  p-4 rounded-xl border text-center transition-all
                  ${isSelected
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                  }
                `}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <span className="text-xs font-medium">{room.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Furniture Style */}
      <div className="bg-zinc-900/60 border border-emerald-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-lg font-semibold text-white">Furniture Style</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {furnitureStyles.map((style) => {
            const isSelected = furnitureStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onFurnitureStyleChange(style.id)}
                className={`
                  p-4 rounded-xl border text-left transition-all
                  ${isSelected
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                  }
                `}
              >
                <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                  {style.label}
                </span>
                <p className="text-xs text-zinc-500 mt-1">{style.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Notes */}
      <div className="bg-zinc-900/60 border border-emerald-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-lg font-semibold text-white">Staging Preferences</h3>
          <Badge className="bg-zinc-700 text-zinc-300">Optional</Badge>
        </div>
        
        <Textarea
          value={customNotes}
          onChange={(e) => onCustomNotesChange(e.target.value)}
          placeholder="Describe specific furniture you want: L-shaped sofa, marble coffee table, statement artwork, indoor plants..."
          className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-500 min-h-[100px] focus:border-emerald-500/50"
          maxLength={1000}
        />
      </div>

      {/* Generate Button */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={onGenerate}
          disabled={isProcessing || !canGenerate || photos.length === 0}
          variant="ai-emerald"
          size="lg"
          className="px-8 py-6 text-lg rounded-xl"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
              Staging Room...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Stage This Room
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default VirtualStagingForm;
