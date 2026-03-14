import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GateCheck {
  name: string;
  status: "pass" | "fail" | "warning";
  details: string;
  remediation?: string;
}

export interface GateRun {
  id: string;
  created_at: string;
  triggered_by: string | null;
  gate_status: string;
  checks: GateCheck[];
  blocked_reasons: string[];
  deployment_record_id: string | null;
  notes: string | null;
}

export function useGateHistory() {
  return useQuery({
    queryKey: ["deployment-gate-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deployment_gate_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as unknown as GateRun[];
    },
  });
}

export function useRunDeploymentGate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("run-deployment-gate");
      if (error) throw error;
      return data as {
        gate_status: string;
        checks: GateCheck[];
        blocked_reasons: string[];
        total_checks: number;
        passed: number;
        warnings: number;
        failed: number;
      };
    },
    onSuccess: (data) => {
      if (data.gate_status === "pass") {
        toast.success(`Deployment gate passed — ${data.passed}/${data.total_checks} checks passed`);
      } else {
        toast.error(`Deployment gate FAILED — ${data.failed} blocking issue(s)`);
      }
      qc.invalidateQueries({ queryKey: ["deployment-gate-runs"] });
    },
    onError: (err: Error) => toast.error("Gate check failed: " + err.message),
  });
}

export function useCanMarkStable() {
  const gateHistory = useGateHistory();
  const lastRun = gateHistory.data?.[0];
  return {
    canMarkStable: lastRun?.gate_status === "pass",
    lastGateRun: lastRun,
    isLoading: gateHistory.isLoading,
  };
}
