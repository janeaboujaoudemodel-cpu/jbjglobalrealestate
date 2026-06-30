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
import type { SelectedElement } from '@/components/stamp-generator/StampInteractivePreview';
import DesignFavoriteButton from '@/components/toolkit/DesignFavoriteButton';
import { StampColorWheel } from '@/components/stamp-generator/StampColorWheel';
import { StampTextEditor } from '@/components/stamp-generator/StampTextEditor';
import { StampPreviewModal } from '@/components/stamp-generator/StampPreviewModal';
import { StampLicenseUploader } from '@/components/stamp-generator/StampLicenseUploader';
import { generateStampConcepts, StampDesignConcept } from '@/lib/stampTemplates';
import { generateOfficialStampSVG, type OfficialStampConfig } from '@/lib/stampOfficialTemplate';
import {
  Wand2, Loader2, Check, RefreshCw, Download, Stamp,
  ArrowLeft, ChevronRight, AlertTriangle, Heart, MessageSquare,
  Send, X, Sparkles, Palette, Layers, Type, Upload, ChevronDown,
  Undo2, Redo2, RotateCw, Save, ChevronLeft, Trash2, Copy,
  Clock, Package, Award, Shield
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
import { StampSaveDialog } from './StampSaveDialog';
import { useOwnerVerification } from '@/hooks/useOwnerVerification';
import { SUPABASE_URL } from "@/config/backend";

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
  const centerR = S * 0.18;
  const insertBefore = '</svg>';
  if (iconStyle === 'UPLOADED_LOGO' && logoUrl) {
    const imgSize = centerR * 2.6;
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
  const { isOwner } = useOwnerVerification();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [libraryTabRef, setLibraryTabRef] = useState<(() => void) | null>(null);

  const [project, setProject] = useState<any>(null);
  const ssKey = (k: string) => `stamp-gen-${projectId}-${k}`;

  const [concepts, setConcepts] = useState<StampDesignConcept[]>([]);
  const [favoriteConcepts, setFavoriteConcepts] = useState<StampDesignConcept[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Standard Model — the pinned working design that is never lost during generation
  const [standardConcept, setStandardConcept] = useState<StampDesignConcept | null>(null);
  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  // Compare mode — side-by-side preview
  const [compareDesign, setCompareDesign] = useState<StampDesignConcept | null>(null);

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
  const [arabicArcSpread, setArabicArcSpreadRaw] = useState(() => ssGet(ssKey('arabicArcSpread'), 0.98));
  const setArabicArcSpread = (v: number) => { setArabicArcSpreadRaw(v); ssSave(ssKey('arabicArcSpread'), v); };
  const [arabicFontWeight, setArabicFontWeightRaw] = useState(() => ssGet(ssKey('arabicFontWeight'), 'bold'));
  const setArabicFontWeight = (v: string) => { setArabicFontWeightRaw(v); ssSave(ssKey('arabicFontWeight'), v); };
  const [arabicFontSize, setArabicFontSizeRaw] = useState<number | null>(() => ssGet(ssKey('arabicFontSize'), null));
  const setArabicFontSize = (v: number | null | ((p: number | null) => number | null)) => {
    setArabicFontSizeRaw(prev => { const next = typeof v === 'function' ? v(prev) : v; ssSave(ssKey('arabicFontSize'), next); return next; });
  };
  const [arabicFontItalic, setArabicFontItalicRaw] = useState(() => ssGet(ssKey('arabicFontItalic'), false));
  const setArabicFontItalic = (v: boolean) => { setArabicFontItalicRaw(v); ssSave(ssKey('arabicFontItalic'), v); };

  // Spacing & Layout controls — persisted
  const [arcTextSpacing, setArcTextSpacingRaw] = useState(() => ssGet(ssKey('arcTextSpacing'), 2));
  const setArcTextSpacing = (v: number) => { setArcTextSpacingRaw(v); ssSave(ssKey('arcTextSpacing'), v); };
  const [circleGap, setCircleGapRaw] = useState(() => ssGet(ssKey('circleGap'), 13));
  const setCircleGap = (v: number) => { setCircleGapRaw(v); ssSave(ssKey('circleGap'), v); };
  const [separatorDistance, setSeparatorDistanceRaw] = useState(() => ssGet(ssKey('separatorDistance'), 50));
  const setSeparatorDistance = (v: number) => { setSeparatorDistanceRaw(v); ssSave(ssKey('separatorDistance'), v); };
  const [centerContentSize, setCenterContentSizeRaw] = useState(() => ssGet(ssKey('centerContentSize'), 40));
  const setCenterContentSize = (v: number) => { setCenterContentSizeRaw(v); ssSave(ssKey('centerContentSize'), v); };

  // English arc spread & arc band offsets — persisted
  const [englishArcSpread, setEnglishArcSpreadRaw] = useState(() => ssGet(ssKey('englishArcSpread'), 0.98));
  const setEnglishArcSpread = (v: number) => { setEnglishArcSpreadRaw(v); ssSave(ssKey('englishArcSpread'), v); };
  const [companyArcOffset, setCompanyArcOffsetRaw] = useState(() => ssGet(ssKey('companyArcOffset'), 50));
  const setCompanyArcOffset = (v: number) => { setCompanyArcOffsetRaw(v); ssSave(ssKey('companyArcOffset'), v); };
  const [locationArcOffset, setLocationArcOffsetRaw] = useState(() => ssGet(ssKey('locationArcOffset'), 50));
  const setLocationArcOffset = (v: number) => { setLocationArcOffsetRaw(v); ssSave(ssKey('locationArcOffset'), v); };
  // Location arc spread — independent from company arcs
  const [locationArcSpread, setLocationArcSpreadRaw] = useState(() => ssGet(ssKey('locationArcSpread'), 0.98));
  const setLocationArcSpread = (v: number) => { setLocationArcSpreadRaw(v); ssSave(ssKey('locationArcSpread'), v); };

  // Element selection state — drives contextual sidebar panel opening
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

  // Language mode — persisted
  const [languageMode, setLanguageModeRaw] = useState<'EN' | 'AR' | 'BILINGUAL'>(
    () => ssGet(ssKey('languageMode'), (project?.language_mode as 'EN' | 'AR' | 'BILINGUAL') || 'BILINGUAL')
  );
  const setLanguageMode = (v: 'EN' | 'AR' | 'BILINGUAL') => { setLanguageModeRaw(v); ssSave(ssKey('languageMode'), v); };

  // ═══════════════════════════════════════════════════════════════════
  // LIVE SVG RE-RENDER PIPELINE
  // When any layout/typography control changes, regenerate the SVG
  // via generateOfficialStampSVG() so sliders are live-wired.
  // ═══════════════════════════════════════════════════════════════════
  const liveRenderRef = useRef(false);
  useEffect(() => {
    if (!project || !standardConcept) return;
    if (!liveRenderRef.current) { liveRenderRef.current = true; return; }
    const isOfficial = !standardConcept.templateKey || standardConcept.templateKey === 'owner-official-standard';
    if (!isOfficial) return;

    const name = project.company_name || '';
    const arabicName = project.arabic_company_name || '';
    const locationEnRaw = [project.city_optional, project.country_optional].filter(Boolean).join(', ') || 'Dubai, UAE';
    const locationEn = locationEnRaw.replace(/United Arab Emirates/gi, 'UAE');
    const ARABIC_CITY_MAP: Record<string, string> = {
      'dubai': 'دبي، الإمارات', 'abu dhabi': 'أبوظبي، الإمارات',
      'sharjah': 'الشارقة، الإمارات', 'ajman': 'عجمان، الإمارات',
      'ras al khaimah': 'رأس الخيمة، الإمارات', 'fujairah': 'الفجيرة، الإمارات',
      'umm al quwain': 'أم القيوين، الإمارات',
    };
    const cityKey = (project.city_optional || '').toLowerCase();
    const locAr = project.arabic_city || ARABIC_CITY_MAP[cityKey] || 'دبي، الإمارات';
    const mono = (localMonogramText || name.slice(0, 2)).toUpperCase().slice(0, 3);
    const regNo = project.registration_number || '';

    const config: OfficialStampConfig = {
      companyNameEn: name,
      companyNameAr: arabicName || name,
      arabicOnTop: true,
      locationTextEn: locationEn,
      locationTextAr: locAr,
      showLocation: true,
      separatorStyle: project.separator_style || 'star',
      monogramText: mono,
      showMonogram: localIconStyle === 'MONOGRAM',
      showLogo: localIconStyle === 'UPLOADED_LOGO' && !!localLogoUrl,
      logoUrl: localLogoUrl || undefined,
      size: 320,
      registrationNumber: regNo || undefined,
      showRegistration: !!regNo && (project.density ?? 3) >= 3,
      borderStyle: (project.border_style as any) || 'DOUBLE',
      centerMode: localIconStyle === 'UPLOADED_LOGO' ? 'logo' : localIconStyle === 'NONE' ? 'none' : 'monogram',
      circleGap,
      separatorDistancePct: separatorDistance,
      arabicArcSpread,
      englishArcSpread,
      arabicLetterSpacing,
      arabicFont,
      arabicFontWeight,
      companyArcBandOffset: companyArcOffset,
      locationArcBandOffset: locationArcOffset,
      locationArcSpread,
      centerContentScale: centerContentSize,
      arcTextSpacing,
      fontFamily,
      inkColor: primaryColor,
      languageMode,
    };

    const newSvg = generateOfficialStampSVG(config);
    setSvgOverrides(prev => ({ ...prev, [standardConcept.id]: newSvg }));
    triggerPulse();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    circleGap, separatorDistance, arcTextSpacing, englishArcSpread,
    arabicArcSpread, arabicLetterSpacing, arabicFont, arabicFontWeight, arabicFontSize,
    fontFamily, fontBold, manualFontSize, companyArcOffset, locationArcOffset,
    locationArcSpread, centerContentSize, localIconStyle, localMonogramText,
    localLogoUrl, primaryColor, languageMode,
    project?.border_style, project?.separator_style, project?.typography_style,
  ]);

  // Typography style sync — map project.typography_style → fontFamily state
  useEffect(() => {
    if (!project?.typography_style) return;
    const FONT_MAP: Record<string, string> = {
      SERIF: 'Georgia, "Times New Roman", serif',
      SANS: 'Arial, Helvetica, sans-serif',
      MONOSPACE: '"Courier New", monospace',
      CALLIGRAPHY: '"Palatino Linotype", "Book Antiqua", serif',
      GOTHIC: '"Copperplate Gothic", Copperplate, "Small Caps", serif',
    };
    const mapped = FONT_MAP[project.typography_style];
    if (mapped && mapped !== fontFamily) {
      setFontFamily(mapped);
    }
  }, [project?.typography_style]);

  // Live-apply monogram colors whenever they change
  useEffect(() => {
    if (localIconStyle !== 'MONOGRAM') return;
    const effectiveMonogram = localMonogramText || (project?.company_name ? project.company_name.trim().split(/\s+/).filter((w: string) => w.length > 0).slice(0, 3).map((w: string) => w[0]).join('').toUpperCase() : '');
    if (!effectiveMonogram) return;
    const hasCustomColors = Object.keys(monogramLetterColors.letters).length > 0 || monogramLetterColors.allLetters || monogramLetterColors.divider;
    if (!hasCustomColors) return;
    const id = selectedId || concepts[0]?.id;
    if (!id) return;
    const baseSvg = svgOverrides[id] || concepts.find(c => c.id === id)?.svgSource || favoriteConcepts.find(c => c.id === id)?.svgSource || standardConcept?.svgSource || '';
    if (!baseSvg) return;
    const colored = applyMonogramColors(baseSvg, effectiveMonogram, monogramLetterColors, primaryColor);
    if (colored !== baseSvg) {
      setSvgOverrides(prev => ({ ...prev, [id]: colored }));
      triggerPulse();
    }
  }, [monogramLetterColors, localMonogramText, localIconStyle, primaryColor, project]);


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
  const [lastSaveType, setLastSaveType] = useState<'draft' | 'design' | 'preset' | null>(null);

  // ── Auto-save to localStorage (crash recovery) ──
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!projectId || !standardConcept) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        // Store only the active standard's SVG to stay within localStorage limits
        const activeId = standardConcept?.id;
        const activeSvg = activeId ? (svgOverrides[activeId] || standardConcept?.svgSource || '') : '';
        const payload = {
          activeOverride: activeSvg.slice(0, 100000),
          standardConceptId: activeId,
          selectedId,
          timestamp: Date.now(),
        };
        localStorage.setItem(`stamp-autosave-${projectId}`, JSON.stringify(payload));
      } catch {}
    }, 30000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [projectId, svgOverrides, standardConcept, selectedId]);

  // Check for auto-save recovery on load
  useEffect(() => {
    if (!projectId) return;
    try {
      const raw = localStorage.getItem(`stamp-autosave-${projectId}`);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.timestamp && Date.now() - saved.timestamp < 3600000) {
        // Less than 1 hour old — offer recovery via toast
        toast('Resume unsaved changes?', {
          duration: 8000,
          action: {
            label: 'Restore',
            onClick: () => {
              if (saved.activeOverride && saved.standardConceptId) {
                setSvgOverrides(prev => ({ ...prev, [saved.standardConceptId]: saved.activeOverride }));
              }
              toast.success('Unsaved changes restored');
              localStorage.removeItem(`stamp-autosave-${projectId}`);
            },
          },
        });
      } else {
        localStorage.removeItem(`stamp-autosave-${projectId}`);
      }
    } catch {
      localStorage.removeItem(`stamp-autosave-${projectId}`);
    }
  }, [projectId]);

  // Core save logic — shared by saveDraft and saveDesign
  const persistProjectState = useCallback(async (): Promise<boolean> => {
    if (!projectId || !user?.id) return false;
    setSaving(true);
    try {
      let standardDbId = standardConcept?.id || null;
      if (standardConcept && standardDbId && standardDbId.length !== 36) {
        const { data: inserted } = await supabase.from('stamp_designs').insert({
          project_id: projectId, user_id: user.id, design_version: 1,
          template_key: standardConcept.templateKey,
          svg_source: svgOverrides[standardConcept.id] || standardConcept.svgSource,
          style_snapshot_json: project, source: 'manual',
        } as any).select('id').single();
        if (inserted) {
          standardDbId = inserted.id;
          setStandardConcept(prev => prev ? { ...prev, id: inserted.id } : prev);
          setSelectedId(inserted.id);
          setConcepts(prev => prev.map(c => c.id === standardConcept.id ? { ...c, id: inserted.id } : c));
          setSvgOverrides(prev => {
            const next = { ...prev };
            if (next[standardConcept.id]) {
              next[inserted.id] = next[standardConcept.id];
              delete next[standardConcept.id];
            }
            return next;
          });
        }
      }
      const updateData: Record<string, any> = { selected_design_id: standardDbId };
      if (project) {
        updateData.layout_json = {
          ...(project.layout_json || {}),
          primaryColor, secondaryColor, accentColor, fontFamily, fontBold, fontItalic,
          inkMode, zoom, localIconStyle, localMonogramText, monogramLetterColors,
          lastSaved: new Date().toISOString(),
        };
      }
      await supabase.from('stamp_projects').update(updateData as any).eq('id', projectId);
      setLastSaved(new Date());
      // Clear auto-save after successful DB save
      localStorage.removeItem(`stamp-autosave-${projectId}`);
      setSaving(false);
      return true;
    } catch (err: any) {
      toast.error('Save failed: ' + (err?.message || 'Unknown error'));
      setSaving(false);
      return false;
    }
  }, [projectId, user?.id, standardConcept, svgOverrides, project, primaryColor, secondaryColor, accentColor, fontFamily, fontBold, fontItalic, inkMode, zoom, localIconStyle, localMonogramText, monogramLetterColors]);

  // Save Draft — quiet save, toast only
  const saveDraft = useCallback(async () => {
    if (saving) return;
    const ok = await persistProjectState();
    if (ok) {
      setLastSaveType('draft');
      toast.success('Draft saved', { duration: 2000 });
    }
  }, [saving, persistProjectState]);

  // Save Design — full save with dialog
  const saveDesign = useCallback(async () => {
    if (saving) return;
    const ok = await persistProjectState();
    if (ok) {
      setLastSaveType('design');
      setShowSaveDialog(true);
    }
  }, [saving, persistProjectState]);

  // Save as Preset — config-only save
  const saveAsPreset = useCallback(async () => {
    if (!user?.id || !standardConcept) { toast.error('No design to save as preset'); return; }
    setSaving(true);
    try {
      const svg = svgOverrides[standardConcept.id] || standardConcept.svgSource;
      const { error } = await supabase.from('stamp_presets' as any).insert({
        user_id: user.id,
        name: standardConcept.label || project?.company_name || 'Custom Preset',
        description: `Saved ${new Date().toLocaleDateString()}`,
        config_json: { templateKey: standardConcept.templateKey, svgSource: svg },
        svg_preview: svg?.slice(0, 50000),
      });
      if (error) throw error;
      setLastSaved(new Date());
      setLastSaveType('preset');
      toast.success('Preset saved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save preset');
    }
    setSaving(false);
  }, [user?.id, standardConcept, svgOverrides, project]);

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

  // Remember last stamp route for CTA routing
  useEffect(() => {
    if (projectId) {
      try { localStorage.setItem('stamp_last_route', `/toolkit/stamp-generator/${projectId}/generate`); } catch {}
    }
  }, [projectId]);

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
    setLocalIconStyle((data as any).layout_json?.localIconStyle || (data.icon_style as any) || 'MONOGRAM');
    setLocalMonogramText((data as any).layout_json?.localMonogramText || data.monogram_text || data.company_name?.slice(0, 2)?.toUpperCase() || '');
    if ((data as any).layout_json?.monogramLetterColors) {
      setMonogramLetterColors((data as any).layout_json.monogramLetterColors);
    }
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
      // Set standard from first design (T0) or persisted selected_design_id
      const selectedDesignId = (data as any).selected_design_id;
      const allDesigns = [...favs, ...regular];
      const matchedDesign = selectedDesignId ? allDesigns.find(d => d.id === selectedDesignId) : null;
      const firstDesign = matchedDesign || regular[0] || favs[0];
      if (firstDesign && !standardConcept) {
        setStandardConcept(firstDesign);
        setSelectedId(firstDesign.id);
      }
    } else {
      generateConcepts(data);
    }
  }

  const generationLockRef = useRef(false);

  const generateConcepts = useCallback(async (proj?: any) => {
    const p = proj || project;
    if (!p) return;
    if (generationLockRef.current) return;
    generationLockRef.current = true;
    setGenerating(true);
    setBlocked(false);
    try {
      if (session?.access_token) {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-stamp-generator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            action: 'generate',
            project: { ...project, ...p },
            projectId,
            selectedDesignId: standardConcept?.id || null,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.blocked) { setBlocked(true); setGenerating(false); generationLockRef.current = false; return; }
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
                id: d.id, templateKey: d.template_key || 'classic-official',
                label: (d.template_key || 'classic-official').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                tags: [] as string[], svgSource: d.svg_source || '', isFavorite: false,
              }));
              setConcepts(prev => [...newConcepts, ...prev.filter(c => !newConcepts.some(n => n.id === c.id))]);
              if (!standardConcept && newConcepts[0]) {
                setStandardConcept(newConcepts[0]);
                setSelectedId(newConcepts[0].id);
              }
              setGenerating(false);
              generationLockRef.current = false;
              return;
            }
          }
        }
      }
    } catch (_) {}
    const clientConcepts = generateStampConcepts(project ? { ...project, ...p } : p);
    if (clientConcepts[0]?.templateKey === 'blocked') { setBlocked(true); setGenerating(false); generationLockRef.current = false; return; }
    setConcepts(prev => [...clientConcepts, ...prev.filter(c => !clientConcepts.some(n => n.id === c.id))]);
    if (!standardConcept && clientConcepts.length > 0) {
      setStandardConcept(clientConcepts[0]);
      setSelectedId(clientConcepts[0].id);
    }
    setGenerating(false);
    generationLockRef.current = false;
  }, [project, session, projectId, standardConcept]);

  async function toggleFavorite(concept: StampDesignConcept) {
    setTogglingFav(concept.id);
    const newFav = !concept.isFavorite;
    const isDbId = concept.id.length === 36;
    let dbId = isDbId ? concept.id : null;
    if (!isDbId) {
      const { data } = await supabase.from('stamp_designs').insert({
        project_id: projectId, user_id: user!.id, design_version: 1, template_key: concept.templateKey,
        svg_source: svgOverrides[concept.id] || concept.svgSource, style_snapshot_json: project, is_favorite: true, source: 'manual',
      } as any).select('id').single();
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

  async function handleSelectConcept(concept: StampDesignConcept) {
    // Block selection during active generation
    if (generating) {
      toast('Please wait for generation to finish', { duration: 2000 });
      return;
    }
    // Swap: previous standard moves into concepts list, clicked becomes new standard
    if (standardConcept && standardConcept.id !== concept.id) {
      setConcepts(prev => {
        const exists = prev.some(c => c.id === standardConcept.id);
        const filtered = prev.filter(c => c.id !== concept.id);
        return exists ? filtered : [standardConcept, ...filtered];
      });
    }
    setStandardConcept(concept);
    setSelectedId(concept.id);
    // Persist selected_design_id to database immediately
    if (projectId) {
      let dbId = concept.id;
      if (concept.id.length !== 36 || !concept.id.includes('-')) {
        // Not a valid DB UUID, treat as local
      } else {
        const { data: exists } = await supabase.from('stamp_designs').select('id').eq('id', concept.id).maybeSingle();
        if (!exists) {
          const { data: inserted } = await supabase.from('stamp_designs').insert({
            project_id: projectId, user_id: user!.id, design_version: 1,
            template_key: concept.templateKey,
            svg_source: svgOverrides[concept.id] || concept.svgSource,
            style_snapshot_json: project, source: 'manual',
          } as any).select('id').single();
          if (inserted) {
            dbId = inserted.id;
            concept = { ...concept, id: inserted.id };
            setStandardConcept(concept);
            setSelectedId(inserted.id);
            setConcepts(prev => prev.map(c => c.id === concept.id ? concept : c));
          }
        }
        await supabase.from('stamp_projects').update({ selected_design_id: dbId }).eq('id', projectId);
      }
    }
    toast.success('Active design changed', { duration: 2000 });
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
        template_key: concept.templateKey, svg_source: svgToSave, style_snapshot_json: project, source: 'manual',
      } as any).select('id').single();
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
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-stamp-generator`, {
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
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-stamp-generator`, {
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
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-stamp-generator`, {
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
    <div className="h-[calc(100vh-48px)] flex flex-col bg-gradient-to-br from-[hsl(40,33%,98%)] via-[hsl(38,30%,93%)] to-[hsl(36,25%,88%)] mt-[48px] overflow-hidden">

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

      {/* Post-Save Dialog */}
      <StampSaveDialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        projectName={project?.company_name || 'Stamp Project'}
        savedAt={lastSaved}
        saveType={lastSaveType || 'design'}
        onViewProjects={() => { setShowSaveDialog(false); navigate('/toolkit/stamp-generator/projects'); }}
        onOpenLibrary={() => { setShowSaveDialog(false); libraryTabRef?.(); }}
        onSaveAsAsset={() => { saveCurrentAsBrandAsset(); }}
      />


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
        onSaveProject={saveDesign}
        onSaveDraft={saveDraft}
        onSavePreset={isOwner ? saveAsPreset : undefined}
        selectedId={selectedId}
        saving={saving}
        lastSaved={lastSaved}
        lastSaveType={lastSaveType}
      />

      {/* ── 3-Column Studio Body ── */}
      <div className="flex-1 flex gap-0 overflow-hidden">

        {/* ── LEFT PANEL: Collapsible Tool Controls ── */}
        <StampLeftPanel
          selectedElement={selectedElement}
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
           arabicFontSize={arabicFontSize}
           onSetArabicFontSize={(v) => { setArabicFontSize(v); triggerPulse(); }}
           arabicFontItalic={arabicFontItalic}
           onSetArabicFontItalic={(v) => { setArabicFontItalic(v); triggerPulse(); }}
          arcTextSpacing={arcTextSpacing}
          circleGap={circleGap}
          separatorDistance={separatorDistance}
          centerContentSize={centerContentSize}
          onSetArcTextSpacing={setArcTextSpacing}
          onSetCircleGap={setCircleGap}
          onSetSeparatorDistance={setSeparatorDistance}
          onSetCenterContentSize={setCenterContentSize}
          englishArcSpread={englishArcSpread}
          companyArcOffset={companyArcOffset}
          locationArcOffset={locationArcOffset}
          onSetEnglishArcSpread={setEnglishArcSpread}
          onSetCompanyArcOffset={setCompanyArcOffset}
          onSetLocationArcOffset={setLocationArcOffset}
           locationArcSpread={locationArcSpread}
           onSetLocationArcSpread={setLocationArcSpread}
           languageMode={languageMode}
           onSetLanguageMode={setLanguageMode}
        />

        {/* ── CENTER: Premium Canvas Preview ── */}
        <div className="flex-1 min-w-[300px] flex flex-col overflow-hidden relative">
          {/* Compare mode close bar */}
          {compareDesign && (
            <div className="flex-shrink-0 px-3 py-1.5 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-blue-700">Compare Mode — Side by Side</span>
              <div className="flex items-center gap-1.5">
                <Button size="sm" className="h-6 text-[9px] gap-1 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90"
                  onClick={() => {
                    const concept: StampDesignConcept = compareDesign;
                    setCompareDesign(null);
                    // Swap: move current standard to concepts, apply compared design as new standard
                    if (standardConcept) {
                      setConcepts(prev => [standardConcept, ...prev.filter(c => c.id !== standardConcept.id && c.id !== concept.id)]);
                    }
                    setStandardConcept(concept);
                    setSelectedId(concept.id);
                    toast.success('Applied compared design');
                  }}>
                  <Check size={9} /> Apply This
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-[9px] text-blue-700 hover:bg-blue-100" onClick={() => setCompareDesign(null)}>
                  <X size={9} className="mr-1" /> Close
                </Button>
              </div>
            </div>
          )}
          <div className={`flex-1 flex items-center justify-center overflow-auto relative ${compareDesign ? 'gap-4' : ''}`}
            style={{
              background: bgMode === 'checker'
                ? 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, white 0% 50%) 0 0 / 20px 20px'
                : 'radial-gradient(circle at center, hsl(var(--pearl-1)) 0%, white 70%)'
            }}>

            {/* Grid overlay */}
            {showGrid && !compareDesign && <CanvasGridOverlay size={stampSize + 80} />}

            {/* Preview status label */}
            {activeStandard && !compareDesign && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                <Badge className="text-[7px] px-1.5 py-0 bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]">
                  {standardConcept?.id === activeStandard.id ? 'Standard Model' : 'Active Preview'}
                </Badge>
                {generating && (
                  <Badge className="text-[7px] px-1.5 py-0 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] animate-pulse">
                    Generating…
                  </Badge>
                )}
              </div>
            )}

            {/* Stamp preview with pulse feedback */}
            <div className={`relative transition-all duration-200 ${previewPulse ? 'ring-2 ring-[hsl(var(--gold)/0.4)] rounded-full' : ''}`}
              style={{ filter: `drop-shadow(0 8px 24px hsl(0 0% 0% / 0.12))` }}>
              {generating && !activeStandard && concepts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 text-[hsl(var(--muted-foreground))]" style={{ width: stampSize, height: stampSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 size={28} className="animate-spin text-[hsl(var(--gold))]" />
                  <p className="text-[10px] font-medium">Generating your stamp…</p>
                </div>
              ) : uploadedStampUrl ? (
                <div className="relative">
                  <img src={uploadedStampUrl} alt="Uploaded stamp" style={{ maxWidth: stampSize, maxHeight: stampSize }} className="object-contain"  loading="lazy" decoding="async" />
                  {uploadedSignatureUrl && (
                    <img src={uploadedSignatureUrl} alt="Signature" className="absolute h-10 object-contain pointer-events-none opacity-80"
                      style={{ left: `${signatureX}%`, top: `${signatureY}%`, transform: 'translate(-50%, -50%)' }}  loading="lazy" decoding="async" />
                  )}
                </div>
              ) : (selectedSvg || allConcepts[0]?.svgSource) ? (
                <div className="relative">
                  <StampInteractivePreview
                    onElementSelect={setSelectedElement}
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
                    onCenterClick={() => {
                      // Auto-switch to MONOGRAM mode and open left panel center section
                      setLocalIconStyle('MONOGRAM');
                      if (!localMonogramText && project?.company_name) {
                        const initials = project.company_name.split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 3);
                        setLocalMonogramText(initials);
                      }
                      // Selection handled by onElementSelect prop
                    }}
                    currentSeparatorStyle={project?.separator_style}
                    currentCenterMode={localIconStyle === 'UPLOADED_LOGO' ? 'logo' : localIconStyle === 'NONE' ? 'none' : 'monogram'}
                  />
                  {uploadedSignatureUrl && (
                    <img src={uploadedSignatureUrl} alt="Signature" className="absolute h-10 object-contain pointer-events-none opacity-80"
                      style={{ left: `${signatureX}%`, top: `${signatureY}%`, transform: 'translate(-50%, -50%)' }}  loading="lazy" decoding="async" />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[hsl(var(--muted-foreground))]" style={{ width: stampSize, height: stampSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stamp size={32} className="opacity-20" />
                  <p className="text-[10px] text-center">Select a design to preview</p>
                </div>
              )}

              {/* Compare design — right side */}
              {compareDesign && (
                <div className="flex flex-col items-center gap-2">
                  <Badge className="text-[7px] px-1.5 py-0 bg-blue-100 text-blue-700 border border-blue-200">
                    Comparing: {compareDesign.label}
                  </Badge>
                  <div className="relative" style={{ filter: `drop-shadow(0 8px 24px hsl(0 0% 0% / 0.12))` }}>
                    <StampSVGRenderer
                      svgSource={svgOverrides[compareDesign.id] || compareDesign.svgSource}
                      tintColor={primaryColor}
                      secondaryColor={secondaryColor}
                      accentColor={accentColor}
                      fontFamily={fontFamily}
                      fontWeight={fontBold ? 'bold' : 'normal'}
                      fontStyle={fontItalic ? 'italic' : 'normal'}
                      fontSize={manualFontSize}
                      inkMode={inkMode}
                      size={compareDesign ? Math.round(stampSize * 0.85) : stampSize}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Canvas bottom toolbar: Edit & Export + Zoom Controls */}
          <div className="flex-shrink-0 border-t border-[hsl(var(--border))] bg-[#FDFBF7]/90 backdrop-blur-sm px-3 py-2 flex items-center justify-between">
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
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] gap-1"
                        onClick={() => {
                          if (activeStandard) {
                            setStandardConcept(activeStandard);
                            toast.success('Design locked as Standard Base');
                          }
                        }}>
                        <Shield size={9} /> Lock as Standard
                      </Button>
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
          generating={generating}
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
          isOwner={isOwner}
          onSwitchToLibrary={(fn) => setLibraryTabRef(() => fn)}
          onCompare={(concept) => setCompareDesign(concept)}
          onSaveToLibrary={async (concept) => {
            if (!user?.id) return;
            try {
              const { error } = await supabase.from('brand_assets').insert({
                user_id: user.id,
                asset_type: 'stamp' as any,
                name: concept.label || 'Stamp Design',
                svg_content: (svgOverrides[concept.id] || concept.svgSource)?.slice(0, 100000),
              });
              if (error) throw error;
              toast.success('Saved to Brand Assets library');
            } catch (err: any) {
              toast.error(err?.message || 'Failed to save');
            }
          }}
        />
      </div>

      {/* AI Designer Floating Panel */}
      {chatOpen && (
        <div className="fixed z-[10050] flex flex-col bg-[#FDFBF7] rounded-2xl shadow-2xl border border-[hsl(var(--border))] overflow-hidden"
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
                className="w-6 h-6 rounded-full bg-[#FDFBF7]/20 flex items-center justify-center hover:bg-[#FDFBF7]/30">
                <span className="text-white font-bold text-[10px]">{aiPanelMinimized ? '▲' : '▬'}</span>
              </button>
              <button onClick={() => setChatOpen(false)}
                className="w-6 h-6 rounded-full bg-[#FDFBF7] flex items-center justify-center hover:bg-[#FDFBF7]/90">
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
                      className="text-left text-[9px] p-1.5 bg-[#FDFBF7] rounded-md border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)] text-[hsl(var(--foreground))] transition-colors leading-tight">
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
                  <div className="flex items-center justify-center bg-[#FDFBF7] rounded-lg border border-[hsl(var(--border))] py-2">
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
              <div className="flex-shrink-0 px-3 py-2 border-t border-[hsl(var(--border))] bg-[#FDFBF7]">
                <div className="flex gap-1.5">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                    placeholder="Describe changes…"
                    className="flex-1 h-8 px-2.5 text-[10px] border-2 border-[hsl(var(--border))] rounded-lg focus:outline-none focus:border-[hsl(var(--gold))] bg-[#FDFBF7] text-[hsl(var(--foreground))]" />
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
