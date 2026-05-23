/**
 * Canonical "My Account" shortcut list.
 * Single source of truth for the header profile dropdown (MegaMenuAccount)
 * AND the vertical sidebar's "My Account" section so they stay in lockstep.
 *
 * Keep order stable: My Dashboard first, then notifications/inbox/tasks,
 * then profile + favorites + tools, then secondary entries.
 */
import {
  LayoutDashboard,
  Bell,
  Inbox,
  ListChecks,
  User,
  Heart,
  Star,
  Sparkles,
  GitCompare,
  Calculator,
  BookMarked,
  CalendarClock,
  Eye,
  Settings,
  Ticket,
  type LucideIcon,
} from "lucide-react";

export interface AccountShortcut {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  /** Reserved for badge counts in MegaMenuAccount. */
  badgeKey?: "notifications" | "tasks";
  /** Show in the compact header dropdown. */
  inHeader?: boolean;
  /** Show in the sidebar "My Account" section. */
  inSidebar?: boolean;
}

export const ACCOUNT_SHORTCUTS: AccountShortcut[] = [
  { href: "/my-dashboard",                label: "My Dashboard",      icon: LayoutDashboard, description: "Your personalized dashboard",   inHeader: true, inSidebar: true },
  { href: "/my-dashboard#notifications",  label: "Notifications",     icon: Bell,             description: "Ticket & system alerts",        badgeKey: "notifications", inHeader: true, inSidebar: true },
  { href: "/my-dashboard#inbox",          label: "Inbox",             icon: Inbox,            description: "Messages from JBJ",             inHeader: true, inSidebar: true },
  { href: "/my-dashboard#tasks",          label: "My Tasks",          icon: ListChecks,       description: "View and manage your tasks",    badgeKey: "tasks", inHeader: true, inSidebar: true },
  { href: "/my-calendar",                 label: "My Calendar",       icon: CalendarClock,    description: "Calendar & notes",              inSidebar: true },
  { href: "/my-dashboard#activity",       label: "Activity Log",      icon: Eye,              description: "Recent activity",               inSidebar: true },
  { href: "/profile",                     label: "My Profile",        icon: User,             description: "View and edit your profile",    inHeader: true, inSidebar: true },
  { href: "/favorites",                   label: "Favorites / Shortlist", icon: Heart,        description: "Your saved & shortlisted properties", inHeader: true, inSidebar: true },
  { href: "/favorites?tab=shortlist",     label: "Shortlisted",       icon: Star,             inSidebar: true },
  { href: "/favorites?tab=saved-filters", label: "Saved Filters",     icon: Sparkles,         inSidebar: true },
  { href: "/compare",                     label: "Compare",           icon: GitCompare,       inSidebar: true },
  { href: "/toolkit",                     label: "AI Tools",          icon: Sparkles,         description: "Professional AI-powered tools", inHeader: true, inSidebar: true },
  { href: "/education-hub",               label: "Books Library",     icon: BookMarked,       inSidebar: true },
  { href: "/mortgage-calculator",         label: "Mortgage Calculator", icon: Calculator,     inSidebar: true },
  { href: "/profile?tab=settings",        label: "Settings",          icon: Settings,         inSidebar: true },
  { href: "/my-tickets",                  label: "My Tickets",        icon: Ticket,           inSidebar: true },
  { href: "/ticket-hub",                  label: "Ticket Hub",        icon: Ticket,           inSidebar: true },
];

export const ACCOUNT_SHORTCUTS_HEADER = ACCOUNT_SHORTCUTS.filter(s => s.inHeader);
export const ACCOUNT_SHORTCUTS_SIDEBAR = ACCOUNT_SHORTCUTS.filter(s => s.inSidebar);
