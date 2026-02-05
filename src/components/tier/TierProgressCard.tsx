import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge, getTierColor } from "./TierBadge";
import { useTierProgress } from "@/hooks/useTierProgress";
import { Loader2, TrendingUp, Target, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface TierProgressCardProps {
  className?: string;
  showHistory?: boolean;
  compact?: boolean;
}

export function TierProgressCard({ className, showHistory = false, compact = false }: TierProgressCardProps) {
  const { tierProgress, isLoading, error } = useTierProgress();

  if (isLoading) {
    return (
      <Card className={cn("bg-black/40 border-white/10", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error || !tierProgress) {
    return null;
  }

  const { currentTier, nextTier, totalPoints, pointsToNextTier, progressPercent } = tierProgress;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <TierBadge tierName={currentTier?.tier_name || 'Starter'} size="sm" />
        <div className="flex-1 min-w-0">
          <Progress 
            value={progressPercent} 
            className="h-2 bg-white/10"
            style={{ '--progress-color': getTierColor(currentTier?.tier_name || 'Starter') } as React.CSSProperties}
          />
        </div>
        <span className="text-xs text-white/60 whitespace-nowrap">
          {totalPoints.toLocaleString()} pts
        </span>
      </div>
    );
  }

  return (
    <Card className={cn("bg-black/40 border-white/10 backdrop-blur-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold" />
            Your Progress
          </span>
          <TierBadge tierName={currentTier?.tier_name || 'Starter'} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gold">{totalPoints.toLocaleString()}</div>
            <div className="text-xs text-white/60">Total Points</div>
          </div>
          {nextTier && (
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{pointsToNextTier.toLocaleString()}</div>
              <div className="text-xs text-white/60">To {nextTier.tier_name}</div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/60">
              <span>{currentTier?.tier_name}</span>
              <span>{nextTier.tier_name}</span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-3 bg-white/10"
            />
            <div className="text-center text-sm text-white/80">
              {progressPercent}% to next tier
            </div>
          </div>
        )}

        {/* Current Tier Benefits */}
        {currentTier && currentTier.benefits.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-gold" />
              Your Benefits
            </div>
            <ul className="space-y-1">
              {currentTier.benefits.slice(0, 3).map((benefit, idx) => (
                <li key={idx} className="text-xs text-white/70 flex items-start gap-2">
                  <Target className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tier History */}
        {showHistory && tierProgress.tierHistory.length > 0 && (
          <div className="pt-2 border-t border-white/10">
            <div className="text-sm font-medium text-white/80 mb-2">Recent Achievements</div>
            <div className="space-y-1">
              {tierProgress.tierHistory.slice(0, 3).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-xs">
                  <span className="text-white/60">
                    {entry.old_tier ? `${entry.old_tier} → ` : 'Started as '}
                    <span className="text-gold">{entry.new_tier}</span>
                  </span>
                  <span className="text-white/40">
                    {new Date(entry.changed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
