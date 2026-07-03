/**
 * DLD Market Widget — premium institutional palette
 * Champagne surfaces, gold hairline accents, ink typography, restrained
 * semantic colours (deep emerald / deep navy / bronze) for data. No rainbow.
 *
 * Adds:
 *   • Live "as of today" updating numbers (via useDLDMarketData ticks + daily cron)
 *   • Customizable date-range, JBJ-branded PDF report download
 *   • Expandable Top 5 buyer nationalities per area
 *
 * Untouched per user request:
 *   • Gift Transactions row
 *   • Disclaimer / "Notice something incorrect" sections
 */

import { useMemo, useState } from "react";
import {
  TrendingUp,
  Building2,
  Banknote,
  MapPin,
  Globe,
  ArrowUpRight,
  BarChart3,
  Activity,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ytd2026 as fallbackYtd,
  topAreas2026 as fallbackAreas,
  topNationalities as fallbackNationalities,
} from "@/constants/dldMarketData";
import { useDLDMarketData } from "@/hooks/useDLDMarketData";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { generateDldReportPdf } from "@/utils/dldReportPdf";

interface DLDMarketWidgetProps {
  highlightArea?: string;
  compact?: boolean;
}

// ─── Premium institutional palette (muted, semantic) ────────────────
// gold accent for chrome/borders only; data tones below
const TONE = {
  emerald: { text: "text-[#1E5F3F]", soft: "bg-[#1E5F3F]/8", border: "border-[#1E5F3F]/25", dot: "bg-[#1E5F3F]", bar: "bg-[#1E5F3F]" },
  navy:    { text: "text-[#1F3A5F]", soft: "bg-[#1F3A5F]/8", border: "border-[#1F3A5F]/25", dot: "bg-[#1F3A5F]", bar: "bg-[#1F3A5F]" },
  steel:   { text: "text-[#0A0A0A]", soft: "bg-[#0A0A0A]/8", border: "border-[#0A0A0A]/25", dot: "bg-[#0A0A0A]", bar: "bg-[#0A0A0A]" },
  bronze:  { text: "text-[#B89555]", soft: "bg-[#B89555]/8", border: "border-[#B89555]/25", dot: "bg-[#B89555]", bar: "bg-[#B89555]" },
  copper:  { text: "text-[#B89555]", soft: "bg-[#B89555]/8", border: "border-[#B89555]/25", dot: "bg-[#B89555]", bar: "bg-[#B89555]" },
  ink:     { text: "text-[#1A1A1A]", soft: "bg-[#1A1A1A]/5",  border: "border-[#1A1A1A]/15", dot: "bg-[#1A1A1A]", bar: "bg-[#1A1A1A]" },
} as const;

const todayFmt = (d = new Date()) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// ─── Date-range download dialog ─────────────────────────────────────
const DownloadReportDialog = ({
  ytd,
  topAreas,
  topNationalities,
  areaNationalities,
  lastUpdated,
}: {
  ytd: any;
  topAreas: any[];
  topNationalities: any[];
  areaNationalities: Record<string, any[]>;
  lastUpdated: string | null;
}) => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenAgo = new Date(now); sevenAgo.setDate(now.getDate() - 6);
  const thirtyAgo = new Date(now); thirtyAgo.setDate(now.getDate() - 29);

  const [from, setFrom] = useState(isoDate(startOfYear));
  const [to, setTo] = useState(isoDate(now));
  const [open, setOpen] = useState(false);

  const preset = (a: Date, b: Date) => { setFrom(isoDate(a)); setTo(isoDate(b)); };

  const handleDownload = () => {
    generateDldReportPdf({
      ytd, topAreas, topNationalities, areaNationalities,
      rangeFrom: new Date(from),
      rangeTo: new Date(to),
      lastUpdated,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-emerald-action="true" size="sm" className="jj-emerald-action gap-2">
          <Download className="w-4 h-4" />
          Download Report
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#FDFBF7] border border-[#B89555]/40">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">Download Market Intelligence Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 font-semibold mb-2">
              Quick range
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => preset(sevenAgo, now)} className="px-3 py-1.5 text-xs rounded-full border border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]">Last 7 days</button>
              <button type="button" onClick={() => preset(thirtyAgo, now)} className="px-3 py-1.5 text-xs rounded-full border border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]">Last 30 days</button>
              <button type="button" onClick={() => preset(startOfMonth, now)} className="px-3 py-1.5 text-xs rounded-full border border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]">This month</button>
              <button type="button" onClick={() => preset(startOfYear, now)} className="px-3 py-1.5 text-xs rounded-full border border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]">YTD</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-[#1A1A1A]/80">
              From
              <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full bg-[#F7F2EA] border border-[#B89555]/40 rounded-md px-3 py-2 text-sm text-[#1A1A1A]" />
            </label>
            <label className="text-xs text-[#1A1A1A]/80">
              To
              <input type="date" value={to} min={from} max={isoDate(now)} onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full bg-[#F7F2EA] border border-[#B89555]/40 rounded-md px-3 py-2 text-sm text-[#1A1A1A]" />
            </label>
          </div>

          <p className="text-[11px] text-[#1A1A1A]/60 leading-relaxed">
            Branded JBJ GLOBAL REAL ESTATE report. Includes YTD volume, transaction
            split, top 10 areas, top 10 buyer nationalities, and per-area top 5
            nationalities. Sources: DLD, RERA, DXB Interact.
          </p>
        </div>
        <DialogFooter>
          <Button variant="gold" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" /> Generate PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DLDMarketWidget = ({ highlightArea, compact = false }: DLDMarketWidgetProps) => {
  const { data: marketData } = useDLDMarketData();
  const ytd2026 = marketData?.ytd2026 ?? fallbackYtd;
  const topAreas2026 = marketData?.topAreas2026 ?? fallbackAreas;
  const topNationalities = marketData?.topNationalities ?? fallbackNationalities;
  const areaNationalities = marketData?.areaNationalities ?? {};
  const lastUpdated = marketData?.lastUpdated ?? null;
  const today = todayFmt();

  const matchedArea = highlightArea
    ? topAreas2026.find((a: any) => a.area.toLowerCase().includes(highlightArea.toLowerCase()))
    : null;

  const [expandedArea, setExpandedArea] = useState<string | null>(
    highlightArea && matchedArea ? matchedArea.area : null,
  );

  // ─── Compact variant (sidebar) ────────────────────────────────────
  if (compact) {
    return (
      <div className="bg-[#FDFBF7] rounded-2xl border border-[#B89555]/30 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[#1A1A1A] font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#B89555]" />
            Dubai Market Pulse
          </h3>
          <span className="text-[10px] text-[#1A1A1A]/60">As of {today}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "YTD Volume", value: ytd2026.value, tone: TONE.emerald },
            { label: "Transactions", value: ytd2026.transactions.toLocaleString(), tone: TONE.navy },
            { label: "Growth", value: ytd2026.growth, tone: TONE.emerald },
            { label: "Off-Plan", value: ytd2026.offPlan.toLocaleString(), tone: TONE.bronze },
          ].map((s) => (
            <div key={s.label} className={`${s.tone.soft} border ${s.tone.border} rounded-lg p-3`}>
              <p className="text-[10px] text-[#1A1A1A]/65 uppercase tracking-wider font-medium">{s.label}</p>
              <p className={`${s.tone.text} font-bold text-lg`}>{s.value}</p>
            </div>
          ))}
        </div>
        {matchedArea && (
          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-lg p-3">
            <p className="text-[10px] text-[#1A1A1A]/65 uppercase tracking-wider mb-1">This Area</p>
            <div className="flex items-center justify-between">
              <span className="text-[#1A1A1A] text-sm font-medium">{matchedArea.transactions.toLocaleString()} transactions</span>
              <span className="text-[#1E5F3F] text-sm font-semibold">{matchedArea.change}</span>
            </div>
          </div>
        )}
        <p className="text-[9px] text-[#1A1A1A]/60 leading-relaxed">
          Sources: DLD, RERA, DXB Interact. For informational purposes only.{" "}
          <Link to="/contact" className="text-[#B89555] hover:underline">Contact our team</Link> for professional guidance.
        </p>
      </div>
    );
  }

  // ─── Full premium widget ──────────────────────────────────────────
  const offPlanPct = Math.round((ytd2026.offPlan / ytd2026.transactions) * 100);
  const secondaryPct = 100 - offPlanPct;
  const cashPct = Math.round((ytd2026.cash / ytd2026.transactions) * 100);
  const mortgagePct = 100 - cashPct;
  const giftsPct = ytd2026.gifts ? Math.round((ytd2026.gifts / ytd2026.transactions) * 100) : 0;

  const mainStats = [
    { label: "YTD Volume",      value: ytd2026.value,                       sub: "Total transaction value", icon: Banknote,    tone: TONE.emerald },
    { label: "Transactions",    value: ytd2026.transactions.toLocaleString(), sub: "YTD 2026 deals",        icon: Building2,   tone: TONE.navy },
    { label: "Off-Plan Sales",  value: ytd2026.offPlan.toLocaleString(),    sub: `${offPlanPct}% of total`, icon: TrendingUp,  tone: TONE.emerald },
    { label: "Secondary Sales", value: ytd2026.secondary.toLocaleString(),  sub: `${secondaryPct}% of total`, icon: Activity,  tone: TONE.copper },
    { label: "Cash Deals",      value: ytd2026.cash.toLocaleString(),       sub: `${cashPct}% of total`,    icon: Banknote,    tone: TONE.steel },
    { label: "Mortgage Deals",  value: ytd2026.mortgage.toLocaleString(),   sub: `${mortgagePct}% of total`, icon: BarChart3,  tone: TONE.bronze },
  ];

  return (
    <section className="py-10 md:py-14 overflow-hidden bg-[#FDFBF7]">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="max-w-[1600px] mx-auto">


          {/* Header */}
          <div className="text-center mb-10">
            <div data-label-emerald-only data-allow-dark-cta data-no-contrast-guard className="allow-white jj-pill-emerald-metallic inline-flex items-center gap-2 border-0 rounded-full px-4 py-1.5 mb-4 transition-colors">
              <Banknote className="w-4 h-4 text-white" />
              <span className="text-white text-xs uppercase tracking-[0.2em] font-semibold">Live Market Data</span>
            </div>

            <h2 className="text-[#1A1A1A] text-2xl md:text-3xl font-bold mb-2">
              Dubai Market Intelligence
            </h2>
            <p className="text-[#1A1A1A]/70 text-sm font-medium">
              DLD Transaction Data • As of {today}
              {lastUpdated && (
                <span className="text-[#1A1A1A]/45"> • synced {todayFmt(new Date(lastUpdated))}</span>
              )}
            </p>

            <div className="mt-5 flex justify-center">
              <DownloadReportDialog
                ytd={ytd2026}
                topAreas={topAreas2026}
                topNationalities={topNationalities}
                areaNationalities={areaNationalities}
                lastUpdated={lastUpdated}
              />
            </div>
          </div>

          {/* Growth Banner */}
          <div className="bg-[#F7F2EA] border border-[#B89555]/40 rounded-2xl p-5 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div data-emerald-action="true" className="jj-emerald-action w-12 h-12 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6" style={{ color: '#FFFFFF' }} />
              </div>
              <div>
                <p className="text-[#1A1A1A] text-xs uppercase tracking-wider font-bold">YTD Market Growth</p>
                <p className="text-[#1A1A1A]/65 text-[11px] font-medium">Year-over-year volume increase</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl md:text-5xl font-extrabold text-[#1E5F3F]">{ytd2026.growth}</p>
            </div>
          </div>

          {/* 6-Metric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {mainStats.map((stat) => (
              <div key={stat.label} className={`bg-[#F7F2EA] border ${stat.tone.border} rounded-xl p-5 relative overflow-hidden group hover:shadow-[0_6px_24px_rgba(26,26,26,0.06)] transition-all duration-300`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${stat.tone.dot}`} />
                  <span className="text-[#1A1A1A]/70 text-[10px] uppercase tracking-[0.15em] font-bold">{stat.label}</span>
                </div>
                <p className={`text-2xl md:text-3xl font-extrabold ${stat.tone.text} mb-1`}>{stat.value}</p>
                <p className="text-[#1A1A1A]/55 text-[11px] font-semibold">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Transaction split bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Off-Plan vs Secondary */}
            <div className="bg-[#F7F2EA] rounded-2xl p-6 border border-[#B89555]/30">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[#B89555]" />
                <h3 className="text-[#0A0A0A] font-semibold text-sm">Off-Plan vs Secondary</h3>
              </div>

              <div className="h-8 rounded-full overflow-hidden mb-4 flex bg-[#B89555]">
                <div data-emerald-action="true" className="jj-emerald-action h-full flex items-center justify-center" style={{ width: `${offPlanPct}%` }}>
                  <span style={{ color: '#FFFFFF' }} className="text-[11px] font-bold">{offPlanPct}%</span>
                </div>
                <div className="h-full flex-1 flex items-center justify-center">
                  <span style={{ color: '#FFFFFF' }} className="text-[11px] font-bold">{secondaryPct}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1E5F3F]/8 border border-[#1E5F3F]/25 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1E5F3F]" />
                    <span className="text-[#1E5F3F] text-[10px] uppercase tracking-wider font-bold">Off-Plan</span>
                  </div>
                  <p className="text-[#1E5F3F] text-lg font-extrabold">{ytd2026.offPlan.toLocaleString()}</p>
                  <p className="text-[#1A1A1A]/55 text-[10px] font-medium">{offPlanPct}% of total</p>
                </div>
                <div className="bg-[#B89555]/8 border border-[#B89555]/25 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#B89555]" />
                    <span className="text-[#B89555] text-[10px] uppercase tracking-wider font-bold">Secondary</span>
                  </div>
                  <p className="text-[#B89555] text-lg font-extrabold">{ytd2026.secondary.toLocaleString()}</p>
                  <p className="text-[#1A1A1A]/55 text-[10px] font-medium">{secondaryPct}% of total</p>
                </div>
              </div>
            </div>

            {/* Cash vs Mortgage */}
            <div className="bg-[#F7F2EA] rounded-2xl p-6 border border-[#B89555]/30">
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="w-4 h-4 text-[#B89555]" />
                <h3 className="text-[#0A0A0A] font-semibold text-sm">Cash vs Mortgage</h3>
              </div>
              <div className="h-8 rounded-full overflow-hidden mb-4 flex bg-[#B89555]">
                <div data-emerald-action="true" className="jj-emerald-action h-full flex items-center justify-center" style={{ width: `${cashPct}%` }}>
                  <span style={{ color: '#FFFFFF' }} className="text-[11px] font-bold">{cashPct}%</span>
                </div>
                <div className="h-full flex-1 flex items-center justify-center">
                  <span style={{ color: '#FFFFFF' }} className="text-[11px] font-bold">{mortgagePct}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0A0A0A]/8 border border-[#0A0A0A]/25 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0A0A0A]" />
                    <span className="text-[#0A0A0A] text-[10px] uppercase tracking-wider font-bold">Cash</span>
                  </div>
                  <p className="text-[#0A0A0A] text-lg font-extrabold">{ytd2026.cash.toLocaleString()}</p>
                  <p className="text-[#1A1A1A]/55 text-[10px] font-medium">{cashPct}% of total</p>
                </div>
                <div className="bg-[#B89555]/8 border border-[#B89555]/25 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#B89555]" />
                    <span className="text-[#B89555] text-[10px] uppercase tracking-wider font-bold">Mortgage</span>
                  </div>
                  <p className="text-[#B89555] text-lg font-extrabold">{ytd2026.mortgage.toLocaleString()}</p>
                  <p className="text-[#1A1A1A]/55 text-[10px] font-medium">{mortgagePct}% of total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Areas + Nationalities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Top 10 Areas — single muted gold accent, expandable for nationalities */}
            <div className="bg-[#F7F2EA] rounded-2xl p-6 border border-[#B89555]/30">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="w-4 h-4 text-[#B89555]" />
                <h3 className="text-[#0A0A0A] text-sm font-bold">Top 10 Areas by Transactions</h3>
              </div>

              <div className="space-y-1.5">
                {topAreas2026.slice(0, 10).map((area: any, i: number) => {
                  const isHighlighted =
                    highlightArea && area.area.toLowerCase().includes(highlightArea.toLowerCase());
                  const maxTx = topAreas2026[0]?.transactions || 1;
                  const barWidth = Math.max((area.transactions / maxTx) * 100, 8);
                  const isExpanded = expandedArea === area.area;
                  const nats = areaNationalities[area.area] ?? [];

                  return (
                    <div
                      key={area.area}
                      className={`relative rounded-lg overflow-hidden border ${isHighlighted ? "border-[#B89555]/60" : "border-[#B89555]/15"} bg-[#FDFBF7]`}
                    >
                      <div className="absolute inset-y-0 left-0 bg-[#B89555]/10" style={{ width: `${barWidth}%` }} />
                      <button
                        type="button"
                        onClick={() => setExpandedArea(isExpanded ? null : area.area)}
                        className="relative w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#EFE6D6]/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[#1A1A1A] text-[10px] font-extrabold w-6 text-center bg-[#EFE6D6] border border-[#B89555]/40 rounded py-1">
                            {i + 1}
                          </span>
                          <span className={`text-sm font-semibold ${isHighlighted ? "text-[#B89555]" : "text-[#1A1A1A]"}`}>
                            {area.area}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[#0A0A0A] text-xs font-bold">{area.transactions.toLocaleString()}</span>
                          <span className="text-[#1E5F3F] text-xs font-extrabold bg-[#1E5F3F]/8 border border-[#1E5F3F]/25 px-2 py-0.5 rounded-full">
                            {area.change}
                          </span>
                          {nats.length > 0 &&
                            (isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#B89555]" strokeWidth={2.5} />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#B89555]" strokeWidth={2.5} />
                            ))}

                        </div>
                      </button>

                      {isExpanded && nats.length > 0 && (
                        <div className="relative bg-[#FDFBF7] border-t border-[#B89555]/20 px-3 py-3">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-[#1A1A1A]/55 font-bold mb-2">
                            Top 5 Buyer Nationalities
                          </p>
                          <div className="space-y-1.5">
                            {nats.slice(0, 5).map((n: any) => (
                              <div key={n.country} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-base leading-none">{n.flag}</span>
                                  <span className="text-[#1A1A1A] text-xs font-medium truncate">{n.country}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-1 max-w-[140px]">
                                  <div className="flex-1 h-1.5 rounded-full bg-[#EFE6D6] overflow-hidden">
                                    <div className="h-full bg-[#B89555]" style={{ width: `${Math.min(n.percentage * 3, 100)}%` }} />
                                  </div>
                                  <span className="text-[#1A1A1A] text-[11px] font-bold w-7 text-right">{n.percentage}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 10 Nationalities — single bronze accent */}
            <div className="bg-[#F7F2EA] rounded-2xl p-6 border border-[#B89555]/30">
              <div className="flex items-center gap-2 mb-5">
                <Globe className="w-4 h-4 text-[#B89555]" />
                <h3 className="text-[#0A0A0A] text-sm font-bold">Top 10 Buyer Nationalities</h3>
              </div>

              <div className="space-y-1.5">
                {topNationalities.slice(0, 10).map((nat: any) => {
                  const maxPct = topNationalities[0]?.percentage || 1;
                  const barWidth = Math.max((nat.percentage / maxPct) * 100, 8);
                  return (
                    <div key={nat.country} className="relative rounded-lg overflow-hidden border border-[#B89555]/15 bg-[#FDFBF7]">
                      <div className="absolute inset-y-0 left-0 bg-[#B89555]/10" style={{ width: `${barWidth}%` }} />
                      <div className="relative flex items-center justify-between px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg leading-none">{nat.flag}</span>
                          <span className="text-[#1A1A1A] font-semibold text-sm">{nat.country}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-[#EFE6D6] rounded-full overflow-hidden">
                            <div className="h-full bg-[#B89555] rounded-full" style={{ width: `${nat.percentage * 4}%` }} />
                          </div>
                          <span className="text-[#1A1A1A] text-xs font-extrabold w-8 text-right">{nat.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gifts row — champagne+gold premium treatment */}
          {ytd2026.gifts && ytd2026.gifts > 0 && (
            <div className="mt-6 bg-[#F7F2EA] border border-[#B89555]/40 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#B89555]" />
                <span className="text-[#1A1A1A] text-xs uppercase tracking-wider font-extrabold">Gift Transactions</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-extrabold text-[#1A1A1A] tabular-nums">{ytd2026.gifts.toLocaleString()}</span>
                <span className="text-[#1A1A1A]/65 text-xs font-bold">{giftsPct}% of total</span>
              </div>
            </div>
          )}

          {/* Disclaimer — untouched */}
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
