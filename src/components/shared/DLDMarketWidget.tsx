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
  bronze:  { text: "text-[#064E3B]", soft: "bg-[#064E3B]/8", border: "border-[#064E3B]/25", dot: "bg-[#064E3B]", bar: "bg-[#064E3B]" },
  copper:  { text: "text-[#064E3B]", soft: "bg-[#064E3B]/8", border: "border-[#064E3B]/25", dot: "bg-[#064E3B]", bar: "bg-[#064E3B]" },
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
    void (async () => {
      await generateDldReportPdf({
        ytd, topAreas, topNationalities, areaNationalities,
        rangeFrom: new Date(from),
        rangeTo: new Date(to),
        lastUpdated,
      });
      setOpen(false);
    })();
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-emerald-action="true" size="sm" className="jj-emerald-action gap-2">
          <Download className="w-4 h-4" />
          Download Report
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#FDFBF7] border border-[#A9822E]/40">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">Download Market Intelligence Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 font-semibold mb-2">
              Quick range
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => preset(sevenAgo, now)} className="px-3 py-1.5 text-xs rounded-full border border-[#A9822E]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]">Last 7 days</button>
              <button type="button" onClick={() => preset(thirtyAgo, now)} className="px-3 py-1.5 text-xs rounded-full border border-[#A9822E]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]">Last 30 days</button>
              <button type="button" onClick={() => preset(startOfMonth, now)} className="px-3 py-1.5 text-xs rounded-full border border-[#A9822E]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]">This month</button>
              <button type="button" onClick={() => preset(startOfYear, now)} className="px-3 py-1.5 text-xs rounded-full border border-[#A9822E]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]">YTD</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-[#1A1A1A]/80">
              From
              <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full bg-[#F7F2EA] border border-[#A9822E]/40 rounded-md px-3 py-2 text-sm text-[#1A1A1A]" />
            </label>
            <label className="text-xs text-[#1A1A1A]/80">
              To
              <input type="date" value={to} min={from} max={isoDate(now)} onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full bg-[#F7F2EA] border border-[#A9822E]/40 rounded-md px-3 py-2 text-sm text-[#1A1A1A]" />
            </label>
          </div>

          <p className="text-[11px] text-[#1A1A1A]/60 leading-relaxed">
            Branded JBJ GLOBAL REAL ESTATE report. Includes YTD volume, transaction
            split, top 10 areas, top 10 buyer nationalities, and per-area top 5
            nationalities. Sources: DLD, RERA, DXB Interact.
          </p>
        </div>
        <DialogFooter>
          <Button data-emerald-action="true" onClick={handleDownload} className="jj-emerald-action gap-2">
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
      <div className="bg-[#FDFBF7] rounded-2xl border border-[#A9822E]/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[#1A1A1A] font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#064E3B]" />
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
          <div className="bg-[#F7F2EA] border border-[#A9822E]/40 rounded-lg p-3">
            <p className="text-[10px] text-[#1A1A1A]/65 uppercase tracking-wider mb-1">This Area</p>
            <div className="flex items-center justify-between">
              <span className="text-[#1A1A1A] text-sm font-medium">{matchedArea.transactions.toLocaleString()} transactions</span>
              <span className="text-[#1E5F3F] text-sm font-semibold">{matchedArea.change}</span>
            </div>
          </div>
        )}
        <p className="text-[9px] text-[#1A1A1A]/60 leading-relaxed">
          Sources: DLD, RERA, DXB Interact. For informational purposes only.{" "}
          <Link to="/contact" className="text-[#064E3B] hover:underline">Contact our team</Link> for professional guidance.
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
    { label: "YTD Volume",      value: ytd2026.value,                       sub: "Total transaction value", icon: Banknote },
    { label: "Transactions",    value: ytd2026.transactions.toLocaleString(), sub: "YTD 2026 deals",        icon: Building2 },
    { label: "Off-Plan Sales",  value: ytd2026.offPlan.toLocaleString(),    sub: `${offPlanPct}% of total`, icon: TrendingUp },
    { label: "Secondary Sales", value: ytd2026.secondary.toLocaleString(),  sub: `${secondaryPct}% of total`, icon: Activity },
    { label: "Cash Deals",      value: ytd2026.cash.toLocaleString(),       sub: `${cashPct}% of total`,    icon: Banknote },
    { label: "Mortgage Deals",  value: ytd2026.mortgage.toLocaleString(),   sub: `${mortgagePct}% of total`, icon: BarChart3 },
  ];

  const INK = "#1A1A1A";
  const EMERALD_GRADIENT = "linear-gradient(155deg,#064E3B 0%,#042C1C 58%,#000000 100%)";
  const PANEL_GRADIENT = "linear-gradient(135deg,#FFFDF9 0%,#FDFBF7 52%,#F3EADA 100%)";
  const CARD_SURFACE = "linear-gradient(135deg,#FFFFFF 0%,#FBF7F0 100%)";
  const GOLD = "rgba(184,149,85,0.42)";

  return (
    <section
      data-dld-market-widget
      data-surface="champagne"
      className="py-10 md:py-14 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)" }}
    >
      {/* Edges are deliberately aligned with the "Launching a new development?"
          pre-footer card (max-w-6xl + identical horizontal padding). */}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          data-dld-market-panel
          data-surface="champagne"
          className="rounded-3xl border p-6 md:p-9"
          style={{ background: PANEL_GRADIENT, borderColor: GOLD, boxShadow: "0 24px 56px -36px rgba(44,31,13,0.34)" }}
        >
          {/* Header */}
          <div className="text-center mb-9">
            <div
              data-label-emerald-only
              data-allow-dark-cta
              data-no-contrast-guard
              data-surface="emerald"
              className="allow-white inline-flex items-center gap-2 border-0 rounded-full px-4 py-1.5 mb-4"
              style={{ background: EMERALD_GRADIENT }}
            >
              <Banknote className="w-4 h-4 text-white" />
              <span className="text-white text-[11px] uppercase tracking-[0.2em] font-semibold">Live Market Data</span>
            </div>

            <h2
              className="text-3xl md:text-4xl font-semibold leading-tight"
              style={{ color: INK, fontFamily: '"Cormorant Garamond", serif' }}
            >
              Dubai Market Intelligence
            </h2>
            <p className="mt-2 text-sm" style={{ color: "rgba(26,26,26,0.68)" }}>
              DLD Transaction Data • As of {today}
              {lastUpdated && <span> • synced {todayFmt(new Date(lastUpdated))}</span>}
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

          {/* Growth banner — the single emerald hero block in the panel */}
          <div
            data-surface="emerald"
            className="rounded-2xl p-5 md:p-6 mb-8 flex flex-wrap items-center justify-between gap-4"
            style={{ background: EMERALD_GRADIENT, border: "1px solid rgba(184,149,85,0.34)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.24)" }}>
                <ArrowUpRight className="w-6 h-6" style={{ color: "#FFFFFF" }} />
              </div>
              <div>
                <p data-no-contrast-guard className="text-[11px] uppercase tracking-[0.18em] font-bold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>YTD Market Growth</p>
                <p data-no-contrast-guard className="text-[11px]" style={{ color: "rgba(255,255,255,0.78)", WebkitTextFillColor: "rgba(255,255,255,0.78)" }}>Year-over-year volume increase</p>
              </div>
            </div>
            <p data-no-contrast-guard className="text-4xl md:text-5xl font-semibold tabular-nums" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{ytd2026.growth}</p>
          </div>

          {/* 6-metric grid — ivory cards, ink figures, emerald icon chips */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {mainStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-5"
                style={{ background: CARD_SURFACE, border: `1px solid ${GOLD}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span data-surface="emerald" className="inline-flex h-7 w-7 items-center justify-center rounded-full" style={{ background: EMERALD_GRADIENT }}>
                    <stat.icon className="h-3.5 w-3.5" style={{ color: "#FFFFFF" }} />
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.16em] font-bold" style={{ color: "rgba(26,26,26,0.62)" }}>{stat.label}</span>
                </div>
                <p className="text-2xl md:text-3xl font-semibold tabular-nums" style={{ color: INK }}>{stat.value}</p>
                <p className="mt-1 text-[11px]" style={{ color: "rgba(26,26,26,0.60)" }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Transaction split bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {[
              {
                icon: TrendingUp,
                title: "Off-Plan vs Secondary",
                leftPct: offPlanPct,
                rightPct: secondaryPct,
                leftLabel: "Off-Plan",
                rightLabel: "Secondary",
                leftValue: ytd2026.offPlan,
                rightValue: ytd2026.secondary,
              },
              {
                icon: Banknote,
                title: "Cash vs Mortgage",
                leftPct: cashPct,
                rightPct: mortgagePct,
                leftLabel: "Cash",
                rightLabel: "Mortgage",
                leftValue: ytd2026.cash,
                rightValue: ytd2026.mortgage,
              },
            ].map((split) => (
              <div key={split.title} className="rounded-2xl p-6" style={{ background: CARD_SURFACE, border: `1px solid ${GOLD}` }}>
                <div className="flex items-center gap-2 mb-4">
                  <split.icon className="w-4 h-4" style={{ color: "#064E3B" }} />
                  <h3 className="font-semibold text-sm" style={{ color: INK }}>{split.title}</h3>
                </div>

                <div className="h-8 rounded-full overflow-hidden mb-4 flex" style={{ background: "#EFE6D6" }} data-dld-split-bar>
                  <div
                    data-dld-split-segment="left"
                    data-surface="emerald"
                    className="h-full flex items-center justify-center"
                    style={{ width: `${split.leftPct}%`, minWidth: split.leftPct > 0 ? 44 : 0, background: EMERALD_GRADIENT }}
                  >
                    <span data-no-contrast-guard style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }} className="text-[11px] font-bold">{split.leftPct}%</span>
                  </div>
                  <div
                    data-dld-split-segment="right"
                    className="h-full flex-1 flex items-center justify-center"
                    style={{ minWidth: split.rightPct > 0 ? 44 : 0 }}
                  >
                    <span className="text-[11px] font-bold" style={{ color: INK }}>{split.rightPct}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: split.leftLabel, value: split.leftValue, pct: split.leftPct },
                    { label: split.rightLabel, value: split.rightValue, pct: split.rightPct },
                  ].map((cell) => (
                    <div key={cell.label} className="rounded-xl p-3" style={{ background: "#FFFFFF", border: `1px solid ${GOLD}` }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: "#064E3B" }} />
                        <span className="text-[10px] uppercase tracking-[0.14em] font-bold" style={{ color: "rgba(26,26,26,0.62)" }}>{cell.label}</span>
                      </div>
                      <p className="text-lg font-semibold tabular-nums" style={{ color: INK }}>{cell.value.toLocaleString()}</p>
                      <p className="text-[10px]" style={{ color: "rgba(26,26,26,0.58)" }}>{cell.pct}% of total</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Top Areas + Nationalities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 10 Areas — expandable for nationalities */}
            <div className="rounded-2xl p-6" style={{ background: CARD_SURFACE, border: `1px solid ${GOLD}` }}>
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="w-4 h-4" style={{ color: "#064E3B" }} />
                <h3 className="text-sm font-semibold" style={{ color: INK }}>Top 10 Areas by Transactions</h3>
              </div>

              <div className="space-y-1.5">
                {topAreas2026.slice(0, 10).map((area: any, i: number) => {
                  const maxTx = topAreas2026[0]?.transactions || 1;
                  const barWidth = Math.max((area.transactions / maxTx) * 100, 8);
                  const isExpanded = expandedArea === area.area;
                  const nats = areaNationalities[area.area] ?? [];

                  return (
                    <div
                      key={area.area}
                      className="relative rounded-xl overflow-hidden"
                      style={{ background: "#FFFFFF", border: `1px solid ${GOLD}` }}
                    >
                      <div className="absolute inset-y-0 left-0" style={{ width: `${barWidth}%`, background: "linear-gradient(90deg, rgba(6,78,59,0.14) 0%, rgba(6,78,59,0.05) 100%)" }} />
                      <button
                        type="button"
                        onClick={() => setExpandedArea(isExpanded ? null : area.area)}
                        className="relative w-full grid items-center gap-3 px-3 py-2.5 text-left min-h-[54px] transition-colors hover:bg-[#F7F2EA]"
                        style={{ gridTemplateColumns: "40px minmax(0,1fr) 92px 74px 26px" }}
                      >
                        <span
                          data-surface="emerald"
                          className="inline-flex h-8 w-8 items-center justify-center justify-self-center rounded-lg text-xs font-bold tabular-nums"
                          style={{ background: EMERALD_GRADIENT, color: "#FFFFFF" }}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 truncate text-sm font-semibold leading-tight" style={{ color: INK }}>{area.area}</span>
                        <span className="justify-self-end text-right text-xs font-bold tabular-nums" style={{ color: INK }}>{area.transactions.toLocaleString()}</span>
                        <span
                          className="inline-flex h-7 min-w-[64px] items-center justify-center justify-self-center rounded-full px-2 text-[11px] font-bold tabular-nums"
                          style={{ background: "#F1EADC", border: `1px solid ${GOLD}`, color: "#064E3B" }}
                        >
                          {area.change}
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center justify-self-end rounded-full" style={{ background: nats.length > 0 ? "#F1EADC" : "transparent" }}>
                          {nats.length > 0 &&
                            (isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" style={{ color: "#064E3B" }} strokeWidth={2.5} />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" style={{ color: "#064E3B" }} strokeWidth={2.5} />
                            ))}
                        </span>
                      </button>

                      {isExpanded && nats.length > 0 && (
                        <div className="relative px-3 py-3" style={{ background: "#FDFBF7", borderTop: `1px solid ${GOLD}` }}>
                          <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2" style={{ color: "rgba(26,26,26,0.55)" }}>
                            Top 5 Buyer Nationalities
                          </p>
                          <div className="space-y-1.5">
                            {nats.slice(0, 5).map((n: any) => (
                              <div key={n.country} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-base leading-none">{n.flag}</span>
                                  <span className="text-xs font-medium truncate" style={{ color: INK }}>{n.country}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-1 max-w-[140px]">
                                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#EFE6D6" }}>
                                    <div className="h-full origin-left" style={{ width: `${Math.min(n.percentage * 3, 100)}%`, background: EMERALD_GRADIENT }} />
                                  </div>
                                  <span className="text-[11px] font-bold w-7 text-right" style={{ color: INK }}>{n.percentage}%</span>
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

            {/* Top 10 Nationalities */}
            <div className="rounded-2xl p-6" style={{ background: CARD_SURFACE, border: `1px solid ${GOLD}` }}>
              <div className="flex items-center gap-2 mb-5">
                <Globe className="w-4 h-4" style={{ color: "#064E3B" }} />
                <h3 className="text-sm font-semibold" style={{ color: INK }}>Top 10 Buyer Nationalities</h3>
              </div>

              <div className="space-y-1.5">
                {topNationalities.slice(0, 10).map((nat: any) => {
                  const maxPct = topNationalities[0]?.percentage || 1;
                  const barWidth = Math.max((nat.percentage / maxPct) * 100, 8);
                  return (
                    <div key={nat.country} className="relative rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: `1px solid ${GOLD}` }}>
                      <div className="absolute inset-y-0 left-0" style={{ width: `${barWidth}%`, background: "linear-gradient(90deg, rgba(6,78,59,0.14) 0%, rgba(6,78,59,0.05) 100%)" }} />
                      <div className="relative grid items-center gap-3 px-3 py-2.5 min-h-[54px]" style={{ gridTemplateColumns: "36px minmax(0,1fr) 132px" }}>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "#F1EADC", border: `1px solid ${GOLD}` }}>
                          <span className="text-lg leading-none">{nat.flag}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate font-semibold text-sm" style={{ color: INK }}>{nat.country}</span>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "#EFE6D6" }}>
                            <div className="h-full rounded-full origin-left" style={{ width: `${Math.min(nat.percentage * 4, 100)}%`, background: EMERALD_GRADIENT }} />
                          </div>
                          <span className="text-xs font-bold w-8 text-right tabular-nums" style={{ color: INK }}>{nat.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gifts row */}
          {ytd2026.gifts && ytd2026.gifts > 0 && (
            <div className="mt-6 rounded-2xl p-4 flex items-center justify-between" style={{ background: CARD_SURFACE, border: `1px solid ${GOLD}` }}>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#064E3B" }} />
                <span className="text-xs uppercase tracking-[0.16em] font-bold" style={{ color: "rgba(26,26,26,0.65)" }}>Gift Transactions</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold tabular-nums" style={{ color: INK }}>{ytd2026.gifts.toLocaleString()}</span>
                <span className="text-xs font-bold" style={{ color: "rgba(26,26,26,0.60)" }}>{giftsPct}% of total</span>
              </div>
            </div>
          )}

          {/* Disclaimer — untouched copy */}
          <p className="text-[10px] text-center mt-8 max-w-2xl mx-auto leading-relaxed" style={{ color: "rgba(26,26,26,0.58)" }}>
            Sources: Dubai Land Department (DLD), RERA, DXB Interact. YTD 2026 data. For informational purposes only. Does not constitute financial advice.{" "}
            <Link to="/contact" className="hover:underline" style={{ color: "#064E3B" }}>Contact our team</Link> for professional guidance.
          </p>
        </div>
      </div>
    </section>
  );
};


export default DLDMarketWidget;
