import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Database, Users, Calendar, Inbox, ListTodo,
  StickyNote, Building2, GraduationCap, LogOut, Settings,
} from "lucide-react";

const NAV = [
  { to: "/broker/crm", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/broker/crm/databases", label: "Databases", icon: Database },
  { to: "/broker/crm/leads", label: "Leads", icon: Users },
  { to: "/broker/crm/calendar", label: "Calendar", icon: Calendar },
  { to: "/broker/crm/inbox", label: "Inbox", icon: Inbox },
  { to: "/broker/crm/tasks", label: "Tasks", icon: ListTodo },
  { to: "/broker/crm/notes", label: "Notes", icon: StickyNote },
  { to: "/broker/crm/projects", label: "Projects", icon: Building2 },
  { to: "/broker/training", label: "Training", icon: GraduationCap },
];

export default function BrokerWorkspaceShell() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 h-[88px] bg-[#FDFBF7] border-b border-[#B89555]/20 z-40 flex items-center px-6">
        <div className="flex items-center gap-3 w-[260px]">
          <div className="w-9 h-9 rounded-md bg-[#1A1A1A] text-[#F7F2EA] flex items-center justify-center font-serif text-sm">J</div>
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">JBJ Global Real Estate</div>
            <div className="text-sm font-semibold">Broker Workspace</div>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[#1A1A1A]/70 max-w-[200px] truncate">{user?.email}</span>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#B89555]/30 bg-[#EFE6D6]/40 hover:bg-[#EFE6D6] transition"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed top-[88px] left-0 bottom-0 w-[260px] bg-[#F7F2EA] border-r border-[#B89555]/20 z-30 overflow-y-auto">
        <nav className="p-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end as any}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition select-none ${
                  isActive
                    ? "bg-[#EFE6D6] text-[#1A1A1A] font-medium border border-[#B89555]/30"
                    : "text-[#1A1A1A]/75 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/50 border border-transparent"
                }`
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
          <div className="pt-3 mt-3 border-t border-[#B89555]/15">
            <NavLink
              to="/broker/crm/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                  isActive ? "bg-[#EFE6D6]" : "text-[#1A1A1A]/70 hover:bg-[#EFE6D6]/50"
                }`
              }
            >
              <Settings className="h-4 w-4" /> Settings
            </NavLink>
          </div>
        </nav>
      </aside>

      {/* Content */}
      <main className="pt-[88px] pl-[260px] min-h-screen">
        <div className="p-6 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
