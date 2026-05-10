import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  Settings, 
  BarChart3,
  MessageSquare,
  Shield,
  Calendar,
  CheckSquare,
  Map,
  ClipboardList,
  Mail,
  MessagesSquare,
  Bot,
  Crown,
  Sparkles,
  Zap,
  Video,
  Kanban,
  Megaphone,
  Eye,
  Headphones,
  Link,
  ShieldAlert,
  Brain,
  ChevronRight,
  Network,
  Flag,
  Star,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
  premium?: boolean;
  children?: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "CORE",
    items: [
      { label: "Overview", icon: LayoutDashboard, path: "/owner" },
      {
        label: "CRM",
        icon: Users,
        path: "/owner/crm",
        children: [
          {
            label: "Leads",
            icon: Users,
            path: "/owner/crm?entity=leads&view=all",
            children: [
              { label: "All Leads",     icon: Users,      path: "/owner/crm?entity=leads&view=all" },
              { label: "Flagged",       icon: Flag,       path: "/owner/crm?entity=leads&view=flagged" },
              { label: "VIP",           icon: Star,       path: "/owner/crm?entity=leads&view=vip" },
              { label: "Management",    icon: Briefcase,  path: "/owner/crm?entity=leads&view=management" },
              { label: "Tasks",         icon: CheckSquare,path: "/owner/crm?entity=leads&view=tasks" },
              { label: "Notes",         icon: FileText,   path: "/owner/crm?entity=leads&view=notes" },
              { label: "Inbox",         icon: Mail,       path: "/owner/crm?entity=leads&view=inbox" },
              { label: "Notifications", icon: Bot,        path: "/owner/crm?entity=leads&view=notifications" },
              { label: "Contracts",     icon: FileText,   path: "/owner/crm?entity=leads&view=contracts" },
              { label: "Campaigns",     icon: Megaphone,  path: "/owner/crm?entity=leads&view=campaigns" },
              { label: "Automation",    icon: Zap,        path: "/owner/crm?entity=leads&view=automation" },
            ],
          },
          { label: "Brokers",                       icon: UserCheck,  path: "/owner/crm?entity=brokers&view=directory" },
          { label: "Brokerage Agencies",            icon: Network,    path: "/owner/crm?entity=agencies&view=directory" },
          { label: "Developers",                    icon: Building2,  path: "/owner/crm?entity=developers&view=registry" },
          { label: "Developer Sales Representatives", icon: UserCheck, path: "/owner/crm?entity=sales-reps&view=directory" },
          { label: "Employees",                     icon: UserCheck,  path: "/owner/crm?entity=employees&view=roster" },
          { label: "Investors",                     icon: Crown,      path: "/owner/crm?entity=investors&view=directory" },
        ],
      },
    ],
  },
  {
    label: "PROPERTIES",
    items: [
      { label: "Properties", icon: Building2, path: "/owner/properties" },
      { label: "Property Map", icon: Map, path: "/owner/map" },
      { label: "Listings Admin", icon: ClipboardList, path: "/owner/listing-admin" },
      { label: "Developer Hub", icon: Building2, path: "/developer-portal" },
    ],
  },
  {
    label: "COMMUNICATION",
    items: [
      { label: "Messages / Inbox", icon: MessageSquare, path: "/owner/inbox" },
      { label: "Email Client", icon: Mail, path: "/owner/email-client" },
      { label: "Team Chat", icon: MessagesSquare, path: "/owner/team-chat" },
    ],
  },
  {
    label: "AI & TOOLS",
    items: [
      { label: "Founder Assistant", icon: MessageSquare, path: "/owner/founder-assistant" },
      { label: "Recommendations", icon: Sparkles, path: "/owner/recommendations" },
      { label: "JBJ Royal Tools Hub", icon: Crown, path: "/ai-hub", premium: true },
      { label: "Workflow Automation", icon: Zap, path: "/owner/automations" },
      { label: "Meeting Hub", icon: Video, path: "/meeting-center" },
      { label: "AI Meeting Summarizer", icon: Brain, path: "/ai-meeting-summarizer" },
    ],
  },
  {
    label: "CREATIVE",
    items: [
      { label: "Brand Assets", icon: Crown, path: "/owner/brand-assets" },
      { label: "Studio", icon: Video, path: "/owner/studio" },
      { label: "Founder & Podcast Control", icon: Users, path: "/owner/founder-settings" },
      { label: "Podcast Studio", icon: Headphones, path: "/owner/podcast-studio" },
      { label: "Kanban Board", icon: Kanban, path: "/owner/kanban" },
      { label: "Marketing Hub", icon: Megaphone, path: "/owner/marketing-hub" },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { label: "Admin Panel", icon: Shield, path: "/owner/admin" },
      { label: "Analytics", icon: BarChart3, path: "/owner/analytics" },
      { label: "Research Users", icon: Users, path: "/owner/research-users" },
      { label: "Documents", icon: FileText, path: "/owner/documents" },
      { label: "Forms & Agreements", icon: FileText, path: "/owner/documents/forms" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "External Access", icon: Shield, path: "/owner/external-access" },
      { label: "Audit", icon: Eye, path: "/owner/audit" },
      { label: "Integrations", icon: Link, path: "/owner/integrations" },
      { label: "Safety Panel", icon: ShieldAlert, path: "/owner/safety" },
      { label: "Settings", icon: Settings, path: "/owner/settings" },
    ],
  },
];

interface OwnerSidebarNavProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

export default function OwnerSidebarNav({ collapsed, onNavigate }: OwnerSidebarNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeRef = useRef<HTMLButtonElement | null>(null);

  const isActivePath = (path: string) => {
    const [pathOnly, query] = path.split("?");
    if (pathOnly === "/owner") {
      return (location.pathname === "/owner" || location.pathname === "/owner/") && !location.search;
    }
    if (query) {
      // Query-based CRM sub-pages: require pathname AND key params to match
      if (location.pathname !== pathOnly && !location.pathname.startsWith(pathOnly + "/")) return false;
      const want = new URLSearchParams(query);
      const have = new URLSearchParams(location.search);
      for (const [k, v] of want.entries()) {
        if (have.get(k) !== v) return false;
      }
      return true;
    }
    // Plain /owner/crm should only highlight when no CRM section is selected
    if (pathOnly === "/owner/crm") {
      return location.pathname.startsWith("/owner/crm") && !location.search;
    }
    return location.pathname.startsWith(pathOnly);
  };

  // Scroll the active nav item into view on route change without disturbing the page
  useEffect(() => {
    requestAnimationFrame(() => {
      activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, [location.pathname, location.search]);

  const setActiveRefCallback = useCallback(
    (path: string) => (el: HTMLButtonElement | null) => {
      if (isActivePath(path)) {
        activeRef.current = el;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.pathname, location.search]
  );

  const handleNavClick = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  // Track which parent items are expanded (auto-expand if a child is active)
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const isAnyChildActive = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some((c) => isActivePath(c.path) || isAnyChildActive(c));
  };
  const isOpen = (item: NavItem) => {
    if (openMap[item.path] !== undefined) return openMap[item.path];
    // Auto-expand when the parent itself is active or any descendant is active,
    // OR when the user is anywhere under that section (e.g. /owner/crm).
    if (isActivePath(item.path)) return true;
    if (isAnyChildActive(item)) return true;
    if (location.pathname.startsWith(item.path.split("?")[0])) return true;
    return false;
  };
  const toggleOpen = (path: string) => {
    setOpenMap((m) => ({ ...m, [path]: !(m[path] ?? true) }));
  };

  const renderItem = (item: NavItem, depth = 0): React.ReactNode => {
    const hasChildren = !!item.children?.length;
    const active = isActivePath(item.path);
    const expanded = hasChildren && isOpen(item);

    return (
      <div key={item.path}>
        <button
          ref={setActiveRefCallback(item.path)}
          data-no-contrast-guard
          onClick={() => {
            if (hasChildren && !collapsed) {
              // Navigate to first sensible target AND toggle
              if (!active && !isAnyChildActive(item)) handleNavClick(item.path);
              else toggleOpen(item.path);
            } else {
              handleNavClick(item.path);
            }
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-l-2 border-y border-r relative",
            active
              ? "bg-[#EFE6D6] !text-[#1A1A1A] border-l-[#B89555] border-y-[#B89555]/30 border-r-[#B89555]/30 font-semibold"
              : "bg-transparent !text-[#1A1A1A] border-transparent hover:bg-[#EFE6D6]/60 hover:border-l-[#B89555]/60 hover:!text-[#1A1A1A]",
            item.premium && !active && "bg-[#F7F2EA]/70 border-l-[#B89555]/40"
          )}
          style={depth > 0 ? { paddingLeft: `${12 + depth * 14}px` } : undefined}
          title={collapsed ? item.label : undefined}
        >
          <item.icon
            className={cn("w-4 h-4 flex-shrink-0", item.premium && !active && "drop-shadow-[0_0_4px_rgba(184,149,85,0.6)]")}
            style={{ color: '#1A1A1A' }}
          />
          {!collapsed && (
            <>
              <span className={cn("flex-1 text-left truncate", item.premium && "font-semibold")} style={{ color: '#1A1A1A' }}>
                {item.label}
              </span>
              {item.badge && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full font-semibold border",
                  active ? "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]" : "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/50"
                )}>
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <ChevronRight
                  className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform", expanded && "rotate-90")}
                  style={{ color: '#1A1A1A' }}
                  onClick={(e) => { e.stopPropagation(); toggleOpen(item.path); }}
                />
              )}
            </>
          )}
        </button>
        {hasChildren && expanded && !collapsed && (
          <div className="mt-0.5 space-y-0.5">
            {item.children!.map((c) => renderItem(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav data-no-contrast-guard className="p-2 space-y-4 overflow-y-auto flex-1 jj-scrollbar-gold">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A] font-bold px-3 mb-1.5">
              {section.label}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => renderItem(item))}
          </div>
        </div>
      ))}
    </nav>
  );
}
