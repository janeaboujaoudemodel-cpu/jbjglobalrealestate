/**
 * StampOverlay — Standardized stamp rendering for all brand tools.
 * Uses mix-blend-mode: multiply for realistic ink impression on light surfaces.
 */
import React from "react";

interface StampOverlayProps {
  src: string;
  size: number;
  className?: string;
  style?: React.CSSProperties;
  opacity?: number;
}

export function StampOverlay({ src, size, className = "", style, opacity = 0.85 }: StampOverlayProps) {
  return (
    <img
      src={src}
      alt="Stamp"
      draggable={false}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        mixBlendMode: "multiply",
        opacity,
        pointerEvents: "none",
        userSelect: "none",
        ...style,
      }}
     loading="lazy" decoding="async" />
  );
}
