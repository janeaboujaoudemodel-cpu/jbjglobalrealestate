/**
 * Broker Portal nested routes.
 * Single canonical shell at /broker/* — wraps every broker surface in
 * BrokerPortalLayout (sidebar + outlet). Mounted from PublicRoutes so the
 * MainLayoutWrapper (global header + footer) stays around it.
 */
import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import AuthRequiredRoute from "@/components/AuthRequiredRoute";
import ModeRequiredRoute from "@/components/ModeRequiredRoute";
import BrokerPortalLayout from "@/components/broker-portal/BrokerPortalLayout";
import OwnerRedirectGuard from "@/components/broker-portal/OwnerRedirectGuard";
import OwnerOnlyRoute from "@/components/broker-portal/OwnerOnlyRoute";

const BrokerDashboardLanding = lazy(() => import("@/pages/broker/BrokerDashboardLanding"));
const BrokerCRM              = lazy(() => import("@/pages/broker/BrokerCRM"));
const BrokerDatabaseView     = lazy(() => import("@/pages/broker/BrokerDatabaseView"));
const BrokerDatabasesList    = lazy(() => import("@/pages/broker/BrokerDatabasesList"));
const BrokerLeadsPage        = lazy(() => import("@/pages/broker/BrokerLeadsPage"));
const BrokerCalendar         = lazy(() => import("@/pages/broker/BrokerCalendar"));
const BrokerTasks            = lazy(() => import("@/pages/broker/BrokerTasks"));
const BrokerInbox            = lazy(() => import("@/pages/broker/BrokerInbox"));
const ListingPortalMyListings= lazy(() => import("@/pages/ListingPortalMyListings"));
const BrokerAccount          = lazy(() => import("@/pages/BrokerAccount"));
const AIBrokerWorkspace      = lazy(() => import("@/pages/AIBrokerWorkspace"));
const BrokerComingSoonSection= lazy(() => import("@/pages/broker/BrokerComingSoonSection"));
const BrokerFormRequests     = lazy(() => import("@/pages/broker/BrokerFormRequests"));
const BrokerLearning         = lazy(() => import("@/pages/broker/BrokerLearning"));
const BookReader             = lazy(() => import("@/pages/broker/BookReader"));
const BrokerDealsPage        = lazy(() => import("@/pages/broker/BrokerDealsPage"));

const Wrap = (
  <AuthRequiredRoute>
    <OwnerRedirectGuard>
      <ModeRequiredRoute modes={["broker"]}>
        <BrokerPortalLayout />
      </ModeRequiredRoute>
    </OwnerRedirectGuard>
  </AuthRequiredRoute>
);

export const BrokerPortalRoutes = () => (
  <Route path="/broker" element={Wrap}>
    <Route index element={<Navigate to="/broker/portal" replace />} />
    <Route path="portal" element={<BrokerDashboardLanding />} />
    <Route path="workspace" element={<Navigate to="/broker/portal" replace />} />
    <Route path="dashboard" element={<Navigate to="/broker/portal" replace />} />

    <Route path="leads" element={<BrokerLeadsPage />} />
    <Route path="crm" element={<BrokerCRM />} />
    <Route path="crm/database/:id" element={<BrokerDatabaseView />} />
    <Route path="databases" element={<BrokerDatabasesList />} />
    <Route path="listings" element={<ListingPortalMyListings />} />
    <Route path="calendar" element={<BrokerCalendar />} />
    <Route path="tasks" element={<BrokerTasks />} />
    <Route path="notifications" element={<BrokerInbox />} />
    <Route path="settings" element={<BrokerAccount />} />
    <Route path="ai" element={<AIBrokerWorkspace />} />

    <Route path="deals" element={<BrokerDealsPage variant="deals" />} />
    <Route path="commissions" element={<BrokerDealsPage variant="commissions" />} />
    <Route
      path="documents"
      element={
        <BrokerComingSoonSection
          title="Documents"
          description="Open the Document Studio to draft, sign and manage your client documents."
          cta={{ to: "/document-studio", label: "Open Document Studio" }}
        />
      }
    />
    <Route path="forms" element={<OwnerOnlyRoute><BrokerFormRequests /></OwnerOnlyRoute>} />
    <Route path="learning" element={<BrokerLearning />} />
    <Route path="learning/book/:bookId" element={<BookReader />} />
    <Route path="academy" element={<Navigate to="/broker/learning?tab=training" replace />} />
    {/* Marketing Toolkit removed from broker portal per owner directive — no front-end redirects from inside the portal. */}
    <Route path="marketing" element={<Navigate to="/broker/portal" replace />} />

  </Route>
);
