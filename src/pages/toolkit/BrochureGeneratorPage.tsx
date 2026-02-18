/**
 * Brochure Generator — Premium Navy-Indigo UI
 * AI-powered with project DB integration and hero card editor
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  FileText, Upload, Download, Image as ImageIcon, Building2, User,
  Loader2, Plus, Trash2, Sparkles, Wand2, Search, X, ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────────────

type BrochureType = 'property' | 'profile';

interface PropertyData {
  title: string;
  location: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  size: string;
  description: string;
  features: string[];
  images: string[];
}

interface ProfileData {
  name: string;
  title: string;
  phone: string;
  email: string;
  bio: string;
  specializations: string[];
  photoUrl: string;
}

interface HeroCard {
  headline: string;
  tagline: string;
  logoUrl: string;
}

interface BrochureTheme {
  id: string;
  name: string;
  primaryColor: [number, number, number];
}

interface DBProject {
  id: string;
  name: string;
  area_name?: string;
  emirate?: string;
  price_from?: number;
  bedrooms_min?: number;
  bedrooms_max?: number;
  description?: string;
  amenities?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THEMES: BrochureTheme[] = [
  { id: 'indigo', name: 'Deep Indigo', primaryColor: [0.39, 0.40, 0.94] },
  { id: 'blue', name: 'Ocean Blue', primaryColor: [0.20, 0.40, 0.70] },
  { id: 'green', name: 'Forest Green', primaryColor: [0.20, 0.50, 0.30] },
  { id: 'black', name: 'Classic Black', primaryColor: [0.10, 0.10, 0.10] },
];

const DEFAULT_PROPERTY: PropertyData = {
  title: '', location: '', price: '', bedrooms: '', bathrooms: '',
  size: '', description: '', features: [], images: [],
};

const DEFAULT_PROFILE: ProfileData = {
  name: '', title: '', phone: '', email: '', bio: '', specializations: [], photoUrl: '',
};

const IND = {
  bg: "#0C0E14",
  card: "rgba(99,102,241,0.06)",
  border: "rgba(99,102,241,0.18)",
  borderHover: "rgba(99,102,241,0.4)",
  accent: "#6366F1",
  text: "#818CF8",
};

// ─── Helper components ────────────────────────────────────────────────────────

const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl p-5 ${className}`} style={{ background: IND.card, border: `1px solid ${IND.border}` }}>
    {children}
  </div>
);

const PanelTitle = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="h-5 w-5" style={{ color: IND.text }} />
    <h3 className="text-white font-semibold text-base">{children}</h3>
  </div>
);

const DarkInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
    style={{
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(99,102,241,0.25)",
      color: "white",
      ...(props.style || {}),
    }}
  />
);

const DarkTextarea = ({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all resize-none"
    style={{
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(99,102,241,0.25)",
      color: "white",
      ...(props.style || {}),
    }}
  />
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function BrochureGeneratorPage() {
  const [brochureType, setBrochureType] = useState<BrochureType>('property');
  const [propertyData, setPropertyData] = useState<PropertyData>(DEFAULT_PROPERTY);
  const [profileData, setProfileData] = useState<ProfileData>(DEFAULT_PROFILE);
  const [heroCard, setHeroCard] = useState<HeroCard>({ headline: '', tagline: '', logoUrl: '' });
  const [selectedTheme, setSelectedTheme] = useState<string>('indigo');
  const [includeQRCode, setIncludeQRCode] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [newSpec, setNewSpec] = useState('');

  // Project selector state
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<DBProject | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch projects ────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await supabase
          .from('projects')
          .select('id,name,area_name,emirate,price_from,bedrooms_min,bedrooms_max,description,amenities')
          .eq('is_published', true)
          .order('name')
          .limit(100);
        if (data) setProjects(data);
      } catch { /* silent */ }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    (p.area_name || '').toLowerCase().includes(projectSearch.toLowerCase())
  );

  const selectProject = (project: DBProject) => {
    setSelectedProject(project);
    setProjectsOpen(false);
    const location = [project.area_name, project.emirate].filter(Boolean).join(', ');
    const price = project.price_from ? `AED ${project.price_from.toLocaleString()}` : '';
    const beds = project.bedrooms_min !== undefined && project.bedrooms_max !== undefined
      ? `${project.bedrooms_min}–${project.bedrooms_max}`
      : project.bedrooms_min?.toString() || '';
    setPropertyData(prev => ({
      ...prev,
      title: project.name,
      location,
      price,
      bedrooms: beds,
      description: project.description || prev.description,
      features: project.amenities?.slice(0, 8) || prev.features,
    }));
    setHeroCard(prev => ({ ...prev, headline: project.name, tagline: location }));
    toast.success(`Loaded: ${project.name}`);
  };

  // ── Image handlers ────────────────────────────────────────────────────────

  const handlePropertyImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => setPropertyData(prev => ({ ...prev, images: [...prev.images, ev.target?.result as string] }));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleProfilePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfileData(prev => ({ ...prev, photoUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }, []);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setHeroCard(prev => ({ ...prev, logoUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  }, []);

  // ── Features / Specializations ────────────────────────────────────────────

  const addFeature = () => {
    if (newFeature.trim()) {
      setPropertyData(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature('');
    }
  };
  const removeFeature = (i: number) => setPropertyData(prev => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }));
  const addSpec = () => {
    if (newSpec.trim()) {
      setProfileData(prev => ({ ...prev, specializations: [...prev.specializations, newSpec.trim()] }));
      setNewSpec('');
    }
  };
  const removeSpec = (i: number) => setProfileData(prev => ({ ...prev, specializations: prev.specializations.filter((_, idx) => idx !== i) }));
  const removeImage = (i: number) => setPropertyData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));

  // ── AI Generate Description ───────────────────────────────────────────────

  const generateAIDescription = async () => {
    const name = propertyData.title || selectedProject?.name;
    if (!name) { toast.error('Enter a property title first'); return; }
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('brochure-ai', {
        body: {
          propertyName: name,
          location: propertyData.location,
          price: propertyData.price,
          features: propertyData.features,
          type: brochureType,
        }
      });
      if (error) throw error;
      if (data?.description) {
        setPropertyData(prev => ({ ...prev, description: data.description }));
        toast.success('AI description generated!');
      }
    } catch (err) {
      console.error(err);
      toast.error('AI generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  // ── PDF Generation ────────────────────────────────────────────────────────

  const generatePropertyBrochure = async (theme: BrochureTheme): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const page1 = pdfDoc.addPage([612, 792]);
    const { width, height } = page1.getSize();

    // Hero header
    page1.drawRectangle({ x: 0, y: height - 140, width, height: 140, color: rgb(...theme.primaryColor) });

    if (heroCard.headline || propertyData.title) {
      page1.drawText(heroCard.headline || propertyData.title, {
        x: 40, y: height - 60, size: 26, font: helveticaBold, color: rgb(1, 1, 1),
        maxWidth: width - 80,
      });
    }
    if (heroCard.tagline || propertyData.location) {
      page1.drawText(heroCard.tagline || propertyData.location, {
        x: 40, y: height - 95, size: 13, font: helvetica, color: rgb(0.9, 0.9, 0.9),
      });
    }

    // Price
    if (propertyData.price) {
      page1.drawText(propertyData.price, {
        x: 40, y: height - 170, size: 22, font: helveticaBold, color: rgb(...theme.primaryColor),
      });
    }

    // Details
    const details = [
      propertyData.bedrooms ? `Bedrooms: ${propertyData.bedrooms}` : null,
      propertyData.bathrooms ? `Bathrooms: ${propertyData.bathrooms}` : null,
      propertyData.size ? `Size: ${propertyData.size}` : null,
    ].filter(Boolean) as string[];

    let yPos = height - 210;
    details.forEach(d => {
      page1.drawText(d, { x: 40, y: yPos, size: 11, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
      yPos -= 22;
    });

    if (propertyData.description) {
      yPos -= 10;
      page1.drawText('Description', { x: 40, y: yPos, size: 14, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
      yPos -= 22;
      const lines = propertyData.description.match(/.{1,90}/g) || [];
      lines.slice(0, 8).forEach(line => {
        page1.drawText(line, { x: 40, y: yPos, size: 10, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
        yPos -= 16;
      });
    }

    if (propertyData.features.length > 0) {
      yPos -= 10;
      page1.drawText('Features & Amenities', { x: 40, y: yPos, size: 14, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
      yPos -= 22;
      propertyData.features.slice(0, 12).forEach(f => {
        page1.drawText(`• ${f}`, { x: 50, y: yPos, size: 10, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
        yPos -= 16;
      });
    }

    // Footer
    page1.drawRectangle({ x: 0, y: 0, width, height: 50, color: rgb(...theme.primaryColor) });
    page1.drawText('JBJ Global Real Estate', { x: 40, y: 18, size: 12, font: helveticaBold, color: rgb(1, 1, 1) });

    return pdfDoc.save();
  };

  const generateProfileBrochure = async (theme: BrochureTheme): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();

    page.drawRectangle({ x: 0, y: height - 150, width, height: 150, color: rgb(...theme.primaryColor) });
    page.drawText(profileData.name || 'Agent Name', { x: 200, y: height - 70, size: 26, font: helveticaBold, color: rgb(1, 1, 1) });
    page.drawText(profileData.title || 'Real Estate Professional', { x: 200, y: height - 100, size: 13, font: helvetica, color: rgb(0.9, 0.9, 0.9) });

    let yPos = height - 200;
    if (profileData.phone) { page.drawText(`Phone: ${profileData.phone}`, { x: 40, y: yPos, size: 12, font: helvetica, color: rgb(0.3, 0.3, 0.3) }); yPos -= 25; }
    if (profileData.email) { page.drawText(`Email: ${profileData.email}`, { x: 40, y: yPos, size: 12, font: helvetica, color: rgb(0.3, 0.3, 0.3) }); yPos -= 35; }
    if (profileData.bio) {
      page.drawText('About Me', { x: 40, y: yPos, size: 14, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
      yPos -= 22;
      (profileData.bio.match(/.{1,90}/g) || []).slice(0, 8).forEach(line => {
        page.drawText(line, { x: 40, y: yPos, size: 10, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
        yPos -= 15;
      });
    }

    page.drawRectangle({ x: 0, y: 0, width, height: 50, color: rgb(...theme.primaryColor) });
    page.drawText('JBJ Global Real Estate', { x: 40, y: 18, size: 12, font: helveticaBold, color: rgb(1, 1, 1) });
    return pdfDoc.save();
  };

  const generateBrochure = useCallback(async () => {
    if (brochureType === 'property' && !propertyData.title) { toast.error('Please enter a property title'); return; }
    if (brochureType === 'profile' && !profileData.name) { toast.error('Please enter your name'); return; }
    setProcessing(true);
    try {
      const theme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];
      const pdfBytes = brochureType === 'property'
        ? await generatePropertyBrochure(theme)
        : await generateProfileBrochure(theme);
      const filename = brochureType === 'property'
        ? `property_brochure_${Date.now()}.pdf`
        : `agent_profile_${Date.now()}.pdf`;
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success('Brochure generated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate brochure');
    } finally {
      setProcessing(false);
    }
  }, [brochureType, propertyData, profileData, heroCard, selectedTheme]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: IND.bg }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${IND.border}`, background: IND.card, backdropFilter: "blur(12px)" }}>
        <div className="container max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${IND.border}` }}>
              <FileText className="h-6 w-6" style={{ color: IND.text }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Brochure Generator
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: IND.text, border: `1px solid ${IND.border}` }}>
                  AI-Powered
                </span>
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Select a project · Customize the cover · Generate professional PDF brochures
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">

        {/* ── Project Selector ── */}
        {brochureType === 'property' && projects.length > 0 && (
          <Panel className="mb-6">
            <PanelTitle icon={Building2}>Select Property from Database</PanelTitle>
            <div className="relative">
              <button
                onClick={() => setProjectsOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${IND.border}`, color: selectedProject ? "white" : "rgba(255,255,255,0.4)" }}
              >
                <span>{selectedProject ? selectedProject.name : 'Choose a property to auto-fill form…'}</span>
                <ChevronDown className="h-4 w-4" style={{ color: "rgba(255,255,255,0.4)" }} />
              </button>
              {projectsOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden"
                  style={{ background: "#1A2030", border: `1px solid ${IND.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
                  <div className="p-2 border-b" style={{ borderColor: IND.border }}>
                    <div className="flex items-center gap-2 px-2">
                      <Search className="h-4 w-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                      <input
                        value={projectSearch}
                        onChange={e => setProjectSearch(e.target.value)}
                        placeholder="Search projects…"
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredProjects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => selectProject(project)}
                        className="w-full text-left px-4 py-3 transition-colors hover:bg-indigo-500/10"
                      >
                        <p className="text-sm text-white">{project.name}</p>
                        {project.area_name && (
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {project.area_name}{project.emirate ? `, ${project.emirate}` : ''}
                            {project.price_from ? ` · AED ${project.price_from.toLocaleString()}` : ''}
                          </p>
                        )}
                      </button>
                    ))}
                    {filteredProjects.length === 0 && (
                      <div className="px-4 py-6 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No projects found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left: Type, Theme, Hero ── */}
          <div className="space-y-4">

            {/* Brochure Type */}
            <Panel>
              <PanelTitle icon={FileText}>Brochure Type</PanelTitle>
              <RadioGroup value={brochureType} onValueChange={(v) => setBrochureType(v as BrochureType)}>
                {[
                  { value: 'property', icon: Building2, label: 'Property Listing' },
                  { value: 'profile', icon: User, label: 'Agent Profile' },
                ].map(({ value, icon: Icon, label }) => (
                  <label key={value}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                    style={{ background: brochureType === value ? "rgba(99,102,241,0.1)" : "transparent", border: `1px solid ${brochureType === value ? IND.border : "transparent"}` }}>
                    <RadioGroupItem value={value} id={value} />
                    <Icon className="h-4 w-4" style={{ color: IND.text }} />
                    <span className="text-white text-sm">{label}</span>
                  </label>
                ))}
              </RadioGroup>
            </Panel>

            {/* Theme */}
            <Panel>
              <PanelTitle icon={Sparkles}>Theme</PanelTitle>
              <div className="space-y-2">
                {THEMES.map(theme => (
                  <label key={theme.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                    style={{ background: selectedTheme === theme.id ? "rgba(99,102,241,0.1)" : "transparent" }}>
                    <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
                      <RadioGroupItem value={theme.id} id={theme.id} />
                    </RadioGroup>
                    <div className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: `rgb(${theme.primaryColor.map(c => Math.round(c * 255)).join(',')})` }} />
                    <span className="text-white text-sm">{theme.name}</span>
                  </label>
                ))}
              </div>
            </Panel>

            {/* Hero Cover Card */}
            <Panel>
              <PanelTitle icon={ImageIcon}>Hero Cover Card</PanelTitle>
              <div className="space-y-3">
                {/* Logo upload */}
                <div>
                  <Label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Logo / Brand</Label>
                  {heroCard.logoUrl ? (
                    <div className="flex items-center gap-2">
                      <img src={heroCard.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded" style={{ background: "rgba(255,255,255,0.1)" }} />
                      <button onClick={() => setHeroCard(p => ({ ...p, logoUrl: '' }))} className="text-xs px-2 py-1 rounded" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all text-white"
                      style={{ background: "rgba(99,102,241,0.22)", border: `2px dashed rgba(99,102,241,0.6)` }}
                    >
                      <Upload className="w-4 h-4" /> Upload Logo
                    </button>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Headline</Label>
                  <DarkInput value={heroCard.headline} onChange={e => setHeroCard(p => ({ ...p, headline: e.target.value }))} placeholder="e.g. Luxury Living Redefined" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Tagline</Label>
                  <DarkInput value={heroCard.tagline} onChange={e => setHeroCard(p => ({ ...p, tagline: e.target.value }))} placeholder="e.g. Downtown Dubai · From AED 2M" />
                </div>
              </div>
            </Panel>

            {/* Options */}
            <Panel>
              <PanelTitle icon={Sparkles}>Options</PanelTitle>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Include QR Code</span>
                <Switch checked={includeQRCode} onCheckedChange={setIncludeQRCode} />
              </div>
            </Panel>
          </div>

          {/* ── Right: Content Form ── */}
          <div className="lg:col-span-2 space-y-4">

            {brochureType === 'property' ? (
              <Panel>
                <PanelTitle icon={Building2}>Property Details</PanelTitle>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Property Title *</Label>
                      <DarkInput
                        value={propertyData.title}
                        onChange={e => setPropertyData(p => ({ ...p, title: e.target.value }))}
                        placeholder="Luxury 3BR Apartment in Downtown"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Location</Label>
                      <DarkInput
                        value={propertyData.location}
                        onChange={e => setPropertyData(p => ({ ...p, location: e.target.value }))}
                        placeholder="Downtown Dubai, UAE"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Price</Label>
                        <DarkInput value={propertyData.price} onChange={e => setPropertyData(p => ({ ...p, price: e.target.value }))} placeholder="AED 2,500,000" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Bedrooms</Label>
                        <DarkInput value={propertyData.bedrooms} onChange={e => setPropertyData(p => ({ ...p, bedrooms: e.target.value }))} placeholder="3" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Size</Label>
                        <DarkInput value={propertyData.size} onChange={e => setPropertyData(p => ({ ...p, size: e.target.value }))} placeholder="1,800 sq ft" />
                      </div>
                    </div>

                    {/* Description + AI */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Description</Label>
                        <button
                          onClick={generateAIDescription}
                          disabled={aiGenerating}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50"
                          style={{ background: "rgba(99,102,241,0.15)", border: `1px solid ${IND.border}`, color: IND.text }}
                        >
                          {aiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                          AI Write Description
                        </button>
                      </div>
                      <DarkTextarea
                        value={propertyData.description}
                        onChange={e => setPropertyData(p => ({ ...p, description: e.target.value }))}
                        placeholder="Describe the property or click 'AI Write Description' to auto-generate…"
                        rows={5}
                      />
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <Label className="text-xs mb-2 block" style={{ color: "rgba(255,255,255,0.5)" }}>Features & Amenities</Label>
                    <div className="flex gap-2 mb-2">
                      <DarkInput
                        value={newFeature}
                        onChange={e => setNewFeature(e.target.value)}
                        placeholder="Add a feature…"
                        onKeyDown={e => e.key === 'Enter' && addFeature()}
                      />
                      <button onClick={addFeature} className="px-3 py-2 rounded-xl flex-shrink-0 transition-all"
                        style={{ background: "rgba(99,102,241,0.15)", border: `1px solid ${IND.border}`, color: IND.text }}>
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {propertyData.features.map((f, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                          style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${IND.border}`, color: "rgba(255,255,255,0.85)" }}>
                          {f}
                          <button onClick={() => removeFeature(i)} style={{ color: "#f87171" }}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <Label className="text-xs mb-2 block" style={{ color: "rgba(255,255,255,0.5)" }}>Property Images</Label>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all"
                      style={{ background: "rgba(99,102,241,0.06)", border: `2px dashed ${IND.border}`, color: IND.text }}
                    >
                      <Upload className="w-4 h-4" /> Upload Images
                    </button>
                    <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePropertyImageUpload} />
                    {propertyData.images.length > 0 && (
                      <div className="grid grid-cols-5 gap-2 mt-3">
                        {propertyData.images.map((img, i) => (
                          <div key={i} className="relative group rounded-lg overflow-hidden aspect-square">
                            <img src={img} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeImage(i)}
                              className="absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: "rgba(239,68,68,0.85)" }}
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel>
                <PanelTitle icon={User}>Profile Details</PanelTitle>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Full Name *</Label>
                      <DarkInput value={profileData.name} onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))} placeholder="John Smith" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Job Title</Label>
                      <DarkInput value={profileData.title} onChange={e => setProfileData(p => ({ ...p, title: e.target.value }))} placeholder="Senior Property Consultant" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Phone</Label>
                      <DarkInput value={profileData.phone} onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} placeholder="+971 50 123 4567" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Email</Label>
                      <DarkInput value={profileData.email} onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))} placeholder="john@jbjglobal.com" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Bio</Label>
                      <DarkTextarea value={profileData.bio} onChange={e => setProfileData(p => ({ ...p, bio: e.target.value }))} placeholder="Write about your experience…" rows={4} />
                    </div>
                  </div>

                  {/* Specializations */}
                  <div>
                    <Label className="text-xs mb-2 block" style={{ color: "rgba(255,255,255,0.5)" }}>Specializations</Label>
                    <div className="flex gap-2 mb-2">
                      <DarkInput value={newSpec} onChange={e => setNewSpec(e.target.value)} placeholder="Add specialization…" onKeyDown={e => e.key === 'Enter' && addSpec()} />
                      <button onClick={addSpec} className="px-3 py-2 rounded-xl flex-shrink-0"
                        style={{ background: "rgba(99,102,241,0.15)", border: `1px solid ${IND.border}`, color: IND.text }}>
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profileData.specializations.map((s, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                          style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${IND.border}`, color: "rgba(255,255,255,0.85)" }}>
                          {s}
                          <button onClick={() => removeSpec(i)} style={{ color: "#f87171" }}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Photo */}
                  <div>
                    <Label className="text-xs mb-2 block" style={{ color: "rgba(255,255,255,0.5)" }}>Profile Photo</Label>
                    <div className="flex items-center gap-3">
                      {profileData.photoUrl ? (
                        <img src={profileData.photoUrl} alt="Profile" className="w-14 h-14 rounded-full object-cover" style={{ border: `2px solid ${IND.border}` }} />
                      ) : (
                        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)", border: `1px solid ${IND.border}` }}>
                          <User className="w-6 h-6" style={{ color: IND.text }} />
                        </div>
                      )}
                      <button onClick={() => photoInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
                        style={{ background: "rgba(99,102,241,0.1)", border: `1px solid ${IND.border}`, color: IND.text }}>
                        <Upload className="w-4 h-4" /> Upload Photo
                      </button>
                      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} />
                    </div>
                  </div>
                </div>
              </Panel>
            )}

            {/* Generate Button */}
            <button
              onClick={generateBrochure}
              disabled={processing}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", boxShadow: "0 4px 24px rgba(99,102,241,0.45)" }}
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating Brochure…</>
              ) : (
                <><Download className="w-5 h-5" /> Generate PDF Brochure</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
