export const TRANSPARENT_HEADER_ROUTES = new Set<string>([
  "/",
  "/properties",
  "/quiz",
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

export function isBackOfficeRoute(pathname: string): boolean {
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
