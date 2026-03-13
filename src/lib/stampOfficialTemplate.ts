/**
 * Owner's Official Standard Stamp Template
 * 
 * Double-ring circular layout with:
 * - Arabic text arcing the TOP half (default)
 * - English text arcing the BOTTOM half (default) — reads LEFT-TO-RIGHT naturally
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
  return Math.max(7, fitted); // minimum 7px for legibility
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
  const sepR = r;
  const fontSize = style === 'dash' ? 14 : 11;
  return `
    <text x="${cx + sepR}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-size="${fontSize}" fill="${ink}" font-weight="bold">${glyph}</text>
    <text x="${cx - sepR}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
          font-size="${fontSize}" fill="${ink}" font-weight="bold">${glyph}</text>
  `;
}

export function generateOfficialStampSVG(config: OfficialStampConfig): string {
  const S = config.size || 320;
  const cx = S / 2;
  const cy = S / 2;
  const ink = config.inkColor || INK_BLUE;
  const enFont = config.fontFamily || ENGLISH_FONT;

  // Ring radii — generous spacing so text never clips
  const outerR = S * 0.46;
  const innerR = outerR - S * 0.05;
  const textArcR = (outerR + innerR) / 2; // text sits between the two rings

  // Inner circle for location text
  const locationR = outerR * 0.48;
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

  // Arc lengths for font sizing — use 75% of half-circle for safe text area
  const arcLen = textArcR * Math.PI;
  const safeArc = arcLen * 0.75;
  const topBaseFontSize = topIsArabic ? 15 : 14;
  const bottomBaseFontSize = bottomIsArabic ? 15 : 14;
  const topFontSize = fitFontSize(topText, topBaseFontSize, safeArc, topIsArabic ? 0.52 : 0.56);
  const bottomFontSize = fitFontSize(bottomText, bottomBaseFontSize, safeArc, bottomIsArabic ? 0.52 : 0.56);

  // Top arc: text reads left-to-right over the top half
  const topArcPath = `M ${cx - textArcR} ${cy} A ${textArcR} ${textArcR} 0 1 1 ${cx + textArcR} ${cy}`;
  
  // Bottom arc: RIGHT to LEFT through bottom (counter-clockwise) so text is RIGHT-SIDE UP
  // This makes the English text readable from the outside, curving along the bottom
  const botArcPath = `M ${cx + textArcR} ${cy} A ${textArcR} ${textArcR} 0 0 0 ${cx - textArcR} ${cy}`;

  // Location text arcs (inner ring)
  let locationContent = '';
  if (config.showLocation) {
    const locEn = config.locationTextEn || 'Dubai, UAE';
    const locAr = config.locationTextAr || 'دبي، الإمارات';
    const locArcLen = locationTextR * Math.PI * 0.75;
    const locFontSize = fitFontSize(locEn, 9, locArcLen, 0.55);
    const locArFontSize = fitFontSize(locAr, 10, locArcLen, 0.48);

    // Location bottom arc: RIGHT to LEFT through bottom so English text is right-side up
    const locBotArc = `M ${cx + locationTextR} ${cy} A ${locationTextR} ${locationTextR} 0 0 0 ${cx - locationTextR} ${cy}`;
    const locTopArc = `M ${cx - locationTextR} ${cy} A ${locationTextR} ${locationTextR} 0 1 1 ${cx + locationTextR} ${cy}`;

    locationContent = `
      <circle cx="${cx}" cy="${cy}" r="${locationR}" fill="none" stroke="${ink}" stroke-width="1.5"/>
      <defs>
        <path id="loc-top" d="${locTopArc}"/>
        <path id="loc-bot" d="${locBotArc}"/>
      </defs>
      <text font-family="${ARABIC_FONT}" font-size="${locArFontSize}" fill="${ink}" letter-spacing="1" font-weight="700">
        <textPath href="#loc-top" startOffset="50%" text-anchor="middle">${locAr}</textPath>
      </text>
      <text font-family="${enFont}" font-size="${locFontSize}" fill="${ink}" letter-spacing="1.5" font-weight="700">
        <textPath href="#loc-bot" startOffset="50%" text-anchor="middle">${locEn.toUpperCase()}</textPath>
      </text>
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
          font-size="6" fill="${ink}" letter-spacing="0.8" opacity="0.7">${config.registrationNumber}</text>
      `;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
    <defs>
      <path id="top-arc" d="${topArcPath}"/>
      <path id="bot-arc" d="${botArcPath}"/>
    </defs>

    <!-- Outer ring -->
    <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${ink}" stroke-width="4"/>
    <!-- Inner ring -->
    <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${ink}" stroke-width="2.2"/>

    <!-- Top arc text -->
    <text font-family="${topFont}" font-size="${topFontSize}" fill="${ink}" 
      letter-spacing="${topIsArabic ? '1' : '2.5'}" font-weight="800">
      <textPath href="#top-arc" startOffset="50%" text-anchor="middle">${topText || 'COMPANY NAME'}</textPath>
    </text>

    <!-- Bottom arc text -->
    <text font-family="${bottomFont}" font-size="${bottomFontSize}" fill="${ink}" 
      letter-spacing="${bottomIsArabic ? '1' : '2.5'}" font-weight="800">
      <textPath href="#bot-arc" startOffset="50%" text-anchor="middle">${bottomText || 'اسم الشركة'}</textPath>
    </text>

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
