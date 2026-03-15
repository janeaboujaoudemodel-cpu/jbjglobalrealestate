/**
 * LiveStampPreview — real-time SVG stamp preview inside the wizard.
 * Routes ALL shapes and language modes through the Official Standard Template.
 * Supports click-to-edit via data-stamp-element attributes.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { generateOfficialStampSVG, OFFICIAL_INK_BLUE, type SeparatorStyle, type BorderStyleType, type CenterContentMode, type CenterIconType, type LanguageMode, type StampShape } from '@/lib/stampOfficialTemplate';

type StampType = 'ROUND' | 'OVAL' | 'RECTANGLE' | 'SQUARE';
type StyleTheme = 'CLASSIC' | 'MODERN' | 'MINIMAL' | 'LUXURY' | 'BOLD' | 'VINTAGE';
type BorderStyle = 'SINGLE' | 'DOUBLE' | 'RING' | 'DOTTED' | 'ROPE' | 'CUSTOM';
type TypographyStyle = 'SERIF' | 'SANS' | 'MONOSPACE' | 'CALLIGRAPHY' | 'GOTHIC' | 'ARABIC_MODERN';

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
  monogramLetterColors?: Record<number, string>;
  monogramDividerColor?: string;
  arcTextSpacing?: number;
  separatorDistance?: number;
  outerBorderColor?: string;
  middleBorderColor?: string;
  innerBorderColor?: string;
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
}: LiveStampPreviewProps & { selectedElement?: string | null }) {
  const displayName = companyName || 'Your Company Name';
  const fontFamily = FONT_FAMILIES[typographyStyle];
  const ink = inkColor || OFFICIAL_INK_BLUE;
  const containerRef = useRef<HTMLDivElement>(null);

  // Attach click handlers to data-stamp-element nodes
  // Stop propagation so parent outside-click handler doesn't clear selection
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const clickHandler = (e: MouseEvent) => {
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
  }, [onElementClick, onDoubleClick]);

  // Apply highlight glow to selected element
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

    // Convert slider values to config params
    // arabicArcSpread slider: 20-100 → map to 0.40-0.95 spread (default 80 → 0.88)
    // Map slider 20-100 → 0.30-1.00 so default 88 → ~0.88 (matching English ARC_SPREAD_LIMIT)
    const arcSpreadVal = arabicArcSpread != null ? 0.30 + (arabicArcSpread - 20) / 80 * 0.70 : undefined;
    const enArcSpreadVal = englishArcSpread != null ? 0.30 + (englishArcSpread - 20) / 80 * 0.70 : undefined;
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
    });
  }, [
    displayName, arabicCompanyName, city, country, registrationNumber,
    stampType, styleTheme, borderStyle, typographyStyle, density,
    iconStyle, monogramText, uploadedLogoUrl, languageMode, languageReversed,
    showLicenseNumber, showLocation, separatorStyle, fontFamily, size, ink, arabicCity,
    centerMode, centerIcon, arabicArcSpread, arabicLetterSpacing, arabicFont, arabicFontWeight,
    circleGap, centerContentSize, arcTextSpacing, separatorDistance,
  ]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center ${onElementClick ? 'cursor-pointer' : ''}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
