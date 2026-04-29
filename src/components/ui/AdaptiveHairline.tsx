import { useRef } from "react";
import { useAdaptiveHairline } from "@/hooks/useAdaptiveHairline";
import { cn } from "@/lib/utils";

interface AdaptiveHairlineProps {
  /**
   * accent — restrained champagne, faded edges (footer top/bottom style).
   * nav    — champagne center with white edges (above/below nav grid style).
   * soft   — pure white soft-fade (when champagne would be wrong).
   */
  variant?: "accent" | "nav" | "soft";
  className?: string;
}

const ACCENT = "200,167,102";
const WHITE = "255,255,255";

/**
 * Single source of truth for section-divider hairlines on dark surfaces.
 * Stroke alphas auto-adapt to the underlying background luminance via
 * useAdaptiveHairline — never too faint on pitch-black, never harsh on
 * lighter wash surfaces.
 *
 * Renders an `h-px` element by default. Pass `className` to constrain
 * width (e.g. `max-w-7xl mx-auto`) or position absolutely.
 */
export const AdaptiveHairline = ({
  variant = "nav",
  className,
}: AdaptiveHairlineProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const a = useAdaptiveHairline(ref);

  const bg =
    variant === "accent"
      ? `linear-gradient(90deg, transparent 0%, rgba(${ACCENT},0) 8%, rgba(${ACCENT},${a.goldPeak}) 50%, rgba(${ACCENT},0) 92%, transparent 100%)`
      : variant === "soft"
        ? `linear-gradient(90deg, transparent, rgba(${WHITE},${a.whiteSoft}), transparent)`
        : `linear-gradient(90deg, transparent, rgba(${WHITE},${a.whiteSoft}) 20%, rgba(${ACCENT},${a.gold}) 50%, rgba(${WHITE},${a.whiteSoft}) 80%, transparent)`;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("h-px w-full", className)}
      style={{ background: bg }}
    />
  );
};

export default AdaptiveHairline;
