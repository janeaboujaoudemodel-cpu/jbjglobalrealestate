import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SEOHead } from "@/components/SEOHead";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  Building2, Plus, FolderOpen, Calendar, FileCheck, PartyPopper,
  TrendingUp, ArrowRight,
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const developerTiles = [
  { title: "Submit Project",   description: "Brochures, renders, payment terms", icon: Plus,        href: "/developer-portal?tab=submit" },
  { title: "My Projects",      description: "Track approval & live status",      icon: FolderOpen,  href: "/developer-portal?tab=projects" },
  { title: "Request Briefing", description: "Schedule a JBJ briefing call",      icon: Calendar,    href: "/developer-portal?tab=briefing" },
  { title: "Events",           description: "Invite us to launches",             icon: PartyPopper, href: "/developer-portal?tab=events" },
  { title: "Agreements",       description: "Sign & review documents",           icon: FileCheck,   href: "/developer-portal?tab=agreements" },
  { title: "Developer Center", description: "Your full developer hub",           icon: Building2,   href: "/developer-hub" },
];

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/dashboard");
  }, [user, authLoading, navigate]);

  const displayName = user?.email?.split("@")[0] || "Developer";
  const getInitials = () => {
    const parts = displayName.replace(/[._-]+/g, " ").trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <SEOHead
        title="Developer Dashboard | JBJ Global Real Estate"
        description="Submit launches, manage agreements, brief our team and track approvals — the developer command center inside JBJ Global Real Estate."
      />
      <div className="min-h-screen bg-background">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="w-full space-y-10 pb-12">

          {/* Header */}
          <div className="w-full bg-gradient-to-r from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA] border-y-2 border-[#B89555]/40">
            <div className="px-6 md:px-10 py-8 flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24 border-2 border-[#B89555] shadow-[0_4px_18px_-6px_rgba(184,149,85,0.45)]">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-gradient-to-br from-[#FDFBF7] to-[#EFE6D6] text-[#B89555] text-2xl font-semibold tracking-wide">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-1">{displayName}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                  <Badge className="bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/60 hover:bg-[#FDFBF7]">
                    Developer mode
                  </Badge>
                </div>
                <p className="text-[#1A1A1A]/70 text-sm">
                  Submit launches, manage agreements, and brief the JBJ team — everything you need to go live with us.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 md:px-10 space-y-10">
            {/* Developer-only tiles */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#B89555]" strokeWidth={2.5} />
                For Developers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {developerTiles.map((t, i) => (
                  <Link key={i} to={t.href}>
                    <Card className="h-full bg-[#EFE6D6] border-2 border-[#B89555]/60 hover:border-[#B89555] hover:bg-[#F7F2EA] hover:shadow-[0_6px_20px_-8px_rgba(184,149,85,0.45)] transition-all group">
                      <CardContent className="p-5 flex items-start gap-3">
                        <div className="w-10 h-10 flex-shrink-0 bg-[#F7F2EA] border-2 border-[#B89555]/60 rounded-xl flex items-center justify-center">
                          <t.icon className="w-5 h-5 text-[#1A1A1A]" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#1A1A1A]">{t.title}</h4>
                          <p className="text-xs text-[#1A1A1A]/70 mt-1 line-clamp-2">{t.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#B89555] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" strokeWidth={2.5} />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Mode-aware shared QuickActions (also surfaces Careers etc.) */}
            <QuickActions />
          </div>
        </motion.div>
      </div>
    </>
  );
}
