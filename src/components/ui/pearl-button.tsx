import * as React from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * PearlButton — global premium CTA.
 *
 * Replaces the legacy dark / black CTA buttons site-wide.
 * Primary + secondary pair mirrors the AI Property Comparison CTAs:
 * primary emerald/dark with white text, secondary champagne with emerald text.
 *
 * Use everywhere you previously had a heavy black "Start Exploring" /
 * "View All Projects" / "Try Our Mortgage Calculator" style CTA.
 */
export type PearlButtonSize = "sm" | "md" | "lg";
export type PearlButtonVariant = "primary" | "secondary";

type CommonProps = {
  size?: PearlButtonSize;
  /**
   * Visual variant.
   * - primary: emerald/dark CTA with white text/icons.
   * - secondary: champagne CTA with emerald text/icons.
   */
  variant?: PearlButtonVariant;
  className?: string;
  children: React.ReactNode;
  /** Leading icon follows the selected CTA contrast contract. */
  leadingIcon?: React.ReactNode;
  /** Trailing icon (gold/white, translates on hover). */
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

const baseLayout =
  "group relative inline-flex items-center justify-center whitespace-nowrap font-bold tracking-tight " +
  "transition-all duration-300 will-change-transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0";

const primaryClass =
  "jj-dual-cta-primary animated-border allow-white text-white border border-white/20 focus-visible:ring-[#064E3B]/70 focus-visible:ring-offset-[#064E3B]";

const secondaryClass =
  "jj-dual-cta-secondary border border-[#064E3B]/35 focus-visible:ring-[#064E3B]/60 focus-visible:ring-offset-[#FDFBF7]";

function InnerContent({
  leadingIcon,
  trailingIcon,
  children,
  variant,
}: Pick<CommonProps, "leadingIcon" | "trailingIcon" | "children"> & { variant: PearlButtonVariant }) {
  const iconColor = variant === "secondary" ? "text-[#064E3B]" : "text-white allow-white";
  const labelColor = variant === "secondary" ? "text-[#064E3B]" : "text-white allow-white";
  return (
    <>
      {leadingIcon ? (
        <span className={cn("inline-flex items-center [&_svg]:w-[1.05em] [&_svg]:h-[1.05em]", iconColor)} aria-hidden>
          {leadingIcon}
        </span>
      ) : null}
      <span className={cn("inline-flex items-center", labelColor)}>{children}</span>
      {trailingIcon ? (
        <span
          className={cn(
            "inline-flex items-center transition-transform duration-300 group-hover:translate-x-1 [&_svg]:w-[1.05em] [&_svg]:h-[1.05em]",
            iconColor
          )}
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
  const { size = "md", variant = "primary", className, children, leadingIcon, trailingIcon } = props;
  const sizeCls = sizeMap[size];
  const variantCls = variant === "secondary" ? secondaryClass : primaryClass;
  const surfaceAttr = variant === "secondary"
    ? { "data-cta": "champagne" as const }
    : { "data-emerald": "true" as const, "data-no-contrast-guard": true as const };

  if ("to" in props && props.to !== undefined) {
    const { to, leadingIcon: _l, trailingIcon: _t, size: _s, variant: _v, className: _c, children: _ch, ...rest } =
      props as AsLinkProps;
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        to={to}
        className={cn(baseLayout, variantCls, sizeCls, className)}
        {...surfaceAttr}
        {...rest}
      >
        <InnerContent leadingIcon={leadingIcon} trailingIcon={trailingIcon} variant={variant}>
          {children}
        </InnerContent>
      </Link>
    );
  }

  const { leadingIcon: _l, trailingIcon: _t, size: _s, variant: _v, className: _c, children: _ch, ...rest } =
    props as AsButtonProps;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      className={cn(baseLayout, variantCls, sizeCls, className)}
      {...surfaceAttr}
      {...rest}
    >
      <InnerContent leadingIcon={leadingIcon} trailingIcon={trailingIcon} variant={variant}>
        {children}
      </InnerContent>
    </button>
  );
});

export default PearlButton;
