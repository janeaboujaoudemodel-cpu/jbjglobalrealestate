import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useDirectThread(peerUserId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const meId = user?.id ?? null;

  const q = useQuery({
    queryKey: ["dm-thread", meId, peerUserId],
    enabled: !!meId && !!peerUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_chat_messages")
        .select("id, user_id, employee_name, message, created_at, recipient_user_id")
        .eq("channel", "direct" as any)
        .or(
          `and(user_id.eq.${meId},recipient_user_id.eq.${peerUserId}),and(user_id.eq.${peerUserId},recipient_user_id.eq.${meId})`
        )
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!meId || !peerUserId) return;
    const ch = supabase
      .channel(`dm-${meId}-${peerUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "internal_chat_messages" },
        (payload: any) => {
          const r = payload.new;
          const isOurs =
            r?.channel === "direct" &&
            ((r.user_id === meId && r.recipient_user_id === peerUserId) ||
              (r.user_id === peerUserId && r.recipient_user_id === meId));
          if (isOurs) qc.invalidateQueries({ queryKey: ["dm-thread", meId, peerUserId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [meId, peerUserId, qc]);

  return q;
}

export function useSendDirectMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { recipientUserId: string; message: string }) => {
      if (!user?.id) throw new Error("Sign in required");
      const { error } = await supabase.from("internal_chat_messages").insert({
        user_id: user.id,
        employee_id: user.id,
        employee_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Team member",
        message: input.message,
        role: "user",
        channel: "direct",
        recipient_user_id: input.recipientUserId,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["dm-thread", user?.id, vars.recipientUserId] });
    },
    onError: (e: any) => toast.error(e?.message || "Send failed"),
  });
}
