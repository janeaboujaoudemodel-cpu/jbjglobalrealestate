import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { StampSVGRenderer } from '@/components/stamp-generator/StampSVGRenderer';
import { generateStampConcepts, StampDesignConcept } from '@/lib/stampTemplates';
import {
  Wand2, Loader2, Check, RefreshCw, Download, Stamp,
  ArrowLeft, ChevronRight, AlertTriangle, Heart, MessageSquare,
  Send, X, Sparkles, Palette
} from 'lucide-react';

// ─── Premium Color Palette ────────────────────────────────────────────────────
const PRESET_COLORS = [
  { label: 'Deep Navy', value: '#1a2744' },
  { label: 'Black', value: '#0d0d0d' },
  { label: 'Dark Red', value: '#8B0000' },
  { label: 'Forest Green', value: '#1B4332' },
  { label: 'Royal Purple', value: '#4B0082' },
  { label: 'Midnight Blue', value: '#003366' },
  { label: 'Gold', value: '#856404' },
  { label: 'Dark Brown', value: '#3d1f00' },
  { label: 'Teal', value: '#004D4D' },
  { label: 'Burgundy', value: '#6D0026' },
];

const SECONDARY_COLORS = [
  { label: 'Gold', value: '#B8860B' },
  { label: 'Silver', value: '#708090' },
  { label: 'Copper', value: '#7C4A00' },
  { label: 'Rose Gold', value: '#8B5A5A' },
  { label: 'Off-White', value: '#F5F5DC' },
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

  // Color picker state
  const [primaryColor, setPrimaryColor] = useState('#1a2744');
  const [secondaryColor, setSecondaryColor] = useState<string | undefined>(undefined);
  const [dualColorMode, setDualColorMode] = useState(false);
  const [customHex, setCustomHex] = useState('');
  const [showColorPanel, setShowColorPanel] = useState(false);

  // AI chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Favorite toggling per concept
  const [togglingFav, setTogglingFav] = useState<string | null>(null);

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

    // Load existing designs (favorites + regular)
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
      const regular = existing.filter((d: any) => !d.is_favorite).slice(0, 8).map(toDesign);
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
            // Reload from DB (preserves favorites)
            const { data: saved } = await supabase
              .from('stamp_designs')
              .select('id, svg_source, template_key, is_favorite')
              .eq('project_id', projectId)
              .eq('is_favorite', false)
              .order('created_at', { ascending: false })
              .limit(8);
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

    // Client-side fallback
    const clientConcepts = generateStampConcepts(p);
    if (clientConcepts[0]?.templateKey === 'blocked') { setBlocked(true); setGenerating(false); return; }
    setConcepts(clientConcepts);
    setGenerating(false);
  }, [project, session, projectId]);

  async function toggleFavorite(concept: StampDesignConcept) {
    setTogglingFav(concept.id);
    const newFav = !concept.isFavorite;

    // If it's a client-side concept (not in DB yet), save first
    const isDbId = concept.id.length === 36;
    let dbId = isDbId ? concept.id : null;

    if (!isDbId) {
      const { data } = await supabase.from('stamp_designs').insert({
        project_id: projectId, user_id: user!.id,
        design_version: 1, template_key: concept.templateKey,
        svg_source: concept.svgSource, style_snapshot_json: project,
        is_favorite: true,
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

  async function selectDesign(concept: StampDesignConcept) {
    setSelectedId(concept.id);
    const isDbId = concept.id.length === 36;
    if (isDbId) {
      setSavedDesignId(concept.id);
      await supabase.from('stamp_projects').update({ selected_design_id: concept.id, approval_status: 'FINAL_SELECTED' }).eq('id', projectId);
    } else {
      const { data } = await supabase.from('stamp_designs').insert({
        project_id: projectId, user_id: user!.id, design_version: 1,
        template_key: concept.templateKey, svg_source: concept.svgSource, style_snapshot_json: project,
      }).select('id').single();
      if (data) {
        setSavedDesignId(data.id);
        await supabase.from('stamp_projects').update({ selected_design_id: data.id, approval_status: 'FINAL_SELECTED' }).eq('id', projectId);
      }
    }
    toast.success('Design selected!');
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    // Find selected/first concept SVG to refine
    const conceptToRefine = concepts.find(c => c.id === selectedId) || concepts[0];

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-stamp-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          action: 'refine',
          project,
          projectId,
          instruction: chatInput,
          currentSvg: conceptToRefine?.svgSource || '',
        }),
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
          setConcepts(prev => [newConcept, ...prev]);
          setChatMessages(prev => [...prev, { role: 'assistant', content: `✅ Done! I've generated a refined design based on your request: "${chatInput}". You'll see it as the first card in the gallery.` }]);
        } else {
          setChatMessages(prev => [...prev, { role: 'assistant', content: json.message || "I've applied your changes. The updated design is in the gallery." }]);
        }
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: "I had trouble applying that change. Please try regenerating or describe your request differently." }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Connection error. Please try again." }]);
    }
    setChatLoading(false);
  }

  function applyCustomHex() {
    const clean = customHex.replace(/[^0-9a-fA-F]/g, '');
    if (clean.length === 6) {
      setPrimaryColor(`#${clean}`);
      setCustomHex('');
    } else {
      toast.error('Enter a valid 6-digit hex color (e.g. 1a2744)');
    }
  }

  const tintColor = primaryColor;
  const secColor = dualColorMode ? secondaryColor : undefined;

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[hsl(var(--gold))]" size={32}/>
      </div>
    );
  }

  // Combine favorites + regular for display
  const allConcepts = [...favoriteConcepts, ...concepts.filter(c => !favoriteConcepts.some(f => f.id === c.id))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/toolkit/stamp-generator')} className="gap-1">
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

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Color Picker Panel ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-4 space-y-3">
          <button
            onClick={() => setShowColorPanel(v => !v)}
            className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))]"
          >
            <Palette size={15} className="text-[hsl(var(--gold))]"/>
            Preview Colors
            <ChevronRight size={13} className={`transition-transform ${showColorPanel ? 'rotate-90' : ''}`}/>
          </button>

          {showColorPanel && (
            <div className="space-y-4 pt-1">
              {/* Primary color */}
              <div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 font-medium">Primary ink color</p>
                <div className="flex flex-wrap gap-2 items-center">
                  {PRESET_COLORS.map(c => (
                    <button key={c.value} onClick={() => setPrimaryColor(c.value)} title={c.label}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${primaryColor === c.value ? 'border-[hsl(var(--gold))] scale-125 shadow-md' : 'border-white shadow-sm'}`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                  {/* Custom hex */}
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-[hsl(var(--muted-foreground))] text-xs">#</span>
                    <input
                      value={customHex}
                      onChange={e => setCustomHex(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6))}
                      onKeyDown={e => e.key === 'Enter' && applyCustomHex()}
                      placeholder="1a2744"
                      className="w-20 h-7 px-2 text-xs border-2 border-[hsl(var(--border))] rounded-lg focus:outline-none focus:border-[hsl(var(--gold))] bg-white text-black font-mono"
                    />
                    <Button size="sm" variant="outline" onClick={applyCustomHex} className="h-7 px-2 text-xs">Apply</Button>
                  </div>
                  {/* Live preview swatch */}
                  <div className="flex items-center gap-1.5 ml-2 text-xs text-[hsl(var(--muted-foreground))]">
                    <div className="w-5 h-5 rounded-full border border-[hsl(var(--border))]" style={{ backgroundColor: primaryColor }}/>
                    <code className="text-[10px]">{primaryColor}</code>
                  </div>
                </div>
              </div>

              {/* Dual color toggle */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setDualColorMode(v => !v)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${dualColorMode ? 'bg-[hsl(var(--gold))]' : 'bg-[hsl(var(--muted))]'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${dualColorMode ? 'left-5' : 'left-0.5'}`}/>
                  </div>
                  <span className="text-xs font-medium text-[hsl(var(--foreground))]">Dual Color Mode</span>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">(secondary color for inner elements)</span>
                </label>
              </div>

              {dualColorMode && (
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 font-medium">Secondary color (monogram & inner elements)</p>
                  <div className="flex flex-wrap gap-2">
                    {SECONDARY_COLORS.map(c => (
                      <button key={c.value} onClick={() => setSecondaryColor(c.value)} title={c.label}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${secondaryColor === c.value ? 'border-[hsl(var(--gold))] scale-125 shadow-md' : 'border-white shadow-sm'}`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => setSecondaryColor(undefined)} className="h-7 px-2 text-xs text-[hsl(var(--muted-foreground))]">Clear</Button>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Preview only — final export uses your selected colors</p>
            </div>
          )}
        </div>

        {/* ── Blocked warning ─────────────────────────────────────────────── */}
        {blocked && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
            <AlertTriangle size={18}/>
            <div>
              <p className="font-semibold text-sm">Generation Blocked</p>
              <p className="text-xs">Official government or authority seals cannot be generated.</p>
            </div>
          </div>
        )}

        {/* ── Favorites section ─────────────────────────────────────────── */}
        {favoriteConcepts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart size={14} className="text-rose-500 fill-rose-500"/>
              <h2 className="font-semibold text-[hsl(var(--foreground))] text-sm">Saved Favorites ({favoriteConcepts.length})</h2>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">— preserved across regenerations</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {favoriteConcepts.map(c => (
                <ConceptCard key={c.id} concept={c} selectedId={selectedId} tintColor={tintColor} secondaryColor={secColor}
                  togglingFav={togglingFav} onSelect={selectDesign} onToggleFav={toggleFavorite}/>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {generating && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-72 rounded-2xl bg-[hsl(var(--muted))] animate-pulse"/>
            ))}
          </div>
        )}

        {/* ── Concepts grid ─────────────────────────────────────────────── */}
        {!generating && !blocked && concepts.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[hsl(var(--foreground))]">
                {concepts.length} Stamp Concepts
              </h2>
              {selectedId && <Badge className="bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]"><Check size={10} className="mr-1"/>Design Selected</Badge>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {concepts.map(concept => (
                <ConceptCard key={concept.id} concept={concept} selectedId={selectedId} tintColor={tintColor} secondaryColor={secColor}
                  togglingFav={togglingFav} onSelect={selectDesign} onToggleFav={toggleFavorite}/>
              ))}
            </div>
          </>
        )}

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {!generating && !blocked && concepts.length === 0 && favoriteConcepts.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <Wand2 size={40} className="text-[hsl(var(--gold))] mx-auto"/>
            <p className="text-[hsl(var(--muted-foreground))]">Click "Regenerate" to create stamp concepts</p>
            <Button onClick={() => generateConcepts()} className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white">
              <Wand2 size={14} className="mr-2"/> Generate Concepts
            </Button>
          </div>
        )}

        {/* ── Export CTA ────────────────────────────────────────────────── */}
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

      {/* ── AI Designer Chat Panel ──────────────────────────────────────────── */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-[hsl(var(--border))] shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--gold)/0.08)] to-white">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[hsl(var(--gold))]"/>
              <span className="font-semibold text-sm text-[hsl(var(--foreground))]">AI Stamp Designer</span>
            </div>
            <button onClick={() => setChatOpen(false)}><X size={16} className="text-[hsl(var(--muted-foreground))]"/></button>
          </div>

          {chatMessages.length === 0 && (
            <div className="px-4 py-4 space-y-2">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Describe changes to refine your stamp design. Examples:</p>
              {[
                'Make the borders thicker and add a star divider',
                'Change to a more minimalist style',
                'Add a decorative inner ring',
                'Make the text larger and bolder',
              ].map(eg => (
                <button key={eg} onClick={() => setChatInput(eg)}
                  className="w-full text-left text-xs p-2 bg-[hsl(var(--pearl-1))] rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] text-[hsl(var(--foreground))]">
                  "{eg}"
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                  msg.role === 'user'
                    ? 'bg-[hsl(var(--gold))] text-white'
                    : 'bg-[hsl(var(--pearl-1))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]'
                }`}>
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

          <div className="px-4 py-3 border-t border-[hsl(var(--border))]">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                placeholder="Describe your changes…"
                className="flex-1 h-9 px-3 text-xs border-2 border-[hsl(var(--border))] rounded-xl focus:outline-none focus:border-[hsl(var(--gold))] bg-white text-black"
              />
              <Button size="sm" className="h-9 px-3 bg-[hsl(var(--gold))] text-white hover:bg-[hsl(var(--gold-dark))]"
                onClick={sendChatMessage} disabled={chatLoading}>
                <Send size={12}/>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Concept Card ─────────────────────────────────────────────────────────────
function ConceptCard({
  concept, selectedId, tintColor, secondaryColor, togglingFav, onSelect, onToggleFav
}: {
  concept: StampDesignConcept;
  selectedId: string | null;
  tintColor: string;
  secondaryColor?: string;
  togglingFav: string | null;
  onSelect: (c: StampDesignConcept) => void;
  onToggleFav: (c: StampDesignConcept) => void;
}) {
  const isSelected = selectedId === concept.id;
  const isFav = concept.isFavorite;

  return (
    <div className={`group bg-white rounded-2xl border-2 transition-all shadow-sm hover:shadow-md ${
      isSelected
        ? 'border-[hsl(var(--gold))] shadow-[0_0_0_3px_hsl(var(--gold)/0.15)]'
        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
    }`}>
      <div className="relative p-4 flex items-center justify-center bg-[hsl(var(--pearl-1))] rounded-t-2xl min-h-[180px]">
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center z-10">
            <Check size={12} className="text-white"/>
          </div>
        )}
        {/* Favorite button */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFav(concept); }}
          disabled={togglingFav === concept.id}
          className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            isFav
              ? 'bg-rose-50 border border-rose-200 text-rose-500'
              : 'bg-white/80 border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100'
          }`}
        >
          {togglingFav === concept.id
            ? <Loader2 size={11} className="animate-spin"/>
            : <Heart size={11} className={isFav ? 'fill-rose-500' : ''}/>
          }
        </button>
        <StampSVGRenderer svgSource={concept.svgSource} tintColor={tintColor} secondaryColor={secondaryColor} size={160}/>
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
          {isSelected ? <><Check size={10}/> Selected</> : 'Select This Design'}
        </Button>
      </div>
    </div>
  );
}
