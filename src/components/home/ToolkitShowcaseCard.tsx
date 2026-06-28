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
  { id: "ai-home-finder",      name: "AI Home Finder",       description: "Answer a short quiz and let AI match you to a home.",   icon: Home,       href: "/ai-home-finder",                                  cta: "Find My Home",    image: "/services/buy-property-bg.jpg" },
  { id: "mortgage-calculator", name: "Mortgage Calculator",  description: "Calculate monthly payments and total cost instantly.",  icon: Calculator, href: "/mortgage-calculator",                   cta: "Calculate Now",   image: "/services/mortgage-bg.jpg" },
  { id: "rental-index",        name: "Rental Index",         description: "Live rental benchmarks for every major neighbourhood.", icon: TrendingUp, href: "/rental-index",                          cta: "Check Rates",     image: "/services/rent-property-bg.jpg" },
  { id: "list-property-sale",  name: "List for Sale",        description: "Submit your property to our institutional sales desk.", icon: PlusCircle, href: "/listing-portal?type=sale",              cta: "List for Sale",   image: "/services/sell-property-bg.jpg" },
  { id: "list-property-rent",  name: "List for Rent",        description: "Reach pre-qualified tenants through our network.",      icon: Key,        href: "/listing-portal?type=rent",              cta: "List for Rent",   image: "/services/list-rental-bg.jpg" },
  { id: "interior-design",     name: "AI Interior Design",   description: "Visualize your dream interior in seconds with AI.",     icon: Palette,    href: "/interior-design-ai",                    cta: "Design Space",    image: "/services/property-management-bg.jpg" },
  { id: "business-card",       name: "Business Card Maker",  description: "Design premium broker business cards on demand.",       icon: CreditCard, href: "/toolkit/corporate-suite/business-card", cta: "Design Card",     image: "/services/partner-introduction-bg.jpg" },
  { id: "logo-creator",        name: "AI Logo Maker",        description: "Generate a polished brand logo with AI assistance.",    icon: Wand2,      href: "/toolkit/corporate-suite/logo-creator",  cta: "Create Logo",     image: "/services/general-inquiries-bg.jpg" },
];

const GOLD_HOVER_IDS = new Set([
  "property-comparison",
  "ai-home-finder",
  "list-property-sale",
  "list-property-rent",
]);

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
    <section className="py-10 md:py-14">
      <div className="w-full">

        <div
          data-emerald-card
          className="animated-border animated-border-thick rounded-2xl border border-[#047857]/35 bg-[#FDFBF7] overflow-hidden shadow-[0_10px_36px_-18px_rgba(4,120,87,0.30)]"
        >
          {/* Header — emerald band, white text, NO gold */}
          <div
            data-ink-emerald
            data-no-contrast-guard
            className="px-5 md:px-7 pt-5 md:pt-6 pb-5 flex items-start justify-between gap-4 bg-[#064E3B]"
            style={{ backgroundImage: "var(--gradient-ink)" }}
          >
            <div className="min-w-0">
              <div
                data-no-contrast-guard
                className="allow-white inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/25 text-[10px] font-semibold uppercase tracking-[0.2em] mb-3"
                style={{ color: "#FFFFFF" }}
              >
                <Sparkles className="w-3 h-3 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                <span className="allow-white" style={{ color: "#FFFFFF" }}>Free Professional Tools</span>
              </div>
              <h2 data-no-contrast-guard className="text-xl md:text-2xl font-bold tracking-tight cursor-default allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                JBJ Royal Tools Hub
              </h2>
              <p className="mt-1 text-sm allow-white" style={{ color: "rgba(255,255,255,0.85)" }}>
                Powerful real estate tools — valuation, comparison, mortgage and AI utilities, all free.
              </p>
            </div>
            <Link
              to="/ai-hub"
              data-no-contrast-guard
              data-allow-dark-cta
              className="jj-cta-float allow-white shrink-0 self-center inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/40 text-white text-xs md:text-sm font-bold tracking-wide transition-all duration-200"
              style={{ color: "#FFFFFF" }}
            >
              <Crown className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.2} />
              <span className="allow-white hidden sm:inline" style={{ color: "#FFFFFF" }}>Explore JBJ Tools</span>
              <span className="allow-white sm:hidden" style={{ color: "#FFFFFF" }}>Explore</span>
              <ArrowRight className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.5} />
            </Link>
          </div>

          {/* No divider — emerald band flows directly into the segmented tabs.
              Taller premium strip, darker emerald active fill matching Explore Now. */}
          <div
            ref={tabsRef}
            data-ink-emerald
            data-on-dark
            data-no-contrast-guard
            className="allow-white flex items-stretch overflow-x-auto no-scrollbar"
            style={{ backgroundImage: "var(--gradient-ink)", backgroundColor: "#064E3B" }}
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
                  style={{
                    color: "#FFFFFF",
                    WebkitTextFillColor: "#FFFFFF",
                    ...(isActive
                      ? {
                          backgroundImage:
                            "linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)",
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(52,211,153,0.55), 0 0 22px rgba(52,211,153,0.18)",
                        }
                      : {}),
                  }}
                  data-no-contrast-guard
                  className={`allow-white shrink-0 inline-flex items-center gap-2 px-4 md:px-5 py-4 md:py-5 text-[13px] font-semibold whitespace-nowrap rounded-none transition-colors duration-200 ${
                    isActive ? "jj-tab-active-metallic" : "hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{t.name}</span>
                </button>
              );
            })}
          </div>





          {/* Active tool hero panel — image fills card; soft bottom fade
              only; frosted-glass CTA so the image shows through. */}
          <div key={active.id} data-photo-copy-lock className="relative h-[420px] md:h-[520px] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center animate-fade-in"
              style={{ backgroundImage: `url(${active.image})` }}
            />
            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

            <div className="relative h-full flex flex-col justify-end p-5 md:p-8 max-w-xl">
              <h3
                data-service-photo-copy
                className="allow-white text-white text-2xl md:text-3xl font-extrabold leading-tight"
                style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textShadow: "0 2px 14px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)" }}
              >
                {active.name}
              </h3>
              <p
                data-service-photo-copy
                className="allow-white mt-2 text-sm md:text-base leading-relaxed max-w-md font-medium"
                style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.95)" }}
              >
                {active.description}
              </p>
              <div className="mt-4">
                <Link
                  to={active.href}
                  data-ink-emerald
                  data-on-dark
                  data-no-contrast-guard
                  data-allow-dark-cta
                  className="allow-white inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold text-sm border border-white/40 transition-[background-color,box-shadow] shadow-[0_8px_24px_rgba(4,120,87,0.45)] hover:shadow-[0_10px_28px_rgba(4,120,87,0.55)]"
                  style={{ backgroundImage: "var(--gradient-ink)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
                >
                  <span className="allow-white" style={{ color: "#FFFFFF" }}>{active.cta}</span>
                  <ArrowRight className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                </Link>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
