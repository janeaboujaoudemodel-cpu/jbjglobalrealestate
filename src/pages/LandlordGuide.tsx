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
  Wrench
} from "lucide-react";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import { GuideCTA } from "@/components/guides/GuideCTA";
import Footer from "@/components/Footer";

const LandlordGuide = () => {
  const listingProcess = [
    {
      number: 1,
      title: "Prepare Your Property",
      icon: Home,
      description: "Ensure your property is ready for the rental market.",
      items: [
        "Complete any necessary repairs and maintenance",
        "Deep clean the property including AC ducts",
        "Ensure all appliances are in working order",
        "Consider whether to offer furnished or unfurnished"
      ]
    },
    {
      number: 2,
      title: "Set the Right Price",
      icon: TrendingUp,
      description: "Price your property competitively for the current market.",
      items: [
        "Research comparable rentals in your area",
        "Consider location, amenities, and property condition",
        "Factor in market demand and seasonality",
        "Be realistic to avoid extended vacancy periods"
      ]
    },
    {
      number: 3,
      title: "Professional Photography",
      icon: Camera,
      description: "Quality photos significantly impact enquiry rates.",
      items: [
        "Use professional photography for listings",
        "Capture all rooms, views, and key features",
        "Photograph building amenities (gym, pool, parking)",
        "Consider video tours for premium properties"
      ]
    },
    {
      number: 4,
      title: "Marketing & Listings",
      icon: Megaphone,
      description: "Maximize exposure to qualified tenants.",
      items: [
        "List on major property portals (Bayut, Property Finder, Dubizzle)",
        "Engage a licensed brokerage for wider reach",
        "Highlight unique selling points in descriptions",
        "Respond promptly to enquiries"
      ]
    },
    {
      number: 5,
      title: "Tenant Screening",
      icon: UserCheck,
      description: "Select reliable tenants to protect your investment.",
      items: [
        "Verify employment and income documentation",
        "Request references from previous landlords",
        "Check visa status and Emirates ID validity",
        "Conduct property viewings with serious enquiries"
      ]
    },
    {
      number: 6,
      title: "Contract & Handover",
      icon: FileText,
      description: "Formalize the tenancy and complete the handover.",
      items: [
        "Draft a comprehensive tenancy contract",
        "Register with Ejari (mandatory)",
        "Conduct a move-in inspection with photos",
        "Hand over keys, access cards, and parking permits"
      ]
    }
  ];

  const pricingTips = [
    {
      title: "Research the Market",
      description: "Compare similar properties in your building and area. Online portals provide good benchmarks.",
      icon: Target
    },
    {
      title: "Consider Cheque Structure",
      description: "Fewer cheques (1-2) often attract tenants willing to pay slightly more for convenience.",
      icon: Banknote
    },
    {
      title: "Factor in Amenities",
      description: "Properties with views, balconies, or premium finishes can command higher rents.",
      icon: Building
    },
    {
      title: "Adjust for Market Conditions",
      description: "Be prepared to adjust pricing based on enquiry levels and market feedback.",
      icon: TrendingUp
    }
  ];

  const tenantScreening = [
    {
      title: "Employment Verification",
      icon: UserCheck,
      points: [
        "Request salary certificates or employment contracts",
        "Verify employment directly with employer if possible",
        "Look for stable income of at least 3x monthly rent"
      ]
    },
    {
      title: "Reference Checks",
      icon: Users,
      points: [
        "Contact previous landlords for rental history",
        "Ask about payment reliability and property care",
        "Verify length of previous tenancies"
      ]
    },
    {
      title: "Documentation Review",
      icon: FileText,
      points: [
        "Valid passport and visa (if applicable)",
        "Emirates ID (for UAE residents)",
        "Confirm visa validity covers lease duration"
      ]
    }
  ];

  const landlordResponsibilities = [
    {
      title: "Property Maintenance",
      icon: Wrench,
      desc: "Maintain the property in habitable condition. Major repairs (AC, plumbing, structural) are typically your responsibility."
    },
    {
      title: "Ejari Registration",
      icon: Shield,
      desc: "Ensure the tenancy is registered with Ejari. This protects both you and your tenant legally."
    },
    {
      title: "Notice Periods",
      icon: Calendar,
      desc: "Provide proper notice (typically 90 days for renewals, 12 months for eviction) as per Dubai rental law."
    },
    {
      title: "Rent Increase Limits",
      icon: Banknote,
      desc: "Any rent increases must comply with RERA's rental index calculator. Excessive increases are not enforceable."
    }
  ];

  const jbjServices = [
    "Property valuation and rental pricing advice",
    "Professional photography and marketing",
    "Listing on major portals with premium visibility",
    "Tenant screening and reference verification",
    "Lease negotiation and contract preparation",
    "Ejari registration coordination",
    "Move-in inspection and handover support"
  ];

  const tocItems = [
    { id: 'listing-process', title: 'Listing Process', icon: Home },
    { id: 'pricing', title: 'Pricing Strategy', icon: TrendingUp },
    { id: 'tenant-screening', title: 'Tenant Screening', icon: UserCheck },
    { id: 'responsibilities', title: 'Your Responsibilities', icon: Scale },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Landlord Guide Dubai | How to Rent Out Your Property | JBJ GLOBAL REAL ESTATE"
        description="Complete guide for landlords in Dubai. Learn how to list your property for rent, screen tenants, and manage your rental investment effectively."
      />

      <GuideHero
        badge="Landlord Guide"
        badgeIcon={Building}
        title={
          <>
            A Guide for{" "}
            <span className="text-gold">Landlords in Dubai</span>
          </>
        }
        description="Learn how to successfully list your property for rent, screen quality tenants, and manage your rental investment. This educational guide covers the essentials of being a landlord in Dubai."
        backgroundImage="https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <Button 
              variant="secondary"
              className="px-6"
              onClick={() => document.getElementById('listing-process')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              Read the Full Guide
            </Button>
            <Button asChild variant="primary" className="px-6">
              <Link to="/contact">
                List Your Property
                <ArrowUpRight className="w-4 h-4 ml-2 text-gold" />
              </Link>
            </Button>
          </>
        }
      />

      {/* Sticky Table of Contents - z-50 to appear above JBJ support widget */}
      <div className="hidden lg:block fixed right-8 top-1/3 z-50">
        <GuideTableOfContents 
          items={tocItems}
          ctaAction={{
            label: "List Your Property Now",
            href: "/seller-listing",
            icon: Building
          }}
        />
      </div>

      {/* Listing Process */}
      <section id="listing-process" className="py-16 md:py-24 bg-zinc-900/30 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                The 6-Step Listing Process
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                From preparing your property to handing over the keys — here's your roadmap to successful rentals.
              </p>
            </div>

            <div className="space-y-6">
              {listingProcess.map((step) => (
                <div 
                  key={step.number}
                  className="bg-zinc-900/60 rounded-2xl p-6 md:p-8 border border-zinc-800 hover:border-gold/30 transition-all duration-300"
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
                        <h3 className="text-xl md:text-2xl font-medium text-white">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-zinc-400 mb-4">{step.description}</p>
                      <ul className="grid md:grid-cols-2 gap-3">
                        {step.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
                            <span className="text-zinc-300 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
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
                Pricing & Market Positioning
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                The right price attracts quality tenants quickly. Price too high and your property sits vacant; too low and you leave money on the table.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {pricingTips.map((tip, index) => (
                <div 
                  key={index}
                  className="bg-white border border-zinc-200 rounded-xl p-6 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-black border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <tip.icon className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-black mb-2">{tip.title}</h3>
                      <p className="text-sm text-zinc-600">{tip.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tenant Screening */}
      <section id="tenant-screening" className="py-16 md:py-24 bg-zinc-900/50 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                Tenant Screening Support
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Quality tenants protect your investment. Here's what to verify before signing a lease.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {tenantScreening.map((item, index) => (
                <div 
                  key={index}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 hover:border-gold/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-4">{item.title}</h3>
                  <ul className="space-y-2">
                    {item.points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-300 text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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
                Your Responsibilities as a Landlord
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Dubai's rental laws outline specific obligations for landlords. Understanding these helps avoid disputes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {landlordResponsibilities.map((resp, index) => (
                <div 
                  key={index}
                  className="bg-white border border-zinc-200 rounded-xl p-6 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-black border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <resp.icon className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-black mb-2">{resp.title}</h3>
                      <p className="text-sm text-zinc-600">{resp.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* JBJ Services */}
      <section className="py-16 md:py-24 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                How JBJ GLOBAL REAL ESTATE Supports Landlords
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Licensed for BUY, SELL & RENT, we provide comprehensive landlord services.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-4">
                {jbjServices.map((service, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-200">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Guides */}
      <section className="py-16 md:py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-light text-white mb-4">Related Guides</h2>
            <p className="text-zinc-400">Explore more resources for landlords and tenants</p>
          </div>
          <div className="flex justify-center gap-4">
            <Button asChild variant="secondary">
              <Link to="/rent-guide">
                Rent Guide
                <ArrowUpRight className="w-4 h-4 ml-2 text-gold" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/tenant-guide">
                Tenant Guide
                <ArrowUpRight className="w-4 h-4 ml-2 text-gold" />
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
          href: "/contact",
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
