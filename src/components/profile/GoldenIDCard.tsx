import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTierProgress } from "@/hooks/useTierProgress";
import { CreditCard, QrCode, User, Trophy, Star, Calendar } from "lucide-react";
import { format } from "date-fns";

interface MembershipCardData {
  id: string;
  card_number: string;
  qr_payload: string;
  card_status: string;
  card_type: string | null;
  issued_at: string;
}

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
}

export function GoldenIDCard() {
  const { user } = useAuth();
  const { tierProgress, isCombinedMode, investorTierProgress, brokerTierProgress } = useTierProgress();
  const [cardData, setCardData] = useState<MembershipCardData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadCardData = async () => {
      setIsLoading(true);

      try {
        // Get membership card
        const { data: card } = await supabase
          .from("membership_cards")
          .select("id, card_number, qr_payload, card_status, card_type, issued_at")
          .eq("user_id", user.id)
          .eq("card_status", "active")
          .maybeSingle();

        // If no card exists, create one
        if (!card) {
          const cardNumber = `JBJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          const qrPayload = btoa(JSON.stringify({ uid: user.id, card: cardNumber, v: 1 }));

          const { data: newCard, error } = await supabase
            .from("membership_cards")
            .insert({
              user_id: user.id,
              card_number: cardNumber,
              qr_payload: qrPayload,
              card_status: "active",
              card_type: "broker",
            })
            .select()
            .single();

          if (!error && newCard) {
            setCardData(newCard);
          }
        } else {
          setCardData(card);
        }

        // Get profile data for name
        const { data: profileData } = await supabase
          .from("profiles")
          .select("first_name, last_name, full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);
        } else {
          // Fallback to user metadata
          const metadata = user.user_metadata || {};
          setProfile({
            first_name: metadata.first_name || null,
            last_name: metadata.last_name || null,
            full_name: metadata.full_name || user.email?.split("@")[0] || null,
          });
        }
      } catch (error) {
        console.error("Error loading card data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCardData();
  }, [user]);

  if (isLoading) {
    return <Skeleton className="h-56 w-full max-w-md" />;
  }

  if (!cardData || !user) return null;

  // Get initials (First + Last name initial)
  const getInitials = () => {
    const first = profile?.first_name?.[0] || "";
    const last = profile?.last_name?.[0] || "";
    if (first && last) return `${first}${last}`.toUpperCase();
    if (profile?.full_name) {
      const parts = profile.full_name.split(" ");
      return parts.length >= 2 
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();
    }
    return user.email?.substring(0, 2).toUpperCase() || "JB";
  };

  const getFullName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile?.full_name || user.email?.split("@")[0] || "Member";
  };

  const totalPoints = tierProgress?.totalPoints || 0;
  
  // Get tier names for display
  const investorTierName = investorTierProgress?.currentTier?.tier_name || "Explorer";
  const brokerTierName = brokerTierProgress?.currentTier?.tier_name || "Starter";
  const singleTierName = tierProgress?.currentTier?.tier_name || "Starter";

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-amber-900/80 via-yellow-800/60 to-amber-950/90 border-amber-600/50 max-w-md">
      {/* Gold shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-pulse" />
      
      {/* Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <CardContent className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#1A1A1A] font-bold text-lg shadow-lg">
              {getInitials()}
            </div>
            <div>
              <h3 className="font-bold text-amber-100 text-lg">{getFullName()}</h3>
              {/* Show dual tier badges in combined mode */}
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {isCombinedMode ? (
                  <>
                    <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-500/50 text-xs">
                      {investorTierName}
                    </Badge>
                    <Badge className="bg-blue-500/30 text-blue-200 border-blue-500/50 text-xs">
                      {brokerTierName}
                    </Badge>
                  </>
                ) : (
                  <Badge className="bg-amber-500/30 text-amber-200 border-amber-500/50 text-xs">
                    <Trophy className="h-3 w-3 mr-1" />
                    {singleTierName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-amber-300/70">JBJ Global</p>
            <p className="text-xs text-amber-300/70">Real Estate</p>
          </div>
        </div>

        {/* Card Number */}
        <div className="mb-4">
          <p className="text-xs text-amber-300/70 mb-1">Member ID</p>
          <p className="font-mono text-amber-100 text-sm tracking-wider">
            {cardData.card_number}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mb-4 py-3 border-t border-b border-amber-600/30">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-[#1A1A1A]" />
            <span className="text-amber-100 font-semibold">{totalPoints.toLocaleString()}</span>
            <span className="text-amber-300/70 text-xs">pts</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-300/70">
            <Calendar className="h-3 w-3" />
            <span>Since {format(new Date(cardData.issued_at), "MMM yyyy")}</span>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-300/70">
            <CreditCard className="h-4 w-4" />
            <span>Digital ID Card</span>
          </div>
          <div className="flex items-center gap-2">
            <QrCode className="h-8 w-8 text-amber-300" />
            <div className="text-right">
              <p className="text-xs text-amber-300/70">Scan to verify</p>
              <p className="text-xs font-mono text-amber-200">
                {cardData.qr_payload.substring(0, 8)}...
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
