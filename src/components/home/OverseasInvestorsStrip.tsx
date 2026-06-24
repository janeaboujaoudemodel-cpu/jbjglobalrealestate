/**
 * OverseasInvestorsStrip — premium full-bleed ink band with gold detailing.
 * Deep ink gradient base, dual gold hairlines, faint radial glow, refined
 * typography hierarchy and gold-tinted micro-stat dividers. White foreground
 * preserved by the global allow-white guard.
 */
import { Link } from "react-router-dom";
import { Globe, ArrowRight } from "lucide-react";
import ContentTrack from "@/components/layout/ContentTrack";

type Stat = {
  v: string;
  labels: string[];
  effect?: "shimmer" | "pulse" | "plain";
};

const microStats: Stat[] = [
  { v: "0%", labels: ["Income Tax", "Capital Gains", "Inheritance Tax"], effect: "shimmer" },
  { v: "10Y", labels: ["Golden Visa", "Full Residency", "Family Sponsored"], effect: "pulse" },
  { v: "#1", labels: ["Safest City", "Global Ranking", "Mercer Index"], effect: "shimmer" },
  { v: "200+", labels: ["Nationalities", "Global Community", "Open Borders"], effect: "pulse" },
];

const OverseasInvestorsStrip = () => {
  return (
    <section
      data-surface="dark"
      data-on-dark
      data-no-contrast-guard
      className="allow-white relative w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(900px 320px at 12% 50%, rgba(184,149,85,0.18), transparent 60%), radial-gradient(700px 280px at 88% 50%, rgba(184,149,85,0.12), transparent 65%), linear-gradient(180deg, #0B0B0B 0%, #141414 100%)",
      }}
    >
      <style>{`
        @keyframes oi-label-fade {
          0%, 28% { opacity: 1; transform: translateY(0); }
          33%, 95% { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes oi-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes oi-pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 1px rgba(184,149,85,0.35)); }
          50% { filter: drop-shadow(0 0 10px rgba(184,149,85,0.75)); }
        }
        .oi-label-reel {
          position: relative;
          display: block;
          height: 14px;
          min-width: 110px;
        }
        .oi-label-reel > span.oi-label {
          position: absolute;
          inset: 0;
          opacity: 0;
          animation: oi-label-fade 9s ease-in-out infinite;
          will-change: opacity, transform;
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
        .oi-pulse-gold {
          color: #FFFFFF;
          animation: oi-pulse-glow 4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .oi-label, .oi-shimmer-text, .oi-pulse-gold { animation: none !important; opacity: 1 !important; }
        }
      `}</style>


      {/* Double gold hairlines top/bottom */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-[#B89555]/55" />
      <span aria-hidden className="absolute inset-x-0 top-[3px] h-px bg-[#B89555]/20" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-[#B89555]/55" />
      <span aria-hidden className="absolute inset-x-0 bottom-[3px] h-px bg-[#B89555]/20" />

      <Link
        to="/overseas-investors"
        aria-label="Invest in Dubai from anywhere in the world — learn more"
        data-surface="dark"
        data-on-dark
        data-no-contrast-guard
        className="overseas-investors-strip-link allow-white group block py-12 md:py-16 lg:py-20 text-white relative"
      >
        <ContentTrack className="flex flex-wrap xl:flex-nowrap items-center justify-between gap-6 md:gap-10">

          {/* Left: globe medallion + headline */}
          <span className="allow-white flex items-center gap-4 min-w-0 basis-full xl:basis-auto xl:flex-1">
            <span
              aria-hidden
              className="allow-white relative shrink-0 inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border border-[#B89555]/55 bg-gradient-to-b from-white/[0.06] to-transparent shadow-[0_4px_18px_rgba(184,149,85,0.18)]"
            >
              <Globe className="w-6 h-6 md:w-7 md:h-7 allow-white" style={{ color: "#B89555", stroke: "#B89555" }} />
            </span>
            <span className="flex flex-col min-w-0">
              <span
                className="allow-white text-[10px] md:text-[11px] uppercase tracking-[0.22em] mb-1"
                style={{ color: "#B89555" }}
              >
                Global Investors
              </span>
              <span
                className="allow-white text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-bold leading-[1.15] tracking-tight"
                style={{ color: "#FFFFFF", fontFamily: "Inter, system-ui, sans-serif" }}
              >
                Invest in Dubai from{" "}
                <span style={{ color: "#B89555" }}>anywhere in the world</span>
              </span>
            </span>
          </span>

          {/* Center micro-stats with gold dividers + kinetic labels */}
          <span className="allow-white flex items-center flex-wrap gap-x-5 gap-y-2 md:gap-x-7 min-w-0">
            {microStats.map((s, i) => (
              <span key={s.v + i} className="allow-white flex items-center gap-x-5 md:gap-x-7">
                {i > 0 && (
                  <span aria-hidden className="hidden sm:inline-block h-8 w-px bg-gradient-to-b from-transparent via-[#B89555]/45 to-transparent" />
                )}
                <span className="allow-white flex flex-col items-start leading-tight whitespace-nowrap">
                  <span
                    className={
                      "allow-white text-xl sm:text-2xl md:text-[1.75rem] font-bold tabular-nums " +
                      (s.effect === "shimmer" ? "oi-shimmer-text" : s.effect === "pulse" ? "oi-pulse-gold" : "")
                    }
                    style={s.effect === "shimmer" ? undefined : { color: "#FFFFFF" }}
                  >
                    {s.v}
                  </span>
                  <span
                    className="allow-white oi-label-reel mt-1 block"
                    style={{ height: "1.1em", overflow: "hidden", display: "block" }}
                    aria-label={s.labels[0]}
                  >
                    <span
                      className="allow-white oi-label-track"
                      style={{ animationDelay: `${i * 0.6}s`, display: "block" }}
                    >
                      {[...s.labels, s.labels[0]].map((label, li) => (
                        <span
                          key={li}
                          className="allow-white text-[10px] sm:text-[11px] uppercase tracking-[0.22em]"
                          style={{ color: li === 1 ? "#B89555" : "rgba(255,255,255,0.62)", display: "block", height: "1.1em", lineHeight: "1.1em" }}
                        >
                          {label}
                        </span>
                      ))}
                    </span>
                  </span>
                </span>
              </span>
            ))}
          </span>


          {/* Right: premium CTA */}
          <span
            data-no-contrast-guard
            className="allow-white inline-flex items-center gap-2.5 px-6 py-3 rounded-full border border-[#B89555]/70 bg-gradient-to-b from-[#B89555]/15 to-transparent text-sm md:text-base font-semibold tracking-wide shrink-0 whitespace-nowrap shadow-[0_8px_24px_-8px_rgba(184,149,85,0.5)] transition-all duration-300 group-hover:bg-[#B89555]/25 group-hover:border-[#B89555] group-hover:-translate-y-0.5"
            style={{ color: "#FFFFFF" }}
          >
            <span className="allow-white" style={{ color: "#FFFFFF" }}>Discover the Opportunity</span>
            <ArrowRight className="allow-white w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: "#B89555", stroke: "#B89555" }} />
          </span>

        </ContentTrack>
      </Link>
    </section>
  );
};

export default OverseasInvestorsStrip;
