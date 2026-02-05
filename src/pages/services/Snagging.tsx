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
  Paintbrush,
  DoorOpen,
  Droplets,
  Zap,
  Wind,
  Square,
  Shield,
  Calendar,
  Play,
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

const inspectionAreas = [
  {
    icon: Paintbrush,
    title: "Finishes & Workmanship",
    items: "Paint, tiles, flooring alignment, gaps, cracks, sealants",
  },
  {
    icon: DoorOpen,
    title: "Doors & Joinery",
    items: "Hinges, locks, alignment, cabinetry fit, soft-close, scratches",
  },
  {
    icon: Droplets,
    title: "Bathrooms & Kitchens",
    items: "Leaks, water pressure, drains, grouting, fittings stability",
  },
  {
    icon: Zap,
    title: "Electrical",
    items: "Switches, sockets, distribution labeling, basic functionality checks",
  },
  {
    icon: Wind,
    title: "HVAC/AC Performance",
    items: "Visible issues, thermostat response (non-invasive)",
  },
  {
    icon: Square,
    title: "Windows & Balconies",
    items: "Sealing, alignment, opening/closing, water ingress indicators",
  },
  {
    icon: Shield,
    title: "Safety/Functional Basics",
    items: "Visible hazards, loose items, sharp edges, missing covers",
  },
];

const deliverables = [
  "Snagging Report (structured by room/zone + issue category)",
  "Photo evidence for each snag item",
  "Priority tags: Critical / Major / Minor / Cosmetic",
  "Closure checklist you can use with developer follow-up",
  "Summary page: top issues + recommended closure order",
];

const processSteps = [
  { step: 1, title: "Request Intake", description: "You submit unit details and handover timeline", icon: Send },
  { step: 2, title: "Schedule", description: "We confirm access and inspection window", icon: Calendar },
  { step: 3, title: "Inspection", description: "On-site snagging with documentation", icon: Camera },
  { step: 4, title: "Report Delivery", description: "Report is delivered in a clear, developer-ready format", icon: FileText },
  { step: 5, title: "Follow-Up Option", description: "If requested, a re-inspection can verify closure items", icon: ClipboardCheck },
];

const readinessChecklist = [
  "Access confirmation (time, location, unit number)",
  "Any handover documents provided by developer (if available)",
  "Floor plan or unit layout (if available)",
  "Utilities status (if the unit allows functional checks)",
];

const faqData = [
  {
    question: "Is snagging required in Dubai?",
    answer: "Not mandatory, but it's a best-practice step to protect your handover and reduce disputes about defects.",
  },
  {
    question: "Do you coordinate with the developer?",
    answer: "We can format the report to be developer-ready and help you maintain a closure checklist. Developer communication channels differ by project.",
  },
  {
    question: "Do you fix the issues?",
    answer: "Snagging identifies and documents issues. Repairs are performed by the developer or licensed contractors.",
  },
  {
    question: "Can snagging be done for ready properties?",
    answer: "Yes. It's especially useful before moving in or renting out to reduce tenant complaints later.",
  },
  {
    question: "What if I can't attend the inspection?",
    answer: "We can proceed if access is granted and you confirm permission.",
  },
  {
    question: "How long does it take?",
    answer: "Depends on unit size and access. The booking confirmation will show the estimated inspection duration.",
  },
  {
    question: "Do you check AC properly?",
    answer: "We do visible and basic functional checks when possible. Specialized diagnostics require an HVAC specialist.",
  },
  {
    question: "Will snagging delay handover?",
    answer: "It shouldn't. It supports faster closure when issues are prioritized clearly.",
  },
  {
    question: "Do you provide a re-inspection?",
    answer: "Yes, as an optional follow-up service to verify closure.",
  },
  {
    question: "Is this included in brokerage services?",
    answer: "Snagging is a dedicated service with its own process and booking.",
  },
];

const Snagging = () => {
  return (
    <>
      <SEOHead
        title="Snagging & Handover Inspection | JBJ Global Real Estate"
        description="Protect your handover with a structured inspection that documents defects clearly, prioritizes risks, and supports an efficient closure process with the developer."
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
              Protect your handover with a structured inspection that documents defects clearly, prioritizes risks, and supports an efficient closure process with the developer.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <PremiumHeroButton href="/contact?service=snagging">
                Book Snagging Request
              </PremiumHeroButton>
              <PremiumHeroButton href="/contact">
                Ask a Question
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
                    <p className="text-gold text-sm font-medium">How Snagging Protects Your Investment</p>
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

      {/* WHAT THIS SERVICE IS */}
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
              What This Service Is
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <p className="text-zinc-700 leading-relaxed text-center">
                Snagging is a professional inspection conducted before (or during) handover to identify workmanship defects, incomplete items, and functional issues. The outcome is a structured report designed to help you communicate clearly with the developer and track closure.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* WHAT WE INSPECT */}
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
              What We Inspect
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {inspectionAreas.map((area, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <div className="h-full jj-card-inner">
                    <div className="w-12 h-12 mb-4 rounded-xl bg-black flex items-center justify-center">
                      <area.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="font-semibold text-black mb-2">{area.title}</h3>
                    <p className="text-sm text-zinc-600">{area.items}</p>
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

      {/* WHEN TO BOOK */}
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
              When to Book
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <div className="space-y-4 text-zinc-700">
                <p>
                  <strong className="text-black">Best timing:</strong> Immediately when you receive handover notice or access confirmation.
                </p>
                <p>
                  If handover is already completed, snagging can still be used to document issues for structured follow-up.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* OWNER READINESS CHECKLIST */}
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
              Owner Readiness Checklist
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-center text-zinc-600 mb-6">
              Before we arrive, prepare:
            </motion.p>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {readinessChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-700">
                    <ClipboardList className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SERVICE BOUNDARIES */}
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
              Service Boundaries
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner border-l-4 border-l-gold">
              <p className="text-zinc-700 leading-relaxed">
                This service focuses on inspection and documentation. Any repairs, remedial works, or technical testing beyond visible/functional checks are handled by the developer/contractors or specialized providers.
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
              Book Your Snagging Request
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              Submit your unit details and preferred timeline. We'll confirm the schedule and inspection plan.
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
    </>
  );
};

export default Snagging;
