import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { HelpCircle, Shield, Banknote, FileText, Home, Users, Phone, Search, LucideIcon } from "lucide-react";
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

const LandlordFAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "leasing-basics", title: "Leasing Basics", icon: Home,
      questions: [
        { question: "How do I find tenants for my property?", answer: "We market your property across major portals, social media, and our qualified buyer database. Professional photography, virtual tours, and targeted ads ensure maximum exposure to quality tenants." },
        { question: "How long does it take to find a tenant?", answer: "Well-priced, well-maintained properties in popular areas typically lease within 1-4 weeks. We provide market feedback and pricing guidance to minimize vacancy." },
        { question: "Can I choose my tenants?", answer: "Yes. You have the final say on tenant selection. We pre-screen all applicants, verify employment and references, and present qualified candidates for your approval." }
      ]
    },
    {
      id: "rental-contracts", title: "Rental Contracts", icon: FileText,
      questions: [
        { question: "What should a tenancy contract include?", answer: "A standard Ejari-registered contract includes: property details, rent amount, payment terms, security deposit, maintenance responsibilities, notice periods, and early termination clauses." },
        { question: "Is Ejari registration mandatory?", answer: "Yes. All rental contracts in Dubai must be registered with Ejari. This protects both landlord and tenant and is required for utility connections and visa purposes." }
      ]
    },
    {
      id: "rent-payments", title: "Rent & Payments", icon: Banknote,
      questions: [
        { question: "How many cheques should I accept?", answer: "Payment terms are negotiable. Common structures are 1, 2, 4, 6, or 12 cheques. Fewer cheques may command higher rent. We advise based on market conditions and your cash flow needs." },
        { question: "What if my tenant doesn't pay rent?", answer: "Non-payment is handled through RERA's dispute resolution process. We can guide you through the legal steps, including notice periods and filing with the Rental Disputes Centre." },
        { question: "Can I increase the rent?", answer: "Rent increases are regulated by RERA's rental index calculator. Increases are only permitted at contract renewal and must comply with the prescribed percentage bands based on current market rates." }
      ]
    },
    {
      id: "maintenance", title: "Maintenance & Management", icon: Shield,
      questions: [
        { question: "Who is responsible for maintenance?", answer: "Generally, landlords cover structural repairs, AC systems, and major plumbing. Tenants handle minor maintenance and day-to-day upkeep. Specific responsibilities should be outlined in the tenancy contract." },
        { question: "Do you offer property management services?", answer: "Yes. Our property management services include tenant communication, rent collection, maintenance coordination, inspection reports, and financial statements — so you can earn rental income without the hassle." }
      ]
    },
    {
      id: "legal", title: "Legal & Compliance", icon: Users,
      questions: [
        { question: "Can I evict a tenant?", answer: "Eviction is regulated by law and requires valid grounds (e.g., personal use, major renovation, sale). A 12-month notarized notice is typically required. We can advise on the correct legal process." },
        { question: "What happens if my property is damaged?", answer: "The security deposit covers minor damages beyond normal wear and tear. For significant damage, you can file with the Rental Disputes Centre. We document property condition at move-in and move-out." }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead title="Landlord FAQ | Property Leasing Questions | JBJ Global Real Estate" description="Answers for landlords about leasing, tenant management, maintenance, and rental regulations in the UAE." />
      <FAQHero badge="Landlord FAQ" badgeIcon={HelpCircle} title={<>Landlord Questions <span className="text-gold">Answered</span></>} description="Everything you need to know about leasing your property in the UAE." backgroundImage="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2000&q=80"
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
            <p className="text-zinc-600 mb-8">Our leasing team is here to help with any landlord questions.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="primary" className="px-6"><Link to="/contact"><Phone className="w-4 h-4 mr-2" />Contact Our Team</Link></Button>
              <Button asChild variant="primary" className="px-6"><Link to="/landlord-guide">Read Landlord Guide</Link></Button>
            </div>
          </div>
        </motion.div></div>
      </section>
      <section className="py-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8"><div className="container mx-auto px-4"><GuideNavigation current="/landlord-faq" guides={GUIDE_LINKS} /></div></section>
      <section className="py-8 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8 mb-8"><div className="container mx-auto px-4"><div className="max-w-4xl mx-auto"><div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6"><p className="text-center text-zinc-600 text-sm"><span className="text-black font-medium">Disclaimer:</span> All content is educational and informational.</p></div></div></div></section>
    </div>
  );
};

export default LandlordFAQ;
