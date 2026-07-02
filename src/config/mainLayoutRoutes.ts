export const TRANSPARENT_HEADER_ROUTES = new Set<string>([
  "/",
  "/index",
  "/properties",
  "/about",
  "/team",
  "/founder",
  "/awards",
  "/developers",
  "/services",
  "/market-intelligence",
  "/broker-resources",
  "/broker-education",
  "/company-profile",
  "/investor/portfolio-views",
  "/areas",
  "/buyer-guide",
  "/rent-guide",
  "/seller-guide",
  "/landlord-guide",
  "/tenant-guide",
  "/investor-education",
  "/guides/legal",
  "/guides/golden-visa",
]);

export const TRANSPARENT_HEADER_PREFIXES = [
  "/developers/",
  "/project/",
  "/properties/",
  "/market-intelligence/",
  "/guides/",
  "/services/",
  "/investor/",
] as const;

export const BACK_OFFICE_PREFIXES = [
  "/admin",
  "/listing-admin",
  "/broker-dashboard",
] as const;

/**
 * Routes that live under a back-office prefix but should still render the
 * full L-shaped frame (global vertical sidebar + utility bar). Add a route
 * here when the owner needs persistent navigation while working there.
 */
export const BACK_OFFICE_EXCEPTIONS = new Set<string>([
  "/admin/media-ingestion",
]);

export function isBackOfficeRoute(pathname: string): boolean {
  if (BACK_OFFICE_EXCEPTIONS.has(pathname)) return false;
  return BACK_OFFICE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function hasTransparentHeader(pathname: string): boolean {
  if (isBackOfficeRoute(pathname)) return false;

  return (
    TRANSPARENT_HEADER_ROUTES.has(pathname) ||
    TRANSPARENT_HEADER_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export function needsHeaderSpacing(pathname: string): boolean {
  return !hasTransparentHeader(pathname);
}
