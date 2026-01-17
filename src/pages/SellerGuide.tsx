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
  HelpCircle
} from "lucide-react";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideSection } from "@/components/guides/GuideSection";
import { GuideCard } from "@/components/guides/GuideCard";
import { GuideCTA } from "@/components/guides/GuideCTA";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import Footer from "@/components/Footer";

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
      title: "Property Owner",
      description: "You own a residential or commercial property in the UAE and want to sell for the best price."
    },
    {
      icon: Briefcase,
      title: "Landlord",
      description: "You have a tenanted property and want to explore your selling options while protecting tenant rights."
    },
    {
      icon: Building2,
      title: "Off-Plan Seller",
      description: "You purchased off-plan and want to resell your unit before or after handover."
    },
    {
      icon: Plane,
      title: "Overseas Owner",
      description: "You live abroad and need professional representation to handle the sale remotely."
    }
  ];

  const steps = [
    {
      number: 1,
      title: "Initial Consultation",
      icon: MessageCircle,
      description: "We begin with a comprehensive discussion about your property and selling objectives.",
      items: [
        "Understand your timeline and financial expectations",
        "Discuss market conditions and recent comparable sales",
        "Explain the selling process and documentation requirements",
        "Answer any questions about fees, timelines, and procedures"
      ]
    },
    {
      number: 2,
      title: "Property Valuation",
      icon: BarChart3,
      description: "Accurate pricing is crucial. We provide data-driven market insights to help you set the right price.",
      items: [
        "Comparative Market Analysis (CMA) using recent transactions",
        "Assessment of property condition, upgrades, and unique features",
        "Consideration of market trends and buyer demand",
        "Transparent discussion of pricing strategy options"
      ]
    },
    {
      number: 3,
      title: "Prepare Your Property",
      icon: Home,
      description: "First impressions matter. We guide you on preparing your property for maximum appeal.",
      items: [
        "Declutter and depersonalize living spaces",
        "Complete minor repairs and touch-ups",
        "Professional cleaning and staging recommendations",
        "Prepare all required documentation in advance"
      ]
    },
    {
      number: 4,
      title: "Professional Marketing",
      icon: Camera,
      description: "We showcase your property to the widest possible audience of qualified buyers.",
      items: [
        "Professional photography and videography",
        "Listing on major UAE property portals",
        "Targeted social media campaigns",
        "Virtual tours for international buyers"
      ]
    },
    {
      number: 5,
      title: "Viewings & Feedback",
      icon: Eye,
      description: "We manage all viewings and provide regular updates on buyer interest.",
      items: [
        "Coordinate viewing schedules that work for you",
        "Accompany buyers and present property professionally",
        "Collect and share feedback after each viewing",
        "Adjust strategy based on market response"
      ]
    },
    {
      number: 6,
      title: "Offer Negotiation",
      icon: Handshake,
      description: "We negotiate on your behalf to secure the best possible terms.",
      items: [
        "Present all offers with our professional assessment",
        "Negotiate price, payment terms, and conditions",
        "Advise on counter-offers and deal structure",
        "Ensure your interests are protected throughout"
      ]
    },
    {
      number: 7,
      title: "Documentation & NOC",
      icon: FileCheck,
      description: "We guide you through all paperwork and regulatory requirements.",
      items: [
        "Prepare and review the Memorandum of Understanding (MOU)",
        "Coordinate NOC application with the developer",
        "Ensure all documents are complete and accurate",
        "Liaise with all parties to prevent delays"
      ]
    },
    {
      number: 8,
      title: "Transfer & Handover",
      icon: Key,
      description: "The final step: ownership transfer and receiving your funds.",
      items: [
        "Schedule transfer at Dubai Land Department or trustee office",
        "Coordinate with buyer's bank if mortgage involved",
        "Ensure funds are cleared before transfer",
        "Complete handover and key exchange"
      ]
    }
  ];

  const preparationChecklist = [
    { icon: Camera, title: "Professional Photos", description: "Clean, bright, high-quality images of every room" },
    { icon: PenTool, title: "Minor Repairs", description: "Fix leaks, scratches, broken handles, and paint touch-ups" },
    { icon: Home, title: "Deep Cleaning", description: "Professional cleaning including carpets and windows" },
    { icon: FileText, title: "Documents Ready", description: "Title deed, passport, Emirates ID, utility bills" }
  ];

  const costs = [
    { label: "Agency Commission", value: "2% + VAT", note: "Standard market rate, paid on completion" },
    { label: "NOC Fee", value: "AED 500-5,000", note: "Varies by developer" },
    { label: "Transfer Fee", value: "4% of sale price", note: "Typically paid by buyer (negotiable)" },
    { label: "Mortgage Settlement", value: "Varies", note: "Early settlement fees if applicable" }
  ];

  const faqs = [
    {
      question: "How long does it take to sell a property in the UAE?",
      answer: "On average, a well-priced property in a desirable location can sell within 1-3 months. However, this varies based on market conditions, property type, location, and pricing strategy. Off-plan resales may take longer depending on developer policies."
    },
    {
      question: "Can I sell if I still have a mortgage?",
      answer: "Yes, you can sell with an existing mortgage. The mortgage will be settled from the sale proceeds. Alternatively, the buyer may take over the mortgage with bank approval (liability transfer). We can coordinate with your bank throughout the process."
    },
    {
      question: "Do I need to be in the UAE for the sale?",
      answer: "Not necessarily. You can grant Power of Attorney (POA) to a trusted representative to handle the sale on your behalf. The POA must be properly attested and notarized. We can guide you through this process."
    },
    {
      question: "What is a No Objection Certificate (NOC)?",
      answer: "An NOC is a document from the developer confirming no outstanding service charges or fees on the property. It's required for transfer and typically costs AED 500-5,000. Processing time varies by developer."
    },
    {
      question: "Can I sell an off-plan property before handover?",
      answer: "Yes, but it depends on the developer's policy. Most developers allow resale after a certain payment milestone (typically 40-50% paid). There may be an assignment fee. We can check the specific terms with your developer."
    },
    {
      question: "What documents do I need to sell?",
      answer: "Essential documents include: Title Deed (original), valid passport and Emirates ID, proof of address, original purchase agreement (SPA), and any mortgage-related documents. For POA sales, attested Power of Attorney is required."
    }
  ];

  const scrollToGuide = () => {
    document.getElementById('selling-process')?.scrollIntoView({ behavior: 'smooth' });
  };

  const tocItems = [
    { id: 'who-is-this-for', title: 'Who Is This For', icon: Users },
    { id: 'selling-process', title: 'Selling Process', icon: ClipboardCheck },
    { id: 'preparation', title: 'Preparation', icon: Home },
    { id: 'costs', title: 'Costs & Fees', icon: Calculator },
    { id: 'faqs', title: 'FAQs', icon: HelpCircle },
  ];

  return (
    <>
      <SEOHead 
        title="Seller Guide | How to Sell Property in the UAE | JBJ Global Real Estate"
        description="Complete guide to selling property in the UAE. Learn about pricing, documentation, marketing, and the transfer process with JBJ Global Real Estate. Expert brokerage services for sellers."
      />
      
      <main className="min-h-screen bg-black">
        {/* Premium Hero */}
        <GuideHero
          badge="Complete Seller's Guide"
          badgeIcon={Building2}
          title={
            <>
              How to Sell Property in the{" "}
              <span className="text-gold">UAE</span>
            </>
          }
          description="Your comprehensive guide to selling property successfully in the UAE market. From preparation to handover, we're with you every step of the way."
          actions={
            <>
              <Button 
                onClick={scrollToGuide}
                variant="outline"
                className="border-gold/50 text-gold hover:bg-gold/10 px-6 py-3"
              >
                <ArrowDown className="w-5 h-5 mr-2" />
                Start the Guide
              </Button>
              <Link to="/seller-listing">
                <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:brightness-110 px-6 py-3">
                  <Building2 className="w-5 h-5 mr-2" />
                  List Your Property
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </>
          }
        />

        {/* Sticky Table of Contents */}
        <div className="hidden lg:block fixed right-8 top-1/3 z-30">
          <GuideTableOfContents items={tocItems} />
        </div>

        {/* Who This Guide Is For */}
        <section id="who-is-this-for" className="py-16 bg-zinc-900/30 scroll-mt-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="text-center mb-12"
              >
                <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-white mb-4">
                  Who This Guide Is For
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-zinc-400 max-w-2xl mx-auto">
                  Whether you're a first-time seller or experienced property owner, this guide covers everything you need to know.
                </motion.p>
              </motion.div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {whoIsThisFor.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 hover:border-gold/30 transition-all group"
                  >
                    <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                      <item.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-zinc-400 text-sm">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Step-by-Step Selling Process */}
        <section id="selling-process" className="py-16 scroll-mt-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="text-center mb-12"
              >
                <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-white mb-4">
                  Step-by-Step Selling Process
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-zinc-400 max-w-2xl mx-auto">
                  Our proven 8-step process ensures a smooth and successful sale
                </motion.p>
              </motion.div>
              
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <motion.div 
                    key={step.number}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 md:p-8 hover:border-gold/20 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/20">
                        <step.icon className="w-6 h-6 text-gold" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-0.5 bg-gold/10 text-gold font-bold text-xs rounded">Step {step.number}</span>
                          <h3 className="text-xl font-bold text-white">{step.title}</h3>
                        </div>
                        <p className="text-zinc-400 mb-4">{step.description}</p>
                        <ul className="grid md:grid-cols-2 gap-2">
                          {step.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-zinc-300 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Preparing Your Property */}
        <section id="preparation" className="py-16 bg-zinc-900/30 scroll-mt-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="text-center mb-12"
              >
                <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-white mb-4">
                  <ClipboardCheck className="w-8 h-8 text-gold inline-block mr-2 align-middle" />
                  Preparing Your Property
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-zinc-400 max-w-2xl mx-auto">
                  A well-prepared property sells faster and often at a higher price
                </motion.p>
              </motion.div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {preparationChecklist.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 text-center"
                  >
                    <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                    <p className="text-zinc-400 text-sm">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing & Strategy */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.div variants={fadeInUp} className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    <Target className="w-8 h-8 text-gold inline-block mr-2 align-middle" />
                    Pricing Strategy
                  </h2>
                  <p className="text-zinc-400 max-w-2xl mx-auto">
                    Setting the right price is critical. Too high and you'll deter buyers; too low and you'll leave money on the table.
                  </p>
                </motion.div>

                <motion.div variants={fadeInUp} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 md:p-8 mb-8">
                  <h3 className="text-xl font-bold text-white mb-4">Factors That Influence Your Property Value</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-gold mt-1" />
                      <div>
                        <p className="text-white font-medium">Market Conditions</p>
                        <p className="text-zinc-400 text-sm">Current supply, demand, and recent transaction data</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gold mt-1" />
                      <div>
                        <p className="text-white font-medium">Location & Community</p>
                        <p className="text-zinc-400 text-sm">Area desirability, amenities, and accessibility</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Home className="w-5 h-5 text-gold mt-1" />
                      <div>
                        <p className="text-white font-medium">Property Condition</p>
                        <p className="text-zinc-400 text-sm">Upgrades, maintenance, and overall appeal</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Eye className="w-5 h-5 text-gold mt-1" />
                      <div>
                        <p className="text-white font-medium">Views & Floor</p>
                        <p className="text-zinc-400 text-sm">Sea/city views, floor level, and unit position</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="text-center">
                  <Link to="/property-evaluator">
                    <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:brightness-110 px-8 py-4">
                      <Calculator className="w-5 h-5 mr-2" />
                      Run Property Evaluator
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <p className="text-zinc-500 text-sm mt-3">
                    Get an informational estimate based on market data
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Selling Costs */}
        <section id="costs" className="py-16 bg-zinc-900/30 scroll-mt-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.div variants={fadeInUp} className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    <Banknote className="w-8 h-8 text-gold inline-block mr-2 align-middle" />
                    Understanding Selling Costs
                  </h2>
                  <p className="text-zinc-400 max-w-2xl mx-auto">
                    Factor these costs into your expectations for net proceeds
                  </p>
                </motion.div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {costs.map((cost, index) => (
                    <motion.div 
                      key={index} 
                      variants={fadeInUp}
                      className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 hover:border-gold/20 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white font-medium">{cost.label}</span>
                        <span className="text-gold font-bold">{cost.value}</span>
                      </div>
                      <p className="text-zinc-500 text-sm">{cost.note}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How JBJ Supports Sellers */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.div variants={fadeInUp} className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    How JBJ Global Real Estate Supports Sellers
                  </h2>
                  <p className="text-zinc-400 max-w-2xl mx-auto">
                    Professional brokerage services with partner introductions where needed
                  </p>
                </motion.div>

                <motion.div variants={fadeInUp} className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Target className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Expert Brokerage</h3>
                    <p className="text-zinc-400 text-sm">RERA-licensed brokers with deep UAE market knowledge</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Global Reach</h3>
                    <p className="text-zinc-400 text-sm">Access to international buyers through our network</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Partner Network</h3>
                    <p className="text-zinc-400 text-sm">Introductions to legal and mortgage partners when needed</p>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-4 text-center">
                  <p className="text-zinc-400 text-sm">
                    <Shield className="w-4 h-4 inline-block mr-1 text-gold" />
                    <strong>Note:</strong> JBJ Global Real Estate provides brokerage services only. For legal, mortgage, or 
                    financial services, we introduce you to licensed partners. You contract directly with those partners.
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faqs" className="py-16 bg-zinc-900/30 scroll-mt-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.div variants={fadeInUp} className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    <HelpCircle className="w-8 h-8 text-gold inline-block mr-2 align-middle" />
                    Frequently Asked Questions
                  </h2>
                </motion.div>
                
                <motion.div variants={fadeInUp}>
                  <Accordion type="single" collapsible className="space-y-3">
                    {faqs.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`faq-${index}`}
                        className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-6 data-[state=open]:border-gold/30"
                      >
                        <AccordionTrigger className="text-white text-left hover:text-gold hover:no-underline py-5">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-400 pb-5">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Founder-Led Philosophy & Advisory Positioning */}
        <FounderPhilosophySection />

        {/* Final CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-2xl p-8 md:p-12"
            >
              <Sparkles className="w-12 h-12 text-gold mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to List Your Property?
              </h2>
              <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
                Start your selling journey with JBJ Global Real Estate. Our expert team is ready to help you 
                achieve the best outcome for your property sale.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Link to="/seller-listing">
                  <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:brightness-110 px-8 py-4 text-lg">
                    <Building2 className="w-5 h-5 mr-2" />
                    List Your Property Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="border-gold/50 text-gold hover:bg-gold/10 px-6 py-4">
                    <Phone className="w-5 h-5 mr-2" />
                    Book Consultation
                  </Button>
                </Link>
              </div>
              
              {/* Quick Contact Actions */}
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <a 
                  href={getWhatsAppUrl("Hi, I'd like to discuss selling my property in the UAE.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp: {CONTACT_INFO.phone}
                </a>
                <a 
                  href={getCallUrl()}
                  className="flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call: {CONTACT_INFO.phone}
                </a>
                <a 
                  href={getEmailUrl()}
                  className="flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {CONTACT_INFO.email}
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Compliance Disclaimer */}
        <section className="py-8 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-6">
                <h4 className="text-gold font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Important Disclaimer
                </h4>
                <div className="text-zinc-500 text-sm space-y-2">
                  <p>
                    JBJ Global Real Estate provides real estate brokerage services only. We are not licensed to provide 
                    legal, financial, mortgage, or investment advice. Information in this guide is for educational purposes 
                    and may not reflect current regulations.
                  </p>
                  <p>
                    For legal matters, we can introduce you to licensed law firms. For mortgage services, we can connect you 
                    with licensed mortgage brokers. You contract directly with these partners, not through JBJ Global Real Estate.
                  </p>
                  <p>
                    All property valuations and market estimates are informational only and do not constitute appraisals. 
                    Actual sale prices depend on market conditions and buyer negotiations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Guide Navigation */}
        <section className="py-8 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <GuideNavigation current="/seller-guide" guides={GUIDE_LINKS} />
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default SellerGuide;