/**
 * JBJ Design System primitives — Phase 1.A
 *
 * These primitives are the single source of truth for header controls,
 * sidebar items, and badges. They are additive in Phase 1.A: existing
 * callers are unchanged. Phase 1.B migrates HorizontalUtilityBar +
 * GlobalVerticalNav to use them; Phase 1.C migrates badges.
 *
 * Surface contract (locked):
 *   data-surface="emerald" | "dark"        → white text + white icons
 *   data-surface="champagne" | "pearl" | "light" → ink text + ink icons
 *
 * Do NOT fork these primitives. Add variants here instead.
 */
export { HeaderControl, HeaderSegmented } from "./HeaderControl";
export type { HeaderControlProps, HeaderSegmentedProps } from "./HeaderControl";
export { HeaderAvatar, JbjAvatar, NotificationBadge } from "./JbjAvatar";
export type { JbjAvatarProps, NotificationBadgeProps } from "./JbjAvatar";
export { SidebarItem } from "./SidebarItem";
export type { SidebarItemProps, SidebarItemLevel } from "./SidebarItem";
export { DsBadge } from "./DsBadge";
export type { DsBadgeProps } from "./DsBadge";
