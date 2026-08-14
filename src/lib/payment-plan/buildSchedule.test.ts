import { describe, expect, it } from "vitest";
import { buildSchedule, DEFAULT_PLAN_RULES, type PlanInput } from "./buildSchedule";

/**
 * Money-path coverage (CTO audit priority #2, Aug 2026).
 *
 * buildSchedule() computes the actual AED installment amounts and dates a
 * client sees/pays against for a unit purchase. Before this file, it had
 * zero test coverage despite being pure, deterministic, and directly
 * client-facing money math — exactly the kind of function a silent
 * rounding or off-by-one bug could sit in for months undetected (see
 * priority #1: nothing currently alerts on that).
 */

describe("buildSchedule — down payment", () => {
  it("computes a flat percentage of the total price", () => {
    const result = buildSchedule({
      totalPriceAED: 1_000_000,
      handoverDate: "2028-01-01",
      startDate: "2026-01-01",
      rules: [{ kind: "down_payment", pct: 10 }],
    });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      date: "2026-01-01",
      pct: 10,
      amountAED: 100_000,
      phase: "booking",
    });
  });

  it("rounds to the nearest whole AED", () => {
    const result = buildSchedule({
      totalPriceAED: 333_333,
      handoverDate: "2028-01-01",
      startDate: "2026-01-01",
      rules: [{ kind: "down_payment", pct: 10 }],
    });
    // 10% of 333,333 = 33,333.3 -> rounds to 33,333
    expect(result.rows[0].amountAED).toBe(33_333);
  });
});

describe("buildSchedule — milestone", () => {
  it("places the row offsetMonths after the start date", () => {
    const result = buildSchedule({
      totalPriceAED: 1_000_000,
      handoverDate: "2028-01-01",
      startDate: "2026-01-01",
      rules: [{ kind: "milestone", pct: 10, offsetMonths: 3 }],
    });
    expect(result.rows[0].date).toBe("2026-04-01");
    expect(result.rows[0].phase).toBe("construction");
  });
});

describe("buildSchedule — monthly", () => {
  it("generates exactly one row per month from startMonth through handover", () => {
    // Jan 2026 -> Jan 2028 handover = 24 months to handover.
    const result = buildSchedule({
      totalPriceAED: 1_000_000,
      handoverDate: "2028-01-01",
      startDate: "2026-01-01",
      rules: [{ kind: "monthly", pct: 1, startMonth: 2 }],
    });
    // monthsToHandover(24) - startMonth(2) + 1 = 23 installments
    expect(result.rows).toHaveLength(23);
    expect(result.rows.every((r) => r.phase === "construction")).toBe(true);
    expect(result.rows[0].date).toBe("2026-03-01"); // start + 2 months
  });

  it("emits a warning and zero rows when startMonth is past handover", () => {
    const result = buildSchedule({
      totalPriceAED: 1_000_000,
      handoverDate: "2026-06-01",
      startDate: "2026-01-01",
      rules: [{ kind: "monthly", pct: 1, startMonth: 12 }],
    });
    expect(result.rows).toHaveLength(0);
    expect(result.warnings.some((w) => /no months before handover/i.test(w))).toBe(true);
  });
});

describe("buildSchedule — on_handover", () => {
  it("dates the row on the handover date itself", () => {
    const result = buildSchedule({
      totalPriceAED: 1_000_000,
      handoverDate: "2028-06-15",
      startDate: "2026-01-01",
      rules: [{ kind: "on_handover", pct: 30 }],
    });
    expect(result.rows[0].date).toBe("2028-06-15");
    expect(result.rows[0].phase).toBe("handover");
  });
});

describe("buildSchedule — post_handover_monthly", () => {
  it("generates one row per month after handover, for the given month count", () => {
    const result = buildSchedule({
      totalPriceAED: 1_000_000,
      handoverDate: "2028-01-01",
      startDate: "2026-01-01",
      rules: [{ kind: "post_handover_monthly", pct: 2, months: 4 }],
    });
    expect(result.rows).toHaveLength(4);
    expect(result.rows.every((r) => r.phase === "post_handover")).toBe(true);
    expect(result.rows.map((r) => r.date)).toEqual([
      "2028-02-01",
      "2028-03-01",
      "2028-04-01",
      "2028-05-01",
    ]);
  });
});

describe("buildSchedule — totals", () => {
  it("sums amounts and partitions them correctly by phase", () => {
    const result = buildSchedule({
      totalPriceAED: 1_000_000,
      handoverDate: "2026-07-01",
      startDate: "2026-01-01",
      rules: [
        { kind: "down_payment", pct: 10 },
        { kind: "on_handover", pct: 30 },
        { kind: "post_handover_monthly", pct: 10, months: 6 },
      ],
    });
    expect(result.totals.duringConstructionAED).toBe(100_000); // down payment only
    expect(result.totals.onHandoverAED).toBe(300_000);
    expect(result.totals.postHandoverAED).toBe(600_000); // 6 x 10%
    expect(result.totals.totalAED).toBe(1_000_000);
    expect(result.totals.installmentsCount).toBe(8); // 1 + 1 + 6
  });

  it("reports first and last payment dates from the sorted rows", () => {
    const result = buildSchedule({
      totalPriceAED: 1_000_000,
      handoverDate: "2027-01-01",
      startDate: "2026-01-01",
      rules: [
        { kind: "on_handover", pct: 50 },
        { kind: "down_payment", pct: 50 },
      ],
    });
    // Rows must be date-sorted regardless of input rule order.
    expect(result.totals.firstPaymentDate).toBe("2026-01-01");
    expect(result.totals.lastPaymentDate).toBe("2027-01-01");
  });

  it("warns when the plan does not total 100%", () => {
    const result = buildSchedule({
      totalPriceAED: 1_000_000,
      handoverDate: "2027-01-01",
      startDate: "2026-01-01",
      rules: [{ kind: "down_payment", pct: 40 }],
    });
    expect(result.warnings.some((w) => /should equal 100/i.test(w))).toBe(true);
  });

  it("does not warn when a plan totals exactly 100%", () => {
    const result = buildSchedule({
      totalPriceAED: 1_000_000,
      handoverDate: "2027-01-01",
      startDate: "2026-01-01",
      rules: [
        { kind: "down_payment", pct: 40 },
        { kind: "on_handover", pct: 60 },
      ],
    });
    expect(result.warnings.some((w) => /should equal 100/i.test(w))).toBe(false);
  });
});

describe("buildSchedule — input validation", () => {
  it("warns on a zero or missing total price instead of throwing", () => {
    const result = buildSchedule({
      totalPriceAED: 0,
      handoverDate: "2027-01-01",
      rules: [{ kind: "down_payment", pct: 100 }],
    });
    expect(result.warnings.some((w) => /total price must be greater than zero/i.test(w))).toBe(
      true,
    );
  });

  it("warns when handoverDate is missing", () => {
    const result = buildSchedule({
      totalPriceAED: 1_000_000,
      handoverDate: "",
      rules: [{ kind: "down_payment", pct: 100 }],
    } as PlanInput);
    expect(result.warnings.some((w) => /handover date is required/i.test(w))).toBe(true);
  });

  it("never throws on an empty rules array — returns zeroed totals instead", () => {
    const result = buildSchedule({
      totalPriceAED: 1_000_000,
      handoverDate: "2027-01-01",
      startDate: "2026-01-01",
      rules: [],
    });
    expect(result.rows).toHaveLength(0);
    expect(result.totals.totalAED).toBe(0);
    expect(result.totals.firstPaymentDate).toBeNull();
    expect(result.totals.lastPaymentDate).toBeNull();
  });
});

describe("buildSchedule — DEFAULT_PLAN_RULES", () => {
  // DEFAULT_PLAN_RULES is the plan shown by default in the live Unit
  // Comparison tool (src/components/compare/units/UnitCompareShell.tsx)
  // for any unit a client/broker adds, before anyone customizes it.
  //
  // Its "monthly till handover" rule stores a *per-installment* pct (1%),
  // so the plan's true total only reaches 100% at one specific handover
  // distance (~51 months out). For the handover windows actually typical
  // of off-plan sales (1-4 years), the schedule silently covers well
  // under the full purchase price — confirmed below — and
  // UnitCompareShell never reads `result.warnings`, so nothing currently
  // surfaces this to the person looking at the tool.
  //
  // This test pins that real, currently-shipping behavior so it's visible
  // in the suite rather than only discoverable by reading the source.
  // It is not a fix — flagging for a product decision (default rules or
  // UI, see CTO report) is a separate change from adding coverage.
  it.each([
    ["2027-01-01", 61], // ~1 year out
    ["2028-01-01", 73], // ~2 years out
    ["2029-01-01", 85], // ~3 years out
  ])("under-covers the price for a %s handover (%s%% of price)", (handoverDate, expectedPct) => {
    const result = buildSchedule({
      totalPriceAED: 2_000_000,
      handoverDate,
      startDate: "2026-01-01",
      rules: DEFAULT_PLAN_RULES,
    });
    expect(result.totals.totalPct).toBeCloseTo(expectedPct, 0);
    expect(result.warnings.some((w) => /should equal 100/i.test(w))).toBe(true);
  });

  it("only reaches exactly 100% at the one handover distance where the monthly count happens to balance", () => {
    const result = buildSchedule({
      totalPriceAED: 2_000_000,
      handoverDate: "2030-04-01", // start + 51 months
      startDate: "2026-01-01",
      rules: DEFAULT_PLAN_RULES,
    });
    expect(result.totals.totalPct).toBeCloseTo(100, 1);
    expect(result.warnings.some((w) => /should equal 100/i.test(w))).toBe(false);
  });
});
