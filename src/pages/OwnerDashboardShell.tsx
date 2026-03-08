import { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  Shield,
  Menu,
  X,
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
  const isMobile = useIsMobile();

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
      {/* Logo Area */}
      <div className="h-16 border-b border-[#C9A84C]/30 flex items-center justify-between px-4 flex-shrink-0 bg-gradient-to-r from-[#FDFBF7] to-[#F5F0E6]">
        {!collapsed && (
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A84C] via-[#B8973F] to-[#C9A84C] font-bold text-lg tracking-wide">
            JBJ Owner
          </span>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-[#C9A84C] hover:text-[#B8973F] hover:bg-[#C9A84C]/10 transition-all duration-300 focus:ring-2 focus:ring-[#C9A84C]/40"
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
      <div className="p-3 border-t border-[#C9A84C]/30 flex-shrink-0 space-y-1 bg-[#FDFBF7]">
        <button
          onClick={() => { navigate("/"); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-600 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
          aria-label="Return to main site"
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Return to Site</span>}
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/40"
          aria-label="Sign out"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex">
      {/* Owner Tasks Popup Alert */}
      <OwnerTasksPopupAlert />
      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-r border-[#C9A84C]/30">
            <div className="h-full flex flex-col">
              <SidebarContent collapsed={false} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside 
          className={cn(
            "fixed left-0 top-0 h-full bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-r border-[#C9A84C]/30 transition-all duration-300 z-40 flex flex-col shadow-xl shadow-[#C9A84C]/5",
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
          "flex-1 transition-all duration-300",
          isMobile ? "ml-0" : (sidebarCollapsed ? "ml-16" : "ml-64")
        )}
        role="main"
      >
        {/* Top Bar - always horizontal, never vertical stacking */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#C9A84C]/30 sticky top-0 z-30 flex items-center justify-between px-3 md:px-6 shadow-sm min-w-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-shrink-1">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                className="text-zinc-600 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 focus:ring-2 focus:ring-[#C9A84C]/40 flex-shrink-0"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="text-black font-semibold text-sm md:text-base tracking-wide whitespace-nowrap truncate">Founder & CEO</h1>
              <p className="text-zinc-500 text-xs hidden md:block whitespace-nowrap">Jane Bou Jaoude — Executive Command Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {/* Owner Badge */}
            <div className="flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-[#C9A84C]/15 to-[#C9A84C]/10 border border-[#C9A84C]/40 rounded-xl px-2 md:px-4 py-1.5 md:py-2 shadow-sm whitespace-nowrap">
              <Shield className="w-4 h-4 text-[#C9A84C] drop-shadow-[0_0_8px_rgba(200,167,102,0.5)] flex-shrink-0" />
              <span className="text-[#C9A84C] text-xs md:text-sm font-semibold hidden sm:inline tracking-wide">Owner</span>
            </div>
            
            {/* User Email */}
            <div className="text-right hidden md:block whitespace-nowrap">
              <p className="text-black text-sm font-medium truncate max-w-[120px]">
                {user?.email?.split("@")[0] || "Jane"}
              </p>
              <p className="text-[#C9A84C]/70 text-xs">Verified Owner</p>
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
