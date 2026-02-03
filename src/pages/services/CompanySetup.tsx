import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building,
  FileText,
  CheckCircle2,
  HelpCircle,
  Phone,
  Users,
  Shield,
  Globe,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import Footer from "@/components/Footer";
import DirectContactCTA from "@/components/DirectContactCTA";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
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

const whyThisExists = [
  { icon: Building, title: "Property Holding", description: "Structuring property ownership through corporate entities" },
  { icon: Globe, title: "International Investors", description: "Foreign nationals requiring UAE presence for transactions" },
  { icon: Shield, title: "Asset Protection", description: "Separation of personal and investment assets" },
  { icon: Briefcase, title: "Business Operations", description: "Investors planning to operate businesses alongside investments" },
];

const processSteps = [
  { step: 1, title: "Initial intake and requirement assessment", icon: ClipboardList },
  { step: 2, title: "Partner introduction (licensed company setup specialist)", icon: Users },
  { step: 3, title: "Documentation preparation and submission", icon: FileText },
  { step: 4, title: "Progress updates and completion coordination", icon: CheckCircle2 },
];

const typicalDocuments = [
  "Passport copies (all shareholders/directors)",
  "Proof of address",
  "Business plan or activity description",
  "No objection letter (if applicable)",
  "Bank reference letters (if applicable)",
];

const faqData = [
  {
    question: "Why would I need a company for property investment?",
    answer: "Some investors prefer holding properties through corporate structures for asset protection, tax planning, or ease of ownership transfer. This is particularly common for commercial properties or large portfolios.",
  },
  {
    question: "Does JBJ set up companies?",
    answer: "No. JBJ introduces clients to licensed company setup specialists. The setup service is provided by independent partners under their own regulatory framework.",
  },
  {
    question: "What types of companies can be set up?",
    answer: "Options include mainland LLCs, free zone companies, and offshore entities. Your setup specialist will advise on the most suitable structure for your needs.",
  },
  {
    question: "How long does company setup take?",
    answer: "Timing varies by jurisdiction and company type. Typical setups range from a few days for free zones to several weeks for mainland companies.",
  },
  {
    question: "What are the ongoing requirements?",
    answer: "Companies require annual renewals, accounting, and compliance filings. Your setup partner can provide ongoing support or introduce you to appropriate service providers.",
  },
  {
    question: "Can a company buy any type of property?",
    answer: "Company ownership rules vary by property type and location. Some freehold areas allow corporate ownership, while others have restrictions.",
  },
  {
    question: "Do I need to be in Dubai for company setup?",
    answer: "Many processes can be done remotely with proper documentation. Some steps may require physical presence or power of attorney arrangements.",
  },
  {
    question: "What about visa and residency?",
    answer: "Company ownership can provide visa sponsorship opportunities. Visa services are handled through separate licensed immigration specialists.",
  },
];

const CompanySetup = () => {
  return (
    <>
      <SEOHead
        title="Company Setup Support | JBJ Global Real Estate"
        description="Coordination pathway for UAE company setup through licensed specialists. Structured, documented, and guided support for property investors."
        canonicalPath="/services/company-setup"
      />

      {/* HERO SECTION */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
        </div>
        
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-gold/40 bg-black/30 backdrop-blur-md">
              <Building className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Company Setup Support
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              A coordination pathway for company setup through licensed specialists — structured, documented, and guided.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=company-setup">
                Request Company Setup
              </PremiumHeroButton>
              <PremiumHeroButton href="/partners/company-setup">
                Partner Introduction
              </PremiumHeroButton>
            </div>
          </motion.div>
        </div>
        
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

      {/* WHY THIS EXISTS */}
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
              Why This Exists for Investors
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {whyThisExists.map((item, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <div className="h-full jj-card-inner">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0">
                        <item.icon className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-black mb-1">{item.title}</h3>
                        <p className="text-sm text-zinc-600">{item.description}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* PROCESS STEPS */}
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
              How It Works
            </motion.h2>
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gold/30 hidden md:block" />
                <div className="space-y-6">
                  {processSteps.map((step, index) => (
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
                          <span className="font-semibold text-black">{step.title}</span>
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

      {/* TYPICAL DOCUMENTS */}
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
              className="text-3xl md:text-4xl font-bold text-black text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Typical Documents Required
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {typicalDocuments.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-700">
                    <FileText className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-zinc-500 italic">
                * Requirements vary by company type and jurisdiction. Your setup partner will provide a complete checklist.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
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
              Frequently Asked Questions
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Accordion type="single" collapsible className="space-y-4">
                {faqData.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="jj-card-inner border-none"
                  >
                    <AccordionTrigger className="text-left text-black hover:text-gold">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-gold shrink-0" />
                        {faq.question}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-zinc-600 pl-8">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA BLOCK */}
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
              className="text-3xl md:text-4xl font-bold text-black mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Ready to Set Up Your Company?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              We'll introduce you to licensed specialists for your company setup needs.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact?service=company-setup">
                  Request Company Setup
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* COMPLIANCE DISCLAIMER */}
      <section className="bg-black py-8 border-t border-zinc-800">
        <div className="container mx-auto px-4 text-center">
          <p className="text-zinc-500 text-sm max-w-3xl mx-auto">
            Company setup services are provided by independent, licensed specialists. JBJ Global Real Estate provides introductions and coordination support only. 
            Clients contract directly with setup partners under their regulatory framework. JBJ does not provide legal, tax, or business advisory services.
          </p>
        </div>
      </section>

      <DirectContactCTA />
      <Footer />
    </>
  );
};

export default CompanySetup;
