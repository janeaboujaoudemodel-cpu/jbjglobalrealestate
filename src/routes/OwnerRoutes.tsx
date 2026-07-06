/**
 * Owner Command Center routes — dedicated shell with sidebar
 */
import React, { lazy, Suspense } from "react";
import { Route, Navigate, useParams } from "react-router-dom";
import OwnerGuard from "@/components/OwnerGuard";
import ListingAdminGuard from "@/components/ListingAdminGuard";
import PageLoader from "@/components/PageLoader";

// All owner pages lazy-loaded — owner area is heavy and must NOT bloat the public/home initial chunk.
const OwnerDashboardShell = lazy(() => import("@/pages/OwnerDashboardShell"));
const OwnerDashboardOverview = lazy(() => import("@/pages/OwnerDashboardOverview"));
const OwnerInbox = lazy(() => import("@/pages/OwnerInbox"));
const CRMRelationships = lazy(() => import("@/pages/CRMRelationships"));
const SecondaryMarketHub = lazy(() => import("@/pages/SecondaryMarketHub"));
const UnifiedCRM = lazy(() => import("@/pages/owner/crm/UnifiedCRM"));
const CrmShell = lazy(() => import("@/pages/owner/crm/shell/CrmShell"));
const CrmModulePage = lazy(() => import("@/pages/owner/crm/shell/CrmModulePage"));
const CrmHome = lazy(() => import("@/pages/owner/crm/shell/CrmHome"));
const CrmCreatePage = lazy(() => import("@/pages/owner/crm/shell/CrmCreatePage"));
const CrmRecordPage = lazy(() => import("@/pages/owner/crm/shell/CrmRecordPage"));
const CrmReports = lazy(() => import("@/pages/owner/crm/shell/CrmReports"));
const CrmAnalytics = lazy(() => import("@/pages/owner/crm/shell/CrmAnalytics"));
const CrmSetup = lazy(() => import("@/pages/owner/crm/shell/CrmSetup"));
const CrmFeeds = lazy(() => import("@/pages/owner/crm/shell/CrmFeeds"));
const CrmCalendarShell = lazy(() => import("@/pages/owner/crm/shell/CrmCalendar"));
const CrmSalesInbox = lazy(() => import("@/pages/owner/crm/shell/CrmSalesInbox"));
const CrmWorkqueue = lazy(() => import("@/pages/owner/crm/shell/CrmWorkqueue"));
const CrmAutomation = lazy(() => import("@/pages/owner/crm/shell/CrmAutomation"));
const CrmMarketplace = lazy(() => import("@/pages/owner/crm/shell/CrmMarketplace"));
const CrmDocumentsLibrary = lazy(() => import("@/pages/owner/crm/shell/CrmDocumentsLibrary"));
const CrmForecasts = lazy(() => import("@/pages/owner/crm/shell/CrmForecasts"));
const EmployeeProfile = lazy(() => import("@/pages/owner/EmployeeProfile"));
const OwnerAcademyApprovals = lazy(() => import("@/pages/owner/OwnerAcademyApprovals"));
const OwnerAcademyAccessQueue = lazy(() => import("@/pages/owner/OwnerAcademyAccessQueue"));

const OwnerTemplates = lazy(() => import("@/pages/OwnerTemplates"));
const OwnerCommSettings = lazy(() => import("@/pages/OwnerCommSettings"));
const OwnerAgenda = lazy(() => import("@/pages/OwnerAgenda"));
const OwnerFeatureRegistry = lazy(() => import("@/pages/OwnerFeatureRegistry"));
const OwnerAuditPage = lazy(() => import("@/pages/owner/OwnerAuditPage"));
const OwnerVaultPanel = lazy(() => import("@/pages/OwnerVaultPanel"));
const OwnerIntegrationsPage = lazy(() => import("@/pages/owner/OwnerIntegrationsPage"));
const OwnerSafetyPage = lazy(() => import("@/pages/owner/OwnerSafetyPage"));
const OwnerFounderSettings = lazy(() => import("@/pages/owner/OwnerFounderSettings"));
const PodcastStudio = lazy(() => import("@/pages/owner/PodcastStudio"));
const GlobalRecommendationsHub = lazy(() => import("@/pages/owner/GlobalRecommendationsHub"));
const PropertyManagement = lazy(() => import("@/pages/services/PropertyManagement"));
const Documents = lazy(() => import("@/pages/Documents"));
const CRMLeadDetail = lazy(() => import("@/pages/CRMLeadDetail"));
const CRMSyncDeadLetters = lazy(() => import("@/pages/CRMSyncDeadLetters"));
const CRMSyncConflicts = lazy(() => import("@/pages/CRMSyncConflicts"));
const CRMTasks = lazy(() => import("@/pages/CRMTasks"));
const CRMCalendar = lazy(() => import("@/pages/CRMCalendar"));
const CRMNotes = lazy(() => import("@/pages/CRMNotes"));
// CRMReminders + CRMEmployees deleted — content lives inside UnifiedCRM sections
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
// EmailClient deleted — /owner/email-client redirects to /owner/inbox
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
const DeveloperTrustPanel = lazy(() => import("@/pages/owner/DeveloperTrustPanel"));
const APISecurityDashboard = lazy(() => import("@/pages/owner/APISecurityDashboard"));
const IncidentReadinessPanel = lazy(() => import("@/pages/owner/IncidentReadinessPanel"));
const ZeroTrustAuditPanel = lazy(() => import("@/pages/owner/ZeroTrustAuditPanel"));
const EventManagementHub = lazy(() => import("@/pages/owner/EventManagementHub"));
const VerificationRequests = lazy(() => import("@/pages/owner/VerificationRequests"));
const ExternalAccessManagement = lazy(() => import("@/pages/owner/ExternalAccessManagement"));
const AccessDelegates = lazy(() => import("@/pages/owner/AccessDelegates"));
const SeoReview = lazy(() => import("@/pages/owner/SeoReview"));
const PrintCheck = lazy(() => import("@/pages/owner/PrintCheck"));
const BaselinePdfDashboard = lazy(() => import("@/pages/owner/BaselinePdfDashboard"));
const IconAuditDashboard = lazy(() => import("@/pages/owner/IconAuditDashboard"));
const IconSizePreview = lazy(() => import("@/pages/owner/IconSizePreview"));
const VatCertificate = lazy(() => import("@/pages/owner/templates/VatCertificate"));
const AdoptSignatureStudio = lazy(() => import("@/pages/owner/sign/AdoptSignatureStudio"));
// ContractVault is now embedded inside DocumentsFormsHub's "Vault" tab; no direct route import needed.
const OwnerRelationships = lazy(() => import("@/pages/owner/OwnerRelationships"));
const OwnerRelationshipsRevenue = lazy(() => import("@/pages/owner/OwnerRelationshipsRevenue"));
const OwnerMediaIngest = lazy(() => import("@/pages/owner/OwnerMediaIngest"));
const HomeFeaturedProjectsManager = lazy(() => import("@/pages/owner/HomeFeaturedProjectsManager"));
const AIHomeFinderSubmissions = lazy(() => import("@/pages/owner/AIHomeFinderSubmissionsPage"));
const DocumentsFormsHub = lazy(() => import("@/pages/owner/DocumentsFormsHub"));
const VoiceAgentControlPanel = lazy(() => import("@/pages/owner/VoiceAgentControlPanel"));
const OwnerEnvelopeDetail = lazy(() => import("@/pages/e-signature/EnvelopeDetail"));
const OwnerCreateEnvelope = lazy(() => import("@/pages/e-signature/CreateEnvelope"));
const OwnerSignatureStudio = lazy(() => import("@/pages/e-signature/SignatureStudio"));
const OwnerBlankLetterStudio = lazy(() => import("@/pages/e-signature/BlankLetterStudio"));
const OwnerContractReview = lazy(() => import("@/pages/e-signature/ContractReview"));
const OwnerMeetings = lazy(() => import("@/pages/owner/OwnerMeetings"));
const OwnerNewsHub = lazy(() => import("@/pages/owner/OwnerNewsHub"));
const OwnerMarketIntel = lazy(() => import("@/pages/owner/OwnerMarketIntel"));
const OwnerBooks = lazy(() => import("@/pages/owner/OwnerBooks"));
const CareersPortal = lazy(() => import("@/pages/owner/CareersPortal"));
const OwnerCreativeSuite = lazy(() => import("@/pages/OwnerCreativeSuite"));
const BrandPaletteHub = lazy(() => import("@/pages/owner/BrandPaletteHub"));
const ExclusiveDocuments = lazy(() => import("@/pages/owner/ExclusiveDocuments"));
const DeveloperDirectory = lazy(() => import("@/pages/developer-hub-admin/DeveloperDirectory"));
const DeveloperEnrichmentQueue = lazy(() => import("@/pages/developer-hub-admin/DeveloperEnrichmentQueue"));
const MissingLogosQueue = lazy(() => import("@/pages/admin/MissingLogosQueue"));
const DeveloperProfilePage = lazy(() => import("@/pages/admin/DeveloperProfilePage"));
const RepDirectory = lazy(() => import("@/pages/developers-portal/reps/RepDirectory"));
const RepByEmirate = lazy(() => import("@/pages/developers-portal/reps/RepByEmirate"));
const RepProfileEditor = lazy(() => import("@/pages/developers-portal/reps/RepProfileEditor"));
const AccessRequestQueue = lazy(() => import("@/pages/developers-portal/access/AccessRequestQueue"));
const DeveloperLaunchEvents = lazy(() => import("@/pages/developer-hub/DeveloperLaunchEvents"));
const DeveloperLiveEditor = lazy(() => import("@/pages/developer-hub/DeveloperLiveEditor"));
const DeveloperProjectWizard = lazy(() => import("@/pages/developer-hub/DeveloperProjectWizard"));
const BriefingsHub = lazy(() => import("@/pages/owner/developers/BriefingsHub"));

const DeveloperCompanyRegistration = lazy(() => import("@/pages/developer-hub/DeveloperCompanyRegistration"));
const DeveloperHubAdminPlaceholder = lazy(() => import("@/pages/developer-hub-admin/DeveloperHubAdminPlaceholder"));

const OwnerDocumentsTab = () => <DocumentsFormsHub initialTabOverride="documents" />;
const OwnerEsignTab = () => <DocumentsFormsHub initialTabOverride="esign" />;
const OwnerVaultTab = () => <DocumentsFormsHub initialTabOverride="vault" />;
const LegacyOwnerEnvelopeDetail = () => {
  const { id } = useParams();
  return <Navigate to={`/owner/documents/forms/${id}`} replace />;
};

export const OwnerRoutes = () => (
  <>
  {/* JBJ CRM — standalone shell, MUST be declared BEFORE the /owner shell route
      so React Router matches the more specific path first and only ONE sidebar mounts. */}
  <Route
    path="/owner/crm/jbj"
    element={
      <OwnerGuard>
        <CrmShell />
      </OwnerGuard>
    }
  >
    <Route index element={<CrmHome />} />
    <Route path="home" element={<CrmHome />} />
    <Route path="reports" element={<CrmReports />} />
    <Route path="analytics" element={<CrmAnalytics />} />
    <Route path="setup" element={<CrmSetup />} />
    <Route path="setup/:categoryId" element={<CrmSetup />} />
    <Route path="feeds" element={<CrmFeeds />} />
    <Route path="calendar" element={<CrmCalendarShell />} />
    <Route path="salesinbox" element={<CrmSalesInbox />} />
    <Route path="workqueue" element={<CrmWorkqueue />} />
    <Route path="signals" element={<CrmWorkqueue />} />
    <Route path="automation" element={<CrmAutomation />} />
    <Route path="automation/:tab" element={<CrmAutomation />} />
    <Route path="marketplace" element={<CrmMarketplace />} />
    <Route path="marketplace/:categoryId" element={<CrmMarketplace />} />
    <Route path="documents" element={<CrmDocumentsLibrary />} />
    <Route path="documents/:folderId" element={<CrmDocumentsLibrary />} />
    <Route path="forecasts" element={<CrmForecasts />} />
    <Route path="forecasts/:period" element={<CrmForecasts />} />
    <Route path=":section" element={<CrmModulePage />} />
    <Route path=":section/new" element={<CrmCreatePage />} />
    <Route path=":section/:id" element={<CrmRecordPage />} />
  </Route>

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
    <Route path="meetings" element={<OwnerMeetings />} />
    <Route path="features" element={<OwnerFeatureRegistry />} />
    <Route path="audit" element={<OwnerAuditPage />} />
    <Route path="vault" element={<OwnerVaultPanel />} />
    <Route path="integrations" element={<OwnerIntegrationsPage />} />
    <Route path="safety" element={<OwnerSafetyPage />} />
    <Route path="founder-settings" element={<OwnerFounderSettings />} />
    <Route path="podcast-studio" element={<PodcastStudio />} />
    <Route path="voice-agent" element={<VoiceAgentControlPanel />} />
    {/* /owner/properties was incorrectly pointing at the PropertyManagement service marketing page.
        Redirect to the canonical /properties listing so the full filter set is preserved. */}
    <Route path="properties" element={<Navigate to="/properties" replace />} />
    <Route path="documents" element={<OwnerDocumentsTab />} />
    <Route path="documents/editor" element={<Documents />} />
    <Route path="documents/forms" element={<DocumentsFormsHub />} />
    <Route path="documents/forms/create" element={<OwnerCreateEnvelope />} />
    <Route path="documents/forms/signature-studio" element={<OwnerSignatureStudio />} />
    <Route path="documents/forms/blank-letter" element={<OwnerBlankLetterStudio />} />
    <Route path="documents/forms/contract-review" element={<OwnerContractReview />} />
    <Route path="documents/forms/:id" element={<OwnerEnvelopeDetail />} />
    <Route path="e-signature" element={<OwnerEsignTab />} />
    <Route path="e-signature/create" element={<OwnerCreateEnvelope />} />
    <Route path="e-signature/signature-studio" element={<OwnerSignatureStudio />} />
    <Route path="e-signature/blank-letter" element={<OwnerBlankLetterStudio />} />
    <Route path="e-signature/contract-review" element={<OwnerContractReview />} />
    <Route path="e-signature/:id" element={<LegacyOwnerEnvelopeDetail />} />
    <Route path="settings" element={<OwnerCommSettings />} />
    {/* Unified CRM — single owner-only hub. All legacy sub-routes redirect into it. */}
    <Route path="crm" element={<UnifiedCRM />} />
    <Route path="crm/zoho" element={<Navigate to="/owner/crm/jbj" replace />} />
    {/* /owner/crm/jbj is mounted OUTSIDE this shell — see top of OwnerRoutes for the standalone route. */}

    {/* Legacy Zoho embed removed — CRM is standalone JBJ. */}
    <Route path="crm/zoho-legacy" element={<Navigate to="/owner/crm/jbj" replace />} />
    <Route path="academy-approvals" element={<OwnerAcademyApprovals />} />
    <Route path="academy-access" element={<OwnerAcademyAccessQueue />} />
    <Route path="crm/academy" element={<OwnerAcademyApprovals />} />
    <Route path="hr/employee/:userId" element={<EmployeeProfile />} />
    <Route path="crm/leads/:id" element={<CRMLeadDetail />} />
    <Route path="crm/sync-errors" element={<CRMSyncDeadLetters />} />
    <Route path="crm/sync-conflicts" element={<CRMSyncConflicts />} />
    <Route path="crm/leads" element={<Navigate to="/owner/crm?entity=leads&view=all" replace />} />
    <Route path="crm/tasks" element={<Navigate to="/owner/crm?entity=leads&view=tasks" replace />} />
    <Route path="crm/calendar" element={<Navigate to="/owner/crm?entity=leads&view=calendar" replace />} />
    <Route path="crm/notes" element={<Navigate to="/owner/crm?entity=leads&view=notes" replace />} />
    <Route path="crm/reminders" element={<Navigate to="/owner/crm?entity=leads&view=notifications" replace />} />
    <Route path="crm/inbox" element={<Navigate to="/owner/crm?entity=leads&view=inbox" replace />} />
    <Route path="crm/contracts" element={<Navigate to="/owner/crm?entity=leads&view=contracts" replace />} />
    <Route path="crm/automation" element={<Navigate to="/owner/crm?entity=leads&view=automation" replace />} />
    <Route path="crm/employees" element={<Navigate to="/owner/crm?entity=employees&view=roster" replace />} />
    <Route path="broker-visits" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/owner/OwnerBrokerVisits")))}</Suspense>} />
    <Route path="crm/relationships" element={<Navigate to="/owner/crm/relationship-hub" replace />} />
    <Route path="crm/relationship-hub" element={<CRMRelationships />} />
    <Route path="crm/relationships/secondary-market" element={<SecondaryMarketHub />} />
    <Route path="admin" element={<Admin />} />
    <Route path="admin/leads" element={<AdminLeads />} />
    <Route path="marketing-hub" element={<MarketingHub />} />
    <Route path="careers-portal" element={<CareersPortal />} />
    <Route path="job-offer-template" element={<Navigate to="/owner/careers-portal?section=contracts" replace />} />
    <Route path="analytics" element={<JBJAnalyticsDashboard />} />
    <Route path="users" element={
      <Suspense fallback={<PageLoader />}>
        {React.createElement(React.lazy(() => import("@/pages/owner/OwnerUsers")))}
      </Suspense>
    } />

    <Route path="research-users" element={
      <Suspense fallback={<PageLoader />}>
        {React.createElement(React.lazy(() => import("@/components/admin/ResearchUsersPanel")))}
      </Suspense>
    } />
    <Route path="founder-assistant" element={<FoundersAssistant />} />
    <Route path="recommendations" element={<GlobalRecommendationsHub />} />
    <Route path="developers" element={<DeveloperDirectory />} />
    <Route path="developers/directory" element={<Navigate to="/owner/developers" replace />} />
    <Route path="developers/add" element={<DeveloperCompanyRegistration />} />
    <Route path="developers/profile-rebuild" element={<DeveloperEnrichmentQueue />} />
    <Route path="developers/missing-logos" element={<MissingLogosQueue />} />
    <Route path="developers/reps" element={<RepDirectory />} />
    <Route path="developers/reps/by-emirate" element={<RepByEmirate />} />
    <Route path="developers/reps/:id" element={<RepProfileEditor />} />
    <Route path="developers/projects" element={<DeveloperLiveEditor />} />
    <Route path="developers/new-project" element={<DeveloperProjectWizard />} />
    <Route path="developers/briefings" element={<DeveloperHubAdminPlaceholder title="Briefings" body="Coordinate developer briefings, team attendance, sales representative sessions, launch updates, and follow-ups from this owner Developers Portal." />} />
    <Route path="developers/calendar" element={<DeveloperLaunchEvents />} />
    <Route path="developers/access-requests" element={<AccessRequestQueue />} />
    <Route path="developers/:slug" element={<DeveloperProfilePage />} />
    <Route path="developers/*" element={<Navigate to="/owner/developers" replace />} />
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
    <Route path="email-client" element={<Navigate to="/owner/inbox" replace />} />
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
    <Route path="developer-trust" element={<DeveloperTrustPanel />} />
    <Route path="api-security" element={<APISecurityDashboard />} />
    <Route path="incident-readiness" element={<IncidentReadinessPanel />} />
    <Route path="zero-trust-audit" element={<ZeroTrustAuditPanel />} />
    <Route path="event-management" element={<EventManagementHub />} />
    <Route path="verification-requests" element={<VerificationRequests />} />
    <Route path="external-access" element={<ExternalAccessManagement />} />
    <Route path="access" element={<AccessDelegates />} />
    <Route path="delegates" element={<AccessDelegates />} />
    <Route path="seo-review" element={<SeoReview />} />
    <Route path="print-check" element={<PrintCheck />} />
    <Route path="baseline-pdf" element={<BaselinePdfDashboard />} />
    <Route path="icon-audit" element={<IconAuditDashboard />} />
    <Route path="icon-size-preview" element={<IconSizePreview />} />
    <Route path="templates/vat" element={<VatCertificate />} />
    <Route path="sign" element={<AdoptSignatureStudio />} />
    <Route path="sign/:envelopeId" element={<AdoptSignatureStudio />} />
    {/* Contract Vault is now a tab inside the unified Forms & Agreements hub.
        Keep the legacy route as a redirect so existing bookmarks/links keep working. */}
    <Route path="contracts" element={<OwnerVaultTab />} />
    {/* Top-level alias matching the unified-hub branding ("Forms & Agreements"). */}
    <Route path="forms" element={<Navigate to="/owner/documents/forms" replace />} />
    <Route path="relationships" element={<OwnerRelationships />} />
    <Route path="relationships/revenue" element={<OwnerRelationshipsRevenue />} />
    <Route path="media-ingest" element={<OwnerMediaIngest />} />
    <Route path="properties/featured" element={<HomeFeaturedProjectsManager />} />
    <Route path="applications" element={<Navigate to="/owner/applications/ai-home-finder" replace />} />
    <Route path="applications/ai-home-finder" element={<AIHomeFinderSubmissions />} />
    <Route path="news" element={<OwnerNewsHub />} />
    <Route path="market-intel" element={<OwnerMarketIntel />} />
    <Route path="books" element={<OwnerBooks />} />
    <Route path="creative-suite" element={<OwnerCreativeSuite />} />
    <Route path="brand-palette" element={<BrandPaletteHub />} />
    <Route path="exclusive-documents" element={<ExclusiveDocuments />} />
    <Route path="crm/relationships/activity" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/owner/crm/AgencyActivityLog")))}</Suspense>} />
    <Route path="crm/brokerage-actions" element={<Navigate to="/owner/crm/relationships/activity" replace />} />
    <Route path="crm/brokers" element={<Navigate to="/owner/crm?entity=brokers&view=directory" replace />} />
    <Route path="crm/integrity" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/owner/crm/DataIntegrityCheck")))}</Suspense>} />
    <Route path="crm/network" element={<Navigate to="/owner/crm?entity=developers&view=registry" replace />} />
    <Route path="crm/campaigns" element={<Navigate to="/owner/crm?entity=leads&view=campaigns" replace />} />
   <Route path="crm/company/:type/:name" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/owner/crm/CompanyHubPage")))}</Suspense>} />
   <Route path="crm/person/:variant/:id" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/owner/crm/PersonHubPage")))}</Suspense>} />
   <Route path="crm/brokers/:brokerId" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("@/pages/owner/crm/BrokerProfile")))}</Suspense>} />
  </Route>
  </>
);

