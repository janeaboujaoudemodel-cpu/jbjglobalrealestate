import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  PREMIUM_ACTION_LABEL,
  type PremiumActionKey,
} from "@/config/premiumActions";
import { openPremiumPrompt } from "@/components/premium/premiumPromptBus";
import { logAnalytics } from "@/lib/analytics";

/**
 * useRequireAuth
 *
 * Guard any interactive action behind auth. Anonymous users see a smooth
 * conversion modal; authenticated users pass through instantly. Preserves
 * `?next=` so the user lands back on the exact card/action after sign-in.
 */
export function useRequireAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requireAuth = useCallback(
    (opts: {
      action: PremiumActionKey;
      /** Where to send authenticated user or return after sign-in */
      next?: string;
      /** Called after auth check passes (client-side navigation, etc.) */
      onAuthed?: () => void;
    }) => {
      const { action, next, onAuthed } = opts;
      if (user) {
        logAnalytics("premium_action_pass", { action, next });
        if (onAuthed) onAuthed();
        else if (next) navigate(next);
        return true;
      }
      const returnTo = next ?? location.pathname + location.search;
      logAnalytics("premium_action_gated", { action, next: returnTo });
      openPremiumPrompt({
        actionLabel: PREMIUM_ACTION_LABEL[action],
        actionKey: action,
        next: returnTo,
      });
      return false;
    },
    [user, navigate, location.pathname, location.search],
  );

  return { requireAuth, isAuthed: !!user };
}
