/**
 * Smart Payment Plan Engine
 *
 * Takes a list of plan rules + a unit's total price + handover date,
 * and expands it into a full, month-by-month installment schedule.
 *
 * Pure client-side. No network. Used by the Unit Comparison tool
 * (/compare?mode=units).
 */

export type PlanRule =
  | { kind: "down_payment"; pct: number; label?: string }
  | { kind: "milestone"; pct: number; offsetMonths: number; label?: string }
  | { kind: "monthly"; pct: number; startMonth: number; label?: string } // monthly until handover
  | { kind: "on_handover"; pct: number; label?: string }
  | { kind: "post_handover_monthly"; pct: number; months: number; label?: string };

export interface PlanInput {
  totalPriceAED: number;
  handoverDate: string; // ISO
  startDate?: string; // ISO, default today
  rules: PlanRule[];
}

export interface ScheduleRow {
  date: string; // ISO yyyy-mm-dd
  label: string;
  pct: number;
  amountAED: number;
  phase: "booking" | "construction" | "handover" | "post_handover";
}

export interface BuiltSchedule {
  rows: ScheduleRow[];
  totals: {
    totalPct: number;
    totalAED: number;
    duringConstructionAED: number;
    onHandoverAED: number;
    postHandoverAED: number;
    monthlyInstallmentAED: number | null; // first monthly rule amount
    installmentsCount: number;
    firstPaymentDate: string | null;
    lastPaymentDate: string | null;
  };
  warnings: string[];
}

const addMonths = (iso: string, months: number) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};
const monthsBetween = (a: string, b: string) => {
  const da = new Date(a);
  const db = new Date(b);
  return (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth());
};
const round0 = (n: number) => Math.round(n);

export function buildSchedule(input: PlanInput): BuiltSchedule {
  const warnings: string[] = [];
  const start = input.startDate ?? new Date().toISOString().slice(0, 10);
  const handover = input.handoverDate;
  const rows: ScheduleRow[] = [];

  const totalPrice = Number(input.totalPriceAED) || 0;
  if (totalPrice <= 0) warnings.push("Total price must be greater than zero.");
  if (!handover) warnings.push("Handover date is required.");

  const monthsToHandover = handover ? Math.max(0, monthsBetween(start, handover)) : 0;

  for (const r of input.rules) {
    const pct = Number(r.pct) || 0;
    const amount = round0((pct / 100) * totalPrice);

    switch (r.kind) {
      case "down_payment":
        rows.push({
          date: start,
          label: r.label ?? `Down payment (${pct}%)`,
          pct,
          amountAED: amount,
          phase: "booking",
        });
        break;
      case "milestone":
        rows.push({
          date: addMonths(start, r.offsetMonths),
          label: r.label ?? `Milestone +${r.offsetMonths}mo (${pct}%)`,
          pct,
          amountAED: amount,
          phase: "construction",
        });
        break;
      case "monthly": {
        const monthlyCount = Math.max(0, monthsToHandover - r.startMonth + 1);
        if (monthlyCount <= 0) {
          warnings.push(`Monthly ${pct}% rule has no months before handover.`);
          break;
        }
        for (let i = 0; i < monthlyCount; i++) {
          rows.push({
            date: addMonths(start, r.startMonth + i),
            label: r.label ?? `Monthly ${pct}%`,
            pct,
            amountAED: amount,
            phase: "construction",
          });
        }
        break;
      }
      case "on_handover":
        rows.push({
          date: handover || start,
          label: r.label ?? `On handover (${pct}%)`,
          pct,
          amountAED: amount,
          phase: "handover",
        });
        break;
      case "post_handover_monthly":
        for (let i = 1; i <= r.months; i++) {
          rows.push({
            date: addMonths(handover || start, i),
            label: r.label ?? `Post-handover ${pct}%`,
            pct,
            amountAED: amount,
            phase: "post_handover",
          });
        }
        break;
    }
  }

  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const totalPct = rows.reduce((s, r) => s + r.pct, 0);
  if (Math.abs(totalPct - 100) > 0.01)
    warnings.push(`Plan totals ${totalPct.toFixed(2)}% — should equal 100%.`);

  const totals = {
    totalPct,
    totalAED: rows.reduce((s, r) => s + r.amountAED, 0),
    duringConstructionAED: rows
      .filter((r) => r.phase === "booking" || r.phase === "construction")
      .reduce((s, r) => s + r.amountAED, 0),
    onHandoverAED: rows.filter((r) => r.phase === "handover").reduce((s, r) => s + r.amountAED, 0),
    postHandoverAED: rows
      .filter((r) => r.phase === "post_handover")
      .reduce((s, r) => s + r.amountAED, 0),
    monthlyInstallmentAED:
      rows.find((r) => /monthly/i.test(r.label) && r.phase === "construction")?.amountAED ?? null,
    installmentsCount: rows.length,
    firstPaymentDate: rows[0]?.date ?? null,
    lastPaymentDate: rows[rows.length - 1]?.date ?? null,
  };

  return { rows, totals, warnings };
}

/** Convenient default plan: 10% down, 10% after 1mo, 1% monthly to handover, 30% on handover. */
export const DEFAULT_PLAN_RULES: PlanRule[] = [
  { kind: "down_payment", pct: 10 },
  { kind: "milestone", pct: 10, offsetMonths: 1 },
  { kind: "monthly", pct: 1, startMonth: 2 },
  { kind: "on_handover", pct: 30 },
];
