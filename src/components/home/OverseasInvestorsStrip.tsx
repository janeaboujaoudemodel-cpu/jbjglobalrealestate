import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, ArrowRight, ShieldCheck, Trophy, Users, Users2 } from "lucide-react";

type Stat = {
  prefix?: string;
  suffix?: string;
  target: number;
  label: string;
  icon: typeof Globe;
};

const EMERALD = "#0B5D43";
const EMERALD_DEEP = "#063A2A";
const EMERALD_BRIGHT = "#10C285";

const microStats: Stat[] = [
  { target: 0, suffix: "%", label: "Income Tax", icon: Globe },
  { target: 10, suffix: " Yr", label: "Golden Visa", icon: ShieldCheck },
  { prefix: "#", target: 1, label: "Safest City", icon: Trophy },
  { target: 200, suffix: "+", label: "Nationalities", icon: Users },
  { target: 4, suffix: "×", label: "Co-Owners", icon: Users2 },
];

const useCountUp = (target: number, start: boolean, duration = 1400) => {
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
  return (
    <div
      className="oi-stat group/stat flex flex-col items-center gap-1.5 px-3 py-2 text-center"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Icon className="h-4 w-4 text-white/80" strokeWidth={1.75} />
      <span className="text-[1.5rem] font-bold leading-none tabular-nums text-white sm:text-[1.75rem]" style={{ letterSpacing: "-0.02em" }}>
        {stat.prefix ?? ""}{val}{stat.suffix ?? ""}
      </span>
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-white/65">
        {stat.label}
      </span>
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
      data-surface="dark"
      data-on-dark
      data-no-contrast-guard
    >
      <style>{`
        @keyframes oi-orb-drift {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.55; }
          50% { transform: translate(18px,-10px) scale(1.06); opacity: 0.85; }
        }
        .oi-orb { animation: oi-orb-drift 10s ease-in-out infinite; }
        @keyframes oi-stat-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .oi-stat { animation: oi-stat-in 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .oi-orb, .oi-stat { animation: none !important; }
        }
      `}</style>

      <Link
        ref={ref}
        to="/overseas-investors"
        aria-label="Invest in Dubai from anywhere in the world — discover the opportunity"
        data-surface="dark"
        data-on-dark
        data-no-contrast-guard
        className="allow-white group relative block w-full overflow-hidden px-6 py-7 sm:px-10 md:px-14 md:py-8 lg:px-16"
        style={{
          background: `radial-gradient(ellipse 80% 100% at 0% 0%, ${EMERALD} 0%, transparent 60%), radial-gradient(ellipse 70% 100% at 100% 100%, ${EMERALD_BRIGHT}22 0%, transparent 55%), linear-gradient(135deg, ${EMERALD_DEEP} 0%, #052A1E 50%, ${EMERALD_DEEP} 100%)`,
          color: "#FFFFFF",
        }}
      >
        {/* Ambient orbs */}
        <span aria-hidden className="oi-orb pointer-events-none absolute -left-24 -top-16 h-64 w-64 rounded-full blur-[100px]" style={{ background: `${EMERALD_BRIGHT}26` }} />
        <span aria-hidden className="oi-orb pointer-events-none absolute -right-20 -bottom-16 h-72 w-72 rounded-full blur-[120px]" style={{ background: `${EMERALD_BRIGHT}1f`, animationDelay: "2s" }} />

        {/* Header row */}
        <div className="relative z-[1] mx-auto flex w-full max-w-[1500px] flex-col gap-5 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2.5">
              <Globe className="h-3.5 w-3.5 text-white/80" strokeWidth={2} />
              <span className="text-[10px] font-bold uppercase tracking-[0.36em] text-white/80">
                Global Investors
              </span>
            </div>

            <h2 className="block max-w-[820px] text-[1.5rem] font-bold leading-[1.08] tracking-[-0.02em] text-white sm:text-[1.9rem] md:text-[2.25rem] lg:text-[2.5rem]">
              Invest in Dubai from <span className="font-extrabold italic text-white">anywhere</span> in the world
            </h2>
            <p className="mt-2.5 max-w-[600px] text-[13px] font-medium leading-relaxed text-white/75">
              Sovereign-grade infrastructure, zero income tax, and a decade-long residency programme — engineered for international capital.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-3 rounded-full bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-300 group-hover:bg-white/95 group-hover:shadow-lg group-hover:shadow-black/20"
            style={{ color: EMERALD_DEEP }}>
            <span>Discover the opportunity</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.4} style={{ color: EMERALD_DEEP }} />
          </span>
        </div>

        {/* Hairline divider */}
        <div className="relative z-[1] mx-auto mt-6 h-px w-full max-w-[1500px]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }} />

        {/* Stats row */}
        <div className="relative z-[1] mx-auto mt-4 grid w-full max-w-[1500px] grid-cols-2 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
          {microStats.map((s, i) => (
            <AnimatedStat key={s.label} stat={s} start={inView} index={i} />
          ))}
        </div>
      </Link>
    </section>
  );
};

export default OverseasInvestorsStrip;
