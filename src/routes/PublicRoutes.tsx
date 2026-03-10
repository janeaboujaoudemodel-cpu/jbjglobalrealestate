/**
 * Public-facing routes — properties, guides, services, company, user pages
 * These render inside MainLayoutWrapper (header + footer shell)
 */
import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { RedirectWithParams } from "@/components/RedirectWithParams";

// ── Property & Listing Pages ──
const Index = lazy(() => import("@/pages/Index"));
const PropertiesReelly = lazy(() => import("@/pages/PropertiesReelly"));
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
const BrokerEducation = lazy(() => import("@/pages/BrokerEducation"));
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
const AITools = lazy(() => import("@/pages/services/AITools"));
const BrokerCertification = lazy(() => import("@/pages/services/BrokerCertification"));
const ComplaintProcedures = lazy(() => import("@/pages/services/ComplaintProcedures"));
const CustomerHappinessCenter = lazy(() => import("@/pages/services/CustomerHappinessCenter"));
const TestimonialsPage = lazy(() => import("@/pages/services/Testimonials"));
const ReferralPartner = lazy(() => import("@/pages/ReferralPartner"));
const InvestorServices = lazy(() => import("@/pages/InvestorServices"));
const JoinInvestorList = lazy(() => import("@/pages/JoinInvestorList"));
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
const PressKit = lazy(() => import("@/pages/PressKit"));
const CompanyProfile = lazy(() => import("@/pages/CompanyProfile"));
const Philanthropy = lazy(() => import("@/pages/Philanthropy"));
const News = lazy(() => import("@/pages/News"));
const NewsDetail = lazy(() => import("@/pages/NewsDetail"));
const MeetTheTeam = lazy(() => import("@/pages/MeetTheTeam"));
const OurBrokers = lazy(() => import("@/pages/OurBrokers"));
const Reviews = lazy(() => import("@/pages/Reviews"));
const ThankYou = lazy(() => import("@/pages/ThankYou"));

// ── Legal ──
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Cookies = lazy(() => import("@/pages/Cookies"));
const Disclaimers = lazy(() => import("@/pages/Disclaimers"));
const TrustAndAuditCenter = lazy(() => import("@/pages/TrustAndAuditCenter"));
const TrustAndCompliance = lazy(() => import("@/pages/TrustAndCompliance"));
const RiskDisclosure = lazy(() => import("@/pages/RiskDisclosure"));
const AmlKycPolicy = lazy(() => import("@/pages/AmlKycPolicy"));
const Accessibility = lazy(() => import("@/pages/Accessibility"));
const IntellectualProperty = lazy(() => import("@/pages/IntellectualProperty"));

// ── User / Account ──
const MortgageCalculator = lazy(() => import("@/pages/MortgageCalculator"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const Compare = lazy(() => import("@/pages/Compare"));
const Quiz = lazy(() => import("@/pages/Quiz"));
const QuizResults = lazy(() => import("@/pages/QuizResults"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const MyDashboard = lazy(() => import("@/pages/MyDashboard"));
const MyDashboardProgress = lazy(() => import("@/pages/MyDashboardProgress"));
const MyDashboardActivity = lazy(() => import("@/pages/MyDashboardActivity"));
const InvestorDashboard = lazy(() => import("@/pages/InvestorDashboard"));
const PortfolioViews = lazy(() => import("@/pages/investor/PortfolioViews"));
const ReportAccess = lazy(() => import("@/pages/investor/ReportAccess"));
const BrokerAccount = lazy(() => import("@/pages/BrokerAccount"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const ClientPortal = lazy(() => import("@/pages/client/ClientPortal"));
const MyTickets = lazy(() => import("@/pages/client/MyTickets"));
const ReopenTicket = lazy(() => import("@/pages/ReopenTicket"));
const JoinApplication = lazy(() => import("@/pages/JoinApplication"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const OnboardingModule = lazy(() => import("@/pages/OnboardingModule"));
const VerifyCertificate = lazy(() => import("@/pages/VerifyCertificate"));
const ReferralOnboarding = lazy(() => import("@/pages/ReferralOnboarding"));
const RedeemReferral = lazy(() => import("@/pages/RedeemReferral"));
const Spreadsheet = lazy(() => import("@/pages/Spreadsheet"));
const Documents = lazy(() => import("@/pages/Documents"));
const QRCodeGenerator = lazy(() => import("@/pages/QRCodeGenerator"));
const ContractForms = lazy(() => import("@/pages/ContractForms"));
const VideoMeeting = lazy(() => import("@/pages/VideoMeeting"));
const Presentations = lazy(() => import("@/pages/Presentations"));
const Sitemap = lazy(() => import("@/pages/Sitemap"));
const Pricing = lazy(() => import("@/pages/Pricing"));

// ── Broker Pages ──
const BrokerToolkit = lazy(() => import("@/pages/BrokerToolkit"));
const BrokerDashboard = lazy(() => import("@/pages/BrokerDashboard"));
const BrokerResources = lazy(() => import("@/pages/BrokerResources"));
const BrokerTraining = lazy(() => import("@/pages/broker/BrokerTraining"));
const AIBrokerWorkspace = lazy(() => import("@/pages/AIBrokerWorkspace"));
const AIHub = lazy(() => import("@/pages/AIHub"));
const InteriorDesignAI = lazy(() => import("@/pages/InteriorDesignAI"));
const InvestorHub = lazy(() => import("@/pages/InvestorHub"));
const BrokerHub = lazy(() => import("@/pages/BrokerHub"));

// ── Governance ──
const PartnerGovernance = lazy(() => import("@/pages/governance/PartnerGovernance"));

// ── Misc ──
const VapiPrompt = lazy(() => import("@/pages/VapiPrompt"));
const ScanSignDocuments = lazy(() => import("@/pages/ScanSignDocuments"));
const PropertyMeasurement = lazy(() => import("@/pages/PropertyMeasurement"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export const PublicRoutes = () => (
  <>
    {/* ── Home ── */}
    <Route path="/" element={<Index />} />
    <Route path="/vapi-prompt" element={<VapiPrompt />} />

    {/* ── Properties ── */}
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
    <Route path="/resale-properties" element={<ResaleProperties />} />
    <Route path="/map" element={<PropertyMap />} />
    <Route path="/listing-portal" element={<ListingPortal />} />
    <Route path="/listing-portal/submit" element={<ListingPortalSubmit />} />
    <Route path="/listing-portal/my-listings" element={<ListingPortalMyListings />} />
    <Route path="/property-evaluator" element={<PropertyEvaluator />} />
    <Route path="/rental-index" element={<RentalIndex />} />
    <Route path="/sell" element={<SellWithUs />} />
    <Route path="/sell/valuation" element={<RequestValuation />} />
    <Route path="/property-management/list" element={<LandlordListForm />} />
    <Route path="/property-measurement" element={<PropertyMeasurement />} />
    <Route path="/buy" element={<Navigate to="/properties?transactionType=buy" replace />} />
    <Route path="/rent" element={<Navigate to="/properties?transactionType=rent" replace />} />
    <Route path="/property-management" element={<Navigate to="/services/property-management" replace />} />
    <Route path="/projects" element={<Navigate to="/properties" replace />} />
    <Route path="/projects/:slug" element={<RedirectWithParams to="/project" />} />

    {/* ── Guides & Education ── */}
    <Route path="/buyer-guide" element={<BuyerGuide />} />
    <Route path="/seller-guide" element={<SellerGuide />} />
    <Route path="/seller-listing" element={<SellerListing />} />
    <Route path="/guides" element={<Guides />} />
    <Route path="/guides/golden-visa-uae" element={<GoldenVisaGuide />} />
    <Route path="/golden-visa" element={<Navigate to="/guides/golden-visa-uae" replace />} />
    <Route path="/education-hub" element={<EducationHub />} />
    <Route path="/rent-guide" element={<RentGuide />} />
    <Route path="/tenant-guide" element={<TenantGuide />} />
    <Route path="/landlord-guide" element={<LandlordGuide />} />
    <Route path="/landlord-portal" element={<LandlordRentalPortal />} />
    <Route path="/investor-education" element={<InvestorEducation />} />
    <Route path="/broker-education" element={<BrokerEducation />} />
    <Route path="/faq" element={<FAQ />} />
    <Route path="/investor-faq" element={<InvestorFAQ />} />
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
    <Route path="/insights" element={<MarketIntelligence />} />

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
    <Route path="/services/ai-tools" element={<AITools />} />
    <Route path="/services/broker-certification" element={<BrokerCertification />} />
    <Route path="/services/complaint-procedures" element={<ComplaintProcedures />} />
    <Route path="/services/customer-happiness-center" element={<CustomerHappinessCenter />} />
    <Route path="/services/testimonials" element={<TestimonialsPage />} />
    <Route path="/referral-partner" element={<ReferralPartner />} />
    <Route path="/referral" element={<Navigate to="/referral-onboarding" replace />} />
    <Route path="/investors" element={<InvestorServices />} />
    <Route path="/investors/join" element={<JoinInvestorList />} />
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
    <Route path="/press-kit" element={<PressKit />} />
    <Route path="/company-profile" element={<CompanyProfile />} />
    <Route path="/philanthropy" element={<Philanthropy />} />
    <Route path="/news" element={<News />} />
    <Route path="/news/:id" element={<NewsDetail />} />
    <Route path="/team" element={<MeetTheTeam />} />
    <Route path="/meet-the-team" element={<Navigate to="/team" replace />} />
    <Route path="/brokers" element={<OurBrokers />} />
    <Route path="/reviews" element={<Reviews />} />
    <Route path="/thank-you" element={<ThankYou />} />
    <Route path="/blog" element={<Navigate to="/news" replace />} />
    <Route path="/governance/partners" element={<PartnerGovernance />} />

    {/* ── Legal ── */}
    <Route path="/terms" element={<Terms />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/cookies" element={<Cookies />} />
    <Route path="/disclaimers" element={<Disclaimers />} />
    <Route path="/trust-and-audit-center" element={<TrustAndAuditCenter />} />
    <Route path="/trust-compliance" element={<TrustAndCompliance />} />
    <Route path="/risk-disclosure" element={<RiskDisclosure />} />
    <Route path="/aml-kyc" element={<AmlKycPolicy />} />
    <Route path="/accessibility" element={<Accessibility />} />
    <Route path="/intellectual-property" element={<IntellectualProperty />} />

    {/* ── User / Account ── */}
    <Route path="/mortgage" element={<Navigate to="/mortgage-calculator" replace />} />
    <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
    <Route path="/favorites" element={<Favorites />} />
    <Route path="/compare" element={<Compare />} />
    <Route path="/quiz" element={<Quiz />} />
    <Route path="/quiz-results" element={<QuizResults />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/my-dashboard" element={<MyDashboard />} />
    <Route path="/my-dashboard/progress" element={<MyDashboardProgress />} />
    <Route path="/my-dashboard/activity" element={<MyDashboardActivity />} />
    <Route path="/my-activity" element={<Navigate to="/my-dashboard/activity" replace />} />
    <Route path="/investor-dashboard" element={<InvestorDashboard />} />
    <Route path="/investor-dashboard/portfolio" element={<PortfolioViews />} />
    <Route path="/investor-dashboard/reports" element={<ReportAccess />} />
    <Route path="/owner-dashboard" element={<Navigate to="/owner" replace />} />
    <Route path="/my-account" element={<BrokerAccount />} />
    <Route path="/profile" element={<UserProfile />} />
    <Route path="/account" element={<Navigate to="/my-account" replace />} />
    <Route path="/settings" element={<Navigate to="/profile?tab=settings" replace />} />
    <Route path="/client-portal" element={<ClientPortal />} />
    <Route path="/my-tickets" element={<MyTickets />} />
    <Route path="/reopen-ticket" element={<ReopenTicket />} />
    <Route path="/join" element={<JoinApplication />} />
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/onboarding/module/:moduleId" element={<OnboardingModule />} />
    <Route path="/verify-certificate/:token" element={<VerifyCertificate />} />
    <Route path="/referral-onboarding" element={<ReferralOnboarding />} />
    <Route path="/redeem-referral" element={<RedeemReferral />} />
    <Route path="/spreadsheet" element={<Spreadsheet />} />
    <Route path="/documents" element={<Documents />} />
    <Route path="/qr-generator" element={<QRCodeGenerator />} />
    <Route path="/contract-forms" element={<ContractForms />} />
    <Route path="/video-meeting" element={<VideoMeeting />} />
    <Route path="/presentations" element={<Presentations />} />

    {/* ── Broker Pages ── */}
    <Route path="/broker-toolkit" element={<BrokerToolkit />} />
    <Route path="/broker-toolkit/dashboard" element={<Navigate to="/broker-dashboard" replace />} />
    <Route path="/broker-dashboard" element={<BrokerDashboard />} />
    <Route path="/broker-resources" element={<BrokerResources />} />
    <Route path="/broker/training" element={<BrokerTraining />} />
    <Route path="/ai-broker-workspace" element={<AIBrokerWorkspace />} />
    <Route path="/ai-hub" element={<AIHub />} />
    <Route path="/assistant-hub" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/interior-design-ai" element={<InteriorDesignAI />} />
    <Route path="/interior-design-studio" element={<Navigate to="/interior-design-ai" replace />} />
    <Route path="/investor-hub" element={<InvestorHub />} />
    <Route path="/broker-hub" element={<BrokerHub />} />
    <Route path="/document-scanner" element={<ScanSignDocuments />} />
    <Route path="/scan-sign" element={<Navigate to="/document-scanner" replace />} />
    <Route path="/scan-sign-documents" element={<Navigate to="/document-scanner" replace />} />
    <Route path="/signature-studio" element={<Navigate to="/document-scanner" replace />} />

    {/* ── Misc ── */}
    <Route path="/sitemap" element={<Sitemap />} />
    <Route path="/pricing" element={<Pricing />} />

    {/* ── 404 ── */}
    <Route path="*" element={<NotFound />} />
  </>
);
