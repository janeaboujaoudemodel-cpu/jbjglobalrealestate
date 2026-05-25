/**
 * OverseasInvestorsStrip — full-bleed navy band on the homepage.
 * Painted with the approved navy accent (#102540 / hover #1a3d63) — same
 * blue used on the "Get Verified / Join Benzini Community" banner.
 * White foreground, white/75 secondary, white/15 hairlines.
 */
import { Link } from "react-router-dom";
import { Globe, ArrowRight } from "lucide-react";

const microStats = [
  { v: "0%", l: "Tax" },
  { v: "10Y", l: "Golden Visa" },
  { v: "#1", l: "Safety" },
  { v: "200+", l: "Nationalities" },
];

const OverseasInvestorsStrip = () => {
  return (
    <section
      data-surface="dark"
      data-on-dark
      data-no-contrast-guard
      className="allow-white w-full bg-[#102540] border-y border-[#B89555]/40"
    >
      <Link
        to="/overseas-investors"
        aria-label="Invest in Dubai from anywhere in the world — learn more"
        data-surface="dark"
        data-on-dark
        data-no-contrast-guard
        className="allow-white group flex flex-wrap md:flex-nowrap items-center justify-between gap-4 md:gap-8 px-6 sm:px-10 md:px-14 py-10 md:py-14 lg:py-16 text-white transition-colors hover:bg-[#1a3d63]"
      >

        {/* Left: globe + headline (never truncate) */}
        <span className="allow-white flex items-center gap-2.5 min-w-0 flex-1 md:flex-none">
          <Globe className="w-4 h-4 md:w-5 md:h-5 shrink-0 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
          <span
            className="allow-white text-[12px] sm:text-sm md:text-base font-semibold leading-snug"
            style={{ color: "#FFFFFF" }}
          >
            Invest in Dubai from anywhere in the world
          </span>
        </span>

        {/* Center micro-stats */}
        <span className="allow-white flex items-center flex-wrap gap-x-4 gap-y-1 md:gap-x-5 divide-x divide-white/15">
          {microStats.map((s, i) => (
            <span
              key={s.l}
              className={`allow-white flex items-baseline gap-1.5 whitespace-nowrap ${i === 0 ? "" : "pl-4 md:pl-5"}`}
            >
              <span
                className="allow-white text-xs sm:text-sm md:text-base font-bold tabular-nums"
                style={{ color: "#FFFFFF" }}
              >
                {s.v}
              </span>
              <span
                className="allow-white text-[10px] sm:text-[11px] uppercase tracking-[0.14em]"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {s.l}
              </span>
            </span>
          ))}
        </span>

        {/* Right: CTA */}
        <span
          className="allow-white inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold shrink-0 whitespace-nowrap"
          style={{ color: "#FFFFFF" }}
        >
          <span className="allow-white" style={{ color: "#FFFFFF" }}>Learn more</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
        </span>
      </Link>
    </section>
  );
};

export default OverseasInvestorsStrip;
