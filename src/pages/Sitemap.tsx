/**
 * Sitemap Page — rebuilt per owner spec (Phase 3).
 * - Emerald hero, no decorative gold divider lines, balanced CTA buttons
 * - Champagne quick-links strip with black text/icons, separates hero from directory
 * - Directory on champagne, emerald cards with white text
 * - Support & Legal appears as a directory card beside Careers
 * - Get in Touch on emerald (sidebar tone), champagne cards with black text
 * - Canonical pre-footer CTA (no fake/manual closing block)
 * - Floating champagne back-to-top button removed; global emerald button handles it
 * - AI tools filtered via ai_tool_visibility with correct tool_id mapping
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { useUserMode } from "@/hooks/useUserMode";
import {
  Map,
  Home,
  Building2,
  Briefcase,
  ArrowRight,
  Phone,
  BookOpen,
  BarChart3,
  GraduationCap,
  Layers,
  Key,
  Sparkles,
  Headphones,
  Calendar,
  CreditCard,
} from "lucide-react";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import PreFooterSeparator from "@/components/PreFooterSeparator";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

// ---------------- Data ----------------

const quickLinks = [
  { href: "/properties?transaction=buy", label: "Buy Properties", icon: Home },
  { href: "/properties?transaction=rent", label: "Rent Properties", icon: Key },
  { href: "/developers", label: "Developers", icon: Building2 },
  { href: "/seller-listing", label: "List Your Property", icon: Layers },
  { href: "/services", label: "Services", icon: Briefcase },
  { href: "/guides", label: "Guides", icon: BookOpen },
  { href: "/market-intelligence", label: "Market Intelligence", icon: BarChart3 },
  { href: "/investor-education", label: "Investor Hub", icon: Layers },
  { href: "/broker-toolkit", label: "Broker Hub", icon: GraduationCap },
];

interface HubSection {
  id: string;
  title: string;
  icon: React.ElementType;
  links: { href: string; label: string }[];
}

const hubSections: HubSection[] = [
  {
    id: "properties",
    title: "Properties",
    icon: Home,
    links: [
      { href: "/properties", label: "All Properties" },
      { href: "/properties?transaction=buy", label: "Buy Properties" },
      { href: "/properties?transaction=rent", label: "Rent Properties" },
      { href: "/developers", label: "Browse Developers" },
      { href: "/communities", label: "Communities" },
      { href: "/map", label: "Property Map" },
      { href: "/seller-listing", label: "List Your Property" },
      { href: "/compare", label: "Compare Properties" },
      { href: "/favorites", label: "Saved Properties" },
    ],
  },
  {
    id: "services",
    title: "Services",
    icon: Briefcase,
    links: [
      { href: "/services", label: "All Services" },
      { href: "/services/buying-advisory", label: "Buying Advisory" },
      { href: "/services/selling-advisory", label: "Selling Advisory" },
      { href: "/services/rental-advisory", label: "Rental Advisory" },
      { href: "/services/investment-advisory", label: "Investment Advisory" },
      { href: "/partners", label: "Partner Introductions" },
      { href: "/partners/mortgage", label: "Mortgage Partners" },
      { href: "/partners/legal", label: "Legal Partners" },
      { href: "/partners/company-setup", label: "Company Setup" },
      { href: "/partners/visa-services", label: "Visa Services" },
      { href: "/services/snagging", label: "Snagging & Inspection" },
      { href: "/services/property-management", label: "Property Management" },
      { href: "/services/short-term-rentals", label: "Short-Term Rentals" },
      { href: "/services/currency-exchange", label: "Currency Exchange" },
      { href: "/services/concierge", label: "Concierge Services" },
    ],
  },
  {
    id: "guides",
    title: "Guides",
    icon: BookOpen,
    links: [
      { href: "/guides", label: "Guides Library" },
      { href: "/buyer-guide", label: "Buyer Guide" },
      { href: "/seller-guide", label: "Seller Guide" },
      { href: "/landlord-guide", label: "Landlord Guide" },
      { href: "/tenant-guide", label: "Tenant Guide" },
      { href: "/areas", label: "Area Guides" },
      { href: "/investor-education", label: "Investor Education" },
      { href: "/faq", label: "General FAQ" },
      { href: "/investor-faq", label: "Investor FAQ" },
      { href: "/broker-faq", label: "Broker FAQ" },
      { href: "/guides/golden-visa-uae", label: "Golden Visa Guide" },
    ],
  },
  {
    id: "market-intelligence",
    title: "Market Intelligence",
    icon: BarChart3,
    links: [
      { href: "/market-intelligence", label: "Market Intelligence Hub" },
      { href: "/market-intelligence/overview", label: "Market Overview" },
      { href: "/market-intelligence/areas", label: "Area Intelligence" },
      { href: "/market-intelligence/reports", label: "Market Reports" },
      { href: "/market-intelligence/methodology", label: "Methodology" },
    ],
  },
  {
    id: "investor-hub",
    title: "Investor Hub",
    icon: Layers,
    links: [
      { href: "/investor-education", label: "Investor Education" },
      { href: "/investor-faq", label: "Investor FAQs" },
      { href: "/ai-hub", label: "Investor Tools" },
      { href: "/investor-dashboard", label: "Investor Dashboard" },
      { href: "/investor-dashboard/portfolio", label: "Portfolio Views" },
    ],
  },
  {
    id: "broker-academy",
    title: "Broker & Academy",
    icon: GraduationCap,
    links: [
      { href: "/broker/portal", label: "Broker Portal" },
      { href: "/broker-toolkit", label: "Broker Tools" },
      { href: "/broker-dashboard", label: "Broker Dashboard" },
      { href: "/jbj-academy", label: "JBJ Academy" },
      { href: "/broker-faq", label: "Broker FAQ" },
      { href: "/verify-certificate/lookup", label: "Verify Certificate" },
    ],
  },
  {
    id: "developer-hub",
    title: "Developer Hub",
    icon: Building2,
    links: [
      { href: "/developer-center", label: "Developer Center" },
      { href: "/developer-registration", label: "Developer Registration" },
      { href: "/developer-portal", label: "Developer Portal" },
      { href: "/submit-project", label: "Submit Project" },
      { href: "/submit-event", label: "Submit Event" },
    ],
  },
  {
    id: "company",
    title: "Company",
    icon: Building2,
    links: [
      { href: "/about", label: "About JBJ Global Real Estate" },
      { href: "/contact", label: "Contact Us" },
      { href: "/news", label: "News & Insights" },
      { href: "/join", label: "Join Our Team" },
      { href: "/team", label: "Meet The Team" },
      { href: "/founder", label: "Founder & Leadership" },
      { href: "/awards", label: "Awards & Recognition" },
      { href: "/company-profile", label: "Company Profile" },
    ],
  },
  {
    id: "tools",
    title: "AI & Professional Tools",
    icon: Sparkles,
    links: [
      { href: "/ai-hub", label: "AI Hub" },
      { href: "/broker-toolkit", label: "Royal Tools Hub" },
      { href: "/ai-home-finder", label: "AI Home Finder" },
      { href: "/property-evaluator", label: "Property Evaluator" },
      { href: "/mortgage-calculator", label: "Mortgage Calculator" },
      { href: "/rental-index", label: "Rental Index" },
      { href: "/interior-design-ai", label: "AI Interior Design" },
      { href: "/ai-hub#price-predictor", label: "AI Price Predictor" },
      { href: "/ai-hub#neighborhood-insights", label: "AI Neighborhood Insights" },
      { href: "/ai-hub#property-analyzer", label: "AI Property Analyzer" },
      { href: "/ai-contract-reviewer", label: "AI Contract Reviewer" },
      { href: "/business-card-scanner", label: "Business Card Scanner" },
      { href: "/documents", label: "Documents & Spreadsheets" },
      { href: "/video-meeting", label: "Video Meet" },
      { href: "/ai-calendar", label: "Calendar & Notes" },
    ],
  },
  {
    id: "my-account",
    title: "My Account",
    icon: CreditCard,
    links: [
      { href: "/my-dashboard", label: "My Dashboard" },
      { href: "/profile?tab=settings", label: "Account Settings" },
      { href: "/account/billing", label: "Billing & Subscriptions" },
      { href: "/favorites", label: "Saved Properties" },
      { href: "/my-tickets", label: "My Tickets" },
      { href: "/pricing", label: "Plans & Pricing" },
    ],
  },
  {
    id: "careers",
    title: "Careers",
    icon: Briefcase,
    links: [
      { href: "/join", label: "Submit Your CV" },
      { href: "/join?type=broker", label: "Become a Broker" },
      { href: "/join?type=agent", label: "Apply as Agent" },
      { href: "/join?type=marketing", label: "Marketing Positions" },
      { href: "/join?type=tech", label: "Technology Roles" },
      { href: "/broker-education", label: "Training Programs" },
      { href: "/team", label: "Meet Our Team" },
    ],
  },
  {
    id: "support-legal",
    title: "Support & Legal",
    icon: Headphones,
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/intellectual-property", label: "Intellectual Property" },
      { href: "/services/complaint-procedures", label: "Complaint Procedures" },
      { href: "/services/customer-happiness-center", label: "Customer Happiness Center" },
      { href: "/cookies", label: "Cookies Policy" },
    ],
  },
];

// Map a link href to every plausible ai_tool_visibility.tool_id so hidden
// tools stay hidden even when the DB uses an "ai-" prefix and the URL doesn't.
const hrefToToolIds = (href: string): string[] => {
  if (!href) return [];
  const ids: string[] = [];
  const hash = href.split("#")[1];
  if (hash) {
    ids.push(hash);
    if (!hash.startsWith("ai-")) ids.push(`ai-${hash}`);
    return ids;
  }
  const path = href.split("?")[0].replace(/^\/+/, "");
  if (!path) return [];
  const last = path.split("/").pop() || "";
  if (last) {
    ids.push(last);
    if (!last.startsWith("ai-")) ids.push(`ai-${last}`);
  }
  return ids;
};

// ---------------- Small UI primitives ----------------

/**
 * Champagne pill button — shared by Quick Links strip and Support & Legal.
 * Balanced sizing; black icon + black text on champagne surface, gold ring.
 */
const ChampagnePill = ({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
}) => (
  <Link
    to={to}
    className="inline-flex h-11 min-w-[172px] items-center justify-center gap-2 px-5 rounded-full bg-gradient-to-b from-[#FDFBF7] via-[#F2E9D6] to-[#E1CFA6] border border-[#B89555]/60 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_2px_8px_rgba(184,149,85,0.18)] hover:shadow-[0_2px_12px_rgba(184,149,85,0.35)] hover:-translate-y-0.5 transition-all"
  >
    <Icon className="w-4 h-4 text-[#0F172A]" strokeWidth={2} />
    <span className="text-[#0F172A] text-sm font-semibold whitespace-nowrap">
      {label}
    </span>
  </Link>
);

const HubCard = ({
  hub,
  hideFounderLinks,
  hiddenToolIds,
}: {
  hub: HubSection;
  hideFounderLinks?: boolean;
  hiddenToolIds: Set<string>;
}) => {
  const Icon = hub.icon;

  const filteredLinks = hub.links.filter((link) => {
    if (
      hideFounderLinks &&
      (link.href.includes("/founder") || link.label.toLowerCase().includes("founder"))
    )
      return false;
    const ids = hrefToToolIds(link.href);
    if (ids.some((id) => hiddenToolIds.has(id))) return false;
    return true;
  });

  if (filteredLinks.length === 0) return null;

  return (
    <motion.div
      variants={fadeInUp}
      id={hub.id}
      className="bg-gradient-to-br from-[#064E3B] via-[#053d2e] to-[#042c1c] border border-[#B89555]/30 rounded-2xl p-6 hover:border-[#B89555]/70 hover:shadow-[0_10px_30px_rgba(6,78,59,0.25)] transition-all"
    >
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 border border-white/15">
          <Icon className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <h3 className="text-white font-cormorant text-2xl font-semibold tracking-wide">
          {hub.title}
        </h3>
      </div>

      <ul className="space-y-0.5">
        {filteredLinks.map((link, index) => (
          <li key={`${link.href}-${index}`}>
            <Link
              to={link.href}
              className="group flex items-center justify-between py-2 px-2 rounded-md hover:bg-white/[0.06] transition-colors"
            >
              <span className="text-white/85 group-hover:text-white text-[13.5px] leading-snug transition-colors">
                {link.label}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E8D5A3] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

// ---------------- Page ----------------

const Sitemap = () => {
  const { isFounderVisible } = useFounderVisibility();
  const { mode } = useUserMode();

  const { data: hiddenToolIds } = useQuery({
    queryKey: ["sitemap-hidden-ai-tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_tool_visibility")
        .select("tool_id, is_public")
        .eq("is_public", false);
      if (error) return new Set<string>();
      return new Set<string>((data ?? []).map((r: any) => r.tool_id));
    },
    staleTime: 60_000,
  });
  const hiddenIds = hiddenToolIds ?? new Set<string>();

  // Filter sitemap sections by active user mode so investors don't see
  // broker/academy/developer surfaces and vice-versa.
  const filteredHubSections = hubSections.filter((hub) => {
    if (mode === "investor") {
      return !["broker-academy", "developer-hub"].includes(hub.id);
    }
    if (mode === "broker") {
      return !["investor-hub", "developer-hub"].includes(hub.id);
    }
    if (mode === "developer") {
      return !["broker-academy", "investor-hub"].includes(hub.id);
    }
    return true;
  });


  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <SEOHead
        title="Sitemap | JBJ Global Real Estate"
        description="Navigate the complete JBJ Global Real Estate platform. All pages, tools, services, and resources organized for quick access."
        keywords="sitemap, navigation, JBJ pages, website map, Dubai real estate"
        canonicalPath="/sitemap"
      />

      <div className="min-h-screen bg-[#EFE6D6]">
        {/* HERO — emerald, no gold divider lines */}
        <section
          data-hero-dark
          data-surface="emerald"
          className="relative overflow-hidden bg-gradient-to-b from-[#064E3B] via-[#042c1c] to-[#01120b]"
        >
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-4xl mx-auto"
            >
              <motion.div variants={fadeInUp} className="mb-6 flex justify-center">
                <Badge className="bg-white/10 text-white border border-white/25 px-4 py-1.5 text-xs uppercase tracking-[0.2em] rounded-full">
                  <Map className="w-3.5 h-3.5 mr-1.5" />
                  Sitemap
                </Badge>
              </motion.div>

              <motion.h1
                className="font-cormorant text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-5 text-white"
                variants={fadeInUp}
              >
                Navigate JBJ Global Real Estate
              </motion.h1>

              <motion.p
                className="text-white/75 text-base sm:text-lg max-w-2xl mx-auto mb-8"
                variants={fadeInUp}
              >
                Your complete directory to every page, tool, service, and resource across the platform.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mb-6"
              >
                <div className="w-full sm:w-[220px]">
                  <PremiumHeroButton href="/properties" size="lg" className="w-full">
                    Browse Properties
                  </PremiumHeroButton>
                </div>
                <div className="w-full sm:w-[220px]">
                  <PremiumHeroButton href="/contact" size="lg" className="w-full">
                    Contact Us
                  </PremiumHeroButton>
                </div>
              </motion.div>

              <motion.p variants={fadeInUp} className="text-white/70 text-xs">
                Last updated: {lastUpdated}
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* QUICK LINKS — champagne separator strip */}
        <section className="py-8 sm:py-10 bg-gradient-to-b from-[#F5EBD3] via-[#EFE2C4] to-[#E7D6B0] border-y border-[#B89555]/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap justify-center gap-3">
              {quickLinks.map((link) => (
                <ChampagnePill
                  key={link.href}
                  to={link.href}
                  label={link.label}
                  icon={link.icon}
                />
              ))}
            </div>
          </div>
        </section>

        {/* DIRECTORY — champagne background, emerald cards */}
        <section className="py-14 sm:py-20 bg-[#EFE6D6]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-12"
            >
              <h2 className="font-cormorant text-3xl sm:text-4xl font-semibold text-[#0F172A] mb-3">
                Complete Directory
              </h2>
              <p className="text-[#0F172A]/70 text-sm sm:text-base max-w-xl mx-auto">
                All pages organized by category for easy navigation
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6"
            >
              {filteredHubSections.map((hub) => (
                <HubCard
                  key={hub.id}
                  hub={hub}
                  hideFounderLinks={!isFounderVisible}
                  hiddenToolIds={hiddenIds}
                />
              ))}
            </motion.div>
          </div>
        </section>

        {/* GET IN TOUCH — emerald sidebar tone, champagne cards, black text */}
        <section className="py-14 sm:py-16 bg-gradient-to-b from-[#064E3B] via-[#053d2e] to-[#042c1c]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="font-cormorant text-3xl sm:text-4xl font-semibold text-white mb-2">
                Get In Touch
              </h2>
              <p className="text-white/75 text-sm">
                Choose your preferred way to connect with us
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {[
                {
                  to: "/contact?type=support",
                  icon: Headphones,
                  title: "Support Ticket",
                  desc: "Get help with any questions or issues",
                  cta: "Submit Ticket",
                },
                {
                  to: "/contact?type=consultation",
                  icon: Calendar,
                  title: "Free Consultation",
                  desc: "Book a call with our expert advisors",
                  cta: "Book Now",
                },
                {
                  to: "/contact",
                  icon: Phone,
                  title: "Contact Us",
                  desc: "Reach our team directly via phone or email",
                  cta: "Get in Touch",
                },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <Link key={card.to} to={card.to} className="block">
                    <motion.div
                      data-surface="champagne"
                      data-no-contrast-guard
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="h-full min-w-0 overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F5EBD3] to-[#E7D6B0] border border-[#B89555]/50 rounded-2xl p-4 text-center hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 transition-all"
                      style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
                    >
                      <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-white/70 border border-[#B89555]/50 flex items-center justify-center">
                        <Icon className="w-7 h-7 text-[#1A1A1A]" strokeWidth={2} style={{ color: "#1A1A1A", stroke: "#1A1A1A" }} />
                      </div>
                      <h3 className="text-[#1A1A1A] font-cormorant font-semibold text-lg mb-2" style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}>
                        {card.title}
                      </h3>
                      <p className="text-[#1A1A1A] text-xs leading-snug mb-4" style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}>{card.desc}</p>
                      <span className="inline-flex items-center gap-2 text-[#1A1A1A] font-semibold text-sm" style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}>
                        {card.cta} <ArrowRight className="w-4 h-4" style={{ color: "#1A1A1A", stroke: "#1A1A1A" }} />
                      </span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <PreFooterSeparator
          title="Ready to Get Started?"
          subtitle="Connect with our expert team for personalized guidance across sales, investment, and property services."
        />
      </div>
    </>
  );
};

export default Sitemap;
