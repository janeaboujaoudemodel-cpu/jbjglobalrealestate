import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Upload, FolderOpen, PartyPopper, ListChecks, Briefcase, FileSignature, CheckCircle2, Clock, XCircle, ArrowRight, Rocket, LayoutDashboard, CalendarCheck, TrendingUp, BarChart3, Calculator, Home, Search, PieChart, GraduationCap, Brain, Target, Star, Zap, Headphones } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PearlButton } from "@/components/ui/pearl-button";
import { useUserModeContext } from "@/contexts/UserModeContext";

type RegStatus = "pending" | "under_review" | "approved" | "rejected" | null;

function useDevRegistration() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dev-registration-status", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_registrations")
        .select("status")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      return (data?.status as RegStatus) ?? null;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

function useBrokerRegistration() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["broker-registration-exists", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("broker_profiles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return (count ?? 0) > 0;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}

function useInvestorRegistration() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["investor-registration-exists", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("investor_intake")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return (count ?? 0) > 0;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
}


// devBenefits / investorBenefits grids removed: unregistered users no longer
// see *any* portal pitch — the section is rendered empty until they actually
// register for that category. The Complete Your Profile prompt + the homepage
// CategorySelectorSection handle the onboarding nudge instead.


const shortcuts = [
  { label: "Submit Project", desc: "Upload brochures & renders", icon: Upload, href: "/developer-portal?tab=submit" },
  { label: "Submit Event", desc: "Invite us to launches", icon: PartyPopper, href: "/developer-portal?tab=events" },
  { label: "My Projects", desc: "Track submission status", icon: FolderOpen, href: "/developer-portal?tab=projects" },
  { label: "My Events", desc: "Manage your launch events", icon: CalendarCheck, href: "/developer-hub/events" },
  { label: "Developer Dashboard", desc: "Your developer overview", icon: LayoutDashboard, href: "/developer-hub" },
  { label: "Check Listings", desc: "View live listings", icon: ListChecks, href: "/developer-portal?tab=listings" },
  { label: "Request Briefing", desc: "Schedule a project briefing", icon: Briefcase, href: "/developer-portal?tab=briefing" },
  { label: "Agreements", desc: "Sign & review documents", icon: FileSignature, href: "/developer-portal?tab=agreements" },
];

const investorShortcuts = [
  { label: "Browse Properties", desc: "Explore verified listings", icon: Home, href: "/properties" },
  { label: "AI Home Finder", desc: "Get personalized matches", icon: Search, href: "/quiz" },
  { label: "ROI Calculator", desc: "Analyze investment returns", icon: Calculator, href: "/ai-roi-calculator" },
  { label: "Market Intelligence", desc: "Data-driven insights", icon: BarChart3, href: "/market-intelligence/overview" },
  { label: "Property Evaluator", desc: "AI-powered valuations", icon: TrendingUp, href: "/property-evaluator" },
  { label: "Investor Dashboard", desc: "Track your portfolio", icon: PieChart, href: "/investor-dashboard" },
  { label: "Investment Advisory", desc: "Expert guidance", icon: Briefcase, href: "/services/investment-advisory" },
  { label: "Education Hub", desc: "Guides & resources", icon: CheckCircle2, href: "/education-hub" },
];

const brokerShortcuts = [
  { label: "Broker Dashboard", desc: "Performance metrics & analytics", icon: LayoutDashboard, href: "/broker-dashboard" },
  { label: "CRM", desc: "Lead management & pipeline", icon: Briefcase, href: "/crm" },
  { label: "Listing Portal", desc: "Submit & manage listings", icon: ListChecks, href: "/listing-portal" },
  { label: "JBJ Academy", desc: "Education & certifications", icon: GraduationCap, href: "/jbj-academy" },
  { label: "AI Assistant", desc: "AI-powered sales & support", icon: Brain, href: "/ai-hub" },
  { label: "Objection Handler", desc: "AI objection scripts", icon: Target, href: "/ai-objection-handler" },
  { label: "Royal Tools", desc: "Stamp, E-Sign, Logo & more", icon: Zap, href: "/broker-toolkit" },
  { label: "Market Intelligence", desc: "Market data & insights", icon: TrendingUp, href: "/market-intelligence" },
  { label: "Broker Resources", desc: "Templates & materials", icon: Star, href: "/broker-resources" },
  { label: "Support Hub", desc: "Submit tickets & get help", icon: Headphones, href: "/ticket-hub" },
];


const DeveloperPortalCTA = () => {
  const { user } = useAuth();
  const { isLoading: isModeLoading, isDeveloperMode, isInvestorMode, isBrokerMode } = useUserModeContext();

  // Per-category registration probes. Only the probe matching the active mode
  // actually fires (others are disabled below).
  const devReg = useDevRegistration();
  const brokerReg = useBrokerRegistration();
  const investorReg = useInvestorRegistration();

  const status = devReg.data ?? null;
  const isApproved = status === "approved";
  const isPending = status === "pending" || status === "under_review";
  const isRejected = status === "rejected";

  const storageKey = user ? `dev-approval-seen-${user.id}` : null;
  const [hasSeenApproval, setHasSeenApproval] = useState(true);

  useEffect(() => {
    if (storageKey && isApproved) {
      const seen = localStorage.getItem(storageKey) === "true";
      setHasSeenApproval(seen);
    }
  }, [storageKey, isApproved]);

  const handleStartNow = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, "true");
    }
    setHasSeenApproval(true);
  };

  const showCongrats = isApproved && !hasSeenApproval;
  const showShortcuts = isApproved && hasSeenApproval;

  // Single-line premium shortcut row — champagne pill + gold-hairline icon tile.
  // NO black-filled circles (banned), NO white-on-light icons.
  const ShortcutRow = ({ items }: { items: { label: string; desc: string; icon: any; href: string }[] }) => (
    <div className="relative -mx-4 px-4">
      <div
        className="flex gap-2.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin"
        style={{ scrollbarWidth: 'thin' }}
      >
        {items.map((action) => (
          <Link
            key={action.label}
            to={action.href}
            className="group snap-start shrink-0 inline-flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-full border border-[#B89555]/35 bg-[#FDFBF7] hover:bg-[#F7F2EA] hover:border-[#B89555]/60 transition-all shadow-[0_1px_0_rgba(184,149,85,0.08)] hover:shadow-[0_4px_14px_-6px_rgba(184,149,85,0.35)]"
            title={action.desc}
          >
            <span className="w-8 h-8 rounded-full bg-[#EFE6D6] border border-[#B89555]/60 flex items-center justify-center group-hover:bg-[#F7F2EA] transition-colors shrink-0">
              <action.icon className="w-4 h-4 text-[#1A1A1A]" strokeWidth={1.9} />
            </span>
            <span className="text-[#1A1A1A] text-[13px] font-semibold whitespace-nowrap leading-tight">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );

  // Single "Visit Portal" CTA card used for investor + broker — replaces the
  // shortcut grid per owner directive (no Broker Dashboard / CRM / Listing Portal
  // tile spam on the homepage; tools live inside the portal itself).
  const PortalVisitCard = ({
    eyebrow,
    title,
    description,
    cta,
    href,
    features,
    Icon,
  }: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
    href: string;
    features: { label: string; icon: any }[];
    Icon: any;
  }) => (
    <section
      className="py-16 md:py-24 relative overflow-hidden"
    >
      {/* Decorative outer frame — navy blue card sitting behind the champagne portal card.
          Stretched fully edge-to-edge horizontally (no champagne side-highlight); vertical insets preserved. */}
      <div
        data-surface="dark"
        data-on-dark
        data-no-contrast-guard
        className="allow-white pointer-events-none absolute inset-x-0 inset-y-4 md:inset-y-6 rounded-[2.25rem] bg-[#102540] border border-[#B89555]/55 shadow-[0_30px_80px_-40px_rgba(16,37,64,0.65)]"
      />

      <div className="container mx-auto px-4 md:px-8 max-w-6xl relative">
        {/* INNER broker/investor portal card — untouched champagne, now floats directly on the navy frame */}
        <div
          data-surface="page"
          className="relative rounded-[2rem] border border-[#B89555]/40 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-8 md:p-14 lg:p-16 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55),0_2px_0_rgba(255,255,255,0.9)_inset] overflow-hidden m-3 md:m-5"
        >
          {/* Inner light wash */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,149,85,0.10),transparent_55%)]" />


          <div className="relative grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">
            {/* LEFT — content (premium pass) */}
            <div className="min-w-0">
              {/* Eyebrow — gold hairline plaque with diamond + monogram bead */}
              <div className="inline-flex items-center gap-2.5 pl-2.5 pr-3.5 py-1.5 rounded-full bg-[#FDFBF7] border border-[#B89555]/55 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_6px_18px_-12px_rgba(184,149,85,0.45)] mb-6">
                <span className="relative inline-flex items-center justify-center w-4 h-4">
                  <span className="absolute inset-0 rotate-45 rounded-[3px] border border-[#B89555]/70" aria-hidden="true" />
                  <span className="w-1 h-1 rounded-full bg-[#B89555]" aria-hidden="true" />
                </span>
                <span className="text-[10.5px] font-semibold tracking-[0.28em] uppercase text-[#1A1A1A]">
                  {eyebrow}
                </span>
              </div>

              {/* Title — refined display with gold hairline accent underneath */}
              <h2 className="text-3xl md:text-[2.6rem] lg:text-[3.1rem] font-serif font-bold text-[#1A1A1A] leading-[1.02] tracking-[-0.018em]">
                {title}
              </h2>
              <div className="mt-4 flex items-center gap-3" aria-hidden="true">
                <span className="block h-px w-10 bg-gradient-to-r from-[#B89555]/80 to-transparent" />
                <span className="block w-1 h-1 rotate-45 bg-[#B89555]/70" />
                <span className="block h-px w-3 bg-[#B89555]/40" />
              </div>

              {/* Description — slightly richer ink, generous leading, refined width */}
              <p className="text-[#1A1A1A]/80 text-[15.5px] md:text-[17px] mt-5 leading-[1.75] max-w-[58ch]">
                {description}
              </p>

              {/* Feature chips — sculpted plaques w/ cream inset + gold gleam on hover */}
              <ul className="flex flex-wrap gap-2.5 mt-8 list-none p-0">
                {features.map((f) => (
                  <li key={f.label}>
                    <span
                      className="group/chip inline-flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full bg-gradient-to-b from-[#FDFBF7] to-[#F7F2EA] border border-[#B89555]/40 text-[12.5px] font-semibold text-[#1A1A1A] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_4px_12px_-8px_rgba(184,149,85,0.35)] hover:border-[#B89555]/75 hover:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_20px_-10px_rgba(184,149,85,0.55)] transition-all duration-300"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FDFBF7] border border-[#B89555]/45 group-hover/chip:border-[#B89555]/75 transition-colors">
                        <f.icon className="w-3 h-3 text-[#1A1A1A]" strokeWidth={2.2} />
                      </span>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA row — sculpted navy CTA + refined helper with gold rule */}
              <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link
                  to={href}
                  data-surface="dark"
                  data-on-dark
                  data-no-contrast-guard
                  data-allow-dark-cta
                  className="allow-white group inline-flex items-center gap-3 pl-7 pr-3 py-3 rounded-2xl bg-[#102540] hover:bg-[#1a3d63] border border-[#B89555]/65 text-white hover:text-white [&_*]:hover:!text-white [&_svg]:hover:!stroke-white text-[15px] font-bold tracking-tight shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_34px_-14px_rgba(16,37,64,0.6)] hover:shadow-[0_1px_0_rgba(255,255,255,0.10)_inset,0_22px_56px_-16px_rgba(16,37,64,0.75)] hover:-translate-y-0.5 transition-all duration-300"
                  style={{ color: "#FFFFFF" }}
                >
                  <span className="allow-white" data-no-contrast-guard style={{ color: "#FFFFFF" }}>{cta}</span>
                  <span className="w-9 h-9 rounded-full bg-[#1a3d63] border border-[#B89555]/60 flex items-center justify-center shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="w-4 h-4 allow-white" data-no-contrast-guard style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.4} />
                  </span>
                </Link>
                <span className="inline-flex items-center gap-3 text-[12.5px] text-[#1A1A1A]/75 font-medium">
                  <span className="hidden sm:block h-4 w-px bg-[#B89555]/45" aria-hidden="true" />
                  <span className="italic font-normal">
                    Secure sign-in with your JBJ account — your workspace, personalized.
                  </span>
                </span>
              </div>
            </div>


            {/* RIGHT — editorial emblem (no concentric rings) */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-[300px] h-[300px] flex items-center justify-center">
                {/* Soft champagne glow wash */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(184,149,85,0.10),transparent_70%)]"
                />
                {/* Vertical hairline accents — editorial, not circular */}
                <div aria-hidden="true" className="absolute left-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-[#B89555]/35 to-transparent" />
                <div aria-hidden="true" className="absolute right-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-[#B89555]/35 to-transparent" />

                {/* Centerpiece — tall portrait tile */}
                <div className="relative w-[200px] h-[260px] rounded-[28px] bg-gradient-to-b from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/55 shadow-[0_30px_70px_-28px_rgba(16,37,64,0.35),0_1px_0_rgba(255,255,255,0.95)_inset] flex flex-col items-center justify-between py-7 px-5">
                  {/* Eyebrow rule */}
                  <div className="flex items-center gap-2">
                    <span className="block w-6 h-px bg-[#B89555]/70" />
                    <span className="text-[10px] tracking-[0.28em] font-bold text-[#1A1A1A]/70 uppercase">JBJ</span>
                    <span className="block w-6 h-px bg-[#B89555]/70" />
                  </div>

                  {/* Icon mark */}
                  <div className="relative flex items-center justify-center">
                    <Icon className="w-20 h-20 text-[#1A1A1A]" strokeWidth={1.4} />
                  </div>

                  {/* Footer rule + serial */}
                  <div className="w-full flex flex-col items-center gap-2">
                    <span className="block h-px w-full bg-gradient-to-r from-transparent via-[#B89555]/55 to-transparent" />
                    <span className="text-[9.5px] tracking-[0.32em] font-semibold text-[#1A1A1A]/60 uppercase">
                      Est · MMXXV
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
    </section>

  );

  // ─────────────────────────────────────────────────────────────────────
  // STRICT MODE GATING — the active mode (not registration) drives which
  // portal CTA appears. Investor mode → Investor Portal card.
  // Broker mode → Broker Portal card. Developer mode → developer flow below.
  // ─────────────────────────────────────────────────────────────────────
  if (isModeLoading) return null;

  // INVESTOR — single message card pointing to YOUR investor portal
  if (isInvestorMode) {
    return (
      <PortalVisitCard
        eyebrow="Investor Portal"
        title="Your Investor Portal"
        description="A private workspace tailored to you — verified inventory, ROI tools, market intelligence and your portfolio, all in one place."
        cta="Visit Your Investor Portal"
        href="/investor-dashboard"
        Icon={PieChart}
        features={[
          { label: "Curated Inventory", icon: Home },
          { label: "ROI & Yield Tools", icon: Calculator },
          { label: "Market Intelligence", icon: BarChart3 },
          { label: "Portfolio Tracker", icon: TrendingUp },
        ]}
      />
    );
  }

  // BROKER — single message card pointing to YOUR broker portal
  if (isBrokerMode) {
    return (
      <PortalVisitCard
        eyebrow="Broker Portal"
        title="Your Broker Portal"
        description="Everything you need to close — CRM, listings, JBJ Academy and AI sales tools, in one professional command center."
        cta="Visit Your Broker Portal"
        href="/broker/crm"
        Icon={Briefcase}
        features={[
          { label: "CRM & Pipeline", icon: Briefcase },
          { label: "Listings Manager", icon: ListChecks },
          { label: "JBJ Academy", icon: GraduationCap },
          { label: "AI Sales Tools", icon: Brain },
        ]}
      />
    );
  }



  // DEVELOPER — must be in developer mode AND have a registration row
  if (!isDeveloperMode) return null;
  if (devReg.isLoading) return null;
  if (!status) return null; // no developer_registrations row — render nothing

  return (
    <section className="py-8 md:py-10 bg-[#FDFBF7]">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#1A1A1A] leading-tight">
                Developer Center
              </h2>
              <p className="text-[#1A1A1A]/70 text-xs mt-0.5">
                {showShortcuts
                  ? "Your developer tools and shortcuts."
                  : showCongrats
                  ? "Your application has been reviewed."
                  : "Submit projects, connect with brokers, and grow your business."}
              </p>
            </div>
          </div>


          {showCongrats && (
            <div className="max-w-md mx-auto text-center">
              <div className="p-8 rounded-xl border border-[#B89555]/30 bg-[#F7F2EA]">
                <CheckCircle2 className="w-14 h-14 text-[#1A1A1A] mx-auto mb-4" />
                <h3 className="text-[#1A1A1A] text-lg font-bold mb-2">
                  Congratulations, your developer access is approved.
                </h3>
                <p className="text-[#1A1A1A]/70 text-sm mb-6">
                  You now have full access to submit projects, manage events, and connect with our broker network.
                </p>
                <PearlButton
                  onClick={handleStartNow}
                  size="md"
                  leadingIcon={<Rocket strokeWidth={2.2} />}
                  trailingIcon={<ArrowRight strokeWidth={2.2} />}
                >
                  Start Now
                </PearlButton>

              </div>
            </div>
          )}

          {showShortcuts && <ShortcutRow items={shortcuts} />}


          {isPending && (
            <div className="max-w-md mx-auto text-center">
              <div className="p-8 rounded-xl border border-[#B89555]/30 bg-[#F7F2EA]">
                <Clock className="w-12 h-12 text-[#1A1A1A]/70 mx-auto mb-4" />
                <h3 className="text-[#1A1A1A] text-lg font-bold mb-2">Application Under Review</h3>
                <p className="text-[#1A1A1A]/70 text-sm mb-4">
                  Your developer registration is being reviewed by our team. We'll notify you once it's approved.
                </p>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F7F2EA] border border-[#B89555]/30 text-[#1A1A1A] text-xs uppercase tracking-wider font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  {status === "under_review" ? "Under Review" : "Pending"}
                </span>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="max-w-md mx-auto text-center">
              <div className="p-8 rounded-xl border border-[#B89555]/30 bg-[#F7F2EA]">
                <XCircle className="w-12 h-12 text-[#1A1A1A]/70 mx-auto mb-4" />
                <h3 className="text-[#1A1A1A] text-lg font-bold mb-2">Application Not Approved</h3>
                <p className="text-[#1A1A1A]/70 text-sm mb-4">
                  Unfortunately your registration was not approved. Please contact us for more information.
                </p>
                <Link to="/contact">
                  <Button variant="secondary" className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#F7F2EA]">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DeveloperPortalCTA;
