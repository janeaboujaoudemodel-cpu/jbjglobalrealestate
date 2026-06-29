/**
 * Admin & Owner-guarded routes that render inside MainLayoutWrapper
 * (not in the /owner shell, but still require owner/admin access)
 */
import React, { lazy, Suspense } from "react";
import { Route, Navigate, useParams } from "react-router-dom";
import OwnerGuard from "@/components/OwnerGuard";
import ListingAdminGuard from "@/components/ListingAdminGuard";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import PageLoader from "@/components/PageLoader";
import GatedToolRoute from "@/components/access/GatedToolRoute";
import { toolThemes } from "@/components/tools/toolThemes";

const Admin = lazy(() => import("@/pages/Admin"));
const AdminLeads = lazy(() => import("@/pages/AdminLeads"));
const AdminCRM = lazy(() => import("@/pages/AdminCRM"));
const AdminChatDashboard = lazy(() => import("@/pages/admin/AdminChatDashboard"));
const AdminIntelligence = lazy(() => import("@/pages/admin/AdminIntelligence"));
const InquiryManagementHub = lazy(() => import("@/pages/admin/InquiryManagementHub"));
const AdminOnboarding = lazy(() => import("@/pages/AdminOnboarding"));
const AdminRoleManagement = lazy(() => import("@/pages/AdminRoleManagement"));
const AdminDevelopers = lazy(() => import("@/pages/AdminDevelopers"));
const DeveloperProfilePage = lazy(() => import("@/pages/admin/DeveloperProfilePage"));
const MissingLogosQueue = lazy(() => import("@/pages/admin/MissingLogosQueue"));
const DeveloperHubAdminShell = lazy(() => import("@/pages/developer-hub-admin/DeveloperHubAdminShell"));
const DeveloperHubAdminOverview = lazy(() => import("@/pages/developer-hub-admin/DeveloperHubAdminOverview"));
const DeveloperDirectory = lazy(() => import("@/pages/developer-hub-admin/DeveloperDirectory"));
const DeveloperEnrichmentQueue = lazy(() => import("@/pages/developer-hub-admin/DeveloperEnrichmentQueue"));
const DeveloperHubAdminPlaceholder = lazy(() => import("@/pages/developer-hub-admin/DeveloperHubAdminPlaceholder"));
const AdminTrainingGuide = lazy(() => import("@/pages/AdminTrainingGuide"));
const MarketingHub = lazy(() => import("@/pages/admin/MarketingHub"));
const AdminCategories = lazy(() => import("@/pages/AdminCategories"));
const ReellyImportTest = lazy(() => import("@/pages/admin/ReellyImportTest"));
const InternalDashboard = lazy(() => import("@/pages/market-intelligence/internal/InternalDashboard"));
const BrokerIntelligence = lazy(() => import("@/pages/market-intelligence/internal/BrokerIntelligence"));
const AIInsights = lazy(() => import("@/pages/market-intelligence/internal/AIInsights"));
const DataOperations = lazy(() => import("@/pages/market-intelligence/internal/DataOperations"));
const ContrastReview = lazy(() => import("@/pages/internal/ContrastReview"));
const FadedGoldAllowlist = lazy(() => import("@/pages/admin/FadedGoldAllowlist"));
const HRAgent = lazy(() => import("@/pages/HRAgent"));
const HRAnnouncementsHub = lazy(() => import("@/pages/owner/HRAnnouncementsHub"));
const ReferralAdmin = lazy(() => import("@/pages/ReferralAdmin"));
const OwnerCreativeSuite = lazy(() => import("@/pages/OwnerCreativeSuite"));
const BrandPaletteHub = lazy(() => import("@/pages/owner/BrandPaletteHub"));
const JobOfferTemplate = lazy(() => import("@/pages/JobOfferTemplate"));
const OwnerRecommendations = lazy(() => import("@/pages/OwnerRecommendations"));
const ExecutiveAssistant = lazy(() => import("@/pages/ExecutiveAssistant"));
const CallReview = lazy(() => import("@/pages/CallReview"));
const VideoBuilder = lazy(() => import("@/pages/VideoBuilder"));
const BusinessCardScanner = lazy(() => import("@/pages/BusinessCardScanner"));
const JBJAnalyticsDashboard = lazy(() => import("@/pages/JBJAnalyticsDashboard"));
const JBJDesignStudio = lazy(() => import("@/pages/JBJDesignStudio"));
const JBJBrokerAdmin = lazy(() => import("@/pages/JBJBrokerAdmin"));
const JBJBrokerDashboard = lazy(() => import("@/pages/JBJBrokerDashboard"));
const JBJBrokerMessages = lazy(() => import("@/pages/JBJBrokerMessages"));
const JBJBrokerReports = lazy(() => import("@/pages/JBJBrokerReports"));
const BrokerAdminAssistant = lazy(() => import("@/pages/BrokerAdminAssistant"));
const EmployeeHub = lazy(() => import("@/pages/EmployeeHub"));
const EmployeeChatPage = lazy(() => import("@/pages/EmployeeChatPage"));
const AIGovernance = lazy(() => import("@/pages/governance/AIGovernance"));
const InstitutionalLock = lazy(() => import("@/pages/governance/InstitutionalLock"));
const GovernmentMethodology = lazy(() => import("@/pages/governance/GovernmentMethodology"));
const SupportTicketHub = lazy(() => import("@/pages/SupportTicketHub"));
const CustomerHappiness = lazy(() => import("@/pages/CustomerHappiness"));
const SecurityConsole = lazy(() => import("@/pages/SecurityConsole"));
const EmployeeManagementHub = lazy(() => import("@/pages/EmployeeManagementHub"));
const HRDashboard = lazy(() => import("@/pages/HRDashboard"));
const CareersPortal = lazy(() => import("@/pages/owner/CareersPortal"));
// CompanyComm + EmailClient deleted — both redirect to /owner/inbox
const TeamChat = lazy(() => import("@/pages/TeamChat"));
const KanbanBoard = lazy(() => import("@/pages/KanbanBoard"));
const Whiteboard = lazy(() => import("@/pages/Whiteboard"));
const MindMap = lazy(() => import("@/pages/MindMap"));
const FormBuilder = lazy(() => import("@/pages/FormBuilder"));
// E-Signature dashboards moved into the unified hub at /owner/documents/forms.
// Only EnvelopeDetail remains here for legacy /e-signature/:id deep links.
const EnvelopeDetail = lazy(() => import("@/pages/e-signature/EnvelopeDetail"));
const DocumentsFormsHub = lazy(() => import("@/pages/owner/DocumentsFormsHub"));
const LegacyEnvelopeRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/owner/documents/forms/${id}`} replace />;
};
const DeveloperProfileSlugRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/developer-hub-admin/profile/${slug}`} replace />;
};
const DeveloperProfileSlugPortalRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/developers-portal/developers/${slug}`} replace />;
};
const Automations = lazy(() => import("@/pages/Automations"));
const AlertsDemo = lazy(() => import("@/pages/AlertsDemo"));
const ExclusiveDocuments = lazy(() => import("@/pages/owner/ExclusiveDocuments"));
const LegalComplianceCenter = lazy(() => import("@/pages/admin/LegalComplianceCenter"));
const AIToolsControlPanel = lazy(() => import("@/pages/owner/AIToolsControlPanel"));
const TranslationCoverage = lazy(() => import("@/pages/admin/TranslationCoverage"));
const MediaIngestionHub = lazy(() => import("@/pages/admin/MediaIngestionHub"));
const ListingsApproval = lazy(() => import("@/pages/admin/ListingsApproval"));

export const AdminRoutes = () => (
  <>
    {/* ── Alerts Demo (owner preview) ── */}
    <Route path="/alerts-demo" element={<AlertsDemo />} />
    {/* ── Core Admin ── */}
    <Route path="/admin" element={<OwnerGuard><Admin /></OwnerGuard>} />
    <Route path="/admin/leads" element={<OwnerGuard><AdminLeads /></OwnerGuard>} />
    <Route path="/admin/inquiries" element={<OwnerGuard><RouteErrorBoundary routeName="Inquiry Management Hub"><InquiryManagementHub /></RouteErrorBoundary></OwnerGuard>} />
    <Route path="/admin-inquiries" element={<OwnerGuard><RouteErrorBoundary routeName="Inquiry Management Hub"><InquiryManagementHub /></RouteErrorBoundary></OwnerGuard>} />
    <Route path="/admin/crm" element={<OwnerGuard><AdminCRM /></OwnerGuard>} />
    <Route path="/admin/chat-conversations" element={<OwnerGuard><AdminChatDashboard /></OwnerGuard>} />
    {/* /admin/onboarding redirected to Careers Portal below */}
    <Route path="/admin/roles" element={<OwnerGuard><AdminRoleManagement /></OwnerGuard>} />
    <Route path="/admin/intelligence" element={<OwnerGuard><AdminIntelligence /></OwnerGuard>} />
    {/* Legacy /admin/developers/* → redirect to new Developer Hub */}
    <Route path="/admin/developers" element={<Navigate to="/developer-hub-admin/directory" replace />} />
    <Route path="/admin/developers/profile/:slug" element={<DeveloperProfileSlugRedirect />} />
    <Route path="/admin/developers/missing-logos" element={<Navigate to="/developer-hub-admin/missing-logos" replace />} />

    {/* Short alias → Developer Hub */}
    <Route path="/dev-hub" element={<Navigate to="/developer-hub-admin" replace />} />
    <Route path="/dev-hub/*" element={<Navigate to="/developer-hub-admin" replace />} />

    {/* Owner Developer Hub — REPLACED by /developers-portal (handled in DevelopersPortalRoutes) */}
    <Route path="/developer-hub-admin" element={<Navigate to="/developers-portal" replace />} />
    <Route path="/developer-hub-admin/directory" element={<Navigate to="/developers-portal/directory" replace />} />
    <Route path="/developer-hub-admin/missing-logos" element={<Navigate to="/developers-portal/missing-logos" replace />} />
    <Route path="/developer-hub-admin/enrichment" element={<Navigate to="/developers-portal/enrichment" replace />} />
    <Route path="/developer-hub-admin/briefings" element={<Navigate to="/developers-portal/briefings" replace />} />
    <Route path="/developer-hub-admin/deals" element={<Navigate to="/developers-portal/deals" replace />} />
    <Route path="/developer-hub-admin/calendar" element={<Navigate to="/developers-portal/calendar" replace />} />
    <Route path="/developer-hub-admin/projects" element={<Navigate to="/developers-portal/projects" replace />} />
    <Route path="/developer-hub-admin/approval" element={<Navigate to="/developers-portal/access-requests" replace />} />
    <Route path="/developer-hub-admin/profile/:slug" element={<DeveloperProfileSlugPortalRedirect />} />
    <Route path="/developer-hub-admin/*" element={<Navigate to="/developers-portal" replace />} />

    {/* Owner-only legacy admin developer tools still reachable */}
    <Route path="/admin/developers-legacy" element={<OwnerGuard><AdminDevelopers /></OwnerGuard>} />
    <Route path="/admin/categories" element={<OwnerGuard><AdminCategories /></OwnerGuard>} />
    <Route path="/admin/marketing-hub" element={<OwnerGuard><MarketingHub /></OwnerGuard>} />
    <Route path="/admin/reelly-import-test" element={<OwnerGuard><ListingAdminGuard><ReellyImportTest /></ListingAdminGuard></OwnerGuard>} />
    <Route path="/admin/legal-center" element={<OwnerGuard><LegalComplianceCenter /></OwnerGuard>} />
    <Route path="/admin/media-ingestion" element={<OwnerGuard><ListingAdminGuard><Suspense fallback={<PageLoader />}><MediaIngestionHub /></Suspense></ListingAdminGuard></OwnerGuard>} />
    <Route path="/admin/listings-approval" element={<OwnerGuard><Suspense fallback={<PageLoader />}><ListingsApproval /></Suspense></OwnerGuard>} />
    <Route path="/admin/training-guide" element={<OwnerGuard><AdminTrainingGuide /></OwnerGuard>} />
    <Route path="/admin/translation-coverage" element={<OwnerGuard><Suspense fallback={<PageLoader />}><TranslationCoverage /></Suspense></OwnerGuard>} />
    <Route path="/admin/faded-gold-allowlist" element={<OwnerGuard><Suspense fallback={<PageLoader />}><FadedGoldAllowlist /></Suspense></OwnerGuard>} />
    <Route path="/admin/hr" element={<Navigate to="/owner/careers-portal?section=applications" replace />} />

    {/* ── Internal Market Intelligence ── */}
    <Route path="/internal/market-intelligence/dashboard" element={<OwnerGuard><InternalDashboard /></OwnerGuard>} />
    <Route path="/internal/market-intelligence/brokers" element={<OwnerGuard><BrokerIntelligence /></OwnerGuard>} />
    <Route path="/internal/market-intelligence/ai-insights" element={<OwnerGuard><AIInsights /></OwnerGuard>} />
    <Route path="/internal/market-intelligence/data-ops" element={<OwnerGuard><DataOperations /></OwnerGuard>} />
    <Route path="/internal/contrast-review" element={<OwnerGuard><Suspense fallback={<PageLoader />}><ContrastReview /></Suspense></OwnerGuard>} />

    {/* ── Legacy Redirects ── */}
    <Route path="/crm" element={<Navigate to="/owner/crm" replace />} />
    <Route path="/crm/relationships" element={<Navigate to="/owner/crm/relationships" replace />} />
    <Route path="/crm/*" element={<Navigate to="/owner/crm" replace />} />
    <Route path="/listing-admin" element={<Navigate to="/owner/listing-admin" replace />} />
    <Route path="/listing-admin/preview/:id" element={<Navigate to="/owner/listing-admin" replace />} />
    <Route path="/automations" element={<Navigate to="/owner/automations" replace />} />
    <Route path="/founder-assistant" element={<Navigate to="/owner/founder-assistant" replace />} />
    <Route path="/hr-hub" element={<Navigate to="/owner/careers-portal?section=employees" replace />} />

    {/* ── Owner Tools (in main layout) ── */}
    <Route path="/owner/creative-suite" element={<OwnerGuard><OwnerCreativeSuite /></OwnerGuard>} />
    <Route path="/owner/brand-palette" element={<OwnerGuard><BrandPaletteHub /></OwnerGuard>} />
    <Route path="/brand-palette" element={<OwnerGuard><BrandPaletteHub /></OwnerGuard>} />
    <Route path="/owner/job-offer-template" element={<Navigate to="/owner/careers-portal?section=contracts" replace />} />
    <Route path="/job-offer-template" element={<Navigate to="/owner/careers-portal?section=contracts" replace />} />
    <Route path="/owner/recommendations" element={<OwnerGuard><OwnerRecommendations /></OwnerGuard>} />
    {/* Public Jessica chat page — must NOT redirect into owner-only careers portal. */}
    <Route path="/hr-agent" element={<HRAgent />} />
    <Route path="/owner/hr/announcements" element={<OwnerGuard><HRAnnouncementsHub /></OwnerGuard>} />
    <Route path="/referral-admin" element={<OwnerGuard><ReferralAdmin /></OwnerGuard>} />
    <Route path="/executive-assistant" element={<OwnerGuard><ExecutiveAssistant /></OwnerGuard>} />
    <Route path="/call-review" element={<OwnerGuard><CallReview /></OwnerGuard>} />
    <Route path="/video-builder" element={<OwnerGuard><VideoBuilder /></OwnerGuard>} />
    <Route
      path="/business-card-scanner"
      element={
        <GatedToolRoute
          toolId="business-card-scanner"
          toolName="Business Card Scanner"
          theme={toolThemes.rose}
          tagline="Snap any card, auto-import the contact into your CRM with AI enrichment. Unlocked for JBJ brokers."
        >
          <BusinessCardScanner />
        </GatedToolRoute>
      }
    />
    <Route path="/jbj-analytics" element={<OwnerGuard><JBJAnalyticsDashboard /></OwnerGuard>} />
    <Route path="/jbj-design-studio" element={<OwnerGuard><JBJDesignStudio /></OwnerGuard>} />
    <Route path="/design-studio" element={<OwnerGuard><JBJDesignStudio /></OwnerGuard>} />
    <Route path="/jbj-broker-admin" element={<OwnerGuard><JBJBrokerAdmin /></OwnerGuard>} />
    <Route path="/jbj-broker-dashboard" element={<OwnerGuard><JBJBrokerDashboard /></OwnerGuard>} />
    <Route path="/jbj-broker-messages" element={<OwnerGuard><JBJBrokerMessages /></OwnerGuard>} />
    <Route path="/jbj-broker-reports" element={<OwnerGuard><JBJBrokerReports /></OwnerGuard>} />
    <Route path="/broker-admin-assistant" element={<OwnerGuard><BrokerAdminAssistant /></OwnerGuard>} />
    <Route path="/employee-hub" element={<Navigate to="/owner/careers-portal?section=employees" replace />} />
    <Route path="/employee-chat" element={<Navigate to="/owner/careers-portal?section=comms" replace />} />
    <Route path="/governance/ai" element={<OwnerGuard><AIGovernance /></OwnerGuard>} />
    <Route path="/governance/institutional-lock" element={<OwnerGuard><InstitutionalLock /></OwnerGuard>} />
    <Route path="/governance/methodology" element={<OwnerGuard><GovernmentMethodology /></OwnerGuard>} />
    <Route path="/customer-happiness/tickets" element={<OwnerGuard><SupportTicketHub /></OwnerGuard>} />
    <Route path="/customer-happiness" element={<OwnerGuard><CustomerHappiness /></OwnerGuard>} />
    <Route path="/security-console" element={<OwnerGuard><SecurityConsole /></OwnerGuard>} />
    <Route path="/it-department" element={<Navigate to="/owner/careers-portal?section=employees" replace />} />
    <Route path="/employee-management" element={<Navigate to="/owner/careers-portal?section=employees" replace />} />
    <Route path="/employee-management-hub" element={<Navigate to="/owner/careers-portal?section=employees" replace />} />
    <Route path="/hr-dashboard" element={<Navigate to="/owner/careers-portal?section=overview" replace />} />
    <Route path="/admin/onboarding" element={<Navigate to="/owner/careers-portal?section=onboarding" replace />} />
    <Route path="/admin-onboarding" element={<Navigate to="/owner/careers-portal?section=onboarding" replace />} />
    <Route path="/contract-forms" element={<Navigate to="/owner/careers-portal?section=contracts" replace />} />
    <Route path="/owner/careers-portal" element={<OwnerGuard><CareersPortal /></OwnerGuard>} />
    <Route path="/careers-portal" element={<Navigate to="/owner/careers-portal" replace />} />


    {/* ── Communication & Productivity ── */}
    <Route path="/company-comm" element={<Navigate to="/owner/inbox" replace />} />
    <Route path="/email-client" element={<Navigate to="/owner/inbox" replace />} />
    <Route path="/team-chat" element={<OwnerGuard><TeamChat /></OwnerGuard>} />
    <Route path="/kanban" element={<OwnerGuard><KanbanBoard /></OwnerGuard>} />
    <Route path="/whiteboard" element={<OwnerGuard><Whiteboard /></OwnerGuard>} />
    <Route path="/mindmap" element={<OwnerGuard><MindMap /></OwnerGuard>} />
    <Route path="/form-builder" element={<OwnerGuard><FormBuilder /></OwnerGuard>} />

    {/* ── Exclusive Documents ── */}
    <Route path="/owner/exclusive-documents" element={<OwnerGuard><ExclusiveDocuments /></OwnerGuard>} />
    <Route path="/owner/ai-tools-control" element={<OwnerGuard><AIToolsControlPanel /></OwnerGuard>} />

    {/* ── E-Signature (legacy → unified Documents & Agreements hub) ── */}
    <Route path="/e-signature" element={<OwnerGuard><DocumentsFormsHub initialTabOverride="esign" /></OwnerGuard>} />
    <Route path="/e-signature/create" element={<Navigate to="/owner/documents/forms/create" replace />} />
    <Route path="/e-signature/signature-studio" element={<Navigate to="/owner/documents/forms/signature-studio" replace />} />
    <Route path="/e-signature/blank-letter" element={<Navigate to="/owner/documents/forms/blank-letter" replace />} />
    <Route path="/e-signature/contract-review" element={<Navigate to="/owner/documents/forms/contract-review" replace />} />
    <Route path="/e-signature/:id" element={<OwnerGuard><LegacyEnvelopeRedirect /></OwnerGuard>} />

    {/* ── Email/Unsubscribe ── */}
    <Route path="/unsubscribe" element={
      <Suspense fallback={<PageLoader />}>
        {React.createElement(React.lazy(() => import("@/pages/Unsubscribe")))}
      </Suspense>
    } />
    <Route path="/email-preferences" element={
      <Suspense fallback={<PageLoader />}>
        {React.createElement(React.lazy(() => import("@/pages/EmailPreferences")))}
      </Suspense>
    } />
  </>
);
