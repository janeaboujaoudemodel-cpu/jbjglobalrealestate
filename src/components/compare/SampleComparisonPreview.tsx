/**
 * SampleComparisonPreview — static "this is what you'll get" preview shown
 * on the empty-state of /compare. Three hand-picked Dubai projects with
 * a six-row comparison and a sample verdict. No network calls.
 */

import { motion } from "framer-motion";
import { TrendingUp, Trophy, ShieldCheck, Sparkles } from "lucide-react";
import { GlassCard, GradientText } from "./CompareAIShell";

const SAMPLE = {
  projects: [
    {
      name: "Emaar Beachfront",
      developer: "Emaar",
      tag: "Beachfront",
      accent: "#60A5FA",
    },
    {
      name: "Sobha Hartland II",
      developer: "Sobha",
      tag: "Lagoon Living",
      accent: "#C084FC",
    },
    {
      name: "Damac Lagoons",
      developer: "Damac",
      tag: "Resort-Style",
      accent: "#F472B6",
    },
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

export default function SampleComparisonPreview() {
  return (
    <GlassCard className="p-6 md:p-8">
      {/* Eyebrow */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(124,58,237,0.18)",
            border: "1px solid rgba(192,132,252,0.45)",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: "#C084FC" }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "#E9D5FF" }}>
            Live preview · This is what you'll get
          </span>
        </div>
        <span className="text-xs text-white/55">Sample data — not your shortlist</span>
      </div>

      {/* Headline */}
      <h3 className="text-2xl md:text-3xl font-bold mb-1 text-white">
        Three projects, <GradientText>one clear winner.</GradientText>
      </h3>
      <p className="text-white/65 text-sm mb-6 max-w-2xl">
        Our AI engine ranks every shortlist by yield, risk, developer tier and
        market context — then tells you which one to buy and why.
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-white/55 text-xs uppercase tracking-wider w-[180px]">
                Metric
              </th>
              {SAMPLE.projects.map((p, i) => (
                <th key={i} className="text-left py-3 px-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-[0.18em] font-semibold"
                      style={{ color: p.accent }}>{p.tag}</span>
                    <span className="text-white font-semibold text-sm">{p.name}</span>
                    <span className="text-white/50 text-xs">by {p.developer}</span>
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
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <td className="py-3 px-4 text-white/70 font-medium">{row.label}</td>
                {row.values.map((v, vi) => (
                  <td key={vi} className="py-3 px-4 text-white font-semibold">
                    {v}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Verdict strip */}
      <div className="mt-6 rounded-xl p-5 flex items-start gap-4 flex-wrap"
        style={{
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(124,58,237,0.18) 50%, rgba(236,72,153,0.18) 100%)",
          border: "1px solid rgba(192,132,252,0.35)",
        }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(11,16,32,0.6)", border: "1px solid rgba(244,114,182,0.45)" }}
        >
          <Trophy className="w-5 h-5" style={{ color: "#F472B6" }} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/55">AI Verdict</p>
          <p className="text-white font-bold text-base mt-0.5">{SAMPLE.verdict.winner}</p>
          <p className="text-white/70 text-sm mt-1">{SAMPLE.verdict.why}</p>
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
        background: "rgba(11,16,32,0.5)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#F8FAFC",
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}
