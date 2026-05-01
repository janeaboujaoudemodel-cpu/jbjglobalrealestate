import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Centralized public-visibility gate for every JBJ AI tool.
 *
 * - Reads the `ai_tool_visibility` table (RLS: public SELECT).
 * - Subscribes to realtime updates so toggles in the admin AI Tools Control
 *   Panel propagate to the live site within ~1 second.
 * - Default policy: a tool is PUBLIC unless an explicit row says is_public=false.
 *
 * Use `isPublic(toolId)` everywhere a tool is rendered to non-admin users
 * (homepage showcase, /ai-hub, /toolkit hub, header mega-menu, footer, search
 * index). Admin/owner pages should bypass this filter and show every tool.
 */
export function useToolVisibility() {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchVisibility = useCallback(async () => {
    const { data, error } = await (supabase.from("ai_tool_visibility") as any)
      .select("tool_id, is_public");
    if (!error && Array.isArray(data)) {
      const next = new Set<string>();
      for (const row of data as Array<{ tool_id: string; is_public: boolean }>) {
        if (row.is_public === false) next.add(row.tool_id);
      }
      setHidden(next);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVisibility();
    const channel = supabase
      .channel("ai_tool_visibility_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_tool_visibility" },
        () => fetchVisibility(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVisibility]);

  return useMemo(
    () => ({
      loading,
      isHidden: (toolId: string) => hidden.has(toolId),
      isPublic: (toolId: string) => !hidden.has(toolId),
      hiddenIds: hidden,
    }),
    [hidden, loading],
  );
}
