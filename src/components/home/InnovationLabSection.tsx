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
const HAIRLINE = "rgba(255,255,255,0.16)";

/** Corner brackets that make the console frame legible as a structure. */
function Brackets() {
  const base = "pointer-events-none absolute z-20 h-5 w-5 border-white/45";
  return (
    <>
      <span className={`${base} left-3 top-3 border-l border-t`} aria-hidden />
      <span className={`${base} right-3 top-3 border-r border-t`} aria-hidden />
      <span className={`${base} bottom-3 left-3 border-b border-l`} aria-hidden />
      <span className={`${base} bottom-3 right-3 border-b border-r`} aria-hidden />
    </>
  );
}

/** Wireframe mesh + node network inside the console — the "AI tech" texture. */
function Wireframe() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-70"
      style={{
        maskImage: "linear-gradient(to top, #000 0%, rgba(0,0,0,0.35) 55%, transparent 92%)",
        WebkitMaskImage: "linear-gradient(to top, #000 0%, rgba(0,0,0,0.35) 55%, transparent 92%)",
      }}
      viewBox="0 0 400 260"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="jbj-mesh-fade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.13)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
      </defs>
      {Array.from({ length: 5 }).map((_, i) => (
        <line
          key={`v${i}`}
          x1={i * 95}
          y1={0}
          x2={i * 95 - 70}
          y2={260}
          stroke="url(#jbj-mesh-fade)"
          strokeWidth="0.6"
        />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={i * 43}
          x2={400}
          y2={i * 43}
          stroke="rgba(255,255,255,0.045)"
          strokeWidth="0.6"
        />
      ))}
      <motion.polyline
        points="20,220 90,170 150,190 220,110 300,140 380,70"
        fill="none"
        stroke="#D4B87A"
        strokeWidth="1"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.5 }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />
      {[
        [90, 170],
        [220, 110],
        [380, 70],
      ].map(([cx, cy], i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r="2.6"
          fill="#D4B87A"
          animate={{ opacity: [0.3, 1, 0.3], r: [2.2, 3.4, 2.2] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
        />
      ))}
    </svg>
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
    const t = window.setInterval(() => setActive((p) => (p + 1) % STAGES.length), 4600);
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
                            transition={{ duration: on && !paused ? 4.6 : 0.3, ease: "linear" }}
                          />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* ---------- Geometric AI console ---------- */}
          <div
            className="order-2 lg:order-2"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Static, fully contained frame so the structure is always readable. */}
            <div className="relative w-full pl-3 pt-3 md:pl-5 md:pt-5">
              {/* Depth plates: visible, offset, hairlined — they read as a stack. */}
              <div
                className="pointer-events-none absolute inset-0 -translate-x-3 -translate-y-3 rounded-[20px] border md:-translate-x-5 md:-translate-y-5"
                style={{ borderColor: "rgba(6,78,59,0.22)", background: "rgba(6,78,59,0.05)" }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 -translate-x-1.5 -translate-y-1.5 rounded-[20px] border md:-translate-x-2.5 md:-translate-y-2.5"
                style={{ borderColor: "rgba(6,78,59,0.32)", background: "rgba(6,78,59,0.10)" }}
                aria-hidden
              />

              <article
                data-ink-emerald="true"
                data-surface="dark"
                className="relative isolate overflow-hidden rounded-[20px] border"
                style={{
                  background: EMERALD_INK,
                  borderColor: HAIRLINE,
                  boxShadow: "0 40px 80px -34px rgba(4,44,28,0.6)",
                }}
              >
                <Wireframe />
                <Brackets />

                {/* Scanning beam — the "AI reading" cue. */}
                <motion.span
                  className="pointer-events-none absolute inset-y-0 w-24"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(212,184,122,0.14) 50%, transparent 100%)",
                  }}
                  animate={{ x: ["-20%", "560%"] }}
                  transition={{ duration: 6.5, repeat: Infinity, ease: "linear" }}
                  aria-hidden
                />

                {/* HUD top rail */}
                <div
                  className="relative z-10 flex items-center justify-between gap-3 border-b px-5 py-3 md:px-7"
                  style={{ borderColor: HAIRLINE }}
                >
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-[#D4B87A]"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                      aria-hidden
                    />
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/70">
                      JBJ decision engine
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5" aria-hidden>
                    {STAGES.map((s, i) => (
                      <span
                        key={s.index}
                        className="h-1 rounded-full transition-all"
                        style={{
                          width: i === active ? 22 : 8,
                          background: i === active ? "#D4B87A" : "rgba(255,255,255,0.22)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div className="relative z-10 px-5 py-6 md:min-h-[300px] md:px-7 md:py-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={stage.index}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <header className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4B87A]">
                            Stage {stage.index} — {stage.kicker}
                          </p>
                          <h3 className="mt-2 font-serif text-2xl leading-tight text-white md:text-[32px]">
                            {stage.title}
                          </h3>
                        </div>
                        <span
                          className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border"
                          style={{ borderColor: HAIRLINE, background: "rgba(255,255,255,0.08)" }}
                        >
                          <motion.span
                            className="absolute inset-0 rounded-xl border"
                            style={{ borderColor: "rgba(212,184,122,0.35)" }}
                            animate={{ opacity: [0.15, 0.7, 0.15], scale: [0.94, 1.06, 0.94] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            aria-hidden
                          />
                          <ActiveIcon className="h-5 w-5 text-white" strokeWidth={1.9} aria-hidden />
                        </span>
                      </header>

                      <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 md:text-[15px]">
                        {stage.body}
                      </p>

                      <div className="mt-6 grid grid-cols-3 gap-2.5 md:gap-3">
                        {stage.metrics.map((m, i) => (
                          <motion.div
                            key={m.label}
                            className="relative overflow-hidden rounded-xl border px-3 py-2.5"
                            style={{ borderColor: HAIRLINE, background: "rgba(255,255,255,0.06)" }}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.14 + i * 0.08, duration: 0.35 }}
                          >
                            <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">
                              {m.label}
                            </span>
                            <span className="mt-1 block text-sm font-semibold text-white md:text-base">
                              {m.value}
                            </span>
                            <motion.span
                              className="absolute bottom-0 left-0 h-[2px] bg-[#D4B87A]/70"
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ delay: 0.2 + i * 0.1, duration: 0.9, ease: "easeOut" }}
                              aria-hidden
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
