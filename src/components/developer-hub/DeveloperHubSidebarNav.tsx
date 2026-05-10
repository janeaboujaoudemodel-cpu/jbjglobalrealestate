import { useLocation, useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, FolderKanban, Megaphone,
  PartyPopper, FileSignature, ListTodo, Users, BarChart3,
} from "lucide-react";

interface Props {
  collapsed: boolean;
  onNavigate: () => void;
}

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, path: "/developer-hub" },
  { label: "Company Registration", icon: Building2, path: "/developer-hub/company-registration" },
  { label: "Projects", icon: FolderKanban, path: "/developer-hub/projects" },
  { label: "Marketing Materials", icon: Megaphone, path: "/developer-hub/marketing-materials" },
  { label: "Launch Events", icon: PartyPopper, path: "/developer-hub/events" },
  { label: "Agreements", icon: FileSignature, path: "/developer-hub/agreements" },
  { label: "Tasks", icon: ListTodo, path: "/developer-hub/tasks" },
  { label: "CRM", icon: Users, path: "/developer-hub/crm" },
  { label: "Reports", icon: BarChart3, path: "/developer-hub/reports" },
];

export default function DeveloperHubSidebarNav({ collapsed, onNavigate }: Props) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <ScrollArea className="flex-1">
      <nav className="p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === "/developer-hub"
              ? location.pathname === "/developer-hub"
              : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onNavigate();
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                isActive
                  ? "bg-[#EFE6D6]/15 text-[#1A1A1A] font-semibold border-l-2 border-[#B89555]"
                  : "text-[#ECE2D2]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-[#1A1A1A]")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
