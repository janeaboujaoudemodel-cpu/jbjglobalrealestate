import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Home,
  Sparkles,
  FileText,
  CheckCircle2,
  HelpCircle,
  Phone,
  Key,
  Package,
  Shield,
  MessageSquare,
  ClipboardList,
  BarChart3,
  Settings,
  Play,
  ArrowRight,
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

const eligibilityChecklist = [
  { text: "Unit condition and safety readiness", icon: Shield },
  { text: "Furnishing and inventory checklist (if furnished)", icon: Package },
  { text: "Access and key management feasibility", icon: Key },
  { text: "Building rules and any platform requirements (as applicable)", icon: FileText },
];

const setupWorkflow = [
  { step: 1, title: "Intake", description: "Unit details, goals, and preferred operating rules", icon: ClipboardList },
  { step: 2, title: "Readiness Plan", description: "Checklist for cleaning, repairs, inventory, photos", icon: Sparkles },
  { step: 3, title: "Listing Readiness", description: "Description structure, photo plan, house rules", icon: FileText },
  { step: 4, title: "Operating Process", description: "Guest messaging flow + cleaning turnover plan", icon: MessageSquare },
  { step: 5, title: "Performance Snapshot", description: "Occupancy & operational insights (as applicable)", icon: BarChart3 },
];

const deliverables = [
  "Standardized readiness checklist",
  "Guest-ready rules and operating flow",
  "Issue tracking log (repairs, damages, replacements)",
  "Owner snapshot reporting cadence",
];

const ownerControls = [
  { title: "Approval rules", description: "Repairs, replacements, vendor changes", icon: Settings },
  { title: "Booking preferences", description: "Minimum stays, blackout dates", icon: Calendar },
  { title: "Guest policies", description: "Check-in rules, noise policy, inventory handling", icon: Shield },
];

const faqData = [
  {
    question: "Is short-term rental more profitable than long-term?",
    answer: "It can be, but it depends on seasonality, operations, pricing strategy, and occupancy.",
  },
  {
    question: "Do you guarantee occupancy?",
    answer: "No. Performance depends on market demand, price positioning, and unit readiness.",
  },
  {
    question: "Can a unit be short-term if it's unfurnished?",
    answer: "Typically short stays require furnishing, but eligibility depends on your intended strategy.",
  },
  {
    question: "Who handles cleaning and turnover?",
    answer: "Turnover is coordinated through structured scheduling with providers.",
  },
  {
    question: "Do you handle guest disputes?",
    answer: "We support routing and process structure. Specific outcomes depend on platform rules and evidence.",
  },
  {
    question: "How do I track what's happening?",
    answer: "Through snapshot reporting and issue logs.",
  },
  {
    question: "Can I block dates for personal use?",
    answer: "Yes—based on operating rules.",
  },
  {
    question: "Do you manage keys?",
    answer: "Key/access approach depends on the building and operating plan.",
  },
  {
    question: "Is this the same as property management?",
    answer: "Short-term operations are distinct and require a dedicated workflow.",
  },
  {
    question: "Can you set it up quickly?",
    answer: "Timeline depends on unit readiness, access, and required preparation.",
  },
];

const ShortTermRentals = () => {
  return (
    <>
      <SEOHead
        title="Short-Term Rentals & Holiday Homes | JBJ Global Real Estate"
        description="A structured setup and operating workflow to prepare your unit for short stays, guest turnover, and performance visibility—without chaos."
        canonicalPath="/services/short-term-rentals"
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
              <Home className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Short-Term Rentals & Holiday Homes
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              A structured setup and operating workflow to prepare your unit for short stays, guest turnover, and performance visibility—without chaos.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=short-term-rentals">
                Request Short-Term Setup
              </PremiumHeroButton>
              <PremiumHeroButton href="/contact?inquiry=eligibility">
                Check Eligibility
              </PremiumHeroButton>
            </div>

            {/* Video Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-12 max-w-xl mx-auto"
            >
              <div className="relative rounded-2xl overflow-hidden border border-gold/30 bg-black/50 backdrop-blur-sm aspect-video">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4 border border-gold/40">
                    <Play className="w-6 h-6 text-gold ml-1" />
                  </div>
                  <p className="text-gold text-sm font-medium">From Unit Ready to Guest Ready</p>
                  <p className="text-zinc-500 text-xs mt-1">Video Coming Soon</p>
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
            <motion.div variants={fadeInUp} className="jj-card-inner text-center">
              <p className="text-zinc-700 text-lg leading-relaxed">
                Short-term rentals require tighter operations than long leases. This service is built around readiness, guest experience, turnover coordination, and reporting visibility.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ELIGIBILITY & READINESS CHECKLIST */}
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
              className="text-3xl md:text-4xl font-bold text-black text-center mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Eligibility & Readiness Checklist
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 text-center mb-8 max-w-2xl mx-auto">
              We confirm readiness based on practical requirements such as:
            </motion.p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eligibilityChecklist.map((item, idx) => (
                <motion.div key={idx} variants={fadeInUp} className="jj-card-inner">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-gold" />
                    </div>
                    <span className="text-zinc-700">{item.text}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SETUP WORKFLOW */}
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
              Setup Workflow
            </motion.h2>
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-gold/30 hidden md:block" />
                <div className="space-y-6">
                  {setupWorkflow.map((step, index) => (
                    <motion.div
                      key={index}
                      variants={fadeInUp}
                      className="flex items-start gap-6"
                    >
                      <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center shrink-0 z-10 border-2 border-gold">
                        <span className="text-gold font-bold">{step.step}</span>
                      </div>
                      <div className="flex-1 jj-card-inner !p-5">
                        <div className="flex items-start gap-4">
                          <step.icon className="w-6 h-6 text-gold shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-black mb-1">{step.title}</h3>
                            <p className="text-sm text-zinc-600">{step.description}</p>
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

      {/* COMMON OWNER CONTROLS */}
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
              Common Owner Controls
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {ownerControls.map((item, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <div className="h-full jj-card-inner text-center">
                    <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center mx-auto mb-4">
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
              Turn your unit into a guest-ready asset
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              Submit your unit details and operating preferences to start eligibility review.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact?service=short-term-rentals">
                  Request Short-Term Setup
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

export default ShortTermRentals;
