import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Live Mark Complete ↔ Mark Not Complete toggle wired to
 * broker_education_module_reads.completed_at.
 *
 * Returns a per-module completion map plus a toggle handler that flips a
 * module between completed and not-complete. Both states are persistent
 * so the user can mark complete, then mark not complete and read again.
 */
export function useModuleCompletion(bookId: string | null, moduleIds: string[]) {
  const { user } = useAuth();
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !bookId || moduleIds.length === 0) {
      setCompletedMap({});
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("broker_education_module_reads")
      .select("module_id, completed_at")
      .eq("user_id", user.id)
      .in("module_id", moduleIds);
    if (!error && data) {
      const map: Record<string, boolean> = {};
      for (const row of data) {
        map[row.module_id] = !!row.completed_at;
      }
      setCompletedMap(map);
    }
    setLoading(false);
  }, [user, bookId, moduleIds.join(",")]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (moduleId: string) => {
      if (!user || !bookId) {
        toast.error("Please sign in to track progress");
        return;
      }
      setPendingId(moduleId);
      const currentlyComplete = !!completedMap[moduleId];
      const nextValue = currentlyComplete ? null : new Date().toISOString();

      // optimistic
      setCompletedMap((m) => ({ ...m, [moduleId]: !currentlyComplete }));

      const { error } = await (supabase as any)
        .from("broker_education_module_reads")
        .upsert(
          {
            user_id: user.id,
            book_id: bookId,
            module_id: moduleId,
            completed_at: nextValue,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "user_id,module_id" },
        );

      if (error) {
        // rollback
        setCompletedMap((m) => ({ ...m, [moduleId]: currentlyComplete }));
        toast.error("Could not update progress");
      } else {
        toast.success(currentlyComplete ? "Marked as not complete" : "Marked as complete");
      }
      setPendingId(null);
    },
    [user, bookId, completedMap],
  );

  const completedCount = Object.values(completedMap).filter(Boolean).length;

  return { completedMap, completedCount, toggle, loading, pendingId, refresh };
}
