import { Link } from "react-router-dom";
import { Building2, PartyPopper, ArrowRight, Upload, FolderOpen, CalendarClock, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserModeContext } from "@/contexts/UserModeContext";

const DeveloperPortalCTA = () => {
  const { isDeveloperMode } = useUserModeContext();

  // Developer quick actions panel for registered developers
  if (isDeveloperMode) {
    return (
      <section className="py-12 md:py-16 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
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
                { label: "Submit New Project", icon: Upload, href: "/developer-portal?tab=submit", color: "from-[#D4B896] to-[#C4A87A]" },
                { label: "Submit Event", icon: PartyPopper, href: "/developer-portal?tab=events", color: "from-[#D4B896] to-[#C4A87A]" },
                { label: "My Projects", icon: FolderOpen, href: "/developer-portal?tab=projects", color: "from-[#D4B896] to-[#C4A87A]" },
                { label: "Check Listings", icon: ListChecks, href: "/developer-portal?tab=listings", color: "from-[#D4B896] to-[#C4A87A]" },
              ].map((action) => (
                <Link key={action.label} to={action.href}>
                  <div className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-white/10 hover:border-gold/40 bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
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
  }

  // Default CTA for non-developers
  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Are You a Developer?
          </h2>
          <p className="text-white/60 mb-4 text-lg max-w-2xl mx-auto">
            Submit your project documents and we'll publish your listing. Manage events, tasks, and materials — all in one portal.
          </p>
          <p className="text-white/40 text-sm mb-8">
            Have a new project? Submit the documents now, so we can publish your project and collaborate with you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/developer-portal?tab=submit">
              <Button className="bg-gradient-to-r from-[#D4B896] to-[#C4A87A] hover:from-[#C4A87A] hover:to-[#B4986A] text-black font-bold h-12 px-8 rounded-xl">
                <Upload className="w-5 h-5 mr-2" />
                Submit New Project
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/developer-portal?tab=events">
              <Button variant="outline" className="border-2 border-gold/50 text-white hover:bg-gold/10 font-bold h-12 px-8 rounded-xl">
                <PartyPopper className="w-5 h-5 mr-2" />
                Submit Event Invitation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperPortalCTA;
