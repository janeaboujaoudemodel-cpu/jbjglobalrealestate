/**
 * Owner Command Center routes — dedicated shell with sidebar
 */
import React, { lazy, Suspense } from "react";
import { Route, Navigate } from "react-router-dom";
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
const CRMRelationships = lazy(() => import("@/pages/CRMRelationships"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminLeads = lazy(() => import("@/pages/AdminLeads"));
const MarketingHub = lazy(() => import("@/pages/admin/MarketingHub"));
const JBJAnalyticsDashboard = lazy(() => import("@/pages/JBJAnalyticsDashboard"));
const FoundersAssistant = lazy(() => import("@/pages/FoundersAssistant"));
// RoyalToolsHub removed — /owner/toolkit now redirects to /ai-hub
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
const FoundersNotesPanel = lazy(() => import("@/components/founders-assistant/FoundersNotesPanel"));
const BrandAssetsDashboard = lazy(() => import("@/pages/owner/BrandAssetsDashboard"));
const CRMSecurityDashboard = lazy(() => import("@/pages/owner/CRMSecurityDashboard"));
const AIToolAnalyticsDashboard = lazy(() => import("@/pages/owner/AIToolAnalyticsDashboard"));
const AIToolsControlPanel = lazy(() => import("@/pages/owner/AIToolsControlPanel"));
const EncryptionAuditDashboard = lazy(() => import("@/pages/owner/EncryptionAuditDashboard"));
const GlobalAuditDashboard = lazy(() => import("@/pages/owner/GlobalAuditDashboard"));
const DeveloperModerationQueue = lazy(() => import("@/pages/owner/DeveloperModerationQueue"));
const APISecurityDashboard = lazy(() => import("@/pages/owner/APISecurityDashboard"));
const IncidentReadinessPanel = lazy(() => import("@/pages/owner/IncidentReadinessPanel"));
const ZeroTrustAuditPanel = lazy(() => import("@/pages/owner/ZeroTrustAuditPanel"));
const EventManagementHub = lazy(() => import("@/pages/owner/EventManagementHub"));
const VerificationRequests = lazy(() => import("@/pages/owner/VerificationRequests"));
const ExternalAccessManagement = lazy(() => import("@/pages/owner/ExternalAccessManagement"));
const SeoReview = lazy(() => import("@/pages/owner/SeoReview"));
const PrintCheck = lazy(() => import("@/pages/owner/PrintCheck"));
const BaselinePdfDashboard = lazy(() => import("@/pages/owner/BaselinePdfDashboard"));
const IconAuditDashboard = lazy(() => import("@/pages/owner/IconAuditDashboard"));
const IconSizePreview = lazy(() => import("@/pages/owner/IconSizePreview"));
const VatCertificate = lazy(() => import("@/pages/owner/templates/VatCertificate"));
const AdoptSignatureStudio = lazy(() => import("@/pages/owner/sign/AdoptSignatureStudio"));
const ContractVault = lazy(() => import("@/pages/owner/contracts/ContractVault"));
const OwnerRelationships = lazy(() => import("@/pages/owner/OwnerRelationships"));
const OwnerRelationshipsRevenue = lazy(() => import("@/pages/owner/OwnerRelationshipsRevenue"));
const OwnerMediaIngest = lazy(() => import("@/pages/owner/OwnerMediaIngest"));
const DocumentsFormsHub = lazy(() => import("@/pages/owner/DocumentsFormsHub"));

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
    {/* /owner/properties was incorrectly pointing at the PropertyManagement service marketing page.
        Redirect to the canonical /properties listing so the full filter set is preserved. */}
    <Route path="properties" element={<Navigate to="/properties" replace />} />
    <Route path="documents" element={<Documents />} />
    <Route path="documents/forms" element={<DocumentsFormsHub />} />
    <Route path="settings" element={<OwnerCommSettings />} />
    <Route path="crm" element={<CRM />} />
    <Route path="crm/leads/:id" element={<CRMLeadDetail />} />
    <Route path="crm/leads" element={<CRMLeadsInbox />} />
    <Route path="crm/tasks" element={<CRMTasks />} />
    <Route path="crm/calendar" element={<CRMCalendar />} />
    <Route path="crm/notes" element={<CRMNotes />} />
    <Route path="crm/reminders" element={<CRMReminders />} />
    <Route path="crm/employees" element={<CRMEmployees />} />
    <Route path="crm/relationships" element={<CRMRelationships />} />
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
    <Route path="uae-registry" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/owner/uae-registry/UAERegistryOverview")))}</Suspense>} />
    <Route path="uae-registry/developers" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/owner/uae-registry/UAERegistryListPage").then(m => ({ default: () => <m.default type="developer" /> }))))}</Suspense>} />
    <Route path="uae-registry/developers/:id" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/owner/uae-registry/UAERegistryDetailPage").then(m => ({ default: () => <m.default type="developer" /> }))))}</Suspense>} />
    <Route path="uae-registry/brokerages" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/owner/uae-registry/UAERegistryListPage").then(m => ({ default: () => <m.default type="brokerage" /> }))))}</Suspense>} />
    <Route path="uae-registry/brokerages/:id" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/owner/uae-registry/UAERegistryDetailPage").then(m => ({ default: () => <m.default type="brokerage" /> }))))}</Suspense>} />
    <Route path="toolkit" element={<Navigate to="/ai-hub" replace />} />
    <Route path="ai-tools-control" element={<AIToolsControlPanel />} />
    <Route path="automations" element={<Automations />} />
    <Route path="studio" element={<Studio />} />
    <Route path="studio/editor/:projectId" element={<StudioEditor />} />
    <Route path="studio/settings" element={<StudioSettings />} />
    <Route path="email-client" element={<EmailClient />} />
    <Route path="team-chat" element={<TeamChat />} />
    <Route path="kanban" element={<KanbanBoard />} />
    <Route path="map" element={<PropertyMap />} />
    <Route path="listing-admin" element={<ListingAdminGuard><ListingAdmin /></ListingAdminGuard>} />
    <Route path="listing-admin/preview/:id" element={<ListingAdminGuard><Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/listing-admin/PendingImportPreview")))}</Suspense></ListingAdminGuard>} />
    <Route path="mode-hub" element={<ModeHub />} />
    <Route path="notes" element={<FoundersNotesPanel />} />
    <Route path="brand-assets" element={<BrandAssetsDashboard />} />
    <Route path="crm-security" element={<CRMSecurityDashboard />} />
    <Route path="ai-tools-analytics" element={<AIToolAnalyticsDashboard />} />
    <Route path="encryption-audit" element={<EncryptionAuditDashboard />} />
    <Route path="global-audit" element={<GlobalAuditDashboard />} />
    <Route path="developer-moderation" element={<DeveloperModerationQueue />} />
    <Route path="api-security" element={<APISecurityDashboard />} />
    <Route path="incident-readiness" element={<IncidentReadinessPanel />} />
    <Route path="zero-trust-audit" element={<ZeroTrustAuditPanel />} />
    <Route path="event-management" element={<EventManagementHub />} />
    <Route path="verification-requests" element={<VerificationRequests />} />
    <Route path="external-access" element={<ExternalAccessManagement />} />
    <Route path="seo-review" element={<SeoReview />} />
    <Route path="print-check" element={<PrintCheck />} />
    <Route path="baseline-pdf" element={<BaselinePdfDashboard />} />
    <Route path="icon-audit" element={<IconAuditDashboard />} />
    <Route path="icon-size-preview" element={<IconSizePreview />} />
    <Route path="templates/vat" element={<VatCertificate />} />
    <Route path="sign" element={<AdoptSignatureStudio />} />
    <Route path="sign/:envelopeId" element={<AdoptSignatureStudio />} />
    <Route path="contracts" element={<ContractVault />} />
    <Route path="relationships" element={<OwnerRelationships />} />
    <Route path="relationships/revenue" element={<OwnerRelationshipsRevenue />} />
    <Route path="media-ingest" element={<OwnerMediaIngest />} />
    <Route path="crm/relationships/activity" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/owner/crm/AgencyActivityLog")))}</Suspense>} />
    <Route path="crm/brokerage-actions" element={<Navigate to="/owner/crm/relationships/activity" replace />} />
    <Route path="crm/brokers" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/owner/crm/BrokersRegistry")))}</Suspense>} />
  </Route>
);
