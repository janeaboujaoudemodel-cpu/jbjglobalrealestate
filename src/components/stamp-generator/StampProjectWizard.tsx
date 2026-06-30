import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerVerification } from '@/hooks/useOwnerVerification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Stamp, Building2, Palette, Image, Check, Type, Upload, X, Globe, FileText,
  RotateCcw, MapPin, Undo2, Redo2, RotateCw, Save, Circle, Star, Minus, Hash,
  Wand2, Download, Printer, FileDown, ChevronDown, Landmark, BookmarkPlus,
} from 'lucide-react';
import { StampLicenseUploader } from '@/components/stamp-generator/StampLicenseUploader';
import { LiveStampPreview, type DragUpdateEvent } from '@/components/stamp-generator/LiveStampPreview';
import { useStampHistory } from '@/hooks/useStampHistory';
import { OFFICIAL_INK_BLUE, ALL_SEPARATOR_STYLES, separatorLabel, type SeparatorStyle, type BorderStyleType, type LetterOverride } from '@/lib/stampOfficialTemplate';
import { StampPresetLibrary, saveCustomPreset, type PresetConfig } from '@/components/stamp-generator/StampPresetLibrary';
import { MonogramColorEditor, DEFAULT_MONOGRAM_COLORS, type MonogramLetterColors } from '@/components/stamp-generator/MonogramColorEditor';
import { StampLetterEditor, type LetterSelection } from '@/components/stamp-generator/StampLetterEditor';

// UAE phone normalization
function normalizePhone(raw: string): string {
  if (!raw) return raw;
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('00971')) return '+971' + digits.slice(5);
  if (digits.startsWith('971') && !raw.startsWith('+')) return '+' + digits;
  if (/^0[45]/.test(digits)) return '+971' + digits.slice(1);
  return raw.startsWith('+') ? raw : raw;
}

const UAE_CITIES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];
const NON_UAE_COUNTRIES = ['Lebanon', 'Egypt', 'India', 'Pakistan', 'Jordan', 'Syria', 'Philippines', 'Iraq', 'Morocco'];

function correctCountry(country: string, city: string): string {
  const isWrongCountry = NON_UAE_COUNTRIES.some(c => country.toLowerCase().includes(c.toLowerCase()));
  const isUaeCity = UAE_CITIES.some(c => city.toLowerCase().includes(c.toLowerCase()));
  if (isWrongCountry && isUaeCity) return 'United Arab Emirates';
  return country;
}

type StampType = 'ROUND' | 'OVAL' | 'RECTANGLE' | 'SQUARE';
type StyleTheme = 'CLASSIC' | 'MODERN' | 'MINIMAL' | 'LUXURY' | 'BOLD' | 'VINTAGE';
type BorderStyle = 'SINGLE' | 'DOUBLE' | 'RING' | 'DOTTED' | 'ROPE' | 'CUSTOM';
type TypographyStyle = 'SERIF' | 'SANS' | 'MONOSPACE' | 'CALLIGRAPHY' | 'GOTHIC' | 'ARABIC_MODERN';
type LanguageMode = 'EN' | 'AR' | 'BILINGUAL';
type IconStyle = 'NONE' | 'MONOGRAM' | 'SIMPLE_ICON' | 'UPLOADED_LOGO';

// ── Visual previews ──────────────────────────────────────────────

function ShapePreview({ type, selected }: { type: StampType; selected: boolean }) {
  const color = selected ? 'hsl(var(--gold-dark))' : 'hsl(var(--muted-foreground))';
  const common = `flex items-center justify-center border-2 text-[7px] font-bold tracking-widest`;
  const style = { borderColor: color, color };
  if (type === 'ROUND') return <div className={`${common} rounded-full w-10 h-10`} style={style}>JBJ</div>;
  if (type === 'OVAL') return <div className={`${common} w-14 h-10`} style={{ ...style, borderRadius: '50% / 50%' }}>JBJ</div>;
  if (type === 'RECTANGLE') return <div className={`${common} rounded-md w-16 h-8`} style={style}>JBJ</div>;
  if (type === 'SQUARE') return <div className={`${common} rounded-lg w-10 h-10`} style={style}>JBJ</div>;
  return null;
}

function BorderPreview({ type, selected }: { type: BorderStyle; selected: boolean }) {
  const gold = selected ? 'hsl(var(--gold))' : 'hsl(var(--muted-foreground))';
  const size = 'w-8 h-8 flex-shrink-0';
  if (type === 'SINGLE') return <div className={`${size} rounded-full border-2`} style={{ borderColor: gold }}/>;
  if (type === 'DOUBLE') return <div className={`${size} rounded-full border-2 flex items-center justify-center`} style={{ borderColor: gold }}><div className="w-5 h-5 rounded-full border" style={{ borderColor: gold }}/></div>;
  if (type === 'RING') return <div className={`${size} rounded-full border-[3px] flex items-center justify-center`} style={{ borderColor: gold }}><div className="w-4 h-4 rounded-full border-[2px]" style={{ borderColor: gold }}/></div>;
  if (type === 'DOTTED') return <div className={`${size} rounded-full border-2 border-dotted`} style={{ borderColor: gold }}/>;
  if (type === 'ROPE') return <div className={`${size} rounded-full border-2 border-dashed`} style={{ borderColor: gold }}/>;
  if (type === 'CUSTOM') return <div className={`${size} rounded-full border-4 flex items-center justify-center`} style={{ borderColor: gold }}><div className="w-3 h-3 rounded-full border-2 border-dotted" style={{ borderColor: gold }}/></div>;
  return null;
}

const FONT_META: Record<TypographyStyle, { family: string; label: string; sample: string }> = {
  SERIF: { family: 'Georgia, "Times New Roman", serif', label: 'Serif', sample: 'Abc' },
  SANS: { family: '"Helvetica Neue", Arial, sans-serif', label: 'Sans', sample: 'Abc' },
  MONOSPACE: { family: '"Courier New", Courier, monospace', label: 'Mono', sample: 'Abc' },
  CALLIGRAPHY: { family: '"Palatino Linotype", Palatino, serif', label: 'Script', sample: 'Abc' },
  GOTHIC: { family: '"Copperplate Gothic", Copperplate, "Small Caps", serif', label: 'Gothic', sample: 'Abc' },
  ARABIC_MODERN: { family: '"Arabic Typesetting", "Noto Naskh Arabic", serif', label: 'Arabic', sample: 'أبج' },
};

const THEME_META: Record<StyleTheme, { desc: string }> = {
  CLASSIC: { desc: 'Traditional' }, MODERN: { desc: 'Clean' }, MINIMAL: { desc: 'Hairline' },
  LUXURY: { desc: 'Gold Ring' }, BOLD: { desc: 'Heavy' }, VINTAGE: { desc: 'Ornate' },
};

const BUSINESS_TYPES = [
  'General Trading', 'Real Estate', 'Technology', 'Consulting', 'Construction',
  'Healthcare', 'Education', 'Food & Beverage', 'Tourism', 'Finance', 'Legal', 'Other'
];

const SEPARATOR_GLYPHS: Record<SeparatorStyle, string> = {
  'dot': '●', 'star': '★', 'square': '■', 'diamond': '◆',
  'line': '—', 'double-line': '═', 'triangle': '▲', 'cross': '✦',
  'floral': '❀', 'ornament': '❖', 'dash': '—', 'circle': '◉', 'none': '⊘',
};

const SEPARATOR_OPTIONS: { key: SeparatorStyle; glyph: string; label: string }[] = ALL_SEPARATOR_STYLES.map(key => ({
  key,
  glyph: SEPARATOR_GLYPHS[key],
  label: separatorLabel(key),
}));

const OptionButton = ({ selected, onClick, children, className = '' }: {
  selected: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) => (
  <button
    type="button" onClick={onClick}
    className={`relative px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
      selected
        ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold-dark))]'
        : 'border-[hsl(var(--border))] bg-[#FDFBF7] text-[hsl(var(--foreground))] hover:border-[hsl(var(--gold)/0.4)]'
    } ${className}`}
  >
    {selected && <Check size={8} className="absolute top-0.5 right-0.5 text-[hsl(var(--gold))]"/>}
    {children}
  </button>
);

interface FormState {
  project_name: string;
  company_name: string;
  arabic_company_name: string;
  trade_name_optional: string;
  registration_number_optional: string;
  address_optional: string;
  phone_optional: string;
  email_optional: string;
  website_optional: string;
  city_optional: string;
  country_optional: string;
  arabic_city: string;
  language_mode: LanguageMode;
  stamp_type: StampType;
  style_theme: StyleTheme;
  border_style: BorderStyle;
  typography_style: TypographyStyle;
  density: number;
  icon_style: IconStyle;
  monogram_text: string;
  uploaded_logo_url: string;
  language_reversed: boolean;
  show_license_number: boolean;
  show_location: boolean;
  business_type: string;
  separator_style: SeparatorStyle;
  ink_color: string;
  // New fields
  government_mode: boolean;
  arabic_font: string;
  arabic_letter_spacing: number;
  arabic_arc_spread: number;
  english_arc_spread: number;
  arabic_font_weight: string;
  arc_text_spacing: number;
  circle_gap: number;
  separator_distance: number;
  center_content_size: number;
  company_arc_offset: number;
  location_arc_offset: number;
  selected_preset: string;
  monogram_colors: MonogramLetterColors;
  outer_border_color: string;
  middle_border_color: string;
  inner_border_color: string;
  letter_overrides: Record<string, import('@/lib/stampOfficialTemplate').LetterOverride>;
}

export default function StampProjectWizard() {
  const { user } = useAuth();
  const { isOwner } = useOwnerVerification();
  const navigate = useNavigate();
  const [emailUppercase, setEmailUppercase] = useState(true);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [draftTime, setDraftTime] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('company');
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  const defaultForm: FormState = {
    project_name: 'My Stamp Project', company_name: '', arabic_company_name: '', trade_name_optional: '',
    registration_number_optional: '', address_optional: '', phone_optional: '', email_optional: '',
    website_optional: '', city_optional: 'Dubai', country_optional: 'UAE', arabic_city: '',
    language_mode: 'BILINGUAL' as LanguageMode, stamp_type: 'ROUND' as StampType,
    style_theme: 'CLASSIC' as StyleTheme, border_style: 'DOUBLE' as BorderStyle,
    typography_style: 'SERIF' as TypographyStyle, density: 3, icon_style: 'MONOGRAM' as IconStyle,
    monogram_text: '', uploaded_logo_url: '', language_reversed: true,
    show_license_number: false, show_location: true, business_type: '',
    separator_style: 'dot' as SeparatorStyle, ink_color: OFFICIAL_INK_BLUE,
    government_mode: false, arabic_font: 'Noto Naskh Arabic',
    arabic_letter_spacing: 2, arabic_arc_spread: 88, english_arc_spread: 88, arabic_font_weight: 'bold',
    arc_text_spacing: 2, circle_gap: 13, separator_distance: 50, center_content_size: 50,
    company_arc_offset: 50, location_arc_offset: 50,
    selected_preset: '',
    monogram_colors: DEFAULT_MONOGRAM_COLORS,
    outer_border_color: '', middle_border_color: '', inner_border_color: '',
    letter_overrides: {},
  };

  const [form, setForm] = useState<FormState>(() => {
    try {
      const saved = localStorage.getItem('stamp-wizard-form');
      if (saved) return { ...defaultForm, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return defaultForm;
  });

  const history = useStampHistory<FormState>(form);

  // Persist form + remember last route
  useEffect(() => {
    try { localStorage.setItem('stamp-wizard-form', JSON.stringify(form)); } catch {}
    try { localStorage.setItem('stamp_last_route', '/toolkit/stamp-generator/new'); } catch {}
  }, [form]);

  const set = (key: keyof FormState, val: any) => {
    setForm(f => { const next = { ...f, [key]: val }; history.push(next); return next; });
  };

  // Logo-guard: detect JBJ brand usage and apply policy
  const checkLogoGuard = useCallback(async (monogramText: string, companyName: string) => {
    if (!user?.id) return;
    const text = `${monogramText} ${companyName}`.toUpperCase();
    if (!text.includes('JBJ')) return; // Quick local check before calling backend
    
    try {
      const { data: result, error } = await supabase.functions.invoke('logo-guard', {
        body: { monogramText, companyName },
      });
      
      if (error && error.message?.includes('403')) {
        // Blocked non-owner
        toast.error('This monogram is reserved for JBJ Global Real Estate. Please request unlock from support.', {
          action: { label: 'Support', onClick: () => navigate('/ticket-hub') },
          duration: 8000,
        });
        // Reset monogram
        setForm(f => ({ ...f, monogram_text: '', monogram_colors: DEFAULT_MONOGRAM_COLORS }));
        return;
      }
      
      if (result?.policy === 'owner_auto_style') {
        // Auto-apply JBJ brand rule for owner
        const jbjColors: MonogramLetterColors = {
          letters: { 1: '#B8860B' }, // B in gold, J letters inherit ink
          divider: '#B8860B',
          allLetters: null,
        };
        setForm(f => ({ ...f, monogram_colors: jbjColors }));
        toast.success('JBJ brand rule applied — J letters in ink, B and dividers in gold');
      } else if (result?.policy === 'blocked_non_owner') {
        toast.error(result.message || 'This monogram is reserved.', {
          action: { label: 'Support', onClick: () => navigate('/ticket-hub') },
          duration: 8000,
        });
        setForm(f => ({ ...f, monogram_text: '', monogram_colors: DEFAULT_MONOGRAM_COLORS }));
      }
    } catch {
      // Silent fail — don't block usage on network errors
    }
  }, [user?.id, navigate]);

  // Trigger logo-guard check when monogram text changes
  useEffect(() => {
    const mono = form.monogram_text.toUpperCase();
    if (mono.includes('JBJ') || form.company_name.toUpperCase().includes('JBJ')) {
      const timer = setTimeout(() => checkLogoGuard(form.monogram_text, form.company_name), 500);
      return () => clearTimeout(timer);
    }
  }, [form.monogram_text, form.company_name, checkLogoGuard]);

  const handleUndo = useCallback(() => { const prev = history.undo(); if (prev) setForm(prev); }, [history]);
  const handleRedo = useCallback(() => { const next = history.redo(); if (next) setForm(next); }, [history]);

  const handleReset = useCallback(() => {
    setForm(defaultForm); history.reset(defaultForm); toast.success('Form reset to defaults');
  }, [history]);

  const handlePresetSelect = useCallback((config: PresetConfig, presetNameStr: string) => {
    setForm(f => {
      const next = {
        ...f,
        style_theme: config.style_theme as StyleTheme,
        border_style: config.border_style as BorderStyle,
        typography_style: config.typography_style as TypographyStyle,
        density: config.density,
        stamp_type: config.stamp_type as StampType,
        separator_style: config.separator_style as SeparatorStyle,
        icon_style: config.icon_style as IconStyle,
        language_mode: config.language_mode as LanguageMode,
        show_license_number: config.show_license_number,
        show_location: config.show_location,
        government_mode: config.government_mode || false,
        selected_preset: presetNameStr,
        ...(config.arabic_font ? { arabic_font: config.arabic_font } : {}),
        ...(config.arc_text_spacing ? { arc_text_spacing: config.arc_text_spacing } : {}),
        ...(config.circle_gap ? { circle_gap: config.circle_gap } : {}),
        ...(config.center_content_size ? { center_content_size: config.center_content_size } : {}),
      };
      history.push(next);
      return next;
    });
    toast.success(`Applied "${presetNameStr}" preset`);
  }, [history]);

  const handleSaveCustomPreset = useCallback(() => {
    if (!presetName.trim()) { toast.error('Enter a name'); return; }
    const config: PresetConfig = {
      style_theme: form.style_theme,
      border_style: form.border_style,
      typography_style: form.typography_style,
      density: form.density,
      stamp_type: form.stamp_type,
      separator_style: form.separator_style,
      icon_style: form.icon_style,
      language_mode: form.language_mode,
      show_license_number: form.show_license_number,
      show_location: form.show_location,
      government_mode: form.government_mode,
      arabic_font: form.arabic_font,
      arc_text_spacing: form.arc_text_spacing,
      circle_gap: form.circle_gap,
      center_content_size: form.center_content_size,
    };
    saveCustomPreset(presetName.trim(), config);
    setPresetName('');
    setSavePresetOpen(false);
  }, [form, presetName]);

  const handleSaveDraft = useCallback(() => {
    try {
      localStorage.setItem('stamp-wizard-form', JSON.stringify(form));
      const now = new Date();
      setDraftTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      toast.success('Draft saved locally');
    } catch {}
  }, [form]);

  async function handleCreate() {
    if (!form.company_name.trim()) { 
      toast.error('Please enter a company name first');
      setActiveTab('company');
      setTimeout(() => document.querySelector<HTMLInputElement>('[placeholder*="Acme"]')?.focus(), 100);
      return; 
    }
    if (!user?.id) { 
      toast.info('Please sign in to generate AI concepts. Your design will be saved.');
      return; 
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('stamp_projects')
        .insert({
          user_id: user.id, project_name: form.project_name || 'My Stamp Project',
          company_name: form.company_name.trim(), arabic_company_name: form.arabic_company_name || null,
          trade_name_optional: form.trade_name_optional || null, registration_number_optional: form.registration_number_optional || null,
          address_optional: form.address_optional || null, phone_optional: form.phone_optional || null,
          email_optional: form.email_optional || null, website_optional: form.website_optional || null,
          city_optional: form.city_optional || 'Dubai', country_optional: form.country_optional || 'UAE',
          arabic_city: form.arabic_city || null, language_mode: form.language_mode, stamp_type: form.stamp_type,
          style_theme: form.style_theme, border_style: form.border_style, typography_style: form.typography_style,
          density: form.density, icon_style: form.icon_style, monogram_text: form.monogram_text || null,
          uploaded_logo_url: form.uploaded_logo_url || null, language_reversed: form.language_reversed,
          show_license_number: form.show_license_number, show_location: form.show_location,
          business_type: form.business_type || null,
          layout_json: {
            separator_style: form.separator_style, ink_color: form.ink_color,
            government_mode: form.government_mode, arabic_font: form.arabic_font,
            arabic_letter_spacing: form.arabic_letter_spacing, arabic_arc_spread: form.arabic_arc_spread,
            english_arc_spread: form.english_arc_spread,
            arabic_font_weight: form.arabic_font_weight, arc_text_spacing: form.arc_text_spacing,
            circle_gap: form.circle_gap, separator_distance: form.separator_distance,
            center_content_size: form.center_content_size, selected_preset: form.selected_preset,
            company_arc_offset: form.company_arc_offset,
            location_arc_offset: form.location_arc_offset,
            monogram_colors: form.monogram_colors as any,
            outer_border_color: form.outer_border_color,
            middle_border_color: form.middle_border_color,
            inner_border_color: form.inner_border_color,
          } as any,
        })
        .select().single();
      if (error) throw error;
      try { localStorage.removeItem('stamp-wizard-form'); } catch {}
      // Navigate silently — no toast interruption; the editor handles its own loading state
      navigate(`/toolkit/stamp-generator/${data.id}/generate?fresh=1`);
    } catch (error: any) {
      toast.error(`Failed: ${error?.message || 'Unknown error'}`);
    }
    setSaving(false);
  }

  const handleLogoUpload = useCallback((file: File) => {
    if (!file) return;
    if (file.type !== 'image/svg+xml') {
      const img = new window.Image();
      img.onload = () => {
        const MIN = 512;
        const canvas = document.createElement('canvas');
        const targetSize = Math.max(MIN, Math.max(img.width, img.height));
        canvas.width = targetSize; canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
          const scale = targetSize / Math.max(img.width, img.height);
          const dw = img.width * scale; const dh = img.height * scale;
          ctx.drawImage(img, (targetSize - dw) / 2, (targetSize - dh) / 2, dw, dh);
          const hiResUrl = canvas.toDataURL('image/png', 1.0);
          setLogoPreview(hiResUrl); set('uploaded_logo_url', hiResUrl);
        }
      };
      img.src = URL.createObjectURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = ev => { const d = ev.target?.result as string; setLogoPreview(d); set('uploaded_logo_url', d); };
      reader.readAsDataURL(file);
    }
  }, []);

  // ─── Robust export helpers (Safari/iPad safe) ─────────────────────

  const getPreviewSvg = useCallback((): string | null => {
    const el = document.querySelector('#stamp-preview-container svg');
    if (!el) { toast.error('No stamp to export — enter company details first'); return null; }
    let svgData = new XMLSerializer().serializeToString(el);
    if (!svgData.includes('xmlns=')) svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    if (!svgData.includes('xmlns:xlink')) svgData = svgData.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    // Strip React useId()-scoped IDs that break standalone SVG files
    svgData = svgData.replace(/\bid="[^"]*:[^"]*"/g, '');
    svgData = svgData.replace(/url\(#[^)]*:[^)]*\)/g, 'url(#)');
    svgData = svgData.replace(/href="#[^"]*:[^"]*"/g, 'href="#"');
    // Strip data-* attributes (not valid SVG namespace)
    svgData = svgData.replace(/\s+data-[a-z-]+="[^"]*"/gi, '');
    return svgData;
  }, []);

  const triggerDownload = useCallback((blob: Blob, filename: string) => {
    requestAnimationFrame(() => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      requestAnimationFrame(() => {
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      });
    });
  }, []);

  const svgToCanvas = useCallback(async (svgData: string, size: number, whiteBg: boolean): Promise<HTMLCanvasElement> => {
    const b64 = btoa(unescape(encodeURIComponent(svgData)));
    const dataUrl = `data:image/svg+xml;base64,${b64}`;
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = async () => {
        try { await img.decode(); } catch {}
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        if (whiteBg) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size); }
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas);
      };
      img.onerror = () => reject(new Error('SVG image failed to load'));
      img.src = dataUrl;
    });
  }, []);

  const handleExportSVG = useCallback(() => {
    const svgData = getPreviewSvg();
    if (!svgData) return;
    // Add XML declaration for standalone file validity
    const withDecl = svgData.startsWith('<?xml') ? svgData : `<?xml version="1.0" encoding="UTF-8"?>\n${svgData}`;
    const slug = (form.company_name || 'stamp').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const blob = new Blob([withDecl], { type: 'image/svg+xml;charset=utf-8' });
    triggerDownload(blob, `${slug}_stamp.svg`);
    toast.success('SVG downloaded');
  }, [form.company_name, getPreviewSvg, triggerDownload]);

  const handleExportPNG = useCallback(async (size: number) => {
    const svgData = getPreviewSvg();
    if (!svgData) return;
    try {
      const canvas = await svgToCanvas(svgData, size, false);
      canvas.toBlob(blob => {
        if (!blob) { toast.error('PNG generation failed'); return; }
        triggerDownload(blob, `${form.company_name || 'stamp'}-${size}px.png`);
        toast.success(`PNG ${size}px downloaded`);
      }, 'image/png');
    } catch (e) { toast.error('PNG export failed'); }
  }, [form.company_name, getPreviewSvg, svgToCanvas, triggerDownload]);

  const handleExportJPG = useCallback(async (size: number) => {
    const svgData = getPreviewSvg();
    if (!svgData) return;
    try {
      const canvas = await svgToCanvas(svgData, size, true);
      canvas.toBlob(blob => {
        if (!blob) { toast.error('JPG generation failed'); return; }
        triggerDownload(blob, `${form.company_name || 'stamp'}-${size}px.jpg`);
        toast.success(`JPG ${size}px downloaded`);
      }, 'image/jpeg', 0.92);
    } catch (e) { toast.error('JPG export failed'); }
  }, [form.company_name, getPreviewSvg, svgToCanvas, triggerDownload]);

  const handleExportWEBP = useCallback(async (size: number) => {
    const svgData = getPreviewSvg();
    if (!svgData) return;
    try {
      const canvas = await svgToCanvas(svgData, size, false);
      canvas.toBlob(blob => {
        if (!blob) { toast.error('WEBP generation failed'); return; }
        triggerDownload(blob, `${form.company_name || 'stamp'}-${size}px.webp`);
        toast.success(`WEBP ${size}px downloaded`);
      }, 'image/webp', 0.92);
    } catch (e) { toast.error('WEBP export failed'); }
  }, [form.company_name, getPreviewSvg, svgToCanvas, triggerDownload]);

  const handleExportPDF = useCallback(async () => {
    const svgData = getPreviewSvg();
    if (!svgData) return;
    try {
      toast.info('Generating PDF…');
      const canvas = await svgToCanvas(svgData, 1200, true);
      const pngDataUrl = canvas.toDataURL('image/png');
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      pdfDoc.setTitle(`${form.company_name || 'Stamp'} - PDF`);
      pdfDoc.setAuthor('JBJ Smart Stamp Generator');
      const pointSize = 300;
      const page = pdfDoc.addPage([pointSize, pointSize]);
      page.drawRectangle({ x: 0, y: 0, width: pointSize, height: pointSize, color: rgb(1, 1, 1) });
      const response = await fetch(pngDataUrl);
      const pngBytes = await response.arrayBuffer();
      const pngImage = await pdfDoc.embedPng(pngBytes);
      page.drawImage(pngImage, { x: 0, y: 0, width: pointSize, height: pointSize });
      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      triggerDownload(blob, `${form.company_name || 'stamp'}-print.pdf`);
      toast.success('PDF downloaded');
    } catch (e) { toast.error('PDF export failed'); console.error(e); }
  }, [form.company_name, getPreviewSvg, svgToCanvas, triggerDownload]);

  const handlePrintPreview = useCallback(() => {
    const svgData = getPreviewSvg();
    if (!svgData) return;
    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head>
        <title>Print Stamp — ${form.company_name || 'Stamp'}</title>
        <style>
          @page { size: 100mm 100mm; margin: 10mm; }
          html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: white; }
          body { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          svg { width: 80mm; height: 80mm; max-width: 100%; }
        </style>
      </head><body>${svgData}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.onafterprint = () => printWindow.close();
      setTimeout(() => printWindow.print(), 600);
    }
  }, [form.company_name, getPreviewSvg]);

  const [bulkExporting, setBulkExporting] = useState(false);
  const handleBulkExport = useCallback(async () => {
    const svgData = getPreviewSvg();
    if (!svgData) return;
    setBulkExporting(true);
    toast.info('Generating ZIP with all formats…');
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const slug = (form.company_name || 'stamp').toLowerCase().replace(/\s+/g, '_');

      // SVG
      zip.file(`${slug}.svg`, svgData);

      // PNG transparent 1024
      const canvasT = await svgToCanvas(svgData, 1024, false);
      const pngTBlob: Blob = await new Promise((res, rej) => canvasT.toBlob(b => b ? res(b) : rej(), 'image/png'));
      zip.file(`${slug}-1024px-transparent.png`, pngTBlob);

      // PNG white 1024
      const canvasW = await svgToCanvas(svgData, 1024, true);
      const pngWBlob: Blob = await new Promise((res, rej) => canvasW.toBlob(b => b ? res(b) : rej(), 'image/png'));
      zip.file(`${slug}-1024px-white.png`, pngWBlob);

      // JPG
      const canvasJ = await svgToCanvas(svgData, 1024, true);
      const jpgBlob: Blob = await new Promise((res, rej) => canvasJ.toBlob(b => b ? res(b) : rej(), 'image/jpeg', 0.92));
      zip.file(`${slug}-1024px.jpg`, jpgBlob);

      // WEBP
      const canvasWp = await svgToCanvas(svgData, 1024, false);
      const webpBlob: Blob = await new Promise((res, rej) => canvasWp.toBlob(b => b ? res(b) : rej(), 'image/webp', 0.92));
      zip.file(`${slug}-1024px.webp`, webpBlob);

      // PDF
      const canvasPdf = await svgToCanvas(svgData, 1200, true);
      const pngDataUrl = canvasPdf.toDataURL('image/png');
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();
      pdfDoc.setTitle(`${form.company_name || 'Stamp'} - PDF`);
      const pointSize = 300;
      const page = pdfDoc.addPage([pointSize, pointSize]);
      page.drawRectangle({ x: 0, y: 0, width: pointSize, height: pointSize, color: rgb(1, 1, 1) });
      const response = await fetch(pngDataUrl);
      const pngBytes = await response.arrayBuffer();
      const pngImage = await pdfDoc.embedPng(pngBytes);
      page.drawImage(pngImage, { x: 0, y: 0, width: pointSize, height: pointSize });
      const pdfBytes = await pdfDoc.save();
      zip.file(`${slug}-print.pdf`, pdfBytes);

      // Preset JSON
      zip.file(`${slug}-preset.json`, JSON.stringify(form, null, 2));

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      triggerDownload(zipBlob, `${slug}_stamp_kit.zip`);
      toast.success('All formats downloaded as ZIP!');
    } catch (e) { toast.error('ZIP export failed. Try individual downloads.'); console.error(e); }
    setBulkExporting(false);
  }, [form, getPreviewSvg, svgToCanvas, triggerDownload]);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<LetterSelection | null>(null);

  const handleLetterClick = useCallback((selection: LetterSelection) => {
    setSelectedLetter(selection);
    setSelectedElement(null); // Clear element selection when letter is selected
    if (activeTab !== 'style') setActiveTab('style'); // Show letter editor in style tab
  }, [activeTab]);

  const handleLetterOverrideUpdate = useCallback((key: string, override: LetterOverride | null) => {
    setForm(f => {
      const newOverrides = { ...f.letter_overrides };
      if (override) {
        newOverrides[key] = override;
      } else {
        delete newOverrides[key];
      }
      return { ...f, letter_overrides: newOverrides };
    });
  }, []);

  const handleElementClick = useCallback((elementId: string) => {
    // Highlight the clicked element
    setSelectedElement(elementId);
    setSelectedLetter(null); // Clear letter selection

    // Navigate to corresponding tab only if not already there
    if (elementId.includes('top-arc') || elementId.includes('bottom-arc')) {
      if (activeTab !== 'company') setActiveTab('company');
      setTimeout(() => {
        if (elementId.includes('top-arc')) document.querySelector<HTMLInputElement>('[dir="rtl"]')?.focus();
        else document.querySelector<HTMLInputElement>('[placeholder*="Acme"]')?.focus();
      }, 100);
    } else if (elementId.includes('center') || elementId.includes('registration')) {
      if (activeTab !== 'logo') setActiveTab('logo');
    } else if (elementId.includes('separator')) {
      if (activeTab !== 'style') setActiveTab('style');
    }

    // Persistent highlight — clears only when clicking a different element or outside
  }, []);

  // ── Drag-to-reposition handler ──
  const handleDragUpdate = useCallback((event: DragUpdateEvent) => {
    const PARAM_MAP: Record<string, keyof FormState> = {
      companyArcOffset: 'company_arc_offset',
      locationArcOffset: 'location_arc_offset',
      separatorDistance: 'separator_distance',
      centerContentSize: 'center_content_size',
      circleGap: 'circle_gap',
      arabicArcSpread: 'arabic_arc_spread',
      englishArcSpread: 'english_arc_spread',
    };
    const formKey = PARAM_MAP[event.param];
    if (formKey) {
      setForm(f => ({ ...f, [formKey]: event.value }));
    }
  }, []);

  // Build monogram color overrides for the template
  // Normal users: all letters = ink (template default), unless they customize
  // When allLetters is set, pass per-letter overrides for all 3 letters
  const buildMonogramColors = (): Record<number, string> | undefined => {
    if (form.monogram_colors.allLetters) {
      const mono = (form.monogram_text || form.company_name.slice(0, 3)).toUpperCase();
      const colors: Record<number, string> = {};
      for (let i = 0; i < mono.length; i++) colors[i] = form.monogram_colors.allLetters;
      return colors;
    }
    if (Object.keys(form.monogram_colors.letters).length > 0) {
      return form.monogram_colors.letters;
    }
    return undefined; // Template defaults all to ink
  };

  const previewProps = {
    companyName: form.company_name, arabicCompanyName: form.arabic_company_name,
    city: form.city_optional, country: form.country_optional,
    registrationNumber: form.registration_number_optional, stampType: form.stamp_type,
    styleTheme: form.style_theme, borderStyle: form.border_style, typographyStyle: form.typography_style,
    density: form.density, iconStyle: form.icon_style as any, monogramText: form.monogram_text,
    uploadedLogoUrl: form.uploaded_logo_url, languageMode: form.language_mode,
    languageReversed: form.language_reversed, showLicenseNumber: form.show_license_number,
    showLocation: form.show_location, separatorStyle: form.separator_style,
    inkColor: form.ink_color, arabicCity: form.arabic_city,
    arabicArcSpread: form.arabic_arc_spread,
    englishArcSpread: form.english_arc_spread,
    arabicLetterSpacing: form.arabic_letter_spacing,
    arabicFont: form.arabic_font,
    arabicFontWeight: form.arabic_font_weight,
    circleGap: form.circle_gap,
    centerContentSize: form.center_content_size,
    companyArcBandOffset: form.company_arc_offset,
    locationArcBandOffset: form.location_arc_offset,
    onElementClick: handleElementClick,
    onDragUpdate: handleDragUpdate,
    monogramLetterColors: buildMonogramColors(),
    monogramDividerColor: form.monogram_colors.divider || undefined,
    arcTextSpacing: form.arc_text_spacing,
    separatorDistance: form.separator_distance,
    outerBorderColor: form.outer_border_color || undefined,
    middleBorderColor: form.middle_border_color || undefined,
    innerBorderColor: form.inner_border_color || undefined,
    onLetterClick: handleLetterClick,
    letterOverrides: Object.keys(form.letter_overrides).length > 0 ? form.letter_overrides : undefined,
  };

  return (
    <div className="h-[calc(100dvh-52px)] flex flex-col bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))] overflow-hidden">
      {/* ── Top toolbar — professional header with premium spacing ── */}
      <div className="flex-shrink-0 border-b border-[hsl(var(--border))] bg-[#FDFBF7]/95 backdrop-blur-md px-5 py-3.5 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center shadow-sm">
          <Stamp size={16} className="text-white"/>
        </div>
        <h1 className="font-semibold text-[hsl(var(--foreground))] text-sm tracking-tight">Stamp Studio</h1>
        {isOwner && (
          <Badge className="bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)] text-[9px]">Owner</Badge>
        )}
        
        <div className="flex-1"/>

        {draftTime && (
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] italic">Draft saved at {draftTime}</span>
        )}

        {/* Undo/Redo/Reset */}
        <div className="flex items-center gap-0.5 bg-[#FDFBF7] rounded-lg border border-[hsl(var(--border))] shadow-sm px-1 py-0.5">
          <button onClick={handleUndo} disabled={!history.canUndo} className="w-6 h-6 rounded flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] disabled:opacity-30" title="Undo"><Undo2 size={11}/></button>
          <button onClick={handleRedo} disabled={!history.canRedo} className="w-6 h-6 rounded flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] disabled:opacity-30" title="Redo"><Redo2 size={11}/></button>
          <div className="w-px h-3.5 bg-[hsl(var(--border))]"/>
          <button onClick={handleReset} className="w-6 h-6 rounded flex items-center justify-center hover:bg-destructive/10" title="Reset"><RotateCw size={11}/></button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={handleSaveDraft} className="gap-1 text-xs h-7 px-2.5">
            <Save size={11}/> Save Draft
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={saving}
            className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1 text-xs h-7 px-3">
            <Wand2 size={11}/> {saving ? 'Creating...' : 'Generate Concepts'}
          </Button>
        </div>
      </div>

      {/* ── Main body: controls left + centered preview right ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Tabbed controls panel — narrower */}
        <div className="w-[320px] flex-shrink-0 border-r border-[hsl(var(--border))] bg-[#FDFBF7] flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
            <TabsList className="flex-shrink-0 w-full rounded-none border-b border-[hsl(var(--border))] bg-[hsl(var(--pearl-1))] h-9 px-1">
              <TabsTrigger value="company" className="text-[11px] gap-1 data-[state=active]:bg-[#FDFBF7]"><Building2 size={11}/>Company</TabsTrigger>
              <TabsTrigger value="style" className="text-[11px] gap-1 data-[state=active]:bg-[#FDFBF7]"><Palette size={11}/>Style</TabsTrigger>
              <TabsTrigger value="logo" className="text-[11px] gap-1 data-[state=active]:bg-[#FDFBF7]"><Image size={11}/>Logo</TabsTrigger>
              <TabsTrigger value="export" className="text-[11px] gap-1 data-[state=active]:bg-[#FDFBF7]"><Download size={11}/>Export</TabsTrigger>
            </TabsList>

            {/* ── Company Tab ── */}
            <TabsContent value="company" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {/* Smart Auto-Fill from Trade License — primary entry */}

                  {/* Save as Custom Template */}
                  {savePresetOpen ? (
                    <div className="flex gap-1.5 items-center">
                      <Input value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="Preset name" className="h-7 text-xs flex-1" />
                      <Button size="sm" onClick={handleSaveCustomPreset} className="h-7 text-[10px] px-2 bg-[hsl(var(--gold))] text-white hover:opacity-90">Save</Button>
                      <Button variant="ghost" size="sm" onClick={() => setSavePresetOpen(false)} className="h-7 text-[10px] px-1.5"><X size={10} /></Button>
                    </div>
                  ) : (
                    <button onClick={() => setSavePresetOpen(true)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] text-[10px] font-medium hover:bg-[hsl(var(--gold)/0.04)]">
                      <BookmarkPlus size={10} /> Save Current as Custom Preset
                    </button>
                  )}

                  <div className="border-t border-[hsl(var(--border))]" />

                  {/* Language Mode — FIRST */}
                  <div>
                    <Label className="text-[11px] font-medium mb-1.5 block">Language Mode <span className="text-destructive">*</span></Label>
                    <p className="text-[9px] text-[hsl(var(--muted-foreground))] mb-1.5">Select the language(s) for your stamp before entering details</p>
                    <div className="flex gap-2">
                      {(['EN', 'AR', 'BILINGUAL'] as LanguageMode[]).map(l => (
                        <OptionButton key={l} selected={form.language_mode === l} onClick={() => set('language_mode', l)}>
                          {l === 'EN' ? 'English Only' : l === 'AR' ? 'Arabic Only' : 'Bilingual (AR + EN)'}
                        </OptionButton>
                      ))}
                    </div>
                  </div>

                  {/* Smart Auto-Fill with guide tooltip */}
                  <div className="border-2 border-dashed border-[hsl(var(--gold)/0.5)] rounded-lg bg-[hsl(var(--gold)/0.04)] relative">
                    {!localStorage.getItem('stamp-autofill-dismissed') && !licenseOpen && (
                      <div className="absolute -top-2 left-3 px-2 py-0.5 bg-[hsl(var(--gold))] text-white text-[8px] font-bold rounded-full uppercase tracking-wider z-10">
                        ✦ Recommended
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => { setLicenseOpen(!licenseOpen); try { localStorage.setItem('stamp-autofill-dismissed', '1'); } catch {} }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-semibold text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.08)] rounded-lg transition-colors"
                    >
                      <FileText size={14} className="text-[hsl(var(--gold))]" />
                      <div className="text-left flex-1">
                        <p>Smart Auto-Fill from Trade License</p>
                        <p className="text-[9px] font-normal text-[hsl(var(--muted-foreground))]">Upload your trade license to auto-fill all company details</p>
                      </div>
                      <ChevronDown size={12} className={`transition-transform ${licenseOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {licenseOpen && (
                      <div className="px-3 pb-3 pt-2">
                        <StampLicenseUploader
                          onExtracted={(data) => {
                            if (data.company_name) set('company_name', data.company_name);
                            if (data.arabic_company_name) { set('arabic_company_name', data.arabic_company_name); set('language_mode', 'BILINGUAL'); }
                            if (data.registration_number) set('registration_number_optional', data.registration_number);
                            const city = data.city || '';
                            if (city) set('city_optional', city);
                            const ARABIC_CITY_MAP: Record<string, string> = {
                              'dubai': 'دبي', 'abu dhabi': 'أبوظبي', 'sharjah': 'الشارقة',
                              'ajman': 'عجمان', 'ras al khaimah': 'رأس الخيمة', 'fujairah': 'الفجيرة', 'umm al quwain': 'أم القيوين',
                            };
                            const mappedArabic = city ? ARABIC_CITY_MAP[city.toLowerCase()] : undefined;
                            let arabicCityValue = (data as any).arabic_city || '';
                            if (arabicCityValue && /[a-zA-Z]/.test(arabicCityValue) && mappedArabic) arabicCityValue = mappedArabic + '، الإمارات';
                            else if (!arabicCityValue && mappedArabic) arabicCityValue = mappedArabic + '، الإمارات';
                            if (arabicCityValue) set('arabic_city', arabicCityValue);
                            const rawCountry = data.country || '';
                            set('country_optional', correctCountry(rawCountry, city) || 'UAE');
                            if (data.phone) set('phone_optional', normalizePhone(data.phone));
                            if (data.email) set('email_optional', data.email.toUpperCase());
                            if ((data as any).business_type) set('business_type', (data as any).business_type);
                            setLicenseOpen(false);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Label className="text-[11px] font-medium mb-1 block">Project Name</Label>
                      <Input value={form.project_name} onChange={e => set('project_name', e.target.value)} placeholder="e.g. Main Company Stamp" className="h-8 text-sm"/>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[11px] font-medium mb-1 block">Company Name <span className="text-destructive">*</span></Label>
                      <Input value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="e.g. Acme Properties LLC" className="h-8 text-sm"/>
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium mb-1 block">Trade Name</Label>
                      <Input value={form.trade_name_optional} onChange={e => set('trade_name_optional', e.target.value)} placeholder="Optional" className="h-8 text-sm"/>
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium mb-1 block">Registration No.</Label>
                      <Input value={form.registration_number_optional} onChange={e => set('registration_number_optional', e.target.value)} placeholder="Optional" className="h-8 text-sm"/>
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium mb-1 block">City</Label>
                      <Input value={form.city_optional} onChange={e => set('city_optional', e.target.value)} placeholder="Dubai" className="h-8 text-sm"/>
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium mb-1 block">Country</Label>
                      <Input value={form.country_optional} onChange={e => set('country_optional', e.target.value)} placeholder="UAE" className="h-8 text-sm"/>
                    </div>
                    <div>
                      <Label className="text-[11px] font-medium mb-1 block">Phone</Label>
                      <Input value={form.phone_optional} onChange={e => set('phone_optional', e.target.value)} placeholder="+971..." className="h-8 text-sm"/>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-[11px] font-medium">Email</Label>
                        <button type="button" onClick={() => setEmailUppercase(v => !v)}
                          className="text-[9px] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] rounded px-1 py-0.5 flex items-center gap-0.5">
                          <Type size={8}/> {emailUppercase ? 'ABC' : 'abc'}
                        </button>
                      </div>
                      <Input value={form.email_optional}
                        onChange={e => set('email_optional', emailUppercase ? e.target.value.toUpperCase() : e.target.value)}
                        placeholder={emailUppercase ? 'INFO@COMPANY.COM' : 'info@company.com'}
                        className={`h-8 text-sm ${emailUppercase ? 'uppercase' : ''}`}/>
                    </div>
                  </div>

                  {/* Business Type */}
                  <div>
                    <Label className="text-[11px] font-medium mb-1.5 block">Business Type</Label>
                    <div className="flex gap-1 flex-wrap">
                      {BUSINESS_TYPES.map(bt => (
                        <OptionButton key={bt} selected={form.business_type === bt} onClick={() => set('business_type', bt)} className="text-[10px] px-2 py-1">{bt}</OptionButton>
                      ))}
                    </div>
                  </div>

                  {/* Language Mode — already shown at top, just a reminder link */}

                  {/* Arabic fields */}
                  {(form.language_mode === 'AR' || form.language_mode === 'BILINGUAL') && (
                    <div className="border border-[hsl(var(--gold)/0.3)] bg-[hsl(var(--gold)/0.04)] rounded-xl p-3 space-y-2">
                      <p className="text-[11px] font-semibold text-[hsl(var(--gold-dark))]">Arabic Details</p>
                      <Input value={form.arabic_company_name} onChange={e => set('arabic_company_name', e.target.value)} placeholder="اسم الشركة بالعربية" dir="rtl" className="h-8 text-sm"/>
                      <Input value={form.arabic_city} onChange={e => set('arabic_city', e.target.value)} placeholder="دبي، الإمارات" dir="rtl" className="h-8 text-sm"/>
                      {form.language_mode === 'BILINGUAL' && (
                        <button type="button" onClick={() => set('language_reversed', !form.language_reversed)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-left ${
                            form.language_reversed ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))]'
                          }`}>
                          <RotateCcw size={12} className={form.language_reversed ? 'text-[hsl(var(--gold-dark))]' : 'text-[hsl(var(--muted-foreground))]'}/>
                          <div>
                            <p className="text-[11px] font-semibold">Language Order</p>
                            <p className="text-[9px] text-[hsl(var(--muted-foreground))]">{form.language_reversed ? 'Arabic top · English bottom' : 'English top · Arabic bottom'}</p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Toggle: Show Location */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-[hsl(var(--border))]">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-[hsl(var(--gold))]"/>
                      <span className="text-[11px] font-medium">Show Location</span>
                    </div>
                    <Switch checked={form.show_location} onCheckedChange={v => set('show_location', v)}/>
                  </div>

                  {/* Toggle: Show License Number — always visible */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-[hsl(var(--border))]">
                    <div className="flex items-center gap-2">
                      <FileText size={12} className="text-[hsl(var(--gold))]"/>
                      <span className="text-[11px] font-medium">Show Trade License Number</span>
                    </div>
                    <Switch checked={form.show_license_number} onCheckedChange={v => set('show_license_number', v)}/>
                  </div>
                  {form.show_license_number && !form.registration_number_optional && (
                    <Input value={form.registration_number_optional} onChange={e => set('registration_number_optional', e.target.value)} placeholder="Enter trade license number" className="h-8 text-sm"/>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── Style Tab ── */}
            <TabsContent value="style" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {/* Letter Editor — shown when a letter is selected on canvas */}
                  {selectedLetter && (
                    <StampLetterEditor
                      selection={selectedLetter}
                      overrides={form.letter_overrides}
                      inkColor={form.ink_color}
                      onUpdate={handleLetterOverrideUpdate}
                      onClose={() => setSelectedLetter(null)}
                    />
                  )}
                  {/* Shape */}
                  <div>
                    <Label className="text-[11px] font-medium mb-1.5 block">Shape</Label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['ROUND', 'OVAL', 'RECTANGLE', 'SQUARE'] as StampType[]).map(t => (
                        <button key={t} type="button" onClick={() => set('stamp_type', t)}
                          className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                            form.stamp_type === t ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                          }`}>
                          {form.stamp_type === t && <Check size={8} className="absolute top-0.5 right-0.5 text-[hsl(var(--gold))]"/>}
                          <ShapePreview type={t} selected={form.stamp_type === t}/>
                          <span className="text-[9px] font-medium">{t.charAt(0) + t.slice(1).toLowerCase()}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme */}
                  <div>
                    <Label className="text-[11px] font-medium mb-1.5 block">Theme</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['CLASSIC', 'MODERN', 'MINIMAL', 'LUXURY', 'BOLD', 'VINTAGE'] as StyleTheme[]).map(t => (
                        <OptionButton key={t} selected={form.style_theme === t} onClick={() => set('style_theme', t)} className="text-[10px]">
                          {t.charAt(0) + t.slice(1).toLowerCase()} <span className="text-[8px] text-[hsl(var(--muted-foreground))] ml-0.5">{THEME_META[t].desc}</span>
                        </OptionButton>
                      ))}
                    </div>
                  </div>

                  {/* Border */}
                  <div>
                    <Label className="text-[11px] font-medium mb-1.5 block">Border Style</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['SINGLE', 'DOUBLE', 'RING', 'DOTTED', 'ROPE', 'CUSTOM'] as BorderStyle[]).map(b => (
                        <button key={b} type="button" onClick={() => set('border_style', b)}
                          className={`relative flex items-center gap-1.5 p-2 rounded-lg border-2 transition-all text-left ${
                            form.border_style === b ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                          }`}>
                          {form.border_style === b && <Check size={8} className="absolute top-0.5 right-0.5 text-[hsl(var(--gold))]"/>}
                          <BorderPreview type={b} selected={form.border_style === b}/>
                          <span className="text-[10px] font-medium">{b.charAt(0) + b.slice(1).toLowerCase()}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Separator Style */}
                  {form.stamp_type === 'ROUND' && (form.language_mode === 'BILINGUAL' || form.language_mode === 'AR') && (
                    <div>
                      <Label className="text-[11px] font-medium mb-1.5 block">Arc Separators</Label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {SEPARATOR_OPTIONS.map(opt => (
                          <button key={opt.key} type="button" onClick={() => set('separator_style', opt.key)}
                            className={`flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                              form.separator_style === opt.key
                                ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold-dark))]'
                                : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                            }`}>
                            <span className="text-sm">{opt.glyph}</span>
                            <span className="text-[8px]">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Typography */}
                  <div>
                    <Label className="text-[11px] font-medium mb-1.5 block">Typography</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(Object.keys(FONT_META) as TypographyStyle[]).map(t => {
                        const meta = FONT_META[t];
                        return (
                          <button key={t} type="button" onClick={() => set('typography_style', t)}
                            className={`relative flex items-center gap-1.5 p-2 rounded-lg border-2 transition-all text-left ${
                              form.typography_style === t ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                            }`}>
                            {form.typography_style === t && <Check size={8} className="absolute top-0.5 right-0.5 text-[hsl(var(--gold))]"/>}
                            <span className="text-base leading-none" style={{ fontFamily: meta.family }}>{meta.sample}</span>
                            <span className="text-[9px] font-medium">{meta.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ink Color */}
                  <div>
                    <Label className="text-[11px] font-medium mb-1.5 block">Ink Color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.ink_color} onChange={e => set('ink_color', e.target.value)}
                        className="w-8 h-8 rounded-lg border-2 border-[hsl(var(--border))] cursor-pointer p-0.5"/>
                      <Input value={form.ink_color} onChange={e => set('ink_color', e.target.value)}
                        className="w-24 font-mono text-xs uppercase h-8" maxLength={7}/>
                      <Button variant="outline" size="sm" onClick={() => { set('ink_color', OFFICIAL_INK_BLUE); toast.success('Reset to Corporate Official Blue'); }}
                        className="text-[10px] gap-1 h-8 px-2">
                        <RotateCcw size={9}/> Standard
                      </Button>
                    </div>
                  </div>

                  {/* Color Palette */}
                  <div>
                    <Label className="text-[11px] font-medium mb-1.5 block">Color Palette</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { color: '#1B3A8C', label: 'Ink Standard (Navy)' },
                        { color: '#000000', label: 'Black' },
                        { color: '#8B0000', label: 'Dark Red' },
                        { color: '#0B5345', label: 'Forest Green' },
                        { color: '#4A235A', label: 'Royal Purple' },
                        { color: '#1C2833', label: 'Charcoal' },
                        { color: '#1A5276', label: 'Ocean Blue' },
                        { color: '#7D6608', label: 'Gold' },
                        { color: '#6C3483', label: 'Plum' },
                      ].map(swatch => (
                        <button key={swatch.color} type="button"
                          onClick={() => set('ink_color', swatch.color)}
                          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border-2 transition-all ${
                            form.ink_color === swatch.color
                              ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]'
                              : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                          }`}>
                          <div className="w-6 h-6 rounded-full border border-[hsl(var(--border))]" style={{ backgroundColor: swatch.color }} />
                          <span className="text-[7px] font-medium text-center leading-tight max-w-[48px]">{swatch.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Arabic Font Controls */}
                  {(form.language_mode === 'AR' || form.language_mode === 'BILINGUAL') && (
                    <div className="border border-[hsl(var(--border))] rounded-xl p-3 space-y-2.5">
                      <p className="text-[11px] font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                        <Type size={11} className="text-[hsl(var(--gold))]" /> Arabic Font Controls
                      </p>
                      <div>
                        <label className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase mb-1 block">Font Family</label>
                        <select value={form.arabic_font} onChange={e => set('arabic_font', e.target.value)}
                          className="w-full h-8 rounded-lg border-2 border-[hsl(var(--border))] bg-[#FDFBF7] text-xs px-2 focus:outline-none focus:border-[hsl(var(--gold)/0.5)]">
                          <option value="Noto Naskh Arabic">Noto Naskh Arabic</option>
                          <option value="Amiri">Amiri</option>
                          <option value="Cairo">Cairo</option>
                          <option value="Tajawal">Tajawal</option>
                          <option value="Scheherazade New">Scheherazade</option>
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Letter Spacing</label>
                          <span className="text-[9px] font-mono text-[hsl(var(--foreground))]">{form.arabic_letter_spacing}px</span>
                        </div>
                        <input type="range" min={0} max={6} step={0.5} value={form.arabic_letter_spacing}
                          onChange={e => set('arabic_letter_spacing', parseFloat(e.target.value))}
                          className="w-full h-2 accent-[hsl(var(--gold))]" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Arc Spread</label>
                          <span className="text-[9px] font-mono text-[hsl(var(--foreground))]">{form.arabic_arc_spread}%</span>
                        </div>
                        <input type="range" min={20} max={100} step={1} value={form.arabic_arc_spread}
                          onChange={e => set('arabic_arc_spread', parseInt(e.target.value))}
                          className="w-full h-2 accent-[hsl(var(--gold))]" />
                      </div>
                      <div className="flex gap-2">
                        <OptionButton selected={form.arabic_font_weight === 'normal'} onClick={() => set('arabic_font_weight', 'normal')} className="flex-1 text-[10px]">Normal</OptionButton>
                        <OptionButton selected={form.arabic_font_weight === 'bold'} onClick={() => set('arabic_font_weight', 'bold')} className="flex-1 text-[10px]">Bold</OptionButton>
                      </div>
                    </div>
                  )}

                  {/* Spacing & Layout Controls */}
                  <div className="border border-[hsl(var(--border))] rounded-xl p-3 space-y-2.5">
                    <p className="text-[11px] font-semibold text-[hsl(var(--foreground))]">Spacing & Layout</p>
                    {/* English Arc Spread */}
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">English Arc Spread</label>
                        <span className="text-[9px] font-mono text-[hsl(var(--foreground))]">{form.english_arc_spread}%</span>
                      </div>
                      <input type="range" min={20} max={100} step={1} value={form.english_arc_spread}
                        onChange={e => set('english_arc_spread', parseInt(e.target.value))}
                        className="w-full h-2 accent-[hsl(var(--gold))]" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Arc Text Spacing</label>
                        <span className="text-[9px] font-mono text-[hsl(var(--foreground))]">{form.arc_text_spacing}px</span>
                      </div>
                      <input type="range" min={1} max={6} step={0.5} value={form.arc_text_spacing}
                        onChange={e => set('arc_text_spacing', parseFloat(e.target.value))}
                        className="w-full h-2 accent-[hsl(var(--gold))]" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Ring Gap</label>
                        <span className="text-[9px] font-mono text-[hsl(var(--foreground))]">{form.circle_gap}%</span>
                      </div>
                      <input type="range" min={8} max={25} step={1} value={form.circle_gap}
                        onChange={e => set('circle_gap', parseInt(e.target.value))}
                        className="w-full h-2 accent-[hsl(var(--gold))]" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Separator Distance</label>
                        <span className="text-[9px] font-mono text-[hsl(var(--foreground))]">{form.separator_distance}%</span>
                      </div>
                      <input type="range" min={0} max={100} step={1} value={form.separator_distance}
                        onChange={e => set('separator_distance', parseInt(e.target.value))}
                        className="w-full h-2 accent-[hsl(var(--gold))]" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Center Content Size</label>
                        <span className="text-[9px] font-mono text-[hsl(var(--foreground))]">{form.center_content_size}%</span>
                      </div>
                      <input type="range" min={20} max={80} step={1} value={form.center_content_size}
                        onChange={e => set('center_content_size', parseInt(e.target.value))}
                        className="w-full h-2 accent-[hsl(var(--gold))]" />
                    </div>
                    {/* Company Name Arc Position (radial) */}
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Company Arc Position</label>
                        <span className="text-[9px] font-mono text-[hsl(var(--foreground))]">{form.company_arc_offset}%</span>
                      </div>
                      <input type="range" min={0} max={100} step={1} value={form.company_arc_offset}
                        onChange={e => set('company_arc_offset', parseInt(e.target.value))}
                        className="w-full h-2 accent-[hsl(var(--gold))]" />
                      <p className="text-[7px] text-[hsl(var(--muted-foreground))]">50% = centered between outer & middle ring</p>
                    </div>
                    {/* Location Arc Position */}
                    {form.show_location && (
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Location Arc Position</label>
                          <span className="text-[9px] font-mono text-[hsl(var(--foreground))]">{form.location_arc_offset}%</span>
                        </div>
                        <input type="range" min={0} max={100} step={1} value={form.location_arc_offset}
                          onChange={e => set('location_arc_offset', parseInt(e.target.value))}
                          className="w-full h-2 accent-[hsl(var(--gold))]" />
                        <p className="text-[7px] text-[hsl(var(--muted-foreground))]">50% = centered between middle & inner ring</p>
                      </div>
                    )}
                  </div>

                  {/* Per-Border Color Overrides */}
                  <div className="border border-[hsl(var(--border))] rounded-xl p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-[hsl(var(--foreground))]">Border Colors</p>
                    <p className="text-[8px] text-[hsl(var(--muted-foreground))]">Leave empty to use ink color</p>
                    {([
                      { key: 'outer_border_color' as const, label: 'Outer Ring' },
                      { key: 'middle_border_color' as const, label: 'Middle Ring' },
                      { key: 'inner_border_color' as const, label: 'Inner Ring' },
                    ]).map(ring => (
                      <div key={ring.key} className="flex items-center gap-2">
                        <input type="color" value={form[ring.key] || form.ink_color}
                          onChange={e => set(ring.key, e.target.value)}
                          className="w-6 h-6 rounded border border-[hsl(var(--border))] cursor-pointer p-0" />
                        <span className="text-[10px] text-[hsl(var(--foreground))] flex-1">{ring.label}</span>
                        {form[ring.key] && (
                          <button onClick={() => set(ring.key, '')} className="text-[8px] text-[hsl(var(--muted-foreground))] underline">Reset</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="logo" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <div>
                    <Label className="text-[11px] font-medium mb-1.5 block">Center Icon Style</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'NONE', label: 'No Icon', desc: 'Text only' },
                        { key: 'MONOGRAM', label: 'Monogram', desc: '1–3 initials' },
                        { key: 'UPLOADED_LOGO', label: 'Upload', desc: 'Your image' },
                      ].map(opt => (
                        <button key={opt.key} type="button" onClick={() => set('icon_style', opt.key as IconStyle)}
                          className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                            form.icon_style === opt.key ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                          }`}>
                          {form.icon_style === opt.key && <Check size={8} className="absolute top-1 right-1 text-[hsl(var(--gold))]"/>}
                          <p className="font-medium text-xs">{opt.label}</p>
                          <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.icon_style === 'MONOGRAM' && (
                    <>
                      <div>
                        <Label className="text-[11px] font-medium mb-1 block">Monogram Text (1–3 letters)</Label>
                        <Input value={form.monogram_text} onChange={e => set('monogram_text', e.target.value.slice(0, 3))}
                          placeholder={form.company_name.slice(0, 2) || 'JJ'} maxLength={3} className="uppercase h-8 text-sm"/>
                        <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-0.5">Leave blank for auto initials</p>
                      </div>
                      <div className="border border-[hsl(var(--border))] rounded-xl p-3">
                        <MonogramColorEditor
                          monogramText={form.monogram_text || form.company_name.slice(0, 3)}
                          colors={form.monogram_colors}
                          onChange={(colors) => set('monogram_colors', colors)}
                          defaultColor={form.ink_color}
                        />
                      </div>
                    </>
                  )}

                  {form.icon_style === 'UPLOADED_LOGO' && (
                    <div className="space-y-2">
                      <Label className="text-[11px] font-medium mb-1 block">Upload Your Logo</Label>
                      <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
                        onChange={e => { const file = e.target.files?.[0]; if (file) handleLogoUpload(file); }}/>
                      {logoPreview || form.uploaded_logo_url ? (
                        <div className="relative inline-block">
                          <div className="w-24 h-24 rounded-2xl border-2 border-[hsl(var(--gold)/0.5)] overflow-hidden bg-[hsl(var(--pearl-1))] flex items-center justify-center">
                            <img src={logoPreview || form.uploaded_logo_url} alt="Logo" className="w-full h-full object-contain p-1" loading="lazy" decoding="async" />
                          </div>
                          <button type="button" onClick={() => { setLogoPreview(''); set('uploaded_logo_url', ''); }}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center"><X size={9}/></button>
                          <button type="button" onClick={() => logoInputRef.current?.click()} className="mt-1 text-[10px] text-[hsl(var(--gold-dark))] underline block text-center">Change</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => logoInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-[hsl(var(--gold)/0.4)] rounded-xl p-6 flex flex-col items-center gap-2 hover:border-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.04)]">
                          <Upload size={24} className="text-[hsl(var(--gold))]"/>
                          <p className="font-medium text-xs">Click to upload</p>
                          <p className="text-[9px] text-[hsl(var(--muted-foreground))]">SVG or 512×512+ recommended</p>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── Export Tab ── */}
            <TabsContent value="export" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  <p className="text-[11px] font-semibold text-[hsl(var(--foreground))]">Download Current Preview</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    Export the live stamp preview directly. Enter company details first for best results.
                  </p>

                  {/* Bulk Download All */}
                  <Button size="sm" onClick={handleBulkExport} disabled={bulkExporting}
                    className="w-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2 text-xs h-9">
                    <Download size={13}/> {bulkExporting ? 'Downloading…' : 'Download All Types'}
                  </Button>

                  <div className="space-y-2">
                    <Button variant="outline" size="sm" onClick={handleExportSVG} className="w-full gap-2 text-xs h-9 justify-start">
                      <FileDown size={13}/> Download SVG <span className="ml-auto text-[9px] text-[hsl(var(--muted-foreground))]">Vector</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportPNG(512)} className="w-full gap-2 text-xs h-9 justify-start">
                      <FileDown size={13}/> Download PNG <span className="ml-auto text-[9px] text-[hsl(var(--muted-foreground))]">512px</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportPNG(1024)} className="w-full gap-2 text-xs h-9 justify-start">
                      <FileDown size={13}/> Download PNG <span className="ml-auto text-[9px] text-[hsl(var(--muted-foreground))]">1024px HD</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportJPG(1024)} className="w-full gap-2 text-xs h-9 justify-start">
                      <FileDown size={13}/> Download JPG <span className="ml-auto text-[9px] text-[hsl(var(--muted-foreground))]">1024px White</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExportWEBP(1024)} className="w-full gap-2 text-xs h-9 justify-start">
                      <FileDown size={13}/> Download WEBP <span className="ml-auto text-[9px] text-[hsl(var(--muted-foreground))]">1024px</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF} className="w-full gap-2 text-xs h-9 justify-start">
                      <FileDown size={13}/> Download PDF <span className="ml-auto text-[9px] text-[hsl(var(--muted-foreground))]">Print-ready</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrintPreview} className="w-full gap-2 text-xs h-9 justify-start">
                      <Printer size={13}/> Print Preview
                    </Button>
                  </div>

                  <div className="border-t border-[hsl(var(--border))] pt-3 mt-3">
                    <p className="text-[10px] font-semibold text-[hsl(var(--foreground))] mb-2">Generate AI Concepts</p>
                    <p className="text-[9px] text-[hsl(var(--muted-foreground))] mb-2">
                      Create multiple stamp variations with AI for more options.
                    </p>
                    <Button size="sm" onClick={handleCreate} disabled={saving}
                      className="w-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1.5 text-xs h-9">
                      <Wand2 size={13}/> {saving ? 'Creating...' : 'Generate Concepts'}
                    </Button>
                  </div>

                  <div className="border-t border-[hsl(var(--border))] pt-3">
                    <Button variant="outline" size="sm" onClick={handleSaveDraft} className="w-full gap-1.5 text-xs h-8">
                      <Save size={11}/> Save Draft
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center: Fixed preview area — takes remaining space */}
        <div className="flex-1 flex items-center justify-center min-h-0 p-6 bg-[hsl(var(--pearl-1)/0.3)]"
          onClick={(e) => {
            // Only clear selection on genuine outside clicks, not bubbled element clicks
            if ((e.target as HTMLElement).closest('[data-stamp-element]')) return;
            if ((e.target as HTMLElement).closest('[data-stamp-letter]')) return;
            setSelectedElement(null);
            setSelectedLetter(null);
          }}>
          <div className="flex flex-col items-center gap-4">
            <div
              id="stamp-preview-container"
              className="bg-[#FDFBF7] rounded-2xl border-2 border-[hsl(var(--gold)/0.15)] shadow-[0_8px_40px_hsl(var(--gold)/0.06)] p-8"
            >
              <LiveStampPreview {...previewProps} size={380} selectedElement={selectedElement} />
            </div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center max-w-[300px]">
              {form.company_name ? (
                <>
                  {form.company_name}
                  <span className="block text-[9px] mt-0.5 opacity-70">Click any element to edit · Click individual letters for per-character control</span>
                </>
              ) : <span className="italic">Enter company name to see live preview</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
