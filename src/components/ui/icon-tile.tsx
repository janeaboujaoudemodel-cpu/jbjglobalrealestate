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

const CHAMPAGNE_TILE = { tile: "jj-icon-tile-champagne", icon: "text-[#1A1A1A]" };
const EMERALD_TILE = { tile: "jj-icon-tile-emerald", icon: "text-white" };

const TONE: Record<IconTileTone, { tile: string; icon: string }> = {
  // Global UI contract: champagne/gold/light icon tiles use ink glyphs;
  // only emerald/dark own-surfaces keep pure white glyphs.
  gold: CHAMPAGNE_TILE,
  emerald: EMERALD_TILE,
  red: CHAMPAGNE_TILE,
  blue: CHAMPAGNE_TILE,
  amber: CHAMPAGNE_TILE,
  purple: CHAMPAGNE_TILE,
  rose: CHAMPAGNE_TILE,
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
  ({ icon: Icon, tone = "gold", size = "md", className, iconClassName, ...rest }, ref) => {
    const t = TONE[tone];
    const s = SIZE[size];
    const isDark = tone === "emerald" || tone === "navy" || tone === "ink";

    // Seed the glyph color, but do NOT lock it with inline !important.
    // Global surface arbitration must be able to flip a tile that becomes
    // emerald on hover/active from ink to pure white without fighting React
    // inline priority.
    const glyphColor = isDark ? "#FFFFFF" : "#1A1A1A";
    const setGlyphStyle = React.useCallback(
      (el: SVGSVGElement | null) => {
        if (!el || !glyphColor) return;
        el.style.setProperty("color", glyphColor);
        el.style.setProperty("stroke", glyphColor);
        // Lucide icons are stroke-based — force fill:none so global
        // `fill:#FFFFFF !important` rules don't turn outline glyphs into
        // solid white blocks (e.g. BadgeDollarSign disappearing on emerald).
        el.style.setProperty("fill", "none");
        el.style.setProperty("opacity", "1");
        el.style.setProperty("stroke-opacity", "1");
        el.style.setProperty("mix-blend-mode", "normal");
        el.style.setProperty("filter", "none");
        el.querySelectorAll("path, circle, rect, line, polyline, polygon, ellipse, use, g").forEach((part) => {
          const svgPart = part as SVGElement;
          svgPart.style.setProperty("color", glyphColor);
          svgPart.style.setProperty("stroke", glyphColor);
          svgPart.style.setProperty("fill", "none");
          svgPart.style.setProperty("opacity", "1");
          svgPart.style.setProperty("stroke-opacity", "1");
        });
      },
      [glyphColor, isDark],
    );


    return (
      <div
        ref={ref}
        data-icon-tile=""
        data-icon-tile-tone={tone}
        data-surface={isDark ? "emerald" : "champagne"}
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
          strokeWidth={2.55}
          absoluteStrokeWidth
        />
      </div>
    );
  },
);
IconTile.displayName = "IconTile";


export default IconTile;

