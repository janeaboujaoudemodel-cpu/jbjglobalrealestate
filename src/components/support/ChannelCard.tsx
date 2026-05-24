/**
 * ChannelCard — shared premium card for the 4 support channels.
 * Champagne surface, ink text, gold hairline (brand standard).
 */
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

export type ChannelDef = {
  id: "concierge" | "chat-support" | "whatsapp" | "call" | "voice-ai";
  label: string;
  description: string;
  responseTime: string;
  Icon: LucideIcon;
  action?: () => void;
  href?: string;
  route?: string;
  external?: boolean;
};

export default function ChannelCard({
  channel,
  compact = false,
  onActivate,
}: {
  channel: ChannelDef;
  compact?: boolean;
  onActivate?: () => void;
}) {
  const Inner = (
    <div
      data-premium
      data-no-contrast-guard
      className={`group/channel flex ${compact ? "flex-row items-center gap-3" : "flex-col items-start gap-1"}
        px-3 py-2.5 rounded-xl text-left w-full
        border border-gold bg-[#F7F2EA] text-[#B89555]
        transform-gpu transition-[background-color,color,border-color,box-shadow,transform] duration-200
        hover:bg-[#EFE6D6] hover:text-[#1A1A1A] hover:border-[#B89555] hover:-translate-y-0.5
        hover:shadow-[0_14px_28px_rgba(26,26,26,0.18),0_0_22px_rgba(184,149,85,0.35)]`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold bg-[#FDFBF7] text-[#B89555] transition-colors group-hover/channel:bg-[#FDFBF7] group-hover/channel:text-[#1A1A1A] group-hover/channel:border-[#1A1A1A]">
          <channel.Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[13px] font-semibold text-[#B89555] group-hover/channel:text-[#1A1A1A] transition-colors">{channel.label}</span>
      </div>
      <span className={`text-[11.5px] leading-tight text-[#B89555]/85 group-hover/channel:text-[#1A1A1A]/80 transition-colors ${compact ? "ml-auto" : ""}`}>
        {channel.description}
      </span>
      {!compact && channel.responseTime && (
        <span className="inline-flex items-center gap-1 pt-0.5 text-[10px] uppercase tracking-[0.14em] font-semibold text-[#B89555]/80 group-hover/channel:text-[#1A1A1A]/85 transition-colors">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {channel.responseTime}
        </span>
      )}
    </div>
  );

  const onClick = () => {
    onActivate?.();
    channel.action?.();
  };

  if (channel.action) {
    return (
      <button type="button" onClick={onClick} className="text-left w-full">
        {Inner}
      </button>
    );
  }
  if (channel.route) {
    return (
      <Link to={channel.route} onClick={onActivate} className="block w-full">
        {Inner}
      </Link>
    );
  }
  return (
    <a
      href={channel.href}
      target={channel.external ? "_blank" : undefined}
      rel={channel.external ? "noreferrer" : undefined}
      onClick={onActivate}
      className="block w-full"
    >
      {Inner}
    </a>
  );
}
