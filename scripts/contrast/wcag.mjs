// Tiny WCAG 2.1 contrast utilities. No deps.

export function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
}

function relLuminance([r, g, b]) {
  const norm = [r, g, b]
    .map((c) => c / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
}

export function contrastRatio(rgbA, rgbB) {
  const lA = relLuminance(rgbA);
  const lB = relLuminance(rgbB);
  const [hi, lo] = lA > lB ? [lA, lB] : [lB, lA];
  return (hi + 0.05) / (lo + 0.05);
}

// Parse "H S% L%" or "H, S%, L%" Tailwind/shadcn token format.
export function parseHslTriplet(value) {
  const m = value
    .trim()
    .replace(/,/g, ' ')
    .match(/^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%$/);
  if (!m) return null;
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}

export const AA_TEXT = 4.5;
export const AA_LARGE = 3.0;
export const AA_UI = 3.0;
