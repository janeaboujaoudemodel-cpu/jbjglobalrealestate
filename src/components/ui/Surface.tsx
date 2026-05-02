/**
 * <Surface> — declarative wrapper that pins a region to one of the four
 * canonical surface tones. Descendants automatically inherit safe text,
 * border, and icon colors via the `[data-surface=...]` rules in index.css.
 *
 * Usage:
 *   <Surface tone="champagne">…</Surface>
 *   <Surface tone="ink" as="footer" className="rounded-2xl">…</Surface>
 *
 * Tones:
 *   page       — #FDFBF7 page bg, ink #1A1A1A text  (default)
 *   champagne  — #F7F2EA card surface, ink #1A1A1A text
 *   gold       — #B89555 accent surface, white text
 *   ink        — #1A1A1A dark surface, champagne text
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export type SurfaceTone = "page" | "champagne" | "gold" | "ink";

type SurfaceProps<T extends keyof JSX.IntrinsicElements = "div"> = {
  tone?: SurfaceTone;
  as?: T;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "tone" | "className" | "children">;

export function Surface<T extends keyof JSX.IntrinsicElements = "div">({
  tone = "page",
  as,
  className,
  children,
  ...rest
}: SurfaceProps<T>) {
  const Tag = (as || "div") as React.ElementType;
  return (
    <Tag
      data-surface={tone}
      className={cn(
        "bg-[hsl(var(--surface-bg))] text-[hsl(var(--surface-fg))] border-[hsl(var(--surface-border))]",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Surface;
