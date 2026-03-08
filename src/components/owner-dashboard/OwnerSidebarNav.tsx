import { useEffect, useRef, useCallback } from "react";
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
  Sparkles,
  Zap,
  Video,
  Kanban,
  Megaphone,
  Eye,
  Headphones,
  Link,
  ShieldAlert,
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
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "CORE",
    items: [
      { label: "Overview", icon: LayoutDashboard, path: "/owner" },
      { label: "Leads & CRM", icon: Users, path: "/owner/crm" },
      { label: "Tasks", icon: CheckSquare, path: "/owner/crm/tasks" },
      { label: "Calendar", icon: Calendar, path: "/owner/crm/calendar" },
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
      { label: "Email Client", icon: Mail, path: "/owner/email-client" },
      { label: "Team Chat", icon: MessagesSquare, path: "/owner/team-chat" },
    ],
  },
  {
    label: "AI & TOOLS",
    items: [
      { label: "Founder Assistant", icon: MessageSquare, path: "/owner/founder-assistant" },
      { label: "Recommendations", icon: Sparkles, path: "/owner/recommendations" },
      { label: "AI Tools Hub", icon: Sparkles, path: "/owner/toolkit" },
      { label: "Workflow Automation", icon: Zap, path: "/owner/automations" },
      { label: "Meeting Hub", icon: Video, path: "/meeting-center" },
    ],
  },
  {
    label: "CREATIVE",
    items: [
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
    ],
  },
  {
    label: "SYSTEM",
    items: [
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
    if (path === "/owner") {
      return location.pathname === "/owner" || location.pathname === "/owner/";
    }
    return location.pathname.startsWith(path);
  };

  // Scroll the active nav item into view on route change without disturbing the page
  useEffect(() => {
    requestAnimationFrame(() => {
      activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, [location.pathname]);

  const setActiveRefCallback = useCallback(
    (path: string) => (el: HTMLButtonElement | null) => {
      if (isActivePath(path)) {
        activeRef.current = el;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.pathname]
  );

  const handleNavClick = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <nav className="p-2 space-y-4 overflow-y-auto flex-1 jj-scrollbar-gold">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-widest text-[#C9A84C] font-semibold px-3 mb-1.5">
              {section.label}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <button
                key={item.path}
                ref={setActiveRefCallback(item.path)}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                  isActivePath(item.path)
                    ? "bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20"
                    : "text-zinc-700 hover:text-black hover:bg-[#C9A84C]/10"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge && (
                      <span className="bg-[#C9A84C]/20 text-[#C9A84C] text-xs px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
