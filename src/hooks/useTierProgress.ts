import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

export interface TierDefinition {
  id: string;
  tier_type: 'broker' | 'client';
  tier_name: string;
  tier_order: number;
  min_points: number;
  max_points: number | null;
  badge_color: string;
  benefits: string[];
  is_active: boolean;
}

export interface TierProgress {
  currentTier: TierDefinition | null;
  nextTier: TierDefinition | null;
  totalPoints: number;
  pointsToNextTier: number;
  progressPercent: number;
  tierHistory: TierHistoryEntry[];
}

export interface TierHistoryEntry {
  id: string;
  old_tier: string | null;
  new_tier: string;
  points_at_change: number;
  changed_at: string;
}

export interface PointsLedgerEntry {
  id: string;
  event_type: string;
  event_description: string | null;
  points_delta: number;
  points_balance_after: number;
  created_at: string;
}

interface TierProgressHook {
  tierProgress: TierProgress | null;
  allTiers: TierDefinition[];
  recentPoints: PointsLedgerEntry[];
  isLoading: boolean;
  error: string | null;
  refreshProgress: () => Promise<void>;
}

export function useTierProgress(): TierProgressHook {
  const { user } = useAuth();
  const { isBroker } = useUserRole();
  const [tierProgress, setTierProgress] = useState<TierProgress | null>(null);
  const [allTiers, setAllTiers] = useState<TierDefinition[]>([]);
  const [recentPoints, setRecentPoints] = useState<PointsLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tierType = isBroker ? 'broker' : 'client';

  const loadProgress = useCallback(async () => {
    if (!user) {
      setTierProgress(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load all tier definitions for user type
      const { data: tiers, error: tiersError } = await supabase
        .from('tier_definitions')
        .select('*')
        .eq('tier_type', tierType)
        .eq('is_active', true)
        .order('tier_order', { ascending: true });

      if (tiersError) throw tiersError;

      const typedTiers: TierDefinition[] = (tiers || []).map(t => ({
        ...t,
        tier_type: t.tier_type as 'broker' | 'client',
        benefits: Array.isArray(t.benefits) ? t.benefits : JSON.parse(t.benefits as string || '[]')
      }));

      setAllTiers(typedTiers);

      // Load user's points ledger
      const { data: points, error: pointsError } = await supabase
        .from('points_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (pointsError) throw pointsError;

      setRecentPoints(points || []);

      // Calculate total points
      const totalPoints = points?.reduce((sum, p) => sum + (p.points_delta || 0), 0) || 0;

      // Find current and next tier
      let currentTier: TierDefinition | null = null;
      let nextTier: TierDefinition | null = null;

      for (let i = 0; i < typedTiers.length; i++) {
        const tier = typedTiers[i];
        if (totalPoints >= tier.min_points && (tier.max_points === null || totalPoints <= tier.max_points)) {
          currentTier = tier;
          nextTier = typedTiers[i + 1] || null;
          break;
        }
      }

      // Default to first tier if no match
      if (!currentTier && typedTiers.length > 0) {
        currentTier = typedTiers[0];
        nextTier = typedTiers[1] || null;
      }

      // Calculate progress to next tier
      let pointsToNextTier = 0;
      let progressPercent = 100;

      if (nextTier && currentTier) {
        const tierRange = nextTier.min_points - currentTier.min_points;
        const pointsInTier = totalPoints - currentTier.min_points;
        pointsToNextTier = nextTier.min_points - totalPoints;
        progressPercent = Math.min(100, Math.round((pointsInTier / tierRange) * 100));
      }

      // Load tier history
      const { data: history } = await supabase
        .from('user_tier_history')
        .select('*')
        .eq('user_id', user.id)
        .order('changed_at', { ascending: false })
        .limit(10);

      setTierProgress({
        currentTier,
        nextTier,
        totalPoints,
        pointsToNextTier,
        progressPercent,
        tierHistory: history || [],
      });
    } catch (err) {
      console.error('Error loading tier progress:', err);
      setError('Failed to load progress');
    } finally {
      setIsLoading(false);
    }
  }, [user, tierType]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    tierProgress,
    allTiers,
    recentPoints,
    isLoading,
    error,
    refreshProgress: loadProgress,
  };
}

// Hook for points configuration
export function usePointsConfig() {
  const [config, setConfig] = useState<Record<string, { points: number; maxDaily: number | null; maxMonthly: number | null }>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      const { data } = await supabase
        .from('points_config')
        .select('*')
        .eq('is_active', true);

      const configMap: Record<string, { points: number; maxDaily: number | null; maxMonthly: number | null }> = {};
      data?.forEach(c => {
        configMap[c.event_type] = {
          points: c.points_value,
          maxDaily: c.max_daily,
          maxMonthly: c.max_monthly,
        };
      });

      setConfig(configMap);
      setIsLoading(false);
    };

    loadConfig();
  }, []);

  return { config, isLoading };
}
