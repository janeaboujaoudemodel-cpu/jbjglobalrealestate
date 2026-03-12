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
  typography_style: 'SERIF' | 'SANS' | 'MONOSPACE' | 'CALLIGRAPHY' | 'GOTHIC' | 'ARABIC_MODERN';
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
  // Truncate very long text to prevent overflow
  const maxLen = 48;
  const displayText = text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
  
  // Single line: ≤24 chars
  if (displayText.length <= 24) {
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="${size}" font-weight="bold" fill="${color}" letter-spacing="${letterSpacing}">${displayText}</text>`;
  }
  // Two lines: find best split near middle at a word boundary
  const mid = Math.floor(displayText.length / 2);
  let split = displayText.lastIndexOf(' ', mid);
  if (split < 2) split = displayText.indexOf(' ', mid);
  if (split < 0) split = mid;
  const line1 = displayText.slice(0, split).trim();
  const line2 = displayText.slice(split).trim();
  const lineH = size * 1.3;
  // tspans straddle y: top at y - lineH/2, bottom at y + lineH/2
  return `<text text-anchor="middle" font-family="${font}" font-weight="bold" fill="${color}" letter-spacing="${letterSpacing}">
    <tspan x="${x}" dy="0" y="${y - lineH / 2}" font-size="${size}">${line1}</tspan>
    <tspan x="${x}" dy="${lineH}" font-size="${size}">${line2}</tspan>
  </text>`;
}

function ringText(id: string, cx: number, cy: number, r: number, text: string, font: string, fontSize: number, color: string, startOffset = '50%', letterSpacing = 1.8) {
  // Truncate ring text to prevent arc overflow
  const maxArcChars = Math.floor((r * Math.PI) / (fontSize * 0.65));
  const displayText = text.length > maxArcChars ? text.slice(0, maxArcChars - 1) + '…' : text;
  // Top-arc path: starts from left (cx-r, cy), arcs over the top to right (cx+r, cy) — large-arc=1, sweep=1
  return `
    <defs>
      <path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}"/>
    </defs>
    <text font-family="${font}" font-size="${fontSize}" fill="${color}" letter-spacing="${letterSpacing}">
      <textPath href="#${id}" startOffset="50%" text-anchor="middle">${displayText}</textPath>
    </text>`;
}

function bottomArcText(id: string, cx: number, cy: number, r: number, text: string, font: string, fontSize: number, color: string, letterSpacing = 2) {
  // Truncate bottom arc text to prevent overflow
  const maxArcChars = Math.floor((r * Math.PI) / (fontSize * 0.65));
  const displayText = text.length > maxArcChars ? text.slice(0, maxArcChars - 1) + '…' : text;
  return `
    <defs>
      <path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}"/>
    </defs>
    <text font-family="${font}" font-size="${fontSize}" fill="${color}" letter-spacing="${letterSpacing}">
      <textPath href="#${id}" startOffset="50%" text-anchor="middle">${displayText}</textPath>
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
  const PRIMARY = '#1a2744';    // outer borders, filled bands
  const SECONDARY = '#2a3a5c';  // inner rings, decorative accents
  const ACCENT = '#8b6914';     // monogram disc, center art, dividers
  const COLOR = PRIMARY;        // backward compat alias
  const W = 320, H = 320;
  const cx = W / 2, cy = H / 2;
  const R = 116;
  const font = fontMap[project.typography_style];

  const name = project.company_name.toUpperCase().trim();
  const arabicName = (project.arabic_company_name || '').trim();
  const cityParts = [project.city_optional, project.country_optional].filter(Boolean);
  const city = (cityParts.join(', ') || 'UAE').toUpperCase();
  const arabicCity = (project.arabic_city || '').trim();
  const regNo = project.registration_number_optional ? project.registration_number_optional : '';
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
          <stop offset="0%" stop-color="${PRIMARY}" stop-opacity="0.04"/>
          <stop offset="100%" stop-color="${PRIMARY}" stop-opacity="0.10"/>
        </radialGradient>
      </defs>
      <!-- Filled outer ring band -->
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${PRIMARY}"/>
      <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
      <!-- Inner accent ring -->
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${SECONDARY}" stroke-width="1.2"/>
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
        ? `${monogram(cx, cy - 8, mono, font, 42, ACCENT, ACCENT)}
           ${divider(cx, cy + 28, ACCENT, 26)}
           <text x="${cx}" y="${cy + 42}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${SECONDARY}" letter-spacing="3.5">OFFICIAL STAMP</text>`
        : `${wrapText(name, cx, cy - 8, font, nameFontSize, PRIMARY, 1.5)}
           ${divider(cx, cy + 18, ACCENT, 28)}
           <text x="${cx}" y="${cy + 30}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${SECONDARY}" letter-spacing="3.5">OFFICIAL STAMP</text>
           ${regNo && project.density >= 3 ? `<text x="${cx}" y="${cy + 44}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${SECONDARY}">${regNo}</text>` : ''}`
      }
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'classic-double', label: 'Classic Official', tags: ['classic', 'round', 'professional', 'official'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T2: Modern Minimal — clean circle, safe-zone enforced text layout
  // ────────────────────────────────────────────────────────────────
  {
    const r = R - 8;
    // safeR: text must stay strictly within this radius from centre
    const safeR = r - 14;

    // chordHalf: half-width of a horizontal line at absolute y that stays inside circle r
    const chordHalf = (ry: number, y: number) =>
      Math.max(0, Math.sqrt(Math.max(0, ry * ry - (y - cy) ** 2)) - 6);

    // --- Font sizing: reduce more aggressively for very long names ---
    const nameFontSize = name.length <= 20 ? 11
      : name.length <= 28 ? 9.5
      : name.length <= 36 ? 8
      : 7;

    const cityFontSize = 7.5;
    const isLong = name.length > 24; // two-line wrap
    // lineH as computed by wrapText
    const lineH = nameFontSize * 1.3;

    // Place name block centred. For two-line, nameY is the centre of both tspans.
    // Bottom of text block = nameY + lineH/2 (two-line) or nameY + nameFontSize/2 (one-line)
    // Top of text block = nameY - lineH/2 (two-line) or nameY - nameFontSize/2 (one-line)
    // We want the centre roughly at cy - 8 but clamped so nothing exits safeR.
    const textHalfH = isLong ? lineH / 2 : nameFontSize / 2;
    const idealNameY = cy - 8;
    const maxNameY = cy + safeR - textHalfH - 10;
    const minNameY = cy - safeR + textHalfH + 10;
    const nameY = Math.min(maxNameY, Math.max(minNameY, idealNameY));

    const textBottom = nameY + textHalfH;
    const cityY = Math.min(textBottom + cityFontSize + 7, cy + safeR - cityFontSize - 4);
    const regY = Math.min(cityY + cityFontSize + 6, cy + safeR - 4);

    // Horizontal rules: sit 12px above the top of the text block, clamp to chord
    const ruleTopY = nameY - textHalfH - 13;
    const ruleTopY2 = ruleTopY + 3;
    const ruleClampR = r - 3;
    const rulePad = chordHalf(ruleClampR, ruleTopY);
    const rulePad2 = Math.max(0, chordHalf(ruleClampR, ruleTopY2) - 8);

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="t2bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${PRIMARY}" stop-opacity="0.03"/>
          <stop offset="100%" stop-color="${PRIMARY}" stop-opacity="0.08"/>
        </radialGradient>
        <clipPath id="t2clip"><circle cx="${cx}" cy="${cy}" r="${safeR}"/></clipPath>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#t2bg)" stroke="${PRIMARY}" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 6}" fill="none" stroke="${SECONDARY}" stroke-width="0.5" stroke-dasharray="2,3"/>
      <g clip-path="url(#t2clip)">
        ${rulePad > 4 ? hRule(cx - rulePad, cx + rulePad, ruleTopY, SECONDARY, 1.2) : ''}
        ${rulePad2 > 4 ? hRule(cx - rulePad2, cx + rulePad2, ruleTopY2, SECONDARY, 0.4) : ''}
        ${hasMono ? monogram(cx, cy - safeR * 0.5, mono, font, 26, ACCENT) : ''}
        ${wrapText(name, cx, nameY, font, nameFontSize, PRIMARY, 2)}
        <text x="${cx}" y="${cityY}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="${cityFontSize}" fill="${SECONDARY}" letter-spacing="3.5">${city}</text>
        ${regNo && project.density >= 3 && regY < cy + safeR - 2 ? `<text x="${cx}" y="${regY}" text-anchor="middle" font-family="${font}" font-size="6" fill="${SECONDARY}">${regNo}</text>` : ''}
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
      <circle cx="${cx}" cy="${cy}" r="${r1}" fill="${PRIMARY}"/>
      <circle cx="${cx}" cy="${cy}" r="${r2}" fill="#ffffff"/>
      <!-- Accent rings -->
      <circle cx="${cx}" cy="${cy}" r="${r3}" fill="none" stroke="${SECONDARY}" stroke-width="1.8"/>
      <circle cx="${cx}" cy="${cy}" r="${r4}" fill="none" stroke="${SECONDARY}" stroke-width="0.5"/>
      <!-- Ring text in band -->
      ${ringText('t3ring', cx, cy, ringR, `★  ${name}  ★  ${city}  ★`, font, 8, '#ffffff', '50%', 1.5)}
      <!-- Top & bottom ornament dots on outer ring -->
      <circle cx="${cx}" cy="${cy - r1 + 4}" r="2" fill="#ffffff"/>
      <circle cx="${cx}" cy="${cy + r1 - 4}" r="2" fill="#ffffff"/>
      ${hasMono
        ? monogram(cx, cy, mono, font, 50, ACCENT, ACCENT)
        : wrapText(name, cx, cy - 6, font, nameFontSize, PRIMARY, 1)
      }
      ${!hasMono ? `<text x="${cx}" y="${cy + 18}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${SECONDARY}" letter-spacing="3">${city}</text>` : ''}
      ${divider(cx, cy + (hasMono ? 34 : 32), ACCENT, 26)}
      <text x="${cx}" y="${cy + 46}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${SECONDARY}" letter-spacing="5">EST. ${estYear}</text>
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
      <rect x="${x1}" y="${y1}" width="${rw * 2}" height="${rh * 2}" rx="3" fill="none" stroke="${PRIMARY}" stroke-width="3.2"/>
      <rect x="${x1 + 5}" y="${y1 + 5}" width="${rw * 2 - 10}" height="${rh * 2 - 10}" rx="1" fill="none" stroke="${SECONDARY}" stroke-width="0.6"/>
      <!-- Filled header band -->
      <rect x="${x1 + 5}" y="${y1 + 5}" width="${rw * 2 - 10}" height="${headerH}" rx="1" fill="${PRIMARY}"/>
      <!-- Filled footer band -->
      <rect x="${x1 + 5}" y="${y1 + rh * 2 - 5 - footerH}" width="${rw * 2 - 10}" height="${footerH}" rx="1" fill="${ACCENT}"/>
      <!-- Corner ornament diamonds -->
      ${cornerOrnament(x1 + 2, y1 + rh, 5, ACCENT)}
      ${cornerOrnament(x1 + rw * 2 - 2, y1 + rh, 5, ACCENT)}
      <!-- Header text (white) -->
      <text x="${cx}" y="${y1 + 5 + headerH / 2 + 1}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="9" fill="#ffffff" letter-spacing="4">${city}</text>
      <!-- Footer text (white) -->
      <text x="${cx}" y="${y1 + rh * 2 - 5 - footerH / 2 + 1}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="8.5" fill="#ffffff" letter-spacing="3">OFFICIAL STAMP</text>
      <!-- Center content -->
      ${wrapText(name, cx, cy, font, nameFontSize, PRIMARY, 2)}
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${cy + 22}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${SECONDARY}">${regNo}</text>` : ''}
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
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${PRIMARY}"/>
      <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
      <!-- Dot ring on band -->
      ${dots}
      <!-- Inner dashed ring for vintage feel -->
      <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${SECONDARY}" stroke-width="0.8" stroke-dasharray="4,3"/>
      <!-- Ring text in band -->
      ${ringText('t5ring', cx, cy, ringR, `⬥  ${name}  ⬥  ${city}  ⬥`, font, 8.2, '#ffffff', '50%', 1.6)}
      ${hasMono
        ? monogram(cx, cy - 6, mono, font, 42, ACCENT)
        : wrapText(name, cx, cy - 6, font, nameFontSize, PRIMARY, 1.5)
      }
      ${divider(cx, cy + (hasMono ? 18 : 14), ACCENT, 28)}
      <text x="${cx}" y="${cy + (hasMono ? 30 : 26)}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${SECONDARY}" letter-spacing="4">SINCE ${estYear}</text>
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'vintage-ornate', label: 'Vintage Seal', tags: ['vintage', 'ornate', 'classic'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T6: Bilingual Official — English top arc, Arabic bottom arc (matching T12 pattern)
  // Generates TWO variants: with and without license number
  // ────────────────────────────────────────────────────────────────
  if (isBilingual) {
    const outerR = R;
    const bandR = R - 12;
    const innerR = R - 16;
    const arcR = R - 17; // safe zone for text arcs
    const displayArabic = arabicName || name;
    const displayArabicCity = arabicCity || city;
    const enFontSize = autoFontSize(name, 10, 24);
    const arFontSize = autoFontSize(displayArabic, 11, 18);

    // Generate bilingual with arc text (with regNo)
    function buildT6Svg(showRegNo: boolean) {
      const regLine = showRegNo && regNo
        ? `<text x="${cx}" y="${cy + 50}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${SECONDARY}">${regNo}</text>`
        : '';
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="t6top${showRegNo ? 'r' : ''}" d="M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 1 1 ${cx + arcR} ${cy}"/>
          <path id="t6bot${showRegNo ? 'r' : ''}" d="M ${cx + arcR} ${cy} A ${arcR} ${arcR} 0 0 0 ${cx - arcR} ${cy}"/>
        </defs>
        <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${PRIMARY}"/>
        <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
        <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${SECONDARY}" stroke-width="0.9"/>
        <!-- English top arc -->
        <text font-family="${font}" font-size="${enFontSize}" fill="${PRIMARY}" letter-spacing="2" font-weight="700">
          <textPath href="#t6top${showRegNo ? 'r' : ''}" startOffset="50%" text-anchor="middle">${name}</textPath>
        </text>
        <!-- Arabic bottom arc -->
        <text font-family="${arabicFont}" font-size="${arFontSize}" fill="${PRIMARY}" letter-spacing="1.5" font-weight="600">
          <textPath href="#t6bot${showRegNo ? 'r' : ''}" startOffset="50%" text-anchor="middle">${displayArabic}</textPath>
        </text>
        <!-- Center divider with ornament -->
        ${divider(cx, cy - 2, ACCENT, 26)}
        ${hasMono ? monogram(cx, cy + 14, mono, font, 22, ACCENT, ACCENT) : ''}
        <text x="${cx}" y="${cy + (hasMono ? 38 : 16)}" text-anchor="middle" font-family="${font}" font-size="7" fill="${SECONDARY}" letter-spacing="3">${city}</text>
        ${regLine}
      </svg>`;
    }

    concepts.push({ id: uid(), templateKey: 'bilingual-official', label: 'Bilingual Official', tags: ['bilingual', 'arabic', 'official', 'UAE'], svgSource: buildT6Svg(true) });
    if (regNo) {
      concepts.push({ id: uid(), templateKey: 'bilingual-official-no-reg', label: 'Bilingual Official (No License)', tags: ['bilingual', 'arabic', 'official', 'UAE', 'no-license'], svgSource: buildT6Svg(false) });
    }
  }

  // ────────────────────────────────────────────────────────────────
  // T7: Geometric Modern — filled outer ring band, safe center text
  // ────────────────────────────────────────────────────────────────
  {
    const outerR = R - 4;
    const bandR = outerR - 16; // inner edge of filled ring
    const ringTextR = outerR - 8; // text sits inside the filled band

    // Center safe zone: text must stay strictly inside bandR - 8
    const innerSafeR = bandR - 8;

    // Font size: aggressively scale for long names that must fit in a rectangle inside a circle
    // Max text width available = 2 * innerSafeR * 0.9 (rectangle inscribed)
    const maxW = innerSafeR * 1.8;
    // Approximate: chars * fontSize * 0.6 <= maxW → fontSize = maxW / (chars * 0.6)
    const rawFontSize = name.length > 0 ? Math.min(10.5, maxW / (name.length * 0.6)) : 10.5;
    const nameFontSize = Math.max(6.5, rawFontSize);

    // Ring text: limit length to prevent arc overflow
    const ringName = name.length > 30 ? name.slice(0, 28) + '…' : name;
    const ringCity = city.length > 20 ? city.slice(0, 18) + '…' : city;

    // Center rectangle dimensions: width dynamically fits inside circle
    // For two-line text: height = nameFontSize * 1.3 * 2 + 12
    const isLong = name.length > 24;
    const rectW = Math.min(88, Math.floor(innerSafeR * 1.8));
    const rectH = isLong ? Math.min(52, Math.floor(nameFontSize * 1.3 * 2 + 16)) : Math.min(40, Math.floor(nameFontSize + 16));
    const halfW = rectW / 2;
    const halfH = rectH / 2;

    // Diamond safe zone for monogram
    const maxDiamondHalf = Math.floor((bandR - 10) / Math.SQRT2);
    const diamondHalf = Math.min(32, maxDiamondHalf);

    // nameY at centre of the rectangle
    const nameY = cy;

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="t7bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${PRIMARY}" stop-opacity="0.04"/>
          <stop offset="100%" stop-color="${PRIMARY}" stop-opacity="0.10"/>
        </radialGradient>
        <clipPath id="t7clip">
          <rect x="${cx - halfW + 2}" y="${cy - halfH + 2}" width="${rectW - 4}" height="${rectH - 4}"/>
        </clipPath>
      </defs>
      <!-- Filled outer ring band -->
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${PRIMARY}"/>
      <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
      <!-- Inner accent ring -->
      <circle cx="${cx}" cy="${cy}" r="${bandR - 5}" fill="url(#t7bg)" stroke="${SECONDARY}" stroke-width="0.6"/>
      <!-- Ring text: name on top arc, city on bottom arc -->
      ${ringText('t7top', cx, cy, ringTextR, `◆  ${ringName}  ◆`, font, 7.5, '#ffffff', '50%', 1.4)}
      ${bottomArcText('t7bot', cx, cy, ringTextR, `◆  ${ringCity}  ◆`, font, 7.5, '#ffffff', 1.4)}
      <!-- Center: monogram or rect frame + text clipped to safe area -->
      ${hasMono
        ? `<rect x="${cx - diamondHalf}" y="${cy - diamondHalf}" width="${diamondHalf * 2}" height="${diamondHalf * 2}" fill="none" stroke="${ACCENT}" stroke-width="1.4" transform="rotate(45, ${cx}, ${cy})"/>
           ${monogram(cx, cy - 2, mono, font, Math.min(26, diamondHalf - 6), ACCENT)}`
        : `<rect x="${cx - halfW}" y="${cy - halfH}" width="${rectW}" height="${rectH}" rx="2" fill="none" stroke="${SECONDARY}" stroke-width="1.2"/>
           <rect x="${cx - halfW + 4}" y="${cy - halfH + 4}" width="${rectW - 8}" height="${rectH - 8}" rx="1" fill="none" stroke="${SECONDARY}" stroke-width="0.4"/>
           <g clip-path="url(#t7clip)">
             ${wrapText(name, cx, nameY, font, nameFontSize, PRIMARY, 1.8)}
           </g>`
      }
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'geometric-modern', label: 'Geometric Modern', tags: ['geometric', 'modern', 'architectural'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T8: Square Premium — filled header/footer bands, strict content zone
  // ────────────────────────────────────────────────────────────────
  {
    const s = 106;
    const x1 = cx - s, y1 = cy - s;
    const hdrH = 28, ftrH = 22;
    const borderPad = 6;

    // Safe content zone strictly between header bottom and footer top
    const contentTop = y1 + borderPad + hdrH + 8;
    const contentBot = y1 + s * 2 - borderPad - ftrH - 8;
    const contentH = contentBot - contentTop;
    const contentCy = contentTop + contentH / 2;
    const contentW = s * 2 - borderPad * 2 - 16; // inner usable width

    // Font sizing: fit name width inside contentW
    // wrapText splits at >24 chars so worst-case line ≈ half the name
    const longestLineChars = name.length > 24 ? Math.ceil(name.length / 2) : name.length;
    const rawFs = Math.min(10.5, contentW / (longestLineChars * 0.62));
    const nameFontSize = Math.max(6.5, rawFs);

    const isLong = name.length > 24;
    const lineH = nameFontSize * 1.3;

    // nameY: centre of the name block (tspans straddle this for two-line)
    // Bottom of block = nameY + lineH/2 (two-line) or nameY + nameFontSize/2 (one-line)
    const nameBlockHalfH = isLong ? lineH / 2 : nameFontSize / 2;

    const monoSize = Math.min(28, Math.floor(contentH * 0.28));

    let nameY: number;
    if (hasMono) {
      const monoY = contentTop + monoSize + 2;
      nameY = Math.min(monoY + monoSize * 0.8 + 6, contentBot - nameBlockHalfH - 6);
    } else {
      // Centre the block inside the content zone
      const idealNameY = contentCy;
      nameY = Math.min(idealNameY, contentBot - nameBlockHalfH - 6);
      nameY = Math.max(nameY, contentTop + nameBlockHalfH + 6);
    }

    const clipId = 't8clip';
    const clipX = x1 + borderPad + 4;
    const clipW = s * 2 - borderPad * 2 - 8;

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="${clipId}">
          <rect x="${clipX}" y="${contentTop}" width="${clipW}" height="${contentH}"/>
        </clipPath>
      </defs>
      <rect x="${x1}" y="${y1}" width="${s * 2}" height="${s * 2}" rx="3" fill="none" stroke="${PRIMARY}" stroke-width="2.8"/>
      <rect x="${x1 + borderPad}" y="${y1 + borderPad}" width="${s * 2 - borderPad * 2}" height="${s * 2 - borderPad * 2}" rx="1" fill="none" stroke="${SECONDARY}" stroke-width="0.8"/>
      <!-- Filled header -->
      <rect x="${x1 + borderPad}" y="${y1 + borderPad}" width="${s * 2 - borderPad * 2}" height="${hdrH}" rx="1" fill="${PRIMARY}"/>
      <text x="${cx}" y="${y1 + borderPad + hdrH / 2 + 1}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="8" fill="#ffffff" letter-spacing="3">OFFICIAL STAMP</text>
      <!-- Corner dots -->
      <circle cx="${x1 + borderPad}" cy="${y1 + borderPad}" r="2" fill="${ACCENT}"/>
      <circle cx="${x1 + s * 2 - borderPad}" cy="${y1 + borderPad}" r="2" fill="${ACCENT}"/>
      <circle cx="${x1 + borderPad}" cy="${y1 + s * 2 - borderPad}" r="2" fill="${ACCENT}"/>
      <circle cx="${x1 + s * 2 - borderPad}" cy="${y1 + s * 2 - borderPad}" r="2" fill="${ACCENT}"/>
      <!-- Filled footer with city -->
      <rect x="${x1 + borderPad}" y="${y1 + s * 2 - borderPad - ftrH}" width="${s * 2 - borderPad * 2}" height="${ftrH}" rx="1" fill="${ACCENT}"/>
      <text x="${cx}" y="${y1 + s * 2 - borderPad - ftrH / 2 + 1}" text-anchor="middle" dominant-baseline="middle" font-family="${font}" font-size="7" fill="#ffffff" letter-spacing="2">${city}</text>
      <!-- Center content strictly clipped -->
      <g clip-path="url(#${clipId})">
        ${hasMono ? monogram(cx, contentTop + monoSize + 2, mono, font, monoSize, ACCENT) : ''}
        ${wrapText(name, cx, nameY, font, nameFontSize, PRIMARY, 1.5)}
        ${regNo && project.density >= 3 ? `<text x="${cx}" y="${Math.min(nameY + nameBlockHalfH + 10, contentBot - 4)}" text-anchor="middle" font-family="${font}" font-size="6" fill="${SECONDARY}">${regNo}</text>` : ''}
      </g>
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
    const arcR = R - 17;
    const arFontSize = autoFontSize(arabicName, 12, 16);
    const enFontSize = autoFontSize(name, 9, 22);
    const displayArabicCity = arabicCity || city;

    function buildT9Svg(showRegNo: boolean) {
      const regLine = showRegNo && regNo
        ? `<text x="${cx}" y="${cy + 44}" text-anchor="middle" font-family="${font}" font-size="6" fill="${SECONDARY}">${regNo}</text>`
        : '';
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="t9top${showRegNo ? 'r' : ''}" d="M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 1 1 ${cx + arcR} ${cy}"/>
          <path id="t9bot${showRegNo ? 'r' : ''}" d="M ${cx + arcR} ${cy} A ${arcR} ${arcR} 0 0 0 ${cx - arcR} ${cy}"/>
        </defs>
        <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${PRIMARY}"/>
        <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
        <circle cx="${cx}" cy="${cy}" r="${r2}" fill="none" stroke="${SECONDARY}" stroke-width="1.2"/>
        <text x="${cx}" y="${cy - r2 + 6}" text-anchor="middle" font-family="${font}" font-size="8" fill="${ACCENT}">✦</text>
        <text x="${cx}" y="${cy + r2 - 1}" text-anchor="middle" font-family="${font}" font-size="8" fill="${ACCENT}">✦</text>
        <!-- English top arc -->
        <text font-family="${font}" font-size="${enFontSize}" fill="${PRIMARY}" letter-spacing="1.8" font-weight="700">
          <textPath href="#t9top${showRegNo ? 'r' : ''}" startOffset="50%" text-anchor="middle">${name}</textPath>
        </text>
        <!-- Arabic bottom arc -->
        <text font-family="${arabicFont}" font-size="${arFontSize}" fill="${PRIMARY}" letter-spacing="1.2" font-weight="600">
          <textPath href="#t9bot${showRegNo ? 'r' : ''}" startOffset="50%" text-anchor="middle">${arabicName}</textPath>
        </text>
        ${divider(cx, cy + 2, ACCENT, 28)}
        <text x="${cx}" y="${cy + 18}" text-anchor="middle" dominant-baseline="middle"
          font-family="${font}" font-size="7.5" fill="${SECONDARY}" letter-spacing="2">${city}</text>
        ${regLine}
      </svg>`;
    }

    concepts.push({ id: uid(), templateKey: 'arabic-calligraphy', label: 'Arabic Calligraphy', tags: ['arabic', 'calligraphy', 'RTL', 'premium'], svgSource: buildT9Svg(true) });
    if (regNo) {
      concepts.push({ id: uid(), templateKey: 'arabic-calligraphy-no-reg', label: 'Arabic Calligraphy (No License)', tags: ['arabic', 'calligraphy', 'RTL', 'no-license'], svgSource: buildT9Svg(false) });
    }
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
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${PRIMARY}"/>
      <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
      ${dots}
      <circle cx="${cx}" cy="${cy}" r="${r3}" fill="none" stroke="${SECONDARY}" stroke-width="0.6" stroke-dasharray="2,2"/>
      ${ringText('t9ring', cx, cy, ringR, `●  ${name}  ●  ${city}  ●`, font, 8, '#ffffff', '50%', 1.6)}
      ${hasMono ? monogram(cx, cy - 4, mono, font, 44, ACCENT) : wrapText(name, cx, cy - 8, font, nameFontSize, PRIMARY, 1.5)}
      ${!hasMono ? `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${SECONDARY}" letter-spacing="3">${city}</text>` : ''}
      ${divider(cx, cy + (hasMono ? 22 : 28), ACCENT, 22)}
      <text x="${cx}" y="${cy + (hasMono ? 34 : 40)}" text-anchor="middle" font-family="${font}" font-size="7" fill="${SECONDARY}" letter-spacing="4">OFFICIAL SEAL</text>
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
          <stop offset="0%" stop-color="${SECONDARY}" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="${SECONDARY}" stop-opacity="0.04"/>
        </radialGradient>
      </defs>
      <!-- Filled outer medallion band -->
      <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${PRIMARY}"/>
      <circle cx="${cx}" cy="${cy}" r="${bandR}" fill="#ffffff"/>
      <!-- Sunburst/star behind center -->
      ${starBurst(cx, cy, bandR - 8, bandR - 22, SECONDARY, 16)}
      <!-- White overlay to soften starburst -->
      <circle cx="${cx}" cy="${cy}" r="${bandR - 12}" fill="url(#t10center)"/>
      <!-- Accent inner ring -->
      <circle cx="${cx}" cy="${cy}" r="${bandR - 8}" fill="none" stroke="${SECONDARY}" stroke-width="1.4"/>
      <!-- Center monogram circle -->
      <circle cx="${cx}" cy="${cy}" r="${innerCircR}" fill="${ACCENT}"/>
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-size="22" font-weight="bold" fill="#ffffff">${mono}</text>
      <!-- Ring text -->
      ${ringText('t10ring', cx, cy, ringR, `✦  ${name}  ✦`, font, 8.5, '#ffffff', '25%', 1.8)}
      ${bottomArcText('t10bot', cx, cy, ringR, `✦  ${city}  ✦`, font, 8, '#ffffff', 2)}
      <!-- Company name arc below monogram -->
      ${wrapText(name, cx, cy + innerCircR + 16, font, nameFontSize, PRIMARY, 1.5)}
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${cy + innerCircR + 36}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${SECONDARY}">${regNo}</text>` : ''}
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
        <line x1="${ox}" y1="${oy}" x2="${ox + sx * 18}" y2="${oy}" stroke="${PRIMARY}" stroke-width="2.5"/>
        <line x1="${ox}" y1="${oy}" x2="${ox}" y2="${oy + sy * 18}" stroke="${PRIMARY}" stroke-width="2.5"/>
        <line x1="${ox + sx * 6}" y1="${oy + sy * 6}" x2="${ox + sx * 16}" y2="${oy + sy * 6}" stroke="${SECONDARY}" stroke-width="0.8"/>
        <line x1="${ox + sx * 6}" y1="${oy + sy * 6}" x2="${ox + sx * 6}" y2="${oy + sy * 16}" stroke="${SECONDARY}" stroke-width="0.8"/>
        <circle cx="${ox + sx * 6}" cy="${oy + sy * 6}" r="1.5" fill="${ACCENT}"/>`;
    }

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <!-- Art Deco corner brackets -->
      ${decoCorner(x1, y1, 1, 1)}
      ${decoCorner(x1 + sw * 2, y1, -1, 1)}
      ${decoCorner(x1, y1 + sh * 2, 1, -1)}
      ${decoCorner(x1 + sw * 2, y1 + sh * 2, -1, -1)}
      <!-- Inner double border -->
      <rect x="${x1 + 20}" y="${y1 + 20}" width="${sw * 2 - 40}" height="${sh * 2 - 40}" fill="none" stroke="${SECONDARY}" stroke-width="1.6"/>
      <rect x="${x1 + 24}" y="${y1 + 24}" width="${sw * 2 - 48}" height="${sh * 2 - 48}" fill="none" stroke="${SECONDARY}" stroke-width="0.5"/>
      <!-- Deco header line with dot ornaments -->
      <line x1="${x1 + 30}" y1="${y1 + 46}" x2="${cx - 10}" y2="${y1 + 46}" stroke="${SECONDARY}" stroke-width="0.8"/>
      <circle cx="${cx}" cy="${y1 + 46}" r="2.5" fill="${ACCENT}"/>
      <line x1="${cx + 10}" y1="${y1 + 46}" x2="${x1 + sw * 2 - 30}" y2="${y1 + 46}" stroke="${SECONDARY}" stroke-width="0.8"/>
      <!-- City header -->
      <text x="${cx}" y="${y1 + 36}" text-anchor="middle" font-family="${font}" font-size="8" fill="${SECONDARY}" letter-spacing="5">${city}</text>
      <!-- Company name -->
      ${wrapText(name, cx, cy, font, nameFontSize, PRIMARY, 2)}
      <!-- Footer line -->
      <line x1="${x1 + 30}" y1="${y1 + sh * 2 - 46}" x2="${cx - 10}" y2="${y1 + sh * 2 - 46}" stroke="${SECONDARY}" stroke-width="0.8"/>
      <circle cx="${cx}" cy="${y1 + sh * 2 - 46}" r="2.5" fill="${ACCENT}"/>
      <line x1="${cx + 10}" y1="${y1 + sh * 2 - 46}" x2="${x1 + sw * 2 - 30}" y2="${y1 + sh * 2 - 46}" stroke="${SECONDARY}" stroke-width="0.8"/>
      <!-- Footer text -->
      <text x="${cx}" y="${y1 + sh * 2 - 32}" text-anchor="middle" font-family="${font}" font-size="8" fill="${PRIMARY}" letter-spacing="4">OFFICIAL STAMP</text>
      ${regNo && project.density >= 3 ? `<text x="${cx}" y="${y1 + sh * 2 - 20}" text-anchor="middle" font-family="${font}" font-size="6.5" fill="${SECONDARY}">${regNo}</text>` : ''}
    </svg>`;
    concepts.push({ id: uid(), templateKey: 'art-deco-square', label: 'Art Deco Square', tags: ['art-deco', 'luxury', 'geometric', 'rectangle'], svgSource: svg });
  }

  // ────────────────────────────────────────────────────────────────
  // T12: Bilingual Logo Center — English top arc, Arabic bottom arc,
  //      monogram or uploaded logo centred. ALWAYS FIRST in results.
  // ────────────────────────────────────────────────────────────────
  {
    // Ring geometry
    const outerR  = R;           // 116 — outer ring
    const midR    = R - 8;       // thin gap ring (decorative)
    const innerR  = R - 16;      // inner ring
    const arcR    = R - 17;      // radius for text path — safe zone: 17px from outer to prevent touching border

    const displayArabic = arabicName || name;
    // English: base 10pt, reduce for long names (max 26 chars before scaling)
    const enFontSize    = autoFontSize(name,           10,   26);
    // Arabic: base 11pt, wider threshold — Arabic glyphs are naturally larger
    const arFontSize    = autoFontSize(displayArabic, 11,   20);

    const hasLogo  = project.icon_style === 'UPLOADED_LOGO' && (project as any).uploaded_logo_url;
    const logoUrl  = hasLogo ? (project as any).uploaded_logo_url : null;
    const logoSize = 64;  // diameter of center artwork

    // ── Top arc: English company name curves OVER the top ──
    // SVG arc from left (cx-arcR, cy) → counterclockwise over top → right (cx+arcR, cy)
    // large-arc=1, sweep=1 → upper semicircle, text reads left to right on top
    const topArcId   = 't12top';
    const topArcPath = `M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 1 1 ${cx + arcR} ${cy}`;

    // ── Bottom arc: Arabic company name curves UNDER the bottom ──
    // Start from right (cx+arcR, cy) → clockwise under bottom → left (cx-arcR, cy)
    // large-arc=0, sweep=0 → lower semicircle, text reads right-to-left naturally
    const botArcId   = 't12bot';
    const botArcPath = `M ${cx + arcR} ${cy} A ${arcR} ${arcR} 0 0 0 ${cx - arcR} ${cy}`;

    // Center artwork: logo image or filled monogram disc
    const centerArt = logoUrl
      ? `<!-- logo circle frame -->
         <circle cx="${cx}" cy="${cy}" r="${logoSize / 2 + 5}" fill="#ffffff" stroke="${ACCENT}" stroke-width="1.4"/>
         <image href="${logoUrl}"
           x="${cx - logoSize / 2}" y="${cy - logoSize / 2}"
           width="${logoSize}" height="${logoSize}"
           clip-path="url(#t12clip)"
           preserveAspectRatio="xMidYMid meet"/>
         `
      : `<!-- monogram disc -->
         <circle cx="${cx}" cy="${cy}" r="${logoSize / 2 + 2}" fill="${ACCENT}"/>
         <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
           font-family="${font}" font-size="28" font-weight="bold" fill="#ffffff"
           letter-spacing="2">${mono}</text>
         `;

    // Thin horizontal dividers flanking the center disc
    const divTop = cy - logoSize / 2 - 14;
    const divBot = cy + logoSize / 2 + 14;

    // Safe vertical limit: text must stay at least 10px inside the inner ring
    const maxTextY = cy + innerR - 10;

    // City / country line — clamp to safe zone
    const cityStr = `${project.city_optional ? project.city_optional.toUpperCase() : 'DUBAI'} · ${(project.country_optional || 'UAE').toUpperCase()}`;
    const cityY = Math.min(divBot + 17, maxTextY);
    const regNoY = divBot + 28;
    const showRegNo = regNo && regNoY <= maxTextY;

    const cityLine = `
      ${divider(cx, divBot + 6, ACCENT, 22)}
      <text x="${cx}" y="${cityY}"
        text-anchor="middle" font-family="${font}" font-size="7"
        fill="${SECONDARY}" letter-spacing="4">${cityStr}</text>
      ${showRegNo ? `<text x="${cx}" y="${regNoY}"
        text-anchor="middle" font-family="${font}" font-size="6"
        fill="${SECONDARY}" letter-spacing="2">${regNo}</text>` : ''}
    `;

    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="t12clip">
          <circle cx="${cx}" cy="${cy}" r="${logoSize / 2}"/>
        </clipPath>
        <!-- English top arc path -->
        <path id="${topArcId}" d="${topArcPath}"/>
        <!-- Arabic bottom arc path -->
        <path id="${botArcId}" d="${botArcPath}"/>
      </defs>

      <!-- ── Double ring border ── -->
      <circle cx="${cx}" cy="${cy}" r="${outerR}"  fill="none" stroke="${PRIMARY}" stroke-width="2.4"/>
      <circle cx="${cx}" cy="${cy}" r="${midR}"    fill="none" stroke="${SECONDARY}" stroke-width="0.5"/>
      <circle cx="${cx}" cy="${cy}" r="${innerR}"  fill="none" stroke="${SECONDARY}" stroke-width="1.2"/>

      <!-- ── 4 cardinal diamond ornaments ── -->
      ${[0, 90, 180, 270].map(deg => {
        const rad = (deg * Math.PI) / 180;
        const ox = cx + (outerR - 4) * Math.cos(rad);
        const oy = cy + (outerR - 4) * Math.sin(rad);
        return `<polygon points="${ox},${oy - 3.5} ${ox + 3},${oy} ${ox},${oy + 3.5} ${ox - 3},${oy}" fill="${ACCENT}"/>`;
      }).join('\n      ')}

      <!-- ── English: curved OVER the TOP ── -->
      <text font-family="${font}" font-size="${enFontSize}" fill="${PRIMARY}" letter-spacing="2" font-weight="700">
        <textPath href="#${topArcId}" startOffset="50%" text-anchor="middle">${name}</textPath>
      </text>

      <!-- ── Arabic: curved UNDER the BOTTOM (path goes right→left so RTL text reads naturally) ── -->
      <text font-family="${arabicFont}" font-size="${arFontSize}" fill="${PRIMARY}" letter-spacing="1.5" font-weight="600">
        <textPath href="#${botArcId}" startOffset="50%" text-anchor="middle">${displayArabic}</textPath>
      </text>

      <!-- ── Thin horizontal rules flanking artwork ── -->
      ${hRule(cx - 38, cx - logoSize / 2 - 8, divTop, SECONDARY, 0.6)}
      ${hRule(cx + logoSize / 2 + 8, cx + 38, divTop, SECONDARY, 0.6)}
      ${hRule(cx - 38, cx - logoSize / 2 - 8, divBot, SECONDARY, 0.6)}
      ${hRule(cx + logoSize / 2 + 8, cx + 38, divBot, SECONDARY, 0.6)}

      <!-- ── Center artwork (logo or monogram) ── -->
      ${centerArt}

      <!-- ── City · Country below artwork ── -->
      ${cityLine}
    </svg>`;

    // unshift → always appears FIRST in the concept grid
    concepts.unshift({
      id: uid(),
      templateKey: 'bilingual-logo-center',
      label: 'Bilingual Logo Center',
      tags: ['bilingual', 'logo', 'premium', 'round', 'UAE'],
      svgSource: svg,
    });
  }

  return concepts;
}
