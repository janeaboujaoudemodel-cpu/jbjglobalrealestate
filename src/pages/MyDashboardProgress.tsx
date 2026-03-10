import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTierProgress } from "@/hooks/useTierProgress";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft, Award, Star, Zap, Crown, Trophy, Compass, Search, TrendingUp } from "lucide-react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

// Broker tier icons
const brokerTierIcons: Record<string, React.ReactNode> = {
  starter: <Star className="w-6 h-6" />,
  rising: <Zap className="w-6 h-6" />,
  performer: <Award className="w-6 h-6" />,
  elite: <Crown className="w-6 h-6" />,
  legend: <Trophy className="w-6 h-6" />,
};

// Investor tier icons
const investorTierIcons: Record<string, React.ReactNode> = {
  explorer: <Compass className="w-6 h-6" />,
  seeker: <Search className="w-6 h-6" />,
  investor: <TrendingUp className="w-6 h-6" />,
  premium: <Crown className="w-6 h-6" />,
  elite: <Trophy className="w-6 h-6" />,
};

const MyDashboardProgress = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    tierProgress, 
    isLoading, 
    currentTierType,
    isCombinedMode,
    investorTierProgress,
    brokerTierProgress
  } = useTierProgress();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/my-dashboard/progress');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <BrandedLoader text="Loading..." className="min-h-screen" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentTierName = tierProgress?.currentTier?.tier_name || 'Starter';
  const nextTierName = tierProgress?.nextTier?.tier_name;
  const totalPoints = tierProgress?.totalPoints || 0;
  const pointsToNext = tierProgress?.pointsToNextTier || 0;
  const progressPercent = tierProgress?.progressPercent || 0;

  return (
    <>
      <SEOHead 
        title="My Progress | JBJ Global Real Estate"
        description="Track your tier progress, badges, and achievements."
      />
      
      <div className="min-h-screen bg-black">
        {/* Premium Page Header — aligned with sidebar logo divider */}
        <div className="bg-black border-b border-gold/20">
          <div className="container mx-auto px-6 max-w-4xl flex items-end h-[84px] pb-4 gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/my-dashboard')}
              className="text-gold hover:text-gold/80 hover:bg-gold/10 mb-0.5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              My <span className="text-gold">Progress</span>
            </h1>
          </div>
        </div>

        <div className="mx-3 md:mx-4 lg:mx-6 mb-6 mt-0 rounded-b-2xl rounded-t-none border border-t-0 border-border bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))]">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <p className="text-muted-foreground mb-6">
              Track your tier progress, badges, and achievements.
            </p>

            {/* Total Points Card */}
            <Card className="mb-6 border-gold/30 bg-gradient-to-br from-gold/10 to-gold/5">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground text-sm mb-2">Total Points Earned</p>
                <p className="text-5xl font-bold text-gold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {totalPoints.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Tier Progress */}
            {isCombinedMode && investorTierProgress && brokerTierProgress ? (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Investor Path */}
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-emerald-600">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                        {investorTierIcons[investorTierProgress.currentTier?.tier_name?.toLowerCase() || 'explorer'] || <Compass className="w-6 h-6" />}
                      </div>
                      Investor Path
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/40 mb-4">
                      {investorTierProgress.currentTier?.tier_name || 'Explorer'}
                    </Badge>
                    <p className="text-2xl font-bold text-foreground mb-4">
                      {investorTierProgress.totalPoints.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">points</span>
                    </p>
                    {investorTierProgress.nextTier && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Next: {investorTierProgress.nextTier.tier_name}</span>
                          <span className="text-emerald-600">{investorTierProgress.pointsToNextTier} pts to go</span>
                        </div>
                        <Progress value={investorTierProgress.progressPercent} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Broker Path */}
                <Card className="border-blue-500/30 bg-blue-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-blue-600">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                        {brokerTierIcons[brokerTierProgress.currentTier?.tier_name?.toLowerCase() || 'starter'] || <Star className="w-6 h-6" />}
                      </div>
                      Broker Path
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/40 mb-4">
                      {brokerTierProgress.currentTier?.tier_name || 'Starter'}
                    </Badge>
                    <p className="text-2xl font-bold text-foreground mb-4">
                      {brokerTierProgress.totalPoints.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">points</span>
                    </p>
                    {brokerTierProgress.nextTier && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Next: {brokerTierProgress.nextTier.tier_name}</span>
                          <span className="text-blue-600">{brokerTierProgress.pointsToNextTier} pts to go</span>
                        </div>
                        <Progress value={brokerTierProgress.progressPercent} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="mb-8 border-gold/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold/50 flex items-center justify-center">
                      {(currentTierType === 'broker' ? brokerTierIcons : investorTierIcons)[currentTierName.toLowerCase()] || <Star className="w-6 h-6 text-gold" />}
                    </div>
                    <div>
                      <Badge className={cn(
                        "mb-1",
                        currentTierType === 'broker' 
                          ? 'bg-blue-500/20 text-blue-600 border-blue-500/40' 
                          : 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40'
                      )}>
                        {currentTierType === 'broker' ? 'Broker Path' : 'Investor Path'}
                      </Badge>
                      <p className="text-xl font-bold text-foreground">{currentTierName}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground mb-4">
                    {totalPoints.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">points</span>
                  </p>
                  {nextTierName && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Next Tier: {nextTierName}</span>
                        <span className="text-gold font-medium">{pointsToNext} pts to go</span>
                      </div>
                      <Progress value={progressPercent} className="h-3" />
                      <p className="text-xs text-muted-foreground text-center">
                        {progressPercent.toFixed(0)}% complete
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* How to Earn Points */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-gold" />
                  How to Earn Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span>Complete your profile</span>
                    <Badge variant="outline">+100 pts</Badge>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span>Save a property to favorites</span>
                    <Badge variant="outline">+10 pts</Badge>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span>Schedule a viewing</span>
                    <Badge variant="outline">+50 pts</Badge>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span>Complete a transaction</span>
                    <Badge variant="outline">+500 pts</Badge>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span>Refer a friend</span>
                    <Badge variant="outline">+200 pts</Badge>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyDashboardProgress;
