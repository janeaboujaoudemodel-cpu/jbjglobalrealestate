import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StampSVGRenderer } from './StampSVGRenderer';
import DesignFavoriteButton from '@/components/toolkit/DesignFavoriteButton';
import ShortlistBadgeButton from '@/components/ShortlistBadgeButton';
import { toast } from 'sonner';
import {
  Wand2, Loader2, X, Check, Trash2, Copy, ChevronLeft
} from 'lucide-react';
import { StampDesignConcept } from '@/lib/stampTemplates';

interface StampVariationsPanelProps {
  variations: StampDesignConcept[];
  loading: boolean;
  tintColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  inkMode?: boolean;
  onSelectVariation: (v: StampDesignConcept) => void;
  onDeleteVariation: (id: string) => void;
  onDuplicateVariation: (v: StampDesignConcept) => void;
  onClose: () => void;
  onGenerate: () => void;
}

export function StampVariationsPanel({
  variations,
  loading,
  tintColor,
  secondaryColor,
  accentColor,
  fontFamily,
  inkMode,
  onSelectVariation,
  onDeleteVariation,
  onDuplicateVariation,
  onClose,
  onGenerate,
}: StampVariationsPanelProps) {
  const [selectedVarId, setSelectedVarId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--pearl-1))] to-white">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="w-6 h-6 rounded-md border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)]">
            <ChevronLeft size={12} />
          </button>
          <Wand2 size={14} className="text-[hsl(var(--gold))]" />
          <span className="font-semibold text-xs text-[hsl(var(--foreground))]">AI Variations</span>
          <Badge className="text-[8px] px-1.5 py-0 bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]">
            {variations.length} generated
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={onGenerate} disabled={loading}
            className="h-7 text-[10px] gap-1 border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))]">
            <Wand2 size={10} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Generating…' : 'More Variations'}
          </Button>
          <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-[hsl(var(--muted))] flex items-center justify-center">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && variations.length === 0 && (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-52 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && variations.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Wand2 size={32} className="text-[hsl(var(--gold))] mx-auto opacity-50" />
            <p className="text-[hsl(var(--muted-foreground))] text-sm">Generate AI variations of your current design</p>
            <Button onClick={onGenerate} className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white gap-1.5">
              <Wand2 size={14} /> Generate Variations
            </Button>
          </div>
        )}

        {variations.length > 0 && (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {variations.map(v => {
              const isSelected = selectedVarId === v.id;
              return (
                <div key={v.id}
                  className={`group bg-card/80 rounded-xl border-2 transition-all shadow-sm hover:shadow-md cursor-pointer ${isSelected ? 'border-[hsl(var(--gold))] shadow-[0_0_0_3px_hsl(var(--gold)/0.15)]' : 'border-[hsl(var(--gold)/0.3)] hover:border-[hsl(var(--gold)/0.5)]'}`}
                  onClick={() => setSelectedVarId(v.id)}
                >
                  <div className="relative p-3 flex items-center justify-center bg-[hsl(var(--pearl-1))] rounded-t-xl min-h-[130px]">
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center z-10">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                    <StampSVGRenderer svgSource={v.svgSource} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} inkMode={inkMode} size={120} />
                  </div>
                  <div className="p-2 space-y-1.5">
                    <p className="font-medium text-[10px] text-[hsl(var(--foreground))] truncate">{v.label}</p>
                    <div className="flex items-center gap-1">
                      <DesignFavoriteButton itemType="stamp" itemId={v.id} itemName={v.label} thumbnailSvg={v.svgSource.slice(0, 50000)} size="sm" showShortlist={false} className="flex-shrink-0" />
                      <ShortlistBadgeButton projectId={v.id} size="sm" showBadgeIndicator={false} className="flex-shrink-0" />
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm"
                        className="flex-1 h-6 text-[9px] gap-0.5 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90"
                        onClick={e => { e.stopPropagation(); onSelectVariation(v); }}>
                        <Check size={8} /> Apply
                      </Button>
                      <button onClick={e => { e.stopPropagation(); onDuplicateVariation(v); }}
                        className="h-6 w-6 rounded-md border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] text-[hsl(var(--muted-foreground))]">
                        <Copy size={9} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); onDeleteVariation(v.id); }}
                        className="h-6 w-6 rounded-md border border-destructive/30 flex items-center justify-center hover:bg-destructive/10 text-destructive/70">
                        <Trash2 size={9} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading && variations.length > 0 && (
          <div className="flex items-center justify-center py-4 gap-2 text-[hsl(var(--muted-foreground))]">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">Generating more…</span>
          </div>
        )}
      </div>
    </div>
  );
}
