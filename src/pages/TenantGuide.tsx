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
import { GuideFAQSection, type GuideFAQCategory } from "@/components/guides/GuideFAQSection";
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

  // Folded in from the standalone /tenant-faq page (Guide Consolidation Stage 2),
  // superseding the shorter one-line FAQ set this section used to hold.
  const tenantFaqCategories: GuideFAQCategory[] = [
    {
      id: "renting-basics",
      title: "Renting Basics",
      questions: [
        { question: "What documents do I need to rent a property in the UAE?", answer: "To rent a property, you'll typically need:\n\n• Valid passport (original + copy)\n• UAE residency visa (copy)\n• Emirates ID (copy)\n• Employment contract or salary certificate\n• Recent bank statements (some landlords request 3 months)\n• Post-dated cheques for the rent payments\n\nSome landlords may also request a reference letter from your employer or a previous landlord. If you're new to the UAE and don't yet have a visa, some landlords accept a copy of your employment offer letter." },
        { question: "What costs should I expect when renting?", answer: "Beyond the annual rent, budget for:\n\n• Security deposit: 5% of annual rent (unfurnished) or 10% (furnished) — refundable at end of lease\n• Agency fee: 5% of annual rent + VAT (one-time, paid to the letting agent)\n• Ejari registration: Approximately AED 220\n• DEWA connection: AED 2,000 deposit (refundable) + AED 110 activation fee\n• Internet setup: AED 100–300 (du or Etisalat)\n• Moving costs: AED 500–3,000 depending on distance and volume\n• Chiller deposit: AED 2,000–4,000 in some communities (refundable)\n\nTotal move-in costs typically amount to the first cheque + 7–12% of annual rent." },
        { question: "How many cheques is standard for rent payment?", answer: "Rent in the UAE is typically paid in advance via post-dated cheques:\n\n• 1 cheque: Full annual rent upfront — may get you a discount (3–5%)\n• 2 cheques: Semi-annual payments\n• 4 cheques: Quarterly — the most common arrangement currently\n• 6 cheques: Bi-monthly — becoming more common\n• 12 cheques: Monthly — increasingly available but may command higher rent\n\nThe more cheques you offer, the more negotiating power the landlord has on price. Conversely, offering fewer cheques can be a bargaining tool for reduced rent." },
        { question: "Can I negotiate the rent?", answer: "Yes, rent negotiation is common and expected in the UAE market:\n\nNegotiation strategies:\n• Research comparable rents in the same building/area using Bayut and Property Finder\n• Use the RERA Rental Index as your benchmark\n• Offer fewer cheques in exchange for lower rent\n• Sign a longer lease (2 years) for a discount\n• Highlight your profile as a reliable tenant (stable employment, references)\n• Negotiate during off-peak months (May–August when demand is lower)\n\nTypical negotiation range: 5–15% off the listed price, depending on market conditions and vacancy rates in the area." },
      ],
    },
    {
      id: "rights-protections",
      title: "Tenant Rights & Protections",
      questions: [
        { question: "What are my rights as a tenant in Dubai?", answer: "Dubai tenants are protected under Law No. 26 of 2007 (as amended by Law No. 33 of 2008):\n\n• Right to quiet enjoyment of the property\n• Protection from arbitrary eviction — landlord must provide valid grounds and proper notice\n• Right to have the property maintained in a habitable condition\n• Protection from illegal rent increases — RERA Rental Index governs permitted increases\n• Right to renew the lease unless valid eviction grounds exist\n• Right to dispute resolution through the Rental Dispute Centre (RDC)\n• Right to receive security deposit refund (minus legitimate deductions)\n• Right to 90 days written notice before any changes to lease terms" },
        { question: "Can my landlord increase rent during the lease?", answer: "No. During an active lease term, the landlord cannot increase rent. Increases can only happen:\n\n• Upon lease renewal (at the end of the current contract period)\n• With 90 days written notice before the renewal date\n• Within the limits set by the RERA Rental Increase Calculator\n• Based on the official RERA Rental Index for your area and property type\n\nIf you believe an increase is unfair or exceeds RERA limits, you can:\n1. Refuse the increase and cite the RERA calculator\n2. File a case with the Rental Dispute Centre (fee: AED 3.5% of the dispute amount, minimum AED 500)" },
        { question: "Can my landlord evict me?", answer: "Eviction is strictly regulated in Dubai. Valid grounds include:\n\nDuring lease:\n• Non-payment of rent (after 30-day formal notice)\n• Subletting without consent\n• Illegal use of the property\n• Causing significant damage\n• Using residential property for commercial purposes\n\nAt lease expiry (requires 12 months notarized notice):\n• Landlord wants to use the property personally (or for first-degree relative)\n• Major renovation that cannot be done while occupied\n• Demolition of the property\n\nThe landlord CANNOT evict you:\n• Simply because they want to sell (buyer inherits the lease)\n• To re-let at a higher rent\n• Without following proper legal procedures" },
        { question: "What is the Rental Dispute Centre (RDC) and how does it work?", answer: "The RDC is the judicial body for resolving rental disputes in Dubai:\n\n• Handles disputes between landlords and tenants\n• Filing fee: 3.5% of annual rent (minimum AED 500, maximum AED 20,000)\n• Cases are typically heard within 15–30 days of filing\n• Decisions are legally binding and enforceable\n• Both parties can appeal within 15 days of the judgment\n\nCommon cases:\n• Eviction disputes\n• Security deposit disputes\n• Rent increase challenges\n• Maintenance responsibility disputes\n• Early termination disagreements\n\nYou can file a case online through the Dubai Courts website or visit the RDC in person." },
      ],
    },
    {
      id: "maintenance-issues",
      title: "Maintenance & Issues",
      questions: [
        { question: "Who pays for maintenance and repairs?", answer: "Responsibilities are defined by UAE law:\n\nLandlord pays for:\n• Structural repairs (roof, walls, foundations)\n• Major plumbing (pipes within walls, main drains)\n• Electrical wiring and major systems\n• AC system repairs (central or major component replacement)\n• Appliances that came with the property\n• Any defects that existed before the tenant moved in\n\nTenant pays for:\n• Minor day-to-day maintenance\n• Consumables (light bulbs, filters, batteries)\n• Damage caused by the tenant or guests\n• Cleaning and upkeep of the unit\n• Reporting issues promptly to avoid escalation\n\nIf the landlord refuses to perform required maintenance, tenants can file with the RDC or, in extreme cases, arrange repairs and deduct from rent (with prior RDC approval)." },
        { question: "What should I do if my AC stops working?", answer: "AC is the landlord's responsibility for major repairs:\n\n1. Report the issue to your landlord or property manager immediately (in writing — email/WhatsApp)\n2. If the property has central cooling, contact the building management\n3. For split-unit AC, the landlord should arrange and pay for repair\n4. Regular cleaning/filter replacement is the tenant's responsibility\n5. If the landlord doesn't respond within a reasonable time (48–72 hours), send a formal notice\n6. If still unresolved, you can file with the RDC citing uninhabitable conditions\n\nDocument everything with photos, dates, and written communications." },
        { question: "Can I make modifications to the rented property?", answer: "Generally, tenants should not make structural modifications without landlord consent:\n\nUsually OK without permission:\n• Hanging pictures (small nail holes)\n• Adding curtains/blinds\n• Temporary furniture arrangement\n• Small decorative changes\n\nRequires landlord written approval:\n• Painting walls a different color\n• Installing shelving or built-in storage\n• Changing fixtures (taps, handles, lights)\n• Adding a satellite dish\n\nTypically not allowed:\n• Structural changes (removing walls, doors)\n• Plumbing or electrical modifications\n• Major kitchen/bathroom changes\n\nAlways get written approval and agree in advance who will pay to restore the property to its original state at lease end." },
      ],
    },
    {
      id: "moving-out",
      title: "Moving Out & Lease End",
      questions: [
        { question: "What is the process for ending my lease?", answer: "When your lease is ending:\n\n1. Decide whether to renew or vacate — notify your landlord at least 90 days before expiry\n2. If vacating, coordinate move-out inspection with the landlord\n3. Cancel or transfer DEWA account\n4. Cancel internet service\n5. Cancel Ejari registration\n6. Return all keys and access cards\n7. Provide forwarding details for security deposit refund\n8. Obtain a move-out permit from building management\n\nThe landlord should inspect the property and process the security deposit refund within 30 days, deducting only for legitimate damages (not normal wear and tear)." },
        { question: "Can I break my lease early?", answer: "Early termination depends on your contract terms:\n\n• If your contract has an early termination clause: Follow the stated terms (usually 2 months rent penalty + remaining rent until the unit is re-let)\n• If no early termination clause: You may be liable for the remaining rent until lease expiry\n• Mutual agreement: You can always negotiate early exit with your landlord\n\nCommon acceptable reasons for early termination:\n• Job loss or relocation\n• Uninhabitable conditions (documented and unresolved by landlord)\n• Mutual written agreement\n\nTip: When signing a new lease, always negotiate an early termination clause (typically 2 months notice + 1–2 months penalty)." },
        { question: "Will I get my security deposit back?", answer: "You should receive your full security deposit back, minus legitimate deductions:\n\nLegitimate deductions:\n• Damage beyond normal wear and tear\n• Unpaid utility bills or service charges owed by the tenant\n• Missing keys or access cards\n• Cleaning costs if the property is left in poor condition\n\nNOT legitimate deductions:\n• Normal wear and tear (faded paint, minor scuffs)\n• Pre-existing damage (documented at move-in)\n• General depreciation of appliances/fixtures\n\nTo protect your deposit:\n• Take detailed photos/video at move-in and move-out\n• Document any existing damage in writing when you first move in\n• Leave the property clean and in good condition\n• If the landlord withholds the deposit unfairly, file with the RDC" },
      ],
    },
    {
      id: "special-situations",
      title: "Special Situations",
      questions: [
        { question: "What happens if the property is sold while I'm renting?", answer: "Your lease is legally protected:\n\n• The new owner inherits your tenancy agreement — all terms remain in force\n• Your rent cannot be changed during the current lease period\n• You cannot be evicted simply because the property changed ownership\n• Your security deposit obligation transfers to the new owner\n• The new owner must honor the full remaining lease term\n\nIf the new owner attempts to evict you or change terms mid-lease, you can file with the Rental Dispute Centre. The law is firmly on the tenant's side in this situation." },
        { question: "Can I sublet my apartment?", answer: "Subletting requires explicit written consent from your landlord:\n\n• Standard tenancy contracts typically prohibit subletting\n• If permitted, the subletting arrangement must also be registered on Ejari\n• Subletting without consent is grounds for eviction\n• The original tenant remains legally responsible to the landlord\n\nAlternative arrangements:\n• Adding a roommate to the tenancy contract (with landlord's permission)\n• License agreement for a room (less formal, but still needs landlord awareness)\n• Short-term subletting via Airbnb requires DTCM holiday home permit — this is the landlord's responsibility to arrange" },
      ],
    },
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
    <div data-neon-page className="min-h-screen bg-[#FDFBF7]">
      <SEOHead
        title="Tenant Guide Dubai | Your Rights, Costs, and Responsibilities | JBJ GLOBAL REAL ESTATE"
        description="This guide is designed for tenants renting residential property in Dubai. It explains the rental process, costs, legal protections, tenant obligations, Ejari registration, renewals, and dispute prevention."
        faqItems={tenantFaqCategories.flatMap((c) => c.questions)}
      />

      <GuideHero
        badge="Tenant Guide"
        badgeIcon={Users}
        title={
          <>
            Renting a Home in Dubai —{" "}
            <span className="text-[#1A1A1A]">Your Rights, Costs, and Responsibilities Explained</span>
          </>
        }
        description="This guide is designed for tenants renting residential property in Dubai. It explains the rental process, costs, legal protections, tenant obligations, Ejari registration, renewals, and dispute prevention — so you can rent with clarity and confidence."
        backgroundImage="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=2000&q=80"
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
            <Link to="/properties?transaction=rent">
              <button
                data-surface="emerald"
                className="jj-cta-emerald inline-flex items-center justify-center gap-2 px-7 md:px-9 py-3 md:py-4 text-sm md:text-base font-bold rounded-xl text-white transition-transform duration-300 hover:-translate-y-0.5 shadow-[0_10px_28px_rgba(6,78,59,0.35)]"
              >
                <span className="text-white">Browse Rental Properties</span>
                <ArrowUpRight className="w-4 h-4 text-white" />
              </button>
            </Link>
          </>
        }
      />

      {/* 3D Book Cover + Table of Contents */}
      <GuideBookSection book={tenantGuideBook} sectionIds={tocItems.map(i => i.id)} />

      <GuideTableOfContents 
        items={tocItems}
        ctaAction={{
          label: "Find Rentals Now",
          href: "/properties?transaction=rent",
          icon: Home
        }}
      />

      {/* Section 1: Understanding the Rental Market */}
      <section id="rental-market" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Home} title="Understanding the Rental Market" />

          <div className="jj-box-active p-6 md:p-8">
            <p className="text-[#1A1A1A]/70 mb-6 font-medium">What to know:</p>
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

      {/* Section 2: Budgeting for Rent */}
      <section id="budgeting" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Banknote} title="Budgeting for Rent" />

          <div className="jj-card-inner p-6 md:p-8">
            <p className="text-[#1A1A1A]/70 mb-6 font-medium">Typical costs include:</p>
            <ul className="space-y-3 mb-6">
              {budgetCosts.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Banknote className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                  <span className="text-[#1A1A1A]/70">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#1A1A1A]/70 italic border-t border-[#B89555]/30 pt-4">
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
            <p className="text-[#1A1A1A]/70 mb-6 font-medium">Key considerations:</p>
            <ul className="space-y-3 mb-6">
              {searchConsiderations.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                  <span className="text-[#1A1A1A]/70">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#1A1A1A]/70 italic border-t border-[#B89555]/30 pt-4">
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
            <p className="text-[#1A1A1A]/70 mb-6 font-medium">Offer typically includes:</p>
            <ul className="space-y-3 mb-6">
              {offerIncludes.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                  <span className="text-[#1A1A1A]/70">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#1A1A1A]/70 italic border-t border-[#B89555]/30 pt-4">
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
                  <FileText className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                  <span className="text-[#1A1A1A]/70">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#1A1A1A]/70 italic border-t border-[#B89555]/30 pt-4">
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
            <p className="text-[#1A1A1A]/70 mb-6 font-medium">Important points:</p>
            <ul className="space-y-3 mb-6">
              {contractPoints.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                  <span className="text-[#1A1A1A]/70">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#1A1A1A]/70 italic border-t border-[#B89555]/30 pt-4">
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
            <p className="text-[#1A1A1A]/70 mb-6 font-medium">Checklist:</p>
            <ul className="space-y-3 mb-6">
              {moveInChecklist.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                  <span className="text-[#1A1A1A]/70">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#1A1A1A]/70 italic border-t border-[#B89555]/30 pt-4">
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
              <p className="text-[#1A1A1A]/70 mb-6 font-medium">Tenant rights include:</p>
              <ul className="space-y-3">
                {tenantRights.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                    <span className="text-[#1A1A1A]/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="jj-card-inner p-6 md:p-8">
              <p className="text-[#1A1A1A]/70 mb-6 font-medium">Tenant responsibilities include:</p>
              <ul className="space-y-3">
                {tenantResponsibilities.map((item, index) => (
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

      {/* Section 9: Renewals, Rent Increases & Notices */}
      <section id="renewals" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] mb-4">
                Section 9: <span className="text-[#1A1A1A]">Renewals</span>, Rent Increases & Notices
              </h2>
              <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto">
                Tenancy renewals are regulated.
              </p>
            </div>

            <div className="jj-box-active p-6 md:p-8">
              <p className="text-[#1A1A1A]/70 mb-6 font-medium">Key rules:</p>
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

      {/* Section 10: Ending a Tenancy */}
      <section id="ending-tenancy" className="jj-section-champagne py-16 md:py-24 scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Calendar} title="Ending a Tenancy" />

          <div className="jj-card-inner p-6 md:p-8">
            <p className="text-[#1A1A1A]/70 mb-6 font-medium">Important points:</p>
            <ul className="space-y-3 mb-6">
              {endingTenancy.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#1A1A1A] flex-shrink-0 mt-0.5" />
                  <span className="text-[#1A1A1A]/70">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#1A1A1A]/70 italic border-t border-[#B89555]/30 pt-4">
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
              We do not charge tenants hidden fees or misleading costs.
            </p>
          </div>
        </div>
      </section>

      {/* Tenant FAQ — folded in from the standalone /tenant-faq page (Guide Consolidation Stage 2) */}
      <GuideFAQSection id="faq" title="Tenant Questions Answered" categories={tenantFaqCategories} />

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
          <GuideNavigation current="/guides/tenant" guides={GUIDE_LINKS} />
        </div>
      </div>
    </div>
  );
};

export default TenantGuide;
