import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { HelpCircle, Shield, Banknote, FileText, Home, Users, Phone, Search, LucideIcon, Wrench, Scale } from "lucide-react";
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
      id: "leasing-basics",
      title: "Leasing Basics",
      icon: Home,
      questions: [
        {
          question: "What is Ejari and is it mandatory?",
          answer: "Ejari is the official tenancy contract registration system in Dubai, managed by the Real Estate Regulatory Agency (RERA). It is mandatory for all rental agreements.\n\n• Ejari validates the tenancy contract legally\n• Required for the tenant to connect DEWA (utilities), obtain a residency visa, and access other government services\n• Registration fee is approximately AED 220\n• The contract details (rent, duration, terms) are recorded in the Ejari system\n• Both landlord and tenant receive a registered Ejari certificate\n\nFailure to register on Ejari can result in penalties and complications in any future disputes."
        },
        {
          question: "How do I set the right rental price for my property?",
          answer: "To determine competitive rental pricing:\n\n• Check the RERA Rental Index: The official benchmark for rental values by area, building, and unit type\n• Research comparable listings on Bayut and Property Finder\n• Consider your property's condition, view, floor level, and furnishing\n• Factor in market conditions — vacancy rates in your community\n• Account for amenities your building offers vs. competitors\n\nOverpricing leads to extended vacancies (often costlier than a slightly lower rent). We recommend pricing at or slightly below market to attract quality tenants quickly."
        },
        {
          question: "Can I rent my property furnished or unfurnished?",
          answer: "Both options are viable in the UAE market:\n\n• Unfurnished: More common for annual leases; attracts long-term tenants; lower maintenance costs\n• Furnished: Commands 20–40% higher rent; popular in tourist areas (Marina, Downtown, JBR); higher tenant turnover\n• Short-term furnished: Requires a holiday home permit from DTCM; highest yields but most management-intensive\n\nThe choice depends on your target tenant profile, location, and willingness to manage furnishings."
        }
      ]
    },
    {
      id: "rental-contracts",
      title: "Rental Contracts & Regulations",
      icon: FileText,
      questions: [
        {
          question: "What should be included in a tenancy contract?",
          answer: "A proper UAE tenancy contract must include:\n\n• Full names and identification of landlord and tenant\n• Property details (unit number, size, location)\n• Lease duration (typically 12 months)\n• Annual rent amount and payment method (number of cheques)\n• Security deposit amount (typically 5% for unfurnished, 10% for furnished)\n• Maintenance responsibilities\n• Notice period for non-renewal (90 days per RERA regulations)\n• Terms for early termination\n• DEWA and service charge responsibilities\n\nWe recommend using RERA-approved standard tenancy contracts to ensure legal compliance."
        },
        {
          question: "Can I increase rent, and by how much?",
          answer: "Rent increases in Dubai are regulated by RERA's Rental Increase Calculator:\n\n• If current rent is 10% or less below market average: No increase allowed\n• 11–20% below market: Up to 5% increase\n• 21–30% below market: Up to 10% increase\n• 31–40% below market: Up to 15% increase\n• More than 40% below market: Up to 20% increase\n\nKey rules:\n• 90 days written notice is required before any increase\n• Increases are only applicable upon lease renewal\n• The RERA Rental Index is the official reference for market rates\n• Tenants can dispute unreasonable increases through the Rental Dispute Centre (RDC)"
        },
        {
          question: "How many cheques should I accept for rent payment?",
          answer: "Cheque structure is negotiable between landlord and tenant:\n\n• 1 cheque: Best for landlords — full annual rent upfront. Increasingly rare and may limit your tenant pool\n• 2 cheques: Common compromise — semi-annual payments\n• 4 cheques: Quarterly — most common in the current market\n• 6 or 12 cheques: Attracts the widest tenant pool but requires more administration\n\nAccepting more cheques typically allows you to command slightly higher rent. The trend in Dubai is moving toward 4–6 cheques. Some landlords now accept bank transfers instead of cheques."
        }
      ]
    },
    {
      id: "tenant-management",
      title: "Tenant Management",
      icon: Users,
      questions: [
        {
          question: "How do I find reliable tenants?",
          answer: "To attract and screen quality tenants:\n\n• List on major portals (Bayut, Property Finder, Dubizzle) with professional photos\n• Work with a licensed real estate agent who can pre-screen applicants\n• Verify employment and salary (standard practice is rent should be ≤30% of annual income)\n• Check references from previous landlords\n• Verify identification documents\n• Consider background checks for higher-value properties\n• Use Ejari history to check rental track record\n\nJBJ Global provides tenant sourcing and screening services as part of our landlord support."
        },
        {
          question: "What can I do if my tenant doesn't pay rent?",
          answer: "Dubai law provides clear recourse for non-payment:\n\n1. Send a formal written notice (notarized) giving 30 days to pay\n2. If unpaid, file a case with the Rental Dispute Centre (RDC)\n3. RDC can issue eviction orders for non-payment\n4. A bounced cheque is a criminal offense in the UAE — you can file a police report\n\nPrevention is better than cure:\n• Screen tenants thoroughly before leasing\n• Require post-dated cheques for the full lease period\n• Include clear penalty clauses in the tenancy contract\n• Maintain open communication with tenants about any payment difficulties"
        },
        {
          question: "Can I evict a tenant, and what are the grounds?",
          answer: "Under UAE Law No. 33 of 2008 (as amended), landlords can request eviction for:\n\n• Non-payment of rent after 30-day notice\n• Subletting without consent\n• Using property for illegal purposes\n• Making unauthorized modifications\n• Property left vacant for 30+ consecutive days (commercial) or 90 days (residential)\n\nFor no-fault eviction (e.g., personal use, major renovation, demolition):\n• 12 months written notice via notary public is required\n• Must be served upon or before the lease expiry date\n• Tenant has the right to contest through RDC\n\nSelling the property does NOT automatically terminate an existing lease."
        }
      ]
    },
    {
      id: "maintenance",
      title: "Maintenance & Management",
      icon: Wrench,
      questions: [
        {
          question: "Who is responsible for property maintenance — landlord or tenant?",
          answer: "UAE law clearly divides responsibilities:\n\nLandlord is responsible for:\n• Structural repairs (walls, roof, foundation)\n• Major plumbing and electrical systems\n• Air conditioning system (central AC or major repairs)\n• Common area maintenance (via service charges)\n• Appliances provided by the landlord\n\nTenant is responsible for:\n• Day-to-day minor maintenance\n• Keeping the property in good condition\n• Minor repairs caused by normal wear and tear\n• Reporting major issues promptly\n• Any damage caused by the tenant or their guests\n\nClear maintenance clauses in the tenancy contract prevent disputes."
        },
        {
          question: "Should I hire a property management company?",
          answer: "Property management makes sense if:\n\n• You own multiple rental properties\n• You live outside the UAE\n• You prefer hands-off management\n• You have short-term / holiday rentals\n\nTypical property management fees:\n• Annual management: 5–8% of annual rent\n• Holiday home management: 15–25% of rental income\n\nServices typically include:\n• Tenant sourcing and screening\n• Rent collection and accounting\n• Maintenance coordination\n• Ejari registration and renewals\n• Regular property inspections\n• Handling tenant queries and complaints"
        },
        {
          question: "What are service charges and how do they work?",
          answer: "Service charges cover the maintenance of common areas and shared facilities:\n\n• Charged annually per square foot of your property\n• Typical range: AED 10–30 per sq ft (varies by community and amenities)\n• Covers: building maintenance, security, landscaping, pool, gym, elevators, common utilities\n• Set by the Owners' Association and approved by RERA\n• Must be paid regardless of whether the property is occupied or vacant\n\nLandlords should factor service charges into their net yield calculations. Some landlords pass DEWA or chiller charges to tenants — this should be clearly stated in the tenancy contract."
        }
      ]
    },
    {
      id: "legal-compliance",
      title: "Legal & Compliance",
      icon: Scale,
      questions: [
        {
          question: "Do I need a license to rent out my property in Dubai?",
          answer: "For standard long-term leases (12+ months), no special license is required beyond:\n\n• Valid title deed in your name\n• Ejari registration of the tenancy contract\n\nFor short-term/holiday rentals, you need:\n• Holiday Home permit from the Department of Tourism and Commerce Marketing (DTCM)\n• Registration with an approved holiday home operator\n• Compliance with DTCM standards for furnishing and amenities\n• Regular inspections and quality audits\n\nPenalties for operating unlicensed holiday homes can be severe, including fines and blacklisting."
        },
        {
          question: "What happens to my tenancy if I sell the property?",
          answer: "Under UAE law, selling a property does NOT terminate an existing tenancy:\n\n• The new owner inherits the current tenancy agreement\n• All terms and conditions remain in force until lease expiry\n• The new owner cannot increase rent or evict during the current lease period\n• The tenant's security deposit obligation transfers to the new owner\n\nIf you want to sell vacant, you must:\n• Wait for the lease to expire naturally, OR\n• Negotiate early termination with the tenant (usually involves compensation), OR\n• Provide 12 months eviction notice for 'owner use' (must be genuine)"
        }
      ]
    }
  ];

  const allFaqItems = categories.flatMap(cat => cat.questions);

  return (
    <div className="min-h-screen bg-black">
      <SEOHead title="Landlord FAQ | Property Leasing Questions | JBJ Global Real Estate" description="Answers for landlords about leasing, tenant management, maintenance, and rental regulations in the UAE." canonicalPath="/landlord-faq" faqItems={allFaqItems} />
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
