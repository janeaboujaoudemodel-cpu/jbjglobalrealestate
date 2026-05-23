import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut, Home, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";
import PortalSidebarNav from "@/components/developers-portal/PortalSidebarNav";
import { usePortalRole } from "@/hooks/usePortalRole";

/**
 * PortalShell — single shell for the standalone Developers Portal.
 * Replaces both /developer-hub (developer) and /developer-hub-admin (owner) shells.
 * Champagne L-shaped frame; role-aware sidebar.
 */
export default function PortalShell() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { role } = usePortalRole();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLabel =
    role === "owner" ? "Owner Console"
    : role === "portal_developer" ? "Developer Workspace"
    : role === "portal_rep" ? "Sales Rep Workspace"
    : "Developers Portal";

  const Sidebar = () => (
    <div className="h-full flex flex-col bg-[#F7F2EA]">
      <div className="h-16 flex items-center px-5 border-b border-[#B89555]/40 flex-shrink-0">
        <Building2 className="w-4 h-4 text-[#1A1A1A] mr-2.5" />
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 leading-none">{roleLabel}</p>
          <span className="text-[#1A1A1A] font-semibold text-[15px] tracking-tight">Developers Portal</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <PortalSidebarNav onNavigate={() => setMobileOpen(false)} />
      </div>
      <div className="flex-shrink-0 border-t border-[#B89555]/40 p-2 space-y-0.5 bg-[#EFE6D6]">
        <button
          onClick={() => { navigate("/"); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#FDFBF7] transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Return to Site</span>
        </button>
        <button
          onClick={async () => {
            try { await signOut(); toast.success("Signed out"); navigate("/"); }
            catch { toast.error("Failed to sign out"); }
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#FDFBF7] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0 border-r border-[#B89555]/40">
            <Sidebar />
          </SheetContent>
        </Sheet>
      )}

      {!isMobile && (
        <aside className="fixed left-0 top-[88px] h-[calc(100vh-88px)] w-64 border-r border-[#B89555]/40 z-40">
          <Sidebar />
        </aside>
      )}

      <main className={`flex-1 ${isMobile ? "" : "ml-64"} pt-[88px]`}>
        <div className="max-w-[1500px] mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
