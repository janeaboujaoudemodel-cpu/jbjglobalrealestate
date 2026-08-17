import { Link } from "react-router-dom";
import { Layers, Calculator, Sparkles, ArrowRight } from "lucide-react";
import { PremiumSectionCard } from "@/components/ui/premium-section-card";

const tools = [
  {
    icon: Layers,
    title: "AI Comparison & Analyzer",
    desc: "Compare projects side-by-side with ROI, yield and payment-plan analysis.",
    href: "/compare",
    cta: "Start comparing",
  },
  {
    icon: Calculator,
    title: "Mortgage Calculator",
    desc: "Estimate monthly payments, total cost and eligibility in seconds.",
    href: "/mortgage-calculator",
    cta: "Open calculator",
  },
  {
    icon: Sparkles,
    title: "Full AI Toolkit",
    desc: "Evaluator, AI Home Finder, rental index, interior design and more.",
    href: "/toolkit",
    cta: "Explore the toolkit",
  },
];

/**
 * Merged "AI Tools" section — three entry cards replacing the previously
 * embedded AIComparisonWidget, MortgageCalculator and ToolkitShowcaseCard
 * blocks on the homepage. Each card links to the full tool.
 */
export default function AiToolsSection() {
  return (
    <PremiumSectionCard padding="none" width="contained" wrapperClassName="cv-auto py-8">
      <section aria-labelledby="home-ai-tools-title" className="w-full">
        <header className="text-center mb-8">
          <h2 id="home-ai-tools-title" className="font-cormorant text-3xl sm:text-4xl font-semibold">
            AI Tools
          </h2>
          <p className="text-sm mt-2 opacity-80">
            Institutional-grade analysis, available to every client.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {tools.map(({ icon: Icon, title, desc, href, cta }) => (
            <Link aria-label="Next"
              key={title}
              to={href}
              className="jj-pearl-card group flex h-full flex-col rounded-2xl border border-[#B89555]/30 p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-18px_rgba(6,78,59,0.35)]"
            >
              <span className="jj-icon-tile-emerald mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <h3 className="font-cormorant text-xl font-semibold mb-2">{title}</h3>
              <p className="text-sm leading-snug opacity-80 mb-4">{desc}</p>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold">
                {cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PremiumSectionCard>
  );
}
