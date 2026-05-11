import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MODE_KEY = "jj_user_mode";
const MODE_SELECTED_KEY = "jj_mode_selected";

// Expanded to 3 modes: investor, broker, or both
export type UserMode = 'investor' | 'broker' | 'investor_broker' | 'developer';

interface UserModeContextType {
  mode: UserMode;
  isLoading: boolean;
  setMode: (mode: UserMode) => Promise<void>;
  isInvestorMode: boolean;
  isBrokerMode: boolean;
  isCombinedMode: boolean;
  isDeveloperMode: boolean;
  hasMadeInitialSelection: boolean;
}

const UserModeContext = createContext<UserModeContextType | undefined>(undefined);

// Map legacy 'client' value to 'investor'
const normalizeMode = (value: string | null): UserMode => {
  if (value === 'broker') return 'broker';
  if (value === 'investor_broker') return 'investor_broker';
  if (value === 'developer') return 'developer';
  return 'investor';
};

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UserMode>(() => {
    if (typeof window === 'undefined') return 'investor';
    const stored = localStorage.getItem(MODE_KEY);
    return normalizeMode(stored);
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasMadeInitialSelection, setHasMadeInitialSelection] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(MODE_SELECTED_KEY) === 'true';
  });
  const { user } = useAuth();

  // Load mode from database on mount and when user changes
  useEffect(() => {
    const loadMode = async () => {
      setIsLoading(true);
      
      // localStorage is the primary source of truth
      const storedMode = localStorage.getItem(MODE_KEY);
      const storedSelection = localStorage.getItem(MODE_SELECTED_KEY);
      
      if (storedMode) {
        setModeState(normalizeMode(storedMode));
      }
      if (storedSelection === 'true') {
        setHasMadeInitialSelection(true);
      }

      // If logged in, sync with database — but NEVER overwrite an explicit local selection
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('selected_mode')
            .eq('user_id', user.id)
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
              // Make sure a categorized CRM lead exists for this returning user
              try {
                await supabase.functions.invoke('register-mode-lead', { body: { mode: dbMode } });
              } catch (e) {
                console.warn('[UserMode] register-mode-lead (DB adopt) failed', e);
              }
            } else if (storedSelection === 'true') {
              // User has an explicit local selection — push it to DB to keep in sync
              const localMode = normalizeMode(storedMode);
              if (data.selected_mode !== localMode) {
                await supabase
                  .from('user_preferences')
                  .upsert({
                    user_id: user.id,
                    selected_mode: localMode,
                    updated_at: new Date().toISOString()
                  }, { onConflict: 'user_id' });
              }
            }
          } else if (!error && storedSelection === 'true' && storedMode) {
            // First write to DB only when the user has EXPLICITLY chosen a mode.
            // Never auto-create a preferences row from an anonymous default — that
            // would silently classify users who never picked a category.
            const currentMode = normalizeMode(storedMode);
            await supabase
              .from('user_preferences')
              .insert({
                user_id: user.id,
                selected_mode: currentMode
              });
            try {
              await supabase.functions.invoke('register-mode-lead', { body: { mode: currentMode } });
            } catch (e) {
              console.warn('[UserMode] register-mode-lead (first sync) failed', e);
            }
          }
        } catch (err) {
          console.error('Error loading user mode:', err);
        }
      }

      setIsLoading(false);
    };

    loadMode();
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
    }
  }, [user?.id]);

  return (
    <UserModeContext.Provider
      value={{
        mode,
        isLoading,
        setMode,
        isInvestorMode: mode === 'investor' || mode === 'investor_broker',
        isBrokerMode: mode === 'broker' || mode === 'investor_broker',
        isCombinedMode: mode === 'investor_broker',
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
