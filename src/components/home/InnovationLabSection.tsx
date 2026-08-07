import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Database, ShieldCheck, Brain, Handshake, KeyRound } from "lucide-react";

/**
 * "How We Build" — scroll-driven 3D assembly of the JBJ operating system.
 * A sticky isometric stage where five layers snap into place as the reader
 * scrolls, paired with the narrative for each layer. No 3D engine: pure CSS
 * perspective + transforms so it stays fast on mobile.
 */

const LAYERS = [
  {
    icon: Database,
    kicker: "Layer 01",
    title: "We ingest the whole market",
    body: "Every launch, price list, payment plan and floor plan across the UAE, Cyprus, Greece, Georgia and Lebanon lands in one structured database — not a folder of PDFs.",
  },
  {
    icon: ShieldCheck,
    kicker: "Layer 02",
    title: "Then we verify it, line by line",
    body: "Each figure is checked against the developer's own release before it is allowed on the platform, and stamped with the date it was confirmed.",
  },
  {
    icon: Brain,
    kicker: "Layer 03",
    title: "Our AI reads it the way an analyst would",
    body: "Yield, handover risk, payment structure and comparable pricing are computed for every unit — so a shortlist is reasoned, never guessed.",
  },
  {
    icon: Handshake,
    kicker: "Layer 04",
    title: "A human advisor takes it from there",
    body: "The machine narrows 900+ projects to a handful. A licensed JBJ advisor negotiates, structures the payment plan and handles the paperwork.",
  },
  {
    icon: KeyRound,
    kicker: "Layer 05",
    title: "And we stay after handover",
    body: "Snagging, furnishing, leasing, resale and reporting all run on the same record — one continuous file for the life of the asset.",
  },
];

export default function InnovationLabSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const inView = useInView(sectionRef, { amount: 0.35 });

  // Auto-assemble while the section is on screen; steps are also clickable.
  useEffect(() => {
    if (!inView) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % LAYERS.length);
    }, 3400);
    return () => window.clearInterval(id);
  }, [inView]);

  const stageRotate = 22 - active * 2;
  const stageSpin = -20 + active * 7;

  return (
    <div ref={sectionRef} className="relative py-14 md:py-20">
      <div className="flex items-center">

        <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] gap-8 lg:gap-12 items-center px-5 md:px-8">
          {/* Narrative */}
          <div className="order-2 lg:order-1 min-w-0">
            <span className="text-[10px] uppercase tracking-[0.24em] font-bold text-[#064E3B]">
              The JBJ method
            </span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold leading-[1.05] text-[#1A1A1A]">
              How we build
              <span className="block text-[#064E3B]">a property decision</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm md:text-base text-[#1A1A1A]/70 leading-relaxed">
              Most agencies forward you a brochure. We assemble a real estate operating
              system — layer by layer — and hand you the conclusion.
            </p>

            <ol className="mt-7 space-y-2.5">
              {LAYERS.map((layer, i) => {
                const isActive = i === active;
                return (
                  <li key={layer.title}>
                    <button type="button" onClick={() => setActive(i)} className="w-full text-left">
                    <motion.div
                      animate={{ opacity: isActive ? 1 : 0.42 }}
                      transition={{ duration: 0.35 }}
                      className={`rounded-xl border px-4 py-3 md:py-3.5 flex gap-3 items-start ${
                        isActive
                          ? "border-[#B89555]/60 bg-[#FDFBF7] shadow-[0_10px_28px_rgba(184,149,85,0.18)]"
                          : "border-[#B89555]/25 bg-transparent"
                      }`}
                    >
                      <span
                        data-emerald-action="true"
                        className="jj-emerald-action w-8 h-8 shrink-0 rounded-lg flex items-center justify-center"
                      >
                        <layer.icon className="w-4 h-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[9px] uppercase tracking-[0.2em] font-bold text-[#064E3B]">
                          {layer.kicker}
                        </span>
                        <span className="block text-sm md:text-base font-semibold text-[#1A1A1A] leading-snug">
                          {layer.title}
                        </span>
                        {isActive && (
                          <motion.span
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 block text-xs md:text-sm text-[#1A1A1A]/70 leading-relaxed"
                          >
                            {layer.body}
                          </motion.span>
                        )}
                      </span>
                    </motion.div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* 3D stage */}
          <div className="order-1 lg:order-2 flex items-center justify-center">
            <motion.div
              aria-hidden
              className="relative w-full max-w-[440px] aspect-square"
              style={{
                perspective: 1200,
                transformStyle: "preserve-3d",
                rotateX: stageRotate,
                rotateZ: stageSpin,
              }}
            >
              {LAYERS.map((layer, i) => {
                const isBuilt = i <= active;
                return (
                  <motion.div
                    key={layer.title}
                    className="absolute left-1/2 top-1/2 w-[74%] h-[74%] rounded-[26px] border"
                    style={{
                      transformStyle: "preserve-3d",
                      borderColor: i === active ? "rgba(184,149,85,0.85)" : "rgba(184,149,85,0.35)",
                      background:
                        i === active
                          ? "linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)"
                          : "linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 60%, #EFE6D6 100%)",
                      boxShadow:
                        i === active
                          ? "0 26px 60px -18px rgba(4,44,28,0.65)"
                          : "0 16px 40px -22px rgba(184,149,85,0.5)",
                    }}
                    animate={{
                      x: "-50%",
                      y: "-50%",
                      z: isBuilt ? (i - active) * 58 : 240,
                      opacity: isBuilt ? 1 : 0,
                      scale: isBuilt ? 1 - Math.abs(i - active) * 0.045 : 0.82,
                    }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <layer.icon
                        className="w-10 h-10"
                        style={{ color: i === active ? "#FFFFFF" : "#064E3B", opacity: i === active ? 1 : 0.5 }}
                        aria-hidden
                      />
                    </div>
                    <span
                      className="absolute left-5 top-4 text-[9px] uppercase tracking-[0.22em] font-bold"
                      style={{ color: i === active ? "#FFFFFF" : "#064E3B" }}
                    >
                      {layer.kicker}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
