import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { SEOHead } from "@/components/SEOHead";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

const MyDashboard = () => {
  const navigate = useNavigate();
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

            {/* Main Grid Layout - Improved responsive behavior */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Left Column - Profile & Level */}
              <div className="space-y-6">
                <DashboardCardErrorBoundary fallbackTitle="Profile unavailable">
                  <ProfileSummaryCard />
                </DashboardCardErrorBoundary>
                <DashboardCardErrorBoundary fallbackTitle="Badges unavailable">
                  <BadgesLevelCard />
                </DashboardCardErrorBoundary>
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

              {/* Right Column - Notifications */}
              <div className="space-y-6 md:col-span-2 xl:col-span-1">
                <DashboardCardErrorBoundary fallbackTitle="Notifications unavailable">
                  <NotificationsPreview />
                </DashboardCardErrorBoundary>
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
