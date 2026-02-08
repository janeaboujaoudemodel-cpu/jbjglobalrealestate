import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";

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
  currentTierType: 'broker' | 'client';
  // NEW: Combined mode support
  investorTierProgress: TierProgress | null;
  brokerTierProgress: TierProgress | null;
  allInvestorTiers: TierDefinition[];
  allBrokerTiers: TierDefinition[];
  isCombinedMode: boolean;
}

// Helper to calculate tier progress from points and tier list
function calculateTierProgress(
  totalPoints: number,
  tiers: TierDefinition[],
  tierHistory: TierHistoryEntry[]
): TierProgress {
  let currentTier: TierDefinition | null = null;
  let nextTier: TierDefinition | null = null;

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    if (totalPoints >= tier.min_points && (tier.max_points === null || totalPoints <= tier.max_points)) {
      currentTier = tier;
      nextTier = tiers[i + 1] || null;
      break;
    }
  }

  // Default to first tier if no match
  if (!currentTier && tiers.length > 0) {
    currentTier = tiers[0];
    nextTier = tiers[1] || null;
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

  return {
    currentTier,
    nextTier,
    totalPoints,
    pointsToNextTier,
    progressPercent,
    tierHistory,
  };
}

export function useTierProgress(): TierProgressHook {
  const { user } = useAuth();
  const { isBrokerMode, isCombinedMode } = useUserModeContext();
  const [tierProgress, setTierProgress] = useState<TierProgress | null>(null);
  const [allTiers, setAllTiers] = useState<TierDefinition[]>([]);
  const [recentPoints, setRecentPoints] = useState<PointsLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Combined mode state
  const [investorTierProgress, setInvestorTierProgress] = useState<TierProgress | null>(null);
  const [brokerTierProgress, setBrokerTierProgress] = useState<TierProgress | null>(null);
  const [allInvestorTiers, setAllInvestorTiers] = useState<TierDefinition[]>([]);
  const [allBrokerTiers, setAllBrokerTiers] = useState<TierDefinition[]>([]);

  // Primary tier type for non-combined mode
  const tierType = isBrokerMode ? 'broker' : 'client';

  const loadProgress = useCallback(async () => {
    if (!user) {
      setTierProgress(null);
      setInvestorTierProgress(null);
      setBrokerTierProgress(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In combined mode, fetch BOTH tier ladders in parallel
      // Otherwise just fetch the active one
      const tierQueries = isCombinedMode
        ? [
            supabase
              .from('tier_definitions')
              .select('*')
              .eq('tier_type', 'client')
              .eq('is_active', true)
              .order('tier_order', { ascending: true }),
            supabase
              .from('tier_definitions')
              .select('*')
              .eq('tier_type', 'broker')
              .eq('is_active', true)
              .order('tier_order', { ascending: true }),
          ]
        : [
            supabase
              .from('tier_definitions')
              .select('*')
              .eq('tier_type', tierType)
              .eq('is_active', true)
              .order('tier_order', { ascending: true }),
          ];

      // Fetch points and history in parallel with tiers
      const [pointsResult, historyResult, ...tierResults] = await Promise.all([
        supabase
          .from('points_ledger')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('user_tier_history')
          .select('*')
          .eq('user_id', user.id)
          .order('changed_at', { ascending: false })
          .limit(10),
        ...tierQueries,
      ]);

      if (pointsResult.error) throw pointsResult.error;

      const points = pointsResult.data || [];
      setRecentPoints(points);

      // Calculate total points (shared across all tiers)
      const totalPoints = points.reduce((sum, p) => sum + (p.points_delta || 0), 0);
      const tierHistory: TierHistoryEntry[] = historyResult.data || [];

      // Helper to parse tier data
      const parseTiers = (data: any[]): TierDefinition[] =>
        (data || []).map((t) => ({
          ...t,
          tier_type: t.tier_type as 'broker' | 'client',
          benefits: Array.isArray(t.benefits) ? t.benefits : JSON.parse(t.benefits as string || '[]'),
        }));

      if (isCombinedMode) {
        // Combined mode: calculate progress for BOTH ladders
        const investorTiers = parseTiers(tierResults[0]?.data || []);
        const brokerTiers = parseTiers(tierResults[1]?.data || []);

        setAllInvestorTiers(investorTiers);
        setAllBrokerTiers(brokerTiers);

        const investorProgress = calculateTierProgress(totalPoints, investorTiers, tierHistory);
        const brokerProgress = calculateTierProgress(totalPoints, brokerTiers, tierHistory);

        setInvestorTierProgress(investorProgress);
        setBrokerTierProgress(brokerProgress);

        // Primary tierProgress uses broker ladder for combined mode (more ambitious)
        setTierProgress(brokerProgress);
        setAllTiers(brokerTiers);
      } else {
        // Single mode: just one tier ladder
        const tiers = parseTiers(tierResults[0]?.data || []);
        setAllTiers(tiers);

        const progress = calculateTierProgress(totalPoints, tiers, tierHistory);
        setTierProgress(progress);

        // Clear combined mode state
        setInvestorTierProgress(null);
        setBrokerTierProgress(null);
        setAllInvestorTiers([]);
        setAllBrokerTiers([]);
      }
    } catch (err) {
      console.error('Error loading tier progress:', err);
      setError('Failed to load progress');
    } finally {
      setIsLoading(false);
    }
  }, [user, isBrokerMode, isCombinedMode, tierType]);

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
    currentTierType: tierType,
    // Combined mode exports
    investorTierProgress,
    brokerTierProgress,
    allInvestorTiers,
    allBrokerTiers,
    isCombinedMode,
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
