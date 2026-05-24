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
        border border-gold bg-raised text-ink
        transform-gpu transition-[border-color,box-shadow,transform]
        hover:bg-primary hover:text-primary-foreground hover:border-gold hover:-translate-y-0.5
        hover:shadow-[0_16px_32px_hsl(var(--foreground)/0.22),0_0_24px_hsl(var(--gold)/0.30)]`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold bg-surface text-ink transition-colors group-hover/channel:bg-primary-foreground/10 group-hover/channel:text-primary-foreground">
          <channel.Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[13px] font-semibold text-current">{channel.label}</span>
      </div>
      <span className={`text-[11.5px] leading-tight text-current opacity-75 group-hover/channel:opacity-90 ${compact ? "ml-auto" : ""}`}>
        {channel.description}
      </span>
      {!compact && (
        <span className="inline-flex items-center gap-1 pt-0.5 text-[10px] uppercase tracking-[0.14em] font-semibold text-current opacity-70 group-hover/channel:opacity-90">
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
