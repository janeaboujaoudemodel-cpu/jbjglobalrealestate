/**
 * Owner's Official Standard Stamp Template — STANDARD MODEL
 * 
 * Supports: ROUND / OVAL / RECTANGLE / SQUARE shapes
 * Supports: EN / AR / BILINGUAL language modes
 * Supports: SINGLE / DOUBLE / RING / DOTTED / ROPE / CUSTOM borders
 * 
 * 3-circle layout with tapering thickness hierarchy:
 * - OUTER RING: 4px (boldest, authoritative)
 * - MIDDLE RING: 2.5px (medium, refined)  
 * - INNER RING: 1.2px (thinnest, elegant)
 * 
 * Navy Ink default: #1B3A8C
 */

export type SeparatorStyle = 'dot' | 'star' | 'square' | 'diamond' | 'line' | 'double-line' | 'triangle' | 'cross' | 'floral' | 'ornament' | 'dash' | 'circle' | 'none';
export type BorderStyleType = 'SINGLE' | 'DOUBLE' | 'RING' | 'DOTTED' | 'ROPE' | 'CUSTOM';
export type DividerStyle = 'diamond' | 'line' | 'ornate' | 'none';
export type CenterContentMode = 'monogram' | 'initials' | 'logo' | 'icon' | 'license' | 'none';
export type CenterIconType = 'shield' | 'crown' | 'building' | 'globe';
export type StampShape = 'ROUND' | 'OVAL' | 'RECTANGLE' | 'SQUARE';
export type LanguageMode = 'EN' | 'AR' | 'BILINGUAL';

export interface OfficialStampConfig {
  companyNameEn: string;
  companyNameAr: string;
  arabicOnTop: boolean;
  locationTextEn?: string;
  locationTextAr?: string;
  showLocation: boolean;
  separatorStyle: SeparatorStyle;
  locationSeparatorStyle?: SeparatorStyle;
  monogramText?: string;
  logoUrl?: string;
  showMonogram: boolean;
  showLogo: boolean;
  /** Per-letter monogram color overrides keyed by character index */
  monogramLetterColors?: Record<number, string>;
  /** Monogram divider line color override */
  monogramDividerColor?: string;
  inkColor?: string;
  fontFamily?: string;
  size?: number;
  registrationNumber?: string;
  showRegistration?: boolean;
  borderStyle?: BorderStyleType;
  outerBorderWidth?: number;
  innerBorderWidth?: number;
  dividerStyle?: DividerStyle;
  centerMode?: CenterContentMode;
  centerIcon?: CenterIconType;
  arabicArcSpread?: number;
  /** English arc spread (0-1, default 0.88) — matches separator-to-separator fullness */
  englishArcSpread?: number;
  arabicLetterSpacing?: number;
  arabicFont?: string;
  arabicFontWeight?: string;
  circleGap?: number;
  centerContentScale?: number;
  /** Radial offset for company name arcs (0-100, 50 = centered between outer+middle rings) */
  companyArcBandOffset?: number;
  /** Radial offset for location arcs (0-100, 50 = centered between middle+inner rings) */
  locationArcBandOffset?: number;
  /** Location arc spread (0-1, default 0.98) — independent from company arc spreads */
  locationArcSpread?: number;
  /** Language mode: EN-only, AR-only, BILINGUAL */
  languageMode?: LanguageMode;
  /** Stamp shape */
  shape?: StampShape;
  /** Style theme for stroke weights */
  styleTheme?: string;
  /** Typography style override */
  typographyStyle?: string;
  /** Override letter-spacing for company name arcs */
  arcTextSpacing?: number;
  /** Shift separator position inward/outward (0-100, default 50 = centered) */
  separatorDistancePct?: number;
  /** Per-border color overrides */
  outerBorderColor?: string;
  middleBorderColor?: string;
  innerBorderColor?: string;
}

const ARABIC_FONT = '"Noto Naskh Arabic", "Arabic Typesetting", "Traditional Arabic", serif';
const ENGLISH_FONT = 'Georgia, "Times New Roman", serif';
const INK_BLUE = '#1B3A8C';

const OUTER_R_PCT = 0.46;
const MIDDLE_R_PCT = 0.33;
const INNER_R_PCT = 0.26;

const OUTER_STROKE = 4;
const MIDDLE_STROKE = 2.5;
const INNER_STROKE = 1.2;
const DECORATIVE_STROKE = 0.5;

const SAFE_ZONE = 6;
const ARC_SPREAD_LIMIT = 0.98;

/**
 * Smart English token spacing normalization.
 * Tightens initial clusters (J B J), keeps LLC tight, adds gap after LLC before next token.
 */
function normalizeEnglishTokenSpacing(text: string): string {
  if (!text) return text;
  // Tighten single-letter clusters like "J B J" → "JBJ"
  let normalized = text.replace(/\b([A-Z]) ([A-Z]) ([A-Z])\b/g, '$1$2$3');
  normalized = normalized.replace(/\b([A-Z]) ([A-Z])\b/g, '$1$2');
  // Ensure gap after LLC/L.L.C before next token
  normalized = normalized.replace(/(LLC|L\.L\.C\.?)\s*/gi, '$1  ');
  // Clean up triple+ spaces
  normalized = normalized.replace(/\s{3,}/g, '  ');
  return normalized.trim();
}

// Theme-based stroke multipliers
const THEME_STROKE_MULT: Record<string, number> = {
  CLASSIC: 1, MODERN: 0.8, MINIMAL: 0.5, LUXURY: 1.3, BOLD: 1.6, VINTAGE: 0.9,
};

function fitFontSize(text: string, baseSize: number, maxArcLen: number, charW = 0.6): number {
  if (!text) return baseSize;
  const est = text.length * baseSize * charW;
  if (est <= maxArcLen) return baseSize;
  const fitted = maxArcLen / (text.length * charW);
  return Math.max(6.5, fitted);
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
  const spacing = extraSpace / gaps;
  return Math.max(minSpacing, Math.min(spacing, maxSpacing));
}

function safeArcFontSize(
  text: string, maxRadius: number, isArabic: boolean,
  baseFontSize: number, spreadLimit = ARC_SPREAD_LIMIT,
  maxLetterSpacing?: number
): { fontSize: number; letterSpacing: number } {
  const charW = 0.54;
  const minSpacing = isArabic ? 0.5 : 1;
  // Cap English letter spacing to prevent over-spaced unreadable text
  const maxSp = maxLetterSpacing ?? (isArabic ? 12 : 6);
  const arcLen = maxRadius * Math.PI * spreadLimit;
  const fontSize = fitFontSize(text, baseFontSize, arcLen, charW);
  const letterSpacing = computeArcLetterSpacing(text, fontSize, maxRadius, spreadLimit, charW, minSpacing, maxSp);
  return { fontSize, letterSpacing };
}

/** Get separator glyph character for the given style */
function separatorGlyph(style: SeparatorStyle): string {
  switch (style) {
    case 'dot': return '●'; case 'star': return '★'; case 'square': return '■';
    case 'diamond': return '◆'; case 'line': return '—'; case 'double-line': return '═';
    case 'triangle': return '▲'; case 'cross': return '✦'; case 'floral': return '❀';
    case 'ornament': return '❖'; case 'dash': return '—'; case 'circle': return '◉';
    case 'none': return '';
  }
}

export function separatorLabel(style: SeparatorStyle): string {
  switch (style) {
    case 'dot': return 'Dot'; case 'star': return 'Star'; case 'square': return 'Square';
    case 'diamond': return 'Diamond'; case 'line': return 'Line'; case 'double-line': return 'Double Line';
    case 'triangle': return 'Triangle'; case 'cross': return 'Cross'; case 'floral': return 'Floral';
    case 'ornament': return 'Ornament'; case 'dash': return 'Dash'; case 'circle': return 'Ring';
    case 'none': return 'None';
  }
}

export const ALL_SEPARATOR_STYLES: SeparatorStyle[] = [
  'dot', 'star', 'square', 'diamond', 'line', 'double-line', 'triangle', 'cross', 'floral', 'ornament', 'none'
];

function renderSeparators(cx: number, cy: number, r: number, style: SeparatorStyle, ink: string, dataPrefix = 'separator'): string {
  if (style === 'none') return '';
  const glyph = separatorGlyph(style);
  const fontSize = (style === 'line' || style === 'double-line' || style === 'dash') ? 16
    : (style === 'floral' || style === 'ornament') ? 14 : 13;
  return `
    <text data-stamp-element="${dataPrefix}-right" x="${cx + r}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-size="${fontSize}" fill="${ink}" font-weight="bold">${glyph}</text>
    <text data-stamp-element="${dataPrefix}-left" x="${cx - r}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-size="${fontSize}" fill="${ink}" font-weight="bold">${glyph}</text>
  `;
}

function renderBottomArcTextPath(
  text: string, cx: number, cy: number, r: number,
  fontSize: number, font: string, ink: string, letterSpacing: number,
  isArabic: boolean, pathId: string, fontWeight = '800'
): string {
  if (!text) return '';
  // Bottom arc: draw from left to right below center, text hangs from path
  // Use a slight vertical offset to prevent text sinking below the ring
  const verticalNudge = fontSize * 0.15;
  const adjustedCy = cy - verticalNudge;
  const arcPath = `M ${cx - r} ${adjustedCy} A ${r} ${r} 0 0 0 ${cx + r} ${adjustedCy}`;
  return `
    <defs><path id="${pathId}" d="${arcPath}"/></defs>
    <text data-stamp-element="${pathId}" font-family="${font}" font-size="${fontSize}" fill="${ink}" 
      letter-spacing="${letterSpacing}" font-weight="${fontWeight}" dominant-baseline="hanging">
      <textPath href="#${pathId}" startOffset="50%" text-anchor="middle">${text}</textPath>
    </text>
  `;
}

function renderTopArcTextPath(
  text: string, cx: number, cy: number, r: number,
  fontSize: number, font: string, ink: string, letterSpacing: number,
  isArabic: boolean, pathId: string, fontWeight = '800'
): string {
  if (!text) return '';
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
  return `
    <defs><path id="${pathId}" d="${arcPath}"/></defs>
    <text data-stamp-element="${pathId}" font-family="${font}" font-size="${fontSize}" fill="${ink}" 
      letter-spacing="${letterSpacing}" font-weight="${fontWeight}">
      <textPath href="#${pathId}" startOffset="50%" text-anchor="middle">${text}</textPath>
    </text>
  `;
}

function renderOuterRing(cx: number, cy: number, r: number, ink: string, borderStyle: BorderStyleType, sw: number): string {
  const dashMap: Record<string, string> = {
    SINGLE: 'none', DOUBLE: 'none', RING: 'none', DOTTED: '3,3', ROPE: '6,4', CUSTOM: '2,2,6,2',
  };
  const dash = dashMap[borderStyle] || 'none';
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ink}" stroke-width="${sw}" ${dash !== 'none' ? `stroke-dasharray="${dash}"` : ''}/>`;
}

function renderOuterEllipse(cx: number, cy: number, rx: number, ry: number, ink: string, borderStyle: BorderStyleType, sw: number): string {
  const dashMap: Record<string, string> = {
    SINGLE: 'none', DOUBLE: 'none', RING: 'none', DOTTED: '3,3', ROPE: '6,4', CUSTOM: '2,2,6,2',
  };
  const dash = dashMap[borderStyle] || 'none';
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${ink}" stroke-width="${sw}" ${dash !== 'none' ? `stroke-dasharray="${dash}"` : ''}/>`;
}

function renderOuterRect(x: number, y: number, w: number, h: number, rr: number, ink: string, borderStyle: BorderStyleType, sw: number): string {
  const dashMap: Record<string, string> = {
    SINGLE: 'none', DOUBLE: 'none', RING: 'none', DOTTED: '3,3', ROPE: '6,4', CUSTOM: '2,2,6,2',
  };
  const dash = dashMap[borderStyle] || 'none';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rr}" fill="none" stroke="${ink}" stroke-width="${sw}" ${dash !== 'none' ? `stroke-dasharray="${dash}"` : ''}/>`;
}

function renderDivider(cx: number, y: number, color: string, width: number, style: DividerStyle): string {
  if (style === 'none') return '';
  if (style === 'line') return `<line x1="${cx - width}" y1="${y}" x2="${cx + width}" y2="${y}" stroke="${color}" stroke-width="0.8"/>`;
  if (style === 'ornate') {
    return `<line x1="${cx - width}" y1="${y}" x2="${cx - 6}" y2="${y}" stroke="${color}" stroke-width="0.7"/>
      <circle cx="${cx}" cy="${y}" r="2.5" fill="${color}" opacity="0.7"/>
      <line x1="${cx + 6}" y1="${y}" x2="${cx + width}" y2="${y}" stroke="${color}" stroke-width="0.7"/>`;
  }
  return `<line x1="${cx - width}" y1="${y}" x2="${cx - 5}" y2="${y}" stroke="${color}" stroke-width="0.7"/>
    <polygon points="${cx},${y - 3} ${cx + 4},${y} ${cx},${y + 3} ${cx - 4},${y}" fill="${color}"/>
    <line x1="${cx + 5}" y1="${y}" x2="${cx + width}" y2="${y}" stroke="${color}" stroke-width="0.7"/>`;
}

function renderCenterIcon(cx: number, cy: number, iconR: number, iconType: CenterIconType, color: string): string {
  const s = iconR * 0.7;
  switch (iconType) {
    case 'shield':
      return `<path d="M ${cx} ${cy - s} L ${cx + s * 0.8} ${cy - s * 0.4} L ${cx + s * 0.8} ${cy + s * 0.2} Q ${cx + s * 0.4} ${cy + s} ${cx} ${cy + s * 1.1} Q ${cx - s * 0.4} ${cy + s} ${cx - s * 0.8} ${cy + s * 0.2} L ${cx - s * 0.8} ${cy - s * 0.4} Z" fill="none" stroke="${color}" stroke-width="1.5"/>`;
    case 'crown':
      return `<path d="M ${cx - s * 0.7} ${cy + s * 0.3} L ${cx - s * 0.7} ${cy - s * 0.1} L ${cx - s * 0.35} ${cy + s * 0.1} L ${cx} ${cy - s * 0.6} L ${cx + s * 0.35} ${cy + s * 0.1} L ${cx + s * 0.7} ${cy - s * 0.1} L ${cx + s * 0.7} ${cy + s * 0.3} Z" fill="none" stroke="${color}" stroke-width="1.5"/>`;
    case 'building':
      return `<rect x="${cx - s * 0.5}" y="${cy - s * 0.8}" width="${s}" height="${s * 1.6}" rx="1" fill="none" stroke="${color}" stroke-width="1.2"/>
        <line x1="${cx}" y1="${cy - s * 0.8}" x2="${cx}" y2="${cy + s * 0.8}" stroke="${color}" stroke-width="0.6"/>
        <line x1="${cx - s * 0.5}" y1="${cy}" x2="${cx + s * 0.5}" y2="${cy}" stroke="${color}" stroke-width="0.6"/>`;
    case 'globe':
      return `<circle cx="${cx}" cy="${cy}" r="${s * 0.7}" fill="none" stroke="${color}" stroke-width="1.2"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${s * 0.35}" ry="${s * 0.7}" fill="none" stroke="${color}" stroke-width="0.7"/>
        <line x1="${cx - s * 0.7}" y1="${cy}" x2="${cx + s * 0.7}" y2="${cy}" stroke="${color}" stroke-width="0.6"/>`;
  }
}

export function deriveInitials(name: string): string {
  if (!name) return '';
  const skip = new Set(['LLC', 'L.L.C', 'FZE', 'FZCO', 'CO', 'CO.', 'INC', 'LTD', 'PLC', 'CORP', 'THE', 'AND', 'OF', 'FOR']);
  const words = name.trim().split(/\s+/).filter(w => w.length > 0 && !skip.has(w.toUpperCase().replace(/[.,]/g, '')));
  const source = words.length >= 2 ? words : name.trim().split(/\s+/).filter(w => w.length > 0);
  return source.slice(0, 3).map(w => w[0]).join('').toUpperCase();
}

// ─── ROUND STAMP GENERATION ────────────────────────────────────────
function generateRoundStamp(config: OfficialStampConfig): string {
  const S = config.size || 320;
  const cx = S / 2;
  const cy = S / 2;
  const enFont = config.fontFamily || ENGLISH_FONT;
  const arFont = config.arabicFont || ARABIC_FONT;
  const bs = config.borderStyle || 'DOUBLE';
  const ds = config.dividerStyle || 'diamond';
  const ink = config.inkColor || INK_BLUE;
  const mode = config.languageMode || 'BILINGUAL';
  const themeMult = THEME_STROKE_MULT[config.styleTheme || 'CLASSIC'] || 1;

  // Ring radii with configurable gap
  const gapPct = config.circleGap != null ? config.circleGap / 100 : 0.13;
  const outerR = S * OUTER_R_PCT;
  const middleR = S * (OUTER_R_PCT - gapPct);
  const innerR = middleR - S * 0.07;

  // Company text arc radius — controlled by companyArcBandOffset (0-100, default 50 = midpoint)
  const compBandPct = Math.max(0, Math.min(100, config.companyArcBandOffset ?? 50));
  const compBandMin = middleR + SAFE_ZONE;
  const compBandMax = outerR - SAFE_ZONE;
  const clampedTextArcR = compBandMin + (compBandMax - compBandMin) * (compBandPct / 100);

  // Separator distance: configurable via separatorDistancePct (0-100, default 50 = centered)
  // 0 = closest to middle ring, 100 = closest to outer ring (edge-to-edge)
  const sepPct = Math.max(0, Math.min(100, config.separatorDistancePct ?? 50));
  const sepMin = middleR + 2; // allow touching the ring edge
  const sepMax = outerR - 2; // allow touching the outer ring edge
  const separatorR = sepMin + (sepMax - sepMin) * (sepPct / 100);

  // Location text arc radius — controlled by locationArcBandOffset (0-100, default 50 = midpoint)
  const locBandPct = Math.max(0, Math.min(100, config.locationArcBandOffset ?? 50));
  const locBandMin = innerR + SAFE_ZONE;
  const locBandMax = middleR - SAFE_ZONE;
  const clampedLocTextR = locBandMin + (locBandMax - locBandMin) * (locBandPct / 100);

  // Arc spreads — independent for Arabic and English
  const arabicSpread = config.arabicArcSpread ?? ARC_SPREAD_LIMIT;
  const englishSpread = config.englishArcSpread ?? ARC_SPREAD_LIMIT;

  // Arc text spacing override — applies to English letter-spacing
  const arcTextSpacingOverride = config.arcTextSpacing;

  // ─── Text arcs based on language mode ───
  let topArcContent = '';
  let bottomArcContent = '';
  let separatorContent = '';

  if (mode === 'BILINGUAL') {
    const arText = config.companyNameAr || 'اسم الشركة';
    const enText = normalizeEnglishTokenSpacing((config.companyNameEn || 'COMPANY NAME').toUpperCase());
    const arSafe = safeArcFontSize(arText, clampedTextArcR, true, 17, arabicSpread);
    const enSafe = safeArcFontSize(enText, clampedTextArcR, false, 15, englishSpread, 5);
    const arLS = config.arabicLetterSpacing ?? arSafe.letterSpacing;
    const enLS = arcTextSpacingOverride ?? enSafe.letterSpacing;
    const arFW = config.arabicFontWeight === 'normal' ? '600' : '800';

    if (config.arabicOnTop !== false) {
      topArcContent = renderTopArcTextPath(
        arText, cx, cy, clampedTextArcR, arSafe.fontSize, arFont, ink,
        arLS, true, 'top-arc', arFW
      );
      bottomArcContent = renderBottomArcTextPath(
        enText, cx, cy, clampedTextArcR, enSafe.fontSize, enFont, ink,
        enLS, false, 'bottom-arc'
      );
    } else {
      topArcContent = renderTopArcTextPath(
        enText, cx, cy, clampedTextArcR, enSafe.fontSize, enFont, ink,
        enLS, false, 'top-arc'
      );
      bottomArcContent = renderBottomArcTextPath(
        arText, cx, cy, clampedTextArcR, arSafe.fontSize, arFont, ink,
        arLS, true, 'bottom-arc', arFW
      );
    }
    separatorContent = renderSeparators(cx, cy, separatorR, config.separatorStyle, ink);

  } else if (mode === 'EN') {
    // English only — company name on top arc, location on bottom arc (all English)
    const topText = normalizeEnglishTokenSpacing(config.companyNameEn.toUpperCase() || 'COMPANY NAME');
    const topSafe = safeArcFontSize(topText, clampedTextArcR, false, 15, englishSpread, 5);
    const enLSonly = arcTextSpacingOverride ?? topSafe.letterSpacing;
    topArcContent = renderTopArcTextPath(
      topText, cx, cy, clampedTextArcR, topSafe.fontSize, enFont, ink,
      enLSonly, false, 'top-arc'
    );
    if (config.showLocation) {
      const locEn = config.locationTextEn || 'Dubai, UAE';
      const botSafe = safeArcFontSize(locEn.toUpperCase(), clampedTextArcR, false, 12, englishSpread, 5);
      bottomArcContent = renderBottomArcTextPath(
        locEn.toUpperCase(), cx, cy, clampedTextArcR, botSafe.fontSize, enFont, ink,
        botSafe.letterSpacing, false, 'bottom-arc', '600'
      );
    }
    separatorContent = renderSeparators(cx, cy, separatorR, config.separatorStyle, ink);

  } else if (mode === 'AR') {
    // Arabic only — company name on top arc, location on bottom arc (all Arabic)
    const topText = config.companyNameAr || config.companyNameEn || 'اسم الشركة';
    const topSafe = safeArcFontSize(topText, clampedTextArcR, true, 17, arabicSpread);
    const topLS = config.arabicLetterSpacing ?? topSafe.letterSpacing;
    const topFW = config.arabicFontWeight === 'normal' ? '600' : '800';
    topArcContent = renderTopArcTextPath(
      topText, cx, cy, clampedTextArcR, topSafe.fontSize, arFont, ink,
      topLS, true, 'top-arc', topFW
    );
    // Arabic location on bottom
    if (config.showLocation) {
      const locAr = config.locationTextAr || 'دبي، الإمارات';
      const botSafe = safeArcFontSize(locAr, clampedTextArcR, true, 13, arabicSpread);
      bottomArcContent = renderBottomArcTextPath(
        locAr, cx, cy, clampedTextArcR, botSafe.fontSize, arFont, ink,
        config.arabicLetterSpacing ?? botSafe.letterSpacing, true, 'bottom-arc', '600'
      );
    }
    separatorContent = renderSeparators(cx, cy, separatorR, config.separatorStyle, ink);
  }

  // ─── Location text (inner ring zone) — only for BILINGUAL ───
  let locationContent = '';
  if (config.showLocation && mode === 'BILINGUAL') {
    const locEn = config.locationTextEn || 'Dubai, UAE';
    const locAr = config.locationTextAr || 'دبي، الإمارات';
    const locEnSafe = safeArcFontSize(locEn.toUpperCase(), clampedLocTextR, false, 12, englishSpread);
    const locArSafe = safeArcFontSize(locAr, clampedLocTextR, true, 12, arabicSpread);

    locationContent = renderTopArcTextPath(
      locAr, cx, cy, clampedLocTextR, locArSafe.fontSize, arFont, ink, locArSafe.letterSpacing, true, 'loc-top', '600'
    );
    locationContent += renderBottomArcTextPath(
      locEn.toUpperCase(), cx, cy, clampedLocTextR, locEnSafe.fontSize, enFont, ink, locEnSafe.letterSpacing, false, 'loc-bottom', '600'
    );
    if (config.locationSeparatorStyle && config.locationSeparatorStyle !== 'none') {
      locationContent += renderSeparators(cx, cy, clampedLocTextR, config.locationSeparatorStyle, ink, 'loc-separator');
    }
  }

  // ─── Center content ───
  const centerContent = renderCenterContent(config, cx, cy, innerR, enFont, ink);

  // ─── Registration number — circular arc inside inner ring ───
  const centerMode = config.centerMode || (config.showLogo ? 'logo' : config.showMonogram ? 'monogram' : 'none');
  let regContent = '';
  if (config.showRegistration && config.registrationNumber && centerMode !== 'license') {
    // Render as circular arc at bottom of inner ring
    const regArcR = innerR * 0.75;
    const regSafe = safeArcFontSize(config.registrationNumber, regArcR, false, 7, 0.85, 3);
    regContent = renderBottomArcTextPath(
      config.registrationNumber, cx, cy, regArcR, regSafe.fontSize, enFont, ink,
      regSafe.letterSpacing, false, 'registration', '500'
    );
  }

  // ─── Border rings ───
  const outerSW = (config.outerBorderWidth ?? OUTER_STROKE) * themeMult;
  const middleSW = (config.innerBorderWidth ?? MIDDLE_STROKE) * themeMult;
  const innerSW = INNER_STROKE * themeMult;

  // Per-border color overrides
  const outerInk = config.outerBorderColor || ink;
  const middleInk = config.middleBorderColor || ink;
  const innerInk = config.innerBorderColor || ink;

  const outerRingEl = `<circle data-stamp-element="border-outer" cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${outerInk}" stroke-width="${outerSW}" ${
    bs === 'DOTTED' ? 'stroke-dasharray="3,3"' : bs === 'ROPE' ? 'stroke-dasharray="6,4"' : bs === 'CUSTOM' ? 'stroke-dasharray="2,2,6,2"' : ''
  }/>`;

  // Decorative ring — only for DOUBLE, RING, CUSTOM (NOT single)
  const decorativeR = outerR - outerSW / 2 - 2;
  const decorativeRingEl = (bs === 'DOUBLE' || bs === 'RING' || bs === 'CUSTOM')
    ? `<circle data-stamp-element="border-decorative" cx="${cx}" cy="${cy}" r="${decorativeR}" fill="none" stroke="${outerInk}" stroke-width="${DECORATIVE_STROKE * themeMult}" opacity="0.5"/>`
    : '';

  const middleRingEl = `<circle data-stamp-element="border-middle" cx="${cx}" cy="${cy}" r="${middleR}" fill="none" stroke="${middleInk}" stroke-width="${middleSW}"/>`;
  // RING style: thicker middle ring
  const middleRingFinal = bs === 'RING'
    ? `<circle data-stamp-element="border-middle" cx="${cx}" cy="${cy}" r="${middleR}" fill="none" stroke="${middleInk}" stroke-width="${middleSW * 1.4}"/>`
    : middleRingEl;

  // Dynamic ring system: if location is disabled, hide inner ring (location ring) 
  // and let center content fill the space between middle ring and center
  const showInnerRing = config.showLocation && mode === 'BILINGUAL';
  const innerRingEl = showInnerRing
    ? `<circle data-stamp-element="border-inner" cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${innerInk}" stroke-width="${innerSW}"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
    ${outerRingEl}${decorativeRingEl}${middleRingFinal}${innerRingEl}
    ${topArcContent}${bottomArcContent}${separatorContent}${locationContent}${centerContent}${regContent}
  </svg>`;
}

// ─── OVAL STAMP GENERATION ────────────────────────────────────────
function generateOvalStamp(config: OfficialStampConfig): string {
  const S = config.size || 320;
  const cx = S / 2;
  const cy = S / 2;
  const enFont = config.fontFamily || ENGLISH_FONT;
  const arFont = config.arabicFont || ARABIC_FONT;
  const bs = config.borderStyle || 'DOUBLE';
  const ink = config.inkColor || INK_BLUE;
  const mode = config.languageMode || 'BILINGUAL';
  const themeMult = THEME_STROKE_MULT[config.styleTheme || 'CLASSIC'] || 1;

  const pad = 14;
  const outerRx = cx - pad;
  const outerRy = cy - pad - 15;
  const gap = 10;
  const innerRx = outerRx - gap;
  const innerRy = outerRy - gap;
  const outerSW = (config.outerBorderWidth ?? OUTER_STROKE) * themeMult;
  const innerSW = (config.innerBorderWidth ?? MIDDLE_STROKE) * themeMult;

  let borders = renderOuterEllipse(cx, cy, outerRx, outerRy, ink, bs, outerSW);
  if (bs === 'DOUBLE' || bs === 'RING' || bs === 'CUSTOM') {
    borders += `<ellipse cx="${cx}" cy="${cy}" rx="${innerRx}" ry="${innerRy}" fill="none" stroke="${ink}" stroke-width="${innerSW * 0.7}"/>`;
  }

  // Safe text arc radius — keep well inside borders with generous margin
  const textArcR = Math.min(innerRx, innerRy) - 14;
  const arabicSpread = config.arabicArcSpread ?? ARC_SPREAD_LIMIT;

  let textContent = '';
  if (mode === 'BILINGUAL') {
    const arText = config.companyNameAr || 'اسم الشركة';
    const enText = (config.companyNameEn || 'COMPANY NAME').toUpperCase();
    const arSafe = safeArcFontSize(arText, textArcR, true, 13, arabicSpread);
    const enSafe = safeArcFontSize(enText, textArcR, false, 11, ARC_SPREAD_LIMIT, 4);
    const arFW = config.arabicFontWeight === 'normal' ? '600' : '800';
    if (config.arabicOnTop !== false) {
      textContent += renderTopArcTextPath(arText, cx, cy, textArcR, arSafe.fontSize, arFont, ink, config.arabicLetterSpacing ?? arSafe.letterSpacing, true, 'top-arc', arFW);
      textContent += renderBottomArcTextPath(enText, cx, cy, textArcR, enSafe.fontSize, enFont, ink, enSafe.letterSpacing, false, 'bottom-arc');
    } else {
      textContent += renderTopArcTextPath(enText, cx, cy, textArcR, enSafe.fontSize, enFont, ink, enSafe.letterSpacing, false, 'top-arc');
      textContent += renderBottomArcTextPath(arText, cx, cy, textArcR, arSafe.fontSize, arFont, ink, config.arabicLetterSpacing ?? arSafe.letterSpacing, true, 'bottom-arc', arFW);
    }
    textContent += renderSeparators(cx, cy, textArcR, config.separatorStyle, ink);
  } else if (mode === 'EN') {
    const topText = (config.companyNameEn || 'COMPANY NAME').toUpperCase();
    const topSafe = safeArcFontSize(topText, textArcR, false, 12, ARC_SPREAD_LIMIT, 4);
    textContent += renderTopArcTextPath(topText, cx, cy, textArcR, topSafe.fontSize, enFont, ink, topSafe.letterSpacing, false, 'top-arc');
    if (config.showLocation) {
      const loc = (config.locationTextEn || 'Dubai, UAE').toUpperCase();
      const locSafe = safeArcFontSize(loc, textArcR, false, 10, ARC_SPREAD_LIMIT, 4);
      textContent += renderBottomArcTextPath(loc, cx, cy, textArcR, locSafe.fontSize, enFont, ink, locSafe.letterSpacing, false, 'bottom-arc', '600');
    }
    textContent += renderSeparators(cx, cy, textArcR, config.separatorStyle, ink);
  } else {
    const topText = config.companyNameAr || 'اسم الشركة';
    const topSafe = safeArcFontSize(topText, textArcR, true, 13, arabicSpread);
    textContent += renderTopArcTextPath(topText, cx, cy, textArcR, topSafe.fontSize, arFont, ink, config.arabicLetterSpacing ?? topSafe.letterSpacing, true, 'top-arc', config.arabicFontWeight === 'normal' ? '600' : '800');
    if (config.showLocation) {
      const loc = config.locationTextAr || 'دبي، الإمارات';
      const locSafe = safeArcFontSize(loc, textArcR, true, 11, arabicSpread);
      textContent += renderBottomArcTextPath(loc, cx, cy, textArcR, locSafe.fontSize, arFont, ink, config.arabicLetterSpacing ?? locSafe.letterSpacing, true, 'bottom-arc', '600');
    }
    textContent += renderSeparators(cx, cy, textArcR, config.separatorStyle, ink);
  }

  // Center content
  const smallInnerR = Math.min(innerRx, innerRy) * 0.38;
  textContent += renderCenterContent(config, cx, cy, smallInnerR, enFont, ink);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
    ${borders}${textContent}
  </svg>`;
}

// ─── RECT / SQUARE STAMP GENERATION ────────────────────────────────
function generateRectStamp(config: OfficialStampConfig, isSquare: boolean): string {
  const S = config.size || 320;
  const cx = S / 2;
  const cy = S / 2;
  const enFont = config.fontFamily || ENGLISH_FONT;
  const arFont = config.arabicFont || ARABIC_FONT;
  const bs = config.borderStyle || 'DOUBLE';
  const ink = config.inkColor || INK_BLUE;
  const mode = config.languageMode || 'BILINGUAL';
  const themeMult = THEME_STROKE_MULT[config.styleTheme || 'CLASSIC'] || 1;
  const pad = 14;

  const w = isSquare ? S - pad * 2 : S - pad * 2;
  const h = isSquare ? S - pad * 2 : (S - pad * 2) * 0.6;
  const x0 = (S - w) / 2;
  const y0 = (S - h) / 2;
  const rr = isSquare ? 8 : 10;
  const outerSW = (config.outerBorderWidth ?? OUTER_STROKE) * themeMult;
  const innerSW = (config.innerBorderWidth ?? MIDDLE_STROKE) * themeMult;

  let borders = renderOuterRect(x0, y0, w, h, rr, ink, bs, outerSW);
  if (bs === 'DOUBLE' || bs === 'RING' || bs === 'CUSTOM') {
    const gap = 8;
    borders += `<rect x="${x0 + gap}" y="${y0 + gap}" width="${w - gap * 2}" height="${h - gap * 2}" rx="${Math.max(2, rr - 3)}" fill="none" stroke="${ink}" stroke-width="${innerSW * 0.7}"/>`;
  }

  // Safe content area — keep well inside borders with extra padding
  const safeW = w - 60;
  const lineH = isSquare ? 18 : 15;
  const lines: { text: string; font: string; size: number; weight: string; opacity?: number }[] = [];

  if (mode === 'BILINGUAL') {
    const arText = config.companyNameAr || 'اسم الشركة';
    const enText = (config.companyNameEn || 'COMPANY NAME').toUpperCase();
    if (config.arabicOnTop !== false) {
      lines.push({ text: arText, font: arFont, size: Math.min(Math.max(8, fitFontSize(arText, 13, safeW, 0.5)), safeW / (arText.length * 0.55)), weight: config.arabicFontWeight === 'normal' ? '600' : '800' });
      lines.push({ text: enText, font: enFont, size: Math.min(Math.max(7, fitFontSize(enText, 11, safeW, 0.55)), safeW / (enText.length * 0.55)), weight: '700' });
    } else {
      lines.push({ text: enText, font: enFont, size: Math.min(Math.max(7, fitFontSize(enText, 11, safeW, 0.55)), safeW / (enText.length * 0.55)), weight: '700' });
      lines.push({ text: arText, font: arFont, size: Math.min(Math.max(8, fitFontSize(arText, 13, safeW, 0.5)), safeW / (arText.length * 0.55)), weight: config.arabicFontWeight === 'normal' ? '600' : '800' });
    }
    if (config.showLocation) {
      const loc = (config.locationTextEn || 'Dubai, UAE').toUpperCase();
      lines.push({ text: loc, font: enFont, size: 8, weight: '400', opacity: 0.7 });
    }
  } else if (mode === 'EN') {
    const enText = (config.companyNameEn || 'COMPANY NAME').toUpperCase();
    lines.push({ text: enText, font: enFont, size: Math.max(8, fitFontSize(enText, 13, safeW, 0.55)), weight: '700' });
    if (config.showLocation) {
      const loc = (config.locationTextEn || 'Dubai, UAE').toUpperCase();
      lines.push({ text: loc, font: enFont, size: 9, weight: '400', opacity: 0.7 });
    }
  } else {
    const arText = config.companyNameAr || config.companyNameEn || 'اسم الشركة';
    lines.push({ text: arText, font: arFont, size: Math.max(8, fitFontSize(arText, 13, safeW, 0.5)), weight: config.arabicFontWeight === 'normal' ? '600' : '800' });
    if (config.showLocation) {
      const loc = config.locationTextAr || 'دبي، الإمارات';
      lines.push({ text: loc, font: arFont, size: 9, weight: '400', opacity: 0.7 });
    }
  }

  if (config.showRegistration && config.registrationNumber) {
    lines.push({ text: config.registrationNumber, font: enFont, size: 7.5, weight: '400', opacity: 0.65 });
  }

  const totalH = lines.length * lineH;
  let startY = cy - totalH / 2 + lineH / 2;

  // Center monogram/logo above text
  const mono = config.monogramText || deriveInitials(config.companyNameEn);
  const centerMode = config.centerMode || (config.showLogo ? 'logo' : config.showMonogram ? 'monogram' : 'none');
  let centerEl = '';
  if (centerMode === 'monogram' && mono) {
    const monoSize = mono.length === 1 ? 16 : mono.length === 2 ? 12 : 10;
    centerEl = `<text data-stamp-element="center" x="${cx}" y="${startY - lineH}" font-family="${enFont}" font-size="${monoSize}" fill="${ink}" text-anchor="middle" dominant-baseline="central" font-weight="700" opacity="0.85">${mono.toUpperCase()}</text>`;
    centerEl += `<line x1="${cx - 18}" y1="${startY - lineH / 2 + 2}" x2="${cx + 18}" y2="${startY - lineH / 2 + 2}" stroke="${ink}" stroke-width="0.6" opacity="0.5"/>`;
  } else if (centerMode === 'logo' && config.logoUrl) {
    const imgSize = 24;
    centerEl = `<image data-stamp-element="center" href="${config.logoUrl}" x="${cx - imgSize / 2}" y="${startY - lineH - imgSize / 2}" width="${imgSize}" height="${imgSize}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  let textContent = centerEl;
  lines.forEach((ln, i) => {
    const y = startY + i * lineH;
    textContent += `<text data-stamp-element="${i === 0 ? 'top-arc' : i === 1 ? 'bottom-arc' : 'loc-' + i}" x="${cx}" y="${y}" font-family="${ln.font}" font-size="${ln.size}" fill="${ink}" text-anchor="middle" dominant-baseline="central" font-weight="${ln.weight}"${ln.opacity ? ` opacity="${ln.opacity}"` : ''}>${ln.text}</text>`;
    if (i === 0 && lines.length > 1) {
      const sep = safeW * 0.35;
      textContent += `<line x1="${cx - sep}" y1="${y + lineH * 0.4}" x2="${cx + sep}" y2="${y + lineH * 0.4}" stroke="${ink}" stroke-width="0.6" opacity="0.45"/>`;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
    ${borders}${textContent}
  </svg>`;
}

// ─── Center content renderer (shared) ────────────────────────────────
function renderCenterContent(config: OfficialStampConfig, cx: number, cy: number, innerR: number, enFont: string, ink: string): string {
  const centerMode = config.centerMode || (config.showLogo ? 'logo' : config.showMonogram ? 'monogram' : 'none');
  const mono = config.monogramText || '';
  const centerScale = config.centerContentScale ?? 1;

  switch (centerMode) {
    case 'logo':
      if (config.logoUrl) {
        const imgSize = innerR * 1.5 * centerScale;
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
        const userLetterColors = config.monogramLetterColors;
        const userDividerColor = config.monogramDividerColor;
        // POLICY: Default ALL letters to ink color (no forced gold for normal users)
        // Owner-specific JBJ branding is applied at the wizard/UI level, not here
        const tspans = upper.split('').map((ch, i) => {
          const fill = (userLetterColors && userLetterColors[i] !== undefined)
            ? userLetterColors[i]
            : ink;  // All letters default to ink color
          return `<tspan fill="${fill}">${ch}</tspan>`;
        }).join('');
        // Divider defaults to ink unless user explicitly overrides
        const divColor = userDividerColor ?? ink;
        // Tighter monogram letter spacing (was 2, now 1)
        const monoLetterSpacing = upper.length >= 3 ? 1 : 2;
        const divW = scaledSize * 0.6;
        const divY = cy + scaledSize * 0.45;
        const divider = upper.length >= 2 ? `<line x1="${cx - divW}" y1="${divY}" x2="${cx + divW}" y2="${divY}" stroke="${divColor}" stroke-width="1.2" opacity="0.8"/>` : '';
        return `<text data-stamp-element="center" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-family="${enFont}" font-size="${scaledSize}" font-weight="700" letter-spacing="${monoLetterSpacing}">${tspans}</text>${divider}`;
      }
      return '';
    case 'initials': {
      const initials = deriveInitials(config.companyNameEn) || mono;
      if (initials) {
        const baseSize = initials.length === 1 ? innerR * 0.85 : initials.length === 2 ? innerR * 0.65 : innerR * 0.50;
        return `<text data-stamp-element="center" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-family="${enFont}" font-size="${baseSize * centerScale}" fill="${ink}" font-weight="700" letter-spacing="2">${initials}</text>`;
      }
      return '';
    }
    case 'icon':
      return renderCenterIcon(cx, cy, innerR * 0.8 * centerScale, config.centerIcon || 'shield', ink);
    case 'license':
      if (config.registrationNumber) {
        const regSize = fitFontSize(config.registrationNumber, 11, innerR * 1.4, 0.6);
        return `<text data-stamp-element="center" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-family="${enFont}" font-size="${regSize}" fill="${ink}" font-weight="700" letter-spacing="1">${config.registrationNumber}</text>`;
      }
      return '';
    default:
      if (config.showLogo && config.logoUrl) {
        const imgSize = innerR * 1.5 * centerScale;
        return `<defs><clipPath id="center-clip"><circle cx="${cx}" cy="${cy}" r="${innerR - 2}"/></clipPath></defs>
          <image href="${config.logoUrl}" x="${cx - imgSize / 2}" y="${cy - imgSize / 2}" width="${imgSize}" height="${imgSize}" 
          clip-path="url(#center-clip)" preserveAspectRatio="xMidYMid meet" image-rendering="optimizeQuality"/>`;
      } else if (config.showMonogram && mono) {
        const baseSize = mono.length === 1 ? innerR * 0.85 : mono.length === 2 ? innerR * 0.65 : innerR * 0.50;
        return `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-family="${enFont}" font-size="${baseSize * centerScale}" fill="${ink}" font-weight="700" letter-spacing="2">${mono.toUpperCase()}</text>`;
      }
      return '';
  }
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────
export function generateOfficialStampSVG(config: OfficialStampConfig): string {
  const shape = config.shape || 'ROUND';
  switch (shape) {
    case 'OVAL': return generateOvalStamp(config);
    case 'RECTANGLE': return generateRectStamp(config, false);
    case 'SQUARE': return generateRectStamp(config, true);
    default: return generateRoundStamp(config);
  }
}

export const OFFICIAL_INK_BLUE = INK_BLUE;

export function getOwnerDefaultConfig(): OfficialStampConfig {
  return {
    companyNameEn: 'JBJ GLOBAL REAL ESTATE',
    companyNameAr: 'جي بي جي العقارية العالمية',
    arabicOnTop: true,
    locationTextEn: 'Dubai, UAE',
    locationTextAr: 'دبي، الإمارات',
    showLocation: true,
    separatorStyle: 'star',
    locationSeparatorStyle: 'none',
    monogramText: 'JBJ',
    showMonogram: true,
    showLogo: false,
    inkColor: INK_BLUE,
    showRegistration: false,
    borderStyle: 'DOUBLE',
    outerBorderWidth: 4,
    innerBorderWidth: MIDDLE_STROKE,
    dividerStyle: 'diamond',
    centerMode: 'monogram',
    languageMode: 'BILINGUAL',
    shape: 'ROUND',
  };
}
