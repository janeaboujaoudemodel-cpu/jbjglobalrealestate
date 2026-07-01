import { useEffect, useRef, useCallback, useMemo, useState } from "react";
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
  Phone,
  ImageOff,
  RefreshCw,
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
      { label: "Owner Panel", icon: Crown, path: "/owner/admin" },
      { label: "Overview", icon: LayoutDashboard, path: "/owner" },
      { label: "Document Studio", icon: FileText, path: "/owner/documents/forms" },
      {
        label: "CRM",
        icon: Users,
        path: "/owner/crm",
      },
      { label: "JBJ CRM", icon: Network, path: "/owner/crm/jbj" },
    ],
  },
  {
    label: "DEVELOPERS",
    items: [
      { label: "Developers Portal", icon: Building2, path: "/owner/developers" },
      { label: "Sales Reps", icon: Users, path: "/owner/developers/reps" },
      { label: "Briefings", icon: UserCheck, path: "/owner/developers/briefings" },
      { label: "Projects", icon: ClipboardList, path: "/owner/developers/projects" },
      { label: "Calendar", icon: Calendar, path: "/owner/developers/calendar" },
      { label: "Access Requests", icon: Shield, path: "/owner/developers/access-requests" },
      { label: "Profile Rebuild", icon: RefreshCw, path: "/owner/developers/profile-rebuild" },
      { label: "Missing Logos", icon: ImageOff, path: "/owner/developers/missing-logos" },
    ],
  },
  {
    label: "PROPERTIES",
    items: [
      { label: "Properties", icon: Building2, path: "/owner/properties" },
      { label: "Property Map", icon: Map, path: "/owner/map" },
      { label: "Listings Admin", icon: ClipboardList, path: "/owner/listing-admin" },
    ],
  },
  {
    label: "COMMUNICATION",
    items: [
      { label: "Messages / Inbox", icon: MessageSquare, path: "/owner/inbox" },
      { label: "Team Chat", icon: MessagesSquare, path: "/owner/team-chat" },
    ],
  },
  {
    label: "AI & TOOLS",
    items: [
      { label: "Founder Assistant", icon: MessageSquare, path: "/owner/founder-assistant" },
      { label: "Recommendations", icon: Sparkles, path: "/owner/recommendations" },
      { label: "AI Home Finder Leads", icon: Sparkles, path: "/owner/applications/ai-home-finder" },
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
      { label: "Voice Agent", icon: Phone, path: "/owner/voice-agent" },
      { label: "Kanban Board", icon: Kanban, path: "/owner/kanban" },
      { label: "Marketing Hub", icon: Megaphone, path: "/owner/marketing-hub" },
    ],
  },
  {
    label: "PEOPLE & HR",
    items: [
      {
        label: "Careers Portal",
        icon: Briefcase,
        path: "/owner/careers-portal",
      },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { label: "Analytics", icon: BarChart3, path: "/owner/analytics" },
      { label: "Users", icon: Users, path: "/owner/users" },
      { label: "Research Users", icon: Users, path: "/owner/research-users" },
      { label: "Preview Broker Portal", icon: Eye, path: "/broker/portal?preview=1" },
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

  const allNavItems = useMemo(() => {
    const list: NavItem[] = [];
    const walk = (items: NavItem[]) => {
      for (const item of items) {
        list.push(item);
        if (item.children?.length) walk(item.children);
      }
    };
    NAV_SECTIONS.forEach((section) => walk(section.items));
    return list;
  }, []);

  const matchesNavPath = useCallback((path: string) => {
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
      return location.pathname.startsWith("/owner/crm");
    }
    return location.pathname.startsWith(pathOnly);
  }, [location.pathname, location.search]);

  const activePath = useMemo(() => {
    const score = (path: string) => {
      const [pathOnly, query] = path.split("?");
      const queryBoost = query ? 10000 + Array.from(new URLSearchParams(query).keys()).length * 100 : 0;
      return pathOnly.length + queryBoost;
    };
    return allNavItems
      .filter((item) => matchesNavPath(item.path))
      .sort((a, b) => score(b.path) - score(a.path))[0]?.path ?? null;
  }, [allNavItems, matchesNavPath]);

  const isActivePath = useCallback((path: string) => activePath === path, [activePath]);

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
    // Auto-expand when the parent itself is the active route, or a descendant
    // matches the current route. Do NOT auto-expand just because the URL is
    // somewhere under the parent's pathname — keeps Leads collapsed on /owner/crm.
    if (isActivePath(item.path)) return true;
    if (isAnyChildActive(item)) return true;
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
          data-sidebar-owner-item
          data-surface={active ? "emerald" : "light"}
          data-emerald={active ? "true" : undefined}
          onClick={() => {
            // Always navigate to the parent's own path. Expansion is automatic
            // (parent is active or a child is active), and the chevron handles
            // explicit collapse — clicking the row never just collapses without
            // also navigating, so e.g. "CRM" always opens the CRM page.
            handleNavClick(item.path);
            if (hasChildren && !collapsed && !isOpen(item)) {
              setOpenMap((m) => ({ ...m, [item.path]: true }));
            }
          }}
          className={cn(
            "group w-full flex items-center gap-3.5 px-4 min-h-12 rounded-xl text-[16px] font-extrabold transition-all duration-200 border relative",
            active
              ? "jj-emerald-metallic allow-white !text-white border-transparent font-semibold shadow-[0_10px_22px_-12px_rgba(6,78,59,0.85)]"
              : "bg-transparent !text-[#1A1A1A] border-transparent hover:border-[#B89555]/50 hover:!text-[#064E3B] hover:bg-[#EFE6D6]/55",
          )}
          style={depth > 0 ? { paddingLeft: `${12 + depth * 14}px` } : undefined}
          title={collapsed ? item.label : undefined}
        >
          <span
            data-backend-sidebar-icon-tile
            data-surface="emerald"
            className={cn(
              "allow-white w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/15 bg-[image:var(--jj-emerald-ombre)] shadow-[0_8px_18px_-12px_rgba(6,78,59,0.75),inset_0_1px_0_rgba(255,255,255,0.18)]",
              item.premium && !active && "shadow-[0_8px_18px_-12px_rgba(6,78,59,0.75),0_0_8px_rgba(184,149,85,0.25),inset_0_1px_0_rgba(255,255,255,0.18)]"
            )}
          >
            <item.icon
              className="allow-white w-[13px] h-[13px] flex-shrink-0 text-white transition-colors duration-200"
              strokeWidth={2.25}
              style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
            />
          </span>
          {!collapsed && (
            <>
              <span
                data-jbj-allow-shrink
                className={cn(
                  "min-w-0 flex-1 text-left whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.16] transition-colors duration-200",
                  item.premium && "font-semibold",
                  active ? "text-white" : "text-[#1A1A1A] group-hover:text-[#064E3B]"
                )}
              >
                {item.label}
              </span>
              {item.badge && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-md font-semibold border",
                  active ? "bg-white/10 text-white border-white/60" : "bg-transparent text-[#1A1A1A] border-[#B89555]/50"
                )}>
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <ChevronRight
                  className={cn("w-4 h-4 flex-shrink-0 transition-transform", active ? "text-white" : "text-[#064E3B]", expanded && "rotate-90")}
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
    <nav data-no-contrast-guard data-surface="light" className="p-4 space-y-2 overflow-y-auto flex-1 jj-scrollbar-gold">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="mb-1.5 last:mb-0">
          {!collapsed && (
            <p className="text-[12px] uppercase tracking-[0.2em] text-[#1A1A1A] font-black px-4 mb-2.5">
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
