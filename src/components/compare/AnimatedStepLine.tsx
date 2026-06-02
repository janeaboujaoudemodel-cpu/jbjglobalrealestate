/**
 * AnimatedStepLine — premium 4-step process indicator.
 *
 * A gradient dot travels left-to-right (or top-to-bottom on mobile) along a
 * single line connecting four nodes. Replaces the old card-grid steps on
 * /compare. Scoped to /compare* (AI tool exception).
 */

import { motion, useReducedMotion } from "framer-motion";
import { Search, Sparkles, Brain, Trophy, LucideIcon } from "lucide-react";

const STEPS: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  { icon: Search, title: "Pick listings", desc: "Browse or shortlist" },
  { icon: Sparkles, title: "Add via AI", desc: "Link / PDF / manual" },
  { icon: Brain, title: "AI analyzes", desc: "Reasoning engine" },
  { icon: Trophy, title: "Get verdict", desc: "Winner + risks" },
];

export default function AnimatedStepLine() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative w-full" data-no-contrast-guard>
      {/* Desktop: horizontal */}
      <div className="hidden md:block relative">
        {/* Track */}
        <div
          className="absolute left-[10%] right-[10%] top-7 h-[2px] rounded-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(59,130,246,0.35) 0%, rgba(124,58,237,0.35) 50%, rgba(236,72,153,0.35) 100%)",
          }}
        />
        {/* Traveling pulse */}
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="absolute top-[22px] w-3 h-3 rounded-full"
            style={{
              background:
                "radial-gradient(circle, #F472B6 0%, #C084FC 50%, #60A5FA 100%)",
              boxShadow: "0 0 18px rgba(244,114,182,0.9), 0 0 36px rgba(124,58,237,0.6)",
            }}
            initial={{ left: "10%" }}
            animate={{ left: ["10%", "90%", "10%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <div className="relative grid grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <StepNode key={i} index={i} {...s} />
          ))}
        </div>
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden relative pl-4">
        <div
          className="absolute left-[27px] top-4 bottom-4 w-[2px] rounded-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(59,130,246,0.35) 0%, rgba(124,58,237,0.35) 50%, rgba(236,72,153,0.35) 100%)",
          }}
        />
        <div className="flex flex-col gap-6">
          {STEPS.map((s, i) => (
            <StepNode key={i} index={i} {...s} vertical />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepNode({
  index,
  icon: Icon,
  title,
  desc,
  vertical = false,
}: {
  index: number;
  icon: LucideIcon;
  title: string;
  desc: string;
  vertical?: boolean;
}) {
  if (vertical) {
    return (
      <div className="flex items-start gap-4">
        <div
          className="relative w-14 h-14 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "rgba(11,16,32,0.85)",
            border: "1.5px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 24px rgba(124,58,237,0.25)",
          }}
        >
          <div
            className="absolute inset-[-1.5px] rounded-full -z-10"
            style={{
              background:
                "linear-gradient(135deg, #3B82F6, #7C3AED, #EC4899)",
              opacity: 0.55,
              filter: "blur(2px)",
            }}
          />
          <Icon className="w-5 h-5" style={{ color: "#F8FAFC" }} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/50 font-semibold mb-0.5">
            Step {index + 1}
          </p>
          <p className="text-white font-semibold text-base">{title}</p>
          <p className="text-white/65 text-sm">{desc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="relative w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(11,16,32,0.85)",
          border: "1.5px solid rgba(255,255,255,0.12)",
          boxShadow: "0 8px 24px rgba(124,58,237,0.25)",
        }}
      >
        <div
          className="absolute inset-[-1.5px] rounded-full -z-10"
          style={{
            background:
              "linear-gradient(135deg, #3B82F6, #7C3AED, #EC4899)",
            opacity: 0.55,
            filter: "blur(2px)",
          }}
        />
        <Icon className="w-5 h-5" style={{ color: "#F8FAFC" }} />
      </div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold mt-3">
        Step {index + 1}
      </p>
      <p className="text-white font-semibold text-sm mt-1">{title}</p>
      <p className="text-white/60 text-xs mt-0.5">{desc}</p>
    </div>
  );
}
