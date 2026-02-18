/**
 * SVG Stamp Template Engine — Premium Edition
 * Generates 8 high-quality stamp concept SVGs from user-supplied project data.
 * Fixed: city+country combined, bilingual Arabic, safe text zones, no overlapping.
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

/** Auto-scale font size based on text length */
function autoFontSize(text: string, base: number, maxChars = 20): number {
  if (text.length <= maxChars) return base;
  if (text.length <= maxChars + 8) return Math.round(base * 0.85);
  return Math.round(base * 0.72);
}

/** Wrap long text into 2 SVG tspan lines */
function wrapText(text: string, x: number, y: number, font: string, size: number, color: string, letterSpacing = 1): string {
  if (text.length <= 22) {
    return `<text x="${x}" y="${y}" text-anchor="middle" font-family="${font}" font-size="${size}" font-weight="bold" fill="${color}" letter-spacing="${letterSpacing}">${text}</text>`;
  }
  // Split at space near middle
  const mid = Math.floor(text.length / 2);
  let split = text.lastIndexOf(' ', mid);
  if (split < 5) split = text.indexOf(' ', mid);
  if (split < 0) split = mid;
  const line1 = text.slice(0, split).trim();
  const line2 = text.slice(split).trim();
  const lineH = size + 2;
  return `<text text-anchor="middle" font-family="${font}" font-size="${size}" font-weight="bold" fill="${color}" letter-spacing="${letterSpacing}">
    <tspan x="${x}" dy="-${lineH / 2}">${line1}</tspan>
    <tspan x="${x}" dy="${lineH}">${line2}</tspan>
  </text>`;
}

/** Circular arc text path — RING TEXT stays tight to border */
function ringText(id: string, cx: number, cy: number, r: number, text: string, font: string, fontSize: number, color: string, startOffset = '50%') {
  // Arc path goes counter-clockwise so text reads naturally on top arc
  return `
    <defs>
      <path id="${id}" d="
        M ${cx - r} ${cy}
        A ${r} ${r} 0 1 1 ${cx + r} ${cy}
        A ${r} ${r} 0 1 1 ${cx - r} ${cy}
      "/>
    </defs>
    <text font-family="${font}" font-size="${fontSize}" fill="${color}" letter-spacing="1.5">
      <textPath href="#${id}" startOffset="${startOffset}" text-anchor="middle">${text}</textPath>
    </text>`;
}

/** Bottom arc text (for location/city in classic designs) */
function bottomArcText(id: string, cx: number, cy: number, r: number, text: string, font: string, fontSize: number, color: string) {
  return `
    <defs>
      <path id="${id}" d="
        M ${cx - r} ${cy}
        A ${r} ${r} 0 0 0 ${cx + r} ${cy}
      "/>
    </defs>
    <text font-family="${font}" font-size="${fontSize}" fill="${color}" letter-spacing="2">
      <textPath href="#${id}" startOffset="50%" text-anchor="middle">${text}</textPath>
    </text>`;
}

/** Star/diamond divider line */
function divider(cx: number, y: number, color: string, width = 30) {
  return `
    <line x1="${cx - width}" y1="${y}" x2="${cx - 5}" y2="${y}" stroke="${color}" stroke-width="0.7"/>
    <polygon points="${cx},${y - 3} ${cx + 4},${y} ${cx},${y + 3} ${cx - 4},${y}" fill="${color}"/>
    <line x1="${cx + 5}" y1="${y}" x2="${cx + width}" y2="${y}" stroke="${color}" stroke-width="0.7"/>`;
}

/** Monogram centered element */
function monogram(cx: number, cy: number, text: string, font: string, size: number, color: string) {
  return `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-size="${size}" font-weight="bold" fill="${color}">${text.toUpperCase().slice(0, 3)}</text>`;
}

/** Government block check */
const BLOCKED_RE = /\b(government|ministry|federal|municipality|دائرة|حكومة|وزارة|بلدية|هيئة الحكومة)\b/i;

export function generateStampConcepts(project: StampProject): StampDesignConcept[] {
  const COLOR = '#1a2744';
  const W = 300, H = 300;
  const cx = W / 2, cy = H / 2;
  const R = 108; // outer ring radius
  const font = fontMap[project.typography_style];
  const arabicFont = 'Arial, "Noto Naskh Arabic", sans-serif';

  const name = project.company_name.toUpperCase().trim();
  const arabicName = (project.arabic_company_name || '').trim();

  // City + Country combined — FIXED
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
      svgSource: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#fff"/><circle cx="150" cy="130" r="60" fill="none" stroke="#c00" stroke-width="2"/><line x1="108" y1="88" x2="192" y2="172" stroke="#c00" stroke-width="2"/><text x="150" y="215" text-anchor="middle" font-family="Arial" font-size="11" fill="#c00">Government seals are blocked.</text></svg>`,
    }];
  }

  const concepts: StampDesignConcept[] = [];
  const uid = () => crypto.randomUUID();

  // ──────────────────────────────────────────────────────────────────────────
  // T1: Classic Double Ring — ring text top, city bottom arc, name+mono center
  // Safe zone: inner content stays within R-22 from center
  // ──────────────────────────────────────────────────────────────────────────
  {
    const innerR = R - 10;
    const ringR = R - 5; // ring text path radius
    const safeR = R - 22; // inner safe zone radius
    const nameFontSize = autoFontSize(name, 10, 20);
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <!-- Outer double border -->
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${COLOR}" stroke-width="2.2"/>
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${COLOR}" stroke-width="0.8"/>
      <!-- Ring text: company name on top arc -->
      ${ringText('cp1t', cx, cy, ringR, `✦  ${name}  ✦`, font, 8.5, COLOR, '25%')}
      <!-- Bottom arc: city/country -->
      ${bottomArcText('cp1b', cx, cy, ringR, city, font, 8, COLOR)}
      <!-- Center monogram or name -->
      ${hasMono ? monogram(cx, cy - 8, mono, font, 44, COLOR) : ''}
      ${hasMono
        ? `<text x="${cx}" y="${cy + 30}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}" letter-spacing="2">OFFICIAL STAMP</text>`
        : wrapText(name, cx, cy - 4, font, nameFontSize, COLOR, 1.5)
      }
      ${!hasMono ? `<text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">OFFICIAL STAMP</text>` : ''}
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${cy + (hasMono ? 44 : 36)}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
      ${divider(cx, cy + (hasMono ? 16 : 8), COLOR, 28)}
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'classic-double', label: 'Classic Double Ring', tags: ['classic', 'round', 'professional', 'official'], svgSource: svg });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // T2: Modern Minimal — single thin border, horizontal rule dividers, clean layout
  // ──────────────────────────────────────────────────────────────────────────
  {
    const r = R - 8;
    const innerPad = 22;
    const nameFontSize = autoFontSize(name, 11, 20);
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="1.5"/>
      <!-- Horizontal dividers inside safe zone -->
      <line x1="${cx - r + innerPad}" y1="${cy - 22}" x2="${cx + r - innerPad}" y2="${cy - 22}" stroke="${COLOR}" stroke-width="0.7"/>
      <line x1="${cx - r + innerPad}" y1="${cy + 22}" x2="${cx + r - innerPad}" y2="${cy + 22}" stroke="${COLOR}" stroke-width="0.7"/>
      ${hasMono ? monogram(cx, cy - 50, mono, font, 30, COLOR) : ''}
      ${wrapText(name, cx, cy + (hasMono ? -4 : -8), font, nameFontSize, COLOR, 2)}
      <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="4">${city}</text>
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${cy + 34}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'modern-minimal', label: 'Modern Minimal', tags: ['modern', 'clean', 'minimal'], svgSource: svg });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // T3: Luxury Triple Ring — 3 concentric borders, star dividers, monogram
  // ──────────────────────────────────────────────────────────────────────────
  {
    const r1 = R, r2 = R - 13, r3 = R - 18;
    const ringR = R - 7;
    const nameFontSize = autoFontSize(name, 10, 18);
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r1}" fill="none" stroke="${COLOR}" stroke-width="2.8"/>
      <circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="${COLOR}" stroke-width="0.5"/>
      <circle cx="${cx}" cy="${cy}" r="${r3}" fill="none" stroke="${COLOR}" stroke-width="1.2"/>
      ${ringText('cp3', cx, cy, ringR, `★  ${name}  ★  ${city}  ★`, font, 7.5, COLOR, '50%')}
      ${hasMono
        ? monogram(cx, cy, mono, font, 52, COLOR)
        : wrapText(name, cx, cy - 6, font, nameFontSize, COLOR, 1)
      }
      ${!hasMono ? `<text x="${cx}" y="${cy + 20}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="4">${city}</text>` : ''}
      ${divider(cx, cy + (hasMono ? 34 : 34), COLOR, 22)}
      <text x="${cx}" y="${cy + 44}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}" letter-spacing="5">EST.</text>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'luxury-ring', label: 'Luxury Triple Ring', tags: ['luxury', 'premium', 'ornate'], svgSource: svg });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // T4: Bold Rectangle Corporate — strong double-border rect, ruled sections
  // ──────────────────────────────────────────────────────────────────────────
  {
    const rw = 128, rh = 82;
    const x1 = cx - rw, y1 = cy - rh;
    const nameFontSize = autoFontSize(name, 11, 22);
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x1}" y="${y1}" width="${rw * 2}" height="${rh * 2}" rx="4" fill="none" stroke="${COLOR}" stroke-width="3"/>
      <rect x="${x1 + 5}" y="${y1 + 5}" width="${rw * 2 - 10}" height="${rh * 2 - 10}" rx="2" fill="none" stroke="${COLOR}" stroke-width="0.8"/>
      <!-- City header section -->
      <text x="${cx}" y="${y1 + 26}" text-anchor="middle" font-family="${font}" font-size="8.5" fill="${COLOR}" letter-spacing="4">${city}</text>
      <line x1="${x1 + 14}" y1="${y1 + 34}" x2="${x1 + rw * 2 - 14}" y2="${y1 + 34}" stroke="${COLOR}" stroke-width="0.7"/>
      <!-- Main company name -->
      ${wrapText(name, cx, cy, font, nameFontSize, COLOR, 2)}
      <!-- Bottom section -->
      <line x1="${x1 + 14}" y1="${y1 + rh * 2 - 34}" x2="${x1 + rw * 2 - 14}" y2="${y1 + rh * 2 - 34}" stroke="${COLOR}" stroke-width="0.7"/>
      <text x="${cx}" y="${y1 + rh * 2 - 18}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">OFFICIAL STAMP</text>
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${y1 + rh * 2 - 8}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'bold-rectangle', label: 'Bold Corporate Rectangle', tags: ['bold', 'rectangle', 'corporate'], svgSource: svg });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // T5: Vintage Seal — dashed inner ring, ornate ring text, classic monogram
  // ──────────────────────────────────────────────────────────────────────────
  {
    const r = R, innerR = R - 18;
    const ringR = R - 5;
    const nameFontSize = autoFontSize(name, 9.5, 18);
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${COLOR}" stroke-width="0.6" stroke-dasharray="3,2.5"/>
      ${ringText('cp5', cx, cy, ringR, `⬥  ${name}  ⬥  ${city}  ⬥`, font, 8, COLOR, '50%')}
      ${hasMono ? monogram(cx, cy - 6, mono, font, 40, COLOR) : wrapText(name, cx, cy - 6, font, nameFontSize, COLOR, 1.5)}
      ${divider(cx, cy + (hasMono ? 18 : 14), COLOR, 24)}
      <text x="${cx}" y="${cy + (hasMono ? 30 : 26)}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}" letter-spacing="4">SINCE ${new Date().getFullYear() - 5}</text>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'vintage-ornate', label: 'Vintage Seal', tags: ['vintage', 'ornate', 'classic'], svgSource: svg });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // T6: Bilingual Official — proper Arabic + English, horizontal divider
  // Only generated if language is AR or BILINGUAL; uses actual arabic_company_name
  // ──────────────────────────────────────────────────────────────────────────
  if (isBilingual) {
    const r = R, innerR = R - 9;
    const displayArabic = arabicName || name; // fallback to English if no Arabic provided
    const displayArabicCity = arabicCity || city;
    const enFontSize = autoFontSize(name, 9.5, 22);
    const arFontSize = autoFontSize(displayArabic, 11, 16);
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="2.2"/>
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${COLOR}" stroke-width="0.7"/>
      <!-- Horizontal center divider -->
      <line x1="${cx - 55}" y1="${cy}" x2="${cx + 55}" y2="${cy}" stroke="${COLOR}" stroke-width="1"/>
      <!-- English section (top half) -->
      <text x="${cx}" y="${cy - 28}" text-anchor="middle" font-family="${font}" font-size="${enFontSize}" font-weight="bold" fill="${COLOR}">${name}</text>
      <text x="${cx}" y="${cy - 14}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="2">${city}</text>
      <!-- Arabic section (bottom half) — RTL -->
      <text x="${cx}" y="${cy + 20}" text-anchor="middle" font-family="${arabicFont}" font-size="${arFontSize}" font-weight="bold" fill="${COLOR}" direction="rtl" unicode-bidi="bidi-override">${displayArabic}</text>
      <text x="${cx}" y="${cy + 34}" text-anchor="middle" font-family="${arabicFont}" font-size="8" fill="${COLOR}" direction="rtl">${displayArabicCity}</text>
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${cy + 52}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
      <!-- Top caption -->
      <text x="${cx}" y="${cy - 52}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}" letter-spacing="2">OFFICIAL STAMP</text>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'bilingual-official', label: 'Bilingual Official', tags: ['bilingual', 'arabic', 'official', 'UAE'], svgSource: svg });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // T7: Geometric Modern — inner diamond/square element, architectural feel
  // ──────────────────────────────────────────────────────────────────────────
  {
    const r = R - 6;
    const sq = 36; // inner square half-size
    const nameFontSize = autoFontSize(name, 10, 20);
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="1.8"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 6}" fill="none" stroke="${COLOR}" stroke-width="0.5"/>
      <!-- Inner geometric diamond -->
      ${hasMono
        ? `<rect x="${cx - sq}" y="${cy - sq}" width="${sq * 2}" height="${sq * 2}" fill="none" stroke="${COLOR}" stroke-width="1" transform="rotate(45, ${cx}, ${cy})"/>
           ${monogram(cx, cy - 2, mono, font, 28, COLOR)}`
        : `<rect x="${cx - 45}" y="${cy - 22}" width="90" height="44" rx="2" fill="none" stroke="${COLOR}" stroke-width="0.8"/>`
      }
      <!-- Ring text on outer ring -->
      ${ringText('cp7', cx, cy, r - 3, `${name}  ◆  ${city}`, font, 7.5, COLOR, '50%')}
      ${!hasMono ? wrapText(name, cx, cy, font, nameFontSize, COLOR, 2) : ''}
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'geometric-modern', label: 'Geometric Modern', tags: ['geometric', 'modern', 'architectural'], svgSource: svg });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // T8: Square Box Premium — double-border square, section lines, dense info
  // ──────────────────────────────────────────────────────────────────────────
  {
    const s = 100; // half-size of square
    const nameFontSize = autoFontSize(name, 10, 20);
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${cx - s}" y="${cy - s}" width="${s * 2}" height="${s * 2}" rx="3" fill="none" stroke="${COLOR}" stroke-width="2.5"/>
      <rect x="${cx - s + 6}" y="${cy - s + 6}" width="${s * 2 - 12}" height="${s * 2 - 12}" rx="2" fill="none" stroke="${COLOR}" stroke-width="0.8"/>
      ${hasMono ? monogram(cx, cy - 22, mono, font, 42, COLOR) : ''}
      ${wrapText(name, cx, cy + (hasMono ? 18 : 0), font, nameFontSize, COLOR, 1.5)}
      <text x="${cx}" y="${cy + (hasMono ? 38 : 18)}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">${city}</text>
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${cy + (hasMono ? 52 : 32)}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
      <!-- Top section label -->
      <text x="${cx}" y="${cy - s + 18}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}" letter-spacing="3">OFFICIAL STAMP</text>
      <line x1="${cx - s + 10}" y1="${cy - s + 24}" x2="${cx + s - 10}" y2="${cy - s + 24}" stroke="${COLOR}" stroke-width="0.7"/>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'square-premium', label: 'Square Premium', tags: ['square', 'corporate', 'premium'], svgSource: svg });
  }

  return concepts;
}
