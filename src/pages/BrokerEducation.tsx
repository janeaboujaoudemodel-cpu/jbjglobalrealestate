import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FounderPhilosophySection } from "@/components/FounderPhilosophySection";
import { 
  CheckCircle2, 
  FileText, 
  Users,
  ArrowRight,
  ArrowDown,
  Shield,
  Target,
  Building,
  BarChart3,
  Clock,
  AlertTriangle,
  Database,
  HelpCircle,
  Phone,
  Briefcase,
  UserCheck,
  MessageSquare,
  Award,
  Network,
  TrendingUp,
  Scale
} from "lucide-react";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import Footer from "@/components/Footer";

const BrokerEducation = () => {
  const ethicsCards = [
    {
      title: "Client Interest First",
      icon: UserCheck,
      description: "Property recommendations must align with client objectives, not commission structures."
    },
    {
      title: "Transparency",
      icon: Shield,
      description: "Pricing, risks, timelines, and limitations must be clearly communicated."
    },
    {
      title: "No Pressure Selling",
      icon: MessageSquare,
      description: "Clients must never be rushed into decisions or influenced by urgency tactics."
    },
    {
      title: "Long-Term Trust",
      icon: Award,
      description: "Sustainable success is built through repeat clients and referrals — not volume chasing."
    }
  ];

  const regulatoryResponsibilities = [
    "Using approved listing practices",
    "Respecting RERA guidelines",
    "Avoiding misleading financial or return-based claims",
    "Ensuring documentation accuracy"
  ];

  const marketKnowledgeSources = [
    "Transaction history",
    "Rental index benchmarks",
    "Supply and demand trends",
    "Area-level performance indicators",
    "Government planning announcements"
  ];

  const offPlanRepresentation = [
    "Explain construction timelines realistically",
    "Clarify payment schedules and risks",
    "Avoid speculative appreciation claims"
  ];

  const readyRepresentation = [
    "Provide realistic rental and resale expectations",
    "Disclose service charges and operational costs",
    "Ensure accurate valuation context"
  ];

  const careerCards = [
    {
      title: "Reputation",
      icon: Award,
      description: "Built through honesty, consistency, and reliability."
    },
    {
      title: "Network",
      icon: Network,
      description: "Strong relationships with clients, developers, and industry professionals."
    },
    {
      title: "Professional Growth",
      icon: TrendingUp,
      description: "Continuous learning and market awareness."
    }
  ];

  const tocItems = [
    { id: 'role', title: "Broker's Responsibility", icon: Briefcase },
    { id: 'ethics', title: 'Ethics & Practice', icon: Scale },
    { id: 'regulatory', title: 'Regulatory Awareness', icon: Shield },
    { id: 'market-knowledge', title: 'Market Knowledge', icon: BarChart3 },
    { id: 'representation', title: 'Property Representation', icon: Building },
    { id: 'communication', title: 'Client Education', icon: MessageSquare },
    { id: 'career', title: 'Career Positioning', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Broker Education | Professional Real Estate Training | JBJ GLOBAL REAL ESTATE"
        description="A structured educational framework for real estate professionals operating in the UAE market. Focus on ethics, market responsibility, regulatory awareness, and long-term professional credibility."
      />

      {/* Premium Hero */}
      <GuideHero
        badge="Broker Education"
        badgeIcon={Briefcase}
        title={
          <>
            Professional{" "}
            <span className="text-gold">Broker Education</span>
          </>
        }
        description="A structured educational framework for real estate professionals operating in the UAE market. This guide focuses on ethics, market responsibility, regulatory awareness, and long-term professional credibility — not short-term transactions."
        backgroundImage="https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <button 
              onClick={() => document.getElementById('role')?.scrollIntoView({ behavior: 'smooth' })}
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
            <Link to="/broker-toolkit">
              <button 
                className="group relative inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold rounded-lg md:rounded-xl transition-all duration-300 bg-transparent"
                style={{
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                <Briefcase className="w-4 h-4 text-gold group-hover:text-black transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                <span className="text-white group-hover:text-black transition-colors">View Broker Tools</span>
                <span className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
            </Link>
          </>
        }
      />

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      {/* Sticky Table of Contents */}
      <div className="hidden lg:block fixed right-8 top-1/4 z-[60] max-w-xs">
        <GuideTableOfContents 
          items={tocItems}
          ctaAction={{
            label: "Join Broker Hub",
            href: "/broker-toolkit",
            icon: Briefcase
          }}
        />
      </div>

      {/* Section 1 - The Role of a Professional Broker */}
      <section id="role" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-zinc-200 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold text-black">
                  Understanding the Broker's Responsibility
                </h2>
              </div>
              
              <p className="text-lg text-zinc-700 leading-relaxed mb-6">
                A professional real estate broker is not a product promoter. The broker's role is to 
                represent information accurately, respect regulatory boundaries, and guide clients with integrity.
              </p>
              
              <p className="text-zinc-600 leading-relaxed">
                At JBJ Global Real Estate, brokerage is approached as a responsibility — not a sales race. 
                Brokers are expected to act as market educators, protect client interests, and operate 
                within the legal framework of the UAE at all times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - Ethics & Client-First Practice */}
      <section id="ethics" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Ethics Before Commission
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {ethicsCards.map((card, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-2xl p-8 border border-zinc-200 hover:border-gold/50 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                      <card.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-xl font-semibold text-black">{card.title}</h3>
                  </div>
                  <p className="text-zinc-600 leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Regulatory Awareness */}
      <section id="regulatory" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-zinc-200 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold text-black">
                  Operating Within UAE Regulations
                </h2>
              </div>
              
              <p className="text-lg text-zinc-700 leading-relaxed mb-6">
                Brokers must operate in full compliance with UAE real estate regulations. This includes 
                respecting licensing scope, avoiding unauthorized advisory claims, and ensuring all 
                transactions are properly registered.
              </p>
              
              <p className="text-zinc-700 mb-4">Key responsibilities include:</p>
              <ul className="space-y-3 mb-6">
                {regulatoryResponsibilities.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5">
                <p className="text-zinc-700 font-medium text-center">
                  Professional credibility is non-negotiable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 - Market Knowledge & Data Discipline */}
      <section id="market-knowledge" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-zinc-200 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold text-black">
                  Data Over Opinions
                </h2>
              </div>
              
              <p className="text-lg text-zinc-700 leading-relaxed mb-6">
                Professional brokers rely on verified data — not assumptions or social media narratives.
              </p>
              
              <p className="text-zinc-700 mb-4">Market understanding should be built on:</p>
              <ul className="space-y-3 mb-6">
                {marketKnowledgeSources.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
              
              <p className="text-zinc-600 italic">
                Opinions must always be supported by data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 - Off-Plan & Ready Property Representation */}
      <section id="representation" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Responsible Property Representation
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Off-Plan */}
              <div className="bg-white rounded-2xl p-8 border border-zinc-200 hover:border-gold/50 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="text-xl font-semibold text-black">Off-Plan Representation</h3>
                </div>
                <ul className="space-y-3">
                  {offPlanRepresentation.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-700 text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ready */}
              <div className="bg-white rounded-2xl p-8 border border-zinc-200 hover:border-gold/50 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="text-xl font-semibold text-black">Ready Property Representation</h3>
                </div>
                <ul className="space-y-3">
                  {readyRepresentation.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-700 text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 - Communication & Client Education */}
      <section id="communication" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-zinc-200 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold text-black">
                  Educating, Not Convincing
                </h2>
              </div>
              
              <p className="text-lg text-zinc-700 leading-relaxed mb-6">
                A broker's communication style reflects their professionalism. Clear explanations, 
                balanced insights, and respectful dialogue build confidence.
              </p>
              
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5">
                <p className="text-zinc-700 font-medium text-center">
                  Clients should leave interactions feeling informed — not pressured.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7 - Long-Term Career Positioning */}
      <section id="career" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Building a Sustainable Brokerage Career
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {careerCards.map((card, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-2xl p-8 border border-zinc-200 hover:border-gold/50 hover:shadow-lg transition-all text-center"
                >
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                    <card.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="text-xl font-semibold text-black mb-3">{card.title}</h3>
                  <p className="text-zinc-600 leading-relaxed text-sm">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founder-Led Philosophy */}
      <FounderPhilosophySection />

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-zinc-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6">
              Elevate Your Professional Practice
            </h2>
            <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto">
              Access professional tools, training resources, and industry insights designed for 
              serious real estate professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="relative bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 px-8 py-4 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300">
                <Link to="/broker-toolkit">
                  <Briefcase className="w-5 h-5 mr-2 text-black" />
                  <span className="text-gold font-semibold">Join Broker Hub</span>
                </Link>
              </Button>
              <Button asChild className="relative bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 px-8 py-4 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300">
                <Link to="/broker-toolkit">
                  <FileText className="w-5 h-5 mr-2 text-black" />
                  <span className="text-gold font-semibold">View Broker Tools</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final Disclaimer */}
      <section className="py-12 bg-black border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <p className="text-zinc-500 text-sm text-center leading-relaxed">
                This content is educational in nature. It does not replace regulatory requirements or 
                professional licensing obligations. Brokers are responsible for ensuring compliance 
                with all applicable laws and regulations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Navigation - Active Champagne Layer */}
      <section className="jj-section-champagne py-12">
        <div className="container mx-auto px-4">
          <GuideNavigation 
            current="/broker-education"
            guides={[
              ...GUIDE_LINKS,
              { title: "Investor Education", path: "/investor-education", description: "Investment framework" },
              { title: "Investor FAQ", path: "/investor-faq", description: "Investment questions" },
              { title: "Broker Education", path: "/broker-education", description: "Professional training" },
            ]}
          />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BrokerEducation;
