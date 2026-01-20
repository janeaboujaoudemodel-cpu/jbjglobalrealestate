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
import Footer from "@/components/Footer";

const LandlordGuide = () => {
  const whoThisGuideIsFor = [
    "Property owners renting in Dubai for the first time",
    "Overseas owners who cannot manage rentals directly",
    "Investors seeking long-term, compliant rental income",
    "Landlords who value transparency over unrealistic promises"
  ];

  const listingProcess = [
    {
      number: 1,
      title: "Property Preparation",
      icon: Home,
      description: "Before listing, the property must be legally and physically ready:",
      items: [
        "Functional AC, plumbing, and electrical systems",
        "Clean, well-maintained condition",
        "Appliances tested and operational",
        "Furnished or unfurnished decision confirmed"
      ]
    },
    {
      number: 2,
      title: "Market-Aligned Rental Pricing",
      icon: TrendingUp,
      description: "Rental pricing must reflect real market data:",
      items: [
        "Comparable units in the same building or community",
        "Layout, view, condition, and amenities",
        "Current tenant demand and cheque structure",
        "Compliance with RERA rental index guidelines"
      ],
      note: "Overpricing leads to vacancy. Underpricing reduces long-term yield."
    },
    {
      number: 3,
      title: "Professional Presentation",
      icon: Camera,
      description: "Correct presentation improves tenant quality:",
      items: [
        "Professional photography",
        "Accurate property descriptions",
        "Transparent disclosure of features and limitations"
      ]
    },
    {
      number: 4,
      title: "Marketing & Exposure",
      icon: Megaphone,
      description: "Effective rental marketing includes:",
      items: [
        "Listing on major UAE property portals",
        "Managed enquiries and viewings",
        "Clear communication of rental terms"
      ]
    },
    {
      number: 5,
      title: "Tenant Selection",
      icon: UserCheck,
      description: "Tenant selection is a risk-management process:",
      items: [
        "Identification and residency verification",
        "Income and affordability assessment",
        "Review of rental history (where available)"
      ],
      note: "Landlords retain final approval of the tenant."
    },
    {
      number: 6,
      title: "Contract, Ejari & Handover",
      icon: FileText,
      description: "Legal requirements include:",
      items: [
        "Agreed tenancy contract",
        "Mandatory Ejari registration",
        "Documented move-in inspection",
        "Formal handover of keys and access"
      ]
    }
  ];

  const pricingPoints = [
    "Based on verified market data",
    "Adjusted according to enquiry feedback",
    "Aligned with cheque structure preferences",
    "Reviewed periodically, not emotionally"
  ];

  const landlordResponsibilities = [
    {
      title: "Maintaining the property in habitable condition",
      icon: Home
    },
    {
      title: "Major maintenance unless otherwise agreed",
      icon: Wrench
    },
    {
      title: "Ejari registration",
      icon: Shield
    },
    {
      title: "Observing legal notice periods",
      icon: Calendar
    },
    {
      title: "Following RERA rental increase rules",
      icon: Banknote
    }
  ];

  const jbjServices = [
    "Providing market-aligned rental guidance",
    "Positioning properties correctly in the market",
    "Managing listings and enquiries",
    "Coordinating viewings and negotiations",
    "Supporting tenancy documentation and Ejari registration",
    "Assisting with handover coordination"
  ];

  const weDoNotPromise = [
    "Guarantee rental income",
    "Guarantee tenant behavior",
    "Guarantee future market conditions",
    "Guarantee capital appreciation"
  ];

  const faqItems = [
    {
      question: "Do I need to be in Dubai to rent my property?",
      answer: "No. Rentals can be managed remotely with proper documentation and coordination."
    },
    {
      question: "Can I approve the tenant myself?",
      answer: "Yes. Final tenant approval always remains with the landlord."
    },
    {
      question: "Who pays for maintenance?",
      answer: "Minor maintenance is typically tenant responsibility; major maintenance is the landlord's responsibility unless otherwise agreed."
    },
    {
      question: "How many cheques should I accept?",
      answer: "Fewer cheques often attract higher rent, but this depends on market demand and tenant profile."
    },
    {
      question: "Can I increase rent at renewal?",
      answer: "Rent increases must comply with the RERA rental index. Increases outside permitted limits are not enforceable."
    },
    {
      question: "What happens if a tenant leaves early?",
      answer: "Early termination terms depend on the tenancy contract. Penalties must align with agreed clauses."
    },
    {
      question: "Can I sell my property while it is rented?",
      answer: "Yes. The tenancy usually transfers to the new owner unless otherwise agreed."
    },
    {
      question: "Who registers Ejari?",
      answer: "Ejari registration is mandatory and coordinated as part of the rental process."
    }
  ];

  const afterHandover = [
    "Lease renewals",
    "Market-aligned rent reviews",
    "Re-listing strategies",
    "Long-term asset planning (hold vs sell)"
  ];

  const tocItems = [
    { id: 'who-this-guide-is-for', title: 'Who This Guide Is For', icon: Users },
    { id: 'listing-process', title: 'Listing Process', icon: Home },
    { id: 'pricing', title: 'Pricing Strategy', icon: TrendingUp },
    { id: 'responsibilities', title: 'Your Responsibilities', icon: Scale },
    { id: 'jbj-support', title: 'JBJ Support', icon: Building },
    { id: 'faq', title: 'FAQ', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Landlord Guide Dubai | How to Rent Out Your Property | JBJ GLOBAL REAL ESTATE"
        description="A clear, transparent, and regulation-aligned guide to renting your property in Dubai — designed to protect landlords, set correct expectations, and support informed decision-making."
      />

      <GuideHero
        badge="Landlord Guide"
        badgeIcon={Building}
        title={
          <>
            A Complete Guide for{" "}
            <span className="text-gold">Landlords in Dubai</span>
          </>
        }
        description="A clear, transparent, and regulation-aligned guide to renting your property in Dubai — designed to protect landlords, set correct expectations, and support informed decision-making."
        backgroundImage="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <Button 
              className="relative bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300"
              onClick={() => document.getElementById('listing-process')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ArrowDown className="w-4 h-4 mr-2 text-black" />
              <span className="text-gold font-semibold">Read the Full Guide</span>
            </Button>
            <Button asChild className="relative bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300">
              <Link to="/landlord-portal">
                <span className="text-gold font-semibold">List Your Property</span>
                <ArrowUpRight className="w-4 h-4 ml-2 text-black" />
              </Link>
            </Button>
          </>
        }
      />

      {/* Sticky Table of Contents - z-[60] to appear above JBJ support widget */}
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

      {/* Who This Guide Is For */}
      <section id="who-this-guide-is-for" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                Who This Guide Is For
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                This guide is educational and reflects standard rental practices under UAE law.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200">
              <p className="text-zinc-700 mb-6">This guide is designed for:</p>
              <ul className="space-y-3">
                {whoThisGuideIsFor.map((item, index) => (
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

      {/* Listing Process */}
      <section id="listing-process" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                How Renting a Property in Dubai Works (Step-by-Step)
              </h2>
            </div>

            <div className="space-y-6">
              {listingProcess.map((step) => (
                <div
                  key={step.number}
                  className="bg-white rounded-2xl p-6 md:p-8 border border-zinc-200 hover:border-gold/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 rounded-2xl flex items-center justify-center">
                        <span className="text-gold text-2xl font-semibold">{step.number}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <step.icon className="w-5 h-5 text-gold" />
                        <h3 className="text-xl md:text-2xl font-medium text-black">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-zinc-600 mb-4">{step.description}</p>
                      <ul className="grid md:grid-cols-2 gap-3">
                        {step.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
                            <span className="text-zinc-700 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                      {step.note && (
                        <p className="mt-4 text-sm text-zinc-500 italic">{step.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Strategy */}
      <section id="pricing" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                Rental Pricing & Market Positioning
              </h2>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-6 md:p-8">
              <p className="text-zinc-700 mb-6">Rental pricing should be:</p>
              <ul className="space-y-3 mb-6">
                {pricingPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{point}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-zinc-500 italic">Rental prices must comply with Dubai regulations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Landlord Responsibilities */}
      <section id="responsibilities" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                Landlord Responsibilities Under UAE Law
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Understanding these responsibilities reduces disputes.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-6 md:p-8">
              <p className="text-zinc-700 mb-6">Landlords are legally responsible for:</p>
              <ul className="space-y-4">
                {landlordResponsibilities.map((resp, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-black border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <resp.icon className="w-5 h-5 text-gold" />
                    </div>
                    <span className="text-zinc-700 pt-2">{resp.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* JBJ Services */}
      <section id="jbj-support" className="py-16 md:py-24 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-black mb-4">
                How <span className="text-gold">JBJ GLOBAL REAL ESTATE</span> Supports Landlords
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                JBJ GLOBAL REAL ESTATE is licensed for BUY · SELL · RENT in Dubai.
              </p>
            </div>

            <div className="bg-white border border-gold/30 rounded-2xl p-8 shadow-lg mb-8">
              <p className="text-zinc-700 mb-6">We support landlords by:</p>
              <div className="grid md:grid-cols-2 gap-4">
                {jbjServices.map((service, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{service}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-zinc-500 italic">
                JBJ does not provide rental guarantees, fixed returns, or income assurances.
              </p>
            </div>

            {/* What We Do Not Promise */}
            <div className="bg-white border border-zinc-300 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-black border border-gold/30 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-gold" />
                </div>
                <h3 className="text-xl font-medium text-black">What We Do Not Promise (Important)</h3>
              </div>
              <p className="text-zinc-700 mb-4">We do not:</p>
              <ul className="space-y-3 mb-6">
                {weDoNotPromise.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-zinc-500 italic">
                Real estate outcomes depend on market conditions, tenant behavior, and regulatory frameworks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                Landlord-Specific FAQ
              </h2>
            </div>

            <div className="space-y-4">
              {faqItems.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white border border-zinc-200 rounded-xl p-6 hover:border-gold/30 transition-colors"
                >
                  <h3 className="text-lg font-medium text-black mb-3">{faq.question}</h3>
                  <p className="text-zinc-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* After Handover & Renewals */}
      <section className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                After Handover & Renewals
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                A rental strategy should evolve with the market.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-6 md:p-8">
              <p className="text-zinc-700 mb-6">Landlords should plan for:</p>
              <ul className="space-y-3">
                {afterHandover.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <RefreshCw className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final Statement */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white border border-gold/30 rounded-2xl p-8 md:p-12 shadow-lg">
              <AlertTriangle className="w-12 h-12 text-gold mx-auto mb-6" />
              <p className="text-lg text-zinc-700 mb-4">
                This guide is provided for educational purposes only.
              </p>
              <p className="text-zinc-600 mb-6">
                All rental decisions remain the responsibility of the property owner and must comply with UAE law.
              </p>
              <p className="text-lg font-medium text-black">
                <span className="text-gold">JBJ GLOBAL REAL ESTATE</span> supports landlords through transparency, market knowledge, and compliant processes — not promises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Guides */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-light text-black mb-4">Related Guides</h2>
            <p className="text-zinc-600">Explore more resources for landlords and tenants</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="primary">
              <Link to="/rent-guide">
                Rent Guide
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/tenant-guide">
                Tenant Guide
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Founder-Led Philosophy & Advisory Positioning */}
      <FounderPhilosophySection />

      {/* CTA */}
      <GuideCTA
        title="Ready to List Your Property?"
        description="Our rental team can help you market, screen tenants, and manage your rental property."
        primaryAction={{
          label: "List Your Property for Rent",
          href: "/landlord-portal",
          icon: ArrowRight
        }}
        showContactOptions
      />

      {/* Guide Navigation - White background to separate from footer */}
      <div className="bg-white py-12 border-t border-zinc-200">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/landlord-guide" guides={GUIDE_LINKS} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LandlordGuide;
