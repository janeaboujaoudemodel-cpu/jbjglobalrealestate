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
const BrokerListingNew       = lazy(() => import("@/pages/broker/BrokerListingNew"));
const SellerListing          = lazy(() => import("@/pages/SellerListing"));
const ListingPortalSubmit    = lazy(() => import("@/pages/ListingPortalSubmit"));
const BrokerAccount          = lazy(() => import("@/pages/BrokerAccount"));
const AIBrokerWorkspace      = lazy(() => import("@/pages/AIBrokerWorkspace"));
const BrokerFormRequests     = lazy(() => import("@/pages/broker/BrokerFormRequests"));
const BrokerLearning         = lazy(() => import("@/pages/broker/BrokerLearning"));
const BookReader             = lazy(() => import("@/pages/broker/BookReader"));
const BrokerDealsPage        = lazy(() => import("@/pages/broker/BrokerDealsPage"));
const BrokerDeveloperVisits  = lazy(() => import("@/pages/broker/BrokerDeveloperVisits"));
const BrokerMessages         = lazy(() => import("@/pages/broker/BrokerMessages"));
const BrokerEmailHub         = lazy(() => import("@/pages/broker/BrokerEmailHub"));
const BrokerEmailSetup       = lazy(() => import("@/pages/broker/BrokerEmailSetup"));
const BrokerBrandProfile     = lazy(() => import("@/pages/broker/BrokerBrandProfile"));

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
    <Route path="listings/new" element={<BrokerListingNew />} />
    <Route path="listings/new/manual" element={<SellerListing />} />
    <Route path="listings/new/ai" element={<ListingPortalSubmit />} />
    <Route path="calendar" element={<BrokerCalendar />} />
    <Route path="tasks" element={<BrokerTasks />} />
    <Route path="notifications" element={<BrokerInbox />} />
    <Route path="messages" element={<BrokerMessages />} />
    <Route path="email" element={<BrokerEmailHub />} />
    <Route path="email/setup" element={<BrokerEmailSetup />} />
    <Route path="inbox" element={<Navigate to="/broker/email" replace />} />
    <Route path="connect-email" element={<Navigate to="/broker/email" replace />} />
    <Route path="connect-gmail" element={<Navigate to="/broker/email" replace />} />
    <Route path="connect-outlook" element={<Navigate to="/broker/email" replace />} />
    <Route path="email/connect" element={<Navigate to="/broker/email" replace />} />
    <Route path="email/connect/:provider" element={<Navigate to="/broker/email" replace />} />
    <Route path="email/outlook" element={<Navigate to="/broker/email" replace />} />
    <Route path="email/gmail" element={<Navigate to="/broker/email" replace />} />
    <Route path="crm/databases" element={<Navigate to="/broker/crm?tab=databases" replace />} />
    <Route path="crm/leads" element={<Navigate to="/broker/crm?tab=leads" replace />} />
    <Route path="crm/calendar" element={<Navigate to="/broker/crm?tab=calendar" replace />} />
    <Route path="crm/tasks" element={<Navigate to="/broker/crm?tab=tasks" replace />} />
    <Route path="crm/notes" element={<Navigate to="/broker/crm?tab=notes" replace />} />
    <Route path="crm/inbox" element={<Navigate to="/broker/crm?tab=inbox" replace />} />
    <Route path="crm/settings" element={<Navigate to="/broker/settings" replace />} />
    <Route path="crm/projects" element={<Navigate to="/broker/crm?tab=databases" replace />} />
    <Route path="settings" element={<BrokerAccount />} />
    <Route path="brand" element={<BrokerBrandProfile />} />
    <Route path="ai" element={<AIBrokerWorkspace />} />

    <Route path="deals" element={<BrokerDealsPage variant="deals" />} />
    <Route path="developer-visits" element={<BrokerDeveloperVisits />} />
    <Route path="commissions" element={<Navigate to="/broker/deals" replace />} />
    <Route path="forms" element={<OwnerOnlyRoute><BrokerFormRequests /></OwnerOnlyRoute>} />
    <Route path="learning" element={<BrokerLearning />} />
    <Route path="learning/book/:bookId" element={<BookReader />} />
    {/* /broker/academy retired — use /jbj-academy */}
    {/* Marketing Toolkit removed from broker portal per owner directive — no front-end redirects from inside the portal. */}
    <Route path="marketing" element={<Navigate to="/broker/portal" replace />} />

  </Route>
);
