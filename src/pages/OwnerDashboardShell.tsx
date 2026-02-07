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

/**
 * OwnerDashboardShell - The main layout for Owner-only dashboard
 * 
 * Features:
 * - Collapsible sidebar navigation with organized sections
 * - Mobile responsive with Sheet drawer
 * - Owner identity display
 * - Quick actions in top bar
 * - Responsive design
 * 
 * This is the shell/layout component. Actual page content
 * is rendered via <Outlet /> (nested routes).
 */
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

  // Sidebar content - reused for both desktop and mobile
  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      {/* Logo Area */}
      <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 flex-shrink-0">
        {!collapsed && (
          <span className="text-gold font-bold text-lg">JBJ Owner</span>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
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
      <div className="p-2 border-t border-zinc-800 flex-shrink-0">
        <button
          onClick={() => { navigate("/"); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Return to Site</span>}
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-black flex">
      {/* Mobile Sidebar - Sheet Drawer */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-zinc-950 border-r border-zinc-800">
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
            "fixed left-0 top-0 h-full bg-zinc-950 border-r border-zinc-800 transition-all duration-300 z-40 flex flex-col",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
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
      >
        {/* Top Bar */}
        <header className="h-16 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(true)}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h1 className="text-white font-semibold text-sm md:text-base">Owner Command Center</h1>
              <p className="text-zinc-500 text-xs hidden md:block">Full system access</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Owner Badge */}
            <div className="flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-lg px-2 md:px-3 py-1.5">
              <Shield className="w-4 h-4 text-gold" />
              <span className="text-gold text-xs md:text-sm font-medium hidden sm:inline">Owner</span>
            </div>
            
            {/* User Email */}
            <div className="text-right hidden md:block">
              <p className="text-white text-sm font-medium">
                {user?.email?.split("@")[0] || "Jane"}
              </p>
              <p className="text-zinc-500 text-xs">Verified Owner</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboardShell;
