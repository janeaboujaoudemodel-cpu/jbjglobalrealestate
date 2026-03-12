/**
 * Brochure Generator — Premium Champagne-Gold UI (Phase 2 Upgrade)
 * Rich project selector with images, developer auto-fetch, AI full-prompt generation,
 * business card/stamp/signature integration, 8+ themes, download variants
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  FileText, Upload, Download, Image as ImageIcon, Building2, User,
  Loader2, Plus, Trash2, Sparkles, Wand2, Search, X, ChevronDown,
  Stamp, PenTool, CreditCard, Globe, Palette, Eye, RotateCcw,
  BookOpen, LayoutTemplate, Star, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

type BrochureType = 'property' | 'profile' | 'presentation';

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
  accent?: string;
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
  developer_name?: string;
}

interface ProjectImage {
  id: string;
  project_id: string;
  image_url: string;
  image_type?: string;
}

interface DeveloperInfo {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  founded_year?: number;
  website_url?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THEMES: BrochureTheme[] = [
  { id: 'indigo', name: 'Deep Indigo', primaryColor: [0.39, 0.40, 0.94] },
  { id: 'blue', name: 'Ocean Blue', primaryColor: [0.20, 0.40, 0.70] },
  { id: 'green', name: 'Forest Green', primaryColor: [0.20, 0.50, 0.30] },
  { id: 'black', name: 'Classic Black', primaryColor: [0.10, 0.10, 0.10] },
  { id: 'gold', name: 'Champagne Gold', primaryColor: [0.72, 0.53, 0.04] },
  { id: 'navy', name: 'Royal Navy', primaryColor: [0.10, 0.15, 0.27] },
  { id: 'burgundy', name: 'Burgundy', primaryColor: [0.55, 0.09, 0.09] },
  { id: 'teal', name: 'Emerald Teal', primaryColor: [0.05, 0.36, 0.39] },
];

const DEFAULT_PROPERTY: PropertyData = {
  title: '', location: '', price: '', bedrooms: '', bathrooms: '',
  size: '', description: '', features: [], images: [],
};

const DEFAULT_PROFILE: ProfileData = {
  name: '', title: '', phone: '', email: '', bio: '', specializations: [], photoUrl: '',
};

// ─── Helper components ────────────────────────────────────────────────────────

const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl p-5 bg-white border-2 border-[hsl(var(--gold)/0.2)] shadow-sm ${className}`}>
    {children}
  </div>
);

const PanelTitle = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="h-5 w-5 text-[hsl(var(--gold))]" />
    <h3 className="text-[hsl(var(--foreground))] font-semibold text-base">{children}</h3>
  </div>
);

const GoldInput = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full px-3 py-2.5 rounded-xl text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition-all bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border-2 border-[hsl(var(--gold)/0.3)] focus:border-[hsl(var(--gold))] focus:ring-2 focus:ring-[hsl(var(--gold)/0.2)] ${className}`}
  />
);

const GoldTextarea = ({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`w-full px-3 py-2.5 rounded-xl text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none transition-all resize-none bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border-2 border-[hsl(var(--gold)/0.3)] focus:border-[hsl(var(--gold))] focus:ring-2 focus:ring-[hsl(var(--gold)/0.2)] ${className}`}
  />
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function BrochureGeneratorPage() {
  const { user, isOwner } = useAuth();
  const [brochureType, setBrochureType] = useState<BrochureType>('property');
  const [propertyData, setPropertyData] = useState<PropertyData>(DEFAULT_PROPERTY);
  const [profileData, setProfileData] = useState<ProfileData>(DEFAULT_PROFILE);
  const [heroCard, setHeroCard] = useState<HeroCard>({ headline: '', tagline: '', logoUrl: '' });
  const [selectedTheme, setSelectedTheme] = useState<string>('gold');
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
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [loadingProjectImages, setLoadingProjectImages] = useState(false);

  // Developer info
  const [developerInfo, setDeveloperInfo] = useState<DeveloperInfo | null>(null);
  const [showDeveloperBranding, setShowDeveloperBranding] = useState(true);

  // Business card / stamp / signature integration
  const [includeBusinessCard, setIncludeBusinessCard] = useState(false);
  const [includeStamp, setIncludeStamp] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(false);
  const [stampUrl, setStampUrl] = useState<string>('');
  const [signatureUrl, setSignatureUrl] = useState<string>('');

  // AI full-prompt generation
  const [aiFullPrompt, setAiFullPrompt] = useState('');
  const [aiFullGenerating, setAiFullGenerating] = useState(false);

  // Download variant
  const [downloadVariant, setDownloadVariant] = useState<'full' | 'no-card' | 'no-dev' | 'clean'>('full');

  // Custom accent color
  const [customAccentColor, setCustomAccentColor] = useState('#B8860B');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch projects with developer info ────────────────────────────────────

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await supabase
          .from('projects')
          .select('id,name,area_name,emirate,price_from,bedrooms_min,bedrooms_max,description,amenities,developer_name')
          .eq('is_published', true)
          .order('name')
          .limit(200);
        if (data) setProjects(data);
      } catch { /* silent */ }
    };
    fetchProjects();
  }, []);

  // Load saved stamp/signature from session storage
  useEffect(() => {
    const savedStamp = sessionStorage.getItem('jbj_stamp_preview');
    if (savedStamp) setStampUrl(savedStamp);
    const savedSig = sessionStorage.getItem('jbj_signature_preview');
    if (savedSig) setSignatureUrl(savedSig);
  }, []);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    (p.area_name || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
    (p.developer_name || '').toLowerCase().includes(projectSearch.toLowerCase())
  );

  // Fetch project images when a project is selected
  const fetchProjectImages = async (projectId: string) => {
    setLoadingProjectImages(true);
    try {
      const { data } = await supabase
        .from('project_images')
        .select('id, project_id, image_url')
        .eq('project_id', projectId)
        .limit(20);
      if (data) setProjectImages(data as any);
    } catch { /* silent */ }
    setLoadingProjectImages(false);
  };

  // Fetch developer info
  const fetchDeveloperInfo = async (developerName: string) => {
    try {
      const { data } = await supabase
        .from('developers')
        .select('id, name, logo_url, description, founded_year, website_url')
        .ilike('name', `%${developerName}%`)
        .limit(1)
        .single();
      if (data) {
        setDeveloperInfo(data);
        // Auto-set logo if available
        if (data.logo_url && !heroCard.logoUrl) {
          setHeroCard(prev => ({ ...prev, logoUrl: data.logo_url! }));
        }
      }
    } catch { /* silent */ }
  };

  const selectProject = async (project: DBProject) => {
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

    // Fetch images and developer info in parallel
    fetchProjectImages(project.id);
    if (project.developer_name) {
      fetchDeveloperInfo(project.developer_name);
    }
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

  // Use project image in brochure
  const useProjectImage = (url: string) => {
    setPropertyData(prev => ({ ...prev, images: [...prev.images, url] }));
    toast.success('Image added to brochure');
  };

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
          developerName: developerInfo?.name,
          developerDescription: developerInfo?.description,
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

  // ── AI Full Prompt Generation ─────────────────────────────────────────────

  const generateFromFullPrompt = async () => {
    if (!aiFullPrompt.trim()) { toast.error('Enter a prompt first'); return; }
    setAiFullGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('brochure-ai', {
        body: {
          fullPrompt: aiFullPrompt,
          type: 'full-generation',
          developerName: developerInfo?.name,
          developerDescription: developerInfo?.description,
        }
      });
      if (error) throw error;
      if (data?.description) {
        setPropertyData(prev => ({ ...prev, description: data.description }));
      }
      if (data?.headline) setHeroCard(prev => ({ ...prev, headline: data.headline }));
      if (data?.tagline) setHeroCard(prev => ({ ...prev, tagline: data.tagline }));
      if (data?.features) setPropertyData(prev => ({ ...prev, features: data.features }));
      if (data?.title) setPropertyData(prev => ({ ...prev, title: data.title }));
      toast.success('AI generated brochure content!');
    } catch (err) {
      console.error(err);
      toast.error('AI generation failed');
    } finally {
      setAiFullGenerating(false);
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

    // Developer branding
    if (showDeveloperBranding && developerInfo && downloadVariant !== 'no-dev' && downloadVariant !== 'clean') {
      page1.drawText(`Developed by ${developerInfo.name}${developerInfo.founded_year ? ` · Est. ${developerInfo.founded_year}` : ''}`, {
        x: 40, y: height - 120, size: 9, font: helvetica, color: rgb(0.85, 0.85, 0.85),
      });
    }

    // Price
    let yPos = height - 170;
    if (propertyData.price) {
      page1.drawText(propertyData.price, {
        x: 40, y: yPos, size: 22, font: helveticaBold, color: rgb(...theme.primaryColor),
      });
      yPos -= 30;
    }

    // Details
    const details = [
      propertyData.bedrooms ? `Bedrooms: ${propertyData.bedrooms}` : null,
      propertyData.bathrooms ? `Bathrooms: ${propertyData.bathrooms}` : null,
      propertyData.size ? `Size: ${propertyData.size}` : null,
    ].filter(Boolean) as string[];

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

    // Footer with business card info
    const footerH = (includeBusinessCard && downloadVariant !== 'no-card' && downloadVariant !== 'clean') ? 80 : 50;
    page1.drawRectangle({ x: 0, y: 0, width, height: footerH, color: rgb(...theme.primaryColor) });

    if (includeBusinessCard && downloadVariant !== 'no-card' && downloadVariant !== 'clean') {
      page1.drawText(profileData.name || 'Your Company', { x: 40, y: footerH - 25, size: 13, font: helveticaBold, color: rgb(1, 1, 1) });
      page1.drawText(profileData.title || '', { x: 40, y: footerH - 40, size: 9, font: helvetica, color: rgb(0.85, 0.85, 0.85) });
      const contact = [profileData.phone, profileData.email].filter(Boolean).join(' · ');
      if (contact) page1.drawText(contact, { x: 40, y: footerH - 55, size: 8, font: helvetica, color: rgb(0.8, 0.8, 0.8) });
    } else {
      page1.drawText(profileData?.name || 'Your Company', { x: 40, y: 18, size: 12, font: helveticaBold, color: rgb(1, 1, 1) });
    }

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
    page.drawText(profileData.name || 'Your Company', { x: 40, y: 18, size: 12, font: helveticaBold, color: rgb(1, 1, 1) });
    return pdfDoc.save();
  };

  const generateBrochure = useCallback(async () => {
    if (brochureType === 'property' && !propertyData.title) { toast.error('Please enter a property title'); return; }
    if (brochureType === 'profile' && !profileData.name) { toast.error('Please enter your name'); return; }
    setProcessing(true);
    try {
      const theme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];
      const pdfBytes = brochureType === 'property' || brochureType === 'presentation'
        ? await generatePropertyBrochure(theme)
        : await generateProfileBrochure(theme);

      const variantSuffix = downloadVariant !== 'full' ? `_${downloadVariant}` : '';
      const filename = brochureType === 'property' || brochureType === 'presentation'
        ? `property_brochure${variantSuffix}_${Date.now()}.pdf`
        : `agent_profile${variantSuffix}_${Date.now()}.pdf`;
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
  }, [brochureType, propertyData, profileData, heroCard, selectedTheme, downloadVariant, includeBusinessCard, includeStamp, showDeveloperBranding, developerInfo]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]">

      {/* Header */}
      <div className="border-b border-[hsl(var(--gold)/0.2)] bg-white/80 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                Brochure Generator
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]">
                  AI-Powered
                </span>
              </h1>
              <p className="text-sm mt-0.5 text-[hsl(var(--muted-foreground))]">
                Select a project · Customize the cover · Generate professional PDF brochures
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">

        {/* ── AI Full Prompt Section ── */}
        <Panel className="mb-6">
          <PanelTitle icon={Wand2}>AI Full-Prompt Generator</PanelTitle>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
            Type a complete prompt and AI will generate the entire brochure content — title, description, features, and cover text.
          </p>
          <div className="flex gap-2">
            <GoldTextarea
              value={aiFullPrompt}
              onChange={e => setAiFullPrompt(e.target.value)}
              placeholder='e.g. "Create a premium presentation for Amra by City Developers — luxury waterfront living in Dubai Marina with 1-4 bedroom apartments starting from AED 1.8M"'
              rows={3}
            />
          </div>
          <button
            onClick={generateFromFullPrompt}
            disabled={aiFullGenerating}
            className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] hover:opacity-90 shadow-md"
          >
            {aiFullGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Full Brochure Content
          </button>
        </Panel>

        {/* ── Rich Project Selector ── */}
        {brochureType === 'property' && projects.length > 0 && (
          <Panel className="mb-6">
            <PanelTitle icon={Building2}>Select Property from Database</PanelTitle>
            <div className="relative">
              <button
                onClick={() => setProjectsOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border-2 border-[hsl(var(--gold)/0.3)] hover:border-[hsl(var(--gold)/0.6)]"
              >
                <span className={selectedProject ? 'text-[hsl(var(--foreground))] font-medium' : 'text-[hsl(var(--muted-foreground))]'}>
                  {selectedProject ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[hsl(var(--gold))]" />
                      {selectedProject.name}
                      {selectedProject.developer_name && <span className="text-xs text-[hsl(var(--muted-foreground))]">by {selectedProject.developer_name}</span>}
                    </span>
                  ) : 'Choose a property to auto-fill form…'}
                </span>
                <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              </button>
              {projectsOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden bg-white border-2 border-[hsl(var(--gold)/0.3)] shadow-xl">
                  <div className="p-3 border-b border-[hsl(var(--gold)/0.1)]">
                    <div className="flex items-center gap-2 px-2">
                      <Search className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <input
                        value={projectSearch}
                        onChange={e => setProjectSearch(e.target.value)}
                        placeholder="Search by project, area, or developer…"
                        className="flex-1 bg-transparent text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] outline-none"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {filteredProjects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => selectProject(project)}
                        className="w-full text-left px-4 py-3 transition-colors hover:bg-[hsl(var(--gold)/0.05)] border-b border-[hsl(var(--gold)/0.05)] last:border-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--gold)/0.1)] to-[hsl(var(--gold)/0.05)] flex items-center justify-center flex-shrink-0 border border-[hsl(var(--gold)/0.2)]">
                            <Building2 className="w-5 h-5 text-[hsl(var(--gold))]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{project.name}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                              {project.area_name && <span>{project.area_name}</span>}
                              {project.emirate && <span> · {project.emirate}</span>}
                              {project.price_from ? <span> · AED {project.price_from.toLocaleString()}</span> : null}
                            </p>
                            {project.developer_name && (
                              <p className="text-[10px] text-[hsl(var(--gold-dark))] mt-0.5 font-medium">by {project.developer_name}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    {filteredProjects.length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">No projects found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Project Images Gallery */}
            {selectedProject && projectImages.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">
                  Project Images — Click to add to brochure
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {projectImages.map(img => (
                    <button
                      key={img.id}
                      onClick={() => useProjectImage(img.image_url)}
                      className="relative group rounded-lg overflow-hidden aspect-square border-2 border-transparent hover:border-[hsl(var(--gold))] transition-all"
                    >
                      <img src={img.image_url} alt="Project" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {loadingProjectImages && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading project images…
              </div>
            )}

            {/* Developer Info Card */}
            {developerInfo && (
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-[hsl(var(--gold)/0.05)] to-transparent border border-[hsl(var(--gold)/0.15)]">
                <div className="flex items-center gap-3">
                  {developerInfo.logo_url && (
                    <img src={developerInfo.logo_url} alt={developerInfo.name} className="w-10 h-10 object-contain rounded-lg bg-white p-1 border border-[hsl(var(--gold)/0.2)]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{developerInfo.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                      {developerInfo.founded_year && `Est. ${developerInfo.founded_year}`}
                      {developerInfo.website_url && ` · ${developerInfo.website_url}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Show branding</span>
                    <Switch checked={showDeveloperBranding} onCheckedChange={setShowDeveloperBranding} />
                  </div>
                </div>
                {developerInfo.description && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 line-clamp-2">{developerInfo.description}</p>
                )}
              </div>
            )}
          </Panel>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left: Type, Theme, Integrations ── */}
          <div className="space-y-4">

            {/* Brochure Type */}
            <Panel>
              <PanelTitle icon={FileText}>Brochure Type</PanelTitle>
              <RadioGroup value={brochureType} onValueChange={(v) => setBrochureType(v as BrochureType)}>
                {[
                  { value: 'property', icon: Building2, label: 'Property Listing' },
                  { value: 'presentation', icon: LayoutTemplate, label: 'Presentation Deck' },
                  { value: 'profile', icon: User, label: 'Agent Profile' },
                ].map(({ value, icon: Icon, label }) => (
                  <label key={value}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border-2 ${
                      brochureType === value
                        ? 'border-[hsl(var(--gold)/0.5)] bg-[hsl(var(--gold)/0.05)]'
                        : 'border-transparent hover:bg-[hsl(var(--gold)/0.02)]'
                    }`}>
                    <RadioGroupItem value={value} id={value} />
                    <Icon className="h-4 w-4 text-[hsl(var(--gold))]" />
                    <span className="text-[hsl(var(--foreground))] text-sm">{label}</span>
                  </label>
                ))}
              </RadioGroup>
            </Panel>

            {/* Theme */}
            <Panel>
              <PanelTitle icon={Palette}>Theme & Colors</PanelTitle>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map(theme => (
                  <button key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left transition-all border-2 ${
                      selectedTheme === theme.id
                        ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]'
                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
                    }`}>
                    <div className="w-5 h-5 rounded-full shrink-0 border border-white shadow-sm"
                      style={{ backgroundColor: `rgb(${theme.primaryColor.map(c => Math.round(c * 255)).join(',')})` }} />
                    <span className="text-xs text-[hsl(var(--foreground))] font-medium">{theme.name}</span>
                  </button>
                ))}
              </div>
              {/* Custom accent */}
              <div className="mt-3 flex items-center gap-2">
                <label className="text-xs text-[hsl(var(--muted-foreground))]">Custom accent:</label>
                <input type="color" value={customAccentColor} onChange={e => setCustomAccentColor(e.target.value)} className="w-7 h-7 rounded border-0 cursor-pointer" />
              </div>
            </Panel>

            {/* Hero Cover Card */}
            <Panel>
              <PanelTitle icon={ImageIcon}>Hero Cover Card</PanelTitle>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs mb-1 block text-[hsl(var(--muted-foreground))]">Logo / Brand</Label>
                  {heroCard.logoUrl ? (
                    <div className="flex items-center gap-2">
                      <img src={heroCard.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded bg-[hsl(var(--muted)/0.3)] p-1" />
                      <button onClick={() => setHeroCard(p => ({ ...p, logoUrl: '' }))} className="text-xs px-2 py-1 rounded font-semibold bg-red-50 text-red-600 hover:bg-red-100">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all text-[hsl(var(--gold-dark))] bg-[hsl(var(--gold)/0.06)] border-2 border-dashed border-[hsl(var(--gold)/0.3)] hover:border-[hsl(var(--gold)/0.6)]"
                    >
                      <Upload className="w-4 h-4" /> Upload Logo
                    </button>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block text-[hsl(var(--muted-foreground))]">Headline</Label>
                  <GoldInput value={heroCard.headline} onChange={e => setHeroCard(p => ({ ...p, headline: e.target.value }))} placeholder="e.g. Luxury Living Redefined" />
                </div>
                <div>
                  <Label className="text-xs mb-1 block text-[hsl(var(--muted-foreground))]">Tagline</Label>
                  <GoldInput value={heroCard.tagline} onChange={e => setHeroCard(p => ({ ...p, tagline: e.target.value }))} placeholder="e.g. Downtown Dubai · From AED 2M" />
                </div>
              </div>
            </Panel>

            {/* Stamp / Signature / Business Card Integration */}
            <Panel>
              <PanelTitle icon={Stamp}>Document Integrations</PanelTitle>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[hsl(var(--gold))]" />
                    <span className="text-sm text-[hsl(var(--foreground))]">Business Card</span>
                  </div>
                  <Switch checked={includeBusinessCard} onCheckedChange={setIncludeBusinessCard} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stamp className="w-4 h-4 text-[hsl(var(--gold))]" />
                    <span className="text-sm text-[hsl(var(--foreground))]">Company Stamp</span>
                  </div>
                  <Switch checked={includeStamp} onCheckedChange={setIncludeStamp} />
                </div>
                {includeStamp && !stampUrl && (
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] pl-6">
                    Create one in Stamp Generator to auto-load here
                  </p>
                )}
                {includeStamp && stampUrl && (
                  <div className="pl-6">
                    <img src={stampUrl} alt="Stamp" className="h-12 object-contain opacity-80" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-[hsl(var(--gold))]" />
                    <span className="text-sm text-[hsl(var(--foreground))]">Signature</span>
                  </div>
                  <Switch checked={includeSignature} onCheckedChange={setIncludeSignature} />
                </div>
                {includeSignature && signatureUrl && (
                  <div className="pl-6">
                    <img src={signatureUrl} alt="Signature" className="h-8 object-contain" />
                  </div>
                )}
              </div>
            </Panel>

            {/* Options + Download Variant */}
            <Panel>
              <PanelTitle icon={Download}>Download Options</PanelTitle>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[hsl(var(--foreground))]">Include QR Code</span>
                  <Switch checked={includeQRCode} onCheckedChange={setIncludeQRCode} />
                </div>
                <div className="border-t border-[hsl(var(--gold)/0.1)] pt-3">
                  <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Download Variant</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'full' as const, label: 'Full Version' },
                      { id: 'no-card' as const, label: 'No Card' },
                      { id: 'no-dev' as const, label: 'No Developer' },
                      { id: 'clean' as const, label: 'Clean' },
                    ].map(v => (
                      <button
                        key={v.id}
                        onClick={() => setDownloadVariant(v.id)}
                        className={`text-xs py-2 px-2 rounded-lg transition-all border ${
                          downloadVariant === v.id
                            ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold-dark))] font-semibold'
                            : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.3)]'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* ── Right: Content Form ── */}
          <div className="lg:col-span-2 space-y-4">

            {brochureType === 'property' || brochureType === 'presentation' ? (
              <Panel>
                <PanelTitle icon={Building2}>Property Details</PanelTitle>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block text-[hsl(var(--muted-foreground))]">Property Title *</Label>
                      <GoldInput
                        value={propertyData.title}
                        onChange={e => setPropertyData(p => ({ ...p, title: e.target.value }))}
                        placeholder="Luxury 3BR Apartment in Downtown"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block text-[hsl(var(--muted-foreground))]">Location</Label>
                      <GoldInput
                        value={propertyData.location}
                        onChange={e => setPropertyData(p => ({ ...p, location: e.target.value }))}
                        placeholder="Downtown Dubai, UAE"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block text-[hsl(var(--muted-foreground))]">Price</Label>
                        <GoldInput value={propertyData.price} onChange={e => setPropertyData(p => ({ ...p, price: e.target.value }))} placeholder="AED 2,500,000" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block text-[hsl(var(--muted-foreground))]">Bedrooms</Label>
                        <GoldInput value={propertyData.bedrooms} onChange={e => setPropertyData(p => ({ ...p, bedrooms: e.target.value }))} placeholder="3" />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block text-[hsl(var(--muted-foreground))]">Size</Label>
                        <GoldInput value={propertyData.size} onChange={e => setPropertyData(p => ({ ...p, size: e.target.value }))} placeholder="1,800 sq ft" />
                      </div>
                    </div>

                    {/* Description + AI */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs text-[hsl(var(--muted-foreground))]">Description</Label>
                        <button
                          onClick={generateAIDescription}
                          disabled={aiGenerating}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50 bg-[hsl(var(--gold)/0.1)] border border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.15)]"
                        >
                          {aiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                          AI Write Description
                        </button>
                      </div>
                      <GoldTextarea
                        value={propertyData.description}
                        onChange={e => setPropertyData(p => ({ ...p, description: e.target.value }))}
                        placeholder="Describe the property or click 'AI Write Description' to auto-generate…"
                        rows={5}
                      />
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <Label className="text-xs mb-2 block text-[hsl(var(--muted-foreground))]">Features & Amenities</Label>
                    <div className="flex gap-2 mb-2">
                      <GoldInput
                        value={newFeature}
                        onChange={e => setNewFeature(e.target.value)}
                        placeholder="Add a feature…"
                        onKeyDown={e => e.key === 'Enter' && addFeature()}
                      />
                      <button onClick={addFeature} className="px-3 py-2 rounded-xl flex-shrink-0 bg-[hsl(var(--gold)/0.1)] border border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.15)]">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {propertyData.features.map((f, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-[hsl(var(--gold)/0.08)] border border-[hsl(var(--gold)/0.2)] text-[hsl(var(--foreground))]">
                          {f}
                          <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <Label className="text-xs mb-2 block text-[hsl(var(--muted-foreground))]">Property Images</Label>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all text-[hsl(var(--gold-dark))] bg-[hsl(var(--gold)/0.04)] border-2 border-dashed border-[hsl(var(--gold)/0.25)] hover:border-[hsl(var(--gold)/0.5)]"
                    >
                      <Upload className="w-4 h-4" /> Upload Images
                    </button>
                    <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePropertyImageUpload} />
                    {propertyData.images.length > 0 && (
                      <div className="grid grid-cols-5 gap-2 mt-3">
                        {propertyData.images.map((img, i) => (
                          <div key={i} className="relative group rounded-lg overflow-hidden aspect-square border border-[hsl(var(--gold)/0.2)]">
                            <img src={img} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeImage(i)}
                              className="absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/85"
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
                      <Label className="text-xs mb-1 block text-[hsl(var(--muted-foreground))]">Full Name *</Label>
                      <GoldInput value={profileData.name} onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))} placeholder="John Smith" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs mb-1 block text-[hsl(var(--muted-foreground))]">Job Title</Label>
                      <GoldInput value={profileData.title} onChange={e => setProfileData(p => ({ ...p, title: e.target.value }))} placeholder="Senior Property Consultant" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block text-[hsl(var(--muted-foreground))]">Phone</Label>
                      <GoldInput value={profileData.phone} onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} placeholder="+971 50 123 4567" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block text-[hsl(var(--muted-foreground))]">Email</Label>
                      <GoldInput value={profileData.email} onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))} placeholder="john@jbjglobal.com" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs mb-1 block text-[hsl(var(--muted-foreground))]">Bio</Label>
                      <GoldTextarea value={profileData.bio} onChange={e => setProfileData(p => ({ ...p, bio: e.target.value }))} placeholder="Write about your experience…" rows={4} />
                    </div>
                  </div>

                  {/* Specializations */}
                  <div>
                    <Label className="text-xs mb-2 block text-[hsl(var(--muted-foreground))]">Specializations</Label>
                    <div className="flex gap-2 mb-2">
                      <GoldInput value={newSpec} onChange={e => setNewSpec(e.target.value)} placeholder="Add specialization…" onKeyDown={e => e.key === 'Enter' && addSpec()} />
                      <button onClick={addSpec} className="px-3 py-2 rounded-xl flex-shrink-0 bg-[hsl(var(--gold)/0.1)] border border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold-dark))]">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profileData.specializations.map((s, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-[hsl(var(--gold)/0.08)] border border-[hsl(var(--gold)/0.2)] text-[hsl(var(--foreground))]">
                          {s}
                          <button onClick={() => removeSpec(i)} className="text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Photo */}
                  <div>
                    <Label className="text-xs mb-2 block text-[hsl(var(--muted-foreground))]">Profile Photo</Label>
                    <div className="flex items-center gap-3">
                      {profileData.photoUrl ? (
                        <img src={profileData.photoUrl} alt="Profile" className="w-14 h-14 rounded-full object-cover border-2 border-[hsl(var(--gold)/0.3)]" />
                      ) : (
                        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[hsl(var(--gold)/0.1)] border border-[hsl(var(--gold)/0.2)]">
                          <User className="w-6 h-6 text-[hsl(var(--gold))]" />
                        </div>
                      )}
                      <button onClick={() => photoInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all bg-[hsl(var(--gold)/0.06)] border border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.1)]">
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
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-50 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] shadow-lg hover:opacity-90"
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
