/**
 * OverseasInvestorsStrip — single-line champagne band used on the homepage.
 * Replaces the tall OverseasInvestorsBanner on `/` per founder request.
 * The full banner remains available on /overseas-investors via the original component.
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
          className="group flex items-center justify-between gap-3 md:gap-6 rounded-full border border-[#B89555]/35 bg-[#F7F2EA] px-4 md:px-6 py-2.5 md:py-3 transition-colors hover:bg-[#EFE6D6]"
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex w-7 h-7 items-center justify-center rounded-full border border-[#B89555]/40 bg-white shrink-0">
              <Globe className="w-3.5 h-3.5 text-[#1A1A1A]" />
            </span>
            <span className="text-[12px] md:text-sm font-semibold text-[#1A1A1A] truncate">
              Invest in Dubai from anywhere in the world
            </span>
          </span>

          <span className="hidden md:flex items-center gap-5">
            {microStats.map((s) => (
              <span key={s.l} className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-[#1A1A1A] tabular-nums">{s.v}</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/60">{s.l}</span>
              </span>
            ))}
          </span>

          <span className="inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold text-[#1A1A1A] shrink-0">
            <span className="hidden sm:inline">Learn more</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </section>
  );
};

export default OverseasInvestorsStrip;
