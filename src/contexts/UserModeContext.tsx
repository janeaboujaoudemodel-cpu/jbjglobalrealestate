import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MODE_KEY = "jj_user_mode";
const MODE_SELECTED_KEY = "jj_mode_selected";

// Strictly 3 categories. Legacy 'investor_broker' rows are normalized to 'broker'
// (broker is the more privileged surface, so existing combined users keep access).
export type UserMode = 'investor' | 'broker' | 'developer';

interface UserModeContextType {
  mode: UserMode;
  isLoading: boolean;
  setMode: (mode: UserMode) => Promise<void>;
  isInvestorMode: boolean;
  isBrokerMode: boolean;
  /** @deprecated Combined mode removed. Always false — kept for back-compat. */
  isCombinedMode: boolean;
  isDeveloperMode: boolean;
  hasMadeInitialSelection: boolean;
}

const UserModeContext = createContext<UserModeContextType | undefined>(undefined);

// Map legacy values: 'client' -> 'investor', 'investor_broker' -> 'broker'.
const normalizeMode = (value: string | null): UserMode => {
  if (value === 'broker' || value === 'investor_broker') return 'broker';
  if (value === 'developer') return 'developer';
  return 'investor';
};

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UserMode>(() => {
    if (typeof window === 'undefined') return 'investor';
    const stored = localStorage.getItem(MODE_KEY);
    return normalizeMode(stored);
  });
  // Mode is read synchronously from localStorage in the initial useState above,
  // so `isLoading` is effectively false after first render. We keep the flag for
  // API compatibility but never set it back to true on subsequent auth churn —
  // that was the source of the broker/academy/company tile blink.
  const [isLoading] = useState(false);
  const [hasMadeInitialSelection, setHasMadeInitialSelection] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(MODE_SELECTED_KEY) === 'true';
  });
  const { user } = useAuth();
  const lastSyncedUserId = useRef<string | null>(null);

  // Silent background reconcile — only runs once per real user-id change
  // (TOKEN_REFRESHED churn won't re-fire it). Never toggles isLoading.
  useEffect(() => {
    const userId = user?.id ?? null;
    if (userId === lastSyncedUserId.current) return;
    lastSyncedUserId.current = userId;
    if (!userId) return;

    const reconcile = async () => {
      const storedMode = localStorage.getItem(MODE_KEY);
      const storedSelection = localStorage.getItem(MODE_SELECTED_KEY);

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('selected_mode')
          .eq('user_id', userId)
          .maybeSingle();

        if (data?.selected_mode) {
          // Only adopt DB mode if localStorage has NO mode at all (first visit / cleared)
          if (!storedMode) {
            const dbMode = normalizeMode(data.selected_mode);
            console.info('[UserMode] Adopting DB mode (no local mode set):', dbMode);
            setModeState(dbMode);
            localStorage.setItem(MODE_KEY, dbMode);
            setHasMadeInitialSelection(true);
            localStorage.setItem(MODE_SELECTED_KEY, 'true');
          } else if (storedSelection === 'true') {
            // User has an explicit local selection — push it to DB to keep in sync
            const localMode = normalizeMode(storedMode);
            if (data.selected_mode !== localMode) {
              await supabase
                .from('user_preferences')
                .upsert({
                  user_id: userId,
                  selected_mode: localMode,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            }
          }
        } else if (!error && storedSelection === 'true' && storedMode) {
          // First write to DB only when the user has EXPLICITLY chosen a mode.
          const currentMode = normalizeMode(storedMode);
          await supabase
            .from('user_preferences')
            .insert({
              user_id: userId,
              selected_mode: currentMode
            });
          try {
            await supabase.functions.invoke('register-mode-lead', { body: { mode: currentMode } });
          } catch (e) {
            console.warn('[UserMode] register-mode-lead (first sync) failed', e);
          }
        }
      } catch (err) {
        console.error('Error reconciling user mode:', err);
      }
    };

    reconcile();
  }, [user?.id]);

  const setMode = useCallback(async (newMode: UserMode) => {
    console.info('[UserMode] setMode by user:', newMode);
    // Optimistic update
    setModeState(newMode);
    localStorage.setItem(MODE_KEY, newMode);
    
    // Mark as explicitly selected
    setHasMadeInitialSelection(true);
    localStorage.setItem(MODE_SELECTED_KEY, 'true');

    // Persist to database if logged in
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            selected_mode: newMode,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error saving user mode:', error);
        }
      } catch (err) {
        console.error('Error saving user mode:', err);
      }

      // Auto-register the user as a categorized CRM lead.
      // Idempotent on the server (upserts the user's self-registration lead),
      // so calling it on every mode change keeps contact_type in sync.
      try {
        await supabase.functions.invoke('register-mode-lead', {
          body: { mode: newMode },
        });
      } catch (err) {
        // Non-blocking: never let CRM sync break the UI selection.
        console.warn('[UserMode] register-mode-lead failed (non-fatal):', err);
      }

      // Source tracking — labels every pick as "Mode Picker (Header)" for insights
      try {
        const { registerRolePick, SIGNUP_SOURCES } = await import('@/lib/signupSources');
        await registerRolePick({ source: SIGNUP_SOURCES.MODE_PICKER, role: newMode });
      } catch (err) {
        console.warn('[UserMode] source tracking failed (non-fatal):', err);
      }
    }
  }, [user?.id]);

  return (
    <UserModeContext.Provider
      value={{
        mode,
        isLoading,
        setMode,
        isInvestorMode: mode === 'investor',
        isBrokerMode: mode === 'broker',
        isCombinedMode: false,
        isDeveloperMode: mode === 'developer',
        hasMadeInitialSelection,
      }}
    >
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserModeContext() {
  const context = useContext(UserModeContext);
  if (context === undefined) {
    throw new Error("useUserModeContext must be used within a UserModeProvider");
  }
  return context;
}
