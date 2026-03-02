import { useState, useEffect } from "react";
import VideoBackground from "@/components/VideoBackground";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useBrokerProfile } from "@/hooks/useBrokerProfile";
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
import brokerDashboardHeroVideo from "@/assets/videos/broker-dashboard-hero.mp4";

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

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
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
      href: "/crm-notes",
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Video */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        <VideoBackground 
          src={brokerDashboardHeroVideo} 
          poster="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        
        <motion.div 
          className="container mx-auto px-4 relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(200,167,102,0.6)',
              }}
              variants={fadeInUp}
            >
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <span className="text-gold font-semibold text-xs uppercase tracking-widest">Broker Dashboard</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl font-light text-white mb-4 leading-tight"
              variants={fadeInUp}
            >
              Your Professional <span className="text-gold">Control Center</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg text-zinc-300 font-light max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Manage your brokerage activity, track performance, and access operational tools.
            </motion.p>
          </div>
        </motion.div>
      </section>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-10"
        >
          {/* SECTION 1: Dashboard Header - Profile */}
          <motion.div variants={fadeInUp}>
            <Card className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-black border border-gold/20">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <Avatar className="w-24 h-24 border-2 border-gold/30">
                    <AvatarImage src={profile?.photo_url || undefined} />
                    <AvatarFallback className="bg-gold/20 text-gold text-2xl">
                      {profile?.display_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'B'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl font-semibold text-white mb-1">
                      {profile?.display_name || user?.email || 'Broker'}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                      <Badge className="bg-gold/20 text-gold border-gold/30">
                        {isInternalBroker ? 'JBJ Internal Broker' : 'JBJ Partner Broker'}
                      </Badge>
                      <Badge className={profile?.is_active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}>
                        {profile?.is_active ? 'Active' : 'Pending'}
                      </Badge>
                    </div>
                    {profile?.title && (
                      <p className="text-zinc-400 text-sm">{profile.title}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* SECTION 2: Quick Actions */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-gold" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {filteredActions.map((action, index) => (
                <Link key={index} to={action.href}>
                  <Card className="h-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 hover:border-gold transition-all cursor-pointer group">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 bg-black border border-gold/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gold/10 transition-colors">
                        <action.icon className="w-6 h-6 text-gold" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground mb-1 group-hover:text-gold transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
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
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              Performance Overview
            </h3>
            <div className={`grid grid-cols-2 ${isInternalBroker ? 'md:grid-cols-3 lg:grid-cols-6' : 'md:grid-cols-4'} gap-4`}>
              {performanceBlocks.map((block, index) => (
                <Card key={index} className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
                  <CardContent className="p-4 text-center">
                    <block.icon className="w-6 h-6 text-gold mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{block.value}</p>
                    <p className="text-xs text-muted-foreground">{block.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* SECTION 4: Tasks & Reminders */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-gold" />
              Tasks & Reminders
            </h3>
            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <p className="text-muted-foreground mb-2">
                      Access your tasks, notes, and reminders from the Notes & Calendar system.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Reminders can be delivered in-platform, via email, or WhatsApp (if enabled).
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/crm-notes">
                      <Button variant="secondary" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        View Notes
                      </Button>
                    </Link>
                    <Link to="/crm-reminders">
                      <Button variant="secondary" size="sm">
                        <Bell className="w-4 h-4 mr-2" />
                        Reminders
                      </Button>
                    </Link>
                    <Link to="/crm-calendar">
                      <Button variant="secondary" size="sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        Calendar
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* SECTION 5: Notifications */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-gold" />
              Notifications
            </h3>
            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No new notifications</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Approval updates, listing status, and education progress will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Broker Hub Links */}
          <motion.div variants={fadeInUp}>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-gold" />
              Broker Hub
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {brokerHubLinks.map((link, index) => (
                <Link key={index} to={link.href}>
                  <Card className="h-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 hover:border-gold transition-all cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-black border border-gold/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 transition-colors">
                          <link.icon className="w-5 h-5 text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground group-hover:text-gold transition-colors">
                            {link.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {link.description}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
