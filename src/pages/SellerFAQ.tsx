import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { HelpCircle, Shield, Banknote, FileText, Clock, Phone, Search, LucideIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { FAQHero } from "@/components/faq/FAQHero";
import { FAQTableOfContents } from "@/components/faq/FAQTableOfContents";
import { FAQFloatingSidebar } from "@/components/faq/FAQFloatingSidebar";

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };

interface FAQCategory { id: string; title: string; icon: LucideIcon; questions: Array<{ question: string; answer: string }>; }

const SellerFAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "selling-basics", title: "Selling Basics", icon: FileText,
      questions: [
        { question: "How do I list my property for sale?", answer: "Contact us with your property details. We'll arrange a viewing, provide a market valuation, and create a professional listing with photography, virtual tours, and targeted marketing." },
        { question: "How long does it take to sell a property?", answer: "Timeline varies by property type, location, and pricing. Well-priced properties in popular areas can sell within 2-8 weeks. We provide regular market feedback to optimize your listing." },
        { question: "Can I sell if I still have a mortgage?", answer: "Yes. The outstanding mortgage balance is settled from the sale proceeds during the transfer process. We coordinate with your bank to obtain a liability letter and manage the settlement." }
      ]
    },
    {
      id: "pricing-valuation", title: "Pricing & Valuation", icon: Banknote,
      questions: [
        { question: "How do you determine the right asking price?", answer: "We conduct a Comparative Market Analysis (CMA) using recent sales data, current listings, market trends, and property condition. Our AI-powered valuation tools provide additional data points for accuracy." },
        { question: "Should I renovate before selling?", answer: "Minor repairs and cosmetic updates can improve appeal and speed up the sale. Major renovations may not always provide a return. We advise on cost-effective improvements based on your property's condition." }
      ]
    },
    {
      id: "costs-selling", title: "Costs When Selling", icon: Banknote,
      questions: [
        { question: "What fees do sellers pay?", answer: "Sellers typically pay: agency commission (2%), NOC fee (varies by developer), and their share of the DLD transfer fee (negotiable). All costs are disclosed upfront before listing." },
        { question: "Are there any tax implications?", answer: "The UAE does not impose capital gains tax on property sales. However, sellers should consult their own tax advisors regarding obligations in their home country." }
      ]
    },
    {
      id: "process", title: "Selling Process", icon: Clock,
      questions: [
        { question: "What is the step-by-step selling process?", answer: "1. Property valuation and listing agreement\n2. Professional marketing and viewings\n3. Offer negotiation and acceptance\n4. MOU signing and deposit collection\n5. NOC application from developer\n6. DLD transfer at the land department" },
        { question: "Do I need to be present for the transfer?", answer: "Not necessarily. You can appoint a representative via Power of Attorney (POA) to complete the transfer on your behalf." }
      ]
    },
    {
      id: "support", title: "Seller Support", icon: Shield,
      questions: [
        { question: "What marketing do you provide?", answer: "Premium photography, virtual tours, targeted online advertising, social media campaigns, database matching with qualified buyers, and listing on major property portals." },
        { question: "How do you screen potential buyers?", answer: "We verify buyer identity, proof of funds or mortgage pre-approval, and purchase timeline. This ensures only serious, qualified buyers view your property." }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead title="Seller FAQ | Property Selling Questions | JBJ Global Real Estate" description="Answers to common questions about selling property in the UAE — pricing, fees, process, and marketing." />
      <FAQHero badge="Seller FAQ" badgeIcon={HelpCircle} title={<>Seller Questions <span className="text-gold">Answered</span></>} description="Everything you need to know about selling property in the UAE." backgroundImage="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2000&q=80"
        actions={<>
          <Button className="relative bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3)]" onClick={() => document.getElementById('faq-content')?.scrollIntoView({ behavior: 'smooth' })}><Search className="w-4 h-4 mr-2 text-black" /><span className="text-gold font-semibold">Browse FAQs</span></Button>
          <Button asChild className="relative bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3)]"><Link to="/contact"><Phone className="w-4 h-4 mr-2 text-black" /><span className="text-gold font-semibold">Ask Our Team</span></Link></Button>
        </>}
      />
      <div className="hidden lg:block fixed right-8 top-1/4 z-[55] max-w-xs" style={{ marginBottom: '180px' }}><FAQFloatingSidebar categories={categories} title="Navigator" /></div>
      <section id="faq-content" className="py-16 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl relative">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="lg:hidden sticky top-0 z-50 -mx-4 px-4 py-3 bg-gradient-to-br from-[#F5EBD7]/95 via-[#E8DCC8]/95 to-[#D4C4A8]/95 backdrop-blur-sm border-b border-gold/20 shadow-lg"><FAQTableOfContents categories={categories} title="FAQ Quick Access" sticky={true} /></div>
          <div className="w-full space-y-16 mt-8">
            {categories.map((category, ci) => (
              <motion.div key={ci} id={`category-${ci}`} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="scroll-mt-40">
                <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl flex items-center justify-center"><category.icon className="w-6 h-6 text-black" /></div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">{category.title}</h2>
                </motion.div>
                <motion.div variants={fadeInUp}><div className="space-y-4">
                  {category.questions.map((faq, fi) => (
                    <Accordion key={fi} type="single" collapsible className="w-full">
                      <AccordionItem value={`${ci}-${fi}`} className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl px-6 py-2 data-[state=open]:border-gold/60 data-[state=open]:shadow-md transition-all">
                        <AccordionTrigger className="text-black text-left hover:text-gold hover:no-underline py-5 text-base font-medium">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-zinc-600 pb-5 leading-relaxed whitespace-pre-line">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
                </div></motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8">
        <div className="container mx-auto px-4"><motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">Still Have Questions?</h2>
            <p className="text-zinc-600 mb-8">Our team is ready to help with your selling journey.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="primary" className="px-6"><Link to="/contact"><Phone className="w-4 h-4 mr-2" />Contact Our Team</Link></Button>
              <Button asChild variant="primary" className="px-6"><Link to="/seller-guide">Read Seller Guide</Link></Button>
            </div>
          </div>
        </motion.div></div>
      </section>
      <section className="py-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8"><div className="container mx-auto px-4"><GuideNavigation current="/seller-faq" guides={GUIDE_LINKS} /></div></section>
      <section className="py-8 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8 mb-8"><div className="container mx-auto px-4"><div className="max-w-4xl mx-auto"><div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6"><p className="text-center text-zinc-600 text-sm"><span className="text-black font-medium">Disclaimer:</span> All content is educational and informational.</p></div></div></div></section>
    </div>
  );
};

export default SellerFAQ;
