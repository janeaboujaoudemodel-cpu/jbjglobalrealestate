import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FounderPhilosophySection } from "@/components/FounderPhilosophySection";
import { 
  CheckCircle2, 
  FileText, 
  Home, 
  MapPin,
  Users,
  Building2,
  ArrowRight,
  ArrowUpRight,
  Shield,
  Banknote,
  Key,
  Clock,
  Calendar,
  Phone,
  ArrowDown,
  CreditCard,
  AlertTriangle,
  HelpCircle,
  User,
  Building,
  MessageCircle
} from "lucide-react";
import rentGuideHero from "@/assets/images/rent-guide-hero.jpg";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import { GuideSection } from "@/components/guides/GuideSection";
import { GuideSectionHeader } from "@/components/guides/GuideSectionHeader";
import { GuideCTA } from "@/components/guides/GuideCTA";


const RentGuide = () => {
  const rentalProcess = [
    {
      number: 1,
      title: "Define Your Requirements",
      icon: MapPin,
      description: "Start by understanding what you need in a rental property.",
      items: [
        "Set your monthly rental budget including utilities and service charges",
        "Choose preferred locations based on work, schools, or lifestyle",
        "Decide on property type: apartment, villa, townhouse, or studio",
        "Determine lease duration preferences (typically 12 months)"
      ]
    },
    {
      number: 2,
      title: "Search & Shortlist",
      icon: Building2,
      description: "Explore available rental properties that match your criteria.",
      items: [
        "Browse listings across Dubai's neighborhoods",
        "Compare amenities, layouts, and community features",
        "Create a shortlist of 5-10 properties to view",
        "Check proximity to metro, schools, and daily essentials"
      ]
    },
    {
      number: 3,
      title: "Property Viewings",
      icon: Home,
      description: "Visit properties in person to assess suitability.",
      items: [
        "Schedule viewings during daylight to assess natural lighting",
        "Check appliance condition, water pressure, and AC units",
        "Note any maintenance issues to discuss with the landlord",
        "Ask about building rules, parking, and community access"
      ]
    },
    {
      number: 4,
      title: "Negotiation & Agreement",
      icon: FileText,
      description: "Agree on terms and sign the rental contract.",
      items: [
        "Negotiate rent, payment terms, and any included furnishings",
        "Review the tenancy contract carefully before signing",
        "Agree on number of cheques (1, 2, 4, 6, or 12 payments)",
        "Clarify security deposit amount (typically 5% of annual rent)"
      ]
    },
    {
      number: 5,
      title: "Ejari Registration",
      icon: Shield,
      description: "Register your tenancy with Dubai Land Department.",
      items: [
        "Ejari is mandatory for all residential tenancies in Dubai",
        "Required for visa applications, utility connections, and legal protection",
        "Your landlord or broker typically assists with registration",
        "Keep your Ejari certificate safe for future reference"
      ]
    },
    {
      number: 6,
      title: "Move In",
      icon: Key,
      description: "Complete the handover and settle into your new home.",
      items: [
        "Conduct a move-in inspection and document property condition",
        "Set up DEWA (electricity and water) in your name",
        "Collect keys, access cards, and parking permits",
        "Register with building management if required"
      ]
    }
  ];

  const paymentStructures = [
    {
      title: "1 Cheque (Annual)",
      description: "Full year paid upfront — often preferred by landlords and may secure better rates.",
      icon: CreditCard
    },
    {
      title: "2 Cheques",
      description: "Split into two payments, typically every 6 months.",
      icon: Calendar
    },
    {
      title: "4 Cheques",
      description: "Quarterly payments — increasingly common in Dubai.",
      icon: Calendar
    },
    {
      title: "6 or 12 Cheques",
      description: "More flexible but may come at a premium on rent.",
      icon: Calendar
    }
  ];

  const costs = [
    {
      title: "Security Deposit",
      description: "Typically 5% of annual rent, refundable at end of tenancy",
      icon: Shield
    },
    {
      title: "Agency Commission",
      description: "Usually 5% of annual rent (one-time fee)",
      icon: Users
    },
    {
      title: "Ejari Registration",
      description: "Approximately AED 195–220 depending on service center",
      icon: FileText
    },
    {
      title: "DEWA Deposit",
      description: "AED 2,000 for apartments, AED 4,000 for villas",
      icon: Banknote
    },
    {
      title: "Moving Costs",
      description: "Budget AED 500–2,000 depending on volume and distance",
      icon: Home
    }
  ];

  const jbjSupport = [
    {
      title: "For Tenants",
      icon: User,
      points: [
        "Access to curated rental listings across Dubai",
        "Guided property viewings with licensed brokers",
        "Assistance with tenancy contract review",
        "Support with Ejari registration process"
      ]
    },
    {
      title: "For Landlords",
      icon: Building,
      points: [
        "Property marketing and tenant sourcing",
        "Tenant screening and reference checks",
        "Rental agreement preparation and negotiation",
        "Ejari registration coordination"
      ]
    }
  ];

  const tocItems = [
    { id: 'how-renting-works', title: 'How Renting Works', icon: Home },
    { id: 'rental-process', title: 'Rental Process', icon: FileText },
    { id: 'payment-structures', title: 'Payment Options', icon: CreditCard },
    { id: 'costs-fees', title: 'Costs & Fees', icon: Banknote },
    { id: 'jbj-support', title: 'How JBJ Helps', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Renting Guide Dubai | How to Rent Property | JBJ GLOBAL REAL ESTATE"
        description="Complete guide to renting property in Dubai. Learn about the rental process, Ejari registration, payment structures, and how JBJ GLOBAL REAL ESTATE supports tenants and landlords."
      />

      <GuideHero
        badge="Complete Rental Guide"
        badgeIcon={Key}
        title={
          <>
            Your Guide to{" "}
            <span className="text-gold">Renting Property in Dubai</span>
          </>
        }
        description="A clear, educational resource covering everything you need to know about renting in Dubai — from finding the right property to understanding your rights as a tenant."
        backgroundImage={rentGuideHero}
        actions={
          <>
            <button 
              onClick={() => document.getElementById('rental-process')?.scrollIntoView({ behavior: 'smooth' })}
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
                <span className="text-white group-hover:text-black transition-colors">View Rental Properties</span>
                <ArrowUpRight className="w-4 h-4 text-gold group-hover:text-black transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                <span className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
            </Link>
          </>
        }
      />

      {/* Sticky Table of Contents - z-[60] to appear above JBJ support widget */}
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

      {/* How Renting Works in Dubai */}
      <section id="how-renting-works" className="py-16 md:py-24 jj-section-champagne scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Home} title="How Renting Works in Dubai" />
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: Calendar, 
                title: "Typical Lease Terms", 
                desc: "Most residential leases are 12 months, with renewal options. Shorter terms may be available but often at a premium." 
              },
              { 
                icon: CreditCard, 
                title: "Payment by Cheques", 
                desc: "Rent is typically paid via post-dated cheques (1, 2, 4, or more). This is standard practice in Dubai." 
              },
              { 
                icon: Shield, 
                title: "Ejari Protection", 
                desc: "All tenancies must be registered with Ejari (Dubai Land Department) to be legally valid." 
              }
            ].map((item, index) => (
              <div key={index} className="jj-card-inner p-6">
                <div className="w-12 h-12 jj-icon-box-active rounded-xl mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-black mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rental Process Steps */}
      <section id="rental-process" className="py-16 md:py-24 jj-section-champagne scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={FileText} title="The 6-Step Rental Process" />

          <div className="space-y-6">
            {rentalProcess.map((step) => (
              <div 
                key={step.number}
                className="jj-card-inner p-6 md:p-8 hover:border-gold hover:shadow-lg transition-all duration-300"
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
                      <h3 className="text-xl md:text-2xl font-medium text-zinc-900">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-zinc-500 mb-4">{step.description}</p>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {step.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3">
                          <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
                          <span className="text-zinc-600 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Structures */}
      <section id="payment-structures" className="py-16 md:py-24 jj-section-champagne scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={CreditCard} title="Payment Structures" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentStructures.map((structure, index) => (
              <div 
                key={index}
                className="jj-card-inner p-6"
              >
                <div className="w-10 h-10 jj-icon-box-active rounded-lg mb-4">
                  <structure.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-medium text-black mb-2">{structure.title}</h3>
                <p className="text-sm text-zinc-600">{structure.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Costs & Fees */}
      <section id="costs-fees" className="py-16 md:py-24 jj-section-champagne scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Banknote} title="Rental Costs & Fees" />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {costs.map((cost, index) => (
              <div 
                key={index}
                className="jj-card-inner p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 jj-icon-box-active rounded-lg flex-shrink-0">
                    <cost.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-black mb-1">{cost.title}</h3>
                    <p className="text-sm text-zinc-600">{cost.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How JBJ Supports Tenants & Landlords */}
      <section id="jbj-support" className="py-16 md:py-24 jj-section-champagne scroll-mt-20">
        <div className="jj-guide-content">
          <GuideSectionHeader icon={Users} title="How JBJ Supports You" />

          <div className="grid md:grid-cols-2 gap-6">
            {jbjSupport.map((support, index) => (
              <div 
                key={index}
                className="jj-card-inner rounded-2xl p-8 hover:border-gold hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="jj-icon-box-active w-12 h-12 rounded-xl">
                    <support.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-medium text-black">{support.title}</h3>
                </div>
                <ul className="space-y-3">
                  {support.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-700 text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Guides */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-black mb-4">Related Guides</h2>
            <p className="text-zinc-600">Explore more resources for tenants and landlords</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/tenant-guide"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300"
            >
              <span className="text-gold font-semibold">Tenant Guide</span>
              <ArrowUpRight className="w-4 h-4 text-black" />
            </Link>
            <Link 
              to="/landlord-guide"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300"
            >
              <span className="text-gold font-semibold">Landlord Guide</span>
              <ArrowUpRight className="w-4 h-4 text-black" />
            </Link>
          </div>
        </div>
      </section>

      {/* Founder-Led Philosophy & Advisory Positioning */}
      <FounderPhilosophySection />

      {/* CTA */}
      <GuideCTA
        title="Ready to Find Your Next Home?"
        description="Speak with a JBJ rental advisor to explore rental properties across Dubai."
        primaryAction={{
          label: "View Rental Properties",
          href: "/properties?transaction=rent",
          icon: ArrowRight
        }}
        showContactOptions
      />

      {/* Guide Navigation - Active Champagne Layer */}
      <div className="jj-section-champagne py-12">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/rent-guide" guides={GUIDE_LINKS} />
        </div>
      </div>

      {/* Global CTA handled by MainLayout */}
    </div>
  );
};

export default RentGuide;
