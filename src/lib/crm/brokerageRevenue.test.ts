import { describe, expect, it } from "vitest";
import {
  filterDealsByDateRange,
  groupDealsByPeriod,
  summarize,
  type DealLike,
} from "./brokerageRevenue";

/**
 * Money-path coverage (CTO audit priority #2, Aug 2026).
 *
 * These functions compute the commission and revenue figures shown on
 * brokerage-facing dashboards — real AED totals brokers and owners use to
 * check they were paid correctly. Zero test coverage existed before this
 * file, despite the numbers being pure aggregation math with several easy
 * places for a silent bug (bad date, string vs. number, empty period).
 */

const deal = (overrides: Partial<DealLike>): DealLike => ({
  closed_on: "2026-03-15",
  deal_value_aed: 1_000_000,
  commission_aed: 20_000,
  ...overrides,
});

describe("summarize", () => {
  it("sums gross and commission across all deals", () => {
    const result = summarize([
      deal({ deal_value_aed: 1_000_000, commission_aed: 20_000 }),
      deal({ deal_value_aed: 2_000_000, commission_aed: 40_000 }),
    ]);
    expect(result.count).toBe(2);
    expect(result.gross).toBe(3_000_000);
    expect(result.commission).toBe(60_000);
    expect(result.avg).toBe(1_500_000);
  });

  it("returns zeroed values for an empty deal list instead of dividing by zero", () => {
    const result = summarize([]);
    expect(result).toEqual({ count: 0, gross: 0, commission: 0, avg: 0 });
  });

  it("treats missing deal_value_aed / commission_aed as zero rather than NaN", () => {
    const result = summarize([
      deal({ deal_value_aed: null, commission_aed: undefined as unknown as null }),
    ]);
    expect(result.gross).toBe(0);
    expect(result.commission).toBe(0);
    expect(Number.isNaN(result.avg)).toBe(false);
  });

  it("coerces numeric strings (as commonly come back from Supabase numeric columns)", () => {
    const result = summarize([deal({ deal_value_aed: "1500000", commission_aed: "30000" })]);
    expect(result.gross).toBe(1_500_000);
    expect(result.commission).toBe(30_000);
  });
});

describe("groupDealsByPeriod", () => {
  const deals: DealLike[] = [
    { closed_on: "2026-01-05", deal_value_aed: 1_000_000, commission_aed: 20_000 },
    { closed_on: "2026-01-20", deal_value_aed: 500_000, commission_aed: 10_000 },
    { closed_on: "2026-02-10", deal_value_aed: 2_000_000, commission_aed: 40_000 },
  ];

  it("groups by month and aggregates deal count, gross, and commission per period", () => {
    const result = groupDealsByPeriod(deals, "month");
    const jan = result.find((r) => r.sortKey === "2026-01");
    const feb = result.find((r) => r.sortKey === "2026-02");
    expect(jan).toMatchObject({ deals: 2, gross: 1_500_000, commission: 30_000 });
    expect(feb).toMatchObject({ deals: 1, gross: 2_000_000, commission: 40_000 });
  });

  it("groups the same deals into a single quarter", () => {
    const result = groupDealsByPeriod(deals, "quarter");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sortKey: "2026-Q1",
      deals: 3,
      gross: 3_500_000,
      commission: 70_000,
    });
  });

  it("groups the same deals into a single year", () => {
    const result = groupDealsByPeriod(deals, "year");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ sortKey: "2026", deals: 3, gross: 3_500_000 });
  });

  it("sorts periods newest-first", () => {
    const result = groupDealsByPeriod(
      [
        { closed_on: "2025-06-01", deal_value_aed: 100, commission_aed: 1 },
        { closed_on: "2026-06-01", deal_value_aed: 100, commission_aed: 1 },
      ],
      "year",
    );
    expect(result.map((r) => r.sortKey)).toEqual(["2026", "2025"]);
  });

  it("silently skips deals with a missing or unparseable closed_on date, without dropping totals for valid ones", () => {
    const result = groupDealsByPeriod(
      [
        { closed_on: null, deal_value_aed: 999_999, commission_aed: 9_999 },
        { closed_on: "not-a-date", deal_value_aed: 999_999, commission_aed: 9_999 },
        { closed_on: "2026-05-01", deal_value_aed: 1_000_000, commission_aed: 20_000 },
      ],
      "month",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ deals: 1, gross: 1_000_000, commission: 20_000 });
  });
});

describe("filterDealsByDateRange", () => {
  const deals: DealLike[] = [
    { closed_on: "2026-01-01", deal_value_aed: 1, commission_aed: 1 },
    { closed_on: "2026-06-15", deal_value_aed: 1, commission_aed: 1 },
    { closed_on: "2026-12-31", deal_value_aed: 1, commission_aed: 1 },
  ];

  it("returns all deals unfiltered when no range is given", () => {
    expect(filterDealsByDateRange(deals)).toHaveLength(3);
  });

  it("excludes deals before the start date", () => {
    const result = filterDealsByDateRange(deals, new Date("2026-02-01"));
    expect(result).toHaveLength(2);
  });

  it("excludes deals after the end date", () => {
    const result = filterDealsByDateRange(deals, undefined, new Date("2026-06-30"));
    expect(result).toHaveLength(2);
  });

  it("is inclusive at the exact start and end boundaries", () => {
    const result = filterDealsByDateRange(
      deals,
      new Date("2026-01-01"),
      new Date("2026-12-31"),
    );
    expect(result).toHaveLength(3);
  });

  it("excludes deals with a missing closed_on when a range is active", () => {
    const result = filterDealsByDateRange(
      [...deals, { closed_on: null, deal_value_aed: 1, commission_aed: 1 }],
      new Date("2026-01-01"),
      new Date("2026-12-31"),
    );
    expect(result).toHaveLength(3);
  });
});
