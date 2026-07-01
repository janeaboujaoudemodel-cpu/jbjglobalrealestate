import { NavLink, useLocation } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { CRM_MODULES } from "./modules";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function CrmSidebar({ collapsed, onToggle }: Props) {
  const { pathname } = useLocation();
  const active = pathname.replace(/\/+$/, "").split("/").pop() || "home";

  return (
    <aside className="jc-rail" aria-label="CRM navigation">
      <button
        type="button"
        className="jc-rail__toggle"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>
      <nav>
        {CRM_MODULES.map((m) => {
          const Icon = m.icon;
          const isActive = active === m.slug || (m.slug === "home" && (active === "" || active === "crm"));
          return (
            <NavLink
              key={m.slug}
              to={m.slug === "home" ? "/owner/crm" : `/owner/crm/${m.slug}`}
              end={m.slug === "home"}
              data-active={isActive}
              data-tooltip={m.label}
              className="jc-nav-item"
            >
              <Icon size={16} strokeWidth={1.75} />
              <span className="jc-nav-item__label">{m.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
