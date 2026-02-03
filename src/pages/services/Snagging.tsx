import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Camera,
  FileText,
  CheckCircle2,
  ArrowRight,
  Users,
  Building2,
  Wrench,
  HelpCircle,
  Phone,
  Clock,
  AlertTriangle,
  ClipboardList,
  Eye,
  Send,
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

const whatItCovers = [
  "Unit inspection before handover acceptance",
  "Defect identification and documentation (photos + notes)",
  "Snagging report packaging for developer/contractor submission",
  "Follow-up checklist tracking until closure",
];

const whoIsFor = [
  {
    icon: Users,
    title: "Buyers Receiving Handover",
    description: "Off-plan to ready property transitions",
  },
  {
    icon: Building2,
    title: "Investors Preparing for Rent",
    description: "Ensuring unit is rent-ready",
  },
  {
    icon: Wrench,
    title: "Owners Planning Renovations",
    description: "Pre-renovation condition assessment",
  },
];

const processSteps = [
  { step: 1, title: "Submit unit details + expected handover date", icon: Send },
  { step: 2, title: "Schedule inspection window", icon: Clock },
  { step: 3, title: "On-site inspection + evidence capture", icon: Camera },
  { step: 4, title: "Report delivery + issue categorization", icon: FileText },
  { step: 5, title: "Follow-up tracking (as applicable)", icon: ClipboardCheck },
];

const deliverables = [
  "Snagging report (structured)",
  "Photo evidence set",
  "Priority grading (critical / major / minor)",
  "Closure checklist template",
];

const requirements = [
  "Unit access confirmation",
  "Handover notice (if available)",
  "Any floor plan / unit reference (if available)",
];

const faqData = [
  {
    question: "What is snagging?",
    answer: "Snagging is a detailed inspection of a property to identify defects, incomplete work, or issues that need to be rectified before or shortly after handover.",
  },
  {
    question: "When should I book snagging?",
    answer: "Ideally, snagging should be done before you accept handover from the developer. This gives you leverage to have issues fixed before taking possession.",
  },
  {
    question: "Do you coordinate with the developer?",
    answer: "We provide a structured report that you can submit to the developer. We can guide you on the submission process, but direct coordination is between you and the developer.",
  },
  {
    question: "Do you fix defects or only report them?",
    answer: "We provide inspection and documentation services only. Repairs are coordinated between you and the developer or your chosen contractor.",
  },
  {
    question: "Can snagging be done after handover?",
    answer: "Yes, but it's more effective before handover when you have more leverage. Post-handover snagging can still document issues for warranty claims.",
  },
  {
    question: "What if access is delayed?",
    answer: "We'll reschedule the inspection once you have confirmed access. Please provide at least 24 hours notice for any changes.",
  },
  {
    question: "How do I share the report with the developer?",
    answer: "The report is delivered in a professional format suitable for developer submission. We provide guidance on how to present it effectively.",
  },
  {
    question: "Is this included in brokerage services?",
    answer: "Snagging is a separate service from our standard brokerage advisory. It's available as an add-on service for clients.",
  },
];

const Snagging = () => {
  return (
    <>
      <SEOHead
        title="Snagging & Handover Inspection | JBJ Global Real Estate"
        description="Professional snagging inspection services for property handover in Dubai. Comprehensive defect identification, documentation, and follow-up tracking."
        canonicalPath="/services/snagging"
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
              <ClipboardCheck className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Snagging & Handover Inspection
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              A structured, documented inspection to identify defects before you accept handover — with clear reporting and follow-up tracking.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=snagging">
                Book a Snagging Request
              </PremiumHeroButton>
              <PremiumHeroButton href="/contact">
                Ask a Question
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

      {/* WHAT THIS SERVICE COVERS */}
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
              What This Service Covers
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {whatItCovers.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-700">
                    <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* WHO THIS IS FOR */}
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
              Who This Is For
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {whoIsFor.map((item, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <div className="h-full jj-card-inner text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-black flex items-center justify-center">
                      <item.icon className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="font-semibold text-black mb-2">{item.title}</h3>
                    <p className="text-sm text-zinc-600">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
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

      {/* DELIVERABLES */}
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
              Deliverables
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliverables.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-700">
                    <CheckCircle2 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* TIMELINE */}
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
              Timeline
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <div className="flex items-center justify-center gap-4">
                <Clock className="w-8 h-8 text-gold" />
                <p className="text-zinc-700">
                  Standard turnaround: inspection + report delivery timeline displayed after booking based on unit size and access.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* REQUIREMENTS */}
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
              Requirements
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {requirements.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-700">
                    <FileText className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
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
              Book Your Snagging Request
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              Get a comprehensive inspection before accepting handover.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact?service=snagging">
                  Start Snagging Request
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

      <DirectContactCTA />
      <Footer />
    </>
  );
};

export default Snagging;
