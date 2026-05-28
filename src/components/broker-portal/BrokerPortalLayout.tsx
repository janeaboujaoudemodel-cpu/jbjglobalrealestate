import { Outlet, Link } from "react-router-dom";
import { Suspense } from "react";
import { Crown, ArrowRight } from "lucide-react";
import BrokerPortalSidebar from "./BrokerPortalSidebar";
import PageLoader from "@/components/PageLoader";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * Premium Broker Portal shell.
 * Renders inside MainLayoutWrapper, so the global header (88px fixed) and
 * footer are already in place. We add a left sidebar + outlet area.
 *
 * If the current viewer is the platform owner, surface a return-to-owner
 * banner so they always have a one-click path back to their full backend.
 */
export default function BrokerPortalLayout() {
  const { isOwner } = useUserRole();

  return (
    <div className="min-h-[calc(100vh-88px)] w-full bg-[#FDFBF7] flex">
      <BrokerPortalSidebar />
      <main className="flex-1 min-w-0">
        {isOwner && (
          <div className="bg-[#EFE6D6] border-b border-[#B89555]/40" data-gold-hairline>
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-2.5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-[#1A1A1A] text-sm">
                <Crown className="h-4 w-4" />
                <span className="font-semibold">Owner preview</span>
                <span className="text-[#1A1A1A]/70">
                  — you're viewing the Broker Portal exactly as your registered brokers see it.
                </span>
              </div>
              <Link
                to="/owner/crm"
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-[#FDFBF7] hover:bg-[#2a2a2a] transition-colors"
                data-allow-dark-cta
                onClick={() => { try { sessionStorage.removeItem("jbj_broker_portal_preview"); } catch {} }}
              >
                Return to Owner Backend
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-10">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
