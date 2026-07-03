/**
 * /list-property — Single canonical entry point for all property listings.
 *
 * - Premium emerald hero band using the locked JBJ emerald ombré
 * - One unified card with Purpose (Sale/Rent) + Mode (Manual / AI / Browse) segmented controls
 * - Active form renders below based on selection
 * - "My Submissions" section pulls live data from seller_listings via useSellerListings
 *   so users can track status of every application (Pending / Approved / Declined / Live)
 * - Fully responsive (mobile → desktop), champagne surfaces, gold hairlines, no broken contrast
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
import { ToolAnimatedFrame } from "@/components/tools/PremiumToolShell";
import { toolThemes } from "@/components/tools/toolThemes";

const ManualWizard = lazy(() => import("@/pages/SellerListing"));
const AIWizard = lazy(() => import("@/pages/ListingPortalSubmit"));
const BrowseListings = lazy(() => import("@/pages/ListingPortal"));

type Mode = "pick" | "manual" | "ai" | "browse";
type Purpose = "sale" | "rent";

/* ────────────────────────────── brand tokens ────────────────────────────── */
const EMERALD = "#064E3B";
const EMERALD_DEEP = "#042C1C";
const EMERALD_BLACK = "#000000";
const EMERALD_GRADIENT = "var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%))";
const EMERALD_GRADIENT_HOVER = "var(--jj-emerald-ombre-hover, linear-gradient(135deg, #0a6b53 0%, #064E3B 58%, #042c1c 100%))";
const GOLD = "rgba(1,8,6,0.72)";
/* PASS 152 — no champagne inside AI tool shells. Constants below map to emerald ombré. */
const CHAMPAGNE = "linear-gradient(135deg, #065F46 0%, #04231A 55%, #000000 100%)";
const CHAMPAGNE_SURFACE = "linear-gradient(135deg, #065F46 0%, #04231A 55%, #000000 100%)";
const CHAMPAGNE_RAISED = "linear-gradient(135deg, #075e46 0%, #052c1c 55%, #000000 100%)";
const INK = "#1A1A1A";
const WHITE = "#FFFFFF";

/* per-mode accent system: every listing mode uses the locked emerald palette. */
type ModeTheme = {
  name: "emerald";
  primary: string;       // solid accent
  primaryDeep: string;   // deeper variant
  badgeBorder: string;   // accent border for pills/badges
  badgeBg: string;       // translucent fill behind accent
  heroGradient: string;  // hero band background
  sectionGradient: string; // My Submissions band background
  ctaText: string;       // CTA text color over solid primary
  iconAccent: string;    // sparkle / leaf icon color
};
const THEME_EMERALD: ModeTheme = {
  name: "emerald",
  primary: EMERALD,
  primaryDeep: EMERALD_DEEP,
  badgeBorder: GOLD,
  badgeBg: "rgba(255,255,255,0.10)",
  heroGradient: EMERALD_GRADIENT,
  sectionGradient: `linear-gradient(180deg, ${CHAMPAGNE} 0%, ${CHAMPAGNE_SURFACE} 100%)`,
  ctaText: WHITE,
  iconAccent: WHITE,
};
const THEME_BRAND = THEME_EMERALD;
const themeForMode = (_m: Mode): ModeTheme => THEME_BRAND;

/* Soft mode-tinted ombre used for "white" surfaces (Purpose card, empty
   states, "Open full dashboard" pill) so they match the page's accent
   instead of reading as harsh pure white. */
const ombreSoft = (t: ModeTheme): string => {
  return `linear-gradient(135deg, ${CHAMPAGNE} 0%, ${CHAMPAGNE_SURFACE} 55%, ${CHAMPAGNE_RAISED} 100%)`;
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
    `radial-gradient(circle at 18% 18%, rgba(255,255,255,0.12) 0%, transparent 60%)`;

  return (
    <ToolAnimatedFrame theme={toolThemes.emerald}>
    <div
      className="min-h-screen"
      style={{ color: WHITE, background: "linear-gradient(180deg, #022C22 0%, #064E3B 50%, #0B0B0B 100%)" }}
      data-listing-mode={theme.name}
      data-list-property-page
      data-surface="dark"
      data-no-contrast-guard
    >
      <style>{`
        [data-list-property-page], [data-list-property-page] * { border-color: rgba(255,255,255,0.22) !important; }
        [data-list-property-page] [style*="#FDFBF7" i],
        [data-list-property-page] .bg-\\[\\#FDFBF7\\],
        [data-list-property-page] [class*="from-gold"],
        [data-list-property-page] [class*="border-\\[\\#B89555"] { background: transparent !important; }
        [data-list-property-page] [data-manual-listing-shell] { background: linear-gradient(135deg, #022C22 0%, #064E3B 50%, #0B0B0B 100%) !important; }
      `}</style>
      <SEOHead
        title={purpose === "rent" ? "List Your Property for Rent — JBJ Global Real Estate" : "List Your Property for Sale — JBJ Global Real Estate"}
        description="List your property for sale or rent with JBJ Global Real Estate. Use AI to auto-generate your listing, or fill in manually. Track approval status from your dashboard."
        canonicalPath="/list-property"
      />

      {/* Full-bleed: no outer chrome — every <section> below renders edge-to-edge */}
      <div className="w-full" style={{ background: "linear-gradient(180deg, #022C22 0%, #064E3B 50%, #0B0B0B 100%)" }}>




      {/* ───────────────────── Hero — mode-aware gradient ───────────────────── */}
      <section
        className="relative w-full"
        data-surface="dark"
        data-allow-dark-cta
        data-no-contrast-guard
        style={{ background: theme.heroGradient }}
      >
        {/* Hero is intentionally clean emerald — no gold hairline, no radial glow */}

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
                color: WHITE,
                WebkitTextFillColor: WHITE,
                border: `1px solid ${GOLD}`,
              }}
              data-no-contrast-guard
            >
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: WHITE }} />
              {purpose === "rent" ? "JBJ Landlord Portal" : "JBJ Seller Portal"}
            </span>
            <h1
              className="mt-5 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
              style={{
                color: WHITE,
                WebkitTextFillColor: WHITE,
                textShadow: "0 2px 18px rgba(0,0,0,0.35)",
                letterSpacing: "-0.02em",
              }}
              data-no-contrast-guard
            >
              Welcome, {firstName}
            </h1>
            <p
              className="mt-4 text-base sm:text-lg max-w-2xl mx-auto"
              style={{ color: "rgba(255,255,255,0.92)", WebkitTextFillColor: "rgba(255,255,255,0.92)" }}
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
              background: CHAMPAGNE,
              border: `1px solid ${GOLD}`,
              boxShadow: `0 18px 40px -22px rgba(6,78,59,0.32)`,
            }}
          >
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-start">
              {/* Purpose */}
              <div className="xl:col-span-4">
                <div
                  className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3"
                  style={{ color: theme.primary }}
                >
                  Purpose
                </div>
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 132px), 1fr))" }}
                >
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
              <div className="xl:col-span-8">
                <div
                  className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3"
                  style={{ color: theme.primary }}
                >
                  How would you like to list?
                </div>
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))" }}
                >
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
                    theme={THEME_BRAND}
                    trailing={<Sparkles className="w-3 h-3" />}
                  >
                    AI-Assisted
                  </SegmentedPill>
                  <SegmentedPill
                    active={mode === "browse"}
                    onClick={() => setMode("browse")}
                    icon={<Eye className="w-4 h-4" />}
                    theme={THEME_BRAND}
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
                  background: "linear-gradient(135deg, rgba(8,18,13,0.96) 0%, rgba(3,8,5,0.98) 58%, rgba(0,0,0,1) 100%)",
                  color: WHITE,
                  WebkitTextFillColor: WHITE,
                  border: "1px solid rgba(255,255,255,0.42)",
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
    </ToolAnimatedFrame>
  );
};

/* ────────────────── Segmented pill control (mode-aware) ────────────────── */
function SegmentedPill({
  active,
  onClick,
  icon,
  children,
  theme = THEME_BRAND,
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
  return (
    <button
      type="button"
      onClick={onClick}
      data-no-contrast-guard
      {...(active ? { "data-allow-dark-cta": true } : {})}
      data-listing-pill={active ? "active" : "inactive"}
      className="jj-listing-pill inline-flex items-center justify-center gap-2 w-full h-10 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-150 hover:brightness-110"
      style={
        active
          ? {
              background: EMERALD_GRADIENT,
              color: WHITE,
              WebkitTextFillColor: WHITE,
              ["--jj-pill-fg" as any]: WHITE,
              border: `1px solid ${theme.primaryDeep}`,
              boxShadow: `0 10px 24px -12px ${theme.primary}99`,
            }
          : {
              background: "linear-gradient(135deg, rgba(8,18,13,0.96) 0%, rgba(3,8,5,0.98) 58%, rgba(0,0,0,1) 100%)",
              color: WHITE,
              WebkitTextFillColor: WHITE,
              ["--jj-pill-fg" as any]: WHITE,
              border: "1px solid rgba(255,255,255,0.42)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
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
  const accent = THEME_BRAND.primary;
  const accentDeep = THEME_BRAND.primaryDeep;
  const accentGlow = GOLD;
  const cardGradient = EMERALD_GRADIENT;

  // Purpose-aware copy: sale → Seller, rent → Landlord
  const isRent = purpose === "rent";
  const manualTitle = isRent ? "I'll Fill Rental Details Myself" : "I'll Fill Property Details Myself";
  const manualEyebrow = "Manual · Full Control";
  const manualDesc = isRent
    ? "You type every field yourself — monthly rent, location, photos, amenities and tenant preferences. Best when you already have the rental information ready."
    : "You type every field yourself — price, location, photos, amenities and buyer preferences. Best when you already have the property information ready.";
  const aiTitle = isRent ? "Let AI Fill My Rental for Me" : "Let AI Fill My Listing for Me";
  const aiEyebrow = "AI-Assisted · Fastest";
  const aiDesc = isRent
    ? "Paste any portal link, tenancy contract or short description. AI auto-fills the rental listing in seconds — you just review, edit if needed, and submit."
    : "Paste any portal link, brochure or short description. AI auto-fills the listing in seconds — you just review, edit if needed, and submit.";

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-0">
      <div className="text-center mb-7">
        <span
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.18em] font-semibold"
          style={{
            background: cardGradient,
            color: WHITE,
            WebkitTextFillColor: WHITE,
            border: `1px solid ${accentGlow}`,
            boxShadow: `0 10px 24px -12px ${accent}99`,
          }}
          data-no-contrast-guard
          data-allow-dark-cta
        >
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: WHITE }} />
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
          className="mt-2 text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
          style={{ color: INK + "B3" }}
        >
          Both options stay inside JBJ — your draft is auto-saved and you can come
          back to it at any time.
        </p>
      </div>

      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}
      >
        <PickerCard
          onClick={() => onPick("manual")}
          icon={<ClipboardCheck className="w-6 h-6" style={{ color: WHITE }} />}
          eyebrow={manualEyebrow}
          title={manualTitle}
          description={manualDesc}
          tag="≈ 4–6 minutes"
        />
        <PickerCard
          onClick={() => onPick("ai")}
          icon={<Wand2 className="w-6 h-6" style={{ color: WHITE }} />}
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
  const cardGradient = EMERALD_GRADIENT;
  return (
    <button
      type="button"
      onClick={onClick}
      data-no-contrast-guard
      data-allow-dark-cta
      data-listing-choice-card
      className="group relative flex w-full min-w-0 min-h-[306px] flex-col text-left rounded-2xl p-6 md:p-7 transition-all hover:brightness-110 whitespace-normal overflow-hidden"
      style={{
        background: cardGradient,
        border: `1px solid rgba(255,255,255,0.10)`,
        boxShadow: `0 18px 40px -18px rgba(6,78,59,0.68)`,
        color: WHITE,
        WebkitTextFillColor: WHITE,
      }}
    >
      <div className="relative flex w-full min-w-0 items-start justify-between gap-4">
        <div
          className="w-12 h-12 rounded-xl grid place-items-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            border: `1px solid rgba(255,255,255,0.14)`,
          }}
        >
          {icon}
        </div>
        {accent && (
          <span
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              color: WHITE,
              WebkitTextFillColor: WHITE,
              border: `1px solid rgba(255,255,255,0.14)`,
            }}
          >
            <Sparkles className="w-3 h-3" style={{ color: WHITE }} /> Recommended
          </span>
        )}
      </div>


      <div className="relative mt-5 w-full min-w-0 whitespace-normal">
        <div
          className="text-[10px] uppercase tracking-[0.22em] font-semibold"
          style={{ color: "rgba(255,255,255,0.78)", WebkitTextFillColor: "rgba(255,255,255,0.78)" }}
        >
          {eyebrow}
        </div>
        <h3
          className="mt-1 text-xl md:text-2xl font-bold leading-tight"
          style={{ color: WHITE, WebkitTextFillColor: WHITE }}
        >
          {title}
        </h3>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.92)", WebkitTextFillColor: "rgba(255,255,255,0.92)", overflowWrap: "break-word" }}
        >
          {description}
        </p>
      </div>

      <div className="relative mt-auto pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <span
          className="text-[11px] font-semibold rounded-md px-2 py-1"
          style={{
            backgroundColor: "rgba(255,255,255,0.10)",
            color: "rgba(255,255,255,0.88)",
            WebkitTextFillColor: "rgba(255,255,255,0.88)",
            border: `1px solid rgba(1,8,6,0.72)`,
          }}
        >
          {tag}
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-sm font-bold px-4 h-9 rounded-md group-hover:gap-2 transition-all"
          data-no-contrast-guard
          style={{
            background: CHAMPAGNE,
            color: EMERALD_DEEP,
            WebkitTextFillColor: EMERALD_DEEP,
            border: `1px solid rgba(255,255,255,0.14)`,
            boxShadow: `0 6px 18px -8px rgba(0,0,0,0.55)`,
          }}
        >
          <span style={{ color: EMERALD_DEEP, WebkitTextFillColor: EMERALD_DEEP, fontWeight: 800 }}>Start</span>
          <span className="jj-arrow-anim inline-flex" style={{ color: EMERALD_DEEP }}>
            <ArrowRight className="w-4 h-4" style={{ strokeWidth: 2.5, color: EMERALD_DEEP }} />
          </span>
        </span>

      </div>
    </button>
  );
}



/* ───────────────── My Submissions Section (mode-aware) ───────────────── */
function MySubmissionsSection({ theme = THEME_BRAND }: { theme?: ModeTheme }) {
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
      {/* Solid emerald — no shine overlay */}

      <div className="relative max-w-6xl mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
          <div>
            <h2
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{ color: INK, WebkitTextFillColor: INK }}
              data-no-contrast-guard
            >
              My Listing Submissions
            </h2>
            <p
              className="mt-1 text-sm"
              style={{ color: INK + "B3", WebkitTextFillColor: INK + "B3" }}
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
                background: EMERALD_GRADIENT,
                color: WHITE,
                WebkitTextFillColor: WHITE,
                border: `1px solid ${GOLD}`,
                boxShadow: `0 10px 24px -10px ${theme.primaryDeep}`,
              }}
            >
              <Link to="/dashboard/my-listings">
                <LayoutDashboard className="w-4 h-4 mr-2" style={{ color: WHITE }} />
                <span style={{ color: WHITE, WebkitTextFillColor: WHITE, fontWeight: 700 }}>Open full dashboard</span>
                <span className="jj-arrow-anim inline-flex ml-2" style={{ color: WHITE }}><ArrowRight className="w-4 h-4" style={{ color: WHITE }} /></span>

              </Link>
            </Button>
          )}
        </div>

        {!user ? (
          <div
            className="rounded-2xl p-8 text-center"
            data-no-contrast-guard
            data-allow-dark-cta
            style={{
              background: EMERALD_GRADIENT,
              border: `1.5px solid rgba(255,255,255,0.26)`,
              boxShadow: `0 24px 54px -24px rgba(0,0,0,0.82), inset 0 1px 0 rgba(255,255,255,0.18)`,
            }}
          >

            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%)`,
                border: `1px solid rgba(255,255,255,0.34)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16)`,
              }}
            >
              <ShieldCheck className="w-7 h-7" style={{ color: "#FFFFFF" }} />
            </div>
            <h3
              className="text-xl md:text-2xl font-bold mb-2"
              style={{
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                letterSpacing: "-0.01em",
                textShadow: "0 2px 12px rgba(0,0,0,0.32)",
              }}
              data-no-contrast-guard
            >
              Sign in to track your submissions
            </h3>
            <p
              className="text-sm mb-5"
              style={{
                color: "rgba(255,255,255,0.9)",
                WebkitTextFillColor: "rgba(255,255,255,0.9)",
                opacity: 1,
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
            data-allow-dark-cta
            style={{
              background: EMERALD_GRADIENT,
              border: `1.5px solid rgba(255,255,255,0.26)`,
              boxShadow: `0 24px 54px -24px rgba(0,0,0,0.82), inset 0 1px 0 rgba(255,255,255,0.18)`,
            }}
          >

            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%)`,
                border: `1px solid rgba(255,255,255,0.34)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16)`,
              }}
            >
              <Building2 className="w-7 h-7" style={{ color: "#FFFFFF" }} />
            </div>
            <h3
              className="text-xl md:text-2xl font-bold mb-2"
              style={{
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                letterSpacing: "-0.01em",
                textShadow: "0 2px 12px rgba(0,0,0,0.32)",
              }}
              data-no-contrast-guard
            >
              No submissions yet
            </h3>
            <p
              className="text-sm mb-5"
              style={{
                color: "rgba(255,255,255,0.9)",
                WebkitTextFillColor: "rgba(255,255,255,0.9)",
                opacity: 1,
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
        backgroundColor: CHAMPAGNE,
        border: `1px solid ${GOLD}`,
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
            style={{ background: EMERALD_GRADIENT, color: WHITE, WebkitTextFillColor: WHITE, border: `1px solid ${GOLD}` }}
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
