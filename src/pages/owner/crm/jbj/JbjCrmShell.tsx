/**
 * JBJ CRM shell — dedicated Zoho-style workspace with left rail.
 * Renders only inside /owner/crm/jbj/*.
 */
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, ArrowLeft, Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { JBJ_CRM_MODULES, JBJ_CRM_GROUPS } from "./jbjCrmConfig";

const EMERALD_PILL: React.CSSProperties = {
  background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #043528 100%)",
  border: "1px solid #10B981",
  boxShadow: "inset 0 1px 0 rgba(110,231,183,0.55), inset 0 -1px 0 rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.35)",
  color: "#FFFFFF",
};

export default function JbjCrmShell() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const railW = collapsed ? 68 : 232;

  return (
    <div className="min-h-screen w-full bg-[#F7F2EA] flex">
      {/* Left rail */}
      <aside
        className="sticky top-[88px] self-start h-[calc(100vh-88px)] shrink-0 border-r border-[#E7DDC8] bg-white flex flex-col transition-[width]"
        style={{ width: railW }}
      >
        {/* Rail header */}
        <div className="px-3 pt-4 pb-3 border-b border-[#EFE6D6] flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-lg inline-flex items-center justify-center shrink-0 text-white font-bold text-[13px]"
            style={EMERALD_PILL}
          >
            JBJ
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#1A1A1A] leading-tight truncate">JBJ CRM</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#5A5346]">Enterprise</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto h-7 w-7 inline-flex items-center justify-center rounded-md text-[#5A5346] hover:bg-[#F7F2EA]"
            aria-label={collapsed ? "Expand rail" : "Collapse rail"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Rail body */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
          {JBJ_CRM_GROUPS.map((group) => (
            <div key={group}>
              {!collapsed && (
                <p className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A7F6A]">
                  {group}
                </p>
              )}
              <ul className="space-y-0.5">
                {JBJ_CRM_MODULES.filter((m) => m.group === group).map((m) => {
                  const Icon = m.icon;
                  const to = m.path === "" ? "/owner/crm/jbj" : `/owner/crm/jbj/${m.path}`;
                  return (
                    <li key={m.id}>
                      <NavLink
                        to={to}
                        end={m.path === ""}
                        title={m.label}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12.5px] font-medium transition-colors",
                            isActive
                              ? "text-white"
                              : "text-[#1A1A1A] hover:bg-[#F7F2EA]"
                          )
                        }
                        style={({ isActive }) => (isActive ? EMERALD_PILL : undefined)}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{m.label}</span>}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Rail footer — two 3D emerald pills */}
        <div className="p-2 border-t border-[#EFE6D6] space-y-1.5">
          <button
            onClick={() => navigate("/owner/admin")}
            title="Owner Panel"
            className="w-full inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-semibold justify-center"
            style={EMERALD_PILL}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {!collapsed && "Owner Panel"}
          </button>
          <button
            onClick={() => navigate("/")}
            title="Return to Site"
            className="w-full inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-semibold justify-center"
            style={EMERALD_PILL}
          >
            <Globe className="h-3.5 w-3.5" />
            {!collapsed && "Return to Site"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
