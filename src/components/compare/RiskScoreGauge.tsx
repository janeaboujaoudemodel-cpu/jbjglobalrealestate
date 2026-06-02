/**
 * RiskScoreGauge — 0-100 risk score per project rendered as a circular gauge
 * with weighted factor breakdown underneath.
 */

import { GlassCard } from "./CompareAIShell";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

export interface RiskScoreEntry {
  projectName: string;
  riskScore: number; // 0-100, lower = safer
  factors?: { label: string; weight: number }[]; // weight 0-100
}

function colorForScore(score: number) {
  if (score <= 30) return "#34D399"; // emerald — low risk
  if (score <= 60) return "#F59E0B"; // amber — medium
  return "#F87171"; // red — high
}

function labelForScore(score: number) {
  if (score <= 30) return "Low risk";
  if (score <= 60) return "Moderate risk";
  return "High risk";
}

export default function RiskScoreGauge({ data }: { data?: RiskScoreEntry[] }) {
  if (!data?.length) return null;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-bold text-lg">Risk Score</h3>
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold">
          Lower = safer
        </span>
      </div>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
      >
        {data.map((p, i) => {
          const color = colorForScore(p.riskScore);
          const Icon = p.riskScore <= 30 ? ShieldCheck : p.riskScore <= 60 ? ShieldAlert : AlertTriangle;
          return (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Ring score={p.riskScore} color={color} />
                <div className="min-w-0">
                  <p className="text-white/70 text-xs truncate">{p.projectName}</p>
                  <p className="text-sm font-bold flex items-center gap-1.5" style={{ color }}>
                    <Icon className="w-3.5 h-3.5" />
                    {labelForScore(p.riskScore)}
                  </p>
                </div>
              </div>
              {p.factors?.length ? (
                <div className="space-y-1.5">
                  {p.factors.slice(0, 4).map((f, fi) => (
                    <div key={fi} className="flex items-center gap-2">
                      <span className="text-[11px] text-white/55 flex-1 truncate">{f.label}</span>
                      <div className="w-20 h-1 rounded-full overflow-hidden bg-white/[0.08]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, f.weight))}%`,
                            background: colorForScore(f.weight),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function Ring({ score, color }: { score: number; color: string }) {
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const offset = c - (pct / 100) * c;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill={color}
      >
        {Math.round(pct)}
      </text>
    </svg>
  );
}
