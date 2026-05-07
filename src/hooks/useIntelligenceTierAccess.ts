/**
 * useIntelligenceTierAccess Hook — JBJ GLOBAL REAL ESTATE
 * 
 * Provides tier-based access control for Market Intelligence features.
 * Enforces RBAC and prevents privilege escalation.
 */

import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  IntelligenceTier,
  INTELLIGENCE_TIERS,
  UserAccessContext,
  getMaxAccessibleTier,
  canAccessTier,
  isContentAllowedInTier,
  createAccessLogEntry,
  IntelligenceAccessLog,
} from '@/config/market-intelligence-layers';
import {
  checkAIOutputBoundaries,
  getTierSystemPrompt,
  sanitizeAIOutput,
  AIBoundaryCheck,
} from '@/config/ai-intelligence-tier-enforcement';

export interface IntelligenceTierAccessResult {
  // Current user's access level
  currentTier: IntelligenceTier;
  userContext: UserAccessContext;
  
  // Access checks
  canAccess: (tier: IntelligenceTier) => boolean;
  canViewContent: (contentType: string, tier: IntelligenceTier) => boolean;
  
  // Tier information
  getTierInfo: (tier: IntelligenceTier) => typeof INTELLIGENCE_TIERS[IntelligenceTier];
  getAccessibleTiers: () => IntelligenceTier[];
  
  // AI enforcement
  validateAIOutput: (output: string, tier: IntelligenceTier) => AIBoundaryCheck;
  sanitizeOutput: (output: string, tier: IntelligenceTier) => string;
  getAIPromptForTier: (tier: IntelligenceTier) => string;
  
  // Audit
  logAccess: (tier: IntelligenceTier, contentTypes: string[], granted: boolean, reason?: string) => IntelligenceAccessLog;
}

export function useIntelligenceTierAccess(): IntelligenceTierAccessResult {
  const { user, isOwner } = useAuth();
  
  // Build user context from auth state
  const userContext = useMemo<UserAccessContext>(() => {
    if (!user) {
      return {
        is_authenticated: false,
        is_active_client: false,
        is_admin: false,
        is_executive: false,
        is_owner: false,
      };
    }
    
    // SECURITY: Privilege flags must NEVER be derived from user.user_metadata —
    // that field is user-editable via supabase.auth.updateUser({ data: {...} }).
    // Only trust the server-verified `isOwner` flag (resolved through
    // verify-owner / user_roles RLS).
    return {
      is_authenticated: true,
      is_active_client: false,
      is_admin: isOwner,
      is_executive: isOwner,
      is_owner: isOwner,
      role: isOwner ? ('owner' as any) : ('viewer' as any),
    };
  }, [user, isOwner]);
  
  // Get current user's maximum tier
  const currentTier = useMemo(() => {
    return getMaxAccessibleTier(userContext);
  }, [userContext]);
  
  // Check if user can access a specific tier
  const canAccess = useCallback((tier: IntelligenceTier): boolean => {
    return canAccessTier(userContext, tier);
  }, [userContext]);
  
  // Check if user can view specific content type in a tier
  const canViewContent = useCallback((contentType: string, tier: IntelligenceTier): boolean => {
    // First check tier access
    if (!canAccessTier(userContext, tier)) {
      return false;
    }
    
    // Then check content allowance in that tier
    return isContentAllowedInTier(contentType, tier);
  }, [userContext]);
  
  // Get tier information
  const getTierInfo = useCallback((tier: IntelligenceTier) => {
    return INTELLIGENCE_TIERS[tier];
  }, []);
  
  // Get all tiers the user can access
  const getAccessibleTiers = useCallback((): IntelligenceTier[] => {
    const allTiers: IntelligenceTier[] = ['public', 'registered_user', 'client_only', 'internal_strategic'];
    return allTiers.filter(tier => canAccessTier(userContext, tier));
  }, [userContext]);
  
  // Validate AI output against tier boundaries
  const validateAIOutput = useCallback((output: string, tier: IntelligenceTier): AIBoundaryCheck => {
    return checkAIOutputBoundaries(output, tier, userContext);
  }, [userContext]);
  
  // Sanitize output for tier compliance
  const sanitizeOutput = useCallback((output: string, tier: IntelligenceTier): string => {
    return sanitizeAIOutput(output, tier);
  }, []);
  
  // Get AI system prompt for tier
  const getAIPromptForTier = useCallback((tier: IntelligenceTier): string => {
    return getTierSystemPrompt(tier);
  }, []);
  
  // Log access attempt
  const logAccess = useCallback((
    tier: IntelligenceTier,
    contentTypes: string[],
    granted: boolean,
    reason?: string
  ): IntelligenceAccessLog => {
    const log = createAccessLogEntry(
      user?.id || null,
      tier,
      contentTypes,
      granted,
      reason
    );
    
    // In production, this would send to the audit log table
    console.log('[Intelligence Access]', log);
    
    return log;
  }, [user?.id]);
  
  return {
    currentTier,
    userContext,
    canAccess,
    canViewContent,
    getTierInfo,
    getAccessibleTiers,
    validateAIOutput,
    sanitizeOutput,
    getAIPromptForTier,
    logAccess,
  };
}

// =============================================================================
// TIER GUARD COMPONENT HELPER
// =============================================================================

export interface TierGuardProps {
  requiredTier: IntelligenceTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Helper to check if content should be rendered based on tier
 */
export function useTierGuard(requiredTier: IntelligenceTier): {
  hasAccess: boolean;
  currentTier: IntelligenceTier;
} {
  const { currentTier, canAccess } = useIntelligenceTierAccess();
  
  return {
    hasAccess: canAccess(requiredTier),
    currentTier,
  };
}
