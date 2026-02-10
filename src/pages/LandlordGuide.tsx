import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FounderPhilosophySection } from "@/components/FounderPhilosophySection";
import { 
  CheckCircle2, 
  FileText, 
  Home, 
  Users,
  ArrowRight,
  ArrowUpRight,
  Shield,
  Banknote,
  Key,
  Clock,
  Calendar,
  ArrowDown,
  AlertTriangle,
  TrendingUp,
  Camera,
  Target,
  UserCheck,
  Building,
  Megaphone,
  Scale,
  Wrench,
  HelpCircle,
  RefreshCw,
  XCircle
} from "lucide-react";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import { GuideCTA } from "@/components/guides/GuideCTA";


const LandlordGuide = () => {
  // Section 1: Understanding the Rental Market
  const rentalMarketPoints = [
    "Rental pricing must align with market comparables and RERA guidelines.",
    "Demand fluctuates seasonally and by community.",
    "Cheque structure (1–2 vs 4–6 cheques) directly impacts achievable rent."
  ];

  // Section 2: Preparing Your Property for Rent
  const propertyPreparationChecklist = [
    "Ensure the property is clean, functional, and move-in ready",
    "Service AC, plumbing, and electrical systems",
    "Decide furnished vs unfurnished (based on area demand)",
    "Photograph the unit professionally",
    "Confirm service charges and outstanding balances are cleared"
  ];

  // Section 3: Rental Pricing & Strategy
  const pricingFactors = [
    "Location and building reputation",
    "Unit layout, view, floor level",
    "Furnishing quality",
    "Cheque structure",
    "Market supply vs demand"
  ];

  // Section 4: Marketing & Exposure
  const marketingIncludes = [
    "Listing on major UAE portals",
    "Professional photos and clear descriptions",
    "Agent-led viewings and enquiry screening",
    "Market feedback and price adjustment if required"
  ];

  // Section 5: Tenant Screening
  const tenantScreeningPoints = [
    "Passport, visa, and Emirates ID",
    "Employment and income documentation",
    "Payment capability and cheque structure",
    "Intended use (family / individual / company)"
  ];

  // Section 6: Legal Framework & Ejari
  const legalPoints = [
    "Ejari registration is mandatory",
    "Contract terms must be clear and compliant",
    "Security deposit is typically 5% (unfurnished) or 10% (furnished)",
    "Rent increases must follow RERA index guidelines"
  ];

  // Section 7: Costs Landlords Should Expect
  const landlordCosts = [
    "Agency commission (usually 5% + VAT of annual rent)",
    "Ejari registration fee",
    "Maintenance (as per contract terms)",
    "Service charges (paid annually to the developer)"
  ];

  // Section 8: Handover & Move-In
  const handoverProcess = [
    "Contract signing",
    "Ejari registration",
    "Security deposit & cheque collection",
    "Key, access card, and parking handover",
    "Move-in date confirmation"
  ];

  // Section 9: Renewals, Rent Increases & Notices
  const renewalRules = [
    "90-day notice required for changes at renewal",
    "Rent increases must follow RERA calculator",
    "Eviction requires legal grounds and 12-month notice (where applicable)"
  ];

  // Section 10: How JBJ Global Real Estate Supports Landlords
  const jbjSupport = [
    "Rental valuation & pricing guidance",
    "Marketing & tenant sourcing",
    "Screening & negotiation",
    "Contract & Ejari coordination",
    "Renewal and compliance guidance"
  ];

  const faqItems = [
    {
      question: "Do I need to be in Dubai to rent my property?",
      answer: "No. The process can be handled remotely with proper documentation."
    },
    {
      question: "Who pays the agency commission?",
      answer: "The landlord typically pays the rental commission unless otherwise agreed."
    },
    {
      question: "Can I increase rent every year?",
      answer: "Only if permitted by the RERA Rental Index."
    },
    {
      question: "How long does it take to rent a property?",
      answer: "This depends on pricing, condition, and demand. Correctly priced units rent faster."
    },
    {
      question: "What happens if a tenant pays late?",
      answer: "This depends on contract terms. Clear clauses reduce disputes."
    },
    {
      question: "Can I rent my property furnished?",
      answer: "Yes, if the building and community allow it."
    },
    {
      question: "Who handles maintenance?",
      answer: "Minor maintenance is typically tenant responsibility; major maintenance is usually landlord responsibility (as per contract)."
    },
    {
      question: "Is Ejari mandatory?",
      answer: "Yes. Ejari registration is required by law."
    },
    {
      question: "Can I sell my property while it is rented?",
      answer: "Yes, subject to tenancy laws and notice periods."
    }
  ];

  const tocItems = [
    { id: 'rental-market', title: 'Understanding the Market', icon: TrendingUp },
    { id: 'property-preparation', title: 'Property Preparation', icon: Home },
    { id: 'pricing-strategy', title: 'Pricing & Strategy', icon: Target },
    { id: 'marketing', title: 'Marketing & Exposure', icon: Megaphone },
    { id: 'tenant-screening', title: 'Tenant Screening', icon: UserCheck },
    { id: 'legal-framework', title: 'Legal Framework & Ejari', icon: Scale },
    { id: 'costs', title: 'Landlord Costs', icon: Banknote },
    { id: 'handover', title: 'Handover & Move-In', icon: Key },
    { id: 'renewals', title: 'Renewals & Notices', icon: RefreshCw },
    { id: 'jbj-support', title: 'JBJ Support', icon: Building },
    { id: 'faq', title: 'FAQ', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Landlord Guide Dubai | How to Rent Out Your Property | JBJ GLOBAL REAL ESTATE"
        description="This guide is designed for property owners who want to rent their property in Dubai efficiently, compliantly, and with minimal risk."
      />

      <GuideHero
        badge="Landlord Guide"
        badgeIcon={Building}
        title={
          <>
            Renting Your Property in Dubai —{" "}
            <span className="text-gold">A Practical, Owner-First Guide</span>
          </>
        }
        description="This guide is designed for property owners who want to rent their property in Dubai efficiently, compliantly, and with minimal risk. It explains pricing, tenant selection, legal obligations, costs, timelines, and how JBJ Global Real Estate supports landlords from listing to handover."
        backgroundImage="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <button 
              onClick={() => document.getElementById('rental-market')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold rounded-lg md:rounded-xl transition-all duration-300 bg-transparent"
              style={{
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
              }}
            >
              <ArrowDown className="w-4 h-4 text-gold group-hover:text-black transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
              <span className="text-white group-hover:text-black transition-colors">Read the Full Guide</span>
              <span className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
            </button>
            <Link to="/landlord-portal">
              <button 
                className="group relative inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold rounded-lg md:rounded-xl transition-all duration-300 bg-transparent"
                style={{
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                <span className="text-white group-hover:text-black transition-colors">List Your Property</span>
                <ArrowUpRight className="w-4 h-4 text-gold group-hover:text-black transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                <span className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
            </Link>
          </>
        }
      />

      {/* Sticky Table of Contents */}
      <div className="hidden lg:block fixed right-8 top-1/4 z-[60] max-w-xs">
        <GuideTableOfContents 
          items={tocItems}
          ctaAction={{
            label: "List Your Property Now",
            href: "/landlord-portal",
            icon: Building
          }}
        />
      </div>

      {/* Section 1: Understanding the Rental Market */}
      <section id="rental-market" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
              <span className="text-gold">Understanding</span> the Rental Market
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Dubai's rental market is regulated and data-driven. Rental values vary by area, building quality, unit size, furnishing level, and cheque structure.
            </p>
          </div>

          <div className="jj-box-active p-6 md:p-8">
            <p className="text-zinc-700 mb-6 font-medium">Key points:</p>
            <ul className="space-y-3">
              {rentalMarketPoints.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2: Preparing Your Property for Rent */}
      <section id="property-preparation" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
              <span className="text-gold">Preparing</span> Your Property for Rent
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              A well-prepared unit rents faster and attracts higher-quality tenants.
            </p>
          </div>

          <div className="jj-box-active p-6 md:p-8">
            <p className="text-zinc-700 mb-6 font-medium">Checklist:</p>
            <ul className="space-y-3">
              {propertyPreparationChecklist.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3: Rental Pricing & Strategy */}
      <section id="pricing-strategy" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
                Section 3: <span className="text-gold">Rental Pricing</span> & Strategy
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Correct pricing reduces vacancy and protects yield.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-zinc-700 mb-6 font-medium">What affects rent:</p>
              <ul className="space-y-3 mb-6">
                {pricingFactors.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-zinc-600 italic border-t border-gold/30 pt-4">
                JBJ provides rental pricing guidance based on live market data and comparable listings — not guesswork.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Marketing & Exposure */}
      <section id="marketing" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
                Section 4: <span className="text-gold">Marketing</span> & Exposure
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Your property should be marketed where qualified tenants search.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-zinc-700 mb-6 font-medium">Marketing includes:</p>
              <ul className="space-y-3">
                {marketingIncludes.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Tenant Screening */}
      <section id="tenant-screening" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
                Section 5: <span className="text-gold">Tenant Screening</span> (Critical Step)
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Choosing the right tenant protects your asset.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-zinc-700 mb-6 font-medium">What is verified:</p>
              <ul className="space-y-3 mb-6">
                {tenantScreeningPoints.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-zinc-600 italic border-t border-gold/30 pt-4">
                JBJ focuses on risk reduction, not just speed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Legal Framework & Ejari */}
      <section id="legal-framework" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
                Section 6: <span className="text-gold">Legal Framework</span> & Ejari
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Dubai tenancy contracts must comply with local regulations.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-zinc-700 mb-6 font-medium">Key legal points:</p>
              <ul className="space-y-3">
                {legalPoints.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Costs Landlords Should Expect */}
      <section id="costs" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
                Section 7: <span className="text-gold">Costs</span> Landlords Should Expect
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Understanding costs avoids surprises.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-zinc-700 mb-6 font-medium">Typical costs:</p>
              <ul className="space-y-3 mb-6">
                {landlordCosts.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Banknote className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-zinc-600 italic border-t border-gold/30 pt-4">
                JBJ does not charge hidden fees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Handover & Move-In */}
      <section id="handover" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
                Section 8: <span className="text-gold">Handover</span> & Move-In
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Once terms are agreed:
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-zinc-700 mb-6 font-medium">Process includes:</p>
              <ul className="space-y-3">
                {handoverProcess.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Renewals, Rent Increases & Notices */}
      <section id="renewals" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
                Section 9: <span className="text-gold">Renewals</span>, Rent Increases & Notices
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Landlord rights and obligations are regulated.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-zinc-700 mb-6 font-medium">Important rules:</p>
              <ul className="space-y-3">
                {renewalRules.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 10: How JBJ Global Real Estate Supports Landlords */}
      <section id="jbj-support" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
                Section 10: How <span className="text-gold">JBJ Global Real Estate</span> Supports Landlords
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                JBJ is licensed for Rent, Buy & Sell and operates with a landlord-first approach.
              </p>
            </div>

            <div className="jj-box-active p-8">
              <p className="text-zinc-700 mb-6 font-medium">Our role includes:</p>
              <ul className="space-y-3 mb-6">
                {jbjSupport.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-zinc-600 italic border-t border-gold/30 pt-4">
                We act to protect your property, income, and legal position.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
                <span className="text-gold">Landlord</span> FAQ
              </h2>
            </div>

            <div className="space-y-4">
              {faqItems.map((faq, index) => (
                <div
                  key={index}
                  className="jj-box-active p-6 hover:border-gold transition-colors"
                >
                  <h3 className="text-lg font-medium text-black mb-3">{faq.question}</h3>
                  <p className="text-zinc-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founder-Led Philosophy & Advisory Positioning */}
      <FounderPhilosophySection />

      {/* CTA */}
      <GuideCTA
        title="Ready to List Your Property?"
        description="If you are considering renting your property in Dubai, the next step is a structured consultation to align your objective, pricing, and tenant strategy."
        primaryAction={{
          label: "List Your Property for Rent",
          href: "/landlord-portal",
          icon: ArrowRight
        }}
        showContactOptions
      />

      {/* Guide Navigation */}
      <div className="jj-section-champagne py-12">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/landlord-guide" guides={GUIDE_LINKS} />
        </div>
      </div>
    </div>
  );
};

export default LandlordGuide;
