import React, { useMemo } from "react";
import { UNIT_FIELDS, type UnitFieldId } from "@/lib/compare/unitFieldsConfig";
import { buildSchedule, type PlanRule } from "@/lib/payment-plan/buildSchedule";
import type { UnitDraft } from "./AddUnitDialog";
import type { PickedProject } from "./ProjectPicker";

interface Props {
  project: PickedProject;
  units: UnitDraft[];
  visible: UnitFieldId[];
  sharedPlan: PlanRule[] | null;
  unitPlans: Record<string, PlanRule[]>;
  isPreview?: boolean;
  onEditUnit?: (unit: UnitDraft) => void;
}

const fmt0 = new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 });
const AED = (n: number | null | undefined) => (n == null ? "—" : `AED ${fmt0.format(n)}`);

export default function UnitComparisonTable({ project, units, visible, sharedPlan, unitPlans, isPreview, onEditUnit }: Props) {
  const computed = useMemo(() => {
    return units.map((u) => {
      const rules = sharedPlan ?? unitPlans[u.id] ?? [];
      const sch = buildSchedule({
        totalPriceAED: u.priceAED,
        handoverDate: project.handover_date || new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2).toISOString(),
        rules,
      });
      const downPct = rules.find((r) => r.kind === "down_payment")?.pct ?? null;
      return { u, sch, downPct };
    });
  }, [units, sharedPlan, unitPlans, project.handover_date]);

  // best-value: lowest price/sqft
  const bestPpsId = useMemo(() => {
    let best: { id: string; pps: number } | null = null;
    for (const { u } of computed) {
      const pps = u.sizeSqft > 0 ? u.priceAED / u.sizeSqft : Infinity;
      if (!best || pps < best.pps) best = { id: u.id, pps };
    }
    return best?.id;
  }, [computed]);

  const bestMonthlyId = useMemo(() => {
    let best: { id: string; monthly: number } | null = null;
    for (const { u, sch } of computed) {
      const monthly = sch.totals.monthlyInstallmentAED ?? Infinity;
      if (!best || monthly < best.monthly) best = { id: u.id, monthly };
    }
    return best?.id;
  }, [computed]);

  const fieldsInGroup = (group: string) =>
    UNIT_FIELDS.filter((f) => f.group === group && visible.includes(f.id));
  const groups = ["Unit", "Project", "Payment plan", "Developer", "Investor metrics"] as const;

  const cellValue = (id: UnitFieldId, c: typeof computed[number]) => {
    const { u, sch, downPct } = c;
    switch (id) {
      case "label": return u.label;
      case "bedrooms": return u.bedrooms === "studio" ? "Studio" : `${u.bedrooms} BR`;
      case "propertyType": return u.propertyType || "Apartment";
      case "size": return u.sizeSqft ? `${fmt0.format(u.sizeSqft)} sqft` : "—";
      case "price": return AED(u.priceAED);
      case "pricePerSqft": return u.sizeSqft ? `AED ${fmt0.format(u.priceAED / u.sizeSqft)}` : "—";
      case "view": return u.view || "—";
      case "floor": return u.floor || "—";
      case "unitNumber": return u.unitNumber || "—";
      case "cityNumber": return u.cityNumber || "—";
      case "layout": return u.layout || "—";
      case "unitDescription": return u.description || "—";
      case "projectName": return project.name;
      case "developer": return project.developer?.name || "—";
      case "location": return project.location || "—";
      case "community": return project.location || "—";
      case "handover": return project.handover_date || "—";
      case "downPaymentPct": return downPct != null ? `${downPct}%` : "—";
      case "monthlyInstallment": return AED(sch.totals.monthlyInstallmentAED);
      case "installmentsCount": return String(sch.totals.installmentsCount);
      case "duringConstructionAED": return AED(sch.totals.duringConstructionAED);
      case "postHandoverAED": return AED(sch.totals.postHandoverAED);
      case "firstPaymentDate": return sch.totals.firstPaymentDate || "—";
      case "lastPaymentDate": return sch.totals.lastPaymentDate || "—";
      case "developerFounded": return project.developer?.founded_year?.toString() || "—";
      case "developerFounder": return project.developer?.ceo_name || "—";
      case "developerDelivered": return project.developer?.completed_projects?.toString() || "—";
      case "developerActive": return project.developer?.offplan_projects?.toString() || "—";
      case "estimatedROI": return u.priceAED < 1800000 ? "High potential" : "Balanced";
      case "estimatedYield": return u.bedrooms === "studio" || u.bedrooms === "1" ? "Strong rental fit" : "Family demand";
      case "serviceCharges": return u.serviceCharge || "Verify with developer";
      case "dldFee": return u.priceAED ? AED(u.priceAED * 0.04) : "—";
      default: return "—";
    }
  };

  const highlightId = (id: UnitFieldId, c: typeof computed[number]) =>
    (id === "pricePerSqft" && c.u.id === bestPpsId) ||
    (id === "monthlyInstallment" && c.u.id === bestMonthlyId);

  return (
    <div
      className="overflow-x-auto rounded-2xl"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}
    >
      <table className="w-full text-sm" style={{ color: "#FFFFFF" }}>
        <thead>
          <tr style={{ background: "rgba(184,149,85,0.18)" }}>
            <th className="text-left px-4 py-3 text-white/80 text-xs uppercase tracking-wider font-semibold sticky left-0 z-10" style={{ background: "rgba(15,16,32,0.92)" }}>Field</th>
            {computed.map(({ u }) => (
              <th key={u.id} className="text-left px-4 py-3 text-white font-semibold min-w-[180px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div>{u.label || `${u.bedrooms === "studio" ? "Studio" : `${u.bedrooms} BR`}`}</div>
                    {isPreview && <div className="text-[10px] uppercase tracking-wider text-white/45 mt-0.5">Preview</div>}
                  </div>
                  {onEditUnit && (
                    <button
                      type="button"
                      onClick={() => onEditUnit(u)}
                      data-no-contrast-guard
                      className="px-2 py-1 rounded text-[11px] font-semibold text-white hover:text-white"
                      style={{ background: "#F7F2EA", border: "1px solid rgba(255,255,255,0.16)" }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const fields = fieldsInGroup(g);
            if (!fields.length) return null;
            return (
              <React.Fragment key={`g-${g}`}>
                <tr>
                  <td colSpan={computed.length + 1} className="px-4 pt-5 pb-2" style={{ background: "#F7F2EA" }}>
                    <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "#B89555" }}>{g}</span>
                  </td>
                </tr>
                {fields.map((f) => (
                  <tr key={f.id} className="border-t border-white/5">
                    <td className="px-4 py-2 text-white/70 sticky left-0" style={{ background: "rgba(15,16,32,0.92)" }}>{f.label}</td>
                    {computed.map((c) => (
                      <td key={c.u.id} className="px-4 py-2 text-white">
                        <span
                          className={highlightId(f.id, c) ? "px-2 py-0.5 rounded" : ""}
                          style={highlightId(f.id, c) ? { background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.5)", color: "#86efac", fontWeight: 600 } : {}}
                        >
                          {cellValue(f.id, c)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
