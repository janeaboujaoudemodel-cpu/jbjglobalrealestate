/**
 * OverseasInvestorsStrip — slim institutional band on the homepage.
 * - No pill chrome: content sits directly in the section box.
 * - Always horizontal (never stacks vertically), shrinks gracefully on compressed screens.
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
          className="group flex flex-nowrap items-center justify-between gap-3 sm:gap-4 md:gap-6 px-2 sm:px-3 py-2.5 md:py-3 transition-colors hover:bg-[#F7F2EA]/60"
        >
          {/* Left: globe + headline */}
          <span className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
            <Globe className="w-4 h-4 text-[#1A1A1A] shrink-0" />
            <span className="text-[11px] sm:text-[12px] md:text-sm font-semibold text-[#1A1A1A] truncate">
              Invest in Dubai from anywhere in the world
            </span>
          </span>

          {/* Center micro-stats — drop progressively as the viewport shrinks, never wrap */}
          <span className="flex items-center gap-3 md:gap-5 shrink min-w-0 overflow-hidden">
            {microStats.map((s, i) => (
              <span
                key={s.l}
                className={`flex items-baseline gap-1 sm:gap-1.5 whitespace-nowrap ${
                  i === 0 ? "" : i === 1 ? "hidden xs:flex sm:flex" : i === 2 ? "hidden sm:flex" : "hidden md:flex"
                }`}
              >
                <span className="text-xs sm:text-sm font-bold text-[#1A1A1A] tabular-nums">{s.v}</span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]/65">{s.l}</span>
              </span>
            ))}
          </span>

          {/* Right: CTA */}
          <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[#1A1A1A] shrink-0 whitespace-nowrap">
            <span className="hidden sm:inline">Learn more</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </section>
  );
};

export default OverseasInvestorsStrip;
