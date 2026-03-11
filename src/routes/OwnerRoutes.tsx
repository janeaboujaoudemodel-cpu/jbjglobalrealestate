/**
 * Owner Command Center routes — dedicated shell with sidebar
 */
import React, { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import OwnerGuard from "@/components/OwnerGuard";
import ListingAdminGuard from "@/components/ListingAdminGuard";
import PageLoader from "@/components/PageLoader";

const OwnerDashboardShell = lazy(() => import("@/pages/OwnerDashboardShell"));
const OwnerDashboardOverview = lazy(() => import("@/pages/OwnerDashboardOverview"));
const OwnerInbox = lazy(() => import("@/pages/OwnerInbox"));
const OwnerTemplates = lazy(() => import("@/pages/OwnerTemplates"));
const OwnerCommSettings = lazy(() => import("@/pages/OwnerCommSettings"));
const OwnerAgenda = lazy(() => import("@/pages/OwnerAgenda"));
const OwnerFeatureRegistry = lazy(() => import("@/pages/OwnerFeatureRegistry"));
const OwnerAuditPage = lazy(() => import("@/pages/owner/OwnerAuditPage"));
const OwnerIntegrationsPage = lazy(() => import("@/pages/owner/OwnerIntegrationsPage"));
const OwnerSafetyPage = lazy(() => import("@/pages/owner/OwnerSafetyPage"));
const OwnerFounderSettings = lazy(() => import("@/pages/owner/OwnerFounderSettings"));
const PodcastStudio = lazy(() => import("@/pages/owner/PodcastStudio"));
const GlobalRecommendationsHub = lazy(() => import("@/pages/owner/GlobalRecommendationsHub"));
const PropertyManagement = lazy(() => import("@/pages/services/PropertyManagement"));
const Documents = lazy(() => import("@/pages/Documents"));
const CRM = lazy(() => import("@/pages/CRM"));
const CRMLeadDetail = lazy(() => import("@/pages/CRMLeadDetail"));
const CRMLeadsInbox = lazy(() => import("@/pages/CRMLeadsInbox"));
const CRMTasks = lazy(() => import("@/pages/CRMTasks"));
const CRMCalendar = lazy(() => import("@/pages/CRMCalendar"));
const CRMNotes = lazy(() => import("@/pages/CRMNotes"));
const CRMReminders = lazy(() => import("@/pages/CRMReminders"));
const CRMEmployees = lazy(() => import("@/pages/CRMEmployees"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminLeads = lazy(() => import("@/pages/AdminLeads"));
const MarketingHub = lazy(() => import("@/pages/admin/MarketingHub"));
const JBJAnalyticsDashboard = lazy(() => import("@/pages/JBJAnalyticsDashboard"));
const FoundersAssistant = lazy(() => import("@/pages/FoundersAssistant"));
const RoyalToolsHub = lazy(() => import("@/pages/toolkit/RoyalToolsHub"));
const Automations = lazy(() => import("@/pages/Automations"));
const Studio = lazy(() => import("@/pages/Studio"));
const StudioEditor = lazy(() => import("@/pages/StudioEditor"));
const StudioSettings = lazy(() => import("@/pages/StudioSettings"));
const EmailClient = lazy(() => import("@/pages/EmailClient"));
const TeamChat = lazy(() => import("@/pages/TeamChat"));
const KanbanBoard = lazy(() => import("@/pages/KanbanBoard"));
const PropertyMap = lazy(() => import("@/pages/PropertyMap"));
const ListingAdmin = lazy(() => import("@/pages/ListingAdmin"));
const ModeHub = lazy(() => import("@/pages/ModeHub"));

export const OwnerRoutes = () => (
  <Route path="/owner" element={
    <OwnerGuard>
      <OwnerDashboardShell />
    </OwnerGuard>
  }>
    <Route index element={<OwnerDashboardOverview />} />
    <Route path="inbox" element={<OwnerInbox />} />
    <Route path="templates" element={<OwnerTemplates />} />
    <Route path="settings/communication" element={<OwnerCommSettings />} />
    <Route path="agenda" element={<OwnerAgenda />} />
    <Route path="features" element={<OwnerFeatureRegistry />} />
    <Route path="audit" element={<OwnerAuditPage />} />
    <Route path="integrations" element={<OwnerIntegrationsPage />} />
    <Route path="safety" element={<OwnerSafetyPage />} />
    <Route path="founder-settings" element={<OwnerFounderSettings />} />
    <Route path="podcast-studio" element={<PodcastStudio />} />
    <Route path="properties" element={<PropertyManagement />} />
    <Route path="documents" element={<Documents />} />
    <Route path="settings" element={<OwnerCommSettings />} />
    <Route path="crm" element={<CRM />} />
    <Route path="crm/leads/:id" element={<CRMLeadDetail />} />
    <Route path="crm/leads" element={<CRMLeadsInbox />} />
    <Route path="crm/tasks" element={<CRMTasks />} />
    <Route path="crm/calendar" element={<CRMCalendar />} />
    <Route path="crm/notes" element={<CRMNotes />} />
    <Route path="crm/reminders" element={<CRMReminders />} />
    <Route path="crm/employees" element={<CRMEmployees />} />
    <Route path="admin" element={<Admin />} />
    <Route path="admin/leads" element={<AdminLeads />} />
    <Route path="marketing-hub" element={<MarketingHub />} />
    <Route path="analytics" element={<JBJAnalyticsDashboard />} />
    <Route path="research-users" element={
      <Suspense fallback={<PageLoader />}>
        {React.createElement(React.lazy(() => import("@/components/admin/ResearchUsersPanel")))}
      </Suspense>
    } />
    <Route path="founder-assistant" element={<FoundersAssistant />} />
    <Route path="recommendations" element={<GlobalRecommendationsHub />} />
    <Route path="toolkit" element={<RoyalToolsHub />} />
    <Route path="automations" element={<Automations />} />
    <Route path="studio" element={<Studio />} />
    <Route path="studio/editor/:projectId" element={<StudioEditor />} />
    <Route path="studio/settings" element={<StudioSettings />} />
    <Route path="email-client" element={<EmailClient />} />
    <Route path="team-chat" element={<TeamChat />} />
    <Route path="kanban" element={<KanbanBoard />} />
    <Route path="map" element={<PropertyMap />} />
    <Route path="listing-admin" element={<ListingAdminGuard><ListingAdmin /></ListingAdminGuard>} />
    <Route path="mode-hub" element={<ModeHub />} />
  </Route>
);
