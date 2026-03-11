import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { 
  HelpCircle, 
  Home, 
  Building2, 
  Banknote, 
  FileText, 
  Key, 
  Globe,
  Shield,
  Calculator,
  Users,
  Clock,
  Landmark,
  Search,
  Phone,
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

const FAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "about-jbj",
      title: "About JBJ Global Real Estate",
      icon: Building2,
      questions: [
        {
          question: "Who is JBJ Global Real Estate?",
          answer: "JBJ Global Real Estate is a licensed real estate brokerage operating in the UAE, specializing in buying, selling, and renting residential and investment properties. We work with local and international clients and operate within UAE real estate regulations."
        },
        {
          question: "Is JBJ Global Real Estate a developer?",
          answer: "No. JBJ Global Real Estate is an independent brokerage. We do not develop properties. Our role is to analyze the market, compare opportunities, and guide clients objectively across multiple developers, locations, and property types."
        },
        {
          question: "Are you licensed in the UAE?",
          answer: "Yes. JBJ Global Real Estate is fully licensed to operate in the UAE for real estate brokerage activities, including buying, selling, and renting properties. All transactions are conducted in compliance with local laws and regulations."
        }
      ]
    },
    {
      id: "fees-services",
      title: "Fees & Services",
      icon: Banknote,
      questions: [
        {
          question: "Do you charge clients for your services?",
          answer: "This depends on the type of transaction:\n\n• Off-plan purchases: Buyers do not pay agency fees. Brokerages are compensated directly by developers.\n• Ready property purchases or sales: Agency fees apply as per UAE regulations and are disclosed clearly before proceeding.\n• Leasing services: Fees follow Dubai's regulated brokerage commission structure."
        },
        {
          question: "Do you guarantee returns on investment?",
          answer: "No. There are no guaranteed returns in real estate. Any company claiming guaranteed ROI is misrepresenting market reality. We provide data-driven analysis and guidance, but all investment outcomes depend on market conditions and individual decisions."
        }
      ]
    },
    {
      id: "property-selection",
      title: "Property Selection",
      icon: Home,
      questions: [
        {
          question: "How do you select properties to recommend?",
          answer: "Recommendations are based on:\n\n• Official government and regulatory data\n• Market supply and demand trends\n• Location fundamentals\n• Developer track records\n• Alignment with the client's stated objectives\n\nWe do not promote properties based on commissions or personal interests."
        }
      ]
    },
    {
      id: "international-clients",
      title: "International Clients",
      icon: Globe,
      questions: [
        {
          question: "Can international clients buy property through JBJ Global Real Estate?",
          answer: "Yes. International buyers can purchase property in designated freehold areas across the UAE. We regularly assist overseas clients with remote viewings, documentation coordination, and transaction support."
        },
        {
          question: "Do I need to be physically present in the UAE to buy property?",
          answer: "Not necessarily. Many transactions are completed remotely using secure documentation processes. Power of Attorney arrangements can be used when physical presence is not possible."
        }
      ]
    },
    {
      id: "additional-services",
      title: "Additional Services & Coverage",
      icon: Shield,
      questions: [
        {
          question: "Do you provide legal or financial services?",
          answer: "JBJ Global Real Estate does not provide legal or financial services. When required, we may introduce clients to licensed third-party professionals. Any engagement with third parties is contracted directly between the client and the service provider."
        },
        {
          question: "What areas do you cover?",
          answer: "We operate across the UAE, with a primary focus on Dubai's established and emerging residential and investment communities. Assistance in other emirates is available upon request."
        }
      ]
    },
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Phone,
      questions: [
        {
          question: "How do I start working with JBJ Global Real Estate?",
          answer: "You can contact us through the website to discuss your objectives. From there, we provide structured guidance, market insights, and next steps based on your goals."
        }
      ]
    }
  ];

  // Flatten all FAQ items for JSON-LD structured data
  const allFaqItems = categories.flatMap(cat => cat.questions);

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="FAQ | Frequently Asked Questions | JBJ Global Real Estate"
        description="Find answers to common questions about buying, selling, and renting property in the UAE. Expert guidance on mortgages, legal requirements, costs, and the property transaction process."
        keywords="UAE property FAQ, Dubai real estate questions, buying property UAE, selling property Dubai, mortgage UAE, property costs Dubai"
        canonicalPath="/faq"
        faqItems={allFaqItems}
      />
      
      {/* Hero with Video/Image Background */}
      <FAQHero
        badge="Frequently Asked Questions"
        badgeIcon={HelpCircle}
        title={
          <>
            Your Questions <span className="text-gold">Answered</span>
          </>
        }
        description="Find clear answers to the most common questions about buying, selling, and owning property in the UAE."
        backgroundImage="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=80"
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

      {/* Floating Sidebar Navigation - Like Buyer Guide (Right Side) - Positioned above chat widget */}
      <div className="hidden lg:block fixed right-8 top-1/4 z-[55] max-w-xs" style={{ marginBottom: '180px' }}>
        <FAQFloatingSidebar 
          categories={categories}
          title="Navigator"
        />
      </div>

      {/* FAQ Content with Sticky TOC Above */}
      <section id="faq-content" className="bg-black relative">
        {/* Sticky FAQ Quick Access - Compact & Above Content (Mobile/Tablet Only) */}
        <div className="lg:hidden sticky top-0 z-50 px-4 py-3 bg-black/95 backdrop-blur-sm border-b border-gold/20 shadow-lg">
          <FAQTableOfContents categories={categories} title="FAQ Quick Access" sticky={true} />
        </div>

        {/* Categories - each category gets Layer 2 (active) full-bleed, and questions are Layer 3 */}
        <div className="divide-y divide-gold/20">
          {categories.map((category, categoryIndex) => (
            <section
              key={categoryIndex}
              id={`category-${categoryIndex}`}
              className="py-12 md:py-16 bg-black scroll-mt-40"
            >
              <div className="jj-layer-2">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={staggerContainer}
                >
                  {/* Category Header (inside Layer 2) */}
                  <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 jj-icon-box-active rounded-xl">
                      <category.icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-black">{category.title}</h2>
                  </motion.div>

                  {/* Questions (Layer 3 cards) */}
                  <motion.div variants={fadeInUp}>
                    <div className="space-y-4">
                      {category.questions.map((faq, faqIndex) => (
                        <Accordion key={faqIndex} type="single" collapsible className="w-full">
                          <AccordionItem
                            value={`${categoryIndex}-${faqIndex}`}
                            data-accordion-item={`${categoryIndex}-${faqIndex}`}
                            className="jj-card-inner p-0 overflow-hidden data-[state=open]:border-gold transition-all"
                          >
                            <AccordionTrigger className="px-6 py-5 text-black text-left hover:text-gold hover:no-underline text-base font-medium">
                              {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-5 text-zinc-700 leading-relaxed">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </section>
          ))}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 bg-black">
        <div className="jj-layer-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="jj-card-inner max-w-3xl mx-auto text-center"
          >
            <div className="w-14 h-14 jj-icon-box-active rounded-xl mx-auto mb-4">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">Still Have Questions?</h2>
            <p className="text-zinc-700 mb-8 max-w-xl mx-auto leading-relaxed">
              Our team is here to help. Whether you're exploring options or ready to proceed, we’re happy to provide guidance tailored to your situation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="primary" className="px-6">
                <Link to="/contact">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Our Team
                </Link>
              </Button>
              <Button asChild variant="secondary" className="px-6">
                <Link to="/buyer-guide">Read Buyer Guide</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Guide Navigation - Active Champagne Layer */}
      <section className="py-12 bg-black">
        <div className="jj-layer-2">
          <GuideNavigation current="/faq" guides={GUIDE_LINKS} />
        </div>
      </section>

      {/* Disclaimer - Premium champagne background */}
      <section className="py-10 bg-black border-t border-gold/20">
        <div className="jj-layer-2">
          <div className="jj-card-inner max-w-4xl mx-auto">
            <p className="text-center text-zinc-700 text-sm leading-relaxed">
              <span className="text-black font-semibold">Disclaimer:</span> This FAQ is provided for general informational purposes only. It does not constitute legal, financial, or professional advice. Regulations and requirements may change. Consult qualified professionals for advice specific to your situation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
