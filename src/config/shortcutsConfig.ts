/**
 * Canonical shortcuts configuration — single source of truth
 * Consumed by GlobalVerticalNav, GlobalHeader, GlobalSearchModal
 */
import {
  Heart, Star, ListChecks, Bell, CalendarClock, BookMarked, Eye,
  Users, Mail,
  Home, Settings,
  LayoutDashboard,
  GitCompare, SlidersHorizontal,
  Inbox,
} from "lucide-react";

export type ShortcutVisibility = 'public' | 'authenticated' | 'owner' | 'broker' | 'investor';

export interface ShortcutItem {
  label: string;
  href: string;
  icon: any;
}

export interface ShortcutGroup {
  label: string;
  colorBorder: string;
  colorText: string;
  colorBg: string;
  /** Which roles can see this group. 'public' = everyone */
  visibility: ShortcutVisibility[];
  items: ShortcutItem[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: "Quick Access",
    colorBorder: "border-l-emerald-500",
    colorText: "text-[color:var(--emerald-1)]",
    colorBg: "jj-emerald-soft",
    visibility: ['authenticated'],
    items: [
      { label: 'My Tasks', icon: ListChecks, href: '/my-dashboard#tasks' },
      { label: 'Notifications', icon: Bell, href: '/my-dashboard#notifications' },
      { label: 'Inbox', icon: Inbox, href: '/my-dashboard#inbox' },
      { label: 'My Calendar', icon: CalendarClock, href: '/ai-calendar' },
      { label: 'Books', icon: BookMarked, href: '/education-hub' },
      { label: 'Favorites', icon: Heart, href: '/favorites' },
      { label: 'Shortlisted', icon: Star, href: '/favorites?tab=shortlist' },
      { label: 'Saved Filters', icon: SlidersHorizontal, href: '/favorites?tab=saved-filters' },
      { label: 'Compare', icon: GitCompare, href: '/compare' },
      { label: 'Activity Log', icon: Eye, href: '/my-dashboard#activity' },
      { label: 'AI Home Finder', icon: Home, href: '/ai-home-finder' },
    ],
  },
  {
    label: "CRM",
    colorBorder: "border-l-blue-500",
    colorText: "text-blue-700",
    colorBg: "bg-blue-50",
    visibility: ['owner', 'broker'],
    items: [
      { label: 'CRM Dashboard', icon: Users, href: '/crm' },
    ],
  },
  {
    label: "Dashboard",
    colorBorder: "border-l-rose-500",
    colorText: "text-rose-700",
    colorBg: "bg-rose-50",
    visibility: ['authenticated'],
    items: [
      // href rewritten by filterShortcutGroups based on mode
      { label: 'My Dashboard', icon: LayoutDashboard, href: '/my-dashboard' },
    ],
  },
  {
    label: "Settings",
    colorBorder: "border-l-zinc-400",
    colorText: "text-[#1A1A1A]/70",
    colorBg: "bg-[#F7F2EA]",
    visibility: ['authenticated'],
    items: [
      { label: 'Settings', icon: Settings, href: '/profile?tab=settings' },
    ],
  },
];

export type DashboardMode = 'owner' | 'broker' | 'investor' | 'developer' | null | undefined;

export function getDashboardHref(opts: { isOwner?: boolean; mode?: DashboardMode }): string {
  if (opts.isOwner && opts.mode === 'owner') return '/owner';
  switch (opts.mode) {
    case 'broker': return '/broker-dashboard';
    case 'investor': return '/investor-dashboard';
    case 'developer': return '/developers-portal';
    default: return '/my-dashboard';
  }
}

export function getInboxHref(opts: { isOwner?: boolean; mode?: DashboardMode }): string {
  return opts.isOwner && opts.mode === 'owner' ? '/owner/inbox' : '/my-dashboard#inbox';
}

/**
 * Filter shortcut groups by user role context
 */
export function filterShortcutGroups(groups: ShortcutGroup[], opts: {
  isAuthenticated: boolean;
  isOwner: boolean;
  isBroker: boolean;
  isInvestor: boolean;
  isDeveloperMode?: boolean;
  mode?: DashboardMode;
}): ShortcutGroup[] {
  return groups.filter((group) => {
    if (group.visibility.includes('public')) return true;
    if (group.visibility.includes('authenticated') && opts.isAuthenticated) return true;
    if (group.visibility.includes('owner') && opts.isOwner && opts.mode === 'owner') return true;
    if (group.visibility.includes('broker') && (opts.mode === 'broker' || (!opts.isOwner && opts.isBroker))) return true;
    if (group.visibility.includes('investor') && (opts.mode === 'investor' || (!opts.isOwner && opts.isInvestor))) return true;
    return false;
  }).map((group) => {
    const items = group.items.map((item) => {
      if (item.label === 'My Dashboard') {
        return { ...item, href: getDashboardHref({ isOwner: opts.isOwner, mode: opts.mode }) };
      }
      if (item.label === 'Inbox') {
        return { ...item, href: getInboxHref({ isOwner: opts.isOwner, mode: opts.mode }) };
      }
      return item;
    });
    return { ...group, items };
  }).filter(g => g.items.length > 0);
}
