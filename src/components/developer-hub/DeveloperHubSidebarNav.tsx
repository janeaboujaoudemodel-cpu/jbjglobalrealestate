import { useLocation, useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, FolderKanban, Plus, Megaphone,
  PartyPopper, FileSignature, ListTodo, Users, BarChart3, Activity,
} from "lucide-react";

interface Props {
  collapsed: boolean;
  onNavigate: () => void;
}

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, path: "/developer-hub" },
  { label: "Company Profile", icon: Building2, path: "/developer-hub/company-registration" },
  { label: "My Projects", icon: FolderKanban, path: "/developer-hub/projects" },
  { label: "Add Project", icon: Plus, path: "/developer-hub/new-project" },
  { label: "Marketing", icon: Megaphone, path: "/developer-hub/marketing-materials" },
  { label: "Launch Events", icon: PartyPopper, path: "/developer-hub/events" },
  { label: "Agreements", icon: FileSignature, path: "/developer-hub/agreements" },
  { label: "Tasks", icon: ListTodo, path: "/developer-hub/tasks" },
  { label: "CRM", icon: Users, path: "/developer-hub/crm" },
  { label: "Reports", icon: BarChart3, path: "/developer-hub/reports" },
  { label: "Activity", icon: Activity, path: "/developer-hub/activity" },
];

export default function DeveloperHubSidebarNav({ collapsed, onNavigate }: Props) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <ScrollArea className="flex-1">
      <nav className="p-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === "/developer-hub"
              ? location.pathname === "/developer-hub"
              : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onNavigate(); }}
              data-backend-nav-item
              data-emerald={isActive ? "true" : undefined}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left border",
                isActive
                  ? "jj-emerald-metallic allow-white text-white font-semibold border-transparent shadow-[0_10px_22px_-12px_rgba(6,78,59,0.85)]"
                  : "text-[#1A1A1A]/85 hover:text-[#064E3B] hover:bg-[#EFE6D6]/60 border-transparent hover:border-[#B89555]/40"
              )}
              title={collapsed ? item.label : undefined}
            >
              <span data-backend-sidebar-icon-tile data-surface="emerald" className="allow-white w-6 h-6 rounded-md flex items-center justify-center shrink-0 border border-white/15 bg-[image:var(--jj-emerald-ombre)] shadow-[0_8px_18px_-12px_rgba(6,78,59,0.75),inset_0_1px_0_rgba(255,255,255,0.18)]">
                <item.icon className="allow-white w-3.5 h-3.5 flex-shrink-0 text-white" strokeWidth={2.1} style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              </span>
              {!collapsed && <span className={cn("truncate", isActive ? "text-white" : "text-[#1A1A1A]")}>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
