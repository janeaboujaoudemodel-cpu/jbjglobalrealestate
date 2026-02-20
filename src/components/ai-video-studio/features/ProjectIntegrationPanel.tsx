import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  FolderOpen, Loader2, Wand2, Search, RefreshCw,
  Building2, MapPin, DollarSign, Bed, ChevronDown, X, Check,
  Film, Music, Type, ArrowLeft, Play, Pause, Globe, Mic,
  Sparkles, Volume2, Copy, CheckCheck, Link2, ExternalLink, ImageIcon
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { VOICE_OPTIONS, SUPPORTED_LANGUAGES } from '../types';
import { saveVideoAdToHistory } from './VideoAdHistoryPanel';



// ─── Types ────────────────────────────────────────────────────────────────────

interface RealEstateProject {
  id: string;
  name: string;
  emirate: string;
  location: string | null;
  cover_image_url: string | null;
  price_from: number | null;
  price_to: number | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  property_type_label: string | null;
  is_featured: boolean | null;
}

interface ProjectImage {
  image_url: string;
  display_order: number;
}

interface VideoAdClip {
  name: string;
  url: string;
  type: 'image' | 'video' | 'text';
  duration: number;
  textOverlay?: {
    content: string;
    style: 'lower-third' | 'bold' | 'clean';
  };
}

interface VideoAdResult {
  clips: VideoAdClip[];
  voiceover?: {
    audioBase64: string;
    duration: number;
    script: string;
  };
  projectName: string;
  transitions?: string;
}

interface ProjectIntegrationPanelProps {
  onCreateVideoAd?: (result: VideoAdResult) => void;
}

type WizardStep = 'grid' | 'wizard' | 'result';

interface ExternalProperty {
  name: string;
  developer?: string;
  location?: string;
  city?: string;
  country?: string;
  price_text?: string;
  price_from_aed?: number | null;
  price_to_aed?: number | null;
  bedrooms?: string;
  property_type?: string;
  description?: string;
  amenities?: string[];
  payment_plan?: string;
  sourceUrl: string;
  images: string[];
}

interface WizardSettings {
  language: string;
  voiceId: string;
  tone: 'luxury' | 'casual' | 'urgent';
  scriptDuration: 30 | 60 | 90;
  format: 'reels' | 'youtube' | 'square';
  transition: 'fade' | 'slide-left' | 'zoom-in';
  textStyle: 'lower-third' | 'bold' | 'clean';
}

type GenerationPhase = 'script' | 'tts' | 'assembly' | 'done';


// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (from: number | null, to: number | null): string => {
  if (!from) return 'Price on request';
  const fmt = (n: number) =>
    n >= 1_000_000 ? `AED ${(n / 1_000_000).toFixed(1)}M` : `AED ${Math.round(n / 1000)}K`;
  return to ? `${fmt(from)} – ${fmt(to)}` : `From ${fmt(from)}`;
};

const formatBeds = (min: number | null, max: number | null): string => {
  if (min === 0 && max === 0) return 'Studio';
  if (min === null) return '';
  if (max && max !== min) return `${min === 0 ? 'Studio' : min}–${max} BR`;
  return min === 0 ? 'Studio' : `${min} BR`;
};

// ─── Mini Selector ────────────────────────────────────────────────────────────

function MiniSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] text-slate-400 uppercase tracking-wide mb-1 block">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-700 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 appearance-none cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleGroup({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] text-slate-400 uppercase tracking-wide mb-1 block">{label}</label>
      <div className="flex gap-1">
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 py-1.5 text-xs rounded-md border transition-all ${
              value === o.value
                ? 'border-amber-400 bg-amber-400/15 text-amber-300 font-semibold'
                : 'border-slate-600 text-slate-400 bg-slate-700 hover:border-slate-500'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectIntegrationPanel({ onCreateVideoAd }: ProjectIntegrationPanelProps) {
  // ── Project list state ───────────────────────────────────────────────────────
  const [projects, setProjects] = useState<RealEstateProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmirate, setSelectedEmirate] = useState<string>('All');
  const [showFilter, setShowFilter] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [scraping, setScraping] = useState(false);
  const [externalProperty, setExternalProperty] = useState<ExternalProperty | null>(null);


  // ── Wizard state ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>('grid');
  const [selectedProject, setSelectedProject] = useState<RealEstateProject | null>(null);
  const [settings, setSettings] = useState<WizardSettings>({
    language: 'en',
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
    tone: 'luxury',
    scriptDuration: 60,
    format: 'reels',
    transition: 'fade',
    textStyle: 'lower-third',
  });

  // ── Generation state ──────────────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [genPhase, setGenPhase] = useState<GenerationPhase | null>(null);
  const [result, setResult] = useState<{ script: string; duration: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const emirates = ['All', 'Dubai', 'Abu Dhabi Emirate', 'Sharjah', 'Ras Al Khaimah'];

  // ── Load projects ─────────────────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, emirate, location, cover_image_url, price_from, price_to, bedrooms_min, bedrooms_max, property_type_label, is_featured')
        .eq('is_published' as never, true)
        .not('cover_image_url', 'is', null)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) setProjects(data as RealEstateProject[]);
    } catch { /* not signed in */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // ── Speech synthesis cleanup on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── Filter ────────────────────────────────────────────────────────────────────
  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.emirate || '').toLowerCase().includes(search.toLowerCase());
    const matchEmirate = selectedEmirate === 'All' || p.emirate === selectedEmirate;
    return matchSearch && matchEmirate;
  });

  // ── URL import (real scraping) ────────────────────────────────────────────────
  const handleUrlImport = async () => {
    const raw = urlInput.trim();
    if (!raw) return;

    // Internal: match /properties/slug or /projects/slug
    const internalMatch = raw.match(/\/(?:properties|projects)\/([a-z0-9-]+)/i);
    if (internalMatch) {
      const slug = internalMatch[1];
      const found = projects.find(p => p.name.toLowerCase().replace(/\s+/g, '-').includes(slug) || p.id === slug);
      if (found) { openWizard(found); setUrlInput(''); return; }
    }

    // External URL — call scrape-property-url edge function
    setScraping(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-property-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ url: raw }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Scraping failed');
      const ext: ExternalProperty = { ...data.property, sourceUrl: raw, images: data.images || [] };
      setExternalProperty(ext);
      setSelectedProject(null);
      setResult(null);
      setStep('wizard');
      setUrlInput('');
      toast.success(`Scraped: "${ext.name}"`);
    } catch (err) {
      toast.error(`Import failed: ${err instanceof Error ? err.message : 'Could not scrape that URL'}`);
    } finally {
      setScraping(false);
    }
  };


  // ── Open wizard (internal project) ───────────────────────────────────────────
  const openWizard = (proj: RealEstateProject) => {
    setSelectedProject(proj);
    setExternalProperty(null);
    setResult(null);
    setStep('wizard');
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  };

  const backToGrid = () => {
    setStep('grid');
    setSelectedProject(null);
    setExternalProperty(null);
    setResult(null);
    if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
  };

  // Derived display values for wizard
  const wizardName = selectedProject?.name ?? externalProperty?.name ?? '';
  const wizardCoverImage = selectedProject?.cover_image_url ?? externalProperty?.images?.[0] ?? null;
  const wizardLocation = selectedProject
    ? (selectedProject.emirate === 'Abu Dhabi Emirate' ? 'Abu Dhabi' : selectedProject.emirate)
    : (externalProperty?.location ?? externalProperty?.city ?? '');
  const wizardPriceFrom = selectedProject?.price_from ?? externalProperty?.price_from_aed ?? null;
  const wizardPriceTo = selectedProject?.price_to ?? externalProperty?.price_to_aed ?? null;
  const wizardBeds = selectedProject
    ? formatBeds(selectedProject.bedrooms_min, selectedProject.bedrooms_max)
    : (externalProperty?.bedrooms ?? '');
  const wizardType = selectedProject?.property_type_label ?? externalProperty?.property_type ?? '';

  // ── Generate Video Ad ─────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedProject && !externalProperty) return;
    setGenerating(true);
    setGenPhase('script');

    try {
      setGenPhase('script');
      const body: Record<string, unknown> = {
        language: settings.language,
        voiceId: settings.voiceId,
        tone: settings.tone,
        scriptDuration: settings.scriptDuration,
      };
      if (selectedProject) {
        body.projectId = selectedProject.id;
      } else {
        body.externalProperty = externalProperty;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-property-video-ad`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(body),
        }
      );

      setTimeout(() => setGenPhase('tts'), 2000);

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed');

      setGenPhase('assembly');
      await new Promise(r => setTimeout(r, 600));

      setResult({ script: data.script, duration: data.audioDurationEstimate });
      setGenPhase('done');
      setStep('result');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
      setGenPhase(null);
    }
  };

  // ── Add to Timeline ───────────────────────────────────────────────────────────
  const handleAddToTimeline = async () => {
    if (!result) return;
    const name = wizardName;

    let allImageUrls: string[] = [];
    if (selectedProject) {
      const { data: imgData } = await supabase
        .from('project_images')
        .select('image_url, display_order')
        .eq('project_id', selectedProject.id)
        .order('display_order', { ascending: true })
        .limit(8);
      const galleryImages: ProjectImage[] = imgData || [];
      if (selectedProject.cover_image_url) allImageUrls.push(selectedProject.cover_image_url);
      galleryImages.forEach(g => { if (!allImageUrls.includes(g.image_url)) allImageUrls.push(g.image_url); });
    } else if (externalProperty) {
      allImageUrls = externalProperty.images.slice(0, 8);
    }

    if (allImageUrls.length === 0) {
      toast.error('No photos found for this property');
      return;
    }

    const clipDuration = settings.scriptDuration / Math.max(allImageUrls.slice(0, 6).length, 1);
    const photoClips: VideoAdClip[] = allImageUrls.slice(0, 6).map((url, i) => ({
      name: `${name} — Photo ${i + 1}`,
      url,
      type: 'image',
      duration: Math.max(clipDuration, 3),
    }));

    const priceText = wizardPriceFrom
      ? formatPrice(wizardPriceFrom, wizardPriceTo)
      : (externalProperty?.price_text ?? 'Price on request');
    const lowerThirdText = [
      name,
      [wizardBeds, wizardType].filter(Boolean).join(' · '),
      priceText,
      wizardLocation,
    ].filter(Boolean).join('\n');

    const textClip: VideoAdClip = {
      name: `${name} — Lower Third`,
      url: `text-overlay://${encodeURIComponent(lowerThirdText)}`,
      type: 'text',
      duration: 5,
      textOverlay: { content: lowerThirdText, style: settings.textStyle },
    };

    const allClips = [...photoClips, textClip];

    onCreateVideoAd?.({
      clips: allClips,
      voiceover: { audioBase64: '', duration: result.duration, script: result.script },
      projectName: name,
      transitions: settings.transition,
    });

    // ── Auto-save to history ─────────────────────────────────────────────────
    saveVideoAdToHistory({
      projectName: `${name} — Video Ad`,
      thumbnailUrl: wizardCoverImage,
      script: result.script,
      settings,
      clips: allClips,
      voiceover: { audioBase64: '', duration: result.duration, script: result.script },
      transitions: settings.transition,
      propertyName: name,
    });

    toast.success(`"${name}" video ad added to timeline!`);
    backToGrid();
  };


  // ── Audio playback via browser SpeechSynthesis ───────────────────────────────
  const toggleAudio = () => {
    if (!result?.script) return;
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(result.script);
      utterance.lang = settings.language;
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const copyScript = () => {
    if (!result?.script) return;
    navigator.clipboard.writeText(result.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Grid
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === 'grid') {
    return (
      <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-slate-700 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex-1">
            AI Video Ad Generator
          </span>
          <button onClick={loadProjects} className="text-slate-500 hover:text-slate-300 transition-colors" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* URL Import */}
        <div className="px-3 py-2 border-b border-slate-700">
          <div className="flex gap-1.5">
            <div className="flex-1 relative">
              {scraping
                ? <Loader2 className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-amber-400 animate-spin" />
                : <Link2 className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
              }
              <input
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !scraping && handleUrlImport()}
                placeholder="Paste any property URL to auto-import…"
                disabled={scraping}
                className="w-full bg-slate-800 border border-slate-700 rounded-md pl-7 pr-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 disabled:opacity-60"
              />
            </div>
            <button
              onClick={handleUrlImport}
              disabled={!urlInput.trim() || scraping}
              className="px-2.5 py-1.5 rounded-md bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 disabled:opacity-40 transition-all whitespace-nowrap"
            >
              {scraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Import'}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <ExternalLink className="w-2.5 h-2.5" />
            Supports Bayut, Property Finder, developer sites & more
          </p>
        </div>


        {/* Search + Filter */}
        <div className="px-3 py-2 border-b border-slate-700 space-y-2">
          <div className="flex gap-1.5">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="w-full bg-slate-800 border border-slate-700 rounded-md pl-7 pr-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilter(v => !v)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md border text-xs transition-colors ${
                showFilter || selectedEmirate !== 'All'
                  ? 'border-amber-400 text-amber-300 bg-amber-400/10'
                  : 'border-slate-700 text-slate-400 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          {showFilter && (
            <div className="flex flex-wrap gap-1">
              {emirates.map(em => (
                <button
                  key={em}
                  onClick={() => setSelectedEmirate(em)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    selectedEmirate === em
                      ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {em === 'Abu Dhabi Emirate' ? 'Abu Dhabi' : em}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Project Grid */}
        <ScrollArea className="flex-1">
          <div className="p-3">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
                <FolderOpen className="w-8 h-8 text-slate-600" />
                <p className="text-xs text-slate-400">No projects found</p>
                {search && <p className="text-xs text-slate-500">Try a different search</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filtered.map(proj => (
                  <div
                    key={proj.id}
                    className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden transition-all group hover:border-amber-400/40 cursor-pointer"
                    onClick={() => openWizard(proj)}
                  >
                    <div className="aspect-video bg-slate-700 relative overflow-hidden">
                      {proj.cover_image_url ? (
                        <img
                          src={proj.cover_image_url}
                          alt={proj.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-slate-500" />
                        </div>
                      )}
                      {proj.is_featured && (
                        <div className="absolute top-1 left-1 bg-amber-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                          ⭐ Featured
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold bg-amber-500 text-black transition-all">
                          <Sparkles className="w-3 h-3" />
                          Generate Ad
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-white truncate leading-tight">{proj.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                        <p className="text-[10px] text-slate-400 truncate">
                          {proj.emirate === 'Abu Dhabi Emirate' ? 'Abu Dhabi' : proj.emirate}
                        </p>
                      </div>
                      {(proj.price_from || proj.bedrooms_min !== null) && (
                        <div className="flex items-center gap-2 mt-1">
                          {proj.price_from && (
                            <span className="text-[10px] text-amber-400/90 font-medium">
                              {formatPrice(proj.price_from, null)}
                            </span>
                          )}
                          {proj.bedrooms_min !== null && (
                            <span className="text-[10px] text-slate-500">
                              {formatBeds(proj.bedrooms_min, proj.bedrooms_max)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-3 py-1.5 border-t border-slate-700">
          <span className="text-[10px] text-slate-500">
            {loading ? 'Loading…' : `${filtered.length} of ${projects.length} projects — click any to generate`}
          </span>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Wizard
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === 'wizard' && (selectedProject || externalProperty)) {
    const genPhases = [
      { id: 'script', label: 'Writing script…', icon: '✍️' },
      { id: 'tts', label: 'Generating voiceover…', icon: '🎙️' },
      { id: 'assembly', label: 'Assembling timeline…', icon: '🎬' },
    ];
    const currentPhaseIdx = genPhases.findIndex(p => p.id === genPhase);

    return (
      <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-slate-700 flex items-center gap-2">
          <button onClick={backToGrid} className="text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex-1 truncate">
            Generate Video Ad
          </span>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {/* Property Summary Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              {externalProperty && (
                <div className="px-3 py-1 bg-amber-500/15 border-b border-amber-400/30 flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-amber-300 font-medium truncate">Imported from external URL</span>
                </div>
              )}
              <div className="aspect-video relative overflow-hidden">
                {wizardCoverImage ? (
                  <img src={wizardCoverImage} alt={wizardName}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-700">
                    <Building2 className="w-8 h-8 text-slate-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{wizardName}</p>
                    {wizardLocation && <p className="text-[10px] text-slate-300">{wizardLocation}</p>}
                  </div>
                </div>
              </div>
              <div className="px-3 py-2 flex items-center gap-3 flex-wrap">
                {(wizardPriceFrom || externalProperty?.price_text) && (
                  <span className="text-[10px] text-amber-400 font-semibold">
                    {wizardPriceFrom ? formatPrice(wizardPriceFrom, wizardPriceTo) : externalProperty?.price_text}
                  </span>
                )}
                {wizardBeds && <span className="text-[10px] text-slate-400">{wizardBeds}</span>}
                {wizardType && <span className="text-[10px] text-slate-500">{wizardType}</span>}
                {externalProperty && externalProperty.images.length > 0 && (
                  <span className="text-[10px] text-slate-500 flex items-center gap-0.5 ml-auto">
                    <ImageIcon className="w-2.5 h-2.5" />{externalProperty.images.length} photos
                  </span>
                )}
              </div>
            </div>


            {/* Voice & Language Settings */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                Voice & Language
              </p>

              <MiniSelect
                label="Language"
                value={settings.language}
                onChange={v => setSettings(s => ({ ...s, language: v }))}
                options={SUPPORTED_LANGUAGES.map(l => ({ value: l.code, label: l.name }))}
              />

              <MiniSelect
                label="Voice"
                value={settings.voiceId}
                onChange={v => setSettings(s => ({ ...s, voiceId: v }))}
                options={VOICE_OPTIONS.map(v => ({ value: v.id, label: `${v.name} (${v.gender})` }))}
              />

              <ToggleGroup
                label="Tone"
                value={settings.tone}
                onChange={v => setSettings(s => ({ ...s, tone: v as WizardSettings['tone'] }))}
                options={[
                  { value: 'luxury', label: 'Luxury' },
                  { value: 'casual', label: 'Professional' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
              />

              <ToggleGroup
                label="Script Length"
                value={String(settings.scriptDuration)}
                onChange={v => setSettings(s => ({ ...s, scriptDuration: Number(v) as 30 | 60 | 90 }))}
                options={[
                  { value: '30', label: '30s' },
                  { value: '60', label: '60s' },
                  { value: '90', label: '90s' },
                ]}
              />
            </div>

            {/* Ad Style */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-amber-400" />
                Ad Style
              </p>

              <ToggleGroup
                label="Format"
                value={settings.format}
                onChange={v => setSettings(s => ({ ...s, format: v as WizardSettings['format'] }))}
                options={[
                  { value: 'reels', label: '9:16' },
                  { value: 'youtube', label: '16:9' },
                  { value: 'square', label: '1:1' },
                ]}
              />

              <ToggleGroup
                label="Transitions"
                value={settings.transition}
                onChange={v => setSettings(s => ({ ...s, transition: v as WizardSettings['transition'] }))}
                options={[
                  { value: 'fade', label: 'Fade' },
                  { value: 'slide-left', label: 'Slide' },
                  { value: 'zoom-in', label: 'Zoom' },
                ]}
              />

              <ToggleGroup
                label="Text Style"
                value={settings.textStyle}
                onChange={v => setSettings(s => ({ ...s, textStyle: v as WizardSettings['textStyle'] }))}
                options={[
                  { value: 'lower-third', label: 'Lower 3rd' },
                  { value: 'bold', label: 'Bold' },
                  { value: 'clean', label: 'Clean' },
                ]}
              />
            </div>

            {/* Generation Progress */}
            {generating && (
              <div className="bg-slate-800 border border-amber-400/20 rounded-lg p-3 space-y-2">
                {genPhases.map((phase, idx) => {
                  const isDone = idx < currentPhaseIdx;
                  const isActive = idx === currentPhaseIdx;
                  return (
                    <div key={phase.id} className={`flex items-center gap-2 text-xs transition-all ${
                      isDone ? 'text-emerald-400' : isActive ? 'text-amber-300' : 'text-slate-600'
                    }`}>
                      {isDone ? (
                        <Check className="w-3.5 h-3.5 shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                      )}
                      <span>{phase.icon} {phase.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Generate Button */}
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 text-black text-sm font-bold hover:from-amber-400 hover:to-amber-300 disabled:opacity-60 transition-all shadow-lg shadow-amber-500/20"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Video Ad
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Result
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === 'result' && (selectedProject || externalProperty) && result) {
    return (
      <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-slate-700 flex items-center gap-2">
          <button onClick={() => setStep('wizard')} className="text-slate-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex-1">
            Ready to Add
          </span>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {/* Audio Player */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-white">Voiceover Preview</span>
                <span className="ml-auto text-[10px] text-slate-500">~{result.duration}s</span>
              </div>
              <button
                onClick={toggleAudio}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-all"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? 'Pause Voiceover' : 'Preview Voiceover'}
              </button>
            </div>

            {/* Script */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white">Generated Script</span>
                <button
                  onClick={copyScript}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-300 transition-colors"
                >
                  {copied ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-slate-700/50 rounded-md p-2 max-h-48 overflow-y-auto">
                <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">{result.script}</p>
              </div>
            </div>

            {/* What will be added */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
              <p className="text-xs font-semibold text-white mb-2">Will be added to timeline:</p>
              <div className="space-y-1.5">
                {[
                  { icon: Film, label: 'Up to 6 property photos with transitions', color: 'text-blue-400' },
                  { icon: Mic, label: `AI voiceover in ${SUPPORTED_LANGUAGES.find(l => l.code === settings.language)?.name || 'English'}`, color: 'text-purple-400' },
                  { icon: Type, label: `${settings.textStyle === 'lower-third' ? 'Lower-third' : settings.textStyle} text overlay`, color: 'text-emerald-400' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-start gap-2 text-[11px] text-slate-400">
                    <Icon className={`w-3.5 h-3.5 ${color} mt-0.5 shrink-0`} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Add to Timeline Button */}
        <div className="p-3 border-t border-slate-700 space-y-2">
          <button
            onClick={handleAddToTimeline}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-bold hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Film className="w-4 h-4" />
            Add to Timeline
          </button>
          <button
            onClick={() => setStep('wizard')}
            className="w-full py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Regenerate with different settings
          </button>
        </div>
      </div>
    );
  }

  return null;
}
