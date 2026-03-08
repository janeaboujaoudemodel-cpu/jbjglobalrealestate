import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { HelpCircle, Shield, Banknote, FileText, Home, Users, Phone, Search, LucideIcon, Wrench, AlertTriangle } from "lucide-react";
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
      id: "renting-basics",
      title: "Renting Basics",
      icon: Home,
      questions: [
        {
          question: "What documents do I need to rent a property in the UAE?",
          answer: "To rent a property, you'll typically need:\n\n• Valid passport (original + copy)\n• UAE residency visa (copy)\n• Emirates ID (copy)\n• Employment contract or salary certificate\n• Recent bank statements (some landlords request 3 months)\n• Post-dated cheques for the rent payments\n\nSome landlords may also request a reference letter from your employer or a previous landlord. If you're new to the UAE and don't yet have a visa, some landlords accept a copy of your employment offer letter."
        },
        {
          question: "What costs should I expect when renting?",
          answer: "Beyond the annual rent, budget for:\n\n• Security deposit: 5% of annual rent (unfurnished) or 10% (furnished) — refundable at end of lease\n• Agency fee: 5% of annual rent + VAT (one-time, paid to the letting agent)\n• Ejari registration: Approximately AED 220\n• DEWA connection: AED 2,000 deposit (refundable) + AED 110 activation fee\n• Internet setup: AED 100–300 (du or Etisalat)\n• Moving costs: AED 500–3,000 depending on distance and volume\n• Chiller deposit: AED 2,000–4,000 in some communities (refundable)\n\nTotal move-in costs typically amount to the first cheque + 7–12% of annual rent."
        },
        {
          question: "How many cheques is standard for rent payment?",
          answer: "Rent in the UAE is typically paid in advance via post-dated cheques:\n\n• 1 cheque: Full annual rent upfront — may get you a discount (3–5%)\n• 2 cheques: Semi-annual payments\n• 4 cheques: Quarterly — the most common arrangement currently\n• 6 cheques: Bi-monthly — becoming more common\n• 12 cheques: Monthly — increasingly available but may command higher rent\n\nThe more cheques you offer, the more negotiating power the landlord has on price. Conversely, offering fewer cheques can be a bargaining tool for reduced rent."
        },
        {
          question: "Can I negotiate the rent?",
          answer: "Yes, rent negotiation is common and expected in the UAE market:\n\nNegotiation strategies:\n• Research comparable rents in the same building/area using Bayut and Property Finder\n• Use the RERA Rental Index as your benchmark\n• Offer fewer cheques in exchange for lower rent\n• Sign a longer lease (2 years) for a discount\n• Highlight your profile as a reliable tenant (stable employment, references)\n• Negotiate during off-peak months (May–August when demand is lower)\n\nTypical negotiation range: 5–15% off the listed price, depending on market conditions and vacancy rates in the area."
        }
      ]
    },
    {
      id: "rights-protections",
      title: "Tenant Rights & Protections",
      icon: Shield,
      questions: [
        {
          question: "What are my rights as a tenant in Dubai?",
          answer: "Dubai tenants are protected under Law No. 26 of 2007 (as amended by Law No. 33 of 2008):\n\n• Right to quiet enjoyment of the property\n• Protection from arbitrary eviction — landlord must provide valid grounds and proper notice\n• Right to have the property maintained in a habitable condition\n• Protection from illegal rent increases — RERA Rental Index governs permitted increases\n• Right to renew the lease unless valid eviction grounds exist\n• Right to dispute resolution through the Rental Dispute Centre (RDC)\n• Right to receive security deposit refund (minus legitimate deductions)\n• Right to 90 days written notice before any changes to lease terms"
        },
        {
          question: "Can my landlord increase rent during the lease?",
          answer: "No. During an active lease term, the landlord cannot increase rent. Increases can only happen:\n\n• Upon lease renewal (at the end of the current contract period)\n• With 90 days written notice before the renewal date\n• Within the limits set by the RERA Rental Increase Calculator\n• Based on the official RERA Rental Index for your area and property type\n\nIf you believe an increase is unfair or exceeds RERA limits, you can:\n1. Refuse the increase and cite the RERA calculator\n2. File a case with the Rental Dispute Centre (fee: AED 3.5% of the dispute amount, minimum AED 500)"
        },
        {
          question: "Can my landlord evict me?",
          answer: "Eviction is strictly regulated in Dubai. Valid grounds include:\n\nDuring lease:\n• Non-payment of rent (after 30-day formal notice)\n• Subletting without consent\n• Illegal use of the property\n• Causing significant damage\n• Using residential property for commercial purposes\n\nAt lease expiry (requires 12 months notarized notice):\n• Landlord wants to use the property personally (or for first-degree relative)\n• Major renovation that cannot be done while occupied\n• Demolition of the property\n\nThe landlord CANNOT evict you:\n• Simply because they want to sell (buyer inherits the lease)\n• To re-let at a higher rent\n• Without following proper legal procedures"
        },
        {
          question: "What is the Rental Dispute Centre (RDC) and how does it work?",
          answer: "The RDC is the judicial body for resolving rental disputes in Dubai:\n\n• Handles disputes between landlords and tenants\n• Filing fee: 3.5% of annual rent (minimum AED 500, maximum AED 20,000)\n• Cases are typically heard within 15–30 days of filing\n• Decisions are legally binding and enforceable\n• Both parties can appeal within 15 days of the judgment\n\nCommon cases:\n• Eviction disputes\n• Security deposit disputes\n• Rent increase challenges\n• Maintenance responsibility disputes\n• Early termination disagreements\n\nYou can file a case online through the Dubai Courts website or visit the RDC in person."
        }
      ]
    },
    {
      id: "maintenance-issues",
      title: "Maintenance & Issues",
      icon: Wrench,
      questions: [
        {
          question: "Who pays for maintenance and repairs?",
          answer: "Responsibilities are defined by UAE law:\n\nLandlord pays for:\n• Structural repairs (roof, walls, foundations)\n• Major plumbing (pipes within walls, main drains)\n• Electrical wiring and major systems\n• AC system repairs (central or major component replacement)\n• Appliances that came with the property\n• Any defects that existed before the tenant moved in\n\nTenant pays for:\n• Minor day-to-day maintenance\n• Consumables (light bulbs, filters, batteries)\n• Damage caused by the tenant or guests\n• Cleaning and upkeep of the unit\n• Reporting issues promptly to avoid escalation\n\nIf the landlord refuses to perform required maintenance, tenants can file with the RDC or, in extreme cases, arrange repairs and deduct from rent (with prior RDC approval)."
        },
        {
          question: "What should I do if my AC stops working?",
          answer: "AC is the landlord's responsibility for major repairs:\n\n1. Report the issue to your landlord or property manager immediately (in writing — email/WhatsApp)\n2. If the property has central cooling, contact the building management\n3. For split-unit AC, the landlord should arrange and pay for repair\n4. Regular cleaning/filter replacement is the tenant's responsibility\n5. If the landlord doesn't respond within a reasonable time (48–72 hours), send a formal notice\n6. If still unresolved, you can file with the RDC citing uninhabitable conditions\n\nDocument everything with photos, dates, and written communications."
        },
        {
          question: "Can I make modifications to the rented property?",
          answer: "Generally, tenants should not make structural modifications without landlord consent:\n\n✅ Usually OK without permission:\n• Hanging pictures (small nail holes)\n• Adding curtains/blinds\n• Temporary furniture arrangement\n• Small decorative changes\n\n⚠️ Requires landlord written approval:\n• Painting walls a different color\n• Installing shelving or built-in storage\n• Changing fixtures (taps, handles, lights)\n• Adding a satellite dish\n\n❌ Typically not allowed:\n• Structural changes (removing walls, doors)\n• Plumbing or electrical modifications\n• Major kitchen/bathroom changes\n\nAlways get written approval and agree in advance who will pay to restore the property to its original state at lease end."
        }
      ]
    },
    {
      id: "moving-out",
      title: "Moving Out & Lease End",
      icon: Users,
      questions: [
        {
          question: "What is the process for ending my lease?",
          answer: "When your lease is ending:\n\n1. Decide whether to renew or vacate — notify your landlord at least 90 days before expiry\n2. If vacating, coordinate move-out inspection with the landlord\n3. Cancel or transfer DEWA account\n4. Cancel internet service\n5. Cancel Ejari registration\n6. Return all keys and access cards\n7. Provide forwarding details for security deposit refund\n8. Obtain a move-out permit from building management\n\nThe landlord should inspect the property and process the security deposit refund within 30 days, deducting only for legitimate damages (not normal wear and tear)."
        },
        {
          question: "Can I break my lease early?",
          answer: "Early termination depends on your contract terms:\n\n• If your contract has an early termination clause: Follow the stated terms (usually 2 months rent penalty + remaining rent until the unit is re-let)\n• If no early termination clause: You may be liable for the remaining rent until lease expiry\n• Mutual agreement: You can always negotiate early exit with your landlord\n\nCommon acceptable reasons for early termination:\n• Job loss or relocation\n• Uninhabitable conditions (documented and unresolved by landlord)\n• Mutual written agreement\n\nTip: When signing a new lease, always negotiate an early termination clause (typically 2 months notice + 1–2 months penalty)."
        },
        {
          question: "Will I get my security deposit back?",
          answer: "You should receive your full security deposit back, minus legitimate deductions:\n\nLegitimate deductions:\n• Damage beyond normal wear and tear\n• Unpaid utility bills or service charges owed by the tenant\n• Missing keys or access cards\n• Cleaning costs if the property is left in poor condition\n\nNOT legitimate deductions:\n• Normal wear and tear (faded paint, minor scuffs)\n• Pre-existing damage (documented at move-in)\n• General depreciation of appliances/fixtures\n\nTo protect your deposit:\n• Take detailed photos/video at move-in and move-out\n• Document any existing damage in writing when you first move in\n• Leave the property clean and in good condition\n• If the landlord withholds the deposit unfairly, file with the RDC"
        }
      ]
    },
    {
      id: "special-situations",
      title: "Special Situations",
      icon: AlertTriangle,
      questions: [
        {
          question: "What happens if the property is sold while I'm renting?",
          answer: "Your lease is legally protected:\n\n• The new owner inherits your tenancy agreement — all terms remain in force\n• Your rent cannot be changed during the current lease period\n• You cannot be evicted simply because the property changed ownership\n• Your security deposit obligation transfers to the new owner\n• The new owner must honor the full remaining lease term\n\nIf the new owner attempts to evict you or change terms mid-lease, you can file with the Rental Dispute Centre. The law is firmly on the tenant's side in this situation."
        },
        {
          question: "Can I sublet my apartment?",
          answer: "Subletting requires explicit written consent from your landlord:\n\n• Standard tenancy contracts typically prohibit subletting\n• If permitted, the subletting arrangement must also be registered on Ejari\n• Subletting without consent is grounds for eviction\n• The original tenant remains legally responsible to the landlord\n\nAlternative arrangements:\n• Adding a roommate to the tenancy contract (with landlord's permission)\n• License agreement for a room (less formal, but still needs landlord awareness)\n• Short-term subletting via Airbnb requires DTCM holiday home permit — this is the landlord's responsibility to arrange"
        }
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
