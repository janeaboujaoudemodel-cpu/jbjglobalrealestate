import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  FolderOpen, Loader2, Wand2, Search, RefreshCw,
  Building2, MapPin, DollarSign, Bed, ChevronDown, X, Check,
  Film, Music, Type
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

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

interface ProjectIntegrationPanelProps {
  onCreateVideoAd?: (clips: VideoAdClip[], projectName: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (from: number | null, to: number | null): string => {
  if (!from) return 'Price on request';
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `AED ${(n / 1_000_000).toFixed(1)}M`
      : `AED ${Math.round(n / 1000)}K`;
  return to ? `${fmt(from)} – ${fmt(to)}` : `From ${fmt(from)}`;
};

const formatBeds = (min: number | null, max: number | null): string => {
  if (min === 0 && max === 0) return 'Studio';
  if (min === null) return '';
  if (max && max !== min) return `${min === 0 ? 'Studio' : min}–${max} BR`;
  return min === 0 ? 'Studio' : `${min} BR`;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectIntegrationPanel({ onCreateVideoAd }: ProjectIntegrationPanelProps) {
  const [projects, setProjects] = useState<RealEstateProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [selectedEmirate, setSelectedEmirate] = useState<string>('All');
  const [showFilter, setShowFilter] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const emirates = ['All', 'Dubai', 'Abu Dhabi Emirate', 'Sharjah', 'Ras Al Khaimah'];

  // ── Load projects ────────────────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('projects')
        .select('id, name, emirate, location, cover_image_url, price_from, price_to, bedrooms_min, bedrooms_max, property_type_label, is_featured')
        .eq('is_published' as never, true)
        .not('cover_image_url', 'is', null)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      const { data, error } = await q;
      if (!error && data) setProjects(data as RealEstateProject[]);
    } catch {
      // not signed in, show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.emirate || '').toLowerCase().includes(search.toLowerCase());
    const matchEmirate = selectedEmirate === 'All' || p.emirate === selectedEmirate;
    return matchSearch && matchEmirate;
  });

  // ── Create Video Ad ──────────────────────────────────────────────────────────
  const handleCreateVideoAd = async (proj: RealEstateProject) => {
    setGenerating(proj.id);
    setGeneratedId(null);

    try {
      // 1. Fetch gallery images for this project
      const { data: imgData } = await supabase
        .from('project_images')
        .select('image_url, display_order')
        .eq('project_id', proj.id)
        .order('display_order', { ascending: true })
        .limit(6);

      const galleryImages: ProjectImage[] = imgData || [];

      // 2. Build photo clips (cover + up to 5 gallery shots, 4s each)
      const allImageUrls: string[] = [];
      if (proj.cover_image_url) allImageUrls.push(proj.cover_image_url);
      galleryImages.forEach(g => {
        if (!allImageUrls.includes(g.image_url)) allImageUrls.push(g.image_url);
      });
      const photoClips = allImageUrls.slice(0, 5).map((url, i) => ({
        name: `${proj.name} — Photo ${i + 1}`,
        url,
        type: 'image' as const,
        duration: 4,
      }));

      // 3. Build lower-third text overlay clip (3s at the start)
      const priceText = formatPrice(proj.price_from, proj.price_to);
      const bedsText  = formatBeds(proj.bedrooms_min, proj.bedrooms_max);
      const lowerThirdText = [
        proj.name,
        [bedsText, proj.property_type_label].filter(Boolean).join(' · '),
        priceText,
        proj.emirate,
      ].filter(Boolean).join('\n');

      const textClip: VideoAdClip = {
        name: `${proj.name} — Lower Third`,
        url: `text-overlay://${encodeURIComponent(lowerThirdText)}`,
        type: 'text',
        duration: 5,
        textOverlay: {
          content: lowerThirdText,
          style: 'lower-third',
        },
      };

      // 4. Music clip placeholder (30s background)
      const musicClip: VideoAdClip = {
        name: '🎵 Property Ad Music',
        url: 'music://luxury-property-ad',
        type: 'image', // treated as audio in parent
        duration: 30,
      };

      const allClips: VideoAdClip[] = [...photoClips, textClip, musicClip];

      if (photoClips.length === 0) {
        toast.error('No photos found for this project');
        return;
      }

      // 5. Emit to parent
      onCreateVideoAd?.(allClips, proj.name);
      setGeneratedId(proj.id);
      toast.success(`🎬 "${proj.name}" video ad assembled! ${photoClips.length} photos + lower third added.`);
    } catch (err) {
      toast.error('Failed to create video ad');
      console.error(err);
    } finally {
      setGenerating(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden">

      {/* ── Header ── */}
      <div className="px-3 py-2.5 border-b border-slate-700 flex items-center gap-2">
        <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex-1">
          Real Estate Projects
        </span>
        <button onClick={loadProjects} className="text-slate-500 hover:text-slate-300 transition-colors" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Search + Filter ── */}
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

      {/* ── Project Grid ── */}
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
              {filtered.map(proj => {
                const isGenerating = generating === proj.id;
                const isDone = generatedId === proj.id;
                const isExpanded = expandedId === proj.id;

                return (
                  <div
                    key={proj.id}
                    className={`bg-slate-800 border rounded-lg overflow-hidden transition-all group ${
                      isDone
                        ? 'border-amber-400/70 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                        : 'border-slate-700 hover:border-amber-400/40'
                    }`}
                  >
                    {/* Thumbnail */}
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

                      {/* Featured badge */}
                      {proj.is_featured && (
                        <div className="absolute top-1 left-1 bg-amber-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                          ⭐ Featured
                        </div>
                      )}

                      {/* Done overlay */}
                      {isDone && (
                        <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                          <div className="bg-black/70 rounded-full p-1.5">
                            <Check className="w-4 h-4 text-amber-400" />
                          </div>
                        </div>
                      )}

                      {/* Hover overlay with CTA */}
                      {!isDone && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                          <button
                            onClick={() => handleCreateVideoAd(proj)}
                            disabled={!!generating}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all disabled:opacity-50 animate-scale-in"
                          >
                            {isGenerating
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Wand2 className="w-3 h-3" />
                            }
                            {isGenerating ? 'Building…' : 'Create Ad'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Info */}
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

                      {/* Expand: show what will be added */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : proj.id)}
                        className="mt-1.5 text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-0.5 transition-colors"
                      >
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        {isExpanded ? 'Hide' : 'What gets added?'}
                      </button>

                      {isExpanded && (
                        <div className="mt-1.5 space-y-1 animate-fade-in">
                          {[
                            { icon: Film, label: 'Up to 5 project photos (4s each)' },
                            { icon: Type, label: 'Lower-third: name, price, location' },
                            { icon: Music, label: 'Property Ad background music' },
                          ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-start gap-1.5 text-[10px] text-slate-400">
                              <Icon className="w-3 h-3 text-amber-400/70 mt-0.5 shrink-0" />
                              <span>{label}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Re-add if already done */}
                      {isDone && (
                        <button
                          onClick={() => handleCreateVideoAd(proj)}
                          disabled={!!generating}
                          className="mt-1.5 w-full flex items-center justify-center gap-1 py-1 rounded text-[10px] font-semibold border border-amber-400/50 text-amber-300 hover:bg-amber-400/10 transition-all"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          Re-add to timeline
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ── Footer: result count ── */}
      <div className="px-3 py-1.5 border-t border-slate-700 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">
          {loading ? 'Loading…' : `${filtered.length} of ${projects.length} projects`}
        </span>
        {selectedEmirate !== 'All' && (
          <button
            onClick={() => setSelectedEmirate('All')}
            className="text-[10px] text-amber-400/70 hover:text-amber-400 flex items-center gap-1"
          >
            <X className="w-2.5 h-2.5" /> Clear filter
          </button>
        )}
      </div>
    </div>
  );
}
