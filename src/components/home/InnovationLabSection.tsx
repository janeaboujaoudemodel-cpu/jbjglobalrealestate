import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Database, ShieldCheck, Brain, Handshake, KeyRound } from "lucide-react";
import jbjMonogramWatermark from "@/assets/jbj-monogram-transparent.png";

type Stage = {
  icon: typeof Database;
  index: string;
  kicker: string;
  title: string;
  body: string;
  metrics: { label: string; value: string }[];
};

const STAGES: Stage[] = [
  {
    icon: Database,
    index: "01",
    kicker: "Ingestion",
    title: "Ingest the whole market",
    body: "Every launch, price list, payment plan and floor plan across the UAE, Cyprus, Greece, Georgia and Lebanon lands in one structured record.",
    metrics: [
      { label: "Markets", value: "5" },
      { label: "Live records", value: "900+" },
      { label: "Refresh", value: "Daily" },
    ],
  },
  {
    icon: ShieldCheck,
    index: "02",
    kicker: "Verification",
    title: "Verify it line by line",
    body: "Each figure is cross-checked against the developer's own release before it is allowed onto the platform.",
    metrics: [
      { label: "Source", value: "Developer" },
      { label: "Checks", value: "12 / unit" },
      { label: "Unverified", value: "Blocked" },
    ],
  },
  {
    icon: Brain,
    index: "03",
    kicker: "AI engine",
    title: "AI reads it like an analyst",
    body: "Yield, handover risk, payment structure and comparable pricing are computed for every unit, then explained in plain language.",
    metrics: [
      { label: "Yield", value: "Modelled" },
      { label: "Risk", value: "Scored" },
      { label: "Comps", value: "Matched" },
    ],
  },
  {
    icon: Handshake,
    index: "04",
    kicker: "Advisory",
    title: "A human advisor takes over",
    body: "A licensed JBJ advisor negotiates, structures the payment plan and handles the paperwork end to end.",
    metrics: [
      { label: "Licensed", value: "RERA" },
      { label: "Negotiation", value: "Included" },
      { label: "Paperwork", value: "Handled" },
    ],
  },
  {
    icon: KeyRound,
    index: "05",
    kicker: "Lifecycle",
    title: "We stay after handover",
    body: "Snagging, furnishing, leasing, resale and reporting all run on the same record you invested from.",
    metrics: [
      { label: "Snagging", value: "Managed" },
      { label: "Leasing", value: "Managed" },
      { label: "Reporting", value: "Ongoing" },
    ],
  },
];

const EMERALD_INK = "linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #000000 100%)";

/** Ambient AI-tech field: drifting scanlines + orbiting gold nodes. */
function TechField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute inset-[-40%]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(184,149,85,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(184,149,85,0.10) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          transform: "rotateX(62deg)",
        }}
        animate={{ backgroundPositionY: ["0px", "64px"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${18 + i * 28}%`,
            top: `${28 + i * 16}%`,
            height: 6,
            width: 6,
            background: "#B89555",
            boxShadow: "0 0 18px 4px rgba(184,149,85,0.45)",
          }}
          animate={{ y: [0, -26, 0], opacity: [0.25, 0.9, 0.25] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
        />
      ))}
    </div>
  );
}

export default function InnovationLabSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [live, setLive] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setLive(true)),
      { threshold: 0.2 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!live || paused) return;
    const t = window.setInterval(() => setActive((p) => (p + 1) % STAGES.length), 4200);
    return () => window.clearInterval(t);
  }, [live, paused]);

  const stage = STAGES[active];
  const ActiveIcon = stage.icon;

  return (
    <div ref={sectionRef} data-jbj-method="true" className="relative">
      <img
        data-no-fallback
        src={jbjMonogramWatermark}
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 w-[560px] max-w-[90%] -translate-x-1/2 -translate-y-1/2 select-none object-contain opacity-[0.045] md:w-[760px]"
        loading="lazy"
        decoding="async"
      />

      <div className="relative overflow-hidden py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 md:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          {/* ---------- Narrative rail ---------- */}
          <div className="order-2 space-y-8 lg:order-1">
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B89555]">The JBJ method</p>
              <h2 className="font-serif text-3xl leading-[1.08] text-[#042c1c] md:text-5xl">
                How we build
                <br />a property decision
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-[#042c1c]/70 md:text-base">
                Most agencies forward you a brochure. We run a real estate operating system — five live stages — and
                hand you the conclusion.
              </p>
            </div>

            <ol className="relative space-y-1">
              <span className="absolute left-4 top-4 bottom-4 w-px bg-[#B89555]/25" aria-hidden />
              {STAGES.map((s, i) => {
                const on = i === active;
                return (
                  <li key={s.index}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      onMouseEnter={() => setPaused(true)}
                      onMouseLeave={() => setPaused(false)}
                      className="!flex w-full !items-center !justify-start gap-4 rounded-lg px-1 py-2 text-left"
                    >
                      <span
                        className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-all"
                        style={
                          on
                            ? { background: "#B89555", color: "#fff", boxShadow: "0 0 0 5px rgba(184,149,85,0.16)" }
                            : { background: "#FDFBF7", color: "#B89555", border: "1px solid rgba(184,149,85,0.4)" }
                        }
                      >
                        {s.index}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-[12px] font-semibold uppercase tracking-[0.12em] text-[#042c1c] transition-opacity md:text-sm ${
                            on ? "opacity-100" : "opacity-55"
                          }`}
                        >
                          {s.title}
                        </span>
                        <span className="mt-1 block h-[2px] w-full max-w-[190px] overflow-hidden rounded-full bg-[#B89555]/15">
                          <motion.span
                            className="block h-full rounded-full bg-[#B89555]"
                            initial={false}
                            animate={{ width: on ? "100%" : "0%" }}
                            transition={{ duration: on && !paused ? 4.2 : 0.3, ease: "linear" }}
                          />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* ---------- 3D stage: one readable panel, deck receding behind ---------- */}
          <div
            className="order-1 lg:order-2"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative w-full md:h-[440px]" style={{ perspective: 1400 }}>
              <TechField />

              {/* Receding ghost plates — decorative only, never hold text.
                  Hidden on phones so nothing can sit on top of the copy. */}
              {[3, 2, 1].map((depth) => (
                <motion.div
                  key={depth}
                  className="hidden md:absolute md:left-1/2 md:top-1/2 md:block rounded-2xl border"
                  style={{
                    height: "68%",
                    width: "84%",
                    marginLeft: "-42%",
                    marginTop: "-34%",
                    background: EMERALD_INK,
                    borderColor: "rgba(255,255,255,0.10)",
                    transformStyle: "preserve-3d",
                    zIndex: 10 - depth,
                  }}
                  animate={{
                    y: [-depth * 16, -depth * 16 - 6, -depth * 16],
                    x: depth * 10,
                    rotateX: 8,
                    rotateY: -10,
                    scale: 1 - depth * 0.05,
                    opacity: 0.34 - depth * 0.07,
                  }}
                  transition={{ duration: 5 + depth, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden
                />
              ))}

              {/* Active panel */}
              <AnimatePresence mode="wait">
                <motion.article
                  key={stage.index}
                  data-ink-emerald="true"
                  data-surface="dark"
                  className="absolute left-1/2 top-1/2 flex flex-col justify-between overflow-hidden rounded-2xl border p-6 md:p-8"
                  style={{
                    height: "78%",
                    width: "92%",
                    marginLeft: "-46%",
                    marginTop: "-39%",
                    background: EMERALD_INK,
                    borderColor: "rgba(184,149,85,0.38)",
                    boxShadow: "0 44px 90px -30px rgba(4,44,28,0.65)",
                    transformStyle: "preserve-3d",
                    zIndex: 20,
                  }}
                  initial={{ opacity: 0, y: 34, rotateX: 16, rotateY: -14, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, rotateX: 5, rotateY: -6, scale: 1 }}
                  exit={{ opacity: 0, y: -26, rotateX: -8, rotateY: 6, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                >
                  {/* sheen sweep */}
                  <motion.span
                    className="pointer-events-none absolute inset-y-0 w-1/3"
                    style={{
                      background:
                        "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.10) 45%, transparent 100%)",
                    }}
                    animate={{ x: ["-120%", "360%"] }}
                    transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden
                  />

                  <header className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4B87A]">
                        Stage {stage.index} — {stage.kicker}
                      </p>
                      <h3 className="mt-2 font-serif text-2xl leading-tight text-white md:text-[32px]">
                        {stage.title}
                      </h3>
                    </div>
                    <span
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border"
                      style={{ borderColor: "rgba(184,149,85,0.45)", background: "rgba(255,255,255,0.08)" }}
                    >
                      <ActiveIcon className="h-5 w-5 text-white" strokeWidth={1.9} aria-hidden />
                    </span>
                  </header>

                  <p className="relative mt-4 max-w-xl text-sm leading-relaxed text-white/85 md:text-[15px]">
                    {stage.body}
                  </p>

                  <div className="relative mt-6 grid grid-cols-3 gap-3">
                    {stage.metrics.map((m, i) => (
                      <motion.div
                        key={m.label}
                        className="rounded-xl border px-3 py-2.5"
                        style={{ borderColor: "rgba(255,255,255,0.16)", background: "rgba(255,255,255,0.06)" }}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18 + i * 0.08, duration: 0.35 }}
                      >
                        <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">
                          {m.label}
                        </span>
                        <span className="mt-1 block text-sm font-semibold text-white md:text-base">{m.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
