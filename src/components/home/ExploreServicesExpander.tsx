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

// Premium Unsplash imagery — Dubai/real-estate context per service.
const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1600&q=80&auto=format&fit=crop`;

const services: Service[] = [
  { id: "buy",      title: "Buy Property",         description: "Discover premium properties in Dubai's most sought-after locations with expert guidance.", icon: Home,         href: "/properties?transaction=buy",         image: UNSPLASH("1518684079-3c830dcef090") },
  { id: "sell",     title: "Sell Your Property",   description: "Maximize your property's value with expert selling services and a global investor reach.",   icon: Tag,          href: "/listing-portal",                     image: UNSPLASH("1545324418-cc1a3fa10c00") },
  { id: "rent",     title: "Rent a Property",      description: "Find your perfect rental home in Dubai's most desirable neighbourhoods.",                    icon: Key,          href: "/properties?transaction=rent",        image: UNSPLASH("1502672260266-1c1ef2d93688") },
  { id: "list",     title: "List Your Property for Rent", description: "Connect with qualified tenants through our institutional network.",                  icon: Building2,    href: "/landlord-listing",                   image: UNSPLASH("1560448204-e02f11c3d0e2") },
  { id: "visa",     title: "Golden Visa Advisory", description: "10-year UAE residency through strategic real estate investment, structured end-to-end.",     icon: Globe,        href: "/guides/golden-visa-uae",             image: UNSPLASH("1512453979798-5ea266f8880c") },
  { id: "manage",   title: "Property Management",  description: "Professional maintenance and management for landlords across Dubai.",                        icon: Building2,    href: "/services/property-management",       image: UNSPLASH("1497366754035-f200968a6e72") },
  { id: "mortgage", title: "Mortgage Inquiries",   description: "Calculate payments and get matched with top mortgage providers in the UAE.",                 icon: Calculator,   href: "/mortgage-calculator",                image: UNSPLASH("1554224155-6726b3ff858f") },
  { id: "passport", title: "Passport & Schengen",  description: "Request an introduction via independent licensed partners.",                                  icon: Plane,        href: "/services/citizenship",               image: UNSPLASH("1530541930197-ff16ac917b0e") },
  { id: "compare",  title: "Compare Properties",   description: "AI-powered side-by-side analysis of multiple projects with ROI insights.",                    icon: Scale,        href: "/compare",                             image: UNSPLASH("1551288049-bebda4e38f71") },
  { id: "eval",     title: "Property Evaluation",  description: "AI-powered valuation for accurate, market-aligned price assessments.",                        icon: Calculator,   href: "/property-evaluator",                  image: UNSPLASH("1454165804606-c3d57bc86b40") },
  { id: "partner",  title: "Partner Introduction", description: "Connect with our trusted network of advisors, lawyers and tax specialists.",                 icon: Handshake,    href: "/partners",                           image: UNSPLASH("1521791136064-7986c2920216") },
  { id: "inquiry",  title: "General Inquiries",    description: "Speak to our concierge team for any real estate question — answered fast.",                  icon: MessageCircle,href: "/contact",                            image: UNSPLASH("1556761175-5973dc0f32e7") },
  { id: "facility", title: "Facility Management",  description: "Building-grade maintenance for owners — launching soon.",                                     icon: Wrench,       href: "/services/facility-management",       image: UNSPLASH("1581094794329-c8112a89af12"), available: false },
];

const ExploreServicesExpander = () => {
  const [activeId, setActiveId] = useState<string>(services[0].id);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Auto-rotate the active service every 4.5s for ambient motion.
  useEffect(() => {
    const i = setInterval(() => {
      setActiveId((cur) => {
        const idx = services.findIndex((s) => s.id === cur);
        return services[(idx + 1) % services.length].id;
      });
    }, 4500);
    return () => clearInterval(i);
  }, []);

  // Preload hero images so swaps are instant.
  useEffect(() => {
    services.forEach((s) => {
      const img = new Image();
      img.src = s.image;
    });
  }, []);

  // Keep active tab visible in the horizontal scroller — adjust ONLY the
  // tabs container's scrollLeft, never call scrollIntoView (which scrolls
  // the whole page vertically and creates a "page jumps back up" bug).
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
      <div className="relative h-[260px] md:h-[320px] overflow-hidden">
        <div
          key={active.id}
          className="absolute inset-0 bg-cover bg-center animate-fade-in"
          style={{ backgroundImage: `url(${active.image})` }}
        />
        {/* Stronger gradient floor for crisp legibility, image still readable on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <div className="relative h-full flex flex-col justify-end p-5 md:p-8 max-w-xl">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] font-bold text-white mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            <ActiveIcon className="w-3.5 h-3.5" />
            <span>JBJ Service</span>
          </div>
          <h3 className="text-white text-2xl md:text-3xl font-extrabold leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
            {active.title}
          </h3>
          <p className="mt-2 text-white text-sm md:text-base leading-relaxed max-w-md font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
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
