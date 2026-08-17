import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import UnitComparisonTable from "../UnitComparisonTable";
import { DEFAULT_PLAN_RULES } from "@/lib/payment-plan/buildSchedule";
import type { UnitDraft } from "../AddUnitDialog";
import type { PickedProject } from "../ProjectPicker";

/**
 * The default plan only reaches 100% of the price at a ~51-month handover. At
 * the 1-3 year windows JBJ sells into it schedules 61-85%, and the table used
 * to render that as a complete-looking payment plan — buildSchedule() computed
 * the warning, nothing displayed it.
 */

const project: PickedProject = {
  id: "p1",
  name: "Marina View",
  slug: "marina-view",
  location: "Dubai Marina",
  handover_date: null,
  price_from: 1_500_000,
  developer: null,
};

const unit: UnitDraft = {
  id: "u1",
  label: "2 BR Marina",
  bedrooms: "2",
  sizeSqft: 1200,
  priceAED: 2_000_000,
  propertyType: "Apartment",
  serviceCharge: "",
  view: "",
  floor: "",
  unitNumber: "",
  cityNumber: "",
  layout: "",
  description: "",
};

const monthsOut = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
};

const VISIBLE = ["label", "price", "monthlyInstallment"] as never[];

describe("UnitComparisonTable — payment plan coverage warning", () => {
  it("warns when the default plan under-covers at a 2-year handover", () => {
    render(
      <UnitComparisonTable
        project={{ ...project, handover_date: monthsOut(24) }}
        units={[unit]}
        visible={VISIBLE}
        sharedPlan={DEFAULT_PLAN_RULES}
        unitPlans={{}}
      />,
    );

    expect(screen.getByText(/Payment plan does not total 100%/i)).toBeTruthy();
    const notice = document.querySelector("[data-payment-plan-warning]");
    expect(notice?.textContent).toMatch(/not covered by any instalment/i);
    // Names the unit so a broker comparing several knows which one is short.
    expect(notice?.textContent).toContain("2 BR Marina");
  });

  it("stays silent when the plan balances to 100%", () => {
    render(
      <UnitComparisonTable
        project={{ ...project, handover_date: monthsOut(24) }}
        units={[unit]}
        visible={VISIBLE}
        sharedPlan={[
          { kind: "down_payment", pct: 20 },
          { kind: "on_handover", pct: 80 },
        ]}
        unitPlans={{}}
      />,
    );

    expect(document.querySelector("[data-payment-plan-warning]")).toBeNull();
    expect(screen.queryByText(/does not total 100%/i)).toBeNull();
  });
});
