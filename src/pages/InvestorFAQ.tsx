import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { 
  HelpCircle, 
  Globe,
  Shield,
  TrendingUp,
  Building,
  Banknote,
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

const InvestorFAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "investor-basics",
      title: "Investor Basics",
      icon: Users,
      questions: [
        {
          question: "Who is considered an investor in real estate?",
          answer: "An investor is anyone purchasing property with the objective of capital preservation, rental income, long-term appreciation, or portfolio diversification. This includes first-time investors, experienced portfolio holders, and international buyers."
        },
        {
          question: "Is real estate in the UAE suitable for investment?",
          answer: "The UAE real estate market is supported by strong regulation, transparent ownership laws, and ongoing government-led development initiatives. Investment suitability depends on objectives, timeframe, risk tolerance, and market conditions at the time of purchase."
        }
      ]
    },
    {
      id: "returns-guarantees",
      title: "Returns & Guarantees",
      icon: TrendingUp,
      questions: [
        {
          question: "Do you guarantee returns or rental income?",
          answer: "No. There are no guaranteed returns in real estate. Any claim of guaranteed ROI is misleading. We provide analysis based on historical data, market indicators, and official government information, but outcomes are never guaranteed."
        }
      ]
    },
    {
      id: "evaluation-process",
      title: "Evaluation Process",
      icon: Shield,
      questions: [
        {
          question: "How do you evaluate investment opportunities?",
          answer: "Investment analysis is based on:\n\n• Official government and regulatory data\n• Supply and demand dynamics\n• Location fundamentals\n• Developer credibility and delivery history\n• Entry price relative to comparable assets\n• Rental yield and exit liquidity indicators\n\nOur role is to help investors understand risk and opportunity clearly."
        },
        {
          question: "Do you push projects that pay higher commissions?",
          answer: "No. Property recommendations are not driven by commissions or personal relationships. Our approach is to evaluate the full market and align options strictly with the investor's stated goals."
        }
      ]
    },
    {
      id: "fees-costs",
      title: "Fees & Costs",
      icon: Banknote,
      questions: [
        {
          question: "Are there fees when buying off-plan as an investor?",
          answer: "For off-plan purchases, investors do not pay brokerage fees. Developers compensate licensed brokerages directly. All costs related to the property itself (purchase price, registration fees, etc.) are disclosed transparently."
        },
        {
          question: "What fees apply when buying a ready property?",
          answer: "When purchasing a ready property, standard brokerage fees apply in accordance with UAE regulations. These are communicated clearly before proceeding with any transaction."
        }
      ]
    },
    {
      id: "international-investors",
      title: "International Investors",
      icon: Globe,
      questions: [
        {
          question: "Can non-residents invest in UAE real estate?",
          answer: "Yes. Non-residents can invest in designated freehold areas across the UAE. Residency is not required to purchase property, though certain investments may qualify buyers for residency programs subject to government criteria."
        }
      ]
    },
    {
      id: "investment-strategies",
      title: "Investment Strategies",
      icon: Building,
      questions: [
        {
          question: "What types of investment strategies do you support?",
          answer: "We support multiple strategies, including:\n\n• Long-term capital appreciation\n• Rental income generation\n• Off-plan-to-handover strategies\n• Portfolio diversification across locations and asset types\n\nStrategy selection depends on individual objectives and market conditions."
        }
      ]
    },
    {
      id: "post-purchase",
      title: "Post-Purchase Support",
      icon: Users,
      questions: [
        {
          question: "Do you manage properties after purchase?",
          answer: "We assist investors by coordinating leasing, resale, or introductions to licensed property management providers when required. All services are clearly defined and optional."
        },
        {
          question: "How involved are you after the purchase?",
          answer: "Our support does not end at the transaction. We remain available to assist with leasing, resale strategies, and market updates relevant to your asset, subject to agreed services."
        }
      ]
    },
    {
      id: "decision-getting-started",
      title: "Decision & Getting Started",
      icon: Phone,
      questions: [
        {
          question: "Who makes the final investment decision?",
          answer: "The final decision always belongs to the investor. Our responsibility is to provide clarity, data, and guidance so decisions are made with full understanding of risks and opportunities."
        },
        {
          question: "How do I start as an investor with JBJ Global Real Estate?",
          answer: "You can contact us through the website to outline your objectives. We then provide structured guidance and market insights aligned with your investment goals."
        }
      ]
    }
  ];

  const allFaqItems = categories.flatMap(cat => cat.questions);

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Investor FAQ | Investment Questions Answered | JBJ Global Real Estate"
        description="Find answers to common investor questions about UAE real estate investment, returns, off-plan properties, rental performance, and working with JBJ Global Real Estate."
        keywords="investor FAQ, UAE real estate investment, Dubai property investment, off-plan investment, rental yield Dubai, property investment questions"
        canonicalPath="/investor-faq"
        faqItems={allFaqItems}
      />
      
      {/* Hero */}
      <FAQHero
        badge="Investor FAQ"
        badgeIcon={HelpCircle}
        title={
          <>
            Investor Questions <span className="text-gold">Answered</span>
          </>
        }
        description="Find clear, factual answers to common questions about investing in UAE real estate."
        backgroundImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <Button 
              className="relative bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300"
              onClick={() => document.getElementById('faq-content')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Search className="w-4 h-4 mr-2 text-black" />
              <span className="text-gold font-semibold">Browse FAQs</span>
            </Button>
            <Button asChild className="relative bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300">
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
                Our team is here to help. Whether you're exploring investment options or ready to proceed, 
                we're happy to provide guidance tailored to your situation.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild variant="primary" className="px-6">
                  <Link to="/contact">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Our Team
                  </Link>
                </Button>
                <Button asChild variant="primary" className="px-6">
                  <Link to="/investor-education">
                    Read Investor Education Guide
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
          <GuideNavigation current="/investor-faq" guides={GUIDE_LINKS} />
        </div>
      </section>

      {/* Disclaimer - Layer 2 with Layer 3 Card */}
      <section className="py-8 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8 mb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6">
              <p className="text-center text-zinc-600 text-sm leading-relaxed">
                <span className="text-black font-medium">Disclaimer:</span> All content is educational 
                and informational in nature. It does not constitute financial guarantees or investment promises. 
                Decisions should reflect individual objectives and risk tolerance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InvestorFAQ;