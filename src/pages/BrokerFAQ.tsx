import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { 
  HelpCircle, 
  Scale,
  Shield,
  MessageSquare,
  Building,
  Home,
  Database,
  Users,
  Phone,
  Search,
  LucideIcon
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { FAQHero } from "@/components/faq/FAQHero";
import { FAQTableOfContents } from "@/components/faq/FAQTableOfContents";
import { FAQFloatingSidebar } from "@/components/faq/FAQFloatingSidebar";

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

interface FAQCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  questions: Array<{ question: string; answer: string }>;
}

const BrokerFAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "joining-jbj",
      title: "Joining JBJ",
      icon: Users,
      questions: [
        {
          question: "Who can join as a broker with JBJ Global Real Estate?",
          answer: "Brokers must be legally eligible to operate in Dubai and meet JBJ's internal standards. JBJ works only with professionals who respect compliance, documentation, transparency, and client-first conduct."
        },
        {
          question: "Is this Broker FAQ public or internal?",
          answer: "This is professional guidance aligned with JBJ standards. Broker tools and internal training are accessed through the Broker Hub by registered brokers."
        }
      ]
    },
    {
      id: "philosophy-ethics",
      title: "Philosophy & Ethics",
      icon: Shield,
      questions: [
        {
          question: "What is JBJ's brokerage philosophy?",
          answer: "JBJ operates on a client-first, data-driven advisory model. Brokers are expected to guide clients based on suitability and market reality, not pressure selling or commission motivation."
        },
        {
          question: "Are brokers allowed to promise ROI or guaranteed returns?",
          answer: "No. Guaranteed ROI does not exist in real estate. Brokers must never promise outcomes, returns, rental guarantees, or market certainty. Communication must remain factual and compliant."
        }
      ]
    },
    {
      id: "client-advising",
      title: "Client Advising",
      icon: MessageSquare,
      questions: [
        {
          question: "What is required from brokers when advising clients?",
          answer: "Brokers must:\n\n• Document communication properly\n• Provide accurate information\n• Present realistic timelines\n• Explain risks clearly\n• Avoid exaggeration or marketing manipulation\n• Respect legal boundaries at all times"
        },
        {
          question: "What are JBJ's expectations for client handling?",
          answer: "Brokers must:\n\n• Respect client capital and trust\n• Maintain transparency about costs and process\n• Avoid emotional pressure tactics\n• Focus on long-term relationship building\n\nRepeat clients and referrals are the priority, not volume transactions."
        }
      ]
    },
    {
      id: "partner-services",
      title: "Partner Services",
      icon: Building,
      questions: [
        {
          question: "How does JBJ handle partner services (mortgage, legal, visa)?",
          answer: "JBJ may introduce clients to licensed third-party partners when needed. Brokers must never imply these services are provided directly by JBJ. The client contracts directly with the licensed provider."
        }
      ]
    },
    {
      id: "documentation",
      title: "Documentation",
      icon: Database,
      questions: [
        {
          question: "What documentation is essential in brokerage workflow?",
          answer: "Brokers must keep a clear record of:\n\n• Client objectives\n• Property options presented\n• Risks explained\n• Negotiation notes\n• Transaction steps\n• Final decision confirmation\n\nProper documentation protects both the client and the brokerage."
        }
      ]
    },
    {
      id: "market-communication",
      title: "Market Communication",
      icon: Scale,
      questions: [
        {
          question: "How should brokers speak about market outlook?",
          answer: "Market discussions must be descriptive and data-based. Brokers may reference historical patterns and published information, but must never present forecasts as certainty."
        }
      ]
    },
    {
      id: "tools-systems",
      title: "Tools & Systems",
      icon: Home,
      questions: [
        {
          question: "How do brokers access tools and internal systems?",
          answer: "Registered brokers access:\n\n• CRM and lead management\n• Broker tools and templates\n• Internal training modules\n• Performance tracking\n\nthrough the Broker Hub."
        }
      ]
    },
    {
      id: "compliance-growth",
      title: "Compliance & Growth",
      icon: Shield,
      questions: [
        {
          question: "What happens if a broker violates JBJ standards?",
          answer: "Violations of compliance, transparency, or ethical conduct are taken seriously. JBJ may suspend access, terminate collaboration, or escalate issues depending on severity."
        },
        {
          question: "How can a broker grow within JBJ?",
          answer: "Growth is based on:\n\n• Consistency and professionalism\n• Compliance discipline\n• Client satisfaction\n• Documentation quality\n• Long-term results\n\nnot aggressive selling."
        }
      ]
    }
  ];

  const allFaqItems = categories.flatMap(cat => cat.questions);

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Broker FAQ | Professional Questions Answered | JBJ Global Real Estate"
        description="Find clear answers to common broker questions about licensing, ethics, client communication, off-plan representation, and professional conduct in UAE real estate."
        keywords="broker FAQ, UAE real estate broker, Dubai broker licensing, RERA broker, professional brokerage, broker ethics, real estate compliance"
        canonicalPath="/broker-faq"
        faqItems={allFaqItems}
      />
      
      {/* Hero */}
      <FAQHero
        badge="Broker FAQ"
        badgeIcon={HelpCircle}
        title={
          <>
            Broker Questions, <span className="text-gold">Clearly Answered</span>
          </>
        }
        description="Clear, factual answers for real estate professionals operating in the UAE market. This page focuses on professional conduct, licensing scope, and operational clarity — not sales tactics."
        backgroundImage="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            {/* Hero Button: Transparent bg + white 3D border + white text + gold icon; champagne fill on hover */}
            <button 
              className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 bg-transparent border-2 border-white/80 hover:bg-gradient-to-r hover:from-[#FDFBF7] hover:via-[#F5F0E6] hover:to-[#EDE4D3] hover:border-gold hover:text-black"
              style={{
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 15px rgba(0,0,0,0.3)',
              }}
              onClick={() => document.getElementById('faq-content')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Search className="w-4 h-4 text-gold group-hover:text-gold" />
              <span>Browse FAQs</span>
            </button>
            <Link 
              to="/contact"
              className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 bg-transparent border-2 border-white/80 hover:bg-gradient-to-r hover:from-[#FDFBF7] hover:via-[#F5F0E6] hover:to-[#EDE4D3] hover:border-gold hover:text-black"
              style={{
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 15px rgba(0,0,0,0.3)',
              }}
            >
              <Phone className="w-4 h-4 text-gold group-hover:text-gold" />
              <span>Ask Our Team</span>
            </Link>
          </>
        }
      />

      {/* Floating Sidebar Navigation */}
      <div className="hidden lg:block fixed right-8 top-1/4 z-[55] max-w-xs" style={{ marginBottom: '180px' }}>
        <FAQFloatingSidebar 
          categories={categories}
          title="Navigator"
        />
      </div>

      {/* FAQ Content - Layer 2 Active Champagne Edge-to-Edge */}
      <section id="faq-content" className="py-16 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl relative">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Sticky FAQ Quick Access - Mobile/Tablet Only */}
          <div className="lg:hidden sticky top-0 z-50 -mx-4 px-4 py-3 bg-gradient-to-br from-[#F5EBD7]/95 via-[#E8DCC8]/95 to-[#D4C4A8]/95 backdrop-blur-sm border-b border-gold/20 shadow-lg">
            <div className="w-full">
              <FAQTableOfContents 
                categories={categories}
                title="FAQ Quick Access"
                sticky={true}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full space-y-16 mt-8">
            {categories.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                id={`category-${categoryIndex}`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className="scroll-mt-40"
              >
                {/* Category Header */}
                <motion.div 
                  variants={fadeInUp}
                  className="flex items-center gap-4 mb-6"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl flex items-center justify-center">
                    <category.icon className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">{category.title}</h2>
                </motion.div>

                {/* Questions - Layer 3 Locked Champagne Cards */}
                <motion.div variants={fadeInUp}>
                  <div className="space-y-4">
                    {category.questions.map((faq, faqIndex) => (
                      <Accordion key={faqIndex} type="single" collapsible className="w-full">
                        <AccordionItem 
                          value={`${categoryIndex}-${faqIndex}`}
                          data-accordion-item={`${categoryIndex}-${faqIndex}`}
                          className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl px-6 py-2 data-[state=open]:border-gold/60 data-[state=open]:shadow-md transition-all"
                        >
                          <AccordionTrigger className="text-black text-left hover:text-gold hover:no-underline py-5 text-base font-medium">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-zinc-600 pb-5 leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions - Layer 2 */}
      <section className="py-16 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            {/* Layer 3 Card */}
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-black" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
                Still Have Questions?
              </h2>
              <p className="text-zinc-600 mb-8 max-w-xl mx-auto leading-relaxed">
                Our team is here to help. Whether you're seeking clarity on professional standards or ready to elevate your practice, 
                we're here to provide guidance.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild variant="primary" className="px-6">
                  <Link to="/contact">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Our Team
                  </Link>
                </Button>
                <Button asChild variant="primary" className="px-6">
                  <Link to="/broker-education">
                    Read Broker Education Guide
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Guide Navigation - Layer 2 */}
      <section className="py-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/broker-faq" guides={GUIDE_LINKS} />
        </div>
      </section>

      {/* Disclaimer - Layer 2 with Layer 3 Card */}
      <section className="py-8 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8 mb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6">
              <p className="text-center text-zinc-600 text-sm leading-relaxed">
                <span className="text-black font-medium">Disclaimer:</span> This FAQ is educational in nature 
                and does not replace regulatory obligations. Brokers remain responsible for ensuring full compliance 
                with UAE laws and licensing requirements at all times.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BrokerFAQ;