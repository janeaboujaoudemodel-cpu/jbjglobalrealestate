import { Link } from "react-router-dom";
import { User, ChevronRight, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatarPremium } from "@/components/account/UserAvatarPremium";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useTierProgress } from "@/hooks/useTierProgress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  investor: 'Investor',
  owner: 'Property Owner',
  broker_partner: 'Partner Broker',
  broker: 'JBJ Broker',
  visitor: 'Explorer',
};

const ProfileSummaryCard = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { 
    tierProgress, 
    isLoading: tierLoading,
    isCombinedMode,
    investorTierProgress,
    brokerTierProgress
  } = useTierProgress();

  const { data: crmProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['crm-profile-dashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('crm_users_profile')
        .select('display_name, photo_url, job_title')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const userMeta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    crmProfile?.display_name ||
    (typeof userMeta.full_name === 'string' ? userMeta.full_name : null) ||
    (typeof userMeta.name === 'string' ? userMeta.name : null) ||
    user?.email?.split('@')[0] ||
    'User';
  
  const photoUrl =
    crmProfile?.photo_url ||
    (typeof userMeta.avatar_url === 'string' ? userMeta.avatar_url : null) ||
    (typeof userMeta.picture === 'string' ? userMeta.picture : null) ||
    null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const isLoading = profileLoading || tierLoading;
  const roleLabel = roleLabels[role || ''] || 'Member';
  const totalPoints = tierProgress?.totalPoints || 0;

  // Get tier names for combined mode
  const investorTierName = investorTierProgress?.currentTier?.tier_name || 'Explorer';
  const brokerTierName = brokerTierProgress?.currentTier?.tier_name || 'Starter';
  const singleTierName = tierProgress?.currentTier?.tier_name || 'Starter';

  return (
    <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center">
            <User className="w-4 h-4 text-[#1A1A1A]" />
          </div>
          My Profile
        </CardTitle>
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link to="/profile?tab=settings">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <UserAvatarPremium size="lg" nameOverride={displayName} photoOverride={photoUrl} />

              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-foreground truncate">{displayName}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="border-[#B89555]/40 text-foreground bg-[#EFE6D6]/10 text-xs">
                    {roleLabel}
                  </Badge>
                  
                  {/* Show dual tier badges in combined mode */}
                  {isCombinedMode ? (
                    <>
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/40 text-xs">
                        {investorTierName}
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/40 text-xs">
                        {brokerTierName}
                      </Badge>
                    </>
                  ) : (
                    <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/40 text-xs">
                      {singleTierName}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalPoints.toLocaleString()} total points
                </p>
              </div>
            </div>

            <Button variant="link" className="w-full text-[#1A1A1A] mt-4 p-0" asChild>
              <Link to="/profile">
                Edit Profile
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileSummaryCard;
