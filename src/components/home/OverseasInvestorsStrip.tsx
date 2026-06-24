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

          {/* Center micro-stats with gold dividers */}
          <span className="allow-white flex items-center flex-wrap gap-x-5 gap-y-2 md:gap-x-7 min-w-0">
            {microStats.map((s, i) => (
              <span key={s.l} className="allow-white flex items-center gap-x-5 md:gap-x-7">
                {i > 0 && (
                  <span aria-hidden className="hidden sm:inline-block h-8 w-px bg-gradient-to-b from-transparent via-[#B89555]/45 to-transparent" />
                )}
                <span className="allow-white flex flex-col items-start leading-tight whitespace-nowrap">
                  <span
                    className="allow-white text-xl sm:text-2xl md:text-[1.75rem] font-bold tabular-nums"
                    style={{ color: "#FFFFFF" }}
                  >
                    {s.v}
                  </span>
                  <span
                    className="allow-white text-[10px] sm:text-[11px] uppercase tracking-[0.18em] mt-0.5"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    {s.l}
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
