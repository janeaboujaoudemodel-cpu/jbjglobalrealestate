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

  const buildClientSummaryFallback = useCallback(async (): Promise<EducationSummary> => {
    if (!user) return EMPTY;

    const [modulesRes, booksRes, progressRes, pointsRes] = await Promise.all([
      (supabase as any).from("broker_education_modules").select("id, book_id"),
      (supabase as any).from("broker_education_books").select("id"),
      (supabase as any)
        .from("broker_education_progress")
        .select("book_id, module_id, status")
        .eq("user_id", user.id),
      (supabase as any)
        .from("broker_points")
        .select("total_points_earned, level, current_streak_days")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const modules = modulesRes.data ?? [];
    const books = booksRes.data ?? [];
    const progress = progressRes.data ?? [];
    const points = pointsRes.data ?? null;

    const completed = progress.filter((p: any) => p.status === "completed");
    const inProgress = progress.filter((p: any) => p.status === "in_progress");
    const completedModuleIds = new Set(completed.map((p: any) => p.module_id).filter(Boolean));
    const modulesByBook = new Map<string, string[]>();
    modules.forEach((m: any) => {
      if (!modulesByBook.has(m.book_id)) modulesByBook.set(m.book_id, []);
      modulesByBook.get(m.book_id)!.push(m.id);
    });

    const booksCompleted = Array.from(modulesByBook.values()).filter(
      (ids) => ids.length > 0 && ids.every((id) => completedModuleIds.has(id)),
    ).length;

    return {
      ...EMPTY,
      total_lessons: modules.length,
      completed_lessons: completed.length,
      in_progress_lessons: inProgress.length,
      total_books: books.length,
      books_completed: booksCompleted,
      total_points: Number(points?.total_points_earned ?? 0),
      level: Number(points?.level ?? 1),
      current_streak_days: Number(points?.current_streak_days ?? 0),
      is_certified: modules.length > 0 && completed.length >= modules.length,
    };
  }, [user]);

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
      try {
        setSummary(await buildClientSummaryFallback());
      } catch (fallbackError) {
        console.warn("[useEducationProgress] fallback failed", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [user, buildClientSummaryFallback]);

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
