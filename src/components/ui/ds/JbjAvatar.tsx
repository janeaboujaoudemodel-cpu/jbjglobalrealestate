import * as React from "react";
import { cn } from "@/lib/utils";
import { useControlSkin, inkForSkin } from "@/hooks/use-chrome-skin";

/**
 * Forces the skin ink at runtime with !important priority (beats any stylesheet).
 * Sun/champagne chrome = black ink, Moon/emerald + hero-clear = white ink.
 */
function useForceWhiteInk(ink = "#FFFFFF") {
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const paint = () => {
      el.style.setProperty("color", ink, "important");
      el.style.setProperty("-webkit-text-fill-color", ink, "important");
    };
    paint();
    const id = window.setTimeout(paint, 60);
    return () => window.clearTimeout(id);
  });
  return ref;
}


export interface JbjAvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  initials?: string;
  size?: "sm" | "md";
}

const sizeClass = {
  sm: "h-9 w-9 text-[11px]",
  md: "h-10 w-10 text-[12px]",
};

/**
 * Single JBJ account avatar: emerald metallic, white initials, slow premium ring.
 * Used by both the header trigger and account dropdown — do not fork.
 */
export const JbjAvatar = React.forwardRef<HTMLSpanElement, JbjAvatarProps>(
  ({ initials = "JB", size = "md", className, ...props }, ref) => {
    const skin = useControlSkin();
    const champagne = skin === "champagne";
    const ink = inkForSkin(skin);
    const inkRef = useForceWhiteInk(ink);
    return (
      <span
        ref={ref}
        data-jbj-avatar
        data-jbj-avatar-skin={skin}
        data-surface={champagne ? "champagne" : "emerald"}
        data-no-contrast-guard
        className={cn(
          champagne ? "relative inline-flex" : "jj-avatar-metallic allow-white relative inline-flex" shrink-0 items-center justify-center rounded-full overflow-hidden",
          sizeClass[size],
          className,
        )}
        {...props}
      >
        {champagne ? (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{
              backgroundImage: "linear-gradient(90deg, #FDFBF7 0%, #F7F2EA 52%, #F2EBDC 100%)",
              boxShadow: "inset 0 0 0 1px rgba(184,149,85,0.42)",
            }}
          />
        ) : (
          <>
            <span aria-hidden="true" className="jj-avatar-spinner absolute inset-0 rounded-full pointer-events-none" />
            <span aria-hidden="true" className="jj-avatar-core absolute inset-0 rounded-full overflow-hidden" />
          </>
        )}
        <span
          ref={inkRef}
          data-no-contrast-guard
          data-emerald-ok
          className={cn("relative z-[3] font-extrabold leading-none tracking-[0.01em]", champagne ? "" : "allow-white !text-white")}
          style={{ color: ink, WebkitTextFillColor: ink }}
        >
          {initials}
        </span>
      </span>
    );
  },
);
JbjAvatar.displayName = "JbjAvatar";
export const HeaderAvatar = JbjAvatar;

export interface NotificationBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number;
  floating?: boolean;
}

/** Single notification badge used in header + dropdown. */
export function NotificationBadge({ count, floating = false, className, ...props }: NotificationBadgeProps) {
  const skin = useControlSkin();
  const champagne = skin === "champagne";
  const ink = inkForSkin(skin);
  const inkRef = useForceWhiteInk(ink);
  if (!count || count <= 0) return null;
  return (
    <span
      data-jbj-notification-badge
      data-surface={champagne ? "champagne" : "emerald"}
      data-emerald={champagne ? undefined : "true"}
      data-emerald-ok
      data-no-contrast-guard
      className={cn(
        champagne
          ? "inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold leading-none"
          : "allow-white inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold leading-none !text-white ![color:#FFFFFF] ![-webkit-text-fill-color:#FFFFFF] shadow-[0_6px_14px_-8px_rgba(0,0,0,0.85)]",
        floating && "absolute right-0 top-0 z-[6] translate-x-[30%]",
        className,
      )}
      {...props}
      style={{
        background: champagne
          ? "linear-gradient(90deg, #FDFBF7 0%, #F7F2EA 52%, #F2EBDC 100%)"
          : "linear-gradient(135deg, #E11D48 0%, #B0122F 100%)",
        boxShadow: champagne
          ? "0 0 0 1px rgba(184,149,85,0.55), 0 2px 6px -3px rgba(26,26,26,0.35)"
          : "0 0 0 2px rgba(255,255,255,0.92)",
        ...props.style,
        color: ink,
        WebkitTextFillColor: ink,
      }}

    >
      <span ref={inkRef} data-emerald-ok data-no-contrast-guard style={{ color: ink, WebkitTextFillColor: ink }}>
        {count > 9 ? "9+" : count}
      </span>
    </span>
  );
}

export default JbjAvatar;