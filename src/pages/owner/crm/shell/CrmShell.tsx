import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import CrmHeader from "./CrmHeader";
import CrmSidebar from "./CrmSidebar";
import "./crmShell.css";
import "./pass-347-crm-alert-and-chip-geometry.css";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { isOwnerBackendEmail } from "@/config/ownerEmails";

/**
 * JBJ CRM Shell — standalone application shell.
 * Zero Zoho runtime dependency. Uses only JBJ tokens and local state.
 */
export default function CrmShell() {
  const { user } = useAuth();
  const { mode, setMode } = useUserModeContext();

  // Auto-switch to owner mode so OwnerGuard doesn't kick the founder back
  // to /investor-dashboard when opening the CRM from any other mode.
  useEffect(() => {
    if (isOwnerBackendEmail(user?.email) && mode !== "owner") {
      setMode("owner").catch(() => {});
    }
  }, [user?.email, mode, setMode]);

  // Flag the document so portalled overlays (dialogs, sheets, popovers)
  // inherit the BACKEND white/emerald surface instead of the public
  // champagne surface. Portals render outside .jc-app, so an ancestor
  // selector cannot reach them.
  useEffect(() => {
    document.body.setAttribute("data-jbj-backend", "true");
    return () => document.body.removeAttribute("data-jbj-backend");
  }, []);

  // PASS 287 — publish the CONTENT-AREA box (white centre panel only, no
  // sidebar, no header) so backend dialogs centre inside it instead of the
  // viewport. Re-measures on resize and on sidebar collapse/expand.
  useEffect(() => {
    const main = document.querySelector(".jc-app .jc-content") as HTMLElement | null;
    if (!main) return;
    const publish = () => {
      const r = main.getBoundingClientRect();
      const s = document.documentElement.style;
      s.setProperty("--jc-content-left", `${Math.round(r.left)}px`);
      s.setProperty("--jc-content-width", `${Math.round(r.width)}px`);
      s.setProperty("--jc-content-top", `${Math.round(r.top)}px`);
      s.setProperty("--jc-content-height", `${Math.round(window.innerHeight - r.top)}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(main);
    ro.observe(document.body);
    window.addEventListener("resize", publish);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", publish);
    };
  }, []);

  // One-time purge of any leftover Zoho / mirror cache keys from prior builds.
  useEffect(() => {
    try {
      Object.keys(localStorage)
        .filter((k) => /^(jbj_crm_mirror|zoho[_-])/i.test(k))
        .forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
  }, []);


  return (
    <div className="jc-app" data-no-contrast-guard>
      <CrmSidebar />
      <CrmHeader />
      <main className="jc-content" role="main">
        <Outlet />
      </main>
      <footer className="jc-chat-dock" aria-label="CRM utility dock">
        <button type="button" className="jc-dock-tab">Chats</button>
        <button type="button" className="jc-dock-tab">Channels</button>
        <button type="button" className="jc-dock-tab">Contacts</button>
        <div className="jc-smart-chat">Here is your Smart Chat (Ctrl+Space)</div>
        <div className="jc-dock-actions" aria-hidden="true">
          <span /> <span /> <span /> <span /> <span /> <span /> <span />
        </div>
        <button type="button" className="jc-help-btn">? Help</button>
      </footer>
    </div>
  );
}
