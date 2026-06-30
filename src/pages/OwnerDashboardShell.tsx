import { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { 
  PanelLeftClose,
  PanelLeftOpen,
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
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";

const OwnerDashboardShell = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    try { sessionStorage.removeItem("jbj_broker_portal_preview"); } catch {}
    // Clean up any legacy persisted fullscreen flag — sidebar must remain visible
    // by default per the global PASS XX rule. Fullscreen is now click-only.
    try { window.localStorage.removeItem("owner.fullscreen"); } catch {}
  }, []);


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
        className="owner-shell-surface border-b border-[#B89555]/40 flex items-center justify-between gap-2 px-3 flex-shrink-0 bg-[#F7F2EA]"
        style={{ height: "var(--shell-header-h)", minHeight: "var(--shell-header-h)", maxHeight: "var(--shell-header-h)" }}
      >
        <button
          type="button"
          onClick={() => { navigate("/owner"); setMobileOpen(false); }}
          className={cn(
            "flex items-center min-w-0 w-full",
            collapsed ? "justify-center" : "justify-start gap-2.5"
          )}
          aria-label="JBJ Global Real Estate owner dashboard"
        >
          <img
            src={jbjMonogramNobuffer}
            alt="JBJ"
            className="object-contain flex-shrink-0"
            style={{ width: collapsed ? 38 : 44, height: collapsed ? 38 : 44 }}
           loading="lazy" decoding="async" />
          {!collapsed && (
            <span
              className="min-w-0 flex-1 text-[12px] uppercase tracking-[0.18em] text-[#1A1A1A] font-extrabold whitespace-nowrap leading-none text-left truncate"
            >
              JBJ GLOBAL REAL ESTATE
            </span>
          )}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <OwnerSidebarNav collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />

      {/* Bottom Actions */}
      <div data-no-contrast-guard className="owner-shell-surface p-3 border-t border-[#B89555]/40 flex-shrink-0 space-y-1 bg-[#F7F2EA]">
        {/* Return to Site — collapsed: emerald highlight tile; expanded: bordered to match Sign Out */}
        <button
          onClick={() => { navigate("/"); setMobileOpen(false); }}
          data-no-contrast-guard
          {...(collapsed ? { "data-allow-dark-cta": true } : {})}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#B89555]/40",
            collapsed
              ? "justify-center allow-white"
              : "border border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#B89555]/10 hover:border-[#B89555]"
          )}
          style={collapsed ? {
            background: "var(--jj-emerald-ombre)",
            color: "#FFFFFF",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "0 10px 24px -12px rgba(4,44,28,0.86), inset 0 1px 0 rgba(255,255,255,0.16)",
          } : undefined}
          aria-label="Return to main site"
          title="Return to Site"
        >
          <Home
            className={cn("w-5 h-5 flex-shrink-0", collapsed ? "allow-white" : "text-[#1A1A1A]")}
            style={collapsed ? { color: "#FFFFFF", stroke: "#FFFFFF" } : undefined}
          />
          {!collapsed && <span className="text-[#1A1A1A] truncate">Return to Site</span>}
        </button>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          data-signout-action
          data-no-contrast-guard
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border border-[#B89555]/40 bg-[#FDFBF7] text-[#DC2626] hover:bg-[#FEE2E2] hover:border-[#DC2626] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/40",
            collapsed && "justify-center"
          )}
          aria-label="Sign out"
          title="Sign Out"
        >
          <LogOut data-signout-icon className="w-5 h-5 flex-shrink-0 jj-signout-icon text-[#DC2626]" />
          {!collapsed && <span data-signout-label className="text-[#DC2626]">Sign Out</span>}
        </button>

        {/* Collapse / Expand — matches front-end vertical sidebar emerald pill */}
        {!isMobile && (
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            data-no-contrast-guard
            data-on-dark
            data-allow-dark-cta
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            title={collapsed ? "Expand" : "Collapse"}
            className="allow-white group mt-1.5 flex items-center justify-center gap-2 w-full px-3 py-[7px] rounded-lg text-[10px] font-extrabold tracking-[0.22em] uppercase transition-all duration-200 will-change-transform"
            style={{
              color: "#FFFFFF",
              background: "var(--jj-emerald-ombre)",
              border: "1px solid rgba(255,255,255,0.22)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--jj-emerald-ombre-hover)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.32)";
              e.currentTarget.style.boxShadow = "0 10px 24px -10px rgba(4,120,87,0.70), 0 0 0 1px rgba(52,211,153,0.42), 0 0 12px rgba(52,211,153,0.30)";
              e.currentTarget.style.transform = "perspective(700px) rotateX(2deg) translateY(-2px) scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--jj-emerald-ombre)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "none";
            }}
          >
            {collapsed ? (
              <PanelLeftOpen className="allow-white w-3.5 h-3.5" strokeWidth={2} style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            ) : (
              <PanelLeftClose className="allow-white w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={2} style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            )}
            {!collapsed && (
              <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Collapse</span>
            )}
          </button>
        )}
      </div>
    </>
  );

  // Expose content-area offsets so the global BrandedLoader centers in the
  // visible main area (right of sidebar, below the top bar) rather than over
  // the whole viewport.
  const contentLeft = isMobile || fullscreen ? "0px" : sidebarCollapsed ? "72px" : "280px";
  const contentTop = "var(--shell-header-h)";

  return (
    <div
      data-surface="champagne"
      className="owner-dashboard-shell owner-shell-surface min-h-screen bg-[#F7F2EA] flex"
      style={{ ["--app-content-left" as never]: contentLeft, ["--app-content-top" as never]: contentTop }}
    >
      {/* Owner Tasks Popup Alert — wrapped to never block scroll/wheel events */}
      <div className="pointer-events-none fixed inset-0 z-50 [&>*]:pointer-events-auto">
        <OwnerTasksPopupAlert />
      </div>
      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" data-surface="champagne" className="owner-shell-surface w-[280px] p-0 bg-[#F7F2EA] border-r border-[#B89555]/40">
            <div className="h-full flex flex-col">
              <SidebarContent collapsed={false} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && !fullscreen && (
        <aside 
          data-chrome="sidebar"
          data-backend-sidebar="owner"
          data-surface="champagne"
          className={cn(
            "owner-shell-surface fixed left-0 top-0 h-full bg-[#F7F2EA] border-r border-[#B89555]/40 transition-all duration-300 z-40 flex flex-col shadow-xl shadow-[#B89555]/5",
            sidebarCollapsed ? "w-[72px]" : "w-[280px]"
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
          isMobile || fullscreen ? "ml-0" : (sidebarCollapsed ? "ml-[72px]" : "ml-[280px]")
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
            <div className="min-w-0 flex flex-col justify-center leading-none">
              <h1 className="text-[#1A1A1A] font-semibold text-sm md:text-base tracking-wide whitespace-nowrap truncate leading-none">Founder &amp; CEO</h1>
              <p className="text-[#1A1A1A]/70 text-[11px] mt-1 hidden md:block whitespace-nowrap leading-none">Jane Bou Jaoude — Executive Command Center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {/* Owner Badge */}
            <div className="flex items-center gap-1.5 md:gap-2 bg-[#EFE6D6] border border-[#B89555] rounded-xl px-2 md:px-4 py-1.5 md:py-2 shadow-sm whitespace-nowrap">
              <Shield className="w-4 h-4 text-[#1A1A1A] flex-shrink-0" strokeWidth={2.5} />
              <span className="text-[#1A1A1A] text-xs md:text-sm font-bold hidden sm:inline tracking-wide">Owner</span>
            </div>
            
            {/* Fullscreen toggle */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFullscreen((f) => !f)}
                data-no-contrast-guard
                style={{ color: "#1A1A1A" }}
                className="hover:text-[#B89555] hover:bg-[#B89555]/10 transition-all duration-300 focus:ring-2 focus:ring-[#B89555]/40"
                aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}

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
        <div className={cn("transition-all", fullscreen ? "p-2 md:p-3 max-w-none" : "p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto")}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OwnerDashboardShell;
