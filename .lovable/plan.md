## Lightweight Hairline Regression Tests — Plan

Goal: catch future color/opacity regressions in the footer divider/hairline system **before they reach preview**, using the existing Vitest + jsdom + Testing Library setup. No Playwright, no real browser, no pixel diffing.

### Strategy

Three layers of cheap, deterministic checks — each catches a different class of regression:

1. **Token contract test** — pin the exact champagne RGB triplet and baseline alpha values in `HAIRLINE_TOKENS`. Catches "someone bumped `--hairline-alpha-gold` from 0.35 to 0.5".
2. **Hook curve test** — feed `multiplierFromLuminance` known luminance values and assert the resulting alphas. Catches "someone changed the piecewise curve and footer dividers got harsh on bright backgrounds". Uses an exported helper so we don't need DOM.
3. **Component render test** — render `<AdaptiveHairline />` for each variant and assert the `style.background` string contains the expected RGB triplets and a gradient with the right shape. Catches "someone swapped champagne for a different gold by accident" or "the gradient stops drifted".

All three run in <100ms total. No snapshot files, no flake.

### Implementation

#### 1. Export the pure curve from the hook

`src/hooks/useAdaptiveHairline.ts` currently keeps `multiplierFromLuminance` private. Add a named export:

```ts
export { multiplierFromLuminance };
```

This is the only production-code change. Pure function, no side effects.

#### 2. Token contract test — `src/styles/__tests__/hairlineTokens.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { HAIRLINE_TOKENS } from "../hairlineTokens";

describe("HAIRLINE_TOKENS contract", () => {
  it("champagne RGB triplet stays #C8A766", () => {
    expect(HAIRLINE_TOKENS.champagneRgb).toBe("200,167,102");
  });
  it("white RGB triplet stays pure white", () => {
    expect(HAIRLINE_TOKENS.whiteRgb).toBe("255,255,255");
  });
  it("baseline alphas pinned to premium champagne defaults", () => {
    expect(HAIRLINE_TOKENS.baseline).toEqual({
      white: 0.14, whiteSoft: 0.10, gold: 0.35, goldPeak: 0.40,
    });
  });
  it("ceilings prevent over-boost on pitch-black", () => {
    expect(HAIRLINE_TOKENS.ceilings).toEqual({
      white: 0.32, whiteSoft: 0.24, gold: 0.60, goldPeak: 0.70,
    });
  });
});
```

#### 3. Curve test — `src/hooks/__tests__/useAdaptiveHairline.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { multiplierFromLuminance } from "../useAdaptiveHairline";

describe("multiplierFromLuminance — alpha curve", () => {
  it("boosts on pitch-black so hairline reads", () => {
    expect(multiplierFromLuminance(0)).toBe(1.25);
    expect(multiplierFromLuminance(0.005)).toBe(1.25);
  });
  it("tapers to baseline on obsidian footer surface (~L 0.05)", () => {
    expect(multiplierFromLuminance(0.05)).toBeCloseTo(1.0, 2);
  });
  it("softens to ~0.85 on mid-dark underlays", () => {
    expect(multiplierFromLuminance(0.18)).toBeCloseTo(0.85, 2);
  });
  it("floors at 0.6 on light surfaces — never harsh", () => {
    expect(multiplierFromLuminance(0.5)).toBeCloseTo(0.65, 2);
    expect(multiplierFromLuminance(0.9)).toBe(0.6);
    expect(multiplierFromLuminance(1)).toBe(0.6);
  });
  it("monotonically non-increasing from L=0.005 → 1", () => {
    let prev = multiplierFromLuminance(0.005);
    for (let L = 0.01; L <= 1; L += 0.01) {
      const v = multiplierFromLuminance(L);
      expect(v).toBeLessThanOrEqual(prev + 1e-9);
      prev = v;
    }
  });
});
```

#### 4. Component render test — `src/components/ui/__tests__/AdaptiveHairline.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AdaptiveHairline } from "../AdaptiveHairline";

const getStroke = (variant: "accent" | "nav" | "soft") => {
  const { container } = render(<AdaptiveHairline variant={variant} />);
  const el = container.firstElementChild as HTMLElement;
  expect(el).toBeInTheDocument();
  return { el, bg: el.style.background };
};

describe("<AdaptiveHairline />", () => {
  it("renders an h-px decorative div", () => {
    const { el } = getStroke("nav");
    expect(el.className).toContain("h-px");
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  it("accent variant uses champagne triplet with faded edges", () => {
    const { bg } = getStroke("accent");
    expect(bg).toContain("rgba(200,167,102,0)"); // edge transparency stops
    expect(bg).toMatch(/rgba\(200,167,102,0\.\d+\) 50%/); // peak at center
    expect(bg).not.toContain("255,255,255"); // no white in accent
  });

  it("nav variant blends white edges with champagne center", () => {
    const { bg } = getStroke("nav");
    expect(bg).toContain("rgba(255,255,255,");
    expect(bg).toContain("rgba(200,167,102,");
    expect(bg).toMatch(/rgba\(200,167,102,0\.\d+\) 50%/);
  });

  it("soft variant is pure white, no champagne", () => {
    const { bg } = getStroke("soft");
    expect(bg).toContain("rgba(255,255,255,");
    expect(bg).not.toContain("200,167,102");
  });

  it("never emits a gradient stop with alpha > the ceiling", () => {
    // jsdom default body bg is transparent → falls back to BASELINE.luminance.
    // At baseline, gold alpha is 0.35 (×1.25 boost = 0.4375 capped at 0.6).
    const { bg } = getStroke("nav");
    const alphas = [...bg.matchAll(/rgba\([^)]+,(0?\.\d+)\)/g)]
      .map(m => parseFloat(m[1]));
    for (const a of alphas) expect(a).toBeLessThanOrEqual(0.7);
  });

  it("forwards className for layout overrides", () => {
    const { container } = render(
      <AdaptiveHairline variant="nav" className="max-w-7xl mx-auto" />
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("max-w-7xl");
    expect(el.className).toContain("mx-auto");
  });
});
```

### Files

**Create**
- `src/styles/__tests__/hairlineTokens.test.ts`
- `src/hooks/__tests__/useAdaptiveHairline.test.ts`
- `src/components/ui/__tests__/AdaptiveHairline.test.tsx`

**Edit**
- `src/hooks/useAdaptiveHairline.ts` — add `export { multiplierFromLuminance };` (one line).

### What this catches

| Regression | Caught by |
|---|---|
| Champagne triplet changed (e.g. someone uses `184,148,62`) | Token contract + render test |
| Baseline alpha bumped (gold 0.35 → 0.5 makes footer harsh) | Token contract |
| Adaptive curve flattened (light surfaces no longer soften) | Curve test |
| Curve becomes non-monotonic (bizarre dark-spot harshness) | Curve test |
| Variant gradient shape drifts (e.g. peak at 30% instead of 50%) | Render test |
| White leaks into `accent` or champagne leaks into `soft` | Render test |
| `<AdaptiveHairline />` stops respecting `className` overrides | Render test |

### What this does NOT catch (acknowledged)

- True pixel-level rendering differences across browsers — would need Playwright + screenshot diffing, which is heavyweight and out of scope for "lightweight".
- The luminance detection inside `useAdaptiveHairline` walking a real ancestor tree — jsdom's `getComputedStyle` returns empty backgrounds so the hook always falls back to baseline. The pure curve test covers the math; the live integration is verified manually in `/dev/footer-preview`.

### Risk

Negligible. All tests are pure / synchronous. The only production change is a single `export` of an already-pure helper.