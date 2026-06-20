/**
 * AnimatedStepLine — champagne/gold 4-step process indicator.
 * A gold pulse travels along a faded champagne track connecting four nodes.
 */

import { motion, useReducedMotion } from "framer-motion";
import { Search, Sparkles, Brain, Trophy, LucideIcon } from "lucide-react";

const STEPS: Array<{ icon: LucideIcon; title: string; desc: string }> = [
  { icon: Search, title: "Pick listings", desc: "Browse or shortlist" },
  { icon: Sparkles, title: "Add via AI", desc: "Link / PDF / manual" },
  { icon: Brain, title: "AI analyzes", desc: "Reasoning engine" },
  { icon: Trophy, title: "Get verdict", desc: "Winner + risks" },
];

const TRACK =
  "linear-gradient(90deg, rgba(184,149,85,0.18) 0%, rgba(184,149,85,0.55) 50%, rgba(184,149,85,0.18) 100%)";
const TRACK_V =
  "linear-gradient(180deg, rgba(184,149,85,0.18) 0%, rgba(184,149,85,0.55) 50%, rgba(184,149,85,0.18) 100%)";

export default function AnimatedStepLine() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative w-full">
      {/* Desktop: horizontal */}
      <div className="hidden md:block relative">
        <div
          className="absolute left-[10%] right-[10%] top-7 h-[2px] rounded-full"
          style={{ background: TRACK }}
        />
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="absolute top-[22px] w-3 h-3 rounded-full"
            style={{
              background: "radial-gradient(circle, #E2C9A0 0%, #B89555 60%, rgba(184,149,85,0) 100%)",
              boxShadow: "0 0 18px rgba(184,149,85,0.65), 0 0 36px rgba(184,149,85,0.35)",
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
          style={{ background: TRACK_V }}
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
  const nodeStyle = {
    background: "#FDFBF7",
    border: "1px solid rgba(184,149,85,0.55)",
    boxShadow:
      "0 8px 24px -10px rgba(184,149,85,0.35), inset 0 1px 0 rgba(255,255,255,0.7)",
  } as const;

  if (vertical) {
    return (
      <div className="flex items-start gap-4">
        <div
          className="relative w-14 h-14 rounded-full flex items-center justify-center shrink-0"
          style={nodeStyle}
        >
          <Icon className="w-5 h-5" style={{ color: "#B89555" }} />
        </div>
        <div>
          <p
            className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-0.5"
            style={{ color: "rgba(26,26,26,0.55)" }}
          >
            Step {index + 1}
          </p>
          <p className="font-semibold text-base" style={{ color: "#1A1A1A" }}>
            {title}
          </p>
          <p className="text-sm" style={{ color: "rgba(26,26,26,0.65)" }}>
            {desc}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="relative w-14 h-14 rounded-full flex items-center justify-center"
        style={nodeStyle}
      >
        <Icon className="w-5 h-5" style={{ color: "#B89555" }} />
      </div>
      <p
        className="text-[10px] uppercase tracking-[0.18em] font-semibold mt-3"
        style={{ color: "rgba(26,26,26,0.5)" }}
      >
        Step {index + 1}
      </p>
      <p className="font-semibold text-sm mt-1" style={{ color: "#1A1A1A" }}>
        {title}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "rgba(26,26,26,0.65)" }}>
        {desc}
      </p>
    </div>
  );
}
