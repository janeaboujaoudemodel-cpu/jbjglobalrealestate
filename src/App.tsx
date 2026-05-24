import React, { lazy, Suspense, useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SafeTooltipProvider } from "@/components/ui/SafeTooltipProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { BrandPaletteProvider } from "@/contexts/BrandPaletteContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ActiveLeadProvider } from "@/contexts/ActiveLeadContext";
import { PopupCoordinatorProvider } from "@/contexts/PopupCoordinatorContext";
import { FounderVisibilityProvider } from "@/contexts/FounderVisibilityContext";
import { UserModeProvider } from "@/contexts/UserModeContext";
import { PodcastVisibilityProvider } from "@/contexts/PodcastVisibilityContext";
import { ConsVisibilityProvider } from "@/contexts/ConsVisibilityContext";
import { ScrollToTopOnMount } from "@/components/ScrollToTop";
import RouteResume from "@/components/RouteResume";
import AdminBypass from "@/components/AdminBypass";
import MainLayoutWrapper from "@/components/MainLayoutWrapper";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import GlobalSEO from "@/components/GlobalSEO";
import SEOServiceArea from "@/components/SEOServiceArea";
import GlobalVisitorTracking from "@/components/GlobalVisitorTracking";
import SEOBreadcrumbs from "@/components/SEOBreadcrumbs";
import CanonicalAndHreflang from "@/components/CanonicalAndHreflang";
import SeoHighlightOverlay from "@/components/SeoHighlightOverlay";
import PageLoader from "@/components/PageLoader";
import { InlinePageLoader } from "@/components/PageLoader";
import PrintModeBoundary from "@/components/PrintModeBoundary";
import PrintBlockerGuard from "@/components/PrintBlockerGuard";

// BrandIntroSplash disabled until further notice
// import BrandIntroSplash from "@/components/BrandIntroSplash";

// ── Route Groups ──
import { StandaloneRoutes } from "@/routes/StandaloneRoutes";
import { OwnerRoutes } from "@/routes/OwnerRoutes";
import { PublicRoutes } from "@/routes/PublicRoutes";
import { AIToolRoutes } from "@/routes/AIToolRoutes";
import { AdminRoutes } from "@/routes/AdminRoutes";
import { ToolkitRoutes } from "@/routes/ToolkitRoutes";
import { DeveloperHubRoutes } from "@/routes/DeveloperHubRoutes";
import { DevelopersPortalRoutes } from "@/routes/DevelopersPortalRoutes";

// ── QueryClient ──
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    // Install runtime same-tone contrast guard (companion to PASS 5 CSS guard)
    import("@/utils/contrastGuard").then((m) => m.installContrastGuard()).catch(() => {});

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <SafeTooltipProvider>
        <LanguageProvider>
          <GlobalSEO />
          <SEOServiceArea />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            
            <AuthProvider>
            <BrandPaletteProvider>
              <UserModeProvider>
              <FounderVisibilityProvider>
                <PodcastVisibilityProvider>
                <ConsVisibilityProvider>
                  <ActiveLeadProvider>
                    <PopupCoordinatorProvider>
                    <PrintModeBoundary />
                    <PrintBlockerGuard />
                    <ScrollToTopOnMount />
                  <RouteResume />
                  <GlobalVisitorTracking />
                  <SEOBreadcrumbs />
                  <CanonicalAndHreflang />
                  <SeoHighlightOverlay />
                  
            {/* BrandIntroSplash disabled until further notice */}
            <Routes>
              {/* ── Standalone Routes (no shell) ── */}
              <Route element={<Suspense fallback={<PageLoader />}><Outlet /></Suspense>}>
                {StandaloneRoutes()}
              </Route>

              {/* ── Owner Command Center (dedicated shell) ── */}
              <Route element={<Suspense fallback={<PageLoader />}><Outlet /></Suspense>}>
                {OwnerRoutes()}
              </Route>

              {/* ── Developers Portal (standalone shell) — REPLACES /developer-hub + /developer-hub-admin ── */}
              {DevelopersPortalRoutes()}

              {/* ── Legacy Developer Hub (kept for backward compatibility; portal redirects win when both match) ── */}
              {DeveloperHubRoutes()}
              
              
              {/* ── Main Layout Routes (header + footer shell) ── */}
              <Route element={<MainLayoutWrapper />}>
                <Route element={<Suspense fallback={<InlinePageLoader />}><Outlet /></Suspense>}>
                  {/* Public pages: properties, guides, services, company, user */}
                  {PublicRoutes()}

                  {/* AI tool pages */}
                  {AIToolRoutes()}

                  {/* Admin & owner-guarded pages */}
                  {AdminRoutes()}

                  {/* Toolkit & creative suite */}
                  {ToolkitRoutes()}
                </Route>
              </Route>
            </Routes>
                  </PopupCoordinatorProvider>
                </ActiveLeadProvider>
              </ConsVisibilityProvider>
              </PodcastVisibilityProvider>
            </FounderVisibilityProvider>
            </UserModeProvider>
            </BrandPaletteProvider>
            </AuthProvider>
          </BrowserRouter>
        </LanguageProvider>
      </SafeTooltipProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
  );
};

export default App;
