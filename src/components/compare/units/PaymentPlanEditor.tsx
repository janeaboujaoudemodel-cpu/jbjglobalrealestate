import { Plus, Trash2 } from "lucide-react";
import type { PlanRule } from "@/lib/payment-plan/buildSchedule";

interface Props {
  rules: PlanRule[];
  onChange: (rules: PlanRule[]) => void;
  compact?: boolean;
}

const RULE_PRESETS: { label: string; build: () => PlanRule }[] = [
  { label: "+ Down payment", build: () => ({ kind: "down_payment", pct: 10 }) },
  { label: "+ Milestone", build: () => ({ kind: "milestone", pct: 10, offsetMonths: 1 }) },
  { label: "+ Monthly till handover", build: () => ({ kind: "monthly", pct: 1, startMonth: 2 }) },
  { label: "+ On handover", build: () => ({ kind: "on_handover", pct: 30 }) },
  { label: "+ Post-handover", build: () => ({ kind: "post_handover_monthly", pct: 1, months: 24 }) },
];

const inputBase: React.CSSProperties = {
  background: "#F7F2EA",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#FFFFFF",
};

export default function PaymentPlanEditor({ rules, onChange, compact }: Props) {
  const update = (i: number, patch: Partial<PlanRule>) => {
    const next = [...rules];
    next[i] = { ...(next[i] as object), ...(patch as object) } as PlanRule;
    onChange(next);
  };
  const remove = (i: number) => onChange(rules.filter((_, idx) => idx !== i));
  const add = (r: PlanRule) => onChange([...rules, r]);

  const totalPct = rules.reduce((s, r) => s + (Number(r.pct) || 0), 0);
  const totalOk = Math.abs(totalPct - 100) < 0.01;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {rules.map((r, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded font-semibold" style={{ background: "rgba(184,149,85,0.18)", color: "#1A1A1A" }}>
              {labelForKind(r.kind)}
            </span>

            <input
              type="number"
              value={r.pct}
              onChange={(e) => update(i, { pct: Number(e.target.value) } as Partial<PlanRule>)}
              className="w-16 text-sm px-2 py-1 rounded outline-none"
              style={inputBase}
              data-no-contrast-guard
            />
            <span className="text-white/70 text-xs">%</span>

            {r.kind === "milestone" && (
              <>
                <span className="text-white/60 text-xs">after</span>
                <input
                  type="number"
                  value={r.offsetMonths}
                  onChange={(e) => update(i, { offsetMonths: Number(e.target.value) } as Partial<PlanRule>)}
                  className="w-16 text-sm px-2 py-1 rounded outline-none"
                  style={inputBase}
                  data-no-contrast-guard
                />
                <span className="text-white/60 text-xs">month(s)</span>
              </>
            )}
            {r.kind === "monthly" && (
              <>
                <span className="text-white/60 text-xs">starting month</span>
                <input
                  type="number"
                  value={r.startMonth}
                  onChange={(e) => update(i, { startMonth: Number(e.target.value) } as Partial<PlanRule>)}
                  className="w-16 text-sm px-2 py-1 rounded outline-none"
                  style={inputBase}
                  data-no-contrast-guard
                />
                <span className="text-white/60 text-xs">until handover</span>
              </>
            )}
            {r.kind === "post_handover_monthly" && (
              <>
                <span className="text-white/60 text-xs">for</span>
                <input
                  type="number"
                  value={r.months}
                  onChange={(e) => update(i, { months: Number(e.target.value) } as Partial<PlanRule>)}
                  className="w-16 text-sm px-2 py-1 rounded outline-none"
                  style={inputBase}
                  data-no-contrast-guard
                />
                <span className="text-white/60 text-xs">months</span>
              </>
            )}

            <button
              onClick={() => remove(i)}
              className="ml-auto p-1.5 rounded hover:bg-white/10"
              aria-label="Remove rule"
              data-no-contrast-guard
            >
              <Trash2 className="w-4 h-4 text-white/70" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {RULE_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => add(p.build())}
            data-no-contrast-guard
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", color: "#FFFFFF" }}
          >
            <Plus className="w-3 h-3" /> {p.label.replace("+ ", "")}
          </button>
        ))}
      </div>

      {!compact && (
        <div
          className="px-3 py-2 rounded-lg text-xs flex items-center justify-between"
          style={{
            background: totalOk ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
            border: `1px solid ${totalOk ? "rgba(34,197,94,0.35)" : "rgba(245,158,11,0.4)"}`,
            color: totalOk ? "#86efac" : "#fcd34d",
          }}
        >
          <span>Total {totalPct.toFixed(2)}%</span>
          <span>{totalOk ? "✓ Plan is balanced" : "Should total 100%"}</span>
        </div>
      )}
    </div>
  );
}

function labelForKind(k: PlanRule["kind"]) {
  switch (k) {
    case "down_payment": return "Down";
    case "milestone": return "Milestone";
    case "monthly": return "Monthly";
    case "on_handover": return "Handover";
    case "post_handover_monthly": return "Post-handover";
  }
}
