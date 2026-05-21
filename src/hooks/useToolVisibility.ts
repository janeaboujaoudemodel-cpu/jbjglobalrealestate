import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ToolVisibility = "public" | "owner_only" | "hidden";

interface VisibilityRow {
  tool_id: string;
  is_public: boolean;
  visibility?: ToolVisibility | null;
}

/**
 * Centralized visibility gate for every JBJ AI tool.
 *
 * Three states (stored in `ai_tool_visibility.visibility`):
 *   - "public":     visible to everyone
 *   - "owner_only": visible only to owner/admin surfaces (admin panel always
 *                   shows every tool regardless); hidden from public site
 *   - "hidden":     fully hidden — wrapped out from every surface
 *
 * Default policy: a tool is PUBLIC unless a row says otherwise.
 *
 * `isPublic(toolId)` returns true ONLY when visibility === "public", so the
 * homepage / hub / mega-menu / search will hide both owner-only and hidden
 * tools. Owner/admin pages bypass this hook and render the full registry.
 */
export function useToolVisibility() {
  const [visibilityMap, setVisibilityMap] = useState<Map<string, ToolVisibility>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchVisibility = useCallback(async () => {
    const { data, error } = await (supabase.from("ai_tool_visibility") as any)
      .select("tool_id, is_public, visibility");
    if (!error && Array.isArray(data)) {
      const next = new Map<string, ToolVisibility>();
      for (const row of data as VisibilityRow[]) {
        const v: ToolVisibility =
          (row.visibility as ToolVisibility) ??
          (row.is_public === false ? "hidden" : "public");
        next.set(row.tool_id, v);
      }
      setVisibilityMap(next);
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

  return useMemo(() => {
    const getVisibility = (toolId: string): ToolVisibility =>
      visibilityMap.get(toolId) ?? "public";
    return {
      loading,
      getVisibility,
      isPublic: (toolId: string) => getVisibility(toolId) === "public",
      isHidden: (toolId: string) => getVisibility(toolId) !== "public",
      isOwnerOnly: (toolId: string) => getVisibility(toolId) === "owner_only",
      isFullyHidden: (toolId: string) => getVisibility(toolId) === "hidden",
      visibilityMap,
    };
  }, [visibilityMap, loading]);
}
