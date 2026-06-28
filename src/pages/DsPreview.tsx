import React from "react";
import { Search, SlidersHorizontal, Heart, Home, Building2, BarChart3, BookOpen, Briefcase, Settings, LogOut, ChevronsLeft, MessageCircle, LifeBuoy } from "lucide-react";
import { HeaderControl, HeaderSegmented, SidebarItem, DsBadge } from "@/components/ui/ds";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";

/**
 * /ds-preview — JBJ Design System gallery (Phase 1.A)
 *
 * Visual sign-off surface for the new primitives. Every variant lives here
 * so future agents can verify changes in one place before migration.
 */
export default function DsPreview() {
  const [unit, setUnit] = React.useState<"sqft" | "sqm">("sqft");
  const [active, setActive] = React.useState("home");

  const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <section className="rounded-2xl bg-white border border-[#B89555]/25 shadow-[0_4px_18px_-12px_rgba(0,0,0,0.18)] p-6 mb-6">
      <header className="mb-4">
        <h2 className="text-[15px] font-semibold tracking-[0.02em] text-[#1A1A1A]">{title}</h2>
        {subtitle && <p className="text-[12px] text-[#1A1A1A]/65 mt-1">{subtitle}</p>}
      </header>
      {children}
    </section>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto">
        <header className="mb-8">
          <div className="text-[11px] tracking-[0.22em] uppercase text-[#B89555] font-semibold">JBJ Design System</div>
          <h1 className="text-[26px] md:text-[32px] font-bold text-[#1A1A1A] mt-1">Phase 1.A — Primitive Gallery</h1>
          <p className="text-[13px] text-[#1A1A1A]/65 mt-2 max-w-2xl">
            Visual sign-off surface for HeaderControl, SidebarItem, DsBadge, and the existing Button/IconTile primitives. Approve this preview before Phase 1.B begins migrating HorizontalUtilityBar and GlobalVerticalNav to use these primitives.
          </p>
        </header>

        <Section title="HeaderControl — circle" subtitle="44×44 circular controls. Emerald = white icon, champagne = ink icon, ghost = inherits.">
          <div className="flex flex-wrap items-center gap-3">
            <HeaderControl aria-label="Search"><Search /></HeaderControl>
            <HeaderControl aria-label="Filter"><SlidersHorizontal /></HeaderControl>
            <HeaderControl aria-label="Favorites"><Heart /></HeaderControl>
            <HeaderControl aria-label="Avatar" className="text-[12px] font-bold">JB</HeaderControl>
            <HeaderControl tone="champagne" aria-label="Search ghost"><Search /></HeaderControl>
            <HeaderControl tone="ghost" aria-label="Search ghost"><Search /></HeaderControl>
          </div>
        </Section>

        <Section title="HeaderControl — pill" subtitle="h-10 pills for AED, Mode, compact CTAs.">
          <div className="flex flex-wrap items-center gap-3">
            <HeaderControl shape="pill" aria-label="Currency AED">AED</HeaderControl>
            <HeaderControl shape="pill" aria-label="Mode Broker">Mode · Broker</HeaderControl>
            <HeaderControl shape="pill" tone="champagne" aria-label="Currency AED champagne">AED</HeaderControl>
            <HeaderControl shape="pill" tone="ghost" aria-label="Mode ghost">Investor</HeaderControl>
          </div>
        </Section>

        <Section title="HeaderSegmented — sq ft / sq m" subtitle="Paired segment control. Active = emerald, inactive = ghost.">
          <HeaderSegmented
            value={unit}
            onChange={(v) => setUnit(v as "sqft" | "sqm")}
            options={[
              { value: "sqft", label: "sq ft" },
              { value: "sqm", label: "sq m" },
            ]}
          />
        </Section>

        <Section title="SidebarItem — root, sub, footer, collapsed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-[#FDFBF7] p-3 border border-[#B89555]/20 w-full max-w-[260px]">
              <div className="text-[10px] tracking-[0.22em] uppercase text-[#1A1A1A]/55 mb-2 px-3">Expanded</div>
              <div className="flex flex-col gap-0.5">
                <SidebarItem icon={Home} label="Home" to="#" active={active === "home"} onClick={() => setActive("home")} asButton />
                <SidebarItem icon={Building2} label="Properties" to="#" active={active === "props"} onClick={() => setActive("props")} asButton />
                <SidebarItem icon={BarChart3} label="Market Intelligence" to="#" active={active === "mi"} onClick={() => setActive("mi")} asButton />
                <SidebarItem icon={BookOpen} label="Insights & Guides" to="#" active={active === "ig"} onClick={() => setActive("ig")} asButton />
                <SidebarItem icon={Briefcase} label="Broker Portal" to="#" active={active === "bp"} onClick={() => setActive("bp")} asButton />
                <SidebarItem label="Off-Plan" level="sub" to="#" active={false} asButton />
                <SidebarItem label="Resale" level="sub" to="#" active={false} asButton />
                <div className="h-px bg-[#B89555]/25 my-2" />
                <SidebarItem icon={MessageCircle} label="Contact" level="footer" to="#" asButton />
                <SidebarItem icon={LifeBuoy} label="Support" level="footer" to="#" asButton />
                <SidebarItem icon={LogOut} label="Sign Out" level="footer" to="#" asButton />
                <SidebarItem icon={ChevronsLeft} label="Collapse" level="footer" to="#" asButton />
              </div>
            </div>

            <div className="rounded-xl bg-[#FDFBF7] p-3 border border-[#B89555]/20 w-[60px]">
              <div className="flex flex-col gap-0.5 items-center">
                <SidebarItem icon={Home} label="Home" collapsed active to="#" asButton />
                <SidebarItem icon={Building2} label="Properties" collapsed to="#" asButton />
                <SidebarItem icon={BarChart3} label="Market" collapsed to="#" asButton />
                <SidebarItem icon={BookOpen} label="Guides" collapsed to="#" asButton />
                <SidebarItem icon={Briefcase} label="Broker" collapsed to="#" asButton />
                <div className="h-px bg-[#B89555]/25 my-2 w-6" />
                <SidebarItem icon={MessageCircle} label="Contact" collapsed to="#" asButton />
                <SidebarItem icon={LogOut} label="Sign Out" collapsed to="#" asButton />
                <SidebarItem icon={ChevronsLeft} label="Expand" collapsed to="#" asButton />
              </div>
            </div>
          </div>
        </Section>

        <Section title="DsBadge — featured / partner / top / live / neutral / success / warn / inverse">
          <div className="flex flex-wrap items-center gap-2">
            <DsBadge tone="featured">Featured</DsBadge>
            <DsBadge tone="partner">Partner</DsBadge>
            <DsBadge tone="top">Top Opportunity</DsBadge>
            <DsBadge tone="live">Live Roles</DsBadge>
            <DsBadge tone="neutral">Frequently Asked</DsBadge>
            <DsBadge tone="success">Trending</DsBadge>
            <DsBadge tone="warn">High Demand</DsBadge>
            <DsBadge tone="inverse">21 Open</DsBadge>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <DsBadge tone="featured" size="sm">Featured</DsBadge>
            <DsBadge tone="featured" size="md">Featured</DsBadge>
            <DsBadge tone="featured" size="lg">Featured</DsBadge>
          </div>
        </Section>

        <Section title="Existing Button (canonical)" subtitle="Phase 1.A keeps the existing Button primitive. Phase 1.C consolidates legacy duplicates (brand-button, hero-button, pearl-button, premium-hero-button).">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary CTA</Button>
            <Button variant="primary" size="lg">Free Consultation</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="primary" size="icon" aria-label="Search"><Search /></Button>
          </div>
        </Section>

        <Section title="Existing IconTile (canonical, locked emerald)">
          <div className="flex flex-wrap items-center gap-3">
            <IconTile icon={Home} size="sm" />
            <IconTile icon={Building2} size="md" />
            <IconTile icon={BarChart3} size="lg" />
            <IconTile icon={BookOpen} size="xl" />
          </div>
        </Section>

        <footer className="mt-10 text-[11px] text-[#1A1A1A]/55">
          Preview-only route. Not linked in production navigation.
        </footer>
      </div>
    </div>
  );
}
