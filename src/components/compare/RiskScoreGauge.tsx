/**
 * RiskScoreGauge — champagne card with semantic risk colors
 * (emerald = low, amber = moderate, red = high). No blue/purple/pink.
 */

import { GlassCard } from "./CompareAIShell";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

export interface RiskScoreEntry {
  projectName: string;
  riskScore: number;
  factors?: { label: string; weight: number }[];
}

const INK = "#1A1A1A";
const INK_55 = "rgba(26,26,26,0.55)";
const HAIRLINE = "rgba(184,149,85,0.35)";

function colorForScore(score: number) {
  if (score <= 30) return "#0F7A4D";
  if (score <= 60) return "#B45309";
  return "#B91C1C";
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
        <h3 className="font-bold text-lg" style={{ color: INK }}>
          Risk Score
        </h3>
        <span
          className="text-[10px] uppercase tracking-[0.18em] font-semibold"
          style={{ color: INK_55 }}
        >
          Lower = safer
        </span>
      </div>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
      >
        {data.map((p, i) => {
          const color = colorForScore(p.riskScore);
          const Icon =
            p.riskScore <= 30 ? ShieldCheck : p.riskScore <= 60 ? ShieldAlert : AlertTriangle;
          return (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{
                background: "#FDFBF7",
                border: `1px solid ${HAIRLINE}`,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Ring score={p.riskScore} color={color} />
                <div className="min-w-0">
                  <p className="text-xs truncate" style={{ color: INK_55 }}>
                    {p.projectName}
                  </p>
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
                      <span
                        className="text-[11px] flex-1 truncate"
                        style={{ color: INK_55 }}
                      >
                        {f.label}
                      </span>
                      <div
                        className="w-20 h-1 rounded-full overflow-hidden"
                        style={{ background: "rgba(26,26,26,0.08)" }}
                      >
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
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="rgba(26,26,26,0.10)"
        strokeWidth={stroke}
        fill="none"
      />
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
