/**
 * Owner's Official Standard Stamp Template
 * 
 * Matches the reference photo exactly:
 * - Double-ring circular layout (outer border + inner border)
 * - Arabic text arcing the TOP half (default)
 * - English text arcing the BOTTOM half (default)  
 * - Two dot separators (●) at 3 o'clock and 9 o'clock positions dividing the arcs
 * - Center area for monogram/logo with optional inner text ring for location
 * - Switchable separator type: dot, star, dash, none
 * - Corporate Official Blue ink: #1B3A8C
 * 
 * Location text "Dubai, UAE" shown in an optional inner ring.
 */

export type SeparatorStyle = 'dot' | 'star' | 'dash' | 'circle' | 'none';

export interface OfficialStampConfig {
  companyNameEn: string;
  companyNameAr: string;
  /** Arabic on top arc (true) or English on top (false) */
  arabicOnTop: boolean;
  /** Location text e.g. "Dubai, UAE" */
  locationTextEn?: string;
  /** Location text in Arabic e.g. "دبي، الإمارات" */
  locationTextAr?: string;
  /** Show location ring */
  showLocation: boolean;
  /** Separator between top/bottom arcs at 3 & 9 o'clock */
  separatorStyle: SeparatorStyle;
  /** Center monogram text (1-3 chars) */
  monogramText?: string;
  /** Center logo data URL */
  logoUrl?: string;
  /** Whether to show monogram */
  showMonogram: boolean;
  /** Whether to show logo */
  showLogo: boolean;
  /** Ink color — defaults to Corporate Official Blue */
  inkColor?: string;
  /** Font family override */
  fontFamily?: string;
  /** Canvas size */
  size?: number;
  /** Registration / License number (optional inner text) */
  registrationNumber?: string;
  /** Show registration number */
  showRegistration?: boolean;
}

const ARABIC_FONT = '"Noto Naskh Arabic", "Arabic Typesetting", "Traditional Arabic", serif';
const ENGLISH_FONT = 'Georgia, "Times New Roman", serif';

const INK_BLUE = '#1B3A8C';

function fitFontSize(text: string, baseSize: number, maxArcLen: number, charW = 0.6): number {
  if (!text) return baseSize;
  const est = text.length * baseSize * charW;
  if (est <= maxArcLen) return baseSize;
  return Math.max(5.5, maxArcLen / (text.length * charW));
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
  // Position at 3 o'clock (cx+r, cy) and 9 o'clock (cx-r, cy), slightly inward
  const sepR = r - 1;
  const fontSize = style === 'dash' ? 10 : 7;
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

  // Ring radii
  const outerR = S * 0.362; // ~116 for 320
  const innerR = outerR - 8;
  const textArcR = outerR - 5; // text follows this radius

  // Inner circle for location text
  const locationR = outerR * 0.52;
  const locationTextR = locationR - 3;

  // Monogram/logo area
  const centerR = config.showLocation ? locationR - 6 : outerR * 0.38;

  // Determine top/bottom text
  const topText = config.arabicOnTop ? config.companyNameAr : config.companyNameEn.toUpperCase();
  const bottomText = config.arabicOnTop ? config.companyNameEn.toUpperCase() : config.companyNameAr;
  const topIsArabic = config.arabicOnTop;
  const bottomIsArabic = !config.arabicOnTop;
  const topFont = topIsArabic ? ARABIC_FONT : enFont;
  const bottomFont = bottomIsArabic ? ARABIC_FONT : enFont;

  // Arc lengths for font sizing
  const arcLen = textArcR * Math.PI; // half circle
  const topFontSize = fitFontSize(topText, topIsArabic ? 11 : 10.5, arcLen * 0.82, topIsArabic ? 0.55 : 0.58);
  const bottomFontSize = fitFontSize(bottomText, bottomIsArabic ? 11 : 10.5, arcLen * 0.82, bottomIsArabic ? 0.55 : 0.58);

  // Top arc: goes from left to right over the top (semicircle)
  const topArcPath = `M ${cx - textArcR} ${cy} A ${textArcR} ${textArcR} 0 1 1 ${cx + textArcR} ${cy}`;
  // Bottom arc: reversed path so text reads correctly (right to left under bottom)
  const botArcPath = `M ${cx + textArcR} ${cy} A ${textArcR} ${textArcR} 0 1 1 ${cx - textArcR} ${cy}`;

  // Location text arcs (inner ring)
  let locationContent = '';
  if (config.showLocation) {
    const locEn = config.locationTextEn || 'Dubai, UAE';
    const locAr = config.locationTextAr || 'دبي، الإمارات';
    const locFontSize = fitFontSize(locEn, 7.5, locationTextR * Math.PI * 0.8, 0.55);
    const locArFontSize = fitFontSize(locAr, 8, locationTextR * Math.PI * 0.8, 0.5);

    locationContent = `
      <!-- Location inner circle -->
      <circle cx="${cx}" cy="${cy}" r="${locationR}" fill="none" stroke="${ink}" stroke-width="0.8"/>
      
      <!-- Location text arcs -->
      <defs>
        <path id="loc-top" d="M ${cx - locationTextR} ${cy} A ${locationTextR} ${locationTextR} 0 1 1 ${cx + locationTextR} ${cy}"/>
        <path id="loc-bot" d="M ${cx + locationTextR} ${cy} A ${locationTextR} ${locationTextR} 0 1 1 ${cx - locationTextR} ${cy}"/>
      </defs>
      <text font-family="${ARABIC_FONT}" font-size="${locArFontSize}" fill="${ink}" letter-spacing="0.5">
        <textPath href="#loc-top" startOffset="50%" text-anchor="middle">${locAr}</textPath>
      </text>
      <text font-family="${enFont}" font-size="${locFontSize}" fill="${ink}" letter-spacing="1.2" font-weight="600">
        <textPath href="#loc-bot" startOffset="50%" text-anchor="middle">${locEn.toUpperCase()}</textPath>
      </text>
    `;
  }

  // Center content
  let centerContent = '';
  const mono = config.monogramText || '';

  if (config.showLogo && config.logoUrl) {
    const imgSize = centerR * 1.5;
    centerContent = `
      <clipPath id="center-clip"><circle cx="${cx}" cy="${cy}" r="${centerR - 2}"/></clipPath>
      <image href="${config.logoUrl}" 
        x="${cx - imgSize / 2}" y="${cy - imgSize / 2}" 
        width="${imgSize}" height="${imgSize}" 
        clip-path="url(#center-clip)"
        preserveAspectRatio="xMidYMid meet" 
        image-rendering="optimizeQuality"/>
    `;
  } else if (config.showMonogram && mono) {
    const monoSize = mono.length === 1 ? centerR * 0.8 : mono.length === 2 ? centerR * 0.6 : centerR * 0.5;
    centerContent = `
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" 
        font-family="${enFont}" font-size="${monoSize}" fill="${ink}" 
        font-weight="700" letter-spacing="2">${mono.toUpperCase()}</text>
    `;
  }

  // Registration number (tiny text below center)
  let regContent = '';
  if (config.showRegistration && config.registrationNumber) {
    const regY = cy + centerR + 4;
    // Only show if it fits inside the inner ring
    if (regY < cy + innerR - 8) {
      regContent = `
        <text x="${cx}" y="${regY}" text-anchor="middle" font-family="${enFont}" 
          font-size="5.5" fill="${ink}" letter-spacing="0.8" opacity="0.7">${config.registrationNumber}</text>
      `;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
    <defs>
      <path id="top-arc" d="${topArcPath}"/>
      <path id="bot-arc" d="${botArcPath}"/>
    </defs>

    <!-- Outer ring -->
    <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${ink}" stroke-width="2.2"/>
    <!-- Inner ring -->
    <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${ink}" stroke-width="1.2"/>

    <!-- Top arc text -->
    <text font-family="${topFont}" font-size="${topFontSize}" fill="${ink}" 
      letter-spacing="${topIsArabic ? '0.5' : '1.8'}" font-weight="${topIsArabic ? '600' : '700'}">
      <textPath href="#top-arc" startOffset="50%" text-anchor="middle">${topText || 'COMPANY NAME'}</textPath>
    </text>

    <!-- Bottom arc text -->
    <text font-family="${bottomFont}" font-size="${bottomFontSize}" fill="${ink}" 
      letter-spacing="${bottomIsArabic ? '0.5' : '1.8'}" font-weight="${bottomIsArabic ? '600' : '700'}">
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
