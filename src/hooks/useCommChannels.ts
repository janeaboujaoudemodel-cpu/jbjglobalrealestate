/**
 * useCommChannels — Communication Hub v2
 * Auto-discovers connected providers and merges with owner_comm_channels rows.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ChannelStatus = "connected" | "available" | "not_linked" | "coming_soon";

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
  { id: "instagram",          label: "Instagram DM",         description: "Coming soon — provider integration pending", connectorId: null, comingSoon: true },
  { id: "facebook",           label: "Facebook Messenger",   description: "Coming soon — provider integration pending", connectorId: null, comingSoon: true },
  { id: "linkedin",           label: "LinkedIn DM",          description: "Coming soon — provider integration pending", connectorId: null, comingSoon: true },
  { id: "snapchat",           label: "Snapchat",             description: "Coming soon — provider integration pending", connectorId: null, comingSoon: true },
];

export type ProviderState = {
  provider: ChannelProvider;
  status: ChannelStatus;
  channelCount: number;
  anyActive: boolean;
  lastSyncAt: string | null;
  trainingSamples: number;
  lastError: string | null;
  channelRows: Array<{
    id: string;
    display_name: string;
    identifier: string;
    is_active: boolean | null;
    sync_status: string | null;
    last_sync_at: string | null;
    last_error: string | null;
    training_sample_count: number | null;
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
        .select("id, channel_type, display_name, identifier, is_active, sync_status, last_sync_at, last_error, training_sample_count")
        .order("created_at", { ascending: false });
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
        if (provider.comingSoon) status = "coming_soon";
        else if (channelRows.length > 0) status = "connected";
        // "available" is computed at the edge function level (workspace has connection but project not linked).
        // We optimistically show "not_linked" and let the autowire endpoint flip it.

        return {
          provider,
          status,
          channelCount: channelRows.length,
          anyActive,
          lastSyncAt,
          trainingSamples,
          lastError,
          channelRows,
        };
      });
    },
  });
}
