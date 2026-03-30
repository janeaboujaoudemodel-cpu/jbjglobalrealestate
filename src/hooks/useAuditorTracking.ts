import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PageEntry {
  path: string;
  entered_at: string;
  left_at?: string;
  time_spent_seconds?: number;
}

interface ActionEntry {
  action: string;
  target: string;
  timestamp: string;
}

export function useAuditorTracking() {
  const { user, isAuditor, isOwner } = useAuth();
  const location = useLocation();
  const sessionId = useRef<string | null>(null);
  const currentPage = useRef<PageEntry | null>(null);
  const pages = useRef<PageEntry[]>([]);
  const actions = useRef<ActionEntry[]>([]);
  const sessionStart = useRef<number>(Date.now());
  const flushInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const isActive = isAuditor && !isOwner && !!user;

  // Create session on mount
  useEffect(() => {
    if (!isActive) return;

    const createSession = async () => {
      const { data, error } = await supabase
        .from("auditor_sessions")
        .insert({
          auditor_user_id: user!.id,
          session_start: new Date().toISOString(),
          device_type: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
        } as any)
        .select("id")
        .single();

      if (!error && data) {
        sessionId.current = (data as any).id;
      }
    };

    createSession();
    sessionStart.current = Date.now();

    return () => {
      flushSession();
    };
  }, [isActive]);

  // Flush session data periodically
  useEffect(() => {
    if (!isActive) return;

    flushInterval.current = setInterval(() => {
      flushSession();
    }, 10000);

    return () => {
      if (flushInterval.current) clearInterval(flushInterval.current);
    };
  }, [isActive]);

  const flushSession = useCallback(async () => {
    if (!sessionId.current) return;

    // Close current page
    if (currentPage.current && !currentPage.current.left_at) {
      currentPage.current.left_at = new Date().toISOString();
      currentPage.current.time_spent_seconds = Math.round(
        (Date.now() - new Date(currentPage.current.entered_at).getTime()) / 1000
      );
    }

    const totalTime = Math.round((Date.now() - sessionStart.current) / 1000);

    try {
      await supabase
        .from("auditor_sessions")
        .update({
          pages_visited: [...pages.current, ...(currentPage.current ? [currentPage.current] : [])] as any,
          actions_log: actions.current as any,
          total_time_seconds: totalTime,
          session_end: new Date().toISOString(),
        })
        .eq("id", sessionId.current);
    } catch {
      // silent
    }
  }, []);

  // Track page changes
  useEffect(() => {
    if (!isActive) return;

    // Close previous page
    if (currentPage.current) {
      currentPage.current.left_at = new Date().toISOString();
      currentPage.current.time_spent_seconds = Math.round(
        (Date.now() - new Date(currentPage.current.entered_at).getTime()) / 1000
      );
      pages.current.push(currentPage.current);
    }

    // Start new page
    currentPage.current = {
      path: location.pathname,
      entered_at: new Date().toISOString(),
    };
  }, [location.pathname, isActive]);

  // Track clicks
  useEffect(() => {
    if (!isActive) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const label =
        target.closest("button")?.textContent?.trim()?.substring(0, 50) ||
        target.closest("a")?.textContent?.trim()?.substring(0, 50) ||
        target.tagName;

      actions.current.push({
        action: "click",
        target: label || "unknown",
        timestamp: new Date().toISOString(),
      });

      // Keep actions list manageable
      if (actions.current.length > 500) {
        actions.current = actions.current.slice(-300);
      }
    };

    document.addEventListener("click", handleClick, { passive: true });
    return () => document.removeEventListener("click", handleClick);
  }, [isActive]);

  // Flush on unload
  useEffect(() => {
    if (!isActive) return;

    const handleUnload = () => {
      if (!sessionId.current) return;

      if (currentPage.current) {
        currentPage.current.left_at = new Date().toISOString();
        currentPage.current.time_spent_seconds = Math.round(
          (Date.now() - new Date(currentPage.current.entered_at).getTime()) / 1000
        );
      }

      const totalTime = Math.round((Date.now() - sessionStart.current) / 1000);
      const payload = JSON.stringify({
        pages_visited: [...pages.current, ...(currentPage.current ? [currentPage.current] : [])],
        actions_log: actions.current,
        total_time_seconds: totalTime,
        session_end: new Date().toISOString(),
      });

      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/auditor_sessions?id=eq.${sessionId.current}`,
        new Blob([payload], { type: "application/json" })
      );
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [isActive]);
}
