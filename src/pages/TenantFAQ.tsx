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

const TenantFAQ = () => {
  const categories: FAQCategory[] = [
    {
      id: "renting-basics", title: "Renting Basics", icon: Home,
      questions: [
        { question: "What documents do I need to rent a property?", answer: "Typically: passport copy, visa copy (or entry stamp for new arrivals), Emirates ID, salary certificate or employment letter, and recent bank statements. Requirements may vary by landlord." },
        { question: "How much deposit is required?", answer: "Security deposits are typically 5% of annual rent for unfurnished properties and 10% for furnished. This is refundable at the end of the tenancy, minus any deductions for damages beyond normal wear." },
        { question: "Can I rent without a UAE visa?", answer: "It's possible in some cases, but most landlords require a valid UAE residence visa. Tourist visa holders may be able to rent short-term furnished apartments." }
      ]
    },
    {
      id: "rent-payments", title: "Rent & Payments", icon: Banknote,
      questions: [
        { question: "How is rent typically paid?", answer: "Rent in the UAE is usually paid via post-dated cheques — commonly 1, 2, 4, 6, or 12 cheques per year. Some landlords now accept bank transfers or card payments." },
        { question: "Can my rent be increased during the contract?", answer: "No. Rent cannot be increased during an active tenancy contract. Increases can only occur at renewal and must comply with RERA's rental index calculator." },
        { question: "What if I can't afford a rent increase at renewal?", answer: "You can negotiate with the landlord. If the increase exceeds RERA guidelines, you can dispute it through the Rental Disputes Centre. You're not obligated to accept unjustified increases." }
      ]
    },
    {
      id: "rights-protections", title: "Rights & Protections", icon: Shield,
      questions: [
        { question: "What are my rights as a tenant?", answer: "Key tenant rights include: right to a habitable property, right to peaceful enjoyment, protection from unjust eviction (12-month notice required), protection against excessive rent increases, and right to dispute resolution through RERA." },
        { question: "Can my landlord enter the property without notice?", answer: "No. Landlords must provide reasonable notice and obtain your consent before entering the property, except in genuine emergencies." },
        { question: "Can I be evicted before my contract ends?", answer: "Eviction during an active contract is only possible for specific legal reasons (e.g., non-payment, illegal use). The landlord must follow the legal process through the Rental Disputes Centre." }
      ]
    },
    {
      id: "maintenance-issues", title: "Maintenance & Issues", icon: FileText,
      questions: [
        { question: "Who pays for maintenance and repairs?", answer: "Landlords are responsible for structural repairs, AC units, plumbing, and major systems. Tenants typically handle minor maintenance, cleaning, and day-to-day upkeep as outlined in the contract." },
        { question: "What if the landlord won't fix something?", answer: "Document the issue in writing and request repair. If the landlord doesn't respond within a reasonable time, you can file a complaint with RERA or the Rental Disputes Centre." }
      ]
    },
    {
      id: "moving-out", title: "Moving Out", icon: Users,
      questions: [
        { question: "How much notice do I need to give?", answer: "Standard notice is 90 days before contract expiry for non-renewal. Early termination clauses (if any) should be specified in your tenancy contract. Some contracts include a 2-month early exit penalty." },
        { question: "How do I get my security deposit back?", answer: "Return the property in good condition (normal wear accepted), settle all utility bills, cancel Ejari registration, and return keys. The landlord should refund the deposit within 30 days of handover." }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead title="Tenant FAQ | Renting Questions Answered | JBJ Global Real Estate" description="Answers to common tenant questions about renting in the UAE — deposits, rights, maintenance, and moving out." />
      <FAQHero badge="Tenant FAQ" badgeIcon={HelpCircle} title={<>Tenant Questions <span className="text-gold">Answered</span></>} description="Everything you need to know about renting property in the UAE." backgroundImage="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2000&q=80"
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
            <p className="text-zinc-600 mb-8">Our leasing team is ready to assist with any tenant questions.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="primary" className="px-6"><Link to="/contact"><Phone className="w-4 h-4 mr-2" />Contact Our Team</Link></Button>
              <Button asChild variant="primary" className="px-6"><Link to="/tenant-guide">Read Tenant Guide</Link></Button>
            </div>
          </div>
        </motion.div></div>
      </section>
      <section className="py-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8"><div className="container mx-auto px-4"><GuideNavigation current="/tenant-faq" guides={GUIDE_LINKS} /></div></section>
      <section className="py-8 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8 mb-8"><div className="container mx-auto px-4"><div className="max-w-4xl mx-auto"><div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6"><p className="text-center text-zinc-600 text-sm"><span className="text-black font-medium">Disclaimer:</span> All content is educational and informational.</p></div></div></div></section>
    </div>
  );
};

export default TenantFAQ;
