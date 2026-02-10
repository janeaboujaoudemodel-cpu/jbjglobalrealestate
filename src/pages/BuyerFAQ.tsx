import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { 
  HelpCircle, Shield, Home, Banknote, FileText, Users, Phone, Search, LucideIcon
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
        { question: "Can foreigners buy property in the UAE?", answer: "Yes. Non-residents and foreign nationals can purchase freehold property in designated areas across Dubai and other emirates. Ownership is 100% freehold with full title deed registration." },
        { question: "What is the difference between freehold and leasehold?", answer: "Freehold ownership gives you full ownership of the property and the land it sits on, with no time limit. Leasehold grants you usage rights for a fixed period (typically 30-99 years) after which ownership reverts to the freeholder." },
        { question: "Do I need to be in the UAE to buy property?", answer: "No. Power of Attorney (POA) arrangements allow you to complete the purchase remotely. Our team can guide you through the process and coordinate with notarized POA documents." }
      ]
    },
    {
      id: "costs-fees",
      title: "Costs & Fees",
      icon: Banknote,
      questions: [
        { question: "What are the costs involved in buying property?", answer: "Key costs include: DLD registration fee (4% of property value), agency commission (typically 2%), NOC fee, mortgage registration fee (if applicable), and admin/trustee fees. All costs are disclosed transparently before you commit." },
        { question: "Are there any hidden charges?", answer: "No. We provide a complete cost breakdown before any commitment. All government fees, agency fees, and service charges are itemized and explained clearly." },
        { question: "Do I pay brokerage fees when buying off-plan?", answer: "No. For off-plan purchases, the developer pays the brokerage fee. Buyers do not incur commission charges on off-plan transactions." }
      ]
    },
    {
      id: "mortgage-finance",
      title: "Mortgage & Finance",
      icon: FileText,
      questions: [
        { question: "Can I get a mortgage in the UAE?", answer: "Yes. UAE residents can finance up to 80% of the property value for properties under AED 5M (75% for above). Non-residents can typically finance up to 50-60%. We can connect you with mortgage advisors for pre-approval." },
        { question: "What documents do I need for a mortgage?", answer: "Typically: passport copy, visa copy (if resident), salary certificates or income proof, bank statements (6 months), and existing liability statements. Requirements vary by bank." }
      ]
    },
    {
      id: "process-timeline",
      title: "Process & Timeline",
      icon: Users,
      questions: [
        { question: "How long does the buying process take?", answer: "Ready properties: 2-4 weeks from offer acceptance to transfer. Off-plan: reservation can be completed in 1-2 days, with SPA signing within 30 days. Timelines vary based on mortgage approvals and seller readiness." },
        { question: "What happens after I make an offer?", answer: "Once accepted: MOU signing → deposit payment → NOC application → DLD transfer. We manage every step, keeping you informed throughout the process." }
      ]
    },
    {
      id: "after-purchase",
      title: "After Purchase",
      icon: Shield,
      questions: [
        { question: "Can I rent out my property after buying?", answer: "Yes. As a property owner, you can rent out your property. We offer leasing advisory services to help you find quality tenants and maximize rental returns." },
        { question: "What ongoing costs should I expect?", answer: "Annual service charges (maintenance fees), DEWA deposits, insurance (optional but recommended), and property management fees if you use a management company." }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Buyer FAQ | Property Buying Questions | JBJ Global Real Estate"
        description="Answers to common questions about buying property in the UAE — costs, mortgages, process, and post-purchase support."
        keywords="buyer FAQ, buying property UAE, Dubai property purchase, mortgage UAE, property costs Dubai"
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
