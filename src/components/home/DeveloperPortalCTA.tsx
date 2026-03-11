import { Link } from "react-router-dom";
import { Upload, FolderOpen, PartyPopper, ListChecks, ArrowRight } from "lucide-react";
import { useUserModeContext } from "@/contexts/UserModeContext";

const DeveloperPortalCTA = () => {
  const { isDeveloperMode } = useUserModeContext();

  // Only show for registered developers
  if (!isDeveloperMode) return null;

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-[#1a1a1a] via-[#2a2318] to-[#1a1a1a]">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
            Welcome Back, Developer
          </h2>
          <p className="text-white/50 text-sm mb-8 text-center">
            Manage your projects, events, and listings from here.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Submit New Project", icon: Upload, href: "/developer-portal?tab=submit" },
              { label: "Submit Event", icon: PartyPopper, href: "/developer-portal?tab=events" },
              { label: "My Projects", icon: FolderOpen, href: "/developer-portal?tab=projects" },
              { label: "Check Listings", icon: ListChecks, href: "/developer-portal?tab=listings" },
            ].map((action) => (
              <Link key={action.label} to={action.href}>
                <div className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-[hsl(var(--gold))]/20 hover:border-[hsl(var(--gold))]/50 bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[hsl(var(--gold))] to-[#C4A87A] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <action.icon className="w-6 h-6 text-black" />
                  </div>
                  <span className="text-white text-xs md:text-sm font-semibold text-center">{action.label}</span>
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
