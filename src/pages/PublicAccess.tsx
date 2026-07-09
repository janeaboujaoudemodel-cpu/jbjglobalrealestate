import { useState } from "react";
import { Link } from "react-router-dom";
import { JJLogoImage } from "@/components/JJLogoImage";
import { Button } from "@/components/ui/button";
import LeadFormDialog from "@/components/gate/LeadFormDialog";
import SignupDialog from "@/components/gate/SignupDialog";
import LoginDialog from "@/components/gate/LoginDialog";
import VideoBackground from "@/components/VideoBackground";
import heroVideoAsset from "@/assets/properties-hero-video.mp4.asset.json";

// Guides library book covers — mirror what's inside the platform
import guidesLibraryCover from "@/assets/books/guides-library-cover.jpg";
import buyerGuideCover from "@/assets/books/buyer-guide-cover.jpg";
import sellerGuideCover from "@/assets/books/seller-guide-cover.jpg";
import landlordGuideCover from "@/assets/books/landlord-guide-cover.jpg";
import tenantGuideCover from "@/assets/books/tenant-guide-cover.jpg";
import rentGuideCover from "@/assets/books/rent-guide-cover-v2.jpg";
import goldenVisaCover from "@/assets/books/golden-visa-cover.jpg";
import marketIntelligenceCover from "@/assets/books/market-intelligence-cover.jpg";

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Building,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Home,
  KeyRound,
  Library,
  LineChart,
  Lock,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Briefcase,
} from "lucide-react";

const quickLinks = [
  { label: "Featured", href: "#featured" },
  { label: "New Launch", href: "#new-launch" },
  { label: "Guides", href: "#guides" },
  { label: "Packages", href: "#packages" },
  { label: "Education", href: "#education" },
];

const featuredProperties = [
  {
    title: "Off-plan launch desk",
    meta: "Dubai prime communities",
    body: "Curated new releases with payment-plan review, developer checks, and handover guidance.",
    image: "/services/buy-property-bg.jpg",
    icon: Building2,
  },
  {
    title: "Investment shortlist",
    meta: "Yield, growth, exit view",
    body: "Compare projects through returns, rental depth, service charges, and resale liquidity.",
    image: "/services/property-evaluation-bg.jpg",
    icon: LineChart,
  },
  {
    title: "Golden Visa pathway",
    meta: "Property-led residency",
    body: "Structure your purchase with residency eligibility, documentation, and concierge coordination.",
    image: "/services/golden-visa-bg.jpg",
    icon: BadgeCheck,
  },
];

const guides = [
  { title: "Guides Library", eyebrow: "All Guides", image: guidesLibraryCover, href: "/guides" },
  { title: "Buyer Guide", eyebrow: "Buyers", image: buyerGuideCover, href: "/buyer-guide" },
  { title: "Seller Guide", eyebrow: "Sellers", image: sellerGuideCover, href: "/seller-guide" },
  { title: "Landlord Guide", eyebrow: "Landlords", image: landlordGuideCover, href: "/landlord-guide" },
  { title: "Tenant Guide", eyebrow: "Tenants", image: tenantGuideCover, href: "/tenant-guide" },
  { title: "Rent Guide", eyebrow: "Rentals", image: rentGuideCover, href: "/rent-guide" },
  { title: "Golden Visa UAE", eyebrow: "Residency", image: goldenVisaCover, href: "/guides/golden-visa-uae" },
  { title: "Market Intelligence", eyebrow: "Report", image: marketIntelligenceCover, href: "/market-intelligence" },
];

const packages = [
  {
    audience: "For Investors",
    name: "Investor Access",
    price: "AED 499",
    cadence: "/month",
    icon: TrendingUp,
    features: [
      "Premium launch access",
      "Market intelligence library",
      "Deal shortlists and ROI reports",
      "Priority advisor callbacks",
    ],
    href: "/membership",
  },
  {
    audience: "For Developers",
    name: "Developer Program",
    price: "AED 4,999",
    cadence: "/month",
    icon: Building,
    featured: true,
    features: [
      "Project listing and showcase pages",
      "Broker network distribution",
      "Verified developer profile",
      "Lead routing and analytics",
    ],
    href: "/agencies",
  },
  {
    audience: "For Brokers",
    name: "Broker Academy",
    price: "AED 1,499",
    cadence: "/program",
    icon: GraduationCap,
    features: [
      "Certification pathway",
      "Sales scripts and templates",
      "CRM segmentation toolkit",
      "Learning hub and workshops",
    ],
    href: "/academy",
  },
];

const platformPillars = [
  {
    icon: Home,
    title: "Launch inventory",
    body: "Availability snapshots, release highlights, and floor-plan availability across new project launches.",
  },
  {
    icon: CreditCard,
    title: "Payment plans",
    body: "Structured down payment, construction milestone, handover, and post-handover breakdowns per project.",
  },
  {
    icon: KeyRound,
    title: "Verified access",
    body: "Curated listings and developer records are validated before they reach the platform.",
  },
  {
    icon: Lock,
    title: "Private documents",
    body: "Investor books, factsheets, PDFs, and legal documents in one organised library.",
  },
];

const educationCards = [
  { title: "Insights", body: "Market analysis, strategy articles, and premium investor thinking.", href: "/insights", icon: Sparkles },
  { title: "Library", body: "Books, explainers, guides, and document resources in one place.", href: "/library", icon: Library },
  { title: "Success Stories", body: "Real client journeys, property decisions, and outcome-led case studies.", href: "/success-stories", icon: Star },
  { title: "Broker Academy", body: "A structured learning track for brokers and agency teams.", href: "/jbj-academy", icon: GraduationCap },
];

const HERO_POSTER = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80";

// Utility class strings for enforced white-on-emerald contrast
const EMERALD_BTN =
  "!text-white [&_svg]:!text-white [&_*]:!text-white bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] hover:brightness-110";

export default function PublicAccess() {
  const [leadOpen, setLeadOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#1A1A1A]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#B89555]/35 bg-[#FDFBF7]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <a href="/access" className="flex items-center gap-3" aria-label="JBJ Global Real Estate">
            <JJLogoImage size="sm" showText={false} className="!items-start" />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-serif text-[19px] text-[#0d3a2b]">JBJ Global</span>
              <span className="mt-0.5 text-[10px] uppercase tracking-[0.32em] text-[#B89555]">Real Estate</span>
            </div>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#1A1A1A]/70 transition hover:bg-[#EFE6D6] hover:text-[#064E3B]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setLoginOpen(true)}
              className="h-10 rounded-md border border-[#0d3a2b]/25 bg-transparent px-4 text-sm font-semibold text-[#0d3a2b] transition hover:bg-[#EFE6D6]"
            >
              Log in
            </button>
            <button
              onClick={() => setSignupOpen(true)}
              className={`inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-semibold shadow-[0_10px_24px_-12px_rgba(6,78,59,0.85)] transition ${EMERALD_BTN}`}
            >
              Sign up <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO with video background */}
        <section data-surface="dark" className="relative min-h-[calc(100vh-76px)] overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ filter: "saturate(1.35) contrast(1.05) brightness(0.95)" }}
          >
            <VideoBackground src={heroVideoAsset.url} poster={HERO_POSTER} eager />
          </div>
          {/* Emerald + black cinematic overlay for text contrast */}
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(4,44,28,0.92)_0%,rgba(6,78,59,0.78)_45%,rgba(0,0,0,0.9)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />

          <div className="relative mx-auto flex min-h-[calc(100vh-76px)] max-w-7xl flex-col justify-end px-5 pb-16 pt-24 sm:px-8 sm:pb-24 lg:px-12">
            <div className="max-w-3xl text-white">
              <span className="mb-6 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.32em] text-[#D9C292]">
                <Sparkles className="h-3.5 w-3.5" /> JBJ Global · Dubai
              </span>
              <h1 className="font-serif text-5xl leading-[1.02] !text-white sm:text-6xl lg:text-[84px]">
                A private property platform,<br className="hidden md:block" /> built around you.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">
                Featured launches, off-plan releases, guides, and investor packages — all curated for buyers, brokers, developers, and investors in the UAE.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button
                  onClick={() => setSignupOpen(true)}
                  className={`inline-flex h-12 items-center gap-2 rounded-md px-6 text-sm font-bold uppercase tracking-[0.14em] ${EMERALD_BTN}`}
                >
                  Create your account <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setLeadOpen(true)}
                  className="inline-flex h-12 items-center gap-2 rounded-md border border-white/40 bg-white/[0.06] px-6 text-sm font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm transition hover:bg-white/[0.14]"
                >
                  Talk to an advisor
                </button>
              </div>

              {/* Trust strip */}
              <div className="mt-14 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-4 border-t border-white/20 pt-6 text-white/80 sm:grid-cols-4">
                {[
                  ["500+", "curated projects"],
                  ["120+", "developers"],
                  ["24/7", "advisor desk"],
                  ["AED", "backed reporting"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <p className="font-serif text-2xl !text-white">{v}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED PROPERTIES */}
        <section id="featured" className="bg-[#F7F2EA] px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B89555]">Featured properties</span>
                <h2 className="mt-3 font-serif text-4xl text-[#0d3a2b] sm:text-5xl">Handpicked projects across Dubai.</h2>
              </div>
              <Link to="/properties" className="inline-flex items-center gap-2 text-sm font-bold text-[#064E3B] hover:text-[#042c1c]">
                Browse properties <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {featuredProperties.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="group overflow-hidden rounded-2xl border border-[#B89555]/30 bg-[#FDFBF7] shadow-[0_24px_60px_-38px_rgba(26,26,26,0.55)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#042c1c]">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-4 left-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] shadow-lg">
                        <Icon className="h-5 w-5 !text-white" />
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B89555]">{item.meta}</p>
                      <h3 className="mt-2 font-serif text-2xl text-[#0d3a2b]">{item.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-[#1A1A1A]/72">{item.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* NEW LAUNCH / PLATFORM PILLARS — premium emerald surface */}
        <section id="new-launch" data-surface="dark" className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12" style={{ backgroundImage: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)" }}>
          <div className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-luminosity">
            <img src="/services/property-management-bg.jpg" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#D9C292]">New launches on JBJ</span>
              <h2 className="mt-3 font-serif text-4xl !text-white sm:text-5xl">Every launch, structured the same way.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-white/80">
                Inventory, payment plans, verified access, and private documents — the four building blocks behind every project on the platform.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {platformPillars.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] p-7 backdrop-blur-sm transition hover:-translate-y-1 hover:border-[#D9C292]/60 hover:bg-white/[0.11]"
                  >
                    <span className="absolute right-5 top-5 font-serif text-sm !text-white/40">0{i + 1}</span>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/10">
                      <Icon className="h-5 w-5 !text-white" />
                    </div>
                    <h3 className="mt-5 font-serif text-2xl !text-white">{p.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed !text-white/78">{p.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* GUIDES — mirrors the platform's Guides Library */}
        <section id="guides" className="bg-[#FDFBF7] px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B89555]">Guides library</span>
                <h2 className="mt-3 font-serif text-4xl text-[#0d3a2b] sm:text-5xl">Learn from the same guides used inside JBJ.</h2>
              </div>
              <Link to="/guides" className="inline-flex items-center gap-2 text-sm font-bold text-[#064E3B] hover:text-[#042c1c]">
                Open all guides <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
              {guides.map((book) => (
                <Link key={book.title} to={book.href} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-[#B89555]/35 bg-[#EFE6D6] shadow-[0_22px_50px_-32px_rgba(26,26,26,0.72)] transition group-hover:-translate-y-1 group-hover:shadow-[0_28px_60px_-30px_rgba(26,26,26,0.85)]">
                    <img
                      src={book.image}
                      alt={`${book.title} cover`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[image:linear-gradient(180deg,rgba(0,0,0,0.35),rgba(0,0,0,0.05))]" />
                  </div>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#B89555]">{book.eyebrow}</p>
                  <h3 className="mt-1 font-serif text-lg text-[#0d3a2b]">{book.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* PACKAGES: Investor / Developer / Broker */}
        <section id="packages" className="bg-[#F7F2EA] px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B89555]">What we offer</span>
              <h2 className="mt-3 font-serif text-4xl text-[#0d3a2b] sm:text-5xl">Packages for every role.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-[#1A1A1A]/72">
                Whether you invest, develop, or broker deals in Dubai, JBJ has a dedicated program tailored to how you work.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {packages.map((plan) => {
                const Icon = plan.icon;
                const featured = plan.featured;
                return (
                  <article
                    key={plan.name}
                    className={
                      featured
                        ? "relative overflow-hidden rounded-2xl p-7 shadow-[0_36px_70px_-30px_rgba(6,78,59,0.55)]"
                        : "relative overflow-hidden rounded-2xl border border-[#B89555]/35 bg-[#FDFBF7] p-7 shadow-[0_24px_60px_-42px_rgba(26,26,26,0.55)]"
                    }
                    data-surface={featured ? "dark" : undefined}
                    style={featured ? { backgroundImage: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)" } : undefined}
                  >
                    {featured && (
                      <span className="absolute right-5 top-5 rounded-full border border-[#D9C292]/60 bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] !text-white">
                        Most popular
                      </span>
                    )}
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                        featured ? "border border-white/25 bg-white/10" : "bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)]"
                      }`}
                    >
                      <Icon className="h-5 w-5 !text-white" />
                    </div>

                    <p className={`mt-6 text-[11px] font-bold uppercase tracking-[0.22em] ${featured ? "!text-[#D9C292]" : "text-[#B89555]"}`}>
                      {plan.audience}
                    </p>
                    <h3 className={`mt-2 font-serif text-3xl ${featured ? "!text-white" : "text-[#0d3a2b]"}`}>{plan.name}</h3>
                    <div className="mt-5 flex items-end gap-2">
                      <span className={`font-serif text-4xl ${featured ? "!text-white" : "text-[#1A1A1A]"}`}>{plan.price}</span>
                      <span className={`pb-1 text-sm ${featured ? "!text-white/75" : "text-[#1A1A1A]/62"}`}>{plan.cadence}</span>
                    </div>

                    <ul className={`mt-6 space-y-3 text-sm ${featured ? "!text-white/85" : "text-[#1A1A1A]/78"}`}>
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "!text-[#D9C292]" : "text-[#064E3B]"}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={plan.href}
                      className={
                        featured
                          ? "mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#D9C292]/60 bg-[#D9C292] px-4 py-3 text-sm font-bold !text-[#0d3a2b] transition hover:brightness-105"
                          : `mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold shadow-[0_12px_26px_-16px_rgba(6,78,59,0.8)] ${EMERALD_BTN}`
                      }
                    >
                      View package <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>

            {/* Add-on line: agency */}
            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#B89555]/30 bg-[#FDFBF7] px-6 py-5 sm:flex-row">
              <div className="flex items-center gap-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)]">
                  <Briefcase className="h-5 w-5 !text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B89555]">For Agencies</p>
                  <p className="font-serif text-lg text-[#0d3a2b]">Team enablement, CRM segmentation, lead systems — from AED 2,999/month.</p>
                </div>
              </div>
              <Link
                to="/agencies"
                className={`inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-bold ${EMERALD_BTN}`}
              >
                Agency packages <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* EDUCATION */}
        <section id="education" className="bg-[#FDFBF7] px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B89555]">Education</span>
                <h2 className="mt-3 font-serif text-4xl text-[#0d3a2b] sm:text-5xl">Learn before you commit.</h2>
              </div>
              <Link to="/library" className="inline-flex items-center gap-2 text-sm font-bold text-[#064E3B] hover:text-[#042c1c]">
                Open library <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {educationCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    to={card.href}
                    className="group rounded-2xl border border-[#B89555]/30 bg-[#F7F2EA] p-6 transition hover:border-[#064E3B]/45 hover:bg-[#EFE6D6]/70"
                  >
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)]">
                      <Icon className="h-5 w-5 !text-white" />
                    </div>
                    <h3 className="mt-5 font-serif text-2xl text-[#0d3a2b]">{card.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#1A1A1A]/72">{card.body}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#064E3B]">
                      Enter <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section data-surface="dark" className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12" style={{ backgroundImage: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)" }}>
          <div className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-luminosity">
            <img src="/services/buy-property-bg.jpg" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
          <div className="relative mx-auto max-w-4xl text-center">
            <Users className="mx-auto h-9 w-9 !text-[#D9C292]" />
            <h2 className="mt-5 font-serif text-4xl !text-white sm:text-5xl">Ready to step inside JBJ?</h2>
            <p className="mx-auto mt-4 max-w-2xl !text-white/85">
              Create an account to unlock featured properties, launches, guides, and packages — or speak with an advisor who can guide you first.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setSignupOpen(true)}
                className={`inline-flex h-12 items-center gap-2 rounded-md border border-[#D9C292]/60 bg-[#D9C292] px-6 text-sm font-bold uppercase tracking-[0.14em] !text-[#0d3a2b] transition hover:brightness-105`}
              >
                Create account <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLeadOpen(true)}
                className="inline-flex h-12 items-center gap-2 rounded-md border border-white/40 bg-white/[0.06] px-6 text-sm font-bold uppercase tracking-[0.14em] !text-white backdrop-blur-sm transition hover:bg-white/[0.14]"
              >
                Request a call back
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#B89555]/25 bg-[#F7F2EA] px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-[#1A1A1A]/65 sm:flex-row">
          <div className="flex items-center gap-3">
            <JJLogoImage size="xs" showText={false} className="!items-start" />
            <span className="font-serif text-base text-[#0d3a2b]">JBJ Global Real Estate</span>
          </div>
          <p>© {new Date().getFullYear()} JBJ Global Real Estate. Dubai · UAE.</p>
        </div>
      </footer>

      <button
        onClick={() => setLeadOpen(true)}
        className={`fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-[0_14px_34px_-16px_rgba(6,78,59,0.85)] ${EMERALD_BTN}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#D9C292]" /> Speak to an advisor
      </button>

      <LeadFormDialog open={leadOpen} onOpenChange={setLeadOpen} sourcePage="/access" />
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} />
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
