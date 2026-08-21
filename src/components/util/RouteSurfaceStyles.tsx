/**
 * RouteSurfaceStyles — route-lazy loader for secondary-route CSS.
 *
 * `src/styles/route-surfaces.css` holds the 284 rules that can only ever match
 * inside insights/guides and comparison DOM (proven by
 * scripts/qa/css_route_split.py: every selector branch carries a page-shell
 * scope token that exists nowhere else). Keeping them out of the global sheet
 * shrinks the CSSOM the homepage and listing pages must re-match on every
 * style recalculation — the measured cost behind slow dropdown open/close.
 *
 * The sheet is appended after index.css, so cascade order is unchanged.
 *
 * LOADING TRIGGER — read before adding a route here.
 * The sheet is scoped by DOM tokens (`[data-insights-page]`, comparison shells),
 * but this component can only see the URL. Those two views of "does this page
 * need the sheet?" drifted badly: `InsightsPageScope` came to wrap ~55 paths
 * that render `data-insights-page`, while the prefix list below still named
 * seven, so pages like /faq, /about, /market-intelligence and /company-profile
 * rendered the scope token and loaded none of the ~280 rules written for it.
 *
 * The fix is for whoever mounts the scope to request the sheet directly, via
 * `ensureRouteSurfaceStyles()`. The prefix list stays for shells that use the
 * sheet without going through `InsightsPageScope` (comparison, blog, library) —
 * it is a supplement now, not the only trigger, so it cannot silently
 * under-cover again.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_PREFIXES = [
  "/insights",
  "/guides",
  "/area-guides",
  "/library",
  "/blog",
  "/compare",
  "/comparison",
];

let loaded = false;

export function isRouteSurfacePath(pathname: string) {
  return ROUTE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Load `route-surfaces.css` once per session. Idempotent and safe to call from
 * render or an effect; a failed import resets the latch so a later navigation
 * retries.
 */
export function ensureRouteSurfaceStyles(): void {
  if (loaded) return;
  loaded = true;
  import("@/styles/route-surfaces.css").catch(() => {
    loaded = false;
  });
  // PASS 350 fix — loaded right after route-surfaces.css so its higher-
  // specificity, later-in-source rules win the cascade. route-surfaces.css
  // has overly-broad `[class*="px-6"]`/`[class*="px-8"]` hero-CTA selectors
  // that unintentionally also match the primary emerald CTA buttons
  // (.jj-mi-hero-cta-emerald), producing unreadable dark-on-dark button text
  // (e.g. the "Explore Company" / "Speak With Our Team" buttons on
  // /founder). This sheet restores the correct emerald fill + white text.
  import("@/styles/pass-350-hero-cta-contrast-fix.css").catch(() => {});
}

export default function RouteSurfaceStyles() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isRouteSurfacePath(pathname)) return;
    ensureRouteSurfaceStyles();
  }, [pathname]);

  return null;
}
