import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
// sessionStorage helpers for UI state persistence
function ssGet<T>(key: string, fallback: T): T {
  try { const v = sessionStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function ssSave(key: string, value: unknown) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
}
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { StampSVGRenderer } from '@/components/stamp-generator/StampSVGRenderer';
import { StampColorWheel } from '@/components/stamp-generator/StampColorWheel';
import { StampTextEditor } from '@/components/stamp-generator/StampTextEditor';
import { StampPreviewModal } from '@/components/stamp-generator/StampPreviewModal';
import { StampLicenseUploader } from '@/components/stamp-generator/StampLicenseUploader';
import { generateStampConcepts, StampDesignConcept } from '@/lib/stampTemplates';
import {
  Wand2, Loader2, Check, RefreshCw, Download, Stamp,
  ArrowLeft, ChevronRight, AlertTriangle, Heart, MessageSquare,
  Send, X, Sparkles, Palette, Layers, Type, Upload, ChevronDown,
  Undo2, Redo2, RotateCw, Save
} from 'lucide-react';
import { InteractiveStampCanvas, createDefaultLayers, StampLayer } from '@/components/stamp-generator/InteractiveStampCanvas';
import { useStampHistory } from '@/hooks/useStampHistory';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type ColorStop = 'primary' | 'secondary' | 'accent';

// Full 3-stop palette presets
const PALETTE_PRESETS = [
  { label: 'Ink Blue (Standard)',primary: '#1B3A8C', secondary: '#1a2d6e', accent: '#1B3A8C' },
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
  { label: 'Ink Blue',  hex: '#1B3A8C' },   // Real ink stamp blue (standard)
  { label: 'Gold',    hex: '#B8860B' },
  { label: 'Gold Dark', hex: '#856404' },
  { label: 'Navy',    hex: '#1a2744' },
  { label: 'Black',   hex: '#0d0d0d' },
  { label: 'White',   hex: '#ffffff' },
  { label: 'Red',     hex: '#8B0000' },
  { label: 'Purple',  hex: '#4B0082' },
  { label: 'Forest',  hex: '#1B4332' },
  { label: 'Copper',  hex: '#7C4A00' },
  { label: 'Teal',    hex: '#0D5C63' },
];

const STAMP_FONTS = [
  { label: 'Trajan (Elegant)',       value: 'Georgia, "Times New Roman", serif',                      preview: 'Aa' },
  { label: 'Garamond (Classic)',     value: '"Garamond", "Palatino Linotype", serif',                 preview: 'Aa' },
  { label: 'Baskerville (Literary)', value: '"Baskerville", "Book Antiqua", serif',                   preview: 'Aa' },
  { label: 'Caslon (Antiquarian)',   value: '"Book Antiqua", "Palatino", Georgia, serif',             preview: 'Aa' },
  { label: 'Modern Sans',            value: '"Arial", "Helvetica Neue", sans-serif',                  preview: 'Aa' },
  { label: 'Futura (Geometric)',     value: '"Century Gothic", "Trebuchet MS", sans-serif',           preview: 'Aa' },
  { label: 'Gill Sans (Humanist)',   value: '"Gill Sans", "Gill Sans MT", "Optima", sans-serif',      preview: 'Aa' },
  { label: 'Verdana (Screen)',       value: '"Verdana", "Tahoma", sans-serif',                        preview: 'Aa' },
  { label: 'Courier (Monospace)',    value: '"Courier New", "Courier", monospace',                    preview: 'Aa' },
  { label: 'Impact (Display)',       value: '"Impact", "Franklin Gothic Bold", sans-serif',           preview: 'Aa' },
  { label: 'Rockwell (Slab)',        value: '"Rockwell", "Courier New", serif',                       preview: 'Aa' },
  { label: 'Optima (Soft Elegant)',  value: '"Optima", "Segoe UI", sans-serif',                       preview: 'Aa' },
  { label: 'Lucida (Calligraphy)',   value: '"Lucida Calligraphy", "Palatino", serif',                preview: 'Aa' },
  { label: 'Cinzel (Imperial)',      value: '"Palatino Linotype", "Palatino", serif',                 preview: 'Aa' },
];

export default function StampGeneratorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [project, setProject] = useState<any>(null);
  const ssKey = (k: string) => `stamp-gen-${projectId}-${k}`;

  const [concepts, setConcepts] = useState<StampDesignConcept[]>([]);
  const [favoriteConcepts, setFavoriteConcepts] = useState<StampDesignConcept[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  // Three-color system — persisted
  const [primaryColor, setPrimaryColorRaw] = useState(() => ssGet(ssKey('primaryColor'), '#1B3A8C'));
  const [secondaryColor, setSecondaryColorRaw] = useState<string | undefined>(() => ssGet(ssKey('secondaryColor'), undefined));
  const [accentColor, setAccentColorRaw] = useState<string | undefined>(() => ssGet(ssKey('accentColor'), undefined));
  const [activeStop, setActiveStop] = useState<ColorStop>('primary');
  const [inkMode, setInkModeRaw] = useState(() => ssGet(ssKey('inkMode'), false));
  const setInkMode = (v: boolean) => { setInkModeRaw(v); ssSave(ssKey('inkMode'), v); };

  const setPrimaryColor = (v: string) => { setPrimaryColorRaw(v); ssSave(ssKey('primaryColor'), v); };
  const setSecondaryColor = (v: string | undefined) => { setSecondaryColorRaw(v); ssSave(ssKey('secondaryColor'), v ?? null); };
  const setAccentColor = (v: string | undefined) => { setAccentColorRaw(v); ssSave(ssKey('accentColor'), v ?? null); };

  // Font family — persisted
  const [fontFamily, setFontFamilyRaw] = useState<string>(() => ssGet(ssKey('fontFamily'), STAMP_FONTS[0].value));
  const setFontFamily = (v: string) => { setFontFamilyRaw(v); ssSave(ssKey('fontFamily'), v); };

  // Typography controls — persisted
  const [fontBold, setFontBoldRaw] = useState(() => ssGet(ssKey('fontBold'), false));
  const [fontItalic, setFontItalicRaw] = useState(() => ssGet(ssKey('fontItalic'), false));
  const [manualFontSize, setManualFontSizeRaw] = useState<number | null>(() => ssGet(ssKey('fontSize'), null));
  const setFontBold = (v: boolean | ((p: boolean) => boolean)) => {
    setFontBoldRaw(prev => { const next = typeof v === 'function' ? v(prev) : v; ssSave(ssKey('fontBold'), next); return next; });
  };
  const setFontItalic = (v: boolean | ((p: boolean) => boolean)) => {
    setFontItalicRaw(prev => { const next = typeof v === 'function' ? v(prev) : v; ssSave(ssKey('fontItalic'), next); return next; });
  };
  const setManualFontSize = (v: number | null | ((p: number | null) => number | null)) => {
    setManualFontSizeRaw(prev => { const next = typeof v === 'function' ? v(prev) : v; ssSave(ssKey('fontSize'), next); return next; });
  };

  // Left panel tab
  const [leftTab, setLeftTab] = useState<'color' | 'fonts' | 'text' | 'centerart' | 'logo'>('color');

  // Center Art controls (monogram/logo override on the generate page)
  const [localIconStyle, setLocalIconStyle] = useState<'NONE' | 'MONOGRAM' | 'UPLOADED_LOGO'>('MONOGRAM');
  const [localMonogramText, setLocalMonogramText] = useState<string>('');
  const [localLogoUrl, setLocalLogoUrl] = useState<string>('');

  // Preview modal
  const [previewConcept, setPreviewConcept] = useState<StampDesignConcept | null>(null);
  const [openWithEditor, setOpenWithEditor] = useState(false);

  // AI chat
  const [chatOpen, setChatOpen] = useState(false);
  const [aiPanelMinimized, setAiPanelMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [licenseOpen, setLicenseOpen] = useState(false);

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

    // Sync Center Art controls from project
    setLocalIconStyle((data.icon_style as any) || 'MONOGRAM');
    setLocalMonogramText(data.monogram_text || data.company_name?.slice(0, 2)?.toUpperCase() || '');
    setLocalLogoUrl((data as any).uploaded_logo_url || '');

    const isFresh = new URLSearchParams(location.search).get('fresh') === '1';

    const { data: existing } = await supabase
      .from('stamp_designs')
      .select('id, svg_source, template_key, is_favorite')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!isFresh && existing && existing.length > 0) {
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
    // Always use the most up-to-date project state — critical after license auto-fill
    const p = proj || project;
    if (!p) return;
    setGenerating(true);
    setBlocked(false);
    setSvgOverrides({});

    // Merge: prefer the explicitly passed proj over stale project state
    // When called from loadProject, proj is fresh DB data and project may be null
    const latestProject = project ? { ...project, ...p } : p;

    try {
      if (session?.access_token) {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-stamp-generator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'generate', project: latestProject, projectId }),
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

    const clientConcepts = generateStampConcepts(latestProject);
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

  // Opens text editor directly for a concept — opens Preview modal with text editor expanded
  function handleEditText(concept: StampDesignConcept) {
    setSelectedId(concept.id);
    setOpenWithEditor(true);
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
    <div className="min-h-screen bg-gradient-to-br from-[hsl(40,33%,98%)] via-[hsl(38,30%,93%)] to-[hsl(36,25%,88%)] pt-24 sm:pt-28 lg:pt-32">

      {/* Preview Modal */}
      {previewConcept && (
        <StampPreviewModal
          concept={previewConcept}
          project={project}
          tintColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
          svgOverride={svgOverrides[previewConcept.id]}
          onBack={() => { setPreviewConcept(null); setOpenWithEditor(false); }}
          onSelectAndExport={() => confirmSelectAndExport(previewConcept)}
          onSvgChange={(newSvg) => handleSvgTextChange(previewConcept.id, newSvg)}
          initialShowEditor={openWithEditor}
          fontFamily={fontFamily}
          fontWeight={fontBold ? 'bold' : 'normal'}
          fontStyle={fontItalic ? 'italic' : 'normal'}
          fontSize={manualFontSize}
          projectId={projectId}
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
            <Button variant="outline" size="sm" onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/gallery`)} className="gap-1 text-xs">
              <Layers size={12}/> Gallery
            </Button>
            <Button variant="outline" size="sm" onClick={() => setChatOpen(v => !v)} className="gap-1 text-xs">
              <MessageSquare size={12}/> Smart Designer
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

      {/* ── 3-Column Studio Layout ─────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto px-4 pt-6 pb-8">
        <div className="flex gap-4 items-start">

          {/* ── Left Panel: Style Controls ────────────────────────────── */}
          <div className="hidden lg:flex flex-col gap-3 w-56 flex-shrink-0 sticky top-[calc(theme(spacing.32)+56px)] self-start max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Tab switcher */}
            <div className="flex bg-[hsl(var(--muted))] rounded-xl p-1 gap-1 flex-wrap">
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
              <button onClick={() => setLeftTab('centerart')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${leftTab === 'centerart' ? 'bg-white shadow-sm text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                <Stamp size={10}/> Art
              </button>
              <button onClick={() => setLeftTab('logo')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${leftTab === 'logo' ? 'bg-white shadow-sm text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                <Upload size={10}/> Logo
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-4 space-y-4 overflow-hidden">

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
                            className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${activeColor === c.hex ? 'border-[hsl(var(--gold))] scale-110 shadow-lg' : c.hex === '#ffffff' ? 'border-[hsl(var(--gold)/0.4)] shadow-[0_0_0_1px_hsl(var(--gold)/0.3)]' : 'border-white/60 shadow-sm'}`}
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

                    <div className="pt-2 border-t border-[hsl(var(--border))] mt-2">
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

                    <div className="flex gap-1.5 flex-wrap mt-2">
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

                    {/* Ink Impression Mode Toggle */}
                    <div className="pt-3 mt-2 border-t border-[hsl(var(--border))]">
                      <button
                        onClick={() => setInkMode(!inkMode)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all ${
                          inkMode
                            ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]'
                            : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                          inkMode ? 'bg-[hsl(var(--gold))] text-white' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                        }`}>
                          {inkMode ? '✓' : ''}
                        </div>
                        <div className="text-left">
                          <p className="text-[11px] font-semibold text-[hsl(var(--foreground))]">Ink Impression</p>
                          <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Realistic rubber stamp texture</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── Fonts tab ── */}
              {leftTab === 'fonts' && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Typography</p>
                  <div>
                    <p className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Style</p>
                    <div className="flex gap-2">
                      <button onClick={() => setFontBold(v => !v)}
                        className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all ${fontBold ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--foreground))]' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}>B</button>
                      <button onClick={() => setFontItalic(v => !v)}
                        className={`flex-1 py-2 rounded-xl border-2 text-sm italic font-medium transition-all ${fontItalic ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--foreground))]' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}>I</button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Font Size</p>
                      <button onClick={() => setManualFontSize(null)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${manualFontSize === null ? 'border-[hsl(var(--gold))] text-[hsl(var(--gold-dark))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}>Auto</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setManualFontSize(v => Math.max(6, (v ?? 10) - 1))} className="w-7 h-7 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-bold text-sm flex items-center justify-center hover:border-[hsl(var(--gold)/0.5)] transition-all">−</button>
                      <input type="range" min={6} max={24} step={0.5} value={manualFontSize ?? 10}
                        onChange={e => setManualFontSize(parseFloat(e.target.value))} className="flex-1 accent-[hsl(var(--gold))]"/>
                      <button onClick={() => setManualFontSize(v => Math.min(24, (v ?? 10) + 1))} className="w-7 h-7 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-bold text-sm flex items-center justify-center hover:border-[hsl(var(--gold)/0.5)] transition-all">+</button>
                    </div>
                    {manualFontSize !== null && <p className="text-[10px] font-bold text-[hsl(var(--foreground))] mt-1">{manualFontSize}pt</p>}
                  </div>
                  <div className="border-t border-[hsl(var(--border))] pt-3">
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-2">Font Family</p>
                    <div className="space-y-1.5">
                      {STAMP_FONTS.map(f => (
                        <button key={f.value} onClick={() => setFontFamily(f.value)}
                          className={`w-full text-left p-2.5 rounded-xl border-2 transition-all ${fontFamily === f.value ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.3)]'}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-[hsl(var(--foreground))]">{f.label.split(' (')[0]}</p>
                            <span className={`text-base text-[hsl(var(--foreground))] opacity-60 ${fontBold ? 'font-bold' : 'font-medium'} ${fontItalic ? 'italic' : ''}`} style={{ fontFamily: f.value }}>Aa</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Text tab ── */}
              {leftTab === 'text' && (
                <>
                  {selectedSvg && selectedConcept ? (
                    <StampTextEditor svgSource={selectedSvg} onSvgChange={(newSvg) => handleSvgTextChange(selectedConcept.id, newSvg)}/>
                  ) : (
                    <div className="text-center py-6 space-y-2">
                      <Type size={24} className="text-[hsl(var(--muted-foreground))] mx-auto"/>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">Select a stamp design to edit its text elements</p>
                    </div>
                  )}
                </>
              )}

              {/* ── Center Art tab ── */}
              {leftTab === 'centerart' && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Center Artwork</p>
                  <div className="space-y-1.5">
                    {([
                      { val: 'MONOGRAM' as const, label: 'Gold Monogram' },
                      { val: 'UPLOADED_LOGO' as const, label: 'Upload Logo' },
                      { val: 'NONE' as const, label: 'No Center Art' },
                    ]).map(opt => (
                      <button key={opt.val} onClick={() => setLocalIconStyle(opt.val)}
                        className={`w-full py-2 px-3 rounded-xl border-2 text-xs text-left transition-all ${localIconStyle === opt.val ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--foreground))]' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.3)]'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {localIconStyle === 'MONOGRAM' && (
                    <div>
                      <p className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Monogram Letters</p>
                      <input type="text" maxLength={3} value={localMonogramText}
                        onChange={e => setLocalMonogramText(e.target.value.toUpperCase().slice(0, 3))}
                        placeholder={project?.company_name?.slice(0, 2) || 'AB'}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[hsl(var(--gold)/0.4)] bg-white text-center text-lg font-bold tracking-widest text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--gold))] transition-all"/>
                    </div>
                  )}
                  {localIconStyle === 'UPLOADED_LOGO' && (
                    <div>
                      <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-[hsl(var(--gold)/0.4)] cursor-pointer hover:border-[hsl(var(--gold))] transition-all">
                        <Upload size={20} className="text-[hsl(var(--gold))]"/>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">{localLogoUrl ? 'Change logo' : 'Click to upload'}</span>
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => setLocalLogoUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }}/>
                      </label>
                      {localLogoUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={localLogoUrl} alt="Logo preview" className="w-12 h-12 rounded-lg object-contain border border-[hsl(var(--border))]"/>
                          <button onClick={() => setLocalLogoUrl('')} className="text-[10px] text-destructive underline">Remove</button>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const updated = { ...project, icon_style: localIconStyle, monogram_text: localMonogramText || null, uploaded_logo_url: localLogoUrl || null };
                      setProject(updated);
                      toast.info('Applying center artwork…', { duration: 1500 });
                      generateConcepts(updated);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all"
                  >
                    <Wand2 size={12}/> Apply to Stamps
                  </button>
                </div>
              )}

              {/* ── Logo/Monogram tab ── */}
              {leftTab === 'logo' && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Logo / Monogram</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Upload your company logo or set monogram initials for the center of the stamp.</p>
                  <div className="space-y-1.5">
                    {([
                      { val: 'UPLOADED_LOGO' as const, label: 'Upload Logo' },
                      { val: 'MONOGRAM' as const, label: '✦ Gold Monogram' },
                      { val: 'NONE' as const, label: '⊘ No Center Art' },
                    ]).map(opt => (
                      <button key={opt.val} onClick={() => setLocalIconStyle(opt.val)}
                        className={`w-full py-2 px-3 rounded-xl border-2 text-xs text-left transition-all ${localIconStyle === opt.val ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--foreground))]' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.3)]'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {localIconStyle === 'UPLOADED_LOGO' && (
                    <div>
                      <label className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-[hsl(var(--gold)/0.4)] cursor-pointer hover:border-[hsl(var(--gold))] transition-all">
                        <Upload size={20} className="text-[hsl(var(--gold))]"/>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">{localLogoUrl ? 'Change logo' : 'Click to upload logo'}</span>
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => setLocalLogoUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }}/>
                      </label>
                      {localLogoUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={localLogoUrl} alt="Logo preview" className="w-12 h-12 rounded-lg object-contain border border-[hsl(var(--border))]"/>
                          <button onClick={() => setLocalLogoUrl('')} className="text-[10px] text-destructive underline">Remove</button>
                        </div>
                      )}
                    </div>
                  )}
                  {localIconStyle === 'MONOGRAM' && (
                    <div>
                      <p className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Monogram (1-3 letters)</p>
                      <input type="text" maxLength={3} value={localMonogramText}
                        onChange={e => setLocalMonogramText(e.target.value.toUpperCase().slice(0, 3))}
                        placeholder={project?.company_name?.slice(0, 2) || 'AB'}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[hsl(var(--gold)/0.4)] bg-white text-center text-lg font-bold tracking-widest text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--gold))] transition-all"/>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const updated = { ...project, icon_style: localIconStyle, monogram_text: localMonogramText || null, uploaded_logo_url: localLogoUrl || null };
                      setProject(updated);
                      toast.info('Applying logo/monogram…', { duration: 1500 });
                      generateConcepts(updated);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all"
                  >
                    <Wand2 size={12}/> Apply Logo to Stamps
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Center: Always-Visible Live Preview ───────────────────── */}
          <div className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0 sticky top-[calc(theme(spacing.32)+56px)] self-start gap-3">
            {/* Preview canvas */}
            <div className="bg-white rounded-2xl border-2 border-[hsl(var(--gold)/0.25)] shadow-lg overflow-hidden">
              {/* Header */}
              <div className="px-4 py-2.5 bg-gradient-to-r from-[hsl(var(--pearl-1))] to-white border-b border-[hsl(var(--border))] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]"/>
                  <span className="text-[11px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-widest">Live Preview</span>
                </div>
                {selectedId && (
                  <Badge className="text-[9px] px-1.5 py-0 bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]">
                    <Check size={8} className="mr-0.5"/> Selected
                  </Badge>
                )}
              </div>

              {/* Large stamp preview — always centered */}
              <div className="flex items-center justify-center py-8 px-6 min-h-[300px] bg-[radial-gradient(circle_at_center,_hsl(var(--pearl-1))_0%,_white_70%)]">
                {generating ? (
                  <div className="flex flex-col items-center gap-3 text-[hsl(var(--muted-foreground))]">
                    <Loader2 size={32} className="animate-spin text-[hsl(var(--gold))]"/>
                    <p className="text-xs font-medium">Generating designs…</p>
                  </div>
                ) : (selectedSvg || allConcepts[0]?.svgSource) ? (
                  <StampSVGRenderer
                    svgSource={selectedSvg || (svgOverrides[allConcepts[0]?.id] || allConcepts[0]?.svgSource) || ''}
                    tintColor={primaryColor}
                    secondaryColor={secondaryColor}
                    accentColor={accentColor}
                    fontFamily={fontFamily}
                    fontWeight={fontBold ? 'bold' : 'normal'}
                    fontStyle={fontItalic ? 'italic' : 'normal'}
                    fontSize={manualFontSize}
                    inkMode={inkMode}
                    size={240}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-[hsl(var(--muted-foreground))]">
                    <Stamp size={40} className="opacity-20"/>
                    <p className="text-xs text-center">Select a design from the concepts grid to preview it here</p>
                  </div>
                )}
              </div>

              {/* Quick actions */}
              {(selectedSvg || allConcepts[0]) && !generating && (
                <div className="border-t border-[hsl(var(--border))] px-4 py-3 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-[11px] bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1"
                    onClick={() => {
                      const c = selectedConcept || allConcepts[0];
                      if (c) { setSelectedId(c.id); setPreviewConcept(c); }
                    }}
                  >
                    <Wand2 size={10}/> Edit & Export
                  </Button>
                  {selectedId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-[11px] border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.06)] gap-1"
                      onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/export/${savedDesignId || selectedId}`)}
                    >
                      <Download size={10}/> Export
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Trade License Auto-Fill — in center column for visibility after upload */}
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
              <button
                onClick={() => setLicenseOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[hsl(var(--pearl-1))] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Upload size={13} className="text-[hsl(var(--gold))]"/>
                   <span className="text-xs font-medium text-[hsl(var(--foreground))]">Smart Auto-Fill from License</span>
                   <Badge className="text-[9px] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]">Smart</Badge>
                </div>
                <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${licenseOpen ? 'rotate-180' : ''}`}/>
              </button>
              {licenseOpen && (
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))]">
                  <StampLicenseUploader
                    onExtracted={(data) => {
                      const updatedProject = {
                        ...project,
                        ...(data.company_name && { company_name: data.company_name }),
                        ...(data.arabic_company_name && { arabic_company_name: data.arabic_company_name }),
                        ...(data.registration_number && { registration_number: data.registration_number }),
                        ...(data.city && { city_optional: data.city }),
                      };
                      setProject(updatedProject);
                      setLicenseOpen(false);
                      toast.info('Trade license loaded — regenerating stamps…', { duration: 2500 });
                      setTimeout(() => generateConcepts(updatedProject), 300);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Blocked warning */}
            {blocked && (
              <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
                <AlertTriangle size={16}/>
                <div>
                  <p className="font-semibold text-xs">Generation Blocked</p>
                  <p className="text-[10px]">Government seals cannot be generated.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Concepts Grid ───────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Mobile trade license section */}
            <div className="lg:hidden bg-white rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
              <button
                onClick={() => setLicenseOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[hsl(var(--pearl-1))] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Upload size={14} className="text-[hsl(var(--gold))]"/>
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">Smart Auto-Fill from Trade License</span>
                </div>
                <ChevronDown size={14} className={`text-[hsl(var(--muted-foreground))] transition-transform ${licenseOpen ? 'rotate-180' : ''}`}/>
              </button>
              {licenseOpen && (
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))]">
                  <StampLicenseUploader
                    onExtracted={(data) => {
                      const updatedProject = {
                        ...project,
                        ...(data.company_name && { company_name: data.company_name }),
                        ...(data.arabic_company_name && { arabic_company_name: data.arabic_company_name }),
                        ...(data.registration_number && { registration_number: data.registration_number }),
                        ...(data.city && { city_optional: data.city }),
                      };
                      setProject(updatedProject);
                      setLicenseOpen(false);
                      toast.info('Trade license data loaded — regenerating stamps…', { duration: 2500 });
                      setTimeout(() => generateConcepts(updatedProject), 300);
                    }}
                  />
                </div>
              )}
            </div>

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

            {/* Mobile live preview */}
            <div className="lg:hidden bg-white rounded-2xl border-2 border-[hsl(var(--gold)/0.25)] p-4">
              <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">Live Preview</p>
              <div className="flex items-center justify-center min-h-[200px] bg-[hsl(var(--pearl-1))] rounded-xl">
                {generating ? (
                  <Loader2 size={28} className="animate-spin text-[hsl(var(--gold))]"/>
                ) : (selectedSvg || allConcepts[0]?.svgSource) ? (
                  <StampSVGRenderer
                    svgSource={selectedSvg || allConcepts[0]?.svgSource || ''}
                    tintColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor}
                    fontFamily={fontFamily} fontWeight={fontBold ? 'bold' : 'normal'} fontStyle={fontItalic ? 'italic' : 'normal'}
                    fontSize={manualFontSize} inkMode={inkMode} size={180}
                  />
                ) : <Stamp size={40} className="text-[hsl(var(--muted-foreground))] opacity-20"/>}
              </div>
            </div>

            {/* Favorites */}
            {favoriteConcepts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Heart size={14} className="text-rose-500 fill-rose-500"/>
                  <h2 className="font-semibold text-[hsl(var(--foreground))] text-sm">Saved Favorites ({favoriteConcepts.length})</h2>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">— preserved across regenerations</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {favoriteConcepts.map(c => (
                    <ConceptCard key={c.id} concept={c} svgOverride={svgOverrides[c.id]}
                      selectedId={selectedId} tintColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily}
                      fontBold={fontBold} fontItalic={fontItalic} manualFontSize={manualFontSize} inkMode={inkMode}
                      togglingFav={togglingFav} onSelect={handleSelectConcept} onToggleFav={toggleFavorite} onEditText={handleEditText}/>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {generating && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1,2,3,4,5,6,7,8,9,10,11].map(i => (
                  <div key={i} className="h-64 rounded-2xl bg-[hsl(var(--muted))] animate-pulse"/>
                ))}
              </div>
            )}

            {/* Concepts grid */}
            {!generating && !blocked && concepts.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[hsl(var(--foreground))] text-sm">
                    {concepts.length} Stamp Concepts
                    <span className="ml-2 text-xs font-normal text-[hsl(var(--muted-foreground))]">— click to select & preview</span>
                  </h2>
                  {selectedId && <Badge className="bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]"><Check size={10} className="mr-1"/>Design Selected</Badge>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {concepts.map(concept => (
                    <ConceptCard key={concept.id} concept={concept} svgOverride={svgOverrides[concept.id]}
                      selectedId={selectedId} tintColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily}
                      fontBold={fontBold} fontItalic={fontItalic} manualFontSize={manualFontSize} inkMode={inkMode}
                      togglingFav={togglingFav} onSelect={handleSelectConcept} onToggleFav={toggleFavorite} onEditText={handleEditText}/>
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
              <div className="bg-gradient-to-r from-[hsl(var(--gold)/0.08)] to-[hsl(var(--champagne-1))] rounded-2xl border border-[hsl(var(--gold)/0.2)] p-5 flex items-center justify-between flex-wrap gap-4">
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
            maxHeight: aiPanelMinimized ? 'auto' : 'calc(100vh - 180px)',
            top: 160,
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
              <span className="font-bold text-sm text-white">Smart Stamp Designer</span>
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
  concept, svgOverride, selectedId, tintColor, secondaryColor, accentColor, fontFamily, fontBold, fontItalic, manualFontSize, inkMode, togglingFav, onSelect, onToggleFav, onEditText
}: {
  concept: StampDesignConcept;
  svgOverride?: string;
  selectedId: string | null;
  tintColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
  manualFontSize?: number | null;
  inkMode?: boolean;
  togglingFav: string | null;
  onSelect: (c: StampDesignConcept) => void;
  onToggleFav: (c: StampDesignConcept) => void;
  onEditText: (c: StampDesignConcept) => void;
}) {
  const isSelected = selectedId === concept.id;
  const isFav = concept.isFavorite;
  const displaySvg = svgOverride || concept.svgSource;

  return (
    <div className={`group bg-card/80 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md ${isSelected ? 'border-gold shadow-[0_0_0_3px_hsl(var(--gold)/0.15)]' : 'border-gold/30 hover:border-gold/50'}`}>
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
        <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} fontWeight={fontBold ? 'bold' : 'normal'} fontStyle={fontItalic ? 'italic' : 'normal'} fontSize={manualFontSize} inkMode={inkMode} size={160}/>
      </div>
      <div className="p-3 space-y-2">
        <p className="font-medium text-sm text-[hsl(var(--foreground))] truncate">{concept.label}</p>
        <div className="flex flex-wrap gap-1">
          {concept.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
          ))}
          {isFav && <Badge className="text-[10px] px-1.5 py-0 bg-rose-50 text-rose-600 border border-rose-200">♥ Saved</Badge>}
        </div>
        <div className="flex gap-1.5">
          <Button size="sm"
            className={`flex-1 h-7 text-xs gap-1 ${isSelected ? 'bg-[hsl(var(--gold))] text-white' : 'bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90'}`}
            onClick={() => onSelect(concept)}>
            {isSelected ? <><Check size={10}/> Preview</> : 'Select'}
          </Button>
          <Button size="sm" variant="outline"
            className="h-7 text-xs gap-1 border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.06)] px-2.5"
            onClick={e => { e.stopPropagation(); onEditText(concept); }}
            title="Edit text elements">
            <Type size={10}/> Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
