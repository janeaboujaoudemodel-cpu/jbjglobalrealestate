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
  Wand2, Download, Printer, FileDown, ChevronDown,
} from 'lucide-react';
import { StampLicenseUploader } from '@/components/stamp-generator/StampLicenseUploader';
import { LiveStampPreview } from '@/components/stamp-generator/LiveStampPreview';
import { useStampHistory } from '@/hooks/useStampHistory';
import { OFFICIAL_INK_BLUE, type SeparatorStyle } from '@/lib/stampOfficialTemplate';

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

const SEPARATOR_OPTIONS: { key: SeparatorStyle; icon: React.ReactNode; label: string }[] = [
  { key: 'dot', icon: <Circle size={10} className="fill-current"/>, label: 'Dots' },
  { key: 'star', icon: <Star size={10} className="fill-current"/>, label: 'Stars' },
  { key: 'dash', icon: <Minus size={10}/>, label: 'Dash' },
  { key: 'circle', icon: <Hash size={10}/>, label: 'Ring' },
  { key: 'none', icon: <X size={10}/>, label: 'None' },
];

const OptionButton = ({ selected, onClick, children, className = '' }: {
  selected: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) => (
  <button
    type="button" onClick={onClick}
    className={`relative px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
      selected
        ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold-dark))]'
        : 'border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground))] hover:border-[hsl(var(--gold)/0.4)]'
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

  const [form, setForm] = useState<FormState>(() => {
    try {
      const saved = localStorage.getItem('stamp-wizard-form');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      project_name: 'My Stamp Project', company_name: '', arabic_company_name: '', trade_name_optional: '',
      registration_number_optional: '', address_optional: '', phone_optional: '', email_optional: '',
      website_optional: '', city_optional: 'Dubai', country_optional: 'UAE', arabic_city: '',
      language_mode: 'BILINGUAL' as LanguageMode, stamp_type: 'ROUND' as StampType,
      style_theme: 'CLASSIC' as StyleTheme, border_style: 'DOUBLE' as BorderStyle,
      typography_style: 'SERIF' as TypographyStyle, density: 3, icon_style: 'MONOGRAM' as IconStyle,
      monogram_text: '', uploaded_logo_url: '', language_reversed: true,
      show_license_number: false, show_location: true, business_type: '',
      separator_style: 'dot' as SeparatorStyle, ink_color: OFFICIAL_INK_BLUE,
    };
  });

  const history = useStampHistory<FormState>(form);

  // Persist form
  useEffect(() => {
    try { localStorage.setItem('stamp-wizard-form', JSON.stringify(form)); } catch {}
  }, [form]);

  const set = (key: keyof FormState, val: any) => {
    setForm(f => { const next = { ...f, [key]: val }; history.push(next); return next; });
  };

  const handleUndo = useCallback(() => { const prev = history.undo(); if (prev) setForm(prev); }, [history]);
  const handleRedo = useCallback(() => { const next = history.redo(); if (next) setForm(next); }, [history]);

  const handleReset = useCallback(() => {
    const initial: FormState = {
      project_name: 'My Stamp Project', company_name: '', arabic_company_name: '', trade_name_optional: '',
      registration_number_optional: '', address_optional: '', phone_optional: '', email_optional: '',
      website_optional: '', city_optional: 'Dubai', country_optional: 'UAE', arabic_city: '',
      language_mode: 'BILINGUAL', stamp_type: 'ROUND', style_theme: 'CLASSIC', border_style: 'DOUBLE',
      typography_style: 'SERIF', density: 3, icon_style: 'MONOGRAM', monogram_text: '', uploaded_logo_url: '',
      language_reversed: true, show_license_number: false, show_location: true, business_type: '',
      separator_style: 'dot', ink_color: OFFICIAL_INK_BLUE,
    };
    setForm(initial); history.reset(initial); toast.success('Form reset to defaults');
  }, [history]);

  const handleSaveDraft = useCallback(() => {
    try {
      localStorage.setItem('stamp-wizard-form', JSON.stringify(form));
      const now = new Date();
      setDraftTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      toast.success('Draft saved locally');
    } catch {}
  }, [form]);

  async function handleCreate() {
    if (!form.company_name.trim()) { toast.error('Company name is required'); return; }
    if (!user?.id) { toast.error('Please sign in first'); return; }
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
          layout_json: { separator_style: form.separator_style, ink_color: form.ink_color },
        })
        .select().single();
      if (error) throw error;
      try { localStorage.removeItem('stamp-wizard-form'); } catch {}
      toast.success('Project created!');
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

  // Export helpers
  const handleExportSVG = useCallback(() => {
    const el = document.querySelector('#stamp-preview-container svg');
    if (!el) { toast.error('No stamp to export'); return; }
    const svgData = new XMLSerializer().serializeToString(el);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${form.company_name || 'stamp'}.svg`; a.click();
    URL.revokeObjectURL(url);
    toast.success('SVG downloaded');
  }, [form.company_name]);

  const handleExportPNG = useCallback((size: number) => {
    const el = document.querySelector('#stamp-preview-container svg');
    if (!el) { toast.error('No stamp to export'); return; }
    const svgData = new XMLSerializer().serializeToString(el);
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${form.company_name || 'stamp'}-${size}px.png`; a.click();
        URL.revokeObjectURL(url);
        toast.success(`PNG ${size}px downloaded`);
      });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [form.company_name]);

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
  };

  return (
    <div className="h-[calc(100vh-52px)] flex flex-col bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))] overflow-hidden">
      {/* ── Top toolbar ── */}
      <div className="flex-shrink-0 border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-md px-4 py-2 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center">
          <Stamp size={14} className="text-white"/>
        </div>
        <h1 className="font-semibold text-[hsl(var(--foreground))] text-sm">Stamp Studio</h1>
        {isOwner && (
          <Badge className="bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)] text-[9px]">Owner</Badge>
        )}
        
        <div className="flex-1"/>

        {draftTime && (
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] italic">Draft saved at {draftTime}</span>
        )}

        {/* Undo/Redo/Reset */}
        <div className="flex items-center gap-0.5 bg-white rounded-lg border border-[hsl(var(--border))] shadow-sm px-1 py-0.5">
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
          <Button size="sm" onClick={handleCreate} disabled={saving || !form.company_name.trim()}
            className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1 text-xs h-7 px-3">
            <Wand2 size={11}/> {saving ? 'Creating...' : 'Generate Concepts'}
          </Button>
        </div>
      </div>

      {/* ── Main body: controls left + centered preview right ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Tabbed controls panel — narrower */}
        <div className="w-[320px] flex-shrink-0 border-r border-[hsl(var(--border))] bg-white flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
            <TabsList className="flex-shrink-0 w-full rounded-none border-b border-[hsl(var(--border))] bg-[hsl(var(--pearl-1))] h-9 px-1">
              <TabsTrigger value="company" className="text-[11px] gap-1 data-[state=active]:bg-white"><Building2 size={11}/>Company</TabsTrigger>
              <TabsTrigger value="style" className="text-[11px] gap-1 data-[state=active]:bg-white"><Palette size={11}/>Style</TabsTrigger>
              <TabsTrigger value="logo" className="text-[11px] gap-1 data-[state=active]:bg-white"><Image size={11}/>Logo</TabsTrigger>
              <TabsTrigger value="export" className="text-[11px] gap-1 data-[state=active]:bg-white"><Download size={11}/>Export</TabsTrigger>
            </TabsList>

            {/* ── Company Tab ── */}
            <TabsContent value="company" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {/* Collapsible Smart Auto-Fill */}
                  <div className="border border-dashed border-gold/30 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setLicenseOpen(!licenseOpen)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.05)] rounded-lg transition-colors"
                    >
                      <FileText size={13} className="text-[hsl(var(--gold))]" />
                      Smart Auto-Fill from Trade License
                      <ChevronDown size={12} className={`ml-auto transition-transform ${licenseOpen ? 'rotate-180' : ''}`} />
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

                  {/* Language Mode */}
                  <div>
                    <Label className="text-[11px] font-medium mb-1.5 block">Language Mode</Label>
                    <div className="flex gap-2">
                      {(['EN', 'AR', 'BILINGUAL'] as LanguageMode[]).map(l => (
                        <OptionButton key={l} selected={form.language_mode === l} onClick={() => set('language_mode', l)}>
                          {l === 'EN' ? 'English' : l === 'AR' ? 'Arabic' : 'Bilingual'}
                        </OptionButton>
                      ))}
                    </div>
                  </div>

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

                  {/* Toggle: Show License (only if entered) */}
                  {form.registration_number_optional && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-[hsl(var(--border))]">
                      <div className="flex items-center gap-2">
                        <FileText size={12} className="text-[hsl(var(--gold))]"/>
                        <span className="text-[11px] font-medium">Show License Number</span>
                      </div>
                      <Switch checked={form.show_license_number} onCheckedChange={v => set('show_license_number', v)}/>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── Style Tab ── */}
            <TabsContent value="style" className="flex-1 min-h-0 m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
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
                      <div className="flex gap-1.5 flex-wrap">
                        {SEPARATOR_OPTIONS.map(opt => (
                          <button key={opt.key} type="button" onClick={() => set('separator_style', opt.key)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg border-2 text-xs font-medium transition-all ${
                              form.separator_style === opt.key
                                ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold-dark))]'
                                : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                            }`}>
                            {opt.icon} {opt.label}
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
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── Logo Tab ── */}
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
                    <div>
                      <Label className="text-[11px] font-medium mb-1 block">Monogram Text (1–3 letters)</Label>
                      <Input value={form.monogram_text} onChange={e => set('monogram_text', e.target.value.slice(0, 3))}
                        placeholder={form.company_name.slice(0, 2) || 'JJ'} maxLength={3} className="uppercase h-8 text-sm"/>
                      <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-0.5">Leave blank for auto initials</p>
                    </div>
                  )}

                  {form.icon_style === 'UPLOADED_LOGO' && (
                    <div className="space-y-2">
                      <Label className="text-[11px] font-medium mb-1 block">Upload Your Logo</Label>
                      <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden"
                        onChange={e => { const file = e.target.files?.[0]; if (file) handleLogoUpload(file); }}/>
                      {logoPreview || form.uploaded_logo_url ? (
                        <div className="relative inline-block">
                          <div className="w-24 h-24 rounded-2xl border-2 border-[hsl(var(--gold)/0.5)] overflow-hidden bg-[hsl(var(--pearl-1))] flex items-center justify-center">
                            <img src={logoPreview || form.uploaded_logo_url} alt="Logo" className="w-full h-full object-contain p-1"/>
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
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="w-full gap-2 text-xs h-9 justify-start">
                      <Printer size={13}/> Print Preview
                    </Button>
                  </div>

                  <div className="border-t border-[hsl(var(--border))] pt-3 mt-3">
                    <p className="text-[10px] font-semibold text-[hsl(var(--foreground))] mb-2">Generate AI Concepts</p>
                    <p className="text-[9px] text-[hsl(var(--muted-foreground))] mb-2">
                      Create multiple stamp variations with AI for more options.
                    </p>
                    <Button size="sm" onClick={handleCreate} disabled={saving || !form.company_name.trim()}
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
        <div className="flex-1 flex items-center justify-center min-h-0 p-6 bg-[hsl(var(--pearl-1)/0.3)]">
          <div className="flex flex-col items-center gap-4">
            <div
              id="stamp-preview-container"
              className="bg-white rounded-2xl border-2 border-[hsl(var(--gold)/0.15)] shadow-[0_8px_40px_hsl(var(--gold)/0.06)] p-8"
            >
              <LiveStampPreview {...previewProps} size={380} />
            </div>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center max-w-[300px]">
              {form.company_name || <span className="italic">Enter company name to see live preview</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
