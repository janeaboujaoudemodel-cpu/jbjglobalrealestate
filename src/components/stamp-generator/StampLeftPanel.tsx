/**
 * StampLeftPanel — Collapsible accordion sections replacing the old 6-tab system.
 * Each section can be independently expanded/collapsed.
 */
import React, { useState, useCallback } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { StampColorWheel } from './StampColorWheel';
import { StampTextEditor } from './StampTextEditor';
import { MonogramColorEditor, DEFAULT_MONOGRAM_COLORS } from './MonogramColorEditor';
import type { MonogramLetterColors } from './MonogramColorEditor';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  RotateCw, Award, Upload, Wand2, Loader2, Palette, Type,
  CircleDot, Stamp, Layers, PenTool, Sparkles
} from 'lucide-react';

// 5 mandatory standard export colors
const STANDARD_EXPORT_COLORS = [
  { label: 'White', hex: '#ffffff' },
  { label: 'Black', hex: '#0d0d0d' },
  { label: 'Navy Ink', hex: '#1B3A8C' },
  { label: 'Brand Gold', hex: '#C8A766' },
  { label: 'Dark Gold', hex: '#B8860B' },
];

const PRESET_PALETTE = [
  { label: 'Ink Blue', hex: '#1B3A8C' },
  { label: 'Gold', hex: '#B8860B' },
  { label: 'Gold Dark', hex: '#856404' },
  { label: 'Navy', hex: '#1a2744' },
  { label: 'Black', hex: '#0d0d0d' },
  { label: 'White', hex: '#ffffff' },
  { label: 'Red', hex: '#8B0000' },
  { label: 'Purple', hex: '#4B0082' },
  { label: 'Forest', hex: '#1B4332' },
  { label: 'Copper', hex: '#7C4A00' },
  { label: 'Teal', hex: '#0D5C63' },
];

const PALETTE_PRESETS = [
  { label: 'Ink Blue (Standard)', primary: '#1B3A8C', secondary: '#1a2d6e', accent: '#1B3A8C' },
  { label: 'JBJ Gold', primary: '#B8860B', secondary: '#2a3a5c', accent: '#856404' },
  { label: 'Royal Navy', primary: '#1a2744', secondary: '#2a3a5c', accent: '#B8860B' },
  { label: 'Obsidian', primary: '#0d0d0d', secondary: '#333333', accent: '#B8860B' },
  { label: 'Crimson', primary: '#8B0000', secondary: '#5a0000', accent: '#B8860B' },
  { label: 'Forest', primary: '#1B4332', secondary: '#2d6a4f', accent: '#B8860B' },
  { label: 'Deep Purple', primary: '#4B0082', secondary: '#6a0dad', accent: '#C8A87A' },
  { label: 'Monochrome', primary: '#0d0d0d', secondary: '#333333', accent: '#ffffff' },
];

const STAMP_FONTS = [
  { label: 'Trajan (Elegant)', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Garamond (Classic)', value: '"Garamond", "Palatino Linotype", serif' },
  { label: 'Baskerville (Literary)', value: '"Baskerville", "Book Antiqua", serif' },
  { label: 'Caslon (Antiquarian)', value: '"Book Antiqua", "Palatino", Georgia, serif' },
  { label: 'Modern Sans', value: '"Arial", "Helvetica Neue", sans-serif' },
  { label: 'Futura (Geometric)', value: '"Century Gothic", "Trebuchet MS", sans-serif' },
  { label: 'Gill Sans (Humanist)', value: '"Gill Sans", "Gill Sans MT", "Optima", sans-serif' },
  { label: 'Verdana (Screen)', value: '"Verdana", "Tahoma", sans-serif' },
  { label: 'Courier (Monospace)', value: '"Courier New", "Courier", monospace' },
  { label: 'Impact (Display)', value: '"Impact", "Franklin Gothic Bold", sans-serif' },
  { label: 'Rockwell (Slab)', value: '"Rockwell", "Courier New", serif' },
  { label: 'Optima (Soft Elegant)', value: '"Optima", "Segoe UI", sans-serif' },
  { label: 'Cinzel (Imperial)', value: '"Palatino Linotype", "Palatino", serif' },
];

type ColorStop = 'primary' | 'secondary' | 'accent';

interface StampLeftPanelProps {
  // Colors
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  activeStop: ColorStop;
  activeColor: string;
  inkMode: boolean;
  customPalette: string[];
  onSetPrimaryColor: (v: string) => void;
  onSetSecondaryColor: (v: string | undefined) => void;
  onSetAccentColor: (v: string | undefined) => void;
  onSetActiveStop: (v: ColorStop) => void;
  onSetActiveColor: (v: string) => void;
  onSetInkMode: (v: boolean) => void;
  onAddCustomColor: (hex: string) => void;
  onRemoveCustomColor: (hex: string) => void;
  onResetColors: () => void;
  // Fonts
  fontFamily: string;
  fontBold: boolean;
  fontItalic: boolean;
  manualFontSize: number | null;
  onSetFontFamily: (v: string) => void;
  onSetFontBold: (v: boolean | ((p: boolean) => boolean)) => void;
  onSetFontItalic: (v: boolean | ((p: boolean) => boolean)) => void;
  onSetManualFontSize: (v: number | null | ((p: number | null) => number | null)) => void;
  // Text
  selectedSvg: string | null;
  selectedConceptId: string | null;
  onSvgTextChange: (conceptId: string, newSvg: string) => void;
  // Center Art
  localIconStyle: 'NONE' | 'MONOGRAM' | 'UPLOADED_LOGO';
  localMonogramText: string;
  localLogoUrl: string;
  monogramLetterColors: MonogramLetterColors;
  companyName?: string;
  onSetLocalIconStyle: (v: 'NONE' | 'MONOGRAM' | 'UPLOADED_LOGO') => void;
  onSetLocalMonogramText: (v: string) => void;
  onSetLocalLogoUrl: (v: string) => void;
  onSetMonogramLetterColors: (v: MonogramLetterColors) => void;
  onApplyLogoToAll: () => void;
  // My Stamp
  uploadedStampUrl: string;
  uploadedSignatureUrl: string;
  signatureX: number;
  signatureY: number;
  signatureLocked: boolean;
  refinePrompt: string;
  refiningImage: boolean;
  onSetUploadedStampUrl: (v: string) => void;
  onSetUploadedSignatureUrl: (v: string) => void;
  onSetSignatureX: (v: number) => void;
  onSetSignatureY: (v: number) => void;
  onSetSignatureLocked: (v: boolean) => void;
  onSetRefinePrompt: (v: string) => void;
  onRefineWithAI: () => void;
  hasSelectedSvg: boolean;
}

export function StampLeftPanel(props: StampLeftPanelProps) {
  const [openSections, setOpenSections] = useState<string[]>(['colors', 'text']);

  const stopDefs: { key: ColorStop; label: string; color: string }[] = [
    { key: 'primary', label: 'Primary', color: props.primaryColor },
    { key: 'secondary', label: 'Secondary', color: props.secondaryColor || '#2a3a5c' },
    { key: 'accent', label: 'Accent', color: props.accentColor || '#B8860B' },
  ];

  return (
    <div className="w-[280px] flex-shrink-0 border-r border-[hsl(var(--border))] bg-white/80 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-3 py-2 border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--pearl-1))] to-white">
        <div className="flex items-center gap-1.5">
          <Layers size={12} className="text-[hsl(var(--gold))]" />
          <span className="text-[10px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">Tool Controls</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="px-2 py-1">

          {/* ─── 1. Company Name Arcs ─── */}
          <AccordionItem value="text" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Type size={12} className="text-[hsl(var(--gold))]" />
                Company Name Arcs
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              {props.selectedSvg && props.selectedConceptId ? (
                <StampTextEditor
                  svgSource={props.selectedSvg}
                  onSvgChange={(newSvg) => props.onSvgTextChange(props.selectedConceptId!, newSvg)}
                />
              ) : (
                <div className="text-center py-4 space-y-1">
                  <Type size={16} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-40" />
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Select a stamp to edit text</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ─── 2. Center Content ─── */}
          <AccordionItem value="center" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <CircleDot size={12} className="text-[hsl(var(--gold))]" />
                Center Content
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2.5">
              <div className="space-y-1">
                {([
                  { val: 'MONOGRAM' as const, label: 'Monogram' },
                  { val: 'UPLOADED_LOGO' as const, label: 'Upload Logo' },
                  { val: 'NONE' as const, label: 'No Art' },
                ] as const).map(opt => (
                  <button key={opt.val} onClick={() => props.onSetLocalIconStyle(opt.val)}
                    className={`w-full py-1.5 px-2.5 rounded-lg border-2 text-[10px] text-left transition-all ${props.localIconStyle === opt.val ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))]'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {props.localIconStyle === 'MONOGRAM' && (
                <>
                  <input type="text" maxLength={3} value={props.localMonogramText}
                    onChange={e => props.onSetLocalMonogramText(e.target.value.toUpperCase().slice(0, 3))}
                    placeholder={props.companyName?.slice(0, 2) || 'AB'}
                    className="w-full px-2 py-1.5 rounded-lg border-2 border-[hsl(var(--gold)/0.4)] bg-white text-center text-sm font-bold tracking-widest text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--gold))]" />
                  <MonogramColorEditor
                    monogramText={props.localMonogramText || props.companyName?.slice(0, 2) || ''}
                    colors={props.monogramLetterColors}
                    onChange={props.onSetMonogramLetterColors}
                    defaultColor={props.primaryColor}
                  />
                </>
              )}
              {props.localIconStyle === 'UPLOADED_LOGO' && (
                <label className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-dashed border-[hsl(var(--gold)/0.4)] cursor-pointer hover:border-[hsl(var(--gold))]">
                  <Upload size={16} className="text-[hsl(var(--gold))]" />
                  <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{props.localLogoUrl ? 'Change' : 'Upload'}</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => props.onSetLocalLogoUrl(r.result as string); r.readAsDataURL(f); }} />
                </label>
              )}
              <button onClick={props.onApplyLogoToAll}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white text-[10px] font-semibold flex items-center justify-center gap-1 hover:opacity-90">
                <Wand2 size={10} /> Apply to Stamps
              </button>
            </AccordionContent>
          </AccordionItem>

          {/* ─── 3. Circle Structure ─── */}
          <AccordionItem value="structure" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Stamp size={12} className="text-[hsl(var(--gold))]" />
                Circle Structure
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2">
              <div className="px-1 py-2 text-center">
                <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Ring thickness and spacing are controlled by the standard template (3-ring professional structure).</p>
                <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-1">Use <strong>AI Smart Designer</strong> for custom ring adjustments.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── 4. Separators ─── */}
          <AccordionItem value="separators" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <PenTool size={12} className="text-[hsl(var(--gold))]" />
                Separators
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Click separator elements directly on the stamp preview to change their style. Available styles appear in the floating toolbar.</p>
            </AccordionContent>
          </AccordionItem>

          {/* ─── 5. Font Controls ─── */}
          <AccordionItem value="fonts" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Type size={12} className="text-[hsl(var(--gold))]" />
                Font Controls
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2.5">
              <div className="flex gap-1.5">
                <button onClick={() => props.onSetFontBold(v => !v)}
                  className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${props.fontBold ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)]' : 'border-[hsl(var(--border))]'}`}>B</button>
                <button onClick={() => props.onSetFontItalic(v => !v)}
                  className={`flex-1 py-1.5 rounded-lg border-2 text-xs italic transition-all ${props.fontItalic ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)]' : 'border-[hsl(var(--border))]'}`}>I</button>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Size</p>
                  <button onClick={() => props.onSetManualFontSize(null)}
                    className={`text-[8px] px-1 py-0.5 rounded border transition-all ${props.manualFontSize === null ? 'border-[hsl(var(--gold))] text-[hsl(var(--gold-dark))]' : 'border-[hsl(var(--border))]'}`}>Auto</button>
                </div>
                <Slider
                  min={6} max={24} step={0.5}
                  value={[props.manualFontSize ?? 10]}
                  onValueChange={([v]) => props.onSetManualFontSize(v)}
                  className="w-full"
                />
                {props.manualFontSize !== null && <p className="text-[9px] font-bold text-[hsl(var(--foreground))] mt-0.5">{props.manualFontSize}pt</p>}
              </div>
              <div className="border-t border-[hsl(var(--border))] pt-2">
                <p className="text-[9px] text-[hsl(var(--muted-foreground))] mb-1.5">Font Family</p>
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {STAMP_FONTS.map(f => (
                    <button key={f.value} onClick={() => props.onSetFontFamily(f.value)}
                      className={`w-full text-left p-2 rounded-lg border-2 transition-all ${props.fontFamily === f.value ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))]'}`}>
                      <p className="text-[10px] font-medium text-[hsl(var(--foreground))]">{f.label.split(' (')[0]}</p>
                    </button>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── 6. Colors ─── */}
          <AccordionItem value="colors" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Palette size={12} className="text-[hsl(var(--gold))]" />
                Colors
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2.5">
              <button onClick={props.onResetColors}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border-2 border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] text-[10px] font-semibold hover:bg-[hsl(var(--gold)/0.06)] transition-all">
                <RotateCw size={10} /> Reset to Standard
              </button>

              {/* Standard Export Colors */}
              <div className="border border-[hsl(var(--gold)/0.2)] rounded-lg p-2 bg-[hsl(var(--gold)/0.03)]">
                <p className="text-[8px] font-semibold text-[hsl(var(--gold-dark))] uppercase mb-1.5 flex items-center gap-1">
                  <Award size={8} /> Standard Export Colors
                </p>
                <div className="flex gap-1.5">
                  {STANDARD_EXPORT_COLORS.map(c => (
                    <button key={c.hex} onClick={() => props.onSetActiveColor(c.hex)} title={c.label}
                      className={`flex flex-col items-center gap-0.5 transition-all hover:scale-110 ${props.activeColor === c.hex ? 'scale-110' : ''}`}>
                      <div className={`w-6 h-6 rounded-full border-2 shadow-sm ${props.activeColor === c.hex ? 'border-[hsl(var(--gold))]' : c.hex === '#ffffff' ? 'border-[hsl(var(--border))]' : 'border-white'}`}
                        style={{ backgroundColor: c.hex }} />
                      <span className="text-[6px] text-[hsl(var(--muted-foreground))] leading-tight">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color stops */}
              <div className="flex gap-1">
                {stopDefs.map(s => (
                  <button key={s.key} onClick={() => props.onSetActiveStop(s.key)} title={s.label}
                    className={`flex-1 flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all ${props.activeStop === s.key ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))]'}`}>
                    <div className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: s.color }} />
                    <span className="text-[8px] text-[hsl(var(--muted-foreground))]">{s.label}</span>
                  </button>
                ))}
              </div>

              <StampColorWheel color={props.activeColor} onChange={props.onSetActiveColor} label="" size={120} />

              {/* Quick Colors */}
              <div className="border-t border-[hsl(var(--border))] pt-2">
                <p className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1.5">Quick Colors</p>
                <div className="flex flex-wrap gap-1">
                  {PRESET_PALETTE.map(c => (
                    <button key={c.hex} onClick={() => props.onSetActiveColor(c.hex)} title={c.label}
                      className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${props.activeColor === c.hex ? 'border-[hsl(var(--gold))] scale-110' : 'border-white shadow-sm'}`}
                      style={{ backgroundColor: c.hex }} />
                  ))}
                </div>
              </div>

              {/* Palettes */}
              <div className="border-t border-[hsl(var(--border))] pt-2">
                <p className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1.5">Palettes</p>
                <div className="space-y-1">
                  {PALETTE_PRESETS.map(p => (
                    <button key={p.label}
                      onClick={() => { props.onSetPrimaryColor(p.primary); props.onSetSecondaryColor(p.secondary); props.onSetAccentColor(p.accent); }}
                      className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] transition-all text-left">
                      <div className="flex gap-0.5 flex-shrink-0">
                        <div className="w-3 h-3 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: p.primary }} />
                        <div className="w-3 h-3 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: p.secondary }} />
                        <div className="w-3 h-3 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: p.accent }} />
                      </div>
                      <span className="text-[9px] font-medium text-[hsl(var(--foreground))] truncate">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ink Mode */}
              <button onClick={() => props.onSetInkMode(!props.inkMode)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg border-2 transition-all ${props.inkMode ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))]'}`}>
                <div className={`w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center ${props.inkMode ? 'bg-[hsl(var(--gold))] text-white' : 'bg-[hsl(var(--muted))]'}`}>
                  {props.inkMode ? '✓' : ''}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Ink Impression</p>
                  <p className="text-[8px] text-[hsl(var(--muted-foreground))]">Rubber stamp texture</p>
                </div>
              </button>

              {/* Custom Colors */}
              <div className="border-t border-[hsl(var(--border))] pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] uppercase">My Colors</p>
                  <button onClick={() => props.onAddCustomColor(props.activeColor)}
                    className="text-[8px] px-1.5 py-0.5 rounded border border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.06)]">
                    + Save
                  </button>
                </div>
                {props.customPalette.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {props.customPalette.map(hex => (
                      <div key={hex} className="relative group/swatch">
                        <button onClick={() => props.onSetActiveColor(hex)}
                          className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${props.activeColor === hex ? 'border-[hsl(var(--gold))] scale-110' : 'border-white shadow-sm'}`}
                          style={{ backgroundColor: hex }} />
                        <button onClick={() => props.onRemoveCustomColor(hex)}
                          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive text-white text-[7px] flex items-center justify-center opacity-0 group-hover/swatch:opacity-100 transition-opacity">×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[8px] text-[hsl(var(--muted-foreground))]">Click "+ Save" to store current color</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── 7. My Stamp & Signature ─── */}
          <AccordionItem value="mystamp" className="border-b-0">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-[hsl(var(--gold))]" />
                My Stamp & Signature
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-3">
              {/* Upload Own Stamp */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Upload Your Stamp</p>
                <label className="flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 border-dashed border-[hsl(var(--gold)/0.4)] cursor-pointer hover:border-[hsl(var(--gold))] transition-all">
                  <Upload size={16} className="text-[hsl(var(--gold))]" />
                  <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{props.uploadedStampUrl ? 'Change Stamp' : 'Upload Stamp Image'}</span>
                  <input type="file" accept="image/*,.svg" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { props.onSetUploadedStampUrl(r.result as string); toast.success('Stamp uploaded'); }; r.readAsDataURL(f); }} />
                </label>
                {props.uploadedStampUrl && (
                  <div className="flex items-center gap-2">
                    <img src={props.uploadedStampUrl} alt="Uploaded stamp" className="w-12 h-12 rounded object-contain border border-[hsl(var(--border))]" />
                    <button onClick={() => props.onSetUploadedStampUrl('')} className="text-[9px] text-destructive underline">Remove</button>
                  </div>
                )}
              </div>

              <div className="border-t border-[hsl(var(--border))]" />

              {/* AI Refine */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">AI Refine Stamp</p>
                <textarea value={props.refinePrompt} onChange={e => props.onSetRefinePrompt(e.target.value)}
                  placeholder="e.g. Make the border thicker..."
                  className="w-full px-2 py-1.5 rounded-lg border-2 border-[hsl(var(--gold)/0.4)] bg-white text-[10px] text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--gold))] min-h-[50px] resize-none" />
                <Button size="sm" disabled={props.refiningImage || (!props.uploadedStampUrl && !props.hasSelectedSvg)}
                  className="w-full h-7 text-[10px] bg-gradient-to-r from-violet-600 to-purple-700 text-white gap-1"
                  onClick={props.onRefineWithAI}>
                  {props.refiningImage ? <><Loader2 size={10} className="animate-spin" /> Refining…</> : <><Wand2 size={10} /> Refine with AI</>}
                </Button>
              </div>

              <div className="border-t border-[hsl(var(--border))]" />

              {/* Signature Overlay */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Signature Overlay</p>
                <label className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-dashed border-[hsl(var(--gold)/0.4)] cursor-pointer hover:border-[hsl(var(--gold))] transition-all">
                  <Upload size={14} className="text-[hsl(var(--gold))]" />
                  <span className="text-[8px] text-[hsl(var(--muted-foreground))]">{props.uploadedSignatureUrl ? 'Change' : 'Upload Signature'}</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { props.onSetUploadedSignatureUrl(r.result as string); toast.success('Signature uploaded'); }; r.readAsDataURL(f); }} />
                </label>
                {props.uploadedSignatureUrl && (
                  <>
                    <div className="flex items-center gap-2">
                      <img src={props.uploadedSignatureUrl} alt="Signature" className="h-8 object-contain border border-[hsl(var(--border))] rounded" />
                      <button onClick={() => props.onSetUploadedSignatureUrl('')} className="text-[9px] text-destructive underline">Remove</button>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[8px] text-[hsl(var(--muted-foreground))]">Position X</label>
                        <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{props.signatureX}%</span>
                      </div>
                      <Slider min={0} max={100} value={[props.signatureX]} disabled={props.signatureLocked}
                        onValueChange={([v]) => props.onSetSignatureX(v)} />
                      <div className="flex items-center justify-between">
                        <label className="text-[8px] text-[hsl(var(--muted-foreground))]">Position Y</label>
                        <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{props.signatureY}%</span>
                      </div>
                      <Slider min={0} max={100} value={[props.signatureY]} disabled={props.signatureLocked}
                        onValueChange={([v]) => props.onSetSignatureY(v)} />
                    </div>
                    <button onClick={() => props.onSetSignatureLocked(!props.signatureLocked)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border-2 transition-all text-[9px] ${props.signatureLocked ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))]'}`}>
                      <div className={`w-3.5 h-3.5 rounded text-[7px] font-bold flex items-center justify-center ${props.signatureLocked ? 'bg-[hsl(var(--gold))] text-white' : 'bg-[hsl(var(--muted))]'}`}>
                        {props.signatureLocked ? '✓' : ''}
                      </div>
                      {props.signatureLocked ? 'Locked — Unlock to move' : 'Lock position'}
                    </button>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </div>
  );
}
