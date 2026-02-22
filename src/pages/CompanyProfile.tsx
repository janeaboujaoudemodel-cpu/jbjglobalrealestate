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
  Flame
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { toast } from "sonner";
import { FounderContent } from "@/components/FounderContent";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { useAreas } from "@/hooks/useAreas";
import { companyProfileBook } from "@/data/bookCollections";

import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";
import founderCompanyProfile from "@/assets/founder-company-profile.jpg";

function SectionShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`py-8 md:py-10 bg-black ${className ?? ""}`.trim()}>
      <div className="jj-layer-2">
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

// Exact content from Section 2 - DO NOT MODIFY
const PROFILE_CONTENT = {
  coverPage: {
    title: "JBJ Global Real Estate",
    subtitle: "Founder & CEO, Jane Bou Jaoude",
    subtitleFallback: "Company Profile"
  },
  executiveSummary: `JBJ Global Real Estate is a Dubai-based real estate brokerage built on precision, transparency, and long-term client relationships. Operating across Dubai's most active residential and investment markets, the firm provides structured advisory for buying, selling, leasing, and investing in property.

Our approach is defined by clarity rather than volume. Every engagement begins with understanding the client's objective, risk profile, and timeline, followed by data-driven market evaluation and disciplined execution. We work with homeowners, landlords, investors, and institutional buyers who value informed decision-making and professional representation.

JBJ Global Real Estate combines on-ground market expertise with modern intelligence tools, ensuring each recommendation is grounded in verifiable information, not assumptions. From first consultation to completion and beyond, clients receive direct access, responsive communication, and accountability at every stage.`,

  brandStory: `JBJ Global Real Estate was founded with a clear mandate: to elevate the standard of real estate advisory in Dubai by replacing transactional brokerage with structured, client-centric representation.

The Dubai property market is dynamic, fast-moving, and opportunity-rich — but it also demands discipline, accurate information, and local expertise. JBJ was established to guide clients through this complexity with confidence and clarity. The firm's foundation is built on experience across residential sales, leasing, investment structuring, and developer-led projects.

Founder-led and strategically focused, JBJ Global Real Estate operates with the understanding that real estate decisions have long-term financial and lifestyle impact. Our role is not to sell inventory, but to interpret the market, present clear options, and support informed decisions aligned with each client's goals.

Today, JBJ Global Real Estate serves local and international clients seeking reliable representation, transparent processes, and premium service delivery in Dubai's evolving property landscape.`,

  vision: "To be a trusted reference for real estate advisory in Dubai through clarity, discipline, and client confidence.",
  mission: "To provide structured, transparent real estate guidance that protects client interests and supports informed decision-making.",
  
  values: [
    { title: "Clarity", description: "Information presented accurately, without exaggeration." },
    { title: "Integrity", description: "Advice aligned with client objectives, not incentives." },
    { title: "Discipline", description: "Consistent processes and risk-aware execution." },
    { title: "Responsiveness", description: "Direct access and timely communication." },
    { title: "Loyalty", description: "Long-term commitment to client success and trust." },
    { title: "Accountability", description: "Responsibility throughout the transaction lifecycle." }
  ],

  services: [
    {
      title: "Residential Sales Advisory",
      description: "Advisory support for primary and secondary market purchases.",
      idealFor: "Homeowners and investors.",
      deliverables: "Market evaluation, property shortlisting, transaction coordination.",
      icon: Home
    },
    {
      title: "Premium Leasing (Rentals)",
      description: "Structured leasing for residential properties.",
      idealFor: "Tenants and landlords.",
      deliverables: "Rental valuation, tenant sourcing, contract coordination.",
      icon: Key
    },
    {
      title: "Seller Representation & Pricing Strategy",
      description: "Professional representation for property owners.",
      idealFor: "Homeowners and investors selling assets.",
      deliverables: "Pricing strategy, marketing coordination, negotiation support.",
      icon: TrendingUp
    },
    {
      title: "Landlord Services / Property Management",
      description: "Operational support for rental assets.",
      idealFor: "Portfolio landlords.",
      deliverables: "Leasing oversight, tenant coordination, renewal management.",
      icon: Building2
    },
    {
      title: "Investment Advisory",
      description: "Data-driven advisory for property investment decisions.",
      idealFor: "Yield-focused investors.",
      deliverables: "Market analysis, risk assessment, scenario comparison.",
      icon: Briefcase
    },
    {
      title: "New Developments / Off-Plan Advisory",
      description: "Guidance on developer-led projects.",
      idealFor: "Investors and early buyers.",
      deliverables: "Project evaluation, payment plan analysis, booking coordination.",
      icon: HardHat
    }
  ],

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

  areas: [
    "Downtown Dubai",
    "Business Bay",
    "Dubai Marina",
    "Palm Jumeirah",
    "JBR",
    "City Walk",
    "DIFC",
    "Meydan",
    "Dubai Hills Estate",
    "Jumeirah Islands",
    "Jumeirah Village Circle",
    "Arabian Ranches"
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
    bio: `Jane Bou Jaoude is the Founder & CEO of JBJ Global Real Estate. Her leadership philosophy centers on clarity, accountability, and long-term client trust. With hands-on involvement in advisory strategy and client engagement, she ensures that every transaction reflects disciplined market understanding rather than speculation.

Clients working with JBJ can expect direct oversight, transparent communication, and advice grounded in practical market realities. Jane's approach prioritizes alignment with client objectives, risk awareness, and execution quality.`,
    quote: "Real estate decisions deserve clarity, not pressure."
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
      {/* Book shadow */}
      <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/20 blur-xl rounded-full" />

      {/* 3D Book */}
      <div
        className="relative w-52 sm:w-60 md:w-64 mx-auto transition-transform duration-500 group-hover:[transform:rotateY(-8deg)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front cover */}
        <div className="relative rounded-r-lg overflow-hidden shadow-[8px_8px_30px_rgba(0,0,0,0.35)]">
          {/* Spine edge */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/40 via-black/20 to-transparent z-10" />
          {/* Top light reflection */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/15 to-transparent z-10" />

          <img
            src={companyProfileBook.cover}
            alt={companyProfileBook.title}
            className="w-full aspect-[2/3] object-cover"
          />

          {/* Subtle overlay sheen */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 z-10" />
        </div>

        {/* Book spine (3D depth) */}
        <div
          className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-zinc-800 to-zinc-700 origin-left"
          style={{ transform: 'rotateY(-90deg) translateX(-8px)' }}
        />
        {/* Book pages (3D bottom edge) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-b from-[#f5f0e0] to-[#e8dcc8]"
          style={{ transform: 'rotateX(90deg) translateY(6px)', transformOrigin: 'bottom' }}
        />
      </div>

      {/* Download overlay on hover */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg z-20">
        <div className="text-center">
          {isGenerating ? (
            <div className="w-12 h-12 border-4 border-[#C8A766]/30 border-t-[#C8A766] rounded-full animate-spin mx-auto" />
          ) : (
            <>
              <Download className="w-12 h-12 text-[#C8A766] mx-auto mb-2" />
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
      await generateCompanyProfilePDF(isFounderVisible);
      toast.success("Company Profile downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
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
    <div className="min-h-screen bg-black">
      {/* Sticky Actions (Desktop) */}
      <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-3">
        <Button
          onClick={handleWhatsApp}
          variant="primary"
          size="icon"
          className="rounded-full"
          aria-label="WhatsApp"
        >
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
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* 1. Hero Section */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={luxuryVillaHero} alt="JBJ Global Real Estate" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
        </div>

        <motion.div
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.span
            className="inline-block text-gold text-xs uppercase tracking-[0.4em] mb-6"
            variants={fadeInUp}
          >
            Company Profile
          </motion.span>
          <motion.h1
            className="text-white text-4xl md:text-6xl lg:text-7xl font-bold mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              {PROFILE_CONTENT.coverPage.title}
            </span>
          </motion.h1>
          <motion.p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8" variants={fadeInUp}>
            <FounderContent fallback={PROFILE_CONTENT.coverPage.subtitleFallback}>
              {PROFILE_CONTENT.coverPage.subtitle}
            </FounderContent>
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <Button onClick={generatePDF} disabled={isGenerating} variant="primary" size="lg">
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Generating...
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
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Contents</span>
            <h2 className="text-black text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Table of Contents
            </h2>
          </div>
          <div className="jj-card-inner">
            <div className="space-y-1">
              {[
                { title: 'Executive Summary', anchor: 'executive-summary' },
                { title: 'Brand Story', anchor: 'brand-story' },
                { title: 'Vision, Mission & Values', anchor: 'vision-mission' },
                { title: 'Core Services', anchor: 'services' },
                { title: 'Our Process', anchor: 'process' },
                { title: 'What Sets Us Apart', anchor: 'differentiators' },
                { title: 'Areas of Operation', anchor: 'areas' },
                { title: 'Client Experience', anchor: 'client-experience' },
                { title: 'Trust & Compliance', anchor: 'trust' },
                { title: 'Founder & Leadership', anchor: 'founder' },
                { title: 'Company Snapshot', anchor: 'snapshot' },
                { title: 'Download Company Profile', anchor: 'download' },
              ].map((item, index) => (
                <a
                  key={index}
                  href={`#${item.anchor}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#C8A766]/10 transition-colors group"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#C8A766]/10 border border-[#C8A766]/20 flex items-center justify-center text-[#C8A766] text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-black/80 text-sm flex-1 group-hover:text-[#C8A766] transition-colors">{item.title}</span>
                  <ChevronRight className="w-4 h-4 text-black/30 group-hover:text-[#C8A766] transition-colors flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </SectionShell>

      {/* Gold Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />

      {/* 2. Executive Summary */}
      <SectionShell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Overview</span>
            <h2 className="text-black text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              Executive Summary
            </h2>
          </div>

          <div className="jj-card-inner">
            <div className="space-y-6 text-black/70 leading-relaxed">
              {PROFILE_CONTENT.executiveSummary.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
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
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Watch</span>
              <h2 className="text-black text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                Company Introduction
              </h2>
              <p className="text-black/60 max-w-xl mx-auto">
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Story</span>
            <h2 className="text-black text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              Brand Story
            </h2>
          </div>

          <div className="jj-card-inner">
            <div className="space-y-6 text-black/70 leading-relaxed">
              {PROFILE_CONTENT.brandStory.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </motion.div>
      </SectionShell>

      {/* 4. Vision / Mission / Values */}
      <SectionShell>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="jj-card-inner"
            >
              <div className="flex items-start gap-4">
                <div className="jj-icon-box-active w-12 h-12">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-black text-xl font-bold mb-2">Vision</h3>
                  <p className="text-black/70 leading-relaxed">{PROFILE_CONTENT.vision}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="jj-card-inner"
            >
              <div className="flex items-start gap-4">
                <div className="jj-icon-box-active w-12 h-12">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-black text-xl font-bold mb-2">Mission</h3>
                  <p className="text-black/70 leading-relaxed">{PROFILE_CONTENT.mission}</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="text-center mb-12">
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Foundation</span>
            <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
              Values
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
                <h3 className="text-black text-sm font-bold mb-2">{value.title}</h3>
                <p className="text-black/70 text-xs">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </SectionShell>

      {/* 5. Services (6-card grid) */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">What We Do</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Services
          </h2>
        </div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
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
                <h3 className="text-black text-lg font-bold mb-2">{service.title}</h3>
                <p className="text-black/70 text-sm mb-3">{service.description}</p>
                <div className="space-y-1 text-xs text-black/70">
                  <p>
                    <span className="font-semibold text-black">Ideal for:</span> {service.idealFor}
                  </p>
                  <p>
                    <span className="font-semibold text-black">Deliverables:</span> {service.deliverables}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </SectionShell>

      {/* 6. Process (timeline) */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">How We Work</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Our Process
          </h2>
        </div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            className="relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gold/30 hidden md:block" />

            {PROFILE_CONTENT.process.map((step) => (
              <motion.div key={step.step} className="flex items-start gap-6 mb-6 last:mb-0" variants={fadeInUp}>
                <div className="jj-icon-box-active w-12 h-12 rounded-full border border-gold/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-bold">{step.step}</span>
                </div>
                <div className="jj-card-inner flex-1">
                  <h3 className="text-black text-lg font-bold mb-1">{step.title}</h3>
                  <p className="text-black/70">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </SectionShell>

      {/* 7. Differentiators */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Edge</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
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
              <span className="text-black/80 text-sm">{item}</span>
            </motion.div>
          ))}
        </motion.div>
      </SectionShell>

      {/* 8. Areas of Focus — Photo Cards */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Where We Operate</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Areas of Focus
          </h2>
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
                  className="group relative block h-[180px] md:h-[200px] rounded-xl overflow-hidden border-[3px] border-transparent hover:border-[#C8A766] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.45)]"
                >
                  {area.image_url ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url(${area.image_url})` }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FDFBF7] via-[#E8DCC8] to-[#D4C4A8] flex items-center justify-center">
                      <span className="text-6xl font-black text-black select-none" style={{ opacity: 0.1, fontFamily: "Poppins, sans-serif" }}>JBJ</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    {area.is_trending && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#C8A766] to-[#E8DCC8] text-black text-[9px] font-bold uppercase tracking-wider shadow-lg">
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

                  {/* Bottom content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {area.property_count != null && area.property_count > 0 && (
                      <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full bg-black/60 text-[#C8A766] text-[9px] font-semibold tracking-wide border border-[#C8A766]/30">
                        {area.property_count} Projects
                      </span>
                    )}
                    <h3 className="text-white font-bold text-sm md:text-base leading-tight drop-shadow-lg group-hover:text-[#C8A766] transition-colors duration-300">
                      {area.name}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}
        </div>

        {/* View All Areas CTA */}
        <div className="text-center mt-8">
          <Link
            to="/areas"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-[#C8A766] rounded-xl text-black font-semibold text-sm hover:shadow-[0_4px_20px_rgba(200,167,102,0.4)] hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <span>View All Areas</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </SectionShell>

      {/* 9. Client Experience Standards */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Commitment</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
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
              <span className="text-black/80">{item}</span>
            </motion.div>
          ))}
        </motion.div>
      </SectionShell>

      {/* 10. Trust & Compliance */}
      <SectionShell>
        <div className="max-w-6xl mx-auto">
          <div className="jj-card-inner">
            <div className="flex items-start gap-4">
              <div className="jj-icon-box-active w-12 h-12">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-black font-bold text-lg mb-3">Trust & Compliance</h3>
                <p className="text-black/70 text-sm leading-relaxed">{PROFILE_CONTENT.trustCompliance}</p>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* 11. Founder Profile - WRAPPED IN FOUNDER CONTENT */}
      <FounderContent>
        <SectionShell>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Leadership</span>
              <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Founder Profile
              </h2>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="jj-card-inner"
            >
              <div className="flex flex-col md:flex-row items-start gap-8">
                {/* Founder Photo */}
                <div className="w-32 h-40 md:w-40 md:h-52 rounded-xl overflow-hidden border-2 border-gold/30 shadow-xl flex-shrink-0">
                  <img 
                    src={founderCompanyProfile} 
                    alt={PROFILE_CONTENT.founderProfile.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-black text-2xl font-bold mb-1">{PROFILE_CONTENT.founderProfile.name}</h3>
                  <p className="text-gold mb-6">{PROFILE_CONTENT.founderProfile.title}</p>
                  <div className="space-y-4 text-black/70 leading-relaxed mb-8">
                    {PROFILE_CONTENT.founderProfile.bio.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                  <blockquote className="border-l-4 border-gold pl-6 py-2">
                    <p className="text-black text-xl italic mb-2">"{PROFILE_CONTENT.founderProfile.quote}"</p>
                    <cite className="text-black/60 text-sm">— {PROFILE_CONTENT.founderProfile.name}</cite>
                  </blockquote>
                </div>
              </div>
            </motion.div>
          </div>
        </SectionShell>
      </FounderContent>

      {/* 12. Company Snapshot */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">At a Glance</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
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
            <div className="flex items-center gap-4">
              <div className="jj-icon-box-active w-10 h-10">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Headquarters</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.headquarters}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="jj-icon-box-active w-10 h-10">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Service Areas</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.serviceAreas}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="jj-icon-box-active w-10 h-10">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Languages</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.languages}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="jj-icon-box-active w-10 h-10">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Contact</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.contact}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="jj-icon-box-active w-10 h-10">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Email</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="jj-icon-box-active w-10 h-10">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Website</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.website}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 md:col-span-2">
              <div className="jj-icon-box-active w-10 h-10">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Working Hours</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.workingHours}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </SectionShell>

      {/* 13. Calls to Action */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Get Started</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
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
              <h3 className="text-black text-lg font-bold mb-2 group-hover:text-gold transition-colors">{cta.title}</h3>
              <p className="text-black/70 text-sm mb-4 flex-1">{cta.description}</p>
              <div className="flex items-center text-gold text-sm font-semibold mt-auto">
                <span>Get Started</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </SectionShell>

      {/* 14. PDF Download Module with 3D Book Preview */}
      <SectionShell>
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-8">
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Download</span>
            <h2 className="text-black text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Get the Full Company Profile
            </h2>
            <p className="text-black/70">
              {isFounderVisible ? "13" : "12"}-page A4 Landscape • Professional Format
            </p>
          </div>

          <div className="jj-card-inner py-12">
            {/* 3D Book Preview */}
            <ConsistentBook3D onClick={generatePDF} isGenerating={isGenerating} />

            <div className="mt-8 flex flex-col items-center gap-4">
              <p className="text-black/60 text-sm">
                JBJ_Global_Real_Estate_Company_Profile.pdf
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={generatePDF} disabled={isGenerating} variant="primary" size="lg">
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button onClick={handleWhatsApp} variant="outline" size="lg" className="border-gold text-gold hover:bg-gold hover:text-black">
                  <BookOpen className="w-5 h-5" />
                  Request Print Copy
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </SectionShell>


      {/* Mobile Sticky Actions */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 flex gap-2">
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
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default CompanyProfile;
