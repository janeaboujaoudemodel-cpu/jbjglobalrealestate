/**
 * PrivateSurfaceStyles — route-lazy loader for back-office CSS.
 *
 * `src/styles/private-surfaces.css` holds the 297 rules that can only ever
 * match inside owner / CRM / portal / document-studio DOM (proven by
 * scripts/qa/css_private_split.py: every selector branch carries a token that
 * exists nowhere in public source). Public routes must never parse them, so
 * the stylesheet is fetched by dynamic import the first time a private route
 * is entered. Injection happens after index.css, so cascade order is
 * unchanged relative to the previous single-stylesheet build.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const PRIVATE_PREFIXES = [
  "/owner",
  "/admin",
  "/crm",
  "/broker",
  "/developer-hub",
  "/developers-portal",
  "/developer-portal",
  "/portal",
  "/document-studio",
  "/documents",
  "/investor-dashboard",
  "/backend",
  "/team",
  "/hr",
];

let loaded = false;

export function isPrivateSurfacePath(pathname: string) {
  return PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function PrivateSurfaceStyles() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (loaded || !isPrivateSurfacePath(pathname)) return;
    loaded = true;
    import("@/styles/private-surfaces.css").catch(() => {
      loaded = false;
    });
  }, [pathname]);

  return null;
}
