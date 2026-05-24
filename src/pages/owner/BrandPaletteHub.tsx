import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Palette, Save, RotateCcw, Eye, EyeOff, Sparkles, Check, Trash2, Clock, CircleDot, Download, ChevronDown, Pencil, Plus, FolderOpen, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBrandPalette, BrandPalette } from '@/contexts/BrandPaletteContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { BrandMonogram } from '@/components/BrandMonogram';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

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
    palette: { primary: '#B89555', secondary: '#000000', accent: '#D4AF37', background: '#FDFBF7', text: '#1A1A1A' },
  },
  {
    name: 'Royal Navy',
    palette: { primary: '#1B3A5C', secondary: '#0D1B2A', accent: '#B89555', background: '#F8F9FA', text: '#1A1A1A' },
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
    savedPalettes, saveUserPalette, deleteUserPalette, activateUserPalette, renameUserPalette, revertToDefault,
  } = useBrandPalette();
  const { isOwner, user } = useAuth();
  const [draft, setDraft] = useState<BrandPalette>(palette);
  const [isPreviewing, setIsPreviewing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [paletteName, setPaletteName] = useState('My Palette');
  const [isRenamingId, setIsRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showSaveNew, setShowSaveNew] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState('');

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

  // --- Color Harmony Helpers ---
  const hexToHsl = (hex: string): [number, number, number] => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    h = ((h % 360) + 360) % 360;
    const sN = s / 100, lN = l / 100;
    const a = sN * Math.min(lN, 1 - lN);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = lN - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const harmonySchemes = useMemo(() => {
    const [h, s, l] = hexToHsl(draft.primary);
    const lightBg = hslToHex(h, Math.min(s, 20), 97);
    const darkText = hslToHex(h, Math.min(s, 15), 12);

    return [
      {
        name: 'Complementary',
        desc: 'Opposite on the color wheel — high contrast',
        palette: {
          primary: draft.primary,
          secondary: hslToHex((h + 180) % 360, Math.max(s - 10, 20), Math.min(l + 5, 45)),
          accent: hslToHex((h + 210) % 360, Math.min(s + 10, 80), 55),
          background: lightBg,
          text: darkText,
        } as BrandPalette,
      },
      {
        name: 'Analogous',
        desc: 'Adjacent hues — harmonious & warm',
        palette: {
          primary: draft.primary,
          secondary: hslToHex((h + 30) % 360, s, Math.min(l + 5, 45)),
          accent: hslToHex((h - 30 + 360) % 360, Math.min(s + 15, 85), 55),
          background: lightBg,
          text: darkText,
        } as BrandPalette,
      },
      {
        name: 'Triadic',
        desc: 'Three evenly spaced — vibrant & balanced',
        palette: {
          primary: draft.primary,
          secondary: hslToHex((h + 120) % 360, Math.max(s - 10, 25), Math.min(l + 5, 45)),
          accent: hslToHex((h + 240) % 360, Math.min(s + 5, 75), 55),
          background: lightBg,
          text: darkText,
        } as BrandPalette,
      },
    ];
  }, [draft.primary]);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const exportJSON = useCallback(() => {
    const json = JSON.stringify(draft, null, 2);
    downloadBlob(new Blob([json], { type: 'application/json' }), 'brand-palette.json');
    toast.success('Palette exported as JSON');
  }, [draft, downloadBlob]);

  const exportCSS = useCallback(() => {
    const css = `:root {\n${PALETTE_KEYS.map(({ key }) => `  --brand-${key}: ${draft[key]};`).join('\n')}\n}`;
    downloadBlob(new Blob([css], { type: 'text/css' }), 'brand-palette.css');
    toast.success('Palette exported as CSS');
  }, [draft, downloadBlob]);

  const exportPNG = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 100;
    PALETTE_KEYS.forEach(({ key, label }, i) => {
      ctx.fillStyle = draft[key];
      ctx.fillRect(i * w, 0, w, 100);
      ctx.fillStyle = isLightColor(draft[key]) ? '#000' : '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, i * w + w / 2, 55);
      ctx.font = '10px monospace';
      ctx.fillText(draft[key], i * w + w / 2, 72);
    });
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, 'brand-palette-swatch.png');
        toast.success('Palette exported as PNG swatch');
      }
    });
  }, [draft, downloadBlob]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(40,33%,98%)] via-[hsl(38,30%,93%)] to-[hsl(36,25%,88%)]">
      {/* Header */}
      <div className="border-b-2 border-[#B89555]/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-[#B89555]/40 flex items-center justify-center">
                <Palette className="w-6 h-6 text-[#1A1A1A]" />
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
                className={`border-[#B89555]/40 ${isPreviewing ? 'bg-[#EFE6D6]/20 text-foreground' : 'text-muted-foreground'}`}
              >
                {isPreviewing ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {isPreviewing ? 'Stop Preview' : 'Live Preview'}
              </Button>
              <Button variant="outline" onClick={handleReset} className="border-[#B89555]/40 text-muted-foreground">
                <RotateCcw className="w-4 h-4 mr-2" />
                Revert
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-[#B89555]/40 text-muted-foreground">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportJSON}>Export as JSON</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportCSS}>Export as CSS Variables</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPNG}>Export as PNG Swatch</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-[#B89555]/40 text-foreground font-semibold hover:opacity-90"
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
            {/* Palette Manager */}
            <div className="bg-card/80 border border-[#B89555]/20 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FolderOpen className="w-4 h-4 text-[#1A1A1A] flex-shrink-0" />
                  <Label className="text-foreground font-bold text-sm whitespace-nowrap">Active Palette</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-[#B89555]/30 text-foreground text-sm h-9 min-w-[160px] justify-between">
                        <span className="truncate">
                          {savedPalettes.find(sp => sp.is_active)?.name ?? (isOwner ? 'Brand Default' : 'Unsaved')}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 ml-2 text-muted-foreground flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        {savedPalettes.length} saved palette{savedPalettes.length !== 1 ? 's' : ''}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {savedPalettes.map((sp) => (
                        <DropdownMenuItem
                          key={sp.id}
                          className="flex items-center gap-2 py-2.5"
                          onClick={() => {
                            activateUserPalette(sp.id);
                            setDraft(sp.palette);
                            if (isPreviewing) setPalettePreview(sp.palette);
                            toast.success(`"${sp.name}" activated`);
                          }}
                        >
                          <div className="flex gap-0.5 flex-shrink-0">
                            {Object.values(sp.palette).map((c, i) => (
                              <div key={i} className="w-3.5 h-3.5 rounded-sm border border-[#B89555]/20" style={{ backgroundColor: c as string }} />
                            ))}
                          </div>
                          <span className="flex-1 truncate text-xs font-medium">{sp.name}</span>
                          {sp.is_active && <Check className="w-3.5 h-3.5 text-[#1A1A1A] flex-shrink-0" />}
                        </DropdownMenuItem>
                      ))}
                      {savedPalettes.length === 0 && (
                        <div className="px-2 py-3 text-center text-xs text-muted-foreground italic">No saved palettes yet</div>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { setShowSaveNew(true); setNewPaletteName(''); }}>
                        <Plus className="w-3.5 h-3.5 mr-2" />
                        <span className="text-xs font-medium">Save Current as New…</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Save New Palette Inline */}
              {showSaveNew && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 flex items-center gap-2">
                  <Input
                    value={newPaletteName}
                    onChange={(e) => setNewPaletteName(e.target.value)}
                    placeholder="Enter palette name…"
                    className="bg-background border-[#B89555]/20 text-foreground text-sm h-9 flex-1"
                    maxLength={40}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newPaletteName.trim()) {
                        saveUserPalette(newPaletteName.trim(), draft, true);
                        setShowSaveNew(false);
                        toast.success(`"${newPaletteName.trim()}" saved`);
                      }
                      if (e.key === 'Escape') setShowSaveNew(false);
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-9 bg-[#EFE6D6]/20 text-foreground border border-[#B89555]/30 hover:bg-[#EFE6D6]/30"
                    disabled={!newPaletteName.trim()}
                    onClick={() => {
                      saveUserPalette(newPaletteName.trim(), draft, true);
                      setShowSaveNew(false);
                      toast.success(`"${newPaletteName.trim()}" saved`);
                    }}
                  >
                    <Save className="w-3.5 h-3.5 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 text-muted-foreground" onClick={() => setShowSaveNew(false)}>
                    Cancel
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Color Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {PALETTE_KEYS.map(({ key, label, description, example }) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card/80 border border-[#B89555]/20 rounded-2xl p-5 hover:border-[#B89555]/40 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {/* Color swatch — rounded to match card */}
                    <div className="relative group cursor-pointer">
                      <label className="cursor-pointer block">
                        <input
                          type="color"
                          value={draft[key]}
                          onChange={(e) => updateColor(key, e.target.value)}
                          className="w-14 h-14 rounded-2xl cursor-pointer border-2 border-[#B89555]/30 shadow-sm"
                          style={{ padding: 0 }}
                          title={`Click to change ${label}`}
                        />
                      </label>
                      {/* Prominent color wheel indicator with tooltip */}
                      <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border-2 border-[#B89555]/40 flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition-transform" title="Click to change color">
                        <CircleDot className="w-3.5 h-3.5 text-[#1A1A1A]" />
                        <input
                          type="color"
                          value={draft[key]}
                          onChange={(e) => updateColor(key, e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </label>
                    </div>
                    <div className="flex-1">
                      <Label className="text-foreground font-bold text-sm">{label}</Label>
                      <p className="text-muted-foreground text-xs mt-0.5">{description}</p>
                    </div>
                  </div>

                  {/* Example preview bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="flex-1 h-8 rounded-xl flex items-center justify-center text-[10px] font-semibold border border-[#B89555]/10"
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
                        className="font-mono text-sm bg-muted border-[#B89555]/20 text-foreground uppercase"
                        maxLength={7}
                      />
                      <div
                        className="w-10 h-10 rounded-xl border border-[#B89555]/30 flex-shrink-0"
                        style={{ backgroundColor: draft[key] }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Presets */}
            <div className="bg-card/80 border border-[#B89555]/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
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
                          ? 'border-[#B89555] bg-[#EFE6D6]/10'
                          : 'border-[#B89555]/20 hover:border-[#B89555]/40 bg-card/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-foreground">{preset.name}</span>
                        {isActive && <Check className="w-3 h-3 text-[#1A1A1A]" />}
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
            <div className="bg-card/80 border border-[#B89555]/20 rounded-2xl p-5 sticky top-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#1A1A1A]" />
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
                      className="h-8 rounded-xl border border-[#B89555]/20 mb-1"
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

            {/* Monogram Preview */}
            <div className="bg-card/80 border border-[#B89555]/20 rounded-2xl p-5">
              <h3 className="font-bold text-foreground mb-4 text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#1A1A1A]" />
                Monogram Preview
              </h3>
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-full rounded-xl p-6 flex items-center justify-center border border-[#B89555]/20"
                  style={{ backgroundColor: draft.secondary }}
                >
                  <BrandMonogram variant="dark" size="lg" showWordmark />
                </div>
                <div
                  className="w-full rounded-xl p-6 flex items-center justify-center border border-[#B89555]/20"
                  style={{ backgroundColor: draft.background }}
                >
                  <BrandMonogram variant="light" size="lg" showWordmark />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 text-center">
                Preview how the monogram looks on dark &amp; light backgrounds
              </p>
            </div>

            {/* Color Harmony Generator */}
            <div className="bg-card/80 border border-[#B89555]/20 rounded-2xl p-5">
              <h3 className="font-bold text-foreground mb-1 text-sm flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-[#1A1A1A]" />
                Color Harmony
              </h3>
              <p className="text-[10px] text-muted-foreground mb-4">
                Schemes based on your primary color
                <span
                  className="inline-block w-3 h-3 rounded-sm border border-[#B89555]/30 ml-1.5 align-middle"
                  style={{ backgroundColor: draft.primary }}
                />
              </p>
              <div className="space-y-3">
                {harmonySchemes.map((scheme) => (
                  <div key={scheme.name} className="rounded-xl border border-[#B89555]/15 p-3 bg-card/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-foreground">{scheme.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-[10px] text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
                        onClick={() => {
                          setDraft(scheme.palette);
                          if (isPreviewing) setPalettePreview(scheme.palette);
                          toast.success(`${scheme.name} scheme applied`);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                    <p className="text-[9px] text-muted-foreground mb-2">{scheme.desc}</p>
                    <div className="flex gap-0.5">
                      {PALETTE_KEYS.map(({ key }) => (
                        <div
                          key={key}
                          className="flex-1 h-5 rounded-md border border-[#B89555]/10"
                          style={{ backgroundColor: scheme.palette[key] }}
                          title={`${key}: ${scheme.palette[key]}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Palettes Manager */}
            {user && (
              <div className="bg-card/80 border border-[#B89555]/20 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1A1A1A]" />
                  {isOwner ? 'Saved Presets' : 'My Saved Palettes'}
                  <span className="ml-auto text-[10px] text-muted-foreground font-normal">{savedPalettes.length} saved</span>
                </h4>
                {savedPalettes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No saved palettes yet. Use the dropdown above to save one!</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {savedPalettes.map((sp) => (
                      <div
                        key={sp.id}
                        className={`p-3 rounded-xl border transition-all ${
                          sp.is_active ? 'border-[#B89555] bg-[#EFE6D6]/10' : 'border-[#B89555]/20 hover:border-[#B89555]/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isRenamingId === sp.id ? (
                              <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                className="h-6 text-xs bg-background border-[#B89555]/20 text-foreground px-2"
                                maxLength={40}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && renameValue.trim()) {
                                    renameUserPalette(sp.id, renameValue.trim());
                                    setIsRenamingId(null);
                                    toast.success('Palette renamed');
                                  }
                                  if (e.key === 'Escape') setIsRenamingId(null);
                                }}
                                onBlur={() => {
                                  if (renameValue.trim() && renameValue.trim() !== sp.name) {
                                    renameUserPalette(sp.id, renameValue.trim());
                                    toast.success('Palette renamed');
                                  }
                                  setIsRenamingId(null);
                                }}
                              />
                            ) : (
                              <>
                                <span className="text-xs font-semibold text-foreground truncate">{sp.name}</span>
                                {sp.is_active && (
                                  <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0">Active</span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex gap-0.5 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-[#1A1A1A]"
                              title="Rename"
                              onClick={() => {
                                setIsRenamingId(sp.id);
                                setRenameValue(sp.name);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            {!sp.is_active && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[10px] text-[#1A1A1A] hover:text-[#1A1A1A]"
                                onClick={() => {
                                  activateUserPalette(sp.id);
                                  setDraft(sp.palette);
                                  if (isPreviewing) setPalettePreview(sp.palette);
                                  toast.success('Palette activated');
                                }}
                              >
                                Apply
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              title="Delete"
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
            <div className="bg-card/80 border border-[#B89555]/20 rounded-2xl p-5">
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
                    <strong>Click any color swatch</strong> or the <CircleDot className="w-3 h-3 inline text-[#1A1A1A]" /> wheel icon
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
