import { SEOHead } from "@/components/SEOHead";
import { GuideBookSection } from "@/components/books/GuideBookSection";
import { tenantGuideBook } from "@/data/bookCollections";
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
  HelpCircle,
  RefreshCw,
  Wrench,
  Phone,
  Scale,
  BookOpen,
  XCircle
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import { GuideSectionHeader } from "@/components/guides/GuideSectionHeader";
import { GuideCTA } from "@/components/guides/GuideCTA";


const TenantGuide = () => {
  // Section 1: Understanding the Rental Market
  const rentalMarketPoints = [
    "Rental prices vary by area, building quality, and cheque structure",
    "Fewer cheques often mean higher rent",
    "Demand changes seasonally and by community",
    "All tenancy contracts must comply with Dubai rental regulations"
  ];

  // Section 2: Budgeting for Rent
  const budgetCosts = [
    "Annual rent (as agreed)",
    "Security deposit (5% unfurnished / 10% furnished)",
    "Agency commission (usually 5% + VAT of annual rent)",
    "Ejari registration fee",
    "DEWA (utilities) and internet setup"
  ];

  // Section 3: Property Search & Viewings
  const searchConsiderations = [
    "Location and commute",
    "Building facilities and maintenance quality",
    "Furnished vs unfurnished",
    "Parking availability",
    "Chiller / AC type (district or independent)"
  ];

  // Section 4: Making an Offer
  const offerIncludes = [
    "Agreed annual rent",
    "Number of cheques",
    "Move-in date",
    "Contract duration",
    "Any special conditions"
  ];

  // Section 5: Documents Required
  const documentsRequired = [
    "Passport copy",
    "Valid UAE visa",
    "Emirates ID (if available)",
    "Cheque copies",
    "Security deposit"
  ];

  // Section 6: Tenancy Contract & Ejari
  const contractPoints = [
    "Ejari registration is mandatory",
    "Contract terms define maintenance responsibilities",
    "Payment schedule must match agreed cheques",
    "Contract duration is usually 12 months"
  ];

  // Section 7: Move-In & Handover
  const moveInChecklist = [
    "Property condition inspection",
    "Key, access card, and parking allocation",
    "DEWA activation",
    "Chiller account setup (if applicable)"
  ];

  // Section 8: Tenant Rights & Responsibilities
  const tenantRights = [
    "Protection against unjust rent increases",
    "Legal notice requirements for eviction",
    "Clear renewal rules"
  ];

  const tenantResponsibilities = [
    "Paying rent on time",
    "Maintaining the property responsibly",
    "Following community rules",
    "Returning the unit in acceptable condition"
  ];

  // Section 9: Renewals, Rent Increases & Notices
  const renewalRules = [
    "Any changes must be communicated at least 90 days before renewal",
    "Rent increases must comply with the RERA Rental Index",
    "Tenants can dispute illegal increases through legal channels"
  ];

  // Section 10: Ending a Tenancy
  const endingTenancy = [
    "Notice period is typically defined in the contract",
    "Property must be returned in good condition",
    "Final inspection impacts security deposit refund"
  ];

  // JBJ Support
  const jbjSupport = [
    "Verified rental listings",
    "Guided property selection",
    "Offer negotiation support",
    "Contract & Ejari coordination",
    "Clear explanation of tenant rights and costs"
  ];

  const tenantFAQs = [
    {
      question: "How many cheques can I pay rent in?",
      answer: "This depends on the landlord. Common options range from 1 to 6 cheques."
    },
    {
      question: "Is the security deposit refundable?",
      answer: "Yes, subject to property condition and contract terms."
    },
    {
      question: "Can my rent be increased during the contract?",
      answer: "No. Rent is fixed for the contract duration."
    },
    {
      question: "Is Ejari mandatory?",
      answer: "Yes. Ejari is legally required."
    },
    {
      question: "Who pays the agency commission?",
      answer: "Tenants usually pay the rental commission unless otherwise agreed."
    },
    {
      question: "Can I break my lease early?",
      answer: "This depends on the contract. Penalties may apply."
    },
    {
      question: "What maintenance is my responsibility?",
      answer: "Minor maintenance is usually tenant responsibility; major issues are landlord responsibility, as defined in the contract."
    },
    {
      question: "Can a landlord evict me anytime?",
      answer: "No. Evictions must follow strict legal notice requirements."
    }
  ];

  const tocItems = [
    { id: 'rental-market', title: 'Understanding the Market', icon: Home },
    { id: 'budgeting', title: 'Budgeting for Rent', icon: Banknote },
    { id: 'property-search', title: 'Property Search', icon: Home },
    { id: 'making-offer', title: 'Making an Offer', icon: FileText },
    { id: 'documents', title: 'Documents Required', icon: FileText },
    { id: 'contract-ejari', title: 'Contract & Ejari', icon: Shield },
    { id: 'move-in', title: 'Move-In & Handover', icon: Key },
    { id: 'rights-responsibilities', title: 'Rights & Responsibilities', icon: Scale },
    { id: 'renewals', title: 'Renewals & Notices', icon: RefreshCw },
    { id: 'ending-tenancy', title: 'Ending a Tenancy', icon: Calendar },
    { id: 'jbj-support', title: 'JBJ Support', icon: Users },
    { id: 'faq', title: 'FAQ', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Tenant Guide Dubai | Your Rights, Costs, and Responsibilities | JBJ GLOBAL REAL ESTATE"
        description="This guide is designed for tenants renting residential property in Dubai. It explains the rental process, costs, legal protections, tenant obligations, Ejari registration, renewals, and dispute prevention."
      />

      <GuideHero
        badge="Tenant Guide"
        badgeIcon={Users}
        title={
          <>
            Renting a Home in Dubai —{" "}
            <span className="text-gold">Your Rights, Costs, and Responsibilities Explained</span>
          </>
        }
        description="This guide is designed for tenants renting residential property in Dubai. It explains the rental process, costs, legal protections, tenant obligations, Ejari registration, renewals, and dispute prevention — so you can rent with clarity and confidence."
        backgroundImage="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=2000&q=80"
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
            <Link to="/properties?transaction=rent">
              <button 
                className="group relative inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold rounded-lg md:rounded-xl transition-all duration-300 bg-transparent"
                style={{
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                <span className="text-white group-hover:text-black transition-colors">Browse Rental Properties</span>
                <ArrowUpRight className="w-4 h-4 text-gold group-hover:text-black transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                <span className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
            </Link>
          </>
        }
      />

      {/* 3D Book Cover + Table of Contents */}
      <GuideBookSection book={tenantGuideBook} sectionIds={tocItems.map(i => i.id)} />

      {/* Sticky Table of Contents */}
      <div className="hidden lg:block fixed right-8 top-1/4 z-[60] max-w-xs">
        <GuideTableOfContents 
          items={tocItems}
          ctaAction={{
            label: "Find Rentals Now",
            href: "/properties?transaction=rent",
            icon: Home
          }}
        />
      </div>

      {/* Section 1: Understanding the Rental Market */}
      <section id="rental-market" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Home} title="Understanding the Rental Market" />

          <div className="jj-box-active p-6 md:p-8">
            <p className="text-zinc-700 mb-6 font-medium">What to know:</p>
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

      {/* Section 2: Budgeting for Rent */}
      <section id="budgeting" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Banknote} title="Budgeting for Rent" />

          <div className="jj-card-inner p-6 md:p-8">
            <p className="text-zinc-700 mb-6 font-medium">Typical costs include:</p>
            <ul className="space-y-3 mb-6">
              {budgetCosts.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Banknote className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-zinc-600 italic border-t border-gold/30 pt-4">
              Rent is usually paid in post-dated cheques.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Property Search & Viewings */}
      <section id="property-search" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Home} title="Property Search & Viewings" />

          <div className="jj-card-inner p-6 md:p-8">
            <p className="text-zinc-700 mb-6 font-medium">Key considerations:</p>
            <ul className="space-y-3 mb-6">
              {searchConsiderations.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-zinc-600 italic border-t border-gold/30 pt-4">
              JBJ arranges verified listings and guided viewings to avoid misinformation.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Making an Offer */}
      <section id="making-offer" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={FileText} title="Making an Offer" />

          <div className="jj-card-inner p-6 md:p-8">
            <p className="text-zinc-700 mb-6 font-medium">Offer typically includes:</p>
            <ul className="space-y-3 mb-6">
              {offerIncludes.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-zinc-600 italic border-t border-gold/30 pt-4">
              Negotiation is common and handled formally.
            </p>
          </div>
        </div>
      </section>

      {/* Section 5: Documents Required */}
      <section id="documents" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={FileText} title="Documents Required from Tenants" />

          <div className="jj-card-inner p-6 md:p-8">
            <ul className="space-y-3 mb-6">
              {documentsRequired.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-zinc-600 italic border-t border-gold/30 pt-4">
              All information is used for contract and Ejari registration.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Tenancy Contract & Ejari */}
      <section id="contract-ejari" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Shield} title="Tenancy Contract & Ejari" />

          <div className="jj-card-inner p-6 md:p-8">
            <p className="text-zinc-700 mb-6 font-medium">Important points:</p>
            <ul className="space-y-3 mb-6">
              {contractPoints.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-zinc-600 italic border-t border-gold/30 pt-4">
              Without Ejari, tenant protections are limited.
            </p>
          </div>
        </div>
      </section>

      {/* Section 7: Move-In & Handover */}
      <section id="move-in" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Key} title="Move-In & Handover" />

          <div className="jj-card-inner p-6 md:p-8">
            <p className="text-zinc-700 mb-6 font-medium">Checklist:</p>
            <ul className="space-y-3 mb-6">
              {moveInChecklist.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-zinc-600 italic border-t border-gold/30 pt-4">
              Document the unit condition to avoid future disputes.
            </p>
          </div>
        </div>
      </section>

      {/* Section 8: Tenant Rights & Responsibilities */}
      <section id="rights-responsibilities" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Scale} title="Tenant Rights & Responsibilities" />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="jj-card-inner p-6 md:p-8">
              <p className="text-zinc-700 mb-6 font-medium">Tenant rights include:</p>
              <ul className="space-y-3">
                {tenantRights.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="jj-card-inner p-6 md:p-8">
              <p className="text-zinc-700 mb-6 font-medium">Tenant responsibilities include:</p>
              <ul className="space-y-3">
                {tenantResponsibilities.map((item, index) => (
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

      {/* Section 9: Renewals, Rent Increases & Notices */}
      <section id="renewals" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
                Section 9: <span className="text-gold">Renewals</span>, Rent Increases & Notices
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Tenancy renewals are regulated.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-zinc-700 mb-6 font-medium">Key rules:</p>
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

      {/* Section 10: Ending a Tenancy */}
      <section id="ending-tenancy" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Calendar} title="Ending a Tenancy" />

          <div className="jj-card-inner p-6 md:p-8">
            <p className="text-zinc-700 mb-6 font-medium">Important points:</p>
            <ul className="space-y-3 mb-6">
              {endingTenancy.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-zinc-700">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-zinc-600 italic border-t border-gold/30 pt-4">
              Early termination may involve penalties depending on contract terms.
            </p>
          </div>
        </div>
      </section>

      {/* How JBJ Global Real Estate Supports Tenants */}
      <section id="jbj-support" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Users} title="How JBJ Supports Tenants" />

          <div className="jj-card-inner p-8">
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
              We do not charge tenants hidden fees or misleading costs.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={HelpCircle} title="Tenant FAQ" />

          <div className="space-y-4">
            {tenantFAQs.map((faq, index) => (
              <div
                key={index}
                className="jj-card-inner p-6 hover:border-gold transition-colors"
              >
                <h3 className="text-lg font-medium text-black mb-3">{faq.question}</h3>
                <p className="text-zinc-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder-Led Philosophy & Advisory Positioning */}
      <FounderPhilosophySection />

      {/* CTA */}
      <GuideCTA
        title="Looking for Your Next Rental Home?"
        description="Our licensed rental advisors can help you find the perfect rental property in Dubai."
        primaryAction={{
          label: "Browse Rental Properties",
          href: "/properties?transaction=rent",
          icon: ArrowRight
        }}
        showContactOptions
      />

      {/* Guide Navigation */}
      <div className="jj-section-champagne py-12">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/tenant-guide" guides={GUIDE_LINKS} />
        </div>
      </div>
    </div>
  );
};

export default TenantGuide;
