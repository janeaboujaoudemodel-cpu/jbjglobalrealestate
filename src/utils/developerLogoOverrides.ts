/**
 * Per-developer rendering overrides for the unified champagne logo plate.
 *
 * Keyed by a normalized version of the developer name (lowercase, alphanumerics
 * only). Two flags:
 *  - invert: the logo is a white wordmark on a dark background; we strip the
 *    background visually and force the mark to solid ink so it's legible on
 *    our champagne plate.
 *  - forceNameplate: skip the image entirely and render our own ink wordmark
 *    of the developer name in the same plate.
 */
export type DeveloperLogoOverride = {
  invert?: boolean;
  forceNameplate?: boolean;
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
  // Kingdom By MAG — branded as a white "Kingdom" wordmark on a dark grey
  // square plate. The grey plate clashes with our white logo plate, so we
  // skip the bitmap and render a clean ink wordmark instead.
  kingdombymag: { forceNameplate: true },
  kingdom: { forceNameplate: true },
  kingdomdevelopment: { forceNameplate: true },
  kingdomdevelopments: { forceNameplate: true },
  // Browser favicons and dark-on-transparent/blocked marks caused fake globe
  // icons or empty white boxes on property cards. Use approved text marks.
  modon: { forceNameplate: true },
  modonproperties: { forceNameplate: true },
  prestigeone: { forceNameplate: true },
  prestigeonedevelopments: { forceNameplate: true },
  vincitore: { forceNameplate: true },
  vincitorerealestatedevelopment: { forceNameplate: true },
  // Zoya's official SVG is a very light embedded wordmark; it fades on white.
  zoya: { darkPlate: true, imageFilter: "contrast(1.28) saturate(1.14) brightness(1.08)" },
  zoyadevelopment: { darkPlate: true, imageFilter: "contrast(1.28) saturate(1.14) brightness(1.08)" },
  zoyadevelopments: { darkPlate: true, imageFilter: "contrast(1.28) saturate(1.14) brightness(1.08)" },
  // The supplied Laraix raster has a black plate baked into the image. Screen
  // blend removes that plate against the animated gold frame while preserving
  // the official red/white artwork.
  laraix: { imageBlendMode: "screen", imageFilter: "contrast(1.2) saturate(1.2)" },
  laraixdevelopers: { imageBlendMode: "screen", imageFilter: "contrast(1.2) saturate(1.2)" },
};


export function getDeveloperLogoOverride(
  name?: string | null,
): DeveloperLogoOverride {
  if (!name) return {};
  return OVERRIDES[normalize(name)] ?? {};
}
