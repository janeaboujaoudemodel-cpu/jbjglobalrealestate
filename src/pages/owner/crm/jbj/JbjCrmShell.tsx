/**
 * JBJ CRM Enterprise shell — dedicated Zoho-parity workspace.
 *
 * Layout mirrors Zoho CRM's UX exactly:
 *   - Top bar: brand + module tabs + global search + create + notifications + user
 *   - Left rail: grouped accordions (Zoho style), 240px expanded / 56px collapsed
 *   - Rail FOOTER (bottom): [Collapse ⟷] then [Owner Panel] + [Return to Site] pills
 *   - Main: full remaining viewport
 *
 * Mounted OUTSIDE OwnerDashboardShell so only ONE sidebar renders.
 * All accents use emerald metallic + white ink (never Tailwind's raw emerald-500/600/700).
 */
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  PanelLeftClose, PanelLeftOpen, ArrowLeft, Globe, Search, Plus, Bell,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { JBJ_CRM_MODULES, JBJ_CRM_GROUPS } from "./jbjCrmConfig";

const EMERALD_METAL: React.CSSProperties = {
  background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #043528 100%)",
  border: "1px solid #10B981",
  boxShadow:
    "inset 0 1px 0 rgba(110,231,183,0.55), inset 0 -1px 0 rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.35)",
  color: "#FFFFFF",
};

const EMERALD_DARK: React.CSSProperties = {
  background: "linear-gradient(180deg, #043528 0%, #021712 100%)",
  color: "#FFFFFF",
};

const RAIL_EXPANDED = 240;
const RAIL_COLLAPSED = 56;
const TOPBAR_H = 52;

const GROUP_KEY = "jbj_crm_rail_groups_v1";
const COLLAPSE_KEY = "jbj_crm_rail_collapsed_v1";

function loadGroupState(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(GROUP_KEY) || "{}"); } catch { return {}; }
}

export default function JbjCrmShell() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<boolean>(() => localStorage.getItem(COLLAPSE_KEY) === "1");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(loadGroupState);

  useEffect(() => { localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0"); }, [collapsed]);
  useEffect(() => { localStorage.setItem(GROUP_KEY, JSON.stringify(openGroups)); }, [openGroups]);

  const railW = collapsed ? RAIL_COLLAPSED : RAIL_EXPANDED;

  const groups = useMemo(() => JBJ_CRM_GROUPS, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#F7F2EA] overflow-hidden">
      {/* ── Top bar (Zoho parity) ───────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center gap-3 px-4 border-b border-[#0A2A20]/30"
        style={{ ...EMERALD_DARK, height: TOPBAR_H }}
      >
        <button
          onClick={() => navigate("/owner/crm/jbj")}
          className="flex items-center gap-2 text-white"
        >
          <span
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[12px] font-bold"
            style={EMERALD_METAL}
          >
            JBJ
          </span>
          <span className="text-[13.5px] font-semibold tracking-wide">
            JBJ CRM <span className="opacity-70 font-normal">Enterprise</span>
          </span>
        </button>

        {/* Global search */}
        <div className="ml-6 relative hidden md:block flex-1 max-w-[520px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
          <input
            placeholder="Search across JBJ CRM…"
            className="w-full pl-9 pr-3 h-8 rounded-md text-[12.5px] text-white placeholder-white/60 bg-white/10 border border-white/15 outline-none focus:bg-white/15 focus:border-white/30"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md text-[12px] font-semibold"
            style={EMERALD_METAL}
          >
            <Plus className="h-3.5 w-3.5" /> Create
          </button>
          <button className="h-8 w-8 inline-flex items-center justify-center rounded-md text-white/85 hover:bg-white/10">
            <Bell className="h-4 w-4" />
          </button>
          <div
            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-[11px] font-bold"
            style={EMERALD_METAL}
            title="You"
          >
            JB
          </div>
        </div>
      </header>

      {/* ── Body: rail + main ───────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">
        <aside
          className="shrink-0 border-r border-[#E7DDC8] bg-white flex flex-col transition-[width] duration-150"
          style={{ width: railW }}
        >
          {/* Rail nav — Zoho style groups */}
          <nav className="flex-1 overflow-y-auto py-2 px-1.5">
            {groups.map((group) => {
              const items = JBJ_CRM_MODULES.filter((m) => m.group === group);
              const isOpen = openGroups[group] !== false; // default open
              return (
                <div key={group} className="mb-1.5">
                  {!collapsed && (
                    <button
                      onClick={() => setOpenGroups((s) => ({ ...s, [group]: !isOpen }))}
                      className="w-full flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A7F6A] hover:text-[#1A1A1A]"
                    >
                      {isOpen
                        ? <ChevronDown className="h-3 w-3" />
                        : <ChevronRight className="h-3 w-3" />}
                      <span>{group}</span>
                    </button>
                  )}
                  {(collapsed || isOpen) && (
                    <ul className="space-y-0.5">
                      {items.map((m) => {
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
                                  "group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[12.5px] font-medium transition-colors",
                                  collapsed && "justify-center",
                                  isActive
                                    ? "text-white"
                                    : "text-[#1A1A1A] hover:bg-[#F7F2EA]"
                                )
                              }
                              style={({ isActive }) => (isActive ? EMERALD_METAL : undefined)}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              {!collapsed && <span className="truncate">{m.label}</span>}
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Rail footer — collapse button on top, then two 3D emerald pills */}
          <div className="border-t border-[#EFE6D6] p-2 space-y-1.5">
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand rail" : "Collapse rail"}
              className={cn(
                "w-full inline-flex items-center gap-2 h-8 rounded-md text-[12px] font-semibold text-[#1A1A1A] bg-[#F7F2EA] border border-[#E7DDC8] hover:bg-[#EFE6D6]",
                collapsed ? "justify-center px-0" : "justify-center px-2"
              )}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              {!collapsed && <span>Collapse</span>}
            </button>

            <button
              onClick={() => navigate("/owner/admin")}
              title="Owner Panel"
              className={cn(
                "w-full inline-flex items-center gap-2 h-9 rounded-md text-[12px] font-semibold",
                collapsed ? "justify-center px-0" : "justify-center px-2"
              )}
              style={EMERALD_METAL}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {!collapsed && <span>Owner Panel</span>}
            </button>
            <button
              onClick={() => navigate("/")}
              title="Return to Site"
              className={cn(
                "w-full inline-flex items-center gap-2 h-9 rounded-md text-[12px] font-semibold",
                collapsed ? "justify-center px-0" : "justify-center px-2"
              )}
              style={EMERALD_METAL}
            >
              <Globe className="h-3.5 w-3.5" />
              {!collapsed && <span>Return to Site</span>}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[#F7F2EA]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
