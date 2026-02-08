import { useAuth } from '@/contexts/AuthContext';

interface OwnerVerificationResult {
  isOwner: boolean;
  isLoading: boolean;
  error: string | null;
  refreshOwnerVerification: () => Promise<void>;
}

/**
 * useOwnerVerification - Thin wrapper over AuthContext for owner status
 * 
 * This hook no longer makes its own verify-owner call.
 * Instead, it consumes the centralized owner status from AuthContext.
 * This ensures a single source of truth for owner verification.
 */
export function useOwnerVerification(): OwnerVerificationResult {
  const { isOwner, ownerLoading, ownerError, refreshOwnerVerification } = useAuth();

  return { 
    isOwner, 
    isLoading: ownerLoading, 
    error: ownerError,
    refreshOwnerVerification,
  };
}

export default useOwnerVerification;
