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
  className?: string;
  size?: number;
}

export function StampSVGRenderer({
  svgSource,
  tintColor = '#1a2744',
  secondaryColor,
  accentColor,
  fontFamily,
  fontWeight,
  fontStyle,
  fontSize,
  className = '',
  size = 240,
}: Props) {
  let tinted = svgSource.replace(/#1a2744/gi, tintColor);
  if (secondaryColor) {
    tinted = tinted.replace(/#2a3a5c/gi, secondaryColor);
  }
  if (accentColor) {
    tinted = tinted.replace(/(dominant-baseline="central"[^>]*fill=")[^"]+(")/g, `$1${accentColor}$2`);
  } else if (secondaryColor) {
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

  // Sanitize SVG before rendering — preserve clip-path, direction, unicode-bidi, image href
  const clean = typeof window !== 'undefined'
    ? DOMPurify.sanitize(tinted, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_TAGS: ['image'],
        ADD_ATTR: [
          'clip-path', 'dominant-baseline', 'unicode-bidi', 'direction', 'bidi-override',
          'letter-spacing', 'text-anchor', 'font-weight', 'font-size', 'font-family', 'font-style',
          'href', 'xlink:href', 'preserveAspectRatio',
        ],
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
