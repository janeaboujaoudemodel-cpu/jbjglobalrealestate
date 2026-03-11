import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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
      
      // First check localStorage
      const storedMode = localStorage.getItem(MODE_KEY);
      const storedSelection = localStorage.getItem(MODE_SELECTED_KEY);
      
      if (storedMode) {
        setModeState(normalizeMode(storedMode));
      }
      if (storedSelection === 'true') {
        setHasMadeInitialSelection(true);
      }

      // If logged in, sync with database
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('selected_mode')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data?.selected_mode) {
            const dbMode = normalizeMode(data.selected_mode);
            setModeState(dbMode);
            localStorage.setItem(MODE_KEY, dbMode);
            // If we have a mode in DB, user has made a selection
            setHasMadeInitialSelection(true);
            localStorage.setItem(MODE_SELECTED_KEY, 'true');
          } else if (!error) {
            // No preferences record yet, create one with current mode
            const currentMode = normalizeMode(storedMode);
            await supabase
              .from('user_preferences')
              .insert({
                user_id: user.id,
                selected_mode: currentMode
              });
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
