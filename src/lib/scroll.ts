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

  // Always use manual offset calculation for consistent behavior across all pages
  // This prevents jumping issues caused by inconsistent scroll-margin-top values
  const offset = getDefaultScrollOffset() + (options.extraOffset ?? 0);
  const currentScrollY = window.scrollY;
  const elementTop = el.getBoundingClientRect().top + currentScrollY;
  const targetTop = Math.max(0, elementTop - offset);

  // Only scroll if we're not already at the target position (within 5px tolerance)
  if (Math.abs(currentScrollY - targetTop) > 5) {
    window.scrollTo({ top: targetTop, behavior });
  }
  
  return true;
}
