/**
 * MarketContextStrip — per-project micro-market KPIs.
 * Renders gracefully if AI didn't return the field.
 */

import { TrendingUp, TrendingDown, Activity, Flame } from "lucide-react";
import { GlassCard } from "./CompareAIShell";

export interface MarketContextEntry {
  projectName: string;
  priceTrend12mPct?: number; // e.g. 8.4
  supplyHeat?: "Low" | "Balanced" | "High";
  demandIndex?: number; // 0-100
}

export default function MarketContextStrip({ data }: { data?: MarketContextEntry[] }) {
  if (!data?.length) return null;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">Market Context</h3>
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold">
          12-month outlook
        </span>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((p, i) => {
          const positive = (p.priceTrend12mPct ?? 0) >= 0;
          const TrendIcon = positive ? TrendingUp : TrendingDown;
          return (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="text-white/70 text-xs font-semibold mb-3 truncate">{p.projectName}</p>
              <div className="space-y-2.5">
                <Row
                  icon={<TrendIcon className="w-3.5 h-3.5" style={{ color: positive ? "#34D399" : "#F87171" }} />}
                  label="Price trend"
                  value={
                    p.priceTrend12mPct !== undefined
                      ? `${positive ? "+" : ""}${p.priceTrend12mPct.toFixed(1)}%`
                      : "—"
                  }
                  valueColor={positive ? "#34D399" : "#F87171"}
                />
                <Row
                  icon={<Flame className="w-3.5 h-3.5" style={{ color: "#F472B6" }} />}
                  label="Supply"
                  value={p.supplyHeat ?? "—"}
                />
                <Row
                  icon={<Activity className="w-3.5 h-3.5" style={{ color: "#60A5FA" }} />}
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

function Row({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-white/55 text-xs">
        {icon}
        {label}
      </span>
      <span className="text-sm font-bold" style={{ color: valueColor ?? "#F8FAFC" }}>
        {value}
      </span>
    </div>
  );
}
