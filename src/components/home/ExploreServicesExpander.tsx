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
  MessageCircle, Scale, Handshake, Wrench, Sparkles, Crown,
} from "lucide-react";
import { PearlButton } from "@/components/ui/pearl-button";

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
  // AI-powered tools (Compare, Property Evaluation, AI Home Finder) live in the JBJ Royal Tools Hub, not in core services.
  { id: "partner",  title: "Partner Introduction", description: "Connect with our trusted network of advisors, lawyers and tax specialists.",                 icon: Handshake,    href: "/partners",                           image: "/services/partner-introduction-bg.jpg" },
  { id: "inquiry",  title: "General Inquiries",    description: "Speak to our concierge team for any real estate question — answered fast.",                  icon: MessageCircle,href: "/contact",                            image: "/services/general-inquiries-bg.jpg" },
  { id: "facility", title: "Facility Management",  description: "Building-grade maintenance for owners — launching soon.",                                     icon: Wrench,       href: "/services/facility-management",       image: "/services/facility-management-bg.jpg", available: false },
];

const GOLD_HOVER_IDS = new Set(["sell", "rent"]);

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


  return (
      <div
        data-emerald-card
        data-ink-emerald-opt-out
        className="rounded-2xl border border-[#047857]/35 bg-[#FDFBF7] overflow-hidden shadow-[0_10px_36px_-18px_rgba(4,120,87,0.30)]"
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
            <span className="allow-white" style={{ color: "#FFFFFF" }}>Premium Real Estate Services</span>
          </div>
          <h2 data-no-contrast-guard className="text-xl md:text-2xl font-bold tracking-tight cursor-default allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
            Explore Our Services
          </h2>
          <p className="mt-1 text-sm allow-white" style={{ color: "rgba(255,255,255,0.85)" }}>
            Premium real estate solutions tailored to your needs
          </p>
        </div>
        <Link
          to="/services"
          data-no-contrast-guard
          data-allow-dark-cta
          className="jj-cta-float allow-white shrink-0 self-center inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/40 text-white text-xs md:text-sm font-bold tracking-wide transition-all duration-200"
          style={{ color: "#FFFFFF" }}
        >
          <Crown className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.2} />
          <span className="allow-white hidden sm:inline" style={{ color: "#FFFFFF" }}>Explore Our Services</span>
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
              } ${s.available === false ? "opacity-80" : ""}`}
            >
              <Icon className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{s.title}</span>
            </button>
          );
        })}
      </div>





      {/* Hero panel — image fills full card; only a soft bottom gradient
          keeps the text/CTA legible. Button uses frosted-glass white so the
          image shows through behind it. */}
      <div key={active.id} data-photo-copy-lock className="relative h-[420px] md:h-[520px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center animate-fade-in"
          style={{ backgroundImage: `url(${active.image})` }}
        />
        {/* Soft bottom fade only — no heavy left wall, image stays crisp */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

        <div className="relative h-full flex flex-col justify-end p-5 md:p-8 max-w-xl">
          <h3
            data-service-photo-copy
            className="jj-force-white-copy allow-white text-white text-2xl md:text-3xl font-extrabold leading-tight"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textShadow: "0 2px 14px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)" }}
          >
            {active.title}
          </h3>
          <p
            data-service-photo-copy
            className="jj-force-white-copy allow-white mt-2 text-sm md:text-base leading-relaxed max-w-md font-medium"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.95)" }}
          >
            {active.description}
          </p>
          <div className="mt-4">
            {active.available === false ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white border border-white/40 text-sm font-semibold backdrop-blur-md">
                Coming soon
              </span>
            ) : (
              <Link
                to={active.href}
                data-ink-emerald
                data-on-dark
                data-no-contrast-guard
                data-allow-dark-cta
                className="allow-white inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-semibold text-sm border border-white/40 transition-[background-color,box-shadow] shadow-[0_8px_24px_rgba(4,120,87,0.45)] hover:shadow-[0_10px_28px_rgba(4,120,87,0.55)]"
                style={{ backgroundImage: "var(--gradient-ink)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
              >
                <span className="allow-white" style={{ color: "#FFFFFF" }}>Explore Now</span>
                <ArrowRight className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              </Link>

            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ExploreServicesExpander;
