/**
 * ChannelTile — Single provider tile for the Comm Hub v2 grid.
 * High-contrast champagne surface, gold accent, ink text. Never black-on-black.
 */
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Loader2,
  Plus,
  RefreshCw,
  Mail,
  MessageSquare,
  Send,
  Mic,
  Instagram,
  Facebook,
  Linkedin,
  Hash,
  type LucideIcon,
} from "lucide-react";
import { ProviderState } from "@/hooks/useCommChannels";
import { formatDistanceToNow } from "date-fns";

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
  onConnect: () => void;
  onAddAnother?: () => void;
  onResync?: () => void;
  isConnecting: boolean;
  isResyncing?: boolean;
}

export default function ChannelTile({ state, onConnect, onAddAnother, onResync, isConnecting, isResyncing }: Props) {
  const { provider, status, anyActive, lastSyncAt, trainingSamples, lastError, channelCount } = state;
  const Icon = PROVIDER_ICONS[provider.id] || MessageSquare;

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
        {statusPill}
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
