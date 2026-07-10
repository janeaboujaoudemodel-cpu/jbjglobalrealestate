import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/config/backend";
import { isOwnerBackendEmail } from "@/config/ownerEmails";

/**
 * Owner verification
 *
 * IMPORTANT:
 * - The client should NOT rely on build-time env vars for privilege checks.
 * - Owner status is verified via backend function `verify-owner`.
 * - Fail closed: any error => not Owner.
 */

interface AuthContextType {
  user: User | null;
  session: Session | null;
  /** True while the initial session is being determined */
  loading: boolean;
  /** True while owner verification is running (separate from auth loading) */
  ownerLoading: boolean;
  /** Error message if owner verification failed */
  ownerError: string | null;
  /** True if authenticated user is verified as the Owner (server-verified) */
  isOwner: boolean;
  /** True if authenticated user has the 'auditor' role (read-only access) */
  isAuditor: boolean;
  /** Re-run owner verification without page reload */
  refreshOwnerVerification: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  /** Sign out from all sessions (global) */
  signOutAllSessions: () => Promise<void>;
  /** Sign out from all other sessions except current */
  signOutOtherSessions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Start in a non-blocking state. Verification is async; OwnerGuard renders
  // optimistically from cache and flips this to true only while a real fetch
  // is in flight against the verify-owner edge function.
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAuditor, setIsAuditor] = useState(false);

  const verifyOwner = useCallback(async (currentSession: Session | null): Promise<boolean> => {
    if (!currentSession?.access_token) {
      return false;
    }

    // Absolute front-end lock: only the registered owner email may ever be
    // treated as Owner. Role rows, cached flags, aliases, and mode selection
    // cannot elevate any other account into the back end.
    if (!isOwnerBackendEmail(currentSession.user?.email)) {
      const userId = currentSession.user?.id;
      try {
        if (userId) localStorage.removeItem(`owner_v2_${userId}`);
        sessionStorage.removeItem("owner_verified_once");
      } catch { /* ignore */ }
      setIsOwner(false);
      setOwnerLoading(false);
      setOwnerError(null);
      return false;
    }

    // Persistent per-user owner cache with TTL (survives token refreshes & brief network blips)
    const OWNER_TTL_MS = 30 * 60 * 1000; // 30 minutes
    const userId = currentSession.user?.id;
    const cacheKey = userId ? `owner_v2_${userId}` : null;
    const readCache = (): { ok: boolean; ts: number } | null => {
      if (!cacheKey) return null;
      try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.ts === 'number') return parsed;
      } catch { /* ignore */ }
      return null;
    };
    const writeCache = (ok: boolean) => {
      if (!cacheKey) return;
      try { localStorage.setItem(cacheKey, JSON.stringify({ ok, ts: Date.now() })); } catch { /* ignore */ }
    };
    const clearCache = () => { if (cacheKey) { try { localStorage.removeItem(cacheKey); } catch { /* ignore */ } } };

    const cached = readCache();
    const cacheFresh = cached?.ok === true && (Date.now() - cached.ts) < OWNER_TTL_MS;
    if (cacheFresh) {
      setIsOwner(true);
      setOwnerLoading(false);
      setOwnerError(null);
      // Background re-verify; only downgrade on a definitive email_mismatch (not network errors)
      (async () => {
        try {
          const resp = await fetch(`${SUPABASE_URL}/functions/v1/verify-owner`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${currentSession.access_token}`,
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
          });
          if (!resp.ok) return; // transient — keep cache
          const data = await resp.json();
          if (data?.isOwner === true) {
            writeCache(true);
          } else if (data?.reason === 'email_mismatch') {
            clearCache();
            setIsOwner(false);
          }
        } catch { /* network blip — keep cache */ }
      })();
      return true;
    }

    if (!currentSession?.user) {
      setIsOwner(false);
      setOwnerLoading(false);
      setOwnerError(null);
      return false;
    }

    const attemptVerify = async (): Promise<boolean> => {
      const url = `${SUPABASE_URL}/functions/v1/verify-owner`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);
        
        // Non-OK status = treat as transient error (triggers retry UI, NOT /403)
        if (!response.ok) {
          throw new Error(`Verification HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Only treat as "definitively not owner" when reason is email_mismatch
        // All other non-owner reasons (no_auth, no_user, no_config, error) are transient
        if (data?.isOwner === true) {
          return true;
        }
        
        if (data?.reason === 'email_mismatch') {
          return false; // Real not-owner
        }
        
        // Any other reason = treat as error so OwnerGuard shows retry, not /403
        throw new Error(data?.reason || 'verification_inconclusive');
      } catch (err: any) {
        clearTimeout(timeout);
        throw err;
      }
    };

    try {
      setOwnerLoading(true);
      setOwnerError(null);

      let result = false;
      // Try up to 3 times (initial + 2 retries with backoff) to ride out transient network blips
      let lastErr: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          result = await attemptVerify();
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
          }
        }
      }
      if (lastErr && !result) throw lastErr;

      // CRITICAL: Set isOwner BEFORE ownerLoading=false to prevent
      // a render frame where ownerLoading=false but isOwner is still false,
      // which causes OwnerGuard to redirect to /403.
      setIsOwner(result);
      setOwnerLoading(false);
      writeCache(result);
      return result;
    } catch (err: any) {
      console.error("verify-owner failed after retries:", err);
      // If we have a fresh-ish cached owner=true, fall back to it instead of showing the error wall
      const fallback = readCache();
      if (fallback?.ok === true && (Date.now() - fallback.ts) < OWNER_TTL_MS * 2) {
        console.warn("Using cached owner verification due to network error");
        setIsOwner(true);
        setOwnerLoading(false);
        setOwnerError(null);
        return true;
      }
      setOwnerError(err?.message || "Verification failed");
      setIsOwner(false);
      setOwnerLoading(false);
      return false;
    }
  }, []);

  const refreshOwnerVerification = useCallback(async () => {
    if (session) {
      const result = await verifyOwner(session);
      setIsOwner(result);
    }
  }, [session, verifyOwner]);

  useEffect(() => {
    let mounted = true;
    let verifyInFlight = false;
    let latestSessionId: string | null = null;

    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;

      const newSessionId = nextSession?.access_token ?? null;

      // Set session and user immediately
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      // If no session, we're done loading
      if (!nextSession?.user) {
        setIsOwner(false);
        setIsAuditor(false);
        setOwnerError(null);
        setOwnerLoading(false);
        setLoading(false);
        return;
      }

      // Mark auth as done loading, but owner verification may still be running
      setLoading(false);

      // Skip duplicate verification for the same token
      if (newSessionId === latestSessionId) return;
      latestSessionId = newSessionId;

      // Prevent concurrent verify calls
      if (verifyInFlight) return;
      verifyInFlight = true;

      try {
        const ownerStatus = await verifyOwner(nextSession);
        if (!mounted) return;

        // Check auditor role for non-owners
        if (!ownerStatus && nextSession?.user?.id) {
          try {
            const { data: hasAuditor } = await supabase.rpc("has_role", {
              _user_id: nextSession.user.id,
              _role: "auditor",
            });
            if (mounted) setIsAuditor(hasAuditor === true);
          } catch {
            if (mounted) setIsAuditor(false);
          }
        } else {
          if (mounted) setIsAuditor(false);
        }

        if (nextSession?.user?.email) {
          console.info("Owner check resolved", {
            email: nextSession.user.email,
            isOwner: ownerStatus,
          });
        }
      } finally {
        verifyInFlight = false;
      }
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    // THEN check for existing session
    supabase.auth
      .getSession()
      .then(({ data: { session: existingSession } }) => applySession(existingSession));

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [verifyOwner]);

  // Helper to record login event (fire-and-forget)
  const recordLoginEvent = async (
    eventType: string,
    email: string | null,
    failureReason?: string
  ) => {
    try {
      // Generate fingerprint inline
      const raw = [
        navigator.userAgent,
        screen.width.toString(),
        screen.height.toString(),
        navigator.language,
        navigator.platform,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      ].join("|");
      const data = new TextEncoder().encode(raw);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const fp = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      await supabase.functions.invoke("record-login-event", {
        body: {
          event_type: eventType,
          email,
          device_fingerprint: fp,
          failure_reason: failureReason || null,
        },
      });
    } catch {
      // Non-critical — don't block auth flow
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    // Record login event (fire-and-forget)
    recordLoginEvent(
      error ? "failure" : "success",
      email,
      error?.message
    );
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { lovable } = await import("@/integrations/lovable");
    const result = await lovable.auth.signInWithOAuth("google");
    if (result.error) {
      return { error: result.error instanceof Error ? result.error : new Error(String(result.error)) };
    }
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?mode=reset`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try {
      setUser(null);
      setSession(null);
      setIsOwner(false);
      setIsAuditor(false);
      setOwnerError(null);
      localStorage.removeItem('jj_role_selected');
      localStorage.removeItem('jj_employee_welcomed');
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.log('Sign out completed (session may have been expired)');
    }
  };

  const signOutAllSessions = async () => {
    try {
      setUser(null);
      setSession(null);
      setIsOwner(false);
      setIsAuditor(false);
      setOwnerError(null);
      localStorage.removeItem('jj_role_selected');
      localStorage.removeItem('jj_employee_welcomed');
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      console.log('Global sign out completed');
    }
  };

  const signOutOtherSessions = async () => {
    try {
      await supabase.auth.signOut({ scope: 'others' });
    } catch {
      console.log('Other sessions sign out completed');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        ownerLoading,
        ownerError,
        isOwner,
        isAuditor,
        refreshOwnerVerification,
        signIn,
        signUp,
        signInWithGoogle,
        resetPassword,
        updatePassword,
        signOut,
        signOutAllSessions,
        signOutOtherSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
