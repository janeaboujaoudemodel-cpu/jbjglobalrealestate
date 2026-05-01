/**
 * ChannelTile — Single provider tile for the Comm Hub v2 grid.
 * High-contrast champagne surface, gold accent, ink text. Never black-on-black.
 *
 * Reply-tone controls: each connected account shows a "Reply tone: Active /
 * Inactive" indicator with a one-click toggle, plus a per-account tone-profile
 * picker so different channels (e.g. WhatsApp vs Email) can use different
 * voices.
 */
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Mail,
  MessageSquare,
  Send,
  Mic,
  Instagram,
  Facebook,
  Linkedin,
  Hash,
  History,
  Inbox,
  Link2,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { ProviderState } from "@/hooks/useCommChannels";
import { ToneProfile, useUpdateChannelToneSettings } from "@/hooks/useToneProfiles";
import {
  ChannelAuditSummaryRow,
  useChannelAuditEvents,
  type ChannelAuditEventType,
} from "@/hooks/useChannelAudit";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const PROVIDER_ICONS: Record<string, LucideIcon> = {
  email_gmail: Mail,
  email_outlook: Mail,
  email_resend: Send,
  email_hostinger: Mail,
  whatsapp_twilio: MessageSquare,
  slack: Hash,
  telegram: Send,
  voice_elevenlabs: Mic,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  snapchat: MessageSquare,
};

interface Props {
  state: ProviderState;
  toneProfiles: ToneProfile[];
  auditSummary?: Record<string, ChannelAuditSummaryRow>;
  onConnect: () => void;
  onAddAnother?: () => void;
  onResync?: () => void;
  isConnecting: boolean;
  isResyncing?: boolean;
}

const EVENT_LABELS: Record<ChannelAuditEventType, string> = {
  connected: "Connected",
  reconnected: "Reconnected",
  synced: "Synced",
  sync_failed: "Sync failed",
  auto_replied: "Auto-replied",
  auto_reply_skipped: "Auto-reply paused",
  inbound_received: "Inbound message",
};

function fmtRel(ts: string | null | undefined) {
  if (!ts) return "—";
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

function ChannelActivityPanel({ channelId }: { channelId: string }) {
  const { data: events, isLoading } = useChannelAuditEvents(channelId);
  if (isLoading) {
    return <p className="text-[11px] text-[#5A4A2E] mt-1">Loading activity…</p>;
  }
  if (!events || events.length === 0) {
    return <p className="text-[11px] text-[#5A4A2E] mt-1">No activity recorded yet.</p>;
  }
  return (
    <ul className="mt-1 space-y-1 max-h-48 overflow-y-auto pr-1">
      {events.map((ev) => (
        <li
          key={ev.id}
          className="flex items-center justify-between gap-2 text-[11px] text-[#1A1A1A]"
        >
          <span className="font-medium">{EVENT_LABELS[ev.event_type] ?? ev.event_type}</span>
          <span className="text-[#5A4A2E]">{fmtRel(ev.created_at)}</span>
        </li>
      ))}
    </ul>
  );
}

function ToneAggregatePill({ aggregate }: { aggregate: ProviderState["autoReplyAggregate"] }) {
  if (aggregate === "all_on") {
    return (
      <Badge className="bg-emerald-600 text-white border-emerald-700">
        <Sparkles className="h-3 w-3 mr-1" /> Reply tone: Active
      </Badge>
    );
  }
  if (aggregate === "mixed") {
    return (
      <Badge className="bg-amber-500 text-[#1A1A1A] border-amber-600">
        <Sparkles className="h-3 w-3 mr-1" /> Reply tone: Mixed
      </Badge>
    );
  }
  // all_off (or no rows; the parent only renders this when status === connected)
  return (
    <Badge variant="outline" className="bg-[#FDFBF7] text-[#5A4A2E] border-[#B89555]/40">
      <Sparkles className="h-3 w-3 mr-1" /> Reply tone: Inactive
    </Badge>
  );
}

export default function ChannelTile({
  state,
  toneProfiles,
  onConnect,
  onAddAnother,
  onResync,
  isConnecting,
  isResyncing,
}: Props) {
  const { provider, status, lastSyncAt, trainingSamples, lastError, channelCount, channelRows, autoReplyAggregate } =
    state;
  const Icon = PROVIDER_ICONS[provider.id] || MessageSquare;
  const updateChannel = useUpdateChannelToneSettings();

  const statusPill = (() => {
    if (status === "connected") {
      return (
        <Badge className="bg-emerald-600 text-white border-emerald-700">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
        </Badge>
      );
    }
    if (lastError) {
      return (
        <Badge className="bg-red-600 text-white border-red-700">
          <AlertTriangle className="h-3 w-3 mr-1" /> Reconnect
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-[#FDFBF7] text-[#5A4A2E] border-[#B89555]/40">
        <Circle className="h-3 w-3 mr-1" /> Not Connected
      </Badge>
    );
  })();

  function handleToggle(rowId: string, next: boolean) {
    updateChannel.mutate(
      { channelId: rowId, autoReplyEnabled: next },
      {
        onSuccess: () => toast.success(next ? "Auto-reply enabled" : "Auto-reply paused"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
      }
    );
  }

  function handleProfileChange(rowId: string, value: string) {
    const next = value === "__default__" ? null : value;
    updateChannel.mutate(
      { channelId: rowId, toneProfileId: next },
      {
        onSuccess: () => toast.success("Tone profile updated"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
      }
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#B89555]/25 bg-[#FDFBF7] p-5 shadow-[0_2px_12px_rgba(184,149,85,0.08)] hover:border-[#B89555]/50 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <IconTile icon={Icon} tone="gold" size="md" />
          <div>
            <h3 className="font-semibold text-[#1A1A1A] text-base leading-tight">{provider.label}</h3>
            <p className="text-xs text-[#5A4A2E] mt-0.5">{provider.description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {statusPill}
          {status === "connected" && <ToneAggregatePill aggregate={autoReplyAggregate} />}
        </div>
      </div>

      {status === "connected" && (
        <div className="space-y-2 mt-3 pt-3 border-t border-[#B89555]/15">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5A4A2E]">Accounts</span>
            <span className="font-medium text-[#1A1A1A]">{channelCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5A4A2E]">Last sync</span>
            <span className="font-medium text-[#1A1A1A]">
              {lastSyncAt ? formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true }) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5A4A2E]">Training samples</span>
            <span className="font-medium text-[#1A1A1A]">{trainingSamples}</span>
          </div>
          {lastError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 mt-2">
              {lastError}
            </p>
          )}
        </div>
      )}

      {/* Per-account reply-tone controls */}
      {status === "connected" && channelRows.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#B89555]/15 space-y-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#5A4A2E] font-semibold">
            Reply tone per account
          </p>
          {channelRows.map((row) => {
            const isOn = row.auto_reply_enabled === true;
            const profileValue = row.tone_profile_id ?? "__default__";
            const isPending = updateChannel.isPending && updateChannel.variables?.channelId === row.id;
            return (
              <div
                key={row.id}
                className="flex flex-col gap-2 rounded-lg border border-[#B89555]/20 bg-[#F7F2EA] px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#1A1A1A] truncate">
                      {row.display_name || row.identifier}
                    </p>
                    <p className="text-[11px] text-[#5A4A2E] mt-0.5">
                      {isOn ? "Auto-reply active" : "Auto-reply paused"}
                    </p>
                  </div>
                  <Switch
                    checked={isOn}
                    disabled={isPending}
                    onCheckedChange={(v) => handleToggle(row.id, v)}
                    aria-label={`Toggle auto-reply for ${row.display_name || row.identifier}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#5A4A2E] shrink-0">Tone profile</span>
                  <Select
                    value={profileValue}
                    onValueChange={(v) => handleProfileChange(row.id, v)}
                    disabled={isPending || toneProfiles.length === 0}
                  >
                    <SelectTrigger className="h-8 text-xs bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]">
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__default__">Default (active profile)</SelectItem>
                      {toneProfiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.profile_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {status === "connected" ? (
          <>
            {onResync && (
              <Button
                variant="gold"
                size="sm"
                className="flex-1 min-w-[140px]"
                onClick={onResync}
                disabled={isResyncing || isConnecting}
                aria-label={`Resync ${provider.label} inbox`}
              >
                {isResyncing ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Syncing…</>
                ) : (
                  <><RefreshCw className="h-3.5 w-3.5 mr-1" /> Resync inbox</>
                )}
              </Button>
            )}
            {onAddAnother && (
              <Button variant="secondary" size="sm" className="flex-1" onClick={onAddAnother} disabled={isConnecting}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add another
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={onConnect}
              disabled={isConnecting}
              aria-label={`Reconnect ${provider.label}`}
            >
              {isConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reconnect"}
            </Button>
          </>
        ) : (
          <Button variant="gold" size="sm" className="w-full" onClick={onConnect} disabled={isConnecting}>
            {isConnecting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Connecting…</>
            ) : (
              <>Connect</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

