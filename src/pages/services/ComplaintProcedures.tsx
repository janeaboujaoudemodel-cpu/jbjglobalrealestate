import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  FileText,
  CheckCircle2,
  HelpCircle,
  Phone,
  Clock,
  Shield,
  MessageSquare,
  ArrowUp,
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

const whatQualifies = [
  "Service quality issues not resolved through standard support",
  "Miscommunication or misinformation from JBJ representatives",
  "Transaction process concerns requiring investigation",
  "Professional conduct matters",
  "Data privacy concerns",
  "Billing or fee disputes",
];

const processSteps = [
  { step: 1, title: "Submit formal complaint with details", icon: Send },
  { step: 2, title: "Receive ticket ID and acknowledgment", icon: FileText },
  { step: 3, title: "Investigation by designated team member", icon: Shield },
  { step: 4, title: "Resolution communication and closure", icon: CheckCircle2 },
];

const escalationLadder = [
  { level: 1, title: "Customer Support", description: "Initial resolution attempt", timeline: "24-48 hours" },
  { level: 2, title: "Department Manager", description: "If unresolved at Level 1", timeline: "3-5 business days" },
  { level: 3, title: "Compliance Officer", description: "Regulatory or conduct matters", timeline: "5-7 business days" },
  { level: 4, title: "Executive Review", description: "Final escalation if needed", timeline: "7-10 business days" },
];

const whatYouReceive = [
  "Unique ticket ID for tracking",
  "Acknowledgment within 24 hours",
  "Status updates at key milestones",
  "Written resolution summary",
];

const faqData = [
  {
    question: "What qualifies as a complaint vs. a support request?",
    answer: "Support requests are for general assistance, questions, or service inquiries. Complaints are for issues you feel were not adequately addressed through normal support channels or involve conduct/service quality concerns.",
  },
  {
    question: "How long does the complaint process take?",
    answer: "Simple complaints may be resolved in 24-48 hours. Complex matters requiring investigation may take 5-10 business days depending on the nature of the issue.",
  },
  {
    question: "Can I escalate if I'm not satisfied?",
    answer: "Yes. The escalation ladder provides clear pathways from support through to executive review if needed.",
  },
  {
    question: "Is my complaint confidential?",
    answer: "Yes. Complaints are handled confidentially and shared only with those necessary to investigate and resolve the matter.",
  },
  {
    question: "Can I submit a complaint anonymously?",
    answer: "Anonymous feedback can be submitted, but our ability to investigate and respond may be limited without contact details.",
  },
  {
    question: "What if my complaint involves a third party?",
    answer: "We can address JBJ-related aspects. Issues with independent partners are handled through their respective processes, though we can facilitate communication.",
  },
  {
    question: "Will filing a complaint affect my transaction?",
    answer: "No. Complaints are handled separately from ongoing transactions and will not adversely affect your service.",
  },
  {
    question: "What outcomes can I expect?",
    answer: "Outcomes vary based on the complaint type. Possible resolutions include apologies, process corrections, service credits, or referral to appropriate authorities for serious matters.",
  },
];

const ComplaintProcedures = () => {
  return (
    <>
      <SEOHead
        title="Complaint Procedures | JBJ Global Real Estate"
        description="Structured complaint handling process with clear escalation steps. Submit, track, and resolve issues with transparency and accountability."
        canonicalPath="/services/complaint-procedures"
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
              <AlertTriangle className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Complaint Procedures
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              A structured pathway to raise issues, track outcomes, and ensure accountability — with clear escalation steps.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?type=complaint">
                Submit a Complaint
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

      {/* WHAT QUALIFIES */}
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
              What Qualifies as a Complaint
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {whatQualifies.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-700">
                    <AlertTriangle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
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
              Complaint Process
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

      {/* ESCALATION LADDER */}
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
              Escalation Ladder
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {escalationLadder.map((level, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <div className="jj-card-inner text-center h-full relative">
                    {index < escalationLadder.length - 1 && (
                      <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                        <ArrowUp className="w-4 h-4 text-gold rotate-90" />
                      </div>
                    )}
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-black flex items-center justify-center border border-gold">
                      <span className="text-gold font-bold text-sm">{level.level}</span>
                    </div>
                    <h3 className="font-semibold text-black text-sm mb-1">{level.title}</h3>
                    <p className="text-xs text-zinc-600 mb-2">{level.description}</p>
                    <div className="flex items-center justify-center gap-1 text-xs text-gold">
                      <Clock className="w-3 h-3" />
                      {level.timeline}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHAT YOU RECEIVE */}
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
              What You Receive
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {whatYouReceive.map((item, idx) => (
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
              Need to File a Complaint?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              We take all complaints seriously and are committed to fair resolution.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact?type=complaint">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Submit Complaint
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

export default ComplaintProcedures;
