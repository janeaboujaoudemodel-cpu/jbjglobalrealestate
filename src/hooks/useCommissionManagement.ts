/**
 * COMMISSION MANAGEMENT HOOK
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * React hook for managing commissions and revenue attribution.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  type OriginatingChannel,
  type ExecutionModel,
  type DealConversionRecord,
  type PartnerCommissionConfig,
  type CommissionRecord,
  ORIGINATING_CHANNELS,
  EXECUTION_MODELS,
  DEAL_STATUSES,
} from '@/types/revenue-attribution';
import {
  type CommissionAccessRole,
  REVENUE_OWNERSHIP_STATUS,
  canViewCommissions,
  canConfigureCommissions,
} from '@/config/revenue-ownership';
import type { PartnerType } from '@/config/partner-types';
import type { CommissionBasis, CommissionAppliesTo } from '@/types/revenue-attribution';
import {
  createDealConversion,
  closeDeal,
  getDeal,
  createCommissionConfig,
  calculateCommission,
  getCommissionsForDeal,
  getAllCommissions,
  getCommissionAuditLog,
  getCommissionServiceStatus,
  subscribeToCommissionState,
} from '@/services/CommissionFrameworkService';

export interface CommissionManagementState {
  commissions: CommissionRecord[];
  isLoading: boolean;
  error: string | null;
}

export function useCommissionManagement(actorRole: CommissionAccessRole = 'owner_founder') {
  const [state, setState] = useState<CommissionManagementState>({
    commissions: [],
    isLoading: true,
    error: null,
  });

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = subscribeToCommissionState(() => {
      refreshData();
    });

    // Initial load
    refreshData();

    return unsubscribe;
  }, [actorRole]);

  const refreshData = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = getAllCommissions(actorRole);

      setState({
        commissions: result.commissions || [],
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

  const createDeal = useCallback(
    (params: {
      originating_channel: OriginatingChannel;
      originating_partner_id: string | null;
      jurisdiction_id: string;
      execution_model: ExecutionModel;
      executing_partner_id: string | null;
      assigned_broker_id: string;
      client_id: string;
      deal_value: number;
      currency: string;
    }) => {
      return createDealConversion(params);
    },
    []
  );

  const closeDealById = useCallback((dealId: string, actorUserId: string) => {
    return closeDeal(dealId, actorUserId);
  }, []);

  const getDealById = useCallback((dealId: string) => {
    return getDeal(dealId);
  }, []);

  const createConfig = useCallback(
    (
      params: {
        partner_id: string;
        partner_type: PartnerType;
        jurisdiction_id: string;
        commission_basis: CommissionBasis;
        commission_rate: number;
        currency?: string;
        applies_to: CommissionAppliesTo;
        start_date: string;
        end_date: string | null;
      },
      actorUserId: string
    ) => {
      return createCommissionConfig(params, actorUserId, actorRole);
    },
    [actorRole]
  );

  const calculateCommissionForDeal = useCallback(
    (dealId: string, actorUserId: string) => {
      return calculateCommission(dealId, actorUserId, actorRole);
    },
    [actorRole]
  );

  const getCommissionsForDealId = useCallback(
    (dealId: string) => {
      return getCommissionsForDeal(dealId, actorRole);
    },
    [actorRole]
  );

  const getAuditLog = useCallback(
    (commissionId: string) => {
      return getCommissionAuditLog(commissionId, actorRole);
    },
    [actorRole]
  );

  return {
    // State
    ...state,
    
    // Actions
    refreshData,
    createDeal,
    closeDeal: closeDealById,
    getDeal: getDealById,
    createConfig,
    calculateCommission: calculateCommissionForDeal,
    getCommissionsForDeal: getCommissionsForDealId,
    getAuditLog,
    getServiceStatus: getCommissionServiceStatus,

    // Permissions
    canView: canViewCommissions(actorRole),
    canConfigure: canConfigureCommissions(actorRole),

    // Constants
    originatingChannels: ORIGINATING_CHANNELS,
    executionModels: EXECUTION_MODELS,
    dealStatuses: DEAL_STATUSES,
    revenueStatus: REVENUE_OWNERSHIP_STATUS,
  };
}
