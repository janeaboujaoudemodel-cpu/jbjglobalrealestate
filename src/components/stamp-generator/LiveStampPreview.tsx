/**
 * LiveStampPreview — real-time SVG stamp preview inside the wizard.
 * Renders a faithful stamp shape using the user's current form selections.
 * Uses corporate standard blue ink (#1B3A8C) as default.
 * Default bilingual: Arabic top / English bottom.
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
  iconStyle: 'NONE' | 'MONOGRAM' | 'SIMPLE_ICON' | 'UPLOADED_LOGO' | 'BOTH';
  monogramText?: string;
  uploadedLogoUrl?: string;
  languageMode: 'EN' | 'AR' | 'BILINGUAL';
  /** Whether to reverse language positions (Arabic top, English bottom) — DEFAULT TRUE */
  languageReversed?: boolean;
  /** Whether to show license number */
  showLicenseNumber?: boolean;
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
  LUXURY:  2.5,
  BOLD:    3.2,
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

function trunc(s: string, max: number) {
  if (!s) return '';
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function fitFontSize(text: string, baseSize: number, maxWidth: number, charWidthRatio = 0.6): number {
  if (!text) return baseSize;
  const estimated = text.length * baseSize * charWidthRatio;
  if (estimated <= maxWidth) return baseSize;
  return Math.max(6, (maxWidth / (text.length * charWidthRatio)));
}

function deriveMonogram(name: string): string {
  if (!name) return '';
  const words = name.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  const skipWords = new Set(['LLC', 'L.L.C', 'FZE', 'FZCO', 'CO', 'CO.', 'INC', 'LTD', 'PLC', 'CORP']);
  const significant = words.filter(w => !skipWords.has(w.toUpperCase().replace(/[.,]/g, '')));
  const source = significant.length >= 2 ? significant : words;
  return source.slice(0, 3).map(w => w[0]).join('').toUpperCase();
}

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
  languageReversed = true, // AR top by default
  showLicenseNumber = true,
  size = 220,
}: LiveStampPreviewProps) {
  const displayName = companyName || 'Your Company Name';
  const fontFamily = FONT_FAMILIES[typographyStyle];
  const sw = THEME_STROKE[styleTheme];
  const hasRing = THEME_RING[styleTheme];
  // Corporate standard: blue ink
  const ink = '#1B3A8C';

  const svg = useMemo(() => {
    const S = size;
    const cx = S / 2;
    const cy = S / 2;
    const pad = 10;

    let outerRx = cx - pad;
    let outerRy = cy - pad;
    let innerRx = outerRx - 8 * (sw / 1.5);
    let innerRy = outerRy - 8 * (sw / 1.5);
    let shapeTag = '';

    const isDotted = borderStyle === 'DOTTED';
    const isRope = borderStyle === 'ROPE';
    const isCustom = borderStyle === 'CUSTOM';
    const strokeDash = isDotted ? '2,2' : isRope ? '5,3' : isCustom ? '1,1,4,1' : 'none';

    // Outer ring
    if (stampType === 'ROUND') {
      const r = cx - pad;
      const ri = r - 7 * (sw / 1.5);
      shapeTag = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-dasharray="${strokeDash}"/>`;
      if (borderStyle === 'DOUBLE' || borderStyle === 'RING' || borderStyle === 'CUSTOM' || hasRing) {
        const innerStroke = borderStyle === 'RING' ? sw * 1.2 : sw * 0.7;
        shapeTag += `<circle cx="${cx}" cy="${cy}" r="${ri}" fill="none" stroke="${ink}" stroke-width="${innerStroke}"/>`;
      }
      if (borderStyle === 'CUSTOM') {
        shapeTag += `<circle cx="${cx}" cy="${cy}" r="${ri - 4}" fill="none" stroke="${ink}" stroke-width="${sw * 0.4}" stroke-dasharray="2,4"/>`;
      }
      outerRx = outerRy = r;
      innerRx = innerRy = ri;
    } else if (stampType === 'OVAL') {
      const rx = cx - pad;
      const ry = cy - pad - 8;
      const rix = rx - 7;
      const riy = ry - 7;
      shapeTag = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-dasharray="${strokeDash}"/>`;
      if (hasRing || borderStyle === 'DOUBLE' || borderStyle === 'RING') {
        shapeTag += `<ellipse cx="${cx}" cy="${cy}" rx="${rix}" ry="${riy}" fill="none" stroke="${ink}" stroke-width="${sw * 0.7}"/>`;
      }
      outerRx = rx; outerRy = ry; innerRx = rix; innerRy = riy;
    } else if (stampType === 'RECTANGLE') {
      const w = (cx - pad) * 2; const h = (cy - pad - 12) * 2;
      const x0 = pad; const y0 = cy - h / 2;
      const rr = 10;
      shapeTag = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="${rr}" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-dasharray="${strokeDash}"/>`;
      if (hasRing || borderStyle === 'DOUBLE') {
        shapeTag += `<rect x="${x0 + 5}" y="${y0 + 5}" width="${w - 10}" height="${h - 10}" rx="${rr - 3}" fill="none" stroke="${ink}" stroke-width="${sw * 0.7}"/>`;
      }
    } else {
      const side = Math.min(S - pad * 2, S - pad * 2);
      const x0 = (S - side) / 2; const y0 = (S - side) / 2;
      const rr = 8;
      shapeTag = `<rect x="${x0}" y="${y0}" width="${side}" height="${side}" rx="${rr}" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-dasharray="${strokeDash}"/>`;
      if (hasRing || borderStyle === 'DOUBLE') {
        shapeTag += `<rect x="${x0 + 5}" y="${y0 + 5}" width="${side - 10}" height="${side - 10}" rx="${rr - 3}" fill="none" stroke="${ink}" stroke-width="${sw * 0.7}"/>`;
      }
    }

    // ── Text content ───────────────────────────────────────────────────────

    let textContent = '';

    const isBilingual = languageMode === 'BILINGUAL';
    const isArabic = languageMode === 'AR';
    const isRound = stampType === 'ROUND' || stampType === 'OVAL';

    // Arabic on top by default when reversed=true
    const topIsArabic = isBilingual && languageReversed;

    if (isRound) {
      const arcR = innerRx - 6;
      const clipR = innerRx - 2;
      const topArcId = 'top-arc-lp';
      const botArcId = 'bot-arc-lp';
      const botArcRevId = 'bot-arc-rev-lp';
      const clipId = 'lp-round-clip';

      const topArcPath = arcPath(cx, cy, arcR, -177.5, 175);
      const botArcPath = arcPath(cx, cy, arcR, 2.5, 175);
      const botArcRevPath = arcPath(cx, cy, arcR, 177.5, -175);

      const arcLen = arcR * (175 * Math.PI / 180);

      textContent += `
        <defs>
          <clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${clipR}"/></clipPath>
          <path id="${topArcId}" d="${topArcPath}"/>
          <path id="${botArcId}" d="${botArcPath}"/>
          <path id="${botArcRevId}" d="${botArcRevPath}"/>
        </defs>
        <g clip-path="url(#${clipId})">`;

      if (isBilingual && arabicCompanyName) {
        if (topIsArabic) {
          // Arabic on top arc, English on bottom
          const arFontSize = Math.min(11, Math.max(5, fitFontSize(arabicCompanyName, 10, arcLen * 0.88, 0.65)));
          textContent += `
          <text font-family="${FONT_FAMILIES.ARABIC_MODERN}" font-size="${arFontSize}" fill="${ink}" letter-spacing="0.5">
            <textPath href="#${topArcId}" startOffset="50%" text-anchor="middle">${trunc(arabicCompanyName, 36)}</textPath>
          </text>`;
          const nameFontSize = Math.min(11, Math.max(5, fitFontSize(displayName, 10, arcLen * 0.88, 0.58)));
          textContent += `
          <text font-family="${fontFamily}" font-size="${nameFontSize}" fill="${ink}" letter-spacing="1.5" font-weight="600">
            <textPath href="#${botArcId}" startOffset="50%" text-anchor="middle">${trunc(displayName.toUpperCase(), 36)}</textPath>
          </text>`;
        } else {
          // English on top, Arabic on bottom
          const nameFontSize = Math.min(11, Math.max(5, fitFontSize(displayName, 10, arcLen * 0.88, 0.58)));
          textContent += `
          <text font-family="${fontFamily}" font-size="${nameFontSize}" fill="${ink}" letter-spacing="1.5" font-weight="600">
            <textPath href="#${topArcId}" startOffset="50%" text-anchor="middle">${trunc(displayName.toUpperCase(), 36)}</textPath>
          </text>`;
          const arFontSize = Math.min(11, Math.max(5, fitFontSize(arabicCompanyName, 10, arcLen * 0.88, 0.65)));
          textContent += `
          <text font-family="${FONT_FAMILIES.ARABIC_MODERN}" font-size="${arFontSize}" fill="${ink}" letter-spacing="0.5">
            <textPath href="#${botArcRevId}" startOffset="50%" text-anchor="middle">${trunc(arabicCompanyName, 36)}</textPath>
          </text>`;
        }
      } else if (isArabic) {
        const arabicDisplayName = arabicCompanyName || displayName;
        const arNameFont = Math.min(11, Math.max(5, fitFontSize(arabicDisplayName, 10, arcLen * 0.88, 0.65)));
        textContent += `
        <text font-family="${FONT_FAMILIES.ARABIC_MODERN}" font-size="${arNameFont}" fill="${ink}" letter-spacing="0.5">
          <textPath href="#${topArcId}" startOffset="50%" text-anchor="middle">${trunc(arabicDisplayName, 36)}</textPath>
        </text>`;
        const arabicCityText = city || '';
        if (arabicCityText) {
          const ARABIC_CITY_MAP: Record<string, string> = {
            'dubai': 'دبي، الإمارات العربية المتحدة', 'abu dhabi': 'أبوظبي، الإمارات العربية المتحدة',
            'sharjah': 'الشارقة، الإمارات العربية المتحدة', 'ajman': 'عجمان، الإمارات العربية المتحدة',
            'ras al khaimah': 'رأس الخيمة، الإمارات العربية المتحدة', 'fujairah': 'الفجيرة، الإمارات العربية المتحدة',
            'umm al quwain': 'أم القيوين، الإمارات العربية المتحدة',
          };
          const arabicCity = ARABIC_CITY_MAP[arabicCityText.toLowerCase()] || `${arabicCityText}، الإمارات العربية المتحدة`;
          const cityFontSize = Math.min(10, Math.max(5, fitFontSize(arabicCity, 9.5, arcLen * 0.88, 0.65)));
          textContent += `
          <text font-family="${FONT_FAMILIES.ARABIC_MODERN}" font-size="${cityFontSize}" fill="${ink}" letter-spacing="0.5">
            <textPath href="#${botArcRevId}" startOffset="50%" text-anchor="middle">${trunc(arabicCity, 36)}</textPath>
          </text>`;
        }
      } else {
        // English only
        const nameFontSize = Math.min(11, Math.max(5, fitFontSize(displayName, 10, arcLen * 0.88, 0.58)));
        textContent += `
        <text font-family="${fontFamily}" font-size="${nameFontSize}" fill="${ink}" letter-spacing="1.5" font-weight="600">
          <textPath href="#${topArcId}" startOffset="50%" text-anchor="middle">${trunc(displayName.toUpperCase(), 36)}</textPath>
        </text>`;
        if (density >= 2 && (city || country)) {
          const cityLine = [city, country].filter(Boolean).join(' · ').toUpperCase();
          const cityFontSize = Math.min(10, Math.max(5, fitFontSize(cityLine, 9.5, arcLen * 0.88, 0.55)));
          textContent += `
          <text font-family="${fontFamily}" font-size="${cityFontSize}" fill="${ink}" letter-spacing="1.5">
            <textPath href="#${botArcId}" startOffset="50%" text-anchor="middle">${trunc(cityLine, 36)}</textPath>
          </text>`;
        }
      }

      // Center: monogram or logo
      const mono = monogramText || deriveMonogram(displayName);
      const showMonogram = iconStyle === 'MONOGRAM' || iconStyle === 'BOTH';
      const showLogo = (iconStyle === 'UPLOADED_LOGO' || iconStyle === 'BOTH') && uploadedLogoUrl;

      if (showLogo && showMonogram && iconStyle === 'BOTH') {
        const imgSize = innerRx * 0.45;
        textContent += `<image href="${uploadedLogoUrl}" x="${cx - imgSize / 2}" y="${cy - imgSize / 2 - 8}" width="${imgSize}" height="${imgSize}" preserveAspectRatio="xMidYMid meet"/>`;
        const monoSize = mono.length === 1 ? 14 : mono.length === 2 ? 11 : 9;
        textContent += `<text x="${cx}" y="${cy + imgSize / 2 + 4}" font-family="${fontFamily}" font-size="${monoSize}" fill="${ink}" text-anchor="middle" dominant-baseline="central" font-weight="700" opacity="0.85">${mono}</text>`;
      } else if (showLogo) {
        const imgSize = innerRx * 0.85;
        textContent += `<image href="${uploadedLogoUrl}" x="${cx - imgSize / 2}" y="${cy - imgSize / 2}" width="${imgSize}" height="${imgSize}" preserveAspectRatio="xMidYMid meet" image-rendering="optimizeQuality"/>`;
      } else if (showMonogram && mono) {
        const monoSize = mono.length === 1 ? 28 : mono.length === 2 ? 22 : 17;
        textContent += `<text x="${cx}" y="${cy}" font-family="${fontFamily}" font-size="${monoSize}" fill="${ink}" text-anchor="middle" dominant-baseline="central" font-weight="700" opacity="0.85">${mono}</text>`;
      }

      // Reg number
      if (showLicenseNumber && density >= 3 && registrationNumber) {
        const regText = trunc(registrationNumber, 20);
        textContent += `<text x="${cx}" y="${cy + innerRy * 0.45}" font-family="${fontFamily}" font-size="6.5" fill="${ink}" text-anchor="middle" opacity="0.75" letter-spacing="0.8">${regText}</text>`;
      }

      // Horizontal rule lines (dividers)
      if (density >= 2) {
        const rl = innerRx * 0.6;
        const ry1 = cy - innerRy * 0.3;
        const ry2 = cy + innerRy * 0.3;
        textContent += `<line x1="${cx - rl}" y1="${ry1}" x2="${cx + rl}" y2="${ry1}" stroke="${ink}" stroke-width="0.6" opacity="0.5"/>`;
        textContent += `<line x1="${cx - rl}" y1="${ry2}" x2="${cx + rl}" y2="${ry2}" stroke="${ink}" stroke-width="0.6" opacity="0.5"/>`;
      }
      textContent += `</g>`;

    } else {
      // Rectangular / Square: stacked text lines centered
      const availW = (stampType === 'RECTANGLE' ? (S - pad * 2 - 18) : (S - pad * 2 - 14));
      const nameFontSize = Math.max(7, fitFontSize(displayName, 11.5, availW, 0.58));
      const nameDisplay = trunc(displayName.toUpperCase(), 28);

      const lines: { text: string; size: number; weight: string; opacity?: number; isArabic?: boolean }[] = [];
      
      if (isBilingual && arabicCompanyName) {
        if (topIsArabic) {
          const arSize = Math.max(7, fitFontSize(arabicCompanyName, 10.5, availW, 0.65));
          lines.push({ text: trunc(arabicCompanyName, 26), size: arSize, weight: '600', isArabic: true });
          lines.push({ text: nameDisplay, size: nameFontSize, weight: '700' });
        } else {
          lines.push({ text: nameDisplay, size: nameFontSize, weight: '700' });
          const arSize = Math.max(7, fitFontSize(arabicCompanyName, 10.5, availW, 0.65));
          lines.push({ text: trunc(arabicCompanyName, 26), size: arSize, weight: '600', isArabic: true });
        }
      } else {
        lines.push({ text: nameDisplay, size: nameFontSize, weight: '700' });
      }
      
      if (showLicenseNumber && density >= 2 && registrationNumber) {
        lines.push({ text: trunc(registrationNumber, 20), size: 7.5, weight: '400', opacity: 0.7 });
      }
      if (density >= 2 && (city || country)) {
        const loc = [city, country].filter(Boolean).join(' · ').toUpperCase();
        lines.push({ text: trunc(loc, 24), size: 7, weight: '400', opacity: 0.7 });
      }

      const lineH = 13;
      const totalH = lines.length * lineH;
      const startY = cy - totalH / 2 + 7;

      const mono = monogramText || deriveMonogram(displayName);
      let monoY = startY - 22;
      const showMonogram = iconStyle === 'MONOGRAM' || iconStyle === 'BOTH';
      const showLogo = (iconStyle === 'UPLOADED_LOGO' || iconStyle === 'BOTH') && uploadedLogoUrl;

      if (showLogo) {
        const imgSize = 24;
        textContent += `<image href="${uploadedLogoUrl}" x="${cx - imgSize / 2}" y="${monoY - imgSize}" width="${imgSize}" height="${imgSize}" preserveAspectRatio="xMidYMid meet"/>`;
      }
      if (showMonogram && mono) {
        const monoSize = mono.length === 1 ? 18 : mono.length === 2 ? 14 : 11;
        textContent += `<text x="${cx}" y="${monoY}" font-family="${fontFamily}" font-size="${monoSize}" fill="${ink}" text-anchor="middle" dominant-baseline="central" font-weight="700" opacity="0.85">${mono}</text>`;
        textContent += `<line x1="${cx - 20}" y1="${monoY + 8}" x2="${cx + 20}" y2="${monoY + 8}" stroke="${ink}" stroke-width="0.6" opacity="0.5"/>`;
      }

      lines.forEach((ln, i) => {
        const y = startY + i * lineH;
        const ff = ln.isArabic ? FONT_FAMILIES.ARABIC_MODERN : fontFamily;
        textContent += `<text x="${cx}" y="${y}" font-family="${ff}" font-size="${ln.size}" fill="${ink}" text-anchor="middle" dominant-baseline="central" font-weight="${ln.weight}"${ln.opacity ? ` opacity="${ln.opacity}"` : ''}>${ln.text}</text>`;
        if (i === 0) {
          const sep = availW * 0.45;
          textContent += `<line x1="${cx - sep}" y1="${y + 6}" x2="${cx + sep}" y2="${y + 6}" stroke="${ink}" stroke-width="0.6" opacity="0.45"/>`;
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
    iconStyle, monogramText, uploadedLogoUrl, languageMode, languageReversed,
    showLicenseNumber, fontFamily, sw, hasRing, size, ink,
  ]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))]">
        <Eye size={11} className="text-[hsl(var(--gold))]"/>
        Live Preview
      </div>

      <div
        className="rounded-2xl border-2 border-[hsl(var(--gold)/0.25)] bg-white shadow-[0_4px_24px_hsl(var(--gold)/0.12)] flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center max-w-[200px] truncate">
        {companyName || <span className="italic">Enter company name above</span>}
      </p>
    </div>
  );
}
