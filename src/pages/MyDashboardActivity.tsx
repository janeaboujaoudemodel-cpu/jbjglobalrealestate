import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePointsLedger } from "@/hooks/usePointsLedger";
import { SEOHead } from "@/components/SEOHead";
import { Loader2, ArrowLeft, Activity, Calendar, Flame, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";

const MyDashboardActivity = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { entries, isLoading } = usePointsLedger();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/my-dashboard/activity');
    }
  }, [user, authLoading, navigate]);

  // Calculate activity stats
  const stats = useMemo(() => {
    if (!entries || entries.length === 0) {
      return { daysActive: 0, currentStreak: 0, weeklyPoints: 0, totalActivities: 0 };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeDays = new Set<string>();
    let weeklyPoints = 0;

    entries.forEach(entry => {
      const entryDate = new Date(entry.created_at);
      if (entryDate >= thirtyDaysAgo) {
        activeDays.add(entryDate.toDateString());
      }
      if (entryDate >= oneWeekAgo) {
        weeklyPoints += entry.points_delta;
      }
    });

    // Calculate streak
    const sortedDates = Array.from(activeDays)
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    let currentStreak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (sortedDates.length > 0) {
      const latestDate = sortedDates[0].toDateString();
      if (latestDate === today || latestDate === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = sortedDates[i - 1];
          const currDate = sortedDates[i];
          const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    return {
      daysActive: activeDays.size,
      currentStreak,
      weeklyPoints,
      totalActivities: entries.length,
    };
  }, [entries]);

  if (authLoading || isLoading) {
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
        title="My Activity | JBJ Global Real Estate"
        description="View your activity history and engagement on the platform."
      />
      
      <div className="min-h-screen bg-black">
        <div className="mx-3 md:mx-4 lg:mx-6 my-6 rounded-2xl border border-border bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))]">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/my-dashboard')}
              className="mb-6 text-gold hover:text-gold/80"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
                My <span className="text-gold">Activity</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                View your activity history and engagement on the platform.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-gold/20 bg-gold/5">
                <CardContent className="p-4 text-center">
                  <Calendar className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.daysActive}</p>
                  <p className="text-xs text-muted-foreground">Days Active (30d)</p>
                </CardContent>
              </Card>
              
              <Card className="border-gold/20 bg-gold/5">
                <CardContent className="p-4 text-center">
                  <Flame className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </CardContent>
              </Card>
              
              <Card className="border-gold/20 bg-gold/5">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.weeklyPoints}</p>
                  <p className="text-xs text-muted-foreground">Points This Week</p>
                </CardContent>
              </Card>
              
              <Card className="border-gold/20 bg-gold/5">
                <CardContent className="p-4 text-center">
                  <Activity className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.totalActivities}</p>
                  <p className="text-xs text-muted-foreground">Total Activities</p>
                </CardContent>
              </Card>
            </div>

            {/* Activity Timeline */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entries && entries.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {entries.slice(0, 50).map((entry, index) => (
                        <div 
                          key={entry.id || index} 
                          className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                            <Activity className="w-4 h-4 text-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {(entry as any).reason || (entry as any).action_type || 'Activity'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={entry.points_delta >= 0 ? 'text-emerald-600 border-emerald-500/30' : 'text-red-600 border-red-500/30'}
                          >
                            {entry.points_delta >= 0 ? '+' : ''}{entry.points_delta} pts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No activity recorded yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start exploring properties to earn points!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyDashboardActivity;
