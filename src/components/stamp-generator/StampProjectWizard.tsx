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
import { toast } from 'sonner';
import { Stamp, Building2, Palette, Image, Wand2, Check, Type, Upload, X, Globe, FileText, ChevronLeft, ChevronRight, RotateCcw, MapPin, Undo2, Redo2, RotateCw, Save, Circle, Star, Minus, Hash } from 'lucide-react';
import { StampLicenseUploader } from '@/components/stamp-generator/StampLicenseUploader';
import { LiveStampPreview } from '@/components/stamp-generator/LiveStampPreview';
import { InteractiveStampCanvas, createDefaultLayers, StampLayer } from '@/components/stamp-generator/InteractiveStampCanvas';
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
  if (type === 'ROUND')     return <div className={`${common} rounded-full w-12 h-12`} style={style}>JBJ</div>;
  if (type === 'OVAL')      return <div className={`${common} w-20 h-12`} style={{ ...style, borderRadius: '50% / 50%' }}>JBJ</div>;
  if (type === 'RECTANGLE') return <div className={`${common} rounded-md w-24 h-10`} style={style}>JBJ</div>;
  if (type === 'SQUARE')    return <div className={`${common} rounded-lg w-12 h-12`}  style={style}>JBJ</div>;
  return null;
}

function BorderPreview({ type, selected }: { type: BorderStyle; selected: boolean }) {
  const gold = selected ? 'hsl(var(--gold))' : 'hsl(var(--muted-foreground))';
  const size = 'w-10 h-10 flex-shrink-0';
  if (type === 'SINGLE')
    return <div className={`${size} rounded-full border-2`} style={{ borderColor: gold }}/>;
  if (type === 'DOUBLE')
    return <div className={`${size} rounded-full border-2 flex items-center justify-center`} style={{ borderColor: gold }}>
      <div className="w-7 h-7 rounded-full border" style={{ borderColor: gold }}/>
    </div>;
  if (type === 'RING')
    return <div className={`${size} rounded-full border-[3px] flex items-center justify-center`} style={{ borderColor: gold }}>
      <div className="w-6 h-6 rounded-full border-[2px]" style={{ borderColor: gold }}/>
    </div>;
  if (type === 'DOTTED')
    return <div className={`${size} rounded-full border-2 border-dotted`} style={{ borderColor: gold }}/>;
  if (type === 'ROPE')
    return <div className={`${size} rounded-full border-2 border-dashed`} style={{ borderColor: gold }}/>;
  if (type === 'CUSTOM')
    return <div className={`${size} rounded-full border-4 flex items-center justify-center`} style={{ borderColor: gold }}>
      <div className="w-5 h-5 rounded-full border-2 border-dotted" style={{ borderColor: gold }}/>
    </div>;
  return null;
}

function DensityPreview({ d, selected }: { d: number; selected: boolean }) {
  const gold = selected ? 'hsl(var(--gold))' : 'hsl(var(--border))';
  const widths = ['w-8', 'w-6', 'w-10', 'w-5', 'w-7'];
  return (
    <div className="w-10 h-10 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 flex-shrink-0" style={{ borderColor: gold }}>
      {Array.from({ length: d }).map((_, i) => (
        <div key={i} className={`h-px ${widths[i % widths.length]}`} style={{ backgroundColor: gold }}/>
      ))}
    </div>
  );
}

const FONT_META: Record<TypographyStyle, { family: string; label: string; sample: string }> = {
  SERIF:         { family: 'Georgia, "Times New Roman", serif',                      label: 'Serif',        sample: 'Abc' },
  SANS:          { family: '"Helvetica Neue", Arial, sans-serif',                    label: 'Sans-Serif',   sample: 'Abc' },
  MONOSPACE:     { family: '"Courier New", Courier, monospace',                      label: 'Monospace',    sample: 'Abc' },
  CALLIGRAPHY:   { family: '"Palatino Linotype", Palatino, serif',                   label: 'Calligraphy',  sample: 'Abc' },
  GOTHIC:        { family: '"Copperplate Gothic", Copperplate, "Small Caps", serif', label: 'Gothic',       sample: 'Abc' },
  ARABIC_MODERN: { family: '"Arabic Typesetting", "Noto Naskh Arabic", serif',       label: 'Arabic',       sample: 'أبج' },
};

const THEME_META: Record<StyleTheme, { desc: string; ring: boolean; thick: boolean }> = {
  CLASSIC:  { desc: 'Traditional', ring: true,  thick: false },
  MODERN:   { desc: 'Clean',       ring: false, thick: false },
  MINIMAL:  { desc: 'Hairline',    ring: false, thick: false },
  LUXURY:   { desc: 'Gold Ring',   ring: true,  thick: true  },
  BOLD:     { desc: 'Heavy',       ring: false, thick: true  },
  VINTAGE:  { desc: 'Ornate',      ring: true,  thick: false },
};

function ThemePreview({ type, selected }: { type: StyleTheme; selected: boolean }) {
  const meta = THEME_META[type];
  const gold = selected ? 'hsl(var(--gold))' : 'hsl(var(--muted-foreground))';
  const bw = meta.thick ? 3 : 1.5;
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: `${bw}px solid ${gold}` }}>
      {meta.ring && <div className="w-6 h-6 rounded-full" style={{ border: `${bw * 0.7}px solid ${gold}` }}/>}
    </div>
  );
}

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
    type="button"
    onClick={onClick}
    className={`relative px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
      selected
        ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold-dark))]'
        : 'border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground))] hover:border-[hsl(var(--gold)/0.4)]'
    } ${className}`}
  >
    {selected && <Check size={10} className="absolute top-1 right-1 text-[hsl(var(--gold))]"/>}
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

const STEPS = ['Company Details', 'Stamp Style', 'Logo / Monogram'];

export default function StampProjectWizard() {
  const { user } = useAuth();
  const { isOwner } = useOwnerVerification();
  const navigate = useNavigate();
  const [emailUppercase, setEmailUppercase] = useState(true);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const [step, setStep] = useState(() => {
    try { return Number(sessionStorage.getItem('stamp-wizard-step')) || 0; } catch { return 0; }
  });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(() => {
    try {
      const saved = sessionStorage.getItem('stamp-wizard-form');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      project_name: 'My Stamp Project',
      company_name: '',
      arabic_company_name: '',
      trade_name_optional: '',
      registration_number_optional: '',
      address_optional: '',
      phone_optional: '',
      email_optional: '',
      website_optional: '',
      city_optional: 'Dubai',
      country_optional: 'UAE',
      arabic_city: '',
      language_mode: 'BILINGUAL' as LanguageMode,
      stamp_type: 'ROUND' as StampType,
      style_theme: 'CLASSIC' as StyleTheme,
      border_style: 'DOUBLE' as BorderStyle,
      typography_style: 'SERIF' as TypographyStyle,
      density: 3,
      icon_style: 'MONOGRAM' as IconStyle,
      monogram_text: '',
      uploaded_logo_url: '',
      language_reversed: true,
      show_license_number: true,
      show_location: true,
      business_type: '',
      separator_style: 'dot' as SeparatorStyle,
      ink_color: OFFICIAL_INK_BLUE,
    };
  });

  // Interactive canvas layers
  const [layers, setLayers] = useState<StampLayer[]>(() =>
    createDefaultLayers({
      languageMode: 'BILINGUAL',
      iconStyle: 'MONOGRAM',
      density: 3,
      showLicenseNumber: true,
    })
  );

  // Undo/Redo history
  const history = useStampHistory<FormState>(form);

  // Persist form + step
  useEffect(() => {
    try { sessionStorage.setItem('stamp-wizard-form', JSON.stringify(form)); } catch {}
  }, [form]);
  useEffect(() => {
    try { sessionStorage.setItem('stamp-wizard-step', String(step)); } catch {}
  }, [step]);

  // Update layers when form changes
  useEffect(() => {
    setLayers(createDefaultLayers({
      languageMode: form.language_mode,
      iconStyle: form.icon_style,
      density: form.density,
      registrationNumber: form.registration_number_optional,
      showLicenseNumber: form.show_license_number,
      city: form.city_optional,
    }));
  }, [form.language_mode, form.icon_style, form.density, form.registration_number_optional, form.show_license_number, form.city_optional]);

  const set = (key: keyof FormState, val: any) => {
    setForm(f => {
      const next = { ...f, [key]: val };
      history.push(next);
      return next;
    });
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
      language_reversed: true, show_license_number: true, show_location: true, business_type: '',
      separator_style: 'dot', ink_color: OFFICIAL_INK_BLUE,
    };
    setForm(initial);
    history.reset(initial);
    toast.success('Form reset to defaults');
  }, [history]);

  const handleStandardColor = useCallback(() => {
    set('ink_color', OFFICIAL_INK_BLUE);
    toast.success('Reset to Corporate Official Blue');
  }, []);

  async function handleCreate() {
    if (!form.company_name.trim()) { toast.error('Company name is required'); return; }
    if (!user?.id) { toast.error('Please sign in first'); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('stamp_projects')
        .insert({
          user_id: user.id,
          project_name: form.project_name || 'My Stamp Project',
          company_name: form.company_name.trim(),
          arabic_company_name: form.arabic_company_name || null,
          trade_name_optional: form.trade_name_optional || null,
          registration_number_optional: form.registration_number_optional || null,
          address_optional: form.address_optional || null,
          phone_optional: form.phone_optional || null,
          email_optional: form.email_optional || null,
          website_optional: form.website_optional || null,
          city_optional: form.city_optional || 'Dubai',
          country_optional: form.country_optional || 'UAE',
          arabic_city: form.arabic_city || null,
          language_mode: form.language_mode,
          stamp_type: form.stamp_type,
          style_theme: form.style_theme,
          border_style: form.border_style,
          typography_style: form.typography_style,
          density: form.density,
          icon_style: form.icon_style,
          monogram_text: form.monogram_text || null,
          uploaded_logo_url: form.uploaded_logo_url || null,
          language_reversed: form.language_reversed,
          show_license_number: form.show_license_number,
          show_location: form.show_location,
          business_type: form.business_type || null,
          layout_json: { separator_style: form.separator_style, ink_color: form.ink_color },
        })
        .select()
        .single();
      
      if (error) throw error;
      
      try { sessionStorage.removeItem('stamp-wizard-form'); sessionStorage.removeItem('stamp-wizard-step'); } catch {}
      toast.success('Project created!');
      window.scrollTo({ top: 0, behavior: 'auto' });
      navigate(`/toolkit/stamp-generator/${data.id}/generate?fresh=1`);
    } catch (error: any) {
      console.error('Stamp project creation error:', error);
      toast.error(`Failed to create project: ${error?.message || 'Unknown error. Please try again.'}`);
    }
    setSaving(false);
  }

  // Shared preview props
  const previewProps = {
    companyName: form.company_name,
    arabicCompanyName: form.arabic_company_name,
    city: form.city_optional,
    country: form.country_optional,
    registrationNumber: form.registration_number_optional,
    stampType: form.stamp_type,
    styleTheme: form.style_theme,
    borderStyle: form.border_style,
    typographyStyle: form.typography_style,
    density: form.density,
    iconStyle: form.icon_style as any,
    monogramText: form.monogram_text,
    uploadedLogoUrl: form.uploaded_logo_url,
    languageMode: form.language_mode,
    languageReversed: form.language_reversed,
    showLicenseNumber: form.show_license_number,
    showLocation: form.show_location,
    separatorStyle: form.separator_style,
    inkColor: form.ink_color,
    arabicCity: form.arabic_city,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center">
            <Stamp size={16} className="text-white"/>
          </div>
          <h1 className="font-semibold text-[hsl(var(--foreground))]">Stamp Studio</h1>
          {isOwner && (
            <Badge className="bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)] text-[9px] ml-2">
              Owner
            </Badge>
          )}
          <div className="flex-1"/>
          {/* Undo/Redo/Reset toolbar */}
          <div className="flex items-center gap-1 bg-white rounded-xl border border-[hsl(var(--border))] shadow-sm px-2 py-1">
            <button onClick={handleUndo} disabled={!history.canUndo}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] transition-colors disabled:opacity-30"
              title="Undo"><Undo2 size={12}/></button>
            <button onClick={handleRedo} disabled={!history.canRedo}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] transition-colors disabled:opacity-30"
              title="Redo"><Redo2 size={12}/></button>
            <div className="w-px h-4 bg-[hsl(var(--border))]"/>
            <button onClick={handleReset}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors"
              title="Reset"><RotateCw size={12}/></button>
            <button onClick={() => { try { sessionStorage.setItem('stamp-wizard-form', JSON.stringify(form)); toast.success('Draft saved'); } catch {} }}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] transition-colors"
              title="Save draft"><Save size={12}/></button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* 3-zone layout: controls left, preview center, options right */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT: Form column ── */}
          <div className="flex-1 min-w-0 max-w-md space-y-5 order-2 lg:order-1">
            {/* Progress */}
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                      i === step ? 'text-[hsl(var(--gold-dark))]' : i < step ? 'text-[hsl(var(--gold))] cursor-pointer' : 'text-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                      i < step ? 'bg-[hsl(var(--gold))] border-[hsl(var(--gold))] text-white' :
                      i === step ? 'border-[hsl(var(--gold))] text-[hsl(var(--gold-dark))]' :
                      'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                    }`}>
                      {i < step ? <Check size={10}/> : i + 1}
                    </span>
                    <span className="hidden sm:inline">{s}</span>
                  </button>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-[hsl(var(--gold))]' : 'bg-[hsl(var(--border))]'}`}/>}
                </React.Fragment>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm p-5 space-y-4">

              {/* Step 0: Company Details */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 size={18} className="text-[hsl(var(--gold))]"/>
                    <h2 className="font-semibold text-[hsl(var(--foreground))]">Company Details</h2>
                  </div>

                  <StampLicenseUploader
                    onExtracted={(data) => {
                      if (data.company_name) set('company_name', data.company_name);
                      if (data.arabic_company_name) { set('arabic_company_name', data.arabic_company_name); set('language_mode', 'BILINGUAL'); }
                      if (data.registration_number) set('registration_number_optional', data.registration_number);
                      const city = data.city || '';
                      if (city) set('city_optional', city);
                      const ARABIC_CITY_MAP: Record<string, string> = {
                        'dubai': 'دبي', 'abu dhabi': 'أبوظبي', 'sharjah': 'الشارقة',
                        'ajman': 'عجمان', 'ras al khaimah': 'رأس الخيمة',
                        'fujairah': 'الفجيرة', 'umm al quwain': 'أم القيوين',
                      };
                      const mappedArabic = city ? ARABIC_CITY_MAP[city.toLowerCase()] : undefined;
                      let arabicCityValue = data.arabic_city || '';
                      if (arabicCityValue && /[a-zA-Z]/.test(arabicCityValue) && mappedArabic) {
                        arabicCityValue = mappedArabic + '، الإمارات';
                      } else if (!arabicCityValue && mappedArabic) {
                        arabicCityValue = mappedArabic + '، الإمارات';
                      }
                      if (arabicCityValue) set('arabic_city', arabicCityValue);
                      const rawCountry = data.country || '';
                      const correctedCountry = correctCountry(rawCountry, city);
                      set('country_optional', correctedCountry || 'UAE');
                      if (data.phone) set('phone_optional', normalizePhone(data.phone));
                      if (data.email) set('email_optional', data.email.toUpperCase());
                      if ((data as any).business_type) set('business_type', (data as any).business_type);
                    }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-medium mb-1.5 block">Project Name</Label>
                      <Input value={form.project_name} onChange={e => set('project_name', e.target.value)} placeholder="e.g. Main Company Stamp"/>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-medium mb-1.5 block">Company Name <span className="text-destructive">*</span></Label>
                      <Input value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="e.g. Acme Properties LLC"/>
                    </div>
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">Trade Name</Label>
                      <Input value={form.trade_name_optional} onChange={e => set('trade_name_optional', e.target.value)} placeholder="Optional"/>
                    </div>
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">Registration No.</Label>
                      <Input value={form.registration_number_optional} onChange={e => set('registration_number_optional', e.target.value)} placeholder="Optional"/>
                    </div>
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">City</Label>
                      <Input value={form.city_optional} onChange={e => set('city_optional', e.target.value)} placeholder="Dubai"/>
                    </div>
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">Country</Label>
                      <Input value={form.country_optional} onChange={e => set('country_optional', e.target.value)} placeholder="UAE"/>
                    </div>
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">Phone</Label>
                      <Input value={form.phone_optional} onChange={e => set('phone_optional', e.target.value)} placeholder="+971 XX XXX XXXX"/>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs font-medium">Email</Label>
                        <button type="button" onClick={() => setEmailUppercase(v => !v)}
                          className="text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold-dark))] border border-[hsl(var(--border))] rounded px-1.5 py-0.5 flex items-center gap-1 transition-colors"
                          title="Toggle uppercase"><Type size={9}/> {emailUppercase ? 'ABC' : 'abc'}</button>
                      </div>
                      <Input
                        value={form.email_optional}
                        onChange={e => set('email_optional', emailUppercase ? e.target.value.toUpperCase() : e.target.value)}
                        placeholder={emailUppercase ? 'INFO@COMPANY.COM' : 'info@company.com'}
                        className={emailUppercase ? 'uppercase' : ''}
                      />
                    </div>
                  </div>

                  {/* Business Type */}
                  <div>
                    <Label className="text-xs font-medium mb-2 block">Business Type</Label>
                    <div className="flex gap-2 flex-wrap">
                      {BUSINESS_TYPES.map(bt => (
                        <OptionButton key={bt} selected={form.business_type === bt} onClick={() => set('business_type', bt)}>{bt}</OptionButton>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium mb-2 block">Language Mode</Label>
                    <div className="flex gap-2 flex-wrap">
                      {(['EN', 'AR', 'BILINGUAL'] as LanguageMode[]).map(l => (
                        <OptionButton key={l} selected={form.language_mode === l} onClick={() => set('language_mode', l)}>
                          {l === 'EN' ? 'English' : l === 'AR' ? 'Arabic' : 'Bilingual'}
                        </OptionButton>
                      ))}
                    </div>
                  </div>

                  {/* Arabic fields */}
                  {(form.language_mode === 'AR' || form.language_mode === 'BILINGUAL') && (
                    <div className="border border-[hsl(var(--gold)/0.3)] bg-[hsl(var(--gold)/0.04)] rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-[hsl(var(--gold-dark))]">Arabic Details</p>
                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">Company Name in Arabic</Label>
                        <Input value={form.arabic_company_name} onChange={e => set('arabic_company_name', e.target.value)} placeholder="اسم الشركة بالعربية" dir="rtl"/>
                      </div>
                      <div>
                        <Label className="text-xs font-medium mb-1.5 block">City in Arabic</Label>
                        <Input value={form.arabic_city} onChange={e => set('arabic_city', e.target.value)} placeholder="دبي، الإمارات" dir="rtl"/>
                      </div>
                      {form.language_mode === 'BILINGUAL' && (
                        <button type="button" onClick={() => set('language_reversed', !form.language_reversed)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all ${
                            form.language_reversed ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
                          }`}>
                          <RotateCcw size={14} className={form.language_reversed ? 'text-[hsl(var(--gold-dark))]' : 'text-[hsl(var(--muted-foreground))]'}/>
                          <div className="text-left">
                            <p className="text-[11px] font-semibold text-[hsl(var(--foreground))]">Language Order</p>
                            <p className="text-[9px] text-[hsl(var(--muted-foreground))]">
                              {form.language_reversed ? 'Arabic on top · English on bottom (Standard)' : 'English on top · Arabic on bottom'}
                            </p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Show/hide location */}
                  <button type="button" onClick={() => set('show_location', !form.show_location)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all ${
                      form.show_location ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
                    }`}>
                    <MapPin size={14} className={form.show_location ? 'text-[hsl(var(--gold-dark))]' : 'text-[hsl(var(--muted-foreground))]'}/>
                    <div className="text-left">
                      <p className="text-[11px] font-semibold text-[hsl(var(--foreground))]">Show Location on Stamp</p>
                      <p className="text-[9px] text-[hsl(var(--muted-foreground))]">
                        {form.show_location ? `Showing: ${form.city_optional || 'Dubai'}, ${form.country_optional || 'UAE'}` : 'Location hidden'}
                      </p>
                    </div>
                  </button>

                  {/* Show/hide license */}
                  {form.registration_number_optional && (
                    <button type="button" onClick={() => set('show_license_number', !form.show_license_number)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all ${
                        form.show_license_number ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
                      }`}>
                      <FileText size={14} className={form.show_license_number ? 'text-[hsl(var(--gold-dark))]' : 'text-[hsl(var(--muted-foreground))]'}/>
                      <div className="text-left">
                        <p className="text-[11px] font-semibold text-[hsl(var(--foreground))]">Show License Number</p>
                        <p className="text-[9px] text-[hsl(var(--muted-foreground))]">
                          {form.show_license_number ? 'Visible on stamp' : 'Hidden from stamp'}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Step 1: Style */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette size={18} className="text-[hsl(var(--gold))]"/>
                    <h2 className="font-semibold text-[hsl(var(--foreground))]">Stamp Style</h2>
                  </div>

                  {/* Shape */}
                  <div>
                    <Label className="text-xs font-medium mb-2 block">Shape</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['ROUND', 'OVAL', 'RECTANGLE', 'SQUARE'] as StampType[]).map(t => (
                        <button key={t} type="button" onClick={() => set('stamp_type', t)}
                          className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            form.stamp_type === t ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                          }`}>
                          {form.stamp_type === t && <Check size={10} className="absolute top-1 right-1 text-[hsl(var(--gold))]"/>}
                          <ShapePreview type={t} selected={form.stamp_type === t}/>
                          <span className="text-xs font-medium">{t.charAt(0) + t.slice(1).toLowerCase()}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme */}
                  <div>
                    <Label className="text-xs font-medium mb-2 block">Theme</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(['CLASSIC', 'MODERN', 'MINIMAL', 'LUXURY', 'BOLD', 'VINTAGE'] as StyleTheme[]).map(t => (
                        <button key={t} type="button" onClick={() => set('style_theme', t)}
                          className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            form.style_theme === t ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                          }`}>
                          {form.style_theme === t && <Check size={10} className="absolute top-1 right-1 text-[hsl(var(--gold))]"/>}
                          <ThemePreview type={t} selected={form.style_theme === t}/>
                          <div>
                            <p className="text-xs font-semibold leading-tight">{t.charAt(0) + t.slice(1).toLowerCase()}</p>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{THEME_META[t].desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Border */}
                  <div>
                    <Label className="text-xs font-medium mb-2 block">Border Style</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(['SINGLE', 'DOUBLE', 'RING', 'DOTTED', 'ROPE', 'CUSTOM'] as BorderStyle[]).map(b => (
                        <button key={b} type="button" onClick={() => set('border_style', b)}
                          className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            form.border_style === b ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                          }`}>
                          {form.border_style === b && <Check size={10} className="absolute top-1 right-1 text-[hsl(var(--gold))]"/>}
                          <BorderPreview type={b} selected={form.border_style === b}/>
                          <span className="text-xs font-medium">{b.charAt(0) + b.slice(1).toLowerCase()}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Separator Style (for round bilingual stamps) */}
                  {form.stamp_type === 'ROUND' && (form.language_mode === 'BILINGUAL' || form.language_mode === 'AR') && (
                    <div>
                      <Label className="text-xs font-medium mb-2 block">Arc Separators</Label>
                      <div className="flex gap-2 flex-wrap">
                        {SEPARATOR_OPTIONS.map(opt => (
                          <button key={opt.key} type="button" onClick={() => set('separator_style', opt.key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
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
                    <Label className="text-xs font-medium mb-2 block">Typography</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.keys(FONT_META) as TypographyStyle[]).map(t => {
                        const meta = FONT_META[t];
                        return (
                          <button key={t} type="button" onClick={() => set('typography_style', t)}
                            className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                              form.typography_style === t ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                            }`}>
                            {form.typography_style === t && <Check size={10} className="absolute top-1 right-1 text-[hsl(var(--gold))]"/>}
                            <span className="text-2xl leading-none flex-shrink-0 w-10 text-center"
                              style={{ fontFamily: meta.family, color: form.typography_style === t ? 'hsl(var(--gold-dark))' : 'hsl(var(--foreground))' }}
                            >{meta.sample}</span>
                            <span className="text-xs font-medium">{meta.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Density */}
                  <div>
                    <Label className="text-xs font-medium mb-2 block">Information Density</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {([1, 2, 3, 4, 5] as const).map(d => {
                        const labels: Record<number, string> = { 1: 'Name only', 2: '+ City', 3: '+ License', 4: '+ Phone', 5: 'All fields' };
                        return (
                          <button key={d} type="button" onClick={() => set('density', d)}
                            className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                              form.density === d ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                            }`}>
                            {form.density === d && <Check size={10} className="absolute top-1 right-1 text-[hsl(var(--gold))]"/>}
                            <DensityPreview d={d} selected={form.density === d}/>
                            <span className="text-[9px] text-center text-[hsl(var(--muted-foreground))] leading-tight">{labels[d]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ink Color */}
                  <div>
                    <Label className="text-xs font-medium mb-2 block">Ink Color</Label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={form.ink_color} onChange={e => set('ink_color', e.target.value)}
                        className="w-10 h-10 rounded-xl border-2 border-[hsl(var(--border))] cursor-pointer p-0.5"/>
                      <Input value={form.ink_color} onChange={e => set('ink_color', e.target.value)}
                        className="w-28 font-mono text-xs uppercase" maxLength={7}/>
                      <Button variant="outline" size="sm" onClick={handleStandardColor} className="text-xs gap-1.5">
                        <RotateCcw size={10}/> Standard Blue
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Logo / Monogram */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Image size={18} className="text-[hsl(var(--gold))]"/>
                    <h2 className="font-semibold text-[hsl(var(--foreground))]">Logo / Monogram</h2>
                  </div>

                  <div>
                    <Label className="text-xs font-medium mb-2 block">Center Icon Style</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'NONE', label: 'No Icon', desc: 'Text only' },
                        { key: 'MONOGRAM', label: 'Monogram', desc: '1–3 initials' },
                        { key: 'UPLOADED_LOGO', label: 'Upload Logo', desc: 'Your own image' },
                      ].map(opt => (
                        <button key={opt.key} type="button" onClick={() => set('icon_style', opt.key as IconStyle)}
                          className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                            form.icon_style === opt.key ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                          }`}>
                          {form.icon_style === opt.key && <Check size={10} className="absolute top-2 right-2 text-[hsl(var(--gold))]"/>}
                          <p className="font-medium text-sm">{opt.label}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.icon_style === 'MONOGRAM' && (
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">Monogram Text (1–3 letters)</Label>
                      <Input value={form.monogram_text} onChange={e => set('monogram_text', e.target.value.slice(0, 3))}
                        placeholder={form.company_name.slice(0, 2) || 'JJ'} maxLength={3} className="uppercase"/>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Leave blank to auto-use company initials</p>
                    </div>
                  )}

                  {form.icon_style === 'UPLOADED_LOGO' && (
                    <div className="space-y-3">
                      <Label className="text-xs font-medium mb-1.5 block">Upload Your Logo</Label>
                      <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.type !== 'image/svg+xml') {
                            const img = new window.Image();
                            img.onload = () => {
                              if (img.width < 200 || img.height < 200) {
                                toast.warning('Low resolution logo. Use SVG or 512×512+ for best quality.', { duration: 5000 });
                              }
                            };
                            img.src = URL.createObjectURL(file);
                          }
                          const reader = new FileReader();
                          reader.onload = ev => {
                            const dataUrl = ev.target?.result as string;
                            setLogoPreview(dataUrl);
                            set('uploaded_logo_url', dataUrl);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      {logoPreview || form.uploaded_logo_url ? (
                        <div className="relative inline-block">
                          <div className="w-32 h-32 rounded-2xl border-2 border-[hsl(var(--gold)/0.5)] overflow-hidden bg-[hsl(var(--pearl-1))] flex items-center justify-center">
                            <img src={logoPreview || form.uploaded_logo_url} alt="Logo preview" className="w-full h-full object-contain p-2"/>
                          </div>
                          <button type="button" onClick={() => { setLogoPreview(''); set('uploaded_logo_url', ''); }}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80">
                            <X size={10}/></button>
                          <button type="button" onClick={() => logoInputRef.current?.click()}
                            className="mt-2 text-xs text-[hsl(var(--gold-dark))] underline block text-center">Change image</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => logoInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-[hsl(var(--gold)/0.4)] rounded-xl p-8 flex flex-col items-center gap-3 hover:border-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.04)] transition-all">
                          <Upload size={28} className="text-[hsl(var(--gold))]"/>
                          <div className="text-center">
                            <p className="font-medium text-sm text-[hsl(var(--foreground))]">Click to upload logo</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">PNG, JPG, SVG, WEBP — SVG or 512×512+ recommended</p>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="bg-[hsl(var(--pearl-1))] rounded-xl p-4 border border-[hsl(var(--border))]">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      <strong>Ready to generate!</strong> Click below to create stamp designs based on your settings.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => step === 0 ? navigate('/toolkit/stamp-generator/projects') : setStep(s => s - 1)} className="gap-1">
                <ChevronLeft size={15}/> {step === 0 ? 'Back' : 'Previous'}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => { if (step === 0 && !form.company_name.trim()) { toast.error('Company name is required'); return; } setStep(s => s + 1); }}
                  className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1">
                  Next <ChevronRight size={15}/>
                </Button>
              ) : (
                <Button onClick={handleCreate} disabled={saving}
                  className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1">
                  <Wand2 size={15}/> {saving ? 'Creating...' : 'Generate Stamp Concepts'}
                </Button>
              )}
            </div>
          </div>

          {/* ── CENTER: Large live preview ── */}
          <div className="flex-shrink-0 flex flex-col items-center gap-4 order-1 lg:order-2 w-full lg:w-auto">
            <div className="lg:sticky lg:top-16 flex flex-col items-center gap-3">
              <div className="bg-white rounded-2xl border border-[hsl(var(--gold)/0.3)] shadow-[0_8px_32px_hsl(var(--gold)/0.1)] p-4 sm:p-6">
                <InteractiveStampCanvas
                  size={280}
                  layers={layers}
                  onLayersChange={setLayers}
                  onDeleteLayer={(id) => {
                    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: false } : l));
                    toast('Layer hidden');
                  }}
                  interactive={true}
                >
                  <LiveStampPreview {...previewProps} size={280} />
                </InteractiveStampCanvas>
              </div>
              <p className="text-[9px] text-[hsl(var(--muted-foreground))] text-center max-w-[260px]">
                Click elements to select · Drag to move · Arrow keys for fine control
              </p>
              {/* Quick tip */}
              <div className="bg-[hsl(var(--gold)/0.06)] border border-[hsl(var(--gold)/0.2)] rounded-xl p-3 w-full max-w-[300px]">
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                  {step === 0 && <>Type your company name to see it appear instantly. Upload a trade license for auto-fill.</>}
                  {step === 1 && <>Every option updates the preview in real-time. Try different styles and separators.</>}
                  {step === 2 && <>Choose a monogram or upload your logo to see it centered on the stamp.</>}
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Quick options panel (desktop) ── */}
          <div className="hidden xl:flex flex-col gap-3 w-[200px] flex-shrink-0 order-3">
            <div className="sticky top-16 space-y-3">
              <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-3 space-y-2">
                <p className="text-[10px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">Quick Controls</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Location</span>
                  <Switch checked={form.show_location} onCheckedChange={v => set('show_location', v)}/>
                </div>
                
                {form.registration_number_optional && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">License #</span>
                    <Switch checked={form.show_license_number} onCheckedChange={v => set('show_license_number', v)}/>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Ink Color</span>
                  <input type="color" value={form.ink_color} onChange={e => set('ink_color', e.target.value)}
                    className="w-6 h-6 rounded border cursor-pointer p-0"/>
                </div>

                <button onClick={handleStandardColor}
                  className="w-full text-[10px] text-[hsl(var(--gold-dark))] font-medium bg-[hsl(var(--gold)/0.08)] hover:bg-[hsl(var(--gold)/0.15)] rounded-lg py-1.5 transition-colors">
                  Reset to Standard Blue
                </button>
              </div>

              {/* Separator quick-switch */}
              {form.stamp_type === 'ROUND' && (form.language_mode === 'BILINGUAL' || form.language_mode === 'AR') && (
                <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-3 space-y-2">
                  <p className="text-[10px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">Separators</p>
                  <div className="grid grid-cols-5 gap-1">
                    {SEPARATOR_OPTIONS.map(opt => (
                      <button key={opt.key} onClick={() => set('separator_style', opt.key)}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                          form.separator_style === opt.key
                            ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]'
                            : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                        }`} title={opt.label}>
                        {opt.icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
