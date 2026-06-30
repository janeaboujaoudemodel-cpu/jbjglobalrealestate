/**
 * StampLeftPanel — Reorganized into 10 focused sections.
 * All sections collapsed by default. Font previews rendered in actual fonts.
 * Color controls split with native pickers. Slider ranges corrected.
 */
import React, { useState, useCallback, useEffect } from 'react';
import type { SelectedElement, SelectedElementType } from './StampInteractivePreview';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { StampColorWheel } from './StampColorWheel';
import { StampTextEditor } from './StampTextEditor';
import { MonogramColorEditor, DEFAULT_MONOGRAM_COLORS } from './MonogramColorEditor';
import type { MonogramLetterColors } from './MonogramColorEditor';
import { ALL_SEPARATOR_STYLES, separatorLabel, type SeparatorStyle, type LanguageMode } from '@/lib/stampOfficialTemplate';
import { removeWhiteBackground } from '@/lib/removeWhiteBackground';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  RotateCw, Award, Upload, Wand2, Loader2, Palette, Type,
  CircleDot, Stamp, Layers, PenTool, Sparkles, Link2,
  ChevronDown, ChevronRight, Building2, MapPin, Image as ImageIcon, Hash,
  Circle, Settings2
} from 'lucide-react';

const SEPARATOR_GLYPHS: Record<SeparatorStyle, string> = {
  'dot': '●', 'star': '★', 'square': '■', 'diamond': '◆',
  'line': '—', 'double-line': '═', 'triangle': '▲', 'cross': '✦',
  'floral': '❀', 'ornament': '❖', 'dash': '—', 'circle': '◉', 'none': '⊘',
};

const STANDARD_EXPORT_COLORS = [
  { label: 'White', hex: '#ffffff' },
  { label: 'Black', hex: '#0d0d0d' },
  { label: 'Navy Ink', hex: '#1B3A8C' },
  { label: 'Brand Gold', hex: '#B89555' },
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

const ARABIC_FONTS = [
  { label: 'Noto Naskh Arabic', value: '"Noto Naskh Arabic", serif' },
  { label: 'Amiri (Classic)', value: '"Amiri", serif' },
  { label: 'Cairo (Modern)', value: '"Cairo", sans-serif' },
  { label: 'Tajawal (Clean)', value: '"Tajawal", sans-serif' },
  { label: 'Scheherazade (Ornate)', value: '"Scheherazade New", serif' },
];

type ColorStop = 'primary' | 'secondary' | 'accent';

interface StampLeftPanelProps {
  selectedElement?: SelectedElement | null;
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
  fontFamily: string;
  fontBold: boolean;
  fontItalic: boolean;
  manualFontSize: number | null;
  onSetFontFamily: (v: string) => void;
  onSetFontBold: (v: boolean | ((p: boolean) => boolean)) => void;
  onSetFontItalic: (v: boolean | ((p: boolean) => boolean)) => void;
  onSetManualFontSize: (v: number | null | ((p: number | null) => number | null)) => void;
  selectedSvg: string | null;
  selectedConceptId: string | null;
  onSvgTextChange: (conceptId: string, newSvg: string) => void;
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
  arabicFont: string;
  arabicLetterSpacing: number;
  arabicArcSpread: number;
  arabicFontWeight: string;
  arabicFontSize?: number | null;
  arabicFontItalic?: boolean;
  onSetArabicFont: (v: string) => void;
  onSetArabicLetterSpacing: (v: number) => void;
  onSetArabicArcSpread: (v: number) => void;
  onSetArabicFontWeight: (v: string) => void;
  onSetArabicFontSize?: (v: number | null) => void;
  onSetArabicFontItalic?: (v: boolean) => void;
  arcTextSpacing: number;
  circleGap: number;
  separatorDistance: number;
  centerContentSize: number;
  englishArcSpread: number;
  companyArcOffset: number;
  locationArcOffset: number;
  locationArcSpread: number;
  onSetArcTextSpacing: (v: number) => void;
  onSetCircleGap: (v: number) => void;
  onSetSeparatorDistance: (v: number) => void;
  onSetCenterContentSize: (v: number) => void;
  onSetEnglishArcSpread: (v: number) => void;
  onSetCompanyArcOffset: (v: number) => void;
  onSetLocationArcOffset: (v: number) => void;
  onSetLocationArcSpread: (v: number) => void;
  languageMode?: LanguageMode;
  onSetLanguageMode?: (v: LanguageMode) => void;
}

export function StampLeftPanel(props: StampLeftPanelProps) {
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [focusedElement, setFocusedElement] = useState<'center' | 'separator' | 'text' | null>(null);
  const [removingBg, setRemovingBg] = useState(false);

  // Auto-open correct sidebar section when an element is selected on the canvas
  useEffect(() => {
    if (!props.selectedElement) return;
    const t = props.selectedElement.type;
    if (t === 'arabic-company' || t === 'arabic-location') {
      setOpenSections(prev => prev.includes('arabic-typography') ? prev : [...prev, 'arabic-typography']);
      setFocusedElement('text');
    } else if (t === 'english-company' || t === 'english-location') {
      setOpenSections(prev => prev.includes('english-typography') ? prev : [...prev, 'english-typography']);
      setFocusedElement('text');
    } else if (t === 'separator-left' || t === 'separator-right') {
      setOpenSections(prev => prev.includes('separators') ? prev : [...prev, 'separators']);
      setFocusedElement('separator');
    } else if (t === 'monogram' || t === 'logo' || t === 'registration') {
      setOpenSections(prev => prev.includes('logo') ? prev : [...prev, 'logo']);
      setFocusedElement('center');
    } else if (t === 'outer-ring' || t === 'middle-ring' || t === 'inner-ring') {
      setOpenSections(prev => prev.includes('circle-structure') ? prev : [...prev, 'circle-structure']);
    }
  }, [props.selectedElement]);

  const handleColorChange = useCallback((hex: string) => {
    if (focusedElement === 'center' && props.localIconStyle === 'MONOGRAM') {
      props.onSetMonogramLetterColors({
        ...props.monogramLetterColors,
        allLetters: hex,
      });
      toast.success('Monogram color updated');
    } else {
      props.onSetActiveColor(hex);
    }
  }, [focusedElement, props.localIconStyle, props.monogramLetterColors, props.onSetMonogramLetterColors, props.onSetActiveColor]);

  const handleLogoUpload = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setRemovingBg(true);
      try {
        const { result, removed } = await removeWhiteBackground(dataUrl);
        props.onSetLocalLogoUrl(result);
        if (removed) {
          toast.success('White background removed automatically');
        } else {
          toast.info('Clean background detected — no removal needed');
        }
      } catch {
        props.onSetLocalLogoUrl(dataUrl);
      } finally {
        setRemovingBg(false);
      }
    };
    reader.readAsDataURL(file);
  }, [props.onSetLocalLogoUrl]);

  const stopDefs: { key: ColorStop; label: string; color: string }[] = [
    { key: 'primary', label: 'Primary', color: props.primaryColor },
    { key: 'secondary', label: 'Secondary', color: props.secondaryColor || '#2a3a5c' },
    { key: 'accent', label: 'Accent', color: props.accentColor || '#B8860B' },
  ];

  const hasSvg = props.selectedSvg && props.selectedConceptId;

  const allSections = [
    'company', 'style', 'logo', 'export', 'english-typography',
    'arabic-typography', 'spacing-layout', 'separators', 'colors', 'circle-structure'
  ];

  return (
    <div className="w-[280px] flex-shrink-0 border-r border-[hsl(var(--border))] bg-[#FDFBF7]/80 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-3 py-2 border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--pearl-1))] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers size={12} className="text-[hsl(var(--gold))]" />
            <span className="text-[10px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">Tool Controls</span>
          </div>
          <button
            onClick={() => setOpenSections(prev => prev.length > 0 ? [] : allSections)}
            className="text-[9px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold-dark))] transition-colors"
          >
            {openSections.length > 0 ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Language Mode Toggle — always visible */}
        {props.onSetLanguageMode && (
          <div className="px-3 py-2 border-b border-[hsl(var(--border)/0.5)]">
            <p className="text-[8px] font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1.5 tracking-wider">Language Mode</p>
            <div className="flex gap-1">
              {([
                { key: 'BILINGUAL' as const, label: '🌐 Bilingual' },
                { key: 'AR' as const, label: '🇦🇪 Arabic' },
                { key: 'EN' as const, label: '🇬🇧 English' },
              ]).map(m => (
                <button key={m.key} onClick={() => props.onSetLanguageMode!(m.key)}
                  className={`flex-1 py-1.5 rounded-lg border-2 text-[9px] font-semibold transition-all ${
 props.languageMode === m.key
 ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]'
 : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.3)]'
 }`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="px-2 py-1">

          {/* ═══════════════════════════════════════════
              1. COMPANY — text editors for arcs
             ═══════════════════════════════════════════ */}
          <AccordionItem value="company" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Building2 size={12} className="text-[hsl(var(--gold))]" />
                Company
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-2 space-y-2">
              {props.languageMode !== 'EN' && (
                <div>
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase mb-1">🇦🇪 Arabic Company Arc</p>
                  {hasSvg ? (
                    <StampTextEditor svgSource={props.selectedSvg!} onSvgChange={(newSvg) => props.onSvgTextChange(props.selectedConceptId!, newSvg)} hierarchyFilter={['top-arc']} />
                  ) : <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Select a stamp to edit</p>}
                </div>
              )}
              {props.languageMode !== 'AR' && (
                <div>
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase mb-1">🇬🇧 English Company Arc</p>
                  {hasSvg ? (
                    <StampTextEditor svgSource={props.selectedSvg!} onSvgChange={(newSvg) => props.onSvgTextChange(props.selectedConceptId!, newSvg)} hierarchyFilter={['bottom-arc']} />
                  ) : <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Select a stamp to edit</p>}
                </div>
              )}
              {/* Location arcs */}
              {props.languageMode !== 'EN' && (
                <div>
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase mb-1">🇦🇪 Arabic Location Arc</p>
                  {hasSvg ? (
                    <StampTextEditor svgSource={props.selectedSvg!} onSvgChange={(newSvg) => props.onSvgTextChange(props.selectedConceptId!, newSvg)} hierarchyFilter={['loc-top']} />
                  ) : <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Select a stamp to edit</p>}
                </div>
              )}
              {props.languageMode !== 'AR' && (
                <div>
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase mb-1">🇬🇧 English Location Arc</p>
                  {hasSvg ? (
                    <StampTextEditor svgSource={props.selectedSvg!} onSvgChange={(newSvg) => props.onSvgTextChange(props.selectedConceptId!, newSvg)} hierarchyFilter={['loc-bottom']} />
                  ) : <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Select a stamp to edit</p>}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ═══════════════════════════════════════════
              2. STYLE — border style + ink impression
             ═══════════════════════════════════════════ */}
          <AccordionItem value="style" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Stamp size={12} className="text-[hsl(var(--gold))]" />
                Style
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2.5">
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
            </AccordionContent>
          </AccordionItem>

          {/* ═══════════════════════════════════════════
              3. LOGO — Center content controls
             ═══════════════════════════════════════════ */}
          <AccordionItem value="logo" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <CircleDot size={12} className="text-[hsl(var(--gold))]" />
                Logo
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2">
              {/* Monogram */}
              <div className="space-y-2">
                <button onClick={() => props.onSetLocalIconStyle('MONOGRAM')}
                  className={`w-full py-1.5 px-2.5 rounded-lg border-2 text-[10px] text-left transition-all ${props.localIconStyle === 'MONOGRAM' ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))]'}`}>
                  {props.localIconStyle === 'MONOGRAM' ? '✓ Monogram Active' : 'Use Monogram'}
                </button>
                {props.localIconStyle === 'MONOGRAM' && (
                  <>
                    <input type="text" maxLength={3} value={props.localMonogramText}
                      onChange={e => props.onSetLocalMonogramText(e.target.value.toUpperCase().slice(0, 3))}
                      placeholder={props.companyName?.slice(0, 2) || 'AB'}
                      className="w-full px-2 py-1.5 rounded-lg border-2 border-[hsl(var(--gold)/0.4)] bg-[#FDFBF7] text-center text-sm font-bold tracking-widest text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--gold))]" />
                    <MonogramColorEditor
                      monogramText={props.localMonogramText || props.companyName?.slice(0, 2) || ''}
                      colors={props.monogramLetterColors}
                      onChange={props.onSetMonogramLetterColors}
                      defaultColor={props.primaryColor}
                    />
                  </>
                )}
              </div>
              {/* Logo Upload */}
              <div className="space-y-2">
                <button onClick={() => props.onSetLocalIconStyle('UPLOADED_LOGO')}
                  className={`w-full py-1.5 px-2.5 rounded-lg border-2 text-[10px] text-left transition-all ${props.localIconStyle === 'UPLOADED_LOGO' ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))]'}`}>
                  {props.localIconStyle === 'UPLOADED_LOGO' ? '✓ Logo Active' : 'Use Logo'}
                </button>
                {props.localIconStyle === 'UPLOADED_LOGO' && (
                  <label className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-dashed border-[hsl(var(--gold)/0.4)] cursor-pointer hover:border-[hsl(var(--gold))]">
                    {removingBg ? (
                      <><Loader2 size={16} className="text-[hsl(var(--gold))] animate-spin" /><span className="text-[9px] text-[hsl(var(--muted-foreground))]">Removing background…</span></>
                    ) : (
                      <><Upload size={16} className="text-[hsl(var(--gold))]" /><span className="text-[9px] text-[hsl(var(--muted-foreground))]">{props.localLogoUrl ? 'Change' : 'Upload'}</span></>
                    )}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
                    <p className="text-[7px] text-[hsl(var(--muted-foreground))]">White backgrounds auto-removed</p>
                  </label>
                )}
                {props.localLogoUrl && props.localIconStyle === 'UPLOADED_LOGO' && (
                  <div className="flex items-center gap-2">
                    <img src={props.localLogoUrl} alt="Logo" className="w-10 h-10 rounded object-contain border border-[hsl(var(--border))] bg-[hsl(var(--muted))]"  loading="lazy" decoding="async" />
                    <button onClick={() => props.onSetLocalLogoUrl('')} className="text-[9px] text-destructive underline">Remove</button>
                  </div>
                )}
              </div>
              {/* License / Registration */}
              <div>
                <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase mb-1">License / Registration</p>
                {hasSvg ? (
                  <StampTextEditor svgSource={props.selectedSvg!} onSvgChange={(newSvg) => props.onSvgTextChange(props.selectedConceptId!, newSvg)} hierarchyFilter={['registration']} />
                ) : <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Select a stamp to edit</p>}
              </div>
              {/* No Art */}
              <button onClick={() => props.onSetLocalIconStyle('NONE')}
                className={`w-full py-1 px-2.5 rounded-lg border-2 text-[9px] text-left transition-all ${props.localIconStyle === 'NONE' ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))]'}`}>
                No Center Art
              </button>
              <button onClick={props.onApplyLogoToAll}
                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white text-[9px] font-semibold flex items-center justify-center gap-1 hover:opacity-90">
                <Wand2 size={9} /> Apply to All Stamps
              </button>
            </AccordionContent>
          </AccordionItem>

          {/* ═══════════════════════════════════════════
              4. EXPORT — My Stamp & Signature
             ═══════════════════════════════════════════ */}
          <AccordionItem value="export" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-[hsl(var(--gold))]" />
                Export
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-3">
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
                    <img src={props.uploadedStampUrl} alt="Uploaded stamp" className="w-12 h-12 rounded object-contain border border-[hsl(var(--border))]"  loading="lazy" decoding="async" />
                    <button onClick={() => props.onSetUploadedStampUrl('')} className="text-[9px] text-destructive underline">Remove</button>
                  </div>
                )}
              </div>
              <div className="border-t border-[hsl(var(--border))]" />
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">AI Refine Stamp</p>
                <textarea value={props.refinePrompt} onChange={e => props.onSetRefinePrompt(e.target.value)}
                  placeholder="e.g. Make the border thicker..."
                  className="w-full px-2 py-1.5 rounded-lg border-2 border-[hsl(var(--gold)/0.4)] bg-[#FDFBF7] text-[10px] text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--gold))] min-h-[50px] resize-none" />
                <Button size="sm" disabled={props.refiningImage || (!props.uploadedStampUrl && !props.hasSelectedSvg)}
                  className="w-full h-7 text-[10px] bg-gradient-to-r from-violet-600 to-purple-700 text-white gap-1"
                  onClick={props.onRefineWithAI}>
                  {props.refiningImage ? <><Loader2 size={10} className="animate-spin" /> Refining…</> : <><Wand2 size={10} /> Refine with AI</>}
                </Button>
              </div>
              <div className="border-t border-[hsl(var(--border))]" />
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
                      <img src={props.uploadedSignatureUrl} alt="Signature" className="h-8 object-contain border border-[hsl(var(--border))] rounded"  loading="lazy" decoding="async" />
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

          {/* ═══════════════════════════════════════════
              5. ENGLISH TYPOGRAPHY — with font previews
             ═══════════════════════════════════════════ */}
          {props.languageMode !== 'AR' && (
          <AccordionItem value="english-typography" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <span className="text-[10px]">🇬🇧</span>
                <Type size={12} className="text-blue-600" />
                English Typography
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2.5">
              <div>
                <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase mb-1.5">Font Family</p>
                <div className="space-y-1 max-h-[160px] overflow-y-auto">
                  {STAMP_FONTS.map(f => {
                    const fontName = f.label.split(' (')[0];
                    const fontDesc = f.label.match(/\((.+)\)/)?.[1] || '';
                    return (
                      <button key={f.value} onClick={() => props.onSetFontFamily(f.value)}
                        className={`w-full text-left p-2 rounded-lg border-2 transition-all ${props.fontFamily === f.value ? 'border-blue-500 bg-blue-50' : 'border-[hsl(var(--border))] hover:border-blue-200'}`}>
                        <p className="text-[12px] font-medium text-[hsl(var(--foreground))] leading-tight" style={{ fontFamily: f.value }}>{fontName}</p>
                        <p className="text-[7px] text-[hsl(var(--muted-foreground))] mt-0.5">{fontDesc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Font Size</p>
                  <button onClick={() => props.onSetManualFontSize(null)}
                    className={`text-[8px] px-1 py-0.5 rounded border transition-all ${props.manualFontSize === null ? 'border-blue-500 text-blue-700' : 'border-[hsl(var(--border))]'}`}>Auto</button>
                </div>
                <Slider min={6} max={24} step={0.5} value={[props.manualFontSize ?? 10]}
                  onValueChange={([v]) => props.onSetManualFontSize(v)} />
                {props.manualFontSize !== null && <p className="text-[9px] font-bold text-[hsl(var(--foreground))] mt-0.5">{props.manualFontSize}pt</p>}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => props.onSetFontBold(v => !v)}
                  className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${props.fontBold ? 'border-blue-500 bg-blue-50' : 'border-[hsl(var(--border))]'}`}>B</button>
                <button onClick={() => props.onSetFontItalic(v => !v)}
                  className={`flex-1 py-1.5 rounded-lg border-2 text-xs italic transition-all ${props.fontItalic ? 'border-blue-500 bg-blue-50' : 'border-[hsl(var(--border))]'}`}>I</button>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Letter Spacing</p>
                  <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{props.arcTextSpacing}px</span>
                </div>
                <Slider min={0} max={10} step={0.5} value={[props.arcTextSpacing]}
                  onValueChange={([v]) => props.onSetArcTextSpacing(v)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Arc Spread</p>
                  <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{Math.round(props.englishArcSpread * 100)}%</span>
                </div>
                <Slider min={50} max={100} step={1} value={[Math.round(props.englishArcSpread * 100)]}
                  onValueChange={([v]) => props.onSetEnglishArcSpread(v / 100)} />
              </div>
            </AccordionContent>
          </AccordionItem>
          )}

          {/* ═══════════════════════════════════════════
              6. ARABIC TYPOGRAPHY — with font previews
             ═══════════════════════════════════════════ */}
          {props.languageMode !== 'EN' && (
          <AccordionItem value="arabic-typography" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <span className="text-[10px]">🇦🇪</span>
                <Type size={12} className="text-[color:var(--emerald-1)]" />
                Arabic Typography
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2.5">
              <div>
                <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase mb-1.5">Font Family</p>
                <div className="space-y-1 max-h-[140px] overflow-y-auto">
                  {ARABIC_FONTS.map(f => {
                    const fontDesc = f.label.match(/\((.+)\)/)?.[1] || '';
                    const fontName = f.label.split(' (')[0];
                    return (
                      <button key={f.value} onClick={() => props.onSetArabicFont(f.value)}
                        className={`w-full text-left p-2 rounded-lg border-2 transition-all ${props.arabicFont === f.value ? 'border-[color:var(--emerald-1)]/30 jj-emerald-soft' : 'border-[hsl(var(--border))] hover:border-[color:var(--emerald-1)]/30'}`}>
                        <p className="text-[12px] font-medium text-[hsl(var(--foreground))] leading-tight" style={{ fontFamily: f.value }} dir="rtl">شركة — {fontName}</p>
                        {fontDesc && <p className="text-[7px] text-[hsl(var(--muted-foreground))] mt-0.5">{fontDesc}</p>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Font Size</p>
                  <button onClick={() => props.onSetArabicFontSize?.(null)}
                    className={`text-[8px] px-1 py-0.5 rounded border transition-all ${props.arabicFontSize === null || props.arabicFontSize === undefined ? 'border-[color:var(--emerald-1)]/30 text-[color:var(--emerald-1)]' : 'border-[hsl(var(--border))]'}`}>Auto</button>
                </div>
                <Slider min={6} max={24} step={0.5} value={[props.arabicFontSize ?? 10]}
                  onValueChange={([v]) => props.onSetArabicFontSize?.(v)} />
                {props.arabicFontSize != null && <p className="text-[9px] font-bold text-[hsl(var(--foreground))] mt-0.5">{props.arabicFontSize}pt</p>}
              </div>
              <div className="flex gap-1.5">
                {(['normal', 'bold'] as const).map(w => (
                  <button key={w} onClick={() => props.onSetArabicFontWeight(w)}
                    className={`flex-1 py-1.5 rounded-lg border-2 text-[10px] capitalize transition-all ${props.arabicFontWeight === w ? 'border-[color:var(--emerald-1)]/30 jj-emerald-soft font-bold' : 'border-[hsl(var(--border))]'}`}>
                    {w}
                  </button>
                ))}
                <button onClick={() => props.onSetArabicFontItalic?.(!props.arabicFontItalic)}
                  className={`flex-1 py-1.5 rounded-lg border-2 text-[10px] italic transition-all ${props.arabicFontItalic ? 'border-[color:var(--emerald-1)]/30 jj-emerald-soft' : 'border-[hsl(var(--border))]'}`}>I</button>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Letter Spacing</p>
                  <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{props.arabicLetterSpacing}px</span>
                </div>
                <Slider min={0} max={12} step={0.5} value={[props.arabicLetterSpacing]}
                  onValueChange={([v]) => props.onSetArabicLetterSpacing(v)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Arc Spread</p>
                  <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{Math.round(props.arabicArcSpread * 100)}%</span>
                </div>
                <Slider min={50} max={100} step={1} value={[Math.round(props.arabicArcSpread * 100)]}
                  onValueChange={([v]) => props.onSetArabicArcSpread(v / 100)} />
              </div>
            </AccordionContent>
          </AccordionItem>
          )}

          {/* ═══════════════════════════════════════════
              7. SPACING & LAYOUT — geometry + sync
             ═══════════════════════════════════════════ */}
          <AccordionItem value="spacing-layout" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Settings2 size={12} className="text-[hsl(var(--gold))]" />
                Spacing & Layout
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Company Arc Position</p>
                  <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{props.companyArcOffset}%</span>
                </div>
                <Slider min={0} max={100} step={1} value={[props.companyArcOffset]}
                  onValueChange={([v]) => props.onSetCompanyArcOffset(v)} />
                <p className="text-[7px] text-[hsl(var(--muted-foreground))] mt-0.5">50 = centered between rings</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Location Arc Position</p>
                  <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{props.locationArcOffset}%</span>
                </div>
                <Slider min={0} max={100} step={1} value={[props.locationArcOffset]}
                  onValueChange={([v]) => props.onSetLocationArcOffset(v)} />
                <p className="text-[7px] text-[hsl(var(--muted-foreground))] mt-0.5">50 = centered between rings</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Separator Distance</p>
                  <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{props.separatorDistance}%</span>
                </div>
                <Slider min={0} max={100} step={1} value={[props.separatorDistance]}
                  onValueChange={([v]) => props.onSetSeparatorDistance(v)} />
                <p className="text-[7px] text-[hsl(var(--muted-foreground))] mt-0.5">50 = centered between rings</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Location Arc Spread</p>
                  <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{Math.round(props.locationArcSpread * 100)}%</span>
                </div>
                <Slider min={50} max={100} step={1} value={[Math.round(props.locationArcSpread * 100)]}
                  onValueChange={([v]) => props.onSetLocationArcSpread(v / 100)} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Center Content Size</p>
                  <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{props.centerContentSize}%</span>
                </div>
                <Slider min={20} max={60} step={1} value={[props.centerContentSize]}
                  onValueChange={([v]) => props.onSetCenterContentSize(v)} />
              </div>
              {/* Sync sub-group */}
              <div className="border-t border-[hsl(var(--border))] pt-2">
                <p className="text-[8px] font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1.5">Sync AR ↔ EN</p>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Font Size (Both)</p>
                      <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{props.manualFontSize ?? 'Auto'}</span>
                    </div>
                    <Slider min={6} max={24} step={0.5} value={[props.manualFontSize ?? 10]}
                      onValueChange={([v]) => { props.onSetManualFontSize(v); props.onSetArabicFontSize?.(v); }} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Letter Spacing (Both)</p>
                      <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{props.arcTextSpacing}px</span>
                    </div>
                    <Slider min={0} max={12} step={0.5} value={[props.arcTextSpacing]}
                      onValueChange={([v]) => { props.onSetArcTextSpacing(v); props.onSetArabicLetterSpacing(v); }} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Arc Spread (Both)</p>
                      <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{Math.round(props.englishArcSpread * 100)}%</span>
                    </div>
                    <Slider min={50} max={100} step={1} value={[Math.round(props.englishArcSpread * 100)]}
                      onValueChange={([v]) => { props.onSetEnglishArcSpread(v / 100); props.onSetArabicArcSpread(v / 100); }} />
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        props.onSetArabicArcSpread(props.englishArcSpread);
                        props.onSetArabicLetterSpacing(props.arcTextSpacing);
                        if (props.onSetArabicFontSize && props.manualFontSize !== undefined) props.onSetArabicFontSize(props.manualFontSize);
                        toast.success('Arabic matched to English');
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-[color:var(--emerald-1)]/30 text-[color:var(--emerald-1)] text-[9px] font-semibold hover:jj-emerald-soft transition-all"
                    >
                      AR ← Match EN
                    </button>
                    <button
                      onClick={() => {
                        props.onSetEnglishArcSpread(props.arabicArcSpread);
                        props.onSetArcTextSpacing(props.arabicLetterSpacing);
                        if (props.arabicFontSize != null) props.onSetManualFontSize(props.arabicFontSize);
                        toast.success('English matched to Arabic');
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-blue-300 text-blue-700 text-[9px] font-semibold hover:bg-blue-50 transition-all"
                    >
                      EN ← Match AR
                    </button>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ═══════════════════════════════════════════
              8. SEPARATORS
             ═══════════════════════════════════════════ */}
          <AccordionItem value="separators" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <PenTool size={12} className="text-[hsl(var(--gold))]" />
                Separators
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2.5">
              <div>
                <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase mb-1.5">Style</p>
                <div className="grid grid-cols-4 gap-1">
                  {ALL_SEPARATOR_STYLES.map(style => (
                    <button key={style} onClick={() => {
                      window.dispatchEvent(new CustomEvent('stamp-separator-style-change', { detail: style }));
                    }}
                      className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg border-2 text-xs transition-all border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]">
                      <span className="text-sm">{SEPARATOR_GLYPHS[style]}</span>
                      <span className="text-[7px] text-[hsl(var(--muted-foreground))]">{separatorLabel(style)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase mb-1">Left Text</p>
                {hasSvg ? (
                  <StampTextEditor svgSource={props.selectedSvg!} onSvgChange={(newSvg) => props.onSvgTextChange(props.selectedConceptId!, newSvg)} hierarchyFilter={['separator-left', 'loc-separator-left']} />
                ) : <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Select a stamp</p>}
              </div>
              <div>
                <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase mb-1">Right Text</p>
                {hasSvg ? (
                  <StampTextEditor svgSource={props.selectedSvg!} onSvgChange={(newSvg) => props.onSvgTextChange(props.selectedConceptId!, newSvg)} hierarchyFilter={['separator-right', 'loc-separator-right']} />
                ) : <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Select a stamp</p>}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ═══════════════════════════════════════════
              9. COLORS — split sub-sections + native pickers
             ═══════════════════════════════════════════ */}
          <AccordionItem value="colors" className="border-b border-[hsl(var(--border)/0.5)]">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Palette size={12} className="text-[hsl(var(--gold))]" />
                Colors
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2.5">
              {focusedElement === 'center' && props.localIconStyle === 'MONOGRAM' && (
                <div className="px-2 py-1.5 rounded-lg bg-[hsl(var(--gold)/0.1)] border border-[hsl(var(--gold)/0.3)]">
                  <p className="text-[9px] font-semibold text-[hsl(var(--gold-dark))]">🎯 Monogram focused — colors apply to monogram letters</p>
                  <button onClick={() => setFocusedElement(null)} className="text-[8px] text-[hsl(var(--muted-foreground))] underline mt-0.5">Switch to borders</button>
                </div>
              )}

              {/* Reset */}
              <button onClick={props.onResetColors}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border-2 border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] text-[10px] font-semibold hover:bg-[hsl(var(--gold)/0.06)] transition-all">
                <RotateCw size={10} /> Reset to Standard Ink Blue
              </button>

              {/* Border Colors — with native pickers */}
              <div className="border border-[hsl(var(--border))] rounded-lg p-2 bg-[hsl(var(--muted)/0.3)]">
                <p className="text-[8px] font-semibold text-[hsl(var(--foreground))] uppercase mb-2">Border Colors</p>
                <div className="space-y-1.5">
                  {stopDefs.map(s => (
                    <div key={s.key} className="flex items-center gap-2">
                      <button onClick={() => { props.onSetActiveStop(s.key); setFocusedElement(null); }}
                        className={`flex items-center gap-1.5 flex-1 p-1.5 rounded-lg border-2 transition-all ${props.activeStop === s.key ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))]'}`}>
                        <div className="w-5 h-5 rounded-full border border-white shadow-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <div className="flex-1 text-left">
                          <span className="text-[9px] font-medium text-[hsl(var(--foreground))]">{s.label}</span>
                          <span className="text-[7px] font-mono text-[hsl(var(--muted-foreground))] ml-1">{s.color}</span>
                        </div>
                      </button>
                      <div className="relative">
                        <input type="color" value={s.color}
                          onChange={e => {
                            const hex = e.target.value;
                            if (s.key === 'primary') props.onSetPrimaryColor(hex);
                            else if (s.key === 'secondary') props.onSetSecondaryColor(hex);
                            else props.onSetAccentColor(hex);
                          }}
                          className="w-6 h-6 rounded cursor-pointer border border-[hsl(var(--border))]"
                          style={{ padding: 0 }}
                        />
                      </div>
                      <button onClick={() => {
                        const defaults = { primary: '#1B3A8C', secondary: '#1a2d6e', accent: '#1B3A8C' };
                        if (s.key === 'primary') props.onSetPrimaryColor(defaults.primary);
                        else if (s.key === 'secondary') props.onSetSecondaryColor(defaults.secondary);
                        else props.onSetAccentColor(defaults.accent);
                      }}
                        className="text-[7px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors" title="Reset">
                        <RotateCw size={8} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Standard Export Colors */}
              <div className="border border-[hsl(var(--gold)/0.2)] rounded-lg p-2 bg-[hsl(var(--gold)/0.03)]">
                <p className="text-[8px] font-semibold text-[hsl(var(--gold-dark))] uppercase mb-1.5 flex items-center gap-1">
                  <Award size={8} /> Standard Export Colors
                </p>
                <div className="flex gap-1.5">
                  {STANDARD_EXPORT_COLORS.map(c => (
                    <button key={c.hex} onClick={() => handleColorChange(c.hex)} title={c.label}
                      className={`flex flex-col items-center gap-0.5 transition-all hover:scale-110 ${props.activeColor === c.hex ? 'scale-110' : ''}`}>
                      <div className={`w-6 h-6 rounded-full border-2 shadow-sm ${props.activeColor === c.hex ? 'border-[hsl(var(--gold))]' : c.hex === '#ffffff' ? 'border-[hsl(var(--border))]' : 'border-white'}`}
                        style={{ backgroundColor: c.hex }} />
                      <span className="text-[6px] text-[hsl(var(--muted-foreground))] leading-tight">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Wheel */}
              <StampColorWheel color={props.activeColor} onChange={handleColorChange} label="" size={120} />

              {/* Quick Colors */}
              <div className="border-t border-[hsl(var(--border))] pt-2">
                <p className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1.5">Quick Colors</p>
                <div className="flex flex-wrap gap-1">
                  {PRESET_PALETTE.map(c => (
                    <button key={c.hex} onClick={() => handleColorChange(c.hex)} title={c.label}
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

              {/* My Colors */}
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
                        <button onClick={() => handleColorChange(hex)}
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

          {/* ═══════════════════════════════════════════
              10. CIRCLE STRUCTURE — ring gap, border, ink
             ═══════════════════════════════════════════ */}
          <AccordionItem value="circle-structure" className="border-b-0">
            <AccordionTrigger className="py-2.5 text-[11px] font-semibold hover:no-underline">
              <span className="flex items-center gap-1.5">
                <Circle size={12} className="text-[hsl(var(--gold))]" />
                Circle Structure
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Ring Gap</p>
                  <span className="text-[8px] font-mono text-[hsl(var(--foreground))]">{props.circleGap}%</span>
                </div>
                <Slider min={5} max={25} step={1} value={[props.circleGap]}
                  onValueChange={([v]) => props.onSetCircleGap(v)} />
                <p className="text-[7px] text-[hsl(var(--muted-foreground))] mt-0.5">Controls spacing between concentric rings</p>
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </div>
  );
}
