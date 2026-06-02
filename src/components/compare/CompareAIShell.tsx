/**
 * CompareAIShell — Premium animated AI-tool wrapper for /compare and /compare-manual.
 *
 * AI-tool exception: this shell uses the vivid blue → pink → violet "Flo" palette,
 * scoped strictly to comparison routes. The rest of the site keeps champagne-gold.
 *
 * Background = deep navy `#0B1020` with three slow-drifting blurred blobs
 * (electric blue, hot pink, deep violet) animated via framer-motion. Subtle
 * grain overlay. No gray/silver anywhere.
 */

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

export const COMPARE_AI_PALETTE = {
  base: "#0B1020",
  blue: "#3B82F6",
  pink: "#EC4899",
  violet: "#7C3AED",
  gradient: "linear-gradient(135deg, #3B82F6 0%, #7C3AED 50%, #EC4899 100%)",
  gradientText: "linear-gradient(90deg, #60A5FA 0%, #C084FC 50%, #F472B6 100%)",
} as const;

interface CompareAIShellProps {
  children: ReactNode;
}

export default function CompareAIShell({ children }: CompareAIShellProps) {
  const reduceMotion = useReducedMotion();

  const blob = (
    color: string,
    size: number,
    initial: { x: string; y: string },
    duration: number,
    delay = 0,
  ) => (
    <motion.div
      aria-hidden
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: color,
        filter: "blur(120px)",
        opacity: 0.55,
        willChange: "transform",
      }}
      initial={initial}
      animate={
        reduceMotion
          ? initial
          : {
              x: [initial.x, "30%", "-10%", initial.x],
              y: [initial.y, "-20%", "25%", initial.y],
            }
      }
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );

  return (
    <div
      data-compare-ai-shell
      data-no-contrast-guard
      data-allow-dark-cta
      className="relative min-h-screen overflow-hidden"
      style={{ background: COMPARE_AI_PALETTE.base, color: "#F8FAFC" }}
    >
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {blob(COMPARE_AI_PALETTE.blue, 720, { x: "-10%", y: "-15%" }, 22, 0)}
        {blob(COMPARE_AI_PALETTE.violet, 640, { x: "55%", y: "10%" }, 26, 2)}
        {blob(COMPARE_AI_PALETTE.pink, 560, { x: "20%", y: "55%" }, 24, 4)}
      </div>

      {/* Grain overlay (cheap CSS noise) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>\")",
        }}
      />

      {/* Vignette + base wash for readability */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(11,16,32,0.55) 70%, rgba(11,16,32,0.85) 100%)",
        }}
      />

      {/* Content layer */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** Glass card primitive for sections inside CompareAIShell. */
export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-no-contrast-guard
      className={`relative rounded-2xl backdrop-blur-xl ${className}`}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow:
          "0 20px 60px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </div>
  );
}

/** Gradient text helper. */
export function GradientText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{ backgroundImage: COMPARE_AI_PALETTE.gradientText }}
    >
      {children}
    </span>
  );
}
