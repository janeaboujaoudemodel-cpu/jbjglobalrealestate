/**
 * useCommChannels — Communication Hub v2
 * Auto-discovers connected providers and merges with owner_comm_channels rows.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ChannelStatus = "connected" | "error" | "available" | "not_linked";

export type ChannelProvider = {
  id: string;
  label: string;
  description: string;
  connectorId: string | null; // Lovable connector_id, or null for non-connector flows
  comingSoon?: boolean;
  customFlow?: "hostinger" | null;
};

/**
 * Provider registry — single source of truth for the Channels grid.
 */
export const PROVIDERS: ChannelProvider[] = [
  { id: "email_gmail",        label: "Gmail",                description: "Read and send emails from your Gmail inbox", connectorId: "google_mail" },
  { id: "email_outlook",      label: "Outlook / Microsoft 365", description: "Read and send from your Outlook mailbox", connectorId: "microsoft_outlook" },
  { id: "email_resend",       label: "Outbound Email (Resend)", description: "Send branded transactional email", connectorId: "resend" },
  { id: "email_hostinger",    label: "Hostinger Webmail",    description: "IMAP/SMTP — connect with username + app password", connectorId: null, customFlow: "hostinger" },
  { id: "whatsapp_twilio",    label: "WhatsApp / SMS (Twilio)", description: "Two-way WhatsApp Business and SMS", connectorId: "twilio" },
  { id: "slack",              label: "Slack",                description: "Internal messaging and broker workspaces", connectorId: "slack" },
  { id: "telegram",           label: "Telegram",             description: "Bot-driven Telegram messaging", connectorId: "telegram" },
  { id: "voice_elevenlabs",   label: "Voice (ElevenLabs Clone)", description: "AI voice replies in your cloned voice", connectorId: "elevenlabs" },
  { id: "instagram",          label: "Instagram DM",         description: "Not connected — provider not linked yet", connectorId: null },
  { id: "facebook",           label: "Facebook Messenger",   description: "Not connected — provider not linked yet", connectorId: null },
  { id: "linkedin",           label: "LinkedIn DM",          description: "Not connected — provider not linked yet", connectorId: null },
  { id: "snapchat",           label: "Snapchat",             description: "Not connected — provider not linked yet", connectorId: null },
];

export type AutoReplyAggregate = "all_on" | "all_off" | "mixed" | "none";

export type ProviderState = {
  provider: ChannelProvider;
  status: ChannelStatus;
  channelCount: number;
  anyActive: boolean;
  lastSyncAt: string | null;
  trainingSamples: number;
  lastError: string | null;
  /** Aggregate auto-reply state across all accounts of this provider. */
  autoReplyAggregate: AutoReplyAggregate;
  channelRows: Array<{
    id: string;
    display_name: string;
    identifier: string;
    is_active: boolean | null;
    sync_status: string | null;
    last_sync_at: string | null;
    last_error: string | null;
    training_sample_count: number | null;
    auto_reply_enabled: boolean | null;
    tone_profile_id: string | null;
  }>;
};

export function useCommChannels() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["comm-channel-states", user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<ProviderState[]> => {
      const { data: rows, error } = await supabase
        .from("owner_comm_channels")
        .select(
          "id, channel_type, display_name, identifier, is_active, sync_status, last_sync_at, last_error, training_sample_count, auto_reply_enabled, tone_profile_id"
        )
        .order("created_at", { ascending: false });
      // Note: status === 'connected' requires (a) a row exists, (b) it is active,
      // and (c) the most recent sync did not fail. Otherwise we surface 'error'.
      if (error) throw error;

      return PROVIDERS.map((provider) => {
        const channelRows = (rows ?? []).filter((r) => r.channel_type === provider.id);
        const anyActive = channelRows.some((r) => r.is_active);
        const lastSyncAt = channelRows
          .map((r) => r.last_sync_at)
          .filter(Boolean)
          .sort()
          .pop() || null;
        const lastError = channelRows
          .map((r) => r.last_error)
          .filter(Boolean)
          .pop() || null;
        const trainingSamples = channelRows.reduce(
          (acc, r) => acc + (r.training_sample_count ?? 0),
          0
        );

        let status: ChannelStatus = "not_linked";
        if (channelRows.length > 0) {
          const anyHealthy = channelRows.some(
            (r) => r.is_active && r.sync_status !== "failed" && !r.last_error
          );
          status = anyHealthy ? "connected" : "error";
        }

        let autoReplyAggregate: AutoReplyAggregate = "none";
        if (channelRows.length > 0) {
          const onCount = channelRows.filter((r) => r.auto_reply_enabled === true).length;
          if (onCount === 0) autoReplyAggregate = "all_off";
          else if (onCount === channelRows.length) autoReplyAggregate = "all_on";
          else autoReplyAggregate = "mixed";
        }

        return {
          provider,
          status,
          channelCount: channelRows.length,
          anyActive,
          lastSyncAt,
          trainingSamples,
          lastError,
          autoReplyAggregate,
          channelRows,
        };
      });
    },
  });
}
