import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Building,
  FileText,
  FolderOpen,
  Gavel,
  GraduationCap,
  Handshake,
  HelpCircle,
  Key,
  Landmark,
  LifeBuoy,
  Lock,
  MapPin,
  Megaphone,
  Phone,
  Scale,
  Shield,
  ShieldCheck,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import MIPageShell, { type MIShellTocItem } from "@/components/shell/MIPageShell";

/**
 * InsightsPageScope
 *
 * Single wrapper that tags any page in the Insights / Guides / FAQ branch
 * of the vertical sidebar with `data-insights-page`. PASS 133 in index.css
 * binds to that attribute and enforces the brand contract:
 *   - champagne page surface
 *   - ink (#1A1A1A) headings + body on champagne
 *   - white foreground on every emerald CTA / pill at every state
 *   - white text inside any [data-hero-dark] surface
 *   - raw grays auto-flatten to champagne / soft ink
 *   - emerald icon tiles keep white glyphs
 *
 * Pages opt out of an individual rule with [data-no-contrast-guard] on the
 * offending node (e.g. WHITE text on a video hero already does this).
 *
 * Adding a page to the branch is now a one-line change in the router —
 * wrap the route's element with <InsightsPageScope>…</InsightsPageScope>.
 */
type CategoryShellConfig = {
  title: string;
  description: string;
  tocTitle: string;
  items: Array<MIShellTocItem & { href: string }>;
  preFooterTitle: string;
  preFooterSubtitle: string;
};

const insightsItems = [
  { id: "insights-market-intelligence", title: "Market Intelligence", href: "/market-intelligence", icon: BarChart3 },
  { id: "insights-news", title: "News", href: "/news", icon: Megaphone },
  { id: "insights-market-report", title: "Market Report", href: "/market-report", icon: FileText },
  { id: "insights-overview", title: "Market Overview", href: "/market-intelligence/overview", icon: BarChart3 },
  { id: "insights-areas", title: "Area Intelligence", href: "/market-intelligence/areas", icon: MapPin },
  { id: "insights-reports", title: "Reports Archive", href: "/market-intelligence/reports", icon: FolderOpen },
  { id: "insights-methodology", title: "Methodology", href: "/market-intelligence/methodology", icon: BookOpen },
];

const guideItems = [
  { id: "guides-library", title: "Guides Library", href: "/guides", icon: BookOpen },
  { id: "guides-buyer", title: "Buyer's Guide", href: "/buyer-guide", icon: FileText },
  { id: "guides-seller", title: "Seller's Guide", href: "/seller-guide", icon: FileText },
  { id: "guides-rental", title: "Rental Guide", href: "/rent-guide", icon: FileText },
  { id: "guides-tenant", title: "Tenant Guide", href: "/tenant-guide", icon: Key },
  { id: "guides-landlord", title: "Landlord Guide", href: "/landlord-guide", icon: Building },
  { id: "guides-investor", title: "Investor Education", href: "/investor-education", icon: GraduationCap },
  { id: "guides-golden-visa", title: "Golden Visa Guide", href: "/guides/golden-visa-uae", icon: Award },
  { id: "guides-faq", title: "FAQ Hub", href: "/faq", icon: HelpCircle },
];

const serviceItems = [
  { id: "services-all", title: "All Services", href: "/services", icon: Briefcase },
  { id: "services-management", title: "Property Management", href: "/services/property-management", icon: Key },
  { id: "services-mortgage", title: "Mortgage Advisory", href: "/partners/mortgage", icon: Landmark },
  { id: "services-legal", title: "Legal Services", href: "/partners/legal", icon: Gavel },
  { id: "services-visa", title: "Visa Services", href: "/partners/visa-services", icon: Shield },
  { id: "services-company-setup", title: "Company Setup", href: "/partners/company-setup", icon: Building },
  { id: "services-selling", title: "Selling Advisory", href: "/services/selling-advisory", icon: TrendingUp },
  { id: "services-concierge", title: "Concierge", href: "/services/concierge", icon: Handshake },
  { id: "services-architecture", title: "Architecture", href: "/services/architecture", icon: Building },
  { id: "services-design", title: "Interior Design", href: "/services/interior-design", icon: Award },
  { id: "services-fitout", title: "Fit-Out", href: "/services/fit-out", icon: Briefcase },
  { id: "services-law-firm", title: "Law Firm", href: "/services/law-firm", icon: Scale },
];

const companyItems = [
  { id: "company-about", title: "About", href: "/about", icon: Users },
  { id: "company-team", title: "Team", href: "/team", icon: Users },
  { id: "company-founder", title: "Founder", href: "/founder", icon: Award },
  { id: "company-contact", title: "Contact", href: "/contact", icon: Phone },
  { id: "company-awards", title: "Awards", href: "/awards", icon: Award },
  { id: "company-profile", title: "Company Profile", href: "/company-profile", icon: Building },
  { id: "company-careers", title: "Career Portal", href: "/join", icon: GraduationCap },
];

const legalItems = [
  { id: "legal-terms", title: "Terms of Service", href: "/terms", icon: Scale },
  { id: "legal-privacy", title: "Privacy Policy", href: "/privacy", icon: Lock },
  { id: "legal-cookies", title: "Cookie Policy", href: "/cookies", icon: Shield },
  { id: "legal-disclaimers", title: "Disclaimers", href: "/disclaimers", icon: FileText },
  { id: "legal-ip", title: "Intellectual Property", href: "/intellectual-property", icon: ShieldCheck },
  { id: "legal-aml", title: "AML / KYC", href: "/aml-kyc", icon: Shield },
];

const helpItems = [
  { id: "help-contact", title: "Contact Us", href: "/contact", icon: Phone },
  { id: "help-support", title: "Support Center", href: "/ticket-hub", icon: Ticket },
  { id: "help-faq", title: "FAQs", href: "/faq", icon: HelpCircle },
  { id: "help-buyer", title: "Buyer FAQ", href: "/buyer-faq", icon: FileText },
  { id: "help-seller", title: "Seller FAQ", href: "/seller-faq", icon: FileText },
  { id: "help-landlord", title: "Landlord FAQ", href: "/landlord-faq", icon: Building },
  { id: "help-tenant", title: "Tenant FAQ", href: "/tenant-faq", icon: Key },
  { id: "help-broker", title: "Broker FAQ", href: "/broker-faq", icon: Briefcase },
];

// Routes that render their OWN full-screen emerald hero. These must NOT be
// re-wrapped by the shell hero or the page shows two hero sections stacked.
const PAGES_WITH_OWN_HERO = new Set<string>([
  "/market-intelligence",
  "/insights",
  "/news",
  "/market-report",
  "/guides",
  "/buyer-guide",
  "/seller-guide",
  "/rent-guide",
  "/rental-guide",
  "/tenant-guide",
  "/landlord-guide",
  "/investor-education",
  "/golden-visa-guide",
  "/faq",
  "/services",
  "/about",
  "/terms",
  "/privacy",
  "/cookies",
  "/disclaimers",
  "/aml-kyc",
  "/intellectual-property",
]);

const getCategoryShellConfig = (pathname: string): CategoryShellConfig | null => {
  if (pathname === "/market-intelligence" || pathname.startsWith("/market-intelligence/")) return null;
  if (PAGES_WITH_OWN_HERO.has(pathname)) return null;
  if (pathname.startsWith("/guides/")) return null;
  if (pathname.startsWith("/services/")) return null;
  if (pathname.startsWith("/news/")) return null; // news detail pages provide their own hero



  if (
    pathname === "/contact" ||
    pathname === "/ticket-hub" ||
    pathname === "/reopen-ticket" ||
    pathname === "/faq" ||
    pathname.endsWith("-faq")
  ) {
    return {
      title: "Help & Support",
      description: "Clear answers, direct support routes, and structured guidance for every client journey.",
      tocTitle: "Help & Support",
      items: helpItems,
      preFooterTitle: "Need Help From Our Team?",
      preFooterSubtitle: "Speak with JBJ support for a clear next step, a service request, or a guided answer.",
    };
  }

  if (pathname === "/terms" || pathname === "/privacy" || pathname === "/cookies" || pathname === "/disclaimers" || pathname === "/aml-kyc" || pathname === "/intellectual-property") {
    return {
      title: "Legal",
      description: "Governance, privacy, compliance, and policy documents presented with the same institutional clarity.",
      tocTitle: "Legal",
      items: legalItems,
      preFooterTitle: "Need a Policy Clarification?",
      preFooterSubtitle: "Contact our team for routing, document clarification, or the correct next compliance step.",
    };
  }

  if (pathname === "/about" || pathname === "/team" || pathname === "/founder" || pathname === "/awards" || pathname === "/company-profile" || pathname === "/join" || pathname.startsWith("/careers")) {
    return {
      title: "Company",
      description: "JBJ Global Real Estate company information, leadership, awards, team access, and career pathways.",
      tocTitle: "Company",
      items: companyItems,
      preFooterTitle: "Speak With JBJ Global Real Estate",
      preFooterSubtitle: "Connect with our team for company information, career routing, or client support.",
    };
  }

  if (pathname === "/services" || pathname.startsWith("/services/") || pathname.startsWith("/partners") || pathname === "/referral-partner" || pathname.startsWith("/investors") || pathname.startsWith("/brokers/join") || pathname.startsWith("/developers/join")) {
    return {
      title: "Services",
      description: "A curated service ecosystem for buying, selling, renting, ownership, partners, and premium coordination.",
      tocTitle: "Services",
      items: serviceItems,
      preFooterTitle: "Ready to Structure Your Service Request?",
      preFooterSubtitle: "Tell us what you need and our team will route the request to the correct specialist path.",
    };
  }

  if (pathname === "/guides" || pathname.startsWith("/guides/") || pathname === "/buyer-guide" || pathname === "/seller-guide" || pathname === "/rent-guide" || pathname === "/tenant-guide" || pathname === "/landlord-guide" || pathname === "/investor-education") {
    return {
      title: "Guides",
      description: "Structured Dubai real estate guides with consistent navigation, educational flow, and premium reading cards.",
      tocTitle: "Guides",
      items: guideItems,
      preFooterTitle: "Need Help Choosing a Guide?",
      preFooterSubtitle: "Tell us your property goal and we will route you to the right guide or support path.",
    };
  }

  if (pathname === "/insights" || pathname.startsWith("/insights/") || pathname === "/news" || pathname.startsWith("/news/") || pathname === "/market-report") {
    return {
      title: "Insights",
      description: "Market intelligence, reports, news, and editorial context organized in one emerald navigation system.",
      tocTitle: "Insights",
      items: insightsItems,
      preFooterTitle: "Ready to Make Informed Decisions?",
      preFooterSubtitle: "Speak with our team for personalized guidance based on your goals and current market context.",
    };
  }

  return null;
};

export function InsightsPageScope({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  if (pathname === "/services/property-management") {
    return (
      <div data-insights-page className="contents">
        {children}
      </div>
    );
  }

  const shellConfig = getCategoryShellConfig(pathname);

  if (shellConfig) {
    return (
      <div data-insights-page className="contents">
        <MIPageShell
          heroTitle={shellConfig.title}
          heroDescription={shellConfig.description}
          heroCTAs={[
            { label: `Explore ${shellConfig.title}`, href: "#category-content" },
            { label: "Speak With Our Team", href: "/contact" },
          ]}
          tocItems={shellConfig.items}
          tocTitle={shellConfig.tocTitle}
          preFooterTitle={shellConfig.preFooterTitle}
          preFooterSubtitle={shellConfig.preFooterSubtitle}
          bodyClassName="jj-category-shell-body"
        >
          <div id="category-content" data-category-shell-body className="scroll-mt-24">
            {children}
          </div>
        </MIPageShell>
      </div>
    );
  }

  return (
    <div data-insights-page className="contents">
      {children}
    </div>
  );
}

export default InsightsPageScope;
