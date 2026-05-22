/**
 * Developer Hub routes — premium champagne shell with full project lifecycle
 */
import React, { lazy, Suspense } from "react";
import { Route, Navigate } from "react-router-dom";
import AuthRequiredRoute from "@/components/AuthRequiredRoute";
import PageLoader from "@/components/PageLoader";

const DeveloperHubShell = lazy(() => import("@/pages/developer-hub/DeveloperHubShell"));
const DeveloperHubOverview = lazy(() => import("@/pages/developer-hub/DeveloperHubOverview"));
const DeveloperCompanyRegistration = lazy(() => import("@/pages/developer-hub/DeveloperCompanyRegistration"));
const DeveloperLaunchEvents = lazy(() => import("@/pages/developer-hub/DeveloperLaunchEvents"));
const DeveloperCRM = lazy(() => import("@/pages/developer-hub/DeveloperCRM"));
const DeveloperReports = lazy(() => import("@/pages/developer-hub/DeveloperReports"));
const DeveloperLiveEditor = lazy(() => import("@/pages/developer-hub/DeveloperLiveEditor"));
const DeveloperProjectWizard = lazy(() => import("@/pages/developer-hub/DeveloperProjectWizard"));

export const DeveloperHubRoutes = () => (
  <Route
    path="/developer-hub"
    element={
      <AuthRequiredRoute>
        <Suspense fallback={<PageLoader />}>
          <DeveloperHubShell />
        </Suspense>
      </AuthRequiredRoute>
    }
  >
    <Route index element={<DeveloperHubOverview />} />
    <Route path="company-registration" element={<DeveloperCompanyRegistration />} />
    <Route path="projects" element={<DeveloperLiveEditor />} />
    <Route path="new-project" element={<DeveloperProjectWizard />} />
    <Route path="marketing-materials" element={<Navigate to="/developer-portal?tab=marketing" replace />} />
    <Route path="events" element={<DeveloperLaunchEvents />} />
    <Route path="agreements" element={<Navigate to="/e-signature" replace />} />
    <Route path="tasks" element={<Navigate to="/developer-portal?tab=tasks" replace />} />
    <Route path="crm" element={<DeveloperCRM />} />
    <Route path="reports" element={<DeveloperReports />} />
    <Route path="activity" element={<DeveloperReports />} />
  </Route>
);
