/**
 * Owner's Official Standard Stamp Template — STANDARD MODEL
 * 
 * 3-circle layout with tapering thickness hierarchy:
 * - OUTER RING: 6px (boldest, authoritative)
 * - MIDDLE RING: 2.5px (medium, refined)  
 * - INNER RING: 1.2px (thinnest, elegant)
 * 
 * Premium gaps:
 * - Outer→Middle: ~13% of radius (wide premium gap)
 * - Middle→Inner: ~8% of radius (tight refined gap)
 * 
 * Layout:
 * - Arabic company name arcing the TOP (between outer & middle rings)
 * - English company name arcing the BOTTOM (between outer & middle rings)
 * - 10+ separator options at 3 & 9 o'clock
 * - Location text (English top arc, Arabic bottom arc) between middle & inner rings
 * - Center content: monogram/initials/logo/icon/license/none
 * - Navy Ink default: #1B3A8C
 * 
 * Safe zone: 7px minimum clearance between text and ring strokes.
 * 
 * Color tokens for StampSVGRenderer tinting:
 * - #1a2744 → Primary (outer ring, company text, borders)
 * - #2a3a5c → Secondary (inner rings, location text, decorative accents)
 * - #8b6914 → Accent (monogram, registration, center dividers)
 */

export type SeparatorStyle = 'dot' | 'star' | 'square' | 'diamond' | 'line' | 'double-line' | 'triangle' | 'cross' | 'floral' | 'ornament' | 'dash' | 'circle' | 'none';
export type BorderStyleType = 'SINGLE' | 'DOUBLE' | 'RING' | 'DOTTED' | 'ROPE' | 'CUSTOM';
export type DividerStyle = 'diamond' | 'line' | 'ornate' | 'none';
export type CenterContentMode = 'monogram' | 'initials' | 'logo' | 'icon' | 'license' | 'none';

/** Preset corporate icons for center content */
export type CenterIconType = 'shield' | 'crown' | 'building' | 'globe';

export interface OfficialStampConfig {
  companyNameEn: string;
  companyNameAr: string;
  arabicOnTop: boolean;
  locationTextEn?: string;
  locationTextAr?: string;
  showLocation: boolean;
  separatorStyle: SeparatorStyle;
  /** Location arc separator (between EN/AR location arcs) */
  locationSeparatorStyle?: SeparatorStyle;
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
  dividerStyle?: DividerStyle;
  /** Center content mode */
  centerMode?: CenterContentMode;
  /** Preset icon for center (when centerMode = 'icon') */
  centerIcon?: CenterIconType;
}

const ARABIC_FONT = '"Noto Naskh Arabic", "Arabic Typesetting", "Traditional Arabic", serif';
const ENGLISH_FONT = 'Georgia, "Times New Roman", serif';
const INK_BLUE = '#1B3A8C';

// Color tokens — these are replaced by StampSVGRenderer
const C_PRI = '#1a2744';
const C_SEC = '#2a3a5c';
const C_ACC = '#8b6914';

// ── Ring geometry constants (as % of stamp radius) ──
const OUTER_R_PCT = 0.46;     // outer ring radius
const MIDDLE_R_PCT = 0.33;    // middle ring — wide premium gap from outer (~13%)
const INNER_R_PCT = 0.26;     // inner ring — tighter gap from middle

// ── Stroke widths (tapering hierarchy — ministry-level precision) ──
const OUTER_STROKE = 4;       // boldest — clean, not chunky (matches real UAE ministry stamps)
const MIDDLE_STROKE = 2.5;    // medium
const INNER_STROKE = 1.2;     // thinnest
const DECORATIVE_STROKE = 0.5; // thin decorative ring just inside outer ring

// ── Safe zone ──
const SAFE_ZONE = 5;          // minimum px between text and ring strokes
const ARC_SPREAD_LIMIT = 0.88; // max fraction of semicircle for text — increased for full arc distribution

function fitFontSize(text: string, baseSize: number, maxArcLen: number, charW = 0.6): number {
  if (!text) return baseSize;
  const est = text.length * baseSize * charW;
  if (est <= maxArcLen) return baseSize;
  const fitted = maxArcLen / (text.length * charW);
  return Math.max(6.5, fitted);
}

/**
 * Compute dynamic letter-spacing so arc text fills the available arc segment evenly.
 * Returns spacing in px that distributes remaining arc space across character gaps.
 */
function computeArcLetterSpacing(
  text: string, fontSize: number, arcRadius: number,
  spreadLimit: number, avgCharWidth: number, minSpacing: number
): number {
  if (!text || text.length <= 1) return minSpacing;
  const availableArc = arcRadius * Math.PI * spreadLimit;
  const textWidth = text.length * fontSize * avgCharWidth;
  const gaps = text.length - 1;
  if (gaps <= 0) return minSpacing;
  const extraSpace = availableArc - textWidth;
  const spacing = extraSpace / gaps;
  return Math.max(minSpacing, Math.min(spacing, 12)); // cap at 12px
}

/**
 * Compute safe font size and letter-spacing for arc text to prevent collisions.
 * Returns { fontSize, letterSpacing } that guarantees no character overlap.
 */
function safeArcFontSize(
  text: string, maxRadius: number, isArabic: boolean,
  baseFontSize: number, spreadLimit = ARC_SPREAD_LIMIT
): { fontSize: number; letterSpacing: number } {
  const charW = isArabic ? 0.50 : 0.54;
  const minSpacing = isArabic ? 0.5 : 1;
  const arcLen = maxRadius * Math.PI * spreadLimit;
  const fontSize = fitFontSize(text, baseFontSize, arcLen, charW);
  const letterSpacing = computeArcLetterSpacing(text, fontSize, maxRadius, spreadLimit, charW, minSpacing);
  return { fontSize, letterSpacing };
}

/** Get separator glyph character for the given style */
function separatorGlyph(style: SeparatorStyle): string {
  switch (style) {
    case 'dot': return '●';
    case 'star': return '★';
    case 'square': return '■';
    case 'diamond': return '◆';
    case 'line': return '—';
    case 'double-line': return '═';
    case 'triangle': return '▲';
    case 'cross': return '✦';
    case 'floral': return '❀';
    case 'ornament': return '❖';
    case 'dash': return '—';
    case 'circle': return '◉';
    case 'none': return '';
  }
}

/** Separator glyph label for UI display */
export function separatorLabel(style: SeparatorStyle): string {
  switch (style) {
    case 'dot': return 'Dot';
    case 'star': return 'Star';
    case 'square': return 'Square';
    case 'diamond': return 'Diamond';
    case 'line': return 'Line';
    case 'double-line': return 'Double Line';
    case 'triangle': return 'Triangle';
    case 'cross': return 'Cross';
    case 'floral': return 'Floral';
    case 'ornament': return 'Ornament';
    case 'dash': return 'Dash';
    case 'circle': return 'Ring';
    case 'none': return 'None';
  }
}

/** All available separator styles */
export const ALL_SEPARATOR_STYLES: SeparatorStyle[] = [
  'dot', 'star', 'square', 'diamond', 'line', 'double-line', 'triangle', 'cross', 'floral', 'ornament', 'none'
];

function renderSeparators(cx: number, cy: number, r: number, style: SeparatorStyle, ink: string, dataPrefix = 'separator'): string {
  if (style === 'none') return '';
  const glyph = separatorGlyph(style);
  // Scale font size based on separator type
  const fontSize = (style === 'line' || style === 'double-line' || style === 'dash') ? 16
    : (style === 'floral' || style === 'ornament') ? 14
    : 13;
  return `
    <text data-stamp-element="${dataPrefix}-right" x="${cx + r}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-size="${fontSize}" fill="${ink}" font-weight="bold">${glyph}</text>
    <text data-stamp-element="${dataPrefix}-left" x="${cx - r}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-size="${fontSize}" fill="${ink}" font-weight="bold">${glyph}</text>
  `;
}

/**
 * Bottom arc text using SVG textPath — text follows the BOTTOM half of a circle.
 * Path sweeps LEFT→RIGHT through the bottom semicircle (counterclockwise).
 * Text reads naturally left-to-right — NO character reversal needed.
 */
function renderBottomArcTextPath(
  text: string, cx: number, cy: number, r: number,
  fontSize: number, font: string, ink: string, letterSpacing: number,
  isArabic: boolean, pathId: string, fontWeight = '800'
): string {
  if (!text) return '';
  // Bottom arc path: left (cx-r, cy) → counterclockwise through bottom → right (cx+r, cy)
  // large-arc=0, sweep=0 → takes the shorter (bottom) arc counterclockwise
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;
  return `
    <defs><path id="${pathId}" d="${arcPath}"/></defs>
    <text data-stamp-element="${pathId}" font-family="${font}" font-size="${fontSize}" fill="${ink}" 
      letter-spacing="${letterSpacing}" font-weight="${fontWeight}" dominant-baseline="hanging">
      <textPath href="#${pathId}" startOffset="50%" text-anchor="middle">${text}</textPath>
    </text>
  `;
}

/**
 * Top arc text using SVG textPath — text follows the top half of a circle.
 */
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

function renderDivider(cx: number, y: number, color: string, width: number, style: DividerStyle): string {
  if (style === 'none') return '';
  if (style === 'line') {
    return `<line x1="${cx - width}" y1="${y}" x2="${cx + width}" y2="${y}" stroke="${color}" stroke-width="0.8"/>`;
  }
  if (style === 'ornate') {
    return `
      <line x1="${cx - width}" y1="${y}" x2="${cx - 6}" y2="${y}" stroke="${color}" stroke-width="0.7"/>
      <circle cx="${cx}" cy="${y}" r="2.5" fill="${color}" opacity="0.7"/>
      <line x1="${cx + 6}" y1="${y}" x2="${cx + width}" y2="${y}" stroke="${color}" stroke-width="0.7"/>`;
  }
  // diamond (default)
  return `
    <line x1="${cx - width}" y1="${y}" x2="${cx - 5}" y2="${y}" stroke="${color}" stroke-width="0.7"/>
    <polygon points="${cx},${y - 3} ${cx + 4},${y} ${cx},${y + 3} ${cx - 4},${y}" fill="${color}"/>
    <line x1="${cx + 5}" y1="${y}" x2="${cx + width}" y2="${y}" stroke="${color}" stroke-width="0.7"/>`;
}

/** SVG paths for preset center icons */
function renderCenterIcon(cx: number, cy: number, iconR: number, iconType: CenterIconType, color: string): string {
  const s = iconR * 0.7; // scale factor
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

/** Derive initials from company name (first letter of each word, max 3) */
export function deriveInitials(name: string): string {
  if (!name) return '';
  const skip = new Set(['LLC', 'L.L.C', 'FZE', 'FZCO', 'CO', 'CO.', 'INC', 'LTD', 'PLC', 'CORP', 'THE', 'AND', 'OF', 'FOR']);
  const words = name.trim().split(/\s+/).filter(w => w.length > 0 && !skip.has(w.toUpperCase().replace(/[.,]/g, '')));
  const source = words.length >= 2 ? words : name.trim().split(/\s+/).filter(w => w.length > 0);
  return source.slice(0, 3).map(w => w[0]).join('').toUpperCase();
}

export function generateOfficialStampSVG(config: OfficialStampConfig): string {
  const S = config.size || 320;
  const cx = S / 2;
  const cy = S / 2;
  const enFont = config.fontFamily || ENGLISH_FONT;
  const bs = config.borderStyle || 'DOUBLE';
  const ds = config.dividerStyle || 'diamond';

  const priColor = C_PRI;
  const secColor = C_SEC;
  const accColor = C_ACC;

  // ── 3-circle radii with tapering gap hierarchy ──
  const outerR = S * OUTER_R_PCT;
  const middleR = S * MIDDLE_R_PCT;  // renamed from innerR for clarity
  const innerR = S * INNER_R_PCT;    // renamed from centerR for clarity

  // ── Company name text arc — centered between outer and middle rings ──
  const rawTextArcR = (outerR + middleR) / 2;
  const textArcR = Math.min(rawTextArcR, outerR - SAFE_ZONE);
  const clampedTextArcR = Math.max(textArcR, middleR + SAFE_ZONE);

  // ── Location text arc — centered between middle ring and inner ring ──
  const rawLocTextR = (middleR + innerR) / 2;
  const locationTextR = Math.min(rawLocTextR, middleR - SAFE_ZONE);
  const clampedLocTextR = Math.max(locationTextR, innerR + SAFE_ZONE);

  // STRICT: Arabic on TOP, English on BOTTOM
  const topText = config.companyNameAr;
  const bottomText = config.companyNameEn.toUpperCase();
  const topIsArabic = true;
  const bottomIsArabic = false;
  const topFont = ARABIC_FONT;
  const bottomFont = enFont;

  // Dynamic font size and letter-spacing — fills arc evenly, prevents collisions
  const topBaseFontSize = topIsArabic ? 17 : 15;
  const bottomBaseFontSize = bottomIsArabic ? 17 : 15;
  const topSafe = safeArcFontSize(topText, clampedTextArcR, topIsArabic, topBaseFontSize);
  const bottomSafe = safeArcFontSize(bottomText, clampedTextArcR, bottomIsArabic, bottomBaseFontSize);

  const topArcContent = renderTopArcTextPath(
    topText || (topIsArabic ? 'اسم الشركة' : 'COMPANY NAME'),
    cx, cy, clampedTextArcR, topSafe.fontSize, topFont, priColor,
    topSafe.letterSpacing, topIsArabic, 'top-arc'
  );

  const bottomArcContent = renderBottomArcTextPath(
    bottomText || (bottomIsArabic ? 'اسم الشركة' : 'COMPANY NAME'),
    cx, cy, clampedTextArcR, bottomSafe.fontSize, bottomFont, priColor,
    bottomSafe.letterSpacing, bottomIsArabic, 'bottom-arc'
  );

  // ── Location text — BOTH Arabic and English as arcs ──
  let locationContent = '';
  if (config.showLocation) {
    const locEn = config.locationTextEn || 'Dubai, UAE';
    const locAr = config.locationTextAr || 'دبي، الإمارات';
    const locArcLen = clampedLocTextR * Math.PI * 0.70;
    const locFontSize = fitFontSize(locEn, 10, locArcLen, 0.55);
    const locArFontSize = fitFontSize(locAr, 10, locArcLen, 0.48);

    // Arabic location on TOP arc (between middle ring and inner ring)
    const locArContent = renderTopArcTextPath(
      locAr, cx, cy, clampedLocTextR, locArFontSize, ARABIC_FONT, secColor, 1, true, 'loc-top', '600'
    );

    // English location on BOTTOM arc
    const locEnContent = renderBottomArcTextPath(
      locEn.toUpperCase(), cx, cy, clampedLocTextR, locFontSize, enFont, secColor, 1.5, false, 'loc-bottom', '600'
    );

    locationContent = `${locArContent}${locEnContent}`;

    // Optional location separator
    if (config.locationSeparatorStyle && config.locationSeparatorStyle !== 'none') {
      locationContent += renderSeparators(cx, cy, clampedLocTextR, config.locationSeparatorStyle, secColor, 'loc-separator');
    }
  }

  // ── Center content ──
  let centerContent = '';
  const centerMode = config.centerMode || (config.showLogo ? 'logo' : config.showMonogram ? 'monogram' : 'none');
  const mono = config.monogramText || '';

  switch (centerMode) {
    case 'logo':
      if (config.logoUrl) {
        const imgSize = innerR * 1.5;
      centerContent = `
          <defs><clipPath id="center-clip"><circle cx="${cx}" cy="${cy}" r="${innerR - 2}"/></clipPath></defs>
          <image data-stamp-element="center" href="${config.logoUrl}" 
            x="${cx - imgSize / 2}" y="${cy - imgSize / 2}" 
            width="${imgSize}" height="${imgSize}" 
            clip-path="url(#center-clip)"
            preserveAspectRatio="xMidYMid meet" 
            image-rendering="optimizeQuality"/>
        `;
      }
      break;

    case 'monogram':
      if (mono) {
        const monoSize = mono.length === 1 ? innerR * 0.85 : mono.length === 2 ? innerR * 0.65 : innerR * 0.50;
        centerContent = `
          <text data-stamp-element="center" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
            font-family="${enFont}" font-size="${monoSize}" fill="${accColor}" 
            font-weight="700" letter-spacing="2">${mono.toUpperCase()}</text>
        `;
      }
      break;

    case 'initials': {
      const initials = deriveInitials(config.companyNameEn) || mono;
      if (initials) {
        const initSize = initials.length === 1 ? innerR * 0.85 : initials.length === 2 ? innerR * 0.65 : innerR * 0.50;
        centerContent = `
          <text data-stamp-element="center" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
            font-family="${enFont}" font-size="${initSize}" fill="${accColor}" 
            font-weight="700" letter-spacing="2">${initials}</text>
        `;
      }
      break;
    }

    case 'icon':
      centerContent = renderCenterIcon(cx, cy, innerR * 0.8, config.centerIcon || 'shield', accColor);
      break;

    case 'license':
      if (config.registrationNumber) {
        const regSize = fitFontSize(config.registrationNumber, 11, innerR * 1.4, 0.6);
        centerContent = `
          <text data-stamp-element="center" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
            font-family="${enFont}" font-size="${regSize}" fill="${accColor}" 
            font-weight="700" letter-spacing="1">${config.registrationNumber}</text>
        `;
      }
      break;

    case 'none':
    default:
      break;
  }

  // Fallback: legacy showLogo/showMonogram when centerMode not set
  if (!config.centerMode && !centerContent) {
    if (config.showLogo && config.logoUrl) {
      const imgSize = innerR * 1.5;
      centerContent = `
        <defs><clipPath id="center-clip"><circle cx="${cx}" cy="${cy}" r="${innerR - 2}"/></clipPath></defs>
        <image href="${config.logoUrl}" 
          x="${cx - imgSize / 2}" y="${cy - imgSize / 2}" 
          width="${imgSize}" height="${imgSize}" 
          clip-path="url(#center-clip)"
          preserveAspectRatio="xMidYMid meet" 
          image-rendering="optimizeQuality"/>
      `;
    } else if (config.showMonogram && mono) {
      const monoSize = mono.length === 1 ? innerR * 0.85 : mono.length === 2 ? innerR * 0.65 : innerR * 0.50;
      centerContent = `
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-family="${enFont}" font-size="${monoSize}" fill="${accColor}" 
          font-weight="700" letter-spacing="2">${mono.toUpperCase()}</text>
      `;
    }
  }

  // ── Registration number (shown below center when not in license center mode) ──
  let regContent = '';
  if (config.showRegistration && config.registrationNumber && centerMode !== 'license') {
    const regY = cy + innerR * 0.55;
    regContent = `
      <text data-stamp-element="registration" x="${cx}" y="${regY}" text-anchor="middle" font-family="${enFont}" 
        font-size="6.5" fill="${accColor}" letter-spacing="0.8" opacity="0.7">${config.registrationNumber}</text>
    `;
  }

  // ── Border strokes with tapering thickness hierarchy ──
  const outerStrokeWidth = config.outerBorderWidth ?? OUTER_STROKE;
  const outerRingEl = renderOuterRing(cx, cy, outerR, priColor, bs, outerStrokeWidth);

  // Decorative thin ring just inside outer ring (ministry double-line effect)
  const decorativeR = outerR - outerStrokeWidth / 2 - 2;
  const decorativeRingEl = `<circle cx="${cx}" cy="${cy}" r="${decorativeR}" fill="none" stroke="${priColor}" stroke-width="${DECORATIVE_STROKE}" opacity="0.5"/>`;

  const middleStrokeWidth = config.innerBorderWidth ?? MIDDLE_STROKE;
  const middleRingEl = `<circle cx="${cx}" cy="${cy}" r="${middleR}" fill="none" stroke="${secColor}" stroke-width="${middleStrokeWidth}"/>`;

  const innerRingEl = `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${secColor}" stroke-width="${INNER_STROKE}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
    <!-- Outer ring (boldest — ${outerStrokeWidth}px) -->
    ${outerRingEl}
    <!-- Decorative inner-outer ring (ministry double-line) -->
    ${decorativeRingEl}
    <!-- Middle ring (medium — ${middleStrokeWidth}px) -->
    ${middleRingEl}
    <!-- Inner ring (thinnest — ${INNER_STROKE}px) -->
    ${innerRingEl}

    <!-- Top arc text (Arabic company name) -->
    ${topArcContent}

    <!-- Bottom arc text (English company name) -->
    ${bottomArcContent}

    <!-- Separators at 3 and 9 o'clock -->
    ${renderSeparators(cx, cy, clampedTextArcR, config.separatorStyle, priColor)}

    <!-- Location between middle ring and inner ring -->
    ${locationContent}

    <!-- Center content -->
    ${centerContent}

    <!-- Registration number -->
    ${regContent}
  </svg>`;
}

/** Standard navy ink color constant */
export const OFFICIAL_INK_BLUE = INK_BLUE;

/** Default config for owner's official stamp — STANDARD MODEL */
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
  };
}
