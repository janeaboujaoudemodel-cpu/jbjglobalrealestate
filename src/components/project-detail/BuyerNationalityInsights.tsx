import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, MapPin, Building2 } from "lucide-react";

type NationalityRow = {
  flag: string;
  country: string;
  percentage: number;
};

interface BuyerNationalityInsightsProps {
  projectName: string;
  areaName?: string | null;
}

/**
 * Two-column buyer nationality breakdown:
 *  - Card A: Top 5 nationalities buying in this project's surrounding area
 *  - Card B: Top 5 nationalities buying across the wider Dubai market (project proxy)
 *
 * Data source: public.dld_market_data (data_key = 'areaNationalities' | 'topNationalities')
 */
export default function BuyerNationalityInsights({ projectName, areaName }: BuyerNationalityInsightsProps) {
  const { data } = useQuery({
    queryKey: ["buyer-nationality-insights"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("dld_market_data")
        .select("data_key,data_json")
        .in("data_key", ["areaNationalities", "topNationalities"]);
      const out: { areas: Record<string, NationalityRow[]>; top: NationalityRow[] } = {
        areas: {},
        top: [],
      };
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

  // Resolve the closest matching area block (case-insensitive substring match).
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

  const topRows = (data?.top || []).slice(0, 5);
  const projectRows = (areaRows?.rows || []).slice(0, 5);

  if (!projectRows.length && !topRows.length) return null;

  const renderRow = (row: NationalityRow, idx: number, max: number) => {
    const pct = row.percentage || 0;
    const widthPct = max > 0 ? Math.max((pct / max) * 100, 6) : 6;
    return (
      <li key={`${row.country}-${idx}`} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-2.5">
        <span className="text-xl leading-none" aria-hidden="true">
          {row.flag || "🏳️"}
        </span>
        <div>
          <p className="text-[14px] font-semibold text-[#1A1A1A] leading-tight">{row.country}</p>
          <div
            className="mt-1.5 h-1.5 w-full rounded-full overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #D4B87A 0%, #B89555 55%, #8f6f2b 100%)",
              border: "1px solid rgba(184,149,85,0.5)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${widthPct}%`,
                background: "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)",
              }}
            />
          </div>
        </div>
        <span className="text-[14px] font-bold text-[#1A1A1A] tabular-nums">{pct}%</span>
      </li>
    );
  };

  const card = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    rows: NationalityRow[],
    proxyBadge?: string,
  ) => {
    const max = Math.max(...rows.map((r) => r.percentage || 0), 1);
    return (
      <div className="relative rounded-2xl bg-[#FDFBF7] border border-[#B89555]/30 p-6 md:p-7 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <span
            data-emerald-action="true"
            data-icon-square="true"
            className="jj-emerald-action inline-flex w-9 h-9 items-center justify-center rounded-lg"
            style={{ ['--jj-icon-lock-size' as any]: '2.25rem' }}
          >
            {icon}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#1A1A1A]/60 font-semibold">{subtitle}</p>
            <h4 className="text-lg md:text-xl font-semibold text-[#1A1A1A] leading-tight truncate">{title}</h4>
          </div>
          {proxyBadge && (
            <span
              data-emerald-action="true"
              className="jj-emerald-action shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
            >
              {proxyBadge}
            </span>
          )}
        </div>
        <ul className="divide-y divide-[#B89555]/15">{rows.map((r, i) => renderRow(r, i, max))}</ul>
        <p className="mt-4 text-[11px] text-[#1A1A1A]/55">
          Data: DLD · YTD 2026 · Informational only, not investment advice.
        </p>
      </div>
    );
  };

  return (
    <section aria-label="Buyer nationality insights" className="mb-10 md:mb-12">
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold mb-1">Buyer Insights</p>
        <h3 className="text-[#1A1A1A] text-2xl md:text-3xl font-semibold tracking-tight">
          Who is buying here
        </h3>
        <div className="w-16 h-px bg-[#B89555] mt-3" />
        <p className="text-[14px] text-[#1A1A1A]/75 mt-3 max-w-2xl">
          Buyer nationality data is shown only when area-specific data exists. UAE-wide data is kept separate and never presented as project-specific.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {projectRows.length > 0 ? card(
          areaRows?.key || areaName || projectName,
          "Top 5 buyers in verified area data",
          <Building2 className="w-4 h-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />,
          projectRows,
        ) : (
          <div className="relative rounded-2xl bg-[#FDFBF7] border border-[#B89555]/30 p-6 md:p-7 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#1A1A1A]/60 font-semibold">Project-specific buyer data</p>
            <h4 className="text-lg md:text-xl font-semibold text-[#1A1A1A] leading-tight mt-1">Not available yet</h4>
            <p className="mt-3 text-sm text-[#1A1A1A]/75">No verified buyer-nationality dataset is connected for {projectName}. UAE-wide data is not used as a project claim.</p>
          </div>
        )}
        {card(
          areaRows?.key || areaName || "Dubai · all areas",
          areaRows ? "Top 5 buyers in surrounding area" : "UAE-wide reference only",
          <MapPin className="w-4 h-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />,
          (areaRows?.rows || topRows).slice(0, 5),
          !areaRows && areaName ? "Reference" : undefined,
        )}
      </div>
    </section>
  );
}
