import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { StampSVGRenderer } from '@/components/stamp-generator/StampSVGRenderer';
import { StampColorWheel } from '@/components/stamp-generator/StampColorWheel';
import { StampTextEditor } from '@/components/stamp-generator/StampTextEditor';
import { StampPreviewModal } from '@/components/stamp-generator/StampPreviewModal';
import { generateStampConcepts, StampDesignConcept } from '@/lib/stampTemplates';
import {
  Wand2, Loader2, Check, RefreshCw, Download, Stamp,
  ArrowLeft, ChevronRight, AlertTriangle, Heart, MessageSquare,
  Send, X, Sparkles, Palette, Layers, Type
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type ColorStop = 'primary' | 'secondary' | 'accent';

// Full 3-stop palette presets
const PALETTE_PRESETS = [
  { label: 'JBJ Gold',      primary: '#B8860B', secondary: '#2a3a5c', accent: '#856404' },
  { label: 'Royal Navy',    primary: '#1a2744', secondary: '#2a3a5c', accent: '#B8860B' },
  { label: 'Obsidian',      primary: '#0d0d0d', secondary: '#333333', accent: '#B8860B' },
  { label: 'Crimson',       primary: '#8B0000', secondary: '#5a0000', accent: '#B8860B' },
  { label: 'Forest',        primary: '#1B4332', secondary: '#2d6a4f', accent: '#B8860B' },
  { label: 'Deep Purple',   primary: '#4B0082', secondary: '#6a0dad', accent: '#C8A87A' },
  { label: 'Monochrome',    primary: '#0d0d0d', secondary: '#333333', accent: '#ffffff' },
];

// Stamp presets matching the example gallery gold + standard black/white
const PRESET_PALETTE = [
  { label: 'Gold',    hex: '#B8860B' },   // Standard gold (example gallery)
  { label: 'Gold Dark', hex: '#856404' }, // Deep gold
  { label: 'Navy',    hex: '#1a2744' },   // Classic navy
  { label: 'Black',   hex: '#0d0d0d' },   // Standard black
  { label: 'White',   hex: '#ffffff' },   // Standard white
  { label: 'Red',     hex: '#8B0000' },
  { label: 'Purple',  hex: '#4B0082' },
  { label: 'Forest',  hex: '#1B4332' },
  { label: 'Copper',  hex: '#7C4A00' },
  { label: 'Teal',    hex: '#0D5C63' },
];

const STAMP_FONTS = [
  { label: 'Trajan (Elegant)',   value: 'Georgia, "Times New Roman", serif',          preview: 'Aa' },
  { label: 'Garamond (Classic)', value: '"Garamond", "Palatino", serif',              preview: 'Aa' },
  { label: 'Modern Sans',        value: '"Arial", "Helvetica Neue", sans-serif',      preview: 'Aa' },
  { label: 'Futura (Geometric)', value: '"Trebuchet MS", "Century Gothic", sans-serif', preview: 'Aa' },
  { label: 'Courier (Mono)',     value: '"Courier New", "Courier", monospace',        preview: 'Aa' },
  { label: 'Cinzel (Imperial)',  value: '"Palatino Linotype", "Palatino", serif',     preview: 'Aa' },
];

export default function StampGeneratorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [concepts, setConcepts] = useState<StampDesignConcept[]>([]);
  const [favoriteConcepts, setFavoriteConcepts] = useState<StampDesignConcept[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  // Three-color system
  const [primaryColor, setPrimaryColor] = useState('#B8860B');
  const [secondaryColor, setSecondaryColor] = useState<string | undefined>(undefined);
  const [accentColor, setAccentColor] = useState<string | undefined>(undefined);
  const [activeStop, setActiveStop] = useState<ColorStop>('primary');

  // Font family
  const [fontFamily, setFontFamily] = useState<string>(STAMP_FONTS[0].value);

  // Left panel tab
  const [leftTab, setLeftTab] = useState<'color' | 'fonts' | 'text'>('color');

  // Preview modal
  const [previewConcept, setPreviewConcept] = useState<StampDesignConcept | null>(null);

  // AI chat
  const [chatOpen, setChatOpen] = useState(false);
  const [aiPanelMinimized, setAiPanelMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI Designer panel drag
  const [aiPanelPos, setAiPanelPos] = useState({ x: 0, y: 0 });
  const [aiDragging, setAiDragging] = useState(false);
  const [aiDragStart, setAiDragStart] = useState({ mx: 0, my: 0, px: 0, py: 0 });
  const [refinedPreview, setRefinedPreview] = useState<StampDesignConcept | null>(null);

  const [togglingFav, setTogglingFav] = useState<string | null>(null);
  const [svgOverrides, setSvgOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || !projectId) return;
    loadProject();
  }, [user, projectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  async function loadProject() {
    const { data, error } = await supabase
      .from('stamp_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user!.id)
      .single();
    if (error || !data) { toast.error('Project not found'); navigate('/toolkit/stamp-generator'); return; }
    setProject(data);

    const { data: existing } = await supabase
      .from('stamp_designs')
      .select('id, svg_source, template_key, is_favorite')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (existing && existing.length > 0) {
      const toDesign = (d: any): StampDesignConcept => ({
        id: d.id,
        templateKey: d.template_key || 'classic-double',
        label: (d.template_key || 'classic-double').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        tags: [],
        svgSource: d.svg_source || '',
        isFavorite: d.is_favorite,
      });
      const favs = existing.filter((d: any) => d.is_favorite).map(toDesign);
      const regular = existing.filter((d: any) => !d.is_favorite).slice(0, 11).map(toDesign);
      setFavoriteConcepts(favs);
      setConcepts(regular);
    } else {
      generateConcepts(data);
    }
  }

  const generateConcepts = useCallback(async (proj?: any) => {
    const p = proj || project;
    if (!p) return;
    setGenerating(true);
    setBlocked(false);
    setSvgOverrides({});

    try {
      if (session?.access_token) {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-stamp-generator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'generate', project: p, projectId }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.blocked) { setBlocked(true); setGenerating(false); return; }
          if (json.concepts?.length) {
            const { data: saved } = await supabase
              .from('stamp_designs')
              .select('id, svg_source, template_key, is_favorite')
              .eq('project_id', projectId)
              .eq('is_favorite', false)
              .order('created_at', { ascending: false })
              .limit(11);
            if (saved && saved.length > 0) {
              setConcepts(saved.map((d: any) => ({
                id: d.id,
                templateKey: d.template_key || 'classic-double',
                label: (d.template_key || 'classic-double').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                tags: [],
                svgSource: d.svg_source || '',
                isFavorite: false,
              })));
              setGenerating(false);
              return;
            }
          }
        }
      }
    } catch (_) {}

    const clientConcepts = generateStampConcepts(p);
    if (clientConcepts[0]?.templateKey === 'blocked') { setBlocked(true); setGenerating(false); return; }
    setConcepts(clientConcepts);
    setGenerating(false);
  }, [project, session, projectId]);

  async function toggleFavorite(concept: StampDesignConcept) {
    setTogglingFav(concept.id);
    const newFav = !concept.isFavorite;
    const isDbId = concept.id.length === 36;
    let dbId = isDbId ? concept.id : null;

    if (!isDbId) {
      const { data } = await supabase.from('stamp_designs').insert({
        project_id: projectId, user_id: user!.id,
        design_version: 1, template_key: concept.templateKey,
        svg_source: svgOverrides[concept.id] || concept.svgSource,
        style_snapshot_json: project, is_favorite: true,
      }).select('id').single();
      if (data) dbId = data.id;
    } else {
      await supabase.from('stamp_designs').update({ is_favorite: newFav }).eq('id', concept.id);
    }

    if (dbId) {
      const updated = { ...concept, id: dbId, isFavorite: newFav };
      if (newFav) {
        setFavoriteConcepts(prev => [updated, ...prev.filter(f => f.id !== dbId)]);
        setConcepts(prev => prev.map(c => c.id === concept.id ? { ...c, id: dbId!, isFavorite: true } : c));
        toast.success('Added to favorites ♥');
      } else {
        setFavoriteConcepts(prev => prev.filter(f => f.id !== dbId));
        setConcepts(prev => prev.map(c => c.id === dbId ? { ...c, isFavorite: false } : c));
        toast('Removed from favorites');
      }
    }
    setTogglingFav(null);
  }

  // Opens preview modal instead of immediately saving
  function handleSelectConcept(concept: StampDesignConcept) {
    setSelectedId(concept.id);
    setPreviewConcept(concept);
  }

  async function confirmSelectAndExport(concept: StampDesignConcept) {
    setPreviewConcept(null);
    const svgToSave = svgOverrides[concept.id] || concept.svgSource;
    const isDbId = concept.id.length === 36;
    let designId: string = concept.id;

    if (isDbId) {
      setSavedDesignId(concept.id);
      if (svgOverrides[concept.id]) {
        await supabase.from('stamp_designs').update({ svg_source: svgToSave }).eq('id', concept.id);
      }
      await supabase.from('stamp_projects').update({ selected_design_id: concept.id, approval_status: 'FINAL_SELECTED' }).eq('id', projectId);
    } else {
      const { data } = await supabase.from('stamp_designs').insert({
        project_id: projectId, user_id: user!.id, design_version: 1,
        template_key: concept.templateKey, svg_source: svgToSave, style_snapshot_json: project,
      }).select('id').single();
      if (data) {
        designId = data.id;
        setSavedDesignId(data.id);
        await supabase.from('stamp_projects').update({ selected_design_id: data.id, approval_status: 'FINAL_SELECTED' }).eq('id', projectId);
      }
    }
    toast.success('Design selected!');
    navigate(`/toolkit/stamp-generator/${projectId}/export/${designId}`);
  }

  async function sendChatMessage(overrideInput?: string) {
    const msg = overrideInput ?? chatInput;
    if (!msg.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: msg };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    setRefinedPreview(null);

    const conceptToRefine = concepts.find(c => c.id === selectedId) || concepts[0];
    const svgForRefine = (conceptToRefine && svgOverrides[conceptToRefine.id]) || conceptToRefine?.svgSource || '';

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-stamp-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ action: 'refine', project, projectId, instruction: msg, currentSvg: svgForRefine }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.svgSource) {
          const newConcept: StampDesignConcept = {
            id: json.id || crypto.randomUUID(),
            templateKey: 'ai-refined',
            label: 'AI Refined Design',
            tags: ['ai', 'refined', 'custom'],
            svgSource: json.svgSource,
          };
          setRefinedPreview(newConcept);
          setChatMessages(prev => [...prev, { role: 'assistant', content: `Preview ready — choose to Replace or Save as New below.` }]);
        } else {
          setChatMessages(prev => [...prev, { role: 'assistant', content: json.message || "Applied your changes." }]);
        }
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: "Had trouble applying that. Try describing differently." }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Connection error. Please try again." }]);
    }
    setChatLoading(false);
  }

  function applyRefinement(mode: 'replace' | 'new') {
    if (!refinedPreview) return;
    if (mode === 'replace' && selectedId) {
      setSvgOverrides(prev => ({ ...prev, [selectedId]: refinedPreview.svgSource }));
      setRefinedPreview(null);
      toast.success('Design replaced!');
    } else {
      setConcepts(prev => [refinedPreview, ...prev]);
      setRefinedPreview(null);
      toast.success('New concept added!');
    }
  }

  // AI panel drag handlers
  function onAiPanelDragStart(e: React.MouseEvent) {
    e.preventDefault();
    setAiDragging(true);
    setAiDragStart({ mx: e.clientX, my: e.clientY, px: aiPanelPos.x, py: aiPanelPos.y });
  }

  useEffect(() => {
    if (!aiDragging) return;
    function onMove(e: MouseEvent) {
      setAiPanelPos({ x: aiDragStart.px + (e.clientX - aiDragStart.mx), y: aiDragStart.py + (e.clientY - aiDragStart.my) });
    }
    function onUp() { setAiDragging(false); }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [aiDragging, aiDragStart]);

  // Active color for the wheel
  const activeColor = activeStop === 'primary' ? primaryColor : activeStop === 'secondary' ? (secondaryColor || '#2a3a5c') : (accentColor || '#B8860B');
  function setActiveColor(hex: string) {
    if (activeStop === 'primary') setPrimaryColor(hex);
    else if (activeStop === 'secondary') setSecondaryColor(hex);
    else setAccentColor(hex);
  }

  const allConcepts = [...favoriteConcepts, ...concepts.filter(c => !favoriteConcepts.some(f => f.id === c.id))];
  const selectedConcept = allConcepts.find(c => c.id === selectedId);
  const selectedSvg = selectedConcept ? (svgOverrides[selectedConcept.id] || selectedConcept.svgSource) : null;

  function handleSvgTextChange(conceptId: string, newSvg: string) {
    setSvgOverrides(prev => ({ ...prev, [conceptId]: newSvg }));
  }

  const stopDefs: { key: ColorStop; label: string; color: string }[] = [
    { key: 'primary',   label: 'Primary',   color: primaryColor },
    { key: 'secondary', label: 'Secondary', color: secondaryColor || '#2a3a5c' },
    { key: 'accent',    label: 'Accent',    color: accentColor || '#B8860B' },
  ];

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[hsl(var(--gold))]" size={32}/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]">

      {/* Preview Modal */}
      {previewConcept && (
        <StampPreviewModal
          concept={previewConcept}
          project={project}
          tintColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
          svgOverride={svgOverrides[previewConcept.id]}
          onBack={() => setPreviewConcept(null)}
          onSelectAndExport={() => confirmSelectAndExport(previewConcept)}
        />
      )}

      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm sticky top-24 sm:top-28 lg:top-32 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/toolkit/stamp-generator/projects')} className="gap-1">
              <ArrowLeft size={14}/> Projects
            </Button>
            <div className="w-px h-5 bg-[hsl(var(--border))]"/>
            <div className="flex items-center gap-2">
              <Stamp size={16} className="text-[hsl(var(--gold))]"/>
              <span className="font-medium text-sm text-[hsl(var(--foreground))]">{project.company_name}</span>
              {project.language_mode !== 'EN' && (
                <Badge variant="secondary" className="text-[10px]">{project.language_mode}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setChatOpen(v => !v)} className="gap-1 text-xs">
              <MessageSquare size={12}/> AI Designer
            </Button>
            <Button variant="outline" size="sm" onClick={() => generateConcepts()} disabled={generating} className="gap-1 text-xs">
              <RefreshCw size={12} className={generating ? 'animate-spin' : ''}/>
              {generating ? 'Generating…' : 'Regenerate'}
            </Button>
            {selectedId && (
              <Button size="sm" className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1 text-xs"
                onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/export/${savedDesignId || selectedId}`)}>
                <Download size={12}/> Export Pack <ChevronRight size={12}/>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">

          {/* ── Left Panel ─────────────────────────────────────────────── */}
          <div className="hidden lg:flex flex-col gap-4 w-60 flex-shrink-0">
            {/* Tab switcher */}
            <div className="flex bg-[hsl(var(--muted))] rounded-xl p-1 gap-1">
              <button onClick={() => setLeftTab('color')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${leftTab === 'color' ? 'bg-white shadow-sm text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                <Palette size={10}/> Colors
              </button>
              <button onClick={() => setLeftTab('fonts')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${leftTab === 'fonts' ? 'bg-white shadow-sm text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                <Layers size={10}/> Fonts
              </button>
              <button onClick={() => setLeftTab('text')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${leftTab === 'text' ? 'bg-white shadow-sm text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                <Type size={10}/> Text
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-4 space-y-4">

              {/* ── Colors tab ── */}
              {leftTab === 'color' && (
                <>
                  {/* 3-stop selector */}
                  <div className="flex gap-1.5">
                    {stopDefs.map(s => (
                      <button key={s.key} onClick={() => setActiveStop(s.key)}
                        title={s.label}
                        className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${activeStop === s.key ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'}`}>
                        <div className="w-6 h-6 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: s.color }}/>
                        <span className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] leading-none">{s.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Color wheel */}
                  <StampColorWheel
                    color={activeColor}
                    onChange={setActiveColor}
                    label={stopDefs.find(s => s.key === activeStop)?.label + ' Color'}
                    size={148}
                  />

                  {/* Standard quick-picks row */}
                  <div className="pt-2 border-t border-[hsl(var(--border))]">
                    <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Standard Colors</p>
                    {/* Gold versions */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] text-[hsl(var(--muted-foreground))] font-medium">Gold</p>
                      <div className="flex gap-1.5">
                        {[{ label: 'Gold', hex: '#B8860B' }, { label: 'Deep Gold', hex: '#856404' }, { label: 'Rose Gold', hex: '#b87057' }].map(c => (
                          <button key={c.hex} onClick={() => setActiveColor(c.hex)} title={c.label}
                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${activeColor === c.hex ? 'border-[hsl(var(--gold))] scale-110 shadow-lg' : 'border-white/60 shadow-sm'}`}
                            style={{ backgroundColor: c.hex }}/>
                        ))}
                      </div>
                      <p className="text-[9px] text-[hsl(var(--muted-foreground))] font-medium mt-2">Black / White</p>
                      <div className="flex gap-1.5">
                        {[{ label: 'Black', hex: '#0d0d0d' }, { label: 'Charcoal', hex: '#333333' }, { label: 'White', hex: '#ffffff' }].map(c => (
                          <button key={c.hex} onClick={() => setActiveColor(c.hex)} title={c.label}
                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${activeColor === c.hex ? 'border-[hsl(var(--gold))] scale-110 shadow-lg' : c.hex === '#ffffff' ? 'border-[hsl(var(--border))]' : 'border-white/60 shadow-sm'}`}
                            style={{ backgroundColor: c.hex }}/>
                        ))}
                      </div>
                      <p className="text-[9px] text-[hsl(var(--muted-foreground))] font-medium mt-2">More Presets</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_PALETTE.filter(c => !['#B8860B','#856404','#0d0d0d','#ffffff'].includes(c.hex)).map(c => (
                          <button key={c.hex} onClick={() => setActiveColor(c.hex)} title={c.label}
                            className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${activeColor === c.hex ? 'border-[hsl(var(--gold))] scale-110 shadow-md' : 'border-white shadow-sm'}`}
                            style={{ backgroundColor: c.hex }}/>
                        ))}
                      </div>
                    </div>
                    <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-2">Active: {stopDefs.find(s => s.key === activeStop)?.label}</p>
                  </div>

                  {/* Palette Presets — apply all 3 stops at once */}
                  <div className="pt-2 border-t border-[hsl(var(--border))]">
                    <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Palette Presets</p>
                    <div className="space-y-1.5">
                      {PALETTE_PRESETS.map(p => (
                        <button
                          key={p.label}
                          onClick={() => { setPrimaryColor(p.primary); setSecondaryColor(p.secondary); setAccentColor(p.accent); }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] hover:bg-[hsl(var(--gold)/0.03)] transition-all"
                        >
                          <div className="flex gap-0.5 flex-shrink-0">
                            <div className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: p.primary }}/>
                            <div className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: p.secondary }}/>
                            <div className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: p.accent }}/>
                          </div>
                          <span className="text-[10px] font-medium text-[hsl(var(--foreground))]">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear buttons */}
                  <div className="flex gap-1.5 flex-wrap">
                    {secondaryColor && (
                      <button onClick={() => setSecondaryColor(undefined)} className="text-[10px] px-2 py-1 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)] transition-all">
                        Clear Secondary
                      </button>
                    )}
                    {accentColor && (
                      <button onClick={() => setAccentColor(undefined)} className="text-[10px] px-2 py-1 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)] transition-all">
                        Clear Accent
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* ── Fonts tab ── */}
              {leftTab === 'fonts' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Typography</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Choose the font style applied to your stamp text.</p>
                  <div className="space-y-2">
                    {STAMP_FONTS.map(f => (
                      <button key={f.value} onClick={() => setFontFamily(f.value)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${fontFamily === f.value ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-[hsl(var(--foreground))]">{f.label.split(' (')[0]}</p>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{f.label.match(/\(([^)]+)\)/)?.[1] || ''}</p>
                          </div>
                          <span className="text-base font-bold text-[hsl(var(--foreground))] opacity-60" style={{ fontFamily: f.value }}>Aa</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Text tab ── */}
              {leftTab === 'text' && (
                <>
                  {selectedSvg && selectedConcept ? (
                    <StampTextEditor
                      svgSource={selectedSvg}
                      onSvgChange={(newSvg) => handleSvgTextChange(selectedConcept.id, newSvg)}
                    />
                  ) : (
                    <div className="text-center py-6 space-y-2">
                      <Type size={24} className="text-[hsl(var(--muted-foreground))] mx-auto"/>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Select a stamp design to edit its text elements</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Live preview of selected */}
            {selectedSvg && (
              <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-4 space-y-2">
                <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Selected Preview</p>
                <div className="flex items-center justify-center py-2">
                  <StampSVGRenderer svgSource={selectedSvg} tintColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} size={140}/>
                </div>
              </div>
            )}
          </div>

          {/* ── Main Content ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Mobile color picker */}
            <div className="lg:hidden bg-white rounded-2xl border border-[hsl(var(--border))] p-4">
              <div className="flex items-center gap-3 mb-3">
                {stopDefs.map(s => (
                  <button key={s.key} onClick={() => setActiveStop(s.key)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 flex-1 transition-all ${activeStop === s.key ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))]'}`}>
                    <div className="w-6 h-6 rounded-full border border-white shadow" style={{ backgroundColor: s.color }}/>
                    <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{s.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <StampColorWheel color={activeColor} onChange={setActiveColor} size={80} label=""/>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_PALETTE.map(c => (
                    <button key={c.hex} onClick={() => setActiveColor(c.hex)} title={c.label}
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-all"
                      style={{ backgroundColor: c.hex }}/>
                  ))}
                </div>
              </div>
            </div>

            {/* Blocked warning */}
            {blocked && (
              <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
                <AlertTriangle size={18}/>
                <div>
                  <p className="font-semibold text-sm">Generation Blocked</p>
                  <p className="text-xs">Official government or authority seals cannot be generated.</p>
                </div>
              </div>
            )}

            {/* Favorites */}
            {favoriteConcepts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Heart size={14} className="text-rose-500 fill-rose-500"/>
                  <h2 className="font-semibold text-[hsl(var(--foreground))] text-sm">Saved Favorites ({favoriteConcepts.length})</h2>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">— preserved across regenerations</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {favoriteConcepts.map(c => (
                    <ConceptCard key={c.id} concept={c} svgOverride={svgOverrides[c.id]}
                      selectedId={selectedId} tintColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily}
                      togglingFav={togglingFav} onSelect={handleSelectConcept} onToggleFav={toggleFavorite}/>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {generating && (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7,8,9,10,11].map(i => (
                  <div key={i} className="h-72 rounded-2xl bg-[hsl(var(--muted))] animate-pulse"/>
                ))}
              </div>
            )}

            {/* Concepts grid */}
            {!generating && !blocked && concepts.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[hsl(var(--foreground))]">
                    {concepts.length} Stamp Concepts
                    <span className="ml-2 text-xs font-normal text-[hsl(var(--muted-foreground))]">— click to preview, then export</span>
                  </h2>
                  {selectedId && <Badge className="bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]"><Check size={10} className="mr-1"/>Design Selected</Badge>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {concepts.map(concept => (
                    <ConceptCard key={concept.id} concept={concept} svgOverride={svgOverrides[concept.id]}
                      selectedId={selectedId} tintColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily}
                      togglingFav={togglingFav} onSelect={handleSelectConcept} onToggleFav={toggleFavorite}/>
                  ))}
                </div>
              </>
            )}

            {/* Empty state */}
            {!generating && !blocked && concepts.length === 0 && favoriteConcepts.length === 0 && (
              <div className="text-center py-20 space-y-4">
                <Wand2 size={40} className="text-[hsl(var(--gold))] mx-auto"/>
                <p className="text-[hsl(var(--muted-foreground))]">Click "Regenerate" to create stamp concepts</p>
                <Button onClick={() => generateConcepts()} className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white">
                  <Wand2 size={14} className="mr-2"/> Generate Concepts
                </Button>
              </div>
            )}

            {/* Export CTA */}
            {selectedId && !generating && (
              <div className="bg-gradient-to-r from-[hsl(var(--gold)/0.08)] to-[hsl(var(--champagne-1))] rounded-2xl border border-[hsl(var(--gold)/0.2)] p-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">Design selected — ready to export!</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">Download SVG, PNG, JPG, PDF + full brand pack</p>
                </div>
                <Button className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2"
                  onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/export/${savedDesignId || selectedId}`)}>
                  <Download size={15}/> Export Pack
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Designer Floating Panel */}
      {chatOpen && (
        <div
          className="fixed z-[9000] flex flex-col bg-white rounded-2xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden"
          style={{
            width: 360,
            maxHeight: aiPanelMinimized ? 'auto' : 'calc(100vh - 80px)',
            top: 72,
            right: 16,
            transform: `translate(${aiPanelPos.x}px, ${aiPanelPos.y}px)`,
          }}
        >
          {/* Header — draggable */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] cursor-grab active:cursor-grabbing select-none flex-shrink-0"
            onMouseDown={onAiPanelDragStart}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-white"/>
              <span className="font-bold text-sm text-white">AI Stamp Designer</span>
              <span className="text-white/60 text-[10px]">drag to move</span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Minimize button */}
              <button
                onClick={() => setAiPanelMinimized(v => !v)}
                title={aiPanelMinimized ? 'Expand' : 'Minimize'}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0"
              >
                <span className="text-white font-bold text-xs leading-none">{aiPanelMinimized ? '▲' : '▬'}</span>
              </button>
              {/* Close button */}
              <button
                onClick={() => setChatOpen(false)}
                title="Close"
                className="w-7 h-7 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors flex-shrink-0"
              >
                <X size={14} className="text-[hsl(var(--gold-dark))]"/>
              </button>
            </div>
          </div>

          {/* Collapsed body when minimized */}
          {!aiPanelMinimized && (
            <>
              {/* Persistent quick suggestions — always visible above messages */}
              <div className="px-4 py-3 border-b border-[hsl(var(--border))] flex-shrink-0 bg-[hsl(var(--pearl-1))]">
                <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">Quick Suggestions</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Make borders thicker & add star dividers', 'Switch to minimalist style', 'Add decorative inner ring', 'Make text larger and bolder'].map(eg => (
                    <button
                      key={eg}
                      onClick={() => sendChatMessage(eg)}
                      className="text-left text-[10px] p-2 bg-white rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)] hover:bg-[hsl(var(--gold)/0.05)] text-[hsl(var(--foreground))] transition-colors leading-tight"
                    >
                      {eg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0" style={{ maxHeight: 220 }}>
                {chatMessages.length === 0 && (
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] text-center py-4">Type a refinement instruction or click a suggestion above.</p>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${msg.role === 'user' ? 'bg-[hsl(var(--gold))] text-white' : 'bg-[hsl(var(--pearl-1))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[hsl(var(--pearl-1))] border border-[hsl(var(--border))] px-3 py-2 rounded-xl text-xs text-[hsl(var(--muted-foreground))]">
                      <Loader2 size={12} className="animate-spin inline mr-1"/>Designing…
                    </div>
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>

              {/* Refined preview + actions */}
              {refinedPreview && (
                <div className="flex-shrink-0 border-t border-[hsl(var(--border))] px-4 py-3 space-y-3 bg-[hsl(var(--pearl-1))]">
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Refined preview:</p>
                  <div className="flex items-center justify-center bg-white rounded-xl border border-[hsl(var(--border))] py-3">
                    <StampSVGRenderer
                      svgSource={refinedPreview.svgSource}
                      tintColor={primaryColor}
                      secondaryColor={secondaryColor}
                      accentColor={accentColor}
                      fontFamily={fontFamily}
                      size={130}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs bg-[hsl(var(--gold))] text-white hover:bg-[hsl(var(--gold-dark))]"
                      onClick={() => applyRefinement('replace')}
                      disabled={!selectedId}
                      title={!selectedId ? 'Click a stamp design first to enable Replace' : 'Replace selected stamp with this design'}
                    >
                      Replace Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.05)]"
                      onClick={() => applyRefinement('new')}
                    >
                      Save as New
                    </Button>
                  </div>
                  {!selectedId && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle size={12} className="text-amber-600 flex-shrink-0"/>
                      <p className="text-[10px] text-amber-700">Click a stamp design first, then use "Replace Selected"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Input */}
              <div className="flex-shrink-0 px-4 py-3 border-t border-[hsl(var(--border))] bg-white">
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                    placeholder="Describe your changes…"
                    className="flex-1 h-9 px-3 text-xs border-2 border-[hsl(var(--border))] rounded-xl focus:outline-none focus:border-[hsl(var(--gold))] bg-white text-[hsl(var(--foreground))]"
                  />
                  <Button
                    size="sm"
                    className="h-9 px-3 bg-[hsl(var(--gold))] text-white hover:bg-[hsl(var(--gold-dark))]"
                    onClick={() => sendChatMessage()}
                    disabled={chatLoading}
                  >
                    <Send size={12}/>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Concept Card ─────────────────────────────────────────────────────────────
function ConceptCard({
  concept, svgOverride, selectedId, tintColor, secondaryColor, accentColor, fontFamily, togglingFav, onSelect, onToggleFav
}: {
  concept: StampDesignConcept;
  svgOverride?: string;
  selectedId: string | null;
  tintColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  togglingFav: string | null;
  onSelect: (c: StampDesignConcept) => void;
  onToggleFav: (c: StampDesignConcept) => void;
}) {
  const isSelected = selectedId === concept.id;
  const isFav = concept.isFavorite;
  const displaySvg = svgOverride || concept.svgSource;

  return (
    <div className={`group bg-white rounded-2xl border-2 transition-all shadow-sm hover:shadow-md ${isSelected ? 'border-[hsl(var(--gold))] shadow-[0_0_0_3px_hsl(var(--gold)/0.15)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'}`}>
      <div className="relative p-4 flex items-center justify-center bg-[hsl(var(--pearl-1))] rounded-t-2xl min-h-[180px]">
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center z-10">
            <Check size={12} className="text-white"/>
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); onToggleFav(concept); }} disabled={togglingFav === concept.id}
          className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all ${isFav ? 'bg-rose-50 border border-rose-200 text-rose-500' : 'bg-white/80 border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100'}`}>
          {togglingFav === concept.id ? <Loader2 size={11} className="animate-spin"/> : <Heart size={11} className={isFav ? 'fill-rose-500' : ''}/>}
        </button>
        {svgOverride && (
          <div className="absolute bottom-2 left-2 z-10">
            <Badge className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border border-amber-200">edited</Badge>
          </div>
        )}
        <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} size={160}/>
      </div>
      <div className="p-3 space-y-2">
        <p className="font-medium text-sm text-[hsl(var(--foreground))] truncate">{concept.label}</p>
        <div className="flex flex-wrap gap-1">
          {concept.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
          ))}
          {isFav && <Badge className="text-[10px] px-1.5 py-0 bg-rose-50 text-rose-600 border border-rose-200">♥ Saved</Badge>}
        </div>
        <Button size="sm"
          className={`w-full h-7 text-xs gap-1 ${isSelected ? 'bg-[hsl(var(--gold))] text-white' : 'bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90'}`}
          onClick={() => onSelect(concept)}>
          {isSelected ? <><Check size={10}/> View Preview</> : 'Select This Design'}
        </Button>
      </div>
    </div>
  );
}
