import { Link } from "react-router-dom";
import VideoBackground from "@/components/VideoBackground";
import { motion } from "framer-motion";
import {
  Users,
  Globe,
  Building2,
  Shield,
  CheckCircle2,
  ArrowRight,
  FileText,
  Search,
  Eye,
  Briefcase,
  Target,
  Key,
  Scale,
  Landmark,
  HelpCircle,
  Phone,
  Banknote,
  UserCheck,
  Lock,
  ClipboardList,
  ArrowUpRight,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Import hero video
import buyingAdvisoryHeroVideo from "@/assets/videos/dubai-buying-hero.mp4";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const whoIsForData = [
  {
    icon: Users,
    title: "First-Time Buyers",
    description: "Seeking structured guidance through the buying process",
  },
  {
    icon: Target,
    title: "Investors",
    description: "Targeting income or capital appreciation opportunities",
  },
  {
    icon: Globe,
    title: "International Buyers",
    description: "Purchasing remotely from abroad",
  },
  {
    icon: Building2,
    title: "Off-Plan vs Ready",
    description: "Comparing new developments with resale properties",
  },
  {
    icon: Lock,
    title: "Discreet Representation",
    description: "Buyers seeking professional, confidential advisory",
  },
];

const primaryMarketFeatures = [
  "Developer-direct inventory",
  "No buyer agency fees",
  "Access to official launches & payment plans",
  "Project due diligence & milestone review",
  "Developer comparison & negotiation support",
];

const secondaryMarketFeatures = [
  "Market pricing analysis",
  "Title deed verification",
  "Negotiation & offer strategy",
  "Coordination with sellers, trustees & banks",
  "Transfer & completion oversight",
];

const advisoryProcess = [
  {
    step: 1,
    title: "Buyer Profile & Objectives",
    icon: UserCheck,
  },
  {
    step: 2,
    title: "Market & Area Analysis",
    icon: Search,
  },
  {
    step: 3,
    title: "Property Shortlisting",
    icon: ClipboardList,
  },
  {
    step: 4,
    title: "Viewing & Comparative Evaluation",
    icon: Eye,
  },
  {
    step: 5,
    title: "Negotiation & Offer Strategy",
    icon: Scale,
  },
  {
    step: 6,
    title: "Transaction Coordination",
    icon: FileText,
  },
  {
    step: 7,
    title: "Transfer / Handover Completion",
    icon: Key,
  },
];

const comparisonData = [
  {
    aspect: "Type",
    guide: "Educational",
    advisory: "Execution-based",
  },
  {
    aspect: "Approach",
    guide: "Self-directed",
    advisory: "Represented",
  },
  {
    aspect: "Information",
    guide: "General information",
    advisory: "Personalized strategy",
  },
  {
    aspect: "Support",
    guide: "No representation",
    advisory: "Active transaction support",
  },
];

const faqData = [
  {
    question: "Is buying advisory mandatory?",
    answer:
      "No. It is optional but recommended for structured purchases where you want professional representation throughout the process.",
  },
  {
    question: "Do I pay fees for off-plan purchases?",
    answer:
      "No. Developers cover brokerage fees for off-plan purchases. There is no advisory or agency fee charged to buyers for primary market transactions.",
  },
  {
    question: "Can JBJ negotiate on my behalf?",
    answer:
      "Yes, negotiation is a core part of our advisory representation. We handle all negotiations with sellers, developers, and their representatives.",
  },
  {
    question: "Can international buyers use this service remotely?",
    answer:
      "Yes. Our advisory service is designed to support international buyers purchasing remotely, with virtual viewings, digital documentation, and POA arrangements where needed.",
  },
  {
    question: "Is buying advisory different from property search?",
    answer:
      "Yes. Advisory includes full representation and execution — not just finding properties, but handling negotiations, documentation, and transaction management.",
  },
  {
    question: "Do you advise on investment returns?",
    answer:
      "We provide market insights, historical data, and comparable analysis. We do not guarantee or predict specific investment returns.",
  },
  {
    question: "Are mortgages handled by JBJ?",
    answer:
      "We provide introductions to licensed mortgage providers and banks. Mortgage advisory is provided by regulated third-party lenders.",
  },
  {
    question: "Can I switch from guide to advisory later?",
    answer:
      "Yes. Many clients start with our Buyer Guide for education and later engage our advisory service when they're ready to execute.",
  },
];

const BuyingAdvisory = () => {
  return (
    <>
      <SEOHead
        title="Buying Advisory Services | JBJ Global Real Estate"
        description="Professional buying advisory and representation for property purchases in Dubai. Expert guidance from market analysis to transaction completion."
        canonicalPath="/services/buying-advisory"
      />

      {/* HERO SECTION - Full-screen with video background */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 bg-black">
          <VideoBackground 
            src={buyingAdvisoryHeroVideo}
            poster="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>
        
        {/* Floating gold accent orbs */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Label */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-gold/40 bg-black/30 backdrop-blur-md">
              <Briefcase className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Professional Representation
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Buying Advisory Services
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Professional representation for buyers across primary & secondary markets. Expert guidance from market analysis to transaction completion.
            </p>
            
            {/* Hero CTA Buttons - Using PremiumHeroButton for consistency */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=buying-advisory">
                Request Consultation
              </PremiumHeroButton>
              <PremiumHeroButton href="/buyer-guide">
                View Buyer Guide
              </PremiumHeroButton>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span className="text-gold/60 text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
        </motion.div>
      </section>

      {/* SECTION 1: WHAT BUYING ADVISORY MEANS */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              What Buying Advisory Means
            </motion.h2>
            <motion.div
              variants={fadeInUp}
              className="jj-card-inner"
            >
              <p className="text-lg text-zinc-700 leading-relaxed">
                JBJ Global Real Estate provides structured, licensed buying
                advisory services for individuals and investors seeking to
                purchase residential or investment properties in the UAE. Our
                advisory goes beyond general guidance — we represent your
                interests throughout the buying process, from{" "}
                <span className="text-gold font-semibold">
                  market analysis and opportunity sourcing to negotiation,
                  transaction coordination, and completion
                </span>.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: WHO THIS SERVICE IS FOR */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Who This Service Is For
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {whoIsForData.map((item, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <div className="h-full jj-card-inner text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-black flex items-center justify-center">
                      <item.icon className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="font-semibold text-black mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-zinc-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: PRIMARY VS SECONDARY MARKET */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Primary vs Secondary Market Coverage
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Primary Market */}
              <motion.div variants={fadeInUp}>
                <div className="h-full jj-card-inner">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-xl font-bold text-black">
                      Primary Market (Off-Plan / New)
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {primaryMarketFeatures.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-zinc-700"
                      >
                        <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Secondary Market */}
              <motion.div variants={fadeInUp}>
                <div className="h-full jj-card-inner">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                      <Key className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-xl font-bold text-black">
                      Secondary Market (Resale / Ready)
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {secondaryMarketFeatures.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-zinc-700"
                      >
                        <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 4: OUR BUYING ADVISORY PROCESS */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Our Buying Advisory Process
            </motion.h2>
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gold/30 hidden md:block" />

                <div className="space-y-6">
                  {advisoryProcess.map((step, index) => (
                    <motion.div
                      key={index}
                      variants={fadeInUp}
                      className="flex items-center gap-6"
                    >
                      <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shrink-0 z-10 border-2 border-gold">
                        <span className="text-gold font-bold">{step.step}</span>
                      </div>
                      <div className="flex-1 jj-card-inner !p-4">
                        <div className="flex items-center gap-4">
                          <step.icon className="w-6 h-6 text-gold shrink-0" />
                          <span className="font-semibold text-black">
                            {step.title}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 5: FEES & TRANSPARENCY */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Fees & Transparency
            </motion.h2>
            <motion.div
              variants={fadeInUp}
              className="jj-card-inner"
            >
              <div className="flex items-start gap-4 mb-6">
                <Banknote className="w-8 h-8 text-gold shrink-0" />
                <h3 className="text-xl font-bold text-black">Fee Structure</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-zinc-700">
                  <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <span><strong>Primary market:</strong> No buyer fees — developer-paid commission</span>
                </li>
                <li className="flex items-start gap-3 text-zinc-700">
                  <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <span><strong>Secondary market:</strong> Commission disclosed at engagement</span>
                </li>
                <li className="flex items-start gap-3 text-zinc-700">
                  <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <span>Fee structures comply with UAE brokerage regulations</span>
                </li>
                <li className="flex items-start gap-3 text-zinc-700">
                  <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <span>No hidden charges or undisclosed markups</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 6: COMPLIANCE & LICENSING */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp} className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center border-2 border-gold">
                <Shield className="w-8 h-8 text-gold" />
              </div>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Compliance & Licensing
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-zinc-700 leading-relaxed"
            >
              JBJ Global Real Estate operates under a UAE brokerage license
              (RERA/DLD registration). All advisory and transaction support
              is delivered within applicable regulatory frameworks. Where
              required, clients may be introduced to licensed third-party
              service providers under separate agreements.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* SECTION 7: COMPARISON TABLE */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              How This Differs From the Buyer Guide
            </motion.h2>
            <motion.div
              variants={fadeInUp}
              className="overflow-x-auto rounded-xl border-2 border-gold/40"
            >
              <table className="w-full">
                <thead>
                  <tr className="bg-black">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gold uppercase tracking-wider">
                      Aspect
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-zinc-400 uppercase tracking-wider">
                      Buyer Guide
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gold uppercase tracking-wider">
                      Buying Advisory
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/20 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                  {comparisonData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-black font-medium">{row.aspect}</td>
                      <td className="px-6 py-4 text-zinc-600">{row.guide}</td>
                      <td className="px-6 py-4 text-gold font-semibold">
                        {row.advisory}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 8: FAQ */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center border-2 border-gold">
                <HelpCircle className="w-7 h-7 text-gold" />
              </div>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-10"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Frequently Asked Questions
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Accordion type="single" collapsible className="space-y-4">
                {faqData.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`faq-${index}`}
                    className="jj-card-inner overflow-hidden"
                  >
                    <AccordionTrigger className="px-6 py-4 text-left font-semibold text-black hover:text-gold hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-zinc-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Ready to Buy with Professional Representation?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-zinc-700 text-lg mb-8"
            >
              Let our experienced team guide you through the entire buying
              process with expert market analysis and negotiation support.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                asChild
                size="lg"
                className="bg-gold hover:bg-gold-dark text-black font-semibold px-8"
              >
                <Link to="/contact?service=buying-advisory">
                  Book Buying Advisory Consultation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-gold text-gold hover:bg-gold/10"
              >
                <Link to="/buyer-guide">Explore Buyer Guide</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* INTERNAL LINKS */}
      <section className="bg-black py-12 border-t border-gold/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              to="/buyer-guide"
              className="text-zinc-400 hover:text-gold transition-colors"
            >
              Buyer Guide
            </Link>
            <Link
              to="/areas"
              className="text-zinc-400 hover:text-gold transition-colors"
            >
              Area Guides
            </Link>
            <Link
              to="/market-intelligence"
              className="text-zinc-400 hover:text-gold transition-colors"
            >
              Market Intelligence
            </Link>
            <Link
              to="/contact"
              className="text-zinc-400 hover:text-gold transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default BuyingAdvisory;
