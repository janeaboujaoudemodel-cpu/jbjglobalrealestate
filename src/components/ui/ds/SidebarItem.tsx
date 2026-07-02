import * as React from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SidebarItem — JBJ Design System (Phase 1.A)
 *
 * One primitive for every vertical-nav row: top-level categories,
 * sub-items, footer rows (Contact, Support, Sign Out, Collapse).
 *
 * Sizing is the same for all rows — there are no "oversized" variants.
 * The only differences:
 *   - level="root"   → 14px label, 20px icon
 *   - level="sub"    → 13px label, 16px icon, indented
 *   - level="footer" → same as root, slightly muted
 *
 * Active state → emerald metallic gradient + pure white fg/icons.
 * Inactive    → champagne page surface, ink fg, soft hover.
 * Collapsed   → icon-only, centered, same 40x40 hit area.
 */

export type SidebarItemLevel = "root" | "sub" | "footer";

export interface SidebarItemProps {
  icon?: LucideIcon;
  iconRef?: React.Ref<SVGSVGElement>;
  label: string;
  to?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onFocus?: React.FocusEventHandler<HTMLElement>;
  active?: boolean;
  collapsed?: boolean;
  level?: SidebarItemLevel;
  badge?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  iconWrapperClassName?: string;
  iconClassName?: string;
  iconWrapperStyle?: React.CSSProperties;
  iconStyle?: React.CSSProperties;
  iconWrapperData?: Record<`data-${string}`, unknown>;
  iconStrokeWidth?: number;
  iconData?: Record<`data-${string}`, unknown>;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  labelData?: Record<`data-${string}`, unknown>;
  trailingClassName?: string;
  /** Use only when migrating an already-approved live control: className/style are the visual source of truth. */
  preserveVisual?: boolean;
  /** When true, render as a non-navigating button (e.g. Collapse, Sign Out). */
  asButton?: boolean;
  [key: `data-${string}`]: unknown;
  "aria-current"?: React.AriaAttributes["aria-current"];
}

const BASE =
  "group relative w-full flex items-center gap-3 rounded-[10px] " +
  "transition-[background-color,color,box-shadow] duration-150 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7] " +
  "select-none cursor-pointer";

const LEVEL: Record<SidebarItemLevel, string> = {
  root:   "h-10 px-3 text-[13.5px] font-medium",
  sub:    "h-9 pl-9 pr-3 text-[12.5px] font-normal",
  footer: "h-10 px-3 text-[13px] font-medium",
};

const ICON_SIZE: Record<SidebarItemLevel, string> = {
  root:   "w-[18px] h-[18px]",
  sub:    "w-[15px] h-[15px]",
  footer: "w-[18px] h-[18px]",
};

function classesFor(active: boolean) {
  return active
    ? // ACTIVE — emerald metallic + pure white
      "text-white shadow-[0_8px_20px_-14px_rgba(6,78,59,0.85),inset_0_1px_0_rgba(255,255,255,0.18)]"
    : // INACTIVE — ink on champagne page; soft hover
      "text-[#1A1A1A] hover:bg-[#1A1A1A]/[0.045] hover:text-[#1A1A1A]";
}

export const SidebarItem = React.forwardRef<HTMLElement, SidebarItemProps>(
  (
    {
      icon: Icon,
      iconRef,
      label,
      to,
      onClick,
      onMouseEnter,
      onFocus,
      active = false,
      collapsed = false,
      level = "root",
      badge,
      trailing,
      className,
      style,
      iconWrapperClassName,
      iconClassName,
      iconWrapperStyle,
      iconStyle,
      iconWrapperData,
      iconStrokeWidth = 2.1,
      iconData,
      labelClassName,
      labelStyle,
      labelData,
      trailingClassName,
      preserveVisual = false,
      asButton,
      ...rest
    },
    ref,
  ) => {
    const inner = (
      <>
        {Icon && (
          <span
            data-jjds-sidebar-icon=""
            {...iconWrapperData}
            className={cn(
              iconWrapperClassName
                ? iconWrapperClassName
                : [
                    "inline-flex items-center justify-center shrink-0",
                    ICON_SIZE[level],
                    active ? "text-white" : "text-[#1A1A1A]",
                  ],
            )}
            style={iconWrapperStyle}
            aria-hidden
          >
            <Icon
              ref={iconRef}
              {...iconData}
              className={cn(iconClassName ?? ICON_SIZE[level], active && "allow-white")}
              strokeWidth={iconStrokeWidth}
              style={iconStyle ?? (active ? { color: "#FFFFFF", stroke: "#FFFFFF" } : undefined)}
            />
          </span>
        )}
        {!collapsed && (
          <span
            data-jbj-allow-shrink=""
            {...labelData}
            className={cn(labelClassName ?? "flex-1 min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]")}
            style={labelStyle ?? (active ? { color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" } : undefined)}
          >
            {label}
          </span>
        )}
        {!collapsed && badge && (
          <span className="ml-1 shrink-0">{badge}</span>
        )}
        {!collapsed && trailing && (
          <span className={cn("ml-1 shrink-0 inline-flex items-center", trailingClassName)}>{trailing}</span>
        )}
      </>
    );

    const cls = preserveVisual
      ? className
      : cn(
          BASE,
          collapsed ? "justify-center px-0 w-10 h-10" : LEVEL[level],
          classesFor(active),
          className,
        );

    const resolvedStyle: React.CSSProperties | undefined = style ?? (active
      ? { backgroundImage: "var(--jj-emerald-ombre)", color: "#FFFFFF" }
      : undefined);

    const common = {
      "data-jjds-sidebar-item": "",
      "data-jjds-level": level,
      "data-jjds-active": active ? "true" : "false",
      "data-no-contrast-guard": active ? "" : undefined,
      "data-surface": active ? ("emerald" as const) : ("light" as const),
      "aria-label": label,
      title: collapsed ? label : undefined,
    };

    if (to && !asButton) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          to={to}
          className={cls}
          style={resolvedStyle}
          onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
          onMouseEnter={onMouseEnter as React.MouseEventHandler<HTMLAnchorElement>}
          onFocus={onFocus as React.FocusEventHandler<HTMLAnchorElement>}
          {...common}
          {...rest}
        >
          {inner}
        </Link>
      );
    }
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        onMouseEnter={onMouseEnter as React.MouseEventHandler<HTMLButtonElement>}
        onFocus={onFocus as React.FocusEventHandler<HTMLButtonElement>}
        className={cls}
        style={resolvedStyle}
        {...common}
        {...rest}
      >
        {inner}
      </button>
    );
  },
);
SidebarItem.displayName = "SidebarItem";

export default SidebarItem;
