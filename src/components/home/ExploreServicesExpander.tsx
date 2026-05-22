/**
 * ExploreServicesExpander — premium tabbed services card.
 * Layout (matches founder photos exactly):
 *   ┌ Card ───────────────────────────────────────────┐
 *   │  Explore Our Services                            │
 *   │  Premium real estate solutions tailored…         │
 *   │  [ icon ] Buy   [ icon ] Rent   [ icon ] …       │  ← scrollable tabs
 *   │  ┌──────── hero image of active service ───────┐ │
 *   │  │  Title (white)                              │ │
 *   │  │  description (white/90)                     │ │
 *   │  │  [ Explore Now → ]                          │ │
 *   │  └─────────────────────────────────────────────┘ │
 *   └──────────────────────────────────────────────────┘
 * Always-visible, no accordion. Active tab swaps the hero panel.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Home, Tag, Key, Building2, Globe, Calculator, Plane,
  MessageCircle, Scale, Handshake, Wrench,
} from "lucide-react";

type Service = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  image: string;
  available?: boolean;
};

// Premium owned imagery — served from public/services/ for consistency across
// the homepage cards and this expander (single source of truth).
const services: Service[] = [
  { id: "buy",      title: "Buy Property",         description: "Discover premium properties in Dubai's most sought-after locations with expert guidance.", icon: Home,         href: "/properties?transaction=buy",         image: "/services/buy-property-bg.jpg" },
  { id: "sell",     title: "Sell Your Property",   description: "Maximize your property's value with expert selling services and a global investor reach.",   icon: Tag,          href: "/listing-portal",                     image: "/services/sell-property-bg.jpg" },
  { id: "rent",     title: "Rent a Property",      description: "Find your perfect rental home in Dubai's most desirable neighbourhoods.",                    icon: Key,          href: "/properties?transaction=rent",        image: "/services/rent-property-bg.jpg" },
  { id: "list",     title: "List Your Property for Rent", description: "Connect with qualified tenants through our institutional network.",                  icon: Building2,    href: "/landlord-listing",                   image: "/services/list-rental-bg.jpg" },
  { id: "visa",     title: "Golden Visa Advisory", description: "10-year UAE residency through strategic real estate investment, structured end-to-end.",     icon: Globe,        href: "/guides/golden-visa-uae",             image: "/services/golden-visa-bg.jpg" },
  { id: "manage",   title: "Property Management",  description: "Professional maintenance and management for landlords across Dubai.",                        icon: Building2,    href: "/services/property-management",       image: "/services/property-management-bg.jpg" },
  { id: "mortgage", title: "Mortgage Inquiries",   description: "Calculate payments and get matched with top mortgage providers in the UAE.",                 icon: Calculator,   href: "/mortgage-calculator",                image: "/services/mortgage-bg.jpg" },
  { id: "passport", title: "Passport & Schengen",  description: "Request an introduction via independent licensed partners.",                                  icon: Plane,        href: "/services/citizenship",               image: "/services/passport-visa-bg.jpg" },
  { id: "compare",  title: "Compare Properties",   description: "AI-powered side-by-side analysis of multiple projects with ROI insights.",                    icon: Scale,        href: "/compare",                             image: "/services/compare-properties-bg.jpg" },
  { id: "eval",     title: "Property Evaluation",  description: "AI-powered valuation for accurate, market-aligned price assessments.",                        icon: Calculator,   href: "/property-evaluator",                  image: "/services/property-evaluation-bg.jpg" },
  { id: "partner",  title: "Partner Introduction", description: "Connect with our trusted network of advisors, lawyers and tax specialists.",                 icon: Handshake,    href: "/partners",                           image: "/services/partner-introduction-bg.jpg" },
  { id: "inquiry",  title: "General Inquiries",    description: "Speak to our concierge team for any real estate question — answered fast.",                  icon: MessageCircle,href: "/contact",                            image: "/services/general-inquiries-bg.jpg" },
  { id: "facility", title: "Facility Management",  description: "Building-grade maintenance for owners — launching soon.",                                     icon: Wrench,       href: "/services/facility-management",       image: "/services/facility-management-bg.jpg", available: false },
];

const ExploreServicesExpander = () => {
  const [activeId, setActiveId] = useState<string>(services[0].id);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Preload hero images so swaps are instant.
  useEffect(() => {
    services.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  // Keep active tab visible in the horizontal scroller — adjust ONLY the
  // tabs container's scrollLeft. Never call scrollIntoView (which would
  // scroll the whole page and create a "page jumps back up" bug).
  // Guard against running on first paint to avoid any layout-driven scroll.
  useEffect(() => {
    const container = tabsRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-tab-id="${activeId}"]`);
    if (!el) return;
    const target = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeId]);

  const active = services.find((s) => s.id === activeId) ?? services[0];
  const ActiveIcon = active.icon;


  return (
    <div className="rounded-2xl border border-[#B89555]/40 bg-[#FDFBF7] overflow-hidden shadow-[0_8px_28px_rgba(184,149,85,0.10)]">
      {/* Header */}
      <div className="px-5 md:px-7 pt-5 md:pt-6 pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
          Explore Our Services
        </h2>
        <p className="mt-1 text-sm text-[#1A1A1A]/70">
          Premium real estate solutions tailored to your needs
        </p>
      </div>

      {/* Tabs row — horizontally scrollable, never wraps vertically */}
      <div
        ref={tabsRef}
        className="flex items-stretch gap-1 px-3 md:px-4 overflow-x-auto no-scrollbar border-b border-[#B89555]/25"
        role="tablist"
        aria-label="Services"
      >
        {services.map((s) => {
          const Icon = s.icon;
          const isActive = s.id === activeId;
          return (
            <button
              key={s.id}
              data-tab-id={s.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(s.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-3.5 md:px-4 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive
                  ? "text-[#1A1A1A] border-[#1A1A1A]"
                  : "text-[#1A1A1A]/65 border-transparent hover:text-[#1A1A1A]"
              } ${s.available === false ? "opacity-60" : ""}`}
            >
              <Icon className="w-4 h-4" />
              <span>{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Hero panel */}
      <div className="relative h-[280px] md:h-[340px] overflow-hidden">
        <div
          key={active.id}
          className="absolute inset-0 bg-cover bg-center animate-fade-in"
          style={{ backgroundImage: `url(${active.image})` }}
        />
        {/* Left-anchored gradient — keeps right side of image fully visible
            while guaranteeing text legibility on the left third. */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

        <div className="relative h-full flex flex-col justify-end p-5 md:p-8 max-w-xl">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] font-bold text-white mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            <ActiveIcon className="w-3.5 h-3.5" />
            <span>JBJ Service</span>
          </div>
          <h3
            className="text-white text-2xl md:text-3xl font-extrabold leading-tight"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textShadow: "0 2px 14px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)" }}
          >
            {active.title}
          </h3>
          <p
            className="mt-2 text-sm md:text-base leading-relaxed max-w-md font-medium"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.95)" }}
          >
            {active.description}
          </p>
          <div className="mt-4">
            {active.available === false ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-white border border-white/35 text-sm font-semibold backdrop-blur-sm">
                Coming soon
              </span>
            ) : (
              <Link
                to={active.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#1A1A1A] font-semibold text-sm hover:bg-[#F7F2EA] transition-colors shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
              >
                Explore Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ExploreServicesExpander;
