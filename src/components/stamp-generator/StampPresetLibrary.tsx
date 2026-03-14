/**
 * StampPresetLibrary — Business/Legal stamp preset cards.
 * Click a preset to auto-fill the wizard form.
 */
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Building2, Scale, Home, Landmark, Shield, Award, FileText, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export interface PresetConfig {
  style_theme: string;
  border_style: string;
  typography_style: string;
  density: number;
  stamp_type: string;
  separator_style: string;
  icon_style: string;
  language_mode: string;
  show_license_number: boolean;
  show_location: boolean;
  government_mode?: boolean;
  arabic_font?: string;
  arc_text_spacing?: number;
  circle_gap?: number;
  center_content_size?: number;
}

export interface StampPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
  config: PresetConfig;
}

const BUILT_IN_PRESETS: StampPreset[] = [
  {
    id: 'corporate',
    name: 'Corporate Company',
    description: 'Traditional double-ring with serif typography for established businesses',
    icon: <Building2 size={16} />,
    tags: ['Professional', 'Classic'],
    config: {
      style_theme: 'CLASSIC', border_style: 'DOUBLE', typography_style: 'SERIF',
      density: 3, stamp_type: 'ROUND', separator_style: 'dot',
      icon_style: 'MONOGRAM', language_mode: 'BILINGUAL',
      show_license_number: false, show_location: true,
    },
  },
  {
    id: 'legal',
    name: 'Legal Office',
    description: 'Modern clean design with sans-serif font and registration number prominence',
    icon: <Scale size={16} />,
    tags: ['Legal', 'Modern'],
    config: {
      style_theme: 'MODERN', border_style: 'RING', typography_style: 'SANS',
      density: 4, stamp_type: 'ROUND', separator_style: 'diamond',
      icon_style: 'MONOGRAM', language_mode: 'BILINGUAL',
      show_license_number: true, show_location: true,
    },
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Luxury double-ring with gold accent and elegant serif for property firms',
    icon: <Home size={16} />,
    tags: ['Luxury', 'Property'],
    config: {
      style_theme: 'LUXURY', border_style: 'DOUBLE', typography_style: 'SERIF',
      density: 3, stamp_type: 'ROUND', separator_style: 'star',
      icon_style: 'MONOGRAM', language_mode: 'BILINGUAL',
      show_license_number: false, show_location: true,
    },
  },
  {
    id: 'notary',
    name: 'Notary Public',
    description: 'Bold heavy ring design with gothic typography for notary and legal seals',
    icon: <Shield size={16} />,
    tags: ['Notary', 'Bold'],
    config: {
      style_theme: 'BOLD', border_style: 'RING', typography_style: 'GOTHIC',
      density: 4, stamp_type: 'ROUND', separator_style: 'cross',
      icon_style: 'MONOGRAM', language_mode: 'BILINGUAL',
      show_license_number: true, show_location: true,
    },
  },
  {
    id: 'government',
    name: 'Government Official',
    description: 'Strict official format — thick outer ring, minimal decoration, centered layout',
    icon: <Landmark size={16} />,
    tags: ['Government', 'Official'],
    config: {
      style_theme: 'BOLD', border_style: 'RING', typography_style: 'SERIF',
      density: 5, stamp_type: 'ROUND', separator_style: 'line',
      icon_style: 'NONE', language_mode: 'BILINGUAL',
      show_license_number: false, show_location: true,
      government_mode: true,
    },
  },
  {
    id: 'seal',
    name: 'Official Seal',
    description: 'Ornate vintage design with rope border and calligraphic text for formal seals',
    icon: <Award size={16} />,
    tags: ['Vintage', 'Ornate'],
    config: {
      style_theme: 'VINTAGE', border_style: 'ROPE', typography_style: 'CALLIGRAPHY',
      density: 3, stamp_type: 'ROUND', separator_style: 'floral',
      icon_style: 'MONOGRAM', language_mode: 'BILINGUAL',
      show_license_number: false, show_location: true,
    },
  },
  {
    id: 'license',
    name: 'Company License',
    description: 'License number prominently displayed in center — ideal for trade license stamps',
    icon: <FileText size={16} />,
    tags: ['License', 'Trade'],
    config: {
      style_theme: 'CLASSIC', border_style: 'DOUBLE', typography_style: 'SERIF',
      density: 4, stamp_type: 'ROUND', separator_style: 'dot',
      icon_style: 'NONE', language_mode: 'BILINGUAL',
      show_license_number: true, show_location: true,
    },
  },
];

interface StampPresetLibraryProps {
  onSelectPreset: (config: PresetConfig, presetName: string) => void;
  selectedPresetId?: string | null;
}

export function StampPresetLibrary({ onSelectPreset, selectedPresetId }: StampPresetLibraryProps) {
  const [customPresets, setCustomPresets] = useState<StampPreset[]>(() => {
    try {
      const saved = localStorage.getItem('stamp-custom-presets');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets];

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    try { localStorage.setItem('stamp-custom-presets', JSON.stringify(updated)); } catch {}
    toast.success('Custom preset removed');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-[hsl(var(--foreground))]">Quick Start Presets</p>
        <p className="text-[8px] text-[hsl(var(--muted-foreground))]">Click to auto-fill</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5 max-h-[280px] overflow-y-auto pr-0.5">
        {allPresets.map(preset => {
          const isSelected = selectedPresetId === preset.id;
          const isCustom = customPresets.some(c => c.id === preset.id);
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.config, preset.name)}
              className={`relative text-left p-2.5 rounded-xl border-2 transition-all group ${
                isSelected
                  ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] shadow-sm'
                  : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)] hover:bg-[hsl(var(--gold)/0.03)]'
              }`}
            >
              {isSelected && <Check size={10} className="absolute top-1.5 right-1.5 text-[hsl(var(--gold))]" />}
              {isCustom && (
                <button onClick={(e) => handleDeleteCustom(preset.id, e)}
                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <X size={8} />
                </button>
              )}
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-[hsl(var(--gold)/0.2)] text-[hsl(var(--gold-dark))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                }`}>
                  {preset.icon}
                </div>
                <p className="text-[10px] font-semibold text-[hsl(var(--foreground))] leading-tight truncate">{preset.name}</p>
              </div>
              <p className="text-[8px] text-[hsl(var(--muted-foreground))] leading-snug line-clamp-2">{preset.description}</p>
              <div className="flex gap-1 mt-1.5">
                {preset.tags.map(tag => (
                  <span key={tag} className="text-[7px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] font-medium">{tag}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Save the current wizard form state as a custom preset to localStorage */
export function saveCustomPreset(name: string, config: PresetConfig): void {
  try {
    const saved = localStorage.getItem('stamp-custom-presets');
    const existing: StampPreset[] = saved ? JSON.parse(saved) : [];
    const newPreset: StampPreset = {
      id: `custom-${Date.now()}`,
      name,
      description: 'Custom saved preset',
      icon: null as any, // Will use Save icon as fallback
      tags: ['Custom'],
      config,
    };
    existing.push(newPreset);
    localStorage.setItem('stamp-custom-presets', JSON.stringify(existing));
    toast.success(`Preset "${name}" saved`);
  } catch {
    toast.error('Failed to save preset');
  }
}
