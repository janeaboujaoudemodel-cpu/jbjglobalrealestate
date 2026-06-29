import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * IconTile — global icon container (champagne-gold standard)
 * Replaces inline patterns like:
 *   <div className="bg-blue-500/10 rounded-xl"><Icon className="text-blue-500"/></div>
 *
 * Default tone is "emerald" for active/interactive brand identity.
 * Semantic tones (red/blue/amber/purple/rose) keep their hue for charts,
 * KPIs, and status pills. Never use bare gray/transparent.
 */

export type IconTileTone =
  | "gold"
  | "emerald"
  | "red"
  | "blue"
  | "amber"
  | "purple"
  | "rose"
  | "navy"
  | "ink";

export type IconTileSize = "sm" | "md" | "lg" | "xl";

const EMERALD_TILE = { tile: "jj-icon-tile-emerald", icon: "text-white" };

const TONE: Record<IconTileTone, { tile: string; icon: string }> = {
  // Global UI contract: every IconTile uses the approved JBJ emerald → black
  // ombre container with pure white Lucide glyphs. Legacy tone names remain so
  // older call sites inherit the locked style automatically instead of forking.
  gold: EMERALD_TILE,
  emerald: EMERALD_TILE,
  red: EMERALD_TILE,
  blue: EMERALD_TILE,
  amber: EMERALD_TILE,
  purple: EMERALD_TILE,
  rose: EMERALD_TILE,
  navy: EMERALD_TILE,
  ink: EMERALD_TILE,
};

const SIZE: Record<IconTileSize, { box: string; icon: string }> = {
  sm: { box: "w-9 h-9 rounded-xl", icon: "w-4 h-4" },
  md: { box: "w-11 h-11 rounded-xl", icon: "w-5 h-5" },
  lg: { box: "w-12 h-12 rounded-xl", icon: "w-5 h-5" },
  xl: { box: "w-16 h-16 rounded-2xl", icon: "w-7 h-7" },
};

interface IconTileProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  tone?: IconTileTone;
  size?: IconTileSize;
  /** Override icon color/size when needed (rare). */
  iconClassName?: string;
}

export const IconTile = React.forwardRef<HTMLDivElement, IconTileProps>(
  ({ icon: Icon, tone = "emerald", size = "md", className, iconClassName, ...rest }, ref) => {
    const t = TONE[tone];
    const s = SIZE[size];
    const isDark = true;

    // Force the glyph color with !important via inline style so it beats the
    // long :not() descendant repaint sweeps in index.css. This is the only way
    // to guarantee "Emerald tile = white icon" across every nested ancestor.
    const glyphColor = "#FFFFFF";
    const setGlyphStyle = React.useCallback(
      (el: SVGSVGElement | null) => {
        if (!el || !glyphColor) return;
        el.style.setProperty("color", glyphColor, "important");
        el.style.setProperty("stroke", glyphColor, "important");
        // Lucide icons are stroke-based — force fill:none so global
        // `fill:#FFFFFF !important` rules don't turn outline glyphs into
        // solid white blocks (e.g. BadgeDollarSign disappearing on emerald).
        el.style.setProperty("fill", "none", "important");
        el.style.setProperty("opacity", "1", "important");
        el.style.setProperty("stroke-opacity", "1", "important");
        el.style.setProperty("mix-blend-mode", "normal", "important");
        el.style.setProperty("filter", "none", "important");
        el.querySelectorAll("path, circle, rect, line, polyline, polygon, ellipse, use, g").forEach((part) => {
          const svgPart = part as SVGElement;
          svgPart.style.setProperty("color", glyphColor, "important");
          svgPart.style.setProperty("stroke", glyphColor, "important");
          svgPart.style.setProperty("fill", "none", "important");
          svgPart.style.setProperty("opacity", "1", "important");
          svgPart.style.setProperty("stroke-opacity", "1", "important");
        });
      },
      [glyphColor, isDark],
    );


    return (
      <div
        ref={ref}
        data-icon-tile=""
        data-icon-tile-tone={tone}
        data-surface="emerald"
        className={cn(
          "inline-flex items-center justify-center flex-shrink-0 leading-none overflow-visible",
          s.box,
          t.tile,
          isDark && "allow-white",
          className,
        )}
        {...rest}
      >
        <Icon
          ref={setGlyphStyle as unknown as React.Ref<SVGSVGElement>}
          className={cn(s.icon, t.icon, isDark && "allow-white", iconClassName)}
          strokeWidth={2.25}
        />
      </div>
    );
  },
);
IconTile.displayName = "IconTile";


export default IconTile;

