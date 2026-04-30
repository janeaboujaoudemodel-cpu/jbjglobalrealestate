import { describe, it, expect } from "vitest";
import {
  hasBeenEmailed,
  isInQueuePool,
  isInHistoryPool,
  splitDeveloperPools,
  type DeveloperRow,
} from "./developerPools";

const make = (over: Partial<DeveloperRow> = {}): DeveloperRow => ({
  id: over.id ?? "dev-1",
  status: "not_started",
  last_outreach_at: null,
  outreach_count: 0,
  ...over,
});

describe("hasBeenEmailed", () => {
  it("is false when no outreach has happened", () => {
    expect(hasBeenEmailed(make())).toBe(false);
  });
  it("is true when last_outreach_at is set", () => {
    expect(hasBeenEmailed(make({ last_outreach_at: "2026-04-30T10:00:00Z" }))).toBe(true);
  });
  it("is true when outreach_count > 0 even without timestamp", () => {
    expect(hasBeenEmailed(make({ outreach_count: 1 }))).toBe(true);
  });
  it("treats null/undefined outreach_count as zero", () => {
    expect(hasBeenEmailed(make({ outreach_count: null }))).toBe(false);
    expect(hasBeenEmailed(make({ outreach_count: undefined }))).toBe(false);
  });
});

describe("queuePool / historyPool filtering rules", () => {
  it("keeps a non-emailed pending_application developer in the queue", () => {
    const dev = make({ status: "pending_application" });
    expect(isInQueuePool(dev)).toBe(true);
    expect(isInHistoryPool(dev)).toBe(false);
  });

  it("keeps every non-registered, non-emailed status in the queue", () => {
    const statuses = [
      "not_started",
      "pending_application",
      "documents_required",
      "under_review",
      "rejected",
      "expired",
    ];
    for (const status of statuses) {
      const dev = make({ status });
      expect(isInQueuePool(dev), `expected ${status} in queue`).toBe(true);
      expect(isInHistoryPool(dev), `expected ${status} not in history`).toBe(false);
    }
  });

  it("moves a pending_application developer to history once emailed", () => {
    const dev = make({
      status: "pending_application",
      last_outreach_at: "2026-04-30T10:00:00Z",
      outreach_count: 1,
    });
    expect(isInQueuePool(dev)).toBe(false);
    expect(isInHistoryPool(dev)).toBe(true);
  });

  it("keeps registered developers in history even without an email", () => {
    const dev = make({ status: "registered", last_outreach_at: null, outreach_count: 0 });
    expect(isInHistoryPool(dev)).toBe(true);
    expect(isInQueuePool(dev)).toBe(false);
  });

  it("keeps registered + emailed developers in history (not duplicated in queue)", () => {
    const dev = make({
      status: "registered",
      last_outreach_at: "2026-04-30T10:00:00Z",
      outreach_count: 2,
    });
    expect(isInHistoryPool(dev)).toBe(true);
    expect(isInQueuePool(dev)).toBe(false);
  });

  it("queue and history pools are mutually exclusive for every row", () => {
    const fixtures: DeveloperRow[] = [
      make({ status: "not_started" }),
      make({ status: "pending_application" }),
      make({ status: "pending_application", last_outreach_at: "2026-04-29T00:00:00Z" }),
      make({ status: "documents_required", outreach_count: 3 }),
      make({ status: "under_review" }),
      make({ status: "registered" }),
      make({ status: "registered", last_outreach_at: "2026-04-15T00:00:00Z" }),
      make({ status: "rejected" }),
      make({ status: "expired", outreach_count: 1 }),
    ];
    for (const dev of fixtures) {
      const inQ = isInQueuePool(dev);
      const inH = isInHistoryPool(dev);
      expect(inQ && inH, `row appeared in both pools: ${JSON.stringify(dev)}`).toBe(false);
      expect(inQ || inH, `row appeared in neither pool: ${JSON.stringify(dev)}`).toBe(true);
    }
  });
});

describe("splitDeveloperPools", () => {
  it("partitions a mixed registry correctly", () => {
    const rows: DeveloperRow[] = [
      make({ id: "a", status: "pending_application" }), // queue
      make({ id: "b", status: "pending_application", last_outreach_at: "2026-04-29T00:00:00Z" }), // history
      make({ id: "c", status: "not_started" }), // queue
      make({ id: "d", status: "registered" }), // history (no email)
      make({ id: "e", status: "registered", outreach_count: 2 }), // history
      make({ id: "f", status: "documents_required", outreach_count: 0 }), // queue
    ];

    const { queuePool, historyPool } = splitDeveloperPools(rows);

    expect(queuePool.map((r) => r.id).sort()).toEqual(["a", "c", "f"]);
    expect(historyPool.map((r) => r.id).sort()).toEqual(["b", "d", "e"]);
    expect(queuePool.length + historyPool.length).toBe(rows.length);
  });

  it("regression: 24 stuck pending_application devs without email all stay in queue", () => {
    const rows: DeveloperRow[] = Array.from({ length: 24 }, (_, i) =>
      make({ id: `stuck-${i}`, status: "pending_application", last_outreach_at: null, outreach_count: 0 })
    );
    const { queuePool, historyPool } = splitDeveloperPools(rows);
    expect(queuePool).toHaveLength(24);
    expect(historyPool).toHaveLength(0);
  });
});
