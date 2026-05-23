/**
 * ChannelCard — shared premium card for the 4 support channels.
 * Champagne surface, ink text, gold hairline (brand standard).
 */
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

export type ChannelDef = {
  id: "concierge" | "chat-support" | "whatsapp" | "call";
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
      data-no-contrast-guard
      className={`group flex ${compact ? "flex-row items-center gap-3" : "flex-col items-start gap-1.5"}
        px-3.5 py-3 rounded-xl text-left w-full
        border border-[#B89555]/40 bg-[#FDFBF7]
        hover:bg-[#F7F2EA] hover:border-[#B89555]/70 transition-all`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A]">
          <channel.Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[13px] font-semibold text-[#1A1A1A]">{channel.label}</span>
      </div>
      <span className={`text-[11.5px] text-[#1A1A1A]/70 leading-snug ${compact ? "ml-auto" : ""}`}>
        {channel.description}
      </span>
      {!compact && (
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-semibold text-[#1A1A1A]/65">
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
