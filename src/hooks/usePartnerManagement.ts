/**
 * PARTNER MANAGEMENT HOOK
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * React hook for managing partner onboarding and lifecycle.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  type PartnerType,
  type ServicePartnerType,
  PARTNER_TYPES,
  SERVICE_PARTNER_TYPES,
  PARTNER_TYPES_STATUS,
} from '@/config/partner-types';
import {
  type PartnerProfile,
  type PartnerStatus,
  type PartnerOnboardingRequest,
  PARTNER_STATUSES,
} from '@/types/partner-profile';
import {
  type PartnerAccessRole,
  PARTNER_GOVERNANCE_STATUS,
  PARTNER_ACCESS_RESTRICTIONS,
  canManagePartners,
} from '@/config/partner-governance';
import {
  createPartner,
  updatePartnerStatus,
  suspendPartner,
  terminatePartner,
  activatePartner,
  getPartner,
  getAllPartners,
  getPartnersByType,
  getPartnerAuditLog,
  getPartnerServiceStatus,
  subscribeToPartnerState,
} from '@/services/PartnerOnboardingService';

export interface PartnerManagementState {
  partners: PartnerProfile[];
  isLoading: boolean;
  error: string | null;
}

export function usePartnerManagement(actorRole: PartnerAccessRole = 'owner_founder') {
  const [state, setState] = useState<PartnerManagementState>({
    partners: [],
    isLoading: true,
    error: null,
  });

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = subscribeToPartnerState(() => {
      refreshData();
    });

    // Initial load
    refreshData();

    return unsubscribe;
  }, [actorRole]);

  const refreshData = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = getAllPartners(actorRole);

      setState({
        partners: result.partners,
        isLoading: false,
        error: result.success ? null : result.error || null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: (error as Error).message,
      }));
    }
  }, [actorRole]);

  const onboardPartner = useCallback(
    (request: PartnerOnboardingRequest, actorUserId: string) => {
      const result = createPartner(request, actorUserId, actorRole);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.partner;
    },
    [actorRole]
  );

  const suspend = useCallback(
    (partnerId: string, reason: string, actorUserId: string) => {
      return suspendPartner(partnerId, reason, actorUserId, actorRole);
    },
    [actorRole]
  );

  const terminate = useCallback(
    (partnerId: string, reason: string, actorUserId: string) => {
      return terminatePartner(partnerId, reason, actorUserId, actorRole);
    },
    [actorRole]
  );

  const activate = useCallback(
    (partnerId: string, actorUserId: string) => {
      return activatePartner(partnerId, actorUserId, actorRole);
    },
    [actorRole]
  );

  const getPartnerById = useCallback(
    (partnerId: string) => {
      return getPartner(partnerId, actorRole);
    },
    [actorRole]
  );

  const getByType = useCallback(
    (partnerType: PartnerType) => {
      return getPartnersByType(partnerType, actorRole);
    },
    [actorRole]
  );

  const getAuditLog = useCallback(
    (partnerId: string) => {
      return getPartnerAuditLog(partnerId, actorRole);
    },
    [actorRole]
  );

  return {
    // State
    ...state,
    
    // Actions
    refreshData,
    onboardPartner,
    suspend,
    terminate,
    activate,
    getPartnerById,
    getByType,
    getAuditLog,
    getServiceStatus: getPartnerServiceStatus,

    // Permissions
    canManage: canManagePartners(actorRole),

    // Constants
    partnerTypes: PARTNER_TYPES,
    servicePartnerTypes: SERVICE_PARTNER_TYPES,
    partnerStatuses: PARTNER_STATUSES,
    accessRestrictions: PARTNER_ACCESS_RESTRICTIONS,
    typesStatus: PARTNER_TYPES_STATUS,
    governanceStatus: PARTNER_GOVERNANCE_STATUS,
  };
}
