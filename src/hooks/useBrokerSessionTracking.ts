/**
 * useBrokerSessionTracking
 * --------------------------------------------------------------
 * Hooks the authenticated broker into the crm-broker-session-track
 * edge function. Responsibilities:
 *   - Build a stable device fingerprint (UA + screen + tz + persistent salt)
 *   - Register a session on login (or refresh an existing one)
 *   - Heartbeat every 90s to refresh last_seen_at
 *   - On 403 ("Device blocked" / "Account blocked" / revoked) force sign-out
 *   - Persist the opaque session_token in localStorage (not the hash)
 *
 * This is invoked from BrokerGuard so it only runs for confirmed brokers.
 * Owners are also brokers (see BrokerGuard); tracking them is harmless.
 */
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const LS_TOKEN_KEY = "crm.broker.session.token";
const LS_FP_KEY = "crm.broker.device.fp";
const HEARTBEAT_MS = 90_000;

function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  // Lightweight, no external dep
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Safari\//.test(ua) ? "Safari" : "Browser";
  const os =
    /Windows/.test(ua) ? "Windows" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Android/.test(ua) ? "Android" :
    /iPhone|iPad|iPod/.test(ua) ? "iOS" :
    /Linux/.test(ua) ? "Linux" : "Unknown OS";
  return `${browser} · ${os}`;
}

async function getDeviceFingerprint(): Promise<string> {
  const cached = localStorage.getItem(LS_FP_KEY);
  if (cached) return cached;
  const salt = crypto.randomUUID();
  const raw = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    salt,
  ].join("|");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  localStorage.setItem(LS_FP_KEY, hex);
  return hex;
}

export function useBrokerSessionTracking(enabled: boolean) {
  const { user } = useAuth();
  const startedRef = useRef(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !user) {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
      startedRef.current = false;
      return;
    }

    let cancelled = false;

    const callTrack = async (existing?: string | null) => {
      const fp = await getDeviceFingerprint();
      const { data, error } = await supabase.functions.invoke("crm-broker-session-track", {
        body: {
          device_fingerprint: fp,
          device_label: getDeviceLabel(),
          existing_session_token: existing ?? null,
        },
      });
      if (cancelled) return;
      // 403 → blocked / revoked → sign out immediately
      const errMsg = (error as any)?.message || (data as any)?.error;
      const status = (error as any)?.context?.status;
      if (status === 403 || /blocked|revoked|not a broker/i.test(String(errMsg ?? ""))) {
        localStorage.removeItem(LS_TOKEN_KEY);
        await supabase.auth.signOut();
        window.location.href = "/auth";
        return;
      }
      if (data?.session_token && data.session_token !== existing) {
        localStorage.setItem(LS_TOKEN_KEY, data.session_token);
      }
    };

    if (!startedRef.current) {
      startedRef.current = true;
      const existing = localStorage.getItem(LS_TOKEN_KEY);
      callTrack(existing);
    }

    heartbeatRef.current = setInterval(() => {
      const tok = localStorage.getItem(LS_TOKEN_KEY);
      callTrack(tok);
    }, HEARTBEAT_MS);

    return () => {
      cancelled = true;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    };
  }, [enabled, user?.id]);
}
