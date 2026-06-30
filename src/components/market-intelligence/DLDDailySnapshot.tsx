/**
 * DLD Daily Snapshot Section — items #7, #8, #9 of the Market Intelligence overhaul.
 *  • KPI strip (Total transactions / Total volume / Cash share / Mortgage share)
 *  • Cash vs Mortgage breakdown — black + 1px gold hairline, no broken gradients
 *  • Top-10 Areas bars — `transform: scaleX()` from left, no clip-path
 *  • Premium black "Notice something incorrect?" + "Expert Consultation" cards
 *  • Reads from public.dld_daily_snapshot_latest. Owner/admin populates the
 *    table via the DLD ingestion edge function or manual insert; the view
 *    here just renders whatever the most recent row contains.
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Banknote,
  Building2,
  CalendarCheck,
  CircleDollarSign,
  Flag,
  Landmark,
  MailOpen,
  PhoneCall,
  TrendingUp,
} from "lucide-react";

type TopArea = { area: string; count: number; avg_aed_per_sqft?: number | null };

type Snapshot = {
  id: string;
  snapshot_date: string;
  total_transactions: number;
  total_volume_aed: number;
  cash_count: number;
  cash_volume_aed: number;
  mortgage_count: number;
  mortgage_volume_aed: number;
  top_areas: TopArea[] | null;
  source: string | null;
  updated_at: string;
};

const aed = (v: number) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(v || 0);

const compact = (v: number) =>
  new Intl.NumberFormat("en-AE", { notation: "compact", maximumFractionDigits: 1 }).format(v || 0);

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const GOLD = "#B89555";
const INK = "#0A0A0A";
// Brand emerald metallic ombre — matches var(--jj-emerald-ombre) site-wide.
const EMERALD_BAR = "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)";
const EMERALD_DOT = "#064E3B";

// Reusable champagne card with PREMIUM gold border (double hairline + soft glow).
const BlackCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = "" }) => (
  <div
    data-surface="light"
    className={`surface-light relative overflow-hidden rounded-2xl ${className}`}
    style={{
      backgroundColor: "#FDFBF7",
      border: `1.5px solid ${GOLD}`,
      boxShadow:
        "0 0 0 1px rgba(184,149,85,0.18), 0 14px 36px rgba(26,26,26,0.10), inset 0 1px 0 rgba(255,255,255,0.9)",
      color: "#1A1A1A",
    }}
  >
    {children}
  </div>
);


export const DLDDailySnapshot = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["dld-daily-snapshot-latest"],
    queryFn: async (): Promise<Snapshot | null> => {
      const { data, error } = await supabase
        .from("dld_daily_snapshot_latest" as any)
        .select("*")
        .maybeSingle();
      if (error) return null;
      return (data as unknown as Snapshot) || null;
    },
    staleTime: 60 * 60 * 1000, // 1h — data refreshes daily server-side
  });

  if (isLoading || !data) return null;

  const total = data.total_transactions || 0;
  const cashShare = total > 0 ? Math.round((data.cash_count / total) * 100) : 0;
  const mortgageShare = total > 0 ? 100 - cashShare : 0;
  const top = (data.top_areas || []).slice(0, 10);
  const max = top.reduce((m, t) => Math.max(m, t.count), 0) || 1;

  const updatedLabel = new Date(data.snapshot_date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="bg-background py-16" data-surface="light">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="mb-8 flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1A1A1A]/70">
              Daily Snapshot · DLD
            </span>
            <h2 className="mt-2 text-3xl font-bold leading-tight text-[#1A1A1A] md:text-4xl">
              Dubai Transactions — Today
            </h2>
          </div>
          <div
            className="mi-chip-emerald px-3 py-1.5 text-xs"
            title="Snapshot refreshed daily from official sources"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            Updated {updatedLabel}
          </div>
        </motion.div>

        {/* KPI Strip (item #7) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
        >
          {[
            { label: "Total Transactions", value: total.toLocaleString("en-AE"), Icon: Building2 },
            { label: "Total Volume (AED)", value: compact(data.total_volume_aed), Icon: CircleDollarSign },
            { label: "Cash Share", value: `${cashShare}%`, Icon: Banknote },
            { label: "Mortgage Share", value: `${mortgageShare}%`, Icon: Landmark },
          ].map(({ label, value, Icon }) => (
            <BlackCard key={label} className="p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <div data-no-contrast-guard data-dld-emerald-tile className="mi-icon-tile mi-no-flip">
                  <Icon data-dld-white-icon className="h-5 w-5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.4} />
                </div>
                <span
                  data-no-contrast-guard
                  data-allow-dark-cta
                  data-dld-emerald-tile
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md"
                  style={{ background: EMERALD_BAR, border: "1px solid rgba(184,149,85,0.5)" }}
                >
                  <TrendingUp data-dld-white-icon className="h-4 w-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.4} />
                </span>
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1A1A1A]/70">
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[#1A1A1A] md:text-3xl">{value}</p>
            </BlackCard>
          ))}
        </motion.div>

        {/* Charts: Cash vs Mortgage + Top-10 Areas (items #8) */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Cash vs Mortgage — black filled bar = cash, gold hairline bar = mortgage */}
          <BlackCard className="p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1A1A1A]/70">
              Cash vs Mortgage
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#1A1A1A]">Buyer financing mix</h3>

            <div className="mt-6 space-y-5">
              {/* CASH */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#1A1A1A]">Cash buyers</span>
                  <span className="tabular-nums text-[#1A1A1A]">
                    {data.cash_count.toLocaleString("en-AE")} · {aed(data.cash_volume_aed)}
                  </span>
                </div>
                <div
                  data-no-contrast-guard
                  className="dld-bar-track"
                  style={{ position: "relative", height: 12, width: "100%", overflow: "hidden", borderRadius: 9999, backgroundColor: "#EFE6D6", border: "1px solid rgba(184,149,85,0.35)" }}
                >
                  <div
                    data-no-contrast-guard
                    data-allow-dark-cta
                    data-dld-emerald-fill
                    className="dld-emerald-fill"
                    style={{ position: "absolute", insetBlock: 0, left: 0, width: `${cashShare}%`, borderRadius: 9999, background: EMERALD_BAR }}
                  />
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] tabular-nums text-[#1A1A1A]/70">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#064E3B]" /> Cash · {cashShare}% of all transactions
                </p>
              </div>

              {/* MORTGAGE */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#1A1A1A]">Mortgage buyers</span>
                  <span className="tabular-nums text-[#1A1A1A]">
                    {data.mortgage_count.toLocaleString("en-AE")} · {aed(data.mortgage_volume_aed)}
                  </span>
                </div>
                <div
                  data-no-contrast-guard
                  className="dld-bar-track"
                  style={{ position: "relative", height: 12, width: "100%", overflow: "hidden", borderRadius: 9999, backgroundColor: "#EFE6D6", border: "1px solid rgba(184,149,85,0.35)" }}
                >
                  <div
                    data-no-contrast-guard
                    data-allow-dark-cta
                    data-dld-emerald-fill
                    className="dld-emerald-fill"
                    style={{ position: "absolute", insetBlock: 0, left: 0, width: `${mortgageShare}%`, borderRadius: 9999, background: EMERALD_BAR }}
                  />
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] tabular-nums text-[#1A1A1A]/70">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#064E3B]" /> Mortgage · {mortgageShare}% of all transactions
                </p>
              </div>
            </div>

            <p className="mt-6 text-[11px] leading-relaxed text-[#1A1A1A]/60">
              Source: Dubai Land Department · aggregated for the snapshot day. Cash includes outright purchases;
              mortgage includes bank-financed completions.
            </p>
          </BlackCard>

          {/* Top-10 Areas — scaleX bars */}
          <BlackCard className="p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1A1A1A]/70">
              Top 10 Areas by Transactions
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#1A1A1A]">Where Dubai is buying</h3>

            <div className="mt-5 space-y-3">
              {top.map((row, i) => {
                const pct = max > 0 ? row.count / max : 0;
                const rank = i + 1;
                const isLeader = rank === 1;
                const isPodium = rank === 2 || rank === 3;
                return (
                  <div
                    key={`${row.area}-${i}`}
                    className="grid grid-cols-[2.75rem_minmax(0,1fr)_minmax(110px,1fr)_3.75rem] items-center gap-3 rounded-lg px-2 py-1.5"
                  >
                    <span
                      data-no-contrast-guard
                      data-allow-dark-cta
                      data-dld-rank-badge
                      className="inline-flex h-7 w-9 items-center justify-center rounded-md text-[11px] font-bold tabular-nums shrink-0"
                      style={{ background: EMERALD_BAR, border: "1px solid rgba(184,149,85,0.5)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                    >
                      {String(rank).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 whitespace-normal break-words text-left text-sm font-semibold leading-tight text-[#1A1A1A]">{row.area}</span>
                    <div
                      data-no-contrast-guard
                      className="relative h-2.5 overflow-hidden rounded-full"
                      style={{ backgroundColor: "#EFE6D6", border: `1px solid rgba(184,149,85,0.35)` }}
                    >
                      <div
                        data-no-contrast-guard
                        data-allow-dark-cta
                        className="absolute inset-y-0 left-0 h-full rounded-full"
                        style={{
                          width: `${pct * 100}%`,
                          background: isLeader
                            ? EMERALD_BAR
                            : isPodium
                              ? EMERALD_BAR
                              : "linear-gradient(90deg, rgba(11,107,79,0.82), rgba(6,78,59,0.82))",
                        }}
                      />
                    </div>
                    <span className="text-right text-xs font-bold tabular-nums text-[#1A1A1A]">{row.count}</span>
                  </div>
                );
              })}
              {top.length === 0 && (
                <p className="text-sm text-[#1A1A1A]/60">No area data available for this snapshot.</p>
              )}
            </div>
          </BlackCard>
        </div>

        {/* Notice + Expert Consultation cards (item #9) */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 md:auto-rows-fr">
          <BlackCard className="p-6 h-full">
            <div className="flex h-full items-start gap-4">
              <div data-no-contrast-guard className="mi-icon-tile mi-icon-tile-lg mi-no-flip">
                <Flag className="h-5 w-5" />
              </div>
              <div className="flex flex-1 flex-col">
                <h4 className="text-base font-bold text-[#1A1A1A] md:text-lg">Notice something incorrect?</h4>
                <p className="mt-1 text-sm leading-relaxed text-[#1A1A1A]/70">
                  Spotted a number that doesn't match your records or an area we're missing? Send us a quick
                  note — every report is reviewed by our market desk within 24 hours.
                </p>
                <Link
                  to="/contact?topic=market-intelligence-correction"
                  data-no-contrast-guard
                  className="mi-cta-emerald mt-auto pt-4 text-xs uppercase tracking-[0.16em] rounded-full self-start"
                >
                  <MailOpen className="h-3.5 w-3.5" />
                  Report an issue
                </Link>
              </div>
            </div>
          </BlackCard>

          <BlackCard className="p-6 h-full">
            <div className="flex h-full items-start gap-4">
              <div data-no-contrast-guard className="mi-icon-tile mi-icon-tile-lg mi-no-flip">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div className="flex flex-1 flex-col">
                <h4 className="text-base font-bold text-[#1A1A1A] md:text-lg">Expert Consultation</h4>
                <p className="mt-1 text-sm leading-relaxed text-[#1A1A1A]/70">
                  Want this data interpreted for your portfolio? Book a 30-minute call with Jane Bou Jaoude
                  — founder-led, no automated bots, free of charge.
                </p>
                <Link
                  to="/book"
                  data-no-contrast-guard
                  className="mi-cta-emerald mt-auto pt-4 text-xs uppercase tracking-[0.16em] rounded-full self-start"
                >
                  <CalendarCheck className="h-3.5 w-3.5" />
                  Book consultation
                </Link>
              </div>
            </div>
          </BlackCard>
        </div>
      </div>
    </section>
  );
};

export default DLDDailySnapshot;
