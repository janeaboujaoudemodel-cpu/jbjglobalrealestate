import { describe, it, expect } from "vitest";
import { multiplierFromLuminance } from "../useAdaptiveHairline";

/**
 * Pure curve regression tests. Locks the piecewise mapping calibrated
 * against the obsidian footer baseline so future tweaks can't silently
 * make hairlines too faint on black or too harsh on light surfaces.
 */
describe("multiplierFromLuminance — alpha curve", () => {
  it("boosts ×1.25 on pitch-black so the hairline reads", () => {
    expect(multiplierFromLuminance(0)).toBe(1.25);
    expect(multiplierFromLuminance(0.005)).toBe(1.25);
  });

  it("tapers to ~1.0 on the obsidian footer surface (~L 0.05)", () => {
    expect(multiplierFromLuminance(0.05)).toBeCloseTo(1.0, 2);
  });

  it("softens to ~0.85 on mid-dark underlays (~L 0.18)", () => {
    expect(multiplierFromLuminance(0.18)).toBeCloseTo(0.85, 2);
  });

  it("floors at 0.6 on light surfaces — never harsh", () => {
    expect(multiplierFromLuminance(0.5)).toBeCloseTo(0.65, 2);
    expect(multiplierFromLuminance(0.9)).toBe(0.6);
    expect(multiplierFromLuminance(1)).toBe(0.6);
  });

  it("is monotonically non-increasing across the full range", () => {
    let prev = multiplierFromLuminance(0.005);
    for (let L = 0.01; L <= 1.0001; L += 0.01) {
      const v = multiplierFromLuminance(L);
      expect(v).toBeLessThanOrEqual(prev + 1e-9);
      prev = v;
    }
  });

  it("never exceeds the calibrated boost ceiling of 1.25", () => {
    for (let L = 0; L <= 1.0001; L += 0.02) {
      expect(multiplierFromLuminance(L)).toBeLessThanOrEqual(1.25 + 1e-9);
    }
  });

  it("never drops below the calibrated floor of 0.6", () => {
    for (let L = 0; L <= 1.0001; L += 0.02) {
      expect(multiplierFromLuminance(L)).toBeGreaterThanOrEqual(0.6 - 1e-9);
    }
  });
});
