import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

type Trees = typeof import("@/routes/privateRouteTrees");

/**
 * Top-level URL segments owned by back-office / portal route trees.
 * Derived mechanically from the `path="/…"` values in OwnerRoutes,
 * AdminRoutes, ToolkitRoutes, DeveloperHubRoutes and DevelopersPortalRoutes.
 */
export const PRIVATE_ROUTE_SEGMENTS = new Set([
  "owner",
  "admin",
  "admin-inquiries",
  "admin-onboarding",
  "alerts-demo",
  "automations",
  "brand-palette",
  "broker-admin-assistant",
  "business-card-scanner",
  "business-suite",
  "call-review",
  "careers-portal",
  "company-comm",
  "crm",
  "customer-happiness",
  "design-studio",
  "dev-hub",
  "developer-hub",
  "developer-hub-admin",
  "developers-portal",
  "e-signature",
  "email-client",
  "email-preferences",
  "employee-chat",
  "employee-hub",
  "employee-management",
  "employee-management-hub",
  "executive-assistant",
  "form-builder",
  "founder-assistant",
  "founders-assistant",
  "governance",
  "hr-agent",
  "hr-dashboard",
  "hr-hub",
  "internal",
  "it-department",
  "jbj-analytics",
  "jbj-broker-admin",
  "jbj-broker-dashboard",
  "jbj-broker-messages",
  "jbj-broker-reports",
  "jbj-design-studio",
  "job-offer-template",
  "kanban",
  "listing-admin",
  "mindmap",
  "referral-admin",
  "royal-tools",
  "security-console",
  "studio",
  "suites",
  "team-chat",
  "toolkit",
  "unsubscribe",
  "video-builder",
  "virtual-staging-ai",
  "whiteboard",
]);

export const privateSegmentOf = (pathname: string): string | null => {
  const seg = pathname.split("?")[0].split("/").filter(Boolean)[0];
  return seg && PRIVATE_ROUTE_SEGMENTS.has(seg) ? seg : null;
};

let cached: Trees | null = null;
let inflight: Promise<Trees> | null = null;

/**
 * Loads the back-office route trees on demand. Public marketing pages never
 * download or parse them, which is the whole point: the entry chunk stays small
 * and first paint has less script to execute.
 */
export function usePrivateRouteTrees(): { segment: string | null; trees: Trees | null } {
  const { pathname } = useLocation();
  const segment = privateSegmentOf(pathname);
  const [trees, setTrees] = useState<Trees | null>(cached);

  useEffect(() => {
    if (!segment || cached) {
      if (cached && !trees) setTrees(cached);
      return;
    }
    let alive = true;
    inflight = inflight ?? import("@/routes/privateRouteTrees");
    inflight.then((mod) => {
      cached = mod;
      if (alive) setTrees(mod);
    });
    return () => {
      alive = false;
    };
  }, [segment, trees]);

  return { segment, trees };
}

export default usePrivateRouteTrees;
