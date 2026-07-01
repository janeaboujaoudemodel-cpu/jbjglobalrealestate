import { NavLink, Link, useLocation } from "react-router-dom";
import { Search, Plus, Bell, MessageSquare, Calendar, Settings, ChevronDown } from "lucide-react";
import { CRM_MODULES } from "./modules";

// Pinned header tabs — Zoho pins these top-level modules; the rest live under "More".
const PINNED = ["home", "leads", "contacts", "accounts", "deals", "tasks", "meetings", "reports", "analytics"];

export default function CrmHeader() {
  const { pathname } = useLocation();
  const active = pathname.replace(/\/+$/, "").split("/").pop() || "home";
  const tabs = CRM_MODULES.filter((m) => PINNED.includes(m.slug));

  return (
    <header className="jc-header">
      <div className="jc-header__brand" aria-label="JBJ Global Real Estate">
        <div className="jc-header__brand-mark">JBJ</div>
        <div className="jc-header__brand-text">CRM</div>
      </div>

      <nav className="jc-header__tabs" aria-label="Primary modules">
        {tabs.map((m) => {
          const isActive = active === m.slug || (m.slug === "home" && (active === "" || active === "crm"));
          return (
            <NavLink
              key={m.slug}
              to={m.slug === "home" ? "/owner/crm" : `/owner/crm/${m.slug}`}
              end={m.slug === "home"}
              className="jc-tab"
              data-active={isActive}
            >
              {m.label}
            </NavLink>
          );
        })}
        <button type="button" className="jc-tab__overflow" aria-label="More modules">
          More <ChevronDown size={14} />
        </button>
      </nav>

      <div className="jc-header__actions">
        <label className="jc-search" aria-label="Search CRM">
          <Search size={14} />
          <input placeholder="Search Leads, Contacts, Accounts…" />
          <kbd>/</kbd>
        </label>

        <button className="jc-icon-btn" data-solid="true" type="button" aria-label="Quick create">
          <Plus size={16} />
        </button>
        <button className="jc-icon-btn" type="button" aria-label="Notifications">
          <Bell size={16} />
        </button>
        <button className="jc-icon-btn" type="button" aria-label="Feeds">
          <MessageSquare size={16} />
        </button>
        <button className="jc-icon-btn" type="button" aria-label="Calendar">
          <Calendar size={16} />
        </button>
        <button className="jc-icon-btn" type="button" aria-label="Setup">
          <Settings size={16} />
        </button>
        <Link
          to="/owner"
          className="jc-icon-btn"
          aria-label="Back to Owner"
          style={{ fontSize: 11, fontWeight: 600, width: "auto", padding: "0 10px" }}
        >
          Owner
        </Link>
        <button className="jc-avatar" type="button" aria-label="Account">JB</button>
      </div>
    </header>
  );
}
