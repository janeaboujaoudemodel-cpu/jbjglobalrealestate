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
      <Icon className="oi-muted h-4 w-4" strokeWidth={1.75} />
      <span className="text-[1.5rem] font-bold leading-none tabular-nums sm:text-[1.75rem]" style={{ letterSpacing: "-0.02em" }}>
        {stat.prefix ?? ""}{val}{stat.suffix ?? ""}
      </span>
      <span className="oi-meter" aria-hidden="true">
        <span style={{ transform: start ? "scaleX(1)" : "scaleX(0)", transitionDelay: `${index * 80 + 120}ms` }} />
      </span>
      <span className="oi-faint text-[9.5px] font-semibold uppercase tracking-[0.22em]">
        {stat.label}
      </span>
    </div>
  );
};

const OverseasInvestorsStrip = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold: 0.05, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    // Fallback: if section is already on screen at mount, kick off
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) setInView(true);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="jj-fullbleed-band oi-band relative w-full overflow-hidden"
      data-fullbleed-band
      data-surface="dark"
      data-on-dark
      data-no-contrast-guard
    >
      <style>{`
        @keyframes oi-orb-drift {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.22; }
          50% { transform: translate(18px,-10px) scale(1.06); opacity: 0.38; }
        }
        @keyframes oi-metallic-sweep {
          0% { transform: translateX(-130%) skewX(-18deg); opacity: 0; }
          18% { opacity: 0.38; }
          58% { opacity: 0.16; }
          100% { transform: translateX(130%) skewX(-18deg); opacity: 0; }
        }
        .oi-orb { animation: oi-orb-drift 10s ease-in-out infinite; }
        .oi-metallic::after {
          content: "";
          position: absolute;
          inset: -35% -18%;
          background: linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.18) 48%, rgba(16,194,133,0.18) 52%, transparent 60%);
          animation: oi-metallic-sweep 5.8s cubic-bezier(0.22,1,0.36,1) infinite;
          pointer-events: none;
          mix-blend-mode: screen;
          z-index: 0;
        }
        @keyframes oi-stat-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .oi-stat { animation: oi-stat-in 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .oi-meter { display: block; width: min(72px, 80%); height: 2px; overflow: hidden; background: rgba(255,255,255,0.12); }
        .oi-meter > span { display: block; width: 100%; height: 100%; transform-origin: left center; background: linear-gradient(90deg, rgba(255,255,255,0.45), rgba(255,255,255,0.95)); transition: transform 1.3s cubic-bezier(0.22,1,0.36,1); }
        .oi-band, .oi-band * { color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; }
        .oi-band .oi-muted, .oi-band .oi-muted * { color: rgba(255,255,255,0.72) !important; -webkit-text-fill-color: rgba(255,255,255,0.72) !important; }
        .oi-band .oi-faint, .oi-band .oi-faint * { color: rgba(255,255,255,0.62) !important; -webkit-text-fill-color: rgba(255,255,255,0.62) !important; }
        .oi-band svg,
        .oi-band svg *,
        .oi-band svg.oi-muted,
        .oi-band svg.oi-muted *,
        .oi-band .oi-muted svg,
        .oi-band .oi-muted svg * {
          stroke: #FFFFFF !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .oi-orb, .oi-stat, .oi-metallic::after { animation: none !important; }
        }
      `}</style>

      <Link
        to="/overseas-investors"
        aria-label="Invest in Dubai from anywhere in the world — discover the opportunity"
        data-surface="dark"
        data-on-dark
        data-no-contrast-guard
        className="allow-white oi-metallic group relative block w-full overflow-hidden px-6 py-7 sm:px-10 md:px-14 md:py-8 lg:px-16"
        style={{
          background: "var(--jj-emerald-ombre)",
          color: "#FFFFFF",
        }}
      >
        {/* Ambient orbs */}
        <span aria-hidden className="oi-orb pointer-events-none absolute -left-24 -top-16 h-64 w-64 rounded-full blur-[110px]" style={{ background: `${EMERALD_BRIGHT}17` }} />
        <span aria-hidden className="oi-orb pointer-events-none absolute -right-20 -bottom-16 h-72 w-72 rounded-full blur-[130px]" style={{ background: `${EMERALD_BRIGHT}12`, animationDelay: "2s" }} />

        {/* Header row */}
        <div className="relative z-[1] mx-auto flex w-full max-w-[1500px] flex-col gap-5 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <div className="min-w-0">
            <div className="oi-muted mb-3 inline-flex items-center gap-2.5">
              <Globe className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="text-[10px] font-bold uppercase tracking-[0.36em]">
                Global Investors
              </span>
            </div>

            <h2 className="block max-w-[820px] text-[1.5rem] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[1.9rem] md:text-[2.25rem] lg:text-[2.5rem]">
              Invest in Dubai from <span className="font-extrabold italic">anywhere</span> in the world
            </h2>
            <p className="oi-muted mt-2.5 max-w-[600px] text-[13px] font-medium leading-relaxed">
              Sovereign-grade infrastructure, zero income tax, and a decade-long residency programme — engineered for international capital.
            </p>
          </div>

          {/* Locked emerald metallic CTA — matches "Start exploring" */}
          <span
            className="jj-cta-emerald inline-flex h-12 w-fit items-center gap-2.5 rounded-xl px-6 text-[13px] font-semibold tracking-wide transition-transform duration-300 group-hover:-translate-y-0.5"
          >
            <span>Discover the opportunity</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.4} />
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
