/**
 * USE PAYOUT READINESS HOOK
 * Hook for managing payout readiness records with DB persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CommissionAccessRole } from '@/config/revenue-ownership';
import {
  canViewPayouts,
  canApprovePayouts,
  canBlockPayouts,
} from '@/config/payout-safeguards';

export type PayoutStatus = 'pending' | 'approved' | 'blocked' | 'processing' | 'settled';

export interface PayoutReadinessRecord {
  id: string;
  payout_id: string;
  partner_id: string;
  partner_type: string;
  jurisdiction_id: string;
  execution_model: 'A' | 'B';
  related_deal_ids: string[];
  related_commission_ids: string[];
  commission_total: number;
  currency: string;
  payout_status: PayoutStatus;
  approval_required: boolean;
  approval_timestamp: string | null;
  approved_by: string | null;
  approver_role: string | null;
  settlement_method: string;
  internal_notes: string | null;
  block_reason: string | null;
  blocked_by: string | null;
  blocked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutAuditLog {
  id: string;
  audit_id: string;
  payout_id: string;
  actor_user_id: string;
  actor_role: string;
  action_type: string;
  result: 'success' | 'blocked' | 'denied' | 'error';
  result_reason: string | null;
  previous_status: string | null;
  new_status: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface UsePayoutReadinessReturn {
  payouts: PayoutReadinessRecord[];
  auditLogs: PayoutAuditLog[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadPayouts: () => Promise<void>;
  loadAuditLogs: (payoutId: string) => Promise<PayoutAuditLog[]>;
  approvePayout: (payoutId: string, notes?: string) => Promise<boolean>;
  blockPayout: (payoutId: string, reason: string) => Promise<boolean>;
  getPayoutById: (payoutId: string) => PayoutReadinessRecord | undefined;
  
  // Permission helpers
  canView: boolean;
  canApprove: boolean;
  canBlock: boolean;
}

export function usePayoutReadiness(
  userId?: string,
  userRole: CommissionAccessRole = 'internal_staff'
): UsePayoutReadinessReturn {
  const [payouts, setPayouts] = useState<PayoutReadinessRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<PayoutAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permission checks
  const canView = canViewPayouts(userRole);
  const canApprove = canApprovePayouts(userRole);
  const canBlock = canBlockPayouts(userRole);

  // Generate audit ID
  const generateAuditId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `PAUD-${timestamp}-${random}`.toUpperCase();
  };

  // Log audit entry
  const logAudit = useCallback(async (
    payoutId: string,
    actionType: string,
    result: 'success' | 'blocked' | 'denied' | 'error',
    resultReason: string,
    previousStatus: string | null,
    newStatus: string | null,
    metadata?: Record<string, unknown>
  ) => {
    try {
      await supabase
        .from('payout_audit_logs')
        .insert([{
          audit_id: generateAuditId(),
          payout_id: payoutId,
          actor_user_id: userId || 'system',
          actor_role: userRole,
          action_type: actionType,
          result,
          result_reason: resultReason,
          previous_status: previousStatus,
          new_status: newStatus,
          metadata: (metadata || {}) as Record<string, string | number | boolean | null>,
        }]);
    } catch (err) {
      console.error('Error logging audit:', err);
    }
  }, [userId, userRole]);

  // Load payouts from DB
  const loadPayouts = useCallback(async () => {
    if (!canView) {
      setPayouts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('payout_readiness_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      setPayouts((data || []).map(record => ({
        ...record,
        execution_model: record.execution_model as 'A' | 'B',
        payout_status: record.payout_status as PayoutStatus,
        related_deal_ids: record.related_deal_ids || [],
        related_commission_ids: record.related_commission_ids || [],
      })));
    } catch (err) {
      console.error('Error loading payouts:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [canView]);

  // Load audit logs for a payout
  const loadAuditLogs = useCallback(async (payoutId: string): Promise<PayoutAuditLog[]> => {
    try {
      const { data, error: dbError } = await supabase
        .from('payout_audit_logs')
        .select('*')
        .eq('payout_id', payoutId)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      const logs = (data || []).map(record => ({
        ...record,
        result: record.result as 'success' | 'blocked' | 'denied' | 'error',
        metadata: (record.metadata as Record<string, unknown>) || {},
      }));

      setAuditLogs(logs);
      return logs;
    } catch (err) {
      console.error('Error loading audit logs:', err);
      return [];
    }
  }, []);

  // Approve payout
  const approvePayout = useCallback(async (
    payoutId: string,
    notes?: string
  ): Promise<boolean> => {
    if (!canApprove) {
      toast.error('Only Owner/Founder can approve payouts');
      await logAudit(payoutId, 'payout_approved', 'denied', 
        `Role '${userRole}' is not authorized to approve payouts`, null, null);
      return false;
    }

    try {
      // Get current payout
      const { data: current, error: fetchError } = await supabase
        .from('payout_readiness_records')
        .select('*')
        .eq('payout_id', payoutId)
        .single();

      if (fetchError || !current) {
        toast.error('Payout not found');
        return false;
      }

      if (current.payout_status === 'approved') {
        toast.error('Payout has already been approved');
        return false;
      }

      if (current.payout_status === 'blocked') {
        toast.error('Cannot approve a blocked payout');
        return false;
      }

      const timestamp = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('payout_readiness_records')
        .update({
          payout_status: 'approved',
          approval_timestamp: timestamp,
          approved_by: userId,
          approver_role: userRole,
          internal_notes: notes 
            ? `${current.internal_notes || ''}\n[APPROVAL] ${notes}`
            : current.internal_notes,
        })
        .eq('payout_id', payoutId);

      if (updateError) throw updateError;

      await logAudit(payoutId, 'payout_approved', 'success',
        'Payout approved', current.payout_status, 'approved');

      toast.success('Payout approved');
      await loadPayouts();
      return true;
    } catch (err) {
      console.error('Error approving payout:', err);
      toast.error('Failed to approve payout');
      return false;
    }
  }, [canApprove, userId, userRole, logAudit, loadPayouts]);

  // Block payout
  const blockPayout = useCallback(async (
    payoutId: string,
    reason: string
  ): Promise<boolean> => {
    if (!canBlock) {
      toast.error('Only Owner/Founder can block payouts');
      await logAudit(payoutId, 'payout_blocked', 'denied',
        `Role '${userRole}' is not authorized to block payouts`, null, null);
      return false;
    }

    if (!reason.trim()) {
      toast.error('Block reason is required');
      return false;
    }

    try {
      // Get current payout
      const { data: current, error: fetchError } = await supabase
        .from('payout_readiness_records')
        .select('*')
        .eq('payout_id', payoutId)
        .single();

      if (fetchError || !current) {
        toast.error('Payout not found');
        return false;
      }

      const timestamp = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('payout_readiness_records')
        .update({
          payout_status: 'blocked',
          block_reason: reason,
          blocked_by: userId,
          blocked_at: timestamp,
        })
        .eq('payout_id', payoutId);

      if (updateError) throw updateError;

      await logAudit(payoutId, 'payout_blocked', 'success',
        reason, current.payout_status, 'blocked');

      toast.success('Payout blocked');
      await loadPayouts();
      return true;
    } catch (err) {
      console.error('Error blocking payout:', err);
      toast.error('Failed to block payout');
      return false;
    }
  }, [canBlock, userId, userRole, logAudit, loadPayouts]);

  // Get payout by ID
  const getPayoutById = useCallback((payoutId: string): PayoutReadinessRecord | undefined => {
    return payouts.find(p => p.payout_id === payoutId);
  }, [payouts]);

  // Load initial data
  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  return {
    payouts,
    auditLogs,
    isLoading,
    error,
    loadPayouts,
    loadAuditLogs,
    approvePayout,
    blockPayout,
    getPayoutById,
    canView,
    canApprove,
    canBlock,
  };
}