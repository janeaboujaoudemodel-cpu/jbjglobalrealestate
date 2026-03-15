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
      <div className="h-16 border-b border-primary/30 flex items-center justify-between px-4 flex-shrink-0 bg-gradient-to-r from-background to-muted">
        {!collapsed && (
          <span className="text-primary font-bold text-lg tracking-wide">
            Developer Hub
          </span>
        )}
        {collapsed && <Building2 className="w-5 h-5 text-primary mx-auto" />}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-primary hover:text-primary/80 hover:bg-primary/10"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        )}
      </div>

      <DeveloperHubSidebarNav collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />

      <div className="p-3 border-t border-primary/30 flex-shrink-0 space-y-1 bg-background">
        <button
          onClick={() => { navigate("/"); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Return to Site</span>}
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-muted/50 flex">
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-background border-r border-primary/30">
            <div className="h-full flex flex-col">
              <SidebarContent collapsed={false} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {!isMobile && (
        <aside
          className={cn(
            "fixed left-0 top-0 h-full bg-gradient-to-b from-background via-muted to-muted/80 border-r border-primary/30 transition-all duration-300 z-40 flex flex-col shadow-xl",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          <SidebarContent collapsed={sidebarCollapsed} />
        </aside>
      )}

      <main className={cn("flex-1 transition-all duration-300", isMobile ? "ml-0" : sidebarCollapsed ? "ml-16" : "ml-64")}>
        <header className="h-16 bg-card/80 backdrop-blur-md border-b border-primary/30 sticky top-[48px] z-30 flex items-center justify-between px-3 md:px-6 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-primary">
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="text-foreground font-semibold text-sm md:text-base tracking-wide truncate">Developer Hub</h1>
              <p className="text-muted-foreground text-xs hidden md:block truncate">{user?.email || "Developer Portal"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-xl px-3 py-1.5">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-primary text-xs font-semibold hidden sm:inline">Developer</span>
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
