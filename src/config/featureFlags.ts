/**
 * Lightweight client-side feature flags.
 *
 * Resolution order (first match wins):
 *   1. URL query string  →  ?ff_<key>=1 | 0
 *   2. localStorage      →  ff:<key>     = "1" | "0"
 *   3. Built-in default  →  DEFAULTS[key]
 *
 * Flags are intentionally additive and reversible so we can wire new
 * components (e.g. UnifiedBrokerPicker) alongside legacy UI without
 * destroying the existing flow.
 */

export type FeatureFlagKey = "unifiedBrokerPicker";

const DEFAULTS: Record<FeatureFlagKey, boolean> = {
  // Pass 4 — controlled rollout of the unified canonical/pre-invite broker picker.
  // OFF by default. Owner enables via `?ff_unified_picker=1` or
  // localStorage `ff:unifiedBrokerPicker=1` for side-by-side QA.
  unifiedBrokerPicker: false,
};

const URL_ALIASES: Record<FeatureFlagKey, string> = {
  unifiedBrokerPicker: "ff_unified_picker",
};

function readQuery(name: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

function readStorage(name: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(`ff:${name}`);
  } catch {
    return null;
  }
}

function coerce(v: string | null): boolean | null {
  if (v == null) return null;
  if (v === "1" || v === "true") return true;
  if (v === "0" || v === "false") return false;
  return null;
}

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  const fromUrl = coerce(readQuery(URL_ALIASES[key]));
  if (fromUrl !== null) return fromUrl;
  const fromStorage = coerce(readStorage(key));
  if (fromStorage !== null) return fromStorage;
  return DEFAULTS[key];
}

export function setFeatureFlag(key: FeatureFlagKey, on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`ff:${key}`, on ? "1" : "0");
  } catch {
    /* noop */
  }
}
