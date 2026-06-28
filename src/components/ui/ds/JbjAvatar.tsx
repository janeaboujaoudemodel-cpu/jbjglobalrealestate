import * as React from "react";
import { cn } from "@/lib/utils";

export interface JbjAvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  initials?: string;
  size?: "sm" | "md";
}

const sizeClass = {
  sm: "h-10 w-10 text-[12px]",
  md: "h-11 w-11 text-[12px]",
};

/**
 * Single JBJ account avatar: emerald metallic, white initials, slow premium ring.
 * Used by both the header trigger and account dropdown — do not fork.
 */
export const JbjAvatar = React.forwardRef<HTMLSpanElement, JbjAvatarProps>(
  ({ initials = "JB", size = "md", className, ...props }, ref) => (
    <span
      ref={ref}
      data-jbj-avatar
      data-surface="emerald"
      data-no-contrast-guard
      className={cn(
        "jj-avatar-metallic allow-white relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden",
        sizeClass[size],
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="jj-avatar-spinner absolute inset-0 rounded-full pointer-events-none" />
      <span aria-hidden="true" className="jj-avatar-core absolute inset-0 rounded-full overflow-hidden" />
      <span className="relative z-[3] font-extrabold leading-none tracking-[0.01em] text-white">
        {initials}
      </span>
    </span>
  ),
);
JbjAvatar.displayName = "JbjAvatar";
export const HeaderAvatar = JbjAvatar;

export interface NotificationBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number;
  floating?: boolean;
}

/** Single notification badge used in header + dropdown. */
export function NotificationBadge({ count, floating = false, className, ...props }: NotificationBadgeProps) {
  if (!count || count <= 0) return null;
  return (
    <span
      data-jbj-notification-badge
      data-surface="emerald"
      data-no-contrast-guard
      className={cn(
        "allow-white inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold leading-none !text-white ![color:#FFFFFF] ![-webkit-text-fill-color:#FFFFFF] shadow-[0_8px_18px_-9px_rgba(0,0,0,0.8)]",
        floating && "absolute -right-1 -top-1 z-[3]",
        className,
      )}
      {...props}
      style={{ ...props.style, color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default JbjAvatar;