import { useState } from "react";
import { Link } from "react-router-dom";
import { JJLogoImage } from "@/components/JJLogoImage";
import LeadFormDialog from "@/components/gate/LeadFormDialog";
import SignupDialog from "@/components/gate/SignupDialog";
import LoginDialog from "@/components/gate/LoginDialog";
import VideoBackground from "@/components/VideoBackground";
import heroFallbackDubai from "@/assets/hero-fallback-dubai.jpg";
import { BookCarousel } from "@/components/books/BookCarousel";
import { INVESTOR_BOOKS } from "@/data/bookCollections";
import { useHandpickedProjects } from "@/hooks/useHandpickedProjects";
import type { BookData } from "@/types/books";

import {
  ArrowRight,
  Award,
  Building,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Home,
  KeyRound,
  Lock,
  Sparkles,
  TrendingUp,
  Users,
  Briefcase,
  Gift,
  Plane,
  Handshake,
  Trophy,
  BookOpen,
  Ticket,
} from "lucide-react";

const HERO_VIDEO_URL =
  "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/videos/hero-video.mp4";

const quickLinks = [
  { label: "Featured", href: "#featured" },
  { label: "New Launch", href: "#new-launch" },
  { label: "Guides", href: "#guides" },
  { label: "Packages", href: "#packages" },
  { label: "Brokers", href: "#brokers" },
];

// Same books strip as the homepage marquee
const ACCESS_BOOKS: BookData[] = INVESTOR_BOOKS.filter(
  (b) => b.title !== "Guides Library" && b.title !== "Company Profile"
);

const packages = [
  {
    audience: "For Investors",
    name: "Investor Access",
    price: "AED 499",
    cadence: "/month",
    icon: TrendingUp,
    features: [
      "Daily priority advisor support & monthly strategy calls",
      "Early access to featured launches before public release",
      "Exclusive investor discounts on selected units",
      "Cash-back or fully-furnished apartment perks on select deals",
      "Reimbursed inspection trips for qualifying purchases",
      "Invitations to private dinners, launches & investor events",
    ],
    href: "/membership",
  },
  {
    audience: "For Developers",
    name: "Developer Program",
    price: "AED 4,999",
    cadence: "/month",
    icon: Building,
    features: [
      "Full project showcase & inventory pages",
      "Distribution to the JBJ broker network",
      "Verified developer profile & credentials",
      "Lead routing, analytics & buyer insights",
    ],
    href: "/agencies",
  },
  {
    audience: "For Brokers",
    name: "Broker Academy",
    price: "AED 1,499",
    cadence: "/year",
    icon: GraduationCap,
    features: [
      "Yearly enrollment with continuous mentorship & support",
      "DLD-aligned coursework + exclusive JBJ agent books",
      "Hiring pathway to join JBJ Global as a licensed agent",
      "Warm client introductions & shared deal pipeline",
      "Invites to every major UAE real-estate industry event",
      "Direct access to developer network & principal desks",
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

const brokerBenefits = [
  {
    icon: Award,
    title: "JBJ certification",
    body: "Complete the DLD-aligned coursework and receive a formal JBJ Global Broker Certificate.",
  },
  {
    icon: BookOpen,
    title: "Exclusive agent books",
    body: "Private JBJ playbooks, DLD reference material, and scripts not available anywhere on the public site.",
  },
  {
    icon: Handshake,
    title: "Hiring pathway",
    body: "Top performers get onboarded directly into JBJ Global with a client book on day one.",
  },
  {
    icon: Ticket,
    title: "Industry events",
    body: "Invitations to every developer launch, gala, and UAE real-estate industry event we attend.",
  },
  {
    icon: Users,
    title: "Warm client intros",
    body: "We route qualified investor and buyer leads directly to JBJ-certified agents.",
  },
  {
    icon: Trophy,
    title: "Network access",
    body: "Direct lines to developer principal desks, mortgage partners, and legal advisors.",
  },
];

const investorPerks = [
  { icon: Sparkles, label: "Priority daily support" },
  { icon: Gift, label: "Cash-back on qualifying deals" },
  { icon: Home, label: "Fully-furnished unit upgrades" },
  { icon: Plane, label: "Reimbursed inspection trips" },
  { icon: Ticket, label: "Private events & dinners" },
];

// Utility class strings for enforced white-on-emerald contrast
const EMERALD_BTN =
  "!text-white [&_svg]:!text-white [&_*]:!text-white bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] hover:brightness-110";
const WHITE_BTN =
  "!text-[#0d3a2b] [&_svg]:!text-[#0d3a2b] [&_*]:!text-[#0d3a2b] bg-white hover:bg-[#F5EFE3] border border-[#0d3a2b]/15";

// ── Property marquee ────────────────────────────────────────────────────────
function PropertyMarquee({ onClick }: { onClick: () => void }) {
  const { data, isLoading } = useHandpickedProjects();
  const projects = (data?.projects ?? []).slice(0, 10);

  if (isLoading || projects.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#EFE6D6]" />
        ))}
      </div>
    );
  }

  const track = [...projects, ...projects];

  return (
    <div className="group relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#F7F2EA] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#F7F2EA] to-transparent" />
      <div
        className="flex w-max gap-5 [animation:jbj-marquee_46s_linear_infinite] group-hover:[animation-play-state:paused]"
        style={{ willChange: "transform" }}
      >
        {track.map((p: any, idx) => {
          const cover =
            p.image_url ||
            p.hero_image ||
            p.cover_image ||
            (Array.isArray(p.images) && p.images[0]) ||
            heroFallbackDubai;
          const price = p.starting_price
            ? `AED ${Number(p.starting_price).toLocaleString()}`
            : p.price
              ? `AED ${Number(p.price).toLocaleString()}`
              : "Price on request";
          return (
            <button
              type="button"
              key={`${p.id}-${idx}`}
              onClick={onClick}
              className="group/card relative w-[260px] shrink-0 overflow-hidden rounded-2xl border border-[#0d3a2b]/12 bg-[#FDFBF7] text-left shadow-[0_18px_40px_-28px_rgba(6,78,59,0.45)] transition hover:-translate-y-1 hover:border-[#0d3a2b]/40 sm:w-[300px]"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#042c1c]">
                <img
                  src={cover}
                  alt={p.name || "Featured project"}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover/card:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-[#064E3B]/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                  Featured
                </span>
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">
                    {p.location || p.community || "Dubai"}
                  </p>
                  <h3 className="mt-1 line-clamp-2 font-serif text-lg leading-tight">
                    {p.name || p.title || "New launch"}
                  </h3>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-bold text-[#0d3a2b]">{price}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#064E3B]">
                  View <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <style>{`
        @keyframes jbj-marquee {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(-50%,0,0); }
        }
      `}</style>
    </div>
  );
}

export default function PublicAccess() {
  const [leadOpen, setLeadOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const openSignup = () => setSignupOpen(true);

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#1A1A1A]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#0d3a2b]/15 bg-[#FDFBF7]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <a href="/access" className="flex items-center gap-3" aria-label="JBJ Global Real Estate">
            <JJLogoImage size="sm" showText={false} className="!items-start" />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-serif text-[19px] text-[#0d3a2b]">JBJ Global Real Estate</span>
              <span className="mt-0.5 text-[10px] uppercase tracking-[0.32em] text-[#0d3a2b]/60">Dubai · UAE</span>
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
              onClick={openSignup}
              className={`inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-semibold shadow-[0_10px_24px_-12px_rgba(6,78,59,0.85)] transition ${EMERALD_BTN}`}
            >
              Sign up <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO — clean Dubai video, logo + company name only */}
        <section data-surface="dark" className="relative min-h-[calc(100vh-76px)] overflow-hidden bg-black">
          <div className="absolute inset-0">
            <VideoBackground src={HERO_VIDEO_URL} poster={heroFallbackDubai} eager />
          </div>
          {/* Cinematic emerald wash for text contrast */}
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(4,44,28,0.72)_0%,rgba(6,78,59,0.42)_45%,rgba(0,0,0,0.85)_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

          <div className="relative mx-auto flex min-h-[calc(100vh-76px)] max-w-7xl flex-col justify-end px-5 pb-16 pt-24 sm:px-8 sm:pb-24 lg:px-12">
            <div className="max-w-3xl text-white">
              <span className="mb-6 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.32em] !text-white/80">
                <Sparkles className="h-3.5 w-3.5" /> JBJ Global Real Estate
              </span>
              <h1 className="font-serif text-5xl leading-[1.02] !text-white sm:text-6xl lg:text-[84px]">
                A private property platform,<br className="hidden md:block" /> built around you.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">
                Featured launches, off-plan releases, guides, and investor packages — all curated for buyers, brokers, developers, and investors in the UAE.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button
                  onClick={openSignup}
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

        {/* FEATURED PROPERTIES — real property marquee */}
        <section id="featured" className="bg-[#F7F2EA] px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#064E3B]">Latest launches & featured</span>
                <h2 className="mt-3 font-serif text-4xl text-[#0d3a2b] sm:text-5xl">Live inventory from Dubai's top developers.</h2>
                <p className="mt-3 max-w-2xl text-[#1A1A1A]/70">
                  Real projects — off-plan releases, ready inventory, and premium launches. Create an account to unlock pricing, plans and full detail.
                </p>
              </div>
              <button
                onClick={openSignup}
                className={`inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-bold ${EMERALD_BTN}`}
              >
                Unlock the catalogue <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <PropertyMarquee onClick={openSignup} />
          </div>
        </section>

        {/* NEW LAUNCH / PLATFORM PILLARS — premium emerald surface */}
        <section
          id="new-launch"
          data-surface="dark"
          className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12"
          style={{ backgroundImage: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />

          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] !text-white/80">New launches on JBJ</span>
              <h2 className="mt-3 font-serif text-4xl !text-white sm:text-5xl">Every launch, structured the same way.</h2>
              <p className="mx-auto mt-4 max-w-2xl !text-white/80">
                Inventory, payment plans, verified access, and private documents — the four building blocks behind every project on the platform.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {platformPillars.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] p-7 backdrop-blur-sm transition hover:-translate-y-1 hover:border-white/45 hover:bg-white/[0.11]"
                  >
                    <span className="absolute right-5 top-5 font-serif text-sm !text-white/40">0{i + 1}</span>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/10">
                      <Icon className="h-5 w-5" style={{ color: "#ffffff", stroke: "#ffffff" }} />
                    </div>
                    <h3 className="mt-5 font-serif text-2xl !text-white">{p.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed !text-white/78">{p.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* GUIDES — the exact same book strip used on the homepage */}
        <section id="guides" className="bg-[#F7F2EA] py-16">
          <div className="mx-auto mb-8 flex max-w-7xl flex-col justify-between gap-5 px-5 sm:px-8 md:flex-row md:items-end lg:px-12">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#064E3B]">Guides & reports</span>
              <h2 className="mt-3 font-serif text-4xl text-[#0d3a2b] sm:text-5xl">Explore the JBJ library.</h2>
            </div>
            <Link
              to="/guides"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#064E3B] hover:text-[#042c1c]"
            >
              View library <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <BookCarousel books={ACCESS_BOOKS} size="sm" durationSec={38} compact />
        </section>

        {/* PACKAGES: Investor / Developer / Broker */}
        <section id="packages" className="bg-[#FDFBF7] px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#064E3B]">What we offer</span>
              <h2 className="mt-3 font-serif text-4xl text-[#0d3a2b] sm:text-5xl">Packages for every role.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-[#1A1A1A]/72">
                Whether you invest, develop, or broker deals in Dubai, JBJ has a dedicated program tailored to how you work.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {packages.map((plan) => {
                const Icon = plan.icon;
                return (
                  <article
                    key={plan.name}
                    className="relative flex flex-col overflow-hidden rounded-2xl border border-[#0d3a2b]/15 bg-white p-7 shadow-[0_24px_60px_-42px_rgba(13,58,43,0.35)]"
                  >
                    <div
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundImage: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)" }}
                    >
                      <Icon className="h-5 w-5" style={{ color: "#ffffff", stroke: "#ffffff" }} />
                    </div>

                    <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-[#064E3B]">
                      {plan.audience}
                    </p>
                    <h3 className="mt-2 font-serif text-3xl text-[#0d3a2b]">{plan.name}</h3>
                    <div className="mt-5 flex items-end gap-2">
                      <span className="font-serif text-4xl text-[#1A1A1A]">{plan.price}</span>
                      <span className="pb-1 text-sm text-[#1A1A1A]/62">{plan.cadence}</span>
                    </div>

                    <ul className="mt-6 flex-1 space-y-3 text-sm text-[#1A1A1A]/78">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#064E3B]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={openSignup}
                      data-surface="dark"
                      className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold shadow-[0_12px_26px_-16px_rgba(6,78,59,0.8)] ${EMERALD_BTN}`}
                    >
                      Start with {plan.name} <ArrowRight className="h-4 w-4" />
                    </button>
                  </article>
                );
              })}
            </div>

            {/* Add-on line: agency */}
            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#0d3a2b]/15 bg-white px-6 py-5 sm:flex-row">
              <div className="flex items-center gap-4">
                <div
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundImage: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)" }}
                >
                  <Briefcase className="h-5 w-5" style={{ color: "#ffffff", stroke: "#ffffff" }} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#064E3B]">For Agencies</p>
                  <p className="font-serif text-lg text-[#0d3a2b]">Team enablement, CRM segmentation, lead systems — from AED 2,999/month.</p>
                </div>
              </div>
              <Link
                to="/agencies"
                data-surface="dark"
                className={`inline-flex h-11 items-center gap-2 rounded-md px-5 text-sm font-bold ${EMERALD_BTN}`}
              >
                Agency packages <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Investor perks strip */}
            <div className="mt-10 rounded-2xl border border-[#0d3a2b]/15 bg-[#F7F2EA] p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-[#064E3B]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#064E3B]">Investor Access — signature perks</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {investorPerks.map((perk) => {
                  const Icon = perk.icon;
                  return (
                    <div key={perk.label} className="flex items-center gap-3 rounded-xl border border-[#0d3a2b]/12 bg-white px-4 py-3">
                      <div
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{ backgroundImage: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)" }}
                      >
                        <Icon className="h-4 w-4" style={{ color: "#ffffff", stroke: "#ffffff" }} />
                      </div>
                      <span className="text-sm font-semibold text-[#0d3a2b]">{perk.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* BROKER CERTIFICATION & ENROLLMENT */}
        <section
          id="brokers"
          data-surface="dark"
          className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12"
          style={{ backgroundImage: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] !text-white/80">Broker Academy & Enrollment</span>
              <h2 className="mt-3 font-serif text-4xl !text-white sm:text-5xl">Become a JBJ-certified broker.</h2>
              <p className="mx-auto mt-4 max-w-2xl !text-white/85">
                A yearly enrollment for licensed and aspiring UAE agents — with ongoing mentorship, exclusive materials, and a direct pathway into JBJ Global.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {brokerBenefits.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className="rounded-2xl border border-white/15 bg-white/[0.06] p-7 backdrop-blur-sm transition hover:-translate-y-1 hover:border-white/45 hover:bg-white/[0.11]"
                  >
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/10">
                      <Icon className="h-5 w-5" style={{ color: "#ffffff", stroke: "#ffffff" }} />
                    </div>
                    <h3 className="mt-5 font-serif text-xl !text-white">{b.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed !text-white/80">{b.body}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <button
                onClick={openSignup}
                data-surface="dark"
                className={`inline-flex h-12 items-center gap-2 rounded-md px-6 text-sm font-bold uppercase tracking-[0.14em] ${WHITE_BTN}`}
              >
                Enroll in the academy <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLeadOpen(true)}
                className="inline-flex h-12 items-center gap-2 rounded-md border border-white/40 bg-transparent px-6 text-sm font-bold uppercase tracking-[0.14em] !text-white transition hover:bg-white/[0.10]"
              >
                Speak to the broker desk
              </button>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section
          data-surface="dark"
          className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12"
          style={{ backgroundImage: "linear-gradient(135deg,#000 0%,#042c1c 45%,#064E3B 100%)" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_65%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <Users className="mx-auto h-9 w-9" style={{ color: "#ffffff", stroke: "#ffffff" }} />
            <h2 className="mt-5 font-serif text-4xl !text-white sm:text-5xl">Ready to step inside JBJ?</h2>
            <p className="mx-auto mt-4 max-w-2xl !text-white/85">
              Create an account to unlock featured properties, launches, guides, and packages — or speak with an advisor who can guide you first.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={openSignup}
                data-surface="dark"
                className={`inline-flex h-12 items-center gap-2 rounded-md px-6 text-sm font-bold uppercase tracking-[0.14em] ${WHITE_BTN}`}
              >
                Create account <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLeadOpen(true)}
                className="inline-flex h-12 items-center gap-2 rounded-md border border-white/40 bg-transparent px-6 text-sm font-bold uppercase tracking-[0.14em] !text-white transition hover:bg-white/[0.10]"
              >
                Request a call back
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#0d3a2b]/15 bg-[#F7F2EA] px-5 py-8 sm:px-8 lg:px-12">
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
        <span className="h-1.5 w-1.5 rounded-full bg-white" /> Speak to an advisor
      </button>

      <LeadFormDialog open={leadOpen} onOpenChange={setLeadOpen} sourcePage="/access" />
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} />
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
