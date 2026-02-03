import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Banknote,
  FileText,
  CheckCircle2,
  HelpCircle,
  Phone,
  Globe,
  Shield,
  ArrowRight,
  AlertCircle,
  Users,
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

const whatWeDo = [
  "Introduce buyers to licensed currency exchange partners",
  "Coordinate documentation requirements",
  "Facilitate communication between parties",
  "Track transfer status for transaction alignment",
];

const whatWeDontDo = [
  "Provide banking or financial advice",
  "Handle or hold client funds",
  "Guarantee exchange rates or timing",
  "Act as a regulated financial institution",
];

const documentsRequired = [
  "Passport copy (buyer and beneficiaries)",
  "Emirates ID (if UAE resident)",
  "Proof of source of funds",
  "Property purchase documentation",
  "Bank statements (as required by exchange partner)",
];

const processSteps = [
  { step: 1, title: "Submit currency exchange support request", icon: FileText },
  { step: 2, title: "Documentation review and preparation", icon: ClipboardList },
  { step: 3, title: "Partner introduction and coordination", icon: Users },
  { step: 4, title: "Transfer confirmation and alignment with transaction", icon: CheckCircle2 },
];

const faqData = [
  {
    question: "Why do I need currency exchange support?",
    answer: "Many international buyers need to transfer funds across borders for property purchases. We help coordinate with licensed exchange partners to ensure smooth fund transfer aligned with your transaction timeline.",
  },
  {
    question: "Do you hold or transfer my money?",
    answer: "No. JBJ Global Real Estate does not hold, transfer, or manage client funds. We introduce you to licensed exchange partners who handle the actual currency transfer.",
  },
  {
    question: "How do I know the exchange partner is legitimate?",
    answer: "We only introduce clients to licensed, regulated exchange providers. You will contract directly with the exchange partner under their regulatory framework.",
  },
  {
    question: "Can you guarantee the exchange rate?",
    answer: "No. Exchange rates are determined by market conditions and your chosen exchange partner. We do not guarantee or fix exchange rates.",
  },
  {
    question: "What documents do I need?",
    answer: "Typically, you'll need passport copies, proof of source of funds, property documentation, and bank statements. Requirements vary by exchange partner and transaction size.",
  },
  {
    question: "How long does the transfer take?",
    answer: "Transfer timing depends on the exchange partner, source and destination countries, and compliance requirements. Typical transfers can range from same-day to several business days.",
  },
  {
    question: "Is this service free?",
    answer: "Our coordination support is provided as part of our buyer advisory service. The exchange partner may charge fees for the actual currency transfer.",
  },
  {
    question: "What if I already have an exchange provider?",
    answer: "You are free to use your preferred exchange provider. We can coordinate with them regarding transaction timing and documentation requirements.",
  },
];

const CurrencyExchange = () => {
  return (
    <>
      <SEOHead
        title="Currency Exchange Support | JBJ Global Real Estate"
        description="Coordination support for international property buyers transferring funds. Partner introductions and documentation assistance for cross-border transactions."
        canonicalPath="/services/currency-exchange"
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
              <Banknote className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Currency Exchange Support
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Coordination support for buyers transferring funds across borders — with clear routing and documentation readiness.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=currency-exchange">
                Request Exchange Support
              </PremiumHeroButton>
              <PremiumHeroButton href="/contact">
                Contact Support
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

      {/* WHAT WE DO / DON'T DO */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* What We Do */}
              <motion.div variants={fadeInUp}>
                <div className="h-full jj-card-inner">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-xl font-bold text-black">What We Do</h3>
                  </div>
                  <ul className="space-y-3">
                    {whatWeDo.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-zinc-700">
                        <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* What We Don't Do */}
              <motion.div variants={fadeInUp}>
                <div className="h-full jj-card-inner">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-zinc-400" />
                    </div>
                    <h3 className="text-xl font-bold text-black">What We Don't Do</h3>
                  </div>
                  <ul className="space-y-3">
                    {whatWeDontDo.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-zinc-700">
                        <span className="text-zinc-400">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DOCUMENTS REQUIRED */}
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
              Documents Commonly Required
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {documentsRequired.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-700">
                    <FileText className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-zinc-500 italic">
                * Specific requirements vary by exchange partner and transaction details.
              </p>
            </motion.div>
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
              Need Currency Exchange Support?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              We'll coordinate with licensed exchange partners for your property purchase.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact?service=currency-exchange">
                  Request Exchange Support
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
            JBJ Global Real Estate provides coordination support only. Currency exchange services are provided by independent, licensed exchange partners. 
            Clients contract directly with exchange partners under their regulatory framework. JBJ does not hold, transfer, or manage client funds.
          </p>
        </div>
      </section>

      <DirectContactCTA />
      <Footer />
    </>
  );
};

export default CurrencyExchange;
