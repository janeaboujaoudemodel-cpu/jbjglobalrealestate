import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Sparkles,
  FileText,
  CheckCircle2,
  HelpCircle,
  Phone,
  Clock,
  Home,
  BarChart3,
  Shield,
  MessageSquare,
  Camera,
  Settings,
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

const eligibilityChecklist = [
  "Property must be eligible for holiday home licensing in Dubai",
  "Owner documentation and NOC requirements",
  "Property condition and furnishing standards",
  "Building/community approval (where required)",
  "DTCM registration compliance",
];

const setupWorkflow = [
  { step: 1, title: "Eligibility assessment and documentation review", icon: FileText },
  { step: 2, title: "Property preparation and photography", icon: Camera },
  { step: 3, title: "Listing creation and platform setup", icon: Settings },
  { step: 4, title: "Pricing strategy and calendar configuration", icon: Calendar },
  { step: 5, title: "Launch and go-live coordination", icon: Home },
];

const operations = [
  { icon: MessageSquare, title: "Guest Messaging", description: "Timely communication and inquiry response" },
  { icon: Sparkles, title: "Cleaning Coordination", description: "Turnover cleaning between guests" },
  { icon: Settings, title: "Maintenance Management", description: "Issue resolution and vendor coordination" },
  { icon: Calendar, title: "Booking Management", description: "Calendar updates and availability control" },
];

const performanceSnapshot = [
  "Occupancy rates and booking trends",
  "Revenue tracking and performance metrics",
  "Guest feedback and ratings overview",
  "Maintenance and issue log summary",
];

const faqData = [
  {
    question: "Is my property eligible for short-term rentals?",
    answer: "Eligibility depends on several factors including property type, location, building regulations, and DTCM licensing requirements. We assess this during the initial consultation.",
  },
  {
    question: "What is DTCM registration?",
    answer: "DTCM (Dubai Tourism and Commerce Marketing) registration is required for operating holiday homes in Dubai. This ensures compliance with local tourism regulations.",
  },
  {
    question: "Do you handle guest check-ins?",
    answer: "We coordinate check-in processes including key handover arrangements, guest communication, and welcome procedures.",
  },
  {
    question: "How is pricing determined?",
    answer: "Pricing strategies consider market rates, seasonality, local events, property features, and competitive positioning. We provide data-driven recommendations.",
  },
  {
    question: "What platforms do you list on?",
    answer: "Properties are typically listed on major platforms like Airbnb, Booking.com, and other relevant channels based on your target market.",
  },
  {
    question: "How do you handle problem guests?",
    answer: "We have established protocols for guest issues including communication escalation, security deposit claims, and platform support coordination.",
  },
  {
    question: "What are the typical costs involved?",
    answer: "Costs include licensing fees, platform commissions, cleaning services, and management fees. A detailed breakdown is provided during consultation.",
  },
  {
    question: "Can I block dates for personal use?",
    answer: "Yes, owners can block dates for personal use through the booking calendar. We recommend providing advance notice for optimal booking management.",
  },
  {
    question: "What happens during low season?",
    answer: "We adjust pricing strategies and marketing efforts during low seasons. Some owners opt for medium-term rentals during slower periods.",
  },
  {
    question: "Is this service available for all Dubai areas?",
    answer: "Short-term rental regulations vary by area and building. We assess eligibility based on your specific property location.",
  },
];

const ShortTermRentals = () => {
  return (
    <>
      <SEOHead
        title="Short-Term Rentals & Holiday Homes | JBJ Global Real Estate"
        description="Professional short-term rental and holiday home management in Dubai. From setup to operations, we handle guest coordination and performance tracking."
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
              <Calendar className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Short-Term Rentals & Holiday Homes
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              A structured setup and operating workflow for short-term stays — from readiness checklist to performance monitoring.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/contact?service=short-term-rentals">
                Request Short-Term Rental Setup
              </PremiumHeroButton>
              <PremiumHeroButton href="/contact">
                Check Eligibility
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

      {/* ELIGIBILITY & READINESS */}
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
              Eligibility & Readiness Checklist
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {eligibilityChecklist.map((item, idx) => (
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

      {/* OPERATIONS */}
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
              Operations
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {operations.map((item, index) => (
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

      {/* PERFORMANCE SNAPSHOT */}
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
              Performance Snapshot
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <div className="flex items-center gap-4 mb-6">
                <BarChart3 className="w-8 h-8 text-gold" />
                <h3 className="text-xl font-semibold text-black">What Owners See</h3>
              </div>
              <ul className="space-y-4">
                {performanceSnapshot.map((item, idx) => (
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
              Start Your Holiday Home Journey
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              Transform your property into a profitable short-term rental.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact?service=short-term-rentals">
                  Request Setup Consultation
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
            Short-term rental operations are subject to DTCM regulations and building/community rules. 
            Eligibility assessment is required before listing. JBJ Global Real Estate coordinates with licensed partners where specialized services are required.
          </p>
        </div>
      </section>

      <DirectContactCTA />
      <Footer />
    </>
  );
};

export default ShortTermRentals;
