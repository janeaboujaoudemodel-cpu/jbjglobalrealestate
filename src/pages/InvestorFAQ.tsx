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

const InvestorFAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "investing-uae",
      title: "Investing in UAE Real Estate",
      icon: Globe,
      questions: [
        {
          question: "Can anyone invest in real estate in the UAE?",
          answer: "Yes. UAE nationals and foreign investors can invest in real estate within designated freehold zones, subject to local regulations."
        },
        {
          question: "Is real estate considered a guaranteed investment?",
          answer: "No. Real estate, like any asset class, carries risk. No investment outcome is guaranteed under any market condition."
        },
        {
          question: "What makes the UAE attractive for property investors?",
          answer: "Regulatory transparency, absence of annual property tax, strong infrastructure, population growth, and long-term government planning."
        },
        {
          question: "Is property investment suitable for short-term goals?",
          answer: "It depends on the asset type, market cycle, and exit strategy. Real estate generally performs best when aligned with medium- to long-term planning."
        }
      ]
    },
    {
      id: "returns-expectations",
      title: "Returns, Risk & Expectations",
      icon: TrendingUp,
      questions: [
        {
          question: "Can ROI or appreciation be guaranteed?",
          answer: "No. Any claim of guaranteed ROI or fixed appreciation is misleading and should be avoided."
        },
        {
          question: "How should investors evaluate potential returns?",
          answer: "By reviewing historical data, rental demand, location fundamentals, supply pipelines, and comparable transactions — not assumptions."
        },
        {
          question: "What risks should investors consider?",
          answer: "Market cycles, liquidity timelines, construction delays (off-plan), regulatory changes, and holding costs."
        },
        {
          question: "Does past performance predict future results?",
          answer: "No. Historical data provides context, not certainty."
        }
      ]
    },
    {
      id: "off-plan-vs-ready",
      title: "Off-Plan vs Ready Properties",
      icon: Building,
      questions: [
        {
          question: "Are off-plan properties better for investors?",
          answer: "Off-plan and ready properties serve different objectives. Suitability depends on timeline, cash flow expectations, and risk tolerance."
        },
        {
          question: "What are the risks of off-plan investing?",
          answer: "Construction delays, market shifts, and dependency on developer performance."
        },
        {
          question: "What are the advantages of ready properties?",
          answer: "Immediate rental potential, clearer valuation benchmarks, and reduced execution risk."
        },
        {
          question: "Can off-plan units be resold before handover?",
          answer: "In many cases yes, subject to developer terms and payment milestones outlined in the SPA."
        }
      ]
    },
    {
      id: "market-data",
      title: "Market Data & Decision Making",
      icon: Shield,
      questions: [
        {
          question: "What data should investors rely on?",
          answer: "Official government data, registered transaction records, rental index benchmarks, and verified market reports."
        },
        {
          question: "Are social media investment claims reliable?",
          answer: "No. Social media content is not regulated and should not be used as a decision-making basis."
        },
        {
          question: "How should market trends be interpreted?",
          answer: "As directional indicators, not predictions. Data should inform judgment, not replace it."
        }
      ]
    },
    {
      id: "fees-costs",
      title: "Fees, Costs & Ownership Structure",
      icon: Banknote,
      questions: [
        {
          question: "What costs should investors budget for?",
          answer: "Transfer fees, registration fees, service charges, maintenance, and holding costs."
        },
        {
          question: "Are there annual property taxes in the UAE?",
          answer: "No annual property tax applies. However, service charges and municipality fees may apply."
        },
        {
          question: "Who pays the 4% DLD transfer fee?",
          answer: "Typically the buyer, unless otherwise agreed between parties."
        },
        {
          question: "Are service charges fixed?",
          answer: "No. They vary by building and community and should be reviewed carefully before purchase."
        }
      ]
    },
    {
      id: "advisory-vs-brokerage",
      title: "Role of Advisory vs Brokerage",
      icon: Users,
      questions: [
        {
          question: "What is the difference between brokerage and investment advisory?",
          answer: "Brokerage facilitates transactions. Investment advisory (non-regulated) focuses on education, market context, and strategic guidance — not financial management."
        },
        {
          question: "Does JBJ provide regulated financial advice?",
          answer: "No. JBJ provides real estate brokerage and non-regulated advisory guidance only."
        },
        {
          question: "Who makes the final investment decision?",
          answer: "Always the investor. Advisory support does not replace personal judgment or independent financial advice."
        }
      ]
    },
    {
      id: "working-with-jbj",
      title: "Working With JBJ Global Real Estate",
      icon: Users,
      questions: [
        {
          question: "How does JBJ approach investor guidance?",
          answer: "JBJ operates on a data-driven, education-first model focused on protecting decision quality rather than promoting specific outcomes."
        },
        {
          question: "Does JBJ prioritize certain developers or projects?",
          answer: "No. Recommendations are based on suitability, not commissions or affiliations."
        },
        {
          question: "Are advisory services charged separately?",
          answer: "Brokerage commissions apply as regulated. Advisory guidance is provided as part of the overall service model where applicable."
        },
        {
          question: "Is JBJ licensed in the UAE?",
          answer: "Yes. JBJ Global Real Estate is a licensed UAE brokerage authorized for buy, sell, and rent activities."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Investor FAQ | Investment Questions Answered | JBJ Global Real Estate"
        description="Find answers to common investor questions about UAE real estate investment, returns, off-plan properties, rental performance, and working with JBJ Global Real Estate."
        keywords="investor FAQ, UAE real estate investment, Dubai property investment, off-plan investment, rental yield Dubai, property investment questions"
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
              Our team is here to help. Whether you're exploring investment options or ready to proceed, 
              we're happy to provide guidance tailored to your situation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild className="px-6 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] text-gold font-semibold border border-gold/40 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300">
                <Link to="/contact">
                  <Phone className="w-4 h-4 mr-2 text-black" />
                  Contact Our Team
                </Link>
              </Button>
              <Button asChild className="px-6 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] text-gold font-semibold border border-gold/40 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300">
                <Link to="/investor-education">
                  Read Investor Education Guide
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Guide Navigation */}
      <section className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-t border-zinc-200">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/investor-faq" guides={GUIDE_LINKS} />
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-t border-zinc-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-zinc-500 text-sm leading-relaxed">
              <span className="text-zinc-600 font-medium">Disclaimer:</span> All content is educational 
              and informational in nature. It does not constitute financial guarantees or investment promises. 
              Decisions should reflect individual objectives and risk tolerance.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InvestorFAQ;
