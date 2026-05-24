import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calculator, Layers, Home, TrendingUp, Palette,
  CreditCard, Wand2, ArrowRight, Crown, Sparkles,
  PlusCircle, Key,
} from "lucide-react";
import { PearlButton } from "@/components/ui/pearl-button";
import { useToolVisibility } from "@/hooks/useToolVisibility";
import { isApprovedPublicToolId } from "@/config/publicToolAccess";

interface RoyalTool {
  id: string;
  name: string;
  description: string;
  icon: typeof Calculator;
  href: string;
  cta: string;
  image: string;
}

// Background imagery reuses the existing /services/ premium owned assets so the
// hub feels consistent with Explore Our Services.
const royalTools: RoyalTool[] = [
  { id: "property-evaluator",  name: "Property Evaluator",   description: "AI-powered property valuation across Dubai's market.",   icon: Calculator, href: "/property-evaluator",                    cta: "Get Evaluation",  image: "/services/property-evaluation-bg.jpg" },
  { id: "property-comparison", name: "Property Comparison",  description: "Compare projects side-by-side with ROI and yield insights.", icon: Layers,  href: "/compare",                               cta: "Start Comparing", image: "/services/compare-properties-bg.jpg" },
  { id: "ai-home-finder",      name: "AI Home Finder",       description: "Answer a short quiz and let AI match you to a home.",   icon: Home,       href: "/quiz",                                  cta: "Find My Home",    image: "/services/buy-property-bg.jpg" },
  { id: "mortgage-calculator", name: "Mortgage Calculator",  description: "Calculate monthly payments and total cost instantly.",  icon: Calculator, href: "/mortgage-calculator",                   cta: "Calculate Now",   image: "/services/mortgage-bg.jpg" },
  { id: "rental-index",        name: "Rental Index",         description: "Live rental benchmarks for every major neighbourhood.", icon: TrendingUp, href: "/rental-index",                          cta: "Check Rates",     image: "/services/rent-property-bg.jpg" },
  { id: "list-property-sale",  name: "List for Sale",        description: "Submit your property to our institutional sales desk.", icon: PlusCircle, href: "/listing-portal?type=sale",              cta: "List for Sale",   image: "/services/sell-property-bg.jpg" },
  { id: "list-property-rent",  name: "List for Rent",        description: "Reach pre-qualified tenants through our network.",      icon: Key,        href: "/listing-portal?type=rent",              cta: "List for Rent",   image: "/services/list-rental-bg.jpg" },
  { id: "interior-design",     name: "AI Interior Design",   description: "Visualize your dream interior in seconds with AI.",     icon: Palette,    href: "/interior-design-ai",                    cta: "Design Space",    image: "/services/property-management-bg.jpg" },
  { id: "business-card",       name: "Business Card Maker",  description: "Design premium broker business cards on demand.",       icon: CreditCard, href: "/toolkit/corporate-suite/business-card", cta: "Design Card",     image: "/services/partner-introduction-bg.jpg" },
  { id: "logo-creator",        name: "AI Logo Maker",        description: "Generate a polished brand logo with AI assistance.",    icon: Wand2,      href: "/toolkit/corporate-suite/logo-creator",  cta: "Create Logo",     image: "/services/general-inquiries-bg.jpg" },
];

export function ToolkitShowcaseCard() {
  const visibility = useToolVisibility();
  const tools = royalTools.filter(t => isApprovedPublicToolId(t.id) && visibility.isPublic(t.id));

  const [activeId, setActiveId] = useState<string>(tools[0]?.id ?? royalTools[0].id);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Preload background images so swaps are instant.
  useEffect(() => {
    tools.forEach((t) => {
      const img = new Image();
      img.src = t.image;
    });
  }, [tools]);

  // Keep active tab visible in the horizontal scroller — only adjust the
  // tabs container scrollLeft (never scrollIntoView, which would jump the page).
  useEffect(() => {
    const container = tabsRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-tab-id="${activeId}"]`);
    if (!el) return;
    const target = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeId]);

  if (tools.length === 0) return null;

  const active = tools.find((t) => t.id === activeId) ?? tools[0];

  return (
    <section className="bg-[#FDFBF7] py-10 md:py-14">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="rounded-2xl border border-[#B89555]/40 bg-[#FDFBF7] overflow-hidden shadow-[0_8px_28px_rgba(184,149,85,0.10)]">
          {/* Header */}
          <div className="px-5 md:px-7 pt-5 md:pt-6 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F7F2EA] border border-[#B89555]/40 text-[#1A1A1A] text-[10px] font-semibold uppercase tracking-[0.2em] mb-3">
              <Sparkles className="w-3 h-3 text-[#B89555]" />
              Free Professional Tools
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
              JBJ Royal Tools Hub
            </h2>
            <p className="mt-1 text-sm text-[#1A1A1A]/70">
              Powerful real estate tools — valuation, comparison, mortgage and AI utilities, all free.
            </p>
          </div>

          {/* Tabs row — horizontally scrollable, mirrors ExploreServicesExpander */}
          <div
            ref={tabsRef}
            className="flex items-stretch gap-1.5 px-3 md:px-4 py-2 overflow-x-auto no-scrollbar"
            role="tablist"
            aria-label="Royal tools"
          >
            {tools.map((t) => {
              const Icon = t.icon;
              const isActive = t.id === activeId;
              return (
                <button
                  key={t.id}
                  data-tab-id={t.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveId(t.id)}
                  className={`shrink-0 inline-flex items-center gap-2 px-3.5 md:px-4 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-[#EFE6D6] text-[#1A1A1A] ring-1 ring-[#B89555]/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                      : "text-[#1A1A1A]/80 hover:bg-[#F7F2EA] hover:text-[#1A1A1A]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>


          {/* Active tool hero panel — keyed on active.id so it remounts cleanly */}
          <div key={active.id} className="relative h-[280px] md:h-[340px] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center animate-fade-in"
              style={{ backgroundImage: `url(${active.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

            <div className="relative h-full flex flex-col justify-end p-5 md:p-8 max-w-xl">
              <h3
                className="text-white text-2xl md:text-3xl font-extrabold leading-tight"
                style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textShadow: "0 2px 14px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)" }}
              >
                {active.name}
              </h3>
              <p
                className="mt-2 text-sm md:text-base leading-relaxed max-w-md font-medium"
                style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.95)" }}
              >
                {active.description}
              </p>
              <div className="mt-4">
                <Link
                  to={active.href}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#1A1A1A] font-semibold text-sm hover:bg-[#F7F2EA] transition-colors shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                >
                  {active.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Footer — Explore JBJ Tools secondary CTA */}
          <div className="px-5 md:px-7 py-6 text-center bg-[#FDFBF7]">
            <PearlButton
              to="/ai-hub"
              size="lg"
              leadingIcon={<Crown strokeWidth={2.2} />}
              trailingIcon={<ArrowRight strokeWidth={2.5} />}
            >
              Explore JBJ Tools
            </PearlButton>
          </div>
        </div>
      </div>
    </section>
  );
}
