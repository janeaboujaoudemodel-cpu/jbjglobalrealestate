import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import CrmHeader from "./CrmHeader";
import CrmSidebar from "./CrmSidebar";
import "./crmShell.css";

/**
 * JBJ CRM Shell — standalone application shell.
 * Zero Zoho runtime dependency. Uses only JBJ tokens and local state.
 */
export default function CrmShell() {
  // One-time purge of any leftover Zoho / mirror cache keys from prior builds.
  useEffect(() => {
    try {
      Object.keys(localStorage)
        .filter((k) => /^(jbj_crm_mirror|zoho[_-])/i.test(k))
        .forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="jc-app">
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
