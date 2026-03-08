import React, { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SafeTooltipProvider } from "@/components/ui/SafeTooltipProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

// Toolkit pages (lazy loaded)
const RoyalToolsHub = lazy(() => import("./pages/toolkit/RoyalToolsHub"));
// ToolkitLanding removed - no route uses it
const VideoResizePack = lazy(() => import("./pages/toolkit/VideoResizePack"));
const PdfFromPhotos = lazy(() => import("./pages/toolkit/PdfFromPhotos"));
const ImageResize = lazy(() => import("./pages/toolkit/ImageResize"));
const VoiceStudio = lazy(() => import("./pages/toolkit/VoiceStudio"));
const VoiceStudioPro = lazy(() => import("./pages/toolkit/VoiceStudioPro"));
const AIVideoStudioPage = lazy(() => import("./pages/toolkit/AIVideoStudioPage"));
const StampGeneratorLanding = lazy(() => import("./pages/toolkit/StampGeneratorPage"));
const ScanSignToolkitPage = lazy(() => import("./pages/toolkit/ScanSignPage"));
const StampProjectsDashboard = lazy(() => import("./components/stamp-generator/StampProjectsDashboard"));
const StampProjectWizard = lazy(() => import("./components/stamp-generator/StampProjectWizard"));
const StampGeneratorMain = lazy(() => import("./components/stamp-generator/StampGeneratorPage"));
const StampExportPage = lazy(() => import("./components/stamp-generator/StampExportPage"));
const StampGalleryPage = lazy(() => import("./components/stamp-generator/StampGalleryPage"));
const StampHistoryDashboard = lazy(() => import("./components/stamp-generator/StampHistoryDashboard"));
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
// NEW: Corporate Suite Pages
const CorporateSuite = lazy(() => import("./pages/toolkit/CorporateSuite"));
const BusinessCardDesigner = lazy(() => import("./components/corporate-suite/BusinessCardDesigner"));
const CVResumeBuilder = lazy(() => import("./components/corporate-suite/CVResumeBuilder"));
const CoverLetterGenerator = lazy(() => import("./components/corporate-suite/CoverLetterGenerator"));
const LandingPageBuilder = lazy(() => import("./components/corporate-suite/LandingPageBuilder"));
const LogoCreator = lazy(() => import("./components/corporate-suite/LogoCreator"));
const CompanyProfileBuilder = lazy(() => import("./components/corporate-suite/CompanyProfileBuilder"));
// NEW: Business Suite Pages
const AllToolsSuite = lazy(() => import("./pages/business-suite/AllToolsSuite"));
const RealEstateSuite = lazy(() => import("./pages/business-suite/RealEstateSuite"));
const BrokerSuite = lazy(() => import("./pages/business-suite/BrokerSuite"));
const CreativeSuite = lazy(() => import("./pages/business-suite/CreativeSuite"));
const ProductivitySuite = lazy(() => import("./pages/business-suite/ProductivitySuite"));
const SuitesHub = lazy(() => import("./pages/business-suite/SuitesHub"));
const EducationHub = lazy(() => import("./pages/EducationHub"));
const AdminChatDashboard = lazy(() => import("./pages/admin/AdminChatDashboard"));
const AdminIntelligence = lazy(() => import("./pages/admin/AdminIntelligence"));
const InquiryManagementHub = lazy(() => import("./pages/admin/InquiryManagementHub"));
import { AuthProvider } from "@/contexts/AuthContext";
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
// Homepage - lazy loaded like all other pages for smaller initial bundle
const Index = lazy(() => import("./pages/Index"));

// Core pages - lazy loaded for faster initial bundle
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
const Auth = lazy(() => import("./pages/Auth"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));
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

// E-Signature Pages
const ESignatureDashboard = lazy(() => import("./pages/e-signature/ESignatureDashboard"));
const CreateEnvelope = lazy(() => import("./pages/e-signature/CreateEnvelope"));
const EnvelopeDetail = lazy(() => import("./pages/e-signature/EnvelopeDetail"));
const SignDocument = lazy(() => import("./pages/e-signature/SignDocument"));
const SignatureStudio = lazy(() => import("./pages/e-signature/SignatureStudio"));
const ContractReview = lazy(() => import("./pages/e-signature/ContractReview"));
// AI Pages - lazy loaded
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

// Service pages - lazy loaded
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

// CRM & Admin pages - lazy loaded
const CRM = lazy(() => import("./pages/CRM"));
const CRMLeadDetail = lazy(() => import("./pages/CRMLeadDetail"));
const Automations = lazy(() => import("./pages/Automations"));
const SupportTicketHub = lazy(() => import("./pages/SupportTicketHub"));
const MyTickets = lazy(() => import("./pages/client/MyTickets"));
const ReopenTicket = lazy(() => import("./pages/ReopenTicket"));
const CRMTasks = lazy(() => import("./pages/CRMTasks"));
const CRMCalendar = lazy(() => import("./pages/CRMCalendar"));
const CRMNotes = lazy(() => import("./pages/CRMNotes"));
const CRMReminders = lazy(() => import("./pages/CRMReminders"));
const CRMEmployees = lazy(() => import("./pages/CRMEmployees"));
const OwnerDashboardOverview = lazy(() => import("./pages/OwnerDashboardOverview"));
const OwnerDashboardShell = lazy(() => import("./pages/OwnerDashboardShell"));
const CRMLeadsInbox = lazy(() => import("./pages/CRMLeadsInbox"));
const OwnerInbox = lazy(() => import("./pages/OwnerInbox"));
const OwnerTemplates = lazy(() => import("./pages/OwnerTemplates"));
const OwnerCommSettings = lazy(() => import("./pages/OwnerCommSettings"));
const OwnerAgenda = lazy(() => import("./pages/OwnerAgenda"));
const OwnerFeatureRegistry = lazy(() => import("./pages/OwnerFeatureRegistry"));

const AdminCRM = lazy(() => import("./pages/AdminCRM"));
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
const JobOfferTemplate = lazy(() => import("./pages/JobOfferTemplate"));
const OwnerRecommendations = lazy(() => import("./pages/OwnerRecommendations"));
const ContractForms = lazy(() => import("./pages/ContractForms"));
const VideoMeeting = lazy(() => import("./pages/VideoMeeting"));
// More admin & utility pages - lazy loaded
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
// OwnerDashboard and BrokerPartnerDashboard removed - no route uses them

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
const FoundersAssistant = lazy(() => import("./pages/FoundersAssistant"));
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

// Communication & Productivity Tools - lazy loaded
const CompanyComm = lazy(() => import("./pages/CompanyComm"));

// Creative Suite - lazy loaded
const Studio = lazy(() => import("./pages/Studio"));
const StudioEditor = lazy(() => import("./pages/StudioEditor"));
const StudioSettings = lazy(() => import("./pages/StudioSettings"));
const EmailClient = lazy(() => import("./pages/EmailClient"));
const TeamChat = lazy(() => import("./pages/TeamChat"));
const KanbanBoard = lazy(() => import("./pages/KanbanBoard"));
const Whiteboard = lazy(() => import("./pages/Whiteboard"));
const MindMap = lazy(() => import("./pages/MindMap"));
const Presentations = lazy(() => import("./pages/Presentations"));
const FormBuilder = lazy(() => import("./pages/FormBuilder"));

// Admin & System Tools - lazy loaded
const CustomerHappiness = lazy(() => import("./pages/CustomerHappiness"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const Pricing = lazy(() => import("./pages/Pricing"));
const SecurityConsole = lazy(() => import("./pages/SecurityConsole"));
// ITDepartment removed - route uses EmployeeManagementHub instead
const EmployeeManagementHub = lazy(() => import("./pages/EmployeeManagementHub"));
const MarketingHub = lazy(() => import("./pages/admin/MarketingHub"));
const ReellyImportTest = lazy(() => import("./pages/admin/ReellyImportTest"));

// Hidden pages (not in navigation, noindex) - lazy loaded
const DigitalCard = lazy(() => import("./pages/DigitalCard"));

// Blueprint pages - lazy loaded
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

// Owner Pages - lazy loaded
const OwnerAuditPage = lazy(() => import("./pages/owner/OwnerAuditPage"));
const OwnerIntegrationsPage = lazy(() => import("./pages/owner/OwnerIntegrationsPage"));
const OwnerSafetyPage = lazy(() => import("./pages/owner/OwnerSafetyPage"));
const OwnerFounderSettings = lazy(() => import("./pages/owner/OwnerFounderSettings"));
const PodcastStudio = lazy(() => import("./pages/owner/PodcastStudio"));
const GlobalRecommendationsHub = lazy(() => import("./pages/owner/GlobalRecommendationsHub"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // eslint-disable-next-line no-console
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
              <UserModeProvider>
              <FounderVisibilityProvider>
                <PodcastVisibilityProvider>
                  <ActiveLeadProvider>
                    <PopupCoordinatorProvider>
                    <ScrollToTopOnMount />
                  <RouteResume />
                  <GlobalVisitorTracking />
                  <SEOBreadcrumbs />
                  
            {/* Auth route is always accessible for login */}
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<RouteErrorBoundary routeName="Auth"><Auth /></RouteErrorBoundary>} />
              {/* Access Denied page for auth-non-owner */}
              <Route path="/403" element={<AccessDenied />} />
              {/* Hidden standalone pages - no header/footer */}
              <Route path="/card" element={<DigitalCard />} />
              {/* Public shared business card page — no auth required */}
              <Route path="/card/:token" element={
                <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C8A766]"></div></div>}>
                  {React.createElement(React.lazy(() => import("./pages/SharedBusinessCard")))}
                </Suspense>
              } />
              
              {/* Ticket Survey - Standalone, no header/footer for fast load from email links */}
              <Route path="/ticket-survey" element={
                <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#FDFBF7] to-[#F5F0E6] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C8A766]"></div></div>}>
                  {React.createElement(React.lazy(() => import("./pages/TicketSurvey")))}
                </Suspense>
              } />
              <Route path="/survey" element={<Navigate to="/ticket-survey" replace />} />

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
                <Route path="founder-settings" element={<OwnerFounderSettings />} />
                <Route path="podcast-studio" element={<PodcastStudio />} />
                <Route path="properties" element={<PropertyManagement />} />
                <Route path="documents" element={<Documents />} />
                <Route path="settings" element={<OwnerCommSettings />} />
                {/* Nested CRM routes */}
                <Route path="crm" element={<CRM />} />
                <Route path="crm/leads/:id" element={<CRMLeadDetail />} />
                <Route path="crm/leads" element={<CRMLeadsInbox />} />
                <Route path="crm/tasks" element={<CRMTasks />} />
                <Route path="crm/calendar" element={<CRMCalendar />} />
                <Route path="crm/notes" element={<CRMNotes />} />
                <Route path="crm/reminders" element={<CRMReminders />} />
                <Route path="crm/employees" element={<CRMEmployees />} />
                {/* Nested admin routes */}
                <Route path="admin" element={<Admin />} />
                <Route path="admin/leads" element={<AdminLeads />} />
                <Route path="marketing-hub" element={<MarketingHub />} />
                <Route path="analytics" element={<JBJAnalyticsDashboard />} />
                <Route path="research-users" element={
                  <Suspense fallback={<PageLoader />}>
                    {React.createElement(React.lazy(() => import("./components/admin/ResearchUsersPanel")))}
                  </Suspense>
                } />
                {/* Nested tools routes */}
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
                <Route path="/news/:id" element={<NewsDetail />} />
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
                <Route path="/investor-hub" element={<InvestorHub />} />
                <Route path="/broker-hub" element={<BrokerHub />} />
                <Route path="/listing-portal" element={<ListingPortal />} />
                <Route path="/listing-portal/submit" element={<ListingPortalSubmit />} />
                <Route path="/listing-portal/my-listings" element={<ListingPortalMyListings />} />
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
                {/* Alias: older links pointing to /account */}
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
                <Route path="/owner/job-offer-template" element={<OwnerGuard><JobOfferTemplate /></OwnerGuard>} />
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
                
                {/* Ticket Survey moved to standalone route above MainLayoutWrapper */}
                
                {/* Communication & Productivity Tools - Owner-only */}
                <Route path="/automations" element={<OwnerGuard><Automations /></OwnerGuard>} />
                <Route path="/company-comm" element={<OwnerGuard><CompanyComm /></OwnerGuard>} />
                <Route path="/email-client" element={<OwnerGuard><EmailClient /></OwnerGuard>} />
                <Route path="/team-chat" element={<OwnerGuard><TeamChat /></OwnerGuard>} />
                <Route path="/kanban" element={<OwnerGuard><KanbanBoard /></OwnerGuard>} />
                <Route path="/whiteboard" element={<OwnerGuard><Whiteboard /></OwnerGuard>} />
                <Route path="/mindmap" element={<OwnerGuard><MindMap /></OwnerGuard>} />
                <Route path="/presentations" element={<Presentations />} />
                <Route path="/form-builder" element={<OwnerGuard><FormBuilder /></OwnerGuard>} />

                {/* Scan & Sign Toolkit */}
                <Route path="/toolkit/scan-sign" element={<ScanSignToolkitPage />} />

                {/* E-Sign toolkit alias */}
                <Route path="/toolkit/e-sign" element={<Navigate to="/e-signature" replace />} />

                {/* AI Stamp Generator */}
                <Route path="/toolkit/stamp-generator" element={<StampGeneratorLanding />} />
                <Route path="/toolkit/stamp-generator/projects" element={<StampProjectsDashboard />} />
                <Route path="/toolkit/stamp-generator/new" element={<StampProjectWizard />} />
                <Route path="/toolkit/stamp-generator/:projectId/generate" element={<StampGeneratorMain />} />
                <Route path="/toolkit/stamp-generator/:projectId/export/:designId" element={<StampExportPage />} />
                <Route path="/toolkit/stamp-generator/:projectId/gallery" element={<StampGalleryPage />} />
                <Route path="/toolkit/stamp-generator/history" element={<StampHistoryDashboard />} />

                {/* Corporate Document Suite */}
                <Route path="/toolkit/corporate-suite" element={<CorporateSuite />} />
                <Route path="/toolkit/corporate-suite/business-card" element={<BusinessCardDesigner />} />
                <Route path="/toolkit/corporate-suite/cv-resume" element={<CVResumeBuilder />} />
                <Route path="/toolkit/corporate-suite/cover-letter" element={<CoverLetterGenerator />} />
                <Route path="/toolkit/corporate-suite/landing-page" element={<LandingPageBuilder />} />
                <Route path="/toolkit/corporate-suite/logo-creator" element={<LogoCreator />} />
                <Route path="/toolkit/corporate-suite/company-profile" element={<CompanyProfileBuilder />} />

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
                <Route path="/e-signature/signature-studio" element={
                  <OwnerGuard>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                      <SignatureStudio />
                    </Suspense>
                  </OwnerGuard>
                } />
                <Route path="/e-signature/contract-review" element={
                  <OwnerGuard>
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                      <ContractReview />
                    </Suspense>
                  </OwnerGuard>
                } />
                
                {/* Settings redirect - prevent 404 */}
                <Route path="/settings" element={<Navigate to="/profile?tab=settings" replace />} />
                
{/* Toolkit Routes */}
                <Route path="/toolkit" element={<Navigate to="/ai-hub" replace />} />
                <Route path="/royal-tools" element={<Navigate to="/toolkit" replace />} />
                
                {/* Business Suite Routes */}
                <Route path="/business-suite/all" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <AllToolsSuite />
                  </Suspense>
                } />
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
                <Route path="/suites" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <SuitesHub />
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
                <Route path="/toolkit/voice-studio-pro" element={
                  <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div></div>}>
                    <VoiceStudioPro />
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
            </AuthProvider>
          </BrowserRouter>
        </LanguageProvider>
      </SafeTooltipProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
  );
};

export default App;
