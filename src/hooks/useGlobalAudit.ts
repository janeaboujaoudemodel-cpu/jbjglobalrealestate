import { supabase } from "@/integrations/supabase/client";
import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Types ──
export interface GlobalAuditEvent {
  id: string;
  source_table: string | null;
  source_id: string | null;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  module: string | null;
  route: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_fields: string[] | null;
  criticality: string | null;
  approval_state: string | null;
  submitted_by: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SuspiciousAlert {
  id: string;
  alert_type: string;
  severity: string;
  user_id: string | null;
  user_email: string | null;
  description: string;
  details: Record<string, unknown> | null;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface AuditFilters {
  module?: string;
  action?: string;
  entityType?: string;
  criticality?: string;
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  approvalState?: string;
}

// ── Log a global audit event (dual-write helper) ──
export async function logGlobalAudit(params: {
  action: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  module?: string;
  route?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  changedFields?: string[];
  criticality?: string;
  approvalState?: string;
  submittedBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await (supabase as any).from("global_audit_events").insert({
    source_table: "frontend",
    user_id: user.id,
    user_email: user.email,
    action: params.action,
    entity_type: params.entityType || null,
    entity_id: params.entityId || null,
    entity_name: params.entityName || null,
    module: params.module || null,
    route: params.route || window.location.pathname,
    old_values: params.oldValues || null,
    new_values: params.newValues || null,
    changed_fields: params.changedFields || null,
    criticality: params.criticality || "medium",
    approval_state: params.approvalState || null,
    submitted_by: params.submittedBy || null,
    reviewed_by: params.reviewedBy || null,
    approved_by: params.approvedBy || null,
    description: params.description || null,
    metadata: params.metadata || null,
  });
}

// ── Hook: Fetch audit events with filters ──
export function useGlobalAuditEvents(filters: AuditFilters, page = 0, pageSize = 50) {
  return useQuery({
    queryKey: ["global-audit-events", filters, page],
    queryFn: async () => {
      let query = (supabase as any)
        .from("global_audit_events")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (filters.module) query = query.eq("module", filters.module);
      if (filters.action) query = query.eq("action", filters.action);
      if (filters.entityType) query = query.eq("entity_type", filters.entityType);
      if (filters.criticality) query = query.eq("criticality", filters.criticality);
      if (filters.userId) query = query.eq("user_id", filters.userId);
      if (filters.approvalState) query = query.eq("approval_state", filters.approvalState);
      if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
      if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
      if (filters.search) query = query.ilike("description", `%${filters.search}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      return { events: (data || []) as GlobalAuditEvent[], total: count || 0 };
    },
  });
}

// ── Hook: Approval trail (events with approval_state) ──
export function useApprovalTrail(page = 0, pageSize = 50) {
  return useQuery({
    queryKey: ["approval-trail", page],
    queryFn: async () => {
      const { data, error, count } = await (supabase as any)
        .from("global_audit_events")
        .select("*", { count: "exact" })
        .not("approval_state", "is", null)
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;
      return { events: (data || []) as GlobalAuditEvent[], total: count || 0 };
    },
  });
}

// ── Hook: Suspicious alerts ──
export function useSuspiciousAlerts() {
  return useQuery({
    queryKey: ["suspicious-alerts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("suspicious_admin_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as SuspiciousAlert[];
    },
  });
}

// ── Hook: Acknowledge alert ──
export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("suspicious_admin_alerts")
        .update({ acknowledged: true, acknowledged_by: user?.id, acknowledged_at: new Date().toISOString() })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suspicious-alerts"] }),
  });
}

// ── Hook: Run suspicious pattern check ──
export function useRunSuspiciousCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("check_suspicious_patterns" as any);
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suspicious-alerts"] }),
  });
}

// ── Hook: Audit stats ──
export function useAuditStats() {
  return useQuery({
    queryKey: ["audit-stats"],
    queryFn: async () => {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [total, recent, critical, alerts] = await Promise.all([
        (supabase as any).from("global_audit_events").select("id", { count: "exact", head: true }),
        (supabase as any).from("global_audit_events").select("id", { count: "exact", head: true }).gte("created_at", last24h),
        (supabase as any).from("global_audit_events").select("id", { count: "exact", head: true }).eq("criticality", "critical"),
        (supabase as any).from("suspicious_admin_alerts").select("id", { count: "exact", head: true }).eq("acknowledged", false),
      ]);

      return {
        totalEvents: total.count || 0,
        last24h: recent.count || 0,
        criticalEvents: critical.count || 0,
        unacknowledgedAlerts: alerts.count || 0,
      };
    },
  });
}
