import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, MoreHorizontal, PanelLeft, Search } from "lucide-react";

import {
  CRM_DEFAULT_SECTION,
  CRM_PRIMARY_NAV,
  CRM_TEAMSPACE_BOTTOM,
  CRM_TEAMSPACE_FOLDERS,
  CRM_TEAMSPACE_TOP,
  crmSectionPath,
} from "./modules";

export default function CrmSidebar() {
  const { pathname } = useLocation();
  const segment = pathname.replace(/\/+$/, "").split("/").pop();
  const active = !segment || segment === "jbj" ? CRM_DEFAULT_SECTION : segment;

  const renderModule = (m: typeof CRM_PRIMARY_NAV[number], child = false) => {
    const Icon = m.icon;
    const isActive = active === m.slug;
    return (
      <NavLink
        key={m.slug}
        to={crmSectionPath(m.slug)}
        data-active={isActive}
        className={child ? "jc-team-item jc-team-item--child" : "jc-side-link"}
      >
        <Icon size={child ? 19 : 21} strokeWidth={1.9} style={m.color ? { color: m.color } : undefined} />
        <span>{m.label}</span>
      </NavLink>
    );
  };

  return (
    <aside className="jc-rail" aria-label="CRM navigation" data-no-contrast-guard>
      <div className="jc-brand-row">
        <img className="jc-brand-logo-img" src={jbjFullLogoLight} alt="JBJ Global Real Estate" />
        <span className="jc-brand-product">CRM</span>
        <ChevronDown size={18} className="jc-brand-caret" />
        <button type="button" className="jc-collapse-visual" aria-label="Collapse sidebar"><PanelLeft size={22} /></button>
      </div>

      <nav className="jc-main-nav" aria-label="Primary CRM modules">
        {CRM_PRIMARY_NAV.map((m) => renderModule(m))}
      </nav>

      <section className="jc-teamspace" aria-label="CRM Teamspace">
        <div className="jc-teamspace__title">
          <span className="jc-teamspace__badge">CT</span>
          <span>CRM Teamspace</span>
          <ChevronDown size={17} />
          <button type="button" aria-label="Teamspace options"><MoreHorizontal size={20} /></button>
        </div>
        <label className="jc-side-search" aria-label="Search modules">
          <Search size={20} />
          <input placeholder="Search" />
        </label>

        <nav className="jc-team-nav" aria-label="Teamspace modules">
          {CRM_TEAMSPACE_TOP.map((m) => renderModule(m, true))}
          {CRM_TEAMSPACE_FOLDERS.map((folder) => {
            const FolderIcon = folder.icon;
            return (
              <div className="jc-folder" key={folder.label} data-open={folder.defaultOpen ? "true" : "false"}>
                <div className="jc-folder__label">
                  <FolderIcon size={20} />
                  <span>{folder.label}</span>
                  <ChevronDown size={16} />
                </div>
                <div className="jc-folder__children">
                  {folder.children.map((m) => renderModule(m, true))}
                </div>
              </div>
            );
          })}
          {CRM_TEAMSPACE_BOTTOM.map((m) => renderModule(m, true))}
        </nav>
      </section>
    </aside>
  );
}
