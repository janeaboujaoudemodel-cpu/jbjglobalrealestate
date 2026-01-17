/**
 * PARTNER ONBOARDING SERVICE
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Service for managing partner onboarding and lifecycle.
 * Enforces all governance rules at the system level.
 */

import {
  type PartnerType,
  type ServicePartnerType,
  PARTNER_TYPE_DEFINITIONS,
  isValidPartnerType,
  isValidServicePartnerType,
} from '@/config/partner-types';
import {
  type PartnerProfile,
  type PartnerStatus,
  type PartnerOnboardingRequest,
  type PartnerReviewRecord,
  type PartnerAuditLogEntry,
  PARTNER_STATUSES,
} from '@/types/partner-profile';
import {
  type PartnerAccessRole,
  PARTNER_GOVERNANCE_RULES,
  PARTNER_ACCESS_RESTRICTIONS,
  PARTNER_DATA_ACCESS_BY_ROLE,
  isStatusTransitionAllowed,
  validateNoClientOwnership,
  canManagePartners,
} from '@/config/partner-governance';

// ============================================================
// SERVICE STATE
// ============================================================

interface PartnerServiceState {
  partners: Map<string, PartnerProfile>;
  reviews: Map<string, PartnerReviewRecord[]>;
  auditLogs: Map<string, PartnerAuditLogEntry[]>;
}

let state: PartnerServiceState = {
  partners: new Map(),
  reviews: new Map(),
  auditLogs: new Map(),
};

// ============================================================
// STATE OBSERVERS
// ============================================================

type StateObserver = (state: PartnerServiceState) => void;
const observers: Set<StateObserver> = new Set();

function notifyObservers() {
  observers.forEach((observer) => observer(state));
}

export function subscribeToPartnerState(observer: StateObserver): () => void {
  observers.add(observer);
  return () => observers.delete(observer);
}

// ============================================================
// ID GENERATION
// ============================================================

function generatePartnerId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `PTR-${timestamp}-${random}`.toUpperCase();
}

function generateLogId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `LOG-${timestamp}-${random}`.toUpperCase();
}

function generateReviewId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `REV-${timestamp}-${random}`.toUpperCase();
}

// ============================================================
// PARTNER CREATION
// ============================================================

export interface CreatePartnerResult {
  success: boolean;
  partner?: PartnerProfile;
  error?: string;
}

/**
 * Create a new partner (onboarding)
 */
export function createPartner(
  request: PartnerOnboardingRequest,
  actorUserId: string,
  actorRole: PartnerAccessRole
): CreatePartnerResult {
  // Validate actor has permission
  if (!canManagePartners(actorRole)) {
    return {
      success: false,
      error: `Role '${actorRole}' is not authorized to create partners. Only OWNER/FOUNDER can onboard partners.`,
    };
  }

  // Validate partner type
  if (!isValidPartnerType(request.partner_type)) {
    return {
      success: false,
      error: `Invalid partner type: ${request.partner_type}. Allowed types: execution, data, service`,
    };
  }

  // Validate service type if service partner
  if (request.partner_type === 'service' && request.service_type) {
    if (!isValidServicePartnerType(request.service_type)) {
      return {
        success: false,
        error: `Invalid service type: ${request.service_type}. Allowed: mortgage, legal, visa, corporate_services`,
      };
    }
  }

  // Get partner type definition
  const typeDefinition = PARTNER_TYPE_DEFINITIONS[request.partner_type];

  // Validate license required
  if (typeDefinition.license_required && !request.license_details) {
    return {
      success: false,
      error: `Partner type '${request.partner_type}' requires license details`,
    };
  }

  const now = new Date().toISOString();
  const partner_id = generatePartnerId();

  // Create partner profile
  const partner: PartnerProfile = {
    partner_id,
    partner_name: request.partner_name,
    partner_type: request.partner_type,
    service_type: request.service_type,
    jurisdiction_id: request.jurisdiction_id,
    license_details: request.license_details
      ? {
          ...request.license_details,
          is_valid: false, // Pending verification
          verification_status: 'pending',
        }
      : null,
    regulatory_scope: request.regulatory_scope,
    execution_rights: typeDefinition.execution_rights,
    data_rights: typeDefinition.data_rights,
    client_ownership: false, // ALWAYS FALSE - enforced
    status: 'pending',
    onboarding_date: now,
    last_review_date: now,
    governance_notes: request.governance_notes || '',
    contact: request.contact,
    created_at: now,
    updated_at: now,
    created_by: actorUserId,
    updated_by: actorUserId,
  };

  // Validate client ownership is false (governance rule enforcement)
  if (!validateNoClientOwnership(partner.client_ownership)) {
    return {
      success: false,
      error: 'GOVERNANCE VIOLATION: Client ownership must ALWAYS be false',
    };
  }

  // Store partner
  state.partners.set(partner_id, partner);

  // Create audit log
  const auditEntry: PartnerAuditLogEntry = {
    log_id: generateLogId(),
    partner_id,
    action: 'created',
    actor_user_id: actorUserId,
    actor_role: actorRole,
    timestamp: now,
    new_values: partner,
  };

  state.auditLogs.set(partner_id, [auditEntry]);

  notifyObservers();

  return { success: true, partner };
}

// ============================================================
// PARTNER STATUS MANAGEMENT
// ============================================================

export interface UpdateStatusResult {
  success: boolean;
  partner?: PartnerProfile;
  error?: string;
}

/**
 * Update partner status
 */
export function updatePartnerStatus(
  partnerId: string,
  newStatus: PartnerStatus,
  reason: string,
  actorUserId: string,
  actorRole: PartnerAccessRole
): UpdateStatusResult {
  // Validate actor has permission
  if (!canManagePartners(actorRole)) {
    return {
      success: false,
      error: `Role '${actorRole}' is not authorized to update partner status`,
    };
  }

  // Get partner
  const partner = state.partners.get(partnerId);
  if (!partner) {
    return { success: false, error: 'Partner not found' };
  }

  // Validate status transition
  if (!isStatusTransitionAllowed(partner.status, newStatus)) {
    return {
      success: false,
      error: `Status transition from '${partner.status}' to '${newStatus}' is not allowed`,
    };
  }

  const now = new Date().toISOString();
  const previousStatus = partner.status;

  // Update partner
  const updatedPartner: PartnerProfile = {
    ...partner,
    status: newStatus,
    updated_at: now,
    updated_by: actorUserId,
  };

  state.partners.set(partnerId, updatedPartner);

  // Create audit log
  const auditEntry: PartnerAuditLogEntry = {
    log_id: generateLogId(),
    partner_id: partnerId,
    action: 'status_changed',
    actor_user_id: actorUserId,
    actor_role: actorRole,
    timestamp: now,
    previous_values: { status: previousStatus },
    new_values: { status: newStatus },
    reason,
  };

  const logs = state.auditLogs.get(partnerId) || [];
  logs.push(auditEntry);
  state.auditLogs.set(partnerId, logs);

  notifyObservers();

  return { success: true, partner: updatedPartner };
}

/**
 * Suspend a partner (instant revocation of access)
 */
export function suspendPartner(
  partnerId: string,
  reason: string,
  actorUserId: string,
  actorRole: PartnerAccessRole
): UpdateStatusResult {
  return updatePartnerStatus(partnerId, 'suspended', reason, actorUserId, actorRole);
}

/**
 * Terminate a partner (permanent)
 */
export function terminatePartner(
  partnerId: string,
  reason: string,
  actorUserId: string,
  actorRole: PartnerAccessRole
): UpdateStatusResult {
  return updatePartnerStatus(partnerId, 'terminated', reason, actorUserId, actorRole);
}

/**
 * Activate a partner
 */
export function activatePartner(
  partnerId: string,
  actorUserId: string,
  actorRole: PartnerAccessRole
): UpdateStatusResult {
  return updatePartnerStatus(
    partnerId,
    'active',
    'Partner onboarding completed and approved',
    actorUserId,
    actorRole
  );
}

// ============================================================
// PARTNER RETRIEVAL
// ============================================================

/**
 * Get partner by ID
 */
export function getPartner(
  partnerId: string,
  actorRole: PartnerAccessRole
): { success: boolean; partner?: PartnerProfile; error?: string } {
  const access = PARTNER_DATA_ACCESS_BY_ROLE[actorRole];

  if (!access.view_partners && actorRole !== 'partner') {
    return { success: false, error: 'Not authorized to view partners' };
  }

  const partner = state.partners.get(partnerId);

  if (!partner) {
    return { success: false, error: 'Partner not found' };
  }

  // If partner role, only return if it's their own profile
  // (would need partner user mapping in real implementation)

  // Remove governance notes if role doesn't have access
  if (!access.view_governance_notes) {
    return {
      success: true,
      partner: { ...partner, governance_notes: '[RESTRICTED]' },
    };
  }

  return { success: true, partner };
}

/**
 * Get all partners (for authorized roles)
 */
export function getAllPartners(
  actorRole: PartnerAccessRole
): { success: boolean; partners: PartnerProfile[]; error?: string } {
  const access = PARTNER_DATA_ACCESS_BY_ROLE[actorRole];

  if (!access.view_partners) {
    return { success: false, partners: [], error: 'Not authorized to view partners' };
  }

  const partners = Array.from(state.partners.values());

  // Remove governance notes if role doesn't have access
  if (!access.view_governance_notes) {
    return {
      success: true,
      partners: partners.map((p) => ({ ...p, governance_notes: '[RESTRICTED]' })),
    };
  }

  return { success: true, partners };
}

/**
 * Get partners by type
 */
export function getPartnersByType(
  partnerType: PartnerType,
  actorRole: PartnerAccessRole
): { success: boolean; partners: PartnerProfile[]; error?: string } {
  const result = getAllPartners(actorRole);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    partners: result.partners.filter((p) => p.partner_type === partnerType),
  };
}

/**
 * Get partner audit log
 */
export function getPartnerAuditLog(
  partnerId: string,
  actorRole: PartnerAccessRole
): { success: boolean; logs?: PartnerAuditLogEntry[]; error?: string } {
  if (!canManagePartners(actorRole)) {
    return { success: false, error: 'Only OWNER/FOUNDER can view audit logs' };
  }

  const logs = state.auditLogs.get(partnerId);

  if (!logs) {
    return { success: false, error: 'Partner not found' };
  }

  return { success: true, logs };
}

// ============================================================
// SERVICE STATUS
// ============================================================

export function getPartnerServiceStatus(): {
  total_partners: number;
  by_status: Record<PartnerStatus, number>;
  by_type: Record<PartnerType, number>;
  governance_rules: typeof PARTNER_GOVERNANCE_RULES;
  access_restrictions: typeof PARTNER_ACCESS_RESTRICTIONS;
} {
  const partners = Array.from(state.partners.values());

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};

  PARTNER_STATUSES.forEach((s) => (byStatus[s] = 0));

  partners.forEach((p) => {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    byType[p.partner_type] = (byType[p.partner_type] || 0) + 1;
  });

  return {
    total_partners: partners.length,
    by_status: byStatus as Record<PartnerStatus, number>,
    by_type: byType as Record<PartnerType, number>,
    governance_rules: PARTNER_GOVERNANCE_RULES,
    access_restrictions: PARTNER_ACCESS_RESTRICTIONS,
  };
}

/**
 * Reset service state (for testing)
 */
export function resetPartnerServiceState(): void {
  state = {
    partners: new Map(),
    reviews: new Map(),
    auditLogs: new Map(),
  };
  notifyObservers();
}
