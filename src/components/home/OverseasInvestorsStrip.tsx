/**
 * OverseasInvestorsStrip — slim institutional band on the homepage.
 * Painted with the approved navy accent (#102540 / hover #1a3d63) — same
 * blue used on the "Get Verified / Join Benzini Community" banner.
 * White foreground, white/75 secondary, white/15 hairlines. Opt-out from
 * the global light-surface contrast lock via data-surface="dark".
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
    <section className="bg-[#FDFBF7] py-3 md:py-4">
      <div className="jj-layer-2">
        <Link
          to="/overseas-investors"
          aria-label="Invest in Dubai from anywhere in the world — learn more"
          data-surface="dark"
          data-on-dark
          data-no-contrast-guard
          className="allow-white group flex flex-nowrap items-center justify-between gap-3 sm:gap-4 md:gap-6 px-3 sm:px-4 md:px-5 py-2.5 md:py-3 rounded-xl border border-[#B89555]/40 bg-[#102540] text-white transition-colors hover:bg-[#1a3d63]"
        >
          {/* Left: globe + headline */}
          <span className="allow-white flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
            <Globe className="w-4 h-4 shrink-0 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            <span
              className="allow-white text-[11px] sm:text-[12px] md:text-sm font-semibold truncate"
              style={{ color: "#FFFFFF" }}
            >
              Invest in Dubai from anywhere in the world
            </span>
          </span>

          {/* Center micro-stats — drop progressively as the viewport shrinks, never wrap */}
          <span className="allow-white flex items-center gap-3 md:gap-5 shrink min-w-0 overflow-hidden divide-x divide-white/15">
            {microStats.map((s, i) => (
              <span
                key={s.l}
                className={`allow-white flex items-baseline gap-1 sm:gap-1.5 whitespace-nowrap ${i === 0 ? "" : "pl-3 md:pl-5"} ${
                  i === 0 ? "" : i === 1 ? "hidden xs:flex sm:flex" : i === 2 ? "hidden sm:flex" : "hidden md:flex"
                }`}
              >
                <span
                  className="allow-white text-xs sm:text-sm font-bold tabular-nums"
                  style={{ color: "#FFFFFF" }}
                >
                  {s.v}
                </span>
                <span
                  className="allow-white text-[9px] sm:text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  {s.l}
                </span>
              </span>
            ))}
          </span>

          {/* Right: CTA */}
          <span
            className="allow-white inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold shrink-0 whitespace-nowrap"
            style={{ color: "#FFFFFF" }}
          >
            <span className="hidden sm:inline allow-white" style={{ color: "#FFFFFF" }}>Learn more</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
          </span>
        </Link>
      </div>
    </section>
  );
};

export default OverseasInvestorsStrip;
