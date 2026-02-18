/**
 * SVG Stamp Template Engine
 * Generates multiple stamp concept SVGs from user-supplied project data.
 * All output is single-color (dark navy by default; preview tint applied in UI).
 */

export interface StampProject {
  company_name: string;
  trade_name_optional?: string;
  registration_number_optional?: string;
  address_optional?: string;
  city_optional?: string;
  country_optional?: string;
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
}

// Font families mapped from typography style
const fontMap = {
  SERIF: '"Georgia", "Times New Roman", serif',
  SANS: '"Arial", "Helvetica", sans-serif',
  MONOSPACE: '"Courier New", monospace',
  CALLIGRAPHY: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
};

// Stroke width per border style
const borderStrokeMap = {
  SINGLE: [2],
  DOUBLE: [1.5, 3.5],
  RING: [1, 4],
  DOTTED: [2],
  ROPE: [2.5],
  CUSTOM: [2],
};

/** Build the outer shape path/element for a given stamp type */
function shapeAttrs(type: StampProject['stamp_type'], cx: number, cy: number, r: number) {
  switch (type) {
    case 'ROUND':   return { kind: 'circle' as const, cx, cy, r };
    case 'OVAL':    return { kind: 'ellipse' as const, cx, cy, rx: r * 1.3, ry: r };
    case 'SQUARE':  return { kind: 'rect' as const, x: cx - r, y: cy - r, w: r * 2, h: r * 2 };
    case 'RECTANGLE': return { kind: 'rect' as const, x: cx - r * 1.4, y: cy - r * 0.75, w: r * 2.8, h: r * 1.5 };
  }
}

function shapeElement(attrs: ReturnType<typeof shapeAttrs>, stroke: string, sw: number, fill = 'none', extra = '') {
  if (attrs.kind === 'circle') {
    return `<circle cx="${attrs.cx}" cy="${attrs.cy}" r="${attrs.r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
  }
  if (attrs.kind === 'ellipse') {
    return `<ellipse cx="${attrs.cx}" cy="${attrs.cy}" rx="${attrs.rx}" ry="${attrs.ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
  }
  // rect
  return `<rect x="${attrs.x}" y="${attrs.y}" width="${attrs.w}" height="${attrs.h}" rx="4" ry="4" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
}

/** Circular text path (for ring text) */
function circleTextPath(id: string, cx: number, cy: number, r: number, text: string, font: string, fontSize: number, color: string) {
  return `
    <defs>
      <path id="${id}" d="M ${cx-r},${cy} A ${r},${r} 0 1,1 ${cx+r},${cy} A ${r},${r} 0 1,1 ${cx-r},${cy}"/>
    </defs>
    <text font-family="${font}" font-size="${fontSize}" fill="${color}" letter-spacing="2">
      <textPath href="#${id}" startOffset="12%" text-anchor="start">${text}</textPath>
    </text>`;
}

/** Monogram element */
function monogramElement(cx: number, cy: number, text: string, font: string, size: number, color: string) {
  return `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-size="${size}" font-weight="bold" fill="${color}">${text.toUpperCase().slice(0, 3)}</text>`;
}

/** Star / diamond dividers */
function divider(cx: number, y: number, color: string) {
  return `
    <line x1="${cx - 28}" y1="${y}" x2="${cx - 6}" y2="${y}" stroke="${color}" stroke-width="0.8"/>
    <polygon points="${cx},${y-3} ${cx+4},${y} ${cx},${y+3} ${cx-4},${y}" fill="${color}"/>
    <line x1="${cx + 6}" y1="${y}" x2="${cx + 28}" y2="${y}" stroke="${color}" stroke-width="0.8"/>`;
}

/** Core generator: returns 8 SVG concepts */
export function generateStampConcepts(project: StampProject): StampDesignConcept[] {
  const COLOR = '#1a2744'; // default deep navy stamp color
  const W = 300, H = 300;
  const cx = W / 2, cy = H / 2;
  const BASE_R = 110;
  const font = fontMap[project.typography_style];
  const name = project.company_name.toUpperCase();
  const city = (project.city_optional || project.country_optional || 'UAE').toUpperCase();
  const regNo = project.registration_number_optional ? `REG: ${project.registration_number_optional}` : '';
  const mono = project.monogram_text || name.slice(0, 2);

  // BLOCKED check for government keywords
  const blocked = /\b(government|ministry|federal|municipality|دائرة|حكومة|وزارة|بلدية|هيئة الحكومة)\b/i.test(name);
  if (blocked) {
    return [{
      id: 'blocked',
      templateKey: 'blocked',
      label: 'Blocked',
      tags: ['blocked'],
      svgSource: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" fill="#fff"/><text x="150" y="140" text-anchor="middle" font-family="Arial" font-size="14" fill="#c00">Generation blocked.</text><text x="150" y="165" text-anchor="middle" font-family="Arial" font-size="11" fill="#666">Official government seals are not permitted.</text></svg>`,
    }];
  }

  const concepts: StampDesignConcept[] = [];

  // ─── Template 1: Classic Round Double Border ───────────────────────────────
  {
    const r = BASE_R;
    const shape1 = shapeAttrs(project.stamp_type, cx, cy, r);
    const shape2 = shapeAttrs(project.stamp_type, cx, cy, r - 8);
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${shapeElement(shape1, COLOR, 2)}
      ${shapeElement(shape2, COLOR, 1)}
      ${circleTextPath('cp1', cx, cy, r - 4, `${name}  ✦  ${city}`, font, 9, COLOR)}
      ${project.icon_style === 'MONOGRAM' ? monogramElement(cx, cy - 10, mono, font, 42, COLOR) : ''}
      <text x="${cx}" y="${cy + (project.icon_style !== 'NONE' ? 20 : -6)}" text-anchor="middle" font-family="${font}" font-size="10" fill="${COLOR}" letter-spacing="1">OFFICIAL STAMP</text>
      ${regNo ? `<text x="${cx}" y="${cy + (project.icon_style !== 'NONE' ? 34 : 10)}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}">${regNo}</text>` : ''}
      ${divider(cx, cy + (project.icon_style !== 'NONE' ? 5 : -18), COLOR)}
    </svg>`;
    concepts.push({ id: crypto.randomUUID(), templateKey: 'classic-double', label: 'Classic Double Border', tags: ['classic', 'round', 'professional'], svgSource: svg });
  }

  // ─── Template 2: Modern Minimal ───────────────────────────────────────────
  {
    const r = BASE_R - 5;
    const shape = shapeAttrs(project.stamp_type, cx, cy, r);
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${shapeElement(shape, COLOR, 1.5)}
      <line x1="${cx - r + 20}" y1="${cy - 18}" x2="${cx + r - 20}" y2="${cy - 18}" stroke="${COLOR}" stroke-width="0.8"/>
      <line x1="${cx - r + 20}" y1="${cy + 18}" x2="${cx + r - 20}" y2="${cy + 18}" stroke="${COLOR}" stroke-width="0.8"/>
      ${project.icon_style === 'MONOGRAM' ? monogramElement(cx, cy - 38, mono, font, 28, COLOR) : ''}
      <text x="${cx}" y="${cy - (project.icon_style !== 'NONE' ? 2 : 6)}" text-anchor="middle" font-family="${font}" font-size="${name.length > 20 ? 9 : 11}" font-weight="bold" fill="${COLOR}" letter-spacing="2">${name}</text>
      <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">${city}</text>
      ${regNo ? `<text x="${cx}" y="${cy + 32}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}">${regNo}</text>` : ''}
    </svg>`;
    concepts.push({ id: crypto.randomUUID(), templateKey: 'modern-minimal', label: 'Modern Minimal', tags: ['modern', 'clean', 'minimal'], svgSource: svg });
  }

  // ─── Template 3: Luxury Ring ──────────────────────────────────────────────
  {
    const r = BASE_R;
    const shape1 = shapeAttrs(project.stamp_type, cx, cy, r);
    const shape2 = shapeAttrs(project.stamp_type, cx, cy, r - 12);
    const shape3 = shapeAttrs(project.stamp_type, cx, cy, r - 16);
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${shapeElement(shape1, COLOR, 3)}
      ${shapeElement(shape2, COLOR, 0.5)}
      ${shapeElement(shape3, COLOR, 1)}
      ${circleTextPath('cp3', cx, cy, r - 8, `★  ${name}  ★  ${city}  ★`, font, 8, COLOR)}
      ${project.icon_style === 'MONOGRAM' ? monogramElement(cx, cy - 5, mono, font, 50, COLOR) : `<text x="${cx}" y="${cy + 6}" text-anchor="middle" font-family="${font}" font-size="${name.length > 18 ? 9 : 11}" font-weight="bold" fill="${COLOR}" letter-spacing="1">${name}</text>`}
      <text x="${cx}" y="${cy + 40}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}" letter-spacing="4">EST.</text>
    </svg>`;
    concepts.push({ id: crypto.randomUUID(), templateKey: 'luxury-ring', label: 'Luxury Ring', tags: ['luxury', 'premium', 'ring'], svgSource: svg });
  }

  // ─── Template 4: Bold Rectangle ───────────────────────────────────────────
  {
    const rw = 130, rh = 80;
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${cx - rw}" y="${cy - rh}" width="${rw * 2}" height="${rh * 2}" rx="3" fill="none" stroke="${COLOR}" stroke-width="3"/>
      <rect x="${cx - rw + 5}" y="${cy - rh + 5}" width="${rw * 2 - 10}" height="${rh * 2 - 10}" rx="2" fill="none" stroke="${COLOR}" stroke-width="0.8"/>
      <line x1="${cx - rw + 10}" y1="${cy - 4}" x2="${cx + rw - 10}" y2="${cy - 4}" stroke="${COLOR}" stroke-width="0.8"/>
      <line x1="${cx - rw + 10}" y1="${cy + 4}" x2="${cx + rw - 10}" y2="${cy + 4}" stroke="${COLOR}" stroke-width="0.8"/>
      <text x="${cx}" y="${cy - 22}" text-anchor="middle" font-family="${font}" font-size="9" fill="${COLOR}" letter-spacing="3">${city}</text>
      <text x="${cx}" y="${cy + 2}" text-anchor="middle" font-family="${font}" font-size="${name.length > 22 ? 9 : 11}" font-weight="bold" fill="${COLOR}" letter-spacing="2">${name}</text>
      ${regNo ? `<text x="${cx}" y="${cy + 24}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}">${regNo}</text>` : ''}
      <text x="${cx}" y="${cy + 60}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="2">OFFICIAL STAMP</text>
    </svg>`;
    concepts.push({ id: crypto.randomUUID(), templateKey: 'bold-rectangle', label: 'Bold Rectangle', tags: ['bold', 'rectangle', 'corporate'], svgSource: svg });
  }

  // ─── Template 5: Vintage Ornate ───────────────────────────────────────────
  {
    const r = BASE_R - 2;
    const shape1 = shapeAttrs(project.stamp_type, cx, cy, r);
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${shapeElement(shape1, COLOR, 2)}
      ${circleTextPath('cp5a', cx, cy, r - 5, `⬥  ${name}  ⬥  ${city}  ⬥`, font, 8.5, COLOR)}
      <circle cx="${cx}" cy="${cy}" r="${r - 22}" fill="none" stroke="${COLOR}" stroke-width="0.5" stroke-dasharray="3,2"/>
      ${project.icon_style === 'MONOGRAM' ? monogramElement(cx, cy - 8, mono, font, 38, COLOR) : ''}
      <text x="${cx}" y="${cy + (project.icon_style !== 'NONE' ? 22 : 8)}" text-anchor="middle" font-family="${font}" font-size="8" fill="${COLOR}" letter-spacing="4">SINCE 2000</text>
      ${divider(cx, cy + (project.icon_style !== 'NONE' ? 4 : -12), COLOR)}
    </svg>`;
    concepts.push({ id: crypto.randomUUID(), templateKey: 'vintage-ornate', label: 'Vintage Ornate', tags: ['vintage', 'ornate', 'classic'], svgSource: svg });
  }

  // ─── Template 6: Bilingual Split (Arabic/English) ──────────────────────────
  if (project.language_mode === 'BILINGUAL' || project.language_mode === 'AR') {
    const r = BASE_R;
    const shape1 = shapeAttrs(project.stamp_type, cx, cy, r);
    const shape2 = shapeAttrs(project.stamp_type, cx, cy, r - 8);
    const arabicName = name; // placeholder – in real use would be user-supplied Arabic
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${shapeElement(shape1, COLOR, 2)}
      ${shapeElement(shape2, COLOR, 0.8)}
      <line x1="${cx - 60}" y1="${cy}" x2="${cx + 60}" y2="${cy}" stroke="${COLOR}" stroke-width="0.8"/>
      <text x="${cx}" y="${cy - 18}" text-anchor="middle" font-family="${font}" font-size="10" font-weight="bold" fill="${COLOR}">${name}</text>
      <text x="${cx}" y="${cy + 26}" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="${COLOR}" direction="rtl">${arabicName}</text>
      <text x="${cx}" y="${cy - 52}" text-anchor="middle" font-family="${font}" font-size="8" fill="${COLOR}" letter-spacing="2">OFFICIAL STAMP</text>
      ${regNo ? `<text x="${cx}" y="${cy + 55}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}">${regNo}</text>` : ''}
    </svg>`;
    concepts.push({ id: crypto.randomUUID(), templateKey: 'bilingual-split', label: 'Bilingual', tags: ['bilingual', 'arabic', 'official'], svgSource: svg });
  }

  // ─── Template 7: Square Box Stamp ─────────────────────────────────────────
  {
    const s = BASE_R - 5;
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${cx - s}" y="${cy - s}" width="${s * 2}" height="${s * 2}" fill="none" stroke="${COLOR}" stroke-width="2.5"/>
      <rect x="${cx - s + 6}" y="${cy - s + 6}" width="${s * 2 - 12}" height="${s * 2 - 12}" fill="none" stroke="${COLOR}" stroke-width="0.8"/>
      ${project.icon_style === 'MONOGRAM' ? monogramElement(cx, cy - 20, mono, font, 44, COLOR) : ''}
      <text x="${cx}" y="${cy + (project.icon_style !== 'NONE' ? 20 : 4)}" text-anchor="middle" font-family="${font}" font-size="${name.length > 18 ? 8 : 10}" font-weight="bold" fill="${COLOR}" letter-spacing="1">${name}</text>
      <text x="${cx}" y="${cy + (project.icon_style !== 'NONE' ? 36 : 20)}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="3">${city}</text>
      ${regNo ? `<text x="${cx}" y="${cy + (project.icon_style !== 'NONE' ? 52 : 36)}" text-anchor="middle" font-family="${font}" font-size="7" fill="${COLOR}">${regNo}</text>` : ''}
    </svg>`;
    concepts.push({ id: crypto.randomUUID(), templateKey: 'square-box', label: 'Square Box', tags: ['square', 'corporate', 'clean'], svgSource: svg });
  }

  // ─── Template 8: Minimalist Circle ────────────────────────────────────────
  {
    const r = BASE_R - 10;
    const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLOR}" stroke-width="1"/>
      ${project.icon_style === 'MONOGRAM' ? monogramElement(cx, cy - 18, mono, font, 36, COLOR) : ''}
      <text x="${cx}" y="${cy + (project.icon_style !== 'NONE' ? 12 : -8)}" text-anchor="middle" font-family="${font}" font-size="${name.length > 22 ? 8 : 10}" fill="${COLOR}" letter-spacing="1">${name}</text>
      <text x="${cx}" y="${cy + (project.icon_style !== 'NONE' ? 28 : 10)}" text-anchor="middle" font-family="${font}" font-size="7.5" fill="${COLOR}" letter-spacing="4">${city}</text>
      ${divider(cx, cy + (project.icon_style !== 'NONE' ? -5 : -22), COLOR)}
    </svg>`;
    concepts.push({ id: crypto.randomUUID(), templateKey: 'minimalist-circle', label: 'Minimalist', tags: ['minimal', 'simple', 'clean'], svgSource: svg });
  }

  return concepts;
}
