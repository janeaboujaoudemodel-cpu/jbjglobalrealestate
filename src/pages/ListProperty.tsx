import { lazy, Suspense, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Wand2, ClipboardCheck, Eye, Tag, Key, LayoutDashboard } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { Button } from "@/components/ui/button";

const ManualWizard = lazy(() => import("@/pages/SellerListing"));
const AIWizard = lazy(() => import("@/pages/ListingPortalSubmit"));
const BrowseListings = lazy(() => import("@/pages/ListingPortal"));

type Mode = "manual" | "ai" | "browse";
type Purpose = "sale" | "rent";

const ListProperty = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = (searchParams.get("mode") as Mode) || "ai";
  const purpose = (searchParams.get("purpose") as Purpose) || "sale";

  useEffect(() => {
    // Ensure both params are always present so deep links share consistent state
    if (!searchParams.get("mode") || !searchParams.get("purpose")) {
      const next = new URLSearchParams(searchParams);
      if (!next.get("mode")) next.set("mode", "ai");
      if (!next.get("purpose")) next.set("purpose", "sale");
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
      default:
        return AIWizard;
    }
  }, [mode]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      <SEOHead
        title="List Your Property — JBJ Global Real Estate"
        description="List your property for sale or rent with JBJ Global Real Estate. Use AI to auto-generate your listing, or fill in manually. Track approval status from your dashboard."
        canonicalUrl="/list-property"
      />

      {/* Hero band */}
      <section className="px-6 md:px-10 pt-[112px] pb-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl px-6 md:px-10 py-8"
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                List Your Property
              </h1>
              <p className="mt-2 text-[#1A1A1A]/70 max-w-2xl">
                Priority listing with JBJ Global Real Estate — premium reach, full
                AI assistance, transparent approval, and live status in your
                dashboard.
              </p>
            </div>
            <Button asChild variant="outline" className="border-[#B89555]/40">
              <Link to="/dashboard/my-listings">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                View my listings
              </Link>
            </Button>
          </div>

          {/* Purpose toggle */}
          <div className="mt-6 flex items-center gap-2">
            <span className="text-sm text-[#1A1A1A]/60 mr-2">Purpose</span>
            <PurposePill active={purpose === "sale"} onClick={() => setPurpose("sale")} icon={<Tag className="w-4 h-4" />}>
              For Sale
            </PurposePill>
            <PurposePill active={purpose === "rent"} onClick={() => setPurpose("rent")} icon={<Key className="w-4 h-4" />}>
              For Rent
            </PurposePill>
          </div>

          {/* Mode tabs */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ModeTab active={mode === "manual"} onClick={() => setMode("manual")} icon={<ClipboardCheck className="w-4 h-4" />}>
              List Manually
            </ModeTab>
            <ModeTab active={mode === "ai"} onClick={() => setMode("ai")} icon={<Wand2 className="w-4 h-4" />}>
              <span className="flex items-center gap-1.5">
                List with AI
                <Sparkles className="w-3.5 h-3.5 text-[#B89555]" />
              </span>
            </ModeTab>
            <ModeTab active={mode === "browse"} onClick={() => setMode("browse")} icon={<Eye className="w-4 h-4" />}>
              Browse Listings
            </ModeTab>
          </div>
        </motion.div>
      </section>

      {/* Active mode content */}
      <section className="px-2 md:px-6 pb-16">
        <Suspense fallback={<div className="py-24"><BrandedLoader /></div>}>
          <ActiveTab key={`${mode}-${purpose}`} />
        </Suspense>
      </section>
    </div>
  );
};

function PurposePill({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
        active
          ? "bg-[#EFE6D6] border border-[#B89555]/60 text-[#1A1A1A] shadow-sm"
          : "bg-transparent border border-[#B89555]/20 text-[#1A1A1A]/70 hover:border-[#B89555]/40",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

function ModeTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
        active
          ? "bg-[#EFE6D6] border border-[#B89555]/60 text-[#1A1A1A] shadow-sm"
          : "bg-[#FDFBF7] border border-[#B89555]/20 text-[#1A1A1A]/75 hover:border-[#B89555]/40",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

export default ListProperty;
