import { Outlet, Link, useNavigate } from "react-router-dom";
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
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  try { sessionStorage.removeItem("jbj_broker_portal_preview"); } catch {}
                  navigate("/owner");
                }}
                data-no-contrast-guard
                data-allow-dark-cta
                className="allow-white inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-[rgba(255,255,255,0.18)] shadow-[0_8px_18px_-12px_rgba(6,78,59,0.85)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-12px_rgba(6,78,59,0.95),0_0_16px_rgba(52,211,153,0.25)] hover:brightness-110 transition-all"
                style={{ backgroundImage: "var(--jj-emerald-ombre)", color: "#FFFFFF" }}
              >
                <ArrowLeft className="h-3.5 w-3.5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} /> JBJ Owner
                <Crown className="h-3 w-3 opacity-90" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1.5 bg-[#EFE6D6] border border-[#B89555] rounded-md px-2.5 py-1 text-xs font-bold text-[#1A1A1A] tracking-wide">
              <ModeIcon className="h-3.5 w-3.5" /> {modeLabel}
            </div>
            {/* Mother-of-pearl circular avatar dropdown — same as front-end header */}
            <UserAvatarMenu />
          </div>
        </header>

        {/* Owner preview banner (slim, sticky under the header) */}
        {isOwner && (
          <div
            className="bg-[#EFE6D6] border-b border-[#B89555]/40 px-4 md:px-8 py-2 text-xs text-[#1A1A1A]/85 flex items-center gap-2 sticky z-20"
            style={{ top: "var(--shell-header-h)" }}
          >
            <Crown className="h-3.5 w-3.5" />
            <span className="font-semibold">Owner preview</span>
            <span className="text-muted-foreground">— you're viewing the broker portal exactly as your registered brokers see it.</span>
          </div>
        )}

        <main className="flex-1 min-w-0" role="main">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
