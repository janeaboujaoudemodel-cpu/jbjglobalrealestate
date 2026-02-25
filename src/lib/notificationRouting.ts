export interface NotificationRouteContext {
  type?: string | null;
  metadata?: Record<string, unknown> | null;
  actionUrl?: string | null;
  title?: string | null;
  message?: string | null;
}

const DEFAULT_ROUTE = "/my-dashboard#notifications";

const ensurePathFormat = (route: string) => {
  if (!route) return "";
  if (/^https?:\/\//i.test(route)) return route;
  return route.startsWith("/") ? route : `/${route}`;
};

export const normalizeNotificationRoute = (rawRoute?: string | null, fallback: string = DEFAULT_ROUTE): string => {
  if (!rawRoute || !rawRoute.trim()) return fallback;

  const trimmed = rawRoute.trim();
  let route = trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      route = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return trimmed;
    }
  }

  route = ensurePathFormat(route);

  if (route === "/admin/hr" || route.startsWith("/admin/hr?") || route.startsWith("/admin/hr#")) {
    route = route.replace("/admin/hr", "/hr-dashboard");
  }

  return route || fallback;
};

export const resolveNotificationRoute = ({
  type,
  metadata,
  actionUrl,
  title,
  message,
}: NotificationRouteContext): string => {
  const meta = metadata && typeof metadata === "object" ? metadata : {};

  const metadataActionUrl = typeof meta.action_url === "string" ? meta.action_url : null;
  const explicitAction = normalizeNotificationRoute(actionUrl || metadataActionUrl, "");
  if (explicitAction) return explicitAction;

  const notifType = (type || "").toLowerCase();
  const category = typeof meta.category === "string" ? meta.category.toLowerCase() : "";
  const status = typeof meta.status === "string" ? meta.status.toLowerCase() : "";
  const stage = typeof meta.stage === "string" ? meta.stage.toLowerCase() : "";
  const combinedText = `${title || ""} ${message || ""}`.toLowerCase();

  if (notifType === "support_ticket") return "/my-tickets";
  if (notifType === "listing" || notifType === "property_listing") return "/listing-portal/my-listings";

  if (notifType === "cv_application" || notifType === "career" || category === "cv") {
    const shouldOpenHrReview =
      status === "pending_review" ||
      stage === "received" ||
      stage === "under_review" ||
      combinedText.includes("review in the cv center") ||
      combinedText.includes("new cv") ||
      combinedText.includes("stage 1") ||
      combinedText.includes("stage 2");

    return shouldOpenHrReview ? "/hr-dashboard?tab=cv-center" : "/my-dashboard#notifications";
  }

  if (notifType === "partnership") return "/my-account";
  if (notifType === "message") return "/my-account";

  return DEFAULT_ROUTE;
};
