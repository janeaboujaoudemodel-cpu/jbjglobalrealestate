import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { 
  HelpCircle, Home, Banknote, Users, Phone, Search, LucideIcon, 
  FileText, Shield, Globe, Building, MapPin
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
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

interface FAQCategory {
  id: string;
  title: string;
  icon: LucideIcon;
  questions: Array<{ question: string; answer: string }>;
}

const BuyerFAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "buying-basics",
      title: "Buying Basics",
      icon: Home,
      questions: [
        {
          question: "Can foreigners buy property in the UAE?",
          answer: "Yes. Foreign nationals can purchase property in designated freehold areas across the UAE, including Dubai, Abu Dhabi, Sharjah, and Ras Al Khaimah. Freehold ownership grants full ownership rights with no time restrictions. Popular freehold areas in Dubai include Dubai Marina, Downtown Dubai, Palm Jumeirah, JVC, Business Bay, and Dubai Hills Estate."
        },
        {
          question: "What is the difference between freehold and leasehold property?",
          answer: "Freehold ownership gives you complete ownership of the property and the land it sits on, with no time limit. You can sell, lease, or pass it on to heirs freely.\n\nLeasehold ownership grants you the right to use the property for a set period (typically 30–99 years), after which ownership reverts to the freeholder unless renewed. Most areas in the UAE now offer freehold ownership to foreign buyers."
        },
        {
          question: "What types of properties can I buy in the UAE?",
          answer: "The UAE market offers a wide range of property types:\n\n• Apartments & Studios — Most common in urban areas like Dubai Marina and Downtown\n• Villas & Townhouses — Popular in family-oriented communities like Arabian Ranches, DAMAC Hills, and Dubai Hills\n• Penthouses — Luxury units in high-rise towers\n• Off-plan properties — Units purchased directly from developers before or during construction\n• Commercial properties — Offices, retail spaces, and warehouses"
        },
        {
          question: "Should I buy off-plan or ready property?",
          answer: "Both options have advantages:\n\nOff-plan:\n• Lower entry price with flexible payment plans (often 60/40 or 70/30)\n• Potential capital appreciation before handover\n• Brand-new property with latest specifications\n• No brokerage fees (developer pays the agent)\n\nReady property:\n• Immediate possession and rental income\n• What-you-see-is-what-you-get — no construction risk\n• Established community with amenities already operational\n• Easier to obtain mortgage financing"
        }
      ]
    },
    {
      id: "costs-fees",
      title: "Costs & Fees",
      icon: Banknote,
      questions: [
        {
          question: "What are the total costs of buying property in Dubai?",
          answer: "Beyond the purchase price, buyers should budget for:\n\n• DLD Registration Fee: 4% of the purchase price + AED 580 admin fee\n• Agency Fee: 2% of the purchase price + VAT (for ready properties)\n• NOC Fee: AED 500–5,000 (paid to the developer for transfer clearance)\n• Mortgage Registration: 0.25% of the loan amount + AED 290 (if applicable)\n• Trustee Office Fee: AED 4,000 for properties over AED 500,000 + VAT\n• Valuation Fee: AED 2,500–3,500 (if financing through a bank)\n\nTotal additional costs typically range from 7–8% of the property price."
        },
        {
          question: "Are there any annual property taxes in the UAE?",
          answer: "The UAE does not impose annual property taxes, capital gains tax, or income tax on rental earnings. This is one of the key advantages of investing in UAE real estate.\n\nHowever, owners are responsible for:\n• Annual service charges (maintenance fees) — typically AED 10–30 per sq ft depending on the community\n• DEWA (utilities) connection and usage fees\n• Insurance (optional but recommended)"
        },
        {
          question: "Do I pay brokerage fees when buying off-plan?",
          answer: "No. When purchasing off-plan property, the developer compensates the brokerage directly. Buyers do not pay any agency commission. For ready/resale properties, the standard brokerage fee is 2% of the purchase price plus 5% VAT."
        },
        {
          question: "What is the DLD fee and when do I pay it?",
          answer: "The Dubai Land Department (DLD) registration fee is 4% of the property purchase price, plus an admin fee of AED 580. This is paid at the time of property transfer registration. For off-plan properties, a 4% Oqood (pre-registration) fee applies at the time of booking. Some developers offer to cover a portion of the DLD fee as part of promotional offers."
        }
      ]
    },
    {
      id: "mortgage-financing",
      title: "Mortgage & Financing",
      icon: Building,
      questions: [
        {
          question: "Can I get a mortgage as a non-resident buyer?",
          answer: "Yes. UAE banks offer mortgages to non-residents, though terms differ from resident financing:\n\n• Residents: Up to 80% LTV (Loan-to-Value) for properties under AED 5 million; 70% for above\n• Non-residents: Typically 50–65% LTV\n• Interest rates: Currently 4–6% per annum (variable or fixed for 1–5 years)\n• Maximum term: 25 years\n• Age limit: Loan must be repaid by age 65 (salaried) or 70 (self-employed)\n\nRequired documents include passport, proof of income, bank statements (6–12 months), and a credit report from your home country."
        },
        {
          question: "What are the typical payment plans for off-plan properties?",
          answer: "Dubai developers offer attractive payment plans that vary by project:\n\n• Standard: 10–20% on booking, installments during construction, balance on handover\n• Post-handover: 60% during construction, 40% over 2–5 years after handover\n• Extended: Some developers offer 80/20 or even 90/10 plans\n\nPayment plans are interest-free and don't require bank approval, making off-plan purchases accessible to a wider range of buyers."
        },
        {
          question: "What is the minimum down payment required?",
          answer: "For mortgage-financed purchases:\n• First property (residents): 20% minimum down payment for properties under AED 5M, 30% for above\n• First property (non-residents): 35–50% minimum\n\nFor off-plan without mortgage:\n• Typically 10–20% on booking, with the rest in installments per the developer's payment plan\n• No bank approval needed for developer payment plans"
        }
      ]
    },
    {
      id: "process-timeline",
      title: "Process & Timeline",
      icon: FileText,
      questions: [
        {
          question: "What is the step-by-step process for buying ready property?",
          answer: "1. Property search and shortlisting with your agent\n2. Viewing and selection of the property\n3. Offer and negotiation — signing a Memorandum of Understanding (MOU / Form F)\n4. Paying a 10% security deposit (held by the agent or conveyancer)\n5. Obtaining No Objection Certificate (NOC) from the developer\n6. Arranging mortgage pre-approval (if financing)\n7. Property valuation (bank requirement)\n8. Transfer at the Dubai Land Department (DLD) or trustee office\n9. Payment of DLD fee (4%) and transfer of title deed\n10. Receiving keys and title deed in your name\n\nThe entire process typically takes 2–4 weeks for cash purchases, or 4–8 weeks with mortgage financing."
        },
        {
          question: "What is the process for buying off-plan?",
          answer: "1. Select the project and unit with your agent\n2. Complete the booking form and pay the reservation fee (typically AED 5,000–50,000)\n3. Sign the Sales and Purchase Agreement (SPA) with the developer\n4. Pay the DLD Oqood fee (4%)\n5. Follow the payment schedule linked to construction milestones\n6. Receive handover notification upon project completion\n7. Complete snagging (defect inspection)\n8. Pay final installment and collect keys\n9. Title deed issued in your name\n\nOff-plan purchases can span 1–4 years from booking to handover depending on the project timeline."
        },
        {
          question: "What documents do I need to buy property in the UAE?",
          answer: "For most property purchases, you'll need:\n\n• Valid passport (original + copies)\n• UAE residency visa (if applicable, not required for purchase)\n• Emirates ID (for residents)\n• Proof of address\n• Bank statements (for mortgage applications)\n• Salary certificate or proof of income (for mortgage)\n• Power of Attorney (if someone is acting on your behalf)\n\nNon-residents can complete the entire process remotely with a Power of Attorney."
        }
      ]
    },
    {
      id: "areas-locations",
      title: "Areas & Locations",
      icon: MapPin,
      questions: [
        {
          question: "What are the best areas for first-time buyers in Dubai?",
          answer: "Popular areas for first-time buyers offering good value and strong communities:\n\n• JVC (Jumeirah Village Circle) — Affordable apartments and townhouses, central location\n• Dubai Hills Estate — Modern master-planned community with excellent amenities\n• Town Square — Budget-friendly family community with parks and retail\n• Dubai South — Emerging area near Expo City and Al Maktoum Airport\n• Arjan / Al Barsha South — Affordable newer developments with good connectivity\n\nThese areas typically offer entry prices from AED 400,000 for studios to AED 1.5M for 2-bedroom apartments."
        },
        {
          question: "Which areas offer the highest rental yields?",
          answer: "Areas with consistently strong rental yields (6–9% gross) include:\n\n• Discovery Gardens — 8–9% for studios and 1-beds\n• International City — 7–9% for affordable units\n• JVC — 7–8% for apartments\n• Dubai Silicon Oasis — 7–8%\n• Sports City — 6–7%\n• Dubai Marina — 5–7% (premium location with strong demand)\n\nYields vary by unit size, floor level, and specific building. Higher-priced premium areas like Palm Jumeirah typically yield 4–6% but offer stronger capital appreciation."
        }
      ]
    },
    {
      id: "post-purchase",
      title: "Post-Purchase",
      icon: Shield,
      questions: [
        {
          question: "What happens after I complete the purchase?",
          answer: "After receiving your title deed and keys:\n\n1. Register with the community management / owners' association\n2. Set up DEWA (Dubai Electricity & Water Authority) in your name\n3. Connect internet/TV services (du or Etisalat)\n4. Obtain home insurance (recommended)\n5. If renting out: register the tenancy contract on Ejari and list the property\n6. If living in: complete move-in procedures with building management\n\nJBJ Global assists with post-purchase services including tenant sourcing, property management introductions, and resale strategies."
        },
        {
          question: "Can I get a UAE residency visa through property purchase?",
          answer: "Yes. The UAE offers residency visa programs linked to property investment:\n\n• 2-Year Investor Visa: Property value minimum AED 750,000\n• 10-Year Golden Visa: Property value minimum AED 2,000,000\n\nThe Golden Visa allows you to sponsor family members and does not require you to live in the UAE to maintain the visa. Property can be mortgaged, but the minimum equity requirement must be met.\n\nProcessing typically takes 2–4 weeks after property registration."
        },
        {
          question: "How do I sell my property in the future?",
          answer: "When you're ready to sell:\n\n1. Engage a licensed real estate agent (like JBJ Global)\n2. Obtain a valuation to determine market price\n3. List the property on major platforms (Bayut, Property Finder, Dubizzle)\n4. Market through agent networks, social media, and open houses\n5. Negotiate and sign MOU (Form F) with buyer\n6. Obtain NOC from developer\n7. Complete transfer at DLD\n\nFor off-plan properties still under construction, you can assign (flip) the unit to a new buyer, subject to developer approval and applicable fees (typically 2–5% of the purchase price)."
        }
      ]
    },
    {
      id: "international-buyers",
      title: "International Buyers",
      icon: Globe,
      questions: [
        {
          question: "Can I buy property remotely without visiting the UAE?",
          answer: "Yes. Remote purchases are common and legally supported:\n\n• Sign a Power of Attorney (POA) in your home country, attested by the UAE embassy\n• Your agent and POA holder can complete viewings, negotiations, and paperwork\n• Digital signatures are accepted for SPAs with many developers\n• DLD transfer can be completed by your POA representative\n• Some developers offer virtual tours and online booking platforms\n\nHowever, we recommend visiting at least once before purchasing to understand the community and surroundings."
        },
        {
          question: "Are there currency restrictions for international buyers?",
          answer: "No currency restrictions apply for property purchases in the UAE. Key points:\n\n• All transactions are denominated in AED (UAE Dirhams)\n• AED is pegged to USD at 3.6725, providing exchange rate stability\n• International wire transfers are accepted by developers and escrow accounts\n• Many buyers transfer funds via SWIFT from their home banks\n• No restrictions on repatriation of sale proceeds or rental income\n\nConsult your home country's tax advisor regarding reporting obligations for overseas property ownership."
        }
      ]
    }
  ];

  const allFaqItems = categories.flatMap(cat => cat.questions);

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Buyer FAQ | Property Buying Questions | JBJ Global Real Estate"
        description="Answers to common questions about buying property in the UAE — costs, mortgages, process, and post-purchase support."
        keywords="buyer FAQ, buying property UAE, Dubai property purchase, mortgage UAE, property costs Dubai"
        canonicalPath="/buyer-faq"
        faqItems={allFaqItems}
      />
      
      <FAQHero
        badge="Buyer FAQ"
        badgeIcon={HelpCircle}
        title={<>Buyer Questions <span className="text-gold">Answered</span></>}
        description="Everything you need to know about buying property in the UAE."
        backgroundImage="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <Button 
              className="relative bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3)]"
              onClick={() => document.getElementById('faq-content')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Search className="w-4 h-4 mr-2 text-black" />
              <span className="text-gold font-semibold">Browse FAQs</span>
            </Button>
            <Button asChild className="relative bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3)]">
              <Link to="/contact">
                <Phone className="w-4 h-4 mr-2 text-black" />
                <span className="text-gold font-semibold">Ask Our Team</span>
              </Link>
            </Button>
          </>
        }
      />

      <div className="hidden lg:block fixed right-8 top-1/4 z-[55] max-w-xs" style={{ marginBottom: '180px' }}>
        <FAQFloatingSidebar categories={categories} title="Navigator" />
      </div>

      <section id="faq-content" className="py-16 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl relative">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="lg:hidden sticky top-0 z-50 -mx-4 px-4 py-3 bg-gradient-to-br from-[#F5EBD7]/95 via-[#E8DCC8]/95 to-[#D4C4A8]/95 backdrop-blur-sm border-b border-gold/20 shadow-lg">
            <FAQTableOfContents categories={categories} title="FAQ Quick Access" sticky={true} />
          </div>
          <div className="w-full space-y-16 mt-8">
            {categories.map((category, ci) => (
              <motion.div key={ci} id={`category-${ci}`} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="scroll-mt-40">
                <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl flex items-center justify-center">
                    <category.icon className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">{category.title}</h2>
                </motion.div>
                <motion.div variants={fadeInUp}>
                  <div className="space-y-4">
                    {category.questions.map((faq, fi) => (
                      <Accordion key={fi} type="single" collapsible className="w-full">
                        <AccordionItem value={`${ci}-${fi}`} className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl px-6 py-2 data-[state=open]:border-gold/60 data-[state=open]:shadow-md transition-all">
                          <AccordionTrigger className="text-black text-left hover:text-gold hover:no-underline py-5 text-base font-medium">{faq.question}</AccordionTrigger>
                          <AccordionContent className="text-zinc-600 pb-5 leading-relaxed whitespace-pre-line">{faq.answer}</AccordionContent>
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

      <section className="py-16 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">Still Have Questions?</h2>
              <p className="text-zinc-600 mb-8 max-w-xl mx-auto">Our team is here to help with any property buying questions.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild variant="primary" className="px-6"><Link to="/contact"><Phone className="w-4 h-4 mr-2" />Contact Our Team</Link></Button>
                <Button asChild variant="primary" className="px-6"><Link to="/buyer-guide">Read Buyer Guide</Link></Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/buyer-faq" guides={GUIDE_LINKS} />
        </div>
      </section>

      <section className="py-8 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8 mb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6">
              <p className="text-center text-zinc-600 text-sm"><span className="text-black font-medium">Disclaimer:</span> All content is educational and informational. Decisions should reflect individual objectives.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BuyerFAQ;
