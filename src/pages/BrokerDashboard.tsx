import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBrokerProfile } from "@/hooks/useBrokerProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  TrendingUp,
  CheckSquare,
  Bell,
  Calendar,
  ArrowRight,
  GraduationCap,
  BarChart3,
  Phone,
  Mail,
  Clock,
  UserCircle,
  Briefcase,
  FolderOpen,
  HelpCircle,
} from "lucide-react";
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function BrokerDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, isInternalBroker, isExternalBroker } = useBrokerProfile();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/broker-dashboard");
    }
  }, [user, authLoading, navigate]);

  // Hooks must always run in the same order — keep this useQuery above any early return.
  const { data: crmProfile } = useQuery({
    queryKey: ["crm-profile-name", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("crm_users_profile")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#B89555] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Quick Actions - role-based
  const quickActions = [
    { 
      title: "Open CRM", 
      icon: Users, 
      href: "/crm",
      description: "Manage leads and clients",
      internal: true,
      external: true,
    },
    { 
      title: "My Leads", 
      icon: TrendingUp, 
      href: "/crm?tab=leads",
      description: "View assigned leads",
      internal: true,
      external: true,
    },
    { 
      title: "My Listings", 
      icon: Building2, 
      href: "/listing-admin",
      description: "Manage property listings",
      internal: true,
      external: true,
    },
    { 
      title: "Market Reports", 
      icon: BarChart3, 
      href: "/market-intelligence",
      description: "Access market data",
      internal: true,
      external: true,
    },
    { 
      title: "Notes & Calendar", 
      icon: Calendar, 
      href: "/broker/crm?tab=notes",
      description: "Tasks and reminders",
      internal: true,
      external: true,
    },
    { 
      title: "Broker Education", 
      icon: GraduationCap, 
      href: "/broker-education",
      description: "Training library",
      internal: true,
      external: true,
    },
  ];

  // Filter actions based on role
  const filteredActions = quickActions.filter(action => 
    isInternalBroker ? action.internal : action.external
  );

  // Performance metrics - shown differently for internal vs external
  const performanceBlocks = isInternalBroker ? [
    { label: "Total Leads", value: "—", icon: Users },
    { label: "Active Deals", value: "—", icon: Briefcase },
    { label: "Closed Deals", value: "—", icon: CheckSquare },
    { label: "Listing Value", value: "—", icon: Building2 },
    { label: "CRM Activity", value: "—", icon: Phone },
    { label: "Last Login", value: new Date().toLocaleDateString(), icon: Clock },
  ] : [
    { label: "My Leads", value: "—", icon: Users },
    { label: "My Listings", value: "—", icon: Building2 },
    { label: "Active Deals", value: "—", icon: Briefcase },
    { label: "Last Login", value: new Date().toLocaleDateString(), icon: Clock },
  ];

  // Broker Hub Links
  const brokerHubLinks = [
    { 
      title: "Broker Tools", 
      description: "Property analysis, comparison tools, and presentation generators",
      icon: FolderOpen, 
      href: "/broker-toolkit",
    },
    { 
      title: "Broker Education", 
      description: "Training modules and professional development",
      icon: GraduationCap, 
      href: "/broker-education",
    },
    { 
      title: "Broker Resources", 
      description: "Regulatory references, templates, and guides",
      icon: FileText, 
      href: "/broker-resources",
    },
    { 
      title: "Broker FAQ", 
      description: "Common questions and best practices",
      icon: HelpCircle, 
      href: "/broker-faq",
    },
  ];

  // Match header avatar identity: crmProfile fetched above (before early return) to keep hook order stable.


  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    (crmProfile as any)?.display_name ||
    profile?.display_name ||
    (typeof meta.full_name === "string" ? (meta.full_name as string) : null) ||
    (typeof meta.name === "string" ? (meta.name as string) : null) ||
    user?.email?.split("@")[0] ||
    "Broker";

  // Build 2-letter initials (e.g., "Jane Boujaoude" -> "JB") — matches header avatar
  const getInitials = () => {
    const parts = displayName.replace(/[._-]+/g, " ").trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  };

  // Treat as Active unless explicitly flagged false
  const isActive = profile?.is_active !== false;

  // Premium tile classes — shared champagne glow + 3D lift on hover
  const tileGlow3D =
    "transition-all duration-300 ease-out will-change-transform " +
    "hover:-translate-y-1.5 hover:scale-[1.02] " +
    "hover:shadow-[0_18px_44px_-12px_rgba(184,149,85,0.55),0_8px_22px_-10px_rgba(26,26,26,0.25),0_0_0_1px_rgba(184,149,85,0.55)] " +
    "hover:[transform:perspective(900px)_rotateX(2deg)_translateY(-6px)_scale(1.02)]";
  const tileCardCls =
    `h-full bg-[#EFE6D6] border-2 border-[#B89555]/60 hover:border-[#B89555] hover:bg-[#F7F2EA] cursor-pointer group ${tileGlow3D}`;
  const tileIconWrapCls =
    "bg-[#F7F2EA] border-2 border-[#B89555]/60 rounded-xl flex items-center justify-center group-hover:border-[#B89555] group-hover:bg-[#FDFBF7] group-hover:scale-110 transition-all duration-300";

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="w-full space-y-10 pb-12"
      >
        {/* SECTION 1: Dashboard Header - Profile (edge-to-edge, premium champagne) */}
        <motion.div variants={fadeInUp}>
          <div className="w-full bg-gradient-to-r from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA] border-y-2 border-[#B89555]/40">
            <div className="px-6 md:px-10 py-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar — matches header mother-of-pearl gold gradient identity */}
                <div
                  className="relative h-24 w-24 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                  style={{
                    border: "1.5px solid hsl(var(--gold))",
                    boxShadow:
                      "0 0 0 1px rgba(184,149,85,0.35), 0 8px 24px -8px rgba(184,149,85,0.55)",
                    background:
                      "radial-gradient(120% 120% at 30% 25%, #FFFDF8 0%, #F5ECDC 38%, #E8D8B8 70%, #D9C291 100%)",
                  }}
                >
                  {profile?.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={displayName}
                      className="absolute inset-0 w-full h-full object-cover rounded-full"
                     loading="lazy" decoding="async" />
                  ) : (
                    <>
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            "conic-gradient(from 210deg at 50% 50%, rgba(255,255,255,0.35), rgba(255,255,255,0) 25%, rgba(184,149,85,0.18) 55%, rgba(255,255,255,0.3) 80%, rgba(255,255,255,0) 100%)",
                          opacity: 0.5,
                          mixBlendMode: "soft-light",
                        }}
                      />
                      <span
                        className="relative text-2xl font-bold text-[#1A1A1A] tracking-[-0.01em]"
                        style={{ textShadow: "0 1px 0 rgba(255,255,255,0.5)" }}
                      >
                        {getInitials()}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-center md:text-left flex-1">
                  <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-1">
                    {displayName}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                    <Badge className="bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/60 hover:bg-[#FDFBF7]">
                      {isInternalBroker ? 'JBJ Internal Broker' : 'JBJ Partner Broker'}
                    </Badge>
                    <Badge className={isActive
                      ? 'jj-emerald-soft text-[color:var(--emerald-1)] border border-[color:var(--emerald-1)]/30/40 hover:jj-emerald-soft'
                      : 'bg-amber-50 text-amber-700 border border-amber-600/40 hover:bg-amber-50'}>
                      {isActive ? 'Active' : 'Pending'}
                    </Badge>
                  </div>
                  {profile?.title && (
                    <p className="text-[#1A1A1A]/70 text-sm">{profile.title}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="px-6 md:px-10 space-y-10">

        {/* SECTION 2: Quick Actions */}
        <motion.div variants={fadeInUp}>
          <h3 className="text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-[hsl(var(--gold))]" strokeWidth={2.5} />
            <span className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-1.5 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-[#B89555] after:via-[#B89555] after:to-[#B89555]/40 after:rounded-full">Quick Actions</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {filteredActions.map((action, index) => (
              <Link key={index} to={action.href}>
                <Card className={tileCardCls}>
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 mx-auto mb-3 ${tileIconWrapCls}`}>
                      <action.icon className="w-6 h-6 text-[#1A1A1A]" strokeWidth={2.5} />
                    </div>
                    <h4 className="text-sm font-semibold text-[#1A1A1A] mb-1">
                      {action.title}
                    </h4>
                    <p className="text-xs text-[#1A1A1A]/70 line-clamp-2">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* SECTION 3: Performance Overview */}
        <motion.div variants={fadeInUp}>
          <h3 className="text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[hsl(var(--gold))]" strokeWidth={2.5} />
            <span className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-1.5 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-[#B89555] after:via-[#B89555] after:to-[#B89555]/40 after:rounded-full">Performance Overview</span>
          </h3>
          <div className={`grid grid-cols-2 ${isInternalBroker ? 'md:grid-cols-3 lg:grid-cols-6' : 'md:grid-cols-4'} gap-4`}>
            {performanceBlocks.map((block, index) => (
              <Card key={index} className={`relative overflow-hidden bg-[#EFE6D6] border-2 border-[#B89555]/60 hover:border-[#B89555] ${tileGlow3D}`}>
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-[#B89555] to-transparent" />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F7F2EA] border-2 border-[#B89555]/60 flex items-center justify-center">
                      <block.icon className="w-5 h-5 text-[#1A1A1A]" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#B89555]">
                      Live
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#1A1A1A] leading-tight">{block.value}</p>
                  <p className="text-xs text-[#1A1A1A]/70 mt-1">{block.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* SECTION 4: Tasks & Reminders */}
        <motion.div variants={fadeInUp}>
          <h3 className="text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[hsl(var(--gold))]" strokeWidth={2.5} />
            <span className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-1.5 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-[#B89555] after:via-[#B89555] after:to-[#B89555]/40 after:rounded-full">Tasks &amp; Reminders</span>
          </h3>
          <Card className={`bg-[#EFE6D6] border-2 border-[#B89555]/60 hover:border-[#B89555] ${tileGlow3D}`}>

            <CardContent className="p-5 md:p-6">
              <div className="flex flex-col gap-5">
                <div className="text-center md:text-left">
                  <p className="text-[#1A1A1A]/80 mb-2">
                    Access your tasks, notes, reminders, and internal JBJ messages — all in one place.
                  </p>
                  <p className="text-sm text-[#1A1A1A]/60">
                    Reminders can be delivered in-platform, via email, or WhatsApp (if enabled).
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { to: "/broker/crm?tab=notes", icon: FileText, label: "View Notes" },
                    { to: "/broker/crm?tab=tasks", icon: Bell, label: "Reminders" },
                    { to: "/broker/email", icon: Mail, label: "My Inbox" },
                    { to: "/broker/crm?tab=calendar", icon: Calendar, label: "Calendar" },
                  ].map(({ to, icon: BtnIcon, label }) => (
                    <Link key={to} to={to} className="w-full">
                      <Button
                        variant="outline"
                        className="w-full h-11 justify-center border-2 border-[#B89555]/60 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#FDFBF7] hover:border-[#B89555] hover:shadow-[0_8px_22px_-10px_rgba(184,149,85,0.55)] transition-all"
                      >
                        <BtnIcon className="w-4 h-4 mr-2" strokeWidth={2.5} />
                        <span className="truncate">{label}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* SECTION 5: Notifications */}
        <motion.div variants={fadeInUp}>
          <h3 className="text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[hsl(var(--gold))]" strokeWidth={2.5} />
            <span className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-1.5 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-[#B89555] after:via-[#B89555] after:to-[#B89555]/40 after:rounded-full">Notifications</span>
          </h3>
          <Card className={`bg-[#EFE6D6] border-2 border-[#B89555]/60 hover:border-[#B89555] ${tileGlow3D}`}>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Bell className="w-10 h-10 text-[#1A1A1A]/50 mx-auto mb-3" strokeWidth={2} />
                <p className="text-[#1A1A1A]/80">No new notifications</p>
                <p className="text-sm text-[#1A1A1A]/60 mt-1">
                  Approval updates, listing status, and education progress will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Broker Hub Links */}
        <motion.div variants={fadeInUp}>
          <h3 className="text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[hsl(var(--gold))]" strokeWidth={2.5} />
            <span className="relative inline-block after:content-[''] after:absolute after:left-0 after:-bottom-1.5 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-[#B89555] after:via-[#B89555] after:to-[#B89555]/40 after:rounded-full">Broker Hub</span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {brokerHubLinks.map((link, index) => (
              <Link key={index} to={link.href}>
                <Card className={tileCardCls}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 flex-shrink-0 ${tileIconWrapCls}`}>
                        <link.icon className="w-5 h-5 text-[#1A1A1A]" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#1A1A1A]">
                          {link.title}
                        </h4>
                        <p className="text-xs text-[#1A1A1A]/70 mt-1 line-clamp-2">
                          {link.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#B89555] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" strokeWidth={2.5} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
