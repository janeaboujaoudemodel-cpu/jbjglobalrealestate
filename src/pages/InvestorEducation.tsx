import { SEOHead } from "@/components/SEOHead";
import { GuideBookSection } from "@/components/books/GuideBookSection";
import { investorEducationBook } from "@/data/bookCollections";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
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
  Phone,
  Briefcase,
  Eye
} from "lucide-react";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { GuideHero } from "@/components/guides/GuideHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";
import { GuideCTA } from "@/components/guides/GuideCTA";


const InvestorEducation = () => {
  // Investment Basics - Three Primary Factors
  const investmentFactors = [
    "Market cycle timing",
    "Asset quality and location",
    "Investor objective"
  ];

  // Investment Objectives
  const investmentObjectives = [
    {
      title: "Capital Appreciation",
      icon: TrendingUp,
      description: "Long-term value growth driven by location, infrastructure development, and market fundamentals."
    },
    {
      title: "Rental Income",
      icon: Banknote,
      description: "Income-focused strategies based on tenant demand, rental index data, and asset stability."
    },
    {
      title: "Portfolio Diversification",
      icon: BarChart3,
      description: "Real estate as a stabilizing asset class within a broader investment portfolio."
    },
    {
      title: "Long-term Residency Planning",
      icon: Home,
      description: "Property acquired for personal use, visa benefits, or future relocation considerations."
    }
  ];

  // Off-Plan Benefits
  const offPlanBenefits = [
    "Structured payment plans aligned with construction progress",
    "Entry prices typically lower than ready properties",
    "Capital appreciation potential by handover"
  ];

  // Ready Property Benefits
  const readyBenefits = [
    "Immediate rental income",
    "Personal use",
    "Lower execution risk"
  ];

  // Market Analysis Factors
  const marketAnalysisFactors = [
    "Official government data",
    "Market transaction trends",
    "Supply and demand analysis",
    "Infrastructure and zoning plans"
  ];

  // JBJ Role
  const jbjRole = [
    "Market education and comparison",
    "Project and location analysis",
    "Developer due diligence",
    "Transaction coordination",
    "Post-purchase support through leasing or resale services"
  ];

  // TOC Items
  const tocItems = [
    { id: 'overview', title: 'Overview', icon: Target },
    { id: 'how-it-works', title: 'How Investment Works', icon: Briefcase },
    { id: 'types', title: 'Types of Investments', icon: Building },
    { id: 'objectives', title: 'Investment Objectives', icon: TrendingUp },
    { id: 'market-analysis', title: 'Market Analysis', icon: Database },
    { id: 'risk', title: 'Risk Awareness', icon: AlertTriangle },
    { id: 'jbj-role', title: 'Role of JBJ', icon: Shield },
    { id: 'long-term', title: 'Long-Term Perspective', icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Investor Education | Understanding Real Estate Investment in the UAE | JBJ"
        description="Learn how real estate investment works in the UAE. Data-driven education on market cycles, investment types, risk awareness, and informed decision-making."
      />

      {/* Table of Contents - Fixed Right Sidebar */}
      <GuideTableOfContents 
        items={tocItems}
        ctaAction={{
          label: "Speak With an Advisor",
          href: "/contact",
          icon: Phone
        }}
      />

      {/* Premium Hero */}
      <GuideHero
        badge="Investor Education"
        badgeIcon={Target}
        title={
          <>
            Understanding Real Estate Investment{" "}
            <span className="text-gold">in the UAE</span>
          </>
        }
        description="Real estate investment in the UAE operates within a regulated, transparent framework supported by government planning, long-term infrastructure development, and clear ownership laws. At JBJ Global Real Estate, investment education is a core responsibility — not a sales approach."
        backgroundImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=80"
        actions={
          <>
            <button 
              onClick={() => document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' })}
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
            <Link to="/investor-faq">
              <button 
                className="group relative inline-flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold rounded-lg md:rounded-xl transition-all duration-300 bg-transparent"
                style={{
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                <HelpCircle className="w-4 h-4 text-gold group-hover:text-black transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                <span className="text-white group-hover:text-black transition-colors">View Investor FAQs</span>
                <span className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
            </Link>
          </>
        }
      />

      {/* 3D Book Cover + Table of Contents */}
      <GuideBookSection book={investorEducationBook} />

      {/* Main Content with Right Padding for TOC */}
      <div className="lg:pr-80">
        {/* Overview Section - Layer 2 */}
        <section id="overview" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-5xl mx-auto">
              {/* Layer 3 Card */}
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <Target className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Overview</span>
                  </h2>
                </div>
                <p className="text-zinc-700 text-lg leading-relaxed mb-6">
                  Real estate investment in the UAE operates within a regulated, transparent framework supported by government planning, long-term infrastructure development, and clear ownership laws.
                </p>
                <p className="text-zinc-700 leading-relaxed">
                  At JBJ Global Real Estate, investment education is a core responsibility — not a sales approach. Our role is to help investors understand how the market works, how opportunities should be evaluated, and how informed decisions are made based on data, not promises.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How Investment Works - Layer 2 */}
        <section id="how-it-works" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-5xl mx-auto">
              {/* Layer 3 Card */}
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">How</span> Real Estate Investment Works
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  Real estate investment is based on three primary factors:
                </p>
                <div className="space-y-4 mb-6">
                  {investmentFactors.map((factor, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-white/60 rounded-xl border border-gold/20">
                      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold font-bold">{index + 1}</span>
                      </div>
                      <span className="text-zinc-700 font-medium">{factor}</span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-sm italic">
                  Every investment decision should begin with clarity around purpose: capital appreciation, rental income, portfolio diversification, or long-term asset holding.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Types of Investments - Layer 2 */}
        <section id="types" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <Building className="w-6 h-6 text-black" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                  <span className="text-gold">Types</span> of Real Estate Investments
                </h2>
              </div>

              <div className="space-y-8">
                {/* Off-Plan Properties - Layer 3 */}
                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-black" />
                    </div>
                    <h3 className="text-xl font-semibold text-black">Off-Plan Properties</h3>
                  </div>
                  <p className="text-zinc-700 mb-6">
                    Off-plan investments involve purchasing property directly from a developer before completion. These are commonly used for long-term strategies and offer:
                  </p>
                  <ul className="space-y-3 mb-6">
                    {offPlanBenefits.map((point, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="p-4 bg-white/60 border border-gold/20 rounded-xl">
                    <p className="text-zinc-700 text-sm">
                      <strong>Important:</strong> For off-plan purchases, buyers do not pay any agency fees. Licensed brokerages are compensated directly by developers. Our role is to analyze projects across the market, compare developers, locations, pricing, and timelines, and guide investors toward options aligned with their objectives — without cost to the buyer.
                    </p>
                  </div>
                </div>

                {/* Ready Properties - Layer 3 */}
                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-black" />
                    </div>
                    <h3 className="text-xl font-semibold text-black">Ready Properties</h3>
                  </div>
                  <p className="text-zinc-700 mb-6">
                    Ready properties are completed assets suitable for immediate use or rental. They are commonly chosen for:
                  </p>
                  <ul className="space-y-3 mb-6">
                    {readyBenefits.map((point, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="p-4 bg-white/60 border border-gold/20 rounded-xl">
                    <p className="text-zinc-700 text-sm">
                      For ready property purchases, standard agency fees apply in accordance with Dubai regulations. These fees are disclosed clearly before any transaction proceeds.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Investment Objectives - Layer 2 */}
        <section id="objectives" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-black" />
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                  <span className="text-gold">Investment</span> Objectives
                </h2>
                <p className="text-zinc-600 max-w-2xl mx-auto">
                  Every investor enters the market with a different objective. Understanding the objective is essential before selecting a location, property type, or developer.
                </p>
              </div>

              {/* Layer 3 Cards Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {investmentObjectives.map((objective, index) => (
                  <div 
                    key={index}
                    className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 hover:border-gold hover:shadow-lg hover:shadow-gold/10 transition-all"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl flex items-center justify-center flex-shrink-0">
                        <objective.icon className="w-6 h-6 text-black" />
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

        {/* Market Analysis - Layer 2 */}
        <section id="market-analysis" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-5xl mx-auto">
              {/* Layer 3 Card */}
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <Database className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Market Analysis</span> & Data-Based Evaluation
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  At JBJ Global Real Estate, investment guidance is based on:
                </p>
                <div className="space-y-3 mb-6">
                  {marketAnalysisFactors.map((factor, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700">{factor}</span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-sm italic">
                  We do not rely on speculative guarantees or promotional claims. All evaluations are grounded in verifiable market information and historical performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Risk Awareness - Layer 2 */}
        <section id="risk" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-4xl mx-auto">
              {/* Layer 3 Card */}
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Risk</span> Awareness
                  </h2>
                </div>
                <p className="text-zinc-700 text-lg leading-relaxed mb-6">
                  No real estate investment is risk-free. Market cycles, supply levels, construction timelines, and economic conditions all affect outcomes.
                </p>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                  <p className="text-amber-800 font-semibold text-center">
                    There is no such thing as guaranteed returns in real estate.
                  </p>
                </div>
                <p className="text-zinc-600">
                  Our responsibility is to explain potential risks clearly, highlight market realities, and support investors in making informed decisions — not to promise outcomes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Role of JBJ - Layer 2 */}
        <section id="jbj-role" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-4xl mx-auto">
              {/* Layer 3 Card */}
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Role of</span> JBJ Global Real Estate
                  </h2>
                </div>
                <p className="text-zinc-700 mb-6">
                  We act as advisors and market guides throughout the investment process:
                </p>
                <div className="space-y-3 mb-6">
                  {jbjRole.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-sm italic">
                  Investment decisions always remain with the client. Our role is to provide clarity, structure, and protection through experience and data.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Long-Term Perspective - Layer 2 */}
        <section id="long-term" className="py-20 scroll-mt-24">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-4xl mx-auto">
              {/* Layer 3 Card */}
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-black" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black">
                    <span className="text-gold">Long-Term</span> Perspective
                  </h2>
                </div>
                <p className="text-zinc-700 text-lg leading-relaxed mb-6">
                  Successful real estate investment is built on patience, understanding market cycles, and aligning decisions with realistic expectations. Education is the foundation of sustainable investment outcomes.
                </p>
                <p className="text-zinc-600">
                  This guide is designed to give investors the knowledge required to approach the UAE real estate market with confidence and clarity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Layer 2 */}
        <section className="py-16">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
            <div className="max-w-4xl mx-auto">
              <GuideCTA
                title="Ready to Discuss Your Investment Goals?"
                description="Speak with our team to discuss your objectives, understand market dynamics, and explore opportunities aligned with your strategy."
                icon={Target}
                primaryAction={{
                  label: "Contact an Advisor",
                  href: "/contact",
                  icon: Phone
                }}
              />
            </div>
          </div>
        </section>

        {/* Guide Navigation - Layer 2 */}
        <section className="py-12">
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12 mb-8">
            <div className="container mx-auto px-4">
              <GuideNavigation current="/investor-education" guides={GUIDE_LINKS} showStartHere />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InvestorEducation;