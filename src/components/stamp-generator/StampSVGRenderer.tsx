/**
 * Renders an SVG stamp concept inline with a tinted ink-like preview color.
 * The actual stored SVG is always single-color navy for production use.
 */
import React from 'react';

interface Props {
  svgSource: string;
  /** Preview tint hue—pass CSS color string like '#1B6B3A' or '#8B0000'. Default: deep navy */
  tintColor?: string;
  className?: string;
  size?: number;
}

export function StampSVGRenderer({ svgSource, tintColor = '#1a2744', className = '', size = 240 }: Props) {
  // Replace the hard-coded navy color with the preview tint
  const tinted = svgSource.replace(/#1a2744/g, tintColor);
  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: tinted }}
    />
  );
}
