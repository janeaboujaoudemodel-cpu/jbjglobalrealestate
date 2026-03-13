import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
// localStorage helpers for persistent UI state / draft recovery
function ssGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function ssSave(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
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
  Undo2, Redo2, RotateCw, Save, ChevronLeft
} from 'lucide-react';
import { useStampHistory } from '@/hooks/useStampHistory';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type ColorStop = 'primary' | 'secondary' | 'accent';

const CONCEPTS_PER_PAGE = 6;

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

const PRESET_PALETTE = [
  { label: 'Ink Blue',  hex: '#1B3A8C' },
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

/** Inject logo/monogram into an existing SVG source string */
function injectCenterArt(svgSource: string, iconStyle: string, monogramText: string, logoUrl: string): string {
  // Remove existing center content (image or monogram text with dominant-baseline="central")
  let svg = svgSource;
  // Remove <image> inside center-clip
  svg = svg.replace(/<defs><clipPath id="center-clip">[\s\S]*?<\/clipPath><\/defs>/gi, '');
  svg = svg.replace(/<image[^>]*clip-path="url\(#center-clip\)"[^>]*\/>/gi, '');
  // Remove monogram text (dominant-baseline="central" text near center)
  svg = svg.replace(/<text[^>]*dominant-baseline="central"[^>]*>[^<]*<\/text>/gi, '');

  if (iconStyle === 'NONE') return svg;

  // Find viewBox to get center coordinates
  const vbMatch = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const S = vbMatch ? parseInt(vbMatch[1]) : 320;
  const cx = S / 2;
  const cy = S / 2;
  const centerR = S * 0.14;

  const insertBefore = '</svg>';

  if (iconStyle === 'UPLOADED_LOGO' && logoUrl) {
    const imgSize = centerR * 1.6;
    const logoSvg = `
      <defs><clipPath id="center-clip"><circle cx="${cx}" cy="${cy}" r="${centerR - 1}"/></clipPath></defs>
      <image href="${logoUrl}" x="${cx - imgSize / 2}" y="${cy - imgSize / 2}" width="${imgSize}" height="${imgSize}" 
        clip-path="url(#center-clip)" preserveAspectRatio="xMidYMid meet" image-rendering="optimizeQuality"/>`;
    svg = svg.replace(insertBefore, logoSvg + insertBefore);
  } else if (iconStyle === 'MONOGRAM' && monogramText) {
    const mono = monogramText.toUpperCase().slice(0, 3);
    const monoSize = mono.length === 1 ? centerR * 0.9 : mono.length === 2 ? centerR * 0.7 : centerR * 0.55;
    const monoSvg = `
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
        font-family="Georgia, serif" font-size="${monoSize}" fill="currentColor" 
        font-weight="700" letter-spacing="2">${mono}</text>`;
    svg = svg.replace(insertBefore, monoSvg + insertBefore);
  }
  return svg;
}

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
  const [conceptPage, setConceptPage] = useState(0);

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

  // Center Art controls — logo persisted in localStorage
  const [localIconStyle, setLocalIconStyle] = useState<'NONE' | 'MONOGRAM' | 'UPLOADED_LOGO'>('MONOGRAM');
  const [localMonogramText, setLocalMonogramText] = useState<string>('');
  const [localLogoUrl, setLocalLogoUrlRaw] = useState<string>('');
  const setLocalLogoUrl = (v: string) => { setLocalLogoUrlRaw(v); if (projectId) { try { if (v) localStorage.setItem(`stamp-logo-${projectId}`, v); else localStorage.removeItem(`stamp-logo-${projectId}`); } catch {} } };

  // Custom user color palette — up to 5 saved colors
  const [customPalette, setCustomPaletteRaw] = useState<string[]>(() => { try { const v = localStorage.getItem('stamp-custom-palette'); return v ? JSON.parse(v) : []; } catch { return []; } });
  const setCustomPalette = (v: string[]) => { setCustomPaletteRaw(v); try { localStorage.setItem('stamp-custom-palette', JSON.stringify(v)); } catch {} };
  const addCustomColor = (hex: string) => { if (customPalette.length >= 5) { toast.error('Max 5 custom colors'); return; } if (customPalette.includes(hex)) return; setCustomPalette([...customPalette, hex]); toast.success('Color saved'); };
  const removeCustomColor = (hex: string) => { setCustomPalette(customPalette.filter(c => c !== hex)); };

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

  // Undo/redo for svg overrides
  const svgHistory = useStampHistory<Record<string, string>>({});

  const handleSvgUndoStudio = useCallback(() => {
    const prev = svgHistory.undo();
    if (prev) setSvgOverrides(prev);
  }, [svgHistory]);

  const handleSvgRedoStudio = useCallback(() => {
    const next = svgHistory.redo();
    if (next) setSvgOverrides(next);
  }, [svgHistory]);

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

    setLocalIconStyle((data.icon_style as any) || 'MONOGRAM');
    setLocalMonogramText(data.monogram_text || data.company_name?.slice(0, 2)?.toUpperCase() || '');
    // Restore logo from localStorage or project data
    const savedLogo = projectId ? localStorage.getItem(`stamp-logo-${projectId}`) : null;
    setLocalLogoUrlRaw(savedLogo || (data as any).uploaded_logo_url || '');

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
    const p = proj || project;
    if (!p) return;
    setGenerating(true);
    setBlocked(false);
    setSvgOverrides({});
    setConceptPage(0);

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

  function handleSelectConcept(concept: StampDesignConcept) {
    setSelectedId(concept.id);
    setPreviewConcept(concept);
  }

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

  /** Apply logo/monogram to all existing concepts without regenerating */
  function applyLogoToAllConcepts() {
    const updated = { ...project, icon_style: localIconStyle, monogram_text: localMonogramText || null, uploaded_logo_url: localLogoUrl || null };
    setProject(updated);

    const newOverrides: Record<string, string> = { ...svgOverrides };
    [...favoriteConcepts, ...concepts].forEach(c => {
      const base = svgOverrides[c.id] || c.svgSource;
      newOverrides[c.id] = injectCenterArt(base, localIconStyle, localMonogramText, localLogoUrl);
    });
    setSvgOverrides(newOverrides);
    toast.success('Logo applied to all stamps');
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

  const activeColor = activeStop === 'primary' ? primaryColor : activeStop === 'secondary' ? (secondaryColor || '#2a3a5c') : (accentColor || '#B8860B');
  function setActiveColor(hex: string) {
    if (activeStop === 'primary') setPrimaryColor(hex);
    else if (activeStop === 'secondary') setSecondaryColor(hex);
    else setAccentColor(hex);
  }

  const allConcepts = [...favoriteConcepts, ...concepts.filter(c => !favoriteConcepts.some(f => f.id === c.id))];
  const selectedConcept = allConcepts.find(c => c.id === selectedId);
  const selectedSvg = selectedConcept ? (svgOverrides[selectedConcept.id] || selectedConcept.svgSource) : null;

  // Pagination
  const totalPages = Math.ceil(concepts.length / CONCEPTS_PER_PAGE);
  const pagedConcepts = concepts.slice(conceptPage * CONCEPTS_PER_PAGE, (conceptPage + 1) * CONCEPTS_PER_PAGE);

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
    <div className="h-[calc(100vh-52px)] flex flex-col bg-gradient-to-br from-[hsl(40,33%,98%)] via-[hsl(38,30%,93%)] to-[hsl(36,25%,88%)]">

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

      {/* Header — flush under top bar */}
      <div className="flex-shrink-0 border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm z-10">
        <div className="px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/toolkit/stamp-generator/projects')} className="gap-1 h-7 text-xs">
              <ArrowLeft size={12}/> Projects
            </Button>
            <div className="w-px h-4 bg-[hsl(var(--border))]"/>
            <Stamp size={14} className="text-[hsl(var(--gold))]"/>
            <span className="font-medium text-xs text-[hsl(var(--foreground))]">{project.company_name}</span>
            {project.language_mode !== 'EN' && (
              <Badge variant="secondary" className="text-[9px]">{project.language_mode}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleSvgUndoStudio} disabled={!svgHistory.canUndo}
              className="w-6 h-6 rounded-md border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] transition-colors disabled:opacity-30"
              title="Undo"><Undo2 size={11}/></button>
            <button onClick={handleSvgRedoStudio} disabled={!svgHistory.canRedo}
              className="w-6 h-6 rounded-md border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] transition-colors disabled:opacity-30"
              title="Redo"><Redo2 size={11}/></button>
            <div className="w-px h-3.5 bg-[hsl(var(--border))]"/>
            <Button variant="outline" size="sm" onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/gallery`)} className="gap-1 text-[10px] h-7">
              <Layers size={10}/> Gallery
            </Button>
            <Button variant="outline" size="sm" onClick={() => setChatOpen(v => !v)} className="gap-1 text-[10px] h-7">
              <MessageSquare size={10}/> Smart Designer
            </Button>
            <Button variant="outline" size="sm" onClick={() => generateConcepts()} disabled={generating} className="gap-1 text-[10px] h-7">
              <RefreshCw size={10} className={generating ? 'animate-spin' : ''}/>
              {generating ? 'Generating…' : 'Regenerate'}
            </Button>
            {selectedId && (
              <Button size="sm" className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1 text-[10px] h-7"
                onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/export/${savedDesignId || selectedId}`)}>
                <Download size={10}/> Export Pack <ChevronRight size={10}/>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3-Column Studio Body ─────────────────────────────────── */}
      <div className="flex-1 flex gap-0 overflow-hidden">

        {/* ── Left Panel: Style Controls (always visible, 200px) ──── */}
        <div className="w-[240px] flex-shrink-0 border-r border-[hsl(var(--border))] bg-white/80 flex flex-col overflow-hidden">
          {/* Tab switcher */}
          <div className="flex-shrink-0 p-2">
            <div className="flex bg-[hsl(var(--muted))] rounded-lg p-0.5 gap-0.5 flex-wrap">
              {([
                { key: 'color' as const, icon: Palette, label: 'Colors' },
                { key: 'fonts' as const, icon: Layers, label: 'Fonts' },
                { key: 'text' as const, icon: Type, label: 'Text' },
                { key: 'centerart' as const, icon: Stamp, label: 'Art' },
                { key: 'logo' as const, icon: Upload, label: 'Logo' },
              ]).map(t => (
                <button key={t.key} onClick={() => setLeftTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-0.5 py-1 rounded-md text-[9px] font-medium transition-all ${leftTab === t.key ? 'bg-white shadow-sm text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                  <t.icon size={9}/> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-3">

            {/* ── Colors tab ── */}
            {leftTab === 'color' && (
              <>
                <div className="flex gap-1">
                  {stopDefs.map(s => (
                    <button key={s.key} onClick={() => setActiveStop(s.key)} title={s.label}
                      className={`flex-1 flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all ${activeStop === s.key ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))]'}`}>
                      <div className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: s.color }}/>
                      <span className="text-[8px] text-[hsl(var(--muted-foreground))]">{s.label}</span>
                    </button>
                  ))}
                </div>
                <StampColorWheel color={activeColor} onChange={setActiveColor} label="" size={120}/>
                <div className="border-t border-[hsl(var(--border))] pt-2">
                  <p className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1.5">Quick Colors</p>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_PALETTE.map(c => (
                      <button key={c.hex} onClick={() => setActiveColor(c.hex)} title={c.label}
                        className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${activeColor === c.hex ? 'border-[hsl(var(--gold))] scale-110' : 'border-white shadow-sm'}`}
                        style={{ backgroundColor: c.hex }}/>
                    ))}
                  </div>
                </div>
                <div className="border-t border-[hsl(var(--border))] pt-2">
                  <p className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1.5">Palettes</p>
                  <div className="space-y-1">
                    {PALETTE_PRESETS.map(p => (
                      <button key={p.label}
                        onClick={() => { setPrimaryColor(p.primary); setSecondaryColor(p.secondary); setAccentColor(p.accent); }}
                        className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] transition-all text-left">
                        <div className="flex gap-0.5 flex-shrink-0">
                          <div className="w-3 h-3 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: p.primary }}/>
                          <div className="w-3 h-3 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: p.secondary }}/>
                          <div className="w-3 h-3 rounded-full border border-white/60 shadow-sm" style={{ backgroundColor: p.accent }}/>
                        </div>
                        <span className="text-[9px] font-medium text-[hsl(var(--foreground))] truncate">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setInkMode(!inkMode)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg border-2 transition-all ${inkMode ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))]'}`}>
                  <div className={`w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center ${inkMode ? 'bg-[hsl(var(--gold))] text-white' : 'bg-[hsl(var(--muted))]'}`}>
                    {inkMode ? '✓' : ''}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Ink Impression</p>
                    <p className="text-[8px] text-[hsl(var(--muted-foreground))]">Rubber stamp texture</p>
                  </div>
                </button>
              </>
            )}

            {/* ── Fonts tab ── */}
            {leftTab === 'fonts' && (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Typography</p>
                <div className="flex gap-1.5">
                  <button onClick={() => setFontBold(v => !v)}
                    className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${fontBold ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)]' : 'border-[hsl(var(--border))]'}`}>B</button>
                  <button onClick={() => setFontItalic(v => !v)}
                    className={`flex-1 py-1.5 rounded-lg border-2 text-xs italic transition-all ${fontItalic ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)]' : 'border-[hsl(var(--border))]'}`}>I</button>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] uppercase">Size</p>
                    <button onClick={() => setManualFontSize(null)}
                      className={`text-[8px] px-1 py-0.5 rounded border transition-all ${manualFontSize === null ? 'border-[hsl(var(--gold))] text-[hsl(var(--gold-dark))]' : 'border-[hsl(var(--border))]'}`}>Auto</button>
                  </div>
                  <input type="range" min={6} max={24} step={0.5} value={manualFontSize ?? 10}
                    onChange={e => setManualFontSize(parseFloat(e.target.value))} className="w-full accent-[hsl(var(--gold))]"/>
                  {manualFontSize !== null && <p className="text-[9px] font-bold text-[hsl(var(--foreground))] mt-0.5">{manualFontSize}pt</p>}
                </div>
                <div className="border-t border-[hsl(var(--border))] pt-2">
                  <p className="text-[9px] text-[hsl(var(--muted-foreground))] mb-1.5">Font Family</p>
                  <div className="space-y-1">
                    {STAMP_FONTS.map(f => (
                      <button key={f.value} onClick={() => setFontFamily(f.value)}
                        className={`w-full text-left p-2 rounded-lg border-2 transition-all ${fontFamily === f.value ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]' : 'border-[hsl(var(--border))]'}`}>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-medium text-[hsl(var(--foreground))]">{f.label.split(' (')[0]}</p>
                          <span className="text-sm opacity-60" style={{ fontFamily: f.value }}>Aa</span>
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
                    <Type size={20} className="text-[hsl(var(--muted-foreground))] mx-auto"/>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Select a stamp to edit text</p>
                  </div>
                )}
              </>
            )}

            {/* ── Center Art tab ── */}
            {leftTab === 'centerart' && (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Center Artwork</p>
                <div className="space-y-1">
                  {([
                    { val: 'MONOGRAM' as const, label: 'Monogram' },
                    { val: 'UPLOADED_LOGO' as const, label: 'Upload Logo' },
                    { val: 'NONE' as const, label: 'No Art' },
                  ]).map(opt => (
                    <button key={opt.val} onClick={() => setLocalIconStyle(opt.val)}
                      className={`w-full py-1.5 px-2 rounded-lg border-2 text-[10px] text-left transition-all ${localIconStyle === opt.val ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))]'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {localIconStyle === 'MONOGRAM' && (
                  <input type="text" maxLength={3} value={localMonogramText}
                    onChange={e => setLocalMonogramText(e.target.value.toUpperCase().slice(0, 3))}
                    placeholder={project?.company_name?.slice(0, 2) || 'AB'}
                    className="w-full px-2 py-1.5 rounded-lg border-2 border-[hsl(var(--gold)/0.4)] bg-white text-center text-sm font-bold tracking-widest text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--gold))]"/>
                )}
                {localIconStyle === 'UPLOADED_LOGO' && (
                  <label className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-dashed border-[hsl(var(--gold)/0.4)] cursor-pointer hover:border-[hsl(var(--gold))]">
                    <Upload size={16} className="text-[hsl(var(--gold))]"/>
                    <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{localLogoUrl ? 'Change' : 'Upload'}</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setLocalLogoUrl(r.result as string); r.readAsDataURL(f); }}/>
                  </label>
                )}
                <button onClick={applyLogoToAllConcepts}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white text-[10px] font-semibold flex items-center justify-center gap-1 hover:opacity-90">
                  <Wand2 size={10}/> Apply to Stamps
                </button>
              </div>
            )}

            {/* ── Logo tab ── */}
            {leftTab === 'logo' && (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Logo / Monogram</p>
                <div className="space-y-1">
                  {([
                    { val: 'UPLOADED_LOGO' as const, label: 'Upload Logo' },
                    { val: 'MONOGRAM' as const, label: '✦ Monogram' },
                    { val: 'NONE' as const, label: '⊘ None' },
                  ]).map(opt => (
                    <button key={opt.val} onClick={() => setLocalIconStyle(opt.val)}
                      className={`w-full py-1.5 px-2 rounded-lg border-2 text-[10px] text-left transition-all ${localIconStyle === opt.val ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]' : 'border-[hsl(var(--border))]'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {localIconStyle === 'UPLOADED_LOGO' && (
                  <div>
                    <label className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-dashed border-[hsl(var(--gold)/0.4)] cursor-pointer hover:border-[hsl(var(--gold))]">
                      <Upload size={16} className="text-[hsl(var(--gold))]"/>
                      <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{localLogoUrl ? 'Change' : 'Upload'}</span>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setLocalLogoUrl(r.result as string); r.readAsDataURL(f); }}/>
                    </label>
                    {localLogoUrl && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <img src={localLogoUrl} alt="Logo" className="w-10 h-10 rounded object-contain border border-[hsl(var(--border))]"/>
                        <button onClick={() => setLocalLogoUrl('')} className="text-[9px] text-destructive underline">Remove</button>
                      </div>
                    )}
                  </div>
                )}
                {localIconStyle === 'MONOGRAM' && (
                  <input type="text" maxLength={3} value={localMonogramText}
                    onChange={e => setLocalMonogramText(e.target.value.toUpperCase().slice(0, 3))}
                    placeholder={project?.company_name?.slice(0, 2) || 'AB'}
                    className="w-full px-2 py-1.5 rounded-lg border-2 border-[hsl(var(--gold)/0.4)] bg-white text-center text-sm font-bold tracking-widest text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--gold))]"/>
                )}
                <button onClick={applyLogoToAllConcepts}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white text-[10px] font-semibold flex items-center justify-center gap-1 hover:opacity-90">
                  <Wand2 size={10}/> Apply Logo to Stamps
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Center: Live Preview (always visible, 280px) ─────── */}
        <div className="w-[280px] flex-shrink-0 border-r border-[hsl(var(--border))] bg-white/60 flex flex-col overflow-y-auto">
          {/* Preview */}
          <div className="flex-shrink-0 p-3">
            <div className="bg-white rounded-xl border-2 border-[hsl(var(--gold)/0.25)] shadow-lg overflow-hidden">
              <div className="px-3 py-2 bg-gradient-to-r from-[hsl(var(--pearl-1))] to-white border-b border-[hsl(var(--border))] flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--gold))]"/>
                  <span className="text-[9px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-widest">Live Preview</span>
                </div>
                {selectedId && (
                  <Badge className="text-[8px] px-1 py-0 bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]">
                    <Check size={7} className="mr-0.5"/> Selected
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-center py-4 px-3 min-h-[240px] bg-[radial-gradient(circle_at_center,_hsl(var(--pearl-1))_0%,_white_70%)]">
                {generating ? (
                  <div className="flex flex-col items-center gap-2 text-[hsl(var(--muted-foreground))]">
                    <Loader2 size={28} className="animate-spin text-[hsl(var(--gold))]"/>
                    <p className="text-[10px] font-medium">Generating…</p>
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
                    size={220}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[hsl(var(--muted-foreground))]">
                    <Stamp size={32} className="opacity-20"/>
                    <p className="text-[10px] text-center">Select a design to preview</p>
                  </div>
                )}
              </div>
              {(selectedSvg || allConcepts[0]) && !generating && (
                <div className="border-t border-[hsl(var(--border))] px-3 py-2 flex gap-1.5">
                  <Button size="sm"
                    className="flex-1 h-7 text-[10px] bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1"
                    onClick={() => { const c = selectedConcept || allConcepts[0]; if (c) { setSelectedId(c.id); setPreviewConcept(c); } }}>
                    <Wand2 size={9}/> Edit & Export
                  </Button>
                  {selectedId && (
                    <Button size="sm" variant="outline"
                      className="h-7 px-2 text-[10px] border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] gap-1"
                      onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/export/${savedDesignId || selectedId}`)}>
                      <Download size={9}/>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Trade License Re-scan (collapsed by default since data already captured in wizard) */}
          <div className="flex-shrink-0 px-3 pb-3">
            {!licenseOpen ? (
              <button onClick={() => setLicenseOpen(true)}
                className="w-full flex items-center gap-1.5 py-1.5 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold-dark))] transition-colors">
                <Upload size={10} className="text-[hsl(var(--gold))]"/>
                <span>Re-scan Trade License</span>
              </button>
            ) : (
              <div className="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                <button onClick={() => setLicenseOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[hsl(var(--pearl-1))] transition-colors">
                  <div className="flex items-center gap-1.5">
                    <Upload size={11} className="text-[hsl(var(--gold))]"/>
                    <span className="text-[10px] font-medium text-[hsl(var(--foreground))]">Re-scan Trade License</span>
                  </div>
                  <X size={11} className="text-[hsl(var(--muted-foreground))]"/>
                </button>
                <div className="px-3 pt-2 pb-3 border-t border-[hsl(var(--border))]">
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
                      toast.info('License loaded — regenerating…', { duration: 2500 });
                      setTimeout(() => generateConcepts(updatedProject), 300);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Blocked warning */}
          {blocked && (
            <div className="px-3 pb-3">
              <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                <AlertTriangle size={14}/>
                <div>
                  <p className="font-semibold text-[10px]">Generation Blocked</p>
                  <p className="text-[9px]">Government seals cannot be generated.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Concepts Grid (scrollable) ────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Favorites */}
            {favoriteConcepts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={12} className="text-rose-500 fill-rose-500"/>
                  <h2 className="font-semibold text-[hsl(var(--foreground))] text-xs">Favorites ({favoriteConcepts.length})</h2>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
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
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-52 rounded-xl bg-[hsl(var(--muted))] animate-pulse"/>
                ))}
              </div>
            )}

            {/* Concepts grid — paginated */}
            {!generating && !blocked && concepts.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-[hsl(var(--foreground))] text-xs">
                    {concepts.length} Concepts
                    <span className="ml-1.5 text-[10px] font-normal text-[hsl(var(--muted-foreground))]">— click to select</span>
                  </h2>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setConceptPage(p => Math.max(0, p - 1))} disabled={conceptPage === 0}
                        className="w-6 h-6 rounded-md border border-[hsl(var(--border))] flex items-center justify-center disabled:opacity-30 hover:bg-[hsl(var(--gold)/0.06)]">
                        <ChevronLeft size={12}/>
                      </button>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium">{conceptPage + 1}/{totalPages}</span>
                      <button onClick={() => setConceptPage(p => Math.min(totalPages - 1, p + 1))} disabled={conceptPage >= totalPages - 1}
                        className="w-6 h-6 rounded-md border border-[hsl(var(--border))] flex items-center justify-center disabled:opacity-30 hover:bg-[hsl(var(--gold)/0.06)]">
                        <ChevronRight size={12}/>
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                  {pagedConcepts.map(concept => (
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
              <div className="text-center py-16 space-y-3">
                <Wand2 size={32} className="text-[hsl(var(--gold))] mx-auto"/>
                <p className="text-[hsl(var(--muted-foreground))] text-sm">Click "Regenerate" to create stamp concepts</p>
                <Button onClick={() => generateConcepts()} className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white">
                  <Wand2 size={14} className="mr-2"/> Generate Concepts
                </Button>
              </div>
            )}

            {/* Export CTA */}
            {selectedId && !generating && (
              <div className="bg-gradient-to-r from-[hsl(var(--gold)/0.08)] to-[hsl(var(--champagne-1))] rounded-xl border border-[hsl(var(--gold)/0.2)] p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))] text-sm">Ready to export!</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">SVG, PNG, JPG, PDF + brand pack</p>
                </div>
                <Button className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1.5 text-xs"
                  onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/export/${savedDesignId || selectedId}`)}>
                  <Download size={13}/> Export Pack
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Designer Floating Panel */}
      {chatOpen && (
        <div className="fixed z-[10050] flex flex-col bg-white rounded-2xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden"
          style={{ width: 340, maxHeight: aiPanelMinimized ? 'auto' : 'calc(100vh - 120px)', top: 60, right: 16,
            transform: `translate(${aiPanelPos.x}px, ${aiPanelPos.y}px)` }}>
          <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] cursor-grab active:cursor-grabbing select-none flex-shrink-0"
            onMouseDown={onAiPanelDragStart}>
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-white"/>
              <span className="font-bold text-xs text-white">Smart Designer</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setAiPanelMinimized(v => !v)}
                className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
                <span className="text-white font-bold text-[10px]">{aiPanelMinimized ? '▲' : '▬'}</span>
              </button>
              <button onClick={() => setChatOpen(false)}
                className="w-6 h-6 rounded-full bg-white flex items-center justify-center hover:bg-white/90">
                <X size={12} className="text-[hsl(var(--gold-dark))]"/>
              </button>
            </div>
          </div>
          {!aiPanelMinimized && (
            <>
              <div className="px-3 py-2 border-b border-[hsl(var(--border))] flex-shrink-0 bg-[hsl(var(--pearl-1))]">
                <p className="text-[9px] font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-1.5">Quick Suggestions</p>
                <div className="grid grid-cols-2 gap-1">
                  {['Make borders thicker & add star dividers', 'Switch to minimalist style', 'Add decorative inner ring', 'Make text larger and bolder'].map(eg => (
                    <button key={eg} onClick={() => sendChatMessage(eg)}
                      className="text-left text-[9px] p-1.5 bg-white rounded-md border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)] text-[hsl(var(--foreground))] transition-colors leading-tight">
                      {eg}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0" style={{ maxHeight: 200 }}>
                {chatMessages.length === 0 && (
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center py-3">Type an instruction or click a suggestion.</p>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-2.5 py-1.5 rounded-lg text-[10px] ${msg.role === 'user' ? 'bg-[hsl(var(--gold))] text-white' : 'bg-[hsl(var(--pearl-1))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[hsl(var(--pearl-1))] border border-[hsl(var(--border))] px-2.5 py-1.5 rounded-lg text-[10px] text-[hsl(var(--muted-foreground))]">
                      <Loader2 size={10} className="animate-spin inline mr-1"/>Designing…
                    </div>
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>
              {refinedPreview && (
                <div className="flex-shrink-0 border-t border-[hsl(var(--border))] px-3 py-2 space-y-2 bg-[hsl(var(--pearl-1))]">
                  <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Refined preview:</p>
                  <div className="flex items-center justify-center bg-white rounded-lg border border-[hsl(var(--border))] py-2">
                    <StampSVGRenderer svgSource={refinedPreview.svgSource} tintColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} size={110}/>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" className="flex-1 h-7 text-[10px] bg-[hsl(var(--gold))] text-white" onClick={() => { if (!selectedId) { toast.info('Select a stamp concept first, then click Replace'); return; } applyRefinement('replace'); }} >
                      Replace Selected
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))]" onClick={() => applyRefinement('new')}>
                      Save as New
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex-shrink-0 px-3 py-2 border-t border-[hsl(var(--border))] bg-white">
                <div className="flex gap-1.5">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                    placeholder="Describe changes…"
                    className="flex-1 h-8 px-2.5 text-[10px] border-2 border-[hsl(var(--border))] rounded-lg focus:outline-none focus:border-[hsl(var(--gold))] bg-white text-[hsl(var(--foreground))]"/>
                  <Button size="sm" className="h-8 px-2.5 bg-[hsl(var(--gold))] text-white" onClick={() => sendChatMessage()} disabled={chatLoading}>
                    <Send size={10}/>
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

// ─── Concept Card ────────────────────────────────────────────────
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
  const isRectShape = displaySvg.includes('<rect') && !displaySvg.match(/<circle[^>]*r="(9|10|11)/);

  return (
    <div
      className={`group bg-card/80 rounded-xl border-2 transition-all shadow-sm hover:shadow-md cursor-pointer ${isSelected ? 'border-gold shadow-[0_0_0_3px_hsl(var(--gold)/0.15)]' : 'border-gold/30 hover:border-gold/50'}`}
      onClick={() => onSelect(concept)}
    >
      <div className={`relative p-3 flex items-center justify-center bg-[hsl(var(--pearl-1))] rounded-t-xl ${isRectShape ? 'min-h-[100px]' : 'min-h-[140px]'}`}>
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center z-10">
            <Check size={10} className="text-white"/>
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); onToggleFav(concept); }} disabled={togglingFav === concept.id}
          className={`absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isFav ? 'bg-rose-50 border border-rose-200 text-rose-500' : 'bg-white/80 border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100'}`}>
          {togglingFav === concept.id ? <Loader2 size={9} className="animate-spin"/> : <Heart size={9} className={isFav ? 'fill-rose-500' : ''}/>}
        </button>
        <StampSVGRenderer svgSource={displaySvg} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} fontWeight={fontBold ? 'bold' : 'normal'} fontStyle={fontItalic ? 'italic' : 'normal'} fontSize={manualFontSize} inkMode={inkMode} size={isRectShape ? 160 : 130}/>
      </div>
      <div className="p-2 space-y-1.5">
        <p className="font-medium text-[11px] text-[hsl(var(--foreground))] truncate">{concept.label}</p>
        <div className="flex gap-1">
          <Button size="sm"
            className={`flex-1 h-6 text-[9px] gap-0.5 ${isSelected ? 'bg-[hsl(var(--gold))] text-white' : 'bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90'}`}
            onClick={e => { e.stopPropagation(); onSelect(concept); }}>
            {isSelected ? <><Check size={8}/> Preview</> : 'Select'}
          </Button>
          <Button size="sm" variant="outline"
            className="h-6 text-[9px] gap-0.5 border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] px-2"
            onClick={e => { e.stopPropagation(); onEditText(concept); }}>
            <Type size={8}/> Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
