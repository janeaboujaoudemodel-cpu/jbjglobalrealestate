import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  HelpCircle,
  Phone,
  Calendar,
  Users,
  FileText,
  Bell,
  Zap,
  ArrowRight,
  Play,
  ClipboardList,
  Send,
  Eye,
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

const exampleRequests = [
  { icon: Calendar, text: "Schedule viewings efficiently (multiple properties, optimized timing)" },
  { icon: FileText, text: "Coordinate documentation collection and submission readiness" },
  { icon: Users, text: "Arrange trusted service provider introductions (as applicable)" },
  { icon: Bell, text: "Manage appointment reminders and follow-up checkpoints" },
  { icon: Zap, text: "Support post-purchase coordination requests (utilities guidance, access timing)" },
];

const processSteps = [
  { step: 1, title: "Submit your request with desired timeline", icon: Send },
  { step: 2, title: "Confirm scope and required inputs", icon: ClipboardList },
  { step: 3, title: "Execute coordination and track progress", icon: Eye },
  { step: 4, title: "Share results and next actions clearly", icon: CheckCircle2 },
];

const serviceStandards = [
  "Clear checkpoint updates",
  "One request = one tracked workflow",
  "Priority handling for time-sensitive requests (where feasible)",
];

const faqData = [
  {
    question: "Is concierge free?",
    answer: "Concierge support is scoped and delivered based on the request type.",
  },
  {
    question: "Do you provide personal errands?",
    answer: "Only requests related to the property journey and approved concierge scope.",
  },
  {
    question: "Can you coordinate with third-party providers?",
    answer: "Yes, where appropriate, via introductions and scheduling.",
  },
  {
    question: "How fast do you respond?",
    answer: "Response cadence depends on request volume and priority.",
  },
  {
    question: "Can I use concierge if I'm not a client yet?",
    answer: "Yes, for qualified requests.",
  },
  {
    question: "Do you guarantee outcomes?",
    answer: "No. We guarantee structured coordination and clear progress reporting.",
  },
  {
    question: "Can I bundle multiple requests?",
    answer: "Yes. We can structure them as a planned workflow.",
  },
  {
    question: "How do I submit?",
    answer: "Use the concierge request form and select priority.",
  },
];

const Concierge = () => {
  return (
    <div data-brand-emerald-page data-marketing-page style={{ background: "#010806" }}>
      <SEOHead
        title="Concierge Convenience Services | JBJ Global Real Estate"
        description="Time-saving operational support around your property journey—appointments, coordination, and structured follow-through."
        canonicalPath="/services/concierge"
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
                        <SectionEyebrow icon={Sparkles} className="mb-6">Services</SectionEyebrow>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Concierge Convenience Services
            </h1>
            
            <p className="text-white/85 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Time-saving operational support around your property journey—appointments, coordination, and structured follow-through.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=concierge">
                Request Concierge Support
              </PremiumHeroButton>
              <PremiumHeroButton href="#example-requests">
                Browse Services
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
                  <p className="text-[#1A1A1A] text-sm font-medium">A Premium Support Layer for Busy Clients</p>
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

      {/* WHAT CONCIERGE MEANS HERE */}
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
              What Concierge Means Here
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner text-center">
              <p className="text-[#1A1A1A]/70 text-lg leading-relaxed">
                Concierge support is designed for clients who want smoother execution—less chasing, more structure, and clearer outcomes.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* EXAMPLES OF CONCIERGE REQUESTS */}
      <section id="example-requests" className="bg-[#1A1A1A] py-20">
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
              Examples of Concierge Requests
            </motion.h2>
            <div className="space-y-4">
              {exampleRequests.map((item, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <div className="jj-card-inner">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-[#1A1A1A]" />
                      </div>
                      <span className="text-[#1A1A1A]/70 pt-2">{item.text}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW REQUESTS ARE HANDLED */}
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
              How Requests Are Handled
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

      {/* SERVICE STANDARDS */}
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
              Service Standards
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {serviceStandards.map((item, idx) => (
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
              Let us handle the coordination
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 mb-8">
              Submit one request and we'll structure the execution plan.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact?service=concierge">
                  Request Concierge Support
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

export default Concierge;
