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
  HelpCircle,
  RefreshCw,
  Wrench,
  Phone,
  Scale,
  BookOpen
} from "lucide-react";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import { GuideCTA } from "@/components/guides/GuideCTA";
import Footer from "@/components/Footer";

const TenantGuide = () => {
  const tenantResponsibilities = [
    {
      title: "Rent Payment",
      icon: Banknote,
      description: "Pay rent on time as per cheque dates in your contract.",
      details: [
        "Post-dated cheques must be honoured on their due dates",
        "Bounced cheques can lead to legal action and rental disputes",
        "Communicate early if you anticipate payment difficulties"
      ]
    },
    {
      title: "Property Care",
      icon: Wrench,
      description: "Maintain the property in good condition throughout your tenancy.",
      details: [
        "Report maintenance issues to your landlord promptly",
        "Minor repairs may be your responsibility (check contract)",
        "Major structural or appliance issues are typically landlord's responsibility"
      ]
    },
    {
      title: "Building Rules",
      icon: Scale,
      description: "Comply with community and building management regulations.",
      details: [
        "Follow parking, pet, and noise regulations",
        "Obtain permission before making any modifications",
        "Respect common area usage policies"
      ]
    },
    {
      title: "End of Tenancy",
      icon: Key,
      description: "Return the property in original condition (fair wear excepted).",
      details: [
        "Clean the property before handover",
        "Return all keys, access cards, and remotes",
        "Settle all outstanding utility bills"
      ]
    }
  ];

  const ejariInfo = [
    {
      title: "What is Ejari?",
      icon: Shield,
      description: "Ejari is Dubai's official tenancy registration system managed by the Real Estate Regulatory Agency (RERA). It creates a legal record of your tenancy contract."
    },
    {
      title: "Why is it Important?",
      icon: CheckCircle2,
      description: "Required for UAE residence visa applications, school enrollments, utility connections (DEWA), and legal protection in rental disputes."
    },
    {
      title: "How to Register?",
      icon: FileText,
      description: "Ejari registration is typically handled by your landlord or broker. You can also register online or at Dubai Land Department service centers."
    },
    {
      title: "Documents Needed",
      icon: BookOpen,
      description: "Signed tenancy contract, passport copies, Emirates ID (if applicable), title deed copy, and landlord's Emirates ID."
    }
  ];

  const renewalInfo = [
    {
      title: "Renewal Notice",
      description: "Landlords must give 90 days notice if they wish to change terms or not renew. Tenants should communicate intentions in advance.",
      icon: Calendar
    },
    {
      title: "Rent Increase Limits",
      description: "Rent increases are regulated by RERA's rental index calculator. Landlords cannot increase rent arbitrarily.",
      icon: Banknote
    },
    {
      title: "Negotiation Rights",
      description: "Tenants have the right to negotiate renewal terms. Consider market conditions when discussing rent adjustments.",
      icon: Users
    },
    {
      title: "Ejari Update",
      description: "After renewal, your Ejari registration must be updated with the new contract terms and dates.",
      icon: RefreshCw
    }
  ];

  const securityDeposit = [
    "Security deposit is typically 5% of annual rent",
    "Held by landlord as protection against damages",
    "Refundable at end of tenancy if property is returned in good condition",
    "Document property condition at move-in to avoid disputes",
    "Landlord may deduct for damages beyond normal wear and tear",
    "If disputes arise, RERA's Rental Dispute Settlement Centre can arbitrate"
  ];

  const tocItems = [
    { id: 'responsibilities', title: 'Tenant Responsibilities', icon: Users },
    { id: 'ejari', title: 'Understanding Ejari', icon: Shield },
    { id: 'deposits-renewals', title: 'Deposits & Renewals', icon: Banknote },
    { id: 'rights', title: 'Your Rights', icon: Scale },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Tenant Guide Dubai | Tenant Rights & Responsibilities | JBJ GLOBAL REAL ESTATE"
        description="Complete tenant guide for renting in Dubai. Learn about your responsibilities, Ejari registration, security deposits, and tenant rights."
      />

      <GuideHero
        badge="Tenant Guide"
        badgeIcon={Users}
        title={
          <>
            A Guide for{" "}
            <span className="text-gold">Tenants in Dubai</span>
          </>
        }
        description="Understand your rights and responsibilities as a tenant in Dubai. This educational guide covers the essentials of renting — from Ejari registration to renewal negotiations."
        backgroundImage="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <Button 
              variant="outline"
              className="border-gold/50 text-gold hover:bg-gold/10 px-6"
              onClick={() => document.getElementById('responsibilities')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              Read the Full Guide
            </Button>
            <Button asChild className="bg-gold hover:bg-gold/90 text-black font-medium px-6">
              <Link to="/properties?transaction=rent">
                Find Rental Properties
                <ArrowRight className="w-4 h-4 ml-2" />
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
            label: "Find Rentals Now",
            href: "/properties?transaction=rent",
            icon: Home
          }}
        />
      </div>

      {/* Tenant Responsibilities */}
      <section id="responsibilities" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
                Tenant Responsibilities
              </h2>
              <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl mx-auto">
                As a tenant in Dubai, you have specific obligations under your tenancy contract. 
                Understanding these helps maintain a good relationship with your landlord.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {tenantResponsibilities.map((resp, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 border border-zinc-200 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-black border border-gold/30 rounded-xl flex items-center justify-center">
                      <resp.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black">{resp.title}</h3>
                      <p className="text-sm text-zinc-600">{resp.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {resp.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-700 text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Understanding Ejari */}
      <section id="ejari" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                Understanding Ejari
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Ejari registration is mandatory for all residential tenancies in Dubai. Here's what you need to know.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {ejariInfo.map((info, index) => (
                <div 
                  key={index}
                  className="bg-white border border-zinc-200 rounded-xl p-6 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-black border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <info.icon className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-black mb-2">{info.title}</h3>
                      <p className="text-sm text-zinc-600">{info.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Educational Disclaimer */}
            <div className="mt-8 bg-amber-900/30 border border-amber-600/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-300 mb-2">Educational Information Only</h4>
                  <p className="text-sm text-amber-200/80">
                    This guide provides educational information about Ejari. JBJ GLOBAL REAL ESTATE does not 
                    directly process Ejari registrations. Your landlord or a licensed service center handles 
                    the official registration process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deposits & Renewals */}
      <section id="deposits-renewals" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                Deposits & Renewals
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Understand how security deposits work and what to expect during rental renewals.
              </p>
            </div>

            {/* Security Deposit */}
            <div className="mb-10">
              <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-3">
                <Shield className="w-5 h-5 text-gold" />
                Security Deposit
              </h3>
              <div className="bg-white border border-zinc-200 rounded-xl p-6">
                <ul className="grid md:grid-cols-2 gap-4">
                  {securityDeposit.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
                      <span className="text-zinc-700 text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Renewal Info */}
            <div>
              <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-gold" />
                Rental Renewals
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {renewalInfo.map((info, index) => (
                  <div
                    key={index}
                    className="bg-white border border-zinc-200 rounded-xl p-6 hover:border-gold/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-black border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <info.icon className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <h4 className="font-medium text-black mb-1">{info.title}</h4>
                        <p className="text-sm text-zinc-600">{info.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Rights */}
      <section id="rights" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                Your Rights as a Tenant
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Dubai's rental laws provide important protections for tenants. Know your rights.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Protection from Eviction",
                  icon: Shield,
                  desc: "Landlords must follow legal procedures and provide proper notice (typically 12 months) before eviction."
                },
                {
                  title: "Rent Increase Regulation",
                  icon: Banknote,
                  desc: "Rent increases are regulated by RERA's rental index. Excessive increases can be challenged."
                },
                {
                  title: "Habitable Property",
                  icon: Home,
                  desc: "You have the right to a property that meets basic living standards with functioning utilities."
                },
                {
                  title: "Dispute Resolution",
                  icon: Scale,
                  desc: "Access to RERA's Rental Dispute Settlement Centre for unresolved conflicts with landlords."
                }
              ].map((right, index) => (
                <div key={index} className="bg-white border border-zinc-200 rounded-xl p-6 hover:border-gold/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-black border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <right.icon className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-black mb-2">{right.title}</h3>
                      <p className="text-sm text-zinc-600">{right.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Guides */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-light text-black mb-4">Related Guides</h2>
            <p className="text-zinc-600">Explore more resources for tenants and landlords</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild variant="primary">
              <Link to="/rent-guide">
                Rent Guide
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/landlord-guide">
                Landlord Guide
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
        title="Looking for Your Next Rental Home?"
        description="Our licensed rental advisors can help you find the perfect rental property in Dubai."
        primaryAction={{
          label: "Find Rental Properties",
          href: "/properties?transaction=rent",
          icon: ArrowRight
        }}
        showContactOptions
      />

      {/* Guide Navigation - White background to separate from footer */}
      <div className="bg-white py-12 border-t border-zinc-200">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/tenant-guide" guides={GUIDE_LINKS} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TenantGuide;
