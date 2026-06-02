import { useUserMode } from "@/hooks/useUserMode";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";

/**
 * Access gate for the Property Comparison tool.
 * Visible to brokers and to the real app owner/admin only.
 * Investor & developer modes get a gate card on direct route hits.
 */
export function useCompareAccess() {
  const { isBrokerMode, isLoading: modeLoading } = useUserMode();
  const { isOwner, isLoading: ownerLoading } = useIsAppOwner();
  const allowed = isBrokerMode || isOwner;
  return { allowed, isBrokerMode, isOwner, isLoading: modeLoading || ownerLoading };
}
