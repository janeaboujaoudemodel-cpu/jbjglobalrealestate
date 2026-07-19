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
};


export function getDeveloperLogoOverride(
  name?: string | null,
): DeveloperLogoOverride {
  if (!name) return {};
  return OVERRIDES[normalize(name)] ?? {};
}
