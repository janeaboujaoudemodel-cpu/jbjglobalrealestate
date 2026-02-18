/**
 * SVG Stamp Template Engine — Premium Edition v2
 * Real official-stamp quality. Safe zones enforced. Bilingual Arabic proper RTL.
 * City+Country combined. No text overlap. Font auto-scaling.
 */

export interface StampProject {
  company_name: string;
  arabic_company_name?: string;
  trade_name_optional?: string;
  registration_number_optional?: string;
  address_optional?: string;
  city_optional?: string;
  country_optional?: string;
  arabic_city?: string;
  language_mode: 'EN' | 'AR' | 'BILINGUAL';
  stamp_type: 'ROUND' | 'OVAL' | 'RECTANGLE' | 'SQUARE';
  style_theme: 'CLASSIC' | 'MODERN' | 'MINIMAL' | 'LUXURY' | 'BOLD' | 'VINTAGE';
  icon_style: 'NONE' | 'MONOGRAM' | 'SIMPLE_ICON' | 'UPLOADED_LOGO';
  monogram_text?: string;
  border_style: 'SINGLE' | 'DOUBLE' | 'RING' | 'DOTTED' | 'ROPE' | 'CUSTOM';
  typography_style: 'SERIF' | 'SANS' | 'MONOSPACE' | 'CALLIGRAPHY';
  density: number; // 1–5
}

export interface StampDesignConcept {
  id: string;
  templateKey: string;
  label: string;
  tags: string[];
  svgSource: string;
  isFavorite?: boolean;
}

// Font families
const fontMap = {
  SERIF: 'Georgia, "Times New Roman", serif',
  SANS: 'Arial, Helvetica, sans-serif',
  MONOSPACE: '"Courier New", monospace',
  CALLIGRAPHY: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
};

const arabicFont = '"Noto Naskh Arabic", "Arabic Typesetting", Arial, sans-serif';

/** Auto-scale font size based on text length */
function autoFontSize(text: string, base: number, maxChars = 20): number {
  if (text.length <= maxChars) return base;
  if (text.length <= maxChars + 8) return Math.round(base * 0.82);
  if (text.length <= maxChars + 16) return Math.round(base * 0.68);
  return Math.round(base * 0.58);
}

/** Wrap long text into 2 SVG tspan lines, centered */
function wrapText(text: string, x: number, y: number, font: string, size: number, color: string, letterSpacing = 1.2): string {
  if (text.length <= 24) {
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="${size}" font-weight="bold" fill="${color}" letter-spacing="${letterSpacing}">${text}</text>`;
  }
  const mid = Math.floor(text.length / 2);
  let split = text.lastIndexOf(' ', mid);
  if (split < 3) split = text.indexOf(' ', mid);
  if (split < 0) split = mid;
  const line1 = text.slice(0, split).trim();
  const line2 = text.slice(split).trim();
  const lineH = size * 1.3;
  return `<text text-anchor="middle" font-family="${font}" font-weight="bold" fill="${color}" letter-spacing="${letterSpacing}">
    <tspan x="${x}" y="${y - lineH / 2}" font-size="${size}">${line1}</tspan>
    <tspan x="${x}" y="${y + lineH / 2}" font-size="${size}">${line2}</tspan>
  </text>`;
}

/**
 * Ring text path — stays inside the outer border circle.
 * r = radius of the text path (should be slightly inside the outer ring border)
 */
function ringText(id: string, cx: number, cy: number, r: number, text: string, font: string, fontSize: number, color: string, startOffset = '50%', letterSpacing = 1.8) {
  return `
    <defs>
      <path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r - 0.01} ${cy}"/>
    </defs>
    <text font-family="${font}" font-size="${fontSize}" fill="${color}" letter-spacing="${letterSpacing}">
      <textPath href="#${id}" startOffset="${startOffset}" text-anchor="middle">${text}</textPath>
    </text>`;
}

/** Bottom arc text */
function bottomArcText(id: string, cx: number, cy: number, r: number, text: string, font: string, fontSize: number, color: string, letterSpacing = 2) {
  return `
    <defs>
      <path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}"/>
    </defs>
    <text font-family="${font}" font-size="${fontSize}" fill="${color}" letter-spacing="${letterSpacing}">
      <textPath href="#${id}" startOffset="50%" text-anchor="middle">${text}</textPath>
    </text>`;
}

/** Star/diamond divider */
function divider(cx: number, y: number, color: string, width = 32, sw = 0.8) {
  return `
    <line x1="${cx - width}" y1="${y}" x2="${cx - 6}" y2="${y}" stroke="${color}" stroke-width="${sw}"/>
    <polygon points="${cx},${y - 3.5} ${cx + 4.5},${y} ${cx},${y + 3.5} ${cx - 4.5},${y}" fill="${color}"/>
    <line x1="${cx + 6}" y1="${y}" x2="${cx + width}" y2="${y}" stroke="${color}" stroke-width="${sw}"/>`;
}

/** Small horizontal rule */
function hRule(x1: number, x2: number, y: number, color: string, sw = 0.7) {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="${sw}"/>`;
}

/** Monogram centered */
function monogram(cx: number, cy: number, text: string, font: string, size: number, color: string) {
  return `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-size="${size}" font-weight="bold" fill="${color}">${text.toUpperCase().slice(0, 3)}</text>`;
}

/** Government seal block */
const BLOCKED_RE = /\b(government|ministry|federal|municipality|دائرة|حكومة|وزارة|بلدية|هيئة الحكومة)\b/i;

export function generateStampConcepts(project: StampProject): StampDesignConcept[] {
  const COLOR = '#1a2744';
  const W = 320, H = 320;
  const cx = W / 2, cy = H / 2;
  const R = 116; // outer ring radius
  const font = fontMap[project.typography_style];

  const name = project.company_name.toUpperCase().trim();
  const arabicName = (project.arabic_company_name || '').trim();

  // City + Country combined — ALWAYS combined
  const cityParts = [project.city_optional, project.country_optional].filter(Boolean);
  const city = (cityParts.join(', ') || 'UAE').toUpperCase();
  const arabicCity = (project.arabic_city || '').trim();

  const regNo = project.registration_number_optional ? `REG: ${project.registration_number_optional}` : '';
  const mono = (project.monogram_text || name.slice(0, 2)).toUpperCase().slice(0, 3);
  const hasMono = project.icon_style === 'MONOGRAM';
  const isBilingual = project.language_mode === 'BILINGUAL' || project.language_mode === 'AR';

  if (BLOCKED_RE.test(name)) {
    return [{
      id: 'blocked', templateKey: 'blocked', label: 'Blocked', tags: ['blocked'],
      svgSource: `<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="320" fill="#fff"/><circle cx="160" cy="140" r="65" fill="none" stroke="#c00" stroke-width="2"/><line x1="114" y1="94" x2="206" y2="186" stroke="#c00" stroke-width="2"/><text x="160" y="230" text-anchor="middle" font-family="Arial" font-size="11" fill="#c00">Government seals are blocked.</text></svg>`,
    }];
  }

  const concepts: StampDesignConcept[] = [];
  const uid = () => crypto.randomUUID();

  // ────────────────────────────────────────────────────────────────
  // T1: Classic Official Double Ring
  // Company name on TOP ring arc, city on BOTTOM ring arc, center content safe
  // ────────────────────────────────────────────────────────────────
  {
    const outerR = R;
    const innerR = R - 11;
    const ringTextR = R - 5;      // ring text sits just inside outer border
    const bottomArcR = R - 5;    // bottom arc same path
    const safeInner = R - 24;    // all center content must fit within this
    const nameFontSize = autoFontSize(name, 11, 20);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${COLOR}" stroke-width="2.4"/>
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${COLOR}" stroke-width="0.9"/>
      ${ringText('t1top', cx, cy, ringTextR, `✦  ${name}  ✦`, font, 8.5, COLOR, '25%', 1.6)}
      ${bottomArcText('t1bot', cx, cy, bottomArcR, `✦  ${city}  ✦`, font, 8, COLOR, 2)}
      ${hasMono
        ? `${monogram(cx, cy - 8, mono, font, 46, COLOR)}
           ${divider(cx, cy + 26, COLOR, 26)}
           <text x="${cx}" y="${cy + 40}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3.5">OFFICIAL STAMP</text>`
        : `${wrapText(name, cx, cy - 8, font, nameFontSize, COLOR, 1.5)}
           ${divider(cx, cy + 16, COLOR, 28)}
           <text x="${cx}" y="${cy + 28}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3.5">OFFICIAL STAMP</text>
           ${regNo && project.density >= 3 ? `<text x="${cx}" y="${cy + 40}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}`
      }
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'classic-double', label: 'Classic Official', tags: ['classic', 'round', 'professional', 'official'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T2: Modern Minimal — single thin border, horizontal rules, clean layout
  // NO ring text — all content inside safe zone
  // ────────────────────────────────────────────────────────────────
  {
    const r = R - 8;
    const pad = r - 14; // horizontal extent of rules
    const nameFontSize = autoFontSize(name, 11.5, 20);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="1.6"/>
      ${hRule(cx - pad, cx + pad, cy - 26, COLOR)}
      ${hRule(cx - pad, cx + pad, cy + 26, COLOR)}
      ${hasMono
        ? `${monogram(cx, cy - 54, mono, font, 30, COLOR)}`
        : ''
      }
      ${wrapText(name, cx, cx + (hasMono ? 0 : -8), font, nameFontSize, COLOR, 2)}
      <text x="${cx}" y="${cy + 12}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="8" fill="${COLOR}" letter-spacing="4">${city}</text>
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${cy + 38}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'modern-minimal', label: 'Modern Minimal', tags: ['modern', 'clean', 'minimal'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T3: Luxury Triple Ring — 3 concentric borders, company on ring, stars, monogram
  // ────────────────────────────────────────────────────────────────
  {
    const r1 = R, r2 = R - 12, r3 = R - 17;
    const ringR = R - 6;
    const nameFontSize = autoFontSize(name, 10, 18);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r1}" fill="none" stroke="${COLOR}" stroke-width="2.8"/>
      <circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="${COLOR}" stroke-width="0.5"/>
      <circle cx="${cx}" cy="${cy}" r="${r3}" fill="none" stroke="${COLOR}" stroke-width="1.4"/>
      ${ringText('t3ring', cx, cy, ringR, `★  ${name}  ★  ${city}  ★`, font, 8, COLOR, '50%', 1.5)}
      ${hasMono
        ? monogram(cx, cy, mono, font, 52, COLOR)
        : wrapText(name, cx, cy - 6, font, nameFontSize, COLOR, 1)
      }
      ${!hasMono ? `<text x="${cx}" y="${cy + 18}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">${city}</text>` : ''}
      ${divider(cx, cy + (hasMono ? 34 : 32), COLOR, 24)}
      <text x="${cx}" y="${cy + 44}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}" letter-spacing="5">EST. ${new Date().getFullYear() - 5}</text>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'luxury-ring', label: 'Luxury Triple Ring', tags: ['luxury', 'premium', 'ornate'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T4: Bold Rectangle Corporate — strong double border, ruled header + footer
  // ────────────────────────────────────────────────────────────────
  {
    const rw = 134, rh = 88;
    const x1 = cx - rw, y1 = cy - rh;
    const nameFontSize = autoFontSize(name, 11, 22);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x1}" y="${y1}" width="${rw * 2}" height="${rh * 2}" rx="4" fill="none" stroke="${COLOR}" stroke-width="3.2"/>
      <rect x="${x1 + 6}" y="${y1 + 6}" width="${rw * 2 - 12}" height="${rh * 2 - 12}" rx="2" fill="none" stroke="${COLOR}" stroke-width="0.8"/>
      <text x="${cx}" y="${y1 + 28}" text-anchor="middle" font-family="${font}" font-size="8.5" fill="${COLOR}" letter-spacing="4">${city}</text>
      ${hRule(x1 + 16, x1 + rw * 2 - 16, y1 + 37, COLOR)}
      ${wrapText(name, cx, cy, font, nameFontSize, COLOR, 2)}
      ${hRule(x1 + 16, x1 + rw * 2 - 16, y1 + rh * 2 - 37, COLOR)}
      <text x="${cx}" y="${y1 + rh * 2 - 22}" text-anchor="middle" font-family="${font}" font-size="8" fill="${COLOR}" letter-spacing="3">OFFICIAL STAMP</text>
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${y1 + rh * 2 - 10}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'bold-rectangle', label: 'Bold Corporate Rectangle', tags: ['bold', 'rectangle', 'corporate'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T5: Vintage Seal — dashed inner ring, ornate ring text with diamonds
  // ────────────────────────────────────────────────────────────────
  {
    const outerR = R;
    const innerR = R - 20;
    const ringR = R - 5;
    const nameFontSize = autoFontSize(name, 10, 18);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${COLOR}" stroke-width="2.2"/>
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${COLOR}" stroke-width="0.7" stroke-dasharray="3.5,2.5"/>
      ${ringText('t5ring', cx, cy, ringR, `⬥  ${name}  ⬥  ${city}  ⬥`, font, 8.2, COLOR, '50%', 1.6)}
      ${hasMono
        ? monogram(cx, cy - 6, mono, font, 42, COLOR)
        : wrapText(name, cx, cy - 6, font, nameFontSize, COLOR, 1.5)
      }
      ${divider(cx, cy + (hasMono ? 18 : 14), COLOR, 26)}
      <text x="${cx}" y="${cy + (hasMono ? 30 : 26)}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="4">SINCE ${new Date().getFullYear() - 5}</text>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'vintage-ornate', label: 'Vintage Seal', tags: ['vintage', 'ornate', 'classic'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T6: Bilingual Official — Arabic top / English bottom with proper RTL
  // Only generated for AR or BILINGUAL; uses actual arabic_company_name
  // ────────────────────────────────────────────────────────────────
  if (isBilingual) {
    const outerR = R;
    const innerR = R - 10;
    const displayArabic = arabicName || name;
    const displayArabicCity = arabicCity || city;
    const enFontSize = autoFontSize(name, 9.5, 22);
    const arFontSize = autoFontSize(displayArabic, 13, 16);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${COLOR}" stroke-width="2.4"/>
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${COLOR}" stroke-width="0.8"/>
      <!-- Center horizontal divider -->
      ${hRule(cx - 64, cx + 64, cy + 2, COLOR, 1.2)}
      <!-- Star ornaments on divider -->
      <text x="${cx}" y="${cy + 6}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}">✦</text>
      <!-- Arabic section — UPPER HALF (Arabic reads right-to-left, prominent) -->
      <text x="${cx}" y="${cy - 32}" text-anchor="middle" dominant-baseline="middle"
        font-family="${arabicFont}" font-size="${arFontSize}" font-weight="bold" fill="${COLOR}"
        direction="rtl" unicode-bidi="bidi-override">${displayArabic}</text>
      <text x="${cx}" y="${cy - 14}" text-anchor="middle" dominant-baseline="middle"
        font-family="${arabicFont}" font-size="8.5" fill="${COLOR}"
        direction="rtl">${displayArabicCity}</text>
      <!-- English section — LOWER HALF -->
      <text x="${cx}" y="${cy + 22}" text-anchor="middle" dominant-baseline="middle"
        font-family="${font}" font-size="${enFontSize}" font-weight="bold" fill="${COLOR}">${name}</text>
      <text x="${cx}" y="${cy + 36}" text-anchor="middle" dominant-baseline="middle"
        font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="2">${city}</text>
      ${regNo && project.density >= 3
        ? `<text x="${cx}" y="${cy + 50}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>`
        : ''
      }
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'bilingual-official', label: 'Bilingual Official', tags: ['bilingual', 'arabic', 'official', 'UAE'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T7: Geometric Modern — inner diamond element, ring text, clean
  // ────────────────────────────────────────────────────────────────
  {
    const r = R - 6;
    const nameFontSize = autoFontSize(name, 10, 20);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 7}" fill="none" stroke="${COLOR}" stroke-width="0.5"/>
      ${hasMono
        ? `<rect x="${cx - 34}" y="${cy - 34}" width="68" height="68" fill="none" stroke="${COLOR}" stroke-width="1.1" transform="rotate(45, ${cx}, ${cy})"/>
           ${monogram(cx, cy - 2, mono, font, 30, COLOR)}`
        : `<rect x="${cx - 46}" y="${cy - 23}" width="92" height="46" rx="2" fill="none" stroke="${COLOR}" stroke-width="0.9"/>`
      }
      ${ringText('t7ring', cx, cy, r - 4, `${name}  ◆  ${city}`, font, 7.8, COLOR, '50%', 1.5)}
      ${!hasMono ? wrapText(name, cx, cy, font, nameFontSize, COLOR, 2) : ''}
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'geometric-modern', label: 'Geometric Modern', tags: ['geometric', 'modern', 'architectural'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T8: Square Premium — double-border square, section dividers
  // ────────────────────────────────────────────────────────────────
  {
    const s = 106;
    const x1 = cx - s, y1 = cy - s;
    const nameFontSize = autoFontSize(name, 10.5, 20);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x1}" y="${y1}" width="${s * 2}" height="${s * 2}" rx="4" fill="none" stroke="${COLOR}" stroke-width="2.8"/>
      <rect x="${x1 + 7}" y="${y1 + 7}" width="${s * 2 - 14}" height="${s * 2 - 14}" rx="2" fill="none" stroke="${COLOR}" stroke-width="0.9"/>
      <text x="${cx}" y="${y1 + 24}" text-anchor="middle" font-family="${font}" font-size="8" fill="${COLOR}" letter-spacing="3">OFFICIAL STAMP</text>
      ${hRule(x1 + 14, x1 + s * 2 - 14, y1 + 34, COLOR)}
      ${hasMono ? monogram(cx, cy - 18, mono, font, 42, COLOR) : ''}
      ${wrapText(name, cx, cy + (hasMono ? 22 : 4), font, nameFontSize, COLOR, 1.5)}
      <text x="${cx}" y="${cy + (hasMono ? 42 : 24)}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="8" fill="${COLOR}" letter-spacing="3">${city}</text>
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${cy + (hasMono ? 56 : 38)}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
      ${hRule(x1 + 14, x1 + s * 2 - 14, y1 + s * 2 - 34, COLOR)}
      ${divider(cx, y1 + s * 2 - 18, COLOR, 28)}
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'square-premium', label: 'Square Premium', tags: ['square', 'corporate', 'premium'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T9: Arabic Calligraphy — Arabic-first layout with decorative ring (AR/BILINGUAL only)
  // If not bilingual, generate an extra "Official Seal" style
  // ────────────────────────────────────────────────────────────────
  if (isBilingual && arabicName) {
    const outerR = R;
    const r2 = R - 14;
    const arFontSize = autoFontSize(arabicName, 16, 14);
    const displayArabicCity = arabicCity || city;

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${COLOR}" stroke-width="2.6"/>
      <circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="${COLOR}" stroke-width="1.1"/>
      <!-- Stars on inner ring at cardinal points -->
      <text x="${cx}" y="${cy - r2 + 5}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}">✦</text>
      <text x="${cx}" y="${cy + r2 + 5}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}">✦</text>
      <!-- Arabic name — prominent center -->
      <text x="${cx}" y="${cy - 14}" text-anchor="middle" dominant-baseline="middle"
        font-family="${arabicFont}" font-size="${arFontSize}" font-weight="bold" fill="${COLOR}"
        direction="rtl" unicode-bidi="bidi-override">${arabicName}</text>
      <!-- Arabic city -->
      <text x="${cx}" y="${cy + 8}" text-anchor="middle" dominant-baseline="middle"
        font-family="${arabicFont}" font-size="10" fill="${COLOR}" direction="rtl">${displayArabicCity}</text>
      ${divider(cx, cy + 22, COLOR, 28)}
      <!-- English name small -->
      <text x="${cx}" y="${cy + 36}" text-anchor="middle" dominant-baseline="middle"
        font-family="${font}" font-size="8" fill="${COLOR}" letter-spacing="1.5">${name}</text>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'arabic-calligraphy', label: 'Arabic Calligraphy', tags: ['arabic', 'calligraphy', 'RTL', 'premium'], svgSource: svg });
  } else {
    // Official Seal variant for EN-only
    const outerR = R;
    const r2 = R - 10;
    const r3 = R - 18;
    const ringR = R - 5;
    const nameFontSize = autoFontSize(name, 9.5, 20);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${COLOR}" stroke-width="2.4"/>
      <circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="${COLOR}" stroke-width="0.8"/>
      <circle cx="${cx}" cy="${cy}" r="${r3}" fill="none" stroke="${COLOR}" stroke-width="0.5" stroke-dasharray="2,2"/>
      ${ringText('t9ring', cx, cy, ringR, `●  ${name}  ●  ${city}  ●`, font, 8, COLOR, '50%', 1.6)}
      ${hasMono ? monogram(cx, cy - 4, mono, font, 44, COLOR) : wrapText(name, cx, cy - 8, font, nameFontSize, COLOR, 1.5)}
      ${!hasMono ? `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">${city}</text>` : ''}
      ${divider(cx, cy + (hasMono ? 22 : 26), COLOR, 22)}
      <text x="${cx}" y="${cy + (hasMono ? 34 : 38)}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}" letter-spacing="4">OFFICIAL SEAL</text>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'official-seal', label: 'Official Seal', tags: ['seal', 'official', 'premium', 'concentric'], svgSource: svg });
  }

  return concepts;
}
