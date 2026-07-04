import { useState, type ReactNode, type ComponentType } from "react";
import { CheckCircle, ChevronRight, Sparkles, Wand2, Sliders } from "lucide-react";

export interface StartMethod {
  key: string;
  eyebrow: string;
  title: string;
  Icon: ComponentType<{ className?: string }>;
  desc: string;
  bullets: string[];
  cta: string;
}

interface AIToolStartGateProps {
  headline: string;
  subhead?: string;
  methods?: [StartMethod, StartMethod];
  children: ReactNode | ((activeKey: string) => ReactNode);
  storageKey?: string;
}

const DEFAULT_METHODS: [StartMethod, StartMethod] = [
  {
    key: "ai",
    eyebrow: "Fastest · AI-Assisted",
    title: "Run with AI",
    Icon: Wand2,
    desc: "Let AI do the heavy lifting. Provide a few details and receive a complete, ready-to-use result in seconds.",
    bullets: ["One-click generation", "Reviewed before you send", "Optimised for Dubai market"],
    cta: "Start with AI",
  },
  {
    key: "manual",
    eyebrow: "Full Control · Manual",
    title: "Fill Details Manually",
    Icon: Sliders,
    desc: "Enter every field yourself for maximum control over inputs, tone and output.",
    bullets: ["Type every field yourself", "Full control over specifications", "Switch to AI later anytime"],
    cta: "Fill manually",
  },
];

export const AIToolStartGate = ({
  headline,
  subhead = "Choose one option. You can review and edit every field before generating the report.",
  methods = DEFAULT_METHODS,
  children,
}: AIToolStartGateProps) => {
  const [active, setActive] = useState<string | null>(null);

  if (active) {
    return (
      <div className="w-full min-w-0" data-on-dark data-surface="dark">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setActive(null)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/60 bg-black/25 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500/15 transition"
          >
            <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Change method
          </button>
        </div>
        {typeof children === "function" ? children(active) : children}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 w-full" data-on-dark data-surface="dark">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-black/25 px-4 py-1.5 text-xs font-semibold text-white mb-4">
          <Sparkles className="w-3.5 h-3.5 text-emerald-300" /> Get started
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white break-words">{headline}</h2>
        <p className="text-white/80 mt-2 text-sm sm:text-base break-words">{subhead}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {methods.map(({ key, eyebrow, title, Icon, desc, bullets, cta }) => (
          <div
            key={key}
            role="button"
            data-contained-card
            tabIndex={0}
            onClick={() => setActive(key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActive(key);
              }
            }}
            className="group relative w-full min-w-0 rounded-[28px] p-6 sm:p-8 cursor-pointer flex flex-col justify-between overflow-hidden transition-transform hover:scale-[1.015] focus:outline-none focus:ring-2 focus:ring-emerald-400"
            style={{
              background:
                "radial-gradient(120% 120% at 0% 0%, rgba(6,95,70,0.95) 0%, rgba(4,44,28,0.92) 45%, rgba(0,0,0,0.98) 100%)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/25 flex items-center justify-center mb-5">
                <Icon className="w-7 h-7 text-emerald-200" />
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-300 font-bold mb-2 whitespace-normal break-words [overflow-wrap:anywhere]">
                {eyebrow}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white leading-tight mb-3 whitespace-normal break-words [overflow-wrap:anywhere]">
                {title}
              </div>
              <p className="text-white/85 text-sm leading-relaxed break-words">{desc}</p>
            </div>
            <div className="mt-5">
              <ul className="space-y-2 text-xs text-white/90 mb-5">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
                    <span className="break-words">{b}</span>
                  </li>
                ))}
              </ul>
              <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 group-hover:bg-emerald-400 text-white font-semibold text-sm px-4 py-2.5 transition">
                {cta} <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIToolStartGate;
