/**
 * MarketContextStrip — champagne/gold per-project micro-market KPIs.
 * Semantic colors (emerald/red) reserved strictly for data polarity.
 */

import { TrendingUp, TrendingDown, Activity, Flame } from "lucide-react";
import { GlassCard } from "./CompareAIShell";

export interface MarketContextEntry {
  projectName: string;
  priceTrend12mPct?: number;
  supplyHeat?: "Low" | "Balanced" | "High";
  demandIndex?: number;
}

const INK = "#1A1A1A";
const INK_70 = "rgba(26,26,26,0.7)";
const INK_55 = "rgba(26,26,26,0.55)";
const GOLD = "#B89555";
const HAIRLINE = "rgba(184,149,85,0.35)";

export default function MarketContextStrip({ data }: { data?: MarketContextEntry[] }) {
  if (!data?.length) return null;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg" style={{ color: INK }}>
          Market Context
        </h3>
        <span
          className="text-[10px] uppercase tracking-[0.18em] font-semibold"
          style={{ color: INK_55 }}
        >
          12-month outlook
        </span>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
      >
        {data.map((p, i) => {
          const positive = (p.priceTrend12mPct ?? 0) >= 0;
          const TrendIcon = positive ? TrendingUp : TrendingDown;
          const trendColor = positive ? "#0F7A4D" : "#B91C1C";
          return (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{
                background: "#FDFBF7",
                border: `1px solid ${HAIRLINE}`,
              }}
            >
              <p className="text-xs font-semibold mb-3 truncate" style={{ color: INK }}>
                {p.projectName}
              </p>
              <div className="space-y-2.5">
                <Row
                  icon={<TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />}
                  label="Price trend"
                  value={
                    p.priceTrend12mPct !== undefined
                      ? `${positive ? "+" : ""}${p.priceTrend12mPct.toFixed(1)}%`
                      : "—"
                  }
                  valueColor={trendColor}
                />
                <Row
                  icon={<Flame className="w-3.5 h-3.5" style={{ color: GOLD }} />}
                  label="Supply"
                  value={p.supplyHeat ?? "—"}
                />
                <Row
                  icon={<Activity className="w-3.5 h-3.5" style={{ color: GOLD }} />}
                  label="Demand"
                  value={p.demandIndex !== undefined ? `${p.demandIndex}/100` : "—"}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function Row({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs" style={{ color: INK_55 }}>
        {icon}
        {label}
      </span>
      <span className="text-sm font-bold" style={{ color: valueColor ?? INK }}>
        {value}
      </span>
    </div>
  );
}
