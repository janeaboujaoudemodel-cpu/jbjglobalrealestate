import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, RefreshCw } from "lucide-react";
import { useCrossChannelDetection } from "@/hooks/useCrossChannelDetection";

export type ChannelMode = "email-first" | "chat-first";

interface CrossChannelToggleProps {
  /** The email address of the recipient (used for detection in email-first mode) */
  recipientEmail: string;
  /** Primary channel: email-first shows "Also notify in Team Chat", chat-first shows "Also send by email" */
  channel: ChannelMode;
  /** Whether the secondary channel toggle is on */
  checked: boolean;
  /** Toggle callback */
  onToggle: (checked: boolean) => void;
  /** Compact mode for tight UIs */
  compact?: boolean;
}

/**
 * Reusable cross-channel delivery toggle.
 *
 * - **email-first**: Detects if recipient is a registered platform user; if yes, shows
 *   "Also notify in Team Chat". If not, shows "External recipient — email only".
 * - **chat-first**: Always shows "Also send by email" since all chat recipients are internal.
 */
export function CrossChannelToggle({
  recipientEmail,
  channel,
  checked,
  onToggle,
  compact = false,
}: CrossChannelToggleProps) {
  // For chat-first mode we don't need detection — all recipients are internal
  const detection = useCrossChannelDetection(
    channel === "email-first" ? recipientEmail : ""
  );

  // ── Chat-first: always show "Also send by email" ──
  if (channel === "chat-first") {
    if (compact) {
      return (
        <div className="flex items-center gap-1.5">
          <Mail className="w-3 h-3 text-black/25" />
          <span className="text-[10px] text-black/30">Also email</span>
          <Switch
            checked={checked}
            onCheckedChange={onToggle}
            className="h-4 w-7 data-[state=checked]:bg-[#B89555]"
          />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between bg-[#FDFBF7] border border-[#B89555]/20 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#B89555]" />
          <span className="text-sm text-black">Also send by email</span>
        </div>
        <Switch checked={checked} onCheckedChange={onToggle} />
      </div>
    );
  }

  // ── Email-first: conditional on detection ──
  if (!recipientEmail || !recipientEmail.includes("@")) return null;

  if (detection.isLoading) {
    return (
      <div className="flex items-center gap-2 bg-[#FDFBF7] border border-[#B89555]/20 rounded-lg px-3 py-2">
        <MessageSquare className="w-4 h-4 text-black/30" />
        <span className="text-sm text-black/40">Checking recipient...</span>
        <RefreshCw className="w-3 h-3 text-black/30 animate-spin ml-auto" />
      </div>
    );
  }

  if (detection.isRegistered) {
    return (
      <div className="flex items-center justify-between bg-[#FDFBF7] border border-[#B89555]/20 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#B89555]" />
          <span className="text-sm text-black">Also notify in Team Chat</span>
          <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px] px-1.5 h-4">
            Internal User{detection.displayName ? ` · ${detection.displayName}` : ""}
          </Badge>
        </div>
        <Switch checked={checked} onCheckedChange={onToggle} />
      </div>
    );
  }

  // External recipient
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
      <Mail className="w-4 h-4 text-gray-600" />
      <span className="text-xs text-gray-600">External recipient — email only</span>
    </div>
  );
}

/** Returns the detection result for use in send logic */
export { useCrossChannelDetection };
