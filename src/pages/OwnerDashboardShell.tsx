import { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  Shield,
  Menu,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import OwnerSidebarNav from "@/components/owner-dashboard/OwnerSidebarNav";
import { OwnerTasksPopupAlert } from "@/components/owner-dashboard/OwnerTasksPopupAlert";

const OwnerDashboardShell = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("owner.fullscreen") === "1";
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("owner.fullscreen", fullscreen ? "1" : "0");
  }, [fullscreen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      {/* Logo Area — height locked to --shell-header-h so sidebar divider aligns with main top-header bottom border */}
      <div
        className="owner-shell-surface border-b border-[#B89555]/40 flex items-center justify-between px-4 flex-shrink-0 bg-[#F7F2EA]"
        style={{ height: "var(--shell-header-h)", minHeight: "var(--shell-header-h)", maxHeight: "var(--shell-header-h)" }}
      >
        {!collapsed && (
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B89555] via-[#A68444] to-[#B89555] font-bold text-lg tracking-wide">
            JBJ Owner
          </span>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            data-no-contrast-guard
            style={{ color: "#1A1A1A" }}
            className="hover:text-[#B89555] hover:bg-[#B89555]/10 transition-all duration-300 focus:ring-2 focus:ring-[#B89555]/40"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Sidebar Navigation */}
      <OwnerSidebarNav collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />

      {/* Bottom Actions */}
      <div data-no-contrast-guard className="owner-shell-surface p-3 border-t border-[#B89555]/40 flex-shrink-0 space-y-1 bg-[#F7F2EA]">
        <button
          onClick={() => { navigate("/"); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#B89555]/40 text-primary bg-secondary"
          aria-label="Return to main site"
        >
          <Home className="w-5 h-5 flex-shrink-0 text-primary" />
          {!collapsed && <span className="text-primary">Return to Site</span>}
        </button>
        <button
          onClick={handleSignOut}
          style={{ color: "#1A1A1A" }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:!text-red-700 hover:bg-red-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/40"
          aria-label="Sign out"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div data-surface="champagne" className="owner-dashboard-shell owner-shell-surface min-h-screen bg-[#F7F2EA] flex">
      {/* Owner Tasks Popup Alert — wrapped to never block scroll/wheel events */}
      <div className="pointer-events-none fixed inset-0 z-50 [&>*]:pointer-events-auto">
        <OwnerTasksPopupAlert />
      </div>
      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" data-surface="champagne" className="owner-shell-surface w-64 p-0 bg-[#F7F2EA] border-r border-[#B89555]/40">
            <div className="h-full flex flex-col">
              <SidebarContent collapsed={false} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && !fullscreen && (
        <aside 
          data-surface="champagne"
          className={cn(
            "owner-shell-surface fixed left-0 top-0 h-full bg-[#F7F2EA] border-r border-[#B89555]/40 transition-all duration-300 z-40 flex flex-col shadow-xl shadow-[#B89555]/5",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
          role="navigation"
          aria-label="Owner dashboard navigation"
        >
          <SidebarContent collapsed={sidebarCollapsed} />
        </aside>
      )}

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300 overscroll-contain",
          isMobile || fullscreen ? "ml-0" : (sidebarCollapsed ? "ml-16" : "ml-64")
        )}
        role="main"
      >
        {/* Top Bar — height locked to --shell-header-h so its bottom border aligns
            pixel-for-pixel with the sidebar logo divider. No top padding/margin. */}
        <header
          data-no-contrast-guard
          className="owner-shell-surface bg-[#F7F2EA] border-b border-[#B89555]/40 sticky top-0 z-30 flex items-center justify-between px-3 md:px-6 shadow-sm min-w-0"
          style={{ height: "var(--shell-header-h)", minHeight: "var(--shell-header-h)", maxHeight: "var(--shell-header-h)" }}
        >
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-shrink-1">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                className="text-[#1A1A1A] hover:text-[#B89555] hover:bg-[#B89555]/10 focus:ring-2 focus:ring-[#B89555]/40 flex-shrink-0"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="min-w-0 flex flex-col justify-center leading-tight">
              <h1 className="text-[#1A1A1A] font-semibold text-sm md:text-base tracking-wide whitespace-nowrap truncate leading-tight">Founder & CEO</h1>
              <p className="text-[#1A1A1A]/70 text-xs hidden md:block whitespace-nowrap leading-tight">Jane Bou Jaoude — Executive Command Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {/* Owner Badge */}
            <div className="flex items-center gap-1.5 md:gap-2 bg-[#EFE6D6] border border-[#B89555] rounded-xl px-2 md:px-4 py-1.5 md:py-2 shadow-sm whitespace-nowrap">
              <Shield className="w-4 h-4 text-[#1A1A1A] flex-shrink-0" strokeWidth={2.5} />
              <span className="text-[#1A1A1A] text-xs md:text-sm font-bold hidden sm:inline tracking-wide">Owner</span>
            </div>
            
            {/* User Email */}
            <div className="text-right hidden md:block whitespace-nowrap">
              <p className="text-[#1A1A1A] text-sm font-medium truncate max-w-[120px]">
                {user?.email?.split("@")[0] || "Jane"}
              </p>
              <p className="text-[#1A1A1A]/70 text-xs">Verified Owner</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboardShell;
