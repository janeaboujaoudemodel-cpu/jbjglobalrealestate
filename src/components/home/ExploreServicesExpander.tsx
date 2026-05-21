/**
 * ExploreServicesExpander
 * A single click-to-expand header bar. Header shows an auto-rotating service title
 * (carousel). Clicking the bar expands a champagne panel below with the full grid
 * of services — the carousel keeps animating inside.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown, ArrowRight, Sparkles,
  Home, Tag, Key, Building2, Globe, Calculator, Plane,
  MessageCircle, Scale, Handshake, Wrench,
} from "lucide-react";

type Service = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  available?: boolean;
};

const services: Service[] = [
  { id: "buy",      title: "Buy Property",           description: "Discover premium properties in Dubai's most sought-after locations.",   icon: Home,         href: "/properties?transaction=buy" },
  { id: "sell",     title: "Sell Your Property",     description: "Maximize your property's value with expert selling services.",          icon: Tag,          href: "/listing-portal" },
  { id: "rent",     title: "Rent a Property",        description: "Find your perfect rental home in Dubai's best neighborhoods.",         icon: Key,          href: "/properties?transaction=rent" },
  { id: "list",     title: "List for Rent",          description: "Connect with qualified tenants through our network.",                   icon: Building2,    href: "/landlord-listing" },
  { id: "visa",     title: "Golden Visa Advisory",   description: "10-year UAE residency through strategic real estate investment.",      icon: Globe,        href: "/guides/golden-visa-uae" },
  { id: "manage",   title: "Property Management",    description: "Professional maintenance and management for landlords.",                icon: Building2,    href: "/services/property-management" },
  { id: "mortgage", title: "Mortgage Inquiries",     description: "Calculate payments and connect with top mortgage providers.",          icon: Calculator,   href: "/mortgage-calculator" },
  { id: "passport", title: "Passport & Schengen",    description: "Request introduction via independent licensed partners.",              icon: Plane,        href: "/services/citizenship" },
  { id: "compare",  title: "Compare Properties",     description: "AI-powered side-by-side analysis of multiple projects.",               icon: Scale,        href: "/compare" },
  { id: "eval",     title: "Property Evaluation",    description: "AI-powered valuation for accurate market assessments.",                icon: Calculator,   href: "/property-evaluator" },
  { id: "partner",  title: "Partner Introduction",   description: "Connect with our network of trusted partners.",                        icon: Handshake,    href: "/partners" },
  { id: "inquiry",  title: "General Inquiries",      description: "Get answers to all your real estate questions.",                       icon: MessageCircle,href: "/contact" },
  { id: "facility", title: "Facility Management",    description: "Property maintenance for owners — coming soon.",                        icon: Wrench,       href: "/services/facility-management", available: false },
];

const ExploreServicesExpander = () => {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const panelId = "explore-services-panel";
  const headerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const i = setInterval(() => setIdx((p) => (p + 1) % services.length), 2800);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  const current = services[idx];
  const HeadIcon = current.icon;

  return (
    <div className="rounded-2xl border border-[#B89555]/40 bg-[#FDFBF7] overflow-hidden shadow-[0_4px_24px_rgba(184,149,85,0.12)]">
      <button
        ref={headerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="group w-full flex items-center justify-between gap-3 px-5 md:px-7 py-4 md:py-5 text-left transition-colors hover:bg-[#F7F2EA]"
      >
        <span className="flex items-center gap-3 md:gap-4 min-w-0">
          <span className="inline-flex w-10 h-10 md:w-11 md:h-11 items-center justify-center rounded-xl bg-[#F7F2EA] border border-[#B89555]/40 shrink-0">
            <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/60">
              Explore Our Services
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-base md:text-lg font-bold text-[#1A1A1A]">
              <HeadIcon className="w-4 h-4 text-[#B89555] shrink-0" />
              <span
                key={current.id}
                className="truncate animate-fade-in"
              >
                {current.title}
              </span>
            </span>
          </span>
        </span>
        <span className="inline-flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs font-semibold text-[#1A1A1A]/70">
            {open ? "Hide" : "View all"}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-[#1A1A1A] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <div
        id={panelId}
        className="grid transition-[grid-template-rows] duration-500 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[#B89555]/25 bg-[#F7F2EA]/40 p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {services.map((s) => {
                const Icon = s.icon;
                const isCurrent = s.id === current.id;
                const inner = (
                  <div
                    className={`group h-full flex flex-col gap-2 rounded-xl border bg-white p-3.5 md:p-4 transition-all ${
                      isCurrent
                        ? "border-[#B89555] shadow-[0_6px_18px_rgba(184,149,85,0.18)]"
                        : "border-[#B89555]/25 hover:border-[#B89555]/60 hover:shadow-[0_4px_14px_rgba(184,149,85,0.14)]"
                    } ${s.available === false ? "opacity-60" : ""}`}
                  >
                    <span className="inline-flex w-9 h-9 items-center justify-center rounded-lg bg-[#F7F2EA] border border-[#B89555]/30">
                      <Icon className="w-4.5 h-4.5 text-[#1A1A1A]" />
                    </span>
                    <span className="text-sm font-bold text-[#1A1A1A] leading-tight">{s.title}</span>
                    <span className="text-[11px] text-[#1A1A1A]/70 leading-snug line-clamp-2">{s.description}</span>
                    <span className="mt-auto pt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#1A1A1A]">
                      {s.available === false ? "Coming soon" : "Open"}
                      {s.available !== false && (
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </span>
                  </div>
                );
                return s.available === false ? (
                  <div key={s.id} aria-disabled>{inner}</div>
                ) : (
                  <Link key={s.id} to={s.href} className="block h-full">{inner}</Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreServicesExpander;
