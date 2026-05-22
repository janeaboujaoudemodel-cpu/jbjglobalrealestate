import { Link } from "react-router-dom";
import {
  Calculator, Layers, Home, TrendingUp, Palette,
  CreditCard, Wand2, ArrowRight, Sparkles, Crown,
  PlusCircle, Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToolVisibility } from "@/hooks/useToolVisibility";
import { isApprovedPublicToolId } from "@/config/publicToolAccess";

type ToolTone = "blue" | "emerald" | "gold" | "purple" | "darkGreen" | "pink" | "ink" | "amber";

const TONE_STYLES: Record<ToolTone, { bg: string; icon: string; ring: string }> = {
  blue:      { bg: "bg-blue-500/15",       icon: "text-blue-700",      ring: "group-hover:ring-blue-500/40" },
  emerald:   { bg: "bg-emerald-500/15",    icon: "text-emerald-700",   ring: "group-hover:ring-emerald-500/40" },
  gold:      { bg: "bg-[#B89555]/20",      icon: "text-[#8A6F2E]",     ring: "group-hover:ring-[#B89555]/50" },
  purple:    { bg: "bg-purple-500/15",     icon: "text-purple-700",    ring: "group-hover:ring-purple-500/40" },
  darkGreen: { bg: "bg-green-800/15",      icon: "text-green-800",     ring: "group-hover:ring-green-700/40" },
  pink:      { bg: "bg-pink-400/15",       icon: "text-pink-600",      ring: "group-hover:ring-pink-400/40" },
  ink:       { bg: "bg-[#1A1A1A]/10",      icon: "text-[#1A1A1A]",     ring: "group-hover:ring-[#1A1A1A]/30" },
  amber:     { bg: "bg-amber-500/20",      icon: "text-amber-700",     ring: "group-hover:ring-amber-500/50" },
};

interface RoyalTool {
  id: string;
  name: string;
  description: string;
  icon: typeof Calculator;
  href: string;
  cta: string;
  tone: ToolTone;
}

const royalTools: RoyalTool[] = [
  { id: "property-evaluator",  name: "Property Evaluator",   description: "AI-powered property valuation",     icon: Calculator, href: "/property-evaluator",                       cta: "Get Evaluation",  tone: "blue"      },
  { id: "property-comparison", name: "Property Comparison",  description: "Compare properties side-by-side",  icon: Layers,     href: "/compare",                                  cta: "Start Comparing", tone: "emerald"   },
  { id: "ai-home-finder",      name: "AI Home Finder",       description: "Find your perfect home with AI",   icon: Home,       href: "/quiz",                                     cta: "Find My Home",    tone: "purple"    },
  { id: "mortgage-calculator", name: "Mortgage Calculator",  description: "Calculate your monthly payments",  icon: Calculator, href: "/mortgage-calculator",                      cta: "Calculate Now",   tone: "gold"      },
  { id: "rental-index",        name: "Rental Index",         description: "Check current rental rates",       icon: TrendingUp, href: "/rental-index",                             cta: "Check Rates",     tone: "darkGreen" },
  { id: "list-property-sale",  name: "List for Sale",        description: "Submit a property for sale",       icon: PlusCircle, href: "/listing-portal?type=sale",                 cta: "List for Sale",   tone: "amber"     },
  { id: "list-property-rent",  name: "List for Rent",        description: "Submit a property for rent",       icon: Key,        href: "/listing-portal?type=rent",                 cta: "List for Rent",   tone: "ink"       },
  { id: "interior-design",     name: "AI Interior Design",   description: "Visualize your dream space",       icon: Palette,    href: "/interior-design-ai",                       cta: "Design Space",    tone: "pink"      },
  { id: "business-card",       name: "Business Card Maker",  description: "Design premium business cards",    icon: CreditCard, href: "/toolkit/corporate-suite/business-card",    cta: "Design Card",     tone: "ink"       },
  { id: "logo-creator",        name: "AI Logo Maker",        description: "Generate company logos with AI",   icon: Wand2,      href: "/toolkit/corporate-suite/logo-creator",     cta: "Create Logo",     tone: "amber"     },
];

export function ToolkitShowcaseCard() {
  const visibility = useToolVisibility();
  const tools = royalTools.filter(t => isApprovedPublicToolId(t.id) && visibility.isPublic(t.id));

  return (
    <section className="bg-[#FDFBF7] py-10 md:py-14">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="rounded-2xl overflow-hidden border border-[#B89555]/30 bg-[#F7F2EA]">
          {/* Header - Premium Banner */}
          <div className="bg-[#EFE6D6] px-6 md:px-8 pt-8 md:pt-10 pb-8 md:pb-10 border-b border-[#B89555]/30">
            <div className="flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] text-xs font-semibold uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3 text-[#B89555]" />
                Free Professional Tools
              </div>

              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A1A1A] tracking-tight">
                JBJ Royal Tools Hub
              </h2>

              <p className="text-sm md:text-base text-[#1A1A1A]/75 leading-relaxed">
                Powerful real estate tools for property valuation, comparison, mortgage calculation, and AI-powered enhancements — all completely free to use.
              </p>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tools.slice(0, 8).map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Link to={tool.href} className="group block h-full">
                      <div className="h-full flex flex-col bg-[#F7F2EA] rounded-xl border border-[#B89555]/30 hover:border-[#B89555]/70 p-5 transition-all duration-300 hover:shadow-[0_12px_36px_-12px_rgba(184,149,85,0.35)] hover:-translate-y-1">
                        {/* Icon — unified champagne/gold */}
                        <div className="w-12 h-12 rounded-xl bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Icon className="w-6 h-6 text-[#B89555]" strokeWidth={2.25} />
                        </div>

                        {/* Title */}
                        <h4 className="text-base font-bold text-[#1A1A1A] mb-2 transition-colors">
                          {tool.name}
                        </h4>

                        {/* Description */}
                        <p className="text-sm text-[#1A1A1A]/75 mb-4 leading-relaxed flex-grow">
                          {tool.description}
                        </p>

                        {/* CTA — premium champagne */}
                        <Button
                          size="sm"
                          className="mt-auto w-full justify-center bg-[#FDFBF7] hover:bg-[#EFE6D6] text-[#1A1A1A] font-bold border border-[#B89555]/60 hover:border-[#B89555] text-[10px] sm:text-sm px-1.5 sm:px-3 whitespace-nowrap overflow-hidden shadow-none hover:shadow-[0_6px_20px_-8px_rgba(184,149,85,0.45)] transition-all"
                        >
                          <span className="truncate">{tool.cta}</span>
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0 text-[#B89555]" strokeWidth={2.5} />
                        </Button>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Explore All Tools CTA — premium champagne */}
            <div className="mt-8 text-center">
              <Link to="/ai-hub">
                <Button
                  size="lg"
                  className="gap-3 px-10 py-6 text-base font-bold bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] hover:from-[#F7F2EA] hover:to-[#EFE6D6] !text-[#1A1A1A] [&]:text-[#1A1A1A] rounded-xl border border-[#B89555]/70 hover:border-[#B89555] shadow-[0_10px_32px_-12px_rgba(184,149,85,0.4)] hover:shadow-[0_14px_44px_-10px_rgba(184,149,85,0.55)] hover:scale-[1.02] transition-all duration-300"
                >
                  <Crown className="w-5 h-5 text-[#B89555]" />
                  <span className="text-[#1A1A1A]">Explore All Our Tools Now</span>
                  <ArrowRight className="w-5 h-5 text-[#B89555]" strokeWidth={2.5} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
