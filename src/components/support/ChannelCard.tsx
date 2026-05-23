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
        border border-gold/40 bg-background text-foreground
        transform-gpu transition-[border-color,box-shadow,transform]
        hover:bg-background hover:text-foreground hover:border-gold/70 hover:-translate-y-0.5
        hover:shadow-[0_14px_28px_hsl(var(--foreground)/0.12),0_0_18px_hsl(var(--gold)/0.18)]`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gold/40 bg-secondary text-foreground">
          <channel.Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[13px] font-semibold text-foreground">{channel.label}</span>
      </div>
      <span className={`text-[11.5px] text-foreground/70 leading-snug ${compact ? "ml-auto" : ""}`}>
        {channel.description}
      </span>
      {!compact && (
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] font-semibold text-foreground/65">
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
