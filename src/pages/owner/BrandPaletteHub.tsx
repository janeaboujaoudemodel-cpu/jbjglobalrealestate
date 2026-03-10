import React, { useState, useEffect } from 'react';
import { Palette, Save, RotateCcw, Eye, EyeOff, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBrandPalette, BrandPalette } from '@/contexts/BrandPaletteContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const PALETTE_KEYS: { key: keyof BrandPalette; label: string; description: string }[] = [
  { key: 'primary', label: 'Primary', description: 'Main brand color — buttons, links, headers' },
  { key: 'secondary', label: 'Secondary', description: 'Supporting color — cards, borders, navigation' },
  { key: 'accent', label: 'Accent', description: 'Highlight color — badges, indicators, CTAs' },
  { key: 'background', label: 'Background', description: 'Page and section backgrounds' },
  { key: 'text', label: 'Text', description: 'Primary body and heading text color' },
];

const PRESET_PALETTES: { name: string; palette: BrandPalette }[] = [
  {
    name: 'JBJ Gold (Default)',
    palette: { primary: '#C8A766', secondary: '#000000', accent: '#D4AF37', background: '#FDFBF7', text: '#1A1A1A' },
  },
  {
    name: 'Royal Navy',
    palette: { primary: '#1B3A5C', secondary: '#0D1B2A', accent: '#C8A766', background: '#F8F9FA', text: '#1A1A1A' },
  },
  {
    name: 'Emerald Luxury',
    palette: { primary: '#2D6A4F', secondary: '#1B4332', accent: '#D4AF37', background: '#F5FBF7', text: '#1A1A1A' },
  },
  {
    name: 'Burgundy Elite',
    palette: { primary: '#7B2D3B', secondary: '#3D1520', accent: '#D4AF37', background: '#FDF8F8', text: '#1A1A1A' },
  },
  {
    name: 'Midnight Platinum',
    palette: { primary: '#8B8B8B', secondary: '#2C2C2C', accent: '#E0E0E0', background: '#FAFAFA', text: '#1A1A1A' },
  },
];

const BrandPaletteHub = () => {
  const { palette, setPalettePreview, clearPreview, savePalette, previewPalette } = useBrandPalette();
  const [draft, setDraft] = useState<BrandPalette>(palette);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(palette);
  }, [palette]);

  // Cleanup preview on unmount
  useEffect(() => {
    return () => clearPreview();
  }, [clearPreview]);

  const updateColor = (key: keyof BrandPalette, value: string) => {
    const updated = { ...draft, [key]: value };
    setDraft(updated);
    if (isPreviewing) {
      setPalettePreview(updated);
    }
  };

  const togglePreview = () => {
    if (isPreviewing) {
      clearPreview();
      setIsPreviewing(false);
    } else {
      setPalettePreview(draft);
      setIsPreviewing(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await savePalette(draft);
      setIsPreviewing(false);
      toast.success('Brand palette saved successfully');
    } catch (e) {
      toast.error('Failed to save palette');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(palette);
    if (isPreviewing) {
      clearPreview();
      setIsPreviewing(false);
    }
    toast('Palette reset to saved version');
  };

  const applyPreset = (preset: BrandPalette) => {
    setDraft(preset);
    if (isPreviewing) {
      setPalettePreview(preset);
    }
  };

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(palette);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Header */}
      <div className="border-b-2 border-gold/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                <Palette className="w-6 h-6 text-[#8B7355]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-black">Brand Color Palette</h1>
                <p className="text-zinc-600 text-sm">Customize your brand identity — changes preview in real-time</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={togglePreview}
                className={`border-gold/40 ${isPreviewing ? 'bg-gold/20 text-black' : 'text-zinc-700'}`}
              >
                {isPreviewing ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {isPreviewing ? 'Stop Preview' : 'Live Preview'}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={!hasChanges} className="border-gold/40 text-zinc-700">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 text-black font-semibold hover:opacity-90"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving…' : 'Save Palette'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Color Pickers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Color Wheel Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {PALETTE_KEYS.map(({ key, label, description }) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 border border-gold/20 rounded-2xl p-5 hover:border-gold/40 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={draft[key]}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="w-14 h-14 rounded-xl cursor-pointer border-2 border-gold/30 shadow-sm"
                        style={{ padding: 0 }}
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-black font-bold text-sm">{label}</Label>
                      <p className="text-zinc-500 text-xs mt-0.5">{description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={draft[key]}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) updateColor(key, v);
                      }}
                      className="font-mono text-sm bg-zinc-50 border-gold/20 text-black uppercase"
                      maxLength={7}
                    />
                    <div
                      className="w-10 h-10 rounded-lg border border-gold/30 flex-shrink-0"
                      style={{ backgroundColor: draft[key] }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Presets */}
            <div className="bg-white/80 border border-gold/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#8B7355]" />
                <h3 className="font-bold text-black">Quick Presets</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PRESET_PALETTES.map((preset) => {
                  const isActive = JSON.stringify(draft) === JSON.stringify(preset.palette);
                  return (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset.palette)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        isActive
                          ? 'border-gold bg-gold/10'
                          : 'border-gold/20 hover:border-gold/40 bg-white/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-black">{preset.name}</span>
                        {isActive && <Check className="w-3 h-3 text-gold" />}
                      </div>
                      <div className="flex gap-1">
                        {Object.values(preset.palette).map((color, i) => (
                          <div
                            key={i}
                            className="flex-1 h-6 rounded"
                            style={{ backgroundColor: color, border: color === '#FDFBF7' || color === '#F8F9FA' || color === '#F5FBF7' || color === '#FDF8F8' || color === '#FAFAFA' ? '1px solid #e0d8c8' : 'none' }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="space-y-4">
            <div className="bg-white/80 border border-gold/20 rounded-2xl p-5 sticky top-6">
              <h3 className="font-bold text-black mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#8B7355]" />
                Preview
                {isPreviewing && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">LIVE</span>
                )}
              </h3>

              {/* Mini page mockup */}
              <div
                className="rounded-xl border-2 overflow-hidden"
                style={{ borderColor: draft.primary, backgroundColor: draft.background }}
              >
                {/* Header */}
                <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: draft.secondary }}>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: draft.primary }} />
                  <div className="h-2 rounded w-16" style={{ backgroundColor: draft.primary, opacity: 0.7 }} />
                  <div className="ml-auto flex gap-1">
                    <div className="h-2 rounded w-8" style={{ backgroundColor: draft.accent }} />
                    <div className="h-2 rounded w-8" style={{ backgroundColor: draft.accent, opacity: 0.5 }} />
                  </div>
                </div>

                {/* Hero */}
                <div className="px-4 py-6 text-center" style={{ backgroundColor: draft.background }}>
                  <div className="h-3 rounded w-32 mx-auto mb-2" style={{ backgroundColor: draft.text }} />
                  <div className="h-2 rounded w-48 mx-auto mb-4" style={{ backgroundColor: draft.text, opacity: 0.5 }} />
                  <div
                    className="h-8 rounded-lg w-24 mx-auto flex items-center justify-center text-[8px] font-bold"
                    style={{ backgroundColor: draft.primary, color: draft.background }}
                  >
                    CTA Button
                  </div>
                </div>

                {/* Cards */}
                <div className="px-3 pb-4 grid grid-cols-2 gap-2" style={{ backgroundColor: draft.background }}>
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-lg p-3 border" style={{ borderColor: draft.primary + '40', backgroundColor: draft.background }}>
                      <div className="w-full h-10 rounded mb-2" style={{ backgroundColor: draft.accent + '30' }} />
                      <div className="h-2 rounded w-full mb-1" style={{ backgroundColor: draft.text, opacity: 0.3 }} />
                      <div className="h-2 rounded w-3/4" style={{ backgroundColor: draft.text, opacity: 0.2 }} />
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-2" style={{ backgroundColor: draft.secondary }}>
                  <div className="h-1.5 rounded w-20 mx-auto" style={{ backgroundColor: draft.primary, opacity: 0.5 }} />
                </div>
              </div>

              {/* Swatch Strip */}
              <div className="mt-4 flex gap-1">
                {PALETTE_KEYS.map(({ key, label }) => (
                  <div key={key} className="flex-1 text-center">
                    <div
                      className="h-8 rounded-lg border border-gold/20 mb-1"
                      style={{ backgroundColor: draft[key] }}
                    />
                    <span className="text-[9px] text-zinc-500 font-medium">{label}</span>
                  </div>
                ))}
              </div>

              {/* Status */}
              {hasChanges && (
                <div className="mt-4 text-center">
                  <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-1 rounded-full">
                    Unsaved changes
                  </span>
                </div>
              )}
            </div>

            {/* Tool Integration Info */}
            <div className="bg-white/80 border border-gold/20 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-black mb-2">Palette Integration</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Your brand palette automatically applies to: Business Cards, E-Signatures, Company Stamps, 
                Letterheads, Cover Letters, Job Offers, CV Builder, Logo Maker, QR Codes, and Marketing Templates.
              </p>
              <p className="text-xs text-zinc-400 mt-2 italic">
                Other users have their own personal palette for tools — your brand palette is private to you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPaletteHub;
