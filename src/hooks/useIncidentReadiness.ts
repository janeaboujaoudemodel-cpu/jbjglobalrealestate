import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useBackupRecords() {
  return useQuery({
    queryKey: ["system-backup-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_backup_records")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

export function useChecklistRuns() {
  return useQuery({
    queryKey: ["security-checklist-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_checklist_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export function useDeploymentRecords() {
  return useQuery({
    queryKey: ["deployment-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deployment_records")
        .select("*")
        .order("deployed_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });
}

export function useSecurityAlerts() {
  return useQuery({
    queryKey: ["security-alerts-recent"],
    queryFn: async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("api_security_events")
        .select("*")
        .gte("created_at", oneDayAgo)
        .in("severity", ["high", "critical"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-config-snapshot");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Config snapshot created");
      qc.invalidateQueries({ queryKey: ["system-backup-records"] });
    },
    onError: (err: Error) => toast.error("Snapshot failed: " + err.message),
  });
}

export function useRunSecurityChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("run-security-checklist", {
        body: { run_type: "manual" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Security checklist completed");
      qc.invalidateQueries({ queryKey: ["security-checklist-runs"] });
    },
    onError: (err: Error) => toast.error("Checklist failed: " + err.message),
  });
}

/** Expanded restore test — validates all 12 snapshot categories */
export function useTestRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (backupId: string) => {
      const { data: record, error } = await supabase
        .from("system_backup_records")
        .select("*")
        .eq("id", backupId)
        .single();
      if (error || !record) throw new Error("Backup not found");

      const snapshot = record.snapshot_data as Record<string, unknown> | null;
      if (!snapshot) throw new Error("No snapshot data");

      const requiredKeys = [
        "app_settings",
        "user_roles",
        "ai_tool_versions",
        "feature_flags",
        "broker_email_templates",
        "marketing_templates",
        "executive_response_templates",
        "owner_comm_templates",
        "design_templates",
        "marketing_config",
        "points_config",
        "activity_points_config",
      ];
      const missingKeys = requiredKeys.filter(k => !(k in snapshot));
      const presentKeys = requiredKeys.filter(k => k in snapshot);
      const result = missingKeys.length === 0
        ? `pass — all ${requiredKeys.length} categories validated`
        : `Missing keys: ${missingKeys.join(", ")}`;

      await supabase
        .from("system_backup_records")
        .update({
          restore_tested: true,
          restore_tested_at: new Date().toISOString(),
          restore_test_result: result,
        })
        .eq("id", backupId);

      return { result, missingKeys, presentKeys, totalChecked: requiredKeys.length };
    },
    onSuccess: (data) => {
      if (data.missingKeys.length === 0) {
        toast.success(`Restore test passed — all ${data.totalChecked} categories validated`);
      } else {
        toast.warning(`Restore test: ${data.missingKeys.length} missing categories`);
      }
      qc.invalidateQueries({ queryKey: ["system-backup-records"] });
    },
    onError: (err: Error) => toast.error("Restore test failed: " + err.message),
  });
}

/** Register a new deployment record */
export function useCreateDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      version_label: string;
      impacted_modules: string[];
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("deployment_records")
        .insert({
          version_label: params.version_label,
          impacted_modules: params.impacted_modules,
          notes: params.notes || null,
          is_stable: false,
          rolled_back: false,
          rollback_available: true,
          security_sign_off: false,
        })
        .select("id, version_label, deployed_at")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Deployment ${data.version_label} registered`);
      qc.invalidateQueries({ queryKey: ["deployment-records"] });
    },
    onError: (err: Error) => toast.error("Failed to register deployment: " + err.message),
  });
}

/** Mark a deployment as stable (only if last gate run passed) */
export function useMarkStable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deploymentId: string) => {
      // First verify last gate run passed
      const { data: gateRuns } = await supabase
        .from("deployment_gate_runs")
        .select("gate_status")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (!gateRuns?.length || gateRuns[0].gate_status !== "pass") {
        throw new Error("Cannot mark stable — last deployment gate did not pass");
      }

      // Unmark any previously stable deployment
      await supabase
        .from("deployment_records")
        .update({ is_stable: false })
        .eq("is_stable", true);

      // Mark this one as stable with security sign-off
      const { error } = await supabase
        .from("deployment_records")
        .update({
          is_stable: true,
          security_sign_off: true,
        })
        .eq("id", deploymentId);
      if (error) throw error;

      return { deploymentId };
    },
    onSuccess: () => {
      toast.success("Deployment marked as stable baseline");
      qc.invalidateQueries({ queryKey: ["deployment-records"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Rollback a deployment — marks it rolled back and restores previous stable */
export function useRollbackDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deploymentId: string) => {
      // Mark current as rolled back
      const { error } = await supabase
        .from("deployment_records")
        .update({
          rolled_back: true,
          rolled_back_at: new Date().toISOString(),
          is_stable: false,
        })
        .eq("id", deploymentId);
      if (error) throw error;

      // Find and restore previous stable (the one before this)
      const { data: prevStable } = await supabase
        .from("deployment_records")
        .select("id, version_label")
        .eq("rolled_back", false)
        .neq("id", deploymentId)
        .order("deployed_at", { ascending: false })
        .limit(1);

      if (prevStable?.length) {
        await supabase
          .from("deployment_records")
          .update({ is_stable: true })
          .eq("id", prevStable[0].id);
        return { rolledBackId: deploymentId, restoredTo: prevStable[0].version_label };
      }
      return { rolledBackId: deploymentId, restoredTo: null };
    },
    onSuccess: (data) => {
      if (data.restoredTo) {
        toast.success(`Rolled back — restored to ${data.restoredTo}`);
      } else {
        toast.success("Rolled back — no previous stable version found");
      }
      qc.invalidateQueries({ queryKey: ["deployment-records"] });
    },
    onError: (err: Error) => toast.error("Rollback failed: " + err.message),
  });
}
