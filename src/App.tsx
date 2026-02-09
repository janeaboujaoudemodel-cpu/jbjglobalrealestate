import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

// Toolkit pages (lazy loaded)
const RoyalToolsHub = lazy(() => import("./pages/toolkit/RoyalToolsHub"));
const ToolkitLanding = lazy(() => import("./pages/toolkit/ToolkitLanding"));
const VideoResizePack = lazy(() => import("./pages/toolkit/VideoResizePack"));
const PdfFromPhotos = lazy(() => import("./pages/toolkit/PdfFromPhotos"));
const ImageResize = lazy(() => import("./pages/toolkit/ImageResize"));
const VoiceStudio = lazy(() => import("./pages/toolkit/VoiceStudio"));
const AIVideoStudioPage = lazy(() => import("./pages/toolkit/AIVideoStudioPage"));
const CaptionsTranslate = lazy(() => import("./pages/toolkit/CaptionsTranslate"));
const BackgroundAI = lazy(() => import("./pages/toolkit/BackgroundAI"));
const BeautyFilters = lazy(() => import("./pages/toolkit/BeautyFilters"));
const PDFEditor = lazy(() => import("./pages/toolkit/PDFEditor"));
// NEW: Master Suite Pages
const VideoSuite = lazy(() => import("./pages/toolkit/VideoSuite"));
const VoiceSuite = lazy(() => import("./pages/toolkit/VoiceSuite"));
const PhotoSuite = lazy(() => import("./pages/toolkit/PhotoSuite"));
const PDFSuite = lazy(() => import("./pages/toolkit/PDFSuite"));
const PropertySuite = lazy(() => import("./pages/toolkit/PropertySuite"));
// NEW: Business Suite Pages
const RealEstateSuite = lazy(() => import("./pages/business-suite/RealEstateSuite"));
const BrokerSuite = lazy(() => import("./pages/business-suite/BrokerSuite"));
const CreativeSuite = lazy(() => import("./pages/business-suite/CreativeSuite"));
const ProductivitySuite = lazy(() => import("./pages/business-suite/ProductivitySuite"));
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ActiveLeadProvider } from "@/contexts/ActiveLeadContext";
import { PopupCoordinatorProvider } from "@/contexts/PopupCoordinatorContext";
import { FounderVisibilityProvider } from "@/contexts/FounderVisibilityContext";
import { UserModeProvider } from "@/contexts/UserModeContext";
import { PodcastVisibilityProvider } from "@/contexts/PodcastVisibilityContext";
import { ScrollToTopOnMount } from "@/components/ScrollToTop";
import AdminBypass from "@/components/AdminBypass";
import ListingAdminGuard from "@/components/ListingAdminGuard";
import OwnerGuard from "@/components/OwnerGuard";
import BrokerGuard from "@/components/BrokerGuard";
import MainLayoutWrapper from "@/components/MainLayoutWrapper";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import { RedirectWithParams } from "@/components/RedirectWithParams";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import GlobalSEO from "@/components/GlobalSEO";
import GlobalVisitorTracking from "@/components/GlobalVisitorTracking";
import GlobalTranslator from "@/components/GlobalTranslator";
import Index from "./pages/Index";
 import PropertiesReelly from "./pages/PropertiesReelly";
import ProjectDetail from "./pages/ProjectDetail";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import DeveloperDetail from "./pages/DeveloperDetail";
import Developers from "./pages/Developers";
import Quiz from "./pages/Quiz";
import QuizResults from "./pages/QuizResults";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Services from "./pages/Services";
// Concierge removed
import MortgageCalculator from "./pages/MortgageCalculator";
import MarketReport from "./pages/MarketReport";
import MarketIntelligence from "./pages/MarketIntelligence";
import MarketOverview from "./pages/market-intelligence/MarketOverview";
import AreaIntelligence from "./pages/market-intelligence/AreaIntelligence";
import MarketAreaDetail from "./pages/market-intelligence/AreaDetail";
import MarketReportsPage from "./pages/market-intelligence/MarketReports";
import MonthlyMarketBrief from "./pages/market-intelligence/MonthlyMarketBrief";
import QuarterlyMarketReview from "./pages/market-intelligence/QuarterlyMarketReview";
import AnnualMarketSummary from "./pages/market-intelligence/AnnualMarketSummary";
import Methodology from "./pages/market-intelligence/Methodology";
import InternalDashboard from "./pages/market-intelligence/internal/InternalDashboard";
import BrokerIntelligence from "./pages/market-intelligence/internal/BrokerIntelligence";
import AIInsights from "./pages/market-intelligence/internal/AIInsights";
import DataOperations from "./pages/market-intelligence/internal/DataOperations";
import Favorites from "./pages/Favorites";
import Compare from "./pages/Compare";
import Auth from "./pages/Auth";
import AccessDenied from "./pages/AccessDenied";
import Admin from "./pages/Admin";
import AdminLeads from "./pages/AdminLeads";
import AdminRoleManagement from "./pages/AdminRoleManagement";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import Founder from "./pages/Founder";
import Awards from "./pages/Awards";
import PressKit from "./pages/PressKit";
import CompanyProfile from "./pages/CompanyProfile";
import Philanthropy from "./pages/Philanthropy";
import News from "./pages/News";
import BrokerToolkit from "./pages/BrokerToolkit";
import BrokerDashboard from "./pages/BrokerDashboard";
import BrokerResources from "./pages/BrokerResources";
import AIHub from "./pages/AIHub";
import InteriorDesignAI from "./pages/InteriorDesignAI";
import PropertyEvaluator from "./pages/PropertyEvaluator";
import ScanSignDocuments from "./pages/ScanSignDocuments";
import PropertyMeasurement from "./pages/PropertyMeasurement";
import RentalIndex from "./pages/RentalIndex";

// E-Signature Pages
const ESignatureDashboard = lazy(() => import("./pages/e-signature/ESignatureDashboard"));
const CreateEnvelope = lazy(() => import("./pages/e-signature/CreateEnvelope"));
const EnvelopeDetail = lazy(() => import("./pages/e-signature/EnvelopeDetail"));
const SignDocument = lazy(() => import("./pages/e-signature/SignDocument"));
import AICalendar from "./pages/AICalendar";
import AIFinancialAdvisor from "./pages/AIFinancialAdvisor";
import AIPersonalShopper from "./pages/AIPersonalShopper";
import AIPropertyAnalyzerPage from "./pages/AIPropertyAnalyzerPage";
import AILeadQualificationPage from "./pages/AILeadQualificationPage";
import AIPricePredictorPage from "./pages/AIPricePredictorPage";
import AINeighborhoodInsightsPage from "./pages/AINeighborhoodInsightsPage";
import AIROICalculatorPage from "./pages/AIROICalculatorPage";
import AICompetitorAnalysisPage from "./pages/AICompetitorAnalysisPage";
import AIMarketReportPage from "./pages/AIMarketReportPage";
import AIObjectionHandlerPage from "./pages/AIObjectionHandlerPage";
import AIFollowupSchedulerPage from "./pages/AIFollowupSchedulerPage";
import AIMeetingSummarizerPage from "./pages/AIMeetingSummarizerPage";
import AITranslationHubPage from "./pages/AITranslationHubPage";
import AIVideoTourScriptPage from "./pages/AIVideoTourScriptPage";
import AIContractReviewerPage from "./pages/AIContractReviewerPage";
import AIDocumentGeneratorPage from "./pages/AIDocumentGeneratorPage";
import MyAIHistory from "./pages/MyAIHistory";
import AICallSummarizerPage from "./pages/AICallSummarizerPage";
import MeetingCenter from "./pages/MeetingCenter";
import VoiceAgentSettings from "./pages/VoiceAgentSettings";
import AIClientMatcherPage from "./pages/AIClientMatcherPage";
import AIEmailGeneratorPage from "./pages/AIEmailGeneratorPage";
import AISocialMediaPage from "./pages/AISocialMediaPage";
import AIInvestmentReportPage from "./pages/AIInvestmentReportPage";
import AIDescriptionWriterPage from "./pages/AIDescriptionWriterPage";
import IntellectualProperty from "./pages/IntellectualProperty";
import Architecture from "./pages/services/Architecture";
import InteriorDesign from "./pages/services/InteriorDesign";
import FitOut from "./pages/services/FitOut";
import DesignBuild from "./pages/services/DesignBuild";
import LawFirm from "./pages/services/LawFirm";
import BuyingAdvisory from "./pages/services/BuyingAdvisory";
import SellingAdvisory from "./pages/services/SellingAdvisory";
import RentalAdvisory from "./pages/services/RentalAdvisory";
import InvestmentAdvisory from "./pages/services/InvestmentAdvisory";
import Snagging from "./pages/services/Snagging";
import PropertyManagement from "./pages/services/PropertyManagement";
import ShortTermRentals from "./pages/services/ShortTermRentals";
import CurrencyExchange from "./pages/services/CurrencyExchange";
import Concierge from "./pages/services/Concierge";
import CompanySetup from "./pages/services/CompanySetup";
import SignatureCollection from "./pages/services/SignatureCollection";
import AITools from "./pages/services/AITools";
import BrokerCertification from "./pages/services/BrokerCertification";
import ComplaintProcedures from "./pages/services/ComplaintProcedures";
import CustomerHappinessCenter from "./pages/services/CustomerHappinessCenter";
import TestimonialsPage from "./pages/services/Testimonials";
import ReferralPartner from "./pages/ReferralPartner";
// Install page removed - PWA disabled
import CRM from "./pages/CRM";
import CRMLeadDetail from "./pages/CRMLeadDetail";
import Automations from "./pages/Automations";
import SupportTicketHub from "./pages/SupportTicketHub";
import MyTickets from "./pages/client/MyTickets";
import ReopenTicket from "./pages/ReopenTicket";
import CRMTasks from "./pages/CRMTasks";
import CRMCalendar from "./pages/CRMCalendar";
import CRMNotes from "./pages/CRMNotes";
import CRMReminders from "./pages/CRMReminders";
import CRMEmployees from "./pages/CRMEmployees";
import OwnerDashboardOverview from "./pages/OwnerDashboardOverview";
import OwnerDashboardShell from "./pages/OwnerDashboardShell";
import CRMLeadsInbox from "./pages/CRMLeadsInbox";
import OwnerInbox from "./pages/OwnerInbox";
import OwnerTemplates from "./pages/OwnerTemplates";
import OwnerCommSettings from "./pages/OwnerCommSettings";
import OwnerAgenda from "./pages/OwnerAgenda";
import OwnerFeatureRegistry from "./pages/OwnerFeatureRegistry";

import AdminCRM from "./pages/AdminCRM";
import JoinApplication from "./pages/JoinApplication";
import Onboarding from "./pages/Onboarding";
import OnboardingModule from "./pages/OnboardingModule";
import AdminOnboarding from "./pages/AdminOnboarding";
import VerifyCertificate from "./pages/VerifyCertificate";
import PropertyMap from "./pages/PropertyMap";
import AdminDevelopers from "./pages/AdminDevelopers";
import BrokerAccount from "./pages/BrokerAccount";
import UserProfile from "./pages/UserProfile";
import HRAgent from "./pages/HRAgent";
import ReferralOnboarding from "./pages/ReferralOnboarding";
import ReferralAdmin from "./pages/ReferralAdmin";
import RedeemReferral from "./pages/RedeemReferral";
import Spreadsheet from "./pages/Spreadsheet";
import Documents from "./pages/Documents";
import ContractForms from "./pages/ContractForms";
import VideoMeeting from "./pages/VideoMeeting";
import ExecutiveAssistant from "./pages/ExecutiveAssistant";
import CallReview from "./pages/CallReview";
import VapiPrompt from "./pages/VapiPrompt";
import VideoBuilder from "./pages/VideoBuilder";
import AreaGuides from "./pages/AreaGuides";
import AreaDetail from "./pages/AreaDetail";
import BusinessCardScanner from "./pages/BusinessCardScanner";
import BuyerGuide from "./pages/BuyerGuide";
import SellerGuide from "./pages/SellerGuide";
import SellerListing from "./pages/SellerListing";
import GoldenVisaGuide from "./pages/guides/GoldenVisaGuide";
import Guides from "./pages/Guides";
import RentGuide from "./pages/RentGuide";
import TenantGuide from "./pages/TenantGuide";
import LandlordGuide from "./pages/LandlordGuide";
import LandlordRentalPortal from "./pages/LandlordRentalPortal";
import FAQ from "./pages/FAQ";
import InvestorEducation from "./pages/InvestorEducation";
import InvestorFAQ from "./pages/InvestorFAQ";
import InvestorDashboard from "./pages/InvestorDashboard";
import PortfolioViews from "./pages/investor/PortfolioViews";
import ReportAccess from "./pages/investor/ReportAccess";
import OwnerDashboard from "./pages/OwnerDashboard";
import BrokerPartnerDashboard from "./pages/BrokerPartnerDashboard";
import Dashboard from "./pages/Dashboard";
import MyDashboard from "./pages/MyDashboard";
import MyDashboardProgress from "./pages/MyDashboardProgress";
import MyDashboardActivity from "./pages/MyDashboardActivity";
import BrokerEducation from "./pages/BrokerEducation";
import BrokerFAQ from "./pages/BrokerFAQ";
import JBJAnalyticsDashboard from "./pages/JBJAnalyticsDashboard";
import JBJDesignStudio from "./pages/JBJDesignStudio";
import AIBrokerWorkspace from "./pages/AIBrokerWorkspace";
import JBJBrokerAdmin from "./pages/JBJBrokerAdmin";
import JBJBrokerDashboard from "./pages/JBJBrokerDashboard";
import JBJBrokerMessages from "./pages/JBJBrokerMessages";
import JBJBrokerReports from "./pages/JBJBrokerReports";
import FoundersAssistant from "./pages/FoundersAssistant";
import BrokerAdminAssistant from "./pages/BrokerAdminAssistant";
import ListingAdmin from "./pages/ListingAdmin";
import PendingImportPreview from "./pages/listing-admin/PendingImportPreview";
import AdminTrainingGuide from "./pages/AdminTrainingGuide";
import MeetTheTeam from "./pages/MeetTheTeam";
import OurBrokers from "./pages/OurBrokers";
import EmployeeHub from "./pages/EmployeeHub";
import BrokerTraining from "./pages/broker/BrokerTraining";
import EmployeeChatPage from "./pages/EmployeeChatPage";
import Partners from "./pages/Partners";
import PartnerMortgage from "./pages/partners/PartnerMortgage";
import PartnerLegal from "./pages/partners/PartnerLegal";
import PartnerCompanySetup from "./pages/partners/PartnerCompanySetup";
import PartnerVisaServices from "./pages/partners/PartnerVisaServices";
import TrustAndAuditCenter from "./pages/TrustAndAuditCenter";
import HRDashboard from "./pages/HRDashboard";
import ClientPortal from "./pages/client/ClientPortal";
import PartnerGovernance from "./pages/governance/PartnerGovernance";
import AIGovernance from "./pages/governance/AIGovernance";
import InstitutionalLock from "./pages/governance/InstitutionalLock";
import GovernmentMethodology from "./pages/governance/GovernmentMethodology";

// Communication & Productivity Tools
import CompanyComm from "./pages/CompanyComm";

// Creative Suite
import Studio from "./pages/Studio";
import StudioEditor from "./pages/StudioEditor";
import StudioSettings from "./pages/StudioSettings";
import EmailClient from "./pages/EmailClient";
import TeamChat from "./pages/TeamChat";
import KanbanBoard from "./pages/KanbanBoard";
import Whiteboard from "./pages/Whiteboard";
import MindMap from "./pages/MindMap";
import Presentations from "./pages/Presentations";
import FormBuilder from "./pages/FormBuilder";

// Admin & System Tools
import CustomerHappiness from "./pages/CustomerHappiness";
import Sitemap from "./pages/Sitemap";
import Pricing from "./pages/Pricing";
import SecurityConsole from "./pages/SecurityConsole";
import ITDepartment from "./pages/ITDepartment";
import EmployeeManagementHub from "./pages/EmployeeManagementHub";
import MarketingHub from "./pages/admin/MarketingHub";
import ReellyImportTest from "./pages/admin/ReellyImportTest";

// Hidden pages (not in navigation, noindex)
import DigitalCard from "./pages/DigitalCard";

// Blueprint pages
import SellWithUs from "./pages/SellWithUs";
import RequestValuation from "./pages/RequestValuation";
import LandlordListForm from "./pages/LandlordListForm";
import InvestorServices from "./pages/InvestorServices";
import JoinInvestorList from "./pages/JoinInvestorList";
import Reviews from "./pages/Reviews";
import ThankYou from "./pages/ThankYou";
import Disclaimers from "./pages/Disclaimers";

// Owner Pages
import OwnerAuditPage from "./pages/owner/OwnerAuditPage";
import OwnerIntegrationsPage from "./pages/owner/OwnerIntegrationsPage";
import OwnerSafetyPage from "./pages/owner/OwnerSafetyPage";

const queryClient = new QueryClient();

const App = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <GlobalSEO />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <UserModeProvider>
              <FounderVisibilityProvider>
                <PodcastVisibilityProvider>
                  <ActiveLeadProvider>
                    <PopupCoordinatorProvider>
                    <ScrollToTopOnMount />
                  <GlobalVisitorTracking />
                  <GlobalTranslator />
            {/* Auth route is always accessible for login */}
            <Routes>
              <Route path="/auth" element={<Auth />} />
              {/* Access Denied page for auth-non-owner */}
              <Route path="/403" element={<AccessDenied />} />
              {/* Hidden standalone pages - no header/footer */}
              <Route path="/card" element={<DigitalCard />} />
              
              {/* Public E-Signature Signing Page - No auth required */}
              <Route path="/sign/:token" element={
                <Suspense fallback={<div className="min-h-screen bg-amber-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                  <SignDocument />
                </Suspense>
              } />
              
              {/* Owner Command Center - Dedicated shell with sidebar, outside MainLayoutWrapper */}
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
                <Route path="properties" element={<PropertyManagement />} />
                <Route path="documents" element={<Documents />} />
                <Route path="settings" element={<OwnerCommSettings />} />
              </Route>
              
              <Route element={<AdminBypass><MainLayoutWrapper /></AdminBypass>}>
                <Route path="/vapi-prompt" element={<VapiPrompt />} />
                <Route path="/" element={<Index />} />
                 <Route path="/properties" element={<PropertiesReelly />} />
                <Route path="/project/:slug" element={<ProjectDetail />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/community/:slug" element={<CommunityDetail />} />
                <Route path="/developers" element={<Developers />} />
                <Route path="/developer/:slug" element={<DeveloperDetail />} />
                {/* Redirect plural to singular for developers */}
                <Route path="/developers/:slug" element={<RedirectWithParams to="/developer" />} />
                <Route path="/areas" element={<AreaGuides />} />
                <Route path="/area/:slug" element={<AreaDetail />} />
                {/* Redirect plural to singular for areas */}
                <Route path="/areas/:slug" element={<RedirectWithParams to="/area" />} />
                <Route path="/buyer-guide" element={<BuyerGuide />} />
                <Route path="/seller-guide" element={<SellerGuide />} />
                <Route path="/seller-listing" element={<SellerListing />} />
                <Route path="/golden-visa" element={<Navigate to="/guides/golden-visa-uae" replace />} />
                <Route path="/guides" element={<Guides />} />
                <Route path="/guides/golden-visa-uae" element={<GoldenVisaGuide />} />
                <Route path="/rent-guide" element={<RentGuide />} />
                <Route path="/tenant-guide" element={<TenantGuide />} />
                <Route path="/landlord-guide" element={<LandlordGuide />} />
                <Route path="/landlord-portal" element={<LandlordRentalPortal />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/partners/mortgage" element={<PartnerMortgage />} />
                <Route path="/partners/legal" element={<PartnerLegal />} />
                <Route path="/partners/company-setup" element={<PartnerCompanySetup />} />
                <Route path="/partners/visa-services" element={<PartnerVisaServices />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/investor-education" element={<InvestorEducation />} />
                <Route path="/investor-faq" element={<InvestorFAQ />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-dashboard" element={<MyDashboard />} />
                <Route path="/my-dashboard/progress" element={<MyDashboardProgress />} />
                <Route path="/my-dashboard/activity" element={<MyDashboardActivity />} />
                <Route path="/investor-dashboard" element={<InvestorDashboard />} />
                <Route path="/investor-dashboard/portfolio" element={<PortfolioViews />} />
                <Route path="/investor-dashboard/reports" element={<ReportAccess />} />
                <Route path="/owner-dashboard" element={<Navigate to="/owner" replace />} />
                {/* Removed duplicate /admin/crm route - using redirect below */}
                <Route path="/broker-education" element={<BrokerEducation />} />
                <Route path="/broker-faq" element={<BrokerFAQ />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/quiz-results" element={<QuizResults />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                {/* Alias: older homepage CTA pointed to /mortgage */}
                <Route path="/mortgage" element={<Navigate to="/mortgage-calculator" replace />} />
                <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
                <Route path="/market-report" element={<MarketReport />} />
                <Route path="/market-intelligence" element={<MarketIntelligence />} />
                <Route path="/market-intelligence/overview" element={<MarketOverview />} />
                <Route path="/market-intelligence/areas" element={<AreaIntelligence />} />
                <Route path="/market-intelligence/areas/:slug" element={<MarketAreaDetail />} />
                <Route path="/market-intelligence/reports" element={<MarketReportsPage />} />
                <Route path="/market-intelligence/reports/monthly/:period" element={<MonthlyMarketBrief />} />
                <Route path="/market-intelligence/reports/quarterly/:period" element={<QuarterlyMarketReview />} />
                <Route path="/market-intelligence/reports/annual/:year" element={<AnnualMarketSummary />} />
                <Route path="/market-intelligence/methodology" element={<Methodology />} />
                <Route path="/internal/market-intelligence/dashboard" element={<OwnerGuard><InternalDashboard /></OwnerGuard>} />
                <Route path="/internal/market-intelligence/brokers" element={<OwnerGuard><BrokerIntelligence /></OwnerGuard>} />
                <Route path="/internal/market-intelligence/ai-insights" element={<OwnerGuard><AIInsights /></OwnerGuard>} />
                <Route path="/internal/market-intelligence/data-ops" element={<OwnerGuard><DataOperations /></OwnerGuard>} />
                <Route path="/insights" element={<MarketIntelligence />} />
                <Route path="/client-portal" element={<ClientPortal />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/admin" element={<OwnerGuard><Admin /></OwnerGuard>} />
                <Route path="/admin/leads" element={<OwnerGuard><AdminLeads /></OwnerGuard>} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/disclaimers" element={<Disclaimers />} />
                <Route path="/trust-and-audit-center" element={<TrustAndAuditCenter />} />
                
                {/* Blueprint routes - New pages */}
                <Route path="/sell" element={<SellWithUs />} />
                <Route path="/sell/valuation" element={<RequestValuation />} />
                <Route path="/property-management/list" element={<LandlordListForm />} />
                <Route path="/investors" element={<InvestorServices />} />
                <Route path="/investors/join" element={<JoinInvestorList />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/thank-you" element={<ThankYou />} />
                
                {/* Blueprint route aliases/redirects */}
                <Route path="/buy" element={<Navigate to="/properties?transactionType=buy" replace />} />
                <Route path="/rent" element={<Navigate to="/properties?transactionType=rent" replace />} />
                <Route path="/property-management" element={<Navigate to="/services/property-management" replace />} />
                <Route path="/guides/buying" element={<Navigate to="/buyer-guide" replace />} />
                <Route path="/guides/renting" element={<Navigate to="/rent-guide" replace />} />
                <Route path="/guides/selling" element={<Navigate to="/seller-guide" replace />} />
                <Route path="/guides/landlords" element={<Navigate to="/landlord-guide" replace />} />
                <Route path="/blog" element={<Navigate to="/news" replace />} />
                <Route path="/governance/partners" element={<PartnerGovernance />} />
                <Route path="/founder" element={<Founder />} />
                <Route path="/awards" element={<Awards />} />
                <Route path="/press-kit" element={<PressKit />} />
                <Route path="/company-profile" element={<CompanyProfile />} />
                <Route path="/philanthropy" element={<Philanthropy />} />
                <Route path="/news" element={<News />} />
                <Route path="/broker-toolkit" element={<BrokerToolkit />} />
                {/* Alias: historical Broker Toolkit dashboard URL */}
                <Route path="/broker-toolkit/dashboard" element={<Navigate to="/broker-dashboard" replace />} />
                <Route path="/broker-dashboard" element={<BrokerDashboard />} />
                <Route path="/broker-resources" element={<BrokerResources />} />
                <Route path="/broker/training" element={<BrokerTraining />} />
                <Route path="/ai-broker-workspace" element={<AIBrokerWorkspace />} />
                <Route path="/ai-hub" element={<AIHub />} />
                <Route path="/assistant-hub" element={<Navigate to="/ai-hub" replace />} />
                <Route path="/interior-design-ai" element={<InteriorDesignAI />} />
                <Route path="/property-evaluator" element={<PropertyEvaluator />} />
                <Route path="/ai-property-analyzer" element={<AIPropertyAnalyzerPage />} />
                <Route path="/ai-lead-qualification" element={<BrokerGuard><AILeadQualificationPage /></BrokerGuard>} />
                <Route path="/ai-price-predictor" element={<AIPricePredictorPage />} />
                <Route path="/ai-neighborhood-insights" element={<AINeighborhoodInsightsPage />} />
                <Route path="/ai-roi-calculator" element={<AIROICalculatorPage />} />
                <Route path="/ai-competitor-analysis" element={<AICompetitorAnalysisPage />} />
                <Route path="/ai-market-report" element={<AIMarketReportPage />} />
                <Route path="/ai-objection-handler" element={<BrokerGuard><AIObjectionHandlerPage /></BrokerGuard>} />
                <Route path="/ai-followup-scheduler" element={<BrokerGuard><AIFollowupSchedulerPage /></BrokerGuard>} />
                <Route path="/ai-follow-up-scheduler" element={<Navigate to="/ai-followup-scheduler" replace />} />
                <Route path="/ai-meeting-summarizer" element={<BrokerGuard><AIMeetingSummarizerPage /></BrokerGuard>} />
                <Route path="/ai-translation-hub" element={<AITranslationHubPage />} />
                <Route path="/ai-video-tour-script" element={<AIVideoTourScriptPage />} />
                <Route path="/ai-contract-reviewer" element={<BrokerGuard><AIContractReviewerPage /></BrokerGuard>} />
                <Route path="/ai-document-generator" element={<AIDocumentGeneratorPage />} />
                <Route path="/ai-call-summarizer" element={<BrokerGuard><AICallSummarizerPage /></BrokerGuard>} />
                <Route path="/meeting-center" element={<BrokerGuard><MeetingCenter /></BrokerGuard>} />
                <Route path="/voice-settings" element={<VoiceAgentSettings />} />
                <Route path="/document-scanner" element={<ScanSignDocuments />} />
                <Route path="/scan-sign" element={<Navigate to="/document-scanner" replace />} />
                <Route path="/scan-sign-documents" element={<Navigate to="/document-scanner" replace />} />
                <Route path="/property-measurement" element={<PropertyMeasurement />} />
                <Route path="/rental-index" element={<RentalIndex />} />
                <Route path="/ai-calendar" element={<AICalendar />} />
                <Route path="/ai-budget-planner" element={<AIFinancialAdvisor />} />
                <Route path="/ai-financial-advisor" element={<Navigate to="/ai-budget-planner" replace />} />
                <Route path="/ai-personal-shopper" element={<AIPersonalShopper />} />
                {/* Alias: AI Home Finder redirect to quiz */}
                <Route path="/ai-home-finder" element={<Navigate to="/quiz" replace />} />
                <Route path="/tools-guide" element={<Navigate to="/ai-hub" replace />} />
                <Route path="/my-ai-history" element={<MyAIHistory />} />
                {/* New AI Tools - Recently Developed */}
                <Route path="/ai-client-matcher" element={<BrokerGuard><AIClientMatcherPage /></BrokerGuard>} />
                <Route path="/ai-email-generator" element={<AIEmailGeneratorPage />} />
                <Route path="/ai-social-media" element={<AISocialMediaPage />} />
                <Route path="/ai-investment-report" element={<AIInvestmentReportPage />} />
                <Route path="/ai-description-writer" element={<AIDescriptionWriterPage />} />
                <Route path="/intellectual-property" element={<IntellectualProperty />} />
                <Route path="/services/architecture" element={<Architecture />} />
                <Route path="/services/interior-design" element={<InteriorDesign />} />
                <Route path="/services/fit-out" element={<FitOut />} />
                <Route path="/services/design-build" element={<DesignBuild />} />
                <Route path="/services/law-firm" element={<LawFirm />} />
                <Route path="/services/buying-advisory" element={<BuyingAdvisory />} />
                <Route path="/services/selling-advisory" element={<SellingAdvisory />} />
                <Route path="/services/rental-advisory" element={<RentalAdvisory />} />
                <Route path="/services/investment-advisory" element={<InvestmentAdvisory />} />
                <Route path="/services/partner-introductions" element={<Navigate to="/partners" replace />} />
                <Route path="/services/snagging" element={<Snagging />} />
                <Route path="/services/property-management" element={<PropertyManagement />} />
                <Route path="/services/short-term-rentals" element={<ShortTermRentals />} />
                <Route path="/services/currency-exchange" element={<CurrencyExchange />} />
                <Route path="/services/concierge" element={<Concierge />} />
                <Route path="/services/company-setup" element={<CompanySetup />} />
                <Route path="/services/signature-collection" element={<SignatureCollection />} />
                <Route path="/services/ai-tools" element={<AITools />} />
                <Route path="/services/broker-certification" element={<BrokerCertification />} />
                <Route path="/services/complaint-procedures" element={<ComplaintProcedures />} />
                <Route path="/services/customer-happiness-center" element={<CustomerHappinessCenter />} />
                <Route path="/services/testimonials" element={<TestimonialsPage />} />
                <Route path="/referral-partner" element={<ReferralPartner />} />
                <Route path="/referral" element={<Navigate to="/referral-onboarding" replace />} />
                {/* Install page removed - PWA disabled */}
                <Route path="/crm" element={(
                  <OwnerGuard>
                    <RouteErrorBoundary routeName="CRM">
                      <CRM />
                    </RouteErrorBoundary>
                  </OwnerGuard>
                )} />
                <Route path="/crm/leads/:id" element={<OwnerGuard><CRMLeadDetail /></OwnerGuard>} />
                <Route path="/crm/leads" element={<OwnerGuard><CRMLeadsInbox /></OwnerGuard>} />
                {/* Owner routes moved to dedicated shell above - these are now handled by OwnerDashboardShell */}
                <Route path="/crm/tasks" element={<OwnerGuard><CRMTasks /></OwnerGuard>} />
                <Route path="/crm/calendar" element={<OwnerGuard><CRMCalendar /></OwnerGuard>} />
                <Route path="/crm/notes" element={<OwnerGuard><CRMNotes /></OwnerGuard>} />
                <Route path="/crm/reminders" element={<OwnerGuard><CRMReminders /></OwnerGuard>} />
                <Route path="/crm/employees" element={<OwnerGuard><CRMEmployees /></OwnerGuard>} />
                
                <Route path="/admin/crm" element={<OwnerGuard><AdminCRM /></OwnerGuard>} />
                <Route path="/join" element={<JoinApplication />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/onboarding/module/:moduleId" element={<OnboardingModule />} />
                <Route path="/admin/onboarding" element={<OwnerGuard><AdminOnboarding /></OwnerGuard>} />
                <Route path="/admin/roles" element={<OwnerGuard><AdminRoleManagement /></OwnerGuard>} />
                <Route path="/verify-certificate/:token" element={<VerifyCertificate />} />
                <Route path="/map" element={<PropertyMap />} />
                <Route path="/admin/developers" element={<OwnerGuard><AdminDevelopers /></OwnerGuard>} />
                <Route path="/admin/marketing-hub" element={<OwnerGuard><MarketingHub /></OwnerGuard>} />
                <Route path="/admin/reelly-import-test" element={<OwnerGuard><ListingAdminGuard><ReellyImportTest /></ListingAdminGuard></OwnerGuard>} />
                <Route path="/my-account" element={<BrokerAccount />} />
                <Route path="/profile" element={<UserProfile />} />
                {/* Alias: older links pointing to /account */}
                <Route path="/account" element={<Navigate to="/my-account" replace />} />
                <Route path="/hr-agent" element={<OwnerGuard><HRAgent /></OwnerGuard>} />
                <Route path="/referral-onboarding" element={<ReferralOnboarding />} />
                <Route path="/referral-admin" element={<OwnerGuard><ReferralAdmin /></OwnerGuard>} />
                <Route path="/redeem-referral" element={<RedeemReferral />} />
                <Route path="/signature-studio" element={<Navigate to="/document-scanner" replace />} />
                <Route path="/spreadsheet" element={<Spreadsheet />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/contract-forms" element={<ContractForms />} />
                <Route path="/video-meeting" element={<VideoMeeting />} />
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
                <Route path="/founder-assistant" element={<OwnerGuard><FoundersAssistant /></OwnerGuard>} />
                <Route path="/broker-admin-assistant" element={<OwnerGuard><BrokerAdminAssistant /></OwnerGuard>} />
                <Route path="/listing-admin" element={<OwnerGuard><ListingAdminGuard><ListingAdmin /></ListingAdminGuard></OwnerGuard>} />
                <Route path="/listing-admin/preview/:id" element={<OwnerGuard><ListingAdminGuard><PendingImportPreview /></ListingAdminGuard></OwnerGuard>} />
                <Route path="/admin/training-guide" element={<OwnerGuard><AdminTrainingGuide /></OwnerGuard>} />
                <Route path="/team" element={<MeetTheTeam />} />
                <Route path="/meet-the-team" element={<Navigate to="/team" replace />} />
                <Route path="/brokers" element={<OurBrokers />} />
                <Route path="/employee-hub" element={<OwnerGuard><EmployeeHub /></OwnerGuard>} />
                <Route path="/employee-chat" element={<OwnerGuard><EmployeeChatPage /></OwnerGuard>} />
                <Route path="/governance/ai" element={<OwnerGuard><AIGovernance /></OwnerGuard>} />
                <Route path="/governance/institutional-lock" element={<OwnerGuard><InstitutionalLock /></OwnerGuard>} />
                <Route path="/governance/methodology" element={<OwnerGuard><GovernmentMethodology /></OwnerGuard>} />
                
                {/* Support Ticket Hub - Owner only */}
                <Route path="/customer-happiness/tickets" element={<OwnerGuard><SupportTicketHub /></OwnerGuard>} />
                
                {/* My Tickets - Public for tracking */}
                <Route path="/my-tickets" element={<MyTickets />} />
                
                {/* Reopen Ticket - Public for email links */}
                <Route path="/reopen-ticket" element={<ReopenTicket />} />
                
                {/* Communication & Productivity Tools - Owner-only */}
                <Route path="/automations" element={<OwnerGuard><Automations /></OwnerGuard>} />
                <Route path="/company-comm" element={<OwnerGuard><CompanyComm /></OwnerGuard>} />
                <Route path="/email-client" element={<OwnerGuard><EmailClient /></OwnerGuard>} />
                <Route path="/team-chat" element={<OwnerGuard><TeamChat /></OwnerGuard>} />
                <Route path="/kanban" element={<OwnerGuard><KanbanBoard /></OwnerGuard>} />
                <Route path="/whiteboard" element={<OwnerGuard><Whiteboard /></OwnerGuard>} />
                <Route path="/mindmap" element={<OwnerGuard><MindMap /></OwnerGuard>} />
                <Route path="/presentations" element={<OwnerGuard><Presentations /></OwnerGuard>} />
                <Route path="/form-builder" element={<OwnerGuard><FormBuilder /></OwnerGuard>} />
                
                {/* Creative Suite - Owner-only */}
                <Route path="/studio" element={<OwnerGuard><Studio /></OwnerGuard>} />
                <Route path="/studio/editor/:projectId" element={<OwnerGuard><StudioEditor /></OwnerGuard>} />
                <Route path="/studio/settings" element={<OwnerGuard><StudioSettings /></OwnerGuard>} />
                
                {/* E-Signature Routes */}
                <Route path="/e-signature" element={
                  <OwnerGuard>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                      <ESignatureDashboard />
                    </Suspense>
                  </OwnerGuard>
                } />
                <Route path="/e-signature/create" element={
                  <OwnerGuard>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                      <CreateEnvelope />
                    </Suspense>
                  </OwnerGuard>
                } />
                <Route path="/e-signature/:id" element={
                  <OwnerGuard>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                      <EnvelopeDetail />
                    </Suspense>
                  </OwnerGuard>
                } />
                
                {/* Settings redirect - prevent 404 */}
                <Route path="/settings" element={<Navigate to="/profile?tab=settings" replace />} />
                
{/* Toolkit Routes */}
                <Route path="/toolkit" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <RoyalToolsHub />
                  </Suspense>
                } />
                <Route path="/royal-tools" element={<Navigate to="/toolkit" replace />} />
                
                {/* Business Suite Routes */}
                <Route path="/business-suite/real-estate" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <RealEstateSuite />
                  </Suspense>
                } />
                <Route path="/business-suite/broker" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <BrokerGuard><BrokerSuite /></BrokerGuard>
                  </Suspense>
                } />
                <Route path="/business-suite/creative" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <CreativeSuite />
                  </Suspense>
                } />
                <Route path="/business-suite/productivity" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <ProductivitySuite />
                  </Suspense>
                } />
                
                {/* NEW: Master Suite Routes */}
                <Route path="/toolkit/video-suite" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <VideoSuite />
                  </Suspense>
                } />
                <Route path="/toolkit/voice-suite" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <VoiceSuite />
                  </Suspense>
                } />
                <Route path="/toolkit/photo-suite" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <PhotoSuite />
                  </Suspense>
                } />
                <Route path="/toolkit/pdf-suite" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <PDFSuite />
                  </Suspense>
                } />
                <Route path="/toolkit/property-suite" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <PropertySuite />
                  </Suspense>
                } />
                <Route path="/toolkit/video-resize-pack" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <VideoResizePack />
                  </Suspense>
                } />
                <Route path="/toolkit/smart-reframe" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <VideoResizePack />
                  </Suspense>
                } />
                <Route path="/toolkit/pdf-from-photos" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <PdfFromPhotos />
                  </Suspense>
                } />
                <Route path="/toolkit/pdf-editor" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <PDFEditor />
                  </Suspense>
                } />
                <Route path="/toolkit/image-resize" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <ImageResize />
                  </Suspense>
                } />
                <Route path="/toolkit/voice-studio" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <VoiceStudio />
                  </Suspense>
                } />
                <Route path="/toolkit/ai-video-studio" element={
                  <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <AIVideoStudioPage />
                  </Suspense>
                } />
                <Route path="/toolkit/captions-translate" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <CaptionsTranslate />
                  </Suspense>
                } />
                <Route path="/toolkit/background-ai" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <BackgroundAI />
                  </Suspense>
                } />
                <Route path="/toolkit/beauty-filters" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <BeautyFilters />
                  </Suspense>
                } />
                
                {/* Owner-only System Tools */}
                <Route path="/customer-happiness" element={<OwnerGuard><CustomerHappiness /></OwnerGuard>} />
                <Route path="/sitemap" element={<Sitemap />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/security-console" element={<OwnerGuard><SecurityConsole /></OwnerGuard>} />
                <Route path="/it-department" element={<OwnerGuard><EmployeeManagementHub /></OwnerGuard>} />
                <Route path="/employee-management" element={<OwnerGuard><EmployeeManagementHub /></OwnerGuard>} />
                <Route path="/hr-dashboard" element={<OwnerGuard><HRDashboard /></OwnerGuard>} />
                <Route path="/hr-hub" element={<Navigate to="/employee-management" replace />} />
                <Route path="/interior-design-studio" element={<Navigate to="/interior-design-ai" replace />} />
                
                <Route path="*" element={<NotFound />} />
              </Route>
              </Routes>
                  </PopupCoordinatorProvider>
                </ActiveLeadProvider>
              </PodcastVisibilityProvider>
            </FounderVisibilityProvider>
            </UserModeProvider>
            </AuthProvider>
          </BrowserRouter>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
