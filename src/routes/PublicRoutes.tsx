/**
 * Public-facing routes — properties, guides, services, company, user pages
 * These render inside MainLayoutWrapper (header + footer shell)
 */
import { createElement, lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { RedirectWithParams } from "@/components/RedirectWithParams";
import { RedirectWithSearch } from "@/routes/RedirectWithSearch";
import AuthRequiredRoute from "@/components/AuthRequiredRoute";
import ModeRequiredRoute from "@/components/ModeRequiredRoute";
import OwnerGuard from "@/components/OwnerGuard";
import { BrokerPortalRoutes } from "@/routes/BrokerPortalRoutes";
import TeamRouteGate from "@/routes/TeamRouteGate";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";
import { useUserModeContext } from "@/contexts/UserModeContext";
import GatedToolRoute from "@/components/access/GatedToolRoute";
import { toolThemes } from "@/components/tools/toolThemes";

// ── Property & Listing Pages ──
const Index = lazy(() => import("@/pages/Index"));
const MyVault = lazy(() => import("@/pages/MyVault"));
const PropertiesReelly = lazy(() => import("@/pages/PropertiesReelly"));
const Properties = lazy(() => import("@/pages/Properties"));
const ProjectDetail = lazy(() => import("@/pages/ProjectDetail"));
const Communities = lazy(() => import("@/pages/Communities"));
const CommunityDetail = lazy(() => import("@/pages/CommunityDetail"));
const Developers = lazy(() => import("@/pages/Developers"));
const DeveloperDetail = lazy(() => import("@/pages/DeveloperDetail"));
const AreaGuides = lazy(() => import("@/pages/AreaGuides"));
const AreaDetail = lazy(() => import("@/pages/AreaDetail"));
const ResaleProperties = lazy(() => import("@/pages/ResaleProperties"));
const PropertyMap = lazy(() => import("@/pages/PropertyMap"));
const ListingPortal = lazy(() => import("@/pages/ListingPortal"));
const ListingPortalSubmit = lazy(() => import("@/pages/ListingPortalSubmit"));
const ListingPortalMyListings = lazy(() => import("@/pages/ListingPortalMyListings"));
const PropertyEvaluator = lazy(() => import("@/pages/PropertyEvaluator"));
const RentalIndex = lazy(() => import("@/pages/RentalIndex"));
const SellWithUs = lazy(() => import("@/pages/SellWithUs"));
const RequestValuation = lazy(() => import("@/pages/RequestValuation"));
const LandlordListForm = lazy(() => import("@/pages/LandlordListForm"));
const ListProperty = lazy(() => import("@/pages/ListProperty"));

// ── Guides & Education ──
const BuyerGuide = lazy(() => import("@/pages/BuyerGuide"));
const SellerGuide = lazy(() => import("@/pages/SellerGuide"));
const SellerListing = lazy(() => import("@/pages/SellerListing"));
const GoldenVisaGuide = lazy(() => import("@/pages/guides/GoldenVisaGuide"));
const Guides = lazy(() => import("@/pages/Guides"));
const RentGuide = lazy(() => import("@/pages/RentGuide"));
const TenantGuide = lazy(() => import("@/pages/TenantGuide"));
const LandlordGuide = lazy(() => import("@/pages/LandlordGuide"));
const LandlordRentalPortal = lazy(() => import("@/pages/LandlordRentalPortal"));
const EducationHub = lazy(() => import("@/pages/EducationHub"));
const InvestorEducation = lazy(() => import("@/pages/InvestorEducation"));
// BrokerEducation removed — content merged into JBJ Academy (/jbj-academy)
const FAQ = lazy(() => import("@/pages/FAQ"));
const InvestorFAQ = lazy(() => import("@/pages/InvestorFAQ"));
const BuyerFAQ = lazy(() => import("@/pages/BuyerFAQ"));
const SellerFAQ = lazy(() => import("@/pages/SellerFAQ"));
const LandlordFAQ = lazy(() => import("@/pages/LandlordFAQ"));
const TenantFAQ = lazy(() => import("@/pages/TenantFAQ"));
const BrokerFAQ = lazy(() => import("@/pages/BrokerFAQ"));

// ── Market Intelligence ──
const MarketReport = lazy(() => import("@/pages/MarketReport"));
const MarketIntelligence = lazy(() => import("@/pages/MarketIntelligence"));
const MarketOverview = lazy(() => import("@/pages/market-intelligence/MarketOverview"));
const AreaIntelligence = lazy(() => import("@/pages/market-intelligence/AreaIntelligence"));
const MarketAreaDetail = lazy(() => import("@/pages/market-intelligence/AreaDetail"));
const MarketReportsPage = lazy(() => import("@/pages/market-intelligence/MarketReports"));
const MonthlyMarketBrief = lazy(() => import("@/pages/market-intelligence/MonthlyMarketBrief"));
const QuarterlyMarketReview = lazy(() => import("@/pages/market-intelligence/QuarterlyMarketReview"));
const AnnualMarketSummary = lazy(() => import("@/pages/market-intelligence/AnnualMarketSummary"));
const Methodology = lazy(() => import("@/pages/market-intelligence/Methodology"));

// ── Services ──
const Services = lazy(() => import("@/pages/Services"));
const Architecture = lazy(() => import("@/pages/services/Architecture"));
const InteriorDesign = lazy(() => import("@/pages/services/InteriorDesign"));
const FitOut = lazy(() => import("@/pages/services/FitOut"));
const DesignBuild = lazy(() => import("@/pages/services/DesignBuild"));
const LawFirm = lazy(() => import("@/pages/services/LawFirm"));
const BuyingAdvisory = lazy(() => import("@/pages/services/BuyingAdvisory"));
const SellingAdvisory = lazy(() => import("@/pages/services/SellingAdvisory"));
const RentalAdvisory = lazy(() => import("@/pages/services/RentalAdvisory"));
const InvestmentAdvisory = lazy(() => import("@/pages/services/InvestmentAdvisory"));
const Snagging = lazy(() => import("@/pages/services/Snagging"));
const PropertyManagement = lazy(() => import("@/pages/services/PropertyManagement"));
const ShortTermRentals = lazy(() => import("@/pages/services/ShortTermRentals"));
const CurrencyExchange = lazy(() => import("@/pages/services/CurrencyExchange"));
const Concierge = lazy(() => import("@/pages/services/Concierge"));
const CompanySetup = lazy(() => import("@/pages/services/CompanySetup"));
const SignatureCollection = lazy(() => import("@/pages/services/SignatureCollection"));

const BrokerCertification = lazy(() => import("@/pages/services/BrokerCertification"));
const ComplaintProcedures = lazy(() => import("@/pages/services/ComplaintProcedures"));
const CustomerHappinessCenter = lazy(() => import("@/pages/services/CustomerHappinessCenter"));
const TestimonialsPage = lazy(() => import("@/pages/services/Testimonials"));
const ReferralPartner = lazy(() => import("@/pages/ReferralPartner"));
const InvestorServices = lazy(() => import("@/pages/InvestorServices"));
const JoinInvestorList = lazy(() => import("@/pages/JoinInvestorList"));
const JoinBrokerList = lazy(() => import("@/pages/JoinBrokerList"));
const JoinDeveloperList = lazy(() => import("@/pages/JoinDeveloperList"));
const Partners = lazy(() => import("@/pages/Partners"));
const PartnerMortgage = lazy(() => import("@/pages/partners/PartnerMortgage"));
const PartnerLegal = lazy(() => import("@/pages/partners/PartnerLegal"));
const PartnerCompanySetup = lazy(() => import("@/pages/partners/PartnerCompanySetup"));
const PartnerVisaServices = lazy(() => import("@/pages/partners/PartnerVisaServices"));

// ── Company ──
const Contact = lazy(() => import("@/pages/Contact"));
const About = lazy(() => import("@/pages/About"));
const Founder = lazy(() => import("@/pages/Founder"));
const Awards = lazy(() => import("@/pages/Awards"));

const CompanyProfile = lazy(() => import("@/pages/CompanyProfile"));
const News = lazy(() => import("@/pages/News"));
const NewsDetail = lazy(() => import("@/pages/NewsDetail"));
// MeetTheTeam mounted via TeamRouteGate (toggle-controlled)

const ThankYou = lazy(() => import("@/pages/ThankYou"));

// ── Legal ──
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Cookies = lazy(() => import("@/pages/Cookies"));
const Disclaimers = lazy(() => import("@/pages/Disclaimers"));

const AmlKycPolicy = lazy(() => import("@/pages/AmlKycPolicy"));
const IntellectualProperty = lazy(() => import("@/pages/IntellectualProperty"));

// ── User / Account ──
const MortgageCalculator = lazy(() => import("@/pages/MortgageCalculator"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const Compare = lazy(() => import("@/pages/Compare"));
const CompareManual = lazy(() => import("@/pages/CompareManual"));
const Quiz = lazy(() => import("@/pages/Quiz"));
const QuizResults = lazy(() => import("@/pages/QuizResults"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const MyDashboard = lazy(() => import("@/pages/MyDashboard"));
const MyDashboardProgress = lazy(() => import("@/pages/MyDashboardProgress"));
const MyDashboardActivity = lazy(() => import("@/pages/MyDashboardActivity"));
const AccountBilling = lazy(() => import("@/pages/AccountBilling"));
const InvestorDashboard = lazy(() => import("@/pages/InvestorDashboard"));
const PortfolioViews = lazy(() => import("@/pages/investor/PortfolioViews"));
const ReportAccess = lazy(() => import("@/pages/investor/ReportAccess"));
const BrokerAccount = lazy(() => import("@/pages/BrokerAccount"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const ClientPortal = lazy(() => import("@/pages/client/ClientPortal"));
const MyTickets = lazy(() => import("@/pages/client/MyTickets"));
const ReopenTicket = lazy(() => import("@/pages/ReopenTicket"));
const JoinApplication = lazy(() => import("@/pages/JoinApplication"));
const CareersIntake = lazy(() => import("@/pages/CareersIntake"));
const CareersDeveloperRep = lazy(() => import("@/pages/CareersDeveloperRep"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const OnboardingModule = lazy(() => import("@/pages/OnboardingModule"));
const VerifyCertificate = lazy(() => import("@/pages/VerifyCertificate"));
const VerificationStatus = lazy(() => import("@/pages/VerificationStatus"));
const ReferralOnboarding = lazy(() => import("@/pages/ReferralOnboarding"));
const RedeemReferral = lazy(() => import("@/pages/RedeemReferral"));
const Spreadsheet = lazy(() => import("@/pages/Spreadsheet"));
const Documents = lazy(() => import("@/pages/Documents"));
const QRCodeGenerator = lazy(() => import("@/pages/QRCodeGenerator"));
const ContractForms = lazy(() => import("@/pages/ContractForms"));
const VideoMeeting = lazy(() => import("@/pages/VideoMeeting"));
const BreakfastBooking = lazy(() => import("@/pages/BreakfastBooking"));
// Presentations editor removed — route redirects to Document Studio
const DocumentStudio = lazy(() => import("@/pages/DocumentStudio"));
const Sitemap = lazy(() => import("@/pages/Sitemap"));
const Pricing = lazy(() => import("@/pages/Pricing"));

// ── Broker Pages ──
const BrokerToolkit = lazy(() => import("@/pages/BrokerToolkit"));
const BrokerDashboard = lazy(() => import("@/pages/BrokerDashboard"));
// BrokerResources merged into /jbj-academy
const BrokerTraining = lazy(() => import("@/pages/broker/BrokerTraining"));
const BrokerLearning = lazy(() => import("@/pages/broker/BrokerLearning"));
const BrokerLearningVoiceAdmin = lazy(() => import("@/pages/owner/BrokerLearningVoiceAdmin"));
// AIBrokerWorkspace public route removed — accessible via /broker/portal/ai
const AIHub = lazy(() => import("@/pages/AIHub"));
const InteriorDesignAI = lazy(() => import("@/pages/InteriorDesignAI"));
const InvestorHub = lazy(() => import("@/pages/InvestorHub"));
// /broker-hub retired — duplicates Broker Portal. Redirects via OwnerAwareBrokerRedirect.
// JBJ Academy now renders the broker learning/training experience (former /broker/learning page).
const JBJAcademy = lazy(() => import("@/pages/broker/BrokerLearning"));
// AcademyGraduates merged into /jbj-academy
const BrokerPortal = lazy(() => import("@/pages/BrokerPortal"));


// ── Developer Portal ──
const DeveloperPortal = lazy(() => import("@/pages/DeveloperPortal"));
const BriefingAttendance = lazy(() => import("@/pages/BriefingAttendance"));
const TicketHub = lazy(() => import("@/pages/TicketHub"));
const ApiAccess = lazy(() => import("@/pages/ApiAccess"));

// ── Misc ──
const VapiPrompt = lazy(() => import("@/pages/VapiPrompt"));
const ScanSignDocuments = lazy(() => import("@/pages/ScanSignDocuments"));
const PropertyMeasurement = lazy(() => import("@/pages/PropertyMeasurement"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// ── Category Registration Forms ──
const RegisterInvestor = lazy(() => import("@/pages/register/RegisterInvestor"));
const RegisterBroker = lazy(() => import("@/pages/register/RegisterBroker"));
const RegisterDeveloper = lazy(() => import("@/pages/register/RegisterDeveloper"));
const CVBuilder = lazy(() => import("@/pages/CVBuilder"));

export const OwnerAwareBrokerRedirect = () => {
  const { isOwner, isLoading } = useIsAppOwner();
  const { mode } = useUserModeContext();

  // The dashboard target is driven by the selected workspace mode. Previously
  // owner-role users in Broker mode bounced /broker-dashboard → /owner while
  // OwnerGuard bounced them back to /broker-dashboard, causing a blank/blinking
  // preview. Only Owner mode should resolve to the owner dashboard.
  if (mode !== "owner") return <Navigate to="/broker/portal" replace />;

  if (isLoading) return null;
  if (isOwner) {
    try { sessionStorage.removeItem("jbj_broker_portal_preview"); } catch {}
    return <Navigate to="/owner" replace />;
  }
  return <Navigate to="/broker/portal" replace />;
};



export const PublicRoutes = () => (
  <>
    {/* ── Home ── */}
    <Route path="/" element={<Index />} />
    <Route path="/index" element={<Index />} />
    <Route path="/my-vault" element={<AuthRequiredRoute><MyVault /></AuthRequiredRoute>} />
    <Route path="/developer-portal" element={<DeveloperPortal />} />
    <Route path="/briefing-attendance/:briefingId" element={<BriefingAttendance />} />
    <Route path="/vapi-prompt" element={<VapiPrompt />} />

    {/* ── Properties ── */}
    <Route path="/properties" element={<Properties />} />
    <Route path="/properties/explore" element={<PropertiesReelly />} />
    <Route path="/project/:slug" element={<ProjectDetail />} />
    <Route path="/communities" element={<Communities />} />
    <Route path="/community/:slug" element={<CommunityDetail />} />
    <Route path="/developers" element={<Developers />} />
    <Route path="/developer/:slug" element={<DeveloperDetail />} />
    <Route path="/developers/:slug" element={<RedirectWithParams to="/developer" />} />
    <Route path="/areas" element={<AreaGuides />} />
    <Route path="/area/:slug" element={<AreaDetail />} />
    <Route path="/areas/:slug" element={<RedirectWithParams to="/area" />} />
    <Route path="/resale-properties" element={<ResaleProperties />} />
    <Route path="/map" element={<PropertyMap />} />
    {/* Unified List Your Property page (manual + AI + browse). Old routes 301 here. */}
    <Route path="/list-property" element={<ListProperty />} />
    <Route path="/dashboard/my-listings" element={<AuthRequiredRoute><ListingPortalMyListings /></AuthRequiredRoute>} />
    <Route path="/listing-portal" element={<Navigate to="/list-property?mode=browse" replace />} />
    <Route path="/listing-portal/submit" element={<Navigate to="/list-property?mode=ai" replace />} />
    <Route path="/listing-portal/my-listings" element={<Navigate to="/dashboard/my-listings" replace />} />
    <Route path="/sell" element={<Navigate to="/list-property?purpose=sale&mode=manual" replace />} />
    <Route path="/property-evaluator" element={<PropertyEvaluator />} />
    <Route path="/rental-index" element={<RentalIndex />} />
    <Route path="/sell/valuation" element={<RequestValuation />} />
    <Route path="/property-management/list" element={<Navigate to="/list-property?purpose=rent&mode=manual" replace />} />
    <Route path="/property-measurement" element={<PropertyMeasurement />} />
    <Route path="/buy" element={<Navigate to="/properties?transactionType=buy" replace />} />
    <Route path="/rent" element={<Navigate to="/properties?transactionType=rent" replace />} />
    <Route path="/property-management" element={<Navigate to="/services/property-management" replace />} />
    <Route path="/projects" element={<Navigate to="/properties" replace />} />
    <Route path="/projects/:slug" element={<RedirectWithParams to="/project" />} />

    {/* ── Guides & Education ── */}
    <Route path="/buyer-guide" element={<BuyerGuide />} />
    <Route path="/seller-guide" element={<SellerGuide />} />
    <Route path="/seller-listing" element={<Navigate to="/list-property?mode=manual" replace />} />
    <Route path="/guides" element={<Guides />} />
    <Route path="/guides/golden-visa-uae" element={<GoldenVisaGuide />} />
    <Route path="/golden-visa" element={<Navigate to="/guides/golden-visa-uae" replace />} />
    {/* Books Library consolidated into Guides Library — single canonical hub. */}
    <Route path="/education-hub" element={<Navigate to="/guides" replace />} />
    <Route path="/books-library" element={<Navigate to="/guides" replace />} />
    <Route path="/rent-guide" element={<RentGuide />} />
    <Route path="/tenant-guide" element={<TenantGuide />} />
    <Route path="/landlord-guide" element={<LandlordGuide />} />
    <Route path="/landlord-portal" element={<Navigate to="/dashboard/my-listings" replace />} />
    <Route path="/investor-education" element={<InvestorEducation />} />
    {/* /broker-education retired — merged into /jbj-academy */}
    <Route path="/faq" element={<FAQ />} />
    <Route path="/investor-faq" element={<Navigate to="/faq" replace />} />
    <Route path="/buyer-faq" element={<BuyerFAQ />} />
    <Route path="/seller-faq" element={<SellerFAQ />} />
    <Route path="/landlord-faq" element={<LandlordFAQ />} />
    <Route path="/tenant-faq" element={<TenantFAQ />} />
    <Route path="/broker-faq" element={<BrokerFAQ />} />
    <Route path="/guides/buying" element={<Navigate to="/buyer-guide" replace />} />
    <Route path="/guides/renting" element={<Navigate to="/rent-guide" replace />} />
    <Route path="/guides/selling" element={<Navigate to="/seller-guide" replace />} />
    <Route path="/guides/landlords" element={<Navigate to="/landlord-guide" replace />} />

    {/* ── Market Intelligence ── */}
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
    

    {/* ── Services ── */}
    <Route path="/services" element={<Services />} />
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
    
    <Route path="/services/broker-certification" element={<BrokerCertification />} />
    <Route path="/services/complaint-procedures" element={<ComplaintProcedures />} />
    <Route path="/services/customer-happiness-center" element={<CustomerHappinessCenter />} />
    <Route path="/services/testimonials" element={<TestimonialsPage />} />
    <Route path="/referral-partner" element={<ReferralPartner />} />
    <Route path="/referral" element={<Navigate to="/referral-onboarding" replace />} />
    <Route path="/investors" element={<InvestorServices />} />
    <Route path="/investors/join" element={<JoinInvestorList />} />
    <Route path="/brokers/join" element={<JoinBrokerList />} />
    <Route path="/developers/join" element={<JoinDeveloperList />} />
    <Route path="/partners" element={<Partners />} />
    <Route path="/partners/mortgage" element={<PartnerMortgage />} />
    <Route path="/partners/legal" element={<PartnerLegal />} />
    <Route path="/partners/company-setup" element={<PartnerCompanySetup />} />
    <Route path="/partners/visa-services" element={<PartnerVisaServices />} />

    {/* ── Company ── */}
    <Route path="/contact" element={<Contact />} />
    <Route path="/about" element={<About />} />
    <Route path="/founder" element={<Founder />} />
    <Route path="/awards" element={<Awards />} />
    <Route path="/press-kit" element={<Navigate to="/company-profile" replace />} />
    <Route path="/company-profile" element={<CompanyProfile />} />
    <Route path="/news" element={<News />} />
    <Route path="/news/:id" element={<NewsDetail />} />
    <Route path="/team" element={<TeamRouteGate />} />
    {/* /meet-the-team retired — gate via TeamRouteGate */}
    {/* /brokers and /our-brokers retired — no redirect; 404 via NotFound catch-all */}
    {/* /philanthropy, /reviews, /governance/partners, /trust-and-audit-center, /trust-compliance, /accessibility retired — 404 via NotFound */}

    <Route path="/thank-you" element={<ThankYou />} />
    <Route path="/blog" element={<Navigate to="/news" replace />} />

    {/* ── Legal ── */}
    <Route path="/terms" element={<Terms />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/cookies" element={<Cookies />} />
    <Route path="/disclaimers" element={<Disclaimers />} />

    <Route path="/aml-kyc" element={<AmlKycPolicy />} />
    <Route path="/intellectual-property" element={<IntellectualProperty />} />

    {/* ── User / Account (Tier 2 — login required) ── */}
    <Route path="/mortgage" element={<Navigate to="/mortgage-calculator" replace />} />
    <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
    <Route path="/favorites" element={<AuthRequiredRoute><Favorites /></AuthRequiredRoute>} />
    <Route
      path="/compare"
      element={
        <AuthRequiredRoute>
          <GatedToolRoute
            toolId="compare"
            toolName="Property Comparison"
            theme={toolThemes.indigo}
            tagline="Compare unlimited projects and units side by side, with payment plan and ROI breakdowns. Unlocked for JBJ brokers."
          >
            <Compare />
          </GatedToolRoute>
        </AuthRequiredRoute>
      }
    />
    <Route path="/compare-manual" element={<Navigate to="/compare" replace />} />
    {/* AI Home Finder — canonical URL (no legacy /quiz route). */}
    <Route path="/ai-home-finder" element={<Quiz />} />
    <Route path="/ai-home-finder-results" element={<QuizResults />} />
    {import.meta.env.DEV && (
      <Route
        path="/__report-contrast"
        element={createElement(lazy(() => import("@/pages/__ReportContrastHarness")))}
      />
    )}
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/my-dashboard" element={<AuthRequiredRoute><MyDashboard /></AuthRequiredRoute>} />
    <Route path="/my-dashboard/progress" element={<AuthRequiredRoute><MyDashboardProgress /></AuthRequiredRoute>} />
    <Route path="/my-dashboard/activity" element={<AuthRequiredRoute><MyDashboardActivity /></AuthRequiredRoute>} />
    <Route path="/my-activity" element={<Navigate to="/my-dashboard/activity" replace />} />
    <Route path="/investor-dashboard" element={<AuthRequiredRoute><InvestorDashboard /></AuthRequiredRoute>} />
    <Route path="/investor-dashboard/portfolio" element={<AuthRequiredRoute><PortfolioViews /></AuthRequiredRoute>} />
    <Route path="/investor-dashboard/reports" element={<AuthRequiredRoute><ReportAccess /></AuthRequiredRoute>} />
    <Route path="/owner-dashboard" element={<Navigate to="/owner" replace />} />
    <Route path="/owner/dashboard" element={<Navigate to="/owner" replace />} />
    <Route path="/my-account" element={<AuthRequiredRoute><BrokerAccount /></AuthRequiredRoute>} />
    <Route path="/profile" element={<AuthRequiredRoute><UserProfile /></AuthRequiredRoute>} />
    <Route path="/account" element={<Navigate to="/my-account" replace />} />
     <Route path="/settings" element={<Navigate to="/profile?tab=settings" replace />} />
     <Route path="/account/billing" element={<AuthRequiredRoute><AccountBilling /></AuthRequiredRoute>} />
     <Route path="/billing" element={<Navigate to="/account/billing" replace />} />
    <Route path="/client-portal" element={<AuthRequiredRoute><ClientPortal /></AuthRequiredRoute>} />
    <Route path="/my-tickets" element={<AuthRequiredRoute><MyTickets /></AuthRequiredRoute>} />
    <Route path="/ticket-hub" element={<AuthRequiredRoute><TicketHub /></AuthRequiredRoute>} />
    <Route path="/reopen-ticket" element={<AuthRequiredRoute><ReopenTicket /></AuthRequiredRoute>} />
    <Route path="/join" element={<Navigate to="/careers" replace />} />
    <Route path="/careers" element={<ModeRequiredRoute modes={['broker','developer']}><JoinApplication /></ModeRequiredRoute>} />
    <Route path="/careers/apply" element={<ModeRequiredRoute modes={['broker','developer']}><JoinApplication /></ModeRequiredRoute>} />

    <Route path="/careers/intake/:token" element={<CareersIntake />} />
    <Route path="/careers/developer-representative" element={<ModeRequiredRoute modes={['developer']}><CareersDeveloperRep /></ModeRequiredRoute>} />
    <Route path="/onboarding" element={<AuthRequiredRoute><Onboarding /></AuthRequiredRoute>} />
    <Route path="/onboarding/module/:moduleId" element={<AuthRequiredRoute><OnboardingModule /></AuthRequiredRoute>} />
    <Route path="/verify-certificate/:token" element={<VerifyCertificate />} />
    <Route path="/verify-certificate/lookup" element={<VerifyCertificate />} />
    <Route path="/verification" element={<VerificationStatus />} />
    <Route path="/referral-onboarding" element={<ReferralOnboarding />} />
    <Route path="/redeem-referral" element={<RedeemReferral />} />
    <Route path="/spreadsheet" element={<AuthRequiredRoute><Spreadsheet /></AuthRequiredRoute>} />
    <Route path="/documents" element={<OwnerGuard><Documents /></OwnerGuard>} />
    <Route path="/qr-generator" element={<AuthRequiredRoute><QRCodeGenerator /></AuthRequiredRoute>} />
    <Route path="/contract-forms" element={<AuthRequiredRoute><ContractForms /></AuthRequiredRoute>} />
    <Route path="/video-meeting" element={<AuthRequiredRoute><VideoMeeting /></AuthRequiredRoute>} />
    <Route path="/breakfast-booking" element={<BreakfastBooking />} />
    {/* /presentations was the broken slide-deck builder — removed per owner directive (June 2026).
        Any stale link now lands on /document-studio which is the active document tool. */}
    <Route path="/presentations" element={<Navigate to="/document-studio" replace />} />

    <Route path="/document-studio" element={<OwnerGuard><DocumentStudio /></OwnerGuard>} />

    {/* ── Broker Pages (Tier 2 — login required) ── */}
    <Route path="/broker-toolkit" element={<AuthRequiredRoute><ModeRequiredRoute modes={['broker']}><BrokerToolkit /></ModeRequiredRoute></AuthRequiredRoute>} />
    <Route path="/broker-toolkit/dashboard" element={<OwnerAwareBrokerRedirect />} />
    <Route path="/broker-dashboard" element={<OwnerAwareBrokerRedirect />} />
    {/* /broker-resources, /broker/training, /ai-broker-workspace retired — see /jbj-academy and /broker/portal/ai */}
    <Route path="/owner/broker-learning/voice" element={<OwnerGuard><BrokerLearningVoiceAdmin /></OwnerGuard>} />
    <Route path="/ai-hub" element={<AuthRequiredRoute><AIHub /></AuthRequiredRoute>} />
    <Route path="/assistant-hub" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/interior-design-ai" element={<AuthRequiredRoute><InteriorDesignAI /></AuthRequiredRoute>} />
    <Route path="/interior-design-studio" element={<Navigate to="/interior-design-ai" replace />} />
    <Route path="/investor-hub" element={<AuthRequiredRoute><ModeRequiredRoute modes={['investor']}><InvestorHub /></ModeRequiredRoute></AuthRequiredRoute>} />
    {/* /broker-hub fully deleted — no route, no redirect. Falls through to NotFound. */}
    <Route path="/jbj-academy" element={<AuthRequiredRoute><JBJAcademy /></AuthRequiredRoute>} />
    {/* /academy/graduates retired — merged into /jbj-academy */}
    <Route path="/broker-portal" element={<OwnerAwareBrokerRedirect />} />

    {/* ── Canonical Broker Portal (nested /broker/* shell) ── */}
    {BrokerPortalRoutes()}
    <Route path="/document-scanner" element={<OwnerGuard><ScanSignDocuments /></OwnerGuard>} />
    <Route path="/scan-sign" element={<Navigate to="/document-scanner" replace />} />
    <Route path="/scan-sign-documents" element={<Navigate to="/document-scanner" replace />} />
    <Route path="/signature-studio" element={<Navigate to="/document-scanner" replace />} />

    {/* ── Developer Convenience Redirects ── */}
    <Route path="/developer-center" element={<Navigate to="/developer-hub" replace />} />
    <Route path="/developer-registration" element={<Navigate to="/developer-hub/company-registration" replace />} />
    <Route path="/submit-project" element={<Navigate to="/developer-portal?tab=submit" replace />} />
    <Route path="/submit-event" element={<Navigate to="/developer-hub/events" replace />} />
    <Route path="/my-projects" element={<Navigate to="/developer-portal?tab=projects" replace />} />
    <Route path="/my-events" element={<Navigate to="/developer-hub/events" replace />} />

    {/* ── Category Registration (after /welcome category pick) ── */}
    <Route path="/register/investor" element={<AuthRequiredRoute><RegisterInvestor /></AuthRequiredRoute>} />
    <Route path="/register/broker" element={<AuthRequiredRoute><RegisterBroker /></AuthRequiredRoute>} />
    <Route path="/register/developer" element={<AuthRequiredRoute><RegisterDeveloper /></AuthRequiredRoute>} />

    {/* ── Misc ── */}
    <Route path="/sitemap" element={<Sitemap />} />
    <Route path="/pricing" element={<Pricing />} />
    <Route path="/api-access" element={<ApiAccess />} />
    <Route path="/cv-builder" element={<CVBuilder />} />

    {/* ── 404 ── */}
    <Route path="*" element={<NotFound />} />
  </>
);
