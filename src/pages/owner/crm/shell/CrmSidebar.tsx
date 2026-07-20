import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ExternalLink, LogOut, MoreHorizontal, PanelLeft, Search, Crown } from "lucide-react";

import {
  CRM_DEFAULT_SECTION,
  CRM_OWNER_HUB_SECTIONS,
  type CrmModule,
  CRM_PRIMARY_NAV,
  CRM_TEAMSPACE_BOTTOM,
  CRM_TEAMSPACE_FOLDERS,
  CRM_TEAMSPACE_TOP,
  crmSectionPath,
} from "./modules";
import { useOwnerVerification } from "@/hooks/useOwnerVerification";
import { useAuth } from "@/contexts/AuthContext";

export default function CrmSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const segment = pathname.replace(/\/+$/, "").split("/").pop();
  const active = !segment || segment === "jbj" ? CRM_DEFAULT_SECTION : segment;
  const { isOwner } = useOwnerVerification();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.querySelector(".jc-app")?.setAttribute("data-sidebar-collapsed", collapsed ? "true" : "false");
  }, [collapsed]);

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

  const renderHubModule = (m: CrmModule) => {
    const Icon = m.icon;
    const href = crmSectionPath(m.slug);
    const isActive = active === m.slug || pathname === href;
    return (
      <NavLink
        key={m.slug}
        to={href}
        data-active={isActive}
        className="jc-team-item jc-team-item--child"
      >
        <Icon size={19} strokeWidth={1.9} />
        <span>{m.label}</span>
      </NavLink>
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside className="jc-rail" aria-label="JBJ Hub navigation" data-no-contrast-guard data-collapsed={collapsed ? "true" : "false"}>
      <div className="jc-brand-row">
        <div className="jc-brand-mark" aria-hidden="true">JBJ</div>
        <span className="jc-brand-product">{isOwner ? "Hub" : "CRM"}</span>
        <ChevronDown size={18} className="jc-brand-caret" />
        <button
          type="button"
          className="jc-collapse-visual"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((v) => !v)}
        >
          <PanelLeft size={22} />
        </button>
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
        {/* Teamspace-local search removed — the header ⌘K search is the single global entry point. */}

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

      {isOwner && (
        <section className="jc-teamspace jc-owner-hub" aria-label="Owner JBJ Hub">
          <div className="jc-teamspace__title jc-owner-hub__title">
            <span className="jc-teamspace__badge jc-owner-hub__badge">
              <Crown size={12} />
            </span>
            <span>Owner Backend</span>
            <ChevronDown size={17} />
          </div>
          <nav className="jc-team-nav" aria-label="Owner backend modules inside JBJ Hub">
            {CRM_OWNER_HUB_SECTIONS.map((folder) => {
              const FolderIcon = folder.icon;
              return (
                <div className="jc-folder jc-folder--owner" key={folder.label} data-open={folder.defaultOpen ? "true" : "false"}>
                  <div className="jc-folder__label">
                    <FolderIcon size={20} />
                    <span>{folder.label}</span>
                    <ChevronDown size={16} />
                  </div>
                  <div className="jc-folder__children">
                    {folder.children.map((m) => renderHubModule(m))}
                  </div>
                </div>
              );
            })}
          </nav>
        </section>
      )}

      <div className="jc-sidebar-footer" aria-label="Hub account actions">
        <Link to="/" className="jc-sidebar-footer__action">
          <ExternalLink size={18} />
          <span>Return to Site</span>
        </Link>
        <button type="button" className="jc-sidebar-footer__action" onClick={handleSignOut}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
        <button type="button" className="jc-sidebar-footer__action" onClick={() => setCollapsed((v) => !v)}>
          <PanelLeft size={18} />
          <span>{collapsed ? "Expand" : "Collapse"}</span>
        </button>
      </div>
    </aside>
  );
}

