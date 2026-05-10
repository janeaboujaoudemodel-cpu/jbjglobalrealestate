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

interface TierCardProps {
  tierName: string;
  totalPoints: number;
  nextTierName?: string;
  pointsToNext: number;
  progressPercent: number;
  tierType: 'broker' | 'client';
  compact?: boolean;
}

const TierCard = ({ tierName, totalPoints, nextTierName, pointsToNext, progressPercent, tierType, compact = false }: TierCardProps) => {
  const tierIcons = tierType === 'broker' ? brokerTierIcons : investorTierIcons;
  const isBroker = tierType === 'broker';
  
  const bgClass = isBroker 
    ? 'border-blue-500/30 bg-blue-500/5' 
    : 'border-emerald-500/30 bg-emerald-500/5';
  const iconBgClass = isBroker
    ? 'bg-blue-500/20 border-blue-500/40'
    : 'bg-emerald-500/20 border-emerald-500/40';
  const textClass = isBroker ? 'text-blue-500' : 'text-emerald-500';
  const badgeClass = isBroker
    ? 'bg-blue-500/20 text-blue-500 border-blue-500/40'
    : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40';

  return (
    <div className={cn("flex flex-col p-3 rounded-xl border", bgClass)}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center", iconBgClass)}>
          <span className={textClass}>
            {tierIcons[tierName.toLowerCase()] || <Star className="w-4 h-4" />}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-[10px] uppercase tracking-wide font-semibold", textClass)}>
            {isBroker ? 'Broker Path' : 'Investor Path'}
          </p>
          <Badge className={cn("text-xs", badgeClass)}>
            {tierName}
          </Badge>
        </div>
      </div>
      
      {!compact && (
        <>
          <p className="text-lg font-bold text-foreground">
            {totalPoints.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">pts</span>
          </p>
          
          {nextTierName && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Next: {nextTierName}</span>
                <span className={cn("font-medium", textClass)}>{pointsToNext} pts</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const BadgesLevelCard = () => {
  const { 
    tierProgress, 
    isLoading, 
    currentTierType,
    isCombinedMode,
    investorTierProgress,
    brokerTierProgress
  } = useTierProgress();

  // Single mode values
  const currentTierName = tierProgress?.currentTier?.tier_name || 'Starter';
  const nextTierName = tierProgress?.nextTier?.tier_name;
  const totalPoints = tierProgress?.totalPoints || 0;
  const pointsToNext = tierProgress?.pointsToNextTier || 0;
  const progressPercent = tierProgress?.progressPercent || 0;

  return (
    <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center">
            <Award className="w-4 h-4 text-[#1A1A1A]" />
          </div>
          Level & Badges
          {isCombinedMode ? (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full ml-2 bg-purple-500/20 text-purple-600 border border-purple-500/30">
              Combined
            </span>
          ) : (
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full ml-2",
              currentTierType === 'broker' 
                ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30' 
                : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
            )}>
              {currentTierType === 'broker' ? 'Broker' : 'Investor'}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        ) : isCombinedMode && investorTierProgress && brokerTierProgress ? (
          // Combined Mode: Show both tier paths side by side
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <TierCard
                tierName={investorTierProgress.currentTier?.tier_name || 'Explorer'}
                totalPoints={investorTierProgress.totalPoints}
                nextTierName={investorTierProgress.nextTier?.tier_name}
                pointsToNext={investorTierProgress.pointsToNextTier}
                progressPercent={investorTierProgress.progressPercent}
                tierType="client"
              />
              <TierCard
                tierName={brokerTierProgress.currentTier?.tier_name || 'Starter'}
                totalPoints={brokerTierProgress.totalPoints}
                nextTierName={brokerTierProgress.nextTier?.tier_name}
                pointsToNext={brokerTierProgress.pointsToNextTier}
                progressPercent={brokerTierProgress.progressPercent}
                tierType="broker"
              />
            </div>

            {/* Shared total points */}
            <div className="text-center py-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Total Points: <span className="font-bold text-[#1A1A1A]">{totalPoints.toLocaleString()}</span>
              </p>
            </div>

            <Button variant="link" className="w-full text-[#1A1A1A] mt-2 p-0" asChild>
              <Link to="/my-dashboard/progress">
                View Full Progress
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </>
        ) : (
          // Single Mode: Show one tier path
          <>
            {/* Current Level Badge */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-[#B89555]/30 bg-[#EFE6D6]/5 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-[#B89555]/50 flex items-center justify-center">
                {(currentTierType === 'broker' ? brokerTierIcons : investorTierIcons)[currentTierName.toLowerCase()] || <Star className="w-6 h-6 text-[#1A1A1A]" />}
              </div>
              <div className="flex-1">
                <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/40 mb-1">
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
                  <span className="text-[#1A1A1A] font-medium">{pointsToNext} pts to go</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            {/* View Full Progress */}
            <Button variant="link" className="w-full text-[#1A1A1A] mt-4 p-0" asChild>
              <Link to="/my-dashboard/progress">
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
