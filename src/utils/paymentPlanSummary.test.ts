import { describe, it, expect } from "vitest";
import { formatPaymentPlanSummary } from "./paymentPlanSummary";

/**
 * Regression guard: a card's payment-plan chip must always be short.
 * A long free-text plan (e.g. Samana's "20 / 38 / 1 (On Handover) / 41
 * (Post Handover)") used to be printed verbatim, which collapsed the
 * "Price from" column to zero width and stacked its label one letter
 * per line. Never again.
 */
describe("formatPaymentPlanSummary", () => {
  it("collapses parenthesised multi-stage plans to pre / on-completion", () => {
    expect(
      formatPaymentPlanSummary({
        payment_plan: "20 / 38 / 1 (On Handover) / 41 (Post Handover)",
      }),
    ).toBe("59 / 41");
  });

  it("normalises simple ratios", () => {
    expect(formatPaymentPlanSummary({ payment_plan: "70/30" })).toBe("70 / 30");
    expect(formatPaymentPlanSummary({ payment_plan: "10 / 50 / 40" })).toBe("60 / 40");
  });

  it("returns null instead of a long sentence", () => {
    expect(
      formatPaymentPlanSummary({
        payment_plan: "Flexible plan available on request, please contact sales",
      }),
    ).toBeNull();
  });

  it("never returns a value longer than a compact chip", () => {
    const samples = [
      "20 / 38 / 1 (On Handover) / 41 (Post Handover)",
      "38 (During construction) / 41 (Post completion)",
      "70/30 with 3-Year Post-handover payment plan",
      "60 / 40",
      "Post handover",
      "",
    ];
    for (const payment_plan of samples) {
      const out = formatPaymentPlanSummary({ payment_plan });
      if (out !== null) expect(out.length).toBeLessThanOrEqual(18);
    }
  });

  it("prefers the structured breakdown when it validates to 100%", () => {
    expect(
      formatPaymentPlanSummary({
        payment_breakdown: [
          { milestone: "Down payment", percentage: 20 },
          { milestone: "During construction", percentage: 40 },
          { milestone: "On completion", percentage: 40 },
        ],
        payment_plan: "ignore me because I am very descriptive text",
      }),
    ).toBe("60 / 40");
  });
});
