/**
 * Brokerage revenue grouping helper.
 * Aggregates a flat array of brokerage deals into period-based rollups.
 */

export type Granularity = "month" | "quarter" | "year";

export interface DealLike {
  closed_on: string | Date | null;
  deal_value_aed: number | string | null;
  commission_aed?: number | string | null;
}

export interface PeriodRollup {
  period: string;        // "2026-01" | "2026 Q1" | "2026"
  sortKey: string;       // sortable lexicographic key
  deals: number;
  gross: number;
  commission: number;
}

const num = (v: any) => (v == null ? 0 : Number(v) || 0);

function periodKeys(d: Date, g: Granularity): { label: string; sortKey: string } {
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-indexed
  if (g === "year") return { label: String(y), sortKey: String(y) };
  if (g === "quarter") {
    const q = Math.floor(m / 3) + 1;
    return { label: `${y} Q${q}`, sortKey: `${y}-Q${q}` };
  }
  const mm = String(m + 1).padStart(2, "0");
  const monthName = new Date(y, m, 1).toLocaleString("en", { month: "short" });
  return { label: `${monthName} ${y}`, sortKey: `${y}-${mm}` };
}

export function groupDealsByPeriod(
  deals: DealLike[],
  granularity: Granularity,
): PeriodRollup[] {
  const map = new Map<string, PeriodRollup>();
  for (const d of deals) {
    if (!d.closed_on) continue;
    const date = d.closed_on instanceof Date ? d.closed_on : new Date(d.closed_on);
    if (isNaN(date.getTime())) continue;
    const { label, sortKey } = periodKeys(date, granularity);
    const cur = map.get(sortKey) ?? {
      period: label,
      sortKey,
      deals: 0,
      gross: 0,
      commission: 0,
    };
    cur.deals += 1;
    cur.gross += num(d.deal_value_aed);
    cur.commission += num(d.commission_aed);
    map.set(sortKey, cur);
  }
  return Array.from(map.values()).sort((a, b) =>
    b.sortKey.localeCompare(a.sortKey),
  );
}

export function summarize(deals: DealLike[]) {
  const gross = deals.reduce((s, d) => s + num(d.deal_value_aed), 0);
  const commission = deals.reduce((s, d) => s + num(d.commission_aed), 0);
  return {
    count: deals.length,
    gross,
    commission,
    avg: deals.length ? gross / deals.length : 0,
  };
}

export function filterDealsByDateRange(
  deals: DealLike[],
  start?: Date,
  end?: Date,
): DealLike[] {
  if (!start && !end) return deals;
  return deals.filter((d) => {
    if (!d.closed_on) return false;
    const t = new Date(d.closed_on).getTime();
    if (isNaN(t)) return false;
    if (start && t < start.getTime()) return false;
    if (end && t > end.getTime()) return false;
    return true;
  });
}
