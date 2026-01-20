import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ActiveLeadProvider } from "@/contexts/ActiveLeadContext";
import { PopupCoordinatorProvider } from "@/contexts/PopupCoordinatorContext";
import { ScrollToTopOnMount } from "@/components/ScrollToTop";
import AdminBypass from "@/components/AdminBypass";
import MainLayoutWrapper from "@/components/MainLayoutWrapper";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import GlobalVisitorTracking from "@/components/GlobalVisitorTracking";
import Index from "./pages/Index";
import Properties from "./pages/Properties";
import ProjectDetail from "./pages/ProjectDetail";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import DeveloperDetail from "./pages/DeveloperDetail";
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
import Admin from "./pages/Admin";
import AdminLeads from "./pages/AdminLeads";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import Founder from "./pages/Founder";
import Awards from "./pages/Awards";
import PressKit from "./pages/PressKit";
import CompanyProfile from "./pages/CompanyProfile";
import News from "./pages/News";
import BrokerToolkit from "./pages/BrokerToolkit";
import BrokerDashboard from "./pages/BrokerDashboard";
import AIHub from "./pages/AIHub";
import InteriorDesignAI from "./pages/InteriorDesignAI";
import PropertyEvaluator from "./pages/PropertyEvaluator";
import ScanSignDocuments from "./pages/ScanSignDocuments";
import PropertyMeasurement from "./pages/PropertyMeasurement";
import RentalIndex from "./pages/RentalIndex";
import AICalendar from "./pages/AICalendar";
import AIFinancialAdvisor from "./pages/AIFinancialAdvisor";
import AIPersonalShopper from "./pages/AIPersonalShopper";
import IntellectualProperty from "./pages/IntellectualProperty";
import Architecture from "./pages/services/Architecture";
import InteriorDesign from "./pages/services/InteriorDesign";
import FitOut from "./pages/services/FitOut";
import DesignBuild from "./pages/services/DesignBuild";
import LawFirm from "./pages/services/LawFirm";
import ReferralPartner from "./pages/ReferralPartner";
import Install from "./pages/Install";
import CRM from "./pages/CRM";
import CRMLeadDetail from "./pages/CRMLeadDetail";
import Automations from "./pages/Automations";
import CRMTasks from "./pages/CRMTasks";
import CRMCalendar from "./pages/CRMCalendar";
import CRMNotes from "./pages/CRMNotes";
import CRMReminders from "./pages/CRMReminders";
import CRMEmployees from "./pages/CRMEmployees";

import AdminCRM from "./pages/AdminCRM";
import JoinApplication from "./pages/JoinApplication";
import Onboarding from "./pages/Onboarding";
import OnboardingModule from "./pages/OnboardingModule";
import AdminOnboarding from "./pages/AdminOnboarding";
import VerifyCertificate from "./pages/VerifyCertificate";
import PropertyMap from "./pages/PropertyMap";
import AdminDevelopers from "./pages/AdminDevelopers";
import BrokerAccount from "./pages/BrokerAccount";
import HRAgent from "./pages/HRAgent";
import ReferralOnboarding from "./pages/ReferralOnboarding";
import Spreadsheet from "./pages/Spreadsheet";
import Documents from "./pages/Documents";
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
import RentGuide from "./pages/RentGuide";
import TenantGuide from "./pages/TenantGuide";
import LandlordGuide from "./pages/LandlordGuide";
import LandlordRentalPortal from "./pages/LandlordRentalPortal";
import FAQ from "./pages/FAQ";
import InvestorEducation from "./pages/InvestorEducation";
import InvestorFAQ from "./pages/InvestorFAQ";
import BrokerEducation from "./pages/BrokerEducation";
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
import SecurityConsole from "./pages/SecurityConsole";
import ITDepartment from "./pages/ITDepartment";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ActiveLeadProvider>
            <PopupCoordinatorProvider>
            <ScrollToTopOnMount />
            <GlobalVisitorTracking />
            {/* Auth route is always accessible for admin login */}
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/vapi-prompt" element={<VapiPrompt />} />
              <Route element={<MainLayoutWrapper />}>
                <Route path="/" element={<Index />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/project/:slug" element={<ProjectDetail />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/community/:slug" element={<CommunityDetail />} />
                <Route path="/developer/:slug" element={<DeveloperDetail />} />
                <Route path="/areas" element={<AreaGuides />} />
                <Route path="/area/:slug" element={<AreaDetail />} />
                <Route path="/buyer-guide" element={<BuyerGuide />} />
                <Route path="/seller-guide" element={<SellerGuide />} />
                <Route path="/seller-listing" element={<SellerListing />} />
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
                <Route path="/broker-education" element={<BrokerEducation />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/quiz-results" element={<QuizResults />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
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
                <Route path="/internal/market-intelligence/dashboard" element={<InternalDashboard />} />
                <Route path="/internal/market-intelligence/brokers" element={<BrokerIntelligence />} />
                <Route path="/internal/market-intelligence/ai-insights" element={<AIInsights />} />
                <Route path="/internal/market-intelligence/data-ops" element={<DataOperations />} />
                <Route path="/insights" element={<MarketIntelligence />} />
                <Route path="/client-portal" element={<ClientPortal />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/leads" element={<AdminLeads />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/trust-and-audit-center" element={<TrustAndAuditCenter />} />
                <Route path="/governance/partners" element={<PartnerGovernance />} />
                <Route path="/founder" element={<Founder />} />
                <Route path="/awards" element={<Awards />} />
                <Route path="/press-kit" element={<PressKit />} />
                <Route path="/company-profile" element={<CompanyProfile />} />
                <Route path="/news" element={<News />} />
                <Route path="/broker-toolkit" element={<BrokerToolkit />} />
                {/* Alias: historical Broker Toolkit dashboard URL */}
                <Route path="/broker-toolkit/dashboard" element={<Navigate to="/broker-dashboard" replace />} />
                <Route path="/broker-dashboard" element={<BrokerDashboard />} />
                <Route path="/broker/training" element={<BrokerTraining />} />
                <Route path="/ai-broker-workspace" element={<AIBrokerWorkspace />} />
                <Route path="/ai-hub" element={<AIHub />} />
                <Route path="/assistant-hub" element={<Navigate to="/ai-hub" replace />} />
                <Route path="/interior-design-ai" element={<InteriorDesignAI />} />
                <Route path="/property-evaluator" element={<PropertyEvaluator />} />
                <Route path="/document-scanner" element={<ScanSignDocuments />} />
                <Route path="/scan-sign" element={<Navigate to="/document-scanner" replace />} />
                <Route path="/property-measurement" element={<PropertyMeasurement />} />
                <Route path="/rental-index" element={<RentalIndex />} />
                <Route path="/ai-calendar" element={<AICalendar />} />
                <Route path="/ai-budget-planner" element={<AIFinancialAdvisor />} />
                <Route path="/ai-financial-advisor" element={<Navigate to="/ai-budget-planner" replace />} />
                <Route path="/ai-personal-shopper" element={<AIPersonalShopper />} />
                <Route path="/tools-guide" element={<Navigate to="/ai-hub" replace />} />
                <Route path="/intellectual-property" element={<IntellectualProperty />} />
                <Route path="/services/architecture" element={<Architecture />} />
                <Route path="/services/interior-design" element={<InteriorDesign />} />
                <Route path="/services/fit-out" element={<FitOut />} />
                <Route path="/services/design-build" element={<DesignBuild />} />
                <Route path="/services/law-firm" element={<LawFirm />} />
                <Route path="/referral-partner" element={<ReferralPartner />} />
                <Route path="/install" element={<Install />} />
                <Route path="/crm" element={(
                  <RouteErrorBoundary routeName="CRM">
                    <CRM />
                  </RouteErrorBoundary>
                )} />
                <Route path="/crm/leads/:id" element={<CRMLeadDetail />} />
                <Route path="/crm/tasks" element={<CRMTasks />} />
                <Route path="/crm/calendar" element={<CRMCalendar />} />
                <Route path="/crm/notes" element={<CRMNotes />} />
                <Route path="/crm/reminders" element={<CRMReminders />} />
                <Route path="/crm/employees" element={<CRMEmployees />} />
                
                <Route path="/admin/crm" element={<AdminCRM />} />
                <Route path="/join" element={<JoinApplication />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/onboarding/module/:moduleId" element={<OnboardingModule />} />
                <Route path="/admin/onboarding" element={<AdminOnboarding />} />
                <Route path="/verify-certificate/:token" element={<VerifyCertificate />} />
                <Route path="/map" element={<PropertyMap />} />
                <Route path="/admin/developers" element={<AdminDevelopers />} />
                <Route path="/my-account" element={<BrokerAccount />} />
                {/* Alias: older links pointing to /account */}
                <Route path="/account" element={<Navigate to="/my-account" replace />} />
                <Route path="/hr-agent" element={<HRAgent />} />
                <Route path="/referral-onboarding" element={<ReferralOnboarding />} />
                <Route path="/signature-studio" element={<Navigate to="/document-scanner" replace />} />
                <Route path="/spreadsheet" element={<Spreadsheet />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/video-meeting" element={<VideoMeeting />} />
                <Route path="/executive-assistant" element={<ExecutiveAssistant />} />
                <Route path="/call-review" element={<CallReview />} />
                <Route path="/video-builder" element={<VideoBuilder />} />
                <Route path="/business-card-scanner" element={<BusinessCardScanner />} />
                <Route path="/jbj-analytics" element={<JBJAnalyticsDashboard />} />
                <Route path="/jbj-design-studio" element={<JBJDesignStudio />} />
                <Route path="/design-studio" element={<JBJDesignStudio />} />
                <Route path="/jbj-broker-admin" element={<JBJBrokerAdmin />} />
                <Route path="/jbj-broker-dashboard" element={<JBJBrokerDashboard />} />
                <Route path="/jbj-broker-messages" element={<JBJBrokerMessages />} />
                <Route path="/jbj-broker-reports" element={<JBJBrokerReports />} />
                <Route path="/founder-assistant" element={<FoundersAssistant />} />
                <Route path="/broker-admin-assistant" element={<BrokerAdminAssistant />} />
                <Route path="/listing-admin/*" element={<ListingAdmin />} />
                <Route path="/admin/training-guide" element={<AdminTrainingGuide />} />
                <Route path="/team" element={<MeetTheTeam />} />
                <Route path="/meet-the-team" element={<Navigate to="/team" replace />} />
                <Route path="/brokers" element={<OurBrokers />} />
                <Route path="/employee-hub" element={<EmployeeHub />} />
                <Route path="/employee-chat" element={<EmployeeChatPage />} />
                <Route path="/governance/ai" element={<AIGovernance />} />
                <Route path="/governance/institutional-lock" element={<InstitutionalLock />} />
                <Route path="/governance/methodology" element={<GovernmentMethodology />} />
                
                {/* Communication & Productivity Tools */}
                <Route path="/automations" element={<Automations />} />
                <Route path="/company-comm" element={<CompanyComm />} />
                <Route path="/email-client" element={<EmailClient />} />
                <Route path="/team-chat" element={<TeamChat />} />
                <Route path="/kanban" element={<KanbanBoard />} />
                <Route path="/whiteboard" element={<Whiteboard />} />
                <Route path="/mindmap" element={<MindMap />} />
                <Route path="/presentations" element={<Presentations />} />
                <Route path="/form-builder" element={<FormBuilder />} />
                
                {/* Admin & System Tools */}
                <Route path="/customer-happiness" element={<CustomerHappiness />} />
                <Route path="/sitemap" element={<Sitemap />} />
                <Route path="/security-console" element={<SecurityConsole />} />
                <Route path="/it-department" element={<ITDepartment />} />
                
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            </PopupCoordinatorProvider>
            </ActiveLeadProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
