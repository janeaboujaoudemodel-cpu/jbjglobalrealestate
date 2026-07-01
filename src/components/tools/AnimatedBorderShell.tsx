import React from "react";
import { cn } from "@/lib/utils";

type Tone = "navy" | "emerald" | "gold";

const TONES: Record<Tone, { base: string; glow: string; ring: string }> = {
  navy: {
    base: "#0A0A0A",
    glow: "rgba(10,10,10,0.55)",
    ring: "rgba(10,10,10,0.35)",
  },
  emerald: {
    base: "#065F46",
    glow: "rgba(16,185,129,0.55)",
    ring: "rgba(16,185,129,0.35)",
  },
  gold: {
    base: "#B89555",
    glow: "rgba(184,149,85,0.55)",
    ring: "rgba(184,149,85,0.35)",
  },
};

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  /** When true the inner background is transparent so the page band shows through */
  bare?: boolean;
}

/**
 * Premium tool shell: rounded-2xl card wrapped by a slow conic-gradient animated border.
 * Wrap an entire tool (hero -> form -> results) inside one of these.
 */
export const AnimatedBorderShell = React.forwardRef<HTMLDivElement, Props>(
  ({ tone = "navy", bare = false, className, children, style, ...rest }, ref) => {
    const t = TONES[tone];
    return (
      <div
        ref={ref}
        data-no-contrast-guard
        className={cn(
          "relative rounded-[24px] p-[1.5px] overflow-hidden",
          "animated-border-shell",
          className,
        )}
        style={{
          backgroundImage: `conic-gradient(from var(--abs-angle, 0deg), ${t.base}, ${t.glow}, ${t.base}, ${t.ring}, ${t.base})`,
          animation: "absSpin 8s linear infinite",
          boxShadow: `0 18px 60px -28px ${t.glow}`,
          ...style,
        }}
        {...rest}
      >
        <div
          className={cn(
            "relative rounded-[22px] overflow-hidden",
            bare ? "bg-transparent" : "bg-[#0b0b0b]",
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);
AnimatedBorderShell.displayName = "AnimatedBorderShell";

export default AnimatedBorderShell;
