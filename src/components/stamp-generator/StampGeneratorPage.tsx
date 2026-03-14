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
import { StampInteractivePreview } from '@/components/stamp-generator/StampInteractivePreview';
import DesignFavoriteButton from '@/components/toolkit/DesignFavoriteButton';
import { StampColorWheel } from '@/components/stamp-generator/StampColorWheel';
import { StampTextEditor } from '@/components/stamp-generator/StampTextEditor';
import { StampPreviewModal } from '@/components/stamp-generator/StampPreviewModal';
import { StampLicenseUploader } from '@/components/stamp-generator/StampLicenseUploader';
import { generateStampConcepts, StampDesignConcept } from '@/lib/stampTemplates';
import {
  Wand2, Loader2, Check, RefreshCw, Download, Stamp,
  ArrowLeft, ChevronRight, AlertTriangle, Heart, MessageSquare,
  Send, X, Sparkles, Palette, Layers, Type, Upload, ChevronDown,
  Undo2, Redo2, RotateCw, Save, ChevronLeft, Trash2, Copy,
  Clock, Package, Award
} from 'lucide-react';
import { useStampHistory } from '@/hooks/useStampHistory';
import { StampVariationsPanel } from './StampVariationsPanel';
import { StampRecentlyDeleted, DeletedStamp } from './StampRecentlyDeleted';
import { StampVersionSelector } from './StampVersionSelector';
import { useSaveBrandAsset } from '@/components/brand-assets/BrandAssetPicker';
import ShortlistBadgeButton from '@/components/ShortlistBadgeButton';
import { MonogramColorEditor, applyMonogramColors, DEFAULT_MONOGRAM_COLORS } from './MonogramColorEditor';
import type { MonogramLetterColors } from './MonogramColorEditor';

// New premium components
import { StampLeftPanel } from './StampLeftPanel';
import { StampRightPanel } from './StampRightPanel';
import { StampCanvasControls, CanvasGridOverlay } from './StampCanvasControls';
import { StampProjectHeader } from './StampProjectHeader';

type ColorStop = 'primary' | 'secondary' | 'accent';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Inject logo/monogram into an existing SVG source string */
function injectCenterArt(svgSource: string, iconStyle: string, monogramText: string, logoUrl: string): string {
  let svg = svgSource;
  svg = svg.replace(/<defs><clipPath id="center-clip">[\s\S]*?<\/clipPath><\/defs>/gi, '');
  svg = svg.replace(/<image[^>]*clip-path="url\(#center-clip\)"[^>]*\/>/gi, '');
  svg = svg.replace(/<text[^>]*dominant-baseline="central"[^>]*>[^<]*<\/text>/gi, '');
  if (iconStyle === 'NONE') return svg;
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
  const [generatingInPanel, setGeneratingInPanel] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Standard Model — the pinned working design that is never lost during generation
  const [standardConcept, setStandardConcept] = useState<StampDesignConcept | null>(null);
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
  const [fontFamily, setFontFamilyRaw] = useState<string>(() => ssGet(ssKey('fontFamily'), 'Georgia, "Times New Roman", serif'));
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

  // My Stamp tab state
  const [uploadedStampUrl, setUploadedStampUrl] = useState<string>('');
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState<string>('');
  const [signatureX, setSignatureX] = useState(50);
  const [signatureY, setSignatureY] = useState(80);
  const [signatureLocked, setSignatureLocked] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [refiningImage, setRefiningImage] = useState(false);

  // Center Art controls
  const [localIconStyle, setLocalIconStyle] = useState<'NONE' | 'MONOGRAM' | 'UPLOADED_LOGO'>('MONOGRAM');
  const [localMonogramText, setLocalMonogramText] = useState<string>('');
  const [localLogoUrl, setLocalLogoUrlRaw] = useState<string>('');
  const setLocalLogoUrl = (v: string) => { setLocalLogoUrlRaw(v); if (projectId) { try { if (v) localStorage.setItem(`stamp-logo-${projectId}`, v); else localStorage.removeItem(`stamp-logo-${projectId}`); } catch {} } };

  // Custom user color palette
  const [customPalette, setCustomPaletteRaw] = useState<string[]>(() => { try { const v = localStorage.getItem('stamp-custom-palette'); return v ? JSON.parse(v) : []; } catch { return []; } });
  const setCustomPalette = (v: string[]) => { setCustomPaletteRaw(v); try { localStorage.setItem('stamp-custom-palette', JSON.stringify(v)); } catch {} };
  const addCustomColor = (hex: string) => { if (customPalette.length >= 5) { toast.error('Max 5 custom colors'); return; } if (customPalette.includes(hex)) return; setCustomPalette([...customPalette, hex]); toast.success('Color saved'); };
  const removeCustomColor = (hex: string) => { setCustomPalette(customPalette.filter(c => c !== hex)); };

  // Monogram per-letter color state
  const [monogramLetterColors, setMonogramLetterColors] = useState<MonogramLetterColors>(DEFAULT_MONOGRAM_COLORS);

  // Arabic font controls — persisted
  const [arabicFont, setArabicFontRaw] = useState(() => ssGet(ssKey('arabicFont'), '"Noto Naskh Arabic", serif'));
  const setArabicFont = (v: string) => { setArabicFontRaw(v); ssSave(ssKey('arabicFont'), v); };
  const [arabicLetterSpacing, setArabicLetterSpacingRaw] = useState(() => ssGet(ssKey('arabicLetterSpacing'), 3));
  const setArabicLetterSpacing = (v: number) => { setArabicLetterSpacingRaw(v); ssSave(ssKey('arabicLetterSpacing'), v); };
  const [arabicArcSpread, setArabicArcSpreadRaw] = useState(() => ssGet(ssKey('arabicArcSpread'), 0.88));
  const setArabicArcSpread = (v: number) => { setArabicArcSpreadRaw(v); ssSave(ssKey('arabicArcSpread'), v); };
  const [arabicFontWeight, setArabicFontWeightRaw] = useState(() => ssGet(ssKey('arabicFontWeight'), 'bold'));
  const setArabicFontWeight = (v: string) => { setArabicFontWeightRaw(v); ssSave(ssKey('arabicFontWeight'), v); };

  // Spacing & Layout controls — persisted
  const [arcTextSpacing, setArcTextSpacingRaw] = useState(() => ssGet(ssKey('arcTextSpacing'), 2));
  const setArcTextSpacing = (v: number) => { setArcTextSpacingRaw(v); ssSave(ssKey('arcTextSpacing'), v); };
  const [circleGap, setCircleGapRaw] = useState(() => ssGet(ssKey('circleGap'), 13));
  const setCircleGap = (v: number) => { setCircleGapRaw(v); ssSave(ssKey('circleGap'), v); };
  const [separatorDistance, setSeparatorDistanceRaw] = useState(() => ssGet(ssKey('separatorDistance'), 8));
  const setSeparatorDistance = (v: number) => { setSeparatorDistanceRaw(v); ssSave(ssKey('separatorDistance'), v); };
  const [centerContentSize, setCenterContentSizeRaw] = useState(() => ssGet(ssKey('centerContentSize'), 40));
  const setCenterContentSize = (v: number) => { setCenterContentSizeRaw(v); ssSave(ssKey('centerContentSize'), v); };

  // Government Mode — persisted
  const [governmentMode, setGovernmentModeRaw] = useState(() => ssGet(ssKey('governmentMode'), false));
  const setGovernmentMode = (v: boolean) => { setGovernmentModeRaw(v); ssSave(ssKey('governmentMode'), v); };

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

  // Variations panel
  const [variations, setVariations] = useState<StampDesignConcept[]>([]);
  const [variationsLoading, setVariationsLoading] = useState(false);

  // Recently deleted
  const [deletedStamps, setDeletedStamps] = useState<DeletedStamp[]>([]);

  // Brand asset save
  const saveBrandAsset = useSaveBrandAsset();

  // Canvas controls
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [bgMode, setBgMode] = useState<'white' | 'checker'>('white');

  // Project save state
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Preview update feedback
  const [previewPulse, setPreviewPulse] = useState(false);

  const handleSvgUndoStudio = useCallback(() => {
    const prev = svgHistory.undo();
    if (prev) setSvgOverrides(prev);
  }, [svgHistory]);

  const handleSvgRedoStudio = useCallback(() => {
    const next = svgHistory.redo();
    if (next) setSvgOverrides(next);
  }, [svgHistory]);

  // Trigger pulse on color/font changes
  const triggerPulse = useCallback(() => {
    setPreviewPulse(true);
    setTimeout(() => setPreviewPulse(false), 300);
  }, []);

  // Wrap color setters with pulse
  const setPrimaryColorWithPulse = useCallback((v: string) => { setPrimaryColor(v); triggerPulse(); }, [triggerPulse]);
  const setSecondaryColorWithPulse = useCallback((v: string | undefined) => { setSecondaryColor(v); triggerPulse(); }, [triggerPulse]);
  const setAccentColorWithPulse = useCallback((v: string | undefined) => { setAccentColor(v); triggerPulse(); }, [triggerPulse]);

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
    const savedLogo = projectId ? localStorage.getItem(`stamp-logo-${projectId}`) : null;
    setLocalLogoUrlRaw(savedLogo || (data as any).uploaded_logo_url || '');
    const isFresh = new URLSearchParams(location.search).get('fresh') === '1';
    const { data: existing } = await supabase
      .from('stamp_designs')
      .select('id, svg_source, template_key, is_favorite')
      .eq('project_id', projectId)
      .is('deleted_at', null)
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
      // Set standard from first design (T0)
      const firstDesign = regular[0] || favs[0];
      if (firstDesign && !standardConcept) {
        setStandardConcept(firstDesign);
        setSelectedId(firstDesign.id);
      }
    } else {
      generateConcepts(data);
    }
  }

  const generateConcepts = useCallback(async (proj?: any) => {
    const p = proj || project;
    if (!p) return;
    // Only show center spinner on very first generation (no standard yet)
    const isFirstGen = !standardConcept;
    if (isFirstGen) setGenerating(true);
    setGeneratingInPanel(true);
    setBlocked(false);
    // Don't clear svgOverrides — preserve standard edits
    try {
      if (session?.access_token) {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-stamp-generator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: 'generate', project: { ...project, ...p }, projectId }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.blocked) { setBlocked(true); setGenerating(false); setGeneratingInPanel(false); return; }
          if (json.concepts?.length) {
            const { data: saved } = await supabase
              .from('stamp_designs')
              .select('id, svg_source, template_key, is_favorite')
              .eq('project_id', projectId)
              .eq('is_favorite', false)
              .order('created_at', { ascending: false })
              .limit(11);
            if (saved && saved.length > 0) {
              const newConcepts = saved.map((d: any) => ({
                id: d.id, templateKey: d.template_key || 'classic-double',
                label: (d.template_key || 'classic-double').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                tags: [] as string[], svgSource: d.svg_source || '', isFavorite: false,
              }));
              setConcepts(newConcepts);
              if (!standardConcept && newConcepts[0]) {
                setStandardConcept(newConcepts[0]);
                setSelectedId(newConcepts[0].id);
              }
              setGenerating(false);
              setGeneratingInPanel(false);
              return;
            }
          }
        }
      }
    } catch (_) {}
    const clientConcepts = generateStampConcepts(project ? { ...project, ...p } : p);
    if (clientConcepts[0]?.templateKey === 'blocked') { setBlocked(true); setGenerating(false); setGeneratingInPanel(false); return; }
    setConcepts(clientConcepts);
    // Set standard on first generation
    if (!standardConcept && clientConcepts.length > 0) {
      setStandardConcept(clientConcepts[0]);
      setSelectedId(clientConcepts[0].id);
    }
    setGenerating(false);
    setGeneratingInPanel(false);
  }, [project, session, projectId, standardConcept]);

  async function toggleFavorite(concept: StampDesignConcept) {
    setTogglingFav(concept.id);
    const newFav = !concept.isFavorite;
    const isDbId = concept.id.length === 36;
    let dbId = isDbId ? concept.id : null;
    if (!isDbId) {
      const { data } = await supabase.from('stamp_designs').insert({
        project_id: projectId, user_id: user!.id, design_version: 1, template_key: concept.templateKey,
        svg_source: svgOverrides[concept.id] || concept.svgSource, style_snapshot_json: project, is_favorite: true,
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
        toast.success('Added to favorites');
      } else {
        setFavoriteConcepts(prev => prev.filter(f => f.id !== dbId));
        setConcepts(prev => prev.map(c => c.id === dbId ? { ...c, isFavorite: false } : c));
        toast('Removed from favorites');
      }
    }
    setTogglingFav(null);
  }

  function handleSelectConcept(concept: StampDesignConcept) {
    // Swap: previous standard moves into concepts list, clicked becomes new standard
    if (standardConcept && standardConcept.id !== concept.id) {
      // Ensure old standard is in concepts list
      setConcepts(prev => {
        const exists = prev.some(c => c.id === standardConcept.id);
        const filtered = prev.filter(c => c.id !== concept.id);
        return exists ? filtered : [standardConcept, ...filtered];
      });
    }
    setStandardConcept(concept);
    setSelectedId(concept.id);
    toast.success('Design applied as Standard', { duration: 2000 });
  }

  function handleOpenPreview(concept: StampDesignConcept) {
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

  function applyLogoToAllConcepts() {
    const updated = { ...project, icon_style: localIconStyle, monogram_text: localMonogramText || null, uploaded_logo_url: localLogoUrl || null };
    setProject(updated);
    const newOverrides: Record<string, string> = { ...svgOverrides };
    [...favoriteConcepts, ...concepts].forEach(c => {
      let base = svgOverrides[c.id] || c.svgSource;
      base = injectCenterArt(base, localIconStyle, localMonogramText, localLogoUrl);
      if (localIconStyle === 'MONOGRAM' && localMonogramText) {
        base = applyMonogramColors(base, localMonogramText, monogramLetterColors, primaryColor);
      }
      newOverrides[c.id] = base;
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
            id: json.id || crypto.randomUUID(), templateKey: 'ai-refined',
            label: 'AI Refined Design', tags: ['ai', 'refined', 'custom'], svgSource: json.svgSource,
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

  async function generateVariations() {
    if (!project || !session?.access_token) return;
    setVariationsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-stamp-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'variations', project, projectId }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.concepts) setVariations(prev => [...prev, ...json.concepts]);
      }
    } catch { toast.error('Failed to generate variations'); }
    setVariationsLoading(false);
  }

  async function softDeleteConcept(conceptId: string) {
    const isDbId = conceptId.length === 36;
    if (isDbId) {
      await supabase.from('stamp_designs').update({ deleted_at: new Date().toISOString() }).eq('id', conceptId);
      const deleted = concepts.find(c => c.id === conceptId) || favoriteConcepts.find(c => c.id === conceptId);
      if (deleted) {
        setDeletedStamps(prev => [...prev, { id: conceptId, svg_source: svgOverrides[conceptId] || deleted.svgSource, template_key: deleted.templateKey, deleted_at: new Date().toISOString(), label: deleted.label }]);
      }
    }
    setConcepts(prev => prev.filter(c => c.id !== conceptId));
    setFavoriteConcepts(prev => prev.filter(c => c.id !== conceptId));
    if (selectedId === conceptId) setSelectedId(null);
    toast.success('Moved to recently deleted');
  }

  async function recoverDeletedStamp(id: string) {
    await supabase.from('stamp_designs').update({ deleted_at: null }).eq('id', id);
    const item = deletedStamps.find(d => d.id === id);
    if (item) {
      setConcepts(prev => [...prev, { id: item.id, templateKey: item.template_key, label: item.label, tags: [], svgSource: item.svg_source }]);
    }
    setDeletedStamps(prev => prev.filter(d => d.id !== id));
    toast.success('Design recovered');
  }

  async function permanentDeleteStamp(id: string) {
    await supabase.from('stamp_designs').delete().eq('id', id);
    setDeletedStamps(prev => prev.filter(d => d.id !== id));
    toast.success('Permanently deleted');
  }

  async function adaptAndSaveAsAsset(item: DeletedStamp) {
    await saveBrandAsset({ assetType: 'stamp', name: item.label || 'Stamp Design', svgContent: item.svg_source, sourceId: item.id });
    setDeletedStamps(prev => prev.filter(d => d.id !== item.id));
  }

  async function saveCurrentAsBrandAsset() {
    const concept = allConcepts.find(c => c.id === selectedId) || allConcepts[0];
    if (!concept) return;
    const svg = svgOverrides[concept.id] || concept.svgSource;
    await saveBrandAsset({ assetType: 'stamp', name: concept.label || project?.company_name || 'Stamp', svgContent: svg, sourceId: concept.id });
  }

  function duplicateConcept(concept: StampDesignConcept) {
    const dup: StampDesignConcept = { ...concept, id: crypto.randomUUID(), label: `${concept.label} (copy)` };
    setConcepts(prev => [dup, ...prev]);
    toast.success('Concept duplicated');
  }

  // Load deleted stamps
  useEffect(() => {
    if (!user || !projectId) return;
    supabase.from('stamp_designs').select('id, svg_source, template_key, deleted_at').eq('project_id', projectId).not('deleted_at', 'is', null).order('deleted_at', { ascending: false }).limit(20)
      .then(({ data }) => {
        if (data) setDeletedStamps(data.map((d: any) => ({
          id: d.id, svg_source: d.svg_source || '', template_key: d.template_key || '', deleted_at: d.deleted_at,
          label: (d.template_key || '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        })));
      });
  }, [user, projectId]);

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

  // AI Refine handler for left panel
  const handleRefineWithAI = useCallback(async () => {
    if (!refinePrompt.trim()) { toast.error('Enter a prompt'); return; }
    setRefiningImage(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-stamp-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ action: 'refine-image', imageBase64: uploadedStampUrl, prompt: refinePrompt, projectId }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.imageUrl) { setUploadedStampUrl(json.imageUrl); toast.success('Stamp refined by AI!'); setRefinePrompt(''); }
        else toast.error(json.error || 'Refinement failed');
      } else if (res.status === 429) toast.error('Rate limit exceeded.');
      else if (res.status === 402) toast.error('Credits exhausted.');
      else toast.error('Refinement failed');
    } catch { toast.error('Connection error'); }
    setRefiningImage(false);
  }, [refinePrompt, uploadedStampUrl, session, projectId]);

  const activeColor = activeStop === 'primary' ? primaryColor : activeStop === 'secondary' ? (secondaryColor || '#2a3a5c') : (accentColor || '#B8860B');
  function setActiveColor(hex: string) {
    if (activeStop === 'primary') setPrimaryColorWithPulse(hex);
    else if (activeStop === 'secondary') setSecondaryColorWithPulse(hex);
    else setAccentColorWithPulse(hex);
  }

  const allConcepts = [...favoriteConcepts, ...concepts.filter(c => !favoriteConcepts.some(f => f.id === c.id))];
  // Standard always drives the center preview
  const activeStandard = standardConcept || allConcepts[0] || null;
  const selectedConcept = activeStandard;
  const selectedSvg = activeStandard ? (svgOverrides[activeStandard.id] || activeStandard.svgSource) : null;

  function handleSvgTextChange(conceptId: string, newSvg: string) {
    setSvgOverrides(prev => ({ ...prev, [conceptId]: newSvg }));
  }

  // Computed stamp size based on zoom
  const baseStampSize = 320;
  const stampSize = Math.round(baseStampSize * (zoom / 100));

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[hsl(var(--gold))]" size={32} />
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

      {/* ── Header ── */}
      <StampProjectHeader
        projectName={project.company_name || 'Untitled'}
        languageMode={project.language_mode}
        canUndo={svgHistory.canUndo}
        canRedo={svgHistory.canRedo}
        onUndo={handleSvgUndoStudio}
        onRedo={handleSvgRedoStudio}
        onBack={() => navigate('/toolkit/stamp-generator/projects')}
        onGallery={() => navigate(`/toolkit/stamp-generator/${projectId}/gallery`)}
        onToggleChat={() => setChatOpen(v => !v)}
        onExport={() => navigate(`/toolkit/stamp-generator/${projectId}/export/${savedDesignId || selectedId}`)}
        onSaveAsset={saveCurrentAsBrandAsset}
        selectedId={selectedId}
        saving={saving}
        lastSaved={lastSaved}
      />

      {/* ── 3-Column Studio Body ── */}
      <div className="flex-1 flex gap-0 overflow-hidden">

        {/* ── LEFT PANEL: Collapsible Tool Controls ── */}
        <StampLeftPanel
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
          activeStop={activeStop}
          activeColor={activeColor}
          inkMode={inkMode}
          customPalette={customPalette}
          onSetPrimaryColor={setPrimaryColorWithPulse}
          onSetSecondaryColor={setSecondaryColorWithPulse}
          onSetAccentColor={setAccentColorWithPulse}
          onSetActiveStop={setActiveStop}
          onSetActiveColor={setActiveColor}
          onSetInkMode={setInkMode}
          onAddCustomColor={addCustomColor}
          onRemoveCustomColor={removeCustomColor}
          onResetColors={() => { setPrimaryColor('#1B3A8C'); setSecondaryColor('#1a2d6e'); setAccentColor('#1B3A8C'); setMonogramLetterColors(DEFAULT_MONOGRAM_COLORS); toast.success('Colors reset'); triggerPulse(); }}
          fontFamily={fontFamily}
          fontBold={fontBold}
          fontItalic={fontItalic}
          manualFontSize={manualFontSize}
          onSetFontFamily={(v) => { setFontFamily(v); triggerPulse(); }}
          onSetFontBold={(v) => { setFontBold(v); triggerPulse(); }}
          onSetFontItalic={(v) => { setFontItalic(v); triggerPulse(); }}
          onSetManualFontSize={(v) => { setManualFontSize(v); triggerPulse(); }}
          selectedSvg={selectedSvg}
          selectedConceptId={selectedId}
          onSvgTextChange={handleSvgTextChange}
          localIconStyle={localIconStyle}
          localMonogramText={localMonogramText}
          localLogoUrl={localLogoUrl}
          monogramLetterColors={monogramLetterColors}
          companyName={project.company_name}
          onSetLocalIconStyle={setLocalIconStyle}
          onSetLocalMonogramText={setLocalMonogramText}
          onSetLocalLogoUrl={setLocalLogoUrl}
          onSetMonogramLetterColors={setMonogramLetterColors}
          onApplyLogoToAll={applyLogoToAllConcepts}
          uploadedStampUrl={uploadedStampUrl}
          uploadedSignatureUrl={uploadedSignatureUrl}
          signatureX={signatureX}
          signatureY={signatureY}
          signatureLocked={signatureLocked}
          refinePrompt={refinePrompt}
          refiningImage={refiningImage}
          onSetUploadedStampUrl={setUploadedStampUrl}
          onSetUploadedSignatureUrl={setUploadedSignatureUrl}
          onSetSignatureX={setSignatureX}
          onSetSignatureY={setSignatureY}
          onSetSignatureLocked={setSignatureLocked}
          onSetRefinePrompt={setRefinePrompt}
          onRefineWithAI={handleRefineWithAI}
          hasSelectedSvg={!!selectedSvg}
          arabicFont={arabicFont}
          arabicLetterSpacing={arabicLetterSpacing}
          arabicArcSpread={arabicArcSpread}
          arabicFontWeight={arabicFontWeight}
          onSetArabicFont={setArabicFont}
          onSetArabicLetterSpacing={setArabicLetterSpacing}
          onSetArabicArcSpread={setArabicArcSpread}
          onSetArabicFontWeight={setArabicFontWeight}
          arcTextSpacing={arcTextSpacing}
          circleGap={circleGap}
          separatorDistance={separatorDistance}
          centerContentSize={centerContentSize}
          onSetArcTextSpacing={setArcTextSpacing}
          onSetCircleGap={setCircleGap}
          onSetSeparatorDistance={setSeparatorDistance}
          onSetCenterContentSize={setCenterContentSize}
        />

        {/* ── CENTER: Premium Canvas Preview ── */}
        <div className="flex-1 min-w-[300px] flex flex-col overflow-hidden relative">
          <div className="flex-1 flex items-center justify-center overflow-auto relative"
            style={{
              background: bgMode === 'checker'
                ? 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, white 0% 50%) 0 0 / 20px 20px'
                : 'radial-gradient(circle at center, hsl(var(--pearl-1)) 0%, white 70%)'
            }}>

            {/* Grid overlay */}
            {showGrid && <CanvasGridOverlay size={stampSize + 80} />}

            {/* Stamp preview with pulse feedback */}
            <div className={`relative transition-all duration-200 ${previewPulse ? 'ring-2 ring-[hsl(var(--gold)/0.4)] rounded-full' : ''}`}
              style={{ filter: `drop-shadow(0 8px 24px hsl(0 0% 0% / 0.12))` }}>
              {generating && !activeStandard ? (
                <div className="flex flex-col items-center gap-2 text-[hsl(var(--muted-foreground))]" style={{ width: stampSize, height: stampSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={28} className="animate-spin text-[hsl(var(--gold))]" />
                  <p className="text-[10px] font-medium">Generating…</p>
                </div>
              ) : uploadedStampUrl ? (
                <div className="relative">
                  <img src={uploadedStampUrl} alt="Uploaded stamp" style={{ maxWidth: stampSize, maxHeight: stampSize }} className="object-contain" />
                  {uploadedSignatureUrl && (
                    <img src={uploadedSignatureUrl} alt="Signature" className="absolute h-10 object-contain pointer-events-none opacity-80"
                      style={{ left: `${signatureX}%`, top: `${signatureY}%`, transform: 'translate(-50%, -50%)' }} />
                  )}
                </div>
              ) : (selectedSvg || allConcepts[0]?.svgSource) ? (
                <div className="relative">
                  <StampInteractivePreview
                    svgSource={selectedSvg || (svgOverrides[allConcepts[0]?.id] || allConcepts[0]?.svgSource) || ''}
                    tintColor={primaryColor}
                    secondaryColor={secondaryColor}
                    accentColor={accentColor}
                    fontFamily={fontFamily}
                    fontWeight={fontBold ? 'bold' : 'normal'}
                    fontStyle={fontItalic ? 'italic' : 'normal'}
                    fontSize={manualFontSize}
                    inkMode={inkMode}
                    size={stampSize}
                    onSvgChange={(newSvg) => {
                      const id = selectedId || allConcepts[0]?.id;
                      if (id) {
                        const newOverrides = { ...svgOverrides, [id]: newSvg };
                        setSvgOverrides(newOverrides);
                        svgHistory.push(newOverrides);
                      }
                    }}
                    onSeparatorChange={(style) => {
                      if (project) {
                        const updated = { ...project, separator_style: style };
                        setProject(updated);
                        generateConcepts(updated);
                      }
                    }}
                    onCenterModeChange={(mode, options) => {
                      if (mode === 'logo') setLocalIconStyle('UPLOADED_LOGO');
                      else if (mode === 'monogram' || mode === 'initials') setLocalIconStyle('MONOGRAM');
                      else if (mode === 'none') setLocalIconStyle('NONE');
                      const id = selectedId || allConcepts[0]?.id;
                      if (id) {
                        const base = svgOverrides[id] || allConcepts.find(c => c.id === id)?.svgSource || '';
                        const newSvg = injectCenterArt(base,
                          mode === 'logo' ? 'UPLOADED_LOGO' : mode === 'none' ? 'NONE' : 'MONOGRAM',
                          localMonogramText, localLogoUrl);
                        setSvgOverrides(prev => ({ ...prev, [id]: newSvg }));
                      }
                    }}
                    currentSeparatorStyle={project?.separator_style}
                    currentCenterMode={localIconStyle === 'UPLOADED_LOGO' ? 'logo' : localIconStyle === 'NONE' ? 'none' : 'monogram'}
                  />
                  {uploadedSignatureUrl && (
                    <img src={uploadedSignatureUrl} alt="Signature" className="absolute h-10 object-contain pointer-events-none opacity-80"
                      style={{ left: `${signatureX}%`, top: `${signatureY}%`, transform: 'translate(-50%, -50%)' }} />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[hsl(var(--muted-foreground))]" style={{ width: stampSize, height: stampSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stamp size={32} className="opacity-20" />
                  <p className="text-[10px] text-center">Select a design to preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Canvas bottom toolbar: Edit & Export + Zoom Controls */}
          <div className="flex-shrink-0 border-t border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {(selectedSvg || allConcepts[0]) && !generating && (
                <>
                  <Button size="sm"
                    className="h-7 text-[10px] bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1"
                    onClick={() => { const c = selectedConcept || allConcepts[0]; if (c) { setSelectedId(c.id); setPreviewConcept(c); } }}>
                    <Wand2 size={9} /> Edit & Export
                  </Button>
                  {selectedId && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] gap-1"
                        onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/export/${savedDesignId || selectedId}`)}>
                        <Download size={9} />
                      </Button>
                      <DesignFavoriteButton itemType="stamp" itemId={selectedId}
                        itemName={(selectedConcept || allConcepts[0])?.label || "Stamp"}
                        thumbnailSvg={(selectedSvg || allConcepts[0]?.svgSource || '').slice(0, 50000)} size="sm" />
                    </>
                  )}
                </>
              )}
            </div>

            {/* Zoom controls */}
            <StampCanvasControls
              zoom={zoom}
              showGrid={showGrid}
              bgMode={bgMode}
              onZoomChange={setZoom}
              onToggleGrid={() => setShowGrid(v => !v)}
              onToggleBg={() => setBgMode(v => v === 'white' ? 'checker' : 'white')}
            />
          </div>
        </div>

        {/* ── RIGHT PANEL: Tabbed Library ── */}
        <StampRightPanel
          concepts={concepts}
          favoriteConcepts={favoriteConcepts}
          generating={generatingInPanel}
          blocked={blocked}
          selectedId={activeStandard?.id || selectedId}
          svgOverrides={svgOverrides}
          tintColor={primaryColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
          fontFamily={fontFamily}
          fontBold={fontBold}
          fontItalic={fontItalic}
          manualFontSize={manualFontSize}
          inkMode={inkMode}
          togglingFav={togglingFav}
          variations={variations}
          variationsLoading={variationsLoading}
          deletedStamps={deletedStamps}
          standardConcept={standardConcept}
          onSelect={handleSelectConcept}
          onToggleFav={toggleFavorite}
          onEditText={handleEditText}
          onPreview={handleOpenPreview}
          onDelete={(c) => { if (standardConcept?.id === c.id) return; softDeleteConcept(c.id); }}
          onDuplicate={duplicateConcept}
          onGenerate={() => generateConcepts()}
          onGenerateVariations={generateVariations}
          onSelectVariation={(v) => {
            const newConcept: StampDesignConcept = { ...v, id: crypto.randomUUID() };
            setConcepts(prev => [newConcept, ...prev]);
            handleSelectConcept(newConcept);
            setSvgOverrides(prev => ({ ...prev, [newConcept.id]: v.svgSource }));
          }}
          onDeleteVariation={(id) => setVariations(prev => prev.filter(v => v.id !== id))}
          onDuplicateVariation={(v) => setVariations(prev => [...prev, { ...v, id: crypto.randomUUID(), label: `${v.label} (copy)` }])}
          onRecoverDeleted={recoverDeletedStamp}
          onPermanentDelete={permanentDeleteStamp}
          onAdaptAndSave={adaptAndSaveAsAsset}
          projectId={projectId}
          onSelectVersion={(v) => {
            const newConcept: StampDesignConcept = {
              id: v.id, templateKey: v.template_key,
              label: v.template_key.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
              tags: [], svgSource: v.svg_source,
            };
            setConcepts(prev => [newConcept, ...prev.filter(c => c.id !== v.id)]);
            handleSelectConcept(newConcept);
          }}
          onSaveBothVersions={(v) => {
            const newConcept: StampDesignConcept = {
              id: crypto.randomUUID(), templateKey: v.template_key,
              label: `${v.template_key.replace(/-/g, ' ')} (restored)`, tags: [], svgSource: v.svg_source,
            };
            setConcepts(prev => [newConcept, ...prev]);
            toast.success('Both versions saved');
          }}
          onDuplicateVersion={(v) => {
            const dup: StampDesignConcept = {
              id: crypto.randomUUID(), templateKey: v.template_key,
              label: `${v.template_key.replace(/-/g, ' ')} (restored)`, tags: [], svgSource: v.svg_source,
            };
            setConcepts(prev => [dup, ...prev]);
            toast.success('Version duplicated');
          }}
          onUploadNew={() => {}}
          savedDesignId={savedDesignId}
          onExport={() => navigate(`/toolkit/stamp-generator/${projectId}/export/${savedDesignId || activeStandard?.id || selectedId}`)}
        />
      </div>

      {/* AI Designer Floating Panel */}
      {chatOpen && (
        <div className="fixed z-[10050] flex flex-col bg-white rounded-2xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden"
          style={{ width: 340, maxHeight: aiPanelMinimized ? 'auto' : 'calc(100vh - 120px)', top: 60, right: 16,
            transform: `translate(${aiPanelPos.x}px, ${aiPanelPos.y}px)` }}>
          <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] cursor-grab active:cursor-grabbing select-none flex-shrink-0"
            onMouseDown={onAiPanelDragStart}>
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-white" />
              <span className="font-bold text-xs text-white">Smart Designer</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setAiPanelMinimized(v => !v)}
                className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
                <span className="text-white font-bold text-[10px]">{aiPanelMinimized ? '▲' : '▬'}</span>
              </button>
              <button onClick={() => setChatOpen(false)}
                className="w-6 h-6 rounded-full bg-white flex items-center justify-center hover:bg-white/90">
                <X size={12} className="text-[hsl(var(--gold-dark))]" />
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
                      <Loader2 size={10} className="animate-spin inline mr-1" />Designing…
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {refinedPreview && (
                <div className="flex-shrink-0 border-t border-[hsl(var(--border))] px-3 py-2 space-y-2 bg-[hsl(var(--pearl-1))]">
                  <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Refined preview:</p>
                  <div className="flex items-center justify-center bg-white rounded-lg border border-[hsl(var(--border))] py-2">
                    <StampSVGRenderer svgSource={refinedPreview.svgSource} tintColor={primaryColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} size={110} />
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" className="flex-1 h-7 text-[10px] bg-[hsl(var(--gold))] text-white" onClick={() => { if (!selectedId) { toast.info('Select a stamp first'); return; } applyRefinement('replace'); }}>
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
                    className="flex-1 h-8 px-2.5 text-[10px] border-2 border-[hsl(var(--border))] rounded-lg focus:outline-none focus:border-[hsl(var(--gold))] bg-white text-[hsl(var(--foreground))]" />
                  <Button size="sm" className="h-8 px-2.5 bg-[hsl(var(--gold))] text-white" onClick={() => sendChatMessage()} disabled={chatLoading}>
                    <Send size={10} />
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
