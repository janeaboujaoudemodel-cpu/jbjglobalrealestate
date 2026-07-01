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
      data-no-contrast-guard
      className="jbj-emerald-animated-border rounded-xl p-[2px] w-full h-full block"
    >
      <div
        data-emerald="true"
        data-allow-dark-cta
        data-no-contrast-guard
        className={`group/channel flex flex-row items-center gap-3 w-full h-full text-left
          px-3.5 py-3 rounded-[10px] min-h-[76px]
          jj-emerald-metallic text-white allow-white
          transform-gpu transition-[filter,box-shadow,transform] duration-200
          hover:-translate-y-0.5 hover:brightness-110
          hover:shadow-[0_16px_34px_-14px_rgba(6,78,59,0.95),0_0_22px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.28)]`}
        style={{ color: "#FFFFFF" }}
      >
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/12 text-white allow-white transition-colors group-hover/channel:bg-white/20 group-hover/channel:border-white/70">
          <channel.Icon className="h-5 w-5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
        </span>
        <div className="flex flex-1 min-w-0 flex-col justify-center gap-0.5">
          <span
            className="allow-white text-[14px] font-semibold leading-tight text-white truncate"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
          >
            {channel.label}
          </span>
          <span
            className="allow-white text-[12px] leading-tight text-white/85 truncate"
            style={{ color: "rgba(255,255,255,0.88)", WebkitTextFillColor: "rgba(255,255,255,0.88)" }}
          >
            {channel.description}
          </span>
          {channel.responseTime && (
            <span
              className="allow-white inline-flex items-center gap-1 pt-0.5 text-[10px] uppercase tracking-[0.16em] font-semibold text-white/80"
              style={{ color: "rgba(255,255,255,0.82)", WebkitTextFillColor: "rgba(255,255,255,0.82)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              {channel.responseTime}
            </span>
          )}
        </div>
      </div>
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
