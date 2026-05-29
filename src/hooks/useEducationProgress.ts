import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EducationSummary {
  total_lessons: number;
  completed_lessons: number;
  in_progress_lessons: number;
  total_books: number;
  books_completed: number;
  total_points: number;
  level: number;
  current_streak_days: number;
  is_certified: boolean;
}

const EMPTY: EducationSummary = {
  total_lessons: 0,
  completed_lessons: 0,
  in_progress_lessons: 0,
  total_books: 0,
  books_completed: 0,
  total_points: 0,
  level: 1,
  current_streak_days: 0,
  is_certified: false,
};

export function useEducationProgress() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<EducationSummary>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSummary(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_education_summary" as any);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setSummary({ ...EMPTY, ...row });
    } catch (e) {
      console.error("[useEducationProgress] failed", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startModule = useCallback(
    async (bookId: string, moduleId: string) => {
      if (!user) return;
      const { error } = await supabase.rpc("start_module" as any, {
        _book_id: bookId,
        _module_id: moduleId,
      });
      if (error) console.error("[startModule]", error);
    },
    [user],
  );

  const completeModule = useCallback(
    async (bookId: string, moduleId: string): Promise<{ awarded: number; total: number } | null> => {
      if (!user) return null;
      const before = summary.total_points;
      const { data, error } = await supabase.rpc("complete_module" as any, {
        _book_id: bookId,
        _module_id: moduleId,
      });
      if (error) {
        console.error("[completeModule]", error);
        return null;
      }
      const total = (data as any)?.total_points_earned ?? before;
      await refresh();
      return { awarded: Math.max(0, total - before), total };
    },
    [user, summary.total_points, refresh],
  );

  return { summary, loading, refresh, startModule, completeModule };
}
