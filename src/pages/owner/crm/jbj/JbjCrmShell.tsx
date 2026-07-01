import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Globe,
  Grid3X3,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { JBJLogo } from "@/components/JBJLogo";
import { JBJ_CRM_MODULES, getJbjCrmPath } from "./jbjCrmConfig";
import "./jbjCrmShell.css";

export default function JbjCrmShell() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const staleKeys = [
      "jbj_crm_rail_collapsed_v1",
      "jbj_crm_rail_groups_v1",
      "jbj_crm_integration_toggles",
    ];
    try {
      staleKeys.forEach((key) => window.localStorage.removeItem(key));
      for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
        const key = window.localStorage.key(index);
        if (key?.startsWith("jbj_crm_mirror::")) window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore storage access errors; the shell itself remains stateless.
    }
  }, []);

  return (
    <div className={cn("jbj-crm-shell", collapsed && "is-collapsed")} data-jbj-crm-shell>
      <header className="jbj-crm-topbar" data-surface="champagne">
        <button type="button" className="jbj-crm-brand" onClick={() => navigate("/owner/crm/jbj")} aria-label="JBJ CRM Home">
          <JBJLogo variant="nobuffer" size="xs" className="jbj-crm-brand-logo" />
          <span className="jbj-crm-brand-wordmark">CRM</span>
        </button>

        <button type="button" className="jbj-crm-workspace-switcher">
          <span>JBJ CRM</span>
          <ChevronRight aria-hidden="true" />
        </button>

        <div className="jbj-crm-search" role="search">
          <Search aria-hidden="true" />
          <input aria-label="Search" placeholder="Search" />
        </div>

        <div className="jbj-crm-topbar-actions">
          <button type="button" className="jbj-crm-primary-action">
            <Plus aria-hidden="true" />
            <span>Create</span>
          </button>
          <Link className="jbj-crm-top-link" to="/owner/admin">Owner</Link>
          <Link className="jbj-crm-top-link" to="/">Return to Site</Link>
          <button type="button" className="jbj-crm-icon-button" aria-label="Marketplace"><Grid3X3 /></button>
          <button type="button" className="jbj-crm-icon-button" aria-label="Notifications"><Bell /></button>
          <button type="button" className="jbj-crm-icon-button" aria-label="Settings"><Settings /></button>
          <button type="button" className="jbj-crm-icon-button" aria-label="Help"><CircleHelp /></button>
          <button type="button" className="jbj-crm-user-button" aria-label="User">
            <UserRound />
          </button>
        </div>
      </header>

      <div className="jbj-crm-body">
        <aside className="jbj-crm-sidebar" aria-label="JBJ CRM navigation">
          <nav className="jbj-crm-nav">
            {JBJ_CRM_MODULES.map((module) => {
              const Icon = module.icon;
              return (
                <NavLink
                  key={module.id}
                  to={getJbjCrmPath(module)}
                  end={module.path === ""}
                  title={module.label}
                  className={({ isActive }) => cn("jbj-crm-nav-item", isActive && "is-active")}
                >
                  <Icon aria-hidden="true" />
                  <span>{module.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <footer className="jbj-crm-sidebar-footer">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="jbj-crm-collapse-button"
            >
              {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
              <span>{collapsed ? "Expand" : "Collapse"}</span>
            </button>
            <Link className="jbj-crm-footer-link" to="/owner/admin">
              <ChevronLeft aria-hidden="true" />
              <span>Owner</span>
            </Link>
            <Link className="jbj-crm-footer-link" to="/">
              <Globe aria-hidden="true" />
              <span>Return to Site</span>
            </Link>
          </footer>
        </aside>

        <main className="jbj-crm-main" data-surface="champagne">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
