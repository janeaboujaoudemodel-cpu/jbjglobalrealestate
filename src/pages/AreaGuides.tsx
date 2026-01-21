import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MapPin, 
  ArrowUpRight, 
  Compass, 
  Building2, 
  Users, 
  Home, 
  TrendingUp, 
  Search, 
  X, 
  Flame, 
  SortAsc, 
  Clock, 
  Star,
  Target,
  Scale,
  Heart,
  Shield,
  FileText,
  DollarSign,
  Map,
  CheckCircle2,
  HelpCircle,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { AREA_GUIDES, UAE_EMIRATES as EMIRATES_DATA } from "@/constants/areaGuides";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import { GuideCTA } from "@/components/guides/GuideCTA";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

// UAE Emirates for filter
const UAE_EMIRATES = [
  { id: "all", name: "All Emirates" },
  { id: "dubai", name: "Dubai" },
  { id: "abu-dhabi", name: "Abu Dhabi" },
  { id: "sharjah", name: "Sharjah" },
  { id: "ajman", name: "Ajman" },
  { id: "ras-al-khaimah", name: "Ras Al Khaimah" },
  { id: "fujairah", name: "Fujairah" },
  { id: "umm-al-quwain", name: "Umm Al Quwain" },
];

// Trending communities (based on market activity from DLD reports)
const TRENDING_COMMUNITIES = [
  "downtown-dubai",
  "dubai-marina", 
  "palm-jumeirah",
  "dubai-hills-estate",
  "dubai-creek-harbour",
  "business-bay",
  "jumeirah-village-circle",
  "mbr-city",
  "emaar-beachfront",
  "al-marjan-island"
];

// Sort options
type SortOption = "featured" | "newest" | "trending" | "alphabetical";

const AreaGuides = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmirate, setSelectedEmirate] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  // Section 1: How to Choose the Right Area
  const chooseAreaFactors = [
    "Purpose (living vs investment)",
    "Budget and financing structure",
    "Commute and accessibility",
    "Community maturity vs growth phase",
    "Rental demand and tenant profile"
  ];

  // Section 2: Established vs Emerging Areas
  const establishedAreaTraits = [
    "Stable prices",
    "Immediate rental demand",
    "Completed infrastructure",
    "Lower volatility"
  ];

  const emergingAreaTraits = [
    "Lower entry prices",
    "Higher growth potential",
    "Longer holding horizons",
    "Infrastructure still developing"
  ];

  // Section 3: Lifestyle-Driven Communities
  const lifestyleCharacteristics = [
    "Waterfront or skyline views",
    "Walkability and retail access",
    "Dining, leisure, and entertainment",
    "Premium building amenities"
  ];

  // Section 4: Family-Oriented Communities
  const familyFeatures = [
    "Villas or large apartments",
    "Schools and nurseries nearby",
    "Parks and community facilities",
    "Lower turnover, longer leases"
  ];

  // Section 5: Investment-Focused Areas
  const investmentTraits = [
    "High rental turnover",
    "Studio and one-bedroom dominance",
    "Competitive pricing",
    "Strong tenant demand"
  ];

  // Section 6: Infrastructure & Future Development
  const infrastructureConsiderations = [
    "Road and transport expansions",
    "Proximity to employment hubs",
    "Major infrastructure projects",
    "Community master plans"
  ];

  // Section 7: Freehold vs Non-Freehold
  const freeholdPoints = [
    "Freehold areas allow full ownership by foreign nationals",
    "Non-freehold areas restrict ownership rights",
    "Most investor-focused communities are freehold"
  ];

  // Section 8: Price Ranges & Market Behavior
  const priceInfluences = [
    "Building age and quality",
    "Developer reputation",
    "Unit size and layout",
    "View, floor level, and amenities"
  ];

  // Section 9: Rental Demand by Area
  const rentalDemandFactors = [
    "Tenant profile (single, family, corporate)",
    "Cheque flexibility",
    "Unit mix availability",
    "Proximity to work zones"
  ];

  // Section 10: Matching Areas to Objectives
  const objectiveExamples = [
    { goal: "End-user living", match: "Lifestyle & family communities" },
    { goal: "Long-term investment", match: "Emerging but planned areas" },
    { goal: "Short-term yield", match: "High-turnover zones" }
  ];

  // JBJ Support
  const jbjSupport = [
    "Objective area comparison",
    "Pricing and rental behavior analysis",
    "Matching areas to client goals",
    "Risk awareness and planning"
  ];

  // FAQs
  const faqs = [
    {
      question: "Is a popular area always a good investment?",
      answer: "No. Popularity does not always equal long-term performance."
    },
    {
      question: "Are emerging areas risky?",
      answer: "They carry higher uncertainty but also higher potential when selected correctly."
    },
    {
      question: "Can I live and invest in the same area?",
      answer: "Yes, depending on budget and lifestyle preferences."
    },
    {
      question: "Do all areas allow short-term rentals?",
      answer: "No. Regulations and building rules vary."
    },
    {
      question: "Should I choose an area based on price only?",
      answer: "No. Price must be assessed alongside demand and infrastructure."
    },
    {
      question: "How do I compare two areas objectively?",
      answer: "By analyzing price per square foot, rental yield, vacancy, and tenant demand."
    },
    {
      question: "Can JBJ advise which area suits my goal?",
      answer: "Yes. Area selection is a core part of our advisory process."
    }
  ];

  // TOC items
  const tocItems = [
    { id: "overview", title: "Overview", icon: Compass },
    { id: "choosing-area", title: "Choosing the Right Area", icon: Target },
    { id: "established-emerging", title: "Established vs Emerging", icon: Scale },
    { id: "lifestyle", title: "Lifestyle Communities", icon: Heart },
    { id: "family", title: "Family Communities", icon: Users },
    { id: "investment", title: "Investment Areas", icon: TrendingUp },
    { id: "infrastructure", title: "Infrastructure", icon: Building2 },
    { id: "freehold", title: "Freehold vs Non-Freehold", icon: Shield },
    { id: "pricing", title: "Price Ranges", icon: DollarSign },
    { id: "rental-demand", title: "Rental Demand", icon: Home },
    { id: "matching-objectives", title: "Match Your Objective", icon: Target },
    { id: "jbj-support", title: "How JBJ Helps", icon: CheckCircle2 },
    { id: "explore-areas", title: "Explore All Areas", icon: Map },
    { id: "faq", title: "FAQ", icon: HelpCircle }
  ];

  // Source: Dubai Land Department 2025-2026 Reports, DXBinteract.com
  const highlights = [
    { icon: Building2, value: "90+", label: "Communities", source: "JBJ Database 2026" },
    { icon: Users, value: "200+", label: "Nationalities", source: "Dubai Statistics Center 2026" },
    { icon: Home, value: "180K+", label: "Transactions (2025)", source: "DLD Annual Report 2025" },
    { icon: TrendingUp, value: "5-7%", label: "Avg. Gross Yield", source: "DXBinteract Q4 2025" },
  ];

  // Filter and sort guides
  const filteredGuides = useMemo(() => {
    let filtered = AREA_GUIDES.filter((area) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        (area.name ?? "").toLowerCase().includes(q) ||
        (area.shortDescription ?? "").toLowerCase().includes(q);
      
      // Check emirate filter using the EMIRATES_DATA
      if (selectedEmirate === "all") {
        return matchesSearch;
      }
      
      const emirate = EMIRATES_DATA.find(e => e.id === selectedEmirate);
      const matchesEmirate = emirate ? emirate.areas.includes(area.slug) : false;
      
      return matchesSearch && matchesEmirate;
    });

    // Apply sorting
    switch (sortBy) {
      case "trending":
        filtered = [...filtered].sort((a, b) => {
          const aIsTrending = TRENDING_COMMUNITIES.includes(a.slug) ? 0 : 1;
          const bIsTrending = TRENDING_COMMUNITIES.includes(b.slug) ? 0 : 1;
          return aIsTrending - bIsTrending;
        });
        break;
      case "alphabetical":
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        // Reverse order (newest added last in array)
        filtered = [...filtered].reverse();
        break;
      case "featured":
      default:
        // Keep original order
        break;
    }

    return filtered;
  }, [searchQuery, selectedEmirate, sortBy]);

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Dubai Area Guides — Lifestyle, Pricing & Investment Dynamics | JBJ"
        description="Understand Dubai communities beyond marketing names. Expert area selection guidance for buyers, tenants, and investors based on real market factors."
        keywords="Dubai area guides, Dubai neighborhoods, Dubai communities, where to live in Dubai, Downtown Dubai guide, Dubai Marina guide, Business Bay guide, Palm Jumeirah"
        canonicalPath="/areas"
      />

      {/* Table of Contents - Fixed Right Sidebar */}
      <GuideTableOfContents 
        items={tocItems} 
        ctaAction={{
          label: "Browse Properties",
          href: "/properties",
          icon: Building2
        }}
      />

      {/* Premium Hero Section */}
      <GuideHero
        badge="Area Guides"
        badgeIcon={Compass}
        title={
          <>
            Understanding Dubai Communities <br className="hidden md:block" />
            <span className="text-gold">Lifestyle, Pricing & Investment Dynamics</span>
          </>
        }
        description="Dubai is a city of distinct communities, each offering a different lifestyle, price range, and investment profile. This guide helps buyers, tenants, and investors understand how to evaluate areas correctly — beyond marketing names — using real market factors."
        backgroundImage="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=80"
        actions={
          <div className="flex flex-wrap justify-center gap-4">
            {/* Primary 3D Button */}
            <Link to="/properties">
              <button 
                className="relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 group overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                  boxShadow: `
                    0 8px 25px rgba(200,167,102,0.4),
                    0 5px 12px rgba(0,0,0,0.15),
                    inset 0 2px 4px rgba(255,255,255,0.9),
                    inset 0 -2px 4px rgba(200,167,102,0.2),
                    0 0 18px rgba(200,167,102,0.3)
                  `,
                }}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 35px rgba(200,167,102,0.6), inset 0 0 18px rgba(200,167,102,0.1)' }} />
                <span className="relative flex items-center gap-2">
                  <span className="text-gold">Browse</span>
                  <span className="text-black">Properties by Area</span>
                  <ArrowUpRight className="w-4 h-4 text-black" />
                </span>
              </button>
            </Link>
            {/* Secondary Button */}
            <Link to="/contact">
              <button className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-white/30 text-white hover:border-gold hover:text-gold">
                <Phone className="w-4 h-4" />
                Speak to an Area Specialist
              </button>
            </Link>
          </div>
        }
      />

      {/* Main Content with Right Padding for TOC */}
      <div className="lg:pr-80">
        {/* Overview Section - Edge to Edge */}
        <section id="overview" className="jj-section-champagne py-20 relative scroll-mt-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="jj-box-active rounded-2xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-black border border-gold/30 flex items-center justify-center">
                    <Compass className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Overview</span>
                  </h2>
                </div>
                <p className="text-zinc-700 text-lg leading-relaxed">
                  Dubai is a city of distinct communities, each offering a different lifestyle, price range, and investment profile. This guide helps buyers, tenants, and investors understand how to evaluate areas correctly — beyond marketing names — using real market factors.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 1: Choosing the Right Area - Edge to Edge */}
        <section id="choosing-area" className="jj-section-champagne py-20 relative scroll-mt-24 border-t border-gold/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="jj-box-active rounded-2xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-black border border-gold/30 flex items-center justify-center">
                    <Target className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">How to</span> Choose the Right Area
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  Choosing an area should be based on objectives, not trends.
                </p>
                <div className="space-y-3">
                  {chooseAreaFactors.map((factor, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700">{factor}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-800 text-sm">
                    <strong>Important:</strong> An area suitable for end-users may not suit investors, and vice versa.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 2: Established vs Emerging Areas - Edge to Edge */}
        <section id="established-emerging" className="jj-section-champagne py-20 relative scroll-mt-24 border-t border-gold/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="jj-box-active rounded-2xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-black border border-gold/30 flex items-center justify-center">
                    <Scale className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Established</span> vs Emerging Areas
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  Dubai offers both mature and developing communities.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 jj-box-active rounded-xl">
                    <h3 className="text-lg font-semibold text-black mb-4">Established Areas</h3>
                    <div className="space-y-3">
                      {establishedAreaTraits.map((trait, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                          <span className="text-zinc-700">{trait}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-6 jj-box-active rounded-xl">
                    <h3 className="text-lg font-semibold text-black mb-4">Emerging Areas</h3>
                    <div className="space-y-3">
                      {emergingAreaTraits.map((trait, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                          <span className="text-zinc-700">{trait}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <p className="text-zinc-600 text-sm mt-6">
                  Area selection should align with time horizon and risk tolerance.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 3: Lifestyle-Driven Communities - Edge to Edge */}
        <section id="lifestyle" className="jj-section-champagne py-20 relative scroll-mt-24 border-t border-gold/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="jj-box-active rounded-2xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-black border border-gold/30 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Lifestyle-Driven</span> Communities
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  Some areas are designed primarily for lifestyle.
                </p>
                <div className="space-y-3">
                  {lifestyleCharacteristics.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-sm mt-6">
                  These areas attract end-users and short-term tenants but often carry higher entry prices.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 4: Family-Oriented Communities - Edge to Edge */}
        <section id="family" className="jj-section-champagne py-20 relative scroll-mt-24 border-t border-gold/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="jj-box-active rounded-2xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-black border border-gold/30 flex items-center justify-center">
                    <Users className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Family-Oriented</span> Communities
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  Family communities focus on space and long-term living.
                </p>
                <div className="space-y-3">
                  {familyFeatures.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-sm mt-6">
                  These areas are favored by long-term tenants and homeowners.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 5: Investment-Focused Areas - Edge to Edge */}
        <section id="investment" className="jj-section-champagne py-20 relative scroll-mt-24 border-t border-gold/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="jj-box-active rounded-2xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-black border border-gold/30 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Investment-Focused</span> Areas
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  Some locations are driven primarily by yield and demand.
                </p>
                <div className="space-y-3">
                  {investmentTraits.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-sm mt-6">
                  These areas suit investors prioritizing cash flow.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 6: Infrastructure & Future Development - Edge to Edge */}
        <section id="infrastructure" className="jj-section-champagne py-20 relative scroll-mt-24 border-t border-gold/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="jj-box-active rounded-2xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-black border border-gold/30 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Infrastructure</span> & Future Development
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  Area performance is closely tied to government planning.
                </p>
                <div className="space-y-3">
                  {infrastructureConsiderations.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-sm mt-6">
                  Long-term growth is influenced by future connectivity, not current hype.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 7: Freehold vs Non-Freehold - Edge to Edge */}
        <section id="freehold" className="jj-section-champagne py-20 relative scroll-mt-24 border-t border-gold/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="jj-box-active rounded-2xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-black border border-gold/30 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Freehold</span> vs Non-Freehold Zones
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  Ownership rules vary by location.
                </p>
                <div className="space-y-3">
                  {freeholdPoints.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-800 text-sm">
                    <strong>Important:</strong> Always verify ownership status before committing.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 8: Price Ranges & Market Behavior - Edge to Edge */}
        <section id="pricing" className="jj-section-champagne py-20 relative scroll-mt-24 border-t border-gold/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="jj-box-active rounded-2xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-black border border-gold/30 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Price Ranges</span> & Market Behavior
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  Prices vary significantly across Dubai. Area pricing is influenced by:
                </p>
                <div className="space-y-3">
                  {priceInfluences.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-sm mt-6">
                  Comparing areas requires looking at price per square foot, not just headline prices.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 9: Rental Demand by Area - Edge to Edge */}
        <section id="rental-demand" className="jj-section-champagne py-20 relative scroll-mt-24 border-t border-gold/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="jj-box-active rounded-2xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-black border border-gold/30 flex items-center justify-center">
                    <Home className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Rental Demand</span> by Area
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  Not all areas rent equally. Rental demand depends on:
                </p>
                <div className="space-y-3">
                  {rentalDemandFactors.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-sm mt-6">
                  Understanding tenant behavior is critical for rental success.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 10: Matching Areas to Objectives - Edge to Edge */}
        <section id="matching-objectives" className="jj-section-champagne py-20 relative scroll-mt-24 border-t border-gold/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="jj-box-active rounded-2xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-black border border-gold/30 flex items-center justify-center">
                    <Target className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Matching Areas</span> to Your Objective
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  Area selection should always be goal-driven.
                </p>
                <div className="space-y-4">
                  {objectiveExamples.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 jj-box-active rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-black">{item.goal}</span>
                        <span className="text-zinc-500 mx-2">→</span>
                        <span className="text-gold">{item.match}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-black/5 border border-gold/30 rounded-xl">
                  <p className="text-zinc-700 text-sm">
                    <strong>Note:</strong> There is no "best area" — only the best area for your objective.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 11: How JBJ Supports - Edge to Edge */}
        <section id="jbj-support" className="jj-section-champagne py-20 relative scroll-mt-24 border-t border-gold/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="jj-box-active rounded-2xl p-8 md:p-12 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-black border border-gold/30 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">How JBJ</span> Global Real Estate Guides Area Selection
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  We do not promote areas based on developer preference or commissions.
                </p>
                <div className="space-y-3">
                  {jbjSupport.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-sm mt-6 italic">
                  We guide clients as if selecting for our own capital.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Bar - Edge to Edge Champagne */}
        <section className="jj-section-champagne py-10 border-y border-gold/20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {highlights.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-black border border-gold/30 rounded-xl mb-3 shadow-md">
                    <item.icon className="w-6 h-6 text-gold" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-black">{item.value}</div>
                  <div className="text-sm text-zinc-600">{item.label}</div>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-xs text-zinc-500 mt-4">Source: Dubai Land Department Annual Report 2025-2026</p>
          </div>
        </section>

        {/* Area Cards Grid */}
        <section id="explore-areas" className="py-20 relative scroll-mt-24">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                <span className="text-gold">Explore</span> Featured Communities
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
                Each area offers a unique lifestyle. Click to explore detailed guides with pricing, amenities, and local insights.
              </p>

              {/* Search & Filter Bar */}
              <div className="max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] rounded-2xl p-4 md:p-6 border border-gold/30 shadow-lg">
                {/* Search Input - Full Width */}
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search by community name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-10 h-12 bg-white border-gold/30 focus:border-gold text-black placeholder:text-zinc-500 w-full"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3 text-zinc-600" />
                    </button>
                  )}
                </div>

                  {/* Emirate Filter - Horizontally Scrollable */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {UAE_EMIRATES.map((emirate) => (
                      <button
                        key={emirate.id}
                        onClick={() => setSelectedEmirate(emirate.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                          selectedEmirate === emirate.id
                            ? "bg-black text-gold border border-gold/50"
                            : "bg-white text-zinc-600 border border-zinc-300 hover:border-gold/50 hover:text-gold"
                        }`}
                      >
                        {emirate.name}
                      </button>
                    ))}
                  </div>

                  {/* Sort Options - Using Global Active Color System */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <span className="text-sm text-zinc-500 mr-2">Sort by:</span>
                    {[
                      { id: "featured" as SortOption, label: "Featured", icon: Star },
                      { id: "trending" as SortOption, label: "Trending", icon: Flame },
                      { id: "newest" as SortOption, label: "Newest", icon: Clock },
                      { id: "alphabetical" as SortOption, label: "A-Z", icon: SortAsc },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSortBy(option.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          sortBy === option.id
                            ? "jj-sort-active"
                            : "jj-sort-inactive"
                        }`}
                      >
                        <option.icon className={`w-3 h-3 ${sortBy === option.id ? "text-black" : ""}`} />
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Results Count */}
                  <div className="mt-4 text-sm text-zinc-600 text-center">
                    Showing <span className="font-semibold text-gold">{filteredGuides.length}</span> communities
                    {selectedEmirate !== "all" && (
                      <span> in <span className="font-semibold">{UAE_EMIRATES.find(e => e.id === selectedEmirate)?.name}</span></span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              key={`${selectedEmirate}-${sortBy}-${searchQuery}`}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {filteredGuides.map((area) => (
                <motion.div key={area.slug} variants={fadeInUp}>
                  <Link 
                    to={`/area/${area.slug}`}
                    className="group block relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 hover:border-gold transition-all duration-500 hover:shadow-xl hover:shadow-gold/20 h-full flex flex-col"
                  >
                    {/* Image - Fixed Height */}
                    <div className="relative h-48 overflow-hidden flex-shrink-0">
                      <img 
                        src={area.heroImage} 
                        alt={area.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                      
                      {/* Trending Badge */}
                      {TRENDING_COMMUNITIES.includes(area.slug) && (
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg">
                          <Flame className="w-3.5 h-3.5 text-white" />
                          <span className="text-xs font-bold text-white uppercase tracking-wide">Trending</span>
                        </div>
                      )}
                      
                      {/* Hover Arrow */}
                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 border border-gold/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg">
                        <ArrowUpRight className="w-5 h-5 text-black" />
                      </div>

                      {/* Premium Badge */}
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm border border-gold/30 rounded-full text-xs text-black font-medium shadow-md">
                          Premium Community
                        </span>
                      </div>
                    </div>
                    
                    {/* Content - Flex Grow for Equal Height */}
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-gold" />
                        <span className="text-gold text-sm uppercase tracking-wider font-medium">Dubai, UAE</span>
                      </div>
                      
                      <h3 className="text-black text-xl font-bold mb-3 group-hover:text-gold transition-colors line-clamp-1">
                        {area.name}
                      </h3>
                      
                      <p className="text-zinc-600 text-sm leading-relaxed line-clamp-2 mb-4 flex-grow">
                        {area.shortDescription}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 mt-auto">
                        <span className="text-gold text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                          Read Full Guide
                          <ArrowUpRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* No Results */}
            {filteredGuides.length === 0 && (
              <motion.div 
                className="text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 border border-zinc-700 rounded-2xl mb-4">
                  <Search className="w-8 h-8 text-zinc-500" />
                </div>
                <h3 className="text-xl text-white mb-2">No communities found</h3>
                <p className="text-zinc-400 mb-4">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedEmirate("all");
                  }}
                  className="text-gold hover:underline"
                >
                  Clear all filters
                </button>
              </motion.div>
            )}
          </div>
        </section>

        {/* FAQ Section - Edge to Edge */}
        <section id="faq" className="jj-section-champagne py-20 relative scroll-mt-24 border-t border-gold/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-black border border-gold/30 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-gold" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                  <span className="text-gold">Area Guide</span> FAQ
                </h2>
              </div>

              <div className="jj-box-active rounded-2xl p-6 md:p-8 shadow-lg">
                <Accordion type="single" collapsible className="space-y-4">
                  {faqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`item-${index}`}
                      className="border border-gold/30 rounded-xl px-6 jj-box-active"
                    >
                      <AccordionTrigger className="text-left font-semibold text-black hover:text-gold py-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-zinc-700 pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <GuideCTA
              title="Ready to Find Your Perfect Community?"
              description="Our team specializes in matching clients with their ideal Dubai neighborhood. Get personalized recommendations based on your goals and requirements."
              icon={Home}
              primaryAction={{
                label: "Browse Properties",
                href: "/properties",
                icon: Building2
              }}
            />
          </div>
        </section>

        {/* Guide Navigation - Edge to Edge */}
        <section className="jj-section-champagne py-12 border-t border-gold/20">
          <div className="container mx-auto px-4">
            <GuideNavigation current="/areas" guides={GUIDE_LINKS} showStartHere />
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default AreaGuides;
