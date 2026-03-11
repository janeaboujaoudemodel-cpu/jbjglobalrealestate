/**
 * Admin & Owner-guarded routes that render inside MainLayoutWrapper
 * (not in the /owner shell, but still require owner/admin access)
 */
import React, { lazy, Suspense } from "react";
import { Route, Navigate } from "react-router-dom";
import OwnerGuard from "@/components/OwnerGuard";
import ListingAdminGuard from "@/components/ListingAdminGuard";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import PageLoader from "@/components/PageLoader";

const Admin = lazy(() => import("@/pages/Admin"));
const AdminLeads = lazy(() => import("@/pages/AdminLeads"));
const AdminCRM = lazy(() => import("@/pages/AdminCRM"));
const AdminChatDashboard = lazy(() => import("@/pages/admin/AdminChatDashboard"));
const AdminIntelligence = lazy(() => import("@/pages/admin/AdminIntelligence"));
const InquiryManagementHub = lazy(() => import("@/pages/admin/InquiryManagementHub"));
const AdminOnboarding = lazy(() => import("@/pages/AdminOnboarding"));
const AdminRoleManagement = lazy(() => import("@/pages/AdminRoleManagement"));
const AdminDevelopers = lazy(() => import("@/pages/AdminDevelopers"));
const AdminTrainingGuide = lazy(() => import("@/pages/AdminTrainingGuide"));
const MarketingHub = lazy(() => import("@/pages/admin/MarketingHub"));
const ReellyImportTest = lazy(() => import("@/pages/admin/ReellyImportTest"));
const InternalDashboard = lazy(() => import("@/pages/market-intelligence/internal/InternalDashboard"));
const BrokerIntelligence = lazy(() => import("@/pages/market-intelligence/internal/BrokerIntelligence"));
const AIInsights = lazy(() => import("@/pages/market-intelligence/internal/AIInsights"));
const DataOperations = lazy(() => import("@/pages/market-intelligence/internal/DataOperations"));
const HRAgent = lazy(() => import("@/pages/HRAgent"));
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
const CompanyComm = lazy(() => import("@/pages/CompanyComm"));
const EmailClient = lazy(() => import("@/pages/EmailClient"));
const TeamChat = lazy(() => import("@/pages/TeamChat"));
const KanbanBoard = lazy(() => import("@/pages/KanbanBoard"));
const Whiteboard = lazy(() => import("@/pages/Whiteboard"));
const MindMap = lazy(() => import("@/pages/MindMap"));
const FormBuilder = lazy(() => import("@/pages/FormBuilder"));
const ESignatureDashboard = lazy(() => import("@/pages/e-signature/ESignatureDashboard"));
const CreateEnvelope = lazy(() => import("@/pages/e-signature/CreateEnvelope"));
const EnvelopeDetail = lazy(() => import("@/pages/e-signature/EnvelopeDetail"));
const SignatureStudio = lazy(() => import("@/pages/e-signature/SignatureStudio"));
const ContractReview = lazy(() => import("@/pages/e-signature/ContractReview"));
const Automations = lazy(() => import("@/pages/Automations"));

export const AdminRoutes = () => (
  <>
    {/* ── Core Admin ── */}
    <Route path="/admin" element={<OwnerGuard><Admin /></OwnerGuard>} />
    <Route path="/admin/leads" element={<OwnerGuard><AdminLeads /></OwnerGuard>} />
    <Route path="/admin/inquiries" element={<OwnerGuard><RouteErrorBoundary routeName="Inquiry Management Hub"><InquiryManagementHub /></RouteErrorBoundary></OwnerGuard>} />
    <Route path="/admin-inquiries" element={<OwnerGuard><RouteErrorBoundary routeName="Inquiry Management Hub"><InquiryManagementHub /></RouteErrorBoundary></OwnerGuard>} />
    <Route path="/admin/crm" element={<OwnerGuard><AdminCRM /></OwnerGuard>} />
    <Route path="/admin/chat-conversations" element={<OwnerGuard><AdminChatDashboard /></OwnerGuard>} />
    <Route path="/admin/onboarding" element={<OwnerGuard><AdminOnboarding /></OwnerGuard>} />
    <Route path="/admin/roles" element={<OwnerGuard><AdminRoleManagement /></OwnerGuard>} />
    <Route path="/admin/intelligence" element={<OwnerGuard><AdminIntelligence /></OwnerGuard>} />
    <Route path="/admin/developers" element={<OwnerGuard><AdminDevelopers /></OwnerGuard>} />
    <Route path="/admin/marketing-hub" element={<OwnerGuard><MarketingHub /></OwnerGuard>} />
    <Route path="/admin/reelly-import-test" element={<OwnerGuard><ListingAdminGuard><ReellyImportTest /></ListingAdminGuard></OwnerGuard>} />
    <Route path="/admin/training-guide" element={<OwnerGuard><AdminTrainingGuide /></OwnerGuard>} />
    <Route path="/admin/hr" element={<Navigate to="/hr-dashboard?tab=cv-center" replace />} />

    {/* ── Internal Market Intelligence ── */}
    <Route path="/internal/market-intelligence/dashboard" element={<OwnerGuard><InternalDashboard /></OwnerGuard>} />
    <Route path="/internal/market-intelligence/brokers" element={<OwnerGuard><BrokerIntelligence /></OwnerGuard>} />
    <Route path="/internal/market-intelligence/ai-insights" element={<OwnerGuard><AIInsights /></OwnerGuard>} />
    <Route path="/internal/market-intelligence/data-ops" element={<OwnerGuard><DataOperations /></OwnerGuard>} />

    {/* ── Legacy Redirects ── */}
    <Route path="/crm" element={<Navigate to="/owner/crm" replace />} />
    <Route path="/crm/*" element={<Navigate to="/owner/crm" replace />} />
    <Route path="/listing-admin" element={<Navigate to="/owner/listing-admin" replace />} />
    <Route path="/listing-admin/preview/:id" element={<Navigate to="/owner/listing-admin" replace />} />
    <Route path="/automations" element={<Navigate to="/owner/automations" replace />} />
    <Route path="/founder-assistant" element={<Navigate to="/owner/founder-assistant" replace />} />
    <Route path="/hr-hub" element={<Navigate to="/employee-management" replace />} />

    {/* ── Owner Tools (in main layout) ── */}
    <Route path="/owner/creative-suite" element={<OwnerGuard><OwnerCreativeSuite /></OwnerGuard>} />
    <Route path="/owner/brand-palette" element={<BrandPaletteHub />} />
    <Route path="/brand-palette" element={<BrandPaletteHub />} />
    <Route path="/owner/job-offer-template" element={<OwnerGuard><JobOfferTemplate /></OwnerGuard>} />
    <Route path="/owner/recommendations" element={<OwnerGuard><OwnerRecommendations /></OwnerGuard>} />
    <Route path="/hr-agent" element={<OwnerGuard><HRAgent /></OwnerGuard>} />
    <Route path="/referral-admin" element={<OwnerGuard><ReferralAdmin /></OwnerGuard>} />
    <Route path="/executive-assistant" element={<OwnerGuard><ExecutiveAssistant /></OwnerGuard>} />
    <Route path="/call-review" element={<OwnerGuard><CallReview /></OwnerGuard>} />
    <Route path="/video-builder" element={<OwnerGuard><VideoBuilder /></OwnerGuard>} />
    <Route path="/business-card-scanner" element={<OwnerGuard><BusinessCardScanner /></OwnerGuard>} />
    <Route path="/jbj-analytics" element={<OwnerGuard><JBJAnalyticsDashboard /></OwnerGuard>} />
    <Route path="/jbj-design-studio" element={<OwnerGuard><JBJDesignStudio /></OwnerGuard>} />
    <Route path="/design-studio" element={<OwnerGuard><JBJDesignStudio /></OwnerGuard>} />
    <Route path="/jbj-broker-admin" element={<OwnerGuard><JBJBrokerAdmin /></OwnerGuard>} />
    <Route path="/jbj-broker-dashboard" element={<OwnerGuard><JBJBrokerDashboard /></OwnerGuard>} />
    <Route path="/jbj-broker-messages" element={<OwnerGuard><JBJBrokerMessages /></OwnerGuard>} />
    <Route path="/jbj-broker-reports" element={<OwnerGuard><JBJBrokerReports /></OwnerGuard>} />
    <Route path="/broker-admin-assistant" element={<OwnerGuard><BrokerAdminAssistant /></OwnerGuard>} />
    <Route path="/employee-hub" element={<OwnerGuard><EmployeeHub /></OwnerGuard>} />
    <Route path="/employee-chat" element={<OwnerGuard><EmployeeChatPage /></OwnerGuard>} />
    <Route path="/governance/ai" element={<OwnerGuard><AIGovernance /></OwnerGuard>} />
    <Route path="/governance/institutional-lock" element={<OwnerGuard><InstitutionalLock /></OwnerGuard>} />
    <Route path="/governance/methodology" element={<OwnerGuard><GovernmentMethodology /></OwnerGuard>} />
    <Route path="/customer-happiness/tickets" element={<OwnerGuard><SupportTicketHub /></OwnerGuard>} />
    <Route path="/customer-happiness" element={<OwnerGuard><CustomerHappiness /></OwnerGuard>} />
    <Route path="/security-console" element={<OwnerGuard><SecurityConsole /></OwnerGuard>} />
    <Route path="/it-department" element={<OwnerGuard><EmployeeManagementHub /></OwnerGuard>} />
    <Route path="/employee-management" element={<OwnerGuard><EmployeeManagementHub /></OwnerGuard>} />
    <Route path="/hr-dashboard" element={<OwnerGuard><HRDashboard /></OwnerGuard>} />

    {/* ── Communication & Productivity ── */}
    <Route path="/company-comm" element={<OwnerGuard><CompanyComm /></OwnerGuard>} />
    <Route path="/email-client" element={<OwnerGuard><EmailClient /></OwnerGuard>} />
    <Route path="/team-chat" element={<OwnerGuard><TeamChat /></OwnerGuard>} />
    <Route path="/kanban" element={<OwnerGuard><KanbanBoard /></OwnerGuard>} />
    <Route path="/whiteboard" element={<OwnerGuard><Whiteboard /></OwnerGuard>} />
    <Route path="/mindmap" element={<OwnerGuard><MindMap /></OwnerGuard>} />
    <Route path="/form-builder" element={<OwnerGuard><FormBuilder /></OwnerGuard>} />

    {/* ── E-Signature ── */}
    <Route path="/e-signature" element={<OwnerGuard><ESignatureDashboard /></OwnerGuard>} />
    <Route path="/e-signature/create" element={<OwnerGuard><CreateEnvelope /></OwnerGuard>} />
    <Route path="/e-signature/:id" element={<OwnerGuard><EnvelopeDetail /></OwnerGuard>} />
    <Route path="/e-signature/signature-studio" element={<OwnerGuard><SignatureStudio /></OwnerGuard>} />
    <Route path="/e-signature/contract-review" element={<OwnerGuard><ContractReview /></OwnerGuard>} />

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
