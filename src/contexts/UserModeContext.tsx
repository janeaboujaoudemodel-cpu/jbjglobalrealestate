import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { isOwnerBackendEmail } from "@/config/ownerEmails";

const MODE_KEY = "jj_user_mode";
const MODE_SELECTED_KEY = "jj_mode_selected";

// Strictly 3 categories. Legacy 'investor_broker' rows are normalized to 'broker'
// (broker is the more privileged surface, so existing combined users keep access).
export type UserMode = 'investor' | 'broker' | 'developer' | 'owner';

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
  if (value === 'owner') return 'owner';
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
  const { user, isOwner } = useAuth();
  const queryClient = useQueryClient();
  const lastSyncedUserId = useRef<string | null>(null);

  useEffect(() => {
    const canKeepOwnerMode = isOwner || isOwnerBackendEmail(user?.email);
    if (mode !== 'owner' || canKeepOwnerMode) return;
    setModeState('investor');
    try { localStorage.setItem(MODE_KEY, 'investor'); } catch {}
  }, [mode, user?.email, isOwner]);

  // Cross-tab sync — listen for mode changes from other tabs/windows.
  // `storage` events only fire in OTHER tabs (never the one that wrote),
  // so this can never feedback-loop into itself.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== MODE_KEY || e.newValue === e.oldValue) return;
      const next = normalizeMode(e.newValue);
      setModeState((prev) => (prev === next ? prev : next));
      const selected = localStorage.getItem(MODE_SELECTED_KEY) === 'true';
      setHasMadeInitialSelection(selected);
      console.info('[UserMode] Synced from another tab:', next);
      try { queryClient.invalidateQueries(); } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [queryClient]);

  // Silent background reconcile — READ-ONLY on auth events.
  //
  // HARDENING RULE: the database mode column is mutated ONLY from `setMode`
  // (i.e. an explicit user pick in the mode switcher). Auth events
  // (sign-in / sign-out / token refresh / first session) must never write to
  // `user_preferences.selected_mode`. They may only *read* the row to seed
  // local state when this device has no mode at all.
  useEffect(() => {
    const userId = user?.id ?? null;
    if (userId === lastSyncedUserId.current) return;
    lastSyncedUserId.current = userId;
    if (!userId) return;

    const reconcile = async () => {
      const storedMode = localStorage.getItem(MODE_KEY);

      // Fast path: this device already has a mode. Do NOT touch the DB at all
      // on auth events — that's what the hardening rule forbids.
      if (storedMode) return;

      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('selected_mode')
          .eq('user_id', userId)
          .maybeSingle();

        if (data?.selected_mode) {
          const dbMode = normalizeMode(data.selected_mode);
          console.info('[UserMode] Adopting DB mode (no local mode set):', dbMode);
          setModeState(dbMode);
          localStorage.setItem(MODE_KEY, dbMode);
          setHasMadeInitialSelection(true);
          localStorage.setItem(MODE_SELECTED_KEY, 'true');
        }
        // No DB row + no local mode: leave the default 'investor' in memory
        // but DO NOT write to the DB. The DB is only seeded by an explicit
        // user pick via setMode().
      } catch (err) {
        console.error('Error reading user mode from DB:', err);
      }
    };

    reconcile();
  }, [user?.id]);

  // Tripwire: any DB write to mode-related tables MUST happen while
  // `explicitWriteRef.current === true`. Only `setMode` opens that window
  // (inside try/finally so it always closes). The auth reconcile effect
  // above never sets it — so if a future refactor accidentally triggers a
  // write from sign-in/sign-out/token-refresh, it throws in dev and logs
  // an error in production instead of silently corrupting the mode.
  const explicitWriteRef = useRef(false);
  const assertExplicitWrite = (label: string) => {
    if (!explicitWriteRef.current) {
      const msg = `[UserMode] BLOCKED non-explicit DB write attempt: ${label}`;
      if (import.meta.env.DEV) throw new Error(msg);
      console.error(msg);
      return false;
    }
    return true;
  };

  const setMode = useCallback(async (newMode: UserMode) => {
    console.info('[UserMode] setMode by user:', newMode);
    // Optimistic update — local only, no DB.
    setModeState(newMode);
    localStorage.setItem(MODE_KEY, newMode);

    // Mark as explicitly selected
    setHasMadeInitialSelection(true);
    localStorage.setItem(MODE_SELECTED_KEY, 'true');

    // Open the explicit-write window. Closed in `finally` so a thrown
    // error can never leak the permission to subsequent code paths.
    explicitWriteRef.current = true;
    try {
      if (user?.id) {
        try {
          if (!assertExplicitWrite('user_preferences.upsert')) throw new Error('blocked');
          const { error } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              selected_mode: newMode,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
          if (error) console.error('Error saving user mode:', error);
        } catch (err) {
          console.error('Error saving user mode:', err);
        }

        // Auto-register the user as a categorized CRM lead.
        // Skip for 'owner' — it's a front-end perspective toggle, not a lead category.
        if (newMode !== 'owner') {
          try {
            if (assertExplicitWrite('register-mode-lead')) {
              await supabase.functions.invoke('register-mode-lead', {
                body: { mode: newMode },
              });
            }
          } catch (err) {
            console.warn('[UserMode] register-mode-lead failed (non-fatal):', err);
          }
        }


        // Source tracking — labels every pick as "Mode Picker (Header)".
        try {
          if (assertExplicitWrite('signupSources.registerRolePick')) {
            const { registerRolePick, SIGNUP_SOURCES } = await import('@/lib/signupSources');
            await registerRolePick({ source: SIGNUP_SOURCES.MODE_PICKER, role: newMode });
          }
        } catch (err) {
          console.warn('[UserMode] source tracking failed (non-fatal):', err);
        }

        // Mirror mode -> role so legacy role-gated views stay consistent.
        // Owner mode is a presentation toggle — it does NOT mirror to roles.
        if (newMode !== 'developer' && newMode !== 'owner') {
          try {
            if (assertExplicitWrite('user_role_selections.upsert')) {
              const roleMirror = newMode === 'broker' ? 'broker_partner' : 'investor';
              await supabase
                .from('user_role_selections')
                .upsert({
                  user_id: user.id,
                  selected_role: roleMirror as any,
                  confirmed_accurate: true,
                }, { onConflict: 'user_id' });
              try { localStorage.setItem('jj_role_selected', roleMirror); } catch {}
            }
          } catch (err) {
            console.warn('[UserMode] role mirror failed (non-fatal):', err);
          }
        }
      }
    } finally {
      // ALWAYS close the window, even on throw.
      explicitWriteRef.current = false;
    }

    // Invalidate role / dashboard caches so the page re-skins without reload.
    try { queryClient.invalidateQueries(); } catch {}
  }, [user?.id, queryClient]);

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
