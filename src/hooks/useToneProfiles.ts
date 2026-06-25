/**
 * useToneProfiles — list user's saved tone profiles for the channel-level switcher.
 * useUpdateChannelToneSettings — mutate auto_reply_enabled + tone_profile_id on a single channel row.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ToneProfile = {
  id: string;
  profile_name: string;
  formality_level: number | null;
  emoji_usage: number | null;
  message_length: string | null;
  is_active: boolean | null;
};

export function useToneProfiles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["owner-comm-tone-profiles", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<ToneProfile[]> => {
      const { data, error } = await supabase
        .from("owner_comm_tone_profiles")
        .select("id, profile_name, formality_level, emoji_usage, message_length, is_active")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ToneProfile[];
    },
  });
}

export type UpdateChannelToneArgs = {
  channelId: string;
  autoReplyEnabled?: boolean;
  toneProfileId?: string | null;
};

export function useUpdateChannelToneSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: UpdateChannelToneArgs) => {
      const patch: Record<string, unknown> = {};
      if (typeof args.autoReplyEnabled === "boolean") {
        patch.auto_reply_enabled = args.autoReplyEnabled;
      }
      if (args.toneProfileId !== undefined) {
        patch.tone_profile_id = args.toneProfileId;
      }
      if (Object.keys(patch).length === 0) return null;

      const { data, error } = await supabase
        .from("owner_comm_channels")
        .update(patch as any)
        .eq("id", args.channelId)
        .select("id, auto_reply_enabled, tone_profile_id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comm-channel-states"] });
      qc.invalidateQueries({ queryKey: ["owner-channels"] });
    },
  });
}
