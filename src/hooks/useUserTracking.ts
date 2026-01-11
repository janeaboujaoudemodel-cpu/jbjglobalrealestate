import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EventData {
  property_id?: string;
  community?: string;
  developer?: string;
  scroll_depth?: number;
  time_spent?: number;
  search_query?: string;
  action?: string;
  element?: string;
  exit_url?: string;
  user_role?: string;
  pages_visited?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

// Generate a session ID for anonymous users
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem("jbj_session_id");
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("jbj_session_id", sessionId);
  }
  return sessionId;
};

// Detect device type
const getDeviceType = (): string => {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
};

// Get user role from localStorage
const getUserRole = (): string | null => {
  return localStorage.getItem("jbj_user_role");
};

// Track pages visited in session
const trackPageVisited = (path: string): string[] => {
  const key = "jbj_pages_visited";
  const existing = sessionStorage.getItem(key);
  const pages = existing ? JSON.parse(existing) : [];
  if (!pages.includes(path)) {
    pages.push(path);
    sessionStorage.setItem(key, JSON.stringify(pages));
  }
  return pages;
};

// Get approximate location from timezone
const getApproximateLocation = (): string => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || "Unknown";
  } catch {
    return "Unknown";
  }
};

export function useUserTracking() {
  const { user } = useAuth();
  const location = useLocation();
  const pageStartTime = useRef<number>(Date.now());
  const maxScrollDepth = useRef<number>(0);
  const sessionId = useRef<string>(getSessionId());

  // Track event with enhanced data
  const trackEvent = useCallback(async (
    eventType: string,
    eventData: EventData = {}
  ) => {
    try {
      const pagesVisited = trackPageVisited(location.pathname);
      const userRole = getUserRole();
      const timezone = getApproximateLocation();

      const { error } = await supabase
        .from("user_journey_events")
        .insert({
          user_id: user?.id || null,
          session_id: sessionId.current,
          event_type: eventType,
          page_path: location.pathname,
          event_data: {
            ...eventData,
            user_role: userRole,
            pages_visited: pagesVisited,
            timezone,
            total_pages: pagesVisited.length,
          },
          referrer: document.referrer || null,
          device_type: getDeviceType(),
        });

      if (error) {
        console.error("Error tracking event:", error);
      }
    } catch (err) {
      console.error("Failed to track event:", err);
    }
  }, [user, location.pathname]);

  // Track page view with enhanced data
  const trackPageView = useCallback(() => {
    trackEvent("page_view", {
      title: document.title,
      referrer: document.referrer,
      entry_time: new Date().toISOString(),
    });
  }, [trackEvent]);

  // Track property view
  const trackPropertyView = useCallback((propertyId: string, propertyName?: string) => {
    trackEvent("property_view", {
      property_id: propertyId,
      property_name: propertyName,
    });
  }, [trackEvent]);

  // Track community view
  const trackCommunityView = useCallback((communitySlug: string, communityName?: string) => {
    trackEvent("community_view", {
      community: communitySlug,
      community_name: communityName,
    });
  }, [trackEvent]);

  // Track search
  const trackSearch = useCallback((query: string, resultsCount?: number) => {
    trackEvent("search", {
      search_query: query,
      results_count: resultsCount,
    });
  }, [trackEvent]);

  // Track favorite action
  const trackFavorite = useCallback((propertyId: string, action: "add" | "remove") => {
    trackEvent("favorite", {
      property_id: propertyId,
      action,
    });
  }, [trackEvent]);

  // Track inquiry
  const trackInquiry = useCallback((propertyId?: string, type?: string) => {
    trackEvent("inquiry", {
      property_id: propertyId,
      inquiry_type: type,
    });
  }, [trackEvent]);

  // Track tool usage
  const trackToolUsage = useCallback((toolName: string, toolCategory?: string) => {
    trackEvent("tool_use", {
      tool_name: toolName,
      tool_category: toolCategory,
    });
  }, [trackEvent]);

  // Track click
  const trackClick = useCallback((element: string, additionalData?: EventData) => {
    trackEvent("click", {
      element,
      ...additionalData,
    });
  }, [trackEvent]);

  // Track user role selection (Buyer, Seller, Broker, Visitor)
  const trackRoleSelection = useCallback((role: string) => {
    localStorage.setItem("jbj_user_role", role);
    trackEvent("role_selection", {
      selected_role: role,
    });
  }, [trackEvent]);

  // Track form submission with source
  const trackFormSubmission = useCallback((formName: string, formData?: Record<string, any>) => {
    trackEvent("form_submission", {
      form_name: formName,
      form_source: location.pathname,
      ...formData,
    });
  }, [trackEvent, location.pathname]);

  // Track exit (called when user leaves the page)
  const trackExit = useCallback(() => {
    const timeSpent = Math.round((Date.now() - pageStartTime.current) / 1000);
    const pagesVisited = trackPageVisited(location.pathname);
    
    // Use sendBeacon for reliable exit tracking
    const data = JSON.stringify({
      user_id: user?.id || null,
      session_id: sessionId.current,
      event_type: "exit",
      page_path: location.pathname,
      event_data: {
        time_spent: timeSpent,
        scroll_depth: maxScrollDepth.current,
        total_pages_visited: pagesVisited.length,
        pages_visited: pagesVisited,
        user_role: getUserRole(),
        exit_url: document.activeElement instanceof HTMLAnchorElement 
          ? document.activeElement.href 
          : null,
      },
      referrer: document.referrer || null,
      device_type: getDeviceType(),
    });

    // Try to use sendBeacon for reliable exit tracking
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_journey_events`,
        new Blob([data], { type: "application/json" })
      );
    }
  }, [user, location.pathname]);

  // Track page views on route change
  useEffect(() => {
    pageStartTime.current = Date.now();
    maxScrollDepth.current = 0;
    trackPageView();
  }, [location.pathname, trackPageView]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollHeight > 0 
        ? Math.round((window.scrollY / scrollHeight) * 100) 
        : 0;
      
      if (scrollPercent > maxScrollDepth.current) {
        maxScrollDepth.current = scrollPercent;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track exit on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackExit();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [trackExit]);

  return {
    trackEvent,
    trackPageView,
    trackPropertyView,
    trackCommunityView,
    trackSearch,
    trackFavorite,
    trackInquiry,
    trackToolUsage,
    trackClick,
    trackExit,
    trackRoleSelection,
    trackFormSubmission,
    sessionId: sessionId.current,
  };
}

// Need to import useRef
import { useRef } from "react";

// Export a singleton for use outside React components
export const trackingUtils = {
  getSessionId,
  getDeviceType,
  getUserRole,
  getApproximateLocation,
};
