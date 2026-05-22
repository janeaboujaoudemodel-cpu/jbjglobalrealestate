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
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                isActive
                  ? "bg-[#EFE6D6] text-[#1A1A1A] font-semibold border border-[#B89555]/60"
                  : "text-[#1A1A1A]/75 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/60 border border-transparent"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
