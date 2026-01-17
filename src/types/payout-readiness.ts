/**
 * PAYOUT READINESS TYPES
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Type definitions for partner settlement readiness framework.
 * This is GOVERNANCE + READINESS ONLY - NO actual payments.
 */

import type { PartnerType } from '@/config/partner-types';
import type { ExecutionModel } from '@/types/revenue-attribution';

// ============================================================
// PAYOUT STATUS (STRICTLY CONTROLLED)
// ============================================================

export type PayoutStatus = 'pending' | 'approved' | 'blocked';

export const PAYOUT_STATUSES: PayoutStatus[] = ['pending', 'approved', 'blocked'];

// ============================================================
// SETTLEMENT METHOD (PLACEHOLDER ONLY)
// ============================================================

export type SettlementMethod = 
  | 'bank_transfer' 
  | 'wire_transfer' 
  | 'escrow' 
  | 'pending_configuration';

// ============================================================
// PAYOUT READINESS RECORD (MANDATORY STRUCTURE)
// ============================================================

export interface PayoutReadinessRecord {
  /** Unique payout identifier */
  payout_id: string;
  /** Partner ID receiving the payout */
  partner_id: string;
  /** Partner type (Execution / Data / Service) */
  partner_type: PartnerType;
  /** Jurisdiction identifier */
  jurisdiction_id: string;
  /** Execution model - ONLY A or B allowed */
  execution_model: Extract<ExecutionModel, 'A' | 'B'>;
  /** Related deal IDs (array) */
  related_deal_ids: string[];
  /** Related commission IDs */
  related_commission_ids: string[];
  /** Commission total */
  commission_total: number;
  /** Currency */
  currency: string;
  /** Payout status - defaults to 'pending' */
  payout_status: PayoutStatus;
  /** Approval is ALWAYS required */
  approval_required: true;
  /** Approval timestamp (nullable) */
  approval_timestamp: string | null;
  /** Approved by user ID (nullable) */
  approved_by: string | null;
  /** Approver role */
  approver_role: string | null;
  /** Settlement method - PLACEHOLDER ONLY */
  settlement_method: SettlementMethod;
  /** Internal notes */
  internal_notes: string;
  /** Block reason (mandatory if blocked) */
  block_reason: string | null;
  /** Blocked by user ID */
  blocked_by: string | null;
  /** Blocked at timestamp */
  blocked_at: string | null;
  /** Created timestamp */
  created_at: string;
  /** Updated timestamp */
  updated_at: string;
}

// ============================================================
// PAYOUT BLOCK REASONS (SYSTEM-DEFINED)
// ============================================================

export type PayoutBlockReason = 
  | 'DEAL_NOT_CLOSED'
  | 'COMMISSION_INVALID'
  | 'COMMISSION_MISSING'
  | 'PARTNER_NOT_ACTIVE'
  | 'JURISDICTION_NOT_APPROVED'
  | 'MODEL_C_NOT_ALLOWED'
  | 'DATA_PARTNER_NO_EXECUTION_RIGHTS'
  | 'MANUAL_BLOCK'
  | 'VALIDATION_FAILED';

export const PAYOUT_BLOCK_REASONS: Record<PayoutBlockReason, string> = {
  DEAL_NOT_CLOSED: 'Deal status is not "Closed"',
  COMMISSION_INVALID: 'Commission record is invalid',
  COMMISSION_MISSING: 'Commission record is missing',
  PARTNER_NOT_ACTIVE: 'Partner status is not "Active"',
  JURISDICTION_NOT_APPROVED: 'Jurisdiction is not approved for execution',
  MODEL_C_NOT_ALLOWED: 'Execution model C is not eligible for payout',
  DATA_PARTNER_NO_EXECUTION_RIGHTS: 'Data partner does not have execution rights',
  MANUAL_BLOCK: 'Manually blocked by authorized user',
  VALIDATION_FAILED: 'One or more validation checks failed',
};

// ============================================================
// PAYOUT AUDIT LOG (IMMUTABLE)
// ============================================================

export type PayoutAuditAction = 
  | 'payout_created'
  | 'payout_updated'
  | 'payout_blocked'
  | 'payout_approved'
  | 'payout_attempted';

export interface PayoutAuditLogEntry {
  /** Unique audit log ID */
  audit_id: string;
  /** Payout ID */
  payout_id: string;
  /** Actor user ID */
  actor_user_id: string;
  /** Actor role */
  actor_role: string;
  /** Timestamp (immutable) */
  timestamp: string;
  /** Action type */
  action_type: PayoutAuditAction;
  /** Result of the action */
  result: 'success' | 'blocked' | 'denied' | 'error';
  /** Reason for the result */
  result_reason: string;
  /** Previous status */
  previous_status: PayoutStatus | null;
  /** New status */
  new_status: PayoutStatus | null;
  /** IP address (if available) */
  ip_address: string | null;
  /** Additional metadata */
  metadata: Record<string, unknown>;
}

// ============================================================
// PAYOUT VALIDATION RESULT
// ============================================================

export interface PayoutValidationResult {
  /** Overall validation passed */
  is_valid: boolean;
  /** List of validation failures */
  failures: PayoutBlockReason[];
  /** Detailed failure messages */
  failure_details: string[];
  /** Validated at timestamp */
  validated_at: string;
}

// ============================================================
// PAYOUT CREATION REQUEST
// ============================================================

export interface PayoutCreationRequest {
  partner_id: string;
  commission_ids: string[];
  internal_notes?: string;
}

// ============================================================
// APPROVAL WORKFLOW TYPES
// ============================================================

export type ApprovalRole = 'owner_founder';

export interface ApprovalRequest {
  payout_id: string;
  approver_user_id: string;
  approver_role: ApprovalRole;
  approval_notes?: string;
}

export interface BlockRequest {
  payout_id: string;
  blocker_user_id: string;
  blocker_role: ApprovalRole;
  block_reason: string;
}
