import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, CalendarDays, CircleUserRound, Grip, Plus, Search, Settings, Store, Wand2 } from "lucide-react";
import { CRM_DEFAULT_SECTION, getCrmModuleLabel } from "./modules";
import CrmSearchOverlay from "./CrmSearchOverlay";
import CrmQuickCreateMenu from "./CrmQuickCreateMenu";
import CrmNotificationsPanel from "./CrmNotificationsPanel";
import CrmZiaPanel from "./CrmZiaPanel";
import jbjMonogram from "@/assets/jbj-monogram-light-on-dark.png";

export default function CrmHeader() {
  const { pathname } = useLocation();
  const active = pathname.replace(/\/+$/, "").split("/").pop() || CRM_DEFAULT_SECTION;
  const title = getCrmModuleLabel(active === "jbj" ? CRM_DEFAULT_SECTION : active);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [ziaOpen, setZiaOpen] = useState(false);
  const unreadCount = 3;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="jc-header">
      <h1 className="jc-header__title">{title}</h1>

      <div className="jc-header__actions">
        <button
          type="button"
          className="jc-search"
          aria-label="Search CRM"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={19} strokeWidth={2.25} />
          <span className="jc-search__placeholder">Search records</span>
          <span className="jc-search__kbd">⌘ K</span>
        </button>

        <div className="jc-popover-anchor">
          <button
            className="jc-icon-btn"
            data-solid="true"
            data-active={quickOpen ? "true" : undefined}
            type="button"
            aria-label="Quick create"
            aria-expanded={quickOpen}
            onClick={() => { setQuickOpen((v) => !v); setNotifOpen(false); }}
          >
            <Plus size={22} strokeWidth={1.9} />
          </button>
          <CrmQuickCreateMenu open={quickOpen} onClose={() => setQuickOpen(false)} />
        </div>
        <button className="jc-icon-btn" type="button" aria-label="Zia assistant">
          <Wand2 size={21} />
        </button>
        <div className="jc-popover-anchor">
          <button
            className="jc-icon-btn"
            type="button"
            aria-label="Notifications"
            aria-expanded={notifOpen}
            data-active={notifOpen ? "true" : undefined}
            onClick={() => { setNotifOpen((v) => !v); setQuickOpen(false); }}
          >
            <Bell size={21} />
            {unreadCount > 0 && <span className="jc-icon-btn__badge">{unreadCount}</span>}
          </button>
          <CrmNotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>
        <button className="jc-icon-btn" type="button" aria-label="Calendar">
          <CalendarDays size={21} />
        </button>
        <button className="jc-icon-btn" type="button" aria-label="Marketplace">
          <Store size={21} />
        </button>
        <Link to="/owner/crm/jbj/setup" className="jc-icon-btn" aria-label="Setup">
          <Settings size={21} />
        </Link>
        <Link
          to="/owner"
          className="jc-jbj-avatar"
          aria-label="Back to Owner"
        >
          <img src={jbjMonogram} alt="JBJ Global Real Estate" draggable={false} />
        </Link>
        <button className="jc-icon-btn" type="button" aria-label="Profile">
          <CircleUserRound size={21} />
        </button>
        <button className="jc-grid-btn" type="button" aria-label="Apps">
          <Grip size={26} />
        </button>
      </div>
      <CrmSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
