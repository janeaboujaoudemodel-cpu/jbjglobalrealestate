import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Wrench,
  FileText,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Phone,
  Clock,
  ClipboardList,
  Home,
  Key,
  Shield,
  Calendar,
  BarChart3,
  MessageSquare,
  RefreshCw,
  Settings,
  Play,
  AlertCircle,
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

const managementCoverage = [
  { 
    icon: MessageSquare, 
    title: "Tenant Communication Routing", 
    description: "Issues, requests, scheduling" 
  },
  { 
    icon: Wrench, 
    title: "Maintenance Coordination", 
    description: "Approved providers, appointment scheduling, follow-ups" 
  },
  { 
    icon: RefreshCw, 
    title: "Renewal Process Coordination", 
    description: "Timelines, documentation, reminders" 
  },
  { 
    icon: ClipboardList, 
    title: "Move-in / Move-out Checklists", 
    description: "Condition baseline + evidence" 
  },
  { 
    icon: Home, 
    title: "Property Readiness Planning", 
    description: "Minor fixes, cleaning coordination, compliance reminders" 
  },
];

const ownerControls = [
  "What requires your approval (major repairs, replacements, vendor changes)",
  "What can be actioned within a threshold you define",
  "How you want updates (weekly summary, monthly snapshot, urgent alerts)",
];

const ownerReporting = [
  { title: "Monthly Asset Snapshot", description: "Occupancy status, issues opened/closed, key actions" },
  { title: "Maintenance Log", description: "Dates, issue types, status updates, vendor notes" },
  { title: "Tenant Interaction Log", description: "Summarized communications and outcomes" },
  { title: "Renewal/Notice Timeline", description: "Key dates and reminders" },
];

const processSteps = [
  { step: 1, title: "Onboarding", description: "Unit details, documents, access rules, approval rules", icon: Home },
  { step: 2, title: "Baseline Condition", description: "Structured checklist and photo baseline (where possible)", icon: ClipboardList },
  { step: 3, title: "Operating Workflow", description: "Tenant routing + maintenance coordination process", icon: Settings },
  { step: 4, title: "Reporting", description: "Monthly snapshot + urgent alerts when needed", icon: BarChart3 },
];

const requiredDocuments = [
  "Ownership proof (e.g., title deed or equivalent)",
  "Existing tenancy contract (if currently leased)",
  "Building access & parking info (as applicable)",
  "DEWA / utility status (as applicable)",
];

const faqData = [
  {
    question: "Do you collect rent on my behalf?",
    answer: "Depending on structure and approvals, management can coordinate payment reminders and documentation. Collection and regulated activities follow applicable rules and agreed scope.",
  },
  {
    question: "Do I lose control of decisions?",
    answer: "No. You set approval rules. Major decisions remain yours.",
  },
  {
    question: "Can you manage vacant units?",
    answer: "Yes—readiness coordination, repairs, and preparation for marketing can be included.",
  },
  {
    question: "Do you do maintenance yourself?",
    answer: "We coordinate with suitable providers. Work is performed by qualified vendors.",
  },
  {
    question: "How do you handle urgent issues?",
    answer: "Urgent issues are escalated with priority communication and clear options.",
  },
  {
    question: "Can I see what was done each month?",
    answer: "Yes—monthly snapshot + logs.",
  },
  {
    question: "Can I stop the service anytime?",
    answer: "Offboarding terms are defined in the service agreement.",
  },
  {
    question: "Can you help with tenant screening?",
    answer: "Tenant screening is typically handled under leasing/rental advisory workflows.",
  },
  {
    question: "Is this the same as brokerage services?",
    answer: "No. Management is an operational service separate from brokerage transactions.",
  },
  {
    question: "Do you handle short-term rentals here?",
    answer: "Short-term rentals are handled under the dedicated short-term service page.",
  },
];

const PropertyManagement = () => {
  return (
    <>
      <SEOHead
        title="Property Management Services | JBJ Global Real Estate"
        description="Operational support for owners who want cleaner tenant experience, reduced friction, and structured oversight—without losing control of approvals."
        canonicalPath="/services/property-management"
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
              <Building2 className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Property Management
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Operational support for owners who want cleaner tenant experience, reduced friction, and structured oversight—without losing control of approvals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <PremiumHeroButton href="/contact?service=property-management">
                Request Property Management
              </PremiumHeroButton>
              <PremiumHeroButton href="/contact">
                Speak to a Manager
              </PremiumHeroButton>
            </div>

            {/* Hero Video Placeholder */}
            <div className="max-w-xl mx-auto">
              <div className="relative rounded-xl overflow-hidden border border-gold/30 bg-black/50 backdrop-blur-sm">
                <div className="aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gold/20 flex items-center justify-center">
                      <Play className="w-8 h-8 text-gold" />
                    </div>
                    <p className="text-gold text-sm font-medium">How We Protect Your Asset Daily</p>
                    <p className="text-zinc-500 text-xs mt-1">Video Coming Soon</p>
                  </div>
                </div>
              </div>
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

      {/* WHAT PROPERTY MANAGEMENT MEANS */}
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
              What Property Management Means at JBJ
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <p className="text-zinc-700 leading-relaxed text-center">
                Property management is a structured workflow that helps you protect your asset and reduce tenant friction through coordination, issue logging, and owner reporting. You keep decision control via approval rules (what needs owner approval vs. auto-approved).
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* MANAGEMENT COVERAGE */}
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
              Management Coverage
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {managementCoverage.map((item, index) => (
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

      {/* OWNER CONTROLS */}
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
              Owner Controls (Premium Standard)
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-center text-zinc-600 mb-6">
              You choose the rules:
            </motion.p>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {ownerControls.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-700">
                    <Shield className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
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
            <motion.p variants={fadeInUp} className="text-center text-zinc-600 mb-6">
              Owner reporting package:
            </motion.p>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <div className="space-y-6">
                {ownerReporting.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-black">{item.title}</h4>
                      <p className="text-sm text-zinc-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
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
                      className="flex items-start gap-6"
                    >
                      <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shrink-0 z-10 border-2 border-gold">
                        <span className="text-gold font-bold">{step.step}</span>
                      </div>
                      <div className="flex-1 jj-card-inner !p-4">
                        <div className="flex items-center gap-4 mb-1">
                          <step.icon className="w-5 h-5 text-gold shrink-0" />
                          <span className="font-semibold text-black">{step.title}</span>
                        </div>
                        <p className="text-sm text-zinc-600 ml-9">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* REQUIRED DOCUMENTS */}
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
              Required Documents (Typical)
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {requiredDocuments.map((item, idx) => (
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
              Build a Stable, Low-Friction Ownership Experience
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              Request management onboarding and define your approval rules.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact?service=property-management">
                  Request Property Management
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

export default PropertyManagement;
