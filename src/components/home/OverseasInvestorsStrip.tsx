import { Link } from "react-router-dom";
import { Globe, ArrowRight, ShieldCheck, Trophy, Users } from "lucide-react";
import ContentTrack from "@/components/layout/ContentTrack";

type Stat = {
  v: string;
  label: string;
  icon: typeof Globe;
};

const microStats: Stat[] = [
  { v: "0%", label: "Income Tax", icon: Globe },
  { v: "10Y", label: "Golden Visa", icon: ShieldCheck },
  { v: "#1", label: "Safest City", icon: Trophy },
  { v: "200+", label: "Nationalities", icon: Users },
];

const OverseasInvestorsStrip = () => {
  return (
    <section
      className="relative w-full overflow-hidden py-10 md:py-14 lg:py-16"
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
        .oi-card-orb {
          animation: oi-gold-float 6s ease-in-out infinite;
        }
        .oi-investor-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background:
            radial-gradient(520px 220px at 20% 12%, rgba(184,149,85,0.16), transparent 62%),
            radial-gradient(420px 180px at 86% 82%, rgba(184,149,85,0.10), transparent 66%);
        }
        .oi-investor-card::after {
          content: "";
          position: absolute;
          inset: 1px;
          pointer-events: none;
          border-radius: inherit;
          border: 1px solid rgba(184,149,85,0.28);
        }
        @media (prefers-reduced-motion: reduce) {
          .oi-shimmer-text, .oi-card-orb { animation: none !important; }
        }
      `}</style>

      <ContentTrack>
        <Link
          to="/overseas-investors"
          aria-label="Invest in Dubai from anywhere in the world — discover the opportunity"
          data-surface="dark"
          data-on-dark
          data-no-contrast-guard
          className="oi-investor-card allow-white group relative mx-auto block w-full overflow-hidden rounded-[28px] px-6 py-7 shadow-[0_30px_80px_-36px_rgba(10,8,4,0.78)] transition-transform duration-300 hover:-translate-y-0.5 sm:px-8 md:max-w-[930px] md:rounded-[34px] md:px-10 md:py-9 lg:px-12 lg:py-10"
          style={{
            background:
              "linear-gradient(135deg, #080808 0%, #12110E 48%, #050505 100%)",
            border: "1px solid rgba(184,149,85,0.38)",
            color: "#FFFFFF",
          }}
        >
          <span aria-hidden className="oi-card-orb absolute left-5 top-5 h-20 w-20 rounded-full bg-[#B89555]/10 blur-2xl" />
          <span aria-hidden className="oi-card-orb absolute bottom-6 right-10 h-24 w-24 rounded-full bg-[#B89555]/10 blur-2xl" style={{ animationDelay: "1.4s" }} />

          <span className="relative z-[1] flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10">
            <span className="min-w-0">
              <span className="mb-5 inline-flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#B89555]/45 bg-[#B89555]/10">
                  <Globe className="h-4 w-4" style={{ color: "#B89555", stroke: "#B89555" }} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.34em]" style={{ color: "#B89555" }}>
                  Global Investors
                </span>
              </span>

              <span className="block max-w-[680px] text-[2rem] font-extrabold leading-[0.98] tracking-normal sm:text-[2.7rem] md:text-[4rem] lg:text-[4.4rem]" style={{ color: "#FFFFFF" }}>
                Invest in Dubai from{" "}
                <em className="oi-shimmer-text not-italic font-extrabold">anywhere</em>{" "}
                in the world
              </span>
            </span>

            <span className="inline-flex w-fit items-center gap-3 rounded-full border px-5 py-3 text-[11px] font-extrabold uppercase leading-tight tracking-[0.08em] transition-all duration-300 group-hover:border-[#B89555] group-hover:bg-[#B89555]/15" style={{ borderColor: "rgba(184,149,85,0.42)", color: "#FFFFFF" }}>
              <span>Discover the<br className="hidden sm:block" /> opportunity</span>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "#B89555" }}>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" style={{ color: "#1A1A1A", stroke: "#1A1A1A" }} />
              </span>
            </span>
          </span>

          <span className="relative z-[1] mt-8 block h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(184,149,85,0.34), transparent)" }} />

          <span className="relative z-[1] mt-7 grid grid-cols-2 gap-y-6 sm:grid-cols-4">
            {microStats.map((s, i) => {
              const Icon = s.icon;
              return (
                <span key={s.label} className="relative flex items-start gap-3 px-1 sm:px-5 first:sm:pl-0">
                  {i > 0 && <span aria-hidden className="absolute left-0 top-1 hidden h-12 w-px sm:block" style={{ background: "linear-gradient(180deg, transparent, rgba(184,149,85,0.28), transparent)" }} />}
                  <Icon className="mt-1 h-4 w-4 shrink-0" style={{ color: "#B89555", stroke: "#B89555" }} />
                  <span className="flex flex-col">
                    <span className="text-2xl font-extrabold leading-none tabular-nums sm:text-3xl" style={{ color: i % 2 === 0 ? "#B89555" : "#FFFFFF" }}>
                      {s.v}
                    </span>
                    <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.58)" }}>
                      {s.label}
                    </span>
                  </span>
                </span>
              );
            })}
          </span>
        </Link>
      </ContentTrack>
    </section>
  );
};

export default OverseasInvestorsStrip;
