/**
 * Renders an SVG stamp concept inline with multi-color tinting support.
 * Supports primary + secondary + accent color, font-family, font-weight, font-style, and font-size overrides.
 */
import React from 'react';
import DOMPurify from 'dompurify';

interface Props {
  svgSource: string;
  /** Primary ink color — replaces #1a2744 */
  tintColor?: string;
  /** Secondary color — replaces #2a3a5c (inner ring accents) */
  secondaryColor?: string;
  /** Accent color — replaces monogram/center dominant-baseline elements */
  accentColor?: string;
  /** Font family override — replaces font-family in the SVG */
  fontFamily?: string;
  /** Font weight override */
  fontWeight?: 'normal' | 'bold';
  /** Font style override */
  fontStyle?: 'normal' | 'italic';
  /** Font size override in px — skips values < 4px */
  fontSize?: number | null;
  /** Render with realistic ink impression texture */
  inkMode?: boolean;
  className?: string;
  size?: number;
}

// SVG filter that simulates realistic rubber stamp ink impression
const INK_TEXTURE_FILTER = `
<filter id="inkTexture" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" seed="2" result="noise"/>
  <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
  <feComponentTransfer in="grayNoise" result="threshold">
    <feFuncA type="discrete" tableValues="0 0 0 0 0 0 1 1 1 1"/>
  </feComponentTransfer>
  <feComposite in="SourceGraphic" in2="threshold" operator="in" result="textured"/>
  <feGaussianBlur in="textured" stdDeviation="0.3" result="softened"/>
  <feMorphology in="softened" operator="erode" radius="0.15"/>
</filter>`;

export function StampSVGRenderer({
  svgSource,
  tintColor = '#1a2744',
  secondaryColor,
  accentColor,
  fontFamily,
  fontWeight,
  fontStyle,
  fontSize,
  inkMode = false,
  className = '',
  size = 240,
}: Props) {
  // Primary: outer borders & bands
  let tinted = svgSource.replace(/#1a2744/gi, tintColor);
  // Secondary: inner rings & decorative accents
  if (secondaryColor) {
    tinted = tinted.replace(/#2a3a5c/gi, secondaryColor);
  }
  // Accent: monogram disc & center art (dedicated hex token)
  if (accentColor) {
    tinted = tinted.replace(/#8b6914/gi, accentColor);
    // Fallback: also tint dominant-baseline="central" fills
    tinted = tinted.replace(/(dominant-baseline="central"[^>]*fill=")[^"]+(")/g, `$1${accentColor}$2`);
  } else if (secondaryColor) {
    tinted = tinted.replace(/#8b6914/gi, secondaryColor);
    tinted = tinted.replace(/(dominant-baseline="central"[^>]*fill=")[^"]+(")/g, `$1${secondaryColor}$2`);
  }

  // Apply font-family override — replaces all font-family attributes in the SVG
  if (fontFamily) {
    tinted = tinted.replace(/font-family="[^"]*"/gi, `font-family="${fontFamily}"`);
    tinted = tinted.replace(/font-family:\s*[^;'"]+/gi, `font-family:${fontFamily}`);
  }

  // Apply font-weight override — only force when explicitly set to bold;
  // passing 'normal' would clobber template weights, so skip it.
  if (fontWeight === 'bold') {
    tinted = tinted.replace(/font-weight="[^"]*"/gi, `font-weight="${fontWeight}"`);
    tinted = tinted.replace(/font-weight:\s*[^;'"]+/gi, `font-weight:${fontWeight}`);
  }

  // Apply font-style override — only force when explicitly set to italic.
  if (fontStyle === 'italic') {
    tinted = tinted.replace(/font-style="[^"]*"/gi, `font-style="${fontStyle}"`);
    tinted = tinted.replace(/font-style:\s*[^;'"]+/gi, `font-style:${fontStyle}`);
  }

  // Apply font-size override — skip tiny values (< 4px) to preserve decorative elements
  if (fontSize != null) {
    tinted = tinted.replace(/font-size="(\d+(?:\.\d+)?)"/gi, (_, px) => {
      const orig = parseFloat(px);
      if (orig < 4) return `font-size="${px}"`;
      return `font-size="${fontSize}"`;
    });
  }

  // Inject ink texture filter if inkMode is enabled
  if (inkMode) {
    // Insert filter defs and wrap content in a filtered group
    const defsMatch = tinted.match(/<defs[^>]*>/i);
    if (defsMatch) {
      tinted = tinted.replace(defsMatch[0], `${defsMatch[0]}${INK_TEXTURE_FILTER}`);
    } else {
      tinted = tinted.replace(/<svg([^>]*)>/, `<svg$1><defs>${INK_TEXTURE_FILTER}</defs>`);
    }
    // Wrap all SVG content (after opening tag) in a filtered group
    tinted = tinted.replace(
      /(<\/defs>)/i,
      `$1<g filter="url(#inkTexture)" opacity="0.88">`
    );
    tinted = tinted.replace(/<\/svg>/, '</g></svg>');
  }

  // Sanitize SVG before rendering — preserve clip-path, direction, unicode-bidi, image href
  // Allow data: URIs for uploaded logos (DOMPurify strips them by default)
  const clean = typeof window !== 'undefined'
    ? DOMPurify.sanitize(tinted, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_TAGS: [
          'image', 'filter', 'feTurbulence', 'feColorMatrix', 'feComponentTransfer',
          'feFuncA', 'feFuncR', 'feFuncG', 'feFuncB',
          'feComposite', 'feGaussianBlur', 'feMorphology', 'feFlood', 'feMerge', 'feMergeNode',
        ],
        ADD_ATTR: [
          'clip-path', 'dominant-baseline', 'unicode-bidi', 'direction', 'bidi-override',
          'letter-spacing', 'text-anchor', 'font-weight', 'font-size', 'font-family', 'font-style',
          'href', 'xlink:href', 'preserveAspectRatio', 'textLength', 'lengthAdjust',
          'filter', 'flood-color', 'flood-opacity', 'stdDeviation', 'baseFrequency',
          'numOctaves', 'seed', 'type', 'values', 'operator', 'radius', 'in', 'in2', 'result',
          'tableValues', 'x', 'y', 'width', 'height', 'opacity',
        ],
        ADD_DATA_URI_TAGS: ['image'],
        ADD_URI_SAFE_ATTR: ['href', 'xlink:href'],
        FORCE_BODY: false,
      })
    : tinted;

  return (
    <div
      className={className}
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
