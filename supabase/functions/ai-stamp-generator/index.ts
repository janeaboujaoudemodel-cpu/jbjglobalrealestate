import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BLOCKED_KEYWORDS = [
  "government", "ministry", "federal", "municipality", "authority",
  "دائرة", "حكومة", "وزارة", "بلدية", "هيئة الحكومة", "وطني",
  "official seal of", "seal of the state",
];

function isBlocked(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Color tokens ────────────────────────────────────────────────
const C_PRI = "#1a2744";
const C_SEC = "#2a3a5c";
const C_ACC = "#8b6914";

const INK_BLUE = '#1B3A8C';
const ARABIC_FONT = '"Noto Naskh Arabic", "Arabic Typesetting", "Traditional Arabic", serif';
const ENGLISH_FONT = 'Georgia, "Times New Roman", serif';

const OUTER_R_PCT = 0.46;
const MIDDLE_STROKE = 2.5;
const INNER_STROKE = 1.2;
const DECORATIVE_STROKE = 0.5;
const SAFE_ZONE = 10;
const ARC_SPREAD_LIMIT = 0.98;

const fontMap: Record<string, string> = {
  SERIF: 'Georgia, "Times New Roman", serif',
  SANS: 'Arial, Helvetica, sans-serif',
  MONOSPACE: '"Courier New", monospace',
  CALLIGRAPHY: '"Palatino Linotype", "Book Antiqua", serif',
  GOTHIC: '"Copperplate Gothic", Copperplate, "Small Caps", serif',
  ARABIC_MODERN: '"Arabic Typesetting", "Noto Naskh Arabic", serif',
};

// ─── Official Template Engine (mirrors stampOfficialTemplate.ts) ──────────

type SeparatorStyle = 'dot' | 'star' | 'square' | 'diamond' | 'line' | 'double-line' | 'triangle' | 'cross' | 'floral' | 'ornament' | 'dash' | 'circle' | 'none';
type BorderStyleType = 'SINGLE' | 'DOUBLE' | 'RING' | 'DOTTED' | 'ROPE' | 'CUSTOM';
type CenterContentMode = 'monogram' | 'initials' | 'logo' | 'icon' | 'license' | 'none';

interface OfficialStampConfig {
  companyNameEn: string;
  companyNameAr: string;
  arabicOnTop: boolean;
  locationTextEn?: string;
  locationTextAr?: string;
  showLocation: boolean;
  separatorStyle: SeparatorStyle;
  monogramText?: string;
  logoUrl?: string;
  showMonogram: boolean;
  showLogo: boolean;
  inkColor?: string;
  fontFamily?: string;
  size?: number;
  registrationNumber?: string;
  showRegistration?: boolean;
  borderStyle?: BorderStyleType;
  outerBorderWidth?: number;
  innerBorderWidth?: number;
  centerMode?: CenterContentMode;
  circleGap?: number;
  arabicArcSpread?: number;
  englishArcSpread?: number;
  arabicLetterSpacing?: number;
  arabicFont?: string;
  arabicFontWeight?: string;
  languageMode?: 'EN' | 'AR' | 'BILINGUAL';
  styleTheme?: string;
  separatorDistancePct?: number;
  centerContentScale?: number;
}

function normalizeEnglishTokenSpacing(text: string): string {
  if (!text) return text;
  let normalized = text.replace(/\b([A-Z]) ([A-Z]) ([A-Z])\b/g, '$1$2$3');
  normalized = normalized.replace(/\b([A-Z]) ([A-Z])\b/g, '$1$2');
  normalized = normalized.replace(/(LLC|L\.L\.C\.?)\s*/gi, '$1  ');
  normalized = normalized.replace(/\s{3,}/g, '  ');
  return normalized.trim();
}

const THEME_STROKE_MULT: Record<string, number> = {
  CLASSIC: 1, MODERN: 0.8, MINIMAL: 0.5, LUXURY: 1.3, BOLD: 1.6, VINTAGE: 0.9,
};

function fitFontSize(text: string, baseSize: number, maxArcLen: number, charW = 0.6, isArabic = false): number {
  if (!text) return baseSize;
  const minSize = isArabic ? 8 : 7;
  const est = text.length * baseSize * charW;
  if (est <= maxArcLen) return baseSize;
  const fitted = maxArcLen / (text.length * charW);
  return Math.max(minSize, fitted);
}

function computeArcLetterSpacing(
  text: string, fontSize: number, arcRadius: number,
  spreadLimit: number, avgCharWidth: number, minSpacing: number,
  maxSpacing = 12
): number {
  if (!text || text.length <= 1) return minSpacing;
  const availableArc = arcRadius * Math.PI * spreadLimit;
  const textWidth = text.length * fontSize * avgCharWidth;
  const gaps = text.length - 1;
  if (gaps <= 0) return minSpacing;
  const extraSpace = availableArc - textWidth;
  const spacing = Math.max(0.5, extraSpace / gaps);
  return Math.max(minSpacing, Math.min(spacing, maxSpacing));
}

function safeArcFontSize(
  text: string, maxRadius: number, isArabic: boolean,
  baseFontSize: number, spreadLimit = ARC_SPREAD_LIMIT,
  maxLetterSpacing?: number
): { fontSize: number; letterSpacing: number } {
  const charW = isArabic ? 0.68 : 0.54;
  const minSpacing = 1;
  const maxSp = maxLetterSpacing ?? 8;
  const textPadding = baseFontSize * 0.3;
  const effectiveRadius = maxRadius - textPadding;
  const arcLen = effectiveRadius * Math.PI * spreadLimit;
  const fontSize = fitFontSize(text, baseFontSize, arcLen, charW, isArabic);
  const letterSpacing = computeArcLetterSpacing(text, fontSize, effectiveRadius, spreadLimit, charW, minSpacing, maxSp);
  return { fontSize, letterSpacing };
}

function separatorGlyph(style: SeparatorStyle): string {
  switch (style) {
    case 'dot': return '●'; case 'star': return '★'; case 'square': return '■';
    case 'diamond': return '◆'; case 'line': return '—'; case 'double-line': return '═';
    case 'triangle': return '▲'; case 'cross': return '✦'; case 'floral': return '❀';
    case 'ornament': return '❖'; case 'dash': return '—'; case 'circle': return '◉';
    case 'none': return '';
  }
}

function renderSeparators(cx: number, cy: number, r: number, style: SeparatorStyle, ink: string): string {
  if (style === 'none') return '';
  const glyph = separatorGlyph(style);
  const fontSize = (style === 'line' || style === 'double-line' || style === 'dash') ? 16
    : (style === 'floral' || style === 'ornament') ? 14 : 13;
  return `
    <text data-stamp-element="separator-right" x="${cx + r}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-size="${fontSize}" fill="${ink}" font-weight="bold">${glyph}</text>
    <text data-stamp-element="separator-left" x="${cx - r}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-size="${fontSize}" fill="${ink}" font-weight="bold">${glyph}</text>
  `;
}

function renderTopArcTextPath(
  text: string, cx: number, cy: number, r: number,
  fontSize: number, font: string, ink: string, letterSpacing: number,
  _isArabic: boolean, pathId: string, fontWeight = '800'
): string {
  if (!text) return '';
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
  return `
    <defs><path id="${pathId}" d="${arcPath}"/></defs>
    <text data-stamp-element="${pathId}" font-family="${font}" font-size="${fontSize}" fill="${ink}" 
      letter-spacing="${letterSpacing}" font-weight="${fontWeight}">
      <textPath href="#${pathId}" startOffset="50%" text-anchor="middle" textLength="${r * Math.PI * 0.95}" lengthAdjust="spacing">${text}</textPath>
    </text>
  `;
}

function renderBottomArcTextPath(
  text: string, cx: number, cy: number, r: number,
  fontSize: number, font: string, ink: string, letterSpacing: number,
  _isArabic: boolean, pathId: string, fontWeight = '800'
): string {
  if (!text) return '';
  const verticalNudge = fontSize * 0.15;
  const adjustedCy = cy - verticalNudge;
  const arcPath = `M ${cx - r} ${adjustedCy} A ${r} ${r} 0 0 0 ${cx + r} ${adjustedCy}`;
  return `
    <defs><path id="${pathId}" d="${arcPath}"/></defs>
    <text data-stamp-element="${pathId}" font-family="${font}" font-size="${fontSize}" fill="${ink}" 
      letter-spacing="${letterSpacing}" font-weight="${fontWeight}" dominant-baseline="hanging">
      <textPath href="#${pathId}" startOffset="50%" text-anchor="middle" textLength="${r * Math.PI * 0.95}" lengthAdjust="spacing">${text}</textPath>
    </text>
  `;
}

function renderCenterContent(config: OfficialStampConfig, cx: number, cy: number, innerR: number, enFont: string, ink: string): string {
  const centerMode = config.centerMode || (config.showLogo ? 'logo' : config.showMonogram ? 'monogram' : 'none');
  const mono = config.monogramText || '';
  const centerScale = config.centerContentScale != null ? config.centerContentScale / 50 : 1;

  switch (centerMode) {
    case 'logo':
      if (config.logoUrl) {
        const imgSize = innerR * 1.8 * centerScale;
        return `<defs><clipPath id="center-clip"><circle cx="${cx}" cy="${cy}" r="${innerR - 2}"/></clipPath></defs>
          <image data-stamp-element="center" href="${config.logoUrl}" 
            x="${cx - imgSize / 2}" y="${cy - imgSize / 2}" width="${imgSize}" height="${imgSize}" 
            clip-path="url(#center-clip)" preserveAspectRatio="xMidYMid meet" image-rendering="optimizeQuality"/>`;
      }
      return '';
    case 'monogram':
      if (mono) {
        const baseSize = mono.length === 1 ? innerR * 0.85 : mono.length === 2 ? innerR * 0.65 : innerR * 0.50;
        const scaledSize = baseSize * centerScale;
        const upper = mono.toUpperCase();
        const monoLetterSpacing = upper.length >= 3 ? 1 : 2;
        const divW = scaledSize * 0.6;
        const divY = cy + scaledSize * 0.45;
        const divider = upper.length >= 2 ? `<line x1="${cx - divW}" y1="${divY}" x2="${cx + divW}" y2="${divY}" stroke="${ink}" stroke-width="1.2" opacity="0.8"/>` : '';
        return `<text data-stamp-element="center" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-family="${enFont}" font-size="${scaledSize}" fill="${ink}" font-weight="700" letter-spacing="${monoLetterSpacing}">${upper}</text>${divider}`;
      }
      return '';
    default:
      return '';
  }
}

function generateOfficialStampSVG(config: OfficialStampConfig): string {
  const S = config.size || 320;
  const cx = S / 2;
  const cy = S / 2;
  const enFont = config.fontFamily || ENGLISH_FONT;
  const arFont = config.arabicFont || ARABIC_FONT;
  const bs = config.borderStyle || 'DOUBLE';
  const ink = config.inkColor || INK_BLUE;
  const mode = config.languageMode || 'BILINGUAL';
  const themeMult = THEME_STROKE_MULT[config.styleTheme || 'CLASSIC'] || 1;

  const gapPct = config.circleGap != null ? config.circleGap / 100 : 0.13;
  const outerR = S * OUTER_R_PCT;
  const middleR = S * (OUTER_R_PCT - gapPct);
  const innerR = middleR - S * 0.07;

  const compBandMin = middleR + SAFE_ZONE;
  const compBandMax = outerR - SAFE_ZONE;
  const clampedTextArcR = compBandMin + (compBandMax - compBandMin) * 0.5;

  const sepPct = Math.max(0, Math.min(100, config.separatorDistancePct ?? 50));
  const sepMin = middleR + 2;
  const sepMax = outerR - 2;
  const separatorR = sepMin + (sepMax - sepMin) * (sepPct / 100);

  const locBandMin = innerR + SAFE_ZONE;
  const locBandMax = middleR - SAFE_ZONE;
  const clampedLocTextR = locBandMin + (locBandMax - locBandMin) * 0.5;

  const arabicSpread = config.arabicArcSpread ?? ARC_SPREAD_LIMIT;
  const englishSpread = config.englishArcSpread ?? ARC_SPREAD_LIMIT;

  let topArcContent = '';
  let bottomArcContent = '';
  let separatorContent = '';

  if (mode === 'BILINGUAL') {
    const arText = config.companyNameAr || 'اسم الشركة';
    const enText = normalizeEnglishTokenSpacing((config.companyNameEn || 'COMPANY NAME').toUpperCase());
    const arSafe = safeArcFontSize(arText, clampedTextArcR, true, 17, arabicSpread);
    const enSafe = safeArcFontSize(enText, clampedTextArcR, false, 15, englishSpread, 5);
    const arLS = config.arabicLetterSpacing ?? arSafe.letterSpacing;
    const enLS = enSafe.letterSpacing;
    const arFW = config.arabicFontWeight === 'normal' ? '600' : '800';

    if (config.arabicOnTop !== false) {
      topArcContent = renderTopArcTextPath(arText, cx, cy, clampedTextArcR, arSafe.fontSize, arFont, ink, arLS, true, 'top-arc', arFW);
      bottomArcContent = renderBottomArcTextPath(enText, cx, cy, clampedTextArcR, enSafe.fontSize, enFont, ink, enLS, false, 'bottom-arc');
    } else {
      topArcContent = renderTopArcTextPath(enText, cx, cy, clampedTextArcR, enSafe.fontSize, enFont, ink, enLS, false, 'top-arc');
      bottomArcContent = renderBottomArcTextPath(arText, cx, cy, clampedTextArcR, arSafe.fontSize, arFont, ink, arLS, true, 'bottom-arc', arFW);
    }
    separatorContent = renderSeparators(cx, cy, separatorR, config.separatorStyle, ink);
  } else if (mode === 'EN') {
    const topText = normalizeEnglishTokenSpacing(config.companyNameEn.toUpperCase() || 'COMPANY NAME');
    const topSafe = safeArcFontSize(topText, clampedTextArcR, false, 15, englishSpread, 5);
    topArcContent = renderTopArcTextPath(topText, cx, cy, clampedTextArcR, topSafe.fontSize, enFont, ink, topSafe.letterSpacing, false, 'top-arc');
    if (config.showLocation) {
      const locEn = config.locationTextEn || 'Dubai, UAE';
      const botSafe = safeArcFontSize(locEn.toUpperCase(), clampedTextArcR, false, 12, englishSpread, 5);
      bottomArcContent = renderBottomArcTextPath(locEn.toUpperCase(), cx, cy, clampedTextArcR, botSafe.fontSize, enFont, ink, botSafe.letterSpacing, false, 'bottom-arc', '600');
    }
    separatorContent = renderSeparators(cx, cy, separatorR, config.separatorStyle, ink);
  } else if (mode === 'AR') {
    const topText = config.companyNameAr || config.companyNameEn || 'اسم الشركة';
    const topSafe = safeArcFontSize(topText, clampedTextArcR, true, 17, arabicSpread);
    const topLS = config.arabicLetterSpacing ?? topSafe.letterSpacing;
    const topFW = config.arabicFontWeight === 'normal' ? '600' : '800';
    topArcContent = renderTopArcTextPath(topText, cx, cy, clampedTextArcR, topSafe.fontSize, arFont, ink, topLS, true, 'top-arc', topFW);
    if (config.showLocation) {
      const locAr = config.locationTextAr || 'دبي، الإمارات';
      const botSafe = safeArcFontSize(locAr, clampedTextArcR, true, 13, arabicSpread);
      bottomArcContent = renderBottomArcTextPath(locAr, cx, cy, clampedTextArcR, botSafe.fontSize, arFont, ink, config.arabicLetterSpacing ?? botSafe.letterSpacing, true, 'bottom-arc', '600');
    }
    separatorContent = renderSeparators(cx, cy, separatorR, config.separatorStyle, ink);
  }

  // Location arcs (BILINGUAL only)
  let locationContent = '';
  if (config.showLocation && mode === 'BILINGUAL') {
    const locEn = config.locationTextEn || 'Dubai, UAE';
    const locAr = config.locationTextAr || 'دبي، الإمارات';
    const locEnSafe = safeArcFontSize(locEn.toUpperCase(), clampedLocTextR, false, 12, ARC_SPREAD_LIMIT);
    const locArSafe = safeArcFontSize(locAr, clampedLocTextR, true, 12, ARC_SPREAD_LIMIT);
    locationContent = renderTopArcTextPath(locAr, cx, cy, clampedLocTextR, locArSafe.fontSize, arFont, ink, locArSafe.letterSpacing, true, 'loc-top', '600');
    locationContent += renderBottomArcTextPath(locEn.toUpperCase(), cx, cy, clampedLocTextR, locEnSafe.fontSize, enFont, ink, locEnSafe.letterSpacing, false, 'loc-bottom', '600');
  }

  // Center content
  const centerContent = renderCenterContent(config, cx, cy, innerR, enFont, ink);

  // Registration
  let regContent = '';
  if (config.showRegistration && config.registrationNumber) {
    const regArcR = innerR * 0.75;
    const regSafe = safeArcFontSize(config.registrationNumber, regArcR, false, 7, 0.85, 3);
    regContent = renderBottomArcTextPath(config.registrationNumber, cx, cy, regArcR, regSafe.fontSize, enFont, ink, regSafe.letterSpacing, false, 'registration', '500');
  }

  // Border rings
  const outerSW = (config.outerBorderWidth ?? 4) * themeMult;
  const middleSW = (config.innerBorderWidth ?? MIDDLE_STROKE) * themeMult;
  const innerSW = INNER_STROKE * themeMult;

  const outerRingEl = `<circle data-stamp-element="border-outer" cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${ink}" stroke-width="${outerSW}" ${
    bs === 'DOTTED' ? 'stroke-dasharray="3,3"' : bs === 'ROPE' ? 'stroke-dasharray="6,4"' : bs === 'CUSTOM' ? 'stroke-dasharray="2,2,6,2"' : ''
  }/>`;

  const decorativeR = outerR - outerSW / 2 - 2;
  const decorativeRingEl = (bs === 'RING' || bs === 'CUSTOM')
    ? `<circle data-stamp-element="border-decorative" cx="${cx}" cy="${cy}" r="${decorativeR}" fill="none" stroke="${ink}" stroke-width="${(DECORATIVE_STROKE + 0.5) * themeMult}" opacity="0.6"/>`
    : '';

  // Middle ring — HIDDEN for SINGLE border style
  // DOUBLE: outer + middle (distinct widths), RING: full ornate with thicker middle
  const middleRingEl = bs === 'SINGLE' ? '' : (
    bs === 'RING'
      ? `<circle data-stamp-element="border-middle" cx="${cx}" cy="${cy}" r="${middleR}" fill="none" stroke="${ink}" stroke-width="${middleSW * 1.6}"/>`
      : `<circle data-stamp-element="border-middle" cx="${cx}" cy="${cy}" r="${middleR}" fill="none" stroke="${ink}" stroke-width="${middleSW}"/>`
  );

  const showInnerRing = config.showLocation && mode === 'BILINGUAL';
  const innerRingEl = showInnerRing
    ? `<circle data-stamp-element="border-inner" cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${ink}" stroke-width="${innerSW}"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
    ${outerRingEl}${decorativeRingEl}${middleRingEl}${innerRingEl}
    ${topArcContent}${bottomArcContent}${separatorContent}${locationContent}${centerContent}${regContent}
  </svg>`;
}

// ─── 8 Structured Concept Presets ─────────────────────────────────

interface ConceptPreset {
  key: string;
  label: string;
  tags: string[];
  overrides: Partial<OfficialStampConfig>;
}

const CONCEPT_PRESETS: ConceptPreset[] = [
  {
    key: 'classic-official',
    label: 'Classic Official',
    tags: ['classic', 'professional', 'double'],
    overrides: { borderStyle: 'DOUBLE', separatorStyle: 'star', circleGap: 13 },
  },
  {
    key: 'luxury-triple-ring',
    label: 'Luxury Triple Ring',
    tags: ['luxury', 'premium', 'ring'],
    overrides: { borderStyle: 'RING', separatorStyle: 'diamond', circleGap: 16, styleTheme: 'LUXURY' },
  },
  {
    key: 'modern-minimal',
    label: 'Modern Minimal',
    tags: ['modern', 'clean', 'minimal'],
    overrides: { borderStyle: 'SINGLE', separatorStyle: 'dot', circleGap: 10, styleTheme: 'MODERN' },
  },
  {
    key: 'vintage-seal',
    label: 'Vintage Seal',
    tags: ['vintage', 'classic', 'ornate'],
    overrides: { borderStyle: 'DOUBLE', separatorStyle: 'ornament', circleGap: 15, styleTheme: 'VINTAGE' },
  },
  {
    key: 'bold-corporate',
    label: 'Bold Corporate',
    tags: ['bold', 'corporate', 'strong'],
    overrides: { borderStyle: 'DOUBLE', separatorStyle: 'square', circleGap: 12, styleTheme: 'BOLD' },
  },
  {
    key: 'elegant-diamond',
    label: 'Elegant Diamond',
    tags: ['elegant', 'diamond', 'refined'],
    overrides: { borderStyle: 'RING', separatorStyle: 'floral', circleGap: 14 },
  },
  {
    key: 'legal-standard',
    label: 'Legal Standard',
    tags: ['legal', 'official', 'registration'],
    overrides: { borderStyle: 'DOUBLE', separatorStyle: 'line', circleGap: 13, showRegistration: true },
  },
  {
    key: 'premium-executive',
    label: 'Premium Executive',
    tags: ['premium', 'executive', 'luxury'],
    overrides: { borderStyle: 'RING', separatorStyle: 'star', circleGap: 18, styleTheme: 'LUXURY' },
  },
];

// ─── Variation configs — each changes ONE dimension ──────────────

interface VariationConfig {
  key: string;
  label: string;
  overrides: Partial<OfficialStampConfig>;
}

function getVariationConfigs(): VariationConfig[] {
  return [
    // Separator variations (4)
    { key: 'var-sep-star', label: 'Star Separators', overrides: { separatorStyle: 'star' } },
    { key: 'var-sep-diamond', label: 'Diamond Separators', overrides: { separatorStyle: 'diamond' } },
    { key: 'var-sep-floral', label: 'Floral Separators', overrides: { separatorStyle: 'floral' } },
    { key: 'var-sep-dot', label: 'Dot Separators', overrides: { separatorStyle: 'dot' } },
    // Border variations (4)
    { key: 'var-ring-luxury', label: 'Luxury Ring Border', overrides: { borderStyle: 'RING', styleTheme: 'LUXURY' } },
    { key: 'var-border-single', label: 'Minimal Single', overrides: { borderStyle: 'SINGLE', styleTheme: 'MINIMAL' } },
    { key: 'var-border-rope', label: 'Rope Border', overrides: { borderStyle: 'ROPE' } },
    { key: 'var-border-dotted', label: 'Dotted Border', overrides: { borderStyle: 'DOTTED' } },
    // Gap variations (2)
    { key: 'var-gap-wide', label: 'Wide Ring Gap', overrides: { circleGap: 18 } },
    { key: 'var-gap-tight', label: 'Tight Ring Gap', overrides: { circleGap: 9 } },
    // Monogram variations (2)
    { key: 'var-mono-none', label: 'No Monogram', overrides: { centerMode: 'none', showMonogram: false } },
    { key: 'var-sep-ornament', label: 'Ornament Separators', overrides: { separatorStyle: 'ornament' } },
  ];
}

// ─── Build config from project data ───────────────────────────────

function buildConfigFromProject(project: any, overrides: Partial<OfficialStampConfig> = {}): OfficialStampConfig {
  const name = (project.company_name || 'COMPANY NAME').toUpperCase().trim();
  const arabicName = (project.arabic_company_name || '').trim();
  const cityParts = [project.city_optional, project.country_optional].filter(Boolean);
  const locationEnRaw = (cityParts.join(', ') || 'Dubai, UAE').toUpperCase();
  const locationEn = locationEnRaw.replace(/UNITED ARAB EMIRATES/gi, 'UAE');
  const arabicCity = (project.arabic_city || '').trim();
  const isBilingual = project.language_mode === 'BILINGUAL' || project.language_mode === 'AR';
  const mono = (project.monogram_text || name.slice(0, 2)).toUpperCase().slice(0, 3);
  const regNo = project.registration_number_optional || '';
  const hasMono = project.icon_style === 'MONOGRAM';
  const hasLogo = project.icon_style === 'UPLOADED_LOGO' && project.uploaded_logo_url;
  const enFont = fontMap[project.typography_style] || fontMap.SERIF;

  const ARABIC_CITY_MAP: Record<string, string> = {
    'dubai': 'دبي، الإمارات', 'abu dhabi': 'أبوظبي، الإمارات',
    'sharjah': 'الشارقة، الإمارات', 'ajman': 'عجمان، الإمارات',
  };
  const cityKey = (project.city_optional || '').toLowerCase();
  const locAr = arabicCity || ARABIC_CITY_MAP[cityKey] || 'دبي، الإمارات';

  return {
    companyNameEn: name,
    companyNameAr: arabicName || name,
    arabicOnTop: true,
    locationTextEn: locationEn,
    locationTextAr: locAr,
    showLocation: project.show_location !== false,
    separatorStyle: (project.separator_style as SeparatorStyle) || 'star',
    monogramText: mono,
    showMonogram: hasMono,
    showLogo: !!hasLogo,
    logoUrl: hasLogo ? project.uploaded_logo_url : undefined,
    inkColor: INK_BLUE,
    fontFamily: enFont,
    size: 320,
    registrationNumber: regNo || undefined,
    showRegistration: !!regNo && (project.density ?? 3) >= 3,
    borderStyle: (project.border_style as BorderStyleType) || 'DOUBLE',
    centerMode: hasLogo ? 'logo' : hasMono ? 'monogram' : 'monogram',
    circleGap: 13,
    languageMode: project.language_mode || (isBilingual ? 'BILINGUAL' : 'EN'),
    styleTheme: project.style_theme || 'CLASSIC',
    ...overrides,
  };
}

/** Business type → recommended style mapping */
const BUSINESS_STYLE_MAP: Record<string, { theme: string; border: string; density: number }> = {
  'Real Estate': { theme: 'LUXURY', border: 'RING', density: 3 },
  'General Trading': { theme: 'CLASSIC', border: 'DOUBLE', density: 3 },
  'Technology': { theme: 'MODERN', border: 'SINGLE', density: 2 },
  'Consulting': { theme: 'CLASSIC', border: 'DOUBLE', density: 3 },
  'Construction': { theme: 'BOLD', border: 'DOUBLE', density: 3 },
  'Healthcare': { theme: 'MODERN', border: 'DOUBLE', density: 3 },
  'Education': { theme: 'CLASSIC', border: 'DOUBLE', density: 3 },
  'Food & Beverage': { theme: 'VINTAGE', border: 'ROPE', density: 2 },
  'Tourism': { theme: 'LUXURY', border: 'RING', density: 2 },
  'Finance': { theme: 'LUXURY', border: 'RING', density: 3 },
  'Legal': { theme: 'CLASSIC', border: 'DOUBLE', density: 4 },
};

// ─── SERVE ────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const userId = user.id;
    const body = await req.json();
    const { action, project, projectId, instruction, currentSvg } = body;

    if (isBlocked(project?.company_name || "")) {
      return new Response(JSON.stringify({ blocked: true, reason: "Official government or authority seal generation is not permitted." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // ── GENERATE action — uses official template engine ───────────────
    if (action === "generate") {
      const businessType = project?.business_type || '';
      const styleSuggestion = BUSINESS_STYLE_MAP[businessType];

      // Protect standard model from deletion — clear FK reference first
      const selectedDesignId = body.selectedDesignId;
      if (projectId) {
        // Clear selected_design_id to prevent FK constraint violation
        await supabase.from("stamp_projects").update({ selected_design_id: null }).eq("id", projectId);
        
        let deleteQuery = supabase.from("stamp_designs").delete().eq("project_id", projectId).eq("is_favorite", false);
        if (selectedDesignId) {
          deleteQuery = deleteQuery.neq("id", selectedDesignId);
        }
        const { error: delErr } = await deleteQuery;
        if (delErr) console.error("Delete designs error:", delErr.message);
      }

      // Order presets: put business-type-recommended styles first
      let orderedPresets = [...CONCEPT_PRESETS];
      if (styleSuggestion) {
        const matchBorder = styleSuggestion.border;
        const first = orderedPresets.filter(p => p.overrides.borderStyle === matchBorder);
        const rest = orderedPresets.filter(p => p.overrides.borderStyle !== matchBorder);
        orderedPresets = [...first, ...rest];
      }

      const concepts = orderedPresets.map(preset => {
        const config = buildConfigFromProject(project, preset.overrides);
        return {
          id: crypto.randomUUID(),
          templateKey: preset.key,
          label: preset.label,
          tags: preset.tags,
          svgSource: generateOfficialStampSVG(config),
        };
      });

      if (projectId) {
        const inserts = concepts.map(c => ({
          project_id: projectId,
          user_id: userId,
          design_version: 1,
          ai_prompt: `${project.style_theme || 'CLASSIC'} ${project.stamp_type || 'official'} ${project.border_style || 'DOUBLE'}${businessType ? ` [${businessType}]` : ''}`,
          style_snapshot_json: project,
          svg_source: c.svgSource,
          template_key: c.templateKey,
          is_favorite: false,
        }));
        await supabase.from("stamp_designs").insert(inserts);
      }

      return new Response(JSON.stringify({ 
        concepts,
        styleSuggestion: styleSuggestion ? {
          businessType,
          recommendedTheme: styleSuggestion.theme,
          recommendedBorder: styleSuggestion.border,
          recommendedDensity: styleSuggestion.density,
        } : null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── REFINE action — uses AI model ────────────────────────────────────
    if (action === "refine") {
      if (!instruction) {
        return new Response(JSON.stringify({ error: "Instruction required" }), { 
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      const baseConfig = buildConfigFromProject(project);
      let refinedSvg = currentSvg || generateOfficialStampSVG(baseConfig);
      let message = "Design refined based on your instructions.";

      if (LOVABLE_API_KEY) {
        try {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-3.1-pro-preview",
              messages: [
                {
                  role: "system",
                  content: `You are an expert SVG stamp designer. You will receive an existing stamp SVG and instructions to modify it.
Return ONLY the modified SVG code (starting with <svg) with NO explanation. Keep it as a valid SVG.

CRITICAL RULES:
- Text must NEVER touch or overlap border circles. Maintain minimum 5px clearance between all text and ring strokes.
- All structural colors must use these hex tokens:
  Primary (borders, company name): #1a2744
  Secondary (inner rings, accents, location): #2a3a5c
  Accent (monogram, registration, dividers): #8b6914
- Do not add external images or base64 data
- Return ONLY the SVG, nothing else`,
                },
                {
                  role: "user",
                  content: `Company: ${project.company_name}\nInstruction: ${instruction}\n\nCurrent SVG:\n${currentSvg || 'Use a classic double ring design'}`,
                },
              ],
              stream: false,
            }),
          });

          if (aiRes.ok) {
            const aiJson = await aiRes.json();
            const raw = aiJson.choices?.[0]?.message?.content || "";
            const svgMatch = raw.match(/<svg[\s\S]*<\/svg>/i);
            if (svgMatch) {
              refinedSvg = svgMatch[0];
              message = `Applied: "${instruction}"`;
            }
          } else if (aiRes.status === 429) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          } else if (aiRes.status === 402) {
            return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch (e) {
          console.error("AI refine error:", e);
        }
      }

      let savedId = crypto.randomUUID();
      if (projectId) {
        const { data } = await supabase.from("stamp_designs").insert({
          project_id: projectId,
          user_id: userId,
          design_version: 2,
          ai_prompt: instruction,
          style_snapshot_json: project,
          svg_source: refinedSvg,
          template_key: "refined",
          is_favorite: false,
        }).select("id").single();
        if (data) savedId = data.id;
      }

      return new Response(JSON.stringify({ svgSource: refinedSvg, id: savedId, message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── REFINE-IMAGE action — uses Gemini image model ─────────────────────
    if (action === "refine-image") {
      const { imageBase64, prompt } = body;
      if (!prompt) {
        return new Response(JSON.stringify({ error: "Prompt required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "AI not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      try {
        const messages: any[] = [
          {
            role: "system",
            content: "You are an expert stamp designer. Modify the provided stamp image based on the user's instructions. Return the modified stamp image. Keep the circular stamp shape, professional look, and clean typography.",
          },
        ];

        const userContent: any[] = [
          { type: "text", text: `Modify this stamp: ${prompt}` },
        ];

        if (imageBase64 && imageBase64.startsWith("data:")) {
          const base64Data = imageBase64.split(",")[1];
          const mimeMatch = imageBase64.match(/data:([^;]+);/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
          userContent.unshift({
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64Data}` },
          });
        }

        messages.push({ role: "user", content: userContent });

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages,
            modalities: ["text", "image"],
            stream: false,
          }),
        });

        if (!aiRes.ok) {
          if (aiRes.status === 429) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (aiRes.status === 402) {
            return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          const errText = await aiRes.text();
          console.error("AI image refine error:", aiRes.status, errText);
          return new Response(JSON.stringify({ error: "AI refinement failed" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const aiJson = await aiRes.json();
        const parts = aiJson.choices?.[0]?.message?.content;
        let imageUrl = "";

        if (Array.isArray(parts)) {
          for (const part of parts) {
            if (part.type === "image_url" && part.image_url?.url) {
              imageUrl = part.image_url.url;
              break;
            }
          }
        } else if (typeof parts === "string") {
          const b64Match = parts.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
          if (b64Match) imageUrl = b64Match[0];
        }

        if (imageUrl) {
          return new Response(JSON.stringify({ imageUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: "AI did not return an image. Try a different prompt." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        console.error("refine-image error:", e);
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── VARIATIONS action — systematic single-dimension variations ─────
    if (action === "variations") {
      const variationConfigs = getVariationConfigs();
      
      const concepts = variationConfigs.map(vc => {
        const config = buildConfigFromProject(project, vc.overrides);
        return {
          id: crypto.randomUUID(),
          templateKey: vc.key,
          label: vc.label,
          tags: ['variation', 'ai'],
          svgSource: generateOfficialStampSVG(config),
        };
      });

      return new Response(JSON.stringify({ concepts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { 
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (err) {
    console.error("stamp-generator error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
