/**
 * Standalone routes — no header/footer shell
 * Auth, digital card, public signing, ticket survey
 */
import React, { lazy, Suspense } from "react";
import { Route, Navigate } from "react-router-dom";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import PageLoader from "@/components/PageLoader";

/** Branded fallback shown immediately while the SignDocument chunk loads —
 *  prevents the "white blank page" between clicking the email link and the
 *  signing UI mounting its own internal loader. */
function SigningPageFallback() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#F7F2EA] border border-[#B89555]/30 rounded-md p-8 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#B89555]/30 border-t-[#B89555] animate-spin mx-auto mb-5" />
        <div className="text-[11px] tracking-[0.22em] uppercase text-[#1A1A1A]/60 mb-2">
          JBJ Global Real Estate
        </div>
        <div className="text-[15px] font-semibold text-[#1A1A1A]">Loading your document…</div>
        <div className="text-xs text-[#1A1A1A]/60 mt-2">
          Verifying your secure signing link.
        </div>
      </div>
    </div>
  );
}

const Auth = lazy(() => import("@/pages/Auth"));
const Welcome = lazy(() => import("@/pages/Welcome"));
const AccessDenied = lazy(() => import("@/pages/AccessDenied"));
const DigitalCard = lazy(() => import("@/pages/DigitalCard"));
const ComingSoon = lazy(() => import("@/pages/ComingSoon"));
const SignDocument = lazy(() => import("@/pages/e-signature/SignDocument"));
const PublicSignDocument = lazy(() => import("@/pages/PublicSignDocument"));
const FooterPreviewPage = lazy(() => import("@/pages/dev/FooterPreviewPage"));
const BookMeetingLanding = lazy(() => import("@/pages/BookMeetingLanding"));
const DownloadProxy = lazy(() => import("@/pages/DownloadProxy"));
const BrokerActivate = lazy(() => import("@/pages/BrokerActivate"));
const BrokerCRM = lazy(() => import("@/pages/broker/BrokerCRM"));
const BrokerDatabaseView = lazy(() => import("@/pages/broker/BrokerDatabaseView"));
const BrokerAgreementSign = lazy(() => import("@/pages/broker/BrokerAgreementSign"));
const BrokerGuard = lazy(() => import("@/components/BrokerGuard"));
const OAuthConsent = lazy(() => import("@/pages/OAuthConsent"));
const PublicAccess = lazy(() => import("@/pages/PublicAccess"));

export const StandaloneRoutes = () => (
  <>
    <Route path="/access" element={<RouteErrorBoundary routeName="PublicAccess"><PublicAccess /></RouteErrorBoundary>} />
    <Route path="/auth" element={<RouteErrorBoundary routeName="Auth"><Auth /></RouteErrorBoundary>} />

    <Route path="/.lovable/oauth/consent" element={
      <RouteErrorBoundary routeName="OAuthConsent">
        <Suspense fallback={<PageLoader />}>
          <OAuthConsent />
        </Suspense>
      </RouteErrorBoundary>
    } />
    <Route path="/broker/activate" element={<RouteErrorBoundary routeName="BrokerActivate"><BrokerActivate /></RouteErrorBoundary>} />
    {/* /broker/crm and /broker/crm/database/:id moved into the nested
        Broker Portal shell — see src/routes/BrokerPortalRoutes.tsx. */}
    <Route path="/broker/agreement/:id" element={
      <RouteErrorBoundary routeName="BrokerAgreementSign">
        <Suspense fallback={<PageLoader />}>
          <BrokerGuard><BrokerAgreementSign /></BrokerGuard>
        </Suspense>
      </RouteErrorBoundary>
    } />
    <Route path="/welcome" element={<RouteErrorBoundary routeName="Welcome"><Welcome /></RouteErrorBoundary>} />
    <Route path="/403" element={<AccessDenied />} />
    <Route path="/coming-soon" element={<RouteErrorBoundary routeName="ComingSoon"><ComingSoon /></RouteErrorBoundary>} />
    <Route path="/maintenance" element={<RouteErrorBoundary routeName="Maintenance"><ComingSoon /></RouteErrorBoundary>} />
    <Route path="/card" element={<DigitalCard />} />
    <Route path="/book" element={
      <RouteErrorBoundary routeName="BookMeeting">
        <Suspense fallback={<PageLoader />}>
          <BookMeetingLanding />
        </Suspense>
      </RouteErrorBoundary>
    } />
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
    <Route path="/external-access" element={<Navigate to="/owner/external-access" replace />} />
    <Route path="/sign/:token" element={
      <Suspense fallback={<SigningPageFallback />}>
        <SignDocument />
      </Suspense>
    } />
    <Route path="/documents/sign/:token" element={
      <Suspense fallback={<SigningPageFallback />}>
        <PublicSignDocument />
      </Suspense>
    } />
    <Route path="/d" element={
      <Suspense fallback={<PageLoader />}>
        <DownloadProxy />
      </Suspense>
    } />
    <Route path="/dev/footer-preview" element={
      <RouteErrorBoundary routeName="FooterPreview">
        <Suspense fallback={<PageLoader />}>
          <FooterPreviewPage />
        </Suspense>
      </RouteErrorBoundary>
    } />
    <Route path="/ds-preview" element={
      <RouteErrorBoundary routeName="DsPreview">
        <Suspense fallback={<PageLoader />}>
          {React.createElement(React.lazy(() => import("@/pages/DsPreview")))}
        </Suspense>
      </RouteErrorBoundary>
    } />
  </>
);
