import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

export type AccessLevel = 'full' | 'limited' | 'client' | 'visitor';

interface AccessControlHook {
  accessLevel: AccessLevel;
  isLoading: boolean;
  hasFullAccess: boolean;
  hasLimitedAccess: boolean;
  isPartnerBroker: boolean;
  isJBJEmployee: boolean;
  hasFirstDealVerified: boolean;
  canAccessAITools: boolean;
  canAccessCourses: boolean;
  canAccessCertification: boolean;
  canAccessPrioritySupport: boolean;
  refreshAccess: () => Promise<void>;
}

/**
 * Access Control Hook
 * 
 * Implements the access logic:
 * - JBJ Employee Broker: full access from day 1
 * - Partner Broker (non-JBJ): limited access until first verified deal
 * - Client: client-only access
 * - Visitor: minimal access
 */
export function useAccessControl(): AccessControlHook {
  const { user } = useAuth();
  const { role, isJBJBroker, isPartnerBroker: isPartnerRole } = useUserRole();
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('visitor');
  const [isLoading, setIsLoading] = useState(true);
  const [hasFirstDealVerified, setHasFirstDealVerified] = useState(false);
  const [isJBJEmployee, setIsJBJEmployee] = useState(false);

  const checkAccess = useCallback(async () => {
    if (!user) {
      setAccessLevel('visitor');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Check if user is JBJ employee (has crm_users_profile)
      const { data: crmProfile } = await supabase
        .from('crm_users_profile')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (crmProfile) {
        setIsJBJEmployee(true);
        setAccessLevel('full');
        setIsLoading(false);
        return;
      }

      // Check if user is internal broker
      const { data: brokerProfile } = await supabase
        .from('broker_profiles')
        .select('broker_type')
        .eq('user_id', user.id)
        .maybeSingle();

      if (brokerProfile?.broker_type === 'internal') {
        setIsJBJEmployee(true);
        setAccessLevel('full');
        setIsLoading(false);
        return;
      }

      // Check if partner broker has first verified deal
      if (brokerProfile?.broker_type === 'external' || isPartnerRole) {
        const { data: verifiedDeal } = await supabase
          .from('deals')
          .select('id')
          .eq('broker_user_id', user.id)
          .eq('deal_status', 'verified')
          .limit(1)
          .maybeSingle();

        if (verifiedDeal) {
          setHasFirstDealVerified(true);
          setAccessLevel('full');
        } else {
          setAccessLevel('limited');
        }
        setIsLoading(false);
        return;
      }

      // Check if user has admin role
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (adminRole) {
        setAccessLevel('full');
        setIsLoading(false);
        return;
      }

      // Default to client access for authenticated users
      setAccessLevel('client');
    } catch (error) {
      console.error('Error checking access level:', error);
      setAccessLevel('client');
    } finally {
      setIsLoading(false);
    }
  }, [user, isPartnerRole]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Derived access flags
  const hasFullAccess = accessLevel === 'full';
  const hasLimitedAccess = accessLevel === 'limited';
  const isPartnerBroker = isPartnerRole && !isJBJEmployee;

  // Feature access flags based on access level
  const canAccessAITools = hasFullAccess;
  const canAccessCourses = hasFullAccess;
  const canAccessCertification = hasFullAccess;
  const canAccessPrioritySupport = hasFullAccess;

  return {
    accessLevel,
    isLoading,
    hasFullAccess,
    hasLimitedAccess,
    isPartnerBroker,
    isJBJEmployee,
    hasFirstDealVerified,
    canAccessAITools,
    canAccessCourses,
    canAccessCertification,
    canAccessPrioritySupport,
    refreshAccess: checkAccess,
  };
}

/**
 * Check if a specific feature is unlocked for the current user
 */
export function useFeatureAccess(featureType: 'ai_tools' | 'courses' | 'certification' | 'priority_support' | 'books') {
  const { accessLevel, hasFullAccess, hasLimitedAccess } = useAccessControl();

  const isUnlocked = (() => {
    switch (featureType) {
      case 'ai_tools':
      case 'courses':
      case 'certification':
      case 'priority_support':
        return hasFullAccess;
      case 'books':
        // Books are preview-only for everyone, but full access sees all
        return hasFullAccess;
      default:
        return false;
    }
  })();

  const lockReason = hasLimitedAccess 
    ? 'Complete your first verified deal to unlock this feature'
    : 'This feature is available for brokers only';

  return {
    isUnlocked,
    isLocked: !isUnlocked,
    lockReason,
    accessLevel,
  };
}
