/**
 * PARTNER GOVERNANCE RULES
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Non-negotiable governance rules for all partner relationships.
 * These rules are enforced at the system level.
 */

import type { PartnerType } from '@/config/partner-types';
import type { PartnerStatus } from '@/types/partner-profile';

// ============================================================
// CORE GOVERNANCE RULES (NON-NEGOTIABLE)
// ============================================================

export const PARTNER_GOVERNANCE_RULES = {
  /**
   * RULE 1: JBJ GLOBAL REAL ESTATE ALWAYS owns the client
   * Partners NEVER own clients under any circumstances
   */
  CLIENT_OWNERSHIP: {
    rule: 'JBJ GLOBAL REAL ESTATE ALWAYS owns the client',
    enforcement: 'SYSTEM_LEVEL',
    client_ownership_allowed: false,
    exceptions: 'NONE',
  },

  /**
   * RULE 2: Partners NEVER appear as contracting party
   * Unless legally required in specific jurisdictions
   */
  CONTRACTING_PARTY: {
    rule: 'Partners NEVER appear as the contracting party unless legally required',
    enforcement: 'CONTRACT_LEVEL',
    default_contracting_party: 'JBJ GLOBAL REAL ESTATE',
    exceptions_require: 'LEGAL_REVIEW_AND_FOUNDER_APPROVAL',
  },

  /**
   * RULE 3: Partners execute ONLY within licensed scope
   */
  LICENSED_SCOPE: {
    rule: 'Partners may execute ONLY within their licensed scope',
    enforcement: 'SYSTEM_LEVEL',
    scope_validation: 'MANDATORY',
    out_of_scope_action: 'BLOCK_AND_ALERT',
  },

  /**
   * RULE 4: No client reuse outside platform
   */
  CLIENT_REUSE: {
    rule: 'Partners may NOT reuse JBJ clients outside the platform',
    enforcement: 'CONTRACT_LEVEL',
    violation_consequence: 'IMMEDIATE_TERMINATION',
    monitoring: 'ACTIVE',
  },

  /**
   * RULE 5: No unauthorized alterations
   */
  DATA_INTEGRITY: {
    rule: 'Partners may NOT alter listings, pricing, or data representation without approval',
    enforcement: 'SYSTEM_LEVEL',
    approval_required_for: ['listings', 'pricing', 'data_representation'],
    unauthorized_change_action: 'REVERT_AND_ALERT',
  },

  /**
   * RULE 6: Instant revocation capability
   */
  ACCESS_REVOCATION: {
    rule: 'Partner access can be revoked instantly',
    enforcement: 'SYSTEM_LEVEL',
    revocation_latency: 'IMMEDIATE',
    revocation_authority: ['owner_founder', 'executive'],
  },
} as const;

// ============================================================
// PARTNER ACCESS RESTRICTIONS
// ============================================================

export const PARTNER_ACCESS_RESTRICTIONS = {
  /**
   * Partners have NO access to ANY data rooms
   */
  data_rooms: {
    corporate: false,
    financial_performance: false,
    market_intelligence: false,
    expansion_risk: false,
  },

  /**
   * Partners have NO access to decision intelligence
   */
  decision_intelligence: false,

  /**
   * Partners have NO access to financial data
   */
  financial_data: false,

  /**
   * Partners have NO access to expansion/risk data
   */
  expansion_risk_data: false,

  /**
   * Partners have NO access to internal analytics
   */
  internal_analytics: false,

  /**
   * Partners have NO access to other partner data
   */
  other_partner_data: false,

  /**
   * What partners CAN access (limited)
   */
  allowed_access: {
    own_profile: true,
    own_performance_metrics: true,
    assigned_client_basic_info: true, // Only info needed for service delivery
    public_listings: true,
  },
} as const;

// ============================================================
// ROLE-BASED ACCESS TO PARTNER DATA
// ============================================================

export type PartnerAccessRole = 'owner_founder' | 'executive' | 'partner';

export const PARTNER_DATA_ACCESS_BY_ROLE: Record<PartnerAccessRole, {
  view_partners: boolean;
  edit_partners: boolean;
  create_partners: boolean;
  terminate_partners: boolean;
  view_governance_notes: boolean;
  full_control: boolean;
}> = {
  owner_founder: {
    view_partners: true,
    edit_partners: true,
    create_partners: true,
    terminate_partners: true,
    view_governance_notes: true,
    full_control: true,
  },
  executive: {
    view_partners: true,
    edit_partners: false,
    create_partners: false,
    terminate_partners: false,
    view_governance_notes: false,
    full_control: false,
  },
  partner: {
    view_partners: false, // Can only see own profile
    edit_partners: false,
    create_partners: false,
    terminate_partners: false,
    view_governance_notes: false,
    full_control: false,
  },
};

// ============================================================
// PARTNER STATUS TRANSITIONS
// ============================================================

export const ALLOWED_STATUS_TRANSITIONS: Record<PartnerStatus, PartnerStatus[]> = {
  pending: ['active', 'terminated'],
  active: ['suspended', 'terminated'],
  suspended: ['active', 'terminated'],
  terminated: [], // Terminal state - no transitions allowed
};

/**
 * Check if a status transition is allowed
 */
export function isStatusTransitionAllowed(
  currentStatus: PartnerStatus,
  newStatus: PartnerStatus
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}

// ============================================================
// GOVERNANCE VALIDATION FUNCTIONS
// ============================================================

/**
 * Validate that client ownership is NEVER granted to partners
 */
export function validateNoClientOwnership(clientOwnership: boolean): boolean {
  return clientOwnership === false;
}

/**
 * Validate that partners have no data room access
 */
export function validateNoDataRoomAccess(): boolean {
  const restrictions = PARTNER_ACCESS_RESTRICTIONS;
  return (
    restrictions.data_rooms.corporate === false &&
    restrictions.data_rooms.financial_performance === false &&
    restrictions.data_rooms.market_intelligence === false &&
    restrictions.data_rooms.expansion_risk === false
  );
}

/**
 * Validate that partners have no decision intelligence access
 */
export function validateNoDecisionIntelligenceAccess(): boolean {
  return PARTNER_ACCESS_RESTRICTIONS.decision_intelligence === false;
}

/**
 * Validate execution partner applies only to Model B
 */
export function validateExecutionPartnerModelB(
  partnerType: PartnerType,
  executionModel: string
): boolean {
  if (partnerType === 'execution') {
    return executionModel === 'B';
  }
  return true;
}

/**
 * Check if a role can manage partners
 */
export function canManagePartners(role: PartnerAccessRole): boolean {
  return PARTNER_DATA_ACCESS_BY_ROLE[role].full_control;
}

/**
 * Check if a role can view partner governance notes
 */
export function canViewGovernanceNotes(role: PartnerAccessRole): boolean {
  return PARTNER_DATA_ACCESS_BY_ROLE[role].view_governance_notes;
}

// ============================================================
// COMPLIANCE DISCLAIMERS
// ============================================================

export const PARTNER_COMPLIANCE_DISCLAIMERS = {
  SERVICE_PARTNER: 'JBJ GLOBAL REAL ESTATE facilitates introductions to licensed partners for this service. Clients contract directly with the service provider.',
  EXECUTION_PARTNER: 'Transaction executed by [PARTNER_NAME] on behalf of JBJ GLOBAL REAL ESTATE under license [LICENSE_NUMBER].',
  DATA_PARTNER: 'Data provided by [PARTNER_NAME]. JBJ GLOBAL REAL ESTATE does not guarantee accuracy of third-party data.',
  GENERAL: 'JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT',
} as const;

// ============================================================
// GOVERNANCE STATUS
// ============================================================

export const PARTNER_GOVERNANCE_STATUS = {
  priority: 'P5-PART1',
  status: 'IMPLEMENTED',
  rules_count: Object.keys(PARTNER_GOVERNANCE_RULES).length,
  validations: {
    no_client_ownership: validateNoClientOwnership(false),
    no_data_room_access: validateNoDataRoomAccess(),
    no_decision_intelligence: validateNoDecisionIntelligenceAccess(),
  },
  access_control: {
    owner_founder: 'FULL_CONTROL',
    executive: 'READ_ONLY',
    partner: 'OWN_PROFILE_ONLY',
  },
  brand_compliance: {
    brand_name: 'JBJ GLOBAL REAL ESTATE',
    core_activities: 'BUY · SELL · RENT',
  },
} as const;
