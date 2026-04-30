import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type UAEEmirate = "Abu Dhabi" | "Dubai" | "Sharjah" | "Ajman" | "Ras Al Khaimah" | "Fujairah" | "Umm Al Quwain";
export type OutreachStatus =
  | "Not Contacted" | "Test Sent" | "Contacted" | "Replied" | "Follow-up Needed"
  | "Documents Requested" | "Documents Sent" | "Registered" | "Declined" | "No Response";

export type RegistryRecordType = "developer" | "brokerage";

export const EMIRATES: UAEEmirate[] = [
  "Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain",
];

export const OUTREACH_STATUSES: OutreachStatus[] = [
  "Not Contacted", "Test Sent", "Contacted", "Replied", "Follow-up Needed",
  "Documents Requested", "Documents Sent", "Registered", "Declined", "No Response",
];

const TBL = (t: RegistryRecordType) => (t === "developer" ? "uae_dev_registry" : "uae_brk_registry");

export function useRegistryList(type: RegistryRecordType, emirate?: UAEEmirate) {
  return useQuery({
    queryKey: ["uae-registry", type, emirate ?? "all"],
    queryFn: async () => {
      let q = (supabase as any).from(TBL(type)).select("*").order("created_at", { ascending: false });
      if (emirate) q = q.eq("emirate_section", emirate);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRegistryRecord(type: RegistryRecordType, id?: string) {
  return useQuery({
    queryKey: ["uae-registry", type, "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from(TBL(type)).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useRegistrySources(type: RegistryRecordType, id?: string) {
  return useQuery({
    queryKey: ["uae-registry-sources", type, id],
    enabled: !!id,
    queryFn: async () => {
      const col = type === "developer" ? "developer_id" : "brokerage_id";
      const { data, error } = await (supabase as any).from("uae_registry_sources").select("*").eq(col, id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRegistryLog(type: RegistryRecordType, id?: string) {
  return useQuery({
    queryKey: ["uae-registry-log", type, id],
    enabled: !!id,
    queryFn: async () => {
      const col = type === "developer" ? "developer_id" : "brokerage_id";
      const { data, error } = await (supabase as any).from("uae_registry_log").select("*").eq(col, id).order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateRecord(type: RegistryRecordType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const refKey = type === "developer" ? "developer_ref" : "brokerage_ref";
      const ref = (payload[refKey] as string) || `${type === "developer" ? "DEV" : "BRK"}-${Date.now()}`;
      const { data, error } = await (supabase as any).from(TBL(type)).insert({ ...payload, [refKey]: ref }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["uae-registry", type] });
      toast.success("Record created");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create"),
  });
}

export function useUpdateRecord(type: RegistryRecordType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { data, error } = await (supabase as any).from(TBL(type)).update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["uae-registry", type] });
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save"),
  });
}

export function useAddSource(type: RegistryRecordType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { recordId: string; source_name: string; source_url: string; fields_verified: string[]; priority_tier?: number; snippet?: string }) => {
      const col = type === "developer" ? "developer_id" : "brokerage_id";
      const { data, error } = await (supabase as any).from("uae_registry_sources").insert({
        [col]: payload.recordId,
        source_name: payload.source_name,
        source_url: payload.source_url,
        fields_verified: payload.fields_verified,
        priority_tier: payload.priority_tier ?? 1,
        snippet: payload.snippet,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["uae-registry-sources", type, vars.recordId] });
      toast.success("Source added");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to add source"),
  });
}

export async function sendRegistrationEmail(payload: {
  recordType: RegistryRecordType;
  recordId: string;
  language?: "en" | "ar";
  contactPersonName: string;
  recipientEmail: string;
  isTestSend?: boolean;
  attachmentNames?: string[];
}) {
  const { data, error } = await (supabase as any).functions.invoke("uae-registry-send", { body: payload });
  if (error) throw error;
  return data;
}
