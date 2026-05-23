import * as React from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * PearlButton — global premium CTA.
 *
 * Replaces the legacy dark / black CTA buttons site-wide.
 * Mother-of-pearl champagne gradient, gold hairline border, soft 3D depth,
 * floating lift + champagne-gold glow on hover. Ink #1A1A1A text only.
 *
 * Use everywhere you previously had a heavy black "Start Exploring" /
 * "View All Projects" / "Try Our Mortgage Calculator" style CTA.
 */
export type PearlButtonSize = "sm" | "md" | "lg";

type CommonProps = {
  size?: PearlButtonSize;
  className?: string;
  children: React.ReactNode;
  /** Render a leading icon (rendered in gold). */
  leadingIcon?: React.ReactNode;
  /** Render a trailing icon (rendered in gold, translates on hover). */
  trailingIcon?: React.ReactNode;
  disabled?: boolean;
};

type AsButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    to?: undefined;
  };

type AsLinkProps = CommonProps &
  Omit<LinkProps, keyof CommonProps> & {
    to: LinkProps["to"];
  };

const sizeMap: Record<PearlButtonSize, string> = {
  sm: "px-5 py-2.5 text-[12px] gap-2 rounded-lg",
  md: "px-7 py-3.5 text-sm gap-2.5 rounded-xl",
  lg: "px-10 py-5 text-base gap-3 rounded-xl",
};

const baseClass =
  // Layout
  "group relative inline-flex items-center justify-center font-bold tracking-tight " +
  // Color — ink on champagne, never dark fill
  "text-[#1A1A1A] " +
  // Mother-of-pearl champagne gradient
  "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] " +
  "hover:from-[#FDFBF7] hover:via-[#F4ECDC] hover:to-[#E8D9BC] " +
  // Gold hairline border (per design system: gold = 1px hairline only)
  "border border-[#B89555]/55 hover:border-[#B89555] " +
  // 3D depth: soft inset highlight + dropped champagne-gold glow
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(184,149,85,0.18),0_10px_28px_-12px_rgba(184,149,85,0.40),0_2px_6px_-2px_rgba(26,26,26,0.18)] " +
  "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.98),inset_0_-1px_0_rgba(184,149,85,0.28),0_0_0_1px_rgba(184,149,85,0.55),0_18px_44px_-10px_rgba(184,149,85,0.55),0_6px_14px_-4px_rgba(26,26,26,0.22)] " +
  // Floating lift on hover, snap back on press
  "transition-all duration-300 will-change-transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] " +
  // Focus
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7] " +
  // Disabled
  "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0";

function InnerContent({
  leadingIcon,
  trailingIcon,
  children,
}: Pick<CommonProps, "leadingIcon" | "trailingIcon" | "children">) {
  return (
    <>
      {leadingIcon ? (
        <span className="inline-flex items-center text-[#B89555] [&_svg]:w-[1.05em] [&_svg]:h-[1.05em]" aria-hidden>
          {leadingIcon}
        </span>
      ) : null}
      <span className="inline-flex items-center text-[#1A1A1A]">{children}</span>
      {trailingIcon ? (
        <span
          className="inline-flex items-center text-[#B89555] transition-transform duration-300 group-hover:translate-x-1 [&_svg]:w-[1.05em] [&_svg]:h-[1.05em]"
          aria-hidden
        >
          {trailingIcon}
        </span>
      ) : null}
    </>
  );
}

export const PearlButton = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  AsButtonProps | AsLinkProps
>(function PearlButton(props, ref) {
  const { size = "md", className, children, leadingIcon, trailingIcon } = props;
  const sizeCls = sizeMap[size];

  if ("to" in props && props.to !== undefined) {
    const { to, leadingIcon: _l, trailingIcon: _t, size: _s, className: _c, children: _ch, ...rest } =
      props as AsLinkProps;
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        to={to}
        className={cn(baseClass, sizeCls, className)}
        {...rest}
      >
        <InnerContent leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
          {children}
        </InnerContent>
      </Link>
    );
  }

  const { leadingIcon: _l, trailingIcon: _t, size: _s, className: _c, children: _ch, ...rest } =
    props as AsButtonProps;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      className={cn(baseClass, sizeCls, className)}
      {...rest}
    >
      <InnerContent leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
        {children}
      </InnerContent>
    </button>
  );
});

export default PearlButton;
