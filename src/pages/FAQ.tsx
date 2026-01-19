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

const FAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "working-with-jbj",
      title: "Working With JBJ",
      icon: Users,
      questions: [
        {
          question: "What does JBJ Global Real Estate do?",
          answer: "JBJ Global Real Estate is a licensed UAE real estate brokerage. We specialize exclusively in buying, selling, and renting residential and commercial property. Our role is to guide clients through the real estate transaction process with structured advice, market insight, negotiation support, and transaction coordination."
        },
        {
          question: "Is JBJ Global Real Estate licensed in the UAE?",
          answer: "Yes. JBJ Global Real Estate is a licensed mainland brokerage in Dubai. All brokerage activities are conducted in accordance with UAE real estate regulations and authorities."
        },
        {
          question: "Do you provide financial, mortgage, legal, or visa services directly?",
          answer: "No. JBJ does not provide financial, mortgage, legal, or visa services directly. Where required, we may introduce clients to licensed third-party professionals. Any engagement with those partners is separate and independent from JBJ."
        },
        {
          question: "Who do you typically work with?",
          answer: "We work with end-users, landlords, tenants, investors, and international clients seeking professional guidance in the UAE real estate market."
        }
      ]
    },
    {
      id: "buying",
      title: "Buying Property",
      icon: Home,
      questions: [
        {
          question: "Can non-residents buy property in the UAE?",
          answer: "Yes. Non-residents can purchase property in designated freehold areas across the UAE. Residency is not required to own property."
        },
        {
          question: "How long does the buying process take?",
          answer: "For ready properties, the process typically takes 4–6 weeks from offer acceptance to transfer. Off-plan purchases follow timelines defined by the developer and construction milestones."
        },
        {
          question: "What costs should buyers expect when purchasing?",
          answer: "Costs may include government registration fees, transfer fees, brokerage commission, and developer-related charges. Exact costs depend on the property and are always clarified before proceeding."
        },
        {
          question: "Can JBJ help me choose the right property?",
          answer: "Yes. We assist with property selection based on your objectives, location preferences, budget considerations, and market conditions. We do not provide financial guarantees or investment promises."
        }
      ]
    },
    {
      id: "selling",
      title: "Selling Property",
      icon: Building2,
      questions: [
        {
          question: "Can JBJ help me sell my property?",
          answer: "Yes. We represent property owners in resale and leasing transactions, including pricing strategy, market positioning, buyer qualification, negotiation, and transfer coordination."
        },
        {
          question: "What documents are required to sell a property?",
          answer: "Typical requirements include proof of ownership, identification documents, and developer-related clearances. Requirements may vary depending on the property and developer."
        },
        {
          question: "What is a No Objection Certificate (NOC)?",
          answer: "An NOC is a document issued by the developer confirming there are no outstanding obligations on the property. It is usually required to complete a property transfer."
        },
        {
          question: "Can I sell a property that has a mortgage?",
          answer: "Yes. Mortgaged properties can be sold, subject to coordination with the bank and settlement of any outstanding obligations."
        }
      ]
    },
    {
      id: "renting",
      title: "Renting & Leasing",
      icon: Key,
      questions: [
        {
          question: "Does JBJ handle rentals?",
          answer: "Yes. We assist landlords and tenants with residential and commercial leasing transactions."
        },
        {
          question: "What is required to rent a property in the UAE?",
          answer: "Requirements typically include identification documents, rental payments, security deposit, and contract registration in accordance with local regulations."
        },
        {
          question: "Do you assist landlords with tenant placement?",
          answer: "Yes. We support landlords with pricing guidance, tenant sourcing, contract coordination, and market-aligned leasing strategies."
        }
      ]
    },
    {
      id: "international",
      title: "International Clients",
      icon: Globe,
      questions: [
        {
          question: "Can I buy or sell property remotely?",
          answer: "Yes. Many transactions are handled remotely through secure documentation and authorized representation when required."
        },
        {
          question: "Does buying property guarantee UAE residency?",
          answer: "No. Property ownership may qualify an individual to apply for certain residency options under UAE regulations, but residency approvals are issued solely by government authorities."
        },
        {
          question: "Can transactions be completed if I am outside the UAE?",
          answer: "Yes. With proper documentation and authorization, transactions can be coordinated while you are abroad."
        }
      ]
    },
    {
      id: "compliance",
      title: "Compliance & Transparency",
      icon: Shield,
      questions: [
        {
          question: "Does JBJ provide investment guarantees or ROI promises?",
          answer: "No. JBJ does not offer guaranteed returns, financial promises, or investment assurances. Real estate values are subject to market conditions and external factors."
        },
        {
          question: "How does JBJ ensure transparency?",
          answer: "We provide clear communication, documented processes, and full disclosure throughout every transaction."
        },
        {
          question: "Who is responsible for third-party services introduced by JBJ?",
          answer: "Any third-party services are provided independently by licensed partners. JBJ is not responsible for the performance, advice, or outcomes of third-party services."
        }
      ]
    },
    {
      id: "contact",
      title: "Contact & Next Steps",
      icon: Phone,
      questions: [
        {
          question: "How can I start working with JBJ?",
          answer: "You can contact our team directly to discuss your buying, selling, or renting requirements and receive professional guidance tailored to your situation."
        },
        {
          question: "Is there an obligation to proceed after an initial consultation?",
          answer: "No. Initial discussions are exploratory and carry no obligation to proceed with a transaction."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="FAQ | Frequently Asked Questions | JBJ Global Real Estate"
        description="Find answers to common questions about buying, selling, and renting property in the UAE. Expert guidance on mortgages, legal requirements, costs, and the property transaction process."
        keywords="UAE property FAQ, Dubai real estate questions, buying property UAE, selling property Dubai, mortgage UAE, property costs Dubai"
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

      {/* Floating Sidebar Navigation - Like Buyer Guide (Right Side) - Positioned above chat widget */}
      <div className="hidden lg:block fixed right-8 top-1/4 z-[55] max-w-xs" style={{ marginBottom: '180px' }}>
        <FAQFloatingSidebar 
          categories={categories}
          title="Navigator"
        />
      </div>

      {/* FAQ Content with Sticky TOC Above */}
      <section id="faq-content" className="py-16 bg-black relative">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Sticky FAQ Quick Access - Compact & Above Content (Mobile/Tablet Only) */}
          <div className="lg:hidden sticky top-0 z-50 -mx-4 px-4 py-3 bg-black/95 backdrop-blur-sm border-b border-gold/20 shadow-lg">
            <div className="w-full">
              <FAQTableOfContents 
                categories={categories}
                title="FAQ Quick Access"
                sticky={true}
              />
            </div>
          </div>

          {/* Main Content - Full Bleed Width Stretched Edge-to-Edge */}
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

                {/* Questions - FULL WIDTH single column per category */}
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
              Our team is here to help. Whether you're exploring options or ready to proceed, 
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
                <Link to="/buyer-guide">
                  Read Buyer Guide
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Guide Navigation */}
      <section className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-t border-zinc-200">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/faq" guides={GUIDE_LINKS} />
        </div>
      </section>

      {/* Disclaimer - Premium champagne background */}
      <section className="py-8 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-t border-zinc-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-zinc-500 text-sm leading-relaxed">
              <span className="text-zinc-600 font-medium">Disclaimer:</span> This FAQ is provided 
              for general informational purposes only. It does not constitute legal, financial, or 
              professional advice. Regulations and requirements may change. Consult with qualified 
              professionals for advice specific to your situation.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
