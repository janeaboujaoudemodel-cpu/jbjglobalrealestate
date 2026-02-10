import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FounderPhilosophySection } from "@/components/FounderPhilosophySection";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Home,
  FileText,
  Users,
  Building2,
  ArrowRight,
  ArrowDown,
  Shield,
  Banknote,
  Key,
  Clock,
  Landmark,
  Calculator,
  Phone,
  Camera,
  BarChart3,
  Handshake,
  ClipboardCheck,
  Globe,
  MessageCircle,
  Mail,
  Sparkles,
  User,
  Briefcase,
  Plane,
  PenTool,
  FileCheck,
  Target,
  TrendingUp,
  Eye,
  HelpCircle,
  XCircle,
  Search,
  Megaphone,
  UserCheck,
  Scale
} from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import { GuideSectionHeader } from "@/components/guides/GuideSectionHeader";


const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const SellerGuide = () => {
  const whoIsThisFor = [
    {
      icon: Home,
      title: "Property owners planning to sell",
      description: "Ready to exit your investment"
    },
    {
      icon: Briefcase,
      title: "Investors exiting an asset",
      description: "Strategic portfolio decisions"
    },
    {
      icon: Building2,
      title: "Owners of ready or off-plan resale units",
      description: "Any property type"
    },
    {
      icon: Globe,
      title: "Local and international sellers",
      description: "Worldwide support"
    }
  ];

  const steps = [
    {
      number: 1,
      title: "Property Review & Market Positioning",
      icon: Search,
      description: "Before listing, your property is reviewed based on:",
      items: [
        "Location and building performance",
        "Recent transaction data",
        "Current supply and demand",
        "Rental yield (if applicable)",
        "Remaining mortgage or developer balance"
      ],
      note: "Pricing is set according to real market evidence, not aspirational figures."
    },
    {
      number: 2,
      title: "Pricing Strategy (Critical Step)",
      icon: Target,
      description: "Correct pricing determines:",
      items: [
        "Speed of sale",
        "Buyer quality",
        "Negotiation leverage"
      ],
      warning: {
        title: "Overpricing leads to:",
        items: [
          "Low enquiry",
          "Longer market time",
          "Forced price reductions later"
        ]
      }
    },
    {
      number: 3,
      title: "Marketing & Exposure",
      icon: Megaphone,
      description: "Your property is marketed through:",
      items: [
        "Major UAE property portals",
        "Direct buyer networks",
        "Qualified investor channels",
        "Private client matching (where applicable)"
      ],
      note: "Only serious, qualified buyers are engaged to protect your time and price."
    },
    {
      number: 4,
      title: "Viewings & Buyer Screening",
      icon: UserCheck,
      description: "Professional viewing management:",
      items: [
        "Viewings coordinated professionally",
        "Buyer intent and financial readiness verified",
        "Offers filtered before presentation"
      ],
      note: "You receive real feedback, not noise."
    },
    {
      number: 5,
      title: "Offer, Negotiation & Agreement",
      icon: Handshake,
      description: "Securing the best terms:",
      items: [
        "Written offers reviewed with market context",
        "Negotiation handled objectively",
        "Memorandum of Understanding (Form F) issued",
        "Buyer deposit secured"
      ]
    },
    {
      number: 6,
      title: "Transfer & Completion",
      icon: Key,
      description: "Final steps to sale completion:",
      items: [
        "Developer NOC obtained",
        "Trustee office transfer scheduled",
        "Ownership transferred at Dubai Land Department",
        "Funds released upon completion"
      ]
    }
  ];

  const agencyCommission = {
    rate: "2% + VAT",
    paidBy: "Paid by the seller (unless agreed otherwise)",
    covers: [
      "Market pricing strategy",
      "Professional marketing",
      "Buyer screening",
      "Negotiation & deal structuring",
      "Transaction coordination"
    ]
  };

  const governmentFees = [
    { title: "NOC fee (developer)", description: "Varies by project" },
    { title: "Mortgage release fee", description: "If applicable" },
    { title: "Trustee office fees", description: "Required for transfer" },
    { title: "Title deed issuance", description: "Official documentation" }
  ];

  const mortgagedPropertySteps = [
    "Outstanding balance must be cleared before transfer",
    "Settlement coordinated with the bank",
    "Sale proceeds can be used for settlement"
  ];

  const offPlanResaleConditions = [
    "Developer approval",
    "Minimum payment completion (usually 40–50%)",
    "Assignment or transfer fee (developer-specific)"
  ];

  const jbjSupport = [
    { title: "Data-driven pricing advice", description: "Based on real market evidence" },
    { title: "Professional listing presentation", description: "Maximum market exposure" },
    { title: "Buyer qualification & negotiation", description: "Protect your interests" },
    { title: "Mortgage and developer coordination", description: "End-to-end management" },
    { title: "End-to-end transaction management", description: "From listing to completion" }
  ];

  const faqs = [
    {
      question: "Who pays the agency commission?",
      answer: "The seller typically pays 2% + VAT, unless otherwise agreed."
    },
    {
      question: "Can I sell with an existing tenant?",
      answer: "Yes. Tenanted properties can be sold subject to tenancy terms."
    },
    {
      question: "Can I sell an off-plan unit before handover?",
      answer: "Yes, if developer conditions are met."
    },
    {
      question: "How long does it take to sell?",
      answer: "Timing depends on pricing, market demand, and property type."
    },
    {
      question: "Can I sell while abroad?",
      answer: "Yes. Sales can be completed via Power of Attorney."
    },
    {
      question: "Do I need a lawyer to sell?",
      answer: "Not mandatory, but legal support may be used for complex cases."
    },
    {
      question: "What happens if my property is mortgaged?",
      answer: "The mortgage must be settled prior to transfer."
    },
    {
      question: "Can I reject offers below my asking price?",
      answer: "Yes. All offers are presented; acceptance is your decision."
    }
  ];

  const scrollToGuide = () => {
    document.getElementById('selling-process')?.scrollIntoView({ behavior: 'smooth' });
  };

  const tocItems = [
    { id: 'who-is-this-for', title: 'Who Is This For', icon: Users },
    { id: 'selling-process', title: 'Selling Process', icon: ClipboardCheck },
    { id: 'costs', title: 'Costs & Fees', icon: Calculator },
    { id: 'mortgaged-properties', title: 'Mortgaged Properties', icon: Landmark },
    { id: 'off-plan-resale', title: 'Off-Plan Resale', icon: Building2 },
    { id: 'jbj-support', title: 'How JBJ Supports You', icon: Handshake },
    { id: 'faqs', title: 'FAQs', icon: HelpCircle },
  ];

  return (
    <>
      <SEOHead 
        title="Seller Guide | How to Sell Property in Dubai | JBJ Global Real Estate"
        description="Complete guide to selling property in Dubai. Learn about pricing, documentation, marketing, and the transfer process with JBJ Global Real Estate. Expert brokerage services for sellers."
      />
      
      <main className="min-h-screen bg-black">
        {/* Premium Hero with Background */}
        <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black" />
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
          
          {/* Decorative elements */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold/3 rounded-full blur-3xl" />
          
          <motion.div 
            className="container mx-auto px-4 relative z-10"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <motion.div 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 rounded-full px-5 py-2.5 mb-6 shadow-lg"
                variants={fadeInUp}
              >
                <Building2 className="w-4 h-4 text-black" />
                <span className="text-gold text-sm font-semibold tracking-wide uppercase">Complete Seller's Guide</span>
              </motion.div>
              
              {/* Title */}
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight"
                variants={fadeInUp}
              >
                Selling Property in Dubai —{" "}
                <span className="text-gold">A Structured, Transparent Guide for Owners</span>
              </motion.h1>
              
              {/* Description */}
              <motion.p 
                className="text-lg md:text-xl text-zinc-300 font-light leading-relaxed max-w-3xl mx-auto mb-10"
                variants={fadeInUp}
              >
                Selling property in Dubai is a regulated, process-driven transaction. Whether you are selling an investment unit or an end-user property, understanding pricing, timing, costs, and legal steps is essential to protect your value and close efficiently.
              </motion.p>

              <motion.p 
                className="text-base text-zinc-400 font-light leading-relaxed max-w-3xl mx-auto mb-10"
                variants={fadeInUp}
              >
                This guide explains how to sell, what you pay, how pricing works, and how JBJ Global Real Estate manages the process from listing to transfer.
              </motion.p>
              
              {/* Actions - Hero style buttons matching homepage */}
              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
                <button 
                  onClick={scrollToGuide}
                  className="group relative inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold rounded-lg md:rounded-xl transition-all duration-300 bg-transparent"
                  style={{
                    border: '2px solid rgba(255,255,255,0.8)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                  }}
                >
                  <ArrowDown className="w-4 h-4 text-gold group-hover:text-black transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                  <span className="text-white group-hover:text-black transition-colors">Start the Guide</span>
                  <span className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
                </button>
                <Link to="/seller-listing">
                  <button 
                    className="group relative inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold rounded-lg md:rounded-xl transition-all duration-300 bg-transparent"
                    style={{
                      border: '2px solid rgba(255,255,255,0.8)',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                    }}
                  >
                    <Building2 className="w-4 h-4 text-gold group-hover:text-black transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                    <span className="text-white group-hover:text-black transition-colors">List Your Property</span>
                    <span className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
                  </button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Sticky Table of Contents - z-[60] to appear above JBJ support widget */}
        <div className="hidden lg:block fixed right-8 top-1/4 z-[60] max-w-xs">
          <GuideTableOfContents 
            items={tocItems}
            ctaAction={{
              label: "List Your Property Now",
              href: "/seller-listing",
              icon: Building2
            }}
          />
        </div>

        {/* Who This Guide Is For */}
        <section id="who-is-this-for" className="py-16 jj-section-champagne scroll-mt-20">
          <div className="jj-guide-content">
            <GuideSectionHeader icon={Users} title="Who This Guide Is For" />
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {whoIsThisFor.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="jj-box-active p-6 hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all"
                >
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                    <item.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="text-lg font-bold text-black mb-2">{item.title}</h3>
                  <p className="text-zinc-600 text-sm">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Step-by-Step Selling Process */}
        <section id="selling-process" className="py-16 jj-section-champagne scroll-mt-20">
          <div className="jj-guide-content">
            <GuideSectionHeader icon={ClipboardCheck} title="Step-by-Step Selling Process" />
            <div className="space-y-6">
              {steps.map((step, index) => (
                <motion.div 
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="jj-box-active p-6 md:p-8 hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all"
                >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/20">
                        <step.icon className="w-6 h-6 text-gold" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-0.5 bg-gold/10 text-gold font-bold text-xs rounded">Step {step.number}</span>
                          <h3 className="text-xl font-bold text-black">{step.title}</h3>
                        </div>
                        <p className="text-zinc-600 mb-4">{step.description}</p>
                        <ul className="grid md:grid-cols-2 gap-2 mb-4">
                          {step.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-zinc-700 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        {step.note && (
                          <p className="text-zinc-500 text-sm italic">{step.note}</p>
                        )}
                        {step.warning && (
                          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 font-semibold text-sm mb-2 flex items-center gap-2">
                              <XCircle className="w-4 h-4" />
                              {step.warning.title}
                            </p>
                            <ul className="space-y-1">
                              {step.warning.items.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-red-700 text-sm">
                                  <span>•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </section>

        {/* Selling Costs & Fees */}
        <section id="costs" className="py-16 jj-section-champagne scroll-mt-20">
          <div className="jj-guide-content">
            <div>
              <GuideSectionHeader icon={Calculator} title="Selling Costs & Fees" />

              {/* Agency Commission */}
              <div className="jj-card-inner p-6 md:p-8 mb-6 hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="jj-icon-box-active w-12 h-12 rounded-xl">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black">Agency Commission</h3>
                    <p className="text-zinc-600">Standard market rate: {agencyCommission.rate}</p>
                  </div>
                </div>
                <p className="text-zinc-700 mb-4">{agencyCommission.paidBy}</p>
                <p className="text-black font-semibold mb-3">This covers:</p>
                <ul className="grid md:grid-cols-2 gap-2">
                  {agencyCommission.covers.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-zinc-700 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Government & Developer Fees */}
              <div className="jj-card-inner p-6 md:p-8 hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="jj-icon-box-active w-12 h-12 rounded-xl">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-black">Government & Developer Fees</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {governmentFees.map((fee, index) => (
                    <div key={index} className="jj-card-inner rounded-lg p-4">
                      <p className="text-black font-medium">{fee.title}</p>
                      <p className="text-zinc-600 text-sm">{fee.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="mortgaged-properties" className="py-16 jj-section-champagne scroll-mt-20">
          <div className="jj-guide-content">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="jj-box-active p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 jj-icon-box-active rounded-xl">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-black">Selling Mortgaged Properties</h3>
                </div>
                <p className="text-zinc-700 mb-4">If your property has an existing mortgage:</p>
                <ul className="space-y-3 mb-4">
                  {mortgagedPropertySteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3 text-zinc-700">
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-zinc-500 text-sm italic">This process is handled step-by-step to avoid delays.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="off-plan-resale" className="py-16 jj-section-champagne scroll-mt-20">
          <div className="jj-guide-content">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="jj-box-active p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 jj-icon-box-active rounded-xl">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-black">Selling Off-Plan Properties (Resale)</h3>
                </div>
                <p className="text-zinc-700 mb-4">Off-plan resale depends on:</p>
                <ul className="space-y-3 mb-4">
                  {offPlanResaleConditions.map((condition, index) => (
                    <li key={index} className="flex items-start gap-3 text-zinc-700">
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span>{condition}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-zinc-500 text-sm italic">Not all off-plan units are immediately resellable — eligibility is verified before listing.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section id="jbj-support" className="py-16 jj-section-champagne scroll-mt-20">
          <div className="jj-guide-content">
            <GuideSectionHeader icon={Handshake} title="How JBJ Supports Sellers" />

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {jbjSupport.map((item, index) => (
                <div 
                  key={index}
                  className="jj-card-inner p-6 hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all"
                >
                  <h4 className="text-black font-semibold mb-2">{item.title}</h4>
                  <p className="text-zinc-600 text-sm">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="jj-card-inner rounded-xl p-6">
              <p className="text-zinc-700 text-sm leading-relaxed">
                <span className="text-black font-semibold">JBJ Global Real Estate</span> is licensed for buying, selling, and renting property in Dubai. Legal and banking services are coordinated through licensed third-party partners where required.
              </p>
            </div>
          </div>
        </section>

        <section id="faqs" className="py-16 jj-section-champagne scroll-mt-20">
          <div className="jj-guide-content">
            <GuideSectionHeader icon={HelpCircle} title="Seller Guide FAQs" />
              
            <div className="jj-card-inner rounded-2xl p-6 md:p-8">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`faq-${index}`}
                    className="border-b border-zinc-200 last:border-0"
                  >
                    <AccordionTrigger className="text-black text-left font-medium hover:text-gold hover:no-underline py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-zinc-600 pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Founder-Led Philosophy & Advisory Positioning */}
        <FounderPhilosophySection />

        {/* Final CTA Section - Next Step - 3-Layer System */}
        <section className="py-20 bg-black">
          <div className="jj-layer-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <div className="jj-card-inner rounded-2xl p-8 md:p-12 text-center">
                <Sparkles className="w-12 h-12 text-gold mx-auto mb-4" />
                <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
                  <span className="text-gold">Next</span> Step
                </h2>
                <p className="text-zinc-600 mb-8 max-w-xl mx-auto">
                  If you are considering selling your property, the next step is a structured pricing and market review to determine the correct exit strategy.
                </p>
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  <Link to="/contact">
                    <Button variant="primary" className="px-8 py-4 text-lg">
                      <Phone className="w-5 h-5 mr-2" />
                      Book a Consultation
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/properties">
                    <Button variant="secondary" className="px-8 py-4 text-lg">
                      <Building2 className="w-5 h-5 mr-2" />
                      Explore Properties
                    </Button>
                  </Link>
                </div>
                
                {/* Quick Contact Actions */}
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <a 
                    href={getWhatsAppUrl("Hi, I'd like to discuss selling my property in Dubai.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-zinc-600 hover:text-gold transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    WhatsApp: {CONTACT_INFO.phone}
                  </a>
                  <a 
                    href={getCallUrl()}
                    className="flex items-center gap-2 text-zinc-600 hover:text-gold transition-colors"
                  >
                    <Phone className="w-4 h-4 text-blue-500" />
                    Call: {CONTACT_INFO.phone}
                  </a>
                  <a 
                    href={getEmailUrl()}
                    className="flex items-center gap-2 text-zinc-600 hover:text-gold transition-colors"
                  >
                    <Mail className="w-4 h-4 text-orange-500" />
                    {CONTACT_INFO.email}
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Compliance Disclaimer - 3-Layer System */}
        <section className="py-8 bg-black">
          <div className="jj-layer-2">
            <div className="max-w-5xl mx-auto">
              <div className="jj-card-inner rounded-lg p-6">
                <h4 className="text-black font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gold" />
                  Important Disclaimer
                </h4>
                <div className="text-zinc-600 text-sm space-y-2">
                  <p>
                    This guide is provided for general educational and informational purposes only. It does not constitute legal, 
                    mortgage, or professional advice. JBJ Global Real Estate is a licensed 
                    real estate brokerage providing buying, selling, and rental services. We do not provide legal or investment advisory services. 
                    Sellers should conduct independent due diligence and consult with qualified 
                    professionals before making any property sale decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Guide Navigation - Active Champagne Layer */}
        <section className="jj-section-champagne py-12">
          <div className="container mx-auto px-4">
            <GuideNavigation current="/seller-guide" guides={GUIDE_LINKS} showStartHere={false} />
          </div>
        </section>
      </main>
    </>
  );
};

export default SellerGuide;
