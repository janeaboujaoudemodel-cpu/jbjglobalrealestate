import { Link } from "react-router-dom";
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
} from "lucide-react";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

      {/* HERO SECTION */}
      <section className="relative min-h-screen h-screen flex items-center justify-center bg-black overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(200,167,102,0.15) 0%, transparent 60%), linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,1) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.p
              variants={fadeInUp}
              className="text-gold text-sm tracking-[0.2em] uppercase mb-4"
            >
              Professional Representation
            </motion.p>
            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Buying Advisory Services
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-champagne-light mb-6"
            >
              Professional Representation for Buyers Across Primary & Secondary
              Markets
            </motion.p>
            <motion.p
              variants={fadeInUp}
              className="text-zinc-400 text-lg max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              JBJ Global Real Estate provides structured, licensed buying
              advisory services for individuals and investors seeking to
              purchase residential or investment properties in the UAE. Our
              advisory goes beyond general guidance — we represent your
              interests throughout the buying process, from market analysis and
              opportunity sourcing to negotiation, transaction coordination, and
              completion.
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
                  Request Buying Consultation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-gold/50 text-gold hover:bg-gold/10"
              >
                <Link to="/buyer-guide">View Buyer Guide</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </section>

      {/* SECTION 1: WHAT BUYING ADVISORY MEANS */}
      <section className="bg-black py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              What Buying Advisory Means
            </motion.h2>
            <motion.div
              variants={fadeInUp}
              className="bg-gradient-to-br from-champagne-light/10 to-champagne/5 border border-gold/30 rounded-2xl p-8 md:p-10"
            >
              <p className="text-lg text-zinc-300 leading-relaxed">
                Buying advisory is a professional service where JBJ acts as your
                appointed representative during the purchase process. Unlike
                educational guides, advisory involves{" "}
                <span className="text-gold font-semibold">
                  active market analysis, property shortlisting, negotiation
                  support, documentation coordination, and execution management
                </span>{" "}
                — all aligned with your objectives, budget, and risk profile.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: WHO THIS SERVICE IS FOR */}
      <section className="jj-section-champagne py-20">
        <div className="container mx-auto px-4">
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
                  <Card className="h-full bg-white/80 border-gold/30 hover:border-gold hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-black flex items-center justify-center">
                        <item.icon className="w-7 h-7 text-gold" />
                      </div>
                      <h3 className="font-semibold text-black mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-zinc-600">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: PRIMARY VS SECONDARY MARKET */}
      <section className="bg-black py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Primary vs Secondary Market Advisory
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Off-Plan */}
              <motion.div variants={fadeInUp}>
                <Card className="h-full bg-gradient-to-br from-gold/10 to-gold/5 border-gold/40">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-gold" />
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        Off-Plan (Primary Market)
                      </h3>
                    </div>
                    <ul className="space-y-3">
                      {primaryMarketFeatures.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-zinc-300"
                        >
                          <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Ready/Resale */}
              <motion.div variants={fadeInUp}>
                <Card className="h-full bg-gradient-to-br from-champagne/10 to-champagne/5 border-champagne/40">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-champagne/20 flex items-center justify-center">
                        <Key className="w-6 h-6 text-champagne" />
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        Ready / Resale (Secondary Market)
                      </h3>
                    </div>
                    <ul className="space-y-3">
                      {secondaryMarketFeatures.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-zinc-300"
                        >
                          <CheckCircle2 className="w-5 h-5 text-champagne shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 4: OUR BUYING ADVISORY PROCESS */}
      <section className="jj-section-champagne py-20">
        <div className="container mx-auto px-4">
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
                      <Card className="flex-1 bg-white/80 border-gold/20 hover:border-gold/50 transition-all">
                        <CardContent className="p-4 flex items-center gap-4">
                          <step.icon className="w-6 h-6 text-gold shrink-0" />
                          <span className="font-semibold text-black">
                            {step.title}
                          </span>
                        </CardContent>
                      </Card>
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
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Fees & Transparency
            </motion.h2>
            <motion.div
              variants={fadeInUp}
              className="bg-gradient-to-br from-gold/10 to-gold/5 border-2 border-gold/50 rounded-2xl p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <Banknote className="w-8 h-8 text-gold shrink-0" />
                <h3 className="text-xl font-bold text-white">Important Notice</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Off-Plan Purchases:</strong>{" "}
                    No advisory or agency fees charged to buyers
                  </span>
                </li>
                <li className="flex items-start gap-3 text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">
                      Secondary Market Purchases:
                    </strong>{" "}
                    Agency commission applies as per UAE regulations
                  </span>
                </li>
                <li className="flex items-start gap-3 text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <span>All fees are disclosed upfront before engagement</span>
                </li>
                <li className="flex items-start gap-3 text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <span>No hidden costs, markups, or price inflation</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 6: COMPLIANCE & LICENSING */}
      <section className="jj-section-champagne py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp} className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center">
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
              JBJ Global Real Estate operates as a licensed UAE brokerage,
              providing buying advisory services strictly within regulatory
              frameworks. Where additional services are required (legal,
              mortgage, valuation), clients are introduced to licensed
              third-party professionals under separate engagement.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* SECTION 7: COMPARISON TABLE */}
      <section className="bg-black py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              How This Differs From the Buyer Guide
            </motion.h2>
            <motion.div
              variants={fadeInUp}
              className="overflow-x-auto rounded-xl border border-gold/30"
            >
              <table className="w-full">
                <thead>
                  <tr className="bg-gold/20">
                    <th className="px-6 py-4 text-left text-sm font-bold text-gold uppercase tracking-wider">
                      Aspect
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-zinc-400 uppercase tracking-wider">
                      Buyer Guide
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                      Buying Advisory
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/20">
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="bg-black/50">
                      <td className="px-6 py-4 text-zinc-400">{row.aspect}</td>
                      <td className="px-6 py-4 text-zinc-500">{row.guide}</td>
                      <td className="px-6 py-4 text-gold font-medium">
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
      <section className="jj-section-champagne py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center">
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
                    className="bg-white/80 border border-gold/30 rounded-xl overflow-hidden"
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
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Ready to Buy with Confidence?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-zinc-400 text-lg mb-8"
            >
              Let our experienced team represent your interests throughout the
              entire buying process.
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
                className="border-gold/50 text-gold hover:bg-gold/10"
              >
                <Link to="/buyer-guide">Explore Buyer Guide</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* INTERNAL LINKS */}
      <section className="bg-zinc-950 py-12 border-t border-gold/20">
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

      <Footer />
    </>
  );
};

export default BuyingAdvisory;
