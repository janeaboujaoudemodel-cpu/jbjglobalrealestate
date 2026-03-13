/**
 * Owner's Official Standard Stamp Template
 * 
 * 3-circle layout (outer ring, inner ring, center circle):
 * - Arabic company name arcing the TOP (between outer & inner rings)
 * - English company name arcing the BOTTOM (between outer & inner rings)
 * - Dot/star separators at 3 & 9 o'clock
 * - Location text (Arabic arc on top, English arc on bottom) between inner ring and center circle
 * - Monogram/logo inside center circle
 * - Corporate Official Blue ink: #1B3A8C
 * 
 * Color tokens for StampSVGRenderer tinting:
 * - #1a2744 → Primary (outer ring, company text, borders)
 * - #2a3a5c → Secondary (inner rings, location text, decorative accents)
 * - #8b6914 → Accent (monogram, registration, center dividers)
 */

export type SeparatorStyle = 'dot' | 'star' | 'dash' | 'circle' | 'none';
export type BorderStyleType = 'SINGLE' | 'DOUBLE' | 'RING' | 'DOTTED' | 'ROPE' | 'CUSTOM';
export type DividerStyle = 'diamond' | 'line' | 'ornate' | 'none';

export interface OfficialStampConfig {
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
  dividerStyle?: DividerStyle;
}

const ARABIC_FONT = '"Noto Naskh Arabic", "Arabic Typesetting", "Traditional Arabic", serif';
const ENGLISH_FONT = 'Georgia, "Times New Roman", serif';
const INK_BLUE = '#1B3A8C';

// Color tokens — these are replaced by StampSVGRenderer
const C_PRI = '#1a2744';
const C_SEC = '#2a3a5c';
const C_ACC = '#8b6914';

function fitFontSize(text: string, baseSize: number, maxArcLen: number, charW = 0.6): number {
  if (!text) return baseSize;
  const est = text.length * baseSize * charW;
  if (est <= maxArcLen) return baseSize;
  const fitted = maxArcLen / (text.length * charW);
  return Math.max(6.5, fitted);
}

function separatorGlyph(style: SeparatorStyle): string {
  switch (style) {
    case 'dot': return '●';
    case 'star': return '★';
    case 'dash': return '—';
    case 'circle': return '◉';
    case 'none': return '';
  }
}

function renderSeparators(cx: number, cy: number, r: number, style: SeparatorStyle, ink: string): string {
  if (style === 'none') return '';
  const glyph = separatorGlyph(style);
  const fontSize = style === 'dash' ? 14 : 10;
  return `
    <text x="${cx + r}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-size="${fontSize}" fill="${ink}" font-weight="bold">${glyph}</text>
    <text x="${cx - r}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-size="${fontSize}" fill="${ink}" font-weight="bold">${glyph}</text>
  `;
}

/**
 * Bottom arc text — characters placed individually along the BOTTOM half of a circle.
 * Each character is rotated so it reads naturally left-to-right when viewed from outside.
 * 
 * CRITICAL: Characters go from left to right along the bottom arc.
 * At the bottom of a circle (SVG coords), angles go clockwise:
 * - Left side of bottom = ~210°
 * - Center bottom = 270°  
 * - Right side of bottom = ~330°
 * 
 * Characters are placed in reading order (char[0] at leftmost angle).
 * Rotation = deg + 90 makes each character face outward (feet toward center).
 */
function renderBottomArcText(
  text: string, cx: number, cy: number, r: number,
  fontSize: number, font: string, ink: string, letterSpacing: number,
  isArabic: boolean, fontWeight = '800'
): string {
  if (!text) return '';
  const chars = text.split('');
  const n = chars.length;
  if (n === 0) return '';

  // Limit spread to prevent characters from wrapping too far
  const spreadDeg = Math.min(140, n * 8);
  const startDeg = 270 - spreadDeg / 2;
  const stepDeg = n > 1 ? spreadDeg / (n - 1) : 0;

  let result = '';
  for (let i = 0; i < n; i++) {
    const deg = n === 1 ? 270 : startDeg + i * stepDeg;
    const rad = (deg * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    // Characters face outward — readable from outside the stamp
    const rotation = deg + 90;
    result += `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle" dominant-baseline="central"
      font-family="${font}" font-size="${fontSize}" fill="${ink}" font-weight="${fontWeight}"
      letter-spacing="${letterSpacing}"
      transform="rotate(${rotation.toFixed(2)}, ${x.toFixed(2)}, ${y.toFixed(2)})">${chars[i]}</text>\n`;
  }
  return result;
}

/**
 * Top arc text using SVG textPath — text follows the top half of a circle.
 * Works naturally for both Arabic (RTL) and English (LTR) via textPath.
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
    <text font-family="${font}" font-size="${fontSize}" fill="${ink}" 
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

  // ── 3-circle radii ──
  const outerR = S * 0.46;
  const innerR = S * 0.33;
  const centerR = S * 0.20;

  // Company name text arc — centered between outer and inner rings with 5px min clearance
  const rawTextArcR = (outerR + innerR) / 2;
  const textArcR = Math.min(rawTextArcR, outerR - 5);
  const clampedTextArcR = Math.max(textArcR, innerR + 5);

  // Location text arc — centered between inner ring and center circle with clearance
  const rawLocTextR = (innerR + centerR) / 2;
  const locationTextR = Math.min(rawLocTextR, innerR - 5);

  // STRICT: Arabic on TOP, English on BOTTOM
  const topText = config.companyNameAr;
  const bottomText = config.companyNameEn.toUpperCase();
  const topIsArabic = true;
  const bottomIsArabic = false;
  const topFont = ARABIC_FONT;
  const bottomFont = enFont;

  // Arc lengths — 0.58 for better text clearance from separators
  const arcLen = clampedTextArcR * Math.PI;
  const safeArc = arcLen * 0.58;
  const topBaseFontSize = topIsArabic ? 15 : 13;
  const bottomBaseFontSize = bottomIsArabic ? 15 : 13;
  const topFontSize = fitFontSize(topText, topBaseFontSize, safeArc, topIsArabic ? 0.50 : 0.54);
  const bottomFontSize = fitFontSize(bottomText, bottomBaseFontSize, safeArc, bottomIsArabic ? 0.50 : 0.54);

  const topArcContent = renderTopArcTextPath(
    topText || (topIsArabic ? 'اسم الشركة' : 'COMPANY NAME'),
    cx, cy, clampedTextArcR, topFontSize, topFont, priColor,
    topIsArabic ? 1 : 2.5, topIsArabic, 'top-arc'
  );

  const bottomArcContent = renderBottomArcText(
    bottomText || (bottomIsArabic ? 'اسم الشركة' : 'COMPANY NAME'),
    cx, cy, clampedTextArcR, bottomFontSize, bottomFont, priColor,
    bottomIsArabic ? 1 : 2.5, bottomIsArabic
  );

  // ── Location text — BOTH Arabic and English as arcs ──
  let locationContent = '';
  if (config.showLocation) {
    const locEn = config.locationTextEn || 'Dubai, UAE';
    const locAr = config.locationTextAr || 'دبي، الإمارات';
    const locArcLen = locationTextR * Math.PI * 0.60;
    const locFontSize = fitFontSize(locEn, 8, locArcLen, 0.55);
    const locArFontSize = fitFontSize(locAr, 9, locArcLen, 0.48);

    // Arabic location on TOP arc (between inner ring and center circle)
    const locTopArc = `M ${cx - locationTextR} ${cy} A ${locationTextR} ${locationTextR} 0 1 1 ${cx + locationTextR} ${cy}`;
    
    // English location on BOTTOM arc (between inner ring and center circle)
    const locEnContent = renderBottomArcText(
      locEn.toUpperCase(), cx, cy, locationTextR, locFontSize, enFont, secColor, 1.5, false, '600'
    );

    locationContent = `
      <defs><path id="loc-top" d="${locTopArc}"/></defs>
      <text font-family="${ARABIC_FONT}" font-size="${locArFontSize}" fill="${secColor}" letter-spacing="1" font-weight="600">
        <textPath href="#loc-top" startOffset="50%" text-anchor="middle">${locAr}</textPath>
      </text>
      ${locEnContent}
    `;
  }

  // ── Center content ──
  let centerContent = '';
  const mono = config.monogramText || '';

  if (config.showLogo && config.logoUrl) {
    const imgSize = centerR * 1.5;
    centerContent = `
      <defs><clipPath id="center-clip"><circle cx="${cx}" cy="${cy}" r="${centerR - 2}"/></clipPath></defs>
      <image href="${config.logoUrl}" 
        x="${cx - imgSize / 2}" y="${cy - imgSize / 2}" 
        width="${imgSize}" height="${imgSize}" 
        clip-path="url(#center-clip)"
        preserveAspectRatio="xMidYMid meet" 
        image-rendering="optimizeQuality"/>
    `;
  } else if (config.showMonogram && mono) {
    const monoSize = mono.length === 1 ? centerR * 0.85 : mono.length === 2 ? centerR * 0.65 : centerR * 0.50;
    centerContent = `
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
        font-family="${enFont}" font-size="${monoSize}" fill="${accColor}" 
        font-weight="700" letter-spacing="2">${mono.toUpperCase()}</text>
    `;
  }

  // ── Registration number ──
  let regContent = '';
  if (config.showRegistration && config.registrationNumber) {
    const regY = cy + centerR * 0.55;
    regContent = `
      <text x="${cx}" y="${regY}" text-anchor="middle" font-family="${enFont}" 
        font-size="6.5" fill="${accColor}" letter-spacing="0.8" opacity="0.7">${config.registrationNumber}</text>
    `;
  }

  // ── Border strokes with custom width support ──
  const outerStrokeWidth = config.outerBorderWidth ?? (bs === 'RING' ? 5 : bs === 'SINGLE' ? 3 : 4);
  const outerRingEl = renderOuterRing(cx, cy, outerR, priColor, bs, outerStrokeWidth);

  const innerStrokeWidth = config.innerBorderWidth ?? (bs === 'SINGLE' ? 1.5 : bs === 'RING' ? 3 : 2);
  const innerRingEl = `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${secColor}" stroke-width="${innerStrokeWidth}"/>`;

  const centerCircleEl = `<circle cx="${cx}" cy="${cy}" r="${centerR}" fill="none" stroke="${secColor}" stroke-width="1.2"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
    <!-- Outer ring -->
    ${outerRingEl}
    <!-- Inner ring -->
    ${innerRingEl}
    <!-- Center circle -->
    ${centerCircleEl}

    <!-- Top arc text (Arabic company name) -->
    ${topArcContent}

    <!-- Bottom arc text (English company name) -->
    ${bottomArcContent}

    <!-- Separators at 3 and 9 o'clock -->
    ${renderSeparators(cx, cy, clampedTextArcR, config.separatorStyle, priColor)}

    <!-- Location between inner ring and center -->
    ${locationContent}

    <!-- Center content (monogram or logo) -->
    ${centerContent}

    <!-- Registration number -->
    ${regContent}
  </svg>`;
}

/** Standard ink color constant */
export const OFFICIAL_INK_BLUE = INK_BLUE;

/** Default config for owner's official stamp */
export function getOwnerDefaultConfig(): OfficialStampConfig {
  return {
    companyNameEn: 'JBJ GLOBAL REAL ESTATE',
    companyNameAr: 'جي بي جي العقارية العالمية',
    arabicOnTop: true,
    locationTextEn: 'Dubai, UAE',
    locationTextAr: 'دبي، الإمارات',
    showLocation: true,
    separatorStyle: 'dot',
    monogramText: 'JBJ',
    showMonogram: true,
    showLogo: false,
    inkColor: INK_BLUE,
    showRegistration: false,
    borderStyle: 'DOUBLE',
    outerBorderWidth: 4,
    innerBorderWidth: 2,
    dividerStyle: 'diamond',
  };
}
