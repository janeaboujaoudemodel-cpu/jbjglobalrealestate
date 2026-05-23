/**
 * UI Regression: header mega-menu fast-close
 * --------------------------------------------------------------
 * The user has repeatedly complained that header dropdowns feel
 * sluggish to close. The fix sets a tight setTimeout (<= 100ms)
 * in GlobalHeader.tsx — this test reads the source and asserts
 * the delay stays snappy so it can't quietly regress.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const HEADER_PATH = resolve(__dirname, "../../components/GlobalHeader.tsx");

describe("GlobalHeader fast-close regression", () => {
  const source = readFileSync(HEADER_PATH, "utf8");

  it("uses a snappy close delay (<= 100ms) for the mega menu", () => {
    // Match the timeout that schedules `setActiveMegaMenu(null)`
    const match = source.match(
      /megaMenuTimeoutRef\.current\s*=\s*setTimeout\([\s\S]*?\},\s*(\d+)\)/
    );
    expect(match, "could not find megaMenuTimeoutRef setTimeout block").not.toBeNull();
    const delay = Number(match![1]);
    expect(Number.isFinite(delay)).toBe(true);
    expect(delay).toBeLessThanOrEqual(100);
  });

  it("still clears the pending timeout when the panel is re-entered (no stuck menus)", () => {
    expect(source).toMatch(/handleMegaMenuPanelEnter/);
    expect(source).toMatch(/clearTimeout\(megaMenuTimeoutRef\.current\)/);
  });

  it("clears the timeout on unmount to prevent stale state updates", () => {
    // The cleanup block lives inside a useEffect return; make sure both
    // the check and the clear are present.
    expect(source).toMatch(
      /if\s*\(megaMenuTimeoutRef\.current\)\s*\{\s*clearTimeout\(megaMenuTimeoutRef\.current\)/
    );
  });
});
