import { SEOHead } from "@/components/SEOHead";
import { GuideBookSection } from "@/components/books/GuideBookSection";
import { landlordGuideBook } from "@/data/bookCollections";
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
import { GuideFAQSection, type GuideFAQCategory } from "@/components/guides/GuideFAQSection";
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

  // Folded in from the standalone /landlord-faq page (Guide Consolidation Stage 2),
  // superseding the shorter one-line FAQ set this section used to hold.
  const landlordFaqCategories: GuideFAQCategory[] = [
    {
      id: "leasing-basics",
      title: "Leasing Basics",
      questions: [
        { question: "What is Ejari and is it mandatory?", answer: "Ejari is the official tenancy contract registration system in Dubai, managed by the Real Estate Regulatory Agency (RERA). It is mandatory for all rental agreements.\n\n• Ejari validates the tenancy contract legally\n• Required for the tenant to connect DEWA (utilities), obtain a residency visa, and access other government services\n• Registration fee is approximately AED 220\n• The contract details (rent, duration, terms) are recorded in the Ejari system\n• Both landlord and tenant receive a registered Ejari certificate\n\nFailure to register on Ejari can result in penalties and complications in any future disputes." },
        { question: "How do I set the right rental price for my property?", answer: "To determine competitive rental pricing:\n\n• Check the RERA Rental Index: The official benchmark for rental values by area, building, and unit type\n• Research comparable listings on Bayut and Property Finder\n• Consider your property's condition, view, floor level, and furnishing\n• Factor in market conditions — vacancy rates in your community\n• Account for amenities your building offers vs. competitors\n\nOverpricing leads to extended vacancies (often costlier than a slightly lower rent). We recommend pricing at or slightly below market to attract quality tenants quickly." },
        { question: "Can I rent my property furnished or unfurnished?", answer: "Both options are viable in the UAE market:\n\n• Unfurnished: More common for annual leases; attracts long-term tenants; lower maintenance costs\n• Furnished: Commands 20–40% higher rent; popular in tourist areas (Marina, Downtown, JBR); higher tenant turnover\n• Short-term furnished: Requires a holiday home permit from DTCM; highest yields but most management-intensive\n\nThe choice depends on your target tenant profile, location, and willingness to manage furnishings." },
      ],
    },
    {
      id: "rental-contracts",
      title: "Rental Contracts & Regulations",
      questions: [
        { question: "What should be included in a tenancy contract?", answer: "A proper UAE tenancy contract must include:\n\n• Full names and identification of landlord and tenant\n• Property details (unit number, size, location)\n• Lease duration (typically 12 months)\n• Annual rent amount and payment method (number of cheques)\n• Security deposit amount (typically 5% for unfurnished, 10% for furnished)\n• Maintenance responsibilities\n• Notice period for non-renewal (90 days per RERA regulations)\n• Terms for early termination\n• DEWA and service charge responsibilities\n\nWe recommend using RERA-approved standard tenancy contracts to ensure legal compliance." },
        { question: "Can I increase rent, and by how much?", answer: "Rent increases in Dubai are regulated by RERA's Rental Increase Calculator:\n\n• If current rent is 10% or less below market average: No increase allowed\n• 11–20% below market: Up to 5% increase\n• 21–30% below market: Up to 10% increase\n• 31–40% below market: Up to 15% increase\n• More than 40% below market: Up to 20% increase\n\nKey rules:\n• 90 days written notice is required before any increase\n• Increases are only applicable upon lease renewal\n• The RERA Rental Index is the official reference for market rates\n• Tenants can dispute unreasonable increases through the Rental Dispute Centre (RDC)" },
        { question: "How many cheques should I accept for rent payment?", answer: "Cheque structure is negotiable between landlord and tenant:\n\n• 1 cheque: Best for landlords — full annual rent upfront. Increasingly rare and may limit your tenant pool\n• 2 cheques: Common compromise — semi-annual payments\n• 4 cheques: Quarterly — most common in the current market\n• 6 or 12 cheques: Attracts the widest tenant pool but requires more administration\n\nAccepting more cheques typically allows you to command slightly higher rent. The trend in Dubai is moving toward 4–6 cheques. Some landlords now accept bank transfers instead of cheques." },
      ],
    },
    {
      id: "tenant-management",
      title: "Tenant Management",
      questions: [
        { question: "How do I find reliable tenants?", answer: "To attract and screen quality tenants:\n\n• List on major portals (Bayut, Property Finder, Dubizzle) with professional photos\n• Work with a licensed real estate agent who can pre-screen applicants\n• Verify employment and salary (standard practice is rent should be ≤30% of annual income)\n• Check references from previous landlords\n• Verify identification documents\n• Consider background checks for higher-value properties\n• Use Ejari history to check rental track record\n\nJBJ GLOBAL REAL ESTATE provides tenant sourcing and screening services as part of our landlord support." },
        { question: "What can I do if my tenant doesn't pay rent?", answer: "Dubai law provides clear recourse for non-payment:\n\n1. Send a formal written notice (notarized) giving 30 days to pay\n2. If unpaid, file a case with the Rental Dispute Centre (RDC)\n3. RDC can issue eviction orders for non-payment\n4. A bounced cheque is a criminal offense in the UAE — you can file a police report\n\nPrevention is better than cure:\n• Screen tenants thoroughly before leasing\n• Require post-dated cheques for the full lease period\n• Include clear penalty clauses in the tenancy contract\n• Maintain open communication with tenants about any payment difficulties" },
        { question: "Can I evict a tenant, and what are the grounds?", answer: "Under UAE Law No. 33 of 2008 (as amended), landlords can request eviction for:\n\n• Non-payment of rent after 30-day notice\n• Subletting without consent\n• Using property for illegal purposes\n• Making unauthorized modifications\n• Property left vacant for 30+ consecutive days (commercial) or 90 days (residential)\n\nFor no-fault eviction (e.g., personal use, major renovation, demolition):\n• 12 months written notice via notary public is required\n• Must be served upon or before the lease expiry date\n• Tenant has the right to contest through RDC\n\nSelling the property does NOT automatically terminate an existing lease." },
      ],
    },
    {
      id: "maintenance",
      title: "Maintenance & Management",
      questions: [
        { question: "Who is responsible for property maintenance — landlord or tenant?", answer: "UAE law clearly divides responsibilities:\n\nLandlord is responsible for:\n• Structural repairs (walls, roof, foundation)\n• Major plumbing and electrical systems\n• Air conditioning system (central AC or major repairs)\n• Common area maintenance (via service charges)\n• Appliances provided by the landlord\n\nTenant is responsible for:\n• Day-to-day minor maintenance\n• Keeping the property in good condition\n• Minor repairs caused by normal wear and tear\n• Reporting major issues promptly\n• Any damage caused by the tenant or their guests\n\nClear maintenance clauses in the tenancy contract prevent disputes." },
        { question: "Should I hire a property management company?", answer: "Property management makes sense if:\n\n• You own multiple rental properties\n• You live outside the UAE\n• You prefer hands-off management\n• You have short-term / holiday rentals\n\nTypical property management fees:\n• Annual management: 5–8% of annual rent\n• Holiday home management: 15–25% of rental income\n\nServices typically include:\n• Tenant sourcing and screening\n• Rent collection and accounting\n• Maintenance coordination\n• Ejari registration and renewals\n• Regular property inspections\n• Handling tenant queries and complaints" },
        { question: "What are service charges and how do they work?", answer: "Service charges cover the maintenance of common areas and shared facilities:\n\n• Charged annually per square foot of your property\n• Typical range: AED 10–30 per sq ft (varies by community and amenities)\n• Covers: building maintenance, security, landscaping, pool, gym, elevators, common utilities\n• Set by the Owners' Association and approved by RERA\n• Must be paid regardless of whether the property is occupied or vacant\n\nLandlords should factor service charges into their net yield calculations. Some landlords pass DEWA or chiller charges to tenants — this should be clearly stated in the tenancy contract." },
      ],
    },
    {
      id: "legal-compliance",
      title: "Legal & Compliance",
      questions: [
        { question: "Do I need a license to rent out my property in Dubai?", answer: "For standard long-term leases (12+ months), no special license is required beyond:\n\n• Valid title deed in your name\n• Ejari registration of the tenancy contract\n\nFor short-term/holiday rentals, you need:\n• Holiday Home permit from the Department of Tourism and Commerce Marketing (DTCM)\n• Registration with an approved holiday home operator\n• Compliance with DTCM standards for furnishing and amenities\n• Regular inspections and quality audits\n\nPenalties for operating unlicensed holiday homes can be severe, including fines and blacklisting." },
        { question: "What happens to my tenancy if I sell the property?", answer: "Under UAE law, selling a property does NOT terminate an existing tenancy:\n\n• The new owner inherits the current tenancy agreement\n• All terms and conditions remain in force until lease expiry\n• The new owner cannot increase rent or evict during the current lease period\n• The tenant's security deposit obligation transfers to the new owner\n\nIf you want to sell vacant, you must:\n• Wait for the lease to expire naturally, OR\n• Negotiate early termination with the tenant (usually involves compensation), OR\n• Provide 12 months eviction notice for 'owner use' (must be genuine)" },
      ],
    },
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
    <div data-neon-page className="min-h-screen bg-[#FDFBF7]">
      <SEOHead
        title="Landlord Guide Dubai | How to Rent Out Your Property | JBJ GLOBAL REAL ESTATE"
        description="This guide is designed for property owners who want to rent their property in Dubai efficiently, compliantly, and with minimal risk."
        faqItems={landlordFaqCategories.flatMap((c) => c.questions)}
      />

      <GuideHero
        badge="Landlord Guide"
        badgeIcon={Building}
        title={
          <>
            Renting Your Property in Dubai —{" "}
            <span className="text-[#1A1A1A]">A Practical, Owner-First Guide</span>
          </>
        }
        description="This guide is designed for property owners who want to rent their property in Dubai efficiently, compliantly, and with minimal risk. It explains pricing, tenant selection, legal obligations, costs, timelines, and how JBJ Global Real Estate supports landlords from listing to handover."
        backgroundImage="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <button
              onClick={() => document.getElementById('rental-market')?.scrollIntoView({ behavior: 'smooth' })}
              data-surface="emerald"
              className="jj-cta-emerald inline-flex items-center justify-center gap-2 px-7 md:px-9 py-3 md:py-4 text-sm md:text-base font-bold rounded-xl text-white transition-transform duration-300 hover:-translate-y-0.5 shadow-[0_10px_28px_rgba(6,78,59,0.35)]"
            >
              <ArrowDown className="w-4 h-4 text-white" />
              <span className="text-white">Read the Full Guide</span>
            </button>
            <Link to="/landlord-portal">
              <button
                data-surface="emerald"
                className="jj-cta-emerald inline-flex items-center justify-center gap-2 px-7 md:px-9 py-3 md:py-4 text-sm md:text-base font-bold rounded-xl text-white transition-transform duration-300 hover:-translate-y-0.5 shadow-[0_10px_28px_rgba(6,78,59,0.35)]"
              >
                <span className="text-white">List Your Property</span>
                <ArrowUpRight className="w-4 h-4 text-white" />
              </button>
            </Link>
          </>
        }
      />

      {/* 3D Book Cover + Table of Contents */}
      <GuideBookSection book={landlordGuideBook} sectionIds={tocItems.map(i => i.id)} />

      <GuideTableOfContents 
        items={tocItems}
        ctaAction={{
          label: "List Your Property Now",
          href: "/landlord-portal",
          icon: Building
        }}
      />

      {/* Section 1: Understanding the Rental Market */}
      <section id="rental-market" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] mb-4">
              <span className="text-[#1A1A1A]">Understanding</span> the Rental Market
            </h2>
            <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
              Dubai's rental market is regulated and data-driven. Rental values vary by area, building quality, unit size, furnishing level, and cheque structure.
            </p>
          </div>

          <div className="jj-box-active p-6 md:p-8">
            <p className="text-[#1A1A1A]/70 mb-6 font-medium">Key points:</p>
            <ul className="space-y-3">
              {rentalMarketPoints.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                  <span className="text-[#1A1A1A]/70">{item}</span>
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
            <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] mb-4">
              <span className="text-[#1A1A1A]">Preparing</span> Your Property for Rent
            </h2>
            <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
              A well-prepared unit rents faster and attracts higher-quality tenants.
            </p>
          </div>

          <div className="jj-box-active p-6 md:p-8">
            <p className="text-[#1A1A1A]/70 mb-6 font-medium">Checklist:</p>
            <ul className="space-y-3">
              {propertyPreparationChecklist.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                  <span className="text-[#1A1A1A]/70">{item}</span>
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
              <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] mb-4">
                Section 3: <span className="text-[#1A1A1A]">Rental Pricing</span> & Strategy
              </h2>
              <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
                Correct pricing reduces vacancy and protects yield.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-[#1A1A1A]/70 mb-6 font-medium">What affects rent:</p>
              <ul className="space-y-3 mb-6">
                {pricingFactors.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                    <span className="text-[#1A1A1A]/70">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-[#1A1A1A]/70 italic border-t border-[#B89555]/30 pt-4">
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
              <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] mb-4">
                Section 4: <span className="text-[#1A1A1A]">Marketing</span> & Exposure
              </h2>
              <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
                Your property should be marketed where qualified tenants search.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-[#1A1A1A]/70 mb-6 font-medium">Marketing includes:</p>
              <ul className="space-y-3">
                {marketingIncludes.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                    <span className="text-[#1A1A1A]/70">{item}</span>
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
              <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] mb-4">
                Section 5: <span className="text-[#1A1A1A]">Tenant Screening</span> (Critical Step)
              </h2>
              <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
                Choosing the right tenant protects your asset.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-[#1A1A1A]/70 mb-6 font-medium">What is verified:</p>
              <ul className="space-y-3 mb-6">
                {tenantScreeningPoints.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                    <span className="text-[#1A1A1A]/70">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-[#1A1A1A]/70 italic border-t border-[#B89555]/30 pt-4">
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
              <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] mb-4">
                Section 6: <span className="text-[#1A1A1A]">Legal Framework</span> & Ejari
              </h2>
              <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
                Dubai tenancy contracts must comply with local regulations.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-[#1A1A1A]/70 mb-6 font-medium">Key legal points:</p>
              <ul className="space-y-3">
                {legalPoints.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                    <span className="text-[#1A1A1A]/70">{item}</span>
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
              <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] mb-4">
                Section 7: <span className="text-[#1A1A1A]">Costs</span> Landlords Should Expect
              </h2>
              <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
                Understanding costs avoids surprises.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-[#1A1A1A]/70 mb-6 font-medium">Typical costs:</p>
              <ul className="space-y-3 mb-6">
                {landlordCosts.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Banknote className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                    <span className="text-[#1A1A1A]/70">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-[#1A1A1A]/70 italic border-t border-[#B89555]/30 pt-4">
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
              <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] mb-4">
                Section 8: <span className="text-[#1A1A1A]">Handover</span> & Move-In
              </h2>
              <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
                Once terms are agreed:
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-[#1A1A1A]/70 mb-6 font-medium">Process includes:</p>
              <ul className="space-y-3">
                {handoverProcess.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                    <span className="text-[#1A1A1A]/70">{item}</span>
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
              <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] mb-4">
                Section 9: <span className="text-[#1A1A1A]">Renewals</span>, Rent Increases & Notices
              </h2>
              <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
                Landlord rights and obligations are regulated.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-[#1A1A1A]/70 mb-6 font-medium">Important rules:</p>
              <ul className="space-y-3">
                {renewalRules.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                    <span className="text-[#1A1A1A]/70">{item}</span>
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
              <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] mb-4">
                Section 10: How <span className="text-[#1A1A1A]">JBJ Global Real Estate</span> Supports Landlords
              </h2>
              <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
                JBJ is licensed for Rent, Buy & Sell and operates with a landlord-first approach.
              </p>
            </div>

            <div className="jj-box-active p-8">
              <p className="text-[#1A1A1A]/70 mb-6 font-medium">Our role includes:</p>
              <ul className="space-y-3 mb-6">
                {jbjSupport.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                    <span className="text-[#1A1A1A]/70">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-[#1A1A1A]/70 italic border-t border-[#B89555]/30 pt-4">
                We act to protect your property, income, and legal position.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Landlord FAQ — folded in from the standalone /landlord-faq page (Guide Consolidation Stage 2) */}
      <GuideFAQSection id="faq" title="Landlord Questions Answered" categories={landlordFaqCategories} />

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
          <GuideNavigation current="/guides/landlord" guides={GUIDE_LINKS} />
        </div>
      </div>
    </div>
  );
};

export default LandlordGuide;
