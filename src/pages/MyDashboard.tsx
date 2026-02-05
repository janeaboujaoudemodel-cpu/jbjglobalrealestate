import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { Loader2 } from "lucide-react";

// Dashboard modules
import FavoritesCard from "@/components/dashboard/FavoritesCard";
import ShortlistCard from "@/components/dashboard/ShortlistCard";
import BadgesLevelCard from "@/components/dashboard/BadgesLevelCard";
import ProfileSummaryCard from "@/components/dashboard/ProfileSummaryCard";
import ActivityOverviewCard from "@/components/dashboard/ActivityOverviewCard";
import NotificationsPreview from "@/components/dashboard/NotificationsPreview";
import { QuickActions } from "@/components/dashboard/QuickActions";

const MyDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/my-dashboard');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
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
              <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                My <span className="text-gold">Dashboard</span>
              </h1>
              <p className="text-muted-foreground">
                Welcome back! Here's an overview of your activity and saved items.
              </p>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile & Level */}
              <div className="space-y-6">
                <ProfileSummaryCard />
                <BadgesLevelCard />
              </div>

              {/* Center Column - Quick Actions & Activity */}
              <div className="space-y-6">
                <QuickActions />
                <ActivityOverviewCard />
              </div>

              {/* Right Column - Notifications */}
              <div className="space-y-6">
                <NotificationsPreview />
              </div>
            </div>

            {/* Bottom Row - Favorites & Shortlists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FavoritesCard />
              <ShortlistCard />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyDashboard;
