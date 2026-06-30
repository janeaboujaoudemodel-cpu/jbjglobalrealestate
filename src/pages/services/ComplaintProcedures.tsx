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
  ArrowRight,
  Send,
  Eye,
  Lightbulb,
  FileCheck,
  ArrowUpCircle,
  XCircle,
  Upload,
  Users,
  Ticket,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
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

const workflowSteps = [
  { 
    step: 1, 
    title: "Submission", 
    description: "You submit the complaint with details and evidence",
    icon: Send 
  },
  { 
    step: 2, 
    title: "Acknowledgment", 
    description: "You receive a ticket ID and timeline expectations",
    icon: FileText 
  },
  { 
    step: 3, 
    title: "Review", 
    description: "The relevant department reviews facts and communication logs",
    icon: Eye 
  },
  { 
    step: 4, 
    title: "Resolution Proposal", 
    description: "Action plan or explanation with next steps",
    icon: Lightbulb 
  },
  { 
    step: 5, 
    title: "Escalation (if required)", 
    description: "Higher review tier if unresolved",
    icon: ArrowUpCircle 
  },
  { 
    step: 6, 
    title: "Closure", 
    description: "Final outcome documented",
    icon: FileCheck 
  },
];

const whatYouReceive = [
  { icon: Ticket, text: "Ticket ID for tracking" },
  { icon: MessageSquare, text: "Clear status updates" },
  { icon: FileCheck, text: "A documented resolution outcome" },
  { icon: ArrowUpCircle, text: "Escalation option if you disagree with the outcome" },
];

const goodComplaintFormat = [
  "What happened (timeline)",
  "Who was involved (names if known)",
  "What you expected vs what occurred",
  "Evidence: screenshots, emails, documents",
  "What resolution you seek",
];

const faqData = [
  {
    question: "How long does complaint review take?",
    answer: "Depends on complexity and evidence. You will see status updates in your ticket.",
  },
  {
    question: "Can I submit anonymously?",
    answer: "For process integrity, contact details are typically required to proceed meaningfully.",
  },
  {
    question: "Can I escalate if I'm not satisfied?",
    answer: "Yes. The workflow includes escalation tiers.",
  },
  {
    question: "Will I receive written confirmation?",
    answer: "Yes—outcomes are documented.",
  },
  {
    question: "Will submitting a complaint affect my service?",
    answer: "No—complaints are handled as formal quality control inputs.",
  },
  {
    question: "What if my complaint involves a third-party partner?",
    answer: "We will document and route properly. Third-party outcomes depend on their own processes.",
  },
  {
    question: "Can I attach files?",
    answer: "Yes—submit evidence to support clarity.",
  },
  {
    question: "Can I track my complaint?",
    answer: "Yes—use your ticket ID.",
  },
];

const ComplaintProcedures = () => {
  return (
    <div data-marketing-page>
      <SEOHead
        title="Complaint Procedures | JBJ Global Real Estate"
        description="A structured pathway to raise concerns, track outcomes, and escalate responsibly—without noise or confusion."
        canonicalPath="/services/complaint-procedures"
      />

      {/* HERO SECTION */}
      <section className="jj-hero-fullscreen jj-hero-compact relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#1A1A1A]">
          {/* Video placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#EFE6D6]/20 border border-[#B89555]/40 flex items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-[#1A1A1A]/70" />
              </div>
              <p className="text-[#1A1A1A]/70 text-sm tracking-widest uppercase">How Complaints Are Handled</p>
              <p className="text-white/90 text-xs mt-2">Video placeholder only</p>
            </div>
          </div>
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
                        <SectionEyebrow icon={AlertTriangle} className="mb-6">Services</SectionEyebrow>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Complaint Procedures
            </h1>
            
            <p className="text-white/85 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              A structured pathway to raise concerns, track outcomes, and escalate responsibly—without noise or confusion.
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
          <span className="text-[#1A1A1A]/70 text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
        </motion.div>
      </section>

      {/* WHAT QUALIFIES AS A COMPLAINT */}
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
              What Qualifies as a Complaint
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <p className="text-[#1A1A1A]/70 leading-relaxed">
                A complaint is any formal issue related to service quality, communication breakdown, process deviation, or misconduct concerns that requires structured review and resolution.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* THE COMPLAINT WORKFLOW */}
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
              The Complaint Workflow
            </motion.h2>
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Vertical line connector */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-[#EFE6D6]/30 hidden md:block" />
                <div className="space-y-6">
                  {workflowSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      variants={fadeInUp}
                      className="flex items-start gap-6"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0 z-10 border-2 border-[#B89555]">
                        <span className="text-[#1A1A1A] font-bold">{step.step}</span>
                      </div>
                      <div className="flex-1 jj-card-inner !p-4">
                        <div className="flex items-start gap-4">
                          <step.icon className="w-6 h-6 text-[#1A1A1A] shrink-0 mt-1" />
                          <div>
                            <h3 className="font-semibold text-[#1A1A1A]">{step.title}</h3>
                            <p className="text-sm text-[#1A1A1A]/70 mt-1">{step.description}</p>
                          </div>
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

      {/* WHAT YOU RECEIVE */}
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
              What You Receive
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {whatYouReceive.map((item, index) => (
                  <div key={index} className="jj-card-inner flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#1A1A1A] flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-[#1A1A1A]" />
                    </div>
                    <span className="text-[#1A1A1A]/70">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* HOW TO SUBMIT */}
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
              How to Submit
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 text-center mb-8">
              Good Complaint Format
            </motion.p>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <p className="text-[#1A1A1A]/70 mb-6 font-medium">Include:</p>
              <ul className="space-y-4">
                {goodComplaintFormat.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[#1A1A1A]/70">
                    <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
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
                    className="border-2 border-[#B89555]/30 rounded-lg bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] overflow-hidden"
                  >
                    <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-[#EFE6D6]/10">
                      <span className="text-[#1A1A1A] font-medium">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-[#1A1A1A]/70">
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
            variants={fadeInUp}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="jj-card-inner border-2 border-[#B89555]/30">
              <AlertTriangle className="w-12 h-12 text-[#1A1A1A] mx-auto mb-6" />
              <h2
                className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Submit a Complaint with Clarity
              </h2>
              <p className="text-[#1A1A1A]/70 mb-8 max-w-xl mx-auto">
                Use the form to log the issue and receive a trackable ticket ID.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PremiumHeroButton href="/contact?type=complaint">
                  Submit a Complaint
                </PremiumHeroButton>
                <PremiumHeroButton href="/contact?type=support">
                  Create Support Ticket
                </PremiumHeroButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ComplaintProcedures;
