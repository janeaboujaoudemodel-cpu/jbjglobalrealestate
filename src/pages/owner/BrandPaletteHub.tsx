import React, { useState, useEffect } from 'react';
import { Palette, Save, RotateCcw, Eye, EyeOff, Sparkles, Check, Trash2, Clock, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBrandPalette, BrandPalette } from '@/contexts/BrandPaletteContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const PALETTE_KEYS: { key: keyof BrandPalette; label: string; description: string; example: string }[] = [
  { key: 'primary', label: 'Primary', description: 'Main brand color — buttons, links, headers', example: 'Buttons & active elements' },
  { key: 'secondary', label: 'Secondary', description: 'Supporting color — cards, borders, navigation', example: 'Navigation bar & footer' },
  { key: 'accent', label: 'Accent', description: 'Highlight color — badges, indicators, CTAs', example: 'Badges & highlights' },
  { key: 'background', label: 'Background', description: 'Page and section backgrounds', example: 'Page background' },
  { key: 'text', label: 'Text', description: 'Primary body and heading text color', example: 'Headings & body text' },
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
  const {
    palette, setPalettePreview, clearPreview, savePalette, previewPalette,
    savedPalettes, saveUserPalette, deleteUserPalette, activateUserPalette, revertToDefault,
  } = useBrandPalette();
  const { isOwner, user } = useAuth();
  const [draft, setDraft] = useState<BrandPalette>(palette);
  const [isPreviewing, setIsPreviewing] = useState(true); // Default ON for live preview
  const [isSaving, setIsSaving] = useState(false);
  const [paletteName, setPaletteName] = useState('My Palette');

  useEffect(() => {
    setDraft(palette);
  }, [palette]);

  // Auto-apply live preview on mount
  useEffect(() => {
    if (isPreviewing) {
      setPalettePreview(draft);
    }
    return () => clearPreview();
  }, []);

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
      if (isOwner) {
        await savePalette(draft);
        toast.success('Brand palette saved globally');
      } else {
        await saveUserPalette(paletteName, draft, true);
        toast.success('Personal palette saved & applied');
      }
      setIsPreviewing(false);
    } catch (e) {
      toast.error('Failed to save palette');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(palette);
    revertToDefault();
    setIsPreviewing(false);
    toast('Palette reverted to default');
  };

  const applyPreset = (preset: BrandPalette) => {
    setDraft(preset);
    if (isPreviewing) {
      setPalettePreview(preset);
    }
  };

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(palette);

  const isLightColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(40,33%,98%)] via-[hsl(38,30%,93%)] to-[hsl(36,25%,88%)]">
      {/* Header */}
      <div className="border-b-2 border-gold/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-gold/40 flex items-center justify-center">
                <Palette className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {isOwner ? 'Brand Color Palette' : 'Website Color Palette'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {isOwner
                    ? 'Manage your corporate brand identity — changes apply globally'
                    : 'Personalize your browsing experience — changes apply only to you'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={togglePreview}
                className={`border-gold/40 ${isPreviewing ? 'bg-gold/20 text-foreground' : 'text-muted-foreground'}`}
              >
                {isPreviewing ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {isPreviewing ? 'Stop Preview' : 'Live Preview'}
              </Button>
              <Button variant="outline" onClick={handleReset} className="border-gold/40 text-muted-foreground">
                <RotateCcw className="w-4 h-4 mr-2" />
                Revert
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-gold/40 text-foreground font-semibold hover:opacity-90"
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
            {/* Palette Name (non-owner) */}
            {!isOwner && (
              <div className="bg-card/80 border border-gold/20 rounded-2xl p-4">
                <Label className="text-foreground font-bold text-sm mb-2 block">Palette Name</Label>
                <Input
                  value={paletteName}
                  onChange={(e) => setPaletteName(e.target.value)}
                  placeholder="My Custom Theme"
                  className="bg-background border-gold/20 text-foreground"
                  maxLength={40}
                />
              </div>
            )}

            {/* Color Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {PALETTE_KEYS.map(({ key, label, description, example }) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card/80 border border-gold/20 rounded-2xl p-5 hover:border-gold/40 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {/* Color swatch — rounded to match card */}
                    <div className="relative group">
                      <input
                        type="color"
                        value={draft[key]}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="w-14 h-14 rounded-2xl cursor-pointer border-2 border-gold/30 shadow-sm"
                        style={{ padding: 0 }}
                        title={`Click to change ${label}`}
                      />
                      {/* Color wheel indicator */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border border-gold/40 flex items-center justify-center pointer-events-none">
                        <CircleDot className="w-3 h-3 text-gold" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <Label className="text-foreground font-bold text-sm">{label}</Label>
                      <p className="text-muted-foreground text-xs mt-0.5">{description}</p>
                    </div>
                  </div>

                  {/* Example preview bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="flex-1 h-8 rounded-xl flex items-center justify-center text-[10px] font-semibold border border-gold/10"
                      style={{
                        backgroundColor: draft[key],
                        color: isLightColor(draft[key]) ? '#1A1A1A' : '#FFFFFF',
                      }}
                    >
                      {example}
                    </div>
                  </div>

                  {/* Hex code — owner only */}
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <Input
                        value={draft[key]}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) updateColor(key, v);
                        }}
                        className="font-mono text-sm bg-muted border-gold/20 text-foreground uppercase"
                        maxLength={7}
                      />
                      <div
                        className="w-10 h-10 rounded-xl border border-gold/30 flex-shrink-0"
                        style={{ backgroundColor: draft[key] }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Presets */}
            <div className="bg-card/80 border border-gold/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-gold" />
                <h3 className="font-bold text-foreground">Quick Presets</h3>
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
                          : 'border-gold/20 hover:border-gold/40 bg-card/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-foreground">{preset.name}</span>
                        {isActive && <Check className="w-3 h-3 text-gold" />}
                      </div>
                      <div className="flex gap-1">
                        {Object.values(preset.palette).map((color, i) => (
                          <div
                            key={i}
                            className="flex-1 h-6 rounded-lg"
                            style={{
                              backgroundColor: color,
                              border: ['#FDFBF7', '#F8F9FA', '#F5FBF7', '#FDF8F8', '#FAFAFA'].includes(color)
                                ? '1px solid hsl(var(--border))' : 'none'
                            }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Live Preview + History */}
          <div className="space-y-4">
            <div className="bg-card/80 border border-gold/20 rounded-2xl p-5 sticky top-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-gold" />
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
                <div className="px-4 py-3 flex items-center gap-2" style={{ backgroundColor: draft.secondary }}>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: draft.primary }} />
                  <div className="h-2 rounded w-16" style={{ backgroundColor: draft.primary, opacity: 0.7 }} />
                  <div className="ml-auto flex gap-1">
                    <div className="h-2 rounded w-8" style={{ backgroundColor: draft.accent }} />
                    <div className="h-2 rounded w-8" style={{ backgroundColor: draft.accent, opacity: 0.5 }} />
                  </div>
                </div>
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
                <div className="px-3 pb-4 grid grid-cols-2 gap-2" style={{ backgroundColor: draft.background }}>
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-lg p-3 border" style={{ borderColor: draft.primary + '40', backgroundColor: draft.background }}>
                      <div className="w-full h-10 rounded mb-2" style={{ backgroundColor: draft.accent + '30' }} />
                      <div className="h-2 rounded w-full mb-1" style={{ backgroundColor: draft.text, opacity: 0.3 }} />
                      <div className="h-2 rounded w-3/4" style={{ backgroundColor: draft.text, opacity: 0.2 }} />
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2" style={{ backgroundColor: draft.secondary }}>
                  <div className="h-1.5 rounded w-20 mx-auto" style={{ backgroundColor: draft.primary, opacity: 0.5 }} />
                </div>
              </div>

              {/* Swatch Strip */}
              <div className="mt-4 flex gap-1">
                {PALETTE_KEYS.map(({ key, label }) => (
                  <div key={key} className="flex-1 text-center">
                    <div
                      className="h-8 rounded-xl border border-gold/20 mb-1"
                      style={{ backgroundColor: draft[key] }}
                    />
                    <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
                  </div>
                ))}
              </div>

              {hasChanges && (
                <div className="mt-4 text-center">
                  <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-1 rounded-full">
                    Unsaved changes
                  </span>
                </div>
              )}
            </div>

            {/* Saved Palettes History */}
            {user && (
              <div className="bg-card/80 border border-gold/20 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold" />
                  {isOwner ? 'Saved Presets' : 'My Saved Palettes'}
                </h4>
                {savedPalettes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No saved palettes yet. Create one above!</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {savedPalettes.map((sp) => (
                      <div
                        key={sp.id}
                        className={`p-3 rounded-xl border transition-all ${
                          sp.is_active ? 'border-gold bg-gold/10' : 'border-gold/20 hover:border-gold/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{sp.name}</span>
                            {sp.is_active && (
                              <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Active</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {!sp.is_active && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[10px] text-gold hover:text-gold"
                                onClick={() => {
                                  activateUserPalette(sp.id);
                                  toast.success('Palette activated');
                                }}
                              >
                                Apply
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1.5 text-destructive hover:text-destructive"
                              onClick={() => {
                                deleteUserPalette(sp.id);
                                toast('Palette deleted');
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {Object.values(sp.palette).map((color, i) => (
                            <div
                              key={i}
                              className="flex-1 h-4 rounded"
                              style={{ backgroundColor: color as string }}
                            />
                          ))}
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">
                          {sp.created_at ? format(new Date(sp.created_at), 'MMM d, yyyy') : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div className="bg-card/80 border border-gold/20 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-foreground mb-2">
                {isOwner ? 'Palette Integration' : 'How It Works'}
              </h4>
              {isOwner ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your brand palette automatically applies to: Business Cards, E-Signatures, Company Stamps,
                  Letterheads, Cover Letters, Job Offers, CV Builder, Logo Maker, QR Codes, and Marketing Templates.
                  Other users have their own personal palette — your brand palette is private.
                </p>
              ) : (
                <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                  <p>
                    <strong>Click any color swatch</strong> or the <CircleDot className="w-3 h-3 inline text-gold" /> wheel icon
                    to open the color picker and choose your preferred color.
                  </p>
                  <p>
                    Changes preview in real-time across the website. Click <strong>Save Palette</strong> to keep your custom colors,
                    or <strong>Revert</strong> to go back to the default theme.
                  </p>
                  <p>Your saved palettes appear in the history — activate any previous palette anytime.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPaletteHub;
