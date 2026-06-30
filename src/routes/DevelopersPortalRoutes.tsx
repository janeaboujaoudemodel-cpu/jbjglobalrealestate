/**
 * Developers Portal routes — standalone shell that replaces both
 * /developer-hub (developer self-service) and /developer-hub-admin (owner console).
 *
 * Mount path: /developers-portal/*
 * Public sub-route: /developers-portal/reps/apply (no auth)
 */
import { lazy, Suspense } from "react";
import { Route, Navigate, useLocation } from "react-router-dom";
import PageLoader from "@/components/PageLoader";
import PortalGuard from "@/components/developers-portal/PortalGuard";
import { usePortalRole } from "@/hooks/usePortalRole";

const PortalShell = lazy(() => import("@/pages/developers-portal/PortalShell"));
const PortalOverview = lazy(() => import("@/pages/developers-portal/PortalOverview"));
const RepDirectory = lazy(() => import("@/pages/developers-portal/reps/RepDirectory"));
const RepByEmirate = lazy(() => import("@/pages/developers-portal/reps/RepByEmirate"));
const RepProfileEditor = lazy(() => import("@/pages/developers-portal/reps/RepProfileEditor"));
const RepApplicationPublic = lazy(() => import("@/pages/developers-portal/reps/RepApplicationPublic"));
const AccessRequestQueue = lazy(() => import("@/pages/developers-portal/access/AccessRequestQueue"));

// Reuse existing owner-hub pages inside the new shell — no duplication.
const DeveloperDirectory = lazy(() => import("@/pages/developer-hub-admin/DeveloperDirectory"));
const DeveloperEnrichmentQueue = lazy(() => import("@/pages/developer-hub-admin/DeveloperEnrichmentQueue"));
const MissingLogosQueue = lazy(() => import("@/pages/admin/MissingLogosQueue"));
const DeveloperProfilePage = lazy(() => import("@/pages/admin/DeveloperProfilePage"));
const DeveloperHubAdminPlaceholder = lazy(() => import("@/pages/developer-hub-admin/DeveloperHubAdminPlaceholder"));
const DeveloperLaunchEvents = lazy(() => import("@/pages/developer-hub/DeveloperLaunchEvents"));
const DeveloperLiveEditor = lazy(() => import("@/pages/developer-hub/DeveloperLiveEditor"));
const DeveloperProjectWizard = lazy(() => import("@/pages/developer-hub/DeveloperProjectWizard"));
const DeveloperCompanyRegistration = lazy(() => import("@/pages/developer-hub/DeveloperCompanyRegistration"));

const Self = () => (
  <Suspense fallback={<PageLoader />}>
    <RepProfileEditor selfMode />
  </Suspense>
);

const ownerDestinationFor = (pathname: string) => {
  if (pathname === "/developers-portal" || pathname === "/developers-portal/") return "/owner/developers";
  if (pathname.startsWith("/developers-portal/directory")) return "/owner/developers";
  if (pathname.startsWith("/developers-portal/developers/")) {
    return pathname.replace("/developers-portal/developers/", "/owner/developers/");
  }
  if (pathname.startsWith("/developers-portal/enrichment")) return "/owner/developers/profile-rebuild";
  if (pathname.startsWith("/developers-portal/missing-logos")) return "/owner/developers/missing-logos";
  if (pathname.startsWith("/developers-portal/reps/by-emirate")) return "/owner/developers/reps/by-emirate";
  if (pathname.startsWith("/developers-portal/reps")) return pathname.replace("/developers-portal/reps", "/owner/developers/reps");
  if (pathname.startsWith("/developers-portal/projects")) return "/owner/developers/projects";
  if (pathname.startsWith("/developers-portal/calendar")) return "/owner/developers/calendar";
  if (pathname.startsWith("/developers-portal/access-requests")) return "/owner/developers/access-requests";
  return "/owner/developers";
};

const PortalEntry = () => {
  const { role, isLoading } = usePortalRole();
  const location = useLocation();
  if (isLoading) return <PageLoader />;
  if (role === "owner") {
    return <Navigate to={ownerDestinationFor(location.pathname)} replace />;
  }
  return <PortalShell />;
};

export const DevelopersPortalRoutes = () => (
  <>
    {/* Public — no guard */}
    <Route path="/developers-portal/reps/apply" element={
      <Suspense fallback={<PageLoader />}><RepApplicationPublic /></Suspense>
    } />

    {/* Portal shell — role-gated */}
    <Route
      path="/developers-portal"
      element={
        <PortalGuard>
          <Suspense fallback={<PageLoader />}><PortalEntry /></Suspense>
        </PortalGuard>
      }
    >
      <Route index element={<Suspense fallback={<PageLoader />}><PortalOverview /></Suspense>} />
      <Route path="directory" element={<Suspense fallback={<PageLoader />}><DeveloperDirectory /></Suspense>} />
      <Route path="developers/:slug" element={<Suspense fallback={<PageLoader />}><DeveloperProfilePage /></Suspense>} />
      <Route path="company-registration" element={<Suspense fallback={<PageLoader />}><DeveloperCompanyRegistration /></Suspense>} />

      <Route path="reps" element={<Suspense fallback={<PageLoader />}><RepDirectory /></Suspense>} />
      <Route path="reps/by-emirate" element={<Suspense fallback={<PageLoader />}><RepByEmirate /></Suspense>} />
      <Route path="reps/me" element={<Self />} />
      <Route path="reps/:id" element={<Suspense fallback={<PageLoader />}><RepProfileEditor /></Suspense>} />

      <Route path="projects" element={<Suspense fallback={<PageLoader />}><DeveloperLiveEditor /></Suspense>} />
      <Route path="new-project" element={<Suspense fallback={<PageLoader />}><DeveloperProjectWizard /></Suspense>} />
      <Route path="briefings" element={<Suspense fallback={<PageLoader />}><DeveloperHubAdminPlaceholder title="Briefings Inbox" body="Briefings hub lands here next iteration." /></Suspense>} />
      <Route path="deals" element={<Suspense fallback={<PageLoader />}><DeveloperHubAdminPlaceholder title="Deals Pipeline" body="Deal-close pipeline UI lands here next iteration." /></Suspense>} />
      <Route path="calendar" element={<Suspense fallback={<PageLoader />}><DeveloperLaunchEvents /></Suspense>} />
      <Route path="access-requests" element={<Suspense fallback={<PageLoader />}><AccessRequestQueue /></Suspense>} />
      <Route path="enrichment" element={<Suspense fallback={<PageLoader />}><DeveloperEnrichmentQueue /></Suspense>} />
      <Route path="missing-logos" element={<Suspense fallback={<PageLoader />}><MissingLogosQueue /></Suspense>} />
      <Route path="settings" element={<Suspense fallback={<PageLoader />}><DeveloperHubAdminPlaceholder title="Settings" body="Portal-only settings — coming next iteration." /></Suspense>} />
    </Route>

    {/* Redirects: old hub URLs → new portal */}
    <Route path="/developer-hub" element={<Navigate to="/developers-portal" replace />} />
    <Route path="/developer-hub/*" element={<Navigate to="/developers-portal" replace />} />
    <Route path="/developer-hub-admin" element={<Navigate to="/owner/developers" replace />} />
    <Route path="/developer-hub-admin/directory" element={<Navigate to="/owner/developers" replace />} />
    <Route path="/developer-hub-admin/missing-logos" element={<Navigate to="/owner/developers/missing-logos" replace />} />
    <Route path="/developer-hub-admin/enrichment" element={<Navigate to="/owner/developers/profile-rebuild" replace />} />
    <Route path="/developer-hub-admin/briefings" element={<Navigate to="/owner/developers/briefings" replace />} />
    <Route path="/developer-hub-admin/calendar" element={<Navigate to="/owner/developers/calendar" replace />} />
    <Route path="/developer-hub-admin/projects" element={<Navigate to="/owner/developers/projects" replace />} />
    <Route path="/developer-hub-admin/profile/:slug" element={<Navigate to="/owner/developers" replace />} />
    <Route path="/developer-hub-admin/*" element={<Navigate to="/owner/developers" replace />} />
  </>
);
