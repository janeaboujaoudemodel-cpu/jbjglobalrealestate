/**
 * PAYOUT SAFEGUARDS CONFIGURATION
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Settlement safeguards and approval authority rules.
 * This is GOVERNANCE + READINESS ONLY - NO actual payments.
 */

import type { PayoutBlockReason } from '@/types/payout-readiness';
import type { CommissionAccessRole } from '@/config/revenue-ownership';

// ============================================================
// PAYOUT APPROVAL AUTHORITY (LOCKED - NON-NEGOTIABLE)
// ============================================================

export const PAYOUT_APPROVAL_AUTHORITY = {
  /**
   * RULE 1: Only Owner/Founder can approve or block payouts
   */
  SOLE_AUTHORITY: {
    authorized_roles: ['owner_founder'] as CommissionAccessRole[],
    rule: 'Owner/Founder has sole authority to approve or block payouts',
    enforcement: 'SYSTEM_LEVEL',
  },

  /**
   * RULE 2: Cannot approve own actions if conflicted
   */
  NO_SELF_APPROVAL: {
    rule: 'Cannot approve own actions if conflicted',
    enforcement: 'VALIDATION_LEVEL',
    self_approval_blocked: true,
  },

  /**
   * RULE 3: Executive has read-only visibility
   */
  EXECUTIVE_READ_ONLY: {
    role: 'executive' as CommissionAccessRole,
    can_view: true,
    can_approve: false,
    can_block: false,
    rule: 'Executive has read-only visibility, NO approval rights',
  },

  /**
   * RULE 4: Approval is immutable once granted
   */
  IMMUTABLE_APPROVAL: {
    rule: 'Approval is immutable once granted',
    can_revoke: false,
    enforcement: 'SYSTEM_LEVEL',
  },

  /**
   * RULE 5: Blocked payouts MUST include reason
   */
  MANDATORY_BLOCK_REASON: {
    rule: 'Any blocked payout MUST include a mandatory reason',
    reason_required: true,
    enforcement: 'VALIDATION_LEVEL',
  },
} as const;

// ============================================================
// PAYOUT VISIBILITY BY ROLE
// ============================================================

export const PAYOUT_VISIBILITY_BY_ROLE: Record<CommissionAccessRole, {
  view_payouts: boolean;
  view_totals: boolean;
  view_partner_details: boolean;
  approve_payouts: boolean;
  block_payouts: boolean;
}> = {
  owner_founder: {
    view_payouts: true,
    view_totals: true,
    view_partner_details: true,
    approve_payouts: true,
    block_payouts: true,
  },
  executive: {
    view_payouts: true,
    view_totals: true,
    view_partner_details: true,
    approve_payouts: false,
    block_payouts: false,
  },
  partner: {
    view_payouts: false,
    view_totals: false,
    view_partner_details: false,
    approve_payouts: false,
    block_payouts: false,
  },
  internal_staff: {
    view_payouts: false,
    view_totals: false,
    view_partner_details: false,
    approve_payouts: false,
    block_payouts: false,
  },
};

// ============================================================
// SETTLEMENT SAFEGUARDS (NON-NEGOTIABLE)
// ============================================================

export const SETTLEMENT_SAFEGUARDS = {
  /**
   * SAFEGUARD 1: Deal must be Closed
   */
  REQUIRE_CLOSED_DEAL: {
    id: 'DEAL_NOT_CLOSED' as PayoutBlockReason,
    rule: 'Deal status must be "Closed"',
    enforcement: 'AUTOMATIC_BLOCK',
    exception_allowed: false,
    manual_override: false,
  },

  /**
   * SAFEGUARD 2: Commission record must be valid
   */
  REQUIRE_VALID_COMMISSION: {
    id: 'COMMISSION_INVALID' as PayoutBlockReason,
    rule: 'Commission record must be valid and present',
    enforcement: 'AUTOMATIC_BLOCK',
    exception_allowed: false,
    manual_override: false,
  },

  /**
   * SAFEGUARD 3: Partner must be Active
   */
  REQUIRE_ACTIVE_PARTNER: {
    id: 'PARTNER_NOT_ACTIVE' as PayoutBlockReason,
    rule: 'Partner status must be "Active"',
    enforcement: 'AUTOMATIC_BLOCK',
    exception_allowed: false,
    manual_override: false,
  },

  /**
   * SAFEGUARD 4: Jurisdiction must be approved
   */
  REQUIRE_APPROVED_JURISDICTION: {
    id: 'JURISDICTION_NOT_APPROVED' as PayoutBlockReason,
    rule: 'Jurisdiction must be approved for execution',
    enforcement: 'AUTOMATIC_BLOCK',
    exception_allowed: false,
    manual_override: false,
  },

  /**
   * SAFEGUARD 5: Model C is NEVER eligible
   */
  MODEL_C_EXCLUDED: {
    id: 'MODEL_C_NOT_ALLOWED' as PayoutBlockReason,
    rule: 'Execution model C is NEVER eligible for payout',
    enforcement: 'AUTOMATIC_BLOCK',
    exception_allowed: false,
    manual_override: false,
  },

  /**
   * SAFEGUARD 6: Data partner requires execution rights
   */
  DATA_PARTNER_RIGHTS: {
    id: 'DATA_PARTNER_NO_EXECUTION_RIGHTS' as PayoutBlockReason,
    rule: 'Data partner must have explicit execution rights for payout',
    enforcement: 'AUTOMATIC_BLOCK',
    exception_allowed: false,
    manual_override: false,
  },
} as const;

// ============================================================
// COMMERCIAL SEPARATION RULES (CLIENT PROTECTION)
// ============================================================

export const COMMERCIAL_SEPARATION_RULES = {
  /**
   * RULE: Partners NEVER see financial details
   */
  PARTNER_FINANCIAL_VISIBILITY: {
    view_total_deal_value: false,
    view_platform_margin: false,
    view_other_partner_commissions: false,
    view_client_lifetime_value: false,
    rule: 'Partners have ZERO visibility into financial details',
    enforcement: 'SYSTEM_LEVEL',
  },

  /**
   * RULE: Compensation only through approved settlements
   */
  COMPENSATION_METHOD: {
    allowed_methods: ['approved_settlement_records', 'internal_accounting'],
    direct_revenue_allowed: false,
    rule: 'Partners compensated ONLY through approved settlement records',
  },

  /**
   * RULE: Client ownership remains with JBJ GLOBAL REAL ESTATE
   */
  CLIENT_OWNERSHIP: {
    owner: 'JBJ GLOBAL REAL ESTATE',
    ownership_percentage: 100,
    transferable: false,
    rule: 'Client ownership remains 100% with JBJ GLOBAL REAL ESTATE',
    enforcement: 'SYSTEM_LEVEL',
  },
} as const;

// ============================================================
// PAYOUT EXECUTION RULES (BLOCKED AT THIS STAGE)
// ============================================================

export const PAYOUT_EXECUTION_RULES = {
  /**
   * CRITICAL: All payout attempts are blocked
   */
  EXECUTION_BLOCKED: {
    enabled: false,
    status: 'DISABLED',
    rule: 'NO payout execution at this stage',
    payment_gateways: 'DISABLED',
    bank_transfers: 'DISABLED',
    invoices: 'DISABLED',
    exports: 'DISABLED',
  },

  /**
   * SAFETY: Internal framework only
   */
  FRAMEWORK_MODE: {
    mode: 'INTERNAL_READINESS_ONLY',
    ui_exposure: false,
    partner_visibility: false,
    external_integrations: false,
  },
} as const;

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Check if role can view payouts
 */
export function canViewPayouts(role: CommissionAccessRole): boolean {
  return PAYOUT_VISIBILITY_BY_ROLE[role].view_payouts;
}

/**
 * Check if role can approve payouts
 */
export function canApprovePayouts(role: CommissionAccessRole): boolean {
  return PAYOUT_VISIBILITY_BY_ROLE[role].approve_payouts;
}

/**
 * Check if role can block payouts
 */
export function canBlockPayouts(role: CommissionAccessRole): boolean {
  return PAYOUT_VISIBILITY_BY_ROLE[role].block_payouts;
}

/**
 * Validate partner has no payout visibility
 */
export function validatePartnerNoPayoutVisibility(): boolean {
  return PAYOUT_VISIBILITY_BY_ROLE.partner.view_payouts === false;
}

/**
 * Validate all payout execution is blocked
 */
export function validatePayoutExecutionBlocked(): boolean {
  return PAYOUT_EXECUTION_RULES.EXECUTION_BLOCKED.enabled === false;
}

/**
 * Get all safeguard IDs
 */
export function getAllSafeguardIds(): PayoutBlockReason[] {
  return Object.values(SETTLEMENT_SAFEGUARDS).map((safeguard) => safeguard.id);
}

// ============================================================
// STATUS EXPORT
// ============================================================

export const PAYOUT_SAFEGUARDS_STATUS = {
  priority: 'P5-PART3',
  status: 'IMPLEMENTED',
  payout_execution: 'BLOCKED',
  approval_authority: 'OWNER_FOUNDER_ONLY',
  partner_visibility: 'NONE',
  safeguards_enforced: true,
  commercial_separation: 'ENFORCED',
  brand_compliance: {
    brand_name: 'JBJ GLOBAL REAL ESTATE',
    core_activities: 'BUY · SELL · RENT',
  },
} as const;
