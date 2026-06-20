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
  BadgeDollarSign,
  Banknote,
  Building2,
  CalendarCheck,
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

// Reusable champagne card with gold hairline.
const BlackCard: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = "" }) => (
  <div
    data-surface="light"
    className={`surface-light relative overflow-hidden rounded-2xl ${className}`}
    style={{
      backgroundColor: "#FDFBF7",
      border: `1px solid ${GOLD}`,
      boxShadow: "0 8px 28px rgba(26,26,26,0.07), inset 0 1px 0 rgba(255,255,255,0.85)",
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
            className="inline-flex items-center gap-2 rounded-full border border-[#B89555]/60 bg-[#FDFBF7] px-3 py-1.5 text-xs font-semibold text-[#1A1A1A]"
            title="Snapshot refreshed daily from official sources"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-[#B89555]" />
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
            { label: "Total Volume (AED)", value: compact(data.total_volume_aed), Icon: BadgeDollarSign },
            { label: "Cash Share", value: `${cashShare}%`, Icon: Banknote },
            { label: "Mortgage Share", value: `${mortgageShare}%`, Icon: Landmark },
          ].map(({ label, value, Icon }) => (
            <BlackCard key={label} className="p-4 md:p-5">
              <div className="flex items-start justify-between gap-2">
                <div
                  data-no-contrast-guard
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#B89555]/45 bg-[#EFE6D6]"
                >
                  <Icon className="h-4 w-4 text-[#1A1A1A]" />
                </div>
                <TrendingUp className="h-3.5 w-3.5 text-[#B89555]" />
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
                  className="relative h-3 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: "#EFE6D6", border: `1px solid rgba(184,149,85,0.35)` }}
                >
                  <motion.div
                    data-no-contrast-guard
                    data-allow-dark-cta
                    className="absolute inset-y-0 left-0 rounded-full bg-[#0A0A0A]"
                    style={{ transformOrigin: "left center", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}
                    initial={{ transform: "scaleX(0)" }}
                    whileInView={{ transform: `scaleX(${cashShare / 100})` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  >
                    <div className="h-full w-full" />
                  </motion.div>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] tabular-nums text-[#1A1A1A]/70">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#0A0A0A]" /> Cash · {cashShare}% of all transactions
                </p>
              </div>

              {/* MORTGAGE */}
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[#B89555]">Mortgage buyers</span>
                  <span className="tabular-nums text-[#1A1A1A]">
                    {data.mortgage_count.toLocaleString("en-AE")} · {aed(data.mortgage_volume_aed)}
                  </span>
                </div>
                <div
                  className="relative h-3 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: "#EFE6D6", border: `1px solid ${GOLD}` }}
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ backgroundColor: GOLD, transformOrigin: "left center" }}
                    initial={{ transform: "scaleX(0)" }}
                    whileInView={{ transform: `scaleX(${mortgageShare / 100})` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                  >
                    <div className="h-full w-full" />
                  </motion.div>
                </div>
                <p className="mt-1 text-[11px] tabular-nums text-[#1A1A1A]/70">{mortgageShare}% of all transactions</p>
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
                return (
                  <div key={`${row.area}-${i}`} className="grid grid-cols-[140px_1fr_auto] items-center gap-3">
                    <span className="truncate text-sm font-semibold text-[#1A1A1A]">
                      <span className="mr-1.5 text-[#B89555]">{String(i + 1).padStart(2, "0")}</span>
                      {row.area}
                    </span>
                    <div
                      className="relative h-2.5 overflow-hidden rounded-full"
                      style={{ backgroundColor: "#EFE6D6", border: `1px solid rgba(184,149,85,0.35)` }}
                    >
                      <motion.div
                        className="absolute inset-y-0 left-0 h-full rounded-full"
                        style={{ backgroundColor: GOLD, transformOrigin: "left center", width: "100%" }}
                        initial={{ transform: "scaleX(0)" }}
                        whileInView={{ transform: `scaleX(${pct})` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.03 }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-[#1A1A1A]">{row.count}</span>
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
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <BlackCard className="p-6">
            <div className="flex items-start gap-4">
              <div
                data-no-contrast-guard
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#B89555]/45 bg-[#EFE6D6]"
              >
                <Flag className="h-5 w-5 text-[#1A1A1A]" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-[#1A1A1A] md:text-lg">Notice something incorrect?</h4>
                <p className="mt-1 text-sm leading-relaxed text-[#1A1A1A]/70">
                  Spotted a number that doesn't match your records or an area we're missing? Send us a quick
                  note — every report is reviewed by our market desk within 24 hours.
                </p>
                <Link
                  to="/contact?topic=market-intelligence-correction"
                  data-no-contrast-guard
                  className="jj-cta-champagne mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors"
                >
                  <MailOpen className="h-3.5 w-3.5" />
                  Report an issue
                </Link>
              </div>
            </div>
          </BlackCard>

          <BlackCard className="p-6">
            <div className="flex items-start gap-4">
              <div
                data-no-contrast-guard
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#B89555]/45 bg-[#EFE6D6]"
              >
                <PhoneCall className="h-5 w-5 text-[#1A1A1A]" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-[#1A1A1A] md:text-lg">Expert Consultation</h4>
                <p className="mt-1 text-sm leading-relaxed text-[#1A1A1A]/70">
                  Want this data interpreted for your portfolio? Book a 30-minute call with Jane Bou Jaoude
                  — founder-led, no automated bots, free of charge.
                </p>
                <Link
                  to="/book"
                  data-no-contrast-guard
                  className="jj-cta-champagne mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors"
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
