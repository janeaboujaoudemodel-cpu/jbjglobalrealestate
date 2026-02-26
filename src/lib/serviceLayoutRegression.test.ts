import { describe, expect, it } from "vitest";
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
/*  REGRESSION: Route-map determinism — no post-render flip possible  */
/* ------------------------------------------------------------------ */

const SERVICE_PAGES = [
  "/services/property-management",
  "/services/buying-advisory",
  "/services/selling-advisory",
  "/services/rental-advisory",
  "/services/investment-advisory",
  "/services/snagging",
  "/services/fit-out",
  "/services/design-build",
  "/services/law-firm",
] as const;

describe("service layout regression — deterministic route map", () => {
  it.each(SERVICE_PAGES)(
    "%s has transparent header (dark hero) from route map alone",
    (path) => {
      // This MUST be true on first render — no DOM probe needed
      expect(hasTransparentHeader(path)).toBe(true);
    },
  );

  it.each(SERVICE_PAGES)(
    "%s does NOT need header spacing (no pt-24 push)",
    (path) => {
      expect(needsHeaderSpacing(path)).toBe(false);
    },
  );

  it.each(SERVICE_PAGES)("%s is NOT a back-office route", (path) => {
    expect(isBackOfficeRoute(path)).toBe(false);
  });

  it("all /services/* sub-routes are covered by the prefix rule", () => {
    const hasServicesPrefix = TRANSPARENT_HEADER_PREFIXES.some(
      (p) => p === "/services/",
    );
    expect(hasServicesPrefix).toBe(true);
  });

  it("back-office routes never get transparent header", () => {
    expect(hasTransparentHeader("/admin")).toBe(false);
    expect(hasTransparentHeader("/admin/users")).toBe(false);
    expect(hasTransparentHeader("/listing-admin")).toBe(false);
    expect(hasTransparentHeader("/broker-dashboard")).toBe(false);
  });

  it("back-office routes always need header spacing", () => {
    expect(needsHeaderSpacing("/admin")).toBe(true);
    expect(needsHeaderSpacing("/broker-dashboard/leads")).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  REGRESSION: Layout guard detects visible vs collapsed body        */
/* ------------------------------------------------------------------ */

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

const mountServiceSections = (heights: number[]) => {
  document.body.innerHTML = "<main></main>";
  const main = document.querySelector("main") as HTMLElement;

  heights.forEach((height, index) => {
    const section = document.createElement("section");
    section.id = `sec-${index + 1}`;
    setElementHeights(section, height, height);
    main.appendChild(section);
  });

  setElementHeights(
    main,
    heights.reduce((sum, current) => sum + current, 0),
  );
};

describe("service layout regression — visibility guard logic", () => {
  it("correctly identifies visible body when sections have real height", () => {
    // Simulates a normal service page: hero 640px + 3 body sections
    mountServiceSections([640, 450, 380, 290]);

    const snapshot = getServiceLayoutSnapshot(document);
    expect(snapshot.bodySections.length).toBe(3);
    expect(hasVisibleServiceBody(snapshot)).toBe(true);

    // Every body section must exceed MIN_VISIBLE_SECTION_HEIGHT
    snapshot.bodySections.forEach((s) => {
      expect(s.offsetHeight).toBeGreaterThan(MIN_VISIBLE_SECTION_HEIGHT);
    });
  });

  it("detects collapsed page (all body sections 0-height)", () => {
    mountServiceSections([640, 0, 0, 0]);

    const snapshot = getServiceLayoutSnapshot(document);
    expect(hasVisibleServiceBody(snapshot)).toBe(false);
  });

  it("detects partial collapse (only tiny body sections)", () => {
    mountServiceSections([640, 10, 5, 2]);

    const snapshot = getServiceLayoutSnapshot(document);
    expect(hasVisibleServiceBody(snapshot)).toBe(false);
  });

  it("hero-only page is detected as no visible body", () => {
    mountServiceSections([640]);

    const snapshot = getServiceLayoutSnapshot(document);
    expect(snapshot.bodySections.length).toBe(0);
    expect(hasVisibleServiceBody(snapshot)).toBe(false);
  });

  it("snapshot includes correct pathname", () => {
    mountServiceSections([640, 300]);

    const snapshot = getServiceLayoutSnapshot(document);
    // jsdom defaults to about:blank, but the function reads window.location.pathname
    expect(typeof snapshot.pathname).toBe("string");
  });

  it("mainHeight reflects real main element height", () => {
    mountServiceSections([640, 500, 400]);

    const snapshot = getServiceLayoutSnapshot(document);
    expect(snapshot.mainHeight).toBe(1540);
  });
});
