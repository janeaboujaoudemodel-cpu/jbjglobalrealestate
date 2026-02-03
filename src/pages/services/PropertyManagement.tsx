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

const scopeOfSupport = [
  { icon: Users, title: "Tenant Coordination", description: "Communication and relationship management" },
  { icon: Wrench, title: "Maintenance Coordination", description: "Repair requests and vendor management" },
  { icon: Calendar, title: "Payment/Renewal Reminders", description: "Timely notifications and follow-ups" },
  { icon: ClipboardList, title: "Move-in / Move-out Checklists", description: "Structured handover process" },
  { icon: FileText, title: "Issue Logging and Tracking", description: "Resolution monitoring and reporting" },
];

const ownerReporting = [
  "Monthly snapshot (occupancy, issues, actions)",
  "Maintenance log history",
  "Tenant communication log",
];

const onboardingSteps = [
  { step: 1, title: "Asset onboarding (unit + documents)", icon: Home },
  { step: 2, title: "Condition baseline + checklist", icon: ClipboardList },
  { step: 3, title: "Tenant coordination rules + approvals", icon: Users },
  { step: 4, title: "Launch management workflow", icon: BarChart3 },
];

const requiredDocuments = [
  "Title deed (or ownership proof)",
  "Existing tenancy contract (if applicable)",
  "DEWA / building access info (if applicable)",
];

const faqData = [
  {
    question: "What does property management include?",
    answer: "Our property management service includes tenant coordination, maintenance management, payment reminders, move-in/move-out checklists, and comprehensive reporting.",
  },
  {
    question: "Do you handle tenant finding?",
    answer: "Tenant sourcing is handled through our Rental Advisory service. Property management begins once a tenant is in place.",
  },
  {
    question: "How often do I receive reports?",
    answer: "Monthly snapshots are provided covering occupancy status, maintenance issues, actions taken, and tenant communications.",
  },
  {
    question: "Can I approve maintenance expenses?",
    answer: "Yes, you set approval thresholds and receive notifications for expenses above your specified limit.",
  },
  {
    question: "Do you handle rent collection?",
    answer: "We send payment reminders and track payment status. Direct rent collection depends on your preferred arrangement.",
  },
  {
    question: "What if I have multiple properties?",
    answer: "We can manage multiple units under a single management agreement with consolidated reporting.",
  },
  {
    question: "How do you handle emergency repairs?",
    answer: "Emergency protocols are established during onboarding, including vendor contacts and approval processes for urgent situations.",
  },
  {
    question: "Is this service available for commercial properties?",
    answer: "Currently, our property management service focuses on residential properties in Dubai.",
  },
];

const PropertyManagement = () => {
  return (
    <>
      <SEOHead
        title="Property Management Services | JBJ Global Real Estate"
        description="Professional property management in Dubai. Tenant coordination, maintenance management, and structured reporting for property owners."
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
              Operational support to protect your asset, reduce tenant friction, and keep occupancy stable — with structured reporting.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=property-management">
                Request Property Management
              </PremiumHeroButton>
              <PremiumHeroButton href="/contact">
                Speak to a Manager
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

      {/* SCOPE OF SUPPORT */}
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
              Scope of Support
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {scopeOfSupport.map((item, index) => (
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
              <div className="flex items-center gap-4 mb-6">
                <BarChart3 className="w-8 h-8 text-gold" />
                <h3 className="text-xl font-semibold text-black">Owner Reporting</h3>
              </div>
              <ul className="space-y-4">
                {ownerReporting.map((item, idx) => (
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

      {/* ONBOARDING PROCESS */}
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
              Onboarding Process
            </motion.h2>
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gold/30 hidden md:block" />
                <div className="space-y-6">
                  {onboardingSteps.map((step, index) => (
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
              Required Documents
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
              Start Property Management
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              Protect your investment with professional property management.
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

      {/* COMPLIANCE DISCLAIMER */}
      <section className="bg-black py-8 border-t border-zinc-800">
        <div className="container mx-auto px-4 text-center">
          <p className="text-zinc-500 text-sm max-w-3xl mx-auto">
            Property management services are coordinated through JBJ Global Real Estate. 
            Where specialist services are required, introductions to independent licensed partners may be provided.
          </p>
        </div>
      </section>

      <DirectContactCTA />
      <Footer />
    </>
  );
};

export default PropertyManagement;
