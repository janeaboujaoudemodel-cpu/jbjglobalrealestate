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
          <div className="bg-[#EFE6D6] p-6 md:p-8 border-b border-[#B89555]/30">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] text-xs font-semibold uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3 text-[#B89555]" />
                Free Professional Tools
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-2">
              JBJ Royal Tools Hub
            </h2>

            <p className="text-sm text-[#1A1A1A]/75 md:text-base max-w-2xl">
              Powerful real estate tools for property valuation, comparison, mortgage calculation, and AI-powered enhancements — all completely free to use.
            </p>
          </div>

          {/* Tools Grid */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tools.map((tool, index) => {
                const tone = TONE_STYLES[tool.tone];
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Link to={tool.href} className="group block h-full">
                      <div className={`h-full flex flex-col bg-[#F7F2EA] rounded-xl border border-[#B89555]/30 ring-2 ring-transparent ${tone.ring} p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
                        {/* Icon — per-tool tone */}
                        <div className={`w-12 h-12 rounded-xl ${tone.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`w-6 h-6 ${tone.icon}`} />
                        </div>

                        {/* Title */}
                        <h4 className="text-base font-bold text-[#1A1A1A] mb-2 transition-colors">
                          {tool.name}
                        </h4>

                        {/* Description */}
                        <p className="text-sm text-[#1A1A1A]/75 mb-4 leading-relaxed flex-grow">
                          {tool.description}
                        </p>

                        {/* CTA */}
                        <Button size="sm" className="mt-auto w-full justify-center bg-[#1A1A1A] hover:bg-[#2a2a2a] text-white font-semibold border-0 text-[10px] sm:text-sm px-1.5 sm:px-3 whitespace-nowrap overflow-hidden">
                          <span className="truncate">{tool.cta}</span>
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" />
                        </Button>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Explore All Tools CTA */}
            <div className="mt-8 text-center">
              <Link to="/ai-hub">
                <Button
                  size="lg"
                  className="gap-3 px-10 py-6 text-base font-bold bg-[#1A1A1A] hover:bg-[#2a2a2a] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Crown className="w-5 h-5 text-[#B89555]" />
                  Explore All Our Tools Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
