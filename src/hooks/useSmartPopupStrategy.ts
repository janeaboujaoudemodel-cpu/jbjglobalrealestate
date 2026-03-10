/**
 * Smart Lead Popup Strategy Hook
 * Behavior-based popup timing with frequency caps and context-aware messaging
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEYS = {
  showCount: "lead_popup_show_count",
  lastDismissed: "lead_popup_last_dismissed",
  sessionPages: "lead_popup_session_pages",
  sessionShown: "lead_popup_session_shown",
  submitted: "lead_popup_submitted",
};

const MAX_TOTAL_SHOWS = 3;
const COOLDOWN_DAYS = 2;
const FIRST_VISIT_DELAY_MS = 1500;
const PROPERTY_PAGE_THRESHOLD = 1;
const SESSION_PAGE_THRESHOLD = 2;
const SCROLL_THRESHOLD = 0.2;

export type PopupContext = "properties" | "ai" | "news" | "default";

interface SmartPopupState {
  shouldShow: boolean;
  context: PopupContext;
  headline: string;
  subtitle: string;
}

const CONTEXT_MESSAGES: Record<PopupContext, { headline: string; subtitle: string }> = {
  properties: {
    headline: "Found Something You Like?",
    subtitle: "Register to save listings, get price alerts, and connect with our experts.",
  },
  ai: {
    headline: "Unlock Full AI Access",
    subtitle: "Get unlimited AI tools, market analysis, and smart recommendations.",
  },
  news: {
    headline: "Get Market Updates Delivered",
    subtitle: "Stay ahead with daily insights from Dubai Land Department and top sources.",
  },
  default: {
    headline: "Unlock Premium Features",
    subtitle: "Get full access to AI tools, market reports, and exclusive listings.",
  },
};

function getStoredNumber(key: string): number {
  try {
    return parseInt(localStorage.getItem(key) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function isInCooldown(): boolean {
  try {
    const lastDismissed = localStorage.getItem(STORAGE_KEYS.lastDismissed);
    if (!lastDismissed) return false;
    const dismissedAt = parseInt(lastDismissed, 10);
    const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - dismissedAt < cooldownMs;
  } catch {
    return false;
  }
}

function hasExceededMaxShows(): boolean {
  return getStoredNumber(STORAGE_KEYS.showCount) >= MAX_TOTAL_SHOWS;
}

function wasShownThisSession(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.sessionShown) === "1";
  } catch {
    return false;
  }
}

function detectContext(pathname: string): PopupContext {
  if (pathname.startsWith("/properties") || pathname.startsWith("/projects") || pathname.startsWith("/areas")) {
    return "properties";
  }
  if (pathname.startsWith("/ai") || pathname.includes("calculator") || pathname.includes("tool")) {
    return "ai";
  }
  if (pathname.startsWith("/news")) {
    return "news";
  }
  return "default";
}

export function useSmartPopupStrategy(): SmartPopupState & {
  markShown: () => void;
  markDismissed: () => void;
  markSubmitted: () => void;
} {
  const location = useLocation();
  const [shouldShow, setShouldShow] = useState(false);
  const [context, setContext] = useState<PopupContext>("default");
  const scrollListenerRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track page views per session
  useEffect(() => {
    try {
      const current = getStoredNumber(STORAGE_KEYS.sessionPages);
      sessionStorage.setItem(STORAGE_KEYS.sessionPages, String(current + 1));
    } catch {
      // ignore
    }
  }, [location.pathname]);

  // Detect context from current route
  useEffect(() => {
    setContext(detectContext(location.pathname));
  }, [location.pathname]);

  // Check if user already submitted the lead form — only gate
  const hasSubmitted = useCallback(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.submitted) === "1";
    } catch {
      return false;
    }
  }, []);

  // Main strategy logic
  useEffect(() => {
    // Only stop showing if user has submitted the form
    if (hasSubmitted() || hasExceededMaxShows() || isInCooldown() || wasShownThisSession()) return;

    const currentContext = detectContext(location.pathname);
    const sessionPages = getStoredNumber(STORAGE_KEYS.sessionPages);

    // Rule 1: First visit on homepage — show after delay
    if (location.pathname === "/") {
      timerRef.current = setTimeout(() => {
        if (!wasShownThisSession()) setShouldShow(true);
      }, FIRST_VISIT_DELAY_MS);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // Rule 2: High session page count
    if (sessionPages >= SESSION_PAGE_THRESHOLD) {
      setShouldShow(true);
      return;
    }

    // Rule 3: Property browsing threshold
    if (currentContext === "properties" && sessionPages >= PROPERTY_PAGE_THRESHOLD) {
      setShouldShow(true);
      return;
    }

    // Rule 4: Scroll-based trigger on project detail pages
    if (location.pathname.startsWith("/project/") || location.pathname.startsWith("/properties/")) {
      const handleScroll = () => {
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        if (scrollPercent >= SCROLL_THRESHOLD && !wasShownThisSession()) {
          setShouldShow(true);
          if (scrollListenerRef.current) {
            window.removeEventListener("scroll", scrollListenerRef.current);
          }
        }
      };
      scrollListenerRef.current = handleScroll;
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }
  }, [location.pathname, isAuthenticated]);

  const markShown = useCallback(() => {
    try {
      const count = getStoredNumber(STORAGE_KEYS.showCount) + 1;
      localStorage.setItem(STORAGE_KEYS.showCount, String(count));
      sessionStorage.setItem(STORAGE_KEYS.sessionShown, "1");
    } catch {
      // ignore
    }
  }, []);

  const markDismissed = useCallback(() => {
    setShouldShow(false);
    try {
      localStorage.setItem(STORAGE_KEYS.lastDismissed, String(Date.now()));
      sessionStorage.setItem(STORAGE_KEYS.sessionShown, "1");
    } catch {
      // ignore
    }
  }, []);

  const messages = CONTEXT_MESSAGES[context];

  return {
    shouldShow,
    context,
    headline: messages.headline,
    subtitle: messages.subtitle,
    markShown,
    markDismissed,
  };
}
