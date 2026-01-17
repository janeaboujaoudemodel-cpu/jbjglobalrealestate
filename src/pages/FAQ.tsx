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
  Phone
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";
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
  title: string;
  icon: typeof HelpCircle;
  questions: Array<{ question: string; answer: string }>;
}

const FAQ = () => {
  const categories: FAQCategory[] = [
    {
      title: "Buying Property",
      icon: Home,
      questions: [
        {
          question: "Can foreigners buy property in the UAE?",
          answer: "Yes, foreigners can purchase property in designated freehold areas across the UAE. Dubai, Abu Dhabi, and other emirates have specific zones where foreign nationals can own property outright with full ownership rights. No UAE residency is required to purchase in these areas."
        },
        {
          question: "What are freehold and leasehold properties?",
          answer: "Freehold ownership gives you full, permanent ownership of the property and the land it sits on. Leasehold ownership grants you property rights for a fixed period (typically 10-99 years), after which ownership reverts to the landowner. Most international buyers prefer freehold properties."
        },
        {
          question: "What costs should I budget for when buying?",
          answer: "Key costs include: Dubai Land Department fee (4% of property value), trustee office fee (AED 4,000-5,000), agency commission (typically 2%), NOC fee from developer (AED 500-5,000), and mortgage registration if applicable (0.25% of loan amount). Always factor in these costs beyond the purchase price."
        },
        {
          question: "How long does the buying process take?",
          answer: "For ready properties, the process typically takes 4-6 weeks from offer acceptance to completion. This includes due diligence, documentation, obtaining NOC from the developer, and the final transfer at the Land Department. Off-plan purchases have different timelines based on construction progress."
        },
        {
          question: "Do I need a UAE bank account to buy property?",
          answer: "While not strictly required, having a UAE bank account makes the transaction smoother, especially for paying deposits and transfer fees. Many buyers open accounts during the purchasing process. International bank transfers are also accepted."
        }
      ]
    },
    {
      title: "Selling Property",
      icon: Building2,
      questions: [
        {
          question: "What documents do I need to sell my property?",
          answer: "Essential documents include: original Title Deed, valid passport and Emirates ID (if applicable), proof of address, original purchase agreement (SPA), and any mortgage-related documents. If selling via Power of Attorney, you'll need a properly attested POA document."
        },
        {
          question: "What is a No Objection Certificate (NOC)?",
          answer: "An NOC is a document from the developer confirming there are no outstanding service charges or fees on the property. It's required for property transfer and typically costs AED 500-5,000. Processing time varies by developer, usually 3-7 working days."
        },
        {
          question: "Can I sell my property if I have an existing mortgage?",
          answer: "Yes, you can sell a mortgaged property. The outstanding mortgage amount will be settled from the sale proceeds, or the buyer can assume the mortgage (with bank approval). Your broker can coordinate with your bank throughout the process."
        },
        {
          question: "How much does it cost to sell a property?",
          answer: "Typical selling costs include: agency commission (2% + VAT), NOC fee (AED 500-5,000), and potentially mortgage early settlement fees. The 4% transfer fee is usually paid by the buyer, though this can be negotiated."
        },
        {
          question: "Can I sell an off-plan property before handover?",
          answer: "Yes, most developers allow resale of off-plan units once a certain payment milestone is reached (typically 40-50% of the purchase price). There may be an assignment fee. Check your SPA and developer policies for specific terms."
        }
      ]
    },
    {
      title: "Mortgages & Financing",
      icon: Banknote,
      questions: [
        {
          question: "Can non-residents get a mortgage in the UAE?",
          answer: "Yes, several UAE banks offer mortgages to non-residents. Typically, non-residents can finance 50-60% of the property value, compared to 75-80% for residents. Requirements and rates vary by bank, so comparing options is advisable."
        },
        {
          question: "What mortgage rates are available?",
          answer: "Mortgage rates in the UAE vary based on the lender, your profile, and whether you choose fixed or variable rates. Generally, rates range from 3.5% to 5.5%. We recommend getting quotes from multiple banks to find the best terms for your situation."
        },
        {
          question: "Should I get pre-approved before house hunting?",
          answer: "Yes, mortgage pre-approval is highly recommended. It clarifies your budget, strengthens your negotiating position, and speeds up the purchase process once you find a property. Pre-approval typically takes 3-5 working days."
        },
        {
          question: "What is the maximum loan-to-value (LTV) ratio?",
          answer: "For UAE residents, LTV can be up to 80% for properties under AED 5 million and 70% for properties over AED 5 million. Non-residents typically qualify for 50-60% LTV. These are maximums; actual approval depends on your financial profile."
        }
      ]
    },
    {
      title: "Legal & Documentation",
      icon: FileText,
      questions: [
        {
          question: "What is an Ejari and why do I need it?",
          answer: "Ejari is the official registration system for tenancy contracts in Dubai. It validates your rental agreement with the relevant authority. Landlords must register their rental agreements through Ejari within 30 days of signing."
        },
        {
          question: "What is the role of the Dubai Land Department?",
          answer: "The Dubai Land Department (DLD) is the government authority responsible for property registration and ownership transfer. All property transactions must be registered with DLD, and they issue the official Title Deed confirming ownership."
        },
        {
          question: "Do I need a lawyer for property transactions?",
          answer: "While not legally required, engaging a lawyer is recommended for complex transactions, first-time buyers, or international purchasers. A lawyer can review contracts, conduct due diligence, and protect your interests throughout the process."
        },
        {
          question: "What is Power of Attorney (POA) and when is it needed?",
          answer: "A Power of Attorney authorizes someone to act on your behalf in legal matters, including property transactions. It's essential if you can't be physically present for the transfer. POA documents must be properly notarized and attested."
        }
      ]
    },
    {
      title: "Off-Plan Properties",
      icon: Clock,
      questions: [
        {
          question: "What are the benefits of buying off-plan?",
          answer: "Off-plan benefits include: typically lower prices than ready properties, flexible payment plans during construction, potential capital appreciation by handover, and the opportunity to customize finishes in some cases."
        },
        {
          question: "What are the risks of off-plan purchases?",
          answer: "Risks include: construction delays, final product differing from plans, developer financial issues, and market value changes by handover. Mitigation includes buying from established developers with good track records and understanding your rights under RERA regulations."
        },
        {
          question: "How do off-plan payment plans work?",
          answer: "Payment plans vary by developer but typically involve: 10-20% on booking, staged payments during construction tied to milestones, and 20-40% on handover. Some developers offer post-handover payment plans. Always review the full payment schedule before committing."
        },
        {
          question: "What happens if the developer delays handover?",
          answer: "UAE law provides buyer protections for significant delays. You may be entitled to compensation or contract cancellation with refund in certain cases. Review your SPA terms and consult with a legal professional if you experience substantial delays."
        }
      ]
    },
    {
      title: "Costs & Fees",
      icon: Calculator,
      questions: [
        {
          question: "What are service charges?",
          answer: "Service charges are annual fees paid by property owners to cover building maintenance, common area upkeep, security, and amenities. Rates vary significantly by building and community, typically ranging from AED 10-40 per square foot. Ask about service charges before purchasing."
        },
        {
          question: "Is there property tax in the UAE?",
          answer: "The UAE has no annual property tax or capital gains tax on property sales. However, there are transaction fees (4% transfer fee to DLD) and operational costs like service charges and municipality fees (typically added to utility bills)."
        },
        {
          question: "What is the housing fee/municipality fee?",
          answer: "The municipality housing fee is 5% of the annual rental value, billed monthly through DEWA (utility) bills for residential properties. Owners pay this based on the property's rental value, even if they live in the property themselves."
        }
      ]
    },
    {
      title: "International Buyers",
      icon: Globe,
      questions: [
        {
          question: "Can I buy property remotely from abroad?",
          answer: "Yes, remote purchases are common. You can conduct viewings virtually, sign documents electronically where permitted, and appoint a representative via Power of Attorney for the final transfer. Your broker can coordinate the entire process."
        },
        {
          question: "Does buying property give me UAE residency?",
          answer: "Property ownership can qualify you for a UAE residency visa. Properties valued at AED 750,000+ may qualify for a 2-year renewable visa. Properties valued at AED 2 million+ may qualify for a 10-year Golden Visa. Requirements and processing vary."
        },
        {
          question: "What currencies can I use to pay?",
          answer: "Property transactions are conducted in UAE Dirhams (AED). You can transfer funds from any currency, though exchange rates and transfer fees apply. UAE banks can help with currency conversion and international transfers."
        }
      ]
    },
    {
      title: "Working with JBJ",
      icon: Users,
      questions: [
        {
          question: "What services does JBJ Global Real Estate provide?",
          answer: "JBJ provides real estate brokerage services including: property search and shortlisting, viewing coordination, market insights and guidance, negotiation support, and transaction management. We can also introduce you to licensed partners for legal and mortgage services."
        },
        {
          question: "How does the partner introduction work?",
          answer: "When you need legal, mortgage, or other specialized services, we can introduce you to licensed professionals in our network. You contract directly with these partners — JBJ facilitates the introduction but is not a party to those service agreements."
        },
        {
          question: "Is JBJ licensed in the UAE?",
          answer: "Yes, JBJ Global Real Estate is a fully licensed Dubai mainland brokerage, registered with the Department of Economic Development (DED). Our agents are RERA-registered and authorized to conduct real estate transactions in Dubai."
        },
        {
          question: "What areas do you cover?",
          answer: "We operate across the UAE with a focus on Dubai's most sought-after communities including Downtown Dubai, Dubai Marina, Palm Jumeirah, Business Bay, JBR, and emerging areas. We can also assist with properties in other emirates upon request."
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
      
      {/* Hero */}
      <GuideHero
        badge="Frequently Asked Questions"
        badgeIcon={HelpCircle}
        title={
          <>
            Your Questions <span className="text-gold">Answered</span>
          </>
        }
        description="Find clear answers to the most common questions about buying, selling, and owning property in the UAE."
        actions={
          <>
            <Button 
              variant="outline"
              className="border-gold/50 text-gold hover:bg-gold/10 px-6"
              onClick={() => document.getElementById('faq-content')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Search className="w-4 h-4 mr-2" />
              Browse FAQs
            </Button>
            <Button asChild className="bg-gold hover:bg-gold/90 text-black font-medium px-6">
              <Link to="/contact">
                <Phone className="w-4 h-4 mr-2" />
                Ask Our Team
              </Link>
            </Button>
          </>
        }
      />

      {/* Category Quick Links */}
      <section className="py-8 bg-white border-y border-zinc-200 sticky top-16 z-20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => document.getElementById(`category-${index}`)?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-black text-zinc-700 hover:text-gold rounded-lg transition-all text-sm font-medium border border-zinc-200 hover:border-black"
              >
                <category.icon className="w-4 h-4" />
                {category.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section id="faq-content" className="py-16 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-16">
            {categories.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                id={`category-${categoryIndex}`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className="scroll-mt-32"
              >
                {/* Category Header */}
                <motion.div 
                  variants={fadeInUp}
                  className="flex items-center gap-4 mb-6"
                >
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <category.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">{category.title}</h2>
                </motion.div>

                {/* Questions */}
                <motion.div variants={fadeInUp}>
                  <Accordion type="single" collapsible className="space-y-3">
                    {category.questions.map((faq, faqIndex) => (
                      <AccordionItem 
                        key={faqIndex} 
                        value={`${categoryIndex}-${faqIndex}`}
                        className="bg-white border border-zinc-200 rounded-xl px-6 data-[state=open]:border-gold/50 data-[state=open]:shadow-md transition-all"
                      >
                        <AccordionTrigger className="text-black text-left hover:text-gold hover:no-underline py-5 text-base font-medium">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-600 pb-5 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
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
              <Button asChild variant="dark" className="px-6">
                <Link to="/contact">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Our Team
                </Link>
              </Button>
              <Button asChild variant="secondary" className="border-zinc-300 text-black hover:bg-zinc-100 px-6">
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
