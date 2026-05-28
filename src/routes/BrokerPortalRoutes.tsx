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

const BrokerDashboardLanding = lazy(() => import("@/pages/broker/BrokerDashboardLanding"));
const BrokerCRM              = lazy(() => import("@/pages/broker/BrokerCRM"));
const BrokerDatabaseView     = lazy(() => import("@/pages/broker/BrokerDatabaseView"));
const BrokerDatabasesList    = lazy(() => import("@/pages/broker/BrokerDatabasesList"));
const BrokerLeadsPage        = lazy(() => import("@/pages/broker/BrokerLeadsPage"));
const BrokerCalendar         = lazy(() => import("@/pages/broker/BrokerCalendar"));
const BrokerTasks            = lazy(() => import("@/pages/broker/BrokerTasks"));
const BrokerInbox            = lazy(() => import("@/pages/broker/BrokerInbox"));
const BrokerProjectsRedirect = lazy(() => import("@/pages/broker/BrokerProjectsRedirect"));
const BrokerAccount          = lazy(() => import("@/pages/BrokerAccount"));
const AIBrokerWorkspace      = lazy(() => import("@/pages/AIBrokerWorkspace"));
const BrokerComingSoonSection= lazy(() => import("@/pages/broker/BrokerComingSoonSection"));

const Wrap = (
  <AuthRequiredRoute>
    <ModeRequiredRoute modes={["broker"]}>
      <BrokerPortalLayout />
    </ModeRequiredRoute>
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
    <Route path="listings" element={<BrokerProjectsRedirect />} />
    <Route path="calendar" element={<BrokerCalendar />} />
    <Route path="tasks" element={<BrokerTasks />} />
    <Route path="notifications" element={<BrokerInbox />} />
    <Route path="settings" element={<BrokerAccount />} />
    <Route path="ai" element={<AIBrokerWorkspace />} />

    <Route
      path="deals"
      element={
        <BrokerComingSoonSection
          title="Deals"
          description="Track every deal from offer to commission. Pipeline view coming to your portal shell — meanwhile, manage deal-stage leads in CRM."
          cta={{ to: "/broker/crm", label: "Open CRM Pipeline" }}
        />
      }
    />
    <Route
      path="commissions"
      element={
        <BrokerComingSoonSection
          title="Commissions"
          description="Your commission pipeline and payout history will surface here once the first closed deal lands in your account."
        />
      }
    />
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
    <Route
      path="forms"
      element={
        <BrokerComingSoonSection
          title="Forms & Agreements"
          description="JBJ RERA forms (Form A/B/F/I/U) and partner agreements."
          cta={{ to: "/contract-forms", label: "Open Forms Hub" }}
        />
      }
    />
    <Route
      path="academy"
      element={<Navigate to="/broker/learning?tab=training" replace />}
    />
    <Route
      path="marketing"
      element={
        <BrokerComingSoonSection
          title="Marketing Toolkit"
          description="Branded stamps, logos, e-signature kits and outreach templates."
          cta={{ to: "/broker-toolkit", label: "Open Royal Tools" }}
        />
      }
    />
  </Route>
);
