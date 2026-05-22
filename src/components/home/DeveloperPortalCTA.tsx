import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Upload, FolderOpen, PartyPopper, ListChecks, Briefcase, FileSignature, UserCheck, CheckCircle2, Clock, XCircle, ArrowRight, Handshake, Users, MessageSquare, Rocket, Megaphone, LayoutDashboard, CalendarCheck, TrendingUp, BarChart3, Calculator, Home, Search, PieChart, GraduationCap, MapPin, Brain, Target, BookOpen, FileText, Star, Zap, Headphones } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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


const devBenefits = [
  { icon: Upload, label: "Submit projects & brochures" },
  { icon: PartyPopper, label: "Submit launch events" },
  { icon: Handshake, label: "Close more deals with brokers" },
  { icon: Users, label: "Direct connection with sales managers" },
  { icon: MessageSquare, label: "Briefings & meetings scheduling" },
  { icon: Briefcase, label: "Get publication with our broker network" },
  { icon: Rocket, label: "Promote projects to broker community" },
  { icon: Megaphone, label: "Receive broker exposure" },
];

const investorBenefits = [
  { icon: TrendingUp, label: "Access exclusive off-plan opportunities" },
  { icon: BarChart3, label: "AI-powered market intelligence" },
  { icon: Calculator, label: "ROI calculators & investment tools" },
  { icon: Home, label: "Browse 2,400+ verified properties" },
  { icon: Search, label: "AI Home Finder for personalized matches" },
  { icon: PieChart, label: "Portfolio tracking & analytics" },
  { icon: Briefcase, label: "Connect with licensed advisors" },
  { icon: CheckCircle2, label: "Investor education & guides" },
];

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

const DeveloperPortalCTA = () => {
  const { user } = useAuth();
  const { data: status, isLoading } = useDevRegistration();
  const { isDeveloperMode, isInvestorMode, isBrokerMode } = useUserModeContext();

  const isApproved = status === "approved";
  const isPending = status === "pending" || status === "under_review";
  const isRejected = status === "rejected";
  const isUnregistered = !status && !isLoading;

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

  // Single-line premium shortcut row — used for every portal category
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
            <span className="jj-icon-keep w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <action.icon className="w-4 h-4 text-white" style={{ color: '#fff' }} />
            </span>
            <span className="text-[#1A1A1A] text-[13px] font-semibold whitespace-nowrap leading-tight">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );

  // Investor mode — show investor opportunities instead
  if (isInvestorMode && !isDeveloperMode) {
    return (
      <section className="py-8 md:py-10 bg-[#FDFBF7]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-3">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-[#1A1A1A] leading-tight">
                  Investor Opportunities
                </h2>
                <p className="text-[#1A1A1A]/70 text-xs mt-0.5">
                  Tools, insights & exclusive access for smart investors.
                </p>
              </div>
            </div>
            <ShortcutRow items={investorShortcuts} />
          </div>
        </div>
      </section>
    );
  }


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

          {(isUnregistered || (!user && !isLoading)) && (
            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {devBenefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F2EA] border border-[#B89555]/30">
                    <div className="w-8 h-8 rounded-full bg-[#F7F2EA] border border-[#B89555]/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-[#1A1A1A]" />
                    </div>
                    <span className="text-[#1A1A1A] text-sm">{b.label}</span>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Link to={user ? "/developer-hub" : "/auth?redirect=/developer-hub"}>
                  <Button className="bg-[#1A1A1A] text-white font-bold px-8 py-3 text-sm hover:bg-[#1A1A1A] transition-all">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Register Now as Developer or Sales Representative
                    <ArrowRight className="w-4 h-4 ml-2" />
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
