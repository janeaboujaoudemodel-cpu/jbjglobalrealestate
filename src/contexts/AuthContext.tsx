import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  /** Re-run owner verification without page reload */
  refreshOwnerVerification: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerLoading, setOwnerLoading] = useState(true);
  const [ownerError, setOwnerError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const verifyOwner = useCallback(async (currentSession: Session | null): Promise<boolean> => {
    if (!currentSession?.access_token) {
      return false;
    }

    const attemptVerify = async (): Promise<boolean> => {
      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) => {
        setTimeout(() => reject(new Error("Owner verification timeout")), 15000);
      });

      const result = await Promise.race([
        supabase.functions.invoke("verify-owner", {
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
          },
        }),
        timeoutPromise,
      ]);

      if (result.error) {
        throw new Error(result.error.message || "Verification failed");
      }

      return result.data?.isOwner === true;
    };

    try {
      setOwnerLoading(true);
      setOwnerError(null);

      // Try up to 2 times (initial + 1 retry)
      try {
        return await attemptVerify();
      } catch (firstErr) {
        console.warn("verify-owner attempt 1 failed, retrying...", firstErr);
        // Wait 1s then retry
        await new Promise(r => setTimeout(r, 1000));
        return await attemptVerify();
      }
    } catch (err: any) {
      console.error("verify-owner failed after retries:", err);
      setOwnerError(err?.message || "Verification failed");
      return false;
    } finally {
      setOwnerLoading(false);
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
    let applySeq = 0;

    const applySession = async (nextSession: Session | null) => {
      const seq = ++applySeq;
      if (!mounted) return;

      // Set session and user immediately
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      // If no session, we're done loading
      if (!nextSession?.user) {
        setIsOwner(false);
        setOwnerError(null);
        setOwnerLoading(false);
        setLoading(false);
        return;
      }

      // Mark auth as done loading, but owner verification may still be running
      setLoading(false);

      // Now verify owner status
      const ownerStatus = await verifyOwner(nextSession);

      if (!mounted || seq !== applySeq) return;

      setIsOwner(ownerStatus);

      if (nextSession?.user?.email) {
        console.info("Owner check resolved", {
          email: nextSession.user.email,
          isOwner: ownerStatus,
        });
      }
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Fire-and-forget; applySession handles loading state.
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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
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
      // Clear local state first to ensure UI updates immediately
      setUser(null);
      setSession(null);
      setIsOwner(false);
      setOwnerError(null);
      
      // Clear any role selection from localStorage
      localStorage.removeItem('jj_role_selected');
      localStorage.removeItem('jj_employee_welcomed');
      
      // Attempt to sign out - ignore errors if session already expired
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      // Session may already be invalid - that's fine, just clear local state
      console.log('Sign out completed (session may have been expired)');
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
        refreshOwnerVerification,
        signIn,
        signUp,
        signInWithGoogle,
        resetPassword,
        updatePassword,
        signOut,
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
