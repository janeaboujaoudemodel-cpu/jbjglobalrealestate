import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDealBonuses, DealBonusThreshold } from "@/hooks/useDealBonuses";
import { Loader2, Gift, Trophy, CheckCircle, Clock, XCircle, DollarSign, Laptop, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DealBonusCardProps {
  className?: string;
}

export function DealBonusCard({ className }: DealBonusCardProps) {
  const { thresholds, dealPoints, isLoading, claimBonus, getEligibility } = useDealBonuses();
  const { toast } = useToast();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (threshold: DealBonusThreshold) => {
    setClaimingId(threshold.id);
    const result = await claimBonus(threshold.id);
    
    if (result.success) {
      toast({
        title: "Bonus Claimed!",
        description: `Your ${threshold.threshold_name} bonus claim has been submitted for approval.`,
      });
    } else {
      toast({
        title: "Claim Failed",
        description: result.error,
        variant: "destructive",
      });
    }
    
    setClaimingId(null);
  };

  if (isLoading) {
    return (
      <Card className={cn("bg-[#1A1A1A]/40 border-[#B89555]/20 backdrop-blur-sm", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#1A1A1A] animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-[#1A1A1A]/40 border-[#B89555]/20 backdrop-blur-sm", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          Deal Bonus Rewards
        </CardTitle>
        <p className="text-white/90 text-sm mt-2">
          Earn bonuses exclusively from closing deals. Your current deal points: <span className="text-[#1A1A1A] font-semibold">{dealPoints.toLocaleString()}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {thresholds.map((threshold) => {
          const eligibility = getEligibility(threshold);
          const IconComponent = threshold.bonus_type === 'hardware' 
            ? (threshold.hardware_item?.includes('MacBook') ? Laptop : Smartphone)
            : DollarSign;

          return (
            <div
              key={threshold.id}
              className={cn(
                "p-4 rounded-xl border transition-all duration-300",
                eligibility.eligible && !eligibility.claimed
                  ? "border-[#B89555]/50 bg-[#EFE6D6]/5"
                  : "border-white/10 bg-[#FDFBF7]/5"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    eligibility.claimed ? "bg-emerald-500/20" : "bg-[#EFE6D6]/20"
                  )}>
                    <IconComponent className={cn(
                      "w-6 h-6",
                      eligibility.claimed ? "text-emerald-400" : "text-[#1A1A1A]"
                    )} />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold flex items-center gap-2">
                      {threshold.threshold_name}
                      {eligibility.claimed && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            eligibility.claimStatus === 'paid' && "border-emerald-500 text-emerald-400",
                            eligibility.claimStatus === 'approved' && "border-blue-500 text-blue-400",
                            eligibility.claimStatus === 'pending' && "border-amber-500 text-[#1A1A1A]",
                            eligibility.claimStatus === 'rejected' && "border-red-500 text-red-400"
                          )}
                        >
                          {eligibility.claimStatus === 'paid' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {eligibility.claimStatus === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {eligibility.claimStatus === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          {eligibility.claimStatus}
                        </Badge>
                      )}
                    </h4>
                    <p className="text-white/90 text-sm">
                      {threshold.bonus_type === 'cash' 
                        ? `AED ${threshold.bonus_value_aed?.toLocaleString()}`
                        : threshold.hardware_item
                      }
                    </p>
                  </div>
                </div>

                {!eligibility.claimed && (
                  <Button
                    size="sm"
                    disabled={!eligibility.eligible || claimingId === threshold.id}
                    onClick={() => handleClaim(threshold)}
                    className={cn(
                      eligibility.eligible
                        ? "bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
                        : "bg-[#FDFBF7]/10 text-white/90"
                    )}
                  >
                    {claimingId === threshold.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-1" />
                        Claim
                      </>
                    )}
                  </Button>
                )}
              </div>

              {!eligibility.claimed && !eligibility.eligible && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-white/90 mb-1">
                    <span>{dealPoints.toLocaleString()} / {threshold.required_deal_points.toLocaleString()} pts</span>
                    <span>{Math.round(eligibility.progress)}%</span>
                  </div>
                  <Progress 
                    value={eligibility.progress} 
                    className="h-2 bg-[#FDFBF7]/10"
                  />
                  <p className="text-xs text-white/85 mt-1">
                    {eligibility.pointsNeeded.toLocaleString()} more deal points needed
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {thresholds.length === 0 && (
          <div className="text-center py-8 text-white/90">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No bonus tiers available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
