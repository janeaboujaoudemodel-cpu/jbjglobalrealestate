import { Link, useLocation } from "react-router-dom";
import { Bell, CalendarDays, CircleUserRound, Grip, Plus, Search, Settings, Store, Wand2 } from "lucide-react";
import { CRM_DEFAULT_SECTION, getCrmModuleLabel } from "./modules";
import jbjMonogram from "@/assets/jbj-monogram-light-on-dark.png";

export default function CrmHeader() {
  const { pathname } = useLocation();
  const active = pathname.replace(/\/+$/, "").split("/").pop() || CRM_DEFAULT_SECTION;
  const title = getCrmModuleLabel(active === "jbj" ? CRM_DEFAULT_SECTION : active);

  return (
    <header className="jc-header">
      <h1 className="jc-header__title">{title}</h1>

      <div className="jc-header__actions">
        <label className="jc-search" aria-label="Search CRM">
          <Search size={19} strokeWidth={2.25} />
          <input type="text" placeholder="Search records" autoComplete="off" spellCheck={false} />
        </label>

        <button className="jc-icon-btn" data-solid="true" type="button" aria-label="Quick create">
          <Plus size={22} strokeWidth={1.9} />
        </button>
        <button className="jc-icon-btn" type="button" aria-label="Zia assistant">
          <Wand2 size={21} />
        </button>
        <button className="jc-icon-btn" type="button" aria-label="Notifications">
          <Bell size={21} />
        </button>
        <button className="jc-icon-btn" type="button" aria-label="Calendar">
          <CalendarDays size={21} />
        </button>
        <button className="jc-icon-btn" type="button" aria-label="Marketplace">
          <Store size={21} />
        </button>
        <button className="jc-icon-btn" type="button" aria-label="Setup">
          <Settings size={21} />
        </button>
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
    </header>
  );
}
