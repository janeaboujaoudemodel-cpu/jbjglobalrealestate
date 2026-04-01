/**
 * DLD Market Widget — Reusable market stats component
 * Used on AreaDetail, Properties, and ProjectDetail pages
 */

import { TrendingUp, Building2, Banknote, MapPin, Globe } from "lucide-react";
import { ytd2026 as fallbackYtd, topAreas2026 as fallbackAreas, topNationalities as fallbackNationalities } from "@/constants/dldMarketData";
import { useDLDMarketData } from "@/hooks/useDLDMarketData";
import { Link } from "react-router-dom";

interface DLDMarketWidgetProps {
  /** Highlight a specific area if it exists in top areas */
  highlightArea?: string;
  /** Compact mode for sidebars */
  compact?: boolean;
}

const DLDMarketWidget = ({ highlightArea, compact = false }: DLDMarketWidgetProps) => {
  const { data: marketData } = useDLDMarketData();
  const ytd2026 = marketData?.ytd2026 ?? fallbackYtd;
  const topAreas2026 = marketData?.topAreas2026 ?? fallbackAreas;
  const topNationalities = marketData?.topNationalities ?? fallbackNationalities;
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
          <span className="text-[10px] text-white/80">As of {today}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-[10px] text-white/80 uppercase tracking-wider font-medium">YTD Volume</p>
            <p className="text-gold font-bold text-lg">{ytd2026.value}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-[10px] text-white/80 uppercase tracking-wider font-medium">Transactions</p>
            <p className="text-white font-bold text-lg">{ytd2026.transactions.toLocaleString()}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-[10px] text-white/80 uppercase tracking-wider font-medium">Growth</p>
            <p className="text-emerald-400 font-bold text-lg">{ytd2026.growth}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-3">
            <p className="text-[10px] text-white/80 uppercase tracking-wider font-medium">Off-Plan</p>
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

        <p className="text-[9px] text-white/70 leading-relaxed">
          Sources: DLD, RERA, DXB Interact. For informational purposes only.{" "}
          <Link to="/contact" className="text-gold hover:underline">Contact our team</Link> for professional guidance.
        </p>
      </div>
    );
  }

  // Full version
  const offPlanPct = Math.round((ytd2026.offPlan / ytd2026.transactions) * 100);
  const cashPct = Math.round((ytd2026.cash / ytd2026.transactions) * 100);

  return (
    <section className="py-16 overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1a30 50%, #0f1f3a 100%)' }}>
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto border-2 border-gold/30 rounded-2xl p-8 md:p-10 bg-[#0c1829]/80 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-white text-xl md:text-2xl font-bold flex items-center gap-3">
                <Banknote className="w-6 h-6 text-gold" />
                Dubai Market Intelligence
              </h2>
              <p className="text-white/70 text-sm mt-1 font-medium">DLD Transaction Data • As of {today}</p>
            </div>
            <span className="text-emerald-400 text-2xl font-extrabold drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">{ytd2026.growth}</span>
          </div>

          {/* Main Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "YTD Volume", value: ytd2026.value, icon: Banknote, color: "text-emerald-400", borderColor: "border-emerald-500/40", bgColor: "bg-emerald-500/10", glow: "drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" },
              { label: "Transactions (YTD 2026)", value: ytd2026.transactions.toLocaleString(), icon: Building2, color: "text-blue-400", borderColor: "border-blue-500/40", bgColor: "bg-blue-500/10", glow: "drop-shadow-[0_0_6px_rgba(59,130,246,0.3)]" },
              { label: "Off-Plan", value: ytd2026.offPlan.toLocaleString(), icon: TrendingUp, color: "text-purple-400", borderColor: "border-purple-500/40", bgColor: "bg-purple-500/10", glow: "drop-shadow-[0_0_6px_rgba(168,85,247,0.3)]" },
              { label: "Cash Deals", value: ytd2026.cash.toLocaleString(), icon: Banknote, color: "text-amber-400", borderColor: "border-amber-500/40", bgColor: "bg-amber-500/10", glow: "drop-shadow-[0_0_6px_rgba(245,158,11,0.3)]" },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.bgColor} ${stat.borderColor} border rounded-xl p-4 backdrop-blur-sm`}>
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-white/80 text-xs uppercase tracking-wider font-semibold">{stat.label}</span>
                </div>
                <p className={`${stat.color} text-2xl font-extrabold ${stat.glow}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Transaction Split Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 rounded-xl p-5 border border-emerald-500/30 backdrop-blur-sm">
              <p className="text-white/90 font-semibold text-xs uppercase tracking-wider mb-3">Off-Plan vs Secondary</p>
              <div className="h-6 rounded-full overflow-hidden mb-3 flex shadow-inner bg-black/30">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-l-full shadow-[0_0_10px_rgba(52,211,153,0.4)]" style={{ width: `${offPlanPct}%` }} />
                <div className="h-full bg-gradient-to-r from-red-500 to-red-400 flex-1 rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400 font-bold">● {offPlanPct}% Off-Plan ({ytd2026.offPlan.toLocaleString()})</span>
                <span className="text-red-400 font-bold">● {100 - offPlanPct}% Secondary ({ytd2026.secondary.toLocaleString()})</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-blue-500/30 backdrop-blur-sm">
              <p className="text-white/90 font-semibold text-xs uppercase tracking-wider mb-3">Cash vs Mortgage</p>
              <div className="h-6 rounded-full overflow-hidden mb-3 flex shadow-inner bg-black/30">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-l-full shadow-[0_0_10px_rgba(59,130,246,0.4)]" style={{ width: `${cashPct}%` }} />
                <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 flex-1 rounded-r-full shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-400 font-bold">● {cashPct}% Cash ({ytd2026.cash.toLocaleString()})</span>
                <span className="text-amber-400 font-bold">● {100 - cashPct}% Mortgage ({ytd2026.mortgage.toLocaleString()})</span>
              </div>
            </div>
          </div>

          {/* Top Areas + Nationalities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 10 Areas */}
            <div className="bg-white/5 rounded-xl p-5 border border-gold/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-gold" />
                <h3 className="text-white text-sm font-semibold">Top 10 Areas by Transactions</h3>
              </div>
              <div className="space-y-3">
                {topAreas2026.slice(0, 10).map((area, i) => {
                  const isHighlighted = highlightArea && area.area.toLowerCase().includes(highlightArea.toLowerCase());
                  return (
                    <div key={area.area} className={`flex items-center justify-between ${isHighlighted ? "bg-gold/15 -mx-2 px-2 py-1 rounded-lg border border-gold/40" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-gold/70 text-xs w-4 font-bold">{i + 1}</span>
                         <span className={`text-sm ${isHighlighted ? "text-gold font-semibold" : "text-white/90 font-medium"}`}>{area.area}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white/80 text-xs font-semibold">{area.transactions.toLocaleString()}</span>
                        <span className="text-emerald-400 text-xs font-bold">{area.change}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 10 Nationalities */}
            <div className="bg-white/5 rounded-xl p-5 border border-gold/20 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-gold" />
                <h3 className="text-white text-sm font-semibold">Top 10 Buyer Nationalities</h3>
              </div>
              <div className="space-y-3">
                {topNationalities.slice(0, 10).map((nat, i) => {
                  const barColors = [
                    'bg-emerald-500', 'bg-blue-500', 'bg-red-400', 'bg-amber-500', 'bg-purple-500',
                    'bg-cyan-500', 'bg-rose-500', 'bg-teal-500', 'bg-orange-500', 'bg-indigo-500'
                  ];
                  const textColors = [
                    'text-emerald-400', 'text-blue-400', 'text-red-400', 'text-amber-400', 'text-purple-400',
                    'text-cyan-400', 'text-rose-400', 'text-teal-400', 'text-orange-400', 'text-indigo-400'
                  ];
                  return (
                    <div key={nat.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{nat.flag}</span>
                        <span className="text-white/90 font-medium text-sm">{nat.country}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-3 bg-white/10 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full ${barColors[i % barColors.length]} rounded-full shadow-[0_0_6px_rgba(255,255,255,0.2)]`} style={{ width: `${nat.percentage * 4}%` }} />
                        </div>
                        <span className={`${textColors[i % textColors.length]} text-xs font-bold w-8 text-right`}>{nat.percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-white/60 text-center mt-6">
            Sources: Dubai Land Department (DLD), RERA, DXB Interact. YTD 2026 data. For informational purposes only. Does not constitute financial advice.{" "}
            <Link to="/contact" className="text-gold hover:underline">Contact our team</Link> for professional guidance.
          </p>
        </div>
      </div>
    </section>
  );
};

export default DLDMarketWidget;
