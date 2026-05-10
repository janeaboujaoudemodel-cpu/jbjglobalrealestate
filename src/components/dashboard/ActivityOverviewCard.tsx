import { Link } from "react-router-dom";
import { Activity, ChevronRight, Calendar, Flame, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePointsLedger } from "@/hooks/usePointsLedger";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

const ActivityOverviewCard = () => {
  const { entries, isLoading } = usePointsLedger();

  // Calculate activity stats
  const stats = useMemo(() => {
    if (!entries || entries.length === 0) {
      return { daysActive: 0, currentStreak: 0, weeklyPoints: 0 };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Unique active days in last 30 days
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

    // Calculate streak (consecutive days ending today or yesterday)
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
    };
  }, [entries]);

  return (
    <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#1A1A1A]" />
          </div>
          Activity Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {/* Days Active */}
              <div className="text-center p-3 rounded-xl border border-[#B89555]/20 bg-[#EFE6D6]/5">
                <Calendar className="w-5 h-5 text-[#1A1A1A] mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{stats.daysActive}</p>
                <p className="text-xs text-muted-foreground">Days Active</p>
              </div>

              {/* Current Streak */}
              <div className="text-center p-3 rounded-xl border border-[#B89555]/20 bg-[#EFE6D6]/5">
                <Flame className="w-5 h-5 text-[#1A1A1A] mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{stats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>

              {/* Weekly Points */}
              <div className="text-center p-3 rounded-xl border border-[#B89555]/20 bg-[#EFE6D6]/5">
                <TrendingUp className="w-5 h-5 text-[#1A1A1A] mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{stats.weeklyPoints}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>

            <Button variant="link" className="w-full text-[#1A1A1A] mt-4 p-0" asChild>
              <Link to="/my-dashboard/activity">
                View Full Activity
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityOverviewCard;
