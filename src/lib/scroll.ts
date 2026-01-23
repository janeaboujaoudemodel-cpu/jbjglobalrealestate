export type ScrollToIdOptions = {
  /** Additional offset in pixels beyond the fixed header offset */
  extraOffset?: number;
  behavior?: ScrollBehavior;
};

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

/**
 * Computes a safe top offset for fixed headers.
 * Main header is h-16 on mobile (64px) and h-20 on lg+ (80px).
 * We add breathing room so section titles don't sit flush under the header.
 */
export function getDefaultScrollOffset(): number {
  if (typeof window === "undefined") return 120;
  const isDesktopHeader = window.matchMedia?.("(min-width: 1024px)")?.matches ?? false;
  const headerPx = isDesktopHeader ? 80 : 64;
  return headerPx + 48;
}

export function scrollToId(id: string, options: ScrollToIdOptions = {}): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  const el = document.getElementById(id);
  if (!el) return false;

  const behavior: ScrollBehavior =
    options.behavior ?? (prefersReducedMotion() ? "auto" : "smooth");

  // Prefer native scrollIntoView when scroll-margin-top is set on the target.
  // This avoids double-applying offsets across pages that already use `scroll-mt-*`.
  const scrollMarginTop = Number.parseFloat(getComputedStyle(el).scrollMarginTop || "0");
  if (scrollMarginTop > 0) {
    el.scrollIntoView({ behavior, block: "start" });
    return true;
  }

  // Fallback: manual offset for targets without scroll margin.
  const offset = getDefaultScrollOffset() + (options.extraOffset ?? 0);
  const top = el.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({ top: Math.max(0, top), behavior });
  return true;
}
