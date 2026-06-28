import { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { LogOut, Home, Menu, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import DeveloperHubSidebarNav from "@/components/developer-hub/DeveloperHubSidebarNav";

/**
 * Premium champagne shell for the Developer Hub.
 * Locked palette: page #FDFBF7, surface #F7F2EA, raised #EFE6D6, gold #B89555 (1px hairline only),
 * ink #1A1A1A, Inter only. No gold fills.
 */
const DeveloperHubShell = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
      navigate("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-[#F7F2EA]">
      <div className="h-16 flex items-center px-5 border-b border-[#B89555]/40 flex-shrink-0">
        <Building2 className="w-4 h-4 text-[#1A1A1A] mr-2.5" />
        <span className="text-[#1A1A1A] font-semibold text-[15px] tracking-tight">
          Developer Hub
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <DeveloperHubSidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="flex-shrink-0 border-t border-[#B89555]/40 p-2 space-y-0.5 bg-[#EFE6D6]">
        <button
          onClick={() => { navigate("/"); setMobileOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#FDFBF7] transition-colors"
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          <span>Return to Site</span>
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#FDFBF7] transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
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
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {!isMobile && (
        <aside data-backend-sidebar="developer" data-surface="champagne" className="fixed left-0 top-[88px] h-[calc(100vh-88px)] w-64 border-r border-[#B89555]/40 z-40">
          <SidebarContent />
        </aside>
      )}

      <main className={cn("flex-1", isMobile ? "ml-0" : "ml-64")}>
        <header className="h-14 bg-[#F7F2EA] border-b border-[#B89555]/40 sticky top-[88px] z-30 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="text-[#1A1A1A]">
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="text-[#1A1A1A] font-semibold text-sm md:text-base tracking-tight leading-[1.15] whitespace-normal break-words [overflow-wrap:anywhere]">
                Developer Hub
              </h1>
              {user?.email && (
                <p className="text-[#1A1A1A]/60 text-xs hidden md:block leading-[1.15] whitespace-normal break-words [overflow-wrap:anywhere]">
                  Signed in
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] uppercase tracking-wider bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
              Developer
            </span>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DeveloperHubShell;
