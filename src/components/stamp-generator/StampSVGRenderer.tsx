/**
 * Renders an SVG stamp concept inline with multi-color tinting support.
 * Supports primary + secondary + accent color, and font-family override.
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
  className?: string;
  size?: number;
}

export function StampSVGRenderer({
  svgSource,
  tintColor = '#1a2744',
  secondaryColor,
  accentColor,
  fontFamily,
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

  // Sanitize SVG before rendering — preserve clip-path, direction, unicode-bidi
  const clean = typeof window !== 'undefined'
    ? DOMPurify.sanitize(tinted, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_ATTR: ['clip-path', 'dominant-baseline', 'unicode-bidi', 'direction', 'bidi-override', 'letter-spacing', 'text-anchor', 'font-weight', 'font-size', 'font-family'],
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
