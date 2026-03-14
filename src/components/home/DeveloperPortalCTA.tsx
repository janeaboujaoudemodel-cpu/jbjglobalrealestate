
import { Link } from "react-router-dom";
import { Upload, FolderOpen, PartyPopper, ListChecks, Briefcase, FileSignature, UserCheck, Crown, CalendarSearch, Users, Rocket, Settings, UserCog } from "lucide-react";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { useAuth } from "@/contexts/AuthContext";

const DeveloperPortalCTA = () => {
  const { isDeveloperMode } = useUserModeContext();
  const { user, isOwner } = useAuth();

  // Only show for registered developers or owner
  if (!isDeveloperMode && !isOwner) return null;

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'there';

  // Developer actions — shown to developers AND owner in developer mode
  const developerActions = [
    { label: "Submit Project", desc: "Upload brochures & renders", icon: Upload, href: "/developer-portal?tab=submit" },
    { label: "Submit Event", desc: "Invite us to launches", icon: PartyPopper, href: "/developer-portal?tab=events" },
    { label: "My Projects", desc: "Track submission status", icon: FolderOpen, href: "/developer-portal?tab=projects" },
    { label: "Check Listings", desc: "View live listings", icon: ListChecks, href: "/developer-portal?tab=listings" },
    { label: "Request Briefing", desc: "Schedule a project briefing", icon: Briefcase, href: "/developer-portal?tab=briefing" },
    { label: "Agreements", desc: "Sign & review documents", icon: FileSignature, href: "/developer-portal?tab=agreements" },
    { label: "Register as Developer / Representative", desc: "Join our network", icon: UserCheck, href: "/developer-portal?tab=register" },
  ];

  // Owner actions — only when NOT in developer mode
  const ownerActions = [
    { label: "Quick Upload", desc: "Owner fast-track upload", icon: Crown, href: "/developer-portal?tab=submit&mode=owner" },
    { label: "Manage Launches", desc: "Review upcoming launches", icon: CalendarSearch, href: "/developer-portal?tab=manage" },
    { label: "Review Submissions", desc: "Approve project uploads", icon: ListChecks, href: "/developer-portal?tab=projects" },
    { label: "Manage Developers", desc: "Registered reps & access", icon: Settings, href: "/developer-portal?tab=manage" },
  ];

  // When owner is in developer mode, show developer view
  const actions = isDeveloperMode ? developerActions : (isOwner ? ownerActions : developerActions);
  const title = isDeveloperMode
    ? `Developer Portal`
    : (isOwner ? `Welcome back, ${displayName}` : `Good to see you, ${displayName}`);
  const subtitle = isDeveloperMode
    ? 'Submit projects, request briefings, and manage your developer tools.'
    : (isOwner
      ? 'Quick upload, manage launches, and review submissions.'
      : 'Your developer tools and submissions are ready.');

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)]">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#F5EBD7] mb-1 text-center">
            {title}
          </h2>
          <p className="text-[#D4B896]/60 text-sm mb-8 text-center">
            {subtitle}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {actions.map((action) => (
              <Link key={action.label} to={action.href}>
                <div className="group flex flex-col items-center gap-2 p-5 rounded-xl border border-[#D4B896]/20 hover:border-[#D4B896]/50 bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer min-h-[120px] justify-center">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_2px_8px_rgba(212,184,150,0.3)]">
                    <action.icon className="w-5 h-5 text-[hsl(38,35%,12%)]" />
                  </div>
                  <span className="text-white text-xs md:text-sm font-semibold text-center leading-tight">{action.label}</span>
                  <span className="text-[#D4B896]/50 text-[10px] text-center leading-tight">{action.desc}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperPortalCTA;
