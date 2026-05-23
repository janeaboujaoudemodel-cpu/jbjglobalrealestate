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
    title,
    description,
    cta,
    href,
  }: {
    title: string;
    description: string;
    cta: string;
    href: string;
  }) => (
    <section className="py-8 md:py-10 bg-[#FDFBF7]">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto rounded-2xl border border-[#B89555]/40 bg-[#F7F2EA] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-[#1A1A1A] leading-tight">
              {title}
            </h2>
            <p className="text-[#1A1A1A]/75 text-sm mt-1.5 leading-snug">
              {description}
            </p>
          </div>
          <Link
            to={href}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#EFE6D6] border border-[#B89555] text-[#1A1A1A] text-sm font-semibold hover:bg-[#FDFBF7] transition-colors"
          >
            {cta}
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </Link>
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

  // INVESTOR — single message card pointing to the investor portal
  if (isInvestorMode) {
    return (
      <PortalVisitCard
        title="Investor Portal"
        description="Visit the Investor Portal to access property search, ROI tools, market intelligence and your portfolio — everything tailored for investors lives there."
        cta="Visit Investor Portal"
        href="/investor-dashboard"
      />
    );
  }

  // BROKER — single message card pointing to the broker portal
  if (isBrokerMode) {
    return (
      <PortalVisitCard
        title="Broker Portal"
        description="Visit the Broker Portal to access your dashboard, CRM, listings, academy and AI sales tools — everything for brokers lives inside the portal."
        cta="Visit Broker Portal"
        href="/broker/crm"
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
                <Button
                  onClick={handleStartNow}
                  className="bg-[#1A1A1A] text-white font-bold px-8 py-3 text-sm hover:bg-[#1A1A1A] transition-all"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
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
