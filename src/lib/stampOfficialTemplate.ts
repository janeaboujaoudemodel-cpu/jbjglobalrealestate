/**
 * Owner's Official Standard Stamp Template
 * 
 * Double-ring circular layout with:
 * - Arabic text arcing the TOP half (default)
 * - English text arcing the BOTTOM half — per-character placement, readable right-side up
 * - Two dot separators at 3/9 o'clock positions
 * - Center area for monogram/logo with optional inner text ring for location
 * - Corporate Official Blue ink: #1B3A8C
 */

export type SeparatorStyle = 'dot' | 'star' | 'dash' | 'circle' | 'none';

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
}

const ARABIC_FONT = '"Noto Naskh Arabic", "Arabic Typesetting", "Traditional Arabic", serif';
const ENGLISH_FONT = 'Georgia, "Times New Roman", serif';
const INK_BLUE = '#1B3A8C';

function fitFontSize(text: string, baseSize: number, maxArcLen: number, charW = 0.6): number {
  if (!text) return baseSize;
  const est = text.length * baseSize * charW;
  if (est <= maxArcLen) return baseSize;
  const fitted = maxArcLen / (text.length * charW);
  return Math.max(8, fitted);
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
  const fontSize = style === 'dash' ? 16 : 13;
  return `
    <text x="${cx + r}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-size="${fontSize}" fill="${ink}" font-weight="bold">${glyph}</text>
    <text x="${cx - r}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-size="${fontSize}" fill="${ink}" font-weight="bold">${glyph}</text>
  `;
}

/**
 * Render text along the BOTTOM half of a circle, per-character,
 * so each character is right-side up (tops pointing outward).
 * Characters are distributed evenly across ~150° centered at 6 o'clock (270° in math coords = bottom).
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

  // Spread across 150° of the bottom half, centered at 270° (6 o'clock)
  const spreadDeg = Math.min(150, n * 11);
  const startDeg = 270 - spreadDeg / 2;
  const stepDeg = n > 1 ? spreadDeg / (n - 1) : 0;

  let result = '';
  for (let i = 0; i < n; i++) {
    const deg = n === 1 ? 270 : startDeg + i * stepDeg;
    const rad = (deg * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    // Rotate so character top points outward (away from center)
    const rotation = deg + 90;
    result += `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle" dominant-baseline="central"
      font-family="${font}" font-size="${fontSize}" fill="${ink}" font-weight="${fontWeight}"
      letter-spacing="${letterSpacing}"
      transform="rotate(${rotation.toFixed(2)}, ${x.toFixed(2)}, ${y.toFixed(2)})">${chars[i]}</text>\n`;
  }
  return result;
}

/**
 * Render text along the TOP half of a circle using textPath.
 * For Arabic text this works naturally (LTR path, RTL rendering).
 */
function renderTopArcTextPath(
  text: string, cx: number, cy: number, r: number,
  fontSize: number, font: string, ink: string, letterSpacing: number,
  isArabic: boolean, pathId: string, fontWeight = '800'
): string {
  if (!text) return '';
  // Top arc: left to right over top half (clockwise sweep)
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
  return `
    <defs><path id="${pathId}" d="${arcPath}"/></defs>
    <text font-family="${font}" font-size="${fontSize}" fill="${ink}" 
      letter-spacing="${letterSpacing}" font-weight="${fontWeight}">
      <textPath href="#${pathId}" startOffset="50%" text-anchor="middle">${text}</textPath>
    </text>
  `;
}

export function generateOfficialStampSVG(config: OfficialStampConfig): string {
  const S = config.size || 320;
  const cx = S / 2;
  const cy = S / 2;
  const ink = config.inkColor || INK_BLUE;
  const enFont = config.fontFamily || ENGLISH_FONT;

  // Ring radii
  const outerR = S * 0.46;
  const innerR = outerR - S * 0.06;
  // Text arc sits between inner and outer rings
  const textArcR = innerR + (outerR - innerR) * 0.5;

  // Inner circle for location text
  const locationR = outerR * 0.46;
  const locationTextR = locationR - 3;

  // Monogram/logo area
  const centerR = config.showLocation ? locationR - 8 : outerR * 0.34;

  // Determine top/bottom text
  const topText = config.arabicOnTop ? config.companyNameAr : config.companyNameEn.toUpperCase();
  const bottomText = config.arabicOnTop ? config.companyNameEn.toUpperCase() : config.companyNameAr;
  const topIsArabic = config.arabicOnTop;
  const bottomIsArabic = !config.arabicOnTop;
  const topFont = topIsArabic ? ARABIC_FONT : enFont;
  const bottomFont = bottomIsArabic ? ARABIC_FONT : enFont;

  // Arc lengths for font sizing — use 70% of half-circle for safe text area
  const arcLen = textArcR * Math.PI;
  const safeArc = arcLen * 0.70;
  const topBaseFontSize = topIsArabic ? 16 : 15;
  const bottomBaseFontSize = bottomIsArabic ? 16 : 15;
  const topFontSize = fitFontSize(topText, topBaseFontSize, safeArc, topIsArabic ? 0.50 : 0.54);
  const bottomFontSize = fitFontSize(bottomText, bottomBaseFontSize, safeArc, bottomIsArabic ? 0.50 : 0.54);

  // Top arc text (textPath — works for both Arabic and English on top)
  const topArcContent = renderTopArcTextPath(
    topText || (topIsArabic ? 'اسم الشركة' : 'COMPANY NAME'),
    cx, cy, textArcR, topFontSize, topFont, ink,
    topIsArabic ? 1 : 2.5, topIsArabic, 'top-arc'
  );

  // Bottom arc text (per-character placement for readability)
  const bottomArcContent = renderBottomArcText(
    bottomText || (bottomIsArabic ? 'اسم الشركة' : 'COMPANY NAME'),
    cx, cy, textArcR, bottomFontSize, bottomFont, ink,
    bottomIsArabic ? 1 : 2.5, bottomIsArabic
  );

  // Location text arcs (inner ring)
  let locationContent = '';
  if (config.showLocation) {
    const locEn = config.locationTextEn || 'Dubai, UAE';
    const locAr = config.locationTextAr || 'دبي، الإمارات';
    const locArcLen = locationTextR * Math.PI * 0.70;
    const locFontSize = fitFontSize(locEn, 9, locArcLen, 0.55);
    const locArFontSize = fitFontSize(locAr, 10, locArcLen, 0.48);

    // Location Arabic on top (textPath)
    const locTopArc = `M ${cx - locationTextR} ${cy} A ${locationTextR} ${locationTextR} 0 1 1 ${cx + locationTextR} ${cy}`;
    
    // Location English on bottom (per-character)
    const locEnContent = renderBottomArcText(
      locEn.toUpperCase(), cx, cy, locationTextR, locFontSize, enFont, ink, 1.5, false, '700'
    );

    locationContent = `
      <circle cx="${cx}" cy="${cy}" r="${locationR}" fill="none" stroke="${ink}" stroke-width="1.5"/>
      <defs><path id="loc-top" d="${locTopArc}"/></defs>
      <text font-family="${ARABIC_FONT}" font-size="${locArFontSize}" fill="${ink}" letter-spacing="1" font-weight="700">
        <textPath href="#loc-top" startOffset="50%" text-anchor="middle">${locAr}</textPath>
      </text>
      ${locEnContent}
    `;
  }

  // Center content (monogram or logo)
  let centerContent = '';
  const mono = config.monogramText || '';

  if (config.showLogo && config.logoUrl) {
    const imgSize = centerR * 1.6;
    centerContent = `
      <defs><clipPath id="center-clip"><circle cx="${cx}" cy="${cy}" r="${centerR - 1}"/></clipPath></defs>
      <image href="${config.logoUrl}" 
        x="${cx - imgSize / 2}" y="${cy - imgSize / 2}" 
        width="${imgSize}" height="${imgSize}" 
        clip-path="url(#center-clip)"
        preserveAspectRatio="xMidYMid meet" 
        image-rendering="optimizeQuality"/>
    `;
  } else if (config.showMonogram && mono) {
    const monoSize = mono.length === 1 ? centerR * 0.9 : mono.length === 2 ? centerR * 0.7 : centerR * 0.55;
    centerContent = `
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
        font-family="${enFont}" font-size="${monoSize}" fill="${ink}" 
        font-weight="700" letter-spacing="2">${mono.toUpperCase()}</text>
    `;
  }

  // Registration number
  let regContent = '';
  if (config.showRegistration && config.registrationNumber) {
    const regY = cy + centerR + 5;
    if (regY < cy + innerR - 6) {
      regContent = `
        <text x="${cx}" y="${regY}" text-anchor="middle" font-family="${enFont}" 
          font-size="7" fill="${ink}" letter-spacing="0.8" opacity="0.7">${config.registrationNumber}</text>
      `;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
    <!-- Outer ring -->
    <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${ink}" stroke-width="5"/>
    <!-- Inner ring -->
    <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${ink}" stroke-width="2.5"/>

    <!-- Top arc text -->
    ${topArcContent}

    <!-- Bottom arc text (per-character, right-side up) -->
    ${bottomArcContent}

    <!-- Separators at 3 and 9 o'clock -->
    ${renderSeparators(cx, cy, textArcR, config.separatorStyle, ink)}

    <!-- Location inner ring (optional) -->
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
  };
}
