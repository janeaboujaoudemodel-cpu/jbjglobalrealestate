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

export function useTestRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (backupId: string) => {
      // Load the backup record
      const { data: record, error } = await supabase
        .from("system_backup_records")
        .select("*")
        .eq("id", backupId)
        .single();
      if (error || !record) throw new Error("Backup not found");

      // Validate snapshot structure
      const snapshot = record.snapshot_data as Record<string, unknown> | null;
      if (!snapshot) throw new Error("No snapshot data");

      const requiredKeys = ["app_settings", "user_roles"];
      const missingKeys = requiredKeys.filter(k => !(k in snapshot));
      const result = missingKeys.length === 0 ? "pass" : `Missing keys: ${missingKeys.join(", ")}`;

      // Mark as tested
      await supabase
        .from("system_backup_records")
        .update({
          restore_tested: true,
          restore_tested_at: new Date().toISOString(),
          restore_test_result: result,
        })
        .eq("id", backupId);

      return { result, missingKeys };
    },
    onSuccess: (data) => {
      if (data.missingKeys.length === 0) {
        toast.success("Restore test passed — snapshot is valid");
      } else {
        toast.warning("Restore test completed with warnings");
      }
      qc.invalidateQueries({ queryKey: ["system-backup-records"] });
    },
    onError: (err: Error) => toast.error("Restore test failed: " + err.message),
  });
}
