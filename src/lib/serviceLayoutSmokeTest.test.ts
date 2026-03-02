import { describe, expect, it, beforeEach } from "vitest";
import {
  hasTransparentHeader,
  needsHeaderSpacing,
  isBackOfficeRoute,
  TRANSPARENT_HEADER_PREFIXES,
} from "@/config/mainLayoutRoutes";
import {
  getServiceLayoutSnapshot,
  hasVisibleServiceBody,
  MIN_VISIBLE_SECTION_HEIGHT,
} from "@/lib/serviceLayoutGuard";

/* ------------------------------------------------------------------ */
/*  SMOKE TEST: End-to-end layout guard for service pages             */
/*  Simulates DOM with real section heights, scrolls, and asserts     */
/*  that at least one body section is visible (> 120px).              */
/* ------------------------------------------------------------------ */

const SMOKE_TEST_PAGES = [
  "/services/property-management",
  "/services/buying-advisory",
  "/services/investment-advisory",
] as const;

const setElementHeights = (
  el: HTMLElement,
  offsetHeight: number,
  scrollHeight: number = offsetHeight,
) => {
  Object.defineProperty(el, "offsetHeight", {
    configurable: true,
    value: offsetHeight,
  });
  Object.defineProperty(el, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
};

const mountServicePage = (heights: number[]) => {
  document.body.innerHTML = "<main></main>";
  const main = document.querySelector("main") as HTMLElement;

  heights.forEach((height, index) => {
    const section = document.createElement("section");
    section.id = index === 0 ? "hero" : `section-${index + 1}`;
    setElementHeights(section, height, height);
    main.appendChild(section);
  });

  const totalHeight = heights.reduce((sum, h) => sum + h, 0);
  setElementHeights(main, totalHeight);

  // Set scrollable document height
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: totalHeight + 200,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 1080,
  });
};

describe("service layout smoke test — e2e simulation", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it.each(SMOKE_TEST_PAGES)(
    "%s: route map yields transparent header, no spacing",
    (path) => {
      expect(hasTransparentHeader(path)).toBe(true);
      expect(needsHeaderSpacing(path)).toBe(false);
      expect(isBackOfficeRoute(path)).toBe(false);
    },
  );

  it("/services/ prefix exists in TRANSPARENT_HEADER_PREFIXES", () => {
    expect(
      TRANSPARENT_HEADER_PREFIXES.some((p) => p === "/services/"),
    ).toBe(true);
  });

  it.each(SMOKE_TEST_PAGES)(
    "%s: simulated DOM has visible body sections (bounding box > 120px)",
    (path) => {
      // Simulate realistic service page: hero 640px, 3 body sections
      mountServicePage([640, 450, 380, 290]);

      // Simulate scroll to 0%
      Object.defineProperty(window, "scrollY", {
        configurable: true,
        writable: true,
        value: 0,
      });

      const snapshot = getServiceLayoutSnapshot(document);

      // At least 1 body section with height > MIN_VISIBLE_SECTION_HEIGHT
      expect(snapshot.bodySections.length).toBeGreaterThanOrEqual(1);
      const anyVisible = snapshot.bodySections.some(
        (s) => s.offsetHeight > MIN_VISIBLE_SECTION_HEIGHT,
      );
      expect(anyVisible).toBe(true);

      // Verify no collapse — hasVisibleServiceBody must be true
      expect(hasVisibleServiceBody(snapshot)).toBe(true);
    },
  );

  it.each(SMOKE_TEST_PAGES)(
    "%s: simulated scroll to 50%% still shows body sections",
    (path) => {
      mountServicePage([640, 500, 400, 350]);

      // Simulate 50% scroll
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      Object.defineProperty(window, "scrollY", {
        configurable: true,
        writable: true,
        value: scrollableHeight * 0.5,
      });

      const snapshot = getServiceLayoutSnapshot(document);
      expect(snapshot.scrollPercent).toBeGreaterThanOrEqual(40);
      expect(snapshot.scrollPercent).toBeLessThanOrEqual(60);
      expect(hasVisibleServiceBody(snapshot)).toBe(true);
    },
  );

  it("runtime guard: collapsed page triggers guard detection", () => {
    // All body sections are 0px = collapsed
    mountServicePage([640, 0, 0, 0]);

    const snapshot = getServiceLayoutSnapshot(document);
    expect(hasVisibleServiceBody(snapshot)).toBe(false);
  });

  it("runtime guard: healthy page does NOT trigger guard", () => {
    mountServicePage([640, 500, 400, 300]);

    const snapshot = getServiceLayoutSnapshot(document);
    expect(hasVisibleServiceBody(snapshot)).toBe(true);
  });
});
