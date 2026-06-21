/**
 * ChannelCard — shared premium card for the 4 support channels.
 * Emerald metallic surface with white text/icons.
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
      data-emerald="true"
      data-no-contrast-guard
      className={`group/channel flex ${compact ? "flex-row items-center gap-3" : "flex-col items-start gap-1"}
        px-3 py-2.5 rounded-xl text-left w-full
        jj-emerald-metallic border-white/20 text-white allow-white
        transform-gpu transition-[filter,border-color,box-shadow,transform] duration-200
        hover:-translate-y-0.5 hover:brightness-110
        hover:shadow-[0_16px_34px_-14px_rgba(6,78,59,0.95),0_0_22px_rgba(52,211,153,0.28),inset_0_1px_0_rgba(255,255,255,0.28)]`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/35 bg-white/12 text-white allow-white transition-colors group-hover/channel:bg-white/16 group-hover/channel:border-white/60">
          <channel.Icon className="h-3.5 w-3.5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
        </span>
        <span className="text-[13px] font-semibold text-white allow-white transition-colors">{channel.label}</span>
      </div>
      <span className={`text-[11.5px] leading-tight text-white/85 allow-white transition-colors ${compact ? "ml-auto" : ""}`}>
        {channel.description}
      </span>
      {!compact && channel.responseTime && (
        <span className="inline-flex items-center gap-1 pt-0.5 text-[10px] uppercase tracking-[0.14em] font-semibold text-white/80 allow-white transition-colors">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> {channel.responseTime}
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
