import { NavLink, useLocation, Link } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, Briefcase, Database, ListChecks, Calendar, ListTodo,
  Handshake, BadgeDollarSign, FileText, FilePen, GraduationCap, Megaphone,
  Brain, Bell, Settings, ChevronLeft, ChevronRight, UserPlus, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: any };

const ITEMS: Item[] = [
  { to: "/broker/portal",        label: "Dashboard",          icon: LayoutDashboard },
  { to: "/broker/leads",         label: "My Leads",           icon: Users },
  { to: "/broker/crm",           label: "CRM Pipeline",       icon: Briefcase },
  { to: "/broker/databases",     label: "Assigned Databases", icon: Database },
  { to: "/broker/listings",      label: "Listings",           icon: ListChecks },
  { to: "/broker/calendar",      label: "Calendar",           icon: Calendar },
  { to: "/broker/tasks",         label: "Tasks",              icon: ListTodo },
  { to: "/broker/deals",         label: "Deals",              icon: Handshake },
  { to: "/broker/commissions",   label: "Commissions",        icon: BadgeDollarSign },
  { to: "/broker/documents",     label: "Documents",          icon: FileText },
  { to: "/broker/forms",         label: "Forms & Agreements", icon: FilePen },
  { to: "/broker/academy",       label: "JBJ Academy",        icon: GraduationCap },
  { to: "/broker/marketing",     label: "Marketing Toolkit",  icon: Megaphone },
  { to: "/broker/ai",            label: "AI Sales Assistant", icon: Brain },
  { to: "/broker/notifications", label: "Notifications",      icon: Bell },
  { to: "/broker/settings",      label: "Settings",           icon: Settings },
];

export default function BrokerPortalSidebar() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "shrink-0 sticky top-[88px] self-start h-[calc(100vh-88px)] hidden md:flex flex-col",
        "bg-[#F7F2EA] border-r border-[#B89555]/25 transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
      data-no-contrast-guard
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#B89555]/20">
        {!collapsed && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/55">
              JBJ GLOBAL REAL ESTATE
            </div>
            <div className="text-sm font-semibold text-[#1A1A1A] mt-0.5">Broker Portal</div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="h-7 w-7 grid place-items-center rounded-md border border-[#B89555]/30 text-[#1A1A1A]/70 hover:bg-[#EFE6D6]"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 pt-3 pb-2 space-y-1.5 border-b border-[#B89555]/15">
          <Link
            to="/broker/leads?action=new"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/45 hover:bg-[#E5D8BD] transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add Lead
          </Link>
          <Link
            to="/broker/databases?action=import"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/35 hover:bg-[#F7F2EA] transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import Database
          </Link>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active =
            to === "/broker/portal" ? pathname === to : pathname === to || pathname.startsWith(to + "/");
          return (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                "text-[#1A1A1A]/75 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/60",
                active && "bg-[#EFE6D6] text-[#1A1A1A] font-medium border border-[#B89555]/40",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
