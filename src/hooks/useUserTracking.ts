import { useState, useEffect, useCallback, useRef } from "react";
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

// ── Event Queue for batching ──
interface QueuedEvent {
  user_id: string | null;
  session_id: string;
  event_type: string;
  page_path: string;
  event_data: Record<string, unknown> | null;
  referrer: string | null;
  device_type: string | null;
}

const EVENT_QUEUE: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const BATCH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 20;

async function flushEventQueue() {
  if (EVENT_QUEUE.length === 0) return;
  const batch = EVENT_QUEUE.splice(0, MAX_BATCH_SIZE);
  try {
    const { error } = await supabase
      .from("user_journey_events")
      .insert(batch.map(e => ({
        ...e,
        event_data: e.event_data as any,
      })));
    if (error) console.error("Batch insert error:", error);
  } catch (err) {
    console.error("Batch flush failed:", err);
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEventQueue();
  }, BATCH_INTERVAL_MS);
}

// Map session to email when user identifies
export function linkSessionToEmail(email: string) {
  const sid = getSessionId();
  try {
    // Fire-and-forget: update past events with this session to have the email
    supabase
      .from("user_journey_events")
      .update({ event_data: supabase.rpc ? undefined : undefined }) // can't update event_data easily; instead store mapping
      .eq("session_id", sid);
  } catch {
    // silent
  }
  // Store locally for future correlation
  sessionStorage.setItem("jbj_identified_email", email);
}

export function useUserTracking() {
  const { user } = useAuth();
  const location = useLocation();
  const pageStartTime = useRef<number>(Date.now());
  const maxScrollDepth = useRef<number>(0);
  const sessionId = useRef<string>(getSessionId());

  // Track event with batching
  const trackEvent = useCallback((
    eventType: string,
    eventData: EventData = {}
  ) => {
    const pagesVisited = trackPageVisited(location.pathname);
    const userRole = getUserRole();
    const timezone = getApproximateLocation();

    EVENT_QUEUE.push({
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

    if (EVENT_QUEUE.length >= MAX_BATCH_SIZE) {
      flushEventQueue();
    } else {
      scheduleFlush();
    }
  }, [user, location.pathname]);

  // Track page view
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

  // Track user role selection
  const trackRoleSelection = useCallback((role: string) => {
    localStorage.setItem("jbj_user_role", role);
    trackEvent("role_selection", {
      selected_role: role,
    });
  }, [trackEvent]);

  // Track form submission
  const trackFormSubmission = useCallback((formName: string, formData?: Record<string, any>) => {
    trackEvent("form_submission", {
      form_name: formName,
      form_source: location.pathname,
      ...formData,
    });
  }, [trackEvent, location.pathname]);

  // Track exit (uses sendBeacon for reliability)
  const trackExit = useCallback(() => {
    // Flush remaining queued events
    flushEventQueue();

    const timeSpent = Math.round((Date.now() - pageStartTime.current) / 1000);
    const pagesVisited = trackPageVisited(location.pathname);

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
    const handleBeforeUnload = () => trackExit();
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

// Export utilities for use outside React components
export const trackingUtils = {
  getSessionId,
  getDeviceType,
  getUserRole,
  getApproximateLocation,
};
