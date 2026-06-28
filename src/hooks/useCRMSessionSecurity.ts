import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ELEVATED_SESSION_MS = 10 * 60 * 1000; // 10 minutes after re-auth

interface UseCRMSessionSecurityReturn {
  isIdle: boolean;
  isElevated: boolean;
  requireReAuth: (action: string) => boolean;
  grantElevatedAccess: () => void;
  logSecurityEvent: (eventType: string, details?: Record<string, unknown>) => Promise<void>;
  resetIdleTimer: () => void;
}

export function useCRMSessionSecurity(): UseCRMSessionSecurityReturn {
  const { user } = useAuth();
  const [isIdle, setIsIdle] = useState(false);
  const [elevatedUntil, setElevatedUntil] = useState<number | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const isElevated = elevatedUntil ? Date.now() < elevatedUntil : false;

  const SENSITIVE_ACTIONS = [
    "export_leads",
    "delete_leads",
    "bulk_assign",
    "change_permissions",
    "reveal_masked_field",
    "api_credential_change",
  ];

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
      if (user) {
        logSecurityEventDirect(user.id, "session_idle", { timeout_ms: IDLE_TIMEOUT_MS });
      }
    }, IDLE_TIMEOUT_MS);
  }, [user]);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    let lastResetAt = 0;
    let idleResetTimer: ReturnType<typeof setTimeout> | undefined;
    const throttledResetIdleTimer = () => {
      const now = Date.now();
      if (now - lastResetAt > 1000) {
        lastResetAt = now;
        resetIdleTimer();
        return;
      }
      if (idleResetTimer) return;
      idleResetTimer = setTimeout(() => {
        idleResetTimer = undefined;
        lastResetAt = Date.now();
        resetIdleTimer();
      }, 1000 - (now - lastResetAt));
    };
    events.forEach(e => document.addEventListener(e, throttledResetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach(e => document.removeEventListener(e, throttledResetIdleTimer));
      if (idleResetTimer) clearTimeout(idleResetTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  const requireReAuth = useCallback((action: string): boolean => {
    if (isElevated) return false;
    return SENSITIVE_ACTIONS.includes(action);
  }, [isElevated]);

  const grantElevatedAccess = useCallback(() => {
    setElevatedUntil(Date.now() + ELEVATED_SESSION_MS);
    if (user) {
      logSecurityEventDirect(user.id, "elevated_access_granted", {});
    }
  }, [user]);

  const logSecurityEvent = useCallback(async (eventType: string, details: Record<string, unknown> = {}) => {
    if (!user) return;
    await logSecurityEventDirect(user.id, eventType, details);
  }, [user]);

  return { isIdle, isElevated, requireReAuth, grantElevatedAccess, logSecurityEvent, resetIdleTimer };
}

async function logSecurityEventDirect(userId: string, eventType: string, details: Record<string, unknown>) {
  try {
    await supabase.from("crm_security_events").insert([{
      user_id: userId,
      event_type: eventType,
      details: details as any,
      user_agent: navigator.userAgent,
    }]);
  } catch {
    console.error("Failed to log security event");
  }
}
