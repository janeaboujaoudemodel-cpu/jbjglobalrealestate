import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type BFRStatus = "pending" | "approved" | "rejected" | "delivered";

export interface BrokerFormRequest {
  id: string;
  broker_user_id: string;
  form_type: string;
  lead_id: string | null;
  notes: string | null;
  status: BFRStatus;
  owner_user_id: string | null;
  response_notes: string | null;
  delivered_file_url: string | null;
  created_at: string;
  updated_at: string;
}

const TABLE = "broker_form_requests" as const;

/** Broker view: only their own requests. */
export function useMyBrokerFormRequests() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["broker-form-requests", "mine", user?.id];

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`bfr-mine-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE, filter: `broker_user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, qc]);

  return useQuery({
    queryKey: key,
    enabled: !!user?.id,
    queryFn: async (): Promise<BrokerFormRequest[]> => {
      const { data, error } = await supabase
        .from(TABLE as any)
        .select("*")
        .eq("broker_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any) || [];
    },
  });
}

/** Owner view: every request. */
export function useAllBrokerFormRequests() {
  const qc = useQueryClient();
  const key = ["broker-form-requests", "all"];

  useEffect(() => {
    const ch = supabase
      .channel("bfr-all")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, () =>
        qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return useQuery({
    queryKey: key,
    queryFn: async (): Promise<BrokerFormRequest[]> => {
      const { data, error } = await supabase
        .from(TABLE as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any) || [];
    },
  });
}

export function useCreateBrokerFormRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { form_type: string; lead_id?: string | null; notes?: string | null }) => {
      if (!user?.id) throw new Error("Not signed in");
      const { error } = await supabase
        .from(TABLE as any)
        .insert({
          broker_user_id: user.id,
          form_type: payload.form_type,
          lead_id: payload.lead_id ?? null,
          notes: payload.notes ?? null,
          status: "pending",
        } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-form-requests"] }),
  });
}

export function useUpdateBrokerFormRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; patch: Partial<BrokerFormRequest> }) => {
      const { error } = await supabase
        .from(TABLE as any)
        .update(payload.patch as any)
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["broker-form-requests"] }),
  });
}

export const BROKER_FORM_TYPES = [
  "Form A — Listing Authority",
  "Form B — Buyer Representation",
  "Form F — Memorandum of Understanding",
  "Form I — Property Viewing",
  "Form U — Unilateral Termination",
  "NDA",
  "Tenancy Contract (Ejari)",
  "MOU",
  "Other",
] as const;
