import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Phone,
  Mail,
  CheckCircle2,
  HelpCircle,
  Ticket,
  Send,
  Shield,
  FileText,
  KeyRound,
  Folder,
  Users,
  ArrowUpCircle,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SupportTicketBox from "@/components/SupportTicketBox";
import { getWhatsAppUrl } from "@/constants/stats";

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

const whatWeCanHelp = [
  { icon: Shield, text: "Website support and login issues" },
  { icon: Send, text: "Service requests routing" },
  { icon: Ticket, text: "Complaint ticket creation and updates" },
  { icon: FileText, text: "Document submission guidance" },
  { icon: KeyRound, text: "Portal access questions" },
];

const faqData = [
  {
    question: "Will I always get a ticket ID?",
    answer: "Yes—support is handled through tracked tickets.",
  },
  {
    question: "How do I reference my case?",
    answer: "Use the ticket ID in all messages.",
  },
  {
    question: "What's the fastest way to get help?",
    answer: "Create a ticket, then email the ticket ID if it's urgent.",
  },
  {
    question: "Can I request a callback?",
    answer: "Yes—include preferred time and number.",
  },
  {
    question: "Do you support WhatsApp?",
    answer: "Yes—you can reach us via WhatsApp using our main contact number displayed in the Direct Contact section below.",
  },
  {
    question: "Can you help with partner services?",
    answer: "We can route you to the right partner introduction pathway.",
  },
  {
    question: "Do you store my documents?",
    answer: "Documents submitted through forms are stored within platform workflows visible to authorized staff.",
  },
  {
    question: "Can I escalate a ticket?",
    answer: "Yes—escalation options apply for unresolved tickets.",
  },
];

const CustomerHappinessCenter = () => {
  const whatsappUrl = getWhatsAppUrl("Hi, I need support from the Happiness Center.");

  return (
    <div data-marketing-page>
      <SEOHead
        title="Customer Happiness Center | JBJ Global Real Estate"
        description="Fast routing, clear answers, and structured support—built around ticket tracking and professional resolution."
        canonicalPath="/services/customer-happiness-center"
      />

      {/* HERO SECTION */}
      <section className="jj-hero-fullscreen jj-hero-compact relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#1A1A1A]">
          {/* Video placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#EFE6D6]/20 border border-[#B89555]/40 flex items-center justify-center">
                <Heart className="w-12 h-12 text-[#1A1A1A]/70" />
              </div>
              <p className="text-[#1A1A1A]/70 text-sm tracking-widest uppercase">Support That Actually Works</p>
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
                        <SectionEyebrow icon={Heart} className="mb-6">Services</SectionEyebrow>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Customer Happiness Center
            </h1>
            
            <p className="text-white/85 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Fast routing, clear answers, and structured support—built around ticket tracking and professional resolution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="#create-ticket">
                Create Support Ticket
              </PremiumHeroButton>
              <PremiumHeroButton href="#direct-contact">
                Reach Us Directly
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

      {/* WHAT THIS CENTER DOES */}
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
              What This Center Does
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <p className="text-[#1A1A1A]/70 leading-relaxed text-center">
                The Happiness Center exists to ensure support requests don't get lost. Every request becomes a tracked ticket with clear routing and accountability.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SUPPORT TICKET SECTION - Reusing existing component */}
      <section id="create-ticket" className="bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
        <SupportTicketBox />
      </section>

      {/* DIRECT CONTACT */}
      <section id="direct-contact" className="bg-[#1A1A1A] py-20">
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
              Direct Contact
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              {/* Email Contact */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
                  <Mail className="w-7 h-7 text-[#1A1A1A]" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-[#1A1A1A]/70">Happiness Center Email</p>
                  <a 
                    href="mailto:HAPPINESS@JBJ.AE" 
                    className="text-[#1A1A1A] font-semibold text-lg hover:underline"
                  >
                    HAPPINESS@JBJ.AE
                  </a>
                </div>
              </div>

              {/* WhatsApp Contact */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl jj-surface-emerald flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-[#1A1A1A]/70">WhatsApp Support</p>
                  <a 
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[color:var(--emerald-1)] font-semibold text-lg hover:underline"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
              </div>

              <p className="text-[#1A1A1A]/70 text-center mt-4">
                For urgent routing, email the Happiness Center with your ticket ID in the subject line.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* WHAT WE CAN HELP WITH */}
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
              What We Can Help With
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {whatWeCanHelp.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-[#1A1A1A]" />
                    </div>
                    <span className="text-[#1A1A1A]/70">{item.text}</span>
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
              <Ticket className="w-12 h-12 text-[#1A1A1A] mx-auto mb-6" />
              <h2
                className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Get Support in One Workflow
              </h2>
              <p className="text-[#1A1A1A]/70 mb-8 max-w-xl mx-auto">
                Create a ticket to get routed and tracked properly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PremiumHeroButton href="#create-ticket">
                  Create Support Ticket
                </PremiumHeroButton>
                <PremiumHeroButton href="mailto:HAPPINESS@JBJ.AE">
                  Email Happiness Center
                </PremiumHeroButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CustomerHappinessCenter;
