import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import YouTubeVideoPlayer from "@/components/YouTubeVideoPlayer";
import { motion } from "framer-motion";
import { 
  Download, 
  FileText, 
  Building2, 
  Globe, 
  Shield,
  Target,
  CheckCircle,
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  Mail,
  Briefcase,
  Eye,
  Heart,
  Home,
  TrendingUp,
  Key,
  HardHat,
  ChevronRight,
  User,
  BookOpen,
  Flame,
  Cpu,
  Store,
  Palmtree,
  Users,
  Handshake,
  BarChart3,
  Sparkles,
  ArrowRight,
  ExternalLink
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { COMPANY_STATS, CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { toast } from "sonner";
import { FounderContent } from "@/components/FounderContent";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { useAreas } from "@/hooks/useAreas";
import { companyProfileBook } from "@/data/bookCollections";

import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";
import founderCompanyProfile from "@/assets/founder-company-profile.jpg";
import { SEOHead } from "@/components/SEOHead";

function SectionShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`py-8 md:py-10 bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)] ${className ?? ""}`.trim()}>
      <div className="jj-layer-2 surface-champagne" data-surface="champagne">
        <div className="w-full px-4 sm:px-6 lg:px-8">{children}</div>
      </div>
    </section>
  );
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

// ── Content merged from the official 18-page Company Profile PDF ──
const PROFILE_CONTENT = {
  coverPage: {
    title: "JBJ Global Real Estate",
    subtitle: "Global Real Estate Platform & Marketplace",
    subtitleFallback: "Company Profile"
  },

  executiveSummary: `A real estate platform and brokerage headquartered in Dubai, designed to connect investors, property buyers, developers, and brokers within a structured real estate ecosystem.

The company operates as both a brokerage and a marketplace platform, enabling access to curated property opportunities while facilitating collaboration between real estate professionals and investors across Dubai and international markets.

JBJ Global Real Estate focuses on creating a transparent and structured environment where property opportunities can be discovered, evaluated, and executed efficiently — supported by professional advisory at every stage.

The platform is designed to simplify real estate discovery, transactions, and advisory through a professional framework that serves investors, buyers, brokers, and developers alike.

Headquartered in Dubai, one of the world's most dynamic real estate markets, JBJ Global Real Estate is positioned to serve both local and international clients seeking premium property opportunities in the UAE and beyond.`,

  platformPositioning: `JBJ Global Real Estate is positioned as a modern real estate platform that facilitates the interaction between the core players of the property ecosystem.`,

  platformPlayers: [
    { title: "Global Investors", description: "Seeking property opportunities across Dubai and international markets." },
    { title: "Property Buyers", description: "Looking for homes or investment assets with professional guidance." },
    { title: "Real Estate Brokers", description: "Seeking listings, collaboration, and transaction support." },
    { title: "Developers", description: "Launching residential projects and reaching qualified buyers." },
    { title: "Service Providers", description: "Supporting real estate transactions end-to-end." },
  ],

  brandStory: `JBJ Global Real Estate was founded with a clear mandate: to elevate the standard of real estate advisory in Dubai by replacing transactional brokerage with structured, client-centric representation.

The Dubai property market is dynamic, fast-moving, and opportunity-rich — but it also demands discipline, accurate information, and local expertise. JBJ was established to guide clients through this complexity with confidence and clarity. The firm's foundation is built on experience across residential sales, leasing, investment structuring, and developer-led projects.

Founder-led and strategically focused, JBJ Global Real Estate operates with the understanding that real estate decisions have long-term financial and lifestyle impact. Our role is not to sell inventory, but to interpret the market, present clear options, and support informed decisions aligned with each client's goals.

Today, JBJ Global Real Estate serves local and international clients seeking reliable representation, transparent processes, and premium service delivery in Dubai's evolving property landscape.`,

  vision: "To build one of the most recognized real estate platforms headquartered in Dubai that enables investors and professionals to access property opportunities through a unified ecosystem. The long-term vision is to expand the platform globally while maintaining strong market expertise in Dubai, becoming the preferred gateway for international capital entering the UAE property market.",

  mission: "To simplify access to global real estate opportunities by connecting investors, brokers, developers, and buyers through a structured real estate platform. JBJ Global Real Estate aims to facilitate property transactions through professional advisory and a transparent marketplace environment — ensuring every client interaction is guided by integrity, market knowledge, and a commitment to long-term value creation.",

  values: [
    { title: "Transparency", description: "Professional advisory and clear communication at every stage of the client relationship." },
    { title: "Client Focus", description: "Aligning every opportunity with the client's investment objectives and lifestyle goals." },
    { title: "Market Knowledge", description: "Deep understanding of the dynamics of global and Dubai real estate markets." },
    { title: "Professional Execution", description: "Supporting clients throughout the entire transaction process with precision and care." },
    { title: "Long-Term Relationships", description: "Building lasting partnerships with investors and brokers beyond individual transactions." },
  ],

  services: [
    {
      title: "Property Brokerage",
      description: "Licensed brokerage services for buying, selling, and leasing residential properties across Dubai's prime communities.",
      idealFor: "Buyers, sellers, and tenants.",
      deliverables: "Property search, listing, negotiation, and closing.",
      icon: Home
    },
    {
      title: "Property Investment Advisory",
      description: "Guidance for investors seeking curated opportunities in the Dubai property market, aligned with their financial objectives.",
      idealFor: "Yield-focused investors.",
      deliverables: "Market analysis, risk assessment, scenario comparison.",
      icon: Briefcase
    },
    {
      title: "Off-Plan Property Opportunities",
      description: "Exclusive access to residential developments from leading developers across Dubai's most sought-after locations.",
      idealFor: "Investors and early buyers.",
      deliverables: "Project evaluation, payment plan analysis, booking coordination.",
      icon: HardHat
    },
    {
      title: "Luxury Property Search",
      description: "Sourcing premium apartments, villas, and waterfront residences tailored to client specifications.",
      idealFor: "High-net-worth individuals.",
      deliverables: "Curated shortlists, exclusive viewings, white-glove service.",
      icon: Key
    },
    {
      title: "Transaction Coordination",
      description: "Professional support throughout negotiation, documentation, and closing procedures.",
      idealFor: "All property transactions.",
      deliverables: "Contract review, DLD coordination, timeline management.",
      icon: TrendingUp
    },
    {
      title: "Property Management Support",
      description: "Connection with trusted partners for comprehensive property management services.",
      idealFor: "Portfolio landlords.",
      deliverables: "Leasing oversight, tenant coordination, renewal management.",
      icon: Building2
    },
    {
      title: "Mortgage & Legal Coordination",
      description: "Assistance connecting clients with financing institutions and legal advisory partners.",
      idealFor: "Buyers requiring financing.",
      deliverables: "Mortgage referrals, legal partner introductions, documentation support.",
      icon: Shield
    },
    {
      title: "Client Onboarding",
      description: "A structured onboarding process ensuring every client is properly introduced to the platform, objectives are defined, and the right advisory pathway is established from day one.",
      idealFor: "All new clients.",
      deliverables: "Needs assessment, advisor matching, platform orientation.",
      icon: Users
    },
  ],

  aiTools: [
    { title: "AI-Powered Property Matching", description: "Intelligent algorithms that match investors and buyers with the most relevant property opportunities based on their objectives and preferences." },
    { title: "AI Visual Content Creation", description: "High-quality property visuals, renders, and marketing imagery generated through AI to elevate listings and presentations." },
    { title: "Smart Content Generation", description: "AI-assisted copywriting for property descriptions, investment briefs, and client-facing materials produced with speed and precision." },
    { title: "Market Intelligence Tools", description: "Data-driven insights and analytics to support investment decisions and market positioning." },
    { title: "Creative Marketing Production", description: "End-to-end creative production for digital campaigns, social media, and branded property marketing materials." },
    { title: "Workflow Automation", description: "Streamlined internal processes and client communication workflows powered by automation enabling faster, more efficient service delivery." },
  ],

  marketplace: {
    intro: "JBJ Global Real Estate operates as a real estate marketplace designed to facilitate the discovery and acquisition of property opportunities across Dubai and beyond.",
    features: [
      { title: "Curated Listings", description: "Carefully selected residential property listings across Dubai's prime communities." },
      { title: "Developer Opportunities", description: "Direct access to off-plan and new launch projects from leading developers." },
      { title: "Broker Collaboration", description: "A structured environment for brokers to connect, collaborate, and transact." },
      { title: "Investment Advisory", description: "Professional guidance to support informed investment decisions." },
      { title: "Transaction Facilitation", description: "End-to-end support from property discovery through to completion." },
    ],
  },

  dubaiDestination: {
    intro: "Dubai remains one of the most dynamic and resilient real estate markets globally, consistently attracting international capital and high-net-worth investors from across the world.",
    highlights: [
      { title: "World-Class Infrastructure", description: "A city built to global standards with continuous investment in urban development and connectivity." },
      { title: "Global Connectivity", description: "A strategic hub connecting East and West, with direct access to over 200 destinations worldwide." },
      { title: "Exceptional Lifestyle", description: "A cosmopolitan environment offering premium living, safety, and quality of life." },
      { title: "Investor-Friendly Environment", description: "No income tax, strong legal frameworks, and transparent property ownership regulations." },
      { title: "Continuous Urban Growth", description: "Ongoing mega-projects and master-planned communities driving long-term property value appreciation." },
      { title: "Golden Visa Destination", description: "Property investments above AED 2 million qualify investors for UAE long-term residency and access." },
    ],
  },

  primeAreas: [
    { name: "Downtown Dubai", description: "The city's iconic centre, home to world-class residences and unmatched urban lifestyle." },
    { name: "Business Bay", description: "A thriving mixed-use district with strong rental demand and proximity to Downtown Dubai." },
    { name: "Dubai Marina", description: "A vibrant waterfront community offering premium apartments and marina living." },
    { name: "Palm Jumeirah", description: "Dubai's iconic island destination with beachfront villas and ultra-luxury residences." },
    { name: "Dubai Hills Estate", description: "A master-planned community offering family villas and green living within the city." },
    { name: "Mohammed Bin Rashid City", description: "A premium mixed-use destination with luxury residences and world-class amenities." },
    { name: "Dubai Creek Harbour", description: "A waterfront district with modern residences, marina views, and strong investment potential." },
    { name: "Jumeirah Bay Island", description: "An exclusive island community with ultra-luxury villas and panoramic sea views." },
  ],

  // Used for the area photo card filter
  areas: [
    "Downtown Dubai", "Business Bay", "Dubai Marina", "Palm Jumeirah",
    "Dubai Hills Estate", "Mohammed Bin Rashid City", "Dubai Creek Harbour", "Jumeirah Bay Island"
  ],

  platformBenefits: {
    investors: [
      "Access to curated property opportunities across Dubai's prime communities",
      "Market insights and professional advisory support",
      "Guided property acquisition process from search to completion",
      "Connection to trusted legal, mortgage, and management partners",
    ],
    brokers: [
      "Access to quality property listings and developer opportunities",
      "Collaboration opportunities within a structured professional network",
      "Transaction support and coordination services",
      "A platform designed to enhance broker efficiency and reach",
    ],
  },

  investorJourney: [
    { step: "01", title: "Market Identification", description: "Investor identifies Dubai as a target market for property investment, driven by its robust growth and strategic advantages." },
    { step: "02", title: "Platform Engagement", description: "JBJ Global Real Estate provides comprehensive market insights, property overviews, and initial advisory services to clarify objectives." },
    { step: "03", title: "Curated Shortlist", description: "A meticulously selected shortlist of prime properties is presented, precisely aligned with the investor's specific objectives and budgetary parameters." },
    { step: "04", title: "Property Selection", description: "The investor critically evaluates optimal choices, making an informed selection with expert, professional guidance and due diligence." },
    { step: "05", title: "Transaction Completion", description: "The acquisition is seamlessly executed with full advisory support, encompassing all legal, financial, and logistical coordinations for a successful close." },
  ],

  partnerNetwork: {
    intro: "JBJ Global Real Estate collaborates with a carefully selected network of trusted partners across Dubai's real estate ecosystem — enabling seamless, end-to-end client support from property discovery through to post-acquisition services.",
    partners: [
      { title: "Developers", description: "Leading residential developers across Dubai's prime communities and master-planned destinations." },
      { title: "Legal Advisors", description: "Qualified legal professionals specializing in UAE property law and transaction documentation." },
      { title: "Mortgage Providers", description: "Trusted financing institutions offering competitive mortgage solutions for local and international buyers." },
      { title: "Property Management", description: "Professional property management firms ensuring optimal asset performance post-acquisition." },
      { title: "Relocation Specialists", description: "Expert relocation partners supporting international clients with seamless transitions to Dubai." },
      { title: "Golden Visa Advisory", description: "Specialist partners guiding investors through the UAE Golden Visa process, supporting long-term residency through property investment." },
    ],
  },

  process: [
    { step: 1, title: "Consultation", description: "Understand objectives and constraints." },
    { step: 2, title: "Market Review", description: "Data-based evaluation of options." },
    { step: 3, title: "Shortlisting", description: "Curated selection aligned with goals." },
    { step: 4, title: "Execution", description: "Viewing, negotiation, coordination." },
    { step: 5, title: "Transaction", description: "Documentation and closing support." },
    { step: 6, title: "After-Care", description: "Post-transaction guidance and follow-up." }
  ],

  differentiators: [
    "Objective-driven advisory",
    "Clear pricing and market logic",
    "Curated property selection",
    "Strong developer and landlord network",
    "Negotiation discipline",
    "Transparent communication",
    "End-to-end coordination",
    "Client confidentiality"
  ],

  clientExperience: [
    "Clear expectations from day one",
    "Verified information only",
    "Timely updates",
    "Single point of contact",
    "Confidential handling of data",
    "No pressure-based selling",
    "Structured documentation",
    "Post-transaction support"
  ],

  trustCompliance: `All information is provided for guidance and is subject to change. JBJ Global Real Estate does not guarantee outcomes, returns, or timelines. Property data may be updated by developers, owners, or authorities. Client information is handled in accordance with applicable data protection standards.`,

  founderProfile: {
    name: "Jane Bou Jaoude",
    title: "Founder & CEO",
    bio: `Jane Bou Jaoude founded JBJ Global Real Estate with the vision of creating a global real estate platform headquartered in Dubai that supports investors and professionals through a structured property ecosystem. Her approach focuses on transparency, professional advisory, and curated real estate opportunities.`,
    quote: "Real estate decisions deserve clarity, not pressure.",
    principles: [
      "Curated opportunities over high-volume transactions",
      "Professional and transparent advisory",
      "Premium client experience",
      "Long-term partnerships with investors and brokers",
    ],
  },

  companySnapshot: {
    headquarters: "Dubai, UAE",
    serviceAreas: "GCC & Globally",
    languages: "English",
    contact: CONTACT_INFO.phone,
    email: CONTACT_INFO.email,
    website: "WWW.JBJ.AE",
    whatsapp: CONTACT_INFO.phone,
    workingHours: "Monday–Sunday, 9:00 AM – 9:00 PM"
  },

  ctas: [
    { title: "Request a Private Consultation", description: "Book a confidential advisory session.", action: "consultation" },
    { title: "List Your Property", description: "Receive a structured pricing strategy.", action: "list" },
    { title: "Get a Curated Shortlist", description: "Access verified opportunities.", action: "shortlist" }
  ]
};

// Consistent 3D Book using the same cover asset from bookCollections
const ConsistentBook3D = ({ onClick, isGenerating }: { onClick: () => void; isGenerating: boolean }) => {
  return (
    <div className="relative group cursor-pointer" onClick={onClick} style={{ perspective: '1200px' }}>
      <div className="absolute -bottom-4 left-4 right-4 h-8 bg-[#1A1A1A]/20 blur-xl rounded-full" />
      <div
        className="relative w-52 sm:w-60 md:w-64 mx-auto transition-transform duration-500 group-hover:[transform:rotateY(-8deg)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="relative rounded-r-lg overflow-hidden shadow-[8px_8px_30px_rgba(0,0,0,0.35)]">
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/40 via-black/20 to-transparent z-10" />
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/15 to-transparent z-10" />
          <img
            src={companyProfileBook.cover}
            alt={companyProfileBook.title}
            className="w-full aspect-[2/3] object-cover"
           loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 z-10" />
        </div>
        <div
          className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-zinc-800 to-zinc-700 origin-left"
          style={{ transform: 'rotateY(-90deg) translateX(-8px)' }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-b from-[#f5f0e0] to-[#ECE2D2]"
          style={{ transform: 'rotateX(90deg) translateY(6px)', transformOrigin: 'bottom' }}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg z-20">
        <div className="text-center">
          {isGenerating ? (
            <div className="w-12 h-12 border-4 border-[#B89555]/30 border-t-[#B89555] rounded-full animate-spin mx-auto" />
          ) : (
            <>
              <Download className="w-12 h-12 text-[#B89555] mx-auto mb-2" />
              <p className="text-white font-semibold">Download PDF</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CompanyProfile = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { isFounderVisible } = useFounderVisibility();
  const { data: areasData } = useAreas({ limit: 12 });

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const { generateCompanyProfilePDF } = await import("@/utils/generateCompanyProfilePDF");
      await generateCompanyProfilePDF();
      toast.success("Company Profile downloaded successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsApp = () => {
    window.location.href = getWhatsAppUrl("Hello, I would like to request a private consultation.");
  };

  const handleCall = () => {
    window.location.href = `tel:${CONTACT_INFO.phoneRaw}`;
  };

  return (
    <div data-marketing-page className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <SEOHead
        title="Company Profile | JBJ Global Real Estate"
        description="The institutional company profile of JBJ Global Real Estate — Dubai's premier brokerage. Vision, services, leadership, awards, and full credentials."
        canonicalPath="/company-profile"
      />
      {/* Sticky Actions (Desktop) */}
      <div data-chrome="floating-actions" className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-3">
        <Button onClick={handleWhatsApp} variant="primary" size="icon" className="rounded-full" aria-label="WhatsApp">
          <MessageCircle className="w-5 h-5" />
        </Button>
        <Button onClick={handleCall} variant="primary" size="icon" className="rounded-full" aria-label="Call">
          <Phone className="w-5 h-5" />
        </Button>
        <Button
          onClick={generatePDF}
          disabled={isGenerating}
          variant="primary"
          size="icon"
          className="rounded-full"
          aria-label="Download Company Profile (PDF)"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-[#1A1A1A]/30 border-t-black rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* 1. Hero Section */}
      <section className="jj-hero-fullscreen jj-hero-compact relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={luxuryVillaHero} alt="JBJ Global Real Estate" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
        </div>

        <motion.div
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.span className="allow-white inline-block text-[#ECE2D2] text-xs uppercase tracking-[0.4em] mb-6" variants={fadeInUp} data-no-contrast-guard>
            Company Profile
          </motion.span>
          <motion.h1
            className="allow-white text-white text-4xl md:text-6xl lg:text-7xl font-bold mb-4"
            variants={fadeInUp}
            data-no-contrast-guard
          >
            {PROFILE_CONTENT.coverPage.title}
          </motion.h1>
          <motion.p className="allow-white text-[#ECE2D2] text-lg md:text-xl max-w-2xl mx-auto mb-8" variants={fadeInUp} data-no-contrast-guard>
            {PROFILE_CONTENT.coverPage.subtitle}
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <Button onClick={generatePDF} disabled={isGenerating} variant="primary" size="lg">
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#1A1A1A]/30 border-t-black rounded-full animate-spin" />
                  Downloading...
                </div>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Company Profile
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Table of Contents */}
      <SectionShell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Contents</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-4">
              Table of Contents
            </h2>
          </div>
          <div className="jj-card-inner">
            <div className="space-y-1">
              {[
                { title: 'Company Overview', anchor: 'executive-summary' },
                { title: 'Platform Positioning', anchor: 'platform-positioning' },
                { title: 'Brand Story', anchor: 'brand-story' },
                { title: 'Vision, Mission & Values', anchor: 'vision-mission' },
                { title: 'Core Services', anchor: 'services' },
                { title: 'AI Tools & Creativity', anchor: 'ai-tools' },
                { title: 'Real Estate Marketplace', anchor: 'marketplace' },
                { title: 'Dubai as a Destination', anchor: 'dubai-destination' },
                { title: 'Prime Areas of Focus', anchor: 'areas' },
                { title: 'Platform Benefits', anchor: 'platform-benefits' },
                { title: 'Portfolio Highlights', anchor: 'portfolio' },
                { title: 'Investor Journey', anchor: 'investor-journey' },
                { title: 'Partner Network', anchor: 'partner-network' },
                { title: 'Our Process', anchor: 'process' },
                { title: 'What Sets Us Apart', anchor: 'differentiators' },
                { title: 'Client Experience', anchor: 'client-experience' },
                { title: 'Trust & Compliance', anchor: 'trust' },
                { title: 'Founder & Leadership', anchor: 'founder' },
                { title: 'Company Snapshot', anchor: 'snapshot' },
                { title: 'Download Company Profile', anchor: 'download' },
              ].map((item, index) => (
                <a
                  key={index}
                  href={`#${item.anchor}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#EFE6D6]/10 transition-colors group"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#EFE6D6]/10 border border-[#B89555]/20 flex items-center justify-center text-[#B89555] text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-[#1A1A1A]/80 text-sm flex-1 group-hover:text-[#B89555] transition-colors">{item.title}</span>
                  <ChevronRight className="w-4 h-4 text-[#1A1A1A]/70 group-hover:text-[#B89555] transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </SectionShell>

      <div className="h-px bg-gradient-to-r from-transparent via-[#EFE6D6]/40 to-transparent" />

      {/* 2. Company Overview (Executive Summary) */}
      <SectionShell>
        <motion.div
          id="executive-summary"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Overview</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-6">
              Company Overview
            </h2>
          </div>
          <div className="jj-card-inner">
            <div className="space-y-6 text-[#1A1A1A]/70 leading-relaxed">
              {PROFILE_CONTENT.executiveSummary.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </motion.div>
      </SectionShell>

      {/* Platform Positioning */}
      <SectionShell>
        <motion.div
          id="platform-positioning"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Ecosystem</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-4">
              Platform Positioning
            </h2>
            <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto">{PROFILE_CONTENT.platformPositioning}</p>
          </div>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {PROFILE_CONTENT.platformPlayers.map((player) => (
              <motion.div key={player.title} className="jj-card-inner text-center" variants={fadeInUp}>
                <div className="jj-icon-box-active w-12 h-12 mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-[#1A1A1A] text-sm font-bold mb-2">{player.title}</h3>
                <p className="text-[#1A1A1A]/70 text-xs">{player.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </SectionShell>

      <FounderContent>
        {/* Company Introduction Video */}
        <SectionShell>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-10">
              <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Watch</span>
              <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-4">
                Company Introduction
              </h2>
              <p className="text-[#1A1A1A]/80 max-w-xl mx-auto">
                Discover our vision, values, and commitment to excellence in Dubai real estate.
              </p>
            </div>
            <div className="jj-card-inner p-0 overflow-hidden rounded-2xl">
              <YouTubeVideoPlayer
                videoId="lBXXdJ2kAtQ"
                title="JBJ Global Real Estate - Company Introduction"
              />
            </div>
          </motion.div>
        </SectionShell>
      </FounderContent>

      {/* 3. Brand Story */}
      <SectionShell>
        <motion.div
          id="brand-story"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Our Story</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-6">
              Brand Story
            </h2>
          </div>
          <div className="jj-card-inner">
            <div className="space-y-6 text-[#1A1A1A]/70 leading-relaxed">
              {PROFILE_CONTENT.brandStory.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </motion.div>
      </SectionShell>

      {/* 4. Vision / Mission / Values */}
      <SectionShell>
        <div id="vision-mission" className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="jj-card-inner">
              <div className="flex items-start gap-4">
                <div className="jj-icon-box-active w-12 h-12">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[#1A1A1A] text-xl font-bold mb-2">Vision</h3>
                  <p className="text-[#1A1A1A]/70 leading-relaxed">{PROFILE_CONTENT.vision}</p>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="jj-card-inner">
              <div className="flex items-start gap-4">
                <div className="jj-icon-box-active w-12 h-12">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[#1A1A1A] text-xl font-bold mb-2">Mission</h3>
                  <p className="text-[#1A1A1A]/70 leading-relaxed">{PROFILE_CONTENT.mission}</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="text-center mb-12">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Our Foundation</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold">
              Core Values
            </h2>
          </div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {PROFILE_CONTENT.values.map((value) => (
              <motion.div key={value.title} className="jj-card-inner text-center" variants={fadeInUp}>
                <div className="jj-icon-box-active w-12 h-12 mx-auto mb-3">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-[#1A1A1A] text-sm font-bold mb-2">{value.title}</h3>
                <p className="text-[#1A1A1A]/70 text-xs">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </SectionShell>

      {/* 5. Services (8-card grid) */}
      <SectionShell>
        <div id="services" className="text-center mb-12">
          <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">What We Do</span>
          <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold">
            Services
          </h2>
        </div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {PROFILE_CONTENT.services.map((service) => {
            const Icon = service.icon;
            return (
              <motion.div key={service.title} className="jj-card-inner" variants={fadeInUp}>
                <div className="jj-icon-box-active w-12 h-12 mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-[#1A1A1A] text-lg font-bold mb-2">{service.title}</h3>
                <p className="text-[#1A1A1A]/70 text-sm mb-3">{service.description}</p>
                <div className="space-y-1 text-xs text-[#1A1A1A]/70">
                  <p><span className="font-semibold text-[#1A1A1A]">Ideal for:</span> {service.idealFor}</p>
                  <p><span className="font-semibold text-[#1A1A1A]">Deliverables:</span> {service.deliverables}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </SectionShell>

      {/* AI Tools & Creativity */}
      <SectionShell>
        <div id="ai-tools" className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Technology</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-4">
              AI Tools & Creativity
            </h2>
            <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto">
              JBJ Global Real Estate integrates advanced AI tools and creative capabilities into its platform — enhancing the quality, speed, and impact of property marketing, client communication, and content production.
            </p>
          </div>
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {PROFILE_CONTENT.aiTools.map((tool) => (
              <motion.div key={tool.title} className="jj-card-inner" variants={fadeInUp}>
                <div className="jj-icon-box-active w-10 h-10 mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-[#1A1A1A] font-bold text-sm mb-2">{tool.title}</h3>
                <p className="text-[#1A1A1A]/70 text-xs leading-relaxed">{tool.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </SectionShell>

      {/* Real Estate Marketplace */}
      <SectionShell>
        <div id="marketplace" className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Platform</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-4">
              Real Estate Marketplace
            </h2>
            <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto">{PROFILE_CONTENT.marketplace.intro}</p>
          </div>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {PROFILE_CONTENT.marketplace.features.map((f) => (
              <motion.div key={f.title} className="jj-card-inner flex items-start gap-3" variants={fadeInUp}>
                <div className="jj-icon-box-active w-10 h-10 flex-shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[#1A1A1A] font-bold text-sm mb-1">{f.title}</h3>
                  <p className="text-[#1A1A1A]/70 text-xs">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </SectionShell>

      {/* Dubai as a Destination */}
      <SectionShell>
        <div id="dubai-destination" className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Location</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-4">
              Dubai — A Global Real Estate Destination
            </h2>
            <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto">{PROFILE_CONTENT.dubaiDestination.intro}</p>
          </div>
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {PROFILE_CONTENT.dubaiDestination.highlights.map((h) => (
              <motion.div key={h.title} className="jj-card-inner" variants={fadeInUp}>
                <div className="jj-icon-box-active w-10 h-10 mb-3">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-[#1A1A1A] font-bold text-sm mb-2">{h.title}</h3>
                <p className="text-[#1A1A1A]/70 text-xs leading-relaxed">{h.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </SectionShell>

      {/* Prime Areas of Focus — Photo Cards */}
      <SectionShell>
        <div id="areas" className="text-center mb-12">
          <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Where We Operate</span>
          <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-4">
            Prime Areas of Focus
          </h2>
          <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto">
            JBJ Global Real Estate focuses on Dubai's highest-demand residential communities — selected for their location quality, lifestyle appeal, and long-term investment value.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-6xl mx-auto">
          {(areasData || [])
            .filter(a => PROFILE_CONTENT.areas.some(name => a.name.toLowerCase().includes(name.toLowerCase().split(' ')[0])))
            .slice(0, 12)
            .map((area, index) => (
              <motion.div
                key={area.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                whileHover={{ y: -6 }}
              >
                <Link
                  to={`/area/${area.slug}`}
                  className="group relative block h-[180px] md:h-[200px] rounded-xl overflow-hidden border-[3px] border-transparent hover:border-[#B89555] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.45)]"
                >
                  {area.image_url ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url(${area.image_url})` }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FDFBF7] via-[#ECE2D2] to-[#D8C7A6] flex items-center justify-center">
                      <span className="text-6xl font-black text-[#1A1A1A] select-none" style={{ opacity: 0.1 }}>JBJ</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    {area.is_trending && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#EFE6D6] to-[#ECE2D2] text-[#1A1A1A] text-[9px] font-bold uppercase tracking-wider shadow-lg">
                        <TrendingUp className="w-2.5 h-2.5" />
                        Trending
                      </span>
                    )}
                    {area.is_high_demand && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-lg">
                        <Flame className="w-2.5 h-2.5" />
                        High Demand
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {area.property_count != null && area.property_count > 0 && (
                      <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full bg-[#1A1A1A]/60 text-[#B89555] text-[9px] font-semibold tracking-wide border border-[#B89555]/30">
                        {area.property_count} Projects
                      </span>
                    )}
                    <h3 className="text-white font-bold text-sm md:text-base leading-tight drop-shadow-lg group-hover:text-[#B89555] transition-colors duration-300">
                      {area.name}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}
        </div>

        {/* Area descriptions from PDF (below the photo cards) */}
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-6xl mx-auto mt-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {PROFILE_CONTENT.primeAreas.map((area) => (
            <motion.div key={area.name} className="jj-card-inner text-center" variants={fadeInUp}>
              <h3 className="text-[#1A1A1A] font-bold text-sm mb-1">{area.name}</h3>
              <p className="text-[#1A1A1A]/60 text-xs leading-relaxed">{area.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-8">
          <Link
            to="/areas"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border-2 border-[#B89555] rounded-xl text-[#1A1A1A] font-semibold text-sm hover:shadow-[0_4px_20px_rgba(200,167,102,0.4)] hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <span>View All Areas</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </SectionShell>

      {/* Platform Benefits */}
      <SectionShell>
        <div id="platform-benefits" className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Value</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold">
              Platform Benefits
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="jj-card-inner">
              <h3 className="text-[#1A1A1A] font-bold text-lg mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#1A1A1A]" /> For Investors
              </h3>
              <ul className="space-y-3">
                {PROFILE_CONTENT.platformBenefits.investors.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A]/70">
                    <CheckCircle className="w-4 h-4 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="jj-card-inner">
              <h3 className="text-[#1A1A1A] font-bold text-lg mb-4 flex items-center gap-2">
                <Handshake className="w-5 h-5 text-[#1A1A1A]" /> For Brokers
              </h3>
              <ul className="space-y-3">
                {PROFILE_CONTENT.platformBenefits.brokers.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A]/70">
                    <CheckCircle className="w-4 h-4 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </SectionShell>

      {/* Portfolio Highlights */}
      <SectionShell>
        <div id="portfolio" className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Portfolio</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-4">
              Portfolio Highlights
            </h2>
            <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto">
              A selection of the property categories and communities represented within the JBJ Global Real Estate portfolio.
            </p>
          </div>
        </div>
      </SectionShell>

      {/* Investor Journey */}
      <SectionShell>
        <div id="investor-journey" className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Process</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-4">
              The Investor Journey
            </h2>
            <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto">
              A structured, advisory-led process designed to guide investors from initial interest through to successful property acquisition.
            </p>
          </div>
          <motion.div className="relative" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <div className="absolute left-6 top-0 bottom-0 w-px bg-[#EFE6D6]/30 hidden md:block" />
            {PROFILE_CONTENT.investorJourney.map((step) => (
              <motion.div key={step.step} className="flex items-start gap-6 mb-6 last:mb-0" variants={fadeInUp}>
                <div className="jj-icon-box-active w-12 h-12 rounded-full border border-[#B89555]/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1A1A1A] font-bold text-sm">{step.step}</span>
                </div>
                <div className="jj-card-inner flex-1">
                  <h3 className="text-[#1A1A1A] text-lg font-bold mb-1">{step.title}</h3>
                  <p className="text-[#1A1A1A]/70 text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </SectionShell>

      {/* Partner Network */}
      <SectionShell>
        <div id="partner-network" className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Network</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-4">
              Partner Network
            </h2>
            <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto">{PROFILE_CONTENT.partnerNetwork.intro}</p>
          </div>
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {PROFILE_CONTENT.partnerNetwork.partners.map((p) => (
              <motion.div key={p.title} className="jj-card-inner" variants={fadeInUp}>
                <div className="jj-icon-box-active w-10 h-10 mb-3">
                  <Handshake className="w-5 h-5" />
                </div>
                <h3 className="text-[#1A1A1A] font-bold text-sm mb-2">{p.title}</h3>
                <p className="text-[#1A1A1A]/70 text-xs leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </SectionShell>

      {/* 6. Process (timeline) */}
      <SectionShell>
        <div id="process" className="text-center mb-12">
          <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">How We Work</span>
          <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold">
            Our Process
          </h2>
        </div>
        <div className="max-w-5xl mx-auto">
          <motion.div className="relative" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <div className="absolute left-6 top-0 bottom-0 w-px bg-[#EFE6D6]/30 hidden md:block" />
            {PROFILE_CONTENT.process.map((step) => (
              <motion.div key={step.step} className="flex items-start gap-6 mb-6 last:mb-0" variants={fadeInUp}>
                <div className="jj-icon-box-active w-12 h-12 rounded-full border border-[#B89555]/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1A1A1A] font-bold">{step.step}</span>
                </div>
                <div className="jj-card-inner flex-1">
                  <h3 className="text-[#1A1A1A] text-lg font-bold mb-1">{step.title}</h3>
                  <p className="text-[#1A1A1A]/70">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </SectionShell>

      {/* 7. Differentiators */}
      <SectionShell>
        <div id="differentiators" className="text-center mb-12">
          <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Our Edge</span>
          <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold">
            Why JBJ
          </h2>
        </div>
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {PROFILE_CONTENT.differentiators.map((item) => (
            <motion.div key={item} className="jj-card-inner flex items-center gap-3" variants={fadeInUp}>
              <div className="jj-icon-box-active w-10 h-10">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-[#1A1A1A]/80 text-sm">{item}</span>
            </motion.div>
          ))}
        </motion.div>
      </SectionShell>

      {/* 9. Client Experience Standards */}
      <SectionShell>
        <div id="client-experience" className="text-center mb-12">
          <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Our Commitment</span>
          <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold">
            Client Experience Standards
          </h2>
        </div>
        <motion.div
          className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {PROFILE_CONTENT.clientExperience.map((item) => (
            <motion.div key={item} className="jj-card-inner flex items-center gap-3" variants={fadeInUp}>
              <div className="jj-icon-box-active w-10 h-10">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-[#1A1A1A]/80">{item}</span>
            </motion.div>
          ))}
        </motion.div>
      </SectionShell>

      {/* 10. Trust & Compliance */}
      <SectionShell>
        <div id="trust" className="max-w-6xl mx-auto">
          <div className="jj-card-inner">
            <div className="flex items-start gap-4">
              <div className="jj-icon-box-active w-12 h-12">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[#1A1A1A] font-bold text-lg mb-3">Trust & Compliance</h3>
                <p className="text-[#1A1A1A]/70 text-sm leading-relaxed">{PROFILE_CONTENT.trustCompliance}</p>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* 11. Founder Profile */}
      <FounderContent>
        <SectionShell>
          <div id="founder" className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Leadership</span>
               <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold">
                Founder & CEO
              </h2>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="jj-card-inner"
            >
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="w-32 h-40 md:w-40 md:h-52 rounded-xl overflow-hidden border-2 border-[#B89555]/30 shadow-xl flex-shrink-0">
                  <img 
                    src={founderCompanyProfile} 
                    alt={PROFILE_CONTENT.founderProfile.name}
                    className="w-full h-full object-cover object-top"
                   loading="lazy" decoding="async" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#1A1A1A] text-2xl font-bold mb-1">{PROFILE_CONTENT.founderProfile.name}</h3>
                  <p className="text-[#1A1A1A] mb-4">{PROFILE_CONTENT.founderProfile.title}</p>
                  <p className="text-[#1A1A1A]/70 leading-relaxed mb-6">{PROFILE_CONTENT.founderProfile.bio}</p>

                  <div className="mb-6">
                    <h4 className="text-[#1A1A1A] font-bold text-sm mb-3">Founder Principles</h4>
                    <ul className="space-y-2">
                      {PROFILE_CONTENT.founderProfile.principles.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#1A1A1A]/70">
                          <span className="text-[#1A1A1A] font-bold">{i + 1}.</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <blockquote className="border-l-4 border-[#B89555] pl-6 py-2">
                    <p className="text-[#1A1A1A] text-xl italic mb-2">"{PROFILE_CONTENT.founderProfile.quote}"</p>
                    <cite className="text-[#1A1A1A]/60 text-sm">— {PROFILE_CONTENT.founderProfile.name}</cite>
                  </blockquote>
                </div>
              </div>
            </motion.div>
          </div>
        </SectionShell>
      </FounderContent>

      {/* 12. Company Snapshot */}
      <SectionShell>
        <div id="snapshot" className="text-center mb-12">
          <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">At a Glance</span>
          <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold">
            Company Snapshot
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto jj-card-inner"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: Building2, label: "Headquarters", value: PROFILE_CONTENT.companySnapshot.headquarters },
              { icon: MapPin, label: "Service Areas", value: PROFILE_CONTENT.companySnapshot.serviceAreas },
              { icon: Globe, label: "Languages", value: PROFILE_CONTENT.companySnapshot.languages },
              { icon: Phone, label: "Contact", value: PROFILE_CONTENT.companySnapshot.contact },
              { icon: Mail, label: "Email", value: PROFILE_CONTENT.companySnapshot.email },
              { icon: Globe, label: "Website", value: PROFILE_CONTENT.companySnapshot.website },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="jj-icon-box-active w-10 h-10">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[#1A1A1A]/70 text-xs uppercase">{item.label}</p>
                  <p className="text-[#1A1A1A]">{item.value}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 md:col-span-2">
              <div className="jj-icon-box-active w-10 h-10">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[#1A1A1A]/70 text-xs uppercase">Working Hours</p>
                <p className="text-[#1A1A1A]">{PROFILE_CONTENT.companySnapshot.workingHours}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </SectionShell>

      {/* 13. Calls to Action */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Get Started</span>
          <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold">
            Ready to Connect?
          </h2>
        </div>

        <motion.div
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {PROFILE_CONTENT.ctas.map((cta) => (
            <motion.div
              key={cta.title}
              variants={fadeInUp}
              className="jj-card-inner group cursor-pointer flex flex-col h-full"
              onClick={handleWhatsApp}
            >
              <h3 className="text-[#1A1A1A] text-lg font-bold mb-2 group-hover:text-[#1A1A1A] transition-colors">{cta.title}</h3>
              <p className="text-[#1A1A1A]/70 text-sm mb-4 flex-1">{cta.description}</p>
              <div className="flex items-center text-[#1A1A1A] text-sm font-semibold mt-auto">
                <span>Get Started</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </SectionShell>

      {/* Company Fact Sheet - moved from former Press Kit */}
      <SectionShell>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[#1A1A1A]/70 text-xs uppercase tracking-[0.3em] mb-3 block">Quick Reference</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold">
              Company <span className="text-[#B89555]">Fact Sheet</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Company Information */}
            <div className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-2xl p-7 shadow-[0_2px_12px_rgba(184,149,85,0.08)]">
              <h4 className="text-[#1A1A1A] text-sm font-semibold uppercase tracking-wider mb-5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#1A1A1A]" />
                Company Information
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-[#B89555]/20 pb-2.5">
                  <span className="text-[#1A1A1A]/70">Company Name</span>
                  <span className="text-[#1A1A1A] font-medium">JBJ GLOBAL REAL ESTATE</span>
                </div>
                <div className="flex justify-between border-b border-[#B89555]/20 pb-2.5">
                  <span className="text-[#1A1A1A]/70">Founded</span>
                  <span className="text-[#1A1A1A] font-medium">2025</span>
                </div>
                <div className="flex justify-between border-b border-[#B89555]/20 pb-2.5">
                  <span className="text-[#1A1A1A]/70">Headquarters</span>
                  <span className="text-[#1A1A1A] font-medium">Downtown Dubai, UAE</span>
                </div>
                <div className="flex justify-between border-b border-[#B89555]/20 pb-2.5">
                  <span className="text-[#1A1A1A]/70">Industry</span>
                  <span className="text-[#1A1A1A] font-medium">Real Estate Brokerage</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1A1A1A]/70">Website</span>
                  <a href="https://jbj.ae" target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] font-medium hover:underline flex items-center gap-1">
                    jbj.ae
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-2xl p-7 shadow-[0_2px_12px_rgba(184,149,85,0.08)]">
              <h4 className="text-[#1A1A1A] text-sm font-semibold uppercase tracking-wider mb-5 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#1A1A1A]" />
                Key Metrics
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-[#B89555]/20 pb-2.5">
                  <span className="text-[#1A1A1A]/70">Industry Experience</span>
                  <span className="text-[#1A1A1A] font-semibold">12+ Years</span>
                </div>
                <div className="flex justify-between border-b border-[#B89555]/20 pb-2.5">
                  <span className="text-[#1A1A1A]/70">Brokers Trained</span>
                  <span className="text-[#1A1A1A] font-semibold">{`${COMPANY_STATS.brokersTrainedBy.end.toLocaleString()}${COMPANY_STATS.brokersTrainedBy.suffix}`}</span>
                </div>
                <div className="flex justify-between border-b border-[#B89555]/20 pb-2.5">
                  <span className="text-[#1A1A1A]/70">Team Members</span>
                  <span className="text-[#1A1A1A] font-semibold">10+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1A1A1A]/70">Client Satisfaction</span>
                  <span className="text-[#1A1A1A] font-semibold">98%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* 14. PDF Download Module with 3D Book Preview */}
      <SectionShell>
        <motion.div
          id="download"
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-8">
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Download</span>
            <h2 className="text-[#1A1A1A] text-3xl md:text-4xl font-bold mb-4">
              Get the Full Company Profile
            </h2>
            <p className="text-[#1A1A1A]/70">
              18-page Company Profile • Professional Format
            </p>
          </div>

          <div className="jj-card-inner py-12">
            <ConsistentBook3D onClick={generatePDF} isGenerating={isGenerating} />

            <div className="mt-8 flex flex-col items-center gap-4">
              <p className="text-[#1A1A1A]/80 text-sm">
                JBJ_Global_Real_Estate_Company_Profile.pdf
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={generatePDF} disabled={isGenerating} variant="primary" size="lg">
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#1A1A1A]/30 border-t-black rounded-full animate-spin" />
                      Downloading...
                    </div>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button onClick={handleWhatsApp} variant="outline" size="lg" className="border-[#B89555] text-[#1A1A1A] hover:bg-[#EFE6D6] hover:text-[#1A1A1A]">
                  <BookOpen className="w-5 h-5" />
                  Request Print Copy
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </SectionShell>

      {/* Mobile Sticky Actions */}
      <div data-chrome="floating-actions" className="lg:hidden fixed bottom-4 left-4 right-4 z-50 flex gap-2">
        <Button onClick={handleWhatsApp} variant="primary" className="flex-1 rounded-full">
          <MessageCircle className="w-5 h-5" />
          WhatsApp
        </Button>
        <Button onClick={handleCall} variant="primary" className="flex-1 rounded-full">
          <Phone className="w-5 h-5" />
          Call
        </Button>
        <Button
          onClick={generatePDF}
          disabled={isGenerating}
          variant="primary"
          size="icon"
          className="rounded-full"
          aria-label="Download Company Profile (PDF)"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-[#1A1A1A]/30 border-t-black rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default CompanyProfile;
