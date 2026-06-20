/**
 * CompareAIShell — Champagne/gold premium wrapper for /compare and /compare-manual.
 *
 * Brand-locked: page #FDFBF7 → surface #F7F2EA → raised #EFE6D6 with
 * 1px gold #B89555 hairlines. No blue/purple/pink anywhere. Ink #1A1A1A text.
 */

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

export const COMPARE_AI_PALETTE = {
  page: "#FDFBF7",
  surface: "#F7F2EA",
  raised: "#EFE6D6",
  gold: "#B89555",
  goldSoft: "rgba(184,149,85,0.18)",
  goldHairline: "rgba(184,149,85,0.55)",
  ink: "#1A1A1A",
  // Gradient kept as champagne sweep for any legacy callers
  gradient: "linear-gradient(135deg, #EFE6D6 0%, #F7F2EA 50%, #FDFBF7 100%)",
  gradientText: "linear-gradient(90deg, #1A1A1A 0%, #1A1A1A 100%)",
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
      className="relative min-h-screen overflow-hidden"
      style={{ background: COMPARE_AI_PALETTE.page, color: COMPARE_AI_PALETTE.ink }}
    >
      {/* Subtle champagne ambient blobs — purely decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {blob(720, { x: "-10%", y: "-15%" }, 22, 0, 0.28)}
        {blob(640, { x: "55%", y: "10%" }, 26, 2, 0.22)}
        {blob(560, { x: "20%", y: "55%" }, 24, 4, 0.18)}
      </div>

      {/* Content layer */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** Champagne glass card primitive for sections inside CompareAIShell. */
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
        background: COMPARE_AI_PALETTE.surface,
        border: `1px solid ${COMPARE_AI_PALETTE.goldHairline}`,
        boxShadow:
          "0 20px 60px -30px rgba(184,149,85,0.25), inset 0 1px 0 rgba(255,255,255,0.6)",
        color: COMPARE_AI_PALETTE.ink,
      }}
    >
      {children}
    </div>
  );
}

/** Gold-ink accent text helper (replaces former vivid gradient). */
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
      style={{ color: COMPARE_AI_PALETTE.gold, fontWeight: 700 }}
    >
      {children}
    </span>
  );
}
