import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Stamp, ChevronRight, ChevronLeft, Building2, Palette, Image, Wand2, Check, Type } from 'lucide-react';
import { StampLicenseUploader } from '@/components/stamp-generator/StampLicenseUploader';

// UAE phone normalization
function normalizePhone(raw: string): string {
  if (!raw) return raw;
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('00971')) return '+971' + digits.slice(5);
  if (digits.startsWith('971') && !raw.startsWith('+')) return '+' + digits;
  if (/^0[45]/.test(digits)) return '+971' + digits.slice(1);
  return raw.startsWith('+') ? raw : raw;
}

// UAE country correction
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
type TypographyStyle = 'SERIF' | 'SANS' | 'MONOSPACE' | 'CALLIGRAPHY';
type LanguageMode = 'EN' | 'AR' | 'BILINGUAL';
type IconStyle = 'NONE' | 'MONOGRAM' | 'SIMPLE_ICON' | 'UPLOADED_LOGO';

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
}

const STEPS = ['Company Details', 'Stamp Style', 'Logo / Monogram'];

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

export default function StampProjectWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [emailUppercase, setEmailUppercase] = useState(true);

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
      city_optional: '',
      country_optional: 'UAE',
      arabic_city: '',
      language_mode: 'EN' as LanguageMode,
      stamp_type: 'ROUND' as StampType,
      style_theme: 'CLASSIC' as StyleTheme,
      border_style: 'DOUBLE' as BorderStyle,
      typography_style: 'SERIF' as TypographyStyle,
      density: 3,
      icon_style: 'MONOGRAM' as IconStyle,
      monogram_text: '',
    };
  });

  // Persist form + step to sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem('stamp-wizard-form', JSON.stringify(form)); } catch { /* ignore */ }
  }, [form]);
  useEffect(() => {
    try { sessionStorage.setItem('stamp-wizard-step', String(step)); } catch { /* ignore */ }
  }, [step]);

  const set = (key: keyof FormState, val: any) => setForm(f => ({ ...f, [key]: val }));

  async function handleCreate() {
    if (!form.company_name.trim()) { toast.error('Company name is required'); return; }
    setSaving(true);
    const { data, error } = await supabase
      .from('stamp_projects')
      .insert({
        user_id: user!.id,
        project_name: form.project_name,
        company_name: form.company_name,
        arabic_company_name: form.arabic_company_name || null,
        trade_name_optional: form.trade_name_optional || null,
        registration_number_optional: form.registration_number_optional || null,
        address_optional: form.address_optional || null,
        phone_optional: form.phone_optional || null,
        email_optional: form.email_optional || null,
        website_optional: form.website_optional || null,
        city_optional: form.city_optional || null,
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
      })
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error('Failed to create project'); return; }
    // Clear session persistence after successful creation
    try { sessionStorage.removeItem('stamp-wizard-form'); sessionStorage.removeItem('stamp-wizard-step'); } catch { /* ignore */ }
    toast.success('Project created!');
    navigate(`/toolkit/stamp-generator/${data.id}/generate`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-white/80 backdrop-blur-sm sticky top-24 sm:top-28 lg:top-32 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center">
            <Stamp size={16} className="text-white"/>
          </div>
          <h1 className="font-semibold text-[hsl(var(--foreground))]">New Stamp Project</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
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

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm p-6 space-y-5">

          {/* Step 0: Company Details */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={18} className="text-[hsl(var(--gold))]"/>
                <h2 className="font-semibold text-[hsl(var(--foreground))]">Company Details</h2>
              </div>

              {/* AI Trade License Uploader */}
              <StampLicenseUploader
                onExtracted={(data) => {
                  if (data.company_name) set('company_name', data.company_name);
                  if (data.arabic_company_name) {
                    set('arabic_company_name', data.arabic_company_name);
                    set('language_mode', 'BILINGUAL');
                  }
                  if (data.registration_number) set('registration_number_optional', data.registration_number);
                  const city = data.city || '';
                  if (city) set('city_optional', city);
                  if (data.arabic_city) set('arabic_city', data.arabic_city);
                  // Smart country correction: don't confuse owner nationality with company country
                  const rawCountry = data.country || '';
                  const correctedCountry = correctCountry(rawCountry, city);
                  set('country_optional', correctedCountry || 'UAE');
                  // Normalize phone to international format with + prefix
                  if (data.phone) set('phone_optional', normalizePhone(data.phone));
                  // Default email to uppercase
                  if (data.email) set('email_optional', data.email.toUpperCase());
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label className="text-xs font-medium mb-1.5 block">Project Name</Label>
                  <Input value={form.project_name} onChange={e => set('project_name', e.target.value)} placeholder="e.g. Main Company Stamp"/>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs font-medium mb-1.5 block">Company Name <span className="text-destructive">*</span></Label>
                  <Input value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="JBJ Global Real Estate LLC"/>
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
                    <button
                      type="button"
                      onClick={() => setEmailUppercase(v => !v)}
                      className="text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold-dark))] border border-[hsl(var(--border))] rounded px-1.5 py-0.5 flex items-center gap-1 transition-colors"
                      title="Toggle uppercase/lowercase"
                    >
                      <Type size={9}/> {emailUppercase ? 'ABC' : 'abc'}
                    </button>
                  </div>
                  <Input
                    value={form.email_optional}
                    onChange={e => set('email_optional', emailUppercase ? e.target.value.toUpperCase() : e.target.value)}
                    placeholder={emailUppercase ? 'INFO@COMPANY.COM' : 'info@company.com'}
                    className={emailUppercase ? 'uppercase' : ''}
                  />
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

              {/* Arabic fields — shown when AR or BILINGUAL selected */}
              {(form.language_mode === 'AR' || form.language_mode === 'BILINGUAL') && (
                <div className="border border-[hsl(var(--gold)/0.3)] bg-[hsl(var(--gold)/0.04)] rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-[hsl(var(--gold-dark))]">Arabic Details (for bilingual stamp)</p>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">Company Name in Arabic</Label>
                    <Input value={form.arabic_company_name} onChange={e => set('arabic_company_name', e.target.value)} placeholder="اسم الشركة بالعربية" dir="rtl"/>
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">City in Arabic</Label>
                    <Input value={form.arabic_city} onChange={e => set('arabic_city', e.target.value)} placeholder="دبي، الإمارات" dir="rtl"/>
                  </div>
                </div>
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

              <div>
                <Label className="text-xs font-medium mb-2 block">Shape</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['ROUND', 'OVAL', 'RECTANGLE', 'SQUARE'] as StampType[]).map(t => (
                    <OptionButton key={t} selected={form.stamp_type === t} onClick={() => set('stamp_type', t)}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </OptionButton>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 block">Theme</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['CLASSIC', 'MODERN', 'MINIMAL', 'LUXURY', 'BOLD', 'VINTAGE'] as StyleTheme[]).map(t => (
                    <OptionButton key={t} selected={form.style_theme === t} onClick={() => set('style_theme', t)}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </OptionButton>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 block">Border Style</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['SINGLE', 'DOUBLE', 'RING', 'DOTTED', 'ROPE', 'CUSTOM'] as BorderStyle[]).map(b => (
                    <OptionButton key={b} selected={form.border_style === b} onClick={() => set('border_style', b)}>
                      {b.charAt(0) + b.slice(1).toLowerCase()}
                    </OptionButton>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 block">Typography</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['SERIF', 'SANS', 'MONOSPACE', 'CALLIGRAPHY'] as TypographyStyle[]).map(t => (
                    <OptionButton key={t} selected={form.typography_style === t} onClick={() => set('typography_style', t)}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </OptionButton>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 block">Density: {form.density}</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set('density', d)}
                      className={`w-10 h-10 rounded-xl border-2 text-sm font-semibold transition-all ${
                        form.density === d
                          ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]'
                          : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                      }`}
                    >{d}</button>
                  ))}
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">1 = minimal info · 5 = max detail</p>
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
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'NONE', label: 'No Icon', desc: 'Text only' },
                    { key: 'MONOGRAM', label: 'Monogram', desc: '1–3 initials' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => set('icon_style', opt.key as IconStyle)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        form.icon_style === opt.key
                          ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]'
                          : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                      }`}
                    >
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {form.icon_style === 'MONOGRAM' && (
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">Monogram Text (1–3 letters)</Label>
                  <Input
                    value={form.monogram_text}
                    onChange={e => set('monogram_text', e.target.value.slice(0, 3))}
                    placeholder={form.company_name.slice(0, 2) || 'JJ'}
                    maxLength={3}
                    className="uppercase"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Leave blank to auto-use company initials</p>
                </div>
              )}

              <div className="bg-[hsl(var(--pearl-1))] rounded-xl p-4 border border-[hsl(var(--border))]">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  <strong>Ready to generate!</strong> Click "Generate Stamp Concepts" to create 7 unique AI-curated stamp designs based on your settings.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => step === 0 ? navigate('/toolkit/stamp-generator/projects') : setStep(s => s - 1)}
            className="gap-1"
          >
            <ChevronLeft size={15}/> {step === 0 ? 'Back to Projects' : 'Previous'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => {
                if (step === 0 && !form.company_name.trim()) { toast.error('Company name is required'); return; }
                setStep(s => s + 1);
              }}
              className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1"
            >
              Next <ChevronRight size={15}/>
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1"
            >
              <Wand2 size={15}/> {saving ? 'Creating...' : 'Generate Stamp Concepts'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
