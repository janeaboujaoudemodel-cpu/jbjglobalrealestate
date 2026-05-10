/**
 * Canonical shortcuts configuration — single source of truth
 * Consumed by GlobalVerticalNav, GlobalHeader, GlobalSearchModal
 */
import {
  Heart, Star, ListChecks, Bell, Zap, CalendarClock, BookMarked, Eye,
  Users, Mail, NotebookPen, BellRing, SmilePlus,
  Shield, Lock, FolderOpen, MessagesSquare, Palette, FileText, Megaphone, Workflow, MailOpen, Layers,
  Sparkles, Bot, Home, Pen, Calculator, Share2, Languages, FileSearch, Phone, MessageSquare, Video, BarChart3,
  LayoutDashboard, TrendingUp,
  FilePlus, ClipboardCheck, DollarSign,
  Database, Presentation, QrCode, Monitor, PenTool,
  CreditCard, Stamp, Image,
  User, Settings, Ticket,
  Building2, Briefcase, Crown, Key, Package, Boxes, Cog,
  GitCompare, SlidersHorizontal, Search,
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
    label: "My Tasks",
    colorBorder: "border-l-emerald-500",
    colorText: "text-emerald-700",
    colorBg: "bg-emerald-50",
    visibility: ['authenticated'],
    items: [
      { label: 'My Tasks', icon: ListChecks, href: '/my-dashboard#tasks' },
      { label: 'Notifications', icon: Bell, href: '/my-dashboard#notifications' },
      { label: 'Alerts', icon: Zap, href: '/my-dashboard#alerts' },
      { label: 'Calendar', icon: CalendarClock, href: '/ai-calendar' },
      { label: 'Books', icon: BookMarked, href: '/education-hub' },
      { label: 'Favorites', icon: Heart, href: '/favorites' },
      { label: 'Shortlisted', icon: Star, href: '/favorites?tab=shortlist' },
      { label: 'Saved Filters', icon: SlidersHorizontal, href: '/favorites?tab=saved-filters' },
      { label: 'Compare', icon: GitCompare, href: '/compare' },
      { label: 'Activity Log', icon: Eye, href: '/my-dashboard#activity' },
    ],
  },
  {
    label: "Quick Access",
    colorBorder: "border-l-indigo-500",
    colorText: "text-indigo-700",
    colorBg: "bg-indigo-50",
    visibility: ['public'],
    items: [
      { label: 'AI Home Finder', icon: Home, href: '/quiz' },
      { label: 'Properties', icon: Building2, href: '/properties' },
      { label: 'Favorites', icon: Heart, href: '/favorites' },
      { label: 'Shortlist', icon: Star, href: '/favorites?tab=shortlist' },
      { label: 'Compare', icon: GitCompare, href: '/compare' },
      { label: 'Mortgage Calculator', icon: Calculator, href: '/mortgage-calculator' },
      { label: 'Search', icon: Search, href: '/properties' },
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
      { label: 'Leads Inbox', icon: Mail, href: '/owner/crm/leads' },
      { label: 'CRM Tasks', icon: ListChecks, href: '/owner/crm/tasks' },
      { label: 'CRM Calendar', icon: CalendarClock, href: '/owner/crm/calendar' },
      { label: 'CRM Notes', icon: NotebookPen, href: '/owner/crm/notes' },
      { label: 'CRM Reminders', icon: BellRing, href: '/owner/crm/reminders' },
      { label: 'Agency Activity Log', icon: Bell, href: '/owner/crm/relationships/activity' },
      { label: 'Employees', icon: Users, href: '/owner/crm/employees' },
      { label: 'Customer Happiness', icon: SmilePlus, href: '/admin?tab=customer-happiness' },
    ],
  },
  {
    label: "Owner Command Center",
    colorBorder: "border-l-[#B89555]",
    colorText: "text-[#B89555]",
    colorBg: "bg-[#EFE6D6]/5",
    visibility: ['owner'],
    items: [
      { label: 'Owner Dashboard', icon: Shield, href: '/owner' },
      { label: 'Admin Panel', icon: Lock, href: '/admin' },
      { label: 'Inbox Inquiries', icon: Mail, href: '/owner/inbox' },
      { label: 'Listing Admin', icon: FolderOpen, href: '/listing-admin' },
      { label: 'Team Chat', icon: MessagesSquare, href: '/owner/team-chat' },
      { label: 'Studio', icon: Palette, href: '/owner/studio' },
      { label: 'Documents', icon: FileText, href: '/owner/documents' },
      { label: 'Contract Vault', icon: FileText, href: '/owner/contracts' },
      { label: 'Agenda', icon: CalendarClock, href: '/owner/agenda' },
      { label: 'Marketing Hub', icon: Megaphone, href: '/owner/marketing-hub' },
      { label: 'Automations', icon: Workflow, href: '/owner/automations' },
      { label: 'Kanban Board', icon: Layers, href: '/owner/kanban' },
      { label: 'Email Client', icon: MailOpen, href: '/owner/email-client' },
    ],
  },
  {
    label: "AI & Tools",
    colorBorder: "border-l-purple-500",
    colorText: "text-purple-700",
    colorBg: "bg-purple-50",
    visibility: ['authenticated'],
    items: [
      { label: 'AI Tools Hub', icon: Sparkles, href: '/ai-hub' },
      { label: 'AI Calendar & Notes', icon: CalendarClock, href: '/ai-calendar' },
      { label: 'My Assistant', icon: Bot, href: '/founder-assistant' },
      { label: 'AI History', icon: Bot, href: '/my-ai-history' },
      { label: 'AI Home Finder', icon: Home, href: '/quiz' },
      { label: 'Description Writer', icon: Pen, href: '/ai-description-writer' },
      { label: 'Email Generator', icon: Mail, href: '/ai-email-generator' },
      { label: 'Property Analyzer', icon: BarChart3, href: '/ai-property-analyzer' },
      { label: 'ROI Calculator', icon: Calculator, href: '/ai-roi-calculator' },
      { label: 'Social Media', icon: Share2, href: '/ai-social-media' },
      { label: 'Translation Hub', icon: Languages, href: '/ai-translation-hub' },
      { label: 'Market Report', icon: FileSearch, href: '/ai-market-report' },
      { label: 'Call Summarizer', icon: Phone, href: '/ai-call-summarizer' },
      { label: 'Objection Handler', icon: MessageSquare, href: '/ai-objection-handler' },
      { label: 'Video Tour Script', icon: Video, href: '/toolkit/video-suite' },
    ],
  },
  {
    label: "Dashboards",
    colorBorder: "border-l-rose-500",
    colorText: "text-rose-700",
    colorBg: "bg-rose-50",
    visibility: ['authenticated'],
    items: [
      { label: 'My Dashboard', icon: LayoutDashboard, href: '/my-dashboard' },
      { label: 'Broker Dashboard', icon: Briefcase, href: '/broker-dashboard' },
      { label: 'Investor Hub', icon: TrendingUp, href: '/investor-hub' },
      { label: 'JBJ Analytics', icon: BarChart3, href: '/owner/analytics' },
    ],
  },
  {
    label: "Listings",
    colorBorder: "border-l-sky-500",
    colorText: "text-sky-700",
    colorBg: "bg-sky-50",
    visibility: ['authenticated'],
    items: [
      { label: 'Submit Listing', icon: FilePlus, href: '/listing-portal' },
      { label: 'My Listings', icon: ClipboardCheck, href: '/listing-portal/my-listings' },
      { label: 'Listing Admin', icon: FolderOpen, href: '/listing-admin' },
      { label: 'Property Evaluator', icon: Calculator, href: '/property-evaluator' },
      { label: 'Rental Index', icon: DollarSign, href: '/rental-index' },
    ],
  },
  {
    label: "Productivity",
    colorBorder: "border-l-cyan-500",
    colorText: "text-cyan-700",
    colorBg: "bg-cyan-50",
    visibility: ['authenticated'],
    items: [
      { label: 'Spreadsheet', icon: Database, href: '/toolkit/spreadsheet' },
      { label: 'Presentations', icon: Presentation, href: '/toolkit/presentations' },
      { label: 'QR Generator', icon: QrCode, href: '/toolkit/qr-generator' },
      { label: 'Documents', icon: FileText, href: '/toolkit/documents' },
      { label: 'Meeting Center', icon: Monitor, href: '/toolkit/meeting-center' },
      { label: 'Whiteboard', icon: PenTool, href: '/toolkit/whiteboard' },
    ],
  },
  {
    label: "Creative & Marketing",
    colorBorder: "border-l-amber-500",
    colorText: "text-amber-700",
    colorBg: "bg-amber-50",
    visibility: ['authenticated'],
    items: [
      { label: 'Video Builder', icon: Video, href: '/toolkit/video-builder' },
      { label: 'Business Card', icon: CreditCard, href: '/toolkit/business-card' },
      { label: 'Logo Maker', icon: Palette, href: '/toolkit/logo-maker' },
      { label: 'Stamp Generator', icon: Stamp, href: '/toolkit/stamp-generator' },
      { label: 'Image Resize', icon: Image, href: '/toolkit/image-resize' },
      { label: 'Brochure Generator', icon: FileText, href: '/toolkit/brochure-generator' },
    ],
  },
  {
    label: "Account",
    colorBorder: "border-l-zinc-400",
    colorText: "text-[#1A1A1A]/70",
    colorBg: "bg-[#F7F2EA]",
    visibility: ['authenticated'],
    items: [
      { label: 'My Profile', icon: User, href: '/profile' },
      { label: 'Settings', icon: Settings, href: '/profile?tab=settings' },
      { label: 'Favorites', icon: Heart, href: '/favorites' },
      { label: 'Shortlist', icon: Star, href: '/favorites?tab=shortlist' },
      { label: 'Compare', icon: GitCompare, href: '/compare' },
      { label: 'Support Tickets', icon: Ticket, href: '/my-tickets' },
    ],
  },
];

/**
 * Filter shortcut groups by user role context
 */
export function filterShortcutGroups(groups: ShortcutGroup[], opts: {
  isAuthenticated: boolean;
  isOwner: boolean;
  isBroker: boolean;
  isInvestor: boolean;
  isDeveloperMode?: boolean;
}): ShortcutGroup[] {
  return groups.filter((group) => {
    // In developer mode, hide owner-only groups
    if (opts.isDeveloperMode && group.visibility.includes('owner') && !group.visibility.includes('authenticated')) {
      return false;
    }
    // Public groups are always visible
    if (group.visibility.includes('public')) return true;
    // Auth-only groups need authentication
    if (group.visibility.includes('authenticated') && opts.isAuthenticated) return true;
    // Owner-only — hide in developer mode
    if (group.visibility.includes('owner') && opts.isOwner && !opts.isDeveloperMode) return true;
    // Broker-only
    if (group.visibility.includes('broker') && (opts.isBroker || opts.isOwner)) return true;
    // Investor-only
    if (group.visibility.includes('investor') && (opts.isInvestor || opts.isOwner)) return true;
    return false;
  }).map((group) => {
    // Filter items within groups
    let items = [...group.items];
    if (opts.isInvestor && !opts.isBroker && !opts.isOwner) {
      items = items.filter(i => i.label !== 'Broker Dashboard');
    }
    // For investor dashboards, customize
    if (group.label === "Dashboards" && opts.isInvestor && !opts.isOwner) {
      items = items.filter(i => i.label !== 'JBJ Analytics');
    }
    // In developer mode, hide Listing Admin from listings group
    if (opts.isDeveloperMode && group.label === "Listings") {
      items = items.filter(i => i.label !== 'Listing Admin');
    }
    return { ...group, items };
  }).filter(g => g.items.length > 0);
}
