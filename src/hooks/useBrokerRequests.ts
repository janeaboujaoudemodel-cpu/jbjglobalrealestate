import { friendlyBackendMessage } from "@/utils/friendlyBackendError";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type BrokerRequest = {
  id: string;
  requester_user_id: string;
  recipient_user_id: string | null;
  recipient_department: string | null;
  request_type: string;
  subject: string;
  body: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "in_review" | "approved" | "rejected" | "resolved" | "cancelled";
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export function useMyBrokerRequests() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["broker-requests-mine", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broker_requests" as any)
        .select("*")
        .eq("requester_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BrokerRequest[];
    },
  });

  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`br-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "broker_requests", filter: `requester_user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["broker-requests-mine", user.id] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, qc]);

  return q;
}

export function useCreateBrokerRequest() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      recipientUserId?: string | null;
      recipientDepartment?: string | null;
      requestType: string;
      subject: string;
      body?: string;
      priority?: "low" | "normal" | "high" | "urgent";
      metadata?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error("Sign in required");
      const { error } = await supabase.from("broker_requests" as any).insert({
        requester_user_id: user.id,
        recipient_user_id: input.recipientUserId ?? null,
        recipient_department: input.recipientDepartment ?? null,
        request_type: input.requestType,
        subject: input.subject,
        body: input.body ?? null,
        priority: input.priority ?? "normal",
        metadata: input.metadata ?? {},
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request submitted");
      qc.invalidateQueries({ queryKey: ["broker-requests-mine", user?.id] });
    },
    onError: (e: any) => toast.error(friendlyBackendMessage(e) || "Could not submit request"),
  });
}

export function useCancelBrokerRequest() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("broker_requests" as any)
        .update({ status: "cancelled" } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broker-requests-mine", user?.id] });
    },
    onError: (e: any) => toast.error(friendlyBackendMessage(e) || "Could not cancel"),
  });
}
