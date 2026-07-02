/**
 * CompareAIShell — premium emerald wrapper for /compare and /compare-manual.
 *
 * Brand-locked: dark emerald page, gold hairline accents, white ink.
 */

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

export const COMPARE_AI_PALETTE = {
  page: "#010806",
  surface: "#053D2F",
  raised: "#064E3B",
  gold: "#B89555",
  goldSoft: "rgba(184,149,85,0.18)",
  goldHairline: "rgba(184,149,85,0.55)",
  ink: "#FFFFFF",
  gradient: "linear-gradient(135deg, #032820 0%, #021611 54%, #000000 100%)",
  gradientText: "linear-gradient(90deg, #FFFFFF 0%, #FFFFFF 100%)",
} as const;

interface CompareAIShellProps {
  children: ReactNode;
}

export default function CompareAIShell({ children }: CompareAIShellProps) {
  const reduceMotion = useReducedMotion();

  const blob = (
    size: number,
    initial: { x: string; y: string },
    duration: number,
    delay = 0,
    opacity = 0.22,
  ) => (
    <motion.div
      aria-hidden
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle, rgba(184,149,85,0.35), transparent 70%)",
        filter: "blur(120px)",
        opacity,
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
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );

  return (
    <div
      data-compare-ai-shell
      data-marketing-page
      data-surface="emerald"
      data-on-dark="true"
      className="relative min-h-screen overflow-hidden"
      style={{ background: COMPARE_AI_PALETTE.gradient, color: COMPARE_AI_PALETTE.ink }}
    >
      {/* Subtle emerald ambient blobs — purely decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {blob(720, { x: "-10%", y: "-15%" }, 22, 0, 0.08)}
        {blob(640, { x: "55%", y: "10%" }, 26, 2, 0.07)}
        {blob(560, { x: "20%", y: "55%" }, 24, 4, 0.06)}
      </div>

      {/* Content layer */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** Emerald glass card primitive for sections inside CompareAIShell. */
export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl ${className}`}
      style={{
        background: COMPARE_AI_PALETTE.gradient,
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow:
          "0 20px 60px -30px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.10)",
        color: "#FFFFFF",
      }}
    >
      {children}
    </div>
  );
}

/** White accent text helper (legacy name kept for callers). */
export function GradientText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{ color: "#FFFFFF", fontWeight: 700 }}
    >
      {children}
    </span>
  );
}
