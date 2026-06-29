import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { Crown, ArrowLeft, Menu, X, Shield, Home, User, Briefcase, Building2 } from "lucide-react";
import BrokerPortalSidebar from "./BrokerPortalSidebar";
import PageLoader from "@/components/PageLoader";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import UserAvatarMenu from "@/components/navigation/UserAvatarMenu";
import { useUserMode } from "@/hooks/useUserMode";

/**
 * Broker Portal shell — mirrors the structural pattern of OwnerDashboardShell:
 *  - Fixed full-height left sidebar (no gap below)
 *  - Sticky top bar aligned pixel-for-pixel with the sidebar header divider
 *  - Owner preview banner stays visible so the owner has a one-click path back
 *  - No public-site chrome (header/footer hidden upstream by MainLayout)
 */
export default function BrokerPortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOwner } = useUserRole();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { mode } = useUserMode();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const ModeIcon = mode === "developer" ? Building2 : mode === "investor" ? User : Briefcase;
  const modeLabel = isOwner
    ? "Owner"
    : mode === "developer"
    ? "Developer"
    : mode === "investor"
    ? "Investor"
    : "Broker";
  // Owner-only chrome (banner + "JBJ Owner" header pill) shows ONLY in owner
  // mode. When the app owner picks broker/investor/developer in the mode
  // switcher, they want a pixel-true mirror of the real portal experience.
  const showOwnerChrome = isOwner && mode === "owner";
  const isExplicitOwnerPreview = new URLSearchParams(location.search).get("preview") === "1";


  // If an owner lands on /broker without explicit preview flag, the
  // OwnerRedirectGuard already routes them away. Defensive: clear any
  // stale preview flag on direct navigation to /owner.
  useEffect(() => {
    const handler = () => {
      try { sessionStorage.removeItem("jbj_broker_portal_preview"); } catch {}
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // When the user is in Owner mode they must never see the broker portal —
  // route them straight to /owner. They can return by flipping the mode
  // picker back to "broker" in the header.
  useEffect(() => {
    if (mode === "owner" && !isExplicitOwnerPreview) {
      try { sessionStorage.removeItem("jbj_broker_portal_preview"); } catch {}
      navigate("/owner", { replace: true });
    }
  }, [mode, isExplicitOwnerPreview, navigate]);

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[260px]";
  const contentOffset = isMobile ? "ml-0" : (collapsed ? "ml-[72px]" : "ml-[260px]");

  return (
    <div
      data-surface="champagne"
      data-backend-portal="broker"
      data-broker-shell
      className="min-h-screen w-full bg-[#FDFBF7] relative"
    >
      {/* Mobile sidebar */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            data-surface="champagne"
            className="w-[260px] p-0 bg-[#F7F2EA] border-r border-[#B89555]/40"
          >
            <BrokerPortalSidebar
              collapsed={false}
              onToggle={() => {}}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop sidebar — fixed full-height */}
      {!isMobile && (
        <aside
          data-chrome="sidebar"
          data-backend-sidebar="broker"
          data-surface="champagne"
          data-no-contrast-guard
          className={cn(
            "fixed left-0 top-0 h-screen z-40 bg-[#F7F2EA] border-r border-[#B89555]/40 flex flex-col shadow-xl shadow-[#B89555]/5 transition-[width] duration-200",
            sidebarWidth,
          )}
        >
          <BrokerPortalSidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
          />
        </aside>
      )}

      {/* Main column */}
      <div className={cn("transition-[margin] duration-200 min-h-screen flex flex-col", contentOffset)}>
        {/* Top bar — aligned with sidebar header divider */}
        <header
          data-no-contrast-guard
          className="bg-[#F7F2EA] border-b border-[#B89555]/40 sticky top-0 z-30 flex items-center justify-between px-3 md:px-6 shadow-sm"
          style={{ height: "var(--shell-header-h)" }}
        >
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {isMobile && (
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
                className="h-9 w-9 grid place-items-center rounded-md hover:bg-[#EFE6D6] text-[#1A1A1A]"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0 flex items-center">
              <h1 className="font-display text-[#1A1A1A] font-semibold text-base md:text-lg tracking-tight leading-[1.15] whitespace-normal break-words [overflow-wrap:anywhere]">
                Broker Workspace
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              to="/"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md text-[#1A1A1A] hover:bg-[#EFE6D6] border border-transparent hover:border-[#B89555]/40 transition-colors"
            >
              <Home className="h-3.5 w-3.5" /> Site
            </Link>
            {/* "Back to JBJ Owner" pill removed — owner-mode users are redirected to /owner. */}
            <div className="hidden sm:flex items-center gap-1.5 bg-[#EFE6D6] border border-[#B89555] rounded-md px-2.5 py-1 text-xs font-bold text-[#1A1A1A] tracking-wide">
              <ModeIcon className="h-3.5 w-3.5" /> {modeLabel}
            </div>
            {/* Mother-of-pearl circular avatar dropdown — same as front-end header */}
            <UserAvatarMenu />
          </div>
        </header>

        {/* Owner preview banner removed — owner-mode users no longer land here. */}

        <main className="flex-1 min-w-0 w-full overflow-x-hidden" role="main">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto min-w-0 w-full">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>

      </div>
    </div>
  );
}
