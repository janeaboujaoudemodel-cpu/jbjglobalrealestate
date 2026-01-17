/**
 * PAYOUT READINESS SERVICE
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Service for managing payout readiness records with strict governance.
 * This is GOVERNANCE + READINESS ONLY - NO actual payments.
 * 
 * ABSOLUTE CONSTRAINTS:
 * - NO money movement
 * - NO payment execution
 * - NO bank transfers
 * - NO invoices issued
 * - NO UI exposure
 * - NO partner visibility
 */

import type { PartnerType } from '@/config/partner-types';
import type { PartnerStatus } from '@/types/partner-profile';
import type { ExecutionModel, CommissionRecord, DealConversionRecord } from '@/types/revenue-attribution';
import type { CommissionAccessRole } from '@/config/revenue-ownership';
import {
  type PayoutStatus,
  type PayoutReadinessRecord,
  type PayoutAuditLogEntry,
  type PayoutAuditAction,
  type PayoutBlockReason,
  type PayoutValidationResult,
  type PayoutCreationRequest,
  type ApprovalRequest,
  type BlockRequest,
  PAYOUT_BLOCK_REASONS,
} from '@/types/payout-readiness';
import {
  PAYOUT_APPROVAL_AUTHORITY,
  SETTLEMENT_SAFEGUARDS,
  PAYOUT_EXECUTION_RULES,
  canViewPayouts,
  canApprovePayouts,
  canBlockPayouts,
} from '@/config/payout-safeguards';

// ============================================================
// SERVICE STATE
// ============================================================

interface PayoutServiceState {
  payouts: Map<string, PayoutReadinessRecord>;
  auditLogs: Map<string, PayoutAuditLogEntry[]>;
  // External references for validation
  commissions: Map<string, CommissionRecord>;
  deals: Map<string, DealConversionRecord>;
  partnerStatuses: Map<string, PartnerStatus>;
  partnerTypes: Map<string, PartnerType>;
  partnerExecutionRights: Map<string, boolean>;
  approvedJurisdictions: Set<string>;
}

let state: PayoutServiceState = {
  payouts: new Map(),
  auditLogs: new Map(),
  commissions: new Map(),
  deals: new Map(),
  partnerStatuses: new Map(),
  partnerTypes: new Map(),
  partnerExecutionRights: new Map(),
  approvedJurisdictions: new Set(['UAE', 'DIFC', 'ADGM']), // Default approved jurisdictions
};

// ============================================================
// STATE OBSERVERS
// ============================================================

type StateObserver = (state: PayoutServiceState) => void;
const observers: Set<StateObserver> = new Set();

function notifyObservers() {
  observers.forEach((observer) => observer(state));
}

export function subscribeToPayoutState(observer: StateObserver): () => void {
  observers.add(observer);
  return () => observers.delete(observer);
}

// ============================================================
// ID GENERATION
// ============================================================

function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

// ============================================================
// STATE SYNCHRONIZATION (For external data)
// ============================================================

export function syncCommissionData(commissions: CommissionRecord[]): void {
  state.commissions.clear();
  commissions.forEach((c) => state.commissions.set(c.commission_id, c));
}

export function syncDealData(deals: DealConversionRecord[]): void {
  state.deals.clear();
  deals.forEach((d) => state.deals.set(d.deal_id, d));
}

export function syncPartnerData(partners: Array<{
  partner_id: string;
  status: PartnerStatus;
  partner_type: PartnerType;
  execution_rights: boolean;
}>): void {
  state.partnerStatuses.clear();
  state.partnerTypes.clear();
  state.partnerExecutionRights.clear();
  partners.forEach((p) => {
    state.partnerStatuses.set(p.partner_id, p.status);
    state.partnerTypes.set(p.partner_id, p.partner_type);
    state.partnerExecutionRights.set(p.partner_id, p.execution_rights);
  });
}

export function setApprovedJurisdictions(jurisdictions: string[]): void {
  state.approvedJurisdictions = new Set(jurisdictions);
}

// ============================================================
// AUDIT LOGGING (IMMUTABLE)
// ============================================================

function createAuditLog(
  payoutId: string,
  actorUserId: string,
  actorRole: string,
  actionType: PayoutAuditAction,
  result: 'success' | 'blocked' | 'denied' | 'error',
  resultReason: string,
  previousStatus: PayoutStatus | null,
  newStatus: PayoutStatus | null,
  ipAddress?: string,
  metadata?: Record<string, unknown>
): PayoutAuditLogEntry {
  const entry: PayoutAuditLogEntry = {
    audit_id: generateId('PAUD'),
    payout_id: payoutId,
    actor_user_id: actorUserId,
    actor_role: actorRole,
    timestamp: new Date().toISOString(),
    action_type: actionType,
    result,
    result_reason: resultReason,
    previous_status: previousStatus,
    new_status: newStatus,
    ip_address: ipAddress || null,
    metadata: metadata || {},
  };

  // Store audit log (immutable - append only)
  const logs = state.auditLogs.get(payoutId) || [];
  logs.push(entry);
  state.auditLogs.set(payoutId, logs);

  return entry;
}

// ============================================================
// VALIDATION ENGINE
// ============================================================

function validatePayoutEligibility(
  commissionIds: string[],
  partnerId: string
): PayoutValidationResult {
  const failures: PayoutBlockReason[] = [];
  const failureDetails: string[] = [];

  // Get all related commissions
  const commissions = commissionIds
    .map((id) => state.commissions.get(id))
    .filter((c): c is CommissionRecord => c !== undefined);

  // SAFEGUARD: Check commission records exist
  if (commissions.length === 0 || commissions.length !== commissionIds.length) {
    failures.push('COMMISSION_MISSING');
    failureDetails.push(PAYOUT_BLOCK_REASONS.COMMISSION_MISSING);
  }

  // SAFEGUARD: Validate each commission's deal is closed
  for (const commission of commissions) {
    const deal = state.deals.get(commission.deal_id);
    
    if (!deal) {
      failures.push('COMMISSION_INVALID');
      failureDetails.push(`Commission ${commission.commission_id}: Related deal not found`);
      continue;
    }

    // SAFEGUARD 1: Deal must be Closed
    if (deal.status !== 'closed') {
      if (!failures.includes('DEAL_NOT_CLOSED')) {
        failures.push('DEAL_NOT_CLOSED');
        failureDetails.push(PAYOUT_BLOCK_REASONS.DEAL_NOT_CLOSED);
      }
    }

    // SAFEGUARD 5: Model C is NEVER eligible
    if (deal.execution_model === 'C') {
      if (!failures.includes('MODEL_C_NOT_ALLOWED')) {
        failures.push('MODEL_C_NOT_ALLOWED');
        failureDetails.push(PAYOUT_BLOCK_REASONS.MODEL_C_NOT_ALLOWED);
      }
    }

    // SAFEGUARD 4: Jurisdiction must be approved
    if (!state.approvedJurisdictions.has(deal.jurisdiction_id)) {
      if (!failures.includes('JURISDICTION_NOT_APPROVED')) {
        failures.push('JURISDICTION_NOT_APPROVED');
        failureDetails.push(`${PAYOUT_BLOCK_REASONS.JURISDICTION_NOT_APPROVED}: ${deal.jurisdiction_id}`);
      }
    }
  }

  // SAFEGUARD 3: Partner must be Active
  const partnerStatus = state.partnerStatuses.get(partnerId);
  if (partnerStatus !== 'active') {
    failures.push('PARTNER_NOT_ACTIVE');
    failureDetails.push(`${PAYOUT_BLOCK_REASONS.PARTNER_NOT_ACTIVE}: Current status is "${partnerStatus || 'unknown'}"`);
  }

  // SAFEGUARD 6: Data partner requires execution rights
  const partnerType = state.partnerTypes.get(partnerId);
  const hasExecutionRights = state.partnerExecutionRights.get(partnerId);
  if (partnerType === 'data' && !hasExecutionRights) {
    failures.push('DATA_PARTNER_NO_EXECUTION_RIGHTS');
    failureDetails.push(PAYOUT_BLOCK_REASONS.DATA_PARTNER_NO_EXECUTION_RIGHTS);
  }

  return {
    is_valid: failures.length === 0,
    failures,
    failure_details: failureDetails,
    validated_at: new Date().toISOString(),
  };
}

// ============================================================
// PAYOUT READINESS CREATION
// ============================================================

export interface CreatePayoutResult {
  success: boolean;
  payout?: PayoutReadinessRecord;
  validation?: PayoutValidationResult;
  error?: string;
}

export function createPayoutReadiness(
  request: PayoutCreationRequest,
  actorUserId: string,
  actorRole: CommissionAccessRole,
  ipAddress?: string
): CreatePayoutResult {
  // Access control
  if (!canViewPayouts(actorRole)) {
    createAuditLog(
      'NONE',
      actorUserId,
      actorRole,
      'payout_created',
      'denied',
      `Role '${actorRole}' is not authorized to create payout records`,
      null,
      null,
      ipAddress
    );
    return {
      success: false,
      error: `Role '${actorRole}' is not authorized to create payout records`,
    };
  }

  // Get commissions
  const commissions = request.commission_ids
    .map((id) => state.commissions.get(id))
    .filter((c): c is CommissionRecord => c !== undefined);

  if (commissions.length === 0) {
    return {
      success: false,
      error: 'No valid commission records found',
    };
  }

  // Validate payout eligibility
  const validation = validatePayoutEligibility(request.commission_ids, request.partner_id);
  
  const now = new Date().toISOString();
  const payoutId = generateId('PAYOUT');

  // Determine execution model from first commission (all should match)
  const firstCommission = commissions[0];
  let executionModel: 'A' | 'B' = firstCommission.execution_model as 'A' | 'B';
  
  // If Model C somehow got here, block immediately
  if (firstCommission.execution_model === 'C') {
    return {
      success: false,
      error: 'Model C is not eligible for payout',
      validation,
    };
  }

  // Calculate commission total
  const commissionTotal = commissions.reduce((sum, c) => sum + c.commission_amount, 0);

  // Get related deal IDs
  const relatedDealIds = [...new Set(commissions.map((c) => c.deal_id))];

  // Get partner type
  const partnerType = state.partnerTypes.get(request.partner_id) || 'service';

  // Get jurisdiction from first commission
  const jurisdictionId = firstCommission.jurisdiction_id;

  // Create payout record - status based on validation
  const payoutStatus: PayoutStatus = validation.is_valid ? 'pending' : 'blocked';

  const payout: PayoutReadinessRecord = {
    payout_id: payoutId,
    partner_id: request.partner_id,
    partner_type: partnerType,
    jurisdiction_id: jurisdictionId,
    execution_model: executionModel,
    related_deal_ids: relatedDealIds,
    related_commission_ids: request.commission_ids,
    commission_total: commissionTotal,
    currency: firstCommission.currency,
    payout_status: payoutStatus,
    approval_required: true,
    approval_timestamp: null,
    approved_by: null,
    approver_role: null,
    settlement_method: 'pending_configuration',
    internal_notes: request.internal_notes || '',
    block_reason: validation.is_valid ? null : validation.failure_details.join('; '),
    blocked_by: validation.is_valid ? null : 'SYSTEM',
    blocked_at: validation.is_valid ? null : now,
    created_at: now,
    updated_at: now,
  };

  state.payouts.set(payoutId, payout);

  // Create audit log
  createAuditLog(
    payoutId,
    actorUserId,
    actorRole,
    'payout_created',
    validation.is_valid ? 'success' : 'blocked',
    validation.is_valid ? 'Payout readiness record created' : validation.failure_details.join('; '),
    null,
    payoutStatus,
    ipAddress,
    { validation }
  );

  notifyObservers();

  return {
    success: true,
    payout,
    validation,
  };
}

// ============================================================
// PAYOUT APPROVAL
// ============================================================

export interface ApprovalResult {
  success: boolean;
  payout?: PayoutReadinessRecord;
  error?: string;
}

export function approvePayout(
  request: ApprovalRequest,
  ipAddress?: string
): ApprovalResult {
  const { payout_id, approver_user_id, approver_role, approval_notes } = request;

  const payout = state.payouts.get(payout_id);

  if (!payout) {
    return { success: false, error: 'Payout not found' };
  }

  // Check authorization - ONLY owner_founder can approve
  if (!PAYOUT_APPROVAL_AUTHORITY.SOLE_AUTHORITY.authorized_roles.includes(approver_role)) {
    createAuditLog(
      payout_id,
      approver_user_id,
      approver_role,
      'payout_approved',
      'denied',
      `Role '${approver_role}' is not authorized to approve payouts`,
      payout.payout_status,
      payout.payout_status,
      ipAddress
    );
    return {
      success: false,
      error: `Role '${approver_role}' is not authorized to approve payouts. Only owner_founder can approve.`,
    };
  }

  // Check if already approved (immutable)
  if (payout.payout_status === 'approved') {
    return {
      success: false,
      error: 'Payout has already been approved. Approval is immutable.',
    };
  }

  // Check if blocked
  if (payout.payout_status === 'blocked') {
    return {
      success: false,
      error: 'Cannot approve a blocked payout. Review and resolve blocking conditions first.',
    };
  }

  // Re-validate before approval
  const validation = validatePayoutEligibility(payout.related_commission_ids, payout.partner_id);
  if (!validation.is_valid) {
    createAuditLog(
      payout_id,
      approver_user_id,
      approver_role,
      'payout_approved',
      'blocked',
      `Validation failed: ${validation.failure_details.join('; ')}`,
      payout.payout_status,
      'blocked',
      ipAddress,
      { validation }
    );

    // Update payout to blocked
    const updatedPayout: PayoutReadinessRecord = {
      ...payout,
      payout_status: 'blocked',
      block_reason: validation.failure_details.join('; '),
      blocked_by: 'SYSTEM',
      blocked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.payouts.set(payout_id, updatedPayout);
    notifyObservers();

    return {
      success: false,
      error: `Validation failed during approval: ${validation.failure_details.join('; ')}`,
      payout: updatedPayout,
    };
  }

  const now = new Date().toISOString();

  // Approve the payout
  const approvedPayout: PayoutReadinessRecord = {
    ...payout,
    payout_status: 'approved',
    approval_timestamp: now,
    approved_by: approver_user_id,
    approver_role: approver_role,
    internal_notes: approval_notes
      ? `${payout.internal_notes}\n[APPROVAL] ${approval_notes}`
      : payout.internal_notes,
    updated_at: now,
  };

  state.payouts.set(payout_id, approvedPayout);

  createAuditLog(
    payout_id,
    approver_user_id,
    approver_role,
    'payout_approved',
    'success',
    'Payout approved',
    payout.payout_status,
    'approved',
    ipAddress
  );

  notifyObservers();

  return { success: true, payout: approvedPayout };
}

// ============================================================
// PAYOUT BLOCKING
// ============================================================

export function blockPayout(
  request: BlockRequest,
  ipAddress?: string
): ApprovalResult {
  const { payout_id, blocker_user_id, blocker_role, block_reason } = request;

  const payout = state.payouts.get(payout_id);

  if (!payout) {
    return { success: false, error: 'Payout not found' };
  }

  // Check authorization
  if (!canBlockPayouts(blocker_role)) {
    createAuditLog(
      payout_id,
      blocker_user_id,
      blocker_role,
      'payout_blocked',
      'denied',
      `Role '${blocker_role}' is not authorized to block payouts`,
      payout.payout_status,
      payout.payout_status,
      ipAddress
    );
    return {
      success: false,
      error: `Role '${blocker_role}' is not authorized to block payouts`,
    };
  }

  // Block reason is mandatory
  if (!block_reason || block_reason.trim() === '') {
    return {
      success: false,
      error: 'Block reason is mandatory',
    };
  }

  // Cannot block an already approved payout (immutable)
  if (payout.payout_status === 'approved') {
    return {
      success: false,
      error: 'Cannot block an approved payout. Approval is immutable.',
    };
  }

  const now = new Date().toISOString();

  const blockedPayout: PayoutReadinessRecord = {
    ...payout,
    payout_status: 'blocked',
    block_reason: block_reason,
    blocked_by: blocker_user_id,
    blocked_at: now,
    updated_at: now,
  };

  state.payouts.set(payout_id, blockedPayout);

  createAuditLog(
    payout_id,
    blocker_user_id,
    blocker_role,
    'payout_blocked',
    'success',
    block_reason,
    payout.payout_status,
    'blocked',
    ipAddress
  );

  notifyObservers();

  return { success: true, payout: blockedPayout };
}

// ============================================================
// PAYOUT ATTEMPT (ALWAYS BLOCKED)
// ============================================================

export interface AttemptPayoutResult {
  success: false;
  error: string;
}

export function attemptPayoutExecution(
  payoutId: string,
  actorUserId: string,
  actorRole: CommissionAccessRole,
  ipAddress?: string
): AttemptPayoutResult {
  // Log the attempt
  createAuditLog(
    payoutId,
    actorUserId,
    actorRole,
    'payout_attempted',
    'blocked',
    'Payout execution is DISABLED at this stage. This is a readiness framework only.',
    null,
    null,
    ipAddress,
    { execution_rules: PAYOUT_EXECUTION_RULES }
  );

  // ALWAYS return blocked
  return {
    success: false,
    error: 'Payout execution is DISABLED. This is a readiness framework only. NO money movement, NO payment execution, NO bank transfers, NO invoices.',
  };
}

// ============================================================
// PAYOUT RETRIEVAL (ACCESS CONTROLLED)
// ============================================================

export function getPayout(
  payoutId: string,
  actorRole: CommissionAccessRole
): { success: boolean; payout?: PayoutReadinessRecord; error?: string } {
  if (!canViewPayouts(actorRole)) {
    return {
      success: false,
      error: `Role '${actorRole}' is not authorized to view payouts`,
    };
  }

  const payout = state.payouts.get(payoutId);
  if (!payout) {
    return { success: false, error: 'Payout not found' };
  }

  return { success: true, payout };
}

export function getAllPayouts(
  actorRole: CommissionAccessRole
): { success: boolean; payouts?: PayoutReadinessRecord[]; error?: string } {
  if (!canViewPayouts(actorRole)) {
    return {
      success: false,
      error: `Role '${actorRole}' is not authorized to view payouts`,
    };
  }

  return { success: true, payouts: Array.from(state.payouts.values()) };
}

export function getPayoutsForPartner(
  partnerId: string,
  actorRole: CommissionAccessRole
): { success: boolean; payouts?: PayoutReadinessRecord[]; error?: string } {
  if (!canViewPayouts(actorRole)) {
    return {
      success: false,
      error: `Role '${actorRole}' is not authorized to view payouts`,
    };
  }

  const payouts = Array.from(state.payouts.values()).filter(
    (p) => p.partner_id === partnerId
  );

  return { success: true, payouts };
}

// ============================================================
// AUDIT LOG RETRIEVAL (ACCESS CONTROLLED)
// ============================================================

export function getPayoutAuditLog(
  payoutId: string,
  actorRole: CommissionAccessRole
): { success: boolean; logs?: PayoutAuditLogEntry[]; error?: string } {
  if (!canViewPayouts(actorRole)) {
    return {
      success: false,
      error: `Role '${actorRole}' is not authorized to view payout audit logs`,
    };
  }

  const logs = state.auditLogs.get(payoutId);
  return { success: true, logs: logs || [] };
}

export function getAllPayoutAuditLogs(
  actorRole: CommissionAccessRole
): { success: boolean; logs?: PayoutAuditLogEntry[]; error?: string } {
  if (!canViewPayouts(actorRole)) {
    return {
      success: false,
      error: `Role '${actorRole}' is not authorized to view payout audit logs`,
    };
  }

  const allLogs: PayoutAuditLogEntry[] = [];
  state.auditLogs.forEach((logs) => allLogs.push(...logs));

  // Sort by timestamp descending
  allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return { success: true, logs: allLogs };
}

// ============================================================
// SERVICE STATUS
// ============================================================

export function getPayoutServiceStatus() {
  return {
    priority: 'P5-PART3',
    status: 'IMPLEMENTED',
    payout_execution: PAYOUT_EXECUTION_RULES.EXECUTION_BLOCKED.status,
    payment_gateways: PAYOUT_EXECUTION_RULES.EXECUTION_BLOCKED.payment_gateways,
    bank_transfers: PAYOUT_EXECUTION_RULES.EXECUTION_BLOCKED.bank_transfers,
    invoices: PAYOUT_EXECUTION_RULES.EXECUTION_BLOCKED.invoices,
    exports: PAYOUT_EXECUTION_RULES.EXECUTION_BLOCKED.exports,
    ui_exposure: PAYOUT_EXECUTION_RULES.FRAMEWORK_MODE.ui_exposure,
    partner_visibility: PAYOUT_EXECUTION_RULES.FRAMEWORK_MODE.partner_visibility,
    approval_authority: 'OWNER_FOUNDER_ONLY',
    safeguards_active: Object.keys(SETTLEMENT_SAFEGUARDS).length,
    brand_compliance: {
      brand_name: 'JBJ GLOBAL REAL ESTATE',
      core_activities: 'BUY · SELL · RENT',
    },
    payouts_count: state.payouts.size,
    audit_logs_count: Array.from(state.auditLogs.values()).reduce((sum, logs) => sum + logs.length, 0),
  };
}
