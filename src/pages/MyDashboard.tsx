import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { SEOHead } from "@/components/SEOHead";
import { Loader2, TrendingUp, Calendar, BookOpen, ChevronRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Dashboard modules
import FavoritesCard from "@/components/dashboard/FavoritesCard";
import ShortlistCard from "@/components/dashboard/ShortlistCard";
import BadgesLevelCard from "@/components/dashboard/BadgesLevelCard";
import ProfileSummaryCard from "@/components/dashboard/ProfileSummaryCard";
import ActivityOverviewCard from "@/components/dashboard/ActivityOverviewCard";
import NotificationsPreview from "@/components/dashboard/NotificationsPreview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import DashboardCardErrorBoundary from "@/components/dashboard/DashboardCardErrorBoundary";

// Role label mapping
function getRoleLabel(role: string | null): string {
  switch (role) {
    case 'investor': return 'Investor';
    case 'owner': return 'Property Owner';
    case 'broker': return 'Broker';
    case 'broker_jbj': return 'JBJ Broker';
    case 'broker_partner': return 'Partner Broker';
    case 'client': return 'Client';
    case 'visitor': return 'Explorer';
    default: return 'Member';
  }
}

function getRoleBadgeColor(role: string | null): string {
  switch (role) {
    case 'investor': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
    case 'owner': return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
    case 'broker':
    case 'broker_jbj':
    case 'broker_partner': return 'bg-purple-500/20 text-purple-600 border-purple-500/30';
    default: return 'bg-gold/20 text-gold border-gold/30';
  }
}

/** Useful Links card for dashboard */
function UsefulLinksCard() {
  const links = [
    { label: 'Market Intelligence', href: '/market-intelligence/overview', icon: TrendingUp },
    { label: 'Guides Library', href: '/guides', icon: BookOpen },
    { label: 'Upcoming Events', href: '/news?category=events', icon: Calendar },
    { label: 'Golden Visa Guide', href: '/guides/golden-visa-uae', icon: ExternalLink },
  ];

  return (
    <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-foreground flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-gold" />
          </div>
          Explore & Learn
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1.5">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gold/10 transition-all group"
            >
              <link.icon className="w-4 h-4 text-gold/70 group-hover:text-gold transition-colors shrink-0" />
              <span className="text-sm font-medium text-foreground group-hover:text-gold transition-colors">{link.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Account Settings shortcut card */
function AccountSettingsCard() {
  return (
    <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Account Settings</p>
            <p className="text-xs text-muted-foreground mt-0.5">Profile, preferences & security</p>
          </div>
          <Button variant="outline" size="sm" asChild className="border-gold/30 text-gold hover:bg-gold/10 hover:text-gold">
            <Link to="/profile">
              Manage
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const MyDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();
  const { mode, isInvestorMode, isBrokerMode, isCombinedMode } = useUserModeContext();

  // Listen for mode changes
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handleModeChange = () => forceUpdate(n => n + 1);
    window.addEventListener('userModeChange', handleModeChange);
    return () => window.removeEventListener('userModeChange', handleModeChange);
  }, []);

  // Scroll to notifications section if hash is present
  useEffect(() => {
    if (location.hash === '#notifications') {
      setTimeout(() => {
        document.getElementById('notifications-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [location.hash]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/my-dashboard');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <SEOHead 
        title="My Dashboard | JBJ Global Real Estate"
        description="Your personalized dashboard with favorites, shortlists, progress, and notifications."
      />
      
      <div className="min-h-screen bg-black">
        <div className="mx-3 md:mx-4 lg:mx-6 my-6 rounded-2xl border border-border bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))]">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  My <span className="text-gold">Dashboard</span>
                </h1>
                {/* Show only ONE badge based on mode - combined takes priority */}
                {isCombinedMode ? (
                  <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">
                    Investor + Broker
                  </Badge>
                ) : (
                  <Badge className={getRoleBadgeColor(role)}>
                    {getRoleLabel(role)}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {isCombinedMode 
                  ? "Full access to investor tools and broker features."
                  : isBrokerMode 
                    ? "Access your broker tools and dashboard."
                    : "Welcome back! Here's an overview of your activity and saved items."
                }
              </p>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Left Column - Profile & Level */}
              <div className="space-y-6">
                <DashboardCardErrorBoundary fallbackTitle="Profile unavailable">
                  <ProfileSummaryCard />
                </DashboardCardErrorBoundary>
                <DashboardCardErrorBoundary fallbackTitle="Badges unavailable">
                  <BadgesLevelCard />
                </DashboardCardErrorBoundary>
                <AccountSettingsCard />
              </div>

              {/* Center Column - Quick Actions & Activity */}
              <div className="space-y-6">
                <DashboardCardErrorBoundary fallbackTitle="Quick Actions unavailable">
                  <QuickActions />
                </DashboardCardErrorBoundary>
                <DashboardCardErrorBoundary fallbackTitle="Activity unavailable">
                  <ActivityOverviewCard />
                </DashboardCardErrorBoundary>
              </div>

              {/* Right Column - Notifications & Links */}
              <div className="space-y-6 md:col-span-2 xl:col-span-1" id="notifications-section">
                <DashboardCardErrorBoundary fallbackTitle="Notifications unavailable">
                  <NotificationsPreview />
                </DashboardCardErrorBoundary>
                <UsefulLinksCard />
              </div>
            </div>

            {/* Bottom Row - Favorites & Shortlists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <DashboardCardErrorBoundary fallbackTitle="Favorites unavailable">
                <FavoritesCard />
              </DashboardCardErrorBoundary>
              <DashboardCardErrorBoundary fallbackTitle="Shortlist unavailable">
                <ShortlistCard />
              </DashboardCardErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyDashboard;
