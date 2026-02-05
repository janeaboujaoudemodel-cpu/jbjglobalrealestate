import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { 
  Shield, 
  Home, 
  Users, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  ArrowDown,
  Globe,
  Briefcase,
  Clock,
  HelpCircle,
  Phone,
  MessageCircle,
  Scale,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideCTA } from "@/components/guides/GuideCTA";


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

const GoldenVisaGuide = () => {
  // Eligibility Criteria
  const eligibilityCriteria = [
    "One or more properties with a total registered value of AED 2,000,000 or more",
    "Properties must be registered with the UAE Land Department",
    "Properties may be ready or off-plan, subject to official registration",
    "Properties may be fully paid or financed, in accordance with approved regulations",
    "A formal Golden Visa application must be submitted to the competent authority"
  ];

  // Application Process
  const applicationProcess = [
    { step: 1, title: "Property ownership verified via the Land Department" },
    { step: 2, title: "Golden Visa application submitted through official channels" },
    { step: 3, title: "Government review and validation" },
    { step: 4, title: "Visa issuance upon approval" }
  ];

  // What the Golden Visa Offers
  const goldenVisaOffers = [
    { icon: Clock, text: "Long-term UAE residency (up to 10 years, renewable)" },
    { icon: Users, text: "No local sponsor required" },
    { icon: Home, text: "Ability to sponsor eligible family members" },
    { icon: Shield, text: "Residency stability linked to qualifying investment" }
  ];

  // JBJ Role
  const jbjRole = [
    "Provides property investment advisory",
    "Assists in identifying eligible properties",
    "Coordinates with licensed visa partners",
    "Does NOT issue visas and is not a government authority"
  ];

  // FAQs - Official wording
  const faqs = [
    {
      question: "Does buying property automatically grant a Golden Visa?",
      answer: "No. Owning qualifying property allows the investor to apply for the Golden Visa. Issuance is subject to official government approval."
    },
    {
      question: "What is the minimum investment required?",
      answer: "A total registered property value of AED 2,000,000 or more."
    },
    {
      question: "Can multiple properties be combined?",
      answer: "Yes, provided the combined registered value meets the threshold."
    },
    {
      question: "Are off-plan properties eligible?",
      answer: "Yes, if officially registered and compliant with regulations."
    },
    {
      question: "Are mortgaged properties accepted?",
      answer: "Financed properties may be accepted if they meet regulatory conditions."
    },
    {
      question: "Who issues the Golden Visa?",
      answer: "The UAE government through the designated immigration authority."
    },
    {
      question: "Does JBJ approve or issue visas?",
      answer: "No. JBJ provides advisory and partner coordination only."
    }
  ];

  // TOC Items
  const tocItems = [
    { id: 'what-is', title: 'What Is the Golden Visa?', icon: Shield },
    { id: 'eligibility', title: 'Eligibility Criteria', icon: CheckCircle2 },
    { id: 'process', title: 'Application Process', icon: FileText },
    { id: 'benefits', title: 'What It Offers', icon: Globe },
    { id: 'jbj-role', title: 'JBJ Role', icon: Briefcase },
    { id: 'faq', title: 'FAQ', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="UAE Golden Visa Through Real Estate Investment | JBJ Global Real Estate"
        description="Learn how property investment qualifies you to apply for the UAE Golden Visa. Official eligibility criteria, application process, and JBJ advisory support."
        keywords="UAE Golden Visa, Golden Visa real estate, Dubai Golden Visa, property investment visa, UAE residency, AED 2 million investment"
      />

      {/* Table of Contents - Fixed Right Sidebar */}
      <GuideTableOfContents 
        items={tocItems}
        ctaAction={{
          label: "Speak With an Advisor",
          href: "/contact",
          icon: Phone
        }}
      />

      {/* Premium Hero */}
      <GuideHero
        badge="Golden Visa Guide"
        badgeIcon={Shield}
        title={
          <>
            Secure Long-Term UAE Residency{" "}
            <span className="text-gold">Through Property Investment</span>
          </>
        }
        description="The UAE Golden Visa offers eligible real estate investors a long-term residency pathway, subject to meeting official government requirements and completing the approved application process."
        backgroundImage="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <button 
              onClick={() => document.getElementById('eligibility')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold rounded-lg md:rounded-xl transition-all duration-300 bg-transparent"
              style={{
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
              }}
            >
              <ArrowDown className="w-4 h-4 text-gold group-hover:text-black transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
              <span className="text-white group-hover:text-black transition-colors">Explore Eligibility</span>
              <span className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
            </button>
            <Link to="/contact?type=golden-visa">
              <button 
                className="group relative inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold rounded-lg md:rounded-xl transition-all duration-300 bg-transparent"
                style={{
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                <MessageCircle className="w-4 h-4 text-gold group-hover:text-black transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                <span className="text-white group-hover:text-black transition-colors">Speak with a JBJ Advisor</span>
                <span className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
            </Link>
          </>
        }
      />

      {/* Main Content with Right Padding for TOC */}
      <div className="lg:pr-80">
        {/* Section 1: What Is the Golden Visa */}
        <section id="what-is" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-5xl mx-auto">
              {/* Layer 3 Card */}
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    What Is the <span className="text-gold">UAE Golden Visa?</span>
                  </h2>
                </div>
                <p className="text-zinc-700 text-lg leading-relaxed">
                  The UAE Golden Visa is a long-term residency program issued by the UAE government to attract investors, entrepreneurs, and exceptional talents. For real estate investors, eligibility is based on property ownership that meets specific value and registration requirements defined by the authorities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Eligibility Criteria */}
        <section id="eligibility" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-5xl mx-auto">
              {/* Layer 3 Card */}
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    Real Estate <span className="text-gold">Eligibility Criteria</span>
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  To be eligible for the UAE Golden Visa through property investment:
                </p>
                <ul className="space-y-4 mb-8">
                  {eligibilityCriteria.map((criteria, index) => (
                    <li key={index} className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-gold/20">
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-700">{criteria}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Important Notice */}
                <div className="p-6 bg-gradient-to-br from-amber-50/80 to-amber-100/60 border-2 border-amber-500/30 rounded-xl">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-black font-semibold mb-1">Important Notice</p>
                      <p className="text-zinc-700">
                        Meeting the investment threshold qualifies the investor to <strong>apply</strong> for the Golden Visa. 
                        The Golden Visa is issued <strong>only after official review and approval</strong> by UAE authorities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Application Process */}
        <section id="process" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-5xl mx-auto">
              {/* Layer 3 Card */}
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    Application <span className="text-gold">Process</span>
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  The Golden Visa application process follows these high-level steps:
                </p>
                <div className="space-y-4 mb-6">
                  {applicationProcess.map((item) => (
                    <div key={item.step} className="flex items-center gap-4 p-4 bg-white/60 rounded-xl border border-gold/20">
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold font-bold">{item.step}</span>
                      </div>
                      <span className="text-zinc-700 font-medium">{item.title}</span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-sm italic">
                  Processing timelines are determined solely by the relevant authority.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: What the Golden Visa Offers */}
        <section id="benefits" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-black" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                  What the <span className="text-gold">Golden Visa Offers</span>
                </h2>
              </div>

              {/* Layer 3 Cards Grid */}
              <div className="grid sm:grid-cols-2 gap-6">
                {goldenVisaOffers.map((offer, index) => (
                  <div 
                    key={index}
                    className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-6 hover:border-gold hover:shadow-lg hover:shadow-gold/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl flex items-center justify-center flex-shrink-0">
                        <offer.icon className="w-6 h-6 text-black" />
                      </div>
                      <p className="text-zinc-700 font-medium">{offer.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: JBJ Role */}
        <section id="jbj-role" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-5xl mx-auto">
              {/* Layer 3 Card */}
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    JBJ Global <span className="text-gold">Real Estate Role</span>
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  JBJ Global Real Estate:
                </p>
                <ul className="space-y-3 mb-8">
                  {jbjRole.map((role, index) => (
                    <li key={index} className="flex items-start gap-3 p-4 bg-white/60 rounded-xl border border-gold/20">
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-700">{role}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Important Statement */}
                <div className="p-6 bg-black border border-gold/30 rounded-xl">
                  <div className="flex items-start gap-4">
                    <Scale className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
                    <p className="text-zinc-300">
                      <span className="text-white font-semibold">All residency approvals are granted exclusively by UAE authorities.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: FAQ */}
        <section id="faq" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-black" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                  Golden Visa <span className="text-gold">FAQ</span>
                </h2>
              </div>

              {/* FAQ Accordion */}
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Accordion key={index} type="single" collapsible className="w-full">
                    <AccordionItem 
                      value={`faq-${index}`}
                      className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl px-6 py-2 data-[state=open]:border-gold/60 data-[state=open]:shadow-md transition-all"
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
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <GuideCTA
          title="Ready to Explore Eligible Properties?"
          description="Speak with a JBJ advisor to understand which properties meet Golden Visa requirements and how the application process works."
          icon={Building2}
          primaryAction={{
            label: "Speak With an Advisor",
            href: "/contact?type=golden-visa",
            icon: MessageCircle
          }}
          showContactOptions={true}
        />

        {/* Guide Navigation */}
        <section className="py-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8">
          <div className="container mx-auto px-4">
            <GuideNavigation current="/guides/golden-visa-uae" guides={GUIDE_LINKS} />
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-8 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl mt-8 mb-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6">
                <p className="text-center text-zinc-600 text-sm leading-relaxed">
                  <span className="text-black font-semibold">Disclaimer:</span> JBJ Global Real Estate is a licensed UAE brokerage. 
                  We provide real estate advisory and coordination support only. 
                  Residency visas are issued solely by UAE government authorities.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default GoldenVisaGuide;