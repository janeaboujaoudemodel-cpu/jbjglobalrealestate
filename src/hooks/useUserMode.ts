import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MODE_KEY = "jj_user_mode";

export type UserMode = 'client' | 'broker';

interface UserModeHook {
  mode: UserMode;
  isLoading: boolean;
  setMode: (mode: UserMode) => Promise<void>;
  toggleMode: () => Promise<void>;
}

export const useUserMode = (): UserModeHook => {
  const [mode, setModeState] = useState<UserMode>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(MODE_KEY) as UserMode | null;
    return stored === 'broker' ? 'broker' : 'client';
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load mode from database on mount and when user changes
  useEffect(() => {
    const loadMode = async () => {
      setIsLoading(true);
      
      // First check localStorage
      const storedMode = localStorage.getItem(MODE_KEY) as UserMode | null;
      if (storedMode) {
        setModeState(storedMode === 'broker' ? 'broker' : 'client');
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
            const dbMode = data.selected_mode === 'broker' ? 'broker' : 'client';
            setModeState(dbMode);
            localStorage.setItem(MODE_KEY, dbMode);
          } else if (!error) {
            // No preferences record yet, create one with current mode
            const currentMode = storedMode || 'client';
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

  const toggleMode = useCallback(async () => {
    const newMode = mode === 'client' ? 'broker' : 'client';
    await setMode(newMode);
  }, [mode, setMode]);

  return {
    mode,
    isLoading,
    setMode,
    toggleMode
  };
};
