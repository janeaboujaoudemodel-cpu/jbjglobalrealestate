import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import { Database, ShieldCheck, Brain, Handshake, KeyRound } from "lucide-react";
import jbjMonogramWatermark from "@/assets/jbj-monogram-transparent.png";


type Layer = {
  icon: typeof Database;
  index: string;
  title: string;
  body: string;
  plateLabel: string;
  tone: "champagne" | "emerald" | "ink";
};

const LAYERS: Layer[] = [
  {
    icon: Database,
    index: "01",
    title: "Ingest the whole market",
    body: "Every launch, price list, payment plan and floor plan across the UAE, Cyprus, Greece, Georgia and Lebanon lands in one structured record.",
    plateLabel: "Layer 01 / Raw market data",
    tone: "ink",
  },
  {
    icon: ShieldCheck,
    index: "02",
    title: "Verify it line by line",
    body: "Each figure is cross-checked against the developer's own release before it is allowed on the platform.",
    plateLabel: "Layer 02 / Verification",
    tone: "emerald",
  },
  {
    icon: Brain,
    index: "03",
    title: "AI reads it like an analyst",
    body: "Yield, handover risk, payment structure and comparable pricing are computed for every unit.",
    plateLabel: "Layer 03 / AI engine",
    tone: "emerald",
  },
  {
    icon: Handshake,
    index: "04",
    title: "A human advisor takes over",
    body: "A licensed JBJ advisor negotiates, structures the payment plan and handles the paperwork.",
    plateLabel: "Layer 04 / Advisory",
    tone: "champagne",
  },
  {
    icon: KeyRound,
    index: "05",
    title: "We stay after handover",
    body: "Snagging, furnishing, leasing, resale and reporting all run on the same record.",
    plateLabel: "Layer 05 / Lifecycle",
    tone: "champagne",
  },
];

const PLATE_BG: Record<Layer["tone"], string> = {
  ink: "linear-gradient(135deg, #042c1c 0%, #021a12 55%, #000000 100%)",
  emerald: "linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #000000 100%)",
  champagne: "linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 60%, #EFE6D6 100%)",
};

/** Content that actually lives on each isometric plate — no empty slabs. */
function PlateContent({ layer, active }: { layer: Layer; active: boolean }) {
  const dark = layer.tone !== "champagne";
  const ink = dark ? "text-white" : "text-[#042c1c]";
  const soft = dark ? "text-white/55" : "text-[#042c1c]/55";
  const line = dark ? "bg-white/20" : "bg-[#B89555]/30";
  const Icon = layer.icon;

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-xl p-5 ${
        dark ? "[&_*]:!text-white" : ""
      }`}
      {...(dark ? { "data-ink-emerald": "true" } : {})}
    >
      {dark && (
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "38px 38px" }}
          aria-hidden
        />
      )}
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <span className={`text-[9px] font-bold uppercase tracking-[0.22em] ${soft}`}>{layer.plateLabel}</span>
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border ${
              dark ? "border-white/25 bg-white/10" : "border-[#B89555]/35 bg-white"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 ${dark ? "text-white" : "text-[#064E3B]"}`} strokeWidth={2} aria-hidden />
          </span>
        </div>

        {/* Per-layer technical content */}
        {layer.index === "01" && (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-white" : "bg-[#064E3B]"}`}
                style={{ opacity: 0.3 + ((i * 3) % 3) * 0.2 }}
              />
            ))}
          </div>
        )}


        {layer.index === "02" && (
          <div className="space-y-1.5">
            {[100, 74, 88, 60].map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-[#B89555]" : "bg-[#064E3B]"}`} />
                <span className={`h-px ${line}`} style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        )}

        {layer.index === "03" && (
          <div className="space-y-2">
            <div className="flex items-end gap-1">
              {[34, 58, 42, 76, 50, 66, 30].map((h, i) => (
                <span
                  key={i}
                  className={`w-1.5 rounded-sm ${dark ? "bg-[#B89555]" : "bg-[#064E3B]"}`}
                  style={{ height: h * 0.4, opacity: active ? 0.9 : 0.5 }}
                />
              ))}
            </div>
            <span className={`block font-mono text-[9px] ${soft}`}>YIELD · RISK · COMPARABLES</span>
          </div>
        )}

        {layer.index === "04" && (
          <div className="grid grid-cols-2 gap-2">
            {["Negotiation", "Payment plan"].map((t) => (
              <div key={t} className="rounded-md border border-[#B89555]/25 bg-white/70 px-2 py-1.5">
                <span className="block text-[9px] font-semibold uppercase tracking-wider text-[#042c1c]">{t}</span>
                <span className="mt-1 block h-1 w-full rounded-full bg-[#B89555]/25">
                  <span className="block h-1 w-2/3 rounded-full bg-[#B89555]" />
                </span>
              </div>
            ))}
          </div>
        )}

        {layer.index === "05" && (
          <div className="space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#042c1c]">
              Snagging · Leasing · Resale
            </span>
            <span className="block h-1 w-full overflow-hidden rounded-full bg-[#B89555]/20">
              <span className="block h-full w-[85%] bg-[#B89555]" />
            </span>
          </div>
        )}

        <span className={`text-[11px] font-semibold leading-snug ${ink}`}>{layer.title}</span>
      </div>
    </div>
  );
}

export default function InnovationLabSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [assembled, setAssembled] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setAssembled(true)),
      { threshold: 0.25 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!assembled || paused) return;
    const t = window.setInterval(() => setActive((p) => (p + 1) % LAYERS.length), 3200);
    return () => window.clearInterval(t);
  }, [assembled, paused]);

  const tilt = 44;
  const spin = -22;


  return (
    <div
      ref={sectionRef}
      data-jbj-method="true"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Premium brand watermark */}
      <img
        data-no-fallback
        src={jbjMonogramWatermark}
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 w-[560px] max-w-[90%] -translate-x-1/2 -translate-y-1/2 select-none object-contain opacity-[0.045] md:w-[760px]"
        loading="lazy"
        decoding="async"
      />
      <div className="relative flex min-h-[640px] items-center overflow-hidden py-16 md:py-20">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 md:px-8 lg:grid-cols-2 lg:gap-16">


          {/* Narrative rail */}
          <div className="order-2 space-y-8 lg:order-1">
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B89555]">The JBJ method</p>
              <h2 className="font-serif text-3xl leading-[1.08] text-[#042c1c] md:text-5xl">
                How we build
                <br />a property decision
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-[#042c1c]/70 md:text-base">
                Most agencies forward you a brochure. We assemble a real estate operating system — layer by layer — and
                hand you the conclusion.
              </p>
            </div>

            <ol className="relative space-y-4">
              <span className="absolute left-4 top-3 bottom-3 w-px bg-[#B89555]/30" aria-hidden />
              {LAYERS.map((layer, i) => {
                const on = i === active;
                return (
                  <li key={layer.index}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      className="flex w-full items-start gap-5 text-left"
                    >
                      <span
                        className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-colors ${
                          on ? "bg-[#B89555] text-white" : "border border-[#B89555]/40 bg-[#FDFBF7] text-[#B89555]"
                        }`}
                      >
                        {layer.index}
                      </span>
                      <span className="min-w-0 text-left">
                        <span
                          className={`block text-left text-[12px] font-semibold uppercase tracking-[0.12em] transition-opacity md:text-sm ${
                            on ? "text-[#042c1c] opacity-100" : "text-[#042c1c] opacity-55"
                          }`}
                        >
                          {layer.title}
                        </span>
                        <motion.span
                          initial={false}
                          animate={{ opacity: on ? 1 : 0, height: on ? "auto" : 0 }}
                          transition={{ duration: 0.25 }}
                          className="block overflow-hidden text-left text-xs leading-relaxed text-[#042c1c]/65 md:text-sm"
                        >
                          {layer.body}
                        </motion.span>
                      </span>

                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Isometric plate stack */}
          <div className="order-1 flex h-[380px] items-center justify-center lg:order-2 lg:h-[560px]">
            <div className="relative h-full w-full" style={{ perspective: 1500 }}>
              {LAYERS.map((layer, i) => {
                const on = i === active;
                // 05 sits on top; 01 at the base.
                return (
                  <motion.div
                    key={layer.index}
                    onClick={() => setActive(i)}
                    className="absolute left-1/2 top-1/2 h-[170px] w-[270px] cursor-pointer rounded-xl border lg:h-[220px] lg:w-[330px]"
                    style={{
                      background: PLATE_BG[layer.tone],
                      borderColor: layer.tone === "champagne" ? "rgba(184,149,85,0.4)" : "rgba(255,255,255,0.14)",
                      zIndex: 10 + i * 10,
                      transformStyle: "preserve-3d",
                      boxShadow: on
                        ? "0 34px 70px -18px rgba(4,44,28,0.5)"
                        : "0 18px 44px -22px rgba(4,44,28,0.35)",
                    }}
                    initial={{ x: -150, y: -85, opacity: 0, rotateX: tilt, rotateZ: spin }}
                    animate={
                      assembled
                        ? {
                            x: -178 + (i - 2) * 24 + (on ? 40 : 0),
                            y: -80 + (i - 2) * -104 + (on ? -26 : 0),
                            scale: on ? 1.08 : 0.98,
                            opacity: on ? 1 : 0.72,
                            rotateX: on ? 24 : tilt,
                            rotateZ: on ? -10 : spin,
                            rotateY: on ? 3 : 0,
                          }
                        : { x: -150, y: -85, opacity: 0, rotateX: tilt, rotateZ: spin }
                    }
                    whileHover={{
                      rotateX: 14,
                      rotateZ: -6,
                      rotateY: 0,
                      scale: 1.12,
                      x: -178 + (i - 2) * 24 + 56,
                      y: -80 + (i - 2) * -104 - 34,
                      opacity: 1,
                      transition: { type: "spring", stiffness: 180, damping: 18 },
                    }}
                    whileTap={{ scale: 1.03 }}

                    transition={{ type: "spring", stiffness: 110, damping: 20, delay: assembled ? i * 0.09 : 0 }}
                  >
                    <PlateContent layer={layer} active={on} />
                  </motion.div>

                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
