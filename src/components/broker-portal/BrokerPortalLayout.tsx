import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import BrokerPortalSidebar from "./BrokerPortalSidebar";
import PageLoader from "@/components/PageLoader";

/**
 * Premium Broker Portal shell.
 * Renders inside MainLayoutWrapper, so the global header (88px fixed) and
 * footer are already in place. We add a left sidebar + outlet area.
 */
export default function BrokerPortalLayout() {
  return (
    <div className="min-h-[calc(100vh-88px)] w-full bg-[#FDFBF7] flex">
      <BrokerPortalSidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-10">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
