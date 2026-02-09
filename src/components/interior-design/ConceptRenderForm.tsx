import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wand2 } from 'lucide-react';

interface ConceptRenderFormProps {
  designStyle: string;
  onDesignStyleChange: (style: string) => void;
  colorPalette: string;
  onColorPaletteChange: (palette: string) => void;
  purpose: string;
  onPurposeChange: (purpose: string) => void;
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
  { id: 'scandinavian', label: 'Scandinavian', emoji: '🪵' },
  { id: 'art_deco', label: 'Art Deco', emoji: '🎭' },
];

const colorPalettes = [
  { id: 'neutral', name: 'Neutral & Warm', colors: ['#F5F5DC', '#D2B48C', '#8B7355'] },
  { id: 'cool', name: 'Cool & Serene', colors: ['#E0E5EC', '#B0C4DE', '#708090'] },
  { id: 'bold', name: 'Bold & Vibrant', colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'] },
  { id: 'earthy', name: 'Earthy & Natural', colors: ['#8B7765', '#6B8E23', '#DEB887'] },
  { id: 'monochrome', name: 'Monochrome Elegance', colors: ['#2C2C2C', '#808080', '#F0F0F0'] },
  { id: 'luxury', name: 'Luxury Gold', colors: ['#A8925A', '#1C1C1C', '#F5F5F5'] },
];

const purposes = [
  { id: 'personal', label: 'Personal Residence', emoji: '🏠' },
  { id: 'business', label: 'Business / Office', emoji: '💼' },
  { id: 'rental', label: 'Investment / Rental', emoji: '💰' },
  { id: 'hospitality', label: 'Hospitality / Hotel', emoji: '🏨' },
];

const ConceptRenderForm = ({
  designStyle,
  onDesignStyleChange,
  colorPalette,
  onColorPaletteChange,
  purpose,
  onPurposeChange,
  customNotes,
  onCustomNotesChange,
  onGenerate,
  isProcessing,
  canGenerate,
}: ConceptRenderFormProps) => {
  return (
    <div className="w-full space-y-6">
      {/* Design Style */}
      <div className="bg-zinc-900/60 border border-fuchsia-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <Wand2 className="w-5 h-5 text-fuchsia-400" />
          <h3 className="text-lg font-semibold text-white">Design Style</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                    ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-white'
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
      <div className="bg-zinc-900/60 border border-fuchsia-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500" />
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
                    ? 'bg-fuchsia-500/20 border-fuchsia-500/50'
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

      {/* Purpose */}
      <div className="bg-zinc-900/60 border border-fuchsia-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-lg font-semibold text-white">Purpose</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {purposes.map((p) => {
            const isSelected = purpose === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPurposeChange(p.id)}
                className={`
                  p-4 rounded-xl border text-center transition-all
                  ${isSelected
                    ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-white'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                  }
                `}
              >
                <span className="text-2xl mb-2 block">{p.emoji}</span>
                <span className="text-xs font-medium">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Notes */}
      <div className="bg-zinc-900/60 border border-fuchsia-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-lg font-semibold text-white">Additional Notes</h3>
          <Badge className="bg-zinc-700 text-zinc-300">Optional</Badge>
        </div>
        
        <Textarea
          value={customNotes}
          onChange={(e) => onCustomNotesChange(e.target.value)}
          placeholder="Describe any specific features you want: floor-to-ceiling windows, marble floors, gold accents, specific furniture pieces, lighting preferences..."
          className="bg-zinc-800/50 border-zinc-600 text-white placeholder:text-zinc-500 min-h-[120px] focus:border-fuchsia-500/50"
          maxLength={1000}
        />
        <p className="text-xs text-zinc-500 mt-2 text-right">
          {customNotes.length}/1000 characters
        </p>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={onGenerate}
          disabled={isProcessing || !canGenerate}
          variant="ai-fuchsia"
          size="lg"
          className="px-8 py-6 text-lg rounded-xl"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
              Generating Design...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Concept Design
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConceptRenderForm;
