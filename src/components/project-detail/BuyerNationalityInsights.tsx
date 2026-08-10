import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Globe2, TrendingUp } from "lucide-react";

type NationalityRow = {
  flag: string;
  country: string;
  percentage: number;
};

interface BuyerNationalityInsightsProps {
  projectName: string;
  areaName?: string | null;
}

/** Regional-indicator emoji only. Anything else (tofu boxes, letters, empty) is rejected. */
function isRealFlagEmoji(value?: string | null): boolean {
  if (!value) return false;
  const points = Array.from(value);
  if (points.length < 2) return false;
  return points.every((ch) => {
    const cp = ch.codePointAt(0) ?? 0;
    return cp >= 0x1f1e6 && cp <= 0x1f1ff;
  });
}

function initials(country: string): string {
  return country
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * "Who is buying here" — verified buyer-nationality mix for this project's own
 * market. Emerald pair-gradient shell, animated demand meters, gold rank rail.
 * Data source: public.dld_market_data (data_key = 'areaNationalities').
 */
export default function BuyerNationalityInsights({ projectName, areaName }: BuyerNationalityInsightsProps) {
  const { data } = useQuery({
    queryKey: ["buyer-nationality-insights"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("dld_market_data")
        .select("data_key,data_json")
        .in("data_key", ["areaNationalities", "topNationalities"]);
      const out: { areas: Record<string, NationalityRow[]>; top: NationalityRow[] } = { areas: {}, top: [] };
      for (const r of rows || []) {
        if (r.data_key === "areaNationalities" && r.data_json && typeof r.data_json === "object") {
          out.areas = r.data_json as Record<string, NationalityRow[]>;
        }
        if (r.data_key === "topNationalities" && Array.isArray(r.data_json)) {
          out.top = r.data_json as NationalityRow[];
        }
      }
      return out;
    },
    staleTime: 10 * 60 * 1000,
  });

  const areaRows = (() => {
    if (!areaName || !data?.areas) return null;
    const keys = Object.keys(data.areas);
    const needle = areaName.toLowerCase();
    const exact = keys.find((k) => k.toLowerCase() === needle);
    if (exact) return { key: exact, rows: data.areas[exact] };
    const partial = keys.find((k) => k.toLowerCase().includes(needle) || needle.includes(k.toLowerCase()));
    if (partial) return { key: partial, rows: data.areas[partial] };
    return null;
  })();

  const projectRows = (areaRows?.rows || []).slice(0, 5);

  // Strict gating: never substitute another emirate's buyer mix as a proxy.
  if (!projectRows.length) return null;

  const marketLabel = areaRows?.key || areaName || projectName;
  const max = Math.max(...projectRows.map((r) => r.percentage || 0), 1);
  const total = projectRows.reduce((sum, r) => sum + (r.percentage || 0), 0);

  return (
    <section aria-label="Buyer nationality insights" className="mb-10 md:mb-12">
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold mb-1">Buyer Insights</p>
        <h3
          className="text-[#1A1A1A] text-2xl md:text-4xl font-medium tracking-tight"
          style={{ fontFamily: "'Cormorant Garamond', 'Cormorant', serif" }}
        >
          Who is buying here
        </h3>
        <div className="w-16 h-px bg-[#B89555] mt-3" />
        <p className="text-[14px] text-[#1A1A1A]/75 mt-3 max-w-2xl">
          Verified buyer-nationality data for this project's own market. We never substitute another emirate's mix as a proxy.
        </p>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-[#B89555]/45"
        style={{ boxShadow: "0 24px 60px -28px rgba(4,44,28,0.45)" }}
      >
        {/* Emerald pair-gradient header with animated intelligence aura */}
        <div
          data-no-contrast-guard
          data-on-dark
          className="relative overflow-hidden px-5 py-5 md:px-7 md:py-6 allow-white"
          style={{
            background: "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)",
            color: "#FFFFFF",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(184,149,85,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(184,149,85,0.55) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
              maskImage: "radial-gradient(120% 100% at 12% 0%, #000 0%, transparent 72%)",
              WebkitMaskImage: "radial-gradient(120% 100% at 12% 0%, #000 0%, transparent 72%)",
            }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(184,149,85,0.42) 0%, transparent 68%)" }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative flex items-start gap-4">
            <span
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl allow-white"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 100%)",
                border: "1px solid rgba(184,149,85,0.6)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)",
              }}
            >
              <Globe2 className="h-5 w-5 allow-white" style={{ color: "#FFFFFF" }} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="text-[10px] uppercase tracking-[0.3em] font-semibold allow-white"
                style={{ color: "#E8DCC0" }}
              >
                Top 5 buyers · verified project / area data
              </p>
              <h4
                className="mt-1 text-xl md:text-2xl font-medium leading-tight allow-white break-words"
                style={{ color: "#FFFFFF", fontFamily: "'Cormorant Garamond', 'Cormorant', serif" }}
              >
                {marketLabel}
              </h4>
            </div>
            <span
              className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] allow-white"
              style={{
                background: "linear-gradient(135deg, #F7ECD0 0%, #E8C77A 48%, #B89555 100%)",
                color: "#1A1A1A",
                WebkitTextFillColor: "#1A1A1A",
                boxShadow: "0 6px 16px rgba(184,149,85,0.35)",
              }}
            >
              <TrendingUp className="h-3 w-3" style={{ color: "#1A1A1A" }} />
              {total}% of demand
            </span>
          </div>
        </div>

        {/* Demand meters */}
        <div className="bg-[#FDFBF7] px-4 py-3 md:px-7 md:py-5">
          <ul className="divide-y divide-[#B89555]/20">
            {projectRows.map((row, idx) => {
              const pct = row.percentage || 0;
              const widthPct = Math.max((pct / max) * 100, 6);
              const showFlag = isRealFlagEmoji(row.flag);
              return (
                <li
                  key={`${row.country}-${idx}`}
                  className="group grid grid-cols-[40px_1fr_auto] items-center gap-3 md:gap-4 py-3.5"
                >
                  {showFlag ? (
                    <span className="text-2xl leading-none text-center" aria-hidden="true">
                      {row.flag}
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-bold tracking-[0.06em]"
                      style={{
                        background: "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)",
                        color: "#FFFFFF",
                        border: "1px solid rgba(184,149,85,0.55)",
                      }}
                    >
                      {initials(row.country)}
                    </span>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-[#1A1A1A]"
                        style={{ background: "linear-gradient(135deg, #F7ECD0 0%, #E8C77A 60%, #B89555 100%)" }}
                        aria-hidden
                      >
                        {idx + 1}
                      </span>
                      <p className="truncate text-[14px] md:text-[15px] font-semibold text-[#1A1A1A] leading-tight">
                        {row.country}
                      </p>
                    </div>
                    <div
                      className="mt-2 h-2 w-full overflow-hidden rounded-full"
                      style={{
                        background: "rgba(184,149,85,0.18)",
                        border: "1px solid rgba(184,149,85,0.4)",
                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
                      }}
                    >
                      <motion.div
                        className="relative h-full rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${widthPct}%` }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 1.05, delay: idx * 0.09, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                          background: "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)",
                          boxShadow: "0 1px 6px rgba(4,44,28,0.45)",
                        }}
                      >
                        <span
                          aria-hidden
                          className="absolute inset-y-0 right-0 w-8 rounded-full opacity-70"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(232,199,122,0.85) 100%)",
                          }}
                        />
                      </motion.div>
                    </div>
                  </div>

                  <span className="text-[15px] md:text-[17px] font-bold text-[#1A1A1A] tabular-nums">{pct}%</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-[11px] text-[#1A1A1A]/55">
            Data: DLD · YTD 2026 · Informational only, not investment advice.
          </p>
        </div>
      </div>
    </section>
  );
}
