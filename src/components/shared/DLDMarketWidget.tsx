/**
 * DLD Market Widget — Reusable market stats component
 * Used on AreaDetail, Properties, and ProjectDetail pages
 */

import { TrendingUp, Building2, Banknote, MapPin, Globe } from "lucide-react";
import { ytd2026, topAreas2026, topNationalities } from "@/constants/dldMarketData";
import { Link } from "react-router-dom";

interface DLDMarketWidgetProps {
  /** Highlight a specific area if it exists in top areas */
  highlightArea?: string;
  /** Compact mode for sidebars */
  compact?: boolean;
}

const DLDMarketWidget = ({ highlightArea, compact = false }: DLDMarketWidgetProps) => {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  // Find highlighted area in top areas
  const matchedArea = highlightArea
    ? topAreas2026.find(a => a.area.toLowerCase().includes(highlightArea.toLowerCase()))
    : null;

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-gold/20 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold" />
            Dubai Market Pulse
          </h3>
          <span className="text-[10px] text-zinc-500">As of {today}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">YTD Volume</p>
            <p className="text-gold font-bold text-lg">{ytd2026.value}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Transactions</p>
            <p className="text-white font-bold text-lg">{ytd2026.transactions.toLocaleString()}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Growth</p>
            <p className="text-emerald-400 font-bold text-lg">{ytd2026.growth}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Off-Plan</p>
            <p className="text-white font-bold text-lg">{ytd2026.offPlan.toLocaleString()}</p>
          </div>
        </div>

        {matchedArea && (
          <div className="bg-gold/10 border border-gold/30 rounded-lg p-3">
            <p className="text-[10px] text-gold uppercase tracking-wider mb-1">This Area</p>
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">{matchedArea.transactions.toLocaleString()} transactions</span>
              <span className="text-emerald-400 text-sm font-semibold">{matchedArea.change}</span>
            </div>
          </div>
        )}

        <p className="text-[9px] text-zinc-600 leading-relaxed">
          Source: Dubai Land Department. For informational purposes only. Does not constitute financial advice.{" "}
          <Link to="/contact" className="text-gold hover:underline">Contact our team</Link> for professional guidance.
        </p>
      </div>
    );
  }

  // Full version
  const offPlanPct = Math.round((ytd2026.offPlan / ytd2026.transactions) * 100);
  const cashPct = Math.round((ytd2026.cash / ytd2026.transactions) * 100);

  return (
    <section className="py-12 bg-gradient-to-br from-zinc-950 via-black to-zinc-900">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto border border-gold/20 rounded-2xl p-6 md:p-8 bg-zinc-900/40">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-white text-xl md:text-2xl font-bold flex items-center gap-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                <Banknote className="w-6 h-6 text-gold" />
                Dubai Market Intelligence
              </h2>
              <p className="text-zinc-400 text-sm mt-1">DLD Transaction Data • As of {today}</p>
            </div>
            <span className="text-emerald-400 text-xl font-bold">{ytd2026.growth}</span>
          </div>

          {/* Main Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "YTD Volume", value: ytd2026.value, icon: Banknote, color: "text-gold" },
              { label: "Transactions (YTD 2026)", value: ytd2026.transactions.toLocaleString(), icon: Building2, color: "text-white" },
              { label: "Off-Plan", value: ytd2026.offPlan.toLocaleString(), icon: TrendingUp, color: "text-emerald-400" },
              { label: "Cash Deals", value: ytd2026.cash.toLocaleString(), icon: Banknote, color: "text-amber-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-zinc-400 text-xs uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className={`${stat.color} text-xl font-bold`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Transaction Split Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-zinc-800/40 rounded-xl p-5 border border-zinc-700/30">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Off-Plan vs Secondary</p>
              <div className="h-3 bg-zinc-700 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-gold to-amber-500 rounded-full" style={{ width: `${offPlanPct}%` }} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gold">{offPlanPct}% Off-Plan ({ytd2026.offPlan.toLocaleString()})</span>
                <span className="text-zinc-400">{100 - offPlanPct}% Secondary ({ytd2026.secondary.toLocaleString()})</span>
              </div>
            </div>
            <div className="bg-zinc-800/40 rounded-xl p-5 border border-zinc-700/30">
              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-3">Cash vs Mortgage</p>
              <div className="h-3 bg-zinc-700 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${cashPct}%` }} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400">{cashPct}% Cash ({ytd2026.cash.toLocaleString()})</span>
                <span className="text-zinc-400">{100 - cashPct}% Mortgage ({ytd2026.mortgage.toLocaleString()})</span>
              </div>
            </div>
          </div>

          {/* Top Areas + Nationalities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 5 Areas */}
            <div className="bg-zinc-800/40 rounded-xl p-5 border border-zinc-700/30">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-gold" />
                <h3 className="text-white text-sm font-semibold">Top Areas by Transactions</h3>
              </div>
              <div className="space-y-3">
                {topAreas2026.slice(0, 5).map((area, i) => {
                  const isHighlighted = highlightArea && area.area.toLowerCase().includes(highlightArea.toLowerCase());
                  return (
                    <div key={area.area} className={`flex items-center justify-between ${isHighlighted ? "bg-gold/10 -mx-2 px-2 py-1 rounded-lg border border-gold/30" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-xs w-4">{i + 1}</span>
                        <span className={`text-sm ${isHighlighted ? "text-gold font-semibold" : "text-zinc-300"}`}>{area.area}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white text-xs font-medium">{area.transactions.toLocaleString()}</span>
                        <span className="text-emerald-400 text-xs">{area.change}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 5 Nationalities */}
            <div className="bg-zinc-800/40 rounded-xl p-5 border border-zinc-700/30">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-gold" />
                <h3 className="text-white text-sm font-semibold">Top Buyer Nationalities</h3>
              </div>
              <div className="space-y-3">
                {topNationalities.slice(0, 5).map((nat) => (
                  <div key={nat.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{nat.flag}</span>
                      <span className="text-zinc-300 text-sm">{nat.country}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-2 bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width: `${nat.percentage * 4}%` }} />
                      </div>
                      <span className="text-gold text-xs font-medium w-8 text-right">{nat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-zinc-600 text-center mt-6">
            Source: Dubai Land Department (DLD). Year-to-date (YTD) 2026 data. For informational purposes only. Does not constitute financial advice.{" "}
            <Link to="/contact" className="text-gold hover:underline">Contact our team</Link> for professional guidance.
          </p>
        </div>
      </div>
    </section>
  );
};

export default DLDMarketWidget;
