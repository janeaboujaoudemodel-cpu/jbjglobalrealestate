import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MODE_KEY = "jj_user_mode";

// Expanded to 3 modes: investor, broker, or both
export type UserMode = 'investor' | 'broker' | 'investor_broker' | 'developer';

interface UserModeHook {
  mode: UserMode;
  isLoading: boolean;
  setMode: (mode: UserMode) => Promise<void>;
  isInvestorMode: boolean;
  isBrokerMode: boolean;
  isCombinedMode: boolean;
}

// Map legacy 'client' value to 'investor'
const normalizeMode = (value: string | null): UserMode => {
  if (value === 'broker') return 'broker';
  if (value === 'investor_broker') return 'investor_broker';
  // 'client' or anything else defaults to 'investor'
  return 'investor';
};

export const useUserMode = (): UserModeHook => {
  const [mode, setModeState] = useState<UserMode>(() => {
    const stored = localStorage.getItem(MODE_KEY);
    return normalizeMode(stored);
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load mode from database on mount and when user changes
  useEffect(() => {
    const loadMode = async () => {
      setIsLoading(true);
      
      // First check localStorage
      const storedMode = localStorage.getItem(MODE_KEY);
      if (storedMode) {
        setModeState(normalizeMode(storedMode));
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

  return {
    mode,
    isLoading,
    setMode,
    isInvestorMode: mode === 'investor' || mode === 'investor_broker',
    isBrokerMode: mode === 'broker' || mode === 'investor_broker',
    isCombinedMode: mode === 'investor_broker',
  };
};
