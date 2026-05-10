/**
 * DLD Market Widget — Premium investor-grade market stats component
 * Used on AreaDetail, Properties, and ProjectDetail pages
 */

import { TrendingUp, Building2, Banknote, MapPin, Globe, ArrowUpRight, BarChart3, Activity } from "lucide-react";
import { ytd2026 as fallbackYtd, topAreas2026 as fallbackAreas, topNationalities as fallbackNationalities } from "@/constants/dldMarketData";
import { useDLDMarketData } from "@/hooks/useDLDMarketData";
import { Link } from "react-router-dom";

interface DLDMarketWidgetProps {
  highlightArea?: string;
  compact?: boolean;
}

const DLDMarketWidget = ({ highlightArea, compact = false }: DLDMarketWidgetProps) => {
  const { data: marketData } = useDLDMarketData();
  const ytd2026 = marketData?.ytd2026 ?? fallbackYtd;
  const topAreas2026 = marketData?.topAreas2026 ?? fallbackAreas;
  const topNationalities = marketData?.topNationalities ?? fallbackNationalities;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const matchedArea = highlightArea
    ? topAreas2026.find(a => a.area.toLowerCase().includes(highlightArea.toLowerCase()))
    : null;

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-[#B89555]/20 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1A1A1A]" />
            Dubai Market Pulse
          </h3>
          <span className="text-[10px] text-white/80">As of {today}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <p className="text-[10px] text-emerald-300/80 uppercase tracking-wider font-medium">YTD Volume</p>
            <p className="text-emerald-400 font-bold text-lg">{ytd2026.value}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-[10px] text-blue-300/80 uppercase tracking-wider font-medium">Transactions</p>
            <p className="text-blue-400 font-bold text-lg">{ytd2026.transactions.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <p className="text-[10px] text-emerald-300/80 uppercase tracking-wider font-medium">Growth</p>
            <p className="text-emerald-400 font-bold text-lg">{ytd2026.growth}</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <p className="text-[10px] text-purple-300/80 uppercase tracking-wider font-medium">Off-Plan</p>
            <p className="text-purple-400 font-bold text-lg">{ytd2026.offPlan.toLocaleString()}</p>
          </div>
        </div>
        {matchedArea && (
          <div className="bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-lg p-3">
            <p className="text-[10px] text-[#1A1A1A] uppercase tracking-wider mb-1">This Area</p>
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">{matchedArea.transactions.toLocaleString()} transactions</span>
              <span className="text-emerald-400 text-sm font-semibold">{matchedArea.change}</span>
            </div>
          </div>
        )}
        <p className="text-[9px] text-white/70 leading-relaxed">
          Sources: DLD, RERA, DXB Interact. For informational purposes only.{" "}
          <Link to="/contact" className="text-[#1A1A1A] hover:underline">Contact our team</Link> for professional guidance.
        </p>
      </div>
    );
  }

  // Full premium version
  const offPlanPct = Math.round((ytd2026.offPlan / ytd2026.transactions) * 100);
  const secondaryPct = 100 - offPlanPct;
  const cashPct = Math.round((ytd2026.cash / ytd2026.transactions) * 100);
  const mortgagePct = 100 - cashPct;
  const giftsPct = ytd2026.gifts ? Math.round((ytd2026.gifts / ytd2026.transactions) * 100) : 0;

  const mainStats = [
    { label: "YTD Volume", value: ytd2026.value, sub: "Total transaction value", icon: Banknote, gradient: "from-emerald-500 via-teal-500 to-green-600", borderColor: "border-emerald-300/70", bgColor: "bg-gradient-to-br from-emerald-50 via-white to-teal-50/60", glow: "drop-shadow-[0_2px_8px_rgba(16,185,129,0.35)]", dotColor: "bg-emerald-500", labelColor: "text-emerald-700", subColor: "text-emerald-700/80" },
    { label: "Transactions", value: ytd2026.transactions.toLocaleString(), sub: "YTD 2026 deals", icon: Building2, gradient: "from-blue-500 via-indigo-500 to-purple-600", borderColor: "border-blue-300/70", bgColor: "bg-gradient-to-br from-blue-50 via-white to-indigo-50/60", glow: "drop-shadow-[0_2px_8px_rgba(59,130,246,0.35)]", dotColor: "bg-blue-500", labelColor: "text-blue-700", subColor: "text-blue-700/80" },
    { label: "Off-Plan Sales", value: ytd2026.offPlan.toLocaleString(), sub: `${offPlanPct}% of total`, icon: TrendingUp, gradient: "from-emerald-500 via-green-500 to-lime-600", borderColor: "border-emerald-300/70", bgColor: "bg-gradient-to-br from-emerald-50 via-white to-lime-50/60", glow: "drop-shadow-[0_2px_8px_rgba(16,185,129,0.35)]", dotColor: "bg-emerald-500", labelColor: "text-emerald-700", subColor: "text-emerald-700/80" },
    { label: "Secondary Sales", value: ytd2026.secondary.toLocaleString(), sub: `${secondaryPct}% of total`, icon: Activity, gradient: "from-rose-500 via-red-500 to-orange-500", borderColor: "border-rose-300/70", bgColor: "bg-gradient-to-br from-rose-50 via-white to-orange-50/60", glow: "drop-shadow-[0_2px_8px_rgba(244,63,94,0.35)]", dotColor: "bg-rose-500", labelColor: "text-rose-700", subColor: "text-rose-700/80" },
    { label: "Cash Deals", value: ytd2026.cash.toLocaleString(), sub: `${cashPct}% of total`, icon: Banknote, gradient: "from-cyan-500 via-blue-500 to-indigo-600", borderColor: "border-cyan-300/70", bgColor: "bg-gradient-to-br from-cyan-50 via-white to-blue-50/60", glow: "drop-shadow-[0_2px_8px_rgba(6,182,212,0.35)]", dotColor: "bg-cyan-500", labelColor: "text-cyan-700", subColor: "text-cyan-700/80" },
    { label: "Mortgage Deals", value: ytd2026.mortgage.toLocaleString(), sub: `${mortgagePct}% of total`, icon: BarChart3, gradient: "from-amber-500 via-orange-500 to-rose-500", borderColor: "border-amber-300/70", bgColor: "bg-gradient-to-br from-amber-50 via-white to-orange-50/60", glow: "drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)]", dotColor: "bg-amber-500", labelColor: "text-amber-700", subColor: "text-amber-700/80" },
  ];

  return (
    <section className="py-16 overflow-hidden rounded-3xl mx-4 md:mx-8 bg-gradient-to-br from-white via-stone-50 to-amber-50/30 border border-[#B89555]/20 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">

          {/* Premium Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-full px-4 py-1.5 mb-4">
              <Banknote className="w-4 h-4 text-[#1A1A1A]" />
              <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.2em] font-semibold">Live Market Data</span>
            </div>
            <h2 className="text-foreground text-2xl md:text-3xl font-bold mb-2">
              Dubai Market Intelligence
            </h2>
            <p className="text-[#1A1A1A] text-sm font-medium">
              DLD Transaction Data • As of {today}
            </p>
          </div>

          {/* Growth Banner — premium gradient */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-300/80 rounded-2xl p-5 mb-8 flex items-center justify-between shadow-[0_8px_30px_rgba(16,185,129,0.15)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_4px_15px_rgba(16,185,129,0.4)]">
                <ArrowUpRight className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-emerald-900 text-xs uppercase tracking-wider font-bold">YTD Market Growth</p>
                <p className="text-emerald-700 text-[11px] font-medium">Year-over-year volume increase</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl md:text-5xl font-extrabold bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(16,185,129,0.35)]">{ytd2026.growth}</p>
            </div>
          </div>

          {/* 6-Metric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {mainStats.map((stat) => (
              <div key={stat.label} className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-xl p-5 relative overflow-hidden group hover:scale-[1.03] hover:shadow-lg transition-all duration-300 shadow-sm`}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#1A1A1A]/[0.02] -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${stat.dotColor} shadow-[0_0_8px] shadow-current animate-pulse`} />
                  <span className={`${stat.labelColor} text-[10px] uppercase tracking-[0.15em] font-bold`}>{stat.label}</span>
                </div>
                <p className={`text-2xl md:text-3xl font-extrabold bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent ${stat.glow} mb-1`}>{stat.value}</p>
                <p className={`${stat.subColor} text-[11px] font-semibold`}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Transaction Split Bars — Premium */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Off-Plan vs Secondary */}
            <div className="bg-[#FDFBF7] rounded-2xl p-6 border border-stone-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-foreground font-semibold text-sm">Off-Plan vs Secondary</h3>
              </div>
              {/* Visual bar */}
              <div className="h-8 rounded-full overflow-hidden mb-4 flex shadow-inner bg-[#F7F2EA] border border-stone-200">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 rounded-l-full shadow-[0_0_10px_rgba(16,185,129,0.4)] flex items-center justify-center"
                  style={{ width: `${offPlanPct}%` }}
                >
                  <span className="text-white text-[10px] font-bold drop-shadow">{offPlanPct}%</span>
                </div>
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-red-400 to-red-500 flex-1 rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.4)] flex items-center justify-center"
                >
                  <span className="text-white text-[10px] font-bold drop-shadow">{secondaryPct}%</span>
                </div>
              </div>
              {/* Legend with colored cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                    <span className="text-emerald-700 text-[10px] uppercase tracking-wider font-bold">Off-Plan</span>
                  </div>
                  <p className="text-emerald-600 text-lg font-extrabold">{ytd2026.offPlan.toLocaleString()}</p>
                  <p className="text-emerald-600 text-[10px] font-medium">{offPlanPct}% of total</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                    <span className="text-red-700 text-[10px] uppercase tracking-wider font-bold">Secondary</span>
                  </div>
                  <p className="text-red-600 text-lg font-extrabold">{ytd2026.secondary.toLocaleString()}</p>
                  <p className="text-red-600 text-[10px] font-medium">{secondaryPct}% of total</p>
                </div>
              </div>
            </div>

            {/* Cash vs Mortgage */}
            <div className="bg-[#FDFBF7] rounded-2xl p-6 border border-stone-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="w-4 h-4 text-blue-600" />
                <h3 className="text-foreground font-semibold text-sm">Cash vs Mortgage</h3>
              </div>
              <div className="h-8 rounded-full overflow-hidden mb-4 flex shadow-inner bg-[#F7F2EA] border border-stone-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-l-full shadow-[0_0_10px_rgba(59,130,246,0.4)] flex items-center justify-center"
                  style={{ width: `${cashPct}%` }}
                >
                  <span className="text-white text-[10px] font-bold drop-shadow">{cashPct}%</span>
                </div>
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 flex-1 rounded-r-full shadow-[0_0_10px_rgba(245,158,11,0.4)] flex items-center justify-center"
                >
                  <span className="text-white text-[10px] font-bold drop-shadow">{mortgagePct}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                    <span className="text-blue-700 text-[10px] uppercase tracking-wider font-bold">Cash</span>
                  </div>
                  <p className="text-blue-600 text-lg font-extrabold">{ytd2026.cash.toLocaleString()}</p>
                  <p className="text-blue-600 text-[10px] font-medium">{cashPct}% of total</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                    <span className="text-amber-700 text-[10px] uppercase tracking-wider font-bold">Mortgage</span>
                  </div>
                  <p className="text-amber-600 text-lg font-extrabold">{ytd2026.mortgage.toLocaleString()}</p>
                  <p className="text-amber-600 text-[10px] font-medium">{mortgagePct}% of total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Areas + Nationalities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 10 Areas */}
            <div className="bg-[#FDFBF7] rounded-2xl p-6 border border-[#B89555]/20 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="w-4 h-4 text-[#1A1A1A]" />
                <h3 className="text-foreground text-sm font-bold">Top 10 Areas by Transactions</h3>
              </div>
              <div className="space-y-2">
                {topAreas2026.slice(0, 10).map((area, i) => {
                  const isHighlighted = highlightArea && area.area.toLowerCase().includes(highlightArea.toLowerCase());
                  const maxTx = topAreas2026[0]?.transactions || 1;
                  const barWidth = Math.max((area.transactions / maxTx) * 100, 8);
                  const barColors = [
                    'from-emerald-500 to-emerald-400', 'from-blue-500 to-blue-400', 'from-purple-500 to-purple-400',
                    'from-amber-500 to-amber-400', 'from-cyan-500 to-cyan-400', 'from-rose-500 to-rose-400',
                    'from-teal-500 to-teal-400', 'from-orange-500 to-orange-400', 'from-indigo-500 to-indigo-400',
                    'from-pink-500 to-pink-400'
                  ];
                  return (
                    <div key={area.area} className={`relative rounded-lg overflow-hidden ${isHighlighted ? "ring-1 ring-gold/50" : ""}`}>
                      <div className="absolute inset-0 bg-[#F7F2EA] rounded-lg" />
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColors[i]} opacity-15 rounded-lg`}
                        style={{ width: `${barWidth}%` }}
                      />
                      <div className="relative flex items-center justify-between px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-white text-[10px] font-extrabold w-6 text-center bg-gradient-to-br ${barColors[i]} rounded py-1 shadow-md`}>{i + 1}</span>
                          <span className={`text-sm font-semibold ${isHighlighted ? "text-[#1A1A1A]" : "text-foreground"}`}>{area.area}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-foreground text-xs font-bold">{area.transactions.toLocaleString()}</span>
                          <span className="text-emerald-700 text-xs font-extrabold bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-300 px-2 py-0.5 rounded-full">{area.change}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 10 Nationalities */}
            <div className="bg-[#FDFBF7] rounded-2xl p-6 border border-[#B89555]/20 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Globe className="w-4 h-4 text-[#1A1A1A]" />
                <h3 className="text-foreground text-sm font-bold">Top 10 Buyer Nationalities</h3>
              </div>
              <div className="space-y-2">
                {topNationalities.slice(0, 10).map((nat, i) => {
                  const barColors = [
                    'from-emerald-500 to-emerald-400', 'from-blue-500 to-blue-400', 'from-red-400 to-red-500',
                    'from-amber-500 to-amber-400', 'from-purple-500 to-purple-400', 'from-cyan-500 to-cyan-400',
                    'from-rose-500 to-rose-400', 'from-teal-500 to-teal-400', 'from-orange-500 to-orange-400',
                    'from-indigo-500 to-indigo-400'
                  ];
                  const textColors = [
                    'text-emerald-600', 'text-blue-600', 'text-red-600', 'text-amber-600', 'text-purple-600',
                    'text-cyan-600', 'text-rose-600', 'text-teal-600', 'text-orange-600', 'text-indigo-600'
                  ];
                  const bgColors = [
                    'bg-emerald-500', 'bg-blue-500', 'bg-red-400', 'bg-amber-500', 'bg-purple-500',
                    'bg-cyan-500', 'bg-rose-500', 'bg-teal-500', 'bg-orange-500', 'bg-indigo-500'
                  ];
                  const maxPct = topNationalities[0]?.percentage || 1;
                  const barWidth = Math.max((nat.percentage / maxPct) * 100, 8);

                  return (
                    <div key={nat.country} className="relative rounded-lg overflow-hidden">
                      <div className="absolute inset-0 bg-[#F7F2EA] rounded-lg" />
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColors[i % barColors.length]} opacity-10 rounded-lg`}
                        style={{ width: `${barWidth}%` }}
                      />
                      <div className="relative flex items-center justify-between px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg leading-none">{nat.flag}</span>
                          <span className="text-foreground font-semibold text-sm">{nat.country}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2.5 bg-[#EFE6D6] rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${barColors[i % barColors.length]} rounded-full shadow-[0_0_6px] shadow-current`}
                              style={{ width: `${nat.percentage * 4}%` }}
                            />
                          </div>
                          <span className={`${textColors[i % textColors.length]} text-xs font-extrabold w-8 text-right`}>{nat.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gifts row if available */}
          {ytd2026.gifts && ytd2026.gifts > 0 && (
            <div className="mt-6 bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 border-2 border-purple-300/80 rounded-xl p-4 flex items-center justify-between shadow-[0_4px_20px_rgba(168,85,247,0.15)]">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] animate-pulse" />
                <span className="text-purple-800 text-xs uppercase tracking-wider font-extrabold">Gift Transactions</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-extrabold bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-600 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(168,85,247,0.35)]">{ytd2026.gifts.toLocaleString()}</span>
                <span className="text-purple-700 text-xs font-bold">{giftsPct}% of total</span>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-foreground/50 text-center mt-8 max-w-2xl mx-auto leading-relaxed">
            Sources: Dubai Land Department (DLD), RERA, DXB Interact. YTD 2026 data. For informational purposes only. Does not constitute financial advice.{" "}
            <Link to="/contact" className="text-[#1A1A1A] hover:underline">Contact our team</Link> for professional guidance.
          </p>
        </div>
      </div>
    </section>
  );
};

export default DLDMarketWidget;
