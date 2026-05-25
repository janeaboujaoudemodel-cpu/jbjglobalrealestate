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
};

export function getDeveloperLogoOverride(
  name?: string | null,
): DeveloperLogoOverride {
  if (!name) return {};
  return OVERRIDES[normalize(name)] ?? {};
}
