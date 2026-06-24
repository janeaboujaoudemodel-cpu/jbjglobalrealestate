import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, ArrowRight, ShieldCheck, Trophy, Users, Users2 } from "lucide-react";

type Stat = {
  prefix?: string;
  suffix?: string;
  target: number;
  display?: (n: number) => string;
  label: string;
  sublabel?: string;
  icon: typeof Globe;
};

const microStats: Stat[] = [
  { target: 0, suffix: "%", label: "Income Tax", sublabel: "Personal · Capital Gains", icon: Globe },
  { target: 10, suffix: " Yr", label: "Golden Visa", sublabel: "Renewable Residency", icon: ShieldCheck },
  { prefix: "#", target: 1, label: "Safest City", sublabel: "Numbeo Global Index", icon: Trophy },
  { target: 200, suffix: "+", label: "Nationalities", sublabel: "Cosmopolitan Hub", icon: Users },
  { target: 4, suffix: "×", label: "Co-Owners", sublabel: "25% Each on Title Deed", icon: Users2 },
];

const useCountUp = (target: number, start: boolean, duration = 1600) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (target === 0) { setVal(0); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);
  return val;
};

const AnimatedStat = ({ stat, start, index }: { stat: Stat; start: boolean; index: number }) => {
  const Icon = stat.icon;
  const val = useCountUp(stat.target, start);
  const display = stat.display ? stat.display(val) : String(val);
  return (
    <div
      className="oi-stat group/stat relative flex flex-col items-start gap-3 px-6 py-5 lg:px-7 lg:py-6 transition-all duration-500"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center border border-[#B89555]/45 bg-gradient-to-br from-[#B89555]/15 to-transparent">
          <Icon className="h-4 w-4" style={{ color: "#E6C97A", stroke: "#E6C97A" }} strokeWidth={2} />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">
          {stat.label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-[2.4rem] font-extrabold leading-none tabular-nums sm:text-[2.8rem] lg:text-[3rem]"
          style={{
            background: "linear-gradient(180deg, #F5E4B3 0%, #B89555 65%, #8A6B36 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
            letterSpacing: "-0.02em",
          }}
        >
          {stat.prefix ?? ""}{display}{stat.suffix ?? ""}
        </span>
      </div>
      {stat.sublabel && (
        <span className="text-[10.5px] font-medium tracking-[0.04em] text-white/45">
          {stat.sublabel}
        </span>
      )}
    </div>
  );
};

const OverseasInvestorsStrip = () => {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      className="jj-fullbleed-band relative w-full overflow-hidden"
      data-fullbleed-band
      style={{ background: "#FDFBF7" }}
    >
      <style>{`
        @keyframes oi-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .oi-shimmer-text {
          background: linear-gradient(90deg, #B89555 0%, #F5E4B3 50%, #B89555 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: oi-shimmer 6s linear infinite;
        }
        @keyframes oi-orb-drift {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.55; }
          50% { transform: translate(20px,-12px) scale(1.08); opacity: 0.9; }
        }
        .oi-orb { animation: oi-orb-drift 9s ease-in-out infinite; }
        @keyframes oi-stat-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .oi-stat { animation: oi-stat-in 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .oi-stat::before {
          content: "";
          position: absolute;
          left: 0; top: 18%; bottom: 18%;
          width: 1px;
          background: linear-gradient(180deg, transparent, rgba(184,149,85,0.42), transparent);
        }
        .oi-stat:first-child::before { display: none; }
        @media (max-width: 1023px) {
          .oi-stat::before { display: none; }
        }
        .oi-grain {
          background-image: radial-gradient(rgba(184,149,85,0.06) 1px, transparent 1px);
          background-size: 3px 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .oi-shimmer-text, .oi-orb, .oi-stat { animation: none !important; }
        }
      `}</style>

      <Link
        ref={ref}
        to="/overseas-investors"
        aria-label="Invest in Dubai from anywhere in the world — discover the opportunity"
        data-surface="dark"
        data-on-dark
        data-no-contrast-guard
        className="allow-white group relative block w-full overflow-hidden px-6 py-10 sm:px-10 md:px-16 md:py-12 lg:px-20 lg:py-14"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 20% 0%, #1a1610 0%, transparent 60%), radial-gradient(ellipse 60% 100% at 100% 100%, #0f0d09 0%, transparent 55%), linear-gradient(135deg, #050505 0%, #0E0C08 48%, #030303 100%)",
          borderTop: "1px solid rgba(184,149,85,0.32)",
          borderBottom: "1px solid rgba(184,149,85,0.32)",
          color: "#FFFFFF",
        }}
      >
        {/* Ambient layers */}
        <span aria-hidden className="pointer-events-none absolute inset-0 oi-grain opacity-50" />
        <span aria-hidden className="oi-orb pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#B89555]/12 blur-[100px]" />
        <span aria-hidden className="oi-orb pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#B89555]/10 blur-[120px]" style={{ animationDelay: "2s" }} />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[3px]" style={{ background: "linear-gradient(180deg, transparent, #B89555 50%, transparent)" }} />

        {/* Header row */}
        <div className="relative z-[1] mx-auto flex w-full max-w-[1600px] flex-col gap-6 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center border border-[#B89555]/50 bg-[#B89555]/10">
                <Globe className="h-3.5 w-3.5" style={{ color: "#E6C97A", stroke: "#E6C97A" }} strokeWidth={2} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: "#B89555" }}>
                Global Investors
              </span>
              <span aria-hidden className="h-px w-16 bg-gradient-to-r from-[#B89555]/60 to-transparent" />
            </div>

            <h2 className="block max-w-[920px] text-[1.85rem] font-extrabold leading-[1.02] tracking-[-0.02em] sm:text-[2.4rem] md:text-[3rem] lg:text-[3.4rem]" style={{ color: "#FFFFFF" }}>
              Invest in Dubai from{" "}
              <em className="oi-shimmer-text not-italic font-extrabold">anywhere</em>{" "}
              in the world
            </h2>
            <p className="mt-4 max-w-[640px] text-[13px] font-medium leading-relaxed text-white/55 sm:text-[14px]">
              Sovereign-grade infrastructure, zero income tax, and a decade-long residency programme — engineered for international capital.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-3 border border-[#B89555]/45 bg-[#B89555]/5 px-6 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white transition-all duration-300 group-hover:border-[#B89555] group-hover:bg-[#B89555]/15">
            <span>Discover the opportunity</span>
            <span className="inline-flex h-7 w-7 items-center justify-center" style={{ background: "#B89555" }}>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" style={{ color: "#0A0A0A", stroke: "#0A0A0A" }} strokeWidth={2.4} />
            </span>
          </span>
        </div>

        {/* Divider */}
        <div className="relative z-[1] mx-auto mt-10 flex w-full max-w-[1600px] items-center gap-4">
          <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(184,149,85,0.45), rgba(184,149,85,0.45), transparent)" }} />
          <span className="text-[9px] font-bold uppercase tracking-[0.45em] text-[#B89555]/80">By the Numbers</span>
          <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(184,149,85,0.45), rgba(184,149,85,0.45), transparent)" }} />
        </div>

        {/* Stats grid */}
        <div className="relative z-[1] mx-auto mt-6 grid w-full max-w-[1600px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {microStats.map((s, i) => (
            <AnimatedStat key={s.label} stat={s} start={inView} index={i} />
          ))}
        </div>
      </Link>
    </section>
  );
};

export default OverseasInvestorsStrip;
