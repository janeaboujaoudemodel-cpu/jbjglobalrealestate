import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Building2, ImageOff, Sparkles, Inbox, Briefcase, Calendar, FolderKanban, ListChecks } from "lucide-react";
import { IconTile } from "@/components/ui/icon-tile";

const navItems = [
  { to: "/developer-hub-admin", end: true, label: "Overview", icon: LayoutDashboard },
  { to: "/developer-hub-admin/directory", label: "Directory", icon: Building2 },
  { to: "/developer-hub-admin/missing-logos", label: "Missing Logos", icon: ImageOff },
  { to: "/developer-hub-admin/enrichment", label: "Site Rebuild", icon: Sparkles },
  { to: "/developer-hub-admin/briefings", label: "Briefings", icon: Inbox },
  { to: "/developer-hub-admin/deals", label: "Deals", icon: Briefcase },
  { to: "/developer-hub-admin/calendar", label: "Calendar", icon: Calendar },
  { to: "/developer-hub-admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/developer-hub-admin/approval", label: "Approval Queue", icon: ListChecks },
];

export default function DeveloperHubAdminShell() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      <div className="max-w-[1500px] mx-auto px-6 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">Owner Console</p>
            <h1 className="text-3xl font-semibold tracking-tight mt-1">Developer Hub</h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">
              Full control of every developer: directory, enrichment, briefings, deals, calendar.
            </p>
          </div>
        </header>

        <nav className="mb-6 flex flex-wrap gap-2 border-b border-[#B89555]/30 pb-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors border ${
                  isActive
                    ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A]"
                    : "bg-transparent border-transparent text-[#1A1A1A]/75 hover:bg-[#F7F2EA]"
                }`
              }
            >
              <IconTile icon={item.icon} tone="gold" size="sm" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
