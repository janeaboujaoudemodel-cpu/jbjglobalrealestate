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

export default function RouteSurfaceStyles() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (loaded || !isRouteSurfacePath(pathname)) return;
    loaded = true;
    import("@/styles/route-surfaces.css").catch(() => {
      loaded = false;
    });
  }, [pathname]);

  return null;
}
