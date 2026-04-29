import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AdaptiveHairline } from "../AdaptiveHairline";

/**
 * Render-time contract for the shared section-divider primitive.
 *
 * In jsdom the underlying useAdaptiveHairline effect schedules its
 * measurement inside requestAnimationFrame and getComputedStyle returns
 * no backgroundColor, so the initial paint uses the BASELINE alphas
 * straight from HAIRLINE_TOKENS — exactly what we want to assert.
 */
const getStroke = (variant: "accent" | "nav" | "soft") => {
  const { container } = render(<AdaptiveHairline variant={variant} />);
  const el = container.firstElementChild as HTMLElement;
  return { el, bg: el.style.background || el.style.backgroundImage };
};

describe("<AdaptiveHairline />", () => {
  it("renders a 1px decorative element", () => {
    const { el } = getStroke("nav");
    expect(el).toBeInTheDocument();
    expect(el.tagName).toBe("DIV");
    expect(el.className).toContain("h-px");
    expect(el.className).toContain("w-full");
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  it("accent variant uses champagne with faded edges, no white", () => {
    const { bg } = getStroke("accent");
    expect(bg).toContain("rgba(200,167,102,0)"); // edge fade stops
    expect(bg).toMatch(/rgba\(200,167,102,0\.\d+\) 50%/); // peak at center
    expect(bg).not.toContain("255,255,255");
  });

  it("nav variant blends white edges with a champagne center peak", () => {
    const { bg } = getStroke("nav");
    expect(bg).toContain("rgba(255,255,255,");
    expect(bg).toContain("rgba(200,167,102,");
    expect(bg).toMatch(/rgba\(200,167,102,0\.\d+\) 50%/);
    expect(bg).toMatch(/rgba\(255,255,255,0\.\d+\) 20%/);
    expect(bg).toMatch(/rgba\(255,255,255,0\.\d+\) 80%/);
  });

  it("soft variant is pure white, no champagne", () => {
    const { bg } = getStroke("soft");
    expect(bg).toContain("rgba(255,255,255,");
    expect(bg).not.toContain("200,167,102");
  });

  it("never emits a stop alpha above the calibrated ceiling (0.7)", () => {
    for (const v of ["accent", "nav", "soft"] as const) {
      const { bg } = getStroke(v);
      const alphas = [...bg.matchAll(/rgba\([^)]+,\s*(0?\.\d+)\s*\)/g)].map(
        (m) => parseFloat(m[1]),
      );
      for (const a of alphas) {
        expect(a).toBeLessThanOrEqual(0.7 + 1e-9);
      }
    }
  });

  it("forwards className for layout overrides (e.g. max-w container)", () => {
    const { container } = render(
      <AdaptiveHairline variant="nav" className="max-w-7xl mx-auto" />,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("max-w-7xl");
    expect(el.className).toContain("mx-auto");
    expect(el.className).toContain("h-px");
  });
});
