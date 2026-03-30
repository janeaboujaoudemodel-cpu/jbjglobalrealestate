import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Upload, FolderOpen, PartyPopper, ListChecks, Briefcase, FileSignature, UserCheck, CheckCircle2, Clock, XCircle, ArrowRight, Handshake, Users, MessageSquare, Rocket, Megaphone, LayoutDashboard, CalendarCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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

const benefits = [
  { icon: Upload, label: "Submit projects & brochures" },
  { icon: PartyPopper, label: "Submit launch events" },
  { icon: Handshake, label: "Close more deals with brokers" },
  { icon: Users, label: "Direct connection with sales managers" },
  { icon: MessageSquare, label: "Briefings & meetings scheduling" },
  { icon: Briefcase, label: "Get publication with our broker network" },
  { icon: Rocket, label: "Promote projects to broker community" },
  { icon: Megaphone, label: "Receive broker exposure" },
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

const DeveloperPortalCTA = () => {
  const { user } = useAuth();
  const { data: status, isLoading } = useDevRegistration();

  const isApproved = status === "approved";
  const isPending = status === "pending" || status === "under_review";
  const isRejected = status === "rejected";
  const isUnregistered = !status && !isLoading;

  const storageKey = user ? `dev-approval-seen-${user.id}` : null;
  const [hasSeenApproval, setHasSeenApproval] = useState(true); // default true to avoid flash

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

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#F7F1E6] mb-1 text-center" style={{ fontFamily: "Poppins, sans-serif" }}>
            Developer Center
          </h2>
          <p className="text-[#D4B896]/60 text-sm mb-8 text-center">
            {showShortcuts
              ? "Your developer tools and shortcuts are ready."
              : showCongrats
              ? "Your application has been reviewed."
              : "Join our network — submit projects, connect with brokers, and grow your business."}
          </p>

          {/* ── STATE: Approved — first-time congratulations ── */}
          {showCongrats && (
            <div className="max-w-md mx-auto text-center">
              <div className="p-8 rounded-xl border border-gold/30 bg-white/5">
                <CheckCircle2 className="w-14 h-14 text-gold mx-auto mb-4" />
                <h3 className="text-white text-lg font-bold mb-2">
                  Congratulations, your developer access is approved.
                </h3>
                <p className="text-[#D4B896]/60 text-sm mb-6">
                  You now have full access to submit projects, manage events, and connect with our broker network.
                </p>
                <Button
                  onClick={handleStartNow}
                  className="bg-gradient-to-r from-gold via-[#ECE2D2] to-gold text-black font-bold px-8 py-3 text-sm hover:shadow-[0_4px_20px_rgba(200,167,102,0.4)] transition-all"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Start Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STATE: Approved — shortcut cards ── */}
          {showShortcuts && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shortcuts.map((action) => (
                <Link key={action.label} to={action.href}>
                  <div className="group flex flex-col items-center gap-2 p-5 rounded-xl border border-[#D4B896]/20 hover:border-[#D4B896]/50 bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer min-h-[120px] justify-center">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_2px_8px_rgba(212,184,150,0.3)]">
                      <action.icon className="w-5 h-5 text-[hsl(32,28%,13%)]" />
                    </div>
                    <span className="text-white text-xs md:text-sm font-semibold text-center leading-tight">{action.label}</span>
                    <span className="text-[#D4B896]/50 text-[10px] text-center leading-tight">{action.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ── STATE: Pending ── */}
          {isPending && (
            <div className="max-w-md mx-auto text-center">
              <div className="p-8 rounded-xl border border-[#D4B896]/30 bg-white/5">
                <Clock className="w-12 h-12 text-gold mx-auto mb-4" />
                <h3 className="text-white text-lg font-bold mb-2">Application Under Review</h3>
                <p className="text-[#D4B896]/60 text-sm mb-4">
                  Your developer registration is being reviewed by our team. We'll notify you once it's approved.
                </p>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs uppercase tracking-wider font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  {status === "under_review" ? "Under Review" : "Pending"}
                </span>
              </div>
            </div>
          )}

          {/* ── STATE: Rejected ── */}
          {isRejected && (
            <div className="max-w-md mx-auto text-center">
              <div className="p-8 rounded-xl border border-red-500/30 bg-white/5">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-white text-lg font-bold mb-2">Application Not Approved</h3>
                <p className="text-[#D4B896]/60 text-sm mb-4">
                  Unfortunately your registration was not approved. Please contact us for more information.
                </p>
                <Link to="/contact">
                  <Button variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* ── STATE: Unregistered — benefits + CTA ── */}
          {(isUnregistered || (!user && !isLoading)) && (
            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-[#D4B896]/15">
                    <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-gold" />
                    </div>
                    <span className="text-[#F7F1E6] text-sm">{b.label}</span>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Link to={user ? "/developer-hub" : "/auth?redirect=/developer-hub"}>
                  <Button className="bg-gradient-to-r from-gold via-[#ECE2D2] to-gold text-black font-bold px-8 py-3 text-sm hover:shadow-[0_4px_20px_rgba(200,167,102,0.4)] transition-all">
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
