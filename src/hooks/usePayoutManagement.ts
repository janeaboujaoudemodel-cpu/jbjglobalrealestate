/**
 * PAYOUT MANAGEMENT HOOK
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * React hook for managing payout readiness records.
 * This is GOVERNANCE + READINESS ONLY - NO actual payments.
 */

import { useState, useEffect, useCallback } from 'react';
import type { CommissionAccessRole } from '@/config/revenue-ownership';
import type {
  PayoutReadinessRecord,
  PayoutAuditLogEntry,
  PayoutCreationRequest,
  ApprovalRequest,
  BlockRequest,
} from '@/types/payout-readiness';
import {
  PAYOUT_VISIBILITY_BY_ROLE,
  PAYOUT_APPROVAL_AUTHORITY,
  SETTLEMENT_SAFEGUARDS,
  PAYOUT_EXECUTION_RULES,
  canViewPayouts,
  canApprovePayouts,
  canBlockPayouts,
} from '@/config/payout-safeguards';
import {
  createPayoutReadiness,
  approvePayout,
  blockPayout,
  attemptPayoutExecution,
  getPayout,
  getAllPayouts,
  getPayoutsForPartner,
  getPayoutAuditLog,
  getAllPayoutAuditLogs,
  getPayoutServiceStatus,
  subscribeToPayoutState,
  syncCommissionData,
  syncDealData,
  syncPartnerData,
  setApprovedJurisdictions,
} from '@/services/PayoutReadinessService';

export interface PayoutManagementState {
  payouts: PayoutReadinessRecord[];
  isLoading: boolean;
  error: string | null;
}

export function usePayoutManagement(actorRole: CommissionAccessRole = 'owner_founder') {
  const [state, setState] = useState<PayoutManagementState>({
    payouts: [],
    isLoading: true,
    error: null,
  });

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = subscribeToPayoutState(() => {
      refreshData();
    });

    // Initial load
    refreshData();

    return unsubscribe;
  }, [actorRole]);

  const refreshData = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = getAllPayouts(actorRole);

      setState({
        payouts: result.payouts || [],
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

  // Create payout readiness record
  const createPayout = useCallback(
    (request: PayoutCreationRequest, actorUserId: string, ipAddress?: string) => {
      return createPayoutReadiness(request, actorUserId, actorRole, ipAddress);
    },
    [actorRole]
  );

  // Approve payout (owner_founder only)
  const approve = useCallback(
    (payoutId: string, approverUserId: string, approvalNotes?: string, ipAddress?: string) => {
      if (actorRole !== 'owner_founder') {
        return {
          success: false,
          error: 'Only owner_founder can approve payouts',
        };
      }

      const request: ApprovalRequest = {
        payout_id: payoutId,
        approver_user_id: approverUserId,
        approver_role: 'owner_founder',
        approval_notes: approvalNotes,
      };

      return approvePayout(request, ipAddress);
    },
    [actorRole]
  );

  // Block payout (owner_founder only)
  const block = useCallback(
    (payoutId: string, blockerUserId: string, blockReason: string, ipAddress?: string) => {
      if (actorRole !== 'owner_founder') {
        return {
          success: false,
          error: 'Only owner_founder can block payouts',
        };
      }

      const request: BlockRequest = {
        payout_id: payoutId,
        blocker_user_id: blockerUserId,
        blocker_role: 'owner_founder',
        block_reason: blockReason,
      };

      return blockPayout(request, ipAddress);
    },
    [actorRole]
  );

  // Attempt payout execution (ALWAYS BLOCKED)
  const attemptExecution = useCallback(
    (payoutId: string, actorUserId: string, ipAddress?: string) => {
      // This will ALWAYS return blocked
      return attemptPayoutExecution(payoutId, actorUserId, actorRole, ipAddress);
    },
    [actorRole]
  );

  // Get single payout
  const getPayoutById = useCallback(
    (payoutId: string) => {
      return getPayout(payoutId, actorRole);
    },
    [actorRole]
  );

  // Get payouts for partner
  const getPayoutsByPartner = useCallback(
    (partnerId: string) => {
      return getPayoutsForPartner(partnerId, actorRole);
    },
    [actorRole]
  );

  // Get audit log for payout
  const getAuditLog = useCallback(
    (payoutId: string) => {
      return getPayoutAuditLog(payoutId, actorRole);
    },
    [actorRole]
  );

  // Get all audit logs
  const getAllAuditLogs = useCallback(() => {
    return getAllPayoutAuditLogs(actorRole);
  }, [actorRole]);

  return {
    // State
    ...state,

    // Actions
    refreshData,
    createPayout,
    approve,
    block,
    attemptExecution,
    getPayoutById,
    getPayoutsByPartner,
    getAuditLog,
    getAllAuditLogs,
    getServiceStatus: getPayoutServiceStatus,

    // Data synchronization
    syncCommissionData,
    syncDealData,
    syncPartnerData,
    setApprovedJurisdictions,

    // Permissions
    canView: canViewPayouts(actorRole),
    canApprove: canApprovePayouts(actorRole),
    canBlock: canBlockPayouts(actorRole),

    // Constants
    approvalAuthority: PAYOUT_APPROVAL_AUTHORITY,
    safeguards: SETTLEMENT_SAFEGUARDS,
    executionRules: PAYOUT_EXECUTION_RULES,
    visibilityByRole: PAYOUT_VISIBILITY_BY_ROLE,
  };
}
