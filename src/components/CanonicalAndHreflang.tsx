import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SUPPORTED_LANGUAGES } from "@/translations";

/**
 * CanonicalAndHreflang
 *
 * Injects (and keeps in sync on every route change) the global SEO link tags:
 *   1. <link rel="canonical" ...>           — self-referential canonical URL
 *   2. <link rel="alternate" hreflang=...>  — one per supported language + x-default
 *
 * Architecture notes:
 * - The site is single-URL across locales (language is switched in-app via
 *   LanguageContext, not via /ar/, /fr/, ... URL prefixes). Best practice in
 *   this setup is to point every hreflang at the SAME canonical URL so Google
 *   knows the URL serves all those languages and stops flagging duplicate
 *   indexing across www.jbj.ae, jbj.ae, and *.lovable.app.
 * - Private / gated areas are excluded so we never publish canonicals for
 *   internal admin / portal routes.
 * - Ephemeral tracking query params (utm_*, fbclid, gclid, ref) are stripped
 *   from the canonical to consolidate ranking signals onto the clean URL.
 *
 * Mount once, near the top of the router tree (inside <BrowserRouter>).
 */

const CANONICAL_ORIGIN = "https://www.jbj.ae";

// Routes that must NOT advertise canonical/hreflang to search engines.
// (Internal portals, gated dashboards, auth-only flows.)
const PRIVATE_ROUTE_PREFIXES = [
  "/owner",
  "/admin",
  "/developer-portal",
  "/internal",
  "/auth",
  "/account",
  "/dashboard",
  "/team-chat",
  "/crm",
  "/onboarding/referral",
];

const EPHEMERAL_QUERY_PREFIXES = ["utm_"];
const EPHEMERAL_QUERY_KEYS = new Set([
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "yclid",
  "ref",
  "mc_cid",
  "mc_eid",
]);

const isPrivateRoute = (pathname: string) =>
  PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

const buildCanonicalUrl = (pathname: string, search: string): string => {
  // Normalize: remove trailing slash (except root), strip tracking params.
  const cleanPath =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  let cleanSearch = "";
  if (search) {
    const params = new URLSearchParams(search);
    const keysToDelete: string[] = [];
    params.forEach((_, key) => {
      const lower = key.toLowerCase();
      if (
        EPHEMERAL_QUERY_KEYS.has(lower) ||
        EPHEMERAL_QUERY_PREFIXES.some((p) => lower.startsWith(p))
      ) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((k) => params.delete(k));
    const remaining = params.toString();
    cleanSearch = remaining ? `?${remaining}` : "";
  }

  return `${CANONICAL_ORIGIN}${cleanPath}${cleanSearch}`;
};

const HREFLANG_MARKER = "data-jbj-hreflang";

const removeManagedTags = () => {
  document
    .querySelectorAll(`link[${HREFLANG_MARKER}]`)
    .forEach((el) => el.remove());
};

const upsertCanonical = (href: string | null) => {
  let canonical = document.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement | null;

  if (!href) {
    if (canonical) canonical.remove();
    return;
  }

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", href);
};

const upsertOgUrl = (href: string | null) => {
  let tag = document.querySelector(
    'meta[property="og:url"]'
  ) as HTMLMetaElement | null;
  if (!href) return;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", "og:url");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", href);
};

const injectHreflangTags = (canonicalHref: string) => {
  removeManagedTags();

  // Content is served in English at a single URL (in-app language switching
  // does not change the URL). To avoid Semrush / Google "hreflang conflict"
  // warnings (same URL claimed for multiple distinct languages), emit only
  // `en` + `x-default`. Both point to the canonical.
  const codes: Array<[string, string]> = [
    ["en", canonicalHref],
    ["x-default", canonicalHref],
  ];

  codes.forEach(([code, href]) => {
    const link = document.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", code);
    link.setAttribute("href", href);
    link.setAttribute(HREFLANG_MARKER, "1");
    document.head.appendChild(link);
  });
};

export const CanonicalAndHreflang = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (isPrivateRoute(pathname)) {
      // Private / gated route: drop public canonical + alternates so we don't
      // advertise gated URLs in SERPs.
      upsertCanonical(null);
      removeManagedTags();
      return;
    }

    const canonicalHref = buildCanonicalUrl(pathname, search);
    upsertCanonical(canonicalHref);
    upsertOgUrl(canonicalHref);
    injectHreflangTags(canonicalHref);
  }, [pathname, search]);

  return null;
};

export default CanonicalAndHreflang;
