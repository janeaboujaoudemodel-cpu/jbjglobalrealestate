/**
 * ChannelCard — shared premium card for the 4 support channels.
 * Used by SupportLauncher (popovers/orbs) and AIConcierge (welcome + switch popover).
 */
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

export type ChannelDef = {
  id: "concierge" | "chat-support" | "whatsapp" | "call";
  label: string;
  description: string;
  responseTime: string;
  Icon: LucideIcon;
  // Exactly one of action / href / route must be provided.
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
        border border-[#D4B896]/35 bg-white/[0.04]
        hover:bg-white/[0.10] hover:border-[#E2C9A0]/60 transition-all`}
    >
      <div className="flex items-center gap-2 text-[#E2C9A0]">
        <channel.Icon className="h-4 w-4" />
        <span className="text-[12.5px] font-semibold text-[#FDFBF7]">{channel.label}</span>
      </div>
      <span className={`text-[11px] text-[#FDFBF7]/65 leading-snug ${compact ? "ml-auto" : ""}`}>
        {channel.description}
      </span>
      {!compact && (
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-[#E2C9A0]/85">
          <span className="h-1 w-1 rounded-full bg-emerald-400" /> {channel.responseTime}
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
      <button type="button" onClick={onClick} className="text-left">
        {Inner}
      </button>
    );
  }
  if (channel.route) {
    return (
      <Link to={channel.route} onClick={onActivate}>
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
    >
      {Inner}
    </a>
  );
}
