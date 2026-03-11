/**
 * Sitemap Page - Premium Corporate Directory
 * Hub-based organization matching the platform structure
 * Matches existing UI theme (colors, typography, cards, buttons)
 */

import { useState, useEffect } from "react";
import VideoBackground from "@/components/VideoBackground";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { SEOHead } from "@/components/SEOHead";
import sitemapHeroVideo from "@/assets/videos/sitemap-hero.mp4";
import CTABand from "@/components/home/CTABand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import {
  Map,
  Home,
  Building2,
  Users,
  Briefcase,
  FileText,
  ArrowRight,
  ChevronUp,
  Phone,
  MessageCircle,
  BookOpen,
  BarChart3,
  GraduationCap,
  Shield,
  Layers,
  Key,
  Sparkles,
  Calculator,
  MapPin,
  Scale,
  Heart,
  Wrench,
  Award,
  Newspaper,
  Headphones,
  Calendar,
} from "lucide-react";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

// Quick Links for the strip under hero
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

// Hub-based sitemap structure
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
      { href: "/services/company-setup", label: "Company Setup" },
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
      { href: "/investor-dashboard/reports", label: "Report Access (Investor Portal)" },
    ],
  },
  {
    id: "broker-hub",
    title: "Broker Hub",
    icon: GraduationCap,
    links: [
      { href: "/jbj-academy", label: "JBJ Academy" },
      { href: "/academy/graduates", label: "Academy Graduates" },
      { href: "/broker-toolkit", label: "Broker Tools" },
      { href: "/broker-dashboard", label: "Broker Dashboard" },
      { href: "/broker-education", label: "Broker Education" },
      { href: "/broker-resources", label: "Broker Resources" },
      { href: "/broker-faq", label: "Broker FAQ" },
      { href: "/verify-certificate/lookup", label: "Verify Certificate" },
    ],
  },
  {
    id: "company",
    title: "Company",
    icon: Building2,
    links: [
      { href: "/about", label: "About JBJ Global" },
      { href: "/contact", label: "Contact Us" },
      { href: "/news", label: "News & Insights" },
      { href: "/join", label: "Join Our Team" },
      { href: "/team", label: "Meet The Team" },
      { href: "/founder", label: "Founder & Leadership" },
      { href: "/awards", label: "Awards & Recognition" },
      { href: "/company-profile", label: "Company Profile" },
      { href: "/press-kit", label: "Press Kit" },
      { href: "/philanthropy", label: "Philanthropy" },
    ],
  },
  {
    id: "tools",
    title: "AI & Professional Tools",
    icon: Sparkles,
    links: [
      // Hub Entry
      { href: "/ai-hub", label: "AI Hub" },
      { href: "/broker-toolkit", label: "Royal Tools Hub" },
      
      // Property Intelligence
      { href: "/quiz", label: "AI Home Finder" },
      { href: "/property-evaluator", label: "Property Evaluator" },
      { href: "/mortgage-calculator", label: "Mortgage Calculator" },
      { href: "/rental-index", label: "Rental Index" },
      { href: "/interior-design-ai", label: "AI Interior Design" },
      { href: "/ai-hub#virtual-staging", label: "AI Virtual Staging" },
      { href: "/ai-hub#price-predictor", label: "AI Price Predictor" },
      { href: "/ai-hub#neighborhood-insights", label: "AI Neighborhood Insights" },
      { href: "/ai-hub#property-analyzer", label: "AI Property Analyzer" },
      
      // Lead & Sales
      { href: "/ai-hub#lead-qualification", label: "AI Lead Qualification" },
      { href: "/ai-hub#followup-scheduler", label: "AI Follow-up Scheduler" },
      { href: "/ai-hub#objection-handler", label: "AI Objection Handler" },
      { href: "/ai-hub#client-matcher", label: "AI Client Matcher" },
      
      // Analytics
      { href: "/ai-hub#market-report", label: "AI Market Report" },
      { href: "/ai-hub#competitor-analysis", label: "AI Competitor Analysis" },
      { href: "/ai-hub#roi-calculator", label: "AI ROI Calculator" },
      { href: "/ai-hub#investment-report", label: "AI Investment Report" },
      
      // Communication
      { href: "/ai-hub#meeting-summarizer", label: "AI Meeting Summarizer" },
      { href: "/ai-hub#translation-hub", label: "AI Translation Hub" },
      { href: "/ai-hub#video-tour-script", label: "AI Video Tour Script" },
      { href: "/ai-hub#email-generator", label: "AI Email Generator" },
      { href: "/ai-hub#social-media", label: "AI Social Media" },
      { href: "/ai-hub#description-writer", label: "AI Description Writer" },
      
      // Documents & Corporate Suite
      { href: "/ai-contract-reviewer", label: "AI Contract Reviewer" },
      { href: "/e-signature", label: "E-Signature" },
      { href: "/toolkit/scan-sign", label: "Scan & Sign" },
      { href: "/toolkit/stamp-generator", label: "AI Stamp Generator" },
      { href: "/toolkit/corporate-suite/business-card", label: "Business Card Designer" },
      { href: "/toolkit/corporate-suite/logo-creator", label: "Logo Creator" },
      { href: "/toolkit/corporate-suite/cover-letter", label: "Cover Letter Generator" },
      { href: "/toolkit/corporate-suite/cv-resume", label: "CV & Resume Builder" },
      { href: "/toolkit/corporate-suite/company-profile", label: "Company Profile Builder" },
      { href: "/brand-palette", label: "Brand Color Palette" },
      
      // Creative & Media Suites
      { href: "/toolkit/pdf-suite", label: "PDF Suite" },
      { href: "/toolkit/video-suite", label: "Video Suite" },
      { href: "/toolkit/voice-suite", label: "Voice Suite" },
      { href: "/toolkit/photo-suite", label: "Photo Suite" },
      { href: "/toolkit/background-ai", label: "AI Background Remover" },
      { href: "/toolkit/beauty-filters", label: "Beauty Filters" },
      
      // Productivity Tools
      { href: "/business-card-scanner", label: "Business Card Scanner" },
      { href: "/documents", label: "Documents & Spreadsheets" },
      { href: "/video-meeting", label: "Video Meet" },
      { href: "/ai-calendar", label: "Calendar & Notes" },
      { href: "/presentations", label: "Presentations" },
      { href: "/resale-properties", label: "Resale Properties" },
    ],
  },
  {
    id: "careers",
    title: "Careers",
    icon: Briefcase,
    links: [
      { href: "/join", label: "Submit Your CV" },
      { href: "/join", label: "Join Our Team" },
      { href: "/join?type=broker", label: "Become a Broker" },
      { href: "/join?type=agent", label: "Apply as Agent" },
      { href: "/join?type=marketing", label: "Marketing Positions" },
      { href: "/join?type=tech", label: "Technology Roles" },
      { href: "/join?type=admin", label: "Administrative Roles" },
      { href: "/broker-toolkit", label: "Broker Resources" },
      { href: "/broker-education", label: "Training Programs" },
      { href: "/team", label: "Meet Our Team" },
      { href: "/onboarding", label: "Onboarding Process" },
    ],
  },
];

// Legal & Support section
const legalLinks = [
  { href: "/terms", label: "Terms of Service", icon: FileText },
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/intellectual-property", label: "Intellectual Property", icon: Shield },
  { href: "/trust-and-audit-center", label: "Trust & Audit Center", icon: Shield },
  { href: "/services/complaint-procedures", label: "Complaint Procedures", icon: FileText },
  { href: "/services/customer-happiness-center", label: "Customer Happiness Center", icon: Heart },
  { href: "/cookies", label: "Cookies Policy", icon: FileText },
];

const HubCard = ({ hub, hideFounderLinks }: { hub: HubSection; hideFounderLinks?: boolean }) => {
  const Icon = hub.icon;
  
  // Filter out founder-related links if visibility is disabled
  const filteredLinks = hideFounderLinks 
    ? hub.links.filter(link => 
        !link.href.includes('/founder') && 
        !link.label.toLowerCase().includes('founder')
      )
    : hub.links;
  
  return (
    <motion.div 
      variants={fadeInUp}
      id={hub.id}
      className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-5 sm:p-6 hover:border-gold hover:shadow-[0_8px_30px_rgba(200,167,102,0.25)] transition-all"
    >
      {/* Hub Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gold/30">
        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-gold" />
        </div>
        <h3 className="text-black text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
          {hub.title}
        </h3>
      </div>
      
      {/* Links List */}
      <ul className="space-y-1.5">
        {filteredLinks.map((link) => (
          <li key={link.href}>
            <Link
              to={link.href}
              className="group flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gold/10 transition-colors"
            >
              <span className="text-zinc-700 group-hover:text-black text-sm transition-colors">
                {link.label}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

const Sitemap = () => {
  const { isFounderVisible } = useFounderVisibility();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const lastUpdated = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Handle scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <SEOHead
        title="Sitemap | JBJ Global Real Estate"
        description="Navigate the complete JBJ Global Real Estate website. Find all pages, tools, services, and resources organized by category."
        keywords="sitemap, navigation, JBJ pages, website map, Dubai real estate"
        canonicalPath="/sitemap"
      />

      <div className="min-h-screen bg-black">
        {/* HERO SECTION */}
        <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden" style={{ minHeight: '50vh' }}>
          {/* Video Background */}
          <div className="absolute inset-0 z-0">
            <VideoBackground 
              src={sitemapHeroVideo}
              poster="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
          </div>
          
          {/* Gold accent lines */}
          <motion.div 
            className="absolute left-0 top-1/3 w-48 md:w-96 h-px bg-gradient-to-r from-gold/60 to-transparent z-10"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
          />
          <motion.div 
            className="absolute right-0 bottom-1/3 w-48 md:w-96 h-px bg-gradient-to-l from-gold/60 to-transparent z-10"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />

          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-4xl mx-auto"
            >
              {/* Badge */}
              <motion.div variants={fadeInUp} className="mb-6">
                <Badge className="bg-gold/15 text-gold border-gold/30 px-4 py-1.5 text-sm">
                  <Map className="w-3.5 h-3.5 mr-1.5" />
                  Sitemap
                </Badge>
              </motion.div>

              {/* H1 */}
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
                variants={fadeInUp}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <span className="text-white">Navigate </span>
                <span
                  style={{
                    background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  JBJ Global Real Estate
                </span>
              </motion.h1>

              {/* Subtext */}
              <motion.p
                className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-6"
                variants={fadeInUp}
              >
                Your complete directory to all pages, tools, services, and resources across our platform.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-6"
              >
                <PremiumHeroButton href="/properties" size="lg">
                  Browse Properties
                </PremiumHeroButton>
                <PremiumHeroButton href="/contact" size="lg">
                  Contact Us
                </PremiumHeroButton>
              </motion.div>

              {/* Last Updated */}
              <motion.p 
                variants={fadeInUp}
                className="text-zinc-500 text-xs"
              >
                Last Updated: {lastUpdated}
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* QUICK LINKS STRIP */}
        <section className="py-6 bg-black border-y border-gold/20">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-lg hover:border-gold hover:shadow-lg transition-all group"
                  >
                    <Icon className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                    <span className="text-black text-xs sm:text-sm font-medium group-hover:text-gold transition-colors whitespace-nowrap">
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* MAIN SITEMAP DIRECTORY - Following 3-Layer System */}
        <section className="py-12 sm:py-16 md:py-20 bg-black">
          <div className="jj-layer-2">
            {/* Section Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-black text-2xl sm:text-3xl font-bold mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                Complete <span className="text-gold">Directory</span>
              </h2>
              <p className="text-zinc-600 text-sm sm:text-base max-w-xl mx-auto">
                All pages organized by category for easy navigation
              </p>
            </motion.div>

            {/* Hub Grid */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
            >
              {hubSections.map((hub) => (
                <HubCard 
                  key={hub.id} 
                  hub={hub} 
                  hideFounderLinks={!isFounderVisible}
                />
              ))}
            </motion.div>
          </div>
        </section>

        {/* LEGAL & SUPPORT SECTION - Following 3-Layer System */}
        <section className="py-10 sm:py-12 bg-black">
          <div className="jj-layer-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <h2 className="text-black text-xl sm:text-2xl font-bold mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                Support & <span className="text-gold">Legal</span>
              </h2>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {legalLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-lg hover:border-gold hover:shadow-lg transition-all group"
                  >
                    <Icon className="w-4 h-4 text-gold" />
                    <span className="text-zinc-700 group-hover:text-black text-sm transition-colors">
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* SUPPORT & CONTACT CARDS */}
        <section className="py-10 sm:py-12 bg-black">
          <div className="jj-layer-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <h2 className="text-black text-xl sm:text-2xl font-bold mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                Get <span className="text-gold">In Touch</span>
              </h2>
              <p className="text-zinc-600 text-sm">Choose your preferred way to connect with us</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-4xl mx-auto">
              {/* Support Ticket */}
              <Link to="/contact?type=support">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0 }}
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6 hover:border-gold hover:shadow-lg transition-all text-center group"
                >
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Headphones className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="text-black font-bold text-lg mb-2">Support Ticket</h3>
                  <p className="text-zinc-600 text-sm mb-4">Get help with any questions or issues</p>
                  <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm">
                    Submit Ticket <ArrowRight className="w-4 h-4" />
                  </span>
                </motion.div>
              </Link>

              {/* Free Consultation */}
              <Link to="/contact?type=consultation">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6 hover:border-gold hover:shadow-lg transition-all text-center group"
                >
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="text-black font-bold text-lg mb-2">Free Consultation</h3>
                  <p className="text-zinc-600 text-sm mb-4">Book a call with our expert advisors</p>
                  <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm">
                    Book Now <ArrowRight className="w-4 h-4" />
                  </span>
                </motion.div>
              </Link>

              {/* Contact Us */}
              <Link to="/contact">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6 hover:border-gold hover:shadow-lg transition-all text-center group"
                >
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Phone className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="text-black font-bold text-lg mb-2">Contact Us</h3>
                  <p className="text-zinc-600 text-sm mb-4">Reach our team directly via phone or email</p>
                  <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm">
                    Get in Touch <ArrowRight className="w-4 h-4" />
                  </span>
                </motion.div>
              </Link>
            </div>
          </div>
        </section>

        {/* READY TO GET STARTED - CTABand */}
        <CTABand />

        {/* BACK TO TOP SECTION */}
        <section className="py-8 bg-black border-t border-zinc-800">
          <div className="container mx-auto px-4 text-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black rounded-xl hover:border-gold hover:shadow-lg transition-all"
            >
              <ChevronUp className="w-5 h-5 text-gold" />
              <span className="font-medium">Back to Top</span>
            </button>
          </div>
        </section>

        {/* Floating Back to Top Button */}
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-6 z-40 w-12 h-12 bg-gold text-black rounded-full shadow-lg hover:bg-gold-dark transition-all flex items-center justify-center"
            aria-label="Back to top"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </div>
    </>
  );
};

export default Sitemap;
