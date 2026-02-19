/**
 * Renders an SVG stamp concept inline with multi-color tinting support.
 * Supports primary + secondary color for dual-color mode.
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
  className?: string;
  size?: number;
}

export function StampSVGRenderer({
  svgSource,
  tintColor = '#1a2744',
  secondaryColor,
  accentColor,
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

  // Sanitize SVG before rendering
  const clean = typeof window !== 'undefined'
    ? DOMPurify.sanitize(tinted, { USE_PROFILES: { svg: true, svgFilters: true } })
    : tinted;

  return (
    <div
      className={className}
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
