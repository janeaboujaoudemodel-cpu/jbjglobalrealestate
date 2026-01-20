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
      title: "Investing in the UAE",
      icon: Globe,
      questions: [
        {
          question: "Is real estate investment in the UAE regulated?",
          answer: "Yes. The UAE property market is governed by official authorities such as the Dubai Land Department and RERA, providing transparency and legal structure. Regulation does not eliminate market risk."
        },
        {
          question: "Can international investors own property?",
          answer: "Yes. Foreign nationals can purchase property in designated freehold areas without residency requirements."
        }
      ]
    },
    {
      id: "returns-expectations",
      title: "Returns & Expectations",
      icon: TrendingUp,
      questions: [
        {
          question: "Do you offer guaranteed returns?",
          answer: "No. Guaranteed returns do not exist in real estate. We provide guidance based on data, market behavior, and historical performance — not assurances."
        },
        {
          question: "How should returns be evaluated?",
          answer: "Returns should be assessed holistically, considering rental income, long-term value trends, holding costs, and market timing."
        }
      ]
    },
    {
      id: "off-plan",
      title: "Off-Plan Investment",
      icon: Building,
      questions: [
        {
          question: "Is off-plan investment suitable for all investors?",
          answer: "Off-plan investments involve construction, timing, and market-cycle risk. Suitability depends on individual objectives and risk tolerance."
        },
        {
          question: "Can off-plan properties be resold before completion?",
          answer: "In many cases, yes — subject to developer policies, payment milestones, and assignment fees."
        }
      ]
    },
    {
      id: "rental-performance",
      title: "Rental Performance",
      icon: Banknote,
      questions: [
        {
          question: "How is rental demand assessed?",
          answer: "Through rental index data, transaction volumes, tenant demographics, and supply analysis within specific communities."
        },
        {
          question: "Does JBJ manage properties directly?",
          answer: "JBJ provides brokerage and advisory services. Property management may be introduced through licensed partners where appropriate."
        }
      ]
    },
    {
      id: "costs-structure",
      title: "Costs & Structure",
      icon: Banknote,
      questions: [
        {
          question: "What costs should investors plan for?",
          answer: "Transaction fees, service charges, maintenance, vacancy periods, and operational costs should be factored into any strategy."
        },
        {
          question: "Are there property taxes?",
          answer: "The UAE does not impose annual property or capital gains taxes, though transaction and operational fees apply."
        }
      ]
    },
    {
      id: "working-with-jbj",
      title: "Working With JBJ",
      icon: Users,
      questions: [
        {
          question: "What is JBJ's role?",
          answer: "We provide education, analysis, market guidance, and transactional support. Investment decisions always remain with the client."
        },
        {
          question: "Are legal or mortgage services provided directly?",
          answer: "These services are introduced through licensed third-party partners. Clients contract directly with those providers."
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
