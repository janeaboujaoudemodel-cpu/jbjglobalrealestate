/**
 * Per-developer rendering overrides for the unified champagne logo plate.
 *
 * Keyed by a normalized version of the developer name (lowercase, alphanumerics
 * only). Paint flags:
 *  - invert: the logo is a white wordmark on a dark background; we strip the
 *    background visually and force the mark to solid ink so it's legible on
 *    our champagne plate.
 */
export type DeveloperLogoOverride = {
  invert?: boolean;
  darkPlate?: boolean;
  imageFilter?: string;
  imageBlendMode?: "normal" | "multiply" | "screen";
};

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "");

const OVERRIDES: Record<string, DeveloperLogoOverride> = {
  // White wordmark on black box → invert to ink on champagne.
  ritzcarlton: { invert: true },
  theritzcarlton: { invert: true },
  ritzcarltonresidences: { invert: true },
  // H&H Development / H and H Development — black filled logo, white H letters.
  hhdevelopment: { invert: true },
  handhdevelopment: { invert: true },
  // MAG — white wordmark on grey/black plate; invert so it renders as
  // a clean black mark on our champagne plate, matching Emaar/Damac/Aldar.
  mag: { invert: true },
  magpd: { invert: true },
  magpropertydevelopment: { invert: true },
  magoflife: { invert: true },
  maglifestyledevelopment: { invert: true },
  magdevelopment: { invert: true },
  magdevelopments: { invert: true },
  maggroup: { invert: true },
  // Official SVGs are white wordmarks; invert to ink so they are visible on
  // the champagne/white logo plate without introducing any fallback icon.
  binghatti: { invert: true },
  binghattidevelopments: { invert: true },
  onedevelopment: { invert: true },
  one: { invert: true },
  // Zoya's official SVG is a very light embedded wordmark; it fades on white.
  zoya: { darkPlate: true, imageFilter: "contrast(1.28) saturate(1.14) brightness(1.08)" },
  zoyadevelopment: { darkPlate: true, imageFilter: "contrast(1.28) saturate(1.14) brightness(1.08)" },
  zoyadevelopments: { darkPlate: true, imageFilter: "contrast(1.28) saturate(1.14) brightness(1.08)" },
  // Laraix uses a cropped transparent brand asset; no blend-mode workaround.
  laraix: { imageFilter: "contrast(1.08) saturate(1.08)" },
  laraixdevelopers: { imageFilter: "contrast(1.08) saturate(1.08)" },
  // Official AB Developers artwork has an opaque black background. Screen
  // blending removes only that black field while preserving the real gold AB
  // monogram, preventing the solid white square caused by blanket inversion.
  ab: { imageBlendMode: "screen", imageFilter: "none" },
  abdevelopers: { imageBlendMode: "screen", imageFilter: "none" },
  abdevelopersllc: { imageBlendMode: "screen", imageFilter: "none" },
};


export function getDeveloperLogoOverride(
  name?: string | null,
): DeveloperLogoOverride {
  if (!name) return {};
  return OVERRIDES[normalize(name)] ?? {};
}
