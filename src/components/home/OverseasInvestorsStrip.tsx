import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, ArrowRight, ShieldCheck, Trophy, Users, Users2 } from "lucide-react";

type Stat = {
  prefix?: string;
  suffix?: string;
  target: number;
  display?: (n: number) => string;
  label: string;
  icon: typeof Globe;
};

const microStats: Stat[] = [
  { target: 0, suffix: "%", label: "Income Tax", icon: Globe },
  { target: 10, suffix: "Y", label: "Golden Visa", icon: ShieldCheck },
  { prefix: "#", target: 1, label: "Safest City", icon: Trophy },
  { target: 200, suffix: "+", label: "Nationalities", icon: Users },
  { target: 4, suffix: "×", label: "Co-Owners · 25% Each on Title Deed", icon: Users2 },
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

const AnimatedStat = ({ stat, start, alt }: { stat: Stat; start: boolean; alt: boolean }) => {
  const Icon = stat.icon;
  const val = useCountUp(stat.target, start);
  const display = stat.display ? stat.display(val) : String(val);
  return (
    <span className="relative flex items-center gap-3 px-1 sm:px-5 first:sm:pl-0">
      <Icon className="h-5 w-5 shrink-0" style={{ color: "#B89555", stroke: "#B89555" }} />
      <span className="flex flex-col leading-none">
        <span className="text-2xl font-extrabold leading-none tabular-nums sm:text-3xl" style={{ color: alt ? "#FFFFFF" : "#B89555" }}>
          {stat.prefix ?? ""}{display}{stat.suffix ?? ""}
        </span>
        <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.58)" }}>
          {stat.label}
        </span>
      </span>
    </span>
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
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "#FDFBF7" }}
    >
      <style>{`
        @keyframes oi-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .oi-shimmer-text {
          background: linear-gradient(90deg, #B89555 0%, #F3E2B1 50%, #B89555 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: oi-shimmer 5s linear infinite;
        }
        @keyframes oi-gold-float {
          0%, 100% { transform: translateY(0); opacity: 0.72; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        .oi-card-orb { animation: oi-gold-float 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .oi-shimmer-text, .oi-card-orb { animation: none !important; }
        }
      `}</style>

      <Link
        ref={ref}
        to="/overseas-investors"
        aria-label="Invest in Dubai from anywhere in the world — discover the opportunity"
        data-surface="dark"
        data-on-dark
        data-no-contrast-guard
        className="oi-investor-card allow-white group relative block w-full overflow-hidden px-6 py-6 transition-colors duration-300 sm:px-10 md:px-16 md:py-7 lg:px-24 lg:py-8"
        style={{
          background: "linear-gradient(135deg, #080808 0%, #12110E 48%, #050505 100%)",
          borderTop: "1px solid rgba(184,149,85,0.38)",
          borderBottom: "1px solid rgba(184,149,85,0.38)",
          color: "#FFFFFF",
        }}
      >
        <span aria-hidden className="oi-card-orb absolute left-10 top-6 h-24 w-24 rounded-full bg-[#B89555]/10 blur-3xl" />
        <span aria-hidden className="oi-card-orb absolute bottom-6 right-16 h-28 w-28 rounded-full bg-[#B89555]/10 blur-3xl" style={{ animationDelay: "1.4s" }} />

        <span className="relative z-[1] mx-auto flex w-full max-w-[1400px] flex-col gap-5 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10">
          <span className="min-w-0">
            <span className="mb-3 inline-flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#B89555]/45 bg-[#B89555]/10">
                <Globe className="h-3.5 w-3.5" style={{ color: "#B89555", stroke: "#B89555" }} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.34em]" style={{ color: "#B89555" }}>
                Global Investors
              </span>
            </span>

            <span className="block max-w-[860px] text-[1.6rem] font-extrabold leading-[1] tracking-normal sm:text-[2.1rem] md:text-[2.8rem] lg:text-[3.2rem]" style={{ color: "#FFFFFF" }}>
              Invest in Dubai from{" "}
              <em className="oi-shimmer-text not-italic font-extrabold">anywhere</em>{" "}
              in the world
            </span>
          </span>

          <span className="inline-flex w-fit items-center gap-3 rounded-full border px-5 py-2.5 text-[11px] font-extrabold uppercase leading-tight tracking-[0.08em] transition-all duration-300 group-hover:border-[#B89555] group-hover:bg-[#B89555]/15" style={{ borderColor: "rgba(184,149,85,0.42)", color: "#FFFFFF" }}>
            <span>Discover the<br className="hidden sm:block" /> opportunity</span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "#B89555" }}>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" style={{ color: "#1A1A1A", stroke: "#1A1A1A" }} />
            </span>
          </span>
        </span>

        <span className="relative z-[1] mx-auto mt-5 block h-px w-full max-w-[1400px]" style={{ background: "linear-gradient(90deg, transparent, rgba(184,149,85,0.34), transparent)" }} />

        <span className="relative z-[1] mx-auto mt-4 grid w-full max-w-[1400px] grid-cols-2 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          {microStats.map((s, i) => (
            <AnimatedStat key={s.label} stat={s} start={inView} alt={i % 2 === 1} />
          ))}
        </span>
      </Link>
    </section>
  );
};

export default OverseasInvestorsStrip;
