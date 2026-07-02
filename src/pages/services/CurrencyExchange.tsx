import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
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
  Play,
  Clock,
  Send,
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
  { text: "Organize your exchange request intake (currency, amount range, timing, destination)", icon: ClipboardList },
  { text: "Prepare a documentation checklist based on transaction pathway", icon: FileText },
  { text: "Introduce you to licensed providers when required", icon: Users },
  { text: "Coordinate status updates and document readiness reminders", icon: Clock },
];

const typicalDocuments = [
  "Passport / Emirates ID (as applicable)",
  "Proof of address (as applicable)",
  "Proof of funds / source documentation (as applicable)",
  "Transaction context (SPA/reservation/booking reference where available)",
];

const processSteps = [
  { step: 1, title: "Submit your exchange intent and timing", icon: Send },
  { step: 2, title: "Receive a checklist and routing options", icon: ClipboardList },
  { step: 3, title: "Partner introduction (if needed)", icon: Users },
  { step: 4, title: "Confirmation and status coordination", icon: CheckCircle2 },
  { step: 5, title: "Completion support for payment timeline alignment", icon: Clock },
];

const faqData = [
  {
    question: "Can you guarantee exchange rates?",
    answer: "No. Rates are set by providers and markets.",
  },
  {
    question: "Can you handle the transfer for me?",
    answer: "Transfers are handled by licensed providers. We coordinate intake and readiness.",
  },
  {
    question: "Will I be asked for proof of funds?",
    answer: "Often yes, depending on compliance requirements.",
  },
  {
    question: "Do you support multiple currencies?",
    answer: "Support depends on provider availability.",
  },
  {
    question: "How fast can it be done?",
    answer: "Time varies by provider, compliance checks, and documentation readiness.",
  },
  {
    question: "Is this required for every buyer?",
    answer: "No. It's helpful for cross-border transfers or complex routing.",
  },
  {
    question: "Is this included in brokerage fees?",
    answer: "It is a separate coordination service scope.",
  },
  {
    question: "Can you help if the buyer is overseas?",
    answer: "Yes—intake and coordination can be done remotely.",
  },
];

const CurrencyExchange = () => {
  return (
    <div data-brand-emerald-page data-marketing-page style={{ background: "#010806" }}>
      <SEOHead
        title="Currency Exchange Support | JBJ Global Real Estate"
        description="Coordination support for cross-border buyers transferring funds—structured documentation, clean routing, and partner introductions when needed."
        canonicalPath="/services/currency-exchange"
      />

      {/* HERO SECTION */}
      <section className="jj-hero-fullscreen jj-hero-compact relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#1A1A1A]">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
        </div>
        
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-[#EFE6D6]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#EFE6D6]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
                        <SectionEyebrow icon={Banknote} className="mb-6">Services</SectionEyebrow>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Currency Exchange Support
            </h1>
            
            <p className="text-white/85 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Coordination support for cross-border buyers transferring funds—structured documentation, clean routing, and partner introductions when needed.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=currency-exchange">
                Request Exchange Support
              </PremiumHeroButton>
              <PremiumHeroButton href="/contact">
                Speak to Support
              </PremiumHeroButton>
            </div>

            {/* Video Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-12 max-w-xl mx-auto"
            >
              <div className="relative rounded-2xl overflow-hidden border border-[#B89555]/30 bg-[#1A1A1A]/50 backdrop-blur-sm aspect-video">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center mb-4 border border-[#B89555]/40">
                    <Play className="w-6 h-6 text-[#1A1A1A] ml-1" />
                  </div>
                  <p className="text-[#1A1A1A] text-sm font-medium">Cross-Border Buying Made Easier</p>
                  <p className="text-white/90 text-xs mt-1">Video Coming Soon</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span className="text-[#1A1A1A]/70 text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
        </motion.div>
      </section>

      {/* WHAT THIS SERVICE IS */}
      <section className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              What This Service Is
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner text-center">
              <p className="text-[#1A1A1A]/70 text-lg leading-relaxed">
                Currency exchange can create delays if documentation and routing are unclear. This service provides coordination support so buyers understand what is required and can move efficiently with the right licensed providers.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              What We Do
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whatWeDo.map((item, idx) => (
                <motion.div key={idx} variants={fadeInUp} className="jj-card-inner">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-[#1A1A1A]" />
                    </div>
                    <span className="text-[#1A1A1A]/70">{item.text}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHAT WE DO NOT DO */}
      <section className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              What We Do Not Do
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 text-center mb-8 max-w-2xl mx-auto">
              (Clear Scope)
            </motion.p>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-white/70" />
                </div>
                <p className="text-[#1A1A1A]/70 leading-relaxed">
                  We do not provide banking services or regulated financial advice. Where required, we introduce clients to properly licensed providers who operate under their own terms and compliance requirements.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* TYPICAL DOCUMENTS */}
      <section className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Typical Documents
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 text-center mb-8 max-w-2xl mx-auto">
              (May Be Requested by Providers)
            </motion.p>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {typicalDocuments.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[#1A1A1A]/70">
                    <FileText className="w-5 h-5 text-[#1A1A1A] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#1A1A1A] py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              How It Works
            </motion.h2>
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-[#EFE6D6]/30 hidden md:block" />
                <div className="space-y-6">
                  {processSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      variants={fadeInUp}
                      className="flex items-center gap-6"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0 z-10 border-2 border-[#B89555]">
                        <span className="text-[#1A1A1A] font-bold">{step.step}</span>
                      </div>
                      <div className="flex-1 jj-card-inner !p-4">
                        <div className="flex items-center gap-4">
                          <step.icon className="w-6 h-6 text-[#1A1A1A] shrink-0" />
                          <span className="font-semibold text-[#1A1A1A]">{step.title}</span>
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
      <section className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12"
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
                    <AccordionTrigger className="text-left text-[#1A1A1A] hover:text-[#1A1A1A]">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-[#1A1A1A] shrink-0" />
                        {faq.question}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-[#1A1A1A]/70 pl-8">
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
      <section className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Move funds with clarity and control
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 mb-8">
              Send your timing and currency requirements to receive the correct checklist and routing plan.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact?service=currency-exchange">
                  Request Exchange Support
                  <ArrowRight className="w-4 h-4 ml-2" />
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
    </div>
  );
};

export default CurrencyExchange;
