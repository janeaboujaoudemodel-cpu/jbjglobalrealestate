import { SEOHead } from "@/components/SEOHead";
import { GuideBookSection } from "@/components/books/GuideBookSection";
import { investorEducationBook } from "@/data/bookCollections";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ArrowRight,
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
  Eye,
} from "lucide-react";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";
import { ContentPageShell } from "@/components/content-page/ContentPageShell";

/* ---------------- Reusable premium primitives (light champagne surface) ---------------- */

function SectionCard({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 mb-10 md:mb-14">
      <div className="rounded-2xl border border-[#B89555]/35 bg-white/85 backdrop-blur-sm shadow-[0_10px_40px_-24px_rgba(6,78,59,0.25)] p-6 md:p-10">
        <div className="flex items-center gap-3 mb-5">
          <span
            data-surface="emerald"
            className="w-11 h-11 rounded-xl inline-flex items-center justify-center border border-white/15"
            style={{ background: "linear-gradient(135deg,#064E3B,#042c1c 55%,#010806)" }}
          >
            <Icon className="w-5 h-5 text-white" />
          </span>
          <h2
            className="text-2xl md:text-3xl font-semibold tracking-tight text-[#0d3a2b]"
            style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}
          >
            {title}
          </h2>
        </div>
        <div className="text-[#1A1A1A]/80 leading-relaxed space-y-4 text-[15px] md:text-base">
          {children}
        </div>
      </div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#064E3B] mt-0.5 flex-shrink-0" />
          <span className="text-[#1A1A1A]/80">{t}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((t, i) => (
        <li
          key={i}
          className="flex items-center gap-4 rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] px-4 py-3"
        >
          <span
            data-surface="emerald"
            className="w-8 h-8 rounded-full inline-flex items-center justify-center text-white text-sm font-semibold border border-white/15"
            style={{ background: "linear-gradient(135deg,#064E3B,#042c1c 55%,#010806)" }}
          >
            {i + 1}
          </span>
          <span className="text-[#1A1A1A]/85 font-medium">{t}</span>
        </li>
      ))}
    </ol>
  );
}

function Callout({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "warn";
  children: React.ReactNode;
}) {
  const styles =
    tone === "warn"
      ? "border-[#B89555]/40 bg-[#FBF3E3] text-[#5A3A00]"
      : "border-[#B89555]/25 bg-[#FDFBF7] text-[#1A1A1A]/80";
  return (
    <div className={`rounded-xl border ${styles} p-4 text-sm leading-relaxed`}>{children}</div>
  );
}

/* ---------------------------------- Page ---------------------------------- */

const InvestorEducation = () => {
  const investmentFactors = [
    "Market cycle timing",
    "Asset quality and location",
    "Investor objective",
  ];

  const investmentObjectives = [
    {
      title: "Capital Appreciation",
      icon: TrendingUp,
      description:
        "Long-term value growth driven by location, infrastructure development, and market fundamentals.",
    },
    {
      title: "Rental Income",
      icon: Banknote,
      description:
        "Income-focused strategies based on tenant demand, rental index data, and asset stability.",
    },
    {
      title: "Portfolio Diversification",
      icon: BarChart3,
      description:
        "Real estate as a stabilizing asset class within a broader investment portfolio.",
    },
    {
      title: "Long-term Residency Planning",
      icon: Home,
      description:
        "Property acquired for personal use, visa benefits, or future relocation considerations.",
    },
  ];

  const offPlanBenefits = [
    "Structured payment plans aligned with construction progress",
    "Entry prices typically lower than ready properties",
    "Capital appreciation potential by handover",
  ];

  const readyBenefits = ["Immediate rental income", "Personal use", "Lower execution risk"];

  const marketAnalysisFactors = [
    "Official government data",
    "Market transaction trends",
    "Supply and demand analysis",
    "Infrastructure and zoning plans",
  ];

  const jbjRole = [
    "Market education and comparison",
    "Project and location analysis",
    "Developer due diligence",
    "Transaction coordination",
    "Post-purchase support through leasing or resale services",
  ];

  const tocItems = [
    { id: "overview", title: "Overview", icon: Target },
    { id: "how-it-works", title: "How Investment Works", icon: Briefcase },
    { id: "types", title: "Types of Investments", icon: Building },
    { id: "objectives", title: "Investment Objectives", icon: TrendingUp },
    { id: "market-analysis", title: "Market Analysis", icon: Database },
    { id: "risk", title: "Risk Awareness", icon: AlertTriangle },
    { id: "jbj-role", title: "Role of JBJ", icon: Shield },
    { id: "long-term", title: "Long-Term Perspective", icon: Eye },
  ];

  return (
    <>
      <SEOHead
        title="Investor Education | Understanding Real Estate Investment in the UAE | JBJ"
        description="Learn how real estate investment works in the UAE. Data-driven education on market cycles, investment types, risk awareness, and informed decision-making."
      />

      <ContentPageShell
        hero={{
          eyebrow: "Investor Education",
          eyebrowIcon: Target,
          title: (
            <>
              Understanding Real Estate
              <br />
              Investment in the UAE
            </>
          ),
          subtitle:
            "A regulated, transparent framework — supported by government planning, long-term infrastructure and clear ownership laws. Education first, sales second.",
          height: "md",
        }}
        sections={tocItems}
        tocTitle="In This Guide"
      >
        {/* Book cover + chapter TOC */}
        <div className="-mx-4 sm:-mx-6 mb-12">
          <GuideBookSection book={investorEducationBook} />
        </div>

        <SectionCard id="overview" icon={Target} title="Overview">
          <p>
            Real estate investment in the UAE operates within a regulated, transparent framework
            supported by government planning, long-term infrastructure development, and clear
            ownership laws.
          </p>
          <p>
            At JBJ Global Real Estate, investment education is a core responsibility — not a
            sales approach. Our role is to help investors understand how the market works, how
            opportunities should be evaluated, and how informed decisions are made based on
            data, not promises.
          </p>
        </SectionCard>

        <SectionCard id="how-it-works" icon={Briefcase} title="How Real Estate Investment Works">
          <p>Real estate investment is based on three primary factors:</p>
          <NumberedList items={investmentFactors} />
          <p className="italic text-[#1A1A1A]/70">
            Every investment decision should begin with clarity around purpose: capital
            appreciation, rental income, portfolio diversification, or long-term asset holding.
          </p>
        </SectionCard>

        <SectionCard id="types" icon={Building} title="Types of Real Estate Investments">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-[#064E3B]" />
                <h3 className="font-semibold text-[#0d3a2b]">Off-Plan Properties</h3>
              </div>
              <p className="text-sm text-[#1A1A1A]/75 mb-3">
                Purchased directly from a developer before completion. Commonly used for
                long-term strategies.
              </p>
              <BulletList items={offPlanBenefits} />
            </div>
            <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building className="w-5 h-5 text-[#064E3B]" />
                <h3 className="font-semibold text-[#0d3a2b]">Ready Properties</h3>
              </div>
              <p className="text-sm text-[#1A1A1A]/75 mb-3">
                Completed assets suitable for immediate use or rental.
              </p>
              <BulletList items={readyBenefits} />
            </div>
          </div>
          <Callout>
            <strong>Important:</strong> For off-plan purchases, buyers do not pay agency fees —
            licensed brokerages are compensated directly by developers. For ready properties,
            standard Dubai agency fees apply and are disclosed clearly before any transaction.
          </Callout>
        </SectionCard>

        <SectionCard id="objectives" icon={TrendingUp} title="Investment Objectives">
          <p>
            Every investor enters the market with a different objective. Understanding the
            objective is essential before selecting a location, property type, or developer.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {investmentObjectives.map((o) => (
              <div
                key={o.title}
                className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-5 hover:border-[#064E3B]/60 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span
                    data-surface="emerald"
                    className="w-9 h-9 rounded-lg inline-flex items-center justify-center border border-white/15"
                    style={{
                      background: "linear-gradient(135deg,#064E3B,#042c1c 55%,#010806)",
                    }}
                  >
                    <o.icon className="w-4 h-4 text-white" />
                  </span>
                  <h3 className="font-semibold text-[#0d3a2b]">{o.title}</h3>
                </div>
                <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">{o.description}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          id="market-analysis"
          icon={Database}
          title="Market Analysis & Data-Based Evaluation"
        >
          <p>At JBJ Global Real Estate, investment guidance is based on:</p>
          <BulletList items={marketAnalysisFactors} />
          <p className="italic text-[#1A1A1A]/70">
            We do not rely on speculative guarantees or promotional claims. All evaluations are
            grounded in verifiable market information and historical performance.
          </p>
        </SectionCard>

        <SectionCard id="risk" icon={AlertTriangle} title="Risk Awareness">
          <p>
            No real estate investment is risk-free. Market cycles, supply levels, construction
            timelines, and economic conditions all affect outcomes.
          </p>
          <Callout tone="warn">
            <strong>There is no such thing as guaranteed returns in real estate.</strong>
          </Callout>
          <p>
            Our responsibility is to explain potential risks clearly, highlight market
            realities, and support investors in making informed decisions — not to promise
            outcomes.
          </p>
        </SectionCard>

        <SectionCard id="jbj-role" icon={Shield} title="Role of JBJ Global Real Estate">
          <p>We act as advisors and market guides throughout the investment process:</p>
          <BulletList items={jbjRole} />
          <p className="italic text-[#1A1A1A]/70">
            Investment decisions always remain with the client. Our role is to provide clarity,
            structure, and protection through experience and data.
          </p>
        </SectionCard>

        <SectionCard id="long-term" icon={Eye} title="Long-Term Perspective">
          <p>
            Successful real estate investment is built on patience, understanding market
            cycles, and aligning decisions with realistic expectations. Education is the
            foundation of sustainable investment outcomes.
          </p>
          <p>
            This guide is designed to give investors the knowledge required to approach the UAE
            real estate market with confidence and clarity.
          </p>
        </SectionCard>

        {/* CTA */}
        <section className="mt-14 mb-10">
          <div
            data-surface="emerald"
            className="relative overflow-hidden rounded-2xl p-8 md:p-12 text-center border border-white/10"
            style={{
              background:
                "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#010806 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background:
                  "radial-gradient(60% 80% at 80% 20%,rgba(184,149,85,0.32),transparent),radial-gradient(50% 60% at 15% 85%,rgba(184,149,85,0.22),transparent)",
              }}
            />
            <div className="relative">
              <h3
                className="text-3xl md:text-4xl font-light text-white mb-3"
                style={{ fontFamily: '"Cormorant Garamond","Playfair Display",Georgia,serif' }}
              >
                Ready to Discuss Your Investment Goals?
              </h3>
              <p className="text-[#E8CF8A] max-w-2xl mx-auto mb-7">
                Speak with our team to discuss your objectives, understand market dynamics, and
                explore opportunities aligned with your strategy.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/contact"
                  data-cta="advisor"
                  className="jj-cta-emerald inline-flex items-center gap-2 h-12 px-7 rounded-full text-sm font-semibold text-white border border-[#B89555]/40"
                >
                  <Phone className="w-4 h-4" />
                  Contact an Advisor
                </Link>
                <Link
                  to="/investor-faq"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-full text-sm font-semibold text-white border border-white/25 hover:bg-white/5 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  Investor FAQs
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-12">
          <GuideNavigation current="/guides/invest" guides={GUIDE_LINKS} showStartHere />
        </div>
      </ContentPageShell>
    </>
  );
};

export default InvestorEducation;
