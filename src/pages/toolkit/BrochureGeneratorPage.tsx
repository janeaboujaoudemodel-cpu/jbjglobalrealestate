/**
 * Document Creator — Unified studio for Brochures, Company Profiles, Books, Presentations
 * Phase 3: Preview-first (no auto-download), image selection checkmarks, document type selector
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { SaveProjectBar } from '@/components/toolkit/SaveProjectBar';
import { InlineStampGenerator } from '@/components/toolkit/InlineStampGenerator';
import {
  FileText, Upload, Download, Image as ImageIcon, Building2, User,
  Loader2, Plus, Trash2, Sparkles, Wand2, Search, X, ChevronDown,
  Stamp, PenTool, CreditCard, Globe, Palette, Eye, RotateCcw,
  BookOpen, LayoutTemplate, Star, CheckCircle2, FileCheck, Presentation,
  Book, Briefcase, GripVertical, Copy, Lock, QrCode, ArrowUp, ArrowDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

type DocumentType = 'brochure' | 'company-profile' | 'book' | 'presentation' | 'report';

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
  developer_name?: string;
}

interface ProjectImage {
  id: string;
  project_id: string;
  image_url: string;
}

interface DeveloperInfo {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  founded_year?: number;
  website_url?: string;
}

interface PreviewPage {
  id: string;
  imageData: string;
  label: string;
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

const DOC_TYPES: { id: DocumentType; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'brochure', label: 'Brochure', icon: FileText, desc: 'Property listing brochure' },
  { id: 'company-profile', label: 'Company Profile', icon: Briefcase, desc: 'Corporate presentation' },
  { id: 'book', label: 'Book / Catalog', icon: Book, desc: 'Multi-page catalog' },
  { id: 'presentation', label: 'Presentation', icon: Presentation, desc: 'Slide deck' },
];

const DEFAULT_PROPERTY: PropertyData = {
  title: '', location: '', price: '', bedrooms: '', bathrooms: '',
  size: '', description: '', features: [], images: [],
};

const DEFAULT_PROFILE: ProfileData = {
  name: '', title: '', phone: '', email: '', bio: '', specializations: [], photoUrl: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const accent = '#B89555';

const Panel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl p-4 bg-[#FDFBF7] border border-[#B89555]/30 shadow-sm ${className}`}>
    {children}
  </div>
);

const PanelTitle = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className="h-4 w-4 text-blue-600" />
    <h3 className="text-[#1A1A1A] font-semibold text-sm">{children}</h3>
  </div>
);

const CleanInput = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full px-3 py-2 rounded-lg text-sm text-[#1A1A1A] placeholder-stone-400 outline-none transition-all bg-[#F7F2EA] border border-[#B89555]/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${className}`}
  />
);

const CleanTextarea = ({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={`w-full px-3 py-2 rounded-lg text-sm text-[#1A1A1A] placeholder-stone-400 outline-none transition-all resize-none bg-[#F7F2EA] border border-[#B89555]/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${className}`}
  />
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function BrochureGeneratorPage() {
  const { user } = useAuth();
  const [documentType, setDocumentType] = useState<DocumentType>('brochure');
  const [propertyData, setPropertyData] = useState<PropertyData>(DEFAULT_PROPERTY);
  const [profileData, setProfileData] = useState<ProfileData>(DEFAULT_PROFILE);
  const [heroCard, setHeroCard] = useState<HeroCard>({ headline: '', tagline: '', logoUrl: '' });
  const [selectedTheme, setSelectedTheme] = useState<string>('navy');
  const [includeQRCode, setIncludeQRCode] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [projectName, setProjectName] = useState('Untitled Document');

  // Project selector
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<DBProject | null>(null);
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([]);
  const [loadingProjectImages, setLoadingProjectImages] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());

  // Developer info
  const [developerInfo, setDeveloperInfo] = useState<DeveloperInfo | null>(null);
  const [showDeveloperBranding, setShowDeveloperBranding] = useState(true);

  // Integrations
  const [includeBusinessCard, setIncludeBusinessCard] = useState(false);
  const [includeStamp, setIncludeStamp] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(false);
  const [stampUrl, setStampUrl] = useState<string>('');
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [stampModalOpen, setStampModalOpen] = useState(false);

  // AI prompt
  const [aiFullPrompt, setAiFullPrompt] = useState('');
  const [aiFullGenerating, setAiFullGenerating] = useState(false);

  // Preview mode — replaces auto-download
  const [previewPages, setPreviewPages] = useState<PreviewPage[]>([]);
  const [previewPdfBytes, setPreviewPdfBytes] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch projects ────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await supabase
          .from('projects')
          .select('id,name,area_name,emirate,price_from,bedrooms_min,bedrooms_max,description,amenities,developer_name')
          .eq('is_published', true)
          .or('listing_kind.is.null,listing_kind.neq.leasing')
          .order('name')
          .limit(200);
        if (data) setProjects(data);
      } catch { /* silent */ }
    };
    fetchProjects();
  }, []);

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
        if (data.logo_url && !heroCard.logoUrl) {
          setHeroCard(prev => ({ ...prev, logoUrl: data.logo_url! }));
        }
      }
    } catch { /* silent */ }
  };

  const selectProject = async (project: DBProject) => {
    setSelectedProject(project);
    setProjectsOpen(false);
    setSelectedImageIds(new Set());
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
    setProjectName(project.name);
    toast.success(`Loaded: ${project.name}`);
    fetchProjectImages(project.id);
    if (project.developer_name) fetchDeveloperInfo(project.developer_name);
  };

  // ── Image handlers ────────────────────────────────────────────────────────

  const toggleProjectImage = (img: ProjectImage) => {
    setSelectedImageIds(prev => {
      const next = new Set(prev);
      if (next.has(img.id)) {
        next.delete(img.id);
        setPropertyData(p => ({ ...p, images: p.images.filter(u => u !== img.image_url) }));
      } else {
        next.add(img.id);
        setPropertyData(p => ({ ...p, images: [...p.images, img.image_url] }));
      }
      return next;
    });
  };

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

  const addFeature = () => {
    if (newFeature.trim()) {
      setPropertyData(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature('');
    }
  };
  const removeFeature = (i: number) => setPropertyData(prev => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }));
  const removeImage = (i: number) => setPropertyData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));

  // ── AI ──────────────────────────────────────────────────────────────────────

  const generateAIDescription = async () => {
    const name = propertyData.title || selectedProject?.name;
    if (!name) { toast.error('Enter a title first'); return; }
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('brochure-ai', {
        body: {
          propertyName: name,
          location: propertyData.location,
          price: propertyData.price,
          features: propertyData.features,
          type: documentType,
          developerName: developerInfo?.name,
          developerDescription: developerInfo?.description,
        }
      });
      if (error) throw error;
      if (data?.description) {
        setPropertyData(prev => ({ ...prev, description: data.description }));
        toast.success('AI description generated!');
      }
    } catch {
      toast.error('AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const generateFromFullPrompt = async () => {
    if (!aiFullPrompt.trim()) { toast.error('Enter a prompt first'); return; }
    setAiFullGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('brochure-ai', {
        body: {
          fullPrompt: aiFullPrompt,
          type: 'full-generation',
          documentType,
          developerName: developerInfo?.name,
          developerDescription: developerInfo?.description,
        }
      });
      if (error) throw error;
      if (data?.description) setPropertyData(prev => ({ ...prev, description: data.description }));
      if (data?.headline) setHeroCard(prev => ({ ...prev, headline: data.headline }));
      if (data?.tagline) setHeroCard(prev => ({ ...prev, tagline: data.tagline }));
      if (data?.features) setPropertyData(prev => ({ ...prev, features: data.features }));
      if (data?.title) setPropertyData(prev => ({ ...prev, title: data.title }));
      toast.success('AI generated content!');
    } catch {
      toast.error('AI generation failed');
    } finally {
      setAiFullGenerating(false);
    }
  };

  // ── PDF Generation (Preview, not Download) ────────────────────────────────

  const generatePDF = async (): Promise<Uint8Array> => {
    const theme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];
    const pdfDoc = await PDFDocument.create();
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const page1 = pdfDoc.addPage([612, 792]);
    const { width, height } = page1.getSize();

    // Header
    page1.drawRectangle({ x: 0, y: height - 140, width, height: 140, color: rgb(...theme.primaryColor) });
    if (heroCard.headline || propertyData.title) {
      page1.drawText(heroCard.headline || propertyData.title, {
        x: 40, y: height - 60, size: 26, font: bold, color: rgb(1, 1, 1), maxWidth: width - 80,
      });
    }
    if (heroCard.tagline || propertyData.location) {
      page1.drawText(heroCard.tagline || propertyData.location, {
        x: 40, y: height - 95, size: 13, font: regular, color: rgb(0.9, 0.9, 0.9),
      });
    }
    if (showDeveloperBranding && developerInfo) {
      page1.drawText(`Developed by ${developerInfo.name}${developerInfo.founded_year ? ` · Est. ${developerInfo.founded_year}` : ''}`, {
        x: 40, y: height - 120, size: 9, font: regular, color: rgb(0.85, 0.85, 0.85),
      });
    }

    let yPos = height - 170;
    if (propertyData.price) {
      page1.drawText(propertyData.price, { x: 40, y: yPos, size: 22, font: bold, color: rgb(...theme.primaryColor) });
      yPos -= 30;
    }
    const details = [
      propertyData.bedrooms ? `Bedrooms: ${propertyData.bedrooms}` : null,
      propertyData.bathrooms ? `Bathrooms: ${propertyData.bathrooms}` : null,
      propertyData.size ? `Size: ${propertyData.size}` : null,
    ].filter(Boolean) as string[];
    details.forEach(d => { page1.drawText(d, { x: 40, y: yPos, size: 11, font: regular, color: rgb(0.3, 0.3, 0.3) }); yPos -= 22; });

    if (propertyData.description) {
      yPos -= 10;
      page1.drawText('Description', { x: 40, y: yPos, size: 14, font: bold, color: rgb(0.1, 0.1, 0.1) });
      yPos -= 22;
      (propertyData.description.match(/.{1,90}/g) || []).slice(0, 8).forEach(line => {
        page1.drawText(line, { x: 40, y: yPos, size: 10, font: regular, color: rgb(0.3, 0.3, 0.3) });
        yPos -= 16;
      });
    }

    if (propertyData.features.length > 0) {
      yPos -= 10;
      page1.drawText('Features & Amenities', { x: 40, y: yPos, size: 14, font: bold, color: rgb(0.1, 0.1, 0.1) });
      yPos -= 22;
      propertyData.features.slice(0, 12).forEach(f => {
        page1.drawText(`• ${f}`, { x: 50, y: yPos, size: 10, font: regular, color: rgb(0.3, 0.3, 0.3) });
        yPos -= 16;
      });
    }

    // Footer with user company info
    const footerH = includeBusinessCard ? 80 : 50;
    page1.drawRectangle({ x: 0, y: 0, width, height: footerH, color: rgb(...theme.primaryColor) });
    if (includeBusinessCard) {
      page1.drawText(profileData.name || projectName, { x: 40, y: footerH - 25, size: 13, font: bold, color: rgb(1, 1, 1) });
      page1.drawText(profileData.title || '', { x: 40, y: footerH - 40, size: 9, font: regular, color: rgb(0.85, 0.85, 0.85) });
      const contact = [profileData.phone, profileData.email].filter(Boolean).join(' · ');
      if (contact) page1.drawText(contact, { x: 40, y: footerH - 55, size: 8, font: regular, color: rgb(0.8, 0.8, 0.8) });
    } else {
      page1.drawText(projectName || 'Document', { x: 40, y: 18, size: 12, font: bold, color: rgb(1, 1, 1) });
    }

    return pdfDoc.save();
  };

  const handleGenerate = useCallback(async () => {
    if (!propertyData.title && !profileData.name) {
      toast.error('Enter a title or name first');
      return;
    }
    setProcessing(true);
    try {
      const pdfBytes = await generatePDF();
      setPreviewPdfBytes(pdfBytes);

      // Create preview images from PDF pages
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewPages([{ id: '1', imageData: url, label: 'Page 1 — Cover' }]);
      setShowPreview(true);
      toast.success('Document generated! Review below.');
    } catch (err) {
      console.error(err);
      toast.error('Generation failed');
    } finally {
      setProcessing(false);
    }
  }, [propertyData, profileData, heroCard, selectedTheme, includeBusinessCard, showDeveloperBranding, developerInfo, projectName]);

  const handleDownload = useCallback(() => {
    if (!previewPdfBytes) return;
    const blob = new Blob([previewPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${documentType}_${Date.now()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  }, [previewPdfBytes, projectName, documentType]);

  const saveProject = useCallback(() => {
    const data = { projectName, documentType, propertyData, profileData, heroCard, selectedTheme };
    localStorage.setItem(`jbj_draft_document-creator_${Date.now()}`, JSON.stringify(data));
    toast.success('Draft saved!');
  }, [projectName, documentType, propertyData, profileData, heroCard, selectedTheme]);

  const clearProject = useCallback(() => {
    setPropertyData(DEFAULT_PROPERTY);
    setProfileData(DEFAULT_PROFILE);
    setHeroCard({ headline: '', tagline: '', logoUrl: '' });
    setPreviewPages([]);
    setPreviewPdfBytes(null);
    setShowPreview(false);
    setProjectName('Untitled Document');
    toast.success('Cleared');
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <div className="border-b border-[#B89555]/30 bg-[#F7F2EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-[#EFE6D6] border border-[#B89555]/40">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight">
                    Document <span className="text-blue-600">Creator</span>
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-700">
                    <Sparkles className="w-3 h-3" /> AI
                  </span>
                </div>
                <p className="text-xs text-[#1A1A1A]/70">
                  Brochures · Company Profiles · Books · Presentations
                </p>
              </div>
            </div>
            <div className="sm:ml-auto">
              <SaveProjectBar
                projectName={projectName}
                onNameChange={setProjectName}
                onSave={saveProject}
                onClear={clearProject}
                canSave={!!propertyData.title || !!profileData.name}
                accentColor="#B89555"
                accentBorder="rgba(37,99,235,0.2)"
                toolId="document-creator"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Document Type Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {DOC_TYPES.map(dt => (
            <button
              key={dt.id}
              onClick={() => setDocumentType(dt.id)}
              className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all border-2 ${
                documentType === dt.id
                  ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                  : 'border-[#B89555]/30 hover:border-blue-300 bg-[#FDFBF7]'
              }`}
            >
              <dt.icon className={`w-5 h-5 shrink-0 ${documentType === dt.id ? 'text-blue-600' : 'text-[#1A1A1A]/70'}`} />
              <div>
                <p className={`text-xs font-semibold ${documentType === dt.id ? 'text-blue-700' : 'text-[#1A1A1A]'}`}>{dt.label}</p>
                <p className="text-[10px] text-[#1A1A1A]/70">{dt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* AI Prompt */}
        <Panel className="mb-5">
          <PanelTitle icon={Wand2}>AI Content Generator</PanelTitle>
          <div className="flex gap-2">
            <CleanTextarea
              value={aiFullPrompt}
              onChange={e => setAiFullPrompt(e.target.value)}
              placeholder='e.g. "Create a luxury brochure for Amra by City Developers — waterfront living in Dubai Marina"'
              rows={2}
            />
          </div>
          <button
            onClick={generateFromFullPrompt}
            disabled={aiFullGenerating}
            className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs text-white transition-all disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
          >
            {aiFullGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Generate Content with AI
          </button>
        </Panel>

        {/* Project Selector */}
        {projects.length > 0 && (
          <Panel className="mb-5">
            <PanelTitle icon={Building2}>Select Property from Database</PanelTitle>
            <div className="relative">
              <button
                onClick={() => setProjectsOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm bg-[#F7F2EA] border border-[#B89555]/30 hover:border-blue-400 transition-all"
              >
                <span className={selectedProject ? 'text-[#1A1A1A] font-medium' : 'text-[#1A1A1A]/70'}>
                  {selectedProject ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      {selectedProject.name}
                      {selectedProject.developer_name && <span className="text-xs text-[#1A1A1A]/70">by {selectedProject.developer_name}</span>}
                    </span>
                  ) : 'Choose a property…'}
                </span>
                <ChevronDown className="h-4 w-4 text-[#1A1A1A]/70" />
              </button>
              {projectsOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden bg-[#FDFBF7] border border-[#B89555]/30 shadow-xl">
                  <div className="p-2 border-b border-[#B89555]/30">
                    <div className="flex items-center gap-2 px-2">
                      <Search className="h-4 w-4 text-[#1A1A1A]/70" />
                      <input
                        value={projectSearch}
                        onChange={e => setProjectSearch(e.target.value)}
                        placeholder="Search projects…"
                        className="flex-1 bg-transparent text-sm text-[#1A1A1A] placeholder-stone-400 outline-none"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredProjects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => selectProject(project)}
                        className="w-full text-left px-3 py-2.5 transition-colors hover:bg-blue-50 border-b border-[#B89555]/30 last:border-0"
                      >
                        <p className="text-sm font-medium text-[#1A1A1A] truncate">{project.name}</p>
                        <p className="text-[10px] text-[#1A1A1A]/70 mt-0.5">
                          {[project.area_name, project.emirate, project.price_from ? `AED ${project.price_from.toLocaleString()}` : null].filter(Boolean).join(' · ')}
                        </p>
                      </button>
                    ))}
                    {filteredProjects.length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-[#1A1A1A]/70">No projects found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Project Images with Selection Checkmarks */}
            {selectedProject && projectImages.length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold text-[#1A1A1A]/70 uppercase tracking-wide mb-2">
                  Project Images — Click to select ({selectedImageIds.size} selected)
                </p>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
                  {projectImages.map(img => {
                    const isSelected = selectedImageIds.has(img.id);
                    return (
                      <button
                        key={img.id}
                        onClick={() => toggleProjectImage(img)}
                        className={`relative rounded-lg overflow-hidden aspect-square transition-all border-2 ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-blue-300'
                        }`}
                      >
                        <img src={img.image_url} alt="Project" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {loadingProjectImages && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[#1A1A1A]/70">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading images…
              </div>
            )}

            {/* Developer Info */}
            {developerInfo && (
              <div className="mt-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                <div className="flex items-center gap-3">
                  {developerInfo.logo_url && (
                    <img src={developerInfo.logo_url} alt={developerInfo.name} className="w-8 h-8 object-contain rounded bg-[#FDFBF7] p-0.5 border border-blue-200"  loading="lazy" decoding="async" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1A1A1A]">{developerInfo.name}</p>
                    <p className="text-[10px] text-[#1A1A1A]/70 truncate">
                      {developerInfo.founded_year && `Est. ${developerInfo.founded_year}`}
                    </p>
                  </div>
                  <Switch checked={showDeveloperBranding} onCheckedChange={setShowDeveloperBranding} />
                </div>
              </div>
            )}
          </Panel>
        )}

        <div className="grid lg:grid-cols-[280px_1fr_260px] gap-5">

          {/* ── Left: Settings ── */}
          <div className="space-y-4 lg:max-h-[calc(100vh-260px)] lg:overflow-y-auto lg:pr-1">
            {/* Theme */}
            <Panel>
              <PanelTitle icon={Palette}>Theme</PanelTitle>
              <div className="grid grid-cols-2 gap-1.5">
                {THEMES.map(theme => (
                  <button key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border ${
                      selectedTheme === theme.id ? 'border-blue-500 bg-blue-50' : 'border-[#B89555]/30 hover:border-blue-300'
                    }`}>
                    <div className="w-4 h-4 rounded-full shrink-0 border border-white shadow-sm"
                      style={{ backgroundColor: `rgb(${theme.primaryColor.map(c => Math.round(c * 255)).join(',')})` }} />
                    <span className="text-[10px] text-[#1A1A1A] font-medium">{theme.name}</span>
                  </button>
                ))}
              </div>
            </Panel>

            {/* Cover Card */}
            <Panel>
              <PanelTitle icon={ImageIcon}>Cover Card</PanelTitle>
              <div className="space-y-2">
                {heroCard.logoUrl ? (
                  <div className="flex items-center gap-2">
                    <img src={heroCard.logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded bg-[#F7F2EA] p-0.5"  loading="lazy" decoding="async" />
                    <button onClick={() => setHeroCard(p => ({ ...p, logoUrl: '' }))} className="text-[10px] px-2 py-1 rounded bg-red-50 text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => logoInputRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-blue-600 bg-blue-50 border border-dashed border-blue-200 hover:border-blue-400">
                    <Upload className="w-3.5 h-3.5" /> Upload Logo
                  </button>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <CleanInput value={heroCard.headline} onChange={e => setHeroCard(p => ({ ...p, headline: e.target.value }))} placeholder="Headline" />
                <CleanInput value={heroCard.tagline} onChange={e => setHeroCard(p => ({ ...p, tagline: e.target.value }))} placeholder="Tagline" />
              </div>
            </Panel>

            {/* Integrations */}
            <Panel>
              <PanelTitle icon={Stamp}>Integrations</PanelTitle>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#1A1A1A] flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-blue-500" /> Business Card</span>
                  <Switch checked={includeBusinessCard} onCheckedChange={setIncludeBusinessCard} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#1A1A1A] flex items-center gap-1.5"><Stamp className="w-3.5 h-3.5 text-blue-500" /> Company Stamp</span>
                  <Switch checked={includeStamp} onCheckedChange={setIncludeStamp} />
                </div>
                {includeStamp && !stampUrl && (
                  <button onClick={() => setStampModalOpen(true)}
                    className="w-full text-[10px] py-1.5 rounded-lg text-blue-600 bg-blue-50 border border-dashed border-blue-200 hover:bg-blue-100">
                    <Plus className="w-3 h-3 inline mr-1" /> Create Stamp
                  </button>
                )}
                {includeStamp && stampUrl && (
                  <div className="pl-5"><img src={stampUrl} alt="Stamp" className="h-10 object-contain opacity-80"  loading="lazy" decoding="async" /></div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#1A1A1A] flex items-center gap-1.5"><PenTool className="w-3.5 h-3.5 text-blue-500" /> Signature</span>
                  <Switch checked={includeSignature} onCheckedChange={setIncludeSignature} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#1A1A1A] flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5 text-blue-500" /> QR Code</span>
                  <Switch checked={includeQRCode} onCheckedChange={setIncludeQRCode} />
                </div>
              </div>
            </Panel>
          </div>

          {/* ── Center: Form + Preview ── */}
          <div className="space-y-4">
            {/* Content Form */}
            <Panel>
              <PanelTitle icon={Building2}>Content</PanelTitle>
              <div className="space-y-3">
                <div>
                  <Label className="text-[10px] text-[#1A1A1A]/70 mb-1 block">Title *</Label>
                  <CleanInput value={propertyData.title} onChange={e => setPropertyData(p => ({ ...p, title: e.target.value }))} placeholder="Project or document title" />
                </div>
                <div>
                  <Label className="text-[10px] text-[#1A1A1A]/70 mb-1 block">Location</Label>
                  <CleanInput value={propertyData.location} onChange={e => setPropertyData(p => ({ ...p, location: e.target.value }))} placeholder="Dubai, UAE" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px] text-[#1A1A1A]/70 mb-1 block">Price</Label>
                    <CleanInput value={propertyData.price} onChange={e => setPropertyData(p => ({ ...p, price: e.target.value }))} placeholder="AED 2.5M" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-[#1A1A1A]/70 mb-1 block">Bedrooms</Label>
                    <CleanInput value={propertyData.bedrooms} onChange={e => setPropertyData(p => ({ ...p, bedrooms: e.target.value }))} placeholder="3" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-[#1A1A1A]/70 mb-1 block">Size</Label>
                    <CleanInput value={propertyData.size} onChange={e => setPropertyData(p => ({ ...p, size: e.target.value }))} placeholder="1,800 sqft" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-[10px] text-[#1A1A1A]/70">Description</Label>
                    <button onClick={generateAIDescription} disabled={aiGenerating}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 disabled:opacity-50">
                      {aiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} AI Write
                    </button>
                  </div>
                  <CleanTextarea value={propertyData.description} onChange={e => setPropertyData(p => ({ ...p, description: e.target.value }))} placeholder="Describe the property…" rows={4} />
                </div>

                {/* Features */}
                <div>
                  <Label className="text-[10px] text-[#1A1A1A]/70 mb-1 block">Features</Label>
                  <div className="flex gap-1.5 mb-1.5">
                    <CleanInput value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder="Add feature…" onKeyDown={e => e.key === 'Enter' && addFeature()} />
                    <button onClick={addFeature} className="px-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {propertyData.features.map((f, i) => (
                      <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-[#1A1A1A]">
                        {f}
                        <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600"><X className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Images */}
                <div>
                  <Label className="text-[10px] text-[#1A1A1A]/70 mb-1 block">Images ({propertyData.images.length})</Label>
                  <button onClick={() => imageInputRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-blue-600 bg-blue-50 border border-dashed border-blue-200 hover:border-blue-400">
                    <Upload className="w-3.5 h-3.5" /> Upload Images
                  </button>
                  <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePropertyImageUpload} />
                  {propertyData.images.length > 0 && (
                    <div className="grid grid-cols-6 gap-1.5 mt-2">
                      {propertyData.images.map((img, i) => (
                        <div key={i} className="relative group rounded overflow-hidden aspect-square border border-[#B89555]/30">
                          <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                          <button onClick={() => removeImage(i)}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded-full opacity-0 group-hover:opacity-100 bg-red-500/85">
                            <X className="w-2.5 h-2.5 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={processing}
              className="jj-cta-dark w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            >
              {processing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating…</>
              ) : (
                <><Eye className="w-5 h-5" /> Generate & Preview</>
              )}
            </button>

            {/* Preview Section */}
            {showPreview && previewPdfBytes && (
              <Panel className="border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    Document Preview
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={handleGenerate}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-[#F7F2EA] text-[#1A1A1A]/70 hover:bg-[#EFE6D6] border border-[#B89555]/30">
                      <RotateCcw className="w-3 h-3" /> Regenerate
                    </button>
                    <button onClick={handleDownload}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-blue-600 text-white hover:bg-blue-700">
                      <Download className="w-3 h-3" /> Download PDF
                    </button>
                  </div>
                </div>

                {/* PDF Embed */}
                <div className="rounded-lg overflow-hidden border border-[#B89555]/30 bg-[#F7F2EA]">
                  <iframe
                    src={URL.createObjectURL(new Blob([previewPdfBytes], { type: 'application/pdf' }))}
                    className="w-full"
                    style={{ height: 500 }}
                    title="Document Preview"
                  />
                </div>

                <p className="text-[10px] text-center text-[#1A1A1A]/70 mt-2">
                  Review your document above. Click "Download PDF" when ready.
                </p>
              </Panel>
            )}
          </div>

          {/* ── Right: Quick Actions ── */}
          <div className="space-y-4 lg:max-h-[calc(100vh-260px)] lg:overflow-y-auto lg:pr-1">
            {/* Profile for footer */}
            {includeBusinessCard && (
              <Panel>
                <PanelTitle icon={User}>Contact Info (Footer)</PanelTitle>
                <div className="space-y-2">
                  <CleanInput value={profileData.name} onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
                  <CleanInput value={profileData.title} onChange={e => setProfileData(p => ({ ...p, title: e.target.value }))} placeholder="Job title" />
                  <CleanInput value={profileData.phone} onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
                  <CleanInput value={profileData.email} onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))} placeholder="Email" />
                </div>
              </Panel>
            )}

            {/* Quick tips */}
            <Panel>
              <PanelTitle icon={Star}>Tips</PanelTitle>
              <div className="space-y-2 text-[10px] text-[#1A1A1A]/70">
                <p>• Select a project from the database to auto-fill all fields</p>
                <p>• Click project images to add them — checkmark shows selected</p>
                <p>• Use AI prompt for instant content generation</p>
                <p>• "Generate & Preview" shows the document before downloading</p>
                <p>• Enable integrations to add stamps, signatures, and QR codes</p>
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {/* Inline Stamp Generator */}
      <InlineStampGenerator
        open={stampModalOpen}
        onClose={() => setStampModalOpen(false)}
        onStampReady={(dataUrl) => { setStampUrl(dataUrl); setStampModalOpen(false); }}
        accentColor="#B89555"
      />

      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} />
    </div>
  );
}
