import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building,
  FileText,
  CheckCircle2,
  HelpCircle,
  Phone,
  Users,
  ClipboardList,
  Send,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import VideoBackground from "@/components/VideoBackground";
import companySetupVideo from "@/assets/videos/dubai-landmarks-hero.mp4";
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

const whatWeProvide = [
  { icon: ClipboardList, text: "Intake form to understand intended setup purpose" },
  { icon: FileText, text: "Document checklist preparation and readiness guidance" },
  { icon: Users, text: "Introduction to licensed providers where required" },
  { icon: CheckCircle2, text: "Coordination of progress checkpoints and reminders" },
];

const processSteps = [
  { step: 1, title: "Intake (purpose, jurisdiction preference, timeline)", icon: ClipboardList },
  { step: 2, title: "Document checklist (based on provider requirements)", icon: FileText },
  { step: 3, title: "Partner introduction (licensed setup specialists)", icon: Users },
  { step: 4, title: "Submission & progress updates", icon: Send },
  { step: 5, title: "Completion and record filing confirmation", icon: CheckCircle2 },
];

const typicalDocuments = [
  "Passport / Emirates ID (as applicable)",
  "Proof of address (as applicable)",
  "Proposed company activity summary",
  "Shareholder details (as applicable)",
];

const faqData = [
  {
    question: "Do you provide legal services?",
    answer: "No. Legal work is performed by licensed providers. We coordinate introductions.",
  },
  {
    question: "Can you recommend a specific structure?",
    answer: "We coordinate the process; final structure decisions are handled by licensed professionals.",
  },
  {
    question: "How long does setup take?",
    answer: "Depends on authority processes, documentation, and provider timeline.",
  },
  {
    question: "Do you handle banking?",
    answer: "No. Banking is handled directly with banks and licensed advisors.",
  },
  {
    question: "Can overseas investors apply?",
    answer: "Yes, subject to requirements and documentation.",
  },
  {
    question: "Is this required to buy property?",
    answer: "Not necessarily. It depends on your strategy.",
  },
  {
    question: "Can I track progress?",
    answer: "Yes—through status checkpoints.",
  },
  {
    question: "Can you bundle this with other services?",
    answer: "Yes—company setup can be structured alongside property services.",
  },
];

const CompanySetup = () => {
  return (
    <>
      <SEOHead
        title="Company Setup Support | JBJ Global Real Estate"
        description="Structured coordination for company setup through licensed specialists—clear steps, document readiness, and progress tracking."
        canonicalPath="/services/company-setup"
      />

      {/* HERO SECTION */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        <VideoBackground
          src={companySetupVideo}
          poster="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
        
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
              Structured coordination for company setup through licensed specialists—clear steps, document readiness, and progress tracking.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=company-setup">
                Request Company Setup
              </PremiumHeroButton>
              <PremiumHeroButton href="/contact?service=company-setup&type=partner">
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

      {/* WHY THIS MATTERS FOR INVESTORS */}
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
              Why This Matters for Investors
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <p className="text-zinc-700 text-lg leading-relaxed">
                Some investors structure ownership, operations, or tenancy through corporate entities. This page provides a clean pathway to get set up correctly with licensed professionals.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* WHAT WE PROVIDE */}
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
              What We Provide
            </motion.h2>
            <div className="max-w-3xl mx-auto">
              <motion.div variants={fadeInUp} className="jj-card-inner">
                <ul className="space-y-4">
                  {whatWeProvide.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-4 text-zinc-700">
                      <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-gold" />
                      </div>
                      <span className="pt-2">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TYPICAL STEPS */}
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
              Typical Steps
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
              Typical Documents (May Vary)
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {typicalDocuments.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-700">
                    <FolderOpen className="w-5 h-5 text-gold shrink-0 mt-0.5" />
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
              Start company setup with a clear workflow
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              Submit your intent and timeline to receive a structured checklist and next steps.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact?service=company-setup">
                  Request Company Setup
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
    </>
  );
};

export default CompanySetup;
