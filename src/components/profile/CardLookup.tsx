import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User, Trophy, Star, FileCheck, MapPin, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface CardLookupResult {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
  };
  card: {
    card_number: string;
    card_type: string | null;
    issued_at: string;
    card_status: string;
  };
  tier: string;
  totalPoints: number;
  recentActivity: {
    type: string;
    description: string;
    points: number;
    date: string;
  }[];
}

export function CardLookup() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<CardLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      // Search by card number
      const { data: cardData, error: cardError } = await supabase
        .from("membership_cards")
        .select("id, user_id, card_number, card_type, card_status, issued_at")
        .ilike("card_number", `%${searchQuery}%`)
        .limit(1)
        .maybeSingle();

      if (cardError) throw cardError;

      if (!cardData) {
        setError("No card found with that number");
        setIsSearching(false);
        return;
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, full_name")
        .eq("id", cardData.user_id)
        .maybeSingle();

      // Get user email from auth (we'll use profile data for display)
      const userInfo = {
        id: cardData.user_id,
        email: "***@***.com", // Masked for privacy
        first_name: profileData?.first_name || null,
        last_name: profileData?.last_name || null,
        full_name: profileData?.full_name || "Member",
      };

      // Get points ledger
      const { data: pointsData } = await supabase
        .from("points_ledger")
        .select("event_type, event_description, points_delta, created_at")
        .eq("user_id", cardData.user_id)
        .order("created_at", { ascending: false })
        .limit(10);

      const totalPoints = pointsData?.reduce((sum, p) => sum + (p.points_delta || 0), 0) || 0;

      // Determine tier based on points
      let tier = "Starter";
      if (totalPoints >= 5000) tier = "Legend";
      else if (totalPoints >= 2500) tier = "Elite";
      else if (totalPoints >= 1000) tier = "Performer";
      else if (totalPoints >= 300) tier = "Rising";

      // Format activity
      const recentActivity = (pointsData || []).map(p => ({
        type: p.event_type || "activity",
        description: p.event_description || p.event_type || "Activity",
        points: p.points_delta || 0,
        date: p.created_at,
      }));

      setResult({
        user: userInfo,
        card: {
          card_number: cardData.card_number,
          card_type: cardData.card_type,
          issued_at: cardData.issued_at,
          card_status: cardData.card_status,
        },
        tier,
        totalPoints,
        recentActivity,
      });
    } catch (err) {
      console.error("Lookup error:", err);
      setError("Failed to lookup card. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const getActivityIcon = (type: string) => {
    if (type.includes("deal")) return <FileCheck className="h-3 w-3 text-emerald-400" />;
    if (type.includes("visit")) return <MapPin className="h-3 w-3 text-blue-400" />;
    if (type.includes("training")) return <Trophy className="h-3 w-3 text-purple-400" />;
    return <Star className="h-3 w-3 text-[#1A1A1A]" />;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Search className="h-5 w-5 text-primary" />
          Card Lookup
        </CardTitle>
        <CardDescription>
          Search by card number or scan QR to verify member details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter card number (e.g., JBJ-ABC123-XYZ)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <span className="animate-pulse">...</span>
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Member Info */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {result.user.full_name || "Member"}
                  </h3>
                  <p className="text-sm text-muted-foreground">{result.user.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Trophy className="h-3 w-3 mr-1" />
                      {result.tier}
                    </Badge>
                    <Badge variant="outline">
                      <Star className="h-3 w-3 mr-1" />
                      {result.totalPoints.toLocaleString()} pts
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {result.card.card_type || "Member"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Card: {result.card.card_number}</span>
                <span>Since {format(new Date(result.card.issued_at), "MMM yyyy")}</span>
              </div>
            </div>

            {/* Activity Timeline */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Recent Activity</h4>
              {result.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet</p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 pr-4">
                    {result.recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-2 rounded bg-muted/30"
                      >
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(activity.date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge
                          className={
                            activity.points > 0
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }
                        >
                          {activity.points > 0 ? "+" : ""}
                          {activity.points}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
