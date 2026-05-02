import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * IconTile — global icon container (champagne-gold standard)
 * Replaces inline patterns like:
 *   <div className="bg-blue-500/10 rounded-xl"><Icon className="text-blue-500"/></div>
 *
 * Default tone is "gold" to match the Owner Command Center quick-actions style.
 * Semantic tones (emerald/red/blue/amber/purple/rose) keep their hue for charts,
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
  | "ink";

export type IconTileSize = "sm" | "md" | "lg" | "xl";

const TONE: Record<IconTileTone, { tile: string; icon: string }> = {
  gold:    { tile: "bg-[#EFE6D6] ring-1 ring-[#B89555]",            icon: "text-[#1A1A1A]" },
  emerald: { tile: "bg-emerald-500/10 ring-1 ring-emerald-500/30", icon: "text-emerald-600" },
  red:     { tile: "bg-red-500/10 ring-1 ring-red-500/30",         icon: "text-red-600" },
  blue:    { tile: "bg-blue-500/10 ring-1 ring-blue-500/30",       icon: "text-blue-600" },
  amber:   { tile: "bg-amber-500/10 ring-1 ring-amber-500/30",     icon: "text-amber-600" },
  purple:  { tile: "bg-purple-500/10 ring-1 ring-purple-500/30",   icon: "text-purple-600" },
  rose:    { tile: "bg-rose-500/10 ring-1 ring-rose-500/30",       icon: "text-rose-600" },
  ink:     { tile: "bg-[#1A1A1A] ring-1 ring-[#1A1A1A]",           icon: "text-white" },
};

const SIZE: Record<IconTileSize, { box: string; icon: string }> = {
  sm: { box: "w-8 h-8 rounded-lg",   icon: "w-4 h-4" },
  md: { box: "w-10 h-10 rounded-xl", icon: "w-5 h-5" },
  lg: { box: "w-12 h-12 rounded-xl", icon: "w-6 h-6" },
  xl: { box: "w-16 h-16 rounded-2xl",icon: "w-8 h-8" },
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
    return (
      <div
        ref={ref}
        data-icon-tile=""
        data-icon-tile-tone={tone}
        className={cn(
          "inline-flex items-center justify-center flex-shrink-0",
          s.box,
          t.tile,
          className,
        )}
        {...rest}
      >
        <Icon className={cn(s.icon, t.icon, iconClassName)} />
      </div>
    );
  },
);
IconTile.displayName = "IconTile";

export default IconTile;
