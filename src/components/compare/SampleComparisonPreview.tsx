/**
 * SampleComparisonPreview — "this is what you'll get" static preview on /compare.
 * Champagne/gold theme. No blue/purple/pink.
 */

import { motion } from "framer-motion";
import { TrendingUp, Trophy, ShieldCheck, Sparkles } from "lucide-react";
import { GlassCard, GradientText } from "./CompareAIShell";

const SAMPLE = {
  projects: [
    { name: "Emaar Beachfront", developer: "Emaar", tag: "Beachfront" },
    { name: "Sobha Hartland II", developer: "Sobha", tag: "Lagoon Living" },
    { name: "Damac Lagoons", developer: "Damac", tag: "Resort-Style" },
  ],
  rows: [
    { label: "Price / sqft", values: ["AED 2,450", "AED 2,180", "AED 1,050"] },
    { label: "Est. rental yield", values: ["7.9%", "7.2%", "5.6%"] },
    { label: "Handover", values: ["Q4 2026", "Q2 2027", "Q1 2028"] },
    { label: "Payment plan", values: ["60/40", "50/50", "20/80"] },
    { label: "AI smart rating", values: ["★★★★★", "★★★★☆", "★★★★☆"] },
    { label: "Risk score", values: ["Low", "Low", "Medium"] },
  ],
  verdict: {
    winner: "Emaar Beachfront",
    why: "Best blend of yield, low handover risk and Tier-1 developer track record.",
  },
};

const INK = "#1A1A1A";
const INK_70 = "rgba(26,26,26,0.7)";
const INK_55 = "rgba(26,26,26,0.55)";
const GOLD = "#B89555";
const HAIRLINE = "rgba(184,149,85,0.35)";

export default function SampleComparisonPreview() {
  return (
    <GlassCard className="p-6 md:p-8">
      {/* Eyebrow */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: "#FDFBF7",
            border: `1px solid ${HAIRLINE}`,
          }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: GOLD }} />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: INK }}
          >
            Live preview · This is what you'll get
          </span>
        </div>
        <span className="text-xs" style={{ color: INK_55 }}>
          Live preview
        </span>
      </div>

      {/* Headline */}
      <h3 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: INK }}>
        Three projects, <GradientText>one clear winner.</GradientText>
      </h3>
      <p className="text-sm mb-6 max-w-2xl" style={{ color: INK_70 }}>
        Our AI engine ranks every shortlist by yield, risk, developer tier and
        market context — then tells you which one to buy and why.
      </p>

      {/* Table */}
      <div
        className="overflow-x-auto rounded-xl"
        style={{
          background: "#FDFBF7",
          border: `1px solid ${HAIRLINE}`,
        }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th
                className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider w-[180px]"
                style={{ color: INK_55 }}
              >
                Metric
              </th>
              {SAMPLE.projects.map((p, i) => (
                <th key={i} className="text-left py-3 px-4">
                  <div className="flex flex-col gap-1">
                    <span
                      className="text-[10px] uppercase tracking-[0.18em] font-semibold"
                      style={{ color: GOLD }}
                    >
                      {p.tag}
                    </span>
                    <span className="font-semibold text-sm" style={{ color: INK }}>
                      {p.name}
                    </span>
                    <span className="text-xs" style={{ color: INK_55 }}>
                      by {p.developer}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.rows.map((row, ri) => (
              <motion.tr
                key={ri}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: ri * 0.05, duration: 0.4 }}
                style={{ borderTop: `1px solid ${HAIRLINE}` }}
              >
                <td className="py-3 px-4 font-medium" style={{ color: INK_70 }}>
                  {row.label}
                </td>
                {row.values.map((v, vi) => (
                  <td key={vi} className="py-3 px-4 font-semibold" style={{ color: INK }}>
                    {v}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Verdict strip */}
      <div
        className="mt-6 rounded-xl p-5 flex items-start gap-4 flex-wrap"
        style={{
          background: "#EFE6D6",
          border: `1px solid ${HAIRLINE}`,
        }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "#FDFBF7",
            border: `1px solid ${HAIRLINE}`,
          }}
        >
          <Trophy className="w-5 h-5" style={{ color: GOLD }} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p
            className="text-[10px] uppercase tracking-[0.2em] font-semibold"
            style={{ color: INK_55 }}
          >
            AI Verdict
          </p>
          <p className="font-bold text-base mt-0.5" style={{ color: INK }}>
            {SAMPLE.verdict.winner}
          </p>
          <p className="text-sm mt-1" style={{ color: INK_70 }}>
            {SAMPLE.verdict.why}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Pill icon={TrendingUp} label="High yield" />
          <Pill icon={ShieldCheck} label="Low risk" />
        </div>
      </div>
    </GlassCard>
  );
}

function Pill({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{
        background: "#FDFBF7",
        border: `1px solid ${HAIRLINE}`,
        color: INK,
      }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color: GOLD }} />
      {label}
    </span>
  );
}
