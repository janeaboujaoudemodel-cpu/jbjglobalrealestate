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
  Headphones,
  Home,
  KeyRound,
  Lock,
  PhoneCall,
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
  ShieldCheck,
  FileCheck2,
  Building2,
  Star,
} from "lucide-react";
import CombinedContactNewsletter from "@/components/CombinedContactNewsletter";

const HERO_VIDEO_URL =
  "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/videos/hero-video.mp4";

const quickLinks = [
  { label: "Featured", href: "#featured" },
  { label: "New Launch", href: "#new-launch" },
  { label: "Guides", href: "#guides" },
  { label: "Investors", href: "#investor-packages" },
  { label: "Developers", href: "#developer-packages" },
  { label: "Brokers", href: "#broker-packages" },
];

// Same books strip as the homepage marquee — LOCKED per owner request
const ACCESS_BOOKS: BookData[] = INVESTOR_BOOKS.filter(
  (b) => b.title !== "Guides Library" && b.title !== "Company Profile"
);

// ── PACKAGES ────────────────────────────────────────────────────────────────
type Tier = {
  name: string;
  audienceSize?: string;
  price: string;
  cadence: string;
  featured?: boolean;
  features: string[];
};

const investorTiers: Tier[] = [
  {
    name: "Starter",
    audienceSize: "Individual investor · 1 seat",
    price: "AED 199",
    cadence: "/month",
    features: [
      "Access to featured launches & inventory",
      "Basic advisor support (business hours)",
      "Monthly market briefing",
      "1 saved shortlist",
    ],
  },
  {
    name: "Signature",
    audienceSize: "Serious investor · up to 2 seats",
    price: "AED 499",
    cadence: "/month",
    featured: true,
    features: [
      "Priority daily advisor support & monthly strategy call",
      "Early access to launches before public release",
      "Cash-back or fully-furnished apartment perks on select deals",
      "Reimbursed inspection trips for qualifying purchases",
      "Private investor dinners, launches & events",
      "Unlimited shortlists & saved reports",
    ],
  },
  {
    name: "Private Office",
    audienceSize: "Family office · up to 5 seats",
    price: "AED 1,499",
    cadence: "/month",
    features: [
      "Dedicated principal advisor + WhatsApp line",
      "White-glove sourcing across all developers",
      "Portfolio reporting & performance reviews",
      "All Signature perks included",
      "Legal, mortgage & concierge coordination",
    ],
  },
];

const developerTiers: Tier[] = [
  {
    name: "Launch",
    audienceSize: "Boutique developer · 1-3 projects",
    price: "AED 2,499",
    cadence: "/month",
    features: [
      "1 active project showcase",
      "Distribution to core JBJ broker network",
      "Verified developer profile",
      "Monthly lead & analytics report",
    ],
  },
  {
    name: "Growth",
    audienceSize: "Mid-market developer · up to 10 projects",
    price: "AED 4,999",
    cadence: "/month",
    featured: true,
    features: [
      "Unlimited active project pages",
      "Full JBJ broker network distribution",
      "Dedicated account manager",
      "Weekly lead routing & buyer insights",
      "Featured placement rotation on /access",
      "Co-marketing on launches & events",
    ],
  },
  {
    name: "Enterprise",
    audienceSize: "Master developer · unlimited",
    price: "Custom",
    cadence: "annual",
    features: [
      "Portfolio-wide distribution + priority placement",
      "Custom API & CRM integration",
      "Direct broker training on your inventory",
      "On-site launch events with JBJ",
      "SLA-backed advisor coverage",
    ],
  },
];

const brokerTiers: Tier[] = [
  {
    name: "Associate",
    audienceSize: "New / independent agent",
    price: "AED 799",
    cadence: "/year",
    features: [
      "DLD-aligned coursework & agent playbook",
      "JBJ-certified broker badge",
      "Access to JBJ inventory & payment plans",
      "Community & mentor Q&A",
    ],
  },
  {
    name: "Professional",
    audienceSize: "Licensed producing agent",
    price: "AED 1,499",
    cadence: "/year",
    featured: true,
    features: [
      "Everything in Associate",
      "Warm client introductions & shared pipeline",
      "Invitations to every major UAE launch & gala",
      "Direct access to developer principal desks",
      "Hiring pathway into JBJ Global",
      "Exclusive JBJ agent books & DLD references",
    ],
  },
  {
    name: "Elite",
    audienceSize: "Senior top-producer",
    price: "AED 2,999",
    cadence: "/year",
    features: [
      "Everything in Professional",
      "First-look on JBJ private mandates",
      "1:1 principal advisor coaching",
      "Personal broker page inside JBJ",
      "Co-marketing with JBJ on flagship launches",
    ],
  },
];

const agencyTiers: Tier[] = [
  {
    name: "Team",
    audienceSize: "Boutique agency · up to 10 agents",
    price: "AED 2,999",
    cadence: "/month",
    features: [
      "Team seats on JBJ inventory",
      "Shared CRM segmentation",
      "Lead routing & performance dashboard",
      "Group broker certification discount",
    ],
  },
  {
    name: "Brokerage",
    audienceSize: "Established agency · up to 50 agents",
    price: "AED 6,999",
    cadence: "/month",
    featured: true,
    features: [
      "Everything in Team",
      "Dedicated agency account manager",
      "Custom agency page inside JBJ",
      "Co-branded launches with developers",
      "Advanced analytics & attribution",
      "Priority hiring pipeline into JBJ Global",
    ],
  },
  {
    name: "Network",
    audienceSize: "Multi-branch group · 50+ agents",
    price: "Custom",
    cadence: "annual",
    features: [
      "Everything in Brokerage",
      "Multi-branch CRM & role permissions",
      "Executive partnership with JBJ Global",
      "Enterprise SLA & onboarding program",
      "Featured on JBJ agency directory",
    ],
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
  { icon: Award, title: "JBJ certification", body: "DLD-aligned coursework and a formal JBJ Global Broker Certificate." },
  { icon: BookOpen, title: "Exclusive agent books", body: "Private JBJ playbooks, DLD reference material, and scripts." },
  { icon: Handshake, title: "Hiring pathway", body: "Top performers get onboarded directly into JBJ Global." },
  { icon: Ticket, title: "Industry events", body: "Invitations to every developer launch, gala, and industry event." },
  { icon: Users, title: "Warm client intros", body: "Qualified investor and buyer leads routed to certified agents." },
  { icon: Trophy, title: "Network access", body: "Direct lines to developer principal desks, mortgage & legal partners." },
];

const investorSignaturePerks = [
  { icon: Gift, label: "Cash-back on qualifying deals" },
  { icon: Home, label: "Fully-furnished unit upgrades" },
  { icon: Plane, label: "Reimbursed inspection trips" },
  { icon: Ticket, label: "Private events & dinners" },
  { icon: Sparkles, label: "Priority daily advisor" },
];

// ── Contrast primitives ─────────────────────────────────────────────────────
const BTN_WHITE_HOVER_EMERALD =
  "group/btn relative overflow-hidden inline-flex items-center gap-2 rounded-md border border-[#0d3a2b]/25 bg-white px-5 text-sm font-bold text-[#0d3a2b] transition " +
  "hover:!bg-[#064E3B] hover:!text-white hover:border-[#064E3B] " +
  "[&_svg]:text-[#0d3a2b] hover:[&_svg]:!text-white " +
  "before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/3 before:w-1/3 before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent before:opacity-0 before:transition before:duration-700 hover:before:opacity-100 hover:before:translate-x-[400%]";

const BTN_EMERALD_SOLID =
  "relative overflow-hidden inline-flex items-center gap-2 rounded-md px-5 text-sm font-bold !text-white [&_*]:!text-white [&_svg]:!text-white [&_svg]:!stroke-white " +
  "bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] hover:brightness-110 transition " +
  "shadow-[0_12px_26px_-14px_rgba(6,78,59,0.85)] " +
  "before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/2 before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent hover:before:translate-x-[300%] before:transition before:duration-[900ms]";

const EMERALD_ICON_TILE =
  "inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] " +
  "[&_svg]:!text-white [&_svg]:!stroke-white";

// ── Property marquee ────────────────────────────────────────────────────────
function PropertyMarquee({ onClick }: { onClick: () => void }) {
  const { data, isLoading } = useHandpickedProjects();

  // Only ship cards that have real pricing AND a real cover image.
  // Broken/placeholder cards get filtered out entirely.
  const projects = (data?.projects ?? [])
    .filter((p: any) => {
      const cover = p.image_url || p.hero_image || p.cover_image || (Array.isArray(p.images) && p.images[0]);
      const priceVal = Number(p.starting_price ?? p.price ?? 0);
      return !!cover && priceVal > 0 && !!(p.name || p.title);
    })
    .slice(0, 10);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#EFE6D6]" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) return null;

  const track = projects.length >= 4 ? [...projects, ...projects] : projects;

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
            p.image_url || p.hero_image || p.cover_image || (Array.isArray(p.images) && p.images[0]);
          const priceVal = Number(p.starting_price ?? p.price ?? 0);
          const price = `AED ${priceVal.toLocaleString()}`;
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
                <span
                  data-surface="dark"
                  className="absolute left-3 top-3 rounded-full bg-[#064E3B]/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] !text-white"
                >
                  Featured
                </span>
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] !text-white/80">
                    {p.location || p.community || "Dubai"}
                  </p>
                  <h3 className="mt-1 line-clamp-2 font-serif text-lg leading-tight !text-white">
                    {p.name || p.title}
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

// ── Tier grid (reusable per audience) ───────────────────────────────────────
function TierGrid({ tiers, onSelect }: { tiers: Tier[]; onSelect: () => void }) {
  return (
    <div className={`grid gap-6 ${tiers.length === 2 ? "md:grid-cols-2" : "lg:grid-cols-3"}`}>
      {tiers.map((tier) => {
        const isEm = !!tier.featured;
        return (
          <article
            key={tier.name}
            {...(isEm ? { "data-surface": "dark" as const } : {})}
            className={
              isEm
                ? "relative flex flex-col rounded-2xl p-8 pt-10 shadow-[0_30px_60px_-32px_rgba(6,78,59,0.55)] ring-1 ring-[#B89555]/50 bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)]"
                : "relative flex flex-col rounded-2xl border border-[#0d3a2b]/15 bg-white p-8 pt-10 shadow-[0_24px_60px_-42px_rgba(13,58,43,0.35)]"
            }
          >
            {isEm && (
              <span
                data-surface="dark"
                className="absolute left-1/2 -top-3 -translate-x-1/2 rounded-full border border-[#B89555] bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] !text-[#F0D78C] shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] whitespace-nowrap"
              >
                <Star className="inline h-3 w-3 mr-1 -mt-0.5 !text-[#F0D78C]" /> Most popular
              </span>
            )}
            <p
              className={`text-[11px] font-bold uppercase tracking-[0.22em] ${isEm ? "!text-[#F0D78C]" : "text-[#064E3B]"}`}
            >
              {tier.audienceSize || "Package"}
            </p>
            <h3 className={`mt-2 font-serif text-3xl ${isEm ? "!text-white" : "text-[#0d3a2b]"}`}>
              {tier.name}
            </h3>
            <div className="mt-5 flex items-end gap-2">
              <span className={`font-serif text-4xl ${isEm ? "!text-white" : "text-[#1A1A1A]"}`}>
                {tier.price}
              </span>
              <span className={`pb-1 text-sm ${isEm ? "!text-white/70" : "text-[#1A1A1A]/62"}`}>
                {tier.cadence}
              </span>
            </div>

            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <CheckCircle2
                    className={`mt-0.5 h-4 w-4 shrink-0 ${isEm ? "!text-[#F0D78C]" : "text-[#064E3B]"}`}
                  />
                  <span className={isEm ? "!text-white/92" : "text-[#1A1A1A]/78"}>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={onSelect}
              data-surface="dark"
              className={`${BTN_EMERALD_SOLID} mt-8 h-12 w-full justify-center uppercase tracking-[0.14em]`}
            >
              Choose {tier.name} <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        );
      })}
    </div>
  );
}

function PackageStrap({
  id,
  eyebrow,
  title,
  description,
  tiers,
  onSelect,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  tiers: Tier[];
  onSelect: () => void;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className="bg-[#FDFBF7] px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#064E3B]">{eyebrow}</span>
          <h2 className="mt-3 font-serif text-4xl text-[#0d3a2b] sm:text-5xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[#1A1A1A]/72">{description}</p>
        </div>
        <TierGrid tiers={tiers} onSelect={onSelect} />
        {children}
      </div>
    </section>
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
      <header className="sticky top-0 z-40 border-b border-[#0d3a2b]/10 bg-[#FDFBF7]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <a href="/access" className="flex items-center gap-2.5 min-w-0" aria-label="JBJ Global Real Estate">
            <img
              src={new URL("@/assets/jbj-monogram-nobuffer.png", import.meta.url).href}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain shrink-0"
            />
            <span className="font-serif text-[16px] sm:text-[18px] text-[#0d3a2b] whitespace-nowrap truncate">
              JBJ Global Real Estate
            </span>
          </a>

          <nav className="hidden items-center gap-0.5 lg:flex shrink-0">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1A1A1A]/70 transition hover:bg-[#EFE6D6] hover:text-[#064E3B]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLoginOpen(true)}
              className="h-10 whitespace-nowrap rounded-md border border-[#0d3a2b]/25 bg-transparent px-4 text-sm font-semibold text-[#0d3a2b] transition hover:bg-[#EFE6D6]"
            >
              Log in
            </button>
            <button
              onClick={openSignup}
              data-surface="dark"
              className={`${BTN_EMERALD_SOLID} h-10 whitespace-nowrap`}
            >
              Sign up <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>


      <main>
        {/* HERO — Dubai video is the star. Logo + name only. */}
        <section
          data-surface="dark"
          className="relative min-h-[calc(100vh-76px)] overflow-hidden bg-black"
        >
          <div className="absolute inset-0">
            <VideoBackground src={HERO_VIDEO_URL} poster={heroFallbackDubai} eager />
          </div>
          {/* Minimal wash — keep the video readable */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0.15)_45%,rgba(0,0,0,0.75)_100%)]" />

          <div className="relative mx-auto flex min-h-[calc(100vh-76px)] max-w-7xl flex-col items-center justify-center px-5 text-center sm:px-8 lg:px-12">
            <img
              data-no-fallback
              src={new URL("@/assets/jbj-monogram-light-transparent.png", import.meta.url).href}
              alt="JBJ"
              className="h-[220px] w-[220px] object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)] sm:h-[280px] sm:w-[280px] lg:h-[340px] lg:w-[340px]"
            />
            <h1 className="mt-8 font-serif text-4xl leading-[1.05] !text-white sm:text-6xl lg:text-[80px]">
              JBJ Global Real Estate
            </h1>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.42em] !text-white/85 sm:text-[13px]">
              Dubai · United Arab Emirates
            </p>
          </div>

          {/* Scroll cue */}
          <a
            href="#intro"
            className="absolute inset-x-0 bottom-8 mx-auto flex w-fit items-center gap-2 text-[10px] font-bold uppercase tracking-[0.32em] !text-white/70 hover:!text-white"
          >
            Scroll <ArrowRight className="h-3 w-3 rotate-90" />
          </a>
        </section>

        {/* Intro band — copy that used to overlay the video, now clean below it */}
        <section id="intro" className="bg-[#F7F2EA] px-5 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.1fr,1fr] md:items-end">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#064E3B]">
                A private property platform, built around you
              </span>
              <h2 className="mt-3 font-serif text-4xl leading-[1.05] text-[#0d3a2b] sm:text-5xl">
                Featured launches, off-plan releases, guides & investor packages — one curated home.
              </h2>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={openSignup} className={`${BTN_EMERALD_SOLID} h-12 uppercase tracking-[0.14em]`}>
                  Create your account <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => setLeadOpen(true)} className={`${BTN_WHITE_HOVER_EMERALD} h-12 uppercase tracking-[0.14em]`}>
                  Talk to an advisor
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-6 border-l border-[#0d3a2b]/15 pl-8">
              {[
                { icon: Building2, v: "600+", l: "developers" },
                { icon: Headphones, v: "24/7", l: "advisor desk" },
                { icon: ShieldCheck, v: "AED", l: "backed reporting" },
                { icon: FileCheck2, v: "100%", l: "verified inventory" },
              ].map(({ icon: Icon, v, l }) => (
                <div key={l} className="flex items-start gap-3">
                  <span data-surface="dark" className={`${EMERALD_ICON_TILE} h-11 w-11 shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-serif text-3xl text-[#0d3a2b] leading-none">{v}</p>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1A1A1A]/60">{l}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED PROPERTIES */}
        <section id="featured" className="bg-[#F7F2EA] px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#064E3B]">
                  Latest launches & featured
                </span>
                <h2 className="mt-3 font-serif text-4xl text-[#0d3a2b] sm:text-5xl">
                  Live inventory from Dubai's top developers.
                </h2>
                <p className="mt-3 max-w-2xl text-[#1A1A1A]/70">
                  Real projects — off-plan releases, ready inventory and premium launches. Create an account to unlock pricing, plans and full detail.
                </p>
              </div>
              <button onClick={openSignup} className={`${BTN_EMERALD_SOLID} h-11`}>
                Unlock the catalogue <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <PropertyMarquee onClick={openSignup} />
          </div>
        </section>

        {/* NEW LAUNCH pillars */}
        <section
          id="new-launch"
          data-surface="dark"
          className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12 bg-[#02100a]"
        >
          {/* Background: latest project photo (Dubai skyline fallback) */}
          <img
            src={heroFallbackDubai}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-[0.22]"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,22,16,0.88)_0%,rgba(2,16,10,0.94)_60%,rgba(0,0,0,0.98)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] !text-white/80">
                New launches on JBJ
              </span>
              <h2 className="mt-3 font-serif text-4xl !text-white sm:text-5xl">
                Every launch, structured the same way.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl !text-white/80">
                Inventory, payment plans, verified access and private documents — the four blocks behind every project.
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
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 [&_svg]:!text-white [&_svg]:!stroke-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-serif text-2xl !text-white">{p.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed !text-white/80">{p.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* GUIDES — LOCKED per owner */}
        <section id="guides" className="bg-[#F7F2EA] py-16">
          <div className="mx-auto mb-8 flex max-w-7xl flex-col justify-between gap-5 px-5 sm:px-8 md:flex-row md:items-end lg:px-12">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#064E3B]">
                Guides & reports
              </span>
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

        {/* PACKAGES — one strap per audience */}

        {/* INVESTOR */}
        <PackageStrap
          id="investor-packages"
          eyebrow="For Investors"
          title="Investor packages"
          description="Three tiers, from single-property investors to family offices. Pick the level of support that matches your portfolio."
          tiers={investorTiers}
          onSelect={openSignup}
        >
          {/* Signature perks — included with the SIGNATURE tier */}
          <div className="mt-16">
            <div className="mb-8 text-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#064E3B]">
                Included with the Signature tier
              </span>
              <h3 className="mt-2 font-serif text-3xl text-[#0d3a2b] sm:text-4xl">
                Signature perks
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm text-[#1A1A1A]/70">
                Automatically unlocked on the Signature package (also included with Private Office).
              </p>
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {investorSignaturePerks.map((perk) => {
                const Icon = perk.icon;
                return (
                  <div
                    key={perk.label}
                    className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-[#0d3a2b]/12 bg-white p-4 text-center shadow-[0_18px_40px_-30px_rgba(6,78,59,0.35)] transition hover:-translate-y-1 hover:border-[#064E3B]/40"
                  >
                    <span data-surface="dark" className={`${EMERALD_ICON_TILE} h-14 w-14 rounded-xl`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-xs font-semibold leading-snug text-[#0d3a2b]">{perk.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </PackageStrap>

        {/* DEVELOPER */}
        <div className="bg-[#F7F2EA]">
          <PackageStrap
            id="developer-packages"
            eyebrow="For Developers"
            title="Developer programs"
            description="From boutique launches to master developers — distribution, verified profile, and JBJ broker reach at every scale."
            tiers={developerTiers}
            onSelect={openSignup}
          />
        </div>

        {/* BROKER */}
        <PackageStrap
          id="broker-packages"
          eyebrow="For Brokers"
          title="Broker Academy & enrollment"
          description="Yearly enrollment for licensed and aspiring UAE agents. Mentorship, exclusive materials, and a direct pathway into JBJ Global."
          tiers={brokerTiers}
          onSelect={openSignup}
        />

        {/* AGENCY */}
        <div className="bg-[#F7F2EA]">
          <PackageStrap
            id="agency-packages"
            eyebrow="For Agencies"
            title="Agency packages"
            description="Team seats, CRM segmentation and lead systems for boutique and established Dubai agencies."
            tiers={agencyTiers}
            onSelect={openSignup}
          />
        </div>

        {/* BROKER CERTIFICATION deep-dive */}
        <section
          id="brokers"
          data-surface="dark"
          className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12"
          style={{ backgroundImage: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] !text-white/80">
                Broker Academy benefits
              </span>
              <h2 className="mt-3 font-serif text-4xl !text-white sm:text-5xl">Become a JBJ-certified broker.</h2>
              <p className="mx-auto mt-4 max-w-2xl !text-white/85">
                What every JBJ-certified agent unlocks — regardless of tier.
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
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 [&_svg]:!text-white [&_svg]:!stroke-white">
                      <Icon className="h-5 w-5" />
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
                className={`${BTN_WHITE_HOVER_EMERALD} h-12 uppercase tracking-[0.14em]`}
              >
                Enroll in the academy <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLeadOpen(true)}
                className="inline-flex h-12 items-center gap-2 rounded-md border border-white/60 bg-transparent px-6 text-sm font-bold uppercase tracking-[0.14em] !text-white transition hover:bg-white/[0.14]"
              >
                Speak to the broker desk
              </button>
            </div>
          </div>
        </section>

        {/* CERTIFICATE preview — 3D-style JBJ broker certificate */}
        <section className="bg-[#F7F2EA] px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr,1.1fr]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#064E3B]">
                JBJ Global Broker Certificate
              </span>
              <h2 className="mt-3 font-serif text-4xl leading-[1.05] text-[#0d3a2b] sm:text-5xl">
                A signed, DLD-aligned certificate — issued in your name.
              </h2>
              <p className="mt-4 max-w-xl text-[#1A1A1A]/72">
                Every graduate of the Broker Academy receives a personally issued JBJ Global certificate,
                recognised across our developer network and printed on premium paper for your office wall.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Personalised & serial-numbered",
                  "Signed by the JBJ Global principal",
                  "Recognised by developer partners",
                  "Digital + printed copy included",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[#1A1A1A]/82">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#064E3B]" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <button onClick={openSignup} className={`${BTN_EMERALD_SOLID} h-12 uppercase tracking-[0.14em]`}>
                  Enroll & earn your certificate <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 3D certificate mockup */}
            <div className="relative">
              <div
                className="relative mx-auto max-w-[520px] rounded-[18px] bg-gradient-to-br from-[#FDFBF7] via-[#F5EFE1] to-[#EFE6D6] p-8 shadow-[0_60px_120px_-40px_rgba(6,78,59,0.55),0_20px_50px_-20px_rgba(0,0,0,0.35)] ring-1 ring-[#B89555]/40"
                style={{ transform: "perspective(1400px) rotateY(-12deg) rotateX(4deg)" }}
              >
                <div className="rounded-[10px] border-2 border-[#B89555]/50 p-6 text-center">
                  <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#B89555] bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)]">
                    <img
                      data-no-fallback
                      src={new URL("@/assets/jbj-monogram-light-transparent.png", import.meta.url).href}
                      alt=""
                      className="h-9 w-9 object-contain"
                    />
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.36em] text-[#B89555]">
                    JBJ Global Real Estate
                  </p>
                  <h3 className="mt-2 font-serif text-2xl text-[#0d3a2b]">Certificate of Completion</h3>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-[#1A1A1A]/55">
                    This is presented to
                  </p>
                  <p className="mt-2 font-serif text-3xl text-[#0d3a2b]">Your Name Here</p>
                  <p className="mx-auto mt-3 max-w-xs text-[11px] leading-relaxed text-[#1A1A1A]/70">
                    for successfully completing the JBJ Global Broker Academy in accordance with
                    DLD-aligned professional standards.
                  </p>
                  <div className="mt-6 flex items-end justify-between gap-4 text-left">
                    <div>
                      <div className="h-px w-32 bg-[#1A1A1A]/60" />
                      <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-[#1A1A1A]/55">Principal</p>
                    </div>
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#B89555] text-[#B89555]">
                      <Award className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <div className="ml-auto h-px w-32 bg-[#1A1A1A]/60" />
                      <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-[#1A1A1A]/55">Date</p>
                    </div>
                  </div>
                </div>
              </div>
              <div
                aria-hidden
                className="absolute -inset-8 -z-10 rounded-[32px] bg-[radial-gradient(ellipse_at_center,rgba(184,149,85,0.28),transparent_70%)] blur-2xl"
              />
            </div>
          </div>
        </section>

        {/* Closing CTA — same animation/pattern as homepage "Ready to Get Started" */}
        <div className="bg-[#F7F2EA]">
          <CombinedContactNewsletter
            title="Ready to step inside JBJ?"
            subtitle="Create an account to unlock featured properties, launches, guides and packages — or speak with an advisor first."
            id="access-ready"
          />
        </div>

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

      {/* Premium floating advisor button — headset avatar + live dot + phone */}
      <button
        onClick={() => setLeadOpen(true)}
        data-surface="dark"
        aria-label="Speak to an advisor"
        className="group fixed bottom-6 right-6 z-30 inline-flex items-center gap-3 rounded-full pl-2 pr-5 py-2 !text-white shadow-[0_20px_44px_-18px_rgba(6,78,59,0.9)] ring-1 ring-white/40 bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] transition hover:brightness-110 hover:-translate-y-0.5"
      >
        <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/30 [&_svg]:!text-white">
          <Headphones className="h-5 w-5" />
          {/* live dot — white only */}
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white ring-2 ring-[#064E3B]" />
          </span>
        </span>
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[9px] font-bold uppercase tracking-[0.28em] !text-white/85">Live · 24/7</span>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold !text-white">
            <PhoneCall className="h-3.5 w-3.5 !text-white" /> Speak to an advisor
          </span>
        </span>
      </button>

      <LeadFormDialog open={leadOpen} onOpenChange={setLeadOpen} sourcePage="/access" />
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} />
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}
