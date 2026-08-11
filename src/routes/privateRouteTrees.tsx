/**
 * PERF: every back-office route declaration used to live in the entry chunk
 * (`app.js`). Owner / Admin / Toolkit / Developer-Hub trees alone were ~120 kB
 * of the 823 kB entry, parsed by every anonymous visitor on the homepage.
 *
 * These two exports are dynamically imported (see `usePrivateRouteTrees`) the
 * first time the URL points at a private prefix. Route PATHS and nesting are
 * byte-identical to before — only the module boundary changed — so no route
 * semantics, guard, or shell behaviour is altered.
 */
import { Route, Outlet } from "react-router-dom";
import { Suspense } from "react";
import PageLoader from "@/components/PageLoader";
import { OwnerRoutes } from "@/routes/OwnerRoutes";
import { AdminRoutes } from "@/routes/AdminRoutes";
import { ToolkitRoutes } from "@/routes/ToolkitRoutes";
import { DeveloperHubRoutes } from "@/routes/DeveloperHubRoutes";
import { DevelopersPortalRoutes } from "@/routes/DevelopersPortalRoutes";

/** Rendered at the top level of <Routes> (own shells, no header/footer). */
export const PrivateShellRoutes = () => (
  <>
    <Route element={<Suspense fallback={<PageLoader />}><Outlet /></Suspense>}>
      {OwnerRoutes()}
    </Route>
    {DevelopersPortalRoutes()}
    {DeveloperHubRoutes()}
  </>
);

/** Rendered inside the MainLayout shell (header + footer). */
export const PrivateMainRoutes = () => (
  <>
    {AdminRoutes()}
    {ToolkitRoutes()}
  </>
);
