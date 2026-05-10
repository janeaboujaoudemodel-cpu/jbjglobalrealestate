import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMonthlyDraw } from "@/hooks/useMonthlyDraw";
import { Loader2, Gift, Calendar, Trophy, CheckCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface MonthlyDrawCardProps {
  className?: string;
}

export function MonthlyDrawCard({ className }: MonthlyDrawCardProps) {
  const { 
    currentDraw, 
    userEntry, 
    pastDraws, 
    isLoading, 
    enterDraw, 
    getEligibility,
    getMonthName 
  } = useMonthlyDraw();
  const { toast } = useToast();
  const [isEntering, setIsEntering] = useState(false);

  const handleEnter = async () => {
    setIsEntering(true);
    const result = await enterDraw();
    
    if (result.success) {
      toast({
        title: "You're Entered!",
        description: "Good luck in this month's draw!",
      });
    } else {
      toast({
        title: "Entry Failed",
        description: result.error,
        variant: "destructive",
      });
    }
    
    setIsEntering(false);
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

  const eligibility = getEligibility();

  return (
    <Card className={cn("bg-[#1A1A1A]/40 border-[#B89555]/20 backdrop-blur-sm overflow-hidden", className)}>
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-purple-600/20 via-gold/20 to-purple-600/20 p-1">
        <CardHeader className="bg-[#1A1A1A]/60 backdrop-blur-sm pb-4">
          <CardTitle className="text-xl text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-400" />
            </div>
            Monthly Giveaway Draw
          </CardTitle>
        </CardHeader>
      </div>
      
      <CardContent className="pt-6 space-y-6">
        {currentDraw ? (
          <>
            {/* Current Draw Info */}
            <div className="bg-gradient-to-br from-purple-500/10 to-gold/10 rounded-xl p-5 border border-purple-500/20">
              <div className="flex items-center gap-2 text-purple-300 text-sm mb-3">
                <Calendar className="w-4 h-4" />
                {getMonthName(currentDraw.draw_month)} {currentDraw.draw_year}
              </div>
              
              <h3 className="text-white text-lg font-semibold mb-2">
                {currentDraw.prize_description}
              </h3>
              
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <Users className="w-4 h-4" />
                Minimum {currentDraw.min_activity_points} activity points to enter
              </div>
            </div>

            {/* Entry Status */}
            {userEntry ? (
              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-300 font-semibold">You're Entered!</p>
                <p className="text-white/90 text-sm mt-1">
                  Entered with {userEntry.activity_points_at_entry} points
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {eligibility.eligible ? (
                  <Button
                    onClick={handleEnter}
                    disabled={isEntering}
                    className="w-full bg-gradient-to-r from-purple-500 to-gold hover:from-purple-600 hover:to-gold/90 text-white py-6 text-lg"
                  >
                    {isEntering ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Gift className="w-5 h-5 mr-2" />
                    )}
                    Enter Draw Now
                  </Button>
                ) : (
                  <div className="text-center">
                    <p className="text-white/90 mb-3">{eligibility.reason}</p>
                    {eligibility.progress !== undefined && (
                      <Progress 
                        value={eligibility.progress} 
                        className="h-2 bg-[#FDFBF7]/10"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-white/90">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No active draw this month</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        )}

        {/* Past Winners */}
        {pastDraws.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#1A1A1A]" />
              Past Winners
            </h4>
            <div className="space-y-2">
              {pastDraws.slice(0, 3).map((draw) => (
                <div 
                  key={draw.id}
                  className="flex items-center justify-between text-sm py-2 px-3 bg-[#FDFBF7]/5 rounded-lg"
                >
                  <span className="text-white/90">
                    {getMonthName(draw.draw_month)} {draw.draw_year}
                  </span>
                  <Badge variant="outline" className="border-[#B89555]/50 text-[#1A1A1A]">
                    Winner Selected
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
