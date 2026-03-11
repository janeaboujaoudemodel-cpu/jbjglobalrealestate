/**
 * Standalone routes — no header/footer shell
 * Auth, digital card, public signing, ticket survey
 */
import React, { lazy, Suspense } from "react";
import { Route, Navigate } from "react-router-dom";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import PageLoader from "@/components/PageLoader";

const Auth = lazy(() => import("@/pages/Auth"));
const Welcome = lazy(() => import("@/pages/Welcome"));
const AccessDenied = lazy(() => import("@/pages/AccessDenied"));
const DigitalCard = lazy(() => import("@/pages/DigitalCard"));
const SignDocument = lazy(() => import("@/pages/e-signature/SignDocument"));

export const StandaloneRoutes = () => (
  <>
    <Route path="/auth" element={<RouteErrorBoundary routeName="Auth"><Auth /></RouteErrorBoundary>} />
    <Route path="/403" element={<AccessDenied />} />
    <Route path="/card" element={<DigitalCard />} />
    <Route path="/card/:token" element={
      <Suspense fallback={<PageLoader />}>
        {React.createElement(React.lazy(() => import("@/pages/SharedBusinessCard")))}
      </Suspense>
    } />
    <Route path="/ticket-survey" element={
      <Suspense fallback={<PageLoader />}>
        {React.createElement(React.lazy(() => import("@/pages/TicketSurvey")))}
      </Suspense>
    } />
    <Route path="/survey" element={<Navigate to="/ticket-survey" replace />} />
    <Route path="/sign/:token" element={
      <Suspense fallback={<PageLoader />}>
        <SignDocument />
      </Suspense>
    } />
  </>
);
