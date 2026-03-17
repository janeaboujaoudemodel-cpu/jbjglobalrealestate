import { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, LogOut, Home, Menu, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import DeveloperHubSidebarNav from "@/components/developer-hub/DeveloperHubSidebarNav";

const DeveloperHubShell = () => {
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
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      {/* Sidebar Header — champagne gradient */}
      <div className="h-16 flex items-center justify-between px-4 flex-shrink-0 bg-gradient-to-r from-[#F5EBD7] to-[#D4C4A8] border-b border-gold/30">
        {!collapsed && (
          <span className="text-black/80 font-bold text-lg tracking-wide">
            Developer Hub
          </span>
        )}
        {collapsed && <Building2 className="w-5 h-5 text-black/70 mx-auto" />}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-black/60 hover:text-black/80 hover:bg-black/10"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Navigation area — dark background */}
      <div className="flex-1 overflow-y-auto bg-[hsl(38,35%,12%)]">
        <DeveloperHubSidebarNav collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* Footer — visually separated */}
      <div className="flex-shrink-0 border-t border-gold/30 bg-[hsl(38,35%,10%)] p-3 space-y-1">
        <button
          onClick={() => { navigate("/"); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#E8DCC8]/70 hover:text-gold hover:bg-gold/10 transition-all"
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Return to Site</span>}
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#E8DCC8]/70 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)] flex">
      {/* Mobile Sheet */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-[hsl(38,35%,12%)] border-r border-gold/30">
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
            "fixed left-0 top-[48px] h-[calc(100vh-48px)] bg-[hsl(38,35%,12%)] border-r border-gold/30 transition-all duration-300 z-40 flex flex-col",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          <SidebarContent collapsed={sidebarCollapsed} />
        </aside>
      )}

      {/* Main content */}
      <main className={cn("flex-1 transition-all duration-300", isMobile ? "ml-0" : sidebarCollapsed ? "ml-16" : "ml-64")}>
        {/* Header — champagne gradient */}
        <header className="h-14 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-b border-gold/30 sticky top-[48px] z-30 flex items-center justify-between px-3 md:px-6">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="text-black/60 hover:text-black/80">
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="text-black/80 font-semibold text-sm md:text-base tracking-wide truncate">Developer Hub</h1>
              <p className="text-black/50 text-xs hidden md:block truncate">{user?.email || "Developer Portal"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-black/10 border border-black/20 rounded-lg px-3 py-1.5">
              <Building2 className="w-4 h-4 text-black/70" />
              <span className="text-black/70 text-xs font-semibold hidden sm:inline">Developer</span>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DeveloperHubShell;
