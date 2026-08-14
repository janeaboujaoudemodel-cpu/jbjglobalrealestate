import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, CalendarDays, Grip, Plus, Search, Settings, Store, Wand2 } from "lucide-react";
import { CRM_DEFAULT_SECTION, getCrmModuleLabel } from "./modules";
import CrmSearchOverlay from "./CrmSearchOverlay";
import CrmQuickCreateMenu from "./CrmQuickCreateMenu";
import CrmQuickCreateSheet from "./CrmQuickCreateSheet";
import CrmNotificationsPanel from "./CrmNotificationsPanel";
import CrmZiaPanel from "./CrmZiaPanel";
import UserAvatarMenu from "@/components/navigation/UserAvatarMenu";

export default function CrmHeader() {
  const { pathname } = useLocation();
  const active = pathname.replace(/\/+$/, "").split("/").pop() || CRM_DEFAULT_SECTION;
  const title = getCrmModuleLabel(active === "jbj" ? CRM_DEFAULT_SECTION : active);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [ziaOpen, setZiaOpen] = useState(false);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Real unread notifications only — never a hardcoded badge.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("is_read", false);
      if (!cancelled) setUnreadCount(count || 0);
    };
    void load();
    const interval = window.setInterval(load, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [notifOpen]);


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
    const onExternal = () => setSearchOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("jc-open-search", onExternal as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("jc-open-search", onExternal as EventListener);
    };
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
          <CrmQuickCreateMenu
            open={quickOpen}
            onClose={() => setQuickOpen(false)}
            onSelect={(slug) => setQuickSlug(slug)}
          />
        </div>
        <button
          className="jc-icon-btn"
          type="button"
          aria-label="Zia assistant"
          aria-expanded={ziaOpen}
          data-active={ziaOpen ? "true" : undefined}
          onClick={() => { setZiaOpen((v) => !v); setQuickOpen(false); setNotifOpen(false); }}
        >
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
        <Link to="/owner/crm/jbj/calendar" className="jc-icon-btn" aria-label="Calendar">
          <CalendarDays size={21} />
        </Link>
        <button className="jc-icon-btn" type="button" aria-label="Marketplace">
          <Store size={21} />
        </button>
        <Link to="/owner/crm/jbj/setup" className="jc-icon-btn" aria-label="Setup">
          <Settings size={21} />
        </Link>
        <button className="jc-grid-btn" type="button" aria-label="Apps">
          <Grip size={26} />
        </button>
        <div className="jc-account-menu"><UserAvatarMenu /></div>
      </div>
      <CrmSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CrmZiaPanel open={ziaOpen} onClose={() => setZiaOpen(false)} />
      <CrmQuickCreateSheet slug={quickSlug} onClose={() => setQuickSlug(null)} />
    </header>
  );
}
