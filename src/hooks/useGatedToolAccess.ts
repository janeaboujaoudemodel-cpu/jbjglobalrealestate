import { useUserMode } from "@/hooks/useUserMode";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";

export type GatedToolId = "compare" | "business-card-scanner";

/**
 * Unified access gate for tools restricted to brokers + owner.
 *
 * Access matrix:
 *   - Owner (app_role)              → visible, unlocked
 *   - JBJ broker (broker_jbj role)  → visible, unlocked
 *   - Any other broker mode         → visible, LOCKED (Request Access)
 *   - Investor / Developer mode     → HIDDEN (route + sidebar)
 *   - Logged-out                    → HIDDEN
 */
export function useGatedToolAccess(_toolId: GatedToolId) {
  const { isBrokerMode, isLoading: modeLoading } = useUserMode();
  const { isJBJBroker, isLoading: roleLoading } = useUserRole();
  const { isOwner, isLoading: ownerLoading } = useIsAppOwner();

  const isLoading = modeLoading || roleLoading || ownerLoading;
  const visible = isOwner || isBrokerMode;
  const unlocked = isOwner || isJBJBroker;
  const locked = visible && !unlocked;

  return { visible, unlocked, locked, isOwner, isJBJBroker, isBrokerMode, isLoading };
}
