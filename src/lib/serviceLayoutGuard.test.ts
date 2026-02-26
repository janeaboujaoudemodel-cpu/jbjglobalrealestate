import { describe, expect, it } from "vitest";
import {
  getServiceLayoutSnapshot,
  hasVisibleServiceBody,
} from "@/lib/serviceLayoutGuard";

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

describe("service layout guard", () => {
  it("detects a visible service body", () => {
    mountServiceSections([640, 260, 340]);

    const snapshot = getServiceLayoutSnapshot(document);
    expect(snapshot.bodySections.length).toBe(2);
    expect(hasVisibleServiceBody(snapshot)).toBe(true);
  });

  it("detects collapsed body sections", () => {
    mountServiceSections([640, 0, 0]);

    const snapshot = getServiceLayoutSnapshot(document);
    expect(hasVisibleServiceBody(snapshot)).toBe(false);
  });

  it("reports scroll percentage for debug overlay", () => {
    mountServiceSections([800, 600, 600]);

    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 3000,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 1000,
    });

    const snapshot = getServiceLayoutSnapshot(document);
    expect(snapshot.scrollPercent).toBe(50);
  });
});
