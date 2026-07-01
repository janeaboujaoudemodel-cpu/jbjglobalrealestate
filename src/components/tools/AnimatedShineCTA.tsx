import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "navy" | "emerald" | "gold" | "burgundy";

const TONES: Record<Tone, { from: string; to: string; hoverFrom: string; hoverTo: string; ring: string }> = {
  navy: {
    from: "#0A0A0A",
    to: "#1F1F1F",
    hoverFrom: "#0c1d34",
    hoverTo: "#234f7d",
    ring: "rgba(255,255,255,0.35)",
  },
  emerald: {
    from: "#064E3B",
    to: "#065F46",
    hoverFrom: "#04231A",
    hoverTo: "#34d399",
    ring: "rgba(255,255,255,0.4)",
  },
  gold: {
    from: "#9a7b3f",
    to: "#B89555",
    hoverFrom: "#7f6432",
    hoverTo: "#c9a766",
    ring: "rgba(255,255,255,0.35)",
  },
  burgundy: {
    from: "#064E3B",
    to: "#064E3B",
    hoverFrom: "#064E3B",
    hoverTo: "#065F46",
    ring: "rgba(255,255,255,0.42)",
  },
};

type ButtonElProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: "button";
};
type AnchorElProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  as: "a";
  href: string;
};

type Props = (ButtonElProps | AnchorElProps) & {
  tone?: Tone;
  loading?: boolean;
  showArrow?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
};

/**
 * Animated full-color CTA used across AI tool pages.
 * - Solid gradient fill in the tool's tone (navy/emerald/gold)
 * - Slow sweeping shine highlight
 * - White text + white arrow at all states
 */
export const AnimatedShineCTA: React.FC<Props> = ({
  tone = "navy",
  loading = false,
  showArrow = true,
  fullWidth = false,
  className,
  children,
  ...rest
}) => {
  const t = TONES[tone];

  const baseClass = cn(
    "group relative inline-flex items-center justify-center gap-2.5",
    "px-7 py-3.5 rounded-xl overflow-hidden select-none",
    "text-[15px] font-semibold tracking-[0.01em] text-white",
    "transition-[transform,box-shadow] duration-300",
    "hover:-translate-y-[1px] active:translate-y-0",
    "disabled:opacity-60 disabled:pointer-events-none",
    fullWidth && "w-full",
    className,
  );

  const styleProps: React.CSSProperties = {
    background: `linear-gradient(135deg, ${t.from} 0%, ${t.to} 100%)`,
    boxShadow: `0 10px 30px -12px ${t.from}`,
    border: `1px solid ${t.ring}`,
    color: "#FFFFFF",
    WebkitTextFillColor: "#FFFFFF",
  };

  const inner = (
    <>
      {/* sweeping shine */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1100ms] ease-out"
        style={{
          background:
            "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%)",
        }}
      />
      {/* slow ambient sheen */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(120% 60% at 50% -20%, rgba(255,255,255,0.18) 0%, transparent 60%)",
        }}
      />
      <span className="relative z-10 text-white inline-flex items-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
        {children}
        {showArrow && !loading ? (
          <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-0.5" />
        ) : null}
      </span>
    </>
  );

  if ((rest as AnchorElProps).as === "a") {
    const { as: _as, ...anchorRest } = rest as AnchorElProps;
    return (
      <a
        {...anchorRest}
        data-no-contrast-guard
        data-allow-dark-cta
        className={baseClass}
        style={styleProps}
      >
        {inner}
      </a>
    );
  }
  const { as: _bAs, ...btnRest } = rest as ButtonElProps;
  return (
    <button
      type="button"
      {...btnRest}
      data-no-contrast-guard
      data-allow-dark-cta
      disabled={loading || btnRest.disabled}
      className={baseClass}
      style={styleProps}
    >
      {inner}
    </button>
  );
};

export default AnimatedShineCTA;
