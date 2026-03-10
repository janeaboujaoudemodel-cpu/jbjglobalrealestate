import React, { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SafeTooltipProvider } from "@/components/ui/SafeTooltipProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { BrandPaletteProvider } from "@/contexts/BrandPaletteContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ActiveLeadProvider } from "@/contexts/ActiveLeadContext";
import { PopupCoordinatorProvider } from "@/contexts/PopupCoordinatorContext";
import { FounderVisibilityProvider } from "@/contexts/FounderVisibilityContext";
import { UserModeProvider } from "@/contexts/UserModeContext";
import { PodcastVisibilityProvider } from "@/contexts/PodcastVisibilityContext";
import { ScrollToTopOnMount } from "@/components/ScrollToTop";
import RouteResume from "@/components/RouteResume";
import AdminBypass from "@/components/AdminBypass";
import MainLayoutWrapper from "@/components/MainLayoutWrapper";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import GlobalSEO from "@/components/GlobalSEO";
import SEOServiceArea from "@/components/SEOServiceArea";
import GlobalVisitorTracking from "@/components/GlobalVisitorTracking";
import SEOBreadcrumbs from "@/components/SEOBreadcrumbs";
import PageLoader from "@/components/PageLoader";

// ── Route Groups ──
import { StandaloneRoutes } from "@/routes/StandaloneRoutes";
import { OwnerRoutes } from "@/routes/OwnerRoutes";
import { PublicRoutes } from "@/routes/PublicRoutes";
import { AIToolRoutes } from "@/routes/AIToolRoutes";
import { AdminRoutes } from "@/routes/AdminRoutes";
import { ToolkitRoutes } from "@/routes/ToolkitRoutes";

// ── QueryClient ──
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      staleTime: 5 * 60 * 1000,
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
    return () => window.removeEventListener("unhandledrejection", handleUnhandledRejection);
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
                  <ActiveLeadProvider>
                    <PopupCoordinatorProvider>
                    <ScrollToTopOnMount />
                  <RouteResume />
                  <GlobalVisitorTracking />
                  <SEOBreadcrumbs />
                  
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Standalone Routes (no shell) ── */}
              {StandaloneRoutes()}

              {/* ── Owner Command Center (dedicated shell) ── */}
              {OwnerRoutes()}
              
              {/* ── Main Layout Routes (header + footer shell) ── */}
              <Route element={<AdminBypass><MainLayoutWrapper /></AdminBypass>}>
                {/* Public pages: properties, guides, services, company, user */}
                {PublicRoutes()}

                {/* AI tool pages */}
                {AIToolRoutes()}

                {/* Admin & owner-guarded pages */}
                {AdminRoutes()}

                {/* Toolkit & creative suite */}
                {ToolkitRoutes()}
              </Route>
              </Routes>
            </Suspense>
                  </PopupCoordinatorProvider>
                </ActiveLeadProvider>
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
