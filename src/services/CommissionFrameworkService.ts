/**
 * COMMISSION FRAMEWORK SERVICE
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Service for managing commission configurations and calculations.
 * Enforces all revenue ownership rules and safeguards.
 */

import type { PartnerType } from '@/config/partner-types';
import type { PartnerStatus } from '@/types/partner-profile';
import {
  type OriginatingChannel,
  type ExecutionModel,
  type DealStatus,
  type DealConversionRecord,
  type CommissionBasis,
  type CommissionAppliesTo,
  type CommissionConfigStatus,
  type PartnerCommissionConfig,
  type CommissionRecord,
  type CommissionAuditLog,
  EXECUTION_MODEL_DESCRIPTIONS,
} from '@/types/revenue-attribution';
import {
  type CommissionAccessRole,
  COMMISSION_ELIGIBILITY_BY_MODEL,
  COMMISSION_SAFEGUARDS,
  canViewCommissions,
  canConfigureCommissions,
  isModelEligibleForCommission,
} from '@/config/revenue-ownership';

// ============================================================
// SERVICE STATE
// ============================================================

interface CommissionServiceState {
  deals: Map<string, DealConversionRecord>;
  configs: Map<string, PartnerCommissionConfig>;
  commissions: Map<string, CommissionRecord>;
  auditLogs: Map<string, CommissionAuditLog[]>;
  partnerStatuses: Map<string, PartnerStatus>; // For validation
}

let state: CommissionServiceState = {
  deals: new Map(),
  configs: new Map(),
  commissions: new Map(),
  auditLogs: new Map(),
  partnerStatuses: new Map(),
};

// ============================================================
// STATE OBSERVERS
// ============================================================

type StateObserver = (state: CommissionServiceState) => void;
const observers: Set<StateObserver> = new Set();

function notifyObservers() {
  observers.forEach((observer) => observer(state));
}

export function subscribeToCommissionState(observer: StateObserver): () => void {
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
// DEAL CONVERSION MANAGEMENT
// ============================================================

export interface CreateDealResult {
  success: boolean;
  deal?: DealConversionRecord;
  error?: string;
}

/**
 * Create a new deal conversion record
 */
export function createDealConversion(params: {
  originating_channel: OriginatingChannel;
  originating_partner_id: string | null;
  jurisdiction_id: string;
  execution_model: ExecutionModel;
  executing_partner_id: string | null;
  assigned_broker_id: string;
  client_id: string;
  deal_value: number;
  currency: string;
}): CreateDealResult {
  // Validate execution model
  if (params.execution_model === 'B' && !params.executing_partner_id) {
    return {
      success: false,
      error: 'Execution Model B requires an executing partner',
    };
  }

  const now = new Date().toISOString();
  const deal_id = generateId('DEAL');

  const deal: DealConversionRecord = {
    deal_id,
    originating_channel: params.originating_channel,
    originating_partner_id: params.originating_partner_id,
    jurisdiction_id: params.jurisdiction_id,
    execution_model: params.execution_model,
    executing_partner_id: params.executing_partner_id,
    assigned_broker_id: params.assigned_broker_id,
    client_id: params.client_id,
    conversion_timestamp: now,
    status: 'pending',
    deal_value: params.deal_value,
    currency: params.currency,
    attribution_locked: false,
    attribution_locked_at: null,
    created_at: now,
    updated_at: now,
  };

  state.deals.set(deal_id, deal);
  notifyObservers();

  return { success: true, deal };
}

/**
 * Close a deal and lock attribution
 */
export function closeDeal(
  dealId: string,
  actorUserId: string
): CreateDealResult {
  const deal = state.deals.get(dealId);

  if (!deal) {
    return { success: false, error: 'Deal not found' };
  }

  if (deal.status === 'closed') {
    return { success: false, error: 'Deal is already closed' };
  }

  const now = new Date().toISOString();

  const updatedDeal: DealConversionRecord = {
    ...deal,
    status: 'closed',
    attribution_locked: true,
    attribution_locked_at: now,
    updated_at: now,
  };

  state.deals.set(dealId, updatedDeal);
  notifyObservers();

  return { success: true, deal: updatedDeal };
}

/**
 * Get deal by ID
 */
export function getDeal(dealId: string): DealConversionRecord | undefined {
  return state.deals.get(dealId);
}

// ============================================================
// COMMISSION CONFIGURATION
// ============================================================

export interface CreateConfigResult {
  success: boolean;
  config?: PartnerCommissionConfig;
  error?: string;
}

/**
 * Create commission configuration for a partner
 */
export function createCommissionConfig(
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
  actorUserId: string,
  actorRole: CommissionAccessRole
): CreateConfigResult {
  // Validate actor can configure
  if (!canConfigureCommissions(actorRole)) {
    return {
      success: false,
      error: `Role '${actorRole}' is not authorized to configure commissions`,
    };
  }

  const now = new Date().toISOString();
  const config_id = generateId('CFG');

  const config: PartnerCommissionConfig = {
    config_id,
    partner_id: params.partner_id,
    partner_type: params.partner_type,
    jurisdiction_id: params.jurisdiction_id,
    commission_basis: params.commission_basis,
    commission_rate: params.commission_rate,
    currency: params.currency,
    applies_to: params.applies_to,
    start_date: params.start_date,
    end_date: params.end_date,
    status: 'active',
    created_at: now,
    created_by: actorUserId,
    updated_at: now,
    updated_by: actorUserId,
  };

  state.configs.set(config_id, config);
  notifyObservers();

  return { success: true, config };
}

/**
 * Get active commission config for partner in jurisdiction
 */
export function getActiveCommissionConfig(
  partnerId: string,
  jurisdictionId: string,
  appliesTo: 'origin' | 'execution'
): PartnerCommissionConfig | undefined {
  const now = new Date().toISOString();

  return Array.from(state.configs.values()).find(
    (config) =>
      config.partner_id === partnerId &&
      config.jurisdiction_id === jurisdictionId &&
      config.status === 'active' &&
      (config.applies_to === appliesTo || config.applies_to === 'both') &&
      config.start_date <= now &&
      (config.end_date === null || config.end_date >= now)
  );
}

// ============================================================
// COMMISSION CALCULATION
// ============================================================

export interface CalculateCommissionResult {
  success: boolean;
  commissions?: CommissionRecord[];
  error?: string;
}

/**
 * Calculate and generate commission for a closed deal
 */
export function calculateCommission(
  dealId: string,
  actorUserId: string,
  actorRole: CommissionAccessRole
): CalculateCommissionResult {
  const deal = state.deals.get(dealId);

  // SAFEGUARD 1: No commission without Closed deal
  if (!deal) {
    return { success: false, error: 'Deal not found' };
  }

  if (deal.status !== 'closed') {
    return {
      success: false,
      error: `Commission can only be calculated for Closed deals. Current status: ${deal.status}`,
    };
  }

  // SAFEGUARD 3: No commission for Model C
  if (!isModelEligibleForCommission(deal.execution_model)) {
    return {
      success: false,
      error: `Execution Model ${deal.execution_model} is not eligible for commission. ${EXECUTION_MODEL_DESCRIPTIONS[deal.execution_model].notes}`,
    };
  }

  const commissions: CommissionRecord[] = [];
  const now = new Date().toISOString();
  const eligibility = COMMISSION_ELIGIBILITY_BY_MODEL[deal.execution_model];

  // Calculate origin commission if applicable
  if (eligibility.origin_commission && deal.originating_partner_id) {
    const originConfig = getActiveCommissionConfig(
      deal.originating_partner_id,
      deal.jurisdiction_id,
      'origin'
    );

    // SAFEGUARD 2: No commission without valid partner config
    if (originConfig) {
      const partnerStatus = state.partnerStatuses.get(deal.originating_partner_id);
      
      if (partnerStatus === 'active') {
        const commissionAmount = calculateAmount(
          deal.deal_value,
          originConfig.commission_basis,
          originConfig.commission_rate
        );

        const originCommission: CommissionRecord = {
          commission_id: generateId('COM'),
          deal_id: dealId,
          partner_id: deal.originating_partner_id,
          partner_type: originConfig.partner_type,
          config_id: originConfig.config_id,
          commission_type: 'origin',
          deal_value: deal.deal_value,
          commission_amount: commissionAmount,
          currency: deal.currency,
          commission_basis: originConfig.commission_basis,
          rate_applied: originConfig.commission_rate,
          jurisdiction_id: deal.jurisdiction_id,
          execution_model: deal.execution_model,
          generated_at: now,
          is_locked: true,
          audit_id: generateId('AUD'),
        };

        commissions.push(originCommission);
        state.commissions.set(originCommission.commission_id, originCommission);

        // Create audit log
        createAuditLog(originCommission, actorUserId, actorRole);
      }
    }
  }

  // Calculate execution commission if applicable (Model B only)
  if (eligibility.execution_commission && deal.executing_partner_id) {
    const execConfig = getActiveCommissionConfig(
      deal.executing_partner_id,
      deal.jurisdiction_id,
      'execution'
    );

    if (execConfig) {
      const partnerStatus = state.partnerStatuses.get(deal.executing_partner_id);

      if (partnerStatus === 'active') {
        const commissionAmount = calculateAmount(
          deal.deal_value,
          execConfig.commission_basis,
          execConfig.commission_rate
        );

        const execCommission: CommissionRecord = {
          commission_id: generateId('COM'),
          deal_id: dealId,
          partner_id: deal.executing_partner_id,
          partner_type: execConfig.partner_type,
          config_id: execConfig.config_id,
          commission_type: 'execution',
          deal_value: deal.deal_value,
          commission_amount: commissionAmount,
          currency: deal.currency,
          commission_basis: execConfig.commission_basis,
          rate_applied: execConfig.commission_rate,
          jurisdiction_id: deal.jurisdiction_id,
          execution_model: deal.execution_model,
          generated_at: now,
          is_locked: true,
          audit_id: generateId('AUD'),
        };

        commissions.push(execCommission);
        state.commissions.set(execCommission.commission_id, execCommission);

        // Create audit log
        createAuditLog(execCommission, actorUserId, actorRole);
      }
    }
  }

  notifyObservers();

  return { success: true, commissions };
}

/**
 * Calculate commission amount based on basis
 */
function calculateAmount(
  dealValue: number,
  basis: CommissionBasis,
  rate: number
): number {
  if (basis === 'percentage') {
    return dealValue * rate;
  }
  return rate; // Fixed fee
}

/**
 * Create audit log for commission
 */
function createAuditLog(
  commission: CommissionRecord,
  actorUserId: string,
  actorRole: CommissionAccessRole
): void {
  const auditLog: CommissionAuditLog = {
    audit_id: commission.audit_id,
    commission_id: commission.commission_id,
    deal_id: commission.deal_id,
    action: 'generated',
    actor_user_id: actorUserId,
    actor_role: actorRole,
    timestamp: commission.generated_at,
  };

  const logs = state.auditLogs.get(commission.commission_id) || [];
  logs.push(auditLog);
  state.auditLogs.set(commission.commission_id, logs);
}

// ============================================================
// COMMISSION RETRIEVAL (WITH ACCESS CONTROL)
// ============================================================

/**
 * Get commissions for a deal (access controlled)
 */
export function getCommissionsForDeal(
  dealId: string,
  actorRole: CommissionAccessRole
): { success: boolean; commissions?: CommissionRecord[]; error?: string } {
  if (!canViewCommissions(actorRole)) {
    return {
      success: false,
      error: `Role '${actorRole}' is not authorized to view commissions`,
    };
  }

  const commissions = Array.from(state.commissions.values()).filter(
    (c) => c.deal_id === dealId
  );

  return { success: true, commissions };
}

/**
 * Get all commissions (access controlled)
 */
export function getAllCommissions(
  actorRole: CommissionAccessRole
): { success: boolean; commissions?: CommissionRecord[]; error?: string } {
  if (!canViewCommissions(actorRole)) {
    return {
      success: false,
      error: `Role '${actorRole}' is not authorized to view commissions`,
    };
  }

  return { success: true, commissions: Array.from(state.commissions.values()) };
}

/**
 * Get commission audit log (access controlled)
 */
export function getCommissionAuditLog(
  commissionId: string,
  actorRole: CommissionAccessRole
): { success: boolean; logs?: CommissionAuditLog[]; error?: string } {
  if (!canViewCommissions(actorRole)) {
    return {
      success: false,
      error: `Role '${actorRole}' is not authorized to view commission audit logs`,
    };
  }

  const logs = state.auditLogs.get(commissionId);

  return { success: true, logs: logs || [] };
}

// ============================================================
// PARTNER STATUS MANAGEMENT (FOR VALIDATION)
// ============================================================

/**
 * Update partner status in commission service (for validation)
 */
export function updatePartnerStatusForCommission(
  partnerId: string,
  status: PartnerStatus
): void {
  state.partnerStatuses.set(partnerId, status);
}

// ============================================================
// SERVICE STATUS
// ============================================================

export function getCommissionServiceStatus(): {
  total_deals: number;
  closed_deals: number;
  total_configs: number;
  active_configs: number;
  total_commissions: number;
  commission_by_type: Record<string, number>;
  safeguards: typeof COMMISSION_SAFEGUARDS;
} {
  const deals = Array.from(state.deals.values());
  const configs = Array.from(state.configs.values());
  const commissions = Array.from(state.commissions.values());

  const commissionByType: Record<string, number> = { origin: 0, execution: 0 };
  commissions.forEach((c) => {
    commissionByType[c.commission_type] = (commissionByType[c.commission_type] || 0) + 1;
  });

  return {
    total_deals: deals.length,
    closed_deals: deals.filter((d) => d.status === 'closed').length,
    total_configs: configs.length,
    active_configs: configs.filter((c) => c.status === 'active').length,
    total_commissions: commissions.length,
    commission_by_type: commissionByType,
    safeguards: COMMISSION_SAFEGUARDS,
  };
}

/**
 * Reset service state (for testing)
 */
export function resetCommissionServiceState(): void {
  state = {
    deals: new Map(),
    configs: new Map(),
    commissions: new Map(),
    auditLogs: new Map(),
    partnerStatuses: new Map(),
  };
  notifyObservers();
}
