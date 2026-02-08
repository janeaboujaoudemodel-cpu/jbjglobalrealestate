import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  loading: boolean;
  /** True if authenticated user is verified as the Owner (server-verified) */
  isOwner: boolean;
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
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    let applySeq = 0;
    let lastSettledSeq = 0;

    const verifyOwner = async (): Promise<boolean> => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-owner");
        if (error) {
          console.error("verify-owner error:", error);
          return false;
        }
        return data?.isOwner === true;
      } catch (err) {
        console.error("verify-owner failed:", err);
        return false;
      }
    };

    const applySession = async (nextSession: Session | null) => {
      const seq = ++applySeq;
      if (!mounted) return;

      setLoading(true);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      // Fail closed by default
      let nextIsOwner = false;

      // Only verify Owner when authenticated
      if (nextSession?.user) {
        nextIsOwner = await verifyOwner();
      }

      if (!mounted || seq !== applySeq) return;

      setIsOwner(nextIsOwner);
      setLoading(false);
      lastSettledSeq = seq;

      if (nextSession?.user?.email) {
        console.info("Owner check resolved", {
          email: nextSession.user.email,
          isOwner: nextIsOwner,
        });
      }
    };

    // Safety timeout - force loading to false after 5 seconds to prevent infinite loading
    // NOTE: do NOT rely on React state in this closure (it will be stale).
    timeoutId = setTimeout(() => {
      if (mounted && lastSettledSeq < applySeq) {
        console.warn("Auth loading timeout - forcing completion");
        setLoading(false);
      }
    }, 5000);

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
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

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
        isOwner,
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
