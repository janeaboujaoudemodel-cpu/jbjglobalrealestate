/**
 * useAdaptiveHairline
 *
 * Measures the effective background luminance behind a target element and
 * returns alpha multipliers for hairline strokes so they never look too
 * faint (on black) or too harsh (on lighter underlays).
 *
 * Strategy:
 *  - Walk ancestors (skipping the target itself) until we find one with a
 *    non-transparent background-color — that's the "underlay".
 *  - Compute its perceived luminance (sRGB → relative luminance, 0..1).
 *  - Map luminance to an alpha multiplier using a smooth piecewise curve
 *    calibrated against the footer's baseline (#0A0908, L≈0.003).
 *
 * Cheap by design: ResizeObserver + MutationObserver, no rAF loop.
 */
import { useEffect, useState, RefObject } from "react";
import { HAIRLINE_TOKENS } from "@/styles/hairlineTokens";

export interface HairlineAlphas {
  /** Luminance of detected underlay, 0 (black) → 1 (white). */
  luminance: number;
  /** Alpha for white hairlines (0..1). Baseline 0.14. */
  white: number;
  /** Alpha for soft white edges in gradients. Baseline 0.10. */
  whiteSoft: number;
  /** Alpha for champagne / gold hairlines (0..1). Baseline 0.35. */
  gold: number;
  /** Alpha for the strong center peak of accent hairlines. Baseline 0.40. */
  goldPeak: number;
}

const BASELINE: HairlineAlphas = {
  luminance: 0.003,
  ...HAIRLINE_TOKENS.baseline,
};

const CEIL = HAIRLINE_TOKENS.ceilings;

function parseRgb(input: string): [number, number, number, number] | null {
  const m = input.match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)/i,
  );
  if (!m) return null;
  return [
    parseFloat(m[1]),
    parseFloat(m[2]),
    parseFloat(m[3]),
    m[4] !== undefined ? parseFloat(m[4]) : 1,
  ];
}

function srgbToLinear(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

function detectUnderlayLuminance(target: HTMLElement): number {
  const declaredSurface = target.closest<HTMLElement>(
    '[data-surface="light"], [data-surface="champagne"], [data-surface="cream"], [data-surface="page"], [data-surface="raised"], [data-surface="gold"], [data-surface="pearl"], .surface-light, .surface-champagne, .jj-surface-champagne, [data-surface="emerald"], [data-surface="dark"], [data-surface="ink"], [data-surface="navy"], [data-on-dark], [data-hero-dark], .surface-dark, .surface-ink, .jj-surface-emerald, .jj-hero-fullscreen, .jj-hero-neon',
  );
  if (declaredSurface) {
    const surface = declaredSurface.getAttribute('data-surface');
    if (
      surface === 'light' ||
      surface === 'champagne' ||
      surface === 'cream' ||
      surface === 'page' ||
      surface === 'raised' ||
      surface === 'gold' ||
      surface === 'pearl' ||
      declaredSurface.matches('.surface-light, .surface-champagne, .jj-surface-champagne')
    ) {
      return 0.86;
    }
    return BASELINE.luminance;
  }

  // Avoid walking every ancestor with getComputedStyle. One parent read plus
  // the root fallback is enough for adaptive hairlines and prevents layout
  // thrashing during dropdown/menu opens.
  if (target.parentElement) {
    const rgba = parseRgb(getComputedStyle(target.parentElement).backgroundColor);
    if (rgba && rgba[3] > 0.01) {
      return relativeLuminance(rgba[0], rgba[1], rgba[2]);
    }
  }
  const htmlBg = parseRgb(
    getComputedStyle(document.documentElement).backgroundColor,
  );
  if (htmlBg && htmlBg[3] > 0.01) {
    return relativeLuminance(htmlBg[0], htmlBg[1], htmlBg[2]);
  }
  return BASELINE.luminance;
}

/**
 * Smooth piecewise mapping luminance → alpha multiplier.
 *  - Pitch-black underlay (L≤0.005): boost ×1.25 so the hairline reads.
 *  - Footer-default obsidian (L 0.005..0.05): taper 1.25 → 1.0.
 *  - Mid-dark underlays (L 0.05..0.18): taper 1.0 → 0.85.
 *  - Bright underlays (L 0.18..0.5): taper 0.85 → 0.65.
 *  - Light surfaces (L > 0.5): floor at 0.6 — never harsh.
 */
export function multiplierFromLuminance(L: number): number {
  if (L <= 0.005) return 1.25;
  if (L <= 0.05) {
    const t = (L - 0.005) / (0.05 - 0.005);
    return 1.25 - t * 0.25;
  }
  if (L <= 0.18) {
    const t = (L - 0.05) / (0.18 - 0.05);
    return 1.0 - t * 0.15;
  }
  if (L <= 0.5) {
    const t = (L - 0.18) / (0.5 - 0.18);
    return 0.85 - t * 0.2;
  }
  return 0.6;
}

export function useAdaptiveHairline<T extends HTMLElement>(
  ref: RefObject<T>,
): HairlineAlphas {
  const [alphas, setAlphas] = useState<HairlineAlphas>(BASELINE);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const L = detectUnderlayLuminance(el);
        const m = multiplierFromLuminance(L);
        setAlphas({
          luminance: L,
          white: Math.min(CEIL.white, +(BASELINE.white * m).toFixed(3)),
          whiteSoft: Math.min(CEIL.whiteSoft, +(BASELINE.whiteSoft * m).toFixed(3)),
          gold: Math.min(CEIL.gold, +(BASELINE.gold * m).toFixed(3)),
          goldPeak: Math.min(CEIL.goldPeak, +(BASELINE.goldPeak * m).toFixed(3)),
        });
      });
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);

    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref]);

  return alphas;
}
