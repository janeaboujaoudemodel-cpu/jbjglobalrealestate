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

interface FAQCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  questions: Array<{ question: string; answer: string }>;
}

const BrokerFAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "licensing-legal",
      title: "Licensing & Legal Scope",
      icon: Scale,
      questions: [
        {
          question: "Who can legally work as a real estate broker in Dubai?",
          answer: "Only individuals registered with RERA and working under a licensed real estate brokerage can legally conduct brokerage activities in Dubai. Brokers must operate strictly within the scope of their license."
        },
        {
          question: "Can a broker provide financial or investment guarantees?",
          answer: "No. Brokers are not licensed to provide financial guarantees, promise returns, or offer regulated financial advice. Any such claims are misleading and not permitted."
        },
        {
          question: "What activities fall outside a broker's legal scope?",
          answer: "Brokers cannot provide financial advisory services, portfolio management, or guaranteed ROI projections. These activities require separate regulatory licenses."
        },
        {
          question: "Are verbal promises legally binding?",
          answer: "No. Only written agreements registered through official channels (such as DLD or Ejari) are legally recognized. Verbal assurances should never replace documented terms."
        }
      ]
    },
    {
      id: "professional-conduct",
      title: "Professional Conduct & Ethics",
      icon: Shield,
      questions: [
        {
          question: "Is it acceptable to promote a project based on commission incentives?",
          answer: "No. Property recommendations must be based on client objectives and suitability, not commission structures or personal relationships with developers."
        },
        {
          question: "How should brokers handle conflicts of interest?",
          answer: "Any potential conflict must be disclosed transparently. Client interest must always take priority over personal or commercial incentives."
        },
        {
          question: "Is pressure selling acceptable in real estate brokerage?",
          answer: "No. Ethical brokerage requires informed decision-making. Clients must never be rushed, manipulated, or pressured into transactions."
        },
        {
          question: "What defines ethical brokerage?",
          answer: "Transparency, accuracy, regulatory compliance, and a client-first mindset define ethical brokerage practice."
        }
      ]
    },
    {
      id: "client-education",
      title: "Client Education & Communication",
      icon: MessageSquare,
      questions: [
        {
          question: "What is the broker's role in client education?",
          answer: "Brokers are expected to explain processes, timelines, risks, and market conditions clearly so clients can make informed decisions."
        },
        {
          question: "Should brokers simplify market information?",
          answer: "Yes, but without distortion. Simplification must not remove critical context or risks. Accuracy is always more important than persuasion."
        },
        {
          question: "How should brokers discuss market expectations?",
          answer: "Expectations should be framed using historical data, current market conditions, and official benchmarks — never speculation or hype."
        }
      ]
    },
    {
      id: "off-plan-representation",
      title: "Off-Plan Representation",
      icon: Building,
      questions: [
        {
          question: "Can brokers predict appreciation on off-plan projects?",
          answer: "No. Brokers may explain historical trends and project fundamentals but must not predict or promise appreciation outcomes."
        },
        {
          question: "What must be disclosed in off-plan sales?",
          answer: "Payment schedules, construction timelines, handover risks, service charges, and developer track record must be clearly disclosed."
        },
        {
          question: "Are all off-plan projects suitable for all buyers?",
          answer: "No. Suitability depends on the client's timeline, risk tolerance, and financial objectives."
        }
      ]
    },
    {
      id: "ready-property",
      title: "Ready Property Transactions",
      icon: Home,
      questions: [
        {
          question: "What information must be disclosed to buyers or tenants?",
          answer: "Service charges, maintenance responsibilities, community rules, and realistic rental or resale expectations must be disclosed."
        },
        {
          question: "Can brokers influence valuation outcomes?",
          answer: "No. Valuations must reflect market data and comparable transactions, not desired pricing."
        },
        {
          question: "What is the broker's role during transfer or lease registration?",
          answer: "Brokers coordinate documentation, ensure accuracy, and guide parties through official registration processes."
        }
      ]
    },
    {
      id: "data-market-intelligence",
      title: "Data, Market Intelligence & Claims",
      icon: Database,
      questions: [
        {
          question: "What data sources should brokers rely on?",
          answer: "Official government data, registered transaction records, rental index benchmarks, and verified market reports."
        },
        {
          question: "Can brokers reference social media market claims?",
          answer: "No. Social media content is not a reliable or regulated data source and should not be used to advise clients."
        },
        {
          question: "How should brokers present market insights?",
          answer: "As contextual guidance, not predictions. Data should inform — not persuade."
        }
      ]
    },
    {
      id: "working-with-jbj",
      title: "Working With JBJ Global Real Estate",
      icon: Users,
      questions: [
        {
          question: "What is JBJ's approach to brokerage?",
          answer: "JBJ operates on an education-first, compliance-driven model focused on long-term trust rather than transaction volume."
        },
        {
          question: "Does JBJ provide financial or investment guarantees?",
          answer: "No. JBJ does not provide financial guarantees or regulated financial advisory services."
        },
        {
          question: "How does JBJ support brokers professionally?",
          answer: "Through structured education, market guidance, ethical frameworks, and operational systems aligned with UAE regulations."
        },
        {
          question: "Are brokers trained on regulatory boundaries?",
          answer: "Yes. Compliance and licensing awareness are core components of JBJ's professional standards."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Broker FAQ | Professional Questions Answered | JBJ Global Real Estate"
        description="Find clear answers to common broker questions about licensing, ethics, client communication, off-plan representation, and professional conduct in UAE real estate."
        keywords="broker FAQ, UAE real estate broker, Dubai broker licensing, RERA broker, professional brokerage, broker ethics, real estate compliance"
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
            <Button 
              className="relative bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300"
              onClick={() => document.getElementById('faq-content')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Search className="w-4 h-4 mr-2 text-black" />
              <span className="text-gold font-semibold">Browse FAQs</span>
            </Button>
            <Button asChild className="relative bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300">
              <Link to="/contact">
                <Phone className="w-4 h-4 mr-2 text-black" />
                <span className="text-gold font-semibold">Ask Our Team</span>
              </Link>
            </Button>
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

      {/* FAQ Content */}
      <section id="faq-content" className="py-16 bg-black relative">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Sticky FAQ Quick Access - Mobile/Tablet Only */}
          <div className="lg:hidden sticky top-0 z-50 -mx-4 px-4 py-3 bg-black/95 backdrop-blur-sm border-b border-gold/20 shadow-lg">
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
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <category.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{category.title}</h2>
                </motion.div>

                {/* Questions */}
                <motion.div variants={fadeInUp}>
                  <div className="space-y-4">
                    {category.questions.map((faq, faqIndex) => (
                      <Accordion key={faqIndex} type="single" collapsible className="w-full">
                        <AccordionItem 
                          value={`${categoryIndex}-${faqIndex}`}
                          data-accordion-item={`${categoryIndex}-${faqIndex}`}
                          className="bg-white border border-zinc-200 rounded-xl px-6 py-2 data-[state=open]:border-gold/50 data-[state=open]:shadow-md transition-all"
                        >
                          <AccordionTrigger className="text-black text-left hover:text-gold hover:no-underline py-5 text-base font-medium">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-zinc-600 pb-5 leading-relaxed">
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

      {/* Still Have Questions */}
      <section className="py-16 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-gold" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
              Still Have Questions?
            </h2>
            <p className="text-zinc-600 mb-8 max-w-xl mx-auto leading-relaxed">
              Our team is here to help. Whether you're seeking clarity on professional standards or ready to elevate your practice, 
              we're here to provide guidance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild className="px-6 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] text-gold font-semibold border border-gold/40 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300">
                <Link to="/contact">
                  <Phone className="w-4 h-4 mr-2 text-black" />
                  Contact Our Team
                </Link>
              </Button>
              <Button asChild className="px-6 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] text-gold font-semibold border border-gold/40 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300">
                <Link to="/broker-education">
                  Read Broker Education Guide
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Guide Navigation */}
      <section className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-t border-zinc-200">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/broker-faq" guides={GUIDE_LINKS} />
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-t border-zinc-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-zinc-500 text-sm leading-relaxed">
              <span className="text-zinc-600 font-medium">Disclaimer:</span> This FAQ is educational in nature 
              and does not replace regulatory obligations. Brokers remain responsible for ensuring full compliance 
              with UAE laws and licensing requirements at all times.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BrokerFAQ;
