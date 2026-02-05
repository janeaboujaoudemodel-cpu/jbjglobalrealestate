import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PointsLedgerEntry {
  id: string;
  user_id: string;
  event_type: string;
  event_description: string | null;
  points_delta: number;
  points_balance_after: number;
  role: string | null;
  user_mode: string | null;
  category: string | null;
  source_name: string | null;
  running_total: number | null;
  notes: string | null;
  created_at: string;
}

export interface PointsLedgerFilters {
  category?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}

export interface PointsSummary {
  totalPoints: number;
  dealPoints: number;
  activityPoints: number;
  trainingPoints: number;
  referralPoints: number;
}

export function usePointsLedger(filters?: PointsLedgerFilters) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PointsLedgerEntry[]>([]);
  const [summary, setSummary] = useState<PointsSummary>({
    totalPoints: 0,
    dealPoints: 0,
    activityPoints: 0,
    trainingPoints: 0,
    referralPoints: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLedger = useCallback(async () => {
    const targetUserId = filters?.userId || user?.id;
    if (!targetUserId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('points_ledger')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error: fetchError } = await query.limit(500);

      if (fetchError) throw fetchError;

      const typedData = (data || []) as PointsLedgerEntry[];
      setEntries(typedData);

      // Calculate summary
      const summaryData: PointsSummary = {
        totalPoints: 0,
        dealPoints: 0,
        activityPoints: 0,
        trainingPoints: 0,
        referralPoints: 0,
      };

      typedData.forEach(entry => {
        summaryData.totalPoints += entry.points_delta;
        
        const eventType = entry.event_type?.toLowerCase() || '';
        const category = entry.category?.toLowerCase() || '';
        
        if (eventType.includes('deal') || category === 'deal') {
          summaryData.dealPoints += entry.points_delta;
        } else if (eventType.includes('training') || eventType.includes('module') || category === 'training') {
          summaryData.trainingPoints += entry.points_delta;
        } else if (eventType.includes('referral') || category === 'referral') {
          summaryData.referralPoints += entry.points_delta;
        } else {
          summaryData.activityPoints += entry.points_delta;
        }
      });

      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading points ledger:', err);
      setError('Failed to load points history');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, filters?.category, filters?.startDate, filters?.endDate, filters?.userId]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  return {
    entries,
    summary,
    isLoading,
    error,
    refresh: loadLedger,
  };
}

// Hook to get deal tier based on transaction value
export function useDealTiers() {
  const [tiers, setTiers] = useState<Array<{
    event_type: string;
    points_value: number;
    deal_value_min: number | null;
    deal_value_max: number | null;
    description: string | null;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTiers = async () => {
      const { data } = await supabase
        .from('points_config')
        .select('event_type, points_value, deal_value_min, deal_value_max, description')
        .like('event_type', 'deal_closed%')
        .eq('is_active', true)
        .order('deal_value_min', { ascending: true });

      if (data) {
        setTiers(data as typeof tiers);
      }
      setIsLoading(false);
    };

    loadTiers();
  }, []);

  const getPointsForDealValue = (dealValueAED: number): { points: number; tierName: string } => {
    for (const tier of tiers) {
      const min = tier.deal_value_min || 0;
      const max = tier.deal_value_max;
      
      if (dealValueAED >= min && (max === null || dealValueAED <= max)) {
        return {
          points: tier.points_value,
          tierName: tier.description || tier.event_type,
        };
      }
    }
    
    // Default to standard tier
    return { points: 3000, tierName: 'Standard' };
  };

  return { tiers, isLoading, getPointsForDealValue };
}
