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
  TrendingUp,
  Target,
  Building,
  Banknote,
  BarChart3,
  Home,
  Clock,
  AlertTriangle,
  Database,
  HelpCircle,
  Phone
} from "lucide-react";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import Footer from "@/components/Footer";

const InvestorEducation = () => {
  const investmentObjectives = [
    {
      title: "Capital Growth",
      icon: TrendingUp,
      description: "Long-term value appreciation driven by location, infrastructure development, and market fundamentals."
    },
    {
      title: "Rental Yield",
      icon: Banknote,
      description: "Income-focused strategies based on tenant demand, rental index data, and asset stability."
    },
    {
      title: "Balanced Strategy",
      icon: BarChart3,
      description: "A measured approach combining income generation with future appreciation potential."
    },
    {
      title: "Lifestyle & End-Use Ownership",
      icon: Home,
      description: "Property acquired for personal use, residency planning, or future relocation considerations."
    }
  ];

  const marketCycleAnalysis = [
    "Historical transaction trends",
    "Price movement patterns",
    "Rental yield performance",
    "Supply pipelines",
    "Infrastructure and zoning developments"
  ];

  const dataSources = [
    {
      title: "Dubai Land Department (DLD)",
      description: "Transaction records"
    },
    {
      title: "RERA",
      description: "Rental index data"
    },
    {
      title: "Government Planning",
      description: "Infrastructure announcements"
    },
    {
      title: "Official Statistics",
      description: "Economic and population data"
    },
    {
      title: "Master Development Plans",
      description: "Published development roadmaps"
    }
  ];

  const offPlanPoints = [
    "Entry pricing advantages",
    "Staged payment structures",
    "Exposure to construction and delivery timelines",
    "Performance influenced by market conditions at handover"
  ];

  const readyPoints = [
    "Immediate usability or rental income",
    "Transparent valuation benchmarks",
    "Reduced development risk",
    "More predictable cash-flow behavior"
  ];

  const riskResponsibilities = [
    "Explain risks clearly and honestly",
    "Provide factual market context",
    "Discourage emotional or rushed decisions",
    "Ensure alignment between strategy and risk tolerance"
  ];

  const tocItems = [
    { id: 'philosophy', title: 'Our Philosophy', icon: Target },
    { id: 'objectives', title: 'Investment Objectives', icon: TrendingUp },
    { id: 'market-cycles', title: 'Market Cycles', icon: BarChart3 },
    { id: 'data-sources', title: 'Data & Sources', icon: Database },
    { id: 'off-plan-vs-ready', title: 'Off-Plan vs Ready', icon: Building },
    { id: 'risk', title: 'Risk & Transparency', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Investor Education | UAE Real Estate Investment Guide | JBJ GLOBAL REAL ESTATE"
        description="A refined educational framework designed for serious investors seeking clarity, structure, and data-driven insight into the UAE real estate market."
      />

      {/* Premium Hero */}
      <GuideHero
        badge="Investor Education"
        badgeIcon={Target}
        title={
          <>
            Investor Education for the{" "}
            <span className="text-gold">UAE Real Estate Market</span>
          </>
        }
        description="A refined educational framework designed for serious investors seeking clarity, structure, and data-driven insight into the UAE real estate market. This guide focuses on informed decision-making, market fundamentals, and long-term strategic thinking — not speculation."
        backgroundImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <Button 
              className="relative bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300"
              onClick={() => document.getElementById('philosophy')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ArrowDown className="w-4 h-4 mr-2 text-black" />
              <span className="text-gold font-semibold">Read the Full Guide</span>
            </Button>
            <Button asChild className="relative bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 px-6 py-3 shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300">
              <Link to="/investor-faq">
                <HelpCircle className="w-4 h-4 mr-2 text-black" />
                <span className="text-gold font-semibold">View Investor FAQs</span>
              </Link>
            </Button>
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
            label: "Speak With an Advisor",
            href: "/contact",
            icon: Phone
          }}
        />
      </div>

      {/* Section 1 - Our Investment Philosophy */}
      <section id="philosophy" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-zinc-200 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold text-black">
                  Our Approach to Real Estate Investment
                </h2>
              </div>
              
              <p className="text-lg text-zinc-700 leading-relaxed mb-6">
                At JBJ Global Real Estate, we approach property investment with discipline, responsibility, 
                and long-term perspective. Our role is not to sell outcomes — it is to help investors 
                understand context, assess risk, and align opportunities with clearly defined objectives.
              </p>
              
              <p className="text-zinc-600 leading-relaxed">
                We do not promote guaranteed returns. Real estate, like any asset class, is influenced by 
                market cycles, demand shifts, and external factors. Our responsibility is to provide 
                structured analysis, factual insight, and transparent guidance so investors can make 
                decisions with confidence and clarity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - Investment Objectives */}
      <section id="objectives" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Defining Your Investment Objective
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {investmentObjectives.map((objective, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-2xl p-8 border border-zinc-200 hover:border-gold/50 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                      <objective.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-xl font-semibold text-black">{objective.title}</h3>
                  </div>
                  <p className="text-zinc-600 leading-relaxed">{objective.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Market Cycles */}
      <section id="market-cycles" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-zinc-200 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold text-black">
                  Understanding Market Cycles
                </h2>
              </div>
              
              <p className="text-lg text-zinc-700 leading-relaxed mb-6">
                Property markets operate in cycles shaped by supply, demand, financing conditions, 
                population growth, and government policy. Recognizing where a market stands within 
                its cycle is essential to managing risk and setting realistic expectations.
              </p>
              
              <p className="text-zinc-700 mb-4">Our analysis considers:</p>
              <ul className="space-y-3 mb-6">
                {marketCycleAnalysis.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
              
              <p className="text-zinc-600 italic">
                This approach prioritizes timing awareness, not speculation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 - Data & Sources */}
      <section id="data-sources" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Data-Driven Decision Making
              </h2>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {dataSources.map((source, index) => (
                <div 
                  key={index}
                  className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-gold/50 transition-all text-center"
                >
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Database className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="text-black font-semibold text-sm mb-1">{source.title}</h4>
                  <p className="text-zinc-500 text-xs">{source.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <p className="text-zinc-700 text-center italic">
                All insights are grounded in verifiable data — not promotional narratives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 - Off-Plan vs Ready */}
      <section id="off-plan-vs-ready" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Comparing Off-Plan and Ready Properties
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Off-Plan */}
              <div className="bg-white rounded-2xl p-8 border border-zinc-200 hover:border-gold/50 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="text-xl font-semibold text-black">Off-Plan Properties</h3>
                </div>
                <ul className="space-y-3">
                  {offPlanPoints.map((point, index) => (
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
                  <h3 className="text-xl font-semibold text-black">Ready Properties</h3>
                </div>
                <ul className="space-y-3">
                  {readyPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-700 text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-white border border-zinc-200 rounded-xl p-6">
              <p className="text-zinc-700 text-center italic">
                Selection depends on strategy — not trend.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 - Risk & Transparency */}
      <section id="risk" className="py-16 md:py-24 bg-black scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-zinc-200 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold text-black">
                  Risk Awareness
                </h2>
              </div>
              
              <p className="text-lg text-zinc-700 leading-relaxed mb-6">
                Every investment carries risk. Market conditions change, rental demand fluctuates, 
                and values can rise or fall.
              </p>
              
              <p className="text-zinc-700 mb-4">Our responsibility is to:</p>
              <ul className="space-y-3 mb-6">
                {riskResponsibilities.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5">
                <p className="text-zinc-700 font-medium text-center">
                  Final decisions always remain with the investor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder-Led Philosophy */}
      <FounderPhilosophySection />

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-zinc-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-6">
              Build an Informed Investment Strategy
            </h2>
            <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto">
              Speak with our team to discuss your objectives, understand market dynamics, 
              and develop a strategy aligned with your goals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg"
                className="bg-gold hover:bg-gold/90 text-black font-medium px-8 h-14 text-base"
              >
                <Link to="/contact">
                  <Phone className="w-4 h-4 mr-2" />
                  Speak With an Advisor
                </Link>
              </Button>
              
              <Button 
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8 h-14 text-base"
              >
                <Link to="/investor-faq">
                  View Investor FAQs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="py-8 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-lg">
              <h4 className="text-black font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gold" />
                Important Disclaimer
              </h4>
              <p className="text-zinc-600 text-sm leading-relaxed">
                This guide is provided for general educational and informational purposes only. 
                It does not constitute legal, financial, or professional advice. JBJ Global Real Estate 
                is a licensed real estate brokerage and does not provide investment guarantees, 
                financial promises, or ROI assurances. Real estate values are subject to market 
                conditions and external factors. Investors should conduct independent due diligence 
                and consult with qualified professionals before making any investment decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Navigation */}
      <section className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-t border-zinc-200">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/investor-education" guides={GUIDE_LINKS} />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InvestorEducation;
