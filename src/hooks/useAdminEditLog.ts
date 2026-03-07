import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface AdminEditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  user_id: string | null;
  action: string;
  changed_fields: string[] | null;
  summary: string | null;
  created_at: string;
}

/**
 * Log an admin edit action to the audit trail
 */
export async function logAdminEdit(params: {
  entity_type: "project" | "developer";
  entity_id: string;
  entity_name?: string;
  action: string;
  changed_fields?: string[];
  summary?: string;
}) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id ?? null;

  await supabase.from("admin_edit_log" as any).insert({
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    entity_name: params.entity_name || null,
    user_id: userId,
    action: params.action,
    changed_fields: params.changed_fields || null,
    summary: params.summary || null,
  });
}

/**
 * Detect changed fields between old and new data objects
 */
export function detectChangedFields(
  oldData: Record<string, any>,
  newData: Record<string, any>,
  fieldLabels?: Record<string, string>
): { fields: string[]; summary: string } {
  const changed: string[] = [];

  for (const key of Object.keys(newData)) {
    const oldVal = oldData[key];
    const newVal = newData[key];
    // Normalize: treat "" and null/undefined as equal
    const normOld = oldVal === "" || oldVal === undefined ? null : oldVal;
    const normNew = newVal === "" || newVal === undefined ? null : newVal;
    if (String(normOld) !== String(normNew)) {
      changed.push(key);
    }
  }

  const labels = fieldLabels || {};
  const readableFields = changed.map((f) => labels[f] || f.replace(/_/g, " "));
  const summary = changed.length > 0
    ? `Updated ${readableFields.join(", ")}`
    : "No changes detected";

  return { fields: changed, summary };
}

/**
 * Fetch the latest edit log entry for a given entity
 */
export function useLatestEditLog(entityType: string, entityId: string | undefined) {
  return useQuery({
    queryKey: ["admin-edit-log", entityType, entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_edit_log")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as AdminEditLogEntry | null;
    },
  });
}

/**
 * Fetch latest edit logs for multiple entity IDs (batch)
 */
export function useLatestEditLogs(entityType: string, entityIds: string[]) {
  return useQuery({
    queryKey: ["admin-edit-logs-batch", entityType, entityIds.join(",")],
    enabled: entityIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_edit_log")
        .select("*")
        .eq("entity_type", entityType)
        .in("entity_id", entityIds)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Group by entity_id, keep only latest per entity
      const latest = new Map<string, AdminEditLogEntry>();
      for (const entry of (data as AdminEditLogEntry[]) || []) {
        if (!latest.has(entry.entity_id)) {
          latest.set(entry.entity_id, entry);
        }
      }
      return latest;
    },
  });
}

/**
 * Format relative time: "2 hours ago", "3 days ago", etc.
 */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}
