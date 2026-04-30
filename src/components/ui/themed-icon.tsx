import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconTile, type IconTileSize, type IconTileTone } from "@/components/ui/icon-tile";

interface ThemedIconProps {
  icon: LucideIcon;
  /** Legacy variant: "light" → champagne+gold tile, "dark" → ink tile (white icon). */
  variant?: "light" | "dark";
  size?: IconTileSize;
  /** Optional explicit tone override (gold/emerald/red/blue/amber/purple/rose/ink). */
  tone?: IconTileTone;
  className?: string;
}

/**
 * ThemedIcon — Champagne-Gold standard.
 * Backward-compatible wrapper around <IconTile />.
 * "light" → gold tile on champagne page; "dark" → ink tile on dark sections.
 */
export function ThemedIcon({
  icon,
  variant = "light",
  size = "md",
  tone,
  className,
}: ThemedIconProps) {
  const resolvedTone: IconTileTone = tone ?? (variant === "dark" ? "ink" : "gold");
  return <IconTile icon={icon} tone={resolvedTone} size={size} className={cn(className)} />;
}
