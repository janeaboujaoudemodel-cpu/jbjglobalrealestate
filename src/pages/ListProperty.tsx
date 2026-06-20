/**
 * /list-property — Single canonical entry point for all property listings.
 *
 * - Premium navy/blue hero band (blue-fade gradient) replacing the old champagne hero
 * - One unified card with Purpose (Sale/Rent) + Mode (Manual / AI / Browse) segmented controls
 * - Active form renders below based on selection
 * - "My Submissions" section pulls live data from seller_listings via useSellerListings
 *   so users can track status of every application (Pending / Approved / Declined / Live)
 * - Fully responsive (mobile → desktop), gold accents, no white-on-light text
 *
 * Legacy routes (/sell, /seller-listing, /listing-portal, /listing-portal/submit)
 * redirect into this page with the right ?purpose= / ?mode= params.
 */
import { lazy, Suspense, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDisplayFirstName } from "@/hooks/useDisplayFirstName";
import {
  Sparkles,
  Wand2,
  ClipboardCheck,
  Eye,
  Tag,
  Key,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  ArrowRight,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSellerListings } from "@/hooks/useSellerListings";
import { useAuth } from "@/contexts/AuthContext";
import { formatDisplayDate as formatDate } from "@/utils/formatDate";
import { AnimatedBorderShell } from "@/components/tools/AnimatedBorderShell";

const ManualWizard = lazy(() => import("@/pages/SellerListing"));
const AIWizard = lazy(() => import("@/pages/ListingPortalSubmit"));
const BrowseListings = lazy(() => import("@/pages/ListingPortal"));

type Mode = "pick" | "manual" | "ai" | "browse";
type Purpose = "sale" | "rent";

/* ────────────────────────────── theme tokens ────────────────────────────── */
const BLUE = "#0A0A0A";
const BLUE_HOVER = "#1F1F1F";
const BLUE_DEEP = "#0B1B33";
const BLUE_GRADIENT =
  "linear-gradient(135deg, #0B1B33 0%, #0A0A0A 50%, #1F1F1F 100%)";
const GOLD = "#B89555";
const CHAMPAGNE = "#FDFBF7";
const CHAMPAGNE_SURFACE = "#F7F2EA";
const CHAMPAGNE_RAISED = "#EFE6D6";
const INK = "#1A1A1A";

/* per-mode accent system: manual = premium emerald/black ombre,
   ai = purple/navy, pick/browse = navy */
type ModeTheme = {
  name: "navy" | "emerald" | "purple";
  primary: string;       // solid accent
  primaryDeep: string;   // deeper variant
  badgeBorder: string;   // accent border for pills/badges
  badgeBg: string;       // translucent fill behind accent
  heroGradient: string;  // hero band background
  sectionGradient: string; // My Submissions band background
  ctaText: string;       // CTA text color over solid primary
  iconAccent: string;    // sparkle / leaf icon color
};
const THEME_NAVY: ModeTheme = {
  name: "navy",
  primary: BLUE,
  primaryDeep: BLUE_DEEP,
  badgeBorder: "#A855F7",
  badgeBg: "rgba(168,85,247,0.14)",
  heroGradient: BLUE_GRADIENT,
  sectionGradient: BLUE_GRADIENT,
  ctaText: "#FFFFFF",
  iconAccent: "#A855F7",
};
const THEME_EMERALD: ModeTheme = {
  name: "emerald",
  primary: "#064E3B",
  primaryDeep: "#022C22",
  badgeBorder: "#10B981",
  badgeBg: "rgba(16,185,129,0.16)",
  heroGradient:
    "linear-gradient(135deg, #022C22 0%, #064E3B 45%, #0B0B0B 100%)",
  sectionGradient:
    "linear-gradient(135deg, #022C22 0%, #064E3B 50%, #0B0B0B 100%)",
  ctaText: "#FFFFFF",
  iconAccent: "#10B981",
};
const THEME_PURPLE: ModeTheme = {
  name: "purple",
  primary: "#5B21B6",
  primaryDeep: "#2E1065",
  badgeBorder: "#A855F7",
  badgeBg: "rgba(168,85,247,0.16)",
  heroGradient:
    "linear-gradient(135deg, #2E1065 0%, #4C1D95 50%, #0B0B0B 100%)",
  sectionGradient:
    "linear-gradient(135deg, #2E1065 0%, #4C1D95 50%, #0B0B0B 100%)",
  ctaText: "#FFFFFF",
  iconAccent: "#C4B5FD",
};
const themeForMode = (m: Mode): ModeTheme =>
  m === "manual" ? THEME_EMERALD : m === "ai" ? THEME_PURPLE : THEME_NAVY;

/* Soft mode-tinted ombre used for "white" surfaces (Purpose card, empty
   states, "Open full dashboard" pill) so they match the page's accent
   instead of reading as harsh pure white. */
const ombreSoft = (t: ModeTheme): string => {
  if (t.name === "emerald")
    return "linear-gradient(135deg, #E8F3EC 0%, #FFFFFF 55%, #D4E9DB 100%)";
  if (t.name === "purple")
    return "linear-gradient(135deg, #F2EBFF 0%, #FFFFFF 55%, #E5D6FF 100%)";
  return "linear-gradient(135deg, #E5EAF3 0%, #FFFFFF 50%, #DDE3F0 100%)";
};

const ListProperty = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = (searchParams.get("mode") as Mode) || "pick";
  const purpose = (searchParams.get("purpose") as Purpose) || "sale";
  const firstName = useDisplayFirstName("there");

  useEffect(() => {
    if (!searchParams.get("purpose")) {
      const next = new URLSearchParams(searchParams);
      next.set("purpose", "sale");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setMode = (next: Mode) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("mode", next);
    if (!sp.get("purpose")) sp.set("purpose", purpose);
    setSearchParams(sp, { replace: false, preventScrollReset: true });
  };

  const setPurpose = (next: Purpose) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("purpose", next);
    if (!sp.get("mode")) sp.set("mode", mode);
    setSearchParams(sp, { replace: false, preventScrollReset: true });
  };

  const ActiveTab = useMemo(() => {
    switch (mode) {
      case "manual":
        return ManualWizard;
      case "browse":
        return BrowseListings;
      case "ai":
        return AIWizard;
      default:
        return null;
    }
  }, [mode]);

  const theme = themeForMode(mode);
  const ombreShine =
    `radial-gradient(circle at 18% 18%, ${theme.iconAccent}33 0%, transparent 60%)`;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: CHAMPAGNE, color: INK }}
      data-listing-mode={theme.name}
    >
      <SEOHead
        title={purpose === "rent" ? "List Your Property for Rent — JBJ Global Real Estate" : "List Your Property for Sale — JBJ Global Real Estate"}
        description="List your property for sale or rent with JBJ Global Real Estate. Use AI to auto-generate your listing, or fill in manually. Track approval status from your dashboard."
        canonicalPath="/list-property"
      />

      {/* Full-bleed: no outer chrome — every <section> below renders edge-to-edge */}
      <div className="w-full" style={{ backgroundColor: CHAMPAGNE }}>



      {/* ───────────────────── Hero — mode-aware gradient ───────────────────── */}
      <section
        className="relative w-full"
        data-surface="dark"
        data-allow-dark-cta
        data-no-contrast-guard
        style={{ background: theme.heroGradient }}
      >
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.badgeBorder}A6, transparent)`,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: ombreShine }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-12 md:pt-16 pb-12 md:pb-16">
          <motion.div
            key={purpose}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.18em] font-semibold"
              style={{
                backgroundColor: theme.badgeBg,
                color: "#FFFFFF",
                border: `1px solid ${theme.badgeBorder}`,
              }}
              data-no-contrast-guard
            >
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: theme.badgeBorder }} />
              {purpose === "rent" ? "JBJ Landlord Portal" : "JBJ Seller Portal"}
            </span>
            <h1
              className="mt-5 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
              style={{
                color: "#FFFFFF",
                textShadow: "0 2px 18px rgba(0,0,0,0.35)",
                letterSpacing: "-0.02em",
              }}
              data-no-contrast-guard
            >
              Welcome, {firstName}
            </h1>
            <p
              className="mt-4 text-base sm:text-lg max-w-2xl mx-auto"
              style={{ color: "rgba(255,255,255,0.88)" }}
              data-no-contrast-guard
            >
              List your property for {purpose === "rent" ? "rent" : "sale"} with
              JBJ Global Real Estate — premium reach, full AI assistance,
              transparent approval, and live status in your dashboard.
            </p>

          </motion.div>

        </div>
      </section>

      {/* ───────────────── Purpose + Mode selector (mode-aware accent) ───────────────── */}
      <section
        className="px-4 sm:px-6 md:px-10 pt-8 md:pt-10 pb-8 md:pb-10 relative z-10"
        style={{ background: ombreSoft(theme) }}
      >

        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-2xl p-5 sm:p-6 md:p-7 shadow-xl"
            style={{
              background: `linear-gradient(135deg, #FFFFFF 0%, ${theme.primary}14 55%, #FFFFFF 100%)`,
              border: `1.5px solid ${theme.primary}`,
              boxShadow: `0 18px 40px -22px ${theme.primary}66`,
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
              {/* Purpose */}
              <div className="md:col-span-4">
                <div
                  className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3"
                  style={{ color: theme.primary }}
                >
                  Purpose
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <SegmentedPill
                    active={purpose === "sale"}
                    onClick={() => setPurpose("sale")}
                    icon={<Tag className="w-4 h-4" />}
                    theme={theme}
                  >
                    For Sale
                  </SegmentedPill>
                  <SegmentedPill
                    active={purpose === "rent"}
                    onClick={() => setPurpose("rent")}
                    icon={<Key className="w-4 h-4" />}
                    theme={theme}
                  >
                    For Rent
                  </SegmentedPill>
                </div>
              </div>

              {/* Mode */}
              <div className="md:col-span-8">
                <div
                  className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3"
                  style={{ color: theme.primary }}
                >
                  How would you like to list?
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <SegmentedPill
                    active={mode === "manual"}
                    onClick={() => setMode("manual")}
                    icon={<ClipboardCheck className="w-4 h-4" />}
                    theme={THEME_EMERALD}
                  >
                    Manual
                  </SegmentedPill>
                  <SegmentedPill
                    active={mode === "ai"}
                    onClick={() => setMode("ai")}
                    icon={<Wand2 className="w-4 h-4" />}
                    theme={THEME_PURPLE}
                    trailing={<Sparkles className="w-3 h-3" />}
                  >
                    AI-Assisted
                  </SegmentedPill>
                  <SegmentedPill
                    active={mode === "browse"}
                    onClick={() => setMode("browse")}
                    icon={<Eye className="w-4 h-4" />}
                    theme={THEME_NAVY}
                  >
                    Browse
                  </SegmentedPill>
                </div>
              </div>
            </div>

            {/* Submissions link — separated, right-aligned */}
            <div
              className="mt-5 pt-4 flex justify-end"
              style={{ borderTop: `1px solid ${theme.primary}26` }}
            >
              <a
                href="#my-submissions"
                data-no-contrast-guard
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold transition-all hover:brightness-105"
                style={{
                  background: "#FFFFFF",
                  color: theme.primary,
                  WebkitTextFillColor: theme.primary,
                  border: `1.5px solid ${theme.primary}`,
                  boxShadow: `0 6px 16px -10px ${theme.primary}66`,
                }}
              >
                View my submissions →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── Active form / browser / picker ─────────────────── */}
      <section
        data-no-contrast-guard
        style={{ background: ombreSoft(theme) }}
        className={
          mode === "pick" || !ActiveTab
            ? "w-full px-4 sm:px-6 md:px-10 pt-8 pb-12"
            : "w-full pt-0 pb-0"
        }
      >
        {mode === "pick" || !ActiveTab ? (
          <PremiumModePicker onPick={setMode} purpose={purpose} />
        ) : (
          <Suspense
            fallback={
              <div className="py-24">
                <BrandedLoader />
              </div>
            }
          >
            <ActiveTab key={`${mode}-${purpose}`} />
          </Suspense>
        )}
      </section>

      {/* ───────────────── My Submissions section (mode-aware) ───────────────── */}
      <MySubmissionsSection theme={theme} />
      </div>
    </div>
  );
};

/* ────────────────── Segmented pill control (mode-aware) ────────────────── */
function SegmentedPill({
  active,
  onClick,
  icon,
  children,
  theme = THEME_NAVY,
  trailing,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  theme?: ModeTheme;
  trailing?: React.ReactNode;
}) {
  const inactiveFg = theme.primaryDeep || theme.primary;
  const fg = active ? "#FFFFFF" : inactiveFg;
  return (
    <button
      type="button"
      onClick={onClick}
      data-allow-dark-cta
      data-no-contrast-guard
      data-listing-pill={active ? "active" : "inactive"}
      className="jj-listing-pill inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-150 hover:brightness-110"
      style={
        active
          ? {
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDeep} 100%)`,
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              ["--jj-pill-fg" as any]: "#FFFFFF",
              border: `1px solid ${theme.primaryDeep}`,
              boxShadow: `0 10px 24px -12px ${theme.primary}99`,
            }
          : {
              backgroundColor: "#FFFFFF",
              color: inactiveFg,
              WebkitTextFillColor: inactiveFg,
              ["--jj-pill-fg" as any]: inactiveFg,
              border: `2px solid ${inactiveFg}`,
            }
      }
    >
      <span className="jj-listing-pill-ico inline-flex">{icon}</span>
      <span className="jj-listing-pill-lbl">{children}</span>
      {trailing && (
        <span className="jj-listing-pill-ico inline-flex">{trailing}</span>
      )}
    </button>
  );
}

/* ───────────────── Premium two-card mode picker ───────────────── */
function PremiumModePicker({ onPick, purpose = "sale" }: { onPick: (m: Mode) => void; purpose?: Purpose }) {
  // Pick screen uses the navy hero theme as its accent system, so cards
  // visually match the band above. Inner Start CTAs are white-fill / navy-ink.
  const accent = THEME_NAVY.primary;          // #0A0A0A
  const accentDeep = THEME_NAVY.primaryDeep;  // #0B1B33
  const accentGlow = THEME_NAVY.badgeBorder;  // purple #A855F7
  const cardGradient =
    `linear-gradient(135deg, ${accentDeep} 0%, ${accent} 55%, #0B0B0B 100%)`;

  // Purpose-aware copy: sale → Seller, rent → Landlord
  const isRent = purpose === "rent";
  const manualTitle = isRent ? "Landlord Listing Tool" : "Seller Listing Tool";
  const manualEyebrow = isRent ? "Full Control · Landlord" : "Full Control · Seller";
  const manualDesc = isRent
    ? "Fill in every field yourself — rent, location, photos, amenities and tenant contact preferences. Best when you already have the full rental details ready."
    : "Fill in every field yourself — price, location, photos, amenities and buyer contact preferences. Best when you already have the full property details ready.";
  const aiTitle = isRent ? "Landlord Assistant (AI)" : "Seller Assistant (AI)";
  const aiEyebrow = isRent ? "AI-Assisted · Landlord" : "AI-Assisted · Seller";
  const aiDesc = isRent
    ? "Paste any portal link, tenancy contract or short description. Our AI auto-fills the rental listing in seconds — you only review and confirm."
    : "Paste any portal link, brochure or short description. Our AI auto-fills the listing in seconds — you only review and confirm before submitting.";

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-0">
      <div className="text-center mb-7">
        <span
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.18em] font-semibold"
          style={{
            background: cardGradient,
            color: "#FFFFFF",
            WebkitTextFillColor: "#FFFFFF",
            border: `1px solid ${accentGlow}`,
            boxShadow: `0 10px 24px -12px ${accent}99`,
          }}
          data-no-contrast-guard
          data-allow-dark-cta
        >
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#FFFFFF" }} />
          Choose how to list {isRent ? "your rental" : "your property"}
        </span>
        <h2
          className="mt-4 text-2xl md:text-3xl font-bold tracking-tight"
          style={{ color: accent, WebkitTextFillColor: accent }}
          data-no-contrast-guard
        >
          How would you like to add your {isRent ? "rental" : "property"}?
        </h2>
        <p
          className="mt-2 text-sm md:text-base max-w-2xl mx-auto"
          style={{ color: INK + "B3" }}
        >
          Both options stay inside JBJ — your draft is auto-saved and you can come
          back to it at any time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <PickerCard
          onClick={() => onPick("manual")}
          icon={<ClipboardCheck className="w-6 h-6" style={{ color: "#FFFFFF" }} />}
          eyebrow={manualEyebrow}
          title={manualTitle}
          description={manualDesc}
          tag="≈ 4–6 minutes"
        />
        <PickerCard
          onClick={() => onPick("ai")}
          icon={<Wand2 className="w-6 h-6" style={{ color: "#FFFFFF" }} />}
          eyebrow={aiEyebrow}
          title={aiTitle}
          description={aiDesc}
          tag="≈ 60 seconds"
          accent
        />
      </div>


      <div className="text-center mt-6">
        <button
          type="button"
          onClick={() => onPick("browse")}
          className="text-sm font-medium underline-offset-4 hover:underline"
          style={{ color: accent }}
        >
          Or browse existing listings →
        </button>
      </div>
    </div>
  );
}

function PickerCard({
  onClick,
  icon,
  eyebrow,
  title,
  description,
  tag,
  accent,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tag: string;
  accent?: boolean;
}) {
  const NAVY = THEME_NAVY.primary;
  const NAVY_DEEP = THEME_NAVY.primaryDeep;
  const PURPLE = THEME_NAVY.badgeBorder; // #A855F7
  const cardGradient =
    `linear-gradient(135deg, ${NAVY_DEEP} 0%, ${NAVY} 55%, #0B0B0B 100%)`;
  return (
    <button
      type="button"
      onClick={onClick}
      data-no-contrast-guard
      data-allow-dark-cta
      className="group relative flex flex-col text-left rounded-2xl p-6 md:p-7 transition-all hover:brightness-110"
      style={{
        background: cardGradient,
        border: `1px solid ${PURPLE}`,
        boxShadow: `0 18px 40px -18px ${NAVY}AA`,
        color: "#FFFFFF",
        WebkitTextFillColor: "#FFFFFF",
      }}
    >
      {/* shimmer ombre glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: `radial-gradient(circle at 18% 18%, ${PURPLE}33 0%, transparent 60%)`,
        }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div
          className="w-12 h-12 rounded-xl grid place-items-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.10)",
            border: `1px solid ${PURPLE}66`,
          }}
        >
          {icon}
        </div>
        {accent && (
          <span
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "rgba(168,85,247,0.18)",
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              border: `1px solid ${PURPLE}`,
            }}
          >
            <Sparkles className="w-3 h-3" style={{ color: "#FFFFFF" }} /> Recommended
          </span>
        )}
      </div>

      <div className="relative mt-5">
        <div
          className="text-[10px] uppercase tracking-[0.22em] font-semibold"
          style={{ color: PURPLE, WebkitTextFillColor: PURPLE }}
        >
          {eyebrow}
        </div>
        <h3
          className="mt-1 text-xl md:text-2xl font-bold leading-tight"
          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
        >
          {title}
        </h3>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.88)", WebkitTextFillColor: "rgba(255,255,255,0.88)" }}
        >
          {description}
        </p>
      </div>

      <div className="relative mt-6 flex items-center justify-between">
        <span
          className="text-[11px] font-semibold rounded-md px-2 py-1"
          style={{
            backgroundColor: "rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.88)",
            WebkitTextFillColor: "rgba(255,255,255,0.88)",
            border: `1px solid ${PURPLE}55`,
          }}
        >
          {tag}
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-sm font-bold px-4 h-9 rounded-md group-hover:gap-2 transition-all"
          data-no-contrast-guard
          style={{
            background: "#FFFFFF",
            color: NAVY_DEEP,
            WebkitTextFillColor: NAVY_DEEP,
            border: `1.5px solid ${NAVY_DEEP}`,
            boxShadow: `0 6px 18px -8px rgba(168,85,247,0.55)`,
          }}
        >
          <span style={{ color: NAVY_DEEP, WebkitTextFillColor: NAVY_DEEP, fontWeight: 800 }}>Start</span>
          <span className="jj-arrow-anim inline-flex" style={{ color: NAVY_DEEP }}>
            <ArrowRight className="w-4 h-4" style={{ strokeWidth: 2.5, color: NAVY_DEEP }} />
          </span>
        </span>

      </div>
    </button>
  );
}



/* ───────────────── My Submissions Section (mode-aware) ───────────────── */
function MySubmissionsSection({ theme = THEME_NAVY }: { theme?: ModeTheme }) {
  const { user } = useAuth();
  const { listings, isLoading, fetchListings } = useSellerListings();
  const accent = theme.primary;

  useEffect(() => {
    if (user) fetchListings();
  }, [user, fetchListings]);

  return (
    <section
      id="my-submissions"
      className="scroll-mt-24 px-4 sm:px-6 md:px-10 py-12 md:py-16 relative overflow-hidden"
      data-no-contrast-guard
      data-allow-dark-cta
      style={{ background: theme.sectionGradient }}
    >
      {/* premium ombre shine */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 85% 12%, ${theme.badgeBorder}33 0%, transparent 55%)`,
        }}
      />
      <div className="relative max-w-6xl mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
          <div>
            <h2
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
              data-no-contrast-guard
            >
              My Listing Submissions
            </h2>
            <p
              className="mt-1 text-sm"
              style={{ color: "rgba(255,255,255,0.85)", WebkitTextFillColor: "rgba(255,255,255,0.85)" }}
              data-no-contrast-guard
            >
              Track the status of every property you've listed with JBJ. You'll
              receive an email update on every status change.
            </p>
          </div>

          {user && (
            <Button
              asChild
              data-allow-dark-cta
              data-no-contrast-guard
              className="font-semibold hover:brightness-105 jj-dashboard-pulse"
              style={{
                background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDeep} 100%)`,
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                border: `1.5px solid ${theme.badgeBorder}`,
                boxShadow: `0 10px 24px -10px ${theme.primaryDeep}`,
              }}
            >
              <Link to="/dashboard/my-listings">
                <LayoutDashboard className="w-4 h-4 mr-2" style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", fontWeight: 700 }}>Open full dashboard</span>
                <span className="jj-arrow-anim inline-flex ml-2" style={{ color: "#FFFFFF" }}><ArrowRight className="w-4 h-4" style={{ color: "#FFFFFF" }} /></span>

              </Link>
            </Button>
          )}
        </div>

        {!user ? (
          <div
            className="rounded-2xl p-8 text-center"
            data-no-contrast-guard
            style={{
              background: ombreSoft(theme),
              border: `1.5px solid ${theme.badgeBorder}`,
              boxShadow: `0 20px 40px -20px ${accent}66`,
            }}
          >

            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${theme.primaryDeep} 100%)`,
                border: `1px solid ${theme.badgeBorder}`,
              }}
            >
              <ShieldCheck className="w-7 h-7" style={{ color: "#FFFFFF" }} />
            </div>
            <h3
              className="text-xl md:text-2xl font-bold mb-2"
              style={{
                color: theme.primaryDeep,
                WebkitTextFillColor: theme.primaryDeep,
                letterSpacing: "-0.01em",
              }}
              data-no-contrast-guard
            >
              Sign in to track your submissions
            </h3>
            <p
              className="text-sm mb-5"
              style={{
                color: "#1A1A1A",
                WebkitTextFillColor: "#1A1A1A",
                opacity: 0.78,
              }}
              data-no-contrast-guard
            >
              Create a free account or sign in to view the live approval status of
              your property listings.
            </p>
            <Button
              asChild
              data-allow-dark-cta
              data-no-contrast-guard
              className="font-semibold border-0"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${theme.primaryDeep} 100%)`,
                color: "#FFFFFF",
              }}
            >
              <Link to="/login?redirect=/list-property%23my-submissions">
                <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Sign in to continue</span>
                <ArrowRight className="w-4 h-4 ml-2" style={{ color: "#FFFFFF" }} />
              </Link>
            </Button>
          </div>

        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl animate-pulse"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            data-no-contrast-guard
            style={{
              background: ombreSoft(theme),
              border: `1.5px dashed ${theme.badgeBorder}`,
              boxShadow: `0 20px 40px -20px ${accent}55`,
            }}
          >

            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${theme.primaryDeep} 100%)`,
                border: `1px solid ${theme.badgeBorder}`,
              }}
            >
              <Building2 className="w-7 h-7" style={{ color: "#FFFFFF" }} />
            </div>
            <h3
              className="text-xl md:text-2xl font-bold mb-2"
              style={{
                color: theme.primaryDeep,
                WebkitTextFillColor: theme.primaryDeep,
                letterSpacing: "-0.01em",
              }}
              data-no-contrast-guard
            >
              No submissions yet
            </h3>
            <p
              className="text-sm mb-5"
              style={{
                color: "#1A1A1A",
                WebkitTextFillColor: "#1A1A1A",
                opacity: 0.78,
              }}
              data-no-contrast-guard
            >
              Start your first listing above and it will appear here with full
              status tracking.
            </p>
          </div>

        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((l) => (
              <SubmissionCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────── Per-submission card ─────────────── */
function SubmissionCard({ listing }: { listing: any }) {
  const status = (listing.status || "draft").toLowerCase();
  const meta = statusMeta(status);
  const cover = listing.photo_urls?.[0];

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-lg"
      data-no-contrast-guard
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${BLUE}33`,
      }}
    >
      <div
        className="h-32 w-full flex items-center justify-center relative"
        style={{
          backgroundColor: CHAMPAGNE_RAISED,
          backgroundImage: cover ? `url(${cover})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!cover && <Building2 className="w-10 h-10" style={{ color: INK + "55" }} />}
        <Badge
          className="absolute top-2 right-2 text-[10px] font-bold border-0"
          style={{ backgroundColor: meta.bg, color: meta.fg }}
        >
          <meta.Icon className="w-3 h-3 mr-1" />
          {meta.label}
        </Badge>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h4 className="font-bold text-sm leading-snug line-clamp-2" style={{ color: INK }}>
          {listing.property_location || "Untitled property"}
        </h4>
        <div className="flex items-center gap-2 text-[11px]" style={{ color: INK + "99" }}>
          {listing.property_type && (
            <span className="capitalize">{listing.property_type}</span>
          )}
          {listing.bedrooms != null && (
            <>
              <span>·</span>
              <span>{listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} BR`}</span>
            </>
          )}
        </div>
        {listing.target_selling_price && (
          <div className="text-sm font-bold" style={{ color: INK }}>
            AED {Number(listing.target_selling_price).toLocaleString()}
          </div>
        )}
        <div className="text-[11px] mt-1" style={{ color: INK + "80" }}>
          Submitted {listing.submitted_at ? formatDate(listing.submitted_at) : formatDate(listing.created_at)}
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <Button
            asChild
            size="sm"
            data-allow-dark-cta
            data-no-contrast-guard
            className="font-semibold border-0 h-8 px-3 text-xs flex-1"
            style={{ backgroundColor: BLUE, color: "#FFFFFF" }}
          >
            <Link to={`/dashboard/my-listings?id=${listing.id}`}>
              <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>View details</span>
              <ArrowRight className="w-3 h-3 ml-1" style={{ color: "#FFFFFF" }} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── status → label / colors / icon ─────────────── */
function statusMeta(status: string) {
  switch (status) {
    case "live":
    case "published":
    case "active":
      return { label: "Live", bg: "#DCFCE7", fg: "#15803D", Icon: CheckCircle2 };
    case "approved":
      return { label: "Approved", bg: "#DCFCE7", fg: "#15803D", Icon: CheckCircle2 };
    case "rejected":
    case "declined":
      return { label: "Declined", bg: "#FEE2E2", fg: "#B91C1C", Icon: XCircle };
    case "request_edit":
    case "revision_needed":
    case "info_requested":
    case "changes_requested":
      return { label: "Changes Requested", bg: "#FEF3C7", fg: "#92400E", Icon: AlertCircle };
    case "under_review":
    case "screening":
    case "submitted":
      return { label: "Under Review", bg: "#DBEAFE", fg: "#1D4ED8", Icon: Clock };
    case "draft":
    default:
      return { label: "Draft", bg: "#EFE6D6", fg: "#1A1A1A", Icon: Clock };
  }
}

export default ListProperty;
