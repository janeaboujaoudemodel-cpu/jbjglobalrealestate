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
    <nav data-no-contrast-guard className="p-2 space-y-4 overflow-y-auto flex-1 jj-scrollbar-gold">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          {!collapsed && (
            <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/75 font-bold px-3 mb-1.5">
              {section.label}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <button
                key={item.path}
                ref={setActiveRefCallback(item.path)}
                onClick={() => handleNavClick(item.path)}
                data-no-contrast-guard
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border",
                  item.premium
                    ? isActivePath(item.path)
                      ? "bg-gradient-to-r from-[#B89555] to-[#A68444] !text-[#1A1A1A] border-[#B89555] shadow-[0_2px_14px_rgba(184,149,85,0.5)] font-semibold"
                      : "bg-[#F7F2EA] !text-[#1A1A1A] border-[#B89555]/40 hover:!bg-gradient-to-r hover:from-[#B89555]/30 hover:to-[#B89555]/15 hover:border-[#B89555] hover:!text-[#1A1A1A]"
                    : isActivePath(item.path)
                      ? "bg-gradient-to-r from-[#B89555] to-[#A68444] !text-[#1A1A1A] border-[#B89555] shadow-[0_2px_10px_rgba(184,149,85,0.4)] font-semibold"
                      : "!text-[#1A1A1A] border-transparent hover:!bg-gradient-to-r hover:from-[#B89555]/22 hover:to-[#B89555]/10 hover:border-[#B89555]/45 hover:!text-[#1A1A1A]"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", item.premium && !isActivePath(item.path) && "drop-shadow-[0_0_4px_rgba(184,149,85,0.6)]")} style={{ color: '#1A1A1A' }} />
                {!collapsed && (
                  <>
                    <span className={cn("flex-1 text-left truncate", item.premium && "font-semibold")} style={{ color: '#1A1A1A' }}>{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                        isActivePath(item.path) ? "bg-[#1A1A1A] text-[#B89555]" : "bg-[#B89555] text-[#1A1A1A]"
                      )}>
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
