/**
 * LiveStampPreview — real-time SVG stamp preview inside the wizard.
 * Renders a simplified but faithful stamp shape using the user's current
 * form selections (shape, border style, theme, typography, company name).
 * No external dependencies beyond React — pure SVG.
 */

import React, { useMemo } from 'react';
import { Eye } from 'lucide-react';

type StampType = 'ROUND' | 'OVAL' | 'RECTANGLE' | 'SQUARE';
type StyleTheme = 'CLASSIC' | 'MODERN' | 'MINIMAL' | 'LUXURY' | 'BOLD' | 'VINTAGE';
type BorderStyle = 'SINGLE' | 'DOUBLE' | 'RING' | 'DOTTED' | 'ROPE' | 'CUSTOM';
type TypographyStyle = 'SERIF' | 'SANS' | 'MONOSPACE' | 'CALLIGRAPHY' | 'GOTHIC' | 'ARABIC_MODERN';

export interface LiveStampPreviewProps {
  companyName: string;
  arabicCompanyName?: string;
  city?: string;
  country?: string;
  registrationNumber?: string;
  stampType: StampType;
  styleTheme: StyleTheme;
  borderStyle: BorderStyle;
  typographyStyle: TypographyStyle;
  density: number;
  iconStyle: 'NONE' | 'MONOGRAM' | 'SIMPLE_ICON' | 'UPLOADED_LOGO';
  monogramText?: string;
  uploadedLogoUrl?: string;
  languageMode: 'EN' | 'AR' | 'BILINGUAL';
  /** Size of the SVG canvas in px */
  size?: number;
}

const FONT_FAMILIES: Record<TypographyStyle, string> = {
  SERIF:         'Georgia, "Times New Roman", serif',
  SANS:          '"Helvetica Neue", Arial, sans-serif',
  MONOSPACE:     '"Courier New", Courier, monospace',
  CALLIGRAPHY:   '"Palatino Linotype", Palatino, serif',
  GOTHIC:        '"Copperplate Gothic", Copperplate, "Small Caps", serif',
  ARABIC_MODERN: '"Arabic Typesetting", "Noto Naskh Arabic", serif',
};

/** Stroke width per theme */
const THEME_STROKE: Record<StyleTheme, number> = {
  CLASSIC: 1.8,
  MODERN:  1.2,
  MINIMAL: 0.8,
  LUXURY:  2.2,
  BOLD:    3.0,
  VINTAGE: 1.6,
};

/** Whether a theme includes a secondary inner ring */
const THEME_RING: Record<StyleTheme, boolean> = {
  CLASSIC: true,
  MODERN:  false,
  MINIMAL: false,
  LUXURY:  true,
  BOLD:    false,
  VINTAGE: true,
};

/** Truncate a string for the preview */
function trunc(s: string, max: number) {
  if (!s) return '';
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

/** Scale font size so it fits within `maxWidth` pixels (approximate) */
function fitFontSize(text: string, baseSize: number, maxWidth: number, charWidthRatio = 0.6): number {
  if (!text) return baseSize;
  const estimated = text.length * baseSize * charWidthRatio;
  if (estimated <= maxWidth) return baseSize;
  return Math.max(6, (maxWidth / (text.length * charWidthRatio)));
}

/**
 * Generate a circular arc path for text-on-a-path.
 * @param cx center x, cy center y, r radius, startAngle degrees, endAngle degrees
 */
function arcPath(cx: number, cy: number, r: number, startAngleDeg: number, sweepDeg: number): string {
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = ((startAngleDeg + sweepDeg) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = Math.abs(sweepDeg) > 180 ? 1 : 0;
  const sweep = sweepDeg > 0 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
}

export function LiveStampPreview({
  companyName,
  arabicCompanyName = '',
  city = '',
  country = 'UAE',
  registrationNumber = '',
  stampType,
  styleTheme,
  borderStyle,
  typographyStyle,
  density,
  iconStyle,
  monogramText = '',
  uploadedLogoUrl = '',
  languageMode,
  size = 200,
}: LiveStampPreviewProps) {
  const displayName = companyName || 'Your Company Name';
  const fontFamily = FONT_FAMILIES[typographyStyle];
  const sw = THEME_STROKE[styleTheme];
  const hasRing = THEME_RING[styleTheme];
  const ink = '#1a2744'; // will be gold in production; keep dark for preview readability
  const goldInk = '#B8860B';

  const svg = useMemo(() => {
    const S = size;
    const cx = S / 2;
    const cy = S / 2;
    const pad = 10;

    // Shape geometry
    let outerRx = cx - pad;
    let outerRy = cy - pad;
    let innerRx = outerRx - 8 * (sw / 1.5);
    let innerRy = outerRy - 8 * (sw / 1.5);
    let shapeTag = '';

    const isDotted = borderStyle === 'DOTTED';
    const isRope = borderStyle === 'ROPE';
    const strokeDash = isDotted ? '3,3' : isRope ? '6,3' : 'none';

    // Outer ring clip
    if (stampType === 'ROUND') {
      const r = cx - pad;
      const ri = r - 7 * (sw / 1.5);
      shapeTag = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${goldInk}" stroke-width="${sw}" stroke-dasharray="${strokeDash}"/>`;
      if (hasRing || borderStyle === 'DOUBLE' || borderStyle === 'RING' || borderStyle === 'CUSTOM') {
        shapeTag += `<circle cx="${cx}" cy="${cy}" r="${ri}" fill="none" stroke="${goldInk}" stroke-width="${sw * 0.7}"/>`;
      }
      if (borderStyle === 'CUSTOM') {
        shapeTag += `<circle cx="${cx}" cy="${cy}" r="${ri - 4}" fill="none" stroke="${goldInk}" stroke-width="${sw * 0.4}" stroke-dasharray="2,4"/>`;
      }
      outerRx = outerRy = r;
      innerRx = innerRy = ri;
    } else if (stampType === 'OVAL') {
      const rx = cx - pad;
      const ry = cy - pad - 8;
      const rix = rx - 7;
      const riy = ry - 7;
      shapeTag = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${goldInk}" stroke-width="${sw}" stroke-dasharray="${strokeDash}"/>`;
      if (hasRing || borderStyle === 'DOUBLE' || borderStyle === 'RING') {
        shapeTag += `<ellipse cx="${cx}" cy="${cy}" rx="${rix}" ry="${riy}" fill="none" stroke="${goldInk}" stroke-width="${sw * 0.7}"/>`;
      }
      outerRx = rx; outerRy = ry; innerRx = rix; innerRy = riy;
    } else if (stampType === 'RECTANGLE') {
      const w = (cx - pad) * 2; const h = (cy - pad - 12) * 2;
      const x0 = pad; const y0 = cy - h / 2;
      const rr = 10;
      shapeTag = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="${rr}" fill="none" stroke="${goldInk}" stroke-width="${sw}" stroke-dasharray="${strokeDash}"/>`;
      if (hasRing || borderStyle === 'DOUBLE') {
        shapeTag += `<rect x="${x0 + 5}" y="${y0 + 5}" width="${w - 10}" height="${h - 10}" rx="${rr - 3}" fill="none" stroke="${goldInk}" stroke-width="${sw * 0.7}"/>`;
      }
    } else { // SQUARE
      const side = Math.min(S - pad * 2, S - pad * 2);
      const x0 = (S - side) / 2; const y0 = (S - side) / 2;
      const rr = 8;
      shapeTag = `<rect x="${x0}" y="${y0}" width="${side}" height="${side}" rx="${rr}" fill="none" stroke="${goldInk}" stroke-width="${sw}" stroke-dasharray="${strokeDash}"/>`;
      if (hasRing || borderStyle === 'DOUBLE') {
        shapeTag += `<rect x="${x0 + 5}" y="${y0 + 5}" width="${side - 10}" height="${side - 10}" rx="${rr - 3}" fill="none" stroke="${goldInk}" stroke-width="${sw * 0.7}"/>`;
      }
    }

    // ── Text content ───────────────────────────────────────────────────────

    let textContent = '';

    const isBilingual = languageMode === 'BILINGUAL';
    const isArabic = languageMode === 'AR';
    const isRound = stampType === 'ROUND' || stampType === 'OVAL';

    if (isRound) {
      // Arc radius: pulled well inside the inner ring so text never touches the border
      // innerRx already accounts for the ring gap; subtract extra padding for text clearance
      const arcR = innerRx - 6;
      const topArcId = 'top-arc-lp';
      // Top arc: starts at -160° (left), sweeps 160° clockwise — stays clear of the sides
      const topArcPath = arcPath(cx, cy, arcR, -160, 160);

      // Bottom arc: mirrors — starts at 20° (right side), sweeps 160° clockwise
      const botArcId = 'bot-arc-lp';
      const botArcPath = arcPath(cx, cy, arcR, 20, 160);

      // Arc circumference available ≈ r × angle_rad. Cap font tightly so text NEVER overflows.
      const arcLen = arcR * (160 * Math.PI / 180); // ~2.79r
      const nameFontSize = Math.min(10, Math.max(5, fitFontSize(displayName, 9.5, arcLen * 0.88, 0.58)));
      const nameDisplay = trunc(displayName.toUpperCase(), 32);

      textContent += `
        <defs>
          <path id="${topArcId}" d="${topArcPath}"/>
          <path id="${botArcId}" d="${botArcPath}"/>
        </defs>
        <text font-family="${fontFamily}" font-size="${nameFontSize}" fill="${goldInk}" letter-spacing="1.5" font-weight="600">
          <textPath href="#${topArcId}" startOffset="50%" text-anchor="middle">${nameDisplay}</textPath>
        </text>`;

      if (isBilingual && arabicCompanyName) {
        const arFontSize = Math.min(10, Math.max(5, fitFontSize(arabicCompanyName, 9.5, arcLen * 0.88, 0.65)));
        textContent += `
        <text font-family="${FONT_FAMILIES.ARABIC_MODERN}" font-size="${arFontSize}" fill="${goldInk}" letter-spacing="0.3">
          <textPath href="#${botArcId}" startOffset="50%" text-anchor="middle" direction="rtl" unicode-bidi="bidi-override">${trunc(arabicCompanyName, 32)}</textPath>
        </text>`;
      } else if (isArabic) {
        const arabicCity = city ? `${city}، الإمارات العربية المتحدة` : 'الإمارات العربية المتحدة';
        const cityFontSize = Math.min(9, Math.max(5, fitFontSize(arabicCity, 9, arcLen * 0.88, 0.65)));
        textContent += `
        <text font-family="${FONT_FAMILIES.ARABIC_MODERN}" font-size="${cityFontSize}" fill="${goldInk}" letter-spacing="0.3">
          <textPath href="#${botArcId}" startOffset="50%" text-anchor="middle" direction="rtl" unicode-bidi="bidi-override">${trunc(arabicCity, 32)}</textPath>
        </text>`;
      } else if (density >= 2 && (city || country)) {
        const cityLine = [city, country].filter(Boolean).join(' · ').toUpperCase();
        const cityFontSize = Math.min(9, Math.max(5, fitFontSize(cityLine, 9, arcLen * 0.88, 0.55)));
        textContent += `
        <text font-family="${fontFamily}" font-size="${cityFontSize}" fill="${goldInk}" letter-spacing="1.5">
          <textPath href="#${botArcId}" startOffset="50%" text-anchor="middle">${trunc(cityLine, 32)}</textPath>
        </text>`;
      }

      // Center: monogram or reg number
      const mono = monogramText || (displayName.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase());
      if (iconStyle === 'MONOGRAM' && mono) {
        const monoSize = mono.length === 1 ? 28 : mono.length === 2 ? 22 : 17;
        textContent += `<text x="${cx}" y="${cy}" font-family="${fontFamily}" font-size="${monoSize}" fill="${goldInk}" text-anchor="middle" dominant-baseline="central" font-weight="700" opacity="0.85">${mono}</text>`;
      } else if (iconStyle === 'UPLOADED_LOGO' && uploadedLogoUrl) {
        const imgSize = innerRx * 0.55;
        textContent += `<image href="${uploadedLogoUrl}" x="${cx - imgSize / 2}" y="${cy - imgSize / 2}" width="${imgSize}" height="${imgSize}" preserveAspectRatio="xMidYMid meet"/>`;
      } else if (iconStyle !== 'NONE') {
        // Default: monogram fallback
        const monoSize = mono.length === 1 ? 28 : mono.length === 2 ? 22 : 17;
        textContent += `<text x="${cx}" y="${cy}" font-family="${fontFamily}" font-size="${monoSize}" fill="${goldInk}" text-anchor="middle" dominant-baseline="central" font-weight="700" opacity="0.85">${mono}</text>`;
      }

      // Reg number (small, below center)
      if (density >= 3 && registrationNumber) {
        const regText = trunc(registrationNumber, 20);
        textContent += `<text x="${cx}" y="${cy + innerRy * 0.45}" font-family="${fontFamily}" font-size="6.5" fill="${goldInk}" text-anchor="middle" opacity="0.75" letter-spacing="0.8">${regText}</text>`;
      }

      // Horizontal rule lines
      if (density >= 2) {
        const rl = innerRx * 0.6;
        const ry1 = cy - innerRy * 0.3;
        const ry2 = cy + innerRy * 0.3;
        textContent += `<line x1="${cx - rl}" y1="${ry1}" x2="${cx + rl}" y2="${ry1}" stroke="${goldInk}" stroke-width="0.6" opacity="0.5"/>`;
        textContent += `<line x1="${cx - rl}" y1="${ry2}" x2="${cx + rl}" y2="${ry2}" stroke="${goldInk}" stroke-width="0.6" opacity="0.5"/>`;
      }

    } else {
      // Rectangular / Square: stacked text lines centered
      const availW = (stampType === 'RECTANGLE' ? (S - pad * 2 - 18) : (S - pad * 2 - 14));
      const nameFontSize = Math.max(7, fitFontSize(displayName, 11.5, availW, 0.58));
      const nameDisplay = trunc(displayName.toUpperCase(), 28);

      const lines: { text: string; size: number; weight: string; opacity?: number }[] = [];
      lines.push({ text: nameDisplay, size: nameFontSize, weight: '700' });
      if (isBilingual && arabicCompanyName) {
        const arSize = Math.max(7, fitFontSize(arabicCompanyName, 10.5, availW, 0.65));
        lines.push({ text: trunc(arabicCompanyName, 26), size: arSize, weight: '600' });
      }
      if (density >= 2 && registrationNumber) {
        lines.push({ text: trunc(registrationNumber, 20), size: 7.5, weight: '400', opacity: 0.7 });
      }
      if (density >= 2 && (city || country)) {
        const loc = [city, country].filter(Boolean).join(' · ').toUpperCase();
        lines.push({ text: trunc(loc, 24), size: 7, weight: '400', opacity: 0.7 });
      }

      const lineH = 13;
      const totalH = lines.length * lineH;
      const startY = cy - totalH / 2 + 7;

      // Monogram/logo at top center for square/rect
      const mono = monogramText || (displayName.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase());
      let monoY = startY - 22;
      if (iconStyle !== 'NONE' && iconStyle !== 'UPLOADED_LOGO') {
        const monoSize = mono.length === 1 ? 18 : mono.length === 2 ? 14 : 11;
        textContent += `<text x="${cx}" y="${monoY}" font-family="${fontFamily}" font-size="${monoSize}" fill="${goldInk}" text-anchor="middle" dominant-baseline="central" font-weight="700" opacity="0.85">${mono}</text>`;
        textContent += `<line x1="${cx - 20}" y1="${monoY + 8}" x2="${cx + 20}" y2="${monoY + 8}" stroke="${goldInk}" stroke-width="0.6" opacity="0.5"/>`;
      } else if (iconStyle === 'UPLOADED_LOGO' && uploadedLogoUrl) {
        const imgSize = 24;
        textContent += `<image href="${uploadedLogoUrl}" x="${cx - imgSize / 2}" y="${monoY - imgSize}" width="${imgSize}" height="${imgSize}" preserveAspectRatio="xMidYMid meet"/>`;
      }

      lines.forEach((ln, i) => {
        const y = startY + i * lineH;
        const ff = (isBilingual && i === 1) ? FONT_FAMILIES.ARABIC_MODERN : fontFamily;
        textContent += `<text x="${cx}" y="${y}" font-family="${ff}" font-size="${ln.size}" fill="${goldInk}" text-anchor="middle" dominant-baseline="central" font-weight="${ln.weight}"${ln.opacity ? ` opacity="${ln.opacity}"` : ''}>${ln.text}</text>`;
        if (i === 0) {
          const sep = availW * 0.45;
          textContent += `<line x1="${cx - sep}" y1="${y + 6}" x2="${cx + sep}" y2="${y + 6}" stroke="${goldInk}" stroke-width="0.6" opacity="0.45"/>`;
        }
      });
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
      ${shapeTag}
      ${textContent}
    </svg>`;
  }, [
    displayName, arabicCompanyName, city, country, registrationNumber,
    stampType, styleTheme, borderStyle, typographyStyle, density,
    iconStyle, monogramText, uploadedLogoUrl, languageMode,
    fontFamily, sw, hasRing, size,
  ]);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Label */}
      <div className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
        <Eye size={11} className="text-[hsl(var(--gold))]"/>
        Live Preview
      </div>

      {/* SVG canvas */}
      <div
        className="rounded-2xl border-2 border-[hsl(var(--gold)/0.25)] bg-white shadow-[0_4px_24px_hsl(var(--gold)/0.12)] flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      {/* Company name echo */}
      <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center max-w-[200px] truncate">
        {companyName || <span className="italic">Enter company name above</span>}
      </p>
    </div>
  );
}
