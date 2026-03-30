import { useAuth } from "@/contexts/AuthContext";

/**
 * useAuditorReadOnly - Returns true when the current user is a read-only auditor.
 * Components use this to disable write actions (edit, delete, approve, submit).
 */
export function useAuditorReadOnly() {
  const { isAuditor, isOwner } = useAuth();
  return {
    isAuditor: isAuditor && !isOwner,
    isReadOnly: isAuditor && !isOwner,
  };
}

export default useAuditorReadOnly;
