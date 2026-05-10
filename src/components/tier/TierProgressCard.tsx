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

interface SingleTierSectionProps {
  label: string;
  tierName: string;
  tierType: 'broker' | 'client';
  totalPoints: number;
  pointsToNextTier: number;
  nextTierName?: string;
  progressPercent: number;
  benefits: string[];
  colorClass: string;
  bgClass: string;
}

const SingleTierSection = ({
  label,
  tierName,
  tierType,
  totalPoints,
  pointsToNextTier,
  nextTierName,
  progressPercent,
  benefits,
  colorClass,
  bgClass,
}: SingleTierSectionProps) => (
  <div className={cn("p-4 rounded-xl border", bgClass)}>
    {/* Header */}
    <div className="flex items-center justify-between mb-3">
      <span className={cn("text-xs font-semibold uppercase tracking-wide", colorClass)}>
        {label}
      </span>
      <TierBadge tierName={tierName} tierType={tierType} size="sm" />
    </div>

    {/* Points */}
    <div className="text-center mb-3">
      <div className={cn("text-2xl font-bold", colorClass)}>{totalPoints.toLocaleString()}</div>
      <div className="text-xs text-white/90">Total Points</div>
    </div>

    {/* Progress Bar */}
    {nextTierName && (
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-white/90">
          <span>{tierName}</span>
          <span>{nextTierName}</span>
        </div>
        <Progress value={progressPercent} className="h-2 bg-[#FDFBF7]/10" />
        <div className="text-center text-xs text-white/80">
          {pointsToNextTier.toLocaleString()} pts to next tier
        </div>
      </div>
    )}

    {/* Benefits */}
    {benefits.length > 0 && (
      <div className="mt-3 pt-3 border-t border-white/10">
        <ul className="space-y-1">
          {benefits.slice(0, 2).map((benefit, idx) => (
            <li key={idx} className="text-xs text-white/70 flex items-start gap-1.5">
              <Target className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: getTierColor(tierName) }} />
              <span className="line-clamp-1">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export function TierProgressCard({ className, showHistory = false, compact = false }: TierProgressCardProps) {
  const { 
    tierProgress, 
    isLoading, 
    error, 
    currentTierType,
    isCombinedMode,
    investorTierProgress,
    brokerTierProgress
  } = useTierProgress();

  if (isLoading) {
    return (
      <Card className={cn("bg-[#1A1A1A]/40 border-white/10", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#1A1A1A] animate-spin" />
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
            className="h-2 bg-[#FDFBF7]/10"
            style={{ '--progress-color': getTierColor(currentTier?.tier_name || 'Starter') } as React.CSSProperties}
          />
        </div>
        <span className="text-xs text-white/90 whitespace-nowrap">
          {totalPoints.toLocaleString()} pts
        </span>
      </div>
    );
  }

  // Combined Mode: Show dual tier progress
  if (isCombinedMode && investorTierProgress && brokerTierProgress) {
    return (
      <Card className={cn("bg-[#1A1A1A]/40 border-white/10 backdrop-blur-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1A1A1A]" />
              Your Progress
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Combined Path
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Shared Points Banner */}
          <div className="text-center py-3 bg-[#EFE6D6]/10 rounded-lg border border-[#B89555]/20">
            <div className="text-3xl font-bold text-[#1A1A1A]">{totalPoints.toLocaleString()}</div>
            <div className="text-xs text-white/90">Shared Points Balance</div>
          </div>

          {/* Dual Tier Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SingleTierSection
              label="Investor Path"
              tierName={investorTierProgress.currentTier?.tier_name || 'Explorer'}
              tierType="client"
              totalPoints={investorTierProgress.totalPoints}
              pointsToNextTier={investorTierProgress.pointsToNextTier}
              nextTierName={investorTierProgress.nextTier?.tier_name}
              progressPercent={investorTierProgress.progressPercent}
              benefits={investorTierProgress.currentTier?.benefits || []}
              colorClass="text-emerald-400"
              bgClass="bg-emerald-500/10 border-emerald-500/30"
            />
            <SingleTierSection
              label="Broker Path"
              tierName={brokerTierProgress.currentTier?.tier_name || 'Starter'}
              tierType="broker"
              totalPoints={brokerTierProgress.totalPoints}
              pointsToNextTier={brokerTierProgress.pointsToNextTier}
              nextTierName={brokerTierProgress.nextTier?.tier_name}
              progressPercent={brokerTierProgress.progressPercent}
              benefits={brokerTierProgress.currentTier?.benefits || []}
              colorClass="text-blue-400"
              bgClass="bg-blue-500/10 border-blue-500/30"
            />
          </div>

          {/* Tier History */}
          {showHistory && tierProgress.tierHistory.length > 0 && (
            <div className="pt-2 border-t border-white/10">
              <div className="text-sm font-medium text-white/80 mb-2">Recent Achievements</div>
              <div className="space-y-1">
                {tierProgress.tierHistory.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-xs">
                    <span className="text-white/90">
                      {entry.old_tier ? `${entry.old_tier} → ` : 'Started as '}
                      <span className="text-[#1A1A1A]">{entry.new_tier}</span>
                    </span>
                    <span className="text-white/85">
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

  // Single Mode: Original layout
  return (
    <Card className={cn("bg-[#1A1A1A]/40 border-white/10 backdrop-blur-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1A1A1A]" />
            Your Progress
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              currentTierType === 'broker' 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            )}>
              {currentTierType === 'broker' ? 'Broker Path' : 'Investor Path'}
            </span>
          </span>
          <TierBadge tierName={currentTier?.tier_name || 'Starter'} tierType={currentTierType} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#FDFBF7]/5 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[#1A1A1A]">{totalPoints.toLocaleString()}</div>
            <div className="text-xs text-white/90">Total Points</div>
          </div>
          {nextTier && (
            <div className="bg-[#FDFBF7]/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{pointsToNextTier.toLocaleString()}</div>
              <div className="text-xs text-white/90">To {nextTier.tier_name}</div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/90">
              <span>{currentTier?.tier_name}</span>
              <span>{nextTier.tier_name}</span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-3 bg-[#FDFBF7]/10"
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
              <Award className="w-4 h-4 text-[#1A1A1A]" />
              Your Benefits
            </div>
            <ul className="space-y-1">
              {currentTier.benefits.slice(0, 3).map((benefit, idx) => (
                <li key={idx} className="text-xs text-white/70 flex items-start gap-2">
                  <Target className="w-3 h-3 text-[#1A1A1A] mt-0.5 flex-shrink-0" />
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
                  <span className="text-white/90">
                    {entry.old_tier ? `${entry.old_tier} → ` : 'Started as '}
                    <span className="text-[#1A1A1A]">{entry.new_tier}</span>
                  </span>
                  <span className="text-white/85">
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
