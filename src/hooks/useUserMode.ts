/**
 * useUserMode — thin compatibility shim over UserModeContext.
 *
 * Historical note: this hook used to keep its OWN copy of the mode and
 * silently overwrote the user's local selection with whatever was in
 * the `user_preferences` table every time the auth user changed. That
 * caused the mode to flip on refresh / sign-out + sign-in, which
 * violates the locked rule: "the mode must never change unless the
 * user explicitly changes it".
 *
 * It now delegates to the single source of truth — UserModeContext —
 * so every consumer (legacy and new) sees the exact same value and
 * persistence rules.
 */
import { useUserModeContext } from "@/contexts/UserModeContext";
import type { UserMode } from "@/contexts/UserModeContext";

export type { UserMode };

interface UserModeHook {
  mode: UserMode;
  isLoading: boolean;
  setMode: (mode: UserMode) => Promise<void>;
  isInvestorMode: boolean;
  isBrokerMode: boolean;
  /** @deprecated Combined mode removed. Always false. */
  isCombinedMode: boolean;
  isDeveloperMode: boolean;
}

export const useUserMode = (): UserModeHook => {
  const ctx = useUserModeContext();
  return {
    mode: ctx.mode,
    isLoading: ctx.isLoading,
    setMode: ctx.setMode,
    isInvestorMode: ctx.isInvestorMode,
    isBrokerMode: ctx.isBrokerMode,
    isCombinedMode: false,
    isDeveloperMode: ctx.isDeveloperMode,
  };
};
