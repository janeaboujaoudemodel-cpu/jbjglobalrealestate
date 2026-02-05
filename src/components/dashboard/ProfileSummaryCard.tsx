import { Link } from "react-router-dom";
import { User, ChevronRight, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useTierProgress } from "@/hooks/useTierProgress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { tierProgress, isLoading: tierLoading } = useTierProgress();

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
  const tierName = tierProgress?.currentTier?.tier_name || 'Starter';
  const totalPoints = tierProgress?.totalPoints || 0;

  return (
    <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
            <User className="w-4 h-4 text-gold" />
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
              <Avatar className="w-16 h-16 border-2 border-gold/40">
                <AvatarImage src={photoUrl || ''} alt={displayName} />
                <AvatarFallback className="bg-gold/10 text-gold text-xl font-bold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-foreground truncate">{displayName}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="border-gold/40 text-foreground bg-gold/10 text-xs">
                    {roleLabel}
                  </Badge>
                  <Badge className="bg-gold/20 text-gold border-gold/40 text-xs">
                    {tierName}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalPoints.toLocaleString()} total points
                </p>
              </div>
            </div>

            <Button variant="link" className="w-full text-gold mt-4 p-0" asChild>
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
