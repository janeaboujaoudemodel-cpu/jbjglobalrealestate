import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePointsLedger } from "./usePointsLedger";

export interface DealBonusThreshold {
  id: string;
  threshold_name: string;
  required_deal_points: number;
  bonus_type: 'cash' | 'hardware';
  bonus_value_aed: number | null;
  bonus_description: string | null;
  hardware_item: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface BonusClaim {
  id: string;
  user_id: string;
  threshold_id: string;
  deal_points_at_claim: number;
  bonus_status: 'pending' | 'approved' | 'paid' | 'rejected';
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  threshold?: DealBonusThreshold;
}

export function useDealBonuses() {
  const { user } = useAuth();
  const { summary } = usePointsLedger();
  const [thresholds, setThresholds] = useState<DealBonusThreshold[]>([]);
  const [claims, setClaims] = useState<BonusClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load all bonus thresholds
      const { data: thresholdsData, error: thresholdsError } = await supabase
        .from('deal_bonus_thresholds')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (thresholdsError) throw thresholdsError;
      setThresholds((thresholdsData || []) as DealBonusThreshold[]);

      // Load user's claims if logged in
      if (user) {
        const { data: claimsData, error: claimsError } = await supabase
          .from('broker_bonus_claims')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (claimsError) throw claimsError;
        setClaims((claimsData || []) as BonusClaim[]);
      }
    } catch (err) {
      console.error('Error loading deal bonuses:', err);
      setError('Failed to load bonus information');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const claimBonus = async (thresholdId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };

    const threshold = thresholds.find(t => t.id === thresholdId);
    if (!threshold) return { success: false, error: 'Invalid threshold' };

    // Check if already claimed
    const existingClaim = claims.find(c => c.threshold_id === thresholdId);
    if (existingClaim) return { success: false, error: 'Already claimed' };

    // Check if eligible
    if (summary.dealPoints < threshold.required_deal_points) {
      return { success: false, error: 'Insufficient deal points' };
    }

    try {
      const { error: insertError } = await supabase
        .from('broker_bonus_claims')
        .insert({
          user_id: user.id,
          threshold_id: thresholdId,
          deal_points_at_claim: summary.dealPoints,
          bonus_status: 'pending',
        });

      if (insertError) throw insertError;

      await loadData();
      return { success: true };
    } catch (err) {
      console.error('Error claiming bonus:', err);
      return { success: false, error: 'Failed to submit claim' };
    }
  };

  // Get eligibility status for each threshold
  const getEligibility = (threshold: DealBonusThreshold) => {
    const claimed = claims.find(c => c.threshold_id === threshold.id);
    const eligible = summary.dealPoints >= threshold.required_deal_points;
    const progress = Math.min(100, (summary.dealPoints / threshold.required_deal_points) * 100);

    return {
      claimed: !!claimed,
      claimStatus: claimed?.bonus_status,
      eligible,
      progress,
      pointsNeeded: Math.max(0, threshold.required_deal_points - summary.dealPoints),
    };
  };

  return {
    thresholds,
    claims,
    dealPoints: summary.dealPoints,
    isLoading,
    error,
    claimBonus,
    getEligibility,
    refresh: loadData,
  };
}
