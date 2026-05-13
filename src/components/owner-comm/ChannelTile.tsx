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
import { useNavigate } from "react-router-dom";
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
    return <p className="text-[11px] text-[#1A1A1A]/70 mt-1">Loading activity…</p>;
  }
  if (!events || events.length === 0) {
    return <p className="text-[11px] text-[#1A1A1A]/70 mt-1">No activity recorded yet.</p>;
  }
  return (
    <ul className="mt-1 space-y-1 max-h-48 overflow-y-auto pr-1">
      {events.map((ev) => (
        <li
          key={ev.id}
          className="flex items-center justify-between gap-2 text-[11px] text-[#1A1A1A]"
        >
          <span className="font-medium">{EVENT_LABELS[ev.event_type] ?? ev.event_type}</span>
          <span className="text-[#1A1A1A]/70">{fmtRel(ev.created_at)}</span>
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
    <Badge variant="outline" className="bg-[#FDFBF7] text-[#1A1A1A]/70 border-[#B89555]/40">
      <Sparkles className="h-3 w-3 mr-1" /> Reply tone: Inactive
    </Badge>
  );
}

export default function ChannelTile({
  state,
  toneProfiles,
  auditSummary,
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
  const navigate = useNavigate();
  const [openActivity, setOpenActivity] = useState<Record<string, boolean>>({});
  const isEmailProvider = provider.id.startsWith("email_");

  const statusPill = (() => {
    if (status === "connected") {
      return (
        <Badge className="bg-emerald-600 text-white border-emerald-700">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
        </Badge>
      );
    }
    if (status === "error") {
      return (
        <Badge className="bg-red-600 text-white border-red-700">
          <AlertTriangle className="h-3 w-3 mr-1" /> Sync failed — reconnect
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-[#FDFBF7] text-[#1A1A1A]/70 border-[#B89555]/40">
        <Circle className="h-3 w-3 mr-1" /> Not Connected
      </Badge>
    );
  })();

  const openInbox = (channelId?: string) => {
    const params = new URLSearchParams();
    params.set("channel", provider.id);
    if (channelId) params.set("channelId", channelId);
    navigate(`/owner/inbox?${params.toString()}`);
  };

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
    <div className="rounded-2xl border-2 border-[#B89555]/25 bg-[#FDFBF7] p-4 sm:p-5 shadow-[0_2px_12px_rgba(184,149,85,0.08)] hover:border-[#B89555]/50 transition-all min-w-0 overflow-hidden">
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          <IconTile icon={Icon} tone="gold" size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[#1A1A1A] text-base leading-tight break-words">{provider.label}</h3>
            <p className="text-xs text-[#1A1A1A]/70 mt-0.5 line-clamp-2 break-words">{provider.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {statusPill}
          {status === "connected" && <ToneAggregatePill aggregate={autoReplyAggregate} />}
        </div>
      </div>

      {status === "connected" && (
        <div className="space-y-2 mt-3 pt-3 border-t border-[#B89555]/15">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#1A1A1A]/70">Accounts</span>
            <span className="font-medium text-[#1A1A1A]">{channelCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#1A1A1A]/70">Last sync</span>
            <span className="font-medium text-[#1A1A1A]">
              {lastSyncAt ? formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true }) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#1A1A1A]/70">Training samples</span>
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
      {(status === "connected" || status === "error") && channelRows.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#B89555]/15 space-y-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#1A1A1A]/70 font-semibold">
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
                    <p className="text-[11px] text-[#1A1A1A]/70 mt-0.5">
                      {isOn ? "Auto-reply active" : "Auto-reply paused"}
                    </p>
                  </div>
                  {isEmailProvider && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[11px] border-[#B89555]/40"
                      onClick={() => openInbox(row.id)}
                      aria-label={`Open ${row.display_name || row.identifier} inbox`}
                    >
                      <Inbox className="h-3 w-3 mr-1" /> Open inbox
                    </Button>
                  )}
                  <Switch
                    checked={isOn}
                    disabled={isPending}
                    onCheckedChange={(v) => handleToggle(row.id, v)}
                    aria-label={`Toggle auto-reply for ${row.display_name || row.identifier}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#1A1A1A]/70 shrink-0">Tone profile</span>
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

                {(() => {
                  const summary = auditSummary?.[row.id];
                  const isOpen = !!openActivity[row.id];
                  return (
                    <div className="border-t border-[#B89555]/20 pt-2 mt-1 space-y-1">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                        <div className="flex items-center gap-1 text-[#1A1A1A]/70"><Link2 className="h-3 w-3" /> Connected</div>
                        <div className="text-[#1A1A1A] font-medium text-right">{fmtRel(summary?.last_connected_at)}</div>
                        <div className="flex items-center gap-1 text-[#1A1A1A]/70"><RefreshCw className="h-3 w-3" /> Synced</div>
                        <div className="text-[#1A1A1A] font-medium text-right">{fmtRel(summary?.last_synced_at)}</div>
                        <div className="flex items-center gap-1 text-[#1A1A1A]/70"><Sparkles className="h-3 w-3" /> Auto-reply</div>
                        <div className="text-[#1A1A1A] font-medium text-right">{fmtRel(summary?.last_auto_reply_at)}</div>
                        <div className="flex items-center gap-1 text-[#1A1A1A]/70"><Inbox className="h-3 w-3" /> Inbound</div>
                        <div className="text-[#1A1A1A] font-medium text-right">{fmtRel(summary?.last_inbound_at)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenActivity((s) => ({ ...s, [row.id]: !s[row.id] }))}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1A1A1A] hover:underline mt-1"
                        aria-expanded={isOpen}
                      >
                        <History className="h-3 w-3" />
                        {isOpen ? "Hide activity" : "View activity"}
                        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                      {isOpen && <ChannelActivityPanel channelId={row.id} />}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {status === "connected" || status === "error" ? (
          <>
            {isEmailProvider && (
              <Button
                variant="gold"
                size="sm"
                className="flex-1 min-w-[140px]"
                onClick={() => openInbox()}
                aria-label={`Open ${provider.label} inbox`}
              >
                <Inbox className="h-3.5 w-3.5 mr-1" /> Open inbox
              </Button>
            )}
            {onResync && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 min-w-[120px]"
                onClick={onResync}
                disabled={isResyncing || isConnecting}
                aria-label={`Resync ${provider.label} inbox`}
              >
                {isResyncing ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Syncing…</>
                ) : (
                  <><RefreshCw className="h-3.5 w-3.5 mr-1" /> Sync now</>
                )}
              </Button>
            )}
            {onAddAnother && (
              <Button variant="outline" size="sm" className="flex-1 border-[#B89555]/40" onClick={onAddAnother} disabled={isConnecting}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add another
              </Button>
            )}
            <Button
              variant={status === "error" ? "gold" : "outline"}
              size="sm"
              className={status === "error" ? "flex-1 min-w-[120px]" : "flex-1 border-[#B89555]/40"}
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

