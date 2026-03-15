/**
 * LiveStampPreview — real-time SVG stamp preview inside the wizard.
 * Routes ALL shapes and language modes through the Official Standard Template.
 * Supports click-to-edit via data-stamp-element attributes.
 * Supports drag-to-reposition for arc text, separators, center content, and borders.
 * Supports letter-level click for per-character editing.
 */

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { generateOfficialStampSVG, OFFICIAL_INK_BLUE, type SeparatorStyle, type BorderStyleType, type CenterContentMode, type CenterIconType, type LanguageMode, type StampShape, type LetterOverride } from '@/lib/stampOfficialTemplate';
import type { LetterSelection } from '@/components/stamp-generator/StampLetterEditor';

type StampType = 'ROUND' | 'OVAL' | 'RECTANGLE' | 'SQUARE';
type StyleTheme = 'CLASSIC' | 'MODERN' | 'MINIMAL' | 'LUXURY' | 'BOLD' | 'VINTAGE';
type BorderStyle = 'SINGLE' | 'DOUBLE' | 'RING' | 'DOTTED' | 'ROPE' | 'CUSTOM';
type TypographyStyle = 'SERIF' | 'SANS' | 'MONOSPACE' | 'CALLIGRAPHY' | 'GOTHIC' | 'ARABIC_MODERN';

/** Parameter that can be adjusted via drag */
export type DragParam =
  | 'companyArcOffset'
  | 'locationArcOffset'
  | 'separatorDistance'
  | 'centerContentSize'
  | 'circleGap'
  | 'arabicArcSpread'
  | 'englishArcSpread';

export interface DragUpdateEvent {
  param: DragParam;
  value: number; // 0-100 integer
}

export interface LiveStampPreviewProps {
  companyName: string;
  arabicCompanyName?: string;
  city?: string;
  country?: string;
  registrationNumber?: string;
  stampType: StampType;
  styleTheme: StyleTheme;
  borderStyle: BorderStyle;
  typographyStyle: TypographyStyle;
  density: number;
  iconStyle: 'NONE' | 'MONOGRAM' | 'SIMPLE_ICON' | 'UPLOADED_LOGO' | 'BOTH';
  monogramText?: string;
  uploadedLogoUrl?: string;
  languageMode: 'EN' | 'AR' | 'BILINGUAL';
  languageReversed?: boolean;
  showLicenseNumber?: boolean;
  showLocation?: boolean;
  separatorStyle?: SeparatorStyle;
  size?: number;
  inkColor?: string;
  arabicCity?: string;
  centerMode?: CenterContentMode;
  centerIcon?: CenterIconType;
  arabicArcSpread?: number;
  englishArcSpread?: number;
  arabicLetterSpacing?: number;
  arabicFont?: string;
  arabicFontWeight?: string;
  circleGap?: number;
  centerContentSize?: number;
  companyArcBandOffset?: number;
  locationArcBandOffset?: number;
  onElementClick?: (elementId: string) => void;
  onDoubleClick?: (elementId: string) => void;
  onDragUpdate?: (event: DragUpdateEvent) => void;
  monogramLetterColors?: Record<number, string>;
  monogramDividerColor?: string;
  arcTextSpacing?: number;
  separatorDistance?: number;
  outerBorderColor?: string;
  middleBorderColor?: string;
  innerBorderColor?: string;
  locationArcSpread?: number;
  onLetterClick?: (selection: LetterSelection) => void;
  letterOverrides?: Record<string, LetterOverride>;
}

const FONT_FAMILIES: Record<TypographyStyle, string> = {
  SERIF:         'Georgia, "Times New Roman", serif',
  SANS:          '"Helvetica Neue", Arial, sans-serif',
  MONOSPACE:     '"Courier New", Courier, monospace',
  CALLIGRAPHY:   '"Palatino Linotype", Palatino, serif',
  GOTHIC:        '"Copperplate Gothic", Copperplate, "Small Caps", serif',
  ARABIC_MODERN: '"Arabic Typesetting", "Noto Naskh Arabic", serif',
};

const ARABIC_FONTS: Record<string, string> = {
  'Noto Naskh Arabic': '"Noto Naskh Arabic", "Arabic Typesetting", "Traditional Arabic", serif',
  'Amiri': '"Amiri", "Noto Naskh Arabic", serif',
  'Cairo': '"Cairo", "Noto Naskh Arabic", sans-serif',
  'Tajawal': '"Tajawal", "Noto Naskh Arabic", sans-serif',
  'Scheherazade New': '"Scheherazade New", "Noto Naskh Arabic", serif',
};

function deriveMonogram(name: string): string {
  if (!name) return '';
  const words = name.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const skipWords = new Set(['LLC', 'L.L.C', 'FZE', 'FZCO', 'CO', 'CO.', 'INC', 'LTD', 'PLC', 'CORP']);
  const significant = words.filter(w => !skipWords.has(w.toUpperCase().replace(/[.,]/g, '')));
  const source = significant.length >= 2 ? significant : words;
  return source.slice(0, 3).map(w => w[0]).join('').toUpperCase();
}

/**
 * Maps a data-stamp-element id to the drag parameter it controls
 * and the drag axis/direction behavior.
 */
interface DragMapping {
  param: DragParam;
  /** 'radial' = dragging toward/away from center changes value.
   *  'horizontal' = left/right drag for arc spread.
   *  'scale' = distance from center for sizing. */
  mode: 'radial' | 'horizontal' | 'scale';
  /** Current value (0-100) at drag start */
  startValue: number;
  /** Sensitivity multiplier — how many % per pixel of drag */
  sensitivity: number;
}

function getElementDragMapping(
  elementId: string,
  props: LiveStampPreviewProps
): DragMapping | null {
  // Company name arcs — radial drag changes company arc band offset
  if (elementId === 'top-arc' || elementId === 'bottom-arc') {
    return {
      param: 'companyArcOffset',
      mode: 'radial',
      startValue: props.companyArcBandOffset ?? 50,
      sensitivity: 0.5,
    };
  }
  // Location arcs — radial drag changes location arc band offset
  if (elementId === 'loc-top' || elementId === 'loc-bottom') {
    return {
      param: 'locationArcOffset',
      mode: 'radial',
      startValue: props.locationArcBandOffset ?? 50,
      sensitivity: 0.5,
    };
  }
  // Separators — radial drag changes separator distance
  if (elementId.startsWith('separator')) {
    return {
      param: 'separatorDistance',
      mode: 'radial',
      startValue: props.separatorDistance ?? 50,
      sensitivity: 0.5,
    };
  }
  // Center content (monogram/logo) — scale drag changes center content size
  if (elementId === 'center' || elementId === 'registration') {
    return {
      param: 'centerContentSize',
      mode: 'scale',
      startValue: props.centerContentSize ?? 50,
      sensitivity: 0.4,
    };
  }
  // Border rings — radial drag changes circle gap
  if (elementId.startsWith('border-')) {
    return {
      param: 'circleGap',
      mode: 'radial',
      startValue: props.circleGap ?? 13,
      sensitivity: 0.3,
    };
  }
  return null;
}

export function LiveStampPreview({
  companyName,
  arabicCompanyName = '',
  city = '',
  country = 'UAE',
  registrationNumber = '',
  stampType,
  styleTheme,
  borderStyle,
  typographyStyle,
  density,
  iconStyle,
  monogramText = '',
  uploadedLogoUrl = '',
  languageMode,
  languageReversed = true,
  showLicenseNumber = true,
  showLocation = true,
  separatorStyle = 'dot',
  size = 220,
  inkColor,
  arabicCity = '',
  centerMode,
  centerIcon,
  arabicArcSpread,
  englishArcSpread,
  arabicLetterSpacing,
  arabicFont,
  arabicFontWeight,
  circleGap,
  centerContentSize,
  onElementClick,
  onDoubleClick,
  onDragUpdate,
  monogramLetterColors,
  monogramDividerColor,
  arcTextSpacing,
  separatorDistance,
  selectedElement,
  companyArcBandOffset,
  locationArcBandOffset,
  outerBorderColor,
  middleBorderColor,
  innerBorderColor,
  locationArcSpread,
  onLetterClick,
  letterOverrides,
}: LiveStampPreviewProps & { selectedElement?: string | null }) {
  const displayName = companyName || 'Your Company Name';
  const fontFamily = FONT_FAMILIES[typographyStyle];
  const ink = inkColor || OFFICIAL_INK_BLUE;
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Drag state ──
  const [isDragging, setIsDragging] = useState(false);
  const [dragCursor, setDragCursor] = useState<string>('');
  const dragRef = useRef<{
    mapping: DragMapping;
    startX: number;
    startY: number;
    centerX: number;
    centerY: number;
    elementId: string;
  } | null>(null);

  // Collect all current props for drag mapping lookup
  const currentProps: LiveStampPreviewProps = {
    companyName, arabicCompanyName, city, country, registrationNumber,
    stampType, styleTheme, borderStyle, typographyStyle, density, iconStyle,
    monogramText, uploadedLogoUrl, languageMode, languageReversed,
    showLicenseNumber, showLocation, separatorStyle, size, inkColor,
    arabicCity, centerMode, centerIcon, arabicArcSpread, englishArcSpread,
    arabicLetterSpacing, arabicFont, arabicFontWeight, circleGap,
    centerContentSize, companyArcBandOffset, locationArcBandOffset,
    monogramLetterColors, monogramDividerColor, arcTextSpacing,
    separatorDistance, outerBorderColor, middleBorderColor, innerBorderColor,
    locationArcSpread, onLetterClick, letterOverrides,
  };

  // ── Click & double-click handlers ──
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const clickHandler = (e: MouseEvent) => {
      // Check for letter-level click first
      const letterTarget = (e.target as Element)?.closest?.('[data-stamp-letter]');
      if (letterTarget && onLetterClick) {
        e.stopPropagation();
        const letterId = letterTarget.getAttribute('data-stamp-letter') || '';
        const [arcId, indexStr] = letterId.split(/-(\d+)$/);
        const charIndex = parseInt(indexStr, 10);
        const char = letterTarget.textContent || '';
        if (!isNaN(charIndex)) {
          onLetterClick({ arcId, charIndex, char });
          return;
        }
      }
      // Fall back to element-level click
      const target = (e.target as Element)?.closest?.('[data-stamp-element]');
      if (target) {
        e.stopPropagation();
        const elementId = target.getAttribute('data-stamp-element') || '';
        onElementClick?.(elementId);
      }
    };
    const dblHandler = (e: MouseEvent) => {
      const target = (e.target as Element)?.closest?.('[data-stamp-element]');
      if (target) {
        e.stopPropagation();
        const elementId = target.getAttribute('data-stamp-element') || '';
        onDoubleClick?.(elementId);
      }
    };
    el.addEventListener('click', clickHandler);
    el.addEventListener('dblclick', dblHandler);
    return () => {
      el.removeEventListener('click', clickHandler);
      el.removeEventListener('dblclick', dblHandler);
    };
  }, [onElementClick, onDoubleClick, onLetterClick]);

  // ── Highlight selected element ──
  useEffect(() => {
    if (!containerRef.current) return;
    const els = containerRef.current.querySelectorAll('[data-stamp-element]');
    els.forEach(el => {
      const htmlEl = el as SVGElement;
      if (selectedElement && el.getAttribute('data-stamp-element') === selectedElement) {
        htmlEl.style.filter = 'drop-shadow(0 0 4px #B8860B) drop-shadow(0 0 8px rgba(184,134,11,0.4))';
        htmlEl.style.transition = 'filter 0.2s ease';
      } else {
        htmlEl.style.filter = '';
      }
    });
  }, [selectedElement]);

  // ── Hover cursor for draggable elements ──
  useEffect(() => {
    if (!containerRef.current || !onDragUpdate) return;
    const el = containerRef.current;
    const moveHandler = (e: MouseEvent) => {
      if (isDragging) return;
      const target = (e.target as Element)?.closest?.('[data-stamp-element]');
      if (target) {
        const elementId = target.getAttribute('data-stamp-element') || '';
        const mapping = getElementDragMapping(elementId, currentProps);
        if (mapping) {
          setDragCursor(mapping.mode === 'scale' ? 'nwse-resize' : 'grab');
          return;
        }
      }
      setDragCursor('');
    };
    el.addEventListener('mousemove', moveHandler);
    return () => el.removeEventListener('mousemove', moveHandler);
  }, [onDragUpdate, isDragging, currentProps]);

  // ── Drag start (mouse) ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onDragUpdate) return;
    const target = (e.target as Element)?.closest?.('[data-stamp-element]');
    if (!target) return;
    const elementId = target.getAttribute('data-stamp-element') || '';
    const mapping = getElementDragMapping(elementId, currentProps);
    if (!mapping) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current!.getBoundingClientRect();
    dragRef.current = {
      mapping,
      startX: e.clientX,
      startY: e.clientY,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      elementId,
    };
    setIsDragging(true);
    setDragCursor('grabbing');
  }, [onDragUpdate, currentProps]);

  // ── Drag start (touch) ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!onDragUpdate || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const target = (touch.target as Element)?.closest?.('[data-stamp-element]');
    if (!target) return;
    const elementId = target.getAttribute('data-stamp-element') || '';
    const mapping = getElementDragMapping(elementId, currentProps);
    if (!mapping) return;

    const rect = containerRef.current!.getBoundingClientRect();
    dragRef.current = {
      mapping,
      startX: touch.clientX,
      startY: touch.clientY,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      elementId,
    };
    setIsDragging(true);
  }, [onDragUpdate, currentProps]);

  // ── Drag move + end (window-level) ──
  useEffect(() => {
    if (!isDragging) return;

    const computeNewValue = (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      if (!drag) return;

      const { mapping, startX, startY, centerX, centerY } = drag;
      let delta: number;

      if (mapping.mode === 'radial') {
        // Radial: measure how much the cursor moved toward/away from center
        const startDist = Math.sqrt((startX - centerX) ** 2 + (startY - centerY) ** 2);
        const currentDist = Math.sqrt((clientX - centerX) ** 2 + (clientY - centerY) ** 2);
        delta = (currentDist - startDist) * mapping.sensitivity;
      } else if (mapping.mode === 'horizontal') {
        delta = (clientX - startX) * mapping.sensitivity;
      } else {
        // scale: distance from center
        const startDist = Math.sqrt((startX - centerX) ** 2 + (startY - centerY) ** 2);
        const currentDist = Math.sqrt((clientX - centerX) ** 2 + (clientY - centerY) ** 2);
        delta = (currentDist - startDist) * mapping.sensitivity;
      }

      const newValue = Math.round(Math.max(0, Math.min(100, mapping.startValue + delta)));
      onDragUpdate?.({ param: mapping.param, value: newValue });
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      computeNewValue(e.clientX, e.clientY);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      computeNewValue(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleEnd = () => {
      dragRef.current = null;
      setIsDragging(false);
      setDragCursor('');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging, onDragUpdate]);

  // ── SVG generation ──
  const svg = useMemo(() => {
    const S = size;
    const mono = monogramText || deriveMonogram(displayName);
    const locationEn = showLocation ? [city, country].filter(Boolean).join(', ') || 'Dubai, UAE' : '';
    
    const ARABIC_CITY_MAP: Record<string, string> = {
      'dubai': 'دبي، الإمارات', 'abu dhabi': 'أبوظبي، الإمارات',
      'sharjah': 'الشارقة، الإمارات', 'ajman': 'عجمان، الإمارات',
      'ras al khaimah': 'رأس الخيمة، الإمارات', 'fujairah': 'الفجيرة، الإمارات',
      'umm al quwain': 'أم القيوين، الإمارات',
    };
    const locAr = arabicCity || (city ? ARABIC_CITY_MAP[city.toLowerCase()] || `${city}، الإمارات` : 'دبي، الإمارات');

    // Convert slider values (0-100 integers) to 0-1 floats for arc spread
    const arcSpreadVal = arabicArcSpread != null ? arabicArcSpread / 100 : undefined;
    const enArcSpreadVal = englishArcSpread != null ? englishArcSpread / 100 : undefined;
    const circleGapVal = circleGap != null ? circleGap : undefined;
    const centerScaleVal = centerContentSize != null ? centerContentSize / 50 : undefined;

    // Resolve Arabic font family
    const resolvedArFont = arabicFont ? (ARABIC_FONTS[arabicFont] || `"${arabicFont}", serif`) : undefined;

    return generateOfficialStampSVG({
      companyNameEn: displayName,
      companyNameAr: arabicCompanyName || '',
      arabicOnTop: languageReversed,
      locationTextEn: locationEn,
      locationTextAr: locAr,
      showLocation: showLocation && density >= 2,
      separatorStyle,
      monogramText: mono,
      logoUrl: uploadedLogoUrl || undefined,
      showMonogram: (iconStyle === 'MONOGRAM' || iconStyle === 'BOTH') && !!mono,
      showLogo: (iconStyle === 'UPLOADED_LOGO' || iconStyle === 'BOTH') && !!uploadedLogoUrl,
      inkColor: ink,
      fontFamily,
      size: S,
      registrationNumber,
      showRegistration: showLicenseNumber && density >= 3 && !!registrationNumber,
      borderStyle: borderStyle as BorderStyleType,
      centerMode: centerMode || (iconStyle === 'UPLOADED_LOGO' ? 'logo' : iconStyle === 'MONOGRAM' ? 'monogram' : undefined),
      centerIcon,
      arabicArcSpread: arcSpreadVal,
      englishArcSpread: enArcSpreadVal,
      arabicLetterSpacing,
      arabicFont: resolvedArFont,
      arabicFontWeight,
      circleGap: circleGapVal,
      centerContentScale: centerScaleVal,
      monogramLetterColors,
      monogramDividerColor,
      languageMode: languageMode as LanguageMode,
      shape: stampType as StampShape,
      styleTheme,
      typographyStyle,
      arcTextSpacing: arcTextSpacing,
      separatorDistancePct: separatorDistance,
      companyArcBandOffset,
      locationArcBandOffset,
      outerBorderColor,
      middleBorderColor,
      innerBorderColor,
      locationArcSpread: locationArcSpread ?? undefined,
      letterOverrides,
    });
  }, [
    displayName, arabicCompanyName, city, country, registrationNumber,
    stampType, styleTheme, borderStyle, typographyStyle, density,
    iconStyle, monogramText, uploadedLogoUrl, languageMode, languageReversed,
    showLicenseNumber, showLocation, separatorStyle, fontFamily, size, ink, arabicCity,
    centerMode, centerIcon, arabicArcSpread, englishArcSpread, arabicLetterSpacing, arabicFont, arabicFontWeight,
    circleGap, centerContentSize, arcTextSpacing, separatorDistance,
    companyArcBandOffset, locationArcBandOffset, outerBorderColor, middleBorderColor, innerBorderColor, locationArcSpread,
  ]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center select-none ${onElementClick || onDragUpdate ? 'cursor-pointer' : ''}`}
      style={{
        width: size,
        height: size,
        cursor: isDragging ? 'grabbing' : dragCursor || undefined,
        touchAction: onDragUpdate ? 'none' : undefined,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
