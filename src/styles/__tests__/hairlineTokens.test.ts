import { describe, it, expect } from "vitest";
import { HAIRLINE_TOKENS } from "../hairlineTokens";

/**
 * Token contract — pins the exact values the entire adaptive-hairline
 * system is calibrated against. If any of these change, the footer
 * divider WILL look different. Update intentionally.
 */
describe("HAIRLINE_TOKENS contract", () => {
  it("champagne RGB triplet stays #B89555 (200,167,102)", () => {
    expect(HAIRLINE_TOKENS.champagneRgb).toBe("200,167,102");
  });

  it("white RGB triplet stays pure white", () => {
    expect(HAIRLINE_TOKENS.whiteRgb).toBe("255,255,255");
  });

  it("baseline alphas pinned to premium champagne defaults", () => {
    expect(HAIRLINE_TOKENS.baseline).toEqual({
      white: 0.14,
      whiteSoft: 0.1,
      gold: 0.35,
      goldPeak: 0.4,
    });
  });

  it("ceilings prevent over-boost on pitch-black underlays", () => {
    expect(HAIRLINE_TOKENS.ceilings).toEqual({
      white: 0.32,
      whiteSoft: 0.24,
      gold: 0.6,
      goldPeak: 0.7,
    });
  });

  it("every ceiling sits above its baseline (boost headroom exists)", () => {
    const { baseline, ceilings } = HAIRLINE_TOKENS;
    expect(ceilings.white).toBeGreaterThan(baseline.white);
    expect(ceilings.whiteSoft).toBeGreaterThan(baseline.whiteSoft);
    expect(ceilings.gold).toBeGreaterThan(baseline.gold);
    expect(ceilings.goldPeak).toBeGreaterThan(baseline.goldPeak);
  });
});
