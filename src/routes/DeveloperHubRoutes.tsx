/**
 * Developer Hub routes — dedicated shell with sidebar
 * Auth-required: all routes require login
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
    <Route path="projects" element={<Navigate to="/developer-portal?tab=projects" replace />} />
    <Route path="marketing-materials" element={<Navigate to="/developer-portal?tab=marketing" replace />} />
    <Route path="events" element={<DeveloperLaunchEvents />} />
    <Route path="agreements" element={<Navigate to="/e-signature" replace />} />
    <Route path="tasks" element={<Navigate to="/developer-portal?tab=tasks" replace />} />
    <Route path="crm" element={<DeveloperCRM />} />
    <Route path="reports" element={<DeveloperReports />} />
  </Route>
);
