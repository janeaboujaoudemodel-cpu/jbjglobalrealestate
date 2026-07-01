import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import CrmHeader from "./CrmHeader";
import CrmSidebar from "./CrmSidebar";
import "./crmShell.css";

/**
 * JBJ CRM Shell — standalone application shell.
 * Zero Zoho runtime dependency. Uses only JBJ tokens and local state.
 */
export default function CrmShell() {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // One-time purge of any leftover Zoho / mirror cache keys from prior builds.
  useEffect(() => {
    try {
      Object.keys(localStorage)
        .filter((k) => /^(jbj_crm_mirror|zoho[_-])/i.test(k))
        .forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="jc-app" data-rail={collapsed ? "collapsed" : "expanded"}>
      <CrmHeader />
      <CrmSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <main className="jc-content" role="main">
        <Outlet />
      </main>
    </div>
  );
}
