import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
  FileText, 
  Home, 
  MapPin,
  Users,
  Building2,
  ArrowRight,
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
  Building
} from "lucide-react";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import { GuideSection } from "@/components/guides/GuideSection";
import { GuideCTA } from "@/components/guides/GuideCTA";
import Footer from "@/components/Footer";

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
        "Lease agreement preparation and negotiation",
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
        backgroundImage="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <Button 
              variant="outline"
              className="border-gold/50 text-gold hover:bg-gold/10 px-6"
              onClick={() => document.getElementById('rental-process')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              Read the Full Guide
            </Button>
            <Button asChild className="bg-gold hover:bg-gold/90 text-black font-medium px-6">
              <Link to="/properties?transaction=rent">
                View Rental Properties
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </>
        }
      />

      {/* Sticky Table of Contents */}
      <div className="hidden lg:block fixed right-8 top-1/3 z-30">
        <GuideTableOfContents items={tocItems} />
      </div>

      {/* How Renting Works in Dubai */}
      <section id="how-renting-works" className="py-16 md:py-24 bg-zinc-900/30 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
                How Renting Works in Dubai
              </h2>
              <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl mx-auto">
                Dubai's rental market is well-regulated, offering protection for both tenants and landlords. 
                Understanding the basics helps you navigate the process with confidence.
              </p>
            </div>
            
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
                <div key={index} className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-800 hover:border-gold/30 transition-colors">
                  <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-medium text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rental Process Steps */}
      <section id="rental-process" className="py-16 md:py-24 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light text-zinc-900 mb-4">
                The 6-Step Rental Process
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                From initial search to move-in day — here's what to expect when renting in Dubai.
              </p>
            </div>

            <div className="space-y-6">
              {rentalProcess.map((step) => (
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
        </div>
      </section>

      {/* Payment Structures */}
      <section id="payment-structures" className="py-16 md:py-24 bg-zinc-900/50 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                Payment Structures
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Dubai's rental market uses a cheque-based payment system. Understanding your options helps in negotiation.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paymentStructures.map((structure, index) => (
                <div 
                  key={index}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 hover:border-gold/30 transition-colors"
                >
                  <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center mb-4">
                    <structure.icon className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{structure.title}</h3>
                  <p className="text-sm text-zinc-400">{structure.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Costs & Fees */}
      <section id="costs-fees" className="py-16 md:py-24 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-zinc-900 mb-4">
                Rental Costs & Fees
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Beyond the monthly rent, budget for these one-time and recurring costs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {costs.map((cost, index) => (
                <div 
                  key={index}
                  className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <cost.icon className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-zinc-900 mb-1">{cost.title}</h3>
                      <p className="text-sm text-zinc-600">{cost.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How JBJ Supports Tenants & Landlords */}
      <section id="jbj-support" className="py-16 md:py-24 bg-zinc-900/30 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                How JBJ GLOBAL REAL ESTATE Supports You
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Licensed for BUY, SELL & RENT (LEASING), we provide professional brokerage services for both tenants and landlords.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {jbjSupport.map((support, index) => (
                <div 
                  key={index}
                  className="bg-zinc-900/60 rounded-2xl p-8 border border-zinc-800 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center">
                      <support.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-xl font-medium text-white">{support.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {support.points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
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

      {/* Related Guides */}
      <section className="py-16 md:py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-light text-white mb-4">Related Guides</h2>
            <p className="text-zinc-400">Explore more resources for tenants and landlords</p>
          </div>
          <div className="flex justify-center gap-4">
            <Button asChild variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
              <Link to="/tenant-guide">
                Tenant Guide
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
              <Link to="/landlord-guide">
                Landlord Guide
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <GuideCTA
        title="Ready to Find Your Next Home?"
        description="Speak with a JBJ leasing advisor to explore rental properties across Dubai."
        primaryAction={{
          label: "View Rental Properties",
          href: "/properties?transaction=rent",
          icon: ArrowRight
        }}
        showContactOptions
      />

      {/* Guide Navigation */}
      <div className="bg-black py-12">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/rent-guide" guides={GUIDE_LINKS} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RentGuide;
