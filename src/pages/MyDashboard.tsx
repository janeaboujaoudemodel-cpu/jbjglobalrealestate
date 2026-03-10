import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { SEOHead } from "@/components/SEOHead";
import { Loader2, BookOpen, ChevronRight, ListChecks, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { scrollToId } from "@/lib/scroll";
import { cn } from "@/lib/utils";

// Dashboard modules
import FavoritesCard from "@/components/dashboard/FavoritesCard";
import ShortlistCard from "@/components/dashboard/ShortlistCard";
import BadgesLevelCard from "@/components/dashboard/BadgesLevelCard";
import ProfileSummaryCard from "@/components/dashboard/ProfileSummaryCard";
import ActivityOverviewCard from "@/components/dashboard/ActivityOverviewCard";
import NotificationsPreview from "@/components/dashboard/NotificationsPreview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import DashboardCardErrorBoundary from "@/components/dashboard/DashboardCardErrorBoundary";
import MyTasksCard from "@/components/dashboard/MyTasksCard";
import marketIntelligenceCover from "@/assets/books/market-intelligence-cover.jpg";
import guidesLibraryCover from "@/assets/books/guides-library-cover.jpg";
import goldenVisaCover from "@/assets/books/golden-visa-cover.jpg";
import investorEducationCover from "@/assets/books/investor-education-cover.jpg";
import { BookCoverFace } from "@/components/books/BookCoverFace";
import type { BookData } from "@/types/books";

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

// Valid section hash names
const SECTION_IDS: Record<string, string> = {
  '#profile': 'profile-section',
  '#notifications': 'notifications-section',
  '#tasks': 'tasks-section',
  '#favorites': 'favorites-section',
  '#shortlist': 'shortlist-section',
  '#activity': 'activity-section',
  '#badges': 'badges-section',
  '#ai-tools': 'ai-tools-section',
};

/** Useful Links card for dashboard */
function UsefulLinksCard() {
  const books: BookData[] = [
    {
      title: "Market Intelligence Report",
      href: "/market-intelligence/overview",
      cover: marketIntelligenceCover,
      category: "report",
      icon: "chart",
      coverLocked: true,
      tableOfContents: [],
    },
    {
      title: "Guides Library",
      href: "/guides",
      cover: guidesLibraryCover,
      category: "guide",
      icon: "book",
      coverLocked: true,
      tableOfContents: [],
    },
    {
      title: "Golden Visa UAE Guide",
      href: "/guides/golden-visa-uae",
      cover: goldenVisaCover,
      category: "guide",
      icon: "flag",
      coverLocked: true,
      tableOfContents: [],
    },
    {
      title: "Investor Education Guide",
      href: "/investor-hub",
      cover: investorEducationCover,
      category: "education",
      icon: "graduation",
      coverLocked: true,
      tableOfContents: [],
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-gold" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Explore & Learn</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {books.map((book) => (
          <Link key={book.href} to={book.href} className="group flex flex-col items-center gap-2">
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative w-[110px] h-[165px] mx-auto"
              style={{ perspective: '1000px' }}
            >
              {/* Book shadow */}
              <div className="absolute -bottom-2 left-2 right-2 h-4 bg-black/30 blur-lg rounded-full group-hover:blur-xl group-hover:bg-[#C8A766]/20 transition-all" />

              <div
                className="relative w-full h-full border border-[#C8A766]/30 shadow-[4px_4px_15px_rgba(0,0,0,0.4)] group-hover:shadow-[8px_8px_35px_rgba(200,167,102,0.35)] transition-all duration-500 transform-gpu rounded-r-md overflow-hidden"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'rotateY(-8deg) rotateX(2deg)',
                }}
              >
                {/* Spine edge */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-[#C8A766]/30 via-black/30 to-transparent z-10" />

                <BookCoverFace book={book} size="modal" />

                {/* Hover sheen */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-10" />

                {/* Page edge (right side thickness) */}
                <div className="absolute right-0 top-0 bottom-0 w-[6px] z-10">
                  <div className="h-full bg-gradient-to-l from-zinc-200/15 via-zinc-300/10 to-transparent" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 95%, 0 5%)' }} />
                  <div className="absolute right-0 top-[4%] bottom-[4%] w-[2px] bg-zinc-400/15" />
                  <div className="absolute right-[3px] top-[5%] bottom-[5%] w-[1px] bg-zinc-400/10" />
                  <div className="absolute right-[5px] top-[6%] bottom-[6%] w-[1px] bg-zinc-400/5" />
                </div>
              </div>

              {/* 3D spine side */}
              <div
                className="absolute top-0 left-0 w-[6px] h-full bg-gradient-to-r from-zinc-700 to-zinc-800 origin-left rounded-l-sm"
                style={{ transform: 'rotateY(-90deg) translateX(-3px)' }}
              />
              {/* 3D bottom pages */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-b from-[#f0e8d8] to-[#ddd0b8]"
                style={{ transform: 'rotateX(90deg) translateY(2px)', transformOrigin: 'bottom' }}
              />
            </motion.div>
            <p className="text-xs text-foreground/70 text-center font-medium group-hover:text-gold transition-colors leading-tight max-w-[120px]">
              {book.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
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

  // Track which section is highlighted via hash
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Listen for mode changes
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handleModeChange = () => forceUpdate(n => n + 1);
    window.addEventListener('userModeChange', handleModeChange);
    return () => window.removeEventListener('userModeChange', handleModeChange);
  }, []);

  // Scroll to section if hash is present, with proper offset and gold highlight
  useEffect(() => {
    const hash = location.hash;
    const sectionId = SECTION_IDS[hash];
    if (!sectionId) {
      setActiveSection(null);
      return;
    }

    // Set active section for gold highlight
    setActiveSection(sectionId);

    // Scroll after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      scrollToId(sectionId, { extraOffset: 16 });
    }, 400);

    // Remove highlight after 4 seconds
    const clearTimer = setTimeout(() => {
      setActiveSection(null);
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
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

  // Helper for section wrapper classes with gold highlight
  const sectionClass = (id: string) => cn(
    "rounded-2xl transition-all duration-700",
    activeSection === id
      ? "ring-2 ring-gold/70 shadow-[0_0_24px_rgba(200,167,102,0.3)] bg-gold/5"
      : ""
  );

  return (
    <>
      <SEOHead 
        title="My Dashboard | JBJ Global Real Estate"
        description="Your personalized dashboard with favorites, shortlists, progress, and notifications."
      />
      
      <div className="min-h-screen bg-black">
        <div className="mx-0 my-0 rounded-none border-0 bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))]">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Dashboard Title + Badge */}
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-black" style={{ fontFamily: 'Poppins, sans-serif' }}>
                My <span className="text-gold">Dashboard</span>
              </h1>
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
            {/* Welcome subtitle */}
            <p className="text-muted-foreground mb-6">
              {isCombinedMode 
                ? "Full access to investor tools and broker features."
                : isBrokerMode 
                  ? "Access your broker tools and dashboard."
                  : "Welcome back! Here's an overview of your activity and saved items."
              }
            </p>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Left Column - Profile & Level */}
              <div className="space-y-6">
                <div id="profile-section" className={sectionClass('profile-section')}>
                  <DashboardCardErrorBoundary fallbackTitle="Profile unavailable">
                    <ProfileSummaryCard />
                  </DashboardCardErrorBoundary>
                </div>
                <div id="badges-section" className={sectionClass('badges-section')}>
                  <DashboardCardErrorBoundary fallbackTitle="Badges unavailable">
                    <BadgesLevelCard />
                  </DashboardCardErrorBoundary>
                </div>
                <AccountSettingsCard />
              </div>

              {/* Center Column - Quick Actions & Activity */}
              <div className="space-y-6">
                <DashboardCardErrorBoundary fallbackTitle="Quick Actions unavailable">
                  <QuickActions />
                </DashboardCardErrorBoundary>
                <div id="activity-section" className={sectionClass('activity-section')}>
                  <DashboardCardErrorBoundary fallbackTitle="Activity unavailable">
                    <ActivityOverviewCard />
                  </DashboardCardErrorBoundary>
                </div>
              </div>

              {/* Right Column - Notifications & Links */}
              <div className="space-y-6 md:col-span-2 xl:col-span-1">
                <div id="notifications-section" className={sectionClass('notifications-section')}>
                  <DashboardCardErrorBoundary fallbackTitle="Notifications unavailable">
                    <NotificationsPreview />
                  </DashboardCardErrorBoundary>
                </div>
                <UsefulLinksCard />
              </div>
            </div>

            {/* My Tasks Section - Full Width */}
            <div className="mt-6" id="tasks-section">
              <div className={sectionClass('tasks-section')}>
                <DashboardCardErrorBoundary fallbackTitle="Tasks unavailable">
                  <MyTasksCard />
                </DashboardCardErrorBoundary>
              </div>
            </div>

            {/* Bottom Row - Favorites & Shortlists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div id="favorites-section" className={sectionClass('favorites-section')}>
                <DashboardCardErrorBoundary fallbackTitle="Favorites unavailable">
                  <FavoritesCard />
                </DashboardCardErrorBoundary>
              </div>
              <div id="shortlist-section" className={sectionClass('shortlist-section')}>
                <DashboardCardErrorBoundary fallbackTitle="Shortlist unavailable">
                  <ShortlistCard />
                </DashboardCardErrorBoundary>
              </div>
            </div>

            {/* AI Tools Section with "Explore All Tools" button */}
            <div className="mt-6" id="ai-tools-section">
              <div className={sectionClass('ai-tools-section')}>
                <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-foreground flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-gold" />
                      </div>
                      AI Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">
                      Access your suite of AI-powered professional tools — design studio, video builder, copywriter, and more.
                    </p>
                    <Button asChild className="w-full bg-gradient-to-r from-gold/90 to-gold hover:from-gold hover:to-gold/90 text-black font-semibold shadow-lg">
                      <Link to="/toolkit">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Explore All AI Tools
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyDashboard;
