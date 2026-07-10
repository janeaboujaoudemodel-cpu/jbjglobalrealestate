import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { JJLogoImage } from "@/components/JJLogoImage";
import LeadFormDialog from "@/components/gate/LeadFormDialog";
import PaymentRequestDialog, { type PaymentRequestContext } from "@/components/gate/PaymentRequestDialog";
import SignupDialog from "@/components/gate/SignupDialog";
import LoginDialog from "@/components/gate/LoginDialog";
import VideoBackground from "@/components/VideoBackground";
import heroFallbackDubai from "@/assets/hero-fallback-dubai.jpg";
import { BookCarousel } from "@/components/books/BookCarousel";
import { INVESTOR_BOOKS } from "@/data/bookCollections";
import { useSurfaceFeaturedProjects } from "@/hooks/useGateFeaturedProjects";
import type { BookData } from "@/types/books";

import {
  ArrowRight,
  Award,
  CheckCircle2,
  GraduationCap,
  Headphones,
  Home,
  KeyRound,
  PhoneCall,
  Sparkles,
  TrendingUp,
  Users,
  Gift,
  Plane,
  Handshake,
  Trophy,
  Ticket,
  ShieldCheck,
  FileCheck2,
  Building2,
  Star,
  Compass,
  Landmark,
  BarChart3,
  Briefcase,
  Globe2,
  Wallet,
  Coins,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Scale,
  BookOpenCheck,
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

const brokerBenefits = [
  { icon: Award, title: "Recognized by developer partners", body: "A polished credential designed for launch rooms, agency desks and client meetings." },
  { icon: FileCheck2, title: "Digital and printed copy included", body: "Issued as a profile-ready digital file with a premium printed certificate option." },
  { icon: Trophy, title: "Personalized and serial numbered", body: "Your name and certificate number are placed cleanly into the final document." },
];

const brokerServices = [
  { icon: Building2, title: "Off-plan launches", body: "Developer inventory, allocation discipline and launch-room readiness." },
  { icon: TrendingUp, title: "Investor advisory", body: "Portfolio language, yield framing and market positioning for serious buyers." },
  { icon: Handshake, title: "Developer partnerships", body: "Professional conduct and follow-up standards for partner networks." },
  { icon: ShieldCheck, title: "Document discipline", body: "Clean presentation of payment plans, brochures and client-facing material." },
];

import svcOffPlan from "@/assets/menu-luxury-penthouse.jpg";
import svcAdvisory from "@/assets/luxury-villa-hero.jpeg";
import svcDeveloper from "@/assets/menu-projects-hero.jpg";
import svcHandover from "@/assets/services/property-management-bg.jpg";
import svcGlobal from "@/assets/dubai-plane-view.png";
import svcConcierge from "@/assets/concierge-hero.jpeg";
import svcWallet from "@/assets/svc-portfolio-wallet.jpg";
import svcBuySell from "@/assets/services/buy-property-bg.jpg";
import svcLeasing from "@/assets/services/rent-property-bg.jpg";
import svcHoliday from "@/assets/services/list-rental-bg.jpg";
import svcResale from "@/assets/services/sell-property-bg.jpg";
import svcMortgage from "@/assets/services/mortgage-bg.jpg";
import svcGoldenVisa from "@/assets/services/golden-visa-bg.jpg";
import svcCompanySetup from "@/assets/services/partner-introduction-bg.jpg";
import svcRelocation from "@/assets/services/passport-visa-bg.jpg";
import svcInsurance from "@/assets/services/general-inquiries-bg.jpg";
import svcBizDev from "@/assets/menu-corporate-office.jpg";
import svcLifestyle from "@/assets/founder-jet-interior.jpeg";
import svcMediaProduction from "@/assets/svc-media-production.jpg";

type JbjService = { icon: React.ElementType; title: string; body: string; image: string };
type JbjServicePage = { key: string; label: string; kicker: string; heading: string; blurb: string; items: JbjService[] };

const jbjServicePages: JbjServicePage[] = [
  {
    key: "advisory",
    label: "Real Estate Services",
    kicker: "Our Practice · 01",
    heading: "Real estate services, handled properly.",
    blurb: "A full real estate practice for buying, selling, leasing, listing, portfolio growth and cross-market investment decisions.",
    items: [
      { icon: Building2, title: "Buy property advisory", body: "Private-client guidance for buying ready homes, off-plan launches and prime addresses with disciplined due diligence and negotiation support.", image: svcBuySell },
      { icon: Handshake, title: "Sell & list representation", body: "Premium owner representation for preparing, pricing and listing properties to reach qualified local and international buyers.", image: svcResale },
      { icon: Home, title: "Rent & leasing advisory", body: "Landlord and tenant placement across annual leases, furnished homes and premium long-stay requirements, with clean listing preparation.", image: svcLeasing },
      { icon: Wallet, title: "Investment portfolio wallet", body: "A private portfolio layer for serious investors — acquisition planning, reporting, rental performance and next-move strategy in one place.", image: svcWallet },
      { icon: TrendingUp, title: "Exit & resale strategy", body: "Pricing, positioning and buyer qualification for owners preparing a clean secondary-market sale.", image: svcResale },
      { icon: Globe2, title: "Cross-market investment strategy", body: "Advisory for clients comparing Dubai with selected international real estate opportunities, including currency exposure, holding structure, exit timing and portfolio balance.", image: svcGlobal },
    ],
  },
  {
    key: "ownership",
    label: "Investment Support",
    kicker: "Our Practice · 02",
    heading: "Investment support, end to end.",
    blurb: "Financial, legal and operational support for clients who want decisions prepared before they commit.",
    items: [
      { icon: BarChart3, title: "Investment strategy", body: "Yield framing, hold-period planning, comparable analysis and risk notes prepared for serious investors.", image: svcAdvisory },
      { icon: Wallet, title: "UHNW portfolio wallet", body: "A private investment wallet for ultra-high-net-worth clients — allocation, reporting and off-market access under one desk.", image: svcWallet },
      { icon: Coins, title: "Mortgage & financing", body: "Access to lender panels, pre-approvals and ownership structuring for residents, non-residents and companies.", image: svcMortgage },
      { icon: Scale, title: "Legal coordination", body: "Conveyancing, document flow, contract review coordination and settlement support through trusted specialists.", image: svcInsurance },
      { icon: Ticket, title: "Holiday-home operation", body: "Serviced short-stay management with pricing, listing, guest experience and owner-level performance reporting.", image: svcHoliday },
      { icon: BookOpenCheck, title: "Investment courses", body: "Training sessions for investors and teams covering Dubai market basics, launch discipline, payment plans and portfolio thinking.", image: svcDeveloper },
    ],
  },
  {
    key: "corporate",
    label: "Corporate & Lifestyle",
    kicker: "Our Practice · 03",
    heading: "Corporate, residency & lifestyle.",
    blurb: "The full private-office spine — residency, entity, insurance and lifestyle logistics.",
    items: [
      { icon: FileCheck2, title: "Golden Visa & residency", body: "10-year Golden Visa, investor and property-linked residency — end-to-end filing and family sponsorship.", image: svcGoldenVisa },
      { icon: Scale, title: "Legal firm & coordination", body: "In-house legal firm coordination — conveyancing, contract review, corporate structuring, dispute avoidance and settlement support through licensed counsel.", image: svcInsurance },
      { icon: Briefcase, title: "Company & foundation setup", body: "Mainland, free-zone, offshore and foundation incorporation — licensing, banking introductions and governance from day one.", image: svcCompanySetup },
      { icon: TrendingUp, title: "Business development", body: "Introductions, partnerships, growth strategy and investor-facing preparation for operators expanding into the UAE.", image: svcBizDev },
      { icon: Users, title: "Relocation & PRO services", body: "Family relocation, schooling, PRO paperwork, Emirates ID, medicals and government liaison.", image: svcRelocation },
      { icon: ShieldCheck, title: "Insurance advisory", body: "Property, life, professional and health cover — arranged through vetted regional insurers.", image: svcInsurance },
      { icon: Sparkles, title: "Concierge & lifestyle", body: "Private jets, yachts, chauffeured cars, dining and events — the day-to-day discretion behind the address.", image: svcLifestyle },
    ],
  },
  {
    key: "media",
    label: "JBJ Media · Branding & Digital",
    kicker: "Our Practice · 04",
    heading: "Branding, marketing & technology — by JBJ Media.",
    blurb: "Our sister studio delivers branding, marketing and technology for founders, developers and corporate clients — from identity to full software builds.",
    items: [
      { icon: Sparkles, title: "Branding & identity", body: "Naming, logo systems, guidelines and brand books — built to hold up next to institutional peers.", image: svcCompanySetup },
      { icon: TrendingUp, title: "Marketing & campaigns", body: "Performance and brand campaigns across search, social and offline — planned, produced and reported end-to-end.", image: svcBizDev },
      { icon: Globe2, title: "Web development", body: "Corporate sites, landing pages and marketplaces built on modern stacks with SEO, analytics and CMS handover.", image: svcAdvisory },
      { icon: Wrench, title: "App & software development", body: "iOS, Android and web apps — CRM, portals, dashboards and custom software delivered by a senior product team.", image: svcDeveloper },
      { icon: BookOpenCheck, title: "Content & media production", body: "Photography, film, drone, editorial and social content — everything a premium brand needs to publish consistently.", image: svcMediaProduction },
      { icon: Handshake, title: "Business development for brands", body: "Go-to-market strategy, partnerships and launch support for founders scaling a new venture from the UAE.", image: svcBizDev },
    ],
  },
];

const investorSignaturePerks = [
  { icon: Gift, label: "Cash-back on qualifying deals" },
  { icon: Home, label: "Fully-furnished unit upgrades" },
  { icon: Plane, label: "Reimbursed inspection trips" },
  { icon: Ticket, label: "Private events & dinners" },
  { icon: Sparkles, label: "Priority daily advisor" },
];

// ── Contrast primitives ─────────────────────────────────────────────────────
// NOTE: buttons use BOTH an inline style AND a data-jbj-access-cta attribute
// so the scoped stylesheet at the top of the page (which uses
// -webkit-text-fill-color !important) can defeat any global rule that would
// otherwise flip ink to black-on-emerald or white-on-white.
const BTN_WHITE_HOVER_EMERALD =
  "group/btn relative overflow-hidden inline-flex items-center gap-2 rounded-md border border-[#0d3a2b]/30 bg-white px-5 text-sm font-bold transition " +
  "hover:bg-[#064E3B] hover:border-[#064E3B] " +
  "before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/3 before:w-1/3 before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent before:opacity-0 before:transition before:duration-700 hover:before:opacity-100 hover:before:translate-x-[400%]";

const BTN_EMERALD_SOLID =
  "relative overflow-hidden inline-flex items-center gap-2 rounded-md px-5 text-sm font-bold transition " +
  "bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] hover:bg-[linear-gradient(135deg,#075c46_0%,#053825_55%,#000_100%)] " +
  "shadow-[0_12px_26px_-14px_rgba(6,78,59,0.85)] " +
  "before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/2 before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent hover:before:translate-x-[300%] before:transition before:duration-[900ms]";

// Inline styles that include -webkit-text-fill-color so global !important rules
// that target that property cannot override us. React style keys are camelCase.
const emeraldInkStyle: React.CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
};
const darkInkStyle: React.CSSProperties = {
  color: "#0d3a2b",
  WebkitTextFillColor: "#0d3a2b",
};

const EMERALD_ICON_TILE =
  "inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] " +
  "[&_svg]:!text-white [&_svg]:!stroke-white";

// Page-scoped stylesheet — forces white ink on emerald CTAs and dark ink on
// white CTAs no matter what a global data-surface / contrast-guard rule says.
const ACCESS_CTA_STYLE = `
html body #root [data-jbj-cta-emerald],
html body #root [data-jbj-cta-emerald] * {
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
  text-shadow: none !important;
  opacity: 1 !important;
}
html body #root [data-jbj-cta-emerald] svg,
html body #root [data-jbj-cta-emerald] svg * {
  color: #FFFFFF !important;
  stroke: #FFFFFF !important;
  fill: none !important;
}
html body #root [data-jbj-cta-white] {
  color: #0d3a2b !important;
  -webkit-text-fill-color: #0d3a2b !important;
  background-color: #FFFFFF !important;
}
html body #root [data-jbj-cta-white] * {
  color: #0d3a2b !important;
  -webkit-text-fill-color: #0d3a2b !important;
  background-color: transparent !important;
  opacity: 1 !important;
}
html body #root [data-jbj-cta-white] svg,
html body #root [data-jbj-cta-white] svg * {
  color: #0d3a2b !important;
  stroke: #0d3a2b !important;
  fill: none !important;
}
html body #root [data-jbj-cta-white]:hover {
  background-color: #064E3B !important;
}
html body #root [data-jbj-cta-white]:hover,
html body #root [data-jbj-cta-white]:hover * {
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
}
html body #root [data-jbj-cta-white]:hover svg,
html body #root [data-jbj-cta-white]:hover svg * {
  color: #FFFFFF !important;
  stroke: #FFFFFF !important;
}
html body #root [data-jbj-access-gold-badge],
html body #root [data-jbj-access-gold-badge] * {
  color: #C9A84C !important;
  -webkit-text-fill-color: #C9A84C !important;
}
html body #root [data-service-card] [data-service-arrow] {
  background: #FFFFFF !important;
  border-color: rgba(26,26,26,0.30) !important;
}
html body #root [data-service-card] [data-service-arrow] svg,
html body #root [data-service-card] [data-service-arrow] svg * {
  color: #1A1A1A !important;
  stroke: #1A1A1A !important;
  fill: none !important;
}
html body #root [data-service-card]:hover [data-service-arrow] {
  background: linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%) !important;
  border-color: #0d3a2b !important;
}
html body #root [data-service-card]:hover [data-service-arrow] svg,
html body #root [data-service-card]:hover [data-service-arrow] svg * {
  color: #FFFFFF !important;
  stroke: #FFFFFF !important;
  fill: none !important;
}
html body #root [data-service-page-dot] {
  width: 38px !important;
  height: 38px !important;
  min-width: 38px !important;
  min-height: 38px !important;
  max-width: 38px !important;
  max-height: 38px !important;
  padding: 0 !important;
  border-radius: 9999px !important;
  aspect-ratio: 1 / 1 !important;
  line-height: 1 !important;
}
html body #root [data-service-page-dot] span {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
  font-size: 18px !important;
  line-height: 1 !important;
  font-weight: 700 !important;
  color: inherit !important;
  -webkit-text-fill-color: currentColor !important;
}
html body #root [data-service-page-dot][data-active="true"],
html body #root [data-service-page-dot][data-active="true"] * {
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
}
.certificate-shimmer-frame {
  border: 2px solid transparent;
  border-radius: 6px;
  isolation: isolate;
  background:
    linear-gradient(135deg,#FDFBF7 0%,#F5EFE1 45%,#EFE6D6 100%) padding-box,
    linear-gradient(135deg,#FBEAB4 0%,#C9A84C 25%,#8B6F3A 50%,#E8C877 75%,#A8842E 100%) border-box;
  box-shadow:
    inset 0 0 0 1px rgba(255,240,200,0.55),
    inset 0 0 30px rgba(184,149,85,0.14),
    0 0 0 0 rgba(201,168,79,0.0),
    0 60px 120px -40px rgba(6,78,59,0.55),
    0 20px 50px -20px rgba(0,0,0,0.4);
  animation: certificate-glow 5.5s ease-in-out infinite;
  position: relative;
}
.certificate-shimmer-frame::after {
  content: "";
  position: absolute;
  inset: 8px;
  pointer-events: none;
  border-radius: 3px;
  border: 1px solid rgba(184,149,85,0.55);
  box-shadow: inset 0 0 0 1px rgba(255,240,200,0.35);
}
.certificate-shimmer-frame::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background: linear-gradient(115deg, transparent 28%, rgba(251,234,180,0.35) 44%, rgba(232,200,119,0.6) 50%, rgba(251,234,180,0.35) 56%, transparent 72%);
  background-size: 260% 100%;
  background-position: 200% 0;
  mix-blend-mode: screen;
  animation: certificate-metallic-sweep 5s ease-in-out infinite;
}
.username-shimmer {
  color: #0d3a2b !important;
  -webkit-text-fill-color: #0d3a2b !important;
  animation: username-pulse 4.8s ease-in-out infinite;
}
[data-broker-certificate-frame] .seal-outline svg circle[data-ring="1"] {
  stroke: url(#sealGold) !important;
  fill: none !important;
}
html body #root [data-broker-certificate-frame] .seal-outline svg circle[data-ring="1"] {
  stroke: url(#sealGold) !important;
  fill: none !important;
}
@keyframes certificate-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,79,0.0), 0 60px 120px -40px rgba(6,78,59,0.55), 0 20px 50px -20px rgba(0,0,0,0.35); }
  50% { box-shadow: 0 0 26px 2px rgba(201,168,79,0.35), 0 60px 120px -40px rgba(6,78,59,0.55), 0 20px 50px -20px rgba(0,0,0,0.35); }
}
@keyframes certificate-metallic-sweep {
  0% { background-position: 200% 0; }
  55%, 100% { background-position: -100% 0; }
}
@keyframes username-pulse {
  0%, 100% { text-shadow: 0 0 0 rgba(201,168,79,0); opacity: 1; }
  50% { text-shadow: 0 0 14px rgba(201,168,79,0.45); opacity: 0.94; }
}
`;


// ── Property marquee — REAL projects only, drag-scrollable, photo-required ──
function PropertyMarquee({ onClick, theme = "light", limit = 8 }: { onClick: () => void; theme?: "light" | "dark"; limit?: number }) {
  const { data: gateData, isLoading } = useSurfaceFeaturedProjects("gate");
  const isDark = theme === "dark";
  const [failedImageIds, setFailedImageIds] = React.useState<Set<string>>(() => new Set());

  const pickCover = (p: any): string | null => {
    const raw =
      p.image_url || p.hero_image || p.cover_image || p.cover_image_url || p.card_image_url ||
      (Array.isArray(p.images) && p.images.find((v: any) => typeof v === "string" && v && !v.startsWith("data:")));
    const url = typeof raw === "string" ? raw.trim() : "";
    if (!url) return null;
    if (url.startsWith("data:")) return null;
    if (url.length > 900) return null;
    if (!/^(https?:\/\/|\/)/i.test(url)) return null;
    return url;
  };

  const isReadyProject = (p: any) => {
    const text = [p.sale_status, p.construction_status, p.status, p.handover_date].map((v) => String(v || "").toLowerCase()).join(" ");
    if (/ready|complete|completed|delivered|handover/.test(text) && !/off[ -]?plan|under construction|new launch/.test(text)) return true;
    const ts = p.handover_date ? Date.parse(p.handover_date) : NaN;
    return Number.isFinite(ts) && ts < Date.now();
  };
  const isOffPlanProject = (p: any) => {
    const text = [p.sale_status, p.construction_status, p.status].map((v) => String(v || "").toLowerCase()).join(" ");
    if (/off[ -]?plan|under construction|new launch|launch/.test(text)) return true;
    return !isReadyProject(p);
  };
  const completionText = (p: any) => {
    if (isReadyProject(p)) return "Ready";
    const raw = String(p.handover_date || "").trim();
    if (!raw || /^ready$/i.test(raw)) return raw ? "Ready" : null;
    return `Completion ${raw}`;
  };

  const qualifiedProjects = (gateData ?? [])
    .map((p: any) => ({ ...p, __cover: pickCover(p) }))
    .filter((p: any) => !!p.__cover && !!(p.name || p.title) && !failedImageIds.has(String(p.id)))
    .sort((a: any, b: any) => Number(!isOffPlanProject(a)) - Number(!isOffPlanProject(b)) || Number(isReadyProject(a)) - Number(isReadyProject(b)));

  const offPlanProjects = qualifiedProjects.filter(isOffPlanProject);
  const projects = (offPlanProjects.length >= limit ? offPlanProjects : qualifiedProjects).slice(0, limit);

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const resumeTimerRef = React.useRef<number | null>(null);
  const stateRef = React.useRef({
    dragging: false,
    paused: false,
    startX: 0,
    startScroll: 0,
    lastTs: 0,
  });

  const pauseBriefly = React.useCallback(() => {
    stateRef.current.paused = true;
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      stateRef.current.paused = false;
    }, 2600);
  }, []);

  React.useEffect(() => () => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
  }, []);

  // Auto-scroll loop (pauses on hover, drag, or reduced motion)
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el || projects.length < 2) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    let raf = 0;
    const SPEED = 34; // px/sec

    const step = (ts: number) => {
      const s = stateRef.current;
      if (!s.lastTs) s.lastTs = ts;
      const dt = (ts - s.lastTs) / 1000;
      s.lastTs = ts;
      if (!s.paused && !s.dragging) {
        el.scrollLeft += SPEED * dt;
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [projects.length]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Do NOT pause on simple taps — only on real drags. This keeps the mobile
    // carousel visibly auto-scrolling even when users tap a card.
    stateRef.current.dragging = false;
    stateRef.current.startX = e.clientX;
    stateRef.current.startScroll = el.scrollLeft;
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const s = stateRef.current;
    if (!el) return;
    const dx = e.clientX - s.startX;
    // Promote to a drag only after 6px of horizontal movement.
    if (!s.dragging && Math.abs(dx) > 6) {
      s.dragging = true;
      s.paused = true;
      try { el.setPointerCapture(e.pointerId); } catch {}
      el.style.cursor = "grabbing";
    }
    if (s.dragging) el.scrollLeft = s.startScroll - dx;
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    const wasDragging = stateRef.current.dragging;
    stateRef.current.dragging = false;
    try { el.releasePointerCapture(e.pointerId); } catch {}
    el.style.cursor = "grab";
    if (wasDragging) pauseBriefly();
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    pauseBriefly();
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta !== 0) el.scrollLeft += delta;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading real projects">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`aspect-[4/5] animate-pulse rounded-2xl ${isDark ? "bg-white/10" : "bg-[#EFE6D6]"}`} />
        ))}
      </div>
    );
  }

  if (projects.length === 0) return null;

  const track = projects.length >= 3 ? [...projects, ...projects] : projects;

  return (
    <div
      className="relative w-full min-w-0"
      onMouseEnter={() => { stateRef.current.paused = true; }}
      onMouseLeave={() => { stateRef.current.paused = false; }}
      aria-label="Live property listings carousel"
    >
      <div className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r ${isDark ? "from-[#02100a]" : "from-[#FDFBF7]"} to-transparent`} />
      <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l ${isDark ? "from-[#02100a]" : "from-[#FDFBF7]"} to-transparent`} />
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={(e) => { if (stateRef.current.dragging) endDrag(e); }}
        onWheel={onWheel}
        data-property-scroller
        className="flex w-full gap-7 overflow-x-auto overflow-y-hidden px-4 pb-7 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-7"
        style={{ cursor: "grab", touchAction: "pan-x pan-y", scrollBehavior: "auto", WebkitOverflowScrolling: "touch" }}
      >
        {track.map((p: any, idx) => {
          const cover = p.__cover;
          const priceVal = Number(p.starting_price ?? p.price_from ?? p.price ?? 0);
          const price = Number.isFinite(priceVal) && priceVal > 0 ? `AED ${priceVal.toLocaleString()}` : "Price on request";
          const bedroomText = (() => {
            const min = Number(p.bedrooms_min);
            const max = Number(p.bedrooms_max);
            if (!Number.isFinite(min) && !Number.isFinite(max)) return null;
            const label = (value: number) => (value <= 0 ? "Studio" : `${value} BR`);
            if (Number.isFinite(min) && Number.isFinite(max) && min !== max) return `${label(min)} – ${label(max)}`;
            return label(Number.isFinite(min) ? min : max);
          })();
          const place = [p.area_name || p.community || p.location, p.emirate].filter(Boolean).join(" · ") || "UAE";
          const statusLabel = isReadyProject(p) ? "Ready" : isOffPlanProject(p) ? "Off-plan" : "Launch";
          const timing = completionText(p);
          return (
            <button
              type="button"
              key={`${p.id}-${idx}`}
              onClick={(e) => {
                // suppress click after drag
                if (Math.abs(stateRef.current.startScroll - (scrollerRef.current?.scrollLeft ?? 0)) > 4) {
                  e.preventDefault();
                  return;
                }
                onClick();
              }}
              draggable={false}
              data-property-card
              className={`group/card relative !flex w-[310px] shrink-0 !flex-col !items-stretch !justify-start !gap-0 overflow-hidden rounded-md !p-0 !text-left align-top transition duration-500 hover:-translate-y-1 sm:w-[360px] ${
                isDark
                  ? "border border-white/12 bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[0_30px_70px_-32px_rgba(0,0,0,0.85)] hover:border-[#c9a24a]/60"
                  : "border border-[#0d3a2b]/12 bg-[#FDFBF7] shadow-[0_28px_58px_-34px_rgba(6,78,59,0.55)] hover:border-[#8B6F3A]/65"
              }`}
            >
              <div className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#042c1c]">
                <img
                  src={cover}
                  alt={p.name || "Featured project"}
                  loading="lazy"
                  draggable={false}
                  onError={() => setFailedImageIds((prev) => new Set(prev).add(String(p.id)))}
                  className="pointer-events-none h-full w-full select-none object-cover transition duration-[900ms] group-hover/card:scale-[1.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <span
                  data-jbj-cta-emerald="" data-no-contrast-guard data-allow-dark-cta data-surface="dark"
                  className="absolute left-3 top-3 rounded-full bg-[#064E3B]/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                >
                  Launch
                </span>
                <span className="absolute right-3 top-3 rounded-full border border-[#c9a24a]/70 bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] !text-[#EBD79A] backdrop-blur">
                  {statusLabel}
                </span>
                <div className="absolute inset-x-5 bottom-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] !text-[#EBD79A]/90">
                    {place}
                  </p>
                  <h3 className="mt-1.5 line-clamp-2 font-serif text-[22px] leading-tight !text-white">
                    {p.name || p.title}
                  </h3>
                </div>
              </div>
              <div className={`flex w-full min-w-0 flex-col gap-3 px-5 py-4 ${isDark ? "text-white" : "text-[#0d3a2b]"}`}>
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isDark ? "!text-white/55" : "text-[#0d3a2b]/55"}`}>Starting from</p>
                    <p className={`mt-0.5 whitespace-nowrap font-serif text-lg font-semibold ${isDark ? "!text-white" : "text-[#0d3a2b]"}`}>{price}</p>
                  </div>
                  <span
                    data-jbj-cta-emerald="" data-no-contrast-guard data-allow-dark-cta data-surface="dark"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#064E3B] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                  >
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className={`flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] ${isDark ? "border-white/10 !text-white/65" : "border-[#0d3a2b]/10 text-[#1A1A1A]/60"}`}>
                  {bedroomText && <span>{bedroomText}</span>}
                  {bedroomText && timing && <span className="h-1 w-1 rounded-full bg-current opacity-50" />}
                  {timing && <span>{timing}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ServicesSection() {
  const [pageIdx, setPageIdx] = useState(0);
  const page = jbjServicePages[pageIdx];
  const total = jbjServicePages.length;
  const goto = (i: number) => setPageIdx(((i % total) + total) % total);

  return (
    <section
      id="services"
      className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12"
      style={{ backgroundImage: "linear-gradient(180deg,#FDFBF7 0%,#F3EEE4 100%)" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0d3a2b]/25 to-transparent" />
      <div className="pointer-events-none absolute -left-40 top-24 h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle,rgba(6,78,59,0.08),transparent_70%)]" />
      <div className="pointer-events-none absolute -right-40 bottom-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(6,78,59,0.06),transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Eyebrow + heading */}
        <div className="mb-10 flex flex-col gap-8 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[#0d3a2b]/50" />
              <span className="text-[10px] font-bold uppercase tracking-[0.42em] text-[#0d3a2b]">
                {page.kicker}
              </span>
            </div>
            <h2 className="mt-4 font-serif text-4xl leading-[1.02] text-[#0d3a2b] sm:text-[54px]">
              {page.heading}
            </h2>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#1A1A1A]/72">
              {page.blurb}
            </p>
          </div>

          {/* Chapter tabs */}
          <div className="flex flex-wrap gap-2">
            {jbjServicePages.map((p, i) => {
              const active = i === pageIdx;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => goto(i)}
                  data-no-contrast-guard
                  {...(active ? { "data-allow-dark-cta": true, "data-cta": "dark", "data-surface": "dark" } : {})}
                  style={active ? emeraldInkStyle : darkInkStyle}
                  className={
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition " +
                    (active
                      ? "border-[#0d3a2b] bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] shadow-[0_10px_22px_-14px_rgba(6,78,59,0.85)] !text-white [&_*]:!text-white [&_svg]:!stroke-white"
                      : "border-[#0d3a2b]/25 bg-white hover:border-[#0d3a2b] hover:bg-[#FDFBF7]")
                  }
                >
                  <span className={"font-serif text-[10px] tracking-[0.24em] " + (active ? "!text-white opacity-90" : "opacity-80")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={active ? "!text-white" : ""}>{p.label}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Premium photo cards — magazine editorial grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {page.items.map((s, i) => {
            const Icon = s.icon;
            return (
              <article
                key={`${page.key}-${s.title}`}
                data-service-card
                className="group relative flex flex-col overflow-hidden rounded-[20px] border border-[#0d3a2b]/12 bg-[#0d3a2b] shadow-[0_28px_60px_-32px_rgba(6,78,59,0.55)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_44px_90px_-36px_rgba(6,78,59,0.75)]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#01140d] via-[#01140d]/45 to-transparent" />
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/55 to-transparent" />
                  <span
                    data-surface="dark"
                    className="absolute left-5 top-5 inline-flex h-9 items-center rounded-full border border-white/40 bg-black/50 px-3 font-serif text-[11px] tracking-[0.28em] !text-white backdrop-blur"
                    style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    data-surface="dark"
                    className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md [&_svg]:!text-white [&_svg]:!stroke-white [&_svg]:!fill-none"
                  >
                    <Icon className="h-5 w-5" style={{ color: "#FFFFFF", stroke: "#FFFFFF", fill: "none" }} />
                  </span>
                  <div className="absolute inset-x-6 bottom-5">
                    <h3 className="font-serif text-[24px] leading-tight" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                      {s.title}
                    </h3>
                    <span aria-hidden className="mt-2 block h-px w-10 bg-[#C9A84C]" />
                  </div>
                </div>
                <div className="relative flex flex-1 flex-col gap-4 bg-[#FDFBF7] px-6 py-6">
                  <p className="text-[13.5px] leading-relaxed text-[#1A1A1A]/72">{s.body}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-[#0d3a2b]/10 pt-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#0d3a2b]/70">
                      Signature discipline
                    </span>
                    <span
                      data-service-arrow
                      data-no-contrast-guard
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border transition"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

              </article>
            );
          })}
        </div>

        {/* Pager */}
        <div className="mt-12 flex items-center justify-between gap-4 border-t border-[#0d3a2b]/15 pt-6">
          <button
            type="button"
            onClick={() => goto(pageIdx - 1)}
            data-no-contrast-guard
            aria-label="Previous chapter"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#1A1A1A]/25 bg-white transition hover:border-[#0d3a2b] hover:bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] [&_svg]:!text-[#1A1A1A] [&_svg]:!stroke-[#1A1A1A] hover:[&_svg]:!text-white hover:[&_svg]:!stroke-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#0d3a2b]/70">
              Page {pageIdx + 1} of {total}
            </span>
            <div className="flex items-center gap-3">
              {jbjServicePages.map((p, i) => {
                const dotActive = i === pageIdx;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => goto(i)}
                    aria-label={`Go to ${p.label}`}
                    data-service-page-dot
                    data-active={dotActive ? "true" : "false"}
                    data-no-contrast-guard
                    {...(dotActive ? { "data-allow-dark-cta": true, "data-surface": "dark" } : {})}
                    style={dotActive ? emeraldInkStyle : undefined}
                    className={
                      "inline-flex items-center justify-center rounded-full font-serif transition " +
                      (dotActive
                        ? "border border-[#0d3a2b] bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] shadow-[0_10px_22px_-14px_rgba(6,78,59,0.85)] !text-white [&_*]:!text-white"
                        : "border border-[#1A1A1A]/25 bg-white text-[#1A1A1A] hover:border-[#0d3a2b] hover:text-[#0d3a2b]")
                    }
                  >
                    <span className={dotActive ? "!text-white" : ""}>{i + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => goto(pageIdx + 1)}
            data-jbj-cta-emerald="" data-no-contrast-guard data-allow-dark-cta data-surface="dark"
            style={emeraldInkStyle}
            aria-label="Next chapter"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#0d3a2b] bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] shadow-[0_10px_22px_-14px_rgba(6,78,59,0.85)] !text-white [&_svg]:!text-white [&_svg]:!stroke-white"
          >
            <ChevronRight className="h-5 w-5 !text-white" />
          </button>

        </div>
      </div>
    </section>
  );
}


function BrokerAcademySlide({ openSignup, openLead }: { openSignup: () => void; openLead: () => void }) {
  return (
    <section
      id="brokers"
      data-surface="dark"
      className="relative overflow-hidden px-5 py-10 sm:px-8 lg:px-12"
      style={{ backgroundImage: "linear-gradient(135deg,#042c1c 0%,#01140d 48%,#000 100%)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_16%_0%,rgba(255,255,255,0.08),transparent_38%),radial-gradient(ellipse_at_86%_100%,rgba(184,149,85,0.12),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

      <div className="relative mx-auto grid max-w-5xl items-center gap-8 rounded-2xl border border-white/12 bg-white/[0.045] p-6 shadow-[0_30px_80px_-42px_rgba(0,0,0,0.95)] sm:p-8 md:grid-cols-[1fr_auto]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] !text-white/62">For Brokers</span>
          <h2 className="mt-2 font-serif text-3xl leading-tight !text-white sm:text-[34px]">Become a JBJ Certified Broker.</h2>
          <p className="mt-3 max-w-lg text-[13px] leading-relaxed !text-white/72">
            A recognised credential for licensed and aspiring UAE agents — mentorship, materials and a direct pathway into JBJ Global.
          </p>

          <ul className="mt-5 grid gap-3">
            {brokerBenefits.map((b) => {
              const Icon = b.icon;
              return (
                <li key={b.title} className="grid grid-cols-[36px_1fr] items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#C9A84C]/45 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02))] [&_svg]:!text-white [&_svg]:!stroke-white">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="text-[13px] leading-relaxed !text-white/82">
                    <span className="font-serif !text-white">{b.title}.</span>{" "}
                    <span className="!text-white/64">{b.body}</span>
                  </span>
                </li>
              );
            })}
          </ul>


          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={openSignup} data-jbj-cta-emerald="" data-no-contrast-guard data-allow-dark-cta data-surface="dark" style={emeraldInkStyle} className={`${BTN_EMERALD_SOLID} h-11 uppercase tracking-[0.14em]`}>
              Enroll now <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={openLead} data-jbj-cta-white="" data-no-contrast-guard style={darkInkStyle} className={`${BTN_WHITE_HOVER_EMERALD} h-11 uppercase tracking-[0.14em]`}>
              Speak to broker desk
            </button>
          </div>
        </div>

        <div className="hidden md:block">
          <div aria-hidden className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/15 bg-white/[0.06]">
            <div className="absolute inset-3 rounded-full border border-[#C9A84C]/40" />
            <GraduationCap className="h-14 w-14 !text-[#C9A84C]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function CertificateBand() {
  return (
    <section
      id="broker-certificate"
      className="relative overflow-hidden px-5 py-16 sm:px-8 lg:px-12"
      style={{ backgroundImage: "linear-gradient(180deg,#01140d 0%,#042c1c 55%,#01140d 100%)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(184,149,85,0.14),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] !text-[#C9A84C]">Certificate preview</span>
          <h2 className="mt-3 font-serif text-3xl leading-tight !text-white sm:text-4xl">Issued in your name.</h2>
        </div>
        <CertificatePreview />
      </div>
    </section>
  );
}

function CertificatePreview() {
  const today = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(new Date());

  return (
    <div className="relative">
      <div
        data-broker-certificate-frame
        className="certificate-shimmer-frame relative mx-auto w-full overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F5EFE1] to-[#EFE6D6] shadow-[0_60px_120px_-40px_rgba(6,78,59,0.55),0_20px_50px_-20px_rgba(0,0,0,0.35)]"
        style={{ aspectRatio: "1.72 / 1", maxWidth: "1040px" }}
      >
        {/* Ornate double border */}
        <div className="pointer-events-none absolute inset-2 border-[1.5px] border-[#8B6F3A]/60" />
        <div className="pointer-events-none absolute inset-[10px] border border-[#8B6F3A]/25" />
        {/* Corner flourishes */}
        <div className="pointer-events-none absolute left-4 top-4 h-4 w-4 border-l-[1.5px] border-t-[1.5px] border-[#8B6F3A]" />
        <div className="pointer-events-none absolute right-4 top-4 h-4 w-4 border-r-[1.5px] border-t-[1.5px] border-[#8B6F3A]" />
        <div className="pointer-events-none absolute left-4 bottom-4 h-4 w-4 border-l-[1.5px] border-b-[1.5px] border-[#8B6F3A]" />
        <div className="pointer-events-none absolute right-4 bottom-4 h-4 w-4 border-r-[1.5px] border-b-[1.5px] border-[#8B6F3A]" />

        <div className="relative flex h-full flex-col px-8 py-5 text-center sm:px-14 sm:py-7">
          {/* Header */}
          <div className="flex items-center justify-between text-left">
            <img
              data-no-fallback
              src={new URL("@/assets/jbj-monogram-nobuffer.png", import.meta.url).href}
              alt="JBJ Global Real Estate"
              className="h-16 w-16 object-contain drop-shadow-[0_2px_4px_rgba(139,111,58,0.35)] sm:h-24 sm:w-24"
              style={{ filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.6)) drop-shadow(0 3px 6px rgba(0,0,0,0.18))" }}
            />
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.34em] text-[#8B6F3A] sm:text-[10px]">JBJ Global Real Estate</p>
              <p className="mt-0.5 text-[8px] uppercase tracking-[0.22em] text-[#1A1A1A]/50 sm:text-[9px]">Dubai · United Arab Emirates</p>
            </div>
          </div>

          {/* Title block */}
          <div className="mt-2 flex flex-1 flex-col items-center justify-center">
            <h3 className="font-serif text-2xl leading-none text-[#0d3a2b] sm:text-[32px]">Certificate of Completion</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-px w-14 bg-[#8B6F3A]/60" />
              <span className="h-1 w-1 rotate-45 bg-[#8B6F3A]" />
              <span className="h-px w-14 bg-[#8B6F3A]/60" />
            </div>
            <p className="mt-2 text-[9px] uppercase tracking-[0.28em] text-[#1A1A1A]/55 sm:text-[10px]">This is presented to</p>
            <p className="username-shimmer mt-1.5 inline-flex min-w-[260px] justify-center border-b border-[#8B6F3A]/50 pb-1 font-serif text-2xl italic text-[#0d3a2b] sm:min-w-[320px] sm:text-[30px]">
              Your Name Here
            </p>
            <p className="mx-auto mt-2 max-w-xl text-[10px] leading-relaxed text-[#1A1A1A]/68 sm:text-[11px]">
              for successfully completing the JBJ Global Broker Academy professional pathway.
            </p>
          </div>

          {/* Footer row */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4 text-left">
            <div>
              <div className="h-5 sm:h-6" />
              <div className="mt-1 h-px w-28 bg-[#1A1A1A]/60 sm:w-40" />
              <p className="mt-1 text-[8px] uppercase tracking-[0.22em] text-[#1A1A1A]/60 sm:text-[9px]">Founder &amp; CEO</p>
            </div>

            <div aria-hidden className="seal-outline relative flex h-24 w-24 items-center justify-center rounded-full sm:h-[120px] sm:w-[120px]">
              <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full drop-shadow-[0_14px_24px_rgba(184,149,85,0.5)]">
                <defs>
                  <linearGradient id="sealGold" x1="12" y1="8" x2="108" y2="112" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FBEAB4" />
                    <stop offset="0.35" stopColor="#E8C877" />
                    <stop offset="0.7" stopColor="#C9A84C" />
                    <stop offset="1" stopColor="#8B6F3A" />
                  </linearGradient>
                  <linearGradient id="sealGoldSoft" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#E8C877" />
                    <stop offset="1" stopColor="#C9A84C" />
                  </linearGradient>
                  <radialGradient id="sealDisc" cx="42%" cy="38%" r="70%">
                    <stop offset="0%" stopColor="#FBEAB4" />
                    <stop offset="45%" stopColor="#E8C877" />
                    <stop offset="80%" stopColor="#C9A84C" />
                    <stop offset="100%" stopColor="#8B6F3A" />
                  </radialGradient>
                  <path id="sealTextPath" d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
                </defs>
                {/* filled metallic disc for engraved look */}
                <circle cx="60" cy="60" r="56" fill="url(#sealDisc)" opacity="0.98" />
                {/* rings */}
                <circle cx="60" cy="60" r="56" fill="none" stroke="url(#sealGold)" strokeWidth="2" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="#8B6F3A" strokeWidth="0.6" opacity="0.7" />
                <circle cx="60" cy="60" r="47" fill="none" stroke="url(#sealGoldSoft)" strokeWidth="0.8" opacity="0.9" />
                <circle cx="60" cy="60" r="39" fill="none" stroke="#8B6F3A" strokeWidth="1" strokeDasharray="2.4 3.2" opacity="0.85" />
                <text fontSize="8.4" fontWeight="800" letterSpacing="2" fill="#5C4620">
                  <textPath href="#sealTextPath" startOffset="0%">JBJ GLOBAL REAL ESTATE · OFFICIAL SEAL · DUBAI ·</textPath>
                </text>
              </svg>
              <img
                data-no-fallback
                src={new URL("@/assets/jbj-monogram-nobuffer.png", import.meta.url).href}
                alt=""
                className="relative h-12 w-12 object-contain sm:h-16 sm:w-16"
                style={{
                  filter: "brightness(0) saturate(100%) invert(28%) sepia(45%) saturate(720%) hue-rotate(5deg) brightness(78%) contrast(96%) drop-shadow(0 1px 0 rgba(255,240,200,0.55)) drop-shadow(0 -1px 0 rgba(80,55,20,0.35))",
                  opacity: 0.96,
                }}
              />
            </div>

            <div className="text-right">
              <div className="ml-auto flex h-5 items-end justify-end font-serif text-sm leading-none text-[#0d3a2b] sm:h-6 sm:text-base">
                {today}
              </div>
              <div className="ml-auto mt-1 h-px w-28 bg-[#1A1A1A]/60 sm:w-40" />
              <p className="mt-1 text-[8px] uppercase tracking-[0.22em] text-[#1A1A1A]/60 sm:text-[9px]">Date of issue</p>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden className="absolute -inset-8 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(184,149,85,0.28),transparent_70%)] blur-2xl" />
    </div>
  );
}

// ── Tier grid (reusable per audience) ───────────────────────────────────────
function TierGrid({ tiers, onSelect }: { tiers: Tier[]; onSelect: (tier: Tier) => void }) {
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
                ? "relative flex flex-col rounded-2xl p-8 pt-10 shadow-[0_30px_60px_-32px_rgba(6,78,59,0.55)] bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)]"
                : "relative flex flex-col rounded-2xl border border-[#0d3a2b]/15 bg-white p-8 pt-10 shadow-[0_24px_60px_-42px_rgba(13,58,43,0.35)]"
            }
          >
            {isEm && (
              <span
                data-surface="dark"
                data-no-contrast-guard
                className="allow-white absolute left-1/2 -top-3 -translate-x-1/2 rounded-full bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] !text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] whitespace-nowrap"
              >
                <Star className="inline h-3 w-3 mr-1 -mt-0.5 !text-white" /> Most popular
              </span>
            )}
            <p
              className={`text-[11px] font-bold uppercase tracking-[0.22em] ${isEm ? "!text-[#C9A84C]" : "text-[#064E3B]"}`}
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
                    className={`mt-0.5 h-4 w-4 shrink-0 ${isEm ? "!text-[#C9A84C]" : "text-[#064E3B]"}`}
                  />
                  <span className={isEm ? "!text-white/92" : "text-[#1A1A1A]/78"}>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelect(tier)}
              data-jbj-cta-emerald="" data-no-contrast-guard data-allow-dark-cta data-surface="dark"
              style={emeraldInkStyle}
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
  audience,
  onSelect,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  tiers: Tier[];
  audience: string;
  onSelect: (audience: string, tier: Tier, sectionId: string) => void;
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
        <TierGrid tiers={tiers} onSelect={(tier) => onSelect(audience, tier, `#${id}`)} />
        {children}
      </div>
    </section>
  );
}

export default function PublicAccess() {
  const [leadOpen, setLeadOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [payCtx, setPayCtx] = useState<PaymentRequestContext | null>(null);

  const navigate = useNavigate();
  const openSignup = () => navigate("/signup");
  const openPayment = (audience: string, tier: Tier, sectionId: string) => {
    setPayCtx({
      audience,
      planName: tier.name,
      price: tier.price,
      cadence: tier.cadence,
      sectionId,
      extra: { audience_size: tier.audienceSize ?? null, features: tier.features },
    });
  };

  // Global event bridge: the unified Contact Us widget (SupportLauncher) fires
  // "jbj:open-advisor" when the visitor picks the "Speak to an advisor" or
  // "Request a callback" channel.
  React.useEffect(() => {
    const onOpen = () => setLeadOpen(true);
    window.addEventListener("jbj:open-advisor", onOpen as EventListener);
    return () => window.removeEventListener("jbj:open-advisor", onOpen as EventListener);
  }, []);


  // Nuclear contrast lock — walks all access CTAs after paint and forces color/bg
  // with priority 'important' via inline style, defeating ALL global rules.
  React.useEffect(() => {
    const paint = () => {
      document.querySelectorAll<HTMLElement>("[data-jbj-cta-emerald]").forEach((el) => {
        el.style.setProperty("color", "#FFFFFF", "important");
        el.style.setProperty("-webkit-text-fill-color", "#FFFFFF", "important");
        el.querySelectorAll<HTMLElement>("*").forEach((c) => {
          c.style.setProperty("color", "#FFFFFF", "important");
          c.style.setProperty("-webkit-text-fill-color", "#FFFFFF", "important");
          if (c.tagName === "svg" || c.tagName === "SVG" || c.tagName.toLowerCase() === "svg" || c instanceof SVGElement) {
            c.style.setProperty("stroke", "#FFFFFF", "important");
          }
        });
      });
      document.querySelectorAll<HTMLElement>("[data-jbj-cta-white]").forEach((el) => {
        const hovered = el.matches(":hover");
        const ink = hovered ? "#FFFFFF" : "#0d3a2b";
        el.style.setProperty("color", ink, "important");
        el.style.setProperty("-webkit-text-fill-color", ink, "important");
        el.style.setProperty("background-color", hovered ? "#064E3B" : "#FFFFFF", "important");
        el.querySelectorAll<HTMLElement>("*").forEach((c) => {
          c.style.setProperty("color", ink, "important");
          c.style.setProperty("-webkit-text-fill-color", ink, "important");
          if (c instanceof SVGElement) c.style.setProperty("stroke", ink, "important");
        });
      });
    };
    paint();
    const t = setInterval(paint, 400);
    document.addEventListener("mouseover", paint);
    document.addEventListener("mouseout", paint);
    return () => {
      clearInterval(t);
      document.removeEventListener("mouseover", paint);
      document.removeEventListener("mouseout", paint);
    };
  }, []);


  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#1A1A1A]">
      <style>{ACCESS_CTA_STYLE}</style>
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
              data-jbj-cta-emerald="" data-no-contrast-guard data-allow-dark-cta data-surface="dark"
              style={emeraldInkStyle}
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
              className="h-[200px] w-[200px] object-contain drop-shadow-[0_28px_60px_rgba(0,0,0,0.6)] sm:h-[300px] sm:w-[300px] lg:h-[380px] lg:w-[380px]"
            />
            <h1 className="mt-6 font-serif text-3xl leading-[1.05] !text-white sm:text-6xl lg:text-[76px]">
              JBJ Global Real Estate
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed !text-white/85 sm:text-base lg:text-lg">
              A private property ecosystem for Dubai's discerning investors, developers & brokers.
            </p>
            <div className="mt-7 flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto">
              <button
                onClick={openSignup}
                data-jbj-cta-emerald="" data-no-contrast-guard data-allow-dark-cta data-surface="dark"
                style={emeraldInkStyle}
                className={`${BTN_EMERALD_SOLID} h-12 flex-1 sm:flex-none uppercase tracking-[0.14em] min-w-[160px]`}
              >
                Create account <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLoginOpen(true)}
                className="inline-flex h-12 flex-1 sm:flex-none min-w-[140px] items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 text-[13px] font-bold uppercase tracking-[0.14em] !text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Log in
              </button>
            </div>
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
                A private property ecosystem, built around you
              </span>
              <h2 className="mt-3 font-serif text-4xl leading-[1.05] text-[#0d3a2b] sm:text-5xl">
                A private property ecosystem for Dubai's discerning investors, developers & brokers.
              </h2>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={openSignup} data-jbj-cta-emerald="" data-no-contrast-guard data-allow-dark-cta data-surface="dark" style={emeraldInkStyle} className={`${BTN_EMERALD_SOLID} h-12 uppercase tracking-[0.14em]`}>
                  Create your account <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => setLeadOpen(true)} data-jbj-cta-white="" data-no-contrast-guard style={darkInkStyle} className={`${BTN_WHITE_HOVER_EMERALD} h-12 uppercase tracking-[0.14em]`}>
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
        <section id="featured" className="overflow-hidden bg-[#F7F2EA] px-5 py-16 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-md border border-[#0d3a2b]/10 bg-[#FDFBF7] shadow-[0_26px_70px_-54px_rgba(6,78,59,0.5)]">
            <div className="relative z-20 px-5 pb-4 pt-6 sm:px-7 md:flex md:items-end md:justify-between md:gap-6">
              <div className="max-w-3xl">
                <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#064E3B]">
                  Latest off-plan launches
                </span>
                <h2 className="mt-2 font-serif text-3xl leading-tight text-[#0d3a2b] sm:text-4xl">
                  Live inventory from Dubai's top developers.
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[#1A1A1A]/68">
                  Off-plan releases and premium new launches. Create an account to unlock pricing, plans and full detail.
                </p>
              </div>
              <button onClick={openSignup} data-jbj-cta-emerald="" data-no-contrast-guard data-allow-dark-cta data-surface="dark" style={emeraldInkStyle} className={`${BTN_EMERALD_SOLID} mt-5 h-11 shrink-0 md:mt-0`}>
                Unlock the catalogue <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="relative z-10 border-t border-[#0d3a2b]/10 bg-[#FBF7EF] py-4">
              <PropertyMarquee onClick={openSignup} />
            </div>
          </div>
        </section>


        {/* GUIDES — LOCKED per owner */}
        <section id="guides" className="bg-[#F7F2EA] py-20">
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
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="rounded-md border border-[#0d3a2b]/10 bg-[#FDFBF7] py-5 shadow-[0_26px_70px_-54px_rgba(6,78,59,0.45)]">
              <BookCarousel books={ACCESS_BOOKS} size="sm" durationSec={38} compact />
            </div>
          </div>
        </section>

        {/* SERVICES — lifted above all packages */}
        <ServicesSection />

        {/* PACKAGES — one strap per audience */}

        {/* INVESTOR */}

        <PackageStrap
          id="investor-packages"
          eyebrow="For Investors"
          title="Investor packages"
          description="Three tiers, from single-property investors to family offices. Pick the level of support that matches your portfolio."
          tiers={investorTiers}
          audience="Investor packages"
          onSelect={openPayment}
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
            audience="Developer programs"
            onSelect={openPayment}
          />
        </div>

        {/* BROKER */}
        <PackageStrap
          id="broker-packages"
          eyebrow="For Brokers"
          title="Broker Academy & enrollment"
          description="Yearly enrollment for licensed and aspiring UAE agents. Mentorship, exclusive materials, and a direct pathway into JBJ Global."
          tiers={brokerTiers}
          audience="Broker Academy"
          onSelect={openPayment}
        />

        {/* AGENCY */}
        <div className="bg-[#F7F2EA]">
          <PackageStrap
            id="agency-packages"
            eyebrow="For Agencies"
            title="Agency packages"
            description="Team seats, CRM segmentation and lead systems for boutique and established Dubai agencies."
            tiers={agencyTiers}
            audience="Agency packages"
            onSelect={openPayment}
          />
        </div>

        <BrokerAcademySlide openSignup={openSignup} openLead={() => setLeadOpen(true)} />


        <CertificateBand />

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

      {/* Welcome portal pop-up — explains this is the access gate, not the full site. */}
      <WelcomePortalOverlay onCreateAccount={openSignup} onLogin={() => setLoginOpen(true)} />

      {/* Unified Contact widget lives globally (SupportLauncher). This page just
          listens so the "Speak to an advisor" channel opens our LeadFormDialog. */}
      <SupportGuideOverlay />

      <LeadFormDialog open={leadOpen} onOpenChange={setLeadOpen} sourcePage="/access" />
      <PaymentRequestDialog
        open={!!payCtx}
        onOpenChange={(o) => { if (!o) setPayCtx(null); }}
        context={payCtx}
        sourcePage="/access"
      />
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} />
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}

/* SpeakToAdvisorLauncher removed — the global Contact Us widget
 * (SupportLauncher) is now the single unified entry point across the site.
 * It dispatches "jbj:open-advisor" for the advisor lead form. */


/* ============================================================================
 * WelcomePortalOverlay — entry pop-up that explains this is the private access
 * portal to the full JBJ platform. Shown once per browser, then dismissed.
 * ==========================================================================*/
const WELCOME_PORTAL_KEY = "jbj_welcome_portal_dismissed";

function WelcomePortalOverlay({ onCreateAccount, onLogin }: { onCreateAccount: () => void; onLogin: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (user) {
      try { localStorage.setItem(WELCOME_PORTAL_KEY, "1"); } catch {}
      setOpen(false);
      return;
    }
    try {
      const dismissed = localStorage.getItem(WELCOME_PORTAL_KEY);
      if (!dismissed) {
        const t = window.setTimeout(() => {
          setOpen(true);
          // small fade-in staging
          window.setTimeout(() => setMounted(true), 30);
        }, 900);
        return () => window.clearTimeout(t);
      }
    } catch {
      // silent fail
    }
  }, [user]);

  const dismiss = () => {
    try { localStorage.setItem(WELCOME_PORTAL_KEY, "1"); } catch {}
    setMounted(false);
    const t = window.setTimeout(() => setOpen(false), 220);
    return () => window.clearTimeout(t);
  };

  const handleCreateAccount = () => {
    dismiss();
    onCreateAccount();
  };

  const handleLogin = () => {
    dismiss();
    onLogin();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="jbj-welcome-portal-title"
      className="fixed inset-0 z-[110] flex items-center justify-center px-4"
    >
      <div
        className={`
          absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300
          ${mounted ? "opacity-100" : "opacity-0"}
        `}
        onClick={dismiss}
        aria-hidden
      />
      <div
        data-no-contrast-guard
        className={`
          jbj-emerald-animated-border group relative w-full max-w-md rounded-2xl p-[2px] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55),0_0_40px_rgba(16,185,129,0.28)]
          transition-all duration-300
          ${mounted ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}
        `}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close welcome portal"
          className="allow-white absolute right-2 top-2 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full text-white opacity-0 transition-opacity duration-200 hover:bg-white/15 hover:text-white focus-visible:opacity-100 group-hover:opacity-100 sm:right-3 sm:top-3"
          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
        >
          <X className="h-4 w-4" style={{ stroke: "#FFFFFF" }} />
        </button>
        <div
          data-emerald="true"
          data-allow-dark-cta
          data-no-contrast-guard
          className="jj-emerald-metallic allow-white relative flex flex-col items-center rounded-[14px] px-6 py-8 text-center text-white sm:px-8 sm:py-10"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Welcome · Private access portal
          </span>

          <img
            data-no-fallback
            src={new URL("@/assets/jbj-monogram-light-transparent.png", import.meta.url).href}
            alt="JBJ"
            className="h-20 w-20 object-contain opacity-95 drop-shadow-[0_12px_30px_rgba(0,0,0,0.45)] sm:h-24 sm:w-24"
          />

          <h2 id="jbj-welcome-portal-title" className="mt-5 font-serif text-2xl leading-tight text-white sm:text-3xl">
            Welcome to JBJ Global Real Estate
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85">
            This is your private access portal. Create an account or log in to explore the complete property platform, live opportunities, and advisory tools.
          </p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#EBD79A]">
            Unlock the full ecosystem
          </p>

          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleCreateAccount}
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-[13px] font-bold uppercase tracking-[0.14em] text-white transition-[filter] hover:brightness-110"
              style={{
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                backgroundImage: "var(--jj-emerald-ombre)",
                border: 0,
                boxShadow: "0 10px 24px -14px rgba(6,78,59,0.92), inset 0 1px 0 rgba(255,255,255,0.14)",
              }}
            >
              Create account <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleLogin}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 text-[13px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md transition hover:bg-white/20"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ============================================================================
 * SupportGuideOverlay — first-visit modal that explains the difference between
 * the "Contact Us" support hub (WhatsApp/Call/Concierge) and the "Speak to an
 * Advisor" lead form. After "Okay":
 *   • Anonymous visitor → hidden for 24h, re-shown after that if still signed out.
 *   • Signed-in user   → never shown again.
 * ==========================================================================*/
const SUPPORT_GUIDE_KEY = "jbj_support_guide_dismissed_at";
const SUPPORT_GUIDE_TTL_MS = 24 * 60 * 60 * 1000;

function SupportGuideOverlay() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Signed-in users: never show, and clear any stale flag.
    if (user) {
      try { localStorage.removeItem(SUPPORT_GUIDE_KEY); } catch {}
      setOpen(false);
      return;
    }
    try {
      const raw = localStorage.getItem(SUPPORT_GUIDE_KEY);
      if (!raw) {
        // First visit — small delay so the page paints first
        const t = window.setTimeout(() => setOpen(true), 1500);
        return () => window.clearTimeout(t);
      }
      const dismissedAt = parseInt(raw, 10);
      if (Number.isFinite(dismissedAt) && Date.now() - dismissedAt >= SUPPORT_GUIDE_TTL_MS) {
        const t = window.setTimeout(() => setOpen(true), 1500);
        return () => window.clearTimeout(t);
      }
    } catch {
      // Silent fail — never block UX
    }
  }, [user]);

  const handleOkay = () => {
    try { localStorage.setItem(SUPPORT_GUIDE_KEY, String(Date.now())); } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="jbj-support-guide-title"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={handleOkay}
        aria-hidden
      />
      <div
        data-no-contrast-guard
        className="jbj-emerald-animated-border relative w-full max-w-lg rounded-2xl p-[2px] shadow-[0_30px_60px_rgba(0,0,0,0.45),0_0_34px_rgba(16,185,129,0.35)]"
      >
        <div
          data-emerald="true"
          data-allow-dark-cta
          data-no-contrast-guard
          className="jj-emerald-metallic allow-white relative flex flex-col rounded-[14px] p-6 text-white sm:p-8"
        >
          <button
            type="button"
            onClick={handleOkay}
            aria-label="Close guide"
            className="allow-white absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-white/85 hover:text-white hover:bg-white/10"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
          >
            <X className="h-4 w-4" style={{ stroke: "#FFFFFF" }} />
          </button>

          <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/80">Quick guide</span>
          <h3 id="jbj-support-guide-title" className="mt-2 font-serif text-2xl leading-tight text-white sm:text-3xl">
            One widget. Every way to reach JBJ.
          </h3>
          <p className="mt-2 text-sm text-white/80">
            Tap the <span className="font-semibold text-white">Contact Us</span> control (right edge on desktop, bottom-right on mobile) to open every support channel in one place.
          </p>

          <div className="mt-5 grid gap-3">
            <div className="rounded-xl bg-white/8 p-4 ring-1 ring-white/15">
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-white" />
                <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-white">Speak to an advisor</span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/80">
                Scheduled callback from a senior advisor — best for property, investment or brokerage requests.
              </p>
            </div>
            <div className="rounded-xl bg-white/8 p-4 ring-1 ring-white/15">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-white">Instant support · 24/7</span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/80">
                WhatsApp, call now, live voice agent or JBJ Concierge — all inside the same panel.
              </p>
            </div>
          </div>


          <button
            type="button"
            onClick={handleOkay}
            data-allow-dark-cta
            data-no-contrast-guard
            className="allow-white mt-6 inline-flex h-12 w-full items-center justify-center rounded-full text-[13px] font-bold uppercase tracking-[0.22em] text-white transition-[filter] hover:brightness-110"
            style={{
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              backgroundImage: "var(--jj-emerald-ombre)",
              border: 0,
              boxShadow: "0 10px 24px -14px rgba(6,78,59,0.92), inset 0 1px 0 rgba(255,255,255,0.14)",
            }}
          >
            Okay, got it
          </button>
        </div>
      </div>
    </div>
  );
}

