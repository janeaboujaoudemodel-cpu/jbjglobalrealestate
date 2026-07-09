import { ReactNode } from "react";

/**
 * SiteAccessGate — SaaS flow (Phase 2)
 *
 * The public site is fully browseable. This wrapper does NOT redirect
 * anonymous visitors anywhere. Premium routes and actions are gated
 * individually via:
 *   - `<AuthRequiredRoute>` for route-level protection
 *   - `<PremiumGate>` / `useRequireAuth()` for interaction-level gating
 *
 * Returning users with a valid session enter directly. Only anonymous
 * users who click a premium trigger are prompted to sign up/in.
 */
export default function SiteAccessGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
