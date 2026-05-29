import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ChatChannel = "team_general" | "hr_announcements" | "direct" | "assistant_dm";

export function useTeamChannelMessages(channel: ChatChannel = "team_general") {
  return useQuery({
    queryKey: ["chat-channel", channel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_chat_messages")
        .select("id, user_id, employee_name, message, role, attachments, created_at, channel, recipient_user_id")
        .eq("channel", channel as any)
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSendChannelMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { channel: ChatChannel; message: string; recipientUserId?: string }) => {
      if (!user?.id) throw new Error("Sign in required");
      const { error } = await supabase.from("internal_chat_messages").insert({
        user_id: user.id,
        employee_id: user.id,
        employee_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Team member",
        message: input.message,
        role: "user",
        channel: input.channel,
        recipient_user_id: input.recipientUserId ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["chat-channel", vars.channel] });
    },
    onError: (e: any) => toast.error(e?.message || "Send failed"),
  });
}
