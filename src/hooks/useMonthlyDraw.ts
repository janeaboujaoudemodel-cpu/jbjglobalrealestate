import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePointsLedger } from "./usePointsLedger";

export interface MonthlyDraw {
  id: string;
  draw_month: number;
  draw_year: number;
  prize_description: string;
  min_activity_points: number;
  status: 'open' | 'closed' | 'completed';
  winner_user_id: string | null;
  drawn_at: string | null;
  created_at: string;
}

export interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  entry_source: 'auto_qualify' | 'manual' | 'bonus_entry';
  activity_points_at_entry: number;
  entered_at: string;
}

export function useMonthlyDraw() {
  const { user } = useAuth();
  const { summary } = usePointsLedger();
  const [currentDraw, setCurrentDraw] = useState<MonthlyDraw | null>(null);
  const [userEntry, setUserEntry] = useState<DrawEntry | null>(null);
  const [pastDraws, setPastDraws] = useState<MonthlyDraw[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load current month's draw
      const { data: drawData, error: drawError } = await supabase
        .from('monthly_draws')
        .select('*')
        .eq('draw_month', currentMonth)
        .eq('draw_year', currentYear)
        .single();

      if (drawError && drawError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is OK
        throw drawError;
      }
      
      setCurrentDraw(drawData as MonthlyDraw | null);

      // Load user's entry for current draw
      if (user && drawData) {
        const { data: entryData } = await supabase
          .from('draw_entries')
          .select('*')
          .eq('draw_id', drawData.id)
          .eq('user_id', user.id)
          .single();

        setUserEntry(entryData as DrawEntry | null);
      }

      // Load past draws
      const { data: pastData } = await supabase
        .from('monthly_draws')
        .select('*')
        .eq('status', 'completed')
        .order('draw_year', { ascending: false })
        .order('draw_month', { ascending: false })
        .limit(12);

      setPastDraws((pastData || []) as MonthlyDraw[]);
    } catch (err) {
      console.error('Error loading monthly draw:', err);
      setError('Failed to load draw information');
    } finally {
      setIsLoading(false);
    }
  }, [user, currentMonth, currentYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const enterDraw = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };
    if (!currentDraw) return { success: false, error: 'No active draw' };
    if (currentDraw.status !== 'open') return { success: false, error: 'Draw is closed' };
    if (userEntry) return { success: false, error: 'Already entered' };

    // Check eligibility - must have minimum activity points
    const activityPoints = summary.activityPoints + summary.trainingPoints + summary.referralPoints;
    if (activityPoints < currentDraw.min_activity_points) {
      return { 
        success: false, 
        error: `Need ${currentDraw.min_activity_points} activity points to enter` 
      };
    }

    try {
      const { error: insertError } = await supabase
        .from('draw_entries')
        .insert({
          draw_id: currentDraw.id,
          user_id: user.id,
          entry_source: 'manual',
          activity_points_at_entry: activityPoints,
        });

      if (insertError) throw insertError;

      await loadData();
      return { success: true };
    } catch (err) {
      console.error('Error entering draw:', err);
      return { success: false, error: 'Failed to enter draw' };
    }
  };

  const getEligibility = () => {
    if (!currentDraw) return { eligible: false, reason: 'No active draw' };
    if (currentDraw.status !== 'open') return { eligible: false, reason: 'Draw is closed' };
    if (userEntry) return { eligible: false, reason: 'Already entered' };

    const activityPoints = summary.activityPoints + summary.trainingPoints + summary.referralPoints;
    if (activityPoints < currentDraw.min_activity_points) {
      return { 
        eligible: false, 
        reason: `Need ${currentDraw.min_activity_points - activityPoints} more activity points`,
        progress: (activityPoints / currentDraw.min_activity_points) * 100,
      };
    }

    return { eligible: true, reason: 'You qualify!' };
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  return {
    currentDraw,
    userEntry,
    pastDraws,
    isLoading,
    error,
    enterDraw,
    getEligibility,
    getMonthName,
    refresh: loadData,
  };
}
