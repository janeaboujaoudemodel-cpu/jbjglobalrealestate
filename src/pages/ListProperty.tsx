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
const BLUE = "#102540";
const BLUE_HOVER = "#1a3d63";
const BLUE_DEEP = "#0B1B33";
const BLUE_GRADIENT =
  "linear-gradient(135deg, #0B1B33 0%, #102540 50%, #1a3d63 100%)";
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

const ListProperty = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = (searchParams.get("mode") as Mode) || "pick";
  const purpose = (searchParams.get("purpose") as Purpose) || "sale";

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
    setSearchParams(sp, { replace: false });
  };

  const setPurpose = (next: Purpose) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("purpose", next);
    if (!sp.get("mode")) sp.set("mode", mode);
    setSearchParams(sp, { replace: false });
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
        title="List Your Property — JBJ Global Real Estate"
        description="List your property for sale or rent with JBJ Global Real Estate. Use AI to auto-generate your listing, or fill in manually. Track approval status from your dashboard."
        canonicalPath="/list-property"
      />

      <div className="px-2 sm:px-4 md:px-6 py-4 md:py-6">
        <AnimatedBorderShell tone="navy" bare>
        <div style={{ backgroundColor: CHAMPAGNE }}>

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
              JBJ Seller Portal
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
              List Your Property
            </h1>
            <p
              className="mt-4 text-base sm:text-lg max-w-2xl mx-auto"
              style={{ color: "rgba(255,255,255,0.88)" }}
              data-no-contrast-guard
            >
              Priority listing with JBJ Global Real Estate — premium reach, full
              AI assistance, transparent approval, and live status in your
              dashboard.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setMode("manual")}
                data-allow-dark-cta
                data-no-contrast-guard
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md text-sm font-semibold w-full sm:w-auto transition-colors hover:brightness-110"
                style={{
                  backgroundColor: "#15803D",
                  color: "#FFFFFF",
                  border: "1px solid #15803D",
                  WebkitTextFillColor: "#FFFFFF",
                  boxShadow: "0 10px 28px -12px rgba(21,128,61,0.55)",
                }}
              >
                <ClipboardCheck className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>List Manually</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("ai")}
                data-allow-dark-cta
                data-no-contrast-guard
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-md text-sm font-semibold w-full sm:w-auto transition-colors hover:brightness-110"
                style={{
                  backgroundColor: "#5B21B6",
                  color: "#FFFFFF",
                  border: "1px solid #A855F7",
                  WebkitTextFillColor: "#FFFFFF",
                  boxShadow: "0 10px 28px -12px rgba(91,33,182,0.55)",
                }}
              >
                <Wand2 className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>List with AI</span>
                <Sparkles className="w-3.5 h-3.5" style={{ color: "#FFFFFF" }} />
              </button>
              <a
                href="#my-submissions"
                className="jj-white-ring inline-flex items-center gap-2 px-5 h-11 text-sm font-semibold transition-all hover:brightness-110"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: "#FFFFFF",
                  WebkitTextFillColor: "#FFFFFF",
                }}
                data-no-contrast-guard
                data-allow-dark-cta
              >
                View my submissions →
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────────────── Purpose + Mode selector (mode-aware accent) ───────────────── */}
      <section className="px-4 sm:px-6 md:px-10 mt-8 md:mt-10 pb-8 md:pb-10 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-2xl p-4 sm:p-6 md:p-7 shadow-xl"
            style={{
              backgroundColor: "#FFFFFF",
              border: `1.5px solid ${theme.primary}`,
              boxShadow: `0 18px 40px -22px ${theme.primary}66`,
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-2"
                  style={{ color: theme.primary }}>
                  Purpose
                </div>
                <div className="flex items-center gap-2 flex-wrap">
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

              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-2"
                  style={{ color: theme.primary }}>
                  How would you like to list?
                </div>
                <div className="flex items-center gap-2 flex-wrap">
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
          </div>
        </div>
      </section>

      {/* ─────────────────── Active form / browser / picker ─────────────────── */}
      <section
        className={
          mode === "ai"
            ? "w-full pt-4 pb-6"
            : "px-2 sm:px-4 md:px-6 pt-8 pb-12"
        }
      >
        {mode === "pick" || !ActiveTab ? (
          <PremiumModePicker onPick={setMode} />
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
        </AnimatedBorderShell>
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
  const fg = active ? "#FFFFFF" : theme.primary;
  return (
    <button
      type="button"
      onClick={onClick}
      data-allow-dark-cta
      data-no-contrast-guard
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 hover:brightness-110"
      style={
        active
          ? {
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDeep} 100%)`,
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              border: `1px solid ${theme.primaryDeep}`,
              boxShadow: `0 10px 24px -12px ${theme.primary}99`,
            }
          : {
              backgroundColor: "#FFFFFF",
              color: theme.primary,
              WebkitTextFillColor: theme.primary,
              border: `1.5px solid ${theme.primary}`,
            }
      }
    >
      <span style={{ color: fg, WebkitTextFillColor: fg, display: "inline-flex" }}>{icon}</span>
      <span style={{ color: fg, WebkitTextFillColor: fg }}>{children}</span>
      {trailing && (
        <span style={{ color: fg, WebkitTextFillColor: fg, display: "inline-flex" }}>{trailing}</span>
      )}
    </button>
  );
}

/* ───────────────── Premium two-card mode picker ───────────────── */
function PremiumModePicker({ onPick }: { onPick: (m: Mode) => void }) {
  // Pick screen uses the navy hero theme as its accent system, so cards
  // visually match the band above. Inner Start CTAs are white-fill / navy-ink.
  const accent = THEME_NAVY.primary;          // #102540
  const accentDeep = THEME_NAVY.primaryDeep;  // #0B1B33
  const accentGlow = THEME_NAVY.badgeBorder;  // purple #A855F7
  const cardGradient =
    `linear-gradient(135deg, ${accentDeep} 0%, ${accent} 55%, #0B0B0B 100%)`;

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
          Choose how to list
        </span>
        <h2
          className="mt-4 text-2xl md:text-3xl font-bold tracking-tight"
          style={{ color: accent, WebkitTextFillColor: accent }}
          data-no-contrast-guard
        >
          How would you like to add your property?
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
          eyebrow="Full Control"
          title="List Manually"
          description="Fill in every field yourself — price, location, photos, amenities and contact preferences. Best when you already have the full property details ready."
          tag="≈ 4–6 minutes"
        />
        <PickerCard
          onClick={() => onPick("ai")}
          icon={<Wand2 className="w-6 h-6" style={{ color: "#FFFFFF" }} />}
          eyebrow="AI-Assisted"
          title="List with AI"
          description="Paste any portal link, brochure or short description. Our AI auto-fills the listing in seconds — you only review and confirm before submitting."
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
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 h-9 rounded-md group-hover:gap-2 transition-all"
          style={{
            backgroundColor: "#FFFFFF",
            color: NAVY,
            WebkitTextFillColor: NAVY,
            border: `1px solid ${PURPLE}`,
            boxShadow: `0 6px 18px -8px rgba(255,255,255,0.45)`,
          }}
        >
          Start
          <ArrowRight className="w-4 h-4" style={{ color: NAVY }} />
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
          background: `radial-gradient(circle at 85% 12%, ${theme.iconAccent}26 0%, transparent 55%)`,
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
              style={{ color: "rgba(255,255,255,0.85)" }}
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
              className="font-semibold border-0 hover:brightness-95"
              style={{
                backgroundColor: "#FFFFFF",
                color: accent,
                border: `1px solid ${theme.badgeBorder}`,
              }}
            >
              <Link to="/dashboard/my-listings">
                <LayoutDashboard className="w-4 h-4 mr-2" style={{ color: accent }} />
                <span style={{ color: accent, WebkitTextFillColor: accent }}>Open full dashboard</span>
              </Link>
            </Button>
          )}
        </div>

        {!user ? (
          <div
            className="rounded-2xl p-8 text-center"
            data-no-contrast-guard
            style={{
              backgroundColor: "#FFFFFF",
              border: `1.5px solid ${accent}`,
              boxShadow: `0 20px 40px -20px ${accent}66`,
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${theme.primaryDeep} 100%)`,
                border: `1px solid ${accent}`,
              }}
            >
              <ShieldCheck className="w-7 h-7" style={{ color: "#FFFFFF" }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: accent }} data-no-contrast-guard>
              Sign in to track your submissions
            </h3>
            <p className="text-sm mb-5" style={{ color: INK + "B3" }}>
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
              backgroundColor: "#FFFFFF",
              border: `1.5px dashed ${accent}`,
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${theme.primaryDeep} 100%)`,
                border: `1px solid ${accent}`,
              }}
            >
              <Building2 className="w-7 h-7" style={{ color: "#FFFFFF" }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: accent }} data-no-contrast-guard>
              No submissions yet
            </h3>
            <p className="text-sm mb-5" style={{ color: INK + "99" }}>
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
