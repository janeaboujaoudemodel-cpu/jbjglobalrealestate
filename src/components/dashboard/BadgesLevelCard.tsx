import { Link } from "react-router-dom";
import { Award, ChevronRight, Star, TrendingUp, Crown, Trophy, Zap, Compass, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTierProgress } from "@/hooks/useTierProgress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Broker tier icons
const brokerTierIcons: Record<string, React.ReactNode> = {
  starter: <Star className="w-4 h-4" />,
  rising: <Zap className="w-4 h-4" />,
  performer: <Award className="w-4 h-4" />,
  elite: <Crown className="w-4 h-4" />,
  legend: <Trophy className="w-4 h-4" />,
};

// Investor (client) tier icons
const investorTierIcons: Record<string, React.ReactNode> = {
  explorer: <Compass className="w-4 h-4" />,
  seeker: <Search className="w-4 h-4" />,
  investor: <TrendingUp className="w-4 h-4" />,
  premium: <Crown className="w-4 h-4" />,
  elite: <Trophy className="w-4 h-4" />,
};

const BadgesLevelCard = () => {
  const { tierProgress, isLoading, currentTierType } = useTierProgress();

  const currentTierName = tierProgress?.currentTier?.tier_name || 'Starter';
  const nextTierName = tierProgress?.nextTier?.tier_name;
  const totalPoints = tierProgress?.totalPoints || 0;
  const pointsToNext = tierProgress?.pointsToNextTier || 0;
  const progressPercent = tierProgress?.progressPercent || 0;

  // Select the right icon set based on tier type
  const tierIcons = currentTierType === 'broker' ? brokerTierIcons : investorTierIcons;
  const isBrokerPath = currentTierType === 'broker';

  return (
    <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
            <Award className="w-4 h-4 text-gold" />
          </div>
          Level & Badges
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full ml-2",
            isBrokerPath 
              ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30' 
              : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
          )}>
            {isBrokerPath ? 'Broker' : 'Investor'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        ) : (
          <>
            {/* Current Level Badge */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-gold/30 bg-gold/5 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold/50 flex items-center justify-center">
                {tierIcons[currentTierName.toLowerCase()] || <Star className="w-6 h-6 text-gold" />}
              </div>
              <div className="flex-1">
                <Badge className="bg-gold/20 text-gold border-gold/40 mb-1">
                  {currentTierName}
                </Badge>
                <p className="text-2xl font-bold text-foreground">
                  {totalPoints.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">points</span>
                </p>
              </div>
            </div>

            {/* Progress to Next Level */}
            {nextTierName && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next: {nextTierName}</span>
                  <span className="text-gold font-medium">{pointsToNext} pts to go</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            {/* View Full Progress */}
            <Button variant="link" className="w-full text-gold mt-4 p-0" asChild>
              <Link to="/my-dashboard">
                View Full Progress
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BadgesLevelCard;
