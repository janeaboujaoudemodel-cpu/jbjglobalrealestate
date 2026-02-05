import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CertificationPhase {
  id: string;
  phase_number: number;
  title: string;
  description: string | null;
  required_book_ids: string[] | null;
  pass_threshold_percent: number;
  is_active: boolean;
  sort_order: number;
}

export interface UserCertificationProgress {
  id: string;
  user_id: string;
  phase_id: string;
  status: 'locked' | 'in_progress' | 'test_pending' | 'completed';
  started_at: string | null;
  completed_at: string | null;
}

export function useCertification() {
  const { user } = useAuth();
  const [phases, setPhases] = useState<CertificationPhase[]>([]);
  const [progress, setProgress] = useState<Record<string, UserCertificationProgress>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load all phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('certification_phases')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (phasesError) throw phasesError;
      setPhases((phasesData || []) as CertificationPhase[]);

      // Load user's progress if logged in
      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_certification_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressError) throw progressError;

        const progressMap: Record<string, UserCertificationProgress> = {};
        (progressData || []).forEach((p) => {
          progressMap[p.phase_id] = {
            ...p,
            status: p.status as UserCertificationProgress['status'],
          };
        });
        setProgress(progressMap);
      }
    } catch (err) {
      console.error('Error loading certification data:', err);
      setError('Failed to load certification information');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getPhaseStatus = (phaseId: string): UserCertificationProgress['status'] => {
    return progress[phaseId]?.status || 'locked';
  };

  const startPhase = async (phaseId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };

    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return { success: false, error: 'Invalid phase' };

    // Check if previous phase is completed (except for phase 1)
    if (phase.phase_number > 1) {
      const prevPhase = phases.find(p => p.phase_number === phase.phase_number - 1);
      if (prevPhase && getPhaseStatus(prevPhase.id) !== 'completed') {
        return { success: false, error: 'Complete previous phase first' };
      }
    }

    try {
      const { error: upsertError } = await supabase
        .from('user_certification_progress')
        .upsert({
          user_id: user.id,
          phase_id: phaseId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,phase_id'
        });

      if (upsertError) throw upsertError;

      await loadData();
      return { success: true };
    } catch (err) {
      console.error('Error starting phase:', err);
      return { success: false, error: 'Failed to start phase' };
    }
  };

  const completePhase = async (phaseId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };

    try {
      const { error: updateError } = await supabase
        .from('user_certification_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('phase_id', phaseId);

      if (updateError) throw updateError;

      await loadData();
      return { success: true };
    } catch (err) {
      console.error('Error completing phase:', err);
      return { success: false, error: 'Failed to complete phase' };
    }
  };

  const isFullyCertified = () => {
    return phases.every(phase => getPhaseStatus(phase.id) === 'completed');
  };

  const getOverallProgress = () => {
    const completedCount = phases.filter(p => getPhaseStatus(p.id) === 'completed').length;
    return {
      completed: completedCount,
      total: phases.length,
      percent: phases.length > 0 ? (completedCount / phases.length) * 100 : 0,
    };
  };

  return {
    phases,
    progress,
    isLoading,
    error,
    getPhaseStatus,
    startPhase,
    completePhase,
    isFullyCertified,
    getOverallProgress,
    refresh: loadData,
  };
}
