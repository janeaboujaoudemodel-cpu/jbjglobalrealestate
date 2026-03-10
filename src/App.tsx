import React, { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SafeTooltipProvider } from "@/components/ui/SafeTooltipProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { BrandPaletteProvider } from "@/contexts/BrandPaletteContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ActiveLeadProvider } from "@/contexts/ActiveLeadContext";
import { PopupCoordinatorProvider } from "@/contexts/PopupCoordinatorContext";
import { FounderVisibilityProvider } from "@/contexts/FounderVisibilityContext";
import { UserModeProvider } from "@/contexts/UserModeContext";
import { PodcastVisibilityProvider } from "@/contexts/PodcastVisibilityContext";
import { ScrollToTopOnMount } from "@/components/ScrollToTop";
import RouteResume from "@/components/RouteResume";
import AdminBypass from "@/components/AdminBypass";
import ListingAdminGuard from "@/components/ListingAdminGuard";
import OwnerGuard from "@/components/OwnerGuard";
import BrokerGuard from "@/components/BrokerGuard";
import MainLayoutWrapper from "@/components/MainLayoutWrapper";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import { RedirectWithParams } from "@/components/RedirectWithParams";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import GlobalSEO from "@/components/GlobalSEO";
import SEOServiceArea from "@/components/SEOServiceArea";
import GlobalVisitorTracking from "@/components/GlobalVisitorTracking";
import SEOBreadcrumbs from "@/components/SEOBreadcrumbs";
import PageLoader from "@/components/PageLoader";

// ── Route Groups ──
import { StandaloneRoutes } from "@/routes/StandaloneRoutes";
import { OwnerRoutes } from "@/routes/OwnerRoutes";
import { ToolkitRoutes } from "@/routes/ToolkitRoutes";

// ── Lazy Page Imports ──
const Index = lazy(() => import("./pages/Index"));
const PropertiesReelly = lazy(() => import("./pages/PropertiesReelly"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Communities = lazy(() => import("./pages/Communities"));
const CommunityDetail = lazy(() => import("./pages/CommunityDetail"));
const DeveloperDetail = lazy(() => import("./pages/DeveloperDetail"));
const Developers = lazy(() => import("./pages/Developers"));
const Quiz = lazy(() => import("./pages/Quiz"));
const QuizResults = lazy(() => import("./pages/QuizResults"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const MortgageCalculator = lazy(() => import("./pages/MortgageCalculator"));
const MarketReport = lazy(() => import("./pages/MarketReport"));
const MarketIntelligence = lazy(() => import("./pages/MarketIntelligence"));
const MarketOverview = lazy(() => import("./pages/market-intelligence/MarketOverview"));
const AreaIntelligence = lazy(() => import("./pages/market-intelligence/AreaIntelligence"));
const MarketAreaDetail = lazy(() => import("./pages/market-intelligence/AreaDetail"));
const MarketReportsPage = lazy(() => import("./pages/market-intelligence/MarketReports"));
const MonthlyMarketBrief = lazy(() => import("./pages/market-intelligence/MonthlyMarketBrief"));
const QuarterlyMarketReview = lazy(() => import("./pages/market-intelligence/QuarterlyMarketReview"));
const AnnualMarketSummary = lazy(() => import("./pages/market-intelligence/AnnualMarketSummary"));
const Methodology = lazy(() => import("./pages/market-intelligence/Methodology"));
const InternalDashboard = lazy(() => import("./pages/market-intelligence/internal/InternalDashboard"));
const BrokerIntelligence = lazy(() => import("./pages/market-intelligence/internal/BrokerIntelligence"));
const AIInsights = lazy(() => import("./pages/market-intelligence/internal/AIInsights"));
const DataOperations = lazy(() => import("./pages/market-intelligence/internal/DataOperations"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Compare = lazy(() => import("./pages/Compare"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const AdminRoleManagement = lazy(() => import("./pages/AdminRoleManagement"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Founder = lazy(() => import("./pages/Founder"));
const Awards = lazy(() => import("./pages/Awards"));
const PressKit = lazy(() => import("./pages/PressKit"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const Philanthropy = lazy(() => import("./pages/Philanthropy"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const BrokerToolkit = lazy(() => import("./pages/BrokerToolkit"));
const BrokerDashboard = lazy(() => import("./pages/BrokerDashboard"));
const BrokerResources = lazy(() => import("./pages/BrokerResources"));
const AIHub = lazy(() => import("./pages/AIHub"));
const InteriorDesignAI = lazy(() => import("./pages/InteriorDesignAI"));
const InvestorHub = lazy(() => import("./pages/InvestorHub"));
const BrokerHub = lazy(() => import("./pages/BrokerHub"));
const ListingPortal = lazy(() => import("./pages/ListingPortal"));
const ListingPortalSubmit = lazy(() => import("./pages/ListingPortalSubmit"));
const ListingPortalMyListings = lazy(() => import("./pages/ListingPortalMyListings"));
const PropertyEvaluator = lazy(() => import("./pages/PropertyEvaluator"));
const ScanSignDocuments = lazy(() => import("./pages/ScanSignDocuments"));
const PropertyMeasurement = lazy(() => import("./pages/PropertyMeasurement"));
const RentalIndex = lazy(() => import("./pages/RentalIndex"));
const ResaleProperties = lazy(() => import("./pages/ResaleProperties"));
const ESignatureDashboard = lazy(() => import("./pages/e-signature/ESignatureDashboard"));
const CreateEnvelope = lazy(() => import("./pages/e-signature/CreateEnvelope"));
const EnvelopeDetail = lazy(() => import("./pages/e-signature/EnvelopeDetail"));
const SignatureStudio = lazy(() => import("./pages/e-signature/SignatureStudio"));
const ContractReview = lazy(() => import("./pages/e-signature/ContractReview"));

// AI Pages
const AICalendar = lazy(() => import("./pages/AICalendar"));
const AIFinancialAdvisor = lazy(() => import("./pages/AIFinancialAdvisor"));
const AIPersonalShopper = lazy(() => import("./pages/AIPersonalShopper"));
const AIPropertyAnalyzerPage = lazy(() => import("./pages/AIPropertyAnalyzerPage"));
const AILeadQualificationPage = lazy(() => import("./pages/AILeadQualificationPage"));
const AIPricePredictorPage = lazy(() => import("./pages/AIPricePredictorPage"));
const AINeighborhoodInsightsPage = lazy(() => import("./pages/AINeighborhoodInsightsPage"));
const AIROICalculatorPage = lazy(() => import("./pages/AIROICalculatorPage"));
const AICompetitorAnalysisPage = lazy(() => import("./pages/AICompetitorAnalysisPage"));
const AIMarketReportPage = lazy(() => import("./pages/AIMarketReportPage"));
const AIObjectionHandlerPage = lazy(() => import("./pages/AIObjectionHandlerPage"));
const AIFollowupSchedulerPage = lazy(() => import("./pages/AIFollowupSchedulerPage"));
const AIMeetingSummarizerPage = lazy(() => import("./pages/AIMeetingSummarizerPage"));
const AITranslationHubPage = lazy(() => import("./pages/AITranslationHubPage"));
const AIVideoTourScriptPage = lazy(() => import("./pages/AIVideoTourScriptPage"));
const AIContractReviewerPage = lazy(() => import("./pages/AIContractReviewerPage"));
const AIDocumentGeneratorPage = lazy(() => import("./pages/AIDocumentGeneratorPage"));
const MyAIHistory = lazy(() => import("./pages/MyAIHistory"));
const AICallSummarizerPage = lazy(() => import("./pages/AICallSummarizerPage"));
const MeetingCenter = lazy(() => import("./pages/MeetingCenter"));
const VoiceAgentSettings = lazy(() => import("./pages/VoiceAgentSettings"));
const AIClientMatcherPage = lazy(() => import("./pages/AIClientMatcherPage"));
const AIEmailGeneratorPage = lazy(() => import("./pages/AIEmailGeneratorPage"));
const AISocialMediaPage = lazy(() => import("./pages/AISocialMediaPage"));
const AIInvestmentReportPage = lazy(() => import("./pages/AIInvestmentReportPage"));
const AIDescriptionWriterPage = lazy(() => import("./pages/AIDescriptionWriterPage"));
const IntellectualProperty = lazy(() => import("./pages/IntellectualProperty"));

// Service pages
const Architecture = lazy(() => import("./pages/services/Architecture"));
const InteriorDesign = lazy(() => import("./pages/services/InteriorDesign"));
const FitOut = lazy(() => import("./pages/services/FitOut"));
const DesignBuild = lazy(() => import("./pages/services/DesignBuild"));
const LawFirm = lazy(() => import("./pages/services/LawFirm"));
const BuyingAdvisory = lazy(() => import("./pages/services/BuyingAdvisory"));
const SellingAdvisory = lazy(() => import("./pages/services/SellingAdvisory"));
const RentalAdvisory = lazy(() => import("./pages/services/RentalAdvisory"));
const InvestmentAdvisory = lazy(() => import("./pages/services/InvestmentAdvisory"));
const Snagging = lazy(() => import("./pages/services/Snagging"));
const PropertyManagement = lazy(() => import("./pages/services/PropertyManagement"));
const ShortTermRentals = lazy(() => import("./pages/services/ShortTermRentals"));
const CurrencyExchange = lazy(() => import("./pages/services/CurrencyExchange"));
const Concierge = lazy(() => import("./pages/services/Concierge"));
const CompanySetup = lazy(() => import("./pages/services/CompanySetup"));
const SignatureCollection = lazy(() => import("./pages/services/SignatureCollection"));
const AITools = lazy(() => import("./pages/services/AITools"));
const BrokerCertification = lazy(() => import("./pages/services/BrokerCertification"));
const ComplaintProcedures = lazy(() => import("./pages/services/ComplaintProcedures"));
const CustomerHappinessCenter = lazy(() => import("./pages/services/CustomerHappinessCenter"));
const TestimonialsPage = lazy(() => import("./pages/services/Testimonials"));
const ReferralPartner = lazy(() => import("./pages/ReferralPartner"));

// CRM & Admin
const CRM = lazy(() => import("./pages/CRM"));
const AdminCRM = lazy(() => import("./pages/AdminCRM"));
const AdminChatDashboard = lazy(() => import("./pages/admin/AdminChatDashboard"));
const AdminIntelligence = lazy(() => import("./pages/admin/AdminIntelligence"));
const InquiryManagementHub = lazy(() => import("./pages/admin/InquiryManagementHub"));
const JoinApplication = lazy(() => import("./pages/JoinApplication"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const OnboardingModule = lazy(() => import("./pages/OnboardingModule"));
const AdminOnboarding = lazy(() => import("./pages/AdminOnboarding"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const PropertyMap = lazy(() => import("./pages/PropertyMap"));
const AdminDevelopers = lazy(() => import("./pages/AdminDevelopers"));
const BrokerAccount = lazy(() => import("./pages/BrokerAccount"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const HRAgent = lazy(() => import("./pages/HRAgent"));
const ReferralOnboarding = lazy(() => import("./pages/ReferralOnboarding"));
const ReferralAdmin = lazy(() => import("./pages/ReferralAdmin"));
const RedeemReferral = lazy(() => import("./pages/RedeemReferral"));
const Spreadsheet = lazy(() => import("./pages/Spreadsheet"));
const Documents = lazy(() => import("./pages/Documents"));
const QRCodeGenerator = lazy(() => import("./pages/QRCodeGenerator"));
const OwnerCreativeSuite = lazy(() => import("./pages/OwnerCreativeSuite"));
const BrandPaletteHub = lazy(() => import("./pages/owner/BrandPaletteHub"));
const JobOfferTemplate = lazy(() => import("./pages/JobOfferTemplate"));
const OwnerRecommendations = lazy(() => import("./pages/OwnerRecommendations"));
const ContractForms = lazy(() => import("./pages/ContractForms"));
const VideoMeeting = lazy(() => import("./pages/VideoMeeting"));
const ExecutiveAssistant = lazy(() => import("./pages/ExecutiveAssistant"));
const CallReview = lazy(() => import("./pages/CallReview"));
const VapiPrompt = lazy(() => import("./pages/VapiPrompt"));
const VideoBuilder = lazy(() => import("./pages/VideoBuilder"));
const AreaGuides = lazy(() => import("./pages/AreaGuides"));
const AreaDetail = lazy(() => import("./pages/AreaDetail"));
const BusinessCardScanner = lazy(() => import("./pages/BusinessCardScanner"));
const BuyerGuide = lazy(() => import("./pages/BuyerGuide"));
const SellerGuide = lazy(() => import("./pages/SellerGuide"));
const SellerListing = lazy(() => import("./pages/SellerListing"));
const GoldenVisaGuide = lazy(() => import("./pages/guides/GoldenVisaGuide"));
const Guides = lazy(() => import("./pages/Guides"));
const RentGuide = lazy(() => import("./pages/RentGuide"));
const TenantGuide = lazy(() => import("./pages/TenantGuide"));
const LandlordGuide = lazy(() => import("./pages/LandlordGuide"));
const LandlordRentalPortal = lazy(() => import("./pages/LandlordRentalPortal"));
const FAQ = lazy(() => import("./pages/FAQ"));
const InvestorEducation = lazy(() => import("./pages/InvestorEducation"));
const InvestorFAQ = lazy(() => import("./pages/InvestorFAQ"));
const InvestorDashboard = lazy(() => import("./pages/InvestorDashboard"));
const PortfolioViews = lazy(() => import("./pages/investor/PortfolioViews"));
const ReportAccess = lazy(() => import("./pages/investor/ReportAccess"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyDashboard = lazy(() => import("./pages/MyDashboard"));
const MyDashboardProgress = lazy(() => import("./pages/MyDashboardProgress"));
const MyDashboardActivity = lazy(() => import("./pages/MyDashboardActivity"));
const BrokerEducation = lazy(() => import("./pages/BrokerEducation"));
const BrokerFAQ = lazy(() => import("./pages/BrokerFAQ"));
const BuyerFAQ = lazy(() => import("./pages/BuyerFAQ"));
const SellerFAQ = lazy(() => import("./pages/SellerFAQ"));
const LandlordFAQ = lazy(() => import("./pages/LandlordFAQ"));
const TenantFAQ = lazy(() => import("./pages/TenantFAQ"));
const JBJAnalyticsDashboard = lazy(() => import("./pages/JBJAnalyticsDashboard"));
const JBJDesignStudio = lazy(() => import("./pages/JBJDesignStudio"));
const AIBrokerWorkspace = lazy(() => import("./pages/AIBrokerWorkspace"));
const JBJBrokerAdmin = lazy(() => import("./pages/JBJBrokerAdmin"));
const JBJBrokerDashboard = lazy(() => import("./pages/JBJBrokerDashboard"));
const JBJBrokerMessages = lazy(() => import("./pages/JBJBrokerMessages"));
const JBJBrokerReports = lazy(() => import("./pages/JBJBrokerReports"));
const BrokerAdminAssistant = lazy(() => import("./pages/BrokerAdminAssistant"));
const ListingAdmin = lazy(() => import("./pages/ListingAdmin"));
const PendingImportPreview = lazy(() => import("./pages/listing-admin/PendingImportPreview"));
const AdminTrainingGuide = lazy(() => import("./pages/AdminTrainingGuide"));
const MeetTheTeam = lazy(() => import("./pages/MeetTheTeam"));
const OurBrokers = lazy(() => import("./pages/OurBrokers"));
const EmployeeHub = lazy(() => import("./pages/EmployeeHub"));
const BrokerTraining = lazy(() => import("./pages/broker/BrokerTraining"));
const EmployeeChatPage = lazy(() => import("./pages/EmployeeChatPage"));
const Partners = lazy(() => import("./pages/Partners"));
const PartnerMortgage = lazy(() => import("./pages/partners/PartnerMortgage"));
const PartnerLegal = lazy(() => import("./pages/partners/PartnerLegal"));
const PartnerCompanySetup = lazy(() => import("./pages/partners/PartnerCompanySetup"));
const PartnerVisaServices = lazy(() => import("./pages/partners/PartnerVisaServices"));
const TrustAndAuditCenter = lazy(() => import("./pages/TrustAndAuditCenter"));
const HRDashboard = lazy(() => import("./pages/HRDashboard"));
const ClientPortal = lazy(() => import("./pages/client/ClientPortal"));
const PartnerGovernance = lazy(() => import("./pages/governance/PartnerGovernance"));
const AIGovernance = lazy(() => import("./pages/governance/AIGovernance"));
const InstitutionalLock = lazy(() => import("./pages/governance/InstitutionalLock"));
const GovernmentMethodology = lazy(() => import("./pages/governance/GovernmentMethodology"));
const CompanyComm = lazy(() => import("./pages/CompanyComm"));
const EmailClient = lazy(() => import("./pages/EmailClient"));
const TeamChat = lazy(() => import("./pages/TeamChat"));
const KanbanBoard = lazy(() => import("./pages/KanbanBoard"));
const Whiteboard = lazy(() => import("./pages/Whiteboard"));
const MindMap = lazy(() => import("./pages/MindMap"));
const Presentations = lazy(() => import("./pages/Presentations"));
const FormBuilder = lazy(() => import("./pages/FormBuilder"));
const CustomerHappiness = lazy(() => import("./pages/CustomerHappiness"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const Pricing = lazy(() => import("./pages/Pricing"));
const SecurityConsole = lazy(() => import("./pages/SecurityConsole"));
const EmployeeManagementHub = lazy(() => import("./pages/EmployeeManagementHub"));
const MarketingHub = lazy(() => import("./pages/admin/MarketingHub"));
const ReellyImportTest = lazy(() => import("./pages/admin/ReellyImportTest"));
const SellWithUs = lazy(() => import("./pages/SellWithUs"));
const RequestValuation = lazy(() => import("./pages/RequestValuation"));
const LandlordListForm = lazy(() => import("./pages/LandlordListForm"));
const InvestorServices = lazy(() => import("./pages/InvestorServices"));
const JoinInvestorList = lazy(() => import("./pages/JoinInvestorList"));
const Reviews = lazy(() => import("./pages/Reviews"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const Disclaimers = lazy(() => import("./pages/Disclaimers"));
const TrustAndCompliance = lazy(() => import("./pages/TrustAndCompliance"));
const RiskDisclosure = lazy(() => import("./pages/RiskDisclosure"));
const AmlKycPolicy = lazy(() => import("./pages/AmlKycPolicy"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const Automations = lazy(() => import("./pages/Automations"));
const SupportTicketHub = lazy(() => import("./pages/SupportTicketHub"));
const MyTickets = lazy(() => import("./pages/client/MyTickets"));
const ReopenTicket = lazy(() => import("./pages/ReopenTicket"));
const EducationHub = lazy(() => import("./pages/EducationHub"));

// ── QueryClient ──
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  return (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SafeTooltipProvider>
        <LanguageProvider>
          <GlobalSEO />
          <SEOServiceArea />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
            <BrandPaletteProvider>
              <UserModeProvider>
              <FounderVisibilityProvider>
                <PodcastVisibilityProvider>
                  <ActiveLeadProvider>
                    <PopupCoordinatorProvider>
                    <ScrollToTopOnMount />
                  <RouteResume />
                  <GlobalVisitorTracking />
                  <SEOBreadcrumbs />
                  
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Standalone Routes (no shell) ── */}
              {StandaloneRoutes()}

              {/* ── Owner Command Center ── */}
              {OwnerRoutes()}
              
              {/* ── Main Layout Routes ── */}
              <Route element={<AdminBypass><MainLayoutWrapper /></AdminBypass>}>
                <Route path="/vapi-prompt" element={<VapiPrompt />} />
                <Route path="/" element={<Index />} />
                <Route path="/properties" element={<PropertiesReelly />} />
                <Route path="/project/:slug" element={<ProjectDetail />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/community/:slug" element={<CommunityDetail />} />
                <Route path="/developers" element={<Developers />} />
                <Route path="/developer/:slug" element={<DeveloperDetail />} />
                <Route path="/developers/:slug" element={<RedirectWithParams to="/developer" />} />
                <Route path="/areas" element={<AreaGuides />} />
                <Route path="/area/:slug" element={<AreaDetail />} />
                <Route path="/areas/:slug" element={<RedirectWithParams to="/area" />} />
                <Route path="/buyer-guide" element={<BuyerGuide />} />
                <Route path="/seller-guide" element={<SellerGuide />} />
                <Route path="/seller-listing" element={<SellerListing />} />
                <Route path="/golden-visa" element={<Navigate to="/guides/golden-visa-uae" replace />} />
                <Route path="/guides" element={<Guides />} />
                <Route path="/education-hub" element={<EducationHub />} />
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
                <Route path="/buyer-faq" element={<BuyerFAQ />} />
                <Route path="/seller-faq" element={<SellerFAQ />} />
                <Route path="/landlord-faq" element={<LandlordFAQ />} />
                <Route path="/tenant-faq" element={<TenantFAQ />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-dashboard" element={<MyDashboard />} />
                <Route path="/my-dashboard/progress" element={<MyDashboardProgress />} />
                <Route path="/my-dashboard/activity" element={<MyDashboardActivity />} />
                <Route path="/my-activity" element={<Navigate to="/my-dashboard/activity" replace />} />
                <Route path="/investor-dashboard" element={<InvestorDashboard />} />
                <Route path="/investor-dashboard/portfolio" element={<PortfolioViews />} />
                <Route path="/investor-dashboard/reports" element={<ReportAccess />} />
                <Route path="/owner-dashboard" element={<Navigate to="/owner" replace />} />
                <Route path="/broker-education" element={<BrokerEducation />} />
                <Route path="/broker-faq" element={<BrokerFAQ />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/quiz-results" element={<QuizResults />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
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
                <Route path="/admin/inquiries" element={<OwnerGuard><RouteErrorBoundary routeName="Inquiry Management Hub"><InquiryManagementHub /></RouteErrorBoundary></OwnerGuard>} />
                <Route path="/admin-inquiries" element={<OwnerGuard><RouteErrorBoundary routeName="Inquiry Management Hub"><InquiryManagementHub /></RouteErrorBoundary></OwnerGuard>} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/disclaimers" element={<Disclaimers />} />
                <Route path="/trust-and-audit-center" element={<TrustAndAuditCenter />} />
                <Route path="/trust-compliance" element={<TrustAndCompliance />} />
                <Route path="/risk-disclosure" element={<RiskDisclosure />} />
                <Route path="/aml-kyc" element={<AmlKycPolicy />} />
                <Route path="/accessibility" element={<Accessibility />} />
                
                {/* Blueprint routes */}
                <Route path="/sell" element={<SellWithUs />} />
                <Route path="/sell/valuation" element={<RequestValuation />} />
                <Route path="/property-management/list" element={<LandlordListForm />} />
                <Route path="/investors" element={<InvestorServices />} />
                <Route path="/investors/join" element={<JoinInvestorList />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/thank-you" element={<ThankYou />} />
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
                <Route path="/news/:id" element={<NewsDetail />} />
                <Route path="/broker-toolkit" element={<BrokerToolkit />} />
                <Route path="/broker-toolkit/dashboard" element={<Navigate to="/broker-dashboard" replace />} />
                <Route path="/broker-dashboard" element={<BrokerDashboard />} />
                <Route path="/broker-resources" element={<BrokerResources />} />
                <Route path="/broker/training" element={<BrokerTraining />} />
                <Route path="/ai-broker-workspace" element={<AIBrokerWorkspace />} />
                <Route path="/ai-hub" element={<AIHub />} />
                <Route path="/assistant-hub" element={<Navigate to="/ai-hub" replace />} />
                <Route path="/interior-design-ai" element={<InteriorDesignAI />} />
                <Route path="/investor-hub" element={<InvestorHub />} />
                <Route path="/broker-hub" element={<BrokerHub />} />
                <Route path="/listing-portal" element={<ListingPortal />} />
                <Route path="/listing-portal/submit" element={<ListingPortalSubmit />} />
                <Route path="/listing-portal/my-listings" element={<ListingPortalMyListings />} />
                <Route path="/property-evaluator" element={<PropertyEvaluator />} />
                <Route path="/resale-properties" element={<ResaleProperties />} />
                
                {/* AI Tools */}
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
                <Route path="/meeting-center" element={<MeetingCenter />} />
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
                <Route path="/ai-home-finder" element={<Navigate to="/quiz" replace />} />
                <Route path="/tools-guide" element={<Navigate to="/ai-hub" replace />} />
                <Route path="/my-ai-history" element={<MyAIHistory />} />
                <Route path="/ai-client-matcher" element={<BrokerGuard><AIClientMatcherPage /></BrokerGuard>} />
                <Route path="/ai-email-generator" element={<AIEmailGeneratorPage />} />
                <Route path="/ai-social-media" element={<AISocialMediaPage />} />
                <Route path="/ai-investment-report" element={<AIInvestmentReportPage />} />
                <Route path="/ai-description-writer" element={<AIDescriptionWriterPage />} />
                <Route path="/intellectual-property" element={<IntellectualProperty />} />
                
                {/* Services */}
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
                
                {/* ── CRM: Redirect legacy /crm/* to /owner/crm/* ── */}
                <Route path="/crm" element={<Navigate to="/owner/crm" replace />} />
                <Route path="/crm/*" element={<Navigate to="/owner/crm" replace />} />
                
                <Route path="/admin/crm" element={<OwnerGuard><AdminCRM /></OwnerGuard>} />
                <Route path="/admin/chat-conversations" element={<OwnerGuard><AdminChatDashboard /></OwnerGuard>} />
                <Route path="/join" element={<JoinApplication />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/onboarding/module/:moduleId" element={<OnboardingModule />} />
                <Route path="/admin/onboarding" element={<OwnerGuard><AdminOnboarding /></OwnerGuard>} />
                <Route path="/admin/roles" element={<OwnerGuard><AdminRoleManagement /></OwnerGuard>} />
                <Route path="/admin/intelligence" element={<OwnerGuard><AdminIntelligence /></OwnerGuard>} />
                <Route path="/verify-certificate/:token" element={<VerifyCertificate />} />
                <Route path="/map" element={<PropertyMap />} />
                <Route path="/admin/developers" element={<OwnerGuard><AdminDevelopers /></OwnerGuard>} />
                <Route path="/admin/marketing-hub" element={<OwnerGuard><MarketingHub /></OwnerGuard>} />
                <Route path="/admin/reelly-import-test" element={<OwnerGuard><ListingAdminGuard><ReellyImportTest /></ListingAdminGuard></OwnerGuard>} />
                <Route path="/my-account" element={<BrokerAccount />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/unsubscribe" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("./pages/Unsubscribe")))}</Suspense>} />
                <Route path="/email-preferences" element={<Suspense fallback={<PageLoader />}>{React.createElement(React.lazy(() => import("./pages/EmailPreferences")))}</Suspense>} />
                <Route path="/account" element={<Navigate to="/my-account" replace />} />
                <Route path="/hr-agent" element={<OwnerGuard><HRAgent /></OwnerGuard>} />
                <Route path="/referral-onboarding" element={<ReferralOnboarding />} />
                <Route path="/referral-admin" element={<OwnerGuard><ReferralAdmin /></OwnerGuard>} />
                <Route path="/redeem-referral" element={<RedeemReferral />} />
                <Route path="/signature-studio" element={<Navigate to="/document-scanner" replace />} />
                <Route path="/spreadsheet" element={<Spreadsheet />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/qr-generator" element={<QRCodeGenerator />} />
                <Route path="/owner/creative-suite" element={<OwnerGuard><OwnerCreativeSuite /></OwnerGuard>} />
                <Route path="/owner/brand-palette" element={<OwnerGuard><BrandPaletteHub /></OwnerGuard>} />
                <Route path="/owner/job-offer-template" element={<OwnerGuard><JobOfferTemplate /></OwnerGuard>} />
                <Route path="/owner/recommendations" element={<OwnerGuard><OwnerRecommendations /></OwnerGuard>} />
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
                <Route path="/founder-assistant" element={<Navigate to="/owner/founder-assistant" replace />} />
                <Route path="/broker-admin-assistant" element={<OwnerGuard><BrokerAdminAssistant /></OwnerGuard>} />
                <Route path="/listing-admin" element={<Navigate to="/owner/listing-admin" replace />} />
                <Route path="/listing-admin/preview/:id" element={<Navigate to="/owner/listing-admin" replace />} />
                <Route path="/admin/training-guide" element={<OwnerGuard><AdminTrainingGuide /></OwnerGuard>} />
                <Route path="/team" element={<MeetTheTeam />} />
                <Route path="/meet-the-team" element={<Navigate to="/team" replace />} />
                <Route path="/brokers" element={<OurBrokers />} />
                <Route path="/employee-hub" element={<OwnerGuard><EmployeeHub /></OwnerGuard>} />
                <Route path="/employee-chat" element={<OwnerGuard><EmployeeChatPage /></OwnerGuard>} />
                <Route path="/governance/ai" element={<OwnerGuard><AIGovernance /></OwnerGuard>} />
                <Route path="/governance/institutional-lock" element={<OwnerGuard><InstitutionalLock /></OwnerGuard>} />
                <Route path="/governance/methodology" element={<OwnerGuard><GovernmentMethodology /></OwnerGuard>} />
                <Route path="/customer-happiness/tickets" element={<OwnerGuard><SupportTicketHub /></OwnerGuard>} />
                <Route path="/my-tickets" element={<MyTickets />} />
                <Route path="/reopen-ticket" element={<ReopenTicket />} />
                
                {/* Communication & Productivity - Owner only */}
                <Route path="/automations" element={<OwnerGuard><Automations /></OwnerGuard>} />
                <Route path="/owner/automations" element={<Navigate to="/automations" replace />} />
                <Route path="/company-comm" element={<OwnerGuard><CompanyComm /></OwnerGuard>} />
                <Route path="/email-client" element={<OwnerGuard><EmailClient /></OwnerGuard>} />
                <Route path="/team-chat" element={<OwnerGuard><TeamChat /></OwnerGuard>} />
                <Route path="/kanban" element={<OwnerGuard><KanbanBoard /></OwnerGuard>} />
                <Route path="/whiteboard" element={<OwnerGuard><Whiteboard /></OwnerGuard>} />
                <Route path="/mindmap" element={<OwnerGuard><MindMap /></OwnerGuard>} />
                <Route path="/presentations" element={<Presentations />} />
                <Route path="/form-builder" element={<OwnerGuard><FormBuilder /></OwnerGuard>} />

                {/* E-Signature Routes */}
                <Route path="/e-signature" element={<OwnerGuard><ESignatureDashboard /></OwnerGuard>} />
                <Route path="/e-signature/create" element={<OwnerGuard><CreateEnvelope /></OwnerGuard>} />
                <Route path="/e-signature/:id" element={<OwnerGuard><EnvelopeDetail /></OwnerGuard>} />
                <Route path="/e-signature/signature-studio" element={<OwnerGuard><SignatureStudio /></OwnerGuard>} />
                <Route path="/e-signature/contract-review" element={<OwnerGuard><ContractReview /></OwnerGuard>} />
                
                <Route path="/settings" element={<Navigate to="/profile?tab=settings" replace />} />

                {/* ── Toolkit & Creative Routes ── */}
                {ToolkitRoutes()}
                
                {/* System Tools */}
                <Route path="/customer-happiness" element={<OwnerGuard><CustomerHappiness /></OwnerGuard>} />
                <Route path="/sitemap" element={<Sitemap />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/security-console" element={<OwnerGuard><SecurityConsole /></OwnerGuard>} />
                <Route path="/it-department" element={<OwnerGuard><EmployeeManagementHub /></OwnerGuard>} />
                <Route path="/employee-management" element={<OwnerGuard><EmployeeManagementHub /></OwnerGuard>} />
                <Route path="/hr-dashboard" element={<OwnerGuard><HRDashboard /></OwnerGuard>} />
                <Route path="/admin/hr" element={<Navigate to="/hr-dashboard?tab=cv-center" replace />} />
                <Route path="/hr-hub" element={<Navigate to="/employee-management" replace />} />
                <Route path="/interior-design-studio" element={<Navigate to="/interior-design-ai" replace />} />
                <Route path="/projects" element={<Navigate to="/properties" replace />} />
                <Route path="/projects/:slug" element={<RedirectWithParams to="/project" />} />
                
                <Route path="*" element={<NotFound />} />
              </Route>
              </Routes>
            </Suspense>
                  </PopupCoordinatorProvider>
                </ActiveLeadProvider>
              </PodcastVisibilityProvider>
            </FounderVisibilityProvider>
            </UserModeProvider>
            </BrandPaletteProvider>
            </AuthProvider>
          </BrowserRouter>
        </LanguageProvider>
      </SafeTooltipProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
  );
};

export default App;
