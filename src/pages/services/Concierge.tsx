import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  HelpCircle,
  Phone,
  Calendar,
  Truck,
  Key,
  Wrench,
  FileText,
  Home,
  Shield,
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

const exampleRequests = [
  { icon: Key, text: "Key collection and handover coordination" },
  { icon: Truck, text: "Move-in/move-out logistics support" },
  { icon: Wrench, text: "Utility connection assistance (DEWA, internet)" },
  { icon: FileText, text: "Document collection and delivery" },
  { icon: Calendar, text: "Viewing scheduling and coordination" },
  { icon: Home, text: "Property access arrangements" },
  { icon: Shield, text: "Security deposit coordination" },
  { icon: Sparkles, text: "Cleaning service scheduling" },
];

const processSteps = [
  { step: 1, title: "Submit your concierge request", icon: FileText },
  { step: 2, title: "Request review and feasibility assessment", icon: CheckCircle2 },
  { step: 3, title: "Coordination and scheduling", icon: Calendar },
  { step: 4, title: "Execution and confirmation", icon: Sparkles },
];

const slaInfo = [
  "Response within 24 business hours for standard requests",
  "Priority handling for transaction-critical items",
  "Clear communication on timing and expectations",
  "No guaranteed same-day service unless pre-arranged",
];

const faqData = [
  {
    question: "What kind of requests can you handle?",
    answer: "We handle a wide range of property-related convenience requests including key collection, utility coordination, document handling, viewing scheduling, and move-in/move-out logistics.",
  },
  {
    question: "Is there a cost for concierge services?",
    answer: "Some concierge services are included as part of our advisory packages. Additional or standalone requests may incur service fees, which are communicated upfront.",
  },
  {
    question: "How quickly can you respond to requests?",
    answer: "Standard requests receive a response within 24 business hours. Transaction-critical items are prioritized. Same-day service is not guaranteed unless pre-arranged.",
  },
  {
    question: "Can you handle requests outside Dubai?",
    answer: "Our primary service area is Dubai. For requests in other emirates or locations, please inquire about availability.",
  },
  {
    question: "Do you provide 24/7 service?",
    answer: "Concierge requests are handled during business hours. Emergency situations are assessed on a case-by-case basis.",
  },
  {
    question: "Can you represent me at a viewing?",
    answer: "Yes, we can coordinate viewing attendance on your behalf for certain situations. This is typically arranged as part of our buyer or rental advisory services.",
  },
  {
    question: "How do I track my request status?",
    answer: "You'll receive updates via your preferred communication channel. Status updates are provided at key milestones.",
  },
  {
    question: "Can I cancel or modify a request?",
    answer: "Yes, requests can be modified or cancelled with reasonable notice. Some arrangements may have cancellation policies from third-party providers.",
  },
];

const Concierge = () => {
  return (
    <>
      <SEOHead
        title="Concierge Convenience Services | JBJ Global Real Estate"
        description="Operational support for your property journey. Scheduling, coordination, and time-saving logistics handled by our concierge team."
        canonicalPath="/services/concierge"
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
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Concierge Convenience Services
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Operational help around your property journey — scheduling, coordination, and time-saving logistics.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=concierge">
                Request Concierge Support
              </PremiumHeroButton>
              <PremiumHeroButton href="#example-requests">
                Browse Options
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

      {/* EXAMPLE REQUESTS */}
      <section id="example-requests" className="bg-black py-20">
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
              Example Requests
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {exampleRequests.map((item, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <div className="h-full jj-card-inner !p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-gold" />
                      </div>
                      <span className="text-sm text-zinc-700">{item.text}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW REQUESTS ARE HANDLED */}
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
              How Requests Are Handled
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

      {/* SLA INFO */}
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
              Service Expectations
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <div className="flex items-center gap-4 mb-6">
                <Clock className="w-8 h-8 text-gold" />
                <h3 className="text-xl font-semibold text-black">Response & Timing</h3>
              </div>
              <ul className="space-y-4">
                {slaInfo.map((item, idx) => (
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
              Need Concierge Assistance?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              Let us handle the logistics so you can focus on what matters.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact?service=concierge">
                  Submit Concierge Request
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

export default Concierge;
