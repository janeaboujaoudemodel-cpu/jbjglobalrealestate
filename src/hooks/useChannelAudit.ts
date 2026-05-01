/**
 * useChannelAudit — reads the per-channel audit summary + recent activity.
 *
 * - useChannelAuditSummary(): one row per channel with last_connected/synced/
 *   auto_reply/inbound timestamps. Used to power the activity line on each
 *   ChannelTile.
 * - useChannelAuditEvents(channelId): the last 20 audit events for a single
 *   channel. Used by the "View activity" disclosure.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ChannelAuditEventType =
  | "connected"
  | "reconnected"
  | "synced"
  | "sync_failed"
  | "auto_replied"
  | "auto_reply_skipped"
  | "inbound_received";

export interface ChannelAuditSummaryRow {
  channel_id: string;
  last_connected_at: string | null;
  last_synced_at: string | null;
  last_sync_failed_at: string | null;
  last_auto_reply_at: string | null;
  last_inbound_at: string | null;
  auto_reply_count: number;
  inbound_count: number;
}

export interface ChannelAuditEvent {
  id: string;
  channel_id: string | null;
  channel_type: string;
  identifier: string | null;
  event_type: ChannelAuditEventType;
  details: Record<string, unknown> | null;
  created_at: string;
}

export function useChannelAuditSummary() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["owner-comm-channel-audit-summary", user?.id],
    enabled: !!user?.id,
    staleTime: 15_000,
    queryFn: async (): Promise<Record<string, ChannelAuditSummaryRow>> => {
      const { data, error } = await supabase
        .from("owner_comm_channel_audit_summary")
        .select(
          "channel_id, last_connected_at, last_synced_at, last_sync_failed_at, last_auto_reply_at, last_inbound_at, auto_reply_count, inbound_count"
        );
      if (error) throw error;
      const map: Record<string, ChannelAuditSummaryRow> = {};
      for (const row of (data ?? []) as ChannelAuditSummaryRow[]) {
        if (row.channel_id) map[row.channel_id] = row;
      }
      return map;
    },
  });
}

export function useChannelAuditEvents(channelId: string | null, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["owner-comm-channel-audit-events", user?.id, channelId],
    enabled: !!user?.id && !!channelId && enabled,
    staleTime: 10_000,
    queryFn: async (): Promise<ChannelAuditEvent[]> => {
      if (!channelId) return [];
      const { data, error } = await supabase
        .from("owner_comm_channel_audit_log")
        .select("id, channel_id, channel_type, identifier, event_type, details, created_at")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ChannelAuditEvent[];
    },
  });
}
