import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const LEAD_STORAGE_KEY = "jj_captured_lead";

function getLeadEmail(): string | null {
  try {
    const stored = localStorage.getItem(LEAD_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.email || null;
  } catch {
    return null;
  }
}

async function logActivity(
  leadEmail: string,
  eventType: string,
  eventData: Record<string, unknown> = {},
  pageUrl?: string
) {
  try {
    await supabase.from("user_activity_log").insert({
      lead_email: leadEmail,
      event_type: eventType,
      activity_type: eventType,
      activity_data: eventData as any,
      page_path: pageUrl ?? window.location.href,
    });
  } catch {
    // Silent — tracking must never break the user flow
  }
}

export function useActivityTracking() {
  const startTimeRef = useRef<number>(Date.now());

  // Fire page_view on mount
  useEffect(() => {
    const email = getLeadEmail();
    if (!email) return;

    startTimeRef.current = Date.now();

    logActivity(email, "page_view", {
      referrer: document.referrer || null,
      title: document.title,
    });

    return () => {
      // Fire time_on_page on unmount
      const seconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      void logActivity(email, "time_on_page", { duration_seconds: seconds });
    };
  }, []);

  const trackEvent = useCallback(
    (eventType: string, data: Record<string, unknown> = {}) => {
      const email = getLeadEmail();
      if (!email) return;
      void logActivity(email, eventType, data);
    },
    []
  );

  return { trackEvent };
}
