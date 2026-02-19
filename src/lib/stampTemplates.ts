/**
 * SVG Stamp Template Engine — Premium Edition v3
 * Filled rings, gradients, ornaments. Two new premium templates.
 * Safe zones enforced. Bilingual Arabic proper RTL.
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
  density: number;
}

export interface StampDesignConcept {
  id: string;
  templateKey: string;
  label: string;
  tags: string[];
  svgSource: string;
  isFavorite?: boolean;
}

const fontMap = {
  SERIF: 'Georgia, "Times New Roman", serif',
  SANS: 'Arial, Helvetica, sans-serif',
  MONOSPACE: '"Courier New", monospace',
  CALLIGRAPHY: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
};

const arabicFont = '"Noto Naskh Arabic", "Arabic Typesetting", Arial, sans-serif';

function autoFontSize(text: string, base: number, maxChars = 20): number {
  if (text.length <= maxChars) return base;
  if (text.length <= maxChars + 8) return Math.round(base * 0.82);
  if (text.length <= maxChars + 16) return Math.round(base * 0.68);
  return Math.round(base * 0.58);
}

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

function ringText(id: string, cx: number, cy: number, r: number, text: string, font: string, fontSize: number, color: string, startOffset = '50%', letterSpacing = 1.8) {
  return `
    <defs>
      <path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r - 0.01} ${cy}"/>
    </defs>
    <text font-family="${font}" font-size="${fontSize}" fill="${color}" letter-spacing="${letterSpacing}">
      <textPath href="#${id}" startOffset="${startOffset}" text-anchor="middle">${text}</textPath>
    </text>`;
}

function bottomArcText(id: string, cx: number, cy: number, r: number, text: string, font: string, fontSize: number, color: string, letterSpacing = 2) {
  return `
    <defs>
      <path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}"/>
    </defs>
    <text font-family="${font}" font-size="${fontSize}" fill="${color}" letter-spacing="${letterSpacing}">
      <textPath href="#${id}" startOffset="50%" text-anchor="middle">${text}</textPath>
    </text>`;
}

function divider(cx: number, y: number, color: string, width = 32, sw = 0.8) {
  return `
    <line x1="${cx - width}" y1="${y}" x2="${cx - 6}" y2="${y}" stroke="${color}" stroke-width="${sw}"/>
    <polygon points="${cx},${y - 3.5} ${cx + 4.5},${y} ${cx},${y + 3.5} ${cx - 4.5},${y}" fill="${color}"/>
    <line x1="${cx + 6}" y1="${y}" x2="${cx + width}" y2="${y}" stroke="${color}" stroke-width="${sw}"/>`;
}

function hRule(x1: number, x2: number, y: number, color: string, sw = 0.7) {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="${sw}"/>`;
}

function monogram(cx: number, cy: number, text: string, font: string, size: number, color: string, bg?: string) {
  const circle = bg ? `<circle cx="${cx}" cy="${cy}" r="${size * 0.72}" fill="${bg}"/>` : '';
  const textColor = bg ? '#ffffff' : color;
  return `${circle}<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-size="${size}" font-weight="bold" fill="${textColor}">${text.toUpperCase().slice(0, 3)}</text>`;
}

/** Premium 8-pointed star/sunburst */
function starBurst(cx: number, cy: number, outerR: number, innerR: number, color: string, points = 16) {
  const pts: string[] = [];
  for (let i = 0; i < points; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI * 2) / points - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${color}"/>`;
}

/** Corner ornament diamond for rectangular stamps */
function cornerOrnament(x: number, y: number, size: number, color: string) {
  return `<polygon points="${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}" fill="${color}"/>`;
}

/** Small star cluster at position */
function starCluster(cx: number, cy: number, color: string) {
  return `<polygon points="${cx},${cy - 4} ${cx + 1},${cy - 1.5} ${cx + 4},${cy - 1.5} ${cx + 1.5},${cy + 0.5} ${cx + 2.5},${cy + 4} ${cx},${cy + 2} ${cx - 2.5},${cy + 4} ${cx - 1.5},${cy + 0.5} ${cx - 4},${cy - 1.5} ${cx - 1},${cy - 1.5}" fill="${color}"/>`;
}

const BLOCKED_RE = /\b(government|ministry|federal|municipality|دائرة|حكومة|وزارة|بلدية|هيئة الحكومة)\b/i;

export function generateStampConcepts(project: StampProject): StampDesignConcept[] {
  const COLOR = '#1a2744';
  const W = 320, H = 320;
  const cx = W / 2, cy = H / 2;
  const R = 116;
  const font = fontMap[project.typography_style];

  const name = project.company_name.toUpperCase().trim();
  const arabicName = (project.arabic_company_name || '').trim();
  const cityParts = [project.city_optional, project.country_optional].filter(Boolean);
  const city = (cityParts.join(', ') || 'UAE').toUpperCase();
  const arabicCity = (project.arabic_city || '').trim();
  const regNo = project.registration_number_optional ? `REG: ${project.registration_number_optional}` : '';
  const mono = (project.monogram_text || name.slice(0, 2)).toUpperCase().slice(0, 3);
  const hasMono = project.icon_style === 'MONOGRAM';
  const isBilingual = project.language_mode === 'BILINGUAL' || project.language_mode === 'AR';
  const estYear = new Date().getFullYear() - 5;

  if (BLOCKED_RE.test(name)) {
    return [{
      id: 'blocked', templateKey: 'blocked', label: 'Blocked', tags: ['blocked'],
      svgSource: `<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="320" fill="#fff"/><circle cx="160" cy="140" r="65" fill="none" stroke="#c00" stroke-width="2"/><line x1="114" y1="94" x2="206" y2="186" stroke="#c00" stroke-width="2"/><text x="160" y="230" text-anchor="middle" font-family="Arial" font-size="11" fill="#c00">Government seals are blocked.</text></svg>`,
    }];
  }

  const concepts: StampDesignConcept[] = [];
  const uid = () => crypto.randomUUID();

  // ────────────────────────────────────────────────────────────────
  // T1: Classic Official Double Ring — PREMIUM: filled outer band, cardinal star dividers
  // ────────────────────────────────────────────────────────────────
  {
    const outerR = R;
    const bandR = R - 14; // inner edge of filled band
    const innerR = R - 18;
    const ringTextR = R - 7;
    const bottomArcR = R - 7;
    const nameFontSize = autoFontSize(name, 11, 20);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="t1bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${COLOR}" stop-opacity="0.04"/>
          <stop offset="100%" stop-color="${COLOR}" stop-opacity="0.10"/>
        </radialGradient>
      </defs>
      <!-- Filled outer ring band -->
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${COLOR}"/>
      <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
      <!-- Inner accent ring -->
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${COLOR}" stroke-width="1.2"/>
      <!-- Subtle center fill -->
      <circle cx="${cx}" cy="${cy}" r="${innerR - 4}" fill="url(#t1bg)"/>
      <!-- Cardinal star ornaments on band -->
      ${[0, 90, 180, 270].map(deg => {
        const rad = (deg * Math.PI) / 180;
        const starCx = cx + (outerR - 7) * Math.cos(rad);
        const starCy = cy + (outerR - 7) * Math.sin(rad);
        return `<circle cx="${starCx}" cy="${starCy}" r="2.5" fill="#ffffff"/>`;
      }).join('')}
      <!-- Ring text in band -->
      ${ringText('t1top', cx, cy, ringTextR, `✦  ${name}  ✦`, font, 8.5, '#ffffff', '25%', 1.6)}
      ${bottomArcText('t1bot', cx, cy, bottomArcR, `✦  ${city}  ✦`, font, 8, '#ffffff', 2)}
      ${hasMono
        ? `${monogram(cx, cy - 8, mono, font, 42, COLOR, COLOR)}
           ${divider(cx, cy + 28, COLOR, 26)}
           <text x="${cx}" y="${cy + 42}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3.5">OFFICIAL STAMP</text>`
        : `${wrapText(name, cx, cy - 8, font, nameFontSize, COLOR, 1.5)}
           ${divider(cx, cy + 18, COLOR, 28)}
           <text x="${cx}" y="${cy + 30}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3.5">OFFICIAL STAMP</text>
           ${regNo && project.density >= 3 ? `<text x="${cx}" y="${cy + 44}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}`
      }
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'classic-double', label: 'Classic Official', tags: ['classic', 'round', 'professional', 'official'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T2: Modern Minimal — radial gradient fill, clean geometric lines
  // ────────────────────────────────────────────────────────────────
  {
    const r = R - 8;
    // Safe zone: text must stay within r - 14px from center
    const safeR = r - 14;
    const pad = Math.min(safeR - 4, r - 18);
    const nameFontSize = autoFontSize(name, 11, 20);
    // Tighter layout to prevent text escaping circle
    const monoY = cy - Math.round(safeR * 0.55);
    const nameY = hasMono ? cy + 4 : cy - 10;
    const cityY = nameY + (name.length > 24 ? 28 : 22);
    const regY = cityY + 14;

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="t2bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${COLOR}" stop-opacity="0.03"/>
          <stop offset="100%" stop-color="${COLOR}" stop-opacity="0.08"/>
        </radialGradient>
        <clipPath id="t2clip"><circle cx="${cx}" cy="${cy}" r="${r - 4}"/></clipPath>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#t2bg)" stroke="${COLOR}" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 6}" fill="none" stroke="${COLOR}" stroke-width="0.5" stroke-dasharray="2,3"/>
      <g clip-path="url(#t2clip)">
        ${hRule(cx - pad, cx + pad, nameY - 14, COLOR, 1.2)}
        ${hRule(cx - pad + 8, cx + pad - 8, nameY - 12, COLOR, 0.4)}
        ${hasMono ? monogram(cx, monoY, mono, font, 28, COLOR) : ''}
        ${wrapText(name, cx, nameY, font, nameFontSize, COLOR, 2)}
        <text x="${cx}" y="${cityY}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3.5">${city}</text>
        ${hRule(cx - pad, cx + pad, cityY + 12, COLOR, 1.2)}
        ${hRule(cx - pad + 8, cx + pad - 8, cityY + 14, COLOR, 0.4)}
        ${regNo && project.density >= 3 ? `<text x="${cx}" y="${regY + 4}" text-anchor="middle" font-family="${font}" font-size="6" fill="${COLOR}">${regNo}</text>` : ''}
      </g>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'modern-minimal', label: 'Modern Minimal', tags: ['modern', 'clean', 'minimal'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T3: Luxury Triple Ring — filled outer ring, fleur-de-lis dividers
  // ────────────────────────────────────────────────────────────────
  {
    const r1 = R, r2 = R - 10, r3 = R - 16, r4 = R - 20;
    const ringR = R - 5;
    const nameFontSize = autoFontSize(name, 10, 18);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <!-- Outer filled band -->
      <circle cx="${cx}" cy="${cy}" r="${r1}" fill="${COLOR}"/>
      <circle cx="${cx}" cy="${cy}" r="${r2}" fill="#ffffff"/>
      <!-- Accent rings -->
      <circle cx="${cx}" cy="${cy}" r="${r3}" fill="none" stroke="${COLOR}" stroke-width="1.8"/>
      <circle cx="${cx}" cy="${cy}" r="${r4}" fill="none" stroke="${COLOR}" stroke-width="0.5"/>
      <!-- Ring text in band -->
      ${ringText('t3ring', cx, cy, ringR, `★  ${name}  ★  ${city}  ★`, font, 8, '#ffffff', '50%', 1.5)}
      <!-- Top & bottom ornament dots on outer ring -->
      <circle cx="${cx}" cy="${cy - r1 + 4}" r="2" fill="#ffffff"/>
      <circle cx="${cx}" cy="${cy + r1 - 4}" r="2" fill="#ffffff"/>
      ${hasMono
        ? monogram(cx, cy, mono, font, 50, COLOR, COLOR)
        : wrapText(name, cx, cy - 6, font, nameFontSize, COLOR, 1)
      }
      ${!hasMono ? `<text x="${cx}" y="${cy + 18}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">${city}</text>` : ''}
      ${divider(cx, cy + (hasMono ? 34 : 32), COLOR, 26)}
      <text x="${cx}" y="${cy + 46}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}" letter-spacing="5">EST. ${estYear}</text>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'luxury-ring', label: 'Luxury Triple Ring', tags: ['luxury', 'premium', 'ornate'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T4: Bold Rectangle Corporate — filled header/footer bands, corner diamonds
  // ────────────────────────────────────────────────────────────────
  {
    const rw = 134, rh = 90;
    const x1 = cx - rw, y1 = cy - rh;
    const nameFontSize = autoFontSize(name, 11, 22);
    const headerH = 32, footerH = 28;

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <!-- Outer border -->
      <rect x="${x1}" y="${y1}" width="${rw * 2}" height="${rh * 2}" rx="3" fill="none" stroke="${COLOR}" stroke-width="3.2"/>
      <rect x="${x1 + 5}" y="${y1 + 5}" width="${rw * 2 - 10}" height="${rh * 2 - 10}" rx="1" fill="none" stroke="${COLOR}" stroke-width="0.6"/>
      <!-- Filled header band -->
      <rect x="${x1 + 5}" y="${y1 + 5}" width="${rw * 2 - 10}" height="${headerH}" rx="1" fill="${COLOR}"/>
      <!-- Filled footer band -->
      <rect x="${x1 + 5}" y="${y1 + rh * 2 - 5 - footerH}" width="${rw * 2 - 10}" height="${footerH}" rx="1" fill="${COLOR}"/>
      <!-- Corner ornament diamonds -->
      ${cornerOrnament(x1 + 2, y1 + rh, 5, COLOR)}
      ${cornerOrnament(x1 + rw * 2 - 2, y1 + rh, 5, COLOR)}
      <!-- Header text (white) -->
      <text x="${cx}" y="${y1 + 5 + headerH / 2 + 1}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="9" fill="#ffffff" letter-spacing="4">${city}</text>
      <!-- Footer text (white) -->
      <text x="${cx}" y="${y1 + rh * 2 - 5 - footerH / 2 + 1}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="8.5" fill="#ffffff" letter-spacing="3">OFFICIAL STAMP</text>
      <!-- Center content -->
      ${wrapText(name, cx, cy, font, nameFontSize, COLOR, 2)}
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'bold-rectangle', label: 'Bold Corporate Rectangle', tags: ['bold', 'rectangle', 'corporate'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T5: Vintage Seal — dot-ring texture, filled outer band, rope-style pattern
  // ────────────────────────────────────────────────────────────────
  {
    const outerR = R;
    const bandR = R - 12;
    const innerR = R - 22;
    const ringR = R - 6;
    const nameFontSize = autoFontSize(name, 10, 18);
    // Vintage dot ring on outer band
    const dotCount = 32;
    const dots = Array.from({ length: dotCount }, (_, i) => {
      const a = (i / dotCount) * Math.PI * 2;
      const dr = (outerR + bandR) / 2;
      return `<circle cx="${cx + dr * Math.cos(a)}" cy="${cy + dr * Math.sin(a)}" r="1.2" fill="#ffffff"/>`;
    }).join('');

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <!-- Filled vintage outer band -->
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${COLOR}"/>
      <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
      <!-- Dot ring on band -->
      ${dots}
      <!-- Inner dashed ring for vintage feel -->
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${COLOR}" stroke-width="0.8" stroke-dasharray="4,3"/>
      <!-- Ring text in band -->
      ${ringText('t5ring', cx, cy, ringR, `⬥  ${name}  ⬥  ${city}  ⬥`, font, 8.2, '#ffffff', '50%', 1.6)}
      ${hasMono
        ? monogram(cx, cy - 6, mono, font, 42, COLOR)
        : wrapText(name, cx, cy - 6, font, nameFontSize, COLOR, 1.5)
      }
      ${divider(cx, cy + (hasMono ? 18 : 14), COLOR, 28)}
      <text x="${cx}" y="${cy + (hasMono ? 30 : 26)}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="4">SINCE ${estYear}</text>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'vintage-ornate', label: 'Vintage Seal', tags: ['vintage', 'ornate', 'classic'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T6: Bilingual Official — Arabic + English
  // ────────────────────────────────────────────────────────────────
  if (isBilingual) {
    const outerR = R;
    const bandR = R - 12;
    const innerR = R - 16;
    const displayArabic = arabicName || name;
    const displayArabicCity = arabicCity || city;
    const enFontSize = autoFontSize(name, 9.5, 22);
    const arFontSize = autoFontSize(displayArabic, 13, 16);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${COLOR}"/>
      <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${COLOR}" stroke-width="0.9"/>
      <!-- Center divider with ornament -->
      ${hRule(cx - 70, cx + 70, cy + 2, COLOR, 1.2)}
      <text x="${cx}" y="${cy + 7}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}">✦</text>
      <!-- Arabic UPPER -->
      <text x="${cx}" y="${cy - 32}" text-anchor="middle" dominant-baseline="middle"
        font-family="${arabicFont}" font-size="${arFontSize}" font-weight="bold" fill="${COLOR}"
        direction="rtl" unicode-bidi="bidi-override">${displayArabic}</text>
      <text x="${cx}" y="${cy - 14}" text-anchor="middle" dominant-baseline="middle"
        font-family="${arabicFont}" font-size="8.5" fill="${COLOR}"
        direction="rtl">${displayArabicCity}</text>
      <!-- English LOWER -->
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
  // T7: Geometric Modern — filled outer ring band, bold ring text inside band, center text safe
  // ────────────────────────────────────────────────────────────────
  {
    const outerR = R - 4;
    const bandR = outerR - 16; // inner edge of filled ring
    const ringTextR = outerR - 8; // text sits inside the filled band
    const nameFontSize = autoFontSize(name, 10.5, 20);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="t7bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${COLOR}" stop-opacity="0.04"/>
          <stop offset="100%" stop-color="${COLOR}" stop-opacity="0.10"/>
        </radialGradient>
      </defs>
      <!-- Filled outer ring band -->
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${COLOR}"/>
      <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
      <!-- Inner accent ring -->
      <circle cx="${cx}" cy="${cy}" r="${bandR - 5}" fill="url(#t7bg)" stroke="${COLOR}" stroke-width="0.6"/>
      <!-- Ring text inside filled band (white, readable) -->
      ${ringText('t7ring', cx, cy, ringTextR, `◆  ${name}  ◆  ${city}  ◆`, font, 7.5, '#ffffff', '50%', 1.4)}
      <!-- Center: monogram or inner rectangle frame + text -->
      ${hasMono
        ? `<rect x="${cx - 36}" y="${cy - 36}" width="72" height="72" fill="none" stroke="${COLOR}" stroke-width="1.4" transform="rotate(45, ${cx}, ${cy})"/>
           ${monogram(cx, cy - 2, mono, font, 26, COLOR)}`
        : `<rect x="${cx - 52}" y="${cy - 26}" width="104" height="52" rx="2" fill="none" stroke="${COLOR}" stroke-width="1.2"/>
           <rect x="${cx - 47}" y="${cy - 21}" width="94" height="42" rx="1" fill="none" stroke="${COLOR}" stroke-width="0.4"/>
           ${wrapText(name, cx, cy, font, nameFontSize, COLOR, 1.8)}`
      }
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'geometric-modern', label: 'Geometric Modern', tags: ['geometric', 'modern', 'architectural'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T8: Square Premium — filled header band, double border, corner ornaments
  // ────────────────────────────────────────────────────────────────
  {
    const s = 106;
    const x1 = cx - s, y1 = cy - s;
    const nameFontSize = autoFontSize(name, 10.5, 20);
    const hdrH = 28, ftrH = 22;

    // Safe content zone: between header bottom and footer top
    const contentTop = y1 + 6 + hdrH + 6;
    const contentBot = y1 + s * 2 - 6 - ftrH - 6;
    const contentH = contentBot - contentTop;
    const contentCy = contentTop + contentH / 2;
    // Clamp name/city within safe zone
    const monoSize = Math.min(36, Math.floor(contentH * 0.35));
    const monoY = contentTop + monoSize + 2;
    const nameY = hasMono ? monoY + monoSize * 0.8 + 4 : contentCy - 8;
    const cityFontSize = 7.5;
    const cityY = Math.min(nameY + (name.length > 22 ? 26 : 18), contentBot - cityFontSize - 2);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${x1}" y="${y1}" width="${s * 2}" height="${s * 2}" rx="3" fill="none" stroke="${COLOR}" stroke-width="2.8"/>
      <rect x="${x1 + 6}" y="${y1 + 6}" width="${s * 2 - 12}" height="${s * 2 - 12}" rx="1" fill="none" stroke="${COLOR}" stroke-width="0.8"/>
      <!-- Filled header -->
      <rect x="${x1 + 6}" y="${y1 + 6}" width="${s * 2 - 12}" height="${hdrH}" rx="1" fill="${COLOR}"/>
      <text x="${cx}" y="${y1 + 6 + hdrH / 2 + 1}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="8" fill="#ffffff" letter-spacing="3">OFFICIAL STAMP</text>
      <!-- Corner dots -->
      <circle cx="${x1 + 6}" cy="${y1 + 6}" r="2" fill="${COLOR}"/>
      <circle cx="${x1 + s * 2 - 6}" cy="${y1 + 6}" r="2" fill="${COLOR}"/>
      <circle cx="${x1 + 6}" cy="${y1 + s * 2 - 6}" r="2" fill="${COLOR}"/>
      <circle cx="${x1 + s * 2 - 6}" cy="${y1 + s * 2 - 6}" r="2" fill="${COLOR}"/>
      <!-- Filled footer -->
      <rect x="${x1 + 6}" y="${y1 + s * 2 - 6 - ftrH}" width="${s * 2 - 12}" height="${ftrH}" rx="1" fill="${COLOR}"/>
      <text x="${cx}" y="${y1 + s * 2 - 6 - ftrH / 2 + 1}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="7" fill="#ffffff" letter-spacing="2">${city}</text>
      <!-- Center content (clipped inside safe zone) -->
      ${hasMono ? monogram(cx, monoY, mono, font, monoSize, COLOR) : ''}
      ${wrapText(name, cx, nameY, font, nameFontSize, COLOR, 1.5)}
      <text x="${cx}" y="${cityY}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="${cityFontSize}" fill="${COLOR}" letter-spacing="2.5">${city}</text>
      ${regNo && project.density >= 3 && cityY + 14 < contentBot ? `<text x="${cx}" y="${cityY + 14}" text-anchor="middle" font-family="${font}" font-size="6" fill="${COLOR}">${regNo}</text>` : ''}
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'square-premium', label: 'Square Premium', tags: ['square', 'corporate', 'premium'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T9: Arabic Calligraphy / Official Seal
  // ────────────────────────────────────────────────────────────────
  if (isBilingual && arabicName) {
    const outerR = R;
    const bandR = R - 12;
    const r2 = R - 16;
    const arFontSize = autoFontSize(arabicName, 16, 14);
    const displayArabicCity = arabicCity || city;

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${COLOR}"/>
      <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
      <circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="${COLOR}" stroke-width="1.2"/>
      <text x="${cx}" y="${cy - r2 + 6}" text-anchor="middle" font-family="${font}" font-size="8" fill="${COLOR}">✦</text>
      <text x="${cx}" y="${cy + r2 - 1}" text-anchor="middle" font-family="${font}" font-size="8" fill="${COLOR}">✦</text>
      <text x="${cx}" y="${cy - 14}" text-anchor="middle" dominant-baseline="middle"
        font-family="${arabicFont}" font-size="${arFontSize}" font-weight="bold" fill="${COLOR}"
        direction="rtl" unicode-bidi="bidi-override">${arabicName}</text>
      <text x="${cx}" y="${cy + 8}" text-anchor="middle" dominant-baseline="middle"
        font-family="${arabicFont}" font-size="10" fill="${COLOR}" direction="rtl">${displayArabicCity}</text>
      ${divider(cx, cy + 22, COLOR, 28)}
      <text x="${cx}" y="${cy + 36}" text-anchor="middle" dominant-baseline="middle"
        font-family="${font}" font-size="8" fill="${COLOR}" letter-spacing="1.5">${name}</text>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'arabic-calligraphy', label: 'Arabic Calligraphy', tags: ['arabic', 'calligraphy', 'RTL', 'premium'], svgSource: svg });
  } else {
    // Official Seal for EN-only with star ornaments
    const outerR = R;
    const bandR = R - 12;
    const r3 = R - 20;
    const ringR = R - 6;
    const nameFontSize = autoFontSize(name, 9.5, 20);
    const dotCount = 24;
    const dots = Array.from({ length: dotCount }, (_, i) => {
      const a = (i / dotCount) * Math.PI * 2;
      const dr = (outerR + bandR) / 2;
      return `<circle cx="${cx + dr * Math.cos(a)}" cy="${cy + dr * Math.sin(a)}" r="1.4" fill="#ffffff"/>`;
    }).join('');

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${COLOR}"/>
      <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
      ${dots}
      <circle cx="${cx}" cy="${cy}" r="${r3}" fill="none" stroke="${COLOR}" stroke-width="0.6" stroke-dasharray="2,2"/>
      ${ringText('t9ring', cx, cy, ringR, `●  ${name}  ●  ${city}  ●`, font, 8, '#ffffff', '50%', 1.6)}
      ${hasMono ? monogram(cx, cy - 4, mono, font, 44, COLOR) : wrapText(name, cx, cy - 8, font, nameFontSize, COLOR, 1.5)}
      ${!hasMono ? `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">${city}</text>` : ''}
      ${divider(cx, cy + (hasMono ? 22 : 28), COLOR, 22)}
      <text x="${cx}" y="${cy + (hasMono ? 34 : 40)}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}" letter-spacing="4">OFFICIAL SEAL</text>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'official-seal', label: 'Official Seal', tags: ['seal', 'official', 'premium', 'concentric'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T10: Embossed Medallion — NEW premium wax-seal style
  // Sunburst center, layered rings, monogram focal point
  // ────────────────────────────────────────────────────────────────
  {
    const outerR = R;
    const bandR = R - 14;
    const ringR = R - 7;
    const innerCircR = 36;
    const nameFontSize = autoFontSize(name, 9, 18);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="t10center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${COLOR}" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="${COLOR}" stop-opacity="0.04"/>
        </radialGradient>
      </defs>
      <!-- Filled outer medallion band -->
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${COLOR}"/>
      <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
      <!-- Sunburst/star behind center -->
      ${starBurst(cx, cy, bandR - 8, bandR - 22, COLOR, 16)}
      <!-- White overlay to soften starburst -->
      <circle cx="${cx}" cy="${cy}" r="${bandR - 12}" fill="url(#t10center)"/>
      <!-- Accent inner ring -->
      <circle cx="${cx}" cy="${cy}" r="${bandR - 8}" fill="none" stroke="${COLOR}" stroke-width="1.4"/>
      <!-- Center monogram circle -->
      <circle cx="${cx}" cy="${cy}" r="${innerCircR}" fill="${COLOR}"/>
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-size="22" font-weight="bold" fill="#ffffff">${mono}</text>
      <!-- Ring text -->
      ${ringText('t10ring', cx, cy, ringR, `✦  ${name}  ✦`, font, 8.5, '#ffffff', '25%', 1.8)}
      ${bottomArcText('t10bot', cx, cy, ringR, `✦  ${city}  ✦`, font, 8, '#ffffff', 2)}
      <!-- Company name arc below monogram -->
      ${wrapText(name, cx, cy + innerCircR + 16, font, nameFontSize, COLOR, 1.5)}
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${cy + innerCircR + 36}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'embossed-medallion', label: 'Embossed Medallion', tags: ['medallion', 'wax-seal', 'luxury', 'premium', 'embossed'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T11: Art Deco Square — NEW
  // Geometric ornamental corners, double border, deco interior lines
  // ────────────────────────────────────────────────────────────────
  {
    const sw = 130, sh = 96;
    const x1 = cx - sw, y1 = cy - sh;
    const nameFontSize = autoFontSize(name, 11, 22);
    const cornerSize = 12;

    // Art deco corner paths (L-shaped bracket ornament)
    function decoCorner(ox: number, oy: number, sx: number, sy: number) {
      return `
        <line x1="${ox}" y1="${oy}" x2="${ox + sx * 18}" y2="${oy}" stroke="${COLOR}" stroke-width="2.5"/>
        <line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy + sy * 18}" stroke="${COLOR}" stroke-width="2.5"/>
        <line x1="${ox + sx * 6}" y1="${oy + sy * 6}" x2="${ox + sx * 16}" y2="${oy + sy * 6}" stroke="${COLOR}" stroke-width="0.8"/>
        <line x1="${ox + sx * 6}" y1="${oy + sy * 6}" x2="${ox + sx * 6}" y2="${oy + sy * 16}" stroke="${COLOR}" stroke-width="0.8"/>
        <circle cx="${ox + sx * 6}" cy="${oy + sy * 6}" r="1.5" fill="${COLOR}"/>`;
    }

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <!-- Art Deco corner brackets -->
      ${decoCorner(x1, y1, 1, 1)}
      ${decoCorner(x1 + sw * 2, y1, -1, 1)}
      ${decoCorner(x1, y1 + sh * 2, 1, -1)}
      ${decoCorner(x1 + sw * 2, y1 + sh * 2, -1, -1)}
      <!-- Inner double border -->
      <rect x="${x1 + 20}" y="${y1 + 20}" width="${sw * 2 - 40}" height="${sh * 2 - 40}" fill="none" stroke="${COLOR}" stroke-width="1.6"/>
      <rect x="${x1 + 24}" y="${y1 + 24}" width="${sw * 2 - 48}" height="${sh * 2 - 48}" fill="none" stroke="${COLOR}" stroke-width="0.5"/>
      <!-- Deco header line with dot ornaments -->
      <line x1="${x1 + 30}" y1="${y1 + 46}" x2="${cx - 10}" y2="${y1 + 46}" stroke="${COLOR}" stroke-width="0.8"/>
      <circle cx="${cx}" cy="${y1 + 46}" r="2.5" fill="${COLOR}"/>
      <line x1="${cx + 10}" y1="${y1 + 46}" x2="${x1 + sw * 2 - 30}" y2="${y1 + 46}" stroke="${COLOR}" stroke-width="0.8"/>
      <!-- City header -->
      <text x="${cx}" y="${y1 + 36}" text-anchor="middle" font-family="${font}" font-size="8" fill="${COLOR}" letter-spacing="5">${city}</text>
      <!-- Company name -->
      ${wrapText(name, cx, cy, font, nameFontSize, COLOR, 2)}
      <!-- Footer line -->
      <line x1="${x1 + 30}" y1="${y1 + sh * 2 - 46}" x2="${cx - 10}" y2="${y1 + sh * 2 - 46}" stroke="${COLOR}" stroke-width="0.8"/>
      <circle cx="${cx}" cy="${y1 + sh * 2 - 46}" r="2.5" fill="${COLOR}"/>
      <line x1="${cx + 10}" y1="${y1 + sh * 2 - 46}" x2="${x1 + sw * 2 - 30}" y2="${y1 + sh * 2 - 46}" stroke="${COLOR}" stroke-width="0.8"/>
      <!-- Footer text -->
      <text x="${cx}" y="${y1 + sh * 2 - 32}" text-anchor="middle" font-family="${font}" font-size="8" fill="${COLOR}" letter-spacing="4">OFFICIAL STAMP</text>
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${y1 + sh * 2 - 20}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${COLOR}">${regNo}</text>` : ''}
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'art-deco-square', label: 'Art Deco Square', tags: ['art-deco', 'luxury', 'geometric', 'rectangle'], svgSource: svg });
  }

  return concepts;
}
