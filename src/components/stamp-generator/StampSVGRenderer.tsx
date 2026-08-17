/**
 * Renders an SVG stamp concept inline with multi-color tinting support.
 * Supports primary + secondary + accent color, font-family, font-weight, font-style, and font-size overrides.
 */
import React from 'react';
import { sanitizeSvgMarkup } from '@/utils/safeHtml';

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
  // Accent: monogram disc & center art (dedicated hex token only)
  // IMPORTANT: Do NOT recolor all dominant-baseline="central" elements — that catches
  // separators, registration numbers, and other non-monogram text.
  // Monogram colors are applied separately via applyMonogramColors().
  if (accentColor) {
    tinted = tinted.replace(/#8b6914/gi, accentColor);
  } else if (secondaryColor) {
    tinted = tinted.replace(/#8b6914/gi, secondaryColor);
  }

  // Font-family, font-weight, font-style, and font-size are NO LONGER applied
  // via global regex here. This caused English controls to cross-contaminate Arabic.
  // The live re-render pipeline in StampGeneratorPage now bakes per-language fonts
  // directly into the SVG via generateOfficialStampSVG().

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

  // Scope SVG IDs to prevent cross-instance collisions in grids
  const instanceId = React.useId().replace(/:/g, '');
  tinted = tinted.replace(/\bid="([^"]+)"/g, (_, id) => `id="${instanceId}-${id}"`);
  tinted = tinted.replace(/href="#([^"]+)"/g, (_, id) => `href="#${instanceId}-${id}"`);
  tinted = tinted.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${instanceId}-${id})`);

  // Sanitize SVG before rendering. sanitizeSvgMarkup keeps the attributes the
  // stamp templates need (bidi/letter-spacing for Arabic arc text, filter
  // primitives, data: image hrefs for uploaded logos) and returns '' rather
  // than raw markup when there is no DOM.
  const clean = sanitizeSvgMarkup(tinted);

  return (
    <div
      className={className}
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
